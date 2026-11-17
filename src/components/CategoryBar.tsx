import React, { useRef } from 'react';
import { LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import { getLocalizedText } from '../utils/translations.ts';
import { WHOLESALE_CATEGORIES, WholesaleCategoryItem } from '../data/categories.ts';

interface CategoryBarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedSubCategory?: string;
  onSelectSubCategory?: (sub: string) => void;
  onOpenAllCategories?: () => void;
  language?: 'ar' | 'en';
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedSubCategory = 'الكل',
  onSelectSubCategory,
  onOpenAllCategories,
  language = 'ar'
}) => {
  const isAr = language === 'ar';
  const rowRef = useRef<HTMLDivElement | null>(null);

  // Drag state for smooth desktop mouse scrolling
  const dragStateRef = useRef<{
    active: boolean;
    startX: number;
    startScrollLeft: number;
    moved: boolean;
  }>({ active: false, startX: 0, startScrollLeft: 0, moved: false });

  // Deduplicate main 9 department items so the bar stays single-row, slim, and uncluttered
  const primaryDepartments = WHOLESALE_CATEGORIES.filter((c) => !c.subCategoryKey);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = rowRef.current;
    if (!el) return;
    dragStateRef.current = {
      active: true,
      startX: e.pageX,
      startScrollLeft: el.scrollLeft,
      moved: false
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const st = dragStateRef.current;
    if (!st.active) return;
    const el = rowRef.current;
    if (!el) return;
    const delta = e.pageX - st.startX;
    if (Math.abs(delta) > 4) {
      st.moved = true;
    }
    el.scrollLeft = st.startScrollLeft - delta;
  };

  const handleMouseUpOrLeave = () => {
    dragStateRef.current.active = false;
  };

  const handleChipClick = (item: WholesaleCategoryItem) => {
    if (dragStateRef.current.moved) {
      dragStateRef.current.moved = false;
      return;
    }
    onSelectCategory(item.categoryKey);
    if (onSelectSubCategory) {
      onSelectSubCategory(item.subCategoryKey || 'الكل');
    }
  };

  const nudgeRow = (direction: 'prev' | 'next') => {
    const el = rowRef.current;
    if (!el) return;
    const step = direction === 'next' ? (isAr ? -240 : 240) : (isAr ? 240 : -240);
    el.scrollBy({ left: step, behavior: 'smooth' });
  };

  const isChipActive = (item: WholesaleCategoryItem) => {
    return (
      selectedCategory === item.categoryKey &&
      (!selectedSubCategory || selectedSubCategory === 'الكل')
    );
  };

  return (
    <div className="bg-white border-b border-[#EAECEF] font-brand select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 relative">
        {/* Desktop subtle horizontal scroll nudge buttons */}
        <button
          type="button"
          onClick={() => nudgeRow('prev')}
          className={`hidden md:flex absolute top-1/2 -translate-y-1/2 ${
            isAr ? 'right-1' : 'left-1'
          } z-10 w-7 h-7 rounded-full bg-white/95 border border-[#E5E7EB] shadow-sm items-center justify-center text-[#1F2328] hover:border-[#00A046] hover:text-[#00A046] transition cursor-pointer`}
          aria-label={isAr ? 'تمرير الأقسام' : 'Scroll categories'}
        >
          {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={() => nudgeRow('next')}
          className={`hidden md:flex absolute top-1/2 -translate-y-1/2 ${
            isAr ? 'left-1' : 'right-1'
          } z-10 w-7 h-7 rounded-full bg-white/95 border border-[#E5E7EB] shadow-sm items-center justify-center text-[#1F2328] hover:border-[#00A046] hover:text-[#00A046] transition cursor-pointer`}
          aria-label={isAr ? 'تمرير الأقسام' : 'Scroll categories'}
        >
          {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Single slim horizontal department row */}
        <div
          ref={rowRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar touch-pan-x cursor-grab active:cursor-grabbing md:px-5"
        >
          {/* Primary 'جميع الأقسام' button */}
          <button
            type="button"
            onClick={() => {
              if (dragStateRef.current.moved) {
                dragStateRef.current.moved = false;
                return;
              }
              if (onOpenAllCategories) {
                onOpenAllCategories();
              } else {
                onSelectCategory('الكل');
                if (onSelectSubCategory) onSelectSubCategory('الكل');
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
              selectedCategory === 'الكل'
                ? 'bg-[#0F3D24] text-white border-[#0F3D24] shadow-2xs'
                : 'bg-[#EFFAF3] text-[#008A3C] border-[#BBF7D0] hover:bg-[#00A046] hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
            <span>{isAr ? 'جميع الأقسام' : 'All Categories'}</span>
          </button>

          {primaryDepartments.map((item) => {
            const active = isChipActive(item);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleChipClick(item)}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                  active
                    ? 'bg-[#00A046] text-white border-[#00A046] shadow-2xs'
                    : 'bg-[#F8FAFC] text-[#111827] hover:bg-[#EFFAF3] hover:border-[#00A046]/50 border-[#E5E7EB]'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-white overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                  <img
                    src={item.imageUrl}
                    alt={isAr ? item.labelAr : item.labelEn}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain mix-blend-multiply"
                    loading="lazy"
                  />
                </div>
                <span>{isAr ? item.labelAr : getLocalizedText(item.labelEn, language)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
