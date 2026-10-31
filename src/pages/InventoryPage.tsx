import React, { useState, useEffect } from 'react';
import {
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  History,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Plus,
  Minus,
  CheckCircle2,
  Calendar,
  User,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useStore } from '../context/StoreContext.js';
import { useAuth } from '../context/AuthContext.js';
import { Product, StockMovement } from '../types/index.js';

export const InventoryPage: React.FC = () => {
  const { formatPrice, showToast, triggerGlobalRefresh } = useStore();
  const { hasPermission, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'movements'>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [valuation, setValuation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Stock Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [adjustQuantity, setAdjustQuantity] = useState<string>('5');
  const [adjustReason, setAdjustReason] = useState<string>('Supplier delivery restock');
  const [submitting, setSubmitting] = useState(false);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const [prods, val, movs] = await Promise.all([
        api.getProducts(),
        api.getInventoryValuation(),
        api.getStockMovements(),
      ]);
      setProducts(prods);
      setValuation(val);
      setMovements(movs);
    } catch (err: any) {
      showToast(err.message || 'Failed to load inventory data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const openAdjust = (product: Product, type: 'in' | 'out' | 'adjustment') => {
    setSelectedProduct(product);
    setAdjustType(type);
    setAdjustQuantity(type === 'adjustment' ? product.stockQuantity.toString() : '5');
    setAdjustReason(
      type === 'in'
        ? 'Restock from warehouse intake'
        : type === 'out'
        ? 'Damaged goods write-off'
        : 'Physical audit inventory reconciliation'
    );
    setAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const qty = Number(adjustQuantity);
    if (isNaN(qty) || qty < 0) {
      showToast('Please enter a valid quantity', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.adjustStock({
        productId: selectedProduct.id,
        type: adjustType,
        quantity: qty,
        reason: adjustReason,
      });

      showToast(`Stock updated for "${selectedProduct.name}"`, 'success');
      setAdjustModalOpen(false);
      loadInventory();
      triggerGlobalRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to adjust stock', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const lowStockItems = products.filter(p => p.stockQuantity <= p.minStockAlert);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Inventory & Stock Valuation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time warehouse tracking, stock in/out adjustments, audit movements, and valuation metrics.
          </p>
        </div>

        <button
          onClick={loadInventory}
          className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Valuation Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Inventory Cost
          </span>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {formatPrice(valuation?.totalCostValuation || 0)}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Acquisition valuation of assets</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Retail Value
          </span>
          <div className="mt-3">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {formatPrice(valuation?.totalRetailValuation || 0)}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Total revenue if fully sold out</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Potential Gross Profit
          </span>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-600">
              {formatPrice(valuation?.potentialProfit || 0)}
            </span>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              {valuation?.marginPercentage || 0}% overall inventory margin
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Units in Warehouse
          </span>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {valuation?.totalStockUnits || 0}
            </span>
            <p className="text-[11px] text-amber-600 font-bold mt-1">
              {lowStockItems.length} items needing restock
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'overview'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Live Stock Levels & Quick Adjustments</span>
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`py-3 px-5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'movements'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Movements History ({movements.length})</span>
        </button>
      </div>

      {/* TAB 1: Live Stock Levels & Adjustment Buttons */}
      {activeTab === 'overview' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">SKU Code</th>
                  <th className="py-3 px-4 text-center">Current Stock</th>
                  <th className="py-3 px-4 text-center">Min Threshold</th>
                  <th className="py-3 px-4 text-right">Cost Value</th>
                  <th className="py-3 px-4 text-right">Retail Value</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Quick Stock Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {products.map(prod => {
                  const isLow = prod.stockQuantity <= prod.minStockAlert;
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={prod.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80'}
                            alt={prod.name}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-xs">
                            {prod.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-purple-600 dark:text-purple-400">
                        {prod.sku}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-black text-sm text-slate-900 dark:text-slate-100">
                          {prod.stockQuantity}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center text-slate-400">
                        {prod.minStockAlert} units
                      </td>

                      <td className="py-3 px-4 text-right text-slate-500 font-mono">
                        ${(prod.purchasePrice * prod.stockQuantity).toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {formatPrice(prod.sellingPrice * prod.stockQuantity)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            prod.stockQuantity === 0
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : isLow
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {prod.stockQuantity === 0
                            ? 'OUT OF STOCK'
                            : isLow
                            ? 'LOW STOCK'
                            : 'SUFFICIENT'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {hasPermission('inventory.adjust') ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openAdjust(prod, 'in')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 text-[11px] font-bold flex items-center gap-1"
                              title="Stock In / Restock"
                            >
                              <Plus className="w-3 h-3" />
                              <span>In</span>
                            </button>
                            <button
                              onClick={() => openAdjust(prod, 'out')}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 text-[11px] font-bold flex items-center gap-1"
                              title="Stock Out / Scrap"
                            >
                              <Minus className="w-3 h-3" />
                              <span>Out</span>
                            </button>
                            <button
                              onClick={() => openAdjust(prod, 'adjustment')}
                              className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 text-[11px] font-bold flex items-center gap-1"
                              title="Physical Audit Sync"
                            >
                              <SlidersHorizontal className="w-3 h-3" />
                              <span>Adjust</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No permission</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Audit Stock Movements Table */}
      {activeTab === 'movements' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4 text-center">Movement Type</th>
                  <th className="py-3 px-4 text-center">Qty Changed</th>
                  <th className="py-3 px-4 text-center">Previous → New</th>
                  <th className="py-3 px-4">Authorized By</th>
                  <th className="py-3 px-4">Reason / Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No stock movement history recorded yet.
                    </td>
                  </tr>
                ) : (
                  movements.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(m.date).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {m.productName}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            m.type === 'in'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : m.type === 'out'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                          }`}
                        >
                          {m.type === 'in' ? 'STOCK IN' : m.type === 'out' ? 'STOCK OUT' : 'ADJUSTMENT'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-sm">
                        {m.type === 'in' ? `+${m.quantity}` : m.type === 'out' ? `-${m.quantity}` : `${m.quantity}`}
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-slate-600 dark:text-slate-300">
                        {m.previousStock} → <span className="font-bold text-slate-900 dark:text-white">{m.newStock}</span>
                      </td>

                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {m.userName}
                      </td>

                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {m.reason}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADJUST STOCK MODAL */}
      {adjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {adjustType === 'in'
                    ? 'Receive Stock (Stock In)'
                    : adjustType === 'out'
                    ? 'Write-Off / Scrap (Stock Out)'
                    : 'Physical Stock Adjustment'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">{selectedProduct.name}</p>
              </div>
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800 flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-300">Current Stock in DB:</span>
                <span className="font-black text-sm text-purple-700 dark:text-purple-300">
                  {selectedProduct.stockQuantity} units
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {adjustType === 'adjustment' ? 'New Exact Stock Level *' : 'Quantity to Change *'}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustQuantity}
                  onChange={e => setAdjustQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Audit Reason / Notes *
                </label>
                <textarea
                  rows={2}
                  required
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="Explain why this inventory adjustment is being executed..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-600/30"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Movement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
