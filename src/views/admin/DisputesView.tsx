import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  MessageSquarePlus,
  Plus,
  RefreshCw,
  Scale,
  Search,
  ShieldAlert,
  X
} from 'lucide-react';
import { ConfirmWithReasonDialog } from '../../components/admin/ConfirmWithReasonDialog.tsx';
import { Currency, Language } from '../../types/index.ts';
import { formatCurrency } from '../../utils/format.ts';
import { translations } from '../../utils/translations.ts';

const ADMIN_API_HEADERS: HeadersInit = {
  'x-user-role': 'admin'
};

interface DisputeItem {
  id: string;
  subOrderId: string;
  openedBy: 'store' | 'supplier' | 'admin';
  reasonCode: 'damaged' | 'missing_items' | 'wrong_items' | 'late' | 'price_mismatch' | 'other';
  description: string;
  claimedAmountIQD?: number;
  status: 'open' | 'under_review' | 'resolved' | 'rejected';
  resolution?: {
    type: 'full_refund' | 'partial_credit' | 'replacement' | 'rejected';
    amountIQD?: number;
    restockToSupplier?: boolean;
    note: string;
    resolvedBy?: string;
  };
  createdAt: string;
  resolvedAt?: string;
  notes: {
    id: string;
    at: string;
    author: string;
    text: string;
  }[];
  subOrder: {
    id: string;
    parentOrderId: string;
    storeId: string;
    storeName: string;
    supplierId: string;
    supplierName: string;
    subtotalIQD: number;
    paymentMethod: string;
    status: string;
    createdAt: string;
  } | null;
}

interface DisputesListPayload {
  items: DisputeItem[];
  counts: {
    all: number;
    open: number;
    under_review: number;
    resolved: number;
    rejected: number;
  };
  eligibleOrdersForDispute: {
    id: string;
    storeName: string;
    supplierName: string;
    subtotalIQD: number;
    paymentMethod: string;
  }[];
}

interface DisputesViewProps {
  language: Language;
  currency: Currency;
  initialDeepLink?: {
    selectedId?: string | null;
    filterPreset?: string | null;
  };
  onDataChanged?: () => void;
  onOpenOrder?: (orderId: string) => void;
}

