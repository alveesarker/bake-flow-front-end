import type {
  Product,
  RawMaterial,
  Recipe,
  ProductionBatch,
  Distributor,
  Employee,
  Expense,
  CustomerSale,
  DistributorSale,
} from "../types";

export const rawMaterials: RawMaterial[] = [
  { id: "rm1", name: "Wheat Flour", code: "RM-001", unit: "kg", currentStock: 420, minStock: 100 },
  { id: "rm2", name: "Butter", code: "RM-002", unit: "kg", currentStock: 38, minStock: 40 },
  { id: "rm3", name: "Yeast", code: "RM-003", unit: "kg", currentStock: 12, minStock: 15 },
  { id: "rm4", name: "Sugar", code: "RM-004", unit: "kg", currentStock: 21, minStock: 60 },
  { id: "rm5", name: "Whole Milk", code: "RM-005", unit: "l", currentStock:6, minStock: 50 },
  { id: "rm6", name: "Eggs", code: "RM-006", unit: "pc", currentStock: 30, minStock: 200 },
  { id: "rm7", name: "Cocoa Powder", code: "RM-007", unit: "kg", currentStock: 18, minStock: 20 },
  { id: "rm8", name: "Salt", code: "RM-008", unit: "kg", currentStock: 55, minStock: 10 },
  { id: "rm9", name: "Vanilla Extract", code: "RM-009", unit: "l", currentStock: 4, minStock: 5 },
  { id: "rm10", name: "Baking Powder", code: "RM-010", unit: "kg", currentStock: 22, minStock: 8 },
];

export const products: Product[] = [
  {
    id: "p1", name: "Butter Croissant", code: "BC-001", category: "pastries",
    description: "Classic French croissant laminated with butter.",
    customerPrice: 120, distributorPrice: 90, unit: "pc", weight: 80,
    image: "🥐", minStock: 40, stock: 96, status: "active",
  },
  {
    id: "p2", name: "Sourdough Loaf", code: "SD-002", category: "breads",
    description: "Naturally leavened sourdough bread, 24-hour ferment.",
    customerPrice: 260, distributorPrice: 200, unit: "pc", weight: 750,
    image: "🍞", minStock: 20, stock: 34, status: "active",
  },
  {
    id: "p3", name: "Chocolate Fudge Cake", code: "CK-003", category: "cakes",
    description: "Rich dark chocolate cake with fudge frosting.",
    customerPrice: 950, distributorPrice: 780, unit: "pc", weight: 1200,
    image: "🍰", minStock: 8, stock: 5, status: "active",
  },
  {
    id: "p4", name: "Oatmeal Raisin Cookie", code: "CO-004", category: "cookies",
    description: "Chewy oatmeal cookies with raisins and cinnamon.",
    customerPrice: 60, distributorPrice: 42, unit: "pc", weight: 45,
    image: "🍪", minStock: 60, stock: 210, status: "active",
  },
  {
    id: "p5", name: "Cinnamon Roll", code: "CR-005", category: "pastries",
    description: "Soft roll swirled with cinnamon sugar and glaze.",
    customerPrice: 140, distributorPrice: 105, unit: "pc", weight: 110,
    image: "🥯", minStock: 30, stock: 18, status: "active",
  },
  {
    id: "p6", name: "Whole Wheat Bread", code: "WW-006", category: "breads",
    description: "Everyday whole wheat sandwich loaf.",
    customerPrice: 180, distributorPrice: 140, unit: "pc", weight: 600,
    image: "🍞", minStock: 25, stock: 41, status: "active",
  },
  {
    id: "p7", name: "Red Velvet Cupcake", code: "CK-007", category: "cakes",
    description: "Velvety cupcake topped with cream cheese frosting.",
    customerPrice: 150, distributorPrice: 110, unit: "pc", weight: 90,
    image: "🧁", minStock: 40, stock: 12, status: "active",
  },
  {
    id: "p8", name: "Iced Lemon Tea", code: "BV-008", category: "beverages",
    description: "Refreshing house-brewed iced lemon tea.",
    customerPrice: 90, distributorPrice: 65, unit: "bottle", weight: 350,
    image: "🥤", minStock: 30, stock: 58, status: "active",
  },
  {
    id: "p9", name: "Almond Biscotti", code: "CO-009", category: "cookies",
    description: "Twice-baked crunchy almond biscotti.",
    customerPrice: 75, distributorPrice: 55, unit: "pc", weight: 40,
    image: "🍪", minStock: 40, stock: 22, status: "inactive",
  },
  {
    id: "p10", name: "Blueberry Muffin", code: "MF-010", category: "pastries",
    description: "Fluffy muffin loaded with fresh blueberries.",
    customerPrice: 110, distributorPrice: 80, unit: "pc", weight: 95,
    image: "🧁", minStock: 30, stock: 64, status: "active",
  },
];

