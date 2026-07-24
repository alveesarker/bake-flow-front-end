import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, ShoppingBag } from "lucide-react";
import { useTranslation } from "../i18n/I18nContext";
import { useDataStore, stockStatus } from "../store/DataStore";
import { useToast } from "../hooks/useToast";
import { useTableData } from "../hooks/useTableData";
import { PageHeader, SearchInput, EmptyState, Pagination, ConfirmDialog } from "../components/ui/Misc";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { FieldGroup, FieldLabel, FieldError, Input, Textarea } from "../components/ui/Field";
import { StockBadge } from "../components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD, TableWrap } from "../components/ui/Table";
import { formatCurrency } from "../lib/utils";
import type { RawMaterial } from "../types";

function useMaterialSchema() {
  const { t } = useTranslation();
  return z.object({
    name: z.string().min(2, t("validation.tooShort")),
    code: z.string().min(2, t("validation.tooShort")),
    unit: z.string().min(1, t("validation.requiredField")),
    minStock: z.number().nonnegative(t("validation.mustBeNonNegative")),
  });
}
type MaterialFormValues = z.infer<ReturnType<typeof useMaterialSchema>>;

function MaterialFormDialog({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: RawMaterial | null }) {
  const { t } = useTranslation();
  const { addRawMaterial, updateRawMaterial } = useDataStore();
  const { toast } = useToast();
  const schema = useMaterialSchema();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MaterialFormValues>({
    resolver: zodResolver(schema),
    defaultValues: editing
      ? { name: editing.name, code: editing.code, unit: editing.unit, minStock: editing.minStock }
      : { name: "", code: "", unit: "kg", minStock: 20 },
  });

  const onSubmit = (values: MaterialFormValues) => {
    if (editing) {
      updateRawMaterial(editing.id, values);
      toast({ variant: "success", title: t("toast.updatedTitle"), description: t("toast.updatedDesc", { item: values.name }) });
    } else {
      addRawMaterial({ ...values, currentStock: 0 });
      toast({ variant: "success", title: t("toast.createdTitle"), description: t("toast.createdDesc", { item: values.name }) });
    }
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? t("rawMaterials.editMaterial") : t("rawMaterials.addMaterial")}
      footer={
        <>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>{t("common.cancel")}</Button>
          <Button onClick={handleSubmit(onSubmit)}>{t("common.save")}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <FieldLabel required>{t("rawMaterials.form.name")}</FieldLabel>
          <Input placeholder={t("rawMaterials.form.namePlaceholder")} invalid={!!errors.name} {...register("name")} />
          <FieldError>{errors.name?.message}</FieldError>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel required>{t("rawMaterials.form.code")}</FieldLabel>
          <Input placeholder={t("rawMaterials.form.codePlaceholder")} invalid={!!errors.code} {...register("code")} />
          <FieldError>{errors.code?.message}</FieldError>
        </FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup>
            <FieldLabel required>{t("rawMaterials.form.unit")}</FieldLabel>
            <Input {...register("unit")} />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel required>{t("rawMaterials.form.minStock")}</FieldLabel>
            <Input type="number" invalid={!!errors.minStock} {...register("minStock", { valueAsNumber: true })} />
            <FieldError>{errors.minStock?.message}</FieldError>
          </FieldGroup>
        </div>
      </form>
    </Dialog>
  );
}

