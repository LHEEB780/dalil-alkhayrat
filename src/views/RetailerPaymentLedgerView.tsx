import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  Bell,
  BellRing,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  RotateCcw,
  Search,
  Send,
  SlidersHorizontal,
  TrendingUp,
  X
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  CreditAccountItem,
  Currency,
  Language,
  LedgerEntryItem,
  OrderItem
} from '../types/index.ts';
import { formatCurrency } from '../utils/format.ts';
import { getLocalizedText } from '../utils/translations.ts';

type LedgerFilterTab = 'all' | 'cash' | 'credit' | 'payments';

interface RetailerPaymentLedgerViewProps {
  creditAccounts: CreditAccountItem[];
  orders: OrderItem[];
  currency: Currency;
  language: Language;
  storeName: string;
  onBack: () => void;
  onOpenSupplierStatement?: (creditAccountId: string) => void;
}

interface UnifiedTransactionRow {
  id: string;
  date: string;
  dueDate?: string;
  paymentDate?: string;
  supplierId: string;
  supplierName: string;
  creditAccountId?: string;
  channel: 'cash' | 'credit' | 'payment' | 'adjustment';
  paymentMethodLabelAr: string;
  paymentMethodLabelEn: string;
  referenceId: string;
  descriptionAr: string;
  descriptionEn: string;
  debitIQD: number;
  creditIQD: number;
  runningBalanceIQD?: number;
  statusLabelAr: string;
  statusLabelEn: string;
  isOverdue?: boolean;
}

const REMINDER_PREFS_KEY = 'dalil_payment_reminder_prefs_v1';

interface PaymentReminderPrefs {
  enabled: boolean;
  leadDays: 3 | 7 | 14;
  channels: {
    inApp: boolean;
    whatsapp: boolean;
    sms: boolean;
  };
  dismissedIds: string[];
}

interface PaymentReminderItem {
  id: string;
  severity: 'overdue' | 'due_soon' | 'limit_warning';
  supplierId: string;
  supplierName: string;
  creditAccountId?: string;
  referenceId: string;
  dueDate?: string;
  daysUntilDue?: number;
  amountIQD: number;
  utilizationPct?: number;
}

interface InstantCreditAlertNotice {
  id: string;
  sentAt: string;
  highestPct: number;
  isOverLimit: boolean;
  supplierNames: string[];
  primaryCreditAccountId?: string;
}

const INSTANT_LIMIT_NOTIF_STORAGE_KEY = 'dalil_instant_limit_notif_sig_v1';

const DEFAULT_REMINDER_PREFS: PaymentReminderPrefs = {
  enabled: true,
  leadDays: 7,
  channels: { inApp: true, whatsapp: true, sms: false },
  dismissedIds: []
};

