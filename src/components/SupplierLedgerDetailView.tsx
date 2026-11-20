import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  CreditCard,
  Banknote,
  Clock,
  FileText,
  Download,
  Printer,
  Copy,
  Check,
  Search,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Lock,
  Unlock,
  Phone,
  ChevronDown,
  ChevronUp,
  Layers,
  Wallet
} from 'lucide-react';
import {
  CreditAccountItem,
  CreditUpgradeRequestItem,
  Currency,
  Language,
  LedgerEntryItem,
  OrderItem
} from '../types/index.ts';
import { WHOLESALE_SUPPLIERS, WholesaleSupplier } from '../data/nearbySuppliers.ts';
import { formatCurrency } from '../utils/format.ts';
import { getLocalizedText } from '../utils/translations.ts';

type StatementMode = 'all' | 'credit' | 'cash';
type CreditEntryFilter = 'all' | 'INVOICE' | 'PAYMENT' | 'REVERSAL';

interface SupplierLedgerDetailViewProps {
  account: CreditAccountItem;
  ledgerEntries: LedgerEntryItem[];
  supplierOrders: OrderItem[];
  upgradeRequests: CreditUpgradeRequestItem[];
  reliabilityScore: number;
  currency: Currency;
  language: Language;
  storeName: string;
  onBack: () => void;
  onOpenSupplierStore: (supplier: WholesaleSupplier) => void;
  onOpenCreditUpgradeModal: () => void;
}

