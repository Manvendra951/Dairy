import React from 'react';
import { ShieldCheck, Truck, Sparkles, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import CowMascot from './CowMascot.tsx';

export default function Hero() {
  const { settings, setActiveView, setSelectedCategory } = useStore();

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#FAFCF7] via-[#F3F8F0] to-[#FAFCF7] border-b border-[#DCE9D5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-14 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Organic Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF4E5] text-[#397548] border border-[#DCE9D5] text-xs font-bold tracking-wide shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#397548] animate-pulse"></span>
              <span>Farm-to-Doorstep Cold Chain • 100% Fresh & Pure</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#26352B] tracking-tight leading-[1.14] font-serif-accent">
              {settings.heroHeading || 'Fresh Organic Dairy, Straight from Our Farm to Your Doorstep'}
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-[#69766B] max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              {settings.heroSubheading ||
                'Pure, unadulterated cow & buffalo milk harvested at dawn and delivered chilled to your doorstep before 7:30 AM.'}
            </p>

            {/* Quick CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setActiveView('shop');
                }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#397548] text-white font-bold text-sm md:text-base shadow-md shadow-[#397548]/20 hover:bg-[#2E5E3A] hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Shop Fresh Dairy</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => {
                  setSelectedCategory('cat-combos');
                  setActiveView('shop');
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white text-[#26352B] font-bold text-sm md:text-base border border-[#DCE9D5] hover:border-[#397548] hover:bg-[#EAF4E5]/40 transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Breakfast Combos</span>
                <span className="text-xs bg-[#EAF4E5] text-[#397548] px-2 py-0.5 rounded-full font-bold">
                  Save 15%
                </span>
              </button>
            </div>

            {/* Trust Badges Bar */}
            <div className="pt-6 border-t border-[#DCE9D5] grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EAF4E5] text-[#397548] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#26352B] leading-none">100% Pure</p>
                  <p className="text-[10px] text-[#69766B]">Zero adulterants</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EAF4E5] text-[#397548] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#26352B] leading-none">Morning 6 AM</p>
                  <p className="text-[10px] text-[#69766B]">Daily doorstep</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EAF4E5] text-[#397548] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#26352B] leading-none">A2 & Bilona</p>
                  <p className="text-[10px] text-[#69766B]">Traditional craft</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EAF4E5] text-[#397548] flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#26352B] leading-none">Cold-Chained</p>
                  <p className="text-[10px] text-[#69766B]">Below 4°C always</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Image Feature - Natural Dairy Cow Pasture Photography & Friendly Mascot */}
          <div className="lg:col-span-5 relative">
            {/* Friendly Cow Mascot Badge */}
            <div className="flex items-center justify-center lg:justify-end mb-3">
              <div className="inline-flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-[#DCE9D5] shadow-xs">
                <CowMascot variant="hero" showGrass={true} showMilkDrop={true} className="w-20 sm:w-24 shrink-0" />
                <div className="text-left">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#397548] block">
                    Our Dairy Mascot
                  </span>
                  <span className="text-xs font-bold text-[#26352B] block leading-tight">
                    Pure & Naturally Grass-Fed
                  </span>
                  <span className="text-[10px] text-[#69766B]">
                    Dawn harvest • Chilled at 3.8°C
                  </span>
                </div>
              </div>
            </div>

            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="relative rounded-3xl overflow-hidden shadow-lg border-4 border-white aspect-4/3 sm:aspect-5/4 bg-[#EAF4E5]">
                <img
                  src={
                    settings.heroImage ||
                    'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=1200&q=80'
                  }
                  alt="Authentic Dairy Farm Cows in Pasture"
                  className="w-full h-full object-cover transform hover:scale-102 transition-transform duration-700"
                />

                {/* Floating badge on image */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-md border border-[#DCE9D5] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#397548] text-white flex items-center justify-center font-bold text-lg">
                      🥛
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#26352B]">Today's Dawn Harvest</p>
                      <p className="text-[11px] text-[#69766B] font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#397548]" />
                        Chilled at 3.8°C • Glass Bottled
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-[#EAF4E5] text-[#397548] border border-[#DCE9D5] rounded-lg">
                    100% Tested
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
