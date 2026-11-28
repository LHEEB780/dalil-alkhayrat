import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Package,
  Wallet,
  UserCircle2,
  LogIn,
  LogOut,
  RefreshCw,
  MapPin,
  Phone,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Globe,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Snowflake,
  Boxes,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  Language,
  Currency,
  DeliveryJobFailureReasonCode,
  DeliveryJobStatus
} from '../types/index.ts';
import { translations } from '../utils/translations.ts';
import { formatCurrency } from '../utils/format.ts';

interface DeliveryPartnerPortalViewProps {
  language: Language;
  currency: Currency;
  onLanguageChange: (lang: Language) => void;
  onLogout: () => void;
}

type PortalTab = 'available' | 'mine' | 'earnings' | 'account';

interface PortalJob {
  id: string;
  subOrderId: string;
  parentOrderId: string;
  supplierId: string;
  storeId: string;
  governorateId: string;
  governorateNameAr: string;
  governorateNameEn: string;
  deliveryZoneId?: string;
  zoneNameAr?: string;
  zoneNameEn?: string;
  status: DeliveryJobStatus;
  pickup: {
    name: string;
    address: string;
    city: string;
    phone?: string;
    lat?: number;
    lng?: number;
  };
  dropoff: {
    name: string;
    address: string;
    city: string;
    phone?: string;
    lat?: number;
    lng?: number;
  };
  requiredTemperature: 'ambient' | 'chilled' | 'frozen';
  totalUnits: number;
  estimatedWeightKg: number;
  orderSubtotalIQD: number;
  estimatedPayoutIQD: number;
  paymentMethod: 'credit' | 'cod';
  attempts: number;
  assignedPartnerId?: string;
  assignedDriverId?: string;
  assignedVehicleId?: string;
  assignedPartnerName?: string | null;
  assignedDriverName?: string | null;
  assignedVehiclePlate?: string | null;
  subOrderStatus?: string | null;
  itemsSummary?: Array<{
    productNameAr: string;
    productNameEn?: string;
    quantity: number;
    unitPriceIQD: number;
  }>;
  failure?: {
    reasonCode: DeliveryJobFailureReasonCode;
    note: string;
    failedAt: string;
    failedBy: string;
  };
  history: Array<{
    status: string;
    at: string;
    actorType: string;
    actorName: string;
    note?: string;
  }>;
  createdAt: string;
  deliveredAt?: string;
  minutesOpen?: number;
  isStaleOpen?: boolean;
  canAccept?: boolean;
  eligibleDriverIds?: string[];
  eligibleVehicleIds?: string[];
  ineligibilityReasons?: string[];
}

interface PortalMeData {
  mode: 'partner' | 'platform_driver';
  partner: any | null;
  driver: any | null;
  drivers: any[];
  vehicles: any[];
  codAllowedForPartners: boolean;
  maxActiveJobsPerDriver: number;
}

interface PortalEarningsData {
  totalDeliveredCount: number;
  totalEstimatedPayoutIQD: number;
  todayPayoutIQD: number;
  cashOnHandIQD: number;
  commissionPercent: number;
  codAllowedForPartners: boolean;
  recentJobs: Array<{
    id: string;
    subOrderId: string;
    pickupName: string;
    dropoffName: string;
    dropoffCity: string;
    estimatedPayoutIQD: number;
    paymentMethod: 'credit' | 'cod';
    orderSubtotalIQD: number;
    deliveredAt?: string;
  }>;
}

const FAILURE_REASONS: Array<{
  code: DeliveryJobFailureReasonCode;
  ar: string;
  en: string;
}> = [
  { code: 'store_closed', ar: 'المتجر مغلق حالياً', en: 'Store closed' },
  { code: 'customer_refused', ar: 'رفض التاجر استلام الطلبية', en: 'Store refused delivery' },
  { code: 'address_not_found', ar: 'تعذر العثور على العنوان', en: 'Address not found' },
  { code: 'vehicle_issue', ar: 'عطل طارئ في المركبة', en: 'Vehicle breakdown' },
  { code: 'other', ar: 'سبب آخر', en: 'Other reason' }
];

