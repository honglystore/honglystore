import express from 'express';
import { db } from '../db.js';
import {
  authenticateToken,
  generateToken,
  comparePassword,
  hashPassword,
  AuthRequest,
  requireRole,
  requirePermission,
} from '../auth.js';
import {
  Product,
  Category,
  Customer,
  Supplier,
  Purchase,
  Expense,
  StoreSettings,
  RoleName,
  User,
} from '../types.js';

const router = express.Router();

// ==========================================
// 1. AUTHENTICATION & SESSION ROUTES
// ==========================================

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const database = db.getDb();
  const user = database.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user || !user.passwordHash || !comparePassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (user.status === 'disabled') {
    return res.status(403).json({ error: 'Your account is currently disabled. Please contact admin.' });
  }

  user.lastLoginAt = new Date().toISOString();
  db.save();

  db.logActivity({
    userId: user.id,
    userName: user.name,
    action: 'User Logged In',
    module: 'Auth',
    details: `User ${user.email} signed in successfully.`,
  });

  const token = generateToken(user);
  const { passwordHash: _, ...userSafe } = user;
  res.json({ token, user: userSafe });
});

router.post('/auth/google', (req, res) => {
  // Google sign in simulation/demo
  const { email, name, avatar } = req.body;
  const database = db.getDb();
  let user = database.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());

  if (!user) {
    user = {
      id: `usr_${Date.now()}`,
      name: name || 'Google User',
      email: email || `user_${Date.now()}@gmail.com`,
      role: 'Cashier',
      avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    database.users.push(user);
  } else {
    user.lastLoginAt = new Date().toISOString();
  }

  db.save();
  const token = generateToken(user);
  const { passwordHash: _, ...userSafe } = user;
  res.json({ token, user: userSafe });
});

router.post('/auth/switch-demo', (req, res) => {
  const { role } = req.body;
  const database = db.getDb();
  const targetUser = database.users.find(u => u.role === role && u.status === 'active');

  if (!targetUser) {
    return res.status(404).json({ error: `No active user found with role "${role}".` });
  }

  targetUser.lastLoginAt = new Date().toISOString();
  db.save();

  const token = generateToken(targetUser);
  const { passwordHash: _, ...userSafe } = targetUser;
  res.json({ token, user: userSafe });
});

router.get('/auth/me', authenticateToken, (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
  const database = db.getDb();
  const roleObj = database.roles.find(r => r.name === req.user?.role);
  const { passwordHash: _, ...userSafe } = req.user;
  res.json({
    user: userSafe,
    permissions: roleObj ? roleObj.permissions : [],
  });
});

// ==========================================
// 2. DASHBOARD & ANALYTICS API
// ==========================================

router.get('/dashboard/stats', authenticateToken, (req: AuthRequest, res) => {
  const data = db.getDb();

  const totalSalesCount = data.orders.filter(o => o.status === 'completed').length;
  const totalRevenue = data.orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const totalProducts = data.products.length;
  const totalOrders = data.orders.length;
  const totalCustomers = data.customers.length;

  const lowStockItems = data.products.filter(p => p.stockQuantity <= p.minStockAlert);
  const lowStockCount = lowStockItems.length;
  const pendingOrdersCount = data.orders.filter(o => o.status === 'pending').length;

  // Best selling products calculation
  const productSalesMap: Record<string, { product: Product; unitsSold: number; totalRevenue: number }> = {};
  data.orders.filter(o => o.status === 'completed').forEach(order => {
    order.items.forEach(item => {
      if (!productSalesMap[item.productId]) {
        const prod = data.products.find(p => p.id === item.productId);
        if (prod) {
          productSalesMap[item.productId] = { product: prod, unitsSold: 0, totalRevenue: 0 };
        }
      }
      if (productSalesMap[item.productId]) {
        productSalesMap[item.productId].unitsSold += item.quantity;
        productSalesMap[item.productId].totalRevenue += item.total;
      }
    });
  });

  const bestSellingProducts = Object.values(productSalesMap)
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 5);

  // Daily Sales for chart (last 7 days)
  const days: { date: string; label: string; revenue: number; orders: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });

    const dayOrders = data.orders.filter(o => o.status === 'completed' && o.date.startsWith(dateStr));
    const dayRev = dayOrders.reduce((sum, o) => sum + o.grandTotal, 0);

    days.push({
      date: dateStr,
      label: dayLabel,
      revenue: Number(dayRev.toFixed(2)),
      orders: dayOrders.length,
    });
  }

  // Monthly revenue chart (past 6 months)
  const months: { month: string; revenue: number; profit: number }[] = [];
  for (let m = 5; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const monthKey = d.toISOString().slice(0, 7); // YYYY-MM
    const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const monthOrders = data.orders.filter(o => o.status === 'completed' && o.date.startsWith(monthKey));
    const monthRev = monthOrders.reduce((sum, o) => sum + o.grandTotal, 0);

    // Approximate cost
    let monthCost = 0;
    monthOrders.forEach(ord => {
      ord.items.forEach(it => {
        const prod = data.products.find(p => p.id === it.productId);
        if (prod) monthCost += prod.purchasePrice * it.quantity;
      });
    });

    const monthExpenses = data.expenses
      .filter(e => e.date.startsWith(monthKey))
      .reduce((sum, e) => sum + e.amount, 0);

    const netProfit = monthRev - monthCost - monthExpenses;

    months.push({
      month: monthLabel,
      revenue: Number(monthRev.toFixed(2)),
      profit: Number(Math.max(0, netProfit).toFixed(2)),
    });
  }

  // Category sales share
  const categorySalesMap: Record<string, number> = {};
  data.orders.filter(o => o.status === 'completed').forEach(order => {
    order.items.forEach(item => {
      const prod = data.products.find(p => p.id === item.productId);
      const cat = prod?.categoryName || 'Other';
      categorySalesMap[cat] = (categorySalesMap[cat] || 0) + item.total;
    });
  });

  const categoryShare = Object.entries(categorySalesMap).map(([name, value]) => ({
    name,
    value: Number(value.toFixed(2)),
  }));

  res.json({
    totalSalesCount,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalProducts,
    totalOrders,
    totalCustomers,
    lowStockCount,
    lowStockItems: lowStockItems.slice(0, 5),
    pendingOrdersCount,
    dailyChart: days,
    monthlyChart: months,
    categoryShare,
    bestSellingProducts,
    recentOrders: data.orders.slice(0, 6),
    recentTransactions: data.orders.filter(o => o.status === 'completed').slice(0, 5),
  });
});

