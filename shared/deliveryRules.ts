export type DeliveryPartnerType = 'individual' | 'company';

export type DeliveryVehicleClass =
  | 'motorcycle'
  | 'pickup'
  | 'small_truck'
  | 'medium_truck'
  | 'refrigerated_truck';

export type VehicleTemperatureType = 'ambient' | 'chilled' | 'frozen';

export type ProductStorageKind = 'ambient' | 'chilled' | 'frozen' | 'dry' | 'controlled';

export type DeliveryVehicleStatus = 'pending' | 'active' | 'maintenance' | 'suspended' | 'rejected';

export type DeliveryProviderType = 'platform' | 'partner';

export type DeliveryOptionCode = 'supplier_fleet' | 'platform' | 'pickup';

export interface VehicleClassDefaultConfig {
  vehicleClass: DeliveryVehicleClass;
  labelAr: string;
  labelEn: string;
  capacityUnits: number;
  temperatureSupport: VehicleTemperatureType[];
}

export interface DeliveryRateRule {
  id: string;
  nameAr: string;
  nameEn: string;
  scope: {
    governorateId?: string;
    deliveryZoneId?: string;
  };
  vehicleClass: DeliveryVehicleClass;
  baseFeeIQD: number;
  perUnitFeeIQD: number;
  minFeeIQD: number;
  refrigeratedSurchargeIQD: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface DeliveryPlatformSettings {
  freeDeliveryThresholdIQD: number;
  partnerCommissionPercent: number;
  codAllowedForPartners: boolean;
  staleOpenJobMinutes?: number;
  maxActiveJobsPerDriver?: number;
  vehicleClassDefaults: VehicleClassDefaultConfig[];
  updatedAt?: string;
  updatedBy?: string;
}

export type DeliveryJobStatus =
  | 'open'
  | 'assigned'
  | 'accepted'
  | 'at_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'at_dropoff'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export type DeliveryJobFailureReasonCode =
  | 'store_closed'
  | 'customer_refused'
  | 'address_not_found'
  | 'vehicle_issue'
  | 'other';

export interface DeliveryJobEndpoint {
  name: string;
  phone?: string;
  address: string;
  city: string;
  governorateId?: string;
  zoneId?: string;
  lat?: number;
  lng?: number;
}

export interface DeliveryJobHistoryEntry {
  status: DeliveryJobStatus;
  at: string;
  actorType: 'system' | 'admin' | 'supplier' | 'driver' | 'partner';
  actorId?: string;
  actorName: string;
  note?: string;
}

export interface DeliveryJob {
  id: string;
  subOrderId: string;
  supplierId: string;
  storeId: string;
  governorateId: string;
  deliveryZoneId?: string;
  pickup: DeliveryJobEndpoint;
  dropoff: DeliveryJobEndpoint;
  unitsCount: number;
  requiredTemperature: VehicleTemperatureType;
  paymentMethod: 'cod' | 'credit' | 'wallet' | 'online';
  orderSubtotalIQD: number;
  estimatedPayoutIQD: number;
  status: DeliveryJobStatus;
  assignedPartnerId?: string;
  assignedDriverId?: string;
  assignedVehicleId?: string;
  pickupPin: string;
  attempts: number;
  createdAt: string;
  assignedAt?: string;
  acceptedAt?: string;
  arrivedPickupAt?: string;
  pickedUpAt?: string;
  inTransitAt?: string;
  arrivedDropoffAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  failure?: {
    reasonCode: DeliveryJobFailureReasonCode;
    note: string;
    failedAt?: string;
    failedBy?: string;
  };
  history: DeliveryJobHistoryEntry[];
}

export interface SupplierDeliverySettings {
  hasOwnFleet: boolean;
  allowPlatformDelivery: boolean;
  allowStorePickup: boolean;
  freeDeliveryThresholdIQD?: number;
  notes?: string;
}

export interface DeliveryVehicleCapability {
  id: string;
  vehicleClass: DeliveryVehicleClass;
  capacityUnits: number;
  temperatureSupport: VehicleTemperatureType[];
  status: DeliveryVehicleStatus;
  ownerType?: 'platform' | 'partner';
  partnerId?: string;
  plateNumber?: string;
}

export const VEHICLE_CLASS_ORDER: DeliveryVehicleClass[] = [
  'motorcycle',
  'pickup',
  'small_truck',
  'medium_truck',
  'refrigerated_truck'
];

export const VEHICLE_CLASS_LABELS: Record<DeliveryVehicleClass, { ar: string; en: string }> = {
  motorcycle: { ar: 'دراجة نارية / ستوتة', en: 'Motorcycle / Cargo Bike' },
  pickup: { ar: 'بيك أب', en: 'Pickup Truck' },
  small_truck: { ar: 'شاحنة صغيرة (كيا / بونغو)', en: 'Small Truck' },
  medium_truck: { ar: 'شاحنة متوسطة', en: 'Medium Truck' },
  refrigerated_truck: { ar: 'شاحنة مبردة', en: 'Refrigerated Truck' }
};

export function getRequiredTemperatureForStorageTypes(
  storageTypes: Array<ProductStorageKind | undefined>
): VehicleTemperatureType {
  let needsChilled = false;
  for (const st of storageTypes) {
    if (st === 'frozen') return 'frozen';
    if (st === 'chilled') needsChilled = true;
  }
  return needsChilled ? 'chilled' : 'ambient';
}

export function doesTemperatureSupportSatisfy(
  support: VehicleTemperatureType[],
  requiredTemperature: VehicleTemperatureType
): boolean {
  if (!Array.isArray(support) || support.length === 0) {
    return requiredTemperature === 'ambient';
  }
  if (requiredTemperature === 'frozen') {
    return support.includes('frozen');
  }
  if (requiredTemperature === 'chilled') {
    return support.includes('chilled') || support.includes('frozen');
  }
  return (
    support.includes('ambient') ||
    support.includes('chilled') ||
    support.includes('frozen')
  );
}

export function isVehicleSuitable(
  vehicle: Pick<DeliveryVehicleCapability, 'capacityUnits' | 'temperatureSupport' | 'status'>,
  params: {
    units: number;
    requiredTemperature: VehicleTemperatureType;
    requireActiveStatus?: boolean;
  }
): boolean {
  if (params.requireActiveStatus !== false && vehicle.status !== 'active') {
    return false;
  }
  if ((vehicle.capacityUnits || 0) < Math.max(0, params.units)) {
    return false;
  }
  return doesTemperatureSupportSatisfy(vehicle.temperatureSupport, params.requiredTemperature);
}

export function pickVehicleClass(
  units: number,
  requiredTemperature: VehicleTemperatureType,
  settings: DeliveryPlatformSettings
): {
  vehicleClass: DeliveryVehicleClass;
  exceedsStandardCapacity: boolean;
  selectionReasonAr: string;
  selectionReasonEn: string;
} {
  const safeUnits = Math.max(1, Math.round(units || 1));
  const defaultsByClass = new Map<DeliveryVehicleClass, VehicleClassDefaultConfig>();
  for (const cfg of settings.vehicleClassDefaults || []) {
    defaultsByClass.set(cfg.vehicleClass, cfg);
  }

  for (const cls of VEHICLE_CLASS_ORDER) {
    const cfg = defaultsByClass.get(cls);
    if (!cfg) continue;
    const capOk = cfg.capacityUnits >= safeUnits;
    const tempOk = doesTemperatureSupportSatisfy(cfg.temperatureSupport, requiredTemperature);
    if (capOk && tempOk) {
      const tempTextAr =
        requiredTemperature === 'frozen'
          ? 'مع تبريد مجمد'
          : requiredTemperature === 'chilled'
          ? 'مع تبريد مبرد'
          : 'تبريد عادي/جاف';
      const tempTextEn =
        requiredTemperature === 'frozen'
          ? 'frozen cold-chain'
          : requiredTemperature === 'chilled'
          ? 'chilled transport'
          : 'ambient/dry transport';
      return {
        vehicleClass: cls,
        exceedsStandardCapacity: false,
        selectionReasonAr: `مناسبة لحمولة ${safeUnits} وحدة (${tempTextAr}) بسعة حتى ${cfg.capacityUnits} وحدة`,
        selectionReasonEn: `Fits ${safeUnits} units (${tempTextEn}) up to ${cfg.capacityUnits} units capacity`
      };
    }
  }

  // Fallback if cold-chain or very high unit count exceeds normal classes
  if (requiredTemperature === 'frozen' || requiredTemperature === 'chilled') {
    const refCfg = defaultsByClass.get('refrigerated_truck');
    return {
      vehicleClass: 'refrigerated_truck',
      exceedsStandardCapacity: !refCfg || refCfg.capacityUnits < safeUnits,
      selectionReasonAr:
        refCfg && refCfg.capacityUnits >= safeUnits
          ? `تم اختيار شاحنة مبردة لتلبية متطلبات سلسلة التبريد`
          : `طلب يتطلب سلسلة تبريد (${safeUnits} وحدة) — أعلى فئة مبردة متاحة`,
      selectionReasonEn: `Refrigerated truck selected for cold-chain requirement (${safeUnits} units)`
    };
  }

  return {
    vehicleClass: 'medium_truck',
    exceedsStandardCapacity: true,
    selectionReasonAr: `حمولة كبيرة (${safeUnits} وحدة) تتجاوز سعة الشاحنة الصغيرة — أعلى فئة قياسية`,
    selectionReasonEn: `High load (${safeUnits} units) assigned to largest standard truck class`
  };
}

export interface DeliveryFeeCalculationInput {
  zone: {
    governorateId: string;
    deliveryZoneId?: string;
  };
  units: number;
  requiredTemperature: VehicleTemperatureType;
  orderValueIQD: number;
  rules: DeliveryRateRule[];
  settings: DeliveryPlatformSettings;
  supplierFreeThresholdIQD?: number;
}

export interface DeliveryFeeBreakdown {
  matchedRuleId: string;
  matchedRuleNameAr: string;
  matchedRuleNameEn: string;
  matchedScopeLevel: 'zone' | 'governorate' | 'default';
  selectedVehicleClass: DeliveryVehicleClass;
  selectionReasonAr: string;
  selectionReasonEn: string;
  exceedsStandardCapacity: boolean;
  units: number;
  requiredTemperature: VehicleTemperatureType;
  baseFeeIQD: number;
  perUnitFeeIQD: number;
  unitsFeeIQD: number;
  calculatedBeforeMinIQD: number;
  minFeeIQD: number;
  appliedMinFloor: boolean;
  refrigeratedSurchargeIQD: number;
  rawTotalFeeIQD: number;
  freeThresholdAppliedIQD: number;
  isFreeDelivery: boolean;
  platformSubsidyIQD: number;
  merchantFeeIQD: number;
}

export interface DeliveryFeeCalculationResult {
  feeIQD: number;
  isFreeDelivery: boolean;
  platformSubsidyIQD: number;
  vehicleClass: DeliveryVehicleClass;
  breakdown: DeliveryFeeBreakdown;
}

export function findBestMatchingRateRule(
  rules: DeliveryRateRule[],
  vehicleClass: DeliveryVehicleClass,
  governorateId: string,
  deliveryZoneId?: string
): { rule: DeliveryRateRule; scopeLevel: 'zone' | 'governorate' | 'default' } | null {
  const activeForClass = (rules || []).filter(
    (r) => r.isActive && r.vehicleClass === vehicleClass
  );
  if (activeForClass.length === 0) return null;

  if (deliveryZoneId) {
    const zoneMatch = activeForClass.find(
      (r) => r.scope?.deliveryZoneId === deliveryZoneId
    );
    if (zoneMatch) return { rule: zoneMatch, scopeLevel: 'zone' };
  }

  if (governorateId) {
    const govMatch = activeForClass.find(
      (r) =>
        r.scope?.governorateId === governorateId &&
        !r.scope?.deliveryZoneId
    );
    if (govMatch) return { rule: govMatch, scopeLevel: 'governorate' };
  }

  const globalMatch = activeForClass.find(
    (r) => !r.scope?.governorateId && !r.scope?.deliveryZoneId
  );
  if (globalMatch) return { rule: globalMatch, scopeLevel: 'default' };

  return null;
}

export function calculateDeliveryFee(
  input: DeliveryFeeCalculationInput
): DeliveryFeeCalculationResult | null {
  const units = Math.max(1, Math.round(Number(input.units) || 1));
  const orderValueIQD = Math.max(0, Math.round(Number(input.orderValueIQD) || 0));
  const picked = pickVehicleClass(units, input.requiredTemperature, input.settings);

  const matched = findBestMatchingRateRule(
    input.rules,
    picked.vehicleClass,
    input.zone.governorateId,
    input.zone.deliveryZoneId
  );

  if (!matched) {
    return null;
  }

  const { rule, scopeLevel } = matched;
  const unitsFeeIQD = Math.round(rule.perUnitFeeIQD * units);
  const calculatedBeforeMinIQD = Math.round(rule.baseFeeIQD + unitsFeeIQD);
  const appliedMinFloor = calculatedBeforeMinIQD < rule.minFeeIQD;
  const baseWithMinIQD = Math.max(rule.minFeeIQD, calculatedBeforeMinIQD);
  const refrigeratedSurchargeIQD =
    input.requiredTemperature === 'chilled' || input.requiredTemperature === 'frozen'
      ? Math.round(rule.refrigeratedSurchargeIQD || 0)
      : 0;
  const rawTotalFeeIQD = Math.round(baseWithMinIQD + refrigeratedSurchargeIQD);

  const thresholdCandidate =
    input.supplierFreeThresholdIQD !== undefined && input.supplierFreeThresholdIQD !== null
      ? Number(input.supplierFreeThresholdIQD)
      : Number(input.settings.freeDeliveryThresholdIQD || 0);
  const freeThresholdAppliedIQD = Math.max(0, Math.round(thresholdCandidate));

  const isFreeDelivery = freeThresholdAppliedIQD > 0 && orderValueIQD >= freeThresholdAppliedIQD;
  const merchantFeeIQD = isFreeDelivery ? 0 : rawTotalFeeIQD;
  const platformSubsidyIQD = isFreeDelivery ? rawTotalFeeIQD : 0;

  return {
    feeIQD: merchantFeeIQD,
    isFreeDelivery,
    platformSubsidyIQD,
    vehicleClass: picked.vehicleClass,
    breakdown: {
      matchedRuleId: rule.id,
      matchedRuleNameAr: rule.nameAr,
      matchedRuleNameEn: rule.nameEn,
      matchedScopeLevel: scopeLevel,
      selectedVehicleClass: picked.vehicleClass,
      selectionReasonAr: picked.selectionReasonAr,
      selectionReasonEn: picked.selectionReasonEn,
      exceedsStandardCapacity: picked.exceedsStandardCapacity,
      units,
      requiredTemperature: input.requiredTemperature,
      baseFeeIQD: Math.round(rule.baseFeeIQD),
      perUnitFeeIQD: Math.round(rule.perUnitFeeIQD),
      unitsFeeIQD,
      calculatedBeforeMinIQD,
      minFeeIQD: Math.round(rule.minFeeIQD),
      appliedMinFloor,
      refrigeratedSurchargeIQD,
      rawTotalFeeIQD,
      freeThresholdAppliedIQD,
      isFreeDelivery,
      platformSubsidyIQD,
      merchantFeeIQD
    }
  };
}

export interface EvaluatedDeliveryOption {
  option: DeliveryOptionCode;
  labelAr: string;
  labelEn: string;
  available: boolean;
  unavailableReasonAr?: string;
  unavailableReasonEn?: string;
  feeIQD: number;
  quote?: DeliveryFeeCalculationResult | null;
}

export interface DeliveryOptionsEvaluationResult {
  availableOptions: DeliveryOptionCode[];
  options: EvaluatedDeliveryOption[];
  platformQuote: DeliveryFeeCalculationResult | null;
}

export function getDeliveryOptionsForSupplier(params: {
  supplier: {
    id: string;
    serviceZoneIds: string[];
    deliverySettings?: SupplierDeliverySettings;
  };
  zone: {
    governorateId: string;
    deliveryZoneId: string;
  };
  units: number;
  requiredTemperature: VehicleTemperatureType;
  orderValueIQD: number;
  rules: DeliveryRateRule[];
  settings: DeliveryPlatformSettings;
  hasActivePlatformCoverage?: boolean;
}): DeliveryOptionsEvaluationResult {
  const ds: SupplierDeliverySettings = params.supplier.deliverySettings || {
    hasOwnFleet: true,
    allowPlatformDelivery: false,
    allowStorePickup: true
  };

  const supplierCoversZone = (params.supplier.serviceZoneIds || []).includes(
    params.zone.deliveryZoneId
  );

  const ownFleetAvailable = Boolean(ds.hasOwnFleet) && supplierCoversZone;
  const platformFeeResult = calculateDeliveryFee({
    zone: params.zone,
    units: params.units,
    requiredTemperature: params.requiredTemperature,
    orderValueIQD: params.orderValueIQD,
    rules: params.rules,
    settings: params.settings,
    supplierFreeThresholdIQD: ds.freeDeliveryThresholdIQD
  });

  const coverageOk = params.hasActivePlatformCoverage !== false;
  const platformAvailable =
    Boolean(ds.allowPlatformDelivery) && coverageOk && platformFeeResult !== null;

  const pickupAvailable = Boolean(ds.allowStorePickup);

  const options: EvaluatedDeliveryOption[] = [
    {
      option: 'supplier_fleet',
      labelAr: 'توصيل بأسطول المورد',
      labelEn: 'Supplier Own Fleet',
      available: ownFleetAvailable,
      unavailableReasonAr: !ds.hasOwnFleet
        ? 'المورد لا يمتلك أسطول توصيل خاص'
        : !supplierCoversZone
        ? 'أسطول المورد لا يغطي منطقة التوصيل المختارة'
        : undefined,
      unavailableReasonEn: !ds.hasOwnFleet
        ? 'Supplier does not operate an own delivery fleet'
        : !supplierCoversZone
        ? 'Supplier fleet does not cover the selected delivery zone'
        : undefined,
      feeIQD: 0
    },
    {
      option: 'platform',
      labelAr: 'توصيل شبكة المنصة',
      labelEn: 'Platform Delivery Network',
      available: platformAvailable,
      unavailableReasonAr: !ds.allowPlatformDelivery
        ? 'المورد لم يفعّل خيار التوصيل عبر شبكة المنصة'
        : !coverageOk
        ? 'لا توجد تغطية فعالة من شبكة المنصة لهذه المنطقة حالياً'
        : platformFeeResult === null
        ? 'لا توجد قاعدة تسعير فعالة لهذه الفئة والمنطقة'
        : undefined,
      unavailableReasonEn: !ds.allowPlatformDelivery
        ? 'Supplier has not enabled Platform Delivery Network'
        : !coverageOk
        ? 'No active platform delivery coverage in this zone'
        : platformFeeResult === null
        ? 'No active rate rule matched this zone and vehicle class'
        : undefined,
      feeIQD: platformFeeResult ? platformFeeResult.feeIQD : 0,
      quote: platformFeeResult
    },
    {
      option: 'pickup',
      labelAr: 'الاستلام من مستودع المورد',
      labelEn: 'Store Pickup from Supplier Warehouse',
      available: pickupAvailable,
      unavailableReasonAr: !ds.allowStorePickup
        ? 'المورد لا يتيح الاستلام المباشر من المستودع'
        : undefined,
      unavailableReasonEn: !ds.allowStorePickup
        ? 'Direct warehouse pickup is disabled by this supplier'
        : undefined,
      feeIQD: 0
    }
  ];

  return {
    availableOptions: options.filter((o) => o.available).map((o) => o.option),
    options,
    platformQuote: platformFeeResult
  };
}
