import React, { createContext, useContext, useEffect, useState } from 'react';
import { INITIAL_SETTINGS } from '../data/initialData.ts';
import type { CartItem, Category, Coupon, CustomerAccount, CustomerInfo, Order, OrderStatus, PaymentMethod, PaymentStatus, Product, StoreSettings } from '../types/dairy.js';
import { calculateCartTotals } from '../utils/pricing.ts';

interface StoreContextType {
  settings: StoreSettings;
  categories: Category[];
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  cart: CartItem[];
  appliedCoupon: Coupon | null;
  couponError: string | null;
  isLoading: boolean;
  activeView: 'store' | 'admin' | 'shop';
  selectedCategory: string;
  searchQuery: string;
  customerPhone: string;
  myOrders: Order[];
  
  // Customer Auth
  customer: CustomerAccount | null;
  customerToken: string | null;
  isCustomerLoggedIn: boolean;
  registerCustomer: (data: { name: string; email: string; phone: string; password: string; address?: string; city?: string; pincode?: string; alternatePhone?: string }) => Promise<{ success: boolean; error?: string }>;
  loginCustomer: (emailOrPhone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutCustomer: () => void;
  updateCustomerProfile: (data: Partial<CustomerAccount>) => Promise<boolean>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register' | 'forgot';
  setAuthModalMode: (mode: 'login' | 'register' | 'forgot') => void;
  openCustomerAuthModal: (mode?: 'login' | 'register' | 'forgot', returnToCheckout?: boolean) => void;
  closeCustomerAuthModal: () => void;
  
  // UPI QR Payment & Verification
  pendingUpiOrder: Order | null;
  setPendingUpiOrder: (order: Order | null) => void;
  isUpiPaymentModalOpen: boolean;
  setIsUpiPaymentModalOpen: (open: boolean) => void;
  submitUpiPaymentRef: (orderId: string, utrRef: string) => Promise<boolean>;
  verifyUpiPayment: (orderId: string, action: 'verify' | 'reject', reason?: string) => Promise<boolean>;

  // Actions
  setActiveView: (view: 'store' | 'admin' | 'shop') => void;
  setSelectedCategory: (catId: string) => void;
  setSearchQuery: (query: string) => void;
  addToCart: (product: Product, variantId?: string, quantity?: number) => boolean;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  applyCouponCode: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  placeOrder: (customer: CustomerInfo, deliverySlot: string, paymentMethod: PaymentMethod, transactionId?: string) => Promise<Order>;
  
  // Admin actions & details
  adminToken: string | null;
  adminUser: { email: string; name: string } | null;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => void;
  recordOrderPayment: (orderId: string, paymentData: { amount: number; method?: PaymentMethod; reference?: string; note?: string }) => Promise<Order>;
  updateOrderPaymentStatus: (orderId: string, paymentStatus: PaymentStatus, note?: string, transactionId?: string) => Promise<Order>;
  saveCustomerNote: (phone: string, notes: string) => Promise<boolean>;
  updateStoreSettings: (newSettings: Partial<StoreSettings>) => Promise<boolean>;
  createProduct: (productData: Partial<Product>) => Promise<Product>;
  updateProduct: (id: string, productData: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<boolean>;
  createCategory: (catData: Partial<Category>) => Promise<Category>;
  updateCategory: (id: string, catData: Partial<Category>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<boolean>;
  createCoupon: (couponData: Partial<Coupon>) => Promise<Coupon>;
  updateCoupon: (id: string, couponData: Partial<Coupon>) => Promise<Coupon>;
  deleteCoupon: (id: string) => Promise<boolean>;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => Promise<Order>;
  updateOrderNotes: (orderId: string, notes: string) => Promise<Order>;
  refreshAllData: () => Promise<void>;
  resetDemoData: () => Promise<void>;
  
  // Modal states
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  selectedProductForModal: Product | null;
  setSelectedProductForModal: (prod: Product | null) => void;
  confirmedOrder: Order | null;
  setConfirmedOrder: (order: Order | null) => void;
  isAccountModalOpen: boolean;
  setIsAccountModalOpen: (open: boolean) => void;
  isInfoModalOpen: string | null; // e.g. 'about', 'contact', 'faq', 'policy'
  setIsInfoModalOpen: (type: string | null) => void;
  isTrackingModalOpen: boolean;
  setIsTrackingModalOpen: (open: boolean) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('puredrop_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [activeView, setActiveView] = useState<'store' | 'admin' | 'shop'>('store');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('puredrop_admin_token');
  });
  const [adminUser, setAdminUser] = useState<{ email: string; name: string } | null>(() => {
    try {
      const saved = localStorage.getItem('puredrop_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Customer state & persistent token
  const [customer, setCustomer] = useState<CustomerAccount | null>(() => {
    try {
      const saved = localStorage.getItem('puredrop_customer_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [customerToken, setCustomerToken] = useState<string | null>(() => {
    return localStorage.getItem('puredrop_customer_token');
  });

  const [customerPhone, setCustomerPhone] = useState<string>(() => {
    return localStorage.getItem('puredrop_customer_phone') || '';
  });

  // Customer Auth modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [returnToCheckoutAfterAuth, setReturnToCheckoutAfterAuth] = useState(false);

  // UPI QR Payment modal
  const [pendingUpiOrder, setPendingUpiOrder] = useState<Order | null>(null);
  const [isUpiPaymentModalOpen, setIsUpiPaymentModalOpen] = useState(false);

  // Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<string | null>(null);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  // Save cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('puredrop_cart', JSON.stringify(cart));
    } catch (err) {
      console.warn('Failed to save cart to localStorage', err);
    }
  }, [cart]);

  // Load initial data
  const refreshAllData = async () => {
    try {
      const [settingsRes, catRes, prodRes, ordRes, cpnRes] = await Promise.all([
        fetch('/api/settings').then(r => r.json()).catch(() => null),
        fetch('/api/categories').then(r => r.json()).catch(() => []),
        fetch('/api/products').then(r => r.json()).catch(() => []),
        fetch('/api/orders').then(r => r.json()).catch(() => []),
        fetch('/api/coupons').then(r => r.json()).catch(() => []),
      ]);

      if (settingsRes && !settingsRes.error) setSettings(settingsRes);
      if (Array.isArray(catRes)) setCategories(catRes);
      if (Array.isArray(prodRes)) setProducts(prodRes);
      if (Array.isArray(ordRes)) setOrders(ordRes);
      if (Array.isArray(cpnRes)) setCoupons(cpnRes);
    } catch (err) {
      console.error('Error fetching data from server:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Filter customer's own orders reliably
  const myOrders = orders.filter(o => {
    if (customer?.id && o.customerId === customer.id) return true;
    if (customer?.phone && o.customer.phone === customer.phone) return true;
    if (customer?.email && o.customer.email?.toLowerCase() === customer.email.toLowerCase()) return true;
    if (customerPhone && o.customer.phone === customerPhone) return true;
    return false;
  });

  // Cart operations
  const addToCart = (product: Product, variantId?: string, quantity: number = 1): boolean => {
    let effectivePrice = product.salePrice || product.price;
    let unit = product.unit;
    let variantName = undefined;
    let maxStock = product.stockQuantity;

    if (variantId) {
      const v = product.variants.find(va => va.id === variantId);
      if (v) {
        effectivePrice = v.salePrice || v.price;
        unit = v.unit;
        variantName = v.name;
        maxStock = v.stock;
      }
    }

    if (!product.isMadeToOrder && maxStock <= 0) {
      return false; // Out of stock
    }

    const cartItemId = `${product.id}-${variantId || 'default'}`;

    setCart(prev => {
      const existing = prev.find(item => item.id === cartItemId);
      if (existing) {
        const nextQty = existing.quantity + quantity;
        if (!product.isMadeToOrder && nextQty > maxStock) {
          return prev; // cannot exceed stock
        }
        return prev.map(item =>
          item.id === cartItemId ? { ...item, quantity: nextQty } : item
        );
      } else {
        const newItem: CartItem = {
          id: cartItemId,
          productId: product.id,
          variantId,
          name: product.name,
          variantName,
          unit,
          price: product.price,
          salePrice: product.salePrice,
          effectivePrice,
          image: product.images[0] || '',
          quantity,
          maxStock,
          isMadeToOrder: product.isMadeToOrder,
        };
        return [...prev, newItem];
      }
    });

    return true;
  };

  const updateCartQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart(prev =>
      prev.map(item => {
        if (item.id === cartItemId) {
          if (!item.isMadeToOrder && quantity > item.maxStock) {
            return { ...item, quantity: item.maxStock };
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const applyCouponCode = async (code: string): Promise<boolean> => {
    setCouponError(null);
    const subtotal = cart.reduce((acc, item) => acc + item.effectivePrice * item.quantity, 0);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setCouponError(data.message || 'Invalid coupon');
        setAppliedCoupon(null);
        return false;
      }
      setAppliedCoupon(data.coupon);
      return true;
    } catch {
      setCouponError('Network error validating coupon');
      return false;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const openCustomerAuthModal = (mode: 'login' | 'register' | 'forgot' = 'login', returnToCheckout: boolean = false) => {
    setAuthModalMode(mode);
    setReturnToCheckoutAfterAuth(returnToCheckout);
    setIsAuthModalOpen(true);
  };

  const closeCustomerAuthModal = () => {
    setIsAuthModalOpen(false);
    setReturnToCheckoutAfterAuth(false);
  };

  const registerCustomer = async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    address?: string;
    city?: string;
    pincode?: string;
    alternatePhone?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setCustomer(resData.customer);
        setCustomerToken(resData.token);
        setCustomerPhone(resData.customer.phone);
        localStorage.setItem('puredrop_customer_token', resData.token);
        localStorage.setItem('puredrop_customer_profile', JSON.stringify(resData.customer));
        localStorage.setItem('puredrop_customer_phone', resData.customer.phone);
        closeCustomerAuthModal();
        if (returnToCheckoutAfterAuth) {
          setIsCheckoutOpen(true);
        }
        await refreshAllData();
        return { success: true };
      }
      return { success: false, error: resData.error || 'Failed to create customer account' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const loginCustomer = async (emailOrPhone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailOrPhone, password }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setCustomer(resData.customer);
        setCustomerToken(resData.token);
        setCustomerPhone(resData.customer.phone);
        localStorage.setItem('puredrop_customer_token', resData.token);
        localStorage.setItem('puredrop_customer_profile', JSON.stringify(resData.customer));
        localStorage.setItem('puredrop_customer_phone', resData.customer.phone);
        closeCustomerAuthModal();
        if (returnToCheckoutAfterAuth) {
          setIsCheckoutOpen(true);
        }
        await refreshAllData();
        return { success: true };
      }
      return { success: false, error: resData.error || 'Invalid credentials' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const logoutCustomer = () => {
    setCustomer(null);
    setCustomerToken(null);
    localStorage.removeItem('puredrop_customer_token');
    localStorage.removeItem('puredrop_customer_profile');
  };

  const updateCustomerProfile = async (data: Partial<CustomerAccount>): Promise<boolean> => {
    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(customerToken ? { Authorization: `Bearer ${customerToken}` } : {}),
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const resData = await res.json();
        setCustomer(resData.customer);
        localStorage.setItem('puredrop_customer_profile', JSON.stringify(resData.customer));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const submitUpiPaymentRef = async (orderId: string, utrRef: string): Promise<boolean> => {
    const res = await fetch(`/api/orders/${orderId}/upi-ref`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId: utrRef }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit payment reference');
    }
    const data = await res.json();
    setOrders(prev => prev.map(o => (o.id === orderId || o.orderNumber === orderId ? data.order : o)));
    if (confirmedOrder && (confirmedOrder.id === orderId || confirmedOrder.orderNumber === orderId)) {
      setConfirmedOrder(data.order);
    }
    if (pendingUpiOrder && (pendingUpiOrder.id === orderId || pendingUpiOrder.orderNumber === orderId)) {
      setPendingUpiOrder(data.order);
    }
    return true;
  };

  const verifyUpiPayment = async (orderId: string, action: 'verify' | 'reject', reason?: string): Promise<boolean> => {
    const res = await fetch(`/api/orders/${orderId}/verify-upi`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      },
      body: JSON.stringify({ action, reason }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update UPI payment verification');
    }
    const data = await res.json();
    setOrders(prev => prev.map(o => (o.id === orderId || o.orderNumber === orderId ? data.order : o)));
    return true;
  };

  const placeOrder = async (
    custInfo: CustomerInfo,
    deliverySlot: string,
    paymentMethod: PaymentMethod,
    transactionId?: string
  ): Promise<Order> => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(customerToken ? { Authorization: `Bearer ${customerToken}` } : {}),
      },
      body: JSON.stringify({
        customerId: customer?.id,
        customer: custInfo,
        items: cart,
        couponCode: appliedCoupon?.code,
        deliverySlot,
        paymentMethod,
        transactionId,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to place order');
    }

    const createdOrder: Order = await res.json();
    
    // Remember customer phone
    setCustomerPhone(custInfo.phone);
    try {
      localStorage.setItem('puredrop_customer_phone', custInfo.phone);
    } catch {}

    // If UPI or QR code, open dedicated UPI QR modal immediately
    if (paymentMethod === 'upi' || paymentMethod === 'qr_code') {
      setPendingUpiOrder(createdOrder);
      setIsUpiPaymentModalOpen(true);
    }

    // Clear cart and update store data
    clearCart();
    await refreshAllData();
    return createdOrder;
  };

  // Admin actions
  const adminLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminToken(data.token);
        setAdminUser(data.user);
        localStorage.setItem('puredrop_admin_token', data.token);
        if (data.user) {
          localStorage.setItem('puredrop_admin_user', JSON.stringify(data.user));
        }
        return { success: true };
      }
      return { success: false, error: data.error || 'Invalid administrator email or password' };
    } catch {
      return { success: false, error: 'Connection error while contacting server' };
    }
  };

  const adminLogout = () => {
    setAdminToken(null);
    setAdminUser(null);
    localStorage.removeItem('puredrop_admin_token');
    localStorage.removeItem('puredrop_admin_user');
    setActiveView('store');
  };

  const recordOrderPayment = async (
    orderId: string,
    paymentData: { amount: number; method?: PaymentMethod; reference?: string; note?: string }
  ): Promise<Order> => {
    const res = await fetch(`/api/orders/${orderId}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      },
      body: JSON.stringify(paymentData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to record payment');
    }
    const updatedOrder: Order = await res.json();
    setOrders(prev => prev.map(o => (o.id === orderId || o.orderNumber === orderId ? updatedOrder : o)));
    return updatedOrder;
  };

  const updateOrderPaymentStatus = async (
    orderId: string,
    paymentStatus: PaymentStatus,
    note?: string,
    transactionId?: string
  ): Promise<Order> => {
    const res = await fetch(`/api/orders/${orderId}/payment-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      },
      body: JSON.stringify({ paymentStatus, note, transactionId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update payment status');
    }
    const updatedOrder: Order = await res.json();
    setOrders(prev => prev.map(o => (o.id === orderId || o.orderNumber === orderId ? updatedOrder : o)));
    return updatedOrder;
  };

  const saveCustomerNote = async (phone: string, notes: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/customers/${phone}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const updateStoreSettings = async (newSettings: Partial<StoreSettings>): Promise<boolean> => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const createProduct = async (productData: Partial<Product>): Promise<Product> => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create product');
    }
    const created = await res.json();
    setProducts(prev => [created, ...prev]);
    return created;
  };

  const updateProduct = async (id: string, productData: Partial<Product>): Promise<Product> => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update product');
    }
    const updated = await res.json();
    setProducts(prev => prev.map(p => (p.id === id ? updated : p)));
    return updated;
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setProducts(prev => prev.filter(p => p.id !== id));
      return true;
    }
    return false;
  };

  const createCategory = async (catData: Partial<Category>): Promise<Category> => {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(catData),
    });
    if (!res.ok) throw new Error('Failed to create category');
    const created = await res.json();
    setCategories(prev => [...prev, created]);
    return created;
  };

  const updateCategory = async (id: string, catData: Partial<Category>): Promise<Category> => {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(catData),
    });
    if (!res.ok) throw new Error('Failed to update category');
    const updated = await res.json();
    setCategories(prev => prev.map(c => (c.id === id ? updated : c)));
    return updated;
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setCategories(prev => prev.filter(c => c.id !== id));
      return true;
    }
    return false;
  };

  const createCoupon = async (couponData: Partial<Coupon>): Promise<Coupon> => {
    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(couponData),
    });
    if (!res.ok) throw new Error('Failed to create coupon');
    const created = await res.json();
    setCoupons(prev => [...prev, created]);
    return created;
  };

  const updateCoupon = async (id: string, couponData: Partial<Coupon>): Promise<Coupon> => {
    const res = await fetch(`/api/coupons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(couponData),
    });
    if (!res.ok) throw new Error('Failed to update coupon');
    const updated = await res.json();
    setCoupons(prev => prev.map(c => (c.id === id ? updated : c)));
    return updated;
  };

  const deleteCoupon = async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setCoupons(prev => prev.filter(c => c.id !== id));
      return true;
    }
    return false;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, note?: string): Promise<Order> => {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update order status');
    }
    const updated = await res.json();
    setOrders(prev => prev.map(o => (o.id === orderId || o.orderNumber === orderId ? updated : o)));
    return updated;
  };

  const updateOrderNotes = async (orderId: string, internalNotes: string): Promise<Order> => {
    const res = await fetch(`/api/orders/${orderId}/notes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ internalNotes }),
    });
    if (!res.ok) throw new Error('Failed to update notes');
    const updated = await res.json();
    setOrders(prev => prev.map(o => (o.id === orderId || o.orderNumber === orderId ? updated : o)));
    return updated;
  };

  const resetDemoData = async () => {
    await fetch('/api/reset-demo', { method: 'POST' });
    await refreshAllData();
  };

  return (
    <StoreContext.Provider
      value={{
        settings,
        categories,
        products,
        orders,
        coupons,
        cart,
        appliedCoupon,
        couponError,
        isLoading,
        activeView,
        selectedCategory,
        searchQuery,
        adminToken,
        adminUser,
        customerPhone,
        myOrders,
        customer,
        customerToken,
        isCustomerLoggedIn: Boolean(customer && customerToken),
        registerCustomer,
        loginCustomer,
        logoutCustomer,
        updateCustomerProfile,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openCustomerAuthModal,
        closeCustomerAuthModal,
        pendingUpiOrder,
        setPendingUpiOrder,
        isUpiPaymentModalOpen,
        setIsUpiPaymentModalOpen,
        submitUpiPaymentRef,
        verifyUpiPayment,
        setActiveView,
        setSelectedCategory,
        setSearchQuery,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        applyCouponCode,
        removeCoupon,
        placeOrder,
        adminLogin,
        adminLogout,
        recordOrderPayment,
        updateOrderPaymentStatus,
        saveCustomerNote,
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
        refreshAllData,
        resetDemoData,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        selectedProductForModal,
        setSelectedProductForModal,
        confirmedOrder,
        setConfirmedOrder,
        isAccountModalOpen,
        setIsAccountModalOpen,
        isInfoModalOpen,
        setIsInfoModalOpen,
        isTrackingModalOpen,
        setIsTrackingModalOpen,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
}
