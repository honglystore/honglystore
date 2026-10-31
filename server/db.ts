import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  DatabaseSchema,
  User,
  Role,
  Permission,
  Category,
  Product,
  StockMovement,
  Customer,
  Supplier,
  Purchase,
  Order,
  Expense,
  Notification,
  StoreSettings,
  ActivityLog,
  OrderItem,
} from './types.js';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'store_database.json');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Generate default permissions
const defaultPermissions: Permission[] = [
  { id: 'perm_1', code: 'dashboard.view', module: 'Dashboard', action: 'view', description: 'View dashboard and KPI statistics' },
  { id: 'perm_2', code: 'pos.access', module: 'POS', action: 'access', description: 'Process sales and print receipts in POS' },
  { id: 'perm_3', code: 'products.view', module: 'Products', action: 'view', description: 'View product catalog' },
  { id: 'perm_4', code: 'products.manage', module: 'Products', action: 'manage', description: 'Create, edit, and delete products' },
  { id: 'perm_5', code: 'categories.manage', module: 'Categories', action: 'manage', description: 'Manage product categories' },
  { id: 'perm_6', code: 'inventory.view', module: 'Inventory', action: 'view', description: 'View stock levels and valuation' },
  { id: 'perm_7', code: 'inventory.adjust', module: 'Inventory', action: 'adjust', description: 'Perform stock in, out, and adjustments' },
  { id: 'perm_8', code: 'orders.view', module: 'Orders', action: 'view', description: 'View customer orders' },
  { id: 'perm_9', code: 'orders.manage', module: 'Orders', action: 'manage', description: 'Edit, refund, and cancel orders' },
  { id: 'perm_10', code: 'customers.manage', module: 'Customers', action: 'manage', description: 'Manage CRM customer records' },
  { id: 'perm_11', code: 'suppliers.manage', module: 'Suppliers', action: 'manage', description: 'Manage supplier information' },
  { id: 'perm_12', code: 'purchases.manage', module: 'Purchases', action: 'manage', description: 'Create and receive purchase orders' },
  { id: 'perm_13', code: 'expenses.manage', module: 'Expenses', action: 'manage', description: 'Track store operating expenses' },
  { id: 'perm_14', code: 'reports.view', module: 'Reports', action: 'view', description: 'Access advanced analytics and financial reports' },
  { id: 'perm_15', code: 'users.manage', module: 'Users', action: 'manage', description: 'Manage user accounts and roles' },
  { id: 'perm_16', code: 'settings.manage', module: 'Settings', action: 'manage', description: 'Configure store settings and backups' },
];

const defaultRoles: Role[] = [
  {
    id: 'role_super_admin',
    name: 'Super Admin',
    description: 'Complete unrestricted access to all modules and configurations',
    permissions: defaultPermissions.map(p => p.code),
  },
  {
    id: 'role_admin',
    name: 'Admin',
    description: 'Full store operations management excluding sensitive server config',
    permissions: defaultPermissions.filter(p => p.code !== 'settings.manage').map(p => p.code),
  },
  {
    id: 'role_manager',
    name: 'Manager',
    description: 'Supervise store floor, inventory, reports, and staff operations',
    permissions: [
      'dashboard.view', 'pos.access', 'products.view', 'products.manage', 'categories.manage',
      'inventory.view', 'inventory.adjust', 'orders.view', 'orders.manage', 'customers.manage',
      'suppliers.manage', 'purchases.manage', 'expenses.manage', 'reports.view'
    ],
  },
  {
    id: 'role_cashier',
    name: 'Cashier',
    description: 'Front-desk POS checkout, order lookups, and customer loyalty',
    permissions: ['pos.access', 'products.view', 'orders.view', 'customers.manage'],
  },
  {
    id: 'role_inventory',
    name: 'Inventory Staff',
    description: 'Warehouse stock audits, receiving goods, and catalog updates',
    permissions: [
      'products.view', 'products.manage', 'categories.manage', 'inventory.view',
      'inventory.adjust', 'suppliers.manage', 'purchases.manage'
    ],
  },
];

const defaultCategories: Category[] = [
  {
    id: 'cat_electronics',
    name: 'Electronics & Audio',
    description: 'Gadgets, audio accessories, and premium peripherals',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'cat_groceries',
    name: 'Artisan Groceries',
    description: 'Organic pantry staples, healthy snacks, and condiments',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'cat_beverages',
    name: 'Specialty Beverages',
    description: 'Cold brew, organic teas, kombucha, and craft sodas',
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'cat_apparel',
    name: 'Apparel & Accessories',
    description: 'Modern minimalist clothing and everyday carry items',
    imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'cat_home',
    name: 'Home & Kitchen',
    description: 'Aesthetic kitchenware, tumblers, and home fragrances',
    imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400&q=80',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'cat_beauty',
    name: 'Health & Personal Care',
    description: 'Natural skincare, botanical soaps, and grooming goods',
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80',
    createdAt: '2026-01-10T08:00:00Z',
  },
];

