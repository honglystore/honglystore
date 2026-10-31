const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('nexus_auth_token');
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
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<{ token: string; user: any }>(res);
  },

  async loginWithGoogle(email?: string, name?: string) {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });
    return handleResponse<{ token: string; user: any }>(res);
  },

  async switchDemoRole(role: string) {
    const res = await fetch(`${API_BASE}/auth/switch-demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    return handleResponse<{ token: string; user: any }>(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeader(),
    });
    return handleResponse<{ user: any; permissions: string[] }>(res);
  },

  // Dashboard
  async getDashboardStats() {
    const res = await fetch(`${API_BASE}/dashboard/stats`, {
      headers: getAuthHeader(),
    });
    return handleResponse<any>(res);
  },

  // Products
  async getProducts(params?: { search?: string; category?: string; status?: string; sortBy?: string; sortOrder?: string }) {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/products?${query}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<any[]>(res);
  },

  async createProduct(productData: any) {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(productData),
    });
    return handleResponse<any>(res);
  },

  async updateProduct(id: string, updates: any) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(updates),
    });
    return handleResponse<any>(res);
  },

  async deleteProduct(id: string) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return handleResponse<any>(res);
  },

  async importProductsCSV(csvData: string) {
    const res = await fetch(`${API_BASE}/products/import-csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ csvData }),
    });
    return handleResponse<{ success: boolean; count: number }>(res);
  },

  // Categories
  async getCategories() {
    const res = await fetch(`${API_BASE}/categories`, {
      headers: getAuthHeader(),
    });
    return handleResponse<any[]>(res);
  },

  async createCategory(data: any) {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async updateCategory(id: string, updates: any) {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(updates),
    });
    return handleResponse<any>(res);
  },

  async deleteCategory(id: string) {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return handleResponse<any>(res);
  },

  // Inventory
  async getInventoryValuation() {
    const res = await fetch(`${API_BASE}/inventory/valuation`, {
      headers: getAuthHeader(),
    });
    return handleResponse<any>(res);
  },

  async getStockMovements(params?: { productId?: string; type?: string }) {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/inventory/movements?${query}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<any[]>(res);
  },

  async adjustStock(data: { productId: string; type: string; quantity: number; reason: string }) {
    const res = await fetch(`${API_BASE}/inventory/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  // POS
  async lookupBarcode(code: string) {
    const res = await fetch(`${API_BASE}/pos/barcode/${encodeURIComponent(code)}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<any>(res);
  },

  async checkoutPOS(payload: any) {
    const res = await fetch(`${API_BASE}/pos/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  // Orders
  async getOrders(params?: { status?: string; search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/orders?${query}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<any[]>(res);
  },

  async getOrderById(id: string) {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<any>(res);
  },

  async updateOrderStatus(id: string, status: string, restockItems: boolean = false) {
    const res = await fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ status, restockItems }),
    });
    return handleResponse<any>(res);
  },

  // Customers
  async getCustomers(params?: { search?: string; tier?: string }) {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/customers?${query}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<any[]>(res);
  },

  async createCustomer(data: any) {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async updateCustomer(id: string, data: any) {
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async deleteCustomer(id: string) {
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return handleResponse<any>(res);
  },

  async getCustomerOrders(customerId: string) {
    const res = await fetch(`${API_BASE}/customers/${customerId}/orders`, {
      headers: getAuthHeader(),
    });
    return handleResponse<any[]>(res);
  },

  // Suppliers
  async getSuppliers() {
    const res = await fetch(`${API_BASE}/suppliers`, {
      headers: getAuthHeader(),
    });
    return handleResponse<any[]>(res);
  },

  async createSupplier(data: any) {
    const res = await fetch(`${API_BASE}/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async updateSupplier(id: string, data: any) {
    const res = await fetch(`${API_BASE}/suppliers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async deleteSupplier(id: string) {
    const res = await fetch(`${API_BASE}/suppliers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return handleResponse<any>(res);
  },

  // Purchases
  async getPurchases() {
    const res = await fetch(`${API_BASE}/purchases`, {
      headers: getAuthHeader(),
    });
    return handleResponse<any[]>(res);
  },

  async createPurchase(data: any) {
    const res = await fetch(`${API_BASE}/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async receivePurchase(id: string) {
    const res = await fetch(`${API_BASE}/purchases/${id}/receive`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    return handleResponse<any>(res);
  },

  async cancelPurchase(id: string) {
    const res = await fetch(`${API_BASE}/purchases/${id}/cancel`, {
      method: 'PUT',
      headers: getAuthHeader(),
    });
    return handleResponse<any>(res);
  },

  // Expenses
  async getExpenses(params?: { category?: string; month?: string }) {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/expenses?${query}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<any[]>(res);
  },

  async createExpense(data: any) {
    const res = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async deleteExpense(id: string) {
    const res = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return handleResponse<any>(res);
  },

  // Reports
  async getReports(range: string = 'month') {
    const res = await fetch(`${API_BASE}/reports?range=${range}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<any>(res);
  },

  // Users & Roles
  async getUsers() {
    const res = await fetch(`${API_BASE}/users`, {
      headers: getAuthHeader(),
    });
    return handleResponse<any[]>(res);
  },

  async createUser(data: any) {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async updateUser(id: string, data: any) {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async toggleUserStatus(id: string) {
    const res = await fetch(`${API_BASE}/users/${id}/toggle-status`, {
      method: 'PUT',
      headers: getAuthHeader(),
    });
    return handleResponse<any>(res);
  },

  async getRoles() {
    const res = await fetch(`${API_BASE}/roles`, {
      headers: getAuthHeader(),
    });
    return handleResponse<{ roles: any[]; permissions: any[] }>(res);
  },

  async updateRole(id: string, data: any) {
    const res = await fetch(`${API_BASE}/roles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  // Settings
  async getSettings() {
    const res = await fetch(`${API_BASE}/settings`);
    return handleResponse<any>(res);
  },

  async updateSettings(updates: any) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(updates),
    });
    return handleResponse<any>(res);
  },

  // Notifications
  async getNotifications() {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getAuthHeader(),
    });
    return handleResponse<any[]>(res);
  },

  async markNotificationRead(id: string) {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeader(),
    });
    return handleResponse<any>(res);
  },

  async markAllNotificationsRead() {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: getAuthHeader(),
    });
    return handleResponse<any>(res);
  },

  // Activity Logs
  async getActivityLogs(params?: { module?: string; search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/activity-logs?${query}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<any[]>(res);
  },
};
