import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  ScanBarcode,
  QrCode,
  Camera,
  Search,
  Package,
  Building2,
  Store,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Scale,
  MapPin,
  Star,
  AlertCircle
} from 'lucide-react';
import { ProductWithOffers, Currency, Language } from '../types/index.ts';
import { WholesaleSupplier, WHOLESALE_SUPPLIERS } from '../data/nearbySuppliers.ts';
import { formatCurrency } from '../utils/format.ts';
import { getLocalizedText } from '../utils/translations.ts';

export interface PlatformRetailStore {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  cityAr: string;
  districtAr: string;
  qrCode: string;
}

const PLATFORM_RETAIL_STORES: PlatformRetailStore[] = [
  {
    id: 'store_almansoor',
    slug: 'almansoor-market',
    nameAr: 'سوبرماركت المنصور المركزي',
    nameEn: 'Al-Mansoor Central Supermarket',
    cityAr: 'بغداد',
    districtAr: 'حي المنصور - شارع 14 رمضان',
    qrCode: 'STORE-MANSOOR-01'
  },
  {
    id: 'store_karrada',
    slug: 'dijla-karrada',
    nameAr: 'أسواق دجلة الخير - الكرادة',
    nameEn: 'Dijla Al-Khair Market - Karrada',
    cityAr: 'بغداد',
    districtAr: 'الكرادة داخل',
    qrCode: 'STORE-KARRADA-02'
  },
  {
    id: 'store_basra_amal',
    slug: 'ashar-basra',
    nameAr: 'سوبرماركت العشار الذهبي',
    nameEn: 'Al-Ashar Golden Supermarket',
    cityAr: 'البصرة',
    districtAr: 'العشار - شارع الكويت',
    qrCode: 'STORE-BASRA-03'
  }
];

interface BarcodeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductWithOffers[];
  currency: Currency;
  language: Language;
  onSelectProduct: (product: ProductWithOffers) => void;
  onSelectSupplier: (supplier: WholesaleSupplier) => void;
  onSelectRetailStore: (store: PlatformRetailStore) => void;
}

