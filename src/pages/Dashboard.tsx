import { useEffect, useState } from "react";
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
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useTranslation } from "../i18n/I18nContext";
import { stockStatus } from "../store/DataStore";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { StockBadge } from "../components/ui/Badge";
import { PageHeader } from "../components/ui/Misc";
import { formatCurrency, formatNumber } from "../lib/utils";
import type { ReactNode } from "react";

const API_BASE = "http://localhost:5000/api";

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

interface DailyInfo {
  tatal_sales_for_today: number;
  total_sales_this_month: number;
  todaysProduction: string;
  total_product_stock: string;
  total_raw_m_stock: string;
  total_product: number;
  total_employees: number;
  total_distributor: number;
}

interface MonthlySales {
  month: string;
  year: number;
  value: string;
}

interface LowStockProduct {
  product_id: number;
  product_name: string;
  minimum_stock: number;
  stock_quantity: number;
}

interface LowStockRawMaterial {
  material_id: number;
  material_name: string;
  minimum_stock: string;
  current_stock: string;
}

interface TopSellingProduct {
  product_id: number;
  product_name: string;
  category_name: string;
  total_sold: string;
}

export default function Dashboard() {
  const { t } = useTranslation();

  const [dailyInfo, setDailyInfo] = useState<DailyInfo | null>(null);
  const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [lowRawMaterials, setLowRawMaterials] = useState<LowStockRawMaterial[]>([]);
  const [topSelling, setTopSelling] = useState<TopSellingProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [dailyRes, monthlyRes, lowPRes, lowRmRes, topRes] = await Promise.all([
          fetch(`${API_BASE}/dashboard/daily-info`),
          fetch(`${API_BASE}/dashboard/monthly-sales`),
          fetch(`${API_BASE}/dashboard/low-stock-p`),
          fetch(`${API_BASE}/dashboard/low-stock-rm`),
          fetch(`${API_BASE}/dashboard/top-selling-products`),
        ]);

        const [dailyJson, monthlyJson, lowPJson, lowRmJson, topJson] = await Promise.all([
          dailyRes.json(),
          monthlyRes.json(),
          lowPRes.json(),
          lowRmRes.json(),
          topRes.json(),
        ]);

        if (dailyJson.success) setDailyInfo(dailyJson.data);
        if (monthlyJson.success) setMonthlySales([...monthlyJson.data].reverse());
        if (lowPJson.success) setLowStockProducts(lowPJson.data);
        if (lowRmJson.success) setLowRawMaterials(lowRmJson.data);
        if (topJson.success) setTopSelling(topJson.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title={t("dashboard.title")} subtitle={t("dashboard.subtitle")} />
        <p className="mt-4 text-sm text-muted">{t("common.loading") ?? "Loading..."}</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t("dashboard.title")} subtitle={t("dashboard.subtitle")} />

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={<DollarSign size={17} />}
          label={t("dashboard.todaySales")}
          value={formatCurrency(dailyInfo?.tatal_sales_for_today ?? 0)}
        />
        <StatCard
          icon={<CalendarDays size={17} />}
          label={t("dashboard.monthlySales")}
          value={formatCurrency(dailyInfo?.total_sales_this_month ?? 0)}
        />
        <StatCard
          icon={<Factory size={17} />}
          label={t("dashboard.todayProduction")}
          value={formatNumber(Number(dailyInfo?.todaysProduction ?? 0))}
        />
        <StatCard
          icon={<Boxes size={17} />}
          label={t("dashboard.productStock")}
          value={formatNumber(Number(dailyInfo?.total_product_stock ?? 0))}
        />
        <StatCard
          icon={<Wheat size={17} />}
          label={t("dashboard.rawMaterialStock")}
          value={formatNumber(Math.round(Number(dailyInfo?.total_raw_m_stock ?? 0)))}
        />
        <StatCard
          icon={<AlertTriangle size={17} />}
          label={t("dashboard.lowStockProducts")}
          value={String(lowStockProducts.length)}
        />
        <StatCard
          icon={<PackageX size={17} />}
          label={t("dashboard.lowRawMaterials")}
          value={String(lowRawMaterials.length)}
        />
        <StatCard
          icon={<Package size={17} />}
          label={t("dashboard.totalProducts")}
          value={String(dailyInfo?.total_product ?? 0)}
        />
        <StatCard
          icon={<UserRound size={17} />}
          label={t("dashboard.totalEmployees")}
          value={String(dailyInfo?.total_employees ?? 0)}
        />
        <StatCard
          icon={<Truck size={17} />}
          label={t("dashboard.totalDistributors")}
          value={String(dailyInfo?.total_distributor ?? 0)}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{t("dashboard.monthlySalesChart")}</CardTitle>
          </CardHeader>
          <CardContent className="h-64 pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySales} margin={{ left: 8, right: 16 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#111111" stopOpacity={0.14} />
                    <stop offset="100%" stopColor="#111111" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#E5E5E5" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  width={56}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
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

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.lowStockProductsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 p-4">
            {lowStockProducts.length === 0 && <p className="text-xs text-muted">{t("common.noResults")}</p>}
            {lowStockProducts.map((p) => (
              <div key={p.product_id} className="flex items-center justify-between">
                <p className="text-[13px] text-ink">{p.product_name}</p>
                <StockBadge status={stockStatus(p.stock_quantity, p.minimum_stock)} />
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
              <div key={m.material_id} className="flex items-center justify-between">
                <p className="text-[13px] text-ink">{m.material_name}</p>
                <StockBadge status={stockStatus(Number(m.current_stock), Number(m.minimum_stock))} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.topSellingProducts")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 p-4">
            {topSelling.length === 0 && <p className="text-xs text-muted">{t("common.noResults")}</p>}
            {topSelling.map((p) => (
              <div key={p.product_id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] text-ink">{p.product_name}</p>
                </div>
                <p className="text-[11px] text-muted num">
                  {t("dashboard.unitsSold", { count: Number(p.total_sold) })}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}