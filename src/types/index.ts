import type { SupplierOrderRules } from '../../shared/orderRules.ts';
export type { SupplierOrderRules };

export type Role = 'store' | 'cashier' | 'supplier' | 'driver' | 'admin' | 'customer';

export type SellerBusinessType =
  | 'manufacturer'
  | 'importer'
  | 'wholesaler'
  | 'distributor'
  | 'trader'
  | 'warehouse'
  | 'brand_owner'
  | 'authorized_distributor';

export type VerificationStatus =
  | 'pending'
  | 'verified'
  | 'verified_business'
  | 'authorized_distributor';

export interface SupplierProfile {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  city: string;
  address: string;
  categories: string[];
  rating: number;
  totalVans: number;
  activeCreditLinesCount: number;
  isVerified: boolean;
  businessType: SellerBusinessType;
  verificationStatus: VerificationStatus;
  serviceZoneIds: string[];
  orderRules?: SupplierOrderRules;
  createdAt: string;
}

export type Currency = 'IQD' | 'USD';

export type Language = 'ar' | 'en';

export type StoreWorkspaceMode = 'b2b' | 'b2c';

export type AppTab =
  | 'marketplace'
  | 'all_categories'
  | 'category_branches'
  | 'all_brands'
  | 'suppliers'
  | 'supplier'
  | 'driver'
  | 'store_pos'
  | 'collective'
  | 'b2c'
  | 'store_management'
  | 'low_stock_alerts'
  | 'api_docs'
  | 'account_hub';

export type AccountSectionId =
  | 'profile'
  | 'orders'
  | 'credit_ledger'
  | 'messages'
  | 'support'
  | 'wishlist'
  | 'addresses'
  | 'blog'
  | 'security'
  | 'return_policy'
  | 'terms'
  | 'privacy';

export interface StoreBranchAddress {
  id: string;
  labelAr: string;
  labelEn: string;
  districtId: string;
  districtNameAr: string;
  districtNameEn: string;
  streetDetails: string;
  receiverPhone: string;
  isDefault: boolean;
}

export interface ProductWithOffers {
  barcode: string;
  nameAr: string;
  nameEn?: string;
  brand: string;
  brandId?: string;
  category: string;
  unit: string;
  packSize?: string;
  packageQuantity: number;
  imageUrl?: string;
  descriptionAr?: string;
  isPerishable: boolean;
  storageType?: 'ambient' | 'chilled' | 'frozen' | 'dry' | 'controlled';
  countryOfOrigin?: string;
  standardBarcodeFormat: 'EAN-13' | 'GTIN-14' | 'UPC-A';
  offers: SupplierOfferItem[];
  minPrice: number;
  maxPrice: number;
  suppliersCount: number;
  totalAvailableStock: number;
  longestCreditDays: number;
  fastestDeliveryDays: number;
  oldPrice?: number;
  discountPercent?: number;
  badgeType?: 'discount' | 'promo_day' | 'top_seller' | 'hot_deal';
  rating?: number;
  reviewsCount?: number;
  subCategory?: string;
  isSmartShipping?: boolean;
}

export interface SupplierOfferItem {
  id: string;
  barcode: string;
  supplierId: string;
  supplierName: string;
  supplierCity: string;
  priceIQD: number;
  priceUSD: number;
  minOrderQuantity: number;
  availableStock: number;
  deliveryDays: number;
  paymentTerms: {
    allowsCredit: boolean;
    maxCreditDays: number;
    allowsCash: boolean;
  };
  discountTiers?: {
    minQuantity: number;
    discountPercent: number;
  }[];
  isClearanceNearExpiry?: boolean;
  clearanceDiscountPercent?: number;
  expiryDate?: string;
}

export interface CartItem {
  offer: SupplierOfferItem;
  product: ProductWithOffers;
  quantity: number;
}

export interface CreditAccountItem {
  id: string;
  supplierId: string;
  supplierName?: string;
  supplierCity?: string;
  supplierPhone?: string;
  storeId: string;
  storeName: string;
  creditLimitIQD: number;
  currentUsedCreditIQD: number;
  availableCreditIQD: number;
  isBlocked: boolean;
  blockReason?: string;
  supplierExceptionAllowed: boolean;
  paymentTermDays: number;
  aging: {
    bucket0_30: number;
    bucket31_60: number;
    bucket61_90: number;
    bucket90Plus: number;
  };
  lastPaymentDate?: string;
}

export interface CreditUpgradeRequestItem {
  id: string;
  creditAccountId: string;
  storeId: string;
  storeName: string;
  supplierId: string;
  supplierName: string;
  currentLimitIQD: number;
  requestedLimitIQD: number;
  reason: string;
  storeReliabilityScore: number;
  status: 'platform_review' | 'approved' | 'deferred_by_policy';
  platformResponseAr: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface LedgerEntryItem {
  id: string;
  creditAccountId: string;
  supplierId: string;
  storeId: string;
  referenceType: 'INVOICE' | 'PAYMENT' | 'RETURN_CREDIT' | 'REVERSAL' | 'OPENING_BALANCE';
  referenceId: string;
  entryDate: string;
  dueDate?: string;
  debitIQD: number;
  creditIQD: number;
  runningBalanceIQD: number;
  descriptionAr: string;
  isReversed: boolean;
  reversedByEntryId?: string;
  reversalReason?: string;
}

export interface OrderItem {
  id: string;
  parentOrderId: string;
  supplierId: string;
  supplierName: string;
  storeId: string;
  storeName: string;
  storePhone: string;
  storeCity: string;
  storeAddress: string;
  items: {
    barcode: string;
    productName: string;
    unit: string;
    quantity: number;
    unitPriceIQD: number;
    totalPriceIQD: number;
  }[];
  subtotalIQD: number;
  paymentMethod: 'cod' | 'credit' | 'wallet' | 'online';
  status: 'pending' | 'approved' | 'assigned_driver' | 'out_for_delivery' | 'delivered' | 'cancelled';
  deliveryType: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  deliveryPin: string;
  createdAt: string;
  notes?: string;
}

export interface VanStockItem {
  id: string;
  driverId: string;
  barcode: string;
  productName: string;
  unit: string;
  loadedQuantity: number;
  soldQuantity: number;
  returnedQuantity: number;
  damagedQuantity: number;
  remainingQuantity: number;
  unitPriceIQD: number;
}

export interface CollectivePool {
  id: string;
  barcode: string;
  productName: string;
  targetQuantity: number;
  currentPledgedQuantity: number;
  standardPriceIQD: number;
  factoryBulkPriceIQD: number;
  discountPercentage: number;
  deadline: string;
  supplierId: string;
  supplierName: string;
  participantsCount: number;
  status: 'active' | 'completed' | 'expired';
}

export interface SupplierReviewItem {
  id: string;
  supplierId: string;
  storeId: string;
  storeName: string;
  rating: number;
  serviceRating: number;
  qualityRating: number;
  comment: string;
  isVerifiedOrder: boolean;
  orderId?: string;
  createdAt: string;
}

export interface SupplierReviewSummary {
  supplierId: string;
  averageRating: number;
  reviewsCount: number;
  serviceAvg: number;
  qualityAvg: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

