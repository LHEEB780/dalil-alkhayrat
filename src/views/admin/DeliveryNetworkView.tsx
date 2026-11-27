import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  Building2,
  Calculator,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  FileCheck2,
  FileWarning,
  Layers,
  MapPin,
  MessageSquarePlus,
  PauseCircle,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Snowflake,
  Store,
  Truck,
  UserCheck,
  Users,
  Wrench,
  X,
  XCircle
} from 'lucide-react';
import {
  AccountKycInfo,
  AdminInternalNote,
  Currency,
  DeliveryAccountStatus,
  DeliveryDriver,
  DeliveryPartner,
  DeliveryPartnerType,
  DeliveryPlatformSettings,
  DeliveryProviderType,
  DeliveryRateRule,
  DeliveryVehicle,
  DeliveryVehicleClass,
  DeliveryVehicleStatus,
  KycChecklistItem,
  KycChecklistItemStatus,
  KycChecklistKey,
  Language,
  SupplierDeliverySettings,
  VehicleTemperatureType
} from '../../types/index.ts';
import {
  VEHICLE_CLASS_LABELS,
  VEHICLE_CLASS_ORDER
} from '../../../shared/deliveryRules.ts';
import { formatCurrency } from '../../utils/format.ts';
import { getLocalizedText, translations } from '../../utils/translations.ts';
import { ConfirmWithReasonDialog } from '../../components/admin/ConfirmWithReasonDialog.tsx';

type DeliveryTabKey =
  | 'overview'
  | 'partners'
  | 'vehicles'
  | 'drivers'
  | 'rates'
  | 'suppliers'
  | 'simulator';

type PartnerActionType = 'approve' | 'reject' | 'suspend' | 'reactivate' | 'archive';
type VehicleActionType = 'approve' | 'reject' | 'activate' | 'suspend' | 'maintenance';
type DriverActionType = 'approve' | 'reject' | 'suspend' | 'reactivate' | 'archive';

interface DeliveryNetworkViewProps {
  language: Language;
  currency: Currency;
  initialDeepLink?: {
    selectedId?: string | null;
    filterPreset?: string | null;
  };
  onDataChanged?: () => void;
}

interface GeoZoneSimple {
  id: string;
  governorateId: string;
  nameAr: string;
  nameEn: string;
}

interface GeoGovHierarchy {
  id: string;
  nameAr: string;
  nameEn: string;
  deliveryZones: GeoZoneSimple[];
}

const ADMIN_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
  'x-user-role': 'admin'
};

const PARTNER_KYC_KEYS: KycChecklistKey[] = [
  'driver_license',
  'vehicle_registration',
  'insurance',
  'vehicle_inspection'
];

const KYC_LABELS: Record<string, { ar: string; en: string }> = {
  driver_license: { ar: 'إجازة سوق نافذة', en: 'Valid Driver License' },
  vehicle_registration: { ar: 'سنوية / تسجيل المركبة', en: 'Vehicle Registration' },
  insurance: { ar: 'تأمين المركبة', en: 'Vehicle Insurance' },
  vehicle_inspection: { ar: 'فحص سلامة وصلاحية المركبة', en: 'Vehicle Safety Inspection' },
  commercial_license: { ar: 'السجل التجاري', en: 'Commercial License' },
  owner_id: { ar: 'هوية المالك', en: 'Owner ID' },
  phone_verified: { ar: 'تأكيد الهاتف', en: 'Phone Verified' }
};

