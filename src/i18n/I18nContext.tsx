import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import en from "./en";
import bn from "./bn";

export type Lang = "en" | "bn";

const dictionaries: Record<Lang, typeof en> = { en, bn };

function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function interpolate(str: string, params?: Record<string, string | number>) {
  if (!params) return str;
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replaceAll(`{{${k}}}`, String(v)),
    str
  );
}

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = "bakeflow.lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    return saved === "bn" || saved === "en" ? saved : "en";
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);

  const t = useMemo(() => {
    return (key: string, params?: Record<string, string | number>) => {
      const dict = dictionaries[lang];
      const value = getPath(dict, key);
      if (typeof value === "string") return interpolate(value, params);
      // fallback to English if a key is somehow missing in a translation
      const fallback = getPath(dictionaries.en, key);
      if (typeof fallback === "string") return interpolate(fallback, params);
      return key;
    };
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, dir: "ltr" }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function useTranslation() {
  const { t, lang } = useI18n();
  return { t, lang };
}
