import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "../components/ui/Badge";
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
  ConfirmDialog,
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

// ---- Shapes matching the backend response ----
export interface ExpenseCategory {
  category_id: number;
  category_name: string;
}

export interface Expense {
  expense_id: number;
  category_id: number;
  category_name: string;
  amount: number;
  expense_date: string; // yyyy-mm-dd
  description: string;
  employee_id: number | null;
}

// Adjust this if your backend isn't proxied at the same origin
const API_BASE = "http://localhost:5000/api/expenses";

const categoryTone: Record<
  string,
  "neutral" | "success" | "warning" | "danger" | "info"
> = {
  Utilities: "warning",
  Rent: "neutral",
  "Employee Salary": "success",
  "Equipment Maintenance": "neutral",
  Transportation: "neutral",
  Marketing: "info",
  Packaging: "neutral",
  "Office Supplies": "neutral",
  "Internet & Communication": "info",
  "Cleaning & Sanitation": "neutral",
  "Licenses & Permits": "neutral",
  Miscellaneous: "neutral",
};

function useExpenseSchema() {
  const { t } = useTranslation();
  return z.object({
    expense_date: z.string().min(1, t("validation.requiredField")),
    category_id: z
      .number({ error: () => t("validation.requiredField") })
      .positive(t("validation.requiredField")),
    amount: z.number().positive(t("validation.mustBePositive")),
    description: z.string().min(2, t("validation.requiredField")),
  });
}
type ExpenseFormValues = z.infer<ReturnType<typeof useExpenseSchema>>;

function ExpenseFormDialog({
  open,
  onClose,
  editing,
  categories,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing: Expense | null;
  categories: ExpenseCategory[];
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const schema = useExpenseSchema();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      expense_date: new Date().toISOString().slice(0, 10),
      category_id: categories[0]?.category_id ?? 0,
      amount: 0,
      description: "",
    },
  });

  // Re-sync form fields every time the dialog opens or the record being edited changes.
  // This is what makes the edit dialog show the expense's previous data.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      reset({
        expense_date: editing.expense_date?.slice(0, 10),
        category_id: editing.category_id,
        amount: Number(editing.amount),
        description: editing.description ?? "",
      });
    } else {
      reset({
        expense_date: new Date().toISOString().slice(0, 10),
        category_id: categories[0]?.category_id ?? 0,
        amount: 0,
        description: "",
      });
    }
  }, [open, editing, categories, reset]);

  const onSubmit = async (values: ExpenseFormValues) => {
    try {
      const res = await fetch(
        editing ? `${API_BASE}/${editing.expense_id}` : API_BASE,
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Request failed");
      }

      toast({
        variant: "success",
        title: editing ? t("toast.updatedTitle") : t("toast.createdTitle"),
        description: editing
          ? t("toast.updatedDesc", { item: values.description })
          : t("toast.createdDesc", { item: values.description }),
      });
      onSaved();
      onClose();
    } catch (err: any) {
      toast({
        variant: "error",
        title: t("common.error"),
        description: err.message,
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? t("expenses.editExpense") : t("expenses.addExpense")}
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
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup>
            <FieldLabel required>{t("expenses.form.date")}</FieldLabel>
            <Input
              type="date"
              invalid={!!errors.expense_date}
              {...register("expense_date")}
            />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel required>{t("expenses.form.category")}</FieldLabel>
            <Select
              invalid={!!errors.category_id}
              {...register("category_id", { valueAsNumber: true })}
            >
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name}
                </option>
              ))}
            </Select>
          </FieldGroup>
        </div>
        <FieldGroup>
          <FieldLabel required>{t("expenses.form.amount")}</FieldLabel>
          <Input
            type="number"
            step="0.01"
            invalid={!!errors.amount}
            {...register("amount", { valueAsNumber: true })}
          />
          <FieldError>{errors.amount?.message}</FieldError>
        </FieldGroup>
        <FieldGroup className="mb-0">
          <FieldLabel required>{t("expenses.form.description")}</FieldLabel>
          <Textarea
            placeholder={t("expenses.form.descriptionPlaceholder")}
            invalid={!!errors.description}
            {...register("description")}
          />
          <FieldError>{errors.description?.message}</FieldError>
        </FieldGroup>
      </form>
    </Dialog>
  );
}

