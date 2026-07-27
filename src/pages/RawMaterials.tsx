import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, ShoppingBag, Check, X } from "lucide-react";
import { useTranslation } from "../i18n/I18nContext";
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
import type { StockStatus } from "../../src/types";

// ---------------------------------------------------------------------------
// API layer
// ---------------------------------------------------------------------------

const API_BASE = "http://localhost:5000/api";

function stockStatus(current: number, min: number): StockStatus {
  if (current <= 0) return "outOfStock";
  if (current < min) return "lowStock";
  return "inStock";
}

type ApiEnvelope<T> = { success: boolean; message?: string; data?: T };

function mapMaterial(row: any): RawMaterial {
  return {
    id: String(row.material_id),
    name: row.material_name,
    code: row.material_code ?? "",
    unit: row.unit,
    minStock: Number(row.minimum_stock ?? 0),
    currentStock: Number(row.current_stock ?? 0),
  };
}

async function apiFetchRawMaterials(): Promise<RawMaterial[]> {
  const res = await fetch(`${API_BASE}/raw-materials`);
  const json: ApiEnvelope<any[]> = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Failed to load raw materials");
  return (json.data || []).map(mapMaterial);
}

async function apiCreateRawMaterial(values: { name: string; code: string; unit: string; minStock: number }) {
  const res = await fetch(`${API_BASE}/raw-materials`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  const json: ApiEnvelope<any> = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Failed to create raw material");
  return json.data;
}

async function apiUpdateRawMaterial(id: string, values: { name: string; code: string; unit: string; minStock: number }) {
  const res = await fetch(`${API_BASE}/raw-materials/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  const json: ApiEnvelope<any> = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Failed to update raw material");
  return json.data;
}

async function apiDeleteRawMaterial(id: string) {
  const res = await fetch(`${API_BASE}/raw-materials/${id}`, { method: "DELETE" });
  const json: ApiEnvelope<any> = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Failed to delete raw material");
  return json.data;
}

type PurchaseItemPayload = { materialId: string; quantity: number; unitPrice: number };

async function apiPurchaseRawMaterials(payload: {
  items: PurchaseItemPayload[];
  invoiceNumber: string;
  purchaseDate: string;
  notes: string;
}) {
  const res = await fetch(`${API_BASE}/raw-materials/purchase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json: ApiEnvelope<any> = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Failed to record purchase");
  return json.data;
}

// ---------------------------------------------------------------------------
// Add / Edit dialog
// ---------------------------------------------------------------------------

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

function MaterialFormDialog({
  open,
  onClose,
  editing,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing: RawMaterial | null;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const schema = useMaterialSchema();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MaterialFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", code: "", unit: "kg", minStock: 20 },
  });

  // Re-populate the form with the previous values every time the dialog is
  // opened, so editing always shows the current record's data.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      reset({ name: editing.name, code: editing.code, unit: editing.unit, minStock: editing.minStock });
    } else {
      reset({ name: "", code: "", unit: "kg", minStock: 20 });
    }
  }, [open, editing, reset]);

  const onSubmit = async (values: MaterialFormValues) => {
    setSubmitting(true);
    try {
      if (editing) {
        await apiUpdateRawMaterial(editing.id, values);
        toast({ variant: "success", title: t("toast.updatedTitle"), description: t("toast.updatedDesc", { item: values.name }) });
      } else {
        await apiCreateRawMaterial(values);
        toast({ variant: "success", title: t("toast.createdTitle"), description: t("toast.createdDesc", { item: values.name }) });
      }
      onSaved();
      onClose();
    } catch (err) {
      toast({ variant: "error", title: t("common.error") ?? "Error", description: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? t("rawMaterials.editMaterial") : t("rawMaterials.addMaterial")}
      footer={
        <>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>{t("common.cancel")}</Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={submitting}>{t("common.save")}</Button>
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

// ---------------------------------------------------------------------------
// Purchase dialog — select multiple materials from small boxes, edit qty/price
// for each, and see the running total before saving.
// ---------------------------------------------------------------------------

type SelectedLine = { quantity: string; unitPrice: string };

function PurchaseDialog({
  open,
  onClose,
  materials,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  materials: RawMaterial[];
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Record<string, SelectedLine>>({});
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelected({});
      setInvoiceNumber("");
      setNotes("");
      setPurchaseDate(new Date().toISOString().slice(0, 10));
    }
  }, [open]);

  const toggleMaterial = (materialId: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[materialId]) {
        delete next[materialId];
      } else {
        next[materialId] = { quantity: "1", unitPrice: "" };
      }
      return next;
    });
  };

  const updateLine = (materialId: string, field: keyof SelectedLine, value: string) => {
    setSelected((prev) => ({ ...prev, [materialId]: { ...prev[materialId], [field]: value } }));
  };

  const removeLine = (materialId: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      delete next[materialId];
      return next;
    });
  };

  const selectedIds = Object.keys(selected);
  const selectedCount = selectedIds.length;
  const totalCost = selectedIds.reduce((sum, id) => {
    const line = selected[id];
    return sum + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
  }, 0);

  const submit = async () => {
    if (selectedCount === 0) {
      toast({ variant: "error", title: t("common.error") ?? "Error", description: t("rawMaterials.purchaseForm.selectAtLeastOne") ?? "Select at least one item" });
      return;
    }

    const items: PurchaseItemPayload[] = [];
    for (const id of selectedIds) {
      const line = selected[id];
      const quantity = Number(line.quantity);
      const unitPrice = Number(line.unitPrice);
      if (!quantity || quantity <= 0 || !unitPrice || unitPrice <= 0) {
        toast({ variant: "error", title: t("common.error") ?? "Error", description: t("rawMaterials.purchaseForm.invalidLine") ?? "Enter a valid quantity and price for every selected item" });
        return;
      }
      items.push({ materialId: id, quantity, unitPrice });
    }

    setSubmitting(true);
    try {
      await apiPurchaseRawMaterials({ items, invoiceNumber, purchaseDate, notes });
      toast({ variant: "success", title: t("toast.purchaseTitle"), description: t("toast.purchaseDesc") });
      onSaved();
      onClose();
    } catch (err) {
      toast({ variant: "error", title: t("common.error") ?? "Error", description: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("rawMaterials.purchaseForm.title")}
      footer={
        <>
          <div className="mr-auto flex items-center gap-4 text-sm">
            <span className="text-muted">
              {selectedCount} {t("rawMaterials.purchaseForm.itemsSelected") ?? "selected"}
            </span>
            <span className="num font-semibold text-ink">{formatCurrency(totalCost)}</span>
          </div>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={submit} disabled={submitting}>{t("common.save")}</Button>
        </>
      }
    >
      <FieldGroup>
        <FieldLabel>{t("rawMaterials.purchaseForm.material")}</FieldLabel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {materials.map((m) => {
            const isSelected = !!selected[m.id];
            return (
              <button
                type="button"
                key={m.id}
                onClick={() => toggleMaterial(m.id)}
                className={`relative rounded-md border p-2.5 text-left transition-colors ${
                  isSelected ? "border-ink bg-mist" : "border-line hover:bg-mist"
                }`}
              >
                {isSelected && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-white">
                    <Check size={11} />
                  </span>
                )}
                <div className="truncate text-sm font-medium text-ink">{m.name}</div>
                <div className="num text-xs text-muted">
                  {m.code} · {m.currentStock} {m.unit}
                </div>
              </button>
            );
          })}
        </div>
      </FieldGroup>

      {selectedCount > 0 && (
        <FieldGroup>
          <FieldLabel>{t("rawMaterials.purchaseForm.selectedItems") ?? "Selected items"}</FieldLabel>
          <div className="space-y-2">
            {selectedIds.map((id) => {
              const material = materials.find((m) => m.id === id);
              if (!material) return null;
              const line = selected[id];
              const subtotal = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
              return (
                <div key={id} className="flex items-center gap-2 rounded-md border border-line p-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">{material.name}</div>
                    <div className="text-xs text-muted">{material.unit}</div>
                  </div>
                  <Input
                    type="number"
                    className="w-20"
                    placeholder={t("rawMaterials.purchaseForm.quantity")}
                    value={line.quantity}
                    onChange={(e) => updateLine(id, "quantity", e.target.value)}
                  />
                  <Input
                    type="number"
                    className="w-24"
                    placeholder={t("rawMaterials.purchaseForm.unitPrice")}
                    value={line.unitPrice}
                    onChange={(e) => updateLine(id, "unitPrice", e.target.value)}
                  />
                  <div className="num w-20 text-right text-sm text-ink">{formatCurrency(subtotal)}</div>
                  <button
                    type="button"
                    onClick={() => removeLine(id)}
                    aria-label={t("common.delete")}
                    className="text-muted hover:text-danger"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </FieldGroup>
      )}

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <FieldLabel>{t("rawMaterials.purchaseForm.invoiceNumber") ?? "Invoice number"}</FieldLabel>
          <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel required>{t("rawMaterials.purchaseForm.purchaseDate")}</FieldLabel>
          <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
        </FieldGroup>
      </div>
      <FieldGroup>
        <FieldLabel>{t("rawMaterials.purchaseForm.notes")}</FieldLabel>
        <Textarea placeholder={t("rawMaterials.purchaseForm.notesPlaceholder")} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </FieldGroup>
      <div className="flex items-center justify-between rounded-md bg-mist px-3 py-2.5 text-sm">
        <span className="text-muted">{t("rawMaterials.purchaseForm.totalCost")}</span>
        <span className="num font-semibold text-ink">{formatCurrency(totalCost)}</span>
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RawMaterials() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RawMaterial | null>(null);
  const [deleting, setDeleting] = useState<RawMaterial | null>(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const data = await apiFetchRawMaterials();
      setMaterials(data);
    } catch (err) {
      toast({ variant: "error", title: t("common.error") ?? "Error", description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const table = useTableData(materials, { searchFields: (m) => [m.name, m.code], pageSize: 8 });

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await apiDeleteRawMaterial(deleting.id);
      toast({ variant: "success", title: t("toast.deletedTitle"), description: t("toast.deletedDesc", { item: deleting.name }) });
      setDeleting(null);
      loadMaterials();
    } catch (err) {
      toast({ variant: "error", title: t("common.error") ?? "Error", description: (err as Error).message });
    }
  };

  return (
    <div>
      <PageHeader
        title={t("rawMaterials.title")}
        subtitle={t("rawMaterials.subtitle")}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setPurchaseOpen(true)}>
              <ShoppingBag size={16} /> {t("rawMaterials.purchase")}
            </Button>
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus size={16} /> {t("rawMaterials.addMaterial")}
            </Button>
          </div>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2.5 border-b border-line p-4">
          <SearchInput value={table.search} onChange={table.setSearch} placeholder={t("rawMaterials.searchPlaceholder")} />
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted">{t("common.loading") ?? "Loading..."}</div>
        ) : table.rows.length === 0 ? (
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

      <MaterialFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} editing={editing} onSaved={loadMaterials} />
      <PurchaseDialog open={purchaseOpen} onClose={() => setPurchaseOpen(false)} materials={materials} onSaved={loadMaterials} />
      {deleting && (
        <ConfirmDialog
          open={!!deleting}
          onClose={() => setDeleting(null)}
          itemName={deleting.name}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
