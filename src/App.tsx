import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nProvider } from "./i18n/I18nContext";
import { ToastProvider } from "./hooks/useToast";
import { DataStoreProvider } from "./store/DataStore";
import { AppLayout } from "./components/layout/AppLayout";

import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import RawMaterials from "./pages/RawMaterials";
import Production from "./pages/Production";
import CustomerSales from "./pages/CustomerSales";
import DistributorSales from "./pages/DistributorSales";
import Distributors from "./pages/Distributors";
import Employees from "./pages/Employees";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import AIInsights from "./pages/AIInsights";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <I18nProvider>
      <ToastProvider>
        <DataStoreProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                {/* <Route path="/product-inventory" element={<ProductInventory />} /> */}
                <Route path="/inventory" element={<RawMaterials />} />
                {/* <Route path="/raw-material-inventory" element={<RawMaterialInventory />} /> */}
                <Route path="/production" element={<Production />} />
                <Route path="/customer-sales" element={<CustomerSales />} />
                <Route path="/distributor-sales" element={<DistributorSales />} />
                <Route path="/distributors" element={<Distributors />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/ai-insights" element={<AIInsights />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </DataStoreProvider>
      </ToastProvider>
    </I18nProvider>
  );
}
