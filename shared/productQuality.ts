export type StandardBarcodeFormat = 'EAN-8' | 'UPC-A' | 'EAN-13' | 'GTIN-14';

export interface BarcodeValidationResult {
  valid: boolean;
  normalized: string;
  format?: 'EAN-13' | 'GTIN-14' | 'UPC-A';
  detectedStandard?: StandardBarcodeFormat;
  errorAr?: string;
  errorEn?: string;
}

/**
 * Validates GS1 barcodes (EAN-8, UPC-A / 12, EAN-13, GTIN-14)
 * using Mod-10 check digit verification from right to left.
 */
export function validateBarcode(rawCode: string | undefined | null): BarcodeValidationResult {
  const normalized = String(rawCode || '').trim();
  if (!normalized) {
    return {
      valid: false,
      normalized: '',
      errorAr: 'الباركود مطلوب ولا يمكن أن يكون فارغاً',
      errorEn: 'Barcode is required'
    };
  }
  if (!/^\d+$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      errorAr: 'يجب أن يتكون الباركود من أرقام فقط بدون أحرف أو رموز',
      errorEn: 'Barcode must contain digits only'
    };
  }

  const len = normalized.length;
  if (len !== 8 && len !== 12 && len !== 13 && len !== 14) {
    return {
      valid: false,
      normalized,
      errorAr: 'طول الباركود غير صالح (المقبول: 8 أو 12 أو 13 أو 14 رقماً)',
      errorEn: 'Invalid barcode length (accepted: 8, 12, 13, or 14 digits)'
    };
  }

  // GS1 Mod-10 check digit: starting from rightmost payload digit (index len - 2),
  // multiply alternating positions by 3 then 1 moving left.
  const digits = normalized.split('').map((d) => Number(d));
  const actualCheckDigit = digits[len - 1];
  let sum = 0;
  let weight = 3;
  for (let i = len - 2; i >= 0; i--) {
    sum += digits[i] * weight;
    weight = weight === 3 ? 1 : 3;
  }
  const expectedCheckDigit = (10 - (sum % 10)) % 10;

  if (actualCheckDigit !== expectedCheckDigit) {
    return {
      valid: false,
      normalized,
      errorAr: `رقم التحقق (Check Digit) للباركود غير صحيح؛ المتوقع ${expectedCheckDigit} بدلاً من ${actualCheckDigit}`,
      errorEn: `Invalid barcode check digit; expected ${expectedCheckDigit} instead of ${actualCheckDigit}`
    };
  }

  const detectedStandard: StandardBarcodeFormat =
    len === 8 ? 'EAN-8' : len === 12 ? 'UPC-A' : len === 13 ? 'EAN-13' : 'GTIN-14';
  const format: 'EAN-13' | 'GTIN-14' | 'UPC-A' =
    len === 12 ? 'UPC-A' : len === 14 ? 'GTIN-14' : 'EAN-13';

  return {
    valid: true,
    normalized,
    format,
    detectedStandard
  };
}

export type QualityFieldKey =
  | 'nameAr'
  | 'nameEn'
  | 'brand'
  | 'category'
  | 'subCategory'
  | 'imageUrl'
  | 'unit'
  | 'packSize'
  | 'storageType'
  | 'countryOfOrigin'
  | 'activeOffer';

export interface QualityMissingField {
  key: QualityFieldKey;
  labelAr: string;
  labelEn: string;
  weight: number;
  core: boolean;
}

export interface ProductQualityResult {
  score: number;
  maxScore: number;
  missingFields: QualityMissingField[];
  hasActiveOffer: boolean;
}

export interface QualityProductInput {
  nameAr?: string | null;
  nameEn?: string | null;
  brand?: string | null;
  brandId?: string | null;
  category?: string | null;
  subCategory?: string | null;
  imageUrl?: string | null;
  images?: string[] | null;
  unit?: string | null;
  packSize?: string | null;
  storageType?: string | null;
  countryOfOrigin?: string | null;
}

export interface QualityOfferInput {
  status?: 'active' | 'suspended' | string | null;
  priceIQD: number;
  id?: string;
}

