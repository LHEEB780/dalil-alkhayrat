/**
 * Souq Al-Jumla - B2B Marketplace Types & Data Models
 * Multi-role architecture: Store, Supplier, Driver/Van Distributor, Platform Admin, Store B2C Customer
 */

import type { SupplierOrderRules } from '../../shared/orderRules.ts';
export type { SupplierOrderRules };

export type UserRole = 'store' | 'cashier' | 'accountant' | 'supplier' | 'driver' | 'admin' | 'customer';

export type StoreStaffRole = 'cashier' | 'accountant';

export type AccountStatus = 'active' | 'suspended' | 'rejected' | 'archived';

export interface AdminInternalNote {
  id: string;
  at: string;
  author: string;
  text: string;
}

export type KycChecklistKey =
  | 'commercial_license'
  | 'owner_id'
  | 'address_proof'
  | 'phone_verified';

export type KycChecklistItemStatus = 'pending' | 'approved' | 'rejected';

export interface KycChecklistItem {
  key: KycChecklistKey;
  status: KycChecklistItemStatus;
  note?: string;
}

export interface AccountKycInfo {
  licenseNo?: string;
  taxId?: string;
  checklist: KycChecklistItem[];
}

export interface StoreStaffAccount {
  id: string;
  storeId: string;
  storeName: string;
  name: string;
  role: StoreStaffRole;
  phone: string;
  branchId: string;
  branchName: string;
  isActive: boolean;
  passwordHash: string;
  accountStatus?: AccountStatus;
  statusReason?: string;
  statusChangedAt?: string;
  statusChangedBy?: string;
  adminNotes?: AdminInternalNote[];
  kyc?: AccountKycInfo;
  createdAt: string;
  lastLoginAt?: string;
}

export type StoreStaffPublic = Omit<StoreStaffAccount, 'passwordHash'>;

export type PaymentMethod = 'cod' | 'credit' | 'wallet' | 'online';

export type OrderStatus = 
  | 'pending'
  | 'approved'
  | 'assigned_driver'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'disputed';

export interface CurrencyConfig {
  code: 'IQD' | 'USD';
  symbol: string;
  nameAr: string;
  usdExchangeRate: number; // e.g. 1 USD = 1530 IQD
}

export type StorageType = 'ambient' | 'chilled' | 'frozen' | 'dry' | 'controlled';

export type CatalogProductStatus = 'active' | 'hidden' | 'archived';
export type CatalogOfferStatus = 'active' | 'suspended';
export type CatalogBrandStatus = 'active' | 'hidden';

export interface Brand {
  id: string;
  nameAr: string;
  nameEn: string;
  logoUrl?: string;
  status?: CatalogBrandStatus;
  statusReason?: string;
  statusChangedAt?: string;
  statusChangedBy?: string;
  createdAt?: string;
}

export interface UnifiedProduct {
  barcode: string; // Primary Key: EAN/GTIN
  nameAr: string;
  nameEn?: string;
  brand: string;
  brandId?: string;
  category: string;
  unit: string; // e.g., 'كرتون (12 علبة)', 'شوال (50 كغم)'
  packSize?: string;
  packageQuantity: number;
  imageUrl?: string;
  images?: string[];
  descriptionAr?: string;
  isPerishable: boolean;
  storageType?: StorageType;
  countryOfOrigin?: string;
  standardBarcodeFormat: 'EAN-13' | 'GTIN-14' | 'UPC-A';
  oldPrice?: number;
  discountPercent?: number;
  badgeType?: 'discount' | 'promo_day' | 'top_seller' | 'hot_deal';
  rating?: number;
  reviewsCount?: number;
  subCategory?: string;
  isSmartShipping?: boolean;
  status?: CatalogProductStatus;
  statusReason?: string;
  statusChangedAt?: string;
  statusChangedBy?: string;
  adminNotes?: AdminInternalNote[];
  createdAt?: string;
}

