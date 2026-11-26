import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  Copy,
  Download,
  MapPin,
  MessageCircle,
  Phone,
  Printer,
  Send,
  Store,
  Truck,
  X
} from 'lucide-react';
import { Currency, Language } from '../types/index.ts';
import { formatCurrency } from '../utils/format.ts';

export interface InvoiceSupplierIdentity {
  id?: string;
  companyName: string;
  phone?: string;
  city?: string;
  address?: string;
  logoUrl?: string;
  storeImageUrl?: string;
  isVerified?: boolean;
}

export interface InvoiceCustomerStore {
  id?: string;
  name?: string;
  ownerName?: string;
  phone?: string;
  district?: string;
  address?: string;
}

interface VanInvoiceModalProps {
  receipt: any;
  supplierInfo: InvoiceSupplierIdentity;
  customerStore?: InvoiceCustomerStore | null;
  vehiclePlate?: string;
  vanWarehouseName?: string;
  resolveProductImage: (barcode: string, productName: string) => string;
  currency: Currency;
  language: Language;
  onClose: () => void;
}

export function normalizeWhatsAppPhone(raw: string): string {
  let digits = (raw || '').replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('07') && digits.length === 11) {
    digits = `964${digits.slice(1)}`;
  } else if (digits.startsWith('7') && digits.length === 10) {
    digits = `964${digits}`;
  }
  return digits;
}

