import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Printer,
  QrCode,
  Store,
  Phone,
  Eye,
  ExternalLink,
  RefreshCw,
  Download,
  Copy,
  Check,
  Sliders
} from 'lucide-react';
import { Language } from '../types/index.ts';
import { fetchWithRetry } from '../utils/fetchWithRetry.ts';

interface QRPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStorefront: () => void;
  language?: Language;
  storeName?: string;
}

export const QRPosterModal: React.FC<QRPosterModalProps> = ({
  isOpen,
  onClose,
  onOpenStorefront,
  language = 'ar',
  storeName: initialStoreName
}) => {
  const isEn = language === 'en';
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [scanCount, setScanCount] = useState<number>(428);
  const [simulatingScan, setSimulatingScan] = useState(false);
  const [storeName, setStoreName] = useState(
    initialStoreName || (isEn ? 'Al-Mansour Central Supermarket' : 'سوبرماركت المنصور المركزي')
  );
  const [tagline, setTagline] = useState(
    isEn
      ? 'Order from home & we deliver to your doorstep in Baghdad'
      : 'اطلب من البيت ونوصلك لباب الدار في بغداد'
  );
  const [phone, setPhone] = useState('+964 771 555 8899');
  const [destinationUrl] = useState('https://souqaljumla.iq/store/almansoor-market');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialStoreName) {
      setStoreName(initialStoreName);
    }
  }, [initialStoreName]);

  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(destinationUrl, {
      width: 440,
      margin: 2,
      color: {
        dark: '#0B5D32',
        light: '#FFFFFF'
      }
    }).then((url) => setQrDataUrl(url));
  }, [destinationUrl, isOpen]);

  const showNotice = (msg: string) => {
    setStatusNotice(msg);
    window.setTimeout(() => {
      setStatusNotice((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = 'almansoor-store-qr.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice(isEn ? 'QR image downloaded' : 'تم تحميل صورة رمز QR');
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(destinationUrl);
      showNotice(isEn ? 'Store link copied' : 'تم نسخ رابط المتجر');
    } catch {
      showNotice(isEn ? 'Link ready to share' : 'الرابط جاهز للمشاركة');
    }
  };

  const handleSimulateScan = async () => {
    if (simulatingScan) return;
    setSimulatingScan(true);
    try {
      const res = await fetchWithRetry('/api/posters/scan/almansoor-market', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data) {
        setScanCount(data.data.totalScans);
      } else {
        setScanCount((prev) => prev + 1);
      }
      showNotice(isEn ? 'Customer QR scan recorded' : 'تم تسجيل مسحة تجريبية جديدة');
    } catch {
      setScanCount((prev) => prev + 1);
    } finally {
      setSimulatingScan(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2918]/65 backdrop-blur-xs p-2.5 sm:p-4 font-brand text-[#142018]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#F4F4EA] rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#DCE5DC]">
        {/* ================= MODAL HEADER (POS Identity) ================= */}
        <div className="px-4 py-3.5 sm:px-5 border-b border-[#DCE5DC] bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#0B5D32] text-white flex items-center justify-center shadow-2xs shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm sm:text-base text-[#0B5D32] truncate">
                {isEn ? 'Store QR Poster Studio' : 'مولّد بوستر QR الديناميكي للمتجر'}
              </h3>
              <p className="text-[11px] text-[#5F7164] truncate">
                {isEn
                  ? 'Print or share your storefront QR code for instant customer home orders'
                  : 'اطبع البوستر لواجهة المحل أو أرفقه مع أكياس المشتريات'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isEn ? 'Close' : 'إغلاق'}
            className="w-9 h-9 rounded-full bg-[#F4F4EA] border border-[#DCE5DC] hover:border-[#0B5D32] text-[#3D5244] hover:text-[#0B5D32] flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================= ANALYTICS & TEST BAR ================= */}
        <div className="bg-[#EBF4EE] px-4 py-2.5 sm:px-5 border-b border-[#DCE5DC] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#142018]">
            <span className="w-7 h-7 rounded-xl bg-white border border-[#DCE5DC] flex items-center justify-center text-[#0B5D32] shrink-0">
              <Eye className="w-3.5 h-3.5" />
            </span>
            <div>
              <span className="text-[#4B6352] font-semibold">
                {isEn ? 'Total Customer Scans: ' : 'إجمالي مسحات الزبائن: '}
              </span>
              <strong className="font-black text-[#0B5D32] tabular-nums">
                {scanCount} {isEn ? 'scans' : 'مسحة'}
              </strong>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSimulateScan}
            disabled={simulatingScan}
            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white border border-[#DCE5DC] hover:border-[#0B5D32] text-[#0B5D32] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${simulatingScan ? 'animate-spin' : ''}`} />
            <span>{isEn ? 'Simulate QR Scan' : 'تجربة مسح QR'}</span>
          </button>
        </div>

        {/* ================= SCROLLABLE POSTER PREVIEW + CUSTOMIZATION ================= */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4">
          {/* Printable Poster Card */}
          <div
            ref={printRef}
            className="w-full max-w-sm mx-auto bg-white border-2 border-[#0B5D32] rounded-3xl p-4 sm:p-6 shadow-md flex flex-col items-center text-center relative overflow-hidden"
          >
            {/* Top POS Header Ribbon */}
            <div className="w-full bg-[#0B5D32] text-white py-2.5 px-4 rounded-2xl mb-3.5 flex items-center justify-center gap-2 shadow-2xs">
              <Store className="w-4 h-4 text-[#FDE047] shrink-0" />
              <span className="font-black text-xs sm:text-sm tracking-wide">
                {isEn ? 'Shop Online from Our Store' : 'تسوق أونلاين من متجرنا'}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-[#142018] leading-snug">
              {storeName}
            </h2>
            <p className="text-xs text-[#0B5D32] font-bold mt-1 mb-3.5 leading-relaxed">
              {tagline}
            </p>

            {/* QR Code Frame */}
            <div className="bg-[#F4F4EA] p-3 rounded-2xl border-2 border-dashed border-[#0B5D32]/35 inline-flex items-center justify-center my-1">
              <div className="bg-white p-2 rounded-xl shadow-2xs">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Store QR Code"
                    className="w-40 h-40 sm:w-44 sm:h-44 object-contain"
                  />
                ) : (
                  <div className="w-40 h-40 sm:w-44 sm:h-44 bg-[#F4F4EA] rounded-lg flex items-center justify-center text-xs text-[#5F7164]">
                    {isEn ? 'Generating...' : 'جاري التوليد...'}
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs font-black text-[#142018] mt-3">
              {isEn ? 'Scan with your phone camera & order now' : 'امسح الكود بكاميرا الموبايل واطلب الآن'}
            </p>

            <div
              dir="ltr"
              className="mt-1.5 px-3 py-1 rounded-full bg-[#F4F4EA] border border-[#DCE5DC] text-[10.5px] text-[#4B6352] font-mono max-w-full truncate"
            >
              {destinationUrl}
            </div>

            {/* Contact info footer */}
            <div className="mt-4 pt-3 border-t border-[#DCE5DC] w-full flex items-center justify-center gap-2 text-xs font-black text-[#0B5D32]">
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span dir="ltr" className="tabular-nums">
                {phone}
              </span>
            </div>

            <div className="mt-1.5 text-[10px] text-[#5F7164] font-medium">
              {isEn
                ? 'Powered by Dalil Al-Khairat Smart Retail • Baghdad'
                : 'مدعوم بنظام دليل الخيرات الذكي • بغداد'}
            </div>
          </div>

          {/* Poster Customization Card */}
          <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-black text-[#0B5D32]">
                <Sliders className="w-3.5 h-3.5" />
                <span>{isEn ? 'Customize Poster Details' : 'تخصيص بيانات البوستر'}</span>
              </div>

              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-2.5 py-1 rounded-lg bg-[#F4F4EA] hover:bg-[#EBF4EE] border border-[#DCE5DC] text-[11px] font-bold text-[#0B5D32] flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
              >
                <Copy className="w-3 h-3" />
                <span>{isEn ? 'Copy Link' : 'نسخ رابط المتجر'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-[#4B6352] block mb-1">
                  {isEn ? 'Promotional Tagline:' : 'العبارة الترويجية على البوستر:'}
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full min-h-[40px] bg-[#F4F4EA] border border-[#DCE5DC] focus:border-[#0B5D32] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#142018] outline-none transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#4B6352] block mb-1">
                  {isEn ? 'Delivery Hotline:' : 'رقم هاتف خدمة التوصيل:'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full min-h-[40px] bg-[#F4F4EA] border border-[#DCE5DC] focus:border-[#0B5D32] focus:bg-white rounded-xl px-3 py-2 text-xs font-mono text-left text-[#142018] tabular-nums outline-none transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ================= BOTTOM STICKY ACTIONS BAR ================= */}
        <div className="px-4 py-3 sm:px-5 border-t border-[#DCE5DC] bg-white shrink-0 space-y-2">
          {statusNotice && (
            <div className="bg-[#EBF4EE] border border-[#0B5D32]/25 text-[#0B5D32] rounded-xl px-3 py-1.5 text-[11.5px] font-bold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{statusNotice}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenStorefront();
              }}
              className="min-h-[42px] px-3 py-2 rounded-xl hover:bg-[#EBF4EE] text-xs font-bold text-[#0B5D32] flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span>{isEn ? 'Preview B2C Store' : 'معاينة متجر الزبائن (B2C)'}</span>
            </button>

            <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
              <button
                type="button"
                onClick={handleDownloadQR}
                disabled={!qrDataUrl}
                className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#F4F4EA] hover:bg-[#EBF4EE] border border-[#DCE5DC] text-[#0B5D32] text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>{isEn ? 'Save QR' : 'حفظ QR'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="min-h-[42px] px-4 sm:px-5 py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white text-xs font-black flex items-center justify-center gap-2 shadow-xs transition cursor-pointer whitespace-nowrap"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span>{isEn ? 'Print / PDF' : 'طباعة / PDF'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
