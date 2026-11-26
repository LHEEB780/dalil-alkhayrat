export type ProductStorageType = 'ambient' | 'chilled' | 'frozen' | 'dry' | 'controlled';

export type ProductSortBy =
  | 'relevance'
  | 'price_asc'
  | 'price_desc'
  | 'rating_desc'
  | 'discount_desc';

export interface ProductFilterState {
  brands: string[];
  countries: string[];
  storageTypes: ProductStorageType[];
  supplierIds: string[];
  inStockOnly: boolean;
  minPriceIQD?: number;
  maxPriceIQD?: number;
  onSaleOnly: boolean;
  verifiedOnly: boolean;
  sortBy: ProductSortBy;
}

export const EMPTY_PRODUCT_FILTERS: ProductFilterState = {
  brands: [],
  countries: [],
  storageTypes: [],
  supplierIds: [],
  inStockOnly: false,
  minPriceIQD: undefined,
  maxPriceIQD: undefined,
  onSaleOnly: false,
  verifiedOnly: false,
  sortBy: 'relevance'
};

export interface FilterableOffer {
  id: string;
  barcode?: string;
  supplierId: string;
  supplierName: string;
  priceIQD: number;
  availableStock: number;
  isClearanceNearExpiry?: boolean;
  clearanceDiscountPercent?: number;
  verificationStatus?: string;
}

export interface FilterableProduct {
  barcode: string;
  nameAr: string;
  nameEn?: string;
  brand?: string;
  brandId?: string;
  category?: string;
  subCategory?: string;
  unit?: string;
  packSize?: string;
  packageQuantity?: number;
  descriptionAr?: string;
  storageType?: ProductStorageType;
  countryOfOrigin?: string;
  oldPrice?: number;
  discountPercent?: number;
  minPrice?: number;
  rating?: number;
  reviewsCount?: number;
  offers?: FilterableOffer[];
}

export interface FilterableSupplier {
  id: string;
  companyName?: string;
  verificationStatus?: string;
  isVerified?: boolean;
}

export interface ApplyProductFiltersContext {
  suppliers?: FilterableSupplier[];
  eligibleSupplierIds?: Set<string> | string[];
  searchScores?: Map<string, number> | Record<string, number>;
  query?: string;
}

export interface BrandFacetOption {
  value: string;
  brandId?: string;
  brandName: string;
  count: number;
}

export interface CountryFacetOption {
  value: string;
  count: number;
}

export interface StorageFacetOption {
  value: ProductStorageType;
  count: number;
}

export interface SupplierFacetOption {
  value: string;
  supplierName: string;
  verificationStatus?: string;
  count: number;
}

export interface ProductFilterFacets {
  brands: BrandFacetOption[];
  countries: CountryFacetOption[];
  storageTypes: StorageFacetOption[];
  suppliers: SupplierFacetOption[];
  inStockCount: number;
  onSaleCount: number;
  verifiedOnlyCount: number;
  priceBounds: {
    min: number;
    max: number;
  };
  totalMatched: number;
}

export const ALL_STORAGE_TYPES: ProductStorageType[] = [
  'ambient',
  'chilled',
  'frozen',
  'dry',
  'controlled'
];

export function normalizeProductFilters(
  filters?: Partial<ProductFilterState> | null
): ProductFilterState {
  const minPrice =
    typeof filters?.minPriceIQD === 'number' &&
    Number.isFinite(filters.minPriceIQD) &&
    filters.minPriceIQD >= 0
      ? filters.minPriceIQD
      : undefined;
  const maxPrice =
    typeof filters?.maxPriceIQD === 'number' &&
    Number.isFinite(filters.maxPriceIQD) &&
    filters.maxPriceIQD >= 0
      ? filters.maxPriceIQD
      : undefined;

  return {
    brands: Array.isArray(filters?.brands) ? filters!.brands.filter(Boolean) : [],
    countries: Array.isArray(filters?.countries) ? filters!.countries.filter(Boolean) : [],
    storageTypes: Array.isArray(filters?.storageTypes)
      ? filters!.storageTypes.filter((s): s is ProductStorageType =>
          ALL_STORAGE_TYPES.includes(s as ProductStorageType)
        )
      : [],
    supplierIds: Array.isArray(filters?.supplierIds) ? filters!.supplierIds.filter(Boolean) : [],
    inStockOnly: Boolean(filters?.inStockOnly),
    minPriceIQD: minPrice,
    maxPriceIQD: maxPrice,
    onSaleOnly: Boolean(filters?.onSaleOnly),
    verifiedOnly: Boolean(filters?.verifiedOnly),
    sortBy: filters?.sortBy || 'relevance'
  };
}