// ==========================================
// 3. PRODUCT MANAGEMENT
// ==========================================

router.get('/products', authenticateToken, (req, res) => {
  const data = db.getDb();
  let products = [...data.products];

  const { search, category, status, sortBy, sortOrder } = req.query;

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    products = products.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
    );
  }

  if (category && typeof category === 'string' && category !== 'all') {
    products = products.filter(p => p.categoryId === category);
  }

  if (status && typeof status === 'string' && status !== 'all') {
    products = products.filter(p => p.status === status);
  }

  if (sortBy && typeof sortBy === 'string') {
    const order = sortOrder === 'desc' ? -1 : 1;
    products.sort((a, b) => {
      const valA = (a as any)[sortBy];
      const valB = (b as any)[sortBy];
      if (typeof valA === 'string') {
        return valA.localeCompare(valB) * order;
      }
      return ((valA || 0) - (valB || 0)) * order;
    });
  } else {
    // Default newest first
    products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json(products);
});

router.post('/products', authenticateToken, requirePermission('products.manage'), (req: AuthRequest, res) => {
  const data = db.getDb();
  const {
    name,
    sku,
    barcode,
    categoryId,
    brand,
    purchasePrice,
    sellingPrice,
    stockQuantity,
    minStockAlert,
    description,
    expirationDate,
    imageUrl,
  } = req.body;

  if (!name || !sku || !barcode || !categoryId || purchasePrice === undefined || sellingPrice === undefined) {
    return res.status(400).json({ error: 'Please provide all required product fields.' });
  }

  // Check unique SKU and Barcode
  if (data.products.some(p => p.sku.toLowerCase() === sku.toLowerCase())) {
    return res.status(400).json({ error: `A product with SKU "${sku}" already exists.` });
  }
  if (data.products.some(p => p.barcode === barcode)) {
    return res.status(400).json({ error: `A product with barcode "${barcode}" already exists.` });
  }

  const category = data.categories.find(c => c.id === categoryId);
  const initialStock = Number(stockQuantity) || 0;
  const minStock = Number(minStockAlert) || 5;

  let status: Product['status'] = 'in_stock';
  if (initialStock === 0) status = 'out_of_stock';
  else if (initialStock <= minStock) status = 'low_stock';

  const newProduct: Product = {
    id: `prod_${Date.now()}`,
    name,
    sku: sku.toUpperCase(),
    barcode,
    categoryId,
    categoryName: category?.name || 'Unassigned',
    brand: brand || 'Nexus Store',
    purchasePrice: Number(purchasePrice),
    sellingPrice: Number(sellingPrice),
    stockQuantity: initialStock,
    minStockAlert: minStock,
    description: description || '',
    status,
    expirationDate,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.products.unshift(newProduct);

  if (initialStock > 0) {
    data.stock_movements.unshift({
      id: `sm_${Date.now()}`,
      productId: newProduct.id,
      productName: newProduct.name,
      type: 'in',
      quantity: initialStock,
      previousStock: 0,
      newStock: initialStock,
      date: new Date().toISOString(),
      userId: req.user!.id,
      userName: req.user!.name,
      reason: 'Initial stock intake on creation',
    });
  }

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'Product Created',
    module: 'Products',
    details: `Added new product "${newProduct.name}" (SKU: ${newProduct.sku}) with ${initialStock} units.`,
  });

  db.save();
  res.status(201).json(newProduct);
});

