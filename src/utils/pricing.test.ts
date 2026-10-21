import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCartTotals, calculatePaymentBalance, canTransitionOrderStatus, isPincodeServiceable } from './pricing.ts';
import type { CartItem, Coupon } from '../types/dairy.js';

test('calculates cart subtotal and free delivery fee accurately', () => {
  const items: CartItem[] = [
    {
      id: 'prod-1',
      productId: 'prod-1',
      name: 'Fresh Cow Milk',
      unit: '1 Litre',
      price: 75,
      effectivePrice: 75,
      image: '',
      quantity: 2,
      maxStock: 50,
      isMadeToOrder: false,
    },
    {
      id: 'prod-2',
      productId: 'prod-2',
      name: 'Fresh Curd',
      unit: '500 g',
      price: 60,
      effectivePrice: 60,
      image: '',
      quantity: 1,
      maxStock: 30,
      isMadeToOrder: false,
    },
  ];

  const settings = {
    deliveryCharge: 40,
    freeDeliveryThreshold: 500,
    minOrderValue: 100,
  };

  // Subtotal = (75*2) + 60 = 210.
  // Below 500 threshold, so delivery fee = 40.
  // Total = 250.
  const result = calculateCartTotals(items, null, settings);
  assert.equal(result.subtotal, 210);
  assert.equal(result.itemCount, 3);
  assert.equal(result.deliveryFee, 40);
  assert.equal(result.freeDeliveryRemaining, 290);
  assert.equal(result.total, 250);
});

test('applies free delivery when subtotal meets or exceeds threshold', () => {
  const items: CartItem[] = [
    {
      id: 'ghee-1',
      productId: 'ghee-1',
      name: 'Pure Desi Ghee',
      unit: '1 Litre',
      price: 680,
      effectivePrice: 680,
      image: '',
      quantity: 1,
      maxStock: 20,
      isMadeToOrder: false,
    },
  ];

  const settings = {
    deliveryCharge: 40,
    freeDeliveryThreshold: 500,
    minOrderValue: 100,
  };

  const result = calculateCartTotals(items, null, settings);
  assert.equal(result.subtotal, 680);
  assert.equal(result.deliveryFee, 0);
  assert.equal(result.freeDeliveryRemaining, 0);
  assert.equal(result.total, 680);
});

test('correctly validates and applies percentage coupon', () => {
  const items: CartItem[] = [
    {
      id: 'combo-1',
      productId: 'combo-1',
      name: 'Dairy Combo',
      unit: '1 Pack',
      price: 400,
      effectivePrice: 400,
      image: '',
      quantity: 1,
      maxStock: 15,
      isMadeToOrder: false,
    },
  ];

  const coupon: Coupon = {
    id: 'c1',
    code: 'FRESH10',
    discountType: 'percentage',
    value: 10,
    minOrderValue: 300,
    expiryDate: '2030-12-31',
    isActive: true,
  };

  const settings = {
    deliveryCharge: 30,
    freeDeliveryThreshold: 500,
    minOrderValue: 100,
  };

  const result = calculateCartTotals(items, coupon, settings);
  // 10% of 400 = 40.
  assert.equal(result.discount, 40);
  assert.equal(result.total, 400 - 40 + 30);
  assert.equal(result.couponError, undefined);
  assert.equal(result.appliedCoupon?.code, 'FRESH10');
});

test('rejects coupon when minimum order requirement is not met', () => {
  const items: CartItem[] = [
    {
      id: 'milk-1',
      productId: 'milk-1',
      name: 'Fresh Cow Milk',
      unit: '500 ml',
      price: 45,
      effectivePrice: 45,
      image: '',
      quantity: 1,
      maxStock: 50,
      isMadeToOrder: false,
    },
  ];

  const coupon: Coupon = {
    id: 'c2',
    code: 'SAVE50',
    discountType: 'fixed',
    value: 50,
    minOrderValue: 200,
    expiryDate: '2030-12-31',
    isActive: true,
  };

  const settings = {
    deliveryCharge: 40,
    freeDeliveryThreshold: 500,
    minOrderValue: 40,
  };

  const result = calculateCartTotals(items, coupon, settings);
  assert.equal(result.discount, 0);
  assert.ok(result.couponError?.includes('minimum order'));
});

test('pincode serviceability check functions accurately', () => {
  const serviceable = ['110001', '110002', '110025'];
  assert.equal(isPincodeServiceable('110001', serviceable), true);
  assert.equal(isPincodeServiceable('110002 ', serviceable), true);
  assert.equal(isPincodeServiceable('560001', serviceable), false);
  // empty list implies all allowed
  assert.equal(isPincodeServiceable('560001', []), true);
});

test('order status transitions follow allowed lifecycle', () => {
  assert.equal(canTransitionOrderStatus('New Order', 'Confirmed'), true);
  assert.equal(canTransitionOrderStatus('Confirmed', 'Preparing'), true);
  assert.equal(canTransitionOrderStatus('Preparing', 'Out for Delivery'), true);
  assert.equal(canTransitionOrderStatus('Out for Delivery', 'Delivered'), true);
  assert.equal(canTransitionOrderStatus('Preparing', 'Cancelled'), true);
  // Cannot go backward from Delivered to Preparing or Cancelled
  assert.equal(canTransitionOrderStatus('Delivered', 'Preparing'), false);
  assert.equal(canTransitionOrderStatus('Delivered', 'Cancelled'), false);
});

test('calculatePaymentBalance handles full, partial, and pending payments correctly', () => {
  // Pending order with 0 paid
  const pending = calculatePaymentBalance(650, 0);
  assert.equal(pending.remainingBalance, 650);
  assert.equal(pending.paymentStatus, 'pending');

  // Partially paid order
  const partial = calculatePaymentBalance(650, 250);
  assert.equal(partial.remainingBalance, 400);
  assert.equal(partial.paymentStatus, 'partially_paid');

  // Fully paid order
  const paid = calculatePaymentBalance(650, 650);
  assert.equal(paid.remainingBalance, 0);
  assert.equal(paid.paymentStatus, 'paid');

  // Overpaid edge case
  const overpaid = calculatePaymentBalance(650, 700);
  assert.equal(overpaid.remainingBalance, 0);
  assert.equal(overpaid.paymentStatus, 'paid');
});
