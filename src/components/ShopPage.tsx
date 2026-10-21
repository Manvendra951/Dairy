import React, { useState } from 'react';
import { Search, Filter, SlidersHorizontal, ArrowUpDown, X, Sparkles } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import ProductCard from './ProductCard.tsx';

export default function ShopPage() {
  const {
    products,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    settings,
  } = useStore();

  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'name'>('popular');
  const [onlyInStock, setOnlyInStock] = useState(false);

  // Filter products
  let filtered = products.filter(p => p.isPublished);

  if (selectedCategory !== 'all') {
    filtered = filtered.filter(p => p.categoryId === selectedCategory);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.unit.toLowerCase().includes(q)
    );
  }

  if (onlyInStock) {
    filtered = filtered.filter(p => p.isMadeToOrder || p.stockQuantity > 0);
  }

  // Sort products
  filtered.sort((a, b) => {
    const priceA = a.salePrice || a.price;
    const priceB = b.salePrice || b.price;

    if (sortBy === 'price-asc') return priceA - priceB;
    if (sortBy === 'price-desc') return priceB - priceA;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    // default: popular / featured first
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return 0;
  });

  const activeCategoryObj = categories.find(c => c.id === selectedCategory);

  return (
    <div className="py-8 sm:py-12 bg-[#FAFCF7] min-h-[70vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Shop Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#397548]">
            <span>Home</span>
            <span>/</span>
            <span>Shop Products</span>
            {activeCategoryObj && (
              <>
                <span>/</span>
                <span className="text-[#26352B]">{activeCategoryObj.name}</span>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-[#26352B] font-serif-accent tracking-tight">
                {activeCategoryObj ? activeCategoryObj.name : 'Farm Fresh Dairy Products'}
              </h1>
              <p className="text-xs sm:text-sm text-[#69766B] mt-1 max-w-xl">
                {activeCategoryObj
                  ? activeCategoryObj.description
                  : 'Pure morning cow & buffalo milk, Vedic bilona ghee, probiotic curd, fresh paneer, and breakfast bundles.'}
              </p>
            </div>

            <span className="text-xs font-semibold text-[#69766B] shrink-0">
              Showing <strong>{filtered.length}</strong> fresh dairy product{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#DCE9D5] shadow-xs space-y-4">
          {/* Category Pills Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#397548] text-white font-bold shadow-xs'
                  : 'bg-[#FAFCF7] hover:bg-[#EAF4E5] text-[#26352B] border border-[#DCE9D5]'
              }`}
            >
              All Products
            </button>
            {categories
              .filter(c => c.isVisible)
              .map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#397548] text-white font-bold shadow-xs'
                      : 'bg-[#FAFCF7] hover:bg-[#EAF4E5] text-[#26352B] border border-[#DCE9D5]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
          </div>

          {/* Search, In-stock toggle, and Sort row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#DCE9D5] text-xs">
            {/* Live Search Input */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search by product name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-[#DCE9D5] bg-[#FAFCF7] focus:bg-white focus:border-[#397548] outline-hidden text-[#26352B]"
              />
              <Search className="w-4 h-4 text-[#69766B] absolute left-3 top-2.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-[#69766B] hover:text-[#26352B]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              {/* Only in-stock toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={e => setOnlyInStock(e.target.checked)}
                  className="w-4 h-4 accent-[#397548] rounded"
                />
                <span className="font-semibold text-[#26352B]">In Stock Only</span>
              </label>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 bg-[#FAFCF7] border border-[#DCE9D5] px-3 py-1.5 rounded-xl">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#69766B]" />
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="bg-transparent font-semibold text-[#26352B] outline-hidden cursor-pointer"
                >
                  <option value="popular">Most Popular</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name">Product Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters Pill Bar */}
        {(selectedCategory !== 'all' || searchQuery.trim() || onlyInStock) && (
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[#69766B] font-semibold">Active Filters:</span>
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-[#EAF4E5] text-[#26352B] px-2.5 py-1 rounded-full font-bold">
                {activeCategoryObj?.name}
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="hover:text-[#397548] font-bold"
                >
                  ×
                </button>
              </span>
            )}
            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1 bg-[#EAF4E5] text-[#26352B] px-2.5 py-1 rounded-full font-bold">
                "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-[#397548] font-bold">
                  ×
                </button>
              </span>
            )}
            {onlyInStock && (
              <span className="inline-flex items-center gap-1 bg-[#EAF4E5] text-[#26352B] px-2.5 py-1 rounded-full font-bold">
                In Stock
                <button onClick={() => setOnlyInStock(false)} className="hover:text-[#397548] font-bold">
                  ×
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setOnlyInStock(false);
              }}
              className="text-[#397548] font-bold hover:underline ml-2 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Product Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#DCE9D5] shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#FAFCF7] border border-[#DCE9D5] flex items-center justify-center text-3xl mx-auto">
              🥛
            </div>
            <h3 className="font-bold text-[#26352B] text-lg font-serif-accent">No matching dairy products found</h3>
            <p className="text-xs sm:text-sm text-[#69766B] max-w-sm mx-auto">
              Try adjusting your search query, clearing filters, or browsing all categories.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setOnlyInStock(false);
              }}
              className="px-6 py-2.5 rounded-full bg-[#397548] text-white font-bold text-xs hover:bg-[#2E5E3A] shadow-xs cursor-pointer"
            >
              Reset Filters & Show All
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
