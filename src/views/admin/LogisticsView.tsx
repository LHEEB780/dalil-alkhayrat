import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BadgeDollarSign,
  CheckCircle2,
  ExternalLink,
  Package,
  RefreshCw,
  Truck
} from 'lucide-react';
import { Currency, Language } from '../../types/index.ts';
import { formatCurrency } from '../../utils/format.ts';
import { translations } from '../../utils/translations.ts';

const ADMIN_API_HEADERS: HeadersInit = {
  'x-user-role': 'admin'
};

interface LogisticsDriverRow {
  id: string;
  name: string;
  phone: string;
  supplierId: string;
  supplierName: string;
  vehiclePlate: string;
  vehicleType: string;
  accountStatus: string;
  isActiveShift: boolean;
  availabilityStatus: string;
  todayDeliveriesCount: number;
  activeOrdersCount: number;
  activeOrders: {
    id: string;
    storeName: string;
    status: string;
    subtotalIQD: number;
  }[];
  currentCashCollectedIQD: number;
  vanStockUnits: number;
  vanStockValueIQD: number;
  lowStockItemsCount: number;
  routeStopsTotal: number;
  routeStopsCompleted: number;
}

interface LogisticsOverviewData {
  kpis: {
    totalDrivers: number;
    activeShiftDrivers: number;
    activeAssignedOrders: number;
    totalCashInCustodyIQD: number;
    pendingVanLoadRequests: number;
    alertsCount: number;
  };
  drivers: LogisticsDriverRow[];
  vanLoadRequests: {
    id: string;
    driverId: string;
    driverName: string;
    supplierId: string;
    status: 'pending_approval' | 'approved' | 'rejected';
    requestedAt: string;
    reviewedAt?: string;
    totalUnits: number;
    notes?: string;
  }[];
  alerts: {
    suspendedDriversWithActiveOrders: LogisticsDriverRow[];
    lowStockActiveVans: LogisticsDriverRow[];
  };
}

interface LogisticsViewProps {
  language: Language;
  currency: Currency;
  onOpenOrder?: (orderId: string) => void;
}

