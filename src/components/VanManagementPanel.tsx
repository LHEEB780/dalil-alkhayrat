import React, { useMemo, useState } from 'react';
import {
  SlidersHorizontal,
  Power,
  Clock,
  MapPin,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  CheckCircle2,
  SkipForward,
  RotateCcw,
  Navigation,
  ShoppingCart,
  Wallet,
  Package,
  Phone,
  CalendarClock,
  Truck,
  Sparkles,
  KeyRound
} from 'lucide-react';
import { Currency, Language, OrderItem } from '../types/index.ts';
import { formatCurrency } from '../utils/format.ts';

interface VanManagementPanelProps {
  driverId: string;
  driverInfo: any;
  routeStops: any[];
  stores: any[];
  assignedOrders: OrderItem[];
  currency: Currency;
  language: Language;
  onRefreshVanData: () => Promise<void>;
  onUpdateRouteStop: (stopId: string, status: 'pending' | 'visited' | 'sold' | 'skipped') => Promise<void>;
  onStartSaleForStore: (storeId: string) => void;
  onStartCollectionForStore: (storeId: string) => void;
  onOpenNavigation: () => void;
  onOpenDeliveries: () => void;
  onFeedback: (feedback: { type: 'success' | 'error'; text: string }) => void;
}

const BUSY_REASONS_AR = [
  'تحميل بضاعة من المستودع',
  'استراحة قصيرة',
  'ازدحام مروري',
  'صيانة / تعبئة وقود'
];

const BUSY_REASONS_EN = [
  'Loading at Warehouse',
  'Short Break',
  'Heavy Traffic',
  'Fuel / Maintenance'
];

