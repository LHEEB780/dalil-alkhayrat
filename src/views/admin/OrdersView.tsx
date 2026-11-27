import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Ban,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  History,
  KeyRound,
  MessageSquarePlus,
  Package,
  RefreshCw,
  RotateCcw,
  Scale,
  Search,
  ShieldAlert,
  ShoppingBag,
  Store,
  Truck,
  X
} from 'lucide-react';
import { ConfirmWithReasonDialog } from '../../components/admin/ConfirmWithReasonDialog.tsx';
import { Currency, Language } from '../../types/index.ts';
import { formatCurrency } from '../../utils/format.ts';
import { translations } from '../../utils/translations.ts';

const ADMIN_API_HEADERS: HeadersInit = {
  'x-user-role': 'admin'
};

interface OrderListItem {
  id: string;
  parentOrderId: string;
  supplierId: string;
  supplierName: string;
  storeId: string;
  storeName: string;
  storePhone: string;
  storeCity: string;
  storeAddress: string;
  items: {
    barcode: string;
    productName: string;
    unit: string;
    quantity: number;
    unitPriceIQD: number;
    totalPriceIQD: number;
  }[];
  subtotalIQD: number;
  paymentMethod: 'cod' | 'credit' | 'wallet' | 'online';
  status:
    | 'pending'
    | 'approved'
    | 'assigned_driver'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled'
    | 'disputed';
  deliveryType: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedDriverStatus?: string | null;
  deliveryPin: string;
  paidAt?: string;
  deliveredAt?: string;
  createdAt: string;
  notes?: string;
  isStuck: boolean;
  stuckType: 'pending_24h' | 'delivery_48h' | null;
  hoursInStage: number;
  hasOpenDispute: boolean;
  openDisputeId: string | null;
  allowedTransitions: string[];
  adminFlags?: {
    forcedDelivery?: boolean;
    cancelledByAdmin?: boolean;
  };
  statusHistory?: {
    status: string;
    at: string;
    actorType: string;
    actorName?: string;
    reason?: string;
    note?: string;
  }[];
}

interface OrdersListPayload {
  items: OrderListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  counts: {
    all: number;
    pending: number;
    approved: number;
    assigned_driver: number;
    out_for_delivery: number;
    delivered: number;
    disputed: number;
    cancelled: number;
    stuck: number;
  };
  filterOptions: {
    cities: string[];
    suppliers: { id: string; companyName: string }[];
    stores: { id: string; name: string }[];
    drivers: {
      id: string;
      name: string;
      supplierId: string;
      supplierName: string;
      vehiclePlate: string;
      accountStatus: string;
    }[];
  };
}

interface OrderDetailPayload {
  order: OrderListItem;
  store: {
    id: string;
    name: string;
    ownerName: string;
    phone: string;
    city: string;
    district: string;
    address: string;
    accountStatus: string;
  } | null;
  supplier: {
    id: string;
    companyName: string;
    contactPerson: string;
    phone: string;
    city: string;
    accountStatus: string;
  } | null;
  driver: {
    id: string;
    name: string;
    phone: string;
    vehiclePlate: string;
    vehicleType: string;
    accountStatus: string;
  } | null;
  siblingSubOrders: {
    id: string;
    supplierId: string;
    supplierName: string;
    subtotalIQD: number;
    status: string;
  }[];
  creditAccount: {
    id: string;
    creditLimitIQD: number;
    currentUsedCreditIQD: number;
    availableCreditIQD: number;
    isBlocked: boolean;
  } | null;
  ledgerEntries: {
    id: string;
    referenceType: string;
    referenceId: string;
    entryDate: string;
    debitIQD: number;
    creditIQD: number;
    descriptionAr: string;
    isReversed: boolean;
    reversalReason?: string;
  }[];
  disputes: {
    id: string;
    reasonCode: string;
    status: string;
    description: string;
    claimedAmountIQD?: number;
    createdAt: string;
  }[];
  adminNotes: {
    id: string;
    at: string;
    author: string;
    text: string;
  }[];
  auditLogs: {
    id: string;
    at: string;
    actorName: string;
    action: string;
    summaryAr: string;
    summaryEn?: string;
    reason?: string;
  }[];
  availableDrivers: {
    id: string;
    name: string;
    supplierId: string;
    supplierName: string;
    vehiclePlate: string;
    sameSupplier: boolean;
  }[];
  hasActiveCreditInvoice: boolean;
}

