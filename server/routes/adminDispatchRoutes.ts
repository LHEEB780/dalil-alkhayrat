import { Router, Request, Response } from 'express';
import { db } from '../db/store.ts';
import { requireAdmin, requirePermission } from './adminRoutes.ts';

export const adminDispatchRouter = Router();

adminDispatchRouter.use(requireAdmin);

// Static routes before parameterized routes
adminDispatchRouter.get(
  '/summary',
  requirePermission('dispatch.view'),
  (_req: Request, res: Response) => {
    try {
      const data = db.getAdminDispatchSummary();
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 500).json({
        success: false,
        message: err?.message || 'تعذر تحميل ملخص التوزيع'
      });
    }
  }
);

adminDispatchRouter.get(
  '/jobs',
  requirePermission('dispatch.view'),
  (req: Request, res: Response) => {
    try {
      const data = db.getAdminDispatchJobs({
        tab: typeof req.query.tab === 'string' ? req.query.tab : undefined,
        governorateId:
          typeof req.query.governorateId === 'string' ? req.query.governorateId : undefined,
        partnerId: typeof req.query.partnerId === 'string' ? req.query.partnerId : undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        staleOnly: req.query.staleOnly === 'true'
      });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر جلب مهام التوصيل'
      });
    }
  }
);

adminDispatchRouter.get(
  '/jobs/:id',
  requirePermission('dispatch.view'),
  (req: Request, res: Response) => {
    try {
      const data = db.getAdminDispatchJobDetail(req.params.id);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 404).json({
        success: false,
        message: err?.message || 'مهمة التوصيل غير موجودة'
      });
    }
  }
);

adminDispatchRouter.post(
  '/jobs/:id/assign',
  requirePermission('dispatch.assign'),
  (req: Request, res: Response) => {
    try {
      const data = db.assignDispatchJob({
        jobId: req.params.id,
        driverId: String(req.body?.driverId || ''),
        vehicleId: typeof req.body?.vehicleId === 'string' ? req.body.vehicleId : undefined,
        reason: String(req.body?.reason || ''),
        actor: {
          actorId: req.adminActor!.actorId,
          actorName: req.adminActor!.actorName
        }
      });
      return res.json({
        success: true,
        message: 'تم إسناد مهمة التوصيل بنجاح',
        data
      });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر إسناد المهمة'
      });
    }
  }
);

adminDispatchRouter.post(
  '/jobs/:id/unassign',
  requirePermission('dispatch.assign'),
  (req: Request, res: Response) => {
    try {
      const data = db.unassignDispatchJob({
        jobId: req.params.id,
        reason: String(req.body?.reason || ''),
        actor: {
          actorId: req.adminActor!.actorId,
          actorName: req.adminActor!.actorName
        }
      });
      return res.json({
        success: true,
        message: 'تم سحب تعيين المهمة وإعادتها لقائمة المهام المفتوحة',
        data
      });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر سحب تعيين المهمة'
      });
    }
  }
);

adminDispatchRouter.post(
  '/jobs/:id/cancel',
  requirePermission('dispatch.assign'),
  (req: Request, res: Response) => {
    try {
      const data = db.cancelDispatchJob({
        jobId: req.params.id,
        reason: String(req.body?.reason || ''),
        actor: {
          actorId: req.adminActor!.actorId,
          actorName: req.adminActor!.actorName
        }
      });
      return res.json({
        success: true,
        message: 'تم إلغاء مهمة التوصيل بنجاح',
        data
      });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر إلغاء المهمة'
      });
    }
  }
);

adminDispatchRouter.post(
  '/jobs/:id/reopen',
  requirePermission('dispatch.assign'),
  (req: Request, res: Response) => {
    try {
      const data = db.reopenDispatchJob({
        jobId: req.params.id,
        reason: String(req.body?.reason || ''),
        actor: {
          actorId: req.adminActor!.actorId,
          actorName: req.adminActor!.actorName
        }
      });
      return res.json({
        success: true,
        message: 'تم فتح مهمة توصيل جديدة بنجاح',
        data
      });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر إعادة فتح المهمة'
      });
    }
  }
);

adminDispatchRouter.post(
  '/orders/:orderId/convert-to-platform',
  requirePermission('dispatch.assign'),
  (req: Request, res: Response) => {
    try {
      const data = db.convertOrderToPlatformDelivery({
        orderId: req.params.orderId,
        reason: String(req.body?.reason || ''),
        actor: {
          actorId: req.adminActor!.actorId,
          actorName: req.adminActor!.actorName
        }
      });
      return res.json({
        success: true,
        message: 'تم تحويل الطلب إلى شبكة توصيل المنصة بنجاح',
        data
      });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر تحويل الطلب إلى شبكة المنصة'
      });
    }
  }
);
