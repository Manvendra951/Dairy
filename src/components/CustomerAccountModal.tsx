import React, { useState } from 'react';
import { X, User, Package, MapPin, Phone, RefreshCw, ShoppingBag, ArrowRight, Download, LogOut } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { formatCurrency } from '../utils/pricing.ts';
import { downloadInvoicePDF } from '../utils/pdfGenerator.ts';

export default function CustomerAccountModal() {
  const {
    isAccountModalOpen,
    setIsAccountModalOpen,
    myOrders,
    customer,
    customerPhone,
    settings,
    addToCart,
    products,
    setIsCartOpen,
    logoutCustomer,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');

  if (!isAccountModalOpen) return null;

  const handleReorder = (order: typeof myOrders[0]) => {
    for (const item of order.items) {
      const matchProduct = products.find(p => p.id === item.productId);
      if (matchProduct) {
        addToCart(matchProduct, item.variantId, item.quantity);
      }
    }
    setIsAccountModalOpen(false);
    setIsCartOpen(true);
  };

  const handleLogout = () => {
    logoutCustomer();
    setIsAccountModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-[#DCE9D5] relative animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#DCE9D5] bg-[#FAFCF7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#397548] text-white flex items-center justify-center shadow-xs">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-[#26352B] text-lg leading-tight font-serif-accent">
                Customer Account
              </h2>
              <p className="text-xs text-[#69766B]">
                {customer?.name ? `${customer.name} • ` : ''}
                {customer?.phone ? `+91 ${customer.phone}` : customerPhone ? `+91 ${customerPhone}` : 'Account details'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl border border-[#DCE9D5] text-[#26352B] hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
            <button
              onClick={() => setIsAccountModalOpen(false)}
              className="p-2 text-stone-400 hover:text-[#26352B] rounded-full hover:bg-[#EAF4E5] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#DCE9D5] px-6 bg-[#FAFCF7]/50">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer mr-6 ${
              activeTab === 'orders'
                ? 'border-[#397548] text-[#397548] font-extrabold'
                : 'border-transparent text-[#69766B] hover:text-[#26352B]'
            }`}
          >
            My Orders ({myOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-[#397548] text-[#397548] font-extrabold'
                : 'border-transparent text-[#69766B] hover:text-[#26352B]'
            }`}
          >
            Saved Delivery Address
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#FAFCF7]">
          {activeTab === 'orders' ? (
            myOrders.length === 0 ? (
              <div className="text-center py-8 space-y-3 text-[#69766B]">
                <Package className="w-12 h-12 text-[#DCE9D5] mx-auto" />
                <p className="font-semibold text-[#26352B] text-sm">No orders placed yet</p>
                <p className="text-xs text-[#69766B] max-w-xs mx-auto">
                  Orders placed with your customer account will appear here for easy reordering, status tracking, and PDF invoices.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders.map(order => (
                  <div
                    key={order.id}
                    className="p-4 bg-white hover:bg-white/90 rounded-2xl border border-[#DCE9D5] space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#26352B] text-sm">
                          Order #{order.orderNumber}
                        </span>
                        <p className="text-[11px] text-[#69766B]">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            dateStyle: 'medium',
                          })}{' '}
                          • {order.deliverySlot}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#EAF4E5] text-[#397548] border border-[#DCE9D5]">
                          {order.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                          {order.paymentStatus === 'paid' ? 'Paid' : 'COD Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Order items short list */}
                    <div className="divide-y divide-[#E2ECE0] text-xs">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="py-1.5 flex justify-between text-[#69766B]">
                          <span>
                            {item.name} ({item.variantName || item.unit}) × {item.quantity}
                          </span>
                          <span className="font-semibold text-[#26352B]">
                            {formatCurrency(item.totalPrice, settings.currencySymbol)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="pt-2 border-t border-[#E2ECE0] flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] text-[#69766B] block">Total Amount:</span>
                        <span className="font-extrabold text-[#397548] text-sm">
                          {formatCurrency(order.total, settings.currencySymbol)} (Cash on Delivery)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadInvoicePDF(order, settings)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-[#DCE9D5] hover:border-[#397548] text-xs font-semibold text-[#397548] flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                          title="Download PDF invoice"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Invoice PDF</span>
                        </button>

                        <button
                          onClick={() => handleReorder(order)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#397548] text-white hover:bg-[#2E5E3A] text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reorder All</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Profile tab */
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-white rounded-2xl border border-[#DCE9D5] space-y-3 shadow-xs">
                <h4 className="font-bold text-[#26352B] text-sm">Customer Profile & Address</h4>
                <div className="space-y-1.5 text-[#69766B]">
                  <p>
                    <strong className="text-[#26352B]">Full Name:</strong>{' '}
                    {customer?.name || localStorage.getItem('puredrop_customer_name') || 'Guest Customer'}
                  </p>
                  <p>
                    <strong className="text-[#26352B]">Mobile Phone:</strong>{' '}
                    +91 {customer?.phone || customerPhone || 'Not set'}
                  </p>
                  <p>
                    <strong className="text-[#26352B]">Email Address:</strong>{' '}
                    {customer?.email || 'None on file'}
                  </p>
                  <p>
                    <strong className="text-[#26352B]">Delivery Address:</strong>{' '}
                    {customer?.savedAddresses?.[0]?.address || localStorage.getItem('puredrop_customer_address') || 'Not saved yet'}
                  </p>
                  <p>
                    <strong className="text-[#26352B]">PIN Code:</strong>{' '}
                    {customer?.savedAddresses?.[0]?.pincode || localStorage.getItem('puredrop_customer_pincode') || '302001'}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#EAF4E5]/60 rounded-2xl border border-[#DCE9D5] text-[#26352B] space-y-1.5">
                <p className="font-bold text-[#397548]">Fresh Morning Doorstep Delivery Notice</p>
                <p className="text-[11px] leading-relaxed text-[#69766B]">
                  Our delivery executive deposits fresh chilled dairy bottles directly to your doorstep in insulated totes by 7:30 AM. Payment is collected via Cash on Delivery.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
