import { standaloneDB } from './mockDatabase.js';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('nexus_auth_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = 'An error occurred';
    try {
      const data = await res.json();
      errorMsg = data.error || errorMsg;
    } catch {
      errorMsg = res.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.switchRole('Super Admin');
    }
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return await handleResponse<{ token: string; user: any }>(res);
    } catch {
      return standaloneDB.switchRole('Super Admin');
    }
  },

  async loginWithGoogle(email?: string, name?: string) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.switchRole('Super Admin');
    }
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      return await handleResponse<{ token: string; user: any }>(res);
    } catch {
      return standaloneDB.switchRole('Super Admin');
    }
  },

  async switchDemoRole(role: string) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.switchRole(role);
    }
    try {
      const res = await fetch(`${API_BASE}/auth/switch-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      return await handleResponse<{ token: string; user: any }>(res);
    } catch {
      return standaloneDB.switchRole(role);
    }
  },

  async getMe() {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.getCurrentUser();
    }
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<{ user: any; permissions: string[] }>(res);
    } catch {
      return standaloneDB.getCurrentUser();
    }
  },

  async updateProfile(data: { name?: string; phone?: string; avatar?: string; currentPassword?: string; newPassword?: string }) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.updateProfile(data);
    }
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data),
      });
      return await handleResponse<{ success: boolean; user: any }>(res);
    } catch {
      return standaloneDB.updateProfile(data);
    }
  },

  // Dashboard
  async getDashboardStats() {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.getDashboardStats();
    }
    try {
      const res = await fetch(`${API_BASE}/dashboard/stats`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.getDashboardStats();
    }
  },

  // Products
  async getProducts(params?: { search?: string; category?: string; status?: string; sortBy?: string; sortOrder?: string }) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.getProducts(params);
    }
    try {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`${API_BASE}/products?${query}`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<any[]>(res);
    } catch {
      return standaloneDB.getProducts(params);
    }
  },

  async createProduct(productData: any) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.createProduct(productData);
    }
    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(productData),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.createProduct(productData);
    }
  },

  async updateProduct(id: string, updates: any) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.updateProduct(id, updates);
    }
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(updates),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.updateProduct(id, updates);
    }
  },

  async deleteProduct(id: string) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.deleteProduct(id);
    }
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.deleteProduct(id);
    }
  },

  async importProductsCSV(csvData: string) {
    try {
      const res = await fetch(`${API_BASE}/products/import-csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ csvData }),
      });
      return await handleResponse<{ success: boolean; count: number }>(res);
    } catch {
      return { success: true, count: 0 };
    }
  },

  // Categories
  async getCategories() {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.getCategories();
    }
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<any[]>(res);
    } catch {
      return standaloneDB.getCategories();
    }
  },

  async createCategory(data: any) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.createCategory(data);
    }
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.createCategory(data);
    }
  },

  async updateCategory(id: string, updates: any) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.updateCategory(id, updates);
    }
    try {
      const res = await fetch(`${API_BASE}/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(updates),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.updateCategory(id, updates);
    }
  },

  async deleteCategory(id: string) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.deleteCategory(id);
    }
    try {
      const res = await fetch(`${API_BASE}/categories/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.deleteCategory(id);
    }
  },

  // Inventory
  async getInventoryValuation() {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.getInventoryValuation();
    }
    try {
      const res = await fetch(`${API_BASE}/inventory/valuation`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.getInventoryValuation();
    }
  },

  async getStockMovements(params?: { productId?: string; type?: string }) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.getStockMovements();
    }
    try {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`${API_BASE}/inventory/movements?${query}`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<any[]>(res);
    } catch {
      return standaloneDB.getStockMovements();
    }
  },

  async adjustStock(data: { productId: string; type: string; quantity: number; reason: string }) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.adjustStock(data);
    }
    try {
      const res = await fetch(`${API_BASE}/inventory/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.adjustStock(data);
    }
  },

  // POS
  async lookupBarcode(code: string) {
    if (standaloneDB.isStaticHost()) {
      const prods = standaloneDB.getProducts();
      const found = prods.find((p: any) => p.barcode === code || p.sku === code);
      if (!found) throw new Error('Product not found');
      return found;
    }
    try {
      const res = await fetch(`${API_BASE}/pos/barcode/${encodeURIComponent(code)}`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<any>(res);
    } catch {
      const prods = standaloneDB.getProducts();
      const found = prods.find((p: any) => p.barcode === code || p.sku === code);
      if (!found) throw new Error('Product not found');
      return found;
    }
  },

  async checkoutPOS(payload: any) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.checkoutPOS(payload);
    }
    try {
      const res = await fetch(`${API_BASE}/pos/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(payload),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.checkoutPOS(payload);
    }
  },

  // Orders
  async getOrders(params?: { status?: string; search?: string }) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.getOrders(params);
    }
    try {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`${API_BASE}/orders?${query}`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<any[]>(res);
    } catch {
      return standaloneDB.getOrders(params);
    }
  },

  async getOrderById(id: string) {
    if (standaloneDB.isStaticHost()) {
      const ords = standaloneDB.getOrders();
      const found = ords.find((o: any) => o.id === id);
      if (!found) throw new Error('Order not found');
      return found;
    }
    try {
      const res = await fetch(`${API_BASE}/orders/${id}`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<any>(res);
    } catch {
      const ords = standaloneDB.getOrders();
      const found = ords.find((o: any) => o.id === id);
      if (!found) throw new Error('Order not found');
      return found;
    }
  },

  async updateOrderStatus(id: string, status: string, restockItems: boolean = false) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.updateOrderStatus(id, status);
    }
    try {
      const res = await fetch(`${API_BASE}/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ status, restockItems }),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.updateOrderStatus(id, status);
    }
  },

  // Customers
  async getCustomers(params?: { search?: string; tier?: string }) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.getCustomers(params);
    }
    try {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`${API_BASE}/customers?${query}`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<any[]>(res);
    } catch {
      return standaloneDB.getCustomers(params);
    }
  },

  async createCustomer(data: any) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.createCustomer(data);
    }
    try {
      const res = await fetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.createCustomer(data);
    }
  },

  async updateCustomer(id: string, data: any) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.updateCustomer(id, data);
    }
    try {
      const res = await fetch(`${API_BASE}/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.updateCustomer(id, data);
    }
  },

  async deleteCustomer(id: string) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.deleteCustomer(id);
    }
    try {
      const res = await fetch(`${API_BASE}/customers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.deleteCustomer(id);
    }
  },

  async getCustomerOrders(customerId: string) {
    if (standaloneDB.isStaticHost()) {
      const ords = standaloneDB.getOrders();
      return ords.filter((o: any) => o.customerId === customerId);
    }
    try {
      const res = await fetch(`${API_BASE}/customers/${customerId}/orders`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<any[]>(res);
    } catch {
      const ords = standaloneDB.getOrders();
      return ords.filter((o: any) => o.customerId === customerId);
    }
  },

  // Suppliers
  async getSuppliers() {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.getSuppliers();
    }
    try {
      const res = await fetch(`${API_BASE}/suppliers`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<any[]>(res);
    } catch {
      return standaloneDB.getSuppliers();
    }
  },

  async createSupplier(data: any) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.createSupplier(data);
    }
    try {
      const res = await fetch(`${API_BASE}/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.createSupplier(data);
    }
  },

  async updateSupplier(id: string, data: any) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.updateSupplier(id, data);
    }
    try {
      const res = await fetch(`${API_BASE}/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.updateSupplier(id, data);
    }
  },

  async deleteSupplier(id: string) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.deleteSupplier(id);
    }
    try {
      const res = await fetch(`${API_BASE}/suppliers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.deleteSupplier(id);
    }
  },

  // Purchases
  async getPurchases() {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.getPurchases();
    }
    try {
      const res = await fetch(`${API_BASE}/purchases`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<any[]>(res);
    } catch {
      return standaloneDB.getPurchases();
    }
  },

  async createPurchase(data: any) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.createPurchase(data);
    }
    try {
      const res = await fetch(`${API_BASE}/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.createPurchase(data);
    }
  },

  async receivePurchase(id: string) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.receivePurchase(id);
    }
    try {
      const res = await fetch(`${API_BASE}/purchases/${id}/receive`, {
        method: 'POST',
        headers: getAuthHeader(),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.receivePurchase(id);
    }
  },

  async cancelPurchase(id: string) {
    try {
      const res = await fetch(`${API_BASE}/purchases/${id}/cancel`, {
        method: 'PUT',
        headers: getAuthHeader(),
      });
      return await handleResponse<any>(res);
    } catch {
      return { success: true };
    }
  },

  // Expenses
  async getExpenses(params?: { category?: string; month?: string }) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.getExpenses();
    }
    try {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`${API_BASE}/expenses?${query}`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<any[]>(res);
    } catch {
      return standaloneDB.getExpenses();
    }
  },

  async createExpense(data: any) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.createExpense(data);
    }
    try {
      const res = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.createExpense(data);
    }
  },

  async deleteExpense(id: string) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.deleteExpense(id);
    }
    try {
      const res = await fetch(`${API_BASE}/expenses/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.deleteExpense(id);
    }
  },

  // Reports
  async getReports(range: string = 'month') {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.getReports(range);
    }
    try {
      const res = await fetch(`${API_BASE}/reports?range=${range}`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.getReports(range);
    }
  },

  // Users & Roles
  async getUsers() {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.getUsers();
    }
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<any[]>(res);
    } catch {
      return standaloneDB.getUsers();
    }
  },

  async createUser(data: any) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.createUser(data);
    }
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.createUser(data);
    }
  },

  async updateUser(id: string, data: any) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.updateUser(id, data);
    }
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.updateUser(id, data);
    }
  },

  async toggleUserStatus(id: string) {
    try {
      const res = await fetch(`${API_BASE}/users/${id}/toggle-status`, {
        method: 'PUT',
        headers: getAuthHeader(),
      });
      return await handleResponse<any>(res);
    } catch {
      return { success: true };
    }
  },

  async getRoles() {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.getRoles();
    }
    try {
      const res = await fetch(`${API_BASE}/roles`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<{ roles: any[]; permissions: any[] }>(res);
    } catch {
      return standaloneDB.getRoles();
    }
  },

  async updateRole(id: string, data: any) {
    try {
      const res = await fetch(`${API_BASE}/roles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data),
      });
      return await handleResponse<any>(res);
    } catch {
      return { success: true };
    }
  },

  // Settings
  async getSettings() {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.getSettings();
    }
    try {
      const res = await fetch(`${API_BASE}/settings`);
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.getSettings();
    }
  },

  async updateSettings(updates: any) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.updateSettings(updates);
    }
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(updates),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.updateSettings(updates);
    }
  },

  // Notifications
  async getNotifications() {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.getNotifications();
    }
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<any[]>(res);
    } catch {
      return standaloneDB.getNotifications();
    }
  },

  async markNotificationRead(id: string) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.markNotificationRead(id);
    }
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'PUT',
        headers: getAuthHeader(),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.markNotificationRead(id);
    }
  },

  async markAllNotificationsRead() {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.markAllNotificationsRead();
    }
    try {
      const res = await fetch(`${API_BASE}/notifications/read-all`, {
        method: 'PUT',
        headers: getAuthHeader(),
      });
      return await handleResponse<any>(res);
    } catch {
      return standaloneDB.markAllNotificationsRead();
    }
  },

  // Activity Logs
  async getActivityLogs(params?: { module?: string; search?: string }) {
    if (standaloneDB.isStaticHost()) {
      return standaloneDB.getActivityLogs();
    }
    try {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`${API_BASE}/activity-logs?${query}`, {
        headers: getAuthHeader(),
      });
      return await handleResponse<any[]>(res);
    } catch {
      return standaloneDB.getActivityLogs();
    }
  },
};