interface OrdersViewProps {
  language: Language;
  currency: Currency;
  initialDeepLink?: {
    selectedId?: string | null;
    filterPreset?: string | null;
  };
  onDataChanged?: () => void;
  onOpenDispute?: (disputeIdOrOrderId: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  language,
  currency,
  initialDeepLink,
  onDataChanged,
  onOpenDispute
}) => {
  const isAr = language === 'ar';
  const t = translations[language];

  const [statusFilter, setStatusFilter] = useState<string>(
    initialDeepLink?.filterPreset === 'stuck' ? 'stuck' : 'all'
  );
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);

  const [listData, setListData] = useState<OrdersListPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Drawer state
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    initialDeepLink?.selectedId || null
  );
  const [detail, setDetail] = useState<OrderDetailPayload | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  // Audited Transition Dialog state
  const [pendingTransition, setPendingTransition] = useState<{
    order: OrderListItem;
    toStatus: string;
    force?: boolean;
    title: string;
    description?: string;
    confirmLabel: string;
    danger: boolean;
  } | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [exportingCsv, setExportingCsv] = useState(false);

  useEffect(() => {
    if (initialDeepLink?.filterPreset === 'stuck') {
      setStatusFilter('stuck');
      setPage(1);
    }
    if (initialDeepLink?.selectedId) {
      setSelectedOrderId(initialDeepLink.selectedId);
    }
  }, [initialDeepLink]);

  const buildFilterParams = useCallback(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (supplierFilter !== 'all') params.set('supplierId', supplierFilter);
    if (storeFilter !== 'all') params.set('storeId', storeFilter);
    if (paymentFilter !== 'all') params.set('paymentMethod', paymentFilter);
    if (cityFilter !== 'all') params.set('city', cityFilter);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (sortBy) params.set('sortBy', sortBy);
    return params;
  }, [search, statusFilter, supplierFilter, storeFilter, paymentFilter, cityFilter, dateFrom, dateTo, sortBy]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildFilterParams();
      params.set('page', String(page));
      params.set('pageSize', '12');

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        headers: ADMIN_API_HEADERS
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || t.error);
      }
      setListData(json.data);
    } catch (err: any) {
      setError(err?.message || t.error);
    } finally {
      setLoading(false);
    }
  }, [buildFilterParams, page, t.error]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const fetchOrderDetail = useCallback(
    async (id: string) => {
      setDetailLoading(true);
      try {
        const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, {
          headers: ADMIN_API_HEADERS
        });
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.message || t.error);
        }
        setDetail(json.data);
        if (json.data?.order?.assignedDriverId) {
          setSelectedDriverId(json.data.order.assignedDriverId);
        } else if (json.data?.availableDrivers?.length > 0) {
          setSelectedDriverId(json.data.availableDrivers[0].id);
        } else {
          setSelectedDriverId('');
        }
      } catch (err: any) {
        setError(err?.message || t.error);
      } finally {
        setDetailLoading(false);
      }
    },
    [t.error]
  );

  useEffect(() => {
    if (selectedOrderId) {
      fetchOrderDetail(selectedOrderId);
    } else {
      setDetail(null);
    }
  }, [selectedOrderId, fetchOrderDetail]);

  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      const params = buildFilterParams();
      params.set('format', 'csv');
      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        headers: ADMIN_API_HEADERS
      });
      if (!res.ok) throw new Error(t.error);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || t.error);
    } finally {
      setExportingCsv(false);
    }
  };

  const openTransitionDialog = (order: OrderListItem, toStatus: string) => {
    setActionError(null);
    if (toStatus === 'assigned_driver') {
      const defaultDrv =
        order.assignedDriverId ||
        detail?.availableDrivers?.[0]?.id ||
        listData?.filterOptions.drivers.find((d) => d.accountStatus === 'active')?.id ||
        '';
      setSelectedDriverId(defaultDrv);
    }

    if (toStatus === 'cancelled') {
      setPendingTransition({
        order,
        toStatus,
        title: `${t.adminOrdActionCancel} (${order.id})`,
        description:
          order.paymentMethod === 'credit'
            ? t.adminOrdCancelWarningCredit
            : t.adminOrdCancelWarningCod,
        confirmLabel: t.adminOrdActionCancel,
        danger: true
      });
      return;
    }

    if (toStatus === 'delivered') {
      setPendingTransition({
        order,
        toStatus,
        force: order.status === 'out_for_delivery',
        title: `${t.adminOrdActionForceDeliver} (${order.id})`,
        description: isAr
          ? 'سيتم تأكيد تسليم الطلبية إدارياً وتجاوز رمز PIN المتجر مع تسجيل علامة تسليم قسري.'
          : 'This will administratively mark the order as delivered without store PIN and attach a forced delivery flag.',
        confirmLabel: t.confirm,
        danger: true
      });
      return;
    }

    const labelMap: Record<string, string> = {
      approved:
        order.status === 'assigned_driver' ? t.adminOrdActionRevertApproved : t.adminOrdActionApprove,
      assigned_driver:
        order.status === 'out_for_delivery'
          ? t.adminOrdActionRevertAssigned
          : t.adminOrdActionAssignDriver,
      out_for_delivery: t.adminOrdActionDispatch
    };

    setPendingTransition({
      order,
      toStatus,
      title: `${labelMap[toStatus] || toStatus} (${order.id})`,
      confirmLabel: t.confirm,
      danger: false
    });
  };

  const handleConfirmTransition = async (reason: string) => {
    if (!pendingTransition) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const bodyPayload: Record<string, any> = {
        toStatus: pendingTransition.toStatus,
        reason,
        force: Boolean(pendingTransition.force)
      };
      if (pendingTransition.toStatus === 'assigned_driver' && selectedDriverId) {
        bodyPayload.driverId = selectedDriverId;
      }

      const res = await fetch(
        `/api/admin/orders/${encodeURIComponent(pendingTransition.order.id)}/transition`,
        {
          method: 'POST',
          headers: {
            ...ADMIN_API_HEADERS,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bodyPayload)
        }
      );
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || t.error);
      }
      setDetail(json.data);
      setPendingTransition(null);
      await fetchOrders();
      onDataChanged?.();
    } catch (err: any) {
      setActionError(err?.message || t.error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || noteInput.trim().length < 3) return;
    setNoteSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(selectedOrderId)}/notes`, {
        method: 'POST',
        headers: {
          ...ADMIN_API_HEADERS,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: noteInput.trim() })
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || t.error);
      }
      setNoteInput('');
      await fetchOrderDetail(selectedOrderId);
    } catch (err: any) {
      setError(err?.message || t.error);
    } finally {
      setNoteSaving(false);
    }
  };

  const getStatusMeta = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: isAr ? 'قيد الانتظار' : 'Pending',
          cls: 'bg-amber-50 text-amber-800 border-amber-200'
        };
      case 'approved':
        return {
          label: isAr ? 'مقبول' : 'Approved',
          cls: 'bg-blue-50 text-blue-800 border-blue-200'
        };
      case 'assigned_driver':
        return {
          label: isAr ? 'مسند لسائق' : 'Assigned Driver',
          cls: 'bg-indigo-50 text-indigo-800 border-indigo-200'
        };
      case 'out_for_delivery':
        return {
          label: isAr ? 'جاري التوصيل' : 'Out for Delivery',
          cls: 'bg-sky-50 text-sky-800 border-sky-200'
        };
      case 'delivered':
        return {
          label: isAr ? 'تم التسليم' : 'Delivered',
          cls: 'bg-emerald-50 text-emerald-800 border-emerald-200'
        };
      case 'disputed':
        return {
          label: isAr ? 'نزاع مفتوح' : 'Disputed',
          cls: 'bg-rose-50 text-rose-800 border-rose-200'
        };
      case 'cancelled':
        return {
          label: isAr ? 'ملغي' : 'Cancelled',
          cls: 'bg-red-50 text-red-700 border-red-200'
        };
      default:
        return {
          label: status,
          cls: 'bg-gray-100 text-gray-700 border-gray-200'
        };
    }
  };

  const getPaymentLabel = (pm: string) => {
    if (pm === 'credit') return isAr ? 'آجل (ائتمان)' : 'Credit';
    if (pm === 'cod') return isAr ? 'نقدي عند الاستلام' : 'Cash (COD)';
    return pm;
  };

  const formatDate = (iso?: string) => {
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

  const getActionButtonLabel = (currentStatus: string, targetStatus: string) => {
    if (targetStatus === 'approved') {
      return currentStatus === 'assigned_driver'
        ? t.adminOrdActionRevertApproved
        : t.adminOrdActionApprove;
    }
    if (targetStatus === 'assigned_driver') {
      return currentStatus === 'out_for_delivery'
        ? t.adminOrdActionRevertAssigned
        : t.adminOrdActionAssignDriver;
    }
    if (targetStatus === 'out_for_delivery') return t.adminOrdActionDispatch;
    if (targetStatus === 'delivered') {
      return currentStatus === 'out_for_delivery'
        ? t.adminOrdActionForceDeliver
        : isAr
        ? 'إرجاع لمكتمل'
        : 'Mark Delivered';
    }
    if (targetStatus === 'cancelled') return t.adminOrdActionCancel;
    return targetStatus;
  };

  const counts = listData?.counts;
  const items = listData?.items || [];

  const statusTabs: { id: string; label: string; count?: number; alert?: boolean }[] = [
    { id: 'all', label: t.all, count: counts?.all },
    { id: 'stuck', label: t.adminOrdTabStuck, count: counts?.stuck, alert: (counts?.stuck || 0) > 0 },
    { id: 'pending', label: getStatusMeta('pending').label, count: counts?.pending },
    { id: 'approved', label: getStatusMeta('approved').label, count: counts?.approved },
    { id: 'assigned_driver', label: getStatusMeta('assigned_driver').label, count: counts?.assigned_driver },
    { id: 'out_for_delivery', label: getStatusMeta('out_for_delivery').label, count: counts?.out_for_delivery },
    { id: 'delivered', label: getStatusMeta('delivered').label, count: counts?.delivered },
    { id: 'disputed', label: getStatusMeta('disputed').label, count: counts?.disputed },
    { id: 'cancelled', label: getStatusMeta('cancelled').label, count: counts?.cancelled }
  ];

  const driverChoices =
    detail?.availableDrivers ||
    (listData?.filterOptions.drivers || [])
      .filter((d) => d.accountStatus === 'active')
      .map((d) => ({ ...d, sameSupplier: d.supplierId === pendingTransition?.order.supplierId }));

  return (
    <div className="space-y-4">
      {/* Header & CSV Export */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-[#E5E7EB] p-3.5 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-base sm:text-xl font-black text-[#221F1F]">{t.adminOrdTitle}</h1>
            <p className="text-xs sm:text-sm text-[#797878] mt-0.5">{t.adminOrdSubtitle}</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exportingCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-white text-xs font-bold text-[#221F1F] cursor-pointer disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5 text-[#00A046]" />
              <span>{t.adminOrdExportCsv}</span>
            </button>
            <button
              type="button"
              onClick={fetchOrders}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-xs font-bold text-[#221F1F] cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{t.adminRefresh}</span>
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {statusTabs.map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  active
                    ? tab.id === 'stuck'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-[#00A046] text-white border-[#00A046]'
                    : tab.alert
                    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    : 'bg-[#F9FAFB] text-[#374151] border-[#E5E7EB] hover:bg-white'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                      active ? 'bg-white/20 text-white' : 'bg-white text-[#221F1F]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 pt-2 border-t border-[#F3F4F6]">
          <div className="lg:col-span-2 relative">
            <Search
              className={`w-4 h-4 text-[#797878] absolute top-1/2 -translate-y-1/2 ${
                isAr ? 'right-3' : 'left-3'
              }`}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t.adminOrdSearchPlaceholder}
              className={`w-full rounded-xl border border-[#D1D5DB] bg-white py-2 text-xs text-[#221F1F] focus:outline-none focus:ring-2 focus:ring-[#00A046]/25 focus:border-[#00A046] ${
                isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
              }`}
            />
          </div>

          <select
            value={supplierFilter}
            onChange={(e) => {
              setSupplierFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-[#D1D5DB] bg-white px-2.5 py-2 text-xs font-semibold text-[#221F1F]"
          >
            <option value="all">{isAr ? 'كل الموردين' : 'All Suppliers'}</option>
            {(listData?.filterOptions.suppliers || []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.companyName}
              </option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-[#D1D5DB] bg-white px-2.5 py-2 text-xs font-semibold text-[#221F1F]"
          >
            <option value="all">{isAr ? 'كل طرق الدفع' : 'All Payments'}</option>
            <option value="credit">{isAr ? 'آجل (ائتمان)' : 'Credit'}</option>
            <option value="cod">{isAr ? 'نقدي عند الاستلام' : 'Cash (COD)'}</option>
          </select>

          <select
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-[#D1D5DB] bg-white px-2.5 py-2 text-xs font-semibold text-[#221F1F]"
          >
            <option value="all">{t.adminAccCityAll}</option>
            {(listData?.filterOptions.cities || []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-[#D1D5DB] bg-white px-2.5 py-2 text-xs font-semibold text-[#221F1F]"
          >
            <option value="newest">{isAr ? 'الأحدث أولاً' : 'Newest First'}</option>
            <option value="oldest">{isAr ? 'الأقدم أولاً' : 'Oldest First'}</option>
            <option value="amount_desc">{isAr ? 'الأعلى قيمة' : 'Highest Amount'}</option>
            <option value="amount_asc">{isAr ? 'الأقل قيمة' : 'Lowest Amount'}</option>
          </select>
        </div>

        {/* Date & Store secondary row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <select
            value={storeFilter}
            onChange={(e) => {
              setStoreFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-[#D1D5DB] bg-white px-2.5 py-2 text-xs font-semibold text-[#221F1F]"
          >
            <option value="all">{isAr ? 'كل المتاجر' : 'All Stores'}</option>
            {(listData?.filterOptions.stores || []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-[#D1D5DB] bg-white px-2.5 py-2 text-xs text-[#221F1F]"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-[#D1D5DB] bg-white px-2.5 py-2 text-xs text-[#221F1F]"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs font-bold text-red-700">
          {error}
        </div>
      )}

      {/* Orders List: Mobile Cards + Desktop Table */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-[#E5E7EB] p-3.5 sm:p-5 shadow-xs">
        {loading && items.length === 0 ? (
          <div className="py-10 text-center text-xs font-bold text-[#797878]">{t.loading}</div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-xs font-bold text-[#797878]">{t.adminOrdEmpty}</div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="space-y-3 md:hidden">
              {items.map((ord) => {
                const meta = getStatusMeta(ord.status);
                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrderId(ord.id)}
                    className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3.5 space-y-2.5 cursor-pointer hover:border-[#00A046]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-black text-[#221F1F] truncate">{ord.id}</div>
                        <div className="text-[10px] text-[#797878] truncate">
                          {ord.parentOrderId} • {formatDate(ord.createdAt)}
                        </div>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-lg border text-[10px] font-extrabold ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {ord.isStuck && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-extrabold">
                          <Clock className="w-3 h-3" />
                          {t.adminOrdStuckBadge} ({ord.hoursInStage}h)
                        </span>
                      )}
                      {ord.adminFlags?.forcedDelivery && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                          {t.adminOrdForcedDeliveryBadge}
                        </span>
                      )}
                      {ord.hasOpenDispute && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-extrabold">
                          {isAr ? 'نزاع مفتوح' : 'Dispute'}
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-bold text-[#221F1F]">
                      {ord.storeName} <span className="text-[#797878] font-normal">({ord.storeCity})</span>
                    </div>
                    <div className="text-[11px] text-[#4A4747]">
                      {isAr ? 'المورد:' : 'Supplier:'} {ord.supplierName}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
                      <span className="text-[11px] font-semibold text-[#797878]">
                        {getPaymentLabel(ord.paymentMethod)} • {ord.items.length} {isAr ? 'صنف' : 'items'}
                      </span>
                      <span className="text-xs font-black text-[#00A046]">
                        {formatCurrency(ord.subtotalIQD, currency, language)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[#797878]">
                    <th className="py-2.5 text-start font-bold">{isAr ? 'رقم الطلب' : 'Order ID'}</th>
                    <th className="py-2.5 text-start font-bold">{isAr ? 'المتجر والمدينة' : 'Store & City'}</th>
                    <th className="py-2.5 text-start font-bold">{isAr ? 'المورد والسائق' : 'Supplier & Driver'}</th>
                    <th className="py-2.5 text-center font-bold">{isAr ? 'الدفع' : 'Payment'}</th>
                    <th className="py-2.5 text-end font-bold">{isAr ? 'القيمة' : 'Subtotal'}</th>
                    <th className="py-2.5 text-center font-bold">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="py-2.5 text-end font-bold">{t.details}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {items.map((ord) => {
                    const meta = getStatusMeta(ord.status);
                    return (
                      <tr
                        key={ord.id}
                        onClick={() => setSelectedOrderId(ord.id)}
                        className="hover:bg-[#F9FAFB] cursor-pointer"
                      >
                        <td className="py-3">
                          <div className="font-black text-[#221F1F]">{ord.id}</div>
                          <div className="text-[10px] text-[#797878]">
                            {ord.parentOrderId} • {formatDate(ord.createdAt)}
                          </div>
                          {ord.isStuck && (
                            <span className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-extrabold">
                              <Clock className="w-3 h-3" />
                              {t.adminOrdStuckBadge} ({ord.hoursInStage}h)
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="font-bold text-[#221F1F]">{ord.storeName}</div>
                          <div className="text-[10px] text-[#797878]">{ord.storeCity}</div>
                        </td>
                        <td className="py-3">
                          <div className="font-bold text-[#221F1F]">{ord.supplierName}</div>
                          <div className="text-[10px] text-[#797878]">
                            {ord.assignedDriverName
                              ? `${isAr ? 'السائق:' : 'Driver:'} ${ord.assignedDriverName}`
                              : isAr
                              ? 'غير مسند لسائق'
                              : 'Unassigned'}
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              ord.paymentMethod === 'credit'
                                ? 'bg-purple-50 text-purple-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {getPaymentLabel(ord.paymentMethod)}
                          </span>
                        </td>
                        <td className="py-3 text-end font-black text-[#00A046]">
                          {formatCurrency(ord.subtotalIQD, currency, language)}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-extrabold ${meta.cls}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-3 text-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrderId(ord.id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E5E7EB] bg-white text-[11px] font-bold text-[#00A046] hover:bg-emerald-50 cursor-pointer"
                          >
                            <span>{t.details}</span>
                            {isAr ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {listData && listData.totalPages > 1 && (
              <div className="mt-4 pt-3 border-t border-[#F3F4F6] flex items-center justify-between text-xs">
                <span className="text-[#797878] font-semibold">
                  {isAr
                    ? `صفحة ${listData.page} من ${listData.totalPages} (${listData.total} طلب)`
                    : `Page ${listData.page} of ${listData.totalPages} (${listData.total} orders)`}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white disabled:opacity-40 cursor-pointer"
                  >
                    {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    disabled={page >= listData.totalPages}
                    onClick={() => setPage((p) => Math.min(listData.totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white disabled:opacity-40 cursor-pointer"
                  >
                    {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Detail Slide-over Drawer */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="sticky top-0 z-10 bg-white border-b border-[#E5E7EB] px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-black text-[#221F1F]">
                    {detail?.order?.id || selectedOrderId}
                  </h2>
                  {detail?.order && (
                    <span
                      className={`px-2 py-0.5 rounded-lg border text-[11px] font-extrabold ${
                        getStatusMeta(detail.order.status).cls
                      }`}
                    >
                      {getStatusMeta(detail.order.status).label}
                    </span>
                  )}
                  {detail?.order?.adminFlags?.forcedDelivery && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                      {t.adminOrdForcedDeliveryBadge}
                    </span>
                  )}
                  {detail?.order?.adminFlags?.cancelledByAdmin && (
                    <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-extrabold">
                      {t.adminOrdCancelledAdminBadge}
                    </span>
                  )}
                </div>
                {detail?.order && (
                  <p className="text-[11px] text-[#797878] mt-0.5">
                    {detail.order.parentOrderId} • {formatDate(detail.order.createdAt)}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrderId(null)}
                className="p-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-gray-100 text-[#221F1F] cursor-pointer"
                aria-label={t.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailLoading || !detail ? (
              <div className="p-8 text-center text-xs font-bold text-[#797878]">{t.loading}</div>
            ) : (
              <div className="p-4 sm:p-6 space-y-5 flex-1">
                {/* Stuck Warning */}
                {detail.order.isStuck && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs font-bold text-red-800">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>
                      {isAr
                        ? `تنبيه: هذا الطلب عالق في حالة (${getStatusMeta(detail.order.status).label}) منذ ${detail.order.hoursInStage} ساعة.`
                        : `Alert: Order has been stuck in ${detail.order.status} for ${detail.order.hoursInStage} hours.`}
                    </span>
                  </div>
                )}

                {/* Allowed Lifecycle Transitions Action Bar */}
                {(detail.order.allowedTransitions.length > 0 || detail.order.status === 'delivered') && (
                  <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-3.5 space-y-2.5">
                    <div className="text-xs font-extrabold text-[#221F1F] flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-[#00A046]" />
                      <span>
                        {isAr ? 'إجراءات الإدارة المسموحة لهذه الحالة' : 'Allowed Admin Transitions'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {detail.order.allowedTransitions.map((nextStatus) => {
                        const isDanger = nextStatus === 'cancelled' || nextStatus === 'delivered';
                        return (
                          <button
                            key={nextStatus}
                            type="button"
                            onClick={() => openTransitionDialog(detail.order, nextStatus)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                              nextStatus === 'cancelled'
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : isDanger
                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                : 'bg-[#00A046] hover:bg-[#008A3C] text-white'
                            }`}
                          >
                            {nextStatus === 'cancelled' ? (
                              <Ban className="w-3.5 h-3.5" />
                            ) : nextStatus === 'approved' && detail.order.status === 'assigned_driver' ? (
                              <RotateCcw className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>{getActionButtonLabel(detail.order.status, nextStatus)}</span>
                          </button>
                        );
                      })}

                      {detail.order.status === 'delivered' && onOpenDispute && (
                        <button
                          type="button"
                          onClick={() => onOpenDispute(detail.order.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold cursor-pointer"
                        >
                          <Scale className="w-3.5 h-3.5" />
                          <span>{t.adminOrdOpenDisputeBtn}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Summary & PIN */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-[#E5E7EB] p-3 bg-white">
                    <div className="text-[11px] font-bold text-[#797878] flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 text-[#00A046]" />
                      <span>{isAr ? 'المتجر' : 'Store'}</span>
                    </div>
                    <div className="text-xs font-black text-[#221F1F] mt-1">
                      {detail.order.storeName}
                    </div>
                    <div className="text-[11px] text-[#4A4747] mt-0.5">
                      {detail.order.storeCity} • {detail.order.storePhone}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#E5E7EB] p-3 bg-white">
                    <div className="text-[11px] font-bold text-[#797878] flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-[#00A046]" />
                      <span>{isAr ? 'المورد والسائق' : 'Supplier & Driver'}</span>
                    </div>
                    <div className="text-xs font-black text-[#221F1F] mt-1">
                      {detail.order.supplierName}
                    </div>
                    <div className="text-[11px] text-[#4A4747] mt-0.5">
                      {detail.driver
                        ? `${detail.driver.name} (${detail.driver.vehiclePlate})`
                        : isAr
                        ? 'لم يُسند سائق بعد'
                        : 'No driver assigned'}
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-200 p-3 bg-emerald-50/60">
                    <div className="text-[11px] font-bold text-[#00A046] flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isAr ? 'قيمة الطلب ورمز التسليم' : 'Total & Delivery PIN'}</span>
                    </div>
                    <div className="text-sm font-black text-[#221F1F] mt-1">
                      {formatCurrency(detail.order.subtotalIQD, currency, language)}
                    </div>
                    <div className="text-[11px] font-extrabold text-[#221F1F] mt-0.5">
                      PIN: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200">{detail.order.deliveryPin}</span>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
                  <div className="bg-[#F9FAFB] px-3.5 py-2.5 border-b border-[#E5E7EB] text-xs font-extrabold text-[#221F1F] flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-[#00A046]" />
                    <span>{t.adminOrdItemsTitle} ({detail.order.items.length})</span>
                  </div>
                  <div className="divide-y divide-[#F3F4F6]">
                    {detail.order.items.map((item) => (
                      <div key={item.barcode} className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0">
                          <div className="font-bold text-[#221F1F] truncate">{item.productName}</div>
                          <div className="text-[10px] text-[#797878]">
                            {item.barcode} • {item.quantity} × {item.unit} ({formatCurrency(item.unitPriceIQD, currency, language)})
                          </div>
                        </div>
                        <div className="font-black text-[#221F1F] shrink-0">
                          {formatCurrency(item.totalPriceIQD, currency, language)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sibling Sub-Orders */}
                {detail.siblingSubOrders.length > 0 && (
                  <div className="rounded-xl border border-[#E5E7EB] p-3.5 space-y-2">
                    <div className="text-xs font-extrabold text-[#221F1F] flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-[#00A046]" />
                      <span>{t.adminOrdSiblingsTitle}</span>
                    </div>
                    <div className="space-y-1.5">
                      {detail.siblingSubOrders.map((sib) => (
                        <button
                          key={sib.id}
                          type="button"
                          onClick={() => setSelectedOrderId(sib.id)}
                          className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#E5E7EB] hover:border-[#00A046] bg-[#F9FAFB] text-xs cursor-pointer"
                        >
                          <span className="font-bold text-[#221F1F]">
                            {sib.id} — {sib.supplierName}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <span className="font-black text-[#00A046]">
                              {formatCurrency(sib.subtotalIQD, currency, language)}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 text-[#797878]" />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Credit & Ledger Entries */}
                <div className="rounded-xl border border-[#E5E7EB] p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-extrabold text-[#221F1F] flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[#00A046]" />
                      <span>{t.adminOrdLedgerTitle}</span>
                    </div>
                    {detail.creditAccount && (
                      <span className="text-[11px] font-bold text-[#4A4747]">
                        {isAr ? 'الرصيد المستخدم:' : 'Used Credit:'}{' '}
                        {formatCurrency(detail.creditAccount.currentUsedCreditIQD, currency, language)}
                      </span>
                    )}
                  </div>
                  {detail.ledgerEntries.length === 0 ? (
                    <p className="text-xs text-[#797878]">
                      {isAr ? 'لا توجد قيود دفتر أستاذ مرتبطة بهذا الطلب.' : 'No ledger entries linked to this order.'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {detail.ledgerEntries.map((led) => (
                        <div
                          key={led.id}
                          className={`p-2.5 rounded-lg border text-xs ${
                            led.isReversed
                              ? 'bg-gray-50 border-gray-200 opacity-80'
                              : led.referenceType === 'REVERSAL' || led.referenceType === 'RETURN_CREDIT'
                              ? 'bg-emerald-50/60 border-emerald-200'
                              : 'bg-[#F9FAFB] border-[#E5E7EB]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 font-bold">
                            <span className="text-[#221F1F]">
                              {led.referenceType} ({led.referenceId})
                              {led.isReversed && (
                                <span className="ms-1.5 px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px]">
                                  {isAr ? 'معكوس' : 'Reversed'}
                                </span>
                              )}
                            </span>
                            <span className={led.creditIQD > 0 ? 'text-[#00A046]' : 'text-[#221F1F]'}>
                              {led.debitIQD > 0
                                ? `+${formatCurrency(led.debitIQD, currency, language)}`
                                : `-${formatCurrency(led.creditIQD, currency, language)}`}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#4A4747] mt-1">{led.descriptionAr}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Timeline */}
                <div className="rounded-xl border border-[#E5E7EB] p-3.5 space-y-3">
                  <div className="text-xs font-extrabold text-[#221F1F] flex items-center gap-1.5">
                    <History className="w-4 h-4 text-[#00A046]" />
                    <span>{t.adminOrdTimelineTitle}</span>
                  </div>
                  <div className="space-y-2.5">
                    {(detail.order.statusHistory || []).map((step, idx) => {
                      const sm = getStatusMeta(step.status);
                      return (
                        <div
                          key={`${step.status}_${step.at}_${idx}`}
                          className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold ${sm.cls}`}>
                              {sm.label}
                            </span>
                            <span className="text-[10px] text-[#797878]">{formatDate(step.at)}</span>
                          </div>
                          <div className="text-[11px] font-bold text-[#221F1F]">
                            {step.actorName || step.actorType} ({step.actorType})
                          </div>
                          {step.reason && (
                            <div className="text-[11px] text-[#4A4747]">
                              <strong>{isAr ? 'السبب:' : 'Reason:'}</strong> {step.reason}
                            </div>
                          )}
                          {step.note && (
                            <div className="text-[11px] text-[#00A046] font-semibold">{step.note}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Internal Notes */}
                <div className="rounded-xl border border-[#E5E7EB] p-3.5 space-y-3">
                  <div className="text-xs font-extrabold text-[#221F1F] flex items-center gap-1.5">
                    <MessageSquarePlus className="w-4 h-4 text-[#00A046]" />
                    <span>{t.adminOrdNotesTitle}</span>
                  </div>
                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder={isAr ? 'أضف ملاحظة متابعة داخلية...' : 'Add internal follow-up note...'}
                      className="flex-1 rounded-xl border border-[#D1D5DB] px-3 py-2 text-xs text-[#221F1F]"
                    />
                    <button
                      type="submit"
                      disabled={noteSaving || noteInput.trim().length < 3}
                      className="px-3.5 py-2 rounded-xl bg-[#00A046] text-white text-xs font-extrabold disabled:opacity-50 cursor-pointer"
                    >
                      {isAr ? 'حفظ' : 'Save'}
                    </button>
                  </form>
                  {detail.adminNotes.length > 0 && (
                    <div className="space-y-2">
                      {detail.adminNotes.map((n) => (
                        <div key={n.id} className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-xs">
                          <div className="flex items-center justify-between text-[10px] text-[#797878]">
                            <span className="font-bold text-[#221F1F]">{n.author}</span>
                            <span>{formatDate(n.at)}</span>
                          </div>
                          <p className="mt-1 text-[#374151]">{n.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Related Audit Logs */}
                {detail.auditLogs.length > 0 && (
                  <div className="rounded-xl border border-[#E5E7EB] p-3.5 space-y-2">
                    <div className="text-xs font-extrabold text-[#221F1F]">
                      {t.adminAccDetailAudit}
                    </div>
                    <div className="space-y-2">
                      {detail.auditLogs.map((log) => (
                        <div key={log.id} className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-[#00A046] font-extrabold text-[10px]">
                              {log.action}
                            </span>
                            <span className="text-[10px] text-[#797878]">{formatDate(log.at)}</span>
                          </div>
                          <div className="font-bold text-[#221F1F] mt-1">
                            {isAr ? log.summaryAr : log.summaryEn || log.summaryAr}
                          </div>
                          {log.reason && (
                            <div className="text-[11px] text-[#4A4747] mt-0.5">{log.reason}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mandatory Reason Confirmation Dialog */}
      <ConfirmWithReasonDialog
        isOpen={Boolean(pendingTransition)}
        title={pendingTransition?.title || ''}
        description={pendingTransition?.description}
        confirmLabel={pendingTransition?.confirmLabel}
        danger={Boolean(pendingTransition?.danger)}
        loading={actionLoading}
        serverError={actionError}
        language={language}
        extraContent={
          pendingTransition?.toStatus === 'assigned_driver' ? (
            <div>
              <label className="block text-xs font-bold text-[#221F1F] mb-1.5">
                {isAr ? 'اختر السائق النشط' : 'Select Active Driver'}
              </label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-xs font-semibold text-[#221F1F]"
              >
                {driverChoices.map((drv) => (
                  <option key={drv.id} value={drv.id}>
                    {drv.name} ({drv.vehiclePlate}) — {drv.supplierName}
                  </option>
                ))}
              </select>
            </div>
          ) : undefined
        }
        onConfirm={handleConfirmTransition}
        onCancel={() => {
          if (!actionLoading) {
            setPendingTransition(null);
            setActionError(null);
          }
        }}
      />
    </div>
  );
};
