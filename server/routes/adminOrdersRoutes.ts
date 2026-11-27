import { Router, Request, Response } from 'express';
import { db } from '../db/store.ts';
import { requireAdmin, requirePermission } from './adminRoutes.ts';

function sanitizeCsvCell(value: unknown): string {
  let str = value === null || value === undefined ? '' : String(value);
  // Prevent CSV formula injection (=, +, -, @, tab, CR)
  if (/^[\s]*[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

// ================= 1. ADMIN ORDERS ROUTER (/api/admin/orders) =================
export const adminOrdersRouter = Router();
adminOrdersRouter.use(requireAdmin);

// Orders list + CSV export (must precede /:id)
adminOrdersRouter.get('/', requirePermission('orders.view'), (req: Request, res: Response) => {
  try {
    const result = db.listAdminOrders({
      search: req.query.search ? String(req.query.search) : undefined,
      status: req.query.status ? String(req.query.status) : undefined,
      supplierId: req.query.supplierId ? String(req.query.supplierId) : undefined,
      storeId: req.query.storeId ? String(req.query.storeId) : undefined,
      paymentMethod: req.query.paymentMethod ? String(req.query.paymentMethod) : undefined,
      city: req.query.city ? String(req.query.city) : undefined,
      dateFrom: req.query.dateFrom ? String(req.query.dateFrom) : undefined,
      dateTo: req.query.dateTo ? String(req.query.dateTo) : undefined,
      stuckOnly: req.query.stuckOnly === 'true' || req.query.stuckOnly === '1',
      sortBy: req.query.sortBy ? String(req.query.sortBy) : undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : 15
    });

    if (String(req.query.format || '').toLowerCase() === 'csv') {
      const headers = [
        'Order ID',
        'Parent Order ID',
        'Created At',
        'Store',
        'City',
        'Supplier',
        'Payment Method',
        'Subtotal IQD',
        'Status',
        'Driver',
        'Items Count',
        'Stuck'
      ];
      const lines = [
        headers.map(sanitizeCsvCell).join(','),
        ...result.allFilteredItems.map((o) =>
          [
            o.id,
            o.parentOrderId,
            o.createdAt,
            o.storeName,
            o.storeCity,
            o.supplierName,
            o.paymentMethod,
            o.subtotalIQD,
            o.status,
            o.assignedDriverName || '-',
            o.items.length,
            o.isStuck ? 'YES' : 'NO'
          ]
            .map(sanitizeCsvCell)
            .join(',')
        )
      ];
      const csvContent = '\uFEFF' + lines.join('\r\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="orders-export.csv"');
      return res.send(csvContent);
    }

    const { allFilteredItems: _omit, ...payload } = result;
    res.json({ success: true, data: payload });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Audited status transition / force delivery / cancel (must precede GET /:id)
adminOrdersRouter.post(
  '/:id/transition',
  requirePermission('orders.override_status'),
  (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { toStatus, reason, driverId, force } = req.body || {};

      if (!toStatus || typeof toStatus !== 'string') {
        return res.status(400).json({ success: false, message: 'يرجى تحديد الحالة المستهدفة للطلب' });
      }
      if (typeof reason !== 'string' || reason.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message: 'يرجى إدخال سبب إداري واضح لا يقل عن 5 أحرف'
        });
      }

      const actor = req.adminActor || { actorId: 'admin_root', actorName: 'المدير العام (Super Admin)' };
      const updated = db.transitionSubOrder({
        id,
        toStatus: toStatus as any,
        reason,
        driverId: driverId ? String(driverId) : undefined,
        force: Boolean(force),
        actor: {
          actorType: 'admin',
          actorId: actor.actorId,
          actorName: actor.actorName
        }
      });

      const detail = db.getAdminOrderDetail(updated.id);
      res.json({ success: true, data: detail });
    } catch (error: any) {
      res.status(error?.statusCode || 400).json({ success: false, message: error.message });
    }
  }
);

// Add internal note on order (must precede GET /:id)
adminOrdersRouter.post(
  '/:id/notes',
  requirePermission('orders.override_status'),
  (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { text } = req.body || {};
      const actor = req.adminActor || { actorId: 'admin_root', actorName: 'المدير العام (Super Admin)' };
      const note = db.addAdminOrderNote({
        id,
        text: String(text || ''),
        actor: { actorId: actor.actorId, actorName: actor.actorName }
      });
      res.status(201).json({ success: true, data: note });
    } catch (error: any) {
      res.status(error?.statusCode || 400).json({ success: false, message: error.message });
    }
  }
);

// Single Order full detail (with PIN, timeline, ledger, disputes, notes, audit logs)
adminOrdersRouter.get('/:id', requirePermission('orders.view'), (req: Request, res: Response) => {
  try {
    const detail = db.getAdminOrderDetail(req.params.id);
    res.json({ success: true, data: detail });
  } catch (error: any) {
    res.status(error?.statusCode || 404).json({ success: false, message: error.message });
  }
});

// ================= 2. ADMIN DISPUTES ROUTER (/api/admin/disputes) =================
export const adminDisputesRouter = Router();
adminDisputesRouter.use(requireAdmin);

adminDisputesRouter.get('/', requirePermission('disputes.manage'), (req: Request, res: Response) => {
  try {
    const data = db.listAdminDisputes({
      status: req.query.status ? String(req.query.status) : undefined,
      reasonCode: req.query.reasonCode ? String(req.query.reasonCode) : undefined,
      search: req.query.search ? String(req.query.search) : undefined
    });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

adminDisputesRouter.post('/', requirePermission('disputes.manage'), (req: Request, res: Response) => {
  try {
    const { subOrderId, openedBy, reasonCode, description, claimedAmountIQD } = req.body || {};
    const actor = req.adminActor || { actorId: 'admin_root', actorName: 'المدير العام (Super Admin)' };
    const created = db.createAdminDispute({
      subOrderId: String(subOrderId || ''),
      openedBy: openedBy || 'admin',
      reasonCode: reasonCode || 'other',
      description: String(description || ''),
      claimedAmountIQD: claimedAmountIQD !== undefined && claimedAmountIQD !== '' ? Number(claimedAmountIQD) : undefined,
      actor: { actorId: actor.actorId, actorName: actor.actorName }
    });
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(error?.statusCode || 400).json({ success: false, message: error.message });
  }
});

adminDisputesRouter.post(
  '/:id/review',
  requirePermission('disputes.manage'),
  (req: Request, res: Response) => {
    try {
      const { reason } = req.body || {};
      if (typeof reason !== 'string' || reason.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message: 'يرجى إدخال سبب إداري واضح لا يقل عن 5 أحرف'
        });
      }
      const actor = req.adminActor || { actorId: 'admin_root', actorName: 'المدير العام (Super Admin)' };
      const updated = db.reviewAdminDispute({
        id: req.params.id,
        reason,
        actor: { actorId: actor.actorId, actorName: actor.actorName }
      });
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(error?.statusCode || 400).json({ success: false, message: error.message });
    }
  }
);

adminDisputesRouter.post(
  '/:id/resolve',
  requirePermission('disputes.manage'),
  (req: Request, res: Response) => {
    try {
      const { type, amountIQD, restockToSupplier, note, reason } = req.body || {};
      if (typeof reason !== 'string' || reason.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message: 'يرجى إدخال سبب إداري واضح لا يقل عن 5 أحرف'
        });
      }
      const actor = req.adminActor || { actorId: 'admin_root', actorName: 'المدير العام (Super Admin)' };
      const updated = db.resolveAdminDispute({
        id: req.params.id,
        type,
        amountIQD: amountIQD !== undefined && amountIQD !== '' ? Number(amountIQD) : undefined,
        restockToSupplier: Boolean(restockToSupplier),
        note,
        reason,
        actor: { actorId: actor.actorId, actorName: actor.actorName }
      });
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(error?.statusCode || 400).json({ success: false, message: error.message });
    }
  }
);

adminDisputesRouter.post(
  '/:id/notes',
  requirePermission('disputes.manage'),
  (req: Request, res: Response) => {
    try {
      const { text } = req.body || {};
      const actor = req.adminActor || { actorId: 'admin_root', actorName: 'المدير العام (Super Admin)' };
      const note = db.addAdminDisputeNote({
        id: req.params.id,
        text: String(text || ''),
        actor: { actorId: actor.actorId, actorName: actor.actorName }
      });
      res.status(201).json({ success: true, data: note });
    } catch (error: any) {
      res.status(error?.statusCode || 400).json({ success: false, message: error.message });
    }
  }
);

// ================= 3. ADMIN LOGISTICS ROUTER (/api/admin/logistics) =================
export const adminLogisticsRouter = Router();
adminLogisticsRouter.use(requireAdmin);

adminLogisticsRouter.get('/overview', requirePermission('drivers.view'), (_req: Request, res: Response) => {
  try {
    const data = db.getAdminLogisticsOverview();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});
