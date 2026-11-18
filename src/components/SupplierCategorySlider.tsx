import React, { useMemo } from 'react';
import { LayoutGrid } from 'lucide-react';
import {
  WHOLESALE_CATEGORIES,
  CATEGORY_BRANCHES_MAP,
  CategoryBranchItem,
} from '../data/categories';
import { Language } from '../types';

export interface SupplierCategorizedItem {
  barcode: string;
  nameAr?: string;
  productName?: string;
  category?: string;
  subCategory?: string;
  imageUrl?: string;
}

/**
 * Helper to check if a supplier/van item matches the active category & sub-branch.
 */
export function matchesSupplierCategoryAndBranch(
  item: SupplierCategorizedItem,
  selectedCategory: string,
  selectedBranchId: string
): boolean {
  if (!selectedCategory || selectedCategory === 'الكل') {
    return true;
  }
  if (item.category !== selectedCategory) {
    return false;
  }
  if (!selectedBranchId || selectedBranchId === 'all') {
    return true;
  }

  const branches = CATEGORY_BRANCHES_MAP[selectedCategory] || [];
  const branch = branches.find((b) => b.id === selectedBranchId);
  if (!branch) return true;

  const title = (item.nameAr || item.productName || '').toLowerCase();
  const sub = (item.subCategory || '').toLowerCase();

  if (branch.subCategoryKey) {
    const key = branch.subCategoryKey.toLowerCase();
    if (sub === key || sub.includes(key) || title.includes(key)) {
      return true;
    }
  }
  if (branch.keywords && branch.keywords.length > 0) {
    return branch.keywords.some((kw) => {
      const k = kw.toLowerCase();
      return title.includes(k) || sub.includes(k);
    });
  }
  return true;
}

interface SupplierCategorySliderProps {
  items: SupplierCategorizedItem[];
  selectedCategory: string;
  selectedBranchId: string;
  onSelectCategory: (categoryKey: string) => void;
  onSelectBranch: (branchId: string) => void;
  language: Language;
  supplierLabel?: string;
}

export const SupplierCategorySlider: React.FC<SupplierCategorySliderProps> = ({
  items,
  selectedCategory,
  selectedBranchId,
  onSelectCategory,
  onSelectBranch,
  language,
  supplierLabel,
}) => {
  const isAr = language === 'ar';

  // Derive ONLY the main categories that exist in this supplier's items
  const supplierCategories = useMemo(() => {
    const presentCats = new Set<string>();
    const firstImageByCat = new Map<string, string>();
    for (const item of items) {
      if (item.category) {
        presentCats.add(item.category);
        if (!firstImageByCat.has(item.category) && item.imageUrl) {
          firstImageByCat.set(item.category, item.imageUrl);
        }
      }
    }

    const uniqueMain = WHOLESALE_CATEGORIES.filter(
      (c) => !c.subCategoryKey && presentCats.has(c.categoryKey)
    );

    const matchedKeys = new Set(uniqueMain.map((c) => c.categoryKey));
    const extras = Array.from(presentCats)
      .filter((k) => !matchedKeys.has(k))
      .map((k) => ({
        id: `supp_cat_${k}`,
        categoryKey: k,
        labelAr: k,
        labelEn: k,
        imageUrl: firstImageByCat.get(k) || '/assets/images/white_basmati_rice.jpg',
      }));

    return [...uniqueMain, ...extras];
  }, [items]);

  // Derive ONLY the sub-branches for the currently selected category that have matching items
  const activeBranches = useMemo<CategoryBranchItem[]>(() => {
    if (!selectedCategory || selectedCategory === 'الكل') {
      return [];
    }
    const catItems = items.filter((i) => i.category === selectedCategory);
    const mapped = CATEGORY_BRANCHES_MAP[selectedCategory] || [];
    if (mapped.length === 0) {
      // Fallback: build dynamic sub-branches from item.subCategory if available
      const dynamicSubs = Array.from(
        new Set(catItems.map((i) => i.subCategory).filter(Boolean) as string[])
      );
      if (dynamicSubs.length === 0) return [];
      const catMeta = supplierCategories.find((c) => c.categoryKey === selectedCategory);
      return [
        {
          id: 'all',
          labelAr: 'الكل',
          labelEn: 'All',
          imageUrl: catMeta?.imageUrl || '/assets/images/white_basmati_rice.jpg',
        },
        ...dynamicSubs.map((s) => ({
          id: `dyn_${s}`,
          labelAr: s,
          labelEn: s,
          subCategoryKey: s,
          imageUrl:
            catItems.find((i) => i.subCategory === s)?.imageUrl ||
            catMeta?.imageUrl ||
            '/assets/images/white_basmati_rice.jpg',
        })),
      ];
    }

    // Keep 'all' + only sub-branches that have at least 1 product from this supplier
    const validBranches = mapped.filter((b) => {
      if (b.id === 'all') return true;
      return catItems.some((item) =>
        matchesSupplierCategoryAndBranch(item, selectedCategory, b.id)
      );
    });

    return validBranches.length > 1 ? validBranches : [];
  }, [items, selectedCategory, supplierCategories]);

  if (supplierCategories.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-[#DCE5DC] overflow-hidden shadow-2xs">
      {/* Row 1: Main Supplier Categories (Circular thumbnails, identical to CategoryBranchesView) */}
      <div className="bg-white border-b border-[#F1F5F9] px-2.5 py-2">
        {supplierLabel && (
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-[10.5px] font-bold text-[#5F7164]">
              {isAr ? `أقسام المورد: ${supplierLabel}` : `Supplier Categories: ${supplierLabel}`}
            </span>
            {selectedCategory !== 'الكل' && (
              <button
                type="button"
                onClick={() => {
                  onSelectCategory('الكل');
                  onSelectBranch('all');
                }}
                className="text-[10.5px] font-bold text-[#00A046] hover:underline cursor-pointer"
              >
                {isAr ? 'عرض الكل' : 'Show All'}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar touch-pan-x pb-0.5">
          {/* "الكل" (All supplier categories) chip */}
          <button
            type="button"
            onClick={() => {
              onSelectCategory('الكل');
              onSelectBranch('all');
            }}
            className={`h-8 sm:h-9 ps-1.5 pe-3 rounded-full flex items-center gap-1.5 text-[11px] sm:text-xs whitespace-nowrap shrink-0 border transition cursor-pointer ${
              selectedCategory === 'الكل'
                ? 'bg-[#00A046] text-white border-[#00A046] font-black shadow-2xs'
                : 'bg-[#F8FAFC] text-[#1F2328] border-[#E5E7EB] hover:bg-[#EFFAF3] hover:border-[#00A046]/50 font-bold'
            }`}
          >
            <div
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 ${
                selectedCategory === 'الكل' ? 'bg-white text-[#00A046]' : 'bg-[#EFFAF3] text-[#00A046]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </div>
            <span>{isAr ? 'جميع الأقسام' : 'All Categories'}</span>
          </button>

          {supplierCategories.map((cat) => {
            const isActive = selectedCategory === cat.categoryKey;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onSelectCategory(cat.categoryKey);
                  onSelectBranch('all');
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

      {/* Row 2: Supplier Sub-Categories (Branches) — shown when a main category is selected */}
      {activeBranches.length > 0 && (
        <div className="bg-[#FAFDFB] px-2.5 py-1.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x">
            {activeBranches.map((branch) => {
              const isActive = (selectedBranchId || 'all') === branch.id;
              return (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => onSelectBranch(branch.id)}
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
      )}
    </div>
  );
};
