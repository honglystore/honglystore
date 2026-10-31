export type RoleName = 'Super Admin' | 'Admin' | 'Manager' | 'Cashier' | 'Inventory Staff';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: RoleName;
  avatar?: string;
  phone?: string;
  status: 'active' | 'disabled';
  createdAt: string;
  lastLoginAt?: string;
}

export interface Permission {
  id: string;
  code: string;
  module: string;
  action: string;
  description: string;
}

export interface Role {
  id: string;
  name: RoleName;
  description: string;
  permissions: string[]; // array of permission codes
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  categoryName?: string;
  brand: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockAlert: number;
  description: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  expirationDate?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type StockMovementType = 'in' | 'out' | 'adjustment' | 'transfer';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  date: string;
  userId: string;
  userName: string;
  reason: string;
  referenceId?: string; // orderId, purchaseId, or manual
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  totalSpending: number;
  loyaltyPoints: number;
  membershipLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  outstandingBalance: number;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  purchasePrice: number;
  totalCost: number;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  totalCost: number;
  paymentStatus: 'paid' | 'pending' | 'partial';
  status: 'ordered' | 'received' | 'cancelled';
  date: string;
  receivedDate?: string;
  notes?: string;
  items: PurchaseItem[];
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paymentMethod: 'cash' | 'qr' | 'card' | 'split';
  paymentStatus: 'completed' | 'pending' | 'refunded';
  status: 'completed' | 'pending' | 'cancelled';
  cashierId: string;
  cashierName: string;
  date: string;
  items: OrderItem[];
  notes?: string;
  currency: 'USD' | 'KHR';
  exchangeRate: number;
}

export interface Expense {
  id: string;
  category: 'Utilities' | 'Rent' | 'Salaries' | 'Packaging' | 'Marketing' | 'Maintenance' | 'Other';
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer';
  date: string;
  recordedBy: string;
  notes?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'low_stock' | 'order' | 'payment' | 'inventory' | 'customer';
  read: boolean;
  date: string;
  link?: string;
}

export interface StoreSettings {
  storeName: string;
  storeTagline: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  currency: 'USD' | 'KHR';
  khrExchangeRate: number; // e.g. 4100
  taxPercentage: number; // e.g. 10%
  invoicePrefix: string;
  receiptFooter: string;
  enableLoyalty: boolean;
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'km';
  backupAuto: boolean;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
  ip?: string;
  timestamp: string;
}

export interface DatabaseSchema {
  users: User[];
  roles: Role[];
  permissions: Permission[];
  categories: Category[];
  products: Product[];
  stock_movements: StockMovement[];
  customers: Customer[];
  suppliers: Supplier[];
  purchases: Purchase[];
  orders: Order[];
  expenses: Expense[];
  notifications: Notification[];
  settings: StoreSettings;
  activity_logs: ActivityLog[];
}
