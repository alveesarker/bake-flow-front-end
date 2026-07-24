import { useState } from "react";
import { FileDown, FileSpreadsheet, Printer } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useTranslation } from "../i18n/I18nContext";
import { useDataStore, stockStatus } from "../store/DataStore";
import { useToast } from "../hooks/useToast";
import { PageHeader } from "../components/ui/Misc";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Field";
import { Table, THead, TBody, TR, TH, TD, TableWrap } from "../components/ui/Table";
import { StockBadge } from "../components/ui/Badge";
import { formatCurrency, formatDate } from "../lib/utils";
import { monthlySalesTrend, expenseBreakdown } from "../data/seed";
import { cn } from "../lib/utils";

const tabs = ["sales", "production", "inventory", "expense", "employee"] as const;
type Tab = (typeof tabs)[number];

function ReportActions() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const notify = (label: string) => toast({ variant: "success", title: label, description: undefined });
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={() => notify(t("common.exportPdf"))}><FileDown size={14} /> {t("common.exportPdf")}</Button>
      <Button variant="outline" size="sm" onClick={() => notify(t("common.exportExcel"))}><FileSpreadsheet size={14} /> {t("common.exportExcel")}</Button>
      <Button variant="outline" size="sm" onClick={() => window.print()}><Printer size={14} /> {t("common.print")}</Button>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="num mt-1.5 text-xl font-bold text-ink">{value}</p>
    </Card>
  );
}