export const recipes: Recipe[] = [
  { productId: "p1", items: [
    { materialId: "rm1", qtyPerUnit: 0.06 },
    { materialId: "rm2", qtyPerUnit: 0.035 },
    { materialId: "rm3", qtyPerUnit: 0.004 },
  ]},
  { productId: "p2", items: [
    { materialId: "rm1", qtyPerUnit: 0.45 },
    { materialId: "rm3", qtyPerUnit: 0.01 },
    { materialId: "rm8", qtyPerUnit: 0.01 },
  ]},
  { productId: "p3", items: [
    { materialId: "rm1", qtyPerUnit: 0.3 },
    { materialId: "rm2", qtyPerUnit: 0.2 },
    { materialId: "rm4", qtyPerUnit: 0.35 },
    { materialId: "rm7", qtyPerUnit: 0.12 },
    { materialId: "rm6", qtyPerUnit: 3 },
  ]},
  { productId: "p4", items: [
    { materialId: "rm1", qtyPerUnit: 0.02 },
    { materialId: "rm2", qtyPerUnit: 0.015 },
    { materialId: "rm4", qtyPerUnit: 0.018 },
  ]},
  { productId: "p5", items: [
    { materialId: "rm1", qtyPerUnit: 0.07 },
    { materialId: "rm2", qtyPerUnit: 0.03 },
    { materialId: "rm4", qtyPerUnit: 0.025 },
    { materialId: "rm3", qtyPerUnit: 0.005 },
  ]},
  { productId: "p6", items: [
    { materialId: "rm1", qtyPerUnit: 0.4 },
    { materialId: "rm3", qtyPerUnit: 0.008 },
    { materialId: "rm5", qtyPerUnit: 0.1 },
  ]},
  { productId: "p7", items: [
    { materialId: "rm1", qtyPerUnit: 0.04 },
    { materialId: "rm4", qtyPerUnit: 0.03 },
    { materialId: "rm6", qtyPerUnit: 0.5 },
    { materialId: "rm7", qtyPerUnit: 0.015 },
  ]},
  { productId: "p9", items: [
    { materialId: "rm1", qtyPerUnit: 0.03 },
    { materialId: "rm4", qtyPerUnit: 0.02 },
    { materialId: "rm6", qtyPerUnit: 0.2 },
  ]},
  { productId: "p10", items: [
    { materialId: "rm1", qtyPerUnit: 0.05 },
    { materialId: "rm4", qtyPerUnit: 0.02 },
    { materialId: "rm5", qtyPerUnit: 0.03 },
    { materialId: "rm6", qtyPerUnit: 0.3 },
  ]},
];

export const employees: Employee[] = [
  { id: "e1", name: "Rahim Uddin", phone: "01711-223344", designation: "baker", salary: 22000, joiningDate: "2023-02-10", status: "active" },
  { id: "e2", name: "Karim Sheikh", phone: "01822-334455", designation: "supervisor", salary: 32000, joiningDate: "2022-06-01", status: "active" },
  { id: "e3", name: "Fatima Akter", phone: "01933-445566", designation: "cashier", salary: 18000, joiningDate: "2023-09-15", status: "active" },
  { id: "e4", name: "Nasrin Jahan", phone: "01644-556677", designation: "manager", salary: 45000, joiningDate: "2021-11-20", status: "active" },
  { id: "e5", name: "Habibur Rahman", phone: "01555-667788", designation: "helper", salary: 14000, joiningDate: "2024-01-05", status: "active" },
  { id: "e6", name: "Jasim Molla", phone: "01766-778899", designation: "delivery", salary: 16000, joiningDate: "2023-04-18", status: "inactive" },
  { id: "e7", name: "Shirin Aktar", phone: "01977-889900", designation: "baker", salary: 21000, joiningDate: "2024-05-22", status: "active" },
];

