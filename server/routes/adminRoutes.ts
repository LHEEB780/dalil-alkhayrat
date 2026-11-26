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