export interface SupplierOffer {
  id: string;
  barcode: string;
  supplierId: string;
  supplierName: string;
  supplierCity: string;
  priceIQD: number; // Wholesale price per unit
  priceUSD: number;
  minOrderQuantity: number;
  availableStock: number;
  deliveryDays: number; // e.g., 1 day for Baghdad, 2 for Basra
  paymentTerms: {
    allowsCredit: boolean;
    maxCreditDays: number; // e.g., 30 days, 45 days
    allowsCash: boolean;
  };
  discountTiers?: {
    minQuantity: number;
    discountPercent: number;
  }[];
  isClearanceNearExpiry?: boolean;
  clearanceDiscountPercent?: number;
  expiryDate?: string;
  status?: CatalogOfferStatus;
  statusReason?: string;
  statusChangedAt?: string;
  statusChangedBy?: string;
}

export interface StoreProfile {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  storeType: 'supermarket' | 'grocery' | 'wholesale_sub';
  walletBalanceIQD: number;
  isVerified: boolean;
  verificationStatus?: 'pending' | 'verified';
  accountStatus?: AccountStatus;
  statusReason?: string;
  statusChangedAt?: string;
  statusChangedBy?: string;
  adminNotes?: AdminInternalNote[];
  kyc?: AccountKycInfo;
  customDomainSlug: string; // for public B2C storefront e.g., "almansoor-market"
  qrScanCount: number;
  createdAt: string;
}

export interface Governorate {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
  lat: number;
  lng: number;
}

export interface District {
  id: string;
  governorateId: string;
  nameAr: string;
  nameEn: string;
  lat: number;
  lng: number;
}

export interface Area {
  id: string;
  districtId: string;
  governorateId: string;
  deliveryZoneId: string;
  nameAr: string;
  nameEn: string;
  lat: number;
  lng: number;
}

export interface DeliveryZone {
  id: string;
  governorateId: string;
  nameAr: string;
  nameEn: string;
  areaIds: string[];
  estimatedDeliveryHours: number;
}

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
  accountStatus?: AccountStatus;
  statusReason?: string;
  statusChangedAt?: string;
  statusChangedBy?: string;
  adminNotes?: AdminInternalNote[];
  kyc?: AccountKycInfo;
  serviceZoneIds: string[];
  orderRules?: SupplierOrderRules;
  createdAt: string;
}

export interface DriverProfile {
  id: string;
  supplierId: string;
  supplierName: string;
  name: string;
  phone: string;
  vehiclePlate: string;
  vehicleModel: string;
  vanWarehouseName: string;
  currentCashCollectedIQD: number;
  isActiveShift: boolean;
  accountStatus?: AccountStatus;
  statusReason?: string;
  statusChangedAt?: string;
  statusChangedBy?: string;
  adminNotes?: AdminInternalNote[];
  kyc?: AccountKycInfo;
  shiftStartTime?: string;
  dailyTargetIQD?: number;
  commissionRatePercent?: number;
  todayCashSalesIQD?: number;
  todayCreditSalesIQD?: number;
  todayDebtCollectedIQD?: number;
  todayExpensesIQD?: number;
  availabilityStatus?: 'available' | 'busy';
  busyReason?: string;
  odometerStartKm?: number;
  odometerEndKm?: number;
  fuelLevelPercent?: number;
  chillerTempC?: number;
  inspectionChecklist?: {
    tiresOk: boolean;
    chillerOk: boolean;
    lightsOk: boolean;
    hygieneOk: boolean;
    checkedAt?: string;
  };
}

export interface VanRouteStop {
  id: string;
  driverId: string;
  storeId: string;
  storeName: string;
  district: string;
  address: string;
  phone: string;
  sequence: number;
  status: 'pending' | 'visited' | 'sold' | 'skipped';
  lastSaleAmountIQD?: number;
  visitedAt?: string;
  notes?: string;
}

