import { Router, Request, Response } from 'express';
import { db } from '../db/store.ts';
import { requireAdmin, requirePermission } from './adminRoutes.ts';

export const adminDeliveryRouter = Router();

adminDeliveryRouter.use(requireAdmin);

const ALLOWED_PARTNER_ACTIONS = new Set(['approve', 'reject', 'suspend', 'reactivate', 'archive']);
const ALLOWED_VEHICLE_ACTIONS = new Set(['approve', 'reject', 'activate', 'suspend', 'maintenance']);
const ALLOWED_DRIVER_ACTIONS = new Set(['approve', 'reject', 'suspend', 'reactivate', 'archive']);

// Overview
adminDeliveryRouter.get(
  '/overview',
  requirePermission('delivery.view'),
  (_req: Request, res: Response) => {
    try {
      const data = db.getAdminDeliveryOverview();
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 500).json({
        success: false,
        message: err?.message || 'تعذر تحميل نظرة شبكة التوصيل'
      });
    }
  }
);

// Partners
adminDeliveryRouter.get(
  '/partners',
  requirePermission('delivery.view'),
  (req: Request, res: Response) => {
    try {
      const data = db.getAdminDeliveryPartners({
        statusTab: typeof req.query.statusTab === 'string' ? req.query.statusTab : undefined,
        type: typeof req.query.type === 'string' ? req.query.type : undefined,
        governorateId:
          typeof req.query.governorateId === 'string' ? req.query.governorateId : undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined
      });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر جلب شركاء التوصيل'
      });
    }
  }
);

adminDeliveryRouter.get(
  '/partners/:id',
  requirePermission('delivery.view'),
  (req: Request, res: Response) => {
    try {
      const data = db.getAdminDeliveryPartnerDetail(req.params.id);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 404).json({
        success: false,
        message: err?.message || 'شريك التوصيل غير موجود'
      });
    }
  }
);

adminDeliveryRouter.patch(
  '/partners/:id/kyc',
  requirePermission('delivery.partners.manage'),
  (req: Request, res: Response) => {
    try {
      const data = db.updateAdminDeliveryPartnerKyc({
        id: req.params.id,
        licenseNo: req.body?.licenseNo,
        checklist: req.body?.checklist,
        actor: {
          actorId: req.adminActor!.actorId,
          actorName: req.adminActor!.actorName
        }
      });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر تحديث قائمة التحقق'
      });
    }
  }
);

adminDeliveryRouter.post(
  '/partners/:id/notes',
  requirePermission('delivery.partners.manage'),
  (req: Request, res: Response) => {
    try {
      const note = db.addAdminDeliveryPartnerNote({
        id: req.params.id,
        text: req.body?.text,
        actor: {
          actorId: req.adminActor!.actorId,
          actorName: req.adminActor!.actorName
        }
      });
      return res.status(201).json({ success: true, data: note });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر إضافة الملاحظة'
      });
    }
  }
);

adminDeliveryRouter.patch(
  '/partners/:id',
  requirePermission('delivery.partners.manage'),
  (req: Request, res: Response) => {
    try {
      const data = db.updateAdminDeliveryPartner({
        id: req.params.id,
        name: req.body?.name,
        city: req.body?.city,
        governorateId: req.body?.governorateId,
        serviceZoneIds: req.body?.serviceZoneIds,
        reason: req.body?.reason,
        actor: {
          actorId: req.adminActor!.actorId,
          actorName: req.adminActor!.actorName
        }
      });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر تحديث بيانات الشريك'
      });
    }
  }
);

adminDeliveryRouter.post(
  '/partners/:id/:action',
  requirePermission('delivery.partners.manage'),
  (req: Request, res: Response) => {
    try {
      const action = String(req.params.action || '');
      if (!ALLOWED_PARTNER_ACTIONS.has(action)) {
        return res.status(400).json({
          success: false,
          message: `إجراء غير صالح لشريك التوصيل: ${action}`
        });
      }
      const data = db.transitionAdminDeliveryPartner({
        id: req.params.id,
        action: action as any,
        reason: req.body?.reason,
        actor: {
          actorId: req.adminActor!.actorId,
          actorName: req.adminActor!.actorName
        }
      });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر تنفيذ الإجراء على الشريك'
      });
    }
  }
);

