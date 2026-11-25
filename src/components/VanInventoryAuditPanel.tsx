import React, { useMemo, useState } from 'react';
import {
  PackageCheck,
  AlertTriangle,
  ClipboardCheck,
  Warehouse,
  CheckCircle2,
  Package
} from 'lucide-react';
import { Currency, Language, VanStockItem } from '../types/index.ts';
import { formatCurrency } from '../utils/format.ts';

interface VanInventoryAuditPanelProps {
  driverId: string;
  vanStock: VanStockItem[];
  vanUnloadRecords: any[];
  currency: Currency;
  language: Language;
  onRefreshVanData: () => Promise<void>;
  onFeedback: (fb: { type: 'success' | 'error'; text: string }) => void;
}

export const VanInventoryAuditPanel: React.FC<VanInventoryAuditPanelProps> = ({
  driverId,
  vanStock,
  vanUnloadRecords,
  currency,
  language,
  onRefreshVanData,
  onFeedback
}) => {
  const isAr = language === 'ar';
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [isUnloading, setIsUnloading] = useState(false);
  const [unloadNotes, setUnloadNotes] = useState('');

  const summary = useMemo(() => {
    const loadedVal = vanStock.reduce((s, i) => s + i.loadedQuantity * i.unitPriceIQD, 0);
    const remainingVal = vanStock.reduce((s, i) => s + i.remainingQuantity * i.unitPriceIQD, 0);
    const totalRemaining = vanStock.reduce((s, i) => s + i.remainingQuantity, 0);
    const totalDamaged = vanStock.reduce((s, i) => s + i.damagedQuantity, 0);

    const nowMs = Date.now();
    const fefoAlerts = vanStock.filter((item) => {
      if (!item.expiryDate || item.remainingQuantity <= 0) return false;
      const diffDays = Math.ceil((new Date(item.expiryDate).getTime() - nowMs) / (1000 * 60 * 60 * 24));
      return diffDays <= 45;
    });

    return { loadedVal, remainingVal, totalRemaining, totalDamaged, fefoAlerts };
  }, [vanStock]);

  const getCountValue = (item: VanStockItem) => {
    if (counts[item.barcode] !== undefined) return counts[item.barcode];
    return String(item.lastPhysicalCountQty ?? item.remainingQuantity);
  };

  const handleRunPhysicalAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (vanStock.length === 0 || isAuditing) return;
    setIsAuditing(true);
    try {
      const payload = vanStock.map((item) => ({
        barcode: item.barcode,
        countedQuantity: Math.max(0, Math.floor(Number(getCountValue(item)) || 0))
      }));
      const res = await fetch('/api/van/physical-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, counts: payload })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (isAr ? 'فشل اعتماد الجرد الفعلي' : 'Audit failed'));
      }
      setAuditResult(data.data);
      onFeedback({
        type: 'success',
        text: isAr
          ? `تم اعتماد الجرد الفعلي للفان (${data.data.totalMatched} صنف مطابق، ${data.data.totalDiscrepancies} فروقات).`
          : `Physical audit saved (${data.data.totalMatched} matched, ${data.data.totalDiscrepancies} variances).`
      });
      await onRefreshVanData();
    } catch (err: any) {
      onFeedback({
        type: 'error',
        text: err?.message || (isAr ? 'تعذر حفظ الجرد الفعلي' : 'Audit error')
      });
    } finally {
      setIsAuditing(false);
    }
  };

  const handleUnloadToWarehouse = async () => {
    if (isUnloading) return;
    setIsUnloading(true);
    try {
      const res = await fetch('/api/van/unload-warehouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, notes: unloadNotes })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (isAr ? 'تعذر ترحيل الحمولة للمستودع' : 'Unload failed'));
      }
      setUnloadNotes('');
      onFeedback({
        type: 'success',
        text: data.message
      });
      await onRefreshVanData();
    } catch (err: any) {
      onFeedback({
        type: 'error',
        text: err?.message || (isAr ? 'تعذر الترحيل للمستودع' : 'Unload error')
      });
    } finally {
      setIsUnloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-black text-[#142018] flex items-center gap-2">
            <PackageCheck className="w-4.5 h-4.5 text-[#0B5D32]" />
            <span>{isAr ? 'جرد حمولة الفان، تتبع الدفعات (FEFO) والترحيل للمستودع' : 'Van Stock Audit, Batch/FEFO & Warehouse Unload'}</span>
          </h2>
          <p className="text-[11px] text-[#5F7164] mt-0.5">
            {isAr
              ? 'مراقبة الصلاحية حسب رقم الدفعة (الأقرب انتهاءً يخرج أولاً)، مطابقة الجرد الفعلي، وإرجاع المتبقي نهاية اليوم.'
              : 'Track FEFO batch expiry dates, verify physical stock counts, and unload remaining stock to the warehouse.'}
          </p>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3">
          <div className="text-[10.5px] font-bold text-[#5F7164]">
            {isAr ? 'قيمة الحمولة المبدئية' : 'Loaded Value'}
          </div>
          <div className="text-sm font-black font-mono tabular-nums text-[#142018] mt-1">
            {formatCurrency(summary.loadedVal, currency, language)}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3">
          <div className="text-[10.5px] font-bold text-[#5F7164]">
            {isAr ? 'قيمة المتبقي بالفان' : 'Remaining Stock Value'}
          </div>
          <div className="text-sm font-black font-mono tabular-nums text-[#0B5D32] mt-1">
            {formatCurrency(summary.remainingVal, currency, language)}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3">
          <div className="text-[10.5px] font-bold text-[#5F7164]">
            {isAr ? 'دفعات قريبة الانتهاء' : 'FEFO Expiry Alerts'}
          </div>
          <div
            className={`text-sm font-black font-mono tabular-nums mt-1 ${
              summary.fefoAlerts.length > 0 ? 'text-[#D97706]' : 'text-[#0B5D32]'
            }`}
          >
            {summary.fefoAlerts.length} {isAr ? 'أصناف' : 'SKUs'}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3">
          <div className="text-[10.5px] font-bold text-[#5F7164]">
            {isAr ? 'بضاعة تالفة معزولة' : 'Damaged Quarantined'}
          </div>
          <div className="text-sm font-black font-mono tabular-nums text-[#DC2626] mt-1">
            {summary.totalDamaged} {isAr ? 'وحدة' : 'units'}
          </div>
        </div>
      </div>

      {/* FEFO Warning Strip */}
      {summary.fefoAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-black text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              {isAr
                ? 'أولوية الصرف حسب الصلاحية (FEFO): أصناف في الفان تنتهي خلال 45 يوماً — يُنصح ببيعها أولاً:'
                : 'FEFO Priority Batches (expiring within 45 days):'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {summary.fefoAlerts.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-amber-200 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-bold text-[#142018] truncate">{item.productName}</div>
                  <div className="text-[10.5px] text-[#5F7164] font-mono">
                    {item.batchNumber || 'LOT-STD'} · {isAr ? 'ينتهي:' : 'Exp:'} {item.expiryDate}
                  </div>
                </div>
                <span className="font-mono font-black text-amber-800 shrink-0 tabular-nums">
                  {item.remainingQuantity} {isAr ? 'متبقي' : 'left'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Physical Audit & Lot Table */}
      <form onSubmit={handleRunPhysicalAudit} className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-[#142018] flex items-center gap-1.5">
              <ClipboardCheck className="w-4 h-4 text-[#0B5D32]" />
              <span>{isAr ? 'جدول الجرد الفعلي ومطابقة الدفعات' : 'Van Stock Ledger & Physical Count'}</span>
            </h3>
            <p className="text-[11px] text-[#5F7164]">
              {isAr
                ? 'أدخل العدد الفعلي داخل صندوق الفان لمقارنته برصيد النظام قبل إغلاق الوردية.'
                : 'Enter physical count inside the van to reconcile against system inventory.'}
            </p>
          </div>
          <button
            type="submit"
            disabled={isAuditing || vanStock.length === 0}
            className="px-4 py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084725] disabled:bg-gray-300 text-white text-xs font-black cursor-pointer shrink-0"
          >
            {isAuditing
              ? isAr ? 'جاري المطابقة...' : 'Auditing...'
              : isAr ? 'اعتماد الجرد الفعلي' : 'Submit Physical Count'}
          </button>
        </div>

        {vanStock.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#5F7164]">
            <Package className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
            {isAr ? 'لا توجد بضاعة محمّلة في الفان حالياً' : 'Van cargo is currently empty'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start border-collapse">
              <thead>
                <tr className="border-b border-[#DCE5DC] text-[11px] text-[#5F7164] font-bold">
                  <th className="py-2 px-2 text-start">{isAr ? 'الصنف والدفعة' : 'Product & Lot'}</th>
                  <th className="py-2 px-2 text-center">{isAr ? 'محمّل' : 'Loaded'}</th>
                  <th className="py-2 px-2 text-center">{isAr ? 'مباع' : 'Sold'}</th>
                  <th className="py-2 px-2 text-center">{isAr ? 'مرتجع / تالف' : 'Ret / Dmg'}</th>
                  <th className="py-2 px-2 text-center">{isAr ? 'رصيد النظام' : 'System'}</th>
                  <th className="py-2 px-2 text-center">{isAr ? 'الجرد الفعلي' : 'Physical'}</th>
                  <th className="py-2 px-2 text-end">{isAr ? 'الفرق' : 'Variance'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEFEA]">
                {vanStock.map((item) => {
                  const physicalVal = Number(getCountValue(item));
                  const diff = Number.isFinite(physicalVal) ? physicalVal - item.remainingQuantity : 0;
                  return (
                    <tr key={item.id} className="hover:bg-[#F8FAF7]">
                      <td className="py-2.5 px-2 min-w-[190px]">
                        <div className="font-bold text-[#142018]">{item.productName}</div>
                        <div className="text-[10.5px] text-[#5F7164] font-mono mt-0.5">
                          {item.batchNumber || 'LOT-STD'}
                          {item.expiryDate ? ` · ${item.expiryDate}` : ''}
                          {item.bulkDiscountMinQty && item.bulkUnitPriceIQD
                            ? ` · ${isAr ? `خصم +${item.bulkDiscountMinQty}` : `Tier +${item.bulkDiscountMinQty}`}`
                            : ''}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono tabular-nums font-semibold">
                        {item.loadedQuantity}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono tabular-nums font-semibold text-[#0B5D32]">
                        {item.soldQuantity}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono tabular-nums text-[#5F7164]">
                        {item.returnedQuantity} / <span className="text-[#DC2626]">{item.damagedQuantity}</span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono tabular-nums font-black text-[#142018]">
                        {item.remainingQuantity}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          min={0}
                          value={getCountValue(item)}
                          onChange={(e) =>
                            setCounts((prev) => ({ ...prev, [item.barcode]: e.target.value }))
                          }
                          className="w-16 text-center bg-[#F8FAF7] border border-[#DCE5DC] focus:border-[#0B5D32] rounded-lg py-1 font-mono font-black text-[#0B5D32] tabular-nums"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-end font-mono tabular-nums font-black">
                        <span
                          className={
                            diff === 0
                              ? 'text-[#0B5D32]'
                              : diff > 0
                              ? 'text-blue-700'
                              : 'text-[#DC2626]'
                          }
                        >
                          {diff === 0 ? '0 ✓' : diff > 0 ? `+${diff}` : diff}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {auditResult && (
          <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#065F46]">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {isAr
                  ? `آخر جرد معتمد: ${auditResult.totalMatched} مطابق · ${auditResult.totalDiscrepancies} فروقات`
                  : `Last Audit: ${auditResult.totalMatched} matched · ${auditResult.totalDiscrepancies} discrepancies`}
              </span>
            </div>
            <span className="font-mono font-black tabular-nums">
              {isAr ? 'صافي قيمة الفرق:' : 'Net Variance:'}{' '}
              {formatCurrency(auditResult.netVarianceValueIQD, currency, language)}
            </span>
          </div>
        )}
      </form>

      {/* End-of-Day Warehouse Unload Manifest */}
      <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-[#142018] flex items-center gap-1.5">
              <Warehouse className="w-4 h-4 text-[#0B5D32]" />
              <span>{isAr ? 'ترحيل المتبقي والتالف إلى المستودع الرئيسي' : 'End-of-Day Warehouse Unload'}</span>
            </h3>
            <p className="text-[11px] text-[#5F7164] mt-0.5">
              {isAr
                ? `إرجاع ${summary.totalRemaining} وحدة سليمة و ${summary.totalDamaged} وحدة تالفة إلى مستودع المورد وإصدار إشعار تفريغ.`
                : `Return ${summary.totalRemaining} remaining units and ${summary.totalDamaged} damaged units to supplier warehouse.`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={unloadNotes}
              onChange={(e) => setUnloadNotes(e.target.value)}
              placeholder={isAr ? 'ملاحظة أمين المخزن...' : 'Warehouse note...'}
              className="bg-[#F8FAF7] border border-[#DCE5DC] rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#0B5D32]"
            />
            <button
              type="button"
              disabled={isUnloading || (summary.totalRemaining === 0 && summary.totalDamaged === 0)}
              onClick={handleUnloadToWarehouse}
              className="px-4 py-2 rounded-xl bg-[#142018] hover:bg-black disabled:bg-gray-300 text-white text-xs font-black cursor-pointer whitespace-nowrap"
            >
              {isUnloading
                ? isAr ? 'جاري الترحيل...' : 'Unloading...'
                : isAr ? 'إصدار إشعار تفريغ للمستودع' : 'Unload to Warehouse'}
            </button>
          </div>
        </div>

        {vanUnloadRecords.length > 0 && (
          <div className="divide-y divide-[#EAEFEA] pt-2 border-t border-[#EAEFEA]">
            {vanUnloadRecords.map((rec) => (
              <div key={rec.id} className="py-2 flex items-center justify-between text-xs gap-2">
                <div>
                  <span className="font-mono font-black text-[#0B5D32]">{rec.manifestNumber}</span>
                  <span className="text-[#5F7164] mx-2">·</span>
                  <span className="font-semibold text-[#142018]">{rec.notes}</span>
                </div>
                <div className="font-mono font-bold tabular-nums text-[#4B6352] shrink-0">
                  {rec.totalUnitsReturned} {isAr ? 'وحدة' : 'units'} ({formatCurrency(rec.totalValueIQD, currency, language)})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
