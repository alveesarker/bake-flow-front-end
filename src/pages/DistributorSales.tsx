import { useMemo, useState } from "react";
import { Trash2, Truck, CheckCircle2 } from "lucide-react";
import { useTranslation } from "../i18n/I18nContext";
import { useDataStore } from "../store/DataStore";
import { useToast } from "../hooks/useToast";
import { PageHeader, SearchInput, EmptyState } from "../components/ui/Misc";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { FieldGroup, FieldLabel, Input, Select } from "../components/ui/Field";
import { formatCurrency } from "../lib/utils";
import type { PaymentMethod } from "../types";

interface OrderLine {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export default function DistributorSales() {
  const { t } = useTranslation();
  const { products, distributors, completeDistributorSale } = useDataStore();
  const { toast } = useToast();
  const [distributorId, setDistributorId] = useState("");
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState<OrderLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [receipt, setReceipt] = useState<{ id: string; total: number } | null>(null);

  const availableProducts = products.filter(
    (p) => p.status === "active" && p.stock > 0 && p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addProduct = (productId: string) => {
    setOrder((prev) => {
      if (prev.find((l) => l.productId === productId)) return prev;
      const product = products.find((p) => p.id === productId)!;
      return [...prev, { productId, quantity: 1, unitPrice: product.distributorPrice }];
    });
  };

  const updateLine = (productId: string, patch: Partial<OrderLine>) =>
    setOrder((prev) => prev.map((l) => (l.productId === productId ? { ...l, ...patch } : l)));

  const removeLine = (productId: string) => setOrder((prev) => prev.filter((l) => l.productId !== productId));

  const lines = useMemo(
    () =>
      order.map((l) => ({
        ...l,
        product: products.find((p) => p.id === l.productId)!,
        lineTotal: l.quantity * l.unitPrice,
      })),
    [order, products]
  );

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const total = Math.max(0, subtotal - discount);

  const complete = () => {
    if (!distributorId || order.length === 0) return;
    const id = `DS-${5000 + Math.floor(Math.random() * 900) + 100}`;
    completeDistributorSale({
      distributorId,
      date: new Date().toISOString().slice(0, 10),
      items: order,
      discount,
      paymentMethod,
      total,
    });
    setReceipt({ id, total });
    toast({ variant: "success", title: t("toast.saleCompleteTitle"), description: t("toast.saleCompleteDesc") });
    setOrder([]);
    setDiscount(0);
    setDistributorId("");
  };

  return (
    <div>
      <PageHeader title={t("distributorSales.title")} subtitle={t("distributorSales.subtitle")} />

      <Card className="mb-4">
        <div className="p-4">
          <FieldGroup className="mb-0 max-w-sm">
            <FieldLabel required>{t("distributorSales.selectDistributor")}</FieldLabel>
            <Select value={distributorId} onChange={(e) => setDistributorId(e.target.value)}>
              <option value="">{t("distributorSales.selectDistributorPlaceholder")}</option>
              {distributors.filter((d) => d.status === "active").map((d) => (
                <option key={d.id} value={d.id}>{d.name} — {d.company}</option>
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
                      key={p.id}
                      onClick={() => addProduct(p.id)}
                      className="group flex flex-col items-start rounded-md border border-line p-3 text-left transition-colors hover:border-ink hover:bg-mist/50"
                    >
                      <span className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-md bg-mist text-xl">{p.image}</span>
                      <p className="text-[13px] font-medium leading-tight text-ink">{p.name}</p>
                      <p className="mt-1 num text-sm font-semibold text-ink">{formatCurrency(p.distributorPrice)}</p>
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
                  lines.map((l) => (
                    <div key={l.productId} className="rounded-md border border-line p-2.5">
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="text-lg">{l.product.image}</span>
                        <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">{l.product.name}</p>
                        <button onClick={() => removeLine(l.productId)} className="text-muted hover:text-danger">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          className="h-7 text-xs"
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
                    </div>
                  ))
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
                    <option value="cash">{t("customerSales.cash")}</option>
                    <option value="card">{t("customerSales.card")}</option>
                    <option value="mobileBanking">{t("customerSales.mobileBanking")}</option>
                  </Select>
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
                </div>
                <Button className="w-full" disabled={order.length === 0} onClick={complete}>
                  {t("distributorSales.completeSale")}
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
