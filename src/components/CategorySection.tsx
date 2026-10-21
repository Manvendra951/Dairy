import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';

export default function CategorySection() {
  const { categories, products, setSelectedCategory, setActiveView } = useStore();

  const visibleCategories = categories.filter(c => c.isVisible);

  return (
    <section className="py-12 bg-[#FAFCF7] border-b border-[#DCE9D5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#397548] bg-[#EAF4E5] border border-[#DCE9D5] px-3 py-1 rounded-full inline-block mb-2">
              Fresh Daily Harvest
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#26352B] font-serif-accent tracking-tight">
              Explore Our Dairy Farm Range
            </h2>
            <p className="text-sm text-[#69766B] mt-1 max-w-xl">
              Farm-fresh cow & buffalo milk, slow-simmered bilona ghee, fresh probiotic curd, and soft malai paneer.
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedCategory('all');
              setActiveView('shop');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#397548] hover:text-[#2E5E3A] transition-colors cursor-pointer group"
          >
            <span>View All Dairy Products</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {visibleCategories.map(cat => {
            const count = products.filter(p => p.categoryId === cat.id && p.isPublished).length;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setActiveView('shop');
                }}
                className="group relative rounded-2xl overflow-hidden aspect-4/5 sm:aspect-3/4 bg-[#EAF4E5] border border-[#DCE9D5] text-left flex flex-col justify-end p-4 shadow-xs hover:shadow-lg hover:border-[#397548] transition-all duration-300 cursor-pointer"
              >
                {/* Background image */}
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />

                {/* Dark charcoal-green gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#26352B]/90 via-[#26352B]/35 to-transparent"></div>

                {/* Content */}
                <div className="relative z-10 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#EAF4E5]">
                    {count} {count === 1 ? 'Product' : 'Products'}
                  </span>
                  <h3 className="font-bold text-white text-base sm:text-lg leading-snug group-hover:text-[#EAF4E5] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-stone-200 line-clamp-1 leading-relaxed hidden sm:block">
                    {cat.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