export function openWhatsAppUrl(url: string) {
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const VanInvoiceModal: React.FC<VanInvoiceModalProps> = ({
  receipt,
  supplierInfo,
  customerStore,
  vehiclePlate,
  vanWarehouseName,
  resolveProductImage,
  currency,
  language,
  onClose
}) => {
  const isAr = language === 'ar';
  const [customerPhone, setCustomerPhone] = useState(customerStore?.phone || '');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [whatsappSentBanner, setWhatsappSentBanner] = useState(false);
  const [printFeedback, setPrintFeedback] = useState(false);

  useEffect(() => {
    setCustomerPhone(customerStore?.phone || '');
    setPhoneError(null);
    setCopiedReceipt(false);
    setWhatsappSentBanner(false);
    setPrintFeedback(false);
  }, [receipt?.id, receipt?.receiptNumber, customerStore?.phone]);

  const formattedDate = useMemo(() => {
    const raw = receipt?.createdAt ? new Date(receipt.createdAt) : new Date();
    if (Number.isNaN(raw.getTime())) return receipt?.createdAt || '';
    return raw.toLocaleString(isAr ? 'ar-IQ' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [receipt?.createdAt, isAr]);

  const totalUnits = useMemo(() => {
    if (!Array.isArray(receipt?.items)) return 0;
    return receipt.items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 0), 0);
  }, [receipt?.items]);

  const grossSubtotalIQD = useMemo(() => {
    if (typeof receipt?.grossAmountIQD === 'number' && receipt.grossAmountIQD > 0) {
      return receipt.grossAmountIQD;
    }
    return (receipt?.totalAmountIQD || 0) + (receipt?.discountIQD || 0);
  }, [receipt?.grossAmountIQD, receipt?.totalAmountIQD, receipt?.discountIQD]);

  const buildWhatsAppMessage = () => {
    if (!receipt) return '';
    const docTitle =
      receipt.type === 'debt_collection'
        ? isAr
          ? 'سند قبض وتحصيل آجل ميداني'
          : 'Field Debt Collection Receipt'
        : isAr
        ? 'فاتورة مبيعات جملة إلكترونية'
        : 'Wholesale Direct Sales Invoice';

    const lines = [
      `🏢 *${supplierInfo.companyName}*`,
      supplierInfo.phone ? `📞 ${supplierInfo.phone}` : '',
      `━━━━━━━━━━━━━━━━━━`,
      `🧾 *${docTitle}*`,
      `رقم الفاتورة: *${receipt.receiptNumber}*`,
      `التاريخ: ${formattedDate}`,
      `العميل: *${receipt.storeName}*`,
      `المندوب: ${receipt.driverName}${vehiclePlate ? ` (${vehiclePlate})` : ''}`,
      `طريقة الدفع: ${
        receipt.paymentType === 'cash'
          ? isAr
            ? 'نقدي (كاش)'
            : 'Cash'
          : isAr
          ? 'آجل على الحساب'
          : 'Credit Ledger'
      }`,
      ...(receipt.items?.length
        ? [
            `--- الأصناف (${receipt.items.length}) ---`,
            ...receipt.items.map(
              (it: any, i: number) =>
                `${i + 1}. ${it.productName} (${it.unit || ''})\n   ${it.quantity} × ${Number(
                  it.unitPriceIQD || 0
                ).toLocaleString()} د.ع${it.tierApplied ? ' [سعر جملة]' : ''} = *${Number(
                  it.totalIQD || 0
                ).toLocaleString()} د.ع*`
            )
          ]
        : []),
      `━━━━━━━━━━━━━━━━━━`,
      ...(receipt.discountIQD > 0
        ? [
            `المجموع الفرعي: ${grossSubtotalIQD.toLocaleString()} د.ع`,
            `الخصم التجاري: -${Number(receipt.discountIQD).toLocaleString()} د.ع`
          ]
        : []),
      `💰 *الإجمالي النهائي: ${Number(receipt.totalAmountIQD || 0).toLocaleString()} د.ع*`,
      receipt.type === 'direct_sale'
        ? '✅ تمت مزامنة الأصناف تلقائياً إلى مخزون كاشير المتجر.'
        : '✅ تم ترحيل الدفعة إلى دفتر الأستاذ (FIFO).'
    ].filter(Boolean);

    return lines.join('\n');
  };

  const handleCopyText = async () => {
    const text = buildWhatsAppMessage();
    if (!text) return;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2500);
    } catch {
      setCopiedReceipt(false);
    }
  };

  const handleSendWhatsAppToCustomer = () => {
    setPhoneError(null);
    const normalized = normalizeWhatsAppPhone(customerPhone);
    if (!normalized || normalized.length < 10) {
      setPhoneError(
        isAr
          ? 'يرجى إدخال رقم واتساب صحيح للعميل (مثال: 07701234567 أو +964...)'
          : 'Please enter a valid customer WhatsApp number'
      );
      return;
    }
    const text = encodeURIComponent(buildWhatsAppMessage());
    openWhatsAppUrl(`https://wa.me/${normalized}?text=${text}`);
    setWhatsappSentBanner(true);
    setTimeout(() => setWhatsappSentBanner(false), 3000);
  };

  if (!receipt) return null;

  const isDirectSale = receipt.type === 'direct_sale';
  const receiptRef = receipt.receiptNumber || receipt.id;
  const printUrl = `/api/van/invoice/${encodeURIComponent(receiptRef)}/print?lang=${language}`;
  const downloadUrl = `${printUrl}&download=1`;

  return (
    <div
      className="van-invoice-print-overlay fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-xs sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`van-invoice-print-sheet bg-white w-full sm:max-w-lg max-h-[94vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#DCE5DC] overflow-hidden flex flex-col font-brand ${
          isAr ? 'text-right' : 'text-left'
        }`}
      >
        {/* ================= 1. SUPPLIER BRAND IDENTITY BANNER ================= */}
        <div className="relative bg-gradient-to-l from-[#084725] via-[#0B5D32] to-[#117A42] text-white px-4 pt-4 pb-4 shrink-0 overflow-hidden">
          {supplierInfo.storeImageUrl && (
            <img
              src={supplierInfo.storeImageUrl}
              alt={supplierInfo.companyName}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-luminosity pointer-events-none"
            />
          )}
          <div className="relative z-10 space-y-3">
            {/* Top utility bar: Document label & close button */}
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-[10.5px] font-black text-[#FFE600] backdrop-blur-xs">
                <BadgeCheck className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {isDirectSale
                    ? isAr
                      ? 'فاتورة بيع جملة معتمدة'
                      : 'Verified Wholesale Invoice'
                    : isAr
                    ? 'سند قبض وتحصيل معتمد'
                    : 'Verified Collection Receipt'}
                </span>
              </span>

              <button
                type="button"
                onClick={onClose}
                className="print-hide w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white cursor-pointer transition shrink-0"
                aria-label={isAr ? 'إغلاق الفاتورة' : 'Close invoice'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Supplier Brand Profile Identity */}
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1 shadow-lg ring-2 ring-[#FFE600]/85 overflow-hidden flex items-center justify-center">
                  {supplierInfo.logoUrl ? (
                    <img
                      src={supplierInfo.logoUrl}
                      alt={supplierInfo.companyName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Building2 className="w-7 h-7 text-[#0B5D32]" />
                  )}
                </div>
                {supplierInfo.isVerified !== false && (
                  <span
                    className="absolute -bottom-1 -end-1 w-5 h-5 rounded-full bg-[#FFE600] text-[#142018] flex items-center justify-center shadow-sm border border-white"
                    title={isAr ? 'مورد موثق على المنصة' : 'Verified Platform Supplier'}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-base font-black text-white leading-snug truncate">
                  {supplierInfo.companyName}
                </h2>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-white/85 mt-1">
                  {(supplierInfo.city || supplierInfo.address) && (
                    <span className="inline-flex items-center gap-1 truncate max-w-full">
                      <MapPin className="w-3 h-3 text-[#FFE600] shrink-0" />
                      <span className="truncate">
                        {[supplierInfo.city, supplierInfo.address].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                  )}
                  {supplierInfo.phone && (
                    <span dir="ltr" className="inline-flex items-center gap-1 font-mono text-[10.5px] whitespace-nowrap">
                      <Phone className="w-3 h-3 text-[#FFE600] shrink-0" />
                      <span>{supplierInfo.phone}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice Number & Timestamp Strip */}
            <div className="bg-black/20 border border-white/15 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs">
              <div>
                <div className="text-[10px] text-white/75 font-semibold">
                  {isAr ? 'رقم الفاتورة المرجعي' : 'Invoice Reference'}
                </div>
                <div className="font-mono font-black text-sm text-[#FFE600] tracking-wide">
                  {receipt.receiptNumber}
                </div>
              </div>

              <div className="text-end">
                <div className="text-[10px] text-white/75 font-semibold flex items-center justify-end gap-1">
                  <CalendarClock className="w-3 h-3" />
                  <span>{isAr ? 'تاريخ الإصدار' : 'Issued'}</span>
                </div>
                <div className="text-[11px] font-bold text-white tabular-nums mt-0.5">
                  {formattedDate}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 2. SCROLLABLE INVOICE BODY ================= */}
        <div className="van-invoice-print-scroll flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#FAFBF8]">
          {/* Billed To & Rep Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3 space-y-1">
              <div className="text-[10.5px] font-bold text-[#5F7164] flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-[#0B5D32]" />
                <span>{isAr ? 'بيانات العميل / المتجر المستلم' : 'Billed To (Customer Store)'}</span>
              </div>
              <div className="text-xs font-black text-[#142018] truncate">
                {receipt.storeName}
              </div>
              {(customerStore?.district || customerStore?.address) && (
                <div className="text-[10.5px] text-[#5F7164] truncate">
                  {customerStore?.district || customerStore?.address}
                </div>
              )}
              {customerStore?.phone && (
                <div dir="ltr" className="text-[10.5px] font-mono font-bold text-[#0B5D32] w-fit">
                  {customerStore.phone}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3 space-y-1">
              <div className="text-[10.5px] font-bold text-[#5F7164] flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#0B5D32]" />
                <span>{isAr ? 'بيانات التوزيع والسداد' : 'Dispatch & Payment'}</span>
              </div>
              <div className="text-xs font-black text-[#142018] truncate">
                {receipt.driverName}
              </div>
              {(vanWarehouseName || vehiclePlate) && (
                <div className="text-[10.5px] text-[#5F7164] truncate">
                  {[vanWarehouseName, vehiclePlate].filter(Boolean).join(' · ')}
                </div>
              )}
              <div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black border ${
                    receipt.paymentType === 'cash'
                      ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {receipt.paymentType === 'cash'
                    ? isAr
                      ? 'دفع نقدي (كاش)'
                      : 'Cash Paid'
                    : isAr
                    ? 'آجل على الحساب'
                    : 'Credit Ledger'}
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Products List WITH THUMBNAILS */}
          {receipt.items && receipt.items.length > 0 && (
            <div className="bg-white border border-[#DCE5DC] rounded-2xl overflow-hidden shadow-2xs">
              <div className="bg-[#EEF4EE] px-3.5 py-2 text-[11px] font-black text-[#3D5244] flex items-center justify-between border-b border-[#DCE5DC]">
                <span>
                  {isAr
                    ? `تفاصيل الأصناف (${receipt.items.length} صنف · ${totalUnits} وحدة)`
                    : `Line Items (${receipt.items.length} SKUs · ${totalUnits} units)`}
                </span>
                <span>{isAr ? 'الإجمالي' : 'Subtotal'}</span>
              </div>

              <div className="van-invoice-print-scroll divide-y divide-[#EAEFEA] max-h-60 overflow-y-auto">
                {receipt.items.map((it: any, idx: number) => {
                  const thumbUrl =
                    it.imageUrl || resolveProductImage(it.barcode || '', it.productName || '');
                  return (
                    <div
                      key={`${it.barcode || idx}-${idx}`}
                      className="px-3.5 py-2.5 flex items-center justify-between gap-2.5 hover:bg-[#FAFBF8] transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Product Thumbnail */}
                        <div className="w-11 h-11 rounded-xl bg-white border border-[#DCE5DC] p-1 flex items-center justify-center shrink-0 shadow-2xs">
                          <img
                            src={thumbUrl}
                            alt={it.productName}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                '/assets/images/white_canned_goods.jpg';
                            }}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-black text-[#142018] leading-snug line-clamp-2">
                            {it.productName}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            {it.unit && (
                              <span className="text-[10px] font-semibold text-[#5F7164] bg-[#F4F4EA] px-1.5 py-0.5 rounded">
                                {it.unit}
                              </span>
                            )}
                            <span className="text-[10.5px] text-[#4B6352] font-mono tabular-nums">
                              {it.quantity} × {formatCurrency(it.unitPriceIQD, currency, language)}
                            </span>
                            {it.tierApplied && (
                              <span className="text-[9.5px] font-black bg-[#ECFDF5] text-[#0B5D32] border border-[#A7F3D0] px-1.5 py-0.2 rounded">
                                {isAr ? 'سعر جملة' : 'Bulk Tier'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="font-mono font-black text-xs sm:text-sm text-[#0B5D32] tabular-nums shrink-0">
                        {formatCurrency(it.totalIQD, currency, language)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Totals Breakdown Card */}
          <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3.5 space-y-2 shadow-2xs">
            {(receipt.discountIQD || 0) > 0 && (
              <>
                <div className="flex items-center justify-between text-xs text-[#5F7164]">
                  <span>{isAr ? 'المجموع الفرعي قبل الخصم:' : 'Gross Subtotal:'}</span>
                  <span className="font-mono font-bold text-[#142018] tabular-nums">
                    {formatCurrency(grossSubtotalIQD, currency, language)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-amber-800 font-bold">
                  <span>{isAr ? 'الخصم التجاري الممنوح:' : 'Trade Discount:'}</span>
                  <span className="font-mono tabular-nums">
                    -{formatCurrency(receipt.discountIQD, currency, language)}
                  </span>
                </div>
                <div className="border-t border-dashed border-[#DCE5DC]" />
              </>
            )}

            <div className="flex items-center justify-between pt-0.5">
              <div>
                <div className="text-xs font-black text-[#142018]">
                  {isAr ? 'الإجمالي النهائي المستحق' : 'Grand Total'}
                </div>
                {totalUnits > 0 && (
                  <div className="text-[10.5px] text-[#5F7164]">
                    {isAr ? `إجمالي الكمية: ${totalUnits} وحدة` : `Total Qty: ${totalUnits} units`}
                  </div>
                )}
              </div>
              <div className="text-xl font-black font-mono tabular-nums text-[#0B5D32]">
                {formatCurrency(receipt.totalAmountIQD, currency, language)}
              </div>
            </div>
          </div>

          {/* Sync / Ledger Confirmation Pill */}
          <div className="p-2.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-[11px] font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              {isDirectSale
                ? isAr
                  ? 'تمت مزامنة البضاعة تلقائياً إلى مخزون كاشير المتجر.'
                  : 'Items automatically synced to the store POS inventory.'
                : isAr
                ? 'تم ترحيل الدفعة إلى دفتر الأستاذ للمورد وتحديث عهدة الفان.'
                : 'Payment posted to supplier ledger & added to van custody.'}
            </span>
          </div>

          {/* ================= 3. DIRECT WHATSAPP SHARE TO CUSTOMER NUMBER ================= */}
          <div className="print-hide bg-gradient-to-br from-[#ECFDF5] to-[#F7FBF8] rounded-2xl border border-[#A7F3D0] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-black text-[#065F46] flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-[#16A34A]" />
                <span>
                  {isAr
                    ? 'مشاركة الفاتورة مباشرة على واتساب العميل'
                    : 'Send Invoice Directly via Customer WhatsApp'}
                </span>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Phone className="w-3.5 h-3.5 text-[#5F7164] absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  dir="ltr"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    if (phoneError) setPhoneError(null);
                  }}
                  placeholder="0770 123 4567"
                  className="w-full min-h-[40px] bg-white border border-[#BCE3C9] focus:border-[#0B5D32] rounded-xl ps-9 pe-3 py-2 text-xs font-mono font-bold text-[#142018] focus:outline-hidden"
                />
              </div>

              <button
                type="button"
                onClick={handleSendWhatsAppToCustomer}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1FB858] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer whitespace-nowrap shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isAr ? 'إرسال عبر واتساب' : 'Send on WhatsApp'}</span>
              </button>
            </div>

            {phoneError && (
              <p className="text-[11px] font-bold text-red-700">{phoneError}</p>
            )}
            {whatsappSentBanner && (
              <p className="text-[11px] font-bold text-[#065F46]">
                {isAr
                  ? '✓ تم فتح محادثة واتساب مع العميل وتجهيز تفاصيل الفاتورة للإرسال.'
                  : '✓ WhatsApp chat opened with formatted invoice details.'}
              </p>
            )}
          </div>
        </div>

        {/* ================= 4. STICKY FOOTER ACTIONS ================= */}
        <div className="print-hide bg-white border-t border-[#EAEFEA] px-4 py-3 space-y-2 shrink-0">
          {printFeedback && (
            <p className="text-[11px] font-bold text-[#0B5D32] text-center">
              {isAr
                ? '✓ تم فتح صفحة الطباعة — اختر الطابعة أو حفظ كـ PDF'
                : '✓ Print sheet opened — select printer or Save as PDF'}
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="flex-1 min-h-[42px] py-2.5 px-3 rounded-xl bg-[#F4F4EA] hover:bg-[#E7ECE5] border border-[#DCE5DC] text-[#142018] font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
            >
              {copiedReceipt ? (
                <>
                  <Check className="w-4 h-4 text-[#0B5D32]" />
                  <span className="text-[#0B5D32]">{isAr ? 'تم نسخ الفاتورة' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{isAr ? 'نسخ النص' : 'Copy'}</span>
                </>
              )}
            </button>

            <a
              href={printUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setPrintFeedback(true);
                setTimeout(() => setPrintFeedback(false), 3500);
              }}
              className="flex-[1.3] min-h-[42px] py-2.5 px-3 rounded-xl bg-[#0B5D32] hover:bg-[#084725] text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة الفاتورة' : 'Print Invoice'}</span>
            </a>

            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              title={isAr ? 'حفظ الفاتورة كملف' : 'Download printable invoice'}
              aria-label={isAr ? 'حفظ الفاتورة كملف' : 'Download printable invoice'}
              className="min-h-[42px] w-[42px] rounded-xl bg-[#F4F4EA] hover:bg-[#E7ECE5] border border-[#DCE5DC] text-[#142018] flex items-center justify-center cursor-pointer transition shrink-0"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
