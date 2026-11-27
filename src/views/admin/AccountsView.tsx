import React, { useCallback, useEffect, useState } from 'react';
import {
  Archive,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Edit3,
  Eye,
  FileCheck2,
  FileText,
  MapPin,
  MessageSquarePlus,
  PauseCircle,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  Users,
  X,
  XCircle
} from 'lucide-react';
import {
  AccountKycInfo,
  AdminInternalNote,
  Currency,
  KycChecklistItem,
  KycChecklistItemStatus,
  KycChecklistKey,
  Language,
  SellerBusinessType,
  VerificationStatus
} from '../../types/index.ts';
import { formatCurrency } from '../../utils/format.ts';
import { getLocalizedText, translations } from '../../utils/translations.ts';
import { ConfirmWithReasonDialog } from '../../components/admin/ConfirmWithReasonDialog.tsx';

export type AccountSectionMode = 'suppliers' | 'stores' | 'drivers' | 'store_staff';
type ApiAccountType = 'suppliers' | 'stores' | 'drivers' | 'staff';
type StatusTabKey = 'all' | 'pending' | 'active' | 'suspended' | 'rejected_archived';
type AccountActionType = 'approve' | 'reject' | 'suspend' | 'reactivate' | 'archive';
type DetailTabKey = 'overview' | 'kyc' | 'activity' | 'credit' | 'notes' | 'audit';

interface AccountsViewProps {
  mode: AccountSectionMode;
  language: Language;
  currency: Currency;
  initialStatusTab?: StatusTabKey;
  initialSelectedId?: string | null;
  onDataChanged?: () => void;
}

interface AccountListResponse {
  items: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statusCounts: {
    all: number;
    pending: number;
    active: number;
    suspended: number;
    rejected_archived: number;
  };
  cities: string[];
}

interface AccountDetailData {
  account: any;
  recentOrders: any[];
  creditAccounts: any[];
  auditLogs: any[];
}

const ADMIN_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
  'x-user-role': 'admin'
};

const BUSINESS_TYPE_LABELS: Record<SellerBusinessType, { ar: string; en: string }> = {
  manufacturer: { ar: 'مصنع', en: 'Manufacturer' },
  importer: { ar: 'مستورد', en: 'Importer' },
  wholesaler: { ar: 'تاجر جملة', en: 'Wholesaler' },
  distributor: { ar: 'موزع', en: 'Distributor' },
  trader: { ar: 'تاجر', en: 'Trader' },
  warehouse: { ar: 'مخزن توزيع', en: 'Warehouse' },
  brand_owner: { ar: 'مالك علامة', en: 'Brand Owner' },
  authorized_distributor: { ar: 'موزع معتمد', en: 'Authorized Distributor' }
};

const VERIFICATION_LABELS: Record<VerificationStatus, { ar: string; en: string }> = {
  pending: { ar: 'قيد المراجعة', en: 'Pending' },
  verified: { ar: 'موثق', en: 'Verified' },
  verified_business: { ar: 'نشاط تجاري موثق', en: 'Verified Business' },
  authorized_distributor: { ar: 'موزع رسمي معتمد', en: 'Authorized Distributor' }
};

const KYC_ITEM_LABELS: Record<KycChecklistKey, { ar: string; en: string }> = {
  commercial_license: { ar: 'إجازة ممارسة المهنة / السجل التجاري', en: 'Commercial License / Registration' },
  owner_id: { ar: 'هوية الأحوال / البطاقة الوطنية للمالك', en: 'Owner National ID' },
  address_proof: { ar: 'إثبات عنوان المخزن أو المتجر', en: 'Address / Premises Proof' },
  phone_verified: { ar: 'تأكيد رقم الهاتف التشغيلي', en: 'Verified Operational Phone' },
  driver_license: { ar: 'إجازة سوق نافذة', en: 'Valid Driver License' },
  vehicle_registration: { ar: 'سنوية / تسجيل المركبة', en: 'Vehicle Registration' },
  insurance: { ar: 'تأمين المركبة', en: 'Vehicle Insurance' },
  vehicle_inspection: { ar: 'فحص سلامة وصلاحية المركبة', en: 'Vehicle Safety Inspection' }
};