// Vehicles
adminDeliveryRouter.get(
  '/vehicles',
  requirePermission('delivery.view'),
  (req: Request, res: Response) => {
    try {
      const data = db.getAdminDeliveryVehicles({
        ownerType: typeof req.query.ownerType === 'string' ? req.query.ownerType : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        vehicleClass:
          typeof req.query.vehicleClass === 'string' ? req.query.vehicleClass : undefined,
        expiringOnly: req.query.expiringOnly === 'true',
        search: typeof req.query.search === 'string' ? req.query.search : undefined
      });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر جلب مركبات التوصيل'
      });
    }
  }
);

adminDeliveryRouter.post(
  '/vehicles',
  requirePermission('delivery.vehicles.manage'),
  (req: Request, res: Response) => {
    try {
      const data = db.createAdminDeliveryVehicle({
        ownerType: req.body?.ownerType,
        partnerId: req.body?.partnerId,
        plateNumber: req.body?.plateNumber,
        vehicleClass: req.body?.vehicleClass,
        makeModel: req.body?.makeModel,
        year: req.body?.year,
        capacityUnits: req.body?.capacityUnits,
        temperatureSupport: req.body?.temperatureSupport,
        status: req.body?.status,
        docsExpiry: req.body?.docsExpiry,
        reason: req.body?.reason,
        actor: {
          actorId: req.adminActor!.actorId,
          actorName: req.adminActor!.actorName
        }
      });
      return res.status(201).json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر إنشاء المركبة'
      });
    }
  }
);

adminDeliveryRouter.patch(
  '/vehicles/:id/docs',
  requirePermission('delivery.vehicles.manage'),
  (req: Request, res: Response) => {
    try {
      const data = db.updateAdminDeliveryVehicleDocs({
        id: req.params.id,
        docsExpiry: req.body?.docsExpiry || {},
        reason: req.body?.reason,
        actor: {
          actorId: req.adminActor!.actorId,
          actorName: req.adminActor!.actorName
        }
      });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر تحديث وثائق المركبة'
      });
    }
  }
);

adminDeliveryRouter.post(
  '/vehicles/:id/:action',
  requirePermission('delivery.vehicles.manage'),
  (req: Request, res: Response) => {
    try {
      const action = String(req.params.action || '');
      if (!ALLOWED_VEHICLE_ACTIONS.has(action)) {
        return res.status(400).json({
          success: false,
          message: `إجراء غير صالح للمركبة: ${action}`
        });
      }
      const data = db.transitionAdminDeliveryVehicle({
        id: req.params.id,
        action: action as any,
        reason: req.body?.reason,
        actor: {
          actorId: req.adminActor!.actorId,
          actorName: req.adminActor!.actorName
        }
      });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر تغيير حالة المركبة'
      });
    }
  }
);

// Platform & Partner Delivery Drivers (separate from DriverProfile)
adminDeliveryRouter.get(
  '/drivers',
  requirePermission('delivery.view'),
  (req: Request, res: Response) => {
    try {
      const data = db.getAdminDeliveryDrivers({
        providerType:
          typeof req.query.providerType === 'string' ? req.query.providerType : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        governorateId:
          typeof req.query.governorateId === 'string' ? req.query.governorateId : undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined
      });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر جلب سائقي شبكة التوصيل'
      });
    }
  }
);

