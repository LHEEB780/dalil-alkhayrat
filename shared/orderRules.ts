export interface SupplierOrderRules {
  minOrderValueIQD?: number;
  minTotalQuantity?: number;
  minCartons?: number;
  minSkuCount?: number;
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

export function isCartonUnit(unit?: string): boolean {
  if (!unit) return false;
  return /(كرتون|كراتين|carton|ctn)/i.test(unit);
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
