import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  DollarSign,
  Calendar,
  Trash2,
  RefreshCw,
  PieChart as PieIcon,
  Tag,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../services/api.js';
import { useStore } from '../context/StoreContext.js';
import { useAuth } from '../context/AuthContext.js';
import { Expense } from '../types/index.js';

export const ExpensesPage: React.FC = () => {
  const { formatPrice, showToast, triggerGlobalRefresh } = useStore();
  const { hasPermission } = useAuth();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    category: 'Utilities',
    description: '',
    amount: '',
    paymentMethod: 'bank_transfer',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await api.getExpenses();
      setExpenses(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by category for chart
  const categoryDataMap: Record<string, number> = {};
  expenses.forEach(e => {
    categoryDataMap[e.category] = (categoryDataMap[e.category] || 0) + e.amount;
  });

  const chartData = Object.entries(categoryDataMap).map(([cat, amt]) => ({
    category: cat,
    amount: Number(amt.toFixed(2)),
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.createExpense({
        ...formData,
        amount: Number(formData.amount),
      });
      showToast('Expense successfully recorded', 'success');
      setModalOpen(false);
      setFormData({
        category: 'Utilities',
        description: '',
        amount: '',
        paymentMethod: 'bank_transfer',
        notes: '',
        date: new Date().toISOString().split('T')[0],
      });
      loadExpenses();
      triggerGlobalRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to record expense', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, desc: string) => {
    if (!window.confirm(`Delete expense record "${desc}"?`)) return;
    try {
      await api.deleteExpense(id);
      showToast('Expense record deleted', 'info');
      loadExpenses();
      triggerGlobalRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete expense', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Store Expense Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track operational store overhead including rent, utilities, salaries, packaging, and marketing.
          </p>
        </div>

        {hasPermission('expenses.manage') && (
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-purple-600/30 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Expense</span>
          </button>
        )}
      </div>

      {/* KPI & Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Expense KPI Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Recorded Expenses
            </span>
            <div className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-2 font-mono">
              {formatPrice(totalExpenseAmount)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Across {expenses.length} distinct operational expenditure entries
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-6 space-y-2 text-xs">
            {chartData.slice(0, 3).map((c, i) => (
              <div key={i} className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>{c.category}:</span>
                <span className="font-bold">{formatPrice(c.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses by Category Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Expenditures by Category
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Operating cost allocation overview</p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Spent']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="amount" fill="#F43F5E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Expense Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Recorded By</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
                    <span>Loading expense entries...</span>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="font-semibold text-sm">No expenses recorded yet</p>
                  </td>
                </tr>
              ) : (
                expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(exp.date).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {exp.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100 max-w-sm truncate">
                      {exp.description}
                    </td>

                    <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-500">
                      {exp.paymentMethod.replace('_', ' ')}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {exp.recordedBy}
                    </td>

                    <td className="py-3 px-4 text-right font-black font-mono text-sm text-rose-600 dark:text-rose-400">
                      -{formatPrice(exp.amount)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {hasPermission('expenses.manage') && (
                        <button
                          onClick={() => handleDelete(exp.id, exp.description)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD EXPENSE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Record Operating Expense
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Category *</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                >
                  <option value="Utilities">Utilities (Electricity, Internet, Water)</option>
                  <option value="Rent">Rent & Facility Lease</option>
                  <option value="Salaries">Staff Salaries & Wages</option>
                  <option value="Packaging">Packaging Materials & Bags</option>
                  <option value="Marketing">Marketing & Advertising</option>
                  <option value="Maintenance">Equipment Maintenance & Cleaning</option>
                  <option value="Other">Other Expenses</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Description *</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. October high-speed fiber internet bill"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Invoice reference or receipt attachment notes..."
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
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-600/30"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Expense</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
