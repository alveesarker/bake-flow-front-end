import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Dialog } from "../components/ui/Dialog";
import { formatDate } from "../lib/utils";
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
import { useDataStore, stockStatus } from "../store/DataStore";
import type { Product } from "../types";

const categories = [
  "breads",
  "pastries",
  "cakes",
  "cookies",
  "beverages",
] as const;

function useProductSchema() {
  const { t } = useTranslation();
  return z.object({
    name: z.string().min(2, t("validation.tooShort")),
    code: z.string().min(2, t("validation.tooShort")),
    category: z.enum(categories),
    description: z.string(),
    customerPrice: z.number().positive(t("validation.mustBePositive")),
    distributorPrice: z.number().positive(t("validation.mustBePositive")),
    unit: z.string().min(1, t("validation.requiredField")),
    weight: z.number().nonnegative(t("validation.mustBeNonNegative")),
    minStock: z.number().nonnegative(t("validation.mustBeNonNegative")),
    status: z.enum(["active", "inactive"]),
  });
}

type ProductFormValues = z.infer<ReturnType<typeof useProductSchema>>;

function ProductFormDialog({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Product | null;
}) {
  const { t } = useTranslation();
  const { addProduct, updateProduct } = useDataStore();
  const { toast } = useToast();
  const schema = useProductSchema();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: editing
      ? {
          name: editing.name,
          code: editing.code,
          category: editing.category,
          description: editing.description,
          customerPrice: editing.customerPrice,
          distributorPrice: editing.distributorPrice,
          unit: editing.unit,
          weight: editing.weight,
          minStock: editing.minStock,
          status: editing.status,
        }
      : {
          name: "",
          code: "",
          category: "breads",
          description: "",
          customerPrice: 0,
          distributorPrice: 0,
          unit: "pc",
          weight: 0,
          minStock: 10,
          status: "active",
        },
  });

  const onSubmit = (values: ProductFormValues) => {
    if (editing) {
      updateProduct(editing.id, values);
      toast({
        variant: "success",
        title: t("toast.updatedTitle"),
        description: t("toast.updatedDesc", { item: values.name }),
      });
    } else {
      addProduct({ ...values, image: "🥐", stock: 0 });
      toast({
        variant: "success",
        title: t("toast.createdTitle"),
        description: t("toast.createdDesc", { item: values.name }),
      });
    }
    reset();
    onClose();
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
          <Button onClick={handleSubmit(onSubmit)}>{t("common.save")}</Button>
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
            invalid={!!errors.name}
            {...register("name")}
          />
          <FieldError>{errors.name?.message}</FieldError>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel required>{t("products.form.code")}</FieldLabel>
          <Input
            placeholder={t("products.form.codePlaceholder")}
            invalid={!!errors.code}
            {...register("code")}
          />
          <FieldError>{errors.code?.message}</FieldError>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel required>{t("products.form.category")}</FieldLabel>
          <Select {...register("category")}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {t(`products.categories.${c}`)}
              </option>
            ))}
          </Select>
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
            invalid={!!errors.customerPrice}
            {...register("customerPrice", { valueAsNumber: true })}
          />
          <FieldError>{errors.customerPrice?.message}</FieldError>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel required>
            {t("products.form.distributorPrice")}
          </FieldLabel>
          <Input
            type="number"
            step="0.01"
            invalid={!!errors.distributorPrice}
            {...register("distributorPrice", { valueAsNumber: true })}
          />
          <FieldError>{errors.distributorPrice?.message}</FieldError>
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
            invalid={!!errors.minStock}
            {...register("minStock", { valueAsNumber: true })}
          />
          <FieldError>{errors.minStock?.message}</FieldError>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel>{t("products.form.status")}</FieldLabel>
          <Select {...register("status")}>
            <option value="active">{t("common.active")}</option>
            <option value="inactive">{t("common.inactive")}</option>
          </Select>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel>{t("products.form.image")}</FieldLabel>
          <div className="flex h-9.5 items-center rounded-md border border-dashed border-line px-3 text-xs text-muted">
            {t("products.form.imageHint")}
          </div>
        </FieldGroup>
      </form>
    </Dialog>
  );
}