router.put('/products/:id', authenticateToken, requirePermission('products.manage'), (req: AuthRequest, res) => {
  const data = db.getDb();
  const product = data.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const {
    name,
    sku,
    barcode,
    categoryId,
    brand,
    purchasePrice,
    sellingPrice,
    stockQuantity,
    minStockAlert,
    description,
    expirationDate,
    imageUrl,
  } = req.body;

  // SKU check
  if (sku && sku.toLowerCase() !== product.sku.toLowerCase()) {
    if (data.products.some(p => p.id !== product.id && p.sku.toLowerCase() === sku.toLowerCase())) {
      return res.status(400).json({ error: `SKU "${sku}" is already in use by another product.` });
    }
  }

  if (categoryId) {
    const category = data.categories.find(c => c.id === categoryId);
    product.categoryId = categoryId;
    product.categoryName = category?.name || product.categoryName;
  }

  if (name) product.name = name;
  if (sku) product.sku = sku.toUpperCase();
  if (barcode) product.barcode = barcode;
  if (brand) product.brand = brand;
  if (purchasePrice !== undefined) product.purchasePrice = Number(purchasePrice);
  if (sellingPrice !== undefined) product.sellingPrice = Number(sellingPrice);
  if (minStockAlert !== undefined) product.minStockAlert = Number(minStockAlert);
  if (description !== undefined) product.description = description;
  if (expirationDate !== undefined) product.expirationDate = expirationDate;
  if (imageUrl !== undefined) product.imageUrl = imageUrl;

  // Stock update if changed manually
  if (stockQuantity !== undefined && Number(stockQuantity) !== product.stockQuantity) {
    const prev = product.stockQuantity;
    const target = Number(stockQuantity);
    product.stockQuantity = target;

    data.stock_movements.unshift({
      id: `sm_${Date.now()}`,
      productId: product.id,
      productName: product.name,
      type: 'adjustment',
      quantity: Math.abs(target - prev),
      previousStock: prev,
      newStock: target,
      date: new Date().toISOString(),
      userId: req.user!.id,
      userName: req.user!.name,
      reason: 'Product record updated via editor',
    });
  }

  // Re-evaluate stock status
  if (product.stockQuantity === 0) product.status = 'out_of_stock';
  else if (product.stockQuantity <= product.minStockAlert) product.status = 'low_stock';
  else product.status = 'in_stock';

  product.updatedAt = new Date().toISOString();

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'Product Updated',
    module: 'Products',
    details: `Updated details for product "${product.name}".`,
  });

  db.save();
  res.json(product);
});

router.delete('/products/:id', authenticateToken, requirePermission('products.manage'), (req: AuthRequest, res) => {
  const data = db.getDb();
  const index = data.products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Product not found.' });

  const deleted = data.products.splice(index, 1)[0];

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'Product Deleted',
    module: 'Products',
    details: `Removed product "${deleted.name}" (SKU: ${deleted.sku}).`,
  });

  db.save();
  res.json({ success: true, message: `Product "${deleted.name}" removed.` });
});

router.post('/products/import-csv', authenticateToken, requirePermission('products.manage'), (req: AuthRequest, res) => {
  const { csvData } = req.body;
  if (!csvData || typeof csvData !== 'string') {
    return res.status(400).json({ error: 'Invalid CSV data string.' });
  }

  const lines = csvData.trim().split('\n');
  if (lines.length < 2) {
    return res.status(400).json({ error: 'CSV must contain a header row and at least one item.' });
  }

  const data = db.getDb();
  let importedCount = 0;

  // Header format: Name,SKU,Barcode,Category,Brand,PurchasePrice,SellingPrice,StockQuantity,MinStock
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    if (cols.length < 5) continue;

    const [name, sku, barcode, categoryName, brand, purchasePrice, sellingPrice, stock, minStock] = cols;
    if (!name || !sku) continue;

    // Find or create category
    let category = data.categories.find(c => c.name.toLowerCase() === (categoryName || '').toLowerCase());
    if (!category && categoryName) {
      category = {
        id: `cat_${Date.now()}_${i}`,
        name: categoryName,
        createdAt: new Date().toISOString(),
      };
      data.categories.push(category);
    }

    const initialStock = Number(stock) || 0;
    const minAlert = Number(minStock) || 5;

    const newProd: Product = {
      id: `prod_${Date.now()}_${i}`,
      name,
      sku: sku.toUpperCase(),
      barcode: barcode || Math.floor(100000000000 + Math.random() * 900000000000).toString(),
      categoryId: category?.id || data.categories[0]?.id || 'cat_default',
      categoryName: category?.name || 'General',
      brand: brand || 'Generic',
      purchasePrice: Number(purchasePrice) || 10,
      sellingPrice: Number(sellingPrice) || 15,
      stockQuantity: initialStock,
      minStockAlert: minAlert,
      description: 'Imported via CSV',
      status: initialStock > minAlert ? 'in_stock' : (initialStock > 0 ? 'low_stock' : 'out_of_stock'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.products.push(newProd);
    importedCount++;
  }

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'Products CSV Import',
    module: 'Products',
    details: `Imported ${importedCount} products via CSV batch.`,
  });

  db.save();
  res.json({ success: true, count: importedCount });
});