export const SupplierLedgerDetailView: React.FC<SupplierLedgerDetailViewProps> = ({
  account,
  ledgerEntries,
  supplierOrders,
  upgradeRequests,
  reliabilityScore,
  currency,
  language,
  storeName,
  onBack,
  onOpenSupplierStore,
  onOpenCreditUpgradeModal
}) => {
  const isAr = language === 'ar';
  const [statementMode, setStatementMode] = useState<StatementMode>('all');
  const [entryTypeFilter, setEntryTypeFilter] = useState<CreditEntryFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const supplierLabel = account.supplierName || account.supplierId;
  const displaySupplierName = isAr ? supplierLabel : getLocalizedText(supplierLabel, 'en');

  const matchedSupplier = useMemo(
    () =>
      WHOLESALE_SUPPLIERS.find(
        (s) => s.id === account.supplierId || s.nameAr === account.supplierName
      ) || null,
    [account.supplierId, account.supplierName]
  );

  // Separate Cash vs Credit orders for this supplier
  const cashOrders = useMemo(
    () =>
      supplierOrders
        .filter((o) => o.paymentMethod !== 'credit' && o.status !== 'cancelled')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [supplierOrders]
  );

  const creditOrders = useMemo(
    () =>
      supplierOrders
        .filter((o) => o.paymentMethod === 'credit' && o.status !== 'cancelled')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [supplierOrders]
  );

  // Financial aggregates (strictly separated)
  const financials = useMemo(() => {
    const activeEntries = ledgerEntries.filter((e) => !e.isReversed);
    const totalCreditInvoicedIQD = activeEntries.reduce((sum, e) => sum + (e.debitIQD || 0), 0);
    const totalCreditPaidIQD = activeEntries.reduce((sum, e) => sum + (e.creditIQD || 0), 0);
    const totalCashSpentIQD = cashOrders.reduce((sum, o) => sum + (o.subtotalIQD || 0), 0);
    const totalVolumeIQD = totalCreditInvoicedIQD + totalCashSpentIQD;
    const repaymentRatio =
      totalCreditInvoicedIQD > 0
        ? Math.min(100, Math.round((totalCreditPaidIQD / totalCreditInvoicedIQD) * 100))
        : 100;
    const usedPct =
      account.creditLimitIQD > 0
        ? Math.min(100, Math.round((account.currentUsedCreditIQD / account.creditLimitIQD) * 100))
        : 0;

    return {
      totalCreditInvoicedIQD,
      totalCreditPaidIQD,
      totalCashSpentIQD,
      totalVolumeIQD,
      repaymentRatio,
      usedPct
    };
  }, [ledgerEntries, cashOrders, account.creditLimitIQD, account.currentUsedCreditIQD]);

  // Unified timeline rows for "All (Credit + Cash)" tab
  const unifiedRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    const creditRows = ledgerEntries
      .filter((e) => {
        if (entryTypeFilter === 'INVOICE' && e.referenceType !== 'INVOICE') return false;
        if (entryTypeFilter === 'PAYMENT' && e.referenceType !== 'PAYMENT') return false;
        if (
          entryTypeFilter === 'REVERSAL' &&
          e.referenceType !== 'REVERSAL' &&
          e.referenceType !== 'RETURN_CREDIT'
        ) {
          return false;
        }
        if (!q) return true;
        return (
          e.referenceId.toLowerCase().includes(q) ||
          e.descriptionAr.toLowerCase().includes(q) ||
          e.entryDate.toLowerCase().includes(q)
        );
      })
      .map((e) => ({
        id: `credit_${e.id}`,
        kind: 'credit' as const,
        date: e.entryDate,
        dueDate: e.dueDate,
        ref: e.referenceId,
        refType: e.referenceType,
        description: isAr ? e.descriptionAr : getLocalizedText(e.descriptionAr, 'en'),
        debitIQD: e.debitIQD,
        creditIQD: e.creditIQD,
        runningBalanceIQD: e.runningBalanceIQD,
        isReversed: e.isReversed,
        order: undefined as OrderItem | undefined
      }));

    const cashRows = cashOrders
      .filter((o) => {
        if (entryTypeFilter === 'PAYMENT' || entryTypeFilter === 'REVERSAL') return false;
        if (!q) return true;
        return (
          o.id.toLowerCase().includes(q) ||
          o.items.some((it) => it.productName.toLowerCase().includes(q)) ||
          o.createdAt.toLowerCase().includes(q)
        );
      })
      .map((o) => ({
        id: `cash_${o.id}`,
        kind: 'cash' as const,
        date: o.createdAt.slice(0, 10),
        dueDate: undefined as string | undefined,
        ref: o.id,
        refType: o.paymentMethod.toUpperCase(),
        description: isAr
          ? `فاتورة نقدية (${o.items.length} أصناف) · ${
              o.paymentMethod === 'wallet'
                ? 'محفظة'
                : o.paymentMethod === 'online'
                ? 'دفع إلكتروني'
                : 'نقدي عند الاستلام'
            }`
          : `Cash Invoice (${o.items.length} items) · ${o.paymentMethod.toUpperCase()}`,
        debitIQD: o.subtotalIQD,
        creditIQD: o.subtotalIQD,
        runningBalanceIQD: null as number | null,
        isReversed: false,
        order: o
      }));

    if (statementMode === 'credit') return creditRows;
    if (statementMode === 'cash') return cashRows;

    return [...creditRows, ...cashRows].sort((a, b) => b.date.localeCompare(a.date));
  }, [ledgerEntries, cashOrders, statementMode, entryTypeFilter, searchTerm, isAr]);

  const filteredCashOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return cashOrders;
    return cashOrders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.items.some((it) => it.productName.toLowerCase().includes(q)) ||
        o.createdAt.toLowerCase().includes(q)
    );
  }, [cashOrders, searchTerm]);

  const supplierUpgrades = useMemo(
    () => upgradeRequests.filter((r) => r.creditAccountId === account.id),
    [upgradeRequests, account.id]
  );

  // Export UTF-8 BOM CSV for Excel
  const handleExportCsv = () => {
    const headers = isAr
      ? ['النوع', 'التاريخ', 'المرجع', 'التصنيف', 'البيان', 'علينا (د.ع)', 'سددنا (د.ع)', 'الرصيد التراكمي (د.ع)']
      : ['Mode', 'Date', 'Reference', 'Type', 'Description', 'Debit (IQD)', 'Credit (IQD)', 'Running Balance (IQD)'];

    const rows = unifiedRows.map((r) => [
      r.kind === 'credit' ? (isAr ? 'آجل' : 'Credit') : isAr ? 'نقدي' : 'Cash',
      r.date,
      r.ref,
      r.refType,
      `"${r.description.replace(/"/g, '""')}"`,
      String(r.debitIQD || 0),
      String(r.creditIQD || 0),
      r.runningBalanceIQD !== null ? String(r.runningBalanceIQD) : '-'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `statement-${account.supplierId}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy concise statement summary for WhatsApp / accountant
  const handleCopySummary = async () => {
    const lines = isAr
      ? [
          `كشف حساب تفصيلي — ${storeName}`,
          `المورد: ${displaySupplierName}`,
          `--- ملخص الآجل ---`,
          `سقف الائتمان: ${formatCurrency(account.creditLimitIQD, currency, language)}`,
          `الذمة الحالية المستحقة: ${formatCurrency(account.currentUsedCreditIQD, currency, language)}`,
          `المتاح للشراء الآجل: ${formatCurrency(account.availableCreditIQD, currency, language)}`,
          `إجمالي الفواتير الآجلة: ${formatCurrency(financials.totalCreditInvoicedIQD, currency, language)}`,
          `إجمالي المسدد من الآجل: ${formatCurrency(financials.totalCreditPaidIQD, currency, language)}`,
          `--- ملخص النقدي ---`,
          `إجمالي المشتريات النقدية: ${formatCurrency(financials.totalCashSpentIQD, currency, language)} (${cashOrders.length} فاتورة)`,
          `--- الإجمالي ---`,
          `حجم التعامل الكلي: ${formatCurrency(financials.totalVolumeIQD, currency, language)}`
        ]
      : [
          `Supplier Statement — ${storeName}`,
          `Supplier: ${displaySupplierName}`,
          `--- Credit Summary ---`,
          `Credit Limit: ${formatCurrency(account.creditLimitIQD, currency, language)}`,
          `Current Payable: ${formatCurrency(account.currentUsedCreditIQD, currency, language)}`,
          `Available Credit: ${formatCurrency(account.availableCreditIQD, currency, language)}`,
          `Total Credit Invoiced: ${formatCurrency(financials.totalCreditInvoicedIQD, currency, language)}`,
          `Total Credit Paid: ${formatCurrency(financials.totalCreditPaidIQD, currency, language)}`,
          `--- Cash Summary ---`,
          `Total Cash Purchases: ${formatCurrency(financials.totalCashSpentIQD, currency, language)} (${cashOrders.length} invoices)`,
          `--- Total ---`,
          `Total Volume: ${formatCurrency(financials.totalVolumeIQD, currency, language)}`
        ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      // Fallback ignored if clipboard is blocked
    }
  };

  const getOrderStatusLabel = (status: OrderItem['status']) => {
    const map: Record<OrderItem['status'], { ar: string; en: string; cls: string }> = {
      pending: { ar: 'قيد الانتظار', en: 'Pending', cls: 'bg-amber-100 text-amber-800' },
      approved: { ar: 'معتمد', en: 'Approved', cls: 'bg-blue-100 text-blue-800' },
      assigned_driver: { ar: 'تم تعيين سائق', en: 'Driver Assigned', cls: 'bg-indigo-100 text-indigo-800' },
      out_for_delivery: { ar: 'في الطريق', en: 'Out for Delivery', cls: 'bg-sky-100 text-sky-800' },
      delivered: { ar: 'تم التسليم', en: 'Delivered', cls: 'bg-emerald-100 text-[#0B5D32]' },
      cancelled: { ar: 'ملغي', en: 'Cancelled', cls: 'bg-red-100 text-red-700' }
    };
    return map[status] || map.pending;
  };

  return (
    <div className="space-y-4">
      {/* ================= 1. TOP DEDICATED PAGE HEADER & ACTIONS ================= */}
      <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-5 space-y-4 shadow-[0_2px_8px_rgba(11,93,50,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#DCE5DC] pb-3.5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F4F4EA] hover:bg-[#EBF4EE] border border-[#DCE5DC] text-[#142018] hover:text-[#0B5D32] text-xs font-black transition cursor-pointer"
          >
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{isAr ? 'رجوع لقائمة الموردين' : 'Back to Suppliers'}</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-xl bg-[#F4F4EA] hover:bg-[#EBF4EE] border border-[#DCE5DC] text-[#142018] text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#0B5D32]" />
                  <span className="text-[#0B5D32]">{isAr ? 'تم النسخ' : 'Copied'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#5F7164]" />
                  <span>{isAr ? 'نسخ الملخص' : 'Copy Summary'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-xl bg-[#F4F4EA] hover:bg-[#EBF4EE] border border-[#DCE5DC] text-[#142018] text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#0B5D32]" />
              <span>{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl bg-[#F4F4EA] hover:bg-[#EBF4EE] border border-[#DCE5DC] text-[#142018] text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#5F7164]" />
              <span>{isAr ? 'طباعة' : 'Print'}</span>
            </button>
          </div>
        </div>

        {/* Supplier Identity Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#0B5D32] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-[#142018] leading-snug">
                  {displaySupplierName}
                </h2>
                {account.isBlocked ? (
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-black bg-red-100 text-[#B91C1C] px-2.5 py-0.5 rounded-full">
                    <Lock className="w-3 h-3" />
                    <span>{isAr ? 'حساب آجل موقوف' : 'Credit Blocked'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-black bg-emerald-100 text-[#0B5D32] px-2.5 py-0.5 rounded-full">
                    <Unlock className="w-3 h-3" />
                    <span>{isAr ? 'حساب نشط ومعتمد' : 'Active Verified'}</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5F7164]">
                <span>
                  {isAr
                    ? `مهلة السداد: ${account.paymentTermDays} يوماً`
                    : `Payment Term: ${account.paymentTermDays} days`}
                </span>
                {account.lastPaymentDate && (
                  <span>
                    • {isAr ? `آخر دفعة سداد: ${account.lastPaymentDate}` : `Last Payment: ${account.lastPaymentDate}`}
                  </span>
                )}
                {account.supplierPhone && (
                  <a
                    href={`tel:${account.supplierPhone}`}
                    className="inline-flex items-center gap-1 text-[#0B5D32] font-bold hover:underline"
                  >
                    <Phone className="w-3 h-3" />
                    <span dir="ltr">{account.supplierPhone}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenCreditUpgradeModal}
              className="min-h-[38px] px-3.5 py-2 rounded-xl bg-[#EBF4EE] hover:bg-[#DCECE1] border border-[#0B5D32]/25 text-[#0B5D32] text-xs font-black inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'طلب رفع السقف' : 'Request Limit Upgrade'}</span>
            </button>

            {matchedSupplier && (
              <button
                type="button"
                onClick={() => onOpenSupplierStore(matchedSupplier)}
                className="min-h-[38px] px-3.5 py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white text-xs font-black inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'زيارة متجر المورد' : 'Visit Storefront'}</span>
              </button>
            )}
          </div>
        </div>

        {account.isBlocked && account.blockReason && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#B91C1C] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{account.blockReason}</span>
          </div>
        )}
      </div>

      {/* ================= 2. SEPARATED CREDIT vs CASH SUMMARY CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 tabular-nums">
        {/* Credit (Deferred) Summary */}
        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#B45309]">
              <CreditCard className="w-4 h-4" />
              <span>{isAr ? 'المعاملات الآجلة (الائتمان)' : 'Credit / Deferred'}</span>
            </span>
            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-[#B45309] border border-amber-200">
              {isAr ? `${financials.usedPct}% مستخدم` : `${financials.usedPct}% Used`}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#5F7164] block">
              {isAr ? 'الرصيد المتبقي المستحق (علينا):' : 'Current Payable Balance:'}
            </span>
            <strong className="text-lg sm:text-xl font-black text-[#B45309] block mt-0.5">
              {formatCurrency(account.currentUsedCreditIQD, currency, language)}
            </strong>
          </div>

          <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                financials.usedPct >= 90
                  ? 'bg-red-500'
                  : financials.usedPct >= 70
                  ? 'bg-amber-500'
                  : 'bg-[#0B5D32]'
              }`}
              style={{ width: `${financials.usedPct}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] border-t border-[#F1F5F9]">
            <div>
              <span className="text-[#5F7164] block">{isAr ? 'السقف الممنوح:' : 'Limit:'}</span>
              <strong className="text-[#142018]">
                {formatCurrency(account.creditLimitIQD, currency, language)}
              </strong>
            </div>
            <div>
              <span className="text-[#5F7164] block">{isAr ? 'المتاح للآجل:' : 'Available:'}</span>
              <strong className="text-[#0B5D32]">
                {formatCurrency(account.availableCreditIQD, currency, language)}
              </strong>
            </div>
          </div>
        </div>

        {/* Cash Summary */}
        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#0B5D32]">
              <Banknote className="w-4 h-4" />
              <span>{isAr ? 'المعاملات النقدية (مباشر)' : 'Cash Transactions'}</span>
            </span>
            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#0B5D32] border border-emerald-200">
              {cashOrders.length} {isAr ? 'فاتورة' : 'invoices'}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#5F7164] block">
              {isAr ? 'إجمالي المشتريات النقدية المسددة:' : 'Total Cash Purchases:'}
            </span>
            <strong className="text-lg sm:text-xl font-black text-[#0B5D32] block mt-0.5">
              {formatCurrency(financials.totalCashSpentIQD, currency, language)}
            </strong>
          </div>

          <p className="text-[11px] text-[#5F7164] leading-relaxed">
            {isAr
              ? 'تشمل فواتير الدفع عند الاستلام والمحفظة والدفع الإلكتروني، وهي مفصولة تماماً عن ذمم الائتمان الآجل.'
              : 'Includes COD, wallet, and online paid invoices — completely separate from deferred credit.'}
          </p>

          <div className="pt-1 text-[11px] border-t border-[#F1F5F9] flex items-center justify-between">
            <span className="text-[#5F7164]">{isAr ? 'فواتير آجلة مسجلة:' : 'Credit orders:'}</span>
            <strong className="text-[#142018]">
              {creditOrders.length + ledgerEntries.filter((e) => e.referenceType === 'INVOICE' && !e.isReversed).length}{' '}
              {isAr ? 'قيد/طلب' : 'records'}
            </strong>
          </div>
        </div>

        {/* Total Relationship & Reliability Score */}
        <div className="bg-[#EFF7F1] rounded-2xl border border-[#CBE0D0] p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#0B5D32]">
              <ShieldCheck className="w-4 h-4" />
              <span>{isAr ? 'ملخص العلاقة والالتزام' : 'Relationship & Score'}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#0B5D32] text-white text-[11px] font-black">
              {reliabilityScore} / 100
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#3D5244] block">
              {isAr ? 'إجمالي حجم التعامل (آجل + نقدي):' : 'Total Trade Volume (Credit + Cash):'}
            </span>
            <strong className="text-lg sm:text-xl font-black text-[#142018] block mt-0.5">
              {formatCurrency(financials.totalVolumeIQD, currency, language)}
            </strong>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] border-t border-[#CBE0D0]">
            <div>
              <span className="text-[#3D5244] block">{isAr ? 'مسدد من الآجل:' : 'Credit Repaid:'}</span>
              <strong className="text-[#0B5D32]">
                {formatCurrency(financials.totalCreditPaidIQD, currency, language)}
              </strong>
            </div>
            <div>
              <span className="text-[#3D5244] block">{isAr ? 'نسبة السداد:' : 'Repayment Rate:'}</span>
              <strong className="text-[#0B5D32]">{financials.repaymentRatio}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 3. MODE TABS (ALL / CREDIT ONLY / CASH ONLY) + SEARCH ================= */}
      <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Mode Switcher */}
          <div className="grid grid-cols-3 sm:inline-flex items-center gap-1.5 p-1 rounded-xl bg-[#F4F4EA] border border-[#DCE5DC]">
            <button
              type="button"
              onClick={() => setStatementMode('all')}
              className={`px-3 py-2 rounded-lg text-xs font-black transition cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${
                statementMode === 'all'
                  ? 'bg-[#0B5D32] text-white shadow-xs'
                  : 'text-[#3D5244] hover:text-[#0B5D32]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isAr ? 'الكل' : 'All'}</span>
              <span className="text-[10px] opacity-85 tabular-nums">
                ({ledgerEntries.length + cashOrders.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatementMode('credit')}
              className={`px-3 py-2 rounded-lg text-xs font-black transition cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${
                statementMode === 'credit'
                  ? 'bg-[#B45309] text-white shadow-xs'
                  : 'text-[#3D5244] hover:text-[#B45309]'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{isAr ? 'آجل' : 'Credit'}</span>
              <span className="text-[10px] opacity-85 tabular-nums">({ledgerEntries.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatementMode('cash')}
              className={`px-3 py-2 rounded-lg text-xs font-black transition cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${
                statementMode === 'cash'
                  ? 'bg-[#0B5D32] text-white shadow-xs'
                  : 'text-[#3D5244] hover:text-[#0B5D32]'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>{isAr ? 'نقدي' : 'Cash'}</span>
              <span className="text-[10px] opacity-85 tabular-nums">({cashOrders.length})</span>
            </button>
          </div>

          {/* Search & Entry Type Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-[#5F7164] absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isAr ? 'ابحث برقم الفاتورة أو البيان...' : 'Search ref, invoice, item...'}
                className="w-full ps-9 pe-3 py-2 rounded-xl border border-[#DCE5DC] bg-[#F4F4EA]/60 focus:bg-white focus:border-[#0B5D32] text-xs outline-none transition"
              />
            </div>

            {statementMode !== 'cash' && (
              <div className="flex items-center gap-1 overflow-x-auto">
                {(
                  [
                    { id: 'all', ar: 'كل القيود', en: 'All' },
                    { id: 'INVOICE', ar: 'فواتير', en: 'Invoices' },
                    { id: 'PAYMENT', ar: 'سداد', en: 'Payments' },
                    { id: 'REVERSAL', ar: 'تسويات', en: 'Adjustments' }
                  ] as const
                ).map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setEntryTypeFilter(pill.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                      entryTypeFilter === pill.id
                        ? 'bg-[#EBF4EE] text-[#0B5D32] border border-[#0B5D32]/30'
                        : 'bg-[#F4F4EA] text-[#5F7164] border border-transparent hover:border-[#DCE5DC]'
                    }`}
                  >
                    {isAr ? pill.ar : pill.en}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Aging Buckets (Visible on All & Credit tabs) */}
        {statementMode !== 'cash' && (
          <div className="pt-1">
            <h4 className="text-xs font-bold text-[#5F7164] mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#0B5D32]" />
              <span>
                {isAr
                  ? 'توزيع أعمار الذمم الآجلة المستحقة (Aging):'
                  : 'Deferred Credit Aging Breakdown:'}
              </span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs tabular-nums">
              <div className="bg-[#F4F4EA] border border-[#DCE5DC] p-2.5 rounded-xl">
                <span className="text-[10.5px] text-[#5F7164] block">
                  {isAr ? '0 - 30 يوماً (جاري)' : '0 - 30 Days'}
                </span>
                <strong className="text-sm font-black text-[#0B5D32]">
                  {formatCurrency(account.aging.bucket0_30, currency, language)}
                </strong>
              </div>
              <div className="bg-[#F4F4EA] border border-[#DCE5DC] p-2.5 rounded-xl">
                <span className="text-[10.5px] text-[#5F7164] block">
                  {isAr ? '31 - 60 يوماً' : '31 - 60 Days'}
                </span>
                <strong className="text-sm font-black text-[#B45309]">
                  {formatCurrency(account.aging.bucket31_60, currency, language)}
                </strong>
              </div>
              <div className="bg-[#F4F4EA] border border-[#DCE5DC] p-2.5 rounded-xl">
                <span className="text-[10.5px] text-[#5F7164] block">
                  {isAr ? '61 - 90 يوماً' : '61 - 90 Days'}
                </span>
                <strong className="text-sm font-black text-red-600">
                  {formatCurrency(account.aging.bucket61_90, currency, language)}
                </strong>
              </div>
              <div className="bg-[#F4F4EA] border border-[#DCE5DC] p-2.5 rounded-xl">
                <span className="text-[10.5px] text-[#5F7164] block">
                  {isAr ? '+90 يوماً' : '+90 Days'}
                </span>
                <strong className="text-sm font-black text-[#B91C1C]">
                  {formatCurrency(account.aging.bucket90Plus, currency, language)}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* ================= CASH-ONLY DETAILED INVOICES VIEW ================= */}
        {statementMode === 'cash' ? (
          <div className="space-y-2.5">
            {filteredCashOrders.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-[#DCE5DC] text-center space-y-2">
                <Wallet className="w-9 h-9 text-[#DCE5DC] mx-auto" />
                <p className="text-xs font-bold text-[#142018]">
                  {isAr
                    ? 'لا توجد فواتير نقدية مسجلة مع هذا المورد حتى الآن'
                    : 'No cash invoices recorded with this supplier yet'}
                </p>
                <p className="text-[11px] text-[#5F7164]">
                  {isAr
                    ? 'عند إتمام أي طلب نقدي (دفع عند الاستلام أو محفظة) من هذا المورد سيظهر هنا تلقائياً.'
                    : 'Any COD, wallet, or online paid order from this supplier will appear here automatically.'}
                </p>
              </div>
            ) : (
              filteredCashOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const statusInfo = getOrderStatusLabel(order.status);
                return (
                  <div
                    key={order.id}
                    className="rounded-xl border border-[#DCE5DC] bg-[#F4F4EA]/35 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="w-full p-3.5 flex flex-wrap items-center justify-between gap-2 text-start hover:bg-[#F4F4EA]/70 transition cursor-pointer"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-[#0B5D32] text-[10px] font-black">
                            {isAr ? 'نقدي' : 'Cash'}
                          </span>
                          <span className="font-mono text-xs font-black text-[#142018]">
                            {order.id}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.cls}`}>
                            {isAr ? statusInfo.ar : statusInfo.en}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#5F7164] tabular-nums">
                          {order.createdAt.slice(0, 10)} • {order.items.length}{' '}
                          {isAr ? 'أصناف' : 'items'} •{' '}
                          {order.paymentMethod === 'wallet'
                            ? isAr
                              ? 'محفظة'
                              : 'Wallet'
                            : order.paymentMethod === 'online'
                            ? isAr
                              ? 'دفع إلكتروني'
                              : 'Online'
                            : isAr
                            ? 'نقدي عند الاستلام'
                            : 'COD'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <strong className="text-sm font-black text-[#0B5D32] tabular-nums">
                          {formatCurrency(order.subtotalIQD, currency, language)}
                        </strong>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#5F7164]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#5F7164]" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-2 border-t border-[#DCE5DC] bg-white space-y-1.5">
                        {order.items.map((item, idx) => (
                          <div
                            key={`${order.id}_${idx}`}
                            className="flex items-center justify-between gap-2 text-xs py-1 border-b last:border-b-0 border-[#F1F5F9]"
                          >
                            <div className="min-w-0">
                              <span className="font-bold text-[#142018] block truncate">
                                {item.productName}
                              </span>
                              <span className="text-[10.5px] text-[#5F7164] tabular-nums">
                                {item.quantity} × {item.unit} ({formatCurrency(item.unitPriceIQD, currency, language)})
                              </span>
                            </div>
                            <strong className="text-xs font-black text-[#142018] shrink-0 tabular-nums">
                              {formatCurrency(item.totalPriceIQD, currency, language)}
                            </strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* ================= UNIFIED / CREDIT LEDGER TABLE ================= */
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-black text-[#142018] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#0B5D32]" />
                <span>
                  {statementMode === 'credit'
                    ? isAr
                      ? 'دفتر الأستاذ الآجل (مع الرصيد التراكمي):'
                      : 'Deferred Credit Ledger (with Running Balance):'
                    : isAr
                    ? 'كشف جميع المعاملات مع المورد (آجل + نقدي):'
                    : 'All Supplier Transactions (Credit + Cash):'}
                </span>
              </h4>
              <span className="text-[10.5px] text-[#5F7164] tabular-nums">
                {unifiedRows.length} {isAr ? 'حركة' : 'entries'}
              </span>
            </div>

            <div className="border border-[#DCE5DC] rounded-xl overflow-hidden text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-start">
                  <thead className="bg-[#F4F4EA] text-[#5F7164] font-bold border-b border-[#DCE5DC]">
                    <tr>
                      <th className="p-2.5 whitespace-nowrap">{isAr ? 'النوع' : 'Mode'}</th>
                      <th className="p-2.5 whitespace-nowrap">{isAr ? 'التاريخ' : 'Date'}</th>
                      <th className="p-2.5 whitespace-nowrap">{isAr ? 'المرجع' : 'Ref'}</th>
                      <th className="p-2.5">{isAr ? 'البيان' : 'Description'}</th>
                      <th className="p-2.5 whitespace-nowrap">{isAr ? 'علينا (فاتورة)' : 'Debit'}</th>
                      <th className="p-2.5 whitespace-nowrap">{isAr ? 'سددنا (دفعة)' : 'Credit'}</th>
                      <th className="p-2.5 whitespace-nowrap">{isAr ? 'الرصيد التراكمي' : 'Balance'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5DC]">
                    {unifiedRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-[#5F7164]">
                          {isAr
                            ? 'لا توجد حركات مطابقة لخيارات التصفية الحالية'
                            : 'No transactions match the current filter'}
                        </td>
                      </tr>
                    ) : (
                      unifiedRows.map((row) => (
                        <tr
                          key={row.id}
                          className={`hover:bg-[#F4F4EA]/50 transition ${
                            row.isReversed ? 'bg-red-50/40 text-gray-400 line-through' : ''
                          }`}
                        >
                          <td className="p-2.5 whitespace-nowrap">
                            {row.kind === 'credit' ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-[#B45309]">
                                {isAr ? 'آجل' : 'Credit'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-[#0B5D32]">
                                {isAr ? 'نقدي' : 'Cash'}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 whitespace-nowrap font-mono text-[11px] tabular-nums">
                            <div>{row.date}</div>
                            {row.dueDate && (
                              <div className="text-[9.5px] text-[#5F7164]">
                                {isAr ? `استحقاق: ${row.dueDate}` : `Due: ${row.dueDate}`}
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                row.refType === 'INVOICE'
                                  ? 'bg-blue-100 text-blue-800'
                                  : row.refType === 'PAYMENT'
                                  ? 'bg-emerald-100 text-[#0B5D32]'
                                  : row.refType === 'REVERSAL'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {row.refType}
                            </span>
                            <span className="ms-1.5 font-mono text-[11px] text-[#5F7164]">
                              {row.ref}
                            </span>
                          </td>
                          <td className="p-2.5 max-w-xs">{row.description}</td>
                          <td className="p-2.5 whitespace-nowrap font-mono font-bold text-[#142018] tabular-nums">
                            {row.debitIQD > 0 ? formatCurrency(row.debitIQD, currency, language) : '-'}
                          </td>
                          <td className="p-2.5 whitespace-nowrap font-mono font-bold text-[#0B5D32] tabular-nums">
                            {row.creditIQD > 0 ? formatCurrency(row.creditIQD, currency, language) : '-'}
                          </td>
                          <td className="p-2.5 whitespace-nowrap font-mono font-black text-[#142018] tabular-nums">
                            {row.runningBalanceIQD !== null
                              ? formatCurrency(row.runningBalanceIQD, currency, language)
                              : isAr
                              ? 'مسدد فوراً'
                              : 'Paid'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Supplier Credit Upgrade Requests History */}
        {supplierUpgrades.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[#DCE5DC]">
            <h4 className="text-xs font-black text-[#142018]">
              {isAr
                ? 'سجل طلبات مراجعة السقف مع هذا المورد:'
                : 'Credit Limit Review History for this Supplier:'}
            </h4>
            <div className="space-y-2">
              {supplierUpgrades.map((req) => (
                <div
                  key={req.id}
                  className="p-3 rounded-xl bg-[#F4F4EA] border border-[#DCE5DC] text-xs space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-[#142018] tabular-nums">
                      {isAr ? 'السقف المطلوب:' : 'Requested Limit:'}{' '}
                      {formatCurrency(req.requestedLimitIQD, currency, language)}
                    </span>
                    <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#DCE5DC] text-[#0B5D32]">
                      {req.status === 'approved'
                        ? isAr
                          ? 'تمت الموافقة'
                          : 'Approved'
                        : req.status === 'deferred_by_policy'
                        ? isAr
                          ? 'مؤجل وفق التقييم'
                          : 'Deferred'
                        : isAr
                        ? 'قيد مراجعة اللجنة'
                        : 'Under Review'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5F7164]">{req.platformResponseAr}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