adminDeliveryRouter.post(
  '/drivers',
  requirePermission('delivery.partners.manage'),
  (req: Request, res: Response) => {
    try {
      const data = db.createAdminDeliveryDriver({
        providerType: req.body?.providerType,
        partnerId: req.body?.partnerId,
        name: req.body?.name,
        phone: req.body?.phone,
        licenseNo: req.body?.licenseNo,
        licenseExpiry: req.body?.licenseExpiry,
        assignedVehicleId: req.body?.assignedVehicleId,
        governorateId: req.body?.governorateId,
        serviceZoneIds: req.body?.serviceZoneIds,
        reason: req.body?.reason,
        actor: {
          actorId: req.adminActor!.actorId,
          actorName: req.adminActor!.actorName
        }
      });
      return res.status(201).json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر إضافة سائق شبكة التوصيل'
      });
    }
  }
);

adminDeliveryRouter.patch(
  '/drivers/:id',
  requirePermission('delivery.partners.manage'),
  (req: Request, res: Response) => {
    try {
      const data = db.updateAdminDeliveryDriver({
        id: req.params.id,
        assignedVehicleId: req.body?.assignedVehicleId,
        serviceZoneIds: req.body?.serviceZoneIds,
        isAvailable: req.body?.isAvailable,
        licenseNo: req.body?.licenseNo,
        licenseExpiry: req.body?.licenseExpiry,
        reason: req.body?.reason,
        actor: {
          actorId: req.adminActor!.actorId,
          actorName: req.adminActor!.actorName
        }
      });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر تحديث بيانات السائق'
      });
    }
  }
);

adminDeliveryRouter.post(
  '/drivers/:id/:action',
  requirePermission('delivery.partners.manage'),
  (req: Request, res: Response) => {
    try {
      const action = String(req.params.action || '');
      if (!ALLOWED_DRIVER_ACTIONS.has(action)) {
        return res.status(400).json({
          success: false,
          message: `إجراء غير صالح للسائق: ${action}`
        });
      }
      const data = db.transitionAdminDeliveryDriver({
        id: req.params.id,
        action: action as any,
        reason: req.body?.reason,
        actor: {
          actorId: req.adminActor!.actorId,
          actorName: req.adminActor!.actorName
        }
      });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر تغيير حالة السائق'
      });
    }
  }
);

// Rate Rules & Platform Delivery Settings
adminDeliveryRouter.get(
  '/rates',
  requirePermission('delivery.view'),
  (_req: Request, res: Response) => {
    try {
      const data = db.getAdminDeliveryRateRules();
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر جلب قواعد التسعير'
      });
    }
  }
);

adminDeliveryRouter.post(
  '/rates',
  requirePermission('delivery.rates.manage'),
  (req: Request, res: Response) => {
    try {
      const data = db.createAdminDeliveryRateRule({
        nameAr: req.body?.nameAr,
        nameEn: req.body?.nameEn,
        scope: req.body?.scope || {},
        vehicleClass: req.body?.vehicleClass,
        baseFeeIQD: req.body?.baseFeeIQD,
        perUnitFeeIQD: req.body?.perUnitFeeIQD,
        minFeeIQD: req.body?.minFeeIQD,
        refrigeratedSurchargeIQD: req.body?.refrigeratedSurchargeIQD,
        isActive: req.body?.isActive,
        reason: req.body?.reason,
        actor: {
          actorId: req.adminActor!.actorId,
          actorName: req.adminActor!.actorName
        }
      });
      return res.status(201).json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر إنشاء قاعدة التسعير'
      });
    }
  }
);

adminDeliveryRouter.patch(
  '/rates/:id',
  requirePermission('delivery.rates.manage'),
  (req: Request, res: Response) => {
    try {
      const data = db.updateAdminDeliveryRateRule({
        id: req.params.id,
        nameAr: req.body?.nameAr,
        nameEn: req.body?.nameEn,
        scope: req.body?.scope,
        vehicleClass: req.body?.vehicleClass,
        baseFeeIQD: req.body?.baseFeeIQD,
        perUnitFeeIQD: req.body?.perUnitFeeIQD,
        minFeeIQD: req.body?.minFeeIQD,
        refrigeratedSurchargeIQD: req.body?.refrigeratedSurchargeIQD,
        isActive: req.body?.isActive,
        reason: req.body?.reason,
        actor: {
          actorId: req.adminActor!.actorId,
          actorName: req.adminActor!.actorName
        }
      });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر تعديل قاعدة التسعير'
      });
    }
  }
);

