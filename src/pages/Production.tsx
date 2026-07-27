import { useEffect, useMemo, useState } from "react";
import { Plus, Eye, CheckCircle2, AlertTriangle, CheckCircle } from "lucide-react";
import { useTranslation } from "../i18n/I18nContext";
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

// ---------------------------------------------------------------------------
// API config
// ---------------------------------------------------------------------------
const PRODUCTS_API_BASE = "http://localhost:5000/api/products/";
const EMPLOYEE_API_BASE = "http://localhost:5000/api/employee/";
const RAW_MATERIALS_API_BASE = "http://localhost:5000/api/raw-materials/";
const PRODUCTION_API_BASE = "http://localhost:5000/api/production/";

// A single recipe / BOM line as it comes back attached to a product from
// GET /api/products (see product.controller.js attachRecipes()).
interface ApiRecipeItem {
  material_id: number;
  quantity: number | string;
  material_name?: string;
  unit?: string;
}

// Only the fields this page actually needs from a product.
interface ApiProductLite {
  product_id: number;
  product_name: string;
  recipe?: ApiRecipeItem[];
}

// From GET /api/employee/employee-name
interface EmployeeOption {
  employee_id: number;
  name: string;
}

// From GET /api/raw-materials/invstock
interface RawMaterialStock {
  material_id: number;
  material_name: string;
  unit: string;
  current_stock: number | string;
}

// From GET /api/production
interface ProductionListItem {
  production_id: number;
  product_id: number;
  product_name: string;
  employee_id: number | null;
  employee_name: string | null;
  planned_quantity: number;
  produced_quantity: number;
  production_date: string;
  status: "Planned" | "In Progress" | "Completed" | "Cancelled";
  notes: string | null;
}

interface ProductionMaterialLine {
  material_id: number;
  material_name: string;
  unit: string;
  quantity_per_unit: number;
  quantity_needed: number;
  current_stock: number;
}

// From GET /api/production/:id — the list item plus the raw-material
// breakdown needed to produce `planned_quantity` units.
interface ProductionDetail extends ProductionListItem {
  materials: ProductionMaterialLine[];
}

async function apiGetProducts(): Promise<ApiProductLite[]> {
  const res = await fetch(PRODUCTS_API_BASE);
  const json = await res.json();
  console.log(json.data)
  if (!json.success) throw new Error(json.message || "Failed to load products");
  return json.data;
}