// ==========================================
// 4. CATEGORY MANAGEMENT
// ==========================================

router.get('/categories', authenticateToken, (req, res) => {
  const data = db.getDb();
  // Include live product count
  const categoriesWithCount = data.categories.map(c => {
    const productCount = data.products.filter(p => p.categoryId === c.id).length;
    return { ...c, productCount };
  });
  res.json(categoriesWithCount);
});

router.post('/categories', authenticateToken, requirePermission('categories.manage'), (req: AuthRequest, res) => {
  const { name, description, imageUrl } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name is required.' });

  const data = db.getDb();
  if (data.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    return res.status(400).json({ error: 'Category name already exists.' });
  }

  const newCat: Category = {
    id: `cat_${Date.now()}`,
    name,
    description: description || '',
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&q=80',
    createdAt: new Date().toISOString(),
  };

  data.categories.push(newCat);
  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'Category Created',
    module: 'Categories',
    details: `Created category "${newCat.name}".`,
  });

  db.save();
  res.status(201).json(newCat);
});

router.put('/categories/:id', authenticateToken, requirePermission('categories.manage'), (req: AuthRequest, res) => {
  const data = db.getDb();
  const cat = data.categories.find(c => c.id === req.params.id);
  if (!cat) return res.status(404).json({ error: 'Category not found.' });

  const { name, description, imageUrl } = req.body;
  if (name) cat.name = name;
  if (description !== undefined) cat.description = description;
  if (imageUrl !== undefined) cat.imageUrl = imageUrl;

  // Sync categoryName on attached products
  data.products.forEach(p => {
    if (p.categoryId === cat.id) p.categoryName = cat.name;
  });

  db.save();
  res.json(cat);
});

router.delete('/categories/:id', authenticateToken, requirePermission('categories.manage'), (req: AuthRequest, res) => {
  const data = db.getDb();
  const index = data.categories.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Category not found.' });

  const linkedProducts = data.products.filter(p => p.categoryId === req.params.id);
  if (linkedProducts.length > 0) {
    return res.status(400).json({
      error: `Cannot delete category. ${linkedProducts.length} product(s) are assigned to it. Reassign them first.`,
    });
  }

  const deleted = data.categories.splice(index, 1)[0];
  db.save();
  res.json({ success: true, message: `Category "${deleted.name}" deleted.` });
});

// ==========================================
// 5. INVENTORY & STOCK MANAGEMENT
// ==========================================

router.get('/inventory/valuation', authenticateToken, (req, res) => {
  const data = db.getDb();
  let totalCostValuation = 0;
  let totalRetailValuation = 0;
  let totalStockUnits = 0;

  data.products.forEach(p => {
    totalCostValuation += p.purchasePrice * p.stockQuantity;
    totalRetailValuation += p.sellingPrice * p.stockQuantity;
    totalStockUnits += p.stockQuantity;
  });

  const potentialProfit = totalRetailValuation - totalCostValuation;
  const marginPercentage = totalRetailValuation > 0 ? (potentialProfit / totalRetailValuation) * 100 : 0;

  res.json({
    totalCostValuation: Number(totalCostValuation.toFixed(2)),
    totalRetailValuation: Number(totalRetailValuation.toFixed(2)),
    potentialProfit: Number(potentialProfit.toFixed(2)),
    marginPercentage: Number(marginPercentage.toFixed(1)),
    totalStockUnits,
    lowStockCount: data.products.filter(p => p.stockQuantity <= p.minStockAlert).length,
  });
});

router.get('/inventory/movements', authenticateToken, (req, res) => {
  const data = db.getDb();
  const { productId, type } = req.query;

  let movements = [...data.stock_movements];
  if (productId && typeof productId === 'string') {
    movements = movements.filter(m => m.productId === productId);
  }
  if (type && typeof type === 'string' && type !== 'all') {
    movements = movements.filter(m => m.type === type);
  }

  res.json(movements.slice(0, 100));
});

router.post('/inventory/adjust', authenticateToken, requirePermission('inventory.adjust'), (req: AuthRequest, res) => {
  const { productId, type, quantity, reason } = req.body;
  if (!productId || !type || quantity === undefined) {
    return res.status(400).json({ error: 'Missing required stock adjustment fields.' });
  }

  const result = db.adjustStock({
    productId,
    type,
    quantity: Number(quantity),
    reason: reason || 'Manual adjustment',
    user: { id: req.user!.id, name: req.user!.name },
  });

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ success: true, product: result.product });
});

// ==========================================
// 6. POS & CHECKOUT
// ==========================================

router.get('/pos/barcode/:code', authenticateToken, (req, res) => {
  const data = db.getDb();
  const code = req.params.code.trim().toLowerCase();
  const product = data.products.find(
    p => p.barcode.toLowerCase() === code || p.sku.toLowerCase() === code
  );

  if (!product) {
    return res.status(404).json({ error: 'Product not found with scanned barcode/SKU.' });
  }

  res.json(product);
});