export const DisputesView: React.FC<DisputesViewProps> = ({
  language,
  currency,
  initialDeepLink,
  onDataChanged,
  onOpenOrder
}) => {
  const isAr = language === 'ar';
  const t = translations[language];

  const [statusFilter, setStatusFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [data, setData] = useState<DisputesListPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(
    initialDeepLink?.selectedId || null
  );

  // Review confirmation
  const [reviewTarget, setReviewTarget] = useState<DisputeItem | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Resolve modal state
  const [resolveTarget, setResolveTarget] = useState<DisputeItem | null>(null);
  const [resType, setResType] = useState<'full_refund' | 'partial_credit' | 'replacement' | 'rejected'>(
    'partial_credit'
  );
  const [resAmount, setResAmount] = useState('');
  const [resRestock, setResRestock] = useState(false);
  const [resNote, setResNote] = useState('');
  const [resReason, setResReason] = useState('');
  const [resSaving, setResSaving] = useState(false);
  const [resError, setResError] = useState<string | null>(null);

  // Create dispute modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [newSubOrderId, setNewSubOrderId] = useState('');
  const [newOpenedBy, setNewOpenedBy] = useState<'store' | 'supplier' | 'admin'>('store');
  const [newReasonCode, setNewReasonCode] = useState<DisputeItem['reasonCode']>('damaged');
  const [newClaimedAmount, setNewClaimedAmount] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Notes on selected dispute
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (reasonFilter !== 'all') params.set('reasonCode', reasonFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/disputes?${params.toString()}`, {
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
  }, [statusFilter, reasonFilter, search, t.error]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  useEffect(() => {
    if (!initialDeepLink?.selectedId) return;
    const match = (data?.items || []).find(
      (d) => d.id === initialDeepLink.selectedId || d.subOrderId === initialDeepLink.selectedId
    );
    if (match) {
      setSelectedDisputeId(match.id);
    } else if (data?.eligibleOrdersForDispute?.some((o) => o.id === initialDeepLink.selectedId)) {
      setNewSubOrderId(initialDeepLink.selectedId);
      setCreateOpen(true);
    }
  }, [initialDeepLink, data]);

  const handleOpenCreateModal = () => {
    setCreateError(null);
    setNewSubOrderId(data?.eligibleOrdersForDispute?.[0]?.id || '');
    setNewOpenedBy('store');
    setNewReasonCode('damaged');
    setNewClaimedAmount('');
    setNewDescription('');
    setCreateOpen(true);
  };

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubOrderId) {
      setCreateError(isAr ? 'اختر الطلب أولاً' : 'Please select an order');
      return;
    }
    if (newDescription.trim().length < 5) {
      setCreateError(t.adminConfirmReasonRequired);
      return;
    }
    setCreateSaving(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/admin/disputes', {
        method: 'POST',
        headers: { ...ADMIN_API_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subOrderId: newSubOrderId,
          openedBy: newOpenedBy,
          reasonCode: newReasonCode,
          claimedAmountIQD: newClaimedAmount !== '' ? Number(newClaimedAmount) : undefined,
          description: newDescription.trim()
        })
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || t.error);
      }
      setCreateOpen(false);
      setSelectedDisputeId(json.data.id);
      await fetchDisputes();
      onDataChanged?.();
    } catch (err: any) {
      setCreateError(err?.message || t.error);
    } finally {
      setCreateSaving(false);
    }
  };

  const handleConfirmReview = async (reason: string) => {
    if (!reviewTarget) return;
    setReviewLoading(true);
    setReviewError(null);
    try {
      const res = await fetch(`/api/admin/disputes/${encodeURIComponent(reviewTarget.id)}/review`, {
        method: 'POST',
        headers: { ...ADMIN_API_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || t.error);
      }
      setReviewTarget(null);
      await fetchDisputes();
      onDataChanged?.();
    } catch (err: any) {
      setReviewError(err?.message || t.error);
    } finally {
      setReviewLoading(false);
    }
  };

  const openResolveModal = (d: DisputeItem) => {
    setResolveTarget(d);
    setResType(d.claimedAmountIQD ? 'partial_credit' : 'replacement');
    setResAmount(d.claimedAmountIQD ? String(d.claimedAmountIQD) : '');
    setResRestock(false);
    setResNote('');
    setResReason('');
    setResError(null);
  };

  const handleConfirmResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveTarget) return;
    if (resReason.trim().length < 5) {
      setResError(t.adminConfirmReasonRequired);
      return;
    }
    if (resType === 'partial_credit' && (!Number(resAmount) || Number(resAmount) <= 0)) {
      setResError(isAr ? 'أدخل قيمة خصم صالحة أكبر من صفر' : 'Enter a valid partial credit amount');
      return;
    }
    setResSaving(true);
    setResError(null);
    try {
      const res = await fetch(`/api/admin/disputes/${encodeURIComponent(resolveTarget.id)}/resolve`, {
        method: 'POST',
        headers: { ...ADMIN_API_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: resType,
          amountIQD: resType === 'partial_credit' ? Number(resAmount) : undefined,
          restockToSupplier: resRestock,
          note: resNote.trim() || resReason.trim(),
          reason: resReason.trim()
        })
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || t.error);
      }
      setResolveTarget(null);
      await fetchDisputes();
      onDataChanged?.();
    } catch (err: any) {
      setResError(err?.message || t.error);
    } finally {
      setResSaving(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisputeId || noteText.trim().length < 3) return;
    setNoteSaving(true);
    try {
      const res = await fetch(
        `/api/admin/disputes/${encodeURIComponent(selectedDisputeId)}/notes`,
        {
          method: 'POST',
          headers: { ...ADMIN_API_HEADERS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: noteText.trim() })
        }
      );
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || t.error);
      }
      setNoteText('');
      await fetchDisputes();
    } catch (err: any) {
      setError(err?.message || t.error);
    } finally {
      setNoteSaving(false);
    }
  };

  const reasonLabels: Record<DisputeItem['reasonCode'], string> = {
    damaged: isAr ? 'بضاعة تالفة' : 'Damaged Goods',
    missing_items: isAr ? 'نقص كميات' : 'Missing Items',
    wrong_items: isAr ? 'أصناف خاطئة' : 'Wrong Items',
    late: isAr ? 'تأخير توصيل' : 'Late Delivery',
    price_mismatch: isAr ? 'اختلاف تسعير' : 'Price Mismatch',
    other: isAr ? 'أخرى' : 'Other'
  };

  const statusMeta = (status: DisputeItem['status']) => {
    switch (status) {
      case 'open':
        return { label: t.adminDispTabOpen, cls: 'bg-rose-50 text-rose-800 border-rose-200' };
      case 'under_review':
        return { label: t.adminDispTabUnderReview, cls: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'resolved':
        return { label: t.adminDispTabResolved, cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'rejected':
        return { label: t.adminDispTabRejected, cls: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  const resolutionLabel = (type: string) => {
    if (type === 'full_refund') return isAr ? 'استرداد كامل وعكس الفاتورة' : 'Full Refund & Invoice Reversal';
    if (type === 'partial_credit') return isAr ? 'خصم جزئي (إشعار دائن)' : 'Partial Credit Note';
    if (type === 'replacement') return isAr ? 'استبدال عيني' : 'Replacement';
    return isAr ? 'رفض النزاع' : 'Rejected';
  };

  const items = data?.items || [];
  const selectedDispute = items.find((d) => d.id === selectedDisputeId) || null;
  const counts = data?.counts;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl sm:rounded-2xl border border-[#E5E7EB] p-3.5 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-base sm:text-xl font-black text-[#221F1F]">{t.adminDispTitle}</h1>
            <p className="text-xs sm:text-sm text-[#797878] mt-0.5">{t.adminDispSubtitle}</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00A046] hover:bg-[#008A3C] text-white text-xs font-extrabold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.adminDispNewBtn}</span>
            </button>
            <button
              type="button"
              onClick={fetchDisputes}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-xs font-bold text-[#221F1F] cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{t.adminRefresh}</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: t.adminDispTabAll, count: counts?.all },
            { id: 'open', label: t.adminDispTabOpen, count: counts?.open },
            { id: 'under_review', label: t.adminDispTabUnderReview, count: counts?.under_review },
            { id: 'resolved', label: t.adminDispTabResolved, count: counts?.resolved },
            { id: 'rejected', label: t.adminDispTabRejected, count: counts?.rejected }
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#00A046] text-white border-[#00A046]'
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

        {/* Search & Reason Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#F3F4F6]">
          <div className="sm:col-span-2 relative">
            <Search
              className={`w-4 h-4 text-[#797878] absolute top-1/2 -translate-y-1/2 ${
                isAr ? 'right-3' : 'left-3'
              }`}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? 'ابحث برقم النزاع، رقم الطلب، المتجر أو المورد...' : 'Search by dispute ID, order, store, supplier...'}
              className={`w-full rounded-xl border border-[#D1D5DB] bg-white py-2 text-xs text-[#221F1F] ${
                isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
              }`}
            />
          </div>
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="rounded-xl border border-[#D1D5DB] bg-white px-2.5 py-2 text-xs font-semibold text-[#221F1F]"
          >
            <option value="all">{isAr ? 'جميع أسباب النزاع' : 'All Reasons'}</option>
            {Object.entries(reasonLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Disputes List */}
        <div className="xl:col-span-2 bg-white rounded-xl sm:rounded-2xl border border-[#E5E7EB] p-3.5 sm:p-5 shadow-xs">
          {loading && items.length === 0 ? (
            <div className="py-10 text-center text-xs font-bold text-[#797878]">{t.loading}</div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-xs font-bold text-[#797878]">{t.adminDispEmpty}</div>
          ) : (
            <div className="space-y-3">
              {items.map((d) => {
                const sm = statusMeta(d.status);
                const isSelected = selectedDispute?.id === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDisputeId(d.id)}
                    className={`rounded-xl border p-3.5 transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'border-[#00A046] bg-emerald-50/30 ring-1 ring-[#00A046]/20'
                        : 'border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#00A046]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-[#221F1F]">{d.id}</span>
                          <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-[10px] font-bold text-[#374151]">
                            {reasonLabels[d.reasonCode]}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-[#4A4747] mt-1">
                          {d.subOrder
                            ? `${d.subOrder.storeName} ← ${d.subOrder.supplierName} (${d.subOrderId})`
                            : d.subOrderId}
                        </div>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-lg border text-[10px] font-extrabold ${sm.cls}`}>
                        {sm.label}
                      </span>
                    </div>

                    <p className="text-xs text-[#374151] leading-relaxed">{d.description}</p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E5E7EB]">
                      <div className="text-[11px] text-[#797878] font-semibold">
                        {d.claimedAmountIQD !== undefined && (
                          <span className="text-[#221F1F] font-extrabold">
                            {isAr ? 'المبلغ المطالب به:' : 'Claimed:'}{' '}
                            {formatCurrency(d.claimedAmountIQD, currency, language)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {d.status === 'open' && (
                          <button
                            type="button"
                            onClick={() => {
                              setReviewError(null);
                              setReviewTarget(d);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-[11px] font-extrabold hover:bg-amber-100 cursor-pointer"
                          >
                            {t.adminDispReviewBtn}
                          </button>
                        )}
                        {(d.status === 'open' || d.status === 'under_review') && (
                          <button
                            type="button"
                            onClick={() => openResolveModal(d)}
                            className="px-2.5 py-1 rounded-lg bg-[#00A046] hover:bg-[#008A3C] text-white text-[11px] font-extrabold cursor-pointer"
                          >
                            {t.adminDispResolveBtn}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Dispute Detail & Notes Panel */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-[#E5E7EB] p-4 shadow-xs h-fit space-y-4">
          {!selectedDispute ? (
            <div className="py-12 text-center text-xs text-[#797878] font-semibold space-y-2">
              <Scale className="w-8 h-8 text-[#00A046]/50 mx-auto" />
              <p>{isAr ? 'اختر نزاعاً لعرض التفاصيل والملاحظات وإجراءات التسوية' : 'Select a dispute to inspect details & resolution actions'}</p>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#E5E7EB]">
                <div>
                  <div className="text-sm font-black text-[#221F1F]">{selectedDispute.id}</div>
                  <div className="text-[11px] text-[#797878]">
                    {isAr ? 'مفتوح من:' : 'Opened by:'} {selectedDispute.openedBy}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-lg border text-[10px] font-extrabold ${
                    statusMeta(selectedDispute.status).cls
                  }`}
                >
                  {statusMeta(selectedDispute.status).label}
                </span>
              </div>

              {selectedDispute.subOrder && (
                <div className="rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[#221F1F]">{selectedDispute.subOrder.id}</span>
                    {onOpenOrder && (
                      <button
                        type="button"
                        onClick={() => onOpenOrder(selectedDispute.subOrderId)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00A046] hover:underline cursor-pointer"
                      >
                        <span>{isAr ? 'فتح الطلب' : 'Open Order'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="text-[#4A4747]">
                    {selectedDispute.subOrder.storeName} ← {selectedDispute.subOrder.supplierName}
                  </div>
                  <div className="flex items-center justify-between font-bold">
                    <span>{selectedDispute.subOrder.paymentMethod === 'credit' ? (isAr ? 'آجل' : 'Credit') : 'COD'}</span>
                    <span className="text-[#00A046]">
                      {formatCurrency(selectedDispute.subOrder.subtotalIQD, currency, language)}
                    </span>
                  </div>
                </div>
              )}

              {selectedDispute.resolution && (
                <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-3 text-xs space-y-1">
                  <div className="font-extrabold text-[#00A046] flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{resolutionLabel(selectedDispute.resolution.type)}</span>
                  </div>
                  {selectedDispute.resolution.amountIQD !== undefined && (
                    <div className="font-bold text-[#221F1F]">
                      {isAr ? 'القيمة المعتمدة:' : 'Resolved Amount:'}{' '}
                      {formatCurrency(selectedDispute.resolution.amountIQD, currency, language)}
                    </div>
                  )}
                  <p className="text-[#374151]">{selectedDispute.resolution.note}</p>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2.5">
                <div className="text-xs font-extrabold text-[#221F1F] flex items-center gap-1.5">
                  <MessageSquarePlus className="w-4 h-4 text-[#00A046]" />
                  <span>{isAr ? 'سجل المتابعة والملاحظات' : 'Notes & History'}</span>
                </div>
                <form onSubmit={handleAddNote} className="flex gap-1.5">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder={isAr ? 'أضف ملاحظة...' : 'Add note...'}
                    className="flex-1 rounded-xl border border-[#D1D5DB] px-2.5 py-1.5 text-xs text-[#221F1F]"
                  />
                  <button
                    type="submit"
                    disabled={noteSaving || noteText.trim().length < 3}
                    className="px-3 py-1.5 rounded-xl bg-[#00A046] text-white text-xs font-extrabold disabled:opacity-50 cursor-pointer"
                  >
                    {isAr ? 'إضافة' : 'Add'}
                  </button>
                </form>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedDispute.notes.map((n) => (
                    <div key={n.id} className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-xs">
                      <div className="text-[10px] font-bold text-[#797878]">{n.author}</div>
                      <p className="mt-0.5 text-[#221F1F]">{n.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Review Confirm Dialog */}
      <ConfirmWithReasonDialog
        isOpen={Boolean(reviewTarget)}
        title={`${t.adminDispReviewBtn} (${reviewTarget?.id || ''})`}
        confirmLabel={t.adminDispReviewBtn}
        danger={false}
        loading={reviewLoading}
        serverError={reviewError}
        language={language}
        onConfirm={handleConfirmReview}
        onCancel={() => {
          if (!reviewLoading) setReviewTarget(null);
        }}
      />

      {/* Resolve Dispute Modal */}
      {resolveTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E7EB] bg-emerald-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#00A046]" />
                <h3 className="text-sm sm:text-base font-extrabold text-[#221F1F]">
                  {t.adminDispResolveModalTitle} ({resolveTarget.id})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !resSaving && setResolveTarget(null)}
                className="p-1.5 rounded-lg text-[#797878] hover:bg-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmResolve} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#221F1F] mb-1.5">
                  {isAr ? 'نوع القرار' : 'Resolution Type'}
                </label>
                <select
                  value={resType}
                  onChange={(e) => setResType(e.target.value as any)}
                  className="w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-xs font-semibold text-[#221F1F]"
                >
                  <option value="partial_credit">{resolutionLabel('partial_credit')}</option>
                  <option value="full_refund">{resolutionLabel('full_refund')}</option>
                  <option value="replacement">{resolutionLabel('replacement')}</option>
                  <option value="rejected">{resolutionLabel('rejected')}</option>
                </select>
              </div>

              {resType === 'partial_credit' && (
                <div>
                  <label className="block font-bold text-[#221F1F] mb-1.5">
                    {isAr
                      ? `مبلغ الإشعار الدائن (بحد أقصى ${formatCurrency(resolveTarget.subOrder?.subtotalIQD || 0, currency, language)})`
                      : `Credit Amount (Max ${formatCurrency(resolveTarget.subOrder?.subtotalIQD || 0, currency, language)})`}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={resolveTarget.subOrder?.subtotalIQD || undefined}
                    value={resAmount}
                    onChange={(e) => setResAmount(e.target.value)}
                    className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2 text-xs text-[#221F1F]"
                  />
                </div>
              )}

              {resType === 'full_refund' && resolveTarget.subOrder?.paymentMethod === 'credit' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {isAr
                      ? 'سيتم عكس قيد الفاتورة في دفتر الأستاذ بقيد عكسي وتحويل الطلب إلى ملغي.'
                      : 'Will reverse the INVOICE ledger entry and transition the sub-order to cancelled.'}
                  </span>
                </div>
              )}

              {(resType === 'full_refund' || resType === 'partial_credit' || resType === 'replacement') && (
                <label className="flex items-center gap-2 font-bold text-[#221F1F] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resRestock}
                    onChange={(e) => setResRestock(e.target.checked)}
                    className="rounded border-[#D1D5DB] text-[#00A046]"
                  />
                  <span>{t.adminDispRestockLabel}</span>
                </label>
              )}

              <div>
                <label className="block font-bold text-[#221F1F] mb-1.5">
                  {isAr ? 'ملاحظة القرار النهائي' : 'Resolution Note'}
                </label>
                <input
                  type="text"
                  value={resNote}
                  onChange={(e) => setResNote(e.target.value)}
                  placeholder={isAr ? 'ملخص التسوية المتفق عليها...' : 'Summary of resolution...'}
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2 text-xs text-[#221F1F]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#221F1F] mb-1.5">
                  {t.adminConfirmReasonLabel} <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={2}
                  value={resReason}
                  onChange={(e) => setResReason(e.target.value)}
                  placeholder={t.adminConfirmReasonPlaceholder}
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2 text-xs text-[#221F1F] resize-none"
                />
              </div>

              {resError && <p className="text-xs font-bold text-red-600">{resError}</p>}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#F3F4F6]">
                <button
                  type="button"
                  onClick={() => setResolveTarget(null)}
                  disabled={resSaving}
                  className="px-4 py-2 rounded-xl border border-[#E5E7EB] bg-white font-bold text-[#4A4747] cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={resSaving}
                  className="px-4 py-2 rounded-xl bg-[#00A046] hover:bg-[#008A3C] text-white font-extrabold cursor-pointer disabled:opacity-60"
                >
                  {resSaving ? t.loading : t.confirm}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Open New Dispute Modal */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E7EB] bg-emerald-50/70 flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-extrabold text-[#221F1F]">{t.adminDispNewBtn}</h3>
              <button
                type="button"
                onClick={() => !createSaving && setCreateOpen(false)}
                className="p-1.5 rounded-lg text-[#797878] hover:bg-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDispute} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#221F1F] mb-1">
                  {isAr ? 'الطلب المسلّم' : 'Delivered Sub-Order'}
                </label>
                <select
                  value={newSubOrderId}
                  onChange={(e) => setNewSubOrderId(e.target.value)}
                  className="w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-xs font-semibold text-[#221F1F]"
                >
                  {(data?.eligibleOrdersForDispute || []).length === 0 ? (
                    <option value="">
                      {isAr ? 'لا توجد طلبات مسلّمة متاحة لفتح نزاع' : 'No eligible delivered orders'}
                    </option>
                  ) : (
                    (data?.eligibleOrdersForDispute || []).map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.id} — {o.storeName} ({formatCurrency(o.subtotalIQD, currency, language)})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-[#221F1F] mb-1">
                    {isAr ? 'جهة التبليغ' : 'Opened By'}
                  </label>
                  <select
                    value={newOpenedBy}
                    onChange={(e) => setNewOpenedBy(e.target.value as any)}
                    className="w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-xs font-semibold"
                  >
                    <option value="store">{isAr ? 'المتجر' : 'Store'}</option>
                    <option value="supplier">{isAr ? 'المورد' : 'Supplier'}</option>
                    <option value="admin">{isAr ? 'الإدارة' : 'Admin'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#221F1F] mb-1">
                    {isAr ? 'سبب النزاع' : 'Reason Code'}
                  </label>
                  <select
                    value={newReasonCode}
                    onChange={(e) => setNewReasonCode(e.target.value as any)}
                    className="w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-xs font-semibold"
                  >
                    {Object.entries(reasonLabels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#221F1F] mb-1">
                  {isAr ? 'المبلغ المطالب به (اختياري - د.ع)' : 'Claimed Amount (Optional)'}
                </label>
                <input
                  type="number"
                  min={0}
                  value={newClaimedAmount}
                  onChange={(e) => setNewClaimedAmount(e.target.value)}
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[#221F1F] mb-1">
                  {isAr ? 'وصف المشكلة' : 'Description'} <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2 text-xs resize-none"
                />
              </div>

              {createError && <p className="text-xs font-bold text-red-600">{createError}</p>}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#F3F4F6]">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  disabled={createSaving}
                  className="px-4 py-2 rounded-xl border border-[#E5E7EB] bg-white font-bold text-[#4A4747] cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={createSaving}
                  className="px-4 py-2 rounded-xl bg-[#00A046] hover:bg-[#008A3C] text-white font-extrabold cursor-pointer disabled:opacity-60"
                >
                  {createSaving ? t.loading : t.confirm}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
