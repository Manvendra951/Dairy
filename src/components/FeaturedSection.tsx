import React from 'react';
import { ShieldCheck, Truck, Droplets, Heart, Sparkles, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { formatCurrency } from '../utils/pricing.ts';

export default function FeaturedSection() {
  const { products, addToCart, setIsCartOpen, setSelectedCategory, setActiveView, settings } = useStore();

  const comboProduct = products.find(p => p.id === 'prod-combo-breakfast');

  const handleAddCombo = () => {
    if (comboProduct) {
      addToCart(comboProduct, undefined, 1);
      setIsCartOpen(true);
    }
  };

  return (
    <section className="py-14 bg-[#FAFCF7] space-y-16 border-b border-[#DCE9D5]">
      {/* 4 Purity & Quality Pillars - "Why Choose Us?" */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#397548] bg-[#EAF4E5] border border-[#DCE9D5] px-3 py-1 rounded-full inline-block mb-2">
            The PureDrop Standard
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#26352B] font-serif-accent tracking-tight">
            Why Choose Our Dairy?
          </h2>
          <p className="text-sm text-[#69766B] mt-2">
            We partner directly with certified ethical farms and run our own cold chain. 0% adulteration, zero skimming, and unadulterated freshness.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#DCE9D5] shadow-xs space-y-3 hover:shadow-md hover:border-[#397548] transition-all">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF4E5] text-[#397548] border border-[#DCE9D5] flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[#26352B] text-base">28-Point Daily Lab Testing</h3>
            <p className="text-xs text-[#69766B] leading-relaxed">
              Every morning batch is tested for zero water adulteration, synthetic urea, detergent, starch, and antibiotics before bottling.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#DCE9D5] shadow-xs space-y-3 hover:shadow-md hover:border-[#397548] transition-all">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF4E5] text-[#397548] border border-[#DCE9D5] flex items-center justify-center font-bold">
              <Droplets className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[#26352B] text-base">Low-Heat Pasteurization</h3>
            <p className="text-xs text-[#69766B] leading-relaxed">
              We pasteurize gently at 72°C rather than harsh ultra-high heating. Natural wholesome enzymes and sweet aroma remain preserved.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#DCE9D5] shadow-xs space-y-3 hover:shadow-md hover:border-[#397548] transition-all">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF4E5] text-[#397548] border border-[#DCE9D5] flex items-center justify-center font-bold">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[#26352B] text-base">Chilled Doorstep Delivery</h3>
            <p className="text-xs text-[#69766B] leading-relaxed">
              Maintained strictly at 3.5°C to 4°C in insulated delivery totes and dropped at your doorstep before 7:30 AM before breakfast.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#DCE9D5] shadow-xs space-y-3 hover:shadow-md hover:border-[#397548] transition-all">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF4E5] text-[#397548] border border-[#DCE9D5] flex items-center justify-center font-bold">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[#26352B] text-base">Eco-Friendly Glass Bottles</h3>
            <p className="text-xs text-[#69766B] leading-relaxed">
              Bottled in sparkling sanitized glass bottles. We collect empty rinsed bottles during your next delivery to protect our environment.
            </p>
          </div>
        </div>
      </div>

      {/* Special Combo Promotional Banner (Fresh Emerald Green) */}
      {comboProduct && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#2E5E3A] via-[#397548] to-[#2E5E3A] text-white p-6 sm:p-10 lg:p-12 shadow-lg border border-[#DCE9D5]">
            {/* Background dairy pasture photograph */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-15 pointer-events-none hidden md:block">
              <img
                src="https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=800&q=80"
                alt=""
                className="w-full h-full object-cover"
              />
            </div>

            <div className="relative z-10 max-w-xl space-y-4">
              <div className="inline-flex items-center gap-2 bg-[#EAF4E5] text-[#2E5E3A] font-extrabold text-[11px] uppercase tracking-wider px-3 py-1 rounded-full shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#397548]" />
                <span>Special Breakfast Bundle • Save ₹55</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-serif-accent leading-tight">
                PureDrop Morning Essentials Combo
              </h2>

              <p className="text-xs sm:text-sm text-[#EAF4E5] leading-relaxed">
                Start your family's morning right: 1 Litre Farm Cow Milk + 400g Probiotic Curd + 200g Fresh Malai Paneer + 100g Creamy Table Butter in one insulated value basket.
              </p>

              <div className="flex items-baseline gap-3 pt-1">
                <span className="text-3xl font-black text-white">
                  {formatCurrency(comboProduct.salePrice || 340, settings.currencySymbol)}
                </span>
                <span className="text-base text-[#DCE9D5]/70 line-through">
                  {formatCurrency(comboProduct.price || 395, settings.currencySymbol)}
                </span>
                <span className="text-xs bg-black/20 border border-white/20 px-2.5 py-0.5 rounded text-[#EAF4E5]">
                  Fresh Daily Pack
                </span>
              </div>

              <div className="flex flex-wrap gap-3 pt-3">
                <button
                  onClick={handleAddCombo}
                  className="px-6 py-3 rounded-full bg-white text-[#2E5E3A] hover:bg-[#EAF4E5] font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <span>Add Combo to Cart</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setSelectedCategory('cat-combos');
                    setActiveView('shop');
                  }}
                  className="px-5 py-3 rounded-full border border-white/40 hover:bg-white/10 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  View All Value Combos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