export function countActiveFilters(filters?: Partial<ProductFilterState> | null): number {
  const f = normalizeProductFilters(filters);
  let count = 0;
  count += f.brands.length;
  count += f.countries.length;
  count += f.storageTypes.length;
  count += f.supplierIds.length;
  if (f.inStockOnly) count += 1;
  if (f.minPriceIQD !== undefined || f.maxPriceIQD !== undefined) count += 1;
  if (f.onSaleOnly) count += 1;
  if (f.verifiedOnly) count += 1;
  return count;
}

export function getProductBrandKey(product: FilterableProduct): string {
  return (product.brandId || product.brand || '').trim();
}

function buildOffersByBarcode(
  offers: FilterableOffer[] | undefined,
  eligibleSupplierSet: Set<string> | null
): Map<string, FilterableOffer[]> {
  const map = new Map<string, FilterableOffer[]>();
  if (!offers || offers.length === 0) return map;
  for (const offer of offers) {
    if (!offer || !offer.barcode) continue;
    if (eligibleSupplierSet && !eligibleSupplierSet.has(offer.supplierId)) continue;
    let list = map.get(offer.barcode);
    if (!list) {
      list = [];
      map.set(offer.barcode, list);
    }
    list.push(offer);
  }
  return map;
}

function getEligibleOffersForProduct(
  product: FilterableProduct,
  offersByBarcode: Map<string, FilterableOffer[]>,
  hasExternalOffers: boolean,
  eligibleSupplierSet: Set<string> | null
): FilterableOffer[] {
  if (hasExternalOffers) {
    return offersByBarcode.get(product.barcode) || [];
  }
  const embedded = Array.isArray(product.offers) ? product.offers : [];
  if (!eligibleSupplierSet) return embedded;
  return embedded.filter((o) => eligibleSupplierSet.has(o.supplierId));
}

function isOfferSupplierVerified(
  offer: FilterableOffer,
  supplierMap: Map<string, FilterableSupplier> | null
): boolean {
  if (supplierMap) {
    const supp = supplierMap.get(offer.supplierId);
    if (!supp) return false;
    if (supp.verificationStatus) {
      return supp.verificationStatus !== 'pending';
    }
    return supp.isVerified !== false;
  }
  if (offer.verificationStatus) {
    return offer.verificationStatus !== 'pending';
  }
  return true;
}

function getLowestOfferPrice(
  product: FilterableProduct,
  productOffers: FilterableOffer[]
): number | null {
  const validPrices = productOffers
    .map((o) => o.priceIQD)
    .filter((p) => typeof p === 'number' && Number.isFinite(p) && p > 0);
  if (validPrices.length > 0) {
    return Math.min(...validPrices);
  }
  if (typeof product.minPrice === 'number' && Number.isFinite(product.minPrice) && product.minPrice > 0) {
    return product.minPrice;
  }
  return null;
}

function getEffectiveDiscountPercent(
  product: FilterableProduct,
  productOffers: FilterableOffer[],
  lowestPrice: number | null
): number {
  let maxDiscount =
    typeof product.discountPercent === 'number' &&
    Number.isFinite(product.discountPercent) &&
    product.discountPercent > 0
      ? product.discountPercent
      : 0;

  if (
    typeof product.oldPrice === 'number' &&
    Number.isFinite(product.oldPrice) &&
    lowestPrice !== null &&
    product.oldPrice > lowestPrice
  ) {
    const computed = Math.round(((product.oldPrice - lowestPrice) / product.oldPrice) * 100);
    if (computed > maxDiscount) maxDiscount = computed;
  }

  for (const offer of productOffers) {
    if (
      typeof offer.clearanceDiscountPercent === 'number' &&
      Number.isFinite(offer.clearanceDiscountPercent) &&
      offer.clearanceDiscountPercent > maxDiscount
    ) {
      maxDiscount = offer.clearanceDiscountPercent;
    } else if (offer.isClearanceNearExpiry && maxDiscount === 0) {
      maxDiscount = 1;
    }
  }

  return maxDiscount;
}

function isProductOnSale(
  product: FilterableProduct,
  productOffers: FilterableOffer[],
  lowestPrice: number | null
): boolean {
  if (
    typeof product.discountPercent === 'number' &&
    Number.isFinite(product.discountPercent) &&
    product.discountPercent > 0
  ) {
    return true;
  }
  if (
    typeof product.oldPrice === 'number' &&
    Number.isFinite(product.oldPrice) &&
    lowestPrice !== null &&
    product.oldPrice > lowestPrice
  ) {
    return true;
  }
  return productOffers.some(
    (o) =>
      Boolean(o.isClearanceNearExpiry) ||
      (typeof o.clearanceDiscountPercent === 'number' &&
        Number.isFinite(o.clearanceDiscountPercent) &&
        o.clearanceDiscountPercent > 0)
  );
}

// ================= SIZE & UNIT-AWARE BILINGUAL SEARCH =================

type CanonicalUnitGroup = 'ml' | 'kg' | 'g' | 'l';
type BaseMetricFamily = 'volume_ml' | 'weight_g';