async function apiGetEmployeeOptions(): Promise<EmployeeOption[]> {
  const res = await fetch(`${EMPLOYEE_API_BASE}employee-name`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to load employees");
  return json.data;
}

async function apiGetRawMaterialStock(): Promise<RawMaterialStock[]> {
  const res = await fetch(`${RAW_MATERIALS_API_BASE}invstock`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to load raw material stock");
  return json.data;
}

async function apiGetProductionBatches(): Promise<ProductionListItem[]> {
  const res = await fetch(PRODUCTION_API_BASE);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to load production batches");
  return json.data;
}

async function apiGetProductionDetail(id: number): Promise<ProductionDetail> {
  const res = await fetch(`${PRODUCTION_API_BASE}${id}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to load production batch");
  return json.data;
}

async function apiCreateProduction(payload: {
  product_id: number;
  quantity: number;
  employee_id: number;
  date: string;
}) {
  const res = await fetch(PRODUCTION_API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Failed to create production batch");
  }
  return json;
}

async function apiCompleteProduction(id: number) {
  const res = await fetch(`${PRODUCTION_API_BASE}${id}/complete`, { method: "POST" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const shortageMsg =
      Array.isArray(json.shortages) && json.shortages.length > 0
        ? ` (${json.shortages
            .map((s: any) => `${s.material_name}: need ${s.needed}${s.unit}, have ${s.available}${s.unit}`)
            .join(", ")})`
        : "";
    throw new Error((json.message || "Failed to complete production batch") + shortageMsg);
  }
  return json;
}

// ---------------------------------------------------------------------------
// Recipe preview — shown inside the create dialog, using the selected
// product's recipe (from /api/products) and live stock (from
// /api/raw-materials/invstock) to flag shortages before saving.
// ---------------------------------------------------------------------------
function RecipePreview({
  product,
  quantity,
  stockMap,
}: {
  product: ApiProductLite | undefined;
  quantity: number;
  stockMap: Record<number, RawMaterialStock>;
}) {
  const { t } = useTranslation();

  if (!product) {
    return (
      <p className="rounded-md border border-dashed border-line px-3 py-6 text-center text-xs text-muted">
        {t("production.form.selectProductFirst")}
      </p>
    );
  }

  const recipeItems = product.recipe ?? [];
  if (recipeItems.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-line px-3 py-6 text-center text-xs text-muted">
        {t("production.form.noRecipe") ?? "No raw materials are linked to this product yet."}
      </p>
    );
  }

  const rows = recipeItems.map((item) => {
    const stock = stockMap[item.material_id];
    const currentStock = stock ? Number(stock.current_stock) : 0;
    const unit = item.unit ?? stock?.unit ?? "";
    const name = item.material_name ?? stock?.material_name ?? `#${item.material_id}`;
    const needed = Math.round(Number(item.quantity) * quantity * 1000) / 1000;
    const sufficient = currentStock >= needed;
    return { materialId: item.material_id, name, unit, needed, currentStock, sufficient };
  });
  const allSufficient = rows.every((r) => r.sufficient);
  const firstShort = rows.find((r) => !r.sufficient);

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
              <tr key={r.materialId}>
                <td className="px-3 py-2 text-ink">{r.name}</td>
                <td className="px-3 py-2 num text-ink">
                  {r.needed} {r.unit}
                  <span className="ml-1 text-[11px] text-muted">
                    / {r.currentStock} {t("common.of")}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {r.sufficient ? (
                    <span className="inline-flex items-center gap-1 text-xs text-success">
                      <CheckCircle size={13} /> {t("common.inStock")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-danger">
                      <AlertTriangle size={13} /> {t("common.outOfStock")}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        className={`mt-2.5 flex items-start gap-2 rounded-md px-3 py-2 text-xs ${
          allSufficient ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
        }`}
      >
        {allSufficient ? (
          <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
        ) : (
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
        )}
        <span>
          {allSufficient
            ? t("production.form.sufficientStock")
            : firstShort
              ? t("production.form.insufficientStock", {
                  material: firstShort.name,
                  needed: firstShort.needed,
                  available: firstShort.currentStock,
                  unit: firstShort.unit,
                })
              : ""}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create production dialog
// ---------------------------------------------------------------------------
function CreateProductionDialog({
  open,
  onClose,
  products,
  employees,
  stockMap,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  products: ApiProductLite[];
  employees: EmployeeOption[];
  stockMap: Record<number, RawMaterialStock>;
  onCreated: () => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [productId, setProductId] = useState<number | "">("");
  const [quantity, setQuantity] = useState(50);
  const [employeeId, setEmployeeId] = useState<number | "">("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  const selectedProduct = products.find((p) => p.product_id === productId);

  const resetForm = () => {
    setProductId("");
    setQuantity(50);
    setEmployeeId("");
    setDate(new Date().toISOString().slice(0, 10));
  };

  const submit = async () => {
    if (!productId || !employeeId || quantity <= 0) return;
    setSubmitting(true);
    try {
      await apiCreateProduction({
        product_id: Number(productId),
        quantity,
        employee_id: Number(employeeId),
        date,
      });
      toast({
        variant: "success",
        title: t("toast.createdTitle"),
        description: t("toast.createdDesc", { item: selectedProduct?.product_name ?? "" }),
      });
      resetForm();
      onCreated();
      onClose();
    } catch (err) {
      toast({
        variant: "error",
        title: t("common.error"),
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title={t("production.createProduction")}
      size="lg"
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onClose();
            }}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <FieldGroup>
          <FieldLabel required>{t("production.form.product")}</FieldLabel>
          <Select
            value={productId}
            onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">{t("production.form.productPlaceholder")}</option>
            {products.map((p) => (
              <option key={p.product_id} value={p.product_id}>
                {p.product_name}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel required>{t("production.form.quantity")}</FieldLabel>
          <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel required>{t("production.form.employee")}</FieldLabel>
          <Select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">{t("production.form.employeePlaceholder")}</option>
            {employees.map((e) => (
              <option key={e.employee_id} value={e.employee_id}>
                {e.name}
              </option>
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
        <RecipePreview product={selectedProduct} quantity={quantity || 0} stockMap={stockMap} />
      </FieldGroup>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Detail dialog — fetches the full breakdown on open; "Complete" is the only
// action that deducts raw material stock (viewing alone never does).
// ---------------------------------------------------------------------------
function ProductionDetailDialog({
  productionId,
  onClose,
  onCompleted,
}: {
  productionId: number | null;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [detail, setDetail] = useState<ProductionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (productionId == null) {
      setDetail(null);
      setConfirming(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiGetProductionDetail(productionId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        toast({
          variant: "error",
          title: t("common.error"),
          description: err instanceof Error ? err.message : String(err),
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productionId]);

  const handleComplete = async () => {
    if (!detail) return;
    setCompleting(true);
    try {
      await apiCompleteProduction(detail.production_id);
      toast({
        variant: "success",
        title: t("toast.productionCompleteTitle"),
        description: t("toast.productionCompleteDesc"),
      });
      setConfirming(false);
      onCompleted();
      onClose();
    } catch (err) {
      toast({
        variant: "error",
        title: t("toast.errorTitle"),
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setCompleting(false);
    }
  };

  return (
    <Dialog
      open={productionId != null}
      onClose={onClose}
      title={detail ? t("production.detail.title", { id: detail.production_id }) : ""}
      size="lg"
      footer={
        detail && detail.status !== "Completed" ? (
          confirming ? (
            <>
              <Button variant="outline" onClick={() => setConfirming(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleComplete} disabled={completing}>
                {t("production.detail.confirmComplete")}
              </Button>
            </>
          ) : (
            <Button onClick={() => setConfirming(true)}>
              <CheckCircle2 size={15} /> {t("production.complete")}
            </Button>
          )
        ) : undefined
      }
    >
      {loading || !detail ? (
        <div className="p-6 text-center text-sm text-muted">{t("common.loading") || "Loading..."}</div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-[11px] text-muted">{t("production.columns.product")}</p>
              <p className="text-sm font-medium text-ink">{detail.product_name}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted">{t("production.columns.quantity")}</p>
              <p className="num text-sm font-medium text-ink">{detail.planned_quantity}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted">{t("production.columns.employee")}</p>
              <p className="text-sm font-medium text-ink">{detail.employee_name ?? "—"}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted">{t("production.columns.date")}</p>
              <p className="text-sm font-medium text-ink">{formatDate(detail.production_date)}</p>
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

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {t("production.detail.recipeUsed")}
          </p>
          {detail.materials.length > 0 && (
            <div className="overflow-hidden rounded-md border border-line">
              <table className="w-full text-sm">
                <thead className="bg-mist text-[11px] uppercase text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">{t("rawMaterials.form.name")}</th>
                    <th className="px-3 py-2 text-left font-semibold">{t("production.columns.quantity")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {detail.materials.map((m) => (
                    <tr key={m.material_id}>
                      <td className="px-3 py-2 text-ink">{m.material_name}</td>
                      <td className="px-3 py-2 num text-ink">
                        {m.quantity_needed} {m.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function Production() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [batches, setBatches] = useState<ProductionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ApiProductLite[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [stock, setStock] = useState<RawMaterialStock[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [status, setStatus] = useState("all");

  const stockMap = useMemo(() => {
    const map: Record<number, RawMaterialStock> = {};
    stock.forEach((s) => {
      map[s.material_id] = s;
    });
    return map;
  }, [stock]);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await apiGetProductionBatches();
      setBatches(data);
    } catch (err) {
      toast({
        variant: "error",
        title: t("common.error"),
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFormData = async () => {
    try {
      const [productData, employeeData, stockData] = await Promise.all([
        apiGetProducts(),
        apiGetEmployeeOptions(),
        apiGetRawMaterialStock(),
      ]);
      setProducts(productData);
      setEmployees(employeeData);
      setStock(stockData);
    } catch (err) {
      toast({
        variant: "error",
        title: t("common.error"),
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  useEffect(() => {
    loadBatches();
    loadFormData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Completing a batch changes both the batch list and raw material stock,
  // so refresh everything after a create or a complete.
  const refreshAll = () => {
    loadBatches();
    loadFormData();
  };

  // The backend's production.status enum ('Planned' | 'In Progress' |
  // 'Completed' | 'Cancelled') is mapped onto the three-value vocabulary the
  // existing badge/filter UI already speaks, so nothing else has to change.
  const toBadgeStatus = (s: ProductionListItem["status"]): "pending" | "inProgress" | "completed" => {
    if (s === "Completed") return "completed";
    if (s === "In Progress") return "inProgress";
    return "pending"; // Planned, Cancelled
  };

  const filtered = batches.filter((b) => status === "all" || toBadgeStatus(b.status) === status);
  const table = useTableData(filtered, {
    searchFields: (b) => [String(b.production_id), b.product_name],
    pageSize: 8,
  });

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

        {loading ? (
          <div className="p-10 text-center text-sm text-muted">{t("common.loading") || "Loading..."}</div>
        ) : table.rows.length === 0 ? (
          <EmptyState title={t("common.noResults")} hint={t("common.noResultsHint")} />
        ) : (
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH>{t("production.columns.id")}</TH>
                  <TH>{t("production.columns.product")}</TH>
                  <TH
                    sortable
                    sortDir={table.sortKey === "planned_quantity" ? table.sortDir : null}
                    onClick={() => table.toggleSort("planned_quantity")}
                  >
                    {t("production.columns.quantity")}
                  </TH>
                  <TH>{t("production.columns.employee")}</TH>
                  <TH
                    sortable
                    sortDir={table.sortKey === "production_date" ? table.sortDir : null}
                    onClick={() => table.toggleSort("production_date")}
                  >
                    {t("production.columns.date")}
                  </TH>
                  <TH>{t("production.columns.status")}</TH>
                  <TH className="text-right">{t("common.actions")}</TH>
                </TR>
              </THead>
              <TBody>
                {table.rows.map((b) => (
                  <TR key={b.production_id}>
                    <TD className="num font-medium">{b.production_id}</TD>
                    <TD>{b.product_name}</TD>
                    <TD className="num">{b.planned_quantity}</TD>
                    <TD className="text-muted">{b.employee_name ?? "—"}</TD>
                    <TD className="text-muted">{formatDate(b.production_date)}</TD>
                    <TD>
                      <ProductionStatusBadge status={toBadgeStatus(b.status)} />
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedId(b.production_id)}
                          aria-label={t("common.view")}
                        >
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
        <Pagination
          page={table.page}
          totalPages={table.totalPages}
          onChange={table.setPage}
          totalItems={table.totalItems}
          pageSize={table.pageSize}
        />
      </Card>

      <CreateProductionDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        products={products}
        employees={employees}
        stockMap={stockMap}
        onCreated={refreshAll}
      />
      <ProductionDetailDialog
        productionId={selectedId}
        onClose={() => setSelectedId(null)}
        onCompleted={refreshAll}
      />
    </div>
  );
}