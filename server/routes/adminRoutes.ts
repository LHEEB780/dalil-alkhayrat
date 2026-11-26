import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/store.ts';
import {
  AdminPermissionCode,
  AdminRoleId,
  hasAdminPermission
} from '../../shared/adminPermissions.ts';

export interface AdminRequestActor {
  actorId: string;
  actorName: string;
  adminRole: AdminRoleId;
}

declare global {
  namespace Express {
    interface Request {
      adminActor?: AdminRequestActor;
    }
  }
}

/**
 * TEMPORARY & INSECURE PREVIEW GATE:
 * Checks ONLY the client-supplied `x-user-role === 'admin'` header.
 * This MUST be replaced with real server-verified authentication (signed session / JWT / Firebase Auth)
 * before production deployment.
 * Every route mounted under `/api/admin` MUST pass through `requireAdmin`.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const roleHeader = String(req.headers['x-user-role'] || '').trim().toLowerCase();
  if (roleHeader !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'الوصول محصور بإدارة المنصة فقط (Forbidden: admin role required)'
    });
  }

  // While only the single Super Admin account exists, resolve actor as super_admin.
  // Ready to read an authenticated admin user's assigned AdminRoleId once multi-admin accounts are enabled.
  req.adminActor = {
    actorId: 'admin_root',
    actorName: 'المدير العام (Super Admin)',
    adminRole: 'super_admin'
  };

  next();
}

/**
 * Permission guard layered on top of `requireAdmin`.
 * Treats the current admin user as `super_admin` (full permissions) until role-based accounts are activated.
 */
export function requirePermission(code: AdminPermissionCode) {
  return (req: Request, res: Response, next: NextFunction) => {
    const runCheck = () => {
      const actor = req.adminActor;
      if (!actor) {
        return res.status(403).json({
          success: false,
          message: 'صلاحيات الإدارة مطلوبة'
        });
      }
      if (!hasAdminPermission(actor.adminRole, code)) {
        return res.status(403).json({
          success: false,
          message: `غير مصرح بتنفيذ الإجراء (${code})`
        });
      }
      return next();
    };

    if (!req.adminActor) {
      return requireAdmin(req, res, runCheck);
    }
    return runCheck();
  };
}

export const adminRouter = Router();

// Enforce requireAdmin globally on all /api/admin routes
adminRouter.use(requireAdmin);