export default function Products() {
  const { t } = useTranslation();
  const { products, deleteProduct, adjustProductStock, stockHistory } =
    useDataStore();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  const [historyFor, setHistoryFor] = useState<Product | null>(null);
  const [adjType, setAdjType] = useState<"increase" | "decrease">("increase");
  const [adjQty, setAdjQty] = useState("");
  const [adjReason, setAdjReason] = useState("");

  const filtered = products.filter(
    (p) => status === "all" || stockStatus(p.stock, p.minStock) === status,
  );
  const table = useTableData(filtered, {
    searchFields: (p) => [p.name, p.code],
    pageSize: 8,
  });

  const submitAdjust = () => {
    if (!adjusting || !adjQty) return;
    adjustProductStock(adjusting.id, adjType, Number(adjQty), adjReason);
    toast({
      variant: "success",
      title: t("toast.stockAdjustedTitle"),
      description: t("toast.stockAdjustedDesc"),
    });
    setAdjusting(null);
    setAdjQty("");
    setAdjReason("");
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
            {categories.map((c) => (
              <option key={c} value={c}>
                {t(`products.categories.${c}`)}
              </option>
            ))}
          </Select>
          <Select
            className="!h-9 w-auto max-w-[150px]"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">{t("common.allStatuses")}</option>
            <option value="active">{t("common.active")}</option>
            <option value="inactive">{t("common.inactive")}</option>
          </Select>
        </div>

        {table.rows.length === 0 ? (
          <EmptyState
            title={t("common.noResults")}
            hint={t("common.noResultsHint")}
          />
        ) : (
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH>{t("products.columns.image")}</TH>
                  <TH
                    sortable
                    sortDir={table.sortKey === "name" ? table.sortDir : null}
                    onClick={() => table.toggleSort("name")}
                  >
                    {t("products.columns.name")}
                  </TH>
                  <TH>{t("products.columns.code")}</TH>
                  <TH>{t("products.columns.category")}</TH>
                  <TH
                    sortable
                    sortDir={
                      table.sortKey === "customerPrice" ? table.sortDir : null
                    }
                    onClick={() => table.toggleSort("customerPrice")}
                  >
                    {t("products.columns.customerPrice")}
                  </TH>
                  <TH>{t("products.columns.distributorPrice")}</TH>
                  <TH
                    sortable
                    sortDir={table.sortKey === "stock" ? table.sortDir : null}
                    onClick={() => table.toggleSort("stock")}
                  >
                    {t("products.columns.stock")}
                  </TH>
                  {/* <TH>{t("products.columns.status")}</TH> */}
                  <TH className="text-right">{t("common.actions")}</TH>
                </TR>
              </THead>
              <TBody>
                {table.rows.map((p) => (
                  <TR key={p.id}>
                    <TD>
                      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-mist text-lg">
                        {p.image}
                      </span>
                    </TD>
                    <TD className="font-medium">{p.name}</TD>
                    <TD className="text-muted num">{p.code}</TD>
                    <TD className="text-muted">
                      {t(`products.categories.${p.category}`)}
                    </TD>
                    <TD className="num">{formatCurrency(p.customerPrice)}</TD>
                    <TD className="num text-muted">
                      {formatCurrency(p.distributorPrice)}
                    </TD>
                    <TD>
                      <div className="flex items-center gap-2">
                        <span className="num">{p.stock}</span>
                        {/* <StockBadge status={stockStatus(p.stock, p.minStock)} /> */}
                      </div>
                    </TD>
                    {/* <TD><StatusBadge status={p.status} /></TD> */}
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAdjusting(p)}
                        >
                          <SlidersHorizontal size={13} />{" "}
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
      />
      {deleting && (
        <ConfirmDialog
          open={!!deleting}
          onClose={() => setDeleting(null)}
          itemName={deleting.name}
          onConfirm={() => {
            deleteProduct(deleting.id);
            toast({
              variant: "success",
              title: t("toast.deletedTitle"),
              description: t("toast.deletedDesc", { item: deleting.name }),
            });
          }}
        />
      )}

      <Dialog
        open={!!adjusting}
        onClose={() => setAdjusting(null)}
        title={
          adjusting
            ? t("productInventory.adjustTitle", { name: adjusting.name })
            : ""
        }
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setAdjusting(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={submitAdjust}>{t("common.save")}</Button>
          </>
        }
      >
        <FieldGroup>
          <FieldLabel required>{t("common.quantity")}</FieldLabel>
          <Input
            type="number"
            value={adjQty}
            onChange={(e) => setAdjQty(e.target.value)}
          />
        </FieldGroup>
      </Dialog>

      <Dialog
        open={!!historyFor}
        onClose={() => setHistoryFor(null)}
        title={
          historyFor
            ? t("productInventory.historyTitle", { name: historyFor.name })
            : ""
        }
        size="md"
      >
        {(() => {
          const history = historyFor
            ? (stockHistory[`product:${historyFor.id}`] ?? [])
            : [];
          if (history.length === 0)
            return (
              <p className="py-6 text-center text-xs text-muted">
                {t("productInventory.historyEmpty")}
              </p>
            );
          return (
            <div className="space-y-2">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-md border border-line px-3 py-2.5 text-[13px]"
                >
                  <div>
                    <p className="text-ink">{h.reason}</p>
                    <p className="text-[11px] text-muted">
                      {formatDate(h.date)}
                    </p>
                  </div>
                  <span
                    className={
                      h.type === "increase" ? "text-success" : "text-danger"
                    }
                  >
                    {h.type === "increase" ? "+" : "−"}
                    {h.quantity}
                  </span>
                </div>
              ))}
            </div>
          );
        })()}
      </Dialog>
    </div>
  );
}