export const DeliveryNetworkView: React.FC<DeliveryNetworkViewProps> = ({
  language,
  currency,
  initialDeepLink,
  onDataChanged
}) => {
  const isAr = language === 'ar';
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<DeliveryTabKey>('overview');
  const [governorates, setGovernorates] = useState<GeoGovHierarchy[]>([]);

  // Overview
  const [overview, setOverview] = useState<any | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Partners state
  const [partnerStatusTab, setPartnerStatusTab] = useState<string>('all');
  const [partnerTypeFilter, setPartnerTypeFilter] = useState<string>('all');
  const [partnerGovFilter, setPartnerGovFilter] = useState<string>('all');
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnersData, setPartnersData] = useState<any | null>(null);
  const [partnersLoading, setPartnersLoading] = useState(false);

  // Partner detail drawer
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [partnerDetailTab, setPartnerDetailTab] = useState<'overview' | 'kyc' | 'notes' | 'audit'>('overview');
  const [partnerDetail, setPartnerDetail] = useState<any | null>(null);
  const [partnerDetailLoading, setPartnerDetailLoading] = useState(false);
  const [kycForm, setKycForm] = useState<AccountKycInfo>({ checklist: [] });
  const [kycSaving, setKycSaving] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  // Vehicles state
  const [vehicleOwnerFilter, setVehicleOwnerFilter] = useState<string>('all');
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState<string>('all');
  const [vehicleClassFilter, setVehicleClassFilter] = useState<string>('all');
  const [vehicleExpiringOnly, setVehicleExpiringOnly] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehiclesData, setVehiclesData] = useState<any | null>(null);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  // Create Vehicle Modal
  const [createVehicleOpen, setCreateVehicleOpen] = useState(false);
  const [newVehicleForm, setNewVehicleForm] = useState({
    ownerType: 'platform' as DeliveryProviderType,
    partnerId: '',
    plateNumber: '',
    vehicleClass: 'small_truck' as DeliveryVehicleClass,
    makeModel: '',
    year: '2024',
    capacityUnits: '90',
    temperatureSupport: ['ambient'] as VehicleTemperatureType[],
    registrationExpiry: '',
    insuranceExpiry: '',
    inspectionExpiry: '',
    reason: 'إضافة مركبة جديدة إلى أسطول التوصيل'
  });

  // Edit Vehicle Docs Modal
  const [editVehicleDocsTarget, setEditVehicleDocsTarget] = useState<any | null>(null);
  const [editDocsForm, setEditDocsForm] = useState({
    registrationExpiry: '',
    insuranceExpiry: '',
    inspectionExpiry: '',
    reason: ''
  });

  // Drivers state
  const [driverProviderFilter, setDriverProviderFilter] = useState<string>('all');
  const [driverStatusFilter, setDriverStatusFilter] = useState<string>('all');
  const [driverGovFilter, setDriverGovFilter] = useState<string>('all');
  const [driverSearch, setDriverSearch] = useState('');
  const [driversData, setDriversData] = useState<any | null>(null);
  const [driversLoading, setDriversLoading] = useState(false);

  // Create Driver Modal
  const [createDriverOpen, setCreateDriverOpen] = useState(false);
  const [newDriverForm, setNewDriverForm] = useState({
    providerType: 'platform' as DeliveryProviderType,
    partnerId: '',
    name: '',
    phone: '',
    licenseNo: '',
    licenseExpiry: '',
    assignedVehicleId: '',
    governorateId: 'gov_najaf',
    serviceZoneIds: ['zone_najaf_center'] as string[],
    reason: 'إضافة سائق جديد إلى شبكة التوصيل'
  });

  // Assign Vehicle Modal
  const [assignVehicleDriver, setAssignVehicleDriver] = useState<any | null>(null);
  const [assignVehicleId, setAssignVehicleId] = useState<string>('');
  const [assignVehicleReason, setAssignVehicleReason] = useState<string>('');

  // Rates & Settings state
  const [rateRules, setRateRules] = useState<any[]>([]);
  const [platformSettings, setPlatformSettings] = useState<DeliveryPlatformSettings | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<{
    freeDeliveryThresholdIQD: number;
    partnerCommissionPercent: number;
    codAllowedForPartners: boolean;
  }>({
    freeDeliveryThresholdIQD: 250000,
    partnerCommissionPercent: 0,
    codAllowedForPartners: false
  });
  const [rateModalTarget, setRateModalTarget] = useState<'new' | any | null>(null);
  const [rateForm, setRateForm] = useState({
    nameAr: '',
    nameEn: '',
    governorateId: '',
    deliveryZoneId: '',
    vehicleClass: 'pickup' as DeliveryVehicleClass,
    baseFeeIQD: '7000',
    perUnitFeeIQD: '350',
    minFeeIQD: '8000',
    refrigeratedSurchargeIQD: '0',
    isActive: true
  });

  // Supplier Delivery Settings state
  const [supplierDeliveryList, setSupplierDeliveryList] = useState<any[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
  const [supplierForm, setSupplierForm] = useState<SupplierDeliverySettings & { freeThresholdInput: string }>({
    hasOwnFleet: true,
    allowPlatformDelivery: false,
    allowStorePickup: true,
    freeThresholdInput: '',
    notes: ''
  });
  const [supplierFormValidationError, setSupplierFormValidationError] = useState<string | null>(null);

  // Fee Simulator state
  const [simForm, setSimForm] = useState({
    supplierId: 'supp_dijla',
    governorateId: 'gov_najaf',
    deliveryZoneId: 'zone_najaf_center',
    units: '10',
    requiredTemperature: 'ambient' as VehicleTemperatureType,
    orderValueIQD: '120000'
  });
  const [simResult, setSimResult] = useState<any | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  // Shared ConfirmWithReasonDialog state
  const [confirmState, setConfirmState] = useState<{
    title: string;
    description: string;
    danger?: boolean;
    confirmLabel?: string;
    onConfirm: (reason: string) => Promise<void>;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Load Geo Hierarchy
  useEffect(() => {
    fetch('/api/geo/governorates')
      .then((r) => r.json())
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) {
          setGovernorates(json.data);
        }
      })
      .catch(() => {});
  }, []);

  // Apply DeepLink
  useEffect(() => {
    if (!initialDeepLink) return;
    if (initialDeepLink.filterPreset === 'partners_pending') {
      setActiveTab('partners');
      setPartnerStatusTab('pending');
      if (initialDeepLink.selectedId) setSelectedPartnerId(initialDeepLink.selectedId);
    } else if (initialDeepLink.filterPreset === 'vehicles_expiring') {
      setActiveTab('vehicles');
      setVehicleExpiringOnly(true);
    } else if (initialDeepLink.filterPreset === 'supplier_delivery') {
      setActiveTab('suppliers');
    } else if (initialDeepLink.selectedId) {
      if (initialDeepLink.selectedId.startsWith('dp_')) {
        setActiveTab('partners');
        setSelectedPartnerId(initialDeepLink.selectedId);
      } else if (initialDeepLink.selectedId.startsWith('dveh_')) {
        setActiveTab('vehicles');
        setVehicleExpiringOnly(true);
      }
    }
  }, [initialDeepLink]);

  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    setGlobalError(null);
    try {
      const res = await fetch('/api/admin/delivery/overview', { headers: ADMIN_HEADERS });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || t.adminLoadError);
      setOverview(json.data);
    } catch (e: any) {
      setGlobalError(e?.message || t.adminLoadError);
    } finally {
      setOverviewLoading(false);
    }
  }, [t.adminLoadError]);

  const fetchPartners = useCallback(async () => {
    setPartnersLoading(true);
    try {
      const params = new URLSearchParams();
      if (partnerStatusTab !== 'all') params.set('statusTab', partnerStatusTab);
      if (partnerTypeFilter !== 'all') params.set('type', partnerTypeFilter);
      if (partnerGovFilter !== 'all') params.set('governorateId', partnerGovFilter);
      if (partnerSearch.trim()) params.set('search', partnerSearch.trim());
      const res = await fetch(`/api/admin/delivery/partners?${params.toString()}`, {
        headers: ADMIN_HEADERS
      });
      const json = await res.json();
      if (res.ok && json?.success) setPartnersData(json.data);
    } finally {
      setPartnersLoading(false);
    }
  }, [partnerStatusTab, partnerTypeFilter, partnerGovFilter, partnerSearch]);

  const fetchPartnerDetail = useCallback(async (id: string) => {
    setPartnerDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/delivery/partners/${encodeURIComponent(id)}`, {
        headers: ADMIN_HEADERS
      });
      const json = await res.json();
      if (res.ok && json?.success) {
        setPartnerDetail(json.data);
        const rawChecklist = json.data.partner?.kyc?.checklist || [];
        const normalizedChecklist: KycChecklistItem[] = PARTNER_KYC_KEYS.map((k) => {
          const found = rawChecklist.find((item: any) => item.key === k);
          return found || { key: k, status: 'pending' };
        });
        setKycForm({
          licenseNo: json.data.partner?.kyc?.licenseNo || '',
          checklist: normalizedChecklist
        });
      }
    } finally {
      setPartnerDetailLoading(false);
    }
  }, []);

  const fetchVehicles = useCallback(async () => {
    setVehiclesLoading(true);
    try {
      const params = new URLSearchParams();
      if (vehicleOwnerFilter !== 'all') params.set('ownerType', vehicleOwnerFilter);
      if (vehicleStatusFilter !== 'all') params.set('status', vehicleStatusFilter);
      if (vehicleClassFilter !== 'all') params.set('vehicleClass', vehicleClassFilter);
      if (vehicleExpiringOnly) params.set('expiringOnly', 'true');
      if (vehicleSearch.trim()) params.set('search', vehicleSearch.trim());
      const res = await fetch(`/api/admin/delivery/vehicles?${params.toString()}`, {
        headers: ADMIN_HEADERS
      });
      const json = await res.json();
      if (res.ok && json?.success) setVehiclesData(json.data);
    } finally {
      setVehiclesLoading(false);
    }
  }, [vehicleOwnerFilter, vehicleStatusFilter, vehicleClassFilter, vehicleExpiringOnly, vehicleSearch]);

  const fetchDrivers = useCallback(async () => {
    setDriversLoading(true);
    try {
      const params = new URLSearchParams();
      if (driverProviderFilter !== 'all') params.set('providerType', driverProviderFilter);
      if (driverStatusFilter !== 'all') params.set('status', driverStatusFilter);
      if (driverGovFilter !== 'all') params.set('governorateId', driverGovFilter);
      if (driverSearch.trim()) params.set('search', driverSearch.trim());
      const res = await fetch(`/api/admin/delivery/drivers?${params.toString()}`, {
        headers: ADMIN_HEADERS
      });
      const json = await res.json();
      if (res.ok && json?.success) setDriversData(json.data);
    } finally {
      setDriversLoading(false);
    }
  }, [driverProviderFilter, driverStatusFilter, driverGovFilter, driverSearch]);

  const fetchRatesAndSettings = useCallback(async () => {
    setRatesLoading(true);
    try {
      const [ratesRes, settingsRes] = await Promise.all([
        fetch('/api/admin/delivery/rates', { headers: ADMIN_HEADERS }),
        fetch('/api/admin/delivery/settings', { headers: ADMIN_HEADERS })
      ]);
      const ratesJson = await ratesRes.json();
      const settingsJson = await settingsRes.json();
      if (ratesRes.ok && ratesJson?.success) setRateRules(ratesJson.data || []);
      if (settingsRes.ok && settingsJson?.success) {
        setPlatformSettings(settingsJson.data);
        setSettingsDraft({
          freeDeliveryThresholdIQD: settingsJson.data.freeDeliveryThresholdIQD || 0,
          partnerCommissionPercent: settingsJson.data.partnerCommissionPercent || 0,
          codAllowedForPartners: Boolean(settingsJson.data.codAllowedForPartners)
        });
      }
    } finally {
      setRatesLoading(false);
    }
  }, []);

  const fetchSupplierDelivery = useCallback(async () => {
    setSuppliersLoading(true);
    try {
      const res = await fetch('/api/admin/delivery/suppliers', { headers: ADMIN_HEADERS });
      const json = await res.json();
      if (res.ok && json?.success) setSupplierDeliveryList(json.data || []);
    } finally {
      setSuppliersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (activeTab === 'partners') fetchPartners();
    else if (activeTab === 'vehicles') {
      fetchVehicles();
      fetchPartners();
    } else if (activeTab === 'drivers') {
      fetchDrivers();
      fetchVehicles();
      fetchPartners();
    } else if (activeTab === 'rates') fetchRatesAndSettings();
    else if (activeTab === 'suppliers') fetchSupplierDelivery();
    else if (activeTab === 'simulator') {
      fetchSupplierDelivery();
      fetchRatesAndSettings();
    }
  }, [activeTab, fetchPartners, fetchVehicles, fetchDrivers, fetchRatesAndSettings, fetchSupplierDelivery]);

  useEffect(() => {
    if (selectedPartnerId) {
      fetchPartnerDetail(selectedPartnerId);
    } else {
      setPartnerDetail(null);
    }
  }, [selectedPartnerId, fetchPartnerDetail]);

  const notifyDataChanged = () => {
    fetchOverview();
    if (onDataChanged) onDataChanged();
  };

  const openConfirm = (cfg: {
    title: string;
    description: string;
    danger?: boolean;
    confirmLabel?: string;
    onConfirm: (reason: string) => Promise<void>;
  }) => {
    setConfirmError(null);
    setConfirmState(cfg);
  };

  const handleConfirmExecute = async (reason: string) => {
    if (!confirmState) return;
    setConfirmLoading(true);
    setConfirmError(null);
    try {
      await confirmState.onConfirm(reason);
      setConfirmState(null);
      notifyDataChanged();
    } catch (e: any) {
      setConfirmError(e?.message || t.error);
    } finally {
      setConfirmLoading(false);
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; ar: string; en: string }> = {
      pending: { cls: 'bg-amber-50 text-amber-800 border-amber-200', ar: 'قيد المراجعة', en: 'Pending' },
      active: { cls: 'bg-emerald-50 text-emerald-800 border-emerald-200', ar: 'نشط', en: 'Active' },
      suspended: { cls: 'bg-red-50 text-red-700 border-red-200', ar: 'موقوف', en: 'Suspended' },
      rejected: { cls: 'bg-rose-50 text-rose-800 border-rose-200', ar: 'مرفوض', en: 'Rejected' },
      archived: { cls: 'bg-gray-100 text-gray-700 border-gray-200', ar: 'مؤرشف', en: 'Archived' },
      maintenance: { cls: 'bg-blue-50 text-blue-800 border-blue-200', ar: 'صيانة', en: 'Maintenance' }
    };
    const item = map[status] || { cls: 'bg-gray-100 text-gray-700 border-gray-200', ar: status, en: status };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-bold ${item.cls}`}>
        {isAr ? item.ar : item.en}
      </span>
    );
  };

  // Partner Status Transitions
  const triggerPartnerAction = (p: any, action: PartnerActionType) => {
    const labels: Record<PartnerActionType, { ar: string; en: string; danger?: boolean }> = {
      approve: {
        ar: `اعتماد شريك التوصيل (${p.name})`,
        en: `Approve Delivery Partner (${p.name})`
      },
      reject: {
        ar: `رفض طلب شريك التوصيل (${p.name})`,
        en: `Reject Delivery Partner (${p.name})`,
        danger: true
      },
      suspend: {
        ar: `إيقاف شريك التوصيل (${p.name})`,
        en: `Suspend Delivery Partner (${p.name})`,
        danger: true
      },
      reactivate: {
        ar: `إعادة تفعيل شريك التوصيل (${p.name})`,
        en: `Reactivate Delivery Partner (${p.name})`
      },
      archive: {
        ar: `أرشفة شريك التوصيل (${p.name})`,
        en: `Archive Delivery Partner (${p.name})`,
        danger: true
      }
    };
    const meta = labels[action];
    openConfirm({
      title: isAr ? meta.ar : meta.en,
      description:
        action === 'approve' && p.type === 'individual'
          ? isAr
            ? 'سيتم تفعيل الشريك الفردي وإنشاء سجل سائق مرتبط به تلقائياً وتسجيل العملية في سجل التدقيق.'
            : 'Partner will be activated and an individual Delivery Driver profile will be created automatically.'
          : isAr
          ? 'سيتم تسجيل هذا الإجراء مع السبب الإلزامي في سجل التدقيق.'
          : 'This action and its mandatory reason will be recorded in the audit log.',
      danger: meta.danger,
      onConfirm: async (reason) => {
        const res = await fetch(
          `/api/admin/delivery/partners/${encodeURIComponent(p.id)}/${action}`,
          {
            method: 'POST',
            headers: ADMIN_HEADERS,
            body: JSON.stringify({ reason })
          }
        );
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.message || t.error);
        await fetchPartners();
        if (selectedPartnerId === p.id) await fetchPartnerDetail(p.id);
      }
    });
  };

  const handleSavePartnerKyc = async () => {
    if (!selectedPartnerId) return;
    setKycSaving(true);
    try {
      const res = await fetch(
        `/api/admin/delivery/partners/${encodeURIComponent(selectedPartnerId)}/kyc`,
        {
          method: 'PATCH',
          headers: ADMIN_HEADERS,
          body: JSON.stringify(kycForm)
        }
      );
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || t.error);
      await fetchPartnerDetail(selectedPartnerId);
      notifyDataChanged();
    } catch (e: any) {
      setGlobalError(e?.message || t.error);
    } finally {
      setKycSaving(false);
    }
  };

  const handleAddPartnerNote = async () => {
    if (!selectedPartnerId || noteText.trim().length < 3) return;
    setNoteSaving(true);
    try {
      const res = await fetch(
        `/api/admin/delivery/partners/${encodeURIComponent(selectedPartnerId)}/notes`,
        {
          method: 'POST',
          headers: ADMIN_HEADERS,
          body: JSON.stringify({ text: noteText.trim() })
        }
      );
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || t.error);
      setNoteText('');
      await fetchPartnerDetail(selectedPartnerId);
    } catch (e: any) {
      setGlobalError(e?.message || t.error);
    } finally {
      setNoteSaving(false);
    }
  };

  // Vehicle Actions
  const triggerVehicleAction = (v: any, action: VehicleActionType) => {
    const titleMap: Record<VehicleActionType, { ar: string; en: string; danger?: boolean }> = {
      approve: { ar: `اعتماد وتفعيل المركبة (${v.plateNumber})`, en: `Approve Vehicle (${v.plateNumber})` },
      activate: { ar: `تفعيل المركبة (${v.plateNumber})`, en: `Activate Vehicle (${v.plateNumber})` },
      maintenance: { ar: `تحويل للصيانة (${v.plateNumber})`, en: `Set Maintenance (${v.plateNumber})` },
      suspend: { ar: `إيقاف المركبة (${v.plateNumber})`, en: `Suspend Vehicle (${v.plateNumber})`, danger: true },
      reject: { ar: `رفض المركبة (${v.plateNumber})`, en: `Reject Vehicle (${v.plateNumber})`, danger: true }
    };
    const meta = titleMap[action];
    openConfirm({
      title: isAr ? meta.ar : meta.en,
      description: isAr
        ? 'يتطلب تغيير حالة المركبة سبباً إدارياً موثقاً (5 أحرف على الأقل).'
        : 'Vehicle status transitions require an audited reason (min 5 characters).',
      danger: meta.danger,
      onConfirm: async (reason) => {
        const res = await fetch(
          `/api/admin/delivery/vehicles/${encodeURIComponent(v.id)}/${action}`,
          {
            method: 'POST',
            headers: ADMIN_HEADERS,
            body: JSON.stringify({ reason })
          }
        );
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.message || t.error);
        await fetchVehicles();
        if (selectedPartnerId && v.partnerId === selectedPartnerId) {
          await fetchPartnerDetail(selectedPartnerId);
        }
      }
    });
  };

  const handleCreateVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/delivery/vehicles', {
        method: 'POST',
        headers: ADMIN_HEADERS,
        body: JSON.stringify({
          ownerType: newVehicleForm.ownerType,
          partnerId: newVehicleForm.ownerType === 'partner' ? newVehicleForm.partnerId : undefined,
          plateNumber: newVehicleForm.plateNumber,
          vehicleClass: newVehicleForm.vehicleClass,
          makeModel: newVehicleForm.makeModel,
          year: Number(newVehicleForm.year) || undefined,
          capacityUnits: Number(newVehicleForm.capacityUnits) || 0,
          temperatureSupport: newVehicleForm.temperatureSupport,
          docsExpiry: {
            registrationExpiry: newVehicleForm.registrationExpiry || undefined,
            insuranceExpiry: newVehicleForm.insuranceExpiry || undefined,
            inspectionExpiry: newVehicleForm.inspectionExpiry || undefined
          },
          reason: newVehicleForm.reason
        })
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || t.error);
      setCreateVehicleOpen(false);
      setNewVehicleForm({
        ...newVehicleForm,
        plateNumber: '',
        makeModel: ''
      });
      await fetchVehicles();
      notifyDataChanged();
    } catch (err: any) {
      setGlobalError(err?.message || t.error);
    }
  };

  const handleSaveVehicleDocs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVehicleDocsTarget) return;
    try {
      const res = await fetch(
        `/api/admin/delivery/vehicles/${encodeURIComponent(editVehicleDocsTarget.id)}/docs`,
        {
          method: 'PATCH',
          headers: ADMIN_HEADERS,
          body: JSON.stringify({
            docsExpiry: {
              registrationExpiry: editDocsForm.registrationExpiry || undefined,
              insuranceExpiry: editDocsForm.insuranceExpiry || undefined,
              inspectionExpiry: editDocsForm.inspectionExpiry || undefined
            },
            reason: editDocsForm.reason
          })
        }
      );
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || t.error);
      setEditVehicleDocsTarget(null);
      await fetchVehicles();
      notifyDataChanged();
    } catch (err: any) {
      setGlobalError(err?.message || t.error);
    }
  };

  // Driver Actions
  const triggerDriverAction = (d: any, action: DriverActionType) => {
    const labelMap: Record<DriverActionType, { ar: string; en: string; danger?: boolean }> = {
      approve: { ar: `اعتماد السائق (${d.name})`, en: `Approve Driver (${d.name})` },
      reactivate: { ar: `إعادة تفعيل السائق (${d.name})`, en: `Reactivate Driver (${d.name})` },
      suspend: { ar: `إيقاف السائق (${d.name})`, en: `Suspend Driver (${d.name})`, danger: true },
      reject: { ar: `رفض السائق (${d.name})`, en: `Reject Driver (${d.name})`, danger: true },
      archive: { ar: `أرشفة السائق (${d.name})`, en: `Archive Driver (${d.name})`, danger: true }
    };
    const meta = labelMap[action];
    openConfirm({
      title: isAr ? meta.ar : meta.en,
      description: isAr
        ? 'سيتم تحديث حالة سائق شبكة التوصيل وتسجيل السبب في سجل التدقيق.'
        : 'Driver account status will be updated and audited.',
      danger: meta.danger,
      onConfirm: async (reason) => {
        const res = await fetch(
          `/api/admin/delivery/drivers/${encodeURIComponent(d.id)}/${action}`,
          {
            method: 'POST',
            headers: ADMIN_HEADERS,
            body: JSON.stringify({ reason })
          }
        );
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.message || t.error);
        await fetchDrivers();
      }
    });
  };

  const handleCreateDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/delivery/drivers', {
        method: 'POST',
        headers: ADMIN_HEADERS,
        body: JSON.stringify({
          providerType: newDriverForm.providerType,
          partnerId: newDriverForm.providerType === 'partner' ? newDriverForm.partnerId : undefined,
          name: newDriverForm.name,
          phone: newDriverForm.phone,
          licenseNo: newDriverForm.licenseNo || undefined,
          licenseExpiry: newDriverForm.licenseExpiry || undefined,
          assignedVehicleId: newDriverForm.assignedVehicleId || undefined,
          governorateId: newDriverForm.governorateId,
          serviceZoneIds: newDriverForm.serviceZoneIds,
          reason: newDriverForm.reason
        })
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || t.error);
      setCreateDriverOpen(false);
      setNewDriverForm({ ...newDriverForm, name: '', phone: '', licenseNo: '' });
      await fetchDrivers();
      notifyDataChanged();
    } catch (err: any) {
      setGlobalError(err?.message || t.error);
    }
  };

  const handleAssignVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignVehicleDriver) return;
    try {
      const res = await fetch(
        `/api/admin/delivery/drivers/${encodeURIComponent(assignVehicleDriver.id)}`,
        {
          method: 'PATCH',
          headers: ADMIN_HEADERS,
          body: JSON.stringify({
            assignedVehicleId: assignVehicleId || null,
            reason: assignVehicleReason
          })
        }
      );
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || t.error);
      setAssignVehicleDriver(null);
      await fetchDrivers();
      notifyDataChanged();
    } catch (err: any) {
      setGlobalError(err?.message || t.error);
    }
  };

  // Rate Rules & Platform Settings Actions
  const handleSavePlatformSettings = () => {
    openConfirm({
      title: isAr ? 'حفظ إعدادات شبكة التوصيل' : 'Save Platform Delivery Settings',
      description: isAr
        ? 'سيتم تحديث عتبة التوصيل المجاني وإعدادات شبكة التوصيل مع توثيق التعديل في سجل التدقيق.'
        : 'Updates platform-wide free delivery threshold and partner delivery policies.',
      onConfirm: async (reason) => {
        const res = await fetch('/api/admin/delivery/settings', {
          method: 'PATCH',
          headers: ADMIN_HEADERS,
          body: JSON.stringify({
            freeDeliveryThresholdIQD: Number(settingsDraft.freeDeliveryThresholdIQD) || 0,
            partnerCommissionPercent: Number(settingsDraft.partnerCommissionPercent) || 0,
            codAllowedForPartners: Boolean(settingsDraft.codAllowedForPartners),
            reason
          })
        });
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.message || t.error);
        await fetchRatesAndSettings();
      }
    });
  };

  const handleSaveRateRuleModal = (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = rateModalTarget === 'new';
    const payload = {
      nameAr: rateForm.nameAr,
      nameEn: rateForm.nameEn || rateForm.nameAr,
      scope: {
        governorateId: rateForm.governorateId || undefined,
        deliveryZoneId: rateForm.deliveryZoneId || undefined
      },
      vehicleClass: rateForm.vehicleClass,
      baseFeeIQD: Number(rateForm.baseFeeIQD) || 0,
      perUnitFeeIQD: Number(rateForm.perUnitFeeIQD) || 0,
      minFeeIQD: Number(rateForm.minFeeIQD) || 0,
      refrigeratedSurchargeIQD: Number(rateForm.refrigeratedSurchargeIQD) || 0,
      isActive: rateForm.isActive
    };
    openConfirm({
      title: isNew
        ? isAr
          ? 'إنشاء قاعدة تسعير جديدة'
          : 'Create New Rate Rule'
        : isAr
        ? `تعديل قاعدة التسعير (${rateForm.nameAr})`
        : `Update Rate Rule (${rateForm.nameEn || rateForm.nameAr})`,
      description: isAr
        ? 'أدخل سبب إنشاء أو تعديل بطاقة التسعير ليتم تسجيله في سجل التدقيق.'
        : 'Provide an audited reason for this rate card change.',
      onConfirm: async (reason) => {
        const url = isNew
          ? '/api/admin/delivery/rates'
          : `/api/admin/delivery/rates/${encodeURIComponent(rateModalTarget.id)}`;
        const res = await fetch(url, {
          method: isNew ? 'POST' : 'PATCH',
          headers: ADMIN_HEADERS,
          body: JSON.stringify({ ...payload, reason })
        });
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.message || t.error);
        setRateModalTarget(null);
        await fetchRatesAndSettings();
      }
    });
  };

  const handleToggleRateRule = (rule: any) => {
    openConfirm({
      title: rule.isActive
        ? isAr
          ? `تعطيل قاعدة التسعير (${rule.nameAr})`
          : `Deactivate Rate Rule (${rule.nameEn})`
        : isAr
        ? `تفعيل قاعدة التسعير (${rule.nameAr})`
        : `Activate Rate Rule (${rule.nameEn})`,
      description: isAr
        ? 'سيتم تغيير حالة تفعيل القاعدة وتسجيل السبب في سجل التدقيق.'
        : 'Rule activation state will change and be logged in audit.',
      danger: rule.isActive,
      onConfirm: async (reason) => {
        const res = await fetch(`/api/admin/delivery/rates/${encodeURIComponent(rule.id)}`, {
          method: 'PATCH',
          headers: ADMIN_HEADERS,
          body: JSON.stringify({ isActive: !rule.isActive, reason })
        });
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.message || t.error);
        await fetchRatesAndSettings();
      }
    });
  };

  // Supplier Delivery Settings Save
  const handleOpenSupplierModal = (row: any) => {
    const ds = row.deliverySettings || {
      hasOwnFleet: true,
      allowPlatformDelivery: false,
      allowStorePickup: true
    };
    setEditingSupplier(row);
    setSupplierFormValidationError(null);
    setSupplierForm({
      hasOwnFleet: Boolean(ds.hasOwnFleet),
      allowPlatformDelivery: Boolean(ds.allowPlatformDelivery),
      allowStorePickup: Boolean(ds.allowStorePickup),
      freeThresholdInput:
        ds.freeDeliveryThresholdIQD !== undefined && ds.freeDeliveryThresholdIQD !== null
          ? String(ds.freeDeliveryThresholdIQD)
          : '',
      notes: ds.notes || ''
    });
  };

  const handleSaveSupplierSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;
    if (
      !supplierForm.hasOwnFleet &&
      !supplierForm.allowPlatformDelivery &&
      !supplierForm.allowStorePickup
    ) {
      setSupplierFormValidationError(
        isAr
          ? 'يجب إبقاء خيار توصيل واحد على الأقل مفعلاً للمورد (أسطول المورد أو شبكة المنصة أو الاستلام من المستودع).'
          : 'At least one delivery option must remain enabled for the supplier.'
      );
      return;
    }
    setSupplierFormValidationError(null);
    openConfirm({
      title: isAr
        ? `تحديث إعدادات توصيل: ${editingSupplier.companyName}`
        : `Update Delivery Settings: ${editingSupplier.companyName}`,
      description: isAr
        ? 'سيتم حفظ إعدادات خيارات التوصيل للمورد وتسجيل التعديل في سجل التدقيق.'
        : 'Supplier delivery options will be updated and logged.',
      onConfirm: async (reason) => {
        const res = await fetch(
          `/api/admin/delivery/suppliers/${encodeURIComponent(
            editingSupplier.supplierId
          )}/delivery-settings`,
          {
            method: 'PATCH',
            headers: ADMIN_HEADERS,
            body: JSON.stringify({
              hasOwnFleet: supplierForm.hasOwnFleet,
              allowPlatformDelivery: supplierForm.allowPlatformDelivery,
              allowStorePickup: supplierForm.allowStorePickup,
              freeDeliveryThresholdIQD:
                supplierForm.freeThresholdInput.trim() === ''
                  ? null
                  : Number(supplierForm.freeThresholdInput),
              notes: supplierForm.notes || undefined,
              reason
            })
          }
        );
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.message || t.error);
        setEditingSupplier(null);
        await fetchSupplierDelivery();
      }
    });
  };

  // Simulator
  const runFeeSimulator = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSimLoading(true);
    setSimError(null);
    try {
      const res = await fetch('/api/admin/delivery/simulate-fee', {
        method: 'POST',
        headers: ADMIN_HEADERS,
        body: JSON.stringify({
          supplierId: simForm.supplierId || undefined,
          governorateId: simForm.governorateId,
          deliveryZoneId: simForm.deliveryZoneId || undefined,
          units: Number(simForm.units) || 1,
          requiredTemperature: simForm.requiredTemperature,
          orderValueIQD: Number(simForm.orderValueIQD) || 0
        })
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || t.error);
      setSimResult(json.data);
    } catch (err: any) {
      setSimError(err?.message || t.error);
    } finally {
      setSimLoading(false);
    }
  };

  const simZones = useMemo(() => {
    const gov = governorates.find((g) => g.id === simForm.governorateId);
    return gov?.deliveryZones || [];
  }, [governorates, simForm.governorateId]);

  const driverZonesForNew = useMemo(() => {
    const gov = governorates.find((g) => g.id === newDriverForm.governorateId);
    return gov?.deliveryZones || [];
  }, [governorates, newDriverForm.governorateId]);

  const rateZones = useMemo(() => {
    const gov = governorates.find((g) => g.id === rateForm.governorateId);
    return gov?.deliveryZones || [];
  }, [governorates, rateForm.governorateId]);

  const activePartnersList = useMemo(
    () => (partnersData?.items || []).filter((p: any) => p.accountStatus === 'active'),
    [partnersData]
  );

  const activeVehiclesList = useMemo(
    () => (vehiclesData?.items || []).filter((v: any) => v.status === 'active'),
    [vehiclesData]
  );

  const tabs: Array<{ id: DeliveryTabKey; label: string; badge?: number }> = [
    { id: 'overview', label: t.adminDelTabOverview },
    {
      id: 'partners',
      label: t.adminDelTabPartners,
      badge: overview?.partners?.pending || undefined
    },
    {
      id: 'vehicles',
      label: t.adminDelTabVehicles,
      badge: overview?.vehicles?.expiringDocsCount || undefined
    },
    { id: 'drivers', label: t.adminDelTabDrivers },
    { id: 'rates', label: t.adminDelTabRates },
    { id: 'suppliers', label: t.adminDelTabSupplierDelivery },
    { id: 'simulator', label: t.adminDelTabSimulator }
  ];

  return (
    <div className="space-y-4 sm:space-y-5 font-brand">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-[#00A046] border border-emerald-200 text-[11px] font-black">
                {isAr ? 'المرحلة D1 — التأسيس' : 'Phase D1 — Foundation'}
              </span>
              <span className="text-[11px] font-semibold text-[#797878]">
                {isAr ? 'منفصلة عن سائقي فانات الموردين' : 'Separate from Supplier Van Drivers'}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-[#221F1F] mt-1">
              {t.adminDelTitle}
            </h1>
            <p className="text-xs sm:text-sm text-[#797878] mt-0.5">{t.adminDelSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              fetchOverview();
              if (activeTab === 'partners') fetchPartners();
              if (activeTab === 'vehicles') fetchVehicles();
              if (activeTab === 'drivers') fetchDrivers();
              if (activeTab === 'rates') fetchRatesAndSettings();
              if (activeTab === 'suppliers') fetchSupplierDelivery();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-xs font-bold text-[#221F1F] cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${overviewLoading ? 'animate-spin' : ''}`} />
            <span>{t.adminRefresh}</span>
          </button>
        </div>

        {/* Sub-navigation tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-4 mt-4 border-t border-[#F3F4F6]">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#00A046] text-white shadow-xs'
                    : 'bg-[#F9FAFB] text-[#4A4747] hover:bg-[#F3F4F6] border border-[#E5E7EB]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 ? (
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-black tabular-nums ${
                      active ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {globalError && (
        <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold flex items-center justify-between gap-2">
          <span>{globalError}</span>
          <button
            type="button"
            onClick={() => setGlobalError(null)}
            className="p-1 hover:bg-red-100 rounded-lg cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveTab('partners');
                setPartnerStatusTab('pending');
              }}
              className="bg-white rounded-2xl border border-[#E5E7EB] p-4 text-start hover:border-[#00A046] transition-colors cursor-pointer"
            >
              <div className="text-[11px] font-bold text-[#797878]">
                {isAr ? 'شركاء التوصيل (نشط / معلق)' : 'Delivery Partners (Active / Pending)'}
              </div>
              <div className="text-xl font-black text-[#221F1F] mt-1 tabular-nums">
                {overview.partners.active}{' '}
                <span className="text-sm font-extrabold text-amber-600">
                  / {overview.partners.pending}
                </span>
              </div>
              <div className="text-[11px] text-[#797878] mt-1">
                {isAr
                  ? `إجمالي الشركاء المسجلين: ${overview.partners.total}`
                  : `Total registered: ${overview.partners.total}`}
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('vehicles');
                setVehicleExpiringOnly(true);
              }}
              className="bg-white rounded-2xl border border-[#E5E7EB] p-4 text-start hover:border-[#00A046] transition-colors cursor-pointer"
            >
              <div className="text-[11px] font-bold text-[#797878]">
                {isAr ? 'مركبات بوثائق قريبة الانتهاء' : 'Vehicles Docs Expiring (<=30d)'}
              </div>
              <div
                className={`text-xl font-black mt-1 tabular-nums ${
                  overview.vehicles.expiringDocsCount > 0 ? 'text-amber-600' : 'text-[#00A046]'
                }`}
              >
                {overview.vehicles.expiringDocsCount}
              </div>
              <div className="text-[11px] text-[#797878] mt-1 tabular-nums">
                {isAr
                  ? `نشطة: ${overview.vehicles.active} من أصل ${overview.vehicles.total}`
                  : `Active: ${overview.vehicles.active} / ${overview.vehicles.total}`}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('drivers')}
              className="bg-white rounded-2xl border border-[#E5E7EB] p-4 text-start hover:border-[#00A046] transition-colors cursor-pointer"
            >
              <div className="text-[11px] font-bold text-[#797878]">
                {isAr ? 'سائقو شبكة التوصيل النشطون' : 'Active Network Drivers'}
              </div>
              <div className="text-xl font-black text-[#221F1F] mt-1 tabular-nums">
                {overview.drivers.platformActive + overview.drivers.partnerActive}
              </div>
              <div className="text-[11px] text-[#797878] mt-1 tabular-nums">
                {isAr
                  ? `منصة: ${overview.drivers.platformActive} • شركاء: ${overview.drivers.partnerActive}`
                  : `Platform: ${overview.drivers.platformActive} • Partner: ${overview.drivers.partnerActive}`}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rates')}
              className="bg-white rounded-2xl border border-[#E5E7EB] p-4 text-start hover:border-[#00A046] transition-colors cursor-pointer"
            >
              <div className="text-[11px] font-bold text-[#797878]">
                {isAr ? 'عتبة التوصيل المجاني (قيمة تجريبية)' : 'Free Delivery Threshold (Demo)'}
              </div>
              <div className="text-xl font-black text-[#00A046] mt-1 tabular-nums">
                {formatCurrency(overview.rates.freeDeliveryThresholdIQD, currency, language)}
              </div>
              <div className="text-[11px] text-[#797878] mt-1 tabular-nums">
                {isAr
                  ? `قواعد تسعير فعالة: ${overview.rates.activeRulesCount}`
                  : `Active rate rules: ${overview.rates.activeRulesCount}`}
              </div>
            </button>
          </div>

          {/* Expiring vehicle docs list */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileWarning className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm sm:text-base font-extrabold text-[#221F1F]">
                  {isAr
                    ? 'تنبيهات وثائق المركبات (تنتهي خلال 30 يوماً)'
                    : 'Vehicle Document Expiry Alerts (Within 30 Days)'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('vehicles');
                  setVehicleExpiringOnly(true);
                }}
                className="text-xs font-bold text-[#00A046] hover:underline cursor-pointer"
              >
                {isAr ? 'إدارة المركبات' : 'Manage Vehicles'}
              </button>
            </div>
            {(!overview.expiringVehicles || overview.expiringVehicles.length === 0) ? (
              <p className="text-xs text-[#797878] py-3">
                {isAr ? 'جميع وثائق المركبات سارية لأكثر من 30 يوماً.' : 'All vehicle documents are valid for >30 days.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {overview.expiringVehicles.map((v: any) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-black text-[#221F1F]">
                        {v.plateNumber} — {v.makeModel}
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {v.expiringDocs.map((d: any) => (
                          <div key={d.field} className="text-[11px] font-bold text-amber-800">
                            {d.field === 'registrationExpiry'
                              ? isAr
                                ? 'السنوية'
                                : 'Registration'
                              : d.field === 'insuranceExpiry'
                              ? isAr
                                ? 'التأمين'
                                : 'Insurance'
                              : isAr
                              ? 'الفحص الفني'
                              : 'Inspection'}
                            : {d.date} (
                            {d.daysRemaining <= 0
                              ? isAr
                                ? 'منتهي'
                                : 'Expired'
                              : isAr
                              ? `متبقي ${d.daysRemaining} يوم`
                              : `${d.daysRemaining}d left`}
                            )
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('vehicles');
                        setVehicleExpiringOnly(true);
                      }}
                      className="shrink-0 px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E7EB] text-[11px] font-bold text-[#221F1F] hover:border-[#00A046] cursor-pointer"
                    >
                      {isAr ? 'مراجعة' : 'Review'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: PARTNERS ================= */}
      {activeTab === 'partners' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3">
            {/* Status tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {(
                [
                  { id: 'all', ar: 'الكل', en: 'All' },
                  { id: 'pending', ar: 'بانتظار المراجعة', en: 'Pending' },
                  { id: 'active', ar: 'نشط', en: 'Active' },
                  { id: 'suspended', ar: 'موقوف', en: 'Suspended' },
                  { id: 'rejected_archived', ar: 'مرفوض / مؤرشف', en: 'Rejected / Archived' }
                ] as const
              ).map((st) => {
                const count = partnersData?.statusCounts?.[st.id] ?? 0;
                const active = partnerStatusTab === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setPartnerStatusTab(st.id)}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                      active
                        ? 'bg-[#00A046] text-white'
                        : 'bg-[#F9FAFB] text-[#4A4747] border border-[#E5E7EB] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    <span>{isAr ? st.ar : st.en}</span>
                    <span
                      className={`px-1.5 rounded text-[10px] font-black tabular-nums ${
                        active ? 'bg-white/25 text-white' : 'bg-white text-[#221F1F]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="relative">
                <input
                  type="text"
                  value={partnerSearch}
                  onChange={(e) => setPartnerSearch(e.target.value)}
                  placeholder={isAr ? 'بحث بالاسم، الهاتف، أو رمز DP-...' : 'Search name, phone, code...'}
                  className="w-full rounded-xl border border-[#D1D5DB] bg-white ps-9 pe-3 py-2 text-xs font-semibold text-[#221F1F]"
                />
                <Search className="w-3.5 h-3.5 text-[#797878] absolute start-3 top-2.5" />
              </div>
              <select
                value={partnerTypeFilter}
                onChange={(e) => setPartnerTypeFilter(e.target.value)}
                className="rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-xs font-semibold text-[#221F1F]"
              >
                <option value="all">{isAr ? 'كل الأنواع (فردي / شركة)' : 'All Types'}</option>
                <option value="individual">{isAr ? 'شريك فردي' : 'Individual'}</option>
                <option value="company">{isAr ? 'شركة توصيل' : 'Company'}</option>
              </select>
              <select
                value={partnerGovFilter}
                onChange={(e) => setPartnerGovFilter(e.target.value)}
                className="rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-xs font-semibold text-[#221F1F]"
              >
                <option value="all">{isAr ? 'كل المحافظات' : 'All Governorates'}</option>
                {governorates.map((g) => (
                  <option key={g.id} value={g.id}>
                    {isAr ? g.nameAr : g.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Cards + Desktop Table */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs">
            {partnersLoading ? (
              <div className="py-10 text-center text-xs text-[#797878]">{t.loading}</div>
            ) : !partnersData?.items?.length ? (
              <div className="py-10 text-center text-xs text-[#797878]">
                {isAr ? 'لا يوجد شركاء توصيل مطابقون' : 'No delivery partners found'}
              </div>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {partnersData.items.map((p: any) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-black text-[#221F1F]">{p.name}</div>
                          <div className="text-[11px] font-mono text-[#797878] mt-0.5">
                            {p.registrationCode} • {p.phone}
                          </div>
                        </div>
                        {renderStatusBadge(p.accountStatus)}
                      </div>
                      <div className="text-[11px] text-[#4A4747] flex flex-wrap items-center gap-2">
                        <span>{p.type === 'company' ? (isAr ? 'شركة' : 'Company') : isAr ? 'فردي' : 'Individual'}</span>
                        <span>•</span>
                        <span>{isAr ? p.governorateNameAr : p.governorateNameEn}</span>
                        <span>•</span>
                        <span>
                          {p.vehiclesCount} {isAr ? 'مركبة' : 'veh'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#E5E7EB]">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPartnerId(p.id);
                            setPartnerDetailTab('overview');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E7EB] text-[11px] font-bold text-[#221F1F] cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#00A046]" />
                          <span>{isAr ? 'التفاصيل' : 'Details'}</span>
                        </button>
                        {p.accountStatus === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => triggerPartnerAction(p, 'approve')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#00A046] text-white text-[11px] font-bold cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isAr ? 'اعتماد' : 'Approve'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => triggerPartnerAction(p, 'reject')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-[11px] font-bold cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{isAr ? 'رفض' : 'Reject'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] text-[#797878]">
                        <th className="py-2.5 text-start font-bold">{isAr ? 'الشريك / الرمز' : 'Partner / Code'}</th>
                        <th className="py-2.5 text-start font-bold">{isAr ? 'النوع' : 'Type'}</th>
                        <th className="py-2.5 text-start font-bold">{isAr ? 'المحافظة والمناطق' : 'Governorate & Zones'}</th>
                        <th className="py-2.5 text-center font-bold">{isAr ? 'المركبات / السائقون' : 'Vehicles / Drivers'}</th>
                        <th className="py-2.5 text-center font-bold">{isAr ? 'الحالة' : 'Status'}</th>
                        <th className="py-2.5 text-end font-bold">{isAr ? 'إجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6]">
                      {partnersData.items.map((p: any) => (
                        <tr key={p.id} className="hover:bg-[#F9FAFB]">
                          <td className="py-3">
                            <div className="font-black text-[#221F1F]">{p.name}</div>
                            <div className="text-[11px] text-[#797878] font-mono">
                              {p.registrationCode} • {p.phone}
                            </div>
                          </td>
                          <td className="py-3 font-bold text-[#4A4747]">
                            {p.type === 'company' ? (isAr ? 'شركة توصيل' : 'Company') : isAr ? 'فردي' : 'Individual'}
                          </td>
                          <td className="py-3">
                            <div className="font-bold text-[#221F1F]">
                              {isAr ? p.governorateNameAr : p.governorateNameEn}
                            </div>
                            <div className="text-[11px] text-[#797878]">
                              {(p.serviceZones || [])
                                .map((z: any) => (isAr ? z.nameAr : z.nameEn))
                                .join('، ')}
                            </div>
                          </td>
                          <td className="py-3 text-center font-bold tabular-nums text-[#221F1F]">
                            {p.activeVehiclesCount}/{p.vehiclesCount} {isAr ? 'مركبة' : 'veh'} •{' '}
                            {p.driversCount} {isAr ? 'سائق' : 'drv'}
                          </td>
                          <td className="py-3 text-center">{renderStatusBadge(p.accountStatus)}</td>
                          <td className="py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPartnerId(p.id);
                                  setPartnerDetailTab('overview');
                                }}
                                className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:border-[#00A046] text-[11px] font-bold text-[#221F1F] cursor-pointer"
                              >
                                {isAr ? 'عرض' : 'Inspect'}
                              </button>
                              {p.accountStatus === 'pending' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => triggerPartnerAction(p, 'approve')}
                                    className="px-2.5 py-1.5 rounded-lg bg-[#00A046] text-white text-[11px] font-bold cursor-pointer"
                                  >
                                    {isAr ? 'اعتماد' : 'Approve'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => triggerPartnerAction(p, 'reject')}
                                    className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-[11px] font-bold cursor-pointer"
                                  >
                                    {isAr ? 'رفض' : 'Reject'}
                                  </button>
                                </>
                              )}
                              {p.accountStatus === 'active' && (
                                <button
                                  type="button"
                                  onClick={() => triggerPartnerAction(p, 'suspend')}
                                  className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold cursor-pointer"
                                >
                                  {isAr ? 'إيقاف' : 'Suspend'}
                                </button>
                              )}
                              {(p.accountStatus === 'suspended' || p.accountStatus === 'archived') && (
                                <button
                                  type="button"
                                  onClick={() => triggerPartnerAction(p, 'reactivate')}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-[#00A046] border border-emerald-200 text-[11px] font-bold cursor-pointer"
                                >
                                  {isAr ? 'تفعيل' : 'Reactivate'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: VEHICLES ================= */}
      {activeTab === 'vehicles' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vehicleExpiringOnly}
                    onChange={(e) => setVehicleExpiringOnly(e.target.checked)}
                    className="accent-[#00A046]"
                  />
                  <span>
                    {isAr ? 'وثائق تنتهي خلال 30 يوماً فقط' : 'Docs expiring <= 30d only'}
                  </span>
                </label>
              </div>
              <button
                type="button"
                onClick={() => setCreateVehicleOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00A046] hover:bg-[#008a3c] text-white text-xs font-black cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة مركبة جديدة' : 'Add Vehicle'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div className="relative">
                <input
                  type="text"
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                  placeholder={isAr ? 'لوحة، موديل أو شريك...' : 'Plate, model, or partner...'}
                  className="w-full rounded-xl border border-[#D1D5DB] bg-white ps-9 pe-3 py-2 text-xs font-semibold text-[#221F1F]"
                />
                <Search className="w-3.5 h-3.5 text-[#797878] absolute start-3 top-2.5" />
              </div>
              <select
                value={vehicleOwnerFilter}
                onChange={(e) => setVehicleOwnerFilter(e.target.value)}
                className="rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-xs font-semibold"
              >
                <option value="all">{isAr ? 'كل الملكيات (منصة / شريك)' : 'All Owners'}</option>
                <option value="platform">{isAr ? 'ملك المنصة' : 'Platform Owned'}</option>
                <option value="partner">{isAr ? 'ملك شريك توصيل' : 'Partner Owned'}</option>
              </select>
              <select
                value={vehicleClassFilter}
                onChange={(e) => setVehicleClassFilter(e.target.value)}
                className="rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-xs font-semibold"
              >
                <option value="all">{isAr ? 'كل فئات المركبات' : 'All Vehicle Classes'}</option>
                {VEHICLE_CLASS_ORDER.map((vc) => (
                  <option key={vc} value={vc}>
                    {isAr ? VEHICLE_CLASS_LABELS[vc].ar : VEHICLE_CLASS_LABELS[vc].en}
                  </option>
                ))}
              </select>
              <select
                value={vehicleStatusFilter}
                onChange={(e) => setVehicleStatusFilter(e.target.value)}
                className="rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-xs font-semibold"
              >
                <option value="all">{isAr ? 'كل الحالات' : 'All Statuses'}</option>
                <option value="pending">{isAr ? 'قيد المراجعة' : 'Pending'}</option>
                <option value="active">{isAr ? 'نشطة' : 'Active'}</option>
                <option value="maintenance">{isAr ? 'صيانة' : 'Maintenance'}</option>
                <option value="suspended">{isAr ? 'موقوفة' : 'Suspended'}</option>
                <option value="rejected">{isAr ? 'مرفوضة' : 'Rejected'}</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs">
            {vehiclesLoading ? (
              <div className="py-10 text-center text-xs text-[#797878]">{t.loading}</div>
            ) : !vehiclesData?.items?.length ? (
              <div className="py-10 text-center text-xs text-[#797878]">
                {isAr ? 'لا توجد مركبات مطابقة' : 'No vehicles found'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vehiclesData.items.map((v: any) => (
                  <div
                    key={v.id}
                    className={`p-3.5 rounded-xl border space-y-2.5 ${
                      v.hasExpiringDocs
                        ? 'border-amber-300 bg-amber-50/30'
                        : 'border-[#E5E7EB] bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-[#221F1F]">{v.plateNumber}</span>
                          <span className="px-1.5 py-0.5 rounded bg-white border border-[#E5E7EB] text-[10px] font-bold text-[#4A4747]">
                            {v.ownerType === 'platform'
                              ? isAr
                                ? 'أسطول المنصة'
                                : 'Platform'
                              : v.partnerName || (isAr ? 'شريك' : 'Partner')}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-[#4A4747] mt-0.5">
                          {v.makeModel} •{' '}
                          {isAr
                            ? VEHICLE_CLASS_LABELS[v.vehicleClass as DeliveryVehicleClass]?.ar
                            : VEHICLE_CLASS_LABELS[v.vehicleClass as DeliveryVehicleClass]?.en}
                        </div>
                      </div>
                      {renderStatusBadge(v.status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-[#4A4747] tabular-nums">
                      <span>
                        {isAr ? `السعة: ${v.capacityUnits} وحدة` : `Capacity: ${v.capacityUnits} units`}
                      </span>
                      <span>•</span>
                      <span>
                        {isAr ? 'التبريد:' : 'Temp:'}{' '}
                        {(v.temperatureSupport || []).join(', ')}
                      </span>
                    </div>

                    {v.hasExpiringDocs && (
                      <div className="p-2 rounded-lg bg-amber-100/70 text-amber-900 text-[11px] font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {v.expiringDocs
                            .map((d: any) => `${d.field}: ${d.date} (${d.daysRemaining}d)`)
                            .join(' | ')}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#E5E7EB]">
                      {v.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => triggerVehicleAction(v, 'approve')}
                            className="px-2.5 py-1 rounded-lg bg-[#00A046] text-white text-[11px] font-bold cursor-pointer"
                          >
                            {isAr ? 'اعتماد' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerVehicleAction(v, 'reject')}
                            className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold cursor-pointer"
                          >
                            {isAr ? 'رفض' : 'Reject'}
                          </button>
                        </>
                      )}
                      {v.status === 'active' && (
                        <>
                          <button
                            type="button"
                            onClick={() => triggerVehicleAction(v, 'maintenance')}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold cursor-pointer"
                          >
                            {isAr ? 'صيانة' : 'Maintenance'}
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerVehicleAction(v, 'suspend')}
                            className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold cursor-pointer"
                          >
                            {isAr ? 'إيقاف' : 'Suspend'}
                          </button>
                        </>
                      )}
                      {(v.status === 'maintenance' || v.status === 'suspended') && (
                        <button
                          type="button"
                          onClick={() => triggerVehicleAction(v, 'activate')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#00A046] border border-emerald-200 text-[11px] font-bold cursor-pointer"
                        >
                          {isAr ? 'تفعيل' : 'Activate'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setEditVehicleDocsTarget(v);
                          setEditDocsForm({
                            registrationExpiry: v.docsExpiry?.registrationExpiry || '',
                            insuranceExpiry: v.docsExpiry?.insuranceExpiry || '',
                            inspectionExpiry: v.docsExpiry?.inspectionExpiry || '',
                            reason: 'تحديث تواريخ انتهاء وثائق المركبة'
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E7EB] text-[11px] font-bold text-[#221F1F] hover:border-[#00A046] cursor-pointer"
                      >
                        {isAr ? 'تواريخ الوثائق' : 'Edit Docs'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 4: DRIVERS ================= */}
      {activeTab === 'drivers' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="text-xs text-[#797878] font-semibold">
                {isAr
                  ? 'سجل سائقي شبكة التوصيل (منصة أو شركاء) — منفصل كلياً عن سائقي فانات الموردين.'
                  : 'Platform & Partner delivery drivers — strictly separate from supplier van drivers.'}
              </p>
              <button
                type="button"
                onClick={() => setCreateDriverOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00A046] hover:bg-[#008a3c] text-white text-xs font-black cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة سائق منصة/شريك' : 'Add Network Driver'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div className="relative">
                <input
                  type="text"
                  value={driverSearch}
                  onChange={(e) => setDriverSearch(e.target.value)}
                  placeholder={isAr ? 'بحث بالاسم، الهاتف، اللوحة...' : 'Search name, phone, plate...'}
                  className="w-full rounded-xl border border-[#D1D5DB] bg-white ps-9 pe-3 py-2 text-xs font-semibold"
                />
                <Search className="w-3.5 h-3.5 text-[#797878] absolute start-3 top-2.5" />
              </div>
              <select
                value={driverProviderFilter}
                onChange={(e) => setDriverProviderFilter(e.target.value)}
                className="rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-xs font-semibold"
              >
                <option value="all">{isAr ? 'كل المزودين' : 'All Providers'}</option>
                <option value="platform">{isAr ? 'موظف منصة' : 'Platform Driver'}</option>
                <option value="partner">{isAr ? 'تابع لشريك' : 'Partner Driver'}</option>
              </select>
              <select
                value={driverGovFilter}
                onChange={(e) => setDriverGovFilter(e.target.value)}
                className="rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-xs font-semibold"
              >
                <option value="all">{isAr ? 'كل المحافظات' : 'All Governorates'}</option>
                {governorates.map((g) => (
                  <option key={g.id} value={g.id}>
                    {isAr ? g.nameAr : g.nameEn}
                  </option>
                ))}
              </select>
              <select
                value={driverStatusFilter}
                onChange={(e) => setDriverStatusFilter(e.target.value)}
                className="rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-xs font-semibold"
              >
                <option value="all">{isAr ? 'كل الحالات' : 'All Statuses'}</option>
                <option value="active">{isAr ? 'نشط' : 'Active'}</option>
                <option value="pending">{isAr ? 'معلق' : 'Pending'}</option>
                <option value="suspended">{isAr ? 'موقوف' : 'Suspended'}</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs">
            {driversLoading ? (
              <div className="py-10 text-center text-xs text-[#797878]">{t.loading}</div>
            ) : !driversData?.items?.length ? (
              <div className="py-10 text-center text-xs text-[#797878]">
                {isAr ? 'لا يوجد سائقون مطابقون' : 'No delivery drivers found'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {driversData.items.map((d: any) => (
                  <div
                    key={d.id}
                    className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-black text-[#221F1F]">{d.name}</div>
                        <div className="text-[11px] font-mono text-[#797878]">{d.phone}</div>
                      </div>
                      {renderStatusBadge(d.accountStatus)}
                    </div>
                    <div className="text-[11px] font-semibold text-[#4A4747] space-y-0.5">
                      <div>
                        {d.providerType === 'platform'
                          ? isAr
                            ? 'تابع للمنصة مباشرة'
                            : 'Platform Employee'
                          : `${isAr ? 'شريك:' : 'Partner:'} ${d.partnerName || d.partnerId}`}
                        {' • '}
                        {isAr ? d.governorateNameAr : d.governorateNameEn}
                      </div>
                      <div>
                        {isAr ? 'المركبة المرتبطة:' : 'Assigned Vehicle:'}{' '}
                        <span className="font-bold text-[#221F1F]">
                          {d.vehiclePlate ? `${d.vehiclePlate} (${d.vehicleMakeModel})` : isAr ? 'غير معينة' : 'Unassigned'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#E5E7EB]">
                      <button
                        type="button"
                        onClick={() => {
                          setAssignVehicleDriver(d);
                          setAssignVehicleId(d.assignedVehicleId || '');
                          setAssignVehicleReason('تحديث ربط المركبة للسائق');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E7EB] text-[11px] font-bold text-[#221F1F] hover:border-[#00A046] cursor-pointer"
                      >
                        {isAr ? 'ربط مركبة' : 'Assign Vehicle'}
                      </button>
                      {d.accountStatus === 'active' && (
                        <button
                          type="button"
                          onClick={() => triggerDriverAction(d, 'suspend')}
                          className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold cursor-pointer"
                        >
                          {isAr ? 'إيقاف' : 'Suspend'}
                        </button>
                      )}
                      {d.accountStatus !== 'active' && (
                        <button
                          type="button"
                          onClick={() => triggerDriverAction(d, 'reactivate')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#00A046] border border-emerald-200 text-[11px] font-bold cursor-pointer"
                        >
                          {isAr ? 'تفعيل' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 5: RATES & SETTINGS ================= */}
      {activeTab === 'rates' && (
        <div className="space-y-4">
          {/* Platform Settings Card */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-[#221F1F]">
                  {isAr ? 'إعدادات شبكة التوصيل العامة (قيم تجريبية قابلة للتعديل)' : 'Global Delivery Network Settings (Editable Demo Values)'}
                </h2>
                <p className="text-xs text-[#797878]">
                  {isAr
                    ? 'تحدد عتبة التوصيل المجاني قيمة الطلب التي تتحمل فيها المنصة رسوم التوصيل بدلاً من التاجر.'
                    : 'Orders at or above the free delivery threshold shift the delivery fee to platform subsidy.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSavePlatformSettings}
                className="px-3.5 py-2 rounded-xl bg-[#00A046] hover:bg-[#008a3c] text-white text-xs font-black cursor-pointer self-start sm:self-auto"
              >
                {isAr ? 'حفظ الإعدادات' : 'Save Settings'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#4A4747] mb-1">
                  {isAr ? 'عتبة التوصيل المجاني (د.ع)' : 'Free Delivery Threshold (IQD)'}
                </label>
                <input
                  type="number"
                  min={0}
                  value={settingsDraft.freeDeliveryThresholdIQD}
                  onChange={(e) =>
                    setSettingsDraft({
                      ...settingsDraft,
                      freeDeliveryThresholdIQD: Number(e.target.value) || 0
                    })
                  }
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2 text-xs font-bold tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#4A4747] mb-1">
                  {isAr ? 'عمولة الشركاء (%) — للمرحلة D3' : 'Partner Commission (%) — D3'}
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settingsDraft.partnerCommissionPercent}
                  onChange={(e) =>
                    setSettingsDraft({
                      ...settingsDraft,
                      partnerCommissionPercent: Number(e.target.value) || 0
                    })
                  }
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2 text-xs font-bold tabular-nums"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-[#221F1F] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsDraft.codAllowedForPartners}
                    onChange={(e) =>
                      setSettingsDraft({
                        ...settingsDraft,
                        codAllowedForPartners: e.target.checked
                      })
                    }
                    className="accent-[#00A046]"
                  />
                  <span>{isAr ? 'السماح بتحصيل النقد (COD) للشركاء' : 'Allow COD for Partners'}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Rate Rules Table / Cards */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-[#221F1F]">
                {isAr ? 'بطاقة أسعار التوصيل (أولوية: منطقة ← محافظة ← عام)' : 'Delivery Rate Card (Priority: Zone > Governorate > Default)'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setRateModalTarget('new');
                  setRateForm({
                    nameAr: '',
                    nameEn: '',
                    governorateId: 'gov_najaf',
                    deliveryZoneId: '',
                    vehicleClass: 'pickup',
                    baseFeeIQD: '7000',
                    perUnitFeeIQD: '350',
                    minFeeIQD: '8000',
                    refrigeratedSurchargeIQD: '0',
                    isActive: true
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#00A046] text-white text-xs font-black cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة قاعدة سعر' : 'Add Rate Rule'}</span>
              </button>
            </div>

            {ratesLoading ? (
              <div className="py-8 text-center text-xs text-[#797878]">{t.loading}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-[#797878]">
                      <th className="py-2 text-start font-bold">{isAr ? 'القاعدة / النطاق' : 'Rule / Scope'}</th>
                      <th className="py-2 text-start font-bold">{isAr ? 'فئة المركبة' : 'Vehicle Class'}</th>
                      <th className="py-2 text-end font-bold">{isAr ? 'أساسي' : 'Base'}</th>
                      <th className="py-2 text-end font-bold">{isAr ? 'لكل وحدة' : 'Per Unit'}</th>
                      <th className="py-2 text-end font-bold">{isAr ? 'حد أدنى' : 'Min Fee'}</th>
                      <th className="py-2 text-end font-bold">{isAr ? 'علاوة تبريد' : 'Cold Surcharge'}</th>
                      <th className="py-2 text-center font-bold">{isAr ? 'الحالة' : 'Status'}</th>
                      <th className="py-2 text-end font-bold">{isAr ? 'إجراء' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6] tabular-nums">
                    {rateRules.map((r) => (
                      <tr key={r.id} className="hover:bg-[#F9FAFB]">
                        <td className="py-2.5">
                          <div className="font-bold text-[#221F1F]">
                            {isAr ? r.nameAr : r.nameEn}
                          </div>
                          <div className="text-[11px] text-[#797878]">
                            {r.zoneNameAr
                              ? `${isAr ? r.governorateNameAr : r.governorateNameEn} ← ${
                                  isAr ? r.zoneNameAr : r.zoneNameEn
                                }`
                              : r.governorateNameAr
                              ? isAr
                                ? r.governorateNameAr
                                : r.governorateNameEn
                              : isAr
                              ? 'التعرفة العامة الافتراضية'
                              : 'Global Default'}
                          </div>
                        </td>
                        <td className="py-2.5 font-bold text-[#4A4747]">
                          {isAr
                            ? VEHICLE_CLASS_LABELS[r.vehicleClass as DeliveryVehicleClass]?.ar
                            : VEHICLE_CLASS_LABELS[r.vehicleClass as DeliveryVehicleClass]?.en}
                        </td>
                        <td className="py-2.5 text-end font-bold">
                          {formatCurrency(r.baseFeeIQD, currency, language)}
                        </td>
                        <td className="py-2.5 text-end font-bold">
                          {formatCurrency(r.perUnitFeeIQD, currency, language)}
                        </td>
                        <td className="py-2.5 text-end font-bold">
                          {formatCurrency(r.minFeeIQD, currency, language)}
                        </td>
                        <td className="py-2.5 text-end font-bold text-sky-700">
                          {formatCurrency(r.refrigeratedSurchargeIQD, currency, language)}
                        </td>
                        <td className="py-2.5 text-center">
                          {renderStatusBadge(r.isActive ? 'active' : 'suspended')}
                        </td>
                        <td className="py-2.5 text-end">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setRateModalTarget(r);
                                setRateForm({
                                  nameAr: r.nameAr,
                                  nameEn: r.nameEn,
                                  governorateId: r.scope?.governorateId || '',
                                  deliveryZoneId: r.scope?.deliveryZoneId || '',
                                  vehicleClass: r.vehicleClass,
                                  baseFeeIQD: String(r.baseFeeIQD),
                                  perUnitFeeIQD: String(r.perUnitFeeIQD),
                                  minFeeIQD: String(r.minFeeIQD),
                                  refrigeratedSurchargeIQD: String(r.refrigeratedSurchargeIQD),
                                  isActive: r.isActive
                                });
                              }}
                              className="px-2 py-1 rounded-lg border border-[#E5E7EB] bg-white text-[11px] font-bold cursor-pointer"
                            >
                              {isAr ? 'تعديل' : 'Edit'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleRateRule(r)}
                              className="px-2 py-1 rounded-lg border border-[#E5E7EB] bg-white text-[11px] font-bold cursor-pointer"
                            >
                              {r.isActive ? (isAr ? 'تعطيل' : 'Disable') : isAr ? 'تفعيل' : 'Enable'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 6: SUPPLIER DELIVERY SETTINGS ================= */}
      {activeTab === 'suppliers' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 shadow-xs space-y-3">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#221F1F]">
              {isAr ? 'إعدادات التوصيل لكل مورد' : 'Per-Supplier Delivery Options'}
            </h2>
            <p className="text-xs text-[#797878]">
              {isAr
                ? 'حدّد لكل مورد ما إذا كان يمتلك أسطولاً خاصاً أم يعتمد على شبكة المنصة أم يتيح الاستلام من المستودع (خيار واحد على الأقل إلزامي).'
                : 'Configure own-fleet, Platform Delivery Network, or warehouse pickup per supplier (at least one option required).'}
            </p>
          </div>
          {suppliersLoading ? (
            <div className="py-8 text-center text-xs text-[#797878]">{t.loading}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {supplierDeliveryList.map((row) => {
                const ds = row.deliverySettings || {};
                const noneEnabled =
                  !ds.hasOwnFleet && !ds.allowPlatformDelivery && !ds.allowStorePickup;
                return (
                  <div
                    key={row.supplierId}
                    className={`p-3.5 rounded-xl border space-y-2.5 ${
                      noneEnabled ? 'border-red-300 bg-red-50/40' : 'border-[#E5E7EB] bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-black text-[#221F1F]">{row.companyName}</div>
                        <div className="text-[11px] text-[#797878]">{row.city}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenSupplierModal(row)}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#00A046] text-[11px] font-bold text-[#221F1F] cursor-pointer"
                      >
                        {isAr ? 'تعديل الإعدادات' : 'Configure'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
                      <span
                        className={`px-2 py-0.5 rounded-md border ${
                          ds.hasOwnFleet
                            ? 'bg-emerald-50 text-[#00A046] border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}
                      >
                        {isAr ? 'أسطول خاص:' : 'Own Fleet:'}{' '}
                        {ds.hasOwnFleet ? (isAr ? 'نعم' : 'Yes') : isAr ? 'لا' : 'No'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md border ${
                          ds.allowPlatformDelivery
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}
                      >
                        {isAr ? 'شبكة المنصة:' : 'Platform:'}{' '}
                        {ds.allowPlatformDelivery ? (isAr ? 'مفعّل' : 'On') : isAr ? 'معطّل' : 'Off'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md border ${
                          ds.allowStorePickup
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}
                      >
                        {isAr ? 'استلام مباشر:' : 'Pickup:'}{' '}
                        {ds.allowStorePickup ? (isAr ? 'متاح' : 'On') : isAr ? 'معطّل' : 'Off'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 7: FEE SIMULATOR ================= */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <form
            onSubmit={runFeeSimulator}
            className="lg:col-span-5 bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 shadow-xs space-y-3"
          >
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#00A046]" />
              <h2 className="text-sm sm:text-base font-extrabold text-[#221F1F]">
                {isAr ? 'محاكي رسوم التوصيل والمركبة' : 'Delivery Fee & Fleet Simulator'}
              </h2>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#4A4747] mb-1">
                {isAr ? 'المورد' : 'Supplier'}
              </label>
              <select
                value={simForm.supplierId}
                onChange={(e) => setSimForm({ ...simForm, supplierId: e.target.value })}
                className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2 text-xs font-semibold"
              >
                <option value="">{isAr ? 'حساب عام بدون مورد محدد' : 'Generic Quote (No Supplier)'}</option>
                {supplierDeliveryList.map((s) => (
                  <option key={s.supplierId} value={s.supplierId}>
                    {s.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#4A4747] mb-1">
                  {isAr ? 'المحافظة' : 'Governorate'}
                </label>
                <select
                  value={simForm.governorateId}
                  onChange={(e) => {
                    const nextGov = governorates.find((g) => g.id === e.target.value);
                    setSimForm({
                      ...simForm,
                      governorateId: e.target.value,
                      deliveryZoneId: nextGov?.deliveryZones?.[0]?.id || ''
                    });
                  }}
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2 text-xs font-semibold"
                >
                  {governorates.map((g) => (
                    <option key={g.id} value={g.id}>
                      {isAr ? g.nameAr : g.nameEn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#4A4747] mb-1">
                  {isAr ? 'منطقة التوصيل' : 'Delivery Zone'}
                </label>
                <select
                  value={simForm.deliveryZoneId}
                  onChange={(e) => setSimForm({ ...simForm, deliveryZoneId: e.target.value })}
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2 text-xs font-semibold"
                >
                  {simZones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {isAr ? z.nameAr : z.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#4A4747] mb-1">
                  {isAr ? 'عدد الوحدات (كراتين)' : 'Units'}
                </label>
                <input
                  type="number"
                  min={1}
                  value={simForm.units}
                  onChange={(e) => setSimForm({ ...simForm, units: e.target.value })}
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2 text-xs font-bold tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#4A4747] mb-1">
                  {isAr ? 'متطلب التبريد' : 'Temperature'}
                </label>
                <select
                  value={simForm.requiredTemperature}
                  onChange={(e) =>
                    setSimForm({
                      ...simForm,
                      requiredTemperature: e.target.value as VehicleTemperatureType
                    })
                  }
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2 text-xs font-semibold"
                >
                  <option value="ambient">{isAr ? 'عادي / جاف' : 'Ambient'}</option>
                  <option value="chilled">{isAr ? 'مبرد (Chilled)' : 'Chilled'}</option>
                  <option value="frozen">{isAr ? 'مجمد (Frozen)' : 'Frozen'}</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#4A4747] mb-1">
                  {isAr ? 'قيمة الطلب (د.ع)' : 'Order Value (IQD)'}
                </label>
                <input
                  type="number"
                  min={0}
                  value={simForm.orderValueIQD}
                  onChange={(e) => setSimForm({ ...simForm, orderValueIQD: e.target.value })}
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2 text-xs font-bold tabular-nums"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={simLoading}
              className="w-full py-2.5 rounded-xl bg-[#00A046] hover:bg-[#008a3c] text-white text-xs font-black cursor-pointer disabled:opacity-60"
            >
              {simLoading ? t.loading : isAr ? 'احسب الرسوم وخيارات التوصيل' : 'Simulate Fee & Options'}
            </button>
          </form>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-extrabold text-[#221F1F]">
              {isAr ? 'نتيجة المحاكاة والتفصيل' : 'Simulation Result & Breakdown'}
            </h3>
            {simError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                {simError}
              </div>
            )}
            {!simResult ? (
              <p className="text-xs text-[#797878] py-8 text-center">
                {isAr
                  ? 'أدخل المعطيات واضغط احسب لعرض الرسم المفصل وخيارات المورد المتاحة.'
                  : 'Submit parameters to inspect calculated fee breakdown and delivery options.'}
              </p>
            ) : (
              <div className="space-y-3">
                {simResult.supplierEvaluation && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-extrabold text-[#797878]">
                      {isAr ? 'خيارات التوصيل المتاحة لهذا المورد:' : 'Supplier Delivery Options:'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {simResult.supplierEvaluation.options.map((opt: any) => (
                        <div
                          key={opt.option}
                          className={`p-2.5 rounded-xl border text-xs ${
                            opt.available
                              ? 'border-emerald-200 bg-emerald-50/50'
                              : 'border-gray-200 bg-gray-50 opacity-75'
                          }`}
                        >
                          <div className="font-black text-[#221F1F]">
                            {isAr ? opt.labelAr : opt.labelEn}
                          </div>
                          <div className="text-[11px] mt-0.5 font-bold">
                            {opt.available ? (
                              <span className="text-[#00A046]">
                                {opt.option === 'platform'
                                  ? formatCurrency(opt.feeIQD, currency, language)
                                  : isAr
                                  ? 'متاح'
                                  : 'Available'}
                              </span>
                            ) : (
                              <span className="text-red-700">
                                {isAr ? opt.unavailableReasonAr : opt.unavailableReasonEn}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {simResult.quote ? (
                  <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB]">
                      <div>
                        <div className="font-black text-[#221F1F]">
                          {isAr ? 'فئة المركبة المقترحة:' : 'Suggested Vehicle Class:'}{' '}
                          <span className="text-[#00A046]">
                            {isAr
                              ? VEHICLE_CLASS_LABELS[
                                  simResult.quote.vehicleClass as DeliveryVehicleClass
                                ]?.ar
                              : VEHICLE_CLASS_LABELS[
                                  simResult.quote.vehicleClass as DeliveryVehicleClass
                                ]?.en}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#797878]">
                          {isAr
                            ? simResult.quote.breakdown.selectionReasonAr
                            : simResult.quote.breakdown.selectionReasonEn}
                        </div>
                      </div>
                      <div className="text-end tabular-nums">
                        <div className="text-[10px] text-[#797878]">
                          {isAr ? 'الرسم على التاجر' : 'Merchant Fee'}
                        </div>
                        <div className="text-lg font-black text-[#00A046]">
                          {formatCurrency(simResult.quote.feeIQD, currency, language)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 tabular-nums text-[11px]">
                      <div>
                        <span className="text-[#797878]">{isAr ? 'القاعدة:' : 'Matched Rule:'}</span>{' '}
                        <span className="font-bold">
                          {isAr
                            ? simResult.quote.breakdown.matchedRuleNameAr
                            : simResult.quote.breakdown.matchedRuleNameEn}{' '}
                          ({simResult.quote.breakdown.matchedScopeLevel})
                        </span>
                      </div>
                      <div>
                        <span className="text-[#797878]">{isAr ? 'الرسم الأساسي:' : 'Base Fee:'}</span>{' '}
                        <span className="font-bold">
                          {formatCurrency(simResult.quote.breakdown.baseFeeIQD, currency, language)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#797878]">{isAr ? 'رسوم الوحدات:' : 'Units Fee:'}</span>{' '}
                        <span className="font-bold">
                          {formatCurrency(simResult.quote.breakdown.unitsFeeIQD, currency, language)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#797878]">{isAr ? 'الحد الأدنى:' : 'Min Fee:'}</span>{' '}
                        <span className="font-bold">
                          {formatCurrency(simResult.quote.breakdown.minFeeIQD, currency, language)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#797878]">{isAr ? 'علاوة التبريد:' : 'Cold Surcharge:'}</span>{' '}
                        <span className="font-bold text-sky-700">
                          {formatCurrency(
                            simResult.quote.breakdown.refrigeratedSurchargeIQD,
                            currency,
                            language
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#797878]">{isAr ? 'دعم المنصة:' : 'Platform Subsidy:'}</span>{' '}
                        <span className="font-bold text-[#00A046]">
                          {formatCurrency(
                            simResult.quote.platformSubsidyIQD,
                            currency,
                            language
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-red-700 font-bold">
                    {isAr
                      ? 'لا توجد قاعدة تسعير مطابقة لهذه المنطقة وفئة المركبة.'
                      : 'No matching active rate rule found.'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= PARTNER DETAIL DRAWER ================= */}
      {selectedPartnerId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
          <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl p-4 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
              <div>
                <div className="text-[11px] font-mono text-[#797878]">
                  {partnerDetail?.partner?.registrationCode}
                </div>
                <h2 className="text-base sm:text-lg font-black text-[#221F1F]">
                  {partnerDetail?.partner?.name || t.loading}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPartnerId(null)}
                className="p-1.5 rounded-lg border border-[#E5E7EB] text-[#4A4747] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {partnerDetailLoading || !partnerDetail ? (
              <div className="py-12 text-center text-xs text-[#797878]">{t.loading}</div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB]">
                  <div className="flex items-center gap-2">
                    {renderStatusBadge(partnerDetail.partner.accountStatus)}
                    <span className="text-xs font-bold text-[#4A4747]">
                      {partnerDetail.partner.phone}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {partnerDetail.partner.accountStatus === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => triggerPartnerAction(partnerDetail.partner, 'approve')}
                          className="px-3 py-1.5 rounded-lg bg-[#00A046] text-white text-xs font-bold cursor-pointer"
                        >
                          {isAr ? 'اعتماد الشريك' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerPartnerAction(partnerDetail.partner, 'reject')}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold cursor-pointer"
                        >
                          {isAr ? 'رفض' : 'Reject'}
                        </button>
                      </>
                    )}
                    {partnerDetail.partner.accountStatus === 'active' && (
                      <button
                        type="button"
                        onClick={() => triggerPartnerAction(partnerDetail.partner, 'suspend')}
                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-bold cursor-pointer"
                      >
                        {isAr ? 'إيقاف' : 'Suspend'}
                      </button>
                    )}
                    {(partnerDetail.partner.accountStatus === 'suspended' ||
                      partnerDetail.partner.accountStatus === 'archived') && (
                      <button
                        type="button"
                        onClick={() => triggerPartnerAction(partnerDetail.partner, 'reactivate')}
                        className="px-3 py-1.5 rounded-lg bg-[#00A046] text-white text-xs font-bold cursor-pointer"
                      >
                        {isAr ? 'إعادة تفعيل' : 'Reactivate'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Drawer Tabs */}
                <div className="flex items-center gap-1.5 border-b border-[#E5E7EB] pb-2">
                  {(
                    [
                      { id: 'overview', ar: 'نظرة والمركبات', en: 'Overview & Fleet' },
                      { id: 'kyc', ar: 'التوثيق (KYC)', en: 'KYC Checklist' },
                      { id: 'notes', ar: 'ملاحظات', en: 'Notes' },
                      { id: 'audit', ar: 'سجل التدقيق', en: 'Audit' }
                    ] as const
                  ).map((dt) => (
                    <button
                      key={dt.id}
                      type="button"
                      onClick={() => setPartnerDetailTab(dt.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        partnerDetailTab === dt.id
                          ? 'bg-[#00A046] text-white'
                          : 'bg-[#F9FAFB] text-[#4A4747]'
                      }`}
                    >
                      {isAr ? dt.ar : dt.en}
                    </button>
                  ))}
                </div>

                {partnerDetailTab === 'overview' && (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                      <div>
                        <span className="text-[#797878]">{isAr ? 'المحافظة:' : 'Governorate:'}</span>{' '}
                        <span className="font-bold">
                          {isAr
                            ? partnerDetail.partner.governorateNameAr
                            : partnerDetail.partner.governorateNameEn}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#797878]">{isAr ? 'الدفع:' : 'Payout:'}</span>{' '}
                        <span className="font-bold">
                          {partnerDetail.partner.payoutAccount?.method || 'cash'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[#797878]">{isAr ? 'المناطق:' : 'Zones:'}</span>{' '}
                        <span className="font-bold">
                          {(partnerDetail.partner.serviceZones || [])
                            .map((z: any) => (isAr ? z.nameAr : z.nameEn))
                            .join('، ')}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-extrabold text-[#221F1F]">
                        {isAr ? 'المركبات المسجلة' : 'Registered Vehicles'} ({partnerDetail.vehicles.length})
                      </h4>
                      {partnerDetail.vehicles.map((v: any) => (
                        <div
                          key={v.id}
                          className="p-2.5 rounded-xl border border-[#E5E7EB] flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="font-black text-[#221F1F]">{v.plateNumber}</div>
                            <div className="text-[11px] text-[#797878]">
                              {v.makeModel} • {v.capacityUnits} {isAr ? 'وحدة' : 'units'}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {renderStatusBadge(v.status)}
                            {v.status === 'pending' && (
                              <button
                                type="button"
                                onClick={() => triggerVehicleAction(v, 'approve')}
                                className="px-2 py-1 rounded-lg bg-[#00A046] text-white text-[11px] font-bold cursor-pointer"
                              >
                                {isAr ? 'تفعيل' : 'Approve'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-extrabold text-[#221F1F]">
                        {isAr ? 'السائقون المرتبطون' : 'Linked Drivers'} ({partnerDetail.drivers.length})
                      </h4>
                      {partnerDetail.drivers.length === 0 ? (
                        <p className="text-[#797878]">
                          {isAr ? 'لا يوجد سائقون مرتبطون بعد.' : 'No drivers linked yet.'}
                        </p>
                      ) : (
                        partnerDetail.drivers.map((d: any) => (
                          <div
                            key={d.id}
                            className="p-2.5 rounded-xl border border-[#E5E7EB] flex items-center justify-between gap-2"
                          >
                            <div>
                              <div className="font-black text-[#221F1F]">{d.name}</div>
                              <div className="text-[11px] text-[#797878]">{d.phone}</div>
                            </div>
                            {renderStatusBadge(d.accountStatus)}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {partnerDetailTab === 'kyc' && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-[#4A4747] mb-1">
                        {isAr ? 'رقم الرخصة / السجل' : 'License / Registration No.'}
                      </label>
                      <input
                        type="text"
                        value={kycForm.licenseNo || ''}
                        onChange={(e) => setKycForm({ ...kycForm, licenseNo: e.target.value })}
                        className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      {kycForm.checklist.map((item, idx) => (
                        <div
                          key={item.key}
                          className="p-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between gap-2"
                        >
                          <div className="font-bold text-[#221F1F]">
                            {isAr
                              ? KYC_LABELS[item.key]?.ar || item.key
                              : KYC_LABELS[item.key]?.en || item.key}
                          </div>
                          <select
                            value={item.status}
                            onChange={(e) => {
                              const next = [...kycForm.checklist];
                              next[idx] = {
                                ...item,
                                status: e.target.value as KycChecklistItemStatus
                              };
                              setKycForm({ ...kycForm, checklist: next });
                            }}
                            className="rounded-lg border border-[#D1D5DB] bg-white px-2 py-1 text-xs font-bold"
                          >
                            <option value="pending">{isAr ? 'قيد المراجعة' : 'Pending'}</option>
                            <option value="approved">{isAr ? 'مقبول' : 'Approved'}</option>
                            <option value="rejected">{isAr ? 'مرفوض' : 'Rejected'}</option>
                          </select>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={kycSaving}
                      onClick={handleSavePartnerKyc}
                      className="px-4 py-2 rounded-xl bg-[#00A046] text-white text-xs font-black cursor-pointer"
                    >
                      {kycSaving ? t.loading : isAr ? 'حفظ حالة التوثيق' : 'Save KYC Checklist'}
                    </button>
                  </div>
                )}

                {partnerDetailTab === 'notes' && (
                  <div className="space-y-3 text-xs">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder={isAr ? 'أضف ملاحظة إدارية داخلية...' : 'Add internal admin note...'}
                        className="flex-1 rounded-xl border border-[#D1D5DB] px-3 py-2 text-xs"
                      />
                      <button
                        type="button"
                        disabled={noteSaving || noteText.trim().length < 3}
                        onClick={handleAddPartnerNote}
                        className="px-3.5 py-2 rounded-xl bg-[#00A046] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                      >
                        {isAr ? 'إضافة' : 'Add'}
                      </button>
                    </div>
                    {(partnerDetail.partner.adminNotes || []).map((n: AdminInternalNote) => (
                      <div key={n.id} className="p-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                        <div className="font-bold text-[#221F1F]">{n.text}</div>
                        <div className="text-[10px] text-[#797878] mt-1">
                          {n.author} • {new Date(n.at).toLocaleString(isAr ? 'ar-IQ' : 'en-US')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {partnerDetailTab === 'audit' && (
                  <div className="space-y-2 text-xs">
                    {(partnerDetail.auditLogs || []).map((log: any) => (
                      <div key={log.id} className="p-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                        <div className="font-bold text-[#221F1F]">
                          {isAr ? log.summaryAr : log.summaryEn || log.summaryAr}
                        </div>
                        <div className="text-[10px] text-[#797878] mt-0.5">
                          {log.action} • {log.reason || '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= CREATE VEHICLE MODAL ================= */}
      {createVehicleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleCreateVehicleSubmit}
            className="w-full max-w-lg bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#221F1F]">
                {isAr ? 'إضافة مركبة توصيل جديدة' : 'Create Delivery Vehicle'}
              </h3>
              <button type="button" onClick={() => setCreateVehicleOpen(false)} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="block font-bold mb-1">{isAr ? 'الملكية' : 'Owner Type'}</label>
                <select
                  value={newVehicleForm.ownerType}
                  onChange={(e) =>
                    setNewVehicleForm({
                      ...newVehicleForm,
                      ownerType: e.target.value as DeliveryProviderType
                    })
                  }
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
                >
                  <option value="platform">{isAr ? 'ملك المنصة' : 'Platform Owned'}</option>
                  <option value="partner">{isAr ? 'ملك شريك توصيل' : 'Partner Owned'}</option>
                </select>
              </div>
              {newVehicleForm.ownerType === 'partner' && (
                <div>
                  <label className="block font-bold mb-1">{isAr ? 'الشريك' : 'Partner'}</label>
                  <select
                    required
                    value={newVehicleForm.partnerId}
                    onChange={(e) =>
                      setNewVehicleForm({ ...newVehicleForm, partnerId: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
                  >
                    <option value="">{isAr ? 'اختر الشريك' : 'Select Partner'}</option>
                    {(partnersData?.items || []).map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block font-bold mb-1">{isAr ? 'رقم اللوحة' : 'Plate Number'}</label>
                <input
                  type="text"
                  required
                  value={newVehicleForm.plateNumber}
                  onChange={(e) =>
                    setNewVehicleForm({ ...newVehicleForm, plateNumber: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">{isAr ? 'الفئة' : 'Vehicle Class'}</label>
                <select
                  value={newVehicleForm.vehicleClass}
                  onChange={(e) =>
                    setNewVehicleForm({
                      ...newVehicleForm,
                      vehicleClass: e.target.value as DeliveryVehicleClass
                    })
                  }
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
                >
                  {VEHICLE_CLASS_ORDER.map((vc) => (
                    <option key={vc} value={vc}>
                      {isAr ? VEHICLE_CLASS_LABELS[vc].ar : VEHICLE_CLASS_LABELS[vc].en}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">{isAr ? 'الموديل' : 'Make & Model'}</label>
                <input
                  type="text"
                  required
                  value={newVehicleForm.makeModel}
                  onChange={(e) =>
                    setNewVehicleForm({ ...newVehicleForm, makeModel: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">{isAr ? 'السعة (وحدة)' : 'Capacity (Units)'}</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newVehicleForm.capacityUnits}
                  onChange={(e) =>
                    setNewVehicleForm({ ...newVehicleForm, capacityUnits: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
                />
              </div>
            </div>
            <div className="text-xs">
              <label className="block font-bold mb-1">{isAr ? 'السبب الإداري (>= 5 أحرف)' : 'Audit Reason'}</label>
              <input
                type="text"
                required
                minLength={5}
                value={newVehicleForm.reason}
                onChange={(e) => setNewVehicleForm({ ...newVehicleForm, reason: e.target.value })}
                className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreateVehicleOpen(false)}
                className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-bold cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#00A046] text-white text-xs font-black cursor-pointer"
              >
                {t.save}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= EDIT VEHICLE DOCS MODAL ================= */}
      {editVehicleDocsTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSaveVehicleDocs}
            className="w-full max-w-md bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black">
                {isAr ? `وثائق المركبة: ${editVehicleDocsTarget.plateNumber}` : `Vehicle Docs: ${editVehicleDocsTarget.plateNumber}`}
              </h3>
              <button type="button" onClick={() => setEditVehicleDocsTarget(null)} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block font-bold mb-1">{isAr ? 'انتهاء السنوية' : 'Registration Expiry'}</label>
              <input
                type="date"
                value={editDocsForm.registrationExpiry}
                onChange={(e) => setEditDocsForm({ ...editDocsForm, registrationExpiry: e.target.value })}
                className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">{isAr ? 'انتهاء التأمين' : 'Insurance Expiry'}</label>
              <input
                type="date"
                value={editDocsForm.insuranceExpiry}
                onChange={(e) => setEditDocsForm({ ...editDocsForm, insuranceExpiry: e.target.value })}
                className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">{isAr ? 'انتهاء الفحص' : 'Inspection Expiry'}</label>
              <input
                type="date"
                value={editDocsForm.inspectionExpiry}
                onChange={(e) => setEditDocsForm({ ...editDocsForm, inspectionExpiry: e.target.value })}
                className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">{isAr ? 'السبب' : 'Reason'}</label>
              <input
                type="text"
                required
                minLength={5}
                value={editDocsForm.reason}
                onChange={(e) => setEditDocsForm({ ...editDocsForm, reason: e.target.value })}
                className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditVehicleDocsTarget(null)}
                className="px-3 py-2 rounded-xl border border-[#E5E7EB] font-bold cursor-pointer"
              >
                {t.cancel}
              </button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#00A046] text-white font-black cursor-pointer">
                {t.save}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= CREATE DRIVER MODAL ================= */}
      {createDriverOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleCreateDriverSubmit}
            className="w-full max-w-lg bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3 shadow-2xl text-xs max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black">
                {isAr ? 'إضافة سائق شبكة التوصيل' : 'Add Network Delivery Driver'}
              </h3>
              <button type="button" onClick={() => setCreateDriverOpen(false)} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold mb-1">{isAr ? 'التبعية' : 'Provider'}</label>
                <select
                  value={newDriverForm.providerType}
                  onChange={(e) =>
                    setNewDriverForm({
                      ...newDriverForm,
                      providerType: e.target.value as DeliveryProviderType
                    })
                  }
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
                >
                  <option value="platform">{isAr ? 'سائق موظف لدى المنصة' : 'Platform Driver'}</option>
                  <option value="partner">{isAr ? 'سائق لدى شريك توصيل' : 'Partner Driver'}</option>
                </select>
              </div>
              {newDriverForm.providerType === 'partner' && (
                <div>
                  <label className="block font-bold mb-1">{isAr ? 'الشريك النشط' : 'Active Partner'}</label>
                  <select
                    required
                    value={newDriverForm.partnerId}
                    onChange={(e) =>
                      setNewDriverForm({ ...newDriverForm, partnerId: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
                  >
                    <option value="">{isAr ? 'اختر الشريك' : 'Select Partner'}</option>
                    {activePartnersList.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block font-bold mb-1">{isAr ? 'اسم السائق' : 'Driver Name'}</label>
                <input
                  type="text"
                  required
                  value={newDriverForm.name}
                  onChange={(e) => setNewDriverForm({ ...newDriverForm, name: e.target.value })}
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">{isAr ? 'رقم الهاتف' : 'Phone'}</label>
                <input
                  type="text"
                  required
                  value={newDriverForm.phone}
                  onChange={(e) => setNewDriverForm({ ...newDriverForm, phone: e.target.value })}
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">{isAr ? 'المحافظة' : 'Governorate'}</label>
                <select
                  value={newDriverForm.governorateId}
                  onChange={(e) => {
                    const nextGov = governorates.find((g) => g.id === e.target.value);
                    setNewDriverForm({
                      ...newDriverForm,
                      governorateId: e.target.value,
                      serviceZoneIds: nextGov?.deliveryZones?.[0]
                        ? [nextGov.deliveryZones[0].id]
                        : []
                    });
                  }}
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
                >
                  {governorates.map((g) => (
                    <option key={g.id} value={g.id}>
                      {isAr ? g.nameAr : g.nameEn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">{isAr ? 'المركبة (اختياري)' : 'Assigned Vehicle'}</label>
                <select
                  value={newDriverForm.assignedVehicleId}
                  onChange={(e) =>
                    setNewDriverForm({ ...newDriverForm, assignedVehicleId: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
                >
                  <option value="">{isAr ? 'بدون تعيين حالياً' : 'None'}</option>
                  {activeVehiclesList.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} ({v.makeModel})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block font-bold mb-1">{isAr ? 'مناطق التغطية' : 'Service Zones'}</label>
              <div className="flex flex-wrap gap-2">
                {driverZonesForNew.map((z) => {
                  const checked = newDriverForm.serviceZoneIds.includes(z.id);
                  return (
                    <label key={z.id} className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked
                            ? newDriverForm.serviceZoneIds.filter((x) => x !== z.id)
                            : [...newDriverForm.serviceZoneIds, z.id];
                          setNewDriverForm({ ...newDriverForm, serviceZoneIds: next });
                        }}
                        className="accent-[#00A046]"
                      />
                      <span>{isAr ? z.nameAr : z.nameEn}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block font-bold mb-1">{isAr ? 'السبب الإداري' : 'Audit Reason'}</label>
              <input
                type="text"
                required
                minLength={5}
                value={newDriverForm.reason}
                onChange={(e) => setNewDriverForm({ ...newDriverForm, reason: e.target.value })}
                className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreateDriverOpen(false)}
                className="px-3 py-2 rounded-xl border border-[#E5E7EB] font-bold cursor-pointer"
              >
                {t.cancel}
              </button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#00A046] text-white font-black cursor-pointer">
                {t.save}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= ASSIGN VEHICLE MODAL ================= */}
      {assignVehicleDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleAssignVehicleSubmit}
            className="w-full max-w-md bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black">
                {isAr ? `ربط مركبة للسائق: ${assignVehicleDriver.name}` : `Assign Vehicle: ${assignVehicleDriver.name}`}
              </h3>
              <button type="button" onClick={() => setAssignVehicleDriver(null)} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block font-bold mb-1">{isAr ? 'المركبة النشطة' : 'Active Vehicle'}</label>
              <select
                value={assignVehicleId}
                onChange={(e) => setAssignVehicleId(e.target.value)}
                className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
              >
                <option value="">{isAr ? 'إلغاء ربط المركبة' : 'Unassign'}</option>
                {activeVehiclesList.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.plateNumber} — {v.makeModel}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold mb-1">{isAr ? 'السبب' : 'Reason'}</label>
              <input
                type="text"
                required
                minLength={5}
                value={assignVehicleReason}
                onChange={(e) => setAssignVehicleReason(e.target.value)}
                className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssignVehicleDriver(null)}
                className="px-3 py-2 rounded-xl border border-[#E5E7EB] font-bold cursor-pointer"
              >
                {t.cancel}
              </button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#00A046] text-white font-black cursor-pointer">
                {t.save}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= RATE RULE MODAL ================= */}
      {rateModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSaveRateRuleModal}
            className="w-full max-w-lg bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black">
                {rateModalTarget === 'new'
                  ? isAr
                    ? 'إضافة قاعدة تسعير'
                    : 'Create Rate Rule'
                  : isAr
                  ? 'تعديل قاعدة تسعير'
                  : 'Edit Rate Rule'}
              </h3>
              <button type="button" onClick={() => setRateModalTarget(null)} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold mb-1">{isAr ? 'الاسم بالعربية' : 'Arabic Name'}</label>
                <input
                  type="text"
                  required
                  value={rateForm.nameAr}
                  onChange={(e) => setRateForm({ ...rateForm, nameAr: e.target.value })}
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">{isAr ? 'فئة المركبة' : 'Vehicle Class'}</label>
                <select
                  value={rateForm.vehicleClass}
                  onChange={(e) =>
                    setRateForm({ ...rateForm, vehicleClass: e.target.value as DeliveryVehicleClass })
                  }
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
                >
                  {VEHICLE_CLASS_ORDER.map((vc) => (
                    <option key={vc} value={vc}>
                      {isAr ? VEHICLE_CLASS_LABELS[vc].ar : VEHICLE_CLASS_LABELS[vc].en}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">{isAr ? 'المحافظة (اختياري)' : 'Governorate'}</label>
                <select
                  value={rateForm.governorateId}
                  onChange={(e) =>
                    setRateForm({
                      ...rateForm,
                      governorateId: e.target.value,
                      deliveryZoneId: ''
                    })
                  }
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2"
                >
                  <option value="">{isAr ? 'قاعدة عامة لجميع المحافظات' : 'Global Default'}</option>
                  {governorates.map((g) => (
                    <option key={g.id} value={g.id}>
                      {isAr ? g.nameAr : g.nameEn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">{isAr ? 'المنطقة (اختياري)' : 'Zone'}</label>
                <select
                  value={rateForm.deliveryZoneId}
                  onChange={(e) => setRateForm({ ...rateForm, deliveryZoneId: e.target.value })}
                  disabled={!rateForm.governorateId}
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2 disabled:opacity-50"
                >
                  <option value="">{isAr ? 'على مستوى المحافظة' : 'Entire Governorate'}</option>
                  {rateZones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {isAr ? z.nameAr : z.nameEn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">{isAr ? 'الرسم الأساسي (د.ع)' : 'Base Fee'}</label>
                <input
                  type="number"
                  min={0}
                  value={rateForm.baseFeeIQD}
                  onChange={(e) => setRateForm({ ...rateForm, baseFeeIQD: e.target.value })}
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2 tabular-nums"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">{isAr ? 'لكل وحدة (د.ع)' : 'Per Unit Fee'}</label>
                <input
                  type="number"
                  min={0}
                  value={rateForm.perUnitFeeIQD}
                  onChange={(e) => setRateForm({ ...rateForm, perUnitFeeIQD: e.target.value })}
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2 tabular-nums"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">{isAr ? 'الحد الأدنى للرسم' : 'Min Fee'}</label>
                <input
                  type="number"
                  min={0}
                  value={rateForm.minFeeIQD}
                  onChange={(e) => setRateForm({ ...rateForm, minFeeIQD: e.target.value })}
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2 tabular-nums"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">{isAr ? 'علاوة التبريد' : 'Cold Surcharge'}</label>
                <input
                  type="number"
                  min={0}
                  value={rateForm.refrigeratedSurchargeIQD}
                  onChange={(e) =>
                    setRateForm({ ...rateForm, refrigeratedSurchargeIQD: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2 tabular-nums"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRateModalTarget(null)}
                className="px-3 py-2 rounded-xl border border-[#E5E7EB] font-bold cursor-pointer"
              >
                {t.cancel}
              </button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#00A046] text-white font-black cursor-pointer">
                {isAr ? 'متابعة للتأكيد' : 'Continue'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= EDIT SUPPLIER DELIVERY MODAL ================= */}
      {editingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSaveSupplierSettings}
            className="w-full max-w-md bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black">
                {isAr
                  ? `إعدادات توصيل: ${editingSupplier.companyName}`
                  : `Delivery Options: ${editingSupplier.companyName}`}
              </h3>
              <button type="button" onClick={() => setEditingSupplier(null)} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={supplierForm.hasOwnFleet}
                  onChange={(e) => {
                    setSupplierFormValidationError(null);
                    setSupplierForm({ ...supplierForm, hasOwnFleet: e.target.checked });
                  }}
                  className="accent-[#00A046]"
                />
                <span>{isAr ? 'يمتلك أسطول توصيل خاص (hasOwnFleet)' : 'Has Own Fleet'}</span>
              </label>
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={supplierForm.allowPlatformDelivery}
                  onChange={(e) => {
                    setSupplierFormValidationError(null);
                    setSupplierForm({ ...supplierForm, allowPlatformDelivery: e.target.checked });
                  }}
                  className="accent-[#00A046]"
                />
                <span>{isAr ? 'يسمح بالتوصيل عبر شبكة المنصة' : 'Allow Platform Delivery'}</span>
              </label>
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={supplierForm.allowStorePickup}
                  onChange={(e) => {
                    setSupplierFormValidationError(null);
                    setSupplierForm({ ...supplierForm, allowStorePickup: e.target.checked });
                  }}
                  className="accent-[#00A046]"
                />
                <span>{isAr ? 'يتيح الاستلام من المستودع' : 'Allow Store Pickup'}</span>
              </label>
            </div>

            {supplierFormValidationError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold">
                {supplierFormValidationError}
              </div>
            )}

            <div>
              <label className="block font-bold mb-1">
                {isAr
                  ? 'عتبة توصيل مجاني خاصة بالمورد (اختياري — يترك فارغاً للافتراضي)'
                  : 'Supplier Free Delivery Override (Optional)'}
              </label>
              <input
                type="number"
                min={0}
                value={supplierForm.freeThresholdInput}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, freeThresholdInput: e.target.value })
                }
                placeholder={isAr ? 'اتركه فارغاً للافتراضي' : 'Leave blank for global default'}
                className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2 tabular-nums"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingSupplier(null)}
                className="px-3 py-2 rounded-xl border border-[#E5E7EB] font-bold cursor-pointer"
              >
                {t.cancel}
              </button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#00A046] text-white font-black cursor-pointer">
                {isAr ? 'متابعة للتأكيد' : 'Continue'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= CONFIRM WITH REASON DIALOG ================= */}
      <ConfirmWithReasonDialog
        isOpen={Boolean(confirmState)}
        title={confirmState?.title || ''}
        description={confirmState?.description || ''}
        danger={confirmState?.danger}
        confirmLabel={confirmState?.confirmLabel}
        loading={confirmLoading}
        serverError={confirmError}
        language={language}
        onCancel={() => {
          if (!confirmLoading) setConfirmState(null);
        }}
        onConfirm={handleConfirmExecute}
      />
    </div>
  );
};
