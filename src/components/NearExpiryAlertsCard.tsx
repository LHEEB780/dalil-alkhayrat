import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  Calendar,
  Clock,
  Tag,
  Percent,
  CheckCircle2,
  RefreshCw,
  Store,
  Warehouse,
  Layers,
  ArrowUpRight,
  Package,
  AlertCircle
} from 'lucide-react';
import {
  Currency,
  ExpiryAlertChannel,
  Language,
  NearExpiryAlertItem
} from '../types/index.ts';
import { formatCurrency } from '../utils/format.ts';
import {
  addDaysToIsoDate,
  ExpiryThresholdMode,
  getTodayIsoDate,
  isValidIsoDate
} from '../../shared/expiryAlerts.ts';

export type NearExpiryModeContext = 'accountant_profile' | 'retail_store' | 'wholesale_supplier';

interface NearExpirySummary {
  nearExpiryCount: number;
  urgentCount: number;
  totalCapitalAtRiskIQD: number;
  convertedRetailCount: number;
  convertedWholesaleCount: number;
}

interface NearExpiryAlertsCardProps {
  modeContext: NearExpiryModeContext;
  storeId?: string;
  supplierId?: string;
  authToken?: string | null;
  currency: Currency;
  language: Language;
  onCountChange?: (count: number) => void;
  onConverted?: (payload: { channel: ExpiryAlertChannel; barcode: string }) => void | Promise<void>;
  onOpenRetailPromotions?: () => void;
  onOpenWholesaleDeals?: () => void;
}

