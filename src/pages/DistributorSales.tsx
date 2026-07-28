import { useEffect, useMemo, useState } from "react";
import { Trash2, Truck, CheckCircle2 } from "lucide-react";
import { useTranslation } from "../i18n/I18nContext";
import { useToast } from "../hooks/useToast";
import { PageHeader, SearchInput, EmptyState } from "../components/ui/Misc";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { FieldGroup, FieldLabel, Input, Select } from "../components/ui/Field";
import { formatCurrency } from "../lib/utils";

const API_BASE = "http://localhost:5000/api";

const CATEGORY_ICONS: Record<string, string> = {
  "Frozen Food": "🧊",
  Beverages: "🥤",
  Snacks: "🥟",
  Biscuit: "🍪",
  Cookies: "🍪",
  Pastry: "🥐",
  Cake: "🍰",
  Bread: "🍞",
};

const getCategoryIcon = (category: string) => CATEGORY_ICONS[category] ?? "🧁";

type PaymentMethod = "Cash" | "Card" | "Mobile Banking";

interface Distributor {
  distributor_id: number;
  name: string;
}

interface DistributorProduct {
  product_id: number;
  product_name: string;
  product_code: string;
  category_name: string;
  distributor_price: string;
  stock_quantity: number;
}

interface OrderLine {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export default function DistributorSales() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [products, setProducts] = useState<DistributorProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [distributorId, setDistributorId] = useState("");
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState<OrderLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [paidAmount, setPaidAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<{ id: string; total: number } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [distRes, prodRes] = await Promise.all([
          fetch(`${API_BASE}/distributor/distributor-name`),
          fetch(`${API_BASE}/products/distributor-products`),
        ]);
        const distJson = await distRes.json();
        const prodJson = await prodRes.json();

        if (distJson.success) setDistributors(distJson.data);
        if (prodJson.success) setProducts(prodJson.data);
      } catch (err) {
        toast({
          variant: "error",
          title: t("toast.errorTitle") ?? "Error",
          description: "Failed to load distributor data.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availableProducts = products.filter(
    (p) => p.stock_quantity > 0 && p.product_name.toLowerCase().includes(search.toLowerCase())
  );

  const addProduct = (productId: number) => {
    setOrder((prev) => {
      if (prev.find((l) => l.productId === productId)) return prev;
      const product = products.find((p) => p.product_id === productId)!;
      return [...prev, { productId, quantity: 1, unitPrice: Number(product.distributor_price) }];
    });
  };

  const updateLine = (productId: number, patch: Partial<OrderLine>) =>
    setOrder((prev) => prev.map((l) => (l.productId === productId ? { ...l, ...patch } : l)));

  const removeLine = (productId: number) => setOrder((prev) => prev.filter((l) => l.productId !== productId));

  const lines = useMemo(
    () =>
      order.map((l) => ({
        ...l,
        product: products.find((p) => p.product_id === l.productId)!,
        lineTotal: l.quantity * l.unitPrice,
      })),
    [order, products]
  );

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const total = Math.max(0, subtotal - discount);
  const dueAmount = Math.max(0, total - paidAmount);
  const hasOverStock = lines.some((l) => l.quantity > l.product.stock_quantity);
  const isOverpaid = paidAmount > total;

  const complete = async () => {
    if (!distributorId || order.length === 0 || hasOverStock || isOverpaid) return;

    try {
      setSubmitting(true);
      const body = {
        distributor_id: Number(distributorId),
        payment_method: paymentMethod,
        discount,
        total_amount: total,
        paid_amount: paidAmount,
        sale_items: order.map((l) => ({
          product_id: l.productId,
          quantity: l.quantity,
          unit_price: l.unitPrice,
        })),
      };

      const res = await fetch(`${API_BASE}/distributor-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Order failed");
      }

      const orderId = json.sale_id ?? `DS-${Date.now()}`;
      setReceipt({ id: `DS-${orderId}`, total });
      toast({ variant: "success", title: t("toast.saleCompleteTitle"), description: t("toast.saleCompleteDesc") });

      setOrder([]);
      setDiscount(0);
      setPaidAmount(0);
      setDistributorId("");
    } catch (err: any) {
      toast({
        variant: "error",
        title: t("toast.errorTitle") ?? "Error",
        description: err?.message || "Failed to complete sale.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title={t("nav.order")} subtitle={t("distributorSales.subtitle")} />

      <Card className="mb-4">
        <div className="p-4">
          <FieldGroup className="mb-0 max-w-sm">
            <FieldLabel required>{t("distributorSales.selectDistributor")}</FieldLabel>
            <Select value={distributorId} onChange={(e) => setDistributorId(e.target.value)} disabled={loading}>
              <option value="">{t("distributorSales.selectDistributorPlaceholder")}</option>
              {distributors.map((d) => (
                <option key={d.distributor_id} value={d.distributor_id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </FieldGroup>
        </div>
      </Card>

      {!distributorId ? (
        <Card>
          <EmptyState title={t("distributorSales.selectDistributorFirst")} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <div className="border-b border-line p-4">
                <SearchInput value={search} onChange={setSearch} placeholder={t("distributorSales.searchPlaceholder")} />
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {availableProducts.map((p) => (
                    <button
                      key={p.product_id}
                      onClick={() => addProduct(p.product_id)}
                      className="group flex flex-col items-start rounded-md border border-line p-3 text-left transition-colors hover:border-ink hover:bg-mist/50"
                    >
                      <span className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-md bg-mist text-xl">
                        {getCategoryIcon(p.category_name)}
                      </span>
                      <p className="text-[13px] font-medium leading-tight text-ink">{p.product_name}</p>
                      <p className="mt-1 num text-sm font-semibold text-ink">
                        {formatCurrency(Number(p.distributor_price))}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <div>
            <Card className="flex flex-col">
              <div className="flex items-center gap-2 border-b border-line px-4 py-3.5">
                <Truck size={16} className="text-ink" />
                <p className="font-display text-[15px] font-semibold text-ink">{t("distributorSales.order")}</p>
              </div>
              <div className="max-h-[320px] flex-1 space-y-2.5 overflow-y-auto p-4">
                {lines.length === 0 ? (
                  <EmptyState title={t("distributorSales.emptyOrder")} hint={t("distributorSales.emptyOrderHint")} />
                ) : (
                  lines.map((l) => {
                    const overStock = l.quantity > l.product.stock_quantity;
                    return (
                      <div key={l.productId} className="rounded-md border border-line p-2.5">
                        <div className="mb-1.5 flex items-center gap-2">
                          <span className="text-lg">{getCategoryIcon(l.product.category_name)}</span>
                          <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                            {l.product.product_name}
                          </p>
                          <button onClick={() => removeLine(l.productId)} className="text-muted hover:text-danger">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            className={`h-7 text-xs ${overStock ? "border-danger text-danger" : ""}`}
                            value={l.quantity}
                            min={1}
                            onChange={(e) => updateLine(l.productId, { quantity: Number(e.target.value) })}
                          />
                          <Input
                            type="number"
                            className="h-7 text-xs"
                            value={l.unitPrice}
                            onChange={(e) => updateLine(l.productId, { unitPrice: Number(e.target.value) })}
                          />
                        </div>
                        {overStock && (
                          <p className="mt-1 text-[11px] font-medium text-danger">
                            Only {l.product.stock_quantity} in stock
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="space-y-3 border-t border-line p-4">
                <FieldGroup className="mb-0">
                  <FieldLabel>{t("distributorSales.discount")}</FieldLabel>
                  <Input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
                </FieldGroup>
                <FieldGroup className="mb-0">
                  <FieldLabel>{t("distributorSales.paymentMethod")}</FieldLabel>
                  <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                    <option value="Cash">{t("customerSales.cash")}</option>
                    <option value="Card">{t("customerSales.card")}</option>
                    <option value="Mobile Banking">{t("customerSales.mobileBanking")}</option>
                  </Select>
                </FieldGroup>
                <FieldGroup className="mb-0">
                  <FieldLabel>Paid Amount</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    className={isOverpaid ? "border-danger text-danger" : ""}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                  />
                  {isOverpaid && (
                    <p className="mt-1 text-[11px] font-medium text-danger">
                      Paid amount cannot be greater than grand total
                    </p>
                  )}
                </FieldGroup>
                <div className="space-y-1 border-t border-line pt-3 text-sm">
                  <div className="flex justify-between text-muted">
                    <span>{t("common.subtotal")}</span>
                    <span className="num">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-ink">
                    <span>{t("common.grandTotal")}</span>
                    <span className="num">{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-danger">
                    <span>Due Amount</span>
                    <span className="num">{formatCurrency(dueAmount)}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  disabled={order.length === 0 || submitting || hasOverStock || isOverpaid}
                  onClick={complete}
                >
                  {submitting ? "..." : t("distributorSales.completeSale")}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      <Dialog
        open={!!receipt}
        onClose={() => setReceipt(null)}
        title={t("customerSales.receiptTitle")}
        size="sm"
        footer={<Button className="w-full" onClick={() => setReceipt(null)}>{t("common.close")}</Button>}
      >
        {receipt && (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success-bg">
              <CheckCircle2 size={22} className="text-success" />
            </div>
            <p className="num text-sm text-muted">{receipt.id} · {formatCurrency(receipt.total)}</p>
          </div>
        )}
      </Dialog>
    </div>
  );
}