const defaultProducts: Product[] = [
  {
    id: 'prod_1',
    name: 'Sony WH-1000XM5 Noise Canceling Headphones',
    sku: 'SNY-WH1005-BLK',
    barcode: '880912345001',
    categoryId: 'cat_electronics',
    categoryName: 'Electronics & Audio',
    brand: 'Sony',
    purchasePrice: 280.00,
    sellingPrice: 399.00,
    stockQuantity: 18,
    minStockAlert: 5,
    description: 'Industry-leading noise canceling wireless headphones with crystal-clear hands-free calling.',
    status: 'in_stock',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-10-25T14:30:00Z',
  },
  {
    id: 'prod_2',
    name: 'Keychron Q1 Pro Wireless Mechanical Keyboard',
    sku: 'KYC-Q1PRO-RGB',
    barcode: '880912345002',
    categoryId: 'cat_electronics',
    categoryName: 'Electronics & Audio',
    brand: 'Keychron',
    purchasePrice: 120.00,
    sellingPrice: 189.00,
    stockQuantity: 3, // Low stock demo!
    minStockAlert: 6,
    description: '75% layout QMK/VIA custom wireless mechanical keyboard with double-gasket design.',
    status: 'low_stock',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-10-28T11:20:00Z',
  },
  {
    id: 'prod_3',
    name: 'Logitech MX Master 3S Ergonomic Mouse',
    sku: 'LOG-MX3S-GRY',
    barcode: '880912345003',
    categoryId: 'cat_electronics',
    categoryName: 'Electronics & Audio',
    brand: 'Logitech',
    purchasePrice: 65.00,
    sellingPrice: 99.99,
    stockQuantity: 24,
    minStockAlert: 8,
    description: 'Quiet clicks and 8K DPI track-on-glass sensor for fast, fluid productivity.',
    status: 'in_stock',
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&q=80',
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-10-20T16:00:00Z',
  },
  {
    id: 'prod_4',
    name: 'Uji Ceremonial Grade Organic Matcha Powder (100g)',
    sku: 'GRC-MTC-100G',
    barcode: '880912345004',
    categoryId: 'cat_beverages',
    categoryName: 'Specialty Beverages',
    brand: 'Kyoto Botanicals',
    purchasePrice: 14.50,
    sellingPrice: 28.00,
    stockQuantity: 4, // Low stock demo!
    minStockAlert: 8,
    description: 'First harvest shade-grown matcha powder from Kyoto, Japan with smooth umami notes.',
    status: 'low_stock',
    expirationDate: '2027-08-31',
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80',
    createdAt: '2026-02-10T11:00:00Z',
    updatedAt: '2026-10-30T09:15:00Z',
  },
  {
    id: 'prod_5',
    name: 'Ethiopia Yirgacheffe Single Origin Coffee Beans (500g)',
    sku: 'BVG-COF-ETH500',
    barcode: '880912345005',
    categoryId: 'cat_beverages',
    categoryName: 'Specialty Beverages',
    brand: 'Artisan Roast Co.',
    purchasePrice: 11.00,
    sellingPrice: 22.50,
    stockQuantity: 42,
    minStockAlert: 10,
    description: 'Light roast specialty beans with floral jasmine aroma and bright citrus bergamot notes.',
    status: 'in_stock',
    expirationDate: '2027-04-15',
    imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&q=80',
    createdAt: '2026-02-15T14:00:00Z',
    updatedAt: '2026-10-29T10:00:00Z',
  },
  {
    id: 'prod_6',
    name: 'Organic Raw Wildflower Honey Jar (350g)',
    sku: 'GRC-HNY-350G',
    barcode: '880912345006',
    categoryId: 'cat_groceries',
    categoryName: 'Artisan Groceries',
    brand: 'Golden Meadow',
    purchasePrice: 6.80,
    sellingPrice: 14.00,
    stockQuantity: 36,
    minStockAlert: 10,
    description: '100% pure unfiltered raw wildflower honey harvested from sustainable ethical apiaries.',
    status: 'in_stock',
    expirationDate: '2028-12-31',
    imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&q=80',
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-10-22T13:45:00Z',
  },
  {
    id: 'prod_7',
    name: 'Klean Kanteen Insulated Thermal Tumbler (20oz)',
    sku: 'HM-KLEAN-20OZ',
    barcode: '880912345007',
    categoryId: 'cat_home',
    categoryName: 'Home & Kitchen',
    brand: 'Klean Kanteen',
    purchasePrice: 18.00,
    sellingPrice: 34.99,
    stockQuantity: 28,
    minStockAlert: 8,
    description: 'Climate Lock double-wall vacuum insulation keeps drinks hot for 14 hours and iced for 47 hours.',
    status: 'in_stock',
    imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&q=80',
    createdAt: '2026-03-05T12:00:00Z',
    updatedAt: '2026-10-20T17:00:00Z',
  },
  {
    id: 'prod_8',
    name: 'Minimalist Heavyweight Cotton Tee - Washed Navy',
    sku: 'APP-TEE-NVY-L',
    barcode: '880912345008',
    categoryId: 'cat_apparel',
    categoryName: 'Apparel & Accessories',
    brand: 'Monolith Goods',
    purchasePrice: 12.00,
    sellingPrice: 28.00,
    stockQuantity: 19,
    minStockAlert: 5,
    description: '280 GSM combed organic heavyweight cotton with boxy relaxed silhouette.',
    status: 'in_stock',
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80',
    createdAt: '2026-03-12T09:30:00Z',
    updatedAt: '2026-10-24T15:20:00Z',
  },
  {
    id: 'prod_9',
    name: 'Botanical Cedar & Bergamot Hand Soap (500ml)',
    sku: 'BTY-SOAP-500ML',
    barcode: '880912345009',
    categoryId: 'cat_beauty',
    categoryName: 'Health & Personal Care',
    brand: 'Aura Elements',
    purchasePrice: 8.50,
    sellingPrice: 19.50,
    stockQuantity: 31,
    minStockAlert: 8,
    description: 'Gentle plant-derived cleansing formula infused with nourishing cedarwood and fresh bergamot.',
    status: 'in_stock',
    imageUrl: 'https://images.unsplash.com/photo-1608248597359-56334a179247?w=500&q=80',
    createdAt: '2026-03-20T15:00:00Z',
    updatedAt: '2026-10-18T11:00:00Z',
  },
  {
    id: 'prod_10',
    name: 'Pour-Over Ceramic Coffee Dripper & Glass Server Set',
    sku: 'HM-POUR-SET',
    barcode: '880912345010',
    categoryId: 'cat_home',
    categoryName: 'Home & Kitchen',
    brand: 'Hario',
    purchasePrice: 24.00,
    sellingPrice: 48.00,
    stockQuantity: 15,
    minStockAlert: 4,
    description: 'Artisanal matte ceramic V-cone dripper with 600ml borosilicate glass decanter server.',
    status: 'in_stock',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80',
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-10-27T13:10:00Z',
  },
  {
    id: 'prod_11',
    name: 'Apple 20W USB-C Fast Power Adapter',
    sku: 'APL-20W-ADPT',
    barcode: '880912345011',
    categoryId: 'cat_electronics',
    categoryName: 'Electronics & Audio',
    brand: 'Apple',
    purchasePrice: 12.50,
    sellingPrice: 19.00,
    stockQuantity: 50,
    minStockAlert: 15,
    description: 'Fast, efficient charging at home, in the office, or on the go for mobile devices.',
    status: 'in_stock',
    imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&q=80',
    createdAt: '2026-04-10T08:00:00Z',
    updatedAt: '2026-10-31T06:00:00Z',
  },
  {
    id: 'prod_12',
    name: 'Organic Extra Virgin Olive Oil PDO Kalamata (750ml)',
    sku: 'GRC-OLV-750ML',
    barcode: '880912345012',
    categoryId: 'cat_groceries',
    categoryName: 'Artisan Groceries',
    brand: 'Olympian Groves',
    purchasePrice: 13.00,
    sellingPrice: 26.50,
    stockQuantity: 22,
    minStockAlert: 6,
    description: 'Cold-extracted single estate Greek olive oil with fruity aroma and peppery finish.',
    status: 'in_stock',
    expirationDate: '2028-06-30',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&q=80',
    createdAt: '2026-04-15T11:00:00Z',
    updatedAt: '2026-10-25T10:00:00Z',
  },
];

