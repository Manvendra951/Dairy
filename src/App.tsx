import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext.tsx';
import Navbar from './components/Navbar.tsx';
import Hero from './components/Hero.tsx';
import CategorySection from './components/CategorySection.tsx';
import ProductCard from './components/ProductCard.tsx';
import FeaturedSection from './components/FeaturedSection.tsx';
import TestimonialsSection from './components/TestimonialsSection.tsx';
import ShopPage from './components/ShopPage.tsx';
import Footer from './components/Footer.tsx';
import CartDrawer from './components/CartDrawer.tsx';
import CheckoutModal from './components/CheckoutModal.tsx';
import ProductModal from './components/ProductModal.tsx';
import OrderConfirmationModal from './components/OrderConfirmationModal.tsx';
import OrderTrackingModal from './components/OrderTrackingModal.tsx';
import CustomerAccountModal from './components/CustomerAccountModal.tsx';
import CustomerAuthModal from './components/CustomerAuthModal.tsx';
import InfoPagesModal from './components/InfoPagesModal.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import { ArrowRight } from 'lucide-react';

function StorefrontContent() {
  const { activeView, products, setActiveView, setSelectedCategory } = useStore();

  if (activeView === 'admin') {
    return <AdminDashboard />;
  }

  if (activeView === 'shop') {
    return (
      <div className="flex flex-col min-h-screen bg-[#FAFCF7]">
        <Navbar />
        <main className="flex-1">
          <ShopPage />
        </main>
        <Footer />
        <Modals />
      </div>
    );
  }

  // Home Store View
  const bestsellers = products.filter(p => p.isPublished && p.isFeatured).slice(0, 8);
  const featuredList = bestsellers.length > 0 ? bestsellers : products.filter(p => p.isPublished).slice(0, 8);

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFCF7]">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <Hero />

        {/* Categories Section */}
        <CategorySection />

        {/* Best-Selling Dairy Products Grid */}
        <section className="py-14 bg-white border-b border-[#DCE9D5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#397548] bg-[#EAF4E5] border border-[#DCE9D5] px-3 py-1 rounded-full inline-block mb-2">
                  Daily Favorites
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#26352B] font-serif-accent tracking-tight">
                  Best-Selling Fresh Dairy
                </h2>
                <p className="text-xs sm:text-sm text-[#69766B] mt-1 max-w-xl">
                  Harvested fresh every morning, certified for 100% purity and zero adulteration, and delivered before breakfast.
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setActiveView('shop');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#397548] hover:text-[#2E5E3A] transition-colors cursor-pointer group"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredList.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* Why PureDrop & Farm-Fresh Quality */}
        <FeaturedSection />

        {/* Customer Reviews & Farm Newsletter */}
        <TestimonialsSection />
      </main>

      <Footer />
      <Modals />
    </div>
  );
}

function Modals() {
  return (
    <>
      <CartDrawer />
      <CheckoutModal />
      <ProductModal />
      <OrderConfirmationModal />
      <OrderTrackingModal />
      <CustomerAccountModal />
      <CustomerAuthModal />
      <InfoPagesModal />
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <StorefrontContent />
    </StoreProvider>
  );
}
