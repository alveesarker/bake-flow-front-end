export type Status = "active" | "inactive";
export type StockStatus = "inStock" | "lowStock" | "outOfStock";

export interface Product {
  id: string;
  name: string;
  code: string;
  category: "breads" | "pastries" | "cakes" | "cookies" | "beverages";
  description: string;
  customerPrice: number;
  distributorPrice: number;
  unit: string;
  weight: number;
  image: string;
  minStock: number;
  stock: number;
  status: Status;
}

export interface RawMaterial {
  id: string;
  name: string;
  code: string;
  unit: string;
  currentStock: number;
  minStock: number;
}

export interface RecipeItem {
  materialId: string;
  qtyPerUnit: number;
}

export interface Recipe {
  productId: string;
  items: RecipeItem[];
}

export type ProductionStatus = "pending" | "inProgress" | "completed";

export interface ProductionBatch {
  id: string;
  productId: string;
  quantity: number;
  employeeId: string;
  date: string;
  status: ProductionStatus;
}

export interface Distributor {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  status: Status;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  designation: "baker" | "supervisor" | "cashier" | "manager" | "helper" | "delivery";
  salary: number;
  joiningDate: string;
  status: Status;
}

export type ExpenseCategory =
  | "rawMaterial"
  | "utilities"
  | "salary"
  | "maintenance"
  | "transportation"
  | "other";

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
}

export type PaymentMethod = "cash" | "card" | "mobileBanking";

export interface SaleLineItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CustomerSale {
  id: string;
  date: string;
  items: SaleLineItem[];
  discount: number;
  paymentMethod: PaymentMethod;
  total: number;
}

export interface DistributorSale {
  id: string;
  distributorId: string;
  date: string;
  items: SaleLineItem[];
  discount: number;
  paymentMethod: PaymentMethod;
  total: number;
}

export interface StockMovement {
  id: string;
  date: string;
  type: "increase" | "decrease";
  quantity: number;
  reason: string;
}
