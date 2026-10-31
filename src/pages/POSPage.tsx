import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  QrCode,
  CreditCard,
  UserCheck,
  Percent,
  Check,
  ShoppingBag,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useStore } from '../context/StoreContext.js';
import { useAuth } from '../context/AuthContext.js';
import { Product, Customer, Order } from '../types/index.js';
import { ReceiptModal } from '../components/ReceiptModal.js';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export const POSPage: React.FC = () => {
  const { settings, formatPrice, currency, showToast, triggerGlobalRefresh, t } = useStore();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr' | 'card' | 'split'>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [processingSale, setProcessingSale] = useState(false);

  // Receipt Modal state
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const [prods, cats, custs] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getCustomers(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setCustomers(custs);
    } catch (err) {
      console.error(err);
      showToast('Failed to load store catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    return matchesCat && matchesQuery;
  });

  // Handle barcode submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const code = barcodeInput.trim().toLowerCase();
    const found = products.find(
      p => p.barcode.toLowerCase() === code || p.sku.toLowerCase() === code
    );

    if (found) {
      addToCart(found);
      setBarcodeInput('');
      showToast(`Scanned: ${found.name}`, 'success');
    } else {
      showToast(`No product matching barcode "${barcodeInput}"`, 'error');
    }
  };

  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      showToast(`"${product.name}" is currently out of stock.`, 'error');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          showToast(`Cannot exceed available stock (${product.stockQuantity})`, 'error');
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, unitPrice: product.sellingPrice, discount: 0 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.product.stockQuantity) {
              showToast(`Only ${item.product.stockQuantity} units in stock`, 'error');
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomerId('');
    setOrderDiscount(0);
    setCashTendered('');
  };

  // Computations
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity - item.discount, 0);
  const taxRate = settings?.taxPercentage ? settings.taxPercentage / 100 : 0.1;
  const discountTotal = Math.min(subtotal, orderDiscount);
  const taxableAmount = Math.max(0, subtotal - discountTotal);
  const taxAmount = taxableAmount * taxRate;
  const grandTotal = taxableAmount + taxAmount;

  const rate = settings?.khrExchangeRate || 4100;
  const grandTotalKHR = Math.round(grandTotal * rate);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Cash change calculation
  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeUSD = Math.max(0, tenderedNum - grandTotal);
  const changeKHR = Math.round(changeUSD * rate);

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      showToast('Cart is empty', 'error');
      return;
    }

    if (paymentMethod === 'cash' && cashTendered && tenderedNum < grandTotal) {
      showToast('Tendered cash is less than grand total', 'error');
      return;
    }

    setProcessingSale(true);
    try {
      const payload = {
        customerId: selectedCustomerId || undefined,
        customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
        items: cart.map(i => ({
          productId: i.product.id,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discount: i.discount,
        })),
        subtotal: Number(subtotal.toFixed(2)),
        discount: Number(discountTotal.toFixed(2)),
        tax: Number(taxAmount.toFixed(2)),
        grandTotal: Number(grandTotal.toFixed(2)),
        paymentMethod,
        currency: 'USD',
      };

      const res = await api.checkoutPOS(payload);
      if (res.success && res.order) {
        showToast(`Order ${res.order.orderNumber} successfully processed!`, 'success');
        setCompletedOrder(res.order);
        setCheckoutModalOpen(false);
        clearCart();
        loadCatalog(); // Refresh products with deducted stock
        triggerGlobalRefresh();
      }
    } catch (err: any) {
      showToast(err.message || 'Checkout failed', 'error');
    } finally {
      setProcessingSale(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-6.5rem)]">
      {/* LEFT: Product Catalog & Fast Scanner */}
      <div className="flex-1 flex flex-col space-y-4">
        {/* Search & Barcode Scan Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3">
          {/* Barcode scanner input */}
          <form onSubmit={handleBarcodeSubmit} className="relative sm:w-64">
            <Barcode className="w-4 h-4 text-purple-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              placeholder={t('scanBarcode')}
              className="w-full pl-10 pr-3 py-2 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/80 rounded-xl text-xs font-mono text-purple-900 dark:text-purple-200 placeholder-purple-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </form>

          {/* Product text search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('searchProducts')}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            onClick={loadCatalog}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 self-end sm:self-auto"
            title="Refresh Catalog"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Barcode Demo Pill Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] text-slate-500">
          <span className="font-semibold text-purple-600 flex items-center gap-1 shrink-0">
            <Barcode className="w-3.5 h-3.5" /> {t('sampleBarcodes')}
          </span>
          {products.slice(0, 4).map(p => (
            <button
              key={p.id}
              onClick={() => {
                addToCart(p);
                showToast(`Scanned ${p.name}`, 'success');
              }}
              className="shrink-0 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 text-slate-700 dark:text-slate-300 font-mono transition-colors border border-slate-200 dark:border-slate-700"
            >
              {p.barcode} ({p.name.slice(0, 14)}...)
            </button>
          ))}
        </div>

        {/* Categories Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t('allItems')} ({products.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mr-2 text-purple-600" />
              <span>Loading products...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
              <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold">No products found</p>
              <p className="text-xs mt-1">Try another category or search keyword.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 pb-4">
              {filteredProducts.map(prod => {
                const isOutOfStock = prod.stockQuantity <= 0;
                const isLowStock = prod.stockQuantity <= prod.minStockAlert;
                return (
                  <button
                    key={prod.id}
                    disabled={isOutOfStock}
                    onClick={() => addToCart(prod)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all group relative ${
                      isOutOfStock
                        ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 shadow-2xs hover:shadow-md'
                    }`}
                  >
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-2.5">
                      <img
                        src={prod.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80'}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span
                        className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOutOfStock
                            ? 'bg-rose-500 text-white'
                            : isLowStock
                            ? 'bg-amber-500 text-amber-950 font-bold'
                            : 'bg-slate-900/80 text-white backdrop-blur-xs'
                        }`}
                      >
                        {isOutOfStock ? 'OUT' : `${prod.stockQuantity} in stock`}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 uppercase">
                        {prod.sku}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 mt-0.5 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {prod.name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                          {formatPrice(prod.sellingPrice)}
                        </span>
                        {currency === 'USD' && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ៛{Math.round(prod.sellingPrice * rate).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Active Cart, Customer CRM selector & Totals */}
      <div className="w-full lg:w-96 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col h-auto lg:h-[calc(100vh-6.5rem)] sticky top-20">
        {/* Cart Header & Customer Selector */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {t('cartRegister')} ({cart.reduce((s, i) => s + i.quantity, 0)} {t('items')})
              </h3>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('clearCart')}</span>
              </button>
            )}
          </div>

          {/* Customer CRM Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>{t('customerLoyalty')}</span>
            </label>
            <select
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500"
            >
              <option value="">{t('walkInCustomer')}</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.membershipLevel} - {c.loyaltyPoints} pts)
                </option>
              ))}
            </select>
            {selectedCustomer && (
              <div className="flex items-center justify-between px-2 py-1 bg-purple-50 dark:bg-purple-950/40 rounded-lg text-[10px] text-purple-700 dark:text-purple-300">
                <span>Tier: {selectedCustomer.membershipLevel}</span>
                <span>Points: {selectedCustomer.loyaltyPoints}</span>
              </div>
            )}
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100 dark:divide-slate-800/80">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-16">
              <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-700 stroke-1 mb-2" />
              <p className="text-xs font-semibold">Your register cart is empty</p>
              <p className="text-[11px] mt-1">Scan a barcode or click products to ring up.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="pt-2 first:pt-0 flex items-start gap-2.5">
                <img
                  src={item.product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80'}
                  alt={item.product.name}
                  className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {item.product.name}
                  </h5>
                  <div className="text-[11px] text-slate-400">
                    {formatPrice(item.unitPrice)} each
                  </div>

                  {/* Qty controls */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="text-right flex flex-col justify-between items-end h-full">
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                    {formatPrice(item.unitPrice * item.quantity - item.discount)}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-slate-300 hover:text-rose-500 p-1 mt-2 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calculation & Checkout Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 rounded-b-3xl space-y-2">
          {/* Discount input */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <Percent className="w-3.5 h-3.5" /> Manual Discount ($):
            </span>
            <input
              type="number"
              min="0"
              max={subtotal}
              step="0.5"
              value={orderDiscount || ''}
              onChange={e => setOrderDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="0.00"
              className="w-20 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-right text-xs"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{t('subtotal')}</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {formatPrice(subtotal)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{t('tax')} ({settings?.taxPercentage || 10}%):</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {formatPrice(taxAmount)}
            </span>
          </div>

          {/* Grand Totals */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-baseline justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase text-slate-400">{t('grandTotal')}</span>
              <span className="text-xs font-bold text-purple-600 font-mono">
                ៛{grandTotalKHR.toLocaleString()}
              </span>
            </div>
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">
              ${grandTotal.toFixed(2)}
            </span>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => {
              setCashTendered(grandTotal.toFixed(2));
              setCheckoutModalOpen(true);
            }}
            className="w-full mt-3 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-sm tracking-wide shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('payNow')} ({formatPrice(grandTotal)})</span>
          </button>
        </div>
      </div>

      {/* CHECKOUT PAYMENT MODAL */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Select Payment Method
                </h3>
                <p className="text-xs text-slate-400">Total Due: ${grandTotal.toFixed(2)} (៛{grandTotalKHR.toLocaleString()})</p>
              </div>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 text-purple-600'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span>Cash Payment</span>
              </button>
              <button
                onClick={() => setPaymentMethod('qr')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'qr'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 text-purple-600'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span>ABA / KHQR</span>
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 text-purple-600'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Credit / Debit</span>
              </button>
            </div>

            {/* Method Specific UI */}
            {paymentMethod === 'cash' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Amount Tendered ($):</span>
                  <input
                    type="number"
                    step="0.01"
                    value={cashTendered}
                    onChange={e => setCashTendered(e.target.value)}
                    className="w-36 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-right text-sm font-bold"
                  />
                </div>

                {/* Quick bill buttons */}
                <div className="flex gap-2">
                  {[10, 20, 50, 100].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setCashTendered(amt.toString())}
                      className="flex-1 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-purple-50"
                    >
                      ${amt}
                    </button>
                  ))}
                  <button
                    onClick={() => setCashTendered(grandTotal.toFixed(2))}
                    className="flex-1 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-bold"
                  >
                    Exact
                  </button>
                </div>

                {/* Change Due calculation */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                  <span>Change to Return:</span>
                  <div className="text-right">
                    <span className="text-emerald-600 text-sm font-black">${changeUSD.toFixed(2)}</span>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      (៛{changeKHR.toLocaleString()})
                    </span>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'qr' && (
              <div className="p-5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex flex-col items-center text-center space-y-3">
                <div className="w-36 h-36 bg-white p-2 rounded-2xl shadow-md border flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=KHQR://nexusstore.io/checkout?amount=${grandTotal}&currency=USD`}
                    alt="KHQR Dynamic Payment"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-xs font-black uppercase text-purple-900 dark:text-purple-200 tracking-wider">
                    Scan with ABA, Bakong, or KHQR App
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Amount: ${grandTotal.toFixed(2)} / ៛{grandTotalKHR.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-2">
                <CreditCard className="w-10 h-10 text-purple-600 animate-pulse" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Ready for Contactless / Chip Card Tap
                </p>
                <p className="text-[11px] text-slate-400">
                  Visa, Mastercard, UnionPay, or Apple Pay terminal connected.
                </p>
              </div>
            )}

            {/* Confirm Payment button */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                Back to Cart
              </button>
              <button
                disabled={processingSale}
                onClick={handleCompleteSale}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/30 flex items-center justify-center gap-1.5 transition-all"
              >
                {processingSale ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Confirm & Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED RECEIPT MODAL */}
      <ReceiptModal
        order={completedOrder}
        onClose={() => setCompletedOrder(null)}
      />
    </div>
  );
};