const UNIT_TOKEN_MAP: Record<string, CanonicalUnitGroup> = {
  ml: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  مل: 'ml',
  ملي: 'ml',
  ملل: 'ml',
  مليلتر: 'ml',
  ملليتر: 'ml',
  l: 'l',
  ltr: 'l',
  liter: 'l',
  liters: 'l',
  litre: 'l',
  litres: 'l',
  لتر: 'l',
  ليتر: 'l',
  لترات: 'l',
  g: 'g',
  gm: 'g',
  gr: 'g',
  gram: 'g',
  grams: 'g',
  غرام: 'g',
  جرام: 'g',
  غم: 'g',
  جم: 'g',
  غ: 'g',
  kg: 'kg',
  kilo: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  كغم: 'kg',
  كجم: 'kg',
  كيلو: 'kg',
  كيلوغرام: 'kg',
  كيلوجرام: 'kg'
};

interface ParsedSizeHint {
  rawNumStr: string;
  numValue: number;
  unitCanonical: CanonicalUnitGroup | null;
  baseFamily?: BaseMetricFamily;
  baseAmount?: number;
}

const WORD_SYNONYM_GROUPS: string[][] = [
  ['ماء', 'مياه', 'water'],
  ['زيت', 'زيوت', 'oil'],
  ['حليب', 'لبن', 'milk'],
  ['جبن', 'جبنة', 'اجبان', 'cheese'],
  ['شاي', 'جاي', 'tea'],
  ['قهوة', 'بن', 'coffee'],
  ['معكرونة', 'مكرونة', 'باستا', 'pasta'],
  ['طماطم', 'طماطة', 'بندورة', 'tomato'],
  ['عصير', 'عصائر', 'عصاير', 'juice'],
  ['دجاج', 'chicken'],
  ['تونة', 'tuna']
];

const BILINGUAL_SUBCATEGORY_KEYWORDS: Record<string, string[]> = {
  'أرز': ['rice', 'basmati', 'anbar', 'long grain', 'mahmood rice'],
  'سكر ومحليات': ['sugar', 'white sugar', 'cane sugar', 'sweeteners', 'brown sugar', 'stevia'],
  'طحين ونشويات': ['flour', 'wheat flour', 'starch', 'cornstarch'],
  'بقوليات': ['lentils', 'chickpeas', 'beans', 'pulses', 'legumes'],
  'مكرونة وشعرية ونودلز': ['pasta', 'spaghetti', 'vermicelli', 'noodles', 'macaroni', 'barilla', 'indomie'],
  'زيت دوار الشمس': ['sunflower oil', 'cooking oil', 'afia', 'vegetable oil', 'oil'],
  'زيت الذرة': ['corn oil', 'cooking oil', 'mazola', 'oil'],
  'زيت الزيتون': ['olive oil', 'extra virgin', 'oil'],
  'معجون وصلصة الطماطم': ['tomato paste', 'tomato sauce', 'crushed tomatoes'],
  'حليب بودرة ومبخر ومكثف': ['milk powder', 'nido', 'evaporated milk', 'condensed milk', 'milk', 'dairy'],
  'أجبان': ['cheese', 'mozzarella', 'cheddar', 'feta', 'kiri', 'puck', 'dairy'],
  'بطاطا مجمدة': ['french fries', 'frozen potatoes', 'fries', 'wedges', 'frozen'],
  'مياه معدنية': ['mineral water', 'water', 'bottled water', 'al-waha', 'aquafina', 'beverages', 'drinks'],
  'مياه شرب وجالونات': ['drinking water', 'water', 'gallon water', 'bottled water', 'beverages'],
  'شاي أسود': ['black tea', 'ceylon tea', 'tea', 'mahmood tea', 'ahmad tea'],
  'قهوة عربية وتركية': ['arabic coffee', 'turkish coffee', 'coffee', 'cardamom', 'al-ameed'],
  'حبوب كاملة': ['ground coffee', 'coffee beans', 'whole beans', 'espresso', 'lavazza', 'coffee'],
  'القهوة المقطرة': ['drip coffee', 'filter coffee', 'pour over', 'coffee'],
  'أرابيكا': ['arabica', 'arabica beans', 'coffee'],
  'سريعة التحضير': ['instant coffee', 'nescafe', '3 in 1', 'coffee'],
  'كبسولات سريعة': ['coffee capsules', 'coffee pods', 'nespresso', 'dolce gusto', 'espresso', 'coffee'],
  'منظفات الغسيل': ['laundry', 'detergent', 'washing powder', 'tide', 'ariel', 'cleaning'],
  'منظفات الأطباق': ['dishwashing', 'dish soap', 'fairy', 'pril', 'cleaning']
};

const ARABIC_INDIC_DIGITS: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9'
};

export function normalizeSearchInput(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => ARABIC_INDIC_DIGITS[d] || d)
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .trim();
}

