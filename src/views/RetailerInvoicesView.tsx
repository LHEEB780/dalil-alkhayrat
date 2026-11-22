import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Download,
  FileText,
  Receipt,
  Search,
  ShoppingBag,
  Wallet,
  X
} from 'lucide-react';
import {
  CreditAccountItem,
  Currency,
  Language,
  LedgerEntryItem,
  OrderItem
} from '../types/index.ts';
import { formatCurrency } from '../utils/format.ts';
import { getLocalizedText } from '../utils/translations.ts';

export type InvoiceStatusFilter = 'all' | 'paid' | 'pending';
export type InvoiceTimeRangePreset = 'all' | 'today' | 'week' | 'month' | 'custom';
type InvoicesViewMode = 'invoices' | 'payments';

interface RetailerInvoicesViewProps {
  creditAccounts: CreditAccountItem[];
  orders: OrderItem[];
  currency: Currency;
  language: Language;
  storeName: string;
  storeId?: string;
  onBrowseMarketplace?: () => void;
  onOpenSupplierStatement?: (creditAccountId: string) => void;
}

interface InvoicePaymentAllocation {
  paymentId: string;
  referenceId: string;
  date: string;
  allocatedAmountIQD: number;
  totalPaymentAmountIQD: number;
  methodLabelAr: string;
  methodLabelEn: string;
  descriptionAr: string;
  collectorOrChannelAr?: string;
}

interface UnifiedInvoiceRecord {
  id: string;
  invoiceRef: string;
  issueDate: string;
  dueDate?: string;
  supplierId: string;
  supplierName: string;
  creditAccountId?: string;
  billingType: 'credit' | 'cash' | 'wallet' | 'online';
  status: 'paid' | 'pending';
  isOverdue: boolean;
  totalAmountIQD: number;
  paidAmountIQD: number;
  remainingAmountIQD: number;
  descriptionAr: string;
  descriptionEn: string;
  items?: OrderItem['items'];
  payments: InvoicePaymentAllocation[];
}

interface MerchantPaymentRecord {
  id: string;
  referenceId: string;
  date: string;
  supplierId: string;
  supplierName: string;
  creditAccountId?: string;
  amountIQD: number;
  channel: 'credit_repayment' | 'cod' | 'wallet' | 'online' | 'return_credit';
  methodLabelAr: string;
  methodLabelEn: string;
  descriptionAr: string;
  allocations: {
    invoiceId: string;
    invoiceRef: string;
    allocatedAmountIQD: number;
  }[];
}

function inferPaymentMethodLabels(
  entry: LedgerEntryItem
): { ar: string; en: string; collector?: string } {
  if (entry.referenceType === 'RETURN_CREDIT') {
    return { ar: 'إشعار مرتجع معتمد', en: 'Return Credit Note' };
  }
  const desc = entry.descriptionAr || '';
  if (desc.includes('مندوب')) {
    return {
      ar: 'سداد نقدي عبر مندوب التوزيع',
      en: 'Cash Paid via Van Representative',
      collector: desc
    };
  }
  if (desc.includes('تحويل') || desc.includes('مصرف') || desc.includes('بنك')) {
    return { ar: 'حوالة مصرفية', en: 'Bank Transfer' };
  }
  if (desc.includes('محفظة') || desc.includes('إلكتروني') || desc.includes('زين')) {
    return { ar: 'دفع إلكتروني / محفظة', en: 'Digital Wallet / e-Payment' };
  }
  return { ar: 'دفعة سداد آجل', en: 'Credit Account Payment' };
}

function toLocalIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function resolveDateRangeBounds(
  preset: InvoiceTimeRangePreset,
  customStart: string,
  customEnd: string,
  referenceDate: Date
): { start: string | null; end: string | null } {
  const y = referenceDate.getFullYear();
  const m = referenceDate.getMonth();
  const day = referenceDate.getDate();
  const todayIso = toLocalIsoDate(referenceDate);

  if (preset === 'today') {
    return { start: todayIso, end: todayIso };
  }
  if (preset === 'week') {
    const weekAgo = new Date(y, m, day - 6);
    return { start: toLocalIsoDate(weekAgo), end: todayIso };
  }
  if (preset === 'month') {
    const monthStart = new Date(y, m, 1);
    const monthEnd = new Date(y, m + 1, 0);
    return { start: toLocalIsoDate(monthStart), end: toLocalIsoDate(monthEnd) };
  }
  if (preset === 'custom') {
    if (customStart && customEnd) {
      return customStart <= customEnd
        ? { start: customStart, end: customEnd }
        : { start: customEnd, end: customStart };
    }
    if (customStart) return { start: customStart, end: customStart };
    if (customEnd) return { start: customEnd, end: customEnd };
  }
  return { start: null, end: null };
}

