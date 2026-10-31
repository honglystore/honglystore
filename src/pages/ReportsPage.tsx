import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  RefreshCw,
  FileSpreadsheet,
  PieChart as PieIcon,
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

export const ReportsPage: React.FC = () => {
  const { formatPrice, showToast } = useStore();
  const [range, setRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.getReports(range);
      setData(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to generate financial reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [range]);

  const summary = data?.summary || {};
  const marginPct =
    summary.totalRevenue > 0
      ? ((summary.netProfit / summary.totalRevenue) * 100).toFixed(1)
      : '0.0';

  const handlePrint = () => {
    window.print();
  };

  const exportCSV = () => {
    if (!data) return;
    const lines = [
      'NexusStore Financial & Profit/Loss Report',
      `Generated on,${new Date().toLocaleString()}`,
      `Selected Range,${range.toUpperCase()}`,
      '',
      'Metric,Amount (USD)',
      `Total Revenue,$${summary.totalRevenue || 0}`,
      `Cost of Goods Sold (COGS),-$${summary.cogs || 0}`,
      `Gross Profit,$${summary.grossProfit || 0}`,
      `Total Operating Expenses,-$${summary.totalExpenses || 0}`,
      `Net Profit (EBITDA),$${summary.netProfit || 0}`,
      `Discounts Given,-$${summary.totalDiscounts || 0}`,
      `Total Sales Tax Collected,$${summary.totalTax || 0}`,
      '',
      'Product Name,SKU,Units Sold,Revenue ($),Gross Margin ($)',
      ...(data.productPerformance || []).map(
        (p: any) => `"${p.name.replace(/"/g, '""')}",${p.sku},${p.qty},${p.revenue},${p.profit}`
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `financial_report_${range}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported report to CSV', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Financial Analytics & Executive Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete Profit & Loss statement, cost of goods sold (COGS), sales margins, and tax audits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Range picker pills */}
          <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {(['day', 'week', 'month', 'year'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                  range === r
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={exportCSV}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-purple-600/30 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Printable Report Wrapper */}
      <div id="printable-area" className="space-y-6">
        {/* Executive Profit & Loss Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Sales Revenue
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 font-mono">
              {formatPrice(summary.totalRevenue || 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              From {summary.orderCount || 0} completed register transactions
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Cost of Goods (COGS)
            </span>
            <div className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-2 font-mono">
              {formatPrice(summary.cogs || 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Direct product inventory acquisition cost</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Operating Expenses
            </span>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2 font-mono">
              -{formatPrice(summary.totalExpenses || 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Rent, utilities, packaging, marketing</p>
          </div>

          <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 shadow-xs">
            <span className="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider">
              Net Profit
            </span>
            <div className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-2 font-mono">
              {formatPrice(summary.netProfit || 0)}
            </div>
            <p className="text-[11px] text-purple-600 dark:text-purple-400 font-bold mt-1">
              {marginPct}% net profit margin
            </p>
          </div>
        </div>

        {/* Detailed Profit & Loss Statement Table */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                Official Profit & Loss Statement (P&L)
              </h3>
              <p className="text-xs text-slate-400">Reporting Horizon: {range.toUpperCase()} basis</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold">
              Audited & Reconciled
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <div className="py-2.5 flex justify-between font-bold text-slate-900 dark:text-slate-100">
              <span>Gross Sales Revenue</span>
              <span className="font-mono">{formatPrice(summary.totalRevenue || 0)}</span>
            </div>

            <div className="py-2.5 flex justify-between text-slate-500">
              <span className="pl-4">Less: Cost of Goods Sold (COGS)</span>
              <span className="font-mono text-rose-600">-{formatPrice(summary.cogs || 0)}</span>
            </div>

            <div className="py-2.5 flex justify-between font-bold text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-800/30 px-2 rounded-lg">
              <span>GROSS PROFIT</span>
              <span className="font-mono text-emerald-600">{formatPrice(summary.grossProfit || 0)}</span>
            </div>

            <div className="py-2.5 flex justify-between text-slate-500">
              <span className="pl-4">Less: Operating Expenses (OpEx)</span>
              <span className="font-mono text-rose-600">-{formatPrice(summary.totalExpenses || 0)}</span>
            </div>

            <div className="py-2.5 flex justify-between text-slate-500">
              <span className="pl-4">Discounts & Promos Granted</span>
              <span className="font-mono">-{formatPrice(summary.totalDiscounts || 0)}</span>
            </div>

            <div className="py-3 flex justify-between font-black text-base text-purple-700 dark:text-purple-300 bg-purple-50/80 dark:bg-purple-950/60 px-3 rounded-xl mt-2">
              <span>NET OPERATING PROFIT</span>
              <span className="font-mono">{formatPrice(summary.netProfit || 0)}</span>
            </div>

            <div className="py-2.5 flex justify-between text-slate-400 text-[11px]">
              <span>Sales Tax Collected (Remittable to Tax Authority):</span>
              <span className="font-mono">{formatPrice(summary.totalTax || 0)}</span>
            </div>
          </div>
        </div>

        {/* Product Performance Table */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Product Performance & Unit Margins
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Top revenue contributors and gross margin rankings</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-3">Product Name</th>
                  <th className="pb-3">SKU</th>
                  <th className="pb-3 text-center">Units Sold</th>
                  <th className="pb-3 text-right">Total Revenue</th>
                  <th className="pb-3 text-right">Gross Margin ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data?.productPerformance || []).map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 font-bold text-slate-900 dark:text-slate-100">{p.name}</td>
                    <td className="py-3 font-mono text-purple-600">{p.sku}</td>
                    <td className="py-3 text-center font-bold">{p.qty}</td>
                    <td className="py-3 text-right font-black font-mono">{formatPrice(p.revenue)}</td>
                    <td className="py-3 text-right font-bold text-emerald-600 font-mono">
                      +{formatPrice(p.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
