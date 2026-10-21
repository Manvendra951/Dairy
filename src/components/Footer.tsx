import React from 'react';
import { Phone, Mail, MapPin, Clock, ShieldCheck, Truck, ArrowRight, Heart } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';

export default function Footer() {
  const { settings, categories, setSelectedCategory, setActiveView, setIsInfoModalOpen } = useStore();

  return (
    <footer className="bg-[#1C2A20] text-[#DCE9D5] pt-14 pb-8 border-t border-[#26352B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#397548] text-white flex items-center justify-center text-xl shadow-md">
                🥛
              </div>
              <span className="font-serif-accent text-2xl font-bold text-white tracking-tight">
                {settings.brandName}
              </span>
            </div>

            <p className="text-xs text-[#C8DDC3] leading-relaxed max-w-sm">
              {settings.tagline ||
                'Delivering wholesome, unadulterated cow & buffalo milk, Vedic bilona ghee, probiotic dahi, and artisanal dairy directly from farm pastures to city dining tables.'}
            </p>

            {/* Operating Hours Box */}
            <div className="p-3.5 bg-[#25382B] rounded-2xl border border-[#2E5E3A] text-xs space-y-1">
              <span className="font-bold text-[#EAF4E5] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#EAF4E5]" />
                Dispatch & Delivery Schedule
              </span>
              <p className="text-[#C8DDC3] text-[11px] leading-relaxed">
                {settings.operatingHours}
              </p>
            </div>
          </div>

          {/* Dairy Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#EAF4E5]">
              Fresh Categories
            </h4>
            <ul className="space-y-2 text-xs">
              {categories
                .filter(c => c.isVisible)
                .slice(0, 6)
                .map(cat => (
                  <li key={cat.id}>
                    <button
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setActiveView('shop');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="hover:text-white transition-colors cursor-pointer text-[#C8DDC3] hover:underline"
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
            </ul>
          </div>

          {/* Quick Links & Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#EAF4E5]">
              Customer Care & Policies
            </h4>
            <ul className="space-y-2 text-xs text-[#C8DDC3]">
              <li>
                <button
                  onClick={() => setIsInfoModalOpen('about')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  About Our Dairy Farm
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsInfoModalOpen('contact')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Contact & Support Desk
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsInfoModalOpen('faq')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsInfoModalOpen('shipping')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Morning Shipping Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsInfoModalOpen('returns')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Freshness Guarantee & Returns
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('admin')}
                  className="hover:text-white text-[#EAF4E5] font-semibold transition-colors cursor-pointer"
                >
                  Admin Dashboard Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#EAF4E5]">
              Farm & Customer Desk
            </h4>
            <div className="space-y-2.5 text-xs text-[#C8DDC3]">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#397548] shrink-0 mt-0.5" />
                <span>{settings.address}, {settings.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#397548] shrink-0" />
                <a href={`tel:${settings.phone}`} className="hover:text-white">
                  {settings.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#397548] shrink-0" />
                <a href={`mailto:${settings.email}`} className="hover:text-white">
                  {settings.email}
                </a>
              </div>
              <div className="pt-2 text-[11px] text-[#A2B89D]">
                Cash on Delivery accepted across: {settings.city}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-8 border-t border-[#26352B] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A2B89D]">
          <p>
            © {new Date().getFullYear()} {settings.brandName}. All rights reserved. Har Din Taaza.
          </p>

          <div className="flex items-center gap-3 text-[#C8DDC3] text-[11px]">
            <span>100% Purity Tested</span>
            <span>•</span>
            <span>Cold-Chain Dispatched</span>
            <span>•</span>
            <span>Cash on Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
