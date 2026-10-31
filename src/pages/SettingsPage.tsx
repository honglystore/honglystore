import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Download,
  Upload,
  Building,
  Coins,
  FileText,
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useStore } from '../context/StoreContext.js';
import { useAuth } from '../context/AuthContext.js';
import { StoreSettings } from '../types/index.js';

export const SettingsPage: React.FC = () => {
  const { settings, refreshSettings, showToast } = useStore();
  const { isSuperAdmin } = useAuth();

  const [formData, setFormData] = useState<StoreSettings>(settings || {} as StoreSettings);
  const [saving, setSaving] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreJson, setRestoreJson] = useState('');
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings({
        ...formData,
        khrExchangeRate: Number(formData.khrExchangeRate),
        taxPercentage: Number(formData.taxPercentage),
      });
      showToast('Store settings saved successfully', 'success');
      await refreshSettings();
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    const token = localStorage.getItem('nexus_auth_token');
    window.open('/api/settings/backup?token=' + token, '_blank');
    showToast('Database JSON backup download started', 'success');
  };

  const handleRestoreSubmit = async () => {
    if (!restoreJson.trim()) {
      showToast('Please paste valid JSON backup data', 'error');
      return;
    }

    try {
      const parsed = JSON.parse(restoreJson);
      setRestoring(true);
      await api.updateSettings(parsed.settings || {});
      showToast('Store backup restored successfully', 'success');
      setRestoreModalOpen(false);
      setRestoreJson('');
      await refreshSettings();
    } catch (err: any) {
      showToast(err.message || 'Invalid JSON backup format', 'error');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Store & System Configuration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure store identity, USD/KHR exchange rates, sales tax rates, and database backups.
          </p>
        </div>

        {isSuperAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadBackup}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download DB Backup</span>
            </button>
            <button
              onClick={() => setRestoreModalOpen(true)}
              className="px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 flex items-center gap-1.5 shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Restore DB</span>
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Store Profile & Identity */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Building className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Store Profile & Contact Identity
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Store Name *</label>
              <input
                type="text"
                required
                value={formData.storeName || ''}
                onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Store Tagline</label>
              <input
                type="text"
                value={formData.storeTagline || ''}
                onChange={e => setFormData({ ...formData, storeTagline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Store Phone Number</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Store Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Physical Store Address</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Currency & Exchange Rate (USD & KHR) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Coins className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Multi-Currency & Tax Rates
              </h3>
              <p className="text-xs text-slate-400">Pegged support for US Dollars ($) and Cambodian Riel (៛ KHR)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Primary Default Currency</label>
              <select
                value={formData.currency || 'USD'}
                onChange={e => setFormData({ ...formData, currency: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              >
                <option value="USD">USD ($) - United States Dollar</option>
                <option value="KHR">KHR (៛) - Cambodian Riel</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                KHR Exchange Rate (1 USD = ? KHR) *
              </label>
              <input
                type="number"
                min="1000"
                step="10"
                required
                value={formData.khrExchangeRate || 4100}
                onChange={e => setFormData({ ...formData, khrExchangeRate: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono"
              />
              <span className="text-[10px] text-slate-400">Standard market rate: 4,100 KHR</span>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Store Sales Tax Rate (%) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                required
                value={formData.taxPercentage || 10}
                onChange={e => setFormData({ ...formData, taxPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono"
              />
              <span className="text-[10px] text-slate-400">Default VAT is 10%</span>
            </div>
          </div>
        </div>

        {/* Section 3: Receipts & Invoices */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <FileText className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Receipt & Invoice Format Settings
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Invoice Number Prefix</label>
              <input
                type="text"
                value={formData.invoicePrefix || 'INV-2026-'}
                onChange={e => setFormData({ ...formData, invoicePrefix: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Receipt Thermal Footer Note</label>
              <input
                type="text"
                value={formData.receiptFooter || ''}
                onChange={e => setFormData({ ...formData, receiptFooter: e.target.value })}
                placeholder="Thank you for shopping with us!"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl flex items-center gap-2 shadow-md shadow-purple-600/30 transition-all"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save All Configuration Changes</span>
          </button>
        </div>
      </form>

      {/* RESTORE MODAL */}
      {restoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Upload className="w-4 h-4 text-purple-600" />
                <span>Restore Store Database from JSON</span>
              </h3>
              <button onClick={() => setRestoreModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Restoring will safely update products, categories, customers, and configuration.</span>
            </div>

            <textarea
              rows={8}
              value={restoreJson}
              onChange={e => setRestoreJson(e.target.value)}
              placeholder="Paste JSON database backup content here..."
              className="w-full p-3 font-mono text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRestoreModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                disabled={restoring || !restoreJson.trim()}
                onClick={handleRestoreSubmit}
                className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-600/30 disabled:opacity-50"
              >
                {restoring && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Restore Database</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