export const RetailerInvoicesView: React.FC<RetailerInvoicesViewProps> = ({
  creditAccounts,
  orders,
  currency,
  language,
  storeName,
  storeId = 'store_almansoor',
  onBrowseMarketplace,
  onOpenSupplierStatement
}) => {
  const isAr = language === 'ar';

  const [viewMode, setViewMode] = useState<InvoicesViewMode>('invoices');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>('all');
  const [timeRangePreset, setTimeRangePreset] = useState<InvoiceTimeRangePreset>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);

  const [allLedgerEntries, setAllLedgerEntries] = useState<LedgerEntryItem[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (creditAccounts.length === 0) {
      setAllLedgerEntries([]);
      setLoadError(null);
      return;
    }

    let active = true;
    setLoadingLedger(true);
    setLoadError(null);

    Promise.all(
      creditAccounts.map(async (acc) => {
        const res = await fetch(`/api/credit/ledger/${encodeURIComponent(acc.id)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data.success && Array.isArray(data.data) ? (data.data as LedgerEntryItem[]) : [];
      })
    )
      .then((results) => {
        if (!active) return;
        setAllLedgerEntries(results.flat());
      })
      .catch(() => {
        if (!active) return;
        setLoadError(
          isAr
            ? 'تعذر تحميل بعض قيود دفتر الأستاذ من الخادم؛ يتم عرض بيانات الطلبات المتاحة.'
            : 'Some ledger entries could not be loaded; showing available order invoices.'
        );
      })
      .finally(() => {
        if (active) setLoadingLedger(false);
      });

    return () => {
      active = false;
    };
  }, [creditAccounts, isAr]);

  const storeOrders = useMemo(
    () => orders.filter((o) => (!o.storeId || o.storeId === storeId) && o.status !== 'cancelled'),
    [orders, storeId]
  );

  const orderById = useMemo(() => {
    const map: Record<string, OrderItem> = {};
    for (const o of storeOrders) {
      map[o.id] = o;
    }
    return map;
  }, [storeOrders]);

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

  const { invoices, paymentTransactions } = useMemo(() => {
    const currentDayIso = toLocalIsoDate(new Date());
    const builtInvoices: UnifiedInvoiceRecord[] = [];
    const builtPayments: MerchantPaymentRecord[] = [];

    const ledgerInvoiceRefs = new Set<string>();
    const ledgerByAccount: Record<string, LedgerEntryItem[]> = {};

    for (const entry of allLedgerEntries) {
      if (entry.isReversed) continue;
      if (!ledgerByAccount[entry.creditAccountId]) {
        ledgerByAccount[entry.creditAccountId] = [];
      }
      ledgerByAccount[entry.creditAccountId].push(entry);
      if (entry.referenceType === 'INVOICE' || entry.referenceType === 'OPENING_BALANCE') {
        ledgerInvoiceRefs.add(entry.referenceId);
      }
    }

    // 1. Build per-credit-account invoices & run FIFO payment allocation
    const accountIds = new Set<string>([
      ...creditAccounts.map((a) => a.id),
      ...Object.keys(ledgerByAccount)
    ]);

    for (const accId of accountIds) {
      const acc = accountById[accId];
      const entries = (ledgerByAccount[accId] || []).slice().sort((a, b) => {
        const cmp = a.entryDate.localeCompare(b.entryDate);
        return cmp !== 0 ? cmp : a.id.localeCompare(b.id);
      });

      const supplierId = acc?.supplierId || entries[0]?.supplierId || '';
      const supplierName = acc?.supplierName || supplierId;

      const debitInvoices: UnifiedInvoiceRecord[] = entries
        .filter((e) => e.referenceType === 'INVOICE' || e.referenceType === 'OPENING_BALANCE')
        .map((e) => {
          const matchedOrder = orderById[e.referenceId];
          const isOverdue = Boolean(e.dueDate) && e.dueDate! < currentDayIso;
          return {
            id: `inv-led-${e.id}`,
            invoiceRef: e.referenceId,
            issueDate: e.entryDate,
            dueDate: e.dueDate,
            supplierId,
            supplierName,
            creditAccountId: accId,
            billingType: 'credit',
            status: 'pending',
            isOverdue,
            totalAmountIQD: e.debitIQD,
            paidAmountIQD: 0,
            remainingAmountIQD: e.debitIQD,
            descriptionAr: e.descriptionAr,
            descriptionEn:
              e.referenceType === 'OPENING_BALANCE'
                ? 'Approved opening balance statement'
                : `Wholesale credit invoice · ${e.referenceId}`,
            items: matchedOrder?.items,
            payments: []
          };
        });

      // Include any credit orders for this supplier that aren't already mirrored as a ledger entry
      const extraCreditOrders = storeOrders
        .filter(
          (ord) =>
            ord.paymentMethod === 'credit' &&
            ord.supplierId === supplierId &&
            !ledgerInvoiceRefs.has(ord.id)
        )
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map<UnifiedInvoiceRecord>((ord) => {
          const issueDate = ord.createdAt.slice(0, 10);
          const termDays = acc?.paymentTermDays || 30;
          const dueDate = new Date(
            new Date(ord.createdAt).getTime() + termDays * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .slice(0, 10);
          return {
            id: `inv-ord-${ord.id}`,
            invoiceRef: ord.id,
            issueDate,
            dueDate,
            supplierId: ord.supplierId,
            supplierName: ord.supplierName || supplierName,
            creditAccountId: accId,
            billingType: 'credit',
            status: 'pending',
            isOverdue: dueDate < currentDayIso,
            totalAmountIQD: ord.subtotalIQD,
            paidAmountIQD: 0,
            remainingAmountIQD: ord.subtotalIQD,
            descriptionAr: `فاتورة طلبية جملة آجل (${ord.items.length} أصناف)`,
            descriptionEn: `Wholesale credit order (${ord.items.length} items)`,
            items: ord.items,
            payments: []
          };
        });

      const accountInvoices = [...debitInvoices, ...extraCreditOrders].sort((a, b) =>
        a.issueDate.localeCompare(b.issueDate)
      );

      const creditPayments = entries.filter(
        (e) =>
          (e.referenceType === 'PAYMENT' || e.referenceType === 'RETURN_CREDIT') &&
          e.creditIQD > 0
      );

      for (const pay of creditPayments) {
        let unallocated = pay.creditIQD;
        const labels = inferPaymentMethodLabels(pay);
        const allocations: MerchantPaymentRecord['allocations'] = [];

        for (const inv of accountInvoices) {
          if (unallocated <= 0) break;
          if (inv.remainingAmountIQD <= 0) continue;

          const applied = Math.min(inv.remainingAmountIQD, unallocated);
          inv.paidAmountIQD += applied;
          inv.remainingAmountIQD -= applied;
          unallocated -= applied;

          inv.payments.push({
            paymentId: pay.id,
            referenceId: pay.referenceId,
            date: pay.entryDate,
            allocatedAmountIQD: applied,
            totalPaymentAmountIQD: pay.creditIQD,
            methodLabelAr: labels.ar,
            methodLabelEn: labels.en,
            descriptionAr: pay.descriptionAr,
            collectorOrChannelAr: labels.collector
          });

          allocations.push({
            invoiceId: inv.id,
            invoiceRef: inv.invoiceRef,
            allocatedAmountIQD: applied
          });
        }

        builtPayments.push({
          id: `pay-led-${pay.id}`,
          referenceId: pay.referenceId,
          date: pay.entryDate,
          supplierId,
          supplierName,
          creditAccountId: accId,
          amountIQD: pay.creditIQD,
          channel: pay.referenceType === 'RETURN_CREDIT' ? 'return_credit' : 'credit_repayment',
          methodLabelAr: labels.ar,
          methodLabelEn: labels.en,
          descriptionAr: pay.descriptionAr,
          allocations
        });
      }

      for (const inv of accountInvoices) {
        if (inv.remainingAmountIQD <= 0) {
          inv.status = 'paid';
          inv.isOverdue = false;
        } else {
          inv.status = 'pending';
        }
        builtInvoices.push(inv);
      }
    }

    // 2. Credit orders without a credit account record (defensive fallback)
    for (const ord of storeOrders) {
      if (ord.paymentMethod !== 'credit') continue;
      if (accountBySupplierId[ord.supplierId]) continue;
      if (ledgerInvoiceRefs.has(ord.id)) continue;

      builtInvoices.push({
        id: `inv-ord-${ord.id}`,
        invoiceRef: ord.id,
        issueDate: ord.createdAt.slice(0, 10),
        supplierId: ord.supplierId,
        supplierName: ord.supplierName,
        billingType: 'credit',
        status: 'pending',
        isOverdue: false,
        totalAmountIQD: ord.subtotalIQD,
        paidAmountIQD: 0,
        remainingAmountIQD: ord.subtotalIQD,
        descriptionAr: `فاتورة طلبية جملة آجل (${ord.items.length} أصناف)`,
        descriptionEn: `Wholesale credit order (${ord.items.length} items)`,
        items: ord.items,
        payments: []
      });
    }

    // 3. Immediate Paid Invoices (COD / Wallet / Online)
    for (const ord of storeOrders) {
      if (ord.paymentMethod === 'credit') continue;
      const acc = accountBySupplierId[ord.supplierId];
      const payDate = ord.createdAt.slice(0, 10);
      const methodAr =
        ord.paymentMethod === 'wallet'
          ? 'محفظة المتجر الإلكترونية'
          : ord.paymentMethod === 'online'
          ? 'دفع إلكتروني (زين كاش / كي كارد)'
          : 'دفع نقدي عند الاستلام';
      const methodEn =
        ord.paymentMethod === 'wallet'
          ? 'Store Wallet'
          : ord.paymentMethod === 'online'
          ? 'Online Payment'
          : 'Cash on Delivery';

      const driverNote = ord.assignedDriverName
        ? isAr
          ? `تحصيل عبر السائق: ${ord.assignedDriverName}`
          : `Collected by driver: ${ord.assignedDriverName}`
        : isAr
        ? `سداد فوري للطلبية (${ord.items.length} أصناف)`
        : `Immediate settlement (${ord.items.length} items)`;

      const invId = `inv-cash-${ord.id}`;
      const payId = `pay-cash-${ord.id}`;

      builtInvoices.push({
        id: invId,
        invoiceRef: ord.id,
        issueDate: payDate,
        supplierId: ord.supplierId,
        supplierName: ord.supplierName,
        creditAccountId: acc?.id,
        billingType:
          ord.paymentMethod === 'wallet'
            ? 'wallet'
            : ord.paymentMethod === 'online'
            ? 'online'
            : 'cash',
        status: 'paid',
        isOverdue: false,
        totalAmountIQD: ord.subtotalIQD,
        paidAmountIQD: ord.subtotalIQD,
        remainingAmountIQD: 0,
        descriptionAr: `فاتورة توريد مدفوعة (${ord.items.length} أصناف) · ${methodAr}`,
        descriptionEn: `Paid supply invoice (${ord.items.length} items) · ${methodEn}`,
        items: ord.items,
        payments: [
          {
            paymentId: payId,
            referenceId: ord.id,
            date: payDate,
            allocatedAmountIQD: ord.subtotalIQD,
            totalPaymentAmountIQD: ord.subtotalIQD,
            methodLabelAr: methodAr,
            methodLabelEn: methodEn,
            descriptionAr: driverNote
          }
        ]
      });

      builtPayments.push({
        id: payId,
        referenceId: ord.id,
        date: payDate,
        supplierId: ord.supplierId,
        supplierName: ord.supplierName,
        creditAccountId: acc?.id,
        amountIQD: ord.subtotalIQD,
        channel:
          ord.paymentMethod === 'wallet'
            ? 'wallet'
            : ord.paymentMethod === 'online'
            ? 'online'
            : 'cod',
        methodLabelAr: methodAr,
        methodLabelEn: methodEn,
        descriptionAr: driverNote,
        allocations: [
          {
            invoiceId: invId,
            invoiceRef: ord.id,
            allocatedAmountIQD: ord.subtotalIQD
          }
        ]
      });
    }

    builtInvoices.sort((a, b) => b.issueDate.localeCompare(a.issueDate));
    builtPayments.sort((a, b) => b.date.localeCompare(a.date));

    return { invoices: builtInvoices, paymentTransactions: builtPayments };
  }, [allLedgerEntries, creditAccounts, storeOrders, orderById, accountById, accountBySupplierId, isAr]);

  const supplierOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const inv of invoices) {
      if (!map.has(inv.supplierId)) {
        map.set(inv.supplierId, inv.supplierName);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [invoices]);

  const todayIso = useMemo(() => toLocalIsoDate(new Date()), []);

  const activeDateBounds = useMemo(
    () => resolveDateRangeBounds(timeRangePreset, customStartDate, customEndDate, new Date()),
    [timeRangePreset, customStartDate, customEndDate]
  );

  const activeRangeSummaryLabel = useMemo(() => {
    if (timeRangePreset === 'all') {
      return isAr ? 'نطاق زمني مخصص' : 'Custom Date Range';
    }
    if (timeRangePreset === 'today') {
      return isAr ? `اليوم (${todayIso})` : `Today (${todayIso})`;
    }
    if (timeRangePreset === 'week' && activeDateBounds.start && activeDateBounds.end) {
      return isAr
        ? `الأسبوع (${activeDateBounds.start} ← ${activeDateBounds.end})`
        : `Week (${activeDateBounds.start} → ${activeDateBounds.end})`;
    }
    if (timeRangePreset === 'month' && activeDateBounds.start && activeDateBounds.end) {
      return isAr
        ? `الشهر (${activeDateBounds.start.slice(0, 7)})`
        : `Month (${activeDateBounds.start.slice(0, 7)})`;
    }
    if (activeDateBounds.start && activeDateBounds.end) {
      if (activeDateBounds.start === activeDateBounds.end) {
        return activeDateBounds.start;
      }
      return `${activeDateBounds.start} — ${activeDateBounds.end}`;
    }
    return isAr ? 'نطاق زمني مخصص' : 'Custom Date Range';
  }, [timeRangePreset, todayIso, activeDateBounds, isAr]);

  const scopedInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (supplierFilter !== 'all' && inv.supplierId !== supplierFilter) return false;
      if (activeDateBounds.start && inv.issueDate < activeDateBounds.start) return false;
      if (activeDateBounds.end && inv.issueDate > activeDateBounds.end) return false;
      return true;
    });
  }, [invoices, supplierFilter, activeDateBounds]);

  const scopedPayments = useMemo(() => {
    return paymentTransactions.filter((pay) => {
      if (supplierFilter !== 'all' && pay.supplierId !== supplierFilter) return false;
      if (activeDateBounds.start && pay.date < activeDateBounds.start) return false;
      if (activeDateBounds.end && pay.date > activeDateBounds.end) return false;
      return true;
    });
  }, [paymentTransactions, supplierFilter, activeDateBounds]);

  const summary = useMemo(() => {
    const paidList = scopedInvoices.filter((i) => i.status === 'paid');
    const pendingList = scopedInvoices.filter((i) => i.status === 'pending');

    return {
      totalCount: scopedInvoices.length,
      totalAmountIQD: scopedInvoices.reduce((s, i) => s + i.totalAmountIQD, 0),
      paidCount: paidList.length,
      paidAmountIQD: scopedInvoices.reduce((s, i) => s + i.paidAmountIQD, 0),
      pendingCount: pendingList.length,
      pendingAmountIQD: pendingList.reduce((s, i) => s + i.remainingAmountIQD, 0),
      overdueCount: pendingList.filter((i) => i.isOverdue).length,
      paymentsCount: scopedPayments.length,
      totalSettledIQD: scopedPayments.reduce((s, p) => s + p.amountIQD, 0)
    };
  }, [scopedInvoices, scopedPayments]);

  const filteredInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scopedInvoices.filter((inv) => {
      if (statusFilter === 'paid' && inv.status !== 'paid') return false;
      if (statusFilter === 'pending' && inv.status !== 'pending') return false;
      if (!q) return true;
      return (
        inv.invoiceRef.toLowerCase().includes(q) ||
        inv.supplierName.toLowerCase().includes(q) ||
        inv.descriptionAr.toLowerCase().includes(q) ||
        inv.payments.some(
          (p) =>
            p.referenceId.toLowerCase().includes(q) ||
            p.descriptionAr.toLowerCase().includes(q)
        ) ||
        (inv.items?.some((it) => it.productName.toLowerCase().includes(q)) ?? false)
      );
    });
  }, [scopedInvoices, statusFilter, searchQuery]);

  const filteredPayments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scopedPayments.filter((pay) => {
      if (!q) return true;
      return (
        pay.referenceId.toLowerCase().includes(q) ||
        pay.supplierName.toLowerCase().includes(q) ||
        pay.descriptionAr.toLowerCase().includes(q) ||
        pay.allocations.some((a) => a.invoiceRef.toLowerCase().includes(q))
      );
    });
  }, [scopedPayments, searchQuery]);

  const handleSelectTimePreset = (preset: InvoiceTimeRangePreset) => {
    setTimeRangePreset(preset);
    if (preset !== 'custom') {
      const bounds = resolveDateRangeBounds(preset, '', '', new Date());
      setCustomStartDate(bounds.start || '');
      setCustomEndDate(bounds.end || '');
    }
  };

  const handleResetDateFilter = () => {
    setTimeRangePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const handleExportCsv = () => {
    const headers = [
      'InvoiceRef',
      'IssueDate',
      'DueDate',
      'Supplier',
      'Type',
      'Status',
      'TotalIQD',
      'PaidIQD',
      'RemainingIQD',
      'PaymentRefs'
    ];
    const rows = filteredInvoices.map((inv) => [
      inv.invoiceRef,
      inv.issueDate,
      inv.dueDate || '',
      inv.supplierName,
      inv.billingType,
      inv.status,
      String(inv.totalAmountIQD),
      String(inv.paidAmountIQD),
      String(inv.remainingAmountIQD),
      inv.payments.map((p) => `${p.referenceId} (${p.date})`).join('; ')
    ]);
    const csv =
      '\uFEFF' +
      [headers, ...rows]
        .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoices-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getBillingTypeLabel = (type: UnifiedInvoiceRecord['billingType']) => {
    if (type === 'credit') return isAr ? 'فاتورة آجل' : 'Credit Invoice';
    if (type === 'wallet') return isAr ? 'محفظة المتجر' : 'Wallet Paid';
    if (type === 'online') return isAr ? 'دفع إلكتروني' : 'Online Paid';
    return isAr ? 'نقدي عند الاستلام' : 'Cash on Delivery';
  };

  const handleJumpToInvoice = (invoiceId: string) => {
    setViewMode('invoices');
    setStatusFilter('all');
    setExpandedInvoiceId(invoiceId);
  };

  return (
    <div className="space-y-4">
      {/* Top Overview & KPI Summary */}
      <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE5DC] pb-3.5">
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#142018] flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-[#0B5D32]" />
              <span>
                {isAr
                  ? `سجل الفواتير وتفاصيل السداد — ${storeName}`
                  : `Invoices & Payment Details — ${storeName}`}
              </span>
            </h2>
            <p className="text-[11px] text-[#5F7164] mt-0.5">
              {isAr
                ? 'تصنيف مستقل للفواتير المدفوعة وقيد الانتظار مع استعراض تفاصيل كل دفعة سداد والوصل المرتبط بها'
                : 'Separate tracking for paid and pending invoices with itemized payment history for every settlement'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-[#F4F4EA] p-1 rounded-xl border border-[#DCE5DC] text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('invoices')}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  viewMode === 'invoices'
                    ? 'bg-[#0B5D32] text-white'
                    : 'text-[#4B6352] hover:text-[#142018]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>
                  {isAr ? `سجل الفواتير (${summary.totalCount})` : `Invoices (${summary.totalCount})`}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('payments')}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  viewMode === 'payments'
                    ? 'bg-[#0B5D32] text-white'
                    : 'text-[#4B6352] hover:text-[#142018]'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>
                  {isAr
                    ? `عمليات السداد (${summary.paymentsCount})`
                    : `Payments Made (${summary.paymentsCount})`}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredInvoices.length === 0}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-[#DCE5DC] bg-white hover:border-[#0B5D32] text-[#142018] text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-[#0B5D32]" />
              <span>{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
            </button>
          </div>
        </div>

        {/* Top Calendar & Filter Toolbar */}
        <div className="border-b border-[#DCE5DC] pb-4 space-y-3">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
            {/* Time Range Presets + Calendar Trigger */}
            <div className="flex flex-wrap items-center gap-2">
              <div
                className="flex items-center gap-1 bg-[#F4F4EA] p-1 rounded-xl border border-[#DCE5DC] text-xs font-bold"
                role="group"
                aria-label={isAr ? 'النطاق الزمني' : 'Time range filter'}
              >
                {[
                  { id: 'all' as const, label: isAr ? 'كل التواريخ' : 'All Dates' },
                  { id: 'today' as const, label: isAr ? 'اليوم' : 'Today' },
                  { id: 'week' as const, label: isAr ? 'الأسبوع' : 'Week' },
                  { id: 'month' as const, label: isAr ? 'الشهر' : 'Month' }
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectTimePreset(preset.id)}
                    className={`min-h-[34px] px-3 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                      timeRangePreset === preset.id
                        ? 'bg-[#0B5D32] text-white'
                        : 'text-[#4B6352] hover:text-[#142018]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsCalendarOpen((prev) => !prev)}
                aria-expanded={isCalendarOpen}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl border text-xs font-black flex items-center gap-2 cursor-pointer whitespace-nowrap transition tabular-nums ${
                  isCalendarOpen || timeRangePreset !== 'all'
                    ? 'bg-white border-[#0B5D32] text-[#0B5D32]'
                    : 'bg-white border-[#DCE5DC] hover:border-[#0B5D32] text-[#142018]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>{activeRangeSummaryLabel}</span>
                {isCalendarOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                )}
              </button>

              {timeRangePreset !== 'all' && (
                <button
                  type="button"
                  onClick={handleResetDateFilter}
                  title={isAr ? 'إلغاء النطاق الزمني' : 'Clear date filter'}
                  className="min-h-[36px] px-2.5 py-1 rounded-xl border border-[#DCE5DC] bg-white hover:border-[#DC2626] text-[#5F7164] hover:text-[#DC2626] text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <X className="w-3 h-3" />
                  <span>{isAr ? 'مسح التاريخ' : 'Clear'}</span>
                </button>
              )}
            </div>

            {/* Payment Status Filter */}
            {viewMode === 'invoices' ? (
              <div
                className="flex items-center gap-1 bg-[#F4F4EA] p-1 rounded-xl border border-[#DCE5DC] text-xs font-bold self-start xl:self-auto"
                role="group"
                aria-label={isAr ? 'حالة الدفع' : 'Payment status filter'}
              >
                {[
                  { id: 'all' as const, label: isAr ? `الكل (${summary.totalCount})` : `All (${summary.totalCount})` },
                  { id: 'paid' as const, label: isAr ? `مدفوعة (${summary.paidCount})` : `Paid (${summary.paidCount})` },
                  { id: 'pending' as const, label: isAr ? `قيد الانتظار (${summary.pendingCount})` : `Pending (${summary.pendingCount})` }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`min-h-[34px] px-3 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                      statusFilter === tab.id
                        ? 'bg-[#0B5D32] text-white'
                        : 'text-[#4B6352] hover:text-[#142018]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs font-bold text-[#3D5244]">
                {isAr
                  ? 'سجل تفصيلي بكل دفعات السداد النقدية والآجلة والفواتير المرتبطة بها'
                  : 'Itemized log of every payment transaction and the invoices it settled'}
              </div>
            )}
          </div>

          {/* Collapsible Custom Date Range Panel */}
          {isCalendarOpen && (
            <div className="bg-[#F4F4EA] rounded-xl border border-[#DCE5DC] p-3.5 sm:p-4 space-y-3 text-xs">
              <div>
                <h3 className="text-xs font-black text-[#142018]">
                  {isAr ? 'تحديد نطاق زمني مخصص' : 'Custom Date Range'}
                </h3>
                <p className="text-[11px] text-[#5F7164] mt-0.5">
                  {isAr
                    ? 'اختر تاريخ البداية والنهاية لتصفية الفواتير وعمليات السداد ضمن الفترة المطلوبة.'
                    : 'Choose start and end dates to filter invoices and payments within your target period.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 tabular-nums">
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-[#3D5244] block">
                    {isAr ? 'من تاريخ:' : 'From:'}
                  </span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => {
                      setTimeRangePreset('custom');
                      setCustomStartDate(e.target.value);
                    }}
                    className="w-full min-h-[38px] bg-white border border-[#DCE5DC] rounded-xl px-3 py-1.5 text-xs font-mono text-[#142018] focus:border-[#0B5D32] outline-none"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-[#3D5244] block">
                    {isAr ? 'إلى تاريخ:' : 'To:'}
                  </span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => {
                      setTimeRangePreset('custom');
                      setCustomEndDate(e.target.value);
                    }}
                    className="w-full min-h-[38px] bg-white border border-[#DCE5DC] rounded-xl px-3 py-1.5 text-xs font-mono text-[#142018] focus:border-[#0B5D32] outline-none"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSelectTimePreset('today')}
                  className="min-h-[34px] px-3 py-1 rounded-lg border border-[#DCE5DC] bg-white hover:border-[#0B5D32] text-[#142018] text-[11px] font-bold cursor-pointer"
                >
                  {isAr ? 'اليوم فقط' : 'Today Only'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTimePreset('week')}
                  className="min-h-[34px] px-3 py-1 rounded-lg border border-[#DCE5DC] bg-white hover:border-[#0B5D32] text-[#142018] text-[11px] font-bold cursor-pointer"
                >
                  {isAr ? 'آخر 7 أيام' : 'Last 7 Days'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTimePreset('month')}
                  className="min-h-[34px] px-3 py-1 rounded-lg border border-[#DCE5DC] bg-white hover:border-[#0B5D32] text-[#142018] text-[11px] font-bold cursor-pointer"
                >
                  {isAr ? 'الشهر الحالي' : 'This Month'}
                </button>
                <button
                  type="button"
                  onClick={handleResetDateFilter}
                  className="min-h-[34px] px-3 py-1 rounded-lg border border-[#DCE5DC] bg-white hover:border-[#0B5D32] text-[#5F7164] text-[11px] font-bold cursor-pointer"
                >
                  {isAr ? 'عرض الكل' : 'Show All'}
                </button>
              </div>
            </div>
          )}

          {/* Secondary Filter Row: Supplier & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="min-h-[38px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-1.5 text-xs font-bold text-[#142018] focus:bg-white focus:border-[#0B5D32] outline-none sm:w-56"
            >
              <option value="all">{isAr ? 'جميع الموردين' : 'All Suppliers'}</option>
              {supplierOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {getLocalizedText(s.name, language)}
                </option>
              ))}
            </select>

            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#5F7164] absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isAr
                    ? 'بحث برقم الفاتورة، الوصل، أو المورد...'
                    : 'Search invoice, receipt, or supplier...'
                }
                className="w-full min-h-[38px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl ps-8 pe-3 py-1.5 text-xs text-[#142018] focus:bg-white focus:border-[#0B5D32] outline-none"
              />
            </div>
          </div>
        </div>

        {/* 4-column Summary Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs tabular-nums">
          <div className="bg-[#F4F4EA] rounded-xl p-3.5 border border-[#DCE5DC]">
            <span className="text-[11px] text-[#5F7164] block">
              {isAr ? 'إجمالي الفواتير' : 'Total Invoices'}
            </span>
            <div className="text-base font-black text-[#142018] font-mono mt-1">
              {formatCurrency(summary.totalAmountIQD, currency, language)}
            </div>
            <span className="text-[11px] text-[#5F7164]">
              {isAr ? `${summary.totalCount} فواتير مسجلة` : `${summary.totalCount} invoices`}
            </span>
          </div>

          <div className="bg-[#EFF7F1] rounded-xl p-3.5 border border-[#CBE0D0]">
            <span className="text-[11px] text-[#0B5D32] font-bold block">
              {isAr ? 'فواتير مدفوعة' : 'Paid Invoices'}
            </span>
            <div className="text-base font-black text-[#0B5D32] font-mono mt-1">
              {formatCurrency(summary.paidAmountIQD, currency, language)}
            </div>
            <span className="text-[11px] text-[#2F6846]">
              {isAr ? `${summary.paidCount} مكتملة السداد` : `${summary.paidCount} settled`}
            </span>
          </div>

          <div className="bg-[#FFFBEB] rounded-xl p-3.5 border border-[#FDE68A]">
            <span className="text-[11px] text-[#92400E] font-bold block">
              {isAr ? 'فواتير قيد الانتظار' : 'Pending Invoices'}
            </span>
            <div className="text-base font-black text-[#B45309] font-mono mt-1">
              {formatCurrency(summary.pendingAmountIQD, currency, language)}
            </div>
            <span className="text-[11px] text-[#92400E]">
              {isAr
                ? `${summary.pendingCount} بانتظار السداد${
                    summary.overdueCount > 0 ? ` · ${summary.overdueCount} مستحقة` : ''
                  }`
                : `${summary.pendingCount} pending${
                    summary.overdueCount > 0 ? ` · ${summary.overdueCount} overdue` : ''
                  }`}
            </span>
          </div>

          <div className="bg-[#F4F4EA] rounded-xl p-3.5 border border-[#DCE5DC]">
            <span className="text-[11px] text-[#5F7164] block">
              {isAr ? 'إجمالي الدفعات المسددة' : 'Total Payments Settled'}
            </span>
            <div className="text-base font-black text-[#142018] font-mono mt-1">
              {formatCurrency(summary.totalSettledIQD, currency, language)}
            </div>
            <span className="text-[11px] text-[#5F7164]">
              {isAr ? `${summary.paymentsCount} عمليات سداد` : `${summary.paymentsCount} payments`}
            </span>
          </div>
        </div>

        {loadError && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#B45309]" />
            <span>{loadError}</span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loadingLedger && invoices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-5 space-y-3">
          {[1, 2, 3].map((row) => (
            <div
              key={row}
              className="h-16 rounded-xl bg-[#F4F4EA] border border-[#DCE5DC] animate-pulse"
            />
          ))}
        </div>
      ) : viewMode === 'invoices' ? (
        /* =================== VIEW MODE 1: CLASSIFIED INVOICES LOG =================== */
        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-5 space-y-3">
          {filteredInvoices.length === 0 ? (
            <div className="py-12 text-center space-y-2.5">
              <FileText className="w-10 h-10 text-[#DCE5DC] mx-auto" />
              <p className="text-sm font-bold text-[#142018]">
                {isAr
                  ? 'لا توجد فواتير مطابقة لهذا التصنيف حالياً'
                  : 'No invoices found for this filter'}
              </p>
              <p className="text-xs text-[#5F7164]">
                {isAr
                  ? 'يمكنك تغيير النطاق الزمني أو حالة الدفع أو تصفح سوق الجملة لإنشاء طلبية جديدة'
                  : 'Adjust your date range or status filter, or browse the wholesale catalog'}
              </p>
              {statusFilter !== 'all' || searchQuery || supplierFilter !== 'all' || timeRangePreset !== 'all' ? (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('all');
                    setSupplierFilter('all');
                    setSearchQuery('');
                    handleResetDateFilter();
                  }}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white text-xs font-black cursor-pointer"
                >
                  {isAr ? 'عرض جميع الفواتير' : 'Reset Filters'}
                </button>
              ) : onBrowseMarketplace ? (
                <button
                  type="button"
                  onClick={onBrowseMarketplace}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white text-xs font-black cursor-pointer"
                >
                  {isAr ? 'تصفح سوق الجملة' : 'Browse Marketplace'}
                </button>
              ) : null}
            </div>
          ) : (
            <div className="divide-y divide-[#DCE5DC]">
              {filteredInvoices.map((inv) => {
                const isExpanded = expandedInvoiceId === inv.id;
                const paidRatio =
                  inv.totalAmountIQD > 0
                    ? Math.min(100, Math.round((inv.paidAmountIQD / inv.totalAmountIQD) * 100))
                    : 0;

                return (
                  <div key={inv.id} className="py-3.5 first:pt-1 last:pb-1 space-y-3">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-black text-xs sm:text-sm text-[#142018] tabular-nums">
                            {inv.invoiceRef}
                          </span>
                          <span className="text-[#9CA3AF]" aria-hidden="true">·</span>
                          <span className="text-xs font-bold text-[#0B5D32]">
                            {getLocalizedText(inv.supplierName, language)}
                          </span>
                          <span
                            data-invoice-status={
                              inv.status === 'paid'
                                ? 'paid'
                                : inv.isOverdue
                                ? 'overdue'
                                : 'pending'
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[11px] font-black whitespace-nowrap shrink-0 ${
                              inv.status === 'paid'
                                ? 'bg-[#EFF7F1] text-[#0B5D32] border-[#CBE0D0]'
                                : inv.isOverdue
                                ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                                : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                            }`}
                          >
                            {inv.status === 'paid' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            ) : inv.isOverdue ? (
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span>
                              {inv.status === 'paid'
                                ? isAr
                                  ? 'مدفوعة'
                                  : 'Paid'
                                : inv.isOverdue
                                ? isAr
                                  ? 'متأخرة السداد'
                                  : 'Overdue'
                                : isAr
                                ? 'قيد الانتظار'
                                : 'Pending'}
                            </span>
                          </span>
                        </div>

                        <p className="text-xs text-[#3D5244] truncate">
                          {isAr ? inv.descriptionAr : inv.descriptionEn}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#5F7164] tabular-nums">
                          <span>
                            {isAr ? 'تاريخ الفاتورة:' : 'Issued:'} {inv.issueDate}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{getBillingTypeLabel(inv.billingType)}</span>
                          {inv.dueDate && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className={inv.isOverdue ? 'text-[#DC2626] font-bold' : ''}>
                                {isAr ? 'الاستحقاق:' : 'Due:'} {inv.dueDate}
                              </span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span>
                            {inv.payments.length > 0
                              ? isAr
                                ? `${inv.payments.length} عملية سداد مرتبطة`
                                : `${inv.payments.length} payment(s)`
                              : isAr
                              ? 'لا توجد دفعات مسجلة بعد'
                              : 'No payments recorded yet'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 shrink-0">
                        <div className="text-start lg:text-end tabular-nums">
                          <div className="text-sm font-black font-mono text-[#142018]">
                            {formatCurrency(inv.totalAmountIQD, currency, language)}
                          </div>
                          {inv.status === 'pending' ? (
                            <div
                              className={`text-[11px] font-bold ${
                                inv.isOverdue ? 'text-[#DC2626]' : 'text-[#B45309]'
                              }`}
                            >
                              {isAr ? 'المتبقي:' : 'Remaining:'}{' '}
                              {formatCurrency(inv.remainingAmountIQD, currency, language)}
                            </div>
                          ) : (
                            <div className="text-[11px] text-[#0B5D32] font-bold">
                              {isAr ? 'مسددة بالكامل' : 'Fully Settled'}
                              {inv.payments[0]?.date ? ` · ${inv.payments[0].date}` : ''}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedInvoiceId(isExpanded ? null : inv.id)
                          }
                          className={`min-h-[38px] px-3.5 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition ${
                            isExpanded
                              ? 'bg-[#0B5D32] text-white border-[#0B5D32]'
                              : 'bg-[#F4F4EA] hover:bg-[#EBF4EE] text-[#142018] border-[#DCE5DC]'
                          }`}
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>
                            {isExpanded
                              ? isAr
                                ? 'إخفاء تفاصيل الدفع'
                                : 'Hide Payment Details'
                              : isAr
                              ? 'تفاصيل الدفع'
                              : 'Payment Details'}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Payment Details & Line Items */}
                    {isExpanded && (
                      <div className="bg-[#F4F4EA] rounded-xl border border-[#DCE5DC] p-3.5 sm:p-4 space-y-3.5">
                        {/* Settlement progress strip */}
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums">
                            <span className="font-bold text-[#142018]">
                              {isAr ? 'حالة سداد الفاتورة:' : 'Invoice Settlement Progress:'}
                            </span>
                            <span className="font-mono font-bold text-[#3D5244]">
                              {isAr ? 'مدفوع:' : 'Paid:'}{' '}
                              <strong className="text-[#0B5D32]">
                                {formatCurrency(inv.paidAmountIQD, currency, language)}
                              </strong>{' '}
                              / {formatCurrency(inv.totalAmountIQD, currency, language)} ({paidRatio}%)
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-white border border-[#DCE5DC] overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                inv.status === 'paid'
                                  ? 'bg-[#0B5D32]'
                                  : inv.isOverdue
                                  ? 'bg-[#DC2626]'
                                  : 'bg-[#D97706]'
                              }`}
                              style={{ width: `${paidRatio}%` }}
                            />
                          </div>
                        </div>

                        {/* Payment Breakdown */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-black text-[#142018] flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-[#0B5D32]" />
                            <span>
                              {isAr
                                ? 'تفاصيل عمليات الدفع والسداد لهذه الفاتورة:'
                                : 'Payment Transactions Applied to This Invoice:'}
                            </span>
                          </h4>

                          {inv.payments.length === 0 ? (
                            <div className="bg-white rounded-xl border border-[#DCE5DC] p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                              <div className="text-[#5F7164]">
                                {isAr
                                  ? `لم يتم تسجيل أي دفعة سداد لهذه الفاتورة حتى الآن${
                                      inv.dueDate ? ` — موعد الاستحقاق: ${inv.dueDate}` : ''
                                    }.`
                                  : `No payments have been recorded against this invoice yet${
                                      inv.dueDate ? ` — Due on ${inv.dueDate}` : ''
                                    }.`}
                              </div>
                              {inv.creditAccountId && onOpenSupplierStatement && (
                                <button
                                  type="button"
                                  onClick={() => onOpenSupplierStatement(inv.creditAccountId!)}
                                  className="min-h-[34px] px-3 py-1 rounded-lg bg-[#0B5D32] hover:bg-[#084726] text-white text-[11px] font-black cursor-pointer whitespace-nowrap"
                                >
                                  {isAr ? 'عرض كشف حساب المورد' : 'Open Supplier Statement'}
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="bg-white rounded-xl border border-[#DCE5DC] divide-y divide-[#DCE5DC]">
                              {inv.payments.map((pay) => (
                                <div
                                  key={`${inv.id}-${pay.paymentId}`}
                                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                >
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                      <span className="font-mono font-black text-[#0B5D32] tabular-nums">
                                        {pay.referenceId}
                                      </span>
                                      <span className="text-[#9CA3AF]" aria-hidden="true">·</span>
                                      <span className="font-bold text-[#142018]">
                                        {isAr ? pay.methodLabelAr : pay.methodLabelEn}
                                      </span>
                                      <span className="text-[#9CA3AF]" aria-hidden="true">·</span>
                                      <span className="text-[#5F7164] tabular-nums">
                                        {pay.date}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-[#5F7164]">
                                      {pay.descriptionAr}
                                    </p>
                                  </div>

                                  <div className="text-start sm:text-end shrink-0 tabular-nums">
                                    <div className="font-mono font-black text-[#0B5D32]">
                                      {formatCurrency(pay.allocatedAmountIQD, currency, language)}
                                    </div>
                                    {pay.totalPaymentAmountIQD > pay.allocatedAmountIQD && (
                                      <div className="text-[10.5px] text-[#5F7164]">
                                        {isAr ? 'من إجمالي وصل:' : 'From receipt:'}{' '}
                                        {formatCurrency(
                                          pay.totalPaymentAmountIQD,
                                          currency,
                                          language
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Linked Order Line Items if present */}
                        {inv.items && inv.items.length > 0 && (
                          <div className="space-y-1.5">
                            <h4 className="text-xs font-black text-[#142018] flex items-center gap-1.5">
                              <ShoppingBag className="w-3.5 h-3.5 text-[#0B5D32]" />
                              <span>{isAr ? 'أصناف الفاتورة:' : 'Invoice Line Items:'}</span>
                            </h4>
                            <div className="bg-white rounded-xl border border-[#DCE5DC] divide-y divide-[#DCE5DC] text-[11px] tabular-nums">
                              {inv.items.map((it, idx) => (
                                <div
                                  key={idx}
                                  className="px-3 py-2 flex items-center justify-between gap-2"
                                >
                                  <span className="text-[#142018] font-bold truncate">
                                    {it.productName} · {it.quantity} × {it.unit}
                                  </span>
                                  <span className="font-mono font-bold text-[#3D5244] shrink-0">
                                    {formatCurrency(it.totalPriceIQD, currency, language)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {inv.creditAccountId && onOpenSupplierStatement && inv.payments.length > 0 && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => onOpenSupplierStatement(inv.creditAccountId!)}
                              className="text-xs font-black text-[#0B5D32] hover:underline cursor-pointer"
                            >
                              {isAr ? 'فتح كشف حساب المورد التفصيلي ←' : 'Open full supplier statement →'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* =================== VIEW MODE 2: PAYMENTS HISTORY LOG =================== */
        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-5 space-y-3">
          {filteredPayments.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Wallet className="w-10 h-10 text-[#DCE5DC] mx-auto" />
              <p className="text-sm font-bold text-[#142018]">
                {isAr ? 'لا توجد عمليات سداد مسجلة حالياً' : 'No payment records found'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#DCE5DC]">
              {filteredPayments.map((pay) => {
                const isExpanded = expandedPaymentId === pay.id;
                return (
                  <div key={pay.id} className="py-3.5 first:pt-1 last:pb-1 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-mono font-black text-xs sm:text-sm text-[#0B5D32] tabular-nums">
                            {pay.referenceId}
                          </span>
                          <span className="text-[#9CA3AF]" aria-hidden="true">·</span>
                          <span className="text-xs font-bold text-[#142018]">
                            {getLocalizedText(pay.supplierName, language)}
                          </span>
                          <span className="text-[#9CA3AF]" aria-hidden="true">·</span>
                          <span className="text-xs font-bold text-[#3D5244]">
                            {isAr ? pay.methodLabelAr : pay.methodLabelEn}
                          </span>
                        </div>

                        <p className="text-xs text-[#5F7164]">{pay.descriptionAr}</p>

                        <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-[#5F7164] tabular-nums">
                          <span>
                            {isAr ? 'تاريخ السداد:' : 'Paid on:'} {pay.date}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {pay.allocations.length > 0
                              ? isAr
                                ? `سددت ${pay.allocations.length} فاتورة`
                                : `Settled ${pay.allocations.length} invoice(s)`
                              : isAr
                              ? 'دفعة على الحساب'
                              : 'Account payment'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <span className="font-mono font-black text-sm text-[#0B5D32] tabular-nums">
                          {formatCurrency(pay.amountIQD, currency, language)}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedPaymentId(isExpanded ? null : pay.id)
                          }
                          className="min-h-[36px] px-3 py-1.5 rounded-xl border border-[#DCE5DC] bg-[#F4F4EA] hover:bg-[#EBF4EE] text-xs font-black text-[#142018] cursor-pointer whitespace-nowrap flex items-center gap-1"
                        >
                          <span>{isAr ? 'الفواتير المسددة' : 'Linked Invoices'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="bg-[#F4F4EA] rounded-xl border border-[#DCE5DC] p-3 space-y-2 text-xs">
                        {pay.allocations.length === 0 ? (
                          <p className="text-[#5F7164]">
                            {isAr
                              ? 'دفعة مضافة مباشرة إلى رصيد حساب المورد لتخفيض المديونية القائمة.'
                              : 'Direct credit account payment applied against supplier balance.'}
                          </p>
                        ) : (
                          pay.allocations.map((alloc) => (
                            <div
                              key={alloc.invoiceId}
                              className="bg-white rounded-lg border border-[#DCE5DC] px-3 py-2 flex items-center justify-between gap-2 tabular-nums"
                            >
                              <button
                                type="button"
                                onClick={() => handleJumpToInvoice(alloc.invoiceId)}
                                className="font-mono font-black text-[#0B5D32] hover:underline cursor-pointer"
                              >
                                {alloc.invoiceRef}
                              </button>
                              <span className="font-mono font-bold text-[#142018]">
                                {formatCurrency(alloc.allocatedAmountIQD, currency, language)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
