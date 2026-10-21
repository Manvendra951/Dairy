import React, { useState } from 'react';
import { X, Phone, Mail, MapPin, Clock, FileText } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { formatCurrency } from '../utils/pricing.ts';

export default function InfoPagesModal() {
  const { isInfoModalOpen, setIsInfoModalOpen, settings } = useStore();

  const [activeTab, setActiveTab] = useState<string>(() => isInfoModalOpen || 'about');

  if (!isInfoModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#DCE9D5] relative animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#DCE9D5] bg-[#FAFCF7] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#397548] text-white flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-[#26352B] text-base font-serif-accent">
                {settings.brandName} Information
              </h2>
              <p className="text-xs text-[#69766B]">Customer guidelines, policies & farm heritage</p>
            </div>
          </div>
          <button
            onClick={() => setIsInfoModalOpen(null)}
            className="p-2 text-stone-400 hover:text-[#26352B] rounded-full hover:bg-[#EAF4E5] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#DCE9D5] px-4 bg-[#FAFCF7] overflow-x-auto text-xs font-bold text-[#69766B] gap-2 shrink-0">
          {[
            { id: 'about', label: 'About Us' },
            { id: 'contact', label: 'Contact Us' },
            { id: 'faq', label: 'FAQs' },
            { id: 'shipping', label: 'Delivery Policy' },
            { id: 'returns', label: 'Returns & Refund' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#397548] text-[#397548] font-extrabold bg-[#EAF4E5]/40'
                  : 'border-transparent text-[#69766B] hover:text-[#26352B]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-[#26352B] leading-relaxed bg-[#FAFCF7]">
          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden aspect-21/9 bg-white border border-[#DCE9D5] shadow-xs">
                <img
                  src="https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=1200&q=80"
                  alt="Dairy Farm Pasture"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-lg font-bold text-[#397548] font-serif-accent">
                Our Purity Story: From Pasture to Doorstep
              </h3>
              <p className="text-[#69766B]">
                {settings.aboutStory ||
                  'Founded with a dedication to bringing real, pure milk back to city dining tables. PureDrop partners with grass-fed dairy farms following non-hormonal, humane farming practices.'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-white rounded-xl border border-[#DCE9D5] shadow-2xs">
                  <h4 className="font-bold text-[#397548] mb-1">Ethical Animal Care</h4>
                  <p className="text-xs text-[#69766B]">
                    Free grazing, clean drinking water, regular veterinary audits, and zero oxytocin or synthetic growth hormones.
                  </p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#DCE9D5] shadow-2xs">
                  <h4 className="font-bold text-[#397548] mb-1">Gentle Pasteurization</h4>
                  <p className="text-xs text-[#69766B]">
                    Heated gently to 72°C for 15 seconds, immediately chilled to 4°C to retain natural enzymes and essential proteins.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[#26352B] font-serif-accent">Get in Touch with Our Dairy Team</h3>
              <p className="text-xs text-[#69766B]">
                Have questions regarding morning delivery timings, product quality, or doorstep delivery? Reach out directly.
              </p>
              <div className="space-y-3">
                <div className="p-3.5 bg-white rounded-2xl border border-[#DCE9D5] flex items-start gap-3 shadow-2xs">
                  <Phone className="w-4 h-4 text-[#397548] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-[#26352B]">Phone Support & WhatsApp</span>
                    <a href={`tel:${settings.phone}`} className="text-[#397548] font-semibold hover:underline">
                      {settings.phone}
                    </a>
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-[#DCE9D5] flex items-start gap-3 shadow-2xs">
                  <Mail className="w-4 h-4 text-[#397548] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-[#26352B]">Customer Support Email</span>
                    <a href={`mailto:${settings.email}`} className="text-[#397548] font-semibold hover:underline">
                      {settings.email}
                    </a>
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-[#DCE9D5] flex items-start gap-3 shadow-2xs">
                  <MapPin className="w-4 h-4 text-[#397548] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-[#26352B]">Farm Processing Center & Depot</span>
                    <p className="text-[#69766B]">{settings.address}</p>
                    <p className="text-[#69766B]">{settings.city}</p>
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-[#DCE9D5] flex items-start gap-3 shadow-2xs">
                  <Clock className="w-4 h-4 text-[#397548] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-[#26352B]">Operating Hours & Delivery Slots</span>
                    <p className="text-[#69766B]">{settings.operatingHours}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-[#26352B] font-serif-accent">Frequently Asked Questions</h3>
              
              <div className="p-3.5 bg-white rounded-xl border border-[#DCE9D5] space-y-1 shadow-2xs">
                <h4 className="font-bold text-[#26352B]">When will my morning milk arrive?</h4>
                <p className="text-xs text-[#69766B]">
                  Morning deliveries are executed between 5:30 AM and 7:30 AM before breakfast. Orders placed before 9:00 PM are delivered the next morning.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-[#DCE9D5] space-y-1 shadow-2xs">
                <h4 className="font-bold text-[#26352B]">How do I pay for my order?</h4>
                <p className="text-xs text-[#69766B]">
                  We operate exclusively on <strong>Cash on Delivery (COD)</strong>. Simply pay cash to our delivery executive when your chilled crate arrives at your doorstep.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-[#DCE9D5] space-y-1 shadow-2xs">
                <h4 className="font-bold text-[#26352B]">What is the difference between Cow Milk and Buffalo Milk?</h4>
                <p className="text-xs text-[#69766B]">
                  Cow milk has ~3.5-4% fat, is lighter, and easier to digest. Buffalo milk has ~7.5% fat, thick clotted malai, and is ideal for kheer, tea, and thick creamy curd.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-[#DCE9D5] space-y-1 shadow-2xs">
                <h4 className="font-bold text-[#26352B]">Do you use plastic pouches?</h4>
                <p className="text-xs text-[#69766B]">
                  No, we prioritize food-grade sanitized glass bottles and reusable insulated carry bags to maintain freshness and protect the environment.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-[#26352B] font-serif-accent">Shipping & Delivery Policy</h3>
              <p className="text-[#69766B]">
                We operate our own insulated temperature-controlled cold chain fleet to ensure farm-level chill is preserved until your doorstep.
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-[#69766B]">
                <li>
                  <strong>Delivery Charges:</strong> Standard delivery fee is {formatCurrency(settings.deliveryCharge, settings.currencySymbol)}. Orders of {formatCurrency(settings.freeDeliveryThreshold, settings.currencySymbol)} and above qualify for <strong>FREE Delivery</strong>.
                </li>
                <li>
                  <strong>Serviceable Areas:</strong> We currently serve selected postal codes in {settings.city}. Check your PIN code during checkout.
                </li>
                <li>
                  <strong>Payment:</strong> Payment is strictly Cash on Delivery upon morning doorstep arrival.
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'returns' && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-[#26352B] font-serif-accent">Freshness Guarantee & Returns</h3>
              <p className="text-[#69766B]">
                Because dairy products are perishable, we stand 100% behind the quality and freshness of every single item delivered.
              </p>
              <div className="p-3.5 bg-white rounded-xl border border-[#DCE9D5] text-[#26352B] space-y-1 shadow-2xs">
                <h4 className="font-bold text-[#397548]">Immediate Replacement Guarantee</h4>
                <p className="text-xs text-[#69766B]">
                  If any bottle of milk curds unexpectedly on boiling or if paneer packaging is damaged, report it to our customer line ({settings.phone}) within 6 hours of delivery for an instant free replacement.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
