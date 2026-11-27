import { Router, Request, Response } from 'express';
import { db } from '../db/store.ts';
import { requireAdmin, requirePermission } from './adminRoutes.ts';

export const adminCatalogRouter = Router();

// Enforce admin authentication across all /api/admin/catalog routes
adminCatalogRouter.use(requireAdmin);

const PRODUCT_STATUS_ACTIONS = ['hide', 'restore', 'archive'] as const;
const BRAND_STATUS_ACTIONS = ['hide', 'restore'] as const;
const OFFER_STATUS_ACTIONS = ['suspend', 'restore'] as const;

// 1. Catalog Products List (must precede /products/:barcode)
adminCatalogRouter.get('/products', requirePermission('products.manage'), (req: Request, res: Response) => {
  try {
    const parseMaxQuality = (): number | undefined => {
      if (req.query.maxQuality === undefined || req.query.maxQuality === '') return undefined;
      const n = Number(req.query.maxQuality);
      return Number.isFinite(n) ? n : undefined;
    };

    const data = db.listAdminProducts({
      search: req.query.search ? String(req.query.search) : undefined,
      category: req.query.category ? String(req.query.category) : undefined,
      brandId: req.query.brandId ? String(req.query.brandId) : undefined,
      status: req.query.status ? String(req.query.status) : undefined,
      maxQuality: parseMaxQuality(),
      hasOffers: req.query.hasOffers ? String(req.query.hasOffers) : undefined,
      suppliersFilter: req.query.suppliersFilter ? String(req.query.suppliersFilter) : undefined,
      sortBy: req.query.sortBy ? String(req.query.sortBy) : undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : 15
    });

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Create New Unified Product (with strict GS1 barcode & duplicate check)
adminCatalogRouter.post('/products', requirePermission('products.manage'), (req: Request, res: Response) => {
  try {
    const actor = req.adminActor || { actorId: 'admin_root', actorName: 'المدير العام (Super Admin)' };
    const created = db.createAdminProduct({
      ...(req.body || {}),
      actor: { actorId: actor.actorId, actorName: actor.actorName }
    });
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 3. Add Internal Note to Unified Product (MUST precede /products/:barcode/:action)
adminCatalogRouter.post('/products/:barcode/notes', requirePermission('products.manage'), (req: Request, res: Response) => {
  try {
    const { barcode } = req.params;
    const { text } = req.body || {};
    const actor = req.adminActor || { actorId: 'admin_root', actorName: 'المدير العام (Super Admin)' };
    const updated = db.addAdminProductNote({
      barcode,
      text: String(text || ''),
      actor: { actorId: actor.actorId, actorName: actor.actorName }
    });
    res.status(201).json({ success: true, data: updated });
  } catch (error: any) {
    res.status(error?.statusCode || 400).json({ success: false, message: error.message });
  }
});

// 4. Unified Product Lifecycle Actions (hide | restore | archive)
adminCatalogRouter.post('/products/:barcode/:action', requirePermission('products.manage'), (req: Request, res: Response) => {
  try {
    const { barcode, action } = req.params;
    if (!PRODUCT_STATUS_ACTIONS.includes(action as any)) {
      return res.status(400).json({
        success: false,
        message: 'إجراء المنتج غير صالح'
      });
    }
    const { reason } = req.body || {};
    if (typeof reason !== 'string' || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال سبب إداري واضح لا يقل عن 5 أحرف'
      });
    }
    const actor = req.adminActor || { actorId: 'admin_root', actorName: 'المدير العام (Super Admin)' };
    const updated = db.transitionAdminProductStatus({
      barcode,
      action: action as 'hide' | 'restore' | 'archive',
      reason,
      actor: { actorId: actor.actorId, actorName: actor.actorName }
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(error?.statusCode || 400).json({ success: false, message: error.message });
  }
});

// 5. Get Single Product Details (Offers, Quality, Notes, Audit)
adminCatalogRouter.get('/products/:barcode', requirePermission('products.manage'), (req: Request, res: Response) => {
  try {
    const detail = db.getAdminProductDetail(req.params.barcode);
    if (!detail) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود في الكتالوج' });
    }
    res.json({ success: true, data: detail });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Update Unified Product Metadata
adminCatalogRouter.patch('/products/:barcode', requirePermission('products.manage'), (req: Request, res: Response) => {
  try {
    const actor = req.adminActor || { actorId: 'admin_root', actorName: 'المدير العام (Super Admin)' };
    const updated = db.updateAdminProduct({
      barcode: req.params.barcode,
      patch: req.body || {},
      actor: { actorId: actor.actorId, actorName: actor.actorName }
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(error?.statusCode || 400).json({ success: false, message: error.message });
  }
});

// 7. Brands List & CRUD
adminCatalogRouter.get('/brands', requirePermission('brands.manage'), (req: Request, res: Response) => {
  try {
    const data = db.listAdminBrands({
      search: req.query.search ? String(req.query.search) : undefined,
      status: req.query.status ? String(req.query.status) : undefined
    });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

adminCatalogRouter.post('/brands', requirePermission('brands.manage'), (req: Request, res: Response) => {
  try {
    const actor = req.adminActor || { actorId: 'admin_root', actorName: 'المدير العام (Super Admin)' };
    const created = db.createAdminBrand({
      ...(req.body || {}),
      actor: { actorId: actor.actorId, actorName: actor.actorName }
    });
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

adminCatalogRouter.patch('/brands/:id', requirePermission('brands.manage'), (req: Request, res: Response) => {
  try {
    const actor = req.adminActor || { actorId: 'admin_root', actorName: 'المدير العام (Super Admin)' };
    const updated = db.updateAdminBrand({
      id: req.params.id,
      ...(req.body || {}),
      actor: { actorId: actor.actorId, actorName: actor.actorName }
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(error?.statusCode || 400).json({ success: false, message: error.message });
  }
});

adminCatalogRouter.post('/brands/:id/:action', requirePermission('brands.manage'), (req: Request, res: Response) => {
  try {
    const { id, action } = req.params;
    if (!BRAND_STATUS_ACTIONS.includes(action as any)) {
      return res.status(400).json({
        success: false,
        message: 'إجراء العلامة التجارية غير صالح'
      });
    }
    const { reason } = req.body || {};
    if (typeof reason !== 'string' || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال سبب إداري واضح لا يقل عن 5 أحرف'
      });
    }
    const actor = req.adminActor || { actorId: 'admin_root', actorName: 'المدير العام (Super Admin)' };
    const updated = db.transitionAdminBrandStatus({
      id,
      action: action as 'hide' | 'restore',
      reason,
      actor: { actorId: actor.actorId, actorName: actor.actorName }
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(error?.statusCode || 400).json({ success: false, message: error.message });
  }
});

// 8. Supplier Offers Monitoring & Suspend/Restore
adminCatalogRouter.get('/offers', requirePermission('offers.suspend'), (req: Request, res: Response) => {
  try {
    const data = db.listAdminOffers({
      search: req.query.search ? String(req.query.search) : undefined,
      supplierId: req.query.supplierId ? String(req.query.supplierId) : undefined,
      barcode: req.query.barcode ? String(req.query.barcode) : undefined,
      status: req.query.status ? String(req.query.status) : undefined,
      lowStock: req.query.lowStock === 'true' || req.query.lowStock === '1',
      anomalyOnly: req.query.anomalyOnly === 'true' || req.query.anomalyOnly === '1',
      page: req.query.page ? Number(req.query.page) : 1,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : 15
    });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

adminCatalogRouter.post('/offers/:id/:action', requirePermission('offers.suspend'), (req: Request, res: Response) => {
  try {
    const { id, action } = req.params;
    if (!OFFER_STATUS_ACTIONS.includes(action as any)) {
      return res.status(400).json({
        success: false,
        message: 'إجراء عرض المورد غير صالح'
      });
    }
    const { reason } = req.body || {};
    if (typeof reason !== 'string' || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال سبب إداري واضح لا يقل عن 5 أحرف'
      });
    }
    const actor = req.adminActor || { actorId: 'admin_root', actorName: 'المدير العام (Super Admin)' };
    const updated = db.transitionAdminOfferStatus({
      id,
      action: action as 'suspend' | 'restore',
      reason,
      actor: { actorId: actor.actorId, actorName: actor.actorName }
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(error?.statusCode || 400).json({ success: false, message: error.message });
  }
});

// 9. Category Tree (22 Departments & Branches with Counts)
adminCatalogRouter.get('/tree', requirePermission('products.manage'), (_req: Request, res: Response) => {
  try {
    const data = db.getAdminCategoryTree();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 10. Catalog Data Quality Summary
adminCatalogRouter.get('/quality-summary', requirePermission('products.manage'), (_req: Request, res: Response) => {
  try {
    const data = db.getAdminCatalogQualitySummary();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});