// 1. Operations Overview KPIs, Time Series, Top Lists & Needs Attention Queue
adminRouter.get('/overview', requirePermission('overview.view'), (req: Request, res: Response) => {
  try {
    const rawRange = String(req.query.range || '30d').trim();
    const range: '7d' | '30d' | '90d' =
      rawRange === '7d' || rawRange === '90d' ? rawRange : '30d';
    const overview = db.getAdminOverview(range);
    res.json({ success: true, data: overview });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Audit Logs with filters and pagination
adminRouter.get('/audit-logs', requirePermission('audit.view'), (req: Request, res: Response) => {
  try {
    const { action, entityType, actorId, from, to, page, pageSize } = req.query;
    const data = db.queryAuditLogs({
      action: typeof action === 'string' ? action : undefined,
      entityType: typeof entityType === 'string' ? entityType : undefined,
      actorId: typeof actorId === 'string' ? actorId : undefined,
      from: typeof from === 'string' ? from : undefined,
      to: typeof to === 'string' ? to : undefined,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 10
    });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Global Admin Search across Suppliers, Stores, Drivers, Products & Orders
adminRouter.get('/search', requirePermission('overview.view'), (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const data = db.searchAdminEntities(q);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ================= PHASE 2: ACCOUNTS & VERIFICATION MANAGEMENT =================
type RouteAccountType = 'suppliers' | 'stores' | 'drivers' | 'staff';
type RouteAccountAction = 'approve' | 'reject' | 'suspend' | 'reactivate' | 'archive';

const VALID_ACCOUNT_TYPES = new Set<RouteAccountType>(['suppliers', 'stores', 'drivers', 'staff']);
const VALID_ACCOUNT_ACTIONS = new Set<RouteAccountAction>([
  'approve',
  'reject',
  'suspend',
  'reactivate',
  'archive'
]);

function parseAccountType(raw: string): RouteAccountType | null {
  return VALID_ACCOUNT_TYPES.has(raw as RouteAccountType) ? (raw as RouteAccountType) : null;
}

function getViewPermissionForType(type: RouteAccountType): AdminPermissionCode {
  switch (type) {
    case 'suppliers':
      return 'suppliers.view';
    case 'stores':
      return 'stores.view';
    case 'drivers':
      return 'drivers.view';
    case 'staff':
      return 'staff.view';
  }
}

function getWritePermissionForAction(
  type: RouteAccountType,
  action?: RouteAccountAction
): AdminPermissionCode {
  if (type === 'suppliers') {
    return action === 'approve' || action === 'reject' ? 'suppliers.verify' : 'suppliers.suspend';
  }
  if (type === 'drivers') {
    return 'drivers.suspend';
  }
  return 'stores.suspend';
}

function requireAccountViewPermission(req: Request, res: Response, next: NextFunction) {
  const type = parseAccountType(req.params.type);
  if (!type) {
    return res.status(400).json({ success: false, message: 'نوع الحساب غير صالح' });
  }
  return requirePermission(getViewPermissionForType(type))(req, res, next);
}

function requireAccountActionPermission(req: Request, res: Response, next: NextFunction) {
  const type = parseAccountType(req.params.type);
  if (!type) {
    return res.status(400).json({ success: false, message: 'نوع الحساب غير صالح' });
  }
  const action = req.params.action as RouteAccountAction | undefined;
  if (action !== undefined && !VALID_ACCOUNT_ACTIONS.has(action)) {
    return res.status(400).json({ success: false, message: 'إجراء الحساب غير صالح' });
  }
  return requirePermission(getWritePermissionForAction(type, action))(req, res, next);
}

// Manual creation: Supplier
adminRouter.post('/suppliers', requirePermission('suppliers.verify'), (req: Request, res: Response) => {
  try {
    const actor = req.adminActor!;
    const detail = db.createAdminSupplier({
      ...(req.body || {}),
      actor: { actorId: actor.actorId, actorName: actor.actorName }
    });
    res.status(201).json({
      success: true,
      message: 'تم إنشاء حساب المورد بنجاح',
      data: detail
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Manual creation: Store
adminRouter.post('/stores', requirePermission('stores.suspend'), (req: Request, res: Response) => {
  try {
    const actor = req.adminActor!;
    const detail = db.createAdminStore({
      ...(req.body || {}),
      actor: { actorId: actor.actorId, actorName: actor.actorName }
    });
    res.status(201).json({
      success: true,
      message: 'تم إنشاء حساب المتجر بنجاح',
      data: detail
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// List accounts by type with filters, search, sorting & pagination
adminRouter.get('/:type', requireAccountViewPermission, (req: Request, res: Response) => {
  try {
    const type = parseAccountType(req.params.type)!;
    const {
      search,
      statusTab,
      accountStatus,
      verificationStatus,
      businessType,
      city,
      sortBy,
      page,
      pageSize
    } = req.query;

    const data = db.listAdminAccounts(type, {
      search: typeof search === 'string' ? search : undefined,
      statusTab: typeof statusTab === 'string' ? statusTab : undefined,
      accountStatus: typeof accountStatus === 'string' ? accountStatus : undefined,
      verificationStatus: typeof verificationStatus === 'string' ? verificationStatus : undefined,
      businessType: typeof businessType === 'string' ? businessType : undefined,
      city: typeof city === 'string' ? city : undefined,
      sortBy: typeof sortBy === 'string' ? sortBy : undefined,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 12
    });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get full account details + metrics + recent orders + credit + audit logs
adminRouter.get('/:type/:id', requireAccountViewPermission, (req: Request, res: Response) => {
  try {
    const type = parseAccountType(req.params.type)!;
    const detail = db.getAdminAccountDetail(type, req.params.id);
    if (!detail) {
      return res.status(404).json({ success: false, message: 'الحساب المطلوب غير موجود' });
    }
    res.json({ success: true, data: detail });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Status transitions: approve | reject | suspend | reactivate | archive (Reason mandatory >= 5 chars)
adminRouter.post('/:type/:id/:action', requireAccountActionPermission, (req: Request, res: Response) => {
  try {
    const type = parseAccountType(req.params.type)!;
    const action = req.params.action as RouteAccountAction;
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (reason.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال سبب إداري واضح (5 أحرف على الأقل)'
      });
    }

    const actor = req.adminActor!;
    const detail = db.transitionAdminAccountStatus({
      type,
      id: req.params.id,
      action,
      reason,
      verificationStatus:
        typeof req.body?.verificationStatus === 'string'
          ? (req.body.verificationStatus as any)
          : undefined,
      actor: { actorId: actor.actorId, actorName: actor.actorName }
    });

    res.json({
      success: true,
      message: 'تم تحديث حالة الحساب بنجاح وتسجيله في سجل التدقيق',
      data: detail
    });
  } catch (error: any) {
    const statusCode = error?.statusCode === 404 ? 404 : 400;
    res.status(statusCode).json({ success: false, message: error.message });
  }
});

// Edit basic account details
adminRouter.patch('/:type/:id', requireAccountActionPermission, (req: Request, res: Response) => {
  try {
    const type = parseAccountType(req.params.type)!;
    const actor = req.adminActor!;
    const detail = db.updateAdminAccountDetails({
      type,
      id: req.params.id,
      patch: req.body || {},
      actor: { actorId: actor.actorId, actorName: actor.actorName }
    });
    res.json({
      success: true,
      message: 'تم تحديث بيانات الحساب بنجاح',
      data: detail
    });
  } catch (error: any) {
    const statusCode = error?.statusCode === 404 ? 404 : 400;
    res.status(statusCode).json({ success: false, message: error.message });
  }
});

// Add internal admin note
adminRouter.post('/:type/:id/notes', requireAccountActionPermission, (req: Request, res: Response) => {
  try {
    const type = parseAccountType(req.params.type)!;
    const actor = req.adminActor!;
    const text = typeof req.body?.text === 'string' ? req.body.text : '';
    const detail = db.addAdminAccountNote({
      type,
      id: req.params.id,
      text,
      actor: { actorId: actor.actorId, actorName: actor.actorName }
    });
    res.status(201).json({
      success: true,
      message: 'تمت إضافة الملاحظة الداخلية',
      data: detail
    });
  } catch (error: any) {
    const statusCode = error?.statusCode === 404 ? 404 : 400;
    res.status(statusCode).json({ success: false, message: error.message });
  }
});

// Update KYC documents & checklist
adminRouter.patch('/:type/:id/kyc', requireAccountActionPermission, (req: Request, res: Response) => {
  try {
    const type = parseAccountType(req.params.type)!;
    const actor = req.adminActor!;
    const detail = db.updateAdminAccountKyc({
      type,
      id: req.params.id,
      licenseNo: typeof req.body?.licenseNo === 'string' ? req.body.licenseNo : undefined,
      taxId: typeof req.body?.taxId === 'string' ? req.body.taxId : undefined,
      checklist: Array.isArray(req.body?.checklist) ? req.body.checklist : undefined,
      actor: { actorId: actor.actorId, actorName: actor.actorName }
    });
    res.json({
      success: true,
      message: 'تم تحديث قائمة التوثيق والوثائق بنجاح',
      data: detail
    });
  } catch (error: any) {
    const statusCode = error?.statusCode === 404 ? 404 : 400;
    res.status(statusCode).json({ success: false, message: error.message });
  }
});
