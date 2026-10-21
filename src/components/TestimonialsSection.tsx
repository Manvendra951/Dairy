import React, { useState } from 'react';
import { Star, CheckCircle, Mail, Send, Check } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';

const SAMPLE_REVIEWS = [
  {
    id: 1,
    name: 'Priya Narayanan',
    location: 'Vaishali Nagar',
    product: 'Fresh Cow Milk (1 Litre)',
    rating: 5,
    date: '2 days ago',
    comment:
      'The milk reminds me of our family farm! There is a rich natural cream layer on boiling and morning tea tastes phenomenal. Chilled glass bottle delivery is pristine.',
  },
  {
    id: 2,
    name: 'Dr. Rajiv Mathur',
    location: 'Civil Lines',
    product: 'Traditional Bilona Cow Ghee',
    rating: 5,
    date: '1 week ago',
    comment:
      'Real granular danedar ghee. The aroma when melting on warm rotis is authentic Vedic bilona. Very happy to find a brand that does not cut corners with palm oil.',
  },
  {
    id: 3,
    name: 'Shweta Kulkarni',
    location: 'C-Scheme',
    product: 'Farm Fresh Malai Paneer',
    rating: 5,
    date: '3 days ago',
    comment:
      'Hands down the softest paneer in the city. Melts in your mouth without any rubbery texture. You can tell it is curdled naturally with zero synthetic chemicals.',
  },
];

export default function TestimonialsSection() {
  const { settings } = useStore();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribed(true);
    setNewsletterEmail('');
    setTimeout(() => setSubscribed(false), 4000);
  };

  return (
    <section className="py-14 bg-white border-b border-[#DCE9D5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF4E5] text-[#397548] border border-[#DCE9D5] text-xs font-semibold mb-2">
            <span>Customer Experiences</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#26352B] font-serif-accent tracking-tight">
            Loved by Families & Chefs
          </h2>
          <p className="text-xs sm:text-sm text-[#69766B] mt-1">
            Real feedback from households enjoying fresh morning deliveries every dawn
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SAMPLE_REVIEWS.map(review => (
            <div
              key={review.id}
              className="p-6 rounded-3xl bg-[#FAFCF7] border border-[#DCE9D5] flex flex-col justify-between space-y-4 hover:border-[#397548] transition-colors shadow-2xs"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 text-amber-500">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] text-[#69766B]">{review.date}</span>
                </div>

                <p className="text-xs sm:text-sm text-[#26352B] leading-relaxed italic">
                  "{review.comment}"
                </p>
              </div>

              <div className="pt-3 border-t border-[#DCE9D5] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#26352B] text-xs flex items-center gap-1">
                    {review.name}
                    <CheckCircle className="w-3.5 h-3.5 text-[#397548] inline" />
                  </h4>
                  <p className="text-[11px] text-[#69766B]">{review.location}</p>
                </div>
                <span className="text-[10px] font-semibold text-[#397548] bg-white border border-[#DCE9D5] px-2 py-0.5 rounded-md">
                  {review.product}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter Subscription Box (Fresh Forest Green) */}
        <div className="rounded-3xl bg-gradient-to-r from-[#2E5E3A] via-[#397548] to-[#2E5E3A] text-white p-6 sm:p-10 text-center max-w-3xl mx-auto shadow-md space-y-4 border border-[#DCE9D5]">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto text-[#EAF4E5]">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold font-serif-accent">
              Get Weekly Farm Updates & Seasonal Offers
            </h3>
            <p className="text-xs sm:text-sm text-[#EAF4E5] mt-1 max-w-md mx-auto">
              Subscribe to receive weekly batch harvest notes, seasonal bilona ghee alerts, and dairy culinary tips.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
            <input
              type="email"
              required
              placeholder="Enter your email address..."
              value={newsletterEmail}
              onChange={e => setNewsletterEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-full bg-white/15 border border-white/20 text-white placeholder:text-[#EAF4E5]/70 text-xs sm:text-sm outline-hidden focus:bg-white/25"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-full bg-white text-[#2E5E3A] font-bold text-xs sm:text-sm hover:bg-[#EAF4E5] transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              {subscribed ? (
                <>
                  <Check className="w-4 h-4 text-[#2E5E3A]" />
                  <span>Subscribed!</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Subscribe</span>
                </>
              )}
            </button>
          </form>

          {subscribed && (
            <p className="text-xs text-[#EAF4E5] animate-in fade-in">
              Thank you for subscribing to {settings.brandName}! Check your inbox for your 10% welcome coupon.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
