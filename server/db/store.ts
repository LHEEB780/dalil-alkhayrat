import {
  UnifiedProduct,
  SupplierOffer,
  StoreProfile,
  SupplierProfile,
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
  Brand
} from './types.ts';
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
  initialBrands
} from './seed.ts';

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
  shiftReports: ShiftCloseReport[] = [];
  storePOSSales: StorePOSSaleRecord[] = [...initialStorePOSSales];
  storePOSReturns: StorePOSReturnRecord[] = [];
  creditUpgradeRequests: CreditUpgradeRequest[] = [];
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

  getSuppliersByZone(deliveryZoneId?: string): SupplierProfile[] {
    if (!deliveryZoneId) return this.suppliers;
    return this.suppliers.filter(s => s.serviceZoneIds.includes(deliveryZoneId));
  }

  // ================= PRODUCTS & OFFERS =================
  getProductsWithOffers(params?: { category?: string; query?: string; barcode?: string; deliveryZoneId?: string }) {
    let result = this.products;

    if (params?.barcode) {
      result = result.filter(p => p.barcode === params.barcode);
    }
    if (params?.category && params.category !== 'الكل') {
      const resolvedCat = SERVER_CATEGORY_ALIASES[params.category] || params.category;
      result = result.filter(p => p.category === params.category || p.category === resolvedCat);
    }
    if (params?.query) {
      const q = params.query.toLowerCase().trim();
      const BILINGUAL_SUBCATEGORY_KEYWORDS: Record<string, string[]> = {
        'أرز': ['rice', 'basmati', 'anbar', 'long grain', 'mahmood rice'],
        'سكر ومحليات': ['sugar', 'white sugar', 'cane sugar', 'sweeteners', 'brown sugar', 'stevia'],
        'طحين ونشويات': ['flour', 'wheat flour', 'starch', 'cornstarch'],
        'بقوليات': ['lentils', 'chickpeas', 'beans', 'pulses', 'legumes'],
        'مكرونة وشعرية ونودلز': ['pasta', 'spaghetti', 'vermicelli', 'noodles', 'macaroni', 'barilla', 'indomie'],
        'زيت دوار الشمس': ['sunflower oil', 'cooking oil', 'afia', 'vegetable oil', 'oil'],
        'معجون وصلصة الطماطم': ['tomato paste', 'tomato sauce', 'crushed tomatoes'],
        'حليب بودرة ومبخر ومكثف': ['milk powder', 'nido', 'evaporated milk', 'condensed milk', 'milk', 'dairy'],
        'أجبان': ['cheese', 'mozzarella', 'cheddar', 'feta', 'kiri', 'puck', 'dairy'],
        'بطاطا مجمدة': ['french fries', 'frozen potatoes', 'fries', 'wedges', 'frozen'],
        'مياه معدنية': ['mineral water', 'water', 'bottled water', 'al-waha', 'aquafina', 'beverages', 'drinks'],
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
      result = result.filter(p => {
        const subKws = p.subCategory ? (BILINGUAL_SUBCATEGORY_KEYWORDS[p.subCategory] || []) : [];
        return (
          p.nameAr.toLowerCase().includes(q) ||
          (p.nameEn ? p.nameEn.toLowerCase().includes(q) : false) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.subCategory ? p.subCategory.toLowerCase().includes(q) : false) ||
          p.barcode.includes(q) ||
          subKws.some(kw => kw.includes(q))
        );
      });
    }

    const eligibleSupplierIds = params?.deliveryZoneId
      ? new Set(this.getSuppliersByZone(params.deliveryZoneId).map(s => s.id))
      : null;

    const mapped = result.map(product => {
      const productOffers = this.offers.filter(o => {
        if (o.barcode !== product.barcode) return false;
        if (eligibleSupplierIds && !eligibleSupplierIds.has(o.supplierId)) return false;
        return true;
      });
      // Sort offers: lowest price first
      productOffers.sort((a, b) => a.priceIQD - b.priceIQD);

      const minPrice = productOffers.length > 0 ? productOffers[0].priceIQD : 0;
      const maxPrice = productOffers.length > 0 ? Math.max(...productOffers.map(o => o.priceIQD)) : 0;
      const suppliersCount = productOffers.length;
      const totalAvailableStock = productOffers.reduce((sum, o) => sum + o.availableStock, 0);
      const longestCreditDays = productOffers.reduce((max, o) => Math.max(max, o.paymentTerms.maxCreditDays), 0);
      const fastestDeliveryDays = productOffers.length > 0 ? Math.min(...productOffers.map(o => o.deliveryDays)) : 1;

      return {
        ...product,
        offers: productOffers,
        minPrice,
        maxPrice,
        suppliersCount,
        totalAvailableStock,
        longestCreditDays,
        fastestDeliveryDays
      };
    });

    if (eligibleSupplierIds) {
      return mapped.filter(p => p.offers.length > 0);
    }
    return mapped;
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

    // Validate delivery zone coverage before deducting any stock
    if (params.deliveryZoneId) {
      for (const reqItem of params.items) {
        const offer = this.offers.find(o => o.id === reqItem.offerId);
        if (offer) {
          const supplier = this.suppliers.find(s => s.id === offer.supplierId);
          if (supplier && !supplier.serviceZoneIds.includes(params.deliveryZoneId)) {
            throw new Error(`المورد (${supplier.companyName}) لا يغطي منطقة التوصيل المختارة حالياً`);
          }
        }
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
      subtotalIQD: number;
    }> = {};

    for (const reqItem of params.items) {
      const offer = this.offers.find(o => o.id === reqItem.offerId);
      const product = this.products.find(p => p.barcode === reqItem.barcode);
      if (!offer || !product) {
        throw new Error(`Offer or product not found for barcode ${reqItem.barcode}`);
      }

      if (offer.availableStock < reqItem.quantity) {
        throw new Error(`الكمية المطلوبة من ${product.nameAr} تتجاوز المخزون المتوفر لدى ${offer.supplierName}`);
      }

      if (!supplierGroups[offer.supplierId]) {
        supplierGroups[offer.supplierId] = {
          supplierId: offer.supplierId,
          supplierName: offer.supplierName,
          items: [],
          subtotalIQD: 0
        };
      }

      const lineTotal = offer.priceIQD * reqItem.quantity;
      supplierGroups[offer.supplierId].items.push({
        barcode: product.barcode,
        productName: product.nameAr,
        unit: product.unit,
        quantity: reqItem.quantity,
        unitPriceIQD: offer.priceIQD,
        totalPriceIQD: lineTotal
      });
      supplierGroups[offer.supplierId].subtotalIQD += lineTotal;

      // Deduct available stock
      offer.availableStock -= reqItem.quantity;
    }

    const parentOrderId = `ORD-${Date.now()}`;
    const subOrders: SubOrder[] = [];
    let totalAmountIQD = 0;

    for (const suppId of Object.keys(supplierGroups)) {
      const group = supplierGroups[suppId];
      totalAmountIQD += group.subtotalIQD;

      // Check credit limit if paying by credit
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

    // Validate all lines before mutating stock
    const resolvedLines: { vanItem: VanInventoryItem; qty: number; lineTotal: number }[] = [];
    let grandTotal = 0;

    for (const req of lineRequests) {
      const qty = Math.floor(Number(req.quantity));
      if (!qty || qty <= 0) throw new Error('كمية البيع يجب أن تكون رقماً موجباً');
      const vanItem = this.vanInventory.find(
        v => v.driverId === params.driverId && v.barcode === req.barcode
      );
      if (!vanItem || vanItem.remainingQuantity < qty) {
        throw new Error(`الكمية المطلوبة غير متوفرة في مخزون الفان للصنف (${vanItem?.productName || req.barcode})`);
      }
      const lineTotal = vanItem.unitPriceIQD * qty;
      grandTotal += lineTotal;
      resolvedLines.push({ vanItem, qty, lineTotal });
    }

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

    for (const { vanItem, qty, lineTotal } of resolvedLines) {
      vanItem.soldQuantity += qty;
      vanItem.remainingQuantity -= qty;
      this.syncVanItemToStoreInventory(store.id, vanItem, qty);
      txItems.push({
        barcode: vanItem.barcode,
        productName: vanItem.productName,
        unit: vanItem.unit,
        quantity: qty,
        unitPriceIQD: vanItem.unitPriceIQD,
        totalIQD: lineTotal
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
    const driver = this.drivers.find(d => d.id === params.driverId);
    if (!driver) throw new Error('السائق غير موجود');
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

  createVanLoadRequest(params: {
    driverId: string;
    items: { barcode: string; quantity: number }[];
    notes?: string;
  }): VanLoadRequest {
    const driver = this.drivers.find(d => d.id === params.driverId);
    if (!driver) throw new Error('السائق غير موجود');
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
    type: 'return' | 'damage';
    reason: string;
  }) {
    const vanItem = this.vanInventory.find(v => v.driverId === params.driverId && v.barcode === params.barcode);
    if (!vanItem) throw new Error('الصنف غير موجود في حمولة الفان');

    if (params.type === 'return') {
      vanItem.returnedQuantity += params.quantity;
      vanItem.remainingQuantity += params.quantity;
    } else {
      vanItem.damagedQuantity += params.quantity;
      vanItem.remainingQuantity = Math.max(0, vanItem.remainingQuantity - params.quantity);
    }

    return vanItem;
  }

  closeDriverShift(params: {
    driverId: string;
    actualCashCountedIQD: number;
    notes?: string;
  }): ShiftCloseReport {
    const driver = this.drivers.find(d => d.id === params.driverId);
    if (!driver) throw new Error('السائق غير موجود');

    const expectedCash = driver.currentCashCollectedIQD;
    const cashVariance = params.actualCashCountedIQD - expectedCash;

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
      notes: params.notes,
      status: 'pending_supplier_approval'
    };

    this.shiftReports.unshift(report);
    // Reset driver cash for new shift
    driver.currentCashCollectedIQD = 0;
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
}

export const db = new AppDataStore();
