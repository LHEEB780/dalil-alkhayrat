import React, { useMemo, useState } from 'react';
import {
  SlidersHorizontal,
  X,
  Check,
  Search,
  RotateCcw,
  ArrowUpDown,
  ShieldCheck,
  Tag,
  PackageCheck
} from 'lucide-react';
import { Language } from '../types/index.ts';
import {
  ProductFilterState,
  ProductFilterFacets,
  ProductSortBy,
  ProductStorageType,
  EMPTY_PRODUCT_FILTERS,
  countActiveFilters
} from '../../shared/productFilters.ts';
import {
  translations,
  getCountryLabel,
  getStorageTypeLabel,
  getBrandDisplayName,
  getLocalizedText
} from '../utils/translations.ts';

interface ProductFilterControlsBarProps {
  filters: ProductFilterState;
  onChangeSort: (sortBy: ProductSortBy) => void;
  onOpenDrawer: () => void;
  language: Language;
  compact?: boolean;
}

export const ProductFilterControlsBar: React.FC<ProductFilterControlsBarProps> = ({
  filters,
  onChangeSort,
  onOpenDrawer,
  language,
  compact = false
}) => {
  const isAr = language === 'ar';
  const t = translations[language];
  const activeCount = countActiveFilters(filters);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={onOpenDrawer}
        data-testid="open-filters-btn"
        className={`inline-flex items-center gap-1.5 ${
          compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-1.5 text-xs'
        } rounded-xl border font-bold transition cursor-pointer shrink-0 whitespace-nowrap ${
          activeCount > 0
            ? 'bg-[#EFFAF3] border-[#00A046] text-[#0F3D24]'
            : 'bg-white border-[#E5E7EB] hover:border-[#00A046] text-[#1F2328]'
        }`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-[#00A046]" />
        <span>{t.filterBtnLabel}</span>
        {activeCount > 0 && (
          <span
            data-testid="active-filters-badge"
            className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#00A046] text-white text-[10px] font-black inline-flex items-center justify-center tabular-nums"
          >
            {activeCount}
          </span>
        )}
      </button>

      <div className="relative inline-flex items-center shrink-0">
        <ArrowUpDown
          className={`w-3.5 h-3.5 text-[#6B7280] pointer-events-none absolute ${
            isAr ? 'right-2.5' : 'left-2.5'
          }`}
        />
        <select
          value={filters.sortBy}
          onChange={(e) => onChangeSort(e.target.value as ProductSortBy)}
          aria-label={t.sortLabel}
          data-testid="product-sort-select"
          className={`${
            compact ? 'py-1.5 text-[11px]' : 'py-1.5 text-xs'
          } ${
            isAr ? 'pr-7 pl-3' : 'pl-7 pr-3'
          } rounded-xl border border-[#E5E7EB] bg-white text-[#1F2328] font-bold focus:outline-hidden focus:ring-2 focus:ring-[#00A046] cursor-pointer`}
        >
          <option value="relevance">{t.sortRelevance}</option>
          <option value="price_asc">{t.sortPriceAsc}</option>
          <option value="price_desc">{t.sortPriceDesc}</option>
          <option value="rating_desc">{t.sortRatingDesc}</option>
          <option value="discount_desc">{t.sortDiscountDesc}</option>
        </select>
      </div>
    </div>
  );
};

interface ProductActiveFilterChipsProps {
  filters: ProductFilterState;
  facets: ProductFilterFacets;
  onChangeFilters: (next: ProductFilterState) => void;
  language: Language;
}

export const ProductActiveFilterChips: React.FC<ProductActiveFilterChipsProps> = ({
  filters,
  facets,
  onChangeFilters,
  language
}) => {
  const isAr = language === 'ar';
  const t = translations[language];
  const activeCount = countActiveFilters(filters);

  if (activeCount === 0) return null;

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  for (const brandVal of filters.brands) {
    const match = facets.brands.find((b) => b.value === brandVal);
    const label = getBrandDisplayName(
      match?.brandId || brandVal,
      match?.brandName || brandVal,
      language
    );
    chips.push({
      key: `brand_${brandVal}`,
      label: `${t.filterBrand}: ${label}`,
      onRemove: () =>
        onChangeFilters({
          ...filters,
          brands: filters.brands.filter((b) => b !== brandVal)
        })
    });
  }

  for (const countryVal of filters.countries) {
    chips.push({
      key: `country_${countryVal}`,
      label: `${t.filterCountry}: ${getCountryLabel(countryVal, language)}`,
      onRemove: () =>
        onChangeFilters({
          ...filters,
          countries: filters.countries.filter((c) => c !== countryVal)
        })
    });
  }

  for (const stVal of filters.storageTypes) {
    chips.push({
      key: `storage_${stVal}`,
      label: `${t.filterStorageType}: ${getStorageTypeLabel(stVal, language)}`,
      onRemove: () =>
        onChangeFilters({
          ...filters,
          storageTypes: filters.storageTypes.filter((s) => s !== stVal)
        })
    });
  }

  for (const suppId of filters.supplierIds) {
    const suppMatch = facets.suppliers.find((s) => s.value === suppId);
    const suppLabel = suppMatch
      ? getLocalizedText(suppMatch.supplierName, language)
      : suppId;
    chips.push({
      key: `supplier_${suppId}`,
      label: `${t.filterSupplier}: ${suppLabel}`,
      onRemove: () =>
        onChangeFilters({
          ...filters,
          supplierIds: filters.supplierIds.filter((id) => id !== suppId)
        })
    });
  }

  if (filters.inStockOnly) {
    chips.push({
      key: 'inStockOnly',
      label: t.filterInStockOnly,
      onRemove: () => onChangeFilters({ ...filters, inStockOnly: false })
    });
  }

  if (filters.minPriceIQD !== undefined || filters.maxPriceIQD !== undefined) {
    const minTxt =
      filters.minPriceIQD !== undefined
        ? filters.minPriceIQD.toLocaleString('en-US')
        : '0';
    const maxTxt =
      filters.maxPriceIQD !== undefined
        ? filters.maxPriceIQD.toLocaleString('en-US')
        : '∞';
    chips.push({
      key: 'priceRange',
      label: `${isAr ? 'السعر' : 'Price'}: ${minTxt} - ${maxTxt} ${t.iqd}`,
      onRemove: () =>
        onChangeFilters({
          ...filters,
          minPriceIQD: undefined,
          maxPriceIQD: undefined
        })
    });
  }

  if (filters.onSaleOnly) {
    chips.push({
      key: 'onSaleOnly',
      label: t.filterOnSaleOnly,
      onRemove: () => onChangeFilters({ ...filters, onSaleOnly: false })
    });
  }

  if (filters.verifiedOnly) {
    chips.push({
      key: 'verifiedOnly',
      label: t.filterVerifiedOnly,
      onRemove: () => onChangeFilters({ ...filters, verifiedOnly: false })
    });
  }

  return (
    <div
      data-testid="active-filter-chips"
      className="flex items-center gap-1.5 flex-wrap"
    >
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EFFAF3] border border-[#CBEBD7] text-[#0F3D24] text-[11px] font-bold"
        >
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={isAr ? `إزالة ${chip.label}` : `Remove ${chip.label}`}
            className="w-4 h-4 rounded-full hover:bg-[#00A046] hover:text-white inline-flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={() =>
          onChangeFilters({
            ...EMPTY_PRODUCT_FILTERS,
            sortBy: filters.sortBy
          })
        }
        data-testid="clear-all-chips-btn"
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#E5E7EB] bg-white hover:border-[#00A046] text-[#6B7280] hover:text-[#00A046] text-[11px] font-bold transition cursor-pointer"
      >
        <RotateCcw className="w-3 h-3" />
        <span>{t.filterClearAll}</span>
      </button>
    </div>
  );
};

