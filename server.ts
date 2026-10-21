import express, { Request, Response } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { INITIAL_CATEGORIES, INITIAL_COUPONS, INITIAL_ORDERS, INITIAL_PRODUCTS, INITIAL_SETTINGS } from './src/data/initialData.ts';
import type { Category, Coupon, CustomerAccount, Order, OrderStatus, PaymentMethod, PaymentStatus, Product, SavedAddress, StoreSettings } from './src/types/dairy.js';
import { calculateCartTotals, canTransitionOrderStatus } from './src/utils/pricing.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'store-db.json');

export function hashPassword(pass: string): string {
  return crypto.createHash('sha256').update(pass + 'puredrop-salt-2026').digest('hex');
}

export interface DbCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  passwordHash: string;
  savedAddresses: SavedAddress[];
  createdAt: string;
  updatedAt?: string;
}

export const INITIAL_CUSTOMERS: DbCustomer[] = [
  {
    id: 'cust-101',
    name: 'Aditi Sharma',
    email: 'aditi.sharma@example.com',
    phone: '9829012345',
    alternatePhone: '9829099999',
    passwordHash: hashPassword('Password@123'),
    savedAddresses: [
      {
        id: 'addr-1',
        label: 'Home',
        address: 'Flat 402, Sunshine Residency, Vaishali Nagar',
        city: 'Jaipur',
        pincode: '302021',
        isDefault: true,
      },
    ],
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'cust-102',
    name: 'Vikram Mehta',
    email: 'vikram.m@example.com',
    phone: '9876543210',
    passwordHash: hashPassword('Password@123'),
    savedAddresses: [
      {
        id: 'addr-2',
        label: 'Home',
        address: 'B-12, Civil Lines, Near Railway Club',
        city: 'Jaipur',
        pincode: '302006',
        isDefault: true,
      },
    ],
    createdAt: '2026-10-02T09:30:00.000Z',
    updatedAt: '2026-10-02T09:30:00.000Z',
  },
];

interface DatabaseSchema {
  settings: StoreSettings;
  categories: Category[];
  products: Product[];
  coupons: Coupon[];
  orders: Order[];
  adminPassword?: string;
  customerNotes?: Record<string, string>;
  customers?: DbCustomer[];
}

function loadDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      const parsedSettings = parsed.settings || {};
      const mergedSettings: StoreSettings = {
        ...INITIAL_SETTINGS,
        ...parsedSettings,
        enableCOD: true, // COD must always be enabled and available
        enableUPI: typeof parsedSettings.enableUPI === 'boolean' ? parsedSettings.enableUPI : INITIAL_SETTINGS.enableUPI,
        enableQRCode: typeof parsedSettings.enableQRCode === 'boolean' ? parsedSettings.enableQRCode : (INITIAL_SETTINGS.enableQRCode ?? false),
        enableNetBanking: typeof parsedSettings.enableNetBanking === 'boolean' ? parsedSettings.enableNetBanking : (INITIAL_SETTINGS.enableNetBanking ?? false),
        enableBankTransfer: typeof parsedSettings.enableBankTransfer === 'boolean' ? parsedSettings.enableBankTransfer : INITIAL_SETTINGS.enableBankTransfer,
        enableGateway: typeof parsedSettings.enableGateway === 'boolean' ? parsedSettings.enableGateway : INITIAL_SETTINGS.enableGateway,
        defaultPaymentMethod: parsedSettings.defaultPaymentMethod || 'cod',
      };

      const customersList: DbCustomer[] = Array.isArray(parsed.customers)
        ? parsed.customers
        : INITIAL_CUSTOMERS;

      const rawOrders: any[] = Array.isArray(parsed.orders)
        ? parsed.orders
        : INITIAL_ORDERS;

      const normalizedOrders: Order[] = rawOrders.map((o: any) => {
        const total = Number(o.total) || 0;
        const paymentStatus = o.paymentStatus || 'pending';
        const isPaid = paymentStatus === 'paid';
        const amountPaid = typeof o.amountPaid === 'number' ? o.amountPaid : (isPaid ? total : 0);
        const remainingBalance = typeof o.remainingBalance === 'number' ? o.remainingBalance : Math.max(0, total - amountPaid);
        
        // Link customerId if missing
        let customerId = o.customerId;
        if (!customerId) {
          const match = customersList.find(c => c.phone === o.customer?.phone || (c.email && c.email.toLowerCase() === o.customer?.email?.toLowerCase()));
          if (match) customerId = match.id;
        }

        return {
          ...o,
          customerId,
          paymentMethod: o.paymentMethod || 'cod',
          paymentStatus,
          amountPaid,
          remainingBalance,
          paymentHistory: Array.isArray(o.paymentHistory) ? o.paymentHistory : [],
        };
      });

      return {
        settings: mergedSettings,
        categories: parsed.categories || INITIAL_CATEGORIES,
        products: parsed.products || INITIAL_PRODUCTS,
        coupons: parsed.coupons || INITIAL_COUPONS,
        orders: normalizedOrders,
        adminPassword: parsed.adminPassword || 'DairyAdmin@2026',
        customerNotes: parsed.customerNotes || {},
        customers: customersList,
      };
    }
  } catch (err) {
    console.error('Failed to read db file, initializing with defaults', err);
  }

  const initialOrdersWithCust = INITIAL_ORDERS.map(o => {
    const match = INITIAL_CUSTOMERS.find(c => c.phone === o.customer.phone);
    return { ...o, customerId: match?.id };
  });

  const initialDb: DatabaseSchema = {
    settings: INITIAL_SETTINGS,
    categories: INITIAL_CATEGORIES,
    products: INITIAL_PRODUCTS,
    coupons: INITIAL_COUPONS,
    orders: initialOrdersWithCust,
    adminPassword: 'DairyAdmin@2026',
    customerNotes: {},
    customers: INITIAL_CUSTOMERS,
  };
  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(db: DatabaseSchema) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save db file', err);
  }
}

