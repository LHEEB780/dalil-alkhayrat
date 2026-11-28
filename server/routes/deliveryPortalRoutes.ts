import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/store.ts';

declare global {
  namespace Express {
    interface Request {
      deliverySessionToken?: string;
    }
  }
}

export const deliveryPortalRouter = Router();

/**
 * TEMPORARY PREVIEW AUTHENTICATION MIDDLEWARE (Phase D2):
 * Reads partner or platform-driver session token from `x-delivery-session` header
 * (format: `partner:<id>` or `platform_driver:<id>` verified against active records).
 * MUST be replaced with real signed JWT / OTP verification before production launch.
 */
function requireDeliveryPortalSession(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['x-delivery-session'];
  if (typeof token !== 'string' || !token.trim()) {
    return res.status(401).json({
      success: false,
      message: 'يلزم تسجيل الدخول أولاً إلى بوابة شريك / سائق التوصيل'
    });
  }
  try {
    db.resolveDeliveryPortalSession(token);
    req.deliverySessionToken = token;
    return next();
  } catch (err: any) {
    return res.status(err?.statusCode || 401).json({
      success: false,
      message: err?.message || 'جلسة التوصيل غير صالحة أو منتهية'
    });
  }
}

deliveryPortalRouter.post('/login', (req: Request, res: Response) => {
  try {
    const data = db.loginDeliveryPortal({
      phone: String(req.body?.phone || ''),
      registrationCode: String(req.body?.registrationCode || '')
    });
    return res.json({
      success: true,
      message: 'تم تسجيل الدخول إلى بوابة التوصيل بنجاح',
      data
    });
  } catch (err: any) {
    return res.status(err?.statusCode || 401).json({
      success: false,
      message: err?.message || 'تعذر تسجيل الدخول'
    });
  }
});

// Authenticated Portal Endpoints
deliveryPortalRouter.use(requireDeliveryPortalSession);

deliveryPortalRouter.get('/me', (req: Request, res: Response) => {
  try {
    const data = db.getDeliveryPortalMe(req.deliverySessionToken!);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(err?.statusCode || 401).json({
      success: false,
      message: err?.message || 'تعذر جلب ملف الشريك'
    });
  }
});

deliveryPortalRouter.post('/availability', (req: Request, res: Response) => {
  try {
    const data = db.setDeliveryDriverAvailability({
      sessionToken: req.deliverySessionToken!,
      driverId: typeof req.body?.driverId === 'string' ? req.body.driverId : undefined,
      availability: req.body?.availability === 'offline' ? 'offline' : 'online'
    });
    return res.json({
      success: true,
      message:
        data.availability === 'online'
          ? 'أنت الآن متاح لاستلام المهام'
          : 'تم تغيير الحالة إلى غير متاح',
      data
    });
  } catch (err: any) {
    return res.status(err?.statusCode || 400).json({
      success: false,
      message: err?.message || 'تعذر تحديث حالة التوفر'
    });
  }
});

// Static job sub-routes MUST precede parameterized `/jobs/:id/...` routes
deliveryPortalRouter.get('/jobs/available', (req: Request, res: Response) => {
  try {
    const data = db.getAvailablePortalJobs(req.deliverySessionToken!);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(err?.statusCode || 400).json({
      success: false,
      message: err?.message || 'تعذر جلب المهام المتاحة'
    });
  }
});

deliveryPortalRouter.get('/jobs/mine', (req: Request, res: Response) => {
  try {
    const data = db.getMyPortalJobs(req.deliverySessionToken!);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(err?.statusCode || 400).json({
      success: false,
      message: err?.message || 'تعذر جلب مهامي'
    });
  }
});

deliveryPortalRouter.post('/jobs/:id/accept', (req: Request, res: Response) => {
  try {
    const data = db.acceptPortalJob({
      sessionToken: req.deliverySessionToken!,
      jobId: req.params.id,
      driverId: typeof req.body?.driverId === 'string' ? req.body.driverId : undefined,
      vehicleId: typeof req.body?.vehicleId === 'string' ? req.body.vehicleId : undefined
    });
    return res.json({
      success: true,
      message: 'تم قبول المهمة بنجاح',
      data
    });
  } catch (err: any) {
    return res.status(err?.statusCode || 400).json({
      success: false,
      message: err?.message || 'تعذر قبول المهمة'
    });
  }
});

