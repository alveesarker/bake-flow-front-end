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
import type { Distributor } from "../types";

function useDistributorSchema() {
  const { t } = useTranslation();
  return z.object({
    name: z.string().min(2, t("validation.tooShort")),
    company: z.string().min(2, t("validation.tooShort")),
    phone: z.string().min(6, t("validation.invalidPhone")),
    email: z.string().email(t("validation.invalidEmail")),
    address: z.string().min(2, t("validation.requiredField")),
    status: z.enum(["active", "inactive"]),
  });
}
type DistributorFormValues = z.infer<ReturnType<typeof useDistributorSchema>>;

function DistributorFormDialog({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: Distributor | null }) {
  const { t } = useTranslation();
  const { addDistributor, updateDistributor } = useDataStore();
  const { toast } = useToast();
  const schema = useDistributorSchema();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DistributorFormValues>({
    resolver: zodResolver(schema),
    defaultValues: editing ?? { name: "", company: "", phone: "", email: "", address: "", status: "active" },
  });

  const onSubmit = (values: DistributorFormValues) => {
    if (editing) {
      updateDistributor(editing.id, values);
      toast({ variant: "success", title: t("toast.updatedTitle"), description: t("toast.updatedDesc", { item: values.name }) });
    } else {
      addDistributor(values);
      toast({ variant: "success", title: t("toast.createdTitle"), description: t("toast.createdDesc", { item: values.name }) });
    }
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? t("distributors.editDistributor") : t("distributors.addDistributor")}
      footer={
        <>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>{t("common.cancel")}</Button>
          <Button onClick={handleSubmit(onSubmit)}>{t("common.save")}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <FieldLabel required>{t("distributors.form.name")}</FieldLabel>
          <Input invalid={!!errors.name} {...register("name")} />
          <FieldError>{errors.name?.message}</FieldError>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel required>{t("distributors.form.company")}</FieldLabel>
          <Input invalid={!!errors.company} {...register("company")} />
          <FieldError>{errors.company?.message}</FieldError>
        </FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup>
            <FieldLabel required>{t("distributors.form.phone")}</FieldLabel>
            <Input invalid={!!errors.phone} {...register("phone")} />
            <FieldError>{errors.phone?.message}</FieldError>
          </FieldGroup>
          <FieldGroup>
            <FieldLabel required>{t("distributors.form.email")}</FieldLabel>
            <Input invalid={!!errors.email} {...register("email")} />
            <FieldError>{errors.email?.message}</FieldError>
          </FieldGroup>
        </div>
        <FieldGroup>
          <FieldLabel required>{t("distributors.form.address")}</FieldLabel>
          <Input invalid={!!errors.address} {...register("address")} />
          <FieldError>{errors.address?.message}</FieldError>
        </FieldGroup>
        <FieldGroup className="mb-0">
          <FieldLabel>{t("distributors.form.status")}</FieldLabel>
          <Select {...register("status")}>
            <option value="active">{t("common.active")}</option>
            <option value="inactive">{t("common.inactive")}</option>
          </Select>
        </FieldGroup>
      </form>
    </Dialog>
  );
}

export default function Distributors() {
  const { t } = useTranslation();
  const { distributors, deleteDistributor } = useDataStore();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Distributor | null>(null);
  const [deleting, setDeleting] = useState<Distributor | null>(null);
  const [status, setStatus] = useState("all");

  const filtered = distributors.filter((d) => status === "all" || d.status === status);
  const table = useTableData(filtered, { searchFields: (d) => [d.name, d.company, d.email], pageSize: 8 });

  return (
    <div>
      <PageHeader
        title={t("distributors.title")}
        subtitle={t("distributors.subtitle")}
        action={<Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus size={16} /> {t("distributors.addDistributor")}</Button>}
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2.5 border-b border-line p-4">
          <SearchInput value={table.search} onChange={table.setSearch} placeholder={t("distributors.searchPlaceholder")} />
          <Select className="!h-9 w-auto max-w-[150px]" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">{t("common.allStatuses")}</option>
            <option value="active">{t("common.active")}</option>
            <option value="inactive">{t("common.inactive")}</option>
          </Select>
        </div>

        {table.rows.length === 0 ? (
          <EmptyState title={t("common.noResults")} hint={t("common.noResultsHint")} />
        ) : (
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH sortable sortDir={table.sortKey === "name" ? table.sortDir : null} onClick={() => table.toggleSort("name")}>{t("distributors.columns.name")}</TH>
                  <TH>{t("distributors.columns.company")}</TH>
                  <TH>{t("distributors.columns.phone")}</TH>
                  <TH>{t("distributors.columns.email")}</TH>
                  <TH>{t("distributors.columns.address")}</TH>
                  <TH>{t("distributors.columns.status")}</TH>
                  <TH className="text-right">{t("common.actions")}</TH>
                </TR>
              </THead>
              <TBody>
                {table.rows.map((d) => (
                  <TR key={d.id}>
                    <TD className="font-medium">{d.name}</TD>
                    <TD className="text-muted">{d.company}</TD>
                    <TD className="num text-muted">{d.phone}</TD>
                    <TD className="text-muted">{d.email}</TD>
                    <TD className="text-muted">{d.address}</TD>
                    <TD><StatusBadge status={d.status} /></TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(d); setDialogOpen(true); }} aria-label={t("common.edit")}>
                          <Pencil size={15} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(d)} aria-label={t("common.delete")}>
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

      <DistributorFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} editing={editing} />
      {deleting && (
        <ConfirmDialog
          open={!!deleting}
          onClose={() => setDeleting(null)}
          itemName={deleting.name}
          onConfirm={() => {
            deleteDistributor(deleting.id);
            toast({ variant: "success", title: t("toast.deletedTitle"), description: t("toast.deletedDesc", { item: deleting.name }) });
          }}
        />
      )}
    </div>
  );
}
