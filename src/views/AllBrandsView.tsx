import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Search,
  X,
  Package,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { FAMOUS_BRANDS, FamousBrand, matchBrandToProduct } from '../data/brands.ts';
import { Currency, Language, ProductWithOffers, SupplierOfferItem } from '../types/index.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { formatCurrency } from '../utils/format.ts';
import { resolveWholesaleSupplierByOffer } from '../data/nearbySuppliers.ts';
import { getInitialOfferQuantity } from '../../shared/orderRules.ts';

interface AllBrandsViewProps {
  products: ProductWithOffers[];
  currency: Currency;
  language: Language;
  initialBrandId?: string | null;
  onBack: () => void;
  onCompareOffers: (product: ProductWithOffers) => void;
  onAddToCart: (product: ProductWithOffers, offer: SupplierOfferItem, quantity: number) => void;
  wishlistBarcodes?: string[];
  onToggleWishlist?: (barcode: string) => void;
}

type BrandCategoryFilter = 'all' | FamousBrand['categoryGroup'];
type BrandSortOption = 'featured' | 'products_desc' | 'alpha';

export const AllBrandsView: React.FC<AllBrandsViewProps> = ({
  products,
  currency,
  language,
  initialBrandId = null,
  onBack,
  onCompareOffers,
  onAddToCart,
  wishlistBarcodes = [],
  onToggleWishlist
}) => {
  const isAr = language === 'ar';

  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(initialBrandId);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<BrandCategoryFilter>('all');
  const [sortBy, setSortBy] = useState<BrandSortOption>('featured');

  const brandProductMap = useMemo(() => {
    const map: Record<string, ProductWithOffers[]> = {};
    for (const brand of FAMOUS_BRANDS) {
      map[brand.id] = products.filter((p) => matchBrandToProduct(brand, p));
    }
    return map;
  }, [products]);

  const selectedBrand = useMemo(
    () => (selectedBrandId ? FAMOUS_BRANDS.find((b) => b.id === selectedBrandId) || null : null),
    [selectedBrandId]
  );

  const selectedBrandProducts = useMemo(
    () => (selectedBrand ? brandProductMap[selectedBrand.id] || [] : []),
    [selectedBrand, brandProductMap]
  );

  const categoryTabs: Array<{ id: BrandCategoryFilter; labelAr: string; labelEn: string }> = [
    { id: 'all', labelAr: 'الكل', labelEn: 'All Brands' },
    { id: 'staples', labelAr: 'مواد غذائية أساسية', labelEn: 'Pantry Staples' },
    { id: 'coffee_tea', labelAr: 'قهوة وشاي', labelEn: 'Coffee & Tea' },
    { id: 'oils_dairy', labelAr: 'زيوت وألبان ومعلبات', labelEn: 'Oils, Dairy & Canned' },
    { id: 'cleaning', labelAr: 'منظفات وعناية', labelEn: 'Cleaning & Care' },
    { id: 'beverages_frozen', labelAr: 'مشروبات ومجمدات', labelEn: 'Beverages & Frozen' }
  ];

  const filteredBrands = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = FAMOUS_BRANDS.filter((brand) => {
      if (categoryFilter !== 'all' && brand.categoryGroup !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        brand.nameAr.toLowerCase().includes(q) ||
        brand.nameEn.toLowerCase().includes(q) ||
        brand.categoryAr.toLowerCase().includes(q) ||
        brand.categoryEn.toLowerCase().includes(q) ||
        brand.countryAr.toLowerCase().includes(q) ||
        brand.countryEn.toLowerCase().includes(q)
      );
    });

    const sorted = [...list];
    if (sortBy === 'products_desc') {
      sorted.sort((a, b) => (brandProductMap[b.id]?.length || 0) - (brandProductMap[a.id]?.length || 0));
    } else if (sortBy === 'alpha') {
      sorted.sort((a, b) =>
        isAr ? a.nameAr.localeCompare(b.nameAr, 'ar') : a.nameEn.localeCompare(b.nameEn, 'en')
      );
    } else {
      sorted.sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    return sorted;
  }, [searchQuery, categoryFilter, sortBy, brandProductMap, isAr]);

  const selectedBrandBestPrice = useMemo(() => {
    if (selectedBrandProducts.length === 0) return null;
    return Math.min(...selectedBrandProducts.map((p) => p.minPrice));
  }, [selectedBrandProducts]);

  return (
    <div className="space-y-5 font-brand pb-12">
      {/* Top Bar */}
      <div className="bg-white rounded-2xl border border-[#EAECEF] px-4 py-3.5 shadow-[0_1px_4px_rgba(15,23,42,0.03)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (selectedBrand) {
                setSelectedBrandId(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                onBack();
              }
            }}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white text-xs font-black flex items-center gap-1.5 transition cursor-pointer shrink-0 whitespace-nowrap"
          >
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>
              {selectedBrand
                ? isAr
                  ? 'كل العلامات'
                  : 'All Brands'
                : isAr
                ? 'رجوع'
                : 'Back'}
            </span>
          </button>

          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-black text-[#111827] leading-tight truncate">
              {selectedBrand
                ? isAr
                  ? selectedBrand.nameAr
                  : selectedBrand.nameEn
                : isAr
                ? 'أشهر العلامات التجارية'
                : 'Famous Wholesale Brands'}
            </h1>
            <p className="text-xs text-[#6B7280] mt-0.5 truncate">
              {selectedBrand
                ? isAr
                  ? `${selectedBrand.categoryAr} · ${selectedBrand.countryAr} · ${selectedBrandProducts.length} صنف متوفر بالجملة`
                  : `${selectedBrand.categoryEn} · ${selectedBrand.countryEn} · ${selectedBrandProducts.length} wholesale items`
                : isAr
                ? `${FAMOUS_BRANDS.length} علامة تجارية معتمدة · أسعار جملة مباشرة من الوكلاء والموردين`
                : `${FAMOUS_BRANDS.length} authorized brands · Direct wholesale supply`}
            </p>
          </div>
        </div>

        <div className="text-xs font-bold text-[#0B5D32] tabular-nums whitespace-nowrap shrink-0">
          {isAr
            ? `${filteredBrands.length} من ${FAMOUS_BRANDS.length} علامة`
            : `${filteredBrands.length} of ${FAMOUS_BRANDS.length} brands`}
        </div>
      </div>

      {/* Selected Brand Detail Panel */}
      {selectedBrand && (
        <section className="space-y-4">
          <div className="bg-white rounded-3xl border border-[#EAECEF] p-4 sm:p-6 shadow-[0_2px_10px_rgba(15,23,42,0.04)] flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#F8FAFC] border border-[#EAECEF] p-3 flex items-center justify-center shrink-0">
              <img
                src={selectedBrand.imageUrl}
                alt={isAr ? selectedBrand.nameAr : selectedBrand.nameEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 text-xs text-[#6B7280] font-semibold">
                <span>{isAr ? selectedBrand.categoryAr : selectedBrand.categoryEn}</span>
                <span aria-hidden="true">·</span>
                <span>{isAr ? selectedBrand.countryAr : selectedBrand.countryEn}</span>
                {selectedBrand.featured && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#00A046] font-bold">
                      {isAr ? 'علامة رائجة' : 'Featured Brand'}
                    </span>
                  </>
                )}
              </div>

              <h2 className="text-lg sm:text-2xl font-black text-[#111827] leading-snug">
                {isAr ? selectedBrand.nameAr : selectedBrand.nameEn}
                <span className="text-xs sm:text-sm font-semibold text-[#6B7280] ms-2">
                  {isAr ? selectedBrand.nameEn : selectedBrand.nameAr}
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed max-w-2xl">
                {isAr ? selectedBrand.taglineAr : selectedBrand.taglineEn}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#374151] font-bold tabular-nums">
                <span>
                  {isAr ? 'الأصناف المتوفرة:' : 'Available SKUs:'}{' '}
                  <strong className="text-[#111827]">{selectedBrandProducts.length}</strong>
                </span>
                {selectedBrandBestPrice !== null && (
                  <>
                    <span className="text-[#D1D5DB]" aria-hidden="true">|</span>
                    <span>
                      {isAr ? 'تبدأ الأسعار من:' : 'Starting from:'}{' '}
                      <strong className="text-[#00A046]">
                        {formatCurrency(selectedBrandBestPrice, currency, language)}
                      </strong>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {selectedBrandProducts.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm sm:text-base font-black text-[#111827] px-0.5">
                {isAr
                  ? `منتجات ${selectedBrand.nameAr} بالجملة (${selectedBrandProducts.length})`
                  : `${selectedBrand.nameEn} Wholesale Products (${selectedBrandProducts.length})`}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {selectedBrandProducts.map((product) => (
                  <ProductCard
                    key={product.barcode}
                    product={product}
                    currency={currency}
                    language={language}
                    onCompareOffers={onCompareOffers}
                    onQuickAddBestOffer={(p) => {
                      if (p.offers[0]) {
                        const offer = p.offers[0];
                        const supp = resolveWholesaleSupplierByOffer(
                          offer.supplierId,
                          offer.supplierName,
                          offer.supplierCity
                        );
                        onAddToCart(p, offer, getInitialOfferQuantity(offer.minOrderQuantity, supp.orderRules));
                      }
                    }}
                    isFavorite={wishlistBarcodes.includes(product.barcode)}
                    onToggleFavorite={onToggleWishlist}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#EAECEF] p-8 text-center space-y-2">
              <Package className="w-9 h-9 text-[#9CA3AF] mx-auto" />
              <p className="text-sm font-bold text-[#111827]">
                {isAr
                  ? 'لا توجد عروض نشطة حالياً لهذه العلامة في نطاق التوصيل المختار'
                  : 'No active wholesale offers for this brand in your selected delivery zone'}
              </p>
              <button
                type="button"
                onClick={() => setSelectedBrandId(null)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#00A046] hover:bg-[#008A3C] text-white text-xs font-black transition cursor-pointer"
              >
                {isAr ? 'تصفح بقية العلامات التجارية' : 'Browse Other Brands'}
              </button>
            </div>
          )}
        </section>
      )}

      {/* Search, Category Filter & Sort Controls */}
      {!selectedBrand && (
        <>
          <div className="bg-white rounded-2xl border border-[#EAECEF] p-3.5 sm:p-4 space-y-3 shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isAr
                      ? 'ابحث باسم العلامة التجارية، التصنيف، أو بلد المنشأ...'
                      : 'Search brand name, category, or origin...'
                  }
                  className="w-full min-h-[42px] bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl py-2 ps-9 pe-8 text-xs sm:text-sm text-[#111827] placeholder-[#6B7280] focus:bg-white focus:border-[#00A046] outline-none transition"
                />
                <Search className="w-4 h-4 text-[#6B7280] absolute start-3 top-1/2 -translate-y-1/2" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <SlidersHorizontal className="w-4 h-4 text-[#6B7280] shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as BrandSortOption)}
                  className="min-h-[42px] bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:bg-white focus:border-[#00A046] outline-none cursor-pointer"
                >
                  <option value="featured">{isAr ? 'الأكثر شهرة' : 'Most Popular'}</option>
                  <option value="products_desc">{isAr ? 'الأكثر منتجات متوفرة' : 'Most Products'}</option>
                  <option value="alpha">{isAr ? 'الترتيب الأبجدي' : 'Alphabetical'}</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {categoryTabs.map((tab) => {
                const active = categoryFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCategoryFilter(tab.id)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                      active
                        ? 'bg-[#0B5D32] text-white'
                        : 'bg-[#F7F8FA] border border-[#E5E7EB] text-[#374151] hover:border-[#00A046]/50'
                    }`}
                  >
                    {isAr ? tab.labelAr : tab.labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* All Famous Brands Grid */}
          {filteredBrands.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#EAECEF] p-10 text-center space-y-3">
              <Award className="w-10 h-10 text-[#D1D5DB] mx-auto" />
              <p className="text-sm font-bold text-[#111827]">
                {isAr ? 'لا توجد علامات تجارية مطابقة لبحثك' : 'No brands match your search'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                }}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#00A046] hover:bg-[#008A3C] text-white text-xs font-black cursor-pointer transition"
              >
                {isAr ? 'عرض جميع العلامات' : 'Show All Brands'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {filteredBrands.map((brand) => {
                const count = brandProductMap[brand.id]?.length || 0;
                return (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => {
                      setSelectedBrandId(brand.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group bg-white rounded-2xl border border-[#EAECEF] hover:border-[#00A046] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-4 flex flex-col justify-between text-start cursor-pointer"
                  >
                    <div>
                      <div className="aspect-[4/3] w-full rounded-xl bg-[#F8FAFC] p-3 mb-3 flex items-center justify-center overflow-hidden">
                        <img
                          src={brand.imageUrl}
                          alt={isAr ? brand.nameAr : brand.nameEn}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="text-[11px] text-[#6B7280] font-semibold flex items-center gap-1.5 truncate">
                        <span className="truncate">{isAr ? brand.categoryAr : brand.categoryEn}</span>
                        <span aria-hidden="true">·</span>
                        <span className="shrink-0">{isAr ? brand.countryAr : brand.countryEn}</span>
                      </div>

                      <h3 className="text-sm sm:text-[15px] font-black text-[#111827] group-hover:text-[#00A046] transition-colors mt-1 leading-snug line-clamp-1">
                        {isAr ? brand.nameAr : brand.nameEn}
                      </h3>

                      <p className="text-[11.5px] text-[#6B7280] mt-1 line-clamp-2 leading-relaxed min-h-[2.2rem]">
                        {isAr ? brand.taglineAr : brand.taglineEn}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-[#374151] tabular-nums">
                        {count > 0
                          ? isAr
                            ? `${count} أصناف بالجملة`
                            : `${count} wholesale SKUs`
                          : isAr
                          ? 'وكالة معتمدة'
                          : 'Authorized'}
                      </span>
                      <span className="inline-flex items-center gap-0.5 font-black text-[#00A046] whitespace-nowrap">
                        <span>{isAr ? 'استعراض' : 'Explore'}</span>
                        {isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
