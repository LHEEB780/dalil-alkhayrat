import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  MessageCircle,
  Star,
  Truck,
  Wallet,
  ShieldCheck,
  Zap,
  Search,
  Package,
  Store,
  ShoppingCart,
  Scale,
  Check,
  CheckCircle2,
  Layers,
  Clock,
  SlidersHorizontal,
  Heart
} from 'lucide-react';
import { WholesaleSupplier } from '../data/nearbySuppliers.ts';
import {
  ProductWithOffers,
  SupplierOfferItem,
  Currency,
  Language,
  SupplierReviewSummary
} from '../types/index.ts';
import { formatCurrency } from '../utils/format.ts';
import {
  getLocalizedText,
  getSellerBusinessTypeLabel,
  getVerificationStatusLabel
} from '../utils/translations.ts';
import { SupplierRatingSection } from '../components/SupplierRatingSection.tsx';

interface SupplierStorePageViewProps {
  supplier: WholesaleSupplier;
  products: ProductWithOffers[];
  currency: Currency;
  language: Language;
  storeName?: string;
  onBack: () => void;
  onAddToCart: (product: ProductWithOffers, offer: SupplierOfferItem, quantity: number) => void;
  onCompareOffers: (product: ProductWithOffers) => void;
  isFavoriteSupplier?: boolean;
  onToggleFavoriteSupplier?: (supplierId: string) => void;
}

