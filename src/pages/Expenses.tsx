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
import { FieldGroup, FieldLabel, FieldError, Input, Select, Textarea } from "../components/ui/Field";
import { Badge } from "../components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD, TableWrap } from "../components/ui/Table";
import { formatCurrency, formatDate } from "../lib/utils";
import type { Expense } from "../types";

const categories = ["rawMaterial", "utilities", "salary", "maintenance", "transportation", "other"] as const;
const categoryTone: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  rawMaterial: "info",
  utilities: "warning",
  salary: "success",
  maintenance: "neutral",
  transportation: "neutral",
  other: "neutral",
};

function useExpenseSchema() {
  const { t } = useTranslation();
  return z.object({
    date: z.string().min(1, t("validation.requiredField")),
    category: z.enum(categories),
    amount: z.number().positive(t("validation.mustBePositive")),
    description: z.string().min(2, t("validation.requiredField")),
  });
}
type ExpenseFormValues = z.infer<ReturnType<typeof useExpenseSchema>>;

function ExpenseFormDialog({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: Expense | null }) {
  const { t } = useTranslation();
  const { addExpense, updateExpense } = useDataStore();
  const { toast } = useToast();
  const schema = useExpenseSchema();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(schema),
    defaultValues: editing ?? { date: new Date().toISOString().slice(0, 10), category: "other", amount: 0, description: "" },
  });

  const onSubmit = (values: ExpenseFormValues) => {
    if (editing) {
      updateExpense(editing.id, values);
      toast({ variant: "success", title: t("toast.updatedTitle"), description: t("toast.updatedDesc", { item: values.description }) });
    } else {
      addExpense(values);
      toast({ variant: "success", title: t("toast.createdTitle"), description: t("toast.createdDesc", { item: values.description }) });
    }
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? t("expenses.editExpense") : t("expenses.addExpense")}
      footer={
        <>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>{t("common.cancel")}</Button>
          <Button onClick={handleSubmit(onSubmit)}>{t("common.save")}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup>
            <FieldLabel required>{t("expenses.form.date")}</FieldLabel>
            <Input type="date" invalid={!!errors.date} {...register("date")} />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel required>{t("expenses.form.category")}</FieldLabel>
            <Select {...register("category")}>
              {categories.map((c) => (
                <option key={c} value={c}>{t(`expenses.categories.${c}`)}</option>
              ))}
            </Select>
          </FieldGroup>
        </div>
        <FieldGroup>
          <FieldLabel required>{t("expenses.form.amount")}</FieldLabel>
          <Input type="number" invalid={!!errors.amount} {...register("amount", { valueAsNumber: true })} />
          <FieldError>{errors.amount?.message}</FieldError>
        </FieldGroup>
        <FieldGroup className="mb-0">
          <FieldLabel required>{t("expenses.form.description")}</FieldLabel>
          <Textarea placeholder={t("expenses.form.descriptionPlaceholder")} invalid={!!errors.description} {...register("description")} />
          <FieldError>{errors.description?.message}</FieldError>
        </FieldGroup>
      </form>
    </Dialog>
  );
}

export default function Expenses() {
  const { t } = useTranslation();
  const { expenses, deleteExpense } = useDataStore();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [category, setCategory] = useState("all");

  const filtered = expenses.filter((e) => category === "all" || e.category === category);
  const table = useTableData(filtered, { searchFields: (e) => [e.description], pageSize: 8 });

  return (
    <div>
      <PageHeader
        title={t("expenses.title")}
        subtitle={t("expenses.subtitle")}
        action={<Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus size={16} /> {t("expenses.addExpense")}</Button>}
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2.5 border-b border-line p-4">
          <SearchInput value={table.search} onChange={table.setSearch} placeholder={t("expenses.searchPlaceholder")} />
          <Select className="!h-9 w-auto max-w-[170px]" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">{t("common.allCategories")}</option>
            {categories.map((c) => (
              <option key={c} value={c}>{t(`expenses.categories.${c}`)}</option>
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
                  <TH sortable sortDir={table.sortKey === "date" ? table.sortDir : null} onClick={() => table.toggleSort("date")}>{t("expenses.columns.date")}</TH>
                  <TH>{t("expenses.columns.category")}</TH>
                  <TH sortable sortDir={table.sortKey === "amount" ? table.sortDir : null} onClick={() => table.toggleSort("amount")}>{t("expenses.columns.amount")}</TH>
                  <TH>{t("expenses.columns.description")}</TH>
                  <TH className="text-right">{t("common.actions")}</TH>
                </TR>
              </THead>
              <TBody>
                {table.rows.map((e) => (
                  <TR key={e.id}>
                    <TD className="text-muted">{formatDate(e.date)}</TD>
                    <TD><Badge tone={categoryTone[e.category]}>{t(`expenses.categories.${e.category}`)}</Badge></TD>
                    <TD className="num font-medium">{formatCurrency(e.amount)}</TD>
                    <TD className="max-w-[280px] truncate text-muted">{e.description}</TD>
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

      <ExpenseFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} editing={editing} />
      {deleting && (
        <ConfirmDialog
          open={!!deleting}
          onClose={() => setDeleting(null)}
          itemName={deleting.description}
          onConfirm={() => {
            deleteExpense(deleting.id);
            toast({ variant: "success", title: t("toast.deletedTitle"), description: t("toast.deletedDesc", { item: deleting.description }) });
          }}
        />
      )}
    </div>
  );
}
