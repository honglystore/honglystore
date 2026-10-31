import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StoreSettings, Notification } from '../types/index.js';
import { api } from '../services/api.js';
import { Language, translations, TranslationKey } from '../i18n/translations.js';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface StoreContextType {
  settings: StoreSettings | null;
  currency: 'USD' | 'KHR';
  setCurrency: (curr: 'USD' | 'KHR') => void;
  language: 'en' | 'km';
  setLanguage: (lang: 'en' | 'km') => void;
  t: (key: TranslationKey) => string;
  formatPrice: (amountUSD: number) => string;
  convertPrice: (amountUSD: number) => number;
  notifications: Notification[];
  unreadNotifsCount: number;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  refreshKey: number;
  triggerGlobalRefresh: () => void;
}

const defaultSettingsFallback: StoreSettings = {
  storeName: 'ហុងលី លក់សម្ភារៈបុណ្យ',
  storeTagline: 'ហាងលក់សម្ភារៈបុណ្យ ពិធីមង្គលការ និងបុណ្យទានគ្រប់ប្រភេទ',
  logoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&q=80',
  address: 'Building 14, Silicon Boulevard, Central District',
  phone: '+1 (800) 888-NEXUS',
  email: 'contact@nexusstore.io',
  website: 'https://nexusstore.io',
  currency: 'USD',
  khrExchangeRate: 4100,
  taxPercentage: 10,
  invoicePrefix: 'INV-2026-',
  receiptFooter: 'Thank you for shopping with NexusStore! Keep receipt for 14-day returns.',
  enableLoyalty: true,
  theme: 'light',
  language: 'en',
  backupAuto: true,
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettingsFallback);
  const [currency, setCurrency] = useState<'USD' | 'KHR'>('USD');
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('nexus_language');
    return (saved === 'en' || saved === 'km') ? saved : 'km';
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('nexus_language', lang);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[language]?.[key] || translations.en[key] || key;
    },
    [language]
  );

  const triggerGlobalRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
      if (data.currency) {
        setCurrency(data.currency);
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch {
      // Ignore background notification poll errors
    }
  }, []);

  useEffect(() => {
    refreshSettings();
    refreshNotifications();
  }, [refreshSettings, refreshNotifications, refreshKey]);

  const markNotificationRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      showToast('All notifications marked as read', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const convertPrice = useCallback(
    (amountUSD: number): number => {
      const rate = settings?.khrExchangeRate || 4100;
      if (currency === 'KHR') {
        return Math.round(amountUSD * rate);
      }
      return amountUSD;
    },
    [currency, settings]
  );

  const formatPrice = useCallback(
    (amountUSD: number): string => {
      if (isNaN(amountUSD)) return '$0.00';
      const rate = settings?.khrExchangeRate || 4100;

      if (currency === 'KHR') {
        const khr = Math.round(amountUSD * rate);
        return `៛${khr.toLocaleString('en-US')}`;
      }

      return `$${amountUSD.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    },
    [currency, settings]
  );

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  return (
    <StoreContext.Provider
      value={{
        settings,
        currency,
        setCurrency,
        language,
        setLanguage,
        t,
        formatPrice,
        convertPrice,
        notifications,
        unreadNotifsCount,
        markNotificationRead,
        markAllNotificationsRead,
        refreshNotifications,
        refreshSettings,
        toasts,
        showToast,
        removeToast,
        refreshKey,
        triggerGlobalRefresh,
      }}
    >
      {children}
      {/* Global Toast Alerts */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-lg border text-sm font-medium transition-all animate-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-emerald-900/90 border-emerald-700 text-emerald-100'
                : toast.type === 'error'
                ? 'bg-rose-900/90 border-rose-700 text-rose-100'
                : 'bg-slate-900/90 border-slate-700 text-slate-100'
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-3 text-xs opacity-75 hover:opacity-100 p-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
