import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { StoreProvider } from './context/StoreContext.js';
import { Sidebar, ActiveTab } from './components/Sidebar.js';
import { Navbar } from './components/Navbar.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { POSPage } from './pages/POSPage.js';
import { ProductsPage } from './pages/ProductsPage.js';
import { CategoriesPage } from './pages/CategoriesPage.js';
import { InventoryPage } from './pages/InventoryPage.js';
import { OrdersPage } from './pages/OrdersPage.js';
import { CustomersPage } from './pages/CustomersPage.js';
import { SuppliersPage } from './pages/SuppliersPage.js';
import { PurchasesPage } from './pages/PurchasesPage.js';
import { ExpensesPage } from './pages/ExpensesPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { UsersRolesPage } from './pages/UsersRolesPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { ActivityLogsPage } from './pages/ActivityLogsPage.js';
import { ShieldAlert } from 'lucide-react';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, hasPermission } = useAuth();

  // Route permission map
  const permissionMap: Partial<Record<ActiveTab, string>> = {
    dashboard: 'dashboard.view',
    pos: 'pos.access',
    products: 'products.view',
    categories: 'products.view',
    inventory: 'inventory.view',
    orders: 'orders.view',
    customers: 'customers.manage',
    suppliers: 'suppliers.manage',
    purchases: 'purchases.manage',
    expenses: 'expenses.manage',
    reports: 'reports.view',
    users: 'users.manage',
    settings: 'settings.manage',
  };

  const requiredPerm = permissionMap[activeTab];
  const isAuthorized = !requiredPerm || hasPermission(requiredPerm);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        <Navbar setActiveTab={setActiveTab} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {!isAuthorized ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-md mx-auto my-12 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Access Restricted (RBAC)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Your current active role <span className="font-bold text-purple-600">"{user?.role}"</span> does not have the <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">{requiredPerm}</code> permission.
                </p>
              </div>
              <button
                onClick={() => setActiveTab(user?.role === 'Cashier' ? 'pos' : user?.role === 'Inventory Staff' ? 'inventory' : 'dashboard')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/30"
              >
                Go to Accessible Workspace
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <DashboardPage setActiveTab={setActiveTab} />}
              {activeTab === 'pos' && <POSPage />}
              {activeTab === 'products' && <ProductsPage />}
              {activeTab === 'categories' && <CategoriesPage />}
              {activeTab === 'inventory' && <InventoryPage />}
              {activeTab === 'orders' && <OrdersPage />}
              {activeTab === 'customers' && <CustomersPage />}
              {activeTab === 'suppliers' && <SuppliersPage />}
              {activeTab === 'purchases' && <PurchasesPage />}
              {activeTab === 'expenses' && <ExpensesPage />}
              {activeTab === 'reports' && <ReportsPage />}
              {activeTab === 'users' && <UsersRolesPage />}
              {activeTab === 'settings' && <SettingsPage />}
              {activeTab === 'activity_logs' && <ActivityLogsPage />}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <MainLayout />
      </StoreProvider>
    </AuthProvider>
  );
}
