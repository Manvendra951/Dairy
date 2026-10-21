import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Users,
  Tag,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertTriangle,
  ArrowRight,
  LogOut,
  Eye,
  EyeOff,
  Printer,
  Download,
  Search,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Shield,
  ShieldCheck,
  Phone,
  MapPin,
  Clock,
  Key,
  X,
  FileText,
  AlertCircle,
  Mail,
  Lock,
  Building2,
  CreditCard,
  Banknote,
  QrCode,
  Globe,
  Calendar,
  DollarSign,
  MessageCircle,
  ChevronRight,
  CheckCircle,
  Wallet,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { formatCurrency } from '../utils/pricing.ts';
import { downloadInvoicePDF, downloadOrderDetailsPDF } from '../utils/pdfGenerator.ts';
import type {
  Category,
  Coupon,
  CustomerSummary,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
  ProductVariant,
  StoreSettings,
} from '../types/dairy.js';

type AdminTab =
  | 'overview'
  | 'products'
  | 'orders'
  | 'categories'
  | 'customers'
  | 'offers'
  | 'settings'
  | 'clean_start';

export default function AdminDashboard() {
  const {
    settings,
    products,
    categories,
    orders,
    coupons,
    adminToken,
    adminUser,
    adminLogin,
    adminLogout,
    recordOrderPayment,
    updateOrderPaymentStatus,
    saveCustomerNote,
    setActiveView,
    updateStoreSettings,
    createProduct,
    updateProduct,
    deleteProduct,
    createCategory,
    updateCategory,
    deleteCategory,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    updateOrderStatus,
    updateOrderNotes,
    resetDemoData,
    refreshAllData,
  } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  
  // Administrator Sign-in State
  const [loginEmail, setLoginEmail] = useState(settings.adminEmail || 'admin@puredropdairy.com');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Search & Filter state for Orders
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderPaymentModeFilter, setOrderPaymentModeFilter] = useState('all');
  const [orderPaymentStatusFilter, setOrderPaymentStatusFilter] = useState('all');
  const [orderDateFilter, setOrderDateFilter] = useState('all');

  // Search & Filter state for Products & Customers
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSort, setCustomerSort] = useState<'recent' | 'spent' | 'orders' | 'name'>('recent');

  // Modals inside Admin
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<CustomerSummary | null>(null);
  const [recordingPaymentOrder, setRecordingPaymentOrder] = useState<Order | null>(null);
  const [deleteProductConfirmId, setDeleteProductConfirmId] = useState<string | null>(null);
  const [deleteCategoryConfirmId, setDeleteCategoryConfirmId] = useState<string | null>(null);

  // Settings local state
  const [settingsForm, setSettingsForm] = useState<StoreSettings>({ ...settings });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    setSettingsForm({ ...settings });
  }, [settings]);

  // Registered customers loaded from server database
  const [dbCustomers, setDbCustomers] = useState<CustomerSummary[]>([]);

  useEffect(() => {
    if (adminToken) {
      fetch('/api/customers')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setDbCustomers(data);
        })
        .catch(console.error);
    }
  }, [adminToken, orders]);

  // Admin password change inside settings
  const [currentAdminPassword, setCurrentAdminPassword] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [passwordChangeMsg, setPasswordChangeMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Feedback toast banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Clean Start / Fresh Reset State
  const [cleanPreview, setCleanPreview] = useState<{
    customersCount: number;
    ordersCount: number;
    customerNotesCount: number;
    intact: {
      productsCount: number;
      categoriesCount: number;
      couponsCount: number;
      settingsPreserved: boolean;
      adminAccessPreserved: boolean;
      codConfigured: boolean;
    };
  } | null>(null);
  const [cleanConfirmPhrase, setCleanConfirmPhrase] = useState('');
  const [isCleaningData, setIsCleaningData] = useState(false);
  const [cleanResult, setCleanResult] = useState<{
    message: string;
    backupFileName: string;
    cleared: { customers: number; orders: number };
    preserved: any;
  } | null>(null);
  const [cleanError, setCleanError] = useState<string | null>(null);
  const [isLoadingCleanPreview, setIsLoadingCleanPreview] = useState(false);

  const fetchCleanPreview = async () => {
    if (!adminToken) return;
    setIsLoadingCleanPreview(true);
    setCleanError(null);
    try {
      const res = await fetch('/api/admin/clean-start/preview', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCleanPreview(data);
      } else {
        const err = await res.json();
        setCleanError(err.error || 'Failed to inspect database records');
      }
    } catch {
      setCleanError('Network error checking database');
    } finally {
      setIsLoadingCleanPreview(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'clean_start' && adminToken) {
      fetchCleanPreview();
    }
  }, [activeTab, adminToken]);

  const handleExportBackup = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/clean-start/export', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `puredrop-customer-orders-backup-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast('Backup exported and downloaded successfully!');
      } else {
        showToast('Failed to export backup data.');
      }
    } catch {
      showToast('Network error during backup export.');
    }
  };

  const handleExecuteCleanStart = async () => {
    if (cleanConfirmPhrase !== 'CONFIRM') {
      setCleanError('Please type CONFIRM in capital letters to authorize reset.');
      return;
    }
    setIsCleaningData(true);
    setCleanError(null);
    try {
      const res = await fetch('/api/admin/clean-start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ confirmPhrase: 'CONFIRM' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCleanResult(data);
        setCleanConfirmPhrase('');
        setDbCustomers([]);
        await refreshAllData();
        showToast('Clean start completed: customer & order database reset successfully!');
        fetchCleanPreview();
      } else {
        setCleanError(data.error || 'Clean start execution failed.');
      }
    } catch {
      setCleanError('Network error executing clean start.');
    } finally {
      setIsCleaningData(false);
    }
  };

  // Auth check
  const isAuthenticated = !!adminToken;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Please enter both administrator email and password.');
      return;
    }
    setIsLoggingIn(true);
    const result = await adminLogin(loginEmail.trim(), loginPassword.trim());
    setIsLoggingIn(false);
    if (!result.success) {
      setLoginError(result.error || 'Invalid administrator email or password.');
    }
  };

  // If not logged in, show secure administrator login portal
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAFCF7] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-xl border border-[#DCE9D5] space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#397548] to-[#69766B] text-white flex items-center justify-center mx-auto text-3xl shadow-lg shadow-[#397548]/20">
              🥛
            </div>
            <h1 className="text-2xl font-bold text-[#26352B] font-serif-accent">
              Dairy Business Admin
            </h1>
            <p className="text-xs text-[#69766B]">
              Authorized back office for {settings.brandName} dispatch & accounts
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-[#26352B] block">
                Administrator Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="admin@puredropdairy.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-xs text-[#26352B]"
                />
                <Mail className="w-4 h-4 text-[#69766B] absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-[#26352B] block">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter administrator password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-xs text-[#26352B]"
                />
                <Lock className="w-4 h-4 text-[#69766B] absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#69766B] hover:text-[#26352B] cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-[#397548] text-white rounded-xl font-bold text-xs hover:bg-[#2E5E3A] shadow-md shadow-[#397548]/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Sign In to Admin Portal</span>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-[#DCE9D5] text-center">
            <button
              type="button"
              onClick={() => setActiveView('store')}
              className="text-xs text-[#69766B] hover:text-[#26352B] font-semibold py-1 cursor-pointer transition-colors"
            >
              ← Return to Customer Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin KPIs
  const totalSales = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((acc, o) => acc + o.total, 0);

  const todayOrders = orders.filter(
    o => new Date(o.createdAt).toDateString() === new Date().toDateString()
  );
  const todaySales = todayOrders
    .filter(o => o.status !== 'Cancelled')
    .reduce((acc, o) => acc + o.total, 0);

  const pendingOrders = orders.filter(
    o => o.status === 'New Order' || o.status === 'Confirmed' || o.status === 'Preparing'
  );

  const lowStockProducts = products.filter(
    p => !p.isMadeToOrder && p.stockQuantity <= 5
  );

  // Filtered orders for table with Payment Mode, Payment Status, Order Status, Date, and Reference Search
  const filteredOrders = orders.filter(o => {
    const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    const matchesMode = orderPaymentModeFilter === 'all' || o.paymentMethod === orderPaymentModeFilter;
    const matchesPaymentStatus = orderPaymentStatusFilter === 'all' || o.paymentStatus === orderPaymentStatusFilter;

    let matchesDate = true;
    if (orderDateFilter !== 'all') {
      const orderDate = new Date(o.createdAt);
      const now = new Date();
      if (orderDateFilter === 'today') {
        matchesDate = orderDate.toDateString() === now.toDateString();
      } else if (orderDateFilter === 'yesterday') {
        const yest = new Date(now);
        yest.setDate(yest.getDate() - 1);
        matchesDate = orderDate.toDateString() === yest.toDateString();
      } else if (orderDateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = orderDate >= weekAgo;
      } else if (orderDateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = orderDate >= monthAgo;
      }
    }

    const q = orderSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customer.name.toLowerCase().includes(q) ||
      o.customer.phone.includes(q) ||
      (Boolean(o.transactionId) && String(o.transactionId).toLowerCase().includes(q));

    return matchesStatus && matchesMode && matchesPaymentStatus && matchesDate && matchesSearch;
  });

  // Filtered products for products table
  const filteredProducts = products.filter(p => {
    const matchesCat = productCategoryFilter === 'all' || p.categoryId === productCategoryFilter;
    const q = productSearch.toLowerCase().trim();
    const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.unit.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  // Unique customers directory with rich address & complete order history
  const customerMap = new Map<string, CustomerSummary>();

  // 1. Seed with registered customer accounts from server
  for (const regCust of dbCustomers) {
    customerMap.set(regCust.phone, {
      id: regCust.id,
      phone: regCust.phone,
      name: regCust.name,
      email: regCust.email,
      alternatePhone: regCust.alternatePhone,
      registrationDate: regCust.registrationDate,
      orderCount: 0,
      totalSpent: 0,
      lastOrderDate: regCust.registrationDate || new Date().toISOString(),
      addresses: [...(regCust.addresses || [])],
      notes: regCust.notes || '',
      orders: [],
    });
  }

  // 2. Correlate with all orders
  for (const o of orders) {
    let customerKey = o.customer.phone;

    // Check if matching customer exists by ID or email
    if (!customerMap.has(customerKey)) {
      for (const [key, existing] of customerMap.entries()) {
        if (
          (o.customerId && existing.id === o.customerId) ||
          (existing.email && o.customer.email && existing.email.toLowerCase() === o.customer.email.toLowerCase())
        ) {
          customerKey = key;
          break;
        }
      }
    }

    if (!customerMap.has(customerKey)) {
      customerMap.set(customerKey, {
        id: o.customerId,
        phone: o.customer.phone,
        name: o.customer.name,
        email: o.customer.email,
        orderCount: 0,
        totalSpent: 0,
        lastOrderDate: o.createdAt,
        addresses: [o.customer.address],
        notes: '',
        orders: [],
      });
    }

    const c = customerMap.get(customerKey)!;
    if (!c.orders) c.orders = [];
    if (!c.orders.some(existing => existing.id === o.id || existing.orderNumber === o.orderNumber)) {
      c.orders.push(o);
    }
    if (!c.email && o.customer.email) c.email = o.customer.email;
    if (!c.addresses.includes(o.customer.address)) {
      c.addresses.push(o.customer.address);
    }
  }

  // 3. Finalize ordering & accurate totals for every customer
  for (const c of customerMap.values()) {
    c.orders = (c.orders || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    c.orderCount = c.orders.length;
    c.totalSpent = c.orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.total, 0);
    if (c.orders.length > 0) {
      c.lastOrderDate = c.orders[0].createdAt;
      c.name = c.orders[0].customer.name || c.name;
    }
  }

  const customerList = Array.from(customerMap.values())
    .filter(c =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch) ||
      (c.email && c.email.toLowerCase().includes(customerSearch.toLowerCase())) ||
      c.addresses.some(a => a.toLowerCase().includes(customerSearch.toLowerCase()))
    )
    .sort((a, b) => {
      if (customerSort === 'recent') {
        return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
      }
      if (customerSort === 'spent') {
        return b.totalSpent - a.totalSpent;
      }
      if (customerSort === 'orders') {
        return b.orderCount - a.orderCount;
      }
      if (customerSort === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    const ok = await updateStoreSettings(settingsForm);
    setSettingsSaving(false);
    if (ok) {
      setSettingsSaved(true);
      showToast('Payment methods & store settings saved successfully! Live checkout is updated.');
      setTimeout(() => setSettingsSaved(false), 3000);
    } else {
      showToast('Failed to save settings. Please verify you are logged in as an authorized administrator.');
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Reset sample catalog, categories, orders and settings to defaults?')) {
      await resetDemoData();
      showToast('Sample dairy data restored successfully!');
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Delivered':
        return 'bg-[#DCE9D5] text-[#26352B] border border-[#69766B] font-bold';
      case 'Out for Delivery':
        return 'bg-[#FAFCF7] text-[#397548] border border-[#397548] font-bold animate-pulse';
      case 'Preparing':
        return 'bg-[#FAFCF7] text-[#397548] border border-[#DCE9D5] font-semibold';
      case 'Confirmed':
        return 'bg-[#DCE9D5] text-[#26352B] border border-[#397548] font-bold';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-800 border border-rose-200 font-bold';
      default:
        return 'bg-[#FAFCF7] text-[#69766B] border border-[#DCE9D5] font-semibold';
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFCF7] flex flex-col">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#397548] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold border border-[#DCE9D5] animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-[#397548]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Topbar */}
      <header className="bg-white border-b border-[#DCE9D5] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#397548] to-[#69766B] text-white flex items-center justify-center font-bold shadow-xs">
              🥛
            </div>
            <div>
              <span className="font-bold text-[#26352B] text-sm md:text-base flex items-center gap-2">
                {settings.brandName} Control Center
                <span className="text-[10px] bg-[#FAFCF7] text-[#397548] border border-[#397548] px-2 py-0.5 rounded-full font-bold">
                  {settings.isStoreOpen ? 'STORE OPEN' : 'STORE PAUSED'}
                </span>
              </span>
              <p className="text-[11px] text-[#69766B]">Non-Technical Dairy Business Management</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('store')}
              className="px-3 py-1.5 rounded-xl border border-[#DCE9D5] hover:bg-[#FAFCF7] text-xs font-semibold text-[#26352B] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#69766B]" />
              <span>View Live Store</span>
            </button>
            <button
              onClick={adminLogout}
              className="p-2 text-[#69766B] hover:text-rose-600 rounded-xl hover:bg-[#FAFCF7] cursor-pointer transition-colors"
              title="Logout from Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto text-xs font-bold text-[#69766B] border-t border-[#DCE9D5]">
          {[
            { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'products', label: `Products (${products.length})`, icon: Package },
            { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
            { id: 'categories', label: `Categories (${categories.length})`, icon: FolderTree },
            { id: 'customers', label: `Customers (${customerList.length})`, icon: Users },
            { id: 'offers', label: `Coupons (${coupons.length})`, icon: Tag },
            { id: 'settings', label: 'Website Settings', icon: Settings },
            { id: 'clean_start', label: 'Clean Start (Reset)', icon: RefreshCw },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`py-3 px-3.5 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'border-[#397548] text-[#397548] font-extrabold bg-[#FAFCF7]/40'
                    : 'border-transparent hover:text-[#26352B] hover:border-[#DCE9D5]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Admin Tab Area */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-2xl border border-[#DCE9D5] shadow-xs">
                <span className="text-[10px] font-bold text-[#69766B] uppercase tracking-wider block">
                  Today's Orders
                </span>
                <p className="text-2xl font-black text-[#26352B] mt-1">{todayOrders.length}</p>
                <span className="text-[11px] text-[#397548] font-semibold">Morning delivery batch</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#DCE9D5] shadow-xs">
                <span className="text-[10px] font-bold text-[#69766B] uppercase tracking-wider block">
                  Today's Revenue
                </span>
                <p className="text-2xl font-black text-[#397548] mt-1">
                  {formatCurrency(todaySales, settings.currencySymbol)}
                </p>
                <span className="text-[11px] text-[#69766B]">Total: {formatCurrency(totalSales, settings.currencySymbol)}</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#DCE9D5] shadow-xs">
                <span className="text-[10px] font-bold text-[#69766B] uppercase tracking-wider block">
                  Pending Orders
                </span>
                <p className="text-2xl font-black text-amber-700 mt-1">{pendingOrders.length}</p>
                <span className="text-[11px] text-[#69766B]">Requires dispatch</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#DCE9D5] shadow-xs">
                <span className="text-[10px] font-bold text-[#69766B] uppercase tracking-wider block">
                  Total Products
                </span>
                <p className="text-2xl font-black text-[#26352B] mt-1">{products.length}</p>
                <span className="text-[11px] text-[#69766B]">In {categories.length} categories</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#DCE9D5] shadow-xs">
                <span className="text-[10px] font-bold text-[#69766B] uppercase tracking-wider block">
                  Low-Stock Alerts
                </span>
                <p className={`text-2xl font-black mt-1 ${lowStockProducts.length > 0 ? 'text-rose-600' : 'text-[#26352B]'}`}>
                  {lowStockProducts.length}
                </p>
                <span className="text-[11px] text-[#69766B]">Products &lt;= 5 units</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#DCE9D5] shadow-xs">
                <span className="text-[10px] font-bold text-[#69766B] uppercase tracking-wider block">
                  Customers
                </span>
                <p className="text-2xl font-black text-[#26352B] mt-1">{customerList.length}</p>
                <span className="text-[11px] text-[#69766B]">Active buyers</span>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#DCE9D5] flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <span className="text-xs font-bold text-[#26352B] uppercase tracking-wider">
                Quick Action Shortcuts
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setEditingProduct({
                      name: '',
                      categoryId: categories[0]?.id || 'cat-milk',
                      price: 80,
                      unit: '1 Litre',
                      description: '',
                      stockQuantity: 25,
                      images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80'],
                      isPublished: true,
                      isFeatured: false,
                      isMadeToOrder: false,
                      variants: [],
                    });
                    setIsProductModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#397548] text-white text-xs font-bold hover:bg-[#2E5E3A] flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Product</span>
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="px-3.5 py-2 rounded-xl bg-[#FAFCF7] hover:bg-[#DCE9D5] text-[#26352B] border border-[#DCE9D5] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-[#397548]" />
                  <span>Manage Orders</span>
                </button>
                <button
                  onClick={() => setActiveTab('categories')}
                  className="px-3.5 py-2 rounded-xl bg-[#FAFCF7] hover:bg-[#DCE9D5] text-[#26352B] border border-[#DCE9D5] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <FolderTree className="w-3.5 h-3.5 text-[#397548]" />
                  <span>Manage Categories</span>
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="px-3.5 py-2 rounded-xl bg-[#FAFCF7] hover:bg-[#DCE9D5] text-[#26352B] border border-[#DCE9D5] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-[#397548]" />
                  <span>Edit Website Settings</span>
                </button>
                <button
                  onClick={handleResetData}
                  className="px-3 py-2 rounded-xl border border-[#DCE9D5] text-[#69766B] hover:text-[#26352B] hover:bg-[#FAFCF7] text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Reload default sample data"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Demo Data</span>
                </button>
              </div>
            </div>

            {/* Recent Orders Preview */}
            <div className="bg-white rounded-2xl border border-[#DCE9D5] overflow-hidden shadow-xs">
              <div className="p-4 border-b border-[#DCE9D5] flex items-center justify-between bg-[#FAFCF7]/40">
                <div>
                  <h3 className="font-bold text-[#26352B] text-sm font-serif-accent">Recent Customer Orders</h3>
                  <p className="text-xs text-[#69766B]">Live feed from doorstep checkout</p>
                </div>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-[#397548] hover:underline cursor-pointer"
                >
                  View All ({orders.length}) →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFCF7] border-b border-[#DCE9D5] text-[#69766B] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE9D5] text-[#69766B]">
                    {orders.slice(0, 5).map(o => (
                      <tr key={o.id} className="hover:bg-[#FAFCF7]/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-[#26352B]">#{o.orderNumber}</td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-[#26352B]">{o.customer.name}</p>
                          <p className="text-[#69766B] text-[11px]">{o.customer.phone}</p>
                        </td>
                        <td className="py-3 px-4 text-[#69766B]">
                          {o.items.map(it => `${it.name} (${it.quantity})`).join(', ')}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#397548]">
                          {formatCurrency(o.total, settings.currencySymbol)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="uppercase font-semibold text-[10px] bg-[#FAFCF7] border border-[#DCE9D5] text-[#26352B] px-2 py-0.5 rounded">
                            {o.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${getStatusBadge(o.status)}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => downloadInvoicePDF(o, settings)}
                              className="p-1.5 text-[#69766B] hover:text-[#397548] rounded-lg hover:bg-[#FAFCF7] cursor-pointer"
                              title="Download PDF Invoice"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setViewingOrder(o)}
                              className="p-1.5 text-[#69766B] hover:text-[#397548] rounded-lg hover:bg-[#FAFCF7] cursor-pointer"
                              title="View Order Details & Packing Slip"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS MANAGEMENT TAB */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#26352B] font-serif-accent">Product Catalog Management</h2>
                <p className="text-xs text-[#69766B]">
                  Add, edit, adjust prices, or mark products out of stock without editing code
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <input
                    type="text"
                    placeholder="Search product..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#DCE9D5] rounded-xl outline-hidden text-[#26352B]"
                  />
                  <Search className="w-3.5 h-3.5 text-[#69766B] absolute left-2.5 top-2.5" />
                </div>

                <select
                  value={productCategoryFilter}
                  onChange={e => setProductCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-[#DCE9D5] rounded-xl text-xs font-medium outline-hidden text-[#26352B]"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    setEditingProduct({
                      name: '',
                      categoryId: categories[0]?.id || 'cat-milk',
                      price: 80,
                      unit: '1 Litre',
                      description: '',
                      stockQuantity: 25,
                      images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80'],
                      isPublished: true,
                      isFeatured: false,
                      isMadeToOrder: false,
                      variants: [],
                    });
                    setIsProductModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#397548] text-white rounded-xl text-xs font-bold hover:bg-[#2E5E3A] shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-[#DCE9D5] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFCF7] border-b border-[#DCE9D5] text-[#69766B] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4">Variants</th>
                      <th className="py-3 px-4">Featured</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE9D5] text-[#69766B]">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-[#69766B]">
                          No products found matching filters.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map(p => {
                        const cat = categories.find(c => c.id === p.categoryId);
                        return (
                          <tr key={p.id} className="hover:bg-[#FAFCF7]/60">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={p.images[0]}
                                  alt={p.name}
                                  className="w-10 h-10 rounded-lg object-cover border border-[#DCE9D5]"
                                />
                                <div>
                                  <p className="font-bold text-[#26352B]">{p.name}</p>
                                  <p className="text-[11px] text-[#69766B]">{p.unit}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[#26352B] font-medium">{cat?.name || p.categoryId}</td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-[#397548]">
                                {formatCurrency(p.salePrice || p.price, settings.currencySymbol)}
                              </p>
                              {p.salePrice && (
                                <p className="text-[10px] text-stone-400 line-through">
                                  {formatCurrency(p.price, settings.currencySymbol)}
                                </p>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {p.isMadeToOrder ? (
                                <span className="text-[#397548] font-semibold">Made to order</span>
                              ) : p.stockQuantity <= 5 ? (
                                <span className="text-rose-600 font-bold">
                                  Low ({p.stockQuantity})
                                </span>
                              ) : (
                                <span>{p.stockQuantity} in stock</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[#69766B]">
                              {p.variants.length > 0 ? `${p.variants.length} sizes` : 'Single'}
                            </td>
                            <td className="py-3 px-4">
                              {p.isFeatured ? (
                                <span className="text-[#397548] font-bold">★ Yes</span>
                              ) : (
                                <span className="text-stone-400">No</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={async () => {
                                  await updateProduct(p.id, { isPublished: !p.isPublished });
                                  showToast(`${p.name} set to ${!p.isPublished ? 'Published' : 'Draft'}`);
                                }}
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer border transition-colors ${
                                  p.isPublished
                                    ? 'bg-[#FAFCF7] text-[#397548] border-[#397548]'
                                    : 'bg-stone-100 text-stone-500 border-stone-200'
                                }`}
                              >
                                {p.isPublished ? 'Published' : 'Draft'}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    setEditingProduct({ ...p });
                                    setIsProductModalOpen(true);
                                  }}
                                  className="p-1.5 text-[#69766B] hover:text-[#397548] rounded-lg hover:bg-[#FAFCF7] cursor-pointer"
                                  title="Edit Product"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteProductConfirmId(p.id)}
                                  className="p-1.5 text-[#69766B] hover:text-rose-600 rounded-lg hover:bg-[#FAFCF7] cursor-pointer"
                                  title="Delete Product"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ORDERS MANAGEMENT TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h2 className="text-lg font-bold text-[#26352B] font-serif-accent">Customer Orders & Deliveries</h2>
                  <p className="text-xs text-[#69766B]">
                    Track payment modes, record collections, download PDF invoices, and manage dispatch statuses
                  </p>
                </div>
                <div className="text-xs font-semibold text-[#69766B]">
                  Showing <strong className="text-[#26352B]">{filteredOrders.length}</strong> of {orders.length} orders
                </div>
              </div>

              {/* Comprehensive Search & Multi-filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 bg-white p-3.5 rounded-2xl border border-[#DCE9D5] shadow-xs">
                {/* Search */}
                <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
                  <input
                    type="text"
                    placeholder="Search order #, customer, phone, UTR..."
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAFCF7] border border-[#DCE9D5] rounded-xl outline-hidden text-[#26352B] focus:bg-white focus:border-[#397548]"
                  />
                  <Search className="w-3.5 h-3.5 text-[#69766B] absolute left-2.5 top-2.5" />
                </div>

                {/* Payment Mode Filter */}
                <div>
                  <select
                    value={orderPaymentModeFilter}
                    onChange={e => setOrderPaymentModeFilter(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#FAFCF7] border border-[#DCE9D5] rounded-xl text-xs font-medium outline-hidden text-[#26352B] focus:bg-white focus:border-[#397548] cursor-pointer"
                  >
                    <option value="all">All Payment Modes</option>
                    <option value="cod">Cash on Delivery (COD)</option>
                    <option value="upi">UPI</option>
                    <option value="qr_code">QR Code Payment</option>
                    <option value="net_banking">Net Banking</option>
                    <option value="bank_transfer">Direct Bank Transfer</option>
                    <option value="gateway">Online Payment Gateway</option>
                  </select>
                </div>

                {/* Payment Status Filter */}
                <div>
                  <select
                    value={orderPaymentStatusFilter}
                    onChange={e => setOrderPaymentStatusFilter(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#FAFCF7] border border-[#DCE9D5] rounded-xl text-xs font-medium outline-hidden text-[#26352B] focus:bg-white focus:border-[#397548] cursor-pointer"
                  >
                    <option value="all">All Payment Statuses</option>
                    <option value="pending">Pending (Unpaid)</option>
                    <option value="paid">Paid (Confirmed)</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="refunded">Refunded</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Order Status Filter */}
                <div>
                  <select
                    value={orderStatusFilter}
                    onChange={e => setOrderStatusFilter(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#FAFCF7] border border-[#DCE9D5] rounded-xl text-xs font-medium outline-hidden text-[#26352B] focus:bg-white focus:border-[#397548] cursor-pointer"
                  >
                    <option value="all">All Order Statuses</option>
                    <option value="New Order">New Order</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Order Date Filter */}
                <div>
                  <select
                    value={orderDateFilter}
                    onChange={e => setOrderDateFilter(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#FAFCF7] border border-[#DCE9D5] rounded-xl text-xs font-medium outline-hidden text-[#26352B] focus:bg-white focus:border-[#397548] cursor-pointer"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today's Orders</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">Past 7 Days</option>
                    <option value="month">Past 30 Days</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-[#DCE9D5] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFCF7] border-b border-[#DCE9D5] text-[#69766B] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Date & Slot</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Payment Mode</th>
                      <th className="py-3 px-4">Payment Status</th>
                      <th className="py-3 px-4">Total / Balance</th>
                      <th className="py-3 px-4">Order Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE9D5] text-[#69766B]">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-[#69766B]">
                          <p className="font-semibold text-sm">No matching orders found</p>
                          <p className="text-[11px] mt-1">Try clearing filters or search terms</p>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map(o => {
                        const remBal = typeof o.remainingBalance === 'number'
                          ? o.remainingBalance
                          : (o.paymentStatus === 'paid' ? 0 : o.total);

                        const formatMode = (m: string) => {
                          if (m === 'cod') return 'Cash on Delivery';
                          if (m === 'upi') return 'UPI / QR';
                          if (m === 'bank_transfer') return 'Bank Transfer';
                          if (m === 'gateway' || m === 'card') return 'Online Payment';
                          return 'Other';
                        };

                        return (
                          <tr key={o.id} className="hover:bg-[#FAFCF7]/60 transition-colors">
                            <td className="py-3 px-4 font-extrabold text-[#26352B] whitespace-nowrap">
                              #{o.orderNumber}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-semibold text-[#26352B]">
                                {new Date(o.createdAt).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                              <p className="text-[10px] text-[#69766B] truncate max-w-[120px]">
                                {o.deliverySlot}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-semibold text-[#26352B]">{o.customer.name}</p>
                              <p className="text-[#69766B] text-[11px]">+91 {o.customer.phone}</p>
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <span className="font-semibold text-[#26352B] block whitespace-nowrap">
                                  {formatMode(o.paymentMethod)}
                                </span>
                                {o.transactionId && (
                                  <span className="text-[10px] font-mono text-[#397548] bg-[#FAFCF7] border border-[#DCE9D5] px-1.5 py-0.2 rounded inline-block truncate max-w-[130px]" title={`Ref: ${o.transactionId}`}>
                                    Ref: {o.transactionId}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                  o.paymentStatus === 'paid'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : o.paymentStatus === 'partially_paid'
                                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                                    : o.paymentStatus === 'refunded'
                                    ? 'bg-stone-100 text-stone-600 border-stone-200'
                                    : o.paymentStatus === 'failed'
                                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                                    : 'bg-[#FAFCF7] text-[#397548] border-[#397548]'
                                }`}
                              >
                                {o.paymentStatus === 'paid'
                                  ? 'PAID'
                                  : o.paymentStatus === 'partially_paid'
                                  ? 'PARTIAL'
                                  : o.paymentStatus === 'refunded'
                                  ? 'REFUNDED'
                                  : o.paymentStatus === 'failed'
                                  ? 'FAILED'
                                  : 'PENDING'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-[#397548]">
                                {formatCurrency(o.total, settings.currencySymbol)}
                              </p>
                              {remBal > 0 && o.paymentStatus !== 'paid' && (
                                <p className="text-[10px] font-bold text-amber-700">
                                  Due: {formatCurrency(remBal, settings.currencySymbol)}
                                </p>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={o.status}
                                onChange={async e => {
                                  const target = e.target.value as OrderStatus;
                                  try {
                                    await updateOrderStatus(o.id, target);
                                    showToast(`Order #${o.orderNumber} status changed to ${target}`);
                                  } catch (err: any) {
                                    showToast(err.message || 'Status transition not allowed');
                                  }
                                }}
                                className="px-2 py-1 rounded-lg border border-[#DCE9D5] bg-[#FAFCF7] text-[11px] font-bold text-[#26352B] outline-hidden cursor-pointer"
                              >
                                <option value="New Order">New Order</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Preparing">Preparing</option>
                                <option value="Out for Delivery">Out for Delivery</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {remBal > 0 && o.paymentStatus !== 'paid' && (
                                  <button
                                    onClick={() => setRecordingPaymentOrder(o)}
                                    className="p-1.5 text-emerald-700 hover:text-emerald-900 rounded-lg hover:bg-emerald-50 cursor-pointer transition-colors"
                                    title="Record payment collection"
                                  >
                                    <DollarSign className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => downloadInvoicePDF(o, settings)}
                                  className="p-1.5 text-[#69766B] hover:text-[#397548] rounded-lg hover:bg-[#FAFCF7] cursor-pointer transition-colors"
                                  title="Download PDF Invoice"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setViewingOrder(o)}
                                  className="p-1.5 text-[#69766B] hover:text-[#397548] rounded-lg hover:bg-[#FAFCF7] cursor-pointer transition-colors"
                                  title="View Details, Payment Info & Packing Slip"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CATEGORIES MANAGEMENT TAB */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-[#26352B] font-serif-accent">Product Categories</h2>
                <p className="text-xs text-[#69766B]">
                  Organize dairy sections on the customer homepage & catalog
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingCategory({
                    name: '',
                    description: '',
                    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
                    isVisible: true,
                    displayOrder: categories.length + 1,
                  });
                  setIsCategoryModalOpen(true);
                }}
                className="px-4 py-2 bg-[#397548] text-white rounded-xl text-xs font-bold hover:bg-[#2E5E3A] flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map(cat => (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl border border-[#DCE9D5] overflow-hidden shadow-xs p-3.5 space-y-3"
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-28 rounded-xl object-cover border border-[#DCE9D5]"
                  />
                  <div>
                    <h3 className="font-bold text-[#26352B] text-sm">{cat.name}</h3>
                    <p className="text-xs text-[#69766B] line-clamp-2 mt-0.5">{cat.description}</p>
                  </div>
                  <div className="pt-2 border-t border-[#DCE9D5] flex items-center justify-between text-xs">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        cat.isVisible ? 'bg-[#FAFCF7] text-[#397548] border-[#397548]' : 'bg-stone-100 text-stone-500 border-stone-200'
                      }`}
                    >
                      {cat.isVisible ? 'Visible' : 'Hidden'}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setIsCategoryModalOpen(true);
                        }}
                        className="p-1.5 text-[#69766B] hover:text-[#397548] rounded-lg hover:bg-[#FAFCF7] cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteCategoryConfirmId(cat.id)}
                        className="p-1.5 text-[#69766B] hover:text-rose-600 rounded-lg hover:bg-[#FAFCF7] cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CUSTOMERS MANAGEMENT TAB */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#26352B] font-serif-accent">Customer Directory</h2>
                <p className="text-xs text-[#69766B]">
                  Verified household directory, delivery addresses, lifetime value, and order history
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <input
                    type="text"
                    placeholder="Search name, phone, email, address..."
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#DCE9D5] rounded-xl outline-hidden text-[#26352B] focus:border-[#397548]"
                  />
                  <Search className="w-3.5 h-3.5 text-[#69766B] absolute left-2.5 top-2.5" />
                </div>

                <select
                  value={customerSort}
                  onChange={e => setCustomerSort(e.target.value as any)}
                  className="px-3 py-1.5 bg-white border border-[#DCE9D5] rounded-xl text-xs font-medium outline-hidden text-[#26352B] cursor-pointer"
                >
                  <option value="recent">Sort: Most Recent Order</option>
                  <option value="spent">Sort: Highest Spending</option>
                  <option value="orders">Sort: Most Orders</option>
                  <option value="name">Sort: Name (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Customer Directory KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-[#DCE9D5]">
                <span className="text-[10px] font-bold text-[#69766B] uppercase tracking-wider block">
                  Total Customers
                </span>
                <p className="text-xl font-black text-[#26352B] mt-0.5">{customerList.length}</p>
                <span className="text-[11px] text-[#397548]">Unique households</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#DCE9D5]">
                <span className="text-[10px] font-bold text-[#69766B] uppercase tracking-wider block">
                  Repeat Subscribers
                </span>
                <p className="text-xl font-black text-[#397548] mt-0.5">
                  {customerList.filter(c => c.orderCount > 1).length}
                </p>
                <span className="text-[11px] text-[#69766B]">
                  {customerList.length > 0
                    ? `${Math.round((customerList.filter(c => c.orderCount > 1).length / customerList.length) * 100)}% retention`
                    : '0%'}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#DCE9D5]">
                <span className="text-[10px] font-bold text-[#69766B] uppercase tracking-wider block">
                  Total Customer Spend
                </span>
                <p className="text-xl font-black text-[#397548] mt-0.5">
                  {formatCurrency(
                    customerList.reduce((acc, c) => acc + c.totalSpent, 0),
                    settings.currencySymbol
                  )}
                </p>
                <span className="text-[11px] text-[#69766B]">All delivered orders</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#DCE9D5]">
                <span className="text-[10px] font-bold text-[#69766B] uppercase tracking-wider block">
                  Average Order Spend
                </span>
                <p className="text-xl font-black text-[#26352B] mt-0.5">
                  {customerList.length > 0
                    ? formatCurrency(
                        Math.round(
                          customerList.reduce((acc, c) => acc + c.totalSpent, 0) /
                            Math.max(1, customerList.reduce((acc, c) => acc + c.orderCount, 0))
                        ),
                        settings.currencySymbol
                      )
                    : '₹0'}
                </p>
                <span className="text-[11px] text-[#69766B]">Per doorstep dispatch</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#DCE9D5] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFCF7] border-b border-[#DCE9D5] text-[#69766B] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Orders</th>
                    <th className="py-3 px-4">Total Spending</th>
                    <th className="py-3 px-4">Last Order</th>
                    <th className="py-3 px-4">Delivery Area</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE9D5] text-[#69766B]">
                  {customerList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#69766B]">
                        <p className="font-semibold text-sm">No customers found</p>
                        <p className="text-[11px] mt-1">Try another search keyword</p>
                      </td>
                    </tr>
                  ) : (
                    customerList.map(c => (
                      <tr key={c.phone} className="hover:bg-[#FAFCF7]/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#DCE9D5] text-[#397548] flex items-center justify-center font-bold text-xs shrink-0">
                              {c.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-[#26352B]">{c.name}</p>
                              {c.email ? (
                                <p className="text-[10px] text-[#69766B]">{c.email}</p>
                              ) : (
                                <span className="text-[10px] text-stone-400">Doorstep Buyer</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#397548]">+91 {c.phone}</span>
                            <a
                              href={`https://wa.me/91${c.phone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`tel:+91${c.phone}`}
                              className="p-1 rounded text-[#69766B] hover:bg-[#FAFCF7] cursor-pointer"
                              title="Call Customer"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAFCF7] border border-[#DCE9D5] text-[#397548]">
                            {c.orderCount} order{c.orderCount !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-[#397548]">
                          {formatCurrency(c.totalSpent, settings.currencySymbol)}
                        </td>
                        <td className="py-3 px-4 text-[#69766B]">
                          {new Date(c.lastOrderDate).toLocaleDateString('en-IN', {
                            dateStyle: 'medium',
                          })}
                        </td>
                        <td className="py-3 px-4 text-[#69766B] max-w-[180px] truncate">
                          {c.addresses[0] || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setViewingCustomer(c)}
                            className="px-2.5 py-1.5 rounded-xl border border-[#DCE9D5] hover:border-[#397548] bg-white hover:bg-[#FAFCF7] text-[#397548] font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors ml-auto shadow-2xs"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>View Profile</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* OFFERS & COUPONS TAB */}
        {activeTab === 'offers' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-[#26352B] font-serif-accent">Promotions & Coupons</h2>
                <p className="text-xs text-[#69766B]">
                  Create discount codes with minimum order values & expiry dates
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingCoupon({
                    code: '',
                    discountType: 'percentage',
                    value: 10,
                    minOrderValue: 299,
                    expiryDate: '2028-12-31',
                    isActive: true,
                  });
                  setIsCouponModalOpen(true);
                }}
                className="px-4 py-2 bg-[#397548] text-white rounded-xl text-xs font-bold hover:bg-[#2E5E3A] flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create Coupon</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {coupons.length === 0 ? (
                <div className="col-span-3 bg-white p-8 rounded-2xl border border-[#DCE9D5] text-center text-[#69766B]">
                  No active coupons created yet. Click "Create Coupon" to add one.
                </div>
              ) : (
                coupons.map(cpn => (
                  <div
                    key={cpn.id}
                    className="bg-white rounded-2xl border border-[#DCE9D5] p-4 space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-black text-[#397548] bg-[#FAFCF7] border border-[#397548] px-2.5 py-1 rounded-lg">
                        {cpn.code}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          cpn.isActive
                            ? 'bg-[#FAFCF7] text-[#397548] border-[#397548]'
                            : 'bg-stone-100 text-stone-500 border-stone-200'
                        }`}
                      >
                        {cpn.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <p className="text-xs text-[#26352B] font-semibold">
                      {cpn.discountType === 'percentage' ? `${cpn.value}% Discount` : `Flat ₹${cpn.value} Off`}
                    </p>

                    <p className="text-[11px] text-[#69766B]">
                      Min Order: ₹{cpn.minOrderValue} • Expires: {cpn.expiryDate}
                    </p>

                    <div className="pt-2 border-t border-[#DCE9D5] flex justify-end gap-1">
                      <button
                        onClick={async () => {
                          await deleteCoupon(cpn.id);
                          showToast(`Coupon ${cpn.code} deleted`);
                        }}
                        className="text-[#69766B] hover:text-rose-600 p-1 cursor-pointer transition-colors"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* WEBSITE SETTINGS TAB */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-[#DCE9D5] p-6 space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#DCE9D5] pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#26352B] font-serif-accent">Website & Dairy Store Settings</h2>
                <p className="text-xs text-[#69766B]">
                  Update brand identity, depot details, delivery fees, and order acceptance
                </p>
              </div>

              <button
                type="submit"
                disabled={settingsSaving}
                className="px-6 py-2.5 rounded-xl bg-[#397548] text-white font-bold text-xs hover:bg-[#2E5E3A] shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{settingsSaving ? 'Saving...' : 'Save All Changes'}</span>
              </button>
            </div>

            {settingsSaved && (
              <div className="p-3 bg-[#FAFCF7] border border-[#397548] rounded-xl text-xs text-[#397548] font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#397548]" />
                <span>Settings saved successfully! Live storefront updated.</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Brand & Contact */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#69766B]">
                  Brand & Contact Information
                </h3>

                <div>
                  <label className="text-xs font-semibold text-[#26352B] block mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={settingsForm.brandName}
                    onChange={e => setSettingsForm({ ...settingsForm, brandName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#26352B] block mb-1">Tagline</label>
                  <input
                    type="text"
                    value={settingsForm.tagline}
                    onChange={e => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#26352B] block mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={settingsForm.phone}
                      onChange={e => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#26352B] block mb-1">Business Email</label>
                    <input
                      type="email"
                      value={settingsForm.email}
                      onChange={e => setSettingsForm({ ...settingsForm, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#26352B] block mb-1">Depot / Farm Center Address</label>
                  <textarea
                    rows={2}
                    value={settingsForm.address}
                    onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#26352B] block mb-1">Operating Hours Description</label>
                  <input
                    type="text"
                    value={settingsForm.operatingHours}
                    onChange={e => setSettingsForm({ ...settingsForm, operatingHours: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                  />
                </div>
              </div>

              {/* Delivery & Ordering Policy */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#69766B]">
                  Delivery Fees & Order Acceptance
                </h3>

                {/* Store Open/Close toggle */}
                <div className="p-3.5 bg-[#FAFCF7] rounded-xl border border-[#DCE9D5] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-[#26352B] block">Accepting Orders Online</span>
                    <span className="text-[11px] text-[#69766B]">
                      When turned off, customers see store pause notification
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsForm.isStoreOpen}
                    onChange={e => setSettingsForm({ ...settingsForm, isStoreOpen: e.target.checked })}
                    className="w-5 h-5 accent-[#397548] cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#26352B] block mb-1">Delivery Fee (₹)</label>
                    <input
                      type="number"
                      value={settingsForm.deliveryCharge}
                      onChange={e => setSettingsForm({ ...settingsForm, deliveryCharge: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#26352B] block mb-1">Free Delivery &gt; (₹)</label>
                    <input
                      type="number"
                      value={settingsForm.freeDeliveryThreshold}
                      onChange={e => setSettingsForm({ ...settingsForm, freeDeliveryThreshold: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#26352B] block mb-1">Min Order (₹)</label>
                    <input
                      type="number"
                      value={settingsForm.minOrderValue}
                      onChange={e => setSettingsForm({ ...settingsForm, minOrderValue: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#26352B] block mb-1">
                    Serviceable PIN Codes (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.serviceablePincodes?.join(', ') || ''}
                    onChange={e =>
                      setSettingsForm({
                        ...settingsForm,
                        serviceablePincodes: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                  />
                </div>

                {/* Announcement Bar */}
                <div>
                  <label className="text-xs font-semibold text-[#26352B] block mb-1">Top Announcement Bar Text</label>
                  <input
                    type="text"
                    value={settingsForm.announcement}
                    onChange={e => setSettingsForm({ ...settingsForm, announcement: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                  />
                </div>

                {/* Hero Headline */}
                <div>
                  <label className="text-xs font-semibold text-[#26352B] block mb-1">Homepage Hero Headline</label>
                  <input
                    type="text"
                    value={settingsForm.heroHeading}
                    onChange={e => setSettingsForm({ ...settingsForm, heroHeading: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                  />
                </div>
              </div>
            </div>

            {/* PAYMENT METHODS MANAGEMENT SECTION (ADMIN-CONTROLLED ACTIVATION) */}
            <div className="border-t border-[#DCE9D5] pt-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#26352B] font-serif-accent flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-[#397548]" />
                    <span>Payment Methods & Checkout Configuration</span>
                  </h3>
                  <p className="text-xs text-[#69766B] mt-0.5">
                    Activate or deactivate payment methods individually. Active methods become selectable on the customer checkout page.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-[#EAF4E5] px-3.5 py-1.5 rounded-xl border border-[#DCE9D5] self-start sm:self-auto">
                  <ShieldCheck className="w-4 h-4 text-[#397548]" />
                  <span className="text-[11px] font-bold text-[#397548]">
                    COD Always Active • Online Methods Configurable
                  </span>
                </div>
              </div>

              {/* 6 Configurable Payment Methods Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 1. Cash on Delivery (COD) */}
                <div className="p-5 rounded-2xl border-2 border-[#397548] bg-white shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#EAF4E5] text-[#397548] flex items-center justify-center font-bold">
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-sm text-[#26352B] block">Cash on Delivery (COD)</span>
                        <span className="text-[11px] text-[#397548] font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Always Active (Store Policy)</span>
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EAF4E5] text-[#397548] border border-[#DCE9D5]">
                      Active & Selectable
                    </span>
                  </div>

                  <p className="text-xs text-[#69766B] leading-relaxed">
                    Customers pay cash upon morning doorstep delivery. Orders are placed as <strong>Pending</strong> until cash collection is verified and recorded by store administrators.
                  </p>

                  <div className="pt-2 border-t border-[#DCE9D5]">
                    <label className="text-[11px] font-bold text-[#26352B] block mb-1">
                      Customer Checkout Message
                    </label>
                    <input
                      type="text"
                      value={settingsForm.codInstructions || ''}
                      onChange={e => setSettingsForm({ ...settingsForm, codInstructions: e.target.value })}
                      placeholder="Pay in cash when your order is delivered to your doorstep."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                    />
                  </div>
                </div>

                {/* 2. UPI (Unified Payments Interface) */}
                <div className={`p-5 rounded-2xl border transition-all space-y-3 ${
                  settingsForm.enableUPI
                    ? 'border-[#397548] bg-white shadow-xs'
                    : 'border-[#DCE9D5] bg-[#FAFCF7]/70'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        settingsForm.enableUPI ? 'bg-[#EAF4E5] text-[#397548]' : 'bg-stone-200 text-stone-500'
                      }`}>
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-sm text-[#26352B] block">UPI Payment</span>
                        <span className="text-[11px] text-[#69766B]">
                          Google Pay, PhonePe, Paytm, BHIM & UPI apps
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSettingsForm({ ...settingsForm, enableUPI: !settingsForm.enableUPI })}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        settingsForm.enableUPI
                          ? 'bg-[#397548] text-white shadow-xs hover:bg-[#2E5E3A]'
                          : 'bg-white text-stone-600 border border-[#DCE9D5] hover:bg-stone-100'
                      }`}
                    >
                      {settingsForm.enableUPI ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      <span>{settingsForm.enableUPI ? 'Enabled' : 'Disabled'}</span>
                    </button>
                  </div>

                  {settingsForm.enableUPI && !settingsForm.upiId?.trim() && (
                    <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span><strong>Configuration Warning:</strong> UPI ID is required. Please specify your business UPI ID below.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-[#26352B] block mb-1">
                        Merchant UPI ID / VPA *
                      </label>
                      <input
                        type="text"
                        value={settingsForm.upiId || ''}
                        onChange={e => setSettingsForm({ ...settingsForm, upiId: e.target.value })}
                        placeholder="puredropdairy@icici"
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#26352B] block mb-1">
                        Payee Name
                      </label>
                      <input
                        type="text"
                        value={settingsForm.upiPayeeName || ''}
                        onChange={e => setSettingsForm({ ...settingsForm, upiPayeeName: e.target.value })}
                        placeholder="PureDrop Dairy Estate"
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#26352B] block mb-1">
                      UPI Instructions for Customer
                    </label>
                    <input
                      type="text"
                      value={settingsForm.upiInstructions || ''}
                      onChange={e => setSettingsForm({ ...settingsForm, upiInstructions: e.target.value })}
                      placeholder="Pay via any UPI app and enter 12-digit UTR reference."
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                    />
                  </div>
                </div>

                {/* 3. QR Code Payment */}
                <div className={`p-5 rounded-2xl border transition-all space-y-3 ${
                  settingsForm.enableQRCode
                    ? 'border-[#397548] bg-white shadow-xs'
                    : 'border-[#DCE9D5] bg-[#FAFCF7]/70'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        settingsForm.enableQRCode ? 'bg-[#EAF4E5] text-[#397548]' : 'bg-stone-200 text-stone-500'
                      }`}>
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-sm text-[#26352B] block">QR Code Payment</span>
                        <span className="text-[11px] text-[#69766B]">
                          Dynamic order QR or static counter QR code
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSettingsForm({ ...settingsForm, enableQRCode: !settingsForm.enableQRCode })}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        settingsForm.enableQRCode
                          ? 'bg-[#397548] text-white shadow-xs hover:bg-[#2E5E3A]'
                          : 'bg-white text-stone-600 border border-[#DCE9D5] hover:bg-stone-100'
                      }`}
                    >
                      {settingsForm.enableQRCode ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      <span>{settingsForm.enableQRCode ? 'Enabled' : 'Disabled'}</span>
                    </button>
                  </div>

                  {settingsForm.enableQRCode && !settingsForm.upiId?.trim() && !settingsForm.upiQrImageUrl?.trim() && (
                    <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span><strong>Configuration Warning:</strong> Dynamic QR requires a Merchant UPI ID or custom QR Image URL.</span>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-bold text-[#26352B] block mb-1">
                      QR Payment Instructions
                    </label>
                    <input
                      type="text"
                      value={settingsForm.qrCodeInstructions || ''}
                      onChange={e => setSettingsForm({ ...settingsForm, qrCodeInstructions: e.target.value })}
                      placeholder="Scan dynamic UPI QR code on delivery runner device or screen."
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#26352B] block mb-1">
                      Static QR Code Image URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.upiQrImageUrl || ''}
                      onChange={e => setSettingsForm({ ...settingsForm, upiQrImageUrl: e.target.value })}
                      placeholder="https://.../my-dairy-qr.png"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                    />
                  </div>
                </div>

                {/* 4. Net Banking */}
                <div className={`p-5 rounded-2xl border transition-all space-y-3 ${
                  settingsForm.enableNetBanking
                    ? 'border-[#397548] bg-white shadow-xs'
                    : 'border-[#DCE9D5] bg-[#FAFCF7]/70'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        settingsForm.enableNetBanking ? 'bg-[#EAF4E5] text-[#397548]' : 'bg-stone-200 text-stone-500'
                      }`}>
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-sm text-[#26352B] block">Net Banking</span>
                        <span className="text-[11px] text-[#69766B]">
                          All Indian bank portals (SBI, HDFC, ICICI, etc.)
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSettingsForm({ ...settingsForm, enableNetBanking: !settingsForm.enableNetBanking })}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        settingsForm.enableNetBanking
                          ? 'bg-[#397548] text-white shadow-xs hover:bg-[#2E5E3A]'
                          : 'bg-white text-stone-600 border border-[#DCE9D5] hover:bg-stone-100'
                      }`}
                    >
                      {settingsForm.enableNetBanking ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      <span>{settingsForm.enableNetBanking ? 'Enabled' : 'Disabled'}</span>
                    </button>
                  </div>

                  {settingsForm.enableNetBanking && (!settingsForm.bankAccountNumber?.trim() || !settingsForm.bankIfsc?.trim()) && (
                    <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span><strong>Configuration Warning:</strong> Bank Account Number and IFSC Code must be configured for Net Banking.</span>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-bold text-[#26352B] block mb-1">
                      Net Banking Instructions
                    </label>
                    <input
                      type="text"
                      value={settingsForm.netBankingInstructions || ''}
                      onChange={e => setSettingsForm({ ...settingsForm, netBankingInstructions: e.target.value })}
                      placeholder="Transfer via NEFT / RTGS / IMPS through your net banking portal."
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                    />
                  </div>
                </div>

                {/* 5. Direct Bank Transfer */}
                <div className={`p-5 rounded-2xl border transition-all space-y-3 ${
                  settingsForm.enableBankTransfer
                    ? 'border-[#397548] bg-white shadow-xs'
                    : 'border-[#DCE9D5] bg-[#FAFCF7]/70'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        settingsForm.enableBankTransfer ? 'bg-[#EAF4E5] text-[#397548]' : 'bg-stone-200 text-stone-500'
                      }`}>
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-sm text-[#26352B] block">Direct Bank Transfer</span>
                        <span className="text-[11px] text-[#69766B]">
                          IMPS / NEFT / RTGS Wire Transfer
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSettingsForm({ ...settingsForm, enableBankTransfer: !settingsForm.enableBankTransfer })}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        settingsForm.enableBankTransfer
                          ? 'bg-[#397548] text-white shadow-xs hover:bg-[#2E5E3A]'
                          : 'bg-white text-stone-600 border border-[#DCE9D5] hover:bg-stone-100'
                      }`}
                    >
                      {settingsForm.enableBankTransfer ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      <span>{settingsForm.enableBankTransfer ? 'Enabled' : 'Disabled'}</span>
                    </button>
                  </div>

                  {settingsForm.enableBankTransfer && (!settingsForm.bankAccountNumber?.trim() || !settingsForm.bankIfsc?.trim()) && (
                    <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span><strong>Configuration Warning:</strong> Bank Account Number and IFSC Code are required.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-[#26352B] block mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={settingsForm.bankName || ''}
                        onChange={e => setSettingsForm({ ...settingsForm, bankName: e.target.value })}
                        placeholder="HDFC Bank"
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#26352B] block mb-1">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        value={settingsForm.bankAccountName || ''}
                        onChange={e => setSettingsForm({ ...settingsForm, bankAccountName: e.target.value })}
                        placeholder="PureDrop Farm & Dairy Products Pvt Ltd"
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#26352B] block mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={settingsForm.bankAccountNumber || ''}
                        onChange={e => setSettingsForm({ ...settingsForm, bankAccountNumber: e.target.value })}
                        placeholder="50200088921045"
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#26352B] block mb-1">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={settingsForm.bankIfsc || ''}
                        onChange={e => setSettingsForm({ ...settingsForm, bankIfsc: e.target.value })}
                        placeholder="HDFC0001234"
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Online Payment Gateway */}
                <div className={`p-5 rounded-2xl border transition-all space-y-3 ${
                  settingsForm.enableGateway
                    ? 'border-[#397548] bg-white shadow-xs'
                    : 'border-[#DCE9D5] bg-[#FAFCF7]/70'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        settingsForm.enableGateway ? 'bg-[#EAF4E5] text-[#397548]' : 'bg-stone-200 text-stone-500'
                      }`}>
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-sm text-[#26352B] block">Online Payment Gateway</span>
                        <span className="text-[11px] text-[#69766B]">
                          Razorpay, Stripe, or Cashfree (Cards & Wallets)
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSettingsForm({ ...settingsForm, enableGateway: !settingsForm.enableGateway })}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        settingsForm.enableGateway
                          ? 'bg-[#397548] text-white shadow-xs hover:bg-[#2E5E3A]'
                          : 'bg-white text-stone-600 border border-[#DCE9D5] hover:bg-stone-100'
                      }`}
                    >
                      {settingsForm.enableGateway ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      <span>{settingsForm.enableGateway ? 'Enabled' : 'Disabled'}</span>
                    </button>
                  </div>

                  {settingsForm.enableGateway && !settingsForm.gatewayKeyId?.trim() && (
                    <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span><strong>Configuration Warning:</strong> Payment Gateway Key ID is required to process online transactions.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-[#26352B] block mb-1">
                        Gateway Provider
                      </label>
                      <select
                        value={settingsForm.gatewayProvider || 'razorpay'}
                        onChange={e => setSettingsForm({ ...settingsForm, gatewayProvider: e.target.value as any })}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B] cursor-pointer"
                      >
                        <option value="razorpay">Razorpay</option>
                        <option value="stripe">Stripe</option>
                        <option value="cashfree">Cashfree</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#26352B] block mb-1">
                        Gateway Key / ID
                      </label>
                      <input
                        type="text"
                        value={settingsForm.gatewayKeyId || ''}
                        onChange={e => setSettingsForm({ ...settingsForm, gatewayKeyId: e.target.value })}
                        placeholder="rzp_test_..."
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#26352B] block mb-1">
                        Environment Mode
                      </label>
                      <select
                        value={settingsForm.gatewayMode || 'sandbox'}
                        onChange={e => setSettingsForm({ ...settingsForm, gatewayMode: e.target.value as any })}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B] cursor-pointer"
                      >
                        <option value="sandbox">Sandbox (Testing)</option>
                        <option value="live">Live (Production)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#26352B] block mb-1">
                      Gateway Checkout Message
                    </label>
                    <input
                      type="text"
                      value={settingsForm.gatewayInstructions || ''}
                      onChange={e => setSettingsForm({ ...settingsForm, gatewayInstructions: e.target.value })}
                      placeholder="Card, NetBanking, and Wallet processing powered by secure payment infrastructure."
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ADMIN ACCOUNT & PASSWORD MANAGEMENT SECTION */}
            <div className="border-t border-[#DCE9D5] pt-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#26352B] font-serif-accent flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#397548]" />
                  <span>Administrator Account & Security</span>
                </h3>
                <p className="text-xs text-[#69766B]">
                  Manage back office login credentials and authorized administrator access
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Admin Email */}
                <div className="p-4 rounded-2xl border border-[#DCE9D5] bg-[#FAFCF7]/40 space-y-2">
                  <label className="text-xs font-bold text-[#26352B] block">Authorized Administrator Email</label>
                  <p className="text-[11px] text-[#69766B]">
                    This email is permitted to log in to the admin panel with your administrator password.
                  </p>
                  <input
                    type="email"
                    value={settingsForm.adminEmail || 'admin@puredropdairy.com'}
                    onChange={e => setSettingsForm({ ...settingsForm, adminEmail: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE9D5] bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                  />
                </div>

                {/* Change Password Card */}
                <div className="p-4 rounded-2xl border border-[#DCE9D5] bg-white space-y-3">
                  <span className="text-xs font-bold text-[#26352B] block">Change Administrator Password</span>
                  
                  {passwordChangeMsg && (
                    <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      passwordChangeMsg.isError ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    }`}>
                      {passwordChangeMsg.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                      <span>{passwordChangeMsg.text}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[11px] font-semibold text-[#69766B] block mb-1">Current Password</label>
                      <input
                        type="password"
                        value={currentAdminPassword}
                        onChange={e => setCurrentAdminPassword(e.target.value)}
                        placeholder="Current password"
                        className="w-full px-3 py-1.5 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#69766B] block mb-1">New Password</label>
                      <input
                        type="password"
                        value={newAdminPassword}
                        onChange={e => setNewAdminPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-3 py-1.5 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      setPasswordChangeMsg(null);
                      if (!currentAdminPassword || !newAdminPassword) {
                        setPasswordChangeMsg({ text: 'Please enter both current and new passwords.', isError: true });
                        return;
                      }
                      if (newAdminPassword.length < 6) {
                        setPasswordChangeMsg({ text: 'New password must be at least 6 characters.', isError: true });
                        return;
                      }
                      try {
                        const res = await fetch('/api/auth/admin-password', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ currentPassword: currentAdminPassword, newPassword: newAdminPassword }),
                        });
                        const data = await res.json();
                        if (!res.ok) {
                          setPasswordChangeMsg({ text: data.error || 'Failed to update password', isError: true });
                        } else {
                          setPasswordChangeMsg({ text: 'Admin password changed successfully!', isError: false });
                          setCurrentAdminPassword('');
                          setNewAdminPassword('');
                          showToast('Admin password updated successfully!');
                        }
                      } catch (err: any) {
                        setPasswordChangeMsg({ text: err.message || 'Network error', isError: true });
                      }
                    }}
                    className="px-4 py-2 bg-[#397548] text-white rounded-xl text-xs font-bold hover:bg-[#2E5E3A] transition-colors cursor-pointer"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* 8. CLEAN START (DATABASE RESET FOR EARLY-STAGE FRESH LAUNCH) */}
        {activeTab === 'clean_start' && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="p-6 bg-white rounded-3xl border border-[#DCE9D5] shadow-xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6 text-amber-700" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[#26352B] font-serif-accent tracking-tight">
                      Early-Stage Clean Start Database Reset
                    </h2>
                    <p className="text-xs text-[#69766B]">
                      Reset customer accounts and historical test orders to begin genuine live dairy operations with a clean slate.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fetchCleanPreview}
                  disabled={isLoadingCleanPreview}
                  className="px-4 py-2 bg-[#FAFCF7] border border-[#DCE9D5] hover:border-[#397548] text-xs font-bold text-[#397548] rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-2xs self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCleanPreview ? 'animate-spin' : ''}`} />
                  <span>Refresh Database Inspection</span>
                </button>
              </div>
            </div>

            {/* Error or Success Alerts */}
            {cleanError && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-start gap-3 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">Reset Blocked / Error:</span>
                  <p>{cleanError}</p>
                </div>
              </div>
            )}

            {cleanResult && (
              <div className="p-5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2.5 font-bold text-sm text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Clean Start Reset Executed Successfully</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  {cleanResult.message}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 uppercase font-bold block">Customers Reset</span>
                    <span className="font-black text-sm text-emerald-900">{cleanResult.cleared?.customers ?? 0}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 uppercase font-bold block">Orders Cleared</span>
                    <span className="font-black text-sm text-emerald-900">{cleanResult.cleared?.orders ?? 0}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 uppercase font-bold block">Admin Account</span>
                    <span className="font-bold text-sm text-emerald-900">Preserved</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 uppercase font-bold block">Catalog & Stock</span>
                    <span className="font-bold text-sm text-emerald-900">Intact</span>
                  </div>
                </div>
                {cleanResult.backupFileName && (
                  <p className="text-[11px] text-emerald-700 font-mono">
                    Safeguard backup stored on server: {cleanResult.backupFileName}
                  </p>
                )}
              </div>
            )}

            {/* Side-by-Side Breakdown: Removed vs Preserved */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Records To Be Reset */}
              <div className="bg-white p-6 rounded-3xl border-2 border-rose-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-rose-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#26352B]">Records to be Reset</h3>
                      <span className="text-[11px] text-rose-600 font-bold uppercase tracking-wider">
                        Destructive Scope
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    {(cleanPreview?.customersCount ?? 0) + (cleanPreview?.ordersCount ?? 0)} records identified
                  </span>
                </div>

                <p className="text-xs text-[#69766B] leading-relaxed">
                  Foreign key relationships and order dependencies are safely cascaded. The following records will be permanently cleared:
                </p>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#26352B] block">Customer Profiles & Accounts</span>
                      <span className="text-[11px] text-[#69766B]">Names, email logins, password hashes, registration data</span>
                    </div>
                    <span className="font-black text-rose-700 text-sm">
                      {cleanPreview?.customersCount ?? '...'} accounts
                    </span>
                  </div>

                  <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#26352B] block">Customer Saved Delivery Addresses</span>
                      <span className="text-[11px] text-[#69766B]">Address lines, PIN codes, landmarks, delivery notes</span>
                    </div>
                    <span className="font-bold text-rose-700 text-xs">Wiped</span>
                  </div>

                  <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#26352B] block">Order Records & History</span>
                      <span className="text-[11px] text-[#69766B]">Line items, sub-totals, order statuses, coupons applied</span>
                    </div>
                    <span className="font-black text-rose-700 text-sm">
                      {cleanPreview?.ordersCount ?? '...'} orders
                    </span>
                  </div>

                  <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#26352B] block">Payment Collections & Attempts</span>
                      <span className="text-[11px] text-[#69766B]">COD collection receipts, references, audit logs</span>
                    </div>
                    <span className="font-bold text-rose-700 text-xs">Cleared</span>
                  </div>

                  <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#26352B] block">Staff Customer Notes</span>
                      <span className="text-[11px] text-[#69766B]">Internal notes tagged to customer phone numbers</span>
                    </div>
                    <span className="font-black text-rose-700 text-sm">
                      {cleanPreview?.customerNotesCount ?? '...'} notes
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Data That Remains 100% Intact */}
              <div className="bg-white p-6 rounded-3xl border-2 border-emerald-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#26352B]">Data That Remains Intact</h3>
                      <span className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider">
                        100% Guaranteed Safe
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Protected
                  </span>
                </div>

                <p className="text-xs text-[#69766B] leading-relaxed">
                  Your store assets, business configuration, and administrative credentials are not touched:
                </p>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#26352B] block">Administrator Account & Password</span>
                      <span className="text-[11px] text-[#69766B]">Your login session remains active and unchanged</span>
                    </div>
                    <span className="font-bold text-emerald-800 text-xs">Preserved</span>
                  </div>

                  <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#26352B] block">Product Catalog & Photography</span>
                      <span className="text-[11px] text-[#69766B]">Full milk, ghee, paneer catalog with images</span>
                    </div>
                    <span className="font-black text-emerald-800 text-sm">
                      {products.length} products
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#26352B] block">Dairy Categories & Pack Sizes</span>
                      <span className="text-[11px] text-[#69766B]">Category taxonomy, display order, images</span>
                    </div>
                    <span className="font-black text-emerald-800 text-sm">
                      {categories.length} categories
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#26352B] block">Pricing & Inventory Settings</span>
                      <span className="text-[11px] text-[#69766B]">Current stock counts, sale prices, made-to-order flags</span>
                    </div>
                    <span className="font-bold text-emerald-800 text-xs">Preserved</span>
                  </div>

                  <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#26352B] block">Store Policy & COD Configuration</span>
                      <span className="text-[11px] text-[#69766B]">Cash on Delivery settings, operating hours, delivery fees</span>
                    </div>
                    <span className="font-bold text-emerald-800 text-xs">Preserved</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Safeguards & Execution Panel */}
            <div className="p-6 bg-white rounded-3xl border border-[#DCE9D5] shadow-sm space-y-6">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#397548]" />
                <h3 className="font-bold text-base text-[#26352B] font-serif-accent">
                  Fresh-Start Safeguards & Confirmation
                </h3>
              </div>

              {/* Safeguard 1: Pre-deletion Backup Export */}
              <div className="p-4 rounded-2xl bg-[#FAFCF7] border border-[#DCE9D5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#26352B] flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-[#397548]" />
                    <span>Safeguard 1: Export Complete Data Backup Before Deletion</span>
                  </span>
                  <p className="text-[11px] text-[#69766B]">
                    Download a full JSON archive containing all existing customer profiles, addresses, notes, and orders before initiating cleanup.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-4 py-2.5 rounded-xl bg-white border border-[#397548] text-[#397548] hover:bg-[#EAF4E5] font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-2xs shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup (.JSON)</span>
                </button>
              </div>

              {/* Safeguard 2: Explicit Confirmation Phrase */}
              <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-amber-900 block">
                    Safeguard 2: Deliberate Administrator Confirmation Required
                  </span>
                  <p className="text-[11px] text-amber-800">
                    To prevent accidental clicks or automated calls, type <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300">CONFIRM</strong> in uppercase into the box below to unlock the deletion button:
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <input
                    type="text"
                    value={cleanConfirmPhrase}
                    onChange={e => setCleanConfirmPhrase(e.target.value)}
                    placeholder="Type CONFIRM to proceed"
                    className="px-4 py-2.5 rounded-xl border border-amber-300 bg-white font-mono font-bold text-xs text-[#26352B] focus:border-rose-600 outline-hidden w-full sm:w-64"
                  />

                  <button
                    type="button"
                    onClick={handleExecuteCleanStart}
                    disabled={cleanConfirmPhrase !== 'CONFIRM' || isCleaningData}
                    className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                  >
                    {isCleaningData ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Safely Resetting Records...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Execute Clean Start Reset</span>
                      </>
                    )}
                  </button>
                </div>
                {cleanConfirmPhrase && cleanConfirmPhrase !== 'CONFIRM' && (
                  <p className="text-[11px] text-rose-600 font-semibold">
                    Phrase does not match. Please type exactly CONFIRM in capital letters.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* PRODUCT ADD/EDIT MODAL */}
      {isProductModalOpen && editingProduct && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          onClose={() => setIsProductModalOpen(false)}
          onSave={async data => {
            if (data.id) {
              await updateProduct(data.id, data);
              showToast(`Product "${data.name}" updated successfully!`);
            } else {
              await createProduct(data);
              showToast(`Product "${data.name}" created successfully!`);
            }
            setIsProductModalOpen(false);
          }}
        />
      )}

      {/* CATEGORY ADD/EDIT MODAL */}
      {isCategoryModalOpen && editingCategory && (
        <CategoryFormModal
          category={editingCategory}
          onClose={() => setIsCategoryModalOpen(false)}
          onSave={async data => {
            if (data.id) {
              await updateCategory(data.id, data);
              showToast(`Category "${data.name}" updated successfully!`);
            } else {
              await createCategory(data);
              showToast(`Category "${data.name}" created successfully!`);
            }
            setIsCategoryModalOpen(false);
          }}
        />
      )}

      {/* COUPON MODAL */}
      {isCouponModalOpen && editingCoupon && (
        <CouponFormModal
          coupon={editingCoupon}
          onClose={() => setIsCouponModalOpen(false)}
          onSave={async data => {
            if (data.id) {
              await updateCoupon(data.id, data);
              showToast(`Coupon "${data.code}" updated!`);
            } else {
              await createCoupon(data);
              showToast(`Coupon "${data.code}" created!`);
            }
            setIsCouponModalOpen(false);
          }}
        />
      )}

      {/* VIEW ORDER & PACKING SLIP MODAL */}
      {viewingOrder && (
        <OrderDetailsModal
          order={viewingOrder}
          settings={settings}
          onClose={() => setViewingOrder(null)}
          onUpdateStatus={async (status, note) => {
            const updated = await updateOrderStatus(viewingOrder.id, status, note);
            setViewingOrder(updated);
            showToast(`Order #${viewingOrder.orderNumber} status updated to ${status}!`);
          }}
          onUpdateNotes={async notes => {
            const updated = await updateOrderNotes(viewingOrder.id, notes);
            setViewingOrder(updated);
            showToast(`Internal note saved for order #${viewingOrder.orderNumber}!`);
          }}
          onRecordPayment={order => {
            setRecordingPaymentOrder(order);
          }}
          onUpdatePaymentStatus={async (paymentStatus, note) => {
            const updated = await updateOrderPaymentStatus(viewingOrder.id, paymentStatus, note);
            setViewingOrder(updated);
            showToast(`Order #${viewingOrder.orderNumber} payment marked as ${paymentStatus.toUpperCase()}!`);
          }}
        />
      )}

      {/* RECORD PAYMENT COLLECTION MODAL */}
      {recordingPaymentOrder && (
        <RecordPaymentModal
          order={recordingPaymentOrder}
          settings={settings}
          onClose={() => setRecordingPaymentOrder(null)}
          onRecord={async (orderId, paymentData) => {
            const updated = await recordOrderPayment(orderId, paymentData);
            if (viewingOrder && viewingOrder.id === orderId) {
              setViewingOrder(updated);
            }
            showToast(`Recorded payment of ₹${paymentData.amount} for Order #${updated.orderNumber}!`);
            setRecordingPaymentOrder(null);
            return updated;
          }}
        />
      )}

      {/* VIEW CUSTOMER PROFILE MODAL */}
      {viewingCustomer && (
        <CustomerProfileModal
          customer={viewingCustomer}
          settings={settings}
          onClose={() => setViewingCustomer(null)}
          onSaveNote={async (phone, notes) => {
            const ok = await saveCustomerNote(phone, notes);
            if (ok) {
              setViewingCustomer(prev => (prev ? { ...prev, notes } : null));
              showToast('Customer staff note saved successfully');
            }
            return ok;
          }}
          onViewOrder={orderSummary => {
            const fullOrder = orders.find(o => o.id === orderSummary.id || o.orderNumber === orderSummary.orderNumber);
            if (fullOrder) {
              setViewingOrder(fullOrder);
            }
          }}
        />
      )}

      {/* DELETE PRODUCT CONFIRMATION MODAL */}
      {deleteProductConfirmId && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-[#DCE9D5]">
            <h3 className="font-bold text-[#26352B] text-sm">Confirm Product Deletion</h3>
            <p className="text-xs text-[#69766B]">
              Are you sure you want to delete this product? It will be removed from customer storefront immediately.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteProductConfirmId(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-[#69766B] hover:bg-[#FAFCF7] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteProduct(deleteProductConfirmId);
                  setDeleteProductConfirmId(null);
                  showToast('Product deleted successfully');
                }}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CATEGORY CONFIRMATION MODAL */}
      {deleteCategoryConfirmId && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-[#DCE9D5]">
            <h3 className="font-bold text-[#26352B] text-sm">Confirm Category Deletion</h3>
            <p className="text-xs text-[#69766B]">
              Are you sure you want to delete this category? Products assigned to it may need a new category.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteCategoryConfirmId(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-[#69766B] hover:bg-[#FAFCF7] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteCategory(deleteCategoryConfirmId);
                  setDeleteCategoryConfirmId(null);
                  showToast('Category deleted successfully');
                }}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponents for Admin
function ProductFormModal({
  product,
  categories,
  onClose,
  onSave,
}: {
  product: Partial<Product>;
  categories: Category[];
  onClose: () => void;
  onSave: (data: Partial<Product>) => Promise<void>;
}) {
  const [formData, setFormData] = useState<Partial<Product>>({ ...product });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setFormError('Please enter a product name');
      return;
    }
    if (!formData.price || formData.price <= 0) {
      setFormError('Please enter a valid regular price');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      await onSave(formData);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#DCE9D5] max-h-[92vh] flex flex-col">
        <div className="p-4 border-b border-[#DCE9D5] flex justify-between items-center bg-[#FAFCF7]">
          <h3 className="font-bold text-[#26352B] text-sm font-serif-accent">
            {formData.id ? 'Edit Dairy Product' : 'Add New Dairy Product'}
          </h3>
          <button onClick={onClose} className="p-1 text-[#69766B] hover:text-[#26352B] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {formError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="font-semibold text-[#26352B] block mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
              placeholder="e.g. Farm Fresh Cow Milk"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#26352B] block mb-1">Category</label>
              <select
                value={formData.categoryId || categories[0]?.id}
                onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-[#26352B] block mb-1">Standard Pack / Unit</label>
              <input
                type="text"
                value={formData.unit || '1 Litre'}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                placeholder="e.g. 1 Litre or 500 g"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-[#26352B] block mb-1">Regular Price (₹) *</label>
              <input
                type="number"
                required
                value={formData.price || 0}
                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#26352B] block mb-1">Sale Price (₹)</label>
              <input
                type="number"
                value={formData.salePrice || ''}
                onChange={e =>
                  setFormData({
                    ...formData,
                    salePrice: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="font-semibold text-[#26352B] block mb-1">Stock Quantity</label>
              <input
                type="number"
                value={formData.stockQuantity ?? 20}
                onChange={e => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-[#26352B] block mb-1">Product Photo URL</label>
            <input
              type="url"
              value={formData.images?.[0] || ''}
              onChange={e => setFormData({ ...formData, images: [e.target.value] })}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="font-semibold text-[#26352B] block mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#26352B] block mb-1">Storage Instructions</label>
            <input
              type="text"
              value={formData.storageInfo || ''}
              onChange={e => setFormData({ ...formData, storageInfo: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
              placeholder="Store refrigerated below 4°C"
            />
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured || false}
                onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="accent-[#397548]"
              />
              <span className="font-semibold text-[#26352B]">Featured on Home</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublished !== false}
                onChange={e => setFormData({ ...formData, isPublished: e.target.checked })}
                className="accent-[#397548]"
              />
              <span className="font-semibold text-[#26352B]">Published in Store</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isMadeToOrder || false}
                onChange={e => setFormData({ ...formData, isMadeToOrder: e.target.checked })}
                className="accent-[#397548]"
              />
              <span className="font-semibold text-[#26352B]">Made to order (Unlimited)</span>
            </label>
          </div>

          <div className="pt-4 border-t border-[#DCE9D5] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#69766B] hover:bg-[#FAFCF7] rounded-xl font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#397548] text-white rounded-xl font-bold hover:bg-[#2E5E3A] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategoryFormModal({
  category,
  onClose,
  onSave,
}: {
  category: Partial<Category>;
  onClose: () => void;
  onSave: (data: Partial<Category>) => Promise<void>;
}) {
  const [name, setName] = useState(category.name || '');
  const [description, setDescription] = useState(category.description || '');
  const [image, setImage] = useState(category.image || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    await onSave({ ...category, name: name.trim(), description, image });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 border border-[#DCE9D5] shadow-xl">
        <h3 className="font-bold text-[#26352B] text-sm font-serif-accent">
          {category.id ? 'Edit Category' : 'Create Category'}
        </h3>
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-[#26352B] block mb-1">Category Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
              placeholder="e.g. Fresh Paneer"
            />
          </div>
          <div>
            <label className="font-semibold text-[#26352B] block mb-1">Image URL</label>
            <input
              type="url"
              value={image}
              onChange={e => setImage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="font-semibold text-[#26352B] block mb-1">Short Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
              placeholder="Description for shop page"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE9D5]">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-[#69766B] hover:bg-[#FAFCF7] rounded-xl cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting || !name.trim()}
            className="px-4 py-1.5 bg-[#397548] text-white rounded-xl text-xs font-bold hover:bg-[#2E5E3A] transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Category'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CouponFormModal({
  coupon,
  onClose,
  onSave,
}: {
  coupon: Partial<Coupon>;
  onClose: () => void;
  onSave: (data: Partial<Coupon>) => Promise<void>;
}) {
  const [code, setCode] = useState(coupon.code || '');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(
    coupon.discountType || 'percentage'
  );
  const [value, setValue] = useState(coupon.value || 10);
  const [minOrder, setMinOrder] = useState(coupon.minOrderValue || 299);
  const [expiry, setExpiry] = useState(coupon.expiryDate || '2028-12-31');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!code.trim() || !value) return;
    setIsSubmitting(true);
    await onSave({
      ...coupon,
      code: code.trim().toUpperCase(),
      discountType,
      value: Number(value),
      minOrderValue: Number(minOrder),
      expiryDate: expiry,
      isActive: true,
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 border border-[#DCE9D5] shadow-xl">
        <h3 className="font-bold text-[#26352B] text-sm font-serif-accent">Create Discount Coupon</h3>
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-[#26352B] block mb-1">Coupon Code *</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] font-mono outline-hidden text-[#26352B]"
              placeholder="e.g. MILK15"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-[#26352B] block mb-1">Discount Type</label>
              <select
                value={discountType}
                onChange={e => setDiscountType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
              >
                <option value="percentage">% Percentage</option>
                <option value="fixed">Flat ₹ Off</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-[#26352B] block mb-1">Discount Value</label>
              <input
                type="number"
                value={value}
                onChange={e => setValue(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
              />
            </div>
          </div>
          <div>
            <label className="font-semibold text-[#26352B] block mb-1">Minimum Order Value (₹)</label>
            <input
              type="number"
              value={minOrder}
              onChange={e => setMinOrder(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
            />
          </div>
          <div>
            <label className="font-semibold text-[#26352B] block mb-1">Expiry Date</label>
            <input
              type="date"
              value={expiry}
              onChange={e => setExpiry(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE9D5]">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-[#69766B] hover:bg-[#FAFCF7] rounded-xl cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting || !code.trim() || !value}
            className="px-4 py-1.5 bg-[#397548] text-white rounded-xl text-xs font-bold hover:bg-[#2E5E3A] transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Create Coupon'}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderDetailsModal({
  order,
  settings,
  onClose,
  onUpdateStatus,
  onUpdateNotes,
  onRecordPayment,
  onUpdatePaymentStatus,
}: {
  order: Order;
  settings: StoreSettings;
  onClose: () => void;
  onUpdateStatus: (status: OrderStatus, note?: string) => Promise<void>;
  onUpdateNotes: (notes: string) => Promise<void>;
  onRecordPayment: (order: Order) => void;
  onUpdatePaymentStatus: (status: PaymentStatus, note?: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState(order.internalNotes || '');
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [notesFeedback, setNotesFeedback] = useState<string | null>(null);

  // Quick payment status update inside OrderDetails
  const [targetPaymentStatus, setTargetPaymentStatus] = useState<PaymentStatus>(order.paymentStatus);
  const [isUpdatingPaymentStatus, setIsUpdatingPaymentStatus] = useState(false);
  const [paymentFeedback, setPaymentFeedback] = useState<string | null>(null);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);

  const remBal = typeof order.remainingBalance === 'number'
    ? order.remainingBalance
    : (order.paymentStatus === 'paid' ? 0 : order.total);

  const formatPaymentMethodName = (m: string) => {
    if (m === 'cod') return 'Cash on Delivery (COD)';
    if (m === 'upi') return 'UPI Payment';
    if (m === 'qr_code') return 'QR Code Payment';
    if (m === 'net_banking') return 'Net Banking';
    if (m === 'bank_transfer') return 'Direct Bank Transfer';
    if (m === 'gateway' || m === 'card') return 'Online Payment Gateway';
    return m ? m.toUpperCase() : 'Other / Manual';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadInvoice = () => {
    const ok = downloadInvoicePDF(order, settings);
    if (!ok) {
      window.print();
    }
  };

  const handleDownloadSlip = () => {
    const ok = downloadOrderDetailsPDF(order, settings, true);
    if (!ok) {
      window.print();
    }
  };

  const submitStatusUpdate = async () => {
    setIsUpdatingStatus(true);
    setStatusFeedback(null);
    try {
      await onUpdateStatus(status, statusNote);
      setStatusFeedback(`Delivery status updated to ${status}!`);
      setTimeout(() => setStatusFeedback(null), 3000);
    } catch (err: any) {
      setStatusFeedback(err.message || 'Error updating status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const submitNotesUpdate = async () => {
    setIsSavingNotes(true);
    setNotesFeedback(null);
    try {
      await onUpdateNotes(notes);
      setNotesFeedback('Internal note saved!');
      setTimeout(() => setNotesFeedback(null), 3000);
    } catch (err: any) {
      setNotesFeedback(err.message || 'Error saving notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const submitPaymentStatusChange = async () => {
    if (targetPaymentStatus === order.paymentStatus) return;
    setIsUpdatingPaymentStatus(true);
    setPaymentFeedback(null);
    try {
      await onUpdatePaymentStatus(targetPaymentStatus, `Payment status set to ${targetPaymentStatus.toUpperCase()} by admin`);
      setPaymentFeedback(`Payment status updated to ${targetPaymentStatus.toUpperCase()}!`);
      setShowStatusConfirm(false);
      setTimeout(() => setPaymentFeedback(null), 3000);
    } catch (err: any) {
      setPaymentFeedback(err.message || 'Error updating payment status');
    } finally {
      setIsUpdatingPaymentStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#DCE9D5] max-h-[92vh] flex flex-col">
        <div className="p-4 border-b border-[#DCE9D5] flex items-center justify-between bg-[#FAFCF7]">
          <div>
            <h3 className="font-bold text-[#26352B] text-sm font-serif-accent">
              Order #{order.orderNumber} Delivery Packing Slip & Accounts
            </h3>
            <p className="text-[11px] text-[#69766B]">
              Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownloadInvoice}
              className="px-2.5 py-1.5 rounded-lg border border-[#DCE9D5] bg-white text-xs font-semibold text-[#397548] hover:bg-[#FAFCF7] flex items-center gap-1 cursor-pointer transition-colors"
              title="Download PDF Invoice"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Invoice PDF</span>
            </button>
            <button
              onClick={handleDownloadSlip}
              className="px-2.5 py-1.5 rounded-lg border border-[#DCE9D5] bg-white text-xs font-semibold text-[#69766B] hover:bg-[#FAFCF7] flex items-center gap-1 cursor-pointer transition-colors"
              title="Download PDF Packing Slip"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Slip PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-2.5 py-1.5 rounded-lg border border-[#DCE9D5] bg-white text-xs font-semibold text-[#26352B] hover:bg-[#FAFCF7] flex items-center gap-1 cursor-pointer transition-colors"
              title="Print directly"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-[#69766B] hover:text-[#26352B] cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 space-y-5 text-xs" id="printable-receipt">
          {/* Customer & Delivery row */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-[#FAFCF7] rounded-2xl border border-[#DCE9D5]">
            <div>
              <span className="text-[#69766B] uppercase font-bold text-[10px] block">Customer</span>
              <p className="font-bold text-[#26352B] text-sm mt-0.5">{order.customer.name}</p>
              <p className="text-[#69766B]">Phone: +91 {order.customer.phone}</p>
              {order.customer.email && <p className="text-[#69766B]">{order.customer.email}</p>}
            </div>

            <div>
              <span className="text-[#69766B] uppercase font-bold text-[10px] block">Delivery Location</span>
              <p className="font-semibold text-[#26352B] mt-0.5">{order.customer.address}</p>
              <p className="text-[#69766B]">
                {order.customer.city} - {order.customer.pincode}
              </p>
              {order.customer.deliveryNotes && (
                <p className="text-[#397548] bg-white border border-[#DCE9D5] p-1.5 rounded-md mt-1 text-[11px]">
                  <strong>Doorstep Notes:</strong> {order.customer.deliveryNotes}
                </p>
              )}
            </div>
          </div>

          {/* DEDICATED PAYMENT INFORMATION SECTION */}
          <div className="p-4 bg-white rounded-2xl border border-[#DCE9D5] space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#DCE9D5] pb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#397548]" />
                <h4 className="font-bold text-[#26352B] text-xs uppercase tracking-wider">
                  Payment Information & Accounts
                </h4>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  order.paymentStatus === 'paid'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : order.paymentStatus === 'partially_paid'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : order.paymentStatus === 'refunded'
                    ? 'bg-stone-100 text-stone-600 border-stone-200'
                    : order.paymentStatus === 'failed'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-[#FAFCF7] text-[#397548] border-[#397548]'
                }`}
              >
                {order.paymentStatus.toUpperCase()}
              </span>
            </div>

            {paymentFeedback && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{paymentFeedback}</span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 bg-[#FAFCF7] rounded-xl border border-[#DCE9D5]">
                <span className="text-[10px] text-[#69766B] font-bold block uppercase">Payment Mode</span>
                <span className="font-bold text-[#26352B] text-xs mt-0.5 block">
                  {formatPaymentMethodName(order.paymentMethod)}
                </span>
              </div>

              <div className="p-2.5 bg-[#FAFCF7] rounded-xl border border-[#DCE9D5]">
                <span className="text-[10px] text-[#69766B] font-bold block uppercase">Total Payable</span>
                <span className="font-extrabold text-[#26352B] text-xs mt-0.5 block">
                  {formatCurrency(order.total, settings.currencySymbol)}
                </span>
              </div>

              <div className="p-2.5 bg-[#FAFCF7] rounded-xl border border-[#DCE9D5]">
                <span className="text-[10px] text-[#69766B] font-bold block uppercase">Amount Collected</span>
                <span className="font-extrabold text-emerald-700 text-xs mt-0.5 block">
                  {formatCurrency(order.amountPaid || 0, settings.currencySymbol)}
                </span>
              </div>

              <div className="p-2.5 bg-[#FAFCF7] rounded-xl border border-[#DCE9D5]">
                <span className="text-[10px] text-[#69766B] font-bold block uppercase">Remaining Due</span>
                <span className={`font-extrabold text-xs mt-0.5 block ${remBal > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {formatCurrency(remBal, settings.currencySymbol)}
                </span>
              </div>
            </div>

            {/* Transaction ID & Payment Date */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#FAFCF7] rounded-xl border border-[#DCE9D5] text-[11px]">
              <div>
                <span className="text-[#69766B] font-bold">Transaction / UTR Reference: </span>
                {order.transactionId ? (
                  <span className="font-mono font-bold text-[#397548] bg-white px-2 py-0.5 rounded border border-[#DCE9D5]">
                    {order.transactionId}
                  </span>
                ) : (
                  <span className="text-[#69766B] italic">None recorded</span>
                )}
              </div>

              {order.paymentDate && (
                <div>
                  <span className="text-[#69766B] font-bold">Payment Recorded: </span>
                  <span className="text-[#26352B] font-semibold">
                    {new Date(order.paymentDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              )}
            </div>

            {/* Payment History Log */}
            {order.paymentHistory && order.paymentHistory.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-[#69766B] uppercase tracking-wider block">
                  Payment Collection History ({order.paymentHistory.length})
                </span>
                <div className="divide-y divide-[#DCE9D5] border border-[#DCE9D5] rounded-xl overflow-hidden bg-white">
                  {order.paymentHistory.map((rec, i) => (
                    <div key={rec.id || i} className="p-2.5 flex items-center justify-between text-[11px]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-700 font-mono">
                            +{formatCurrency(rec.amount, settings.currencySymbol)}
                          </span>
                          <span className="uppercase text-[9px] font-bold px-1.5 py-0.2 bg-[#FAFCF7] text-[#397548] border border-[#DCE9D5] rounded">
                            {rec.method}
                          </span>
                          {rec.reference && (
                            <span className="font-mono text-[10px] text-[#69766B]">Ref: {rec.reference}</span>
                          )}
                        </div>
                        {rec.note && <p className="text-[10px] text-[#69766B] mt-0.5">{rec.note}</p>}
                      </div>
                      <span className="text-[10px] text-[#69766B]">
                        {new Date(rec.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#DCE9D5]">
              {remBal > 0 && order.paymentStatus !== 'paid' ? (
                <button
                  type="button"
                  onClick={() => onRecordPayment(order)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Record Collection ({formatCurrency(remBal, settings.currencySymbol)} Due)</span>
                </button>
              ) : (
                <div className="flex items-center gap-1 text-emerald-700 text-xs font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Full payment balance cleared</span>
                </div>
              )}

              {/* Update Status Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#69766B] font-bold">Status:</span>
                <select
                  value={targetPaymentStatus}
                  onChange={e => {
                    setTargetPaymentStatus(e.target.value as PaymentStatus);
                    setShowStatusConfirm(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] text-xs font-bold text-[#26352B] outline-hidden cursor-pointer"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="refunded">Refunded</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="failed">Failed</option>
                </select>

                {showStatusConfirm && targetPaymentStatus !== order.paymentStatus && (
                  <button
                    type="button"
                    disabled={isUpdatingPaymentStatus}
                    onClick={submitPaymentStatusChange}
                    className="px-3 py-1.5 bg-[#397548] text-white rounded-xl text-xs font-bold hover:bg-[#2E5E3A] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingPaymentStatus ? 'Saving...' : `Confirm ${targetPaymentStatus.toUpperCase()}`}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-[#DCE9D5] rounded-2xl overflow-hidden">
            <div className="bg-[#FAFCF7] px-4 py-2 font-bold text-[#397548] uppercase tracking-wider text-[11px] border-b border-[#DCE9D5]">
              Packed Dairy Items
            </div>
            <div className="divide-y divide-[#DCE9D5]">
              {order.items.map((it, idx) => (
                <div key={idx} className="p-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img src={it.image} alt="" className="w-9 h-9 rounded-lg object-cover border border-[#DCE9D5]" />
                    <div>
                      <p className="font-bold text-[#26352B]">{it.name}</p>
                      <p className="text-[#69766B] text-[11px]">{it.variantName || it.unit} × {it.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-[#26352B]">
                    {formatCurrency(it.totalPrice, settings.currencySymbol)}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#FAFCF7] border-t border-[#DCE9D5] space-y-1 text-right text-xs">
              <p className="text-[#69766B]">Subtotal: {formatCurrency(order.subtotal, settings.currencySymbol)}</p>
              {order.discount > 0 && (
                <p className="text-[#397548] font-semibold">
                  Discount ({order.couponCode}): -{formatCurrency(order.discount, settings.currencySymbol)}
                </p>
              )}
              <p className="text-[#69766B]">
                Delivery: {order.deliveryFee === 0 ? 'FREE' : formatCurrency(order.deliveryFee, settings.currencySymbol)}
              </p>
              <p className="text-sm font-extrabold text-[#397548] pt-1 border-t border-[#DCE9D5]">
                Total Payable: {formatCurrency(order.total, settings.currencySymbol)}
              </p>
            </div>
          </div>

          {/* Delivery Slot row */}
          <div className="p-3 bg-[#FAFCF7] rounded-xl border border-[#DCE9D5] flex justify-between items-center text-xs">
            <span className="text-[#69766B] font-bold uppercase text-[10px]">Preferred Doorstep Slot</span>
            <span className="font-bold text-[#26352B]">{order.deliverySlot}</span>
          </div>

          {/* Status Update Control */}
          <div className="p-4 bg-[#FAFCF7] border border-[#DCE9D5] rounded-2xl space-y-3">
            <h4 className="font-bold text-[#26352B]">Update Delivery Status</h4>

            {statusFeedback && (
              <div className="p-2 bg-white border border-[#397548] rounded-lg text-xs font-bold text-[#397548]">
                {statusFeedback}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <select
                value={status}
                onChange={e => setStatus(e.target.value as OrderStatus)}
                className="px-3 py-1.5 rounded-xl border border-[#DCE9D5] bg-white font-semibold text-[#26352B] outline-hidden cursor-pointer"
              >
                <option value="New Order">New Order</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Preparing">Preparing</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled (Restores Stock)</option>
              </select>

              <input
                type="text"
                placeholder="Optional status note (e.g. runner Rajesh on route)"
                value={statusNote}
                onChange={e => setStatusNote(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-[#DCE9D5] bg-white text-[#26352B] outline-hidden"
              />

              <button
                onClick={submitStatusUpdate}
                disabled={isUpdatingStatus}
                className="px-4 py-1.5 bg-[#397548] text-white rounded-xl font-bold cursor-pointer hover:bg-[#2E5E3A] transition-colors disabled:opacity-50"
              >
                {isUpdatingStatus ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="space-y-1.5">
            <label className="font-bold text-[#26352B] block">Internal Staff / Dispatch Notes</label>
            {notesFeedback && (
              <div className="p-2 bg-[#FAFCF7] border border-[#397548] rounded-lg text-xs font-bold text-[#397548]">
                {notesFeedback}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] text-[#26352B] outline-hidden"
                placeholder="Internal notes (not visible to customer)"
              />
              <button
                onClick={submitNotesUpdate}
                disabled={isSavingNotes}
                className="px-4 py-2 bg-[#397548] text-white rounded-xl font-semibold hover:bg-[#2E5E3A] cursor-pointer transition-colors disabled:opacity-50"
              >
                {isSavingNotes ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecordPaymentModal({
  order,
  settings,
  onClose,
  onRecord,
}: {
  order: Order;
  settings: StoreSettings;
  onClose: () => void;
  onRecord: (orderId: string, paymentData: { amount: number; method?: PaymentMethod; reference?: string; note?: string }) => Promise<Order>;
}) {
  const remBal = typeof order.remainingBalance === 'number'
    ? order.remainingBalance
    : (order.paymentStatus === 'paid' ? 0 : order.total);

  const [amount, setAmount] = useState<number>(remBal);
  const [method, setMethod] = useState<PaymentMethod>(order.paymentMethod || 'cod');
  const [reference, setReference] = useState(order.transactionId || '');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedByUser, setConfirmedByUser] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (amount <= 0) {
      setErrorMessage('Payment collection amount must be greater than zero.');
      return;
    }

    if (amount > remBal) {
      setErrorMessage(`Payment amount cannot exceed remaining balance of ₹${remBal}.`);
      return;
    }

    if (!confirmedByUser) {
      setConfirmedByUser(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await onRecord(order.id, {
        amount,
        method,
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record payment');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#DCE9D5]">
        <div className="flex items-center justify-between border-b border-[#DCE9D5] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#26352B] text-sm font-serif-accent">
                Record Payment Collection
              </h3>
              <p className="text-[11px] text-[#69766B]">
                Order #{order.orderNumber} • {order.customer.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[#69766B] hover:text-[#26352B] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="p-3 bg-[#FAFCF7] rounded-2xl border border-[#DCE9D5] grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="text-[10px] text-[#69766B] uppercase block">Total</span>
            <span className="font-bold text-[#26352B]">
              {formatCurrency(order.total, settings.currencySymbol)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#69766B] uppercase block">Paid So Far</span>
            <span className="font-bold text-emerald-700">
              {formatCurrency(order.amountPaid || 0, settings.currencySymbol)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#69766B] uppercase block">Due Balance</span>
            <span className="font-black text-amber-700">
              {formatCurrency(remBal, settings.currencySymbol)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-[#26352B]">Amount to Collect (₹) *</label>
              <button
                type="button"
                onClick={() => setAmount(remBal)}
                className="text-[11px] text-[#397548] font-bold hover:underline cursor-pointer"
              >
                Full Balance (₹{remBal})
              </button>
            </div>
            <input
              type="number"
              min={1}
              max={remBal}
              required
              value={amount}
              onChange={e => {
                setAmount(Number(e.target.value));
                setConfirmedByUser(false);
              }}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] font-bold text-sm text-[#26352B] outline-hidden"
            />
          </div>

          <div>
            <label className="font-bold text-[#26352B] block mb-1">Payment Method</label>
            <select
              value={method}
              onChange={e => {
                setMethod(e.target.value as PaymentMethod);
                setConfirmedByUser(false);
              }}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] font-semibold text-[#26352B] outline-hidden cursor-pointer"
            >
              <option value="cod">Cash on Delivery (Doorstep Cash)</option>
              <option value="upi">UPI (GPay, PhonePe, Paytm)</option>
              <option value="qr_code">QR Code Payment</option>
              <option value="net_banking">Net Banking</option>
              <option value="bank_transfer">Direct Bank Transfer (IMPS/NEFT)</option>
              <option value="gateway">Online Payment Gateway</option>
              <option value="other">Other / Manual Adjustment</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-[#26352B] block mb-1">
              Transaction ID / UTR / Cash Receipt # (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. UTR3291081902 or Cash Slip #42"
              value={reference}
              onChange={e => {
                setReference(e.target.value);
                setConfirmedByUser(false);
              }}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] text-[#26352B] outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="font-bold text-[#26352B] block mb-1">Staff Note (optional)</label>
            <input
              type="text"
              placeholder="e.g. Collected by Rajesh at doorstep delivery"
              value={note}
              onChange={e => {
                setNote(e.target.value);
                setConfirmedByUser(false);
              }}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] text-[#26352B] outline-hidden"
            />
          </div>

          {confirmedByUser && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs space-y-1">
              <p className="font-bold">⚠️ Please Confirm Payment Record:</p>
              <p>
                Record <strong>₹{amount}</strong> collected via <strong>{method.toUpperCase()}</strong> for Order #{order.orderNumber}?
              </p>
              <p className="text-[11px] text-amber-800">Remaining balance will become ₹{remBal - amount}.</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE9D5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#69766B] hover:bg-[#FAFCF7] rounded-xl font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-white rounded-xl font-bold cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1.5 ${
                confirmedByUser ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-[#397548] hover:bg-[#2E5E3A]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : confirmedByUser ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm & Save</span>
                </>
              ) : (
                <span>Record ₹{amount}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CustomerProfileModal({
  customer,
  settings,
  onClose,
  onSaveNote,
  onViewOrder,
}: {
  customer: CustomerSummary;
  settings: StoreSettings;
  onClose: () => void;
  onSaveNote: (phone: string, notes: string) => Promise<boolean>;
  onViewOrder: (order: any) => void;
}) {
  const [note, setNote] = useState(customer.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    const ok = await onSaveNote(customer.phone, note);
    setIsSaving(false);
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-[#DCE9D5] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-[#DCE9D5] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#DCE9D5] text-[#397548] flex items-center justify-center font-bold text-lg">
              {customer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-[#26352B] text-base font-serif-accent">
                {customer.name}
              </h3>
              <p className="text-xs text-[#69766B]">
                +91 {customer.phone} {customer.email ? `• ${customer.email}` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#69766B] hover:text-[#26352B] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 text-xs">
          {/* Quick contact buttons & KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-[#FAFCF7] rounded-xl border border-[#DCE9D5] text-center">
              <span className="text-[10px] uppercase font-bold text-[#69766B] block">Total Orders</span>
              <span className="font-black text-sm text-[#26352B] mt-0.5 block">{customer.orderCount}</span>
            </div>

            <div className="p-3 bg-[#FAFCF7] rounded-xl border border-[#DCE9D5] text-center">
              <span className="text-[10px] uppercase font-bold text-[#69766B] block">Total Spent</span>
              <span className="font-black text-sm text-[#397548] mt-0.5 block">
                {formatCurrency(customer.totalSpent, settings.currencySymbol)}
              </span>
            </div>

            <a
              href={`https://wa.me/91${customer.phone}`}
              target="_blank"
              rel="noreferrer"
              className="p-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 text-center flex flex-col items-center justify-center cursor-pointer transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-700" />
              <span className="font-bold text-[11px] text-emerald-800 mt-1">WhatsApp Chat</span>
            </a>

            <a
              href={`tel:+91${customer.phone}`}
              className="p-3 bg-[#FAFCF7] hover:bg-[#DCE9D5] rounded-xl border border-[#DCE9D5] text-center flex flex-col items-center justify-center cursor-pointer transition-colors"
            >
              <Phone className="w-4 h-4 text-[#397548]" />
              <span className="font-bold text-[11px] text-[#26352B] mt-1">Direct Call</span>
            </a>
          </div>

          {/* Known Delivery Addresses */}
          <div className="p-3 bg-[#FAFCF7] rounded-xl border border-[#DCE9D5] space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#69766B] block">Delivery Addresses</span>
            {customer.addresses.map((addr, idx) => (
              <p key={idx} className="text-[#26352B] font-semibold text-xs flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#397548] shrink-0" />
                <span>{addr}</span>
              </p>
            ))}
          </div>

          {/* Internal Staff Notes for this customer */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-bold text-[#26352B]">Internal Staff Notes</label>
              {saveSuccess && (
                <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Note saved!
                </span>
              )}
            </div>
            <textarea
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Prefers buffalo milk boiled early morning; leave bottle in doorway bag."
              className="w-full px-3 py-2 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-3.5 py-1.5 bg-[#397548] text-white rounded-xl text-xs font-bold hover:bg-[#2E5E3A] transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Customer Note'}
              </button>
            </div>
          </div>

          {/* Order History */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#69766B] block tracking-wider">
                Order History ({customer.orders?.length || 0})
              </span>
              <span className="text-[10px] text-[#69766B]">
                {customer.orderCount > 0 ? `${customer.orderCount} total purchases` : 'No purchases yet'}
              </span>
            </div>

            {(!customer.orders || customer.orders.length === 0) ? (
              <div className="p-5 rounded-2xl border border-dashed border-[#DCE9D5] bg-[#FAFCF7]/40 text-center text-xs text-[#69766B]">
                <p className="font-semibold text-[#69766B]">No orders on record</p>
                <p className="text-[11px] mt-0.5">This customer has not placed any dairy orders yet.</p>
              </div>
            ) : (
              <div className="border border-[#DCE9D5] rounded-2xl overflow-hidden divide-y divide-[#DCE9D5] bg-white max-h-60 overflow-y-auto">
                {customer.orders.map((o: any) => (
                  <div key={o.id} className="p-3 flex items-center justify-between text-xs hover:bg-[#FAFCF7]/60 transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#26352B]">#{o.orderNumber}</span>
                        <span className="text-[10px] text-[#69766B]">
                          {new Date(o.createdAt || o.date).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            o.status === 'Delivered'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : o.status === 'Cancelled'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : o.status === 'Out for Delivery'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                              : 'bg-[#FAFCF7] text-[#397548] border border-[#DCE9D5]'
                          }`}
                        >
                          {o.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#69766B]">
                        {o.items?.length ?? o.itemsCount ?? 1} item
                        {(o.items?.length ?? o.itemsCount ?? 1) !== 1 ? 's' : ''} •{' '}
                        {(o.paymentMethod || 'cod').toUpperCase()} (
                        <span
                          className={
                            o.paymentStatus === 'paid'
                              ? 'text-emerald-700 font-bold'
                              : o.paymentStatus === 'failed'
                              ? 'text-rose-600 font-bold'
                              : 'text-amber-700 font-bold'
                          }
                        >
                          {(o.paymentStatus || 'pending').toUpperCase()}
                        </span>
                        )
                        {o.transactionId && (
                          <span className="font-mono text-[#397548] ml-1">
                            • UTR: {o.transactionId}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="font-bold text-[#397548] text-xs">
                        {formatCurrency(o.total, settings.currencySymbol)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onViewOrder(o);
                        }}
                        className="px-2.5 py-1 bg-[#FAFCF7] hover:bg-[#DCE9D5] text-[#397548] border border-[#DCE9D5] rounded-xl font-bold text-[11px] cursor-pointer transition-colors shadow-2xs"
                      >
                        View Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