function tokenizePreservingDecimals(normalized: string): string[] {
  return normalized
    .split(/[\s\-_/&،,()×*]+/)
    .map((t) => t.replace(/^\.+|\.+$/g, ''))
    .filter(Boolean);
}

function stripArabicAl(word: string): string {
  return word.length > 2 && word.startsWith('ال') ? word.slice(2) : word;
}

function toBaseMetric(
  numValue: number,
  unit: CanonicalUnitGroup | null
): { baseFamily?: BaseMetricFamily; baseAmount?: number } {
  if (!unit) return {};
  if (unit === 'ml') return { baseFamily: 'volume_ml', baseAmount: numValue };
  if (unit === 'l') return { baseFamily: 'volume_ml', baseAmount: numValue * 1000 };
  if (unit === 'g') return { baseFamily: 'weight_g', baseAmount: numValue };
  if (unit === 'kg') return { baseFamily: 'weight_g', baseAmount: numValue * 1000 };
  return {};
}

const SYNONYM_LOOKUP = new Map<string, string[]>();
for (const group of WORD_SYNONYM_GROUPS) {
  const normGroup = group.map((w) => normalizeSearchInput(w));
  for (const w of normGroup) {
    SYNONYM_LOOKUP.set(w, normGroup);
    SYNONYM_LOOKUP.set(stripArabicAl(w), normGroup);
  }
}

export interface ParsedSearchQuery {
  normalizedQuery: string;
  textTokens: string[];
  sizeHints: ParsedSizeHint[];
}

export function parseSearchQueryHints(query: string): ParsedSearchQuery {
  const normalizedQuery = normalizeSearchInput(query);
  const rawTokens = tokenizePreservingDecimals(normalizedQuery);
  const textTokens: string[] = [];
  const sizeHints: ParsedSizeHint[] = [];

  for (let i = 0; i < rawTokens.length; i += 1) {
    const token = rawTokens[i];
    const numUnitMatch = token.match(/^(\d+(?:\.\d+)?)([a-z\u0600-\u06FF]*)$/i);

    if (numUnitMatch && numUnitMatch[1]) {
      const rawNumStr = numUnitMatch[1];
      const numValue = Number(rawNumStr);
      const inlineSuffix = (numUnitMatch[2] || '').trim();

      if (inlineSuffix) {
        const mappedUnit = UNIT_TOKEN_MAP[inlineSuffix] || null;
        if (mappedUnit || inlineSuffix.length <= 4) {
          sizeHints.push({
            rawNumStr,
            numValue,
            unitCanonical: mappedUnit,
            ...toBaseMetric(numValue, mappedUnit)
          });
          continue;
        }
      } else if (Number.isFinite(numValue)) {
        const nextToken = rawTokens[i + 1];
        const nextUnit = nextToken ? UNIT_TOKEN_MAP[nextToken] || null : null;
        if (nextUnit) {
          sizeHints.push({
            rawNumStr,
            numValue,
            unitCanonical: nextUnit,
            ...toBaseMetric(numValue, nextUnit)
          });
          i += 1; // consume the unit token alongside the number
          continue;
        }
        sizeHints.push({
          rawNumStr,
          numValue,
          unitCanonical: null
        });
        continue;
      }
    }

    textTokens.push(token);
  }

  return { normalizedQuery, textTokens, sizeHints };
}

function extractProductSizeMeasurements(product: FilterableProduct): ParsedSizeHint[] {
  const combined = [
    product.packSize || '',
    product.unit || '',
    product.nameAr || '',
    product.nameEn || ''
  ].join(' ');
  const normalized = normalizeSearchInput(combined);
  const hints: ParsedSizeHint[] = [];

  const pattern = /(\d+(?:\.\d+)?)\s*([a-z\u0600-\u06FF]+)?/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(normalized)) !== null) {
    const rawNumStr = match[1];
    const numValue = Number(rawNumStr);
    if (!Number.isFinite(numValue)) continue;
    const maybeUnitRaw = (match[2] || '').trim();
    const mappedUnit = maybeUnitRaw ? UNIT_TOKEN_MAP[maybeUnitRaw] || null : null;
    hints.push({
      rawNumStr,
      numValue,
      unitCanonical: mappedUnit,
      ...toBaseMetric(numValue, mappedUnit)
    });
  }

  if (
    typeof product.packageQuantity === 'number' &&
    Number.isFinite(product.packageQuantity) &&
    product.packageQuantity > 0
  ) {
    hints.push({
      rawNumStr: String(product.packageQuantity),
      numValue: product.packageQuantity,
      unitCanonical: null
    });
  }

  return hints;
}

