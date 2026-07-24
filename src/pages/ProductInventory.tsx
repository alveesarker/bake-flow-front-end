import { useState } from "react";
import { History, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "../i18n/I18nContext";
import { useDataStore, stockStatus } from "../store/DataStore";
import { useToast } from "../hooks/useToast";
import { useTableData } from "../hooks/useTableData";
import { PageHeader, SearchInput, EmptyState, Pagination } from "../components/ui/Misc";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { FieldGroup, FieldLabel, Input, Select, Textarea } from "../components/ui/Field";
import { StockBadge } from "../components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD, TableWrap } from "../components/ui/Table";
import { formatDate } from "../lib/utils";
import type { Product } from "../types";

export default function ProductInventory() {
  const { t } = useTranslation();
  const { products, adjustProductStock, stockHistory } = useDataStore();
  const { toast } = useToast();
  const [status, setStatus] = useState("all");
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [historyFor, setHistoryFor] = useState<Product | null>(null);
  const [adjType, setAdjType] = useState<"increase" | "decrease">("increase");
  const [adjQty, setAdjQty] = useState("");
  const [adjReason, setAdjReason] = useState("");

  const filtered = products.filter((p) => status === "all" || stockStatus(p.stock, p.minStock) === status);
  const table = useTableData(filtered, { searchFields: (p) => [p.name, p.code], pageSize: 8 });

  const submitAdjust = () => {
    if (!adjusting || !adjQty) return;
    adjustProductStock(adjusting.id, adjType, Number(adjQty), adjReason);
    toast({ variant: "success", title: t("toast.stockAdjustedTitle"), description: t("toast.stockAdjustedDesc") });
    setAdjusting(null);
    setAdjQty("");
    setAdjReason("");
  };

  return (
    <div>
      <PageHeader title={t("productInventory.title")} subtitle={t("productInventory.subtitle")} />

      <Card>
        <div className="flex flex-wrap items-center gap-2.5 border-b border-line p-4">
          <SearchInput value={table.search} onChange={table.setSearch} placeholder={t("products.searchPlaceholder")} />
          <Select className="!h-9 w-auto max-w-[160px]" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">{t("common.allStatuses")}</option>
            <option value="inStock">{t("common.inStock")}</option>
            <option value="lowStock">{t("common.lowStock")}</option>
            <option value="outOfStock">{t("common.outOfStock")}</option>
          </Select>
        </div>

        {table.rows.length === 0 ? (
          <EmptyState title={t("common.noResults")} hint={t("common.noResultsHint")} />
        ) : (
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH>{t("productInventory.columns.product")}</TH>
                  <TH sortable sortDir={table.sortKey === "stock" ? table.sortDir : null} onClick={() => table.toggleSort("stock")}>
                    {t("productInventory.columns.currentStock")}
                  </TH>
                  <TH>{t("productInventory.columns.minStock")}</TH>
                  <TH>{t("productInventory.columns.status")}</TH>
                  <TH className="text-right">{t("common.actions")}</TH>
                </TR>
              </THead>
              <TBody>
                {table.rows.map((p) => (
                  <TR key={p.id}>
                    <TD className="font-medium">
                      <span className="mr-2">{p.image}</span>{p.name}
                    </TD>
                    <TD className="num">{p.stock} {p.unit}</TD>
                    <TD className="num text-muted">{p.minStock} {p.unit}</TD>
                    <TD><StockBadge status={stockStatus(p.stock, p.minStock)} /></TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => setAdjusting(p)}>
                          <SlidersHorizontal size={13} /> {t("productInventory.adjustStock")}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setHistoryFor(p)} aria-label={t("productInventory.history")}>
                          <History size={15} />
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

      <Dialog
        open={!!adjusting}
        onClose={() => setAdjusting(null)}
        title={adjusting ? t("productInventory.adjustTitle", { name: adjusting.name }) : ""}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setAdjusting(null)}>{t("common.cancel")}</Button>
            <Button onClick={submitAdjust}>{t("common.save")}</Button>
          </>
        }
      >
        <FieldGroup>
          <FieldLabel required>{t("productInventory.adjustType")}</FieldLabel>
          <Select value={adjType} onChange={(e) => setAdjType(e.target.value as "increase" | "decrease")}>
            <option className="h-[35px]" value="increase">{t("productInventory.increase")}</option>
            <option className="h-[35px]" value="decrease">{t("productInventory.decrease")}</option>
          </Select>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel required>{t("common.quantity")}</FieldLabel>
          <Input type="number" value={adjQty} onChange={(e) => setAdjQty(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel required>{t("productInventory.adjustReason")}</FieldLabel>
          <Textarea placeholder={t("productInventory.adjustReasonPlaceholder")} value={adjReason} onChange={(e) => setAdjReason(e.target.value)} />
        </FieldGroup>
      </Dialog>

      <Dialog
        open={!!historyFor}
        onClose={() => setHistoryFor(null)}
        title={historyFor ? t("productInventory.historyTitle", { name: historyFor.name }) : ""}
        size="md"
      >
        {(() => {
          const history = historyFor ? stockHistory[`product:${historyFor.id}`] ?? [] : [];
          if (history.length === 0) return <p className="py-6 text-center text-xs text-muted">{t("productInventory.historyEmpty")}</p>;
          return (
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-md border border-line px-3 py-2.5 text-[13px]">
                  <div>
                    <p className="text-ink">{h.reason}</p>
                    <p className="text-[11px] text-muted">{formatDate(h.date)}</p>
                  </div>
                  <span className={h.type === "increase" ? "text-success" : "text-danger"}>
                    {h.type === "increase" ? "+" : "−"}{h.quantity}
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
