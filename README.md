# 🥛 PureDrop Dairy — Full-Stack Dairy E-Commerce & Management Platform

**PureDrop Dairy** is a complete, production-oriented dairy e-commerce website and business management application designed for dairy farm owners, artisanal milk producers, and local fresh food businesses.

Inspired by modern direct-to-consumer farm experiences, PureDrop Dairy provides an elegant, approachable customer storefront paired with a simple, code-free Admin Control Center built for non-technical dairy business owners.

---

## 🌟 Key Features

### 🛒 1. Customer-Facing Storefront
- **Freshness-Focused Aesthetic**: Elegant cream/stone backdrop, deep forest green primary tones (`#183B2B`), and warm golden accents.
- **Dynamic Announcement Bar**: Manageable in Admin settings for delivery updates, morning slots, and promotional codes.
- **Product Catalog & Filters**:
  - Browse by category (*Fresh Milk, Curd & Yogurt, Fresh Paneer, Pure Desi Ghee, Artisanal Butter, Craft Cheese, Buttermilk & Lassi, Dairy Combos*).
  - Search by product name or package size with instant live autocomplete.
  - Sort by Price (Low to High / High to Low), Popularity, or Name.
  - "In Stock Only" toggle with low-stock warnings.
- **Product Details & Pack Size Variants**:
  - Interactive variant selector (e.g. 500 ml, 1 Litre, 2 Litre / 200 g, 500 g, 1 kg) with automatic price and stock updates.
  - Storage instructions, handling guidelines, and 28-point purity highlights.
  - Related product recommendations.
- **Smart Shopping Basket**:
  - Interactive quantity stepper (`+`, `-`) with stock limits.
  - Dynamic Free Delivery Progress Bar (e.g., *"Add ₹159 more for FREE Morning Delivery!"*).
  - Promo code validation engine (percentage or flat ₹ discounts).
- **Express 4-Step Checkout**:
  - Name, mobile number (10-digit validation), and delivery address.
  - Instant delivery PIN code serviceability verification.
  - Delivery slot selection: **Morning (5:30 AM - 7:30 AM)** or **Evening (5:00 PM - 7:00 PM)**.
  - Payment methods: Cash on Delivery (COD), UPI / QR Code, and Debit/Credit Card.
  - Full server-side price and discount verification.
- **Order Confirmation & Live Tracking**:
  - Unique order tracking ID (e.g., `PD-87368`).
  - 5-stage lifecycle stepper: `New Order` ➔ `Confirmed` ➔ `Preparing` ➔ `Out for Delivery` ➔ `Delivered`.
  - Printable delivery invoice and packing receipt.
- **Customer Account & Reordering**:
  - Past orders history.
  - 1-click **Reorder Basket** functionality.
  - Saved doorstep instructions and addresses.
- **Informational Guides & Policies**:
  - Farm story & animal welfare standards (*About Us*).
  - Depot phone, WhatsApp, email, and farm address (*Contact Us*).
  - Frequently Asked Questions (*FAQs*).
  - Morning cold-chain shipping policy and 6-hour freshness replacement guarantee.

---

### 🛡️ 2. Simple Admin Dashboard (`/admin`)
Accessible via the **Admin** button in the header or directly at `/admin`:
- **Security PIN Gate**: Protected access (Default PIN: `1234` or click "⚡ Quick Demo Owner Access").
- **Dashboard Overview**:
  - Daily KPIs: *Today's Orders, Today's Sales, Pending Orders, Total Products, Low-Stock Alerts, Total Customers*.
  - Live recent orders feed with quick status indicators.
- **Product Management**:
  - Add, edit, and unpublish products without editing any code.
  - Configure regular price, sale price, standard units, multiple pack variants, and stock quantity.
  - Support for "Made to order" (bypasses inventory limits for freshly churned products).
- **Order Management**:
  - Search by customer name, mobile number, or order ID.
  - Filter by lifecycle status.
  - Update order statuses (`New Order` ➔ `Confirmed` ➔ `Preparing` ➔ `Out for Delivery` ➔ `Delivered` ➔ `Cancelled`).
  - **Stock Restoration**: Cancelling an order automatically restores inventory quantities.
  - Printable thermal / A4 delivery packing slips.
  - Internal runner notes (e.g. delivery runner assignments).
- **Category Management**:
  - Create, edit, reorder, and toggle visibility of store categories.
- **Customer Directory**:
  - Aggregated view of customer spending, order counts, and last delivery dates.
- **Coupons & Promotions**:
  - Create coupon codes, set percentage or flat rupee discounts, minimum order thresholds, and expiry dates.
- **Website & Store Settings**:
  - Update brand name, tagline, phone, email, and depot address.
  - Configure delivery fee, free delivery threshold, and minimum order values.
  - Serviceable postal PIN codes whitelist.
  - Toggle order acceptance (*"Currently Accepting Orders"* vs *"Store Paused"*).

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons.
- **Backend**: Express server (`server.ts`) with Vite middleware mounted in dev mode.
- **Persistence**: File-based atomic JSON storage (`data/store-db.json`) preserving orders, products, categories, coupons, and settings across restarts.
- **Unit Testing**: Native Node 22 test runner (`node:test`, `node:assert/strict`) in `src/utils/pricing.test.ts`.

---

## 🚀 Getting Started

### 1. Install & Run Dev Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Run Pure Logic Unit Tests
```bash
node --test src/utils/pricing.test.ts
```

### 3. Production Build
```bash
npm run build
npm run start
```

---

## 📋 Pre-Launch Checklist for Dairy Owners

1. **Brand Settings**: Open Admin Dashboard ➔ *Website Settings* ➔ update your Brand Name, Contact Phone, WhatsApp, and Depot Address.
2. **Serviceable Areas**: Add your delivery PIN codes in *Website Settings* (e.g. `302001, 302002, 110001`).
3. **Delivery Charges**: Set your standard delivery fee and free delivery threshold (e.g., Free for orders above ₹499).
4. **Coupons**: Verify active promo codes in *Discounts & Coupons* (default demo codes: `FRESH10`, `PUREDROP50`).
5. **Inventory & Prices**: Update prices and initial stock quantities for Cow Milk, Buffalo Milk, Paneer, and Ghee.
6. **Payment Setup**: Verify Cash on Delivery or connect UPI / online payment gateways as needed.
