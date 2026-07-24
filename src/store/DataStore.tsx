import { createContext, useContext, useState, type ReactNode } from "react";
import * as seed from "../data/seed";
import { uid } from "../lib/utils";
import type {
  Product,
  RawMaterial,
  ProductionBatch,
  Distributor,
  Employee,
  Expense,
  CustomerSale,
  DistributorSale,
  StockMovement,
} from "../types";

interface DataStoreValue {
  products: Product[];
  rawMaterials: RawMaterial[];
  recipes: typeof seed.recipes;
  productionBatches: ProductionBatch[];
  distributors: Distributor[];
  employees: Employee[];
  expenses: Expense[];
  customerSales: CustomerSale[];
  distributorSales: DistributorSale[];
  stockHistory: Record<string, StockMovement[]>;

  addProduct: (p: Omit<Product, "id">) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustProductStock: (id: string, type: "increase" | "decrease", qty: number, reason: string) => void;

  addRawMaterial: (m: Omit<RawMaterial, "id">) => void;
  updateRawMaterial: (id: string, m: Partial<RawMaterial>) => void;
  deleteRawMaterial: (id: string) => void;
  purchaseRawMaterial: (id: string, qty: number, unitPrice: number, date: string, notes: string) => void;
  adjustMaterialStock: (id: string, type: "increase" | "decrease", qty: number, reason: string) => void;

  createProduction: (productId: string, quantity: number, employeeId: string, date: string) => void;
  completeProduction: (id: string) => { ok: boolean; message?: string };

  addDistributor: (d: Omit<Distributor, "id">) => void;
  updateDistributor: (id: string, d: Partial<Distributor>) => void;
  deleteDistributor: (id: string) => void;

