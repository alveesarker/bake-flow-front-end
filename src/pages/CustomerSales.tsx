import { useEffect, useMemo, useState } from "react";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  CakeSlice,
  Cookie,
  Croissant,
  Sandwich,
  Coffee,
  Snowflake,
  Package,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "../i18n/I18nContext";
import { useToast } from "../hooks/useToast";
import { PageHeader, SearchInput, EmptyState } from "../components/ui/Misc";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { FieldGroup, FieldLabel, Input, Select } from "../components/ui/Field";
import { formatCurrency } from "../lib/utils";

const API_BASE = "http://localhost:5000/api";

type PaymentMethod = "cash" | "card" | "mobileBanking";

const PAYMENT_METHOD_API_VALUE: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  mobileBanking: "Mobile Banking",
};

interface ApiCustomerProduct {
  product_id: number;
  product_name: string;
  product_code: string;
  category_name: string;
  customer_price: string;
  stock_quantity: number;
}

interface Product {
  id: number;
  name: string;
  code: string;
  category: string;
  customerPrice: number;
  stock: number;
}

interface CartLine {
  productId: number;
  quantity: number;
  unitPrice: number;
}

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Cake: CakeSlice,
  Cookies: Cookie,
  Biscuit: Cookie,
  Bread: Croissant,
  Pastry: Croissant,
  Snacks: Sandwich,
  Beverages: Coffee,
  "Frozen Food": Snowflake,
};

function getCategoryIcon(category: string): LucideIcon {
  return CATEGORY_ICON_MAP[category] ?? Package;
}

function mapApiProduct(p: ApiCustomerProduct): Product {
  return {
    id: p.product_id,
    name: p.product_name,
    code: p.product_code,
    category: p.category_name,
    customerPrice: Number(p.customer_price),
    stock: p.stock_quantity,
  };
}