function computeSizeMatchBoost(
  product: FilterableProduct,
  sizeHints: ParsedSizeHint[]
): number {
  if (sizeHints.length === 0) return 0;
  const measurements = extractProductSizeMeasurements(product);
  if (measurements.length === 0) return 0;

  let totalBoost = 0;
  for (const hint of sizeHints) {
    let bestForHint = 0;
    for (const m of measurements) {
      if (hint.unitCanonical && m.unitCanonical) {
        if (
          hint.baseFamily &&
          m.baseFamily &&
          hint.baseFamily === m.baseFamily &&
          hint.baseAmount !== undefined &&
          m.baseAmount !== undefined &&
          Math.abs(hint.baseAmount - m.baseAmount) < 0.001
        ) {
          bestForHint = Math.max(bestForHint, 30);
        }
      } else if (hint.unitCanonical && !m.unitCanonical) {
        if (Math.abs(hint.numValue - m.numValue) < 0.001) {
          bestForHint = Math.max(bestForHint, 18);
        }
      } else if (!hint.unitCanonical) {
        if (Math.abs(hint.numValue - m.numValue) < 0.001) {
          bestForHint = Math.max(bestForHint, m.unitCanonical ? 25 : 20);
        }
      }
    }
    if (bestForHint === 0) {
      return 0;
    }
    totalBoost += bestForHint;
  }
  return totalBoost;
}

function getTokenVariants(token: string): string[] {
  const bare = stripArabicAl(token);
  const synGroup = SYNONYM_LOOKUP.get(token) || SYNONYM_LOOKUP.get(bare);
  if (synGroup) {
    return Array.from(new Set([token, bare, ...synGroup]));
  }
  return bare === token ? [token] : [token, bare];
}

function scoreFieldForTextTokens(
  fieldText: string | undefined,
  normalizedFullQuery: string,
  textTokens: string[]
): 0 | 1 | 2 | 3 {
  if (!fieldText || textTokens.length === 0) return 0;
  const normalizedField = normalizeSearchInput(fieldText);
  if (!normalizedField) return 0;

  if (
    normalizedField === normalizedFullQuery ||
    stripArabicAl(normalizedField) === stripArabicAl(normalizedFullQuery)
  ) {
    return 3;
  }

  const words = tokenizePreservingDecimals(normalizedField);
  if (words.length === 0) return 0;

  let minTokenScore: 0 | 1 | 2 = 2;
  for (const qt of textTokens) {
    const qtVariants = getTokenVariants(qt);
    let bestWordScore: 0 | 1 | 2 = 0;

    for (const w of words) {
      const wBare = stripArabicAl(w);
      for (const variant of qtVariants) {
        const vBare = stripArabicAl(variant);
        if (w === variant || wBare === variant || w === vBare || wBare === vBare) {
          bestWordScore = 2;
          break;
        }
        if (
          variant.length >= 2 &&
          (w.startsWith(variant) || (w !== wBare && wBare.startsWith(variant)))
        ) {
          bestWordScore = Math.max(bestWordScore, 1) as 0 | 1 | 2;
        }
      }
      if (bestWordScore === 2) break;
    }

    if (bestWordScore === 0) return 0;
    if (bestWordScore < minTokenScore) minTokenScore = bestWordScore;
  }

  return minTokenScore;
}

export interface ScoredSearchProduct<T extends FilterableProduct> {
  product: T;
  textScore: number;
  sizeBoost: number;
  totalScore: number;
}

export function scoreProductSearchMatch(
  product: FilterableProduct,
  parsed: ParsedSearchQuery
): { matched: boolean; textScore: number; sizeBoost: number; totalScore: number } {
  const { normalizedQuery, textTokens, sizeHints } = parsed;
  if (!normalizedQuery) {
    return { matched: true, textScore: 0, sizeBoost: 0, totalScore: 0 };
  }

  const barcodeNorm = (product.barcode || '').toLowerCase();
  if (barcodeNorm === normalizedQuery) {
    return { matched: true, textScore: 3, sizeBoost: 30, totalScore: 150 };
  }

  const sizeBoost = computeSizeMatchBoost(product, sizeHints);

  if (textTokens.length === 0) {
    const barcodeStarts = barcodeNorm.startsWith(normalizedQuery);
    if (sizeBoost > 0 || barcodeStarts) {
      return {
        matched: true,
        textScore: barcodeStarts ? 1 : 2,
        sizeBoost,
        totalScore: (barcodeStarts ? 10 : 20) + sizeBoost
      };
    }
    return { matched: false, textScore: 0, sizeBoost: 0, totalScore: 0 };
  }

  const subKws = product.subCategory
    ? BILINGUAL_SUBCATEGORY_KEYWORDS[product.subCategory] || []
    : [];

  let textScore = Math.max(
    scoreFieldForTextTokens(product.nameAr, normalizedQuery, textTokens),
    scoreFieldForTextTokens(product.nameEn, normalizedQuery, textTokens),
    scoreFieldForTextTokens(product.brand, normalizedQuery, textTokens),
    scoreFieldForTextTokens(product.category, normalizedQuery, textTokens),
    scoreFieldForTextTokens(product.subCategory, normalizedQuery, textTokens),
    ...subKws.map((kw) => scoreFieldForTextTokens(kw, normalizedQuery, textTokens))
  );

  // Also allow cross-field matches when text tokens span name + brand + category (e.g. "أرز أبو خروف")
  if (textScore === 0 && textTokens.length > 1) {
    const combinedText = [
      product.nameAr,
      product.nameEn,
      product.brand,
      product.category,
      product.subCategory,
      ...subKws
    ]
      .filter(Boolean)
      .join(' ');
    textScore = scoreFieldForTextTokens(combinedText, normalizedQuery, textTokens);
  }

  if (barcodeNorm.startsWith(normalizedQuery)) {
    textScore = Math.max(textScore, 1);
  }

  if (textScore <= 0) {
    return { matched: false, textScore: 0, sizeBoost: 0, totalScore: 0 };
  }

  return {
    matched: true,
    textScore,
    sizeBoost,
    totalScore: textScore * 10 + sizeBoost
  };
}