adminDeliveryRouter.delete(
  '/rates/:id',
  requirePermission('delivery.rates.manage'),
  (req: Request, res: Response) => {
    try {
      const data = db.deleteAdminDeliveryRateRule({
        id: req.params.id,
        reason: req.body?.reason,
        actor: {
          actorId: req.adminActor!.actorId,
          actorName: req.adminActor!.actorName
        }
      });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر تعطيل قاعدة التسعير'
      });
    }
  }
);

adminDeliveryRouter.get(
  '/settings',
  requirePermission('delivery.view'),
  (_req: Request, res: Response) => {
    try {
      const data = db.getAdminDeliveryPlatformSettings();
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر جلب إعدادات التوصيل'
      });
    }
  }
);

adminDeliveryRouter.patch(
  '/settings',
  requirePermission('delivery.rates.manage'),
  (req: Request, res: Response) => {
    try {
      const data = db.updateAdminDeliveryPlatformSettings({
        freeDeliveryThresholdIQD: req.body?.freeDeliveryThresholdIQD,
        partnerCommissionPercent: req.body?.partnerCommissionPercent,
        codAllowedForPartners: req.body?.codAllowedForPartners,
        vehicleClassDefaults: req.body?.vehicleClassDefaults,
        reason: req.body?.reason,
        actor: {
          actorId: req.adminActor!.actorId,
          actorName: req.adminActor!.actorName
        }
      });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر تحديث إعدادات شبكة التوصيل'
      });
    }
  }
);

// Supplier Delivery Settings
adminDeliveryRouter.get(
  '/suppliers',
  requirePermission('delivery.view'),
  (_req: Request, res: Response) => {
    try {
      const data = db.getAdminSupplierDeliverySettingsList();
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر جلب إعدادات توصيل الموردين'
      });
    }
  }
);

adminDeliveryRouter.patch(
  '/suppliers/:id/delivery-settings',
  requirePermission('delivery.partners.manage'),
  (req: Request, res: Response) => {
    try {
      const data = db.updateAdminSupplierDeliverySettings({
        supplierId: req.params.id,
        hasOwnFleet: req.body?.hasOwnFleet,
        allowPlatformDelivery: req.body?.allowPlatformDelivery,
        allowStorePickup: req.body?.allowStorePickup,
        freeDeliveryThresholdIQD: req.body?.freeDeliveryThresholdIQD,
        notes: req.body?.notes,
        reason: req.body?.reason,
        actor: {
          actorId: req.adminActor!.actorId,
          actorName: req.adminActor!.actorName
        }
      });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر تحديث إعدادات توصيل المورد'
      });
    }
  }
);

// Fee Simulator
adminDeliveryRouter.post(
  '/simulate-fee',
  requirePermission('delivery.view'),
  (req: Request, res: Response) => {
    try {
      const data = db.simulateAdminDeliveryFee({
        supplierId: req.body?.supplierId,
        governorateId: req.body?.governorateId,
        deliveryZoneId: req.body?.deliveryZoneId,
        items: Array.isArray(req.body?.items) ? req.body.items : undefined,
        storageType: req.body?.storageType,
        units: req.body?.units !== undefined ? Number(req.body.units) : undefined,
        requiredTemperature: req.body?.requiredTemperature || undefined,
        orderValueIQD: Number(req.body?.orderValueIQD) || 0
      });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(err?.statusCode || 400).json({
        success: false,
        message: err?.message || 'تعذر تشغيل محاكي رسوم التوصيل'
      });
    }
  }
);