router.post('/pos/checkout', authenticateToken, requirePermission('pos.access'), (req: AuthRequest, res) => {
  const { customerId, customerName, items, subtotal, discount, tax, grandTotal, paymentMethod, notes, currency } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty. Add items before checking out.' });
  }

  const result = db.executeSaleTransaction({
    customerId,
    customerName,
    items,
    subtotal: Number(subtotal),
    discount: Number(discount) || 0,
    tax: Number(tax) || 0,
    grandTotal: Number(grandTotal),
    paymentMethod: paymentMethod || 'cash',
    cashierUser: { id: req.user!.id, name: req.user!.name },
    currency: currency || 'USD',
    notes,
  });

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ success: true, order: result.order });
});

// ==========================================
// 7. ORDER MANAGEMENT
// ==========================================

router.get('/orders', authenticateToken, (req, res) => {
  const data = db.getDb();
  const { status, search } = req.query;

  let orders = [...data.orders];

  if (status && typeof status === 'string' && status !== 'all') {
    orders = orders.filter(o => o.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    orders = orders.filter(
      o =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.cashierName.toLowerCase().includes(q)
    );
  }

  res.json(orders);
});

router.get('/orders/:id', authenticateToken, (req, res) => {
  const data = db.getDb();
  const order = data.orders.find(o => o.id === req.params.id || o.orderNumber === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json(order);
});

router.put('/orders/:id/status', authenticateToken, requirePermission('orders.manage'), (req: AuthRequest, res) => {
  const data = db.getDb();
  const order = data.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  const { status, restockItems } = req.body;

  if (status === 'cancelled' && order.status !== 'cancelled' && restockItems) {
    // Return items to inventory
    order.items.forEach(item => {
      const prod = data.products.find(p => p.id === item.productId);
      if (prod) {
        const prev = prod.stockQuantity;
        prod.stockQuantity += item.quantity;
        if (prod.stockQuantity > prod.minStockAlert) prod.status = 'in_stock';

        data.stock_movements.unshift({
          id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          productId: prod.id,
          productName: prod.name,
          type: 'in',
          quantity: item.quantity,
          previousStock: prev,
          newStock: prod.stockQuantity,
          date: new Date().toISOString(),
          userId: req.user!.id,
          userName: req.user!.name,
          reason: `Restock from cancelled order ${order.orderNumber}`,
          referenceId: order.orderNumber,
        });
      }
    });
  }

  order.status = status;
  db.save();

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'Order Status Updated',
    module: 'Orders',
    details: `Updated ${order.orderNumber} status to "${status}".`,
  });

  res.json(order);
});

// ==========================================
// 8. CUSTOMER MANAGEMENT (CRM)
// ==========================================

router.get('/customers', authenticateToken, (req, res) => {
  const data = db.getDb();
  const { search, tier } = req.query;

  let customers = [...data.customers];

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    customers = customers.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }

  if (tier && typeof tier === 'string' && tier !== 'all') {
    customers = customers.filter(c => c.membershipLevel === tier);
  }

  res.json(customers);
});

router.post('/customers', authenticateToken, requirePermission('customers.manage'), (req: AuthRequest, res) => {
  const { name, phone, email, address } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Customer name and phone number are required.' });
  }

  const data = db.getDb();
  const newCustomer: Customer = {
    id: `cust_${Date.now()}`,
    name,
    phone,
    email: email || '',
    address: address || '',
    totalSpending: 0,
    loyaltyPoints: 0,
    membershipLevel: 'Bronze',
    createdAt: new Date().toISOString(),
  };

  data.customers.unshift(newCustomer);

  db.addNotification({
    title: 'New Customer Registered',
    message: `${newCustomer.name} (${newCustomer.phone}) added to CRM.`,
    type: 'customer',
    link: '/customers',
  });

  db.save();
  res.status(201).json(newCustomer);
});

router.put('/customers/:id', authenticateToken, requirePermission('customers.manage'), (req: AuthRequest, res) => {
  const data = db.getDb();
  const cust = data.customers.find(c => c.id === req.params.id);
  if (!cust) return res.status(404).json({ error: 'Customer not found.' });

  const { name, phone, email, address, membershipLevel, loyaltyPoints } = req.body;
  if (name) cust.name = name;
  if (phone) cust.phone = phone;
  if (email !== undefined) cust.email = email;
  if (address !== undefined) cust.address = address;
  if (membershipLevel) cust.membershipLevel = membershipLevel;
  if (loyaltyPoints !== undefined) cust.loyaltyPoints = Number(loyaltyPoints);

  db.save();
  res.json(cust);
});

router.delete('/customers/:id', authenticateToken, requirePermission('customers.manage'), (req: AuthRequest, res) => {
  const data = db.getDb();
  const index = data.customers.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Customer not found.' });

  const deleted = data.customers.splice(index, 1)[0];
  db.save();
  res.json({ success: true, message: `Customer "${deleted.name}" removed.` });
});

router.get('/customers/:id/orders', authenticateToken, (req, res) => {
  const data = db.getDb();
  const customerOrders = data.orders.filter(o => o.customerId === req.params.id);
  res.json(customerOrders);
});