export function scoreAndFilterProductsBySearch<T extends FilterableProduct>(
  products: T[],
  query: string
): { items: T[]; scoreMap: Map<string, number> } {
  const scoreMap = new Map<string, number>();
  const trimmed = query.trim();
  if (!trimmed) {
    return { items: [...products], scoreMap };
  }

  const parsed = parseSearchQueryHints(trimmed);
  const scored: ScoredSearchProduct<T>[] = [];

  for (const product of products) {
    const res = scoreProductSearchMatch(product, parsed);
    if (res.matched) {
      scored.push({
        product,
        textScore: res.textScore,
        sizeBoost: res.sizeBoost,
        totalScore: res.totalScore
      });
    }
  }

  const minRequiredTextScore = scored.some((item) => item.textScore >= 2) ? 2 : 1;
  const filtered = scored
    .filter((item) => item.textScore >= minRequiredTextScore)
    .sort((a, b) => b.totalScore - a.totalScore);

  for (const entry of filtered) {
    scoreMap.set(entry.product.barcode, entry.totalScore);
  }

  return {
    items: filtered.map((e) => e.product),
    scoreMap
  };
}

// ================= CORE FILTER & FACET ENGINE =================

interface ResolvedContext {
  supplierMap: Map<string, FilterableSupplier> | null;
  eligibleSupplierSet: Set<string> | null;
  offersByBarcode: Map<string, FilterableOffer[]>;
  hasExternalOffers: boolean;
  searchScoreMap: Map<string, number> | null;
}

function resolveContext(
  offers: FilterableOffer[] | undefined,
  context?: ApplyProductFiltersContext
): ResolvedContext {
  const supplierMap =
    context?.suppliers && context.suppliers.length > 0
      ? new Map(context.suppliers.map((s) => [s.id, s]))
      : null;

  const eligibleSupplierSet = context?.eligibleSupplierIds
    ? context.eligibleSupplierIds instanceof Set
      ? context.eligibleSupplierIds
      : new Set(context.eligibleSupplierIds)
    : null;

  const hasExternalOffers = Array.isArray(offers) && offers.length > 0;
  const offersByBarcode = buildOffersByBarcode(offers, eligibleSupplierSet);

  let searchScoreMap: Map<string, number> | null = null;
  if (context?.searchScores instanceof Map) {
    searchScoreMap = context.searchScores;
  } else if (context?.searchScores) {
    searchScoreMap = new Map(
      Object.entries(context.searchScores).map(([k, v]) => [k, Number(v) || 0])
    );
  }

  return {
    supplierMap,
    eligibleSupplierSet,
    offersByBarcode,
    hasExternalOffers,
    searchScoreMap
  };
}

