import type { CartItem, Coupon, OrderStatus, StoreSettings } from '../types/dairy.js';

export interface CartCalculationResult {
  subtotal: number;
  itemCount: number;
  discount: number;
  appliedCoupon?: Coupon;
  couponError?: string;
  deliveryFee: number;
  freeDeliveryRemaining: number;
  total: number;
}

export function calculateCartTotals(
  items: CartItem[],
  coupon: Coupon | null | undefined,
  settings: Pick<StoreSettings, 'deliveryCharge' | 'freeDeliveryThreshold' | 'minOrderValue'>,
  referenceDate: string = new Date().toISOString()
): CartCalculationResult {
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + (item.effectivePrice * item.quantity), 0);

  let discount = 0;
  let couponError: string | undefined = undefined;
  let appliedCoupon: Coupon | undefined = undefined;

  if (coupon) {
    if (!coupon.isActive) {
      couponError = 'Coupon is currently inactive';
    } else if (subtotal < coupon.minOrderValue) {
      couponError = `Requires minimum order of ₹${coupon.minOrderValue}`;
    } else {
      const today = referenceDate.slice(0, 10);
      if (coupon.expiryDate && coupon.expiryDate < today) {
        couponError = 'Coupon has expired';
      } else {
        if (coupon.discountType === 'percentage') {
          discount = Math.round((subtotal * coupon.value) / 100);
        } else {
          discount = Math.min(coupon.value, subtotal);
        }
        discount = Math.min(discount, subtotal);
        appliedCoupon = coupon;
      }
    }
  }

  // Delivery fee logic
  const freeThreshold = settings.freeDeliveryThreshold ?? 500;
  const standardFee = settings.deliveryCharge ?? 40;
  
  let deliveryFee = 0;
  let freeDeliveryRemaining = 0;

  if (subtotal > 0) {
    if (subtotal >= freeThreshold) {
      deliveryFee = 0;
      freeDeliveryRemaining = 0;
    } else {
      deliveryFee = standardFee;
      freeDeliveryRemaining = freeThreshold - subtotal;
    }
  }

  const total = Math.max(0, subtotal - discount + deliveryFee);

  return {
    subtotal,
    itemCount,
    discount,
    appliedCoupon,
    couponError,
    deliveryFee,
    freeDeliveryRemaining,
    total,
  };
}

export function isPincodeServiceable(pincode: string, serviceablePincodes: string[]): boolean {
  if (!serviceablePincodes || serviceablePincodes.length === 0) {
    return true; // if no restrictions set, all are serviceable
  }
  const cleanPin = pincode.trim();
  return serviceablePincodes.some((pin) => pin.trim() === cleanPin);
}

export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  'New Order': ['Confirmed', 'Cancelled'],
  'Confirmed': ['Preparing', 'Cancelled'],
  'Preparing': ['Out for Delivery', 'Cancelled'],
  'Out for Delivery': ['Delivered', 'Cancelled'],
  'Delivered': [],
  'Cancelled': [],
};

export function canTransitionOrderStatus(current: OrderStatus, target: OrderStatus): boolean {
  if (current === target) return true;
  const allowed = ALLOWED_STATUS_TRANSITIONS[current] || [];
  return allowed.includes(target);
}

export function formatCurrency(amount: number, symbol: string = '₹'): string {
  return `${symbol}${amount.toLocaleString('en-IN')}`;
}

export function calculatePaymentBalance(orderTotal: number, amountPaid: number): {
  remainingBalance: number;
  paymentStatus: 'paid' | 'partially_paid' | 'pending';
} {
  const safePaid = Math.max(0, amountPaid);
  const remaining = Math.max(0, orderTotal - safePaid);
  if (remaining === 0 && safePaid > 0) {
    return { remainingBalance: 0, paymentStatus: 'paid' };
  }
  if (safePaid > 0 && remaining > 0) {
    return { remainingBalance: remaining, paymentStatus: 'partially_paid' };
  }
  return { remainingBalance: orderTotal, paymentStatus: 'pending' };
}
