import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Wheat,
  Factory,
  ShoppingCart,
  Truck,
  Users,
  UserRound,
  Receipt,
  FileBarChart,
  Sparkles,
  Settings as SettingsIcon,
  PanelLeftClose,
  PanelLeftOpen,
  ClipboardList,
} from "lucide-react";
import { useTranslation } from "../../i18n/I18nContext";
import { cn } from "../../lib/utils";

const items = [
  { to: "/", icon: LayoutDashboard, key: "dashboard", end: true },
  { to: "/products", icon: Package, key: "products" },
  { to: "/inventory", icon: Wheat, key: "rawMaterials" },
  { to: "/production", icon: Factory, key: "production" },
  { to: "/customer-sales", icon: ShoppingCart, key: "customerSales" },
  { to: "/order", icon: ClipboardList, key: "order"},
  { to: "/distributor-sales", icon: Truck, key: "distributorSales" },
  { to: "/distributors", icon: Users, key: "distributors" },
  { to: "/employees", icon: UserRound, key: "employees" },
  { to: "/expenses", icon: Receipt, key: "expenses" },
  { to: "/reports", icon: FileBarChart, key: "reports" },
  { to: "/ai-insights", icon: Sparkles, key: "aiInsights" },
  { to: "/settings", icon: SettingsIcon, key: "settings" },
];

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-ink/40 lg:hidden" onClick={onCloseMobile} />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-line bg-paper transition-all duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          collapsed ? "lg:w-[76px]" : "lg:w-[248px]",
          mobileOpen ? "translate-x-0 w-[248px]" : "-translate-x-full w-[248px] lg:translate-x-0"
        )}
      >
        <div className={cn("flex h-16 shrink-0 items-center gap-2.5 border-b border-line px-4", collapsed && "lg:justify-center lg:px-0")}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ink text-white">
            <Wheat size={16} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold leading-none text-ink">{t("app.name")}</p>
              <p className="mt-0.5 truncate text-[10px] leading-none text-muted">{t("app.tagline")}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
          {items.map(({ to, icon: Icon, key, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-md px-2.5 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-mist hover:text-ink",
                  isActive && "bg-ink text-white hover:bg-ink hover:text-white",
                  collapsed && "lg:justify-center lg:px-0"
                )
              }
              title={collapsed ? t(`nav.${key}`) : undefined}
            >
              <Icon size={17} className="shrink-0" />
              {!collapsed && <span className="truncate">{t(`nav.${key}`)}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="hidden shrink-0 border-t border-line p-2.5 lg:block">
          <button
            onClick={onToggle}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-muted hover:bg-mist hover:text-ink",
              collapsed && "justify-center px-0"
            )}
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