export interface VanTransactionRecord {
  id: string;
  receiptNumber: string;
  driverId: string;
  driverName: string;
  supplierId: string;
  storeId: string;
  storeName: string;
  type: 'direct_sale' | 'debt_collection';
  paymentType: 'cash' | 'credit';
  items?: {
    barcode: string;
    productName: string;
    unit: string;
    quantity: number;
    unitPriceIQD: number;
    totalIQD: number;
    tierApplied?: boolean;
    imageUrl?: string;
  }[];
  grossAmountIQD?: number;
  discountIQD?: number;
  totalAmountIQD: number;
  createdAt: string;
  notes?: string;
}

export interface VanLoadRequestItem {
  barcode: string;
  productName: string;
  unit: string;
  requestedQuantity: number;
  approvedQuantity: number;
  unitPriceIQD: number;
}

export interface VanLoadRequest {
  id: string;
  requestNumber: string;
  driverId: string;
  driverName: string;
  vanWarehouseName: string;
  supplierId: string;
  supplierName: string;
  items: VanLoadRequestItem[];
  totalEstimatedIQD: number;
  status: 'pending_approval' | 'approved' | 'rejected';
  notes?: string;
  reviewedBy?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface VanInventoryItem {
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
  batchNumber?: string;
  expiryDate?: string;
  bulkDiscountMinQty?: number;
  bulkUnitPriceIQD?: number;
  lastPhysicalCountQty?: number;
  lastAuditAt?: string;
}

export interface ShiftCloseReport {
  id: string;
  driverId: string;
  driverName: string;
  supplierId: string;
  date: string;
  expectedCashIQD: number;
  actualCashIQD: number;
  cashVarianceIQD: number; // positive = surplus, negative = deficit
  totalOrdersDelivered: number;
  totalDirectVanSales: number;
  returnsCount: number;
  totalExpensesIQD?: number;
  totalCreditSalesIQD?: number;
  totalDebtCollectedIQD?: number;
  odometerStartKm?: number;
  odometerEndKm?: number;
  strikeRatePercent?: number;
  notes?: string;
  status: 'pending_supplier_approval' | 'settled';
  settledAt?: string;
}

export interface CreditAccount {
  id: string;
  supplierId: string;
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

export interface LedgerEntry {
  id: string;
  creditAccountId: string;
  supplierId: string;
  storeId: string;
  referenceType: 'INVOICE' | 'PAYMENT' | 'RETURN_CREDIT' | 'REVERSAL' | 'OPENING_BALANCE';
  referenceId: string; // Order ID or Payment receipt ID
  entryDate: string;
  dueDate?: string;
  debitIQD: number; // Increases debt (e.g., invoice)
  creditIQD: number; // Decreases debt (e.g., payment, return)
  runningBalanceIQD: number;
  descriptionAr: string;
  isReversed: boolean;
  reversedByEntryId?: string;
  reversalReason?: string;
}

export interface OrderItem {
  barcode: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPriceIQD: number;
  totalPriceIQD: number;
}

export interface SubOrder {
  id: string;
  parentOrderId: string;
  supplierId: string;
  supplierName: string;
  storeId: string;
  storeName: string;
  storePhone: string;
  storeCity: string;
  storeAddress: string;
  items: OrderItem[];
  subtotalIQD: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  deliveryType: 'supplier_fleet' | 'platform_driver' | 'van_direct';
  assignedDriverId?: string;
  assignedDriverName?: string;
  deliveryPin: string; // 4-digit verification code
  proofOfDeliverySignature?: string;
  paidAt?: string;
  deliveredAt?: string;
  createdAt: string;
  notes?: string;
}

export interface ParentOrder {
  id: string;
  storeId: string;
  storeName: string;
  totalAmountIQD: number;
  subOrders: SubOrder[];
  paymentMethod: PaymentMethod;
  createdAt: string;
}

export interface StoreInventoryItem {
  id: string;
  storeId: string;
  barcode: string;
  productName: string;
  category: string;
  unit: string;
  stockQuantity: number;
  reorderLevel: number;
  costPriceIQD: number;
  retailSellingPriceIQD: number;
  expiryDate: string;
  isNearExpiry: boolean;
  isLowStock: boolean;
  monthlyAverageSales: number;
}

export interface StorePOSSaleRecord {
  id: string;
  receiptNumber: number;
  storeId: string;
  orderMode: 'in_store' | 'take_away' | 'online_order';
  customerName: string;
  paymentType: 'cash' | 'card' | 'credit_ledger';
  items: {
    barcode: string;
    productName: string;
    quantity: number;
    unitPriceIQD: number;
    note?: string;
  }[];
  subtotalIQD: number;
  discountIQD: number;
  totalIQD: number;
  profitIQD: number;
  createdAt: string;
}

export interface StorePOSReturnItem {
  barcode: string;
  productName: string;
  quantity: number;
  unitPriceIQD: number;
  restockToShelf: boolean;
}

export interface StorePOSReturnRecord {
  id: string;
  returnNumber: number;
  storeId: string;
  originalReceiptNumber?: number;
  customerName: string;
  refundMethod: 'cash' | 'card' | 'credit_ledger';
  items: StorePOSReturnItem[];
  totalRefundIQD: number;
  profitAdjustmentIQD: number;
  reason: string;
  processedBy?: string;
  createdAt: string;
}

export interface CollectiveBuyingPool {
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

export interface StorePosterConfig {
  storeId: string;
  storeName: string;
  slug: string;
  tagline: string;
  phone: string;
  themeColor: string;
  qrDestinationUrl: string;
  totalScans: number;
  lastScannedAt?: string;
}

export interface CreditUpgradeRequest {
  id: string;
  creditAccountId: string;
  storeId: string;
  storeName: string;
  supplierId: string;
  supplierName: string;
  currentLimitIQD: number;
  requestedLimitIQD: number;
  reason: string;
  storeReliabilityScore: number; // 0 - 100 calculated by platform rules
  status: 'platform_review' | 'approved' | 'deferred_by_policy';
  platformResponseAr: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface SupplierReview {
  id: string;
  supplierId: string;
  storeId: string;
  storeName: string;
  rating: number; // 1 - 5
  serviceRating: number; // 1 - 5 (سرعة التوصيل والتعامل)
  qualityRating: number; // 1 - 5 (جودة البضاعة والتغليف)
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

export interface SupplierInventoryBatch {
  id: string;
  supplierId: string;
  barcode: string;
  productName: string;
  category: string;
  unit: string;
  stockQuantity: number;
  costPriceIQD: number;
  wholesalePriceIQD: number;
  expiryDate: string;
  batchCode: string;
}

export type VanExpenseCategory = 'fuel' | 'toll_parking' | 'loading_labor' | 'maintenance' | 'other';

export interface VanExpenseRecord {
  id: string;
  driverId: string;
  supplierId: string;
  category: VanExpenseCategory;
  description: string;
  amountIQD: number;
  receiptRef?: string;
  createdAt: string;
}

export interface VanReturnRecord {
  id: string;
  rmaNumber: string;
  driverId: string;
  supplierId: string;
  storeId?: string;
  storeName?: string;
  barcode: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPriceIQD: number;
  creditNoteAmountIQD: number;
  type: 'return' | 'damage' | 'exchange';
  batchNumber?: string;
  expiryDate?: string;
  reason: string;
  createdAt: string;
}

export interface VanUnloadRecord {
  id: string;
  manifestNumber: string;
  driverId: string;
  supplierId: string;
  itemsCount: number;
  totalUnitsReturned: number;
  totalValueIQD: number;
  damagedUnits: number;
  notes?: string;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  at: string; // ISO timestamp
  actorId: string;
  actorName: string;
  action: string; // e.g., 'supplier.suspend'
  entityType: string;
  entityId: string;
  summaryAr: string;
  summaryEn?: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
}
