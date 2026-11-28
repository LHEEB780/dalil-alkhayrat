import crypto from 'node:crypto';
import {
  UnifiedProduct,
  SupplierOffer,
  StoreProfile,
  StoreStaffAccount,
  StoreStaffPublic,
  StoreStaffRole,
  SupplierProfile,
  SellerBusinessType,
  VerificationStatus,
  DriverProfile,
  VanInventoryItem,
  VanRouteStop,
  VanTransactionRecord,
  VanLoadRequest,
  VanLoadRequestItem,
  CreditAccount,
  LedgerEntry,
  SubOrder,
  ParentOrder,
  StoreInventoryItem,
  CollectiveBuyingPool,
  StorePosterConfig,
  ShiftCloseReport,
  PaymentMethod,
  StorePOSSaleRecord,
  StorePOSReturnItem,
  StorePOSReturnRecord,
  CreditUpgradeRequest,
  SupplierReview,
  SupplierReviewSummary,
  Governorate,
  District,
  Area,
  DeliveryZone,
  Brand,
  SupplierInventoryBatch,
  VanExpenseRecord,
  VanExpenseCategory,
  VanReturnRecord,
  VanUnloadRecord,
  AdminAuditLog,
  AccountStatus,
  AdminInternalNote,
  AccountKycInfo,
  KycChecklistItem,
  KycChecklistKey,
  CatalogProductStatus,
  CatalogOfferStatus,
  CatalogBrandStatus,
  OrderStatus,
  SubOrderStatusHistoryEntry,
  Dispute,
  DisputeOpenedBy,
  DisputeReasonCode,
  DisputeStatus,
  DisputeResolutionType,
  DeliveryPartner,
  DeliveryPartnerType,
  DeliveryVehicle,
  DeliveryVehicleClass,
  DeliveryVehicleStatus,
  DeliveryDriver,
  DeliveryAccountStatus,
  DeliveryProviderType,
  DeliveryRateRule,
  DeliveryPlatformSettings,
  SupplierDeliverySettings,
  VehicleTemperatureType,
  DeliveryJob,
  DeliveryJobStatus,
  DeliveryJobFailureReasonCode,
  DeliveryJobHistoryEntry
} from './types.ts';
import {
  validateBarcode,
  computeProductQuality,
  computeOfferPriceAnomalyMap,
  QUALITY_FIELD_DEFINITIONS
} from '../../shared/productQuality.ts';
import {
  SHARED_CATEGORY_TREE,
  resolveSharedCategoryKey
} from '../../shared/categoryTree.ts';
import {
  validateSupplierOrderRules,
  FailedSupplierOrderRule,
  SupplierOrderRuleItem
} from '../../shared/orderRules.ts';
import {
  calculateDeliveryFee,
  getDeliveryOptionsForSupplier,
  getRequiredTemperatureForStorageTypes,
  isVehicleSuitable,
  ProductStorageKind,
  VEHICLE_CLASS_LABELS
} from '../../shared/deliveryRules.ts';
import {
  initialProducts,
  initialSuppliers,
  initialOffers,
  initialStores,
  initialDrivers,
  initialVanInventory,
  initialVanRouteStops,
  initialVanTransactions,
  initialCreditAccounts,
  initialLedgerEntries,
  initialStoreInventory,
  initialSubOrders,
  initialDisputes,
  initialCollectivePools,
  initialPosters,
  initialStorePOSSales,
  initialGovernorates,
  initialDistricts,
  initialAreas,
  initialDeliveryZones,
  initialBrands,
  initialSupplierInventoryBatches,
  initialVanExpenses,
  initialVanReturns,
  initialShiftReports,
  initialDeliveryPartners,
  initialDeliveryVehicles,
  initialDeliveryDrivers,
  initialDeliveryPlatformSettings,
  initialDeliveryRateRules,
  initialDeliveryJobs
} from './seed.ts';
import {
  applyProductFilters,
  scoreAndFilterProductsBySearch,
  ProductFilterState,
  ProductSortBy,
  ProductStorageType,
  ALL_STORAGE_TYPES
} from '../../shared/productFilters.ts';

const SERVER_CATEGORY_ALIASES: Record<string, string> = {
  'قهوة ومشروبات ساخنة': 'شاي وقهوة',
  'أرز وحبوب': 'مواد غذائية أساسية',
  'زيوت وسمن': 'زيوت وسمن ودهون',
  'ألبان وأجبان': 'ألبان وبيض',
  'منظفات وعناية': 'منظفات',
  'معلبات ومخللات': 'معلبات وأغذية محفوظة',
  'سكر ومحليات': 'مواد غذائية أساسية',
  'مشروبات وشاي': 'مشروبات',
  'مكرونة وشعرية': 'مواد غذائية أساسية'
};

export const SUBORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['approved', 'cancelled'],
  approved: ['assigned_driver', 'cancelled'],
  assigned_driver: ['out_for_delivery', 'approved', 'cancelled'],
  out_for_delivery: ['delivered', 'assigned_driver', 'cancelled'],
  delivered: ['disputed'],
  disputed: ['delivered', 'cancelled'],
  cancelled: []
};

export function getAllowedSubOrderTransitions(status: OrderStatus): OrderStatus[] {
  return SUBORDER_TRANSITIONS[status] ? [...SUBORDER_TRANSITIONS[status]] : [];
}

class AppDataStore {
  governorates: Governorate[] = [...initialGovernorates];
  districts: District[] = [...initialDistricts];
  areas: Area[] = [...initialAreas];
  deliveryZones: DeliveryZone[] = [...initialDeliveryZones];
  brands: Brand[] = [...initialBrands];
  products: UnifiedProduct[] = [...initialProducts];
  suppliers: SupplierProfile[] = [...initialSuppliers];
  offers: SupplierOffer[] = [...initialOffers];
  stores: StoreProfile[] = [...initialStores];
  drivers: DriverProfile[] = [...initialDrivers];
  vanInventory: VanInventoryItem[] = [...initialVanInventory];
  vanRouteStops: VanRouteStop[] = [...initialVanRouteStops];
  vanTransactions: VanTransactionRecord[] = [...initialVanTransactions];
  vanLoadRequests: VanLoadRequest[] = [];
  creditAccounts: CreditAccount[] = [...initialCreditAccounts];
  ledgerEntries: LedgerEntry[] = [...initialLedgerEntries];
  subOrders: SubOrder[] = [...initialSubOrders];
  disputes: Dispute[] = [...initialDisputes];
  storeInventory: StoreInventoryItem[] = [...initialStoreInventory];
  collectivePools: CollectiveBuyingPool[] = [...initialCollectivePools];
  posters: StorePosterConfig[] = [...initialPosters];
  shiftReports: ShiftCloseReport[] = [...initialShiftReports];
  vanExpenses: VanExpenseRecord[] = [...initialVanExpenses];
  vanReturns: VanReturnRecord[] = [...initialVanReturns];
  vanUnloadRecords: VanUnloadRecord[] = [];
  storePOSSales: StorePOSSaleRecord[] = [...initialStorePOSSales];
  storePOSReturns: StorePOSReturnRecord[] = [];
  creditUpgradeRequests: CreditUpgradeRequest[] = [];
  storeStaff: StoreStaffAccount[] = [];
  supplierInventoryBatches: SupplierInventoryBatch[] = [...initialSupplierInventoryBatches];
  deliveryPartners: DeliveryPartner[] = JSON.parse(JSON.stringify(initialDeliveryPartners));
  deliveryVehicles: DeliveryVehicle[] = JSON.parse(JSON.stringify(initialDeliveryVehicles));
  deliveryDrivers: DeliveryDriver[] = JSON.parse(JSON.stringify(initialDeliveryDrivers));
  deliveryRateRules: DeliveryRateRule[] = JSON.parse(JSON.stringify(initialDeliveryRateRules));
  deliveryPlatformSettings: DeliveryPlatformSettings = JSON.parse(
    JSON.stringify(initialDeliveryPlatformSettings)
  );
  deliveryJobs: DeliveryJob[] = JSON.parse(JSON.stringify(initialDeliveryJobs));
  private partnerRegistrationRateMap: Map<string, number[]> = new Map();

  constructor() {
    this.storeStaff = [
      {
        id: 'staff_mansoor_cashier',
        storeId: 'store_almansoor',
        storeName: 'سوبرماركت المنصور المركزي',
        name: 'حسين علاء الكاظمي',
        role: 'cashier',
        phone: '07712223344',
        branchId: 'branch_main',
        branchName: 'الفرع الرئيسي - المنصور',
        isActive: true,
        accountStatus: 'active',
        kyc: {
          checklist: [
            { key: 'commercial_license', status: 'approved' },
            { key: 'owner_id', status: 'approved' },
            { key: 'address_proof', status: 'approved' },
            { key: 'phone_verified', status: 'approved' }
          ]
        },
        passwordHash: this.hashStaffPassword('1234'),
        createdAt: '2026-09-12T08:00:00.000Z',
        lastLoginAt: '2026-11-24T09:15:00.000Z'
      },
      {
        id: 'staff_karrada_accountant',
        storeId: 'store_karrada',
        storeName: 'أسواق دجلة الخير - الكرادة',
        name: 'نور الهدى صباح',
        role: 'accountant',
        phone: '07708889911',
        branchId: 'branch_karrada',
        branchName: 'فرع الكرادة داخل',
        isActive: true,
        accountStatus: 'active',
        kyc: {
          checklist: [
            { key: 'commercial_license', status: 'approved' },
            { key: 'owner_id', status: 'approved' },
            { key: 'address_proof', status: 'approved' },
            { key: 'phone_verified', status: 'approved' }
          ]
        },
        passwordHash: this.hashStaffPassword('1234'),
        createdAt: '2026-10-03T10:30:00.000Z',
        lastLoginAt: '2026-11-23T16:40:00.000Z'
      }
    ];
    this.ensureProductBrandLinks();
    this.ensureSubOrderHistories();
    this.ensureSupplierDeliveryDefaults();
    this.ensureDeliveryDriverDefaults();
  }

  private ensureDeliveryDriverDefaults() {
    for (const d of this.deliveryDrivers) {
      if (!d.availability) {
        d.availability = d.isAvailable === false ? 'offline' : 'online';
      }
      if (typeof d.cashOnHandIQD !== 'number') {
        d.cashOnHandIQD = 0;
      }
    }
    if (typeof this.deliveryPlatformSettings.staleOpenJobMinutes !== 'number') {
      this.deliveryPlatformSettings.staleOpenJobMinutes = 30;
    }
    if (typeof this.deliveryPlatformSettings.maxActiveJobsPerDriver !== 'number') {
      this.deliveryPlatformSettings.maxActiveJobsPerDriver = 3;
    }
  }
  auditLogs: AdminAuditLog[] = [
    {
      id: 'aud_seed_1',
      at: '2026-11-24T10:15:00.000Z',
      actorId: 'admin_root',
      actorName: 'المدير العام (Super Admin)',
      action: 'supplier.verify',
      entityType: 'supplier',
      entityId: 'supp_rafidain',
      summaryAr: 'اعتماد وتوثيق شركة الرافدين للتجارة العامة والأغذية كمورد تجاري موثق',
      summaryEn: 'Verified Al-Rafidain General Trading & Food Co. as a verified business supplier',
      before: { verificationStatus: 'pending' },
      after: { verificationStatus: 'verified_business' },
      reason: 'استكمال السجل التجاري وإجازة الاستيراد المصدقة'
    },
    {
      id: 'aud_seed_2',
      at: '2026-11-23T14:40:00.000Z',
      actorId: 'admin_root',
      actorName: 'المدير العام (Super Admin)',
      action: 'credit.block_account',
      entityType: 'credit_account',
      entityId: 'cred_karrada_rafidain',
      summaryAr: 'تعليق التسهيل الائتماني لحساب أسواق دجلة الخير - الكرادة لتجاوز فترة السداد 60 يوماً',
      summaryEn: 'Suspended credit facility for Tigris Khair Markets - Karrada due to >60d overdue aging',
      before: { isBlocked: false },
      after: { isBlocked: true },
      reason: 'تجاوز سقف التأخير المسموح في شريحة 61-90 يوماً'
    },
    {
      id: 'aud_seed_3',
      at: '2026-11-21T09:05:00.000Z',
      actorId: 'admin_root',
      actorName: 'المدير العام (Super Admin)',
      action: 'supplier.verify',
      entityType: 'supplier',
      entityId: 'supp_dijla',
      summaryAr: 'منح شارة موزع معتمد لمجموعة دجلة للمشروبات والسلع الغذائية',
      summaryEn: 'Granted Authorized Distributor status to Dijla Beverages & Food Group',
      before: { verificationStatus: 'verified' },
      after: { verificationStatus: 'authorized_distributor' },
      reason: 'تقديم كتاب الوكالة الحصرية المصدق'
    },
    {
      id: 'aud_seed_4',
      at: '2026-11-18T16:20:00.000Z',
      actorId: 'admin_root',
      actorName: 'المدير العام (Super Admin)',
      action: 'order.assign_driver',
      entityType: 'sub_order',
      entityId: 'ord_sub_101',
      summaryAr: 'متابعة وتثبيت إسناد الطلبية الفرعية ord_sub_101 إلى فان أحمد كاظم البغدادي',
      summaryEn: 'Confirmed driver assignment on sub-order ord_sub_101 to Ahmed Kadhim Al-Baghdadi',
      before: { status: 'approved' },
      after: { status: 'out_for_delivery', assignedDriverId: 'drv_ahmed_baghdad' },
      reason: 'تأمين التوصيل الصباحي السريع لقاطع الكرخ والمنصور'
    },
    {
      id: 'aud_seed_5',
      at: '2026-11-15T11:30:00.000Z',
      actorId: 'admin_root',
      actorName: 'المدير العام (Super Admin)',
      action: 'settings.update_rules',
      entityType: 'platform_settings',
      entityId: 'global_order_rules',
      summaryAr: 'تفعيل سياسة الحد الأدنى للطلب بالقيمة المالية للمورد فقط عبر المنصة',
      summaryEn: 'Enforced supplier-level minimum order value policy across platform',
      before: { enforceOfferMinQuantityDefault: true },
      after: { enforceOfferMinQuantityDefault: false },
      reason: 'تبسيط تجربة الشراء بالجملة للتجار الصغار'
    }
  ];
  supplierReviews: SupplierReview[] = [
    {
      id: 'rev_raf_1',
      supplierId: 'supp_rafidain',
      storeId: 'store_yarmouk',
      storeName: 'أسواق اليرموك المركزية',
      rating: 5,
      serviceRating: 5,
      qualityRating: 5,
      comment: 'التزام ممتاز بمواعيد الفان في المنصور واليرموك، وتواريخ إنتاج الزيوت والأرز جديدة دائماً بدون أي كرتون تالف.',
      isVerifiedOrder: true,
      orderId: 'ORD-9012',
      createdAt: '2026-11-12T09:30:00Z'
    },
    {
      id: 'rev_raf_2',
      supplierId: 'supp_rafidain',
      storeId: 'store_karrada',
      storeName: 'ماركت الزهور الحديث',
      rating: 5,
      serviceRating: 5,
      qualityRating: 5,
      comment: 'تعامل راقٍ في نظام الائتمان وفواتير دقيقة مطابقة للكميات المستلمة.',
      isVerifiedOrder: true,
      createdAt: '2026-11-08T14:15:00Z'
    },
    {
      id: 'rev_raf_3',
      supplierId: 'supp_rafidain',
      storeId: 'store_adhamiya',
      storeName: 'سوبرماركت النور التجاري',
      rating: 4,
      serviceRating: 4,
      qualityRating: 5,
      comment: 'أسعار الجملة منافسة جداً للكميات، فقط تأخر الفان نصف ساعة وقت الذروة وتم تعويضه بسلاسة.',
      isVerifiedOrder: true,
      createdAt: '2026-11-03T11:00:00Z'
    },
    {
      id: 'rev_tig_1',
      supplierId: 'supp_tigris',
      storeId: 'store_almansoor',
      storeName: 'سوبرماركت المنصور المركزي',
      rating: 5,
      serviceRating: 5,
      qualityRating: 5,
      comment: 'سيارات التبريد ممتازة والألبان والأجبان تصل بدرجة برودة مثالية خلال أقل من ساعة.',
      isVerifiedOrder: true,
      createdAt: '2026-11-14T08:45:00Z'
    },
    {
      id: 'rev_tig_2',
      supplierId: 'supp_tigris',
      storeId: 'store_bayaa',
      storeName: 'أسواق الخير للتموين',
      rating: 5,
      serviceRating: 5,
      qualityRating: 4,
      comment: 'سرعة استجابة عالية من المندوب المباشر وتبديل فوري لأي عبوة تحتاج استبدال.',
      isVerifiedOrder: true,
      createdAt: '2026-11-09T16:20:00Z'
    },
    {
      id: 'rev_nah_1',
      supplierId: 'supp_nahrain',
      storeId: 'store_karrada',
      storeName: 'ميني ماركت دجلة',
      rating: 5,
      serviceRating: 5,
      qualityRating: 5,
      comment: 'وكالات القهوة والشاي أصلية 100% والشحن المجاني وفر علينا كلفة النقل بالكامل.',
      isVerifiedOrder: true,
      createdAt: '2026-11-11T13:10:00Z'
    },
    {
      id: 'rev_nah_2',
      supplierId: 'supp_nahrain',
      storeId: 'store_yarmouk',
      storeName: 'أسواق بغداد الجديدة',
      rating: 5,
      serviceRating: 4,
      qualityRating: 5,
      comment: 'تغليف ممتاز للكرتونات وتنوع ممتاز في كبسولات القهوة والشاي السيلاني.',
      isVerifiedOrder: true,
      createdAt: '2026-11-05T10:05:00Z'
    },
    {
      id: 'rev_bab_1',
      supplierId: 'supp_babylon',
      storeId: 'store_doura',
      storeName: 'سوبرماركت الفرات',
      rating: 5,
      serviceRating: 5,
      qualityRating: 5,
      comment: 'أفضل أسعار الجملة لزيوت الطعام والسمنة مع خصم نقدي واضح على الفاتورة.',
      isVerifiedOrder: true,
      createdAt: '2026-11-10T12:40:00Z'
    },
    {
      id: 'rev_jam_1',
      supplierId: 'supp_jamila',
      storeId: 'store_jamila',
      storeName: 'أسواق الرافدين الغذائية',
      rating: 5,
      serviceRating: 4,
      qualityRating: 5,
      comment: 'أوزان الشوالات مضبوطة وأسعار المصنع ممتازة للتجهيز الأسبوعي.',
      isVerifiedOrder: true,
      createdAt: '2026-11-07T15:00:00Z'
    },
    {
      id: 'rev_bag_1',
      supplierId: 'supp_baghdad_canned',
      storeId: 'store_almansoor',
      storeName: 'سوبرماركت المنصور المركزي',
      rating: 5,
      serviceRating: 5,
      qualityRating: 5,
      comment: 'توصيل فوري للمعلبات والبسكويت بتواريخ صالحة لمدة طويلة وتغليف نظيف.',
      isVerifiedOrder: true,
      createdAt: '2026-11-13T17:30:00Z'
    }
  ];

  // ================= GEOGRAPHIC HIERARCHY & ZONES =================
  getGovernoratesHierarchy() {
    return this.governorates.map(gov => {
      const govZones = this.deliveryZones.filter(z => z.governorateId === gov.id);
      const govDistricts = this.districts
        .filter(d => d.governorateId === gov.id)
        .map(dist => {
          const distAreas = this.areas
            .filter(a => a.districtId === dist.id)
            .map(area => {
              const zone = govZones.find(z => z.id === area.deliveryZoneId);
              return {
                ...area,
                deliveryZoneNameAr: zone?.nameAr || '',
                deliveryZoneNameEn: zone?.nameEn || ''
              };
            });
          return {
            ...dist,
            areas: distAreas
          };
        });
      return {
        ...gov,
        districts: govDistricts,
        deliveryZones: govZones
      };
    });
  }

  getDeliveryZones(governorateId?: string): DeliveryZone[] {
    if (governorateId) {
      return this.deliveryZones.filter(z => z.governorateId === governorateId);
    }
    return this.deliveryZones;
  }

  // ================= CENTRALIZED ACCOUNT OPERABILITY HELPERS =================
  getSupplierAccountStatus(s: SupplierProfile): AccountStatus {
    return s.accountStatus || 'active';
  }

  getSupplierVerificationStatus(s: SupplierProfile): VerificationStatus {
    return s.verificationStatus ?? (s.isVerified ? 'verified' : 'pending');
  }

  isSupplierOperable(s: SupplierProfile): boolean {
    return (
      this.getSupplierAccountStatus(s) === 'active' &&
      this.getSupplierVerificationStatus(s) !== 'pending'
    );
  }

  getStoreAccountStatus(st: StoreProfile): AccountStatus {
    return st.accountStatus || 'active';
  }

  getStoreVerificationStatus(st: StoreProfile): 'pending' | 'verified' {
    return st.verificationStatus ?? (st.isVerified === false ? 'pending' : 'verified');
  }

  isStoreOperable(st: StoreProfile): boolean {
    return this.getStoreAccountStatus(st) === 'active';
  }

  getDriverAccountStatus(d: DriverProfile): AccountStatus {
    return d.accountStatus || 'active';
  }

  assertDriverOperable(driverId: string): DriverProfile {
    const driver = this.drivers.find(d => d.id === driverId);
    if (!driver) {
      throw new Error('السائق غير موجود');
    }
    if (this.getDriverAccountStatus(driver) !== 'active') {
      throw new Error(`لا يمكن تنفيذ الإجراء: حساب السائق (${driver.name}) موقوف أو غير نشط حالياً`);
    }
    return driver;
  }

  getStaffAccountStatus(staff: StoreStaffAccount): AccountStatus {
    if (staff.accountStatus) return staff.accountStatus;
    return staff.isActive === false ? 'suspended' : 'active';
  }

  getProductStatus(p: UnifiedProduct): CatalogProductStatus {
    return p.status || 'active';
  }

  isProductOperable(p: UnifiedProduct): boolean {
    return this.getProductStatus(p) === 'active';
  }

  getOfferStatus(o: SupplierOffer): CatalogOfferStatus {
    return o.status || 'active';
  }

  isOfferOperable(o: SupplierOffer): boolean {
    if (this.getOfferStatus(o) !== 'active') return false;
    const supplier = this.suppliers.find((s) => s.id === o.supplierId);
    if (!supplier || !this.isSupplierOperable(supplier)) return false;
    const product = this.products.find((p) => p.barcode === o.barcode);
    if (!product || !this.isProductOperable(product)) return false;
    return true;
  }

  getBrandStatus(b: Brand): CatalogBrandStatus {
    return b.status || 'active';
  }

  isBrandVisible(b: Brand): boolean {
    return this.getBrandStatus(b) === 'active';
  }

  getPublicBrands(): Brand[] {
    return this.brands.filter((b) => this.isBrandVisible(b));
  }

  private ensureProductBrandLinks() {
    let seq = 1;
    for (const p of this.products) {
      if (p.brandId && this.brands.some((b) => b.id === p.brandId)) {
        continue;
      }
      const rawBrand = (p.brand || '').trim();
      if (!rawBrand) continue;
      const lower = rawBrand.toLowerCase();
      let matched = this.brands.find(
        (b) => b.nameAr.trim().toLowerCase() === lower || b.nameEn.trim().toLowerCase() === lower
      );
      if (!matched) {
        const cleanSlug = rawBrand
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_|_$/g, '');
        const id = p.brandId || (cleanSlug ? `brand_${cleanSlug}` : `brand_auto_${seq++}`);
        const uniqueId = this.brands.some((b) => b.id === id) ? `${id}_${seq++}` : id;
        matched = {
          id: uniqueId,
          nameAr: rawBrand,
          nameEn: rawBrand,
          status: 'active',
          createdAt: '2026-10-01'
        };
        this.brands.push(matched);
      }
      p.brandId = matched.id;
    }
  }

  getSuppliers(params?: {
    deliveryZoneId?: string;
    businessType?: SellerBusinessType;
    verificationStatus?: VerificationStatus;
  }): SupplierProfile[] {
    let result = this.suppliers
      .filter(s => this.isSupplierOperable(s))
      .map(s => ({
        ...s,
        businessType: s.businessType ?? 'wholesaler',
        verificationStatus: this.getSupplierVerificationStatus(s),
        accountStatus: this.getSupplierAccountStatus(s)
      }));

    if (params?.deliveryZoneId) {
      result = result.filter(s => s.serviceZoneIds.includes(params.deliveryZoneId!));
    }
    if (params?.businessType) {
      result = result.filter(s => s.businessType === params.businessType);
    }
    if (params?.verificationStatus) {
      result = result.filter(s => s.verificationStatus === params.verificationStatus);
    }
    return result;
  }

  getSuppliersByZone(deliveryZoneId?: string): SupplierProfile[] {
    return this.getSuppliers({ deliveryZoneId });
  }

  // ================= PRODUCTS & OFFERS =================
  getProductsWithOffers(params?: {
    category?: string;
    query?: string;
    barcode?: string;
    deliveryZoneId?: string;
    brandId?: string | string[];
    countryOfOrigin?: string | string[];
    storageType?: string | string[];
    supplierId?: string | string[];
    inStock?: boolean;
    minPrice?: number;
    maxPrice?: number;
    onSale?: boolean;
    verifiedOnly?: boolean;
    sortBy?: ProductSortBy;
  }) {
    let result = this.products.filter(p => this.isProductOperable(p));

    if (params?.barcode) {
      result = result.filter(p => p.barcode === params.barcode);
    }
    if (params?.category && params.category !== 'الكل') {
      const resolvedCat = SERVER_CATEGORY_ALIASES[params.category] || params.category;
      result = result.filter(p => p.category === params.category || p.category === resolvedCat);
    }

    let searchScoreMap: Map<string, number> | undefined;
    if (params?.query && params.query.trim()) {
      const searchOutcome = scoreAndFilterProductsBySearch(result, params.query);
      result = searchOutcome.items;
      searchScoreMap = searchOutcome.scoreMap;
    }

    const activeSuppliers = this.getSuppliers(
      params?.deliveryZoneId ? { deliveryZoneId: params.deliveryZoneId } : undefined
    );
    const eligibleSupplierIds = new Set(activeSuppliers.map(s => s.id));

    const offersByBarcode = new Map<string, SupplierOffer[]>();
    for (const o of this.offers) {
      if (!this.isOfferOperable(o)) continue;
      if (!eligibleSupplierIds.has(o.supplierId)) continue;
      let list = offersByBarcode.get(o.barcode);
      if (!list) {
        list = [];
        offersByBarcode.set(o.barcode, list);
      }
      list.push(o);
    }

    const mapped = result.map(product => {
      const productOffers = [...(offersByBarcode.get(product.barcode) || [])];
      // Sort offers: lowest price first
      productOffers.sort((a, b) => a.priceIQD - b.priceIQD);

      const minPrice = productOffers.length > 0 ? productOffers[0].priceIQD : 0;
      const maxPrice = productOffers.length > 0 ? Math.max(...productOffers.map(o => o.priceIQD)) : 0;
      const suppliersCount = productOffers.length;
      const totalAvailableStock = productOffers.reduce((sum, o) => sum + o.availableStock, 0);
      const longestCreditDays = productOffers.reduce((max, o) => Math.max(max, o.paymentTerms.maxCreditDays), 0);
      const fastestDeliveryDays = productOffers.length > 0 ? Math.min(...productOffers.map(o => o.deliveryDays)) : 1;

      const resolvedImages =
        product.images && product.images.length > 0
          ? product.images
          : product.imageUrl
          ? [product.imageUrl]
          : undefined;

      return {
        ...product,
        imageUrl: product.imageUrl || resolvedImages?.[0],
        images: resolvedImages,
        offers: productOffers,
        minPrice,
        maxPrice,
        suppliersCount,
        totalAvailableStock,
        longestCreditDays,
        fastestDeliveryDays
      };
    });

    const baseMapped = params?.deliveryZoneId
      ? mapped.filter(p => p.offers.length > 0)
      : mapped;

    const toArr = (v?: string | string[]): string[] =>
      !v ? [] : Array.isArray(v) ? v.filter(Boolean) : v.split(',').map(s => s.trim()).filter(Boolean);

    const brands = toArr(params?.brandId);
    const countries = toArr(params?.countryOfOrigin);
    const storageTypes = toArr(params?.storageType).filter((s): s is ProductStorageType =>
      ALL_STORAGE_TYPES.includes(s as ProductStorageType)
    );
    const supplierIds = toArr(params?.supplierId);

    const hasExplicitFiltersOrSort =
      brands.length > 0 ||
      countries.length > 0 ||
      storageTypes.length > 0 ||
      supplierIds.length > 0 ||
      Boolean(params?.inStock) ||
      typeof params?.minPrice === 'number' ||
      typeof params?.maxPrice === 'number' ||
      Boolean(params?.onSale) ||
      Boolean(params?.verifiedOnly) ||
      Boolean(params?.sortBy) ||
      Boolean(params?.query && params.query.trim());

    if (!hasExplicitFiltersOrSort) {
      return baseMapped;
    }

    const filterState: ProductFilterState = {
      brands,
      countries,
      storageTypes,
      supplierIds,
      inStockOnly: Boolean(params?.inStock),
      minPriceIQD: params?.minPrice,
      maxPriceIQD: params?.maxPrice,
      onSaleOnly: Boolean(params?.onSale),
      verifiedOnly: Boolean(params?.verifiedOnly),
      sortBy: params?.sortBy || 'relevance'
    };

    return applyProductFilters(baseMapped, [], filterState, {
      suppliers: this.suppliers,
      searchScores: searchScoreMap
    });
  }

  // ================= CREDIT & LEDGER =================
  getCreditAccount(storeId: string, supplierId: string): CreditAccount | undefined {
    return this.creditAccounts.find(c => c.storeId === storeId && c.supplierId === supplierId);
  }

  getStoreCreditAccounts(storeId: string): CreditAccount[] {
    return this.creditAccounts.filter(c => c.storeId === storeId);
  }

  getSupplierCreditAccounts(supplierId: string): CreditAccount[] {
    return this.creditAccounts.filter(c => c.supplierId === supplierId);
  }

  getLedger(creditAccountId: string): LedgerEntry[] {
    return this.ledgerEntries
      .filter(l => l.creditAccountId === creditAccountId)
      .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  }

  addLedgerEntry(entry: Omit<LedgerEntry, 'id' | 'isReversed'>): LedgerEntry {
    const newId = `led_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newEntry: LedgerEntry = {
      ...entry,
      id: newId,
      isReversed: false
    };
    this.ledgerEntries.push(newEntry);

    // Update account balance
    const account = this.creditAccounts.find(c => c.id === entry.creditAccountId);
    if (account) {
      if (entry.debitIQD > 0) {
        account.currentUsedCreditIQD += entry.debitIQD;
        account.availableCreditIQD = Math.max(0, account.creditLimitIQD - account.currentUsedCreditIQD);
        account.aging.bucket0_30 += entry.debitIQD;
      }
      if (entry.creditIQD > 0) {
        account.currentUsedCreditIQD = Math.max(0, account.currentUsedCreditIQD - entry.creditIQD);
        account.availableCreditIQD = Math.max(0, account.creditLimitIQD - account.currentUsedCreditIQD);
        account.lastPaymentDate = entry.entryDate;

        // Apply payment oldest bucket first (FIFO)
        let remainingCredit = entry.creditIQD;
        const buckets: ('bucket90Plus' | 'bucket61_90' | 'bucket31_60' | 'bucket0_30')[] = [
          'bucket90Plus', 'bucket61_90', 'bucket31_60', 'bucket0_30'
        ];
        for (const bucket of buckets) {
          if (remainingCredit <= 0) break;
          const deductible = Math.min(account.aging[bucket], remainingCredit);
          account.aging[bucket] -= deductible;
          remainingCredit -= deductible;
        }
      }

      // Check automatic block condition
      const hasOverdueDebt = account.aging.bucket61_90 > 0 || account.aging.bucket90Plus > 0;
      const isOverLimit = account.currentUsedCreditIQD > account.creditLimitIQD;

      if ((hasOverdueDebt || isOverLimit) && !account.supplierExceptionAllowed) {
        account.isBlocked = true;
        account.blockReason = isOverLimit 
          ? `تجاوز سقف الائتمان (${account.currentUsedCreditIQD.toLocaleString()} د.ع / ${account.creditLimitIQD.toLocaleString()} د.ع)`
          : `تأخر سداد فواتير تجاوزت 60 يوماً بقيمة ${(account.aging.bucket61_90 + account.aging.bucket90Plus).toLocaleString()} د.ع`;
      } else if (!hasOverdueDebt && !isOverLimit) {
        account.isBlocked = false;
        account.blockReason = undefined;
      }
    }

    return newEntry;
  }

  reverseLedgerEntry(entryId: string, reason: string): LedgerEntry {
    const target = this.ledgerEntries.find(l => l.id === entryId);
    if (!target) {
      throw new Error('Ledger entry not found');
    }
    if (target.isReversed) {
      throw new Error('This ledger entry has already been reversed');
    }

    // Mark target as reversed
    target.isReversed = true;

    // Create opposite entry (reversing entry / قيد عكسي)
    const reversingEntry = this.addLedgerEntry({
      creditAccountId: target.creditAccountId,
      supplierId: target.supplierId,
      storeId: target.storeId,
      referenceType: 'REVERSAL',
      referenceId: `REV-${target.id}`,
      entryDate: new Date().toISOString().split('T')[0],
      debitIQD: target.creditIQD, // swap debit and credit
      creditIQD: target.debitIQD,
      runningBalanceIQD: 0, // recalculated by service
      descriptionAr: `قيد عكسي لتصحيح السجل (${target.referenceId}) - السبب: ${reason}`
    });

    target.reversedByEntryId = reversingEntry.id;
    target.reversalReason = reason;

    return reversingEntry;
  }

  updateCreditLimit(creditAccountId: string, newLimitIQD: number, allowException: boolean) {
    const acc = this.creditAccounts.find(c => c.id === creditAccountId);
    if (!acc) throw new Error('Credit account not found');
    acc.creditLimitIQD = newLimitIQD;
    acc.supplierExceptionAllowed = allowException;
    acc.availableCreditIQD = Math.max(0, acc.creditLimitIQD - acc.currentUsedCreditIQD);
    if (acc.currentUsedCreditIQD <= acc.creditLimitIQD) {
      acc.isBlocked = false;
      acc.blockReason = undefined;
    } else if (!allowException) {
      acc.isBlocked = true;
      acc.blockReason = 'تجاوز سقف الائتمان المعدل';
    }
    return acc;
  }

  calculateStoreReliabilityScore(account: CreditAccount): number {
    let score = 96;
    if (account.aging.bucket31_60 > 0) score -= 6;
    if (account.aging.bucket61_90 > 0) score -= 22;
    if (account.aging.bucket90Plus > 0) score -= 35;
    if (account.isBlocked) score -= 20;
    const utilization = account.creditLimitIQD > 0 ? account.currentUsedCreditIQD / account.creditLimitIQD : 0;
    if (utilization > 0.9) score -= 5;
    return Math.max(35, Math.min(99, score));
  }

  createCreditUpgradeRequest(params: {
    creditAccountId: string;
    requestedLimitIQD: number;
    reason?: string;
  }): CreditUpgradeRequest {
    const acc = this.creditAccounts.find(c => c.id === params.creditAccountId);
    if (!acc) throw new Error('الحساب الائتماني غير موجود');
    if (!params.requestedLimitIQD || params.requestedLimitIQD <= acc.creditLimitIQD) {
      throw new Error('يجب أن يكون السقف المطلوب أكبر من السقف الحالي');
    }

    const supp = this.suppliers.find(s => s.id === acc.supplierId);
    const reliability = this.calculateStoreReliabilityScore(acc);
    const hasOverdue = acc.aging.bucket61_90 > 0 || acc.aging.bucket90Plus > 0 || acc.isBlocked;

    const reqItem: CreditUpgradeRequest = {
      id: `CREV-${Date.now()}`,
      creditAccountId: acc.id,
      storeId: acc.storeId,
      storeName: acc.storeName,
      supplierId: acc.supplierId,
      supplierName: supp?.companyName || acc.supplierId,
      currentLimitIQD: acc.creditLimitIQD,
      requestedLimitIQD: Number(params.requestedLimitIQD),
      reason:
        params.reason?.trim() ||
        'توسّع حجم المشتريات الشهرية وانتظام السداد عبر المنصة',
      storeReliabilityScore: reliability,
      status: hasOverdue ? 'deferred_by_policy' : 'platform_review',
      platformResponseAr: hasOverdue
        ? 'توصي سياسة التقييم الائتماني في المنصة بتسوية الفواتير المتأخرة أولاً ليتم فتح الترقية التلقائية للسقف دون أي عائق.'
        : 'تم استلام طلب المراجعة في لجنة التقييم الائتماني بالمنصة، وتم ترشيح حسابكم بناءً على انتظام السداد لمراجعته مع المورد.',
      createdAt: new Date().toISOString()
    };

    this.creditUpgradeRequests.unshift(reqItem);
    return reqItem;
  }

  resolveCreditUpgradeRequest(params: {
    requestId: string;
    decision: 'approved' | 'deferred_by_policy';
    approvedLimitIQD?: number;
  }): CreditUpgradeRequest {
    const reqItem = this.creditUpgradeRequests.find(r => r.id === params.requestId);
    if (!reqItem) throw new Error('طلب التقييم الائتماني غير موجود');

    if (params.decision === 'approved') {
      const targetLimit =
        params.approvedLimitIQD && params.approvedLimitIQD > reqItem.currentLimitIQD
          ? Number(params.approvedLimitIQD)
          : reqItem.requestedLimitIQD;
      this.updateCreditLimit(reqItem.creditAccountId, targetLimit, false);
      reqItem.requestedLimitIQD = targetLimit;
      reqItem.status = 'approved';
      reqItem.platformResponseAr = `تمت الموافقة عبر تقييم منصة دليل الخيرات ورفع سقف الائتمان إلى ${targetLimit.toLocaleString()} د.ع تقديراً لانتظام السداد.`;
    } else {
      reqItem.status = 'deferred_by_policy';
      reqItem.platformResponseAr =
        'توصي لجنة التقييم الائتماني في دليل الخيرات بالاستمرار على السداد المنتظم لدورة فواتير إضافية قبل ترقية السقف الحالي.';
    }
    reqItem.resolvedAt = new Date().toISOString();
    return reqItem;
  }

  // ================= CART & MULTI-SUPPLIER ORDER SPLIT =================
  createSplitOrder(params: {
    storeId: string;
    items: {
      offerId: string;
      barcode: string;
      quantity: number;
    }[];
    paymentMethod: PaymentMethod;
    notes?: string;
    deliveryZoneId?: string;
  }): ParentOrder {
    const store = this.stores.find(s => s.id === params.storeId);
    if (!store) throw new Error('Store profile not found');
    if (!this.isStoreOperable(store)) {
      throw new Error(`حساب المتجر (${store.name}) موقوف أو غير نشط حالياً ولا يمكنه إتمام الطلبات`);
    }

    if (!params.items || params.items.length === 0) {
      throw new Error('بيانات الطلب غير مكتملة');
    }

    // Phase 1: Validate everything before deducting stock or creating sub-orders / ledger entries
    const offerQuantities: Record<string, number> = {};
    const validatedLines: {
      offer: SupplierOffer;
      product: UnifiedProduct;
      quantity: number;
    }[] = [];

    for (const reqItem of params.items) {
      const qty = Number(reqItem.quantity);
      if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
        throw new Error(`الكمية المطلوبة للصنف (${reqItem.barcode}) غير صالحة`);
      }

      const offer = this.offers.find(o => o.id === reqItem.offerId);
      const product = this.products.find(p => p.barcode === reqItem.barcode);
      if (!offer || !product) {
        throw new Error(`Offer or product not found for barcode ${reqItem.barcode}`);
      }

      if (!this.isProductOperable(product)) {
        throw new Error(`لا يمكن إتمام الطلب: المنتج (${product.nameAr}) مخفي أو مؤرشف حالياً`);
      }

      if (this.getOfferStatus(offer) !== 'active') {
        throw new Error(`لا يمكن إتمام الطلب: عرض المورد (${offer.supplierName}) للمنتج (${product.nameAr}) موقوف حالياً`);
      }

      const supplier = this.suppliers.find(s => s.id === offer.supplierId);
      if (!supplier || !this.isSupplierOperable(supplier)) {
        throw new Error(`لا يمكن إتمام الطلب: حساب المورد (${offer.supplierName}) موقوف أو غير نشط حالياً`);
      }

      if (params.deliveryZoneId && !supplier.serviceZoneIds.includes(params.deliveryZoneId)) {
        throw new Error(`المورد (${supplier.companyName}) لا يغطي منطقة التوصيل المختارة حالياً`);
      }

      offerQuantities[offer.id] = (offerQuantities[offer.id] || 0) + qty;
      validatedLines.push({ offer, product, quantity: qty });
    }

    for (const offerId of Object.keys(offerQuantities)) {
      const totalOfferQty = offerQuantities[offerId];
      const offer = this.offers.find(o => o.id === offerId)!;
      const product = this.products.find(p => p.barcode === offer.barcode)!;

      const supplier = this.suppliers.find(s => s.id === offer.supplierId);

      if (
        supplier?.orderRules?.enforceOfferMinQuantity === true &&
        offer.minOrderQuantity > 0 &&
        totalOfferQty < offer.minOrderQuantity
      ) {
        throw new Error(
          `الكمية المطلوبة من (${product.nameAr}) لدى المورد (${offer.supplierName}) هي ${totalOfferQty}، والحد الأدنى للعرض هو ${offer.minOrderQuantity} (ينقصك ${offer.minOrderQuantity - totalOfferQty})`
        );
      }

      if (offer.availableStock < totalOfferQty) {
        throw new Error(`الكمية المطلوبة من ${product.nameAr} تتجاوز المخزون المتوفر لدى ${offer.supplierName}`);
      }
    }

    // Group items by supplier
    const supplierGroups: Record<string, {
      supplierId: string;
      supplierName: string;
      items: {
        barcode: string;
        productName: string;
        unit: string;
        quantity: number;
        unitPriceIQD: number;
        totalPriceIQD: number;
      }[];
      ruleItems: SupplierOrderRuleItem[];
      subtotalIQD: number;
    }> = {};

    for (const line of validatedLines) {
      const { offer, product, quantity } = line;
      if (!supplierGroups[offer.supplierId]) {
        supplierGroups[offer.supplierId] = {
          supplierId: offer.supplierId,
          supplierName: offer.supplierName,
          items: [],
          ruleItems: [],
          subtotalIQD: 0
        };
      }

      const lineTotal = offer.priceIQD * quantity;
      supplierGroups[offer.supplierId].items.push({
        barcode: product.barcode,
        productName: product.nameAr,
        unit: product.unit,
        quantity,
        unitPriceIQD: offer.priceIQD,
        totalPriceIQD: lineTotal
      });
      supplierGroups[offer.supplierId].ruleItems.push({
        barcode: product.barcode,
        quantity,
        unitPriceIQD: offer.priceIQD,
        unit: product.unit,
        packageQuantity: product.packageQuantity
      });
      supplierGroups[offer.supplierId].subtotalIQD += lineTotal;
    }

    const formatFailedRuleMessage = (rule: FailedSupplierOrderRule): string => {
      switch (rule.rule) {
        case 'minOrderValueIQD':
          return `الحد الأدنى لقيمة الطلب (المطلوب ${rule.required.toLocaleString()} د.ع، الحالي ${rule.current.toLocaleString()} د.ع، ينقصك ${rule.missing.toLocaleString()} د.ع)`;
        case 'minTotalQuantity':
          return `الحد الأدنى لإجمالي الوحدات (المطلوب ${rule.required} وحدة، الحالي ${rule.current}، ينقصك ${rule.missing})`;
        case 'minCartons':
          return `الحد الأدنى للكراتين (المطلوب ${rule.required} كرتون، الحالي ${rule.current}، ينقصك ${rule.missing})`;
        case 'minSkuCount':
          return `الحد الأدنى لعدد الأصناف المختلفة (المطلوب ${rule.required} أصناف، الحالي ${rule.current}، ينقصك ${rule.missing})`;
      }
    };

    // Validate per-supplier orderRules and credit limits BEFORE mutating any stock/orders/ledger
    for (const suppId of Object.keys(supplierGroups)) {
      const group = supplierGroups[suppId];
      const supplier = this.suppliers.find(s => s.id === suppId);
      const validation = validateSupplierOrderRules(group.ruleItems, supplier?.orderRules);

      if (!validation.isValid) {
        const firstFailure = validation.failedRules[0];
        const details = validation.failedRules.map(formatFailedRuleMessage).join('؛ ');
        throw new Error(
          `المورد (${group.supplierName}): لم تتحقق شروط الحد الأدنى للطلب — ${details}` +
          (validation.failedRules.length > 1 ? '' : ` [الفرق: ${firstFailure.missing.toLocaleString()}]`)
        );
      }

      if (params.paymentMethod === 'credit') {
        const creditAcc = this.getCreditAccount(store.id, suppId);
        if (!creditAcc) {
          throw new Error(`لا يوجد حساب ائتماني مسجل لمتجرك لدى المورد: ${group.supplierName}`);
        }
        if (creditAcc.isBlocked && !creditAcc.supplierExceptionAllowed) {
          throw new Error(`حسابك الائتماني مع ${group.supplierName} موقوف حالياً: ${creditAcc.blockReason}`);
        }
        if (creditAcc.availableCreditIQD < group.subtotalIQD && !creditAcc.supplierExceptionAllowed) {
          throw new Error(`الرصيد الائتماني المتاح مع ${group.supplierName} (${creditAcc.availableCreditIQD.toLocaleString()} د.ع) لا يكفي لتغطية قيمة الطلب (${group.subtotalIQD.toLocaleString()} د.ع)`);
        }
      }
    }

    // Phase 2: All checks passed — atomically deduct stock and create SubOrders + LedgerEntries
    for (const offerId of Object.keys(offerQuantities)) {
      const offer = this.offers.find(o => o.id === offerId)!;
      offer.availableStock -= offerQuantities[offerId];
    }

    const parentOrderId = `ORD-${Date.now()}`;
    const subOrders: SubOrder[] = [];
    let totalAmountIQD = 0;

    for (const suppId of Object.keys(supplierGroups)) {
      const group = supplierGroups[suppId];
      totalAmountIQD += group.subtotalIQD;

      // Generate 4-digit PIN for delivery proof
      const pin = Math.floor(1000 + Math.random() * 9000).toString();

      const supplier = this.suppliers.find(s => s.id === group.supplierId);
      const usesPlatformDelivery =
        supplier?.deliverySettings?.hasOwnFleet === false &&
        supplier?.deliverySettings?.allowPlatformDelivery === true;

      const nowOrderIso = new Date().toISOString();
      const subOrder: SubOrder = {
        id: `SUB-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        parentOrderId,
        supplierId: group.supplierId,
        supplierName: group.supplierName,
        storeId: store.id,
        storeName: store.name,
        storePhone: store.phone,
        storeCity: store.city,
        storeAddress: `${store.district} - ${store.address}`,
        items: group.items,
        subtotalIQD: group.subtotalIQD,
        paymentMethod: params.paymentMethod,
        status: 'pending',
        deliveryType: usesPlatformDelivery ? 'platform_driver' : 'supplier_fleet',
        deliveryZoneId: params.deliveryZoneId,
        deliveryPin: pin,
        createdAt: nowOrderIso,
        notes: params.notes,
        statusHistory: [
          {
            status: 'pending',
            at: nowOrderIso,
            actorType: 'store',
            actorName: store.name,
            note: 'إنشاء الطلبية من سلة المشتريات'
          }
        ]
      };

      this.subOrders.unshift(subOrder);
      subOrders.push(subOrder);

      // If credit, record ledger invoice entry
      if (params.paymentMethod === 'credit') {
        const creditAcc = this.getCreditAccount(store.id, suppId);
        if (creditAcc) {
          this.addLedgerEntry({
            creditAccountId: creditAcc.id,
            supplierId: suppId,
            storeId: store.id,
            referenceType: 'INVOICE',
            referenceId: subOrder.id,
            entryDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + creditAcc.paymentTermDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            debitIQD: group.subtotalIQD,
            creditIQD: 0,
            runningBalanceIQD: creditAcc.currentUsedCreditIQD + group.subtotalIQD,
            descriptionAr: `فاتورة طلبية جملة رقم ${subOrder.id} - ${group.items.length} أصناف`
          });
        }
      }
    }

    return {
      id: parentOrderId,
      storeId: store.id,
      storeName: store.name,
      totalAmountIQD,
      subOrders,
      paymentMethod: params.paymentMethod,
      createdAt: new Date().toISOString()
    };
  }

  // ================= VAN MOBILE WAREHOUSE & FLEET DSD OPERATIONS =================
  private syncVanItemToStoreInventory(storeId: string, vanItem: VanInventoryItem, quantity: number): boolean {
    const existing = this.storeInventory.find(s => s.storeId === storeId && s.barcode === vanItem.barcode);
    if (existing) {
      existing.stockQuantity += quantity;
      existing.isLowStock = existing.stockQuantity <= existing.reorderLevel;
      return true;
    }

    const catalogProduct = this.products.find(p => p.barcode === vanItem.barcode);
    const retailPrice = Math.round((vanItem.unitPriceIQD * 1.15) / 250) * 250;
    const futureExpiry = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    this.storeInventory.unshift({
      id: `sinv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      storeId,
      barcode: vanItem.barcode,
      productName: vanItem.productName,
      category: catalogProduct?.category || 'مواد غذائية أساسية',
      unit: vanItem.unit,
      stockQuantity: quantity,
      reorderLevel: 5,
      costPriceIQD: vanItem.unitPriceIQD,
      retailSellingPriceIQD: retailPrice,
      expiryDate: futureExpiry,
      isNearExpiry: false,
      isLowStock: quantity <= 5,
      monthlyAverageSales: Math.max(10, quantity * 2)
    });
    return true;
  }

  getDriverCommissionSummary(driverId: string) {
    const driver = this.drivers.find(d => d.id === driverId);
    if (!driver) return null;
    const dailyTargetIQD = driver.dailyTargetIQD || 2500000;
    const commissionRatePercent = driver.commissionRatePercent ?? 1.5;
    const todayCashSalesIQD = driver.todayCashSalesIQD || 0;
    const todayCreditSalesIQD = driver.todayCreditSalesIQD || 0;
    const todayDebtCollectedIQD = driver.todayDebtCollectedIQD || 0;
    const totalAchievedIQD = todayCashSalesIQD + todayCreditSalesIQD + todayDebtCollectedIQD;
    const targetProgressPercent = Math.min(100, Math.round((totalAchievedIQD / dailyTargetIQD) * 100));
    // Commission calculated on cash sales + debt collections (encourages cash flow)
    const commissionBaseIQD = todayCashSalesIQD + todayDebtCollectedIQD;
    const estimatedCommissionIQD = Math.round((commissionBaseIQD * commissionRatePercent) / 100);

    return {
      dailyTargetIQD,
      commissionRatePercent,
      todayCashSalesIQD,
      todayCreditSalesIQD,
      todayDebtCollectedIQD,
      totalAchievedIQD,
      targetProgressPercent,
      estimatedCommissionIQD
    };
  }

  recordVanDirectSale(params: {
    driverId: string;
    storeId: string;
    barcode?: string;
    quantity?: number;
    items?: { barcode: string; quantity: number }[];
    paymentType: 'cash' | 'credit';
    discountIQD?: number;
    notes?: string;
  }) {
    const driver = this.drivers.find(d => d.id === params.driverId);
    if (!driver) throw new Error('السائق غير موجود');
    const store = this.stores.find(s => s.id === params.storeId);
    if (!store) throw new Error('المتجر غير موجود');

    const lineRequests =
      Array.isArray(params.items) && params.items.length > 0
        ? params.items
        : params.barcode && params.quantity
        ? [{ barcode: params.barcode, quantity: Number(params.quantity) }]
        : [];

    if (lineRequests.length === 0) {
      throw new Error('يرجى تحديد صنف واحد على الأقل لإتمام البيع');
    }

    // Validate all lines before mutating stock, applying wholesale tier price automatically when eligible
    const resolvedLines: {
      vanItem: VanInventoryItem;
      qty: number;
      effectiveUnitPrice: number;
      tierApplied: boolean;
      lineTotal: number;
    }[] = [];
    let grossTotal = 0;

    for (const req of lineRequests) {
      const qty = Math.floor(Number(req.quantity));
      if (!qty || qty <= 0) throw new Error('كمية البيع يجب أن تكون رقماً موجباً');
      const vanItem = this.vanInventory.find(
        v => v.driverId === params.driverId && v.barcode === req.barcode
      );
      if (!vanItem || vanItem.remainingQuantity < qty) {
        throw new Error(`الكمية المطلوبة غير متوفرة في مخزون الفان للصنف (${vanItem?.productName || req.barcode})`);
      }
      const tierApplied = Boolean(
        vanItem.bulkDiscountMinQty &&
        vanItem.bulkUnitPriceIQD &&
        qty >= vanItem.bulkDiscountMinQty
      );
      const effectiveUnitPrice = tierApplied
        ? (vanItem.bulkUnitPriceIQD as number)
        : vanItem.unitPriceIQD;
      const lineTotal = effectiveUnitPrice * qty;
      grossTotal += lineTotal;
      resolvedLines.push({ vanItem, qty, effectiveUnitPrice, tierApplied, lineTotal });
    }

    const rawDiscount = Number(params.discountIQD) || 0;
    if (rawDiscount < 0 || rawDiscount > Math.round(grossTotal * 0.25)) {
      throw new Error('الخصم الممنوح يتجاوز الحد الأقصى المسموح به للمندوب (25% من الفاتورة)');
    }
    const cleanDiscount = Math.round(rawDiscount);
    const grandTotal = Math.max(0, grossTotal - cleanDiscount);

    // Check credit limit if paymentType === 'credit'
    if (params.paymentType === 'credit') {
      const creditAcc = this.getCreditAccount(store.id, driver.supplierId);
      if (creditAcc && creditAcc.isBlocked && !creditAcc.supplierExceptionAllowed) {
        throw new Error(`الحساب الائتماني لمتجر ${store.name} موقوف حالياً: ${creditAcc.blockReason}`);
      }
      if (creditAcc && creditAcc.availableCreditIQD < grandTotal && !creditAcc.supplierExceptionAllowed) {
        throw new Error(
          `الرصيد الائتماني المتاح لمتجر ${store.name} (${creditAcc.availableCreditIQD.toLocaleString()} د.ع) لا يكفي لتغطية الفاتورة (${grandTotal.toLocaleString()} د.ع)`
        );
      }
    }

    const receiptNumber = `VAN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const txItems: NonNullable<VanTransactionRecord['items']> = [];

    for (const { vanItem, qty, effectiveUnitPrice, tierApplied, lineTotal } of resolvedLines) {
      vanItem.soldQuantity += qty;
      vanItem.remainingQuantity -= qty;
      this.syncVanItemToStoreInventory(store.id, vanItem, qty);
      const matchedProd = this.products.find(p => p.barcode === vanItem.barcode);
      txItems.push({
        barcode: vanItem.barcode,
        productName: vanItem.productName,
        unit: vanItem.unit,
        quantity: qty,
        unitPriceIQD: effectiveUnitPrice,
        totalIQD: lineTotal,
        tierApplied,
        imageUrl: matchedProd?.imageUrl
      });
    }

    if (params.paymentType === 'cash') {
      driver.currentCashCollectedIQD += grandTotal;
      driver.todayCashSalesIQD = (driver.todayCashSalesIQD || 0) + grandTotal;
    } else {
      driver.todayCreditSalesIQD = (driver.todayCreditSalesIQD || 0) + grandTotal;
      const creditAcc = this.getCreditAccount(store.id, driver.supplierId);
      if (creditAcc) {
        this.addLedgerEntry({
          creditAccountId: creditAcc.id,
          supplierId: driver.supplierId,
          storeId: store.id,
          referenceType: 'INVOICE',
          referenceId: receiptNumber,
          entryDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + creditAcc.paymentTermDays * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          debitIQD: grandTotal,
          creditIQD: 0,
          runningBalanceIQD: creditAcc.currentUsedCreditIQD + grandTotal,
          descriptionAr: `فاتورة بيع مباشر من سيارة التوزيع (${driver.vanWarehouseName}) - ${txItems.length} أصناف`
        });
      }
    }

    // Auto-update matching route stop if exists
    const stop = this.vanRouteStops.find(
      s => s.driverId === driver.id && s.storeId === store.id
    );
    if (stop) {
      stop.status = 'sold';
      stop.lastSaleAmountIQD = (stop.lastSaleAmountIQD || 0) + grandTotal;
      stop.visitedAt = new Date().toISOString();
    }

    const transaction: VanTransactionRecord = {
      id: `vtx_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      receiptNumber,
      driverId: driver.id,
      driverName: driver.name,
      supplierId: driver.supplierId,
      storeId: store.id,
      storeName: store.name,
      type: 'direct_sale',
      paymentType: params.paymentType,
      items: txItems,
      grossAmountIQD: grossTotal,
      discountIQD: cleanDiscount,
      totalAmountIQD: grandTotal,
      createdAt: new Date().toISOString(),
      notes: params.notes || 'بيع مباشر من الفان + مزامنة تلقائية لمخزون كاشير المتجر'
    };

    this.vanTransactions.unshift(transaction);

    return {
      success: true,
      receiptNumber,
      transaction,
      saleAmountIQD: grandTotal,
      syncedToStorePOS: true,
      remainingVanStock: resolvedLines[0]?.vanItem.remainingQuantity ?? 0,
      driverCashBalance: driver.currentCashCollectedIQD
    };
  }

  recordVanDebtCollection(params: {
    driverId: string;
    storeId: string;
    amountIQD: number;
    notes?: string;
  }) {
    const driver = this.drivers.find(d => d.id === params.driverId);
    if (!driver) throw new Error('السائق غير موجود');
    const store = this.stores.find(s => s.id === params.storeId);
    if (!store) throw new Error('المتجر غير موجود');

    const amount = Math.floor(Number(params.amountIQD));
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('يرجى إدخال مبلغ تحصيل صحيح أكبر من صفر');
    }

    const creditAcc = this.getCreditAccount(store.id, driver.supplierId);
    if (!creditAcc) {
      throw new Error(`لا يوجد حساب آجل مفتوح لمتجر ${store.name} مع هذا المورد`);
    }
    if (creditAcc.currentUsedCreditIQD <= 0) {
      throw new Error(`لا توجد ذمم آجلة مستحقة على ${store.name} حالياً`);
    }
    if (amount > creditAcc.currentUsedCreditIQD) {
      throw new Error(
        `مبلغ التحصيل يتجاوز إجمالي الدين المستحق (${creditAcc.currentUsedCreditIQD.toLocaleString()} د.ع)`
      );
    }

    const receiptNumber = `COL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const ledgerEntry = this.addLedgerEntry({
      creditAccountId: creditAcc.id,
      supplierId: driver.supplierId,
      storeId: store.id,
      referenceType: 'PAYMENT',
      referenceId: receiptNumber,
      entryDate: new Date().toISOString().split('T')[0],
      debitIQD: 0,
      creditIQD: amount,
      runningBalanceIQD: Math.max(0, creditAcc.currentUsedCreditIQD - amount),
      descriptionAr:
        params.notes?.trim() ||
        `تحصيل نقدي ميداني بواسطة المندوب (${driver.name}) — وصل رقم ${receiptNumber}`
    });

    driver.currentCashCollectedIQD += amount;
    driver.todayDebtCollectedIQD = (driver.todayDebtCollectedIQD || 0) + amount;

    const stop = this.vanRouteStops.find(
      s => s.driverId === driver.id && s.storeId === store.id
    );
    if (stop && stop.status === 'pending') {
      stop.status = 'visited';
      stop.visitedAt = new Date().toISOString();
    }

    const transaction: VanTransactionRecord = {
      id: `vtx_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      receiptNumber,
      driverId: driver.id,
      driverName: driver.name,
      supplierId: driver.supplierId,
      storeId: store.id,
      storeName: store.name,
      type: 'debt_collection',
      paymentType: 'cash',
      totalAmountIQD: amount,
      createdAt: new Date().toISOString(),
      notes: params.notes?.trim() || 'تحصيل دفعة نقدية من حساب الآجل (FIFO)'
    };

    this.vanTransactions.unshift(transaction);

    return {
      success: true,
      receiptNumber,
      transaction,
      ledgerEntry,
      updatedCreditAccount: creditAcc,
      driverCashBalance: driver.currentCashCollectedIQD
    };
  }

  loadVanStock(params: {
    driverId: string;
    barcode: string;
    quantity: number;
    unitPriceIQD?: number;
  }): VanInventoryItem {
    const driver = this.assertDriverOperable(params.driverId);
    const qty = Math.floor(Number(params.quantity));
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error('كمية التحميل يجب أن تكون أكبر من صفر');
    }

    const existing = this.vanInventory.find(
      v => v.driverId === params.driverId && v.barcode === params.barcode
    );
    if (existing) {
      existing.loadedQuantity += qty;
      existing.remainingQuantity += qty;
      if (params.unitPriceIQD && Number(params.unitPriceIQD) > 0) {
        existing.unitPriceIQD = Number(params.unitPriceIQD);
      }
      return existing;
    }

    const product = this.products.find(p => p.barcode === params.barcode);
    if (!product) throw new Error('المنتج غير موجود في الكتالوج');

    const supplierOffer =
      this.offers.find(o => o.barcode === params.barcode && o.supplierId === driver.supplierId) ||
      this.offers.find(o => o.barcode === params.barcode);

    const newItem: VanInventoryItem = {
      id: `van_inv_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      driverId: driver.id,
      barcode: product.barcode,
      productName: product.nameAr,
      unit: product.unit,
      loadedQuantity: qty,
      soldQuantity: 0,
      returnedQuantity: 0,
      damagedQuantity: 0,
      remainingQuantity: qty,
      unitPriceIQD:
        params.unitPriceIQD && Number(params.unitPriceIQD) > 0
          ? Number(params.unitPriceIQD)
          : supplierOffer?.priceIQD || 25000
    };

    this.vanInventory.push(newItem);
    return newItem;
  }

  adjustVanStock(params: {
    driverId: string;
    barcode: string;
    delta: number;
  }): VanInventoryItem {
    this.assertDriverOperable(params.driverId);
    const delta = Math.trunc(Number(params.delta));
    if (!Number.isFinite(delta) || delta === 0) {
      throw new Error('مقدار التعديل غير صالح');
    }

    const existing = this.vanInventory.find(
      v => v.driverId === params.driverId && v.barcode === params.barcode
    );
    if (!existing) {
      if (delta > 0) {
        return this.loadVanStock({
          driverId: params.driverId,
          barcode: params.barcode,
          quantity: delta
        });
      }
      throw new Error('الصنف غير محمّل في الفان');
    }

    const nextRemaining = existing.remainingQuantity + delta;
    const nextLoaded = existing.loadedQuantity + delta;
    const minCommitted = existing.soldQuantity + existing.returnedQuantity + existing.damagedQuantity;
    if (nextRemaining < 0 || nextLoaded < minCommitted) {
      throw new Error('لا يمكن إنقاص الكمية عن الحد المتبقي أو الكمية المباعة');
    }

    existing.loadedQuantity = nextLoaded;
    existing.remainingQuantity = nextRemaining;
    return existing;
  }

  createVanLoadRequest(params: {
    driverId: string;
    items: { barcode: string; quantity: number }[];
    notes?: string;
  }): VanLoadRequest {
    const driver = this.assertDriverOperable(params.driverId);
    if (!Array.isArray(params.items) || params.items.length === 0) {
      throw new Error('يرجى اختيار صنف واحد على الأقل لطلب تجهيز الفان');
    }

    const requestItems: VanLoadRequestItem[] = [];
    let totalEstimatedIQD = 0;

    for (const raw of params.items) {
      const qty = Math.floor(Number(raw.quantity));
      if (!raw.barcode || !Number.isFinite(qty) || qty <= 0) continue;
      const product = this.products.find(p => p.barcode === raw.barcode);
      if (!product) continue;
      const supplierOffer =
        this.offers.find(o => o.barcode === raw.barcode && o.supplierId === driver.supplierId) ||
        this.offers.find(o => o.barcode === raw.barcode);
      const unitPriceIQD = supplierOffer?.priceIQD || 25000;
      totalEstimatedIQD += unitPriceIQD * qty;
      requestItems.push({
        barcode: product.barcode,
        productName: product.nameAr,
        unit: product.unit,
        requestedQuantity: qty,
        approvedQuantity: qty,
        unitPriceIQD
      });
    }

    if (requestItems.length === 0) {
      throw new Error('لا توجد أصناف صالحة في طلب التجهيز');
    }

    const req: VanLoadRequest = {
      id: `vlr_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      requestNumber: `LOAD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      driverId: driver.id,
      driverName: driver.name,
      vanWarehouseName: driver.vanWarehouseName,
      supplierId: driver.supplierId,
      supplierName: driver.supplierName,
      items: requestItems,
      totalEstimatedIQD,
      status: 'pending_approval',
      notes: params.notes?.trim() || 'طلب تجهيز بضاعة من متجر المورد للفان',
      createdAt: new Date().toISOString()
    };

    this.vanLoadRequests.unshift(req);
    return req;
  }

  approveVanLoadRequest(params: {
    requestId: string;
    adjustedQuantities?: Record<string, number>;
    reviewedBy?: string;
  }): VanLoadRequest {
    const req = this.vanLoadRequests.find(r => r.id === params.requestId);
    if (!req) throw new Error('طلب التجهيز غير موجود');
    if (req.status !== 'pending_approval') {
      throw new Error('تمت معالجة طلب التجهيز هذا مسبقاً');
    }

    let finalTotal = 0;
    for (const item of req.items) {
      const override = params.adjustedQuantities?.[item.barcode];
      const finalQty =
        override !== undefined && Number.isFinite(Number(override))
          ? Math.max(0, Math.floor(Number(override)))
          : item.requestedQuantity;
      item.approvedQuantity = finalQty;
      finalTotal += finalQty * item.unitPriceIQD;

      if (finalQty > 0) {
        this.loadVanStock({
          driverId: req.driverId,
          barcode: item.barcode,
          quantity: finalQty,
          unitPriceIQD: item.unitPriceIQD
        });

        // Deduct from supplier offer available stock if present
        const offer = this.offers.find(
          o => o.barcode === item.barcode && o.supplierId === req.supplierId
        );
        if (offer) {
          offer.availableStock = Math.max(0, offer.availableStock - finalQty);
        }
      }
    }

    req.totalEstimatedIQD = finalTotal;
    req.status = 'approved';
    req.reviewedBy = params.reviewedBy || 'محاسب / إدارة المورد';
    req.reviewedAt = new Date().toISOString();
    return req;
  }

  rejectVanLoadRequest(requestId: string, notes?: string): VanLoadRequest {
    const req = this.vanLoadRequests.find(r => r.id === requestId);
    if (!req) throw new Error('طلب التجهيز غير موجود');
    if (req.status !== 'pending_approval') {
      throw new Error('تمت معالجة طلب التجهيز هذا مسبقاً');
    }
    req.status = 'rejected';
    req.reviewedBy = 'محاسب / إدارة المورد';
    req.reviewedAt = new Date().toISOString();
    if (notes) req.notes = notes;
    return req;
  }

  createDriverVan(params: {
    supplierId: string;
    name: string;
    phone: string;
    vehiclePlate: string;
    vehicleModel: string;
    vanWarehouseName: string;
    dailyTargetIQD?: number;
    commissionRatePercent?: number;
  }): DriverProfile {
    const supplier = this.suppliers.find(s => s.id === params.supplierId);
    if (!supplier) throw new Error('المورد غير موجود');
    if (!params.name?.trim() || !params.vehiclePlate?.trim()) {
      throw new Error('يرجى إدخال اسم السائق ورقم لوحة المركبة');
    }

    const newDriver: DriverProfile = {
      id: `drv_${Date.now()}`,
      supplierId: supplier.id,
      supplierName: supplier.companyName,
      name: params.name.trim(),
      phone: params.phone?.trim() || '+964 770 000 0000',
      vehiclePlate: params.vehiclePlate.trim(),
      vehicleModel: params.vehicleModel?.trim() || 'تويوتا هايس 2024',
      vanWarehouseName: params.vanWarehouseName?.trim() || `فان ${this.drivers.length + 1} - بغداد`,
      currentCashCollectedIQD: 0,
      isActiveShift: true,
      shiftStartTime: new Date().toISOString(),
      dailyTargetIQD: Number(params.dailyTargetIQD) || 2000000,
      commissionRatePercent: Number(params.commissionRatePercent) || 1.5,
      todayCashSalesIQD: 0,
      todayCreditSalesIQD: 0,
      todayDebtCollectedIQD: 0
    };

    this.drivers.push(newDriver);
    supplier.totalVans = this.drivers.filter(d => d.supplierId === supplier.id).length;
    return newDriver;
  }

  addVanRouteStop(driverId: string, storeId: string, notes?: string): VanRouteStop {
    const driver = this.drivers.find(d => d.id === driverId);
    if (!driver) throw new Error('السائق غير موجود');
    const store = this.stores.find(s => s.id === storeId);
    if (!store) throw new Error('المتجر غير موجود');

    const existing = this.vanRouteStops.find(
      s => s.driverId === driverId && s.storeId === storeId
    );
    if (existing) {
      existing.status = 'pending';
      if (notes) existing.notes = notes;
      return existing;
    }

    const driverStops = this.vanRouteStops.filter(s => s.driverId === driverId);
    const stop: VanRouteStop = {
      id: `stop_${Date.now()}`,
      driverId,
      storeId: store.id,
      storeName: store.name,
      district: store.district,
      address: store.address,
      phone: store.phone,
      sequence: driverStops.length + 1,
      status: 'pending',
      notes: notes?.trim() || 'زيارة توزيع ميداني مجدولة'
    };

    this.vanRouteStops.push(stop);
    return stop;
  }

  updateVanRouteStopStatus(
    stopId: string,
    status: VanRouteStop['status'],
    notes?: string
  ): VanRouteStop {
    const stop = this.vanRouteStops.find(s => s.id === stopId);
    if (!stop) throw new Error('نقطة التوزيع غير موجودة');
    stop.status = status;
    if (status === 'visited' || status === 'sold') {
      stop.visitedAt = new Date().toISOString();
    }
    if (notes !== undefined) stop.notes = notes;
    return stop;
  }

  updateDriverAvailability(
    driverId: string,
    availabilityStatus: 'available' | 'busy',
    busyReason?: string
  ): DriverProfile {
    const driver = this.drivers.find(d => d.id === driverId);
    if (!driver) throw new Error('السائق غير موجود');
    driver.availabilityStatus = availabilityStatus;
    driver.busyReason = availabilityStatus === 'busy' ? (busyReason?.trim() || 'مشغول بالتوزيع') : undefined;
    return driver;
  }

  reorderVanRouteStops(driverId: string, orderedStopIds: string[]): VanRouteStop[] {
    const driverStops = this.vanRouteStops.filter(s => s.driverId === driverId);
    orderedStopIds.forEach((id, idx) => {
      const target = driverStops.find(s => s.id === id);
      if (target) {
        target.sequence = idx + 1;
      }
    });
    // Ensure any remaining stops not listed still have valid sequences
    let nextSeq = orderedStopIds.length + 1;
    driverStops.forEach(s => {
      if (!orderedStopIds.includes(s.id)) {
        s.sequence = nextSeq++;
      }
    });
    return this.vanRouteStops
      .filter(s => s.driverId === driverId)
      .sort((a, b) => a.sequence - b.sequence);
  }

  removeVanRouteStop(stopId: string): boolean {
    const idx = this.vanRouteStops.findIndex(s => s.id === stopId);
    if (idx === -1) throw new Error('نقطة التوزيع غير موجودة');
    const [removed] = this.vanRouteStops.splice(idx, 1);
    const remaining = this.vanRouteStops
      .filter(s => s.driverId === removed.driverId)
      .sort((a, b) => a.sequence - b.sequence);
    remaining.forEach((s, i) => {
      s.sequence = i + 1;
    });
    return true;
  }

  settleShiftReport(reportId: string): ShiftCloseReport {
    const report = this.shiftReports.find(r => r.id === reportId);
    if (!report) throw new Error('تقرير الوردية غير موجود');
    report.status = 'settled';
    report.settledAt = new Date().toISOString();

    const driver = this.drivers.find(d => d.id === report.driverId);
    if (driver) {
      driver.isActiveShift = true;
      driver.shiftStartTime = new Date().toISOString();
    }
    return report;
  }

  recordVanReturnOrDamage(params: {
    driverId: string;
    barcode: string;
    quantity: number;
    type: 'return' | 'damage' | 'exchange';
    reason: string;
    storeId?: string;
    batchNumber?: string;
    expiryDate?: string;
  }) {
    const driver = this.drivers.find(d => d.id === params.driverId);
    if (!driver) throw new Error('السائق غير موجود');
    const vanItem = this.vanInventory.find(v => v.driverId === params.driverId && v.barcode === params.barcode);
    if (!vanItem) throw new Error('الصنف غير موجود في حمولة الفان');

    const qty = Math.floor(Number(params.quantity));
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error('كمية المرتجع أو التالف يجب أن تكون أكبر من صفر');
    }

    if ((params.type === 'damage' || params.type === 'exchange') && vanItem.remainingQuantity < qty) {
      throw new Error('الكمية المتبقية في الفان لا تكفي لتسجيل التالف أو الاستبدال');
    }

    if (params.type === 'return') {
      vanItem.returnedQuantity += qty;
      vanItem.remainingQuantity += qty;
    } else if (params.type === 'exchange') {
      // 1-for-1 customer replacement: deduct clean replacement unit & track damaged unit returned
      vanItem.damagedQuantity += qty;
      vanItem.remainingQuantity = Math.max(0, vanItem.remainingQuantity - qty);
    } else {
      vanItem.damagedQuantity += qty;
      vanItem.remainingQuantity = Math.max(0, vanItem.remainingQuantity - qty);
    }

    const store = params.storeId ? this.stores.find(s => s.id === params.storeId) : undefined;
    const creditNoteAmountIQD = params.type === 'exchange' ? 0 : vanItem.unitPriceIQD * qty;
    const rmaNumber = `RMA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    if (store && creditNoteAmountIQD > 0) {
      const creditAcc = this.getCreditAccount(store.id, driver.supplierId);
      if (creditAcc && creditAcc.currentUsedCreditIQD > 0) {
        const creditApplied = Math.min(creditAcc.currentUsedCreditIQD, creditNoteAmountIQD);
        this.addLedgerEntry({
          creditAccountId: creditAcc.id,
          supplierId: driver.supplierId,
          storeId: store.id,
          referenceType: 'RETURN_CREDIT',
          referenceId: rmaNumber,
          entryDate: new Date().toISOString().split('T')[0],
          debitIQD: 0,
          creditIQD: creditApplied,
          runningBalanceIQD: Math.max(0, creditAcc.currentUsedCreditIQD - creditApplied),
          descriptionAr: `إشعار دائن مرتجع (${vanItem.productName} × ${qty}) — ${rmaNumber}`
        });
      }
    }

    const returnRecord: VanReturnRecord = {
      id: `vret_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      rmaNumber,
      driverId: driver.id,
      supplierId: driver.supplierId,
      storeId: store?.id,
      storeName: store?.name,
      barcode: vanItem.barcode,
      productName: vanItem.productName,
      unit: vanItem.unit,
      quantity: qty,
      unitPriceIQD: vanItem.unitPriceIQD,
      creditNoteAmountIQD,
      type: params.type,
      batchNumber: params.batchNumber?.trim() || vanItem.batchNumber,
      expiryDate: params.expiryDate?.trim() || vanItem.expiryDate,
      reason: params.reason.trim(),
      createdAt: new Date().toISOString()
    };
    this.vanReturns.unshift(returnRecord);

    return { vanItem, returnRecord };
  }

  registerFieldStoreCustomer(params: {
    driverId: string;
    name: string;
    ownerName: string;
    phone: string;
    district: string;
    address: string;
    storeType?: 'supermarket' | 'grocery' | 'wholesale_sub';
    creditLimitIQD?: number;
    addToRoute?: boolean;
  }) {
    const driver = this.drivers.find(d => d.id === params.driverId);
    if (!driver) throw new Error('السائق غير موجود');
    if (!params.name?.trim() || !params.ownerName?.trim() || !params.phone?.trim()) {
      throw new Error('يرجى إدخال اسم المحل، اسم المالك، ورقم الهاتف');
    }

    const requestedLimit = Math.max(0, Math.min(20000000, Math.round(Number(params.creditLimitIQD) || 0)));
    const newStoreId = `store_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    const slug = `shop-${Date.now().toString(36)}`;

    const newStore: StoreProfile = {
      id: newStoreId,
      name: params.name.trim(),
      ownerName: params.ownerName.trim(),
      phone: params.phone.trim(),
      city: 'بغداد',
      district: params.district?.trim() || 'المنصور',
      address: params.address?.trim() || 'شارع تجاري رئيسي',
      storeType: params.storeType || 'grocery',
      walletBalanceIQD: 0,
      isVerified: true,
      customDomainSlug: slug,
      qrScanCount: 0,
      createdAt: new Date().toISOString()
    };
    this.stores.push(newStore);

    const creditAccount: CreditAccount = {
      id: `cred_${newStoreId}_${driver.supplierId}`,
      supplierId: driver.supplierId,
      storeId: newStore.id,
      storeName: newStore.name,
      creditLimitIQD: requestedLimit,
      currentUsedCreditIQD: 0,
      availableCreditIQD: requestedLimit,
      isBlocked: false,
      supplierExceptionAllowed: false,
      paymentTermDays: 14,
      aging: {
        bucket0_30: 0,
        bucket31_60: 0,
        bucket61_90: 0,
        bucket90Plus: 0
      }
    };
    this.creditAccounts.push(creditAccount);

    let routeStop: VanRouteStop | null = null;
    if (params.addToRoute !== false) {
      routeStop = this.addVanRouteStop(
        driver.id,
        newStore.id,
        'زبون جديد مسجل ميدانياً عبر مندوب الفان'
      );
    }

    return { store: newStore, creditAccount, routeStop };
  }

  recordVanExpense(params: {
    driverId: string;
    category: VanExpenseCategory;
    description: string;
    amountIQD: number;
    receiptRef?: string;
  }): VanExpenseRecord {
    const driver = this.drivers.find(d => d.id === params.driverId);
    if (!driver) throw new Error('السائق غير موجود');
    const amount = Math.floor(Number(params.amountIQD));
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('مبلغ المصروف يجب أن يكون أكبر من صفر');
    }
    if (!params.description?.trim()) {
      throw new Error('يرجى كتابة بيان أو وصف المصروف');
    }
    if (amount > driver.currentCashCollectedIQD) {
      throw new Error('مبلغ المصروف يتجاوز الرصيد النقدي المتوفر في عهدة الفان حالياً');
    }

    const record: VanExpenseRecord = {
      id: `vexp_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      driverId: driver.id,
      supplierId: driver.supplierId,
      category: params.category,
      description: params.description.trim(),
      amountIQD: amount,
      receiptRef: params.receiptRef?.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    this.vanExpenses.unshift(record);
    driver.todayExpensesIQD = (driver.todayExpensesIQD || 0) + amount;
    driver.currentCashCollectedIQD = Math.max(0, driver.currentCashCollectedIQD - amount);
    return record;
  }

  deleteVanExpense(expenseId: string): boolean {
    const idx = this.vanExpenses.findIndex(e => e.id === expenseId);
    if (idx === -1) throw new Error('سجل المصروف غير موجود');
    const [removed] = this.vanExpenses.splice(idx, 1);
    const driver = this.drivers.find(d => d.id === removed.driverId);
    if (driver) {
      driver.todayExpensesIQD = Math.max(0, (driver.todayExpensesIQD || 0) - removed.amountIQD);
      driver.currentCashCollectedIQD += removed.amountIQD;
    }
    return true;
  }

  updateVanVehicleCheck(params: {
    driverId: string;
    odometerStartKm?: number;
    odometerEndKm?: number;
    fuelLevelPercent?: number;
    chillerTempC?: number;
    inspectionChecklist?: {
      tiresOk: boolean;
      chillerOk: boolean;
      lightsOk: boolean;
      hygieneOk: boolean;
    };
  }): DriverProfile {
    const driver = this.drivers.find(d => d.id === params.driverId);
    if (!driver) throw new Error('السائق غير موجود');

    if (params.odometerStartKm !== undefined && Number.isFinite(Number(params.odometerStartKm))) {
      driver.odometerStartKm = Math.max(0, Math.round(Number(params.odometerStartKm)));
    }
    if (params.odometerEndKm !== undefined && Number.isFinite(Number(params.odometerEndKm))) {
      driver.odometerEndKm = Math.max(driver.odometerStartKm || 0, Math.round(Number(params.odometerEndKm)));
    }
    if (params.fuelLevelPercent !== undefined && Number.isFinite(Number(params.fuelLevelPercent))) {
      driver.fuelLevelPercent = Math.max(0, Math.min(100, Math.round(Number(params.fuelLevelPercent))));
    }
    if (params.chillerTempC !== undefined && Number.isFinite(Number(params.chillerTempC))) {
      driver.chillerTempC = Math.round(Number(params.chillerTempC) * 10) / 10;
    }
    if (params.inspectionChecklist) {
      driver.inspectionChecklist = {
        tiresOk: Boolean(params.inspectionChecklist.tiresOk),
        chillerOk: Boolean(params.inspectionChecklist.chillerOk),
        lightsOk: Boolean(params.inspectionChecklist.lightsOk),
        hygieneOk: Boolean(params.inspectionChecklist.hygieneOk),
        checkedAt: new Date().toISOString()
      };
    }

    return driver;
  }

  recordVanPhysicalAudit(params: {
    driverId: string;
    counts: { barcode: string; countedQuantity: number }[];
  }) {
    const driver = this.drivers.find(d => d.id === params.driverId);
    if (!driver) throw new Error('السائق غير موجود');
    if (!Array.isArray(params.counts) || params.counts.length === 0) {
      throw new Error('يرجى إدخال كميات الجرد الفعلي للأصناف');
    }

    const now = new Date().toISOString();
    const lines: {
      barcode: string;
      productName: string;
      systemRemaining: number;
      physicalCounted: number;
      varianceUnits: number;
      varianceValueIQD: number;
    }[] = [];

    for (const c of params.counts) {
      const vanItem = this.vanInventory.find(v => v.driverId === params.driverId && v.barcode === c.barcode);
      if (!vanItem) continue;
      const counted = Math.max(0, Math.floor(Number(c.countedQuantity)));
      vanItem.lastPhysicalCountQty = counted;
      vanItem.lastAuditAt = now;
      const varianceUnits = counted - vanItem.remainingQuantity;
      lines.push({
        barcode: vanItem.barcode,
        productName: vanItem.productName,
        systemRemaining: vanItem.remainingQuantity,
        physicalCounted: counted,
        varianceUnits,
        varianceValueIQD: varianceUnits * vanItem.unitPriceIQD
      });
    }

    return {
      auditedAt: now,
      totalMatched: lines.filter(l => l.varianceUnits === 0).length,
      totalDiscrepancies: lines.filter(l => l.varianceUnits !== 0).length,
      netVarianceValueIQD: lines.reduce((s, l) => s + l.varianceValueIQD, 0),
      lines
    };
  }

  unloadVanToWarehouse(params: {
    driverId: string;
    notes?: string;
  }): VanUnloadRecord {
    const driver = this.drivers.find(d => d.id === params.driverId);
    if (!driver) throw new Error('السائق غير موجود');

    const driverItems = this.vanInventory.filter(v => v.driverId === params.driverId);
    let totalUnitsReturned = 0;
    let totalValueIQD = 0;
    let damagedUnits = 0;
    let affectedItems = 0;

    for (const item of driverItems) {
      if (item.remainingQuantity > 0 || item.damagedQuantity > 0) {
        affectedItems += 1;
        totalUnitsReturned += item.remainingQuantity;
        totalValueIQD += item.remainingQuantity * item.unitPriceIQD;
        damagedUnits += item.damagedQuantity;

        if (item.remainingQuantity > 0) {
          const offer = this.offers.find(
            o => o.barcode === item.barcode && o.supplierId === driver.supplierId
          );
          if (offer) {
            offer.availableStock += item.remainingQuantity;
          }
          item.remainingQuantity = 0;
        }
        item.damagedQuantity = 0;
      }
    }

    if (totalUnitsReturned === 0 && damagedUnits === 0) {
      throw new Error('لا توجد بضاعة متبقية أو تالفة في الفان للترحيل إلى المستودع');
    }

    const record: VanUnloadRecord = {
      id: `unld_${Date.now()}`,
      manifestNumber: `UNLOAD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      driverId: driver.id,
      supplierId: driver.supplierId,
      itemsCount: affectedItems,
      totalUnitsReturned,
      totalValueIQD,
      damagedUnits,
      notes: params.notes?.trim() || 'ترحيل الجرد المتبقي والتالف إلى مستودع المورد الرئيسي',
      createdAt: new Date().toISOString()
    };
    this.vanUnloadRecords.unshift(record);
    return record;
  }

  closeDriverShift(params: {
    driverId: string;
    actualCashCountedIQD: number;
    odometerEndKm?: number;
    notes?: string;
  }): ShiftCloseReport {
    const driver = this.drivers.find(d => d.id === params.driverId);
    if (!driver) throw new Error('السائق غير موجود');

    if (params.odometerEndKm !== undefined && Number.isFinite(Number(params.odometerEndKm))) {
      driver.odometerEndKm = Math.max(driver.odometerStartKm || 0, Math.round(Number(params.odometerEndKm)));
    }

    const expectedCash = driver.currentCashCollectedIQD;
    const cashVariance = params.actualCashCountedIQD - expectedCash;
    const driverStops = this.vanRouteStops.filter(s => s.driverId === driver.id);
    const soldStops = driverStops.filter(s => s.status === 'sold').length;
    const strikeRatePercent = driverStops.length > 0 ? Math.round((soldStops / driverStops.length) * 100) : 0;

    const report: ShiftCloseReport = {
      id: `SHIFT-${Date.now()}`,
      driverId: driver.id,
      driverName: driver.name,
      supplierId: driver.supplierId,
      date: new Date().toISOString(),
      expectedCashIQD: expectedCash,
      actualCashIQD: params.actualCashCountedIQD,
      cashVarianceIQD: cashVariance,
      totalOrdersDelivered: this.subOrders.filter(o => o.assignedDriverId === driver.id && o.status === 'delivered').length,
      totalDirectVanSales: this.vanInventory.filter(v => v.driverId === driver.id).reduce((s, i) => s + i.soldQuantity, 0),
      returnsCount: this.vanInventory.filter(v => v.driverId === driver.id).reduce((s, i) => s + i.returnedQuantity + i.damagedQuantity, 0),
      totalExpensesIQD: driver.todayExpensesIQD || 0,
      totalCreditSalesIQD: driver.todayCreditSalesIQD || 0,
      totalDebtCollectedIQD: driver.todayDebtCollectedIQD || 0,
      odometerStartKm: driver.odometerStartKm,
      odometerEndKm: driver.odometerEndKm,
      strikeRatePercent,
      notes: params.notes,
      status: 'pending_supplier_approval'
    };

    this.shiftReports.unshift(report);
    // Reset driver cash & daily counters for new shift
    driver.currentCashCollectedIQD = 0;
    driver.todayExpensesIQD = 0;
    driver.isActiveShift = false;

    return report;
  }

  // ================= STORE POS & INVENTORY DEDUCTION =================
  recordStorePOSSale(params: {
    storeId: string;
    items: { barcode: string; quantity: number; unitPriceIQD?: number; note?: string }[];
    totalIQD: number;
    subtotalIQD?: number;
    discountIQD?: number;
    orderMode?: 'in_store' | 'take_away' | 'online_order';
    customerName?: string;
    paymentType?: 'cash' | 'card' | 'credit_ledger' | string;
  }) {
    const store = this.stores.find(s => s.id === params.storeId);
    if (!store) throw new Error('المتجر غير موجود');

    const deductedItems: any[] = [];
    const triggeredLowStockAlerts: any[] = [];
    const receiptItems: StorePOSSaleRecord['items'] = [];
    let calculatedCostIQD = 0;

    for (const saleItem of params.items) {
      const inv = this.storeInventory.find(i => i.storeId === params.storeId && i.barcode === saleItem.barcode);
      const unitPrice = saleItem.unitPriceIQD ?? inv?.retailSellingPriceIQD ?? 0;

      if (inv) {
        inv.stockQuantity = Math.max(0, inv.stockQuantity - saleItem.quantity);
        inv.isLowStock = inv.stockQuantity <= inv.reorderLevel;
        calculatedCostIQD += inv.costPriceIQD * saleItem.quantity;

        receiptItems.push({
          barcode: inv.barcode,
          productName: inv.productName,
          quantity: saleItem.quantity,
          unitPriceIQD: unitPrice,
          note: saleItem.note
        });

        deductedItems.push({
          barcode: inv.barcode,
          productName: inv.productName,
          quantity: saleItem.quantity,
          remainingStock: inv.stockQuantity,
          isLowStock: inv.isLowStock
        });
        if (inv.isLowStock) {
          triggeredLowStockAlerts.push(inv);
        }
      }
    }

    const nextReceiptNumber =
      this.storePOSSales.reduce((max, s) => Math.max(max, s.receiptNumber), 27361) + 1;
    const subtotalIQD = params.subtotalIQD ?? params.totalIQD;
    const discountIQD = params.discountIQD ?? 0;
    const paymentType: StorePOSSaleRecord['paymentType'] =
      params.paymentType === 'card' || params.paymentType === 'credit_ledger'
        ? params.paymentType
        : 'cash';

    const saleRecord: StorePOSSaleRecord = {
      id: `sale_${nextReceiptNumber}`,
      receiptNumber: nextReceiptNumber,
      storeId: params.storeId,
      orderMode: params.orderMode || 'in_store',
      customerName: params.customerName?.trim() || 'زبون نقدي',
      paymentType,
      items: receiptItems,
      subtotalIQD,
      discountIQD,
      totalIQD: params.totalIQD,
      profitIQD: Math.max(0, params.totalIQD - calculatedCostIQD),
      createdAt: new Date().toISOString()
    };

    this.storePOSSales.unshift(saleRecord);

    return {
      saleId: saleRecord.id,
      receiptNumber: saleRecord.receiptNumber,
      sale: saleRecord,
      storeId: params.storeId,
      itemsDeducted: deductedItems,
      totalIQD: params.totalIQD,
      paymentType,
      timestamp: saleRecord.createdAt,
      triggeredLowStockAlerts
    };
  }

  getStorePOSReturns(storeId: string) {
    return this.storePOSReturns.filter(r => r.storeId === storeId);
  }

  recordStorePOSReturn(params: {
    storeId: string;
    originalReceiptNumber?: number;
    customerName?: string;
    refundMethod?: 'cash' | 'card' | 'credit_ledger';
    reason?: string;
    processedBy?: string;
    items: {
      barcode: string;
      productName?: string;
      quantity: number;
      unitPriceIQD?: number;
      restockToShelf?: boolean;
    }[];
  }) {
    if (!params.storeId) {
      throw new Error('معرف المتجر مطلوب لتسجيل المرتجع');
    }
    if (!Array.isArray(params.items) || params.items.length === 0) {
      throw new Error('يرجى تحديد صنف واحد على الأقل للإرجاع');
    }

    let originalSale: StorePOSSaleRecord | undefined;
    let discountMultiplier = 1;
    const returnedAlreadyMap = new Map<string, number>();

    if (params.originalReceiptNumber !== undefined && params.originalReceiptNumber !== null && String(params.originalReceiptNumber).trim() !== '') {
      const receiptNo = Number(params.originalReceiptNumber);
      originalSale = this.storePOSSales.find(
        s => s.storeId === params.storeId && s.receiptNumber === receiptNo
      );
      if (!originalSale) {
        throw new Error(`الفاتورة رقم #${receiptNo} غير موجودة`);
      }

      if (originalSale.subtotalIQD > 0) {
        discountMultiplier = Math.max(0, Math.min(1, originalSale.totalIQD / originalSale.subtotalIQD));
      }

      // Sum previously returned quantities for this receipt
      for (const prevRet of this.storePOSReturns) {
        if (prevRet.storeId === params.storeId && prevRet.originalReceiptNumber === receiptNo) {
          for (const prevItem of prevRet.items) {
            returnedAlreadyMap.set(
              prevItem.barcode,
              (returnedAlreadyMap.get(prevItem.barcode) || 0) + prevItem.quantity
            );
          }
        }
      }
    }

    const processedItems: StorePOSReturnItem[] = [];
    const restockedItems: {
      barcode: string;
      productName: string;
      addedQty: number;
      newStockQuantity: number;
    }[] = [];
    let totalRefundIQD = 0;
    let profitAdjustmentIQD = 0;

    for (const rawItem of params.items) {
      const qty = Math.floor(Number(rawItem.quantity));
      if (!rawItem.barcode || !Number.isFinite(qty) || qty <= 0) {
        throw new Error('كمية الإرجاع يجب أن تكون رقماً موجباً صحيحاً');
      }

      const inv = this.storeInventory.find(
        s => s.storeId === params.storeId && s.barcode === rawItem.barcode
      );

      let unitPriceIQD = Number(rawItem.unitPriceIQD ?? inv?.retailSellingPriceIQD ?? 0);

      if (originalSale) {
        const soldLine = originalSale.items.find(it => it.barcode === rawItem.barcode);
        if (!soldLine) {
          throw new Error(`الصنف (${rawItem.productName || rawItem.barcode}) غير موجود في الفاتورة #${originalSale.receiptNumber}`);
        }
        const alreadyReturned = returnedAlreadyMap.get(rawItem.barcode) || 0;
        const maxReturnable = Math.max(0, soldLine.quantity - alreadyReturned);
        if (qty > maxReturnable) {
          throw new Error(
            maxReturnable === 0
              ? `تم إرجاع كامل كمية "${soldLine.productName}" مسبقاً من الفاتورة #${originalSale.receiptNumber}`
              : `الكمية المطلوب إرجاعها من "${soldLine.productName}" (${qty}) تتجاوز المتبقي القابل للإرجاع (${maxReturnable})`
          );
        }
        unitPriceIQD = Math.round(soldLine.unitPriceIQD * discountMultiplier);
      }

      if (!inv && unitPriceIQD <= 0) {
        throw new Error(`الصنف (${rawItem.barcode}) غير موجود في مخزون المتجر`);
      }

      const productName = inv?.productName || rawItem.productName || 'منتج';
      const restockToShelf = rawItem.restockToShelf !== false;

      if (restockToShelf && inv) {
        inv.stockQuantity += qty;
        inv.isLowStock = inv.stockQuantity <= inv.reorderLevel;
        restockedItems.push({
          barcode: inv.barcode,
          productName: inv.productName,
          addedQty: qty,
          newStockQuantity: inv.stockQuantity
        });
      }

      const lineRefund = Math.round(unitPriceIQD * qty);
      totalRefundIQD += lineRefund;

      const costPrice = inv ? inv.costPriceIQD : Math.round(unitPriceIQD * 0.85);
      profitAdjustmentIQD += Math.max(0, Math.round((unitPriceIQD - costPrice) * qty));

      processedItems.push({
        barcode: rawItem.barcode,
        productName,
        quantity: qty,
        unitPriceIQD,
        restockToShelf
      });
    }

    const nextReturnNumber =
      this.storePOSReturns.reduce((max, r) => Math.max(max, r.returnNumber), 5000) + 1;

    const refundMethod: StorePOSReturnRecord['refundMethod'] =
      params.refundMethod === 'card' || params.refundMethod === 'credit_ledger'
        ? params.refundMethod
        : 'cash';

    const returnRecord: StorePOSReturnRecord = {
      id: `ret_${nextReturnNumber}`,
      returnNumber: nextReturnNumber,
      storeId: params.storeId,
      originalReceiptNumber: originalSale?.receiptNumber,
      customerName: params.customerName?.trim() || originalSale?.customerName || 'زبون نقدي',
      refundMethod,
      items: processedItems,
      totalRefundIQD,
      profitAdjustmentIQD,
      reason: params.reason?.trim() || 'استرجاع منتج عند الكاشير',
      processedBy: params.processedBy?.trim() || 'أمين الصندوق',
      createdAt: new Date().toISOString()
    };

    this.storePOSReturns.unshift(returnRecord);

    return {
      returnId: returnRecord.id,
      returnNumber: returnRecord.returnNumber,
      returnRecord,
      restockedItems,
      restockedUnitsCount: restockedItems.reduce((s, it) => s + it.addedQty, 0),
      totalRefundIQD,
      timestamp: returnRecord.createdAt
    };
  }

  // ================= LOW STOCK ALERT SYSTEM =================
  getLowStockAlerts(storeId: string) {
    const items = this.storeInventory.filter(s => s.storeId === storeId);
    const alerts: {
      id: string;
      inventoryId: string;
      barcode: string;
      productName: string;
      category: string;
      unit: string;
      currentStock: number;
      reorderLevel: number;
      urgency: 'critical' | 'warning' | 'attention';
      daysRemaining: number;
      recommendedReorderQty: number;
      bestOffer: {
        offerId: string;
        supplierId: string;
        supplierName: string;
        priceIQD: number;
        deliveryDays: number;
        availableStock: number;
      } | null;
    }[] = [];

    for (const item of items) {
      const isCritical = item.stockQuantity <= 2 || item.stockQuantity === 0;
      const isLow = item.stockQuantity <= item.reorderLevel;
      const isApproaching = item.stockQuantity <= item.reorderLevel * 1.3;

      if (isLow || isApproaching) {
        // Find best supplier offer for this barcode
        const offers = this.offers.filter(o => o.barcode === item.barcode);
        offers.sort((a, b) => a.priceIQD - b.priceIQD);
        const bestOffer = offers[0] || null;

        // Daily run rate
        const dailyBurnRate = (item.monthlyAverageSales || 30) / 30;
        const daysRemaining = dailyBurnRate > 0 ? Math.max(1, Math.round(item.stockQuantity / dailyBurnRate)) : 3;
        const recommendedReorderQty = Math.max(item.reorderLevel * 2 - item.stockQuantity, bestOffer?.minOrderQuantity || 5);

        alerts.push({
          id: `alert_${item.id}`,
          inventoryId: item.id,
          barcode: item.barcode,
          productName: item.productName,
          category: item.category,
          unit: item.unit,
          currentStock: item.stockQuantity,
          reorderLevel: item.reorderLevel,
          urgency: isCritical ? 'critical' : isLow ? 'warning' : 'attention',
          daysRemaining,
          recommendedReorderQty,
          bestOffer: bestOffer ? {
            offerId: bestOffer.id,
            supplierId: bestOffer.supplierId,
            supplierName: bestOffer.supplierName,
            priceIQD: bestOffer.priceIQD,
            deliveryDays: bestOffer.deliveryDays,
            availableStock: bestOffer.availableStock
          } : null
        });
      }
    }

    const urgencyWeight = { critical: 0, warning: 1, attention: 2 };
    alerts.sort((a, b) => urgencyWeight[a.urgency] - urgencyWeight[b.urgency] || a.currentStock - b.currentStock);
    return alerts;
  }

  updateInventoryThreshold(storeId: string, barcode: string, reorderLevel: number, stockQuantity?: number) {
    const item = this.storeInventory.find(s => s.storeId === storeId && s.barcode === barcode);
    if (!item) throw new Error('المنتج غير موجود في مخزون المتجر');
    item.reorderLevel = Math.max(1, Number(reorderLevel));
    if (typeof stockQuantity === 'number') {
      item.stockQuantity = Math.max(0, Number(stockQuantity));
    }
    item.isLowStock = item.stockQuantity <= item.reorderLevel;
    return item;
  }

  simulateStockDeduction(storeId: string, barcode: string, amount: number) {
    const item = this.storeInventory.find(s => s.storeId === storeId && s.barcode === barcode);
    if (!item) throw new Error('المنتج غير موجود في مخزون المتجر');
    item.stockQuantity = Math.max(0, item.stockQuantity - Number(amount));
    item.isLowStock = item.stockQuantity <= item.reorderLevel;
    return item;
  }

  trackQRScan(slug: string) {
    const poster = this.posters.find(p => p.slug === slug);
    if (poster) {
      poster.totalScans += 1;
      poster.lastScannedAt = new Date().toISOString();
    }
    const store = this.stores.find(s => s.customDomainSlug === slug);
    if (store) {
      store.qrScanCount += 1;
    }
    return poster;
  }

  // ================= SUPPLIER REVIEWS & RATINGS =================
  getSupplierReviews(supplierId: string): SupplierReview[] {
    return this.supplierReviews
      .filter((r) => r.supplierId === supplierId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getSupplierReviewSummary(supplierId: string): SupplierReviewSummary {
    const list = this.getSupplierReviews(supplierId);
    const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (list.length === 0) {
      return {
        supplierId,
        averageRating: 5.0,
        reviewsCount: 0,
        serviceAvg: 5.0,
        qualityAvg: 5.0,
        distribution
      };
    }
    let total = 0;
    let totalService = 0;
    let totalQuality = 0;
    for (const r of list) {
      const clamped = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      distribution[clamped] += 1;
      total += r.rating;
      totalService += r.serviceRating || r.rating;
      totalQuality += r.qualityRating || r.rating;
    }
    return {
      supplierId,
      averageRating: Math.round((total / list.length) * 10) / 10,
      reviewsCount: list.length,
      serviceAvg: Math.round((totalService / list.length) * 10) / 10,
      qualityAvg: Math.round((totalQuality / list.length) * 10) / 10,
      distribution
    };
  }

  getAllSupplierReviewSummaries(): Record<string, SupplierReviewSummary> {
    const ids = Array.from(new Set(this.supplierReviews.map((r) => r.supplierId)));
    const result: Record<string, SupplierReviewSummary> = {};
    for (const id of ids) {
      result[id] = this.getSupplierReviewSummary(id);
    }
    return result;
  }

  addSupplierReview(params: {
    supplierId: string;
    storeId?: string;
    storeName: string;
    rating: number;
    serviceRating?: number;
    qualityRating?: number;
    comment: string;
    orderId?: string;
  }) {
    const rating = Math.min(5, Math.max(1, Math.round(Number(params.rating))));
    const serviceRating = Math.min(5, Math.max(1, Math.round(Number(params.serviceRating || rating))));
    const qualityRating = Math.min(5, Math.max(1, Math.round(Number(params.qualityRating || rating))));
    const trimmedComment = (params.comment || '').trim();
    if (trimmedComment.length < 3) {
      throw new Error('يرجى كتابة تعليق واضح حول مستوى الخدمة أو الجودة (3 أحرف على الأقل)');
    }

    const storeId = params.storeId || 'store_almansoor';
    const hasPastOrder =
      Boolean(params.orderId) ||
      this.subOrders.some((o) => o.storeId === storeId && o.supplierId === params.supplierId);

    const newReview: SupplierReview = {
      id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      supplierId: params.supplierId,
      storeId,
      storeName: params.storeName.trim() || 'سوبرماركت المنصور المركزي',
      rating,
      serviceRating,
      qualityRating,
      comment: trimmedComment,
      isVerifiedOrder: hasPastOrder,
      orderId: params.orderId,
      createdAt: new Date().toISOString()
    };

    this.supplierReviews.unshift(newReview);

    const summary = this.getSupplierReviewSummary(params.supplierId);
    const matchedSupplier = this.suppliers.find((s) => s.id === params.supplierId);
    if (matchedSupplier) {
      matchedSupplier.rating = summary.averageRating;
    }

    return { review: newReview, summary };
  }

  private normalizeStaffPhone(phone: string): string {
    return (phone || '').replace(/[\s\-()]/g, '').trim();
  }

  private hashStaffPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derived}`;
  }

  private verifyStaffPassword(password: string, storedHash: string): boolean {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, keyHex] = parts;
    if (!salt || !keyHex) return false;
    const expected = Buffer.from(keyHex, 'hex');
    const actual = crypto.scryptSync(password, salt, 64);
    if (expected.length !== actual.length) return false;
    return crypto.timingSafeEqual(expected, actual);
  }

  private toPublicStaff(staff: StoreStaffAccount): StoreStaffPublic {
    const { passwordHash: _omitted, ...publicRecord } = staff;
    return publicRecord;
  }

  getStoreStaff(storeId: string): StoreStaffPublic[] {
    return this.storeStaff
      .filter((s) => s.storeId === storeId)
      .map((s) => this.toPublicStaff(s));
  }

  createStoreStaff(params: {
    storeId: string;
    storeName?: string;
    name: string;
    role: StoreStaffRole;
    phone: string;
    branchId: string;
    branchName: string;
    password: string;
  }): StoreStaffPublic {
    const name = (params.name || '').trim();
    const phone = (params.phone || '').trim();
    const normalizedPhone = this.normalizeStaffPhone(phone);
    const password = String(params.password || '');

    if (name.length < 2) {
      throw new Error('يرجى إدخال اسم الموظف الكامل (حرفين على الأقل)');
    }
    if (params.role !== 'cashier' && params.role !== 'accountant') {
      throw new Error('يرجى اختيار دور وظيفي صالح (كاشير أو محاسب)');
    }
    if (normalizedPhone.length < 6) {
      throw new Error('يرجى إدخال رقم هاتف أو معرف دخول صالح (6 أرقام على الأقل)');
    }
    if (password.length < 4) {
      throw new Error('كلمة المرور يجب أن تكون 4 أحرف أو أرقام على الأقل');
    }

    const duplicate = this.storeStaff.some(
      (s) => this.normalizeStaffPhone(s.phone) === normalizedPhone
    );
    if (duplicate) {
      throw new Error('رقم الهاتف هذا مسجل بالفعل لموظف آخر');
    }

    const storeMatch = this.stores.find((st) => st.id === params.storeId);
    const created: StoreStaffAccount = {
      id: `staff_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      storeId: params.storeId,
      storeName: (params.storeName || storeMatch?.name || 'سوبرماركت المنصور المركزي').trim(),
      name,
      role: params.role,
      phone,
      branchId: (params.branchId || 'branch_main').trim(),
      branchName: (params.branchName || 'الفرع الرئيسي').trim(),
      isActive: true,
      passwordHash: this.hashStaffPassword(password),
      createdAt: new Date().toISOString()
    };

    this.storeStaff.unshift(created);
    return this.toPublicStaff(created);
  }

  updateStoreStaff(
    storeId: string,
    staffId: string,
    patch: {
      name?: string;
      role?: StoreStaffRole;
      phone?: string;
      branchId?: string;
      branchName?: string;
      isActive?: boolean;
      password?: string;
    }
  ): StoreStaffPublic {
    const staff = this.storeStaff.find((s) => s.id === staffId && s.storeId === storeId);
    if (!staff) {
      throw new Error('حساب الموظف غير موجود');
    }

    if (patch.name !== undefined) {
      const trimmed = patch.name.trim();
      if (trimmed.length < 2) {
        throw new Error('يرجى إدخال اسم الموظف الكامل (حرفين على الأقل)');
      }
      staff.name = trimmed;
    }

    if (patch.role !== undefined) {
      if (patch.role !== 'cashier' && patch.role !== 'accountant') {
        throw new Error('دور وظيفي غير صالح');
      }
      staff.role = patch.role;
    }

    if (patch.phone !== undefined) {
      const trimmedPhone = patch.phone.trim();
      const norm = this.normalizeStaffPhone(trimmedPhone);
      if (norm.length < 6) {
        throw new Error('رقم الهاتف غير صالح (6 أرقام على الأقل)');
      }
      const duplicate = this.storeStaff.some(
        (s) => s.id !== staffId && this.normalizeStaffPhone(s.phone) === norm
      );
      if (duplicate) {
        throw new Error('رقم الهاتف هذا مسجل بالفعل لموظف آخر');
      }
      staff.phone = trimmedPhone;
    }

    if (patch.branchId !== undefined) {
      staff.branchId = patch.branchId.trim() || staff.branchId;
    }
    if (patch.branchName !== undefined) {
      staff.branchName = patch.branchName.trim() || staff.branchName;
    }
    if (patch.isActive !== undefined) {
      staff.isActive = Boolean(patch.isActive);
    }
    if (patch.password !== undefined && patch.password.length > 0) {
      if (patch.password.length < 4) {
        throw new Error('كلمة المرور يجب أن تكون 4 أحرف أو أرقام على الأقل');
      }
      staff.passwordHash = this.hashStaffPassword(patch.password);
    }

    return this.toPublicStaff(staff);
  }

  deleteStoreStaff(storeId: string, staffId: string): void {
    const idx = this.storeStaff.findIndex((s) => s.id === staffId && s.storeId === storeId);
    if (idx === -1) {
      throw new Error('حساب الموظف غير موجود');
    }
    this.storeStaff.splice(idx, 1);
  }

  authenticateStoreStaff(
    phone: string,
    password: string
  ): { status: 'ok' | 'not_found' | 'invalid_credentials' | 'inactive'; staff?: StoreStaffPublic } {
    const norm = this.normalizeStaffPhone(phone);
    if (!norm || !password) {
      return { status: 'invalid_credentials' };
    }
    const staff = this.storeStaff.find((s) => this.normalizeStaffPhone(s.phone) === norm);
    if (!staff) {
      return { status: 'not_found' };
    }
    if (!this.verifyStaffPassword(password, staff.passwordHash)) {
      return { status: 'invalid_credentials' };
    }
    if (!staff.isActive || this.getStaffAccountStatus(staff) !== 'active') {
      return { status: 'inactive' };
    }
    staff.lastLoginAt = new Date().toISOString();
    return { status: 'ok', staff: this.toPublicStaff(staff) };
  }

  // ================= NEAR-EXPIRY & CLEARANCE OFFERS =================
  getSupplierWarehouseBatches(supplierId: string): SupplierInventoryBatch[] {
    return this.supplierInventoryBatches.filter((b) => b.supplierId === supplierId);
  }

  getCatalogImageForBarcode(barcode: string): string | undefined {
    const prod = this.products.find((p) => p.barcode === barcode);
    return prod?.imageUrl || prod?.images?.[0];
  }

  upsertWholesaleClearanceOffer(params: {
    barcode: string;
    supplierId: string;
    basePriceIQD: number;
    discountPercent: number;
    availableStock: number;
    expiryDate: string;
  }): SupplierOffer {
    const supplier = this.suppliers.find((s) => s.id === params.supplierId) || this.suppliers[0];
    if (!supplier) {
      throw new Error('المورد غير موجود');
    }
    const cleanDiscount = Math.min(85, Math.max(5, Math.round(Number(params.discountPercent))));
    const basePrice = Math.max(250, Math.round(Number(params.basePriceIQD)));
    const discountedPriceIQD = Math.max(250, Math.round((basePrice * (1 - cleanDiscount / 100)) / 50) * 50);
    const discountedPriceUSD = Math.round((discountedPriceIQD / 1530) * 100) / 100;

    let offer = this.offers.find(
      (o) =>
        o.barcode === params.barcode &&
        o.supplierId === supplier.id &&
        Boolean(o.isClearanceNearExpiry)
    );

    if (offer) {
      offer.priceIQD = discountedPriceIQD;
      offer.priceUSD = discountedPriceUSD;
      offer.availableStock = Math.max(1, Math.round(Number(params.availableStock) || offer.availableStock));
      offer.clearanceDiscountPercent = cleanDiscount;
      offer.expiryDate = params.expiryDate;
      offer.isClearanceNearExpiry = true;
    } else {
      const existingRegular = this.offers.find(
        (o) => o.barcode === params.barcode && o.supplierId === supplier.id
      );
      const newOffer: SupplierOffer = {
        id: `off_clr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        barcode: params.barcode,
        supplierId: supplier.id,
        supplierName: supplier.companyName,
        supplierCity: supplier.city,
        priceIQD: discountedPriceIQD,
        priceUSD: discountedPriceUSD,
        minOrderQuantity: existingRegular?.minOrderQuantity ?? 2,
        availableStock: Math.max(1, Math.round(Number(params.availableStock) || 10)),
        deliveryDays: 1,
        paymentTerms: existingRegular?.paymentTerms ?? {
          allowsCredit: true,
          maxCreditDays: 15,
          allowsCash: true
        },
        isClearanceNearExpiry: true,
        clearanceDiscountPercent: cleanDiscount,
        expiryDate: params.expiryDate
      };
      this.offers.unshift(newOffer);
      offer = newOffer;
    }

    const catalogProduct = this.products.find((p) => p.barcode === params.barcode);
    if (catalogProduct) {
      catalogProduct.oldPrice = basePrice;
      catalogProduct.discountPercent = cleanDiscount;
      catalogProduct.badgeType = 'promo_day';
    }

    return offer;
  }

  // ================= ADMIN OPERATIONS CENTER & AUDIT =================
  recordAudit(
    entry: Omit<AdminAuditLog, 'id' | 'at'> & { at?: string }
  ): AdminAuditLog {
    const log: AdminAuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      at: entry.at || new Date().toISOString(),
      actorId: entry.actorId,
      actorName: entry.actorName,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      summaryAr: entry.summaryAr,
      summaryEn: entry.summaryEn,
      before: entry.before,
      after: entry.after,
      reason: entry.reason
    };
    this.auditLogs.unshift(log);
    return log;
  }

  queryAuditLogs(params?: {
    action?: string;
    entityType?: string;
    actorId?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }) {
    let filtered = [...this.auditLogs];

    if (params?.action && params.action.trim()) {
      const q = params.action.trim().toLowerCase();
      filtered = filtered.filter((l) => l.action.toLowerCase().includes(q));
    }
    if (params?.entityType && params.entityType.trim()) {
      const et = params.entityType.trim().toLowerCase();
      filtered = filtered.filter((l) => l.entityType.toLowerCase() === et);
    }
    if (params?.actorId && params.actorId.trim()) {
      const aid = params.actorId.trim().toLowerCase();
      filtered = filtered.filter((l) => l.actorId.toLowerCase().includes(aid));
    }
    if (params?.from) {
      const fromMs = Date.parse(params.from);
      if (Number.isFinite(fromMs)) {
        filtered = filtered.filter((l) => Date.parse(l.at) >= fromMs);
      }
    }
    if (params?.to) {
      // If date-only YYYY-MM-DD, include entire end day
      const toStr = params.to.length === 10 ? `${params.to}T23:59:59.999Z` : params.to;
      const toMs = Date.parse(toStr);
      if (Number.isFinite(toMs)) {
        filtered = filtered.filter((l) => Date.parse(l.at) <= toMs);
      }
    }

    filtered.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

    const pageSize = Math.min(100, Math.max(1, Number(params?.pageSize) || 10));
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(totalPages, Math.max(1, Number(params?.page) || 1));
    const start = (page - 1) * pageSize;

    return {
      items: filtered.slice(start, start + pageSize),
      total,
      page,
      pageSize,
      totalPages,
      availableActions: Array.from(new Set(this.auditLogs.map((l) => l.action))).sort(),
      availableEntityTypes: Array.from(new Set(this.auditLogs.map((l) => l.entityType))).sort()
    };
  }

  getAdminOverview(range: '7d' | '30d' | '90d' = '30d') {
    const daysCount = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    const now = new Date();
    const endMs = now.getTime();
    const startDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    startDay.setUTCDate(startDay.getUTCDate() - (daysCount - 1));
    const startMs = startDay.getTime();

    const rangeOrders = this.subOrders.filter((o) => {
      const ts = Date.parse(o.createdAt);
      return Number.isFinite(ts) && ts >= startMs && ts <= endMs;
    });

    const nonCancelledOrders = rangeOrders.filter((o) => o.status !== 'cancelled');
    const gmvIQD = nonCancelledOrders.reduce((sum, o) => sum + (Number(o.subtotalIQD) || 0), 0);
    const ordersCount = rangeOrders.length;
    const deliveredCount = rangeOrders.filter((o) => o.status === 'delivered').length;
    const deliveredRatePercent =
      ordersCount > 0 ? Math.round((deliveredCount / ordersCount) * 1000) / 10 : 0;
    const avgOrderValueIQD =
      nonCancelledOrders.length > 0
        ? Math.round(gmvIQD / nonCancelledOrders.length)
        : 0;

    const activeSuppliersCount = this.suppliers.filter((s) => this.isSupplierOperable(s)).length;
    const pendingSuppliersList = this.suppliers.filter(
      (s) =>
        this.getSupplierAccountStatus(s) === 'active' &&
        this.getSupplierVerificationStatus(s) === 'pending'
    );
    const pendingStoresList = this.stores.filter(
      (st) =>
        this.getStoreAccountStatus(st) === 'active' &&
        this.getStoreVerificationStatus(st) === 'pending'
    );
    const activeStoresCount = this.stores.filter((st) => this.isStoreOperable(st)).length;
    const activeDriversCount = this.drivers.filter(
      (d) => this.getDriverAccountStatus(d) === 'active'
    ).length;

    const totalUsedCreditIQD = this.creditAccounts.reduce(
      (sum, c) => sum + (Number(c.currentUsedCreditIQD) || 0),
      0
    );
    const totalOverdueDebtIQD = this.creditAccounts.reduce(
      (sum, c) =>
        sum +
        (Number(c.aging?.bucket31_60) || 0) +
        (Number(c.aging?.bucket61_90) || 0) +
        (Number(c.aging?.bucket90Plus) || 0),
      0
    );

    const pendingCreditUpgrades = this.creditUpgradeRequests.filter(
      (r) => r.status === 'platform_review'
    );
    const lowStockOffersCount = this.offers.filter(
      (o) => Number(o.availableStock) <= 20
    ).length;

    // Daily time series within selected range
    const dailyMap = new Map<string, { gmvIQD: number; ordersCount: number }>();
    for (let i = 0; i < daysCount; i += 1) {
      const d = new Date(startDay);
      d.setUTCDate(startDay.getUTCDate() + i);
      const isoDate = d.toISOString().slice(0, 10);
      dailyMap.set(isoDate, { gmvIQD: 0, ordersCount: 0 });
    }
    for (const o of rangeOrders) {
      const key = (o.createdAt || '').slice(0, 10);
      const bucket = dailyMap.get(key);
      if (!bucket) continue;
      bucket.ordersCount += 1;
      if (o.status !== 'cancelled') {
        bucket.gmvIQD += Number(o.subtotalIQD) || 0;
      }
    }
    const dailySeries = Array.from(dailyMap.entries()).map(([date, val]) => ({
      date,
      label: date.slice(5).replace('-', '/'),
      gmvIQD: val.gmvIQD,
      ordersCount: val.ordersCount
    }));

    // Order status distribution
    const allStatuses: Array<
      'pending' | 'approved' | 'assigned_driver' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'disputed'
    > = ['pending', 'approved', 'assigned_driver', 'out_for_delivery', 'delivered', 'cancelled', 'disputed'];
    const statusDistribution = allStatuses.map((status) => ({
      status,
      count: rangeOrders.filter((o) => o.status === status).length
    }));

    // Top 5 suppliers by GMV
    const suppAgg = new Map<string, { supplierId: string; supplierName: string; gmvIQD: number; ordersCount: number }>();
    for (const o of nonCancelledOrders) {
      const cur = suppAgg.get(o.supplierId) || {
        supplierId: o.supplierId,
        supplierName: o.supplierName,
        gmvIQD: 0,
        ordersCount: 0
      };
      cur.gmvIQD += Number(o.subtotalIQD) || 0;
      cur.ordersCount += 1;
      suppAgg.set(o.supplierId, cur);
    }
    const topSuppliers = Array.from(suppAgg.values())
      .sort((a, b) => b.gmvIQD - a.gmvIQD)
      .slice(0, 5);

    // Top 5 products by revenue
    const prodAgg = new Map<string, { barcode: string; productName: string; revenueIQD: number; quantity: number }>();
    for (const o of nonCancelledOrders) {
      for (const item of o.items || []) {
        const cur = prodAgg.get(item.barcode) || {
          barcode: item.barcode,
          productName: item.productName,
          revenueIQD: 0,
          quantity: 0
        };
        cur.revenueIQD += Number(item.totalPriceIQD) || 0;
        cur.quantity += Number(item.quantity) || 0;
        prodAgg.set(item.barcode, cur);
      }
    }
    const topProducts = Array.from(prodAgg.values())
      .sort((a, b) => b.revenueIQD - a.revenueIQD)
      .slice(0, 5);

    // Needs attention queue (live platform snapshot)
    const needsAttention: Array<{
      id: string;
      type:
        | 'pending_supplier'
        | 'pending_store'
        | 'credit_upgrade'
        | 'stuck_order'
        | 'disputed_order'
        | 'blocked_credit'
        | 'catalog_no_offers'
        | 'catalog_price_anomaly'
        | 'pending_delivery_partner'
        | 'expiring_vehicle_doc'
        | 'supplier_no_delivery_option'
        | 'stale_delivery_job'
        | 'failed_delivery_job'
        | 'platform_order_missing_job';
      severity: 'high' | 'medium';
      titleAr: string;
      titleEn: string;
      subtitleAr: string;
      subtitleEn: string;
      targetSection: string;
      entityId: string;
    }> = [];

    for (const s of pendingSuppliersList) {
      needsAttention.push({
        id: `att_supp_${s.id}`,
        type: 'pending_supplier',
        severity: 'high',
        titleAr: `مورد بانتظار التوثيق: ${s.companyName}`,
        titleEn: `Supplier pending verification: ${s.companyName}`,
        subtitleAr: `${s.city} • ${s.contactPerson}`,
        subtitleEn: `${s.city} • ${s.contactPerson}`,
        targetSection: 'suppliers',
        entityId: s.id
      });
    }

    for (const st of pendingStoresList) {
      needsAttention.push({
        id: `att_store_${st.id}`,
        type: 'pending_store',
        severity: 'medium',
        titleAr: `متجر بانتظار التوثيق: ${st.name}`,
        titleEn: `Store pending verification: ${st.name}`,
        subtitleAr: `${st.city} • ${st.ownerName}`,
        subtitleEn: `${st.city} • ${st.ownerName}`,
        targetSection: 'stores',
        entityId: st.id
      });
    }

    for (const req of pendingCreditUpgrades) {
      needsAttention.push({
        id: `att_upg_${req.id}`,
        type: 'credit_upgrade',
        severity: 'medium',
        titleAr: `طلب رفع حد ائتمان: ${req.storeName}`,
        titleEn: `Credit upgrade request: ${req.storeName}`,
        subtitleAr: `من ${req.currentLimitIQD.toLocaleString('en-US')} إلى ${req.requestedLimitIQD.toLocaleString('en-US')} د.ع`,
        subtitleEn: `From ${req.currentLimitIQD.toLocaleString('en-US')} to ${req.requestedLimitIQD.toLocaleString('en-US')} IQD`,
        targetSection: 'credit_upgrades',
        entityId: req.id
      });
    }

    let stuckOrdersCount = 0;
    let openDisputesCount = 0;
    for (const o of this.subOrders) {
      const stuckCheck = this.isSubOrderStuck(o, endMs);
      if (stuckCheck.isStuck) {
        stuckOrdersCount += 1;
        needsAttention.push({
          id: `att_stuck_${o.id}`,
          type: 'stuck_order',
          severity: 'high',
          titleAr:
            stuckCheck.stuckType === 'delivery_48h'
              ? `طلب متأخر في التوصيل >48 ساعة (${o.id})`
              : `طلب عالق أكثر من 24 ساعة (${o.id})`,
          titleEn:
            stuckCheck.stuckType === 'delivery_48h'
              ? `Order out for delivery >48h (${o.id})`
              : `Order stuck pending >24h (${o.id})`,
          subtitleAr: `${o.storeName} ← ${o.supplierName}`,
          subtitleEn: `${o.storeName} ← ${o.supplierName}`,
          targetSection: 'orders',
          entityId: o.id
        });
      }
      if (o.status === 'disputed') {
        openDisputesCount += 1;
        const linkedDispute = this.disputes.find(
          (d) => d.subOrderId === o.id && (d.status === 'open' || d.status === 'under_review')
        );
        needsAttention.push({
          id: `att_disp_${o.id}`,
          type: 'disputed_order',
          severity: 'high',
          titleAr: `طلب بحالة نزاع مفتوح (${o.id})`,
          titleEn: `Disputed order (${o.id})`,
          subtitleAr: `${o.storeName} • ${(Number(o.subtotalIQD) || 0).toLocaleString('en-US')} د.ع`,
          subtitleEn: `${o.storeName} • ${(Number(o.subtotalIQD) || 0).toLocaleString('en-US')} IQD`,
          targetSection: 'disputes',
          entityId: linkedDispute?.id || o.id
        });
      }
    }

    for (const acc of this.creditAccounts) {
      if (acc.isBlocked) {
        needsAttention.push({
          id: `att_blk_${acc.id}`,
          type: 'blocked_credit',
          severity: 'medium',
          titleAr: `حساب ائتمان موقوف: ${acc.storeName}`,
          titleEn: `Blocked credit account: ${acc.storeName}`,
          subtitleAr: acc.blockReason || 'يتطلب مراجعة مالية والتسوية',
          subtitleEn: acc.blockReason || 'Requires financial review',
          targetSection: 'credit_limits',
          entityId: acc.id
        });
      }
    }

    // Catalog summary & anomaly alerts for Admin Overview
    const qualitySummary = this.getAdminCatalogQualitySummary();
    const anomalyMap = this.buildGlobalOfferAnomalyMap();
    const anomalyOffers = this.offers.filter(
      (o) => anomalyMap.get(o.id)?.isPriceAnomaly && this.getOfferStatus(o) === 'active'
    );

    if (qualitySummary.withoutOffersCount > 0) {
      needsAttention.push({
        id: 'att_cat_no_offers',
        type: 'catalog_no_offers',
        severity: 'medium',
        titleAr: `${qualitySummary.withoutOffersCount} منتج في الكتالوج بلا عروض موردين فعالة`,
        titleEn: `${qualitySummary.withoutOffersCount} catalog products have no active supplier offers`,
        subtitleAr: 'راجع الكتالوج لإخفاء المنتجات غير النشطة أو استكمال عروض الموردين',
        subtitleEn: 'Review catalog to hide inactive products or add supplier offers',
        targetSection: 'products',
        entityId: 'without_offers'
      });
    }

    if (anomalyOffers.length > 0) {
      needsAttention.push({
        id: 'att_cat_price_anomaly',
        type: 'catalog_price_anomaly',
        severity: 'high',
        titleAr: `رصد ${anomalyOffers.length} عرض بسعر شاذ (>40% عن الوسيط)`,
        titleEn: `Detected ${anomalyOffers.length} offer(s) with price anomaly (>40% off median)`,
        subtitleAr: 'راجع عروض الموردين للتحقق من الأسعار الشاذة وإيقاف غير المطابق',
        subtitleEn: 'Review supplier offers to verify or suspend outlier pricing',
        targetSection: 'offers',
        entityId: 'price_anomaly'
      });
    }

    // Platform Delivery Network Attention Queue (Phase D1)
    const pendingPartnersList = this.deliveryPartners.filter((p) => p.accountStatus === 'pending');
    for (const dp of pendingPartnersList) {
      needsAttention.push({
        id: `att_dp_${dp.id}`,
        type: 'pending_delivery_partner',
        severity: 'medium',
        titleAr: `شريك توصيل بانتظار المراجعة: ${dp.name}`,
        titleEn: `Delivery partner pending review: ${dp.name}`,
        subtitleAr: `${dp.city} • ${dp.registrationCode}`,
        subtitleEn: `${dp.city} • ${dp.registrationCode}`,
        targetSection: 'delivery_network',
        entityId: dp.id
      });
    }

    const expiringVehiclesList = this.getExpiringVehicleDocsSummary(30);
    if (expiringVehiclesList.length > 0) {
      needsAttention.push({
        id: 'att_veh_expiring',
        type: 'expiring_vehicle_doc',
        severity: expiringVehiclesList.some((v) => v.hasExpired) ? 'high' : 'medium',
        titleAr: `${expiringVehiclesList.length} مركبة توصيل تنتهي وثائقها خلال 30 يوماً`,
        titleEn: `${expiringVehiclesList.length} delivery vehicle(s) with documents expiring within 30 days`,
        subtitleAr: expiringVehiclesList.map((v) => v.plateNumber).slice(0, 3).join(' • '),
        subtitleEn: expiringVehiclesList.map((v) => v.plateNumber).slice(0, 3).join(' • '),
        targetSection: 'delivery_network',
        entityId: expiringVehiclesList[0].id
      });
    }

    const suppliersWithoutDeliveryOption = this.suppliers.filter((s) => {
      const ds = s.deliverySettings;
      if (!ds) return false;
      return !ds.hasOwnFleet && !ds.allowPlatformDelivery && !ds.allowStorePickup;
    });
    if (suppliersWithoutDeliveryOption.length > 0) {
      needsAttention.push({
        id: 'att_supp_no_delivery',
        type: 'supplier_no_delivery_option',
        severity: 'high',
        titleAr: `${suppliersWithoutDeliveryOption.length} مورد بدون أي خيار توصيل مفعّل`,
        titleEn: `${suppliersWithoutDeliveryOption.length} supplier(s) have no delivery option enabled`,
        subtitleAr: suppliersWithoutDeliveryOption.map((s) => s.companyName).slice(0, 2).join(' • '),
        subtitleEn: suppliersWithoutDeliveryOption.map((s) => s.companyName).slice(0, 2).join(' • '),
        targetSection: 'delivery_network',
        entityId: suppliersWithoutDeliveryOption[0].id
      });
    }

    // Platform Dispatch Queue Alerts (Phase D2)
    const staleThresholdMin = this.deliveryPlatformSettings.staleOpenJobMinutes ?? 30;
    const staleOpenJobs = this.deliveryJobs.filter((j) => {
      if (j.status !== 'open') return false;
      const ageMin = (Date.now() - Date.parse(j.createdAt)) / 60000;
      return Number.isFinite(ageMin) && ageMin > staleThresholdMin;
    });
    if (staleOpenJobs.length > 0) {
      needsAttention.push({
        id: 'att_dispatch_stale_open',
        type: 'stale_delivery_job',
        severity: 'high',
        titleAr: `${staleOpenJobs.length} مهمة توصيل مفتوحة متأخرة لأكثر من ${staleThresholdMin} دقيقة`,
        titleEn: `${staleOpenJobs.length} open delivery job(s) waiting > ${staleThresholdMin} min`,
        subtitleAr: staleOpenJobs.map((j) => `${j.subOrderId} (${j.dropoff.city})`).slice(0, 2).join(' • '),
        subtitleEn: staleOpenJobs.map((j) => `${j.subOrderId} (${j.dropoff.city})`).slice(0, 2).join(' • '),
        targetSection: 'dispatch_board',
        entityId: staleOpenJobs[0].id
      });
    }

    const failedJobsList = this.deliveryJobs.filter((j) => {
      if (j.status !== 'failed') return false;
      const linkedOrder = this.subOrders.find((o) => o.id === j.subOrderId);
      return linkedOrder && !['cancelled', 'delivered'].includes(linkedOrder.status);
    });
    if (failedJobsList.length > 0) {
      needsAttention.push({
        id: 'att_dispatch_failed',
        type: 'failed_delivery_job',
        severity: 'high',
        titleAr: `${failedJobsList.length} مهمة توصيل فاشلة تتطلب إعادة التوزيع`,
        titleEn: `${failedJobsList.length} failed delivery job(s) require reassignment`,
        subtitleAr: failedJobsList.map((j) => `${j.subOrderId} — ${j.failure?.reasonCode || ''}`).slice(0, 2).join(' • '),
        subtitleEn: failedJobsList.map((j) => `${j.subOrderId} — ${j.failure?.reasonCode || ''}`).slice(0, 2).join(' • '),
        targetSection: 'dispatch_board',
        entityId: failedJobsList[0].id
      });
    }

    const platformOrdersMissingJob = this.subOrders.filter((o) => {
      if (o.deliveryType !== 'platform_driver' || o.status !== 'approved') return false;
      const job = o.deliveryJobId ? this.deliveryJobs.find((j) => j.id === o.deliveryJobId) : undefined;
      return !job || job.status === 'cancelled';
    });
    if (platformOrdersMissingJob.length > 0) {
      needsAttention.push({
        id: 'att_dispatch_missing_job',
        type: 'platform_order_missing_job',
        severity: 'medium',
        titleAr: `${platformOrdersMissingJob.length} طلب منصة معتمد بدون مهمة توصيل نشطة`,
        titleEn: `${platformOrdersMissingJob.length} approved platform order(s) missing active delivery job`,
        subtitleAr: platformOrdersMissingJob.map((o) => o.id).slice(0, 2).join(' • '),
        subtitleEn: platformOrdersMissingJob.map((o) => o.id).slice(0, 2).join(' • '),
        targetSection: 'dispatch_board',
        entityId: platformOrdersMissingJob[0].id
      });
    }

    return {
      range,
      kpis: {
        gmvIQD,
        ordersCount,
        deliveredCount,
        deliveredRatePercent,
        avgOrderValueIQD,
        activeSuppliersCount,
        activeStoresCount,
        activeDriversCount,
        pendingSuppliersCount: pendingSuppliersList.length,
        pendingStoresCount: pendingStoresList.length,
        totalUsedCreditIQD,
        totalOverdueDebtIQD,
        pendingCreditUpgradesCount: pendingCreditUpgrades.length,
        lowStockOffersCount,
        stuckOrdersCount,
        openDisputesCount: Math.max(
          openDisputesCount,
          this.disputes.filter((d) => d.status === 'open' || d.status === 'under_review').length
        ),
        catalogQualityPercent: qualitySummary.averageScore,
        catalogLowQualityCount: qualitySummary.below60Count,
        productsWithoutOffersCount: qualitySummary.withoutOffersCount,
        priceAnomalyOffersCount: anomalyOffers.length,
        pendingDeliveryPartnersCount: pendingPartnersList.length,
        expiringVehicleDocsCount: expiringVehiclesList.length,
        openDeliveryJobsCount: this.deliveryJobs.filter((j) => j.status === 'open').length,
        staleDeliveryJobsCount: staleOpenJobs.length,
        failedDeliveryJobsCount: failedJobsList.length
      },
      dailySeries,
      statusDistribution,
      topSuppliers,
      topProducts,
      needsAttention
    };
  }

  searchAdminEntities(query: string) {
    const q = (query || '').trim().toLowerCase();
    if (!q) {
      return {
        suppliers: [],
        stores: [],
        drivers: [],
        products: [],
        orders: []
      };
    }

    const suppliers = this.suppliers
      .filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.companyName.toLowerCase().includes(q) ||
          s.contactPerson.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q)
      )
      .slice(0, 6)
      .map((s) => ({
        id: s.id,
        labelAr: s.companyName,
        labelEn: s.companyName,
        metaAr: `${s.city} • ${s.id}`,
        metaEn: `${s.city} • ${s.id}`,
        targetSection: 'suppliers' as const
      }));

    const stores = this.stores
      .filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.ownerName.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q)
      )
      .slice(0, 6)
      .map((s) => ({
        id: s.id,
        labelAr: s.name,
        labelEn: s.name,
        metaAr: `${s.city} - ${s.district} • ${s.id}`,
        metaEn: `${s.city} - ${s.district} • ${s.id}`,
        targetSection: 'stores' as const
      }));

    const drivers = this.drivers
      .filter(
        (d) =>
          d.id.toLowerCase().includes(q) ||
          d.name.toLowerCase().includes(q) ||
          d.vehiclePlate.toLowerCase().includes(q) ||
          d.supplierName.toLowerCase().includes(q)
      )
      .slice(0, 6)
      .map((d) => ({
        id: d.id,
        labelAr: d.name,
        labelEn: d.name,
        metaAr: `${d.vehiclePlate} • ${d.supplierName}`,
        metaEn: `${d.vehiclePlate} • ${d.supplierName}`,
        targetSection: 'drivers' as const
      }));

    const products = this.products
      .filter(
        (p) =>
          p.barcode.toLowerCase().includes(q) ||
          p.nameAr.toLowerCase().includes(q) ||
          (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
          p.brand.toLowerCase().includes(q)
      )
      .slice(0, 6)
      .map((p) => ({
        id: p.barcode,
        labelAr: p.nameAr,
        labelEn: p.nameEn || p.nameAr,
        metaAr: `${p.brand} • ${p.barcode}`,
        metaEn: `${p.brand} • ${p.barcode}`,
        targetSection: 'products' as const
      }));

    const orders = this.subOrders
      .filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.parentOrderId.toLowerCase().includes(q) ||
          o.storeName.toLowerCase().includes(q) ||
          o.supplierName.toLowerCase().includes(q)
      )
      .slice(0, 6)
      .map((o) => ({
        id: o.id,
        labelAr: `${o.id} — ${o.storeName}`,
        labelEn: `${o.id} — ${o.storeName}`,
        metaAr: `${o.supplierName} • ${o.subtotalIQD.toLocaleString('en-US')} د.ع`,
        metaEn: `${o.supplierName} • ${o.subtotalIQD.toLocaleString('en-US')} IQD`,
        targetSection: 'orders' as const
      }));

    return { suppliers, stores, drivers, products, orders };
  }

  // ================= ADMIN PHASE 2: ACCOUNT & VERIFICATION MANAGEMENT =================
  private defaultKycChecklist(): KycChecklistItem[] {
    return [
      { key: 'commercial_license', status: 'pending' },
      { key: 'owner_id', status: 'pending' },
      { key: 'address_proof', status: 'pending' },
      { key: 'phone_verified', status: 'pending' }
    ];
  }

  private resolveAccountRecord(
    type: 'suppliers' | 'stores' | 'drivers' | 'staff',
    id: string
  ):
    | { kind: 'suppliers'; record: SupplierProfile; entityType: string; displayName: string }
    | { kind: 'stores'; record: StoreProfile; entityType: string; displayName: string }
    | { kind: 'drivers'; record: DriverProfile; entityType: string; displayName: string }
    | { kind: 'staff'; record: StoreStaffAccount; entityType: string; displayName: string }
    | null {
    if (type === 'suppliers') {
      const s = this.suppliers.find((x) => x.id === id);
      return s ? { kind: 'suppliers', record: s, entityType: 'supplier', displayName: s.companyName } : null;
    }
    if (type === 'stores') {
      const st = this.stores.find((x) => x.id === id);
      return st ? { kind: 'stores', record: st, entityType: 'store', displayName: st.name } : null;
    }
    if (type === 'drivers') {
      const d = this.drivers.find((x) => x.id === id);
      return d ? { kind: 'drivers', record: d, entityType: 'driver', displayName: d.name } : null;
    }
    const staff = this.storeStaff.find((x) => x.id === id);
    return staff ? { kind: 'staff', record: staff, entityType: 'store_staff', displayName: staff.name } : null;
  }

  private getEffectiveLifecycleState(
    type: 'suppliers' | 'stores' | 'drivers' | 'staff',
    record: any
  ): 'pending' | 'active' | 'suspended' | 'rejected' | 'archived' {
    if (type === 'suppliers') {
      const accStatus = this.getSupplierAccountStatus(record as SupplierProfile);
      if (accStatus !== 'active') return accStatus;
      return this.getSupplierVerificationStatus(record as SupplierProfile) === 'pending' ? 'pending' : 'active';
    }
    if (type === 'stores') {
      const accStatus = this.getStoreAccountStatus(record as StoreProfile);
      if (accStatus !== 'active') return accStatus;
      return this.getStoreVerificationStatus(record as StoreProfile) === 'pending' ? 'pending' : 'active';
    }
    if (type === 'drivers') {
      return this.getDriverAccountStatus(record as DriverProfile);
    }
    return this.getStaffAccountStatus(record as StoreStaffAccount);
  }

  getAllowedAdminAccountActions(
    type: 'suppliers' | 'stores' | 'drivers' | 'staff',
    record: any
  ): Array<'approve' | 'reject' | 'suspend' | 'reactivate' | 'archive'> {
    const state = this.getEffectiveLifecycleState(type, record);
    switch (state) {
      case 'pending':
        return ['approve', 'reject'];
      case 'active':
        return ['suspend', 'archive'];
      case 'suspended':
        return ['reactivate', 'archive'];
      case 'rejected':
        return ['approve'];
      case 'archived':
        return ['reactivate'];
      default:
        return [];
    }
  }

  private enrichAccountListItem(
    type: 'suppliers' | 'stores' | 'drivers' | 'staff',
    raw: any
  ) {
    const lifecycleState = this.getEffectiveLifecycleState(type, raw);
    const allowedActions = this.getAllowedAdminAccountActions(type, raw);
    if (type === 'suppliers') {
      const s = raw as SupplierProfile;
      const suppOrders = this.subOrders.filter((o) => o.supplierId === s.id);
      const gmvIQD = suppOrders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (Number(o.subtotalIQD) || 0), 0);
      return {
        ...s,
        accountStatus: this.getSupplierAccountStatus(s),
        verificationStatus: this.getSupplierVerificationStatus(s),
        lifecycleState,
        allowedActions,
        metrics: {
          ordersCount: suppOrders.length,
          gmvIQD,
          offersCount: this.offers.filter((o) => o.supplierId === s.id).length,
          vansCount: this.drivers.filter((d) => d.supplierId === s.id).length
        }
      };
    }
    if (type === 'stores') {
      const st = raw as StoreProfile;
      const storeOrders = this.subOrders.filter((o) => o.storeId === st.id);
      const totalSpendIQD = storeOrders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (Number(o.subtotalIQD) || 0), 0);
      const usedCreditIQD = this.creditAccounts
        .filter((c) => c.storeId === st.id)
        .reduce((sum, c) => sum + (Number(c.currentUsedCreditIQD) || 0), 0);
      return {
        ...st,
        accountStatus: this.getStoreAccountStatus(st),
        verificationStatus: this.getStoreVerificationStatus(st),
        lifecycleState,
        allowedActions,
        metrics: {
          ordersCount: storeOrders.length,
          totalSpendIQD,
          usedCreditIQD,
          staffCount: this.storeStaff.filter((m) => m.storeId === st.id).length
        }
      };
    }
    if (type === 'drivers') {
      const d = raw as DriverProfile;
      const driverOrders = this.subOrders.filter((o) => o.assignedDriverId === d.id);
      const driverInv = this.vanInventory.filter((v) => v.driverId === d.id);
      return {
        ...d,
        accountStatus: this.getDriverAccountStatus(d),
        lifecycleState,
        allowedActions,
        metrics: {
          assignedOrdersCount: driverOrders.length,
          deliveredCount: driverOrders.filter((o) => o.status === 'delivered').length,
          vanRemainingUnits: driverInv.reduce((sum, i) => sum + (Number(i.remainingQuantity) || 0), 0),
          vanStockValueIQD: driverInv.reduce(
            (sum, i) => sum + (Number(i.remainingQuantity) || 0) * (Number(i.unitPriceIQD) || 0),
            0
          )
        }
      };
    }
    const staff = this.toPublicStaff(raw as StoreStaffAccount);
    return {
      ...staff,
      accountStatus: this.getStaffAccountStatus(raw as StoreStaffAccount),
      lifecycleState,
      allowedActions,
      metrics: {
        isActive: staff.isActive
      }
    };
  }

  listAdminAccounts(
    type: 'suppliers' | 'stores' | 'drivers' | 'staff',
    params?: {
      search?: string;
      statusTab?: string;
      accountStatus?: string;
      verificationStatus?: string;
      businessType?: string;
      city?: string;
      sortBy?: string;
      page?: number;
      pageSize?: number;
    }
  ) {
    const rawList: any[] =
      type === 'suppliers'
        ? this.suppliers
        : type === 'stores'
        ? this.stores
        : type === 'drivers'
        ? this.drivers
        : this.storeStaff;

    const enrichedAll = rawList.map((item) => this.enrichAccountListItem(type, item));

    const statusCounts = {
      all: enrichedAll.length,
      pending: enrichedAll.filter((i) => i.lifecycleState === 'pending').length,
      active: enrichedAll.filter((i) => i.lifecycleState === 'active').length,
      suspended: enrichedAll.filter((i) => i.lifecycleState === 'suspended').length,
      rejected_archived: enrichedAll.filter(
        (i) => i.lifecycleState === 'rejected' || i.lifecycleState === 'archived'
      ).length
    };

    const cities = Array.from(
      new Set(
        enrichedAll
          .map((i: any) => i.city)
          .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
      )
    ).sort();

    let filtered = [...enrichedAll];

    if (params?.statusTab && params.statusTab !== 'all') {
      if (params.statusTab === 'rejected_archived') {
        filtered = filtered.filter(
          (i) => i.lifecycleState === 'rejected' || i.lifecycleState === 'archived'
        );
      } else {
        filtered = filtered.filter((i) => i.lifecycleState === params.statusTab);
      }
    }

    if (params?.accountStatus && params.accountStatus !== 'all') {
      filtered = filtered.filter((i) => i.accountStatus === params.accountStatus);
    }

    if (params?.verificationStatus && params.verificationStatus !== 'all') {
      filtered = filtered.filter((i: any) => i.verificationStatus === params.verificationStatus);
    }

    if (params?.businessType && params.businessType !== 'all') {
      filtered = filtered.filter((i: any) => i.businessType === params.businessType);
    }

    if (params?.city && params.city !== 'all') {
      filtered = filtered.filter((i: any) => i.city === params.city);
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter((item: any) => {
        const hay = [
          item.id,
          item.companyName,
          item.contactPerson,
          item.name,
          item.ownerName,
          item.storeName,
          item.supplierName,
          item.phone,
          item.city,
          item.vehiclePlate,
          item.branchName
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }

    const sortBy = params?.sortBy || 'newest';
    filtered.sort((a: any, b: any) => {
      if (sortBy === 'name_asc') {
        const nameA = String(a.companyName || a.name || '');
        const nameB = String(b.companyName || b.name || '');
        return nameA.localeCompare(nameB, 'ar');
      }
      if (sortBy === 'metric_desc') {
        const valA = Number(
          a.metrics?.gmvIQD ??
            a.metrics?.totalSpendIQD ??
            a.metrics?.deliveredCount ??
            a.rating ??
            0
        );
        const valB = Number(
          b.metrics?.gmvIQD ??
            b.metrics?.totalSpendIQD ??
            b.metrics?.deliveredCount ??
            b.rating ??
            0
        );
        return valB - valA;
      }
      const timeA = Date.parse(a.createdAt || a.shiftStartTime || '1970-01-01');
      const timeB = Date.parse(b.createdAt || b.shiftStartTime || '1970-01-01');
      return (Number.isFinite(timeB) ? timeB : 0) - (Number.isFinite(timeA) ? timeA : 0);
    });

    const pageSize = Math.min(50, Math.max(1, Number(params?.pageSize) || 12));
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(totalPages, Math.max(1, Number(params?.page) || 1));
    const start = (page - 1) * pageSize;

    return {
      items: filtered.slice(start, start + pageSize),
      total,
      page,
      pageSize,
      totalPages,
      statusCounts,
      cities
    };
  }

  getAdminAccountDetail(type: 'suppliers' | 'stores' | 'drivers' | 'staff', id: string) {
    const resolved = this.resolveAccountRecord(type, id);
    if (!resolved) return null;

    const item = this.enrichAccountListItem(type, resolved.record);
    const kyc: AccountKycInfo = (resolved.record as any).kyc || {
      checklist: this.defaultKycChecklist()
    };
    const adminNotes: AdminInternalNote[] = (resolved.record as any).adminNotes || [];

    let recentOrders: SubOrder[] = [];
    let creditAccounts: Array<CreditAccount & { supplierName?: string }> = [];

    if (type === 'suppliers') {
      recentOrders = this.subOrders
        .filter((o) => o.supplierId === id)
        .slice(0, 10);
      creditAccounts = this.creditAccounts
        .filter((c) => c.supplierId === id)
        .map((c) => ({ ...c, supplierName: (resolved.record as SupplierProfile).companyName }));
    } else if (type === 'stores') {
      recentOrders = this.subOrders
        .filter((o) => o.storeId === id)
        .slice(0, 10);
      creditAccounts = this.creditAccounts
        .filter((c) => c.storeId === id)
        .map((c) => ({
          ...c,
          supplierName: this.suppliers.find((s) => s.id === c.supplierId)?.companyName || c.supplierId
        }));
    } else if (type === 'drivers') {
      recentOrders = this.subOrders
        .filter((o) => o.assignedDriverId === id)
        .slice(0, 10);
    } else {
      const staff = resolved.record as StoreStaffAccount;
      recentOrders = this.subOrders
        .filter((o) => o.storeId === staff.storeId)
        .slice(0, 10);
      creditAccounts = this.creditAccounts
        .filter((c) => c.storeId === staff.storeId)
        .map((c) => ({
          ...c,
          supplierName: this.suppliers.find((s) => s.id === c.supplierId)?.companyName || c.supplierId
        }));
    }

    const auditLogs = this.auditLogs
      .filter((l) => l.entityId === id && l.entityType === resolved.entityType)
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

    return {
      account: {
        ...item,
        kyc,
        adminNotes
      },
      recentOrders,
      creditAccounts,
      auditLogs
    };
  }

  transitionAdminAccountStatus(params: {
    type: 'suppliers' | 'stores' | 'drivers' | 'staff';
    id: string;
    action: 'approve' | 'reject' | 'suspend' | 'reactivate' | 'archive';
    reason: string;
    verificationStatus?: VerificationStatus;
    actor: { actorId: string; actorName: string };
  }) {
    const reason = (params.reason || '').trim();
    if (reason.length < 5) {
      throw new Error('يرجى إدخال سبب إداري واضح (5 أحرف على الأقل)');
    }

    const resolved = this.resolveAccountRecord(params.type, params.id);
    if (!resolved) {
      const err = new Error('الحساب المطلوب غير موجود');
      (err as any).statusCode = 404;
      throw err;
    }

    const allowed = this.getAllowedAdminAccountActions(params.type, resolved.record);
    if (!allowed.includes(params.action)) {
      throw new Error(
        `الانتقال (${params.action}) غير مسموح من الحالة الحالية (${this.getEffectiveLifecycleState(
          params.type,
          resolved.record
        )})`
      );
    }

    const nowIso = new Date().toISOString();
    const rec: any = resolved.record;

    const before: Record<string, any> = {
      accountStatus:
        params.type === 'suppliers'
          ? this.getSupplierAccountStatus(rec)
          : params.type === 'stores'
          ? this.getStoreAccountStatus(rec)
          : params.type === 'drivers'
          ? this.getDriverAccountStatus(rec)
          : this.getStaffAccountStatus(rec)
    };
    if (params.type === 'suppliers') {
      before.verificationStatus = this.getSupplierVerificationStatus(rec);
      before.isVerified = Boolean(rec.isVerified);
    } else if (params.type === 'stores') {
      before.verificationStatus = this.getStoreVerificationStatus(rec);
      before.isVerified = Boolean(rec.isVerified);
    } else if (params.type === 'staff') {
      before.isActive = Boolean(rec.isActive);
    }

    if (params.action === 'approve') {
      rec.accountStatus = 'active';
      if (params.type === 'suppliers') {
        const validRanks: VerificationStatus[] = [
          'verified',
          'verified_business',
          'authorized_distributor'
        ];
        const nextRank =
          params.verificationStatus && validRanks.includes(params.verificationStatus)
            ? params.verificationStatus
            : 'verified';
        rec.verificationStatus = nextRank;
        rec.isVerified = true;
      } else if (params.type === 'stores') {
        rec.verificationStatus = 'verified';
        rec.isVerified = true;
      } else if (params.type === 'staff') {
        rec.isActive = true;
      }
    } else if (params.action === 'reject') {
      rec.accountStatus = 'rejected';
      if (params.type === 'suppliers') {
        rec.isVerified = false;
      } else if (params.type === 'stores') {
        rec.isVerified = false;
      } else if (params.type === 'staff') {
        rec.isActive = false;
      }
    } else if (params.action === 'suspend') {
      rec.accountStatus = 'suspended';
      if (params.type === 'staff') {
        rec.isActive = false;
      }
    } else if (params.action === 'reactivate') {
      rec.accountStatus = 'active';
      if (params.type === 'staff') {
        rec.isActive = true;
      }
    } else if (params.action === 'archive') {
      rec.accountStatus = 'archived';
      if (params.type === 'staff') {
        rec.isActive = false;
      }
    }

    rec.statusReason = reason;
    rec.statusChangedAt = nowIso;
    rec.statusChangedBy = params.actor.actorId;

    const after: Record<string, any> = {
      accountStatus: rec.accountStatus
    };
    if (params.type === 'suppliers' || params.type === 'stores') {
      after.verificationStatus = rec.verificationStatus;
      after.isVerified = Boolean(rec.isVerified);
    } else if (params.type === 'staff') {
      after.isActive = Boolean(rec.isActive);
    }

    const actionVerbAr: Record<typeof params.action, string> = {
      approve: 'اعتماد وتوثيق',
      reject: 'رفض',
      suspend: 'إيقاف',
      reactivate: 'إعادة تفعيل',
      archive: 'أرشفة'
    };
    const actionVerbEn: Record<typeof params.action, string> = {
      approve: 'Approved & verified',
      reject: 'Rejected',
      suspend: 'Suspended',
      reactivate: 'Reactivated',
      archive: 'Archived'
    };

    this.recordAudit({
      at: nowIso,
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: `${resolved.entityType}.${params.action}`,
      entityType: resolved.entityType,
      entityId: params.id,
      summaryAr: `${actionVerbAr[params.action]} حساب ${resolved.displayName}`,
      summaryEn: `${actionVerbEn[params.action]} account ${resolved.displayName}`,
      before,
      after,
      reason
    });

    return this.getAdminAccountDetail(params.type, params.id);
  }

  updateAdminAccountDetails(params: {
    type: 'suppliers' | 'stores' | 'drivers' | 'staff';
    id: string;
    patch: Record<string, any>;
    actor: { actorId: string; actorName: string };
  }) {
    const resolved = this.resolveAccountRecord(params.type, params.id);
    if (!resolved) {
      const err = new Error('الحساب المطلوب غير موجود');
      (err as any).statusCode = 404;
      throw err;
    }

    const rec: any = resolved.record;
    const before: Record<string, any> = {};
    const after: Record<string, any> = {};

    const applyField = (field: string, val: any) => {
      if (val === undefined) return;
      before[field] = rec[field];
      rec[field] = typeof val === 'string' ? val.trim() : val;
      after[field] = rec[field];
    };

    applyField('phone', params.patch.phone);
    applyField('address', params.patch.address);
    applyField('city', params.patch.city);

    if (params.type === 'suppliers') {
      applyField('companyName', params.patch.companyName);
      applyField('contactPerson', params.patch.contactPerson);
      if (params.patch.businessType) {
        applyField('businessType', params.patch.businessType);
      }
      if (Array.isArray(params.patch.serviceZoneIds)) {
        before.serviceZoneIds = [...(rec.serviceZoneIds || [])];
        rec.serviceZoneIds = params.patch.serviceZoneIds.map((z: any) => String(z));
        after.serviceZoneIds = [...rec.serviceZoneIds];
      }
      if (
        params.patch.minOrderValueIQD !== undefined &&
        Number.isFinite(Number(params.patch.minOrderValueIQD))
      ) {
        before.minOrderValueIQD = rec.orderRules?.minOrderValueIQD ?? 0;
        rec.orderRules = {
          ...(rec.orderRules || {}),
          minOrderValueIQD: Math.max(0, Number(params.patch.minOrderValueIQD))
        };
        after.minOrderValueIQD = rec.orderRules.minOrderValueIQD;
      }
    } else if (params.type === 'stores') {
      applyField('name', params.patch.name);
      applyField('ownerName', params.patch.ownerName);
      applyField('district', params.patch.district);
      if (params.patch.storeType) {
        applyField('storeType', params.patch.storeType);
      }
    } else if (params.type === 'drivers') {
      applyField('name', params.patch.name);
      applyField('vehiclePlate', params.patch.vehiclePlate);
      applyField('vehicleModel', params.patch.vehicleModel);
      applyField('vanWarehouseName', params.patch.vanWarehouseName);
    } else if (params.type === 'staff') {
      applyField('name', params.patch.name);
      applyField('branchName', params.patch.branchName);
      if (params.patch.role === 'cashier' || params.patch.role === 'accountant') {
        applyField('role', params.patch.role);
      }
    }

    if (Object.keys(after).length > 0) {
      this.recordAudit({
        actorId: params.actor.actorId,
        actorName: params.actor.actorName,
        action: `${resolved.entityType}.update_details`,
        entityType: resolved.entityType,
        entityId: params.id,
        summaryAr: `تحديث البيانات الأساسية لحساب ${resolved.displayName}`,
        summaryEn: `Updated basic profile fields for ${resolved.displayName}`,
        before,
        after,
        reason: typeof params.patch.reason === 'string' && params.patch.reason.trim()
          ? params.patch.reason.trim()
          : 'تحديث إداري للبيانات الأساسية'
      });
    }

    return this.getAdminAccountDetail(params.type, params.id);
  }

  addAdminAccountNote(params: {
    type: 'suppliers' | 'stores' | 'drivers' | 'staff';
    id: string;
    text: string;
    actor: { actorId: string; actorName: string };
  }) {
    const text = (params.text || '').trim();
    if (text.length < 3) {
      throw new Error('يرجى كتابة نص الملاحظة (3 أحرف على الأقل)');
    }
    const resolved = this.resolveAccountRecord(params.type, params.id);
    if (!resolved) {
      const err = new Error('الحساب المطلوب غير موجود');
      (err as any).statusCode = 404;
      throw err;
    }

    const rec: any = resolved.record;
    if (!Array.isArray(rec.adminNotes)) {
      rec.adminNotes = [];
    }
    const note: AdminInternalNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      at: new Date().toISOString(),
      author: params.actor.actorName,
      text
    };
    rec.adminNotes.unshift(note);

    this.recordAudit({
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: `${resolved.entityType}.add_note`,
      entityType: resolved.entityType,
      entityId: params.id,
      summaryAr: `إضافة ملاحظة إدارية داخلية على حساب ${resolved.displayName}`,
      summaryEn: `Added internal admin note on ${resolved.displayName}`,
      before: null,
      after: { noteText: text },
      reason: text
    });

    return this.getAdminAccountDetail(params.type, params.id);
  }

  updateAdminAccountKyc(params: {
    type: 'suppliers' | 'stores' | 'drivers' | 'staff';
    id: string;
    licenseNo?: string;
    taxId?: string;
    checklist?: KycChecklistItem[];
    actor: { actorId: string; actorName: string };
  }) {
    const resolved = this.resolveAccountRecord(params.type, params.id);
    if (!resolved) {
      const err = new Error('الحساب المطلوب غير موجود');
      (err as any).statusCode = 404;
      throw err;
    }

    const rec: any = resolved.record;
    const prevKyc: AccountKycInfo = rec.kyc || { checklist: this.defaultKycChecklist() };
    const before = JSON.parse(JSON.stringify(prevKyc));

    const validKeys: KycChecklistKey[] = [
      'commercial_license',
      'owner_id',
      'address_proof',
      'phone_verified'
    ];
    const nextChecklist: KycChecklistItem[] = Array.isArray(params.checklist)
      ? params.checklist
          .filter((item) => validKeys.includes(item.key))
          .map((item) => ({
            key: item.key,
            status:
              item.status === 'approved' || item.status === 'rejected' ? item.status : 'pending',
            note: typeof item.note === 'string' && item.note.trim() ? item.note.trim() : undefined
          }))
      : prevKyc.checklist;

    const nextKyc: AccountKycInfo = {
      licenseNo:
        params.licenseNo !== undefined ? params.licenseNo.trim() || undefined : prevKyc.licenseNo,
      taxId: params.taxId !== undefined ? params.taxId.trim() || undefined : prevKyc.taxId,
      checklist: nextChecklist.length > 0 ? nextChecklist : this.defaultKycChecklist()
    };

    rec.kyc = nextKyc;

    this.recordAudit({
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: `${resolved.entityType}.update_kyc`,
      entityType: resolved.entityType,
      entityId: params.id,
      summaryAr: `تحديث قائمة التحقق والوثائق (KYC) لحساب ${resolved.displayName}`,
      summaryEn: `Updated KYC checklist for ${resolved.displayName}`,
      before,
      after: nextKyc,
      reason: 'مراجعة وتحديث وثائق التحقق والتوثيق'
    });

    return this.getAdminAccountDetail(params.type, params.id);
  }

  createAdminSupplier(params: {
    companyName: string;
    contactPerson: string;
    phone: string;
    city: string;
    address: string;
    businessType?: SellerBusinessType;
    verificationStatus?: VerificationStatus;
    serviceZoneIds?: string[];
    minOrderValueIQD?: number;
    licenseNo?: string;
    taxId?: string;
    reason?: string;
    actor: { actorId: string; actorName: string };
  }) {
    const companyName = (params.companyName || '').trim();
    const contactPerson = (params.contactPerson || '').trim();
    const phone = (params.phone || '').trim();
    const city = (params.city || '').trim();
    const address = (params.address || '').trim();

    if (companyName.length < 2 || contactPerson.length < 2 || phone.length < 6 || !city) {
      throw new Error('يرجى إدخال اسم الشركة واسم المسؤول ورقم الهاتف والمدينة بشكل صحيح');
    }

    const verStatus: VerificationStatus = params.verificationStatus || 'pending';
    const isVerified = verStatus !== 'pending';
    const id = `supp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const created: SupplierProfile = {
      id,
      companyName,
      contactPerson,
      phone,
      city,
      address: address || city,
      categories: ['مواد غذائية أساسية'],
      rating: 0,
      totalVans: 0,
      activeCreditLinesCount: 0,
      isVerified,
      businessType: params.businessType || 'wholesaler',
      verificationStatus: verStatus,
      accountStatus: 'active',
      kyc: {
        licenseNo: params.licenseNo?.trim() || undefined,
        taxId: params.taxId?.trim() || undefined,
        checklist: isVerified
          ? [
              { key: 'commercial_license', status: 'approved' },
              { key: 'owner_id', status: 'approved' },
              { key: 'address_proof', status: 'approved' },
              { key: 'phone_verified', status: 'approved' }
            ]
          : this.defaultKycChecklist()
      },
      serviceZoneIds:
        Array.isArray(params.serviceZoneIds) && params.serviceZoneIds.length > 0
          ? params.serviceZoneIds
          : ['zone_baghdad_karkh', 'zone_baghdad_rusafa'],
      orderRules: {
        minOrderValueIQD: Math.max(0, Number(params.minOrderValueIQD) || 100000)
      },
      createdAt: new Date().toISOString().slice(0, 10)
    };

    this.suppliers.unshift(created);

    this.recordAudit({
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'supplier.create',
      entityType: 'supplier',
      entityId: id,
      summaryAr: `إنشاء حساب مورد جديد يدوياً: ${companyName}`,
      summaryEn: `Manually created supplier account: ${companyName}`,
      before: null,
      after: {
        id,
        companyName,
        accountStatus: created.accountStatus,
        verificationStatus: created.verificationStatus
      },
      reason: (params.reason || '').trim() || 'تسجيل مورد جديد من لوحة الإدارة'
    });

    return this.getAdminAccountDetail('suppliers', id);
  }

  createAdminStore(params: {
    name: string;
    ownerName: string;
    phone: string;
    city: string;
    district?: string;
    address?: string;
    storeType?: 'supermarket' | 'grocery' | 'wholesale_sub';
    verificationStatus?: 'pending' | 'verified';
    licenseNo?: string;
    taxId?: string;
    reason?: string;
    actor: { actorId: string; actorName: string };
  }) {
    const name = (params.name || '').trim();
    const ownerName = (params.ownerName || '').trim();
    const phone = (params.phone || '').trim();
    const city = (params.city || '').trim();

    if (name.length < 2 || ownerName.length < 2 || phone.length < 6 || !city) {
      throw new Error('يرجى إدخال اسم المتجر واسم المالك ورقم الهاتف والمدينة بشكل صحيح');
    }

    const verStatus: 'pending' | 'verified' =
      params.verificationStatus === 'verified' ? 'verified' : 'pending';
    const id = `store_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const slugBase = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'store';

    const created: StoreProfile = {
      id,
      name,
      ownerName,
      phone,
      city,
      district: (params.district || '').trim() || city,
      address: (params.address || '').trim() || city,
      storeType: params.storeType || 'grocery',
      walletBalanceIQD: 0,
      isVerified: verStatus === 'verified',
      verificationStatus: verStatus,
      accountStatus: 'active',
      kyc: {
        licenseNo: params.licenseNo?.trim() || undefined,
        taxId: params.taxId?.trim() || undefined,
        checklist:
          verStatus === 'verified'
            ? [
                { key: 'commercial_license', status: 'approved' },
                { key: 'owner_id', status: 'approved' },
                { key: 'address_proof', status: 'approved' },
                { key: 'phone_verified', status: 'approved' }
              ]
            : this.defaultKycChecklist()
      },
      customDomainSlug: `${slugBase}-${id.slice(-4)}`,
      qrScanCount: 0,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    this.stores.unshift(created);

    this.recordAudit({
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'store.create',
      entityType: 'store',
      entityId: id,
      summaryAr: `إنشاء حساب متجر تجزئة يدوياً: ${name}`,
      summaryEn: `Manually created retail store account: ${name}`,
      before: null,
      after: {
        id,
        name,
        accountStatus: created.accountStatus,
        verificationStatus: created.verificationStatus
      },
      reason: (params.reason || '').trim() || 'تسجيل متجر جديد من لوحة الإدارة'
    });

    return this.getAdminAccountDetail('stores', id);
  }

  // ================= ADMIN PHASE 3: CATALOG MANAGEMENT =================
  private validateSafeMediaUrl(url: unknown, fieldLabelAr: string): string | undefined {
    if (url === undefined || url === null) return undefined;
    const trimmed = String(url).trim();
    if (!trimmed) return '';
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('/assets/') ||
      trimmed.startsWith('/')
    ) {
      if (trimmed.startsWith('//')) {
        throw new Error(`رابط ${fieldLabelAr} غير صالح`);
      }
      return trimmed;
    }
    throw new Error(`رابط ${fieldLabelAr} غير صالح (يُسمح فقط بروابط http/https أو مسارات /assets/)`);
  }

  private buildGlobalOfferAnomalyMap() {
    const byBarcode = new Map<string, SupplierOffer[]>();
    for (const o of this.offers) {
      const list = byBarcode.get(o.barcode) || [];
      list.push(o);
      byBarcode.set(o.barcode, list);
    }
    const merged = new Map<
      string,
      { isPriceAnomaly: boolean; medianPriceIQD: number | null; deviationPercent: number | null }
    >();
    for (const [, list] of byBarcode.entries()) {
      const m = computeOfferPriceAnomalyMap(list);
      for (const [id, info] of m.entries()) {
        merged.set(id, info);
      }
    }
    return merged;
  }

  private enrichAdminProductSummary(p: UnifiedProduct) {
    const allOffers = this.offers.filter((o) => o.barcode === p.barcode);
    const activeOffers = allOffers.filter((o) => this.getOfferStatus(o) === 'active');
    const quality = computeProductQuality(p, allOffers);
    const activeMinPrice =
      activeOffers.length > 0 ? Math.min(...activeOffers.map((o) => o.priceIQD)) : 0;
    const totalStock = activeOffers.reduce((sum, o) => sum + (Number(o.availableStock) || 0), 0);

    return {
      ...p,
      status: this.getProductStatus(p),
      qualityScore: quality.score,
      missingFieldsCount: quality.missingFields.length,
      missingFields: quality.missingFields,
      offersCount: allOffers.length,
      activeOffersCount: activeOffers.length,
      minPriceIQD: activeMinPrice,
      totalAvailableStock: totalStock
    };
  }

  listAdminProducts(params?: {
    search?: string;
    category?: string;
    brandId?: string;
    status?: string;
    maxQuality?: number;
    hasOffers?: string;
    suppliersFilter?: string;
    sortBy?: string;
    page?: number;
    pageSize?: number;
  }) {
    const enrichedAll = this.products.map((p) => this.enrichAdminProductSummary(p));

    const counts = {
      all: enrichedAll.length,
      active: enrichedAll.filter((p) => p.status === 'active').length,
      hidden: enrichedAll.filter((p) => p.status === 'hidden').length,
      archived: enrichedAll.filter((p) => p.status === 'archived').length,
      withoutOffers: enrichedAll.filter((p) => p.activeOffersCount === 0).length,
      lowQuality: enrichedAll.filter((p) => p.qualityScore < 60).length
    };

    let filtered = [...enrichedAll];

    if (params?.status && params.status !== 'all') {
      filtered = filtered.filter((p) => p.status === params.status);
    }
    if (params?.category && params.category !== 'all') {
      const resolved = resolveSharedCategoryKey(params.category);
      filtered = filtered.filter(
        (p) => p.category === params.category || resolveSharedCategoryKey(p.category) === resolved
      );
    }
    if (params?.brandId && params.brandId !== 'all') {
      filtered = filtered.filter((p) => p.brandId === params.brandId);
    }
    if (params?.maxQuality !== undefined && Number.isFinite(Number(params.maxQuality))) {
      const cap = Number(params.maxQuality);
      filtered = filtered.filter((p) => p.qualityScore <= cap);
    }
    if (params?.hasOffers === 'with') {
      filtered = filtered.filter((p) => p.activeOffersCount > 0);
    } else if (params?.hasOffers === 'without') {
      filtered = filtered.filter((p) => p.activeOffersCount === 0);
    }
    if (params?.suppliersFilter === '0') {
      filtered = filtered.filter((p) => p.activeOffersCount === 0);
    } else if (params?.suppliersFilter === '1') {
      filtered = filtered.filter((p) => p.activeOffersCount === 1);
    } else if (params?.suppliersFilter === '2+') {
      filtered = filtered.filter((p) => p.activeOffersCount >= 2);
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const hay = [
          p.barcode,
          p.nameAr,
          p.nameEn,
          p.brand,
          p.category,
          p.subCategory,
          p.countryOfOrigin
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }

    const sortBy = params?.sortBy || 'quality_asc';
    filtered.sort((a, b) => {
      if (sortBy === 'quality_asc') {
        return a.qualityScore - b.qualityScore || a.nameAr.localeCompare(b.nameAr, 'ar');
      }
      if (sortBy === 'quality_desc') {
        return b.qualityScore - a.qualityScore || a.nameAr.localeCompare(b.nameAr, 'ar');
      }
      if (sortBy === 'offers_desc') {
        return b.activeOffersCount - a.activeOffersCount;
      }
      if (sortBy === 'name_asc') {
        return a.nameAr.localeCompare(b.nameAr, 'ar');
      }
      const timeA = Date.parse(a.createdAt || '2026-01-01');
      const timeB = Date.parse(b.createdAt || '2026-01-01');
      return (Number.isFinite(timeB) ? timeB : 0) - (Number.isFinite(timeA) ? timeA : 0);
    });

    const pageSize = Math.min(50, Math.max(1, Number(params?.pageSize) || 15));
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(totalPages, Math.max(1, Number(params?.page) || 1));
    const start = (page - 1) * pageSize;

    const categories = SHARED_CATEGORY_TREE.map((d) => ({
      categoryKey: d.categoryKey,
      labelAr: d.labelAr,
      labelEn: d.labelEn
    }));

    return {
      items: filtered.slice(start, start + pageSize),
      total,
      page,
      pageSize,
      totalPages,
      counts,
      categories,
      brands: this.brands.map((b) => ({
        id: b.id,
        nameAr: b.nameAr,
        nameEn: b.nameEn,
        status: this.getBrandStatus(b)
      }))
    };
  }

  getAdminProductDetail(barcode: string) {
    const product = this.products.find((p) => p.barcode === barcode);
    if (!product) return null;

    const productOffers = this.offers
      .filter((o) => o.barcode === barcode)
      .sort((a, b) => a.priceIQD - b.priceIQD);
    const anomalyMap = computeOfferPriceAnomalyMap(productOffers);
    const minActivePrice = (() => {
      const active = productOffers.filter((o) => this.getOfferStatus(o) === 'active');
      return active.length > 0 ? Math.min(...active.map((o) => o.priceIQD)) : null;
    })();

    const enrichedOffers = productOffers.map((o) => {
      const anom = anomalyMap.get(o.id) || {
        isPriceAnomaly: false,
        medianPriceIQD: null,
        deviationPercent: null
      };
      return {
        ...o,
        status: this.getOfferStatus(o),
        isLowestPrice: minActivePrice !== null && this.getOfferStatus(o) === 'active' && o.priceIQD === minActivePrice,
        ...anom
      };
    });

    const quality = computeProductQuality(product, productOffers);
    const auditLogs = this.auditLogs
      .filter(
        (l) =>
          (l.entityType === 'catalog_product' && l.entityId === barcode) ||
          (l.entityType === 'catalog_offer' &&
            productOffers.some((o) => o.id === l.entityId))
      )
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

    return {
      product: {
        ...product,
        status: this.getProductStatus(product),
        adminNotes: product.adminNotes || []
      },
      offers: enrichedOffers,
      quality,
      auditLogs
    };
  }

  createAdminProduct(params: {
    barcode: string;
    nameAr: string;
    nameEn?: string;
    brand?: string;
    brandId?: string;
    category: string;
    subCategory?: string;
    unit: string;
    packSize?: string;
    packageQuantity?: number;
    imageUrl?: string;
    descriptionAr?: string;
    isPerishable?: boolean;
    storageType?: 'ambient' | 'chilled' | 'frozen' | 'dry' | 'controlled';
    countryOfOrigin?: string;
    actor: { actorId: string; actorName: string };
  }) {
    const check = validateBarcode(params.barcode);
    if (!check.valid) {
      throw new Error(check.errorAr || 'الباركود غير صالح');
    }
    if (this.products.some((p) => p.barcode === check.normalized)) {
      throw new Error(`الباركود (${check.normalized}) مسجل مسبقاً في الكتالوج`);
    }

    const nameAr = (params.nameAr || '').trim();
    const category = resolveSharedCategoryKey((params.category || '').trim());
    const unit = (params.unit || '').trim();
    if (nameAr.length < 2 || !category || category === 'الكل' || !unit) {
      throw new Error('يرجى إدخال الاسم العربي والقسم الرئيسي والوحدة بشكل صحيح');
    }

    let brandId = params.brandId?.trim() || undefined;
    let brandName = (params.brand || '').trim();
    if (brandId) {
      const matchedBrand = this.brands.find((b) => b.id === brandId);
      if (!matchedBrand) {
        throw new Error('العلامة التجارية المختارة غير موجودة');
      }
      brandName = brandName || matchedBrand.nameAr;
    } else if (brandName) {
      const lower = brandName.toLowerCase();
      let matched = this.brands.find(
        (b) => b.nameAr.toLowerCase() === lower || b.nameEn.toLowerCase() === lower
      );
      if (!matched) {
        const cleanSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        matched = {
          id: cleanSlug ? `brand_${cleanSlug}_${Date.now().toString().slice(-4)}` : `brand_${Date.now()}`,
          nameAr: brandName,
          nameEn: brandName,
          status: 'active',
          createdAt: new Date().toISOString().slice(0, 10)
        };
        this.brands.unshift(matched);
      }
      brandId = matched.id;
      brandName = matched.nameAr;
    } else {
      throw new Error('يرجى تحديد العلامة التجارية للمنتج');
    }

    const safeImageUrl = this.validateSafeMediaUrl(params.imageUrl, 'صورة المنتج');
    const nowIso = new Date().toISOString();

    const created: UnifiedProduct = {
      barcode: check.normalized,
      nameAr,
      nameEn: params.nameEn?.trim() || undefined,
      brand: brandName,
      brandId,
      category,
      subCategory: params.subCategory?.trim() || undefined,
      unit,
      packSize: params.packSize?.trim() || undefined,
      packageQuantity: Math.max(1, Number(params.packageQuantity) || 1),
      imageUrl: safeImageUrl || undefined,
      images: safeImageUrl ? [safeImageUrl] : undefined,
      descriptionAr: params.descriptionAr?.trim() || undefined,
      isPerishable: Boolean(params.isPerishable),
      storageType: params.storageType || undefined,
      countryOfOrigin: params.countryOfOrigin?.trim() || undefined,
      standardBarcodeFormat: check.format || 'EAN-13',
      status: 'active',
      statusChangedAt: nowIso,
      statusChangedBy: params.actor.actorId,
      createdAt: nowIso
    };

    this.products.unshift(created);

    this.recordAudit({
      at: nowIso,
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'catalog.product.create',
      entityType: 'catalog_product',
      entityId: created.barcode,
      summaryAr: `إضافة منتج موحّد جديد (${created.nameAr}) بالباركود ${created.barcode}`,
      summaryEn: `Created unified catalog product (${created.nameEn || created.nameAr}) [${created.barcode}]`,
      before: null,
      after: {
        barcode: created.barcode,
        nameAr: created.nameAr,
        brandId: created.brandId,
        category: created.category,
        status: created.status
      },
      reason: 'إدراج صنف موحّد جديد في كتالوج المنصة'
    });

    return this.getAdminProductDetail(created.barcode);
  }

  updateAdminProduct(params: {
    barcode: string;
    patch: Record<string, any>;
    actor: { actorId: string; actorName: string };
  }) {
    const product = this.products.find((p) => p.barcode === params.barcode);
    if (!product) {
      const err = new Error('المنتج غير موجود في الكتالوج');
      (err as any).statusCode = 404;
      throw err;
    }

    const before: Record<string, any> = {};
    const after: Record<string, any> = {};

    const applyOptionalStr = (field: keyof UnifiedProduct, rawVal: unknown) => {
      if (rawVal === undefined) return;
      const normalized = rawVal === null ? undefined : String(rawVal).trim() || undefined;
      if ((product[field] as any) !== normalized) {
        before[field] = product[field] ?? null;
        (product as any)[field] = normalized;
        after[field] = normalized ?? null;
      }
    };

    if (params.patch.nameAr !== undefined) {
      const v = String(params.patch.nameAr || '').trim();
      if (v.length < 2) {
        throw new Error('الاسم العربي للمنتج لا يجب أن يقل عن حرفين');
      }
      if (product.nameAr !== v) {
        before.nameAr = product.nameAr;
        product.nameAr = v;
        after.nameAr = v;
      }
    }

    applyOptionalStr('nameEn', params.patch.nameEn);
    applyOptionalStr('subCategory', params.patch.subCategory);
    applyOptionalStr('packSize', params.patch.packSize);
    applyOptionalStr('countryOfOrigin', params.patch.countryOfOrigin);
    applyOptionalStr('descriptionAr', params.patch.descriptionAr);

    if (params.patch.category !== undefined) {
      const c = resolveSharedCategoryKey(String(params.patch.category || '').trim());
      if (!c || c === 'الكل') {
        throw new Error('القسم الرئيسي غير صالح');
      }
      if (product.category !== c) {
        before.category = product.category;
        product.category = c;
        after.category = c;
      }
    }

    if (params.patch.unit !== undefined) {
      const u = String(params.patch.unit || '').trim();
      if (!u) throw new Error('الوحدة مطلوبة');
      if (product.unit !== u) {
        before.unit = product.unit;
        product.unit = u;
        after.unit = u;
      }
    }

    if (params.patch.packageQuantity !== undefined && Number.isFinite(Number(params.patch.packageQuantity))) {
      const q = Math.max(1, Math.round(Number(params.patch.packageQuantity)));
      if (product.packageQuantity !== q) {
        before.packageQuantity = product.packageQuantity;
        product.packageQuantity = q;
        after.packageQuantity = q;
      }
    }

    if (params.patch.storageType !== undefined) {
      const allowedStorage = ['ambient', 'chilled', 'frozen', 'dry', 'controlled'];
      const rawSt = params.patch.storageType === null ? '' : String(params.patch.storageType).trim();
      if (!rawSt) {
        if (product.storageType !== undefined) {
          before.storageType = product.storageType;
          product.storageType = undefined;
          after.storageType = null;
        }
      } else if (allowedStorage.includes(rawSt)) {
        if (product.storageType !== rawSt) {
          before.storageType = product.storageType ?? null;
          product.storageType = rawSt as any;
          after.storageType = rawSt;
        }
      } else {
        throw new Error('نوع التخزين غير صالح');
      }
    }

    if (params.patch.isPerishable !== undefined) {
      const nextPerish = Boolean(params.patch.isPerishable);
      if (product.isPerishable !== nextPerish) {
        before.isPerishable = product.isPerishable;
        product.isPerishable = nextPerish;
        after.isPerishable = nextPerish;
      }
    }

    if (params.patch.brandId !== undefined) {
      const bid = String(params.patch.brandId || '').trim();
      const matched = this.brands.find((b) => b.id === bid);
      if (!matched) {
        throw new Error('العلامة التجارية المختارة غير موجودة');
      }
      if (product.brandId !== matched.id || product.brand !== matched.nameAr) {
        before.brandId = product.brandId ?? null;
        before.brand = product.brand;
        product.brandId = matched.id;
        product.brand = matched.nameAr;
        after.brandId = matched.id;
        after.brand = matched.nameAr;
      }
    } else if (params.patch.brand !== undefined) {
      const bName = String(params.patch.brand || '').trim();
      if (bName && bName !== product.brand) {
        before.brand = product.brand;
        product.brand = bName;
        after.brand = bName;
      }
    }

    if (params.patch.imageUrl !== undefined) {
      const validated = this.validateSafeMediaUrl(params.patch.imageUrl, 'صورة المنتج');
      const nextImg = validated || undefined;
      if ((product.imageUrl ?? undefined) !== nextImg) {
        before.imageUrl = product.imageUrl ?? null;
        product.imageUrl = nextImg;
        if (!nextImg) {
          before.images = product.images ?? null;
          product.images = undefined;
          after.images = null;
        } else {
          product.images = [nextImg, ...((product.images || []).filter((i) => i !== nextImg))];
        }
        after.imageUrl = nextImg ?? null;
      }
    }

    if (Object.keys(after).length > 0) {
      this.recordAudit({
        actorId: params.actor.actorId,
        actorName: params.actor.actorName,
        action: 'catalog.product.update',
        entityType: 'catalog_product',
        entityId: product.barcode,
        summaryAr: `تحديث بيانات المنتج (${product.nameAr})`,
        summaryEn: `Updated catalog product metadata (${product.nameEn || product.nameAr})`,
        before,
        after,
        reason:
          typeof params.patch.reason === 'string' && params.patch.reason.trim()
            ? params.patch.reason.trim()
            : 'تحديث بيانات المنتج في الكتالوج'
      });
    }

    return this.getAdminProductDetail(product.barcode);
  }

  transitionAdminProductStatus(params: {
    barcode: string;
    action: 'hide' | 'restore' | 'archive';
    reason: string;
    actor: { actorId: string; actorName: string };
  }) {
    const reason = (params.reason || '').trim();
    if (reason.length < 5) {
      throw new Error('يرجى إدخال سبب إداري واضح لا يقل عن 5 أحرف');
    }

    const product = this.products.find((p) => p.barcode === params.barcode);
    if (!product) {
      const err = new Error('المنتج غير موجود في الكتالوج');
      (err as any).statusCode = 404;
      throw err;
    }

    const beforeStatus = this.getProductStatus(product);
    const nextStatus: CatalogProductStatus =
      params.action === 'hide' ? 'hidden' : params.action === 'archive' ? 'archived' : 'active';

    if (beforeStatus === nextStatus) {
      throw new Error(`المنتج في حالة (${nextStatus}) بالفعل`);
    }

    const nowIso = new Date().toISOString();
    product.status = nextStatus;
    product.statusReason = reason;
    product.statusChangedAt = nowIso;
    product.statusChangedBy = params.actor.actorId;

    const verbAr: Record<typeof params.action, string> = {
      hide: 'إخفاء المنتج عن السوق',
      restore: 'إعادة تفعيل وإظهار المنتج',
      archive: 'أرشفة المنتج'
    };
    const verbEn: Record<typeof params.action, string> = {
      hide: 'Hid catalog product from marketplace',
      restore: 'Restored catalog product',
      archive: 'Archived catalog product'
    };

    this.recordAudit({
      at: nowIso,
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: `catalog.product.${params.action}`,
      entityType: 'catalog_product',
      entityId: product.barcode,
      summaryAr: `${verbAr[params.action]}: ${product.nameAr}`,
      summaryEn: `${verbEn[params.action]}: ${product.nameEn || product.nameAr}`,
      before: { status: beforeStatus },
      after: { status: nextStatus },
      reason
    });

    return this.getAdminProductDetail(product.barcode);
  }

  addAdminProductNote(params: {
    barcode: string;
    text: string;
    actor: { actorId: string; actorName: string };
  }) {
    const text = (params.text || '').trim();
    if (text.length < 3) {
      throw new Error('يرجى كتابة نص الملاحظة (3 أحرف على الأقل)');
    }
    const product = this.products.find((p) => p.barcode === params.barcode);
    if (!product) {
      const err = new Error('المنتج غير موجود في الكتالوج');
      (err as any).statusCode = 404;
      throw err;
    }

    if (!Array.isArray(product.adminNotes)) {
      product.adminNotes = [];
    }
    const note: AdminInternalNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      at: new Date().toISOString(),
      author: params.actor.actorName,
      text
    };
    product.adminNotes.unshift(note);

    this.recordAudit({
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'catalog.product.add_note',
      entityType: 'catalog_product',
      entityId: product.barcode,
      summaryAr: `إضافة ملاحظة إدارية على المنتج (${product.nameAr})`,
      summaryEn: `Added admin note on product (${product.nameEn || product.nameAr})`,
      before: null,
      after: { noteText: text },
      reason: text
    });

    return this.getAdminProductDetail(product.barcode);
  }

  listAdminBrands(params?: { search?: string; status?: string }) {
    const enriched = this.brands.map((b) => {
      const linked = this.products.filter((p) => p.brandId === b.id);
      const activeLinked = linked.filter((p) => this.isProductOperable(p));
      return {
        ...b,
        status: this.getBrandStatus(b),
        productsCount: linked.length,
        activeProductsCount: activeLinked.length
      };
    });

    const counts = {
      all: enriched.length,
      active: enriched.filter((b) => b.status === 'active').length,
      hidden: enriched.filter((b) => b.status === 'hidden').length
    };

    let filtered = [...enriched];
    if (params?.status && params.status !== 'all') {
      filtered = filtered.filter((b) => b.status === params.status);
    }
    if (params?.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.nameAr.toLowerCase().includes(q) ||
          b.nameEn.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => b.productsCount - a.productsCount || a.nameAr.localeCompare(b.nameAr, 'ar'));

    return { items: filtered, counts };
  }

  createAdminBrand(params: {
    nameAr: string;
    nameEn?: string;
    logoUrl?: string;
    actor: { actorId: string; actorName: string };
  }) {
    const nameAr = (params.nameAr || '').trim();
    const nameEn = (params.nameEn || '').trim() || nameAr;
    if (nameAr.length < 2) {
      throw new Error('يرجى إدخال اسم العلامة التجارية بالعربية (حرفان على الأقل)');
    }

    const dup = this.brands.find(
      (b) =>
        b.nameAr.trim().toLowerCase() === nameAr.toLowerCase() ||
        b.nameEn.trim().toLowerCase() === nameEn.toLowerCase()
    );
    if (dup) {
      throw new Error(`العلامة التجارية (${dup.nameAr}) مسجلة مسبقاً`);
    }

    const safeLogoUrl = this.validateSafeMediaUrl(params.logoUrl, 'شعار العلامة');
    const cleanSlug = nameEn
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    const id = cleanSlug ? `brand_${cleanSlug}_${Date.now().toString().slice(-4)}` : `brand_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const created: Brand = {
      id,
      nameAr,
      nameEn,
      logoUrl: safeLogoUrl || undefined,
      status: 'active',
      statusChangedAt: nowIso,
      statusChangedBy: params.actor.actorId,
      createdAt: nowIso
    };
    this.brands.unshift(created);

    this.recordAudit({
      at: nowIso,
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'catalog.brand.create',
      entityType: 'catalog_brand',
      entityId: created.id,
      summaryAr: `إضافة علامة تجارية جديدة: ${created.nameAr}`,
      summaryEn: `Created brand: ${created.nameEn}`,
      before: null,
      after: { id: created.id, nameAr: created.nameAr, nameEn: created.nameEn, status: created.status },
      reason: 'إضافة علامة تجارية موثقة في الكتالوج'
    });

    return {
      ...created,
      status: this.getBrandStatus(created),
      productsCount: 0,
      activeProductsCount: 0
    };
  }

  updateAdminBrand(params: {
    id: string;
    nameAr?: string;
    nameEn?: string;
    logoUrl?: string;
    reason?: string;
    actor: { actorId: string; actorName: string };
  }) {
    const brand = this.brands.find((b) => b.id === params.id);
    if (!brand) {
      const err = new Error('العلامة التجارية غير موجودة');
      (err as any).statusCode = 404;
      throw err;
    }

    const before: Record<string, any> = {};
    const after: Record<string, any> = {};

    const nextAr = params.nameAr !== undefined ? String(params.nameAr || '').trim() : brand.nameAr;
    const nextEn = params.nameEn !== undefined ? String(params.nameEn || '').trim() : brand.nameEn;

    if (nextAr.length < 2) {
      throw new Error('اسم العلامة التجارية بالعربية يجب أن لا يقل عن حرفين');
    }

    const dup = this.brands.find(
      (b) =>
        b.id !== brand.id &&
        (b.nameAr.trim().toLowerCase() === nextAr.toLowerCase() ||
          (nextEn && b.nameEn.trim().toLowerCase() === nextEn.toLowerCase()))
    );
    if (dup) {
      throw new Error(`الاسم يتعارض مع علامة أخرى مسجلة (${dup.nameAr})`);
    }

    if (brand.nameAr !== nextAr) {
      before.nameAr = brand.nameAr;
      brand.nameAr = nextAr;
      after.nameAr = nextAr;
      for (const p of this.products) {
        if (p.brandId === brand.id) {
          p.brand = nextAr;
        }
      }
    }
    if (brand.nameEn !== (nextEn || nextAr)) {
      before.nameEn = brand.nameEn;
      brand.nameEn = nextEn || nextAr;
      after.nameEn = brand.nameEn;
    }
    if (params.logoUrl !== undefined) {
      const validated = this.validateSafeMediaUrl(params.logoUrl, 'شعار العلامة');
      const nextLogo = validated || undefined;
      if ((brand.logoUrl ?? undefined) !== nextLogo) {
        before.logoUrl = brand.logoUrl ?? null;
        brand.logoUrl = nextLogo;
        after.logoUrl = nextLogo ?? null;
      }
    }

    if (Object.keys(after).length > 0) {
      this.recordAudit({
        actorId: params.actor.actorId,
        actorName: params.actor.actorName,
        action: 'catalog.brand.update',
        entityType: 'catalog_brand',
        entityId: brand.id,
        summaryAr: `تعديل بيانات العلامة التجارية (${brand.nameAr})`,
        summaryEn: `Updated brand (${brand.nameEn})`,
        before,
        after,
        reason: (params.reason || '').trim() || 'تحديث بيانات العلامة التجارية'
      });
    }

    const linked = this.products.filter((p) => p.brandId === brand.id);
    return {
      ...brand,
      status: this.getBrandStatus(brand),
      productsCount: linked.length,
      activeProductsCount: linked.filter((p) => this.isProductOperable(p)).length
    };
  }

  transitionAdminBrandStatus(params: {
    id: string;
    action: 'hide' | 'restore';
    reason: string;
    actor: { actorId: string; actorName: string };
  }) {
    const reason = (params.reason || '').trim();
    if (reason.length < 5) {
      throw new Error('يرجى إدخال سبب إداري واضح لا يقل عن 5 أحرف');
    }
    const brand = this.brands.find((b) => b.id === params.id);
    if (!brand) {
      const err = new Error('العلامة التجارية غير موجودة');
      (err as any).statusCode = 404;
      throw err;
    }

    const beforeStatus = this.getBrandStatus(brand);
    const nextStatus: CatalogBrandStatus = params.action === 'hide' ? 'hidden' : 'active';
    if (beforeStatus === nextStatus) {
      throw new Error(`العلامة في حالة (${nextStatus}) بالفعل`);
    }

    const nowIso = new Date().toISOString();
    brand.status = nextStatus;
    brand.statusReason = reason;
    brand.statusChangedAt = nowIso;
    brand.statusChangedBy = params.actor.actorId;

    this.recordAudit({
      at: nowIso,
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: `catalog.brand.${params.action}`,
      entityType: 'catalog_brand',
      entityId: brand.id,
      summaryAr: `${params.action === 'hide' ? 'إخفاء' : 'إعادة إظهار'} العلامة التجارية: ${brand.nameAr}`,
      summaryEn: `${params.action === 'hide' ? 'Hid' : 'Restored'} brand: ${brand.nameEn}`,
      before: { status: beforeStatus },
      after: { status: nextStatus },
      reason
    });

    const linked = this.products.filter((p) => p.brandId === brand.id);
    return {
      ...brand,
      status: this.getBrandStatus(brand),
      productsCount: linked.length,
      activeProductsCount: linked.filter((p) => this.isProductOperable(p)).length
    };
  }

  listAdminOffers(params?: {
    search?: string;
    supplierId?: string;
    barcode?: string;
    status?: string;
    lowStock?: boolean;
    anomalyOnly?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const productByBarcode = new Map<string, UnifiedProduct>();
    for (const p of this.products) productByBarcode.set(p.barcode, p);

    const anomalyMap = this.buildGlobalOfferAnomalyMap();

    const enrichedAll = this.offers.map((o) => {
      const prod = productByBarcode.get(o.barcode);
      const anom = anomalyMap.get(o.id) || {
        isPriceAnomaly: false,
        medianPriceIQD: null,
        deviationPercent: null
      };
      return {
        ...o,
        status: this.getOfferStatus(o),
        productNameAr: prod?.nameAr || o.barcode,
        productNameEn: prod?.nameEn || prod?.nameAr || o.barcode,
        productUnit: prod?.unit || '',
        productCategory: prod?.category || '',
        productStatus: prod ? this.getProductStatus(prod) : 'active',
        isLowStock: Number(o.availableStock) <= 20,
        ...anom
      };
    });

    const counts = {
      all: enrichedAll.length,
      active: enrichedAll.filter((o) => o.status === 'active').length,
      suspended: enrichedAll.filter((o) => o.status === 'suspended').length,
      lowStock: enrichedAll.filter((o) => o.isLowStock).length,
      anomaly: enrichedAll.filter((o) => o.isPriceAnomaly).length
    };

    let filtered = [...enrichedAll];
    if (params?.status && params.status !== 'all') {
      filtered = filtered.filter((o) => o.status === params.status);
    }
    if (params?.supplierId && params.supplierId !== 'all') {
      filtered = filtered.filter((o) => o.supplierId === params.supplierId);
    }
    if (params?.barcode) {
      filtered = filtered.filter((o) => o.barcode === params.barcode);
    }
    if (params?.lowStock) {
      filtered = filtered.filter((o) => o.isLowStock);
    }
    if (params?.anomalyOnly) {
      filtered = filtered.filter((o) => o.isPriceAnomaly);
    }
    if (params?.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter((o) => {
        const hay = [
          o.id,
          o.barcode,
          o.productNameAr,
          o.productNameEn,
          o.supplierName,
          o.supplierCity
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }

    // Surface anomalous & suspended items early, then sort by price deviation / stock
    filtered.sort((a, b) => {
      if (a.isPriceAnomaly !== b.isPriceAnomaly) return a.isPriceAnomaly ? -1 : 1;
      if (a.status !== b.status) return a.status === 'suspended' ? -1 : 1;
      return a.availableStock - b.availableStock;
    });

    const pageSize = Math.min(50, Math.max(1, Number(params?.pageSize) || 15));
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(totalPages, Math.max(1, Number(params?.page) || 1));
    const start = (page - 1) * pageSize;

    const suppliers = this.suppliers.map((s) => ({
      id: s.id,
      companyName: s.companyName
    }));

    return {
      items: filtered.slice(start, start + pageSize),
      total,
      page,
      pageSize,
      totalPages,
      counts,
      suppliers
    };
  }

  transitionAdminOfferStatus(params: {
    id: string;
    action: 'suspend' | 'restore';
    reason: string;
    actor: { actorId: string; actorName: string };
  }) {
    const reason = (params.reason || '').trim();
    if (reason.length < 5) {
      throw new Error('يرجى إدخال سبب إداري واضح لا يقل عن 5 أحرف');
    }

    const offer = this.offers.find((o) => o.id === params.id);
    if (!offer) {
      const err = new Error('عرض المورد غير موجود');
      (err as any).statusCode = 404;
      throw err;
    }

    const beforeStatus = this.getOfferStatus(offer);
    const nextStatus: CatalogOfferStatus = params.action === 'suspend' ? 'suspended' : 'active';
    if (beforeStatus === nextStatus) {
      throw new Error(`العرض في حالة (${nextStatus}) بالفعل`);
    }

    const product = this.products.find((p) => p.barcode === offer.barcode);
    const nowIso = new Date().toISOString();
    offer.status = nextStatus;
    offer.statusReason = reason;
    offer.statusChangedAt = nowIso;
    offer.statusChangedBy = params.actor.actorId;

    this.recordAudit({
      at: nowIso,
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: `catalog.offer.${params.action}`,
      entityType: 'catalog_offer',
      entityId: offer.id,
      summaryAr: `${params.action === 'suspend' ? 'إيقاف' : 'إعادة تفعيل'} عرض (${offer.supplierName}) للمنتج ${product?.nameAr || offer.barcode}`,
      summaryEn: `${params.action === 'suspend' ? 'Suspended' : 'Restored'} offer from ${offer.supplierName} for ${product?.nameEn || offer.barcode}`,
      before: { status: beforeStatus },
      after: { status: nextStatus },
      reason
    });

    return {
      ...offer,
      status: nextStatus
    };
  }

  getAdminCategoryTree() {
    const departments = SHARED_CATEGORY_TREE.map((dept) => {
      const deptProducts = this.products.filter(
        (p) => resolveSharedCategoryKey(p.category) === dept.categoryKey
      );
      const branches = dept.branches.map((br) => {
        const brProducts = deptProducts.filter((p) => p.subCategory === br.subCategoryKey);
        return {
          ...br,
          productsCount: brProducts.length,
          activeProductsCount: brProducts.filter((p) => this.isProductOperable(p)).length
        };
      });

      return {
        id: dept.id,
        order: dept.order,
        categoryKey: dept.categoryKey,
        labelAr: dept.labelAr,
        labelEn: dept.labelEn,
        productsCount: deptProducts.length,
        activeProductsCount: deptProducts.filter((p) => this.isProductOperable(p)).length,
        hiddenOrArchivedCount: deptProducts.filter((p) => !this.isProductOperable(p)).length,
        branches
      };
    });

    return {
      totalDepartments: departments.length,
      totalBranches: departments.reduce((sum, d) => sum + d.branches.length, 0),
      totalProducts: this.products.length,
      departments
    };
  }

  getAdminCatalogQualitySummary() {
    const offersByBarcode = new Map<string, SupplierOffer[]>();
    for (const o of this.offers) {
      const list = offersByBarcode.get(o.barcode) || [];
      list.push(o);
      offersByBarcode.set(o.barcode, list);
    }

    const missingCounts = new Map<string, number>();
    for (const def of QUALITY_FIELD_DEFINITIONS) {
      missingCounts.set(def.key, 0);
    }

    let scoreSum = 0;
    let below60Count = 0;
    let below80Count = 0;
    let withoutOffersCount = 0;

    const evaluated = this.products.map((p) => {
      const prodOffers = offersByBarcode.get(p.barcode) || [];
      const quality = computeProductQuality(p, prodOffers);
      scoreSum += quality.score;
      if (quality.score < 60) below60Count += 1;
      if (quality.score < 80) below80Count += 1;
      if (!quality.hasActiveOffer) withoutOffersCount += 1;

      for (const mf of quality.missingFields) {
        missingCounts.set(mf.key, (missingCounts.get(mf.key) || 0) + 1);
      }

      return {
        barcode: p.barcode,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        brand: p.brand,
        category: p.category,
        imageUrl: p.imageUrl,
        status: this.getProductStatus(p),
        score: quality.score,
        missingFields: quality.missingFields,
        offersCount: prodOffers.length,
        activeOffersCount: prodOffers.filter((o) => this.getOfferStatus(o) === 'active').length
      };
    });

    const totalProducts = evaluated.length;
    const averageScore = totalProducts > 0 ? Math.round(scoreSum / totalProducts) : 100;

    const missingFieldStats = QUALITY_FIELD_DEFINITIONS.map((def) => {
      const missingCount = missingCounts.get(def.key) || 0;
      const missingPercent = totalProducts > 0 ? Math.round((missingCount / totalProducts) * 100) : 0;
      return {
        ...def,
        missingCount,
        missingPercent
      };
    }).sort((a, b) => b.missingCount - a.missingCount);

    const worstProducts = [...evaluated]
      .sort((a, b) => a.score - b.score || b.missingFields.length - a.missingFields.length)
      .slice(0, 25);

    return {
      totalProducts,
      averageScore,
      below60Count,
      below80Count,
      withoutOffersCount,
      missingFieldStats,
      worstProducts
    };
  }

  // ================= ADMIN PHASE 4: ORDERS, LOGISTICS & DISPUTES =================
  private isSubOrderStuck(
    o: SubOrder,
    nowMs: number = Date.now()
  ): { isStuck: boolean; stuckType?: 'pending_24h' | 'delivery_48h'; hoursInStage: number } {
    const history = o.statusHistory || [];
    const lastStageTs =
      history.length > 0 ? Date.parse(history[history.length - 1].at) : Date.parse(o.createdAt);
    const createdTs = Date.parse(o.createdAt);
    const refTs = Number.isFinite(lastStageTs) ? lastStageTs : createdTs;
    const hoursInStage = Number.isFinite(refTs)
      ? Math.max(0, Math.round((nowMs - refTs) / (60 * 60 * 1000)))
      : 0;

    if (o.status === 'pending' && Number.isFinite(createdTs) && nowMs - createdTs > 24 * 60 * 60 * 1000) {
      return {
        isStuck: true,
        stuckType: 'pending_24h',
        hoursInStage: Math.max(0, Math.round((nowMs - createdTs) / (60 * 60 * 1000)))
      };
    }

    if (o.status === 'out_for_delivery' && Number.isFinite(refTs) && nowMs - refTs > 48 * 60 * 60 * 1000) {
      return {
        isStuck: true,
        stuckType: 'delivery_48h',
        hoursInStage
      };
    }

    return { isStuck: false, hoursInStage };
  }

  private ensureSubOrderHistories() {
    for (const o of this.subOrders) {
      if (o.statusHistory && o.statusHistory.length > 0) continue;
      const baseTs = Date.parse(o.createdAt) || Date.now();
      const stepIso = (offsetHours: number) =>
        new Date(baseTs + offsetHours * 60 * 60 * 1000).toISOString();

      const timeline: SubOrderStatusHistoryEntry[] = [
        {
          status: 'pending',
          at: o.createdAt,
          actorType: 'store',
          actorName: o.storeName
        }
      ];

      if (o.status !== 'pending') {
        if (o.status === 'cancelled') {
          timeline.push({
            status: 'cancelled',
            at: stepIso(1),
            actorType: 'admin',
            actorName: 'المدير العام (Super Admin)'
          });
        } else {
          timeline.push({
            status: 'approved',
            at: stepIso(1),
            actorType: 'supplier',
            actorName: o.supplierName
          });
        }
      }

      if (
        o.status === 'assigned_driver' ||
        o.status === 'out_for_delivery' ||
        o.status === 'delivered' ||
        o.status === 'disputed'
      ) {
        timeline.push({
          status: 'assigned_driver',
          at: stepIso(2),
          actorType: 'supplier',
          actorName: o.supplierName,
          note: o.assignedDriverName ? `السائق: ${o.assignedDriverName}` : undefined
        });
      }

      if (o.status === 'out_for_delivery' || o.status === 'delivered' || o.status === 'disputed') {
        timeline.push({
          status: 'out_for_delivery',
          at: stepIso(3),
          actorType: 'supplier',
          actorName: o.supplierName
        });
      }

      if (o.status === 'delivered' || o.status === 'disputed') {
        timeline.push({
          status: 'delivered',
          at: o.deliveredAt || stepIso(5),
          actorType: 'driver',
          actorName: o.assignedDriverName || 'مندوب التوزيع'
        });
      }

      if (o.status === 'disputed') {
        timeline.push({
          status: 'disputed',
          at: new Date(
            Math.max(
              Date.parse(o.deliveredAt || o.createdAt) + 2 * 60 * 60 * 1000,
              Date.now() - 18 * 60 * 60 * 1000
            )
          ).toISOString(),
          actorType: 'store',
          actorName: o.storeName,
          note: 'فتح نزاع بعد التسليم'
        });
      }

      o.statusHistory = timeline;
    }
  }

  /**
   * Centralized SubOrder State Engine.
   * Enforces valid lifecycle transitions, driver operability, delivery PIN checks,
   * atomic stock return + ledger reversal on cancellation, statusHistory timeline,
   * and immutable AdminAuditLog entries when executed by admin.
   */
  transitionSubOrder(params: {
    id: string;
    toStatus: OrderStatus;
    actor: {
      actorType: 'system' | 'admin' | 'supplier' | 'driver' | 'store' | 'delivery_partner';
      actorId?: string;
      actorName?: string;
    };
    reason?: string;
    pin?: string;
    driverId?: string;
    force?: boolean;
    restockOnCancel?: boolean;
    addCashToTodaySales?: boolean;
    extraHistoryNote?: string;
  }): SubOrder {
    const order = this.subOrders.find((o) => o.id === params.id);
    if (!order) {
      const err: any = new Error('الطلب غير موجود');
      err.statusCode = 404;
      throw err;
    }

    const fromStatus = order.status;
    const allowedTargets = SUBORDER_TRANSITIONS[fromStatus] || [];
    if (!allowedTargets.includes(params.toStatus)) {
      const err: any = new Error(
        `الانتقال من الحالة (${fromStatus}) إلى (${params.toStatus}) غير مسموح به وفق دورة حياة الطلب`
      );
      err.statusCode = 400;
      throw err;
    }

    const trimmedReason = typeof params.reason === 'string' ? params.reason.trim() : '';
    if (params.actor.actorType === 'admin' && trimmedReason.length < 5) {
      const err: any = new Error('يرجى إدخال سبب إداري واضح لا يقل عن 5 أحرف');
      err.statusCode = 400;
      throw err;
    }

    // Platform Delivery Ownership Guard: Suppliers cannot assign their van drivers or dispatch platform orders
    if (
      order.deliveryType === 'platform_driver' &&
      params.actor.actorType === 'supplier' &&
      (params.toStatus === 'assigned_driver' ||
        params.toStatus === 'out_for_delivery' ||
        Boolean(params.driverId))
    ) {
      const err: any = new Error('توصيل هذا الطلب تتولاه شبكة المنصة');
      err.statusCode = 400;
      throw err;
    }

    // Validate driver when assigning or dispatching
    let resolvedVanDriver: DriverProfile | undefined;
    let resolvedPlatformDriver: DeliveryDriver | undefined;
    if (order.deliveryType === 'platform_driver') {
      if (params.driverId) {
        resolvedPlatformDriver = this.assertDeliveryDriverOperable(params.driverId);
      } else if (
        (params.toStatus === 'assigned_driver' || params.toStatus === 'out_for_delivery') &&
        order.assignedDriverId
      ) {
        resolvedPlatformDriver = this.assertDeliveryDriverOperable(order.assignedDriverId);
      }
    } else {
      if (params.driverId) {
        resolvedVanDriver = this.assertDriverOperable(params.driverId);
      } else if (
        (params.toStatus === 'assigned_driver' || params.toStatus === 'out_for_delivery') &&
        order.assignedDriverId
      ) {
        this.assertDriverOperable(order.assignedDriverId);
      }
    }

    // Delivery PIN verification (unless force delivery by admin from out_for_delivery OR resolving dispute back to delivered)
    if (params.toStatus === 'delivered' && fromStatus === 'out_for_delivery') {
      const isAdminForce = params.actor.actorType === 'admin' && params.force === true;
      if (!isAdminForce && order.deliveryPin && params.pin !== order.deliveryPin) {
        const err: any = new Error(
          'رمز التحقق من الاستلام (PIN) غير صحيح! اطلب الرمز المكون من 4 أرقام من صاحب المتجر.'
        );
        err.statusCode = 400;
        throw err;
      }
    }

    // Verify COD permission for partner drivers before mutating anything
    if (
      params.toStatus === 'delivered' &&
      order.deliveryType === 'platform_driver' &&
      order.paymentMethod === 'cod' &&
      !order.paidAt
    ) {
      const targetDriverId = resolvedPlatformDriver?.id || order.assignedDriverId;
      const targetDeliveryDriver = targetDriverId
        ? this.deliveryDrivers.find((d) => d.id === targetDriverId)
        : undefined;
      if (
        targetDeliveryDriver?.providerType === 'partner' &&
        !this.deliveryPlatformSettings.codAllowedForPartners
      ) {
        const err: any = new Error('الدفع عند الاستلام (COD) غير مفعل لشركاء التوصيل حالياً');
        err.statusCode = 400;
        throw err;
      }
    }

    // Pre-check cancellation ledger preconditions BEFORE mutating stock or order
    let invoiceEntryToReverse: LedgerEntry | undefined;
    const shouldRestock = params.restockOnCancel !== false;
    if (params.toStatus === 'cancelled' && order.paymentMethod === 'credit') {
      invoiceEntryToReverse = this.ledgerEntries.find(
        (l) => l.referenceType === 'INVOICE' && l.referenceId === order.id && !l.isReversed
      );
      if (invoiceEntryToReverse) {
        const creditAcc = this.creditAccounts.find(
          (c) => c.id === invoiceEntryToReverse!.creditAccountId
        );
        if (!creditAcc) {
          const err: any = new Error('الحساب الائتماني المرتبط بقيد الفاتورة غير موجود');
          err.statusCode = 400;
          throw err;
        }
      }
    }

    // Snapshot before state
    const nowIso = new Date().toISOString();
    const beforeSnapshot = {
      status: order.status,
      assignedDriverId: order.assignedDriverId || null,
      assignedDriverName: order.assignedDriverName || null,
      deliveredAt: order.deliveredAt || null,
      paidAt: order.paidAt || null,
      adminFlags: order.adminFlags ? { ...order.adminFlags } : null
    };

    // Apply driver update if provided, or clear when returning to approved
    if (resolvedPlatformDriver) {
      order.assignedDriverId = resolvedPlatformDriver.id;
      order.assignedDriverName = resolvedPlatformDriver.name;
    } else if (resolvedVanDriver) {
      order.assignedDriverId = resolvedVanDriver.id;
      order.assignedDriverName = resolvedVanDriver.name;
    } else if (fromStatus === 'assigned_driver' && params.toStatus === 'approved') {
      order.assignedDriverId = undefined;
      order.assignedDriverName = undefined;
    }

    let noteDetails = params.extraHistoryNote || '';

    // Apply delivery side-effects
    if (params.toStatus === 'delivered') {
      if (!order.deliveredAt) {
        order.deliveredAt = nowIso;
      }
      if (fromStatus === 'out_for_delivery' && params.actor.actorType === 'admin' && params.force) {
        order.adminFlags = { ...(order.adminFlags || {}), forcedDelivery: true };
        noteDetails = noteDetails
          ? `${noteDetails} | تأكيد تسليم قسري إدارياً بدون رمز PIN`
          : 'تأكيد تسليم قسري إدارياً بدون رمز PIN';
      }
      if (order.paymentMethod === 'cod' && !order.paidAt) {
        order.paidAt = nowIso;
        if (order.deliveryType === 'platform_driver') {
          const targetDriverId = resolvedPlatformDriver?.id || order.assignedDriverId;
          const deliveryDriver = targetDriverId
            ? this.deliveryDrivers.find((d) => d.id === targetDriverId)
            : undefined;
          if (deliveryDriver) {
            deliveryDriver.cashOnHandIQD = (deliveryDriver.cashOnHandIQD || 0) + order.subtotalIQD;
          }
        } else {
          const targetDriverId = resolvedVanDriver?.id || order.assignedDriverId;
          const driver = targetDriverId ? this.drivers.find((d) => d.id === targetDriverId) : undefined;
          if (driver) {
            driver.currentCashCollectedIQD += order.subtotalIQD;
            if (params.addCashToTodaySales) {
              driver.todayCashSalesIQD = (driver.todayCashSalesIQD || 0) + order.subtotalIQD;
            }
          }
        }
      }
    }

    // Apply cancellation side-effects atomically (stock + ledger reversal + linked delivery job)
    if (params.toStatus === 'cancelled') {
      let restockedUnits = 0;
      if (shouldRestock) {
        for (const item of order.items) {
          const offer = this.offers.find(
            (o) => o.supplierId === order.supplierId && o.barcode === item.barcode
          );
          if (offer) {
            offer.availableStock += item.quantity;
            restockedUnits += item.quantity;
          }
        }
      }

      let ledgerNote = '';
      if (order.paymentMethod === 'credit') {
        if (invoiceEntryToReverse) {
          this.reverseLedgerEntry(
            invoiceEntryToReverse.id,
            trimmedReason || 'إلغاء الطلب وإرجاع المخزون'
          );
          ledgerNote = `تم عكس قيد الفاتورة (${invoiceEntryToReverse.id}) بقيد عكسي في دفتر الأستاذ.`;
        } else {
          ledgerNote = 'ملاحظة: لا يوجد قيد فاتورة نشط غير معكوس في دفتر الأستاذ لعكسه.';
        }
      }

      if (order.deliveryJobId) {
        const linkedJob = this.deliveryJobs.find((j) => j.id === order.deliveryJobId);
        if (linkedJob && !['delivered', 'cancelled'].includes(linkedJob.status)) {
          linkedJob.status = 'cancelled';
          linkedJob.cancelledAt = nowIso;
          linkedJob.history.push({
            status: 'cancelled',
            at: nowIso,
            actorType: params.actor.actorType === 'admin' ? 'admin' : 'system',
            actorId: params.actor.actorId,
            actorName: params.actor.actorName || 'النظام',
            note: trimmedReason || 'تم إلغاء المهمة تلقائياً بسبب إلغاء الطلبية'
          });
        }
      }

      if (params.actor.actorType === 'admin') {
        order.adminFlags = { ...(order.adminFlags || {}), cancelledByAdmin: true };
      }

      const cancelParts = [
        shouldRestock
          ? `أُعيد ${restockedUnits} وحدة إلى مخزون المورد.`
          : 'تم الإلغاء دون إعادة المخزون (بضاعة تالفة/مستردة).',
        ledgerNote
      ].filter(Boolean);
      noteDetails = [noteDetails, ...cancelParts].filter(Boolean).join(' ');
    }

    order.status = params.toStatus;
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: params.toStatus,
      at: nowIso,
      actorType: params.actor.actorType === 'delivery_partner' ? 'driver' : params.actor.actorType,
      actorName:
        params.actor.actorName ||
        (params.actor.actorType === 'admin'
          ? 'المدير العام (Super Admin)'
          : params.actor.actorType === 'supplier'
          ? order.supplierName
          : params.actor.actorType === 'driver' || params.actor.actorType === 'delivery_partner'
          ? order.assignedDriverName || 'سائق المنصة'
          : order.storeName),
      reason: trimmedReason || undefined,
      note: noteDetails || undefined
    });

    // Auto-create DeliveryJob when supplier/admin approves a platform-delivery order
    if (
      params.toStatus === 'approved' &&
      fromStatus === 'pending' &&
      order.deliveryType === 'platform_driver'
    ) {
      const existingActiveJob = order.deliveryJobId
        ? this.deliveryJobs.find(
            (j) => j.id === order.deliveryJobId && !['cancelled', 'failed'].includes(j.status)
          )
        : undefined;
      if (!existingActiveJob) {
        this.createDeliveryJobForSubOrder(order, {
          actorType: params.actor.actorType === 'admin' ? 'admin' : 'system',
          actorId: params.actor.actorId,
          actorName: params.actor.actorName || 'النظام'
        });
      }
    }

    if (params.actor.actorType === 'admin') {
      const actionCode =
        params.toStatus === 'cancelled'
          ? 'order.cancel'
          : params.force
          ? 'order.force_deliver'
          : (resolvedVanDriver || resolvedPlatformDriver) && params.toStatus === 'assigned_driver'
          ? 'order.assign_driver'
          : 'order.transition_status';

      this.recordAudit({
        at: nowIso,
        actorId: params.actor.actorId || 'admin_root',
        actorName: params.actor.actorName || 'المدير العام (Super Admin)',
        action: actionCode,
        entityType: 'sub_order',
        entityId: order.id,
        summaryAr: `تغيير حالة الطلبية (${order.id}) من ${fromStatus} إلى ${params.toStatus}${noteDetails ? ` — ${noteDetails}` : ''}`,
        summaryEn: `Transitioned sub-order ${order.id} from ${fromStatus} to ${params.toStatus}`,
        before: beforeSnapshot,
        after: {
          status: order.status,
          assignedDriverId: order.assignedDriverId || null,
          assignedDriverName: order.assignedDriverName || null,
          deliveredAt: order.deliveredAt || null,
          paidAt: order.paidAt || null,
          adminFlags: order.adminFlags ? { ...order.adminFlags } : null
        },
        reason: trimmedReason
      });
    }

    return order;
  }

  private enrichAdminOrder(o: SubOrder) {
    const stuckInfo = this.isSubOrderStuck(o);
    const activeDispute = this.disputes.find(
      (d) => d.subOrderId === o.id && (d.status === 'open' || d.status === 'under_review')
    );
    const driver = o.assignedDriverId
      ? this.drivers.find((d) => d.id === o.assignedDriverId)
      : undefined;
    return {
      ...o,
      isStuck: stuckInfo.isStuck,
      stuckType: stuckInfo.stuckType || null,
      hoursInStage: stuckInfo.hoursInStage,
      hasOpenDispute: Boolean(activeDispute),
      openDisputeId: activeDispute?.id || null,
      assignedDriverStatus: driver ? this.getDriverAccountStatus(driver) : null,
      allowedTransitions: getAllowedSubOrderTransitions(o.status)
    };
  }

  listAdminOrders(params?: {
    search?: string;
    status?: string;
    supplierId?: string;
    storeId?: string;
    paymentMethod?: string;
    city?: string;
    dateFrom?: string;
    dateTo?: string;
    stuckOnly?: boolean;
    sortBy?: string;
    page?: number;
    pageSize?: number;
  }) {
    const allEnriched = this.subOrders.map((o) => this.enrichAdminOrder(o));
    const counts = {
      all: allEnriched.length,
      pending: allEnriched.filter((o) => o.status === 'pending').length,
      approved: allEnriched.filter((o) => o.status === 'approved').length,
      assigned_driver: allEnriched.filter((o) => o.status === 'assigned_driver').length,
      out_for_delivery: allEnriched.filter((o) => o.status === 'out_for_delivery').length,
      delivered: allEnriched.filter((o) => o.status === 'delivered').length,
      disputed: allEnriched.filter((o) => o.status === 'disputed').length,
      cancelled: allEnriched.filter((o) => o.status === 'cancelled').length,
      stuck: allEnriched.filter((o) => o.isStuck).length
    };

    let filtered = [...allEnriched];
    if (params?.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.parentOrderId.toLowerCase().includes(q) ||
          o.storeName.toLowerCase().includes(q) ||
          o.supplierName.toLowerCase().includes(q) ||
          (o.assignedDriverName && o.assignedDriverName.toLowerCase().includes(q))
      );
    }
    if (params?.status && params.status !== 'all') {
      if (params.status === 'stuck') {
        filtered = filtered.filter((o) => o.isStuck);
      } else {
        filtered = filtered.filter((o) => o.status === params.status);
      }
    }
    if (params?.stuckOnly) {
      filtered = filtered.filter((o) => o.isStuck);
    }
    if (params?.supplierId && params.supplierId !== 'all') {
      filtered = filtered.filter((o) => o.supplierId === params.supplierId);
    }
    if (params?.storeId && params.storeId !== 'all') {
      filtered = filtered.filter((o) => o.storeId === params.storeId);
    }
    if (params?.paymentMethod && params.paymentMethod !== 'all') {
      filtered = filtered.filter((o) => o.paymentMethod === params.paymentMethod);
    }
    if (params?.city && params.city !== 'all') {
      filtered = filtered.filter((o) => o.storeCity === params.city);
    }
    if (params?.dateFrom) {
      const fromMs = Date.parse(params.dateFrom);
      if (Number.isFinite(fromMs)) {
        filtered = filtered.filter((o) => Date.parse(o.createdAt) >= fromMs);
      }
    }
    if (params?.dateTo) {
      const toStr = params.dateTo.length === 10 ? `${params.dateTo}T23:59:59.999Z` : params.dateTo;
      const toMs = Date.parse(toStr);
      if (Number.isFinite(toMs)) {
        filtered = filtered.filter((o) => Date.parse(o.createdAt) <= toMs);
      }
    }

    const sortBy = params?.sortBy || 'newest';
    filtered.sort((a, b) => {
      if (sortBy === 'oldest') {
        return Date.parse(a.createdAt) - Date.parse(b.createdAt);
      }
      if (sortBy === 'amount_desc') {
        return b.subtotalIQD - a.subtotalIQD;
      }
      if (sortBy === 'amount_asc') {
        return a.subtotalIQD - b.subtotalIQD;
      }
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });

    const pageSize = Math.min(100, Math.max(1, Number(params?.pageSize) || 15));
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(totalPages, Math.max(1, Number(params?.page) || 1));
    const start = (page - 1) * pageSize;

    const cities = Array.from(new Set(this.subOrders.map((o) => o.storeCity).filter(Boolean)));
    const suppliers = this.suppliers.map((s) => ({
      id: s.id,
      companyName: s.companyName
    }));
    const stores = this.stores.map((s) => ({
      id: s.id,
      name: s.name
    }));
    const drivers = this.drivers.map((d) => ({
      id: d.id,
      name: d.name,
      supplierId: d.supplierId,
      supplierName: d.supplierName,
      vehiclePlate: d.vehiclePlate,
      accountStatus: this.getDriverAccountStatus(d)
    }));

    return {
      items: filtered.slice(start, start + pageSize),
      allFilteredItems: filtered,
      total,
      page,
      pageSize,
      totalPages,
      counts,
      filterOptions: {
        cities,
        suppliers,
        stores,
        drivers
      }
    };
  }

  getAdminOrderDetail(id: string) {
    const raw = this.subOrders.find((o) => o.id === id);
    if (!raw) {
      const err: any = new Error('الطلب غير موجود');
      err.statusCode = 404;
      throw err;
    }

    const order = this.enrichAdminOrder(raw);
    const store = this.stores.find((s) => s.id === raw.storeId) || null;
    const supplier = this.suppliers.find((s) => s.id === raw.supplierId) || null;
    const driver = raw.assignedDriverId
      ? this.drivers.find((d) => d.id === raw.assignedDriverId) || null
      : null;

    const siblingSubOrders = this.subOrders
      .filter((s) => s.parentOrderId === raw.parentOrderId && s.id !== raw.id)
      .map((s) => ({
        id: s.id,
        supplierId: s.supplierId,
        supplierName: s.supplierName,
        subtotalIQD: s.subtotalIQD,
        status: s.status
      }));

    const creditAccount = this.getCreditAccount(raw.storeId, raw.supplierId) || null;
    const disputes = this.disputes
      .filter((d) => d.subOrderId === raw.id)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const disputeIds = new Set(disputes.map((d) => d.id));

    const directInvoiceIds = new Set(
      this.ledgerEntries
        .filter((l) => l.referenceType === 'INVOICE' && l.referenceId === raw.id)
        .map((l) => l.id)
    );

    const ledgerEntries = this.ledgerEntries
      .filter(
        (l) =>
          l.referenceId === raw.id ||
          disputeIds.has(l.referenceId) ||
          (l.referenceType === 'REVERSAL' &&
            directInvoiceIds.has(l.referenceId.replace(/^REV-/, '')))
      )
      .sort((a, b) => Date.parse(b.entryDate) - Date.parse(a.entryDate));

    const auditLogs = this.auditLogs
      .filter(
        (a) =>
          (a.entityType === 'sub_order' && a.entityId === raw.id) ||
          (a.entityType === 'dispute' && disputeIds.has(a.entityId))
      )
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

    const activeDriversForSupplier = this.drivers
      .filter(
        (d) =>
          this.getDriverAccountStatus(d) === 'active' &&
          (d.supplierId === raw.supplierId || true)
      )
      .map((d) => ({
        id: d.id,
        name: d.name,
        supplierId: d.supplierId,
        supplierName: d.supplierName,
        vehiclePlate: d.vehiclePlate,
        sameSupplier: d.supplierId === raw.supplierId
      }))
      .sort((a, b) => Number(b.sameSupplier) - Number(a.sameSupplier));

    return {
      order,
      store: store
        ? {
            id: store.id,
            name: store.name,
            ownerName: store.ownerName,
            phone: store.phone,
            city: store.city,
            district: store.district,
            address: store.address,
            accountStatus: this.getStoreAccountStatus(store)
          }
        : null,
      supplier: supplier
        ? {
            id: supplier.id,
            companyName: supplier.companyName,
            contactPerson: supplier.contactPerson,
            phone: supplier.phone,
            city: supplier.city,
            accountStatus: this.getSupplierAccountStatus(supplier)
          }
        : null,
      driver: driver
        ? {
            id: driver.id,
            name: driver.name,
            phone: driver.phone,
            vehiclePlate: driver.vehiclePlate,
            vehicleType: driver.vehicleModel,
            accountStatus: this.getDriverAccountStatus(driver)
          }
        : null,
      siblingSubOrders,
      creditAccount,
      ledgerEntries,
      disputes,
      adminNotes: raw.adminNotes || [],
      auditLogs,
      availableDrivers: activeDriversForSupplier,
      hasActiveCreditInvoice: this.ledgerEntries.some(
        (l) => l.referenceType === 'INVOICE' && l.referenceId === raw.id && !l.isReversed
      )
    };
  }

  addAdminOrderNote(params: {
    id: string;
    text: string;
    actor: { actorId: string; actorName: string };
  }) {
    const order = this.subOrders.find((o) => o.id === params.id);
    if (!order) {
      const err: any = new Error('الطلب غير موجود');
      err.statusCode = 404;
      throw err;
    }
    const clean = String(params.text || '').trim();
    if (clean.length < 3) {
      const err: any = new Error('نص الملاحظة قصير جداً (3 أحرف على الأقل)');
      err.statusCode = 400;
      throw err;
    }
    const nowIso = new Date().toISOString();
    const note: AdminInternalNote = {
      id: `onote_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      at: nowIso,
      author: params.actor.actorName,
      text: clean
    };
    if (!order.adminNotes) order.adminNotes = [];
    order.adminNotes.unshift(note);

    this.recordAudit({
      at: nowIso,
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'order.add_note',
      entityType: 'sub_order',
      entityId: order.id,
      summaryAr: `إضافة ملاحظة إدارية داخلية على الطلب (${order.id})`,
      summaryEn: `Added internal admin note on sub-order ${order.id}`,
      before: null,
      after: { noteText: clean },
      reason: clean
    });

    return note;
  }

  // ---- Disputes Management ----
  private enrichDispute(d: Dispute) {
    const order = this.subOrders.find((o) => o.id === d.subOrderId) || null;
    return {
      ...d,
      subOrder: order
        ? {
            id: order.id,
            parentOrderId: order.parentOrderId,
            storeId: order.storeId,
            storeName: order.storeName,
            supplierId: order.supplierId,
            supplierName: order.supplierName,
            subtotalIQD: order.subtotalIQD,
            paymentMethod: order.paymentMethod,
            status: order.status,
            createdAt: order.createdAt
          }
        : null
    };
  }

  listAdminDisputes(params?: {
    status?: string;
    reasonCode?: string;
    search?: string;
  }) {
    const allEnriched = this.disputes
      .map((d) => this.enrichDispute(d))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    const counts = {
      all: allEnriched.length,
      open: allEnriched.filter((d) => d.status === 'open').length,
      under_review: allEnriched.filter((d) => d.status === 'under_review').length,
      resolved: allEnriched.filter((d) => d.status === 'resolved').length,
      rejected: allEnriched.filter((d) => d.status === 'rejected').length
    };

    let filtered = [...allEnriched];
    if (params?.status && params.status !== 'all') {
      filtered = filtered.filter((d) => d.status === params.status);
    }
    if (params?.reasonCode && params.reasonCode !== 'all') {
      filtered = filtered.filter((d) => d.reasonCode === params.reasonCode);
    }
    if (params?.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.id.toLowerCase().includes(q) ||
          d.subOrderId.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          (d.subOrder?.storeName && d.subOrder.storeName.toLowerCase().includes(q)) ||
          (d.subOrder?.supplierName && d.subOrder.supplierName.toLowerCase().includes(q))
      );
    }

    const eligibleOrdersForDispute = this.subOrders
      .filter((o) => o.status === 'delivered')
      .map((o) => ({
        id: o.id,
        storeName: o.storeName,
        supplierName: o.supplierName,
        subtotalIQD: o.subtotalIQD,
        paymentMethod: o.paymentMethod
      }));

    return {
      items: filtered,
      counts,
      eligibleOrdersForDispute
    };
  }

  createAdminDispute(params: {
    subOrderId: string;
    openedBy: DisputeOpenedBy;
    reasonCode: DisputeReasonCode;
    description: string;
    claimedAmountIQD?: number;
    actor: { actorId: string; actorName: string };
  }) {
    const order = this.subOrders.find((o) => o.id === params.subOrderId);
    if (!order) {
      const err: any = new Error('الطلب المرتبط بالنزاع غير موجود');
      err.statusCode = 404;
      throw err;
    }

    const existingActive = this.disputes.find(
      (d) => d.subOrderId === order.id && (d.status === 'open' || d.status === 'under_review')
    );
    if (existingActive) {
      const err: any = new Error(`يوجد نزاع نشط بالفعل على هذا الطلب (${existingActive.id})`);
      err.statusCode = 400;
      throw err;
    }

    if (order.status !== 'delivered' && order.status !== 'disputed') {
      const err: any = new Error(
        `لا يمكن فتح نزاع لطلب بحالة (${order.status}) — يجب أن يكون الطلب مسلّماً أولاً`
      );
      err.statusCode = 400;
      throw err;
    }

    const desc = String(params.description || '').trim();
    if (desc.length < 5) {
      const err: any = new Error('يرجى كتابة وصف واضح للنزاع (5 أحرف على الأقل)');
      err.statusCode = 400;
      throw err;
    }

    let claimedAmount: number | undefined;
    if (params.claimedAmountIQD !== undefined && params.claimedAmountIQD !== null && String(params.claimedAmountIQD) !== '') {
      const num = Number(params.claimedAmountIQD);
      if (!Number.isFinite(num) || num < 0 || num > order.subtotalIQD) {
        const err: any = new Error('المبلغ المطالب به يجب أن يكون بين 0 وقيمة الطلب');
        err.statusCode = 400;
        throw err;
      }
      claimedAmount = num;
    }

    const nowIso = new Date().toISOString();
    const beforeOrderStatus = order.status;

    if (order.status === 'delivered') {
      this.transitionSubOrder({
        id: order.id,
        toStatus: 'disputed',
        actor: {
          actorType: 'admin',
          actorId: params.actor.actorId,
          actorName: params.actor.actorName
        },
        reason: `فتح نزاع (${params.reasonCode}): ${desc}`,
        extraHistoryNote: `فُتح نزاع بواسطة (${params.openedBy})`
      });
    }

    const dispute: Dispute = {
      id: `disp_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      subOrderId: order.id,
      openedBy: params.openedBy || 'admin',
      reasonCode: params.reasonCode || 'other',
      description: desc,
      claimedAmountIQD: claimedAmount,
      status: 'open',
      createdAt: nowIso,
      notes: []
    };

    this.disputes.unshift(dispute);

    this.recordAudit({
      at: nowIso,
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'dispute.open',
      entityType: 'dispute',
      entityId: dispute.id,
      summaryAr: `فتح نزاع (${dispute.id}) على الطلب ${order.id} بالسبب: ${params.reasonCode}`,
      summaryEn: `Opened dispute ${dispute.id} on order ${order.id} (${params.reasonCode})`,
      before: { orderStatus: beforeOrderStatus },
      after: { disputeStatus: dispute.status, orderStatus: order.status, claimedAmountIQD: claimedAmount ?? null },
      reason: desc
    });

    return this.enrichDispute(dispute);
  }

  reviewAdminDispute(params: {
    id: string;
    reason: string;
    actor: { actorId: string; actorName: string };
  }) {
    const dispute = this.disputes.find((d) => d.id === params.id);
    if (!dispute) {
      const err: any = new Error('النزاع غير موجود');
      err.statusCode = 404;
      throw err;
    }
    const cleanReason = String(params.reason || '').trim();
    if (cleanReason.length < 5) {
      const err: any = new Error('يرجى إدخال سبب واضح لا يقل عن 5 أحرف');
      err.statusCode = 400;
      throw err;
    }
    if (dispute.status !== 'open') {
      const err: any = new Error('يمكن تحويل النزاعات المفتوحة فقط إلى قيد المراجعة');
      err.statusCode = 400;
      throw err;
    }

    const beforeStatus = dispute.status;
    dispute.status = 'under_review';
    const nowIso = new Date().toISOString();
    dispute.notes.unshift({
      id: `dnote_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      at: nowIso,
      author: params.actor.actorName,
      text: `بدء المراجعة: ${cleanReason}`
    });

    this.recordAudit({
      at: nowIso,
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'dispute.review',
      entityType: 'dispute',
      entityId: dispute.id,
      summaryAr: `تحويل النزاع (${dispute.id}) للطلب ${dispute.subOrderId} إلى قيد المراجعة`,
      summaryEn: `Moved dispute ${dispute.id} to under_review`,
      before: { status: beforeStatus },
      after: { status: dispute.status },
      reason: cleanReason
    });

    return this.enrichDispute(dispute);
  }

  resolveAdminDispute(params: {
    id: string;
    type: DisputeResolutionType;
    amountIQD?: number;
    restockToSupplier?: boolean;
    note?: string;
    reason: string;
    actor: { actorId: string; actorName: string };
  }) {
    const dispute = this.disputes.find((d) => d.id === params.id);
    if (!dispute) {
      const err: any = new Error('النزاع غير موجود');
      err.statusCode = 404;
      throw err;
    }
    const order = this.subOrders.find((o) => o.id === dispute.subOrderId);
    if (!order) {
      const err: any = new Error('الطلب المرتبط بالنزاع غير موجود');
      err.statusCode = 404;
      throw err;
    }
    if (dispute.status === 'resolved' || dispute.status === 'rejected') {
      const err: any = new Error('تم إغلاق هذا النزاع مسبقاً');
      err.statusCode = 400;
      throw err;
    }

    const cleanReason = String(params.reason || '').trim();
    if (cleanReason.length < 5) {
      const err: any = new Error('يرجى إدخال سبب إداري واضح لا يقل عن 5 أحرف');
      err.statusCode = 400;
      throw err;
    }

    const validTypes: DisputeResolutionType[] = ['full_refund', 'partial_credit', 'replacement', 'rejected'];
    if (!validTypes.includes(params.type)) {
      const err: any = new Error('نوع تسوية النزاع غير صالح');
      err.statusCode = 400;
      throw err;
    }

    // Validate partial_credit amount before any mutation
    let resolvedAmountIQD = params.amountIQD !== undefined ? Number(params.amountIQD) : undefined;
    if (params.type === 'partial_credit') {
      if (!Number.isFinite(resolvedAmountIQD) || (resolvedAmountIQD as number) <= 0 || (resolvedAmountIQD as number) > order.subtotalIQD) {
        const err: any = new Error(
          `قيمة الخصم الجزئي يجب أن تكون أكبر من 0 ولا تتجاوز قيمة الطلب (${order.subtotalIQD.toLocaleString('en-US')} د.ع)`
        );
        err.statusCode = 400;
        throw err;
      }
    }

    // Validate credit account exists before partial_credit mutation on credit orders
    let partialCreditAccount: CreditAccount | undefined;
    if (params.type === 'partial_credit' && order.paymentMethod === 'credit') {
      partialCreditAccount = this.getCreditAccount(order.storeId, order.supplierId);
      if (!partialCreditAccount) {
        const err: any = new Error('الحساب الائتماني للمتجر مع هذا المورد غير موجود لتسجيل الإشعار الدائن');
        err.statusCode = 400;
        throw err;
      }
    }

    const nowIso = new Date().toISOString();
    const beforeSnapshot = {
      disputeStatus: dispute.status,
      orderStatus: order.status
    };
    const restockFlag = Boolean(params.restockToSupplier);
    const resolutionNote = String(params.note || cleanReason).trim();

    if (params.type === 'full_refund') {
      resolvedAmountIQD = order.subtotalIQD;
      if (order.status === 'disputed' || order.status !== 'cancelled') {
        if (order.status === 'delivered') {
          this.transitionSubOrder({
            id: order.id,
            toStatus: 'disputed',
            actor: { actorType: 'admin', actorId: params.actor.actorId, actorName: params.actor.actorName },
            reason: cleanReason
          });
        }
        this.transitionSubOrder({
          id: order.id,
          toStatus: 'cancelled',
          actor: {
            actorType: 'admin',
            actorId: params.actor.actorId,
            actorName: params.actor.actorName
          },
          reason: cleanReason,
          restockOnCancel: restockFlag,
          extraHistoryNote: `تسوية النزاع (${dispute.id}): استرداد كامل`
        });
      }
      dispute.status = 'resolved';
    } else if (params.type === 'partial_credit') {
      const creditValue = resolvedAmountIQD as number;
      if (order.paymentMethod === 'credit' && partialCreditAccount) {
        this.addLedgerEntry({
          creditAccountId: partialCreditAccount.id,
          supplierId: order.supplierId,
          storeId: order.storeId,
          referenceType: 'RETURN_CREDIT',
          referenceId: dispute.id,
          entryDate: nowIso.split('T')[0],
          debitIQD: 0,
          creditIQD: creditValue,
          runningBalanceIQD: Math.max(0, partialCreditAccount.currentUsedCreditIQD - creditValue),
          descriptionAr: `إشعار دائن لفض نزاع (${dispute.id}) على طلب ${order.id} - ${resolutionNote}`
        });
      }
      if (restockFlag) {
        const ratio = Math.min(1, creditValue / Math.max(1, order.subtotalIQD));
        for (const item of order.items) {
          const offer = this.offers.find(
            (o) => o.supplierId === order.supplierId && o.barcode === item.barcode
          );
          if (offer) {
            offer.availableStock += Math.max(1, Math.round(item.quantity * ratio));
          }
        }
      }
      if (order.status === 'disputed') {
        this.transitionSubOrder({
          id: order.id,
          toStatus: 'delivered',
          actor: {
            actorType: 'admin',
            actorId: params.actor.actorId,
            actorName: params.actor.actorName
          },
          reason: cleanReason,
          extraHistoryNote: `إغلاق النزاع (${dispute.id}) بخصم جزئي ${creditValue.toLocaleString('en-US')} د.ع`
        });
      }
      dispute.status = 'resolved';
    } else if (params.type === 'replacement') {
      if (restockFlag) {
        for (const item of order.items) {
          const offer = this.offers.find(
            (o) => o.supplierId === order.supplierId && o.barcode === item.barcode
          );
          if (offer) {
            offer.availableStock += item.quantity;
          }
        }
      }
      if (order.status === 'disputed') {
        this.transitionSubOrder({
          id: order.id,
          toStatus: 'delivered',
          actor: {
            actorType: 'admin',
            actorId: params.actor.actorId,
            actorName: params.actor.actorName
          },
          reason: cleanReason,
          extraHistoryNote: `إغلاق النزاع (${dispute.id}) بالاستبدال العيني`
        });
      }
      dispute.status = 'resolved';
    } else {
      // rejected
      if (order.status === 'disputed') {
        this.transitionSubOrder({
          id: order.id,
          toStatus: 'delivered',
          actor: {
            actorType: 'admin',
            actorId: params.actor.actorId,
            actorName: params.actor.actorName
          },
          reason: cleanReason,
          extraHistoryNote: `رفض النزاع (${dispute.id}) وإعادة الطلب لحالة مكتمل`
        });
      }
      dispute.status = 'rejected';
    }

    dispute.resolution = {
      type: params.type,
      amountIQD: resolvedAmountIQD,
      restockToSupplier: restockFlag,
      note: resolutionNote,
      resolvedBy: params.actor.actorId
    };
    dispute.resolvedAt = nowIso;

    this.recordAudit({
      at: nowIso,
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'dispute.resolve',
      entityType: 'dispute',
      entityId: dispute.id,
      summaryAr: `تسوية النزاع (${dispute.id}) للطلب ${order.id} بالقرار: ${params.type}${resolvedAmountIQD ? ` (${resolvedAmountIQD.toLocaleString('en-US')} د.ع)` : ''}`,
      summaryEn: `Resolved dispute ${dispute.id} (${params.type})`,
      before: beforeSnapshot,
      after: {
        disputeStatus: dispute.status,
        resolutionType: params.type,
        amountIQD: resolvedAmountIQD ?? null,
        restockToSupplier: restockFlag,
        orderStatus: order.status
      },
      reason: cleanReason
    });

    return this.enrichDispute(dispute);
  }

  addAdminDisputeNote(params: {
    id: string;
    text: string;
    actor: { actorId: string; actorName: string };
  }) {
    const dispute = this.disputes.find((d) => d.id === params.id);
    if (!dispute) {
      const err: any = new Error('النزاع غير موجود');
      err.statusCode = 404;
      throw err;
    }
    const clean = String(params.text || '').trim();
    if (clean.length < 3) {
      const err: any = new Error('نص الملاحظة قصير جداً');
      err.statusCode = 400;
      throw err;
    }
    const nowIso = new Date().toISOString();
    const note: AdminInternalNote = {
      id: `dnote_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      at: nowIso,
      author: params.actor.actorName,
      text: clean
    };
    dispute.notes.unshift(note);

    this.recordAudit({
      at: nowIso,
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'dispute.add_note',
      entityType: 'dispute',
      entityId: dispute.id,
      summaryAr: `إضافة ملاحظة على النزاع (${dispute.id})`,
      summaryEn: `Added note to dispute ${dispute.id}`,
      before: null,
      after: { noteText: clean },
      reason: clean
    });

    return note;
  }

  // ---- Logistics & Fleet Overview ----
  getAdminLogisticsOverview() {
    const todayPrefix = new Date().toISOString().slice(0, 10);

    const driversSummary = this.drivers.map((d) => {
      const accountStatus = this.getDriverAccountStatus(d);
      const driverOrders = this.subOrders.filter((o) => o.assignedDriverId === d.id);
      const activeOrders = driverOrders.filter(
        (o) => o.status === 'assigned_driver' || o.status === 'out_for_delivery'
      );
      const deliveredTodayCount = driverOrders.filter(
        (o) =>
          o.status === 'delivered' &&
          ((o.deliveredAt || '').startsWith(todayPrefix) || (o.createdAt || '').startsWith(todayPrefix))
      ).length;
      const vanDeliveredTxCount = this.vanTransactions.filter(
        (t) => t.driverId === d.id && t.createdAt.startsWith(todayPrefix)
      ).length;

      const stockItems = this.vanInventory.filter((v) => v.driverId === d.id);
      const vanStockUnits = stockItems.reduce((sum, v) => sum + (v.remainingQuantity || 0), 0);
      const vanStockValueIQD = stockItems.reduce(
        (sum, v) => sum + (v.remainingQuantity || 0) * (v.unitPriceIQD || 0),
        0
      );
      const lowStockItemsCount = stockItems.filter((v) => (v.remainingQuantity || 0) <= 5).length;

      const routeStops = this.vanRouteStops.filter((s) => s.driverId === d.id);
      const completedStops = routeStops.filter((s) => s.status === 'visited' || s.status === 'sold').length;

      return {
        id: d.id,
        name: d.name,
        phone: d.phone,
        supplierId: d.supplierId,
        supplierName: d.supplierName,
        vehiclePlate: d.vehiclePlate,
        vehicleType: d.vehicleModel,
        accountStatus,
        isActiveShift: d.isActiveShift,
        availabilityStatus: d.availabilityStatus,
        todayDeliveriesCount: deliveredTodayCount + vanDeliveredTxCount,
        activeOrdersCount: activeOrders.length,
        activeOrders: activeOrders.map((o) => ({
          id: o.id,
          storeName: o.storeName,
          status: o.status,
          subtotalIQD: o.subtotalIQD
        })),
        currentCashCollectedIQD: d.currentCashCollectedIQD,
        vanStockUnits,
        vanStockValueIQD,
        lowStockItemsCount,
        routeStopsTotal: routeStops.length,
        routeStopsCompleted: completedStops
      };
    });

    const vanLoadRequests = this.vanLoadRequests
      .map((req) => {
        const totalUnits = req.items.reduce((s, it) => s + (it.requestedQuantity || 0), 0);
        return {
          ...req,
          requestedAt: req.createdAt,
          totalUnits
        };
      })
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    const suspendedDriversWithActiveOrders = driversSummary.filter(
      (d) => d.accountStatus !== 'active' && d.activeOrdersCount > 0
    );
    const lowStockActiveVans = driversSummary.filter(
      (d) => d.accountStatus === 'active' && d.isActiveShift && d.vanStockUnits <= 20
    );

    return {
      kpis: {
        totalDrivers: driversSummary.length,
        activeShiftDrivers: driversSummary.filter((d) => d.isActiveShift && d.accountStatus === 'active').length,
        activeAssignedOrders: this.subOrders.filter(
          (o) => o.status === 'assigned_driver' || o.status === 'out_for_delivery'
        ).length,
        totalCashInCustodyIQD: driversSummary.reduce((sum, d) => sum + d.currentCashCollectedIQD, 0),
        pendingVanLoadRequests: vanLoadRequests.filter((r) => r.status === 'pending_approval').length,
        alertsCount: suspendedDriversWithActiveOrders.length + lowStockActiveVans.length
      },
      drivers: driversSummary,
      vanLoadRequests,
      alerts: {
        suspendedDriversWithActiveOrders,
        lowStockActiveVans
      }
    };
  }

  // ================= PLATFORM DELIVERY NETWORK (PHASE D1) =================

  private normalizeDeliveryPhone(phone: string): string {
    let digits = String(phone || '').replace(/\D/g, '');
    if (digits.startsWith('00964')) digits = digits.slice(5);
    else if (digits.startsWith('964')) digits = digits.slice(3);
    if (digits.length === 10 && digits.startsWith('7')) {
      digits = `0${digits}`;
    }
    return digits;
  }

  private normalizePlateKey(plate: string): string {
    return String(plate || '')
      .trim()
      .replace(/\s+/g, ' ')
      .toUpperCase();
  }

  private requireDeliveryReason(reason: unknown): string {
    const clean = typeof reason === 'string' ? reason.trim() : '';
    if (clean.length < 5) {
      const err: any = new Error('يجب إدخال سبب واضح لا يقل عن 5 أحرف');
      err.statusCode = 400;
      throw err;
    }
    return clean;
  }

  private ensureSupplierDeliveryDefaults() {
    for (const s of this.suppliers) {
      if (!s.deliverySettings) {
        s.deliverySettings = {
          hasOwnFleet: true,
          allowPlatformDelivery: false,
          allowStorePickup: true
        };
      } else if (
        !s.deliverySettings.hasOwnFleet &&
        !s.deliverySettings.allowPlatformDelivery &&
        !s.deliverySettings.allowStorePickup
      ) {
        s.deliverySettings.allowPlatformDelivery = true;
      }
    }
  }

  assertDeliveryPartnerOperable(partnerId: string): DeliveryPartner {
    const partner = this.deliveryPartners.find((p) => p.id === partnerId);
    if (!partner) {
      const err: any = new Error('شريك التوصيل غير موجود');
      err.statusCode = 404;
      throw err;
    }
    if (partner.accountStatus !== 'active') {
      const err: any = new Error(
        `لا يمكن تنفيذ الإجراء: حالة شريك التوصيل (${partner.name}) هي ${partner.accountStatus} وليست نشطة`
      );
      err.statusCode = 400;
      throw err;
    }
    return partner;
  }

  assertDeliveryVehicleOperable(vehicleId: string): DeliveryVehicle {
    const vehicle = this.deliveryVehicles.find((v) => v.id === vehicleId);
    if (!vehicle) {
      const err: any = new Error('المركبة غير موجودة');
      err.statusCode = 404;
      throw err;
    }
    if (vehicle.status !== 'active') {
      const err: any = new Error(
        `لا يمكن تنفيذ الإجراء: حالة المركبة (${vehicle.plateNumber}) هي ${vehicle.status} وليست نشطة`
      );
      err.statusCode = 400;
      throw err;
    }
    if (vehicle.ownerType === 'partner' && vehicle.partnerId) {
      this.assertDeliveryPartnerOperable(vehicle.partnerId);
    }
    return vehicle;
  }

  assertDeliveryDriverOperable(driverId: string): DeliveryDriver {
    const driver = this.deliveryDrivers.find((d) => d.id === driverId);
    if (!driver) {
      const err: any = new Error('سائق المنصة غير موجود');
      err.statusCode = 404;
      throw err;
    }
    if (driver.accountStatus !== 'active') {
      const err: any = new Error(
        `لا يمكن تنفيذ الإجراء: حالة السائق (${driver.name}) هي ${driver.accountStatus} وليست نشطة`
      );
      err.statusCode = 400;
      throw err;
    }
    if (driver.providerType === 'partner' && driver.partnerId) {
      this.assertDeliveryPartnerOperable(driver.partnerId);
    }
    return driver;
  }

  getExpiringVehicleDocsSummary(daysWindow = 30) {
    const nowMs = Date.now();
    const horizonMs = nowMs + daysWindow * 24 * 60 * 60 * 1000;
    const result: Array<{
      id: string;
      plateNumber: string;
      makeModel: string;
      ownerType: DeliveryProviderType;
      partnerId?: string;
      status: DeliveryVehicleStatus;
      hasExpired: boolean;
      expiringDocs: Array<{
        field: 'registrationExpiry' | 'insuranceExpiry' | 'inspectionExpiry';
        date: string;
        daysRemaining: number;
      }>;
    }> = [];

    for (const v of this.deliveryVehicles) {
      if (v.status === 'rejected') continue;
      const docs = v.docsExpiry;
      if (!docs) continue;
      const fields: Array<'registrationExpiry' | 'insuranceExpiry' | 'inspectionExpiry'> = [
        'registrationExpiry',
        'insuranceExpiry',
        'inspectionExpiry'
      ];
      const expiringDocs: Array<{
        field: 'registrationExpiry' | 'insuranceExpiry' | 'inspectionExpiry';
        date: string;
        daysRemaining: number;
      }> = [];
      let hasExpired = false;

      for (const f of fields) {
        const val = docs[f];
        if (!val) continue;
        const ms = Date.parse(val);
        if (Number.isNaN(ms)) continue;
        if (ms <= horizonMs) {
          const daysRemaining = Math.ceil((ms - nowMs) / (24 * 60 * 60 * 1000));
          if (daysRemaining <= 0) hasExpired = true;
          expiringDocs.push({ field: f, date: val, daysRemaining });
        }
      }

      if (expiringDocs.length > 0) {
        result.push({
          id: v.id,
          plateNumber: v.plateNumber,
          makeModel: v.makeModel,
          ownerType: v.ownerType,
          partnerId: v.partnerId,
          status: v.status,
          hasExpired,
          expiringDocs
        });
      }
    }

    return result;
  }

  private hasActivePlatformCoverageForZone(governorateId: string, deliveryZoneId?: string): boolean {
    const activePartnerIds = new Set(
      this.deliveryPartners.filter((p) => p.accountStatus === 'active').map((p) => p.id)
    );
    const activeVehicles = this.deliveryVehicles.filter((v) => {
      if (v.status !== 'active') return false;
      if (v.ownerType === 'partner') {
        return Boolean(v.partnerId && activePartnerIds.has(v.partnerId));
      }
      return true;
    });
    if (activeVehicles.length === 0) return false;

    const matchingDrivers = this.deliveryDrivers.filter((d) => {
      if (d.accountStatus !== 'active') return false;
      if (d.providerType === 'partner' && (!d.partnerId || !activePartnerIds.has(d.partnerId))) {
        return false;
      }
      if (deliveryZoneId && d.serviceZoneIds.includes(deliveryZoneId)) return true;
      if (governorateId && d.governorateId === governorateId) return true;
      return false;
    });

    const matchingPartners = this.deliveryPartners.filter((p) => {
      if (p.accountStatus !== 'active') return false;
      const hasVehicle = activeVehicles.some((v) => v.partnerId === p.id);
      if (!hasVehicle) return false;
      if (deliveryZoneId && p.serviceZoneIds.includes(deliveryZoneId)) return true;
      if (governorateId && p.governorateId === governorateId) return true;
      return false;
    });

    return matchingDrivers.length > 0 || matchingPartners.length > 0;
  }

  private generateUniquePartnerRegistrationCode(): string {
    for (let i = 0; i < 20; i++) {
      const code = `DP-${Math.floor(100000 + Math.random() * 900000)}`;
      if (!this.deliveryPartners.some((p) => p.registrationCode === code)) {
        return code;
      }
    }
    return `DP-${Date.now().toString().slice(-6)}`;
  }

  // ---- Public Delivery Network Endpoints ----

  registerPublicDeliveryPartner(
    payload: {
      type: DeliveryPartnerType;
      name: string;
      phone: string;
      city?: string;
      governorateId: string;
      serviceZoneIds: string[];
      vehicles: Array<{
        vehicleClass: DeliveryVehicleClass;
        plateNumber: string;
        makeModel: string;
        year?: number;
        capacityUnits: number;
        temperatureSupport: VehicleTemperatureType[];
        docsExpiry?: DeliveryVehicle['docsExpiry'];
      }>;
      docDeclarations?: {
        driver_license?: boolean;
        vehicle_registration?: boolean;
        insurance?: boolean;
        vehicle_inspection?: boolean;
      };
      payoutAccount?: {
        method: 'cash' | 'bank' | 'zaincash';
        accountRef?: string;
      };
      acceptedTerms: boolean;
    },
    clientIp: string
  ) {
    // 1. In-memory IP hourly rate limiting (max 5 requests / hour / IP)
    const ipKey = String(clientIp || 'unknown').trim();
    const nowMs = Date.now();
    const oneHourAgo = nowMs - 60 * 60 * 1000;
    const recentTimestamps = (this.partnerRegistrationRateMap.get(ipKey) || []).filter(
      (ts) => ts >= oneHourAgo
    );
    if (recentTimestamps.length >= 5) {
      const err: any = new Error(
        'تم تجاوز الحد المسموح به لطلبات التسجيل من هذا العنوان خلال الساعة الحالية. حاول لاحقاً.'
      );
      err.statusCode = 429;
      throw err;
    }

    // 2. Validate required inputs
    const partnerType: DeliveryPartnerType =
      payload.type === 'company' ? 'company' : payload.type === 'individual' ? 'individual' : (null as any);
    if (!partnerType) {
      const err: any = new Error('نوع الشريك غير صالح (individual أو company)');
      err.statusCode = 400;
      throw err;
    }

    const cleanName = String(payload.name || '').trim();
    if (cleanName.length < 2) {
      const err: any = new Error('يجب إدخال اسم الشريك أو السائق (حرفان على الأقل)');
      err.statusCode = 400;
      throw err;
    }

    const rawPhone = String(payload.phone || '').trim();
    const normalizedPhone = this.normalizeDeliveryPhone(rawPhone);
    if (normalizedPhone.length < 7) {
      const err: any = new Error('رقم الهاتف غير صالح');
      err.statusCode = 400;
      throw err;
    }

    if (
      this.deliveryPartners.some((p) => this.normalizeDeliveryPhone(p.phone) === normalizedPhone)
    ) {
      const err: any = new Error('يوجد طلب أو شريك توصيل مسجل مسبقاً بنفس رقم الهاتف');
      err.statusCode = 409;
      throw err;
    }

    const gov = this.governorates.find((g) => g.id === payload.governorateId);
    if (!gov) {
      const err: any = new Error('المحافظة المختارة غير موجودة');
      err.statusCode = 400;
      throw err;
    }

    const validZones = Array.isArray(payload.serviceZoneIds)
      ? Array.from(
          new Set(
            payload.serviceZoneIds.filter((zid) =>
              this.deliveryZones.some((z) => z.id === zid)
            )
          )
        )
      : [];
    if (validZones.length === 0) {
      const err: any = new Error('يجب اختيار منطقة توصيل واحدة على الأقل');
      err.statusCode = 400;
      throw err;
    }

    if (payload.acceptedTerms !== true) {
      const err: any = new Error('يجب الموافقة على مسودة الشروط والأحكام لإتمام التسجيل');
      err.statusCode = 400;
      throw err;
    }

    if (!Array.isArray(payload.vehicles) || payload.vehicles.length === 0) {
      const err: any = new Error('يجب إضافة مركبة واحدة على الأقل');
      err.statusCode = 400;
      throw err;
    }

    const validClasses: DeliveryVehicleClass[] = [
      'motorcycle',
      'pickup',
      'small_truck',
      'medium_truck',
      'refrigerated_truck'
    ];
    const validTemps: VehicleTemperatureType[] = ['ambient', 'chilled', 'frozen'];
    const submittedPlates = new Set<string>();

    const normalizedVehicles = payload.vehicles.map((v, idx) => {
      if (!validClasses.includes(v.vehicleClass)) {
        const err: any = new Error(`فئة المركبة رقم ${idx + 1} غير صالحة`);
        err.statusCode = 400;
        throw err;
      }
      const plate = String(v.plateNumber || '').trim();
      const plateKey = this.normalizePlateKey(plate);
      if (!plate || plate.length < 3) {
        const err: any = new Error(`رقم لوحة المركبة رقم ${idx + 1} مطلوب`);
        err.statusCode = 400;
        throw err;
      }
      if (submittedPlates.has(plateKey)) {
        const err: any = new Error(`رقم اللوحة (${plate}) مكرر في نفس الطلب`);
        err.statusCode = 400;
        throw err;
      }
      submittedPlates.add(plateKey);

      if (
        this.deliveryVehicles.some((ev) => this.normalizePlateKey(ev.plateNumber) === plateKey)
      ) {
        const err: any = new Error(`رقم اللوحة (${plate}) مسجل مسبقاً في النظام`);
        err.statusCode = 409;
        throw err;
      }

      const makeModel = String(v.makeModel || '').trim();
      if (!makeModel) {
        const err: any = new Error(`موديل المركبة رقم ${idx + 1} مطلوب`);
        err.statusCode = 400;
        throw err;
      }

      const capacityUnits = Math.round(Number(v.capacityUnits) || 0);
      if (capacityUnits <= 0) {
        const err: any = new Error(`سعة المركبة بالوحدات للمركبة رقم ${idx + 1} غير صالحة`);
        err.statusCode = 400;
        throw err;
      }

      const temps = Array.isArray(v.temperatureSupport)
        ? Array.from(new Set(v.temperatureSupport.filter((t) => validTemps.includes(t))))
        : [];
      if (temps.length === 0) {
        temps.push('ambient');
      }

      return {
        plateNumber: plate,
        vehicleClass: v.vehicleClass,
        makeModel,
        year: v.year ? Number(v.year) : undefined,
        capacityUnits,
        temperatureSupport: temps,
        docsExpiry: v.docsExpiry
      };
    });

    const nowIso = new Date().toISOString();
    const partnerId = `dp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const registrationCode = this.generateUniquePartnerRegistrationCode();

    const decl = payload.docDeclarations || {};
    const checklistKeys: KycChecklistKey[] = [
      'driver_license',
      'vehicle_registration',
      'insurance',
      'vehicle_inspection'
    ];
    const checklist: KycChecklistItem[] = checklistKeys.map((k) => ({
      key: k,
      status: 'pending',
      note: (decl as any)[k] ? 'أفاد مقدم الطلب بتوفر الوثيقة (بانتظار مطابقة الإدارة)' : undefined
    }));

    const payoutMethod =
      payload.payoutAccount?.method === 'bank' || payload.payoutAccount?.method === 'zaincash'
        ? payload.payoutAccount.method
        : 'cash';

    const newPartner: DeliveryPartner = {
      id: partnerId,
      registrationCode,
      type: partnerType,
      name: cleanName,
      phone: rawPhone,
      city: String(payload.city || gov.nameAr).trim() || gov.nameAr,
      governorateId: gov.id,
      serviceZoneIds: validZones,
      accountStatus: 'pending',
      kyc: { checklist },
      payoutAccount: {
        method: payoutMethod,
        accountRef: payload.payoutAccount?.accountRef?.trim() || undefined
      },
      acceptedTermsAt: nowIso,
      termsVersion: 'draft-v1-needs-legal-review',
      createdAt: nowIso
    };

    const createdVehicles: DeliveryVehicle[] = normalizedVehicles.map((nv, idx) => ({
      id: `dveh_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 5)}`,
      ownerType: 'partner',
      partnerId,
      plateNumber: nv.plateNumber,
      vehicleClass: nv.vehicleClass,
      makeModel: nv.makeModel,
      year: nv.year,
      capacityUnits: nv.capacityUnits,
      temperatureSupport: nv.temperatureSupport,
      status: 'pending',
      docsExpiry: nv.docsExpiry,
      createdAt: nowIso
    }));

    this.deliveryPartners.unshift(newPartner);
    for (const v of createdVehicles) {
      this.deliveryVehicles.unshift(v);
    }

    recentTimestamps.push(nowMs);
    this.partnerRegistrationRateMap.set(ipKey, recentTimestamps);

    this.recordAudit({
      at: nowIso,
      actorId: 'public_registration',
      actorName: cleanName,
      action: 'delivery_partner.register_public',
      entityType: 'delivery_partner',
      entityId: partnerId,
      summaryAr: `تقديم طلب تسجيل شريك توصيل جديد: ${cleanName} (${registrationCode})`,
      summaryEn: `Submitted public delivery partner application: ${cleanName} (${registrationCode})`,
      before: null,
      after: {
        id: partnerId,
        registrationCode,
        type: partnerType,
        governorateId: gov.id,
        serviceZoneIds: validZones,
        vehiclesCount: createdVehicles.length,
        accountStatus: 'pending'
      },
      reason: 'طلب تسجيل عام عبر بوابة شركاء التوصيل'
    });

    return {
      partnerId,
      registrationCode,
      status: newPartner.accountStatus,
      vehiclesCount: createdVehicles.length,
      createdAt: nowIso
    };
  }

  getPublicDeliveryPartnerStatus(phone: string, registrationCode: string) {
    const normPhone = this.normalizeDeliveryPhone(phone);
    const normCode = String(registrationCode || '').trim().toUpperCase();
    if (!normPhone || !normCode) {
      const err: any = new Error('رقم الهاتف ورمز الطلب مطلوبان للاستعلام');
      err.statusCode = 400;
      throw err;
    }

    const partner = this.deliveryPartners.find(
      (p) =>
        this.normalizeDeliveryPhone(p.phone) === normPhone &&
        p.registrationCode.toUpperCase() === normCode
    );
    if (!partner) {
      const err: any = new Error('لم يتم العثور على طلب مطابق لرقم الهاتف ورمز المتابعة');
      err.statusCode = 404;
      throw err;
    }

    // Minimal least-data response — never leak notes, KYC notes, vehicles, or payout details
    return {
      registrationCode: partner.registrationCode,
      type: partner.type,
      status: partner.accountStatus,
      statusReason:
        partner.accountStatus === 'rejected' || partner.accountStatus === 'suspended'
          ? partner.statusReason
          : undefined,
      createdAt: partner.createdAt,
      statusChangedAt: partner.statusChangedAt
    };
  }

  getPublicDeliveryQuote(payload: {
    supplierId: string;
    deliveryZoneId: string;
    items?: Array<{ barcode?: string; quantity: number; storageType?: ProductStorageKind }>;
    units?: number;
    requiredTemperature?: VehicleTemperatureType;
    orderValueIQD?: number;
  }) {
    const supplier = this.suppliers.find((s) => s.id === payload.supplierId);
    if (!supplier) {
      const err: any = new Error('المورد المطلوب غير موجود');
      err.statusCode = 404;
      throw err;
    }

    const zone = this.deliveryZones.find((z) => z.id === payload.deliveryZoneId);
    if (!zone) {
      const err: any = new Error('منطقة التوصيل غير موجودة');
      err.statusCode = 404;
      throw err;
    }

    let totalUnits = Math.max(0, Math.round(Number(payload.units) || 0));
    let computedValueIQD = 0;
    const storageTypes: Array<ProductStorageKind | undefined> = [];

    if (Array.isArray(payload.items) && payload.items.length > 0) {
      totalUnits = 0;
      for (const item of payload.items) {
        const qty = Math.max(1, Math.round(Number(item.quantity) || 1));
        totalUnits += qty;
        const product = item.barcode
          ? this.products.find((p) => p.barcode === item.barcode)
          : undefined;
        const st = item.storageType || product?.storageType || 'ambient';
        storageTypes.push(st);
        const offer = item.barcode
          ? this.offers.find(
              (o) => o.barcode === item.barcode && o.supplierId === supplier.id
            ) || this.offers.find((o) => o.barcode === item.barcode)
          : undefined;
        if (offer) {
          computedValueIQD += offer.priceIQD * qty;
        }
      }
    }

    if (totalUnits <= 0) totalUnits = 1;

    const requiredTemperature: VehicleTemperatureType = payload.requiredTemperature
      ? payload.requiredTemperature
      : getRequiredTemperatureForStorageTypes(storageTypes);

    const orderValueIQD =
      payload.orderValueIQD !== undefined && payload.orderValueIQD !== null
        ? Math.max(0, Math.round(Number(payload.orderValueIQD) || 0))
        : computedValueIQD;

    const hasActiveCoverage = this.hasActivePlatformCoverageForZone(zone.governorateId, zone.id);

    const evaluated = getDeliveryOptionsForSupplier({
      supplier,
      zone: { governorateId: zone.governorateId, deliveryZoneId: zone.id },
      units: totalUnits,
      requiredTemperature,
      orderValueIQD,
      rules: this.deliveryRateRules,
      settings: this.deliveryPlatformSettings,
      hasActivePlatformCoverage: hasActiveCoverage
    });

    const suggestedVehicleClass = evaluated.platformQuote?.vehicleClass;
    const matchingVehicles = suggestedVehicleClass
      ? this.deliveryVehicles
          .filter((v) =>
            isVehicleSuitable(v, {
              units: totalUnits,
              requiredTemperature,
              requireActiveStatus: true
            })
          )
          .slice(0, 5)
          .map((v) => ({
            id: v.id,
            vehicleClass: v.vehicleClass,
            makeModel: v.makeModel,
            capacityUnits: v.capacityUnits,
            temperatureSupport: v.temperatureSupport
          }))
      : [];

    const governorate = this.governorates.find((g) => g.id === zone.governorateId);

    return {
      supplierId: supplier.id,
      supplierName: supplier.companyName,
      governorateId: zone.governorateId,
      governorateNameAr: governorate?.nameAr || zone.governorateId,
      governorateNameEn: governorate?.nameEn || zone.governorateId,
      deliveryZoneId: zone.id,
      deliveryZoneNameAr: zone.nameAr,
      deliveryZoneNameEn: zone.nameEn,
      units: totalUnits,
      requiredTemperature,
      orderValueIQD,
      hasActivePlatformCoverage: hasActiveCoverage,
      availableOptions: evaluated.availableOptions,
      options: evaluated.options,
      platformQuote: evaluated.platformQuote,
      matchingActiveVehicles: matchingVehicles
    };
  }

  // ---- Admin Delivery Network Overview & Operations ----

  getAdminDeliveryOverview() {
    const partnersByStatus = {
      pending: this.deliveryPartners.filter((p) => p.accountStatus === 'pending').length,
      active: this.deliveryPartners.filter((p) => p.accountStatus === 'active').length,
      suspended: this.deliveryPartners.filter((p) => p.accountStatus === 'suspended').length,
      rejected: this.deliveryPartners.filter((p) => p.accountStatus === 'rejected').length,
      archived: this.deliveryPartners.filter((p) => p.accountStatus === 'archived').length,
      total: this.deliveryPartners.length
    };

    const expiringVehicles = this.getExpiringVehicleDocsSummary(30);
    const vehiclesByStatus = {
      pending: this.deliveryVehicles.filter((v) => v.status === 'pending').length,
      active: this.deliveryVehicles.filter((v) => v.status === 'active').length,
      maintenance: this.deliveryVehicles.filter((v) => v.status === 'maintenance').length,
      suspended: this.deliveryVehicles.filter((v) => v.status === 'suspended').length,
      rejected: this.deliveryVehicles.filter((v) => v.status === 'rejected').length,
      platformOwned: this.deliveryVehicles.filter((v) => v.ownerType === 'platform').length,
      partnerOwned: this.deliveryVehicles.filter((v) => v.ownerType === 'partner').length,
      expiringDocsCount: expiringVehicles.length,
      total: this.deliveryVehicles.length
    };

    const driversByStatus = {
      platformActive: this.deliveryDrivers.filter(
        (d) => d.providerType === 'platform' && d.accountStatus === 'active'
      ).length,
      partnerActive: this.deliveryDrivers.filter(
        (d) => d.providerType === 'partner' && d.accountStatus === 'active'
      ).length,
      pending: this.deliveryDrivers.filter((d) => d.accountStatus === 'pending').length,
      suspended: this.deliveryDrivers.filter((d) => d.accountStatus === 'suspended').length,
      total: this.deliveryDrivers.length
    };

    const activeRateRulesCount = this.deliveryRateRules.filter((r) => r.isActive).length;
    const platformEnabledSuppliersCount = this.suppliers.filter(
      (s) => s.deliverySettings?.allowPlatformDelivery
    ).length;
    const ownFleetSuppliersCount = this.suppliers.filter(
      (s) => s.deliverySettings?.hasOwnFleet
    ).length;
    const suppliersWithNoOptionCount = this.suppliers.filter((s) => {
      const ds = s.deliverySettings;
      if (!ds) return false;
      return !ds.hasOwnFleet && !ds.allowPlatformDelivery && !ds.allowStorePickup;
    }).length;

    return {
      partners: partnersByStatus,
      vehicles: vehiclesByStatus,
      drivers: driversByStatus,
      rates: {
        activeRulesCount: activeRateRulesCount,
        totalRulesCount: this.deliveryRateRules.length,
        freeDeliveryThresholdIQD: this.deliveryPlatformSettings.freeDeliveryThresholdIQD
      },
      suppliers: {
        total: this.suppliers.length,
        ownFleetCount: ownFleetSuppliersCount,
        platformEnabledCount: platformEnabledSuppliersCount,
        noOptionCount: suppliersWithNoOptionCount
      },
      jobs: this.getAdminDispatchSummary(),
      expiringVehicles
    };
  }

  private enrichDeliveryPartner(p: DeliveryPartner) {
    const gov = this.governorates.find((g) => g.id === p.governorateId);
    const zoneObjects = p.serviceZoneIds
      .map((zid) => this.deliveryZones.find((z) => z.id === zid))
      .filter((z): z is DeliveryZone => Boolean(z));
    const vehicles = this.deliveryVehicles.filter((v) => v.partnerId === p.id);
    const drivers = this.deliveryDrivers.filter((d) => d.partnerId === p.id);
    return {
      ...p,
      governorateNameAr: gov?.nameAr || p.governorateId,
      governorateNameEn: gov?.nameEn || p.governorateId,
      serviceZones: zoneObjects.map((z) => ({ id: z.id, nameAr: z.nameAr, nameEn: z.nameEn })),
      vehiclesCount: vehicles.length,
      activeVehiclesCount: vehicles.filter((v) => v.status === 'active').length,
      driversCount: drivers.length,
      activeDriversCount: drivers.filter((d) => d.accountStatus === 'active').length
    };
  }

  getAdminDeliveryPartners(params?: {
    statusTab?: string;
    type?: string;
    governorateId?: string;
    search?: string;
  }) {
    const all = this.deliveryPartners.map((p) => this.enrichDeliveryPartner(p));
    const statusCounts = {
      all: all.length,
      pending: all.filter((p) => p.accountStatus === 'pending').length,
      active: all.filter((p) => p.accountStatus === 'active').length,
      suspended: all.filter((p) => p.accountStatus === 'suspended').length,
      rejected_archived: all.filter(
        (p) => p.accountStatus === 'rejected' || p.accountStatus === 'archived'
      ).length
    };

    let filtered = [...all];
    if (params?.statusTab && params.statusTab !== 'all') {
      if (params.statusTab === 'rejected_archived') {
        filtered = filtered.filter(
          (p) => p.accountStatus === 'rejected' || p.accountStatus === 'archived'
        );
      } else {
        filtered = filtered.filter((p) => p.accountStatus === params.statusTab);
      }
    }
    if (params?.type && params.type !== 'all') {
      filtered = filtered.filter((p) => p.type === params.type);
    }
    if (params?.governorateId && params.governorateId !== 'all') {
      filtered = filtered.filter((p) => p.governorateId === params.governorateId);
    }
    if (params?.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.phone.toLowerCase().includes(q) ||
          p.registrationCode.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    return {
      items: filtered,
      total: filtered.length,
      statusCounts
    };
  }

  getAdminDeliveryPartnerDetail(id: string) {
    const partner = this.deliveryPartners.find((p) => p.id === id);
    if (!partner) {
      const err: any = new Error('شريك التوصيل غير موجود');
      err.statusCode = 404;
      throw err;
    }
    const enriched = this.enrichDeliveryPartner(partner);
    const vehicles = this.deliveryVehicles
      .filter((v) => v.partnerId === partner.id)
      .map((v) => this.enrichDeliveryVehicle(v));
    const drivers = this.deliveryDrivers
      .filter((d) => d.partnerId === partner.id)
      .map((d) => this.enrichDeliveryDriver(d));
    const vehicleIds = new Set(vehicles.map((v) => v.id));
    const driverIds = new Set(drivers.map((d) => d.id));
    const auditLogs = this.auditLogs
      .filter(
        (l) =>
          (l.entityType === 'delivery_partner' && l.entityId === partner.id) ||
          (l.entityType === 'delivery_vehicle' && vehicleIds.has(l.entityId)) ||
          (l.entityType === 'delivery_driver' && driverIds.has(l.entityId))
      )
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
      .slice(0, 50);

    return {
      partner: enriched,
      vehicles,
      drivers,
      auditLogs
    };
  }

  transitionAdminDeliveryPartner(params: {
    id: string;
    action: 'approve' | 'reject' | 'suspend' | 'reactivate' | 'archive';
    reason: string;
    actor: { actorId: string; actorName: string };
  }) {
    const partner = this.deliveryPartners.find((p) => p.id === params.id);
    if (!partner) {
      const err: any = new Error('شريك التوصيل غير موجود');
      err.statusCode = 404;
      throw err;
    }

    const cleanReason = this.requireDeliveryReason(params.reason);
    const current = partner.accountStatus;
    const allowedTransitions: Record<DeliveryAccountStatus, Array<typeof params.action>> = {
      pending: ['approve', 'reject', 'archive'],
      active: ['suspend', 'archive'],
      suspended: ['reactivate', 'archive'],
      rejected: ['approve', 'archive'],
      archived: ['reactivate']
    };

    const allowed = allowedTransitions[current] || [];
    if (!allowed.includes(params.action)) {
      const err: any = new Error(
        `لا يمكن تنفيذ إجراء (${params.action}) عندما تكون حالة الشريك (${current})`
      );
      err.statusCode = 400;
      throw err;
    }

    const nextStatusMap: Record<typeof params.action, DeliveryAccountStatus> = {
      approve: 'active',
      reject: 'rejected',
      suspend: 'suspended',
      reactivate: 'active',
      archive: 'archived'
    };
    const nextStatus = nextStatusMap[params.action];
    const nowIso = new Date().toISOString();

    const before = {
      accountStatus: partner.accountStatus,
      statusReason: partner.statusReason
    };

    partner.accountStatus = nextStatus;
    partner.statusReason = cleanReason;
    partner.statusChangedAt = nowIso;
    partner.statusChangedBy = params.actor.actorId;

    let autoCreatedDriverId: string | undefined;

    // On approval of an individual partner, auto-create DeliveryDriver if missing
    if (params.action === 'approve' && partner.type === 'individual') {
      const existingDriver = this.deliveryDrivers.find((d) => d.partnerId === partner.id);
      if (!existingDriver) {
        const partnerVehicle =
          this.deliveryVehicles.find(
            (v) => v.partnerId === partner.id && v.status === 'active'
          ) || this.deliveryVehicles.find((v) => v.partnerId === partner.id && v.status === 'pending');

        const newDriverId = `ddrv_part_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
        const newDriver: DeliveryDriver = {
          id: newDriverId,
          providerType: 'partner',
          partnerId: partner.id,
          name: partner.name,
          phone: partner.phone,
          licenseNo: partner.kyc?.licenseNo,
          assignedVehicleId:
            partnerVehicle && partnerVehicle.status === 'active' ? partnerVehicle.id : undefined,
          governorateId: partner.governorateId,
          serviceZoneIds: [...partner.serviceZoneIds],
          accountStatus: 'active',
          statusReason: `إنشاء تلقائي عند اعتماد الشريك الفردي: ${cleanReason}`,
          statusChangedAt: nowIso,
          statusChangedBy: params.actor.actorId,
          isAvailable: true,
          createdAt: nowIso
        };
        this.deliveryDrivers.unshift(newDriver);
        autoCreatedDriverId = newDriverId;
      } else if (existingDriver.accountStatus === 'pending') {
        existingDriver.accountStatus = 'active';
        existingDriver.statusReason = cleanReason;
        existingDriver.statusChangedAt = nowIso;
        existingDriver.statusChangedBy = params.actor.actorId;
      }
    }

    this.recordAudit({
      at: nowIso,
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: `delivery_partner.${params.action}`,
      entityType: 'delivery_partner',
      entityId: partner.id,
      summaryAr: `${params.action === 'approve' ? 'اعتماد' : params.action === 'reject' ? 'رفض' : params.action === 'suspend' ? 'إيقاف' : params.action === 'reactivate' ? 'إعادة تفعيل' : 'أرشفة'} شريك التوصيل: ${partner.name}`,
      summaryEn: `Delivery partner ${params.action}: ${partner.name}`,
      before,
      after: {
        accountStatus: partner.accountStatus,
        statusReason: partner.statusReason,
        autoCreatedDriverId: autoCreatedDriverId || null
      },
      reason: cleanReason
    });

    return this.getAdminDeliveryPartnerDetail(partner.id);
  }

  updateAdminDeliveryPartner(params: {
    id: string;
    name?: string;
    city?: string;
    governorateId?: string;
    serviceZoneIds?: string[];
    reason: string;
    actor: { actorId: string; actorName: string };
  }) {
    const partner = this.deliveryPartners.find((p) => p.id === params.id);
    if (!partner) {
      const err: any = new Error('شريك التوصيل غير موجود');
      err.statusCode = 404;
      throw err;
    }
    const cleanReason = this.requireDeliveryReason(params.reason);
    const before = {
      name: partner.name,
      city: partner.city,
      governorateId: partner.governorateId,
      serviceZoneIds: [...partner.serviceZoneIds]
    };

    if (typeof params.name === 'string' && params.name.trim().length >= 2) {
      partner.name = params.name.trim();
    }
    if (typeof params.city === 'string' && params.city.trim()) {
      partner.city = params.city.trim();
    }
    if (params.governorateId && this.governorates.some((g) => g.id === params.governorateId)) {
      partner.governorateId = params.governorateId;
    }
    if (Array.isArray(params.serviceZoneIds)) {
      const valid = Array.from(
        new Set(params.serviceZoneIds.filter((zid) => this.deliveryZones.some((z) => z.id === zid)))
      );
      if (valid.length === 0) {
        const err: any = new Error('يجب اختيار منطقة توصيل واحدة على الأقل');
        err.statusCode = 400;
        throw err;
      }
      partner.serviceZoneIds = valid;
    }

    this.recordAudit({
      at: new Date().toISOString(),
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'delivery_partner.update',
      entityType: 'delivery_partner',
      entityId: partner.id,
      summaryAr: `تحديث بيانات شريك التوصيل: ${partner.name}`,
      summaryEn: `Updated delivery partner profile: ${partner.name}`,
      before,
      after: {
        name: partner.name,
        city: partner.city,
        governorateId: partner.governorateId,
        serviceZoneIds: partner.serviceZoneIds
      },
      reason: cleanReason
    });

    return this.getAdminDeliveryPartnerDetail(partner.id);
  }

  updateAdminDeliveryPartnerKyc(params: {
    id: string;
    licenseNo?: string;
    checklist?: KycChecklistItem[];
    actor: { actorId: string; actorName: string };
  }) {
    const partner = this.deliveryPartners.find((p) => p.id === params.id);
    if (!partner) {
      const err: any = new Error('شريك التوصيل غير موجود');
      err.statusCode = 404;
      throw err;
    }
    const prevKyc: AccountKycInfo = partner.kyc || { checklist: [] };
    const before = JSON.parse(JSON.stringify(prevKyc));

    const validKeys: KycChecklistKey[] = [
      'driver_license',
      'vehicle_registration',
      'insurance',
      'vehicle_inspection',
      'commercial_license',
      'owner_id',
      'phone_verified'
    ];
    const nextChecklist: KycChecklistItem[] = Array.isArray(params.checklist)
      ? params.checklist
          .filter((item) => validKeys.includes(item.key))
          .map((item) => ({
            key: item.key,
            status:
              item.status === 'approved' || item.status === 'rejected' ? item.status : 'pending',
            note: typeof item.note === 'string' && item.note.trim() ? item.note.trim() : undefined
          }))
      : prevKyc.checklist;

    partner.kyc = {
      licenseNo:
        params.licenseNo !== undefined ? params.licenseNo.trim() || undefined : prevKyc.licenseNo,
      checklist: nextChecklist
    };

    this.recordAudit({
      at: new Date().toISOString(),
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'delivery_partner.update_kyc',
      entityType: 'delivery_partner',
      entityId: partner.id,
      summaryAr: `تحديث وثائق التحقق لشريك التوصيل: ${partner.name}`,
      summaryEn: `Updated delivery partner KYC: ${partner.name}`,
      before,
      after: partner.kyc,
      reason: 'مراجعة وتحديث قائمة التحقق للوثائق'
    });

    return this.getAdminDeliveryPartnerDetail(partner.id);
  }

  addAdminDeliveryPartnerNote(params: {
    id: string;
    text: string;
    actor: { actorId: string; actorName: string };
  }) {
    const partner = this.deliveryPartners.find((p) => p.id === params.id);
    if (!partner) {
      const err: any = new Error('شريك التوصيل غير موجود');
      err.statusCode = 404;
      throw err;
    }
    const clean = String(params.text || '').trim();
    if (clean.length < 3) {
      const err: any = new Error('نص الملاحظة قصير جداً');
      err.statusCode = 400;
      throw err;
    }
    if (!partner.adminNotes) partner.adminNotes = [];
    const nowIso = new Date().toISOString();
    const note: AdminInternalNote = {
      id: `dpnote_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      at: nowIso,
      author: params.actor.actorName,
      text: clean
    };
    partner.adminNotes.unshift(note);

    this.recordAudit({
      at: nowIso,
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'delivery_partner.add_note',
      entityType: 'delivery_partner',
      entityId: partner.id,
      summaryAr: `إضافة ملاحظة داخلية لشريك التوصيل: ${partner.name}`,
      summaryEn: `Added internal note to delivery partner: ${partner.name}`,
      before: null,
      after: { noteText: clean },
      reason: clean
    });

    return note;
  }

  // ---- Admin Delivery Vehicles ----

  private enrichDeliveryVehicle(v: DeliveryVehicle) {
    const partner = v.partnerId
      ? this.deliveryPartners.find((p) => p.id === v.partnerId)
      : undefined;
    const assignedDrivers = this.deliveryDrivers.filter((d) => d.assignedVehicleId === v.id);
    const expiringSummary = this.getExpiringVehicleDocsSummary(30).find((e) => e.id === v.id);
    return {
      ...v,
      partnerName: partner?.name,
      partnerStatus: partner?.accountStatus,
      assignedDrivers: assignedDrivers.map((d) => ({ id: d.id, name: d.name, accountStatus: d.accountStatus })),
      hasExpiringDocs: Boolean(expiringSummary),
      hasExpiredDocs: Boolean(expiringSummary?.hasExpired),
      expiringDocs: expiringSummary?.expiringDocs || []
    };
  }

  getAdminDeliveryVehicles(params?: {
    ownerType?: string;
    status?: string;
    vehicleClass?: string;
    expiringOnly?: boolean;
    search?: string;
  }) {
    const all = this.deliveryVehicles.map((v) => this.enrichDeliveryVehicle(v));
    let filtered = [...all];
    if (params?.ownerType && params.ownerType !== 'all') {
      filtered = filtered.filter((v) => v.ownerType === params.ownerType);
    }
    if (params?.status && params.status !== 'all') {
      filtered = filtered.filter((v) => v.status === params.status);
    }
    if (params?.vehicleClass && params.vehicleClass !== 'all') {
      filtered = filtered.filter((v) => v.vehicleClass === params.vehicleClass);
    }
    if (params?.expiringOnly) {
      filtered = filtered.filter((v) => v.hasExpiringDocs);
    }
    if (params?.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.plateNumber.toLowerCase().includes(q) ||
          v.makeModel.toLowerCase().includes(q) ||
          (v.partnerName || '').toLowerCase().includes(q)
      );
    }
    filtered.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    return {
      items: filtered,
      total: filtered.length,
      counts: {
        all: all.length,
        pending: all.filter((v) => v.status === 'pending').length,
        active: all.filter((v) => v.status === 'active').length,
        maintenance: all.filter((v) => v.status === 'maintenance').length,
        suspended: all.filter((v) => v.status === 'suspended').length,
        expiring: all.filter((v) => v.hasExpiringDocs).length
      }
    };
  }

  createAdminDeliveryVehicle(params: {
    ownerType: DeliveryProviderType;
    partnerId?: string;
    plateNumber: string;
    vehicleClass: DeliveryVehicleClass;
    makeModel: string;
    year?: number;
    capacityUnits: number;
    temperatureSupport: VehicleTemperatureType[];
    status?: DeliveryVehicleStatus;
    docsExpiry?: DeliveryVehicle['docsExpiry'];
    reason: string;
    actor: { actorId: string; actorName: string };
  }) {
    const cleanReason = this.requireDeliveryReason(params.reason);
    const ownerType: DeliveryProviderType =
      params.ownerType === 'partner' ? 'partner' : 'platform';
    if (ownerType === 'partner') {
      if (!params.partnerId || !this.deliveryPartners.some((p) => p.id === params.partnerId)) {
        const err: any = new Error('يجب تحديد شريك توصيل صالح لمركبة الشريك');
        err.statusCode = 400;
        throw err;
      }
    }

    const plate = String(params.plateNumber || '').trim();
    const plateKey = this.normalizePlateKey(plate);
    if (plate.length < 3) {
      const err: any = new Error('رقم اللوحة مطلوب');
      err.statusCode = 400;
      throw err;
    }
    if (this.deliveryVehicles.some((v) => this.normalizePlateKey(v.plateNumber) === plateKey)) {
      const err: any = new Error(`رقم اللوحة (${plate}) مسجل مسبقاً`);
      err.statusCode = 409;
      throw err;
    }

    const makeModel = String(params.makeModel || '').trim();
    if (!makeModel) {
      const err: any = new Error('نوع/موديل المركبة مطلوب');
      err.statusCode = 400;
      throw err;
    }
    const capacityUnits = Math.round(Number(params.capacityUnits) || 0);
    if (capacityUnits <= 0) {
      const err: any = new Error('سعة المركبة يجب أن تكون أكبر من صفر');
      err.statusCode = 400;
      throw err;
    }

    const temps: VehicleTemperatureType[] =
      Array.isArray(params.temperatureSupport) && params.temperatureSupport.length > 0
        ? Array.from(new Set(params.temperatureSupport))
        : ['ambient'];

    const nowIso = new Date().toISOString();
    const initialStatus: DeliveryVehicleStatus =
      params.status || (ownerType === 'platform' ? 'active' : 'pending');

    const newVehicle: DeliveryVehicle = {
      id: `dveh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ownerType,
      partnerId: ownerType === 'partner' ? params.partnerId : undefined,
      plateNumber: plate,
      vehicleClass: params.vehicleClass,
      makeModel,
      year: params.year ? Number(params.year) : undefined,
      capacityUnits,
      temperatureSupport: temps,
      status: initialStatus,
      statusReason: cleanReason,
      statusChangedAt: nowIso,
      statusChangedBy: params.actor.actorId,
      docsExpiry: params.docsExpiry,
      createdAt: nowIso
    };

    this.deliveryVehicles.unshift(newVehicle);

    this.recordAudit({
      at: nowIso,
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'delivery_vehicle.create',
      entityType: 'delivery_vehicle',
      entityId: newVehicle.id,
      summaryAr: `إضافة مركبة توصيل جديدة (${plate} — ${VEHICLE_CLASS_LABELS[params.vehicleClass].ar})`,
      summaryEn: `Created delivery vehicle ${plate} (${params.vehicleClass})`,
      before: null,
      after: newVehicle,
      reason: cleanReason
    });

    return this.enrichDeliveryVehicle(newVehicle);
  }

  updateAdminDeliveryVehicleDocs(params: {
    id: string;
    docsExpiry: DeliveryVehicle['docsExpiry'];
    reason: string;
    actor: { actorId: string; actorName: string };
  }) {
    const vehicle = this.deliveryVehicles.find((v) => v.id === params.id);
    if (!vehicle) {
      const err: any = new Error('المركبة غير موجودة');
      err.statusCode = 404;
      throw err;
    }
    const cleanReason = this.requireDeliveryReason(params.reason);
    const before = vehicle.docsExpiry ? { ...vehicle.docsExpiry } : null;
    vehicle.docsExpiry = {
      registrationExpiry: params.docsExpiry?.registrationExpiry?.trim() || undefined,
      insuranceExpiry: params.docsExpiry?.insuranceExpiry?.trim() || undefined,
      inspectionExpiry: params.docsExpiry?.inspectionExpiry?.trim() || undefined
    };

    this.recordAudit({
      at: new Date().toISOString(),
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'delivery_vehicle.update_docs',
      entityType: 'delivery_vehicle',
      entityId: vehicle.id,
      summaryAr: `تحديث تواريخ وثائق المركبة ${vehicle.plateNumber}`,
      summaryEn: `Updated document expiry dates for vehicle ${vehicle.plateNumber}`,
      before,
      after: vehicle.docsExpiry,
      reason: cleanReason
    });

    return this.enrichDeliveryVehicle(vehicle);
  }

  transitionAdminDeliveryVehicle(params: {
    id: string;
    action: 'approve' | 'reject' | 'activate' | 'suspend' | 'maintenance';
    reason: string;
    actor: { actorId: string; actorName: string };
  }) {
    const vehicle = this.deliveryVehicles.find((v) => v.id === params.id);
    if (!vehicle) {
      const err: any = new Error('المركبة غير موجودة');
      err.statusCode = 404;
      throw err;
    }
    const cleanReason = this.requireDeliveryReason(params.reason);

    const statusMap: Record<typeof params.action, DeliveryVehicleStatus> = {
      approve: 'active',
      activate: 'active',
      reject: 'rejected',
      suspend: 'suspended',
      maintenance: 'maintenance'
    };
    const nextStatus = statusMap[params.action];
    if (nextStatus === 'active' && vehicle.ownerType === 'partner' && vehicle.partnerId) {
      const partner = this.deliveryPartners.find((p) => p.id === vehicle.partnerId);
      if (partner && partner.accountStatus !== 'active') {
        const err: any = new Error(
          `لا يمكن تفعيل المركبة لأن حالة الشريك المالك (${partner.name}) هي ${partner.accountStatus}`
        );
        err.statusCode = 400;
        throw err;
      }
    }

    const before = { status: vehicle.status, statusReason: vehicle.statusReason };
    const nowIso = new Date().toISOString();
    vehicle.status = nextStatus;
    vehicle.statusReason = cleanReason;
    vehicle.statusChangedAt = nowIso;
    vehicle.statusChangedBy = params.actor.actorId;

    this.recordAudit({
      at: nowIso,
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: `delivery_vehicle.${params.action}`,
      entityType: 'delivery_vehicle',
      entityId: vehicle.id,
      summaryAr: `تغيير حالة المركبة (${vehicle.plateNumber}) إلى ${nextStatus}`,
      summaryEn: `Vehicle ${vehicle.plateNumber} -> ${nextStatus}`,
      before,
      after: { status: vehicle.status, statusReason: vehicle.statusReason },
      reason: cleanReason
    });

    return this.enrichDeliveryVehicle(vehicle);
  }

  // ---- Admin Delivery Drivers (Platform & Partner Drivers, separate from Van DriverProfile) ----

  private enrichDeliveryDriver(d: DeliveryDriver) {
    const partner = d.partnerId
      ? this.deliveryPartners.find((p) => p.id === d.partnerId)
      : undefined;
    const vehicle = d.assignedVehicleId
      ? this.deliveryVehicles.find((v) => v.id === d.assignedVehicleId)
      : undefined;
    const gov = this.governorates.find((g) => g.id === d.governorateId);
    return {
      ...d,
      partnerName: partner?.name,
      vehiclePlate: vehicle?.plateNumber,
      vehicleClass: vehicle?.vehicleClass,
      vehicleMakeModel: vehicle?.makeModel,
      governorateNameAr: gov?.nameAr || d.governorateId,
      governorateNameEn: gov?.nameEn || d.governorateId
    };
  }

  getAdminDeliveryDrivers(params?: {
    providerType?: string;
    status?: string;
    governorateId?: string;
    search?: string;
  }) {
    const all = this.deliveryDrivers.map((d) => this.enrichDeliveryDriver(d));
    let filtered = [...all];
    if (params?.providerType && params.providerType !== 'all') {
      filtered = filtered.filter((d) => d.providerType === params.providerType);
    }
    if (params?.status && params.status !== 'all') {
      filtered = filtered.filter((d) => d.accountStatus === params.status);
    }
    if (params?.governorateId && params.governorateId !== 'all') {
      filtered = filtered.filter((d) => d.governorateId === params.governorateId);
    }
    if (params?.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.phone.toLowerCase().includes(q) ||
          (d.partnerName || '').toLowerCase().includes(q) ||
          (d.vehiclePlate || '').toLowerCase().includes(q)
      );
    }
    filtered.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    return {
      items: filtered,
      total: filtered.length,
      counts: {
        all: all.length,
        platform: all.filter((d) => d.providerType === 'platform').length,
        partner: all.filter((d) => d.providerType === 'partner').length,
        active: all.filter((d) => d.accountStatus === 'active').length,
        pending: all.filter((d) => d.accountStatus === 'pending').length,
        suspended: all.filter((d) => d.accountStatus === 'suspended').length
      }
    };
  }

  createAdminDeliveryDriver(params: {
    providerType: DeliveryProviderType;
    partnerId?: string;
    name: string;
    phone: string;
    licenseNo?: string;
    licenseExpiry?: string;
    assignedVehicleId?: string;
    governorateId: string;
    serviceZoneIds: string[];
    reason: string;
    actor: { actorId: string; actorName: string };
  }) {
    const cleanReason = this.requireDeliveryReason(params.reason);
    const providerType: DeliveryProviderType =
      params.providerType === 'partner' ? 'partner' : 'platform';
    if (providerType === 'partner') {
      this.assertDeliveryPartnerOperable(params.partnerId || '');
    }

    const name = String(params.name || '').trim();
    if (name.length < 2) {
      const err: any = new Error('اسم السائق مطلوب');
      err.statusCode = 400;
      throw err;
    }
    const phone = String(params.phone || '').trim();
    const normPhone = this.normalizeDeliveryPhone(phone);
    if (normPhone.length < 7) {
      const err: any = new Error('رقم هاتف السائق غير صالح');
      err.statusCode = 400;
      throw err;
    }
    if (
      this.deliveryDrivers.some((d) => this.normalizeDeliveryPhone(d.phone) === normPhone)
    ) {
      const err: any = new Error('رقم هاتف السائق مسجل مسبقاً في سجل سائقي شبكة التوصيل');
      err.statusCode = 409;
      throw err;
    }

    const gov = this.governorates.find((g) => g.id === params.governorateId);
    if (!gov) {
      const err: any = new Error('المحافظة المختارة غير صالحة');
      err.statusCode = 400;
      throw err;
    }

    const zones = Array.isArray(params.serviceZoneIds)
      ? Array.from(
          new Set(params.serviceZoneIds.filter((zid) => this.deliveryZones.some((z) => z.id === zid)))
        )
      : [];
    if (zones.length === 0) {
      const err: any = new Error('يجب تحديد منطقة عمل واحدة على الأقل للسائق');
      err.statusCode = 400;
      throw err;
    }

    let assignedVehicleId: string | undefined;
    if (params.assignedVehicleId) {
      this.assertDeliveryVehicleOperable(params.assignedVehicleId);
      assignedVehicleId = params.assignedVehicleId;
    }

    const nowIso = new Date().toISOString();
    const newDriver: DeliveryDriver = {
      id: `ddrv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      providerType,
      partnerId: providerType === 'partner' ? params.partnerId : undefined,
      name,
      phone,
      licenseNo: params.licenseNo?.trim() || undefined,
      licenseExpiry: params.licenseExpiry?.trim() || undefined,
      assignedVehicleId,
      governorateId: gov.id,
      serviceZoneIds: zones,
      accountStatus: 'active',
      statusReason: cleanReason,
      statusChangedAt: nowIso,
      statusChangedBy: params.actor.actorId,
      isAvailable: true,
      createdAt: nowIso
    };

    this.deliveryDrivers.unshift(newDriver);

    this.recordAudit({
      at: nowIso,
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'delivery_driver.create',
      entityType: 'delivery_driver',
      entityId: newDriver.id,
      summaryAr: `إضافة سائق شبكة التوصيل (${name}) — ${providerType === 'platform' ? 'تابع للمنصة' : 'تابع لشريك'}`,
      summaryEn: `Created delivery driver ${name} (${providerType})`,
      before: null,
      after: newDriver,
      reason: cleanReason
    });

    return this.enrichDeliveryDriver(newDriver);
  }

  updateAdminDeliveryDriver(params: {
    id: string;
    assignedVehicleId?: string | null;
    serviceZoneIds?: string[];
    isAvailable?: boolean;
    licenseNo?: string;
    licenseExpiry?: string;
    reason: string;
    actor: { actorId: string; actorName: string };
  }) {
    const driver = this.deliveryDrivers.find((d) => d.id === params.id);
    if (!driver) {
      const err: any = new Error('السائق غير موجود');
      err.statusCode = 404;
      throw err;
    }
    const cleanReason = this.requireDeliveryReason(params.reason);
    const before = {
      assignedVehicleId: driver.assignedVehicleId || null,
      serviceZoneIds: [...driver.serviceZoneIds],
      isAvailable: driver.isAvailable
    };

    if (params.assignedVehicleId !== undefined) {
      if (params.assignedVehicleId === null || params.assignedVehicleId === '') {
        driver.assignedVehicleId = undefined;
      } else {
        this.assertDeliveryVehicleOperable(params.assignedVehicleId);
        driver.assignedVehicleId = params.assignedVehicleId;
      }
    }
    if (Array.isArray(params.serviceZoneIds) && params.serviceZoneIds.length > 0) {
      driver.serviceZoneIds = Array.from(
        new Set(params.serviceZoneIds.filter((zid) => this.deliveryZones.some((z) => z.id === zid)))
      );
    }
    if (typeof params.isAvailable === 'boolean') {
      driver.isAvailable = params.isAvailable;
    }
    if (params.licenseNo !== undefined) driver.licenseNo = params.licenseNo.trim() || undefined;
    if (params.licenseExpiry !== undefined) {
      driver.licenseExpiry = params.licenseExpiry.trim() || undefined;
    }

    this.recordAudit({
      at: new Date().toISOString(),
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'delivery_driver.update',
      entityType: 'delivery_driver',
      entityId: driver.id,
      summaryAr: `تحديث ربط المركبة/مناطق السائق: ${driver.name}`,
      summaryEn: `Updated delivery driver ${driver.name}`,
      before,
      after: {
        assignedVehicleId: driver.assignedVehicleId || null,
        serviceZoneIds: driver.serviceZoneIds,
        isAvailable: driver.isAvailable
      },
      reason: cleanReason
    });

    return this.enrichDeliveryDriver(driver);
  }

  transitionAdminDeliveryDriver(params: {
    id: string;
    action: 'approve' | 'reject' | 'suspend' | 'reactivate' | 'archive';
    reason: string;
    actor: { actorId: string; actorName: string };
  }) {
    const driver = this.deliveryDrivers.find((d) => d.id === params.id);
    if (!driver) {
      const err: any = new Error('السائق غير موجود');
      err.statusCode = 404;
      throw err;
    }
    const cleanReason = this.requireDeliveryReason(params.reason);
    const statusMap: Record<typeof params.action, DeliveryAccountStatus> = {
      approve: 'active',
      reactivate: 'active',
      reject: 'rejected',
      suspend: 'suspended',
      archive: 'archived'
    };
    const nextStatus = statusMap[params.action];
    const before = { accountStatus: driver.accountStatus, statusReason: driver.statusReason };
    const nowIso = new Date().toISOString();

    driver.accountStatus = nextStatus;
    driver.statusReason = cleanReason;
    driver.statusChangedAt = nowIso;
    driver.statusChangedBy = params.actor.actorId;
    if (nextStatus !== 'active') {
      driver.isAvailable = false;
    }

    this.recordAudit({
      at: nowIso,
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: `delivery_driver.${params.action}`,
      entityType: 'delivery_driver',
      entityId: driver.id,
      summaryAr: `تغيير حالة السائق (${driver.name}) إلى ${nextStatus}`,
      summaryEn: `Delivery driver ${driver.name} -> ${nextStatus}`,
      before,
      after: { accountStatus: driver.accountStatus, statusReason: driver.statusReason },
      reason: cleanReason
    });

    return this.enrichDeliveryDriver(driver);
  }

  // ---- Admin Rate Rules & Platform Delivery Settings ----

  getAdminDeliveryRateRules() {
    return this.deliveryRateRules.map((r) => {
      const gov = r.scope.governorateId
        ? this.governorates.find((g) => g.id === r.scope.governorateId)
        : undefined;
      const zone = r.scope.deliveryZoneId
        ? this.deliveryZones.find((z) => z.id === r.scope.deliveryZoneId)
        : undefined;
      return {
        ...r,
        governorateNameAr: gov?.nameAr,
        governorateNameEn: gov?.nameEn,
        zoneNameAr: zone?.nameAr,
        zoneNameEn: zone?.nameEn
      };
    });
  }

  createAdminDeliveryRateRule(params: {
    nameAr: string;
    nameEn?: string;
    scope: { governorateId?: string; deliveryZoneId?: string };
    vehicleClass: DeliveryVehicleClass;
    baseFeeIQD: number;
    perUnitFeeIQD: number;
    minFeeIQD: number;
    refrigeratedSurchargeIQD: number;
    isActive?: boolean;
    reason: string;
    actor: { actorId: string; actorName: string };
  }) {
    const cleanReason = this.requireDeliveryReason(params.reason);
    const nameAr = String(params.nameAr || '').trim();
    if (nameAr.length < 2) {
      const err: any = new Error('اسم قاعدة التسعير مطلوب');
      err.statusCode = 400;
      throw err;
    }
    const baseFeeIQD = Math.max(0, Math.round(Number(params.baseFeeIQD) || 0));
    const perUnitFeeIQD = Math.max(0, Math.round(Number(params.perUnitFeeIQD) || 0));
    const minFeeIQD = Math.max(0, Math.round(Number(params.minFeeIQD) || 0));
    const refrigeratedSurchargeIQD = Math.max(
      0,
      Math.round(Number(params.refrigeratedSurchargeIQD) || 0)
    );

    const nowIso = new Date().toISOString();
    const rule: DeliveryRateRule = {
      id: `rate_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      nameAr,
      nameEn: String(params.nameEn || nameAr).trim(),
      scope: {
        governorateId: params.scope?.governorateId || undefined,
        deliveryZoneId: params.scope?.deliveryZoneId || undefined
      },
      vehicleClass: params.vehicleClass,
      baseFeeIQD,
      perUnitFeeIQD,
      minFeeIQD,
      refrigeratedSurchargeIQD,
      isActive: params.isActive !== false,
      createdAt: nowIso,
      updatedAt: nowIso,
      updatedBy: params.actor.actorId
    };

    this.deliveryRateRules.unshift(rule);

    this.recordAudit({
      at: nowIso,
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'delivery_rate.create',
      entityType: 'delivery_rate_rule',
      entityId: rule.id,
      summaryAr: `إنشاء قاعدة تسعير توصيل جديدة: ${nameAr}`,
      summaryEn: `Created delivery rate rule: ${rule.nameEn}`,
      before: null,
      after: rule,
      reason: cleanReason
    });

    return rule;
  }

  updateAdminDeliveryRateRule(params: {
    id: string;
    nameAr?: string;
    nameEn?: string;
    scope?: { governorateId?: string; deliveryZoneId?: string };
    vehicleClass?: DeliveryVehicleClass;
    baseFeeIQD?: number;
    perUnitFeeIQD?: number;
    minFeeIQD?: number;
    refrigeratedSurchargeIQD?: number;
    isActive?: boolean;
    reason: string;
    actor: { actorId: string; actorName: string };
  }) {
    const rule = this.deliveryRateRules.find((r) => r.id === params.id);
    if (!rule) {
      const err: any = new Error('قاعدة التسعير غير موجودة');
      err.statusCode = 404;
      throw err;
    }
    const cleanReason = this.requireDeliveryReason(params.reason);
    const before = JSON.parse(JSON.stringify(rule));
    const nowIso = new Date().toISOString();

    if (typeof params.nameAr === 'string' && params.nameAr.trim().length >= 2) {
      rule.nameAr = params.nameAr.trim();
    }
    if (typeof params.nameEn === 'string' && params.nameEn.trim().length >= 2) {
      rule.nameEn = params.nameEn.trim();
    }
    if (params.scope) {
      rule.scope = {
        governorateId: params.scope.governorateId || undefined,
        deliveryZoneId: params.scope.deliveryZoneId || undefined
      };
    }
    if (params.vehicleClass) rule.vehicleClass = params.vehicleClass;
    if (params.baseFeeIQD !== undefined) {
      rule.baseFeeIQD = Math.max(0, Math.round(Number(params.baseFeeIQD) || 0));
    }
    if (params.perUnitFeeIQD !== undefined) {
      rule.perUnitFeeIQD = Math.max(0, Math.round(Number(params.perUnitFeeIQD) || 0));
    }
    if (params.minFeeIQD !== undefined) {
      rule.minFeeIQD = Math.max(0, Math.round(Number(params.minFeeIQD) || 0));
    }
    if (params.refrigeratedSurchargeIQD !== undefined) {
      rule.refrigeratedSurchargeIQD = Math.max(
        0,
        Math.round(Number(params.refrigeratedSurchargeIQD) || 0)
      );
    }
    if (typeof params.isActive === 'boolean') {
      rule.isActive = params.isActive;
    }
    rule.updatedAt = nowIso;
    rule.updatedBy = params.actor.actorId;

    this.recordAudit({
      at: nowIso,
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'delivery_rate.update',
      entityType: 'delivery_rate_rule',
      entityId: rule.id,
      summaryAr: `تعديل قاعدة تسعير التوصيل: ${rule.nameAr}`,
      summaryEn: `Updated delivery rate rule: ${rule.nameEn}`,
      before,
      after: rule,
      reason: cleanReason
    });

    return rule;
  }

  deleteAdminDeliveryRateRule(params: {
    id: string;
    reason: string;
    actor: { actorId: string; actorName: string };
  }) {
    const rule = this.deliveryRateRules.find((r) => r.id === params.id);
    if (!rule) {
      const err: any = new Error('قاعدة التسعير غير موجودة');
      err.statusCode = 404;
      throw err;
    }
    const cleanReason = this.requireDeliveryReason(params.reason);
    const before = JSON.parse(JSON.stringify(rule));
    const nowIso = new Date().toISOString();
    rule.isActive = false;
    rule.updatedAt = nowIso;
    rule.updatedBy = params.actor.actorId;

    this.recordAudit({
      at: nowIso,
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'delivery_rate.deactivate',
      entityType: 'delivery_rate_rule',
      entityId: rule.id,
      summaryAr: `تعطيل قاعدة تسعير التوصيل: ${rule.nameAr}`,
      summaryEn: `Deactivated delivery rate rule: ${rule.nameEn}`,
      before,
      after: rule,
      reason: cleanReason
    });

    return rule;
  }

  getAdminDeliveryPlatformSettings(): DeliveryPlatformSettings {
    return this.deliveryPlatformSettings;
  }

  updateAdminDeliveryPlatformSettings(params: {
    freeDeliveryThresholdIQD?: number;
    partnerCommissionPercent?: number;
    codAllowedForPartners?: boolean;
    staleOpenJobMinutes?: number;
    maxActiveJobsPerDriver?: number;
    vehicleClassDefaults?: DeliveryPlatformSettings['vehicleClassDefaults'];
    reason: string;
    actor: { actorId: string; actorName: string };
  }) {
    const cleanReason = this.requireDeliveryReason(params.reason);
    const before = JSON.parse(JSON.stringify(this.deliveryPlatformSettings));
    const nowIso = new Date().toISOString();

    if (params.freeDeliveryThresholdIQD !== undefined) {
      this.deliveryPlatformSettings.freeDeliveryThresholdIQD = Math.max(
        0,
        Math.round(Number(params.freeDeliveryThresholdIQD) || 0)
      );
    }
    if (params.partnerCommissionPercent !== undefined) {
      this.deliveryPlatformSettings.partnerCommissionPercent = Math.max(
        0,
        Math.min(100, Number(params.partnerCommissionPercent) || 0)
      );
    }
    if (typeof params.codAllowedForPartners === 'boolean') {
      this.deliveryPlatformSettings.codAllowedForPartners = params.codAllowedForPartners;
    }
    if (params.staleOpenJobMinutes !== undefined) {
      this.deliveryPlatformSettings.staleOpenJobMinutes = Math.max(
        5,
        Math.min(1440, Math.round(Number(params.staleOpenJobMinutes) || 30))
      );
    }
    if (params.maxActiveJobsPerDriver !== undefined) {
      this.deliveryPlatformSettings.maxActiveJobsPerDriver = Math.max(
        1,
        Math.min(20, Math.round(Number(params.maxActiveJobsPerDriver) || 3))
      );
    }
    if (Array.isArray(params.vehicleClassDefaults) && params.vehicleClassDefaults.length > 0) {
      this.deliveryPlatformSettings.vehicleClassDefaults = params.vehicleClassDefaults;
    }
    this.deliveryPlatformSettings.updatedAt = nowIso;
    this.deliveryPlatformSettings.updatedBy = params.actor.actorId;

    this.recordAudit({
      at: nowIso,
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'delivery_settings.update',
      entityType: 'delivery_platform_settings',
      entityId: 'global',
      summaryAr: `تحديث إعدادات شبكة التوصيل (العتبة المجانية: ${this.deliveryPlatformSettings.freeDeliveryThresholdIQD.toLocaleString('en-US')} د.ع)`,
      summaryEn: 'Updated platform delivery settings',
      before,
      after: this.deliveryPlatformSettings,
      reason: cleanReason
    });

    return this.deliveryPlatformSettings;
  }

  // ---- Admin Supplier Delivery Settings ----

  getAdminSupplierDeliverySettingsList() {
    return this.suppliers.map((s) => ({
      supplierId: s.id,
      companyName: s.companyName,
      city: s.city,
      accountStatus: this.getSupplierAccountStatus(s),
      serviceZoneIds: s.serviceZoneIds,
      totalVans: s.totalVans,
      deliverySettings: s.deliverySettings || {
        hasOwnFleet: true,
        allowPlatformDelivery: false,
        allowStorePickup: true
      }
    }));
  }

  updateAdminSupplierDeliverySettings(params: {
    supplierId: string;
    hasOwnFleet: boolean;
    allowPlatformDelivery: boolean;
    allowStorePickup: boolean;
    freeDeliveryThresholdIQD?: number | null;
    notes?: string;
    reason: string;
    actor: { actorId: string; actorName: string };
  }) {
    const supplier = this.suppliers.find((s) => s.id === params.supplierId);
    if (!supplier) {
      const err: any = new Error('المورد غير موجود');
      err.statusCode = 404;
      throw err;
    }

    const cleanReason = this.requireDeliveryReason(params.reason);
    const hasOwnFleet = Boolean(params.hasOwnFleet);
    const allowPlatformDelivery = Boolean(params.allowPlatformDelivery);
    const allowStorePickup = Boolean(params.allowStorePickup);

    if (!hasOwnFleet && !allowPlatformDelivery && !allowStorePickup) {
      const err: any = new Error(
        'يجب إبقاء خيار توصيل واحد على الأقل مفعلاً للمورد (أسطول خاص أو شبكة المنصة أو الاستلام من المستودع)'
      );
      err.statusCode = 400;
      throw err;
    }

    const before = supplier.deliverySettings
      ? JSON.parse(JSON.stringify(supplier.deliverySettings))
      : null;

    const nextSettings: SupplierDeliverySettings = {
      hasOwnFleet,
      allowPlatformDelivery,
      allowStorePickup,
      freeDeliveryThresholdIQD:
        params.freeDeliveryThresholdIQD === null || params.freeDeliveryThresholdIQD === undefined
          ? undefined
          : Math.max(0, Math.round(Number(params.freeDeliveryThresholdIQD) || 0)),
      notes: typeof params.notes === 'string' && params.notes.trim() ? params.notes.trim() : undefined
    };

    supplier.deliverySettings = nextSettings;

    this.recordAudit({
      at: new Date().toISOString(),
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'supplier.update_delivery_settings',
      entityType: 'supplier',
      entityId: supplier.id,
      summaryAr: `تحديث إعدادات توصيل المورد: ${supplier.companyName}`,
      summaryEn: `Updated delivery settings for supplier: ${supplier.companyName}`,
      before,
      after: nextSettings,
      reason: cleanReason
    });

    return {
      supplierId: supplier.id,
      companyName: supplier.companyName,
      deliverySettings: supplier.deliverySettings
    };
  }

  simulateAdminDeliveryFee(params: {
    supplierId?: string;
    governorateId?: string;
    deliveryZoneId?: string;
    items?: Array<{ barcode?: string; quantity: number; storageType?: ProductStorageKind }>;
    storageType?: ProductStorageKind;
    units?: number;
    requiredTemperature?: VehicleTemperatureType;
    orderValueIQD: number;
  }) {
    const requestedZone = params.deliveryZoneId
      ? this.deliveryZones.find((z) => z.id === params.deliveryZoneId)
      : undefined;

    const resolvedGovId = params.governorateId || requestedZone?.governorateId;
    const gov = this.governorates.find((g) => g.id === resolvedGovId);
    if (!gov) {
      const err: any = new Error('المحافظة المختارة غير موجودة');
      err.statusCode = 400;
      throw err;
    }

    const zone =
      requestedZone || this.deliveryZones.find((z) => z.governorateId === gov.id);

    const supplier = params.supplierId
      ? this.suppliers.find((s) => s.id === params.supplierId)
      : undefined;

    let resolvedUnits = Math.max(0, Math.round(Number(params.units) || 0));
    const storageTypes: Array<ProductStorageKind | undefined> = [];
    if (params.storageType) storageTypes.push(params.storageType);

    if (Array.isArray(params.items) && params.items.length > 0) {
      let itemUnits = 0;
      for (const item of params.items) {
        const qty = Math.max(1, Math.round(Number(item.quantity) || 1));
        itemUnits += qty;
        const product = item.barcode
          ? this.products.find((p) => p.barcode === item.barcode)
          : undefined;
        storageTypes.push(item.storageType || product?.storageType || 'ambient');
      }
      if (resolvedUnits <= 0) resolvedUnits = itemUnits;
    }
    if (resolvedUnits <= 0) resolvedUnits = 1;

    const resolvedTemperature: VehicleTemperatureType = params.requiredTemperature
      ? params.requiredTemperature
      : getRequiredTemperatureForStorageTypes(storageTypes);

    const supplierFreeThreshold = supplier?.deliverySettings?.freeDeliveryThresholdIQD;

    const directQuote = calculateDeliveryFee({
      zone: {
        governorateId: gov.id,
        deliveryZoneId: zone?.id
      },
      units: resolvedUnits,
      requiredTemperature: resolvedTemperature,
      orderValueIQD: params.orderValueIQD,
      rules: this.deliveryRateRules,
      settings: this.deliveryPlatformSettings,
      supplierFreeThresholdIQD: supplierFreeThreshold
    });

    const hasActiveCoverage = this.hasActivePlatformCoverageForZone(gov.id, zone?.id);

    const supplierEvaluation =
      supplier && zone
        ? getDeliveryOptionsForSupplier({
            supplier,
            zone: { governorateId: gov.id, deliveryZoneId: zone.id },
            units: resolvedUnits,
            requiredTemperature: resolvedTemperature,
            orderValueIQD: params.orderValueIQD,
            rules: this.deliveryRateRules,
            settings: this.deliveryPlatformSettings,
            hasActivePlatformCoverage: hasActiveCoverage
          })
        : null;

    return {
      governorateId: gov.id,
      governorateNameAr: gov.nameAr,
      governorateNameEn: gov.nameEn,
      deliveryZoneId: zone?.id,
      deliveryZoneNameAr: zone?.nameAr,
      deliveryZoneNameEn: zone?.nameEn,
      hasActivePlatformCoverage: hasActiveCoverage,
      quote: directQuote,
      supplierEvaluation
    };
  }

  // ================= PHASE D2: DISPATCH BOARD & DELIVERY PARTNER PORTAL =================

  private inferZoneForSubOrder(order: SubOrder): {
    governorateId: string;
    deliveryZoneId?: string;
  } {
    if (order.deliveryZoneId) {
      const explicitZone = this.deliveryZones.find((z) => z.id === order.deliveryZoneId);
      if (explicitZone) {
        return {
          governorateId: explicitZone.governorateId,
          deliveryZoneId: explicitZone.id
        };
      }
    }

    const store = this.stores.find((s) => s.id === order.storeId);
    const haystack = `${order.storeCity || ''} ${store?.city || ''} ${store?.district || ''} ${order.storeAddress || ''}`.toLowerCase();

    if (haystack.includes('النجف') || haystack.includes('najaf')) {
      const kufa = haystack.includes('كوفة') || haystack.includes('kufa');
      const zone = this.deliveryZones.find(
        (z) => z.id === (kufa ? 'zone_najaf_kufa' : 'zone_najaf_center')
      );
      return { governorateId: 'gov_najaf', deliveryZoneId: zone?.id };
    }
    if (haystack.includes('كربلاء') || haystack.includes('karbala')) {
      const hindiya = haystack.includes('هندية') || haystack.includes('hindiya');
      const zone = this.deliveryZones.find(
        (z) => z.id === (hindiya ? 'zone_karbala_hindiya' : 'zone_karbala_center')
      );
      return { governorateId: 'gov_karbala', deliveryZoneId: zone?.id };
    }
    if (haystack.includes('بابل') || haystack.includes('الحلة') || haystack.includes('babil')) {
      const musayyib = haystack.includes('مسيب') || haystack.includes('musayyib');
      const zone = this.deliveryZones.find(
        (z) => z.id === (musayyib ? 'zone_babil_musayyib' : 'zone_babil_hilla')
      );
      return { governorateId: 'gov_babil', deliveryZoneId: zone?.id };
    }
    if (haystack.includes('بغداد') || haystack.includes('baghdad')) {
      const isKarkh =
        haystack.includes('منصور') ||
        haystack.includes('كرخ') ||
        haystack.includes('كاظم') ||
        haystack.includes('شعلة');
      const zone = this.deliveryZones.find(
        (z) => z.id === (isKarkh ? 'zone_baghdad_karkh' : 'zone_baghdad_rusafa')
      );
      return { governorateId: 'gov_baghdad', deliveryZoneId: zone?.id };
    }

    const fallbackZone = this.deliveryZones[0];
    return {
      governorateId: fallbackZone?.governorateId || 'gov_baghdad',
      deliveryZoneId: fallbackZone?.id
    };
  }

  private computeJobLoadAndPayout(
    order: SubOrder,
    governorateId: string,
    deliveryZoneId?: string
  ): {
    unitsCount: number;
    requiredTemperature: VehicleTemperatureType;
    estimatedPayoutIQD: number;
  } {
    let unitsCount = 0;
    const storageTypes: Array<ProductStorageKind | undefined> = [];
    for (const item of order.items || []) {
      const qty = Math.max(1, Math.round(Number(item.quantity) || 1));
      unitsCount += qty;
      const product = this.products.find((p) => p.barcode === item.barcode);
      storageTypes.push(product?.storageType || 'ambient');
    }
    if (unitsCount <= 0) unitsCount = 1;

    const requiredTemperature = getRequiredTemperatureForStorageTypes(storageTypes);
    const supplier = this.suppliers.find((s) => s.id === order.supplierId);
    const quote = calculateDeliveryFee({
      zone: { governorateId, deliveryZoneId },
      units: unitsCount,
      requiredTemperature,
      orderValueIQD: order.subtotalIQD,
      rules: this.deliveryRateRules,
      settings: this.deliveryPlatformSettings,
      supplierFreeThresholdIQD: supplier?.deliverySettings?.freeDeliveryThresholdIQD
    });

    const grossFee = quote?.breakdown?.rawTotalFeeIQD ?? 10000;
    const commissionPct = Math.max(
      0,
      Math.min(100, this.deliveryPlatformSettings.partnerCommissionPercent || 0)
    );
    const estimatedPayoutIQD = Math.max(0, Math.round(grossFee * (1 - commissionPct / 100)));

    return { unitsCount, requiredTemperature, estimatedPayoutIQD };
  }

  createDeliveryJobForSubOrder(
    order: SubOrder,
    actor?: {
      actorType: 'system' | 'admin';
      actorId?: string;
      actorName?: string;
      note?: string;
    },
    extra?: { preserveAttempts?: number; priorHistory?: DeliveryJobHistoryEntry[] }
  ): DeliveryJob {
    const supplier = this.suppliers.find((s) => s.id === order.supplierId);
    const store = this.stores.find((s) => s.id === order.storeId);
    const zoneInfo = this.inferZoneForSubOrder(order);
    const { unitsCount, requiredTemperature, estimatedPayoutIQD } = this.computeJobLoadAndPayout(
      order,
      zoneInfo.governorateId,
      zoneInfo.deliveryZoneId
    );
    const nowIso = new Date().toISOString();
    const pickupPin = Math.floor(1000 + Math.random() * 9000).toString();

    const history: DeliveryJobHistoryEntry[] = extra?.priorHistory
      ? [...extra.priorHistory]
      : [];
    history.push({
      status: 'open',
      at: nowIso,
      actorType: actor?.actorType || 'system',
      actorId: actor?.actorId,
      actorName: actor?.actorName || 'النظام',
      note:
        actor?.note ||
        `فتح مهمة توصيل للطلب (${order.id}) في ${zoneInfo.deliveryZoneId || zoneInfo.governorateId}`
    });

    const job: DeliveryJob = {
      id: `djob_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      subOrderId: order.id,
      supplierId: order.supplierId,
      storeId: order.storeId,
      governorateId: zoneInfo.governorateId,
      deliveryZoneId: zoneInfo.deliveryZoneId,
      pickup: {
        name: supplier?.companyName || order.supplierName,
        phone: supplier?.phone || '',
        city: supplier?.city || '',
        address: supplier?.address || supplier?.city || ''
      },
      dropoff: {
        name: store?.name || order.storeName,
        phone: store?.phone || order.storePhone,
        city: store?.city || order.storeCity,
        address: [store?.district, store?.address || order.storeAddress].filter(Boolean).join(' - ')
      },
      unitsCount,
      requiredTemperature,
      paymentMethod: order.paymentMethod,
      orderSubtotalIQD: order.subtotalIQD,
      estimatedPayoutIQD,
      status: 'open',
      pickupPin,
      attempts: extra?.preserveAttempts ?? 0,
      createdAt: nowIso,
      history
    };

    if (zoneInfo.deliveryZoneId) {
      order.deliveryZoneId = zoneInfo.deliveryZoneId;
    }
    order.deliveryJobId = job.id;
    this.deliveryJobs.unshift(job);
    return job;
  }

  private getDriverActiveJobsCount(driverId: string, excludeJobId?: string): number {
    const activeStatuses: DeliveryJobStatus[] = [
      'assigned',
      'accepted',
      'at_pickup',
      'picked_up',
      'in_transit',
      'at_dropoff'
    ];
    return this.deliveryJobs.filter(
      (j) =>
        j.id !== excludeJobId &&
        j.assignedDriverId === driverId &&
        activeStatuses.includes(j.status)
    ).length;
  }

  evaluateDriverVehicleForJob(
    job: DeliveryJob,
    driver: DeliveryDriver,
    vehicle?: DeliveryVehicle
  ): {
    eligible: boolean;
    reasonsAr: string[];
    reasonsEn: string[];
    activeJobsCount: number;
    maxActiveJobs: number;
  } {
    const reasonsAr: string[] = [];
    const reasonsEn: string[] = [];
    const maxActiveJobs = this.deliveryPlatformSettings.maxActiveJobsPerDriver ?? 3;
    const activeJobsCount = this.getDriverActiveJobsCount(driver.id, job.id);

    if (driver.accountStatus !== 'active') {
      reasonsAr.push(`حالة السائق (${driver.accountStatus}) غير نشطة`);
      reasonsEn.push(`Driver account status is ${driver.accountStatus}`);
    }

    const partner =
      driver.providerType === 'partner' && driver.partnerId
        ? this.deliveryPartners.find((p) => p.id === driver.partnerId)
        : undefined;
    if (driver.providerType === 'partner') {
      if (!partner) {
        reasonsAr.push('الشريك المرتبط بالسائق غير موجود');
        reasonsEn.push('Linked partner not found');
      } else if (partner.accountStatus !== 'active') {
        reasonsAr.push(`حساب الشريك (${partner.name}) غير نشط (${partner.accountStatus})`);
        reasonsEn.push(`Partner status is ${partner.accountStatus}`);
      }
    }

    if ((driver.availability || 'online') !== 'online') {
      reasonsAr.push('السائق غير متصل حالياً (Offline)');
      reasonsEn.push('Driver is currently offline');
    }

    if (activeJobsCount >= maxActiveJobs) {
      reasonsAr.push(`وصل السائق للحد الأقصى من المهام النشطة (${activeJobsCount}/${maxActiveJobs})`);
      reasonsEn.push(`Driver reached max active jobs (${activeJobsCount}/${maxActiveJobs})`);
    }

    if (!vehicle) {
      reasonsAr.push('لا توجد مركبة مخصصة لهذا السائق');
      reasonsEn.push('No vehicle selected or assigned for this driver');
    } else {
      if (vehicle.status !== 'active') {
        reasonsAr.push(`المركبة (${vehicle.plateNumber}) غير نشطة (${vehicle.status})`);
        reasonsEn.push(`Vehicle ${vehicle.plateNumber} status is ${vehicle.status}`);
      }
      if (driver.providerType === 'partner' && vehicle.partnerId !== driver.partnerId) {
        reasonsAr.push('المركبة لا تعود لنفس شريك التوصيل');
        reasonsEn.push('Vehicle does not belong to the partner');
      }
      if (driver.providerType === 'platform' && vehicle.ownerType !== 'platform') {
        reasonsAr.push('سائق المنصة يجب أن يستخدم مركبة تابعة لأسطول المنصة');
        reasonsEn.push('Platform driver must use a platform-owned vehicle');
      }
      if ((vehicle.capacityUnits || 0) < job.unitsCount) {
        reasonsAr.push(
          `سعة المركبة (${vehicle.capacityUnits} وحدة) أقل من حمولة المهمة (${job.unitsCount} وحدة)`
        );
        reasonsEn.push(
          `Vehicle capacity (${vehicle.capacityUnits}) is below required (${job.unitsCount} units)`
        );
      }
      if (
        !isVehicleSuitable(vehicle, {
          units: job.unitsCount,
          requiredTemperature: job.requiredTemperature,
          requireActiveStatus: false
        }) &&
        (vehicle.capacityUnits || 0) >= job.unitsCount
      ) {
        reasonsAr.push(
          `المركبة لا تدعم سلسلة التبريد المطلوبة (${job.requiredTemperature})`
        );
        reasonsEn.push(
          `Vehicle does not support required temperature (${job.requiredTemperature})`
        );
      }
    }

    // Coverage check (Zone / Governorate)
    const zoneMatch = job.deliveryZoneId
      ? driver.serviceZoneIds.includes(job.deliveryZoneId)
      : driver.governorateId === job.governorateId;
    const partnerZoneMatch = partner
      ? job.deliveryZoneId
        ? partner.serviceZoneIds.includes(job.deliveryZoneId)
        : partner.governorateId === job.governorateId
      : true;
    if (!zoneMatch || !partnerZoneMatch) {
      reasonsAr.push('المهمة خارج نطاق المناطق الجغرافية المفعلة للسائق/الشريك');
      reasonsEn.push('Job zone is outside driver/partner coverage areas');
    }

    // COD policy check for partner drivers
    if (
      job.paymentMethod === 'cod' &&
      driver.providerType === 'partner' &&
      !this.deliveryPlatformSettings.codAllowedForPartners
    ) {
      reasonsAr.push('الدفع عند الاستلام (COD) غير مفعل لشركاء التوصيل حسب إعدادات المنصة');
      reasonsEn.push('COD delivery is disabled for partners in platform settings');
    }

    return {
      eligible: reasonsAr.length === 0,
      reasonsAr,
      reasonsEn,
      activeJobsCount,
      maxActiveJobs
    };
  }

  private enrichDeliveryJob(job: DeliveryJob, opts?: { sanitizeForPortal?: boolean }) {
    const gov = this.governorates.find((g) => g.id === job.governorateId);
    const zone = job.deliveryZoneId
      ? this.deliveryZones.find((z) => z.id === job.deliveryZoneId)
      : undefined;
    const partner = job.assignedPartnerId
      ? this.deliveryPartners.find((p) => p.id === job.assignedPartnerId)
      : undefined;
    const driver = job.assignedDriverId
      ? this.deliveryDrivers.find((d) => d.id === job.assignedDriverId)
      : undefined;
    const vehicle = job.assignedVehicleId
      ? this.deliveryVehicles.find((v) => v.id === job.assignedVehicleId)
      : undefined;
    const subOrder = this.subOrders.find((o) => o.id === job.subOrderId);

    const staleMinutes = this.deliveryPlatformSettings.staleOpenJobMinutes ?? 30;
    const minutesOpen = Math.max(
      0,
      Math.round((Date.now() - Date.parse(job.createdAt)) / 60000)
    );
    const isStaleOpen = job.status === 'open' && minutesOpen > staleMinutes;

    const base: any = {
      ...job,
      governorateNameAr: gov?.nameAr || job.governorateId,
      governorateNameEn: gov?.nameEn || job.governorateId,
      zoneNameAr: zone?.nameAr || job.deliveryZoneId || '',
      zoneNameEn: zone?.nameEn || job.deliveryZoneId || '',
      assignedPartnerName: partner?.name || null,
      assignedDriverName: driver?.name || null,
      assignedDriverPhone: driver?.phone || null,
      assignedDriverType: driver?.providerType || null,
      assignedVehiclePlate: vehicle?.plateNumber || null,
      assignedVehicleClass: vehicle?.vehicleClass || null,
      subOrderStatus: subOrder?.status || null,
      itemsSummary: subOrder?.items || [],
      minutesOpen,
      isStaleOpen
    };

    // Never leak sensitive customer/warehouse verification PINs inside Partner Portal API payloads
    if (opts?.sanitizeForPortal) {
      delete base.pickupPin;
    }

    return base;
  }

  getAdminDispatchSummary() {
    const staleThreshold = this.deliveryPlatformSettings.staleOpenJobMinutes ?? 30;
    const todayPrefix = new Date().toISOString().slice(0, 10);
    const openJobs = this.deliveryJobs.filter((j) => j.status === 'open');
    const staleOpen = openJobs.filter(
      (j) => (Date.now() - Date.parse(j.createdAt)) / 60000 > staleThreshold
    );
    const assigned = this.deliveryJobs.filter((j) =>
      ['assigned', 'accepted', 'at_pickup'].includes(j.status)
    );
    const inProgress = this.deliveryJobs.filter((j) =>
      ['picked_up', 'in_transit', 'at_dropoff'].includes(j.status)
    );
    const delivered = this.deliveryJobs.filter((j) => j.status === 'delivered');
    const deliveredToday = delivered.filter(
      (j) => (j.deliveredAt || '').slice(0, 10) === todayPrefix
    );
    const failed = this.deliveryJobs.filter((j) => j.status === 'failed');
    const cancelled = this.deliveryJobs.filter((j) => j.status === 'cancelled');

    const ordersEligibleToConvert = this.subOrders.filter(
      (o) =>
        o.deliveryType !== 'platform_driver' &&
        (o.status === 'pending' || o.status === 'approved')
    ).length;

    const platformOrdersMissingJob = this.subOrders.filter((o) => {
      if (o.deliveryType !== 'platform_driver' || o.status !== 'approved') return false;
      const linked = o.deliveryJobId ? this.deliveryJobs.find((j) => j.id === o.deliveryJobId) : undefined;
      return !linked || linked.status === 'cancelled';
    }).length;

    return {
      all: this.deliveryJobs.length,
      open: openJobs.length,
      staleOpen: staleOpen.length,
      staleThresholdMinutes: staleThreshold,
      assigned: assigned.length,
      inProgress: inProgress.length,
      delivered: delivered.length,
      deliveredToday: deliveredToday.length,
      failed: failed.length,
      cancelled: cancelled.length,
      ordersEligibleToConvert,
      platformOrdersMissingJob
    };
  }

  getAdminDispatchJobs(params?: {
    tab?: string;
    governorateId?: string;
    partnerId?: string;
    search?: string;
    staleOnly?: boolean;
  }) {
    const all = this.deliveryJobs.map((j) => this.enrichDeliveryJob(j));
    const counts = this.getAdminDispatchSummary();

    let filtered = [...all];
    if (params?.tab && params.tab !== 'all') {
      if (params.tab === 'open') {
        filtered = filtered.filter((j) => j.status === 'open');
      } else if (params.tab === 'assigned') {
        filtered = filtered.filter((j) =>
          ['assigned', 'accepted', 'at_pickup'].includes(j.status)
        );
      } else if (params.tab === 'in_progress') {
        filtered = filtered.filter((j) =>
          ['picked_up', 'in_transit', 'at_dropoff'].includes(j.status)
        );
      } else if (params.tab === 'delivered') {
        filtered = filtered.filter((j) => j.status === 'delivered');
      } else if (params.tab === 'failed') {
        filtered = filtered.filter((j) => j.status === 'failed');
      } else if (params.tab === 'cancelled') {
        filtered = filtered.filter((j) => j.status === 'cancelled');
      }
    }

    if (params?.staleOnly) {
      filtered = filtered.filter((j) => j.isStaleOpen);
    }
    if (params?.governorateId && params.governorateId !== 'all') {
      filtered = filtered.filter((j) => j.governorateId === params.governorateId);
    }
    if (params?.partnerId && params.partnerId !== 'all') {
      filtered = filtered.filter((j) => j.assignedPartnerId === params.partnerId);
    }
    if (params?.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.id.toLowerCase().includes(q) ||
          j.subOrderId.toLowerCase().includes(q) ||
          j.pickup.name.toLowerCase().includes(q) ||
          j.dropoff.name.toLowerCase().includes(q) ||
          (j.assignedDriverName || '').toLowerCase().includes(q) ||
          (j.assignedPartnerName || '').toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    const convertibleOrders = this.subOrders
      .filter(
        (o) =>
          o.deliveryType !== 'platform_driver' &&
          (o.status === 'pending' || o.status === 'approved')
      )
      .map((o) => ({
        id: o.id,
        supplierId: o.supplierId,
        supplierName: o.supplierName,
        storeName: o.storeName,
        storeCity: o.storeCity,
        status: o.status,
        deliveryType: o.deliveryType,
        paymentMethod: o.paymentMethod,
        subtotalIQD: o.subtotalIQD,
        createdAt: o.createdAt
      }));

    return {
      items: filtered,
      total: filtered.length,
      counts,
      convertibleOrders
    };
  }

  getAdminDispatchJobDetail(jobId: string) {
    const job = this.deliveryJobs.find((j) => j.id === jobId);
    if (!job) {
      const err: any = new Error('مهمة التوصيل غير موجودة');
      err.statusCode = 404;
      throw err;
    }

    const enrichedJob = this.enrichDeliveryJob(job);
    const subOrder = this.subOrders.find((o) => o.id === job.subOrderId) || null;

    const driverCandidates = this.deliveryDrivers.map((drv) => {
      const partner = drv.partnerId
        ? this.deliveryPartners.find((p) => p.id === drv.partnerId) || null
        : null;
      const defaultVehicle = drv.assignedVehicleId
        ? this.deliveryVehicles.find((v) => v.id === drv.assignedVehicleId)
        : this.deliveryVehicles.find(
            (v) =>
              v.status === 'active' &&
              (drv.providerType === 'platform'
                ? v.ownerType === 'platform'
                : v.partnerId === drv.partnerId)
          );
      const selectableVehicles = this.deliveryVehicles.filter((v) =>
        drv.providerType === 'platform'
          ? v.ownerType === 'platform'
          : v.partnerId === drv.partnerId
      );
      const eligibility = this.evaluateDriverVehicleForJob(job, drv, defaultVehicle);
      return {
        driver: this.enrichDeliveryDriver(drv),
        partner: partner ? this.enrichDeliveryPartner(partner) : null,
        defaultVehicle: defaultVehicle ? this.enrichDeliveryVehicle(defaultVehicle) : null,
        selectableVehicles: selectableVehicles.map((v) => this.enrichDeliveryVehicle(v)),
        eligibility
      };
    });

    driverCandidates.sort((a, b) => Number(b.eligibility.eligible) - Number(a.eligibility.eligible));

    const auditLogs = this.auditLogs
      .filter(
        (l) =>
          (l.entityType === 'delivery_job' && l.entityId === job.id) ||
          (l.entityType === 'sub_order' && l.entityId === job.subOrderId)
      )
      .slice(0, 30);

    return {
      job: enrichedJob,
      subOrder,
      driverCandidates,
      settings: this.deliveryPlatformSettings,
      auditLogs
    };
  }

  assignDispatchJob(params: {
    jobId: string;
    driverId: string;
    vehicleId?: string;
    reason: string;
    actor: { actorId: string; actorName: string };
  }) {
    const cleanReason = this.requireDeliveryReason(params.reason);
    const job = this.deliveryJobs.find((j) => j.id === params.jobId);
    if (!job) {
      const err: any = new Error('مهمة التوصيل غير موجودة');
      err.statusCode = 404;
      throw err;
    }
    if (job.status !== 'open') {
      const err: any = new Error(
        `لا يمكن إسناد المهمة وهي في الحالة (${job.status}) — يجب أن تكون مفتوحة (open)`
      );
      err.statusCode = 400;
      throw err;
    }

    const driver = this.deliveryDrivers.find((d) => d.id === params.driverId);
    if (!driver) {
      const err: any = new Error('السائق المختار غير موجود');
      err.statusCode = 404;
      throw err;
    }

    const resolvedVehicleId = params.vehicleId || driver.assignedVehicleId;
    const vehicle = resolvedVehicleId
      ? this.deliveryVehicles.find((v) => v.id === resolvedVehicleId)
      : undefined;

    const evalResult = this.evaluateDriverVehicleForJob(job, driver, vehicle);
    if (!evalResult.eligible) {
      const err: any = new Error(evalResult.reasonsAr.join('؛ '));
      err.statusCode = 400;
      throw err;
    }

    const before = {
      status: job.status,
      assignedPartnerId: job.assignedPartnerId || null,
      assignedDriverId: job.assignedDriverId || null,
      assignedVehicleId: job.assignedVehicleId || null
    };

    // Pass through centralized SubOrder state engine
    this.transitionSubOrder({
      id: job.subOrderId,
      toStatus: 'assigned_driver',
      driverId: driver.id,
      actor: {
        actorType: 'admin',
        actorId: params.actor.actorId,
        actorName: params.actor.actorName
      },
      reason: cleanReason,
      extraHistoryNote: `توزيع المهمة (${job.id}) عبر لوحة التوزيع للمركبة ${vehicle!.plateNumber}`
    });

    const nowIso = new Date().toISOString();
    job.status = 'assigned';
    job.assignedPartnerId = driver.partnerId;
    job.assignedDriverId = driver.id;
    job.assignedVehicleId = vehicle!.id;
    job.assignedAt = nowIso;
    job.attempts = (job.attempts || 0) + 1;
    job.history.push({
      status: 'assigned',
      at: nowIso,
      actorType: 'admin',
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      note: `إسناد إداري إلى ${driver.name} (${vehicle!.plateNumber}) — ${cleanReason}`
    });

    this.recordAudit({
      at: nowIso,
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'dispatch.assign_job',
      entityType: 'delivery_job',
      entityId: job.id,
      summaryAr: `توزيع مهمة التوصيل (${job.id}) إلى ${driver.name}`,
      summaryEn: `Assigned delivery job ${job.id} to ${driver.name}`,
      before,
      after: {
        status: job.status,
        assignedPartnerId: job.assignedPartnerId || null,
        assignedDriverId: job.assignedDriverId,
        assignedVehicleId: job.assignedVehicleId
      },
      reason: cleanReason
    });

    return this.enrichDeliveryJob(job);
  }

  unassignDispatchJob(params: {
    jobId: string;
    reason: string;
    actor: { actorId: string; actorName: string };
  }) {
    const cleanReason = this.requireDeliveryReason(params.reason);
    const job = this.deliveryJobs.find((j) => j.id === params.jobId);
    if (!job) {
      const err: any = new Error('مهمة التوصيل غير موجودة');
      err.statusCode = 404;
      throw err;
    }
    if (!['assigned', 'accepted', 'at_pickup'].includes(job.status)) {
      const err: any = new Error(
        'لا يمكن سحب التعيين بعد استلام البضاعة من المستودع أو انتهاء المهمة'
      );
      err.statusCode = 400;
      throw err;
    }

    const before = {
      status: job.status,
      assignedPartnerId: job.assignedPartnerId || null,
      assignedDriverId: job.assignedDriverId || null,
      assignedVehicleId: job.assignedVehicleId || null
    };

    const order = this.subOrders.find((o) => o.id === job.subOrderId);
    if (order && order.status === 'assigned_driver') {
      this.transitionSubOrder({
        id: order.id,
        toStatus: 'approved',
        actor: {
          actorType: 'admin',
          actorId: params.actor.actorId,
          actorName: params.actor.actorName
        },
        reason: cleanReason,
        extraHistoryNote: `سحب التعيين من السائق وإعادة المهمة (${job.id}) إلى قائمة المهام المفتوحة`
      });
    }

    const nowIso = new Date().toISOString();
    job.status = 'open';
    job.assignedPartnerId = undefined;
    job.assignedDriverId = undefined;
    job.assignedVehicleId = undefined;
    job.assignedAt = undefined;
    job.acceptedAt = undefined;
    job.arrivedPickupAt = undefined;
    job.history.push({
      status: 'open',
      at: nowIso,
      actorType: 'admin',
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      note: `سحب التعيين وإعادة الفتح: ${cleanReason}`
    });

    this.recordAudit({
      at: nowIso,
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'dispatch.unassign_job',
      entityType: 'delivery_job',
      entityId: job.id,
      summaryAr: `سحب تعيين مهمة التوصيل (${job.id}) وإعادتها للمهام المفتوحة`,
      summaryEn: `Unassigned delivery job ${job.id}`,
      before,
      after: {
        status: job.status,
        assignedPartnerId: null,
        assignedDriverId: null,
        assignedVehicleId: null
      },
      reason: cleanReason
    });

    return this.enrichDeliveryJob(job);
  }

  cancelDispatchJob(params: {
    jobId: string;
    reason: string;
    actor: { actorId: string; actorName: string };
  }) {
    const cleanReason = this.requireDeliveryReason(params.reason);
    const job = this.deliveryJobs.find((j) => j.id === params.jobId);
    if (!job) {
      const err: any = new Error('مهمة التوصيل غير موجودة');
      err.statusCode = 404;
      throw err;
    }
    if (job.status === 'delivered' || job.status === 'cancelled') {
      const err: any = new Error('لا يمكن إلغاء مهمة مسلمة أو ملغاة بالفعل');
      err.statusCode = 400;
      throw err;
    }

    const before = {
      status: job.status,
      assignedDriverId: job.assignedDriverId || null,
      assignedVehicleId: job.assignedVehicleId || null
    };

    const order = this.subOrders.find((o) => o.id === job.subOrderId);
    if (order) {
      if (order.status === 'out_for_delivery') {
        this.transitionSubOrder({
          id: order.id,
          toStatus: 'assigned_driver',
          actor: {
            actorType: 'admin',
            actorId: params.actor.actorId,
            actorName: params.actor.actorName
          },
          reason: cleanReason
        });
      }
      if (order.status === 'assigned_driver') {
        this.transitionSubOrder({
          id: order.id,
          toStatus: 'approved',
          actor: {
            actorType: 'admin',
            actorId: params.actor.actorId,
            actorName: params.actor.actorName
          },
          reason: cleanReason,
          extraHistoryNote: `إلغاء مهمة التوصيل (${job.id}) دون إلغاء الطلبية`
        });
      }
      if (order.deliveryJobId === job.id) {
        order.deliveryJobId = undefined;
      }
    }

    const nowIso = new Date().toISOString();
    job.status = 'cancelled';
    job.cancelledAt = nowIso;
    job.history.push({
      status: 'cancelled',
      at: nowIso,
      actorType: 'admin',
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      note: `إلغاء المهمة: ${cleanReason}`
    });

    this.recordAudit({
      at: nowIso,
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'dispatch.cancel_job',
      entityType: 'delivery_job',
      entityId: job.id,
      summaryAr: `إلغاء مهمة التوصيل (${job.id})`,
      summaryEn: `Cancelled delivery job ${job.id}`,
      before,
      after: { status: 'cancelled' },
      reason: cleanReason
    });

    return this.enrichDeliveryJob(job);
  }

  reopenDispatchJob(params: {
    jobId: string;
    reason: string;
    actor: { actorId: string; actorName: string };
  }) {
    const cleanReason = this.requireDeliveryReason(params.reason);
    const job = this.deliveryJobs.find((j) => j.id === params.jobId);
    if (!job) {
      const err: any = new Error('مهمة التوصيل غير موجودة');
      err.statusCode = 404;
      throw err;
    }
    if (job.status !== 'failed' && job.status !== 'cancelled') {
      const err: any = new Error('إعادة الفتح متاحة فقط للمهام الفاشلة أو الملغاة');
      err.statusCode = 400;
      throw err;
    }

    const order = this.subOrders.find((o) => o.id === job.subOrderId);
    if (!order) {
      const err: any = new Error('الطلب المرتبط بهذه المهمة غير موجود');
      err.statusCode = 404;
      throw err;
    }
    if (order.status === 'delivered' || order.status === 'cancelled') {
      const err: any = new Error('لا يمكن إعادة فتح مهمة لطلب مسلم أو ملغى');
      err.statusCode = 400;
      throw err;
    }

    const activeSibling = this.deliveryJobs.find(
      (j) =>
        j.subOrderId === order.id &&
        j.id !== job.id &&
        !['failed', 'cancelled', 'delivered'].includes(j.status)
    );
    if (activeSibling) {
      const err: any = new Error(
        `يوجد بالفعل مهمة نشطة (${activeSibling.id}) مرتبطة بهذا الطلب`
      );
      err.statusCode = 409;
      throw err;
    }

    // Ensure order sits cleanly at 'approved' before opening new job
    if (order.status === 'out_for_delivery') {
      this.transitionSubOrder({
        id: order.id,
        toStatus: 'assigned_driver',
        actor: {
          actorType: 'admin',
          actorId: params.actor.actorId,
          actorName: params.actor.actorName
        },
        reason: cleanReason
      });
    }
    if (order.status === 'assigned_driver') {
      this.transitionSubOrder({
        id: order.id,
        toStatus: 'approved',
        actor: {
          actorType: 'admin',
          actorId: params.actor.actorId,
          actorName: params.actor.actorName
        },
        reason: cleanReason,
        extraHistoryNote: `إعادة الطلبية للتوزيع بعد المهمة (${job.id})`
      });
    }

    const newJob = this.createDeliveryJobForSubOrder(
      order,
      {
        actorType: 'admin',
        actorId: params.actor.actorId,
        actorName: params.actor.actorName,
        note: `إعادة فتح مهمة جديدة (محاولة رقم ${(job.attempts || 0) + 1}) بعد (${job.id}): ${cleanReason}`
      },
      {
        preserveAttempts: job.attempts || 0
      }
    );

    this.recordAudit({
      at: new Date().toISOString(),
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'dispatch.reopen_job',
      entityType: 'delivery_job',
      entityId: newJob.id,
      summaryAr: `إعادة فتح مهمة توصيل جديدة (${newJob.id}) بدلاً عن المهمة (${job.id})`,
      summaryEn: `Reopened delivery job ${newJob.id} replacing ${job.id}`,
      before: { previousJobId: job.id, previousStatus: job.status, attempts: job.attempts },
      after: { newJobId: newJob.id, status: newJob.status, attempts: newJob.attempts },
      reason: cleanReason
    });

    return this.enrichDeliveryJob(newJob);
  }

  convertOrderToPlatformDelivery(params: {
    orderId: string;
    reason: string;
    actor: { actorId: string; actorName: string };
  }) {
    const cleanReason = this.requireDeliveryReason(params.reason);
    const order = this.subOrders.find((o) => o.id === params.orderId);
    if (!order) {
      const err: any = new Error('الطلب غير موجود');
      err.statusCode = 404;
      throw err;
    }
    if (order.deliveryType === 'platform_driver') {
      const err: any = new Error('هذا الطلب محول بالفعل لشبكة توصيل المنصة');
      err.statusCode = 400;
      throw err;
    }
    if (!['pending', 'approved'].includes(order.status)) {
      const err: any = new Error(
        'يمكن تحويل الطلب لشبكة المنصة فقط قبل إسناده لسائق أو خروجه للتوصيل'
      );
      err.statusCode = 400;
      throw err;
    }

    const before = {
      deliveryType: order.deliveryType || 'supplier_fleet',
      deliveryZoneId: order.deliveryZoneId || null,
      deliveryJobId: order.deliveryJobId || null
    };

    const zoneInfo = this.inferZoneForSubOrder(order);
    order.deliveryType = 'platform_driver';
    order.deliveryZoneId = zoneInfo.deliveryZoneId;

    let createdJob: DeliveryJob | undefined;
    if (order.status === 'approved') {
      createdJob = this.createDeliveryJobForSubOrder(order, {
        actorType: 'admin',
        actorId: params.actor.actorId,
        actorName: params.actor.actorName,
        note: `تحويل الطلب إلى شبكة توصيل المنصة وفتح مهمة: ${cleanReason}`
      });
    }

    const nowIso = new Date().toISOString();
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: order.status,
      at: nowIso,
      actorType: 'admin',
      actorName: params.actor.actorName,
      reason: cleanReason,
      note: 'تحويل مسار التوصيل من أسطول المورد إلى شبكة توصيل المنصة'
    });

    this.recordAudit({
      at: nowIso,
      actorId: params.actor.actorId,
      actorName: params.actor.actorName,
      action: 'dispatch.convert_order_to_platform',
      entityType: 'sub_order',
      entityId: order.id,
      summaryAr: `تحويل الطلب (${order.id}) للتوصيل عبر شبكة المنصة`,
      summaryEn: `Converted order ${order.id} to platform delivery network`,
      before,
      after: {
        deliveryType: order.deliveryType,
        deliveryZoneId: order.deliveryZoneId || null,
        deliveryJobId: order.deliveryJobId || null
      },
      reason: cleanReason
    });

    return {
      order,
      job: createdJob ? this.enrichDeliveryJob(createdJob) : null
    };
  }

  // ================= PARTNER / PLATFORM DRIVER PORTAL =================

  resolveDeliveryPortalSession(sessionToken: string): {
    mode: 'partner' | 'platform_driver';
    partner?: DeliveryPartner;
    driver?: DeliveryDriver;
    drivers: DeliveryDriver[];
    vehicles: DeliveryVehicle[];
  } {
    const raw = String(sessionToken || '').trim();
    if (raw.startsWith('partner:')) {
      const partnerId = raw.slice('partner:'.length).trim();
      const partner = this.deliveryPartners.find((p) => p.id === partnerId);
      if (!partner || partner.accountStatus !== 'active') {
        const err: any = new Error('جلسة الشريك غير صالحة أو الحساب غير نشط');
        err.statusCode = 401;
        throw err;
      }
      const drivers = this.deliveryDrivers.filter((d) => d.partnerId === partner.id);
      const vehicles = this.deliveryVehicles.filter((v) => v.partnerId === partner.id);
      return { mode: 'partner', partner, drivers, vehicles };
    }
    if (raw.startsWith('platform_driver:')) {
      const driverId = raw.slice('platform_driver:'.length).trim();
      const driver = this.deliveryDrivers.find(
        (d) => d.id === driverId && d.providerType === 'platform'
      );
      if (!driver || driver.accountStatus !== 'active') {
        const err: any = new Error('جلسة سائق المنصة غير صالحة أو الحساب غير نشط');
        err.statusCode = 401;
        throw err;
      }
      const vehicles = this.deliveryVehicles.filter((v) => v.ownerType === 'platform');
      return { mode: 'platform_driver', driver, drivers: [driver], vehicles };
    }

    const err: any = new Error('مصادقة بوابة التوصيل مطلوبة (x-delivery-session)');
    err.statusCode = 401;
    throw err;
  }

  loginDeliveryPortal(params: { phone: string; registrationCode: string }) {
    const normPhone = this.normalizeDeliveryPhone(params.phone || '');
    const code = String(params.registrationCode || '').trim().toUpperCase();
    if (!normPhone || !code) {
      const err: any = new Error('يرجى إدخال رقم الهاتف ورمز التسجيل / الرخصة');
      err.statusCode = 400;
      throw err;
    }

    const matchedPartner = this.deliveryPartners.find(
      (p) =>
        this.normalizeDeliveryPhone(p.phone) === normPhone &&
        p.registrationCode.trim().toUpperCase() === code
    );
    if (matchedPartner) {
      if (matchedPartner.accountStatus !== 'active') {
        const err: any = new Error(
          `حساب الشريك (${matchedPartner.name}) حالته الحالية (${matchedPartner.accountStatus}) ولا يمكن تسجيل الدخول قبل التفعيل`
        );
        err.statusCode = 403;
        throw err;
      }
      const token = `partner:${matchedPartner.id}`;
      return {
        sessionToken: token,
        ...this.getDeliveryPortalMe(token)
      };
    }

    const matchedPlatformDriver = this.deliveryDrivers.find(
      (d) =>
        d.providerType === 'platform' &&
        this.normalizeDeliveryPhone(d.phone) === normPhone &&
        (d.licenseNo || '').trim().toUpperCase() === code
    );
    if (matchedPlatformDriver) {
      if (matchedPlatformDriver.accountStatus !== 'active') {
        const err: any = new Error(
          `حساب السائق (${matchedPlatformDriver.name}) حالته (${matchedPlatformDriver.accountStatus}) غير نشطة`
        );
        err.statusCode = 403;
        throw err;
      }
      const token = `platform_driver:${matchedPlatformDriver.id}`;
      return {
        sessionToken: token,
        ...this.getDeliveryPortalMe(token)
      };
    }

    const err: any = new Error('رقم الهاتف أو رمز الدخول غير صحيح');
    err.statusCode = 401;
    throw err;
  }

  getDeliveryPortalMe(sessionToken: string) {
    const session = this.resolveDeliveryPortalSession(sessionToken);
    return {
      mode: session.mode,
      partner: session.partner ? this.enrichDeliveryPartner(session.partner) : null,
      driver: session.driver ? this.enrichDeliveryDriver(session.driver) : null,
      drivers: session.drivers.map((d) => this.enrichDeliveryDriver(d)),
      vehicles: session.vehicles.map((v) => this.enrichDeliveryVehicle(v)),
      codAllowedForPartners: this.deliveryPlatformSettings.codAllowedForPartners,
      maxActiveJobsPerDriver: this.deliveryPlatformSettings.maxActiveJobsPerDriver ?? 3
    };
  }

  setDeliveryDriverAvailability(params: {
    sessionToken: string;
    driverId?: string;
    availability: 'online' | 'offline';
  }) {
    const session = this.resolveDeliveryPortalSession(params.sessionToken);
    const targetDriverId =
      params.driverId || (session.drivers.length === 1 ? session.drivers[0].id : undefined);
    const driver = session.drivers.find((d) => d.id === targetDriverId);
    if (!driver) {
      const err: any = new Error('السائق غير موجود ضمن هذا الحساب');
      err.statusCode = 403;
      throw err;
    }
    this.assertDeliveryDriverOperable(driver.id);
    const avail: 'online' | 'offline' =
      params.availability === 'offline' ? 'offline' : 'online';
    driver.availability = avail;
    driver.isAvailable = avail === 'online';
    return this.enrichDeliveryDriver(driver);
  }

  getAvailablePortalJobs(sessionToken: string) {
    const session = this.resolveDeliveryPortalSession(sessionToken);

    const activeDrivers = session.drivers.filter((d) => d.accountStatus === 'active');
    const coveredZones = new Set<string>();
    const coveredGovs = new Set<string>();

    if (session.partner) {
      coveredGovs.add(session.partner.governorateId);
      for (const z of session.partner.serviceZoneIds) coveredZones.add(z);
    }
    for (const d of activeDrivers) {
      coveredGovs.add(d.governorateId);
      for (const z of d.serviceZoneIds) coveredZones.add(z);
    }

    const openJobs = this.deliveryJobs.filter((j) => {
      if (j.status !== 'open') return false;
      if (j.deliveryZoneId && coveredZones.size > 0) {
        return coveredZones.has(j.deliveryZoneId);
      }
      return coveredGovs.has(j.governorateId);
    });

    return openJobs.map((job) => {
      const eligibleDriverIds: string[] = [];
      const eligibleVehicleIds = new Set<string>();
      const reasonsSet = new Set<string>();

      for (const drv of session.drivers) {
        const candidateVehicles = drv.assignedVehicleId
          ? session.vehicles.filter((v) => v.id === drv.assignedVehicleId)
          : session.vehicles.filter((v) => v.status === 'active');
        let drvEligible = false;
        if (candidateVehicles.length === 0) {
          const ev = this.evaluateDriverVehicleForJob(job, drv, undefined);
          ev.reasonsAr.forEach((r) => reasonsSet.add(r));
        } else {
          for (const veh of candidateVehicles) {
            const ev = this.evaluateDriverVehicleForJob(job, drv, veh);
            if (ev.eligible) {
              drvEligible = true;
              eligibleVehicleIds.add(veh.id);
            } else {
              ev.reasonsAr.forEach((r) => reasonsSet.add(r));
            }
          }
        }
        if (drvEligible) eligibleDriverIds.push(drv.id);
      }

      return {
        ...this.enrichDeliveryJob(job, { sanitizeForPortal: true }),
        canAccept: eligibleDriverIds.length > 0,
        eligibleDriverIds,
        eligibleVehicleIds: Array.from(eligibleVehicleIds),
        ineligibilityReasons: eligibleDriverIds.length > 0 ? [] : Array.from(reasonsSet)
      };
    });
  }

  acceptPortalJob(params: {
    sessionToken: string;
    jobId: string;
    driverId?: string;
    vehicleId?: string;
  }) {
    const session = this.resolveDeliveryPortalSession(params.sessionToken);
    const job = this.deliveryJobs.find((j) => j.id === params.jobId);
    if (!job) {
      const err: any = new Error('مهمة التوصيل غير موجودة');
      err.statusCode = 404;
      throw err;
    }
    if (job.status !== 'open') {
      const err: any = new Error(
        'عذراً، تم قبول هذه المهمة أو إسنادها مسبقاً ولا يمكن قبولها مرة أخرى'
      );
      err.statusCode = 409;
      throw err;
    }

    const driverId =
      params.driverId || (session.drivers.length === 1 ? session.drivers[0].id : undefined);
    const driver = session.drivers.find((d) => d.id === driverId);
    if (!driver) {
      const err: any = new Error('يرجى اختيار سائق تابع لحسابك لتنفيذ المهمة');
      err.statusCode = 400;
      throw err;
    }

    const vehicleId =
      params.vehicleId ||
      driver.assignedVehicleId ||
      (session.vehicles.filter((v) => v.status === 'active').length === 1
        ? session.vehicles.find((v) => v.status === 'active')?.id
        : undefined);
    const vehicle = session.vehicles.find((v) => v.id === vehicleId);

    const evalResult = this.evaluateDriverVehicleForJob(job, driver, vehicle);
    if (!evalResult.eligible) {
      const err: any = new Error(evalResult.reasonsAr.join('؛ '));
      err.statusCode = 400;
      throw err;
    }

    const actorName = session.partner?.name || driver.name;
    this.transitionSubOrder({
      id: job.subOrderId,
      toStatus: 'assigned_driver',
      driverId: driver.id,
      actor: {
        actorType: 'delivery_partner',
        actorId: session.partner?.id || driver.id,
        actorName
      },
      extraHistoryNote: `قبول المهمة (${job.id}) عبر بوابة الشريك بالمركبة ${vehicle!.plateNumber}`
    });

    const nowIso = new Date().toISOString();
    job.status = 'accepted';
    job.assignedPartnerId = session.partner?.id;
    job.assignedDriverId = driver.id;
    job.assignedVehicleId = vehicle!.id;
    job.acceptedAt = nowIso;
    job.attempts = (job.attempts || 0) + 1;
    job.history.push({
      status: 'accepted',
      at: nowIso,
      actorType: session.mode === 'partner' ? 'partner' : 'driver',
      actorId: session.partner?.id || driver.id,
      actorName,
      note: `قبول المهمة للسائق ${driver.name} (${vehicle!.plateNumber})`
    });

    return this.enrichDeliveryJob(job, { sanitizeForPortal: true });
  }

  getMyPortalJobs(sessionToken: string) {
    const session = this.resolveDeliveryPortalSession(sessionToken);
    const jobs = this.deliveryJobs
      .filter((j) =>
        session.mode === 'partner'
          ? j.assignedPartnerId === session.partner!.id
          : j.assignedDriverId === session.driver!.id
      )
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    return jobs.map((j) => this.enrichDeliveryJob(j, { sanitizeForPortal: true }));
  }

  progressPortalJob(params: {
    sessionToken: string;
    jobId: string;
    step: 'arrived-pickup' | 'pickup' | 'start' | 'arrived-dropoff' | 'deliver' | 'fail';
    pickupPin?: string;
    deliveryPin?: string;
    reasonCode?: DeliveryJobFailureReasonCode;
    note?: string;
  }) {
    const session = this.resolveDeliveryPortalSession(params.sessionToken);
    const job = this.deliveryJobs.find((j) => j.id === params.jobId);
    if (!job) {
      const err: any = new Error('مهمة التوصيل غير موجودة');
      err.statusCode = 404;
      throw err;
    }

    const ownsJob =
      session.mode === 'partner'
        ? job.assignedPartnerId === session.partner!.id
        : job.assignedDriverId === session.driver!.id;
    if (!ownsJob) {
      const err: any = new Error('هذه المهمة غير مسندة إلى حسابك');
      err.statusCode = 403;
      throw err;
    }

    const driver = job.assignedDriverId
      ? this.deliveryDrivers.find((d) => d.id === job.assignedDriverId)
      : undefined;
    const actorName = driver?.name || session.partner?.name || 'سائق المنصة';
    const actorId = driver?.id || session.partner?.id;
    const nowIso = new Date().toISOString();

    if (params.step === 'arrived-pickup') {
      if (!['assigned', 'accepted'].includes(job.status)) {
        const err: any = new Error('لا يمكن تسجيل الوصول للمستودع في المرحلة الحالية للمهمة');
        err.statusCode = 400;
        throw err;
      }
      job.status = 'at_pickup';
      job.arrivedPickupAt = nowIso;
      job.history.push({
        status: 'at_pickup',
        at: nowIso,
        actorType: 'driver',
        actorId,
        actorName,
        note: 'وصل السائق إلى مستودع المورد للاستلام'
      });
      return this.enrichDeliveryJob(job, { sanitizeForPortal: true });
    }

    if (params.step === 'pickup') {
      if (job.status !== 'at_pickup') {
        const err: any = new Error('يجب تأكيد الوصول للمستودع أولاً قبل تأكيد استلام الشحنة');
        err.statusCode = 400;
        throw err;
      }
      if (String(params.pickupPin || '').trim() !== job.pickupPin) {
        const err: any = new Error(
          'رمز الاستلام من المستودع (Pickup PIN) غير صحيح! اطلب الرمز المكون من 4 أرقام من أمين المستودع'
        );
        err.statusCode = 400;
        throw err;
      }
      this.transitionSubOrder({
        id: job.subOrderId,
        toStatus: 'out_for_delivery',
        actor: {
          actorType: 'delivery_partner',
          actorId,
          actorName
        },
        extraHistoryNote: `تم التحقق من رمز الاستلام من المستودع للمهمة (${job.id})`
      });
      job.status = 'picked_up';
      job.pickedUpAt = nowIso;
      job.history.push({
        status: 'picked_up',
        at: nowIso,
        actorType: 'driver',
        actorId,
        actorName,
        note: 'تم التحقق من رمز الاستلام واستلام البضاعة من المستودع'
      });
      return this.enrichDeliveryJob(job, { sanitizeForPortal: true });
    }

    if (params.step === 'start') {
      if (job.status !== 'picked_up') {
        const err: any = new Error('يجب إتمام استلام الشحنة برمز المستودع أولاً');
        err.statusCode = 400;
        throw err;
      }
      job.status = 'in_transit';
      job.inTransitAt = nowIso;
      job.history.push({
        status: 'in_transit',
        at: nowIso,
        actorType: 'driver',
        actorId,
        actorName,
        note: 'انطلقت الرحلة باتجاه المتجر'
      });
      return this.enrichDeliveryJob(job, { sanitizeForPortal: true });
    }

    if (params.step === 'arrived-dropoff') {
      if (!['picked_up', 'in_transit'].includes(job.status)) {
        const err: any = new Error('لا يمكن تسجيل الوصول للمتجر في المرحلة الحالية للمهمة');
        err.statusCode = 400;
        throw err;
      }
      job.status = 'at_dropoff';
      job.arrivedDropoffAt = nowIso;
      job.history.push({
        status: 'at_dropoff',
        at: nowIso,
        actorType: 'driver',
        actorId,
        actorName,
        note: 'وصل السائق إلى موقع المتجر'
      });
      return this.enrichDeliveryJob(job, { sanitizeForPortal: true });
    }

    if (params.step === 'deliver') {
      if (job.status !== 'at_dropoff') {
        const err: any = new Error('يجب تسجيل الوصول للمتجر أولاً قبل تأكيد التسليم');
        err.statusCode = 400;
        throw err;
      }
      this.transitionSubOrder({
        id: job.subOrderId,
        toStatus: 'delivered',
        pin: String(params.deliveryPin || '').trim(),
        actor: {
          actorType: 'delivery_partner',
          actorId,
          actorName
        },
        extraHistoryNote: `تم التسليم للمتجر برمز PIN عبر بوابة الشريك (${job.id})`
      });
      job.status = 'delivered';
      job.deliveredAt = nowIso;
      job.history.push({
        status: 'delivered',
        at: nowIso,
        actorType: 'driver',
        actorId,
        actorName,
        note: 'تم التحقق من رمز الاستلام من التاجر وإغلاق المهمة بنجاح'
      });
      return this.enrichDeliveryJob(job, { sanitizeForPortal: true });
    }

    // step === 'fail'
    if (
      !['assigned', 'accepted', 'at_pickup', 'picked_up', 'in_transit', 'at_dropoff'].includes(
        job.status
      )
    ) {
      const err: any = new Error('لا يمكن الإبلاغ عن فشل التوصيل في هذه الحالة');
      err.statusCode = 400;
      throw err;
    }

    const validCodes: DeliveryJobFailureReasonCode[] = [
      'store_closed',
      'customer_refused',
      'address_not_found',
      'vehicle_issue',
      'other'
    ];
    const code = params.reasonCode as DeliveryJobFailureReasonCode;
    if (!validCodes.includes(code)) {
      const err: any = new Error('يرجى اختيار سبب فشل التوصيل');
      err.statusCode = 400;
      throw err;
    }
    const cleanNote = String(params.note || '').trim();
    if (cleanNote.length < 3) {
      const err: any = new Error('يرجى إدخال وصف مختصر لتعذر التوصيل (3 أحرف على الأقل)');
      err.statusCode = 400;
      throw err;
    }

    const order = this.subOrders.find((o) => o.id === job.subOrderId);
    if (order && order.status === 'out_for_delivery') {
      this.transitionSubOrder({
        id: order.id,
        toStatus: 'assigned_driver',
        actor: {
          actorType: 'delivery_partner',
          actorId,
          actorName
        },
        reason: cleanNote,
        extraHistoryNote: `تعذر التوصيل (${code}) في المهمة ${job.id} — بانتظار إعادة التوزيع`
      });
    }

    job.status = 'failed';
    job.failure = {
      reasonCode: code,
      note: cleanNote,
      failedAt: nowIso,
      failedBy: actorName
    };
    job.history.push({
      status: 'failed',
      at: nowIso,
      actorType: 'driver',
      actorId,
      actorName,
      note: `${code}: ${cleanNote}`
    });

    return this.enrichDeliveryJob(job, { sanitizeForPortal: true });
  }

  getDeliveryPortalEarnings(sessionToken: string) {
    const session = this.resolveDeliveryPortalSession(sessionToken);
    const todayPrefix = new Date().toISOString().slice(0, 10);

    const deliveredJobs = this.deliveryJobs
      .filter(
        (j) =>
          j.status === 'delivered' &&
          (session.mode === 'partner'
            ? j.assignedPartnerId === session.partner!.id
            : j.assignedDriverId === session.driver!.id)
      )
      .sort((a, b) => Date.parse(b.deliveredAt || b.createdAt) - Date.parse(a.deliveredAt || a.createdAt));

    const totalEstimatedPayoutIQD = deliveredJobs.reduce(
      (sum, j) => sum + (j.estimatedPayoutIQD || 0),
      0
    );
    const todayPayoutIQD = deliveredJobs
      .filter((j) => (j.deliveredAt || '').slice(0, 10) === todayPrefix)
      .reduce((sum, j) => sum + (j.estimatedPayoutIQD || 0), 0);
    const cashOnHandIQD = session.drivers.reduce((sum, d) => sum + (d.cashOnHandIQD || 0), 0);

    return {
      totalDeliveredCount: deliveredJobs.length,
      totalEstimatedPayoutIQD,
      todayPayoutIQD,
      cashOnHandIQD,
      commissionPercent: this.deliveryPlatformSettings.partnerCommissionPercent || 0,
      codAllowedForPartners: this.deliveryPlatformSettings.codAllowedForPartners,
      recentJobs: deliveredJobs.slice(0, 25).map((j) => ({
        id: j.id,
        subOrderId: j.subOrderId,
        pickupName: j.pickup.name,
        dropoffName: j.dropoff.name,
        dropoffCity: j.dropoff.city,
        estimatedPayoutIQD: j.estimatedPayoutIQD,
        paymentMethod: j.paymentMethod,
        orderSubtotalIQD: j.orderSubtotalIQD,
        deliveredAt: j.deliveredAt
      }))
    };
  }
}

export const db = new AppDataStore();