export default function Reports() {
  const { t } = useTranslation();
  const { customerSales, distributorSales, productionBatches, products, rawMaterials, expenses, employees } = useDataStore();
  const [tab, setTab] = useState<Tab>("sales");
  const [from, setFrom] = useState("2026-07-01");
  const [to, setTo] = useState("2026-07-24");

  const allSales = [...customerSales.map((s) => ({ ...s, kind: "customer" })), ...distributorSales.map((s) => ({ ...s, kind: "distributor" }))];
  const totalRevenue = allSales.reduce((sum, s) => sum + s.total, 0);
  const avgOrder = allSales.length ? totalRevenue / allSales.length : 0;

  const totalUnitsProduced = productionBatches.reduce((s, b) => s + b.quantity, 0);
  const stockValue = products.reduce((s, p) => s + p.stock * p.customerPrice, 0);
  const lowStockItems = products.filter((p) => stockStatus(p.stock, p.minStock) !== "inStock").length +
    rawMaterials.filter((m) => stockStatus(m.currentStock, m.minStock) !== "inStock").length;

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const topCategory = [...expenseBreakdown].sort((a, b) => b.value - a.value)[0];

  const totalPayroll = employees.filter((e) => e.status === "active").reduce((s, e) => s + e.salary, 0);

  return (
    <div>
      <PageHeader title={t("reports.title")} subtitle={t("reports.subtitle")} action={<ReportActions />} />

      <div className="mb-4 flex flex-wrap items-center gap-1 rounded-md border border-line bg-paper p-1">
        {tabs.map((tKey) => (
          <button
            key={tKey}
            onClick={() => setTab(tKey)}
            className={cn(
              "rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              tab === tKey ? "bg-ink text-white" : "text-muted hover:bg-mist hover:text-ink"
            )}
          >
            {t(`reports.tabs.${tKey}`)}
          </button>
        ))}
      </div>

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <span className="text-xs font-medium text-muted">{t("reports.generatedFor")}</span>
          <Input type="date" className="w-auto" value={from} onChange={(e) => setFrom(e.target.value)} />
          <span className="text-xs text-muted">{t("common.to")}</span>
          <Input type="date" className="w-auto" value={to} onChange={(e) => setTo(e.target.value)} />
          <Button size="sm" variant="secondary">{t("common.apply")}</Button>
        </div>
      </Card>

      {tab === "sales" && (
        <>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <StatBlock label={t("reports.totalRevenue")} value={formatCurrency(totalRevenue)} />
            <StatBlock label={t("reports.totalOrders")} value={String(allSales.length)} />
            <StatBlock label={t("reports.avgOrderValue")} value={formatCurrency(Math.round(avgOrder))} />
          </div>
          <Card className="mt-4">
            <CardHeader><CardTitle>{t("dashboard.monthlySalesChart")}</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySalesTrend}>
                  <CartesianGrid vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ borderRadius: 10, border: "1px solid #E5E5E5", fontSize: 12 }} />
                  <Bar dataKey="value" fill="#111111" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="mt-4">
            <TableWrap>
              <Table>
                <THead><TR><TH>ID</TH><TH>{t("common.date")}</TH><TH>{t("common.amount")}</TH></TR></THead>
                <TBody>
                  {allSales.slice(0, 10).map((s) => (
                    <TR key={s.id}><TD className="num">{s.id}</TD><TD className="text-muted">{formatDate(s.date)}</TD><TD className="num">{formatCurrency(s.total)}</TD></TR>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          </Card>
        </>
      )}

      {tab === "production" && (
        <>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <StatBlock label={t("reports.totalUnitsProduced")} value={String(totalUnitsProduced)} />
            <StatBlock label={t("reports.totalBatches")} value={String(productionBatches.length)} />
          </div>
          <Card className="mt-4">
            <TableWrap>
              <Table>
                <THead><TR><TH>{t("production.columns.id")}</TH><TH>{t("production.columns.product")}</TH><TH>{t("production.columns.quantity")}</TH><TH>{t("production.columns.status")}</TH></TR></THead>
                <TBody>
                  {productionBatches.map((b) => {
                    const p = products.find((x) => x.id === b.productId);
                    return (
                      <TR key={b.id}><TD className="num">{b.id}</TD><TD>{p?.name}</TD><TD className="num">{b.quantity}</TD><TD className="text-muted">{t(`production.statuses.${b.status}`)}</TD></TR>
                    );
                  })}
                </TBody>
              </Table>
            </TableWrap>
          </Card>
        </>
      )}

      {tab === "inventory" && (
        <>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <StatBlock label={t("reports.stockValue")} value={formatCurrency(Math.round(stockValue))} />
            <StatBlock label={t("reports.lowStockItems")} value={String(lowStockItems)} />
          </div>
          <Card className="mt-4">
            <TableWrap>
              <Table>
                <THead><TR><TH>{t("productInventory.columns.product")}</TH><TH>{t("productInventory.columns.currentStock")}</TH><TH>{t("productInventory.columns.status")}</TH></TR></THead>
                <TBody>
                  {products.map((p) => (
                    <TR key={p.id}><TD>{p.name}</TD><TD className="num">{p.stock}</TD><TD><StockBadge status={stockStatus(p.stock, p.minStock)} /></TD></TR>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          </Card>
        </>
      )}

      {tab === "expense" && (
        <>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <StatBlock label={t("reports.totalExpenses")} value={formatCurrency(totalExpenses)} />
            <StatBlock label={t("reports.topCategory")} value={t(`expenses.categories.${topCategory.category}`)} />
          </div>
          <Card className="mt-4">
            <TableWrap>
              <Table>
                <THead><TR><TH>{t("expenses.columns.date")}</TH><TH>{t("expenses.columns.category")}</TH><TH>{t("expenses.columns.amount")}</TH></TR></THead>
                <TBody>
                  {expenses.map((e) => (
                    <TR key={e.id}><TD className="text-muted">{formatDate(e.date)}</TD><TD>{t(`expenses.categories.${e.category}`)}</TD><TD className="num">{formatCurrency(e.amount)}</TD></TR>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          </Card>
        </>
      )}

      {tab === "employee" && (
        <>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <StatBlock label={t("reports.totalPayroll")} value={formatCurrency(totalPayroll)} />
            <StatBlock label={t("reports.headcount")} value={String(employees.filter((e) => e.status === "active").length)} />
          </div>
          <Card className="mt-4">
            <TableWrap>
              <Table>
                <THead><TR><TH>{t("employees.columns.name")}</TH><TH>{t("employees.columns.designation")}</TH><TH>{t("employees.columns.salary")}</TH></TR></THead>
                <TBody>
                  {employees.map((e) => (
                    <TR key={e.id}><TD>{e.name}</TD><TD className="text-muted">{t(`employees.designations.${e.designation}`)}</TD><TD className="num">{formatCurrency(e.salary)}</TD></TR>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          </Card>
        </>
      )}
    </div>
  );
}
