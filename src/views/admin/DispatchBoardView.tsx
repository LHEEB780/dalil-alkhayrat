import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  History,
  KeyRound,
  Package,
  RefreshCw,
  RotateCcw,
  Search,
  Snowflake,
  Store,
  Truck,
  UserCheck,
  UserMinus,
  X,
  XCircle
} from 'lucide-react';
import { ConfirmWithReasonDialog } from '../../components/admin/ConfirmWithReasonDialog.tsx';
import {
  Currency,
  DeliveryJob,
  DeliveryJobStatus,
  Language
} from '../../types/index.ts';
import { formatCurrency } from '../../utils/format.ts';
import { translations } from '../../utils/translations.ts';

interface EnrichedDispatchJob extends DeliveryJob {
  governorateNameAr: string;
  governorateNameEn: string;
  zoneNameAr: string;
  zoneNameEn: string;
  assignedPartnerName: string | null;
  assignedDriverName: string | null;
  assignedDriverPhone: string | null;
  assignedDriverType: 'platform' | 'partner' | null;
  assignedVehiclePlate: string | null;
  assignedVehicleClass: string | null;
  subOrderStatus: string | null;
  itemsSummary: Array<{
    barcode: string;
    productName: string;
    unit: string;
    quantity: number;
    totalPriceIQD: number;
  }>;
  minutesOpen: number;
  isStaleOpen: boolean;
}

interface DispatchCounts {
  all: number;
  open: number;
  staleOpen: number;
  staleThresholdMinutes: number;
  assigned: number;
  inProgress: number;
  delivered: number;
  deliveredToday: number;
  failed: number;
  cancelled: number;
  ordersEligibleToConvert: number;
  platformOrdersMissingJob: number;
}

interface ConvertibleOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  storeName: string;
  storeCity: string;
  status: string;
  deliveryType?: string;
  paymentMethod: string;
  subtotalIQD: number;
  createdAt: string;
}

interface DriverCandidate {
  driver: {
    id: string;
    name: string;
    phone: string;
    providerType: 'platform' | 'partner';
    availability?: 'online' | 'offline';
    accountStatus: string;
    governorateId: string;
    serviceZoneIds: string[];
    partnerName?: string;
  };
  partner: {
    id: string;
    name: string;
    type: 'individual' | 'company';
    accountStatus: string;
  } | null;
  defaultVehicle: {
    id: string;
    plateNumber: string;
    vehicleClass: string;
    capacityUnits: number;
    temperatureSupport: string[];
    status: string;
  } | null;
  selectableVehicles: Array<{
    id: string;
    plateNumber: string;
    vehicleClass: string;
    capacityUnits: number;
    temperatureSupport: string[];
    status: string;
  }>;
  eligibility: {
    eligible: boolean;
    reasonsAr: string[];
    reasonsEn: string[];
    activeJobsCount: number;
    maxActiveJobs: number;
  };
}

interface DispatchBoardViewProps {
  language: Language;
  currency: Currency;
  initialDeepLink?: {
    selectedId?: string | null;
    filterPreset?: string | null;
  };
  onDataChanged?: () => void;
}

const ADMIN_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
  'x-user-role': 'admin'
};