export const distributors: Distributor[] = [
  { id: "d1", name: "Anisur Rahman", company: "Green Valley Traders", phone: "01711-111222", email: "anisur@greenvalley.com", address: "Mirpur, Dhaka", status: "active" },
  { id: "d2", name: "Selina Parvin", company: "Dhaka Fresh Mart", phone: "01822-222333", email: "selina@dhakafresh.com", address: "Uttara, Dhaka", status: "active" },
  { id: "d3", name: "Mahmudul Hasan", company: "City Grocers Ltd", phone: "01933-333444", email: "mahmud@citygrocers.com", address: "Gulshan, Dhaka", status: "active" },
  { id: "d4", name: "Ruma Begum", company: "Sonar Bangla Distribution", phone: "01644-444555", email: "ruma@sonarbangla.com", address: "Chattogram", status: "inactive" },
];

export const productionBatches: ProductionBatch[] = [
  { id: "PB-1001", productId: "p1", quantity: 200, employeeId: "e1", date: "2026-07-22", status: "completed" },
  { id: "PB-1002", productId: "p3", quantity: 10, employeeId: "e7", date: "2026-07-23", status: "completed" },
  { id: "PB-1003", productId: "p2", quantity: 50, employeeId: "e1", date: "2026-07-23", status: "inProgress" },
  { id: "PB-1004", productId: "p5", quantity: 80, employeeId: "e7", date: "2026-07-24", status: "pending" },
];

export const expenses: Expense[] = [
  { id: "ex1", date: "2026-07-01", category: "salary", amount: 168000, description: "July staff salaries" },
  { id: "ex2", date: "2026-07-03", category: "rawMaterial", amount: 84000, description: "Flour & butter restock" },
  { id: "ex3", date: "2026-07-07", category: "utilities", amount: 21500, description: "Electricity bill" },
  { id: "ex4", date: "2026-07-10", category: "maintenance", amount: 9800, description: "Oven servicing" },
  { id: "ex5", date: "2026-07-14", category: "transportation", amount: 6200, description: "Delivery van fuel" },
  { id: "ex6", date: "2026-07-18", category: "other", amount: 3400, description: "Packaging materials" },
  { id: "ex7", date: "2026-07-20", category: "rawMaterial", amount: 52000, description: "Sugar & cocoa restock" },
];

export const customerSales: CustomerSale[] = [
  { id: "CS-9001", date: "2026-07-24", items: [{ productId: "p1", quantity: 4, unitPrice: 120 }, { productId: "p4", quantity: 6, unitPrice: 60 }], discount: 20, paymentMethod: "cash", total: 820 },
  { id: "CS-9002", date: "2026-07-24", items: [{ productId: "p2", quantity: 2, unitPrice: 260 }], discount: 0, paymentMethod: "card", total: 520 },
  { id: "CS-9003", date: "2026-07-23", items: [{ productId: "p8", quantity: 3, unitPrice: 90 }, { productId: "p10", quantity: 2, unitPrice: 110 }], discount: 10, paymentMethod: "mobileBanking", total: 480 },
];

export const distributorSales: DistributorSale[] = [
  { id: "DS-5001", distributorId: "d1", date: "2026-07-22", items: [{ productId: "p2", quantity: 40, unitPrice: 200 }], discount: 200, paymentMethod: "cash", total: 7800 },
  { id: "DS-5002", distributorId: "d2", date: "2026-07-23", items: [{ productId: "p1", quantity: 100, unitPrice: 90 }, { productId: "p4", quantity: 150, unitPrice: 42 }], discount: 300, paymentMethod: "mobileBanking", total: 14400 },
];

export const monthlySalesTrend = [
  { month: "Feb", value: 412000 },
  { month: "Mar", value: 455000 },
  { month: "Mar", value: 455000 },
  { month: "Apr", value: 398000 },
  { month: "Apr", value: 398000 },
  { month: "Apr", value: 398000 },
  { month: "Apr", value: 398000 },
  { month: "May", value: 512000 },
  { month: "May", value: 512000 },
  { month: "May", value: 512000 },
  { month: "Jun", value: 561000 },
  { month: "Jun", value: 561000 },
  { month: "Jul", value: 498000 },
  { month: "Jul", value: 498000 },
];

export const expenseBreakdown = [
  { category: "rawMaterial", value: 136000 },
  { category: "salary", value: 168000 },
  { category: "utilities", value: 21500 },
  { category: "maintenance", value: 9800 },
  { category: "transportation", value: 6200 },
  { category: "other", value: 3400 },
];