function matchesFilters(
  product: FilterableProduct,
  productOffers: FilterableOffer[],
  filters: ProductFilterState,
  ctx: ResolvedContext
): boolean {
  // 1. Brand filter (multi-select from brandId / brand)
  if (filters.brands.length > 0) {
    const brandId = (product.brandId || '').trim();
    const brandName = (product.brand || '').trim();
    if (!brandId && !brandName) return false;
    const matchedBrand = filters.brands.some(
      (b) => (brandId && b === brandId) || (brandName && b === brandName)
    );
    if (!matchedBrand) return false;
  }

  // 2. Country of origin filter (multi-select)
  if (filters.countries.length > 0) {
    const country = (product.countryOfOrigin || '').trim();
    if (!country || !filters.countries.includes(country)) return false;
  }

  // 3. Storage type filter (multi-select)
  if (filters.storageTypes.length > 0) {
    const storage = product.storageType;
    if (!storage || !filters.storageTypes.includes(storage)) return false;
  }

  // 4. Supplier filter (multi-select from product's eligible offers)
  if (filters.supplierIds.length > 0) {
    const hasSupplier = productOffers.some((o) =>
      filters.supplierIds.includes(o.supplierId)
    );
    if (!hasSupplier) return false;
  }

  // 5. Availability: in stock only
  if (filters.inStockOnly) {
    const inStock = productOffers.some(
      (o) => typeof o.availableStock === 'number' && o.availableStock > 0
    );
    if (!inStock) return false;
  }

  const lowestPrice = getLowestOfferPrice(product, productOffers);

  // 6. Price range IQD (computed on lowest eligible offer price)
  if (filters.minPriceIQD !== undefined || filters.maxPriceIQD !== undefined) {
    if (lowestPrice === null) return false;
    if (filters.minPriceIQD !== undefined && lowestPrice < filters.minPriceIQD) {
      return false;
    }
    if (filters.maxPriceIQD !== undefined && lowestPrice > filters.maxPriceIQD) {
      return false;
    }
  }

  // 7. On sale / discount
  if (filters.onSaleOnly) {
    if (!isProductOnSale(product, productOffers, lowestPrice)) return false;
  }

  // 8. Verified suppliers only (verificationStatus !== 'pending')
  if (filters.verifiedOnly) {
    const hasVerifiedOffer = productOffers.some((o) =>
      isOfferSupplierVerified(o, ctx.supplierMap)
    );
    if (!hasVerifiedOffer) return false;
  }

  return true;
}

export function applyProductFilters<T extends FilterableProduct>(
  products: T[],
  offers: FilterableOffer[],
  filters: Partial<ProductFilterState> | null | undefined,
  context?: ApplyProductFiltersContext
): T[] {
  const normalizedFilters = normalizeProductFilters(filters);
  const ctx = resolveContext(offers, context);

  // If query is passed in context and no precomputed searchScoreMap, compute query scores
  let workingProducts = products;
  let scoreMap = ctx.searchScoreMap;
  if (context?.query && context.query.trim() && !scoreMap) {
    const searchRes = scoreAndFilterProductsBySearch(products, context.query);
    workingProducts = searchRes.items;
    scoreMap = searchRes.scoreMap;
  }

  const matchedWithMeta: {
    product: T;
    index: number;
    lowestPrice: number | null;
    inStock: boolean;
    rating: number;
    reviewsCount: number;
    discount: number;
    searchScore: number;
  }[] = [];

  for (let i = 0; i < workingProducts.length; i += 1) {
    const product = workingProducts[i];
    if (!product || !product.barcode) continue;

    const productOffers = getEligibleOffersForProduct(
      product,
      ctx.offersByBarcode,
      ctx.hasExternalOffers,
      ctx.eligibleSupplierSet
    );

    if (!matchesFilters(product, productOffers, normalizedFilters, ctx)) {
      continue;
    }

    const lowestPrice = getLowestOfferPrice(product, productOffers);
    const inStock = productOffers.some(
      (o) => typeof o.availableStock === 'number' && o.availableStock > 0
    );
    const discount = getEffectiveDiscountPercent(product, productOffers, lowestPrice);
    const searchScore = scoreMap ? scoreMap.get(product.barcode) ?? 0 : 0;

    matchedWithMeta.push({
      product,
      index: i,
      lowestPrice,
      inStock,
      rating: typeof product.rating === 'number' && Number.isFinite(product.rating) ? product.rating : 0,
      reviewsCount:
        typeof product.reviewsCount === 'number' && Number.isFinite(product.reviewsCount)
          ? product.reviewsCount
          : 0,
      discount,
      searchScore
    });
  }

  matchedWithMeta.sort((a, b) => {
    switch (normalizedFilters.sortBy) {
      case 'price_asc': {
        const pa = a.lowestPrice ?? Number.MAX_SAFE_INTEGER;
        const pb = b.lowestPrice ?? Number.MAX_SAFE_INTEGER;
        if (pa !== pb) return pa - pb;
        return a.index - b.index;
      }
      case 'price_desc': {
        const pa = a.lowestPrice ?? -1;
        const pb = b.lowestPrice ?? -1;
        if (pa !== pb) return pb - pa;
        return a.index - b.index;
      }
      case 'rating_desc': {
        if (b.rating !== a.rating) return b.rating - a.rating;
        if (b.reviewsCount !== a.reviewsCount) return b.reviewsCount - a.reviewsCount;
        return a.index - b.index;
      }
      case 'discount_desc': {
        if (b.discount !== a.discount) return b.discount - a.discount;
        return a.index - b.index;
      }
      case 'relevance':
      default: {
        if (b.searchScore !== a.searchScore) return b.searchScore - a.searchScore;
        const stockDiff = (b.inStock ? 1 : 0) - (a.inStock ? 1 : 0);
        if (stockDiff !== 0) return stockDiff;
        return a.index - b.index;
      }
    }
  });

  return matchedWithMeta.map((m) => m.product);
}