export const QUALITY_FIELD_DEFINITIONS: Array<{
  key: QualityFieldKey;
  labelAr: string;
  labelEn: string;
  weight: number;
  core: boolean;
}> = [
  { key: 'nameAr', labelAr: 'الاسم العربي', labelEn: 'Arabic Name', weight: 14, core: true },
  { key: 'brand', labelAr: 'العلامة التجارية', labelEn: 'Brand', weight: 12, core: true },
  { key: 'category', labelAr: 'القسم الرئيسي', labelEn: 'Main Category', weight: 12, core: true },
  { key: 'imageUrl', labelAr: 'صورة المنتج', labelEn: 'Product Image', weight: 12, core: true },
  { key: 'unit', labelAr: 'الوحدة', labelEn: 'Unit', weight: 10, core: true },
  { key: 'activeOffer', labelAr: 'عرض فعال واحد على الأقل', labelEn: 'At least 1 active offer', weight: 12, core: true },
  { key: 'nameEn', labelAr: 'الاسم الإنجليزي', labelEn: 'English Name', weight: 6, core: false },
  { key: 'subCategory', labelAr: 'الفرع / القسم الفرعي', labelEn: 'Sub-category / Branch', weight: 6, core: false },
  { key: 'packSize', labelAr: 'حجم العبوة', labelEn: 'Pack Size', weight: 6, core: false },
  { key: 'storageType', labelAr: 'نوع التخزين', labelEn: 'Storage Type', weight: 5, core: false },
  { key: 'countryOfOrigin', labelAr: 'بلد المنشأ', labelEn: 'Country of Origin', weight: 5, core: false }
];

const hasNonEmpty = (val?: string | null): boolean => Boolean(typeof val === 'string' && val.trim().length > 0);

/**
 * Computes deterministic 0-100 data quality score for a unified catalog product.
 * Core fields (nameAr, brand, category, imageUrl, unit, activeOffer) carry higher weight (72%)
 * than secondary enrichment fields (nameEn, subCategory, packSize, storageType, countryOfOrigin) (28%).
 */
export function computeProductQuality(
  product: QualityProductInput,
  offers: QualityOfferInput[] = []
): ProductQualityResult {
  const hasActiveOffer = offers.some((o) => (o.status || 'active') === 'active');
  const hasImage =
    hasNonEmpty(product.imageUrl) ||
    Boolean(Array.isArray(product.images) && product.images.some((img) => hasNonEmpty(img)));

  const checks: Record<QualityFieldKey, boolean> = {
    nameAr: hasNonEmpty(product.nameAr),
    nameEn: hasNonEmpty(product.nameEn),
    brand: hasNonEmpty(product.brand) || hasNonEmpty(product.brandId),
    category: hasNonEmpty(product.category),
    subCategory: hasNonEmpty(product.subCategory),
    imageUrl: hasImage,
    unit: hasNonEmpty(product.unit),
    packSize: hasNonEmpty(product.packSize),
    storageType: hasNonEmpty(product.storageType),
    countryOfOrigin: hasNonEmpty(product.countryOfOrigin),
    activeOffer: hasActiveOffer
  };

  let score = 0;
  const missingFields: QualityMissingField[] = [];
  for (const def of QUALITY_FIELD_DEFINITIONS) {
    if (checks[def.key]) {
      score += def.weight;
    } else {
      missingFields.push({ ...def });
    }
  }

  return {
    score,
    maxScore: 100,
    missingFields,
    hasActiveOffer
  };
}

export interface OfferPriceAnomalyInfo {
  isPriceAnomaly: boolean;
  medianPriceIQD: number | null;
  deviationPercent: number | null;
}

/**
 * Computes median price across offers of the same product (when count >= 3)
 * and flags offers whose price deviates by more than 40% from the median.
 */
export function computeOfferPriceAnomalyMap<T extends { id: string; priceIQD: number }>(
  productOffers: T[]
): Map<string, OfferPriceAnomalyInfo> {
  const result = new Map<string, OfferPriceAnomalyInfo>();
  if (productOffers.length < 3) {
    for (const o of productOffers) {
      result.set(o.id, { isPriceAnomaly: false, medianPriceIQD: null, deviationPercent: null });
    }
    return result;
  }

  const prices = productOffers.map((o) => Number(o.priceIQD) || 0).sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);
  const median =
    prices.length % 2 === 1 ? prices[mid] : Math.round((prices[mid - 1] + prices[mid]) / 2);

  for (const o of productOffers) {
    if (median <= 0) {
      result.set(o.id, { isPriceAnomaly: false, medianPriceIQD: median, deviationPercent: 0 });
      continue;
    }
    const rawDiff = (Number(o.priceIQD) - median) / median;
    const absDeviation = Math.abs(rawDiff);
    const deviationPercent = Math.round(rawDiff * 1000) / 10;
    result.set(o.id, {
      isPriceAnomaly: absDeviation > 0.4,
      medianPriceIQD: median,
      deviationPercent
    });
  }

  return result;
}
