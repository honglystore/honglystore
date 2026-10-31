import React from 'react';
import { Printer, X, CheckCircle, Download } from 'lucide-react';
import { Order } from '../types/index.js';
import { useStore } from '../context/StoreContext.js';

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
  const { settings, formatPrice } = useStore();

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const rate = order.exchangeRate || settings?.khrExchangeRate || 4100;
  const khrTotal = Math.round(order.grandTotal * rate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-8">
        {/* Header Controls */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40 no-print">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Sale Completed Successfully</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div id="printable-area" className="p-6 text-slate-800 font-mono text-xs space-y-4 bg-white">
          <div className="text-center space-y-1">
            <h2 className="text-base font-black tracking-wider uppercase text-slate-950">
              {settings?.storeName || 'NexusStore'}
            </h2>
            <p className="text-[11px] text-slate-600">{settings?.storeTagline}</p>
            <p className="text-[11px] text-slate-600">{settings?.address}</p>
            <p className="text-[11px] text-slate-600">Tel: {settings?.phone}</p>
          </div>

          <div className="border-t border-b border-dashed border-slate-400 py-2 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Receipt #:</span>
              <span className="font-bold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{new Date(order.date).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{order.cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment:</span>
              <span className="font-bold uppercase">{order.paymentMethod}</span>
            </div>
          </div>

          {/* Items list */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between font-bold border-b border-slate-300 pb-1 text-[11px]">
              <span className="w-1/2">Item</span>
              <span className="w-12 text-center">Qty</span>
              <span className="w-16 text-right">Price</span>
              <span className="w-16 text-right">Total</span>
            </div>

            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-[11px] py-0.5">
                <span className="w-1/2 truncate pr-1">{item.productName}</span>
                <span className="w-12 text-center">{item.quantity}</span>
                <span className="w-16 text-right">${item.unitPrice.toFixed(2)}</span>
                <span className="w-16 text-right font-medium">${item.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-dashed border-slate-400 pt-2 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount:</span>
                <span>-${order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax ({settings?.taxPercentage || 10}%):</span>
              <span>${order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-300">
              <span>GRAND TOTAL:</span>
              <span>${order.grandTotal.toFixed(2)}</span>
            </div>
            {/* Cambodian Riel Equivalent */}
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>KHR TOTAL (៛):</span>
              <span>៛{khrTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Simulated Barcode */}
          <div className="pt-4 text-center space-y-1">
            <div className="inline-block bg-slate-900 text-white tracking-[0.3em] font-mono py-1 px-4 text-[10px] rounded-xs">
              ||| | || |||| | | ||| || |||
            </div>
            <p className="text-[10px] text-slate-500">{order.orderNumber}</p>
          </div>

          <div className="text-center pt-2 text-[10px] text-slate-500 leading-tight">
            <p>{settings?.receiptFooter || 'Thank you for shopping with us!'}</p>
            <p className="mt-1">Powered by NexusStore POS</p>
          </div>
        </div>

        {/* Action Buttons */}
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
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