export function getFilterFacets(
  products: FilterableProduct[],
  offers: FilterableOffer[],
  filters: Partial<ProductFilterState> | null | undefined,
  context?: ApplyProductFiltersContext
): ProductFilterFacets {
  const f = normalizeProductFilters(filters);
  const ctx = resolveContext(offers, context);

  // Leave-one-out subsets (computed on results after applying all OTHER filters)
  const forBrands = applyProductFilters(
    products,
    offers,
    { ...f, brands: [], sortBy: 'relevance' },
    context
  );
  const brandMap = new Map<string, BrandFacetOption>();
  for (const p of forBrands) {
    const key = getProductBrandKey(p);
    if (!key) continue;
    const existing = brandMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      brandMap.set(key, {
        value: key,
        brandId: p.brandId,
        brandName: (p.brand || key).trim(),
        count: 1
      });
    }
  }
  const brands = Array.from(brandMap.values())
    .filter((b) => b.count > 0)
    .sort((a, b) => b.count - a.count || a.brandName.localeCompare(b.brandName, 'ar'));

  const forCountries = applyProductFilters(
    products,
    offers,
    { ...f, countries: [], sortBy: 'relevance' },
    context
  );
  const countryMap = new Map<string, number>();
  for (const p of forCountries) {
    const country = (p.countryOfOrigin || '').trim();
    if (!country) continue;
    countryMap.set(country, (countryMap.get(country) || 0) + 1);
  }
  const countries: CountryFacetOption[] = Array.from(countryMap.entries())
    .map(([value, count]) => ({ value, count }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'ar'));

  const forStorage = applyProductFilters(
    products,
    offers,
    { ...f, storageTypes: [], sortBy: 'relevance' },
    context
  );
  const storageMap = new Map<ProductStorageType, number>();
  for (const p of forStorage) {
    if (!p.storageType || !ALL_STORAGE_TYPES.includes(p.storageType)) continue;
    storageMap.set(p.storageType, (storageMap.get(p.storageType) || 0) + 1);
  }
  const storageTypes: StorageFacetOption[] = ALL_STORAGE_TYPES.map((st) => ({
    value: st,
    count: storageMap.get(st) || 0
  })).filter((s) => s.count > 0);

  const forSuppliers = applyProductFilters(
    products,
    offers,
    { ...f, supplierIds: [], sortBy: 'relevance' },
    context
  );
  const supplierFacetMap = new Map<string, SupplierFacetOption>();
  for (const p of forSuppliers) {
    const pOffers = getEligibleOffersForProduct(
      p,
      ctx.offersByBarcode,
      ctx.hasExternalOffers,
      ctx.eligibleSupplierSet
    );
    const seenSuppliers = new Set<string>();
    for (const o of pOffers) {
      if (!o.supplierId || seenSuppliers.has(o.supplierId)) continue;
      seenSuppliers.add(o.supplierId);
      const suppMeta = ctx.supplierMap?.get(o.supplierId);
      const existing = supplierFacetMap.get(o.supplierId);
      if (existing) {
        existing.count += 1;
      } else {
        supplierFacetMap.set(o.supplierId, {
          value: o.supplierId,
          supplierName: suppMeta?.companyName || o.supplierName,
          verificationStatus: suppMeta?.verificationStatus || o.verificationStatus,
          count: 1
        });
      }
    }
  }
  const suppliers = Array.from(supplierFacetMap.values())
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);

  const inStockCount = applyProductFilters(
    products,
    offers,
    { ...f, inStockOnly: true, sortBy: 'relevance' },
    context
  ).length;

  const onSaleCount = applyProductFilters(
    products,
    offers,
    { ...f, onSaleOnly: true, sortBy: 'relevance' },
    context
  ).length;

  const verifiedOnlyCount = applyProductFilters(
    products,
    offers,
    { ...f, verifiedOnly: true, sortBy: 'relevance' },
    context
  ).length;

  const forPriceBounds = applyProductFilters(
    products,
    offers,
    { ...f, minPriceIQD: undefined, maxPriceIQD: undefined, sortBy: 'relevance' },
    context
  );
  let minBound = Number.POSITIVE_INFINITY;
  let maxBound = 0;
  for (const p of forPriceBounds) {
    const pOffers = getEligibleOffersForProduct(
      p,
      ctx.offersByBarcode,
      ctx.hasExternalOffers,
      ctx.eligibleSupplierSet
    );
    const low = getLowestOfferPrice(p, pOffers);
    if (low !== null) {
      if (low < minBound) minBound = low;
      if (low > maxBound) maxBound = low;
    }
  }
  const priceBounds = {
    min: Number.isFinite(minBound) ? minBound : 0,
    max: maxBound
  };

  const totalMatched = applyProductFilters(products, offers, f, context).length;

  return {
    brands,
    countries,
    storageTypes,
    suppliers,
    inStockCount,
    onSaleCount,
    verifiedOnlyCount,
    priceBounds,
    totalMatched
  };
}
