import crypto from 'node:crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/store.ts';
import { askStoreAssistant } from '../services/aiAssistantService.ts';
import {
  evaluateExpiryStatus,
  resolveExpiryCutoffDate,
  isValidIsoDate,
  ExpiryThresholdMode
} from '../../shared/expiryAlerts.ts';

export const apiRouter = Router();

const STAFF_SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

interface SessionTokenPayload {
  sub: string;
  role: 'store' | 'cashier' | 'accountant';
  storeId: string;
  exp: number;
}

function signSessionToken(payload: SessionTokenPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', STAFF_SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

function verifySessionToken(token: string): SessionTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    if (!encoded || !sig) return null;
    const expectedSig = crypto
      .createHmac('sha256', STAFF_SESSION_SECRET)
      .update(encoded)
      .digest('base64url');
    const sigBuf = Buffer.from(sig, 'utf8');
    const expectedBuf = Buffer.from(expectedSig, 'utf8');
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionTokenPayload;
    if (!parsed || typeof parsed.exp !== 'number' || parsed.exp <= Date.now()) {
      return null;
    }
    if (!parsed.storeId || !parsed.role || !parsed.sub) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function requireStoreOwner(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return res.status(401).json({ success: false, message: 'مطلوب مصادقة مدير المتجر للوصول لإدارة الموظفين' });
  }
  const payload = verifySessionToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, message: 'انتهت صلاحية الجلسة، يرجى إعادة تسجيل الدخول' });
  }
  if (payload.role !== 'store' || payload.storeId !== req.params.storeId) {
    return res.status(403).json({ success: false, message: 'صلاحية إدارة حسابات الموظفين محصورة بمدير المتجر فقط' });
  }
  next();
}

function rejectCashierToken(req: Request, res: Response): boolean {
  const authHeader = req.headers.authorization || '';
  if (!authHeader) return false;
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ success: false, message: 'رمز المصادقة غير صالح' });
    return true;
  }
  const payload = verifySessionToken(token);
  if (!payload) {
    res.status(401).json({ success: false, message: 'انتهت صلاحية الجلسة، يرجى إعادة تسجيل الدخول' });
    return true;
  }
  if (payload.role === 'cashier') {
    res.status(403).json({
      success: false,
      message: 'صلاحية تحويل المنتجات قريبة الانتهاء إلى العروض متاحة للمحاسب أو مدير المتجر فقط'
    });
    return true;
  }
  return false;
}

