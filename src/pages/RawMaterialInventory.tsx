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
import type { RawMaterial } from "../types";

export default function RawMaterialInventory() {
  const { t } = useTranslation();
  const { rawMaterials, adjustMaterialStock, stockHistory } = useDataStore();
  const { toast } = useToast();
  const [status, setStatus] = useState("all");
  const [adjusting, setAdjusting] = useState<RawMaterial | null>(null);
  const [historyFor, setHistoryFor] = useState<RawMaterial | null>(null);
  const [adjType, setAdjType] = useState<"increase" | "decrease">("increase");
  const [adjQty, setAdjQty] = useState("");
  const [adjReason, setAdjReason] = useState("");

  const filtered = rawMaterials.filter((m) => status === "all" || stockStatus(m.currentStock, m.minStock) === status);
  const table = useTableData(filtered, { searchFields: (m) => [m.name, m.code], pageSize: 8 });

  const submitAdjust = () => {
    if (!adjusting || !adjQty) return;
    adjustMaterialStock(adjusting.id, adjType, Number(adjQty), adjReason);
    toast({ variant: "success", title: t("toast.stockAdjustedTitle"), description: t("toast.stockAdjustedDesc") });
    setAdjusting(null); setAdjQty(""); setAdjReason("");
  };

  return (
    <div>
      <PageHeader title={t("rawMaterialInventory.title")} subtitle={t("rawMaterialInventory.subtitle")} />

      <Card>
        <div className="flex flex-wrap items-center gap-2.5 border-b border-line p-4">
          <SearchInput value={table.search} onChange={table.setSearch} placeholder={t("rawMaterials.searchPlaceholder")} />
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
                  <TH>{t("rawMaterialInventory.columns.material")}</TH>
                  <TH sortable sortDir={table.sortKey === "currentStock" ? table.sortDir : null} onClick={() => table.toggleSort("currentStock")}>
                    {t("rawMaterialInventory.columns.currentStock")}
                  </TH>
                  <TH>{t("rawMaterialInventory.columns.minStock")}</TH>
                  <TH>{t("rawMaterialInventory.columns.status")}</TH>
                  <TH className="text-right">{t("common.actions")}</TH>
                </TR>
              </THead>
              <TBody>
                {table.rows.map((m) => (
                  <TR key={m.id}>
                    <TD className="font-medium">{m.name}</TD>
                    <TD className="num">{m.currentStock} {m.unit}</TD>
                    <TD className="num text-muted">{m.minStock} {m.unit}</TD>
                    <TD><StockBadge status={stockStatus(m.currentStock, m.minStock)} /></TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => setAdjusting(m)}>
                          <SlidersHorizontal size={13} /> {t("productInventory.adjustStock")}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setHistoryFor(m)} aria-label={t("productInventory.history")}>
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
            <option value="increase">{t("productInventory.increase")}</option>
            <option value="decrease">{t("productInventory.decrease")}</option>
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
      >
        {(() => {
          const history = historyFor ? stockHistory[`material:${historyFor.id}`] ?? [] : [];
          if (history.length === 0) return <p className="py-6 text-center text-xs text-muted">{t("productInventory.historyEmpty")}</p>;
          return (
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-md border border-line px-3 py-2.5 text-[13px]">
                  <div>
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
