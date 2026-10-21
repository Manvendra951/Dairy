import React, { useState } from 'react';
import { Plus, Minus, Eye } from 'lucide-react';
import type { Product } from '../types/dairy.js';
import { useStore } from '../context/StoreContext.tsx';
import { formatCurrency } from '../utils/pricing.ts';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const {
    settings,
    cart,
    addToCart,
    updateCartQuantity,
    setSelectedProductForModal,
  } = useStore();

  const [selectedVariantId, setSelectedVariantId] = useState<string>(() => {
    return product.variants.length > 0 ? product.variants[0].id : '';
  });

  const selectedVariant = product.variants.find(v => v.id === selectedVariantId);
  const currentPrice = selectedVariant
    ? selectedVariant.salePrice || selectedVariant.price
    : product.salePrice || product.price;
  const originalPrice = selectedVariant ? selectedVariant.price : product.price;
  const hasDiscount = selectedVariant ? !!selectedVariant.salePrice : !!product.salePrice;
  const currentUnit = selectedVariant ? selectedVariant.unit : product.unit;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stockQuantity;
  const isAvailable = product.isMadeToOrder || currentStock > 0;

  // Cart item matching this exact product and variant
  const cartItemId = `${product.id}-${selectedVariantId || 'default'}`;
  const cartItem = cart.find(item => item.id === cartItemId);
  const cartQty = cartItem ? cartItem.quantity : 0;

  const handleAdd = () => {
    addToCart(product, selectedVariantId || undefined, 1);
  };

  const handleIncrement = () => {
    if (!product.isMadeToOrder && cartQty >= currentStock) return;
    updateCartQuantity(cartItemId, cartQty + 1);
  };

  const handleDecrement = () => {
    updateCartQuantity(cartItemId, cartQty - 1);
  };

  return (
    <div className="group bg-white rounded-2xl border border-[#DCE9D5] shadow-xs hover:shadow-lg hover:-translate-y-1 hover:border-[#397548] transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Top Image Container */}
      <div className="relative aspect-4/3 overflow-hidden bg-[#FAFCF7]">
        <img
          src={
            product.images[0] ||
            'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80'
          }
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
          loading="lazy"
        />

        {/* Floating Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
          {hasDiscount && (
            <span className="bg-amber-500 text-white font-extrabold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-md shadow-2xs">
              SALE
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-[#397548] text-white font-semibold text-[10px] px-2 py-0.5 rounded-md shadow-2xs">
              POPULAR
            </span>
          )}
          {!isAvailable && (
            <span className="bg-rose-700 text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow-2xs">
              OUT OF STOCK
            </span>
          )}
        </div>

        {/* Quick View Button */}
        <button
          onClick={() => setSelectedProductForModal(product)}
          className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 backdrop-blur-md text-[#26352B] hover:text-[#397548] hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          title="Quick View"
          aria-label={`Quick view details for ${product.name}`}
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Low Stock Warning */}
        {isAvailable && !product.isMadeToOrder && currentStock <= 5 && (
          <div className="absolute bottom-2 left-2 right-2 bg-amber-500/90 backdrop-blur-xs text-white text-[10px] font-bold py-0.5 px-2 rounded-md text-center">
            Only {currentStock} left today!
          </div>
        )}
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <button
            onClick={() => setSelectedProductForModal(product)}
            className="text-left group/title block cursor-pointer"
          >
            <h3 className="font-semibold text-base text-[#26352B] group-hover/title:text-[#397548] transition-colors line-clamp-1">
              {product.name}
            </h3>
          </button>
          <p className="text-xs text-[#69766B] line-clamp-2 mt-1">
            {product.description}
          </p>
        </div>

        {/* Variant Selector (if variants exist) */}
        {product.variants.length > 1 && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#69766B] uppercase tracking-wider">
              Select Pack Size
            </label>
            <div className="flex flex-wrap gap-1.5">
              {product.variants.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariantId(v.id)}
                  className={`px-2 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    selectedVariantId === v.id
                      ? 'bg-[#EAF4E5] border-[#397548] text-[#397548] font-bold shadow-2xs ring-1 ring-[#397548]'
                      : 'bg-white border-[#DCE9D5] text-[#26352B] hover:border-[#397548]'
                  }`}
                >
                  {v.unit}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price & Action Row */}
        <div className="pt-2 border-t border-[#DCE9D5] flex items-center justify-between gap-2 mt-auto">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-[#397548]">
                {formatCurrency(currentPrice, settings.currencySymbol)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-stone-400 line-through">
                  {formatCurrency(originalPrice, settings.currencySymbol)}
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#69766B] font-medium">
              per {currentUnit}
            </span>
          </div>

          {/* Add to Cart or Quantity Stepper */}
          {!isAvailable ? (
            <button
              disabled
              className="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-400 text-xs font-medium cursor-not-allowed"
            >
              Sold Out
            </button>
          ) : cartQty === 0 ? (
            <button
              onClick={handleAdd}
              className="px-4 py-2 rounded-xl bg-[#397548] text-white text-xs font-bold hover:bg-[#2E5E3A] shadow-xs hover:shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              aria-label={`Add ${product.name} to cart`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </button>
          ) : (
            <div className="flex items-center bg-[#EAF4E5] border border-[#DCE9D5] rounded-xl p-0.5 shadow-2xs">
              <button
                onClick={handleDecrement}
                className="w-7 h-7 flex items-center justify-center text-[#397548] hover:bg-[#DCE9D5] rounded-lg transition-colors cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center text-xs font-bold text-[#26352B]">
                {cartQty}
              </span>
              <button
                onClick={handleIncrement}
                disabled={!product.isMadeToOrder && cartQty >= currentStock}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  !product.isMadeToOrder && cartQty >= currentStock
                    ? 'text-stone-300 cursor-not-allowed'
                    : 'text-[#397548] hover:bg-[#DCE9D5]'
                }`}
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
