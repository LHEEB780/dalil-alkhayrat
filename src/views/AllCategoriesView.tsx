import React from 'react';
import { ArrowRight, ArrowLeft, LayoutGrid, ShoppingBag } from 'lucide-react';
import { Language, ProductWithOffers } from '../types/index.ts';
import { WHOLESALE_CATEGORIES, WholesaleCategoryItem } from '../data/categories.ts';

interface AllCategoriesViewProps {
  products: ProductWithOffers[];
  language: Language;
  cartCount?: number;
  onOpenCart?: () => void;
  onSelectCategory: (category: string, subCategory?: string) => void;
  onBackToMarketplace: () => void;
}

export const AllCategoriesView: React.FC<AllCategoriesViewProps> = ({
  products,
  language,
  cartCount = 0,
  onOpenCart,
  onSelectCategory,
  onBackToMarketplace
}) => {
  const isAr = language === 'ar';

  const getCategoryCount = (cat: WholesaleCategoryItem) => {
    return products.filter((p) => {
      if (cat.subCategoryKey) {
        return p.category === cat.categoryKey && p.subCategory === cat.subCategoryKey;
      }
      return p.category === cat.categoryKey;
    }).length;
  };

  const handleTileClick = (item: WholesaleCategoryItem) => {
    onSelectCategory(item.categoryKey, item.subCategoryKey || 'الكل');
  };

  return (
    <div className="min-h-screen sm:min-h-[calc(100vh-4rem)] bg-white sm:rounded-2xl border-b sm:border border-[#E5E7EB] shadow-2xs overflow-x-clip font-brand">
      {/* Clean Top Bar (Back button + compact Cart trigger) */}
      <div className="sticky top-0 z-30 px-4 sm:px-6 py-3 border-b border-[#F1F5F9] bg-white sm:rounded-t-2xl flex items-center justify-between gap-2 shadow-[0_4px_14px_-8px_rgba(15,61,36,0.1)]">
        <button
          type="button"
          onClick={onBackToMarketplace}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F4F4EA] hover:bg-[#EBF4EE] border border-[#DCE5DC] hover:border-[#0B5D32] text-xs font-bold text-[#142018] hover:text-[#0B5D32] transition cursor-pointer whitespace-nowrap"
        >
          {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{isAr ? 'رجوع' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-[#6B7280]">
            {isAr ? `${WHOLESALE_CATEGORIES.length} قسماً متاحاً` : `${WHOLESALE_CATEGORIES.length} Categories`}
          </span>

          {onOpenCart && (
            <button
              type="button"
              onClick={onOpenCart}
              aria-label={isAr ? 'عربة التسوق' : 'Shopping Cart'}
              className="relative w-9 h-9 rounded-full bg-[#EFFAF3] hover:bg-[#E0F5E8] border border-[#CBEBD7] flex items-center justify-center text-[#00A046] transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FFCE00] text-[#1F2328] text-[10px] font-black flex items-center justify-center border border-white tabular-nums">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Container */}
      <div className="px-3.5 sm:px-6 py-4 sm:py-6">
        {/* Heading (search + show-all row removed as requested) */}
        <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
          <div className="w-9 h-9 rounded-xl bg-[#E8F8EE] border border-[#B3EBC8] flex items-center justify-center text-[#00A046] shrink-0">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F3D24] tracking-tight leading-none">
              {isAr ? 'جميع الأقسام' : 'All Categories'}
            </h1>
            <p className="text-xs text-[#6B7280] mt-1">
              {isAr
                ? 'اختر القسم لاستعراض فروعه وعروض الموردين بالجملة'
                : 'Choose a category to explore its branches & wholesale offers'}
            </p>
          </div>
        </div>

        {/* 3-Column Mobile / Multi-Column Desktop Category Tiles Grid with LARGER Product Images */}
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
          {WHOLESALE_CATEGORIES.map((cat) => {
            const count = getCategoryCount(cat);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleTileClick(cat)}
                className="group bg-[#EFFAF3] hover:bg-[#E4F7EB] border border-[#D7EFE0] hover:border-[#00A046] rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer text-center min-h-[168px] sm:min-h-[210px]"
              >
                {/* Concise Top Title */}
                <div className="px-1.5 pt-2.5 pb-0.5">
                  <h2 className="text-[12px] sm:text-sm font-extrabold text-[#0F3D24] group-hover:text-[#008236] leading-tight line-clamp-2">
                    {isAr ? cat.labelAr : cat.labelEn}
                  </h2>
                  {count > 0 && (
                    <span className="block text-[10px] font-semibold text-[#00A046]/80 mt-0.5 tabular-nums">
                      {isAr ? `${count} صنف` : `${count} items`}
                    </span>
                  )}
                </div>

                {/* Enlarged Bottom Studio Product Collage Image */}
                <div className="w-full flex-1 px-1 pb-1 pt-1 flex items-end justify-center overflow-hidden">
                  <img
                    src={cat.imageUrl}
                    alt={isAr ? cat.labelAr : cat.labelEn}
                    referrerPolicy="no-referrer"
                    className="w-full h-28 sm:h-36 object-contain mix-blend-multiply scale-105 group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