export const NearExpiryAlertsCard: React.FC<NearExpiryAlertsCardProps> = ({
  modeContext,
  storeId = 'store_almansoor',
  supplierId = 'supp_rafidain',
  authToken,
  currency,
  language,
  onCountChange,
  onConverted,
  onOpenRetailPromotions,
  onOpenWholesaleDeals
}) => {
  const isAr = language === 'ar';
  const isSupplierContext = modeContext === 'wholesale_supplier';

  const [thresholdMode, setThresholdMode] = useState<ExpiryThresholdMode>('month');
  const [customTargetDate, setCustomTargetDate] = useState<string>(() =>
    addDaysToIsoDate(getTodayIsoDate(), 60)
  );
  const [alerts, setAlerts] = useState<NearExpiryAlertItem[]>([]);
  const [cutoffDate, setCutoffDate] = useState<string>('');
  const [summary, setSummary] = useState<NearExpirySummary>({
    nearExpiryCount: 0,
    urgentCount: 0,
    totalCapitalAtRiskIQD: 0,
    convertedRetailCount: 0,
    convertedWholesaleCount: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Active conversion drawer state
  const [convertingItemId, setConvertingItemId] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(25);
  const [selectedChannel, setSelectedChannel] = useState<ExpiryAlertChannel>(() =>
    modeContext === 'retail_store'
      ? 'retail'
      : modeContext === 'wholesale_supplier'
      ? 'wholesale'
      : 'both'
  );
  const [promoBadge, setPromoBadge] = useState<string>(
    isAr ? 'تصفية قرب انتهاء الصلاحية' : 'Near-Expiry Clearance'
  );
  const [submittingConvert, setSubmittingConvert] = useState<boolean>(false);

  const loadAlerts = useCallback(async () => {
    if (thresholdMode === 'custom' && !isValidIsoDate(customTargetDate)) {
      setErrorMsg(
        isAr ? 'يرجى تحديد تاريخ صحيح لتصفية الصلاحية' : 'Please select a valid target date'
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams({ mode: thresholdMode });
      if (thresholdMode === 'custom') {
        params.set('targetDate', customTargetDate);
      }
      const endpoint = isSupplierContext
        ? `/api/supplier/${encodeURIComponent(supplierId)}/near-expiry?${params.toString()}`
        : `/api/store/${encodeURIComponent(storeId)}/near-expiry?${params.toString()}`;

      const res = await fetch(endpoint);
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'فشل تحميل تنبيهات الصلاحية');
      }

      const items: NearExpiryAlertItem[] = Array.isArray(json.data) ? json.data : [];
      setAlerts(items);
      setCutoffDate(json.cutoffDate || '');
      if (json.summary) {
        setSummary(json.summary);
      }
      onCountChange?.(items.length);
    } catch (err: any) {
      setErrorMsg(err?.message || (isAr ? 'تعذر تحميل تنبيهات الصلاحية' : 'Failed to load expiry alerts'));
    } finally {
      setLoading(false);
    }
  }, [thresholdMode, customTargetDate, isSupplierContext, supplierId, storeId, isAr, onCountChange]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const openConvertPanel = (item: NearExpiryAlertItem) => {
    if (convertingItemId === item.id) {
      setConvertingItemId(null);
      return;
    }
    setConvertingItemId(item.id);
    setDiscountPercent(
      item.urgency === 'expired' || item.urgency === 'critical' ? 35 : 25
    );
    setSelectedChannel(
      modeContext === 'retail_store'
        ? 'retail'
        : modeContext === 'wholesale_supplier'
        ? 'wholesale'
        : 'both'
    );
    setPromoBadge(isAr ? 'تصفية قرب انتهاء الصلاحية' : 'Near-Expiry Clearance');
    setErrorMsg(null);
  };

  const handleConfirmConvert = async (item: NearExpiryAlertItem) => {
    const cleanDiscount = Math.round(Number(discountPercent));
    if (!Number.isFinite(cleanDiscount) || cleanDiscount < 5 || cleanDiscount > 85) {
      setErrorMsg(isAr ? 'نسبة الخصم يجب أن تكون بين 5% و 85%' : 'Discount must be between 5% and 85%');
      return;
    }

    setSubmittingConvert(true);
    setErrorMsg(null);
    setFeedbackMsg(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const endpoint = isSupplierContext
        ? `/api/supplier/${encodeURIComponent(supplierId)}/near-expiry/convert`
        : `/api/store/${encodeURIComponent(storeId)}/near-expiry/convert`;

      const channelToUse: ExpiryAlertChannel = isSupplierContext ? 'wholesale' : selectedChannel;

      const bodyPayload = isSupplierContext
        ? { batchId: item.id, barcode: item.barcode, discountPercent: cleanDiscount }
        : {
            barcode: item.barcode,
            discountPercent: cleanDiscount,
            channel: channelToUse,
            promoBadge: promoBadge.trim()
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload)
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || (isAr ? 'فشل تحويل المنتج للعروض' : 'Conversion failed'));
      }

      setFeedbackMsg(
        json.message ||
          (isAr
            ? `تم تحويل "${item.productName}" إلى العروض بنجاح`
            : `"${item.productName}" converted to offers`)
      );
      setConvertingItemId(null);
      await loadAlerts();
      if (onConverted) {
        await onConverted({ channel: channelToUse, barcode: item.barcode });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || (isAr ? 'حدث خطأ أثناء التحويل للعروض' : 'Conversion error'));
    } finally {
      setSubmittingConvert(false);
    }
  };

  const getUrgencyBadge = (item: NearExpiryAlertItem) => {
    if (item.isExpired || item.urgency === 'expired') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-800 border border-red-200 text-[10.5px] font-black tabular-nums">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {isAr
            ? `منتهي منذ ${Math.abs(item.daysRemaining)} يوم`
            : `Expired ${Math.abs(item.daysRemaining)}d ago`}
        </span>
      );
    }
    if (item.urgency === 'critical') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 text-[10.5px] font-black tabular-nums">
          <Clock className="w-3 h-3 shrink-0" />
          {isAr ? `متبقي ${item.daysRemaining} يوم · عاجل` : `${item.daysRemaining}d left · Urgent`}
        </span>
      );
    }
    if (item.urgency === 'warning') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 text-[10.5px] font-black tabular-nums">
          <Clock className="w-3 h-3 shrink-0" />
          {isAr ? `متبقي ${item.daysRemaining} يوم · خلال شهر` : `${item.daysRemaining}d left · <1 mo`}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[#0B5D32] border border-emerald-200 text-[10.5px] font-black tabular-nums">
        <Calendar className="w-3 h-3 shrink-0" />
        {isAr ? `متبقي ${item.daysRemaining} يوم` : `${item.daysRemaining}d left`}
      </span>
    );
  };

  const headingTitle =
    modeContext === 'retail_store'
      ? isAr
        ? 'تنبيهات الصلاحية وتحويلها لعروض التجزئة (B2C)'
        : 'Near-Expiry Alerts & Retail Offer Conversion'
      : modeContext === 'wholesale_supplier'
      ? isAr
        ? 'دفعات المستودع قريبة الانتهاء وتحويلها لعروض الجملة (B2B)'
        : 'Wholesale Warehouse Near-Expiry Clearance'
      : isAr
      ? 'تنبيهات المنتجات قريبة انتهاء الصلاحية وتحويلها للعروض'
      : 'Near-Expiry Inventory Alerts & Offer Conversion';

  const headingSubtitle =
    modeContext === 'retail_store'
      ? isAr
        ? 'راقب صلاحية مخزون السوبرماركت قبل موعدها بشهر أو بتاريخ مخصص وحوّلها فوراً لعروض المتجر'
        : 'Monitor store stock 1 month ahead or by custom cutoff date and convert straight into storefront promos'
      : modeContext === 'wholesale_supplier'
      ? isAr
        ? 'رصد دفعات المورد قبل انتهاء الصلاحية بشهر أو بتاريخ مخصص لطرحها فوراً في تصفيات الجملة'
        : 'Track supplier batches 1 month before expiry or by custom date and push directly to B2B clearance'
      : isAr
      ? 'رصد تلقائي للمخزون الحالي قبل انتهاء الصلاحية بشهر أو بتاريخ محدد مع تحويل فوري لعروض التجزئة والجملة'
      : 'Live inventory screening 1 month ahead or by custom date with instant conversion to retail & wholesale offers';

  return (
    <div
      data-testid={`near-expiry-card-${modeContext}`}
      className="bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-5 space-y-4 shadow-[0_2px_10px_rgba(11,93,50,0.04)]"
    >
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#DCE5DC] pb-3.5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-[#142018]">
                {headingTitle}
              </h3>
              <span
                data-testid="near-expiry-count-badge"
                className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 text-[10.5px] font-black tabular-nums"
              >
                {summary.nearExpiryCount} {isAr ? 'تنبيه' : 'alerts'}
              </span>
            </div>
            <p className="text-[11px] text-[#5F7164] mt-0.5 leading-relaxed">
              {headingSubtitle}
            </p>
          </div>
        </div>

        {/* Threshold Mode Selector: 1 Month vs Custom User Date */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex items-center bg-[#F4F4EA] border border-[#DCE5DC] p-1 rounded-xl text-xs">
            <button
              type="button"
              data-testid="expiry-mode-month"
              onClick={() => setThresholdMode('month')}
              className={`px-3 py-1.5 rounded-lg font-black transition cursor-pointer whitespace-nowrap ${
                thresholdMode === 'month'
                  ? 'bg-[#0B5D32] text-white shadow-2xs'
                  : 'text-[#3D5244] hover:text-[#142018]'
              }`}
            >
              {isAr ? 'قبل الموعد بشهر (30 يوماً)' : '1 Month Ahead (30d)'}
            </button>
            <button
              type="button"
              data-testid="expiry-mode-custom"
              onClick={() => setThresholdMode('custom')}
              className={`px-3 py-1.5 rounded-lg font-black transition cursor-pointer whitespace-nowrap ${
                thresholdMode === 'custom'
                  ? 'bg-[#0B5D32] text-white shadow-2xs'
                  : 'text-[#3D5244] hover:text-[#142018]'
              }`}
            >
              {isAr ? 'تاريخ يحدده المستخدم' : 'Custom Date'}
            </button>
          </div>

          {thresholdMode === 'custom' && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                data-testid="expiry-custom-date-input"
                value={customTargetDate}
                onChange={(e) => setCustomTargetDate(e.target.value)}
                dir="ltr"
                className="min-h-[36px] px-2.5 py-1 rounded-xl bg-[#F4F4EA] border border-[#DCE5DC] text-xs font-mono font-bold text-[#142018] focus:bg-white focus:border-[#0B5D32] outline-none"
              />
            </div>
          )}

          <button
            type="button"
            onClick={loadAlerts}
            title={isAr ? 'تحديث بيانات المخزون' : 'Refresh'}
            className="w-9 h-9 rounded-xl bg-[#F4F4EA] hover:bg-[#EBF4EE] border border-[#DCE5DC] text-[#0B5D32] flex items-center justify-center transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-[#FAFBF6] border border-[#DCE5DC] rounded-xl p-3">
          <span className="text-[10.5px] text-[#5F7164] block">
            {isAr ? 'أصناف ضمن النطاق' : 'Flagged Items'}
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5 tabular-nums">
            <strong className="text-base font-black text-[#142018]">{summary.nearExpiryCount}</strong>
            {summary.urgentCount > 0 && (
              <span className="text-[10px] font-black text-rose-700">
                ({summary.urgentCount} {isAr ? 'عاجل' : 'urgent'})
              </span>
            )}
          </div>
        </div>

        <div className="bg-[#FAFBF6] border border-[#DCE5DC] rounded-xl p-3">
          <span className="text-[10.5px] text-[#5F7164] block">
            {isAr ? 'رأس المال المعرض للخسارة' : 'Capital at Risk'}
          </span>
          <strong className="text-sm sm:text-base font-black text-amber-800 block mt-0.5 tabular-nums">
            {formatCurrency(summary.totalCapitalAtRiskIQD, currency, language)}
          </strong>
        </div>

        <div className="bg-[#FAFBF6] border border-[#DCE5DC] rounded-xl p-3">
          <span className="text-[10.5px] text-[#5F7164] block">
            {isAr ? 'موعد الفحص النشط' : 'Active Cutoff'}
          </span>
          <strong className="text-xs sm:text-sm font-black font-mono text-[#0B5D32] block mt-1 tabular-nums" dir="ltr">
            {cutoffDate || '—'}
          </strong>
        </div>

        <div className="bg-[#FAFBF6] border border-[#DCE5DC] rounded-xl p-3">
          <span className="text-[10.5px] text-[#5F7164] block">
            {isAr ? 'محوّلة للعروض' : 'Active Offers'}
          </span>
          <div className="flex items-center gap-2 mt-0.5 text-xs font-black tabular-nums">
            {!isSupplierContext && (
              <span className="text-[#0B5D32]">
                {summary.convertedRetailCount} {isAr ? 'تجزئة' : 'B2C'}
              </span>
            )}
            <span className="text-amber-700">
              {summary.convertedWholesaleCount} {isAr ? 'جملة' : 'B2B'}
            </span>
          </div>
        </div>
      </div>

      {/* Feedback & Error Messages */}
      {feedbackMsg && (
        <div
          data-testid="near-expiry-feedback"
          className="p-3 rounded-xl bg-[#EBF4EE] border border-[#CBE0D0] text-[#0B5D32] text-xs font-bold flex flex-wrap items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <div className="flex items-center gap-2">
            {onOpenRetailPromotions && (
              <button
                type="button"
                onClick={onOpenRetailPromotions}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#CBE0D0] text-[#0B5D32] font-black flex items-center gap-1 cursor-pointer hover:bg-[#FAFBF6]"
              >
                <span>{isAr ? 'عرض متجر التجزئة' : 'Retail Deals'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
            {onOpenWholesaleDeals && (
              <button
                type="button"
                onClick={onOpenWholesaleDeals}
                className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-800 font-black flex items-center gap-1 cursor-pointer hover:bg-amber-50"
              >
                <span>{isAr ? 'عرض سوق الجملة' : 'Wholesale Deals'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Alerts List */}
      {loading ? (
        <div className="py-8 text-center text-xs text-[#5F7164]">
          {isAr ? 'جارٍ فحص تواريخ صلاحية المخزون الحالي...' : 'Scanning current inventory expiry dates...'}
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#DCE5DC] bg-[#F4F4EA]/50 p-6 text-center space-y-1.5">
          <CheckCircle2 className="w-8 h-8 text-[#0B5D32] mx-auto" />
          <div className="text-xs font-black text-[#142018]">
            {isAr
              ? 'لا توجد منتجات قريبة الانتهاء ضمن التاريخ المحدد'
              : 'No near-expiry products found within the selected date'}
          </div>
          <p className="text-[11px] text-[#5F7164]">
            {isAr
              ? 'يمكنك اختيار "تاريخ يحدده المستخدم" لتوسيع فترة الفحص للأشهر القادمة.'
              : 'Switch to Custom Date to scan further ahead.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((item) => {
            const isPanelOpen = convertingItemId === item.id;
            const previewDiscountedPrice = Math.max(
              250,
              Math.round((item.sellingPriceIQD * (1 - discountPercent / 100)) / 250) * 250
            );
            const hasAnyOffer = Boolean(item.retailOffer?.active || item.wholesaleOffer?.active);

            return (
              <div
                key={item.id}
                data-testid={`near-expiry-item-${item.barcode}`}
                className={`rounded-2xl border p-3.5 transition ${
                  item.isExpired || item.urgency === 'critical'
                    ? 'border-rose-200 bg-rose-50/25'
                    : 'border-[#DCE5DC] bg-[#FAFDFB]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Product Info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-13 h-13 rounded-xl bg-white border border-[#DCE5DC] p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-[#5F7164]" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {getUrgencyBadge(item)}
                        <span className="text-[10.5px] font-mono text-[#5F7164] bg-white border border-[#DCE5DC] px-2 py-0.5 rounded-md tabular-nums" dir="ltr">
                          EXP: {item.expiryDate}
                        </span>
                        <span className="text-[10.5px] font-bold text-[#3D5244] bg-[#F4F4EA] px-2 py-0.5 rounded-md">
                          {item.category}
                        </span>
                      </div>

                      <h4 className="font-black text-xs sm:text-sm text-[#142018] leading-snug">
                        {item.productName}
                      </h4>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#5F7164] tabular-nums">
                        <span>
                          {isAr ? 'الكمية بالمخزون:' : 'Stock:'}{' '}
                          <strong className="text-[#142018]">{item.stockQuantity}</strong> ({item.unit})
                        </span>
                        <span>•</span>
                        <span>
                          {isAr ? 'قيمة المخزون:' : 'Risk Value:'}{' '}
                          <strong className="text-amber-800">
                            {formatCurrency(item.capitalAtRiskIQD, currency, language)}
                          </strong>
                        </span>
                      </div>

                      {/* Active Offer Badges */}
                      {(item.retailOffer?.active || item.wholesaleOffer?.active) && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {item.retailOffer?.active && (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-black px-2 py-0.5 rounded-md bg-[#EBF4EE] text-[#0B5D32] border border-[#CBE0D0] tabular-nums">
                              <Store className="w-3 h-3" />
                              <span>
                                {isAr
                                  ? `عرض تجزئة نشط (-${item.retailOffer.discountPercent}% · ${formatCurrency(item.retailOffer.priceIQD, currency, language)})`
                                  : `Retail Offer (-${item.retailOffer.discountPercent}%)`}
                              </span>
                            </span>
                          )}
                          {item.wholesaleOffer?.active && (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-black px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 tabular-nums">
                              <Warehouse className="w-3 h-3" />
                              <span>
                                {isAr
                                  ? `عرض جملة نشط (-${item.wholesaleOffer.clearanceDiscountPercent}% · ${formatCurrency(item.wholesaleOffer.priceIQD, currency, language)})`
                                  : `Wholesale Clearance (-${item.wholesaleOffer.clearanceDiscountPercent}%)`}
                              </span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center gap-2 shrink-0 justify-end">
                    <button
                      type="button"
                      data-testid={`convert-trigger-${item.barcode}`}
                      onClick={() => openConvertPanel(item)}
                      className={`min-h-[38px] px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                        isPanelOpen
                          ? 'bg-[#142018] text-white'
                          : hasAnyOffer
                          ? 'bg-[#EBF4EE] hover:bg-[#DCECE1] text-[#0B5D32] border border-[#CBE0D0]'
                          : 'bg-[#0B5D32] hover:bg-[#084726] text-white shadow-2xs'
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>
                        {isPanelOpen
                          ? isAr
                            ? 'إغلاق'
                            : 'Close'
                          : hasAnyOffer
                          ? isAr
                            ? 'تحديث العرض'
                            : 'Update Offer'
                          : isAr
                          ? 'تحويل إلى العروض'
                          : 'Convert to Offers'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Inline Offer Conversion Panel */}
                {isPanelOpen && (
                  <div
                    data-testid={`convert-panel-${item.barcode}`}
                    className="mt-3 pt-3 border-t border-[#DCE5DC] bg-white rounded-xl p-3.5 space-y-3 text-xs"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Discount Percentage */}
                      <div className="space-y-1.5">
                        <label className="font-bold text-[#3D5244] flex items-center gap-1">
                          <Percent className="w-3.5 h-3.5 text-[#0B5D32]" />
                          <span>{isAr ? 'نسبة التخفيض (%):' : 'Discount (%):'}</span>
                        </label>
                        <div className="flex items-center gap-1.5">
                          {[15, 25, 35, 50].map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setDiscountPercent(pct)}
                              className={`flex-1 py-1.5 rounded-lg font-black tabular-nums cursor-pointer transition ${
                                discountPercent === pct
                                  ? 'bg-[#0B5D32] text-white'
                                  : 'bg-[#F4F4EA] border border-[#DCE5DC] text-[#142018]'
                              }`}
                            >
                              {pct}%
                            </button>
                          ))}
                          <input
                            type="number"
                            min={5}
                            max={85}
                            dir="ltr"
                            value={discountPercent}
                            onChange={(e) => setDiscountPercent(Number(e.target.value))}
                            className="w-16 py-1.5 px-2 rounded-lg bg-[#F4F4EA] border border-[#DCE5DC] font-mono font-black text-center tabular-nums outline-none focus:border-[#0B5D32]"
                          />
                        </div>
                      </div>

                      {/* Target Channel */}
                      {!isSupplierContext ? (
                        <div className="space-y-1.5">
                          <label className="font-bold text-[#3D5244] flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-[#0B5D32]" />
                            <span>{isAr ? 'نشر العرض في:' : 'Publish Offer To:'}</span>
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { id: 'retail' as const, label: isAr ? 'التجزئة' : 'Retail' },
                              { id: 'wholesale' as const, label: isAr ? 'الجملة' : 'Wholesale' },
                              { id: 'both' as const, label: isAr ? 'الاثنين معاً' : 'Both' }
                            ].map((ch) => (
                              <button
                                key={ch.id}
                                type="button"
                                data-testid={`convert-channel-${ch.id}`}
                                onClick={() => setSelectedChannel(ch.id)}
                                className={`py-1.5 px-2 rounded-lg font-black transition cursor-pointer text-center ${
                                  selectedChannel === ch.id
                                    ? 'bg-[#0B5D32] text-white'
                                    : 'bg-[#F4F4EA] border border-[#DCE5DC] text-[#3D5244]'
                                }`}
                              >
                                {ch.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <label className="font-bold text-[#3D5244] block">
                            {isAr ? 'قناة النشر:' : 'Channel:'}
                          </label>
                          <div className="py-1.5 px-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-black">
                            {isAr ? 'عروض تصفيات الجملة (B2B)' : 'Wholesale Clearance (B2B)'}
                          </div>
                        </div>
                      )}

                      {/* Promo Badge */}
                      <div className="space-y-1.5">
                        <label className="font-bold text-[#3D5244] block">
                          {isAr ? 'وصف / شارة العرض:' : 'Offer Badge:'}
                        </label>
                        <input
                          type="text"
                          value={promoBadge}
                          onChange={(e) => setPromoBadge(e.target.value)}
                          placeholder={isAr ? 'تصفية قرب انتهاء الصلاحية' : 'Near-Expiry Clearance'}
                          className="w-full py-1.5 px-3 rounded-lg bg-[#F4F4EA] border border-[#DCE5DC] font-bold text-[#142018] focus:bg-white focus:border-[#0B5D32] outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#DCE5DC]/70">
                      <div className="text-[11px] text-[#5F7164] tabular-nums">
                        {isAr ? 'السعر التقديري بعد الخصم:' : 'Estimated Offer Price:'}{' '}
                        <strong className="text-[#0B5D32] text-xs font-black">
                          {formatCurrency(previewDiscountedPrice, currency, language)}
                        </strong>{' '}
                        <span className="line-through text-[#9CA3AF]">
                          {formatCurrency(item.sellingPriceIQD, currency, language)}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={submittingConvert}
                        data-testid={`convert-confirm-${item.barcode}`}
                        onClick={() => handleConfirmConvert(item)}
                        className="min-h-[38px] px-4 py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084726] disabled:opacity-60 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {submittingConvert
                            ? isAr
                              ? 'جارٍ التحويل...'
                              : 'Converting...'
                            : isAr
                            ? 'تأكيد التحويل للعروض'
                            : 'Confirm Conversion'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