  addEmployee: (e: Omit<Employee, "id">) => void;
  updateEmployee: (id: string, e: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  addExpense: (e: Omit<Expense, "id">) => void;
  updateExpense: (id: string, e: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  completeCustomerSale: (sale: Omit<CustomerSale, "id">) => void;
  completeDistributorSale: (sale: Omit<DistributorSale, "id">) => void;
}

const DataStoreContext = createContext<DataStoreValue | undefined>(undefined);

export function DataStoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(seed.products);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(seed.rawMaterials);
  const [productionBatches, setProductionBatches] = useState<ProductionBatch[]>(seed.productionBatches);
  const [distributors, setDistributors] = useState<Distributor[]>(seed.distributors);
  const [employees, setEmployees] = useState<Employee[]>(seed.employees);
  const [expenses, setExpenses] = useState<Expense[]>(seed.expenses);
  const [customerSales, setCustomerSales] = useState<CustomerSale[]>(seed.customerSales);
  const [distributorSales, setDistributorSales] = useState<DistributorSale[]>(seed.distributorSales);
  const [stockHistory, setStockHistory] = useState<Record<string, StockMovement[]>>({});

  const pushHistory = (key: string, mv: StockMovement) => {
    setStockHistory((prev) => ({ ...prev, [key]: [mv, ...(prev[key] ?? [])] }));
  };

  // ---- Products ----
  const addProduct: DataStoreValue["addProduct"] = (p) =>
    setProducts((prev) => [{ ...p, id: uid("p") }, ...prev]);

  const updateProduct: DataStoreValue["updateProduct"] = (id, p) =>
    setProducts((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const deleteProduct: DataStoreValue["deleteProduct"] = (id) =>
    setProducts((prev) => prev.filter((x) => x.id !== id));

  const adjustProductStock: DataStoreValue["adjustProductStock"] = (id, type, qty, reason) => {
    setProducts((prev) =>
      prev.map((x) =>
        x.id === id
          ? { ...x, stock: type === "increase" ? x.stock + qty : Math.max(0, x.stock - qty) }
          : x
      )
    );
    pushHistory(`product:${id}`, {
      id: uid("mv"),
      date: new Date().toISOString(),
      type,
      quantity: qty,
      reason,
    });
  };

  // ---- Raw materials ----
  const addRawMaterial: DataStoreValue["addRawMaterial"] = (m) =>
    setRawMaterials((prev) => [{ ...m, id: uid("rm") }, ...prev]);

  const updateRawMaterial: DataStoreValue["updateRawMaterial"] = (id, m) =>
    setRawMaterials((prev) => prev.map((x) => (x.id === id ? { ...x, ...m } : x)));

  const deleteRawMaterial: DataStoreValue["deleteRawMaterial"] = (id) =>
    setRawMaterials((prev) => prev.filter((x) => x.id !== id));

  const purchaseRawMaterial: DataStoreValue["purchaseRawMaterial"] = (id, qty, unitPrice, date, notes) => {
    setRawMaterials((prev) =>
      prev.map((x) => (x.id === id ? { ...x, currentStock: x.currentStock + qty } : x))
    );
    pushHistory(`material:${id}`, {
      id: uid("mv"),
      date,
      type: "increase",
      quantity: qty,
      reason: notes || "Purchase",
    });
    setExpenses((prev) => [
      {
        id: uid("ex"),
        date,
        category: "rawMaterial",
        amount: qty * unitPrice,
        description: notes || "Raw material purchase",
      },
      ...prev,
    ]);
  };

  const adjustMaterialStock: DataStoreValue["adjustMaterialStock"] = (id, type, qty, reason) => {
    setRawMaterials((prev) =>
      prev.map((x) =>
        x.id === id
          ? { ...x, currentStock: type === "increase" ? x.currentStock + qty : Math.max(0, x.currentStock - qty) }
          : x
      )
    );
    pushHistory(`material:${id}`, {
      id: uid("mv"),
      date: new Date().toISOString(),
      type,
      quantity: qty,
      reason,
    });
  };

  // ---- Production ----
  const createProduction: DataStoreValue["createProduction"] = (productId, quantity, employeeId, date) => {
    setProductionBatches((prev) => [
      {
        id: `PB-${1000 + prev.length + 1}`,
        productId,
        quantity,
        employeeId,
        date,
        status: "pending",
      },
      ...prev,
    ]);
  };

  const completeProduction: DataStoreValue["completeProduction"] = (id) => {
    const batch = productionBatches.find((b) => b.id === id);
    if (!batch) return { ok: false, message: "Production not found" };
    const recipe = seed.recipes.find((r) => r.productId === batch.productId);
    if (recipe) {
      for (const item of recipe.items) {
        const material = rawMaterials.find((m) => m.id === item.materialId);
        const needed = item.qtyPerUnit * batch.quantity;
        if (material && material.currentStock < needed) {
          return { ok: false, message: "insufficient" };
        }
      }
    }
    if (recipe) {
      setRawMaterials((prev) =>
        prev.map((m) => {
          const item = recipe.items.find((i) => i.materialId === m.id);
          if (!item) return m;
          const needed = item.qtyPerUnit * batch.quantity;
          pushHistory(`material:${m.id}`, {
            id: uid("mv"),
            date: batch.date,
            type: "decrease",
            quantity: needed,
            reason: `Used in production ${batch.id}`,
          });
          return { ...m, currentStock: Math.max(0, m.currentStock - needed) };
        })
      );
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === batch.productId ? { ...p, stock: p.stock + batch.quantity } : p))
    );
    pushHistory(`product:${batch.productId}`, {
      id: uid("mv"),
      date: batch.date,
      type: "increase",
      quantity: batch.quantity,
      reason: `Production ${batch.id} completed`,
    });
    setProductionBatches((prev) => prev.map((b) => (b.id === id ? { ...b, status: "completed" } : b)));
    return { ok: true };
  };

  // ---- Distributors ----
  const addDistributor: DataStoreValue["addDistributor"] = (d) =>
    setDistributors((prev) => [{ ...d, id: uid("d") }, ...prev]);
  const updateDistributor: DataStoreValue["updateDistributor"] = (id, d) =>
    setDistributors((prev) => prev.map((x) => (x.id === id ? { ...x, ...d } : x)));
  const deleteDistributor: DataStoreValue["deleteDistributor"] = (id) =>
    setDistributors((prev) => prev.filter((x) => x.id !== id));

  // ---- Employees ----
  const addEmployee: DataStoreValue["addEmployee"] = (e) =>
    setEmployees((prev) => [{ ...e, id: uid("e") }, ...prev]);
  const updateEmployee: DataStoreValue["updateEmployee"] = (id, e) =>
    setEmployees((prev) => prev.map((x) => (x.id === id ? { ...x, ...e } : x)));
  const deleteEmployee: DataStoreValue["deleteEmployee"] = (id) =>
    setEmployees((prev) => prev.filter((x) => x.id !== id));

  // ---- Expenses ----
  const addExpense: DataStoreValue["addExpense"] = (e) =>
    setExpenses((prev) => [{ ...e, id: uid("ex") }, ...prev]);
  const updateExpense: DataStoreValue["updateExpense"] = (id, e) =>
    setExpenses((prev) => prev.map((x) => (x.id === id ? { ...x, ...e } : x)));
  const deleteExpense: DataStoreValue["deleteExpense"] = (id) =>
    setExpenses((prev) => prev.filter((x) => x.id !== id));

  // ---- Sales ----
  const completeCustomerSale: DataStoreValue["completeCustomerSale"] = (sale) => {
    const id = `CS-${9000 + customerSales.length + 1}`;
    setCustomerSales((prev) => [{ ...sale, id }, ...prev]);
    setProducts((prev) =>
      prev.map((p) => {
        const item = sale.items.find((i) => i.productId === p.id);
        return item ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p;
      })
    );
  };

  const completeDistributorSale: DataStoreValue["completeDistributorSale"] = (sale) => {
    const id = `DS-${5000 + distributorSales.length + 1}`;
    setDistributorSales((prev) => [{ ...sale, id }, ...prev]);
    setProducts((prev) =>
      prev.map((p) => {
        const item = sale.items.find((i) => i.productId === p.id);
        return item ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p;
      })
    );
  };

  const value: DataStoreValue = {
    products,
    rawMaterials,
    recipes: seed.recipes,
    productionBatches,
    distributors,
    employees,
    expenses,
    customerSales,
    distributorSales,
    stockHistory,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustProductStock,
    addRawMaterial,
    updateRawMaterial,
    deleteRawMaterial,
    purchaseRawMaterial,
    adjustMaterialStock,
    createProduction,
    completeProduction,
    addDistributor,
    updateDistributor,
    deleteDistributor,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addExpense,
    updateExpense,
    deleteExpense,
    completeCustomerSale,
    completeDistributorSale,
  };

  return <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>;
}

export function useDataStore() {
  const ctx = useContext(DataStoreContext);
  if (!ctx) throw new Error("useDataStore must be used within DataStoreProvider");
  return ctx;
}

export function stockStatus(current: number, min: number): "inStock" | "lowStock" | "outOfStock" {
  if (current <= 0) return "outOfStock";
  if (current <= min) return "lowStock";
  return "inStock";
}