export const DispatchBoardView: React.FC<DispatchBoardViewProps> = ({
  language,
  currency,
  initialDeepLink,
  onDataChanged
}) => {
  const isAr = language === 'ar';
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<
    'all' | 'open' | 'assigned' | 'in_progress' | 'delivered' | 'failed' | 'convertible'
  >('open');
  const [governorateFilter, setGovernorateFilter] = useState<string>('all');
  const [staleOnly, setStaleOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [jobs, setJobs] = useState<EnrichedDispatchJob[]>([]);
  const [counts, setCounts] = useState<DispatchCounts | null>(null);
  const [convertibleOrders, setConvertibleOrders] = useState<ConvertibleOrder[]>([]);
  const [governorates, setGovernorates] = useState<Array<{ id: string; nameAr: string; nameEn: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Detail / Assign Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailJob, setDetailJob] = useState<EnrichedDispatchJob | null>(null);
  const [candidates, setCandidates] = useState<DriverCandidate[]>([]);
  const [detailAuditLogs, setDetailAuditLogs] = useState<any[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [assignMode, setAssignMode] = useState(false);

  // ConfirmWithReason dialog state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    actionType: 'assign' | 'unassign' | 'cancel' | 'reopen' | 'convert' | null;
    targetId: string;
    title: string;
    description: string;
    danger: boolean;
  }>({
    isOpen: false,
    actionType: null,
    targetId: '',
    title: '',
    description: '',
    danger: false
  });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const fetchGeo = useCallback(async () => {
    try {
      const res = await fetch('/api/geography');
      const json = await res.json();
      if (res.ok && json?.success && Array.isArray(json.data?.governorates)) {
        setGovernorates(json.data.governorates);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchDispatchJobs = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'convertible') {
        params.set('tab', activeTab);
      } else {
        params.set('tab', 'all');
      }
      if (governorateFilter !== 'all') params.set('governorateId', governorateFilter);
      if (staleOnly) params.set('staleOnly', 'true');
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/dispatch/jobs?${params.toString()}`, {
        headers: { 'x-user-role': 'admin' }
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || t.error);
      }
      setJobs(json.data.items || []);
      setCounts(json.data.counts || null);
      setConvertibleOrders(json.data.convertibleOrders || []);
    } catch (err: any) {
      setErrorMsg(err?.message || t.error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, governorateFilter, staleOnly, searchQuery, t.error]);

  useEffect(() => {
    fetchGeo();
  }, [fetchGeo]);

  useEffect(() => {
    fetchDispatchJobs();
  }, [fetchDispatchJobs]);

  const openJobModal = useCallback(
    async (jobId: string, startAssign = false) => {
      setDetailModalOpen(true);
      setAssignMode(startAssign);
      setDetailLoading(true);
      try {
        const res = await fetch(`/api/admin/dispatch/jobs/${encodeURIComponent(jobId)}`, {
          headers: { 'x-user-role': 'admin' }
        });
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.message || t.error);
        }
        setDetailJob(json.data.job);
        const list: DriverCandidate[] = json.data.driverCandidates || [];
        setCandidates(list);
        setDetailAuditLogs(json.data.auditLogs || []);
        const firstEligible = list.find((c) => c.eligibility.eligible);
        if (firstEligible) {
          setSelectedDriverId(firstEligible.driver.id);
          setSelectedVehicleId(firstEligible.defaultVehicle?.id || '');
        } else {
          setSelectedDriverId('');
          setSelectedVehicleId('');
        }
      } catch (err: any) {
        setErrorMsg(err?.message || t.error);
        setDetailModalOpen(false);
      } finally {
        setDetailLoading(false);
      }
    },
    [t.error]
  );

  useEffect(() => {
    if (initialDeepLink?.filterPreset === 'failed') {
      setActiveTab('failed');
    } else if (initialDeepLink?.filterPreset === 'stale') {
      setActiveTab('open');
      setStaleOnly(true);
    }
    if (initialDeepLink?.selectedId && initialDeepLink.selectedId.startsWith('djob_')) {
      openJobModal(initialDeepLink.selectedId, false);
    }
  }, [initialDeepLink, openJobModal]);

  const formatStatusBadge = (status: DeliveryJobStatus) => {
    const map: Record<DeliveryJobStatus, { ar: string; en: string; cls: string }> = {
      open: { ar: 'مفتوحة بانتظار التوزيع', en: 'Open', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
      assigned: { ar: 'مسندة إدارياً', en: 'Assigned', cls: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
      accepted: { ar: 'مقبولة من الشريك', en: 'Accepted', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
      at_pickup: { ar: 'في المستودع للاستلام', en: 'At Pickup', cls: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
      picked_up: { ar: 'تم الاستلام من المستودع', en: 'Picked Up', cls: 'bg-sky-50 text-sky-800 border-sky-200' },
      in_transit: { ar: 'في الطريق للمتجر', en: 'In Transit', cls: 'bg-teal-50 text-teal-800 border-teal-200' },
      at_dropoff: { ar: 'وصل للمتجر', en: 'At Store', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      delivered: { ar: 'مكتملة ومسلمة', en: 'Delivered', cls: 'bg-emerald-100 text-[#00A046] border-emerald-300' },
      failed: { ar: 'فاشلة', en: 'Failed', cls: 'bg-red-50 text-red-700 border-red-200' },
      cancelled: { ar: 'ملغاة', en: 'Cancelled', cls: 'bg-gray-100 text-gray-600 border-gray-300' }
    };
    const item = map[status] || map.open;
    return (
      <span className={`px-2 py-0.5 rounded-md border text-[11px] font-extrabold ${item.cls}`}>
        {isAr ? item.ar : item.en}
      </span>
    );
  };

  const formatTempLabel = (temp: string) => {
    if (temp === 'frozen') return isAr ? 'مجمد' : 'Frozen';
    if (temp === 'chilled') return isAr ? 'مبرد' : 'Chilled';
    return isAr ? 'عادي/جاف' : 'Ambient';
  };

  const formatFailureReason = (code?: string) => {
    switch (code) {
      case 'store_closed':
        return isAr ? 'المتجر مغلق' : 'Store Closed';
      case 'customer_refused':
        return isAr ? 'رفض الاستلام' : 'Customer Refused';
      case 'address_not_found':
        return isAr ? 'تعذر العثور على العنوان' : 'Address Not Found';
      case 'vehicle_issue':
        return isAr ? 'عطل في المركبة' : 'Vehicle Issue';
      default:
        return isAr ? 'سبب آخر' : 'Other';
    }
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString(isAr ? 'ar-IQ' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  const handleConfirmExecute = async (reason: string) => {
    if (!confirmState.actionType) return;
    setConfirmLoading(true);
    setConfirmError(null);
    try {
      let url = '';
      let body: Record<string, any> = { reason };

      if (confirmState.actionType === 'assign') {
        url = `/api/admin/dispatch/jobs/${encodeURIComponent(confirmState.targetId)}/assign`;
        body = { driverId: selectedDriverId, vehicleId: selectedVehicleId, reason };
      } else if (confirmState.actionType === 'unassign') {
        url = `/api/admin/dispatch/jobs/${encodeURIComponent(confirmState.targetId)}/unassign`;
      } else if (confirmState.actionType === 'cancel') {
        url = `/api/admin/dispatch/jobs/${encodeURIComponent(confirmState.targetId)}/cancel`;
      } else if (confirmState.actionType === 'reopen') {
        url = `/api/admin/dispatch/jobs/${encodeURIComponent(confirmState.targetId)}/reopen`;
      } else if (confirmState.actionType === 'convert') {
        url = `/api/admin/dispatch/orders/${encodeURIComponent(confirmState.targetId)}/convert-to-platform`;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: ADMIN_HEADERS,
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || t.error);
      }

      setConfirmState((prev) => ({ ...prev, isOpen: false, actionType: null }));
      if (confirmState.actionType === 'assign' || confirmState.actionType === 'reopen') {
        setDetailModalOpen(false);
      }
      if (confirmState.actionType === 'convert') {
        setActiveTab('open');
      }
      await fetchDispatchJobs();
      onDataChanged?.();
    } catch (err: any) {
      setConfirmError(err?.message || t.error);
    } finally {
      setConfirmLoading(false);
    }
  };

  const selectedCandidate = candidates.find((c) => c.driver.id === selectedDriverId);

  const tabs: Array<{
    id: typeof activeTab;
    label: string;
    count?: number;
    alert?: boolean;
  }> = [
    { id: 'open', label: t.adminDispatchTabOpen, count: counts?.open, alert: (counts?.staleOpen || 0) > 0 },
    { id: 'assigned', label: t.adminDispatchTabAssigned, count: counts?.assigned },
    { id: 'in_progress', label: t.adminDispatchTabInProgress, count: counts?.inProgress },
    { id: 'failed', label: t.adminDispatchTabFailed, count: counts?.failed, alert: (counts?.failed || 0) > 0 },
    { id: 'delivered', label: t.adminDispatchTabDelivered, count: counts?.delivered },
    { id: 'all', label: t.adminDispatchTabAll, count: counts?.all },
    { id: 'convertible', label: t.adminDispatchTabConvertible, count: counts?.ordersEligibleToConvert }
  ];

  return (
    <div className="space-y-4 font-brand">
      {/* Header & KPI Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-black text-[#221F1F]">
              {t.adminDispatchTitle}
            </h1>
            <p className="text-xs sm:text-sm text-[#797878] mt-0.5">
              {t.adminDispatchSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={fetchDispatchJobs}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-xs font-bold text-[#221F1F] cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t.adminRefresh}</span>
          </button>
        </div>

        {/* KPI Cards */}
        {counts && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('open');
                setStaleOnly(false);
              }}
              className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-start hover:border-[#00A046] cursor-pointer"
            >
              <div className="text-[11px] font-bold text-[#797878]">
                {isAr ? 'مهام مفتوحة' : 'Open Jobs'}
              </div>
              <div className="text-lg font-black text-[#221F1F] tabular-nums mt-0.5">
                {counts.open}
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('open');
                setStaleOnly((s) => !s);
              }}
              className={`p-3 rounded-xl border text-start cursor-pointer ${
                counts.staleOpen > 0
                  ? 'border-red-200 bg-red-50/70'
                  : 'border-[#E5E7EB] bg-[#F9FAFB]'
              }`}
            >
              <div className="text-[11px] font-bold text-red-700">
                {isAr
                  ? `متأخرة (>${counts.staleThresholdMinutes}د)`
                  : `Overdue (>${counts.staleThresholdMinutes}m)`}
              </div>
              <div className="text-lg font-black text-red-700 tabular-nums mt-0.5">
                {counts.staleOpen}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('in_progress')}
              className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-start hover:border-[#00A046] cursor-pointer"
            >
              <div className="text-[11px] font-bold text-[#797878]">
                {isAr ? 'نشطة / في الطريق' : 'Assigned / In Transit'}
              </div>
              <div className="text-lg font-black text-[#221F1F] tabular-nums mt-0.5">
                {counts.assigned + counts.inProgress}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('failed')}
              className={`p-3 rounded-xl border text-start cursor-pointer ${
                counts.failed > 0
                  ? 'border-rose-200 bg-rose-50/70'
                  : 'border-[#E5E7EB] bg-[#F9FAFB]'
              }`}
            >
              <div className="text-[11px] font-bold text-rose-700">
                {isAr ? 'مهام فاشلة' : 'Failed Jobs'}
              </div>
              <div className="text-lg font-black text-rose-700 tabular-nums mt-0.5">
                {counts.failed}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('delivered')}
              className="p-3 rounded-xl border border-[#E5E7EB] bg-emerald-50/50 text-start hover:border-[#00A046] cursor-pointer col-span-2 sm:col-span-1"
            >
              <div className="text-[11px] font-bold text-[#00A046]">
                {isAr ? 'مسلّمة اليوم / الإجمالي' : 'Delivered Today / Total'}
              </div>
              <div className="text-lg font-black text-[#00A046] tabular-nums mt-0.5">
                {counts.deliveredToday}{' '}
                <span className="text-xs font-bold text-[#4A4747]">/ {counts.delivered}</span>
              </div>
            </button>
          </div>
        )}

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#F3F4F6]">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== 'open') setStaleOnly(false);
                }}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#00A046] text-white'
                    : 'bg-[#F9FAFB] text-[#4A4747] border border-[#E5E7EB] hover:bg-[#F3F4F6]'
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-black tabular-nums ${
                      active
                        ? 'bg-white/25 text-white'
                        : tab.alert
                        ? 'bg-red-100 text-red-700'
                        : 'bg-[#E5E7EB] text-[#221F1F]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        {activeTab !== 'convertible' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <div className="relative sm:col-span-1">
              <Search
                className={`w-3.5 h-3.5 text-[#797878] absolute top-1/2 -translate-y-1/2 ${
                  isAr ? 'right-3' : 'left-3'
                }`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isAr ? 'ابحث برقم المهمة، الطلب، المتجر أو السائق...' : 'Search job, order, store or driver...'
                }
                className={`w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] py-2 text-xs text-[#221F1F] focus:bg-white focus:outline-none focus:border-[#00A046] ${
                  isAr ? 'pr-8 pl-3' : 'pl-8 pr-3'
                }`}
              />
            </div>

            <select
              value={governorateFilter}
              onChange={(e) => setGovernorateFilter(e.target.value)}
              className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold text-[#221F1F]"
            >
              <option value="all">{isAr ? 'جميع المحافظات' : 'All Governorates'}</option>
              {governorates.map((g) => (
                <option key={g.id} value={g.id}>
                  {isAr ? g.nameAr : g.nameEn}
                </option>
              ))}
            </select>

            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-xs font-bold text-[#221F1F] cursor-pointer">
              <input
                type="checkbox"
                checked={staleOnly}
                onChange={(e) => setStaleOnly(e.target.checked)}
                className="rounded border-gray-300 text-[#00A046] focus:ring-[#00A046]"
              />
              <span>
                {isAr ? 'إظهار المهام المتأخرة فقط' : 'Show overdue jobs only'}
              </span>
            </label>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold flex items-center justify-between gap-2">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} className="p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB: CONVERTIBLE SUPPLIER ORDERS */}
      {activeTab === 'convertible' ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#221F1F]">
                {isAr
                  ? 'تحويل طلبات أسطول الموردين إلى شبكة توصيل المنصة'
                  : 'Convert Supplier-Fleet Orders to Platform Delivery'}
              </h2>
              <p className="text-xs text-[#797878]">
                {isAr
                  ? 'يمكن تحويل أي طلب قيد الانتظار أو مقبول قبل إسناده لسائق المورد؛ وعند اعتماده ستُفتح له مهمة في لوحة التوزيع.'
                  : 'Any pending or approved order can be routed via Platform Delivery before driver assignment.'}
              </p>
            </div>
          </div>

          {convertibleOrders.length === 0 ? (
            <div className="py-10 text-center text-xs font-bold text-[#797878]">
              {isAr ? 'لا توجد طلبات مؤهلة للتحويل حالياً' : 'No eligible supplier orders right now'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {convertibleOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3.5 space-y-2.5 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-black text-[#221F1F]" dir="ltr">
                        {ord.id}
                      </div>
                      <div className="text-xs font-bold text-[#4A4747] mt-0.5">
                        {ord.supplierName} ← {ord.storeName} ({ord.storeCity})
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-[10px] font-bold text-[#4A4747]">
                      {ord.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E5E7EB]">
                    <span className="font-black text-[#00A046] tabular-nums">
                      {formatCurrency(ord.subtotalIQD, currency, language)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmError(null);
                        setConfirmState({
                          isOpen: true,
                          actionType: 'convert',
                          targetId: ord.id,
                          title: isAr
                            ? 'تحويل الطلب إلى شبكة توصيل المنصة'
                            : 'Convert Order to Platform Delivery',
                          description: isAr
                            ? `سيتم تحويل مسار توصيل الطلب (${ord.id}) من أسطول المورد إلى شبكة توصيل المنصة، ${
                                ord.status === 'approved'
                                  ? 'وفتح مهمة توصيل مفتوحة فوراً في لوحة التوزيع.'
                                  : 'وستُفتح مهمة تلقائياً فور اعتماد المورد.'
                              }`
                            : `Route order ${ord.id} through Platform Delivery Network.`,
                          danger: false
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00A046] hover:bg-[#008A3C] text-white text-xs font-bold cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>{t.adminDispatchConvertBtn}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* JOBS LIST */
        <div className="space-y-3">
          {loading && jobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center text-xs font-bold text-[#797878]">
              {t.loading}
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center text-xs font-bold text-[#797878]">
              {t.adminDispatchEmpty}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className={`bg-white rounded-2xl border p-4 shadow-xs space-y-3 ${
                    job.isStaleOpen
                      ? 'border-red-300 ring-1 ring-red-200'
                      : job.status === 'failed'
                      ? 'border-rose-300'
                      : 'border-[#E5E7EB]'
                  }`}
                >
                  {/* Top Meta Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-black text-[#221F1F]" dir="ltr">
                        {job.id}
                      </span>
                      <span className="text-[11px] font-bold text-[#797878]" dir="ltr">
                        ({job.subOrderId})
                      </span>
                      {formatStatusBadge(job.status)}
                      {job.isStaleOpen && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black">
                          <Clock className="w-3 h-3" />
                          <span>
                            {t.adminDispatchStaleBadge} ({job.minutesOpen} {isAr ? 'د' : 'm'})
                          </span>
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] font-semibold text-[#797878]">
                      {isAr ? job.governorateNameAr : job.governorateNameEn}
                      {job.zoneNameAr
                        ? ` • ${isAr ? job.zoneNameAr : job.zoneNameEn}`
                        : ''}
                    </span>
                  </div>

                  {/* Route Pickup -> Dropoff */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1 text-[10px] font-extrabold text-[#00A046]">
                        <Building2 className="w-3 h-3" />
                        <span>{isAr ? 'الاستلام (المستودع)' : 'Pickup (Supplier)'}</span>
                      </div>
                      <div className="text-xs font-extrabold text-[#221F1F] truncate">
                        {job.pickup.name}
                      </div>
                      <div className="text-[11px] text-[#797878] truncate">
                        {job.pickup.city} • {job.pickup.address}
                      </div>
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1 text-[10px] font-extrabold text-blue-700">
                        <Store className="w-3 h-3" />
                        <span>{isAr ? 'التسليم (المتجر)' : 'Dropoff (Store)'}</span>
                      </div>
                      <div className="text-xs font-extrabold text-[#221F1F] truncate">
                        {job.dropoff.name}
                      </div>
                      <div className="text-[11px] text-[#797878] truncate">
                        {job.dropoff.city} • {job.dropoff.address}
                      </div>
                    </div>
                  </div>

                  {/* Load & Payment Specs */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-bold text-[#4A4747]">
                    <span className="inline-flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-[#00A046]" />
                      {job.unitsCount} {isAr ? 'وحدة' : 'units'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Snowflake className="w-3.5 h-3.5 text-sky-600" />
                      {formatTempLabel(job.requiredTemperature)}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded border text-[10px] font-extrabold ${
                        job.paymentMethod === 'cod'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {job.paymentMethod === 'cod'
                        ? isAr
                          ? 'دفع عند الاستلام (COD)'
                          : 'COD'
                        : isAr
                        ? 'آجل (Credit)'
                        : 'Credit'}
                    </span>
                    <span className="text-[#00A046] font-black tabular-nums">
                      {isAr ? 'أجرة الشريك:' : 'Payout:'}{' '}
                      {formatCurrency(job.estimatedPayoutIQD, currency, language)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#797878]">
                      <KeyRound className="w-3 h-3" />
                      {t.adminDispatchPickupPinLabel}:{' '}
                      <strong className="text-[#221F1F]" dir="ltr">
                        {job.pickupPin}
                      </strong>
                    </span>
                    {job.attempts > 0 && (
                      <span className="text-[#797878]">
                        {t.adminDispatchAttemptsLabel}: {job.attempts}
                      </span>
                    )}
                  </div>

                  {/* Assigned Driver Info */}
                  {job.assignedDriverName && (
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-blue-50/60 border border-blue-200 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Truck className="w-4 h-4 text-blue-700 shrink-0" />
                        <div className="truncate">
                          <span className="font-extrabold text-[#221F1F]">
                            {job.assignedDriverName}
                          </span>
                          {job.assignedPartnerName && (
                            <span className="text-[11px] text-[#4A4747]">
                              {' '}
                              • {job.assignedPartnerName}
                            </span>
                          )}
                        </div>
                      </div>
                      {job.assignedVehiclePlate && (
                        <span
                          dir="ltr"
                          className="px-2 py-0.5 rounded bg-white border border-blue-200 text-[11px] font-black text-blue-800"
                        >
                          {job.assignedVehiclePlate}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Failure Box */}
                  {job.status === 'failed' && job.failure && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs space-y-1">
                      <div className="font-black text-red-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{formatFailureReason(job.failure.reasonCode)}</span>
                      </div>
                      <p className="text-red-700 text-[11px]">{job.failure.note}</p>
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F3F4F6]">
                    <span className="text-[10px] font-semibold text-[#797878]">
                      {formatTime(job.createdAt)}
                    </span>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openJobModal(job.id, false)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-xs font-bold text-[#221F1F] cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t.details}</span>
                      </button>

                      {job.status === 'open' && (
                        <button
                          type="button"
                          onClick={() => openJobModal(job.id, true)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#00A046] hover:bg-[#008A3C] text-white text-xs font-bold cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{t.adminDispatchAssignBtn}</span>
                        </button>
                      )}

                      {['assigned', 'accepted', 'at_pickup'].includes(job.status) && (
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmError(null);
                            setConfirmState({
                              isOpen: true,
                              actionType: 'unassign',
                              targetId: job.id,
                              title: t.adminDispatchUnassignBtn,
                              description: isAr
                                ? `سيتم سحب التعيين من (${job.assignedDriverName}) وإعادة المهمة (${job.id}) إلى قائمة المهام المفتوحة.`
                                : `Unassign driver from job ${job.id} and return it to Open.`,
                              danger: true
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-900 cursor-pointer"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          <span>{t.adminDispatchUnassignBtn}</span>
                        </button>
                      )}

                      {(job.status === 'failed' || job.status === 'cancelled') && (
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmError(null);
                            setConfirmState({
                              isOpen: true,
                              actionType: 'reopen',
                              targetId: job.id,
                              title: t.adminDispatchReopenBtn,
                              description: isAr
                                ? `سيتم إنشاء مهمة توصيل جديدة مفتوحة للطلب (${job.subOrderId}) مع الاحتفاظ بسجل المحاولة السابقة (${job.attempts} محاولات).`
                                : `Create a new open delivery job for sub-order ${job.subOrderId}.`,
                              danger: false
                            });
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#00A046] hover:bg-[#008A3C] text-white text-xs font-bold cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{t.adminDispatchReopenBtn}</span>
                        </button>
                      )}

                      {!['delivered', 'cancelled'].includes(job.status) && (
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmError(null);
                            setConfirmState({
                              isOpen: true,
                              actionType: 'cancel',
                              targetId: job.id,
                              title: t.adminDispatchCancelBtn,
                              description: isAr
                                ? `سيتم إلغاء مهمة التوصيل (${job.id}) دون إلغاء الطلبية الأصلية.`
                                : `Cancel delivery job ${job.id}.`,
                              danger: true
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-bold text-red-700 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{t.adminDispatchCancelBtn}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* JOB DETAIL & DRIVER ASSIGNMENT MODAL */}
      {detailModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
              <div>
                <h2 className="text-base font-black text-[#221F1F]">
                  {assignMode
                    ? isAr
                      ? 'توزيع مهمة التوصيل واختيار السائق والمركبة'
                      : 'Assign Delivery Driver & Vehicle'
                    : isAr
                    ? 'تفاصيل مهمة التوصيل والخط الزمني'
                    : 'Delivery Job Details & Timeline'}
                </h2>
                {detailJob && (
                  <p className="text-xs text-[#797878]" dir="ltr">
                    {detailJob.id} • {detailJob.subOrderId}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="p-1.5 rounded-lg text-[#797878] hover:bg-white hover:text-[#221F1F] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {detailLoading || !detailJob ? (
                <div className="py-10 text-center text-xs font-bold text-[#797878]">
                  {t.loading}
                </div>
              ) : (
                <>
                  {/* Job Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                      <div className="text-[10px] font-bold text-[#797878]">
                        {isAr ? 'الحالة' : 'Status'}
                      </div>
                      <div className="mt-1">{formatStatusBadge(detailJob.status)}</div>
                    </div>
                    <div className="p-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                      <div className="text-[10px] font-bold text-[#797878]">
                        {isAr ? 'الحمولة والتبريد' : 'Load & Temp'}
                      </div>
                      <div className="text-xs font-black text-[#221F1F] mt-1">
                        {detailJob.unitsCount} • {formatTempLabel(detailJob.requiredTemperature)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                      <div className="text-[10px] font-bold text-[#797878]">
                        {t.adminDispatchPickupPinLabel}
                      </div>
                      <div className="text-sm font-black text-[#00A046] mt-1" dir="ltr">
                        {detailJob.pickupPin}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                      <div className="text-[10px] font-bold text-[#797878]">
                        {isAr ? 'أجرة التوصيل' : 'Est. Payout'}
                      </div>
                      <div className="text-xs font-black text-[#00A046] mt-1">
                        {formatCurrency(detailJob.estimatedPayoutIQD, currency, language)}
                      </div>
                    </div>
                  </div>

                  {/* Eligibility & Assignment Selector for Open Jobs */}
                  {detailJob.status === 'open' && (
                    <div className="space-y-3 border border-[#E5E7EB] rounded-2xl p-4 bg-[#F9FAFB]">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-[#221F1F]">
                          {isAr
                            ? 'السائقون والشركاء المرشحون (فحص الأهلية الآلي)'
                            : 'Driver & Vehicle Eligibility Check'}
                        </h3>
                        <span className="text-[11px] font-bold text-[#797878]">
                          {candidates.filter((c) => c.eligibility.eligible).length}{' '}
                          {isAr ? 'مؤهل' : 'eligible'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {candidates.map((cand) => {
                          const isSelected = selectedDriverId === cand.driver.id;
                          return (
                            <div
                              key={cand.driver.id}
                              onClick={() => {
                                if (!cand.eligibility.eligible) return;
                                setSelectedDriverId(cand.driver.id);
                                setSelectedVehicleId(cand.defaultVehicle?.id || '');
                              }}
                              className={`rounded-xl border p-3 transition-colors ${
                                !cand.eligibility.eligible
                                  ? 'bg-gray-50 border-gray-200 opacity-75'
                                  : isSelected
                                  ? 'bg-emerald-50 border-[#00A046] ring-1 ring-[#00A046] cursor-pointer'
                                  : 'bg-white border-[#E5E7EB] hover:border-[#00A046] cursor-pointer'
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <div className="text-xs font-black text-[#221F1F] flex items-center gap-1.5">
                                    <span>{cand.driver.name}</span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                                        cand.driver.providerType === 'platform'
                                          ? 'bg-emerald-100 text-[#00A046]'
                                          : 'bg-blue-100 text-blue-800'
                                      }`}
                                    >
                                      {cand.driver.providerType === 'platform'
                                        ? isAr
                                          ? 'سائق منصة'
                                          : 'Platform'
                                        : isAr
                                        ? 'شريك'
                                        : 'Partner'}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-[#797878]">
                                    {cand.driver.phone} •{' '}
                                    {isAr ? 'المهام النشطة:' : 'Active:'}{' '}
                                    {cand.eligibility.activeJobsCount}/{cand.eligibility.maxActiveJobs}
                                  </div>
                                </div>

                                {cand.eligibility.eligible ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-[#00A046] text-[10px] font-black">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>{isAr ? 'مؤهل للتنفيذ' : 'Eligible'}</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-extrabold">
                                    {isAr ? 'غير مؤهل' : 'Ineligible'}
                                  </span>
                                )}
                              </div>

                              {cand.eligibility.eligible && cand.selectableVehicles.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-[#E5E7EB] flex flex-wrap items-center gap-2">
                                  <span className="text-[11px] font-bold text-[#4A4747]">
                                    {isAr ? 'المركبة:' : 'Vehicle:'}
                                  </span>
                                  <select
                                    value={
                                      isSelected
                                        ? selectedVehicleId || cand.defaultVehicle?.id || ''
                                        : cand.defaultVehicle?.id || ''
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      setSelectedDriverId(cand.driver.id);
                                      setSelectedVehicleId(e.target.value);
                                    }}
                                    className="rounded-lg border border-[#D1D5DB] bg-white px-2.5 py-1 text-xs font-bold text-[#221F1F]"
                                  >
                                    {cand.selectableVehicles
                                      .filter((v) => v.status === 'active')
                                      .map((v) => (
                                        <option key={v.id} value={v.id}>
                                          {v.plateNumber} ({v.capacityUnits}{' '}
                                          {isAr ? 'وحدة' : 'u'})
                                        </option>
                                      ))}
                                  </select>
                                </div>
                              )}

                              {!cand.eligibility.eligible && (
                                <ul className="mt-1.5 text-[11px] text-red-700 list-disc list-inside space-y-0.5">
                                  {(isAr
                                    ? cand.eligibility.reasonsAr
                                    : cand.eligibility.reasonsEn
                                  ).map((r, idx) => (
                                    <li key={idx}>{r}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          disabled={!selectedDriverId}
                          onClick={() => {
                            if (!selectedCandidate) return;
                            setConfirmError(null);
                            setConfirmState({
                              isOpen: true,
                              actionType: 'assign',
                              targetId: detailJob.id,
                              title: t.adminDispatchAssignBtn,
                              description: isAr
                                ? `إسناد المهمة (${detailJob.id}) إلى ${selectedCandidate.driver.name} وسيتم تحديث حالة الطلب (${detailJob.subOrderId}) إلى مسند لسائق.`
                                : `Assign job ${detailJob.id} to ${selectedCandidate.driver.name}.`,
                              danger: false
                            });
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00A046] hover:bg-[#008A3C] disabled:opacity-50 text-white text-xs font-extrabold cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>{t.adminDispatchAssignBtn}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Line Items */}
                  {detailJob.itemsSummary?.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-black text-[#221F1F]">
                        {isAr ? 'محتويات الشحنة' : 'Shipment Items'}
                      </h3>
                      <div className="rounded-xl border border-[#E5E7EB] divide-y divide-[#F3F4F6]">
                        {detailJob.itemsSummary.map((item) => (
                          <div
                            key={item.barcode}
                            className="p-2.5 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-[#221F1F]">{item.productName}</div>
                              <div className="text-[10px] text-[#797878]">
                                {item.unit} • {item.barcode}
                              </div>
                            </div>
                            <span className="font-black text-[#00A046]">× {item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black text-[#221F1F] flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-[#00A046]" />
                      <span>{isAr ? 'الخط الزمني للمهمة' : 'Job History Timeline'}</span>
                    </h3>
                    <div className="space-y-2">
                      {(detailJob.history || []).map((h, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] flex items-start justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="font-extrabold text-[#221F1F]">
                              {h.status} — {h.actorName || h.actorType}
                            </div>
                            {h.note && <div className="text-[11px] text-[#4A4747] mt-0.5">{h.note}</div>}
                          </div>
                          <span className="text-[10px] text-[#797878] shrink-0">
                            {formatTime(h.at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Audit Logs */}
                  {detailAuditLogs.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-black text-[#221F1F]">
                        {isAr ? 'سجل التدقيق الإداري المرتبط' : 'Related Admin Audit Log'}
                      </h3>
                      <div className="space-y-1.5">
                        {detailAuditLogs.map((log) => (
                          <div
                            key={log.id}
                            className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-[#00A046]">{log.action}</span>
                              <span className="text-[10px] text-[#797878]">{formatTime(log.at)}</span>
                            </div>
                            <div className="font-bold text-[#221F1F] mt-0.5">
                              {isAr ? log.summaryAr : log.summaryEn || log.summaryAr}
                            </div>
                            {log.reason && (
                              <div className="text-[11px] text-[#4A4747] mt-0.5">
                                {t.adminAuditReasonLabel} {log.reason}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Reason Dialog */}
      <ConfirmWithReasonDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        description={confirmState.description}
        danger={confirmState.danger}
        loading={confirmLoading}
        serverError={confirmError}
        language={language}
        onConfirm={handleConfirmExecute}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