export const BarcodeSearchModal: React.FC<BarcodeSearchModalProps> = ({
  isOpen,
  onClose,
  products,
  currency,
  language,
  onSelectProduct,
  onSelectSupplier,
  onSelectRetailStore
}) => {
  const isAr = language === 'ar';
  const [codeInput, setCodeInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCodeInput('');
      setCameraError(null);
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          isAr
            ? 'المتصفح لا يدعم الوصول المباشر للكاميرا هنا — يمكنك إدخال الباركود أو تجربة المسح السريع أدناه'
            : 'Camera not supported in this browser — enter barcode manually or use quick scan below'
        );
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 60);

      // Optional native BarcodeDetector polling if supported
      if ('BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'qr_code', 'code_128', 'upc_a']
          });
          const interval = setInterval(async () => {
            if (!videoRef.current || !streamRef.current) {
              clearInterval(interval);
              return;
            }
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                setCodeInput(barcodes[0].rawValue);
                stopCamera();
                clearInterval(interval);
              }
            } catch {
              // ignore frame detection error
            }
          }, 500);
        } catch {
          // BarcodeDetector format not available
        }
      }
    } catch {
      setCameraError(
        isAr
          ? 'تعذر فتح الكاميرا (تأكد من منح صلاحية الكاميرا) — يمكنك كتابة الباركود أو تجربة الرموز السريعة أدناه'
          : 'Could not open camera — please type the code or test quick scan samples below'
      );
    }
  };

  // Search matches across Products, Wholesale Suppliers, and Platform Retail Stores
  const matches = useMemo(() => {
    const q = codeInput.trim().toLowerCase();
    if (!q) {
      return {
        products: [] as ProductWithOffers[],
        suppliers: [] as WholesaleSupplier[],
        stores: [] as PlatformRetailStore[]
      };
    }

    const matchedProducts = products.filter(
      (p) =>
        p.barcode.toLowerCase().includes(q) ||
        p.nameAr.toLowerCase().includes(q) ||
        (p.nameEn || '').toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
    );

    const matchedSuppliers = WHOLESALE_SUPPLIERS.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        s.nameAr.toLowerCase().includes(q) ||
        s.nameEn.toLowerCase().includes(q) ||
        s.phone.replace(/\s+/g, '').includes(q.replace(/\s+/g, ''))
    );

    const matchedStores = PLATFORM_RETAIL_STORES.filter(
      (st) =>
        st.id.toLowerCase().includes(q) ||
        st.slug.toLowerCase().includes(q) ||
        st.qrCode.toLowerCase().includes(q) ||
        st.nameAr.toLowerCase().includes(q) ||
        st.nameEn.toLowerCase().includes(q)
    );

    return {
      products: matchedProducts.slice(0, 5),
      suppliers: matchedSuppliers.slice(0, 4),
      stores: matchedStores.slice(0, 3)
    };
  }, [codeInput, products]);

  const totalMatches = matches.products.length + matches.suppliers.length + matches.stores.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto border border-[#E5E7EB] font-brand">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00A046] to-[#007B33] text-white p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <ScanBarcode className="w-5 h-5 text-[#FFE600]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black">
                {isAr ? 'قارئ الباركود ورموز QR الشامل' : 'Universal Barcode & QR Scanner'}
              </h2>
              <p className="text-[11px] text-emerald-100">
                {isAr
                  ? 'ابحث بباركود المنتج (GTIN) أو باركود متجر أو شركة جملة على المنصة'
                  : 'Scan or enter a Product GTIN, Retail Store QR, or Wholesale Company code'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/25 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Camera Viewfinder Box */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 h-44 sm:h-52 flex flex-col items-center justify-center text-white">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Scanning frame overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-56 h-32 border-2 border-[#00A046] rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                    <div className="absolute inset-x-2 top-1/2 h-0.5 bg-[#FFE600] shadow-[0_0_8px_#FFE600] animate-pulse" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="absolute bottom-3 left-3 bg-black/70 hover:bg-black text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  {isAr ? 'إيقاف الكاميرا' : 'Stop Camera'}
                </button>
              </>
            ) : (
              <div className="text-center px-4 space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mx-auto">
                  <Camera className="w-6 h-6 text-[#FFE600]" />
                </div>
                <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                  {isAr
                    ? 'وجّه الكاميرا نحو باركود المنتج أو رمز QR الخاص بالمتجر أو الشركة'
                    : 'Point your camera at a product barcode or store/company QR code'}
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00A046] to-[#007B33] hover:from-[#008e3d] hover:to-[#00692b] text-white text-xs font-black inline-flex items-center gap-2 transition shadow-md cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>{isAr ? 'تشغيل كاميرا القارئ' : 'Activate Scanner Camera'}</span>
                </button>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-2.5 text-[11px]">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Manual Barcode / QR Code Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1F2328] block">
              {isAr ? 'أو أدخل رقم الباركود / رمز المتجر أو الشركة يدوياً:' : 'Or enter Barcode / Store / Company code manually:'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder={
                  isAr
                    ? 'مثال: 6281007000123 أو supp_rafidain أو almansoor-market...'
                    : 'e.g. 6281007000123, supp_rafidain, almansoor-market...'
                }
                className={`w-full bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl py-2.5 ${
                  isAr ? 'pr-10 pl-8' : 'pl-10 pr-8'
                } text-xs font-mono text-[#1F2328] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00A046]`}
              />
              <ScanBarcode className={`w-4 h-4 text-[#00A046] absolute ${isAr ? 'right-3' : 'left-3'} top-3`} />
              {codeInput && (
                <button
                  type="button"
                  onClick={() => setCodeInput('')}
                  className={`absolute ${isAr ? 'left-3' : 'right-3'} top-2.5 text-gray-400 hover:text-gray-700 text-xs font-bold cursor-pointer`}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Search Results */}
          {codeInput.trim() !== '' && (
            <div className="space-y-3 pt-1">
              {totalMatches === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center text-xs text-gray-500">
                  {isAr
                    ? 'لم يتم العثور على منتج أو متجر أو شركة مطابقة لهذا الباركود على المنصة.'
                    : 'No matching product, store, or supplier found on the platform.'}
                </div>
              ) : (
                <>
                  {/* Matched Wholesale Companies / Suppliers */}
                  {matches.suppliers.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-black text-[#00A046] flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{isAr ? 'شركات وموردي الجملة المطابقين:' : 'Matched Wholesale Companies:'}</span>
                      </span>
                      {matches.suppliers.map((supp) => (
                        <div
                          key={supp.id}
                          onClick={() => {
                            onSelectSupplier(supp);
                            onClose();
                          }}
                          className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={supp.logoUrl || supp.storeImageUrl}
                              alt=""
                              className="w-10 h-10 rounded-xl object-cover bg-white border border-emerald-100 shrink-0"
                            />
                            <div className="min-w-0">
                              <h4 className="font-black text-xs text-[#1F2328] truncate">
                                {isAr ? supp.nameAr : supp.nameEn}
                              </h4>
                              <p className="text-[10px] text-[#6B7280] flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-[#00A046] shrink-0" />
                                <span>{isAr ? supp.districtAr : supp.districtEn}</span>
                              </p>
                            </div>
                          </div>
                          <span className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00A046] to-[#007B33] text-white text-[11px] font-black shrink-0 flex items-center gap-1">
                            <span>{isAr ? 'دخول للشركة' : 'Open Store'}</span>
                            {isAr ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Matched Platform Retail Stores */}
                  {matches.stores.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-black text-blue-700 flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5" />
                        <span>{isAr ? 'المتاجر والسوبرماركت المسجلة بالمنصة:' : 'Matched Retail Stores:'}</span>
                      </span>
                      {matches.stores.map((store) => (
                        <div
                          key={store.id}
                          onClick={() => {
                            onSelectRetailStore(store);
                            onClose();
                          }}
                          className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                              <Store className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-black text-xs text-[#1F2328] truncate">
                                {isAr ? store.nameAr : store.nameEn}
                              </h4>
                              <p className="text-[10px] text-[#6B7280] truncate">
                                {store.cityAr} • {store.districtAr}
                              </p>
                            </div>
                          </div>
                          <span className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[11px] font-black shrink-0">
                            {isAr ? 'عرض المتجر' : 'Visit Store'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Matched Products */}
                  {matches.products.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-black text-[#1F2328] flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-[#00A046]" />
                        <span>{isAr ? 'المنتجات المطابقة بالباركود (GTIN):' : 'Matched GTIN Products:'}</span>
                      </span>
                      {matches.products.map((prod) => (
                        <div
                          key={prod.barcode}
                          onClick={() => {
                            onSelectProduct(prod);
                            onClose();
                          }}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-2xl border border-[#E5E7EB] bg-white hover:border-[#00A046] transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {prod.imageUrl ? (
                              <img src={prod.imageUrl} alt="" className="w-11 h-11 object-contain rounded-lg bg-gray-50 p-1 shrink-0" />
                            ) : (
                              <Package className="w-10 h-10 text-gray-300 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs text-[#1F2328] truncate">
                                {isAr ? prod.nameAr : getLocalizedText(prod.nameEn || prod.nameAr, language)}
                              </h4>
                              <div className="flex items-center gap-2 text-[10px] text-[#6B7280] mt-0.5">
                                <span className="font-mono">{prod.barcode}</span>
                                <span>•</span>
                                <span className="text-[#00A046] font-black font-mono">
                                  {formatCurrency(prod.minPrice, currency, language)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-[#00A046] border border-emerald-200 text-[10px] font-black shrink-0 flex items-center gap-1">
                            <Scale className="w-3 h-3" />
                            <span>{isAr ? 'مقارنة العروض' : 'Compare'}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Quick Sample Scan Shortcuts (Product / Store / Company) */}
          <div className="pt-2 border-t border-[#E5E7EB] space-y-2">
            <span className="text-[11px] font-bold text-[#6B7280] block">
              {isAr ? 'تجربة مسح سريع حسب النوع:' : 'Quick test scan by type:'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCodeInput('6281007000123')}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] hover:border-[#00A046] hover:bg-emerald-50/40 text-right transition cursor-pointer"
              >
                <Package className="w-4 h-4 text-[#00A046] shrink-0" />
                <div className="min-w-0">
                  <span className="text-[11px] font-black text-[#1F2328] block truncate">
                    {isAr ? 'باركود منتج' : 'Product GTIN'}
                  </span>
                  <span className="text-[9px] font-mono text-[#6B7280] block truncate">6281007000123</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCodeInput('supp_rafidain')}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] hover:border-[#00A046] hover:bg-emerald-50/40 text-right transition cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[11px] font-black text-[#1F2328] block truncate">
                    {isAr ? 'باركود شركة جملة' : 'Supplier QR'}
                  </span>
                  <span className="text-[9px] font-mono text-[#6B7280] block truncate">supp_rafidain</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCodeInput('almansoor-market')}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] hover:border-blue-500 hover:bg-blue-50/40 text-right transition cursor-pointer"
              >
                <Store className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[11px] font-black text-[#1F2328] block truncate">
                    {isAr ? 'باركود متجر' : 'Store QR'}
                  </span>
                  <span className="text-[9px] font-mono text-[#6B7280] block truncate">almansoor-market</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