// ==========================================
// 9. SUPPLIER MANAGEMENT
// ==========================================

router.get('/suppliers', authenticateToken, (req, res) => {
  const data = db.getDb();
  res.json(data.suppliers);
});

router.post('/suppliers', authenticateToken, requirePermission('suppliers.manage'), (req: AuthRequest, res) => {
  const { name, contactPerson, phone, email, address } = req.body;
  if (!name) return res.status(400).json({ error: 'Supplier name is required.' });

  const data = db.getDb();
  const newSupplier: Supplier = {
    id: `sup_${Date.now()}`,
    name,
    contactPerson: contactPerson || '',
    phone: phone || '',
    email: email || '',
    address: address || '',
    outstandingBalance: 0,
    createdAt: new Date().toISOString(),
  };

  data.suppliers.unshift(newSupplier);
  db.save();
  res.status(201).json(newSupplier);
});

router.put('/suppliers/:id', authenticateToken, requirePermission('suppliers.manage'), (req: AuthRequest, res) => {
  const data = db.getDb();
  const sup = data.suppliers.find(s => s.id === req.params.id);
  if (!sup) return res.status(404).json({ error: 'Supplier not found.' });

  const { name, contactPerson, phone, email, address, outstandingBalance } = req.body;
  if (name) sup.name = name;
  if (contactPerson !== undefined) sup.contactPerson = contactPerson;
  if (phone !== undefined) sup.phone = phone;
  if (email !== undefined) sup.email = email;
  if (address !== undefined) sup.address = address;
  if (outstandingBalance !== undefined) sup.outstandingBalance = Number(outstandingBalance);

  db.save();
  res.json(sup);
});

router.delete('/suppliers/:id', authenticateToken, requirePermission('suppliers.manage'), (req: AuthRequest, res) => {
  const data = db.getDb();
  const index = data.suppliers.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Supplier not found.' });

  const deleted = data.suppliers.splice(index, 1)[0];
  db.save();
  res.json({ success: true, message: `Supplier "${deleted.name}" removed.` });
});

// ==========================================
// 10. PURCHASE ORDERS MANAGEMENT
// ==========================================

router.get('/purchases', authenticateToken, (req, res) => {
  const data = db.getDb();
  res.json(data.purchases);
});

router.post('/purchases', authenticateToken, requirePermission('purchases.manage'), (req: AuthRequest, res) => {
  const { supplierId, items, paymentStatus, notes } = req.body;
  if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Please select a supplier and add at least one item.' });
  }

  const data = db.getDb();
  const supplier = data.suppliers.find(s => s.id === supplierId);
  if (!supplier) return res.status(404).json({ error: 'Supplier not found.' });

  let totalCost = 0;
  const purchaseItems = items.map((it: any) => {
    const cost = Number(it.purchasePrice) * Number(it.quantity);
    totalCost += cost;
    return {
      productId: it.productId,
      productName: it.productName,
      sku: it.sku,
      quantity: Number(it.quantity),
      purchasePrice: Number(it.purchasePrice),
      totalCost: cost,
    };
  });

  const purchaseNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newPO: Purchase = {
    id: `po_${Date.now()}`,
    purchaseNumber,
    supplierId,
    supplierName: supplier.name,
    totalCost: Number(totalCost.toFixed(2)),
    paymentStatus: paymentStatus || 'pending',
    status: 'ordered',
    date: new Date().toISOString(),
    notes,
    items: purchaseItems,
  };

  data.purchases.unshift(newPO);

  if (paymentStatus === 'pending') {
    supplier.outstandingBalance += totalCost;
  }

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'Purchase Order Created',
    module: 'Purchases',
    details: `Created ${newPO.purchaseNumber} for ${supplier.name} ($${newPO.totalCost.toFixed(2)}).`,
  });

  db.save();
  res.status(201).json(newPO);
});

router.post('/purchases/:id/receive', authenticateToken, requirePermission('purchases.manage'), (req: AuthRequest, res) => {
  const result = db.receivePurchaseTransaction(req.params.id, {
    id: req.user!.id,
    name: req.user!.name,
  });

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ success: true, message: 'Stock received and inventory successfully updated.' });
});

router.put('/purchases/:id/cancel', authenticateToken, requirePermission('purchases.manage'), (req: AuthRequest, res) => {
  const data = db.getDb();
  const po = data.purchases.find(p => p.id === req.params.id);
  if (!po) return res.status(404).json({ error: 'Purchase order not found.' });

  if (po.status === 'received') {
    return res.status(400).json({ error: 'Cannot cancel a purchase that has already been received into stock.' });
  }

  po.status = 'cancelled';
  db.save();
  res.json({ success: true, message: `${po.purchaseNumber} cancelled.` });
});

// ==========================================
// 11. EXPENSE MANAGEMENT
// ==========================================

