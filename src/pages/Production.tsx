import { useMemo, useState } from "react";
import { Plus, Eye, CheckCircle2, AlertTriangle, CheckCircle } from "lucide-react";
import { useTranslation } from "../i18n/I18nContext";
import { useDataStore } from "../store/DataStore";
import { useToast } from "../hooks/useToast";
import { useTableData } from "../hooks/useTableData";
import { PageHeader, SearchInput, EmptyState, Pagination } from "../components/ui/Misc";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { FieldGroup, FieldLabel, Input, Select } from "../components/ui/Field";
import { ProductionStatusBadge } from "../components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD, TableWrap } from "../components/ui/Table";
import { formatDate } from "../lib/utils";
import type { ProductionBatch } from "../types";

function RecipePreview({ productId, quantity }: { productId: string; quantity: number }) {
  const { t } = useTranslation();
  const { recipes, rawMaterials } = useDataStore();
  const recipe = recipes.find((r) => r.productId === productId);

  if (!productId) {
    return <p className="rounded-md border border-dashed border-line px-3 py-6 text-center text-xs text-muted">{t("production.form.selectProductFirst")}</p>;
  }
  if (!recipe) return null;

  const rows = recipe.items.map((item) => {
    const material = rawMaterials.find((m) => m.id === item.materialId)!;
    const needed = Math.round(item.qtyPerUnit * quantity * 1000) / 1000;
    const sufficient = material.currentStock >= needed;
    return { material, needed, sufficient };
  });
  const allSufficient = rows.every((r) => r.sufficient);

  return (
    <div>
      <div className="overflow-hidden rounded-md border border-line">
        <table className="w-full text-sm">
          <thead className="bg-mist text-[11px] uppercase text-muted">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">{t("rawMaterials.form.name")}</th>
              <th className="px-3 py-2 text-left font-semibold">{t("production.columns.quantity")}</th>
              <th className="px-3 py-2 text-left font-semibold">{t("common.status")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.material.id}>
                <td className="px-3 py-2 text-ink">{r.material.name}</td>
                <td className="px-3 py-2 num text-ink">
                  {r.needed} {r.material.unit}
                  <span className="ml-1 text-[11px] text-muted">/ {r.material.currentStock} {t("common.of")}</span>
                </td>
                <td className="px-3 py-2">
                  {r.sufficient ? (
                    <span className="inline-flex items-center gap-1 text-xs text-success"><CheckCircle size={13} /> {t("common.inStock")}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-danger"><AlertTriangle size={13} /> {t("common.outOfStock")}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={`mt-2.5 flex items-start gap-2 rounded-md px-3 py-2 text-xs ${allSufficient ? "bg-success-bg text-success" : "bg-danger-bg text-danger"}`}>
        {allSufficient ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> : <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
        <span>
          {allSufficient
            ? t("production.form.sufficientStock")
            : rows.find((r) => !r.sufficient)
              ? t("production.form.insufficientStock", {
                  material: rows.find((r) => !r.sufficient)!.material.name,
                  needed: rows.find((r) => !r.sufficient)!.needed,
                  available: rows.find((r) => !r.sufficient)!.material.currentStock,
                  unit: rows.find((r) => !r.sufficient)!.material.unit,
                })
              : ""}
        </span>
      </div>
    </div>
  );
}

function CreateProductionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { products, employees, createProduction } = useDataStore();
  const { toast } = useToast();
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(50);
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const submit = () => {
    if (!productId || !employeeId || quantity <= 0) return;
    createProduction(productId, quantity, employeeId, date);
    const product = products.find((p) => p.id === productId);
    toast({ variant: "success", title: t("toast.createdTitle"), description: t("toast.createdDesc", { item: product?.name ?? "" }) });
    setProductId(""); setQuantity(50); setEmployeeId("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("production.createProduction")}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={submit}>{t("common.save")}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <FieldGroup>
          <FieldLabel required>{t("production.form.product")}</FieldLabel>
          <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">{t("production.form.productPlaceholder")}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel required>{t("production.form.quantity")}</FieldLabel>
          <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel required>{t("production.form.employee")}</FieldLabel>
          <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">{t("production.form.employeePlaceholder")}</option>
            {employees.filter((e) => e.status === "active").map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel required>{t("production.form.date")}</FieldLabel>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FieldGroup>
      </div>
      <FieldGroup className="sm:col-span-2">
        <FieldLabel>{t("production.form.recipe")}</FieldLabel>
        <p className="mb-2 text-xs text-muted">{t("production.form.recipeHint")}</p>
        <RecipePreview productId={productId} quantity={quantity || 0} />
      </FieldGroup>
    </Dialog>
  );
}

function ProductionDetailDialog({ batch, onClose }: { batch: ProductionBatch | null; onClose: () => void }) {
  const { t } = useTranslation();
  const { products, employees, recipes, rawMaterials, completeProduction } = useDataStore();
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);

  if (!batch) return null;
  const product = products.find((p) => p.id === batch.productId);
  const employee = employees.find((e) => e.id === batch.employeeId);
  const recipe = recipes.find((r) => r.productId === batch.productId);

  const handleComplete = () => {
    const result = completeProduction(batch.id);
    if (result.ok) {
      toast({ variant: "success", title: t("toast.productionCompleteTitle"), description: t("toast.productionCompleteDesc") });
      onClose();
    } else {
      toast({ variant: "error", title: t("toast.errorTitle"), description: t("toast.errorDesc") });
    }
    setConfirming(false);
  };

  return (
    <Dialog
      open={!!batch}
      onClose={onClose}
      title={t("production.detail.title", { id: batch.id })}
      size="lg"
      footer={
        batch.status !== "completed" ? (
          confirming ? (
            <>
              <Button variant="outline" onClick={() => setConfirming(false)}>{t("common.cancel")}</Button>
              <Button onClick={handleComplete}>{t("production.detail.confirmComplete")}</Button>
            </>
          ) : (
            <Button onClick={() => setConfirming(true)}>
              <CheckCircle2 size={15} /> {t("production.complete")}
            </Button>
          )
        ) : undefined
      }
    >
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="text-[11px] text-muted">{t("production.columns.product")}</p>
          <p className="text-sm font-medium text-ink">{product?.name}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted">{t("production.columns.quantity")}</p>
          <p className="num text-sm font-medium text-ink">{batch.quantity}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted">{t("production.columns.employee")}</p>
          <p className="text-sm font-medium text-ink">{employee?.name}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted">{t("production.columns.date")}</p>
          <p className="text-sm font-medium text-ink">{formatDate(batch.date)}</p>
        </div>
      </div>

      {confirming && (
        <div className="mb-4 flex items-start gap-2 rounded-md bg-warning-bg px-3 py-2.5 text-xs text-warning">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">{t("production.detail.confirmCompleteTitle")}</p>
            <p className="mt-0.5">{t("production.detail.confirmCompleteDesc")}</p>
          </div>
        </div>
      )}

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("production.detail.recipeUsed")}</p>
      {recipe && (
        <div className="overflow-hidden rounded-md border border-line">
          <table className="w-full text-sm">
            <thead className="bg-mist text-[11px] uppercase text-muted">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">{t("rawMaterials.form.name")}</th>
                <th className="px-3 py-2 text-left font-semibold">{t("production.columns.quantity")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recipe.items.map((item) => {
                const material = rawMaterials.find((m) => m.id === item.materialId)!;
                const needed = Math.round(item.qtyPerUnit * batch.quantity * 1000) / 1000;
                return (
                  <tr key={material.id}>
                    <td className="px-3 py-2 text-ink">{material.name}</td>
                    <td className="px-3 py-2 num text-ink">{needed} {material.unit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Dialog>
  );
}

export default function Production() {
  const { t } = useTranslation();
  const { productionBatches, products, employees } = useDataStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<ProductionBatch | null>(null);
  const [status, setStatus] = useState("all");

  const enriched = useMemo(
    () =>
      productionBatches.map((b) => ({
        ...b,
        productName: products.find((p) => p.id === b.productId)?.name ?? "",
        employeeName: employees.find((e) => e.id === b.employeeId)?.name ?? "",
      })),
    [productionBatches, products, employees]
  );

  const filtered = enriched.filter((b) => status === "all" || b.status === status);
  const table = useTableData(filtered, { searchFields: (b) => [b.id, b.productName], pageSize: 8 });

  return (
    <div>
      <PageHeader
        title={t("production.title")}
        subtitle={t("production.subtitle")}
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> {t("production.createProduction")}
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2.5 border-b border-line p-4">
          <SearchInput value={table.search} onChange={table.setSearch} placeholder={t("production.searchPlaceholder")} />
          <Select className="!h-9 w-auto max-w-[160px]" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">{t("common.allStatuses")}</option>
            <option value="pending">{t("production.statuses.pending")}</option>
            <option value="inProgress">{t("production.statuses.inProgress")}</option>
            <option value="completed">{t("production.statuses.completed")}</option>
          </Select>
        </div>

        {table.rows.length === 0 ? (
          <EmptyState title={t("common.noResults")} hint={t("common.noResultsHint")} />
        ) : (
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH>{t("production.columns.id")}</TH>
                  <TH>{t("production.columns.product")}</TH>
                  <TH sortable sortDir={table.sortKey === "quantity" ? table.sortDir : null} onClick={() => table.toggleSort("quantity")}>
                    {t("production.columns.quantity")}
                  </TH>
                  <TH>{t("production.columns.employee")}</TH>
                  <TH sortable sortDir={table.sortKey === "date" ? table.sortDir : null} onClick={() => table.toggleSort("date")}>
                    {t("production.columns.date")}
                  </TH>
                  <TH>{t("production.columns.status")}</TH>
                  <TH className="text-right">{t("common.actions")}</TH>
                </TR>
              </THead>
              <TBody>
                {table.rows.map((b) => (
                  <TR key={b.id}>
                    <TD className="num font-medium">{b.id}</TD>
                    <TD>{b.productName}</TD>
                    <TD className="num">{b.quantity}</TD>
                    <TD className="text-muted">{b.employeeName}</TD>
                    <TD className="text-muted">{formatDate(b.date)}</TD>
                    <TD><ProductionStatusBadge status={b.status} /></TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setSelected(b)} aria-label={t("common.view")}>
                          <Eye size={15} />
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

      <CreateProductionDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <ProductionDetailDialog batch={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