const defaultCustomers: Customer[] = [
  {
    id: 'cust_1',
    name: 'Sarah Chen',
    phone: '+1 (555) 234-5678',
    email: 'sarah.chen@example.com',
    address: '452 Pine Valley Way, Tech District',
    totalSpending: 1420.50,
    loyaltyPoints: 380,
    membershipLevel: 'Gold',
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'cust_2',
    name: 'Michael Vorn',
    phone: '+855 12 345 678',
    email: 'vorn.michael@example.com',
    address: 'St 214, BKK1, Phnom Penh, Cambodia',
    totalSpending: 2850.00,
    loyaltyPoints: 720,
    membershipLevel: 'Platinum',
    createdAt: '2026-02-12T14:30:00Z',
  },
  {
    id: 'cust_3',
    name: 'Elena Rostova',
    phone: '+1 (555) 890-1234',
    email: 'elena.rostova@example.com',
    address: '88 Riverside Blvd, Apt 4B',
    totalSpending: 640.00,
    loyaltyPoints: 140,
    membershipLevel: 'Silver',
    createdAt: '2026-03-05T09:15:00Z',
  },
  {
    id: 'cust_4',
    name: 'Sokha Meng',
    phone: '+855 98 765 432',
    email: 'sokha.meng@example.com',
    address: 'Toul Kork, Phnom Penh, Cambodia',
    totalSpending: 185.00,
    loyaltyPoints: 35,
    membershipLevel: 'Bronze',
    createdAt: '2026-05-18T16:00:00Z',
  },
];

