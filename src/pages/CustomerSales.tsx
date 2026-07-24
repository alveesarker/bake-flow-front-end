import { useMemo, useState } from "react";
import { Minus, Plus, Trash2, ShoppingCart, CheckCircle2 } from "lucide-react";
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

interface CartLine {
  productId: string;
  quantity: number;
}

export default function CustomerSales() {
  const { t } = useTranslation();
  const { products, completeCustomerSale } = useDataStore();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [receipt, setReceipt] = useState<{ id: string; items: number; total: number } | null>(null);

  const availableProducts = products.filter(
    (p) => p.status === "active" && p.stock > 0 && p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (existing) return prev.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, quantity: Math.max(1, l.quantity + delta) } : l))
        .filter((l) => l.quantity > 0)
    );
  };

  const removeLine = (productId: string) => setCart((prev) => prev.filter((l) => l.productId !== productId));

  const lines = useMemo(
    () =>
      cart.map((l) => {
        const product = products.find((p) => p.id === l.productId)!;
        return { ...l, product, lineTotal: product.customerPrice * l.quantity };
      }),
    [cart, products]
  );

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const total = Math.max(0, subtotal - discount);
  const itemCount = cart.reduce((sum, l) => sum + l.quantity, 0);

  const complete = () => {
    if (cart.length === 0) return;
    const id = `CS-${9000 + Math.floor(Math.random() * 900) + 100}`;
    completeCustomerSale({
      date: new Date().toISOString().slice(0, 10),
      items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.product.customerPrice })),
      discount,
      paymentMethod,
      total,
    });
    setReceipt({ id, items: itemCount, total });
    toast({ variant: "success", title: t("toast.saleCompleteTitle"), description: t("toast.saleCompleteDesc") });
    setCart([]);
    setDiscount(0);
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
              {availableProducts.length === 0 ? (
                <EmptyState title={t("customerSales.noProducts")} />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {availableProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p.id)}
                      className="group flex flex-col items-start rounded-md border border-line p-3 text-left transition-colors hover:border-ink hover:bg-mist/50"
                    >
                      <span className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-md bg-mist text-xl">{p.image}</span>
                      <p className="text-[13px] font-medium leading-tight text-ink">{p.name}</p>
                      <p className="mt-1 num text-sm font-semibold text-ink">{formatCurrency(p.customerPrice)}</p>
                      <p className="text-[11px] text-muted">{p.stock} {t("common.inStock").toLowerCase()}</p>
                    </button>
                  ))}
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

            <div className="max-h-[360px] flex-1 space-y-2.5 overflow-y-auto p-4">
              {lines.length === 0 ? (
                <EmptyState title={t("customerSales.emptyCart")} hint={t("customerSales.emptyCartHint")} />
              ) : (
                lines.map((l) => (
                  <div key={l.productId} className="flex items-center gap-2.5 rounded-md border border-line p-2.5">
                    <span className="text-lg">{l.product.image}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">{l.product.name}</p>
                      <p className="num text-xs text-muted">{formatCurrency(l.product.customerPrice)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(l.productId, -1)}>
                        <Minus size={12} />
                      </Button>
                      <span className="num w-5 text-center text-xs">{l.quantity}</span>
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(l.productId, 1)}>
                        <Plus size={12} />
                      </Button>
                    </div>
                    <button onClick={() => removeLine(l.productId)} className="text-muted hover:text-danger" aria-label={t("customerSales.remove")}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
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

              <Button className="w-full" size="md" disabled={cart.length === 0} onClick={complete}>
                {t("customerSales.completeSale")}
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
