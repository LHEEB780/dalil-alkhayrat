import React, { useState, useMemo, useEffect } from 'react';
import {
  MapPin,
  Search,
  Star,
  Truck,
  ShieldCheck,
  CreditCard,
  Clock,
  Phone,
  ShoppingBag,
  Zap,
  Building2,
  CheckCircle2,
  Filter,
  BadgeCheck,
  Layers,
  Heart,
  X,
  Check
} from 'lucide-react';
import {
  WholesaleSupplier,
  WHOLESALE_SUPPLIERS,
  BAGHDAD_DISTRICTS,
  StoreDistrict,
  calculateDistanceKm
} from '../data/nearbySuppliers.ts';
import { Language, Currency, SupplierReviewSummary } from '../types/index.ts';
import { formatCurrency } from '../utils/format.ts';
import { fetchWithRetry } from '../utils/fetchWithRetry.ts';
import { SupplierRatingModal } from '../components/SupplierRatingSection.tsx';

interface SuppliersDirectoryViewProps {
  language: Language;
  currency: Currency;
  storeName?: string;
  onBrowseSupplierProducts: (supplierName: string) => void;
  onOpenSupplierStore?: (supplier: WholesaleSupplier) => void;
  currentDistrict?: StoreDistrict;
  onSelectDistrict?: (district: StoreDistrict) => void;
  favoriteSupplierIds?: string[];
  onToggleFavoriteSupplier?: (supplierId: string) => void;
}

