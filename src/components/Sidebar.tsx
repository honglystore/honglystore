import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Boxes,
  ClipboardList,
  Users,
  Truck,
  ShoppingBag,
  Receipt,
  BarChart3,
  ShieldCheck,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useStore } from '../context/StoreContext.js';

export type ActiveTab =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'categories'
  | 'inventory'
  | 'orders'
  | 'customers'
  | 'suppliers'
  | 'purchases'
  | 'expenses'
  | 'reports'
  | 'users'
  | 'settings'
  | 'activity_logs';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
}) => {
  const { user, hasPermission } = useAuth();
  const { settings, notifications, t } = useStore();

  const lowStockNotifs = notifications.filter(n => n.type === 'low_stock' && !n.read).length;

  const menuItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: t('dashboard'),
      icon: LayoutDashboard,
      visible: hasPermission('dashboard.view'),
    },
    {
      id: 'pos' as ActiveTab,
      label: t('pos'),
      icon: ShoppingCart,
      visible: hasPermission('pos.access'),
      badge: 'POS',
      badgeColor: 'bg-purple-600 text-white',
    },
    {
      id: 'products' as ActiveTab,
      label: t('products'),
      icon: Package,
      visible: hasPermission('products.view'),
    },
    {
      id: 'categories' as ActiveTab,
      label: t('categories'),
      icon: Layers,
      visible: hasPermission('products.view'),
    },
    {
      id: 'inventory' as ActiveTab,
      label: t('inventory'),
      icon: Boxes,
      visible: hasPermission('inventory.view'),
      badge: lowStockNotifs > 0 ? `${lowStockNotifs} Alert` : undefined,
      badgeColor: 'bg-amber-500 text-amber-950 font-bold',
    },
    {
      id: 'orders' as ActiveTab,
      label: t('orders'),
      icon: ClipboardList,
      visible: hasPermission('orders.view'),
    },
    {
      id: 'customers' as ActiveTab,
      label: t('customers'),
      icon: Users,
      visible: hasPermission('customers.manage'),
    },
    {
      id: 'suppliers' as ActiveTab,
      label: t('suppliers'),
      icon: Truck,
      visible: hasPermission('suppliers.manage'),
    },
    {
      id: 'purchases' as ActiveTab,
      label: t('purchases'),
      icon: ShoppingBag,
      visible: hasPermission('purchases.manage'),
    },
    {
      id: 'expenses' as ActiveTab,
      label: t('expenses'),
      icon: Receipt,
      visible: hasPermission('expenses.manage'),
    },
    {
      id: 'reports' as ActiveTab,
      label: t('reports'),
      icon: BarChart3,
      visible: hasPermission('reports.view'),
    },
    {
      id: 'users' as ActiveTab,
      label: t('users'),
      icon: ShieldCheck,
      visible: hasPermission('users.manage'),
    },
    {
      id: 'activity_logs' as ActiveTab,
      label: t('activityLogs'),
      icon: History,
      visible: user?.role === 'Super Admin' || user?.role === 'Admin' || user?.role === 'Manager',
    },
    {
      id: 'settings' as ActiveTab,
      label: t('settings'),
      icon: Settings,
      visible: hasPermission('settings.manage'),
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-900/30 shrink-0">
            <Store className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-white text-base tracking-tight truncate">
                {settings?.storeName || 'ហុងលី លក់សម្ភារៈបុណ្យ'}
              </span>
              <span className="text-[11px] text-purple-400 font-medium">{t('enterprisePos')}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {menuItems
          .filter(item => item.visible)
          .map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-purple-400'
                  }`}
                />
                {!collapsed && (
                  <span className="truncate text-left flex-1">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
                {collapsed && item.badge && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </button>
            );
          })}
      </div>

      {/* User Status Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'}
              alt={user?.name}
              className="w-9 h-9 rounded-full object-cover border border-purple-500/50"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-white truncate">{user?.name}</span>
              <span className="text-[10px] font-medium text-purple-400 uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