// ================= 0. GEOGRAPHIC HIERARCHY & DELIVERY ZONES =================
apiRouter.get('/geo/governorates', (_req: Request, res: Response) => {
  try {
    const data = db.getGovernoratesHierarchy();
    res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/geo/zones', (req: Request, res: Response) => {
  try {
    const { governorateId } = req.query;
    const zones = db.getDeliveryZones(governorateId as string | undefined);
    res.json({ success: true, count: zones.length, data: zones });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ================= 1. UNIFIED CATALOG & OFFERS =================
apiRouter.get('/products', (req: Request, res: Response) => {
  try {
    const { category, query, barcode, deliveryZoneId } = req.query;
    const products = db.getProductsWithOffers({
      category: category as string,
      query: query as string,
      barcode: barcode as string,
      deliveryZoneId: deliveryZoneId as string
    });
    res.json({ success: true, count: products.length, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/products/:barcode', (req: Request, res: Response) => {
  try {
    const { barcode } = req.params;
    const { deliveryZoneId } = req.query;
    const items = db.getProductsWithOffers({ barcode, deliveryZoneId: deliveryZoneId as string });
    if (items.length === 0) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }
    res.json({ success: true, data: items[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/suppliers', (req: Request, res: Response) => {
  try {
    const { deliveryZoneId, businessType, verificationStatus } = req.query;
    const suppliers = db.getSuppliers({
      deliveryZoneId: deliveryZoneId as string | undefined,
      businessType: businessType as any,
      verificationStatus: verificationStatus as any
    });
    res.json({ success: true, count: suppliers.length, data: suppliers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
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
    const { storeId, items, paymentMethod, notes, deliveryZoneId } = req.body;
    if (!storeId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'بيانات الطلب غير مكتملة' });
    }

    const parentOrder = db.createSplitOrder({
      storeId,
      items,
      paymentMethod: paymentMethod || 'cod',
      notes,
      deliveryZoneId
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

// ================= 4. DISTRIBUTOR / VAN MOBILE WAREHOUSE & FLEET DSD =================
apiRouter.get('/drivers', (req: Request, res: Response) => {
  const { supplierId } = req.query;
  let list = db.drivers;
  if (supplierId) list = list.filter(d => d.supplierId === supplierId);
  res.json({ success: true, data: list });
});

apiRouter.post('/van/drivers', (req: Request, res: Response) => {
  try {
    const {
      supplierId,
      name,
      phone,
      vehiclePlate,
      vehicleModel,
      vanWarehouseName,
      dailyTargetIQD,
      commissionRatePercent
    } = req.body;
    const driver = db.createDriverVan({
      supplierId: supplierId || 'supp_rafidain',
      name,
      phone,
      vehiclePlate,
      vehicleModel,
      vanWarehouseName,
      dailyTargetIQD: dailyTargetIQD ? Number(dailyTargetIQD) : undefined,
      commissionRatePercent: commissionRatePercent ? Number(commissionRatePercent) : undefined
    });
    res.status(201).json({
      success: true,
      message: 'تم تسجيل الفان والسائق بنجاح في أسطول المورد',
      data: driver
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.get('/van/inventory/:driverId', (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const driver = db.drivers.find(d => d.id === driverId);
    if (!driver) return res.status(404).json({ success: false, message: 'السائق غير موجود' });
    const rawItems = db.vanInventory.filter(v => v.driverId === driverId);
    const items = rawItems.map(v => {
      const prod = db.products.find(p => p.barcode === v.barcode);
      return {
        ...v,
        category: prod?.category || 'أخرى',
        subCategory: prod?.subCategory || undefined,
      };
    });
    const routeStops = db.vanRouteStops
      .filter(s => s.driverId === driverId)
      .sort((a, b) => a.sequence - b.sequence);
    const transactions = db.vanTransactions.filter(t => t.driverId === driverId);
    const creditAccounts = db.creditAccounts.filter(c => c.supplierId === driver.supplierId);
    const commissionSummary = db.getDriverCommissionSummary(driverId);
    const loadRequests = db.vanLoadRequests.filter(r => r.driverId === driverId);
    const supplierOffers = db.offers.filter(o => o.supplierId === driver.supplierId);
    const supplierBarcodes = new Set(supplierOffers.map(o => o.barcode));
    const catalogProducts = supplierBarcodes.size > 0
      ? db.products.filter(p => supplierBarcodes.has(p.barcode))
      : db.products;
    const supplierCatalog = catalogProducts.map(p => {
      const offer =
        supplierOffers.find(o => o.barcode === p.barcode) ||
        db.offers.find(o => o.barcode === p.barcode);
      return {
        barcode: p.barcode,
        nameAr: p.nameAr,
        brand: p.brand,
        category: p.category,
        subCategory: p.subCategory,
        unit: p.unit,
        imageUrl: p.imageUrl,
        priceIQD: offer?.priceIQD || 25000,
        availableStock: offer?.availableStock ?? 100
      };
    });

    const vanExpenses = db.vanExpenses.filter(e => e.driverId === driverId);
    const vanReturns = db.vanReturns.filter(r => r.driverId === driverId);
    const shiftReports = db.shiftReports.filter(s => s.driverId === driverId);
    const vanUnloadRecords = db.vanUnloadRecords.filter(u => u.driverId === driverId);

    const totalStops = routeStops.length;
    const visitedOrSoldStops = routeStops.filter(
      s => s.status === 'visited' || s.status === 'sold'
    ).length;
    const soldStops = routeStops.filter(s => s.status === 'sold').length;
    const visitCompliancePercent = totalStops > 0 ? Math.round((visitedOrSoldStops / totalStops) * 100) : 0;
    const strikeRatePercent = totalStops > 0 ? Math.round((soldStops / totalStops) * 100) : 0;
    const directSalesTxs = transactions.filter(t => t.type === 'direct_sale');
    const averageDropSizeIQD =
      directSalesTxs.length > 0
        ? Math.round(directSalesTxs.reduce((s, t) => s + t.totalAmountIQD, 0) / directSalesTxs.length)
        : 0;
    const totalLoadedValueIQD = items.reduce((s, i) => s + i.loadedQuantity * i.unitPriceIQD, 0);
    const remainingStockValueIQD = items.reduce((s, i) => s + i.remainingQuantity * i.unitPriceIQD, 0);
    const totalExpensesIQD = vanExpenses.reduce((s, e) => s + e.amountIQD, 0);

    const kpis = {
      totalStops,
      visitedOrSoldStops,
      soldStops,
      visitCompliancePercent,
      strikeRatePercent,
      averageDropSizeIQD,
      totalLoadedValueIQD,
      remainingStockValueIQD,
      totalExpensesIQD,
      netCashDueIQD: driver.currentCashCollectedIQD
    };

    const supplier = db.suppliers.find(s => s.id === driver.supplierId) || null;

    res.json({
      success: true,
      driver,
      supplier,
      inventory: items,
      routeStops,
      transactions,
      creditAccounts,
      stores: db.stores,
      commissionSummary,
      loadRequests,
      supplierCatalog,
      vanExpenses,
      vanReturns,
      shiftReports,
      vanUnloadRecords,
      kpis,
      totalLoadedUnits: items.reduce((s, i) => s + i.loadedQuantity, 0),
      totalRemainingUnits: items.reduce((s, i) => s + i.remainingQuantity, 0)
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/van/fleet/:supplierId', (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const drivers = db.drivers.filter(d => d.supplierId === supplierId);
    const fleet = drivers.map(driver => {
      const inventory = db.vanInventory
        .filter(v => v.driverId === driver.id)
        .map(v => {
          const prod = db.products.find(p => p.barcode === v.barcode);
          return {
            ...v,
            imageUrl: prod?.imageUrl,
            category: prod?.category || 'أخرى',
            subCategory: prod?.subCategory
          };
        });
      const routeStops = db.vanRouteStops
        .filter(s => s.driverId === driver.id)
        .sort((a, b) => a.sequence - b.sequence);
      const transactions = db.vanTransactions.filter(t => t.driverId === driver.id);
      const commissionSummary = db.getDriverCommissionSummary(driver.id);
      const pendingOrders = db.subOrders.filter(
        o => o.assignedDriverId === driver.id && o.status !== 'delivered' && o.status !== 'cancelled'
      ).length;

      return {
        driver,
        inventory,
        routeStops,
        transactions,
        commissionSummary,
        pendingOrders,
        totalLoadedUnits: inventory.reduce((s, i) => s + i.loadedQuantity, 0),
        totalSoldUnits: inventory.reduce((s, i) => s + i.soldQuantity, 0),
        totalRemainingUnits: inventory.reduce((s, i) => s + i.remainingQuantity, 0)
      };
    });

    const shiftReports = db.shiftReports.filter(r => r.supplierId === supplierId);
    const loadRequests = db.vanLoadRequests.filter(r => r.supplierId === supplierId);
    const catalogProducts = db.products.map(p => {
      const offer =
        db.offers.find(o => o.barcode === p.barcode && o.supplierId === supplierId) ||
        db.offers.find(o => o.barcode === p.barcode);
      return {
        barcode: p.barcode,
        nameAr: p.nameAr,
        unit: p.unit,
        brand: p.brand,
        category: p.category,
        imageUrl: p.imageUrl,
        defaultPriceIQD: offer?.priceIQD || 25000
      };
    });

    res.json({
      success: true,
      supplierId,
      fleet,
      shiftReports,
      loadRequests,
      stores: db.stores,
      catalogProducts
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/van/load-requests', (req: Request, res: Response) => {
  try {
    const { driverId, items, notes } = req.body;
    const created = db.createVanLoadRequest({ driverId, items, notes });
    res.status(201).json({
      success: true,
      message: 'تم إرسال طلب تجهيز الفان للمورد/المحاسب بانتظار الاعتماد',
      data: created
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.patch('/van/load-requests/:id/approve', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adjustedQuantities, reviewedBy } = req.body || {};
    const approved = db.approveVanLoadRequest({
      requestId: id,
      adjustedQuantities,
      reviewedBy
    });
    res.json({
      success: true,
      message: 'تمت الموافقة على التجهيز وإضافة جميع البضاعة تلقائياً إلى كاشير الفان',
      data: approved
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.patch('/van/load-requests/:id/reject', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body || {};
    const rejected = db.rejectVanLoadRequest(id, notes);
    res.json({
      success: true,
      message: 'تم رفض طلب التجهيز وإشعار السائق',
      data: rejected
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.post('/van/load-stock', (req: Request, res: Response) => {
  try {
    const { driverId, barcode, quantity, unitPriceIQD } = req.body;
    const item = db.loadVanStock({
      driverId,
      barcode,
      quantity: Number(quantity),
      unitPriceIQD: unitPriceIQD ? Number(unitPriceIQD) : undefined
    });
    res.status(201).json({
      success: true,
      message: 'تم تحميل البضاعة في عهدة الفان بنجاح وتحديث المخزون المتنقل',
      data: item
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.patch('/van/adjust-stock', (req: Request, res: Response) => {
  try {
    const { driverId, barcode, delta } = req.body;
    const item = db.adjustVanStock({
      driverId,
      barcode,
      delta: Number(delta)
    });
    res.json({
      success: true,
      message: 'تم تحديث كمية الصنف في مخزون الفان بنجاح',
      data: item
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.post('/van/direct-sale', (req: Request, res: Response) => {
  try {
    const { driverId, storeId, barcode, quantity, items, paymentType, discountIQD, notes } = req.body;
    const result = db.recordVanDirectSale({
      driverId,
      storeId,
      barcode,
      quantity: quantity !== undefined ? Number(quantity) : undefined,
      items,
      paymentType: paymentType || 'cash',
      discountIQD: discountIQD !== undefined ? Number(discountIQD) : 0,
      notes
    });
    res.json({
      success: true,
      message: 'تم إتمام البيع المباشر من سيارة التوزيع ومزامنة مخزون المتجر بنجاح',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.post('/van/debt-collection', (req: Request, res: Response) => {
  try {
    const { driverId, storeId, amountIQD, notes } = req.body;
    const result = db.recordVanDebtCollection({
      driverId,
      storeId,
      amountIQD: Number(amountIQD),
      notes
    });
    res.status(201).json({
      success: true,
      message: 'تم تحصيل الدفعة النقدية من الآجل وقيدها في دفتر الأستاذ وعهدة السائق',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.post('/van/route-stops', (req: Request, res: Response) => {
  try {
    const { driverId, storeId, notes } = req.body;
    const stop = db.addVanRouteStop(driverId, storeId, notes);
    res.status(201).json({
      success: true,
      message: 'تمت إضافة المتجر إلى خط السير اليومي للفان',
      data: stop
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.patch('/van/route-stops/:stopId', (req: Request, res: Response) => {
  try {
    const { stopId } = req.params;
    const { status, notes } = req.body;
    const stop = db.updateVanRouteStopStatus(stopId, status, notes);
    res.json({
      success: true,
      message: 'تم تحديث حالة الزيارة في خط السير',
      data: stop
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.put('/van/route-stops/reorder', (req: Request, res: Response) => {
  try {
    const { driverId, orderedStopIds } = req.body;
    if (!driverId || !Array.isArray(orderedStopIds)) {
      return res.status(400).json({ success: false, message: 'بيانات إعادة ترتيب المسار غير مكتملة' });
    }
    const stops = db.reorderVanRouteStops(driverId, orderedStopIds);
    res.json({
      success: true,
      message: 'تم تحديث ترتيب خط السير اليومي',
      data: stops
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.delete('/van/route-stops/:stopId', (req: Request, res: Response) => {
  try {
    const { stopId } = req.params;
    db.removeVanRouteStop(stopId);
    res.json({
      success: true,
      message: 'تمت إزالة المحطة من خط السير اليومي'
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.patch('/van/driver/:driverId/availability', (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const { availabilityStatus, busyReason } = req.body;
    if (availabilityStatus !== 'available' && availabilityStatus !== 'busy') {
      return res.status(400).json({ success: false, message: 'حالة التوفر غير صالحة' });
    }
    const driver = db.updateDriverAvailability(driverId, availabilityStatus, busyReason);
    res.json({
      success: true,
      message: availabilityStatus === 'available' ? 'تم تحويل حالة الفان إلى متاح' : 'تم تحويل حالة الفان إلى مشغول',
      data: driver
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

const handleVanReturn = (req: Request, res: Response) => {
  try {
    const { driverId, barcode, quantity, type, reason, storeId, batchNumber, expiryDate } = req.body;
    const result = db.recordVanReturnOrDamage({
      driverId,
      barcode,
      quantity: Number(quantity),
      type: type || 'return',
      reason: reason || 'طلب استرجاع من المتجر',
      storeId,
      batchNumber,
      expiryDate
    });
    res.json({
      success: true,
      message: 'تم قيد المرتجع وإصدار إشعار الدائن وتحديث مخزون الفان بنجاح',
      data: result.vanItem,
      returnRecord: result.returnRecord
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

apiRouter.post('/van/return', handleVanReturn);
apiRouter.post('/van/returns', handleVanReturn);

apiRouter.post('/van/customers', (req: Request, res: Response) => {
  try {
    const { driverId, name, ownerName, phone, district, address, storeType, creditLimitIQD, addToRoute } = req.body || {};
    const created = db.registerFieldStoreCustomer({
      driverId,
      name,
      ownerName,
      phone,
      district,
      address,
      storeType,
      creditLimitIQD: creditLimitIQD !== undefined ? Number(creditLimitIQD) : 0,
      addToRoute
    });
    res.status(201).json({
      success: true,
      message: `تم تسجيل المتجر "${created.store.name}" في دليل عملاء الفان وخط السير`,
      data: created
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.post('/van/expenses', (req: Request, res: Response) => {
  try {
    const { driverId, category, description, amountIQD, receiptRef } = req.body || {};
    const validCategories = ['fuel', 'toll_parking', 'loading_labor', 'maintenance', 'other'];
    const cleanCategory = validCategories.includes(category) ? category : 'other';
    const record = db.recordVanExpense({
      driverId,
      category: cleanCategory,
      description,
      amountIQD: Number(amountIQD),
      receiptRef
    });
    res.status(201).json({
      success: true,
      message: 'تم تسجيل المصروف الميداني وخصمه من صافي العهدة النقدية',
      data: record
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.delete('/van/expenses/:expenseId', (req: Request, res: Response) => {
  try {
    db.deleteVanExpense(req.params.expenseId);
    res.json({ success: true, message: 'تم حذف سجل المصروف وإعادة الرصيد إلى العهدة' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.patch('/van/driver/:driverId/vehicle-check', (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const { odometerStartKm, odometerEndKm, fuelLevelPercent, chillerTempC, inspectionChecklist } = req.body || {};
    const updated = db.updateVanVehicleCheck({
      driverId,
      odometerStartKm,
      odometerEndKm,
      fuelLevelPercent,
      chillerTempC,
      inspectionChecklist
    });
    res.json({
      success: true,
      message: 'تم حفظ فحص المركبة وقراءة العداد والتبريد بنجاح',
      data: updated
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.post('/van/physical-audit', (req: Request, res: Response) => {
  try {
    const { driverId, counts } = req.body || {};
    const audit = db.recordVanPhysicalAudit({ driverId, counts });
    res.json({
      success: true,
      message: 'تم اعتماد الجرد الفعلي ومقارنة الأرصدة بنجاح',
      data: audit
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.post('/van/unload-warehouse', (req: Request, res: Response) => {
  try {
    const { driverId, notes } = req.body || {};
    const manifest = db.unloadVanToWarehouse({ driverId, notes });
    res.status(201).json({
      success: true,
      message: `تم ترحيل البضاعة المتبقية إلى المستودع الرئيسي بإشعار (${manifest.manifestNumber})`,
      data: manifest
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.post('/van/delivery/:orderId/confirm', (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { driverId, enteredPin } = req.body;
    const order = db.subOrders.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }
    if (order.deliveryPin && enteredPin !== order.deliveryPin) {
      return res.status(400).json({
        success: false,
        message: 'رمز التحقق من الاستلام (PIN) غير صحيح! اطلب الرمز المكون من 4 أرقام من صاحب المتجر.'
      });
    }
    order.status = 'delivered';
    order.deliveredAt = new Date().toISOString();
    if (order.paymentMethod === 'cod') {
      order.paidAt = new Date().toISOString();
      const driver = db.drivers.find(d => d.id === (driverId || order.assignedDriverId));
      if (driver) {
        driver.currentCashCollectedIQD += order.subtotalIQD;
        driver.todayCashSalesIQD = (driver.todayCashSalesIQD || 0) + order.subtotalIQD;
      }
    }
    res.json({ success: true, message: 'تم تأكيد التسليم بنجاح', data: order });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.post('/van/shift-close', (req: Request, res: Response) => {
  try {
    const { driverId, actualCashCountedIQD, odometerEndKm, notes } = req.body;
    const report = db.closeDriverShift({
      driverId,
      actualCashCountedIQD: Number(actualCashCountedIQD),
      odometerEndKm: odometerEndKm !== undefined ? Number(odometerEndKm) : undefined,
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

apiRouter.patch('/van/shift-reports/:reportId/settle', (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const report = db.settleShiftReport(reportId);
    res.json({
      success: true,
      message: 'تم اعتماد تقرير إغلاق الوردية ومطابقة الصندوق بنجاح',
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

apiRouter.get('/store/pos-returns/:storeId', (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const returns = db.getStorePOSReturns(storeId);
    res.json({
      success: true,
      count: returns.length,
      data: returns
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/store/pos-return', (req: Request, res: Response) => {
  try {
    const {
      storeId,
      originalReceiptNumber,
      customerName,
      refundMethod,
      reason,
      processedBy,
      items
    } = req.body;
    const result = db.recordStorePOSReturn({
      storeId,
      originalReceiptNumber:
        originalReceiptNumber !== undefined && originalReceiptNumber !== ''
          ? Number(originalReceiptNumber)
          : undefined,
      customerName,
      refundMethod: refundMethod || 'cash',
      reason,
      processedBy,
      items
    });
    res.json({
      success: true,
      message:
        result.restockedUnitsCount > 0
          ? `تم تسجيل المرتجع #${result.returnNumber} وإعادة ${result.restockedUnitsCount} وحدة إلى المخزون`
          : `تم تسجيل المرتجع #${result.returnNumber} بنجاح`,
      data: result
    });
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
    expiryDate?: string;
    promoBadge?: string;
    isFeatured?: boolean;
    active?: boolean;
  }>;
}

function ensureRetailSingleUnitImage(url?: string, category?: string): string {
  const categoryDefaults: Record<string, string> = {
    'زيوت وسمن': '/assets/images/white_sunflower_oil.jpg',
    'أرز وحبوب': '/assets/images/white_basmati_rice.jpg',
    'ألبان وأجبان': '/assets/images/white_milk_powder.jpg',
    'معلبات ومخللات': '/assets/images/white_tomato_paste.jpg',
    'سكر وحلويات': '/assets/images/unit_biscuits_pack.jpg',
    'مشروبات وشاي': '/assets/images/white_ceylon_tea.jpg',
    'منظفات وعناية': '/assets/images/white_cleaner_bottles.jpg'
  };
  const fallback = (category && categoryDefaults[category]) || '/assets/images/white_basmati_rice.jpg';
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (
    !trimmed ||
    trimmed.includes('unsplash.com') ||
    trimmed.includes('carton_') ||
    trimmed.includes('product_white_sugar_50kg')
  ) {
    return fallback;
  }
  return trimmed;
}

const almansoorStorefrontState: StorefrontState = {
  storeId: 'store_almansoor',
  slug: 'almansoor-market',
  name: 'سوبرماركت المنصور المركزي',
  ownerName: 'عمار خضير الدوري',
  phone: '+964 771 555 8899',
  district: 'بغداد - حي المنصور',
  address: 'شارع 14 رمضان - قرب ساحة الرواد، عمارة الأمل',
  coverImageUrl: '/assets/images/banner_dalil_hero.jpg',
  logoUrl: '/assets/images/unit_olive_oil_bottle.jpg',
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
      image: '/assets/images/banner_dalil_hero.jpg',
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
      image: '/assets/images/white_milk_powder.jpg',
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
      image: '/assets/images/white_cleaner_bottles.jpg',
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
      image: '/assets/images/banner_dalil_deals.jpg',
      active: true
    }
  ],
  products: [
    {
      barcode: '6281004411223-RET',
      productName: 'زيت زيتون بكر ممتاز عصرة أولى أرز لبنان (مفرد)',
      nameEn: 'Extra Virgin Olive Oil Glass Bottle 750ml',
      brand: 'أرز لبنان بريميوم',
      category: 'زيوت وسمن',
      subCategory: 'زيوت وسمن وطبخ',
      unit: 'قنينة زجاجية مفردة (750 مل)',
      retailSellingPriceIQD: 9500,
      oldPrice: 11000,
      discountPercent: 14,
      stockQuantity: 34,
      rating: 4.9,
      reviewsCount: 142,
      imageUrl: '/assets/images/unit_olive_oil_bottle.jpg',
      active: true
    },
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
      imageUrl: '/assets/images/white_sunflower_oil.jpg',
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
      imageUrl: '/assets/images/white_basmati_rice.jpg',
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
      imageUrl: '/assets/images/white_milk_powder.jpg',
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
      imageUrl: '/assets/images/white_tomato_paste.jpg',
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
      imageUrl: '/assets/images/white_ceylon_tea.jpg',
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
      imageUrl: '/assets/images/white_sugar_pack.jpg',
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
      imageUrl: '/assets/images/unit_cheese_tub.jpg',
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
      imageUrl: '/assets/images/white_canned_goods.jpg',
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
      imageUrl: '/assets/images/white_cleaner_bottles.jpg',
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
      imageUrl: '/assets/images/white_pasta_pack.jpg',
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
      imageUrl: '/assets/images/white_instant_coffee.jpg',
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
      imageUrl: '/assets/images/unit_eggs_tray.jpg',
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
      imageUrl: '/assets/images/white_cleaner_bottles.jpg',
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
      imageUrl: '/assets/images/unit_ketchup_bottle.jpg',
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
      imageUrl: '/assets/images/unit_biscuits_pack.jpg',
      active: true
    },
    {
      barcode: '6281003322114-RET',
      productName: 'قهوة إسبريسو محمصة مطحونة مختصة (مفرد)',
      nameEn: 'Roasted Ground Espresso Coffee Pack 250g',
      brand: 'محمصة دجلة المختصة',
      category: 'سكر وحلويات',
      subCategory: 'حلويات وسكر وشاي',
      unit: 'عبوة مفردة (250 غرام)',
      retailSellingPriceIQD: 7500,
      oldPrice: 8500,
      discountPercent: 12,
      stockQuantity: 32,
      rating: 4.9,
      reviewsCount: 78,
      imageUrl: '/assets/images/white_espresso_coffee.jpg',
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
  const resolvedCategory = category || 'أرز ومواد تموينية';
  const newProduct = {
    barcode: newBarcode,
    productName: productName.trim(),
    nameEn: nameEn?.trim() || productName.trim(),
    brand: brand?.trim() || 'منتج محلي',
    category: resolvedCategory,
    subCategory: subCategory || 'منتجات طازجة',
    unit: unit.trim(),
    retailSellingPriceIQD: Number(retailSellingPriceIQD),
    oldPrice: oldPrice ? Number(oldPrice) : (discountPercent ? Math.round(Number(retailSellingPriceIQD) * (1 + Number(discountPercent)/100)) : undefined),
    discountPercent: discountPercent ? Number(discountPercent) : undefined,
    stockQuantity: Number(stockQuantity) || 20,
    rating: 5.0,
    reviewsCount: 1,
    imageUrl: ensureRetailSingleUnitImage(imageUrl, resolvedCategory),
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
  const updates = { ...req.body };

  const productIdx = almansoorStorefrontState.products.findIndex(p => p.barcode === barcode);
  if (productIdx === -1) {
    return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
  }

  if (updates.imageUrl !== undefined) {
    updates.imageUrl = ensureRetailSingleUnitImage(
      updates.imageUrl,
      updates.category || almansoorStorefrontState.products[productIdx].category
    );
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
    product.promoBadge = String(promoBadge).trim();
  }

  res.json({
    success: true,
    message: `تم تطبيق عرض خصم ${discount}% على المنتج بنجاح`,
    data: product
  });
});

function findRetailProductByBarcode(barcode: string) {
  const bare = barcode.replace(/-RET$/, '');
  return almansoorStorefrontState.products.find(
    (p) => p.barcode === barcode || p.barcode === `${bare}-RET` || p.barcode.replace(/-RET$/, '') === bare
  );
}

function estimateSingleUnitRetailPrice(invPriceIQD: number, unitLabel: string): number {
  const match = unitLabel.match(/(\d+)\s*[×x*]/i);
  const divisor = match ? Math.max(1, Number(match[1])) : invPriceIQD >= 25000 ? 12 : 1;
  const raw = Math.round(invPriceIQD / divisor / 250) * 250;
  return Math.max(500, raw);
}

// 7.6B Near-Expiry Inventory Alerts & Offer Conversion (Store: Retail + Wholesale)
apiRouter.get('/store/:storeId/near-expiry', (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const store = db.stores.find((s) => s.id === storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: 'المتجر غير موجود' });
    }

    const modeParam = req.query.mode === 'custom' ? 'custom' : 'month';
    const targetDateParam = typeof req.query.targetDate === 'string' ? req.query.targetDate.trim() : undefined;

    if (modeParam === 'custom' && !isValidIsoDate(targetDateParam)) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تحديد تاريخ صالح بصيغة YYYY-MM-DD عند اختيار التاريخ المخصص'
      });
    }

    const { mode, referenceDate, cutoffDate } = resolveExpiryCutoffDate({
      mode: modeParam as ExpiryThresholdMode,
      targetDate: targetDateParam
    });

    const items = db.storeInventory.filter((s) => s.storeId === storeId && s.stockQuantity > 0);
    const alerts: any[] = [];

    for (const item of items) {
      const evaluation = evaluateExpiryStatus(item.expiryDate, { mode, targetDate: cutoffDate, referenceDate });
      if (!evaluation || !evaluation.isWithinThreshold) continue;

      const retailMatch = findRetailProductByBarcode(item.barcode);
      const wholesaleMatch = db.offers.find(
        (o) => o.barcode === item.barcode && Boolean(o.isClearanceNearExpiry)
      );

      const hasRetailPromo = Boolean(
        retailMatch &&
          retailMatch.active !== false &&
          ((retailMatch.discountPercent && retailMatch.discountPercent > 0) || retailMatch.promoBadge)
      );

      alerts.push({
        id: `exp_${item.id}`,
        source: 'store_inventory',
        storeId,
        barcode: item.barcode,
        productName: item.productName,
        category: item.category,
        unit: item.unit,
        imageUrl:
          db.getCatalogImageForBarcode(item.barcode) ||
          retailMatch?.imageUrl ||
          ensureRetailSingleUnitImage(undefined, item.category),
        stockQuantity: item.stockQuantity,
        costPriceIQD: item.costPriceIQD,
        sellingPriceIQD: item.retailSellingPriceIQD,
        capitalAtRiskIQD: item.stockQuantity * item.costPriceIQD,
        expiryDate: evaluation.expiryDate,
        daysRemaining: evaluation.daysRemaining,
        isExpired: evaluation.isExpired,
        urgency: evaluation.urgency,
        retailOffer: hasRetailPromo && retailMatch
          ? {
              active: true,
              barcode: retailMatch.barcode,
              priceIQD: retailMatch.retailSellingPriceIQD,
              oldPrice: retailMatch.oldPrice,
              discountPercent: retailMatch.discountPercent || 0,
              promoBadge: retailMatch.promoBadge
            }
          : null,
        wholesaleOffer: wholesaleMatch
          ? {
              active: true,
              offerId: wholesaleMatch.id,
              priceIQD: wholesaleMatch.priceIQD,
              clearanceDiscountPercent: wholesaleMatch.clearanceDiscountPercent || 0,
              expiryDate: wholesaleMatch.expiryDate,
              supplierName: wholesaleMatch.supplierName
            }
          : null
      });
    }

    alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);

    const totalCapitalAtRiskIQD = alerts.reduce((sum, a) => sum + a.capitalAtRiskIQD, 0);
    const urgentCount = alerts.filter((a) => a.urgency === 'expired' || a.urgency === 'critical').length;
    const convertedRetailCount = alerts.filter((a) => Boolean(a.retailOffer)).length;
    const convertedWholesaleCount = alerts.filter((a) => Boolean(a.wholesaleOffer)).length;

    res.json({
      success: true,
      storeId,
      mode,
      referenceDate,
      cutoffDate,
      summary: {
        nearExpiryCount: alerts.length,
        urgentCount,
        totalCapitalAtRiskIQD,
        convertedRetailCount,
        convertedWholesaleCount
      },
      data: alerts
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/store/:storeId/near-expiry/convert', (req: Request, res: Response) => {
  try {
    if (rejectCashierToken(req, res)) return;

    const { storeId } = req.params;
    const store = db.stores.find((s) => s.id === storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: 'المتجر غير موجود' });
    }

    const { barcode, discountPercent, channel, promoBadge } = req.body || {};
    if (typeof barcode !== 'string' || !barcode.trim()) {
      return res.status(400).json({ success: false, message: 'باركود المنتج مطلوب' });
    }

    const numericDiscount = Number(discountPercent);
    if (!Number.isFinite(numericDiscount) || numericDiscount < 5 || numericDiscount > 85) {
      return res.status(400).json({
        success: false,
        message: 'نسبة الخصم يجب أن تكون بين 5% و 85%'
      });
    }

    if (channel !== 'retail' && channel !== 'wholesale' && channel !== 'both') {
      return res.status(400).json({
        success: false,
        message: 'يرجى تحديد قناة العرض (تجزئة، جملة، أو كلاهما)'
      });
    }

    const cleanBarcode = barcode.trim();
    const invItem = db.storeInventory.find(
      (s) => s.storeId === storeId && s.barcode === cleanBarcode
    );
    if (!invItem) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود في مخزون المتجر' });
    }

    const cleanDiscount = Math.round(numericDiscount);
    const cleanBadge =
      typeof promoBadge === 'string' && promoBadge.trim()
        ? promoBadge.trim().slice(0, 48)
        : `تصفية الصلاحية • خصم ${cleanDiscount}%`;

    let retailOffer: any = null;
    let wholesaleOffer: any = null;

    if (channel === 'retail' || channel === 'both') {
      let retailProd = findRetailProductByBarcode(invItem.barcode);
      if (retailProd) {
        const basePrice = retailProd.oldPrice && retailProd.oldPrice > retailProd.retailSellingPriceIQD
          ? retailProd.oldPrice
          : retailProd.retailSellingPriceIQD;
        const discounted = Math.max(250, Math.round((basePrice * (1 - cleanDiscount / 100)) / 250) * 250);
        retailProd.oldPrice = basePrice;
        retailProd.retailSellingPriceIQD = discounted;
        retailProd.discountPercent = cleanDiscount;
        retailProd.expiryDate = invItem.expiryDate;
        retailProd.promoBadge = cleanBadge;
        retailProd.active = true;
      } else {
        const baseSinglePrice = estimateSingleUnitRetailPrice(invItem.retailSellingPriceIQD, invItem.unit);
        const discounted = Math.max(250, Math.round((baseSinglePrice * (1 - cleanDiscount / 100)) / 250) * 250);
        retailProd = {
          barcode: `${invItem.barcode}-RET`,
          productName: `${invItem.productName} (مفرد)`,
          nameEn: invItem.productName,
          brand: store.name,
          category: invItem.category,
          subCategory: invItem.category,
          unit: 'عبوة مفردة',
          retailSellingPriceIQD: discounted,
          oldPrice: baseSinglePrice,
          discountPercent: cleanDiscount,
          stockQuantity: Math.max(10, invItem.stockQuantity * 4),
          rating: 4.8,
          reviewsCount: 18,
          imageUrl: ensureRetailSingleUnitImage(undefined, invItem.category),
          expiryDate: invItem.expiryDate,
          promoBadge: cleanBadge,
          isFeatured: true,
          active: true
        };
        almansoorStorefrontState.products.unshift(retailProd);
      }
      retailOffer = {
        active: true,
        barcode: retailProd.barcode,
        priceIQD: retailProd.retailSellingPriceIQD,
        oldPrice: retailProd.oldPrice,
        discountPercent: retailProd.discountPercent,
        promoBadge: retailProd.promoBadge
      };
    }

    if (channel === 'wholesale' || channel === 'both') {
      const createdOffer = db.upsertWholesaleClearanceOffer({
        barcode: invItem.barcode,
        supplierId: 'supp_rafidain',
        basePriceIQD: invItem.costPriceIQD || invItem.retailSellingPriceIQD,
        discountPercent: cleanDiscount,
        availableStock: invItem.stockQuantity,
        expiryDate: invItem.expiryDate || ''
      });
      wholesaleOffer = {
        active: true,
        offerId: createdOffer.id,
        priceIQD: createdOffer.priceIQD,
        clearanceDiscountPercent: createdOffer.clearanceDiscountPercent,
        expiryDate: createdOffer.expiryDate,
        supplierName: createdOffer.supplierName
      };
    }

    invItem.isNearExpiry = true;

    res.json({
      success: true,
      message:
        channel === 'both'
          ? `تم تحويل "${invItem.productName}" إلى عروض التجزئة والجملة بخصم ${cleanDiscount}%`
          : channel === 'retail'
          ? `تم تحويل "${invItem.productName}" إلى عروض متجر التجزئة بخصم ${cleanDiscount}%`
          : `تم تحويل "${invItem.productName}" إلى عروض متجر الجملة بخصم ${cleanDiscount}%`,
      data: {
        barcode: invItem.barcode,
        channel,
        discountPercent: cleanDiscount,
        retailOffer,
        wholesaleOffer
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 7.6C Wholesale Supplier Near-Expiry Batches & Clearance Conversion
apiRouter.get('/supplier/:supplierId/near-expiry', (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const supplier = db.suppliers.find((s) => s.id === supplierId);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'المورد غير موجود' });
    }

    const modeParam = req.query.mode === 'custom' ? 'custom' : 'month';
    const targetDateParam = typeof req.query.targetDate === 'string' ? req.query.targetDate.trim() : undefined;
    if (modeParam === 'custom' && !isValidIsoDate(targetDateParam)) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تحديد تاريخ صالح بصيغة YYYY-MM-DD عند اختيار التاريخ المخصص'
      });
    }

    const { mode, referenceDate, cutoffDate } = resolveExpiryCutoffDate({
      mode: modeParam as ExpiryThresholdMode,
      targetDate: targetDateParam
    });

    const batches = db.getSupplierWarehouseBatches(supplierId);
    const alerts: any[] = [];

    for (const batch of batches) {
      const evaluation = evaluateExpiryStatus(batch.expiryDate, { mode, targetDate: cutoffDate, referenceDate });
      if (!evaluation || !evaluation.isWithinThreshold) continue;

      const wholesaleMatch = db.offers.find(
        (o) =>
          o.barcode === batch.barcode &&
          o.supplierId === supplierId &&
          Boolean(o.isClearanceNearExpiry)
      );

      alerts.push({
        id: batch.id,
        source: 'supplier_stock',
        supplierId,
        supplierName: supplier.companyName,
        barcode: batch.barcode,
        productName: batch.productName,
        category: batch.category,
        unit: batch.unit,
        imageUrl:
          db.getCatalogImageForBarcode(batch.barcode) ||
          '/assets/images/carton_basmati_rice.jpg',
        stockQuantity: batch.stockQuantity,
        costPriceIQD: batch.costPriceIQD,
        sellingPriceIQD: batch.wholesalePriceIQD,
        capitalAtRiskIQD: batch.stockQuantity * batch.costPriceIQD,
        expiryDate: evaluation.expiryDate,
        daysRemaining: evaluation.daysRemaining,
        isExpired: evaluation.isExpired,
        urgency: evaluation.urgency,
        retailOffer: null,
        wholesaleOffer: wholesaleMatch
          ? {
              active: true,
              offerId: wholesaleMatch.id,
              priceIQD: wholesaleMatch.priceIQD,
              clearanceDiscountPercent: wholesaleMatch.clearanceDiscountPercent || 0,
              expiryDate: wholesaleMatch.expiryDate,
              supplierName: wholesaleMatch.supplierName
            }
          : null
      });
    }

    alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);

    res.json({
      success: true,
      supplierId,
      mode,
      referenceDate,
      cutoffDate,
      summary: {
        nearExpiryCount: alerts.length,
        urgentCount: alerts.filter((a) => a.urgency === 'expired' || a.urgency === 'critical').length,
        totalCapitalAtRiskIQD: alerts.reduce((sum, a) => sum + a.capitalAtRiskIQD, 0),
        convertedRetailCount: 0,
        convertedWholesaleCount: alerts.filter((a) => Boolean(a.wholesaleOffer)).length
      },
      data: alerts
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/supplier/:supplierId/near-expiry/convert', (req: Request, res: Response) => {
  try {
    if (rejectCashierToken(req, res)) return;

    const { supplierId } = req.params;
    const supplier = db.suppliers.find((s) => s.id === supplierId);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'المورد غير موجود' });
    }

    const { barcode, batchId, discountPercent } = req.body || {};
    const numericDiscount = Number(discountPercent);
    if (!Number.isFinite(numericDiscount) || numericDiscount < 5 || numericDiscount > 85) {
      return res.status(400).json({ success: false, message: 'نسبة الخصم يجب أن تكون بين 5% و 85%' });
    }

    const batch = db.supplierInventoryBatches.find(
      (b) =>
        b.supplierId === supplierId &&
        ((typeof batchId === 'string' && b.id === batchId) ||
          (typeof barcode === 'string' && b.barcode === barcode.trim()))
    );

    if (!batch) {
      return res.status(404).json({ success: false, message: 'دفعة المخزون غير موجودة لهذا المورد' });
    }

    const offer = db.upsertWholesaleClearanceOffer({
      barcode: batch.barcode,
      supplierId,
      basePriceIQD: batch.wholesalePriceIQD,
      discountPercent: Math.round(numericDiscount),
      availableStock: batch.stockQuantity,
      expiryDate: batch.expiryDate
    });

    res.json({
      success: true,
      message: `تم تحويل دفعة "${batch.productName}" إلى عروض تصريف الجملة بخصم ${offer.clearanceDiscountPercent}%`,
      data: offer
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
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
    image:
      image && !String(image).includes('unsplash.com') && !String(image).includes('carton_')
        ? image
        : '/assets/images/banner_dalil_hero.jpg',
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
      imageUrl: '/assets/images/white_sunflower_oil.jpg',
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
      imageUrl: '/assets/images/white_milk_powder.jpg',
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
      imageUrl: '/assets/images/white_basmati_rice.jpg',
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
      imageUrl: '/assets/images/white_tomato_paste.jpg',
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
      imageUrl: '/assets/images/white_ceylon_tea.jpg',
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
      imageUrl: '/assets/images/white_cleaner_bottles.jpg',
      turnoverDays: 22,
      speedBadge: 'معتدل'
    },
    {
      barcode: '6281009988776-RET',
      name: 'طبقة بيض مائدة طازج محلي (30 بيضة)',
      unit: 'طبقة منزلية',
      category: 'ألبان وأجبان',
      unitsSold: 42,
      revenueIQD: 252000,
      sharePercent: 8.6,
      imageUrl: '/assets/images/unit_eggs_tray.jpg',
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

// ================= 8B. STORE STAFF ACCOUNTS (CASHIER & ACCOUNTANT) =================
apiRouter.post('/auth/store-session', (req: Request, res: Response) => {
  try {
    const storeId = typeof req.body?.storeId === 'string' ? req.body.storeId.trim() : '';
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'معرف المتجر مطلوب' });
    }
    const token = signSessionToken({
      sub: `owner_${storeId}`,
      role: 'store',
      storeId,
      exp: Date.now() + 12 * 60 * 60 * 1000
    });
    res.json({ success: true, token });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/staff/login', (req: Request, res: Response) => {
  try {
    const phone = typeof req.body?.phone === 'string' ? req.body.phone : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!phone.trim() || !password) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال رقم الهاتف وكلمة المرور' });
    }

    const result = db.authenticateStoreStaff(phone, password);
    if (result.status === 'not_found') {
      return res.status(404).json({ success: false, message: 'لا يوجد حساب موظف مسجل بهذا الرقم' });
    }
    if (result.status === 'invalid_credentials') {
      return res.status(401).json({ success: false, message: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
    }
    if (result.status === 'inactive' || !result.staff) {
      return res.status(403).json({ success: false, message: 'هذا الحساب موقوف حالياً من قبل مدير المتجر' });
    }

    const token = signSessionToken({
      sub: result.staff.id,
      role: result.staff.role,
      storeId: result.staff.storeId,
      exp: Date.now() + 12 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      token,
      staff: result.staff
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.get('/stores/:storeId/staff', requireStoreOwner, (req: Request, res: Response) => {
  try {
    const list = db.getStoreStaff(req.params.storeId);
    res.json({ success: true, count: list.length, data: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/stores/:storeId/staff', requireStoreOwner, (req: Request, res: Response) => {
  try {
    const { storeName, name, role, phone, branchId, branchName, password } = req.body || {};
    const created = db.createStoreStaff({
      storeId: req.params.storeId,
      storeName: typeof storeName === 'string' ? storeName : undefined,
      name: typeof name === 'string' ? name : '',
      role,
      phone: typeof phone === 'string' ? phone : '',
      branchId: typeof branchId === 'string' ? branchId : 'branch_main',
      branchName: typeof branchName === 'string' ? branchName : 'الفرع الرئيسي',
      password: typeof password === 'string' ? password : ''
    });
    res.status(201).json({
      success: true,
      message: 'تم إنشاء حساب الموظف بنجاح',
      data: created
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

apiRouter.patch('/stores/:storeId/staff/:staffId', requireStoreOwner, (req: Request, res: Response) => {
  try {
    const { name, role, phone, branchId, branchName, isActive, password } = req.body || {};
    const updated = db.updateStoreStaff(req.params.storeId, req.params.staffId, {
      name: typeof name === 'string' ? name : undefined,
      role,
      phone: typeof phone === 'string' ? phone : undefined,
      branchId: typeof branchId === 'string' ? branchId : undefined,
      branchName: typeof branchName === 'string' ? branchName : undefined,
      isActive: typeof isActive === 'boolean' ? isActive : undefined,
      password: typeof password === 'string' ? password : undefined
    });
    res.json({
      success: true,
      message: 'تم تحديث حساب الموظف بنجاح',
      data: updated
    });
  } catch (error: any) {
    const status = error.message?.includes('غير موجود') ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
});

apiRouter.delete('/stores/:storeId/staff/:staffId', requireStoreOwner, (req: Request, res: Response) => {
  try {
    db.deleteStoreStaff(req.params.storeId, req.params.staffId);
    res.json({
      success: true,
      message: 'تم حذف حساب الموظف'
    });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
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
