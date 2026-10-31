import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Search,
  CheckCheck,
  Shield,
  Coins,
  ChevronDown,
  LogOut,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useStore } from '../context/StoreContext.js';
import { RoleName } from '../types/index.js';
import { ActiveTab } from './Sidebar.js';
import { AccountSettingsModal } from './AccountSettingsModal.js';

interface NavbarProps {
  onSearchSelect?: (tab: ActiveTab) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ setActiveTab }) => {
  const { user, switchRole, logout } = useAuth();
  const {
    currency,
    setCurrency,
    language,
    setLanguage,
    t,
    settings,
    notifications,
    unreadNotifsCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useStore();

  const [notifOpen, setNotifOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setRoleMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rolesList: { name: RoleName; desc: string; color: string }[] = [
    { name: 'Super Admin', desc: 'Unrestricted system control & DB backups', color: 'bg-purple-600' },
    { name: 'Admin', desc: 'Store management & staff accounts', color: 'bg-indigo-600' },
    { name: 'Manager', desc: 'Floor ops, inventory, reports & expenses', color: 'bg-blue-600' },
    { name: 'Cashier', desc: 'POS checkout & customer loyalty', color: 'bg-emerald-600' },
    { name: 'Inventory Staff', desc: 'Warehouse audits & purchase intake', color: 'bg-amber-600' },
  ];

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    if (q.includes('pos') || q.includes('sale') || q.includes('cash')) {
      setActiveTab('pos');
    } else if (q.includes('prod') || q.includes('item') || q.includes('sku') || q.includes('bar')) {
      setActiveTab('products');
    } else if (q.includes('stock') || q.includes('inv')) {
      setActiveTab('inventory');
    } else if (q.includes('order')) {
      setActiveTab('orders');
    } else if (q.includes('cust') || q.includes('crm')) {
      setActiveTab('customers');
    } else if (q.includes('rep') || q.includes('prof') || q.includes('tax')) {
      setActiveTab('reports');
    } else if (q.includes('user') || q.includes('role')) {
      setActiveTab('users');
    } else {
      setActiveTab('products');
    }
    setSearchQuery('');
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Search Input */}
      <form onSubmit={handleQuickSearch} className="relative w-72 md:w-96">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all"
        />
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Language Switcher (EN - KH) */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              language === 'en'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="English"
          >
            <span className="text-sm">🇬🇧</span>
            <span>EN</span>
          </button>
          <button
            type="button"
            onClick={() => setLanguage('km')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              language === 'km'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="ភាសាខ្មែរ (Khmer)"
          >
            <span className="text-sm">🇰🇭</span>
            <span>KH</span>
          </button>
        </div>

        {/* Currency Toggle ($ USD / ៛ KHR) */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setCurrency('USD')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
              currency === 'USD'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Switch to US Dollar ($)"
          >
            <span>$</span>
            <span className="hidden sm:inline">USD</span>
          </button>
          <button
            onClick={() => setCurrency('KHR')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
              currency === 'KHR'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title={`Switch to Cambodian Riel (៛) - Rate: 1 USD = ${settings?.khrExchangeRate || 4100} KHR`}
          >
            <span>៛</span>
            <span className="hidden sm:inline">KHR</span>
          </button>
        </div>

        {/* Quick Role Switcher Button */}
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-all text-xs font-medium"
            title="Switch demo role to test RBAC permissions"
          >
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            <span className="font-semibold hidden sm:inline">{user?.role}</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Quick Role Switcher (RBAC)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Test restricted access & security permissions live
                </p>
              </div>
              <div className="space-y-1">
                {rolesList.map(r => (
                  <button
                    key={r.name}
                    onClick={() => {
                      switchRole(r.name);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-3 ${
                      user?.role === r.name
                        ? 'bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${r.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {r.name}
                        </span>
                        {user?.role === r.name && (
                          <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.2 rounded font-semibold">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {r.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Notifications
                  </span>
                  {unreadNotifsCount > 0 && (
                    <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                      {unreadNotifsCount} new
                    </span>
                  )}
                </div>
                {unreadNotifsCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.link) {
                          const tab = n.link.replace('/', '') as ActiveTab;
                          setActiveTab(tab);
                          setNotifOpen(false);
                        }
                      }}
                      className={`p-3 text-left transition-colors cursor-pointer flex gap-3 items-start ${
                        !n.read
                          ? 'bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-50 dark:hover:bg-purple-950/50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          n.type === 'low_stock'
                            ? 'bg-amber-500'
                            : n.type === 'order'
                            ? 'bg-emerald-500'
                            : 'bg-purple-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Quick Account Settings */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setAccountModalOpen(true)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group cursor-pointer"
            title="Account Settings & Profile Picture"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'}
              alt={user?.name}
              className="w-8 h-8 rounded-full object-cover border border-purple-500/40 group-hover:border-purple-500 group-hover:scale-105 transition-all shadow-xs"
            />
            <span className="hidden lg:inline text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {user?.name?.split(' ')[0]}
            </span>
          </button>
        </div>
      </div>

      <AccountSettingsModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
      />
    </header>
  );
};
