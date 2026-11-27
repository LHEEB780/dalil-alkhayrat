import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FileText,
  Globe,
  Info,
  MapPin,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Truck,
  UserCheck
} from 'lucide-react';
import {
  DeliveryPartnerType,
  DeliveryVehicleClass,
  Language,
  VehicleTemperatureType
} from '../types/index.ts';
import {
  VEHICLE_CLASS_LABELS,
  VEHICLE_CLASS_ORDER
} from '../../shared/deliveryRules.ts';
import { translations } from '../utils/translations.ts';

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

interface VehicleDraft {
  vehicleClass: DeliveryVehicleClass;
  plateNumber: string;
  makeModel: string;
  capacityUnits: number;
  temperatureSupport: VehicleTemperatureType[];
}

interface PartnerRegistrationViewProps {
  language?: Language;
  onLanguageChange?: (lang: Language) => void;
  onBack: () => void;
}

const DEFAULT_CLASS_CAPACITY: Record<DeliveryVehicleClass, number> = {
  motorcycle: 12,
  pickup: 35,
  small_truck: 90,
  medium_truck: 300,
  refrigerated_truck: 250
};

export const PartnerRegistrationView: React.FC<PartnerRegistrationViewProps> = ({
  language = 'ar',
  onLanguageChange,
  onBack
}) => {
  const isAr = language === 'ar';
  const t = translations[language];
  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  const [mode, setMode] = useState<'apply' | 'status'>('apply');
  const [governorates, setGovernorates] = useState<GeoGovHierarchy[]>([]);

  // Registration Form State
  const [partnerType, setPartnerType] = useState<DeliveryPartnerType>('individual');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [governorateId, setGovernorateId] = useState('gov_najaf');
  const [serviceZoneIds, setServiceZoneIds] = useState<string[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDraft[]>([
    {
      vehicleClass: 'pickup',
      plateNumber: '',
      makeModel: '',
      capacityUnits: 35,
      temperatureSupport: ['ambient']
    }
  ]);
  const [docDeclarations, setDocDeclarations] = useState({
    driver_license: true,
    vehicle_registration: true,
    insurance: false,
    vehicle_inspection: false
  });
  const [payoutMethod, setPayoutMethod] = useState<'cash' | 'bank' | 'zaincash'>('zaincash');
  const [payoutRef, setPayoutRef] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{
    registrationCode: string;
    phone: string;
    createdAt: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Status Inquiry State
  const [statusPhone, setStatusPhone] = useState('');
  const [statusCode, setStatusCode] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusResult, setStatusResult] = useState<{
    registrationCode: string;
    type: DeliveryPartnerType;
    status: string;
    statusReason?: string;
    createdAt: string;
    statusChangedAt?: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/geo/governorates')
      .then((r) => r.json())
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) {
          setGovernorates(json.data);
          const firstGov =
            json.data.find((g: GeoGovHierarchy) => g.id === 'gov_najaf') || json.data[0];
          if (firstGov) {
            setGovernorateId(firstGov.id);
            if (firstGov.deliveryZones?.length > 0) {
              setServiceZoneIds([firstGov.deliveryZones[0].id]);
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  const currentZones = useMemo(() => {
    const gov = governorates.find((g) => g.id === governorateId);
    return gov?.deliveryZones || [];
  }, [governorates, governorateId]);

  const handleGovernorateChange = (nextGovId: string) => {
    setGovernorateId(nextGovId);
    const gov = governorates.find((g) => g.id === nextGovId);
    setServiceZoneIds(gov?.deliveryZones?.[0] ? [gov.deliveryZones[0].id] : []);
  };

  const toggleZone = (zid: string) => {
    setServiceZoneIds((prev) =>
      prev.includes(zid) ? prev.filter((id) => id !== zid) : [...prev, zid]
    );
  };

  const updateVehicle = (idx: number, patch: Partial<VehicleDraft>) => {
    setVehicles((prev) =>
      prev.map((v, i) => {
        if (i !== idx) return v;
        const next = { ...v, ...patch };
        if (patch.vehicleClass) {
          next.capacityUnits = DEFAULT_CLASS_CAPACITY[patch.vehicleClass];
          if (patch.vehicleClass === 'refrigerated_truck') {
            next.temperatureSupport = ['ambient', 'chilled', 'frozen'];
          }
        }
        return next;
      })
    );
  };

  const toggleVehicleTemp = (idx: number, temp: VehicleTemperatureType) => {
    setVehicles((prev) =>
      prev.map((v, i) => {
        if (i !== idx) return v;
        const exists = v.temperatureSupport.includes(temp);
        const nextTemps = exists
          ? v.temperatureSupport.filter((x) => x !== temp)
          : [...v.temperatureSupport, temp];
        return {
          ...v,
          temperatureSupport: nextTemps.length > 0 ? nextTemps : ['ambient']
        };
      })
    );
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (serviceZoneIds.length === 0) {
      setSubmitError(
        isAr ? 'يرجى اختيار منطقة توصيل واحدة على الأقل' : 'Please select at least one delivery zone'
      );
      return;
    }
    if (!acceptedTerms) {
      setSubmitError(
        isAr
          ? 'يجب الموافقة على مسودة الشروط والأحكام للمتابعة'
          : 'Please accept the draft terms and conditions'
      );
      return;
    }

    setSubmitting(true);
    try {
      const gov = governorates.find((g) => g.id === governorateId);
      const res = await fetch('/api/delivery/partners/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: partnerType,
          name,
          phone,
          city: gov?.nameAr || '',
          governorateId,
          serviceZoneIds,
          vehicles,
          docDeclarations,
          payoutAccount: {
            method: payoutMethod,
            accountRef: payoutRef.trim() || undefined
          },
          acceptedTerms
        })
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || t.error);
      }
      setSubmittedResult({
        registrationCode: json.data.registrationCode,
        phone,
        createdAt: json.data.createdAt
      });
    } catch (err: any) {
      setSubmitError(err?.message || t.error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusError(null);
    setStatusResult(null);
    setStatusLoading(true);
    try {
      const params = new URLSearchParams({
        phone: statusPhone.trim(),
        code: statusCode.trim()
      });
      const res = await fetch(`/api/delivery/partners/status?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || t.error);
      }
      setStatusResult(json.data);
    } catch (err: any) {
      setStatusError(err?.message || t.error);
    } finally {
      setStatusLoading(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    const map: Record<string, { cls: string; ar: string; en: string }> = {
      pending: {
        cls: 'bg-amber-50 text-amber-800 border-amber-200',
        ar: 'قيد المراجعة من إدارة المنصة',
        en: 'Pending Admin Review'
      },
      active: {
        cls: 'bg-emerald-50 text-[#00A046] border-emerald-200',
        ar: 'معتمد ونشط في شبكة التوصيل',
        en: 'Approved & Active'
      },
      rejected: {
        cls: 'bg-red-50 text-red-700 border-red-200',
        ar: 'تم رفض الطلب',
        en: 'Application Rejected'
      },
      suspended: {
        cls: 'bg-red-50 text-red-700 border-red-200',
        ar: 'الحساب موقوف مؤقتاً',
        en: 'Suspended'
      },
      archived: {
        cls: 'bg-gray-100 text-gray-700 border-gray-200',
        ar: 'مؤرشف',
        en: 'Archived'
      }
    };
    return map[status] || { cls: 'bg-gray-100 text-gray-700 border-gray-200', ar: status, en: status };
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#F7F8FA] py-6 px-4 sm:px-6 lg:px-8 font-brand"
    >
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-gray-50 text-xs font-black text-[#221F1F] shadow-2xs cursor-pointer"
          >
            <BackIcon className="w-4 h-4 text-[#00A046]" />
            <span>{t.partnerRegBackBtn}</span>
          </button>

          {onLanguageChange && (
            <button
              type="button"
              onClick={() => onLanguageChange(isAr ? 'en' : 'ar')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-gray-50 text-xs font-black text-[#221F1F] shadow-2xs cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#00A046]" />
              <span>{isAr ? 'English' : 'عربي'}</span>
            </button>
          )}
        </div>

        {/* Title Card */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#00A046] flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#221F1F]">
                {t.partnerRegTitle}
              </h1>
              <p className="text-xs sm:text-sm text-[#797878] mt-0.5">{t.partnerRegSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-[#F3F4F6]">
            <button
              type="button"
              onClick={() => setMode('apply')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer ${
                mode === 'apply'
                  ? 'bg-[#00A046] text-white shadow-xs'
                  : 'bg-[#F9FAFB] text-[#4A4747] border border-[#E5E7EB]'
              }`}
            >
              {t.partnerRegTabApply}
            </button>
            <button
              type="button"
              onClick={() => setMode('status')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer ${
                mode === 'status'
                  ? 'bg-[#00A046] text-white shadow-xs'
                  : 'bg-[#F9FAFB] text-[#4A4747] border border-[#E5E7EB]'
              }`}
            >
              {t.partnerRegTabStatus}
            </button>
          </div>
        </div>

        {/* ================= MODE 1: APPLY ================= */}
        {mode === 'apply' && (
          <>
            {submittedResult ? (
              <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-xs text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#00A046] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#221F1F]">
                    {isAr
                      ? 'تم استلام طلب انضمامك بنجاح!'
                      : 'Partner Application Submitted Successfully!'}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#797878] mt-1">
                    {isAr
                      ? 'احفظ رمز المتابعة أدناه للاستعلام عن حالة طلبك ومراجعة وثائقك من قبل فريق المنصة.'
                      : 'Save your tracking code below to check application review progress.'}
                  </p>
                </div>

                <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#F7F8FA] border border-[#E5E7EB]">
                  <span className="text-xs font-bold text-[#797878]">
                    {isAr ? 'رمز متابعة الطلب:' : 'Tracking Code:'}
                  </span>
                  <span className="text-lg font-mono font-black text-[#00A046]">
                    {submittedResult.registrationCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(submittedResult.registrationCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 1800);
                    }}
                    className="p-1.5 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#00A046] cursor-pointer"
                    title={isAr ? 'نسخ الرمز' : 'Copy Code'}
                  >
                    {copiedCode ? (
                      <Check className="w-4 h-4 text-[#00A046]" />
                    ) : (
                      <Copy className="w-4 h-4 text-[#4A4747]" />
                    )}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusPhone(submittedResult.phone);
                      setStatusCode(submittedResult.registrationCode);
                      setMode('status');
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#00A046] text-white text-xs font-black cursor-pointer"
                  >
                    {isAr ? 'استعلم عن حالة الطلب الآن' : 'Track Application Status Now'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedResult(null);
                      setName('');
                      setPhone('');
                      setAcceptedTerms(false);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold text-[#4A4747] cursor-pointer"
                  >
                    {isAr ? 'تقديم طلب آخر' : 'Submit Another'}
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmitApplication}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 shadow-xs space-y-5 text-xs"
              >
                {submitError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold">
                    {submitError}
                  </div>
                )}

                {/* Partner Type */}
                <div className="space-y-2">
                  <label className="block font-black text-[#221F1F]">
                    {isAr ? 'نوع الشريك' : 'Partner Type'}
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(
                      [
                        {
                          id: 'individual',
                          ar: 'سائق مستقل / مالك مركبة',
                          en: 'Individual Driver-Partner'
                        },
                        {
                          id: 'company',
                          ar: 'شركة نقل أو أسطول توصيل',
                          en: 'Delivery Fleet Company'
                        }
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPartnerType(opt.id)}
                        className={`p-3 rounded-xl border text-start font-bold transition cursor-pointer ${
                          partnerType === opt.id
                            ? 'border-[#00A046] bg-emerald-50 text-[#00A046]'
                            : 'border-[#E5E7EB] bg-[#F9FAFB] text-[#4A4747]'
                        }`}
                      >
                        {isAr ? opt.ar : opt.en}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Identity & Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#4A4747] mb-1">
                      {partnerType === 'company'
                        ? isAr
                          ? 'اسم الشركة / المؤسسة'
                          : 'Company Name'
                        : isAr
                        ? 'الاسم الثلاثي الكامل'
                        : 'Full Name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isAr ? 'مثال: شركة النهرين اللوجستية' : 'Partner or Company Name'}
                      className="w-full rounded-xl border border-[#D1D5DB] bg-[#F7F8FA] focus:bg-white focus:border-[#00A046] px-3 py-2.5 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#4A4747] mb-1">
                      {isAr ? 'رقم الهاتف التشغيلي العراقي' : 'Operational Phone'}
                    </label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0780 123 4567"
                      className="w-full rounded-xl border border-[#D1D5DB] bg-[#F7F8FA] focus:bg-white focus:border-[#00A046] px-3 py-2.5 font-mono"
                    />
                  </div>
                </div>

                {/* Governorate & Service Zones */}
                <div className="space-y-2.5">
                  <div>
                    <label className="block font-bold text-[#4A4747] mb-1">
                      {isAr ? 'المحافظة الرئيسية للعمل' : 'Primary Governorate'}
                    </label>
                    <select
                      value={governorateId}
                      onChange={(e) => handleGovernorateChange(e.target.value)}
                      className="w-full rounded-xl border border-[#D1D5DB] bg-[#F7F8FA] px-3 py-2.5 font-bold"
                    >
                      {governorates.map((g) => (
                        <option key={g.id} value={g.id}>
                          {isAr ? g.nameAr : g.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#4A4747] mb-1.5">
                      {isAr ? 'مناطق التوصيل المغطاة (اختر واحدة أو أكثر)' : 'Covered Delivery Zones'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {currentZones.map((z) => {
                        const checked = serviceZoneIds.includes(z.id);
                        return (
                          <button
                            key={z.id}
                            type="button"
                            onClick={() => toggleZone(z.id)}
                            className={`px-3 py-1.5 rounded-xl border font-bold transition cursor-pointer ${
                              checked
                                ? 'bg-[#00A046] text-white border-[#00A046]'
                                : 'bg-[#F9FAFB] text-[#4A4747] border-[#E5E7EB]'
                            }`}
                          >
                            {isAr ? z.nameAr : z.nameEn}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Vehicles List */}
                <div className="space-y-3 pt-2 border-t border-[#F3F4F6]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-[#221F1F]">
                      {isAr ? 'بيانات المركبة / المركبات' : 'Vehicle(s) Information'}
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        setVehicles((prev) => [
                          ...prev,
                          {
                            vehicleClass: 'pickup',
                            plateNumber: '',
                            makeModel: '',
                            capacityUnits: 35,
                            temperatureSupport: ['ambient']
                          }
                        ])
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-[#00A046] border border-emerald-200 font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إضافة مركبة' : 'Add Vehicle'}</span>
                    </button>
                  </div>

                  {vehicles.map((veh, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-[#221F1F]">
                          {isAr ? `المركبة رقم ${idx + 1}` : `Vehicle #${idx + 1}`}
                        </span>
                        {vehicles.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setVehicles((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-red-600 hover:underline inline-flex items-center gap-1 font-bold cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{isAr ? 'حذف' : 'Remove'}</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block font-bold mb-1">{isAr ? 'فئة المركبة' : 'Class'}</label>
                          <select
                            value={veh.vehicleClass}
                            onChange={(e) =>
                              updateVehicle(idx, {
                                vehicleClass: e.target.value as DeliveryVehicleClass
                              })
                            }
                            className="w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 font-bold"
                          >
                            {VEHICLE_CLASS_ORDER.map((vc) => (
                              <option key={vc} value={vc}>
                                {isAr ? VEHICLE_CLASS_LABELS[vc].ar : VEHICLE_CLASS_LABELS[vc].en}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold mb-1">{isAr ? 'رقم اللوحة' : 'Plate No.'}</label>
                          <input
                            type="text"
                            required
                            value={veh.plateNumber}
                            onChange={(e) => updateVehicle(idx, { plateNumber: e.target.value })}
                            placeholder={isAr ? 'مثال: النجف 55120 ط' : 'Plate number'}
                            className="w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">{isAr ? 'النوع والموديل' : 'Make & Model'}</label>
                          <input
                            type="text"
                            required
                            value={veh.makeModel}
                            onChange={(e) => updateVehicle(idx, { makeModel: e.target.value })}
                            placeholder={isAr ? 'مثال: كيا بونغو 2022' : 'e.g. Kia Bongo 2022'}
                            className="w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">{isAr ? 'السعة التقديرية (وحدة)' : 'Capacity (Units)'}</label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={veh.capacityUnits}
                            onChange={(e) =>
                              updateVehicle(idx, { capacityUnits: Number(e.target.value) || 1 })
                            }
                            className="w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 tabular-nums"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold mb-1">
                          {isAr ? 'دعم درجات الحرارة' : 'Temperature Support'}
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {(
                            [
                              { id: 'ambient', ar: 'عادي / جاف', en: 'Ambient' },
                              { id: 'chilled', ar: 'مبرد', en: 'Chilled' },
                              { id: 'frozen', ar: 'مجمد', en: 'Frozen' }
                            ] as const
                          ).map((temp) => (
                            <label key={temp.id} className="inline-flex items-center gap-1.5 font-bold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={veh.temperatureSupport.includes(temp.id)}
                                onChange={() => toggleVehicleTemp(idx, temp.id)}
                                className="accent-[#00A046]"
                              />
                              <span>{isAr ? temp.ar : temp.en}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Documents Declaration */}
                <div className="space-y-2.5 pt-2 border-t border-[#F3F4F6]">
                  <h3 className="text-sm font-black text-[#221F1F]">
                    {isAr ? 'إقرار توفر الوثائق الرسمية' : 'Official Documents Declaration'}
                  </h3>
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-bold flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      {isAr
                        ? 'رفع صور الوثائق غير متاح في هذه المرحلة — سيتواصل معك فريق المنصة للتحقق من الوثائق ومطابقتها.'
                        : 'Document image upload is not enabled in this phase — the platform team will contact you to verify documents.'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(
                      [
                        { key: 'driver_license', ar: 'لدي إجازة سوق نافذة', en: 'Valid Driver License' },
                        { key: 'vehicle_registration', ar: 'لدي سنوية مركبة نافذة', en: 'Valid Vehicle Registration' },
                        { key: 'insurance', ar: 'لدي تأمين مركبة ساري', en: 'Valid Vehicle Insurance' },
                        { key: 'vehicle_inspection', ar: 'اجتازت المركبة الفحص الفني', en: 'Safety Inspection Passed' }
                      ] as const
                    ).map((doc) => (
                      <label key={doc.key} className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(docDeclarations as any)[doc.key]}
                          onChange={(e) =>
                            setDocDeclarations((prev) => ({
                              ...prev,
                              [doc.key]: e.target.checked
                            }))
                          }
                          className="accent-[#00A046]"
                        />
                        <span>{isAr ? doc.ar : doc.en}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Payout Account */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#F3F4F6]">
                  <div>
                    <label className="block font-bold mb-1">
                      {isAr ? 'طريقة استلام المستحقات' : 'Payout Method'}
                    </label>
                    <select
                      value={payoutMethod}
                      onChange={(e) =>
                        setPayoutMethod(e.target.value as 'cash' | 'bank' | 'zaincash')
                      }
                      className="w-full rounded-xl border border-[#D1D5DB] bg-[#F7F8FA] px-3 py-2.5 font-bold"
                    >
                      <option value="zaincash">ZainCash (زين كاش)</option>
                      <option value="bank">{isAr ? 'حوالة مصرفية' : 'Bank Transfer'}</option>
                      <option value="cash">{isAr ? 'نقداً عند التسوية' : 'Cash Settlement'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">
                      {isAr ? 'رقم المحفظة أو الحساب (اختياري)' : 'Wallet / Account Reference (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={payoutRef}
                      onChange={(e) => setPayoutRef(e.target.value)}
                      placeholder={isAr ? 'رقم زين كاش أو IBAN' : 'ZainCash or Bank Ref'}
                      className="w-full rounded-xl border border-[#D1D5DB] bg-[#F7F8FA] px-3 py-2.5 font-mono"
                    />
                  </div>
                </div>

                {/* Draft Terms Checkbox */}
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                  <div className="text-[11px] font-black text-amber-900">
                    {isAr
                      ? 'تنبيه قانوني: الشروط والأحكام أدناه هي مسودة تحتاج مراجعة قانونية قبل الاعتماد النهائي.'
                      : 'Legal Notice: These onboarding terms are a draft needing legal review.'}
                  </div>
                  <label className="flex items-start gap-2 font-bold text-[#221F1F] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="accent-[#00A046] mt-0.5"
                    />
                    <span>
                      {isAr
                        ? 'أوافق على مسودة الشروط والأحكام الخاصة بشبكة توصيل دليل الخيرات العراق (مسودة تحتاج مراجعة قانونية) وأقر بصحة البيانات المدخلة.'
                        : 'I accept the draft terms and conditions for Dalil Al-Khairat Delivery Network (draft needing legal review) and confirm all details are accurate.'}
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-[#00A046] hover:bg-[#008a3c] text-white text-sm font-black shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {submitting
                    ? t.loading
                    : isAr
                    ? 'إرسال طلب الانضمام كشريك توصيل'
                    : 'Submit Delivery Partner Application'}
                </button>
              </form>
            )}
          </>
        )}

        {/* ================= MODE 2: STATUS INQUIRY ================= */}
        {mode === 'status' && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 shadow-xs space-y-4 text-xs">
            <form onSubmit={handleCheckStatus} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#4A4747] mb-1">
                    {isAr ? 'رقم الهاتف المسجل' : 'Registered Phone Number'}
                  </label>
                  <input
                    type="text"
                    required
                    value={statusPhone}
                    onChange={(e) => setStatusPhone(e.target.value)}
                    placeholder="0780 123 4567"
                    className="w-full rounded-xl border border-[#D1D5DB] bg-[#F7F8FA] px-3 py-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#4A4747] mb-1">
                    {isAr ? 'رمز المتابعة (DP-XXXXXX)' : 'Tracking Code (DP-XXXXXX)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={statusCode}
                    onChange={(e) => setStatusCode(e.target.value)}
                    placeholder="DP-100103"
                    className="w-full rounded-xl border border-[#D1D5DB] bg-[#F7F8FA] px-3 py-2.5 font-mono uppercase"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={statusLoading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#00A046] hover:bg-[#008a3c] text-white font-black cursor-pointer disabled:opacity-60"
              >
                <Search className="w-4 h-4" />
                <span>{statusLoading ? t.loading : isAr ? 'استعلام عن الحالة' : 'Check Status'}</span>
              </button>
            </form>

            {statusError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold">
                {statusError}
              </div>
            )}

            {statusResult && (
              <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-black text-sm text-[#221F1F]">
                    {statusResult.registrationCode}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-lg border font-black ${
                      getStatusDisplay(statusResult.status).cls
                    }`}
                  >
                    {isAr
                      ? getStatusDisplay(statusResult.status).ar
                      : getStatusDisplay(statusResult.status).en}
                  </span>
                </div>
                {statusResult.statusReason && (
                  <div className="p-2.5 rounded-lg bg-white border border-[#E5E7EB] font-bold text-[#221F1F]">
                    {isAr ? 'السبب / الملاحظة:' : 'Reason:'} {statusResult.statusReason}
                  </div>
                )}
                <div className="text-[11px] text-[#797878]">
                  {isAr ? 'تاريخ التقديم:' : 'Submitted:'}{' '}
                  {new Date(statusResult.createdAt).toLocaleString(isAr ? 'ar-IQ' : 'en-US')}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