export const VanManagementPanel: React.FC<VanManagementPanelProps> = ({
  driverId,
  driverInfo,
  routeStops,
  stores,
  assignedOrders,
  currency,
  language,
  onRefreshVanData,
  onUpdateRouteStop,
  onStartSaleForStore,
  onStartCollectionForStore,
  onOpenNavigation,
  onOpenDeliveries,
  onFeedback
}) => {
  const isAr = language === 'ar';
  const availability: 'available' | 'busy' =
    driverInfo?.availabilityStatus === 'busy' ? 'busy' : 'available';

  const [togglingStatus, setTogglingStatus] = useState(false);
  const [selectedBusyReason, setSelectedBusyReason] = useState<string>(
    driverInfo?.busyReason || (isAr ? BUSY_REASONS_AR[0] : BUSY_REASONS_EN[0])
  );

  // Add Stop Form State
  const [showAddStop, setShowAddStop] = useState(false);
  const [newStopStoreId, setNewStopStoreId] = useState<string>(stores[0]?.id || 'store_almansoor');
  const [newStopNote, setNewStopNote] = useState('');
  const [addingStop, setAddingStop] = useState(false);
  const [busyStopId, setBusyStopId] = useState<string | null>(null);

  // Interactive Delivery Cards Filter
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'upcoming' | 'completed'>('all');

  const completedStopsCount = useMemo(
    () => routeStops.filter((s) => s.status === 'visited' || s.status === 'sold').length,
    [routeStops]
  );

  const pendingOrdersCount = useMemo(
    () => assignedOrders.filter((o) => o.status !== 'delivered').length,
    [assignedOrders]
  );

  const handleSetAvailability = async (nextStatus: 'available' | 'busy', reason?: string) => {
    if (togglingStatus) return;
    setTogglingStatus(true);
    try {
      const res = await fetch(`/api/van/driver/${driverId}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          availabilityStatus: nextStatus,
          busyReason: nextStatus === 'busy' ? (reason || selectedBusyReason) : undefined
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (isAr ? 'تعذر تحديث حالة التوفر' : 'Failed to update status'));
      }
      onFeedback({
        type: 'success',
        text:
          nextStatus === 'available'
            ? isAr
              ? 'تم تحويل حالة الفان إلى «متاح للتوزيع».'
              : 'Van status updated to Available.'
            : isAr
            ? `تم تحويل حالة الفان إلى «مشغول» (${reason || selectedBusyReason}).`
            : `Van status updated to Busy (${reason || selectedBusyReason}).`
      });
      await onRefreshVanData();
    } catch (err: any) {
      onFeedback({
        type: 'error',
        text: err?.message || (isAr ? 'تعذر تحديث حالة الفان' : 'Could not update van status')
      });
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleAddStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStopStoreId || addingStop) return;
    setAddingStop(true);
    try {
      const res = await fetch('/api/van/route-stops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          storeId: newStopStoreId,
          notes: newStopNote.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (isAr ? 'فشل إضافة المحطة' : 'Failed to add stop'));
      }
      setNewStopNote('');
      setShowAddStop(false);
      onFeedback({
        type: 'success',
        text: isAr ? 'تمت إضافة المحطة إلى مسارك اليومي.' : 'Stop added to your daily route.'
      });
      await onRefreshVanData();
    } catch (err: any) {
      onFeedback({
        type: 'error',
        text: err?.message || (isAr ? 'تعذر إضافة المحطة' : 'Could not add stop')
      });
    } finally {
      setAddingStop(false);
    }
  };

  const handleMoveStop = async (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= routeStops.length || busyStopId) return;
    const nextOrder = [...routeStops];
    const [moved] = nextOrder.splice(index, 1);
    nextOrder.splice(targetIdx, 0, moved);

    setBusyStopId(moved.id);
    try {
      const res = await fetch('/api/van/route-stops/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          orderedStopIds: nextOrder.map((s) => s.id)
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (isAr ? 'تعذر إعادة الترتيب' : 'Failed to reorder route'));
      }
      await onRefreshVanData();
    } catch (err: any) {
      onFeedback({
        type: 'error',
        text: err?.message || (isAr ? 'تعذر تحديث ترتيب المسار' : 'Failed to reorder stops')
      });
    } finally {
      setBusyStopId(null);
    }
  };

  const handleRemoveStop = async (stopId: string) => {
    if (busyStopId) return;
    setBusyStopId(stopId);
    try {
      const res = await fetch(`/api/van/route-stops/${stopId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (isAr ? 'تعذر إزالة المحطة' : 'Failed to remove stop'));
      }
      onFeedback({
        type: 'success',
        text: isAr ? 'تمت إزالة المحطة من المسار اليومي.' : 'Stop removed from daily route.'
      });
      await onRefreshVanData();
    } catch (err: any) {
      onFeedback({
        type: 'error',
        text: err?.message || (isAr ? 'تعذر إزالة المحطة' : 'Could not remove stop')
      });
    } finally {
      setBusyStopId(null);
    }
  };

  // Unified Scheduled Deliveries Feed (Orders + Route Stops)
  const scheduledCards = useMemo(() => {
    const orderCards = assignedOrders.map((ord) => ({
      kind: 'order' as const,
      id: ord.id,
      title: ord.storeName,
      subtitle: ord.id,
      district: `${ord.storeCity} · ${ord.storeAddress}`,
      status: ord.status === 'delivered' ? ('completed' as const) : ('upcoming' as const),
      statusLabel:
        ord.status === 'delivered'
          ? isAr ? 'تم التسليم' : 'Delivered'
          : ord.status === 'out_for_delivery'
          ? isAr ? 'قيد التوصيل الآن' : 'Out for Delivery'
          : isAr ? 'جاهز للتوصيل' : 'Ready for Delivery',
      totalIQD: ord.subtotalIQD,
      itemsCount: ord.items.reduce((s, i) => s + i.quantity, 0),
      order: ord
    }));

    const stopCards = routeStops.map((stop) => {
      const isDone = stop.status === 'visited' || stop.status === 'sold';
      const isSkipped = stop.status === 'skipped';
      return {
        kind: 'stop' as const,
        id: stop.id,
        title: stop.storeName,
        subtitle: `${isAr ? 'محطة' : 'Stop'} #${stop.sequence}`,
        district: `${stop.district} · ${stop.address}`,
        status: isDone ? ('completed' as const) : ('upcoming' as const),
        statusLabel:
          stop.status === 'sold'
            ? isAr ? 'تم البيع والزيارة' : 'Sold & Visited'
            : stop.status === 'visited'
            ? isAr ? 'تمت الزيارة' : 'Visited'
            : isSkipped
            ? isAr ? 'تم التجاوز' : 'Skipped'
            : isAr ? 'بانتظار الزيارة' : 'Scheduled Visit',
        stop
      };
    });

    const combined = [...orderCards, ...stopCards];
    if (deliveryFilter === 'upcoming') {
      return combined.filter((c) => c.status === 'upcoming');
    }
    if (deliveryFilter === 'completed') {
      return combined.filter((c) => c.status === 'completed');
    }
    return combined;
  }, [assignedOrders, routeStops, deliveryFilter, isAr]);

  const busyReasons = isAr ? BUSY_REASONS_AR : BUSY_REASONS_EN;

  return (
    <div className="space-y-4">
      {/* =================================================================== */}
      {/* 1. VAN AVAILABILITY & CONTROL HEADER CARD                           */}
      {/* =================================================================== */}
      <section className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition ${
                availability === 'available'
                  ? 'bg-[#ECFDF5] text-[#0B5D32] border border-[#A7F3D0]'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-[#142018]">
                  {isAr ? 'إدارة الفان والمسار اليومي' : 'Van Management & Daily Route'}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 text-[10.5px] font-black px-2.5 py-0.5 rounded-full ${
                    availability === 'available'
                      ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      availability === 'available' ? 'bg-[#00A046]' : 'bg-amber-500'
                    }`}
                  />
                  {availability === 'available'
                    ? isAr ? 'متاح للتوزيع' : 'Available'
                    : isAr ? 'مشغول حالياً' : 'Busy'}
                </span>
              </div>
              <p className="text-[11px] text-[#5F7164] mt-0.5">
                {driverInfo?.vanWarehouseName || (isAr ? 'فان رقم 1' : 'Van #1')} ·{' '}
                {driverInfo?.vehicleModel || 'Toyota HiAce'} ({driverInfo?.vehiclePlate || '48215'})
              </p>
            </div>
          </div>

          {/* 2-State Interactive Availability Switch */}
          <div className="bg-[#F4F4EA] p-1 rounded-xl border border-[#DCE5DC] flex items-center gap-1 shrink-0">
            <button
              type="button"
              disabled={togglingStatus}
              onClick={() => handleSetAvailability('available')}
              className={`px-3.5 py-2 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                availability === 'available'
                  ? 'bg-[#0B5D32] text-white shadow-2xs'
                  : 'text-[#4B6352] hover:text-[#142018]'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isAr ? 'متاح' : 'Available'}</span>
            </button>
            <button
              type="button"
              disabled={togglingStatus}
              onClick={() => handleSetAvailability('busy')}
              className={`px-3.5 py-2 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                availability === 'busy'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-[#4B6352] hover:text-[#142018]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isAr ? 'مشغول' : 'Busy'}</span>
            </button>
          </div>
        </div>

        {/* Busy Reason Quick Selector (when Busy) */}
        {availability === 'busy' && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-2">
            <div className="text-[11px] font-black text-amber-900">
              {isAr ? 'سبب حالة الانشغال (يظهر للمورد والعملاء):' : 'Busy reason (visible to supplier):'}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {busyReasons.map((reason) => {
                const isSelected = (driverInfo?.busyReason || selectedBusyReason) === reason;
                return (
                  <button
                    key={reason}
                    type="button"
                    disabled={togglingStatus}
                    onClick={() => {
                      setSelectedBusyReason(reason);
                      handleSetAvailability('busy', reason);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {reason}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Operational Stats Strip */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="rounded-xl bg-[#F8FAF7] border border-[#EAEFEA] p-2.5">
            <div className="text-[10.5px] font-bold text-[#5F7164]">
              {isAr ? 'محطات المسار' : 'Route Stops'}
            </div>
            <div className="text-sm font-black font-mono tabular-nums text-[#0B5D32] mt-0.5">
              {completedStopsCount} / {routeStops.length}
            </div>
          </div>
          <div className="rounded-xl bg-[#F8FAF7] border border-[#EAEFEA] p-2.5">
            <div className="text-[10.5px] font-bold text-[#5F7164]">
              {isAr ? 'توصيلات معلقة' : 'Pending Orders'}
            </div>
            <div className="text-sm font-black font-mono tabular-nums text-[#142018] mt-0.5">
              {pendingOrdersCount}
            </div>
          </div>
          <div className="rounded-xl bg-[#F8FAF7] border border-[#EAEFEA] p-2.5">
            <div className="text-[10.5px] font-bold text-[#5F7164]">
              {isAr ? 'حالة الوردية' : 'Shift Status'}
            </div>
            <div className="text-xs font-black text-[#0B5D32] mt-1">
              {driverInfo?.isActiveShift !== false
                ? isAr ? 'وردية مفتوحة' : 'Active Shift'
                : isAr ? 'وردية مغلقة' : 'Closed'}
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 2. DAILY ROUTE PLANNER (ضبط وترتيب المسار اليومي)                   */}
      {/* =================================================================== */}
      <section className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-[#142018] flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#0B5D32]" />
              <span>{isAr ? 'ضبط المسار اليومي (ترتيب وإضافة المحطات)' : 'Daily Route Planner'}</span>
            </h3>
            <p className="text-[11px] text-[#5F7164] mt-0.5">
              {isAr
                ? 'رتّب محطاتك حسب الأولوية أو أضف محلات جديدة لمسار اليوم.'
                : 'Reorder your daily visits by priority or add new supermarket stops.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenNavigation}
              className="px-3 py-1.5 rounded-xl bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#0B5D32] border border-[#A7F3D0] text-xs font-black flex items-center gap-1.5 cursor-pointer transition"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{isAr ? 'فتح الخريطة' : 'Open Map'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddStop((v) => !v)}
              className="px-3 py-1.5 rounded-xl bg-[#0B5D32] hover:bg-[#084725] text-white text-xs font-black flex items-center gap-1.5 cursor-pointer transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? 'إضافة محطة' : 'Add Stop'}</span>
            </button>
          </div>
        </div>

        {/* Inline Add Stop Form */}
        {showAddStop && (
          <form
            onSubmit={handleAddStop}
            className="bg-[#F8FAF7] border border-[#DCE5DC] rounded-xl p-3 grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs"
          >
            <div className="sm:col-span-5">
              <label className="text-[10.5px] font-bold text-[#5F7164] block mb-1">
                {isAr ? 'اختر المتجر / السوبرماركت:' : 'Select Store:'}
              </label>
              <select
                value={newStopStoreId}
                onChange={(e) => setNewStopStoreId(e.target.value)}
                className="w-full bg-white border border-[#DCE5DC] rounded-lg px-2.5 py-2 text-xs font-bold focus:outline-hidden focus:border-[#0B5D32]"
              >
                {stores.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} — {st.district}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-4">
              <label className="text-[10.5px] font-bold text-[#5F7164] block mb-1">
                {isAr ? 'ملاحظة الزيارة (اختياري):' : 'Visit Note (optional):'}
              </label>
              <input
                type="text"
                value={newStopNote}
                onChange={(e) => setNewStopNote(e.target.value)}
                placeholder={isAr ? 'مثال: تسليم دفعة صباحية أو تحصيل آجل...' : 'e.g. Morning restock...'}
                className="w-full bg-white border border-[#DCE5DC] rounded-lg px-2.5 py-2 text-xs focus:outline-hidden focus:border-[#0B5D32]"
              />
            </div>
            <div className="sm:col-span-3 flex items-end gap-1.5">
              <button
                type="submit"
                disabled={addingStop}
                className="flex-1 py-2 px-3 rounded-lg bg-[#0B5D32] hover:bg-[#084725] disabled:bg-gray-300 text-white font-black text-xs cursor-pointer"
              >
                {addingStop ? (isAr ? 'جاري الإضافة...' : 'Adding...') : isAr ? 'حفظ بالمسار' : 'Save Stop'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddStop(false)}
                className="py-2 px-2.5 rounded-lg bg-white border border-[#DCE5DC] text-[#5F7164] text-xs font-bold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </form>
        )}

        {/* Ordered Route Stops List */}
        {routeStops.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#5F7164] bg-[#F8FAF7] rounded-xl border border-dashed border-[#DCE5DC]">
            {isAr
              ? 'لا توجد محطات مضافة لمسار اليوم بعد. اضغط «إضافة محطة» لبدء تنظيم مسارك.'
              : 'No stops in your daily route yet. Click Add Stop to build your route.'}
          </div>
        ) : (
          <div className="space-y-2">
            {routeStops.map((stop, idx) => {
              const isDone = stop.status === 'visited' || stop.status === 'sold';
              const isSkipped = stop.status === 'skipped';
              const isBusy = busyStopId === stop.id;

              return (
                <div
                  key={stop.id}
                  className={`rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition ${
                    isDone
                      ? 'bg-[#ECFDF5]/40 border-[#A7F3D0]'
                      : isSkipped
                      ? 'bg-gray-50 border-gray-200 opacity-75'
                      : 'bg-[#F8FAF7] border-[#DCE5DC]'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    {/* Reorder Up/Down Controls */}
                    <div className="flex flex-col items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0 || isBusy}
                        onClick={() => handleMoveStop(idx, -1)}
                        className="w-6 h-5 rounded bg-white border border-[#DCE5DC] hover:border-[#0B5D32] disabled:opacity-30 flex items-center justify-center text-[#142018] cursor-pointer"
                        title={isAr ? 'تقديم المحطة' : 'Move Up'}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <span className="w-6 h-6 rounded-md bg-[#0B5D32] text-white font-mono font-black text-[11px] flex items-center justify-center tabular-nums">
                        {stop.sequence}
                      </span>
                      <button
                        type="button"
                        disabled={idx === routeStops.length - 1 || isBusy}
                        onClick={() => handleMoveStop(idx, 1)}
                        className="w-6 h-5 rounded bg-white border border-[#DCE5DC] hover:border-[#0B5D32] disabled:opacity-30 flex items-center justify-center text-[#142018] cursor-pointer"
                        title={isAr ? 'تأخير المحطة' : 'Move Down'}
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-xs sm:text-sm text-[#142018] truncate">
                          {stop.storeName}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isDone
                              ? 'bg-[#ECFDF5] text-[#065F46]'
                              : isSkipped
                              ? 'bg-gray-200 text-gray-700'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {stop.status === 'sold'
                            ? isAr ? 'تم البيع' : 'Sold'
                            : stop.status === 'visited'
                            ? isAr ? 'تمت الزيارة' : 'Visited'
                            : isSkipped
                            ? isAr ? 'متجاوزة' : 'Skipped'
                            : isAr ? 'قيد الانتظار' : 'Pending'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#5F7164] mt-0.5 truncate">
                        {stop.district} · {stop.address}
                      </div>
                      {stop.notes && (
                        <div className="text-[10.5px] text-[#4B6352] mt-1 bg-white/80 border border-[#EAEFEA] rounded-md px-2 py-0.5 inline-block">
                          {stop.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Route Stop Actions */}
                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                    {!isDone ? (
                      <button
                        type="button"
                        onClick={() => onUpdateRouteStop(stop.id, 'visited')}
                        className="px-2.5 py-1.5 rounded-lg bg-[#0B5D32] hover:bg-[#084725] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isAr ? 'تمت الزيارة' : 'Done'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onUpdateRouteStop(stop.id, 'pending')}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-[#DCE5DC] text-[#4B6352] hover:text-[#142018] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{isAr ? 'إعادة' : 'Reset'}</span>
                      </button>
                    )}

                    {!isSkipped && !isDone && (
                      <button
                        type="button"
                        onClick={() => onUpdateRouteStop(stop.id, 'skipped')}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-[#DCE5DC] text-[#5F7164] hover:text-amber-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        title={isAr ? 'تجاوز مؤقت' : 'Skip'}
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                        <span>{isAr ? 'تجاوز' : 'Skip'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleRemoveStop(stop.id)}
                      className="p-1.5 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-40"
                      title={isAr ? 'إزالة من المسار' : 'Remove Stop'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =================================================================== */}
      {/* 3. SCHEDULED DELIVERIES INTERACTIVE CARDS (التوصيلات المجدولة)       */}
      {/* =================================================================== */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-[#0B5D32]" />
            <h3 className="text-sm font-black text-[#142018]">
              {isAr ? 'قائمة التوصيلات والزيارات المجدولة' : 'Scheduled Deliveries & Visits'}
            </h3>
            <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded-full bg-white border border-[#DCE5DC] text-[#0B5D32] tabular-nums">
              {scheduledCards.length}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-white border border-[#DCE5DC] rounded-xl p-1 text-[11px] font-bold self-start sm:self-auto">
            {(
              [
                { id: 'all', label: isAr ? 'الكل' : 'All' },
                { id: 'upcoming', label: isAr ? 'المجدولة' : 'Upcoming' },
                { id: 'completed', label: isAr ? 'المكتملة' : 'Completed' }
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setDeliveryFilter(f.id)}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  deliveryFilter === f.id
                    ? 'bg-[#0B5D32] text-white'
                    : 'text-[#5F7164] hover:text-[#142018]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {scheduledCards.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#DCE5DC] p-8 text-center text-xs font-bold text-[#5F7164]">
            {isAr ? 'لا توجد توصيلات مجدولة ضمن هذا الفلتر حالياً.' : 'No scheduled deliveries match this filter.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {scheduledCards.map((card) => {
              const isOrder = card.kind === 'order';
              const isCompleted = card.status === 'completed';

              return (
                <div
                  key={`${card.kind}_${card.id}`}
                  className={`bg-white rounded-2xl border p-4 flex flex-col justify-between gap-3 transition hover:shadow-sm ${
                    isCompleted ? 'border-[#A7F3D0] bg-[#ECFDF5]/20' : 'border-[#DCE5DC]'
                  }`}
                >
                  {/* Card Top Row */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isOrder
                              ? 'bg-[#FFE600]/30 text-[#142018]'
                              : 'bg-[#ECFDF5] text-[#0B5D32]'
                          }`}
                        >
                          {isOrder ? <Package className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-xs sm:text-sm text-[#142018] truncate">
                            {card.title}
                          </h4>
                          <div className="text-[10.5px] font-mono text-[#5F7164] truncate">
                            {card.subtitle}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                          isCompleted
                            ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                            : isOrder
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {card.statusLabel}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#5F7164] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0B5D32] shrink-0" />
                      <span className="truncate">{card.district}</span>
                    </div>

                    {isOrder && card.order && (
                      <div className="bg-[#F8FAF7] border border-[#EAEFEA] rounded-xl px-3 py-2 flex items-center justify-between text-xs">
                        <span className="text-[#5F7164] font-bold">
                          {card.itemsCount} {isAr ? 'وحدة مجدولة' : 'scheduled units'}
                        </span>
                        <span className="font-mono font-black text-[#0B5D32] tabular-nums">
                          {formatCurrency(card.totalIQD, currency, language)}
                        </span>
                      </div>
                    )}

                    {!isOrder && card.stop?.phone && (
                      <div className="text-[11px] text-[#4B6352] font-mono flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-[#5F7164]" />
                        <span dir="ltr">{card.stop.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Interactive Card Footer Actions */}
                  <div className="pt-2 border-t border-[#EAEFEA] flex items-center gap-1.5 flex-wrap">
                    {isOrder ? (
                      <>
                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={onOpenDeliveries}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#0B5D32] hover:bg-[#084725] text-white text-[11px] font-black flex items-center justify-center gap-1.5 cursor-pointer transition"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>{isAr ? 'تأكيد التسليم (PIN)' : 'Deliver (PIN)'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={onOpenNavigation}
                          className="py-2 px-3 rounded-xl bg-[#F4F4EA] hover:bg-[#E7ECE2] text-[#142018] text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition"
                        >
                          <Navigation className="w-3.5 h-3.5 text-[#0B5D32]" />
                          <span>{isAr ? 'الملاحة' : 'Navigate'}</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onStartSaleForStore(card.stop.storeId)}
                          className="flex-1 py-2 px-2.5 rounded-xl bg-[#0B5D32] hover:bg-[#084725] text-white text-[11px] font-black flex items-center justify-center gap-1 cursor-pointer transition"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>{isAr ? 'بيع (كاشير)' : 'POS Sale'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onStartCollectionForStore(card.stop.storeId)}
                          className="py-2 px-2.5 rounded-xl bg-[#FFE600]/40 hover:bg-[#FFE600]/70 text-[#142018] text-[11px] font-black flex items-center justify-center gap-1 cursor-pointer transition"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>{isAr ? 'تحصيل' : 'Collect'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={onOpenNavigation}
                          className="py-2 px-2.5 rounded-xl bg-[#F4F4EA] hover:bg-[#E7ECE2] text-[#142018] text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition"
                          title={isAr ? 'فتح في الملاحة الذكية' : 'Navigate'}
                        >
                          <Navigation className="w-3.5 h-3.5 text-[#0B5D32]" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