export const RetailerPaymentLedgerView: React.FC<RetailerPaymentLedgerViewProps> = ({
  creditAccounts,
  orders,
  currency,
  language,
  storeName,
  onBack,
  onOpenSupplierStatement
}) => {
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<LedgerFilterTab>('all');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [allLedgerEntries, setAllLedgerEntries] = useState<LedgerEntryItem[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  // Automated payment reminders preferences (persisted)
  const [reminderPrefs, setReminderPrefs] = useState<PaymentReminderPrefs>(() => {
    try {
      const raw = localStorage.getItem(REMINDER_PREFS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
          leadDays: parsed.leadDays === 3 || parsed.leadDays === 7 || parsed.leadDays === 14 ? parsed.leadDays : 7,
          channels: {
            inApp: parsed.channels?.inApp ?? true,
            whatsapp: parsed.channels?.whatsapp ?? true,
            sms: parsed.channels?.sms ?? false
          },
          dismissedIds: Array.isArray(parsed.dismissedIds) ? parsed.dismissedIds : []
        };
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_REMINDER_PREFS;
  });
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [reminderToast, setReminderToast] = useState<string | null>(null);
  const [instantInAppAlert, setInstantInAppAlert] = useState<InstantCreditAlertNotice | null>(null);
  const [topAlertCollapsed, setTopAlertCollapsed] = useState(false);
  const notifiedThresholdKeyRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(REMINDER_PREFS_KEY, JSON.stringify(reminderPrefs));
    } catch {
      // ignore storage errors
    }
  }, [reminderPrefs]);

  // Fetch ledger entries for all supplier credit accounts
  useEffect(() => {
    if (creditAccounts.length === 0) {
      setAllLedgerEntries([]);
      return;
    }

    let active = true;
    setLoadingEntries(true);

    Promise.all(
      creditAccounts.map((acc) =>
        fetch(`/api/credit/ledger/${acc.id}`)
          .then((res) => res.json())
          .then((data) => (data.success && Array.isArray(data.data) ? (data.data as LedgerEntryItem[]) : []))
          .catch(() => [] as LedgerEntryItem[])
      )
    )
      .then((results) => {
        if (!active) return;
        setAllLedgerEntries(results.flat());
      })
      .finally(() => {
        if (active) setLoadingEntries(false);
      });

    return () => {
      active = false;
    };
  }, [creditAccounts]);

  const accountById = useMemo(() => {
    const map: Record<string, CreditAccountItem> = {};
    for (const acc of creditAccounts) {
      map[acc.id] = acc;
    }
    return map;
  }, [creditAccounts]);

  const accountBySupplierId = useMemo(() => {
    const map: Record<string, CreditAccountItem> = {};
    for (const acc of creditAccounts) {
      map[acc.supplierId] = acc;
    }
    return map;
  }, [creditAccounts]);

  // Unique suppliers across both credit accounts and cash orders
  const supplierOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const acc of creditAccounts) {
      map.set(acc.supplierId, acc.supplierName || acc.supplierId);
    }
    for (const ord of orders) {
      if (!map.has(ord.supplierId)) {
        map.set(ord.supplierId, ord.supplierName || ord.supplierId);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [creditAccounts, orders]);

  // Build unified financial rows separating Cash Orders, Credit Invoices, and Repayments
  const unifiedRows = useMemo<UnifiedTransactionRow[]>(() => {
    const rows: UnifiedTransactionRow[] = [];
    const nowMs = Date.now();

    // 1. Ledger entries (Credit invoices, Repayments, Returns/Reversals)
    for (const entry of allLedgerEntries) {
      const acc = accountById[entry.creditAccountId] || accountBySupplierId[entry.supplierId];
      const supplierName = acc?.supplierName || entry.supplierId;

      if (entry.referenceType === 'PAYMENT') {
        rows.push({
          id: `ledger-${entry.id}`,
          date: entry.entryDate,
          paymentDate: entry.entryDate,
          supplierId: entry.supplierId,
          supplierName,
          creditAccountId: entry.creditAccountId,
          channel: 'payment',
          paymentMethodLabelAr: 'سداد دفعة آجل',
          paymentMethodLabelEn: 'Credit Repayment',
          referenceId: entry.referenceId,
          descriptionAr: entry.descriptionAr,
          descriptionEn: `Payment received · ${entry.referenceId}`,
          debitIQD: 0,
          creditIQD: entry.creditIQD,
          runningBalanceIQD: entry.runningBalanceIQD,
          statusLabelAr: 'تم السداد',
          statusLabelEn: 'Settled'
        });
      } else if (entry.referenceType === 'INVOICE' || entry.referenceType === 'OPENING_BALANCE') {
        const isOverdue =
          Boolean(entry.dueDate) &&
          !entry.isReversed &&
          new Date(entry.dueDate!).getTime() < nowMs &&
          (acc?.currentUsedCreditIQD ?? 0) > 0;

        rows.push({
          id: `ledger-${entry.id}`,
          date: entry.entryDate,
          dueDate: entry.dueDate,
          supplierId: entry.supplierId,
          supplierName,
          creditAccountId: entry.creditAccountId,
          channel: 'credit',
          paymentMethodLabelAr: 'فاتورة آجل',
          paymentMethodLabelEn: 'Credit Invoice',
          referenceId: entry.referenceId,
          descriptionAr: entry.descriptionAr,
          descriptionEn: `Credit invoice · ${entry.referenceId}`,
          debitIQD: entry.debitIQD,
          creditIQD: entry.creditIQD,
          runningBalanceIQD: entry.runningBalanceIQD,
          statusLabelAr: isOverdue ? 'مستحقة السداد' : 'قيد الآجل',
          statusLabelEn: isOverdue ? 'Due / Overdue' : 'Open Credit',
          isOverdue
        });
      } else {
        rows.push({
          id: `ledger-${entry.id}`,
          date: entry.entryDate,
          paymentDate: entry.creditIQD > 0 ? entry.entryDate : undefined,
          supplierId: entry.supplierId,
          supplierName,
          creditAccountId: entry.creditAccountId,
          channel: 'adjustment',
          paymentMethodLabelAr:
            entry.referenceType === 'RETURN_CREDIT' ? 'إشعار مرتجع' : 'قيد تسوية / عكسي',
          paymentMethodLabelEn:
            entry.referenceType === 'RETURN_CREDIT' ? 'Return Credit' : 'Reversal / Adjustment',
          referenceId: entry.referenceId,
          descriptionAr: entry.descriptionAr,
          descriptionEn: entry.descriptionAr,
          debitIQD: entry.debitIQD,
          creditIQD: entry.creditIQD,
          runningBalanceIQD: entry.runningBalanceIQD,
          statusLabelAr: 'معتمد محاسبياً',
          statusLabelEn: 'Posted'
        });
      }
    }

    // 2. Cash / Wallet / Online Orders (Strictly separated from credit invoices)
    for (const ord of orders) {
      if (ord.paymentMethod === 'credit' || ord.status === 'cancelled') continue;
      const acc = accountBySupplierId[ord.supplierId];
      const methodAr =
        ord.paymentMethod === 'wallet'
          ? 'نقدي (المحفظة)'
          : ord.paymentMethod === 'online'
          ? 'دفع إلكتروني'
          : 'نقدي عند التسليم';
      const methodEn =
        ord.paymentMethod === 'wallet'
          ? 'Cash (Wallet)'
          : ord.paymentMethod === 'online'
          ? 'Online Paid'
          : 'Cash on Delivery';

      rows.push({
        id: `cash-order-${ord.id}`,
        date: ord.createdAt,
        paymentDate: ord.createdAt,
        supplierId: ord.supplierId,
        supplierName: ord.supplierName,
        creditAccountId: acc?.id,
        channel: 'cash',
        paymentMethodLabelAr: methodAr,
        paymentMethodLabelEn: methodEn,
        referenceId: ord.id,
        descriptionAr: `فاتورة نقدية (${ord.items.length} أصناف) · ${methodAr}`,
        descriptionEn: `Cash order (${ord.items.length} items) · ${methodEn}`,
        debitIQD: ord.subtotalIQD,
        creditIQD: ord.subtotalIQD,
        statusLabelAr: ord.status === 'delivered' ? 'مدفوعة ومستلمة' : 'مدفوعة نقداً',
        statusLabelEn: ord.status === 'delivered' ? 'Paid & Delivered' : 'Cash Paid'
      });
    }

    rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return rows;
  }, [allLedgerEntries, orders, accountById, accountBySupplierId]);

  // Scoped rows by selected supplier
  const supplierScopedRows = useMemo(() => {
    if (selectedSupplierId === 'all') return unifiedRows;
    return unifiedRows.filter((r) => r.supplierId === selectedSupplierId);
  }, [unifiedRows, selectedSupplierId]);

  // Financial KPIs computed from real scoped data
  const summary = useMemo(() => {
    const cashRows = supplierScopedRows.filter((r) => r.channel === 'cash');
    const creditRows = supplierScopedRows.filter((r) => r.channel === 'credit');
    const paymentRows = supplierScopedRows.filter((r) => r.channel === 'payment');

    const totalCashIQD = cashRows.reduce((s, r) => s + r.debitIQD, 0);
    const totalCreditBilledIQD = creditRows.reduce((s, r) => s + r.debitIQD, 0);
    const totalPaidIQD = paymentRows.reduce((s, r) => s + r.creditIQD, 0);

    const relevantAccounts =
      selectedSupplierId === 'all'
        ? creditAccounts
        : creditAccounts.filter((a) => a.supplierId === selectedSupplierId);

    const currentPayableIQD = relevantAccounts.reduce((s, a) => s + a.currentUsedCreditIQD, 0);
    const totalCreditLimitIQD = relevantAccounts.reduce((s, a) => s + a.creditLimitIQD, 0);

    const lastPaymentDate =
      paymentRows[0]?.paymentDate ||
      relevantAccounts
        .map((a) => a.lastPaymentDate)
        .filter((d): d is string => Boolean(d))
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ||
      null;

    return {
      totalCashIQD,
      cashCount: cashRows.length,
      totalCreditBilledIQD,
      creditCount: creditRows.length,
      totalPaidIQD,
      paymentsCount: paymentRows.length,
      currentPayableIQD,
      totalCreditLimitIQD,
      lastPaymentDate
    };
  }, [supplierScopedRows, creditAccounts, selectedSupplierId]);

  // 6-Month Outstanding Debt Balance Trend (for Recharts LineChart)
  const balanceTrendData = useMemo(() => {
    const relevantAccounts =
      selectedSupplierId === 'all'
        ? creditAccounts
        : creditAccounts.filter((a) => a.supplierId === selectedSupplierId);

    const relevantAccountIds = new Set(relevantAccounts.map((a) => a.id));
    const scopedEntries = allLedgerEntries
      .filter((e) => relevantAccountIds.has(e.creditAccountId))
      .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

    const totalLimitIQD = relevantAccounts.reduce((s, a) => s + a.creditLimitIQD, 0);
    const currentTotalDebtIQD = relevantAccounts.reduce((s, a) => s + a.currentUsedCreditIQD, 0);

    // Anchor to the latest ledger entry date or current date so the 6-month window always reflects active history
    const latestEntryTime =
      scopedEntries.length > 0
        ? Math.max(...scopedEntries.map((e) => new Date(e.entryDate).getTime()).filter((t) => !Number.isNaN(t)))
        : Date.now();
    const anchorDate = new Date(Math.max(latestEntryTime, Date.now()));

    const months: Array<{
      monthKey: string;
      label: string;
      balanceIQD: number;
      creditLimitIQD: number;
    }> = [];

    for (let offset = 5; offset >= 0; offset--) {
      const monthDate = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - offset, 1);
      const monthEndMs = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
      const label = monthDate.toLocaleDateString(isAr ? 'ar-IQ' : 'en-US', {
        month: 'short',
        year: '2-digit'
      });

      let monthTotalBalance = 0;

      if (offset === 0) {
        monthTotalBalance = currentTotalDebtIQD;
      } else {
        for (const acc of relevantAccounts) {
          const accEntries = scopedEntries.filter((e) => e.creditAccountId === acc.id);
          const entriesUpToMonth = accEntries.filter(
            (e) => new Date(e.entryDate).getTime() <= monthEndMs
          );

          if (entriesUpToMonth.length > 0) {
            monthTotalBalance += entriesUpToMonth[entriesUpToMonth.length - 1].runningBalanceIQD;
          } else if (acc.currentUsedCreditIQD > 0) {
            // Reconstruct prior balance from aging buckets when ledger entries start more recently
            const agingBase =
              offset >= 3
                ? acc.aging.bucket90Plus + Math.round(acc.aging.bucket61_90 * 0.6)
                : offset === 2
                ? acc.aging.bucket90Plus + acc.aging.bucket61_90 + Math.round(acc.aging.bucket31_60 * 0.5)
                : acc.aging.bucket90Plus + acc.aging.bucket61_90 + acc.aging.bucket31_60 + Math.round(acc.aging.bucket0_30 * 0.55);
            monthTotalBalance += Math.max(0, agingBase);
          }
        }
      }

      months.push({
        monthKey: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
        label,
        balanceIQD: Math.round(monthTotalBalance),
        creditLimitIQD: Math.round(totalLimitIQD)
      });
    }

    return months;
  }, [creditAccounts, allLedgerEntries, selectedSupplierId, isAr]);

  const formatYAxisTick = (val: number) => {
    if (currency === 'USD') {
      const usd = Math.round(val / 1530);
      if (usd >= 1000) return `$${(usd / 1000).toFixed(1)}k`;
      return `$${usd}`;
    }
    if (val >= 1_000_000) {
      return isAr ? `${(val / 1_000_000).toFixed(1)}م` : `${(val / 1_000_000).toFixed(1)}M`;
    }
    if (val >= 1_000) {
      return isAr ? `${Math.round(val / 1_000)}ألف` : `${Math.round(val / 1_000)}k`;
    }
    return String(val);
  };

  const creditUtilizationPct =
    summary.totalCreditLimitIQD > 0
      ? Math.min(100, Math.round((summary.currentPayableIQD / summary.totalCreditLimitIQD) * 100))
      : 0;

  // Apply tab + search filter
  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return supplierScopedRows.filter((row) => {
      if (activeTab === 'cash' && row.channel !== 'cash') return false;
      if (activeTab === 'credit' && row.channel !== 'credit' && row.channel !== 'adjustment') return false;
      if (activeTab === 'payments' && row.channel !== 'payment') return false;
      if (!q) return true;
      return (
        row.referenceId.toLowerCase().includes(q) ||
        row.supplierName.toLowerCase().includes(q) ||
        row.descriptionAr.toLowerCase().includes(q) ||
        row.descriptionEn.toLowerCase().includes(q)
      );
    });
  }, [supplierScopedRows, activeTab, searchQuery]);

  // Automated Payment Reminders Engine (overdue, approaching due dates, high credit utilization)
  const paymentReminders = useMemo<PaymentReminderItem[]>(() => {
    const items: PaymentReminderItem[] = [];
    const nowMs = Date.now();
    const dayMs = 1000 * 60 * 60 * 24;

    const relevantAccounts =
      selectedSupplierId === 'all'
        ? creditAccounts
        : creditAccounts.filter((a) => a.supplierId === selectedSupplierId);

    const accountsWithInvoiceReminder = new Set<string>();

    // 1. Check credit ledger invoices with explicit dueDate
    for (const row of supplierScopedRows) {
      if (row.channel !== 'credit' || !row.dueDate) continue;
      const acc = row.creditAccountId ? accountById[row.creditAccountId] : accountBySupplierId[row.supplierId];
      if (acc && acc.currentUsedCreditIQD <= 0) continue;

      const dueMs = new Date(row.dueDate).getTime();
      if (Number.isNaN(dueMs)) continue;

      const daysUntilDue = Math.ceil((dueMs - nowMs) / dayMs);
      if (daysUntilDue <= reminderPrefs.leadDays) {
        if (acc) accountsWithInvoiceReminder.add(acc.id);
        items.push({
          id: `rem-inv-${row.id}`,
          severity: daysUntilDue < 0 ? 'overdue' : 'due_soon',
          supplierId: row.supplierId,
          supplierName: row.supplierName,
          creditAccountId: row.creditAccountId,
          referenceId: row.referenceId,
          dueDate: row.dueDate,
          daysUntilDue,
          amountIQD: row.debitIQD
        });
      }
    }

    // 2. Check credit accounts with active debt that have upcoming cycle due date or >=80% utilization
    for (const acc of relevantAccounts) {
      if (acc.currentUsedCreditIQD <= 0) continue;

      if (!accountsWithInvoiceReminder.has(acc.id)) {
        const baseDateMs = acc.lastPaymentDate ? new Date(acc.lastPaymentDate).getTime() : nowMs - 10 * dayMs;
        const estimatedDueMs = baseDateMs + acc.paymentTermDays * dayMs;
        const daysUntilDue = Math.ceil((estimatedDueMs - nowMs) / dayMs);

        if (daysUntilDue <= reminderPrefs.leadDays) {
          items.push({
            id: `rem-acc-due-${acc.id}`,
            severity: daysUntilDue < 0 ? 'overdue' : 'due_soon',
            supplierId: acc.supplierId,
            supplierName: acc.supplierName || acc.supplierId,
            creditAccountId: acc.id,
            referenceId: isAr ? `دورة ائتمان (${acc.paymentTermDays} يوم)` : `${acc.paymentTermDays}-day Credit Cycle`,
            dueDate: new Date(estimatedDueMs).toISOString(),
            daysUntilDue,
            amountIQD: acc.currentUsedCreditIQD
          });
        }
      }

      const utilRatio = acc.creditLimitIQD > 0 ? acc.currentUsedCreditIQD / acc.creditLimitIQD : 0;
      const utilPct = Math.round(utilRatio * 100);
      if (utilRatio > 0.8) {
        items.push({
          id: `rem-limit-${acc.id}`,
          severity: 'limit_warning',
          supplierId: acc.supplierId,
          supplierName: acc.supplierName || acc.supplierId,
          creditAccountId: acc.id,
          referenceId: isAr ? 'تجاوز 80% من سقف الائتمان' : 'Exceeded 80% Credit Limit',
          amountIQD: acc.currentUsedCreditIQD,
          utilizationPct: utilPct
        });
      }
    }

    const severityRank = { overdue: 0, due_soon: 1, limit_warning: 2 };
    items.sort((a, b) => {
      if (severityRank[a.severity] !== severityRank[b.severity]) {
        return severityRank[a.severity] - severityRank[b.severity];
      }
      return (a.daysUntilDue ?? 999) - (b.daysUntilDue ?? 999);
    });

    return items;
  }, [supplierScopedRows, creditAccounts, selectedSupplierId, accountById, accountBySupplierId, reminderPrefs.leadDays, isAr]);

  // Monitor >80% credit limit threshold across relevant accounts & aggregate balance
  const creditThresholdStatus = useMemo(() => {
    const relevantAccounts =
      selectedSupplierId === 'all'
        ? creditAccounts
        : creditAccounts.filter((a) => a.supplierId === selectedSupplierId);

    const exceededAccounts = relevantAccounts
      .filter((acc) => acc.creditLimitIQD > 0 && acc.currentUsedCreditIQD / acc.creditLimitIQD > 0.8)
      .map((acc) => {
        const ratio = acc.currentUsedCreditIQD / acc.creditLimitIQD;
        return {
          account: acc,
          utilizationPct: Math.round(ratio * 100),
          overLimit: ratio > 1,
          availableIQD: Math.max(0, acc.creditLimitIQD - acc.currentUsedCreditIQD)
        };
      })
      .sort((a, b) => b.utilizationPct - a.utilizationPct);

    const aggregateRatio =
      summary.totalCreditLimitIQD > 0 ? summary.currentPayableIQD / summary.totalCreditLimitIQD : 0;
    const aggregatePct = Math.round(aggregateRatio * 100);
    const hasThresholdBreach = aggregateRatio > 0.8 || exceededAccounts.length > 0;
    const highestPct =
      exceededAccounts.length > 0 ? Math.max(aggregatePct, exceededAccounts[0].utilizationPct) : aggregatePct;
    const isOverLimit = aggregateRatio > 1 || exceededAccounts.some((e) => e.overLimit);

    return {
      hasThresholdBreach,
      exceededAccounts,
      aggregatePct,
      highestPct,
      isOverLimit
    };
  }, [creditAccounts, selectedSupplierId, summary.totalCreditLimitIQD, summary.currentPayableIQD]);

  const activeReminders = useMemo(
    () => paymentReminders.filter((r) => !reminderPrefs.dismissedIds.includes(r.id)),
    [paymentReminders, reminderPrefs.dismissedIds]
  );

  const dismissedCount = paymentReminders.length - activeReminders.length;

  const showTimedToast = (msg: string) => {
    setReminderToast(msg);
    window.setTimeout(() => {
      setReminderToast((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  // Automatically dispatch an instant in-app reminder when credit utilization exceeds 80%
  useEffect(() => {
    if (!creditThresholdStatus.hasThresholdBreach) {
      notifiedThresholdKeyRef.current = null;
      setInstantInAppAlert(null);
      return;
    }

    if (!reminderPrefs.enabled || !reminderPrefs.channels.inApp) {
      return;
    }

    const signature = `${selectedSupplierId}:${creditThresholdStatus.highestPct}:${creditThresholdStatus.exceededAccounts
      .map((e) => `${e.account.id}@${e.utilizationPct}`)
      .join(',')}`;

    if (notifiedThresholdKeyRef.current === signature) {
      return;
    }

    notifiedThresholdKeyRef.current = signature;
    setTopAlertCollapsed(false);

    const supplierNames = creditThresholdStatus.exceededAccounts.map((e) =>
      isAr ? e.account.supplierName || e.account.supplierId : getLocalizedText(e.account.supplierName || e.account.supplierId, 'en')
    );

    const primaryCreditAccountId = creditThresholdStatus.exceededAccounts[0]?.account.id;
    const notice: InstantCreditAlertNotice = {
      id: signature,
      sentAt: new Date().toISOString(),
      highestPct: creditThresholdStatus.highestPct,
      isOverLimit: creditThresholdStatus.isOverLimit,
      supplierNames,
      primaryCreditAccountId
    };
    setInstantInAppAlert(notice);

    const supplierSummary =
      supplierNames.length > 0
        ? supplierNames.slice(0, 2).join(isAr ? '، ' : ', ') +
          (supplierNames.length > 2 ? (isAr ? ` (+${supplierNames.length - 2})` : ` (+${supplierNames.length - 2})`) : '')
        : storeName;

    const instantMsg = isAr
      ? `تذكير فوري عبر التطبيق: تم تجاوز 80% من سقف الائتمان (${creditThresholdStatus.highestPct}%) لدى ${supplierSummary}. يُنصح بسداد دفعة لتفادي إيقاف التوريد الآجل.`
      : `Instant In-App Alert: Credit utilization reached ${creditThresholdStatus.highestPct}% (above 80% threshold) with ${supplierSummary}. Schedule a payment to maintain credit availability.`;

    showTimedToast(instantMsg);

    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        const lastNativeSig = sessionStorage.getItem(INSTANT_LIMIT_NOTIF_STORAGE_KEY);
        if (lastNativeSig !== signature) {
          sessionStorage.setItem(INSTANT_LIMIT_NOTIF_STORAGE_KEY, signature);
          new Notification(
            isAr ? 'تنبيه تجاوز 80% من سقف الائتمان — دليل الخيرات' : 'Credit Limit >80% Alert — Dalil Al-Khairat',
            { body: instantMsg }
          );
        }
      } catch {
        // ignore notification errors in restricted iframes
      }
    }
  }, [creditThresholdStatus, reminderPrefs.enabled, reminderPrefs.channels.inApp, selectedSupplierId, isAr, storeName]);

  const handleTriggerRemindersNow = () => {
    const activeChannels: string[] = [];
    if (reminderPrefs.channels.inApp) activeChannels.push(isAr ? 'داخل التطبيق' : 'In-App');
    if (reminderPrefs.channels.whatsapp) activeChannels.push(isAr ? 'واتساب' : 'WhatsApp');
    if (reminderPrefs.channels.sms) activeChannels.push('SMS');

    const channelSummary = activeChannels.length > 0 ? activeChannels.join(' · ') : isAr ? 'داخل التطبيق' : 'In-App';
    const msg =
      activeReminders.length > 0
        ? isAr
          ? `تم إرسال ${activeReminders.length} تذكير سداد تلقائي عبر (${channelSummary})`
          : `Sent ${activeReminders.length} automated payment reminder(s) via ${channelSummary}`
        : isAr
        ? `تم جدولة التذكير التلقائي قبل ${reminderPrefs.leadDays} أيام من كل استحقاق عبر (${channelSummary})`
        : `Auto-reminders scheduled ${reminderPrefs.leadDays} days before due dates via ${channelSummary}`;

    showTimedToast(msg);

    if (
      reminderPrefs.channels.inApp &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(isAr ? 'تذكير سداد — دليل الخيرات' : 'Payment Reminder — Dalil Al-Khairat', {
          body: msg
        });
      } catch {
        // ignore notification errors in restricted iframes
      }
    }
  };

  const formatShortDate = (iso?: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(isAr ? 'ar-IQ' : 'en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleExportCsv = () => {
    const headers = isAr
      ? ['التاريخ', 'تاريخ السداد / الاستحقاق', 'المورد', 'النوع', 'المرجع', 'البيان', 'مدين (د.ع)', 'دائن / مسدد (د.ع)', 'الحالة']
      : ['Date', 'Payment / Due Date', 'Supplier', 'Type', 'Reference', 'Description', 'Debit (IQD)', 'Credit / Paid (IQD)', 'Status'];

    const csvLines = [
      headers.join(','),
      ...filteredRows.map((row) =>
        [
          formatShortDate(row.date),
          row.paymentDate
            ? formatShortDate(row.paymentDate)
            : row.dueDate
            ? formatShortDate(row.dueDate)
            : '—',
          `"${(isAr ? row.supplierName : getLocalizedText(row.supplierName, 'en')).replace(/"/g, '""')}"`,
          `"${isAr ? row.paymentMethodLabelAr : row.paymentMethodLabelEn}"`,
          `"${row.referenceId}"`,
          `"${(isAr ? row.descriptionAr : row.descriptionEn).replace(/"/g, '""')}"`,
          row.debitIQD,
          row.creditIQD,
          `"${isAr ? row.statusLabelAr : row.statusLabelEn}"`
        ].join(',')
      )
    ];

    const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filterTabs: Array<{ id: LedgerFilterTab; labelAr: string; labelEn: string; count: number }> = [
    { id: 'all', labelAr: 'كشف موحد', labelEn: 'All', count: supplierScopedRows.length },
    { id: 'cash', labelAr: 'العمليات النقدية', labelEn: 'Cash', count: summary.cashCount },
    { id: 'credit', labelAr: 'العمليات الآجلة', labelEn: 'Credit', count: summary.creditCount },
    { id: 'payments', labelAr: 'تاريخ السداد والدفعات', labelEn: 'Repayments', count: summary.paymentsCount }
  ];

  const formatShortTime = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString(isAr ? 'ar-IQ' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4 font-brand">
      {/* Top Visual Credit Threshold (>80%) Alert Indicator */}
      {creditThresholdStatus.hasThresholdBreach && (
        <div
          role="alert"
          className={`rounded-2xl border p-4 transition-colors ${
            creditThresholdStatus.isOverLimit
              ? 'bg-[#FEF2F2] border-[#FECACA]'
              : 'bg-[#FFFBEB] border-[#FDE68A]'
          }`}
        >
          {topAlertCollapsed ? (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 animate-pulse ${
                    creditThresholdStatus.isOverLimit ? 'bg-[#DC2626]' : 'bg-[#D97706]'
                  }`}
                />
                <AlertTriangle
                  className={`w-4 h-4 shrink-0 ${
                    creditThresholdStatus.isOverLimit ? 'text-[#B91C1C]' : 'text-[#B45309]'
                  }`}
                />
                <strong
                  className={`font-black truncate ${
                    creditThresholdStatus.isOverLimit ? 'text-[#991B1B]' : 'text-[#92400E]'
                  }`}
                >
                  {isAr
                    ? `تنبيه تجاوز 80% من سقف الائتمان (${creditThresholdStatus.highestPct}%)`
                    : `Credit Limit >80% Alert (${creditThresholdStatus.highestPct}% utilized)`}
                </strong>
              </div>
              <button
                type="button"
                onClick={() => setTopAlertCollapsed(false)}
                className="text-xs font-black text-[#142018] underline cursor-pointer shrink-0"
              >
                {isAr ? 'عرض التفاصيل' : 'Show Details'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      creditThresholdStatus.isOverLimit
                        ? 'bg-[#FEE2E2] border-[#FCA5A5] text-[#B91C1C]'
                        : 'bg-[#FEF3C7] border-[#FCD34D] text-[#B45309]'
                    }`}
                  >
                    <BellRing className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 animate-pulse ${
                          creditThresholdStatus.isOverLimit ? 'bg-[#DC2626]' : 'bg-[#D97706]'
                        }`}
                      />
                      <h3
                        className={`text-xs sm:text-sm font-black ${
                          creditThresholdStatus.isOverLimit ? 'text-[#991B1B]' : 'text-[#92400E]'
                        }`}
                      >
                        {creditThresholdStatus.isOverLimit
                          ? isAr
                            ? `تحذير حرج: تجاوز السقف الائتماني الممنوح (${creditThresholdStatus.highestPct}%)`
                            : `Critical Alert: Credit Limit Exceeded (${creditThresholdStatus.highestPct}%)`
                          : isAr
                          ? `تنبيه ائتماني: تم تجاوز 80% من سقف الائتمان الممنوح (${creditThresholdStatus.highestPct}%)`
                          : `Credit Warning: Utilization Exceeded 80% (${creditThresholdStatus.highestPct}%)`}
                      </h3>

                      {instantInAppAlert && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white/90 border border-[#DCE5DC] text-[#0B5D32] tabular-nums">
                          {isAr
                            ? `تم إرسال تذكير فوري عبر التطبيق · ${formatShortTime(instantInAppAlert.sentAt)}`
                            : `Instant In-App Reminder Sent · ${formatShortTime(instantInAppAlert.sentAt)}`}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#3D5244]">
                      {isAr
                        ? 'تجاوزت نسبة الاستخدام الحد التنبيهي (80%). يُرجى سداد دفعة لتقليل الذمم الآجلة والحفاظ على استمرارية الطلب بالآجل.'
                        : 'Credit usage has crossed the 80% threshold. Submit a payment to free up credit capacity and avoid order holds.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {creditThresholdStatus.exceededAccounts[0] && onOpenSupplierStatement && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenSupplierStatement(creditThresholdStatus.exceededAccounts[0].account.id)
                      }
                      className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-black text-white transition cursor-pointer whitespace-nowrap ${
                        creditThresholdStatus.isOverLimit
                          ? 'bg-[#B91C1C] hover:bg-[#991B1B]'
                          : 'bg-[#B45309] hover:bg-[#92400E]'
                      }`}
                    >
                      {isAr ? 'كشف المورد والسداد' : 'Open Statement & Pay'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setTopAlertCollapsed(true)}
                    className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-[#DCE5DC] text-[#5F7164] hover:text-[#142018] text-xs font-bold transition cursor-pointer"
                    aria-label={isAr ? 'طي التنبيه' : 'Collapse alert'}
                  >
                    {isAr ? 'طي' : 'Minimize'}
                  </button>
                </div>
              </div>

              {/* Visual 80% Threshold Bar + Breached Supplier Breakdown */}
              <div className="bg-white/85 rounded-xl border border-[#DCE5DC] p-3 space-y-2.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold tabular-nums">
                    <span className="text-[#5F7164]">
                      {isAr ? 'مؤشر استهلاك سقف الائتمان (الحد التحذيري 80%)' : 'Credit Utilization Gauge (80% Threshold)'}
                    </span>
                    <span
                      className={`font-black ${
                        creditThresholdStatus.isOverLimit ? 'text-[#B91C1C]' : 'text-[#B45309]'
                      }`}
                    >
                      {creditThresholdStatus.highestPct}%
                    </span>
                  </div>
                  <div className="relative h-2.5 w-full rounded-full bg-[#E8EEE9] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        creditThresholdStatus.isOverLimit ? 'bg-[#DC2626]' : 'bg-[#D97706]'
                      }`}
                      style={{ width: `${Math.min(100, creditThresholdStatus.highestPct)}%` }}
                    />
                    <div
                      className="absolute top-0 bottom-0 start-[80%] w-0.5 bg-[#142018]"
                      title={isAr ? 'حد التنبيه 80%' : '80% alert threshold'}
                    />
                  </div>
                </div>

                {creditThresholdStatus.exceededAccounts.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-[#EFF3EF]">
                    {creditThresholdStatus.exceededAccounts.map((item) => {
                      const supName = isAr
                        ? item.account.supplierName || item.account.supplierId
                        : getLocalizedText(item.account.supplierName || item.account.supplierId, 'en');
                      return (
                        <div
                          key={item.account.id}
                          className="flex items-center gap-2 bg-[#FAFBF8] border border-[#DCE5DC] rounded-lg px-2.5 py-1.5 text-[11px] tabular-nums"
                        >
                          <span className="font-black text-[#142018]">{supName}</span>
                          <span
                            className={`font-mono font-black ${
                              item.overLimit ? 'text-[#B91C1C]' : 'text-[#B45309]'
                            }`}
                          >
                            {item.utilizationPct}%
                          </span>
                          <span className="text-[#5F7164] font-mono">
                            ({formatCurrency(item.account.currentUsedCreditIQD, currency, language)} /{' '}
                            {formatCurrency(item.account.creditLimitIQD, currency, language)})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Breadcrumb & Action Bar */}
      <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white text-xs font-black flex items-center gap-1.5 transition cursor-pointer shrink-0 whitespace-nowrap"
          >
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{isAr ? 'رجوع لدفتر الأستاذ' : 'Back to Credit Hub'}</span>
          </button>

          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-black text-[#142018] leading-snug truncate">
              {isAr
                ? `سجل المعاملات النقدية والآجلة وتاريخ السداد — ${storeName}`
                : `Cash, Credit & Repayment Ledger — ${storeName}`}
            </h2>
            <p className="text-[11px] text-[#5F7164] mt-0.5 truncate">
              {isAr
                ? 'فصل محاسبي واضح بين الفواتير النقدية، الذمم الآجلة، وتواريخ السداد والاستحقاق لكل مورد'
                : 'Clear accounting separation of cash orders, credit invoices, payment dates & due dates'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={filteredRows.length === 0}
          className="min-h-[38px] px-3.5 py-2 rounded-xl bg-[#F4F4EA] hover:bg-[#EBF4EE] border border-[#DCE5DC] text-[#0B5D32] text-xs font-black flex items-center gap-1.5 transition cursor-pointer shrink-0 whitespace-nowrap disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
        </button>
      </div>

      {/* 4-Column Financial Summary Strip (Flat Single Elevation, Tabular Numerals) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 tabular-nums">
        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#5F7164]">
            <span>{isAr ? 'إجمالي العمليات النقدية' : 'Total Cash Paid'}</span>
            <Banknote className="w-4 h-4 text-[#0B5D32]" />
          </div>
          <strong className="text-base sm:text-lg font-black text-[#142018] mt-1.5 block">
            {formatCurrency(summary.totalCashIQD, currency, language)}
          </strong>
          <span className="text-[11px] text-[#5F7164] mt-0.5 block">
            {isAr ? `${summary.cashCount} فاتورة نقدية` : `${summary.cashCount} cash invoices`}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#5F7164]">
            <span>{isAr ? 'الذمم الآجلة القائمة' : 'Open Credit Payable'}</span>
            <CreditCard className="w-4 h-4 text-[#B45309]" />
          </div>
          <strong className="text-base sm:text-lg font-black text-[#B45309] mt-1.5 block">
            {formatCurrency(summary.currentPayableIQD, currency, language)}
          </strong>
          <span className="text-[11px] text-[#5F7164] mt-0.5 block">
            {isAr ? `${summary.creditCount} فاتورة آجلة مسجلة` : `${summary.creditCount} credit invoices`}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#5F7164]">
            <span>{isAr ? 'إجمالي دفعات السداد' : 'Total Repayments'}</span>
            <CheckCircle2 className="w-4 h-4 text-[#0B5D32]" />
          </div>
          <strong className="text-base sm:text-lg font-black text-[#0B5D32] mt-1.5 block">
            {formatCurrency(summary.totalPaidIQD, currency, language)}
          </strong>
          <span className="text-[11px] text-[#5F7164] mt-0.5 block">
            {isAr ? `${summary.paymentsCount} دفعة مسددة` : `${summary.paymentsCount} settled payments`}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#5F7164]">
            <span>{isAr ? 'تاريخ آخر سداد' : 'Last Payment Date'}</span>
            <Calendar className="w-4 h-4 text-[#0B5D32]" />
          </div>
          <strong className="text-sm sm:text-base font-black text-[#142018] mt-1.5 block">
            {formatShortDate(summary.lastPaymentDate)}
          </strong>
          <span className="text-[11px] text-[#5F7164] mt-0.5 block">
            {isAr ? 'وفق قيود دفتر الأستاذ المعتمدة' : 'Per verified ledger postings'}
          </span>
        </div>
      </div>

      {/* 6-Month Outstanding Debt Balance Trend Chart (Recharts) */}
      <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-black text-[#142018] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#B45309] shrink-0" />
              <span>
                {isAr
                  ? 'اتجاه رصيد الذمم الآجلة — آخر 6 أشهر'
                  : 'Outstanding Debt Balance Trend — Last 6 Months'}
              </span>
            </h3>
            <p className="text-[11px] text-[#5F7164] mt-0.5">
              {isAr
                ? 'متابعة تطور الدين المستحق مقارنةً بسقف الائتمان الممنوح لإدارة التدفق النقدي'
                : 'Track monthly outstanding debt against your approved credit limit'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold tabular-nums">
            <span className="text-[#B45309]">
              {isAr ? 'الرصيد الحالي:' : 'Current Debt:'}{' '}
              {formatCurrency(summary.currentPayableIQD, currency, language)}
            </span>
            {summary.totalCreditLimitIQD > 0 && (
              <>
                <span className="text-[#CBD5E1]" aria-hidden="true">|</span>
                <span className="text-[#0B5D32]">
                  {isAr ? 'سقف الائتمان:' : 'Credit Limit:'}{' '}
                  {formatCurrency(summary.totalCreditLimitIQD, currency, language)} ({creditUtilizationPct}%)
                </span>
              </>
            )}
          </div>
        </div>

        <div className="h-[220px] sm:h-[245px] w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={balanceTrendData}
              margin={{ top: 12, right: 16, left: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EEE9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#5F7164', fontSize: 11, fontWeight: 700 }}
                axisLine={{ stroke: '#DCE5DC' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatYAxisTick}
                tick={{ fill: '#5F7164', fontSize: 11, fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const point = payload[0].payload as {
                    balanceIQD: number;
                    creditLimitIQD: number;
                  };
                  const available = Math.max(0, point.creditLimitIQD - point.balanceIQD);
                  return (
                    <div
                      dir={isAr ? 'rtl' : 'ltr'}
                      className="bg-white border border-[#DCE5DC] rounded-xl shadow-md px-3 py-2.5 text-xs space-y-1 tabular-nums"
                    >
                      <div className="font-black text-[#142018] border-b border-[#EFF3EF] pb-1">
                        {label}
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[#5F7164]">
                          {isAr ? 'الذمة الآجلة:' : 'Outstanding Debt:'}
                        </span>
                        <strong className="text-[#B45309] font-mono">
                          {formatCurrency(point.balanceIQD, currency, language)}
                        </strong>
                      </div>
                      {point.creditLimitIQD > 0 && (
                        <>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[#5F7164]">
                              {isAr ? 'سقف الائتمان:' : 'Credit Limit:'}
                            </span>
                            <strong className="text-[#142018] font-mono">
                              {formatCurrency(point.creditLimitIQD, currency, language)}
                            </strong>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[#5F7164]">
                              {isAr ? 'المتاح المتبقي:' : 'Available:'}
                            </span>
                            <strong className="text-[#0B5D32] font-mono">
                              {formatCurrency(available, currency, language)}
                            </strong>
                          </div>
                        </>
                      )}
                    </div>
                  );
                }}
              />
              {summary.totalCreditLimitIQD > 0 && (
                <ReferenceLine
                  y={summary.totalCreditLimitIQD}
                  stroke="#0B5D32"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                />
              )}
              <Line
                type="monotone"
                dataKey="balanceIQD"
                stroke="#B45309"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#FFFFFF', stroke: '#B45309', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#B45309', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Automated Payment Reminders & Due-Date Notifications Panel */}
      <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#F4F4EA] border border-[#DCE5DC] text-[#0B5D32] flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black text-[#142018]">
                  {isAr ? 'تنبيهات السداد التلقائية ومواعيد الاستحقاق' : 'Automated Payment Reminders'}
                </h3>
                <span className="text-[11px] font-bold text-[#5F7164] tabular-nums">
                  {reminderPrefs.enabled
                    ? isAr
                      ? `· ${activeReminders.length} تنبيه نشط (قبل ${reminderPrefs.leadDays} أيام)`
                      : `· ${activeReminders.length} active (${reminderPrefs.leadDays}d notice)`
                    : isAr
                    ? '· متوقفة مؤقتاً'
                    : '· Paused'}
                </span>
              </div>
              <p className="text-[11px] text-[#5F7164] mt-0.5">
                {isAr
                  ? 'إشعارات تلقائية قبل اقتراب مواعيد استحقاق الفواتير الآجلة أو بلوغ 80% من سقف الائتمان'
                  : 'Automatic alerts before credit due dates approach or when credit utilization reaches 80%'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                setReminderPrefs((prev) => ({
                  ...prev,
                  enabled: !prev.enabled
                }))
              }
              className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-black border transition cursor-pointer whitespace-nowrap ${
                reminderPrefs.enabled
                  ? 'bg-[#EBF4EE] border-[#0B5D32]/30 text-[#0B5D32]'
                  : 'bg-[#F4F4EA] border-[#DCE5DC] text-[#5F7164]'
              }`}
            >
              {reminderPrefs.enabled
                ? isAr
                  ? 'التذكير مفعّل'
                  : 'Reminders On'
                : isAr
                ? 'التذكير متوقف'
                : 'Reminders Off'}
            </button>

            <button
              type="button"
              onClick={() => setShowReminderSettings((prev) => !prev)}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#F4F4EA] hover:bg-[#EBF4EE] border border-[#DCE5DC] text-[#142018] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#0B5D32]" />
              <span>{isAr ? 'إعدادات التذكير' : 'Configure'}</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerRemindersNow}
              disabled={!reminderPrefs.enabled}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white text-xs font-black flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isAr ? 'إرسال تذكير الآن' : 'Send Reminder'}</span>
            </button>
          </div>
        </div>

        {reminderToast && (
          <div className="p-3 rounded-xl bg-[#EFF7F1] border border-[#CBE0D0] text-[#0B5D32] text-xs font-bold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{reminderToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setReminderToast(null)}
              className="text-[#5F7164] hover:text-[#142018] cursor-pointer"
              aria-label={isAr ? 'إغلاق' : 'Dismiss'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Inline Reminder Settings Bar */}
        {showReminderSettings && (
          <div className="bg-[#FAFBF8] border border-[#DCE5DC] rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-[#142018]">
                {isAr ? 'تنبيه قبل الاستحقاق بـ:' : 'Remind before due date:'}
              </span>
              {([3, 7, 14] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setReminderPrefs((prev) => ({ ...prev, leadDays: days }))}
                  className={`min-h-[34px] px-3 py-1 rounded-lg font-bold border transition cursor-pointer whitespace-nowrap tabular-nums ${
                    reminderPrefs.leadDays === days
                      ? 'bg-[#0B5D32] border-[#0B5D32] text-white'
                      : 'bg-white border-[#DCE5DC] text-[#3D5244] hover:border-[#0B5D32]/50'
                  }`}
                >
                  {isAr ? `${days} أيام` : `${days} days`}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-[#142018]">
                {isAr ? 'قنوات الإشعار:' : 'Channels:'}
              </span>
              {(
                [
                  { key: 'inApp', ar: 'داخل التطبيق', en: 'In-App' },
                  { key: 'whatsapp', ar: 'واتساب', en: 'WhatsApp' },
                  { key: 'sms', ar: 'رسالة SMS', en: 'SMS' }
                ] as const
              ).map((ch) => {
                const active = reminderPrefs.channels[ch.key];
                return (
                  <button
                    key={ch.key}
                    type="button"
                    onClick={() =>
                      setReminderPrefs((prev) => ({
                        ...prev,
                        channels: { ...prev.channels, [ch.key]: !prev.channels[ch.key] }
                      }))
                    }
                    className={`min-h-[34px] px-3 py-1 rounded-lg font-bold border transition cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-[#EBF4EE] border-[#0B5D32]/40 text-[#0B5D32]'
                        : 'bg-white border-[#DCE5DC] text-[#5F7164]'
                    }`}
                  >
                    {isAr ? ch.ar : ch.en}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Reminders List */}
        {reminderPrefs.enabled && (
          <>
            {activeReminders.length === 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EFF3EF] text-xs text-[#5F7164]">
                <span className="flex items-center gap-1.5 font-semibold text-[#0B5D32]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {isAr
                      ? `وضع الائتمان سليم — لا توجد فواتير مستحقة خلال الـ ${reminderPrefs.leadDays} أيام القادمة.`
                      : `All clear — no payments due within the next ${reminderPrefs.leadDays} days.`}
                  </span>
                </span>
                {dismissedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setReminderPrefs((prev) => ({ ...prev, dismissedIds: [] }))}
                    className="text-[#0B5D32] font-bold hover:underline cursor-pointer whitespace-nowrap"
                  >
                    {isAr ? `استعادة ${dismissedCount} تنبيه مقروء` : `Restore ${dismissedCount} dismissed`}
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-[#EFF3EF] border-t border-[#EFF3EF]">
                {activeReminders.map((rem) => {
                  const displaySupplier = isAr
                    ? rem.supplierName
                    : getLocalizedText(rem.supplierName, 'en');

                  const timingLabel =
                    rem.severity === 'limit_warning'
                      ? isAr
                        ? `تجاوز ${rem.utilizationPct}% من سقف الائتمان (أعلى من الحد التنبيهي 80%)`
                        : `Exceeded ${rem.utilizationPct}% of credit limit (above 80% threshold)`
                      : rem.severity === 'overdue'
                      ? isAr
                        ? `متأخرة منذ ${Math.abs(rem.daysUntilDue || 0)} يوم · استحقاق ${formatShortDate(rem.dueDate)}`
                        : `Overdue by ${Math.abs(rem.daysUntilDue || 0)}d · Due ${formatShortDate(rem.dueDate)}`
                      : rem.daysUntilDue === 0
                      ? isAr
                        ? `تستحق اليوم · ${formatShortDate(rem.dueDate)}`
                        : `Due today · ${formatShortDate(rem.dueDate)}`
                      : isAr
                      ? `تستحق خلال ${rem.daysUntilDue} أيام · ${formatShortDate(rem.dueDate)}`
                      : `Due in ${rem.daysUntilDue}d · ${formatShortDate(rem.dueDate)}`;

                  return (
                    <div
                      key={rem.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <AlertTriangle
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            rem.severity === 'overdue' ? 'text-[#B91C1C]' : 'text-[#B45309]'
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <strong className="text-[#142018] font-black">{displaySupplier}</strong>
                            <span className="text-[#9CA3AF]" aria-hidden="true">·</span>
                            <span className="font-mono text-[11px] text-[#5F7164]">{rem.referenceId}</span>
                          </div>
                          <div
                            className={`text-[11px] font-bold mt-0.5 tabular-nums ${
                              rem.severity === 'overdue' ? 'text-[#B91C1C]' : 'text-[#B45309]'
                            }`}
                          >
                            {timingLabel}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 tabular-nums">
                        <strong className="font-mono text-xs sm:text-sm font-black text-[#142018]">
                          {formatCurrency(rem.amountIQD, currency, language)}
                        </strong>

                        <div className="flex items-center gap-1.5">
                          {rem.creditAccountId && onOpenSupplierStatement && (
                            <button
                              type="button"
                              onClick={() => onOpenSupplierStatement(rem.creditAccountId!)}
                              className="min-h-[34px] px-3 py-1 rounded-lg bg-[#EBF4EE] hover:bg-[#DCECE1] text-[#0B5D32] font-black transition cursor-pointer whitespace-nowrap"
                            >
                              {isAr ? 'كشف المورد' : 'Statement'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setReminderPrefs((prev) => ({
                                ...prev,
                                dismissedIds: [...prev.dismissedIds, rem.id]
                              }))
                            }
                            className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[#F4F4EA] hover:bg-[#EAECE4] text-[#5F7164] hover:text-[#142018] font-bold transition cursor-pointer whitespace-nowrap"
                          >
                            {isAr ? 'تم الاطلاع' : 'Acknowledge'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Filter Toolbar: Segmented Cash / Credit / Repayments + Supplier Selector + Search */}
      <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {filterTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#0B5D32] text-white'
                    : 'bg-[#F4F4EA] border border-[#DCE5DC] text-[#3D5244] hover:border-[#0B5D32]/50'
                }`}
              >
                <span>{isAr ? tab.labelAr : tab.labelEn}</span>
                <span
                  className={`text-[11px] tabular-nums ${
                    isActive ? 'text-white/85' : 'text-[#5F7164]'
                  }`}
                >
                  ({tab.count})
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'ابحث برقم الفاتورة، رقم الوصل، اسم المورد، أو البيان...'
                  : 'Search by invoice #, receipt #, supplier, or description...'
              }
              className="w-full min-h-[40px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl py-2 ps-9 pe-8 text-xs text-[#142018] placeholder-[#5F7164] focus:bg-white focus:border-[#0B5D32] outline-none transition"
            />
            <Search className="w-4 h-4 text-[#5F7164] absolute start-3 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[#5F7164] hover:text-[#142018] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
            className="min-h-[40px] sm:w-64 bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 text-xs font-bold text-[#142018] focus:bg-white focus:border-[#0B5D32] outline-none cursor-pointer"
          >
            <option value="all">{isAr ? 'جميع الموردين' : 'All Suppliers'}</option>
            {supplierOptions.map((sup) => (
              <option key={sup.id} value={sup.id}>
                {isAr ? sup.name : getLocalizedText(sup.name, 'en')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledger Table / Rows */}
      <div className="bg-white rounded-2xl border border-[#DCE5DC] overflow-hidden">
        {loadingEntries && unifiedRows.length === 0 ? (
          <div className="p-8 space-y-2.5">
            {[1, 2, 3, 4].map((row) => (
              <div key={row} className="h-10 rounded-xl bg-[#F4F4EA] animate-pulse" />
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-10 text-center space-y-2.5">
            <FileText className="w-9 h-9 text-[#CBD5E1] mx-auto" />
            <p className="text-sm font-black text-[#142018]">
              {isAr ? 'لا توجد حركات مالية مطابقة للتصفية الحالية' : 'No matching financial transactions'}
            </p>
            <p className="text-xs text-[#5F7164]">
              {isAr
                ? 'جرّب تغيير التبويب (نقدي / آجل / تاريخ السداد) أو اختيار جميع الموردين.'
                : 'Try switching tabs or selecting all suppliers.'}
            </p>
            {(activeTab !== 'all' || selectedSupplierId !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('all');
                  setSelectedSupplierId('all');
                  setSearchQuery('');
                }}
                className="min-h-[38px] px-4 py-1.5 rounded-xl bg-[#0B5D32] text-white text-xs font-black cursor-pointer"
              >
                {isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop High-Density Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-start border-collapse">
                <thead>
                  <tr className="bg-[#F4F4EA] border-b border-[#DCE5DC] text-[#4B6352] font-black">
                    <th className="py-3 px-4 text-start whitespace-nowrap">
                      {isAr ? 'تاريخ العملية' : 'Date'}
                    </th>
                    <th className="py-3 px-4 text-start whitespace-nowrap">
                      {isAr ? 'تاريخ السداد / الاستحقاق' : 'Payment / Due Date'}
                    </th>
                    <th className="py-3 px-4 text-start whitespace-nowrap">
                      {isAr ? 'المورد' : 'Supplier'}
                    </th>
                    <th className="py-3 px-4 text-start whitespace-nowrap">
                      {isAr ? 'التصنيف' : 'Type'}
                    </th>
                    <th className="py-3 px-4 text-start">
                      {isAr ? 'المرجع والبيان' : 'Reference & Description'}
                    </th>
                    <th className="py-3 px-4 text-end whitespace-nowrap">
                      {isAr ? 'مبلغ الفاتورة' : 'Debit'}
                    </th>
                    <th className="py-3 px-4 text-end whitespace-nowrap">
                      {isAr ? 'المسدد / الدائن' : 'Paid / Credit'}
                    </th>
                    <th className="py-3 px-4 text-start whitespace-nowrap">
                      {isAr ? 'الحالة' : 'Status'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFF3EF]">
                  {filteredRows.map((row) => {
                    const displaySupplier = isAr
                      ? row.supplierName
                      : getLocalizedText(row.supplierName, 'en');

                    return (
                      <tr key={row.id} className="hover:bg-[#FAFBF8] transition-colors">
                        <td className="py-3 px-4 font-mono tabular-nums text-[#142018] whitespace-nowrap">
                          {formatShortDate(row.date)}
                        </td>

                        <td className="py-3 px-4 font-mono tabular-nums whitespace-nowrap">
                          {row.paymentDate ? (
                            <span className="text-[#0B5D32] font-bold">
                              {isAr ? 'سُدّد: ' : 'Paid: '}
                              {formatShortDate(row.paymentDate)}
                            </span>
                          ) : row.dueDate ? (
                            <span
                              className={`font-bold ${
                                row.isOverdue ? 'text-[#B91C1C]' : 'text-[#B45309]'
                              }`}
                            >
                              {isAr ? 'استحقاق: ' : 'Due: '}
                              {formatShortDate(row.dueDate)}
                            </span>
                          ) : (
                            <span className="text-[#9CA3AF]">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-bold text-[#142018]">
                          {row.creditAccountId && onOpenSupplierStatement ? (
                            <button
                              type="button"
                              onClick={() => onOpenSupplierStatement(row.creditAccountId!)}
                              className="text-start hover:text-[#0B5D32] hover:underline cursor-pointer"
                            >
                              {displaySupplier}
                            </button>
                          ) : (
                            <span>{displaySupplier}</span>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 font-black ${
                              row.channel === 'cash'
                                ? 'text-[#0B5D32]'
                                : row.channel === 'credit'
                                ? 'text-[#B45309]'
                                : row.channel === 'payment'
                                ? 'text-[#047857]'
                                : 'text-[#4B5563]'
                            }`}
                          >
                            {row.channel === 'cash' && <Banknote className="w-3.5 h-3.5 shrink-0" />}
                            {row.channel === 'credit' && <Clock className="w-3.5 h-3.5 shrink-0" />}
                            {row.channel === 'payment' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                            {row.channel === 'adjustment' && <RotateCcw className="w-3.5 h-3.5 shrink-0" />}
                            <span>{isAr ? row.paymentMethodLabelAr : row.paymentMethodLabelEn}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-mono text-[11px] font-bold text-[#4B6352]">
                            {row.referenceId}
                          </div>
                          <div className="text-[#142018] line-clamp-1">
                            {isAr ? row.descriptionAr : row.descriptionEn}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-end font-mono tabular-nums font-bold text-[#142018] whitespace-nowrap">
                          {row.debitIQD > 0 ? formatCurrency(row.debitIQD, currency, language) : '—'}
                        </td>

                        <td className="py-3 px-4 text-end font-mono tabular-nums font-black text-[#0B5D32] whitespace-nowrap">
                          {row.creditIQD > 0 ? formatCurrency(row.creditIQD, currency, language) : '—'}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`text-[11px] font-bold ${
                              row.isOverdue
                                ? 'text-[#B91C1C]'
                                : row.channel === 'credit'
                                ? 'text-[#B45309]'
                                : 'text-[#0B5D32]'
                            }`}
                          >
                            {isAr ? row.statusLabelAr : row.statusLabelEn}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Ledger Rows */}
            <div className="md:hidden divide-y divide-[#EFF3EF]">
              {filteredRows.map((row) => {
                const displaySupplier = isAr
                  ? row.supplierName
                  : getLocalizedText(row.supplierName, 'en');

                return (
                  <div key={row.id} className="p-3.5 space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-black text-[#142018] truncate">{displaySupplier}</div>
                        <div className="text-[11px] text-[#5F7164] font-mono">
                          {row.referenceId} · {formatShortDate(row.date)}
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-black shrink-0 ${
                          row.channel === 'cash' || row.channel === 'payment'
                            ? 'text-[#0B5D32]'
                            : row.isOverdue
                            ? 'text-[#B91C1C]'
                            : 'text-[#B45309]'
                        }`}
                      >
                        {isAr ? row.paymentMethodLabelAr : row.paymentMethodLabelEn}
                      </span>
                    </div>

                    <p className="text-[11.5px] text-[#3D5244]">
                      {isAr ? row.descriptionAr : row.descriptionEn}
                    </p>

                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#F4F4EA] tabular-nums">
                      <div className="text-[11px] font-bold">
                        {row.paymentDate ? (
                          <span className="text-[#0B5D32]">
                            {isAr ? 'تاريخ السداد: ' : 'Paid: '}
                            {formatShortDate(row.paymentDate)}
                          </span>
                        ) : row.dueDate ? (
                          <span className={row.isOverdue ? 'text-[#B91C1C]' : 'text-[#B45309]'}>
                            {isAr ? 'تاريخ الاستحقاق: ' : 'Due: '}
                            {formatShortDate(row.dueDate)}
                          </span>
                        ) : (
                          <span className="text-[#5F7164]">
                            {isAr ? row.statusLabelAr : row.statusLabelEn}
                          </span>
                        )}
                      </div>

                      <div className="font-mono font-black text-[#142018]">
                        {row.channel === 'payment'
                          ? `+ ${formatCurrency(row.creditIQD, currency, language)}`
                          : formatCurrency(row.debitIQD, currency, language)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