interface ProductFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ProductFilterState;
  facets: ProductFilterFacets;
  onChangeFilters: (next: ProductFilterState) => void;
  language: Language;
}

export const ProductFilterDrawer: React.FC<ProductFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  facets,
  onChangeFilters,
  language
}) => {
  const isAr = language === 'ar';
  const t = translations[language];
  const [brandQuery, setBrandQuery] = useState('');
  const [countryQuery, setCountryQuery] = useState('');

  const activeCount = countActiveFilters(filters);

  const visibleBrands = useMemo(() => {
    const selectedSet = new Set(filters.brands);
    const list = [...facets.brands];
    for (const sel of filters.brands) {
      if (!list.some((b) => b.value === sel)) {
        list.unshift({ value: sel, brandName: sel, count: 0 });
      }
    }
    const q = brandQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((b) => {
      if (selectedSet.has(b.value)) return true;
      const arName = getBrandDisplayName(b.brandId, b.brandName, 'ar').toLowerCase();
      const enName = getBrandDisplayName(b.brandId, b.brandName, 'en').toLowerCase();
      return arName.includes(q) || enName.includes(q) || b.value.toLowerCase().includes(q);
    });
  }, [facets.brands, filters.brands, brandQuery]);

  const visibleCountries = useMemo(() => {
    const selectedSet = new Set(filters.countries);
    const list = [...facets.countries];
    for (const sel of filters.countries) {
      if (!list.some((c) => c.value === sel)) {
        list.unshift({ value: sel, count: 0 });
      }
    }
    const q = countryQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => {
      if (selectedSet.has(c.value)) return true;
      const arName = getCountryLabel(c.value, 'ar').toLowerCase();
      const enName = getCountryLabel(c.value, 'en').toLowerCase();
      return arName.includes(q) || enName.includes(q);
    });
  }, [facets.countries, filters.countries, countryQuery]);

  const visibleStorageTypes = useMemo(() => {
    const list = [...facets.storageTypes];
    for (const sel of filters.storageTypes) {
      if (!list.some((s) => s.value === sel)) {
        list.push({ value: sel, count: 0 });
      }
    }
    return list;
  }, [facets.storageTypes, filters.storageTypes]);

  const visibleSuppliers = useMemo(() => {
    const list = [...facets.suppliers];
    for (const sel of filters.supplierIds) {
      if (!list.some((s) => s.value === sel)) {
        list.push({ value: sel, supplierName: sel, count: 0 });
      }
    }
    return list;
  }, [facets.suppliers, filters.supplierIds]);

  if (!isOpen) return null;

  const toggleArrayValue = <T extends string>(arr: T[], value: T): T[] =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const handlePriceInputChange = (field: 'minPriceIQD' | 'maxPriceIQD', rawValue: string) => {
    const cleaned = rawValue.replace(/[^\d]/g, '');
    if (!cleaned) {
      onChangeFilters({ ...filters, [field]: undefined });
      return;
    }
    const num = Number(cleaned);
    onChangeFilters({
      ...filters,
      [field]: Number.isFinite(num) && num >= 0 ? num : undefined
    });
  };

  const handleClearAll = () => {
    setBrandQuery('');
    setCountryQuery('');
    onChangeFilters({
      ...EMPTY_PRODUCT_FILTERS,
      sortBy: filters.sortBy
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-end sm:items-stretch sm:justify-end font-brand"
      dir={isAr ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div
        data-testid="product-filter-drawer"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-none max-h-[88vh] sm:max-h-none sm:h-full flex flex-col shadow-2xl border-t sm:border-t-0 sm:border-s border-[#E5E7EB]"
      >
        {/* Mobile grab handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 bg-[#F7F8FA] rounded-t-3xl">
          <span className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Drawer Header */}
        <div className="px-4 py-3.5 border-b border-[#E5E7EB] bg-[#F7F8FA] sm:rounded-none flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00A046] text-white flex items-center justify-center shadow-xs shrink-0">
              <SlidersHorizontal className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-[#1F2328]">
                  {t.filterTitle}
                </h3>
                {activeCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#EFFAF3] border border-[#CBEBD7] text-[#00A046] text-[11px] font-black tabular-nums">
                    {activeCount}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#6B7280] tabular-nums">
                {t.filterShowProducts(facets.totalMatched)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {activeCount > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-[#00A046] hover:bg-[#EFFAF3] transition cursor-pointer"
              >
                {t.filterClearAll}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={t.close}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Filter Sections */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* 1. Availability, Discounts & Verified Suppliers */}
          {(facets.inStockCount > 0 ||
            filters.inStockOnly ||
            facets.onSaleCount > 0 ||
            filters.onSaleOnly ||
            facets.verifiedOnlyCount > 0 ||
            filters.verifiedOnly) && (
            <section className="space-y-2">
              <h4 className="text-xs font-black text-[#1F2328]">{t.filterAvailability}</h4>
              <div className="space-y-1.5">
                {(facets.inStockCount > 0 || filters.inStockOnly) && (
                  <button
                    type="button"
                    onClick={() =>
                      onChangeFilters({ ...filters, inStockOnly: !filters.inStockOnly })
                    }
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      filters.inStockOnly
                        ? 'bg-[#EFFAF3] border-[#00A046] text-[#0F3D24]'
                        : 'bg-white border-[#E5E7EB] hover:border-[#00A046] text-[#1F2328]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <PackageCheck className="w-4 h-4 text-[#00A046]" />
                      <span>{t.filterInStockOnly}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-[11px] text-[#6B7280] tabular-nums">
                        ({facets.inStockCount})
                      </span>
                      <span
                        className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center ${
                          filters.inStockOnly
                            ? 'bg-[#00A046] border-[#00A046] text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {filters.inStockOnly && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                    </span>
                  </button>
                )}

                {(facets.onSaleCount > 0 || filters.onSaleOnly) && (
                  <button
                    type="button"
                    onClick={() =>
                      onChangeFilters({ ...filters, onSaleOnly: !filters.onSaleOnly })
                    }
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      filters.onSaleOnly
                        ? 'bg-[#EFFAF3] border-[#00A046] text-[#0F3D24]'
                        : 'bg-white border-[#E5E7EB] hover:border-[#00A046] text-[#1F2328]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[#00A046]" />
                      <span>{t.filterOnSaleOnly}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-[11px] text-[#6B7280] tabular-nums">
                        ({facets.onSaleCount})
                      </span>
                      <span
                        className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center ${
                          filters.onSaleOnly
                            ? 'bg-[#00A046] border-[#00A046] text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {filters.onSaleOnly && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                    </span>
                  </button>
                )}

                {(facets.verifiedOnlyCount > 0 || filters.verifiedOnly) && (
                  <button
                    type="button"
                    onClick={() =>
                      onChangeFilters({ ...filters, verifiedOnly: !filters.verifiedOnly })
                    }
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      filters.verifiedOnly
                        ? 'bg-[#EFFAF3] border-[#00A046] text-[#0F3D24]'
                        : 'bg-white border-[#E5E7EB] hover:border-[#00A046] text-[#1F2328]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#00A046]" />
                      <span>{t.filterVerifiedOnly}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-[11px] text-[#6B7280] tabular-nums">
                        ({facets.verifiedOnlyCount})
                      </span>
                      <span
                        className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center ${
                          filters.verifiedOnly
                            ? 'bg-[#00A046] border-[#00A046] text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {filters.verifiedOnly && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                    </span>
                  </button>
                )}
              </div>
            </section>
          )}

          {/* 2. Price Range IQD */}
          {(facets.priceBounds.max > 0 ||
            filters.minPriceIQD !== undefined ||
            filters.maxPriceIQD !== undefined) && (
            <section className="space-y-2 pt-3 border-t border-[#F1F5F9]">
              <h4 className="text-xs font-black text-[#1F2328]">{t.filterPriceRange}</h4>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-[#6B7280] font-bold mb-1">
                    {t.filterPriceFrom}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    data-testid="filter-min-price"
                    value={filters.minPriceIQD ?? ''}
                    onChange={(e) => handlePriceInputChange('minPriceIQD', e.target.value)}
                    placeholder={
                      facets.priceBounds.min > 0
                        ? facets.priceBounds.min.toLocaleString('en-US')
                        : '0'
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] focus:bg-white text-xs font-bold text-[#1F2328] focus:outline-hidden focus:ring-2 focus:ring-[#00A046] tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#6B7280] font-bold mb-1">
                    {t.filterPriceTo}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    data-testid="filter-max-price"
                    value={filters.maxPriceIQD ?? ''}
                    onChange={(e) => handlePriceInputChange('maxPriceIQD', e.target.value)}
                    placeholder={
                      facets.priceBounds.max > 0
                        ? facets.priceBounds.max.toLocaleString('en-US')
                        : ''
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] focus:bg-white text-xs font-bold text-[#1F2328] focus:outline-hidden focus:ring-2 focus:ring-[#00A046] tabular-nums"
                  />
                </div>
              </div>
            </section>
          )}

          {/* 3. Storage Type */}
          {visibleStorageTypes.length > 0 && (
            <section className="space-y-2 pt-3 border-t border-[#F1F5F9]">
              <h4 className="text-xs font-black text-[#1F2328]">{t.filterStorageType}</h4>
              <div className="flex flex-wrap gap-1.5">
                {visibleStorageTypes.map((opt) => {
                  const selected = filters.storageTypes.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        onChangeFilters({
                          ...filters,
                          storageTypes: toggleArrayValue<ProductStorageType>(
                            filters.storageTypes,
                            opt.value
                          )
                        })
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        selected
                          ? 'bg-[#00A046] border-[#00A046] text-white'
                          : 'bg-white border-[#E5E7EB] hover:border-[#00A046] text-[#1F2328]'
                      }`}
                    >
                      <span>{getStorageTypeLabel(opt.value, language)}</span>
                      <span
                        className={`text-[10px] tabular-nums ${
                          selected ? 'text-white/90' : 'text-[#6B7280]'
                        }`}
                      >
                        ({opt.count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* 4. Suppliers */}
          {visibleSuppliers.length > 0 && (
            <section className="space-y-2 pt-3 border-t border-[#F1F5F9]">
              <h4 className="text-xs font-black text-[#1F2328]">{t.filterSupplier}</h4>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pe-1">
                {visibleSuppliers.map((opt) => {
                  const selected = filters.supplierIds.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        onChangeFilters({
                          ...filters,
                          supplierIds: toggleArrayValue(filters.supplierIds, opt.value)
                        })
                      }
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        selected
                          ? 'bg-[#EFFAF3] border-[#00A046] text-[#0F3D24]'
                          : 'bg-white border-[#E5E7EB] hover:border-[#00A046] text-[#1F2328]'
                      }`}
                    >
                      <span className="truncate text-start">
                        {getLocalizedText(opt.supplierName, language)}
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-[#6B7280] tabular-nums">
                          ({opt.count})
                        </span>
                        <span
                          className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                            selected
                              ? 'bg-[#00A046] border-[#00A046] text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {selected && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* 5. Brands */}
          {visibleBrands.length > 0 && (
            <section className="space-y-2 pt-3 border-t border-[#F1F5F9]">
              <h4 className="text-xs font-black text-[#1F2328]">{t.filterBrand}</h4>
              {facets.brands.length > 6 && (
                <div className="relative">
                  <Search
                    className={`w-3.5 h-3.5 text-[#6B7280] absolute ${
                      isAr ? 'right-2.5' : 'left-2.5'
                    } top-2.5`}
                  />
                  <input
                    type="text"
                    value={brandQuery}
                    onChange={(e) => setBrandQuery(e.target.value)}
                    placeholder={t.filterSearchBrandPlaceholder}
                    className={`w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl py-1.5 ${
                      isAr ? 'pr-8 pl-3' : 'pl-8 pr-3'
                    } text-xs text-[#1F2328] focus:outline-hidden focus:ring-2 focus:ring-[#00A046]`}
                  />
                </div>
              )}
              <div className="space-y-1 max-h-48 overflow-y-auto pe-1">
                {visibleBrands.map((opt) => {
                  const selected = filters.brands.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        onChangeFilters({
                          ...filters,
                          brands: toggleArrayValue(filters.brands, opt.value)
                        })
                      }
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        selected
                          ? 'bg-[#EFFAF3] border-[#00A046] text-[#0F3D24]'
                          : 'bg-white border-[#E5E7EB] hover:border-[#00A046] text-[#1F2328]'
                      }`}
                    >
                      <span className="truncate text-start">
                        {getBrandDisplayName(opt.brandId, opt.brandName, language)}
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-[#6B7280] tabular-nums">
                          ({opt.count})
                        </span>
                        <span
                          className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                            selected
                              ? 'bg-[#00A046] border-[#00A046] text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {selected && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                      </span>
                    </button>
                  );
                })}
                {visibleBrands.length === 0 && (
                  <p className="text-[11px] text-[#6B7280] py-2 text-center">
                    {t.filterNoOptions}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* 6. Country of Origin */}
          {visibleCountries.length > 0 && (
            <section className="space-y-2 pt-3 border-t border-[#F1F5F9]">
              <h4 className="text-xs font-black text-[#1F2328]">{t.filterCountry}</h4>
              {facets.countries.length > 6 && (
                <div className="relative">
                  <Search
                    className={`w-3.5 h-3.5 text-[#6B7280] absolute ${
                      isAr ? 'right-2.5' : 'left-2.5'
                    } top-2.5`}
                  />
                  <input
                    type="text"
                    value={countryQuery}
                    onChange={(e) => setCountryQuery(e.target.value)}
                    placeholder={t.filterSearchCountryPlaceholder}
                    className={`w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl py-1.5 ${
                      isAr ? 'pr-8 pl-3' : 'pl-8 pr-3'
                    } text-xs text-[#1F2328] focus:outline-hidden focus:ring-2 focus:ring-[#00A046]`}
                  />
                </div>
              )}
              <div className="space-y-1 max-h-48 overflow-y-auto pe-1">
                {visibleCountries.map((opt) => {
                  const selected = filters.countries.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        onChangeFilters({
                          ...filters,
                          countries: toggleArrayValue(filters.countries, opt.value)
                        })
                      }
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        selected
                          ? 'bg-[#EFFAF3] border-[#00A046] text-[#0F3D24]'
                          : 'bg-white border-[#E5E7EB] hover:border-[#00A046] text-[#1F2328]'
                      }`}
                    >
                      <span className="truncate text-start">
                        {getCountryLabel(opt.value, language)}
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-[#6B7280] tabular-nums">
                          ({opt.count})
                        </span>
                        <span
                          className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                            selected
                              ? 'bg-[#00A046] border-[#00A046] text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {selected && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                      </span>
                    </button>
                  );
                })}
                {visibleCountries.length === 0 && (
                  <p className="text-[11px] text-[#6B7280] py-2 text-center">
                    {t.filterNoOptions}
                  </p>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="p-4 border-t border-[#E5E7EB] bg-[#F7F8FA] flex items-center gap-2.5">
          {activeCount > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-gray-50 text-xs font-bold text-[#1F2328] transition cursor-pointer shrink-0"
            >
              {t.filterClearAll}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            data-testid="apply-filters-btn"
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#00A046] hover:bg-[#008A3C] text-white text-xs sm:text-sm font-black transition shadow-xs cursor-pointer tabular-nums"
          >
            {t.filterShowProducts(facets.totalMatched)}
          </button>
        </div>
      </div>
    </div>
  );
};
