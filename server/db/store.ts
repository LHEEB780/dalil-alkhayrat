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
  CatalogBrandStatus
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
  initialShiftReports
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
        deliveryType: 'supplier_fleet',
        deliveryPin: pin,
        createdAt: new Date().toISOString(),
        notes: params.notes
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
        | 'catalog_price_anomaly';
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

    const stuckCutoffMs = endMs - 24 * 60 * 60 * 1000;
    for (const o of this.subOrders) {
      const ts = Date.parse(o.createdAt);
      if (o.status === 'pending' && Number.isFinite(ts) && ts < stuckCutoffMs) {
        needsAttention.push({
          id: `att_stuck_${o.id}`,
          type: 'stuck_order',
          severity: 'high',
          titleAr: `طلب عالق أكثر من 24 ساعة (${o.id})`,
          titleEn: `Order stuck pending >24h (${o.id})`,
          subtitleAr: `${o.storeName} ← ${o.supplierName}`,
          subtitleEn: `${o.storeName} ← ${o.supplierName}`,
          targetSection: 'orders',
          entityId: o.id
        });
      }
      if (o.status === 'disputed') {
        needsAttention.push({
          id: `att_disp_${o.id}`,
          type: 'disputed_order',
          severity: 'high',
          titleAr: `طلب بحالة نزاع مفتوح (${o.id})`,
          titleEn: `Disputed order (${o.id})`,
          subtitleAr: `${o.storeName} • ${(Number(o.subtotalIQD) || 0).toLocaleString('en-US')} د.ع`,
          subtitleEn: `${o.storeName} • ${(Number(o.subtotalIQD) || 0).toLocaleString('en-US')} IQD`,
          targetSection: 'disputes',
          entityId: o.id
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
        catalogQualityPercent: qualitySummary.averageScore,
        catalogLowQualityCount: qualitySummary.below60Count,
        productsWithoutOffersCount: qualitySummary.withoutOffersCount,
        priceAnomalyOffersCount: anomalyOffers.length
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
}

export const db = new AppDataStore();
