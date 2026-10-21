import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Sparkles, Tag, Check, AlertCircle, ShieldCheck, Lock, Banknote } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { calculateCartTotals, formatCurrency } from '../utils/pricing.ts';

export default function CartDrawer() {
  const {
    settings,
    cart,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
    couponError,
    setIsCheckoutOpen,
    isCustomerLoggedIn,
    openCustomerAuthModal,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  if (!isCartOpen) return null;

  const calculation = calculateCartTotals(cart, appliedCoupon, settings);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    await applyCouponCode(couponInput.trim());
    setCouponLoading(false);
  };

  const freeDeliveryProgress = Math.min(
    100,
    Math.round((calculation.subtotal / (settings.freeDeliveryThreshold || 499)) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] w-full max-w-md h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[#DCE9D5] flex items-center justify-between bg-[#FAFCF7]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#397548] text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-[#26352B] text-base leading-none font-serif-accent">
                View Cart
              </h2>
              <span className="text-xs text-[#69766B] font-medium">
                {calculation.itemCount} item{calculation.itemCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-stone-400 hover:text-rose-600 transition-colors px-2 py-1 cursor-pointer font-medium"
                title="Clear entire cart"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-stone-500 hover:text-[#26352B] rounded-full hover:bg-[#EAF4E5] transition-colors cursor-pointer"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Free Delivery Banner Progress */}
        {cart.length > 0 && (
          <div className="bg-[#EAF4E5]/50 px-4 py-2.5 border-b border-[#DCE9D5] text-xs">
            {calculation.freeDeliveryRemaining > 0 ? (
              <div className="space-y-1.5">
                <p className="text-[#26352B] font-medium flex items-center justify-between">
                  <span>
                    Add <strong className="font-bold text-[#397548]">{formatCurrency(calculation.freeDeliveryRemaining, settings.currencySymbol)}</strong> more for <span className="text-[#397548] font-bold uppercase">FREE Morning Delivery</span>!
                  </span>
                  <span className="text-[11px] font-bold text-[#69766B]">{freeDeliveryProgress}%</span>
                </p>
                <div className="w-full bg-[#DCE9D5] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#397548] h-full rounded-full transition-all duration-300"
                    style={{ width: `${freeDeliveryProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[#397548] font-bold">
                <Sparkles className="w-4 h-4 text-[#397548]" />
                <span>You unlocked FREE Morning Doorstep Delivery!</span>
              </div>
            )}
          </div>
        )}

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#FAFCF7]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 text-[#69766B]">
              <div className="w-16 h-16 rounded-2xl bg-white border border-[#DCE9D5] flex items-center justify-center text-2xl shadow-xs">
                🥛
              </div>
              <div>
                <h3 className="font-bold text-[#26352B] text-base font-serif-accent">
                  Your cart is empty
                </h3>
                <p className="text-xs text-[#69766B] mt-1 max-w-xs">
                  Discover delicious farm fresh cow milk, A2 milk, bilona ghee, and soft malai paneer.
                </p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="px-6 py-2.5 rounded-full bg-[#397548] text-white text-xs font-bold hover:bg-[#2E5E3A] shadow-xs cursor-pointer"
              >
                Shop Products
              </button>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.id}
                className="p-3 bg-white hover:bg-white/90 rounded-2xl border border-[#DCE9D5] flex items-center gap-3 transition-colors shadow-xs"
              >
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=200&q=80'}
                  alt={item.name}
                  className="w-16 h-16 rounded-xl object-cover border border-[#DCE9D5] shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-[#26352B] truncate">{item.name}</h4>
                  <p className="text-[11px] text-[#69766B]">
                    {item.variantName || item.unit}
                  </p>
                  <p className="text-xs font-bold text-[#397548] mt-0.5">
                    {formatCurrency(item.effectivePrice * item.quantity, settings.currencySymbol)}
                    {item.quantity > 1 && (
                      <span className="text-[10px] text-stone-400 font-normal ml-1">
                        ({formatCurrency(item.effectivePrice, settings.currencySymbol)} each)
                      </span>
                    )}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex items-center bg-[#FAFCF7] border border-[#DCE9D5] rounded-lg p-0.5 shadow-2xs">
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center text-[#26352B] hover:bg-[#EAF4E5] rounded-md cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-[#26352B]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => {
                        if (!item.isMadeToOrder && item.quantity >= item.maxStock) return;
                        updateCartQuantity(item.id, item.quantity + 1);
                      }}
                      disabled={!item.isMadeToOrder && item.quantity >= item.maxStock}
                      className="w-6 h-6 flex items-center justify-center text-[#26352B] hover:bg-[#EAF4E5] rounded-md disabled:opacity-40 cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-stone-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                    title="Remove item"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer & Order Summary */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[#DCE9D5] bg-white space-y-4">
            {/* Coupon Code Input */}
            <div>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 bg-[#EAF4E5]/50 border border-[#DCE9D5] rounded-xl text-xs text-[#26352B] font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-[#397548]" />
                    <span>
                      Coupon <strong className="font-bold text-[#397548]">{appliedCoupon.code}</strong> applied (-{formatCurrency(calculation.discount, settings.currencySymbol)})
                    </span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-rose-600 hover:underline font-bold text-xs cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-1">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Discount coupon code"
                        value={couponInput}
                        onChange={e => setCouponInput(e.target.value.toUpperCase())}
                        className="w-full pl-8 pr-3 py-2 text-xs uppercase bg-[#FAFCF7] border border-[#DCE9D5] focus:border-[#397548] rounded-xl outline-hidden text-[#26352B]"
                      />
                      <Tag className="w-3.5 h-3.5 text-[#69766B] absolute left-2.5 top-2.5" />
                    </div>
                    <button
                      type="submit"
                      disabled={couponLoading || !couponInput.trim()}
                      className="px-4 py-2 bg-[#397548] text-white rounded-xl text-xs font-bold hover:bg-[#2E5E3A] disabled:opacity-40 cursor-pointer"
                    >
                      {couponLoading ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-[11px] text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {couponError}
                    </p>
                  )}
                  <p className="text-[10px] text-[#69766B]">
                    Try promo code: <code className="bg-[#EAF4E5] px-1 py-0.5 rounded text-[#397548] font-bold">FRESH10</code> for 10% off
                  </p>
                </form>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs text-[#69766B]">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-[#26352B]">
                  {formatCurrency(calculation.subtotal, settings.currencySymbol)}
                </span>
              </div>

              {calculation.discount > 0 && (
                <div className="flex justify-between text-[#397548] font-bold">
                  <span>Coupon Discount</span>
                  <span>-{formatCurrency(calculation.discount, settings.currencySymbol)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Doorstep Delivery</span>
                <span>
                  {calculation.deliveryFee === 0 ? (
                    <span className="text-[#397548] font-bold uppercase">FREE</span>
                  ) : (
                    <span className="text-[#26352B]">{formatCurrency(calculation.deliveryFee, settings.currencySymbol)}</span>
                  )}
                </span>
              </div>

              <div className="pt-2 border-t border-[#DCE9D5] flex justify-between text-base font-bold text-[#26352B]">
                <span>Total Amount (COD)</span>
                <span className="text-[#397548] text-lg font-black">
                  {formatCurrency(calculation.total, settings.currencySymbol)}
                </span>
              </div>
            </div>

            {/* Cash on Delivery Notice */}
            <div className="p-2.5 bg-[#FAFCF7] border border-[#DCE9D5] rounded-xl flex items-center gap-2 text-xs text-[#26352B]">
              <Banknote className="w-4 h-4 text-[#397548] shrink-0" />
              <span>Cash on Delivery: Pay in cash when your order is delivered.</span>
            </div>

            {/* Mandatory Customer Login Notice */}
            {!isCustomerLoggedIn && (
              <div className="p-3 bg-[#EAF4E5] border border-[#DCE9D5] rounded-2xl flex items-center gap-2.5 text-xs text-[#26352B]">
                <ShieldCheck className="w-4 h-4 text-[#397548] shrink-0" />
                <p className="leading-tight">
                  <strong className="font-bold text-[#26352B]">Sign In Required:</strong> Customers must sign in or register before placing an order.
                </p>
              </div>
            )}

            {/* Checkout CTA */}
            <button
              onClick={() => {
                if (!isCustomerLoggedIn) {
                  setIsCartOpen(false);
                  openCustomerAuthModal('login', true);
                  return;
                }
                setIsCartOpen(false);
                setIsCheckoutOpen(true);
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#397548] text-white font-bold text-sm shadow-lg shadow-[#397548]/20 hover:bg-[#2E5E3A] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              {!isCustomerLoggedIn && <Lock className="w-4 h-4" />}
              <span>{isCustomerLoggedIn ? 'Proceed to Checkout' : 'Sign In to Proceed to Checkout'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