const defaultSuppliers: Supplier[] = [
  {
    id: 'sup_1',
    name: 'Global Tech Wholesale Ltd',
    contactPerson: 'David Miller',
    phone: '+1 (800) 555-0199',
    email: 'orders@globaltechwholesalers.com',
    address: '100 Industrial Pkwy, Logistics Hub, CA',
    outstandingBalance: 1200.00,
    createdAt: '2026-01-05T08:00:00Z',
  },
  {
    id: 'sup_2',
    name: 'Kyoto Heritage Teas & Agro',
    contactPerson: 'Kenji Takahashi',
    phone: '+81 75 555 0122',
    email: 'kenji@kyoto-heritage.jp',
    address: '42 Uji Riverside, Kyoto, Japan',
    outstandingBalance: 0.00,
    createdAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'sup_3',
    name: 'Artisan Gourmet Distributors',
    contactPerson: 'Claire Laurent',
    phone: '+1 (888) 420-9900',
    email: 'claire@artisangourmet.com',
    address: '74 Harbor View Drive, Seattle, WA',
    outstandingBalance: 450.00,
    createdAt: '2026-02-01T11:00:00Z',
  },
];

const defaultPurchases: Purchase[] = [
  {
    id: 'po_1001',
    purchaseNumber: 'PO-2026-1001',
    supplierId: 'sup_1',
    supplierName: 'Global Tech Wholesale Ltd',
    totalCost: 2800.00,
    paymentStatus: 'paid',
    status: 'received',
    date: '2026-10-10T10:00:00Z',
    receivedDate: '2026-10-14T15:00:00Z',
    notes: 'Restock Sony WH-1000XM5 and fast chargers',
    items: [
      {
        productId: 'prod_1',
        productName: 'Sony WH-1000XM5 Noise Canceling Headphones',
        sku: 'SNY-WH1005-BLK',
        quantity: 10,
        purchasePrice: 280.00,
        totalCost: 2800.00,
      },
    ],
  },
  {
    id: 'po_1002',
    purchaseNumber: 'PO-2026-1002',
    supplierId: 'sup_2',
    supplierName: 'Kyoto Heritage Teas & Agro',
    totalCost: 725.00,
    paymentStatus: 'paid',
    status: 'received',
    date: '2026-10-18T09:00:00Z',
    receivedDate: '2026-10-22T11:30:00Z',
    notes: 'Quarterly Japanese ceremonial matcha batch',
    items: [
      {
        productId: 'prod_4',
        productName: 'Uji Ceremonial Grade Organic Matcha Powder (100g)',
        sku: 'GRC-MTC-100G',
        quantity: 50,
        purchasePrice: 14.50,
        totalCost: 725.00,
      },
    ],
  },
];