export const LogisticsView: React.FC<LogisticsViewProps> = ({
  language,
  currency,
  onOpenOrder
}) => {
  const isAr = language === 'ar';
  const t = translations[language];

  const [tab, setTab] = useState<'drivers' | 'requests'>('drivers');
  const [data, setData] = useState<LogisticsOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/logistics/overview', {
        headers: ADMIN_API_HEADERS
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || t.error);
      }
      setData(json.data);
    } catch (err: any) {
      setError(err?.message || t.error);
    } finally {
      setLoading(false);
    }
  }, [t.error]);

  useEffect(() => {
    fetchLogistics();
  }, [fetchLogistics]);

  const kpis = data?.kpis;
  const drivers = data?.drivers || [];
  const requests = data?.vanLoadRequests || [];
  const suspendedAlerts = data?.alerts.suspendedDriversWithActiveOrders || [];
  const lowStockAlerts = data?.alerts.lowStockActiveVans || [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl sm:rounded-2xl border border-[#E5E7EB] p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[#221F1F]">{t.adminLogTitle}</h1>
          <p className="text-xs sm:text-sm text-[#797878] mt-0.5">{t.adminLogSubtitle}</p>
        </div>
        <button
          type="button"
          onClick={fetchLogistics}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-xs font-bold text-[#221F1F] cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{t.adminRefresh}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs font-bold text-red-700">
          {error}
        </div>
      )}

      {/* Alerts */}
      {suspendedAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-red-800">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{t.adminLogAlertSuspendedTitle}</span>
          </div>
          <div className="space-y-2">
            {suspendedAlerts.map((drv) => (
              <div
                key={drv.id}
                className="bg-white rounded-xl border border-red-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-black text-[#221F1F]">{drv.name}</span>
                  <span className="text-[#797878] ms-1.5">
                    ({drv.vehiclePlate} • {drv.accountStatus})
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {drv.activeOrders.map((ord) => (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => onOpenOrder?.(ord.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold hover:bg-red-700 cursor-pointer"
                    >
                      <span>{ord.id}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lowStockAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-amber-900">
            <Package className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{t.adminLogAlertLowStockTitle}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockAlerts.map((drv) => (
              <span
                key={drv.id}
                className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-xs font-bold text-[#221F1F]"
              >
                {drv.name}: {drv.vanStockUnits} {isAr ? 'وحدة' : 'units'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#797878]">
              <span>{isAr ? 'السائقون بالخدمة' : 'Active Shift Drivers'}</span>
              <Truck className="w-4 h-4 text-[#00A046]" />
            </div>
            <div className="text-lg font-black text-[#221F1F] mt-1">
              {kpis.activeShiftDrivers} / {kpis.totalDrivers}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#797878]">
              <span>{isAr ? 'طلبات قيد التوصيل' : 'Active Assigned Orders'}</span>
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-lg font-black text-[#221F1F] mt-1">{kpis.activeAssignedOrders}</div>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#797878]">
              <span>{isAr ? 'العهدة النقدية لدى السائقين' : 'Total Cash Custody'}</span>
              <BadgeDollarSign className="w-4 h-4 text-[#00A046]" />
            </div>
            <div className="text-base sm:text-lg font-black text-[#00A046] mt-1 truncate">
              {formatCurrency(kpis.totalCashInCustodyIQD, currency, language)}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#797878]">
              <span>{isAr ? 'طلبات تحميل معلقة' : 'Pending Load Requests'}</span>
              <CheckCircle2 className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-lg font-black text-[#221F1F] mt-1">
              {kpis.pendingVanLoadRequests}
            </div>
          </div>
        </div>
      )}

      {/* Tabs + Content */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-[#E5E7EB] p-3.5 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
          <button
            type="button"
            onClick={() => setTab('drivers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
              tab === 'drivers'
                ? 'bg-[#00A046] text-white'
                : 'bg-[#F9FAFB] text-[#374151] border border-[#E5E7EB]'
            }`}
          >
            {t.adminLogDriversTab} ({drivers.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('requests')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
              tab === 'requests'
                ? 'bg-[#00A046] text-white'
                : 'bg-[#F9FAFB] text-[#374151] border border-[#E5E7EB]'
            }`}
          >
            {t.adminLogRequestsTab} ({requests.length})
          </button>
        </div>

        {tab === 'drivers' ? (
          drivers.length === 0 ? (
            <div className="py-10 text-center text-xs font-bold text-[#797878]">{t.adminLogEmpty}</div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="space-y-3 md:hidden">
                {drivers.map((d) => (
                  <div
                    key={d.id}
                    className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-black text-[#221F1F]">{d.name}</div>
                        <div className="text-[10px] text-[#797878]">
                          {d.vehiclePlate} • {d.supplierName}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                          d.accountStatus === 'active'
                            ? 'bg-emerald-50 text-[#00A046]'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {d.accountStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[#797878]">{isAr ? 'تسليمات اليوم:' : 'Today:'}</span>{' '}
                        <strong className="text-[#221F1F]">{d.todayDeliveriesCount}</strong>
                      </div>
                      <div>
                        <span className="text-[#797878]">{isAr ? 'طلبات نشطة:' : 'Active:'}</span>{' '}
                        <strong className="text-[#221F1F]">{d.activeOrdersCount}</strong>
                      </div>
                      <div>
                        <span className="text-[#797878]">{isAr ? 'العهدة:' : 'Cash:'}</span>{' '}
                        <strong className="text-[#00A046]">
                          {formatCurrency(d.currentCashCollectedIQD, currency, language)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#797878]">{isAr ? 'مخزون الفان:' : 'Van Stock:'}</span>{' '}
                        <strong className="text-[#221F1F]">
                          {d.vanStockUnits} ({formatCurrency(d.vanStockValueIQD, currency, language)})
                        </strong>
                      </div>
                    </div>

                    {d.activeOrders.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#E5E7EB]">
                        {d.activeOrders.map((ord) => (
                          <button
                            key={ord.id}
                            type="button"
                            onClick={() => onOpenOrder?.(ord.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-[#E5E7EB] text-[10px] font-bold text-[#00A046] cursor-pointer"
                          >
                            <span>{ord.id}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-[#797878]">
                      <th className="py-2.5 text-start font-bold">{isAr ? 'السائق والمركبة' : 'Driver & Vehicle'}</th>
                      <th className="py-2.5 text-start font-bold">{isAr ? 'المورد' : 'Supplier'}</th>
                      <th className="py-2.5 text-center font-bold">{isAr ? 'الحالة' : 'Status'}</th>
                      <th className="py-2.5 text-center font-bold">{isAr ? 'تسليمات اليوم' : 'Today'}</th>
                      <th className="py-2.5 text-center font-bold">{isAr ? 'طلبات نشطة' : 'Active'}</th>
                      <th className="py-2.5 text-end font-bold">{isAr ? 'العهدة النقدية' : 'Cash Custody'}</th>
                      <th className="py-2.5 text-end font-bold">{isAr ? 'حمولة الفان' : 'Van Stock'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {drivers.map((d) => (
                      <tr key={d.id} className="hover:bg-[#F9FAFB]">
                        <td className="py-3">
                          <div className="font-black text-[#221F1F]">{d.name}</div>
                          <div className="text-[10px] text-[#797878]">
                            {d.vehiclePlate} • {d.vehicleType}
                          </div>
                        </td>
                        <td className="py-3 font-semibold text-[#374151]">{d.supplierName}</td>
                        <td className="py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                              d.accountStatus === 'active'
                                ? d.isActiveShift
                                  ? 'bg-emerald-50 text-[#00A046]'
                                  : 'bg-gray-100 text-gray-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {d.accountStatus !== 'active'
                              ? d.accountStatus
                              : d.isActiveShift
                              ? isAr
                                ? 'بالخدمة'
                                : 'On Shift'
                              : isAr
                              ? 'خارج الوردية'
                              : 'Off Shift'}
                          </span>
                        </td>
                        <td className="py-3 text-center font-bold text-[#221F1F]">
                          {d.todayDeliveriesCount}
                        </td>
                        <td className="py-3 text-center">
                          {d.activeOrders.length === 0 ? (
                            <span className="text-[#797878]">0</span>
                          ) : (
                            <div className="flex flex-wrap justify-center gap-1">
                              {d.activeOrders.map((ord) => (
                                <button
                                  key={ord.id}
                                  type="button"
                                  onClick={() => onOpenOrder?.(ord.id)}
                                  className="px-2 py-0.5 rounded bg-emerald-50 text-[#00A046] text-[10px] font-bold hover:underline cursor-pointer"
                                >
                                  {ord.id}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3 text-end font-black text-[#00A046]">
                          {formatCurrency(d.currentCashCollectedIQD, currency, language)}
                        </td>
                        <td className="py-3 text-end">
                          <div className="font-bold text-[#221F1F]">
                            {d.vanStockUnits} {isAr ? 'وحدة' : 'units'}
                          </div>
                          <div className="text-[10px] text-[#797878]">
                            {formatCurrency(d.vanStockValueIQD, currency, language)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )
        ) : requests.length === 0 ? (
          <div className="py-10 text-center text-xs font-bold text-[#797878]">
            {isAr ? 'لا توجد طلبات تحميل فان مسجلة حالياً' : 'No van load requests logged yet'}
          </div>
        ) : (
          <div className="space-y-2.5">
            {requests.map((r) => (
              <div
                key={r.id}
                className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-black text-[#221F1F]">
                    {r.id} — {r.driverName}
                  </div>
                  <div className="text-[11px] text-[#797878]">
                    {r.totalUnits} {isAr ? 'وحدة' : 'units'} • {new Date(r.requestedAt).toLocaleString(isAr ? 'ar-IQ' : 'en-US')}
                  </div>
                </div>
                <span
                  className={`self-start sm:self-auto px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold ${
                    r.status === 'approved'
                      ? 'bg-emerald-50 text-[#00A046]'
                      : r.status === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