router.get('/expenses', authenticateToken, (req, res) => {
  const data = db.getDb();
  const { category, month } = req.query;

  let expenses = [...data.expenses];
  if (category && typeof category === 'string' && category !== 'all') {
    expenses = expenses.filter(e => e.category === category);
  }
  if (month && typeof month === 'string') {
    expenses = expenses.filter(e => e.date.startsWith(month));
  }

  res.json(expenses);
});

router.post('/expenses', authenticateToken, requirePermission('expenses.manage'), (req: AuthRequest, res) => {
  const { category, description, amount, paymentMethod, notes, date } = req.body;
  if (!category || !description || amount === undefined) {
    return res.status(400).json({ error: 'Category, description, and amount are required.' });
  }

  const data = db.getDb();
  const newExpense: Expense = {
    id: `exp_${Date.now()}`,
    category,
    description,
    amount: Number(amount),
    paymentMethod: paymentMethod || 'cash',
    date: date ? new Date(date).toISOString() : new Date().toISOString(),
    recordedBy: req.user!.name,
    notes,
  };

  data.expenses.unshift(newExpense);

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'Expense Recorded',
    module: 'Expenses',
    details: `Recorded expense "${newExpense.description}" - $${newExpense.amount.toFixed(2)} (${newExpense.category}).`,
  });

  db.save();
  res.status(201).json(newExpense);
});

router.delete('/expenses/:id', authenticateToken, requirePermission('expenses.manage'), (req: AuthRequest, res) => {
  const data = db.getDb();
  const index = data.expenses.findIndex(e => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Expense not found.' });

  const deleted = data.expenses.splice(index, 1)[0];
  db.save();
  res.json({ success: true, message: `Expense "${deleted.description}" deleted.` });
});

// ==========================================
// 12. ADVANCED REPORTS & ANALYTICS
// ==========================================

router.get('/reports', authenticateToken, requirePermission('reports.view'), (req, res) => {
  const data = db.getDb();
  const { range } = req.query; // 'day' | 'week' | 'month' | 'year'

  const completedOrders = data.orders.filter(o => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalDiscounts = completedOrders.reduce((sum, o) => sum + o.discount, 0);
  const totalTax = completedOrders.reduce((sum, o) => sum + o.tax, 0);

  // Cost of Goods Sold (COGS)
  let cogs = 0;
  completedOrders.forEach(ord => {
    ord.items.forEach(it => {
      const prod = data.products.find(p => p.id === it.productId);
      if (prod) cogs += prod.purchasePrice * it.quantity;
    });
  });

  const grossProfit = totalRevenue - cogs;
  const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  // Breakdown by payment method
  const paymentBreakdown: Record<string, { count: number; total: number }> = {};
  completedOrders.forEach(o => {
    if (!paymentBreakdown[o.paymentMethod]) {
      paymentBreakdown[o.paymentMethod] = { count: 0, total: 0 };
    }
    paymentBreakdown[o.paymentMethod].count += 1;
    paymentBreakdown[o.paymentMethod].total += o.grandTotal;
  });

  // Top products performance
  const productPerformance: Record<string, { name: string; sku: string; qty: number; revenue: number; profit: number }> = {};
  completedOrders.forEach(o => {
    o.items.forEach(it => {
      const prod = data.products.find(p => p.id === it.productId);
      const cost = prod ? prod.purchasePrice * it.quantity : 0;
      if (!productPerformance[it.productId]) {
        productPerformance[it.productId] = {
          name: it.productName,
          sku: it.sku,
          qty: 0,
          revenue: 0,
          profit: 0,
        };
      }
      productPerformance[it.productId].qty += it.quantity;
      productPerformance[it.productId].revenue += it.total;
      productPerformance[it.productId].profit += (it.total - cost);
    });
  });

  const performanceList = Object.values(productPerformance).sort((a, b) => b.revenue - a.revenue);

  res.json({
    summary: {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      cogs: Number(cogs.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      totalDiscounts: Number(totalDiscounts.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      orderCount: completedOrders.length,
    },
    paymentBreakdown,
    productPerformance: performanceList,
    expensesByCategory: data.expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>),
  });
});

// ==========================================
// 13. USERS & ROLES MANAGEMENT
// ==========================================

router.get('/users', authenticateToken, requirePermission('users.manage'), (req, res) => {
  const data = db.getDb();
  const safeUsers = data.users.map(({ passwordHash: _, ...rest }) => rest);
  res.json(safeUsers);
});

router.post('/users', authenticateToken, requireRole('Super Admin', 'Admin'), (req: AuthRequest, res) => {
  const { name, email, password, role, phone } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required.' });
  }

  const data = db.getDb();
  if (data.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'User email already exists.' });
  }

  const newUser: User = {
    id: `usr_${Date.now()}`,
    name,
    email,
    passwordHash: hashPassword(password),
    role: role as RoleName,
    phone: phone || '',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  data.users.push(newUser);

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'User Created',
    module: 'Users',
    details: `Created new staff account "${newUser.name}" (${newUser.role}).`,
  });

  db.save();
  const { passwordHash: _, ...userSafe } = newUser;
  res.status(201).json(userSafe);
});

