import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Search,
  X,
  Check,
  Plus,
  Package,
  Store,
  LayoutGrid,
  ShoppingBag,
  Star,
  Truck
} from 'lucide-react';
import {
  ProductWithOffers,
  SupplierOfferItem,
  Currency,
  Language
} from '../types/index.ts';
import {
  CATEGORY_BRANCHES_MAP,
  GROCERY_DEPARTMENTS,
  CategoryBranchItem,
  resolveCategoryKey,
  matchesProductCategoryKeywords
} from '../data/categories.ts';
import { StoreDistrict } from '../data/nearbySuppliers.ts';
import { getLocalizedText } from '../utils/translations.ts';

interface CategoryBranchesViewProps {
  selectedCategory: string;
  selectedSubCategory: string;
  onSelectCategory?: (category: string) => void;
  onSelectBranchSubCategory: (subCategory: string) => void;
  products: ProductWithOffers[];
  currency: Currency;
  language: Language;
  currentDistrict: StoreDistrict;
  cartCount?: number;
  onOpenCart?: () => void;
  onCompareOffers: (product: ProductWithOffers) => void;
  onAddToCart: (product: ProductWithOffers, offer: SupplierOfferItem, quantity: number) => void;
  onBack: () => void;
  onOpenAllCategories: () => void;
}

