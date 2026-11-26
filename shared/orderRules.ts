export interface SupplierOrderRules {
  minOrderValueIQD?: number;
  minTotalQuantity?: number;
  minCartons?: number;
  minSkuCount?: number;
  enforceOfferMinQuantity?: boolean;
}

export interface SupplierOrderRuleItem {
  barcode: string;
  quantity: number;
  unitPriceIQD: number;
  unit?: string;
  packageQuantity?: number;
}

export type OrderRuleType =
  | 'minOrderValueIQD'
  | 'minTotalQuantity'
  | 'minCartons'
  | 'minSkuCount';

export interface FailedSupplierOrderRule {
  rule: OrderRuleType;
  current: number;
  required: number;
  missing: number;
}

export interface SupplierOrderValidationResult {
  isValid: boolean;
  totals: {
    valueIQD: number;
    totalQuantity: number;
    cartons: number;
    skuCount: number;
  };
  failedRules: FailedSupplierOrderRule[];
}

export interface OrderRuleSummaryItem {
  rule: OrderRuleType;
  value: number;
}

export interface OrderRulesSummary {
  rules: OrderRuleSummaryItem[];
  minOrderValueIQD: number;
}

export function isCartonUnit(unit?: string): boolean {
  if (!unit) return false;
  return /(كرتون|كراتين|carton|ctn)/i.test(unit);
}

export function isOfferMinQuantityEnforced(orderRules?: SupplierOrderRules): boolean {
  return orderRules?.enforceOfferMinQuantity === true;
}

export function getInitialOfferQuantity(
  minOrderQuantity?: number,
  orderRules?: SupplierOrderRules
): number {
  if (
    isOfferMinQuantityEnforced(orderRules) &&
    typeof minOrderQuantity === 'number' &&
    minOrderQuantity > 0
  ) {
    return minOrderQuantity;
  }
  return 1;
}

export function getEffectiveOrderRules(
  orderRules?: SupplierOrderRules,
  legacyMinOrderIQD?: number
): SupplierOrderRules | undefined {
  const hasValueRule =
    typeof orderRules?.minOrderValueIQD === 'number' && orderRules.minOrderValueIQD > 0;
  const hasOtherRules =
    (typeof orderRules?.minTotalQuantity === 'number' && orderRules.minTotalQuantity > 0) ||
    (typeof orderRules?.minCartons === 'number' && orderRules.minCartons > 0) ||
    (typeof orderRules?.minSkuCount === 'number' && orderRules.minSkuCount > 0) ||
    Boolean(orderRules?.enforceOfferMinQuantity);

  if (hasValueRule || hasOtherRules) {
    return orderRules;
  }
  if (typeof legacyMinOrderIQD === 'number' && legacyMinOrderIQD > 0) {
    return { minOrderValueIQD: legacyMinOrderIQD };
  }
  return orderRules;
}

/**
 * Single source of truth for displaying and sorting active supplier order rules.
 * Falls back to legacyMinOrderIQD as a minOrderValueIQD rule if orderRules is absent.
 */
export function getOrderRulesSummary(
  orderRules?: SupplierOrderRules,
  legacyMinOrderIQD?: number
): OrderRulesSummary {
  const effective = getEffectiveOrderRules(orderRules, legacyMinOrderIQD);
  const rules: OrderRuleSummaryItem[] = [];

  if (typeof effective?.minOrderValueIQD === 'number' && effective.minOrderValueIQD > 0) {
    rules.push({ rule: 'minOrderValueIQD', value: effective.minOrderValueIQD });
  }
  if (typeof effective?.minTotalQuantity === 'number' && effective.minTotalQuantity > 0) {
    rules.push({ rule: 'minTotalQuantity', value: effective.minTotalQuantity });
  }
  if (typeof effective?.minCartons === 'number' && effective.minCartons > 0) {
    rules.push({ rule: 'minCartons', value: effective.minCartons });
  }
  if (typeof effective?.minSkuCount === 'number' && effective.minSkuCount > 0) {
    rules.push({ rule: 'minSkuCount', value: effective.minSkuCount });
  }

  const minOrderValueIQD =
    typeof effective?.minOrderValueIQD === 'number' && effective.minOrderValueIQD > 0
      ? effective.minOrderValueIQD
      : 0;

  return {
    rules,
    minOrderValueIQD
  };
}

/**
 * Shared validation function for a single supplier's cart lines against their orderRules.
 * Used identically by both the backend API and the CartDrawer UI.
 */
export function validateSupplierOrderRules(
  items: SupplierOrderRuleItem[],
  orderRules?: SupplierOrderRules
): SupplierOrderValidationResult {
  let valueIQD = 0;
  let totalQuantity = 0;
  let cartons = 0;
  const distinctBarcodes = new Set<string>();

  for (const item of items) {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPriceIQD) || 0;
    if (qty <= 0) continue;

    valueIQD += price * qty;
    totalQuantity += qty;
    if (isCartonUnit(item.unit)) {
      cartons += qty;
    }
    if (item.barcode) {
      distinctBarcodes.add(item.barcode);
    }
  }

  const skuCount = distinctBarcodes.size;
  const totals = {
    valueIQD,
    totalQuantity,
    cartons,
    skuCount
  };

  if (!orderRules) {
    return {
      isValid: true,
      totals,
      failedRules: []
    };
  }

  const failedRules: FailedSupplierOrderRule[] = [];

  if (
    typeof orderRules.minOrderValueIQD === 'number' &&
    orderRules.minOrderValueIQD > 0 &&
    valueIQD < orderRules.minOrderValueIQD
  ) {
    failedRules.push({
      rule: 'minOrderValueIQD',
      current: valueIQD,
      required: orderRules.minOrderValueIQD,
      missing: orderRules.minOrderValueIQD - valueIQD
    });
  }

  if (
    typeof orderRules.minTotalQuantity === 'number' &&
    orderRules.minTotalQuantity > 0 &&
    totalQuantity < orderRules.minTotalQuantity
  ) {
    failedRules.push({
      rule: 'minTotalQuantity',
      current: totalQuantity,
      required: orderRules.minTotalQuantity,
      missing: orderRules.minTotalQuantity - totalQuantity
    });
  }

  if (
    typeof orderRules.minCartons === 'number' &&
    orderRules.minCartons > 0 &&
    cartons < orderRules.minCartons
  ) {
    failedRules.push({
      rule: 'minCartons',
      current: cartons,
      required: orderRules.minCartons,
      missing: orderRules.minCartons - cartons
    });
  }

  if (
    typeof orderRules.minSkuCount === 'number' &&
    orderRules.minSkuCount > 0 &&
    skuCount < orderRules.minSkuCount
  ) {
    failedRules.push({
      rule: 'minSkuCount',
      current: skuCount,
      required: orderRules.minSkuCount,
      missing: orderRules.minSkuCount - skuCount
    });
  }

  return {
    isValid: failedRules.length === 0,
    totals,
    failedRules
  };
}
