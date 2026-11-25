import React from 'react';
import {
  BarChart3,
  Target,
  Award,
  TrendingUp,
  MapPin,
  ShoppingBag,
  Truck,
  Wifi,
  WifiOff,
  Lock,
  RefreshCw
} from 'lucide-react';
import { Currency, Language, VanKPIs, VanStockItem } from '../types/index.ts';
import { formatCurrency } from '../utils/format.ts';

interface VanPerformancePanelProps {
  commissionSummary: any;
  kpis: VanKPIs | null;
  vanStock: VanStockItem[];
  currency: Currency;
  language: Language;
  driverName?: string;
  vehiclePlate?: string;
  vanWarehouseName?: string;
  availabilityStatus?: 'available' | 'busy';
  isOnline?: boolean;
  currentCashCollectedIQD?: number;
  totalRemainingUnits?: number;
  totalSoldUnits?: number;
  pendingOrdersCount?: number;
  assignedOrdersCount?: number;
  loading?: boolean;
  onRefresh?: () => void;
  onOpenShiftClose?: () => void;
  onOpenManage?: () => void;
  onOpenDeliveries?: () => void;
}

export const VanPerformancePanel: React.FC<VanPerformancePanelProps> = ({
  commissionSummary,
  kpis,
  vanStock,
  currency,
  language,
  driverName,
  vehiclePlate,
  vanWarehouseName,
  availabilityStatus = 'available',
  isOnline = true,
  currentCashCollectedIQD = 0,
  totalRemainingUnits = 0,
  totalSoldUnits = 0,
  pendingOrdersCount = 0,
  assignedOrdersCount = 0,
  loading = false,
  onRefresh,
  onOpenShiftClose,
  onOpenManage,
  onOpenDeliveries
}) => {
  const isAr = language === 'ar';

  const topSoldSkus = [...vanStock]
    .sort((a, b) => b.soldQuantity * b.unitPriceIQD - a.soldQuantity * a.unitPriceIQD)
    .slice(0, 6);

  return (
    <div className="space-y-4">
      {/* 1. Executive Driver Summary & Shift Custody Header */}
      <div className="bg-gradient-to-b from-[#DCEAD9] via-[#EFF6ED] to-white rounded-2xl border border-[#BBD0BB] p-4 space-y-3.5 shadow-lg shadow-[#0B5D32]/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0F7A43] to-[#074423] text-white flex items-center justify-center shadow-lg shadow-[#0B5D32]/35 ring-4 ring-[#0B5D32]/15 shrink-0">
              <Truck className="w-6 h-6 text-[#FFE600]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-[#0B5D32] leading-tight truncate">
                  {driverName || (isAr ? 'أحمد كاظم البغدادي' : 'Van Sales Rep')}
                </h2>
                {vehiclePlate && (
                  <span className="text-[11px] font-mono font-bold text-[#4B6352] whitespace-nowrap">
                    {vehiclePlate}
                  </span>
                )}
                <button
                  type="button"
                  onClick={onOpenManage}
                  className={`inline-flex items-center gap-1 text-[10.5px] font-black px-2 py-0.5 rounded-full border cursor-pointer transition ${
                    availabilityStatus === 'busy'
                      ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      : 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0] hover:bg-[#D1FAE5]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      availabilityStatus === 'busy' ? 'bg-amber-500' : 'bg-[#00A046]'
                    }`}
                  />
                  <span>
                    {availabilityStatus === 'busy'
                      ? isAr ? 'مشغول' : 'Busy'
                      : isAr ? 'متاح' : 'Available'}
                  </span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#5F7164] mt-0.5 flex-wrap">
                <span className="truncate">{vanWarehouseName || (isAr ? 'فان رقم 1' : 'Van #1')}</span>
                <span aria-hidden="true">·</span>
                {isOnline ? (
                  <span className="inline-flex items-center gap-1 text-[#0B5D32] font-bold whitespace-nowrap">
                    <Wifi className="w-3 h-3" />
                    <span>{isAr ? 'متصل بالمستودع' : 'Online'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700 font-bold whitespace-nowrap">
                    <WifiOff className="w-3 h-3" />
                    <span>{isAr ? 'أوفلاين' : 'Offline'}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenShiftClose && (
              <button
                type="button"
                onClick={onOpenShiftClose}
                className="min-h-[38px] px-3.5 py-2 rounded-full bg-[#FFA300] hover:bg-[#e69200] text-[#142018] font-black text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shadow-2xs"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isAr ? 'إغلاق الوردية ومطابقة الصندوق' : 'Close Shift & Reconcile'}</span>
              </button>
            )}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#DCEBD8] to-[#F3F8F1] border border-[#B7CEB7] hover:border-[#0B5D32] flex items-center justify-center text-[#0B5D32] shadow-md shadow-[#0B5D32]/20 ring-4 ring-[#0B5D32]/10 transition cursor-pointer shrink-0"
                title={isAr ? 'تحديث مؤشرات الأداء' : 'Refresh KPIs'}
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* 3-KPI Custody Strip */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 pt-1">
          <div className="bg-[#F8FAF7] rounded-2xl border border-[#DCE5DC] p-3 sm:p-3.5">
            <div className="text-[10.5px] sm:text-[11px] font-bold text-[#5F7164] truncate">
              {isAr ? 'الكاش المحصّل في العهدة' : 'Cash in Custody'}
            </div>
            <div className="text-sm sm:text-lg font-black font-mono tabular-nums text-[#0B5D32] mt-1 truncate">
              {formatCurrency(currentCashCollectedIQD, currency, language)}
            </div>
          </div>

          <div className="bg-[#F8FAF7] rounded-2xl border border-[#DCE5DC] p-3 sm:p-3.5">
            <div className="text-[10.5px] sm:text-[11px] font-bold text-[#5F7164] truncate">
              {isAr ? 'المتبقي بالفان' : 'Remaining Stock'}
            </div>
            <div className="text-sm sm:text-lg font-black font-mono tabular-nums text-[#142018] mt-1 flex items-baseline gap-1.5">
              <span>{totalRemainingUnits}</span>
              <span className="text-[10px] font-sans font-semibold text-[#5F7164] truncate">
                {isAr ? `وحدة · مباع ${totalSoldUnits}` : `left · ${totalSoldUnits} sold`}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenDeliveries}
            className="bg-[#F8FAF7] rounded-2xl border border-[#DCE5DC] hover:border-[#0B5D32]/50 p-3 sm:p-3.5 text-start transition cursor-pointer"
          >
            <div className="text-[10.5px] sm:text-[11px] font-bold text-[#5F7164] truncate">
              {isAr ? 'طلبيات للتسليم' : 'Pending Orders'}
            </div>
            <div className="text-sm sm:text-lg font-black font-mono tabular-nums text-[#142018] mt-1 flex items-baseline gap-1.5">
              <span className={pendingOrdersCount > 0 ? 'text-amber-700' : 'text-[#0B5D32]'}>
                {pendingOrdersCount}
              </span>
              <span className="text-[10px] font-sans font-semibold text-[#5F7164] truncate">
                {isAr ? `من ${assignedOrdersCount}` : `of ${assignedOrdersCount}`}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Daily Target Progress + Commission Earned + Sales Breakdown */}
      {commissionSummary && (
        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-black text-[#142018] flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-[#0B5D32]" />
                  <span>{isAr ? 'هدف المبيعات والتحصيل اليومي' : 'Daily Sales & Collection Target'}</span>
                </span>
                <span className="font-mono font-black text-[#0B5D32] tabular-nums">
                  {commissionSummary.targetProgressPercent}%
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#EAEFEA] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#0B5D32] transition-all duration-300"
                  style={{ width: `${commissionSummary.targetProgressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#5F7164] font-mono tabular-nums">
                <span>
                  {isAr ? 'المحقق: ' : 'Achieved: '}
                  <strong className="text-[#142018]">
                    {formatCurrency(commissionSummary.totalAchievedIQD, currency, language)}
                  </strong>
                </span>
                <span>
                  {isAr ? 'الهدف: ' : 'Target: '}
                  {formatCurrency(commissionSummary.dailyTargetIQD, currency, language)}
                </span>
              </div>
            </div>

            <div className="sm:border-s sm:border-[#EAEFEA] sm:ps-4 flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#0B5D32] flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10.5px] font-bold text-[#5F7164]">
                  {isAr
                    ? `عمولتك اليوم (${commissionSummary.commissionRatePercent}%)`
                    : `Today's Commission (${commissionSummary.commissionRatePercent}%)`}
                </div>
                <div className="text-sm font-black font-mono tabular-nums text-[#0B5D32]">
                  {formatCurrency(commissionSummary.estimatedCommissionIQD, currency, language)}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
            <div className="bg-[#F8FAF7] border border-[#EAEFEA] rounded-xl p-2.5">
              <div className="text-[10.5px] text-[#5F7164] font-bold">{isAr ? 'مبيعات نقدية' : 'Cash Sales'}</div>
              <div className="font-mono font-black text-[#142018] tabular-nums mt-0.5">
                {formatCurrency(commissionSummary.todayCashSalesIQD || 0, currency, language)}
              </div>
            </div>
            <div className="bg-[#F8FAF7] border border-[#EAEFEA] rounded-xl p-2.5">
              <div className="text-[10.5px] text-[#5F7164] font-bold">{isAr ? 'مبيعات آجلة' : 'Credit Sales'}</div>
              <div className="font-mono font-black text-[#142018] tabular-nums mt-0.5">
                {formatCurrency(commissionSummary.todayCreditSalesIQD || 0, currency, language)}
              </div>
            </div>
            <div className="bg-[#F8FAF7] border border-[#EAEFEA] rounded-xl p-2.5">
              <div className="text-[10.5px] text-[#5F7164] font-bold">{isAr ? 'تحصيل ديون' : 'Debt Collected'}</div>
              <div className="font-mono font-black text-[#0B5D32] tabular-nums mt-0.5">
                {formatCurrency(commissionSummary.todayDebtCollectedIQD || 0, currency, language)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. 4 Core DSD Execution KPI Cards */}
      <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-[#142018] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#0B5D32]" />
            <span>{isAr ? 'مؤشرات الأداء التنفيذية للمندوب (DSD KPIs)' : 'Executive DSD KPIs'}</span>
          </h3>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-[#F8FAF7] rounded-2xl border border-[#EAEFEA] p-3.5">
            <div className="text-[11px] font-bold text-[#5F7164] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#0B5D32]" />
              <span>{isAr ? 'نسبة البيع من الزيارات (Strike Rate)' : 'Strike Rate'}</span>
            </div>
            <div className="text-xl font-black font-mono tabular-nums text-[#0B5D32] mt-1.5">
              {kpis?.strikeRatePercent ?? 0}%
            </div>
            <div className="text-[10.5px] text-[#5F7164] mt-0.5 tabular-nums">
              {kpis?.soldStops ?? 0} {isAr ? `محل اشترى من ${kpis?.totalStops ?? 0}` : `sold of ${kpis?.totalStops ?? 0}`}
            </div>
          </div>

          <div className="bg-[#F8FAF7] rounded-2xl border border-[#EAEFEA] p-3.5">
            <div className="text-[11px] font-bold text-[#5F7164] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#0B5D32]" />
              <span>{isAr ? 'التزام التغطية للمسار' : 'Visit Compliance'}</span>
            </div>
            <div className="text-xl font-black font-mono tabular-nums text-[#142018] mt-1.5">
              {kpis?.visitCompliancePercent ?? 0}%
            </div>
            <div className="text-[10.5px] text-[#5F7164] mt-0.5 tabular-nums">
              {kpis?.visitedOrSoldStops ?? 0} / {kpis?.totalStops ?? 0} {isAr ? 'محطة' : 'stops'}
            </div>
          </div>

          <div className="bg-[#F8FAF7] rounded-2xl border border-[#EAEFEA] p-3.5">
            <div className="text-[11px] font-bold text-[#5F7164] flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-[#0B5D32]" />
              <span>{isAr ? 'متوسط حجم الفاتورة (Drop Size)' : 'Avg Drop Size'}</span>
            </div>
            <div className="text-lg font-black font-mono tabular-nums text-[#142018] mt-1.5">
              {formatCurrency(kpis?.averageDropSizeIQD ?? 0, currency, language)}
            </div>
            <div className="text-[10.5px] text-[#5F7164] mt-0.5">
              {isAr ? 'متوسط قيمة الطلب الواحد' : 'Per invoice average'}
            </div>
          </div>

          <div className="bg-[#F8FAF7] rounded-2xl border border-[#EAEFEA] p-3.5">
            <div className="text-[11px] font-bold text-[#5F7164] flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#0B5D32]" />
              <span>{isAr ? 'العمولة المستحقة اليوم' : 'Commission Earned'}</span>
            </div>
            <div className="text-lg font-black font-mono tabular-nums text-[#0B5D32] mt-1.5">
              {formatCurrency(commissionSummary?.estimatedCommissionIQD ?? 0, currency, language)}
            </div>
            <div className="text-[10.5px] text-[#5F7164] mt-0.5 tabular-nums">
              {isAr ? `بنسبة ${commissionSummary?.commissionRatePercent ?? 1.5}%` : `At ${commissionSummary?.commissionRatePercent ?? 1.5}% rate`}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Top Performing SKUs */}
      <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3">
        <h3 className="text-sm font-black text-[#142018]">
          {isAr ? 'أعلى الأصناف مبيعاً من حمولة الفان اليوم' : 'Top Performing Van SKUs Today'}
        </h3>
        {topSoldSkus.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#5F7164]">
            {isAr ? 'لا توجد بيانات مبيعات متاحة' : 'No SKU velocity data'}
          </div>
        ) : (
          <div className="space-y-2.5">
            {topSoldSkus.map((item) => {
              const sellThrough =
                item.loadedQuantity > 0
                  ? Math.min(100, Math.round((item.soldQuantity / item.loadedQuantity) * 100))
                  : 0;
              const revenue = item.soldQuantity * item.unitPriceIQD;
              return (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[#142018] truncate">{item.productName}</span>
                    <div className="font-mono font-black text-[#0B5D32] tabular-nums shrink-0">
                      {item.soldQuantity}/{item.loadedQuantity} ({sellThrough}%) · {formatCurrency(revenue, currency, language)}
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#EAEFEA] overflow-hidden">
                    <div className="h-full rounded-full bg-[#0B5D32]" style={{ width: `${sellThrough}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