export const AccountsView: React.FC<AccountsViewProps> = ({
  mode,
  language,
  currency,
  initialStatusTab,
  initialSelectedId,
  onDataChanged
}) => {
  const isAr = language === 'ar';
  const t = translations[language];
  const apiType: ApiAccountType = mode === 'store_staff' ? 'staff' : mode;
  const hasPendingWorkflow = mode === 'suppliers' || mode === 'stores';

  // List filters
  const [statusTab, setStatusTab] = useState<StatusTabKey>(initialStatusTab || 'all');
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);

  const [listData, setListData] = useState<AccountListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Drawer State
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null);
  const [detailTab, setDetailTab] = useState<DetailTabKey>('overview');
  const [detail, setDetail] = useState<AccountDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Action Dialog State
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    name: string;
    action: AccountActionType;
  } | null>(null);
  const [approveRank, setApproveRank] = useState<VerificationStatus>('verified_business');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Inline Edit Basic Info State
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [editSaving, setEditSaving] = useState(false);

  // KYC Edit State
  const [kycForm, setKycForm] = useState<AccountKycInfo>({
    licenseNo: '',
    taxId: '',
    checklist: []
  });
  const [kycSaving, setKycSaving] = useState(false);

  // Internal Note State
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  // Create Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    person: '',
    phone: '',
    city: 'بغداد',
    district: '',
    address: '',
    businessType: 'wholesaler' as SellerBusinessType,
    storeType: 'supermarket' as 'supermarket' | 'grocery' | 'wholesale_sub',
    verificationStatus: 'pending' as VerificationStatus,
    minOrderValueIQD: 100000,
    licenseNo: '',
    taxId: ''
  });

  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Reset filters when switching between suppliers / stores / drivers / store_staff
  useEffect(() => {
    setStatusTab(initialStatusTab || 'all');
    setSearch('');
    setCityFilter('all');
    setBusinessTypeFilter('all');
    setSortBy('newest');
    setPage(1);
    setSelectedId(initialSelectedId || null);
    setDetail(null);
    setEditMode(false);
    setFeedbackBanner(null);
  }, [mode, initialStatusTab, initialSelectedId]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (statusTab !== 'all') qs.set('statusTab', statusTab);
      if (search.trim()) qs.set('search', search.trim());
      if (cityFilter !== 'all') qs.set('city', cityFilter);
      if (mode === 'suppliers' && businessTypeFilter !== 'all') {
        qs.set('businessType', businessTypeFilter);
      }
      qs.set('sortBy', sortBy);
      qs.set('page', String(page));
      qs.set('pageSize', '12');

      const res = await fetch(`/api/admin/${apiType}?${qs.toString()}`, {
        headers: { 'x-user-role': 'admin' }
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || t.adminLoadError);
      }
      setListData(json.data);
    } catch (err: any) {
      setError(err?.message || t.adminLoadError);
    } finally {
      setLoading(false);
    }
  }, [apiType, statusTab, search, cityFilter, businessTypeFilter, mode, sortBy, page, t.adminLoadError]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchList();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [fetchList]);

  const fetchDetail = useCallback(
    async (id: string) => {
      setDetailLoading(true);
      try {
        const res = await fetch(`/api/admin/${apiType}/${encodeURIComponent(id)}`, {
          headers: { 'x-user-role': 'admin' }
        });
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.message || t.error);
        }
        const data: AccountDetailData = json.data;
        setDetail(data);
        setKycForm({
          licenseNo: data.account?.kyc?.licenseNo || '',
          taxId: data.account?.kyc?.taxId || '',
          checklist: data.account?.kyc?.checklist || []
        });
        setEditForm({
          companyName: data.account.companyName || '',
          contactPerson: data.account.contactPerson || '',
          name: data.account.name || '',
          ownerName: data.account.ownerName || '',
          phone: data.account.phone || '',
          city: data.account.city || '',
          district: data.account.district || '',
          address: data.account.address || '',
          businessType: data.account.businessType || 'wholesaler',
          storeType: data.account.storeType || 'grocery',
          minOrderValueIQD: data.account.orderRules?.minOrderValueIQD ?? 100000,
          vehiclePlate: data.account.vehiclePlate || '',
          vehicleModel: data.account.vehicleModel || '',
          vanWarehouseName: data.account.vanWarehouseName || '',
          branchName: data.account.branchName || '',
          role: data.account.role || 'cashier'
        });
      } catch (err: any) {
        setFeedbackBanner({ type: 'error', text: err?.message || t.error });
      } finally {
        setDetailLoading(false);
      }
    },
    [apiType, t.error]
  );

  useEffect(() => {
    if (selectedId) {
      setDetailTab('overview');
      setEditMode(false);
      fetchDetail(selectedId);
    } else {
      setDetail(null);
    }
  }, [selectedId, fetchDetail]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedbackBanner({ type, text });
    window.setTimeout(() => {
      setFeedbackBanner((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const handleConfirmAction = async (reason: string) => {
    if (!pendingAction) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const payload: Record<string, any> = { reason };
      if (mode === 'suppliers' && pendingAction.action === 'approve') {
        payload.verificationStatus = approveRank;
      }
      const res = await fetch(
        `/api/admin/${apiType}/${encodeURIComponent(pendingAction.id)}/${pendingAction.action}`,
        {
          method: 'POST',
          headers: ADMIN_HEADERS,
          body: JSON.stringify(payload)
        }
      );
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || t.error);
      }
      setPendingAction(null);
      showToast('success', json.message || t.success);
      await fetchList();
      if (selectedId === pendingAction.id && json.data) {
        setDetail(json.data);
      }
      onDataChanged?.();
    } catch (err: any) {
      setActionError(err?.message || t.error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/${apiType}/${encodeURIComponent(selectedId)}`, {
        method: 'PATCH',
        headers: ADMIN_HEADERS,
        body: JSON.stringify(editForm)
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || t.error);
      }
      setDetail(json.data);
      setEditMode(false);
      showToast('success', json.message || t.success);
      fetchList();
      onDataChanged?.();
    } catch (err: any) {
      showToast('error', err?.message || t.error);
    } finally {
      setEditSaving(false);
    }
  };

  const handleSaveKyc = async () => {
    if (!selectedId) return;
    setKycSaving(true);
    try {
      const res = await fetch(`/api/admin/${apiType}/${encodeURIComponent(selectedId)}/kyc`, {
        method: 'PATCH',
        headers: ADMIN_HEADERS,
        body: JSON.stringify(kycForm)
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || t.error);
      }
      setDetail(json.data);
      showToast('success', json.message || t.success);
      fetchList();
      onDataChanged?.();
    } catch (err: any) {
      showToast('error', err?.message || t.error);
    } finally {
      setKycSaving(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !noteText.trim()) return;
    setNoteSaving(true);
    try {
      const res = await fetch(`/api/admin/${apiType}/${encodeURIComponent(selectedId)}/notes`, {
        method: 'POST',
        headers: ADMIN_HEADERS,
        body: JSON.stringify({ text: noteText.trim() })
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || t.error);
      }
      setDetail(json.data);
      setNoteText('');
      showToast('success', json.message || t.success);
      onDataChanged?.();
    } catch (err: any) {
      showToast('error', err?.message || t.error);
    } finally {
      setNoteSaving(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSaving(true);
    setCreateError(null);
    try {
      const endpoint = mode === 'suppliers' ? '/api/admin/suppliers' : '/api/admin/stores';
      const body =
        mode === 'suppliers'
          ? {
              companyName: createForm.name,
              contactPerson: createForm.person,
              phone: createForm.phone,
              city: createForm.city,
              address: createForm.address,
              businessType: createForm.businessType,
              verificationStatus: createForm.verificationStatus,
              minOrderValueIQD: Number(createForm.minOrderValueIQD) || 100000,
              licenseNo: createForm.licenseNo,
              taxId: createForm.taxId
            }
          : {
              name: createForm.name,
              ownerName: createForm.person,
              phone: createForm.phone,
              city: createForm.city,
              district: createForm.district,
              address: createForm.address,
              storeType: createForm.storeType,
              verificationStatus: createForm.verificationStatus === 'pending' ? 'pending' : 'verified',
              licenseNo: createForm.licenseNo,
              taxId: createForm.taxId
            };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: ADMIN_HEADERS,
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || t.error);
      }

      setCreateOpen(false);
      setCreateForm({
        name: '',
        person: '',
        phone: '',
        city: 'بغداد',
        district: '',
        address: '',
        businessType: 'wholesaler',
        storeType: 'supermarket',
        verificationStatus: 'pending',
        minOrderValueIQD: 100000,
        licenseNo: '',
        taxId: ''
      });
      showToast('success', json.message || t.success);
      await fetchList();
      onDataChanged?.();
    } catch (err: any) {
      setCreateError(err?.message || t.error);
    } finally {
      setCreateSaving(false);
    }
  };

  const getHeaderMeta = () => {
    switch (mode) {
      case 'suppliers':
        return {
          title: isAr ? 'إدارة الموردين والتوثيق' : 'Suppliers & Verification',
          subtitle: isAr
            ? 'مراجعة طلبات الانضمام، اعتماد الرتب التجارية، إدارة الإيقاف والأرشفة'
            : 'Review onboarding requests, verification tiers, suspensions, and archives',
          icon: Building2
        };
      case 'stores':
        return {
          title: isAr ? 'إدارة متاجر التجزئة' : 'Retail Stores Management',
          subtitle: isAr
            ? 'متابعة المتاجر المسجلة، حالات الاعتماد، الإيقاف التشغيلي والائتمان'
            : 'Manage registered retail stores, verification status, blocks, and credit',
          icon: Store
        };
      case 'drivers':
        return {
          title: isAr ? 'إدارة السائقين والمناديب' : 'Field Drivers & Van Fleet',
          subtitle: isAr
            ? 'متابعة حالة السائقين النشطين، الفانات، وأرصدة التحصيل'
            : 'Manage field delivery drivers, van inventory status, and operational access',
          icon: Truck
        };
      case 'store_staff':
        return {
          title: isAr ? 'إدارة موظفي المتاجر' : 'Store Staff Accounts',
          subtitle: isAr
            ? 'مراقبة حسابات الكاشير والمحاسبين المرتبطين بالمتاجر وإيقافها عند الحاجة'
            : 'Audit cashier and accountant logins linked to retail stores',
          icon: Users
        };
    }
  };

  const renderStatusBadge = (lifecycleState: string) => {
    switch (lifecycleState) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" />
            {t.adminAccStatusPending}
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-extrabold bg-emerald-50 text-[#00A046] border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            {t.adminAccStatusActive}
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-extrabold bg-red-50 text-red-700 border border-red-200">
            <PauseCircle className="w-3 h-3" />
            {t.adminAccStatusSuspended}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-extrabold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3" />
            {t.adminAccStatusRejected}
          </span>
        );
      case 'archived':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-extrabold bg-gray-100 text-[#4A4747] border border-[#E5E7EB]">
            <Archive className="w-3 h-3" />
            {t.adminAccStatusArchived}
          </span>
        );
    }
  };

  const getActionMeta = (
    action: AccountActionType
  ): { label: string; danger: boolean; icon: React.ComponentType<{ className?: string }>; cls: string } => {
    switch (action) {
      case 'approve':
        return {
          label: t.adminAccActionApprove,
          danger: false,
          icon: ShieldCheck,
          cls: 'bg-[#00A046] hover:bg-[#008A3C] text-white border-transparent'
        };
      case 'reactivate':
        return {
          label: t.adminAccActionReactivate,
          danger: false,
          icon: RotateCcw,
          cls: 'bg-[#00A046] hover:bg-[#008A3C] text-white border-transparent'
        };
      case 'reject':
        return {
          label: t.adminAccActionReject,
          danger: true,
          icon: XCircle,
          cls: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
        };
      case 'suspend':
        return {
          label: t.adminAccActionSuspend,
          danger: true,
          icon: PauseCircle,
          cls: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
        };
      case 'archive':
        return {
          label: t.adminAccActionArchive,
          danger: true,
          icon: Archive,
          cls: 'bg-gray-100 hover:bg-gray-200 text-[#374151] border-[#D1D5DB]'
        };
    }
  };

  const getPrimaryName = (item: any) =>
    item?.companyName || item?.name || item?.id || '-';

  const getSubLine = (item: any) => {
    if (mode === 'suppliers') {
      const bType = BUSINESS_TYPE_LABELS[item.businessType as SellerBusinessType];
      return `${item.contactPerson} • ${isAr ? bType?.ar || item.businessType : bType?.en || item.businessType}`;
    }
    if (mode === 'stores') {
      return `${item.ownerName} • ${item.city}${item.district ? ` - ${item.district}` : ''}`;
    }
    if (mode === 'drivers') {
      return `${item.supplierName} • ${item.vehiclePlate}`;
    }
    return `${item.storeName} • ${item.role === 'cashier' ? (isAr ? 'كاشير' : 'Cashier') : (isAr ? 'محاسب' : 'Accountant')}`;
  };

  const openActionPrompt = (item: any, action: AccountActionType) => {
    setActionError(null);
    setApproveRank('verified_business');
    setPendingAction({
      id: item.id,
      name: getPrimaryName(item),
      action
    });
  };

  const headerMeta = getHeaderMeta();
  const HeaderIcon = headerMeta.icon;
  const counts = listData?.statusCounts || {
    all: 0,
    pending: 0,
    active: 0,
    suspended: 0,
    rejected_archived: 0
  };

  const tabs: Array<{ key: StatusTabKey; label: string; count: number; show: boolean }> = [
    { key: 'all', label: t.adminAccTabAll, count: counts.all, show: true },
    { key: 'pending', label: t.adminAccTabPending, count: counts.pending, show: hasPendingWorkflow },
    { key: 'active', label: t.adminAccTabActive, count: counts.active, show: true },
    { key: 'suspended', label: t.adminAccTabSuspended, count: counts.suspended, show: true },
    {
      key: 'rejected_archived',
      label: t.adminAccTabRejectedArchived,
      count: counts.rejected_archived,
      show: true
    }
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      {feedbackBanner && (
        <div
          className={`rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-bold flex items-center justify-between gap-2 ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <span>{feedbackBanner.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="p-1 rounded-lg hover:bg-black/5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-[#E5E7EB] p-3.5 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-[#00A046] flex items-center justify-center shrink-0">
              <HeaderIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-black text-[#221F1F] truncate">
                {headerMeta.title}
              </h1>
              <p className="text-[11px] sm:text-xs text-[#797878] truncate">
                {headerMeta.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {(mode === 'suppliers' || mode === 'stores') && (
              <button
                type="button"
                onClick={() => {
                  setCreateError(null);
                  setCreateOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#00A046] hover:bg-[#008A3C] text-white text-xs font-extrabold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{mode === 'suppliers' ? t.adminAccAddSupplier : t.adminAccAddStore}</span>
              </button>
            )}
            <button
              type="button"
              onClick={fetchList}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-xs font-bold text-[#221F1F] cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t.adminRefresh}</span>
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {tabs
            .filter((tab) => tab.show)
            .map((tab) => {
              const active = statusTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setStatusTab(tab.key);
                    setPage(1);
                  }}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#00A046] text-white border-[#00A046] shadow-xs'
                      : 'bg-[#F9FAFB] text-[#374151] border-[#E5E7EB] hover:bg-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                      active
                        ? 'bg-white/20 text-white'
                        : tab.key === 'pending' && tab.count > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-white text-[#4A4747]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
        </div>

        {/* Search & Secondary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-[#F3F4F6]">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search
              className={`w-3.5 h-3.5 text-[#797878] absolute top-1/2 -translate-y-1/2 ${
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
              placeholder={t.adminAccSearchPlaceholder}
              className={`w-full rounded-xl border border-[#D1D5DB] bg-[#F9FAFB] focus:bg-white py-2 text-xs text-[#221F1F] focus:outline-none focus:ring-2 focus:ring-[#00A046]/25 focus:border-[#00A046] ${
                isAr ? 'pr-8 pl-3' : 'pl-8 pr-3'
              }`}
            />
          </div>

          {(mode === 'suppliers' || mode === 'stores') && (
            <select
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[#D1D5DB] bg-white px-2.5 py-2 text-xs font-semibold text-[#221F1F]"
            >
              <option value="all">{t.adminAccCityAll}</option>
              {(listData?.cities || []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {mode === 'suppliers' && (
            <select
              value={businessTypeFilter}
              onChange={(e) => {
                setBusinessTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[#D1D5DB] bg-white px-2.5 py-2 text-xs font-semibold text-[#221F1F]"
            >
              <option value="all">{isAr ? 'جميع أنواع النشاط' : 'All Business Types'}</option>
              {(Object.keys(BUSINESS_TYPE_LABELS) as SellerBusinessType[]).map((bt) => (
                <option key={bt} value={bt}>
                  {isAr ? BUSINESS_TYPE_LABELS[bt].ar : BUSINESS_TYPE_LABELS[bt].en}
                </option>
              ))}
            </select>
          )}

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-[#D1D5DB] bg-white px-2.5 py-2 text-xs font-semibold text-[#221F1F]"
          >
            <option value="newest">{t.adminAccSortNewest}</option>
            <option value="name_asc">{t.adminAccSortName}</option>
            <option value="metric_desc">{t.adminAccSortMetric}</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs font-bold text-red-700">
          {error}
        </div>
      )}

      {/* List Body: Mobile Cards + Desktop Table */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-[#E5E7EB] p-3 sm:p-4 shadow-xs">
        {loading && !listData ? (
          <div className="py-10 text-center text-xs font-bold text-[#797878]">{t.loading}</div>
        ) : !listData || listData.items.length === 0 ? (
          <div className="py-10 text-center text-xs font-bold text-[#797878]">
            {t.adminAccEmpty}
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="space-y-2.5 md:hidden">
              {listData.items.map((item) => {
                const allowed: AccountActionType[] = item.allowedActions || [];
                const primaryAction = allowed[0];
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-black text-[#221F1F] truncate">
                          {getPrimaryName(item)}
                        </div>
                        <div className="text-[11px] text-[#4A4747] truncate mt-0.5">
                          {getSubLine(item)}
                        </div>
                      </div>
                      {renderStatusBadge(item.lifecycleState)}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#797878]">
                      <span className="inline-flex items-center gap-1" dir="ltr">
                        <Phone className="w-3 h-3 text-[#00A046]" />
                        {item.phone}
                      </span>
                      {mode === 'suppliers' && (
                        <span>
                          {isAr ? 'مبيعات:' : 'GMV:'}{' '}
                          <strong className="text-[#221F1F]">
                            {formatCurrency(item.metrics?.gmvIQD || 0, currency, language)}
                          </strong>
                        </span>
                      )}
                      {mode === 'stores' && (
                        <span>
                          {isAr ? 'الطلبات:' : 'Orders:'}{' '}
                          <strong className="text-[#221F1F]">{item.metrics?.ordersCount || 0}</strong>
                        </span>
                      )}
                      {mode === 'drivers' && (
                        <span>
                          {isAr ? 'كاش العهدة:' : 'Cash:'}{' '}
                          <strong className="text-[#221F1F]">
                            {formatCurrency(item.currentCashCollectedIQD || 0, currency, language)}
                          </strong>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[#E5E7EB]">
                      <button
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-bold text-[#221F1F] hover:border-[#00A046] cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#00A046]" />
                        <span>{t.details}</span>
                      </button>

                      {primaryAction && (() => {
                        const meta = getActionMeta(primaryAction);
                        const ActIcon = meta.icon;
                        return (
                          <button
                            type="button"
                            onClick={() => openActionPrompt(item, primaryAction)}
                            className={`flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg border text-xs font-extrabold cursor-pointer ${meta.cls}`}
                          >
                            <ActIcon className="w-3.5 h-3.5" />
                            <span>{meta.label}</span>
                          </button>
                        );
                      })()}
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
                    <th className="py-2.5 text-start font-bold">
                      {mode === 'suppliers'
                        ? isAr ? 'المورد' : 'Supplier'
                        : mode === 'stores'
                        ? isAr ? 'المتجر' : 'Store'
                        : mode === 'drivers'
                        ? isAr ? 'السائق' : 'Driver'
                        : isAr ? 'الموظف' : 'Staff'}
                    </th>
                    <th className="py-2.5 text-start font-bold">{isAr ? 'الاتصال والموقع' : 'Contact & Location'}</th>
                    <th className="py-2.5 text-start font-bold">
                      {mode === 'suppliers'
                        ? isAr ? 'المبيعات / العروض' : 'GMV / Offers'
                        : mode === 'stores'
                        ? isAr ? 'الطلبات / الائتمان' : 'Orders / Credit'
                        : mode === 'drivers'
                        ? isAr ? 'الفان والتحصيل' : 'Van & Cash'
                        : isAr ? 'المتجر والدور' : 'Store & Role'}
                    </th>
                    <th className="py-2.5 text-start font-bold">{t.status}</th>
                    <th className="py-2.5 text-end font-bold">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {listData.items.map((item) => {
                    const allowed: AccountActionType[] = item.allowedActions || [];
                    return (
                      <tr key={item.id} className="hover:bg-[#F9FAFB]">
                        <td className="py-3 pe-3">
                          <div className="font-extrabold text-[#221F1F]">{getPrimaryName(item)}</div>
                          <div className="text-[11px] text-[#797878]">{getSubLine(item)}</div>
                        </td>
                        <td className="py-3 pe-3">
                          <div className="font-semibold text-[#221F1F]" dir="ltr">
                            {item.phone}
                          </div>
                          <div className="text-[11px] text-[#797878]">
                            {item.city || item.branchName || item.id}
                          </div>
                        </td>
                        <td className="py-3 pe-3">
                          {mode === 'suppliers' && (
                            <>
                              <div className="font-black text-[#00A046]">
                                {formatCurrency(item.metrics?.gmvIQD || 0, currency, language)}
                              </div>
                              <div className="text-[11px] text-[#797878]">
                                {item.metrics?.ordersCount || 0} {isAr ? 'طلب' : 'orders'} •{' '}
                                {item.metrics?.offersCount || 0} {isAr ? 'عرض' : 'offers'}
                              </div>
                            </>
                          )}
                          {mode === 'stores' && (
                            <>
                              <div className="font-black text-[#221F1F]">
                                {formatCurrency(item.metrics?.totalSpendIQD || 0, currency, language)}
                              </div>
                              <div className="text-[11px] text-[#797878]">
                                {item.metrics?.ordersCount || 0} {isAr ? 'طلب' : 'orders'} •{' '}
                                {isAr ? 'ائتمان:' : 'credit:'}{' '}
                                {formatCurrency(item.metrics?.usedCreditIQD || 0, currency, language)}
                              </div>
                            </>
                          )}
                          {mode === 'drivers' && (
                            <>
                              <div className="font-black text-[#221F1F]">
                                {formatCurrency(item.currentCashCollectedIQD || 0, currency, language)}
                              </div>
                              <div className="text-[11px] text-[#797878]">
                                {item.metrics?.deliveredCount || 0} {isAr ? 'تسليم' : 'delivered'} •{' '}
                                {item.metrics?.vanRemainingUnits || 0} {isAr ? 'وحدة بالفان' : 'van units'}
                              </div>
                            </>
                          )}
                          {mode === 'store_staff' && (
                            <>
                              <div className="font-bold text-[#221F1F]">{item.storeName}</div>
                              <div className="text-[11px] text-[#797878]">
                                {item.branchName} •{' '}
                                {item.role === 'cashier'
                                  ? isAr ? 'كاشير' : 'Cashier'
                                  : isAr ? 'محاسب' : 'Accountant'}
                              </div>
                            </>
                          )}
                        </td>
                        <td className="py-3 pe-3 whitespace-nowrap">
                          <div className="space-y-1">
                            {renderStatusBadge(item.lifecycleState)}
                            {mode === 'suppliers' && item.verificationStatus && (
                              <div className="text-[10px] font-bold text-[#797878]">
                                {isAr
                                  ? VERIFICATION_LABELS[item.verificationStatus as VerificationStatus]?.ar
                                  : VERIFICATION_LABELS[item.verificationStatus as VerificationStatus]?.en}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-end whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedId(item.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:border-[#00A046] text-[11px] font-bold text-[#221F1F] cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#00A046]" />
                              <span>{t.details}</span>
                            </button>
                            {allowed.slice(0, 2).map((act) => {
                              const meta = getActionMeta(act);
                              const ActIcon = meta.icon;
                              return (
                                <button
                                  key={act}
                                  type="button"
                                  onClick={() => openActionPrompt(item, act)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-extrabold cursor-pointer ${meta.cls}`}
                                >
                                  <ActIcon className="w-3.5 h-3.5" />
                                  <span>{meta.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {listData.totalPages > 1 && (
              <div className="mt-4 pt-3 border-t border-[#F3F4F6] flex items-center justify-between text-xs">
                <span className="text-[#797878] font-semibold">
                  {isAr
                    ? `صفحة ${listData.page} من ${listData.totalPages} (${listData.total})`
                    : `Page ${listData.page} of ${listData.totalPages} (${listData.total})`}
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

      {/* Account Detail Drawer / Modal */}
      {selectedId && (
        <div
          className="fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-xs font-brand"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          <div className="fixed inset-0" onClick={() => setSelectedId(null)} />
          <div className="relative z-10 w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col">
            {/* Drawer Header */}
            <div className="px-4 py-3.5 border-b border-[#E5E7EB] flex items-center justify-between gap-2 bg-[#F9FAFB]">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-black text-[#221F1F] truncate">
                    {detail ? getPrimaryName(detail.account) : t.loading}
                  </h2>
                  {detail && renderStatusBadge(detail.account.lifecycleState)}
                </div>
                {detail && (
                  <p className="text-[11px] text-[#797878] truncate mt-0.5">
                    {detail.account.id} • {detail.account.phone}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="p-2 rounded-xl border border-[#E5E7EB] bg-white text-[#4A4747] hover:text-[#221F1F] cursor-pointer"
                aria-label={t.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action Bar */}
            {detail && (detail.account.allowedActions || []).length > 0 && (
              <div className="px-4 py-2.5 border-b border-[#E5E7EB] bg-white flex flex-wrap items-center gap-2">
                {(detail.account.allowedActions as AccountActionType[]).map((act) => {
                  const meta = getActionMeta(act);
                  const ActIcon = meta.icon;
                  return (
                    <button
                      key={act}
                      type="button"
                      onClick={() => openActionPrompt(detail.account, act)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold cursor-pointer ${meta.cls}`}
                    >
                      <ActIcon className="w-3.5 h-3.5" />
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Detail Tabs */}
            <div className="px-4 pt-2 border-b border-[#E5E7EB] bg-white flex items-center gap-1 overflow-x-auto">
              {(
                [
                  { id: 'overview', label: t.adminAccDetailOverview, icon: Eye },
                  { id: 'kyc', label: t.adminAccDetailKyc, icon: FileCheck2 },
                  { id: 'activity', label: t.adminAccDetailActivity, icon: ShoppingBag },
                  { id: 'credit', label: t.adminAccDetailCredit, icon: CreditCard },
                  { id: 'notes', label: t.adminAccDetailNotes, icon: MessageSquarePlus },
                  { id: 'audit', label: t.adminAccDetailAudit, icon: FileText }
                ] as const
              ).map((tab) => {
                const TabIcon = tab.icon;
                const active = detailTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDetailTab(tab.id)}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                      active
                        ? 'border-[#00A046] text-[#00A046]'
                        : 'border-transparent text-[#797878] hover:text-[#221F1F]'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Detail Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {detailLoading || !detail ? (
                <div className="py-12 text-center text-xs font-bold text-[#797878]">
                  {t.loading}
                </div>
              ) : (
                <>
                  {detailTab === 'overview' && (
                    <div className="space-y-4">
                      {detail.account.statusReason && (
                        <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/70 text-xs space-y-1">
                          <div className="font-extrabold text-amber-900">
                            {isAr ? 'آخر سبب مسجّل لتغيير الحالة:' : 'Latest Status Reason:'}
                          </div>
                          <div className="text-[#221F1F]">{detail.account.statusReason}</div>
                        </div>
                      )}

                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {mode === 'suppliers' && (
                          <>
                            <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                              <div className="text-[11px] font-bold text-[#797878]">GMV</div>
                              <div className="text-sm font-black text-[#00A046] mt-0.5">
                                {formatCurrency(detail.account.metrics?.gmvIQD || 0, currency, language)}
                              </div>
                            </div>
                            <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                              <div className="text-[11px] font-bold text-[#797878]">{isAr ? 'الطلبات' : 'Orders'}</div>
                              <div className="text-sm font-black text-[#221F1F] mt-0.5">
                                {detail.account.metrics?.ordersCount || 0}
                              </div>
                            </div>
                            <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                              <div className="text-[11px] font-bold text-[#797878]">{isAr ? 'التقييم / العروض' : 'Rating / Offers'}</div>
                              <div className="text-sm font-black text-[#221F1F] mt-0.5">
                                {detail.account.rating || 0}★ / {detail.account.metrics?.offersCount || 0}
                              </div>
                            </div>
                          </>
                        )}
                        {mode === 'stores' && (
                          <>
                            <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                              <div className="text-[11px] font-bold text-[#797878]">{isAr ? 'المشتريات' : 'Total Spend'}</div>
                              <div className="text-sm font-black text-[#00A046] mt-0.5">
                                {formatCurrency(detail.account.metrics?.totalSpendIQD || 0, currency, language)}
                              </div>
                            </div>
                            <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                              <div className="text-[11px] font-bold text-[#797878]">{isAr ? 'رصيد المحفظة' : 'Wallet'}</div>
                              <div className="text-sm font-black text-[#221F1F] mt-0.5">
                                {formatCurrency(detail.account.walletBalanceIQD || 0, currency, language)}
                              </div>
                            </div>
                            <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                              <div className="text-[11px] font-bold text-[#797878]">{isAr ? 'الائتمان المستخدم' : 'Used Credit'}</div>
                              <div className="text-sm font-black text-[#221F1F] mt-0.5">
                                {formatCurrency(detail.account.metrics?.usedCreditIQD || 0, currency, language)}
                              </div>
                            </div>
                          </>
                        )}
                        {mode === 'drivers' && (
                          <>
                            <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                              <div className="text-[11px] font-bold text-[#797878]">{isAr ? 'النقد المحصّل' : 'Cash Collected'}</div>
                              <div className="text-sm font-black text-[#00A046] mt-0.5">
                                {formatCurrency(detail.account.currentCashCollectedIQD || 0, currency, language)}
                              </div>
                            </div>
                            <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                              <div className="text-[11px] font-bold text-[#797878]">{isAr ? 'الطلبات المسندة' : 'Assigned'}</div>
                              <div className="text-sm font-black text-[#221F1F] mt-0.5">
                                {detail.account.metrics?.assignedOrdersCount || 0} ({detail.account.metrics?.deliveredCount || 0}{' '}
                                {isAr ? 'مُسلَّم' : 'done'})
                              </div>
                            </div>
                            <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                              <div className="text-[11px] font-bold text-[#797878]">{isAr ? 'مخزون الفان' : 'Van Stock'}</div>
                              <div className="text-sm font-black text-[#221F1F] mt-0.5">
                                {detail.account.metrics?.vanRemainingUnits || 0} {isAr ? 'وحدة' : 'units'}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Basic Info + Inline Edit */}
                      <div className="rounded-xl border border-[#E5E7EB] p-3.5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-extrabold text-[#221F1F]">
                            {isAr ? 'البيانات الأساسية' : 'Basic Profile Information'}
                          </h3>
                          <button
                            type="button"
                            onClick={() => setEditMode((m) => !m)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#00A046] hover:underline cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{editMode ? t.cancel : isAr ? 'تعديل' : 'Edit'}</span>
                          </button>
                        </div>

                        {editMode ? (
                          <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {mode === 'suppliers' && (
                                <>
                                  <div>
                                    <label className="block font-bold text-[#797878] mb-1">{isAr ? 'اسم الشركة' : 'Company Name'}</label>
                                    <input
                                      type="text"
                                      value={editForm.companyName || ''}
                                      onChange={(e) => setEditForm((f) => ({ ...f, companyName: e.target.value }))}
                                      className="w-full rounded-lg border border-[#D1D5DB] px-2.5 py-1.5"
                                    />
                                  </div>
                                  <div>
                                    <label className="block font-bold text-[#797878] mb-1">{isAr ? 'الشخص المسؤول' : 'Contact Person'}</label>
                                    <input
                                      type="text"
                                      value={editForm.contactPerson || ''}
                                      onChange={(e) => setEditForm((f) => ({ ...f, contactPerson: e.target.value }))}
                                      className="w-full rounded-lg border border-[#D1D5DB] px-2.5 py-1.5"
                                    />
                                  </div>
                                  <div>
                                    <label className="block font-bold text-[#797878] mb-1">{isAr ? 'الحد الأدنى للطلب (د.ع)' : 'Min Order (IQD)'}</label>
                                    <input
                                      type="number"
                                      value={editForm.minOrderValueIQD ?? 0}
                                      onChange={(e) => setEditForm((f) => ({ ...f, minOrderValueIQD: Number(e.target.value) }))}
                                      className="w-full rounded-lg border border-[#D1D5DB] px-2.5 py-1.5"
                                    />
                                  </div>
                                </>
                              )}
                              {mode === 'stores' && (
                                <>
                                  <div>
                                    <label className="block font-bold text-[#797878] mb-1">{isAr ? 'اسم المتجر' : 'Store Name'}</label>
                                    <input
                                      type="text"
                                      value={editForm.name || ''}
                                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                                      className="w-full rounded-lg border border-[#D1D5DB] px-2.5 py-1.5"
                                    />
                                  </div>
                                  <div>
                                    <label className="block font-bold text-[#797878] mb-1">{isAr ? 'اسم المالك' : 'Owner Name'}</label>
                                    <input
                                      type="text"
                                      value={editForm.ownerName || ''}
                                      onChange={(e) => setEditForm((f) => ({ ...f, ownerName: e.target.value }))}
                                      className="w-full rounded-lg border border-[#D1D5DB] px-2.5 py-1.5"
                                    />
                                  </div>
                                  <div>
                                    <label className="block font-bold text-[#797878] mb-1">{isAr ? 'المنطقة / الحي' : 'District'}</label>
                                    <input
                                      type="text"
                                      value={editForm.district || ''}
                                      onChange={(e) => setEditForm((f) => ({ ...f, district: e.target.value }))}
                                      className="w-full rounded-lg border border-[#D1D5DB] px-2.5 py-1.5"
                                    />
                                  </div>
                                </>
                              )}
                              {mode === 'drivers' && (
                                <>
                                  <div>
                                    <label className="block font-bold text-[#797878] mb-1">{isAr ? 'الاسم' : 'Name'}</label>
                                    <input
                                      type="text"
                                      value={editForm.name || ''}
                                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                                      className="w-full rounded-lg border border-[#D1D5DB] px-2.5 py-1.5"
                                    />
                                  </div>
                                  <div>
                                    <label className="block font-bold text-[#797878] mb-1">{isAr ? 'رقم اللوحة' : 'Vehicle Plate'}</label>
                                    <input
                                      type="text"
                                      value={editForm.vehiclePlate || ''}
                                      onChange={(e) => setEditForm((f) => ({ ...f, vehiclePlate: e.target.value }))}
                                      className="w-full rounded-lg border border-[#D1D5DB] px-2.5 py-1.5"
                                    />
                                  </div>
                                  <div>
                                    <label className="block font-bold text-[#797878] mb-1">{isAr ? 'اسم الفان / القاطع' : 'Van Name'}</label>
                                    <input
                                      type="text"
                                      value={editForm.vanWarehouseName || ''}
                                      onChange={(e) => setEditForm((f) => ({ ...f, vanWarehouseName: e.target.value }))}
                                      className="w-full rounded-lg border border-[#D1D5DB] px-2.5 py-1.5"
                                    />
                                  </div>
                                </>
                              )}
                              {mode === 'store_staff' && (
                                <>
                                  <div>
                                    <label className="block font-bold text-[#797878] mb-1">{isAr ? 'الاسم' : 'Name'}</label>
                                    <input
                                      type="text"
                                      value={editForm.name || ''}
                                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                                      className="w-full rounded-lg border border-[#D1D5DB] px-2.5 py-1.5"
                                    />
                                  </div>
                                  <div>
                                    <label className="block font-bold text-[#797878] mb-1">{isAr ? 'الفرع' : 'Branch'}</label>
                                    <input
                                      type="text"
                                      value={editForm.branchName || ''}
                                      onChange={(e) => setEditForm((f) => ({ ...f, branchName: e.target.value }))}
                                      className="w-full rounded-lg border border-[#D1D5DB] px-2.5 py-1.5"
                                    />
                                  </div>
                                </>
                              )}
                              <div>
                                <label className="block font-bold text-[#797878] mb-1">{isAr ? 'رقم الهاتف' : 'Phone'}</label>
                                <input
                                  type="text"
                                  value={editForm.phone || ''}
                                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                                  className="w-full rounded-lg border border-[#D1D5DB] px-2.5 py-1.5"
                                />
                              </div>
                              {(mode === 'suppliers' || mode === 'stores') && (
                                <>
                                  <div>
                                    <label className="block font-bold text-[#797878] mb-1">{isAr ? 'المدينة' : 'City'}</label>
                                    <input
                                      type="text"
                                      value={editForm.city || ''}
                                      onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
                                      className="w-full rounded-lg border border-[#D1D5DB] px-2.5 py-1.5"
                                    />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="block font-bold text-[#797878] mb-1">{isAr ? 'العنوان' : 'Address'}</label>
                                    <input
                                      type="text"
                                      value={editForm.address || ''}
                                      onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                                      className="w-full rounded-lg border border-[#D1D5DB] px-2.5 py-1.5"
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                type="submit"
                                disabled={editSaving}
                                className="px-4 py-1.5 rounded-lg bg-[#00A046] hover:bg-[#008A3C] text-white font-bold cursor-pointer disabled:opacity-60"
                              >
                                {editSaving ? t.loading : t.save}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                            <div>
                              <span className="text-[#797878]">{isAr ? 'الهاتف:' : 'Phone:'} </span>
                              <span className="font-bold text-[#221F1F]" dir="ltr">
                                {detail.account.phone}
                              </span>
                            </div>
                            {detail.account.city && (
                              <div>
                                <span className="text-[#797878]">{isAr ? 'المدينة:' : 'City:'} </span>
                                <span className="font-bold text-[#221F1F]">{detail.account.city}</span>
                              </div>
                            )}
                            {detail.account.address && (
                              <div className="sm:col-span-2 flex items-start gap-1">
                                <MapPin className="w-3.5 h-3.5 text-[#00A046] shrink-0 mt-0.5" />
                                <span className="font-semibold text-[#221F1F]">
                                  {detail.account.district ? `${detail.account.district} — ` : ''}
                                  {detail.account.address}
                                </span>
                              </div>
                            )}
                            {mode === 'suppliers' && (
                              <div>
                                <span className="text-[#797878]">{isAr ? 'الحد الأدنى للطلب:' : 'Min Order Value:'} </span>
                                <span className="font-bold text-[#00A046]">
                                  {formatCurrency(
                                    detail.account.orderRules?.minOrderValueIQD || 0,
                                    currency,
                                    language
                                  )}
                                </span>
                              </div>
                            )}
                            {mode === 'drivers' && (
                              <div className="sm:col-span-2">
                                <span className="text-[#797878]">{isAr ? 'المركبة والفان:' : 'Vehicle:'} </span>
                                <span className="font-bold text-[#221F1F]">
                                  {detail.account.vehicleModel} ({detail.account.vehiclePlate}) —{' '}
                                  {detail.account.vanWarehouseName}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {detailTab === 'kyc' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div>
                          <label className="block font-bold text-[#797878] mb-1">
                            {isAr ? 'رقم السجل / الإجازة' : 'License Number'}
                          </label>
                          <input
                            type="text"
                            value={kycForm.licenseNo || ''}
                            onChange={(e) => setKycForm((k) => ({ ...k, licenseNo: e.target.value }))}
                            className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-[#797878] mb-1">
                            {isAr ? 'الرقم الضريبي' : 'Tax ID'}
                          </label>
                          <input
                            type="text"
                            value={kycForm.taxId || ''}
                            onChange={(e) => setKycForm((k) => ({ ...k, taxId: e.target.value }))}
                            className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
                          />
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {kycForm.checklist.map((item: KycChecklistItem, idx: number) => {
                          const labelObj = KYC_ITEM_LABELS[item.key];
                          return (
                            <div
                              key={item.key}
                              className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] space-y-2"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-extrabold text-[#221F1F]">
                                  {isAr ? labelObj.ar : labelObj.en}
                                </span>
                                <select
                                  value={item.status}
                                  onChange={(e) => {
                                    const nextStatus = e.target.value as KycChecklistItemStatus;
                                    setKycForm((prev) => ({
                                      ...prev,
                                      checklist: prev.checklist.map((c, i) =>
                                        i === idx ? { ...c, status: nextStatus } : c
                                      )
                                    }));
                                  }}
                                  className="rounded-lg border border-[#D1D5DB] bg-white px-2.5 py-1 text-xs font-bold"
                                >
                                  <option value="pending">{isAr ? 'قيد المراجعة' : 'Pending'}</option>
                                  <option value="approved">{isAr ? 'معتمد' : 'Approved'}</option>
                                  <option value="rejected">{isAr ? 'مرفوض' : 'Rejected'}</option>
                                </select>
                              </div>
                              <input
                                type="text"
                                value={item.note || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setKycForm((prev) => ({
                                    ...prev,
                                    checklist: prev.checklist.map((c, i) =>
                                      i === idx ? { ...c, note: val } : c
                                    )
                                  }));
                                }}
                                placeholder={isAr ? 'ملاحظة على الوثيقة (اختياري)...' : 'Document note (optional)...'}
                                className="w-full rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-xs"
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleSaveKyc}
                          disabled={kycSaving}
                          className="px-4 py-2 rounded-xl bg-[#00A046] hover:bg-[#008A3C] text-white text-xs font-extrabold cursor-pointer disabled:opacity-60"
                        >
                          {kycSaving ? t.loading : isAr ? 'حفظ التوثيق والوثائق' : 'Save KYC Checklist'}
                        </button>
                      </div>
                    </div>
                  )}

                  {detailTab === 'activity' && (
                    <div className="space-y-2.5">
                      {detail.recentOrders.length === 0 ? (
                        <div className="py-8 text-center text-xs font-bold text-[#797878]">
                          {isAr ? 'لا توجد طلبات مسجلة لهذا الحساب' : 'No recent orders for this account'}
                        </div>
                      ) : (
                        detail.recentOrders.map((o) => (
                          <div
                            key={o.id}
                            className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="font-extrabold text-[#221F1F] truncate">
                                {o.id} — {getLocalizedText(o.storeName, language)}
                              </div>
                              <div className="text-[11px] text-[#797878] truncate">
                                {o.supplierName} • {o.status}
                              </div>
                            </div>
                            <div className="font-black text-[#00A046] shrink-0">
                              {formatCurrency(o.subtotalIQD || 0, currency, language)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {detailTab === 'credit' && (
                    <div className="space-y-2.5">
                      {detail.creditAccounts.length === 0 ? (
                        <div className="py-8 text-center text-xs font-bold text-[#797878]">
                          {isAr ? 'لا توجد حسابات ائتمان مرتبطة' : 'No linked credit accounts'}
                        </div>
                      ) : (
                        detail.creditAccounts.map((acc) => (
                          <div
                            key={acc.id}
                            className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-extrabold text-[#221F1F]">
                                {acc.storeName} ↔ {acc.supplierName}
                              </span>
                              {acc.isBlocked ? (
                                <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-extrabold">
                                  {isAr ? 'موقوف' : 'Blocked'}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-emerald-100 text-[#00A046] text-[10px] font-extrabold">
                                  {isAr ? 'نشط' : 'Active'}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#4A4747]">
                              <span>
                                {isAr ? 'السقف:' : 'Limit:'}{' '}
                                <strong>{formatCurrency(acc.creditLimitIQD, currency, language)}</strong>
                              </span>
                              <span>
                                {isAr ? 'المستخدم:' : 'Used:'}{' '}
                                <strong>{formatCurrency(acc.currentUsedCreditIQD, currency, language)}</strong>
                              </span>
                              <span>
                                {isAr ? 'المتاح:' : 'Available:'}{' '}
                                <strong className="text-[#00A046]">
                                  {formatCurrency(acc.availableCreditIQD, currency, language)}
                                </strong>
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {detailTab === 'notes' && (
                    <div className="space-y-4">
                      <form onSubmit={handleAddNote} className="space-y-2">
                        <textarea
                          rows={2}
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder={
                            isAr
                              ? 'أضف ملاحظة إدارية داخلية حول هذا الحساب...'
                              : 'Add an internal administrative note...'
                          }
                          className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2 text-xs resize-none"
                        />
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={noteSaving || noteText.trim().length < 3}
                            className="px-4 py-1.5 rounded-xl bg-[#00A046] hover:bg-[#008A3C] text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
                          >
                            {noteSaving ? t.loading : isAr ? 'حفظ الملاحظة' : 'Add Note'}
                          </button>
                        </div>
                      </form>

                      <div className="space-y-2">
                        {(detail.account.adminNotes || []).length === 0 ? (
                          <div className="py-6 text-center text-xs font-bold text-[#797878]">
                            {isAr ? 'لا توجد ملاحظات إدارية مسجلة' : 'No internal notes recorded yet'}
                          </div>
                        ) : (
                          (detail.account.adminNotes as AdminInternalNote[]).map((n) => (
                            <div
                              key={n.id}
                              className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] space-y-1 text-xs"
                            >
                              <div className="flex items-center justify-between text-[11px] text-[#797878]">
                                <span className="font-bold text-[#221F1F]">{n.author}</span>
                                <span>{new Date(n.at).toLocaleString(isAr ? 'ar-IQ' : 'en-US')}</span>
                              </div>
                              <p className="text-[#374151]">{n.text}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {detailTab === 'audit' && (
                    <div className="space-y-2.5">
                      {detail.auditLogs.length === 0 ? (
                        <div className="py-8 text-center text-xs font-bold text-[#797878]">
                          {t.adminAuditEmpty}
                        </div>
                      ) : (
                        detail.auditLogs.map((log) => (
                          <div
                            key={log.id}
                            className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-extrabold text-[#00A046]">
                                {log.action}
                              </span>
                              <span className="text-[10px] text-[#797878]">
                                {new Date(log.at).toLocaleString(isAr ? 'ar-IQ' : 'en-US')}
                              </span>
                            </div>
                            <div className="font-bold text-[#221F1F]">
                              {isAr ? log.summaryAr : log.summaryEn || log.summaryAr}
                            </div>
                            {log.reason && (
                              <div className="text-[11px] text-[#4A4747]">
                                <strong>{t.adminAuditReasonLabel}</strong> {log.reason}
                              </div>
                            )}
                            {(log.before || log.after) && (
                              <pre
                                dir="ltr"
                                className="p-2 rounded-lg bg-[#111827] text-emerald-300 text-[10px] overflow-x-auto"
                              >
                                {JSON.stringify({ before: log.before || null, after: log.after || null }, null, 2)}
                              </pre>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Supplier / Store Modal */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-brand"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
              <h3 className="text-sm sm:text-base font-black text-[#221F1F]">
                {mode === 'suppliers' ? t.adminAccAddSupplier : t.adminAccAddStore}
              </h3>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="p-1.5 rounded-lg text-[#797878] hover:text-[#221F1F] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#221F1F] mb-1">
                    {mode === 'suppliers' ? (isAr ? 'اسم الشركة' : 'Company Name') : (isAr ? 'اسم المتجر' : 'Store Name')} *
                  </label>
                  <input
                    required
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#221F1F] mb-1">
                    {mode === 'suppliers' ? (isAr ? 'الشخص المسؤول' : 'Contact Person') : (isAr ? 'اسم المالك' : 'Owner Name')} *
                  </label>
                  <input
                    required
                    type="text"
                    value={createForm.person}
                    onChange={(e) => setCreateForm((f) => ({ ...f, person: e.target.value }))}
                    className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#221F1F] mb-1">{isAr ? 'رقم الهاتف' : 'Phone'} *</label>
                  <input
                    required
                    type="text"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+964 770 ..."
                    className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#221F1F] mb-1">{isAr ? 'المدينة' : 'City'} *</label>
                  <input
                    required
                    type="text"
                    value={createForm.city}
                    onChange={(e) => setCreateForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
                  />
                </div>

                {mode === 'suppliers' ? (
                  <>
                    <div>
                      <label className="block font-bold text-[#221F1F] mb-1">{isAr ? 'نوع النشاط' : 'Business Type'}</label>
                      <select
                        value={createForm.businessType}
                        onChange={(e) =>
                          setCreateForm((f) => ({ ...f, businessType: e.target.value as SellerBusinessType }))
                        }
                        className="w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2"
                      >
                        {(Object.keys(BUSINESS_TYPE_LABELS) as SellerBusinessType[]).map((bt) => (
                          <option key={bt} value={bt}>
                            {isAr ? BUSINESS_TYPE_LABELS[bt].ar : BUSINESS_TYPE_LABELS[bt].en}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-[#221F1F] mb-1">{isAr ? 'الحد الأدنى للطلب (د.ع)' : 'Min Order (IQD)'}</label>
                      <input
                        type="number"
                        value={createForm.minOrderValueIQD}
                        onChange={(e) => setCreateForm((f) => ({ ...f, minOrderValueIQD: Number(e.target.value) }))}
                        className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block font-bold text-[#221F1F] mb-1">{isAr ? 'نوع المتجر' : 'Store Type'}</label>
                      <select
                        value={createForm.storeType}
                        onChange={(e) => setCreateForm((f) => ({ ...f, storeType: e.target.value as any }))}
                        className="w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2"
                      >
                        <option value="supermarket">{isAr ? 'سوبرماركت' : 'Supermarket'}</option>
                        <option value="grocery">{isAr ? 'بقالة / ميني ماركت' : 'Grocery'}</option>
                        <option value="wholesale_sub">{isAr ? 'نصف جملة' : 'Semi-Wholesale'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-[#221F1F] mb-1">{isAr ? 'المنطقة / الحي' : 'District'}</label>
                      <input
                        type="text"
                        value={createForm.district}
                        onChange={(e) => setCreateForm((f) => ({ ...f, district: e.target.value }))}
                        className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block font-bold text-[#221F1F] mb-1">{isAr ? 'حالة التوثيق الأولية' : 'Initial Status'}</label>
                  <select
                    value={createForm.verificationStatus}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, verificationStatus: e.target.value as VerificationStatus }))
                    }
                    className="w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2"
                  >
                    <option value="pending">{isAr ? 'قيد المراجعة (Pending)' : 'Pending Review'}</option>
                    <option value="verified">{isAr ? 'موثق ومفعّل فوراً' : 'Verified Immediately'}</option>
                    {mode === 'suppliers' && (
                      <>
                        <option value="verified_business">{isAr ? 'نشاط تجاري موثق' : 'Verified Business'}</option>
                        <option value="authorized_distributor">{isAr ? 'موزع رسمي معتمد' : 'Authorized Distributor'}</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#221F1F] mb-1">{isAr ? 'العنوان الكامل' : 'Address'}</label>
                  <input
                    type="text"
                    value={createForm.address}
                    onChange={(e) => setCreateForm((f) => ({ ...f, address: e.target.value }))}
                    className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
                  />
                </div>
              </div>

              {createError && <p className="text-xs font-bold text-red-600">{createError}</p>}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#F3F4F6]">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E7EB] font-bold text-[#4A4747] cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={createSaving}
                  className="px-4 py-2 rounded-xl bg-[#00A046] hover:bg-[#008A3C] text-white font-extrabold cursor-pointer disabled:opacity-60"
                >
                  {createSaving ? t.loading : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mandatory Reason Confirmation Dialog for ALL status-changing actions */}
      <ConfirmWithReasonDialog
        isOpen={Boolean(pendingAction)}
        language={language}
        loading={actionLoading}
        serverError={actionError}
        danger={pendingAction ? getActionMeta(pendingAction.action).danger : true}
        title={
          pendingAction
            ? `${getActionMeta(pendingAction.action).label}: ${pendingAction.name}`
            : ''
        }
        description={
          pendingAction
            ? isAr
              ? `سيتم تنفيذ إجراء (${getActionMeta(pendingAction.action).label}) على الحساب "${pendingAction.name}" وتوثيقه في سجل التدقيق.`
              : `This will apply "${getActionMeta(pendingAction.action).label}" to "${pendingAction.name}" and record it in the Audit Log.`
            : undefined
        }
        confirmLabel={pendingAction ? getActionMeta(pendingAction.action).label : undefined}
        extraContent={
          pendingAction && mode === 'suppliers' && pendingAction.action === 'approve' ? (
            <div>
              <label className="block text-xs font-bold text-[#221F1F] mb-1.5">
                {isAr ? 'رتبة التوثيق الممنوحة' : 'Granted Verification Tier'}
              </label>
              <select
                value={approveRank}
                onChange={(e) => setApproveRank(e.target.value as VerificationStatus)}
                className="w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-xs font-bold text-[#221F1F]"
              >
                <option value="verified">{VERIFICATION_LABELS.verified[isAr ? 'ar' : 'en']}</option>
                <option value="verified_business">
                  {VERIFICATION_LABELS.verified_business[isAr ? 'ar' : 'en']}
                </option>
                <option value="authorized_distributor">
                  {VERIFICATION_LABELS.authorized_distributor[isAr ? 'ar' : 'en']}
                </option>
              </select>
            </div>
          ) : undefined
        }
        onConfirm={handleConfirmAction}
        onCancel={() => {
          setPendingAction(null);
          setActionError(null);
        }}
      />
    </div>
  );
};
