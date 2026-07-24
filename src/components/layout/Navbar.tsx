import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Search, Bell, Menu, ChevronDown, LogOut, UserCircle, Globe } from "lucide-react";
import { useTranslation } from "../../i18n/I18nContext";
import { useI18n } from "../../i18n/I18nContext";
import { cn } from "../../lib/utils";

const routeKeyMap: Record<string, string> = {
  "/": "dashboard",
  "/products": "products",
  "/product-inventory": "productInventory",
  "/raw-materials": "rawMaterials",
  "/raw-material-inventory": "rawMaterialInventory",
  "/production": "production",
  "/customer-sales": "customerSales",
  "/distributor-sales": "distributorSales",
  "/distributors": "distributors",
  "/employees": "employees",
  "/expenses": "expenses",
  "/reports": "reports",
  "/ai-insights": "aiInsights",
  "/settings": "settings",
};

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, onOutside: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
}

export function Navbar({ onOpenMobileSidebar }: { onOpenMobileSidebar: () => void }) {
  const { t } = useTranslation();
  const { lang, setLang } = useI18n();
  const location = useLocation();
  const pageKey = routeKeyMap[location.pathname] ?? "dashboard";

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  useOutsideClick(notifRef, () => setNotifOpen(false));
  useOutsideClick(profileRef, () => setProfileOpen(false));
  useOutsideClick(langRef, () => setLangOpen(false));

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-paper/95 px-4 backdrop-blur sm:px-6">
      <button className="rounded-md p-1.5 text-ink hover:bg-mist lg:hidden" onClick={onOpenMobileSidebar} aria-label="Open menu">
        <Menu size={19} />
      </button>

      <h1 className="font-display text-[15px] font-semibold text-ink shrink-0">{t(`nav.${pageKey}`)}</h1>

      <div className="relative ml-2 hidden max-w-sm flex-1 md:block">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          className="h-9 w-full pl-10 rounded-md border border-line bg-mist/60 pl-8.5 pr-3 text-[13px] placeholder:text-muted focus:border-ink focus:bg-paper focus:outline-none"
          placeholder={t("navbar.search")}
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setLangOpen((v) => !v)}
            className="flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-ink hover:bg-mist"
          >
            <Globe size={15} />
            <span className="hidden sm:inline">{lang === "en" ? "English" : "বাংলা"}</span>
            <ChevronDown size={13} className="text-muted" />
          </button>
          {langOpen && (
            <div className="absolute right-0 top-11 w-36 rounded-md border border-line bg-paper py-1 shadow-popover animate-slide-up">
              {(["en", "bn"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setLang(l);
                    setLangOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center px-3 py-1.5 text-left text-[13px] hover:bg-mist",
                    lang === l ? "font-semibold text-ink" : "text-muted"
                  )}
                >
                  {l === "en" ? "English" : "বাংলা"}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative flex h-9 w-9 items-center justify-center rounded-md text-ink hover:bg-mist"
            aria-label={t("navbar.notifications")}
          >
            <Bell size={17} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-danger" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-11 w-72 rounded-md border border-line bg-paper shadow-popover animate-slide-up">
              <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
                <p className="text-[13px] font-semibold text-ink">{t("navbar.notifications")}</p>
                <button className="text-[11px] text-muted hover:text-ink">{t("navbar.markAllRead")}</button>
              </div>
              <div className="px-3.5 py-8 text-center text-xs text-muted">{t("navbar.noNotifications")}</div>
            </div>
          )}
        </div>

        <div className="relative pl-1" ref={profileRef}>
          <button onClick={() => setProfileOpen((v) => !v)} className="flex items-center gap-2 rounded-md p-1 hover:bg-mist">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">NA</div>
            <ChevronDown size={13} className="hidden text-muted sm:block" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-11 w-48 rounded-md border border-line bg-paper py-1 shadow-popover animate-slide-up">
              <div className="border-b border-line px-3.5 py-2.5">
                <p className="text-[13px] font-semibold text-ink">Nasrin Jahan</p>
                <p className="text-[11px] text-muted">Bakery Manager</p>
              </div>
              <button className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-[13px] text-ink hover:bg-mist">
                <UserCircle size={15} /> {t("navbar.myAccount")}
              </button>
              <button className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-[13px] text-danger hover:bg-mist">
                <LogOut size={15} /> {t("navbar.signOut")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