const JOB_STATUS_LABELS: Record<DeliveryJobStatus, { ar: string; en: string; color: string }> = {
  open: { ar: 'متاحة للقبول', en: 'Open', color: 'bg-sky-50 text-sky-800 border-sky-200' },
  assigned: { ar: 'مسندة من الإدارة', en: 'Assigned', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  accepted: { ar: 'مقبولة - توجه للمستودع', en: 'Accepted', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  at_pickup: { ar: 'في مستودع المورد', en: 'At Warehouse', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  picked_up: { ar: 'تم استلام الشحنة', en: 'Picked Up', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  in_transit: { ar: 'قيد التوصيل للمتجر', en: 'In Transit', color: 'bg-emerald-50 text-[#00A046] border-emerald-200' },
  at_dropoff: { ar: 'عند موقع المتجر', en: 'At Store', color: 'bg-teal-50 text-teal-800 border-teal-200' },
  delivered: { ar: 'مكتملة التسليم', en: 'Delivered', color: 'bg-emerald-100 text-[#0B5D32] border-emerald-300' },
  failed: { ar: 'تعذر التوصيل', en: 'Failed', color: 'bg-red-50 text-red-700 border-red-200' },
  cancelled: { ar: 'ملغاة', en: 'Cancelled', color: 'bg-gray-100 text-gray-600 border-gray-200' }
};

const ACTIVE_JOB_STATUSES: DeliveryJobStatus[] = [
  'assigned',
  'accepted',
  'at_pickup',
  'picked_up',
  'in_transit',
  'at_dropoff'
];

export const DeliveryPartnerPortalView: React.FC<DeliveryPartnerPortalViewProps> = ({
  language,
  currency,
  onLanguageChange,
  onLogout
}) => {
  const isAr = language === 'ar';
  const t = translations[language];
  const BackArrow = isAr ? ArrowRight : ArrowLeft;

  // Authentication strictly held in React memory (never persisted to localStorage)
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState('+964 780 100 2001');
  const [codeInput, setCodeInput] = useState('DP-100101');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Portal state
  const [activeTab, setActiveTab] = useState<PortalTab>('available');
  const [meData, setMeData] = useState<PortalMeData | null>(null);
  const [availableJobs, setAvailableJobs] = useState<PortalJob[]>([]);
  const [myJobs, setMyJobs] = useState<PortalJob[]>([]);
  const [earnings, setEarnings] = useState<PortalEarningsData | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Driver / vehicle selection per job
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedAcceptDriverByJob, setSelectedAcceptDriverByJob] = useState<Record<string, string>>({});
  const [selectedAcceptVehicleByJob, setSelectedAcceptVehicleByJob] = useState<Record<string, string>>({});
  const [pinInputs, setPinInputs] = useState<Record<string, string>>({});
  const [expandedJobIds, setExpandedJobIds] = useState<Record<string, boolean>>({});
  const [mineFilter, setMineFilter] = useState<'active' | 'history'>('active');

  // Failure modal state
  const [failingJob, setFailingJob] = useState<PortalJob | null>(null);
  const [failReasonCode, setFailReasonCode] = useState<DeliveryJobFailureReasonCode>('store_closed');
  const [failNote, setFailNote] = useState('');

  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 5000);
  }, []);

  const portalFetch = useCallback(
    async (path: string, init?: RequestInit) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(init?.headers as Record<string, string> | undefined)
      };
      if (sessionToken) {
        headers['x-delivery-session'] = sessionToken;
      }
      const res = await fetch(`/api/delivery/portal${path}`, {
        ...init,
        headers
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || (isAr ? 'تعذر تنفيذ الطلب' : 'Request failed'));
      }
      return json;
    },
    [sessionToken, isAr]
  );

  const loadAllPortalData = useCallback(async () => {
    if (!sessionToken) return;
    setLoadingData(true);
    try {
      const [meRes, availRes, mineRes, earnRes] = await Promise.all([
        portalFetch('/me'),
        portalFetch('/jobs/available'),
        portalFetch('/jobs/mine'),
        portalFetch('/earnings')
      ]);
      setMeData(meRes.data);
      setAvailableJobs(availRes.data || []);
      setMyJobs(mineRes.data || []);
      setEarnings(earnRes.data || null);

      const drvList = meRes.data?.drivers || [];
      if (drvList.length > 0) {
        setSelectedDriverId((prev) =>
          prev && drvList.some((d: any) => d.id === prev) ? prev : drvList[0].id
        );
      }
    } catch (err: any) {
      showToast('error', err?.message || (isAr ? 'تعذر تحديث بيانات البوابة' : 'Failed to refresh'));
    } finally {
      setLoadingData(false);
    }
  }, [sessionToken, portalFetch, showToast, isAr]);

  useEffect(() => {
    if (sessionToken) {
      loadAllPortalData();
    }
  }, [sessionToken, loadAllPortalData]);

  const submitLogin = async (phone: string, registrationCode: string) => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/delivery/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, registrationCode })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success || !json?.data?.sessionToken) {
        setLoginError(
          json?.message || (isAr ? 'بيانات الدخول غير صحيحة أو الحساب غير مفعل' : 'Invalid login credentials')
        );
        return;
      }
      setSessionToken(json.data.sessionToken);
      setMeData(json.data);
      const drvList = json.data?.drivers || [];
      if (drvList.length > 0) {
        setSelectedDriverId(drvList[0].id);
      }
      setActiveTab('available');
    } catch {
      setLoginError(isAr ? 'تعذر الاتصال بالخادم' : 'Unable to reach server');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLoginForm = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitLogin(phoneInput, codeInput);
  };

  const handleToggleAvailability = async () => {
    const drv = meData?.drivers.find((d) => d.id === selectedDriverId) || meData?.drivers[0];
    if (!drv) return;
    const nextAvail = drv.availability === 'offline' ? 'online' : 'offline';
    setActionBusyId('availability');
    try {
      const res = await portalFetch('/availability', {
        method: 'POST',
        body: JSON.stringify({ driverId: drv.id, availability: nextAvail })
      });
      showToast('success', res.message);
      await loadAllPortalData();
    } catch (err: any) {
      showToast('error', err?.message || 'Error');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleAcceptJob = async (job: PortalJob) => {
    setActionBusyId(job.id);
    try {
      const chosenDriverId =
        selectedAcceptDriverByJob[job.id] ||
        (job.eligibleDriverIds && job.eligibleDriverIds[0]) ||
        selectedDriverId ||
        meData?.drivers[0]?.id;
      const chosenDriver = meData?.drivers.find((d) => d.id === chosenDriverId);
      const chosenVehicleId =
        selectedAcceptVehicleByJob[job.id] ||
        chosenDriver?.assignedVehicleId ||
        (job.eligibleVehicleIds && job.eligibleVehicleIds[0]);

      const res = await portalFetch(`/jobs/${job.id}/accept`, {
        method: 'POST',
        body: JSON.stringify({
          driverId: chosenDriverId,
          vehicleId: chosenVehicleId
        })
      });
      showToast('success', res.message || (isAr ? 'تم قبول المهمة' : 'Job accepted'));
      await loadAllPortalData();
      setActiveTab('mine');
      setMineFilter('active');
    } catch (err: any) {
      showToast('error', err?.message || (isAr ? 'تعذر قبول المهمة' : 'Failed to accept job'));
    } finally {
      setActionBusyId(null);
    }
  };

  const handleJobStep = async (
    job: PortalJob,
    step: 'arrived-pickup' | 'pickup' | 'start' | 'arrived-dropoff' | 'deliver',
    payload?: Record<string, string>
  ) => {
    setActionBusyId(job.id);
    try {
      const res = await portalFetch(`/jobs/${job.id}/${step}`, {
        method: 'POST',
        body: JSON.stringify(payload || {})
      });
      showToast('success', res.message);
      if (step === 'pickup' || step === 'deliver') {
        setPinInputs((prev) => ({ ...prev, [job.id]: '' }));
      }
      await loadAllPortalData();
    } catch (err: any) {
      showToast('error', err?.message || 'Error');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleConfirmFail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!failingJob) return;
    if (failNote.trim().length < 3) {
      showToast(
        'error',
        isAr ? 'يرجى كتابة ملاحظة توضيحية (3 أحرف على الأقل)' : 'Please enter a short note (min 3 chars)'
      );
      return;
    }
    setActionBusyId(failingJob.id);
    try {
      const res = await portalFetch(`/jobs/${failingJob.id}/fail`, {
        method: 'POST',
        body: JSON.stringify({ reasonCode: failReasonCode, note: failNote.trim() })
      });
      showToast('success', res.message);
      setFailingJob(null);
      setFailNote('');
      await loadAllPortalData();
    } catch (err: any) {
      showToast('error', err?.message || 'Error');
    } finally {
      setActionBusyId(null);
    }
  };

  const buildMapsUrl = (job: PortalJob) => {
    const origin =
      job.pickup.lat && job.pickup.lng
        ? `${job.pickup.lat},${job.pickup.lng}`
        : `${job.pickup.address}, ${job.pickup.city}, Iraq`;
    const dest =
      job.dropoff.lat && job.dropoff.lng
        ? `${job.dropoff.lat},${job.dropoff.lng}`
        : `${job.dropoff.address}, ${job.dropoff.city}, Iraq`;
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}`;
  };

  const tempLabel = (temp: 'ambient' | 'chilled' | 'frozen') => {
    if (temp === 'chilled') return isAr ? 'مبردة (Chilled)' : 'Chilled';
    if (temp === 'frozen') return isAr ? 'مجمدة (Frozen)' : 'Frozen';
    return isAr ? 'اعتيادية (Ambient)' : 'Ambient';
  };

  // ================= LOGIN VIEW =================
  if (!sessionToken || !meData) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] font-brand flex flex-col justify-between p-4 sm:p-6">
        <div className="max-w-lg w-full mx-auto space-y-5 pt-2">
          {/* Top controls */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1F2328] bg-white border border-[#E5E7EB] px-3 py-2 rounded-xl hover:bg-gray-50 cursor-pointer min-h-[40px]"
            >
              <BackArrow className="w-4 h-4 text-[#00A046]" />
              <span>{t.partnerRegBackBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => onLanguageChange(isAr ? 'en' : 'ar')}
              className="inline-flex items-center gap-1.5 text-xs font-black text-[#1F2328] bg-white border border-[#E5E7EB] px-3 py-2 rounded-xl hover:bg-gray-50 cursor-pointer min-h-[40px]"
            >
              <Globe className="w-4 h-4 text-[#00A046]" />
              <span>{isAr ? 'English' : 'عربي'}</span>
            </button>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl border border-[#E5E7EB] p-5 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6 text-[#00A046]" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-[#1F2328]">{t.partnerPortalTitle}</h1>
                <p className="text-xs text-[#6B7280] mt-0.5">{t.partnerPortalSubtitle}</p>
              </div>
            </div>

            {loginError && (
              <div
                data-testid="partner-portal-login-error"
                className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginForm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1F2328] mb-1.5">
                  {isAr ? 'رقم الهاتف المسجل' : 'Registered Phone Number'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+964 780 100 2001"
                    data-testid="partner-portal-phone-input"
                    className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl px-3.5 py-3 pr-9 text-sm font-mono text-[#1F2328] focus:bg-white focus:border-[#00A046] focus:outline-hidden"
                  />
                  <Phone className="w-4 h-4 text-gray-400 absolute right-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2328] mb-1.5">
                  {isAr
                    ? 'رمز تسجيل الشريك أو رخصة سائق المنصة'
                    : 'Partner Registration Code / Driver License'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="DP-100101"
                    data-testid="partner-portal-code-input"
                    className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl px-3.5 py-3 pr-9 text-sm font-mono uppercase text-[#1F2328] focus:bg-white focus:border-[#00A046] focus:outline-hidden"
                  />
                  <KeyRound className="w-4 h-4 text-gray-400 absolute right-3 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                data-testid="partner-portal-login-submit"
                className="w-full min-h-[46px] rounded-xl bg-[#00A046] hover:bg-[#008A3C] text-white font-black text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
              >
                <LogIn className="w-4 h-4" />
                <span>
                  {loginLoading
                    ? isAr
                      ? 'جارٍ تسجيل الدخول...'
                      : 'Signing in...'
                    : isAr
                    ? 'دخول لبوابة التوصيل'
                    : 'Sign In to Portal'}
                </span>
              </button>
            </form>

            {/* Quick demo helper accounts */}
            <div className="pt-4 border-t border-[#E5E7EB] space-y-2.5">
              <div className="text-[11px] font-black text-[#6B7280] uppercase">
                {isAr ? 'حسابات تجريبية جاهزة للدخول الفوري:' : 'Quick Demo Accounts:'}
              </div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  {
                    labelAr: 'شركة الفرات للنقل (شريك نجف نشط)',
                    labelEn: 'Al-Furat Logistics (Active Najaf Partner)',
                    phone: '+964 780 100 2001',
                    code: 'DP-100101',
                    testId: 'demo-partner-furat'
                  },
                  {
                    labelAr: 'حيدر الجبوري (ناقل فردي - كربلاء)',
                    labelEn: 'Haider Al-Jubouri (Karbala Individual)',
                    phone: '+964 781 200 3002',
                    code: 'DP-100102',
                    testId: 'demo-partner-haider'
                  },
                  {
                    labelAr: 'حسين علي النجفي (سائق أسطول المنصة - مبرد)',
                    labelEn: 'Platform Fleet Driver (Najaf Refrigerated)',
                    phone: '+964 780 911 0001',
                    code: 'PLT-NJF-1101',
                    testId: 'demo-platform-driver'
                  }
                ].map((demo) => (
                  <button
                    key={demo.code}
                    type="button"
                    data-testid={demo.testId}
                    onClick={() => {
                      setPhoneInput(demo.phone);
                      setCodeInput(demo.code);
                      submitLogin(demo.phone, demo.code);
                    }}
                    className="w-full text-start px-3.5 py-2.5 rounded-xl bg-[#F7F8FA] hover:bg-emerald-50 border border-[#E5E7EB] hover:border-emerald-300 transition flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-black text-[#1F2328]">
                        {isAr ? demo.labelAr : demo.labelEn}
                      </div>
                      <div className="text-[11px] font-mono text-[#6B7280] mt-0.5">
                        {demo.phone} • {demo.code}
                      </div>
                    </div>
                    <LogIn className="w-4 h-4 text-[#00A046] shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <footer className="text-center text-[11px] text-[#6B7280] pt-4">
          {isAr ? 'شبكة توصيل دليل الخيرات العراق' : 'Dalil Al-Khairat Iraq Delivery Network'}
        </footer>
      </div>
    );
  }

  const currentDriver =
    meData.drivers.find((d) => d.id === selectedDriverId) || meData.drivers[0] || meData.driver;
  const isOnline = currentDriver?.availability !== 'offline';
  const activeJobs = myJobs.filter((j) => ACTIVE_JOB_STATUSES.includes(j.status));
  const historyJobs = myJobs.filter((j) => !ACTIVE_JOB_STATUSES.includes(j.status));
  const displayedMineJobs = mineFilter === 'active' ? activeJobs : historyJobs;

  const accountTitle =
    meData.mode === 'partner'
      ? meData.partner?.name
      : meData.driver?.name || (isAr ? 'سائق المنصة' : 'Platform Driver');

  return (
    <div
      className="min-h-screen bg-[#F7F8FA] font-brand flex flex-col pb-20 md:pb-8"
      data-testid="delivery-partner-portal"
    >
      {/* Top Compact Sticky Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB] shadow-2xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#00A046] text-white flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-black text-[#1F2328] truncate">
                {accountTitle}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                <span className="truncate">
                  {meData.mode === 'partner'
                    ? meData.partner?.registrationCode
                    : meData.driver?.licenseNo}
                </span>
                <span>•</span>
                <span className="font-bold text-[#0B5D32]">
                  {meData.mode === 'partner'
                    ? isAr
                      ? 'شريك توصيل'
                      : 'Partner'
                    : isAr
                    ? 'سائق منصة'
                    : 'Platform Driver'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Driver availability toggle */}
            {currentDriver && (
              <button
                type="button"
                disabled={actionBusyId === 'availability'}
                onClick={handleToggleAvailability}
                data-testid="partner-availability-toggle"
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black border flex items-center gap-1.5 cursor-pointer transition min-h-[36px] ${
                  isOnline
                    ? 'bg-emerald-50 text-[#0B5D32] border-emerald-300'
                    : 'bg-gray-100 text-gray-600 border-gray-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#00A046]' : 'bg-gray-400'}`}
                />
                <span className="hidden sm:inline">
                  {isOnline ? t.partnerPortalOnline : t.partnerPortalOffline}
                </span>
                <span className="sm:hidden">{isOnline ? (isAr ? 'متاح' : 'On') : (isAr ? 'متوقف' : 'Off')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={loadAllPortalData}
              disabled={loadingData}
              title={isAr ? 'تحديث' : 'Refresh'}
              className="p-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-gray-50 text-[#1F2328] cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin text-[#00A046]' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => onLanguageChange(isAr ? 'en' : 'ar')}
              className="px-2.5 py-1.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-gray-50 text-[11px] font-black text-[#1F2328] cursor-pointer min-h-[36px]"
            >
              {isAr ? 'EN' : 'ع'}
            </button>

            <button
              type="button"
              onClick={() => {
                setSessionToken(null);
                setMeData(null);
                onLogout();
              }}
              data-testid="partner-portal-logout-btn"
              title={t.partnerPortalLogoutBtn}
              className="p-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop Tab Bar */}
        <div className="hidden md:block border-t border-[#E5E7EB] bg-[#F8FAFC]">
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-between py-2 gap-4">
            <nav className="flex items-center gap-2">
              {[
                {
                  id: 'available' as PortalTab,
                  label: t.partnerPortalTabAvailable,
                  count: availableJobs.length,
                  icon: Package
                },
                {
                  id: 'mine' as PortalTab,
                  label: t.partnerPortalTabMine,
                  count: activeJobs.length,
                  icon: Truck
                },
                {
                  id: 'earnings' as PortalTab,
                  label: t.partnerPortalTabEarnings,
                  icon: Wallet
                },
                {
                  id: 'account' as PortalTab,
                  label: t.partnerPortalTabAccount,
                  icon: UserCircle2
                }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                      active
                        ? 'bg-[#00A046] text-white shadow-2xs'
                        : 'text-[#1F2328] hover:bg-white border border-transparent hover:border-[#E5E7EB]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {typeof tab.count === 'number' && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                          active ? 'bg-white/20 text-white' : 'bg-emerald-100 text-[#0B5D32]'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {meData.drivers.length > 1 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#6B7280] font-bold">
                  {isAr ? 'السائق النشط:' : 'Active Driver:'}
                </span>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-xs font-bold"
                >
                  {meData.drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.availability === 'offline' ? (isAr ? 'متوقف' : 'Off') : isAr ? 'متاح' : 'On'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 space-y-4">
        {toast && (
          <div
            data-testid="partner-portal-toast"
            className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-[#0B5D32]'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <span>{toast.text}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-current opacity-70 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Driver Switcher on mobile if company partner has > 1 driver */}
        {meData.drivers.length > 1 && (
          <div className="md:hidden bg-white rounded-2xl border border-[#E5E7EB] p-3 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#6B7280]">
              {isAr ? 'تحديد السائق:' : 'Driver:'}
            </span>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="flex-1 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl px-2.5 py-2 text-xs font-bold"
            >
              {meData.drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ================= TAB 1: AVAILABLE JOBS ================= */}
        {activeTab === 'available' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-black text-[#1F2328]">
                {t.partnerPortalTabAvailable} ({availableJobs.length})
              </h2>
              <span className="text-[11px] text-[#6B7280] font-bold">
                {isAr ? 'مفلترة حسب مناطق التغطية' : 'Filtered by coverage zones'}
              </span>
            </div>

            {availableJobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center space-y-2">
                <Package className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-sm font-black text-[#1F2328]">
                  {isAr ? 'لا توجد مهام متاحة حالياً في نطاقك' : 'No open jobs in your coverage zones right now'}
                </p>
                <p className="text-xs text-[#6B7280]">
                  {isAr
                    ? 'تأكد من تفعيل حالة التوفر وستظهر هنا الطلبات المفتوحة فور اعتمادها.'
                    : 'Keep your availability online to receive newly approved platform orders.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {availableJobs.map((job) => {
                  const chosenDrvId =
                    selectedAcceptDriverByJob[job.id] ||
                    (job.eligibleDriverIds && job.eligibleDriverIds[0]) ||
                    selectedDriverId;
                  const chosenVehId =
                    selectedAcceptVehicleByJob[job.id] ||
                    meData.drivers.find((d) => d.id === chosenDrvId)?.assignedVehicleId ||
                    (job.eligibleVehicleIds && job.eligibleVehicleIds[0]) ||
                    '';

                  return (
                    <div
                      key={job.id}
                      data-testid={`portal-available-job-${job.id}`}
                      className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-2xs space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-mono font-black text-[#1F2328]">
                                {job.id}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#0B5D32] border border-emerald-200">
                                {isAr ? job.zoneNameAr || job.governorateNameAr : job.zoneNameEn || job.governorateNameEn}
                              </span>
                              {job.paymentMethod === 'cod' ? (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                  {isAr ? 'تحصيل كاش COD' : 'COD'}
                                </span>
                              ) : (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                  {isAr ? 'طلب آجل (بدون تحصيل)' : 'Credit (No Cash)'}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#6B7280] mt-1 font-mono">
                              {isAr ? 'الطلب:' : 'Order:'} {job.subOrderId}
                            </div>
                          </div>

                          <div className="text-end shrink-0">
                            <div className="text-[10px] text-[#6B7280] font-bold">
                              {isAr ? 'عائد التوصيل المقدر' : 'Est. Payout'}
                            </div>
                            <div className="text-sm font-black text-[#00A046]">
                              {formatCurrency(job.estimatedPayoutIQD, currency, language)}
                            </div>
                          </div>
                        </div>

                        {/* Route summary */}
                        <div className="bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] p-3 space-y-2 text-xs">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[#6B7280] font-bold">
                                {isAr ? 'من المستودع: ' : 'Pickup: '}
                              </span>
                              <span className="font-black text-[#1F2328]">{job.pickup.name}</span>
                              <div className="text-[11px] text-[#6B7280]">
                                {job.pickup.city} — {job.pickup.address}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 pt-1.5 border-t border-dashed border-[#E5E7EB]">
                            <MapPin className="w-3.5 h-3.5 text-[#00A046] shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[#6B7280] font-bold">
                                {isAr ? 'إلى المتجر: ' : 'Dropoff: '}
                              </span>
                              <span className="font-black text-[#1F2328]">{job.dropoff.name}</span>
                              <div className="text-[11px] text-[#6B7280]">
                                {job.dropoff.city} — {job.dropoff.address}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Specs strip */}
                        <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                          <div className="bg-[#F7F8FA] rounded-xl p-2 border border-[#E5E7EB]">
                            <div className="text-[#6B7280] flex items-center justify-center gap-1">
                              <Boxes className="w-3 h-3" />
                              <span>{isAr ? 'الوحدات' : 'Units'}</span>
                            </div>
                            <div className="font-black text-[#1F2328] mt-0.5">{job.totalUnits}</div>
                          </div>
                          <div className="bg-[#F7F8FA] rounded-xl p-2 border border-[#E5E7EB]">
                            <div className="text-[#6B7280] flex items-center justify-center gap-1">
                              <Snowflake className="w-3 h-3" />
                              <span>{isAr ? 'الحفظ' : 'Temp'}</span>
                            </div>
                            <div className="font-black text-[#1F2328] mt-0.5 truncate">
                              {tempLabel(job.requiredTemperature)}
                            </div>
                          </div>
                          <div className="bg-[#F7F8FA] rounded-xl p-2 border border-[#E5E7EB]">
                            <div className="text-[#6B7280]">{isAr ? 'قيمة الطلب' : 'Order Total'}</div>
                            <div className="font-black text-[#1F2328] mt-0.5">
                              {formatCurrency(job.orderSubtotalIQD, currency, language)}
                            </div>
                          </div>
                        </div>

                        {/* Select driver / vehicle if company partner */}
                        {meData.mode === 'partner' && meData.drivers.length > 1 && job.canAccept && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <select
                              value={chosenDrvId}
                              onChange={(e) =>
                                setSelectedAcceptDriverByJob((prev) => ({
                                  ...prev,
                                  [job.id]: e.target.value
                                }))
                              }
                              className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl px-2.5 py-2 font-bold"
                            >
                              {meData.drivers.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                            <select
                              value={chosenVehId}
                              onChange={(e) =>
                                setSelectedAcceptVehicleByJob((prev) => ({
                                  ...prev,
                                  [job.id]: e.target.value
                                }))
                              }
                              className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl px-2.5 py-2 font-bold"
                            >
                              {meData.vehicles.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.plateNumber} ({v.capacityUnits} {isAr ? 'وحدة' : 'u'})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {!job.canAccept && job.ineligibilityReasons && job.ineligibilityReasons.length > 0 && (
                          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold space-y-0.5">
                            {job.ineligibilityReasons.map((r, i) => (
                              <div key={i}>• {r}</div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-[#E5E7EB]">
                        <a
                          href={buildMapsUrl(job)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[44px] px-3 rounded-xl border border-[#E5E7EB] bg-white hover:bg-gray-50 text-xs font-bold text-[#1F2328] flex items-center justify-center gap-1.5"
                        >
                          <Navigation className="w-4 h-4 text-blue-600" />
                          <span>{isAr ? 'الخريطة' : 'Map'}</span>
                        </a>
                        <button
                          type="button"
                          disabled={!job.canAccept || actionBusyId === job.id}
                          onClick={() => handleAcceptJob(job)}
                          data-testid={`portal-accept-job-${job.id}`}
                          className="flex-1 min-h-[44px] rounded-xl bg-[#00A046] hover:bg-[#008A3C] disabled:bg-gray-200 disabled:text-gray-500 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {actionBusyId === job.id
                              ? isAr
                                ? 'جارٍ القبول...'
                                : 'Accepting...'
                              : t.partnerPortalAcceptBtn}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: MY JOBS ================= */}
        {activeTab === 'mine' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-[#1F2328]">
                {t.partnerPortalTabMine}
              </h2>
              <div className="flex bg-white border border-[#E5E7EB] rounded-xl p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setMineFilter('active')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition ${
                    mineFilter === 'active' ? 'bg-[#00A046] text-white' : 'text-[#6B7280]'
                  }`}
                >
                  {isAr ? `النشطة (${activeJobs.length})` : `Active (${activeJobs.length})`}
                </button>
                <button
                  type="button"
                  onClick={() => setMineFilter('history')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition ${
                    mineFilter === 'history' ? 'bg-[#00A046] text-white' : 'text-[#6B7280]'
                  }`}
                >
                  {isAr ? `السجل (${historyJobs.length})` : `History (${historyJobs.length})`}
                </button>
              </div>
            </div>

            {displayedMineJobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center space-y-2">
                <Truck className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-sm font-black text-[#1F2328]">
                  {mineFilter === 'active'
                    ? isAr
                      ? 'لا توجد مهام نشطة حالياً'
                      : 'No active jobs currently assigned'
                    : isAr
                    ? 'لا توجد مهام مكتملة أو فاشلة في السجل'
                    : 'No completed or failed jobs in history'}
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {displayedMineJobs.map((job) => {
                  const statusMeta = JOB_STATUS_LABELS[job.status] || JOB_STATUS_LABELS.accepted;
                  const pinValue = pinInputs[job.id] || '';
                  const isActive = ACTIVE_JOB_STATUSES.includes(job.status);
                  const isExpanded = !!expandedJobIds[job.id];

                  return (
                    <div
                      key={job.id}
                      data-testid={`portal-my-job-${job.id}`}
                      className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-2xs space-y-3.5"
                    >
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-mono font-black text-[#1F2328]">
                              {job.id}
                            </span>
                            <span
                              className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${statusMeta.color}`}
                            >
                              {isAr ? statusMeta.ar : statusMeta.en}
                            </span>
                            {job.paymentMethod === 'cod' && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                {isAr
                                  ? `تحصيل كاش: ${formatCurrency(job.orderSubtotalIQD, currency, language)}`
                                  : `Collect COD: ${formatCurrency(job.orderSubtotalIQD, currency, language)}`}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#6B7280] mt-1">
                            {isAr ? 'الطلب:' : 'Order:'}{' '}
                            <span className="font-mono font-bold text-[#1F2328]">
                              {job.subOrderId}
                            </span>
                            {job.assignedDriverName && (
                              <>
                                {' • '}
                                <span>{job.assignedDriverName}</span>
                              </>
                            )}
                            {job.assignedVehiclePlate && (
                              <>
                                {' • '}
                                <span className="font-mono">{job.assignedVehiclePlate}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-end">
                          <div className="text-[10px] text-[#6B7280] font-bold">
                            {isAr ? 'العائد' : 'Payout'}
                          </div>
                          <div className="text-sm font-black text-[#00A046]">
                            {formatCurrency(job.estimatedPayoutIQD, currency, language)}
                          </div>
                        </div>
                      </div>

                      {/* Route Details + Direct Call / Maps */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                        <div className="bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] p-3 flex items-start justify-between gap-2">
                          <div>
                            <div className="text-[10px] font-black text-blue-700 uppercase">
                              {isAr ? '1. نقطة الاستلام (المورد)' : '1. Pickup Warehouse'}
                            </div>
                            <div className="font-black text-[#1F2328] mt-0.5">{job.pickup.name}</div>
                            <div className="text-[11px] text-[#6B7280]">
                              {job.pickup.city} — {job.pickup.address}
                            </div>
                          </div>
                          {job.pickup.phone && (
                            <a
                              href={`tel:${job.pickup.phone}`}
                              className="p-2 rounded-xl bg-white border border-[#E5E7EB] text-blue-600 hover:bg-blue-50 shrink-0"
                              title={job.pickup.phone}
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}
                        </div>

                        <div className="bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] p-3 flex items-start justify-between gap-2">
                          <div>
                            <div className="text-[10px] font-black text-[#00A046] uppercase">
                              {isAr ? '2. نقطة التسليم (المتجر)' : '2. Dropoff Store'}
                            </div>
                            <div className="font-black text-[#1F2328] mt-0.5">{job.dropoff.name}</div>
                            <div className="text-[11px] text-[#6B7280]">
                              {job.dropoff.city} — {job.dropoff.address}
                            </div>
                          </div>
                          {job.dropoff.phone && (
                            <a
                              href={`tel:${job.dropoff.phone}`}
                              className="p-2 rounded-xl bg-white border border-[#E5E7EB] text-[#00A046] hover:bg-emerald-50 shrink-0"
                              title={job.dropoff.phone}
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Failure Notice if failed */}
                      {job.status === 'failed' && job.failure && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
                          <div className="font-black flex items-center gap-1.5">
                            <XCircle className="w-4 h-4 shrink-0" />
                            <span>
                              {isAr ? 'سبب تعذر التوصيل:' : 'Failure Reason:'}{' '}
                              {FAILURE_REASONS.find((r) => r.code === job.failure?.reasonCode)?.[
                                isAr ? 'ar' : 'en'
                              ] || job.failure.reasonCode}
                            </span>
                          </div>
                          <p className="text-[11px]">{job.failure.note}</p>
                        </div>
                      )}

                      {/* Active Execution Controls */}
                      {isActive && (
                        <div className="pt-2 border-t border-[#E5E7EB] space-y-2.5">
                          {(job.status === 'assigned' || job.status === 'accepted') && (
                            <button
                              type="button"
                              disabled={actionBusyId === job.id}
                              onClick={() => handleJobStep(job, 'arrived-pickup')}
                              data-testid={`portal-step-arrived-pickup-${job.id}`}
                              className="w-full min-h-[46px] rounded-xl bg-[#00A046] hover:bg-[#008A3C] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition"
                            >
                              <MapPin className="w-4 h-4" />
                              <span>
                                {isAr ? 'وصلت لمستودع المورد' : 'Arrived at Supplier Warehouse'}
                              </span>
                            </button>
                          )}

                          {job.status === 'at_pickup' && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2.5">
                              <div className="text-xs font-black text-amber-900">
                                {isAr
                                  ? 'أدخل رمز الاستلام من أمين المستودع (4 أرقام)'
                                  : 'Enter 4-digit Warehouse Pickup PIN'}
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={4}
                                  value={pinValue}
                                  onChange={(e) =>
                                    setPinInputs((prev) => ({
                                      ...prev,
                                      [job.id]: e.target.value.replace(/\D/g, '').slice(0, 4)
                                    }))
                                  }
                                  placeholder="••••"
                                  data-testid={`portal-pickup-pin-input-${job.id}`}
                                  className="sm:w-40 min-h-[44px] bg-white border border-amber-300 rounded-xl px-4 text-center font-mono text-base font-black tracking-widest focus:border-[#00A046] focus:outline-hidden"
                                />
                                <button
                                  type="button"
                                  disabled={actionBusyId === job.id || pinValue.length < 4}
                                  onClick={() =>
                                    handleJobStep(job, 'pickup', { pickupPin: pinValue })
                                  }
                                  data-testid={`portal-step-pickup-${job.id}`}
                                  className="flex-1 min-h-[44px] rounded-xl bg-[#00A046] hover:bg-[#008A3C] disabled:bg-gray-300 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>{t.partnerPortalPickupBtn}</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {job.status === 'picked_up' && (
                            <button
                              type="button"
                              disabled={actionBusyId === job.id}
                              onClick={() => handleJobStep(job, 'start')}
                              data-testid={`portal-step-start-${job.id}`}
                              className="w-full min-h-[46px] rounded-xl bg-[#00A046] hover:bg-[#008A3C] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Truck className="w-4 h-4" />
                              <span>
                                {isAr ? 'بدء رحلة التوصيل إلى المتجر' : 'Start Delivery Trip'}
                              </span>
                            </button>
                          )}

                          {job.status === 'in_transit' && (
                            <button
                              type="button"
                              disabled={actionBusyId === job.id}
                              onClick={() => handleJobStep(job, 'arrived-dropoff')}
                              data-testid={`portal-step-arrived-dropoff-${job.id}`}
                              className="w-full min-h-[46px] rounded-xl bg-[#00A046] hover:bg-[#008A3C] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <MapPin className="w-4 h-4" />
                              <span>
                                {isAr ? 'وصلت لموقع المتجر' : 'Arrived at Store Location'}
                              </span>
                            </button>
                          )}

                          {job.status === 'at_dropoff' && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2.5">
                              <div className="text-xs font-black text-[#0B5D32]">
                                {isAr
                                  ? 'أدخل رمز استلام التاجر (4 أرقام) لإتمام التسليم'
                                  : 'Enter 4-digit Store Delivery PIN to Complete'}
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={4}
                                  value={pinValue}
                                  onChange={(e) =>
                                    setPinInputs((prev) => ({
                                      ...prev,
                                      [job.id]: e.target.value.replace(/\D/g, '').slice(0, 4)
                                    }))
                                  }
                                  placeholder="••••"
                                  data-testid={`portal-delivery-pin-input-${job.id}`}
                                  className="sm:w-40 min-h-[44px] bg-white border border-emerald-300 rounded-xl px-4 text-center font-mono text-base font-black tracking-widest focus:border-[#00A046] focus:outline-hidden"
                                />
                                <button
                                  type="button"
                                  disabled={actionBusyId === job.id || pinValue.length < 4}
                                  onClick={() =>
                                    handleJobStep(job, 'deliver', { deliveryPin: pinValue })
                                  }
                                  data-testid={`portal-step-deliver-${job.id}`}
                                  className="flex-1 min-h-[44px] rounded-xl bg-[#00A046] hover:bg-[#008A3C] disabled:bg-gray-300 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <ShieldCheck className="w-4 h-4" />
                                  <span>{t.partnerPortalDeliverBtn}</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Secondary actions row */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <a
                              href={buildMapsUrl(job)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-h-[40px] px-3 rounded-xl border border-[#E5E7EB] bg-white hover:bg-gray-50 text-xs font-bold text-[#1F2328] inline-flex items-center gap-1.5"
                            >
                              <Navigation className="w-3.5 h-3.5 text-blue-600" />
                              <span>{t.partnerPortalMapsBtn}</span>
                            </a>

                            <button
                              type="button"
                              onClick={() => {
                                setFailingJob(job);
                                setFailReasonCode('store_closed');
                                setFailNote('');
                              }}
                              data-testid={`portal-fail-btn-${job.id}`}
                              className="min-h-[40px] px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-black text-red-700 inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>{t.partnerPortalFailBtn}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Expandable Items & Timeline */}
                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedJobIds((prev) => ({ ...prev, [job.id]: !prev[job.id] }))
                          }
                          className="text-xs font-bold text-[#6B7280] hover:text-[#1F2328] inline-flex items-center gap-1 cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {isAr
                              ? `تفاصيل الأصناف (${job.itemsSummary?.length || 0}) وسجل الحالات`
                              : `Items (${job.itemsSummary?.length || 0}) & Timeline`}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="mt-2.5 pt-2.5 border-t border-dashed border-[#E5E7EB] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1.5">
                              <div className="font-black text-[#1F2328]">
                                {isAr ? 'محتويات الشحنة:' : 'Shipment Contents:'}
                              </div>
                              {(job.itemsSummary || []).map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between bg-[#F8FAFC] px-2.5 py-1.5 rounded-lg border border-[#E5E7EB]"
                                >
                                  <span className="font-bold text-[#1F2328]">
                                    {isAr ? item.productNameAr : item.productNameEn || item.productNameAr}
                                  </span>
                                  <span className="font-mono font-black text-[#0B5D32]">
                                    × {item.quantity}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="space-y-1.5">
                              <div className="font-black text-[#1F2328]">
                                {isAr ? 'التسلسل الزمني:' : 'Timeline:'}
                              </div>
                              {job.history.map((h, idx) => (
                                <div key={idx} className="text-[11px] text-[#6B7280] flex items-start gap-1.5">
                                  <Clock className="w-3 h-3 mt-0.5 shrink-0 text-[#00A046]" />
                                  <div>
                                    <span className="font-bold text-[#1F2328]">{h.actorName}:</span>{' '}
                                    <span>{h.note || h.status}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: EARNINGS ================= */}
        {activeTab === 'earnings' && (
          <div className="space-y-4">
            <h2 className="text-sm sm:text-base font-black text-[#1F2328]">
              {t.partnerPortalTabEarnings}
            </h2>

            {earnings && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 shadow-2xs">
                    <div className="text-[11px] font-bold text-[#6B7280]">
                      {isAr ? 'إجمالي الأرباح المقدرة' : 'Total Est. Earnings'}
                    </div>
                    <div className="text-base sm:text-lg font-black text-[#00A046] mt-1">
                      {formatCurrency(earnings.totalEstimatedPayoutIQD, currency, language)}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 shadow-2xs">
                    <div className="text-[11px] font-bold text-[#6B7280]">
                      {isAr ? 'أرباح اليوم' : "Today's Payout"}
                    </div>
                    <div className="text-base sm:text-lg font-black text-[#1F2328] mt-1">
                      {formatCurrency(earnings.todayPayoutIQD, currency, language)}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 shadow-2xs">
                    <div className="text-[11px] font-bold text-[#6B7280]">
                      {isAr ? 'المهام المكتملة' : 'Delivered Jobs'}
                    </div>
                    <div className="text-base sm:text-lg font-black text-[#1F2328] mt-1">
                      {earnings.totalDeliveredCount}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#E5E7EB] p-3.5 shadow-2xs">
                    <div className="text-[11px] font-bold text-[#6B7280]">
                      {isAr ? 'عهدة الكاش (COD)' : 'COD Cash Custody'}
                    </div>
                    <div className="text-base sm:text-lg font-black text-amber-700 mt-1">
                      {formatCurrency(earnings.cashOnHandIQD, currency, language)}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-xs sm:text-sm font-black text-[#1F2328]">
                      {isAr ? 'المهام المسلمة مؤخراً' : 'Recently Completed Deliveries'}
                    </h3>
                    <span className="text-[11px] font-bold text-[#6B7280]">
                      {isAr
                        ? `عمولة المنصة: ${earnings.commissionPercent}% • COD للشركاء: ${
                            earnings.codAllowedForPartners ? 'مفعل' : 'غير مفعل'
                          }`
                        : `Platform Fee: ${earnings.commissionPercent}% • Partner COD: ${
                            earnings.codAllowedForPartners ? 'Enabled' : 'Disabled'
                          }`}
                    </span>
                  </div>

                  {earnings.recentJobs.length === 0 ? (
                    <div className="text-xs text-[#6B7280] py-4 text-center">
                      {isAr ? 'لا توجد مهام مكتملة بعد' : 'No completed deliveries yet'}
                    </div>
                  ) : (
                    <div className="divide-y divide-[#E5E7EB]">
                      {earnings.recentJobs.map((rj) => (
                        <div key={rj.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                          <div>
                            <div className="font-black text-[#1F2328]">
                              {rj.pickupName} ← {rj.dropoffName}
                            </div>
                            <div className="text-[11px] text-[#6B7280] font-mono">
                              {rj.id} • {rj.subOrderId} • {rj.dropoffCity}
                            </div>
                          </div>
                          <div className="text-end shrink-0">
                            <div className="font-black text-[#00A046]">
                              {formatCurrency(rj.estimatedPayoutIQD, currency, language)}
                            </div>
                            <div className="text-[10px] text-[#6B7280]">
                              {rj.paymentMethod === 'cod' ? 'COD' : isAr ? 'آجل' : 'Credit'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= TAB 4: ACCOUNT ================= */}
        {activeTab === 'account' && (
          <div className="space-y-4">
            <h2 className="text-sm sm:text-base font-black text-[#1F2328]">
              {t.partnerPortalTabAccount}
            </h2>

            {meData.partner && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-black text-sm text-[#1F2328]">{meData.partner.name}</div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#0B5D32] border border-emerald-200 font-black text-[11px]">
                    {meData.partner.accountStatus}
                  </span>
                </div>
                <div className="text-[#6B7280]">
                  {meData.partner.governorateNameAr} — {meData.partner.city} •{' '}
                  <span className="font-mono">{meData.partner.registrationCode}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(meData.partner.serviceZoneNames || []).map((zn: any, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-lg bg-[#F7F8FA] border border-[#E5E7EB] text-[11px] font-bold"
                    >
                      {isAr ? zn.nameAr : zn.nameEn}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Drivers Roster */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-2.5">
              <h3 className="text-xs sm:text-sm font-black text-[#1F2328]">
                {isAr ? `السائقون المرتبطون (${meData.drivers.length})` : `Drivers (${meData.drivers.length})`}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {meData.drivers.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-black text-[#1F2328]">{d.name}</div>
                      <div className="text-[11px] text-[#6B7280] font-mono">
                        {d.phone} • {d.licenseNo}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                        d.availability === 'offline'
                          ? 'bg-gray-100 text-gray-600 border-gray-300'
                          : 'bg-emerald-50 text-[#0B5D32] border-emerald-200'
                      }`}
                    >
                      {d.availability === 'offline' ? t.partnerPortalOffline : t.partnerPortalOnline}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicles Roster */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-2.5">
              <h3 className="text-xs sm:text-sm font-black text-[#1F2328]">
                {isAr ? `المركبات (${meData.vehicles.length})` : `Vehicles (${meData.vehicles.length})`}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {meData.vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-[#1F2328]">{v.plateNumber}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        {v.vehicleClass}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#6B7280]">
                      {v.brandModel} • {v.capacityUnits} {isAr ? 'وحدة' : 'units'} •{' '}
                      {v.supportedTemperatures.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#E5E7EB] grid grid-cols-4 h-16 px-1">
        {[
          {
            id: 'available' as PortalTab,
            label: isAr ? 'المتاحة' : 'Open',
            count: availableJobs.length,
            icon: Package
          },
          {
            id: 'mine' as PortalTab,
            label: isAr ? 'مهامي' : 'Mine',
            count: activeJobs.length,
            icon: Truck
          },
          {
            id: 'earnings' as PortalTab,
            label: isAr ? 'المستحقات' : 'Pay',
            icon: Wallet
          },
          {
            id: 'account' as PortalTab,
            label: isAr ? 'حسابي' : 'Account',
            icon: UserCircle2
          }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 relative cursor-pointer ${
                active ? 'text-[#00A046]' : 'text-[#6B7280]'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span className="absolute -top-1.5 -end-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#00A046] text-white text-[9px] font-black flex items-center justify-center">
                    {tab.count}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-black">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Fail Delivery Modal */}
      {failingJob && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E5E7EB] max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-black text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span>{t.partnerPortalFailBtn}</span>
              </h3>
              <button
                type="button"
                onClick={() => setFailingJob(null)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmFail} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#1F2328] mb-1">
                  {isAr ? 'سبب تعذر التسليم:' : 'Failure Reason:'}
                </label>
                <select
                  value={failReasonCode}
                  onChange={(e) => setFailReasonCode(e.target.value as DeliveryJobFailureReasonCode)}
                  data-testid="portal-fail-reason-select"
                  className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl p-2.5 font-bold"
                >
                  {FAILURE_REASONS.map((r) => (
                    <option key={r.code} value={r.code}>
                      {isAr ? r.ar : r.en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#1F2328] mb-1">
                  {isAr ? 'ملاحظات السائق (إلزامية):' : 'Driver Note (required):'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={failNote}
                  onChange={(e) => setFailNote(e.target.value)}
                  placeholder={
                    isAr
                      ? 'مثال: المحل مغلق ولم يتم الرد على الهاتف...'
                      : 'e.g. Store closed, no answer on phone...'
                  }
                  data-testid="portal-fail-note-input"
                  className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl p-2.5 focus:bg-white focus:border-[#00A046] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFailingJob(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] font-bold text-[#1F2328] cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={actionBusyId === failingJob.id}
                  data-testid="portal-fail-submit-btn"
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black cursor-pointer"
                >
                  {isAr ? 'تأكيد تسجيل الفشل' : 'Submit Failure Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
