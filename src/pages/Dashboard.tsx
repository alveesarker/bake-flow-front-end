import {
  DollarSign,
  CalendarDays,
  Factory,
  Boxes,
  Wheat,
  AlertTriangle,
  PackageX,
  Package,
  UserRound,
  Truck,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { useTranslation } from "../i18n/I18nContext";
import { useDataStore, stockStatus } from "../store/DataStore";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge, StockBadge } from "../components/ui/Badge";
import { PageHeader } from "../components/ui/Misc";
import { formatCurrency, formatNumber, formatDate } from "../lib/utils";
import { monthlySalesTrend } from "../data/seed";
import type { ReactNode } from "react";

function StatCard({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-mist text-ink">{icon}</div>
      </div>
      <p className="mt-3 text-xl font-bold text-ink num">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
      {sub && <p className="mt-1 text-[11px] text-muted">{sub}</p>}
    </Card>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { products, rawMaterials, productionBatches, customerSales, distributors, employees, distributorSales } =
    useDataStore();

  const todaySales = customerSales
    .filter((s) => s.date === "2026-07-24")
    .reduce((sum, s) => sum + s.total, 0);
  const monthlySales = customerSales.reduce((sum, s) => sum + s.total, 0) + distributorSales.reduce((s, d) => s + d.total, 0);
  const todayProductionQty = productionBatches
    .filter((b) => b.date === "2026-07-24")
    .reduce((sum, b) => sum + b.quantity, 0);
  const totalProductStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalMaterialStock = rawMaterials.reduce((sum, m) => sum + m.currentStock, 0);
  const lowStockProducts = products.filter((p) => stockStatus(p.stock, p.minStock) !== "inStock");
  const lowRawMaterials = rawMaterials.filter((m) => stockStatus(m.currentStock, m.minStock) !== "inStock");

  const recentSales = [...customerSales].slice(0, 5);
  const recentProductions = [...productionBatches].slice(0, 5);

  const topSelling = [...products]
    .map((p) => {
      const unitsSold = customerSales
        .flatMap((s) => s.items)
        .filter((i) => i.productId === p.id)
        .reduce((sum, i) => sum + i.quantity, 0);
      return { ...p, unitsSold };
    })
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 5);

  const pieColors = ["#111111", "#6B7280", "#1D4ED8", "#B45309", "#16803D", "#B91C1C"];

  return (
    <div>
      <PageHeader title={t("dashboard.title")} subtitle={t("dashboard.subtitle")} />

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={<DollarSign size={17} />} label={t("dashboard.todaySales")} value={formatCurrency(todaySales)} />
        <StatCard icon={<CalendarDays size={17} />} label={t("dashboard.monthlySales")} value={formatCurrency(monthlySales)} />
        <StatCard icon={<Factory size={17} />} label={t("dashboard.todayProduction")} value={formatNumber(todayProductionQty)} />
        <StatCard icon={<Boxes size={17} />} label={t("dashboard.productStock")} value={formatNumber(totalProductStock)} />
        <StatCard icon={<Wheat size={17} />} label={t("dashboard.rawMaterialStock")} value={formatNumber(Math.round(totalMaterialStock))} />
        <StatCard icon={<AlertTriangle size={17} />} label={t("dashboard.lowStockProducts")} value={String(lowStockProducts.length)} />
        <StatCard icon={<PackageX size={17} />} label={t("dashboard.lowRawMaterials")} value={String(lowRawMaterials.length)} />
        <StatCard icon={<Package size={17} />} label={t("dashboard.totalProducts")} value={String(products.length)} />
        <StatCard icon={<UserRound size={17} />} label={t("dashboard.totalEmployees")} value={String(employees.length)} />
        <StatCard icon={<Truck size={17} />} label={t("dashboard.totalDistributors")} value={String(distributors.length)} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("dashboard.monthlySalesChart")}</CardTitle>
          </CardHeader>
          <CardContent className="h-64 pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySalesTrend} margin={{ left: 8, right: 16 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#111111" stopOpacity={0.14} />
                    <stop offset="100%" stopColor="#111111" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#E5E5E5" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} width={56}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip
                  formatter={(v) => formatCurrency(Number(v))}
                  contentStyle={{ borderRadius: 10, border: "1px solid #E5E5E5", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="value" stroke="#111111" strokeWidth={2} fill="url(#salesFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.recentSales")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {recentSales.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-md border border-line px-3 py-2.5">
                <div>
                  <p className="text-[13px] font-medium text-ink">{s.id}</p>
                  <p className="text-[11px] text-muted">
                    {formatDate(s.date)} · {s.items.reduce((sum, i) => sum + i.quantity, 0)} {t("dashboard.items")}
                  </p>
                </div>
                <p className="num text-sm font-semibold text-ink">{formatCurrency(s.total)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.recentProductions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {recentProductions.map((b) => {
              const product = products.find((p) => p.id === b.productId);
              return (
                <div key={b.id} className="flex items-center justify-between rounded-md border border-line px-3 py-2.5">
                  <div>
                    <p className="text-[13px] font-medium text-ink">{product?.name}</p>
                    <p className="text-[11px] text-muted">
                      {b.id} · {formatDate(b.date)}
                    </p>
                  </div>
                  <Badge tone={b.status === "completed" ? "success" : b.status === "inProgress" ? "info" : "warning"}>
                    {t(`production.statuses.${b.status}`)}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.lowStockProductsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 p-4">
            {lowStockProducts.length === 0 && <p className="text-xs text-muted">{t("common.noResults")}</p>}
            {lowStockProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <p className="text-[13px] text-ink">{p.name}</p>
                <StockBadge status={stockStatus(p.stock, p.minStock)} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.lowRawMaterialsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 p-4">
            {lowRawMaterials.length === 0 && <p className="text-xs text-muted">{t("common.noResults")}</p>}
            {lowRawMaterials.map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <p className="text-[13px] text-ink">{m.name}</p>
                <StockBadge status={stockStatus(m.currentStock, m.minStock)} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.topSellingProducts")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 p-4">
            {topSelling.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{p.image}</span>
                  <p className="text-[13px] text-ink">{p.name}</p>
                </div>
                <p className="text-[11px] text-muted num">{t("dashboard.unitsSold", { count: p.unitsSold })}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
