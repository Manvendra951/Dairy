import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  User,
  Shield,
  Menu,
  X,
  Phone,
  Truck,
  ArrowRight,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { formatCurrency } from '../utils/pricing.ts';

export default function Navbar() {
  const {
    settings,
    cart,
    categories,
    products,
    setIsCartOpen,
    activeView,
    setActiveView,
    selectedCategory,
    setSelectedCategory,
    setSearchQuery,
    searchQuery,
    setSelectedProductForModal,
    setIsAccountModalOpen,
    setIsInfoModalOpen,
    setIsTrackingModalOpen,
    customer,
    isCustomerLoggedIn,
    openCustomerAuthModal,
  } = useStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.effectivePrice * item.quantity, 0);

  // Filtered products for search dropdown
  const searchResults = searchQuery.trim()
    ? products
        .filter(p => p.isPublished && p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 5)
    : [];

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#DCE9D5] shadow-xs">
      {/* Top Announcement Bar (Fresh Forest Green #2E5E3A) */}
      {settings.isAnnouncementVisible && settings.announcement && (
        <div className="bg-[#2E5E3A] text-white px-4 py-2 text-xs md:text-sm font-medium tracking-wide transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-[#EAF4E5] animate-pulse"></span>
              <p className="truncate text-white">{settings.announcement}</p>
            </div>
            <div className="hidden lg:flex items-center gap-6 shrink-0 text-[#EAF4E5] text-xs">
              <a
                href={`tel:${settings.phone}`}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#EAF4E5]" />
                <span>{settings.phone}</span>
              </a>
              <span className="text-[#397548]">|</span>
              <button
                onClick={() => setIsTrackingModalOpen(true)}
                className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5 text-[#EAF4E5]" />
                <span>Track Order</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 md:py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Mobile menu button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-[#26352B] hover:text-[#397548] hover:bg-[#EAF4E5] rounded-xl transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Logo & Name */}
          <button
            onClick={() => {
              setActiveView('store');
              setSelectedCategory('all');
            }}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-[#397548] flex items-center justify-center text-white shadow-sm shadow-[#397548]/20 group-hover:bg-[#2E5E3A] transition-colors">
              <span className="text-xl">🥛</span>
            </div>
            <div>
              <span className="font-serif-accent text-xl md:text-2xl font-bold tracking-tight text-[#26352B] block leading-none">
                {settings.brandName}
              </span>
              <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-[#397548]">
                Farm-Fresh • Natural Purity
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#26352B]">
            <button
              onClick={() => {
                setActiveView('store');
                setSelectedCategory('all');
              }}
              className={`transition-colors cursor-pointer hover:text-[#397548] ${
                activeView === 'store' && selectedCategory === 'all'
                  ? 'text-[#397548] font-bold underline underline-offset-8 decoration-2 decoration-[#397548]'
                  : ''
              }`}
            >
              Home
            </button>
            <button
              onClick={() => {
                setActiveView('shop');
                setSelectedCategory('all');
              }}
              className={`transition-colors cursor-pointer hover:text-[#397548] ${
                activeView === 'shop'
                  ? 'text-[#397548] font-bold underline underline-offset-8 decoration-2 decoration-[#397548]'
                  : ''
              }`}
            >
              Shop Products
            </button>
            <div className="relative group">
              <button
                onClick={() => {
                  setActiveView('shop');
                }}
                className="flex items-center gap-1 transition-colors cursor-pointer hover:text-[#397548]"
              >
                Categories
                <span className="text-xs text-[#69766B]">▾</span>
              </button>
              {/* Category Dropdown */}
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#DCE9D5] p-2 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                {categories
                  .filter(c => c.isVisible)
                  .map(category => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setActiveView('shop');
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-[#26352B] hover:bg-[#EAF4E5] hover:text-[#397548] rounded-xl transition-colors flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-6 h-6 rounded-md object-cover border border-[#DCE9D5]"
                      />
                      <span>{category.name}</span>
                    </button>
                  ))}
              </div>
            </div>
            <button
              onClick={() => setIsInfoModalOpen('about')}
              className="transition-colors cursor-pointer hover:text-[#397548]"
            >
              About Us
            </button>
            <button
              onClick={() => setIsInfoModalOpen('contact')}
              className="transition-colors cursor-pointer hover:text-[#397548]"
            >
              Contact
            </button>
            <button
              onClick={() => setIsTrackingModalOpen(true)}
              className="transition-colors cursor-pointer hover:text-[#397548]"
            >
              Track Order
            </button>
          </nav>

          {/* Header Action Icons */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Live Search Trigger & Input */}
            <div className="relative">
              <div className="hidden md:flex items-center relative">
                <input
                  type="text"
                  placeholder="Search cow milk, ghee, paneer..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-48 lg:w-60 pl-9 pr-4 py-1.5 text-xs lg:text-sm bg-[#FAFCF7] border border-[#DCE9D5] focus:border-[#397548] focus:bg-white rounded-full transition-all outline-hidden text-[#26352B] placeholder:text-[#69766B]/60"
                />
                <Search className="w-4 h-4 text-[#69766B] absolute left-3 pointer-events-none" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 text-[#69766B] hover:text-[#26352B] text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Mobile Search Icon */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="md:hidden p-2 text-[#26352B] hover:text-[#397548] hover:bg-[#EAF4E5] rounded-full"
                aria-label="Open search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Desktop Autocomplete Results */}
              {searchQuery.trim().length > 0 && searchResults.length > 0 && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#DCE9D5] p-2 z-50">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-[#69766B] uppercase tracking-wider">
                    Matching Products ({searchResults.length})
                  </div>
                  {searchResults.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedProductForModal(p);
                        setSearchQuery('');
                      }}
                      className="w-full p-2 hover:bg-[#EAF4E5] rounded-xl flex items-center gap-3 text-left transition-colors cursor-pointer"
                    >
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-10 h-10 rounded-lg object-cover border border-[#DCE9D5]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#26352B] truncate">{p.name}</p>
                        <p className="text-xs text-[#397548] font-semibold">
                          {formatCurrency(p.salePrice || p.price, settings.currencySymbol)}
                          <span className="text-[#69766B] font-normal ml-1">/ {p.unit}</span>
                        </p>
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setActiveView('shop');
                    }}
                    className="w-full text-center text-xs text-[#397548] font-bold py-2 hover:underline cursor-pointer border-t border-[#DCE9D5] mt-1"
                  >
                    View all matching products →
                  </button>
                </div>
              )}
            </div>

            {/* Customer Account / Sign In Button */}
            {isCustomerLoggedIn && customer ? (
              <button
                onClick={() => setIsAccountModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#DCE9D5] bg-[#EAF4E5]/50 hover:bg-[#EAF4E5] text-[#26352B] hover:text-[#397548] transition-all cursor-pointer shadow-2xs"
                aria-label="Account"
                title="Account & My Orders"
              >
                <div className="w-5 h-5 rounded-full bg-[#397548] text-white flex items-center justify-center font-bold text-[10px]">
                  {customer.name.slice(0, 1).toUpperCase()}
                </div>
                <span className="text-xs font-bold hidden sm:inline">
                  {customer.name.split(' ')[0]}
                </span>
              </button>
            ) : (
              <button
                onClick={() => openCustomerAuthModal('login')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#DCE9D5] bg-[#EAF4E5] hover:bg-[#DCE9D5] text-[#397548] transition-all cursor-pointer shadow-2xs font-bold text-xs"
                aria-label="Sign In or Register"
                title="Sign In or Create Account"
              >
                <User className="w-4 h-4 text-[#397548]" />
                <span className="inline">Sign In</span>
              </button>
            )}

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 bg-[#397548] text-white px-3.5 md:px-4 py-2 rounded-full font-medium text-xs md:text-sm shadow-md shadow-[#397548]/15 hover:bg-[#2E5E3A] transition-all transform active:scale-95 cursor-pointer"
              aria-label={`Cart with ${cartItemCount} items`}
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-white" />
                {cartItemCount > 0 && (
                  <span
                    key={cartItemCount}
                    className="absolute -top-2 -right-2 bg-amber-400 text-[#26352B] font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-cart-pop transition-transform"
                  >
                    {cartItemCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline font-bold">
                {cartSubtotal > 0 ? formatCurrency(cartSubtotal, settings.currencySymbol) : 'Cart'}
              </span>
            </button>

            {/* Admin Dashboard Switch */}
            <button
              onClick={() => setActiveView(activeView === 'admin' ? 'store' : 'admin')}
              className={`p-2 rounded-full border transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                activeView === 'admin'
                  ? 'bg-[#2E5E3A] border-[#2E5E3A] text-white'
                  : 'bg-[#FAFCF7] border-[#DCE9D5] text-[#397548] hover:bg-[#EAF4E5]'
              }`}
              title="Dairy Store Admin Dashboard"
              aria-label="Toggle Dairy Store Admin Dashboard"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden xl:inline text-xs font-bold">
                {activeView === 'admin' ? 'Exit Admin' : 'Admin'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile search bar dropdown */}
        {isSearchOpen && (
          <div className="mt-3 md:hidden">
            <div className="relative">
              <input
                type="text"
                placeholder="Search cow milk, paneer, ghee..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm bg-[#FAFCF7] rounded-xl outline-hidden border border-[#DCE9D5] focus:border-[#397548] focus:bg-white text-[#26352B]"
                autoFocus
              />
              <Search className="w-4 h-4 text-[#69766B] absolute left-3 top-3" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-stone-400 text-sm cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
            {/* Mobile search results preview */}
            {searchQuery.trim().length > 0 && searchResults.length > 0 && (
              <div className="mt-2 bg-white rounded-xl shadow-lg border border-[#DCE9D5] p-2">
                {searchResults.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProductForModal(p);
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full p-2 hover:bg-[#EAF4E5] rounded-lg flex items-center gap-3 text-left"
                  >
                    <img src={p.images[0]} alt={p.name} className="w-8 h-8 rounded object-cover border border-[#DCE9D5]" />
                    <div className="flex-1 truncate">
                      <p className="text-xs font-bold text-[#26352B] truncate">{p.name}</p>
                      <p className="text-[11px] text-[#397548] font-semibold">
                        {formatCurrency(p.salePrice || p.price, settings.currencySymbol)} / {p.unit}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#DCE9D5] px-4 py-4 space-y-3 animate-in fade-in duration-150">
          <div className="p-3 bg-[#EAF4E5]/50 rounded-2xl border border-[#DCE9D5] flex items-center justify-between">
            {isCustomerLoggedIn && customer ? (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#397548] text-white flex items-center justify-center font-bold text-xs">
                  {customer.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-xs text-[#26352B]">{customer.name}</p>
                  <p className="text-[10px] text-[#69766B]">+91 {customer.phone}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#397548]" />
                <div>
                  <p className="font-bold text-xs text-[#26352B]">Welcome to PureDrop</p>
                  <p className="text-[10px] text-[#69766B]">Sign in to place orders</p>
                </div>
              </div>
            )}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (isCustomerLoggedIn) {
                  setIsAccountModalOpen(true);
                } else {
                  openCustomerAuthModal('login');
                }
              }}
              className="px-3 py-1.5 bg-[#397548] text-white rounded-xl text-xs font-bold hover:bg-[#2E5E3A] cursor-pointer"
            >
              {isCustomerLoggedIn ? 'Account' : 'Sign In'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm font-semibold">
            <button
              onClick={() => {
                setActiveView('store');
                setSelectedCategory('all');
                setIsMobileMenuOpen(false);
              }}
              className="p-2.5 text-left rounded-xl bg-[#FAFCF7] hover:bg-[#EAF4E5] text-[#26352B]"
            >
              🏠 Home
            </button>
            <button
              onClick={() => {
                setActiveView('shop');
                setSelectedCategory('all');
                setIsMobileMenuOpen(false);
              }}
              className="p-2.5 text-left rounded-xl bg-[#FAFCF7] hover:bg-[#EAF4E5] text-[#26352B]"
            >
              🥛 Shop Products
            </button>
            <button
              onClick={() => {
                setIsInfoModalOpen('about');
                setIsMobileMenuOpen(false);
              }}
              className="p-2.5 text-left rounded-xl bg-[#FAFCF7] hover:bg-[#EAF4E5] text-[#26352B]"
            >
              🌿 About Us
            </button>
            <button
              onClick={() => {
                setIsInfoModalOpen('contact');
                setIsMobileMenuOpen(false);
              }}
              className="p-2.5 text-left rounded-xl bg-[#FAFCF7] hover:bg-[#EAF4E5] text-[#26352B]"
            >
              📞 Contact
            </button>
            <button
              onClick={() => {
                setIsTrackingModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="p-2.5 text-left rounded-xl bg-[#FAFCF7] hover:bg-[#EAF4E5] text-[#26352B] col-span-2 flex items-center justify-between"
            >
              <span>🚚 Track Order</span>
              <ArrowRight className="w-4 h-4 text-[#397548]" />
            </button>
          </div>

          <div className="pt-2 border-t border-[#DCE9D5]">
            <p className="text-[10px] font-bold uppercase text-[#69766B] tracking-wider mb-2">
              Popular Dairy Categories
            </p>
            <div className="flex flex-wrap gap-1.5">
              {categories
                .filter(c => c.isVisible)
                .slice(0, 6)
                .map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCategory(c.id);
                      setActiveView('shop');
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-[#EAF4E5] text-[#397548] font-semibold hover:bg-[#DCE9D5]"
                  >
                    {c.name}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
