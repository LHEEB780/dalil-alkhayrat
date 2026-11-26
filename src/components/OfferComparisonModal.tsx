import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Barcode,
  X,
  Tag,
  Building2,
  Truck,
  Clock,
  ShieldCheck,
  Check,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Heart,
  Star,
  ArrowRight,
  ArrowLeft,
  Package,
  ThermometerSnowflake,
  Sparkles,
  Store,
  Plus,
  Calculator,
  TrendingUp,
  Award,
  ExternalLink,
  FileText,
  Maximize2
} from 'lucide-react';
import { ProductWithOffers, SupplierOfferItem, Currency, Language } from '../types/index.ts';
import { formatCurrency } from '../utils/format.ts';
import { getLocalizedText } from '../utils/translations.ts';
import { resolveWholesaleSupplierByOffer } from '../data/nearbySuppliers.ts';
import {
  getInitialOfferQuantity,
  isOfferMinQuantityEnforced
} from '../../shared/orderRules.ts';

// Helper to infer retail selling units per wholesale carton/pack for profit calculation
function getRetailUnitsInfo(product: ProductWithOffers, isAr: boolean): { count: number; unitLabel: string } {
  if (product.packageQuantity && product.packageQuantity > 1) {
    return {
      count: product.packageQuantity,
      unitLabel: isAr ? 'قطعة' : 'pc'
    };
  }
  const unitText = `${product.unit || ''} ${product.nameAr || ''}`;
  const kgMatch = unitText.match(/(\d+(?:\.\d+)?)\s*(?:كغم|كجم|كيلو|kg)/i);
  if (kgMatch) {
    const kgVal = parseFloat(kgMatch[1]);
    if (kgVal > 1) {
      return {
        count: Math.round(kgVal),
        unitLabel: isAr ? 'كغم' : 'kg'
      };
    }
  }
  return {
    count: 1,
    unitLabel: isAr ? 'عبوة' : 'pack'
  };
}

function getSuggestedRetailUnitPriceIQD(wholesalePriceIQD: number, unitsCount: number): number {
  const costPerUnit = wholesalePriceIQD / Math.max(1, unitsCount);
  const rawSuggested = costPerUnit * 1.38;
  if (rawSuggested >= 500) {
    return Math.ceil(rawSuggested / 250) * 250;
  }
  return Math.max(100, Math.ceil(rawSuggested / 50) * 50);
}

interface OfferComparisonModalProps {
  product: ProductWithOffers | null;
  currency: Currency;
  onClose: () => void;
  onAddToCart: (product: ProductWithOffers, offer: SupplierOfferItem, quantity: number) => void;
  language?: Language;
  allProducts?: ProductWithOffers[];
  onSelectProduct?: (product: ProductWithOffers) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (barcode: string) => void;
  activeDistrictName?: string;
  onExploreBrand?: (brand: string) => void;
  onExploreCategory?: (category: string) => void;
  onOpenSupplierStore?: (offer: SupplierOfferItem) => void;
}

