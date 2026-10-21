import React, { useState } from 'react';
import { X, Check, ShieldCheck, Thermometer, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { formatCurrency } from '../utils/pricing.ts';

export default function ProductModal() {
  const {
    settings,
    selectedProductForModal,
    setSelectedProductForModal,
    addToCart,
    setIsCartOpen,
    products,
  } = useStore();

  const product = selectedProductForModal;
  if (!product) return null;

  const [selectedVariantId, setSelectedVariantId] = useState<string>(() => {
    return product.variants.length > 0 ? product.variants[0].id : '';
  });
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  const selectedVariant = product.variants.find(v => v.id === selectedVariantId);
  const currentPrice = selectedVariant
    ? selectedVariant.salePrice || selectedVariant.price
    : product.salePrice || product.price;
  const originalPrice = selectedVariant ? selectedVariant.price : product.price;
  const hasDiscount = selectedVariant ? !!selectedVariant.salePrice : !!product.salePrice;
  const currentUnit = selectedVariant ? selectedVariant.unit : product.unit;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stockQuantity;
  const isAvailable = product.isMadeToOrder || currentStock > 0;

  const handleAddToCart = () => {
    if (!isAvailable) return;
    const success = addToCart(product, selectedVariantId || undefined, quantity);
    if (success) {
      setAddedNotice(true);
      setTimeout(() => setAddedNotice(false), 2000);
    }
  };

  // Related products in same category
  const related = products
    .filter(p => p.id !== product.id && p.categoryId === product.categoryId && p.isPublished)
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-[#DCE9D5] relative animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => setSelectedProductForModal(null)}
          className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/90 backdrop-blur-md text-[#26352B] hover:text-[#397548] hover:bg-white shadow-md transition-all cursor-pointer"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-[#FAFCF7]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-start">
            {/* Left: Gallery */}
            <div className="space-y-3">
              <div className="aspect-4/3 rounded-2xl overflow-hidden bg-white border border-[#DCE9D5] shadow-xs">
                <img
                  src={
                    product.images[selectedImageIndex] ||
                    'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Thumbnails if multiple images */}
              {product.images.length > 1 && (
                <div className="flex gap-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedImageIndex === idx
                          ? 'border-[#397548] ring-2 ring-[#397548]/20'
                          : 'border-[#DCE9D5] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Quality highlight box */}
              <div className="p-3.5 bg-white border border-[#DCE9D5] rounded-2xl space-y-1.5 text-xs text-[#26352B] shadow-2xs">
                <div className="font-bold flex items-center gap-1.5 text-[#397548]">
                  <ShieldCheck className="w-4 h-4 text-[#397548]" />
                  <span>PureDrop Quality Guarantee</span>
                </div>
                <p className="text-[#69766B] leading-relaxed text-[11px]">
                  Harvested daily from local ethical pastures. Certified for 100% purity with zero adulteration, synthetic hormones, or chemical additives.
                </p>
              </div>
            </div>

            {/* Right: Info & Purchase Controls */}
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#397548] bg-[#EAF4E5] border border-[#DCE9D5] px-2.5 py-1 rounded-md inline-block">
                  {currentUnit} Pack
                </span>
                <h2 className="text-2xl font-bold text-[#26352B] mt-2 font-serif-accent">
                  {product.name}
                </h2>
                <p className="text-sm text-[#69766B] mt-1.5 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Pricing Display */}
              <div className="p-3.5 bg-white rounded-2xl border border-[#DCE9D5] flex items-baseline justify-between shadow-2xs">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[#397548]">
                      {formatCurrency(currentPrice, settings.currencySymbol)}
                    </span>
                    {hasDiscount && (
                      <span className="text-sm text-stone-400 line-through">
                        {formatCurrency(originalPrice, settings.currencySymbol)}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#69766B]">
                    Inclusive of all applicable local taxes
                  </span>
                </div>

                <div className="text-right">
                  {isAvailable ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#397548] bg-[#EAF4E5] px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#397548]"></span>
                      In Stock ({currentStock} available)
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Variant Selector */}
              {product.variants.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#26352B] block">
                    Choose Pack Size:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {product.variants.map(v => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedVariantId === v.id
                            ? 'border-[#397548] bg-[#EAF4E5]/50 text-[#26352B] font-semibold ring-1 ring-[#397548]'
                            : 'border-[#DCE9D5] bg-white hover:border-[#397548] text-[#69766B]'
                        }`}
                      >
                        <p className="text-xs font-bold">{v.unit}</p>
                        <p className="text-[11px] text-[#397548] mt-0.5 font-semibold">
                          {formatCurrency(v.salePrice || v.price, settings.currencySymbol)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Storage Instructions & Handling */}
              {product.storageInfo && (
                <div className="p-3 bg-white rounded-xl border border-[#DCE9D5] text-xs text-[#69766B] flex items-start gap-2.5 shadow-2xs">
                  <Thermometer className="w-4 h-4 text-[#397548] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-[#26352B]">Storage & Handling:</span>
                    <span>{product.storageInfo}</span>
                  </div>
                </div>
              )}

              {/* Quantity Stepper & Add to Cart Button */}
              <div className="pt-2 flex items-center gap-3">
                <div className="flex items-center border border-[#DCE9D5] rounded-2xl bg-white p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 flex items-center justify-center text-[#26352B] hover:text-[#397548] rounded-lg hover:bg-[#EAF4E5] disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-[#26352B]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => {
                      if (!product.isMadeToOrder && quantity >= currentStock) return;
                      setQuantity(quantity + 1);
                    }}
                    disabled={!product.isMadeToOrder && quantity >= currentStock}
                    className="w-8 h-8 flex items-center justify-center text-[#26352B] hover:text-[#397548] rounded-lg hover:bg-[#EAF4E5] disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!isAvailable}
                  className={`flex-1 py-3 px-6 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    !isAvailable
                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                      : addedNotice
                      ? 'bg-[#2E5E3A] text-white'
                      : 'bg-[#397548] text-white hover:bg-[#2E5E3A] shadow-[#397548]/20 active:scale-95'
                  }`}
                >
                  {addedNotice ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Cart • {formatCurrency(currentPrice * quantity, settings.currencySymbol)}</span>
                    </>
                  )}
                </button>
              </div>

              {addedNotice && (
                <button
                  onClick={() => {
                    setSelectedProductForModal(null);
                    setIsCartOpen(true);
                  }}
                  className="w-full text-center text-xs font-bold text-[#397548] hover:underline cursor-pointer"
                >
                  View Cart & Checkout Now →
                </button>
              )}
            </div>
          </div>

          {/* Related Products */}
          {related.length > 0 && (
            <div className="pt-6 border-t border-[#DCE9D5]">
              <h4 className="text-xs font-bold text-[#26352B] uppercase tracking-wider mb-3">
                Pair Well With This Fresh Harvest
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {related.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedProductForModal(item)}
                    className="p-2.5 rounded-xl border border-[#DCE9D5] hover:border-[#397548] bg-white hover:bg-[#EAF4E5]/30 flex items-center gap-3 text-left transition-colors cursor-pointer shadow-2xs"
                  >
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover border border-[#DCE9D5]"
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold text-[#26352B] truncate">{item.name}</p>
                      <p className="text-xs font-bold text-[#397548]">
                        {formatCurrency(item.salePrice || item.price, settings.currencySymbol)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
