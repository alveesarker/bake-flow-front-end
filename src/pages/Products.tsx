import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { formatCurrency } from "../lib/utils";

// ---------------------------------------------------------------------------
// API config
// ---------------------------------------------------------------------------
const API_BASE = "http://localhost:5000/api/products/";

// Raw shape returned by GET /api/products
interface ApiProduct {
  product_id: number;
  product_name: string;
  product_code: string;
  category_id: number;
  category_name: string;
  description: string;
  customer_price: string | number;
  distributor_price: string | number;
  unit: string;
  weight: string | number;
  minimum_stock: number;
  status: "Active" | "Inactive";
  inventory_id: number;
  stock_quantity: number;
  stock_last_updated: string;
}

async function apiGetProducts(): Promise<ApiProduct[]> {
  const res = await fetch(API_BASE);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to load products");
  return json.data;
}

async function apiCreateProduct(payload: Record<string, unknown>) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Failed to create product");
  }
  return json;
}

async function apiUpdateProduct(id: number, payload: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Failed to update product");
  }
  return json;
}

async function apiDeleteProduct(id: number) {
  const res = await fetch(`${API_BASE}${id}`, { method: "DELETE" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Failed to delete product");
  }
  return json;
}

// NOTE: No dedicated stock route exists in the router you shared, so this
// sends a partial update to PUT /api/products/:id with just stock_quantity.
// If you add a dedicated route (e.g. PATCH /api/products/:id/stock), this is
// the only place you need to change.
async function apiSetStock(id: number, stock_quantity: number) {
  const res = await fetch(`${API_BASE}${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stock_quantity }),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Failed to update stock");
  }
  return json;
}

// ---------------------------------------------------------------------------
// Form schema
// ---------------------------------------------------------------------------
function useProductSchema() {
  const { t } = useTranslation();
  return z.object({
    product_name: z.string().min(2, t("validation.tooShort")),
    product_code: z.string().min(2, t("validation.tooShort")),
    category_id: z.number(t("validation.requiredField")),
    description: z.string(),
    customer_price: z.number().positive(t("validation.mustBePositive")),
    distributor_price: z.number().positive(t("validation.mustBePositive")),
    unit: z.string().min(1, t("validation.requiredField")),
    weight: z.number().nonnegative(t("validation.mustBeNonNegative")),
    minimum_stock: z.number().nonnegative(t("validation.mustBeNonNegative")),
    status: z.enum(["Active", "Inactive"]),
  });
}

type ProductFormValues = z.infer<ReturnType<typeof useProductSchema>>;

// ---------------------------------------------------------------------------
// Create / edit product dialog
// ---------------------------------------------------------------------------
function ProductFormDialog({
  open,
  onClose,
  editing,
  categoryOptions,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing: ApiProduct | null;
  categoryOptions: { category_id: number; category_name: string }[];
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const schema = useProductSchema();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    values: editing
      ? {
          product_name: editing.product_name,
          product_code: editing.product_code,
          category_id: editing.category_id,
          description: editing.description,
          customer_price: Number(editing.customer_price),
          distributor_price: Number(editing.distributor_price),
          unit: editing.unit,
          weight: Number(editing.weight),
          minimum_stock: editing.minimum_stock,
          status: editing.status,
        }
      : {
          product_name: "",
          product_code: "",
          category_id: categoryOptions[0]?.category_id ?? 0,
          description: "",
          customer_price: 0,
          distributor_price: 0,
          unit: "pc",
          weight: 0,
          minimum_stock: 10,
          status: "Active",
        },
  });

  const onSubmit = async (values: ProductFormValues) => {
    try {
      if (editing) {
        await apiUpdateProduct(editing.product_id, values);
        toast({
          variant: "success",
          title: t("toast.updatedTitle"),
          description: t("toast.updatedDesc", { item: values.product_name }),
        });
      } else {
        await apiCreateProduct(values);
        toast({
          variant: "success",
          title: t("toast.createdTitle"),
          description: t("toast.createdDesc", { item: values.product_name }),
        });
      }
      reset();
      onSaved();
      onClose();
    } catch (err) {
      toast({
        variant: "error",
        title: t("common.error"),
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? t("products.editProduct") : t("products.addProduct")}
      size="lg"
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
      <form
        className="grid grid-cols-1 gap-x-4 sm:grid-cols-2"
        onSubmit={handleSubmit(onSubmit)}
      >
        <FieldGroup>
          <FieldLabel required>{t("products.form.name")}</FieldLabel>
          <Input
            placeholder={t("products.form.namePlaceholder")}
            invalid={!!errors.product_name}
            {...register("product_name")}
          />
          <FieldError>{errors.product_name?.message}</FieldError>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel required>{t("products.form.code")}</FieldLabel>
          <Input
            placeholder={t("products.form.codePlaceholder")}
            invalid={!!errors.product_code}
            {...register("product_code")}
          />
          <FieldError>{errors.product_code?.message}</FieldError>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel required>{t("products.form.category")}</FieldLabel>
          <Select
            invalid={!!errors.category_id}
            {...register("category_id", { valueAsNumber: true })}
          >
            {categoryOptions.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.category_name}
              </option>
            ))}
          </Select>
          <FieldError>{errors.category_id?.message}</FieldError>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel required>{t("products.form.unit")}</FieldLabel>
          <Input
            placeholder="pc / kg / bottle"
            invalid={!!errors.unit}
            {...register("unit")}
          />
          <FieldError>{errors.unit?.message}</FieldError>
        </FieldGroup>
        <FieldGroup className="sm:col-span-2">
          <FieldLabel>{t("products.form.description")}</FieldLabel>
          <Textarea
            placeholder={t("products.form.descriptionPlaceholder")}
            {...register("description")}
          />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel required>{t("products.form.customerPrice")}</FieldLabel>
          <Input
            type="number"
            step="0.01"
            invalid={!!errors.customer_price}
            {...register("customer_price", { valueAsNumber: true })}
          />
          <FieldError>{errors.customer_price?.message}</FieldError>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel required>
            {t("products.form.distributorPrice")}
          </FieldLabel>
          <Input
            type="number"
            step="0.01"
            invalid={!!errors.distributor_price}
            {...register("distributor_price", { valueAsNumber: true })}
          />
          <FieldError>{errors.distributor_price?.message}</FieldError>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel>{t("products.form.weight")}</FieldLabel>
          <Input
            type="number"
            {...register("weight", { valueAsNumber: true })}
          />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel required>{t("products.form.minStock")}</FieldLabel>
          <Input
            type="number"
            invalid={!!errors.minimum_stock}
            {...register("minimum_stock", { valueAsNumber: true })}
          />
          <FieldError>{errors.minimum_stock?.message}</FieldError>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel>{t("products.form.status")}</FieldLabel>
          <Select {...register("status")}>
            <option value="Active">{t("common.active")}</option>
            <option value="Inactive">{t("common.inactive")}</option>
          </Select>
        </FieldGroup>
      </form>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function Products() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ApiProduct | null>(null);
  const [deleting, setDeleting] = useState<ApiProduct | null>(null);

  const [adjusting, setAdjusting] = useState<ApiProduct | null>(null);
  const [adjQty, setAdjQty] = useState("");
  const [savingStock, setSavingStock] = useState(false);

  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await apiGetProducts();
      setProducts(data);
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

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Categories derived from whatever products are loaded, since there's no
  // dedicated /api/categories endpoint yet.
  const categoryOptions = useMemo(() => {
    const map = new Map<number, string>();
    products.forEach((p) => map.set(p.category_id, p.category_name));
    return Array.from(map.entries()).map(([category_id, category_name]) => ({
      category_id,
      category_name,
    }));
  }, [products]);

  const filtered = products.filter((p) => {
    const matchesCategory =
      category === "all" || String(p.category_id) === category;
    const matchesStatus = status === "all" || p.status === status;
    return matchesCategory && matchesStatus;
  });

  const table = useTableData(filtered, {
    searchFields: (p) => [p.product_name, p.product_code],
    pageSize: 8,
  });

  const openAdjustDialog = (p: ApiProduct) => {
    setAdjusting(p);
    setAdjQty(String(p.stock_quantity));
  };

  const submitAdjust = async () => {
    if (!adjusting || adjQty === "") return;
    const newQty = Number(adjQty);
    if (Number.isNaN(newQty) || newQty < 0) return;

    setSavingStock(true);
    try {
      await apiSetStock(adjusting.product_id, newQty);
      toast({
        variant: "success",
        title: t("toast.stockAdjustedTitle"),
        description: t("toast.stockAdjustedDesc"),
      });
      setAdjusting(null);
      setAdjQty("");
      loadProducts();
    } catch (err) {
      toast({
        variant: "error",
        title: t("common.error"),
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSavingStock(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await apiDeleteProduct(deleting.product_id);
      toast({
        variant: "success",
        title: t("toast.deletedTitle"),
        description: t("toast.deletedDesc", { item: deleting.product_name }),
      });
      setDeleting(null);
      loadProducts();
    } catch (err) {
      toast({
        variant: "error",
        title: t("common.error"),
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  return (
    <div>
      <PageHeader
        title={t("products.title")}
        subtitle={t("products.subtitle")}
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={16} /> {t("products.addProduct")}
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2.5 border-b border-line p-4">
          <SearchInput
            value={table.search}
            onChange={table.setSearch}
            placeholder={t("products.searchPlaceholder")}
          />
          <Select
            className="!h-9 w-auto max-w-[160px]"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">{t("common.allCategories")}</option>
            {categoryOptions.map((c) => (
              <option key={c.category_id} value={String(c.category_id)}>
                {c.category_name}
              </option>
            ))}
          </Select>
          <Select
            className="!h-9 w-auto max-w-[150px]"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">{t("common.allStatuses")}</option>
            <option value="Active">{t("common.active")}</option>
            <option value="Inactive">{t("common.inactive")}</option>
          </Select>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-muted">
            {t("common.loading") || "Loading..."}
          </div>
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
                      table.sortKey === "product_name" ? table.sortDir : null
                    }
                    onClick={() => table.toggleSort("product_name")}
                  >
                    {t("products.columns.name")}
                  </TH>
                  <TH>{t("products.columns.code")}</TH>
                  <TH>{t("products.columns.category")}</TH>
                  <TH
                    sortable
                    sortDir={
                      table.sortKey === "customer_price" ? table.sortDir : null
                    }
                    onClick={() => table.toggleSort("customer_price")}
                  >
                    {t("products.columns.customerPrice")}
                  </TH>
                  <TH>{t("products.columns.distributorPrice")}</TH>
                  <TH
                    sortable
                    sortDir={
                      table.sortKey === "stock_quantity" ? table.sortDir : null
                    }
                    onClick={() => table.toggleSort("stock_quantity")}
                  >
                    {t("products.columns.stock")}
                  </TH>
                  <TH className="text-right">{t("common.actions")}</TH>
                </TR>
              </THead>
              <TBody>
                {table.rows.map((p) => (
                  <TR key={p.product_id}>
                    <TD className="font-medium">{p.product_name}</TD>
                    <TD className="text-muted num">{p.product_code}</TD>
                    <TD className="text-muted">{p.category_name}</TD>
                    <TD className="num">
                      {formatCurrency(Number(p.customer_price))}
                    </TD>
                    <TD className="num text-muted">
                      {formatCurrency(Number(p.distributor_price))}
                    </TD>
                    <TD>
                      <span className="num">{p.stock_quantity}</span>
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAdjustDialog(p)}
                        >
                          {t("productInventory.adjustStock")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(p);
                            setDialogOpen(true);
                          }}
                          aria-label={t("common.edit")}
                        >
                          <Pencil size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleting(p)}
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

      <ProductFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editing={editing}
        categoryOptions={categoryOptions}
        onSaved={loadProducts}
      />

      {deleting && (
        <ConfirmDialog
          open={!!deleting}
          onClose={() => setDeleting(null)}
          itemName={deleting.product_name}
          onConfirm={confirmDelete}
        />
      )}

      <Dialog
        open={!!adjusting}
        onClose={() => setAdjusting(null)}
        title={
          adjusting
            ? t("productInventory.adjustTitle", {
                name: adjusting.product_name,
              })
            : ""
        }
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setAdjusting(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={submitAdjust} disabled={savingStock}>
              {t("common.save")}
            </Button>
          </>
        }
      >
        <FieldGroup>
          <FieldLabel required>{t("common.quantity")}</FieldLabel>
          <Input
            type="number"
            min={0}
            value={adjQty}
            onChange={(e) => setAdjQty(e.target.value)}
          />
        </FieldGroup>
      </Dialog>
    </div>
  );
}
