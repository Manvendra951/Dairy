import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  Copy,
  Check,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { formatCurrency } from '../utils/pricing.ts';
import type { Order } from '../types/dairy.js';

export default function UpiPaymentModal() {
  const {
    isUpiPaymentModalOpen,
    setIsUpiPaymentModalOpen,
    pendingUpiOrder,
    settings,
    submitUpiPaymentRef,
    setConfirmedOrder,
  } = useStore();

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedDetails, setCopiedDetails] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  const [utrSuccessMsg, setUtrSuccessMsg] = useState<string | null>(null);
  const [utrErrorMsg, setUtrErrorMsg] = useState<string | null>(null);

  const order: Order | null = pendingUpiOrder;

  // Business UPI details
  const upiId = settings.upiId?.trim() || '';
  const payeeName = settings.upiPayeeName?.trim() || settings.brandName || 'PureDrop Dairy';
  const customQrImage = settings.upiQrImageUrl?.trim() || null;

  useEffect(() => {
    if (!isUpiPaymentModalOpen || !order) return;

    setUtrInput(order.transactionId || '');
    setUtrSuccessMsg(null);
    setUtrErrorMsg(null);

    if (!upiId && !customQrImage) {
      setQrError('Business UPI ID is not yet configured by the store owner in Website Settings.');
      setQrDataUrl(null);
      return;
    }

    setQrError(null);
    setIsGeneratingQr(true);

    // Standard NPCI UPI URI specifications:
    // upi://pay?pa=address@bank&pn=PayeeName&am=Amount&cu=INR&tn=OrderNote&tr=RefNo
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${order.total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`PureDrop Order ${order.orderNumber}`)}&tr=${encodeURIComponent(order.orderNumber)}`;

    QRCode.toDataURL(upiUri, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#35271F',
        light: '#FFFFFF',
      },
    })
      .then(url => {
        setQrDataUrl(url);
        setIsGeneratingQr(false);
      })
      .catch(err => {
        console.error('Failed to generate dynamic UPI QR code:', err);
        if (customQrImage) {
          setQrDataUrl(customQrImage);
        } else {
          setQrError('Could not generate dynamic QR code. Please copy the UPI ID below to pay.');
        }
        setIsGeneratingQr(false);
      });
  }, [isUpiPaymentModalOpen, order, upiId, payeeName, customQrImage]);

  if (!isUpiPaymentModalOpen || !order) return null;

  const handleCopyUpiId = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyAllDetails = () => {
    const text = `Payee: ${payeeName}\nUPI ID: ${upiId}\nAmount: ₹${order.total}\nOrder Ref: #${order.orderNumber}`;
    navigator.clipboard.writeText(text);
    setCopiedDetails(true);
    setTimeout(() => setCopiedDetails(false), 2000);
  };

  const handleDownloadQr = () => {
    const targetUrl = qrDataUrl || customQrImage;
    if (!targetUrl) return;
    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = `PureDrop-UPI-QR-${order.orderNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    setUtrErrorMsg(null);
    setUtrSuccessMsg(null);

    const clean = utrInput.trim();
    if (!clean || clean.length < 4) {
      setUtrErrorMsg('Please enter a valid 12-digit UPI reference or UTR transaction number.');
      return;
    }

    setIsSubmittingUtr(true);
    try {
      await submitUpiPaymentRef(order.id, clean);
      setIsSubmittingUtr(false);
      setUtrSuccessMsg(
        'Transaction reference recorded! Status: Pending Verification. Our dairy accounts desk will confirm against our bank statement before morning dispatch.'
      );
    } catch (err: any) {
      setIsSubmittingUtr(false);
      setUtrErrorMsg(err.message || 'Failed to submit reference. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E8DDD0] relative animate-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8DDD0] bg-[#FBF7F0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#6F4E37] text-white flex items-center justify-center shadow-xs">
              <QrCode className="w-5 h-5 text-[#FBF7F0]" />
            </div>
            <div>
              <h3 className="font-bold text-[#35271F] text-base font-serif-accent leading-tight">
                Scan & Pay via UPI / QR
              </h3>
              <p className="text-[11px] text-[#8B6548]">
                Order #{order.orderNumber} • Amount Payable: <strong className="text-[#6F4E37]">{formatCurrency(order.total, settings.currencySymbol)}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsUpiPaymentModalOpen(false);
              setConfirmedOrder(order);
            }}
            className="p-1.5 text-stone-400 hover:text-[#35271F] rounded-full hover:bg-[#E8DDD0]/50 cursor-pointer"
            title="Return to order confirmation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Unconfigured Alert */}
          {!upiId && (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-xs">UPI Account Not Configured</p>
                <p className="text-[11px] text-amber-800">
                  The administrator has not configured a valid business UPI ID in Website Settings. Your order #{order.orderNumber} has been recorded as <strong>Pending</strong>. You may also pay cash upon doorstep delivery.
                </p>
              </div>
            </div>
          )}

          {/* QR Display Card */}
          {upiId && (
            <div className="p-4 sm:p-5 bg-[#FBF7F0] rounded-3xl border border-[#E8DDD0] flex flex-col items-center text-center space-y-3">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-[#8B6548] tracking-wider block">
                  Official Merchant QR Code
                </span>
                <h4 className="font-bold text-sm text-[#35271F]">{payeeName}</h4>
              </div>

              {/* QR Image Box */}
              <div className="w-56 h-56 sm:w-64 sm:h-64 bg-white p-3 rounded-2xl border-2 border-[#6F4E37]/20 shadow-md flex items-center justify-center relative">
                {isGeneratingQr ? (
                  <div className="flex flex-col items-center gap-2 text-[#8B6548]">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#6F4E37]" />
                    <span className="text-xs font-semibold">Generating Amount QR...</span>
                  </div>
                ) : qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`UPI Payment QR for Order ${order.orderNumber}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="p-4 text-center text-stone-400">
                    <QrCode className="w-12 h-12 mx-auto mb-1 text-stone-300" />
                    <span>{qrError || 'QR code unavailable'}</span>
                  </div>
                )}
              </div>

              {/* Exact Amount Banner */}
              <div className="w-full p-2.5 bg-white rounded-xl border border-[#E8DDD0] flex items-center justify-between px-4">
                <span className="text-[#8B6548] font-bold text-xs">Exact Order Total:</span>
                <span className="text-[#6F4E37] font-black text-base">
                  {formatCurrency(order.total, settings.currencySymbol)}
                </span>
              </div>

              {/* Instructions Notice */}
              <p className="text-[11px] text-[#5A4538] leading-relaxed max-w-sm">
                {settings.upiInstructions ||
                  'Open Google Pay, PhonePe, Paytm, or BHIM. Scan this QR code and complete the payment in your app.'}
              </p>

              {/* Action Buttons: Copy UPI ID, Copy All, Download QR */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 w-full">
                <button
                  type="button"
                  onClick={handleCopyUpiId}
                  className="px-3 py-1.5 bg-white hover:bg-[#E8DDD0]/50 border border-[#E8DDD0] rounded-xl font-bold text-[#6F4E37] flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUpi ? 'Copied UPI ID!' : `Copy: ${upiId}`}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyAllDetails}
                  className="px-3 py-1.5 bg-white hover:bg-[#E8DDD0]/50 border border-[#E8DDD0] rounded-xl font-bold text-[#35271F] flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  {copiedDetails ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedDetails ? 'Details Copied!' : 'Copy Payment Info'}</span>
                </button>

                {qrDataUrl && (
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="px-3 py-1.5 bg-white hover:bg-[#E8DDD0]/50 border border-[#E8DDD0] rounded-xl font-bold text-[#8B6548] hover:text-[#35271F] flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    title="Save QR Code image to device"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download QR</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Submission of UTR / Reference Form */}
          <div className="p-4 bg-white rounded-2xl border border-[#E8DDD0] space-y-3">
            <div className="flex items-center justify-between border-b border-[#E8DDD0] pb-2">
              <span className="font-bold text-xs text-[#35271F] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#6F4E37]" />
                <span>Submit UPI Reference / UTR Number</span>
              </span>
              <span className="text-[10px] text-[#8B6548] font-semibold bg-[#FBF7F0] px-2 py-0.5 rounded-full border border-[#E8DDD0]">
                Step 2 of 2
              </span>
            </div>

            {utrSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">UTR Submitted Successfully</p>
                  <p className="text-[11px]">{utrSuccessMsg}</p>
                </div>
              </div>
            )}

            {utrErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{utrErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitUtr} className="space-y-2.5">
              <p className="text-[11px] text-[#5A4538]">
                After making payment in your UPI app, enter the <strong>12-digit UPI UTR</strong> (Transaction Reference Number) shown in your payment receipt:
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. 429182901234"
                  value={utrInput}
                  onChange={e => setUtrInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-[#E8DDD0] bg-[#FBF7F0] focus:bg-white focus:border-[#6F4E37] font-mono text-xs font-bold text-[#35271F] outline-hidden"
                />
                <button
                  type="submit"
                  disabled={isSubmittingUtr}
                  className="px-4 py-2 bg-[#6F4E37] text-white font-bold rounded-xl text-xs hover:bg-[#5A3E2B] transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isSubmittingUtr ? 'Saving...' : 'Submit UTR'}
                </button>
              </div>

              <div className="p-2.5 bg-[#FBF7F0] rounded-xl border border-[#E8DDD0] text-[10px] text-[#8B6548] space-y-1">
                <p>
                  ⚠️ <strong>Important:</strong> Submitting a reference records your payment as <strong>Pending Verification</strong>.
                </p>
                <p>
                  Our dispatch administrator verifies the receipt against dairy bank records before marking the order as Paid.
                </p>
              </div>
            </form>
          </div>

          {/* Footer Navigation */}
          <div className="pt-2 flex items-center justify-between border-t border-[#E8DDD0]">
            <button
              type="button"
              onClick={() => {
                setIsUpiPaymentModalOpen(false);
                setConfirmedOrder(order);
              }}
              className="px-4 py-2 text-xs font-semibold text-[#8B6548] hover:text-[#35271F] hover:bg-[#FBF7F0] rounded-xl cursor-pointer"
            >
              Done / Return to Order Summary
            </button>

            <button
              type="button"
              onClick={() => {
                setIsUpiPaymentModalOpen(false);
                setConfirmedOrder(order);
              }}
              className="px-5 py-2 bg-[#6F4E37] text-white text-xs font-bold rounded-xl hover:bg-[#5A3E2B] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>View Order Confirmation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