export const OfferComparisonModal: React.FC<OfferComparisonModalProps> = ({
  product,
  currency,
  onClose,
  onAddToCart,
  language = 'ar',
  allProducts = [],
  onSelectProduct,
  isFavorite = false,
  onToggleFavorite,
  activeDistrictName,
  onExploreBrand,
  onExploreCategory,
  onOpenSupplierStore
}) => {
  const isAr = language === 'ar';
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<string>('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedOfferId, setAddedOfferId] = useState<string | null>(null);
  const [addedBottomBar, setAddedBottomBar] = useState(false);
  const [addedSimilarBarcode, setAddedSimilarBarcode] = useState<string | null>(null);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [failedSlideImages, setFailedSlideImages] = useState<Record<string, boolean>>({});
  const [customRetailUnitPrice, setCustomRetailUnitPrice] = useState<number>(0);

  // Collapsed by default per user request — expandable via arrow toggle next to each title
  const [isProfitCalcOpen, setIsProfitCalcOpen] = useState(false);
  const [isProfitCompareOpen, setIsProfitCompareOpen] = useState(false);
  const [isSupplyTermsOpen, setIsSupplyTermsOpen] = useState(false);
  const [isGalleryLightboxOpen, setIsGalleryLightboxOpen] = useState(false);
  const [localFavoriteFallback, setLocalFavoriteFallback] = useState(false);

  // Reset state whenever active product changes
  useEffect(() => {
    if (product && product.offers) {
      const initial: Record<string, number> = {};
      product.offers.forEach((o) => {
        const supp = resolveWholesaleSupplierByOffer(o.supplierId, o.supplierName, o.supplierCity);
        initial[o.id] = getInitialOfferQuantity(o.minOrderQuantity, supp.orderRules);
      });
      setQuantities(initial);
      const firstOffer = product.offers[0];
      setSelectedOfferId(firstOffer?.id || '');
      const { count } = getRetailUnitsInfo(product, isAr);
      const baseWholesale = firstOffer?.priceIQD || product.minPrice || 0;
      setCustomRetailUnitPrice(getSuggestedRetailUnitPriceIQD(baseWholesale, count));
      setActiveSlideIndex(0);
      setIsDetailsExpanded(false);
      setIsProfitCalcOpen(false);
      setIsProfitCompareOpen(false);
      setIsSupplyTermsOpen(false);
      setIsGalleryLightboxOpen(false);
      setLocalFavoriteFallback(false);
      setImageLoadFailed(false);
      setFailedSlideImages({});
      setAddedBottomBar(false);
      setAddedOfferId(null);

      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [product, isAr]);

  // Close on Escape key (close lightbox first if open)
  useEffect(() => {
    if (!product) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isGalleryLightboxOpen) {
          setIsGalleryLightboxOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, onClose, isGalleryLightboxOpen]);

  const similarProducts = useMemo(() => {
    if (!product || allProducts.length === 0) return [];
    const sameCategory = allProducts.filter(
      (p) => p.barcode !== product.barcode && p.category === product.category
    );
    const sameSub = sameCategory.filter(
      (p) => product.subCategory && p.subCategory === product.subCategory
    );
    const othersSameCat = sameCategory.filter(
      (p) => !product.subCategory || p.subCategory !== product.subCategory
    );
    const combined = [...sameSub, ...othersSameCat];
    if (combined.length >= 6) return combined.slice(0, 8);
    const fallback = allProducts.filter(
      (p) => p.barcode !== product.barcode && p.category !== product.category
    );
    return [...combined, ...fallback].slice(0, 8);
  }, [product, allProducts]);

  const sameSupplierProducts = useMemo(() => {
    if (!product || allProducts.length === 0) return [];
    const currentOffer =
      product.offers.find((o) => o.id === selectedOfferId) || product.offers[0];
    if (!currentOffer) return [];
    const fromSupplier = allProducts.filter(
      (p) =>
        p.barcode !== product.barcode &&
        p.offers.some((o) => o.supplierId === currentOffer.supplierId)
    );
    const sameCatFirst = [
      ...fromSupplier.filter((p) => p.category === product.category),
      ...fromSupplier.filter((p) => p.category !== product.category)
    ];
    return sameCatFirst.slice(0, 8);
  }, [product, allProducts, selectedOfferId]);

  const categoryTopProducts = useMemo(() => {
    if (!product || allProducts.length === 0) return [];
    const inCategory = allProducts
      .filter((p) => p.barcode !== product.barcode && p.category === product.category)
      .sort(
        (a, b) =>
          (b.rating || 4.8) * 10 +
          (b.suppliersCount || 1) -
          ((a.rating || 4.8) * 10 + (a.suppliersCount || 1))
      );
    if (inCategory.length >= 4) return inCategory.slice(0, 8);
    const topOthers = allProducts
      .filter((p) => p.barcode !== product.barcode && p.category !== product.category)
      .sort((a, b) => (b.rating || 4.8) - (a.rating || 4.8));
    return [...inCategory, ...topOthers].slice(0, 8);
  }, [product, allProducts]);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    const raw =
      product.images && product.images.length > 0
        ? product.images.filter(Boolean)
        : product.imageUrl
        ? [product.imageUrl]
        : [];
    return Array.from(new Set(raw)).length > 0 ? raw : [];
  }, [product]);

  const slides = useMemo(() => {
    const roleLabelsAr = [
      'كرتون الجملة وبجانبه منتج مفرد',
      'فتح الكرتون وتعبئة الوحدات',
      'تفاصيل العبوة الفردية',
      'تكديس وشحن الجملة'
    ];
    const roleLabelsEn = [
      'Wholesale Carton + Single Unit',
      'Open Case & Inner Units',
      'Retail Unit Close-Up',
      'Bulk Dispatch & Stacking'
    ];
    if (galleryImages.length === 0) {
      return [
        {
          id: 'fallback-0',
          label: isAr ? roleLabelsAr[0] : roleLabelsEn[0],
          src: ''
        }
      ];
    }
    return galleryImages.map((src, idx) => ({
      id: `photo-${idx}`,
      label: isAr
        ? roleLabelsAr[idx] || `صورة المنتج ${idx + 1}`
        : roleLabelsEn[idx] || `Product Photo ${idx + 1}`,
      src
    }));
  }, [galleryImages, isAr]);

  if (!product) return null;

  const displayName =
    !isAr && product.nameEn ? product.nameEn : getLocalizedText(product.nameAr, language);
  const displayUnit = getLocalizedText(product.unit, language);
  const activeOffer =
    product.offers.find((o) => o.id === selectedOfferId) || product.offers[0];

  const isProductInStock = activeOffer
    ? activeOffer.availableStock > 0
    : product.offers.some((o) => o.availableStock > 0);
  const effectiveIsFavorite = onToggleFavorite ? isFavorite : localFavoriteFallback;
  const handleToggleFav = () => {
    if (onToggleFavorite) {
      onToggleFavorite(product.barcode);
    } else {
      setLocalFavoriteFallback((prev) => !prev);
    }
  };

  const activeOfferOrderRules = activeOffer
    ? resolveWholesaleSupplierByOffer(
        activeOffer.supplierId,
        activeOffer.supplierName,
        activeOffer.supplierCity
      ).orderRules
    : undefined;
  const activeOfferMinQty = activeOffer
    ? getInitialOfferQuantity(activeOffer.minOrderQuantity, activeOfferOrderRules)
    : 1;
  const showActiveOfferMinQty = isOfferMinQuantityEnforced(activeOfferOrderRules);

  const activeQty = activeOffer
    ? quantities[activeOffer.id] || activeOfferMinQty
    : 1;

  const discountPercent =
    product.discountPercent ||
    (product.oldPrice && product.oldPrice > product.minPrice
      ? Math.round(((product.oldPrice - product.minPrice) / product.oldPrice) * 100)
      : null);

  const oldPrice =
    product.oldPrice ||
    (discountPercent && discountPercent > 0
      ? Math.round((activeOffer?.priceIQD || product.minPrice) * (1 + discountPercent / 100))
      : null);

  const rating = product.rating || 4.8;
  const reviewsCount =
    product.reviewsCount || Math.floor((product.barcode.charCodeAt(3) || 7) * 8 + 35);

  const deliveryLabel =
    product.fastestDeliveryDays <= 1
      ? isAr
        ? 'التوصيل خلال 24 ساعة'
        : 'Delivery within 24h'
      : isAr
      ? `التوصيل خلال ${product.fastestDeliveryDays} أيام`
      : `Delivery in ${product.fastestDeliveryDays} days`;

  const handleNextSlide = () => {
    setActiveSlideIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrevSlide = () => {
    setActiveSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(diff) < 35) return;
    if (isAr) {
      if (diff > 0) handleNextSlide();
      else handlePrevSlide();
    } else {
      if (diff < 0) handleNextSlide();
      else handlePrevSlide();
    }
  };

  const handleQuantityChange = (offerId: string, value: number, min: number, max: number) => {
    const cleanVal = Math.max(min, Math.min(max, value));
    setQuantities((prev) => ({ ...prev, [offerId]: cleanVal }));
  };

  const handleAddOffer = (offer: SupplierOfferItem) => {
    const supp = resolveWholesaleSupplierByOffer(offer.supplierId, offer.supplierName, offer.supplierCity);
    const qty = quantities[offer.id] || getInitialOfferQuantity(offer.minOrderQuantity, supp.orderRules);
    onAddToCart(product, offer, qty);
    setAddedOfferId(offer.id);
    setTimeout(() => setAddedOfferId(null), 1600);
  };

  const handleAddBottomBar = () => {
    if (!activeOffer) return;
    onAddToCart(product, activeOffer, activeQty);
    setAddedBottomBar(true);
    setTimeout(() => setAddedBottomBar(false), 1600);
  };

  const handleQuickAddSimilar = (e: React.MouseEvent, simProd: ProductWithOffers) => {
    e.stopPropagation();
    const offer = simProd.offers[0];
    if (!offer || offer.availableStock <= 0) return;
    const supp = resolveWholesaleSupplierByOffer(offer.supplierId, offer.supplierName, offer.supplierCity);
    onAddToCart(simProd, offer, getInitialOfferQuantity(offer.minOrderQuantity, supp.orderRules));
    setAddedSimilarBarcode(simProd.barcode);
    setTimeout(() => setAddedSimilarBarcode(null), 1500);
  };

  const handleSwitchProduct = (nextProduct: ProductWithOffers) => {
    if (onSelectProduct) {
      onSelectProduct(nextProduct);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-3xl h-[96vh] sm:h-auto sm:max-h-[92vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-[#E5E7EB] font-brand"
      >
        {/* Sticky Top Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#1F2328] transition cursor-pointer shrink-0"
              aria-label={isAr ? 'رجوع' : 'Back'}
            >
              {isAr ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            </button>
            <div className="min-w-0">
              <div className="text-sm font-bold text-[#1F2328] truncate">
                {deliveryLabel}
              </div>
              <div className="text-xs text-[#6B7280] truncate">
                {activeDistrictName
                  ? isAr
                    ? `التوصيل إلى: ${activeDistrictName}`
                    : `Delivering to: ${activeDistrictName}`
                  : isAr
                  ? 'توريد جملة مباشر للمتاجر'
                  : 'Direct wholesale store delivery'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(product.barcode)}
                className="w-10 h-10 rounded-full hover:bg-amber-50 flex items-center justify-center transition cursor-pointer"
                title={isAr ? 'حفظ في المفضلة' : 'Save to Wishlist'}
              >
                <Heart
                  className={`w-5 h-5 transition ${
                    isFavorite ? 'fill-[#FFA300] text-[#FFA300]' : 'text-[#6B7280]'
                  }`}
                />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#6B7280] transition cursor-pointer"
              aria-label={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto bg-[#F8FAFC]"
        >
          {/* 1. Professional 4-Photo Wholesale Image Gallery */}
          <div className="bg-white border-b border-[#E5E7EB]">
            <div
              className="relative h-72 sm:h-88 w-full bg-white flex items-center justify-center overflow-hidden select-none"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {(() => {
                const currentSlide = slides[activeSlideIndex] || slides[0];
                const currentSrc = currentSlide?.src || product.imageUrl || '';
                const hasFailed = !currentSrc || Boolean(failedSlideImages[`slide-${activeSlideIndex}`]) || imageLoadFailed;
                return (
                  <button
                    type="button"
                    onClick={() => !hasFailed && setIsGalleryLightboxOpen(true)}
                    disabled={hasFailed}
                    aria-label={isAr ? 'فتح معرض صور المنتج' : 'Open product image gallery'}
                    className={`w-full h-full flex items-center justify-center px-6 pt-5 pb-12 sm:px-12 sm:pt-6 sm:pb-12 transition-opacity duration-200 ${
                      hasFailed ? 'cursor-default' : 'cursor-zoom-in group/gallery'
                    }`}
                  >
                    {!hasFailed ? (
                      <img
                        src={currentSrc}
                        alt={`${displayName} — ${currentSlide?.label || ''}`}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedSlideImages((prev) => ({
                            ...prev,
                            [`slide-${activeSlideIndex}`]: true
                          }))
                        }
                        className="max-h-full max-w-full object-contain rounded-xl transition-transform duration-300 group-hover/gallery:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Package className="w-16 h-16 stroke-1" />
                        <span className="text-xs mt-2 font-medium">{displayName}</span>
                      </div>
                    )}
                  </button>
                );
              })()}

              {/* Photo Counter & Role Label */}
              <div className="absolute top-3 start-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs border border-[#E5E7EB] px-2.5 py-1 rounded-lg shadow-2xs text-[11px] font-bold text-[#0F3D24] tabular-nums pointer-events-none">
                <span>
                  {activeSlideIndex + 1} / {slides.length}
                </span>
                <span className="text-[#CBD5E1]">·</span>
                <span className="text-[#4B5563] font-semibold">
                  {slides[activeSlideIndex]?.label}
                </span>
              </div>

              {/* Stock Availability Indicator Over Gallery Image + Expand Gallery Trigger */}
              <div className="absolute top-3 end-3 flex items-center gap-1.5">
                <div
                  data-testid="inline-gallery-stock-indicator"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-2xs text-[11px] font-bold backdrop-blur-xs ${
                    isProductInStock
                      ? 'bg-white/95 border-[#BBF7D0] text-[#0F3D24]'
                      : 'bg-white/95 border-gray-200 text-gray-600'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isProductInStock
                        ? 'bg-[#00A046] ring-2 ring-[#00A046]/25'
                        : 'bg-gray-400 ring-2 ring-gray-300/60'
                    }`}
                  />
                  <span>
                    {isProductInStock
                      ? isAr
                        ? 'متوفر حالياً'
                        : 'In Stock'
                      : isAr
                      ? 'بانتظار التوريد'
                      : 'Awaiting Supply'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGalleryLightboxOpen(true)}
                  aria-label={isAr ? 'تكبير المعرض' : 'Expand gallery'}
                  title={isAr ? 'فتح معرض الصور' : 'Open gallery'}
                  className="w-7 h-7 rounded-full bg-white/95 hover:bg-[#EFFAF3] border border-[#E5E7EB] shadow-2xs flex items-center justify-center text-[#0F3D24] transition cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Carousel Navigation Arrows */}
              {slides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={isAr ? handleNextSlide : handlePrevSlide}
                    className="absolute left-3 bottom-2.5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#DCFCE7]/95 hover:bg-[#BBF7D0] border border-[#86EFAC] shadow-sm flex items-center justify-center text-[#16A34A] transition cursor-pointer"
                    aria-label={isAr ? 'الصورة التالية' : 'Previous photo'}
                  >
                    <ChevronLeft className="w-4.5 h-4.5" />
                  </button>

                  <button
                    type="button"
                    onClick={isAr ? handlePrevSlide : handleNextSlide}
                    className="absolute right-3 bottom-2.5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#DCFCE7]/95 hover:bg-[#BBF7D0] border border-[#86EFAC] shadow-sm flex items-center justify-center text-[#16A34A] transition cursor-pointer"
                    aria-label={isAr ? 'الصورة السابقة' : 'Next photo'}
                  >
                    <ChevronRight className="w-4.5 h-4.5" />
                  </button>
                </>
              )}

              {/* Pagination Dots */}
              {slides.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full border border-[#E5E7EB] shadow-2xs">
                  {slides.map((slide, idx) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setActiveSlideIndex(idx)}
                      aria-label={slide.label}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        activeSlideIndex === idx
                          ? 'w-5 bg-[#00A046]'
                          : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 4-Photo Thumbnail Strip */}
            {slides.length > 1 && (
              <div className="px-4 py-2.5 bg-[#FAFDFB] border-t border-[#F1F5F9] flex items-center justify-center gap-2.5 overflow-x-auto">
                {slides.map((slide, idx) => {
                  const isActiveThumb = activeSlideIndex === idx;
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setActiveSlideIndex(idx)}
                      title={slide.label}
                      className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white p-1 border-2 overflow-hidden transition shrink-0 cursor-pointer ${
                        isActiveThumb
                          ? 'border-[#00A046] ring-2 ring-[#00A046]/20 shadow-xs'
                          : 'border-[#E5E7EB] hover:border-[#00A046]/50 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={slide.src}
                        alt={slide.label}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-[#0F3D24]/85 text-white text-[8px] font-bold leading-tight py-0.5 text-center">
                          {isAr ? 'كرتون+مفرد' : 'Case+Unit'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Product Title & Structured Metadata */}
          <div className="bg-white px-4 sm:px-6 py-3.5 border-b border-[#E5E7EB]">
            {/* Clean single-row status & rating header */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 text-[11px] sm:text-xs">
                <span className="inline-flex items-center gap-1 text-[#00A046] font-bold whitespace-nowrap shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>{isAr ? 'توريد جملة معتمد' : 'Verified Wholesale'}</span>
                </span>
                <span className="h-3 w-px bg-[#E5E7EB] shrink-0" aria-hidden="true" />
                <span className="inline-flex items-center gap-1 font-semibold text-[#374151] whitespace-nowrap truncate">
                  <Clock className="w-3.5 h-3.5 text-[#00A046] shrink-0" />
                  <span>
                    {product.fastestDeliveryDays <= 1
                      ? isAr
                        ? 'توصيل 24 ساعة'
                        : '24h delivery'
                      : isAr
                      ? `${product.fastestDeliveryDays} أيام`
                      : `${product.fastestDeliveryDays} days`}
                  </span>
                </span>
              </div>

              <span className="inline-flex items-center gap-1 text-xs tabular-nums shrink-0 bg-[#FFFBEB] border border-amber-200/80 px-2 py-0.5 rounded-md">
                <Star className="w-3.5 h-3.5 fill-[#FFA800] text-[#FFA800]" />
                <strong className="text-[#111827]">{rating.toFixed(1)}</strong>
                <span className="text-[#6B7280] text-[11px]">({reviewsCount})</span>
              </span>
            </div>

            <h2 className="text-[17px] sm:text-xl font-extrabold text-[#111827] leading-snug tracking-tight">
              {displayName}
            </h2>

            {/* Structured Pack & Barcode bar */}
            <div className="mt-2.5 flex items-center justify-between gap-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] px-3 py-2 text-xs">
              <div className="flex items-center gap-1.5 min-w-0 text-[#4B5563]">
                <Package className="w-3.5 h-3.5 text-[#00A046] shrink-0" />
                <span className="shrink-0">{isAr ? 'التعبئة:' : 'Pack:'}</span>
                <strong className="text-[#111827] font-bold truncate">{displayUnit}</strong>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-[#6B7280] font-mono tabular-nums text-[11px] sm:text-xs">
                <Barcode className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                <span>{product.barcode}</span>
              </div>
            </div>
          </div>

          {/* 3. Accordion Group (1: Product Info, 2: Profit Calculator, 3: Category Comparison, 4: Wholesale Terms) */}
          <div className="mt-2.5 px-3 sm:px-6 pt-0.5">
            {/* Accordion 1: عرض معلومات المنتج */}
            <div
              className={`rounded-xl overflow-hidden border transition-all duration-200 ${
                isDetailsExpanded
                  ? 'border-sky-400/75 bg-gradient-to-br from-white via-[#EFF8FF] to-[#DBEFFE] shadow-[0_12px_24px_-5px_rgba(2,132,199,0.28),0_4px_10px_-2px_rgba(15,23,42,0.13)]'
                  : 'border-sky-200 bg-gradient-to-br from-white via-[#F4FAFF] to-[#E3F1FD] shadow-[0_8px_18px_-4px_rgba(2,132,199,0.20),0_3px_8px_-2px_rgba(15,23,42,0.10)] hover:shadow-[0_12px_24px_-4px_rgba(2,132,199,0.28),0_4px_10px_-2px_rgba(15,23,42,0.13)]'
              }`}
            >
              <button
                type="button"
                onClick={() => setIsDetailsExpanded((prev) => !prev)}
                className="w-full px-3 py-2 flex items-center justify-between gap-1.5 text-start transition cursor-pointer"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-white/95 border border-sky-200 shadow-2xs flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 text-sky-600" />
                  </span>
                  <span className="text-[12px] sm:text-sm font-bold text-[#111827] truncate">
                    {isAr ? 'عرض معلومات المنتج' : 'View Product Info'}
                  </span>
                  <span className="w-5 h-5 rounded-full bg-white/90 border border-sky-200 shadow-2xs flex items-center justify-center shrink-0">
                    {isDetailsExpanded ? (
                      <ChevronUp className="w-3 h-3 text-sky-700" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-sky-800" />
                    )}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-sky-900 bg-white/90 border border-sky-200 px-2 py-0.5 rounded-md shadow-2xs whitespace-nowrap shrink-0 max-w-[85px] sm:max-w-none truncate">
                  {product.category}
                </span>
              </button>

              {isDetailsExpanded && (
                <div className="px-3.5 sm:px-4 pb-3.5 pt-1">
                  <div className="p-3 rounded-xl bg-white/95 border border-sky-100 text-xs sm:text-sm text-[#374151] space-y-2.5">
                    {product.descriptionAr && (
                      <p className="leading-relaxed text-[#1F2328]">{product.descriptionAr}</p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#E5E7EB] text-xs">
                      <div>
                        <span className="text-[#6B7280] block">
                          {isAr ? 'الفئة' : 'Category'}
                        </span>
                        <strong className="text-[#1F2328]">
                          {product.category}
                          {product.subCategory ? ` / ${product.subCategory}` : ''}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#6B7280] block">
                          {isAr ? 'محتوى الكرتون' : 'Pack Quantity'}
                        </span>
                        <strong className="text-[#1F2328]">
                          {product.packageQuantity} {isAr ? 'حبة / عبوة' : 'pcs'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#6B7280] block">
                          {isAr ? 'نمط الحفظ' : 'Storage'}
                        </span>
                        <strong className="text-[#1F2328]">
                          {product.isPerishable
                            ? isAr
                              ? 'مبرد / طازج'
                              : 'Chilled / Fresh'
                            : isAr
                            ? 'تخزين جاف'
                            : 'Dry Ambient'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {activeOffer && (() => {
            const { count: unitsCount, unitLabel } = getRetailUnitsInfo(product, isAr);
            const wholesaleCartonPrice = activeOffer.priceIQD;
            const costPerUnit = Math.round(wholesaleCartonPrice / Math.max(1, unitsCount));
            const retailUnitPrice = customRetailUnitPrice || getSuggestedRetailUnitPriceIQD(wholesaleCartonPrice, unitsCount);
            const totalRetailRevenue = retailUnitPrice * unitsCount;
            const profitPerCarton = totalRetailRevenue - wholesaleCartonPrice;
            const profitMarginPct = totalRetailRevenue > 0 ? Math.round((profitPerCarton / totalRetailRevenue) * 100) : 0;
            const totalExpectedProfit = profitPerCarton * activeQty;

            const stepAmount = wholesaleCartonPrice / unitsCount >= 500 ? 250 : 50;

            const comparisonCandidates = [product, ...similarProducts.slice(0, 2)].map((p) => {
              const pOffer = p.offers[0];
              const pPrice = pOffer?.priceIQD || p.minPrice || 0;
              const pUnits = getRetailUnitsInfo(p, isAr);
              const isCurrent = p.barcode === product.barcode;
              const pRetailUnit = isCurrent
                ? retailUnitPrice
                : getSuggestedRetailUnitPriceIQD(pPrice, pUnits.count);
              const pRevenue = pRetailUnit * pUnits.count;
              const pProfit = pRevenue - pPrice;
              const pMargin = pRevenue > 0 ? Math.round((pProfit / pRevenue) * 100) : 0;
              return {
                prod: p,
                isCurrent,
                pPrice,
                pUnits,
                pRetailUnit,
                pProfit,
                pMargin
              };
            });

            const maxCartonProfit = Math.max(...comparisonCandidates.map((c) => c.pProfit));

            return (
              <div className="mt-2 px-3 sm:px-6 pb-0.5 space-y-2">
                {/* Accordion 2: بيانات التوريد وشروط الجملة */}
                <div
                  className={`rounded-xl overflow-hidden border transition-all duration-200 ${
                    isSupplyTermsOpen
                      ? 'border-slate-400/70 bg-gradient-to-br from-white via-[#F1F5F9] to-[#E2E8F0] shadow-[0_12px_24px_-5px_rgba(30,41,59,0.24),0_4px_10px_-2px_rgba(15,23,42,0.13)]'
                      : 'border-slate-300/80 bg-gradient-to-br from-white via-[#F6F8FB] to-[#E7EEF6] shadow-[0_8px_18px_-4px_rgba(30,41,59,0.18),0_3px_8px_-2px_rgba(15,23,42,0.10)] hover:shadow-[0_12px_24px_-4px_rgba(30,41,59,0.24),0_4px_10px_-2px_rgba(15,23,42,0.13)]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setIsSupplyTermsOpen((prev) => !prev)}
                    className="w-full px-3 py-2 flex items-center justify-between gap-2 text-start transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-white/95 border border-slate-200 shadow-2xs flex items-center justify-center shrink-0">
                        <Store className="w-3.5 h-3.5 text-[#00A046]" />
                      </span>
                      <span className="text-[12.5px] sm:text-sm font-bold text-[#111827] truncate">
                        {isAr ? 'بيانات التوريد وشروط الجملة' : 'Wholesale Supply & Terms'}
                      </span>
                      <span className="w-5 h-5 rounded-full bg-white/90 border border-slate-200 shadow-2xs flex items-center justify-center shrink-0">
                        {isSupplyTermsOpen ? (
                          <ChevronUp className="w-3 h-3 text-[#00A046]" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-slate-700" />
                        )}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 bg-white/90 border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs whitespace-nowrap shrink-0 max-w-[95px] sm:max-w-none truncate">
                      {getLocalizedText(activeOffer.supplierCity, language)}
                    </span>
                  </button>

                  {isSupplyTermsOpen && (
                    <div className="px-3.5 sm:px-4 pb-4 pt-1">
                      <div className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-3 sm:p-3.5 space-y-2.5">
                        <button
                          type="button"
                          onClick={() => onOpenSupplierStore?.(activeOffer)}
                          className="group w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl bg-white border border-[#BFEAD1] hover:border-[#00A046] hover:bg-[#F2FBF6] shadow-2xs transition cursor-pointer text-start"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-extrabold text-sm text-[#008A3C] group-hover:text-[#006B2E] underline decoration-[#00A046]/60 underline-offset-4 leading-snug line-clamp-1">
                                {getLocalizedText(activeOffer.supplierName, language)}
                              </span>
                              <ExternalLink className="w-3.5 h-3.5 text-[#00A046] shrink-0" />
                            </div>
                            <span className="text-[11px] font-semibold text-[#6B7280] block mt-0.5">
                              {isAr ? 'موزع معتمد · اضغط لزيارة صفحة الشركة' : 'Authorized Distributor · Visit supplier page'}
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#008A3C] bg-[#EFFAF3] border border-[#BFEAD1] px-2.5 py-1 rounded-lg shrink-0 group-hover:bg-[#00A046] group-hover:text-white transition">
                            <span>{isAr ? 'صفحة المورد' : 'Storefront'}</span>
                            {isAr ? (
                              <ChevronLeft className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </span>
                        </button>

                        <div className={`grid grid-cols-2 ${showActiveOfferMinQty ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-2 text-xs`}>
                          <div className="bg-white p-2 rounded-lg border border-[#E5E7EB]">
                            <span className="text-[#6B7280] text-[10px] block">
                              {isAr ? 'التوصيل' : 'Delivery'}
                            </span>
                            <div className="flex items-center gap-1 font-semibold text-[#1F2328] mt-0.5">
                              <Truck className="w-3.5 h-3.5 text-[#00A046]" />
                              <span>{isAr ? `${activeOffer.deliveryDays} يوم` : `${activeOffer.deliveryDays}d`}</span>
                            </div>
                          </div>

                          <div className="bg-white p-2 rounded-lg border border-[#E5E7EB]">
                            <span className="text-[#6B7280] text-[10px] block">
                              {isAr ? 'شروط الدفع' : 'Payment'}
                            </span>
                            <div className="flex items-center gap-1 font-semibold text-[#1F2328] mt-0.5">
                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                              <span>
                                {activeOffer.paymentTerms.allowsCredit
                                  ? isAr
                                    ? `آجل ${activeOffer.paymentTerms.maxCreditDays} يوم`
                                    : `${activeOffer.paymentTerms.maxCreditDays}d Credit`
                                  : isAr
                                  ? 'نقدي'
                                  : 'Cash'}
                              </span>
                            </div>
                          </div>

                          {showActiveOfferMinQty && (
                            <div className="bg-white p-2 rounded-lg border border-[#E5E7EB]">
                              <span className="text-[#6B7280] text-[10px] block">
                                {isAr ? 'أدنى طلب' : 'Min Order'}
                              </span>
                              <div className="font-semibold text-[#1F2328] mt-0.5 tabular-nums truncate">
                                {activeOffer.minOrderQuantity} {isAr ? 'كرتون' : 'ctn'}
                              </div>
                            </div>
                          )}

                          <div className="bg-white p-2 rounded-lg border border-[#E5E7EB]">
                            <span className="text-[#6B7280] text-[10px] block">
                              {isAr ? 'المخزون المتاح' : 'Available'}
                            </span>
                            <div className="font-semibold text-[#15803D] mt-0.5 tabular-nums">
                              {activeOffer.availableStock} {isAr ? 'وحدة' : 'units'}
                            </div>
                          </div>
                        </div>

                        {activeOffer.discountTiers && activeOffer.discountTiers.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-amber-900 bg-amber-50/70 px-2.5 py-1.5 rounded-lg border border-amber-200">
                            <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                            <span>{isAr ? 'خصم الكميات:' : 'Volume Discount:'}</span>
                            {activeOffer.discountTiers.map((tier, idx) => (
                              <span key={idx} className="font-semibold">
                                {isAr
                                  ? `${tier.minQuantity}+ كرتون (-${tier.discountPercent}%)`
                                  : `${tier.minQuantity}+ ctns (-${tier.discountPercent}%)`}
                              </span>
                            ))}
                          </div>
                        )}

                        {product.offers.length > 1 && (
                          <div className="pt-2 border-t border-[#E5E7EB] flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] text-[#6B7280] me-1">
                              {isAr ? 'مستودع التوريد:' : 'Warehouse:'}
                            </span>
                            {product.offers.map((offer) => {
                              const isSel = offer.id === activeOffer.id;
                              return (
                                <button
                                  key={offer.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedOfferId(offer.id);
                                    const { count } = getRetailUnitsInfo(product, isAr);
                                    setCustomRetailUnitPrice(getSuggestedRetailUnitPriceIQD(offer.priceIQD, count));
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                                    isSel
                                      ? 'bg-[#00A046] text-white border-[#00A046]'
                                      : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-[#00A046]'
                                  }`}
                                >
                                  {getLocalizedText(offer.supplierCity, language)} ·{' '}
                                  {offer.paymentTerms.allowsCredit
                                    ? isAr
                                      ? `آجل ${offer.paymentTerms.maxCreditDays}ي`
                                      : `${offer.paymentTerms.maxCreditDays}d`
                                    : isAr
                                    ? 'نقدي'
                                    : 'Cash'}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion 3: حاسبة أرباح التاجر للكرتون */}
                <div
                  className={`rounded-xl overflow-hidden border transition-all duration-200 ${
                    isProfitCalcOpen
                      ? 'border-[#00A046]/60 bg-gradient-to-br from-white via-[#ECFAF2] to-[#D4F2E1] shadow-[0_12px_24px_-5px_rgba(0,160,70,0.32),0_4px_10px_-2px_rgba(15,61,36,0.14)]'
                      : 'border-[#9ADCB6] bg-gradient-to-br from-white via-[#F0FBF4] to-[#DCF5E6] shadow-[0_8px_18px_-4px_rgba(0,160,70,0.24),0_3px_8px_-2px_rgba(15,23,42,0.10)] hover:shadow-[0_12px_24px_-4px_rgba(0,160,70,0.32),0_4px_10px_-2px_rgba(15,23,42,0.13)]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setIsProfitCalcOpen((prev) => !prev)}
                    className="w-full px-3 py-2 flex items-center justify-between gap-2 text-start transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-white/95 border border-[#BFEAD1] shadow-2xs flex items-center justify-center shrink-0">
                        <Calculator className="w-3.5 h-3.5 text-[#00A046]" />
                      </span>
                      <span className="text-[12.5px] sm:text-sm font-bold text-[#111827] truncate">
                        {isAr ? 'حاسبة أرباح التاجر للكرتون' : 'Retailer Profit Calculator'}
                      </span>
                      <span className="w-5 h-5 rounded-full bg-white/90 border border-[#BFEAD1] shadow-2xs flex items-center justify-center shrink-0">
                        {isProfitCalcOpen ? (
                          <ChevronUp className="w-3 h-3 text-[#00A046]" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-[#0F3D24]" />
                        )}
                      </span>
                    </div>
                    <span className="text-[11px] font-black text-[#008A3C] bg-white/90 border border-[#BFEAD1] px-2 py-0.5 rounded-md shadow-2xs font-mono tabular-nums whitespace-nowrap shrink-0">
                      +{formatCurrency(profitPerCarton, currency, language)}
                    </span>
                  </button>

                  {isProfitCalcOpen && (
                    <div className="px-3.5 sm:px-4 pb-4 pt-1">
                      <div className="rounded-2xl bg-[#F6FBF8] border border-[#D4ECDD] p-3.5 sm:p-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div className="bg-white rounded-xl p-3 border border-[#E5E7EB]">
                            <span className="text-[11px] text-[#6B7280] block">
                              {isAr ? 'سعر الجملة (للكرتون)' : 'Wholesale Price'}
                            </span>
                            <div className="text-base font-black text-[#1F2328] font-mono tabular-nums mt-0.5 whitespace-nowrap">
                              {formatCurrency(wholesaleCartonPrice, currency, language)}
                            </div>
                            <span className="text-[11px] text-[#6B7280] block mt-0.5">
                              {isAr
                                ? `${unitsCount} ${unitLabel} · التكلفة: ${formatCurrency(costPerUnit, currency, language)}`
                                : `${unitsCount} ${unitLabel} · Cost: ${formatCurrency(costPerUnit, currency, language)}`}
                            </span>
                          </div>

                          <div className="bg-white rounded-xl p-3 border border-[#00A046]/40">
                            <span className="text-[11px] font-bold text-[#0F3D24] block">
                              {isAr
                                ? `سعر بيع التجزئة للـ${unitLabel}`
                                : `Retail Price / ${unitLabel}`}
                            </span>
                            <div className="flex items-center justify-between gap-1.5 mt-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setCustomRetailUnitPrice((prev) =>
                                    Math.max(stepAmount, (prev || retailUnitPrice) - stepAmount)
                                  )
                                }
                                className="w-7 h-7 rounded-lg bg-[#EFFAF3] hover:bg-[#DCF4E5] text-[#0F3D24] font-black text-sm flex items-center justify-center cursor-pointer shrink-0"
                                aria-label={isAr ? 'تخفيض سعر البيع' : 'Decrease retail price'}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={retailUnitPrice}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  if (!Number.isNaN(val) && val >= 0) {
                                    setCustomRetailUnitPrice(val);
                                  }
                                }}
                                className="w-full text-center text-sm font-black text-[#1F2328] font-mono tabular-nums bg-transparent focus:outline-hidden"
                                step={stepAmount}
                                min={0}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setCustomRetailUnitPrice((prev) => (prev || retailUnitPrice) + stepAmount)
                                }
                                className="w-7 h-7 rounded-lg bg-[#EFFAF3] hover:bg-[#DCF4E5] text-[#0F3D24] font-black text-sm flex items-center justify-center cursor-pointer shrink-0"
                                aria-label={isAr ? 'زيادة سعر البيع' : 'Increase retail price'}
                              >
                                +
                              </button>
                            </div>
                            <span className="text-[10px] text-[#6B7280] block mt-1 text-center">
                              {isAr ? 'عدّل السعر حسب منطقتك' : 'Adjust for your shop'}
                            </span>
                          </div>

                          <div
                            className={`rounded-xl p-3 border ${
                              profitPerCarton >= 0
                                ? 'bg-[#00A046] border-[#00A046] text-white'
                                : 'bg-rose-600 border-rose-600 text-white'
                            }`}
                          >
                            <span className="text-[11px] text-white/85 block font-semibold">
                              {isAr ? 'صافي ربحك في الكرتون' : 'Net Profit / Carton'}
                            </span>
                            <div className="text-lg font-black font-mono tabular-nums mt-0.5 whitespace-nowrap">
                              {profitPerCarton >= 0 ? '+' : ''}
                              {formatCurrency(profitPerCarton, currency, language)}
                            </div>
                            <span className="text-[11px] text-white/90 font-bold block mt-0.5">
                              {isAr
                                ? `هامش ربح ${profitMarginPct}%`
                                : `${profitMarginPct}% margin`}
                              {activeQty > 1
                                ? isAr
                                  ? ` · (${activeQty} كرتون: +${formatCurrency(totalExpectedProfit, currency, language)})`
                                  : ` · (${activeQty}x: +${formatCurrency(totalExpectedProfit, currency, language)})`
                                : ''}
                            </span>
                          </div>
                        </div>

                        <div className="bg-white/90 rounded-xl px-3 py-2 border border-[#D4ECDD] text-xs text-[#0F3D24] flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-[#00A046] shrink-0" />
                          <span>
                            {isAr ? (
                              <>
                                سعر الكرتون <strong className="font-mono tabular-nums">{formatCurrency(wholesaleCartonPrice, currency, language)}</strong> — إذا بعت الـ{unitLabel} بالتجزئة بـ{' '}
                                <strong className="font-mono tabular-nums">{formatCurrency(retailUnitPrice, currency, language)}</strong> تربح في الكرتون{' '}
                                <strong className="text-[#00A046] font-mono tabular-nums">
                                  {profitPerCarton >= 0 ? '+' : ''}
                                  {formatCurrency(profitPerCarton, currency, language)}
                                </strong>
                              </>
                            ) : (
                              <>
                                Buy carton at <strong>{formatCurrency(wholesaleCartonPrice, currency, language)}</strong>, sell each {unitLabel} at{' '}
                                <strong>{formatCurrency(retailUnitPrice, currency, language)}</strong> to earn{' '}
                                <strong className="text-[#00A046]">
                                  +{formatCurrency(profitPerCarton, currency, language)}
                                </strong>{' '}
                                profit per carton.
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion 4: مقارنة الربحية بين منتجات الفئة */}
                {comparisonCandidates.length > 1 && (
                  <div
                    className={`rounded-xl overflow-hidden border transition-all duration-200 ${
                      isProfitCompareOpen
                        ? 'border-amber-400 bg-gradient-to-br from-white via-[#FFF9EB] to-[#FDECC8] shadow-[0_12px_24px_-5px_rgba(217,119,6,0.28),0_4px_10px_-2px_rgba(120,53,15,0.14)]'
                        : 'border-amber-300/80 bg-gradient-to-br from-white via-[#FFFDF4] to-[#FDF1D6] shadow-[0_8px_18px_-4px_rgba(217,119,6,0.22),0_3px_8px_-2px_rgba(15,23,42,0.10)] hover:shadow-[0_12px_24px_-4px_rgba(217,119,6,0.28),0_4px_10px_-2px_rgba(15,23,42,0.13)]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setIsProfitCompareOpen((prev) => !prev)}
                      className="w-full px-3 py-2 flex items-center justify-between gap-2 text-start transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-white/95 border border-amber-200 shadow-2xs flex items-center justify-center shrink-0">
                          <Award className="w-3.5 h-3.5 text-amber-600" />
                        </span>
                        <span className="text-[12.5px] sm:text-sm font-bold text-[#111827] truncate">
                          {isAr ? 'مقارنة الربحية بين منتجات الفئة' : 'Compare Profit Across Category'}
                        </span>
                        <span className="w-5 h-5 rounded-full bg-white/90 border border-amber-200 shadow-2xs flex items-center justify-center shrink-0">
                          {isProfitCompareOpen ? (
                            <ChevronUp className="w-3 h-3 text-amber-700" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-amber-800" />
                          )}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-amber-900 bg-white/90 border border-amber-200 px-2 py-0.5 rounded-md shadow-2xs whitespace-nowrap shrink-0">
                        {isAr ? `${comparisonCandidates.length} أصناف` : `${comparisonCandidates.length} SKUs`}
                      </span>
                    </button>

                    {isProfitCompareOpen && (
                      <div className="px-3.5 sm:px-4 pb-4 pt-1 space-y-2">
                        {comparisonCandidates.map((item) => {
                          const itemTitle =
                            !isAr && item.prod.nameEn
                              ? item.prod.nameEn
                              : getLocalizedText(item.prod.nameAr, language);
                          const isTopEarner = item.pProfit === maxCartonProfit && item.pProfit > 0;

                          return (
                            <div
                              key={item.prod.barcode}
                              onClick={() => {
                                if (!item.isCurrent) handleSwitchProduct(item.prod);
                              }}
                              className={`rounded-xl border p-2.5 sm:p-3 flex items-center justify-between gap-2.5 transition ${
                                item.isCurrent
                                  ? 'border-[#00A046] bg-[#EFFAF3]/60'
                                  : 'border-[#E5E7EB] bg-white hover:border-[#00A046]/60 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-11 h-11 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] overflow-hidden shrink-0 flex items-center justify-center">
                                  {item.prod.imageUrl ? (
                                    <img
                                      src={item.prod.imageUrl}
                                      alt={itemTitle}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Package className="w-5 h-5 text-gray-300" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-bold text-[#1F2328] truncate max-w-[165px] sm:max-w-[260px]">
                                      {itemTitle}
                                    </span>
                                    {item.isCurrent && (
                                      <span className="text-[10px] font-bold text-[#00A046]">
                                        ({isAr ? 'الحالي' : 'Current'})
                                      </span>
                                    )}
                                    {isTopEarner && (
                                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                                        {isAr ? 'أعلى ربح' : 'Top Margin'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[#6B7280] mt-0.5 font-mono tabular-nums">
                                    {isAr
                                      ? `جملة: ${formatCurrency(item.pPrice, currency, language)} · بيع القطعة: ${formatCurrency(item.pRetailUnit, currency, language)}`
                                      : `Wholesale: ${formatCurrency(item.pPrice, currency, language)} · Retail: ${formatCurrency(item.pRetailUnit, currency, language)}`}
                                  </div>
                                </div>
                              </div>

                              <div className="text-end shrink-0">
                                <div className="text-xs sm:text-sm font-black text-[#00A046] font-mono tabular-nums whitespace-nowrap">
                                  +{formatCurrency(item.pProfit, currency, language)}
                                </div>
                                <div className="text-[10px] text-[#6B7280] font-semibold tabular-nums">
                                  {isAr ? `ربح ${item.pMargin}%` : `${item.pMargin}%`}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* 5. Brand Exploration Row */}
          <div className="bg-white mt-2.5 px-4 sm:px-6 py-3.5 border-y border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => {
                if (onExploreBrand) {
                  onExploreBrand(product.brand);
                } else {
                  onClose();
                }
              }}
              className="w-full flex items-center justify-between gap-3 text-start group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#00A046] font-black text-sm shrink-0">
                  {product.brand.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-[#1F2328] text-sm truncate group-hover:text-[#00A046] transition">
                    {product.brand}
                  </div>
                  <div className="text-xs text-[#6B7280]">
                    {isAr
                      ? `استكشف جميع منتجات ${product.brand}`
                      : `Explore all products from ${product.brand}`}
                  </div>
                </div>
              </div>
              <span className="text-[#6B7280] group-hover:text-[#00A046] transition shrink-0">
                {isAr ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </span>
            </button>
          </div>

          {/* 6. Bottom Horizontal Sliders: Elevated Gradient Grounds & Shadowed Cards */}
          {(() => {
            const renderSlideCard = (itemProd: ProductWithOffers) => {
              const itemName =
                !isAr && itemProd.nameEn
                  ? itemProd.nameEn
                  : getLocalizedText(itemProd.nameAr, language);
              const isAdded = addedSimilarBarcode === itemProd.barcode;
              const itemRating = (itemProd.rating || 4.8).toFixed(1);
              const itemUnits = getRetailUnitsInfo(itemProd, isAr);
              const hasValidImage =
                Boolean(itemProd.imageUrl) && !failedSlideImages[itemProd.barcode];

              return (
                <div
                  key={itemProd.barcode}
                  onClick={() => handleSwitchProduct(itemProd)}
                  className="w-[152px] sm:w-[170px] shrink-0 snap-start group rounded-xl border border-white/95 bg-gradient-to-b from-white via-white to-[#F7FAF8] p-2.5 flex flex-col justify-between shadow-[0_6px_16px_-4px_rgba(15,23,42,0.12),0_2px_6px_-1px_rgba(0,160,70,0.08)] hover:border-[#00A046]/60 hover:shadow-[0_10px_22px_-4px_rgba(0,160,70,0.22),0_3px_8px_-1px_rgba(15,23,42,0.10)] transition-all duration-200 cursor-pointer"
                >
                  <div className="aspect-square w-full rounded-lg overflow-hidden mb-2 bg-white p-1.5">
                    {hasValidImage ? (
                      <img
                        src={itemProd.imageUrl}
                        alt={itemName}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedSlideImages((prev) => ({
                            ...prev,
                            [itemProd.barcode]: true
                          }))
                        }
                        className="h-full w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-white">
                        <Package className="w-8 h-8 text-slate-300" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 mb-2">
                    <h4 className="text-xs font-bold text-[#1F2328] line-clamp-2 leading-snug min-h-[32px]">
                      {itemName}
                    </h4>

                    <div className="flex items-center gap-2 text-[11px] text-[#6B7280] tabular-nums">
                      <span className="inline-flex items-center gap-0.5 text-[#1F2328] font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{itemRating}</span>
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <Package className="w-3 h-3 text-[#00A046]" />
                        <span>{itemUnits.count}</span>
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <Truck className="w-3 h-3 text-[#00A046]" />
                        <span>
                          {itemProd.fastestDeliveryDays <= 1
                            ? isAr
                              ? '24س'
                              : '24h'
                            : isAr
                            ? `${itemProd.fastestDeliveryDays}ي`
                            : `${itemProd.fastestDeliveryDays}d`}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-[#EEF2F6]">
                    <span className="text-xs font-black text-[#0F3D24] font-mono tabular-nums whitespace-nowrap">
                      {formatCurrency(itemProd.minPrice, currency, language)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleQuickAddSimilar(e, itemProd)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0 ${
                        isAdded
                          ? 'bg-[#00A046] text-white shadow-xs'
                          : 'border border-[#00A046]/80 text-[#008A3C] bg-[#EFFAF3]/60 hover:bg-[#00A046] hover:text-white'
                      }`}
                    >
                      {isAdded ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>{isAr ? 'أضف' : 'Add'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            };

            return (
              <div className="px-3 sm:px-6 pt-3 pb-4 space-y-3.5">
                {/* 6A. منتجات مشابهة نفس المورد (سلايد بإطار وظل متدرج أخضر) */}
                {activeOffer && sameSupplierProducts.length > 0 && (
                  <div className="rounded-2xl border border-[#B7E4CA] bg-gradient-to-br from-[#F4FCF7] via-white to-[#E2F5EA] p-3 sm:p-4 shadow-[0_12px_26px_-6px_rgba(0,160,70,0.22),0_4px_10px_-2px_rgba(15,23,42,0.09)]">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-7 h-7 rounded-xl bg-white border border-[#BFEAD1] shadow-2xs flex items-center justify-center shrink-0">
                          <Store className="w-3.5 h-3.5 text-[#00A046]" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-xs sm:text-sm font-extrabold text-[#111827] truncate">
                            {isAr ? 'منتجات مشابهة نفس المورد' : 'More from This Supplier'}
                          </h3>
                          <p className="text-[10.5px] font-medium text-[#4B5563] truncate">
                            {getLocalizedText(activeOffer.supplierName, language)}
                          </p>
                        </div>
                      </div>
                      {onOpenSupplierStore && (
                        <button
                          type="button"
                          onClick={() => onOpenSupplierStore(activeOffer)}
                          className="text-[11px] font-bold text-[#008A3C] bg-white/95 border border-[#BFEAD1] px-2.5 py-1 rounded-lg shadow-2xs hover:bg-[#00A046] hover:text-white flex items-center gap-1 transition cursor-pointer shrink-0"
                        >
                          <span>{isAr ? 'صفحة المورد' : 'Storefront'}</span>
                          {isAr ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1.5 pt-0.5 snap-x snap-mandatory">
                      {sameSupplierProducts.map(renderSlideCard)}
                    </div>
                  </div>
                )}

                {/* 6B. أفضل المنتجات في هذه الفئة (سلايد بإطار وظل متدرج ذهبي دافئ) */}
                {categoryTopProducts.length > 0 && (
                  <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-[#FFFDF7] via-white to-[#FCEFD2] p-3 sm:p-4 shadow-[0_12px_26px_-6px_rgba(217,119,6,0.20),0_4px_10px_-2px_rgba(15,23,42,0.09)]">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-7 h-7 rounded-xl bg-white border border-amber-200 shadow-2xs flex items-center justify-center shrink-0">
                          <Award className="w-3.5 h-3.5 text-amber-600" />
                        </span>
                        <h3 className="text-xs sm:text-sm font-extrabold text-[#111827] truncate">
                          {isAr ? 'أفضل المنتجات في هذه الفئة' : 'Best in This Category'}
                        </h3>
                      </div>
                      {onExploreCategory && (
                        <button
                          type="button"
                          onClick={() => onExploreCategory(product.category)}
                          className="text-[11px] font-bold text-amber-900 bg-white/95 border border-amber-200 px-2.5 py-1 rounded-lg shadow-2xs hover:bg-amber-500 hover:text-white flex items-center gap-1 transition cursor-pointer shrink-0"
                        >
                          <span>{isAr ? 'عرض الكل' : 'View all'}</span>
                          {isAr ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1.5 pt-0.5 snap-x snap-mandatory">
                      {categoryTopProducts.map(renderSlideCard)}
                    </div>
                  </div>
                )}

                {/* 6C. منتجات مشابهة (سلايد بإطار وظل متدرج أزرق هادئ) */}
                {similarProducts.length > 0 && (
                  <div className="rounded-2xl border border-sky-200/90 bg-gradient-to-br from-[#F7FBFF] via-white to-[#E5F1FD] p-3 sm:p-4 shadow-[0_12px_26px_-6px_rgba(2,132,199,0.18),0_4px_10px_-2px_rgba(15,23,42,0.09)]">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-7 h-7 rounded-xl bg-white border border-sky-200 shadow-2xs flex items-center justify-center shrink-0">
                          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                        </span>
                        <h3 className="text-xs sm:text-sm font-extrabold text-[#111827] truncate">
                          {isAr ? 'منتجات مشابهة' : 'Similar Products'}
                        </h3>
                      </div>
                      {onExploreCategory && (
                        <button
                          type="button"
                          onClick={() => onExploreCategory(product.category)}
                          className="text-[11px] font-bold text-sky-900 bg-white/95 border border-sky-200 px-2.5 py-1 rounded-lg shadow-2xs hover:bg-sky-600 hover:text-white flex items-center gap-1 transition cursor-pointer shrink-0"
                        >
                          <span>{isAr ? 'عرض الكل' : 'View all'}</span>
                          {isAr ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1.5 pt-0.5 snap-x snap-mandatory">
                      {similarProducts.map(renderSlideCard)}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Sticky Bottom Purchase Bar (price strictly nowrap on single line) */}
        {activeOffer && (
          <div className="sticky bottom-0 z-20 bg-white border-t border-[#E5E7EB] px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2.5 shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
            <div className="min-w-0">
              <div className="text-[11px] text-[#6B7280] truncate">
                {displayUnit} · {getLocalizedText(activeOffer.supplierName, language)}
              </div>
              <div className="flex items-baseline gap-2 flex-nowrap">
                <span className="text-base sm:text-xl font-black text-[#0F3D24] font-mono tabular-nums whitespace-nowrap">
                  {formatCurrency(activeOffer.priceIQD, currency, language)}
                </span>
                {oldPrice && oldPrice > activeOffer.priceIQD && (
                  <span className="text-[11px] sm:text-xs text-[#9CA3AF] line-through font-mono tabular-nums whitespace-nowrap">
                    {formatCurrency(oldPrice, currency, language)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="flex items-center border border-[#E5E7EB] rounded-xl overflow-hidden bg-[#F9FAFB]">
                <button
                  type="button"
                  onClick={() =>
                    handleQuantityChange(
                      activeOffer.id,
                      activeQty - 1,
                      activeOfferMinQty,
                      activeOffer.availableStock
                    )
                  }
                  className="px-2 sm:px-2.5 py-2 text-gray-700 hover:bg-gray-200/70 font-bold text-sm cursor-pointer"
                >
                  -
                </button>
                <span className="w-6 sm:w-8 text-center text-xs font-bold tabular-nums text-[#1F2328]">
                  {activeQty}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleQuantityChange(
                      activeOffer.id,
                      activeQty + 1,
                      activeOfferMinQty,
                      activeOffer.availableStock
                    )
                  }
                  className="px-2 sm:px-2.5 py-2 text-gray-700 hover:bg-gray-200/70 font-bold text-sm cursor-pointer"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddBottomBar}
                disabled={activeOffer.availableStock <= 0}
                className={`px-3.5 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-sm transition cursor-pointer whitespace-nowrap shrink-0 ${
                  addedBottomBar
                    ? 'bg-[#15803D] text-white'
                    : 'bg-[#00A046] hover:bg-[#008a3c] text-white disabled:bg-gray-300'
                }`}
              >
                {addedBottomBar ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isAr ? 'تمت الإضافة' : 'Added'}</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>{isAr ? 'أضف إلى السلة' : 'Add to Cart'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dedicated Fullscreen Photo Gallery Lightbox (Opens when clicking product image) */}
      {isGalleryLightboxOpen && (
        <div
          data-testid="product-photo-gallery-lightbox"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm p-2.5 sm:p-6 font-brand"
          onClick={(e) => {
            e.stopPropagation();
            setIsGalleryLightboxOpen(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-[#E5E7EB] flex flex-col max-h-[94vh]"
          >
            {/* Gallery Top Header */}
            <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between gap-2 bg-white shrink-0">
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-extrabold text-[#111827] truncate">
                  {displayName}
                </div>
                <div className="text-[11px] font-semibold text-[#6B7280] tabular-nums">
                  {activeSlideIndex + 1} / {slides.length} · {slides[activeSlideIndex]?.label}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGalleryLightboxOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#6B7280] transition cursor-pointer shrink-0"
                aria-label={isAr ? 'إغلاق المعرض' : 'Close gallery'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Gallery Image Stage with Stock Status Visual Indicator */}
            <div
              className="relative flex-1 min-h-[280px] sm:min-h-[390px] bg-white flex items-center justify-center p-5 sm:p-8 overflow-hidden select-none"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Visual Stock Availability Indicator (Green / Gray dot) over the gallery photo */}
              <div
                data-testid="gallery-stock-indicator"
                className={`absolute top-3 start-3 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-xs text-xs font-bold backdrop-blur-xs ${
                  isProductInStock
                    ? 'bg-white/95 border-[#BBF7D0] text-[#0F3D24]'
                    : 'bg-white/95 border-gray-200 text-gray-600'
                }`}
              >
                <span
                  data-testid="gallery-stock-dot"
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    isProductInStock
                      ? 'bg-[#00A046] ring-2 ring-[#00A046]/25'
                      : 'bg-gray-400 ring-2 ring-gray-300/60'
                  }`}
                />
                <span>
                  {isProductInStock
                    ? isAr
                      ? 'متوفر حالياً'
                      : 'Currently Available'
                    : isAr
                    ? 'بانتظار التوريد'
                    : 'Awaiting Supply'}
                </span>
              </div>

              {(() => {
                const activeSlide = slides[activeSlideIndex] || slides[0];
                const src = activeSlide?.src || product.imageUrl || '';
                const hasFailed = !src || Boolean(failedSlideImages[`slide-${activeSlideIndex}`]) || imageLoadFailed;
                return !hasFailed ? (
                  <img
                    src={src}
                    alt={`${displayName} — ${activeSlide?.label || ''}`}
                    referrerPolicy="no-referrer"
                    className="max-h-[48vh] sm:max-h-[54vh] max-w-full object-contain rounded-xl"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Package className="w-16 h-16 stroke-1" />
                    <span className="text-xs mt-2 font-medium">{displayName}</span>
                  </div>
                );
              })()}
            </div>

            {/* Thumbnail Preview Strip */}
            {slides.length > 1 && (
              <div className="px-4 py-2 bg-[#FAFDFB] border-t border-[#F1F5F9] flex items-center justify-center gap-2 overflow-x-auto shrink-0">
                {slides.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActiveSlideIndex(idx)}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white p-1 border-2 overflow-hidden transition shrink-0 cursor-pointer ${
                      activeSlideIndex === idx
                        ? 'border-[#00A046] ring-2 ring-[#00A046]/20'
                        : 'border-[#E5E7EB] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={slide.src}
                      alt={slide.label}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Bottom Controls Below Photos: Prev/Next Scroll Buttons, Add to Favorites, Supplier Store & Back Button */}
            <div className="px-3 sm:px-5 py-3 bg-[#F8FAFC] border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2 shrink-0">
              {/* Scroll Prev / Next Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid="gallery-prev-btn"
                  onClick={handlePrevSlide}
                  disabled={slides.length <= 1}
                  className="h-10 px-3 sm:px-4 rounded-xl bg-[#DCFCE7] hover:bg-[#BBF7D0] border border-[#86EFAC] text-[#15803D] font-bold text-xs sm:text-sm flex items-center gap-1 transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  <span>{isAr ? 'السابق' : 'Prev'}</span>
                </button>
                <button
                  type="button"
                  data-testid="gallery-next-btn"
                  onClick={handleNextSlide}
                  disabled={slides.length <= 1}
                  className="h-10 px-3 sm:px-4 rounded-xl bg-[#DCFCE7] hover:bg-[#BBF7D0] border border-[#86EFAC] text-[#15803D] font-bold text-xs sm:text-sm flex items-center gap-1 transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  <span>{isAr ? 'التالي' : 'Next'}</span>
                  {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>

              {/* Favorite + Supplier Store + Back Buttons */}
              <div className="flex items-center flex-wrap sm:flex-nowrap gap-1.5 sm:gap-2">
                <button
                  type="button"
                  data-testid="gallery-favorite-btn"
                  onClick={handleToggleFav}
                  className={`h-10 px-2.5 sm:px-3.5 rounded-xl border font-bold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                    effectiveIsFavorite
                      ? 'bg-[#FFFBEB] border-[#FCD34D] text-[#B45309]'
                      : 'bg-white hover:bg-amber-50 border-[#E5E7EB] text-[#374151]'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 transition shrink-0 ${
                      effectiveIsFavorite ? 'fill-[#FFA300] text-[#FFA300]' : 'text-[#6B7280]'
                    }`}
                  />
                  <span>
                    {effectiveIsFavorite
                      ? isAr
                        ? 'مضاف للمفضلة'
                        : 'Favorited'
                      : isAr
                      ? 'إضافة للمفضلة'
                      : 'Add to Favorites'}
                  </span>
                </button>

                {onOpenSupplierStore && activeOffer && (
                  <button
                    type="button"
                    data-testid="gallery-supplier-store-btn"
                    onClick={() => {
                      setIsGalleryLightboxOpen(false);
                      onOpenSupplierStore(activeOffer);
                    }}
                    title={getLocalizedText(activeOffer.supplierName, language)}
                    className="h-10 px-2.5 sm:px-3.5 rounded-xl bg-[#EFFAF3] hover:bg-[#DCFCE7] border border-[#BFEAD1] text-[#008A3C] font-bold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shadow-2xs"
                  >
                    <Store className="w-4 h-4 shrink-0" />
                    <span>{isAr ? 'متجر المورد' : 'Supplier Store'}</span>
                  </button>
                )}

                <button
                  type="button"
                  data-testid="gallery-back-btn"
                  onClick={() => setIsGalleryLightboxOpen(false)}
                  className="h-10 px-3 sm:px-4 rounded-xl bg-[#0F3D24] hover:bg-[#0B2E1B] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                  <span>{isAr ? 'رجوع' : 'Back'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
