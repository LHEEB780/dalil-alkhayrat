import { Router, Request, Response } from 'express';
import { db } from '../db/store.ts';
import { askStoreAssistant } from '../services/aiAssistantService.ts';

export const apiRouter = Router();

// ================= 1. UNIFIED CATALOG & OFFERS =================
apiRouter.get('/products', (req: Request, res: Response) => {
  try {
    const { category, query, barcode } = req.query;
    const products = db.getProductsWithOffers({
      category: category as string,
      query: query as string,
      barcode: barcode as string
    });
    res.json({ success: true, count: products.length, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/products/:barcode', (req: Request, res: Response) => {
  try {
    const { barcode } = req.params;
    const items = db.getProductsWithOffers({ barcode });
    if (items.length === 0) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }
    res.json({ success: true, data: items[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/suppliers', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.suppliers });
});

apiRouter.get('/suppliers/reviews/summary', (_req: Request, res: Response) => {
  try {
    const summaries = db.getAllSupplierReviewSummaries();
    res.json({ success: true, data: summaries });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/suppliers/:supplierId/reviews', (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const reviews = db.getSupplierReviews(supplierId);
    const summary = db.getSupplierReviewSummary(supplierId);
    res.json({ success: true, summary, data: reviews });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/suppliers/:supplierId/reviews', (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const { storeId, storeName, rating, serviceRating, qualityRating, comment, orderId } = req.body;
    const result = db.addSupplierReview({
      supplierId,
      storeId,
      storeName: storeName || 'سوبرماركت المنصور المركزي',
      rating: Number(rating),
      serviceRating: serviceRating ? Number(serviceRating) : undefined,
      qualityRating: qualityRating ? Number(qualityRating) : undefined,
      comment,
      orderId
    });
    res.status(201).json({
      success: true,
      message: 'تم نشر تقييمك للمورد بنجاح، شكراً لمساهمتك في تعزيز الثقة بسوق الجملة.',
      data: result.review,
      summary: result.summary
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.get('/stores', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.stores });
});

// ================= 2. CART & MULTI-SUPPLIER ORDER SPLIT =================
apiRouter.post('/orders', (req: Request, res: Response) => {
  try {
    const { storeId, items, paymentMethod, notes } = req.body;
    if (!storeId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'بيانات الطلب غير مكتملة' });
    }

    const parentOrder = db.createSplitOrder({
      storeId,
      items,
      paymentMethod: paymentMethod || 'cod',
      notes
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الطلب بنجاح وتقسيمه تلقائياً حسب الموردين',
      data: parentOrder
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.get('/orders', (req: Request, res: Response) => {
  try {
    const { storeId, supplierId, driverId, status } = req.query;
    let list = db.subOrders;

    if (storeId) list = list.filter(o => o.storeId === storeId);
    if (supplierId) list = list.filter(o => o.supplierId === supplierId);
    if (driverId) list = list.filter(o => o.assignedDriverId === driverId);
    if (status) list = list.filter(o => o.status === status);

    res.json({ success: true, count: list.length, data: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.patch('/orders/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, deliveryPin, driverId } = req.body;
    const order = db.subOrders.find(o => o.id === id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    // Verify delivery PIN when delivering
    if (status === 'delivered') {
      if (order.deliveryPin && deliveryPin !== order.deliveryPin) {
        return res.status(400).json({
          success: false,
          message: 'رمز التحقق من الاستلام (PIN) غير صحيح! اطلب الرمز المكون من 4 أرقام من صاحب المتجر.'
        });
      }
      order.deliveredAt = new Date().toISOString();
      if (order.paymentMethod === 'cod') {
        order.paidAt = new Date().toISOString();
        // Add to driver cash if assigned
        const driver = db.drivers.find(d => d.id === order.assignedDriverId);
        if (driver) {
          driver.currentCashCollectedIQD += order.subtotalIQD;
        }
      }
    }

    if (driverId) {
      const driver = db.drivers.find(d => d.id === driverId);
      if (driver) {
        order.assignedDriverId = driver.id;
        order.assignedDriverName = driver.name;
      }
    }

    if (status) {
      order.status = status;
    }

    res.json({ success: true, message: 'تم تحديث حالة الطلب', data: order });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ================= 3. CREDIT SYSTEM & LEDGER =================
apiRouter.get('/credit/accounts', (req: Request, res: Response) => {
  try {
    const { storeId, supplierId } = req.query;
    let list = db.creditAccounts;
    if (storeId) list = list.filter(c => c.storeId === storeId);
    if (supplierId) list = list.filter(c => c.supplierId === supplierId);
    const enriched = list.map(acc => {
      const supp = db.suppliers.find(s => s.id === acc.supplierId);
      return {
        ...acc,
        supplierName: supp?.companyName || acc.supplierId,
        supplierCity: supp?.city || '',
        supplierPhone: supp?.phone || ''
      };
    });
    res.json({ success: true, data: enriched });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/credit/ledger/:accountId', (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const ledger = db.getLedger(accountId);
    const account = db.creditAccounts.find(c => c.id === accountId);
    res.json({ success: true, account, count: ledger.length, data: ledger });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/credit/ledger/payment', (req: Request, res: Response) => {
  try {
    const { creditAccountId, amountIQD, receiptNumber, notes } = req.body;
    const account = db.creditAccounts.find(c => c.id === creditAccountId);
    if (!account) {
      return res.status(404).json({ success: false, message: 'الحساب الائتماني غير موجود' });
    }
    if (!amountIQD || amountIQD <= 0) {
      return res.status(400).json({ success: false, message: 'مبلغ التسديد غير صالح' });
    }

    const entry = db.addLedgerEntry({
      creditAccountId,
      supplierId: account.supplierId,
      storeId: account.storeId,
      referenceType: 'PAYMENT',
      referenceId: receiptNumber || `RCP-${Date.now()}`,
      entryDate: new Date().toISOString().split('T')[0],
      debitIQD: 0,
      creditIQD: Number(amountIQD),
      runningBalanceIQD: Math.max(0, account.currentUsedCreditIQD - Number(amountIQD)),
      descriptionAr: notes || `تسديد نقدي لسند قبض رقم ${receiptNumber || 'عام'}`
    });

    res.status(201).json({
      success: true,
      message: 'تم تسجيل دفعة التسديد في دفتر الأستاذ وتحديث الرصيد',
      entry,
      account
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.post('/credit/ledger/reversal', (req: Request, res: Response) => {
  try {
    const { entryId, reason } = req.body;
    if (!entryId || !reason) {
      return res.status(400).json({ success: false, message: 'يجب تحديد رقم القيد والسبب المحاسبي للإلغاء' });
    }

    const reversingEntry = db.reverseLedgerEntry(entryId, reason);
    res.json({
      success: true,
      message: 'تم إنشاء القيد العكسي بنجاح وتصحيح رصيد الحساب دون مسح السجل التاريخي',
      data: reversingEntry
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.patch('/credit/accounts/:id/limit', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newLimitIQD, allowException } = req.body;
    const updated = db.updateCreditLimit(id, Number(newLimitIQD), Boolean(allowException));
    res.json({ success: true, message: 'تم تحديث سقف الائتمان', data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.get('/credit/upgrade-requests', (req: Request, res: Response) => {
  try {
    const { storeId, supplierId } = req.query;
    let list = db.creditUpgradeRequests;
    if (storeId) list = list.filter(r => r.storeId === storeId);
    if (supplierId) list = list.filter(r => r.supplierId === supplierId);
    res.json({ success: true, data: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/credit/upgrade-requests', (req: Request, res: Response) => {
  try {
    const { creditAccountId, requestedLimitIQD, reason } = req.body;
    const created = db.createCreditUpgradeRequest({
      creditAccountId,
      requestedLimitIQD: Number(requestedLimitIQD),
      reason
    });
    res.status(201).json({
      success: true,
      message: created.platformResponseAr,
      data: created
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.patch('/credit/upgrade-requests/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { decision, approvedLimitIQD } = req.body;
    const resolved = db.resolveCreditUpgradeRequest({
      requestId: id,
      decision: decision === 'approved' ? 'approved' : 'deferred_by_policy',
      approvedLimitIQD: approvedLimitIQD ? Number(approvedLimitIQD) : undefined
    });
    res.json({
      success: true,
      message: resolved.platformResponseAr,
      data: resolved
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ================= 4. DISTRIBUTOR / VAN MOBILE WAREHOUSE =================
apiRouter.get('/drivers', (req: Request, res: Response) => {
  const { supplierId } = req.query;
  let list = db.drivers;
  if (supplierId) list = list.filter(d => d.supplierId === supplierId);
  res.json({ success: true, data: list });
});

apiRouter.get('/van/inventory/:driverId', (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const driver = db.drivers.find(d => d.id === driverId);
    if (!driver) return res.status(404).json({ success: false, message: 'السائق غير موجود' });
    const items = db.vanInventory.filter(v => v.driverId === driverId);
    res.json({
      success: true,
      driver,
      inventory: items,
      totalLoadedUnits: items.reduce((s, i) => s + i.loadedQuantity, 0),
      totalRemainingUnits: items.reduce((s, i) => s + i.remainingQuantity, 0)
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/van/direct-sale', (req: Request, res: Response) => {
  try {
    const { driverId, storeId, barcode, quantity, paymentType } = req.body;
    const result = db.recordVanDirectSale({
      driverId,
      storeId,
      barcode,
      quantity: Number(quantity),
      paymentType: paymentType || 'cash'
    });
    res.json({
      success: true,
      message: 'تم إتمام البيع المباشر من سيارة التوزيع بنجاح وتحديث مخزون الفان',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.post('/van/return', (req: Request, res: Response) => {
  try {
    const { driverId, barcode, quantity, type, reason } = req.body;
    const item = db.recordVanReturnOrDamage({
      driverId,
      barcode,
      quantity: Number(quantity),
      type: type || 'return',
      reason: reason || 'طلب استرجاع من المتجر'
    });
    res.json({ success: true, message: 'تم قيد المرتجع أو التالف بنجاح', data: item });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.post('/van/shift-close', (req: Request, res: Response) => {
  try {
    const { driverId, actualCashCountedIQD, notes } = req.body;
    const report = db.closeDriverShift({
      driverId,
      actualCashCountedIQD: Number(actualCashCountedIQD),
      notes
    });
    res.json({
      success: true,
      message: 'تم إغلاق الوردية اليومية بنجاح واحتساب فرق الصندوق (المتوقع مقابل الفعلي)',
      data: report
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ================= 5. STORE INVENTORY & POS =================
apiRouter.get('/store/inventory/:storeId', (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const items = db.storeInventory.filter(s => s.storeId === storeId);
    const store = db.stores.find(s => s.id === storeId);
    res.json({
      success: true,
      store,
      data: items,
      lowStockItems: items.filter(i => i.isLowStock),
      nearExpiryItems: items.filter(i => i.isNearExpiry)
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/store/pos-sales/:storeId', (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const sales = db.storePOSSales.filter(s => s.storeId === storeId);
    res.json({
      success: true,
      count: sales.length,
      data: sales
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/store/pos-sale', (req: Request, res: Response) => {
  try {
    const {
      storeId,
      items,
      totalIQD,
      subtotalIQD,
      discountIQD,
      orderMode,
      customerName,
      paymentType
    } = req.body;
    const result = db.recordStorePOSSale({
      storeId,
      items,
      totalIQD: Number(totalIQD),
      subtotalIQD: subtotalIQD !== undefined ? Number(subtotalIQD) : Number(totalIQD),
      discountIQD: discountIQD !== undefined ? Number(discountIQD) : 0,
      orderMode,
      customerName,
      paymentType: paymentType || 'cash'
    });
    res.json({ success: true, message: 'تم تسجيل عملية البيع وخصم المخزون', data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ================= LOW STOCK ALERT SYSTEM ENDPOINTS =================
apiRouter.get('/store/low-stock-alerts/:storeId', (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const alerts = db.getLowStockAlerts(storeId);
    const criticalCount = alerts.filter(a => a.urgency === 'critical').length;
    const warningCount = alerts.filter(a => a.urgency === 'warning').length;
    
    res.json({
      success: true,
      storeId,
      totalAlerts: alerts.length,
      criticalCount,
      warningCount,
      hasUrgentAlerts: criticalCount > 0,
      alerts,
      data: alerts
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.patch('/store/inventory/:storeId/threshold', (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { barcode, reorderLevel, stockQuantity } = req.body;
    
    if (!barcode || reorderLevel === undefined) {
      return res.status(400).json({ success: false, message: 'الباركود وحد إعادة الطلب مطلوبان' });
    }

    const updatedItem = db.updateInventoryThreshold(
      storeId,
      barcode,
      Number(reorderLevel),
      stockQuantity !== undefined ? Number(stockQuantity) : undefined
    );

    res.json({
      success: true,
      message: `تم تحديث حد إعادة الطلب للمنتج (${updatedItem.productName}) إلى ${updatedItem.reorderLevel}`,
      data: updatedItem
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.post('/store/inventory/:storeId/simulate-drop', (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { barcode, amount } = req.body;
    const item = db.simulateStockDeduction(storeId, barcode, Number(amount || 2));
    res.json({
      success: true,
      message: `تم محاكاة نقص المخزون لـ (${item.productName}) - الكمية الحالية: ${item.stockQuantity}`,
      data: item
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ================= 6. COLLECTIVE BUYING & EXPIRY CLEARANCE =================
apiRouter.get('/collective-pools', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.collectivePools });
});

apiRouter.post('/collective-pools/:id/pledge', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const pool = db.collectivePools.find(p => p.id === id);
    if (!pool) return res.status(404).json({ success: false, message: 'المجموعة غير موجودة' });

    pool.currentPledgedQuantity += Number(quantity);
    pool.participantsCount += 1;
    if (pool.currentPledgedQuantity >= pool.targetQuantity) {
      pool.status = 'completed';
    }

    res.json({
      success: true,
      message: 'تم الانضمام لطلب الشراء الجماعي بنجاح وحجز الحصة',
      data: pool
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ================= 7. STORE QR POSTER & B2C STOREFRONT =================
apiRouter.get('/posters/:storeId', (req: Request, res: Response) => {
  const { storeId } = req.params;
  const poster = db.posters.find(p => p.storeId === storeId) || db.posters[0];
  res.json({ success: true, data: poster });
});

apiRouter.post('/posters/scan/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const poster = db.trackQRScan(slug);
  res.json({ success: true, data: poster });
});

// ================= 7. DYNAMIC STOREFRONT & OWNER MANAGEMENT =================
// In-memory persistent state for supermarket storefront (products, banners, settings)
interface StorefrontState {
  storeId: string;
  slug: string;
  name: string;
  ownerName: string;
  phone: string;
  district: string;
  address: string;
  coverImageUrl: string;
  logoUrl: string;
  rating: number;
  reviewsCount: number;
  workingHoursAr: string;
  workingHoursEn: string;
  deliveryTimeMinutes: number;
  minOrderIQD: number;
  deliveryFeeIQD: number;
  freeDeliveryThresholdIQD: number;
  announcementAr: string;
  banners: Array<{
    id: number;
    titleAr: string;
    titleEn: string;
    descAr: string;
    descEn: string;
    badgeAr: string;
    badgeEn: string;
    badgeBg: string;
    bgColor: string;
    image: string;
    active: boolean;
  }>;
  products: Array<{
    barcode: string;
    productName: string;
    nameEn: string;
    brand: string;
    category: string;
    subCategory: string;
    unit: string;
    retailSellingPriceIQD: number;
    oldPrice?: number;
    discountPercent?: number;
    stockQuantity: number;
    rating: number;
    reviewsCount: number;
    imageUrl: string;
    isFeatured?: boolean;
    active?: boolean;
  }>;
}

const almansoorStorefrontState: StorefrontState = {
  storeId: 'store_almansoor',
  slug: 'almansoor-market',
  name: 'سوبرماركت المنصور المركزي',
  ownerName: 'عمار خضير الدوري',
  phone: '+964 771 555 8899',
  district: 'بغداد - حي المنصور',
  address: 'شارع 14 رمضان - قرب ساحة الرواد، عمارة الأمل',
  coverImageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
  logoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80',
  rating: 4.9,
  reviewsCount: 520,
  workingHoursAr: 'مفتوح الآن • 8:00 ص - 1:00 منتصف الليل',
  workingHoursEn: 'Open Now • 8:00 AM - 1:00 AM',
  deliveryTimeMinutes: 20,
  minOrderIQD: 5000,
  deliveryFeeIQD: 2000,
  freeDeliveryThresholdIQD: 25000,
  announcementAr: '⚡ أسبوع التوفير الكبير: خصومات وتخفيضات تصل إلى 40% على الزيوت والمواد التموينية مع توصيل فوري 20 دقيقة!',
  banners: [
    {
      id: 1,
      titleAr: '⚡ أسبوع التوفير الكبير في سوبرماركت المنصور',
      titleEn: '⚡ Super Savings Week at Al-Mansour Supermarket',
      descAr: 'خصومات تصل إلى 40% على الزيوت، الأرز، والمعلبات الأساسية',
      descEn: 'Up to 40% OFF on cooking oils, basmati rice, and pantry staples',
      badgeAr: 'خصم 40%',
      badgeEn: '40% OFF',
      badgeBg: 'bg-[#FFE600] text-gray-950',
      bgColor: 'from-emerald-700 via-emerald-800 to-green-950',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
      active: true
    },
    {
      id: 2,
      titleAr: '🥛 منتجات الألبان والأجبان الطازجة يومياً',
      titleEn: '🥛 Fresh Daily Dairy, Milk & Chilled Cheese',
      descAr: 'حليب، أجبان، زبدة، وقشطة طازجة من أفضل المزارع تصلك مبردة',
      descEn: 'Chilled delivery for farm milk, cheeses, butter, and cream',
      badgeAr: 'طازج مبرد',
      badgeEn: 'Fresh Chilled',
      badgeBg: 'bg-blue-500 text-white',
      bgColor: 'from-blue-700 via-blue-800 to-slate-900',
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
      active: true
    },
    {
      id: 3,
      titleAr: '🧼 عروض النظافة والمطهرات وحماية المنزل',
      titleEn: '🧼 Complete Home Care & Disinfectant Deals',
      descAr: 'اشتري 2 واحصل على 1 مجاناً من منظفات ديتول ومساحيق الغسيل',
      descEn: 'Buy 2 Get 1 Free on disinfectants, surface cleaners & detergents',
      badgeAr: 'اشترِ 2 واحصل على 1',
      badgeEn: 'Buy 2 Get 1',
      badgeBg: 'bg-rose-500 text-white',
      bgColor: 'from-rose-700 via-rose-800 to-red-950',
      image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=800&q=80',
      active: true
    },
    {
      id: 4,
      titleAr: '🚀 التوصيل فوري خلال 20 دقيقة لباب بيتك',
      titleEn: '🚀 Ultra-Fast Doorstep Delivery in 20 Minutes',
      descAr: 'خدمة التوصيل السريع متاحة لكافة أرجاء المنصور، اليرموك والكرخ',
      descEn: 'Fast delivery to Al-Mansoor, Yarmouk & Karkh districts',
      badgeAr: 'توصيل 20 دقيقة',
      badgeEn: '20 Min Delivery',
      badgeBg: 'bg-[#00A046] text-white',
      bgColor: 'from-amber-600 via-amber-700 to-orange-950',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
      active: true
    }
  ],
  products: [
    {
      barcode: '6210001234567-RET',
      productName: 'زيت دوار الشمس النقي عافية (مفرد)',
      nameEn: 'Pure Sunflower Cooking Oil Afia 1L',
      brand: 'عافية الفرات',
      category: 'زيوت وسمن',
      subCategory: 'زيوت وسمن وطبخ',
      unit: 'قارورة مفردة (1 لتر)',
      retailSellingPriceIQD: 3500,
      oldPrice: 4000,
      discountPercent: 12,
      stockQuantity: 45,
      rating: 4.9,
      reviewsCount: 112,
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
      active: true
    },
    {
      barcode: '6281007000123-RET',
      productName: 'أرز بسمتي هندي عنبر درجة أولى (مفرد)',
      nameEn: 'Amber Premium Indian Basmati Rice 2kg',
      brand: 'أبو خروف الذهبي',
      category: 'أرز وحبوب',
      subCategory: 'أرز ومواد تموينية',
      unit: 'كيس منزلي (2 كغم)',
      retailSellingPriceIQD: 4000,
      oldPrice: 4500,
      discountPercent: 11,
      stockQuantity: 30,
      rating: 4.8,
      reviewsCount: 154,
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
      active: true
    },
    {
      barcode: '6281001234501-RET',
      productName: 'حليب بودرة كامل الدسم فوري الرافدين (مفرد)',
      nameEn: 'Full Cream Instant Milk Powder 400g',
      brand: 'الرافدين الذهبي',
      category: 'ألبان وأجبان',
      subCategory: 'ألبان وأجبان تبريد',
      unit: 'علبة مفردة (400 غرام)',
      retailSellingPriceIQD: 3250,
      oldPrice: 3750,
      discountPercent: 13,
      stockQuantity: 28,
      rating: 4.7,
      reviewsCount: 88,
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
      active: true
    },
    {
      barcode: '5201002345678-RET',
      productName: 'معجون طماطم تركي مركز لونا (مفرد)',
      nameEn: 'Turkish Double Concentrated Tomato Paste 800g',
      brand: 'لونا بغداد',
      category: 'معلبات ومخللات',
      subCategory: 'معلبات وصلصات',
      unit: 'علبة مفردة (800 غرام)',
      retailSellingPriceIQD: 1250,
      oldPrice: 1500,
      discountPercent: 16,
      stockQuantity: 60,
      rating: 4.9,
      reviewsCount: 210,
      imageUrl: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=400&q=80',
      active: true
    },
    {
      barcode: '7622210123456-RET',
      productName: 'شاي سيلاني أسود كلاسيك فرط الكوزي (مفرد)',
      nameEn: 'Ceylon Black Tea Loose Leaf 400g',
      brand: 'شاي الكوزي سيلان',
      category: 'سكر وحلويات',
      subCategory: 'حلويات وسكر وشاي',
      unit: 'باكيت مفرد (400 غرام)',
      retailSellingPriceIQD: 3750,
      oldPrice: 4250,
      discountPercent: 12,
      stockQuantity: 35,
      rating: 4.9,
      reviewsCount: 165,
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
      active: true
    },
    {
      barcode: '6281008765432-RET',
      productName: 'سكر أبيض نقي مكرر الاتحاد (مفرد)',
      nameEn: 'Pure Refined White Cane Sugar 1kg',
      brand: 'الاتحاد التكرير',
      category: 'سكر وحلويات',
      subCategory: 'حلويات وسكر وشاي',
      unit: 'كيس منزلي (1 كغم)',
      retailSellingPriceIQD: 1500,
      oldPrice: 1750,
      discountPercent: 14,
      stockQuantity: 80,
      rating: 4.8,
      reviewsCount: 92,
      imageUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=400&q=80',
      active: true
    },
    {
      barcode: '3073780000001-RET',
      productName: 'جبنة بيضاء كريمية قابلة للدهن بريزيدن (مفرد)',
      nameEn: 'President Creamy Spreadable Cheese 200g',
      brand: 'بريزيدن',
      category: 'ألبان وأجبان',
      subCategory: 'ألبان وأجبان تبريد',
      unit: 'عبوة مفردة (200 غرام)',
      retailSellingPriceIQD: 2000,
      oldPrice: 2500,
      discountPercent: 20,
      stockQuantity: 25,
      rating: 4.8,
      reviewsCount: 74,
      imageUrl: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=400&q=80',
      active: true
    },
    {
      barcode: '6291001239999-RET',
      productName: 'تونة خفيفة قطع في زيت دوار الشمس المرجان (مفرد)',
      nameEn: 'Light Tuna Chunks in Sunflower Oil 185g',
      brand: 'المرجان الخليجي',
      category: 'معلبات ومخللات',
      subCategory: 'معلبات وصلصات',
      unit: 'علبة مفردة (185 غرام)',
      retailSellingPriceIQD: 1750,
      oldPrice: 2000,
      discountPercent: 12,
      stockQuantity: 50,
      rating: 4.7,
      reviewsCount: 65,
      imageUrl: 'https://images.unsplash.com/photo-1544943910-4c1dc44a0b2d?auto=format&fit=crop&w=400&q=80',
      active: true
    },
    {
      barcode: '5000300123456-RET',
      productName: 'سائل مطهر ومنظف للأسطح ديتول (مفرد)',
      nameEn: 'Dettol Disinfectant & Multipurpose Cleaner 500ml',
      brand: 'ديتول',
      category: 'منظفات وعناية',
      subCategory: 'منظفات ومطهرات',
      unit: 'قارورة مفردة (500 مل)',
      retailSellingPriceIQD: 4500,
      oldPrice: 5250,
      discountPercent: 14,
      stockQuantity: 30,
      rating: 4.9,
      reviewsCount: 140,
      imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=400&q=80',
      active: true
    },
    {
      barcode: '8001234567890-RET',
      productName: 'معكرونة إسباغيتي فاخرة سنان (مفرد)',
      nameEn: 'Premium Spaghetti Pasta 500g',
      brand: 'سنان الإيطالية',
      category: 'أرز وحبوب',
      subCategory: 'أرز ومواد تموينية',
      unit: 'كيس مفرد (500 غرام)',
      retailSellingPriceIQD: 1000,
      oldPrice: 1250,
      discountPercent: 20,
      stockQuantity: 90,
      rating: 4.8,
      reviewsCount: 85,
      imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=400&q=80',
      active: true
    },
    {
      barcode: '7613035123456-RET',
      productName: 'قهوة سريعة التحضير نسكافيه كلاسيك (مفرد)',
      nameEn: 'Nescafe Classic Instant Coffee 200g',
      brand: 'نسكافيه',
      category: 'سكر وحلويات',
      subCategory: 'حلويات وسكر وشاي',
      unit: 'مرطبان زجاجي (200 غرام)',
      retailSellingPriceIQD: 6000,
      oldPrice: 7000,
      discountPercent: 14,
      stockQuantity: 20,
      rating: 4.9,
      reviewsCount: 195,
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
      active: true
    },
    {
      barcode: '6281009988776-RET',
      productName: 'طبقة بيض مائدة طازج عراقي مزارع الفرات (مفرد)',
      nameEn: 'Fresh Farm Table Eggs 30-Pack',
      brand: 'دواجن الفرات',
      category: 'ألبان وأجبان',
      subCategory: 'ألبان وأجبان تبريد',
      unit: 'طبقة (30 بيضة)',
      retailSellingPriceIQD: 6000,
      oldPrice: 6500,
      discountPercent: 8,
      stockQuantity: 25,
      rating: 4.9,
      reviewsCount: 130,
      imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=400&q=80',
      active: true
    },
    {
      barcode: '4001234567891-RET',
      productName: 'مسحوق غسيل أوتوماتيك أريال لافندر (مفرد)',
      nameEn: 'Ariel Automatic Laundry Detergent 1.5kg',
      brand: 'أريال',
      category: 'منظفات وعناية',
      subCategory: 'منظفات ومطهرات',
      unit: 'كيس مفرد (1.5 كغم)',
      retailSellingPriceIQD: 5500,
      oldPrice: 6500,
      discountPercent: 15,
      stockQuantity: 18,
      rating: 4.8,
      reviewsCount: 104,
      imageUrl: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=400&q=80',
      active: true
    },
    {
      barcode: '013000001243-RET',
      productName: 'كاتشب طماطم طبيعي هاينز ضغط (مفرد)',
      nameEn: 'Heinz Tomato Ketchup Squeeze Bottle 850g',
      brand: 'هاينز',
      category: 'معلبات ومخللات',
      subCategory: 'معلبات وصلصات',
      unit: 'عبوة ضغط (850 غرام)',
      retailSellingPriceIQD: 2500,
      oldPrice: 3000,
      discountPercent: 16,
      stockQuantity: 40,
      rating: 4.9,
      reviewsCount: 88,
      imageUrl: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&w=400&q=80',
      active: true
    },
    {
      barcode: '8690504123456-RET',
      productName: 'بسكويت شاي كلاسيك عائلي أولكر (مفرد)',
      nameEn: 'Ulker Tea Biscuits Family Pack 12x',
      brand: 'أولكر',
      category: 'سكر وحلويات',
      subCategory: 'حلويات وسكر وشاي',
      unit: 'باكيت مفرد (12 قطعة)',
      retailSellingPriceIQD: 1500,
      oldPrice: 1750,
      discountPercent: 14,
      stockQuantity: 70,
      rating: 4.8,
      reviewsCount: 96,
      imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80',
      active: true
    },
    {
      barcode: '6281003322114-RET',
      productName: 'سمنة نباتية نقية للطبخ شوكة وسكين (مفرد)',
      nameEn: 'Pure Vegetable Ghee for Cooking 900g',
      brand: 'شوكة وملعقة',
      category: 'زيوت وسمن',
      subCategory: 'زيوت وسمن وطبخ',
      unit: 'علبة صفيح (900 غرام)',
      retailSellingPriceIQD: 3500,
      oldPrice: 4000,
      discountPercent: 12,
      stockQuantity: 32,
      rating: 4.7,
      reviewsCount: 52,
      imageUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=400&q=80',
      active: true
    }
  ]
};

// 7.1 Public Storefront View Endpoint (B2C Customers)
apiRouter.get('/public/storefront/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const store = db.stores.find(s => s.customDomainSlug === slug);
  if (!store) {
    return res.status(404).json({ success: false, message: 'المتجر غير موجود' });
  }

  const enrichedStore = {
    ...store,
    name: almansoorStorefrontState.name,
    phone: almansoorStorefrontState.phone,
    district: almansoorStorefrontState.district,
    address: almansoorStorefrontState.address,
    coverImageUrl: almansoorStorefrontState.coverImageUrl,
    logoUrl: almansoorStorefrontState.logoUrl,
    rating: almansoorStorefrontState.rating,
    reviewsCount: almansoorStorefrontState.reviewsCount,
    workingHoursAr: almansoorStorefrontState.workingHoursAr,
    workingHoursEn: almansoorStorefrontState.workingHoursEn,
    deliveryTimeMinutes: almansoorStorefrontState.deliveryTimeMinutes,
    minOrderIQD: almansoorStorefrontState.minOrderIQD,
    deliveryFeeIQD: almansoorStorefrontState.deliveryFeeIQD,
    freeDeliveryThresholdIQD: almansoorStorefrontState.freeDeliveryThresholdIQD,
    announcementAr: almansoorStorefrontState.announcementAr,
    banners: almansoorStorefrontState.banners.filter(b => b.active)
  };

  const activeProducts = almansoorStorefrontState.products.filter(p => p.active !== false);

  res.json({ 
    success: true, 
    store: enrichedStore, 
    products: activeProducts,
    banners: almansoorStorefrontState.banners.filter(b => b.active)
  });
});

// 7.2 Store Owner Management: Get Full Storefront Data
apiRouter.get('/store/:storeId/storefront/data', (req: Request, res: Response) => {
  const { storeId } = req.params;
  res.json({
    success: true,
    data: almansoorStorefrontState
  });
});

// 7.3 Store Owner Management: Add Retail Single Product (إضافة منتج مفرد جديد)
apiRouter.post('/store/:storeId/storefront/products', (req: Request, res: Response) => {
  const { storeId } = req.params;
  const {
    productName,
    nameEn,
    brand,
    category,
    subCategory,
    unit,
    retailSellingPriceIQD,
    oldPrice,
    discountPercent,
    stockQuantity,
    imageUrl
  } = req.body;

  if (!productName || !retailSellingPriceIQD || !unit) {
    return res.status(400).json({ 
      success: false, 
      message: 'يرجى إدخال اسم المنتج، السعر بالمفرد، ونوع العبوة المفردة' 
    });
  }

  const newBarcode = `RET-${Date.now().toString().slice(-8)}`;
  const newProduct = {
    barcode: newBarcode,
    productName: productName.trim(),
    nameEn: nameEn?.trim() || productName.trim(),
    brand: brand?.trim() || 'منتج محلي',
    category: category || 'أرز ومواد تموينية',
    subCategory: subCategory || 'منتجات طازجة',
    unit: unit.trim(),
    retailSellingPriceIQD: Number(retailSellingPriceIQD),
    oldPrice: oldPrice ? Number(oldPrice) : (discountPercent ? Math.round(Number(retailSellingPriceIQD) * (1 + Number(discountPercent)/100)) : undefined),
    discountPercent: discountPercent ? Number(discountPercent) : undefined,
    stockQuantity: Number(stockQuantity) || 20,
    rating: 5.0,
    reviewsCount: 1,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
    active: true
  };

  almansoorStorefrontState.products.unshift(newProduct);

  res.json({
    success: true,
    message: 'تم إضافة المنتج المفرد إلى المتجر الإلكتروني بنجاح',
    data: newProduct,
    totalProducts: almansoorStorefrontState.products.length
  });
});

// 7.4 Store Owner Management: Update Retail Product (تعديل منتج أو سعر أو كمية)
apiRouter.patch('/store/:storeId/storefront/products/:barcode', (req: Request, res: Response) => {
  const { barcode } = req.params;
  const updates = req.body;

  const productIdx = almansoorStorefrontState.products.findIndex(p => p.barcode === barcode);
  if (productIdx === -1) {
    return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
  }

  almansoorStorefrontState.products[productIdx] = {
    ...almansoorStorefrontState.products[productIdx],
    ...updates,
    retailSellingPriceIQD: updates.retailSellingPriceIQD !== undefined ? Number(updates.retailSellingPriceIQD) : almansoorStorefrontState.products[productIdx].retailSellingPriceIQD,
    discountPercent: updates.discountPercent !== undefined ? Number(updates.discountPercent) : almansoorStorefrontState.products[productIdx].discountPercent,
    stockQuantity: updates.stockQuantity !== undefined ? Number(updates.stockQuantity) : almansoorStorefrontState.products[productIdx].stockQuantity
  };

  res.json({
    success: true,
    message: 'تم تحديث بيانات المنتج بنجاح',
    data: almansoorStorefrontState.products[productIdx]
  });
});

// 7.5 Store Owner Management: Delete Retail Product (حذف منتج من المتجر)
apiRouter.delete('/store/:storeId/storefront/products/:barcode', (req: Request, res: Response) => {
  const { barcode } = req.params;
  const initialLength = almansoorStorefrontState.products.length;
  almansoorStorefrontState.products = almansoorStorefrontState.products.filter(p => p.barcode !== barcode);

  if (almansoorStorefrontState.products.length === initialLength) {
    return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
  }

  res.json({
    success: true,
    message: 'تم حذف المنتج من المتجر الإلكتروني'
  });
});

// 7.6 Store Owner Management: Create or Apply Promotion/Discount (إنشاء عروض وخصومات)
apiRouter.post('/store/:storeId/storefront/promotions', (req: Request, res: Response) => {
  const { barcode, discountPercent, promoBadge, oldPrice } = req.body;
  const product = almansoorStorefrontState.products.find(p => p.barcode === barcode);
  if (!product) {
    return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
  }

  const discount = Number(discountPercent);
  const currentPrice = product.retailSellingPriceIQD;
  const calculatedOldPrice = oldPrice ? Number(oldPrice) : Math.round(currentPrice / (1 - discount / 100));

  product.discountPercent = discount;
  product.oldPrice = calculatedOldPrice;
  if (promoBadge) {
    product.brand = `${product.brand} • ${promoBadge}`;
  }

  res.json({
    success: true,
    message: `تم تطبيق عرض خصم ${discount}% على المنتج بنجاح`,
    data: product
  });
});

// 7.7 Store Owner Management: Save/Update Hero Slider Banners (تعديل بنرات السلايد المتحرك)
apiRouter.put('/store/:storeId/storefront/banners', (req: Request, res: Response) => {
  const { banners } = req.body;
  if (!Array.isArray(banners)) {
    return res.status(400).json({ success: false, message: 'صيغة البنرات غير صحيحة' });
  }

  almansoorStorefrontState.banners = banners;

  res.json({
    success: true,
    message: 'تم تحديث بنرات السلايد المتحرك بنجاح',
    banners: almansoorStorefrontState.banners
  });
});

// 7.8 Store Owner Management: Add Single Banner (إضافة بنر إعلاني جديد)
apiRouter.post('/store/:storeId/storefront/banners', (req: Request, res: Response) => {
  const { titleAr, titleEn, descAr, badgeAr, badgeBg, bgColor, image } = req.body;
  if (!titleAr) {
    return res.status(400).json({ success: false, message: 'يرجى كتابة عنوان البنر' });
  }

  const newBanner = {
    id: Date.now(),
    titleAr: titleAr.trim(),
    titleEn: titleEn?.trim() || titleAr.trim(),
    descAr: descAr?.trim() || '',
    descEn: '',
    badgeAr: badgeAr?.trim() || 'عرض جديد',
    badgeEn: 'Special Offer',
    badgeBg: badgeBg || 'bg-[#FFE600] text-gray-950',
    bgColor: bgColor || 'from-emerald-700 via-emerald-800 to-green-950',
    image: image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    active: true
  };

  almansoorStorefrontState.banners.unshift(newBanner);

  res.json({
    success: true,
    message: 'تمت إضافة البنر الإعلاني إلى السلايد المتحرك',
    banner: newBanner
  });
});

// 7.9 Store Owner Management: Update Supermarket Store Info & Delivery (تعديل بيانات المتجر وساعات العمل)
apiRouter.put('/store/:storeId/storefront/settings', (req: Request, res: Response) => {
  const {
    name,
    phone,
    address,
    workingHoursAr,
    deliveryTimeMinutes,
    minOrderIQD,
    deliveryFeeIQD,
    freeDeliveryThresholdIQD,
    announcementAr
  } = req.body;

  if (name) almansoorStorefrontState.name = name;
  if (phone) almansoorStorefrontState.phone = phone;
  if (address) almansoorStorefrontState.address = address;
  if (workingHoursAr) almansoorStorefrontState.workingHoursAr = workingHoursAr;
  if (deliveryTimeMinutes) almansoorStorefrontState.deliveryTimeMinutes = Number(deliveryTimeMinutes);
  if (minOrderIQD) almansoorStorefrontState.minOrderIQD = Number(minOrderIQD);
  if (deliveryFeeIQD !== undefined) almansoorStorefrontState.deliveryFeeIQD = Number(deliveryFeeIQD);
  if (freeDeliveryThresholdIQD) almansoorStorefrontState.freeDeliveryThresholdIQD = Number(freeDeliveryThresholdIQD);
  if (announcementAr) almansoorStorefrontState.announcementAr = announcementAr;

  res.json({
    success: true,
    message: 'تم حفظ إعدادات المتجر وساعات العمل بنجاح',
    data: almansoorStorefrontState
  });
});

// 7.10 Store Owner Management: Analytics Dashboard (Daily Sales, Top Products, Inventory Turnover)
apiRouter.get('/store/:storeId/storefront/analytics', (req: Request, res: Response) => {
  const { storeId } = req.params;
  const days = req.query.days ? Number(req.query.days) : 7;

  // Past 7 Days Daily Sales Data (Simulated based on store sales & orders)
  const past7DaysSales = [
    { date: '2026-11-05', dayNameAr: 'الخميس', revenueIQD: 745000, ordersCount: 24, averageBasketIQD: 31040, isPeak: true },
    { date: '2026-11-06', dayNameAr: 'الجمعة', revenueIQD: 890000, ordersCount: 29, averageBasketIQD: 30680, isPeak: true },
    { date: '2026-11-07', dayNameAr: 'السبت', revenueIQD: 620000, ordersCount: 19, averageBasketIQD: 32630, isPeak: false },
    { date: '2026-11-08', dayNameAr: 'الأحد', revenueIQD: 580000, ordersCount: 18, averageBasketIQD: 32220, isPeak: false },
    { date: '2026-11-09', dayNameAr: 'الإثنين', revenueIQD: 650000, ordersCount: 21, averageBasketIQD: 30950, isPeak: false },
    { date: '2026-11-10', dayNameAr: 'الثلاثاء', revenueIQD: 710000, ordersCount: 22, averageBasketIQD: 32270, isPeak: false },
    { date: '2026-11-11', dayNameAr: 'اليوم (الأربعاء)', revenueIQD: 825000, ordersCount: 26, averageBasketIQD: 31730, isPeak: true }
  ];

  const totalWeeklyRevenue = past7DaysSales.reduce((sum, d) => sum + d.revenueIQD, 0);
  const totalWeeklyOrders = past7DaysSales.reduce((sum, d) => sum + d.ordersCount, 0);
  const avgOrderValue = Math.round(totalWeeklyRevenue / totalWeeklyOrders);

  // Top Most-Requested Products (المنتجات الأكثر طلباً ومبيعاً)
  const topProducts = [
    {
      barcode: '6210001234567-RET',
      name: 'زيت دوار الشمس النقي عافية',
      unit: 'قارورة مفردة (1 لتر)',
      category: 'زيوت وسمن',
      unitsSold: 94,
      revenueIQD: 329000,
      sharePercent: 24.5,
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=200&q=80',
      turnoverDays: 9,
      speedBadge: 'صاروخي 🚀'
    },
    {
      barcode: '6281001234501-RET',
      name: 'حليب بودرة كامل الدسم الرافدين',
      unit: 'علبة مفردة (400 غرام)',
      category: 'ألبان وأجبان',
      unitsSold: 82,
      revenueIQD: 266500,
      sharePercent: 19.8,
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=200&q=80',
      turnoverDays: 12,
      speedBadge: 'سريع جداً ⚡'
    },
    {
      barcode: '6281007000123-RET',
      name: 'أرز بسمتي هندي عنبر درجة أولى',
      unit: 'كيس منزلي (2 كغم)',
      category: 'أرز وحبوب',
      unitsSold: 71,
      revenueIQD: 284000,
      sharePercent: 17.2,
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=200&q=80',
      turnoverDays: 14,
      speedBadge: 'سريع جداً ⚡'
    },
    {
      barcode: '5201002345678-RET',
      name: 'معجون طماطم تركي مركز لونا',
      unit: 'علبة مفردة (800 غرام)',
      category: 'معلبات ومخللات',
      unitsSold: 68,
      revenueIQD: 85000,
      sharePercent: 14.1,
      imageUrl: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=200&q=80',
      turnoverDays: 16,
      speedBadge: 'سريع ✓'
    },
    {
      barcode: '7622210123456-RET',
      name: 'شاي سيلاني أسود كلاسيك الكوزي',
      unit: 'باكيت مفرد (400 غرام)',
      category: 'سكر وحلويات',
      unitsSold: 55,
      revenueIQD: 206250,
      sharePercent: 11.8,
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=200&q=80',
      turnoverDays: 19,
      speedBadge: 'معتدل'
    },
    {
      barcode: '5000300123456-RET',
      name: 'سائل مطهر ومنظف الأسطح ديتول',
      unit: 'قارورة مفردة (500 مل)',
      category: 'منظفات وعناية',
      unitsSold: 46,
      revenueIQD: 207000,
      sharePercent: 9.4,
      imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=200&q=80',
      turnoverDays: 22,
      speedBadge: 'معتدل'
    },
    {
      barcode: '6210009990001-RET',
      name: 'طبقة بيض مائدة طازج محلي (30 بيضة)',
      unit: 'طبقة منزلية',
      category: 'ألبان وأجبان',
      unitsSold: 42,
      revenueIQD: 252000,
      sharePercent: 8.6,
      imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=200&q=80',
      turnoverDays: 7,
      speedBadge: 'صاروخي 🚀'
    }
  ];

  // Inventory Turnover Analytics (تحليل معدل دوران المخزون)
  const inventoryTurnover = {
    overallRate: 6.8, // دورات في السنة (Turnovers per year)
    daysToSellOut: 16.5, // متوسط الأيام لتفريغ الرف وإعادة التوريد (Days of Inventory)
    status: 'ممتاز - سيولة سريعة ومخزون صحي',
    statusEn: 'Excellent - High Liquidity & Healthy Stock',
    stockHealthScore: 95, // 95%
    fastMovingCount: almansoorStorefrontState.products.filter(p => p.stockQuantity >= 25).length || 10,
    moderateMovingCount: 5,
    slowMovingCount: 2,
    categoriesTurnover: [
      { category: 'زيوت وسمن', rate: 9.8, days: 11, status: 'فائق السرعة 🚀', color: '#00A046' },
      { category: 'ألبان وأجبان', rate: 8.6, days: 13, status: 'فائق السرعة 🚀', color: '#10B981' },
      { category: 'أرز وحبوب', rate: 7.2, days: 16, status: 'سريع جداً ⚡', color: '#3B82F6' },
      { category: 'سكر وحلويات', rate: 5.9, days: 20, status: 'معتدل ✓', color: '#F59E0B' },
      { category: 'معلبات ومخللات', rate: 5.1, days: 23, status: 'معتدل ✓', color: '#8B5CF6' },
      { category: 'منظفات وعناية', rate: 4.2, days: 28, status: 'يحتاج تنشيط ⏳', color: '#EF4444' }
    ],
    recommendations: [
      'منتجات الزيوت والألبان تسجل أعلى معدل دوران (تُباع بالكامل كل 11-13 يوماً)، يُنصح بالحفاظ على مخزون أمان مرتفع لتجنب نفاد الرفوف.',
      'قسم المنظفات يسجل معدل دوران أبطأ نسبياً (28 يوماً)؛ تم تفعيل مقترح عرض «اشترِ 2 واحصل على 1» لرفع سرعة الدوران بنسبة 35%.'
    ]
  };

  res.json({
    success: true,
    data: {
      summaryKPIs: {
        totalWeeklyRevenue,
        totalWeeklyOrders,
        averageOrderValue: avgOrderValue,
        growthPercent: 16.8,
        activeCustomersCount: 342,
        turnoverRatio: inventoryTurnover.overallRate,
        daysToSellOut: inventoryTurnover.daysToSellOut
      },
      dailySales: past7DaysSales,
      topProducts,
      inventoryTurnover
    }
  });
});

// ================= 8. STORE FINANCIAL AI ASSISTANT =================
apiRouter.post('/assistant/ask', async (req: Request, res: Response) => {
  try {
    const { storeId, question } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, message: 'يرجى كتابة السؤال' });
    }
    const result = await askStoreAssistant({
      storeId: storeId || 'store_almansoor',
      question
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ================= 9. OPENAPI SPECIFICATION =================
apiRouter.get('/openapi.json', (_req: Request, res: Response) => {
  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'Souq Al-Jumla B2B Marketplace REST API',
      version: '1.0.0',
      description: 'واجهة برمجة التطبيقات لمنصة سوق الجملة للمواد الغذائية في العراق (جاهزة لدعم تطبيقات Android وiOS وWeb دون تعديل منطق الأعمال)',
      contact: { name: 'فريق تطوير سوق الجملة العراق' }
    },
    servers: [{ url: '/api', description: 'خادم الإنتاج والتطوير المحلي' }],
    paths: {
      '/products': {
        get: {
          summary: 'عرض الكتالوج الموحد بالباركود الدولي والمقارنة بين عروض الموردين',
          parameters: [
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'query', in: 'query', schema: { type: 'string' } },
            { name: 'barcode', in: 'query', schema: { type: 'string' } }
          ],
          responses: { 200: { description: 'قائمة المنتجات والعروض المقارنة' } }
        }
      },
      '/orders': {
        post: {
          summary: 'إنشاء طلب سلة وتقسيمه تلقائياً حسب الموردين مع التحقق من الائتمان',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object' } } }
          },
          responses: { 201: { description: 'تم إنشاء الطلب والطلبات الفرعية' } }
        }
      },
      '/credit/accounts': {
        get: { summary: 'الحسابات الائتمانية وسقوف الديون وتقسيم الأعمار (Aging)' }
      },
      '/credit/ledger/payment': {
        post: { summary: 'تسديد دفعة في دفتر الأستاذ' }
      },
      '/credit/ledger/reversal': {
        post: { summary: 'قيد عكسي لتصحيح قيود دفتر الأستاذ دون مسح التاريخ' }
      },
      '/van/inventory/{driverId}': {
        get: { summary: 'مخزون الفان المتنقل كمستودع للبيع المباشر' }
      },
      '/van/direct-sale': {
        post: { summary: 'بيع فوري مباشر من سيارة التوزيع' }
      },
      '/van/shift-close': {
        post: { summary: 'إغلاق الوردية واحتساب فرق الكاش والمخزون' }
      },
      '/assistant/ask': {
        post: { summary: 'المساعد المالي والتشغيلي بالذكاء الاصطناعي (Gemini 3.8 Flash)' }
      }
    }
  };
  res.json(spec);
});