router.put('/users/:id', authenticateToken, requireRole('Super Admin', 'Admin'), (req: AuthRequest, res) => {
  const data = db.getDb();
  const targetUser = data.users.find(u => u.id === req.params.id);
  if (!targetUser) return res.status(404).json({ error: 'User not found.' });

  const { name, email, role, phone, password, status } = req.body;
  if (name) targetUser.name = name;
  if (email) targetUser.email = email;
  if (role) targetUser.role = role as RoleName;
  if (phone !== undefined) targetUser.phone = phone;
  if (status) targetUser.status = status;
  if (password) targetUser.passwordHash = hashPassword(password);

  db.save();
  const { passwordHash: _, ...userSafe } = targetUser;
  res.json(userSafe);
});

router.put('/users/:id/toggle-status', authenticateToken, requireRole('Super Admin', 'Admin'), (req: AuthRequest, res) => {
  const data = db.getDb();
  const targetUser = data.users.find(u => u.id === req.params.id);
  if (!targetUser) return res.status(404).json({ error: 'User not found.' });

  if (targetUser.id === req.user!.id) {
    return res.status(400).json({ error: 'You cannot disable your own active account.' });
  }

  targetUser.status = targetUser.status === 'active' ? 'disabled' : 'active';
  db.save();

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'User Status Toggled',
    module: 'Users',
    details: `Set status of "${targetUser.name}" to ${targetUser.status}.`,
  });

  res.json({ success: true, status: targetUser.status });
});

router.get('/roles', authenticateToken, (req, res) => {
  const data = db.getDb();
  res.json({ roles: data.roles, permissions: data.permissions });
});

router.put('/roles/:id', authenticateToken, requireRole('Super Admin'), (req: AuthRequest, res) => {
  const data = db.getDb();
  const role = data.roles.find(r => r.id === req.params.id);
  if (!role) return res.status(404).json({ error: 'Role not found.' });

  const { permissions, description } = req.body;
  if (permissions && Array.isArray(permissions)) {
    role.permissions = permissions;
  }
  if (description) role.description = description;

  db.save();
  res.json(role);
});

// ==========================================
// 14. SETTINGS & BACKUP/RESTORE
// ==========================================

router.get('/settings', (req, res) => {
  const data = db.getDb();
  res.json(data.settings);
});

router.put('/settings', authenticateToken, requirePermission('settings.manage'), (req: AuthRequest, res) => {
  const data = db.getDb();
  const updates = req.body;

  data.settings = {
    ...data.settings,
    ...updates,
  };

  db.logActivity({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'Settings Updated',
    module: 'Settings',
    details: 'Store parameters and configuration adjusted.',
  });

  db.save();
  res.json(data.settings);
});

router.get('/settings/backup', authenticateToken, requireRole('Super Admin'), (req, res) => {
  const data = db.getDb();
  // Strip passwords before export for security
  const safeExport = {
    ...data,
    users: data.users.map(({ passwordHash: _, ...u }) => u),
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=nexus_store_backup_${Date.now()}.json`);
  res.send(JSON.stringify(safeExport, null, 2));
});

router.post('/settings/restore', authenticateToken, requireRole('Super Admin'), (req: AuthRequest, res) => {
  const { backupData } = req.body;
  if (!backupData || !backupData.products || !backupData.settings) {
    return res.status(400).json({ error: 'Invalid backup JSON file structure.' });
  }

  // Restore datasets safely
  const currentDb = db.getDb();
  currentDb.products = backupData.products || currentDb.products;
  currentDb.categories = backupData.categories || currentDb.categories;
  currentDb.customers = backupData.customers || currentDb.customers;
  currentDb.suppliers = backupData.suppliers || currentDb.suppliers;
  currentDb.settings = backupData.settings || currentDb.settings;

  db.save();
  res.json({ success: true, message: 'Database restored successfully from backup.' });
});

// ==========================================
// 15. NOTIFICATIONS
// ==========================================

router.get('/notifications', authenticateToken, (req, res) => {
  const data = db.getDb();
  res.json(data.notifications.slice(0, 50));
});

router.put('/notifications/:id/read', authenticateToken, (req, res) => {
  const data = db.getDb();
  const notif = data.notifications.find(n => n.id === req.params.id);
  if (notif) {
    notif.read = true;
    db.save();
  }
  res.json({ success: true });
});

router.put('/notifications/read-all', authenticateToken, (req, res) => {
  const data = db.getDb();
  data.notifications.forEach(n => (n.read = true));
  db.save();
  res.json({ success: true });
});

// ==========================================
// 16. AUDIT ACTIVITY LOGS
// ==========================================

router.get('/activity-logs', authenticateToken, requireRole('Super Admin', 'Admin', 'Manager'), (req, res) => {
  const data = db.getDb();
  const { module, search } = req.query;

  let logs = [...data.activity_logs];
  if (module && typeof module === 'string' && module !== 'all') {
    logs = logs.filter(l => l.module === module);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    logs = logs.filter(
      l =>
        l.action.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q)
    );
  }

  res.json(logs.slice(0, 150));
});

export default router;
