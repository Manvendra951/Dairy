import React, { useState } from 'react';
import { X, Search, Truck, Clock, CheckCircle2, AlertCircle, Package, Download } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { formatCurrency } from '../utils/pricing.ts';
import { downloadInvoicePDF } from '../utils/pdfGenerator.ts';
import type { Order } from '../types/dairy.js';

export default function OrderTrackingModal() {
  const { isTrackingModalOpen, setIsTrackingModalOpen, orders, settings } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isTrackingModalOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim().toLowerCase();
    if (!query) return;

    const found = orders.find(
      o => o.orderNumber.toLowerCase() === query || o.customer.phone === query
    );
    setSearchedOrder(found || null);
    setHasSearched(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Out for Delivery':
        return 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse';
      case 'Preparing':
        return 'bg-[#EAF4E5] text-[#397548] border-[#DCE9D5]';
      case 'Confirmed':
        return 'bg-[#EAF4E5] text-[#26352B] border-[#397548]';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      default:
        return 'bg-[#FAFCF7] text-[#26352B] border-[#DCE9D5]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-[#DCE9D5] relative animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#DCE9D5] bg-gradient-to-r from-[#2E5E3A] via-[#397548] to-[#2E5E3A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 text-white flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg leading-tight font-serif-accent">
                Track Dairy Delivery
              </h2>
              <p className="text-xs text-[#EAF4E5]">Enter order number or 10-digit mobile number</p>
            </div>
          </div>
          <button
            onClick={() => setIsTrackingModalOpen(false)}
            className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 bg-[#FAFCF7]">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="e.g. PD-89201 or 9829012345"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-white border border-[#DCE9D5] focus:border-[#397548] rounded-xl outline-hidden text-[#26352B]"
              />
              <Search className="w-4 h-4 text-[#69766B] absolute left-3 top-3.5" />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#397548] text-white font-bold text-xs sm:text-sm hover:bg-[#2E5E3A] shadow-xs cursor-pointer"
            >
              Track
            </button>
          </form>

          {/* Result view */}
          {searchedOrder ? (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-white rounded-2xl border border-[#DCE9D5] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#69766B] uppercase tracking-wider block">
                      Order ID
                    </span>
                    <span className="text-base font-extrabold text-[#26352B]">
                      #{searchedOrder.orderNumber}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(
                      searchedOrder.status
                    )}`}
                  >
                    {searchedOrder.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#E2ECE0]">
                  <div>
                    <span className="text-[#69766B] block text-[10px] uppercase font-bold">Slot</span>
                    <span className="font-semibold text-[#26352B]">{searchedOrder.deliverySlot}</span>
                  </div>
                  <div>
                    <span className="text-[#69766B] block text-[10px] uppercase font-bold">Total</span>
                    <span className="font-bold text-[#397548]">
                      {formatCurrency(searchedOrder.total, settings.currencySymbol)} (COD)
                    </span>
                  </div>
                </div>

                <div className="text-xs pt-2 border-t border-[#E2ECE0] flex justify-between items-center">
                  <div>
                    <span className="text-[#69766B] block text-[10px] uppercase font-bold">
                      Delivery To
                    </span>
                    <p className="font-bold text-[#26352B]">{searchedOrder.customer.name}</p>
                    <p className="text-[#69766B] truncate">{searchedOrder.customer.address}, {searchedOrder.customer.pincode}</p>
                  </div>

                  <button
                    onClick={() => downloadInvoicePDF(searchedOrder, settings)}
                    className="px-3 py-1.5 rounded-lg border border-[#DCE9D5] hover:border-[#397548] bg-[#FAFCF7] text-xs font-bold text-[#397548] flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Invoice</span>
                  </button>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#397548]">
                  Status Timeline & Notes
                </h4>
                <div className="space-y-2 border-l-2 border-[#397548] ml-2 pl-3">
                  {searchedOrder.statusHistory.map((step, idx) => (
                    <div key={idx} className="relative text-xs">
                      <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-[#397548] ring-2 ring-white"></div>
                      <p className="font-bold text-[#26352B]">{step.status}</p>
                      {step.note && <p className="text-[#69766B] text-[11px]">{step.note}</p>}
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {new Date(step.timestamp).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items Preview */}
              <div className="p-3 bg-white rounded-xl border border-[#DCE9D5] text-xs space-y-1.5 shadow-2xs">
                <span className="font-bold text-[#26352B] block">Package Items:</span>
                {searchedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[#69766B] text-[11px]">
                    <span>
                      {it.name} ({it.variantName || it.unit}) × {it.quantity}
                    </span>
                    <span className="font-semibold text-[#26352B]">
                      {formatCurrency(it.totalPrice, settings.currencySymbol)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : hasSearched ? (
            <div className="p-6 text-center text-stone-500 space-y-2 bg-white rounded-2xl border border-[#DCE9D5]">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
              <p className="font-bold text-[#26352B] text-sm">No order found matching "{searchTerm}"</p>
              <p className="text-xs text-[#69766B]">
                Please double check the order ID (e.g. PD-89201) or try the 10-digit mobile number used when ordering.
              </p>
            </div>
          ) : (
            <div className="p-6 text-center text-[#69766B] text-xs bg-white rounded-2xl border border-[#DCE9D5]">
              Search by order number (e.g. <code className="text-[#397548] font-bold">PD-89201</code>) or your 10-digit mobile number.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