export const SuppliersDirectoryView: React.FC<SuppliersDirectoryViewProps> = ({
  language,
  currency,
  storeName,
  onBrowseSupplierProducts,
  onOpenSupplierStore,
  currentDistrict: propDistrict,
  onSelectDistrict,
  favoriteSupplierIds = [],
  onToggleFavoriteSupplier
}) => {
  const isAr = language === 'ar';

  // Synced with App's currentDistrict if passed, otherwise local fallback
  const [localDistrict, setLocalDistrict] = useState<StoreDistrict>(BAGHDAD_DISTRICTS[0]);
  const currentDistrict = propDistrict || localDistrict;
  const [isDistrictPickerOpen, setIsDistrictPickerOpen] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('الكل');
  const [onlyInstantVans, setOnlyInstantVans] = useState(false);
  const [onlyCredit, setOnlyCredit] = useState(false);
  const [onlySmartShipping, setOnlySmartShipping] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'min_order' | 'vans'>('distance');

  // Quick van dispatch modal, rating modal & inline toast
  const [vanRequestedSupplier, setVanRequestedSupplier] = useState<WholesaleSupplier | null>(null);
  const [ratingSupplier, setRatingSupplier] = useState<WholesaleSupplier | null>(null);
  const [reviewSummaries, setReviewSummaries] = useState<Record<string, SupplierReviewSummary>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchWithRetry('/api/suppliers/reviews/summary', { retries: 2 })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setReviewSummaries(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const handleChooseDistrict = (dist: StoreDistrict) => {
    if (onSelectDistrict) {
      onSelectDistrict(dist);
    } else {
      setLocalDistrict(dist);
    }
    setIsDistrictPickerOpen(false);
    showToast(
      isAr
        ? `تم تحديث موقع المتجر إلى ${dist.nameAr} وإعادة حساب المسافات`
        : `Store location updated to ${dist.nameEn}`
    );
  };

  // Categories list
  const categories = [
    { id: 'الكل', label: isAr ? 'جميع التخصصات' : 'All Specialties' },
    { id: 'ألبان وأجبان تبريد', label: isAr ? 'ألبان وأجبان تبريد' : 'Dairy & Chilled' },
    { id: 'أرز وحبوب', label: isAr ? 'أرز وحبوب وبقوليات' : 'Rice & Grains' },
    { id: 'زيوت ودهون', label: isAr ? 'زيوت ودهون وسمنة' : 'Cooking Oils & Ghee' },
    { id: 'قهوة وشاي', label: isAr ? 'قهوة وشاي وبن' : 'Coffee & Tea' },
    { id: 'معلبات ومؤن', label: isAr ? 'معلبات ومؤن غذائية' : 'Canned & Provisions' }
  ];

  // Dynamically calculate distances & blend live review summaries
  const suppliersWithLiveDistances = useMemo(() => {
    return WHOLESALE_SUPPLIERS.map((supp) => {
      const liveDistance = calculateDistanceKm(
        currentDistrict.lat,
        currentDistrict.lng,
        supp.lat,
        supp.lng
      );
      const summary = reviewSummaries[supp.id];
      return {
        ...supp,
        distanceKm: liveDistance,
        rating: summary ? summary.averageRating : supp.rating,
        reviewsCount: summary ? summary.reviewsCount : supp.reviewsCount
      };
    });
  }, [currentDistrict, reviewSummaries]);

  const totalActiveVans = useMemo(
    () => suppliersWithLiveDistances.reduce((sum, s) => sum + s.activeVansCount, 0),
    [suppliersWithLiveDistances]
  );

  // Filtered & Sorted Suppliers
  const filteredSuppliers = useMemo(() => {
    const result = suppliersWithLiveDistances.filter((supplier) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName =
          supplier.nameAr.toLowerCase().includes(q) || supplier.nameEn.toLowerCase().includes(q);
        const matchesDistrict =
          supplier.districtAr.toLowerCase().includes(q) ||
          supplier.districtEn.toLowerCase().includes(q);
        const matchesSpecialties =
          supplier.specialtiesAr.toLowerCase().includes(q) ||
          supplier.specialtiesEn.toLowerCase().includes(q);
        const matchesBrands = supplier.brandsDistributed?.some((b) =>
          b.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesDistrict && !matchesSpecialties && !matchesBrands) {
          return false;
        }
      }

      if (selectedCategory !== 'الكل' && supplier.category !== selectedCategory) {
        return false;
      }

      if (selectedDistrict !== 'الكل' && !supplier.districtAr.includes(selectedDistrict)) {
        return false;
      }

      if (onlyInstantVans && supplier.activeVansCount < 4) {
        return false;
      }
      if (onlyCredit && !supplier.creditTermsAr.includes('ائتمان')) {
        return false;
      }
      if (onlySmartShipping && !supplier.hasSmartShipping) {
        return false;
      }
      if (onlyFavorites && !favoriteSupplierIds.includes(supplier.id)) {
        return false;
      }

      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'distance') return a.distanceKm - b.distanceKm;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'min_order') return a.minOrderIQD - b.minOrderIQD;
      if (sortBy === 'vans') return b.activeVansCount - a.activeVansCount;
      return 0;
    });

    return result;
  }, [
    suppliersWithLiveDistances,
    searchQuery,
    selectedCategory,
    selectedDistrict,
    onlyInstantVans,
    onlyCredit,
    onlySmartShipping,
    onlyFavorites,
    favoriteSupplierIds,
    sortBy
  ]);

  const hasActiveFilters =
    selectedCategory !== 'الكل' ||
    selectedDistrict !== 'الكل' ||
    searchQuery.trim() !== '' ||
    onlyInstantVans ||
    onlyCredit ||
    onlySmartShipping ||
    onlyFavorites;

  return (
    <div className="bg-[#F4F4EA] rounded-3xl border border-[#E2E6D7] p-3 sm:p-5 space-y-4 font-brand text-[#142018] pb-16">
      {/* Inline Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#0B5D32] text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 border border-white/20">
          <CheckCircle2 className="w-4 h-4 text-[#FDE047] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= TOP WORKSPACE HEADER (POS Cashier Style) ================= */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#0B5D32] text-white flex items-center justify-center shadow-2xs shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-[#0B5D32] leading-tight">
                {isAr ? 'دليل شركات وموردي الجملة' : 'Wholesale Suppliers Directory'}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#EBF4EE] border border-[#DCE5DC] text-[#0B5D32] text-[10px] font-black whitespace-nowrap">
                {isAr ? 'شبكة B2B المعتمدة' : 'Verified B2B'}
              </span>
            </div>
            <p className="text-[11px] text-[#5F7164] truncate mt-0.5">
              {isAr
                ? 'وكالات معتمدة، شروط الائتمان، وطلب فانات التوزيع الفوري حسب المسافة عن متجرك'
                : 'Authorized agencies, credit terms, and instant cash van dispatch near your store'}
            </p>
          </div>
        </div>

        {/* Store Location Switcher Pill */}
        <div className="bg-white border border-[#DCE5DC] rounded-2xl px-3 py-2 flex items-center justify-between gap-3 shrink-0 shadow-[0_1px_4px_rgba(11,93,50,0.04)]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#EBF4EE] text-[#0B5D32] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-[#5F7164]">
                {isAr ? 'موقع متجرك الحالي' : 'Current Store Location'}
              </div>
              <div className="text-xs font-black text-[#142018] truncate">
                {isAr ? currentDistrict.nameAr : currentDistrict.nameEn}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDistrictPickerOpen(true)}
            className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white text-xs font-black transition cursor-pointer whitespace-nowrap shrink-0"
          >
            {isAr ? 'تغيير' : 'Change'}
          </button>
        </div>
      </header>

      {/* ================= COMPACT NETWORK SUMMARY BAR ================= */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#EBF4EE] text-[#0B5D32] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-[#5F7164] truncate">
              {isAr ? 'الشركات المعتمدة' : 'Verified'}
            </div>
            <div className="text-sm font-black text-[#142018] tabular-nums">
              {suppliersWithLiveDistances.length} {isAr ? 'مورد' : 'vendors'}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-[#5F7164] truncate">
              {isAr ? 'فانات نشطة الآن' : 'Active Vans'}
            </div>
            <div className="text-sm font-black text-[#142018] tabular-nums">
              {totalActiveVans} {isAr ? 'فان' : 'vans'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOnlyFavorites((prev) => !prev)}
          className={`rounded-2xl border p-3 flex items-center gap-2.5 text-start transition cursor-pointer ${
            onlyFavorites
              ? 'bg-[#0B5D32] border-[#0B5D32] text-white'
              : 'bg-white border-[#DCE5DC] hover:border-[#0B5D32]'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              onlyFavorites ? 'bg-white/15 text-[#FDE047]' : 'bg-[#FDF2F2] text-[#E11D48]'
            }`}
          >
            <Heart className={`w-4 h-4 ${onlyFavorites ? 'fill-current' : ''}`} />
          </div>
          <div className="min-w-0">
            <div
              className={`text-[10px] font-bold truncate ${
                onlyFavorites ? 'text-white/80' : 'text-[#5F7164]'
              }`}
            >
              {isAr ? 'الموردين المفضلين' : 'Favorites'}
            </div>
            <div className="text-sm font-black tabular-nums">
              {favoriteSupplierIds.length} {isAr ? 'محفوظ' : 'saved'}
            </div>
          </div>
        </button>
      </div>

      {/* ================= SEARCH & FILTERS CONTROL CARD ================= */}
      <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3.5 sm:p-4 space-y-3 shadow-[0_1px_4px_rgba(11,93,50,0.04)]">
        {/* Row 1: Search, District & Sort */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={
                isAr
                  ? 'ابحث باسم شركة الجملة، الماركة (عافية، نسكافيه...) أو المنطقة...'
                  : 'Search supplier, brand (Afia, Nescafe...), or district...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[42px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl py-2 ps-9 pe-3 text-xs sm:text-sm text-[#142018] placeholder-[#5F7164] focus:bg-white focus:border-[#0B5D32] outline-none transition"
            />
            <Search className="w-4 h-4 text-[#5F7164] absolute start-3 top-3" />
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="min-h-[42px] sm:w-48 bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl py-2 px-3 text-xs font-bold text-[#142018] focus:bg-white focus:border-[#0B5D32] outline-none transition cursor-pointer"
            >
              <option value="الكل">{isAr ? 'جميع مناطق بغداد' : 'All Districts'}</option>
              <option value="المنصور">{isAr ? 'المنصور وحي دراغ' : 'Al-Mansoor'}</option>
              <option value="الشورجة">{isAr ? 'الشورجة وشارع الرشيد' : 'Shorja Hub'}</option>
              <option value="جميلة">{isAr ? 'مدينة جميلة الصناعية' : 'Jamila City'}</option>
              <option value="الكرادة">{isAr ? 'الكرادة داخل وخارج' : 'Karrada'}</option>
              <option value="البياع">{isAr ? 'البياع والسيدية' : 'Bayaa & Saydiya'}</option>
              <option value="اليرموك">{isAr ? 'اليرموك والجامعة' : 'Yarmouk'}</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="min-h-[42px] sm:w-44 bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl py-2 px-3 text-xs font-bold text-[#142018] focus:bg-white focus:border-[#0B5D32] outline-none transition cursor-pointer"
            >
              <option value="distance">{isAr ? 'الأقرب لموقعك' : 'Closest First'}</option>
              <option value="rating">{isAr ? 'الأعلى تقييماً' : 'Highest Rated'}</option>
              <option value="min_order">{isAr ? 'أقل حد للطلب' : 'Lowest Min Order'}</option>
              <option value="vans">{isAr ? 'الأكثر فانات نشطة' : 'Most Active Vans'}</option>
            </select>
          </div>
        </div>

        {/* Row 2: Specialty / Category Horizontal Rail */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-[#0B5D32] text-white shadow-2xs'
                    : 'bg-[#F4F4EA] border border-[#DCE5DC] text-[#3D5244] hover:border-[#0B5D32]/40'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Row 3: Quick Filter Toggles */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#DCE5DC]/70 text-xs">
          <span className="text-[#5F7164] font-bold flex items-center gap-1 text-[11px]">
            <Filter className="w-3.5 h-3.5" />
            {isAr ? 'تصفية:' : 'Filter:'}
          </span>

          <button
            type="button"
            onClick={() => setOnlyInstantVans((prev) => !prev)}
            className={`min-h-[34px] px-3 py-1 rounded-xl font-bold border transition flex items-center gap-1.5 cursor-pointer text-[11.5px] ${
              onlyInstantVans
                ? 'bg-[#EBF4EE] border-[#0B5D32] text-[#0B5D32]'
                : 'bg-[#F4F4EA] border-[#DCE5DC] text-[#3D5244] hover:border-[#0B5D32]/40'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#D97706]" />
            <span>{isAr ? 'فانات كاش فورية' : 'Instant Vans'}</span>
          </button>

          <button
            type="button"
            onClick={() => setOnlyCredit((prev) => !prev)}
            className={`min-h-[34px] px-3 py-1 rounded-xl font-bold border transition flex items-center gap-1.5 cursor-pointer text-[11.5px] ${
              onlyCredit
                ? 'bg-[#EBF4EE] border-[#0B5D32] text-[#0B5D32]'
                : 'bg-[#F4F4EA] border-[#DCE5DC] text-[#3D5244] hover:border-[#0B5D32]/40'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-[#0B5D32]" />
            <span>{isAr ? 'تسهيلات وآجل' : 'Credit Terms'}</span>
          </button>

          <button
            type="button"
            onClick={() => setOnlySmartShipping((prev) => !prev)}
            className={`min-h-[34px] px-3 py-1 rounded-xl font-bold border transition flex items-center gap-1.5 cursor-pointer text-[11.5px] ${
              onlySmartShipping
                ? 'bg-[#EBF4EE] border-[#0B5D32] text-[#0B5D32]'
                : 'bg-[#F4F4EA] border-[#DCE5DC] text-[#3D5244] hover:border-[#0B5D32]/40'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-[#0B5D32]" />
            <span>{isAr ? 'شحن مجاني SMART' : 'Free Shipping'}</span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('الكل');
                setSelectedDistrict('الكل');
                setSearchQuery('');
                setOnlyInstantVans(false);
                setOnlyCredit(false);
                setOnlySmartShipping(false);
                setOnlyFavorites(false);
              }}
              className="text-[#E11D48] hover:underline text-xs font-black ms-auto cursor-pointer whitespace-nowrap"
            >
              {isAr ? 'إعادة ضبط' : 'Reset'}
            </button>
          )}
        </div>
      </div>

      {/* ================= RESULTS COUNT BAR ================= */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-bold text-[#4B6352] tabular-nums">
        <span>
          {isAr
            ? `عرض ${filteredSuppliers.length} من أصل ${suppliersWithLiveDistances.length} مورد جملة معتمد`
            : `Showing ${filteredSuppliers.length} of ${suppliersWithLiveDistances.length} verified suppliers`}
        </span>
        <span className="text-[#0B5D32] flex items-center gap-1 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>{isAr ? 'أسعار جملة مباشرة وموثقة' : 'Verified Direct B2B Pricing'}</span>
        </span>
      </div>

      {/* ================= SUPPLIERS GRID CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((supplier) => {
          const isFavorite = favoriteSupplierIds.includes(supplier.id);
          return (
            <div
              key={supplier.id}
              className="bg-white rounded-2xl border border-[#DCE5DC] hover:border-[#0B5D32]/50 transition shadow-[0_2px_8px_rgba(11,93,50,0.04)] hover:shadow-md overflow-hidden flex flex-col group"
            >
              {/* Cover Photo / Storefront Image with Clean Overlays */}
              <div className="relative h-40 w-full bg-[#EBF4EE] overflow-hidden">
                <img
                  src={
                    supplier.storeImageUrl ||
                    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'
                  }
                  alt={supplier.nameAr}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B2918]/80 via-[#0B2918]/20 to-transparent" />

                {/* Top Start: Distance Pill */}
                <div className="absolute top-3 start-3 bg-white/95 text-[#0B5D32] border border-[#DCE5DC] px-2.5 py-1 rounded-full text-[11px] font-black shadow-xs flex items-center gap-1 tabular-nums">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {supplier.distanceKm} {isAr ? 'كم' : 'km'}
                  </span>
                </div>

                {/* Top End: Active Vans + Favorite Toggle */}
                <div className="absolute top-3 end-3 flex items-center gap-1.5">
                  <div className="bg-[#FDE047] text-[#142018] px-2.5 py-1 rounded-full text-[11px] font-black shadow-xs flex items-center gap-1 tabular-nums">
                    <Zap className="w-3 h-3 fill-current" />
                    <span>
                      {supplier.activeVansCount} {isAr ? 'فان' : 'vans'}
                    </span>
                  </div>

                  {onToggleFavoriteSupplier && (
                    <button
                      type="button"
                      onClick={() => onToggleFavoriteSupplier(supplier.id)}
                      aria-label={isAr ? 'حفظ المورد' : 'Save supplier'}
                      className="w-8 h-8 rounded-full bg-white/95 border border-[#DCE5DC] flex items-center justify-center shadow-xs cursor-pointer hover:scale-105 transition"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isFavorite ? 'text-[#E11D48] fill-[#E11D48]' : 'text-[#4B6352]'
                        }`}
                      />
                    </button>
                  )}
                </div>

                {/* Bottom Overlay: Brand Logo, Category & Rating */}
                <div className="absolute bottom-3 start-3 end-3 flex items-end justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-md border border-white/70 shrink-0 overflow-hidden">
                      <img
                        src={
                          supplier.logoUrl ||
                          'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80'
                        }
                        alt={supplier.nameAr}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>

                    <div className="text-white min-w-0">
                      <span className="text-[10.5px] font-black bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md inline-block truncate max-w-full">
                        {supplier.category || (isAr ? 'مواد غذائية' : 'Foodstuff')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRatingSupplier(supplier)}
                        className="flex items-center gap-1 text-[11px] text-white/95 hover:text-[#FDE047] mt-0.5 tabular-nums cursor-pointer"
                        title={isAr ? 'عرض أو إضافة تقييم' : 'View or add review'}
                      >
                        <Star className="w-3.5 h-3.5 text-[#FDE047] fill-[#FDE047]" />
                        <span className="font-black">{supplier.rating.toFixed(1)}</span>
                        <span className="text-white/80">
                          ({supplier.reviewsCount})
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm sm:text-base font-black text-[#142018] leading-snug group-hover:text-[#0B5D32] transition-colors">
                      {isAr ? supplier.nameAr : supplier.nameEn}
                    </h3>
                    <BadgeCheck className="w-5 h-5 text-[#0B5D32] shrink-0" />
                  </div>
                  <p className="text-[11px] text-[#5F7164] mt-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {supplier.districtAr} • {supplier.addressAr}
                    </span>
                  </p>
                </div>

                {/* Authorized Brand Agencies */}
                {supplier.brandsDistributed && supplier.brandsDistributed.length > 0 && (
                  <div className="bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl p-2.5">
                    <div className="text-[10px] font-black text-[#4B6352] mb-1.5 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-[#0B5D32]" />
                      <span>{isAr ? 'وكالات وعلامات تجارية:' : 'Authorized Brands:'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {supplier.brandsDistributed.map((brand, bIdx) => (
                        <span
                          key={bIdx}
                          className="text-[10px] font-bold bg-white border border-[#DCE5DC] text-[#142018] px-2 py-0.5 rounded-md"
                        >
                          {brand}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specs Grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-[#F4F4EA] p-2.5 rounded-xl border border-[#DCE5DC]">
                    <div className="text-[#5F7164] text-[10px] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#0B5D32]" />
                      <span>{isAr ? 'التوصيل' : 'Delivery'}</span>
                    </div>
                    <span className="font-bold text-[#142018] mt-0.5 block truncate">
                      {isAr ? supplier.deliveryTimeAr : supplier.deliveryTimeEn}
                    </span>
                  </div>

                  <div className="bg-[#F4F4EA] p-2.5 rounded-xl border border-[#DCE5DC]">
                    <div className="text-[#5F7164] text-[10px] flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-[#0B5D32]" />
                      <span>{isAr ? 'الائتمان' : 'Credit'}</span>
                    </div>
                    <span className="font-bold text-[#0B5D32] mt-0.5 block truncate">
                      {isAr ? supplier.creditTermsAr : supplier.creditTermsEn}
                    </span>
                  </div>
                </div>

                {/* Min Order */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#DCE5DC] tabular-nums">
                  <span className="text-[#5F7164] font-semibold">
                    {isAr ? 'الحد الأدنى للطلب:' : 'Min Order:'}
                  </span>
                  <span className="font-black text-[#142018]">
                    {formatCurrency(supplier.minOrderIQD, currency)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenSupplierStore) {
                        onOpenSupplierStore(supplier);
                      } else {
                        onBrowseSupplierProducts(supplier.nameAr);
                      }
                    }}
                    className="flex-1 min-h-[42px] py-2 px-3 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                  >
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    <span>{isAr ? 'تصفح منتجات المورد' : 'Browse Catalog'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVanRequestedSupplier(supplier)}
                    className="min-h-[42px] py-2 px-3 rounded-xl bg-[#EBF4EE] hover:bg-[#DCECE1] border border-[#0B5D32]/25 text-[#0B5D32] text-xs font-black flex items-center justify-center gap-1 transition cursor-pointer shrink-0 whitespace-nowrap"
                    title={isAr ? 'طلب فان كاش فوري لموقع متجرك' : 'Request Instant Cash Van'}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isAr ? 'فان كاش' : 'Van'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRatingSupplier(supplier)}
                    className="w-10 h-[42px] rounded-xl bg-[#FEF9C3] hover:bg-[#FEF08A] border border-[#FDE047] text-[#854D0E] flex items-center justify-center transition cursor-pointer shrink-0"
                    title={isAr ? 'تقييم المورد بالنجوم وتعليق' : 'Rate supplier'}
                    aria-label={isAr ? 'تقييم المورد' : 'Rate supplier'}
                  >
                    <Star className="w-4 h-4 fill-[#EAB308] text-[#CA8A04]" />
                  </button>

                  <a
                    href={`tel:${supplier.phone}`}
                    className="w-10 h-[42px] rounded-xl bg-[#F4F4EA] hover:bg-[#EBF4EE] border border-[#DCE5DC] text-[#3D5244] hover:text-[#0B5D32] flex items-center justify-center transition cursor-pointer shrink-0"
                    title={supplier.phone}
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredSuppliers.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-10 text-center space-y-3">
          <Building2 className="w-10 h-10 text-[#DCE5DC] mx-auto" />
          <h3 className="text-sm sm:text-base font-black text-[#142018]">
            {isAr
              ? 'لم نجد موردين مطابقين لمعايير البحث الحالية'
              : 'No suppliers match your current filter'}
          </h3>
          <p className="text-xs text-[#5F7164] max-w-md mx-auto">
            {isAr
              ? 'جرّب مسح بعض الفلاتر أو اختيار منطقة أخرى لعرض جميع شركات ومستودعات الجملة.'
              : 'Try clearing filters or selecting another district.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('الكل');
              setSelectedDistrict('الكل');
              setSearchQuery('');
              setOnlyInstantVans(false);
              setOnlyCredit(false);
              setOnlySmartShipping(false);
              setOnlyFavorites(false);
            }}
            className="min-h-[40px] px-4 py-2 bg-[#0B5D32] hover:bg-[#084726] text-white text-xs font-black rounded-xl cursor-pointer transition"
          >
            {isAr ? 'عرض كل الموردين' : 'Show All Suppliers'}
          </button>
        </div>
      )}

      {/* ================= BAGHDAD DISTRICT PICKER MODAL ================= */}
      {isDistrictPickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2918]/65 backdrop-blur-xs p-3 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDistrictPickerOpen(false);
          }}
        >
          <div className="bg-[#F4F4EA] border border-[#DCE5DC] rounded-3xl max-w-md w-full shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="px-5 py-3.5 bg-white border-b border-[#DCE5DC] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0B5D32] text-white flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-[#0B5D32]">
                    {isAr ? 'تحديد موقع متجرك' : 'Select Store Location'}
                  </h3>
                  <p className="text-[11px] text-[#5F7164]">
                    {isAr
                      ? 'لحساب المسافة الفعلية وأقرب فانات التوزيع'
                      : 'Calculates exact distance & fastest vans'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDistrictPickerOpen(false)}
                className="w-9 h-9 rounded-full bg-[#F4F4EA] border border-[#DCE5DC] text-[#3D5244] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2">
              {BAGHDAD_DISTRICTS.map((dist) => {
                const isSelected = dist.id === currentDistrict.id;
                return (
                  <button
                    key={dist.id}
                    type="button"
                    onClick={() => handleChooseDistrict(dist)}
                    className={`w-full min-h-[48px] p-3 rounded-2xl border text-start flex items-center justify-between gap-3 transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#0B5D32] border-[#0B5D32] text-white shadow-xs'
                        : 'bg-white border-[#DCE5DC] hover:border-[#0B5D32]/50 text-[#142018]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MapPin
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? 'text-[#FDE047]' : 'text-[#0B5D32]'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-black truncate">
                          {isAr ? dist.nameAr : dist.nameEn}
                        </div>
                        <div
                          className={`text-[10.5px] truncate ${
                            isSelected ? 'text-white/80' : 'text-[#5F7164]'
                          }`}
                        >
                          {isAr ? dist.nameEn : dist.nameAr}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 shrink-0 text-[#FDE047]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= VAN DISPATCH CONFIRMATION MODAL (POS Style) ================= */}
      {vanRequestedSupplier && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2918]/65 backdrop-blur-xs p-3 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setVanRequestedSupplier(null);
          }}
        >
          <div className="bg-[#F4F4EA] border border-[#DCE5DC] rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 bg-white border-b border-[#DCE5DC] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0B5D32] text-white flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-[#0B5D32]">
                  {isAr ? 'طلب فان كاش فوري لمتجرك' : 'Instant Cash Van Dispatch'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVanRequestedSupplier(null)}
                className="w-9 h-9 rounded-full bg-[#F4F4EA] border border-[#DCE5DC] text-[#3D5244] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <p className="text-xs text-[#3D5244] leading-relaxed">
                {isAr ? (
                  <>
                    سيتم توجيه أقرب فان مجهز من{' '}
                    <strong className="text-[#142018]">{vanRequestedSupplier.nameAr}</strong>{' '}
                    مباشرة إلى متجرك في{' '}
                    <strong className="text-[#0B5D32]">{currentDistrict.nameAr}</strong> لمعاينة
                    البضاعة والشراء الفوري نقداً أو بالآجل.
                  </>
                ) : (
                  <>
                    The nearest distribution van from <strong>{vanRequestedSupplier.nameEn}</strong>{' '}
                    will be routed to your store in <strong>{currentDistrict.nameEn}</strong>.
                  </>
                )}
              </p>

              <div className="bg-white border border-[#DCE5DC] rounded-2xl p-3.5 space-y-2 text-xs tabular-nums">
                <div className="flex justify-between items-center">
                  <span className="text-[#5F7164]">
                    {isAr ? 'المسافة المقدرة:' : 'Estimated distance:'}
                  </span>
                  <span className="font-black text-[#0B5D32]">
                    {vanRequestedSupplier.distanceKm} {isAr ? 'كم' : 'km'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5F7164]">
                    {isAr ? 'وقت الوصول التقريبي:' : 'Estimated arrival:'}
                  </span>
                  <span className="font-black text-[#142018]">
                    {isAr
                      ? vanRequestedSupplier.deliveryTimeAr
                      : vanRequestedSupplier.deliveryTimeEn}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5F7164]">
                    {isAr ? 'هاتف مسؤول الفان:' : 'Coordinator phone:'}
                  </span>
                  <span dir="ltr" className="font-bold font-mono text-[#142018]">
                    {vanRequestedSupplier.phone}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const supplierLabel = isAr
                      ? vanRequestedSupplier.nameAr
                      : vanRequestedSupplier.nameEn;
                    setVanRequestedSupplier(null);
                    showToast(
                      isAr
                        ? `تم إرسال طلب الفان من ${supplierLabel} بنجاح! سيتواصل المندوب خلال دقائق.`
                        : `Van dispatch request sent to ${supplierLabel}!`
                    );
                  }}
                  className="flex-1 min-h-[42px] py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white font-black text-xs transition cursor-pointer"
                >
                  {isAr ? 'تأكيد إرسال الفان' : 'Confirm Dispatch'}
                </button>
                <button
                  type="button"
                  onClick={() => setVanRequestedSupplier(null)}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-white border border-[#DCE5DC] text-[#3D5244] font-bold text-xs transition cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Star Rating & Quality Review Modal */}
      {ratingSupplier && (
        <SupplierRatingModal
          isOpen={Boolean(ratingSupplier)}
          onClose={() => setRatingSupplier(null)}
          supplierId={ratingSupplier.id}
          supplierName={isAr ? ratingSupplier.nameAr : ratingSupplier.nameEn}
          storeName={storeName}
          language={language}
          defaultFormOpen={true}
          onSummaryUpdated={(summary) => {
            setReviewSummaries((prev) => ({
              ...prev,
              [summary.supplierId]: summary
            }));
          }}
        />
      )}
    </div>
  );
};
