import type { SupplierOrderRules } from '../../shared/orderRules.ts';
import type {
  DeliveryJob,
  DeliveryJobEndpoint,
  DeliveryJobFailureReasonCode,
  DeliveryJobHistoryEntry,
  DeliveryJobStatus,
  DeliveryPartnerType,
  DeliveryPlatformSettings,
  DeliveryProviderType,
  DeliveryRateRule,
  DeliveryVehicleClass,
  DeliveryVehicleStatus,
  SupplierDeliverySettings,
  VehicleTemperatureType
} from '../../shared/deliveryRules.ts';
export type {
  DeliveryJob,
  DeliveryJobEndpoint,
  DeliveryJobFailureReasonCode,
  DeliveryJobHistoryEntry,
  DeliveryJobStatus,
  DeliveryPartnerType,
  DeliveryPlatformSettings,
  DeliveryProviderType,
  DeliveryRateRule,
  DeliveryVehicleClass,
  DeliveryVehicleStatus,
  SupplierDeliverySettings,
  VehicleTemperatureType
};
export type { SupplierOrderRules };

export type Role =
  | 'store'
  | 'cashier'
  | 'accountant'
  | 'supplier'
  | 'driver'
  | 'admin'
  | 'customer'
  | 'delivery_partner';

export type StoreStaffRole = 'cashier' | 'accountant';

export type AccountStatus = 'active' | 'suspended' | 'rejected' | 'archived';
export type DeliveryAccountStatus = 'pending' | AccountStatus;

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
  | 'phone_verified'
  | 'driver_license'
  | 'vehicle_registration'
  | 'insurance'
  | 'vehicle_inspection';

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

export interface StoreStaffMember {
  id: string;
  storeId: string;
  storeName: string;
  name: string;
  role: StoreStaffRole;
  phone: string;
  branchId: string;
  branchName: string;
  isActive: boolean;
  accountStatus?: AccountStatus;
  statusReason?: string;
  statusChangedAt?: string;
  statusChangedBy?: string;
  adminNotes?: AdminInternalNote[];
  kyc?: AccountKycInfo;
  createdAt: string;
  lastLoginAt?: string;
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
  deliverySettings?: SupplierDeliverySettings;
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
  | 'admin_console'
  | 'account_hub';

export type AccountSectionId =
  | 'profile'
  | 'orders'
  | 'invoices'
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

export type CatalogProductStatus = 'active' | 'hidden' | 'archived';
export type CatalogOfferStatus = 'active' | 'suspended';
export type CatalogBrandStatus = 'active' | 'hidden';

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
  images?: string[];
  descriptionAr?: string;
  isPerishable: boolean;
  storageType?: 'ambient' | 'chilled' | 'frozen' | 'dry' | 'controlled';
  countryOfOrigin?: string;
  standardBarcodeFormat: 'EAN-13' | 'GTIN-14' | 'UPC-A';
  status?: CatalogProductStatus;
  statusReason?: string;
  statusChangedAt?: string;
  statusChangedBy?: string;
  adminNotes?: AdminInternalNote[];
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
  status?: CatalogOfferStatus;
  statusReason?: string;
  statusChangedAt?: string;
  statusChangedBy?: string;
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

export interface DeliveryPartner {
  id: string;
  registrationCode: string;
  type: DeliveryPartnerType;
  name: string;
  phone: string;
  city: string;
  governorateId: string;
  serviceZoneIds: string[];
  accountStatus: DeliveryAccountStatus;
  statusReason?: string;
  statusChangedAt?: string;
  statusChangedBy?: string;
  kyc?: AccountKycInfo;
  adminNotes?: AdminInternalNote[];
  payoutAccount?: {
    method: 'cash' | 'bank' | 'zaincash';
    accountRef?: string;
  };
  acceptedTermsAt?: string;
  termsVersion?: string;
  createdAt: string;
}

export interface DeliveryVehicle {
  id: string;
  ownerType: DeliveryProviderType;
  partnerId?: string;
  plateNumber: string;
  vehicleClass: DeliveryVehicleClass;
  makeModel: string;
  year?: number;
  capacityUnits: number;
  temperatureSupport: VehicleTemperatureType[];
  status: DeliveryVehicleStatus;
  statusReason?: string;
  statusChangedAt?: string;
  statusChangedBy?: string;
  docsExpiry?: {
    registrationExpiry?: string;
    insuranceExpiry?: string;
    inspectionExpiry?: string;
  };
  createdAt: string;
}

export interface DeliveryDriver {
  id: string;
  providerType: DeliveryProviderType;
  partnerId?: string;
  name: string;
  phone: string;
  licenseNo?: string;
  licenseExpiry?: string;
  assignedVehicleId?: string;
  governorateId: string;
  serviceZoneIds: string[];
  accountStatus: DeliveryAccountStatus;
  statusReason?: string;
  statusChangedAt?: string;
  statusChangedBy?: string;
  isAvailable: boolean;
  availability?: 'online' | 'offline';
  cashOnHandIQD?: number;
  adminNotes?: AdminInternalNote[];
  createdAt: string;
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
  status: 'pending' | 'approved' | 'assigned_driver' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'disputed';
  deliveryType: string;
  deliveryZoneId?: string;
  deliveryJobId?: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  deliveryPin: string;
  paidAt?: string;
  deliveredAt?: string;
  createdAt: string;
  notes?: string;
  adminFlags?: {
    forcedDelivery?: boolean;
    cancelledByAdmin?: boolean;
  };
}

export type VanModuleSection =
  | 'pos_sell'
  | 'deliveries'
  | 'customers_credit'
  | 'returns_rma'
  | 'inventory_audit'
  | 'restock'
  | 'navigation'
  | 'manage'
  | 'finance_settlement'
  | 'performance';

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
  category?: string;
  subCategory?: string;
  batchNumber?: string;
  expiryDate?: string;
  bulkDiscountMinQty?: number;
  bulkUnitPriceIQD?: number;
  lastPhysicalCountQty?: number;
  lastAuditAt?: string;
}

