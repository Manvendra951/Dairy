import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  MapPin,
  Phone,
  User,
  Mail,
  Clock,
  Banknote,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Lock,
  CheckCircle2,
  Sparkles,
  QrCode,
  Building2,
  CreditCard,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { calculateCartTotals, formatCurrency, isPincodeServiceable } from '../utils/pricing.ts';
import type { CustomerInfo, PaymentMethod } from '../types/dairy.js';

export default function CheckoutModal() {
  const {
    settings,
    cart,
    appliedCoupon,
    isCheckoutOpen,
    setIsCheckoutOpen,
    placeOrder,
    setConfirmedOrder,
    setIsCartOpen,
    customer,
    isCustomerLoggedIn,
    openCustomerAuthModal,
  } = useStore();

  const [form, setForm] = useState<CustomerInfo>(() => {
    const savedPhone = localStorage.getItem('puredrop_customer_phone') || '';
    const savedName = localStorage.getItem('puredrop_customer_name') || '';
    const savedAddress = localStorage.getItem('puredrop_customer_address') || '';
    const savedPin = localStorage.getItem('puredrop_customer_pincode') || '302001';
    return {
      name: savedName,
      phone: savedPhone,
      email: '',
      address: savedAddress,
      city: settings.city || 'Jaipur',
      pincode: savedPin,
      deliveryNotes: '',
    };
  });

  // Pre-fill customer details from authenticated customer profile
  useEffect(() => {
    if (customer) {
      const defaultAddr = customer.savedAddresses?.find(a => a.isDefault) || customer.savedAddresses?.[0];
      setForm(prev => ({
        ...prev,
        name: customer.name || prev.name,
        phone: customer.phone || prev.phone,
        email: customer.email || prev.email,
        address: defaultAddr?.address || prev.address,
        city: defaultAddr?.city || prev.city || settings.city || 'Jaipur',
        pincode: defaultAddr?.pincode || prev.pincode || '302001',
      }));
    }
  }, [customer, settings]);

  const [deliverySlot, setDeliverySlot] = useState('Morning (5:30 AM - 7:30 AM)');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cod');
  const [transferReference, setTransferReference] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // If the currently selected payment method is disabled by store admin, safely fall back to COD
  useEffect(() => {
    if (selectedPaymentMethod === 'upi' && !settings.enableUPI) {
      setSelectedPaymentMethod('cod');
    } else if (selectedPaymentMethod === 'qr_code' && !settings.enableQRCode) {
      setSelectedPaymentMethod('cod');
    } else if (selectedPaymentMethod === 'net_banking' && !settings.enableNetBanking) {
      setSelectedPaymentMethod('cod');
    } else if (selectedPaymentMethod === 'bank_transfer' && !settings.enableBankTransfer) {
      setSelectedPaymentMethod('cod');
    } else if (selectedPaymentMethod === 'gateway' && !settings.enableGateway) {
      setSelectedPaymentMethod('cod');
    }
  }, [settings, selectedPaymentMethod]);

  if (!isCheckoutOpen) return null;

  // Enforce customer login before placing order
  if (!isCustomerLoggedIn) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
        <div className="bg-[#FFFFFF] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-[#DCE9D5] relative animate-in zoom-in-95 duration-200 p-6 sm:p-8 space-y-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#EAF4E5] border border-[#DCE9D5] text-[#397548] flex items-center justify-center mx-auto text-2xl shadow-xs">
            <Lock className="w-8 h-8 text-[#397548]" />
          </div>

          <div className="space-y-2">
            <h2 className="font-bold text-[#26352B] text-xl font-serif-accent">
              Sign In Required to Order
            </h2>
            <p className="text-xs text-[#69766B] leading-relaxed">
              Please sign in to your PureDrop Dairy account or create a new account to place your order with morning delivery tracking and order history.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => {
                setIsCheckoutOpen(false);
                openCustomerAuthModal('login', true);
              }}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#397548] text-white font-bold text-sm shadow-md shadow-[#397548]/20 hover:bg-[#2E5E3A] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setIsCheckoutOpen(false);
                openCustomerAuthModal('register', true);
              }}
              className="w-full py-3 px-5 rounded-2xl bg-[#FAFCF7] text-[#26352B] font-bold text-xs border border-[#DCE9D5] hover:bg-[#EAF4E5] transition-all cursor-pointer"
            >
              <span>Create Account</span>
            </button>

            <button
              onClick={() => {
                setIsCheckoutOpen(false);
                setIsCartOpen(true);
              }}
              className="text-xs text-[#69766B] hover:text-[#26352B] font-semibold cursor-pointer pt-2 block mx-auto"
            >
              ← Return to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  const calculation = calculateCartTotals(cart, appliedCoupon, settings);
  const isPinValid = isPincodeServiceable(form.pincode, settings.serviceablePincodes);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.phone.trim()) {
      errs.phone = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(form.phone.trim().replace(/\D/g, ''))) {
      errs.phone = 'Please enter a valid 10-digit mobile number';
    }
    if (!form.address.trim()) errs.address = 'Delivery address is required';
    if (!form.pincode.trim()) {
      errs.pincode = 'PIN code is required';
    } else if (!isPinValid) {
      errs.pincode = `PIN code ${form.pincode} is outside current delivery area`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const paymentMethodsList = [
    {
      id: 'cod' as PaymentMethod,
      name: 'Cash on Delivery (COD)',
      badge: 'Always Available',
      badgeColor: 'bg-[#EAF4E5] text-[#397548] border-[#DCE9D5]',
      subtitle: 'Pay cash upon morning doorstep delivery',
      description: settings.codInstructions || 'Pay in cash when your order is delivered to your doorstep. Exact change appreciated.',
      icon: Banknote,
      isEnabled: true,
      reasonDisabled: '',
    },
    {
      id: 'upi' as PaymentMethod,
      name: 'UPI (Google Pay, PhonePe, Paytm, BHIM)',
      badge: settings.enableUPI ? 'Available' : 'Currently unavailable',
      badgeColor: settings.enableUPI ? 'bg-[#EAF4E5] text-[#397548] border-[#DCE9D5]' : 'bg-stone-100 text-stone-500 border-stone-200',
      subtitle: 'Instant UPI app transfer with UTR verification',
      description: settings.enableUPI
        ? (settings.upiInstructions || 'Pay securely using any UPI app. Scan QR or enter our UPI ID, then enter your 12-digit UTR/Reference number.')
        : 'Currently unavailable: UPI payment is disabled by store administrator.',
      icon: QrCode,
      isEnabled: Boolean(settings.enableUPI && (settings.upiId?.trim() || settings.upiQrImageUrl?.trim())),
      reasonDisabled: !settings.enableUPI
        ? 'Disabled by store administrator'
        : 'Merchant UPI ID is not configured',
    },
    {
      id: 'qr_code' as PaymentMethod,
      name: 'QR Code Payment',
      badge: settings.enableQRCode ? 'Available' : 'Currently unavailable',
      badgeColor: settings.enableQRCode ? 'bg-[#EAF4E5] text-[#397548] border-[#DCE9D5]' : 'bg-stone-100 text-stone-500 border-stone-200',
      subtitle: 'Scan dynamic QR code on screen or runner device',
      description: settings.enableQRCode
        ? (settings.qrCodeInstructions || 'Scan dynamic order QR code and complete payment in any UPI or banking app.')
        : 'Currently unavailable: QR Code payment is disabled by store administrator.',
      icon: QrCode,
      isEnabled: Boolean(settings.enableQRCode && (settings.upiId?.trim() || settings.upiQrImageUrl?.trim())),
      reasonDisabled: !settings.enableQRCode
        ? 'Disabled by store administrator'
        : 'Merchant QR code is not configured',
    },
    {
      id: 'net_banking' as PaymentMethod,
      name: 'Net Banking',
      badge: settings.enableNetBanking ? 'Available' : 'Currently unavailable',
      badgeColor: settings.enableNetBanking ? 'bg-[#EAF4E5] text-[#397548] border-[#DCE9D5]' : 'bg-stone-100 text-stone-500 border-stone-200',
      subtitle: 'Transfer via your bank’s online banking portal',
      description: settings.enableNetBanking
        ? (settings.netBankingInstructions || 'Transfer via NEFT / RTGS / IMPS through your net banking portal and provide transaction reference.')
        : 'Currently unavailable: Net Banking is disabled by store administrator.',
      icon: Building2,
      isEnabled: Boolean(settings.enableNetBanking && settings.bankAccountNumber?.trim() && settings.bankIfsc?.trim()),
      reasonDisabled: !settings.enableNetBanking
        ? 'Disabled by store administrator'
        : 'Bank account details not configured',
    },
    {
      id: 'bank_transfer' as PaymentMethod,
      name: 'Direct Bank Transfer',
      badge: settings.enableBankTransfer ? 'Available' : 'Currently unavailable',
      badgeColor: settings.enableBankTransfer ? 'bg-[#EAF4E5] text-[#397548] border-[#DCE9D5]' : 'bg-stone-100 text-stone-500 border-stone-200',
      subtitle: 'NEFT / RTGS / IMPS wire transfer',
      description: settings.enableBankTransfer
        ? (settings.bankInstructions || `Transfer directly to ${settings.bankName || 'our bank account'}. Awaiting admin verification.`)
        : 'Currently unavailable: Direct Bank Transfer is disabled by store administrator.',
      icon: Building2,
      isEnabled: Boolean(settings.enableBankTransfer && settings.bankAccountNumber?.trim() && settings.bankIfsc?.trim()),
      reasonDisabled: !settings.enableBankTransfer
        ? 'Disabled by store administrator'
        : 'Bank account details not configured',
    },
    {
      id: 'gateway' as PaymentMethod,
      name: 'Online Payment Gateway',
      badge: settings.enableGateway ? 'Available' : 'Currently unavailable',
      badgeColor: settings.enableGateway ? 'bg-[#EAF4E5] text-[#397548] border-[#DCE9D5]' : 'bg-stone-100 text-stone-500 border-stone-200',
      subtitle: `${settings.gatewayProvider ? settings.gatewayProvider.toUpperCase() : 'Cards & Wallets'} online checkout`,
      description: settings.enableGateway
        ? (settings.gatewayInstructions || 'Credit / Debit Cards, NetBanking, and Digital Wallets processed through secure payment gateway.')
        : 'Currently unavailable: Online payment gateway is disabled by store administrator.',
      icon: CreditCard,
      isEnabled: Boolean(settings.enableGateway && settings.gatewayKeyId?.trim()),
      reasonDisabled: !settings.enableGateway
        ? 'Disabled by store administrator'
        : 'Payment gateway key not configured',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (cart.length === 0) {
      setSubmitError('Your cart is empty');
      return;
    }

    // Validate chosen payment method against live store settings
    if (selectedPaymentMethod === 'upi') {
      if (!settings.enableUPI) {
        setSubmitError('UPI payment is currently disabled by the administrator. Please select Cash on Delivery.');
        return;
      }
      if (!settings.upiId?.trim() && !settings.upiQrImageUrl?.trim()) {
        setSubmitError('UPI payment is temporarily unavailable due to missing merchant configuration. Please select Cash on Delivery.');
        return;
      }
    } else if (selectedPaymentMethod === 'qr_code') {
      if (!settings.enableQRCode) {
        setSubmitError('QR Code payment is currently disabled by the administrator. Please select Cash on Delivery.');
        return;
      }
      if (!settings.upiId?.trim() && !settings.upiQrImageUrl?.trim()) {
        setSubmitError('QR Code payment is temporarily unavailable due to missing merchant configuration. Please select Cash on Delivery.');
        return;
      }
    } else if (selectedPaymentMethod === 'net_banking') {
      if (!settings.enableNetBanking) {
        setSubmitError('Net Banking is currently disabled by the administrator. Please select Cash on Delivery.');
        return;
      }
      if (!settings.bankAccountNumber?.trim() || !settings.bankIfsc?.trim()) {
        setSubmitError('Net Banking is temporarily unavailable due to missing bank configuration. Please select Cash on Delivery.');
        return;
      }
    } else if (selectedPaymentMethod === 'bank_transfer') {
      if (!settings.enableBankTransfer) {
        setSubmitError('Direct Bank Transfer is currently disabled by the administrator. Please select Cash on Delivery.');
        return;
      }
      if (!settings.bankAccountNumber?.trim() || !settings.bankIfsc?.trim()) {
        setSubmitError('Direct Bank Transfer is temporarily unavailable due to missing bank configuration. Please select Cash on Delivery.');
        return;
      }
    } else if (selectedPaymentMethod === 'gateway') {
      if (!settings.enableGateway) {
        setSubmitError('Online Payment Gateway is currently disabled by the administrator. Please select Cash on Delivery.');
        return;
      }
      if (!settings.gatewayKeyId?.trim()) {
        setSubmitError('Online Payment Gateway is temporarily unavailable due to missing gateway credentials. Please select Cash on Delivery.');
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      localStorage.setItem('puredrop_customer_name', form.name);
      localStorage.setItem('puredrop_customer_phone', form.phone);
      localStorage.setItem('puredrop_customer_address', form.address);
      localStorage.setItem('puredrop_customer_pincode', form.pincode);

      const txnRef = transferReference.trim() || undefined;
      const order = await placeOrder(form, deliverySlot, selectedPaymentMethod, txnRef);
      setIsCheckoutOpen(false);
      setConfirmedOrder(order);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#DCE9D5] relative animate-in zoom-in-95 duration-200 max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#DCE9D5] bg-[#FAFCF7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsCheckoutOpen(false);
                setIsCartOpen(true);
              }}
              className="p-1.5 rounded-xl text-[#26352B] hover:bg-[#EAF4E5] cursor-pointer"
              title="Return to cart"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-bold text-[#26352B] text-lg leading-tight font-serif-accent">
                Express Checkout
              </h2>
              <p className="text-xs text-[#69766B]">
                Farm-fresh morning doorstep delivery in chilled crates
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="p-2 text-stone-400 hover:text-[#26352B] rounded-full hover:bg-[#EAF4E5] cursor-pointer"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#FAFCF7]">
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Signed-in Customer Banner */}
          {customer && (
            <div className="p-3 bg-[#EAF4E5]/60 border border-[#DCE9D5] rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#397548]"></span>
                <span className="text-[#26352B]">
                  Logged in as <strong className="font-bold text-[#26352B]">{customer.name}</strong> ({customer.phone})
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCheckoutOpen(false);
                  openCustomerAuthModal('login', true);
                }}
                className="text-[11px] text-[#397548] font-bold hover:underline cursor-pointer"
              >
                Switch Account
              </button>
            </div>
          )}

          {/* Saved Addresses quick-picker */}
          {customer && customer.savedAddresses && customer.savedAddresses.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#69766B] uppercase tracking-wider block">
                Saved Delivery Addresses
              </label>
              <div className="flex flex-wrap gap-2">
                {customer.savedAddresses.map(addr => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => {
                      setForm(prev => ({
                        ...prev,
                        address: addr.address,
                        city: addr.city || prev.city,
                        pincode: addr.pincode,
                      }));
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                      form.address === addr.address
                        ? 'bg-[#397548] text-white border-[#397548] shadow-xs'
                        : 'bg-white text-[#26352B] border-[#DCE9D5] hover:bg-[#EAF4E5]'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{addr.label || 'Saved Address'}</span>
                    <span className="opacity-75 text-[10px]">({addr.pincode})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-white p-4 rounded-2xl border border-[#DCE9D5] space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#397548] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#397548]" />
              <span>1. Contact Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#26352B] block mb-1">
                  Full Name <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Patel"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border bg-[#FAFCF7] focus:bg-white text-[#26352B] outline-hidden transition-all ${
                      errors.name ? 'border-rose-400 focus:border-rose-600' : 'border-[#DCE9D5] focus:border-[#397548]'
                    }`}
                  />
                  <User className="w-4 h-4 text-[#69766B] absolute left-3 top-2.5" />
                </div>
                {errors.name && <p className="text-[11px] text-rose-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="text-xs font-bold text-[#26352B] block mb-1">
                  Mobile Number <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                    className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border bg-[#FAFCF7] focus:bg-white text-[#26352B] outline-hidden transition-all ${
                      errors.phone ? 'border-rose-400 focus:border-rose-600' : 'border-[#DCE9D5] focus:border-[#397548]'
                    }`}
                  />
                  <Phone className="w-4 h-4 text-[#69766B] absolute left-3 top-2.5" />
                </div>
                {errors.phone && <p className="text-[11px] text-rose-600 mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#26352B] block mb-1">
                Email Address <span className="text-[#69766B] font-normal">(for invoice PDF)</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] text-[#26352B] outline-hidden"
                />
                <Mail className="w-4 h-4 text-[#69766B] absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white p-4 rounded-2xl border border-[#DCE9D5] space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#397548] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#397548]" />
              <span>2. Delivery Address</span>
            </h3>

            <div>
              <label className="text-xs font-bold text-[#26352B] block mb-1">
                House / Flat / Street Address <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Flat 304, Royal Greens Apartment, Near Central Park"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl border bg-[#FAFCF7] focus:bg-white text-[#26352B] outline-hidden transition-all ${
                  errors.address ? 'border-rose-400 focus:border-rose-600' : 'border-[#DCE9D5] focus:border-[#397548]'
                }`}
              />
              {errors.address && <p className="text-[11px] text-rose-600 mt-1">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#26352B] block mb-1">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white text-[#26352B] outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#26352B] block mb-1">
                  Delivery PIN Code <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="302001"
                  value={form.pincode}
                  onChange={e => setForm({ ...form, pincode: e.target.value })}
                  className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl border bg-[#FAFCF7] focus:bg-white text-[#26352B] outline-hidden ${
                    errors.pincode
                      ? 'border-rose-400 focus:border-rose-600'
                      : 'border-[#DCE9D5] focus:border-[#397548]'
                  }`}
                />
                {errors.pincode && <p className="text-[11px] text-rose-600 mt-1">{errors.pincode}</p>}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#26352B] block mb-1">
                Delivery Instructions (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Leave milk in door basket, ring bell once"
                value={form.deliveryNotes}
                onChange={e => setForm({ ...form, deliveryNotes: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] text-[#26352B] outline-hidden"
              />
            </div>
          </div>

          {/* Delivery Slot Selection */}
          <div className="bg-white p-4 rounded-2xl border border-[#DCE9D5] space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#397548] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#397548]" />
              <span>3. Preferred Delivery Slot</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  deliverySlot.includes('Morning')
                    ? 'border-[#397548] bg-[#EAF4E5]/50 ring-1 ring-[#397548]'
                    : 'border-[#DCE9D5] bg-white hover:bg-[#FAFCF7]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="slot"
                    checked={deliverySlot.includes('Morning')}
                    onChange={() => setDeliverySlot('Morning (5:30 AM - 7:30 AM)')}
                    className="accent-[#397548]"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#26352B]">🌅 Morning Slot (Dawn Batch)</p>
                    <p className="text-[11px] text-[#69766B]">5:30 AM - 7:30 AM</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase text-[#397548] bg-[#DCE9D5] px-2 py-0.5 rounded-md">
                  Recommended
                </span>
              </label>

              <label
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  deliverySlot.includes('Evening')
                    ? 'border-[#397548] bg-[#EAF4E5]/50 ring-1 ring-[#397548]'
                    : 'border-[#DCE9D5] bg-white hover:bg-[#FAFCF7]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="slot"
                    checked={deliverySlot.includes('Evening')}
                    onChange={() => setDeliverySlot('Evening (5:00 PM - 7:00 PM)')}
                    className="accent-[#397548]"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#26352B]">🌆 Evening Slot</p>
                    <p className="text-[11px] text-[#69766B]">5:00 PM - 7:00 PM</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Payment Method - Dynamic Admin-Controlled Options */}
          <div className="bg-white p-4 rounded-2xl border border-[#DCE9D5] space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#397548] flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-[#397548]" />
                <span>4. Payment Method</span>
              </h3>
              <span className="text-[10px] text-[#397548] font-bold bg-[#EAF4E5] px-2.5 py-0.5 rounded-full border border-[#DCE9D5]">
                {selectedPaymentMethod === 'cod' ? 'Cash on Delivery' : 'Online / Bank Payment'}
              </span>
            </div>

            <p className="text-xs text-[#69766B]">
              Select an enabled payment option. Cash on Delivery is always active and selectable.
            </p>

            <div className="space-y-2.5">
              {paymentMethodsList.map(method => {
                const IconComponent = method.icon;
                const isSelected = selectedPaymentMethod === method.id;
                const isSelectable = method.isEnabled;

                return (
                  <div
                    key={method.id}
                    onClick={() => {
                      if (isSelectable) {
                        setSelectedPaymentMethod(method.id);
                      }
                    }}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                      !isSelectable
                        ? 'border-stone-200 bg-stone-50/70 opacity-60 cursor-not-allowed select-none'
                        : isSelected
                        ? 'border-2 border-[#397548] bg-[#EAF4E5]/40 shadow-xs cursor-pointer'
                        : 'border-[#DCE9D5] bg-white hover:bg-[#FAFCF7] cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          id={`pay-method-${method.id}`}
                          name="paymentMethod"
                          value={method.id}
                          checked={isSelected}
                          disabled={!isSelectable}
                          aria-disabled={!isSelectable}
                          onChange={() => {
                            if (isSelectable) setSelectedPaymentMethod(method.id);
                          }}
                          className={`mt-1 accent-[#397548] ${
                            !isSelectable ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                          }`}
                        />
                        <div>
                          <label
                            htmlFor={`pay-method-${method.id}`}
                            className={`font-bold text-xs sm:text-sm block ${
                              !isSelectable
                                ? 'text-stone-400 cursor-not-allowed'
                                : 'text-[#26352B] cursor-pointer'
                            }`}
                          >
                            {method.name}
                          </label>
                          <p className="text-[11px] text-[#69766B] mt-0.5">
                            {method.subtitle}
                          </p>
                          <p className={`text-[11px] mt-1 leading-relaxed ${!isSelectable ? 'text-stone-500 italic' : 'text-[#26352B]'}`}>
                            {method.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${method.badgeColor}`}
                        >
                          {method.badge}
                        </span>
                        <IconComponent
                          className={`w-4 h-4 ${
                            !isSelectable
                              ? 'text-stone-300'
                              : isSelected
                              ? 'text-[#397548]'
                              : 'text-stone-400'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Additional fields when bank transfer or net banking is selected */}
                    {isSelected && (method.id === 'bank_transfer' || method.id === 'net_banking') && (
                      <div className="mt-3 pt-3 border-t border-[#DCE9D5] bg-white p-3 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-[#397548]">
                          <Building2 className="w-4 h-4" />
                          <span>Dairy Bank Account Details for Wire Transfer:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#26352B] bg-[#FAFCF7] p-2.5 rounded-lg border border-[#DCE9D5]">
                          <div><span className="text-[#69766B]">Bank:</span> <strong>{settings.bankName || 'HDFC Bank'}</strong></div>
                          <div><span className="text-[#69766B]">Account:</span> <strong>{settings.bankAccountNumber || '50200088921045'}</strong></div>
                          <div><span className="text-[#69766B]">IFSC:</span> <strong>{settings.bankIfsc || 'HDFC0001234'}</strong></div>
                          <div><span className="text-[#69766B]">Account Name:</span> <strong>{settings.bankAccountName || 'PureDrop Dairy'}</strong></div>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-[#26352B] block mb-1">
                            Bank Transaction Reference / UTR Number (Optional):
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. UTR123456789"
                            value={transferReference}
                            onChange={e => setTransferReference(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#DCE9D5] bg-white focus:border-[#397548] outline-hidden"
                          />
                        </div>
                      </div>
                    )}

                    {isSelected && (method.id === 'upi' || method.id === 'qr_code') && (
                      <div className="mt-3 pt-2.5 border-t border-[#DCE9D5] text-[11px] text-[#397548] flex items-center gap-1.5 font-medium">
                        <QrCode className="w-4 h-4 shrink-0" />
                        <span>Dynamic QR code will pop up right after you place order to scan & submit your UTR.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simple Order Summary */}
          <div className="bg-white p-4 rounded-2xl border border-[#DCE9D5] space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#397548] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#397548]" />
              <span>5. Order Summary</span>
            </h3>

            {/* List of Cart Items */}
            <div className="divide-y divide-[#E2ECE0] max-h-40 overflow-y-auto pr-1">
              {cart.map(item => (
                <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-8 h-8 rounded-lg object-cover shrink-0 border border-[#DCE9D5]"
                    />
                    <div className="truncate">
                      <p className="font-semibold text-[#26352B] truncate">{item.name}</p>
                      <p className="text-[10px] text-[#69766B]">
                        {item.variantName || item.unit} × {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-[#26352B] shrink-0">
                    {formatCurrency(item.effectivePrice * item.quantity, settings.currencySymbol)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="pt-2 border-t border-[#E2ECE0] space-y-1.5 text-xs text-[#69766B]">
              <div className="flex justify-between">
                <span>Items Subtotal ({calculation.itemCount} items)</span>
                <span className="text-[#26352B]">{formatCurrency(calculation.subtotal, settings.currencySymbol)}</span>
              </div>
              {calculation.discount > 0 && (
                <div className="flex justify-between text-[#397548] font-bold">
                  <span>Coupon Discount ({calculation.appliedCoupon?.code})</span>
                  <span>-{formatCurrency(calculation.discount, settings.currencySymbol)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Doorstep Delivery Charge</span>
                <span>
                  {calculation.deliveryFee === 0 ? (
                    <span className="text-[#397548] font-bold">FREE</span>
                  ) : (
                    <span className="text-[#26352B]">{formatCurrency(calculation.deliveryFee, settings.currencySymbol)}</span>
                  )}
                </span>
              </div>
              <div className="pt-2 border-t border-[#E2ECE0] flex justify-between text-base font-bold text-[#26352B]">
                <span>
                  Total Amount Due (
                  {selectedPaymentMethod === 'cod'
                    ? 'COD'
                    : selectedPaymentMethod === 'upi'
                    ? 'UPI'
                    : selectedPaymentMethod === 'qr_code'
                    ? 'QR Code'
                    : selectedPaymentMethod === 'net_banking'
                    ? 'Net Banking'
                    : selectedPaymentMethod === 'bank_transfer'
                    ? 'Bank Transfer'
                    : 'Gateway'}
                  )
                </span>
                <span className="text-[#397548] text-lg font-black">
                  {formatCurrency(calculation.total, settings.currencySymbol)}
                </span>
              </div>
            </div>
          </div>

          {/* Place Order CTA Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#397548] text-white font-bold text-sm shadow-lg shadow-[#397548]/20 hover:bg-[#2E5E3A] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Placing Order...</span>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-emerald-200" />
                <span>Place Order ({formatCurrency(calculation.total, settings.currencySymbol)})</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
