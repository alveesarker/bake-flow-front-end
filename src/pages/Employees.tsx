import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Dialog } from "../components/ui/Dialog";
import {
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Select,
  Textarea,
} from "../components/ui/Field";
import {
  EmptyState,
  PageHeader,
  Pagination,
  SearchInput,
} from "../components/ui/Misc";
import {
  Table,
  TableWrap,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "../components/ui/Table";
import { useTableData } from "../hooks/useTableData";
import { useToast } from "../hooks/useToast";
import { useTranslation } from "../i18n/I18nContext";
import { formatCurrency, formatDate } from "../lib/utils";
import type { Status } from "../types";

const API_BASE_URL = "http://localhost:5000/api";

// Matches the `employee` table in the database
interface Employee {
  employee_id: number;
  name: string;
  phone: string | null;
  address: string | null;
  designation: string | null;
  salary: number | null;
  joining_date: string | null;
  status: "Active" | "Inactive";
}

function useEmployeeSchema() {
  const { t } = useTranslation();
  return z.object({
    name: z.string().min(2, t("validation.tooShort")),
    phone: z.string().min(6, t("validation.invalidPhone")),
    address: z.string().optional(),
    designation: z.string().min(1, t("validation.requiredField")),
    salary: z.number().positive(t("validation.mustBePositive")),
    joining_date: z.string().min(1, t("validation.requiredField")),
    status: z.enum(["Active", "Inactive"]),
  });
}
type EmployeeFormValues = z.infer<ReturnType<typeof useEmployeeSchema>>;

// ---- API helpers ----

async function apiGetEmployees(): Promise<Employee[]> {
  const res = await fetch(`${API_BASE_URL}/employee`);
  if (!res.ok) throw new Error("Failed to fetch employee");
  return res.json();
}

async function apiAddEmployee(values: EmployeeFormValues): Promise<Employee> {
  const res = await fetch(`${API_BASE_URL}/employee`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  if (!res.ok) throw new Error("Failed to add employee");
  return res.json();
}

async function apiUpdateEmployee(
  id: number,
  values: EmployeeFormValues,
): Promise<Employee> {
  const res = await fetch(`${API_BASE_URL}/employee/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  if (!res.ok) throw new Error("Failed to update employee");
  return res.json();
}

const EMPTY_DEFAULTS: EmployeeFormValues = {
  name: "",
  phone: "",
  address: "",
  designation: "",
  salary: 15000,
  joining_date: new Date().toISOString().slice(0, 10),
  status: "Active",
};

function employeeToFormValues(editing: Employee | null): EmployeeFormValues {
  if (!editing) return EMPTY_DEFAULTS;
  return {
    name: editing.name,
    phone: editing.phone ?? "",
    address: editing.address ?? "",
    designation: editing.designation ?? "",
    salary: editing.salary ?? 0,
    joining_date: editing.joining_date ? editing.joining_date.slice(0, 10) : "",
    status: editing.status,
  };
}

function EmployeeFormDialog({
  open,
  onClose,
  editing,
  onSaved,
  designationOptions,
}: {
  open: boolean;
  onClose: () => void;
  editing: Employee | null;
  onSaved: () => void;
  designationOptions: string[];
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const schema = useEmployeeSchema();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: employeeToFormValues(editing),
  });

  // Keep the form in sync with the employee being edited (or cleared for "add")
  // every time the dialog is opened, since the dialog stays mounted between uses.
  useEffect(() => {
    if (open) {
      reset(employeeToFormValues(editing));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const onSubmit = async (values: EmployeeFormValues) => {
    setSubmitting(true);
    try {
      if (editing) {
        await apiUpdateEmployee(editing.employee_id, values);
        toast({
          variant: "success",
          title: t("toast.updatedTitle"),
          description: t("toast.updatedDesc", { item: values.name }),
        });
      } else {
        await apiAddEmployee(values);
        toast({
          variant: "success",
          title: t("toast.createdTitle"),
          description: t("toast.createdDesc", { item: values.name }),
        });
      }
      reset();
      onSaved();
      onClose();
    } catch (err) {
      toast({
        variant: "error",
        title: t("common.error"),
        description: (err as Error).message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? t("employees.editEmployee") : t("employees.addEmployee")}
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={submitting}>
            {t("common.save")}
          </Button>
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
            <Select invalid={!!errors.designation} {...register("designation")}>
              <option value="">{t("common.select") ?? "Select..."}</option>
              {designationOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
            <FieldError>{errors.designation?.message}</FieldError>
          </FieldGroup>
        </div>
        <FieldGroup>
          <FieldLabel>{t("employees.form.address")}</FieldLabel>
          <Textarea rows={2} {...register("address")} />
        </FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup>
            <FieldLabel required>{t("employees.form.salary")}</FieldLabel>
            <Input
              type="number"
              invalid={!!errors.salary}
              {...register("salary", { valueAsNumber: true })}
            />
            <FieldError>{errors.salary?.message}</FieldError>
          </FieldGroup>
          <FieldGroup>
            <FieldLabel required>{t("employees.form.joiningDate")}</FieldLabel>
            <Input
              type="date"
              invalid={!!errors.joining_date}
              {...register("joining_date")}
            />
            <FieldError>{errors.joining_date?.message}</FieldError>
          </FieldGroup>
        </div>
        <FieldGroup className="mb-0">
          <FieldLabel>{t("employees.form.status")}</FieldLabel>
          <Select {...register("status")}>
            <option value="Active">{t("common.active")}</option>
            <option value="Inactive">{t("common.inactive")}</option>
          </Select>
        </FieldGroup>
      </form>
    </Dialog>
  );
}

export default function Employees() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [designation, setDesignation] = useState("all");

  const loadEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGetEmployees();
      setEmployees(data);
    } catch (err) {
      setError((err as Error).message);
      toast({
        variant: "error",
        title: t("common.error"),
        description: (err as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const designations = useMemo(
    () =>
      Array.from(
        new Set(employees.map((e) => e.designation).filter(Boolean)),
      ) as string[],
    [employees],
  );

  const filtered = employees.filter(
    (e) => designation === "all" || e.designation === designation,
  );
  const table = useTableData(filtered, {
    searchFields: (e) => [e.name, e.phone ?? ""],
    pageSize: 8,
  });

  return (
    <div>
      <PageHeader
        title={t("employees.title")}
        subtitle={t("employees.subtitle")}
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={16} /> {t("employees.addEmployee")}
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2.5 border-b border-line p-4">
          <SearchInput
            value={table.search}
            onChange={table.setSearch}
            placeholder={t("employees.searchPlaceholder")}
          />
          <Select
            className="!h-9 w-auto max-w-[180px]"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
          >
            <option value="all">{t("common.allCategories")}</option>
            {designations.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>

        {loading ? (
          <EmptyState title={t("common.loading") ?? "Loading..."} hint="" />
        ) : error ? (
          <EmptyState title={t("common.error")} hint={error} />
        ) : table.rows.length === 0 ? (
          <EmptyState
            title={t("common.noResults")}
            hint={t("common.noResultsHint")}
          />
        ) : (
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH
                    sortable
                    sortDir={table.sortKey === "name" ? table.sortDir : null}
                    onClick={() => table.toggleSort("name")}
                  >
                    {t("employees.columns.name")}
                  </TH>
                  <TH>{t("employees.columns.phone")}</TH>
                  <TH>{t("employees.form.address")}</TH>
                  <TH>{t("employees.columns.designation")}</TH>
                  <TH
                    sortable
                    sortDir={table.sortKey === "salary" ? table.sortDir : null}
                    onClick={() => table.toggleSort("salary")}
                  >
                    {t("employees.columns.salary")}
                  </TH>
                  <TH>{t("employees.columns.joiningDate")}</TH>
                  <TH>{t("employees.columns.status")}</TH>
                  <TH className="text-right">{t("common.actions")}</TH>
                </TR>
              </THead>
              <TBody>
                {table.rows.map((e) => (
                  <TR key={e.employee_id}>
                    <TD className="font-medium">{e.name}</TD>
                    <TD className="num text-muted">{e.phone}</TD>
                    <TD
                      className="text-muted max-w-[220px] truncate"
                      title={e.address ?? ""}
                    >
                      {e.address}
                    </TD>
                    <TD className="text-muted">{e.designation}</TD>
                    <TD className="num">
                      {e.salary != null ? formatCurrency(e.salary) : "-"}
                    </TD>
                    <TD className="text-muted">
                      {e.joining_date ? formatDate(e.joining_date) : "-"}
                    </TD>
                    <TD>
                      <StatusBadge status={e.status.toLowerCase() as Status} />
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(e);
                            setDialogOpen(true);
                          }}
                          aria-label={t("common.edit")}
                        >
                          <Pencil size={15} />
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        )}
        <Pagination
          page={table.page}
          totalPages={table.totalPages}
          onChange={table.setPage}
          totalItems={table.totalItems}
          pageSize={table.pageSize}
        />
      </Card>

      <EmployeeFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editing={editing}
        onSaved={loadEmployees}
        designationOptions={designations}
      />
    </div>
  );
}
