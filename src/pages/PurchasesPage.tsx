import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Trash2,
  PackageCheck,
  Ban,
  Calendar,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useStore } from '../context/StoreContext.js';
import { useAuth } from '../context/AuthContext.js';
import { Purchase, Supplier, Product } from '../types/index.js';

export const PurchasesPage: React.FC = () => {
  const { formatPrice, showToast, triggerGlobalRefresh } = useStore();
  const { hasPermission } = useAuth();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Create PO Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'partial'>('paid');
  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ productId: string; quantity: number; purchasePrice: number }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pos, sups, prods] = await Promise.all([
        api.getPurchases(),
        api.getSuppliers(),
        api.getProducts(),
      ]);
      setPurchases(pos);
      setSuppliers(sups);
      setProducts(prods);
      if (sups.length > 0 && !supplierId) {
        setSupplierId(sups[0].id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load purchase orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setSelectedItems(
      products.slice(0, 1).map(p => ({
        productId: p.id,
        quantity: 10,
        purchasePrice: p.purchasePrice,
      }))
    );
    setNotes('');
    setPaymentStatus('paid');
    setModalOpen(true);
  };

  const addItemRow = () => {
    if (products.length === 0) return;
    setSelectedItems(prev => [
      ...prev,
      { productId: products[0].id, quantity: 10, purchasePrice: products[0].purchasePrice },
    ]);
  };

  const removeItemRow = (idx: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItemRow = (idx: number, field: string, value: any) => {
    setSelectedItems(prev => {
      const copy = [...prev];
      if (field === 'productId') {
        const prod = products.find(p => p.id === value);
        copy[idx] = {
          ...copy[idx],
          productId: value,
          purchasePrice: prod ? prod.purchasePrice : copy[idx].purchasePrice,
        };
      } else {
        copy[idx] = { ...copy[idx], [field]: value };
      }
      return copy;
    });
  };

  const poTotal = selectedItems.reduce(
    (sum, item) => sum + (Number(item.purchasePrice) || 0) * (Number(item.quantity) || 0),
    0
  );

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || selectedItems.length === 0) {
      showToast('Please select a supplier and at least one item', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        supplierId,
        paymentStatus,
        notes,
        items: selectedItems.map(it => {
          const prod = products.find(p => p.id === it.productId)!;
          return {
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            quantity: Number(it.quantity),
            purchasePrice: Number(it.purchasePrice),
          };
        }),
      };

      await api.createPurchase(payload);
      showToast('Purchase Order created successfully', 'success');
      setModalOpen(false);
      loadData();
      triggerGlobalRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to create PO', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiveGoods = async (po: Purchase) => {
    if (!window.confirm(`Confirm intake of ${po.purchaseNumber}? This will automatically add items into warehouse stock.`)) {
      return;
    }

    try {
      await api.receivePurchase(po.id);
      showToast(`Stock received for ${po.purchaseNumber}! Inventory updated.`, 'success');
      loadData();
      triggerGlobalRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to receive stock', 'error');
    }
  };

  const handleCancelPO = async (po: Purchase) => {
    if (!window.confirm(`Cancel purchase order ${po.purchaseNumber}?`)) return;
    try {
      await api.cancelPurchase(po.id);
      showToast(`Purchase order ${po.purchaseNumber} cancelled`, 'info');
      loadData();
      triggerGlobalRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel PO', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Procurement & Purchase Orders
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Order wholesale stock from suppliers and atomically receive goods directly into live inventory.
          </p>
        </div>

        {hasPermission('purchases.manage') && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-purple-600/30 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </button>
        )}
      </div>

      {/* PO Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4 text-center">Items Ordered</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-center">Intake Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
                    <span>Loading purchase orders...</span>
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="font-semibold text-sm">No purchase orders found</p>
                  </td>
                </tr>
              ) : (
                purchases.map(po => (
                  <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                      {po.purchaseNumber}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {po.supplierName}
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(po.date).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-center font-medium">
                      {po.items.reduce((s, i) => s + i.quantity, 0)} units ({po.items.length} skus)
                    </td>

                    <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-slate-100">
                      {formatPrice(po.totalCost)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          po.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {po.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          po.status === 'received'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : po.status === 'ordered'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {hasPermission('purchases.manage') && (
                        <div className="flex items-center justify-end gap-1.5">
                          {po.status === 'ordered' && (
                            <button
                              onClick={() => handleReceiveGoods(po)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-all"
                              title="Receive stock into inventory"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Receive Stock</span>
                            </button>
                          )}
                          {po.status === 'ordered' && (
                            <button
                              onClick={() => handleCancelPO(po)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                              title="Cancel PO"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {po.status === 'received' && (
                            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Stock Added
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PO MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Create New Purchase Order
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Supplier *</label>
                  <select
                    required
                    value={supplierId}
                    onChange={e => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={e => setPaymentStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  >
                    <option value="paid">Paid in Full</option>
                    <option value="pending">Pending / On Credit</option>
                    <option value="partial">Partial Payment</option>
                  </select>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Order Items</label>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-[11px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedItems.map((row, idx) => (
                    <div key={idx} className="p-2.5 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/40">
                      <select
                        value={row.productId}
                        onChange={e => updateItemRow(idx, 'productId', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>

                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={row.quantity}
                          onChange={e => updateItemRow(idx, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-bold"
                        />
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Cost"
                          value={row.purchasePrice}
                          onChange={e => updateItemRow(idx, 'purchasePrice', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-right font-mono"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={selectedItems.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation */}
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800 flex justify-between items-center">
                <span className="font-bold text-slate-700 dark:text-slate-300">Total Purchase Cost:</span>
                <span className="font-black text-base text-purple-700 dark:text-purple-300">
                  {formatPrice(poTotal)}
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Purchase Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Expected delivery date, logistics tracking #..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
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
                  <span>Issue Purchase Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