function PurchaseDialog({ open, onClose, material }: { open: boolean; onClose: () => void; material: RawMaterial | null }) {
  const { t } = useTranslation();
  const { purchaseRawMaterial } = useDataStore();
  const { toast } = useToast();
  const [qty, setQty] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const total = (Number(qty) || 0) * (Number(unitPrice) || 0);

  const submit = () => {
    if (!material || !qty || !unitPrice) return;
    purchaseRawMaterial(material.id, Number(qty), Number(unitPrice), date, notes);
    toast({ variant: "success", title: t("toast.purchaseTitle"), description: t("toast.purchaseDesc") });
    setQty(""); setUnitPrice(""); setNotes("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("rawMaterials.purchaseForm.title")}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={submit}>{t("common.save")}</Button>
        </>
      }
    >
      <FieldGroup>
        <FieldLabel>{t("rawMaterials.purchaseForm.material")}</FieldLabel>
        <Input disabled value={material?.name ?? ""} />
      </FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <FieldLabel required>{t("rawMaterials.purchaseForm.quantity")}</FieldLabel>
          <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel required>{t("rawMaterials.purchaseForm.unitPrice")}</FieldLabel>
          <Input type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
        </FieldGroup>
      </div>
      <FieldGroup>
        <FieldLabel required>{t("rawMaterials.purchaseForm.purchaseDate")}</FieldLabel>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </FieldGroup>
      <FieldGroup>
        <FieldLabel>{t("rawMaterials.purchaseForm.notes")}</FieldLabel>
        <Textarea placeholder={t("rawMaterials.purchaseForm.notesPlaceholder")} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </FieldGroup>
      <div className="flex items-center justify-between rounded-md bg-mist px-3 py-2.5 text-sm">
        <span className="text-muted">{t("rawMaterials.purchaseForm.totalCost")}</span>
        <span className="num font-semibold text-ink">{formatCurrency(total)}</span>
      </div>
    </Dialog>
  );
}

export default function RawMaterials() {
  const { t } = useTranslation();
  const { rawMaterials, deleteRawMaterial } = useDataStore();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RawMaterial | null>(null);
  const [deleting, setDeleting] = useState<RawMaterial | null>(null);
  const [purchasing, setPurchasing] = useState<RawMaterial | null>(null);

  const table = useTableData(rawMaterials, { searchFields: (m) => [m.name, m.code], pageSize: 8 });

  return (
    <div>
      <PageHeader
        title={t("rawMaterials.title")}
        subtitle={t("rawMaterials.subtitle")}
        action={
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus size={16} /> {t("rawMaterials.addMaterial")}
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2.5 border-b border-line p-4">
          <SearchInput value={table.search} onChange={table.setSearch} placeholder={t("rawMaterials.searchPlaceholder")} />
        </div>

        {table.rows.length === 0 ? (
          <EmptyState title={t("common.noResults")} hint={t("common.noResultsHint")} />
        ) : (
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH sortable sortDir={table.sortKey === "name" ? table.sortDir : null} onClick={() => table.toggleSort("name")}>{t("rawMaterials.columns.name")}</TH>
                  <TH>{t("rawMaterials.columns.code")}</TH>
                  <TH>{t("rawMaterials.columns.unit")}</TH>
                  <TH sortable sortDir={table.sortKey === "currentStock" ? table.sortDir : null} onClick={() => table.toggleSort("currentStock")}>{t("rawMaterials.columns.currentStock")}</TH>
                  <TH>{t("rawMaterials.columns.minStock")}</TH>
                  <TH>{t("rawMaterials.columns.status")}</TH>
                  <TH className="text-right">{t("common.actions")}</TH>
                </TR>
              </THead>
              <TBody>
                {table.rows.map((m) => (
                  <TR key={m.id}>
                    <TD className="font-medium">{m.name}</TD>
                    <TD className="num text-muted">{m.code}</TD>
                    <TD className="text-muted">{m.unit}</TD>
                    <TD className="num">{m.currentStock}</TD>
                    <TD className="num text-muted">{m.minStock}</TD>
                    <TD><StockBadge status={stockStatus(m.currentStock, m.minStock)} /></TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => setPurchasing(m)}>
                          <ShoppingBag size={13} /> {t("rawMaterials.purchase")}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(m); setDialogOpen(true); }} aria-label={t("common.edit")}>
                          <Pencil size={15} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(m)} aria-label={t("common.delete")}>
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

      <MaterialFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} editing={editing} />
      <PurchaseDialog open={!!purchasing} onClose={() => setPurchasing(null)} material={purchasing} />
      {deleting && (
        <ConfirmDialog
          open={!!deleting}
          onClose={() => setDeleting(null)}
          itemName={deleting.name}
          onConfirm={() => {
            deleteRawMaterial(deleting.id);
            toast({ variant: "success", title: t("toast.deletedTitle"), description: t("toast.deletedDesc", { item: deleting.name }) });
          }}
        />
      )}
    </div>
  );
}