export default function CustomerSales() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<{ id: string; items: number; total: number } | null>(null);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    setProductsError(null);
    try {
      const res = await fetch(`${API_BASE}/products/customer-products`);
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to load products");
      const mapped: Product[] = (json.data as ApiCustomerProduct[]).map(mapApiProduct);
      setProducts(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load products";
      setProductsError(message);
      toast({ variant: "error", title: t("common.error") || "Error", description: message });
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availableProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (productId: number) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (existing) {
        return prev.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l));
      }
      const product = products.find((p) => p.id === productId);
      return [...prev, { productId, quantity: 1, unitPrice: product?.customerPrice ?? 0 }];
    });
  };

  const updateQty = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, quantity: Math.max(1, l.quantity + delta) } : l))
        .filter((l) => l.quantity > 0)
    );
  };

  const setQty = (productId: number, quantity: number) => {
    setCart((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, quantity: Math.max(1, quantity || 1) } : l))
    );
  };

  const setUnitPrice = (productId: number, unitPrice: number) => {
    setCart((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, unitPrice: Math.max(0, unitPrice || 0) } : l))
    );
  };

  const removeLine = (productId: number) => setCart((prev) => prev.filter((l) => l.productId !== productId));

  const lines = useMemo(
    () =>
      cart.map((l) => {
        const product = products.find((p) => p.id === l.productId)!;
        return {
          ...l,
          product,
          lineTotal: l.unitPrice * l.quantity,
          exceedsStock: product ? l.quantity > product.stock : false,
        };
      }),
    [cart, products]
  );

  const hasStockWarning = lines.some((l) => l.exceedsStock);

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const total = Math.max(0, subtotal - discount);
  const itemCount = cart.reduce((sum, l) => sum + l.quantity, 0);

  const complete = async () => {
    if (cart.length === 0 || submitting || hasStockWarning) return;
    setSubmitting(true);
    try {
      const body = {
        payment_method: PAYMENT_METHOD_API_VALUE[paymentMethod],
        discount,
        total_amount: total,
        sale_items: lines.map((l) => ({
          product_id: l.productId,
          quantity: l.quantity,
          unit_price: l.unitPrice,
        })),
      };

      const res = await fetch(`${API_BASE}/customer-sale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const json = await res.json();
      if (json.success === false) throw new Error(json.message || "Failed to complete sale");

      const saleId: string = `CS-${json.sale_id}`;

      setReceipt({ id: saleId, items: itemCount, total });
      toast({ variant: "success", title: t("toast.saleCompleteTitle"), description: t("toast.saleCompleteDesc") });
      setCart([]);
      setDiscount(0);
      fetchProducts();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to complete sale";
      toast({ variant: "error", title: t("common.error") || "Error", description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title={t("customerSales.title")} subtitle={t("customerSales.subtitle")} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="border-b border-line p-4">
              <SearchInput value={search} onChange={setSearch} placeholder={t("customerSales.searchPlaceholder")} />
            </div>
            <div className="p-4">
              {loadingProducts ? (
                <div className="flex items-center justify-center gap-2 py-10 text-muted">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">{t("common.loading") || "Loading..."}</span>
                </div>
              ) : productsError ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <AlertTriangle size={20} className="text-danger" />
                  <p className="text-sm text-muted">{productsError}</p>
                  <Button variant="outline" size="sm" onClick={fetchProducts}>
                    {t("common.retry") || "Retry"}
                  </Button>
                </div>
              ) : availableProducts.length === 0 ? (
                <EmptyState title={t("customerSales.noProducts")} />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {availableProducts.map((p) => {
                    const Icon = getCategoryIcon(p.category);
                    const outOfStock = p.stock <= 0;
                    return (
                      <button
                        key={p.id}
                        onClick={() => addToCart(p.id)}
                        className="group flex flex-col items-start rounded-md border border-line p-3 text-left transition-colors hover:border-ink hover:bg-mist/50"
                      >
                        <span className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-md bg-mist text-ink">
                          <Icon size={18} />
                        </span>
                        <p className="text-[13px] font-medium leading-tight text-ink">{p.name}</p>
                        <p className="mt-1 num text-sm font-semibold text-ink">{formatCurrency(p.customerPrice)}</p>
                        <p className={`text-[11px] ${outOfStock ? "text-danger" : "text-muted"}`}>
                          {p.stock} {t("common.inStock").toLowerCase()}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        <div>
          <Card className="flex flex-col">
            <div className="flex items-center gap-2 border-b border-line px-4 py-3.5">
              <ShoppingCart size={16} className="text-ink" />
              <p className="font-display text-[15px] font-semibold text-ink">{t("customerSales.cart")}</p>
              {itemCount > 0 && <span className="ml-auto rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-white">{itemCount}</span>}
            </div>

            <div className="max-h-[420px] flex-1 space-y-2.5 overflow-y-auto p-4">
              {lines.length === 0 ? (
                <EmptyState title={t("customerSales.emptyCart")} hint={t("customerSales.emptyCartHint")} />
              ) : (
                lines.map((l) => {
                  const Icon = getCategoryIcon(l.product.category);
                  return (
                    <div key={l.productId} className="rounded-md border border-line p-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-mist text-ink">
                          <Icon size={15} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-ink">{l.product.name}</p>
                          <p className="num text-xs text-muted">{l.product.stock} {t("common.inStock").toLowerCase()}</p>
                        </div>
                        <button onClick={() => removeLine(l.productId)} className="text-muted hover:text-danger" aria-label={t("customerSales.remove")}>
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(l.productId, -1)}>
                            <Minus size={12} />
                          </Button>
                          <Input
                            type="number"
                            min={1}
                            value={l.quantity}
                            onChange={(e) => setQty(l.productId, Number(e.target.value))}
                            className={`num h-6 w-14 px-1 text-center text-xs ${l.exceedsStock ? "border-danger text-danger" : ""}`}
                          />
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(l.productId, 1)}>
                            <Plus size={12} />
                          </Button>
                        </div>

                        <div className="flex flex-1 items-center gap-1">
                          <span className="text-xs text-muted">TK</span>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={l.unitPrice}
                            onChange={(e) => setUnitPrice(l.productId, Number(e.target.value))}
                            className="num h-6 flex-1 px-1.5 text-right text-xs"
                          />
                        </div>
                      </div>

                      {l.exceedsStock && (
                        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-danger">
                          <AlertTriangle size={12} />
                          <span>
                            {t("customerSales.exceedsStock") || `Only ${l.product.stock} in stock`}
                          </span>
                        </div>
                      )}

                      <div className="mt-1.5 flex justify-end">
                        <span className="num text-xs font-semibold text-ink">{formatCurrency(l.lineTotal)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="space-y-3 border-t border-line p-4">
              <FieldGroup className="mb-0">
                <FieldLabel>{t("customerSales.discount")}</FieldLabel>
                <Input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
              </FieldGroup>
              <FieldGroup className="mb-0">
                <FieldLabel>{t("customerSales.paymentMethod")}</FieldLabel>
                <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                  <option value="cash">{t("customerSales.cash")}</option>
                  <option value="card">{t("customerSales.card")}</option>
                  <option value="mobileBanking">{t("customerSales.mobileBanking")}</option>
                </Select>
              </FieldGroup>

              {hasStockWarning && (
                <div className="flex items-center gap-1.5 rounded-md bg-danger-bg px-2.5 py-2 text-[11px] text-danger">
                  <AlertTriangle size={13} />
                  <span>{t("customerSales.stockWarningBanner") || "One or more items exceed available stock."}</span>
                </div>
              )}

              <div className="space-y-1 border-t border-line pt-3 text-sm">
                <div className="flex justify-between text-muted">
                  <span>{t("common.subtotal")}</span>
                  <span className="num">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between font-semibold text-ink">
                  <span>{t("common.grandTotal")}</span>
                  <span className="num">{formatCurrency(total)}</span>
                </div>
              </div>

              <Button className="w-full" size="sm" disabled={cart.length === 0 || submitting || hasStockWarning} onClick={complete}>
                {submitting ? <Loader2 size={14} className="animate-spin" /> : t("customerSales.completeSale")}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Dialog
        open={!!receipt}
        onClose={() => setReceipt(null)}
        title={t("customerSales.receiptTitle")}
        size="sm"
        footer={<Button className="w-full" onClick={() => setReceipt(null)}>{t("customerSales.newSale")}</Button>}
      >
        {receipt && (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success-bg">
              <CheckCircle2 size={22} className="text-success" />
            </div>
            <p className="text-sm text-muted">
              {t("customerSales.receiptDesc", { id: receipt.id, items: receipt.items, total: formatCurrency(receipt.total) })}
            </p>
          </div>
        )}
      </Dialog>
    </div>
  );
}