const defaultOrders: Order[] = [
  {
    id: 'ord_5001',
    orderNumber: 'ORD-2026-005001',
    customerId: 'cust_1',
    customerName: 'Sarah Chen',
    subtotal: 498.99,
    discount: 25.00,
    tax: 47.40,
    grandTotal: 521.39,
    paymentMethod: 'card',
    paymentStatus: 'completed',
    status: 'completed',
    cashierId: 'usr_cashier',
    cashierName: 'Emma Watson',
    date: '2026-10-29T14:15:00Z',
    currency: 'USD',
    exchangeRate: 4100,
    items: [
      {
        productId: 'prod_1',
        productName: 'Sony WH-1000XM5 Noise Canceling Headphones',
        sku: 'SNY-WH1005-BLK',
        quantity: 1,
        unitPrice: 399.00,
        subtotal: 399.00,
        discount: 0,
        total: 399.00,
      },
      {
        productId: 'prod_3',
        productName: 'Logitech MX Master 3S Ergonomic Mouse',
        sku: 'LOG-MX3S-GRY',
        quantity: 1,
        unitPrice: 99.99,
        subtotal: 99.99,
        discount: 25.00,
        total: 74.99,
      },
    ],
  },
  {
    id: 'ord_5002',
    orderNumber: 'ORD-2026-005002',
    customerId: 'cust_2',
    customerName: 'Michael Vorn',
    subtotal: 78.50,
    discount: 0,
    tax: 7.85,
    grandTotal: 86.35,
    paymentMethod: 'qr',
    paymentStatus: 'completed',
    status: 'completed',
    cashierId: 'usr_cashier',
    cashierName: 'Emma Watson',
    date: '2026-10-30T10:45:00Z',
    currency: 'USD',
    exchangeRate: 4100,
    items: [
      {
        productId: 'prod_4',
        productName: 'Uji Ceremonial Grade Organic Matcha Powder (100g)',
        sku: 'GRC-MTC-100G',
        quantity: 2,
        unitPrice: 28.00,
        subtotal: 56.00,
        discount: 0,
        total: 56.00,
      },
      {
        productId: 'prod_5',
        productName: 'Ethiopia Yirgacheffe Single Origin Coffee Beans (500g)',
        sku: 'BVG-COF-ETH500',
        quantity: 1,
        unitPrice: 22.50,
        subtotal: 22.50,
        discount: 0,
        total: 22.50,
      },
    ],
  },
  {
    id: 'ord_5003',
    orderNumber: 'ORD-2026-005003',
    customerId: 'cust_4',
    customerName: 'Sokha Meng',
    subtotal: 53.99,
    discount: 5.00,
    tax: 4.90,
    grandTotal: 53.89,
    paymentMethod: 'cash',
    paymentStatus: 'completed',
    status: 'completed',
    cashierId: 'usr_cashier',
    cashierName: 'Emma Watson',
    date: '2026-10-31T06:30:00Z',
    currency: 'USD',
    exchangeRate: 4100,
    items: [
      {
        productId: 'prod_7',
        productName: 'Klean Kanteen Insulated Thermal Tumbler (20oz)',
        sku: 'HM-KLEAN-20OZ',
        quantity: 1,
        unitPrice: 34.99,
        subtotal: 34.99,
        discount: 5.00,
        total: 29.99,
      },
      {
        productId: 'prod_11',
        productName: 'Apple 20W USB-C Fast Power Adapter',
        sku: 'APL-20W-ADPT',
        quantity: 1,
        unitPrice: 19.00,
        subtotal: 19.00,
        discount: 0,
        total: 19.00,
      },
    ],
  },
];

const defaultExpenses: Expense[] = [
  {
    id: 'exp_1',
    category: 'Rent',
    description: 'Retail store main showroom monthly rent',
    amount: 1800.00,
    paymentMethod: 'bank_transfer',
    date: '2026-10-01T08:00:00Z',
    recordedBy: 'Alex Rivera',
  },
  {
    id: 'exp_2',
    category: 'Utilities',
    description: 'High-speed fiber internet and electrical utility billing',
    amount: 245.50,
    paymentMethod: 'bank_transfer',
    date: '2026-10-05T10:00:00Z',
    recordedBy: 'Alex Rivera',
  },
  {
    id: 'exp_3',
    category: 'Packaging',
    description: 'Eco-friendly kraft shopping bags, thermal receipt rolls, and stickers',
    amount: 190.00,
    paymentMethod: 'card',
    date: '2026-10-12T14:00:00Z',
    recordedBy: 'Lucas Vance',
  },
  {
    id: 'exp_4',
    category: 'Marketing',
    description: 'Local social media promotions and seasonal autumn campaigns',
    amount: 320.00,
    paymentMethod: 'card',
    date: '2026-10-15T16:00:00Z',
    recordedBy: 'Alex Rivera',
  },
];

const defaultNotifications: Notification[] = [
  {
    id: 'notif_1',
    title: 'Low Stock Alert',
    message: 'Keychron Q1 Pro Wireless Mechanical Keyboard is low in stock (3 units left, min threshold: 6).',
    type: 'low_stock',
    read: false,
    date: '2026-10-28T11:20:00Z',
    link: '/inventory',
  },
  {
    id: 'notif_2',
    title: 'Low Stock Alert',
    message: 'Uji Ceremonial Grade Organic Matcha Powder (100g) is low in stock (4 units left, min threshold: 8).',
    type: 'low_stock',
    read: false,
    date: '2026-10-30T09:15:00Z',
    link: '/inventory',
  },
  {
    id: 'notif_3',
    title: 'New VIP Customer',
    message: 'Michael Vorn has reached Platinum Membership tier with $2,850+ in store purchases.',
    type: 'customer',
    read: true,
    date: '2026-10-30T11:00:00Z',
    link: '/customers',
  },
  {
    id: 'notif_4',
    title: 'New POS Sale Completed',
    message: 'Order ORD-2026-005003 ($53.89) was processed via Cash by Emma Watson.',
    type: 'order',
    read: true,
    date: '2026-10-31T06:30:00Z',
    link: '/orders',
  },
];