export interface VanExpenseItem {
  id: string;
  driverId: string;
  supplierId: string;
  category: 'fuel' | 'toll_parking' | 'loading_labor' | 'maintenance' | 'other';
  description: string;
  amountIQD: number;
  receiptRef?: string;
  createdAt: string;
}

export interface VanReturnItem {
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

export interface VanShiftReportItem {
  id: string;
  driverId: string;
  driverName: string;
  supplierId: string;
  date: string;
  expectedCashIQD: number;
  actualCashIQD: number;
  cashVarianceIQD: number;
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

export interface VanKPIs {
  totalStops: number;
  visitedOrSoldStops: number;
  soldStops: number;
  visitCompliancePercent: number;
  strikeRatePercent: number;
  averageDropSizeIQD: number;
  totalLoadedValueIQD: number;
  remainingStockValueIQD: number;
  totalExpensesIQD: number;
  netCashDueIQD: number;
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

export type ExpiryAlertChannel = 'retail' | 'wholesale' | 'both';

export interface NearExpiryAlertItem {
  id: string;
  source: 'store_inventory' | 'supplier_stock';
  storeId?: string;
  supplierId?: string;
  supplierName?: string;
  barcode: string;
  productName: string;
  category: string;
  unit: string;
  imageUrl?: string;
  stockQuantity: number;
  costPriceIQD: number;
  sellingPriceIQD: number;
  capitalAtRiskIQD: number;
  expiryDate: string;
  daysRemaining: number;
  isExpired: boolean;
  urgency: 'expired' | 'critical' | 'warning' | 'upcoming' | 'safe';
  retailOffer?: {
    active: boolean;
    barcode: string;
    priceIQD: number;
    oldPrice?: number;
    discountPercent: number;
    promoBadge?: string;
  } | null;
  wholesaleOffer?: {
    active: boolean;
    offerId: string;
    priceIQD: number;
    clearanceDiscountPercent: number;
    expiryDate?: string;
    supplierName: string;
  } | null;
}

