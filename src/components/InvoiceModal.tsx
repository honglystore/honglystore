import React from 'react';
import { Printer, X, Download, FileText, CheckCircle2 } from 'lucide-react';
import { Order } from '../types/index.js';
import { useStore } from '../context/StoreContext.js';

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  const { settings, formatPrice } = useStore();

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = order.orderNumber.replace('ORD-', settings?.invoicePrefix || 'INV-2026-');
  const rate = order.exchangeRate || settings?.khrExchangeRate || 4100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-8">
        {/* Controls */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40 no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Tax Invoice: {invoiceNumber}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Body */}
        <div id="printable-area" className="p-8 md:p-10 text-slate-800 bg-white space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-200 gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">
                {settings?.storeName || 'NexusStore'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">{settings?.storeTagline}</p>
              <p className="text-xs text-slate-600 mt-0.5">{settings?.address}</p>
              <p className="text-xs text-slate-600">Email: {settings?.email} | Tel: {settings?.phone}</p>
            </div>
            <div className="text-left md:text-right">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800">
                {order.paymentStatus === 'completed' ? 'PAID & VERIFIED' : order.paymentStatus.toUpperCase()}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">{invoiceNumber}</h2>
              <p className="text-xs text-slate-500">Date: {new Date(order.date).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Billed To / Cashier */}
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Billed To:
              </span>
              <p className="font-bold text-sm text-slate-900 mt-1">{order.customerName}</p>
              <p className="text-slate-600 mt-0.5">Payment Method: <span className="font-semibold uppercase">{order.paymentMethod}</span></p>
              <p className="text-slate-600">Currency: USD / KHR pegged (Rate: 1 USD = {rate} KHR)</p>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Issuer Details:
              </span>
              <p className="font-semibold text-slate-900 mt-1">Processed By: {order.cashierName}</p>
              <p className="text-slate-600 mt-0.5">Order Ref: {order.orderNumber}</p>
              <p className="text-slate-600">Status: Completed</p>
            </div>
          </div>

          {/* Line items table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-950 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5">Item Description</th>
                  <th className="py-2.5 text-center">SKU</th>
                  <th className="py-2.5 text-center">Quantity</th>
                  <th className="py-2.5 text-right">Unit Price</th>
                  <th className="py-2.5 text-right">Total (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 font-medium text-slate-900">{it.productName}</td>
                    <td className="py-3 text-center text-slate-500 font-mono text-[11px]">{it.sku}</td>
                    <td className="py-3 text-center font-semibold">{it.quantity}</td>
                    <td className="py-3 text-right text-slate-700">${it.unitPrice.toFixed(2)}</td>
                    <td className="py-3 text-right font-bold text-slate-900">${it.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-medium">${order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Special Discount:</span>
                  <span className="font-medium">-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Sales Tax ({settings?.taxPercentage || 10}%):</span>
                <span className="font-medium">${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-950 border-t border-slate-300 pt-2">
                <span>Grand Total (USD):</span>
                <span>${order.grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-purple-700">
                <span>Grand Total (KHR ៛):</span>
                <span>៛{Math.round(order.grandTotal * rate).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Terms Footer */}
          <div className="border-t border-slate-100 pt-6 text-[11px] text-slate-500 space-y-1">
            <p className="font-bold text-slate-700">Terms & Payment Confirmation:</p>
            <p>Payment was successfully settled upon issuance. Please retain this invoice for tax and audit purposes.</p>
            <p>{settings?.receiptFooter}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-end gap-3 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl flex items-center gap-2 shadow-md shadow-purple-600/30 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