deliveryPortalRouter.post('/jobs/:id/arrived-pickup', (req: Request, res: Response) => {
  try {
    const data = db.progressPortalJob({
      sessionToken: req.deliverySessionToken!,
      jobId: req.params.id,
      step: 'arrived-pickup'
    });
    return res.json({ success: true, message: 'تم تسجيل الوصول إلى مستودع المورد', data });
  } catch (err: any) {
    return res.status(err?.statusCode || 400).json({
      success: false,
      message: err?.message || 'تعذر تسجيل الوصول للمستودع'
    });
  }
});

deliveryPortalRouter.post('/jobs/:id/pickup', (req: Request, res: Response) => {
  try {
    const data = db.progressPortalJob({
      sessionToken: req.deliverySessionToken!,
      jobId: req.params.id,
      step: 'pickup',
      pickupPin: String(req.body?.pickupPin || '')
    });
    return res.json({
      success: true,
      message: 'تم التحقق من رمز الاستلام وتأكيد استلام الشحنة من المستودع',
      data
    });
  } catch (err: any) {
    return res.status(err?.statusCode || 400).json({
      success: false,
      message: err?.message || 'تعذر تأكيد استلام الشحنة'
    });
  }
});

deliveryPortalRouter.post('/jobs/:id/start', (req: Request, res: Response) => {
  try {
    const data = db.progressPortalJob({
      sessionToken: req.deliverySessionToken!,
      jobId: req.params.id,
      step: 'start'
    });
    return res.json({ success: true, message: 'بدأت رحلة التوصيل للمتجر', data });
  } catch (err: any) {
    return res.status(err?.statusCode || 400).json({
      success: false,
      message: err?.message || 'تعذر بدء الرحلة'
    });
  }
});

deliveryPortalRouter.post('/jobs/:id/arrived-dropoff', (req: Request, res: Response) => {
  try {
    const data = db.progressPortalJob({
      sessionToken: req.deliverySessionToken!,
      jobId: req.params.id,
      step: 'arrived-dropoff'
    });
    return res.json({ success: true, message: 'تم تسجيل الوصول إلى موقع المتجر', data });
  } catch (err: any) {
    return res.status(err?.statusCode || 400).json({
      success: false,
      message: err?.message || 'تعذر تسجيل الوصول للمتجر'
    });
  }
});

deliveryPortalRouter.post('/jobs/:id/deliver', (req: Request, res: Response) => {
  try {
    const data = db.progressPortalJob({
      sessionToken: req.deliverySessionToken!,
      jobId: req.params.id,
      step: 'deliver',
      deliveryPin: String(req.body?.deliveryPin || '')
    });
    return res.json({
      success: true,
      message: 'تم التحقق من رمز التسليم وإتمام المهمة بنجاح',
      data
    });
  } catch (err: any) {
    return res.status(err?.statusCode || 400).json({
      success: false,
      message: err?.message || 'تعذر تأكيد تسليم الطلب'
    });
  }
});

deliveryPortalRouter.post('/jobs/:id/fail', (req: Request, res: Response) => {
  try {
    const data = db.progressPortalJob({
      sessionToken: req.deliverySessionToken!,
      jobId: req.params.id,
      step: 'fail',
      reasonCode: req.body?.reasonCode,
      note: String(req.body?.note || '')
    });
    return res.json({
      success: true,
      message: 'تم تسجيل تعذر التوصيل وإشعار لوحة التوزيع',
      data
    });
  } catch (err: any) {
    return res.status(err?.statusCode || 400).json({
      success: false,
      message: err?.message || 'تعذر تسجيل فشل المهمة'
    });
  }
});

deliveryPortalRouter.get('/earnings', (req: Request, res: Response) => {
  try {
    const data = db.getDeliveryPortalEarnings(req.deliverySessionToken!);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(err?.statusCode || 400).json({
      success: false,
      message: err?.message || 'تعذر جلب ملخص المستحقات'
    });
  }
});