const defaultSettings: StoreSettings = {
  storeName: 'ហុងលី លក់សម្ភារៈបុណ្យ',
  storeTagline: 'ហាងលក់សម្ភារៈបុណ្យ ពិធីមង្គលការ និងបុណ្យទានគ្រប់ប្រភេទ',
  logoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&q=80',
  address: 'Building 14, Silicon Boulevard, Central District',
  phone: '+1 (800) 888-NEXUS',
  email: 'contact@nexusstore.io',
  website: 'https://nexusstore.io',
  currency: 'USD',
  khrExchangeRate: 4100, // 1 USD = 4,100 KHR
  taxPercentage: 10,
  invoicePrefix: 'INV-2026-',
  receiptFooter: 'Thank you for shopping with NexusStore! Keep receipt for 14-day returns.',
  enableLoyalty: true,
  theme: 'light',
  language: 'en',
  backupAuto: true,
};

const defaultActivityLogs: ActivityLog[] = [
  {
    id: 'log_1',
    userId: 'usr_superadmin',
    userName: 'Alexander Wright',
    action: 'System Bootstrapped',
    module: 'System',
    details: 'Database schema verified and operational parameters loaded.',
    timestamp: '2026-10-20T08:00:00Z',
  },
  {
    id: 'log_2',
    userId: 'usr_cashier',
    userName: 'Emma Watson',
    action: 'Order Processed',
    module: 'POS',
    details: 'Completed Order ORD-2026-005001 for customer Sarah Chen ($521.39).',
    timestamp: '2026-10-29T14:15:00Z',
  },
  {
    id: 'log_3',
    userId: 'usr_inventory',
    userName: 'Lucas Vance',
    action: 'Purchase Order Received',
    module: 'Purchases',
    details: 'Received PO-2026-1002 from Kyoto Heritage Teas & Agro (+50 matcha units).',
    timestamp: '2026-10-22T11:30:00Z',
  },
];

function buildDefaultUsers(): User[] {
  const hash = (pwd: string) => bcrypt.hashSync(pwd, 10);

  return [
    {
      id: 'usr_superadmin',
      name: 'Alexander Wright',
      email: 'admin@nexusstore.com',
      passwordHash: hash('admin123'),
      role: 'Super Admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
      phone: '+1 (555) 901-2233',
      status: 'active',
      createdAt: '2026-01-01T00:00:00Z',
      lastLoginAt: '2026-10-31T07:15:00Z',
    },
    {
      id: 'usr_manager',
      name: 'Alex Rivera',
      email: 'manager@nexusstore.com',
      passwordHash: hash('manager123'),
      role: 'Manager',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
      phone: '+1 (555) 812-4455',
      status: 'active',
      createdAt: '2026-01-05T00:00:00Z',
      lastLoginAt: '2026-10-30T18:00:00Z',
    },
    {
      id: 'usr_cashier',
      name: 'Emma Watson',
      email: 'cashier@nexusstore.com',
      passwordHash: hash('cashier123'),
      role: 'Cashier',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
      phone: '+1 (555) 744-8899',
      status: 'active',
      createdAt: '2026-01-15T00:00:00Z',
      lastLoginAt: '2026-10-31T06:00:00Z',
    },
    {
      id: 'usr_inventory',
      name: 'Lucas Vance',
      email: 'inventory@nexusstore.com',
      passwordHash: hash('inventory123'),
      role: 'Inventory Staff',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
      phone: '+1 (555) 321-7788',
      status: 'active',
      createdAt: '2026-01-15T00:00:00Z',
      lastLoginAt: '2026-10-29T09:30:00Z',
    },
  ];
}

class StoreDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Error reading store database, generating fresh defaults:', err);
      }
    }

    const initial: DatabaseSchema = {
      users: buildDefaultUsers(),
      roles: defaultRoles,
      permissions: defaultPermissions,
      categories: defaultCategories,
      products: defaultProducts,
      stock_movements: [
        {
          id: 'sm_1',
          productId: 'prod_1',
          productName: 'Sony WH-1000XM5 Noise Canceling Headphones',
          type: 'in',
          quantity: 10,
          previousStock: 9,
          newStock: 19,
          date: '2026-10-14T15:00:00Z',
          userId: 'usr_inventory',
          userName: 'Lucas Vance',
          reason: 'PO-2026-1001 purchase received',
          referenceId: 'po_1001',
        },
        {
          id: 'sm_2',
          productId: 'prod_1',
          productName: 'Sony WH-1000XM5 Noise Canceling Headphones',
          type: 'out',
          quantity: 1,
          previousStock: 19,
          newStock: 18,
          date: '2026-10-29T14:15:00Z',
          userId: 'usr_cashier',
          userName: 'Emma Watson',
          reason: 'POS Sale ORD-2026-005001',
          referenceId: 'ord_5001',
        },
      ],
      customers: defaultCustomers,
      suppliers: defaultSuppliers,
      purchases: defaultPurchases,
      orders: defaultOrders,
      expenses: defaultExpenses,
      notifications: defaultNotifications,
      settings: defaultSettings,
      activity_logs: defaultActivityLogs,
    };

    this.persist(initial);
    return initial;
  }

  private persist(data: DatabaseSchema) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  public getDb(): DatabaseSchema {
    return this.data;
  }

  public save() {
    this.persist(this.data);
  }

  public logActivity(log: Omit<ActivityLog, 'id' | 'timestamp'>) {
    const newLog: ActivityLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.activity_logs.unshift(newLog);
    if (this.data.activity_logs.length > 500) {
      this.data.activity_logs = this.data.activity_logs.slice(0, 500);
    }
    this.save();
  }

  public addNotification(notification: Omit<Notification, 'id' | 'date' | 'read'>) {
    const newNotif: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      read: false,
      date: new Date().toISOString(),
    };
    this.data.notifications.unshift(newNotif);
    this.save();
    return newNotif;
  }

  /**
   * POS Sale Transaction:
   * - Validates stock availability
   * - Deducts product inventory
   * - Updates product status ('in_stock', 'low_stock', 'out_of_stock')
   * - Records Stock Movements for each item
   * - Creates Order & updates Customer loyalty spending & tier
   * - Dispatches Low Stock notifications when thresholds met
   * - Logs audit trail
   */
  public executeSaleTransaction(saleData: {
    customerId?: string;
    customerName?: string;
    items: { productId: string; quantity: number; unitPrice: number; discount?: number }[];
    subtotal: number;
    discount: number;
    tax: number;
    grandTotal: number;
    paymentMethod: 'cash' | 'qr' | 'card' | 'split';
    cashierUser: { id: string; name: string };
    currency?: 'USD' | 'KHR';
    notes?: string;
  }): { success: boolean; order?: Order; error?: string } {
    // 1. Validate items & stock
    for (const item of saleData.items) {
      const prod = this.data.products.find(p => p.id === item.productId);
      if (!prod) {
        return { success: false, error: `Product ID "${item.productId}" not found.` };
      }
      if (prod.stockQuantity < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for "${prod.name}". Available: ${prod.stockQuantity}, requested: ${item.quantity}.`,
        };
      }
    }

    const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowIso = new Date().toISOString();
    const orderItems: OrderItem[] = [];

    // 2. Deduct inventory & record stock movement
    for (const item of saleData.items) {
      const prod = this.data.products.find(p => p.id === item.productId)!;
      const prevStock = prod.stockQuantity;
      const newStock = prevStock - item.quantity;
      prod.stockQuantity = newStock;
      prod.updatedAt = nowIso;

      // Update status
      if (newStock === 0) {
        prod.status = 'out_of_stock';
      } else if (newStock <= prod.minStockAlert) {
        prod.status = 'low_stock';
      } else {
        prod.status = 'in_stock';
      }

      // Record movement
      this.data.stock_movements.unshift({
        id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: prod.id,
        productName: prod.name,
        type: 'out',
        quantity: item.quantity,
        previousStock: prevStock,
        newStock: newStock,
        date: nowIso,
        userId: saleData.cashierUser.id,
        userName: saleData.cashierUser.name,
        reason: `POS Sale ${orderNumber}`,
        referenceId: orderNumber,
      });

      // Low stock notification trigger
      if (newStock <= prod.minStockAlert) {
        this.addNotification({
          title: newStock === 0 ? 'Out of Stock Alert' : 'Low Stock Warning',
          message: `Product "${prod.name}" has ${newStock} units left (Min threshold: ${prod.minStockAlert}).`,
          type: 'low_stock',
          link: '/inventory',
        });
      }

      const itemTotal = (item.unitPrice * item.quantity) - (item.discount || 0);
      orderItems.push({
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.unitPrice * item.quantity,
        discount: item.discount || 0,
        total: itemTotal,
      });
    }

    // 3. Update customer loyalty & tier
    if (saleData.customerId) {
      const customer = this.data.customers.find(c => c.id === saleData.customerId);
      if (customer) {
        customer.totalSpending = Number((customer.totalSpending + saleData.grandTotal).toFixed(2));
        // Earn 1 point per $5 spent
        const earnedPoints = Math.floor(saleData.grandTotal / 5);
        customer.loyaltyPoints += earnedPoints;

        // Auto tier progression
        if (customer.loyaltyPoints >= 600) {
          customer.membershipLevel = 'Platinum';
        } else if (customer.loyaltyPoints >= 300) {
          customer.membershipLevel = 'Gold';
        } else if (customer.loyaltyPoints >= 100) {
          customer.membershipLevel = 'Silver';
        }
      }
    }

    // 4. Create Order
    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber,
      customerId: saleData.customerId,
      customerName: saleData.customerName || 'Walk-in Customer',
      subtotal: saleData.subtotal,
      discount: saleData.discount,
      tax: saleData.tax,
      grandTotal: saleData.grandTotal,
      paymentMethod: saleData.paymentMethod,
      paymentStatus: 'completed',
      status: 'completed',
      cashierId: saleData.cashierUser.id,
      cashierName: saleData.cashierUser.name,
      date: nowIso,
      items: orderItems,
      notes: saleData.notes,
      currency: saleData.currency || this.data.settings.currency,
      exchangeRate: this.data.settings.khrExchangeRate,
    };

    this.data.orders.unshift(newOrder);

    // 5. Add notification
    this.addNotification({
      title: 'New POS Sale',
      message: `${orderNumber} processed for ${newOrder.customerName} - $${newOrder.grandTotal.toFixed(2)} (${newOrder.paymentMethod.toUpperCase()}).`,
      type: 'order',
      link: '/orders',
    });

    // 6. Log activity
    this.logActivity({
      userId: saleData.cashierUser.id,
      userName: saleData.cashierUser.name,
      action: 'POS Sale Completed',
      module: 'POS',
      details: `Processed ${orderNumber} with ${orderItems.length} items. Total: $${newOrder.grandTotal.toFixed(2)}.`,
    });

    this.save();
    return { success: true, order: newOrder };
  }

  /**
   * Receive Purchase Order:
   * - Increments stock quantities
   * - Updates product status
   * - Creates Stock Movement (type: 'in')
   * - Marks PO as 'received'
   */
  public receivePurchaseTransaction(
    purchaseId: string,
    user: { id: string; name: string }
  ): { success: boolean; error?: string } {
    const purchase = this.data.purchases.find(p => p.id === purchaseId);
    if (!purchase) {
      return { success: false, error: 'Purchase order not found.' };
    }
    if (purchase.status === 'received') {
      return { success: false, error: 'Purchase order has already been received.' };
    }

    const nowIso = new Date().toISOString();

    for (const item of purchase.items) {
      const prod = this.data.products.find(p => p.id === item.productId);
      if (prod) {
        const prevStock = prod.stockQuantity;
        const newStock = prevStock + item.quantity;
        prod.stockQuantity = newStock;
        prod.updatedAt = nowIso;

        if (newStock > prod.minStockAlert) {
          prod.status = 'in_stock';
        } else if (newStock > 0) {
          prod.status = 'low_stock';
        }

        this.data.stock_movements.unshift({
          id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          productId: prod.id,
          productName: prod.name,
          type: 'in',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock: newStock,
          date: nowIso,
          userId: user.id,
          userName: user.name,
          reason: `Stock Received from ${purchase.purchaseNumber}`,
          referenceId: purchase.purchaseNumber,
        });
      }
    }

    purchase.status = 'received';
    purchase.receivedDate = nowIso;

    this.addNotification({
      title: 'Goods Received',
      message: `${purchase.purchaseNumber} from ${purchase.supplierName} was received into stock.`,
      type: 'inventory',
      link: '/inventory',
    });

    this.logActivity({
      userId: user.id,
      userName: user.name,
      action: 'Purchase Received',
      module: 'Purchases',
      details: `Received purchase ${purchase.purchaseNumber} totaling $${purchase.totalCost.toFixed(2)}.`,
    });

    this.save();
    return { success: true };
  }

  /**
   * Manual Stock Adjustment:
   */
  public adjustStock(params: {
    productId: string;
    type: 'in' | 'out' | 'adjustment';
    quantity: number;
    reason: string;
    user: { id: string; name: string };
  }): { success: boolean; error?: string; product?: Product } {
    const prod = this.data.products.find(p => p.id === params.productId);
    if (!prod) return { success: false, error: 'Product not found.' };

    const prevStock = prod.stockQuantity;
    let newStock = prevStock;

    if (params.type === 'in') {
      newStock += params.quantity;
    } else if (params.type === 'out') {
      if (prevStock < params.quantity) {
        return { success: false, error: 'Cannot deduct more stock than available.' };
      }
      newStock -= params.quantity;
    } else if (params.type === 'adjustment') {
      newStock = params.quantity;
    }

    prod.stockQuantity = newStock;
    prod.updatedAt = new Date().toISOString();

    if (newStock === 0) {
      prod.status = 'out_of_stock';
    } else if (newStock <= prod.minStockAlert) {
      prod.status = 'low_stock';
    } else {
      prod.status = 'in_stock';
    }

    this.data.stock_movements.unshift({
      id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      productId: prod.id,
      productName: prod.name,
      type: params.type,
      quantity: Math.abs(newStock - prevStock),
      previousStock: prevStock,
      newStock: newStock,
      date: new Date().toISOString(),
      userId: params.user.id,
      userName: params.user.name,
      reason: params.reason || 'Manual stock adjustment',
    });

    this.logActivity({
      userId: params.user.id,
      userName: params.user.name,
      action: 'Stock Adjusted',
      module: 'Inventory',
      details: `Adjusted "${prod.name}" from ${prevStock} to ${newStock} (${params.reason}).`,
    });

    this.save();
    return { success: true, product: prod };
  }
}

export const db = new StoreDatabase();
