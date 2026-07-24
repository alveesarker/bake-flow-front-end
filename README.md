# BakeFlow — Smart Bakery Management System

A complete frontend for a bakery ERP: products, inventory, production, sales (retail + distributor), employees, expenses, reports, AI insights preview, and settings — fully bilingual (English / বাংলা).

## Stack

React 19 · TypeScript · Vite · Tailwind CSS · React Router · custom table utilities · React Hook Form + Zod · Recharts · Framer Motion · Lucide icons.

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build     # production build to /dist
npm run preview   # preview the production build
```

## What's included

- **Dashboard** — KPI cards, monthly sales & expense charts, recent sales/production, low-stock alerts, top sellers.
- **Products** & **Product Inventory** — full CRUD, search/filter/sort/pagination, stock adjustment + history.
- **Raw Materials** & **Raw Material Inventory** — CRUD, purchasing (auto-increases stock and logs an expense), stock adjustment + history.
- **Production** — create a batch, see the recipe scale live with quantity, get an insufficient-stock warning, and complete a batch to auto-deduct raw materials and increase finished-goods stock.
- **Customer Sales** — a retail POS: product grid, cart, discount, payment method, auto stock deduction.
- **Distributor Sales** — pick a distributor, build a wholesale order with editable unit prices, complete sale.
- **Distributors / Employees / Expenses** — CRUD tables with validation.
- **Reports** — sales / production / inventory / expense / employee tabs with stat cards, a chart, and a table; export/print buttons are wired to a toast (no backend, so nothing is actually generated).
- **AI Insights** — a designed preview of six insight cards; intentionally not wired to any model, per the brief.
- **Settings** — business info, language/theme/currency preferences, profile & password, backup/restore (UI only).

## Data

All data is seeded in `src/data/seed.ts` and held in memory via a React context (`src/store/DataStore.tsx`). Nothing persists between page reloads — there's no backend. This is intentionally a frontend-only deliverable, ready to be wired up to a real API.

## Localization

Every visible string is pulled from `src/i18n/en.ts` / `src/i18n/bn.ts` through the `useTranslation()` hook — nothing is hardcoded in components. Switch languages from the navbar globe icon or Settings → Preferences; the whole app (including tables, forms, charts, toasts, and empty states) re-renders in the selected language, and the choice persists in `localStorage`.

## Design notes

Strict black/white/gray palette per the brief, with color reserved for status badges, alerts, and charts. Manrope for headings, Inter for body text, and JetBrains Mono for numeric/tabular data (prices, quantities, IDs) to give the ERP a precise, "counted" feel without breaking the monochrome rule.
