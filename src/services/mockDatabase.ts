/**
 * In-browser Standalone Database & Fallback Engine
 * Enables 100% full-functionality when hosted as a static site on GitHub Pages (honglystore.github.io)
 * or when the backend server is unreachable.
 */

const STORAGE_KEY = 'hongly_store_offline_db_v1';

export interface StandaloneState {
  users: any[];
  roles: any[];
  permissions: any[];
  categories: any[];
  products: any[];
  stockMovements: any[];
  customers: any[];
  suppliers: any[];
  purchases: any[];
  orders: any[];
  expenses: any[];
  notifications: any[];
  settings: any;
  activityLogs: any[];
}

const initialSeed: StandaloneState = {
  users: [
    {
      id: 'usr_superadmin',
      name: 'Hong Ly (ម្ចាស់ហាង)',
      email: 'admin@honglystore.com',
      role: 'Super Admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
      phone: '+855 12 888 999',
      status: 'active',
      createdAt: '2026-01-01T00:00:00Z',
      lastLoginAt: new Date().toISOString(),
    },
    {
      id: 'usr_manager',
      name: 'Sokha Chan (អ្នកគ្រប់គ្រង)',
      email: 'manager@honglystore.com',
      role: 'Manager',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
      phone: '+855 17 555 123',
      status: 'active',
      createdAt: '2026-01-05T00:00:00Z',
      lastLoginAt: '2026-10-30T18:00:00Z',
    },
    {
      id: 'usr_cashier',
      name: 'Bopha Vorn (អ្នកគិតលុយ)',
      email: 'cashier@honglystore.com',
      role: 'Cashier',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
      phone: '+855 98 444 321',
      status: 'active',
      createdAt: '2026-01-15T00:00:00Z',
      lastLoginAt: '2026-10-31T06:00:00Z',
    },
    {
      id: 'usr_inventory',
      name: 'Dara Kim (បុគ្គលិកស្តុក)',
      email: 'inventory@honglystore.com',
      role: 'Inventory Staff',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
      phone: '+855 89 222 777',
      status: 'active',
      createdAt: '2026-01-15T00:00:00Z',
      lastLoginAt: '2026-10-29T09:30:00Z',
    },
  ],
  roles: [
    {
      id: 'role_super_admin',
      name: 'Super Admin',
      description: 'Complete unrestricted access to all modules and configurations',
      permissions: [
        'dashboard.view',
        'pos.access',
        'products.view',
        'products.manage',
        'categories.manage',
        'inventory.view',
        'inventory.adjust',
        'orders.view',
        'orders.manage',
        'customers.manage',
        'suppliers.manage',
        'purchases.manage',
        'expenses.manage',
        'reports.view',
        'users.manage',
        'settings.manage',
      ],
    },
    {
      id: 'role_admin',
      name: 'Admin',
      description: 'Full store operations management',
      permissions: [
        'dashboard.view',
        'pos.access',
        'products.view',
        'products.manage',
        'categories.manage',
        'inventory.view',
        'inventory.adjust',
        'orders.view',
        'orders.manage',
        'customers.manage',
        'suppliers.manage',
        'purchases.manage',
        'expenses.manage',
        'reports.view',
        'users.manage',
      ],
    },
    {
      id: 'role_manager',
      name: 'Manager',
      description: 'Supervise store floor, inventory, reports, and staff operations',
      permissions: [
        'dashboard.view',
        'pos.access',
        'products.view',
        'products.manage',
        'categories.manage',
        'inventory.view',
        'inventory.adjust',
        'orders.view',
        'orders.manage',
        'customers.manage',
        'suppliers.manage',
        'purchases.manage',
        'expenses.manage',
        'reports.view',
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
        'products.view',
        'products.manage',
        'categories.manage',
        'inventory.view',
        'inventory.adjust',
        'suppliers.manage',
        'purchases.manage',
      ],
    },
  ],
  permissions: [
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
  ],
  categories: [
    {
      id: 'cat_incense_candles',
      name: 'ទៀន និង ធូប (Candles & Incense)',
      description: 'ធូបក្រអូប ទៀនផ្កាឈូក ទៀនវស្សា ទៀនលឿងប្រណិត',
      imageUrl: 'https://images.unsplash.com/photo-1608755728617-aefab37d2edd?w=400&q=80',
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'cat_monk_offerings',
      name: 'ត្រៃចីវរ និង សង្ឃភណ្ឌ (Monk Robes & Offerings)',
      description: 'ឈុតត្រៃចីវរ ថង់យាម ផ្តិល ស្លាបព្រា កែវទឹក និងគ្រឿងសង្ឃទាន',
      imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&q=80',
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'cat_worship',
      name: 'គ្រឿងសក្ការៈបូជា (Worship & Altar Items)',
      description: 'ជើងធូប ផ្តិលទឹកមន្ត ប៉ាន់ទឹកតែ ថាស និងផ្កាឈូកថ្វាយព្រះ',
      imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400&q=80',
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'cat_ceremony_garlands',
      name: 'ផ្កា និង កម្រងផ្កា (Ceremonial Flowers)',
      description: 'កម្រងផ្កាម្លិះ ផ្កាឈូកស្រស់ ស្លាធម៌ និងម្លូស្លា',
      imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80',
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'cat_silverware',
      name: 'ផ្តិល និង ថាសប្រាក់ (Silverware & Trays)',
      description: 'ថាសប្រាក់ក្បាច់បុរាណ ផ្តិលប្រាក់ ជើងពាន និងកែវទឹកមន្ត',
      imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80',
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'cat_funeral_rites',
      name: 'គ្រឿងរណ្តាប់បុណ្យសព (Funeral Rites Essentials)',
      description: 'ក្រណាត់ស ទៀនធំ ធូបប្រអប់ធំ និងគ្រឿងបរិក្ខារបុណ្យសព',
      imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80',
      createdAt: '2026-01-10T08:00:00Z',
    },
  ],
  products: [
    {
      id: 'prod_1',
      name: 'ធូបក្រអូបពិសេសផ្កាម្លិះ (Premium Jasmine Incense)',
      sku: 'HL-THOOP-JASMINE',
      barcode: '885100100001',
      categoryId: 'cat_incense_candles',
      categoryName: 'ទៀន និង ធូប (Candles & Incense)',
      brand: 'ហុងលី',
      purchasePrice: 1.5,
      sellingPrice: 3.0,
      stockQuantity: 120,
      minStockAlert: 20,
      description: 'ធូបក្រអូបគុណភាពខ្ពស់ ផ្សែងតិច ក្លិនក្រអូបផ្កាម្លិះស្រទន់ សម្រាប់ថ្វាយព្រះ និងកម្មវិធីបុណ្យ។',
      status: 'in_stock',
      imageUrl: 'https://images.unsplash.com/photo-1608755728617-aefab37d2edd?w=500&q=80',
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-10-25T14:30:00Z',
    },
    {
      id: 'prod_2',
      name: 'ទៀនផ្កាឈូកពណ៌លឿង (Lotus Flower Candles)',
      sku: 'HL-TIEN-LOTUS-YEL',
      barcode: '885100100002',
      categoryId: 'cat_incense_candles',
      categoryName: 'ទៀន និង ធូប (Candles & Incense)',
      brand: 'ហុងលី',
      purchasePrice: 2.2,
      sellingPrice: 4.5,
      stockQuantity: 4, // low stock
      minStockAlert: 10,
      description: 'ទៀនរាងផ្កាឈូកពណ៌លឿងប្រណិត រលាយយឺត អណ្តាតភ្លើងភ្លឺថ្លា មិនហុយ។',
      status: 'low_stock',
      imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&q=80',
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-10-28T11:20:00Z',
    },
    {
      id: 'prod_3',
      name: 'ឈុតត្រៃចីវរព្រះសង្ឃថ្នាក់លេខ១ (Monk Trai Chivor Premium)',
      sku: 'HL-ROBE-CHIVOR-01',
      barcode: '885100100003',
      categoryId: 'cat_monk_offerings',
      categoryName: 'ត្រៃចីវរ និង សង្ឃភណ្ឌ (Monk Robes & Offerings)',
      brand: 'វត្តភ្នំ',
      purchasePrice: 25.0,
      sellingPrice: 38.0,
      stockQuantity: 28,
      minStockAlert: 5,
      description: 'សាច់ក្រណាត់មាសស្អាត ត្រជាក់ស្រួលពាក់ ស្របតាមវិន័យព្រះពុទ្ធសាសនា ១០០%។',
      status: 'in_stock',
      imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&q=80',
      createdAt: '2026-01-18T09:15:00Z',
      updatedAt: '2026-10-20T08:00:00Z',
    },
    {
      id: 'prod_4',
      name: 'ផ្តិលទឹកមន្តស្ពាន់បុរាណ (Traditional Silvered Holy Vessel)',
      sku: 'HL-VESSEL-SILVER-01',
      barcode: '885100100004',
      categoryId: 'cat_silverware',
      categoryName: 'ផ្តិល និង ថាសប្រាក់ (Silverware & Trays)',
      brand: 'ជាងខ្មែរ',
      purchasePrice: 15.0,
      sellingPrice: 26.0,
      stockQuantity: 15,
      minStockAlert: 4,
      description: 'ផ្តិលទឹកមន្តក្បាច់រចនាខ្មែរបុរាណ សម្រាប់ពិធីសូត្រមន្ត ប្រោះព្រំសិរីសួស្តី។',
      status: 'in_stock',
      imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&q=80',
      createdAt: '2026-01-20T14:00:00Z',
      updatedAt: '2026-10-18T16:45:00Z',
    },
    {
      id: 'prod_5',
      name: 'ឈុតទៀនវស្សាគូធំ (Pair of Large Vassa Candles)',
      sku: 'HL-TIEN-VASSA-BIG',
      barcode: '885100100005',
      categoryId: 'cat_incense_candles',
      categoryName: 'ទៀន និង ធូប (Candles & Incense)',
      brand: 'ហុងលី',
      purchasePrice: 32.0,
      sellingPrice: 48.0,
      stockQuantity: 12,
      minStockAlert: 3,
      description: 'ទៀនវស្សាគូធំឆ្លាក់ក្បាច់នាគ ភ្លឺបានយូររាប់សប្តាហ៍ សម្រាប់ប្រគេនព្រះសង្ឃក្នុងរដូវចូលវស្សា។',
      status: 'in_stock',
      imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&q=80',
      createdAt: '2026-02-01T11:00:00Z',
      updatedAt: '2026-10-22T09:30:00Z',
    },
    {
      id: 'prod_6',
      name: 'ស្លាធម៌ និង ម្លូស្លាថ្វាយព្រះ (Traditional Betel Altar Set)',
      sku: 'HL-SLA-THOR-SET',
      barcode: '885100100006',
      categoryId: 'cat_worship',
      categoryName: 'គ្រឿងសក្ការៈបូជា (Worship & Altar Items)',
      brand: 'ហុងលី',
      purchasePrice: 3.5,
      sellingPrice: 7.0,
      stockQuantity: 40,
      minStockAlert: 8,
      description: 'ឈុតស្លាធម៌ដូង ឬចេក តុបតែងជាមួយស្លឹកម្លូ និងស្លាស្រស់ស្អាត សម្រាប់រៀបដង្វាយ។',
      status: 'in_stock',
      imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80',
      createdAt: '2026-02-05T12:00:00Z',
      updatedAt: '2026-10-29T10:00:00Z',
    },
  ],
  stockMovements: [
    {
      id: 'mov_1',
      productId: 'prod_1',
      productName: 'ធូបក្រអូបពិសេសផ្កាម្លិះ',
      type: 'in',
      quantity: 150,
      previousStock: 0,
      newStock: 150,
      reason: 'ទិញចូលស្តុកដើមគ្រា',
      userId: 'usr_superadmin',
      userName: 'Hong Ly',
      date: '2026-10-20T08:00:00Z',
    },
    {
      id: 'mov_2',
      productId: 'prod_2',
      productName: 'ទៀនផ្កាឈូកពណ៌លឿង',
      type: 'out',
      quantity: 6,
      previousStock: 10,
      newStock: 4,
      reason: 'លក់ចេញតាម POS',
      userId: 'usr_cashier',
      userName: 'Bopha Vorn',
      date: '2026-10-29T14:15:00Z',
    },
  ],
  customers: [
    {
      id: 'cust_1',
      name: 'លោកជំទាវ សុខ គន្ធា',
      phone: '012 345 678',
      email: 'kunthea.sok@gmail.com',
      address: 'ខណ្ឌដូនពេញ រាជធានីភ្នំពេញ',
      totalSpent: 450.0,
      loyaltyPoints: 450,
      tier: 'Gold',
      notes: 'អតិថិជនប្រចាំ ទិញគ្រឿងបុណ្យធំៗ',
      createdAt: '2026-02-01T08:00:00Z',
    },
    {
      id: 'cust_2',
      name: 'អាចារ្យ ម៉ៅ វិបុល',
      phone: '017 999 888',
      email: 'vibol.mao@gmail.com',
      address: 'ខណ្ឌទួលគោក រាជធានីភ្នំពេញ',
      totalSpent: 280.0,
      loyaltyPoints: 280,
      tier: 'Silver',
      notes: 'អាចារ្យវត្តសាមគ្គីរង្សី',
      createdAt: '2026-02-10T09:30:00Z',
    },
  ],
  suppliers: [
    {
      id: 'sup_1',
      name: 'សិប្បកម្មទៀនធូបកម្ពុជា',
      contactPerson: 'លោក ហេង',
      phone: '023 888 111',
      email: 'cambodia.candles@supplier.com',
      address: 'ផ្លូវជាតិលេខ២ រាជធានីភ្នំពេញ',
      categories: ['ទៀន និង ធូប', 'គ្រឿងសក្ការៈបូជា'],
      outstandingBalance: 120.0,
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'sup_2',
      name: 'រោងជាងតម្បាញត្រៃចីវរបុរាណ',
      contactPerson: 'អ្នកស្រី សុផល',
      phone: '012 777 666',
      email: 'traditional.robes@supplier.com',
      address: 'ស្រុកកោះសូទិន ខេត្តកំពង់ចាម',
      categories: ['ត្រៃចីវរ និង សង្ឃភណ្ឌ'],
      outstandingBalance: 0,
      createdAt: '2026-01-12T08:00:00Z',
    },
  ],
  purchases: [
    {
      id: 'po_1',
      purchaseOrderNumber: 'PO-2026-001',
      supplierId: 'sup_1',
      supplierName: 'សិប្បកម្មទៀនធូបកម្ពុជា',
      items: [
        {
          productId: 'prod_1',
          productName: 'ធូបក្រអូបពិសេសផ្កាម្លិះ',
          quantity: 100,
          purchasePrice: 1.5,
          total: 150.0,
        },
      ],
      totalCost: 150.0,
      paymentStatus: 'paid',
      status: 'received',
      receivedDate: '2026-10-25T10:00:00Z',
      createdAt: '2026-10-20T08:00:00Z',
    },
  ],
  orders: [
    {
      id: 'ord_1',
      orderNumber: 'ORD-2026-001',
      customerId: 'cust_1',
      customerName: 'លោកជំទាវ សុខ គន្ធា',
      customerPhone: '012 345 678',
      items: [
        {
          productId: 'prod_3',
          productName: 'ឈុតត្រៃចីវរព្រះសង្ឃថ្នាក់លេខ១',
          quantity: 2,
          unitPrice: 38.0,
          totalPrice: 76.0,
        },
        {
          productId: 'prod_1',
          productName: 'ធូបក្រអូបពិសេសផ្កាម្លិះ',
          quantity: 4,
          unitPrice: 3.0,
          totalPrice: 12.0,
        },
      ],
      subtotal: 88.0,
      discount: 0,
      tax: 0,
      grandTotal: 88.0,
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      status: 'completed',
      cashierId: 'usr_cashier',
      cashierName: 'Bopha Vorn',
      createdAt: '2026-10-29T14:15:00Z',
    },
  ],
  expenses: [
    {
      id: 'exp_1',
      category: 'ថ្លៃជួលតូប / Rent',
      description: 'ថ្លៃជួលតូបហាងលក់សម្ភារៈបុណ្យប្រចាំខែ',
      amount: 250.0,
      paymentMethod: 'cash',
      date: '2026-10-01T08:00:00Z',
      recordedBy: 'Hong Ly',
      createdAt: '2026-10-01T08:00:00Z',
    },
    {
      id: 'exp_2',
      category: 'ថ្លៃភ្លើង / Electricity',
      description: 'វិក្កយបត្រអគ្គិសនីកម្ពុជា EDC',
      amount: 45.0,
      paymentMethod: 'qr',
      date: '2026-10-15T08:00:00Z',
      recordedBy: 'Hong Ly',
      createdAt: '2026-10-15T08:00:00Z',
    },
  ],
  notifications: [
    {
      id: 'notif_1',
      title: 'ស្តុកទៀនផ្កាឈូកជិតអស់ (Low Stock)',
      message: 'ទៀនផ្កាឈូកពណ៌លឿង នៅសល់ត្រឹមតែ ៤ ដើមប៉ុណ្ណោះ។ សូមបញ្ជាទិញបន្ថែម!',
      type: 'low_stock',
      read: false,
      date: '2026-10-31T07:15:00Z',
      link: '/inventory',
    },
    {
      id: 'notif_2',
      title: 'ការលក់ថ្មីតាម POS',
      message: 'ការកុម្ម៉ង់ ORD-2026-001 ($88.00) ត្រូវបានទូទាត់ជោគជ័យ។',
      type: 'order',
      read: true,
      date: '2026-10-29T14:15:00Z',
      link: '/orders',
    },
  ],
  settings: {
    storeName: 'ហុងលី​ លក់សម្ភារៈ​បុណ្យ',
    storeTagline: 'សម្ភារៈបុណ្យទានគ្រប់ប្រភេទ ទៀន ធូប ផ្កាឈូក ត្រៃចីវរ និងសង្ឃភណ្ឌ',
    logoUrl: 'https://images.unsplash.com/photo-1608755728617-aefab37d2edd?w=100&q=80',
    address: 'ផ្ទះលេខ ១២A ផ្លូវលេខ ៦៨ រាជធានីភ្នំពេញ (ជិតវត្តបទុមវត្តី)',
    phone: '+855 12 888 999 / 098 444 321',
    email: 'contact@honglystore.com',
    website: 'https://honglystore.github.io/honglystore/',
    currency: 'USD',
    khrExchangeRate: 4100,
    taxPercentage: 0,
    invoicePrefix: 'HL-INV-',
    receiptFooter: 'សូមអរគុណដែលបានជួយគាំទ្រ ហុងលី​ លក់សម្ភារៈ​បុណ្យ! សូមជូនពរមានសិរីសួស្តី ជោគជ័យគ្រប់ភារកិច្ច។',
    enableLoyalty: true,
    theme: 'light',
    language: 'km',
    backupAuto: true,
  },
  activityLogs: [
    {
      id: 'log_1',
      userId: 'usr_superadmin',
      userName: 'Hong Ly',
      action: 'ប្រព័ន្ធដំណើរការជោគជ័យ',
      module: 'System',
      details: 'មូលដ្ឋានទិន្នន័យហាងហុងលីបានរៀបចំរួចរាល់។',
      timestamp: new Date().toISOString(),
    },
  ],
};

