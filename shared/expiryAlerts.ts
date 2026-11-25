export type ExpiryThresholdMode = 'month' | 'custom';

export type ExpiryUrgency = 'expired' | 'critical' | 'warning' | 'upcoming' | 'safe';

export interface ExpiryEvaluation {
  expiryDate: string;
  cutoffDate: string;
  referenceDate: string;
  daysRemaining: number;
  isExpired: boolean;
  isWithinThreshold: boolean;
  urgency: ExpiryUrgency;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function getTodayIsoDate(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isValidIsoDate(dateStr: unknown): dateStr is string {
  if (typeof dateStr !== 'string' || !ISO_DATE_RE.test(dateStr.trim())) {
    return false;
  }
  const [y, m, d] = dateStr.trim().split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const year = dt.getUTCFullYear();
  const month = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dt.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function diffDaysIso(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split('-').map(Number);
  const [ty, tm, td] = toIso.split('-').map(Number);
  const fromUtc = Date.UTC(fy, fm - 1, fd);
  const toUtc = Date.UTC(ty, tm - 1, td);
  return Math.round((toUtc - fromUtc) / (24 * 60 * 60 * 1000));
}

export function resolveExpiryCutoffDate(options?: {
  mode?: ExpiryThresholdMode;
  targetDate?: string;
  referenceDate?: string;
}): { mode: ExpiryThresholdMode; referenceDate: string; cutoffDate: string } {
  const referenceDate = isValidIsoDate(options?.referenceDate)
    ? options!.referenceDate!
    : getTodayIsoDate();

  const mode: ExpiryThresholdMode = options?.mode === 'custom' ? 'custom' : 'month';

  if (mode === 'custom' && isValidIsoDate(options?.targetDate)) {
    return {
      mode,
      referenceDate,
      cutoffDate: options!.targetDate.trim()
    };
  }

  return {
    mode: 'month',
    referenceDate,
    cutoffDate: addDaysToIsoDate(referenceDate, 30)
  };
}

export function evaluateExpiryStatus(
  expiryDate?: string,
  options?: {
    mode?: ExpiryThresholdMode;
    targetDate?: string;
    referenceDate?: string;
  }
): ExpiryEvaluation | null {
  if (!isValidIsoDate(expiryDate)) return null;

  const { referenceDate, cutoffDate } = resolveExpiryCutoffDate(options);
  const cleanExpiry = expiryDate.trim();
  const daysRemaining = diffDaysIso(referenceDate, cleanExpiry);
  const isExpired = daysRemaining < 0;
  const isWithinThreshold = cleanExpiry <= cutoffDate;

  let urgency: ExpiryUrgency = 'safe';
  if (isExpired) {
    urgency = 'expired';
  } else if (daysRemaining <= 14) {
    urgency = 'critical';
  } else if (daysRemaining <= 31) {
    urgency = 'warning';
  } else if (isWithinThreshold) {
    urgency = 'upcoming';
  }

  return {
    expiryDate: cleanExpiry,
    cutoffDate,
    referenceDate,
    daysRemaining,
    isExpired,
    isWithinThreshold,
    urgency
  };
}
