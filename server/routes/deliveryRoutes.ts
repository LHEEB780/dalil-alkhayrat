import { Router, Request, Response } from 'express';
import { db } from '../db/store.ts';

export const deliveryRouter = Router();

deliveryRouter.post('/partners/register', (req: Request, res: Response) => {
  try {
    const clientIp =
      String(req.headers['x-forwarded-for'] || '')
        .split(',')[0]
        .trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      'unknown';

    const result = db.registerPublicDeliveryPartner(req.body || {}, clientIp);
    return res.status(201).json({
      success: true,
      message: 'تم استلام طلب تسجيل شريك التوصيل بنجاح وهو قيد مراجعة الإدارة',
      data: result
    });
  } catch (err: any) {
    return res.status(err?.statusCode || 400).json({
      success: false,
      message: err?.message || 'تعذر تسجيل طلب شريك التوصيل'
    });
  }
});

deliveryRouter.get('/partners/status', (req: Request, res: Response) => {
  try {
    const phone = String(req.query.phone || '');
    const code = String(req.query.code || '');
    const data = db.getPublicDeliveryPartnerStatus(phone, code);
    return res.json({
      success: true,
      data
    });
  } catch (err: any) {
    return res.status(err?.statusCode || 400).json({
      success: false,
      message: err?.message || 'تعذر الاستعلام عن حالة الطلب'
    });
  }
});

deliveryRouter.post('/quote', (req: Request, res: Response) => {
  try {
    const data = db.getPublicDeliveryQuote(req.body || {});
    return res.json({
      success: true,
      data
    });
  } catch (err: any) {
    return res.status(err?.statusCode || 400).json({
      success: false,
      message: err?.message || 'تعذر احتساب عرض سعر التوصيل'
    });
  }
});