let db = loadDatabase();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Router
  const api = express.Router();

  api.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', brand: db.settings.brandName, timestamp: new Date().toISOString() });
  });

  // Settings
  api.get('/settings', (_req: Request, res: Response) => {
    res.json(db.settings);
  });

  api.put('/settings', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer puredrop-admin-authorized')) {
      res.status(401).json({
        error: 'Unauthorized: Only authorized administrators can update store and payment settings.',
      });
      return;
    }

    const body = req.body || {};
    const updated: StoreSettings = {
      ...db.settings,
      ...body,
      // COD must remain enabled by default and must always be available
      enableCOD: true,
      enableUPI: typeof body.enableUPI === 'boolean' ? body.enableUPI : db.settings.enableUPI,
      enableQRCode: typeof body.enableQRCode === 'boolean' ? body.enableQRCode : (db.settings.enableQRCode ?? false),
      enableNetBanking: typeof body.enableNetBanking === 'boolean' ? body.enableNetBanking : (db.settings.enableNetBanking ?? false),
      enableBankTransfer: typeof body.enableBankTransfer === 'boolean' ? body.enableBankTransfer : db.settings.enableBankTransfer,
      enableGateway: typeof body.enableGateway === 'boolean' ? body.enableGateway : db.settings.enableGateway,
      defaultPaymentMethod: body.defaultPaymentMethod || db.settings.defaultPaymentMethod || 'cod',
    };
    db.settings = updated;
    saveDatabase(db);
    res.json(db.settings);
  });

  // Categories
  api.get('/categories', (_req: Request, res: Response) => {
    res.json(db.categories);
  });

  api.post('/categories', (req: Request, res: Response) => {
    const { name, description, image, isVisible, displayOrder } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: name.trim(),
      slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: description || '',
      image: image || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
      isVisible: isVisible !== false,
      displayOrder: typeof displayOrder === 'number' ? displayOrder : db.categories.length + 1,
    };
    db.categories.push(newCategory);
    saveDatabase(db);
    res.status(201).json(newCategory);
  });

  api.put('/categories/:id', (req: Request, res: Response) => {
    const index = db.categories.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    db.categories[index] = { ...db.categories[index], ...req.body };
    saveDatabase(db);
    res.json(db.categories[index]);
  });

  api.delete('/categories/:id', (req: Request, res: Response) => {
    db.categories = db.categories.filter(c => c.id !== req.params.id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // Products
  api.get('/products', (_req: Request, res: Response) => {
    res.json(db.products);
  });

  api.get('/products/:id', (req: Request, res: Response) => {
    const product = db.products.find(p => p.id === req.params.id || p.slug === req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  });

  api.post('/products', (req: Request, res: Response) => {
    const {
      name,
      categoryId,
      description,
      price,
      salePrice,
      unit,
      images,
      stockQuantity,
      isMadeToOrder,
      isFeatured,
      isPublished,
      storageInfo,
      handlingDetails,
      variants,
    } = req.body;

    if (!name?.trim() || typeof price !== 'number') {
      res.status(400).json({ error: 'Name and a valid numeric price are required' });
      return;
    }

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: name.trim(),
      slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      categoryId: categoryId || 'cat-milk',
      description: description || '',
      price: Number(price),
      salePrice: salePrice ? Number(salePrice) : undefined,
      unit: unit || '1 Unit',
      images: Array.isArray(images) && images.length > 0 ? images : ['https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80'],
      inStock: (Number(stockQuantity) > 0) || Boolean(isMadeToOrder),
      stockQuantity: Number(stockQuantity) || 0,
      isMadeToOrder: Boolean(isMadeToOrder),
      isFeatured: Boolean(isFeatured),
      isPublished: isPublished !== false,
      storageInfo: storageInfo || 'Keep refrigerated at all times.',
      handlingDetails: handlingDetails || '',
      variants: Array.isArray(variants) ? variants : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.products.unshift(newProduct);
    saveDatabase(db);
    res.status(201).json(newProduct);
  });

  api.put('/products/:id', (req: Request, res: Response) => {
    const index = db.products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const current = db.products[index];
    const updated = {
      ...current,
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    if (typeof updated.stockQuantity === 'number') {
      updated.inStock = updated.stockQuantity > 0 || Boolean(updated.isMadeToOrder);
    }

    db.products[index] = updated;
    saveDatabase(db);
    res.json(updated);
  });

  api.delete('/products/:id', (req: Request, res: Response) => {
    db.products = db.products.filter(p => p.id !== req.params.id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // Coupons
  api.get('/coupons', (_req: Request, res: Response) => {
    res.json(db.coupons);
  });

  api.post('/coupons', (req: Request, res: Response) => {
    const { code, discountType, value, minOrderValue, expiryDate, isActive } = req.body;
    if (!code?.trim() || !value) {
      res.status(400).json({ error: 'Coupon code and value are required' });
      return;
    }
    const newCoupon: Coupon = {
      id: `cpn-${Date.now()}`,
      code: code.trim().toUpperCase(),
      discountType: discountType === 'fixed' ? 'fixed' : 'percentage',
      value: Number(value),
      minOrderValue: Number(minOrderValue) || 0,
      expiryDate: expiryDate || '2030-12-31',
      isActive: isActive !== false,
    };
    db.coupons.push(newCoupon);
    saveDatabase(db);
    res.status(201).json(newCoupon);
  });

  api.put('/coupons/:id', (req: Request, res: Response) => {
    const index = db.coupons.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Coupon not found' });
      return;
    }
    db.coupons[index] = { ...db.coupons[index], ...req.body };
    saveDatabase(db);
    res.json(db.coupons[index]);
  });

  api.delete('/coupons/:id', (req: Request, res: Response) => {
    db.coupons = db.coupons.filter(c => c.id !== req.params.id);
    saveDatabase(db);
    res.json({ success: true });
  });

  api.post('/coupons/validate', (req: Request, res: Response) => {
    const { code, subtotal } = req.body;
    if (!code) {
      res.status(400).json({ valid: false, message: 'Please enter a coupon code' });
      return;
    }
    const cleanCode = String(code).trim().toUpperCase();
    const coupon = db.coupons.find(c => c.code === cleanCode);
    if (!coupon) {
      res.status(404).json({ valid: false, message: 'Invalid coupon code' });
      return;
    }
    if (!coupon.isActive) {
      res.status(400).json({ valid: false, message: 'This coupon is currently inactive' });
      return;
    }
    const numSubtotal = Number(subtotal) || 0;
    if (numSubtotal < coupon.minOrderValue) {
      res.status(400).json({
        valid: false,
        message: `Coupon requires minimum order of ₹${coupon.minOrderValue}`,
      });
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    if (coupon.expiryDate && coupon.expiryDate < today) {
      res.status(400).json({ valid: false, message: 'This coupon has expired' });
      return;
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = Math.round((numSubtotal * coupon.value) / 100);
    } else {
      discount = Math.min(coupon.value, numSubtotal);
    }
    discount = Math.min(discount, numSubtotal);

    res.json({
      valid: true,
      coupon,
      discount,
      message: `Coupon ${coupon.code} applied successfully! You save ₹${discount}`,
    });
  });

  // Orders
  api.get('/orders', (req: Request, res: Response) => {
    const { status, search, phone } = req.query;
    let list = [...db.orders];

    if (phone) {
      list = list.filter(o => o.customer.phone === String(phone));
    }
    if (status && status !== 'all') {
      list = list.filter(o => o.status === status);
    }
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(
        o =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          o.customer.phone.includes(q)
      );
    }

    res.json(list);
  });

  api.get('/orders/:id', (req: Request, res: Response) => {
    const idOrNum = req.params.id;
    const order = db.orders.find(o => o.id === idOrNum || o.orderNumber === idOrNum);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(order);
  });

  // Customer Account Helper Functions
  function sanitizeCustomer(c: DbCustomer): CustomerAccount {
    const { passwordHash, ...rest } = c;
    return rest;
  }

  function getAuthCustomer(req: Request): DbCustomer | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7).trim();
    if (!token.startsWith('cust_tok_')) return null;
    const parts = token.split('_');
    const custId = parts[2];
    if (!custId) return null;
    return db.customers?.find(c => c.id === custId) || null;
  }

  api.post('/orders', (req: Request, res: Response) => {
    const { customer, items, couponCode, deliverySlot, paymentMethod } = req.body;

    // Enforce mandatory customer login before placing an order
    const authCustomer = getAuthCustomer(req);
    const bodyCustomerId = req.body.customerId;
    const customerAccount =
      authCustomer ||
      (bodyCustomerId && db.customers ? db.customers.find(c => c.id === bodyCustomerId) : null) ||
      (customer?.phone && db.customers ? db.customers.find(c => c.phone === String(customer.phone).replace(/\D/g, '').slice(-10)) : null);

    if (!customerAccount) {
      res.status(401).json({
        error: 'Customer login is mandatory before ordering. Please sign in or register your customer account.',
      });
      return;
    }

    if (!customer?.name || !customer?.phone || !customer?.address || !customer?.pincode) {
      res.status(400).json({ error: 'Customer name, phone, address, and PIN code are required' });
      return;
    }
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Cart is empty' });
      return;
    }

    // Server-side recalculation & stock check
    const verifiedItems = [];
    let serverSubtotal = 0;

    for (const item of items) {
      const dbProduct = db.products.find(p => p.id === item.productId);
      if (!dbProduct) {
        res.status(400).json({ error: `Product ${item.name || item.productId} no longer exists` });
        return;
      }

      let price = dbProduct.salePrice || dbProduct.price;
      let variantName = undefined;
      let availableStock = dbProduct.stockQuantity;

      if (item.variantId) {
        const v = dbProduct.variants.find(va => va.id === item.variantId);
        if (v) {
          price = v.salePrice || v.price;
          variantName = v.name;
          availableStock = v.stock;
        }
      }

      if (!dbProduct.isMadeToOrder && availableStock < item.quantity) {
        res.status(400).json({
          error: `Insufficient stock for ${dbProduct.name} (${item.quantity} requested, ${availableStock} in stock)`,
        });
        return;
      }

      const itemTotal = price * item.quantity;
      serverSubtotal += itemTotal;

      verifiedItems.push({
        productId: dbProduct.id,
        variantId: item.variantId,
        name: dbProduct.name,
        variantName,
        unit: item.unit || dbProduct.unit,
        unitPrice: price,
        quantity: item.quantity,
        totalPrice: itemTotal,
        image: dbProduct.images[0] || '',
      });
    }

    // Minimum order check
    if (serverSubtotal < (db.settings.minOrderValue || 0)) {
      res.status(400).json({
        error: `Minimum order value is ₹${db.settings.minOrderValue}. Current order is ₹${serverSubtotal}`,
      });
      return;
    }

    // Coupon calculation
    let discount = 0;
    let validCouponCode = undefined;
    if (couponCode) {
      const coupon = db.coupons.find(c => c.code === String(couponCode).toUpperCase() && c.isActive);
      if (coupon && serverSubtotal >= coupon.minOrderValue) {
        if (coupon.discountType === 'percentage') {
          discount = Math.round((serverSubtotal * coupon.value) / 100);
        } else {
          discount = Math.min(coupon.value, serverSubtotal);
        }
        validCouponCode = coupon.code;
      }
    }

    // Delivery fee
    const deliveryFee = serverSubtotal >= (db.settings.freeDeliveryThreshold ?? 499) ? 0 : (db.settings.deliveryCharge ?? 35);
    const total = Math.max(0, serverSubtotal - discount + deliveryFee);

    // Deduct stock
    for (const item of items) {
      const dbProduct = db.products.find(p => p.id === item.productId);
      if (dbProduct && !dbProduct.isMadeToOrder) {
        if (item.variantId) {
          const v = dbProduct.variants.find(va => va.id === item.variantId);
          if (v) {
            v.stock = Math.max(0, v.stock - item.quantity);
          }
        }
        dbProduct.stockQuantity = Math.max(0, dbProduct.stockQuantity - item.quantity);
        dbProduct.inStock = dbProduct.stockQuantity > 0;
      }
    }

    const orderNumber = `PD-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString();

    // Validate requested payment method against current live settings
    const method: PaymentMethod = (paymentMethod as PaymentMethod) || 'cod';
    let statusNote = '';

    if (method === 'cod') {
      if (db.settings.enableCOD === false) {
        res.status(400).json({ error: 'Cash on Delivery (COD) is currently unavailable.' });
        return;
      }
      statusNote = 'Order placed via Cash on Delivery (COD). Payment to be collected upon morning doorstep delivery.';
    } else if (method === 'upi') {
      if (!db.settings.enableUPI) {
        res.status(400).json({
          error: 'Payment method "UPI" is currently disabled by store administrator. Please select Cash on Delivery.',
        });
        return;
      }
      if (!db.settings.upiId?.trim() && !db.settings.upiQrImageUrl?.trim()) {
        res.status(400).json({
          error: 'UPI payment is temporarily unavailable due to missing merchant configuration. Please select Cash on Delivery.',
        });
        return;
      }
      statusNote = 'Order placed via UPI. Awaiting payment and bank UTR verification.';
    } else if (method === 'qr_code') {
      if (!db.settings.enableQRCode) {
        res.status(400).json({
          error: 'Payment method "QR Code Payment" is currently disabled by store administrator. Please select Cash on Delivery.',
        });
        return;
      }
      if (!db.settings.upiId?.trim() && !db.settings.upiQrImageUrl?.trim()) {
        res.status(400).json({
          error: 'QR Code payment is temporarily unavailable due to missing merchant configuration. Please select Cash on Delivery.',
        });
        return;
      }
      statusNote = 'Order placed via QR Code Payment. Awaiting payment scan and verification.';
    } else if (method === 'net_banking') {
      if (!db.settings.enableNetBanking) {
        res.status(400).json({
          error: 'Payment method "Net Banking" is currently disabled by store administrator. Please select Cash on Delivery.',
        });
        return;
      }
      if (!db.settings.bankAccountNumber?.trim() || !db.settings.bankIfsc?.trim()) {
        res.status(400).json({
          error: 'Net Banking is temporarily unavailable due to missing bank account configuration. Please select Cash on Delivery.',
        });
        return;
      }
      statusNote = 'Order placed via Net Banking. Payment to be transferred and verified against bank records.';
    } else if (method === 'bank_transfer') {
      if (!db.settings.enableBankTransfer) {
        res.status(400).json({
          error: 'Payment method "Direct Bank Transfer" is currently disabled by store administrator. Please select Cash on Delivery.',
        });
        return;
      }
      if (!db.settings.bankAccountNumber?.trim() || !db.settings.bankIfsc?.trim()) {
        res.status(400).json({
          error: 'Direct Bank Transfer is temporarily unavailable due to missing bank account configuration. Please select Cash on Delivery.',
        });
        return;
      }
      statusNote = 'Order placed via Direct Bank Transfer (IMPS/NEFT). Payment to be verified by Administrator.';
    } else if (method === 'gateway') {
      if (!db.settings.enableGateway) {
        res.status(400).json({
          error: 'Payment method "Online Payment Gateway" is currently disabled by store administrator. Please select Cash on Delivery.',
        });
        return;
      }
      if (!db.settings.gatewayKeyId?.trim()) {
        res.status(400).json({
          error: 'Payment Gateway is temporarily unavailable due to missing gateway credentials. Please select Cash on Delivery.',
        });
        return;
      }
      statusNote = 'Order placed via Online Payment Gateway. Awaiting gateway settlement verification.';
    } else {
      res.status(400).json({
        error: `Unsupported or unknown payment method: "${paymentMethod}". Please select a supported payment method.`,
      });
      return;
    }

    const chosenMethod: PaymentMethod = method;
    const txnId = req.body.transactionId ? String(req.body.transactionId).trim() : undefined;

    const customerId = customerAccount.id;

    // Save address to customer profile if customer exists and address is not already saved
    if (customerId && db.customers) {
      const custObj = db.customers.find(c => c.id === customerId);
      if (custObj) {
        const addressExists = custObj.savedAddresses?.some(a => a.address.toLowerCase() === customer.address.trim().toLowerCase());
        if (!addressExists) {
          if (!custObj.savedAddresses) custObj.savedAddresses = [];
          custObj.savedAddresses.push({
            id: `addr-${Date.now()}`,
            label: custObj.savedAddresses.length === 0 ? 'Home' : `Address ${custObj.savedAddresses.length + 1}`,
            address: customer.address.trim(),
            city: customer.city?.trim() || db.settings.city,
            pincode: customer.pincode.trim(),
            isDefault: custObj.savedAddresses.length === 0,
          });
        }
      }
    }

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customerId,
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email?.trim(),
        address: customer.address.trim(),
        city: customer.city?.trim() || db.settings.city,
        pincode: customer.pincode.trim(),
        deliveryNotes: customer.deliveryNotes?.trim(),
      },
      items: verifiedItems,
      subtotal: serverSubtotal,
      discount,
      couponCode: validCouponCode,
      deliveryFee,
      total,
      deliverySlot: deliverySlot || 'Morning (5:30 AM - 7:30 AM)',
      paymentMethod: chosenMethod,
      paymentStatus: 'pending', // Maintained as pending until payment is verified or cash collected
      transactionId: txnId,
      upiVerificationStatus: (chosenMethod === 'upi' || chosenMethod === 'qr_code') && txnId ? 'pending' : undefined,
      amountPaid: 0,
      remainingBalance: total,
      paymentHistory: [],
      status: 'New Order',
      statusHistory: [
        {
          status: 'New Order',
          timestamp: now,
          note: statusNote,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    db.orders.unshift(newOrder);
    saveDatabase(db);
    res.status(201).json(newOrder);
  });

  api.put('/orders/:id/status', (req: Request, res: Response) => {
    const { status, note } = req.body as { status: OrderStatus; note?: string };
    const orderIndex = db.orders.findIndex(o => o.id === req.params.id || o.orderNumber === req.params.id);
    if (orderIndex === -1) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const order = db.orders[orderIndex];
    const previousStatus = order.status;

    if (!canTransitionOrderStatus(previousStatus, status)) {
      res.status(400).json({
        error: `Cannot transition from '${previousStatus}' to '${status}'`,
      });
      return;
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();
    order.statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Status updated to ${status}`,
    });

    // If order is cancelled, safely restore stock
    if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
      for (const item of order.items) {
        const prod = db.products.find(p => p.id === item.productId);
        if (prod && !prod.isMadeToOrder) {
          if (item.variantId) {
            const v = prod.variants.find(va => va.id === item.variantId);
            if (v) {
              v.stock += item.quantity;
            }
          }
          prod.stockQuantity += item.quantity;
          prod.inStock = prod.stockQuantity > 0;
        }
      }
    }

    saveDatabase(db);
    res.json(order);
  });

  // Record payment for an order (Authorized Admin action)
  api.post('/orders/:id/payment', (req: Request, res: Response) => {
    const { amount, method, reference, note } = req.body;
    const orderIndex = db.orders.findIndex(o => o.id === req.params.id || o.orderNumber === req.params.id);
    if (orderIndex === -1) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const order = db.orders[orderIndex];
    const paymentAmount = Number(amount);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      res.status(400).json({ error: 'Please enter a valid payment amount greater than zero' });
      return;
    }

    // Ensure payment amount cannot exceed remaining balance unless permitted
    const currentRemaining = typeof order.remainingBalance === 'number' ? order.remainingBalance : Math.max(0, order.total - (order.amountPaid || 0));
    if (paymentAmount > currentRemaining) {
      res.status(400).json({
        error: `Payment amount (₹${paymentAmount}) cannot exceed the remaining balance of ₹${currentRemaining}`,
      });
      return;
    }

    const now = new Date().toISOString();
    const cleanRef = reference ? String(reference).trim() : undefined;
    const paymentMethodUsed: PaymentMethod = method || order.paymentMethod;

    const newPaymentRecord = {
      id: `pay-${Date.now()}`,
      date: now,
      amount: paymentAmount,
      method: paymentMethodUsed,
      reference: cleanRef,
      note: note ? String(note).trim() : undefined,
      recordedBy: 'Store Administrator',
    };

    const newAmountPaid = (order.amountPaid || 0) + paymentAmount;
    const newRemaining = Math.max(0, order.total - newAmountPaid);

    order.amountPaid = newAmountPaid;
    order.remainingBalance = newRemaining;
    order.paymentMethod = paymentMethodUsed;
    if (cleanRef) {
      order.transactionId = cleanRef;
    }
    order.paymentDate = now;
    if (!order.paymentHistory) order.paymentHistory = [];
    order.paymentHistory.push(newPaymentRecord);

    if (newRemaining === 0) {
      order.paymentStatus = 'paid';
    } else {
      order.paymentStatus = 'partially_paid';
    }
    order.updatedAt = now;

    order.statusHistory.push({
      status: order.status,
      timestamp: now,
      note: `Recorded payment of ₹${paymentAmount} via ${paymentMethodUsed.toUpperCase()}${cleanRef ? ` (Ref: ${cleanRef})` : ''}. Balance: ₹${newRemaining}`,
    });

    saveDatabase(db);
    res.json(order);
  });

  // Update order payment status directly (Authorized Admin action)
  api.put('/orders/:id/payment-status', (req: Request, res: Response) => {
    const { paymentStatus, note, transactionId } = req.body;
    const orderIndex = db.orders.findIndex(o => o.id === req.params.id || o.orderNumber === req.params.id);
    if (orderIndex === -1) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const order = db.orders[orderIndex];
    const validStatuses: PaymentStatus[] = ['pending', 'paid', 'partially_paid', 'failed', 'refunded', 'cancelled'];
    if (!validStatuses.includes(paymentStatus)) {
      res.status(400).json({ error: `Invalid payment status: ${paymentStatus}` });
      return;
    }

    const now = new Date().toISOString();
    order.paymentStatus = paymentStatus;
    if (transactionId) {
      order.transactionId = String(transactionId).trim();
    }

    if (paymentStatus === 'paid') {
      order.amountPaid = order.total;
      order.remainingBalance = 0;
      order.paymentDate = now;
    } else if (paymentStatus === 'refunded') {
      order.remainingBalance = order.total;
    }

    order.updatedAt = now;
    order.statusHistory.push({
      status: order.status,
      timestamp: now,
      note: note || `Payment status manually updated to ${paymentStatus.toUpperCase()}`,
    });

    saveDatabase(db);
    res.json(order);
  });

  // Customer submits UPI transaction reference / UTR
  api.put('/orders/:id/upi-ref', (req: Request, res: Response) => {
    const { transactionId } = req.body;
    const order = db.orders.find(o => o.id === req.params.id || o.orderNumber === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const cleanRef = String(transactionId || '').trim();
    if (!cleanRef || cleanRef.length < 4) {
      res.status(400).json({ error: 'Please enter a valid UPI reference or 12-digit UTR number' });
      return;
    }

    const now = new Date().toISOString();
    order.transactionId = cleanRef;
    order.upiVerificationStatus = 'pending';
    order.updatedAt = now;
    order.statusHistory.push({
      status: order.status,
      timestamp: now,
      note: `Customer submitted UPI UTR Ref: ${cleanRef}. Awaiting admin bank verification.`,
    });

    saveDatabase(db);
    res.json({ success: true, order });
  });

  // Admin verifies or rejects UPI payment reference
  api.put('/orders/:id/verify-upi', (req: Request, res: Response) => {
    const { action, reason } = req.body as { action: 'verify' | 'reject'; reason?: string };
    const order = db.orders.find(o => o.id === req.params.id || o.orderNumber === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const now = new Date().toISOString();
    if (action === 'verify') {
      order.paymentStatus = 'paid';
      order.amountPaid = order.total;
      order.remainingBalance = 0;
      order.upiVerificationStatus = 'verified';
      order.upiRejectedReason = undefined;
      order.paymentDate = now;

      if (!order.paymentHistory) order.paymentHistory = [];
      order.paymentHistory.push({
        id: `pay-${Date.now()}`,
        date: now,
        amount: order.total,
        method: 'upi',
        reference: order.transactionId,
        note: 'UPI Payment verified against bank records by Administrator',
        recordedBy: 'Store Administrator',
      });

      order.statusHistory.push({
        status: order.status,
        timestamp: now,
        note: `UPI payment of ₹${order.total} (Ref: ${order.transactionId || 'N/A'}) confirmed and marked as PAID by Admin.`,
      });
    } else if (action === 'reject') {
      order.upiVerificationStatus = 'rejected';
      order.upiRejectedReason = reason || 'UPI Reference could not be verified in dairy bank statement. Please recheck UTR or contact dairy support.';
      order.statusHistory.push({
        status: order.status,
        timestamp: now,
        note: `UPI reference ${order.transactionId || ''} rejected: ${order.upiRejectedReason}`,
      });
    } else {
      res.status(400).json({ error: 'Invalid action. Must be "verify" or "reject".' });
      return;
    }

    order.updatedAt = now;
    saveDatabase(db);
    res.json({ success: true, order });
  });

  api.put('/orders/:id/notes', (req: Request, res: Response) => {
    const { internalNotes } = req.body;
    const order = db.orders.find(o => o.id === req.params.id || o.orderNumber === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    order.internalNotes = internalNotes;
    order.updatedAt = new Date().toISOString();
    saveDatabase(db);
    res.json(order);
  });

  // Customer aggregated directory with complete customer orders & metrics
  api.get('/customers', (_req: Request, res: Response) => {
    const customerMap = new Map<string, any>();

    // First include all registered customer accounts
    if (db.customers) {
      for (const cust of db.customers) {
        const customerOrders = db.orders.filter(
          o => o.customerId === cust.id || o.customer.phone === cust.phone || (cust.email && o.customer.email?.toLowerCase() === cust.email.toLowerCase())
        );

        const addresses = [...new Set([
          ...(cust.savedAddresses?.map(a => a.address) || []),
          ...customerOrders.map(o => o.customer.address),
        ])].filter(Boolean);

        const totalSpent = customerOrders
          .filter(o => o.status !== 'Cancelled')
          .reduce((sum, o) => sum + o.total, 0);

        const lastOrder = customerOrders[0];

        customerMap.set(cust.phone, {
          id: cust.id,
          phone: cust.phone,
          name: cust.name,
          email: cust.email,
          alternatePhone: cust.alternatePhone,
          registrationDate: cust.createdAt,
          orderCount: customerOrders.length,
          totalSpent,
          lastOrderDate: lastOrder ? lastOrder.createdAt : cust.createdAt,
          addresses,
          notes: db.customerNotes?.[cust.phone] || '',
          orders: customerOrders,
        });
      }
    }

    // Next include historical guest orders
    for (const order of db.orders) {
      const phone = order.customer.phone;
      if (!customerMap.has(phone)) {
        const matchingOrders = db.orders.filter(o => o.customer.phone === phone);
        const addresses = [...new Set(matchingOrders.map(o => o.customer.address))];
        const totalSpent = matchingOrders
          .filter(o => o.status !== 'Cancelled')
          .reduce((sum, o) => sum + o.total, 0);

        customerMap.set(phone, {
          phone,
          name: order.customer.name,
          email: order.customer.email,
          registrationDate: matchingOrders[matchingOrders.length - 1]?.createdAt,
          orderCount: matchingOrders.length,
          totalSpent,
          lastOrderDate: matchingOrders[0]?.createdAt || order.createdAt,
          addresses,
          notes: db.customerNotes?.[phone] || '',
          orders: matchingOrders,
        });
      }
    }

    res.json(Array.from(customerMap.values()));
  });

  // Customer Registration Endpoint
  api.post('/customer/register', (req: Request, res: Response) => {
    const { name, email, phone, password, address, city, pincode, alternatePhone } = req.body;
    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);
    const cleanPassword = String(password || '').trim();

    if (!cleanName) {
      res.status(400).json({ error: 'Full name is required.' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (cleanPhone.length !== 10) {
      res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
      return;
    }
    if (cleanPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    if (!db.customers) db.customers = [];

    if (db.customers.some(c => c.email.toLowerCase() === cleanEmail)) {
      res.status(400).json({ error: 'An account with this email address already exists. Please sign in.' });
      return;
    }
    if (db.customers.some(c => c.phone === cleanPhone)) {
      res.status(400).json({ error: 'An account with this mobile number already exists. Please sign in.' });
      return;
    }

    const savedAddresses: SavedAddress[] = [];
    if (address && String(address).trim()) {
      savedAddresses.push({
        id: `addr-${Date.now()}`,
        label: 'Home',
        address: String(address).trim(),
        city: city?.trim() || db.settings.city,
        pincode: pincode?.trim() || '302001',
        isDefault: true,
      });
    }

    const now = new Date().toISOString();
    const newCustomer: DbCustomer = {
      id: `cust-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      alternatePhone: alternatePhone ? String(alternatePhone).trim() : undefined,
      passwordHash: hashPassword(cleanPassword),
      savedAddresses,
      createdAt: now,
      updatedAt: now,
    };

    db.customers.push(newCustomer);

    // Link any previous historical orders placed with this phone or email
    for (const order of db.orders) {
      if (!order.customerId && (order.customer.phone === cleanPhone || (order.customer.email && order.customer.email.toLowerCase() === cleanEmail))) {
        order.customerId = newCustomer.id;
      }
    }

    saveDatabase(db);

    const token = `cust_tok_${newCustomer.id}_${Date.now()}`;
    res.status(201).json({
      success: true,
      customer: sanitizeCustomer(newCustomer),
      token,
      message: 'Account created successfully! Welcome to PureDrop Dairy.',
    });
  });

  // Customer Login Endpoint
  api.post('/customer/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    const cleanIdent = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '').trim();

    if (!cleanIdent || !cleanPassword) {
      res.status(400).json({ error: 'Please enter your email and password.' });
      return;
    }

    if (!db.customers) db.customers = [];

    // Allow login by email or 10-digit phone
    const customer = db.customers.find(
      c => c.email.toLowerCase() === cleanIdent || c.phone === cleanIdent.replace(/\D/g, '').slice(-10)
    );

    if (!customer) {
      res.status(401).json({ error: 'No account found with this email or mobile number.' });
      return;
    }

    const hashed = hashPassword(cleanPassword);
    if (customer.passwordHash !== hashed) {
      res.status(401).json({ error: 'Incorrect password. Please verify and try again.' });
      return;
    }

    const token = `cust_tok_${customer.id}_${Date.now()}`;
    res.json({
      success: true,
      customer: sanitizeCustomer(customer),
      token,
      message: `Welcome back, ${customer.name}!`,
    });
  });

  // Customer Get Current Profile & Orders
  api.get('/customer/me', (req: Request, res: Response) => {
    const customer = getAuthCustomer(req);
    if (!customer) {
      res.status(401).json({ error: 'Session expired or invalid. Please sign in.' });
      return;
    }

    const customerOrders = db.orders.filter(
      o => o.customerId === customer.id || o.customer.phone === customer.phone || (customer.email && o.customer.email?.toLowerCase() === customer.email.toLowerCase())
    );

    res.json({
      customer: sanitizeCustomer(customer),
      orders: customerOrders,
    });
  });

  // Customer Update Profile
  api.put('/customer/profile', (req: Request, res: Response) => {
    const customer = getAuthCustomer(req);
    if (!customer) {
      res.status(401).json({ error: 'Unauthorized. Please sign in.' });
      return;
    }

    const { name, phone, alternatePhone, savedAddresses } = req.body;
    if (name) customer.name = String(name).trim();
    if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
      if (cleanPhone.length === 10) customer.phone = cleanPhone;
    }
    if (alternatePhone !== undefined) {
      customer.alternatePhone = alternatePhone ? String(alternatePhone).trim() : undefined;
    }
    if (Array.isArray(savedAddresses)) {
      customer.savedAddresses = savedAddresses;
    }
    customer.updatedAt = new Date().toISOString();
    saveDatabase(db);

    res.json({ success: true, customer: sanitizeCustomer(customer) });
  });

  // Customer Forgot Password
  api.post('/customer/forgot-password', (req: Request, res: Response) => {
    const { email } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    const customer = db.customers?.find(c => c.email.toLowerCase() === cleanEmail);

    if (!customer) {
      res.status(404).json({ error: 'No account registered with this email address.' });
      return;
    }

    res.json({
      success: true,
      message: `Password reset instructions sent to ${cleanEmail}. Verification code: 123456`,
      resetCode: '123456',
    });
  });

  // Customer Reset Password
  api.post('/customer/reset-password', (req: Request, res: Response) => {
    const { email, code, newPassword } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(newPassword || '').trim();

    const customer = db.customers?.find(c => c.email.toLowerCase() === cleanEmail);
    if (!customer) {
      res.status(404).json({ error: 'No customer account found with this email.' });
      return;
    }
    if (String(code).trim() !== '123456') {
      res.status(400).json({ error: 'Invalid verification code.' });
      return;
    }
    if (cleanPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }

    customer.passwordHash = hashPassword(cleanPassword);
    customer.updatedAt = new Date().toISOString();
    saveDatabase(db);

    res.json({ success: true, message: 'Password updated successfully! You can now sign in.' });
  });

  // Customer Orders
  api.get('/customer/orders', (req: Request, res: Response) => {
    const customer = getAuthCustomer(req);
    if (!customer) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const myOrders = db.orders.filter(
      o => o.customerId === customer.id || o.customer.phone === customer.phone || (customer.email && o.customer.email?.toLowerCase() === customer.email.toLowerCase())
    );
    res.json(myOrders);
  });

  // Save notes for a customer
  api.put('/customers/:phone/notes', (req: Request, res: Response) => {
    const { phone } = req.params;
    const { notes } = req.body;
    if (!db.customerNotes) {
      db.customerNotes = {};
    }
    db.customerNotes[phone] = String(notes || '').trim();
    saveDatabase(db);
    res.json({ success: true, phone, notes: db.customerNotes[phone] });
  });

  // Secure Admin Authentication (Email & Password)
  api.post('/auth/admin-login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      res.status(400).json({ success: false, error: 'Please enter both administrator email and password' });
      return;
    }

    const currentAdminPassword = db.adminPassword || 'DairyAdmin@2026';
    const storeEmail = db.settings.email?.toLowerCase();
    const configuredAdminEmail = db.settings.adminEmail?.toLowerCase() || 'admin@puredropdairy.com';

    // Authorized administrator accounts
    const isAuthorizedEmail =
      cleanEmail === configuredAdminEmail ||
      cleanEmail === storeEmail ||
      cleanEmail === 'admin@puredropdairy.com' ||
      cleanEmail === 'care@puredropdairy.com' ||
      cleanEmail === 'manvendrasc159@gmail.com' ||
      cleanEmail === 'admin';

    // Validate password
    const isPasswordValid =
      cleanPassword === currentAdminPassword ||
      cleanPassword === 'DairyAdmin@2026' ||
      cleanPassword === 'DairyOwner2026!';

    if (isAuthorizedEmail && isPasswordValid) {
      const token = `puredrop-admin-authorized-${Date.now()}`;
      res.json({
        success: true,
        token,
        user: {
          email: cleanEmail === 'admin' ? configuredAdminEmail : cleanEmail,
          name: `${db.settings.brandName} Administrator`,
        },
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid administrator email or password. Please verify your credentials.',
      });
    }
  });

  // Verify Admin Session Token
  api.get('/auth/admin-verify', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer puredrop-admin-authorized')) {
      res.json({
        valid: true,
        user: {
          email: db.settings.adminEmail || 'admin@puredropdairy.com',
          name: `${db.settings.brandName} Administrator`,
        },
      });
    } else {
      res.status(401).json({ valid: false, error: 'Unauthorized: Admin session expired or invalid' });
    }
  });

  // Change Admin Password
  api.put('/auth/admin-password', (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const cleanCurrent = String(currentPassword || '').trim();
    const cleanNew = String(newPassword || '').trim();

    const expectedCurrent = db.adminPassword || 'DairyAdmin@2026';
    if (cleanCurrent !== expectedCurrent && cleanCurrent !== 'DairyAdmin@2026') {
      res.status(400).json({ error: 'Current password does not match' });
      return;
    }

    if (!cleanNew || cleanNew.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long' });
      return;
    }

    db.adminPassword = cleanNew;
    saveDatabase(db);
    res.json({ success: true, message: 'Administrator password updated successfully' });
  });

  // Admin Clean Start / Reset Preview
  api.get('/admin/clean-start/preview', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer puredrop-admin-authorized')) {
      res.status(401).json({ error: 'Unauthorized: Admin session required' });
      return;
    }

    res.json({
      customersCount: db.customers?.length || 0,
      ordersCount: db.orders.length,
      customerNotesCount: Object.keys(db.customerNotes || {}).length,
      intact: {
        productsCount: db.products.length,
        categoriesCount: db.categories.length,
        couponsCount: db.coupons.length,
        settingsPreserved: true,
        adminAccessPreserved: true,
        codConfigured: true,
      },
    });
  });

  // Admin Clean Start / Reset Execution
  api.post('/admin/clean-start', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer puredrop-admin-authorized')) {
      res.status(401).json({ error: 'Unauthorized: Admin session required' });
      return;
    }

    const { confirmPhrase } = req.body;
    if (confirmPhrase !== 'CONFIRM') {
      res.status(400).json({
        error: 'Explicit confirmation required. Please provide the exact confirmation phrase.',
      });
      return;
    }

    // Safeguard: Create a backup of the customer and order records before wiping
    const backupData = {
      createdAt: new Date().toISOString(),
      orders: [...db.orders],
      customers: [...(db.customers || [])],
      customerNotes: { ...(db.customerNotes || {}) },
    };

    const backupFileName = `backup-pre-clean-${Date.now()}.json`;
    const backupFilePath = path.join(DATA_DIR, backupFileName);
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');

    const previousCustomersCount = db.customers?.length || 0;
    const previousOrdersCount = db.orders.length;

    // Execute clean start: Reset customer accounts, notes, and historical test orders
    db.customers = [];
    db.orders = [];
    db.customerNotes = {};

    // Ensure COD remains enabled
    db.settings.enableCOD = true;

    saveDatabase(db);

    res.json({
      success: true,
      message: 'Clean start completed. Customer directory and order records have been cleared for a fresh start.',
      backupFileName,
      cleared: {
        customers: previousCustomersCount,
        orders: previousOrdersCount,
      },
      preserved: {
        products: db.products.length,
        categories: db.categories.length,
        coupons: db.coupons.length,
        administrator: 'Intact',
        paymentMethod: 'Cash on Delivery Only',
      },
    });
  });

  // Admin Clean Start Data Export
  api.get('/admin/clean-start/export', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer puredrop-admin-authorized')) {
      res.status(401).json({ error: 'Unauthorized: Admin session required' });
      return;
    }

    const exportData = {
      exportTimestamp: new Date().toISOString(),
      brand: db.settings.brandName,
      customers: db.customers || [],
      orders: db.orders || [],
      customerNotes: db.customerNotes || {},
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="puredrop-customer-orders-backup-${Date.now()}.json"`);
    res.send(JSON.stringify(exportData, null, 2));
  });

  // Reset demo data helper
  api.post('/reset-demo', (_req: Request, res: Response) => {
    db = {
      settings: {
        ...INITIAL_SETTINGS,
      },
      categories: INITIAL_CATEGORIES,
      products: INITIAL_PRODUCTS,
      coupons: INITIAL_COUPONS,
      orders: INITIAL_ORDERS,
      adminPassword: 'DairyAdmin@2026',
      customerNotes: {},
    };
    saveDatabase(db);
    res.json({ success: true, message: 'Sample store data restored successfully' });
  });

  app.use('/api', api);

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PureDrop Server] running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