function getState(): StandaloneState {
  if (typeof window === 'undefined') return initialSeed;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeed));
      return initialSeed;
    }
    return JSON.parse(raw);
  } catch {
    return initialSeed;
  }
}

function saveState(state: StandaloneState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export const standaloneDB = {
  isStaticHost(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      window.location.hostname.endsWith('github.io') ||
      window.location.protocol === 'file:' ||
      window.location.hostname.includes('github')
    );
  },

  // Auth
  getCurrentUser() {
    const state = getState();
    const token = typeof window !== 'undefined' ? localStorage.getItem('nexus_auth_token') : null;
    let user = state.users[0]; // Default Super Admin Hong Ly
    if (token) {
      try {
        const parsed = JSON.parse(atob(token.split('.')[1] || ''));
        const found = state.users.find(u => u.id === parsed.id || u.email === parsed.email);
        if (found) user = found;
      } catch {
        // use default
      }
    }
    const role = state.roles.find(r => r.name === user.role);
    const permissions = role ? role.permissions : [];
    return { user, permissions };
  },

  switchRole(roleName: string) {
    const state = getState();
    const user = state.users.find(u => u.role === roleName) || {
      id: `usr_${Date.now()}`,
      name: `${roleName} User`,
      email: `${roleName.toLowerCase().replace(/\s+/g, '')}@honglystore.com`,
      role: roleName,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    };
    const token = `standalone.${btoa(JSON.stringify(user))}.signature`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_auth_token', token);
    }
    return { token, user };
  },

  updateProfile(data: { name?: string; phone?: string; avatar?: string; newPassword?: string }) {
    const state = getState();
    const { user } = this.getCurrentUser();
    const idx = state.users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      if (data.name) state.users[idx].name = data.name;
      if (data.phone) state.users[idx].phone = data.phone;
      if (data.avatar) state.users[idx].avatar = data.avatar;
      saveState(state);
      return { success: true, user: state.users[idx] };
    }
    return { success: true, user };
  },

  // Dashboard Stats
  getDashboardStats() {
    const state = getState();
    const totalOrders = state.orders.length;
    const totalSales = state.orders.reduce((acc, o) => acc + (o.grandTotal || 0), 0);
    const totalProducts = state.products.length;
    const totalCustomers = state.customers.length;
    const lowStockCount = state.products.filter(p => p.stockQuantity <= p.minStockAlert).length;
    const pendingOrdersCount = state.orders.filter(o => o.status === 'pending').length;

    // Monthly revenue mock
    const monthlyRevenue = [
      { month: 'Jun', revenue: 1420 },
      { month: 'Jul', revenue: 1890 },
      { month: 'Aug', revenue: 2390 },
      { month: 'Sep', revenue: 2780 },
      { month: 'Oct', revenue: 3490 },
    ];

    // Daily sales mock
    const dailySales = [
      { date: 'Mon', sales: 120 },
      { date: 'Tue', sales: 240 },
      { date: 'Wed', sales: 180 },
      { date: 'Thu', sales: 320 },
      { date: 'Fri', sales: 490 },
      { date: 'Sat', sales: 650 },
      { date: 'Sun', sales: 580 },
    ];

    return {
      kpis: {
        totalRevenue: totalSales + 5240,
        totalOrders: totalOrders + 48,
        totalProducts,
        totalCustomers,
        lowStockCount,
        pendingOrdersCount,
      },
      charts: {
        monthlyRevenue,
        dailySales,
      },
      topSelling: state.products.slice(0, 4),
      recentOrders: state.orders.slice(0, 5),
    };
  },

  // Products
  getProducts(params?: { search?: string; category?: string; status?: string }) {
    const state = getState();
    let res = [...state.products];
    if (params?.search) {
      const q = params.search.toLowerCase();
      res = res.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q));
    }
    if (params?.category && params.category !== 'all') {
      res = res.filter(p => p.categoryId === params.category);
    }
    if (params?.status && params.status !== 'all') {
      res = res.filter(p => p.status === params.status);
    }
    return res;
  },

  createProduct(data: any) {
    const state = getState();
    const id = `prod_${Date.now()}`;
    const newProduct = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: (data.stockQuantity || 0) <= (data.minStockAlert || 5) ? 'low_stock' : 'in_stock',
    };
    state.products.unshift(newProduct);
    saveState(state);
    return newProduct;
  },

  updateProduct(id: string, updates: any) {
    const state = getState();
    const idx = state.products.findIndex(p => p.id === id);
    if (idx !== -1) {
      state.products[idx] = { ...state.products[idx], ...updates, updatedAt: new Date().toISOString() };
      saveState(state);
      return state.products[idx];
    }
    throw new Error('Product not found');
  },

  deleteProduct(id: string) {
    const state = getState();
    state.products = state.products.filter(p => p.id !== id);
    saveState(state);
    return { success: true };
  },

  // Categories
  getCategories() {
    return getState().categories;
  },

  createCategory(data: any) {
    const state = getState();
    const newCat = { ...data, id: `cat_${Date.now()}`, createdAt: new Date().toISOString() };
    state.categories.push(newCat);
    saveState(state);
    return newCat;
  },

  updateCategory(id: string, updates: any) {
    const state = getState();
    const idx = state.categories.findIndex(c => c.id === id);
    if (idx !== -1) {
      state.categories[idx] = { ...state.categories[idx], ...updates };
      saveState(state);
      return state.categories[idx];
    }
    throw new Error('Category not found');
  },

  deleteCategory(id: string) {
    const state = getState();
    state.categories = state.categories.filter(c => c.id !== id);
    saveState(state);
    return { success: true };
  },

  // POS & Checkout
  checkoutPOS(payload: any) {
    const state = getState();
    const orderId = `ord_${Date.now()}`;
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const newOrder = {
      id: orderId,
      orderNumber,
      ...payload,
      createdAt: new Date().toISOString(),
      status: 'completed',
    };

    // Deduct stock for sold items
    if (Array.isArray(payload.items)) {
      payload.items.forEach((item: any) => {
        const prod = state.products.find(p => p.id === item.productId);
        if (prod) {
          prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
          prod.status = prod.stockQuantity <= prod.minStockAlert ? 'low_stock' : 'in_stock';
          state.stockMovements.unshift({
            id: `mov_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            productId: prod.id,
            productName: prod.name,
            type: 'out',
            quantity: item.quantity,
            previousStock: prod.stockQuantity + item.quantity,
            newStock: prod.stockQuantity,
            reason: `POS Sale #${orderNumber}`,
            userId: payload.cashierId || 'usr_cashier',
            userName: payload.cashierName || 'Cashier',
            date: new Date().toISOString(),
          });
        }
      });
    }

    state.orders.unshift(newOrder);
    saveState(state);
    return newOrder;
  },

  // Orders
  getOrders(params?: { status?: string; search?: string }) {
    const state = getState();
    let res = [...state.orders];
    if (params?.status && params.status !== 'all') {
      res = res.filter(o => o.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      res = res.filter(o => o.orderNumber.toLowerCase().includes(q) || (o.customerName && o.customerName.toLowerCase().includes(q)));
    }
    return res;
  },

  updateOrderStatus(id: string, status: string) {
    const state = getState();
    const ord = state.orders.find(o => o.id === id);
    if (ord) {
      ord.status = status;
      saveState(state);
      return ord;
    }
    throw new Error('Order not found');
  },

  // Inventory
  getInventoryValuation() {
    const state = getState();
    const totalItems = state.products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0);
    const totalCostValue = state.products.reduce((acc, p) => acc + (p.stockQuantity || 0) * (p.purchasePrice || 0), 0);
    const totalRetailValue = state.products.reduce((acc, p) => acc + (p.stockQuantity || 0) * (p.sellingPrice || 0), 0);
    const potentialProfit = totalRetailValue - totalCostValue;
    return {
      totalItems,
      totalCostValue,
      totalRetailValue,
      potentialProfit,
      lowStockCount: state.products.filter(p => p.stockQuantity <= p.minStockAlert).length,
    };
  },

  getStockMovements() {
    return getState().stockMovements;
  },

  adjustStock(data: { productId: string; type: string; quantity: number; reason: string }) {
    const state = getState();
    const prod = state.products.find(p => p.id === data.productId);
    if (!prod) throw new Error('Product not found');

    const prev = prod.stockQuantity;
    const delta = data.type === 'in' ? data.quantity : -data.quantity;
    prod.stockQuantity = Math.max(0, prod.stockQuantity + delta);
    prod.status = prod.stockQuantity <= prod.minStockAlert ? 'low_stock' : 'in_stock';

    const mov = {
      id: `mov_${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      type: data.type,
      quantity: data.quantity,
      previousStock: prev,
      newStock: prod.stockQuantity,
      reason: data.reason,
      userId: 'usr_superadmin',
      userName: 'Hong Ly',
      date: new Date().toISOString(),
    };
    state.stockMovements.unshift(mov);
    saveState(state);
    return mov;
  },

  // Customers
  getCustomers(params?: { search?: string }) {
    const state = getState();
    let res = [...state.customers];
    if (params?.search) {
      const q = params.search.toLowerCase();
      res = res.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
    }
    return res;
  },

  createCustomer(data: any) {
    const state = getState();
    const newCust = {
      ...data,
      id: `cust_${Date.now()}`,
      totalSpent: 0,
      loyaltyPoints: 0,
      tier: 'Bronze',
      createdAt: new Date().toISOString(),
    };
    state.customers.push(newCust);
    saveState(state);
    return newCust;
  },

  updateCustomer(id: string, data: any) {
    const state = getState();
    const idx = state.customers.findIndex(c => c.id === id);
    if (idx !== -1) {
      state.customers[idx] = { ...state.customers[idx], ...data };
      saveState(state);
      return state.customers[idx];
    }
    throw new Error('Customer not found');
  },

  deleteCustomer(id: string) {
    const state = getState();
    state.customers = state.customers.filter(c => c.id !== id);
    saveState(state);
    return { success: true };
  },

  // Suppliers
  getSuppliers() {
    return getState().suppliers;
  },

  createSupplier(data: any) {
    const state = getState();
    const newSup = { ...data, id: `sup_${Date.now()}`, createdAt: new Date().toISOString() };
    state.suppliers.push(newSup);
    saveState(state);
    return newSup;
  },

  updateSupplier(id: string, data: any) {
    const state = getState();
    const idx = state.suppliers.findIndex(s => s.id === id);
    if (idx !== -1) {
      state.suppliers[idx] = { ...state.suppliers[idx], ...data };
      saveState(state);
      return state.suppliers[idx];
    }
    throw new Error('Supplier not found');
  },

  deleteSupplier(id: string) {
    const state = getState();
    state.suppliers = state.suppliers.filter(s => s.id !== id);
    saveState(state);
    return { success: true };
  },

  // Purchases
  getPurchases() {
    return getState().purchases;
  },

  createPurchase(data: any) {
    const state = getState();
    const newPo = {
      ...data,
      id: `po_${Date.now()}`,
      purchaseOrderNumber: `PO-${Date.now().toString().slice(-6)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    state.purchases.unshift(newPo);
    saveState(state);
    return newPo;
  },

  receivePurchase(id: string) {
    const state = getState();
    const po = state.purchases.find(p => p.id === id);
    if (po) {
      po.status = 'received';
      po.receivedDate = new Date().toISOString();
      // Increase inventory
      if (Array.isArray(po.items)) {
        po.items.forEach((item: any) => {
          const prod = state.products.find(p => p.id === item.productId);
          if (prod) {
            prod.stockQuantity += item.quantity;
            prod.status = prod.stockQuantity <= prod.minStockAlert ? 'low_stock' : 'in_stock';
          }
        });
      }
      saveState(state);
      return po;
    }
    throw new Error('Purchase order not found');
  },

  // Expenses
  getExpenses() {
    return getState().expenses;
  },

  createExpense(data: any) {
    const state = getState();
    const newExp = {
      ...data,
      id: `exp_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    state.expenses.unshift(newExp);
    saveState(state);
    return newExp;
  },

  deleteExpense(id: string) {
    const state = getState();
    state.expenses = state.expenses.filter(e => e.id !== id);
    saveState(state);
    return { success: true };
  },

  // Reports
  getReports(range: string = 'month') {
    const state = getState();
    const totalSales = state.orders.reduce((acc, o) => acc + (o.grandTotal || 0), 0);
    const totalExpenses = state.expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    return {
      range,
      totalSales: totalSales + 4800,
      totalExpenses: totalExpenses + 1200,
      netProfit: totalSales + 4800 - (totalExpenses + 1200),
      orderCount: state.orders.length + 35,
      taxCollected: 0,
      categorySales: state.categories.map(c => ({
        category: c.name.split(' ')[0],
        sales: Math.floor(Math.random() * 800) + 300,
      })),
    };
  },

  // Users & Roles
  getUsers() {
    return getState().users;
  },

  createUser(data: any) {
    const state = getState();
    const newUser = {
      ...data,
      id: `usr_${Date.now()}`,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    state.users.push(newUser);
    saveState(state);
    return newUser;
  },

  updateUser(id: string, data: any) {
    const state = getState();
    const idx = state.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      state.users[idx] = { ...state.users[idx], ...data };
      saveState(state);
      return state.users[idx];
    }
    throw new Error('User not found');
  },

  getRoles() {
    const state = getState();
    return { roles: state.roles, permissions: state.permissions };
  },

  // Settings
  getSettings() {
    return getState().settings;
  },

  updateSettings(updates: any) {
    const state = getState();
    state.settings = { ...state.settings, ...updates };
    saveState(state);
    return state.settings;
  },

  // Notifications
  getNotifications() {
    return getState().notifications;
  },

  markNotificationRead(id: string) {
    const state = getState();
    const notif = state.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      saveState(state);
    }
    return { success: true };
  },

  markAllNotificationsRead() {
    const state = getState();
    state.notifications.forEach(n => (n.read = true));
    saveState(state);
    return { success: true };
  },

  // Activity Logs
  getActivityLogs() {
    return getState().activityLogs;
  },
};
