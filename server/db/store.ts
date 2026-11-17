import {
  UnifiedProduct,
  SupplierOffer,
  StoreProfile,
  SupplierProfile,
  DriverProfile,
  VanInventoryItem,
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
  CreditUpgradeRequest,
  SupplierReview,
  SupplierReviewSummary
} from './types.ts';
import {
  initialProducts,
  initialSuppliers,
  initialOffers,
  initialStores,
  initialDrivers,
  initialVanInventory,
  initialCreditAccounts,
  initialLedgerEntries,
  initialStoreInventory,
  initialSubOrders,
  initialCollectivePools,
  initialPosters,
  initialStorePOSSales
} from './seed.ts';

class AppDataStore {
  products: UnifiedProduct[] = [...initialProducts];
  suppliers: SupplierProfile[] = [...initialSuppliers];
  offers: SupplierOffer[] = [...initialOffers];
  stores: StoreProfile[] = [...initialStores];
  drivers: DriverProfile[] = [...initialDrivers];
  vanInventory: VanInventoryItem[] = [...initialVanInventory];
  creditAccounts: CreditAccount[] = [...initialCreditAccounts];
  ledgerEntries: LedgerEntry[] = [...initialLedgerEntries];
  subOrders: SubOrder[] = [...initialSubOrders];
  storeInventory: StoreInventoryItem[] = [...initialStoreInventory];
  collectivePools: CollectiveBuyingPool[] = [...initialCollectivePools];
  posters: StorePosterConfig[] = [...initialPosters];
  shiftReports: ShiftCloseReport[] = [];
  storePOSSales: StorePOSSaleRecord[] = [...initialStorePOSSales];
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

  // ================= PRODUCTS & OFFERS =================
  getProductsWithOffers(params?: { category?: string; query?: string; barcode?: string }) {
    let result = this.products;

    if (params?.barcode) {
      result = result.filter(p => p.barcode === params.barcode);
    }
    if (params?.category && params.category !== 'الكل') {
      result = result.filter(p => p.category === params.category);
    }
    if (params?.query) {
      const q = params.query.toLowerCase().trim();
      result = result.filter(p => 
        p.nameAr.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.barcode.includes(q)
      );
    }

    return result.map(product => {
      const productOffers = this.offers.filter(o => o.barcode === product.barcode);
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
  }): ParentOrder {
    const store = this.stores.find(s => s.id === params.storeId);
    if (!store) throw new Error('Store profile not found');

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

  // ================= VAN MOBILE WAREHOUSE OPERATIONS =================
  recordVanDirectSale(params: {
    driverId: string;
    storeId: string;
    barcode: string;
    quantity: number;
    paymentType: 'cash' | 'credit';
  }) {
    const driver = this.drivers.find(d => d.id === params.driverId);
    if (!driver) throw new Error('Driver not found');
    const store = this.stores.find(s => s.id === params.storeId);
    if (!store) throw new Error('Store not found');

    const vanItem = this.vanInventory.find(v => v.driverId === params.driverId && v.barcode === params.barcode);
    if (!vanItem || vanItem.remainingQuantity < params.quantity) {
      throw new Error('الكمية غير متوفرة في مخزون سيارة التوزيع (الفان)');
    }

    const saleAmount = vanItem.unitPriceIQD * params.quantity;
    vanItem.soldQuantity += params.quantity;
    vanItem.remainingQuantity -= params.quantity;

    if (params.paymentType === 'cash') {
      driver.currentCashCollectedIQD += saleAmount;
    } else {
      // Record in ledger
      const creditAcc = this.getCreditAccount(store.id, driver.supplierId);
      if (creditAcc) {
        this.addLedgerEntry({
          creditAccountId: creditAcc.id,
          supplierId: driver.supplierId,
          storeId: store.id,
          referenceType: 'INVOICE',
          referenceId: `VAN-SALE-${Date.now()}`,
          entryDate: new Date().toISOString().split('T')[0],
          debitIQD: saleAmount,
          creditIQD: 0,
          runningBalanceIQD: creditAcc.currentUsedCreditIQD + saleAmount,
          descriptionAr: `بيع فوري مباشر من سيارة التوزيع (${driver.vanWarehouseName}) - ${vanItem.productName}`
        });
      }
    }

    // Update store inventory
    const storeItem = this.storeInventory.find(s => s.storeId === store.id && s.barcode === params.barcode);
    if (storeItem) {
      storeItem.stockQuantity += params.quantity;
      storeItem.isLowStock = storeItem.stockQuantity <= storeItem.reorderLevel;
    }

    return {
      success: true,
      saleAmountIQD: saleAmount,
      remainingVanStock: vanItem.remainingQuantity,
      driverCashBalance: driver.currentCashCollectedIQD
    };
  }

  recordVanReturnOrDamage(params: {
    driverId: string;
    barcode: string;
    quantity: number;
    type: 'return' | 'damage';
    reason: string;
  }) {
    const vanItem = this.vanInventory.find(v => v.driverId === params.driverId && v.barcode === params.barcode);
    if (!vanItem) throw new Error('Item not in van');

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
    if (!driver) throw new Error('Driver not found');

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
