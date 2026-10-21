export interface ProductVariant {
  id: string;
  name: string;
  unit: string;
  price: number;
  salePrice?: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  price: number;
  salePrice?: number;
  unit: string;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  isMadeToOrder: boolean;
  isFeatured: boolean;
  isPublished: boolean;
  storageInfo?: string;
  handlingDetails?: string;
  purityHighlights?: string[];
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isVisible: boolean;
  displayOrder: number;
}

export interface CartItem {
  id: string; // unique item id (productId + (variantId || ''))
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  unit: string;
  price: number;
  salePrice?: number;
  effectivePrice: number;
  image: string;
  quantity: number;
  maxStock: number;
  isMadeToOrder: boolean;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  pincode: string;
  deliveryNotes?: string;
}

export type OrderStatus =
  | 'New Order'
  | 'Confirmed'
  | 'Preparing'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type PaymentMethod =
  | 'cod'
  | 'upi'
  | 'qr_code'
  | 'net_banking'
  | 'bank_transfer'
  | 'gateway'
  | 'card'
  | 'other';
export type PaymentStatus = 'pending' | 'paid' | 'partially_paid' | 'failed' | 'refunded' | 'cancelled';

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  note?: string;
  recordedBy?: string;
}

export interface OrderItem {
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  deliveryFee: number;
  total: number;
  deliverySlot: string;
  preferredDate?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  upiVerificationStatus?: 'pending' | 'verified' | 'rejected';
  upiRejectedReason?: string;
  amountPaid: number;
  remainingBalance: number;
  paymentDate?: string;
  paymentNotes?: string;
  paymentHistory?: PaymentRecord[];
  status: OrderStatus;
  statusHistory: Array<{
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }>;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number; // percentage or fixed rupees
  minOrderValue: number;
  expiryDate: string; // YYYY-MM-DD
  isActive: boolean;
}

export interface StoreSettings {
  brandName: string;
  tagline: string;
  logoUrl: string;
  announcement: string;
  isAnnouncementVisible: boolean;
  currencySymbol: string;
  currencyCode: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  operatingHours: string;
  isStoreOpen: boolean;
  storeCloseMessage: string;
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  minOrderValue: number;
  serviceablePincodes: string[];
  
  // Payment methods configuration
  enableCOD: boolean;
  enableUPI: boolean;
  enableQRCode: boolean;
  enableNetBanking: boolean;
  enableBankTransfer: boolean;
  enableOnlineCard: boolean;
  enableGateway: boolean;
  enableOtherPayment: boolean;
  defaultPaymentMethod: PaymentMethod;
  codInstructions?: string;
  qrCodeInstructions?: string;
  netBankingInstructions?: string;
  otherPaymentInstructions?: string;

  // UPI settings
  upiId: string;
  upiPayeeName: string;
  upiInstructions: string;
  upiQrImageUrl?: string;

  // Bank Transfer settings
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  bankIfsc: string;
  bankBranch: string;
  bankInstructions: string;

  // Gateway settings
  gatewayProvider: 'razorpay' | 'stripe' | 'cashfree';
  gatewayKeyId: string;
  gatewayMode: 'sandbox' | 'live';
  gatewayInstructions: string;

  // Admin Account Settings
  adminEmail: string;

  heroHeading: string;
  heroSubheading: string;
  heroImage: string;
  aboutStory: string;
}

export interface SavedAddress {
  id: string;
  label: string; // e.g., 'Home', 'Office', 'Villa'
  address: string;
  city: string;
  pincode: string;
  isDefault?: boolean;
}

export interface CustomerAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  savedAddresses: SavedAddress[];
  createdAt: string;
  updatedAt?: string;
}

export interface CustomerSummary {
  id?: string;
  phone: string;
  name: string;
  email?: string;
  alternatePhone?: string;
  registrationDate?: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  addresses: string[];
  notes?: string;
  orders?: Order[];
}
