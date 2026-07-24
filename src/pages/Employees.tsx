import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "../i18n/I18nContext";
import { useDataStore } from "../store/DataStore";
import { useToast } from "../hooks/useToast";
import { useTableData } from "../hooks/useTableData";
import { PageHeader, SearchInput, EmptyState, Pagination, ConfirmDialog } from "../components/ui/Misc";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { FieldGroup, FieldLabel, FieldError, Input, Select } from "../components/ui/Field";
import { StatusBadge } from "../components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD, TableWrap } from "../components/ui/Table";
import { formatCurrency, formatDate } from "../lib/utils";
import type { Employee } from "../types";

const designations = ["baker", "supervisor", "cashier", "manager", "helper", "delivery"] as const;

function useEmployeeSchema() {
  const { t } = useTranslation();
  return z.object({
    name: z.string().min(2, t("validation.tooShort")),
    phone: z.string().min(6, t("validation.invalidPhone")),
    designation: z.enum(designations),
    salary: z.number().positive(t("validation.mustBePositive")),
    joiningDate: z.string().min(1, t("validation.requiredField")),
    status: z.enum(["active", "inactive"]),
  });
}
type EmployeeFormValues = z.infer<ReturnType<typeof useEmployeeSchema>>;

function EmployeeFormDialog({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: Employee | null }) {
  const { t } = useTranslation();
  const { addEmployee, updateEmployee } = useDataStore();
  const { toast } = useToast();
  const schema = useEmployeeSchema();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EmployeeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: editing ?? { name: "", phone: "", designation: "baker", salary: 15000, joiningDate: new Date().toISOString().slice(0, 10), status: "active" },
  });

  const onSubmit = (values: EmployeeFormValues) => {
    if (editing) {
      updateEmployee(editing.id, values);
      toast({ variant: "success", title: t("toast.updatedTitle"), description: t("toast.updatedDesc", { item: values.name }) });
    } else {
      addEmployee(values);
      toast({ variant: "success", title: t("toast.createdTitle"), description: t("toast.createdDesc", { item: values.name }) });
    }
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? t("employees.editEmployee") : t("employees.addEmployee")}
      footer={
        <>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>{t("common.cancel")}</Button>
          <Button onClick={handleSubmit(onSubmit)}>{t("common.save")}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <FieldLabel required>{t("employees.form.name")}</FieldLabel>
          <Input invalid={!!errors.name} {...register("name")} />
          <FieldError>{errors.name?.message}</FieldError>
        </FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup>
            <FieldLabel required>{t("employees.form.phone")}</FieldLabel>
            <Input invalid={!!errors.phone} {...register("phone")} />
            <FieldError>{errors.phone?.message}</FieldError>
          </FieldGroup>
          <FieldGroup>
            <FieldLabel required>{t("employees.form.designation")}</FieldLabel>
            <Select {...register("designation")}>
              {designations.map((d) => (
                <option key={d} value={d}>{t(`employees.designations.${d}`)}</option>
              ))}
            </Select>
          </FieldGroup>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup>
            <FieldLabel required>{t("employees.form.salary")}</FieldLabel>
            <Input type="number" invalid={!!errors.salary} {...register("salary", { valueAsNumber: true })} />
            <FieldError>{errors.salary?.message}</FieldError>
          </FieldGroup>
          <FieldGroup>
            <FieldLabel required>{t("employees.form.joiningDate")}</FieldLabel>
            <Input type="date" invalid={!!errors.joiningDate} {...register("joiningDate")} />
          </FieldGroup>
        </div>
        <FieldGroup className="mb-0">
          <FieldLabel>{t("employees.form.status")}</FieldLabel>
          <Select {...register("status")}>
            <option value="active">{t("common.active")}</option>
            <option value="inactive">{t("common.inactive")}</option>
          </Select>
        </FieldGroup>
      </form>
    </Dialog>
  );
}

export default function Employees() {
  const { t } = useTranslation();
  const { employees, deleteEmployee } = useDataStore();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);
  const [designation, setDesignation] = useState("all");

  const filtered = employees.filter((e) => designation === "all" || e.designation === designation);
  const table = useTableData(filtered, { searchFields: (e) => [e.name, e.phone], pageSize: 8 });

  return (
    <div>
      <PageHeader
        title={t("employees.title")}
        subtitle={t("employees.subtitle")}
        action={<Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus size={16} /> {t("employees.addEmployee")}</Button>}
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2.5 border-b border-line p-4">
          <SearchInput value={table.search} onChange={table.setSearch} placeholder={t("employees.searchPlaceholder")} />
          <Select className="!h-9 w-auto max-w-[180px]" value={designation} onChange={(e) => setDesignation(e.target.value)}>
            <option value="all">{t("common.allCategories")}</option>
            {designations.map((d) => (
              <option key={d} value={d}>{t(`employees.designations.${d}`)}</option>
            ))}
          </Select>
        </div>

        {table.rows.length === 0 ? (
          <EmptyState title={t("common.noResults")} hint={t("common.noResultsHint")} />
        ) : (
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH sortable sortDir={table.sortKey === "name" ? table.sortDir : null} onClick={() => table.toggleSort("name")}>{t("employees.columns.name")}</TH>
                  <TH>{t("employees.columns.phone")}</TH>
                  <TH>{t("employees.columns.designation")}</TH>
                  <TH sortable sortDir={table.sortKey === "salary" ? table.sortDir : null} onClick={() => table.toggleSort("salary")}>{t("employees.columns.salary")}</TH>
                  <TH>{t("employees.columns.joiningDate")}</TH>
                  <TH>{t("employees.columns.status")}</TH>
                  <TH className="text-right">{t("common.actions")}</TH>
                </TR>
              </THead>
              <TBody>
                {table.rows.map((e) => (
                  <TR key={e.id}>
                    <TD className="font-medium">{e.name}</TD>
                    <TD className="num text-muted">{e.phone}</TD>
                    <TD className="text-muted">{t(`employees.designations.${e.designation}`)}</TD>
                    <TD className="num">{formatCurrency(e.salary)}</TD>
                    <TD className="text-muted">{formatDate(e.joiningDate)}</TD>
                    <TD><StatusBadge status={e.status} /></TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(e); setDialogOpen(true); }} aria-label={t("common.edit")}>
                          <Pencil size={15} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(e)} aria-label={t("common.delete")}>
                          <Trash2 size={15} className="text-danger" />
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        )}
        <Pagination page={table.page} totalPages={table.totalPages} onChange={table.setPage} totalItems={table.totalItems} pageSize={table.pageSize} />
      </Card>

      <EmployeeFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} editing={editing} />
      {deleting && (
        <ConfirmDialog
          open={!!deleting}
          onClose={() => setDeleting(null)}
          itemName={deleting.name}
          onConfirm={() => {
            deleteEmployee(deleting.id);
            toast({ variant: "success", title: t("toast.deletedTitle"), description: t("toast.deletedDesc", { item: deleting.name }) });
          }}
        />
      )}
    </div>
  );
}