export default function Expenses() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [category, setCategory] = useState("all");

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error("Failed to load expenses");
      setExpenses(await res.json());
    } catch (err: any) {
      toast({
        variant: "error",
        title: t("common.error"),
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (!res.ok) throw new Error("Failed to load categories");
      setCategories(await res.json());
    } catch (err: any) {
      toast({
        variant: "error",
        title: t("common.error"),
        description: err.message,
      });
    }
  }, [toast, t]);

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, [fetchExpenses, fetchCategories]);

  const filtered = expenses.filter(
    (e) => category === "all" || String(e.category_id) === category,
  );
  const table = useTableData(filtered, {
    searchFields: (e) => [e.description],
    pageSize: 8,
  });

  const handleDelete = async (exp: Expense) => {
    try {
      const res = await fetch(`${API_BASE}/${exp.expense_id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete");
      }
      toast({
        variant: "success",
        title: t("toast.deletedTitle"),
        description: t("toast.deletedDesc", { item: exp.description }),
      });
      fetchExpenses();
    } catch (err: any) {
      toast({
        variant: "error",
        title: t("common.error"),
        description: err.message,
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <PageHeader
        title={t("expenses.title")}
        subtitle={t("expenses.subtitle")}
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={16} /> {t("expenses.addExpense")}
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2.5 border-b border-line p-4">
          <SearchInput
            value={table.search}
            onChange={table.setSearch}
            placeholder={t("expenses.searchPlaceholder")}
          />
          <Select
            className="!h-9 w-auto max-w-[170px]"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">{t("common.allCategories")}</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.category_name}
              </option>
            ))}
          </Select>
        </div>

        {loading ? (
          <EmptyState title={t("common.loading") ?? "Loading..."} hint="" />
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
                    sortDir={
                      table.sortKey === "expense_date" ? table.sortDir : null
                    }
                    onClick={() => table.toggleSort("expense_date")}
                  >
                    {t("expenses.columns.date")}
                  </TH>
                  <TH>{t("expenses.columns.category")}</TH>
                  <TH
                    sortable
                    sortDir={table.sortKey === "amount" ? table.sortDir : null}
                    onClick={() => table.toggleSort("amount")}
                  >
                    {t("expenses.columns.amount")}
                  </TH>
                  <TH>{t("expenses.columns.description")}</TH>
                  <TH className="text-right">{t("common.actions")}</TH>
                </TR>
              </THead>
              <TBody>
                {table.rows.map((e) => (
                  <TR key={e.expense_id}>
                    <TD className="text-muted">{formatDate(e.expense_date)}</TD>
                    <TD>
                      <Badge tone={categoryTone[e.category_name] ?? "neutral"}>
                        {e.category_name}
                      </Badge>
                    </TD>
                    <TD className="num font-medium">
                      {formatCurrency(Number(e.amount))}
                    </TD>
                    <TD className="max-w-[280px] truncate text-muted">
                      {e.description}
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleting(e)}
                          aria-label={t("common.delete")}
                        >
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
        <Pagination
          page={table.page}
          totalPages={table.totalPages}
          onChange={table.setPage}
          totalItems={table.totalItems}
          pageSize={table.pageSize}
        />
      </Card>

      <ExpenseFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editing={editing}
        categories={categories}
        onSaved={fetchExpenses}
      />
      {deleting && (
        <ConfirmDialog
          open={!!deleting}
          onClose={() => setDeleting(null)}
          itemName={deleting.description}
          onConfirm={() => handleDelete(deleting)}
        />
      )}
    </div>
  );
}