export const CategoryBranchesView: React.FC<CategoryBranchesViewProps> = ({
  selectedCategory,
  selectedSubCategory,
  onSelectCategory,
  onSelectBranchSubCategory,
  products,
  language,
  currentDistrict,
  cartCount = 0,
  onOpenCart,
  onCompareOffers,
  onAddToCart,
  onBack,
  onOpenAllCategories
}) => {
  const isAr = language === 'ar';
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [addedBarcode, setAddedBarcode] = useState<string | null>(null);

  const activeCatBtnRef = useRef<HTMLButtonElement | null>(null);
  const activeBranchBtnRef = useRef<HTMLButtonElement | null>(null);

  // Refs & locks for opposite horizontal scroll synchronization between Slider 1 & Slider 2
  const slider1Ref = useRef<HTMLDivElement | null>(null);
  const slider2Ref = useRef<HTMLDivElement | null>(null);
  const syncLockRef = useRef<'top' | 'bottom' | 'programmatic' | null>(null);
  const unlockTimerRef = useRef<number | null>(null);
  const dragStateRef = useRef<{
    row: 'top' | 'bottom' | null;
    startX: number;
    startScrollLeft: number;
    moved: boolean;
  }>({ row: null, startX: 0, startScrollLeft: 0, moved: false });

  // Normalized horizontal position from physical left edge (0 = leftmost, 1 = rightmost)
  const getVisualProgress = (el: HTMLDivElement): number => {
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 1) return 0.5;
    const isRtl = getComputedStyle(el).direction === 'rtl';
    if (isRtl) {
      return Math.min(1, Math.max(0, (el.scrollLeft + max) / max));
    }
    return Math.min(1, Math.max(0, el.scrollLeft / max));
  };

  const setVisualProgress = (el: HTMLDivElement, progress: number) => {
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 1) return;
    const clamped = Math.min(1, Math.max(0, progress));
    const isRtl = getComputedStyle(el).direction === 'rtl';
    if (isRtl) {
      el.scrollLeft = clamped * max - max;
    } else {
      el.scrollLeft = clamped * max;
    }
  };

  const handleSliderScroll = (source: 'top' | 'bottom') => {
    if (syncLockRef.current === 'programmatic') return;
    if (syncLockRef.current && syncLockRef.current !== source) return;

    const srcEl = source === 'top' ? slider1Ref.current : slider2Ref.current;
    const dstEl = source === 'top' ? slider2Ref.current : slider1Ref.current;
    if (!srcEl || !dstEl) return;

    syncLockRef.current = source;
    const srcProgress = getVisualProgress(srcEl);
    setVisualProgress(dstEl, 1 - srcProgress);

    if (unlockTimerRef.current) {
      window.clearTimeout(unlockTimerRef.current);
    }
    unlockTimerRef.current = window.setTimeout(() => {
      syncLockRef.current = null;
    }, 40);
  };

  const handleMouseDown = (row: 'top' | 'bottom', e: React.MouseEvent<HTMLDivElement>) => {
    const el = row === 'top' ? slider1Ref.current : slider2Ref.current;
    if (!el) return;
    dragStateRef.current = {
      row,
      startX: e.pageX,
      startScrollLeft: el.scrollLeft,
      moved: false
    };
  };

  const handleMouseMove = (row: 'top' | 'bottom', e: React.MouseEvent<HTMLDivElement>) => {
    const st = dragStateRef.current;
    if (st.row !== row) return;
    const el = row === 'top' ? slider1Ref.current : slider2Ref.current;
    if (!el) return;
    const delta = e.pageX - st.startX;
    if (Math.abs(delta) > 4) {
      st.moved = true;
    }
    el.scrollLeft = st.startScrollLeft - delta;
  };

  const handleMouseUpOrLeave = () => {
    dragStateRef.current.row = null;
  };

  const resolvedSelectedCategory = useMemo(
    () => resolveCategoryKey(selectedCategory),
    [selectedCategory]
  );

  // Unique main departments for Slider 1 (all 22 departments)
  const mainCategories = useMemo(() => GROCERY_DEPARTMENTS, []);

  const categoryMeta = useMemo(() => {
    return (
      mainCategories.find((c) => c.categoryKey === resolvedSelectedCategory) ||
      mainCategories[0]
    );
  }, [mainCategories, resolvedSelectedCategory]);

  const branches: CategoryBranchItem[] = useMemo(() => {
    return (
      CATEGORY_BRANCHES_MAP[resolvedSelectedCategory] ||
      CATEGORY_BRANCHES_MAP[selectedCategory] || [
        {
          id: 'all',
          labelAr: 'جميع الفروع',
          labelEn: 'All Branches',
          imageUrl: categoryMeta.imageUrl
        }
      ]
    );
  }, [resolvedSelectedCategory, selectedCategory, categoryMeta.imageUrl]);

  const [activeBranchId, setActiveBranchId] = useState<string>(() => {
    if (selectedSubCategory && selectedSubCategory !== 'الكل') {
      const matched = branches.find((b) => b.subCategoryKey === selectedSubCategory);
      if (matched) return matched.id;
    }
    return branches[0]?.id || 'all';
  });

  useEffect(() => {
    if (selectedSubCategory && selectedSubCategory !== 'الكل') {
      const matched = branches.find((b) => b.subCategoryKey === selectedSubCategory);
      if (matched) {
        setActiveBranchId(matched.id);
        return;
      }
    }
    setActiveBranchId(branches[0]?.id || 'all');
  }, [selectedCategory, selectedSubCategory, branches]);

  // Center active category in Slider 1 and position Slider 2 at opposite end for immediate counter-scroll
  useEffect(() => {
    const s1 = slider1Ref.current;
    const s2 = slider2Ref.current;
    if (!s1 || !s2) return;

    syncLockRef.current = 'programmatic';
    if (activeCatBtnRef.current) {
      activeCatBtnRef.current.scrollIntoView({
        behavior: 'auto',
        inline: 'center',
        block: 'nearest'
      });
    }

    const raf = requestAnimationFrame(() => {
      const topProg = getVisualProgress(s1);
      setVisualProgress(s2, 1 - topProg);
      requestAnimationFrame(() => {
        syncLockRef.current = null;
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      syncLockRef.current = null;
    };
  }, [selectedCategory, language]);

  const activeBranch =
    branches.find((b) => b.id === activeBranchId) || branches[0];

  const categoryProducts = useMemo(() => {
    return products.filter((p) => resolveCategoryKey(p.category) === resolvedSelectedCategory);
  }, [products, resolvedSelectedCategory]);

  const displayedProducts = useMemo(() => {
    let list = [...categoryProducts];

    if (activeBranch && activeBranch.id !== 'all') {
      if (activeBranch.subCategoryKey) {
        const subFiltered = list.filter(
          (p) => p.subCategory === activeBranch.subCategoryKey
        );
        if (subFiltered.length > 0) list = subFiltered;
      } else if (activeBranch.keywords && activeBranch.keywords.length > 0) {
        const kwFiltered = list.filter((p) => {
          const hay = `${p.nameAr} ${p.nameEn || ''} ${p.descriptionAr || ''} ${p.subCategory || ''}`.toLowerCase();
          return activeBranch.keywords!.some((kw) => hay.includes(kw.toLowerCase()));
        });
        if (kwFiltered.length > 0) list = kwFiltered;
      }
    }

    if (localSearch.trim()) {
      const q = localSearch.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.nameAr.toLowerCase().includes(q) ||
          (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
          p.brand.toLowerCase().includes(q) ||
          matchesProductCategoryKeywords(p.category, p.subCategory, q)
      );
    }

    return list;
  }, [categoryProducts, activeBranch, localSearch]);

  const alsoBoughtProducts = useMemo(() => {
    const currentSet = new Set(displayedProducts.map((p) => p.barcode));
    return products.filter((p) => !currentSet.has(p.barcode)).slice(0, 8);
  }, [products, displayedProducts]);

  const handleBranchClick = (branch: CategoryBranchItem) => {
    if (dragStateRef.current.moved) {
      dragStateRef.current.moved = false;
      return;
    }
    setActiveBranchId(branch.id);
    onSelectBranchSubCategory(branch.subCategoryKey || 'الكل');
  };

  const handleQuickAdd = (e: React.MouseEvent, product: ProductWithOffers) => {
    e.stopPropagation();
    const offer = product.offers[0];
    if (!offer || offer.availableStock <= 0) return;
    onAddToCart(product, offer, offer.minOrderQuantity || 1);
    setAddedBarcode(product.barcode);
    setTimeout(() => setAddedBarcode(null), 1400);
  };

  const categoryTitle = isAr ? categoryMeta.labelAr : categoryMeta.labelEn;

  return (
    <div className="min-h-screen sm:min-h-[calc(100vh-4rem)] bg-white sm:rounded-2xl border-b sm:border border-[#E5E7EB] shadow-2xs overflow-x-clip font-brand flex flex-col">
      {/* Unified Sticky Top Dock: Slim Header + Counter-Scrolling Slider 1 & Slider 2 */}
      <div className="sticky top-0 z-30 bg-white sm:rounded-t-2xl shadow-[0_4px_14px_-6px_rgba(15,61,36,0.1)] select-none">
        {/* 1. Compact Single-Line Top Header Bar */}
        <div className="bg-white border-b border-[#F1F5F9] px-2.5 sm:px-5 h-11 sm:h-12 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#1F2328] transition cursor-pointer shrink-0"
              aria-label={isAr ? 'رجوع' : 'Back'}
            >
              {isAr ? <ArrowRight className="w-4.5 h-4.5" /> : <ArrowLeft className="w-4.5 h-4.5" />}
            </button>

            <h1 className="text-sm sm:text-base font-black text-[#0F3D24] truncate leading-none">
              {categoryTitle}
            </h1>
            <span className="hidden md:inline-block text-[11px] text-[#6B7280] truncate">
              · {isAr ? currentDistrict.nameAr : currentDistrict.nameEn}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowSearchInput((prev) => !prev)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
                showSearchInput
                  ? 'bg-[#E8F8EE] text-[#00A046]'
                  : 'hover:bg-gray-100 text-[#1F2328]'
              }`}
              aria-label={isAr ? 'بحث داخل القسم' : 'Search inside category'}
            >
              <Search className="w-4 h-4" />
            </button>

            {onOpenCart && (
              <button
                type="button"
                onClick={onOpenCart}
                aria-label={isAr ? 'عربة التسوق' : 'Shopping Cart'}
                className="relative w-8 h-8 rounded-full bg-[#EFFAF3] hover:bg-[#E0F5E8] border border-[#CBEBD7] flex items-center justify-center text-[#00A046] transition cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#FFCE00] text-[#1F2328] text-[9px] font-black flex items-center justify-center border border-white tabular-nums">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onOpenAllCategories}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EFFAF3] hover:bg-[#E0F5E8] border border-[#CBEBD7] text-[#0F3D24] text-[11px] font-bold transition cursor-pointer whitespace-nowrap"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#00A046]" />
              <span>{isAr ? 'جميع الأقسام' : 'All Categories'}</span>
            </button>
          </div>
        </div>

        {/* Expandable Search Input */}
        {showSearchInput && (
          <div className="px-3 sm:px-5 py-1.5 bg-[#F8FAFC] border-b border-[#E5E7EB]">
            <div className="relative max-w-md">
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder={
                  isAr
                    ? `ابحث داخل قسم ${categoryTitle}...`
                    : `Search in ${categoryTitle}...`
                }
                className={`w-full bg-white border border-[#E5E7EB] rounded-lg py-1.5 ${
                  isAr ? 'pr-8 pl-7' : 'pl-8 pr-7'
                } text-xs text-[#1F2328] focus:outline-hidden focus:ring-2 focus:ring-[#00A046]`}
                autoFocus
              />
              <Search
                className={`w-3.5 h-3.5 text-[#6B7280] absolute ${
                  isAr ? 'right-2.5' : 'left-2.5'
                } top-2`}
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={() => setLocalSearch('')}
                  className={`absolute ${
                    isAr ? 'left-2' : 'right-2'
                  } top-2 text-gray-400 hover:text-gray-700 cursor-pointer`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2. Slider 1: Slim Main Categories (scrolls opposite to Slider 2) */}
        <div className="bg-white border-b border-[#F1F5F9] px-2.5 sm:px-5 py-1">
          <div
            ref={slider1Ref}
            onScroll={() => handleSliderScroll('top')}
            onMouseDown={(e) => handleMouseDown('top', e)}
            onMouseMove={(e) => handleMouseMove('top', e)}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none touch-pan-x cursor-grab active:cursor-grabbing"
          >
            {mainCategories.map((cat) => {
              const isActive = cat.categoryKey === resolvedSelectedCategory;
              return (
                <button
                  key={cat.id}
                  ref={isActive ? activeCatBtnRef : undefined}
                  type="button"
                  onClick={() => {
                    if (dragStateRef.current.moved) {
                      dragStateRef.current.moved = false;
                      return;
                    }
                    if (onSelectCategory) {
                      onSelectCategory(cat.categoryKey);
                    }
                    onSelectBranchSubCategory('الكل');
                  }}
                  className={`h-8 sm:h-9 ps-1 pe-2.5 sm:pe-3 rounded-full flex items-center gap-1.5 text-[11px] sm:text-xs whitespace-nowrap shrink-0 border transition cursor-pointer ${
                    isActive
                      ? 'bg-[#00A046] text-white border-[#00A046] font-black shadow-2xs'
                      : 'bg-[#F8FAFC] text-[#1F2328] border-[#E5E7EB] hover:bg-[#EFFAF3] hover:border-[#00A046]/50 font-bold'
                  }`}
                >
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${
                      isActive ? 'bg-white' : 'bg-[#EFFAF3]'
                    }`}
                  >
                    <img
                      src={cat.imageUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span>{isAr ? cat.labelAr : cat.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Slider 2: Slim Sub-Branches (scrolls in opposite direction to Slider 1) */}
        <div className="bg-[#FAFDFB] border-b border-[#E5E7EB] px-2.5 sm:px-5 py-1">
          <div
            ref={slider2Ref}
            onScroll={() => handleSliderScroll('bottom')}
            onMouseDown={(e) => handleMouseDown('bottom', e)}
            onMouseMove={(e) => handleMouseMove('bottom', e)}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className="flex items-center gap-1.5 overflow-x-auto scrollbar-none touch-pan-x cursor-grab active:cursor-grabbing"
          >
            {branches.map((branch) => {
              const isActive = branch.id === activeBranch?.id;
              return (
                <button
                  key={branch.id}
                  ref={isActive ? activeBranchBtnRef : undefined}
                  type="button"
                  onClick={() => handleBranchClick(branch)}
                  className={`h-7 sm:h-8 ps-1 pe-2.5 rounded-lg flex items-center gap-1.5 text-[11px] sm:text-xs whitespace-nowrap shrink-0 border transition cursor-pointer ${
                    isActive
                      ? 'bg-[#E3F6EA] text-[#0F3D24] font-black border-[#00A046]'
                      : 'bg-white text-[#374151] hover:bg-[#EFFAF3] hover:border-[#B5E5C8] font-bold border-[#E5E7EB]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center shrink-0 overflow-hidden ${
                      isActive ? 'bg-white ring-1 ring-[#00A046]/30' : 'bg-[#EFFAF3]'
                    }`}
                  >
                    <img
                      src={branch.imageUrl}
                      alt={isAr ? branch.labelAr : branch.labelEn}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span>{isAr ? branch.labelAr : branch.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Clean Borderless Products Grid (No card background box — only image, name, rating, and Add button) */}
      <div className="flex-1 bg-white p-3 sm:p-5 space-y-8">
        {displayedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3.5 gap-y-6 sm:gap-x-6 sm:gap-y-7">
            {displayedProducts.map((product) => {
              const name =
                !isAr && product.nameEn
                  ? product.nameEn
                  : getLocalizedText(product.nameAr, language);
              const bestOffer = product.offers[0];
              const isAdded = addedBarcode === product.barcode;
              const ratingValue = (product.rating || 4.8).toFixed(1);

              return (
                <div
                  key={product.barcode}
                  onClick={() => onCompareOffers(product)}
                  className="group flex flex-col cursor-pointer"
                >
                  {/* Pure Product Image Only (no box background, no card border) */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Minimal Text: Name + Rating + Add/Buy Button */}
                  <div className="pt-2.5 flex-1 flex flex-col justify-between gap-2">
                    <div className="space-y-1">
                      <h3 className="text-xs sm:text-sm font-bold text-[#1F2328] group-hover:text-[#00A046] line-clamp-2 leading-snug transition">
                        {name}
                      </h3>

                      <div className="flex items-center gap-1 text-xs font-bold text-[#1F2328] tabular-nums">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                        <span>{ratingValue}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(e, product)}
                      disabled={!bestOffer || bestOffer.availableStock <= 0}
                      className={`w-full h-8 sm:h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer ${
                        isAdded
                          ? 'bg-[#0F3D24] text-white'
                          : 'bg-[#00A046] hover:bg-[#008a3c] text-white disabled:bg-gray-300'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{isAr ? 'تمت الإضافة' : 'Added'}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{isAr ? 'أضف للسلة' : 'Add to Cart'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center bg-white rounded-2xl border border-[#E5E7EB]">
            <Store className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-[#1F2328]">
              {isAr ? 'لا توجد منتجات مطابقة في هذا الفرع' : 'No matching products'}
            </p>
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                setActiveBranchId(branches[0]?.id || 'all');
                onSelectBranchSubCategory('الكل');
              }}
              className="mt-3 px-4 py-2 rounded-xl bg-[#00A046] text-white text-xs font-bold cursor-pointer"
            >
              {isAr ? 'عرض جميع فروع القسم' : 'Show All Branches'}
            </button>
          </div>
        )}

        {/* Complementary / Similar Products Strip (Matching clean borderless style) */}
        {alsoBoughtProducts.length > 0 && (
          <div className="pt-5 border-t border-[#F1F5F9]">
            <h3 className="text-sm sm:text-base font-black text-[#0F3D24] mb-3.5">
              {isAr ? 'منتجات مشابهة' : 'Similar Products'}
            </h3>

            <div className="flex items-stretch gap-3.5 sm:gap-5 overflow-x-auto scrollbar-none pb-2 snap-x">
              {alsoBoughtProducts.map((item) => {
                const itemName =
                  !isAr && item.nameEn
                    ? item.nameEn
                    : getLocalizedText(item.nameAr, language);
                const bestItemOffer = item.offers[0];
                const isItemAdded = addedBarcode === item.barcode;
                const itemRating = (item.rating || 4.8).toFixed(1);

                return (
                  <div
                    key={item.barcode}
                    onClick={() => onCompareOffers(item)}
                    className="group w-36 sm:w-44 shrink-0 snap-start flex flex-col cursor-pointer"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={itemName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex-1 flex flex-col justify-between gap-2 text-start">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#1F2328] group-hover:text-[#00A046] line-clamp-2 leading-snug block transition">
                          {itemName}
                        </span>

                        <div className="flex items-center gap-2 text-[11px] text-[#6B7280] tabular-nums">
                          <span className="inline-flex items-center gap-0.5 font-bold text-[#1F2328]">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                            <span>{itemRating}</span>
                          </span>
                          <span className="inline-flex items-center gap-0.5">
                            <Package className="w-3 h-3 text-[#00A046]" />
                            <span>{item.packageQuantity || 1}</span>
                          </span>
                          <span className="inline-flex items-center gap-0.5">
                            <Truck className="w-3 h-3 text-[#00A046]" />
                            <span>
                              {item.fastestDeliveryDays <= 1
                                ? isAr
                                  ? '24س'
                                  : '24h'
                                : isAr
                                ? `${item.fastestDeliveryDays}ي`
                                : `${item.fastestDeliveryDays}d`}
                            </span>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(e, item)}
                        disabled={!bestItemOffer || bestItemOffer.availableStock <= 0}
                        className={`w-full h-8 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition active:scale-[0.98] cursor-pointer ${
                          isItemAdded
                            ? 'bg-[#0F3D24] text-white'
                            : 'bg-[#00A046] hover:bg-[#008a3c] text-white disabled:bg-gray-300'
                        }`}
                      >
                        {isItemAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>{isAr ? 'تمت الإضافة' : 'Added'}</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>{isAr ? 'أضف للسلة' : 'Add to Cart'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
