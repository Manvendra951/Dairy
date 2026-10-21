import React, { useState } from 'react';
import { CheckCircle2, Printer, Download, Truck, ArrowRight, X, Clock, MapPin, Banknote, FileText, QrCode, Building2, CreditCard } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { formatCurrency } from '../utils/pricing.ts';
import { downloadInvoicePDF, downloadOrderDetailsPDF } from '../utils/pdfGenerator.ts';
import type { OrderStatus } from '../types/dairy.js';

const STATUS_STEPS: OrderStatus[] = [
  'New Order',
  'Confirmed',
  'Preparing',
  'Out for Delivery',
  'Delivered',
];

export default function OrderConfirmationModal() {
  const { confirmedOrder, setConfirmedOrder, settings, setActiveView } = useStore();
  const [downloading, setDownloading] = useState(false);

  if (!confirmedOrder) return null;

  const currentStepIndex = STATUS_STEPS.indexOf(confirmedOrder.status);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadInvoice = () => {
    setDownloading(true);
    const success = downloadInvoicePDF(confirmedOrder, settings);
    setDownloading(false);
    if (!success) {
      alert('Could not generate PDF. Please try printing directly.');
    }
  };

  const handleDownloadOrderDetails = () => {
    setDownloading(true);
    const success = downloadOrderDetailsPDF(confirmedOrder, settings, false);
    setDownloading(false);
    if (!success) {
      alert('Could not generate PDF. Please try printing directly.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#DCE9D5] relative animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header (Fresh Forest Green #2E5E3A) */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-[#2E5E3A] via-[#397548] to-[#2E5E3A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#EAF4E5]">
                Order Placed Successfully!
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-serif-accent">
                Order #{confirmedOrder.orderNumber}
              </h2>
            </div>
          </div>

          <button
            onClick={() => setConfirmedOrder(null)}
            className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 cursor-pointer"
            aria-label="Close confirmation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#FAFCF7]" id="printable-receipt">
          {/* Payment Notice Banner */}
          <div className="p-4 bg-[#EAF4E5] border border-[#DCE9D5] rounded-2xl flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#397548] text-white flex items-center justify-center shrink-0 mt-0.5">
              {confirmedOrder.paymentMethod === 'cod' ? (
                <Banknote className="w-5 h-5" />
              ) : confirmedOrder.paymentMethod === 'upi' || confirmedOrder.paymentMethod === 'qr_code' ? (
                <QrCode className="w-5 h-5" />
              ) : confirmedOrder.paymentMethod === 'bank_transfer' || confirmedOrder.paymentMethod === 'net_banking' ? (
                <Building2 className="w-5 h-5" />
              ) : (
                <CreditCard className="w-5 h-5" />
              )}
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-[#26352B] text-sm">
                {confirmedOrder.paymentMethod === 'cod'
                  ? 'Cash on Delivery (COD) Confirmed'
                  : confirmedOrder.paymentMethod === 'upi'
                  ? 'UPI Payment Initiated'
                  : confirmedOrder.paymentMethod === 'qr_code'
                  ? 'QR Code Payment Initiated'
                  : confirmedOrder.paymentMethod === 'net_banking'
                  ? 'Net Banking Order Placed'
                  : confirmedOrder.paymentMethod === 'bank_transfer'
                  ? 'Direct Bank Transfer Order Placed'
                  : 'Online Payment Gateway Order'}
              </h3>
              <p className="text-xs text-[#26352B] font-medium">
                {confirmedOrder.paymentMethod === 'cod'
                  ? 'Pay in cash when your order is delivered to your doorstep.'
                  : confirmedOrder.paymentMethod === 'upi' || confirmedOrder.paymentMethod === 'qr_code'
                  ? 'Scan the UPI QR code and submit your 12-digit transaction UTR number.'
                  : confirmedOrder.paymentMethod === 'net_banking' || confirmedOrder.paymentMethod === 'bank_transfer'
                  ? `Please transfer ${formatCurrency(confirmedOrder.total, settings.currencySymbol)} to our bank account.`
                  : 'Processed via secure payment gateway.'}
              </p>
              <p className="text-[11px] text-[#69766B]">
                {confirmedOrder.paymentMethod === 'cod' ? (
                  <>
                    Please keep exact cash ready of{' '}
                    <strong>{formatCurrency(confirmedOrder.total, settings.currencySymbol)}</strong> for our morning delivery runner. Payment status will be updated upon doorstep collection.
                  </>
                ) : confirmedOrder.paymentMethod === 'net_banking' || confirmedOrder.paymentMethod === 'bank_transfer' ? (
                  <>
                    Bank: <strong>{settings.bankName || 'HDFC Bank'}</strong> • A/C:{' '}
                    <strong>{settings.bankAccountNumber || '50200088921045'}</strong> • IFSC:{' '}
                    <strong>{settings.bankIfsc || 'HDFC0001234'}</strong> • Name:{' '}
                    <strong>{settings.bankAccountName || 'PureDrop Dairy'}</strong>
                  </>
                ) : (
                  <>
                    Amount due: <strong>{formatCurrency(confirmedOrder.total, settings.currencySymbol)}</strong>. Our team verifies payments and dispatches with morning dawn harvest.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Order Progress Stepper */}
          <div className="p-4 bg-white rounded-2xl border border-[#DCE9D5] shadow-xs">
            <h4 className="text-xs font-bold text-[#69766B] uppercase tracking-wider mb-3">
              Delivery Progress
            </h4>
            <div className="grid grid-cols-5 gap-1 relative text-center">
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = idx <= (currentStepIndex >= 0 ? currentStepIndex : 0);
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={step} className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-[#397548] text-white ring-4 ring-[#EAF4E5] scale-110'
                          : isPassed
                          ? 'bg-[#2E5E3A] text-white'
                          : 'bg-[#DCE9D5] text-stone-400'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span
                      className={`text-[10px] mt-1.5 leading-tight font-bold ${
                        isCurrent
                          ? 'text-[#397548]'
                          : isPassed
                          ? 'text-[#26352B]'
                          : 'text-stone-400'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery & Schedule Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-white rounded-2xl border border-[#DCE9D5] space-y-1.5 shadow-xs">
              <span className="font-bold text-[#397548] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#397548]" />
                Delivery Time Slot
              </span>
              <p className="font-bold text-[#26352B] text-sm">{confirmedOrder.deliverySlot}</p>
              <p className="text-[#69766B] text-[11px]">
                Packed fresh in chilled insulated totes before dispatch.
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-[#DCE9D5] space-y-1.5 shadow-xs">
              <span className="font-bold text-[#397548] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#397548]" />
                Delivery Address
              </span>
              <p className="font-bold text-[#26352B]">{confirmedOrder.customer.name}</p>
              <p className="text-[#69766B] truncate">{confirmedOrder.customer.address}</p>
              <p className="text-[#69766B]">
                {confirmedOrder.customer.city} - {confirmedOrder.customer.pincode} • Phone: {confirmedOrder.customer.phone}
              </p>
            </div>
          </div>

          {/* Items Summary Table */}
          <div className="border border-[#DCE9D5] rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="px-4 py-2.5 bg-[#FAFCF7] border-b border-[#DCE9D5] text-xs font-bold text-[#397548] uppercase tracking-wider">
              Items Ordered ({confirmedOrder.items.length})
            </div>
            <div className="divide-y divide-[#E2ECE0]">
              {confirmedOrder.items.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover border border-[#DCE9D5]"
                    />
                    <div>
                      <p className="font-bold text-[#26352B]">{item.name}</p>
                      <p className="text-[#69766B]">
                        {item.variantName || item.unit} × {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-[#397548]">
                    {formatCurrency(item.totalPrice, settings.currencySymbol)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="p-3.5 bg-[#FAFCF7] border-t border-[#DCE9D5] text-xs space-y-1.5">
              <div className="flex justify-between text-[#69766B]">
                <span>Subtotal</span>
                <span>{formatCurrency(confirmedOrder.subtotal, settings.currencySymbol)}</span>
              </div>
              {confirmedOrder.discount > 0 && (
                <div className="flex justify-between text-[#397548] font-bold">
                  <span>Discount ({confirmedOrder.couponCode})</span>
                  <span>-{formatCurrency(confirmedOrder.discount, settings.currencySymbol)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#69766B]">
                <span>Delivery Charge</span>
                <span>
                  {confirmedOrder.deliveryFee === 0 ? (
                    <span className="text-[#397548] font-bold">FREE</span>
                  ) : (
                    formatCurrency(confirmedOrder.deliveryFee, settings.currencySymbol)
                  )}
                </span>
              </div>
              <div className="pt-2 border-t border-[#DCE9D5] flex justify-between font-bold text-sm text-[#26352B]">
                <span>
                  Amount Due (
                  {confirmedOrder.paymentMethod === 'cod'
                    ? 'Cash on Delivery'
                    : confirmedOrder.paymentMethod === 'upi'
                    ? 'UPI'
                    : confirmedOrder.paymentMethod === 'qr_code'
                    ? 'QR Code'
                    : confirmedOrder.paymentMethod === 'net_banking'
                    ? 'Net Banking'
                    : confirmedOrder.paymentMethod === 'bank_transfer'
                    ? 'Bank Transfer'
                    : 'Online Gateway'}
                  )
                </span>
                <span className="text-[#397548] text-base font-extrabold">
                  {formatCurrency(confirmedOrder.total, settings.currencySymbol)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: PDF, Print & Continue */}
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={handleDownloadInvoice}
                disabled={downloading}
                className="px-4 py-2.5 rounded-xl border border-[#DCE9D5] hover:border-[#397548] hover:bg-[#EAF4E5] text-[#26352B] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-[#397548]" />
                <span>Invoice PDF</span>
              </button>

              <button
                onClick={handleDownloadOrderDetails}
                disabled={downloading}
                className="px-4 py-2.5 rounded-xl border border-[#DCE9D5] hover:border-[#397548] hover:bg-[#EAF4E5] text-[#26352B] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-[#69766B]" />
                <span>Order Slip PDF</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-4 py-2.5 rounded-xl border border-[#DCE9D5] hover:border-[#397548] hover:bg-[#EAF4E5] text-[#26352B] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-[#397548]" />
                <span>Print Invoice</span>
              </button>
            </div>

            <button
              onClick={() => {
                setConfirmedOrder(null);
                setActiveView('store');
              }}
              className="w-full px-6 py-3.5 rounded-2xl bg-[#397548] text-white font-bold text-xs hover:bg-[#2E5E3A] shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <span>Back to Store & Continue Shopping</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