export const SupplierStorePageView: React.FC<SupplierStorePageViewProps> = ({
  supplier,
  products,
  currency,
  language,
  storeName,
  onBack,
  onAddToCart,
  onCompareOffers,
  isFavoriteSupplier = false,
  onToggleFavoriteSupplier
}) => {
  const isAr = language === 'ar';

  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [selectedBrand, setSelectedBrand] = useState<string>('الكل');
  const [sortBy, setSortBy] = useState<'default' | 'cheapest' | 'top_rated'>('default');
  const [addedBarcode, setAddedBarcode] = useState<string | null>(null);
  const [vanModalOpen, setVanModalOpen] = useState(false);
  const [vanConfirmed, setVanConfirmed] = useState(false);
  const [liveReviewSummary, setLiveReviewSummary] = useState<SupplierReviewSummary | null>(null);

  const isExpress24h = useMemo(() => {
    const text = (supplier.deliveryTimeAr + ' ' + supplier.deliveryTimeEn).toLowerCase();
    return (
      text.includes('دقيقة') ||
      text.includes('ساعة') ||
      text.includes('ساعات') ||
      text.includes('ساعتان') ||
      text.includes('اليوم') ||
      text.includes('min') ||
      text.includes('hour') ||
      text.includes('same-day') ||
      (supplier.activeVansCount >= 3 && supplier.distanceKm <= 5)
    );
  }, [supplier]);

  // Resolve backend supplier mapping so every wholesale store has real, valid cart-ready offers
  const supplierProducts = useMemo(() => {
    const mappedIds: Record<string, string[]> = {
      supp_rafidain: ['supp_rafidain'],
      supp_tigris: ['supp_dijla', 'supp_rafidain'],
      supp_jamila: ['supp_baghdad_hub', 'supp_rafidain'],
      supp_nahrain: ['supp_dijla', 'supp_rafidain'],
      supp_babylon: ['supp_rafidain', 'supp_baghdad_hub'],
      supp_baghdad_canned: ['supp_baghdad_hub', 'supp_dijla']
    };

    const candidateSupplierIds = mappedIds[supplier.id] || ['supp_rafidain'];

    // Specialty keywords matching for stores with focused catalogs
    const specialtyCategoryHints: Record<string, string[]> = {
      supp_nahrain: ['قهوة', 'شاي', 'مشروبات', 'سكر'],
      supp_babylon: ['زيوت', 'سمن', 'معلبات', 'أرز'],
      supp_baghdad_canned: ['معلبات', 'مكرونة', 'ألبان'],
      supp_tigris: ['ألبان', 'معلبات', 'مكرونة', 'مشروبات', 'شاي'],
      supp_jamila: ['أرز', 'حبوب', 'سكر', 'زيوت'],
      supp_rafidain: []
    };

    const hints = specialtyCategoryHints[supplier.id] || [];

    const matched = products
      .map((p) => {
        // Prefer direct match, then mapped candidate, then first offer
        const directOffer = p.offers.find((o) => o.supplierId === supplier.id);
        const mappedOffer = p.offers.find((o) => candidateSupplierIds.includes(o.supplierId));
        const activeOffer = directOffer || mappedOffer || p.offers[0];
        if (!activeOffer) return null;

        const matchesSpecialty =
          hints.length === 0 ||
          hints.some(
            (h) =>
              p.category.includes(h) ||
              (p.subCategory && p.subCategory.includes(h)) ||
              p.nameAr.includes(h)
          );

        return {
          product: p,
          offer: activeOffer,
          isDirect: Boolean(directOffer),
          matchesSpecialty
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // Put direct offers first when the supplier has direct catalog entries; otherwise highlight specialty matches
    const directMatches = matched.filter((m) => m.isDirect);
    if (directMatches.length >= 3) {
      return directMatches;
    }
    const prioritized = matched.filter((m) => m.isDirect || m.matchesSpecialty);
    return prioritized.length >= 3 ? prioritized : matched;
  }, [products, supplier.id]);

  // Categories inside this store
  const storeCategories = useMemo(() => {
    const set = new Set<string>();
    supplierProducts.forEach((item) => {
      if (item.product.category) set.add(item.product.category);
    });
    return ['الكل', ...Array.from(set)];
  }, [supplierProducts]);

  // Filtered products inside the supplier store
  const filteredStoreProducts = useMemo(() => {
    let list = [...supplierProducts];

    if (selectedCategory !== 'الكل') {
      list = list.filter((item) => item.product.category === selectedCategory);
    }

    if (selectedBrand !== 'الكل') {
      list = list.filter(
        (item) =>
          item.product.brand.includes(selectedBrand) ||
          item.product.nameAr.includes(selectedBrand) ||
          selectedBrand.includes(item.product.brand)
      );
    }

    if (storeSearchQuery.trim()) {
      const q = storeSearchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.product.nameAr.toLowerCase().includes(q) ||
          (item.product.nameEn || '').toLowerCase().includes(q) ||
          item.product.brand.toLowerCase().includes(q) ||
          item.product.barcode.includes(q)
      );
    }

    if (sortBy === 'cheapest') {
      list.sort((a, b) => a.offer.priceIQD - b.offer.priceIQD);
    } else if (sortBy === 'top_rated') {
      list.sort((a, b) => (b.product.rating || 4.8) - (a.product.rating || 4.8));
    }

    return list;
  }, [supplierProducts, selectedCategory, selectedBrand, storeSearchQuery, sortBy]);

  const handleQuickAdd = (product: ProductWithOffers, offer: SupplierOfferItem) => {
    onAddToCart(product, offer, offer.minOrderQuantity || 1);
    setAddedBarcode(product.barcode);
    setTimeout(() => {
      setAddedBarcode((prev) => (prev === product.barcode ? null : prev));
    }, 1800);
  };

  return (
    <div className="space-y-5 font-brand pb-12">
      {/* Top Back & Breadcrumb Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-[#E5E7EB] px-4 py-3 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#0B5D32] hover:bg-[#084726] text-white text-xs font-black transition shadow-2xs cursor-pointer shrink-0 whitespace-nowrap"
          >
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{isAr ? 'رجوع' : 'Back'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#6B7280] truncate">
            <span>{isAr ? 'سوق الجملة' : 'Marketplace'}</span>
            <span>/</span>
            <span>{isAr ? 'متاجر الموردين' : 'Supplier Stores'}</span>
            <span>/</span>
            <span className="font-bold text-[#1F2328] truncate">
              {isAr ? supplier.nameAr : supplier.nameEn}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#00A046] font-bold">
          {onToggleFavoriteSupplier && (
            <button
              type="button"
              onClick={() => onToggleFavoriteSupplier(supplier.id)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                isFavoriteSupplier
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-[#F8FAFC] border-[#E5E7EB] text-[#6B7280] hover:border-amber-300 hover:text-amber-700'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavoriteSupplier ? 'fill-[#FFA300] text-[#FFA300]' : ''}`} />
              <span>{isFavoriteSupplier ? (isAr ? 'مورد مفضل' : 'Saved') : (isAr ? 'حفظ للمفضلة' : 'Save')}</span>
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'متجر جملة معتمد B2B' : 'Verified B2B Store'}</span>
          </div>
        </div>
      </div>

      {/* Storefront Hero Card: Clean Cover Photo -> Identity -> Info Row -> Action Buttons Row */}
      <div className="bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-sm">
        {/* 1. Pure Clean Cover Image (No cluttered overlays or buttons) */}
        <div className="relative h-40 sm:h-56 w-full bg-slate-900 overflow-hidden">
          <img
            src={supplier.storeImageUrl || supplier.logoUrl}
            alt={isAr ? supplier.nameAr : supplier.nameEn}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* 2. Store Identity Header (Logo + Verified Name + Location) */}
        <div className="p-4 sm:px-6 sm:pt-5 sm:pb-4 border-b border-[#F0F2F5] bg-white">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-white p-1 border border-[#E5E7EB] shadow-xs overflow-hidden shrink-0">
              <img
                src={supplier.logoUrl || supplier.storeImageUrl}
                alt={isAr ? supplier.nameAr : supplier.nameEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#00A046] mb-0.5">
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {supplier.category || (isAr ? 'تجارة وتوزيع المواد الغذائية' : 'Wholesale Food Supply')}
                </span>
              </div>

              <h1 className="text-base sm:text-xl font-black text-[#1F2328] leading-snug">
                {isAr ? supplier.nameAr : supplier.nameEn}
              </h1>

              <p className="text-xs text-[#6B7280] flex items-start sm:items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#00A046] shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  {isAr
                    ? `${supplier.districtAr} • ${supplier.addressAr}`
                    : `${supplier.districtEn} • ${supplier.addressEn}`}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* 3. Row 1: Informational Badges & Commercial Metrics (Read-Only Info Row) */}
        <div className="bg-[#F8FAFC] border-b border-[#E5E7EB] p-3.5 sm:px-6 sm:py-4 space-y-3">
          {/* Informational Status Strip */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 bg-white border border-[#E5E7EB] text-[#1F2328] px-3 py-1.5 rounded-xl text-[11px] font-bold">
              <MapPin className="w-3.5 h-3.5 text-[#00A046]" />
              <span>
                {supplier.distanceKm} {isAr ? 'كم عن متجرك' : 'km away'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                document.getElementById('supplier-reviews-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 bg-white hover:border-[#0B5D32] border border-[#E5E7EB] text-[#1F2328] px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer"
              title={isAr ? 'عرض وتقييم المورد' : 'View & rate supplier'}
            >
              <Star className="w-3.5 h-3.5 fill-[#FFE600] text-[#FFE600]" />
              <span>{liveReviewSummary ? liveReviewSummary.averageRating.toFixed(1) : supplier.rating}</span>
              <span className="text-[#6B7280] font-semibold">
                ({liveReviewSummary ? liveReviewSummary.reviewsCount : supplier.reviewsCount}{' '}
                {isAr ? 'تقييم تجار' : 'reviews'})
              </span>
              <span className="text-[#0B5D32] font-black underline decoration-dotted">
                {isAr ? '• قيّم المورد' : '• Rate'}
              </span>
            </button>

            {isExpress24h && (
              <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-xl text-[11px] font-black">
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-current" />
                <span>{isAr ? 'توصيل سريع < 24 ساعة' : 'Express < 24h'}</span>
              </div>
            )}

            <div className="inline-flex items-center gap-1.5 bg-white border border-[#E5E7EB] text-[#1F2328] px-3 py-1.5 rounded-xl text-[11px] font-bold">
              <Building2 className="w-3.5 h-3.5 text-[#00A046]" />
              <span>{getSellerBusinessTypeLabel(supplier.businessType, language)}</span>
            </div>

            <div
              className={`inline-flex items-center gap-1.5 border px-3 py-1.5 rounded-xl text-[11px] font-bold ${
                (supplier.verificationStatus || (supplier.isVerified ? 'verified' : 'pending')) === 'pending'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-[#00A046]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{getVerificationStatusLabel(supplier.verificationStatus, supplier.isVerified, language)}</span>
            </div>
          </div>

          {/* Commercial Terms Info Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-2.5 sm:p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#00A046] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#6B7280] block">{isAr ? 'سرعة التوصيل' : 'Delivery Speed'}</span>
                <span className="text-xs font-black text-[#1F2328] truncate block">
                  {isAr ? supplier.deliveryTimeAr : supplier.deliveryTimeEn}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] p-2.5 sm:p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#6B7280] block">{isAr ? 'الحد الأدنى للطلب' : 'Minimum Order'}</span>
                <span className="text-xs font-black text-[#1F2328] font-mono tabular-nums block truncate">
                  {formatCurrency(supplier.minOrderIQD, currency, language)}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] p-2.5 sm:p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#6B7280] block">{isAr ? 'تسهيلات الائتمان' : 'Credit Terms'}</span>
                <span className="text-xs font-black text-[#00A046] truncate block">
                  {isAr ? supplier.creditTermsAr : supplier.creditTermsEn}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] p-2.5 sm:p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#00A046] flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#6B7280] block">{isAr ? 'أسطول الفانات النشط' : 'Active Van Fleet'}</span>
                <span className="text-xs font-black text-[#1F2328] block truncate">
                  {supplier.activeVansCount} {isAr ? 'فانات في منطقتك' : 'Active Vans'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Row 2: Cohesive Interactive Action Bar */}
        <div className="p-3 sm:px-6 sm:py-4 bg-white">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
            {/* Call Warehouse */}
            <a
              href={`tel:${supplier.phone}`}
              className="group flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl border border-[#DCE5DC] bg-[#F8FAFC] hover:bg-white hover:border-[#00A046] hover:shadow-xs transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#EBF4EE] text-[#00A046] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0 text-start">
                  <span className="text-[11.5px] sm:text-xs font-black text-[#1F2328] block leading-tight whitespace-nowrap truncate">
                    {isAr ? 'اتصال بالمستودع' : 'Call Warehouse'}
                  </span>
                  <span className="text-[10px] text-[#6B7280] font-mono mt-0.5 block truncate" dir="ltr">
                    {supplier.phone}
                  </span>
                </div>
              </div>
              {isAr ? (
                <ArrowLeft className="hidden md:block w-4 h-4 text-gray-400 group-hover:text-[#00A046] group-hover:-translate-x-0.5 transition shrink-0" />
              ) : (
                <ArrowRight className="hidden md:block w-4 h-4 text-gray-400 group-hover:text-[#00A046] group-hover:translate-x-0.5 transition shrink-0" />
              )}
            </a>

            {/* WhatsApp Sales */}
            <a
              href={`https://wa.me/${supplier.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                isAr
                  ? `السلام عليكم، نتواصل معكم من تطبيق دليل الخيرات للاستفسار عن طلبيات الجملة من ${supplier.nameAr}`
                  : `Hello, contacting you from Dalil Al-Khairat regarding wholesale orders`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl border border-[#B7DFC4] bg-[#EBF4EE] hover:bg-[#DFF0E5] hover:border-[#00A046] hover:shadow-xs transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#00A046] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0 text-start">
                  <span className="text-[11.5px] sm:text-xs font-black text-[#0B5D32] block leading-tight whitespace-nowrap truncate">
                    {isAr ? 'واتساب المبيعات' : 'WhatsApp Sales'}
                  </span>
                  <span className="text-[10px] text-[#3D5244] font-semibold mt-0.5 block truncate">
                    {isAr ? 'مراسلة فورية' : 'Instant chat'}
                  </span>
                </div>
              </div>
              {isAr ? (
                <ArrowLeft className="hidden md:block w-4 h-4 text-[#0B5D32]/70 group-hover:-translate-x-0.5 transition shrink-0" />
              ) : (
                <ArrowRight className="hidden md:block w-4 h-4 text-[#0B5D32]/70 group-hover:translate-x-0.5 transition shrink-0" />
              )}
            </a>

            {/* Request Delivery Van (Primary CTA) */}
            <button
              type="button"
              onClick={() => {
                setVanConfirmed(false);
                setVanModalOpen(true);
              }}
              className="col-span-2 md:col-span-1 group flex items-center justify-between gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-[#0B5D32] hover:bg-[#084726] text-white shadow-xs hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FFE600] text-[#142018] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="min-w-0 text-start">
                  <span className="text-xs font-black text-white block leading-tight whitespace-nowrap truncate">
                    {isAr ? 'طلب فان توزيع' : 'Request Delivery Van'}
                  </span>
                  <span className="text-[10.5px] text-emerald-100 font-semibold mt-0.5 block truncate">
                    {isAr ? 'توجيه مباشر لمحلك الآن' : 'Direct dispatch to your store'}
                  </span>
                </div>
              </div>
              {isAr ? (
                <ArrowLeft className="w-4 h-4 text-[#FFE600] group-hover:-translate-x-0.5 transition shrink-0" />
              ) : (
                <ArrowRight className="w-4 h-4 text-[#FFE600] group-hover:translate-x-0.5 transition shrink-0" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Store Specialties & Authorized Brands Filter */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-[#1F2328] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00A046]" />
              <span>{isAr ? 'الوكالات والعلامات التجارية المتوفرة في المتجر' : 'Authorized Brands in This Store'}</span>
            </h2>
            <p className="text-[11px] text-[#6B7280] mt-0.5">
              {isAr ? `التخصص: ${supplier.specialtiesAr}` : `Specialties: ${supplier.specialtiesEn}`}
            </p>
          </div>

          {/* In-Store Search Input */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={storeSearchQuery}
              onChange={(e) => setStoreSearchQuery(e.target.value)}
              placeholder={isAr ? `ابحث داخل متجر ${supplier.nameAr}...` : 'Search inside this store...'}
              className={`w-full bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl py-2 ${
                isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
              } text-xs text-[#1F2328] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00A046]`}
            />
            <Search className={`w-4 h-4 text-gray-400 absolute ${isAr ? 'right-3' : 'left-3'} top-2.5`} />
          </div>
        </div>

        {/* Brand Agencies Filter Row */}
        {supplier.brandsDistributed && supplier.brandsDistributed.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
            <button
              type="button"
              onClick={() => setSelectedBrand('الكل')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedBrand === 'الكل'
                  ? 'bg-[#221F1F] text-white'
                  : 'bg-[#F5F5F5] text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isAr ? 'كل الوكالات' : 'All Brands'}
            </button>
            {supplier.brandsDistributed.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => setSelectedBrand((prev) => (prev === brand ? 'الكل' : brand))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedBrand === brand
                    ? 'bg-[#00A046] text-white shadow-xs'
                    : 'bg-[#F5F5F5] text-gray-700 hover:bg-emerald-50 hover:text-[#00A046]'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        )}

        {/* Categories Tabs & Sort Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#F0F2F5]">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {storeCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-[#00A046] to-[#007B33] text-white shadow-2xs'
                    : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:border-[#00A046]/50'
                }`}
              >
                {cat === 'الكل' ? (isAr ? 'جميع الأقسام' : 'All Categories') : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#1F2328] cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-[#00A046]"
            >
              <option value="default">{isAr ? 'الترتيب الافتراضي' : 'Default Order'}</option>
              <option value="cheapest">{isAr ? 'الأقل سعراً بالجملة' : 'Lowest Price'}</option>
              <option value="top_rated">{isAr ? 'الأعلى تقييماً' : 'Top Rated'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Store Wholesale Products Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm sm:text-base font-black text-[#1F2328] flex items-center gap-2">
            <Store className="w-4.5 h-4.5 text-[#00A046]" />
            <span>
              {isAr
                ? `بضائع ومنتجات ${supplier.nameAr} (${filteredStoreProducts.length} صنف)`
                : `${supplier.nameEn} Catalog (${filteredStoreProducts.length} items)`}
            </span>
          </h3>
        </div>

        {filteredStoreProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center space-y-2.5">
            <Package className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-[#1F2328]">
              {isAr ? 'لا توجد منتجات مطابقة لبحثك داخل هذا المتجر' : 'No matching products in this store'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('الكل');
                setSelectedBrand('الكل');
                setStoreSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-[#00A046] text-white text-xs font-bold cursor-pointer"
            >
              {isAr ? 'عرض جميع بضائع المتجر' : 'Reset Store Filters'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredStoreProducts.map(({ product, offer }) => {
              const displayName = !isAr && product.nameEn
                ? product.nameEn
                : getLocalizedText(product.nameAr, language);
              const isAdded = addedBarcode === product.barcode;

              return (
                <div
                  key={product.barcode}
                  className="bg-white rounded-2xl border border-[#E5E7EB] hover:border-[#00A046] hover:shadow-md transition-all p-3 flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Category & Compare */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] font-bold text-[#6B7280] truncate">
                        {product.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => onCompareOffers(product)}
                        className="p-1 text-gray-400 hover:text-[#00A046] rounded-md transition cursor-pointer"
                        title={isAr ? 'مقارنة مع بقية الموردين' : 'Compare with other suppliers'}
                      >
                        <Scale className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Product Image */}
                    <div
                      onClick={() => onCompareOffers(product)}
                      className="aspect-square w-full bg-white rounded-xl flex items-center justify-center p-2 mb-2.5 cursor-pointer overflow-hidden"
                    >
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={displayName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <Package className="w-10 h-10 text-gray-300" />
                      )}
                    </div>

                    {/* Title & Brand */}
                    <h4
                      onClick={() => onCompareOffers(product)}
                      className="text-xs sm:text-[13px] font-bold text-[#1F2328] group-hover:text-[#00A046] line-clamp-2 min-h-[34px] cursor-pointer transition-colors"
                    >
                      {displayName}
                    </h4>

                    <div className="text-[11px] text-[#6B7280] mt-1 flex items-center justify-between">
                      <span className="truncate">{getLocalizedText(product.unit, language)}</span>
                      <span className="font-mono text-[10px] text-emerald-700 font-bold shrink-0">
                        {isAr ? `متاح: ${offer.availableStock}` : `Stock: ${offer.availableStock}`}
                      </span>
                    </div>
                  </div>

                  {/* Offer Pricing & Add to Cart */}
                  <div className="mt-3 pt-2.5 border-t border-[#F3F4F6] space-y-2">
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        {product.oldPrice && product.oldPrice > offer.priceIQD && (
                          <span className="text-[10px] text-gray-400 line-through font-mono block leading-none mb-0.5">
                            {formatCurrency(product.oldPrice, currency, language)}
                          </span>
                        )}
                        <span className="text-base font-black text-[#00A046] font-mono tabular-nums leading-none">
                          {formatCurrency(offer.priceIQD, currency, language)}
                        </span>
                      </div>

                      <span className="text-[10px] text-[#6B7280] font-semibold">
                        {isAr ? `أدنى طلب: ${offer.minOrderQuantity}` : `Min: ${offer.minOrderQuantity}`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleQuickAdd(product, offer)}
                      disabled={offer.availableStock <= 0}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer ${
                        isAdded
                          ? 'bg-emerald-800 text-white'
                          : 'bg-gradient-to-r from-[#00A046] to-[#008239] hover:from-[#008f3e] hover:to-[#006d2f] text-white disabled:bg-gray-300'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>{isAr ? 'تمت الإضافة للسلة' : 'Added to Cart'}</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>{isAr ? 'أضف لسلة الجملة' : 'Add to Cart'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Supermarket Reviews & Quality/Service Rating Section */}
      <SupplierRatingSection
        supplierId={supplier.id}
        supplierName={isAr ? supplier.nameAr : supplier.nameEn}
        storeName={storeName}
        language={language}
        onSummaryUpdated={setLiveReviewSummary}
      />

      {/* Instant Van Dispatch Modal */}
      {vanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#00A046] flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-[#1F2328]">
                  {isAr ? 'طلب فان توزيع مباشر لمتجرك' : 'Request Instant Delivery Van'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVanModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {vanConfirmed ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-[#00A046] mx-auto" />
                <p className="text-sm font-black text-[#1F2328]">
                  {isAr ? 'تم إرسال طلب توجيه الفان بنجاح!' : 'Van Dispatch Request Sent!'}
                </p>
                <p className="text-xs text-gray-600">
                  {isAr
                    ? `سيتواصل معك مندوب ${supplier.nameAr} خلال دقائق لتأكيد الحمولة وموعد الوصول.`
                    : `A representative from ${supplier.nameEn} will contact you shortly.`}
                </p>
                <button
                  type="button"
                  onClick={() => setVanModalOpen(false)}
                  className="mt-2 px-5 py-2 bg-[#00A046] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {isAr ? 'حسناً' : 'Done'}
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {isAr
                    ? `سيتم توجيه أقرب فان توزيع تابع لـ "${supplier.nameAr}" إلى موقع متجرك لتجهيز طلبيات الجملة الفورية.`
                    : `Dispatch the nearest active distribution van from ${supplier.nameEn} directly to your supermarket.`}
                </p>
                <div className="bg-[#F8F9FA] rounded-xl p-3 space-y-1.5 text-xs border border-gray-100">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{isAr ? 'وقت الوصول المتوقع:' : 'Estimated Arrival:'}</span>
                    <span className="font-bold text-[#1F2328]">{isAr ? supplier.deliveryTimeAr : supplier.deliveryTimeEn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{isAr ? 'رقم منسق الفان:' : 'Coordinator:'}</span>
                    <span className="font-mono font-bold text-[#00A046]">{supplier.phone}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setVanConfirmed(true)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#00A046] to-[#007B33] text-white text-xs font-black cursor-pointer"
                  >
                    {isAr ? 'تأكيد إرسال الفان' : 'Confirm Van Dispatch'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVanModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
