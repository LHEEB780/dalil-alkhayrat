/**
 * Souq Al-Jumla - B2B Marketplace Types & Data Models
 * Multi-role architecture: Store, Supplier, Driver/Van Distributor, Platform Admin, Store B2C Customer
 */

export type UserRole = 'store' | 'supplier' | 'driver' | 'admin' | 'customer';

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

export interface UnifiedProduct {
  barcode: string; // Primary Key: EAN/GTIN
  nameAr: string;
  nameEn?: string;
  brand: string;
  category: string;
  unit: string; // e.g., 'كرتون (12 علبة)', 'شوال (50 كغم)'
  packageQuantity: number;
  imageUrl?: string;
  descriptionAr?: string;
  isPerishable: boolean;
  standardBarcodeFormat: 'EAN-13' | 'GTIN-14' | 'UPC-A';
  oldPrice?: number;
  discountPercent?: number;
  badgeType?: 'discount' | 'promo_day' | 'top_seller' | 'hot_deal';
  rating?: number;
  reviewsCount?: number;
  subCategory?: string;
  isSmartShipping?: boolean;
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
  customDomainSlug: string; // for public B2C storefront e.g., "almansoor-market"
  qrScanCount: number;
  createdAt: string;
}

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
  shiftStartTime?: string;
  dailyTargetIQD?: number;
  commissionRatePercent?: number;
  todayCashSalesIQD?: number;
  todayCreditSalesIQD?: number;
  todayDebtCollectedIQD?: number;
  availabilityStatus?: 'available' | 'busy';
  busyReason?: string;
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
  }[];
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

