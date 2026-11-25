import React, { useState } from 'react';
import {
  Wallet,
  Fuel,
  Gauge,
  ThermometerSnowflake,
  Trash2,
  Lock,
  CheckCircle2,
  FileSpreadsheet,
  Plus
} from 'lucide-react';
import {
  Currency,
  Language,
  VanExpenseItem,
  VanShiftReportItem
} from '../types/index.ts';
import { formatCurrency } from '../utils/format.ts';

interface VanFinanceSettlementPanelProps {
  driverId: string;
  driverInfo: any;
  vanExpenses: VanExpenseItem[];
  shiftReports: VanShiftReportItem[];
  currency: Currency;
  language: Language;
  onRefreshVanData: () => Promise<void>;
  onOpenShiftCloseModal: () => void;
  onFeedback: (fb: { type: 'success' | 'error'; text: string }) => void;
}

export const VanFinanceSettlementPanel: React.FC<VanFinanceSettlementPanelProps> = ({
  driverId,
  driverInfo,
  vanExpenses,
  shiftReports,
  currency,
  language,
  onRefreshVanData,
  onOpenShiftCloseModal,
  onFeedback
}) => {
  const isAr = language === 'ar';

  // Expense form
  const [expCategory, setExpCategory] = useState<VanExpenseItem['category']>('fuel');
  const [expDescription, setExpDescription] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expRef, setExpRef] = useState('');
  const [isSavingExp, setIsSavingExp] = useState(false);

  // Vehicle & Cold-chain Check
  const [odoStart, setOdoStart] = useState<string>(String(driverInfo?.odometerStartKm ?? 118420));
  const [odoEnd, setOdoEnd] = useState<string>(String(driverInfo?.odometerEndKm ?? 118468));
  const [fuelPct, setFuelPct] = useState<string>(String(driverInfo?.fuelLevelPercent ?? 78));
  const [chillerTemp, setChillerTemp] = useState<string>(String(driverInfo?.chillerTempC ?? 4.2));
  const [tiresOk, setTiresOk] = useState<boolean>(driverInfo?.inspectionChecklist?.tiresOk ?? true);
  const [chillerOk, setChillerOk] = useState<boolean>(driverInfo?.inspectionChecklist?.chillerOk ?? true);
  const [lightsOk, setLightsOk] = useState<boolean>(driverInfo?.inspectionChecklist?.lightsOk ?? true);
  const [hygieneOk, setHygieneOk] = useState<boolean>(driverInfo?.inspectionChecklist?.hygieneOk ?? true);
  const [isSavingVehicle, setIsSavingVehicle] = useState(false);

  const cashSales = driverInfo?.todayCashSalesIQD || 0;
  const creditSales = driverInfo?.todayCreditSalesIQD || 0;
  const debtCollected = driverInfo?.todayDebtCollectedIQD || 0;
  const totalExpenses = vanExpenses.reduce((s, e) => s + e.amountIQD, 0);
  const netCashInCustody = driverInfo?.currentCashCollectedIQD || 0;

  const categoryLabel = (cat: VanExpenseItem['category']) => {
    const map: Record<VanExpenseItem['category'], string> = isAr
      ? {
          fuel: 'وقود ديزل / بنزين',
          toll_parking: 'رسوم طرق وكراج',
          loading_labor: 'أجور عمال تحميل وتنزيل',
          maintenance: 'صيانة طارئة وإطارات',
          other: 'مصروف ميداني آخر'
        }
      : {
          fuel: 'Fuel',
          toll_parking: 'Tolls & Parking',
          loading_labor: 'Loading Labor',
          maintenance: 'Maintenance',
          other: 'Other'
        };
    return map[cat];
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDescription.trim() || !expAmount || isSavingExp) return;
    setIsSavingExp(true);
    try {
      const res = await fetch('/api/van/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          category: expCategory,
          description: expDescription,
          amountIQD: Number(expAmount),
          receiptRef: expRef
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (isAr ? 'تعذر حفظ المصروف' : 'Failed to save expense'));
      }
      setExpDescription('');
      setExpAmount('');
      setExpRef('');
      onFeedback({
        type: 'success',
        text: data.message
      });
      await onRefreshVanData();
    } catch (err: any) {
      onFeedback({
        type: 'error',
        text: err?.message || (isAr ? 'خطأ في تسجيل المصروف' : 'Expense error')
      });
    } finally {
      setIsSavingExp(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const res = await fetch(`/api/van/expenses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error');
      }
      onFeedback({
        type: 'success',
        text: isAr ? 'تم حذف المصروف وإرجاع المبلغ للعهدة.' : 'Expense removed and custody restored.'
      });
      await onRefreshVanData();
    } catch (err: any) {
      onFeedback({ type: 'error', text: err?.message || 'Error' });
    }
  };

  const handleSaveVehicleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingVehicle) return;
    setIsSavingVehicle(true);
    try {
      const res = await fetch(`/api/van/driver/${driverId}/vehicle-check`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          odometerStartKm: Number(odoStart),
          odometerEndKm: Number(odoEnd),
          fuelLevelPercent: Number(fuelPct),
          chillerTempC: Number(chillerTemp),
          inspectionChecklist: { tiresOk, chillerOk, lightsOk, hygieneOk }
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed');
      }
      onFeedback({
        type: 'success',
        text: isAr ? 'تم حفظ قراءة العداد وفحص المركبة والتبريد بنجاح.' : 'Vehicle telemetry saved.'
      });
      await onRefreshVanData();
    } catch (err: any) {
      onFeedback({ type: 'error', text: err?.message || 'Vehicle check failed' });
    } finally {
      setIsSavingVehicle(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Cash Reconciliation Summary Banner */}
      <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#142018] flex items-center gap-2">
              <Wallet className="w-4.5 h-4.5 text-[#0B5D32]" />
              <span>{isAr ? 'التسوية المالية، مصاريف الفان وفحص المركبة' : 'Finance Settlement, Expenses & Fleet Check'}</span>
            </h2>
            <p className="text-[11px] text-[#5F7164] mt-0.5">
              {isAr
                ? 'احتساب صافي العهدة النقدية الواجب توريدها للصندوق الرئيسي بعد خصم المصاريف الميدانية المعتمدة.'
                : 'Calculate net cash due after deducting approved field van expenses.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenShiftCloseModal}
            className="px-4 py-2 rounded-xl bg-[#FFA300] hover:bg-[#e69200] text-[#142018] text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isAr ? 'إغلاق الوردية (Z-Report)' : 'Close Shift (Z-Report)'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          <div className="bg-[#F8FAF7] border border-[#EAEFEA] rounded-xl p-2.5">
            <div className="text-[10.5px] font-bold text-[#5F7164]">{isAr ? 'مبيعات الكاش' : 'Cash Sales'}</div>
            <div className="text-xs sm:text-sm font-black font-mono tabular-nums text-[#142018] mt-1">
              {formatCurrency(cashSales, currency, language)}
            </div>
          </div>
          <div className="bg-[#F8FAF7] border border-[#EAEFEA] rounded-xl p-2.5">
            <div className="text-[10.5px] font-bold text-[#5F7164]">{isAr ? 'تحصيل الذمم' : 'Collections'}</div>
            <div className="text-xs sm:text-sm font-black font-mono tabular-nums text-[#0B5D32] mt-1">
              {formatCurrency(debtCollected, currency, language)}
            </div>
          </div>
          <div className="bg-[#F8FAF7] border border-[#EAEFEA] rounded-xl p-2.5">
            <div className="text-[10.5px] font-bold text-[#5F7164]">{isAr ? 'مبيعات الآجل' : 'Credit Sales'}</div>
            <div className="text-xs sm:text-sm font-black font-mono tabular-nums text-[#4B6352] mt-1">
              {formatCurrency(creditSales, currency, language)}
            </div>
          </div>
          <div className="bg-[#F8FAF7] border border-[#EAEFEA] rounded-xl p-2.5">
            <div className="text-[10.5px] font-bold text-[#5F7164]">{isAr ? 'مصاريف الفان' : 'Van Expenses'}</div>
            <div className="text-xs sm:text-sm font-black font-mono tabular-nums text-[#DC2626] mt-1">
              -{formatCurrency(totalExpenses, currency, language)}
            </div>
          </div>
          <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-2.5 col-span-2 sm:col-span-1">
            <div className="text-[10.5px] font-bold text-[#065F46]">{isAr ? 'صافي الكاش للتوريد' : 'Net Cash Due'}</div>
            <div className="text-xs sm:text-sm font-black font-mono tabular-nums text-[#0B5D32] mt-1">
              {formatCurrency(netCashInCustody, currency, language)}
            </div>
          </div>
        </div>
      </div>

      {/* Split Grid: Field Expenses (Left 7) + Vehicle & Cold-Chain Inspection (Right 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Field Expenses */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3">
          <h3 className="font-black text-sm text-[#142018] flex items-center gap-1.5">
            <Fuel className="w-4 h-4 text-[#0B5D32]" />
            <span>{isAr ? 'سجل مصاريف الفان اليومية (تُخصم من العهدة)' : 'Daily Field Expenses Ledger'}</span>
          </h3>

          <form onSubmit={handleAddExpense} className="bg-[#F8FAF7] border border-[#DCE5DC] rounded-xl p-3 grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
            <div className="sm:col-span-4">
              <label className="text-[10.5px] font-bold text-[#5F7164] block mb-1">
                {isAr ? 'بند المصروف' : 'Category'}
              </label>
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value as any)}
                className="w-full bg-white border border-[#DCE5DC] rounded-lg px-2.5 py-2 font-bold focus:outline-hidden focus:border-[#0B5D32]"
              >
                <option value="fuel">{categoryLabel('fuel')}</option>
                <option value="loading_labor">{categoryLabel('loading_labor')}</option>
                <option value="toll_parking">{categoryLabel('toll_parking')}</option>
                <option value="maintenance">{categoryLabel('maintenance')}</option>
                <option value="other">{categoryLabel('other')}</option>
              </select>
            </div>
            <div className="sm:col-span-5">
              <label className="text-[10.5px] font-bold text-[#5F7164] block mb-1">
                {isAr ? 'البيان / الوصف' : 'Description'}
              </label>
              <input
                type="text"
                required
                value={expDescription}
                onChange={(e) => setExpDescription(e.target.value)}
                placeholder={isAr ? 'مثال: تعبئة ديزل أو أجور تنزيل' : 'e.g. Diesel refill'}
                className="w-full bg-white border border-[#DCE5DC] rounded-lg px-2.5 py-2 focus:outline-hidden focus:border-[#0B5D32]"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-[10.5px] font-bold text-[#5F7164] block mb-1">
                {isAr ? 'المبلغ (د.ع)' : 'Amount (IQD)'}
              </label>
              <input
                type="number"
                required
                min={500}
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                placeholder="25000"
                className="w-full bg-white border border-[#DCE5DC] rounded-lg px-2.5 py-2 font-mono font-bold text-[#0B5D32] focus:outline-hidden focus:border-[#0B5D32]"
              />
            </div>
            <div className="sm:col-span-7">
              <input
                type="text"
                value={expRef}
                onChange={(e) => setExpRef(e.target.value)}
                placeholder={isAr ? 'رقم الوصل الورقي إن وجد (اختياري)...' : 'Receipt reference (optional)...'}
                className="w-full bg-white border border-[#DCE5DC] rounded-lg px-2.5 py-2 focus:outline-hidden focus:border-[#0B5D32]"
              />
            </div>
            <div className="sm:col-span-5">
              <button
                type="submit"
                disabled={isSavingExp}
                className="w-full py-2 px-3 rounded-lg bg-[#0B5D32] hover:bg-[#084725] disabled:bg-gray-300 text-white font-black flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSavingExp ? (isAr ? 'جاري التسجيل...' : 'Saving...') : isAr ? 'قيد مصروف من العهدة' : 'Log Expense'}</span>
              </button>
            </div>
          </form>

          {vanExpenses.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#5F7164]">
              {isAr ? 'لا توجد مصاريف ميدانية مسجلة اليوم' : 'No field expenses logged today'}
            </div>
          ) : (
            <div className="divide-y divide-[#EAEFEA]">
              {vanExpenses.map((exp) => (
                <div key={exp.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="font-bold text-[#142018] truncate">{exp.description}</div>
                    <div className="text-[10.5px] text-[#5F7164] mt-0.5">
                      {categoryLabel(exp.category)}
                      {exp.receiptRef ? ` · ${exp.receiptRef}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-black text-[#DC2626] tabular-nums">
                      -{formatCurrency(exp.amountIQD, currency, language)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-1.5 rounded-lg bg-[#F8FAF7] hover:bg-red-50 text-[#5F7164] hover:text-[#DC2626] cursor-pointer"
                      title={isAr ? 'حذف المصروف' : 'Delete Expense'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vehicle Odometer, Chiller & Checklist */}
        <form
          onSubmit={handleSaveVehicleCheck}
          className="lg:col-span-5 bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3 text-xs"
        >
          <h3 className="font-black text-sm text-[#142018] flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-[#0B5D32]" />
            <span>{isAr ? 'عداد المركبة، التبريد وفحص السلامة' : 'Odometer, Cold-Chain & Inspection'}</span>
          </h3>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10.5px] font-bold text-[#5F7164] block mb-1">
                {isAr ? 'عداد البداية (كم)' : 'Odometer Start (km)'}
              </label>
              <input
                type="number"
                value={odoStart}
                onChange={(e) => setOdoStart(e.target.value)}
                className="w-full bg-[#F8FAF7] border border-[#DCE5DC] rounded-xl px-2.5 py-2 font-mono font-bold tabular-nums"
              />
            </div>
            <div>
              <label className="text-[10.5px] font-bold text-[#5F7164] block mb-1">
                {isAr ? 'العداد الحالي / النهاية (كم)' : 'Current Odometer (km)'}
              </label>
              <input
                type="number"
                value={odoEnd}
                onChange={(e) => setOdoEnd(e.target.value)}
                className="w-full bg-[#F8FAF7] border border-[#DCE5DC] rounded-xl px-2.5 py-2 font-mono font-bold tabular-nums"
              />
            </div>
            <div>
              <label className="text-[10.5px] font-bold text-[#5F7164] block mb-1">
                {isAr ? 'مستوى الوقود (%)' : 'Fuel Level (%)'}
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={fuelPct}
                onChange={(e) => setFuelPct(e.target.value)}
                className="w-full bg-[#F8FAF7] border border-[#DCE5DC] rounded-xl px-2.5 py-2 font-mono font-bold tabular-nums"
              />
            </div>
            <div>
              <label className="text-[10.5px] font-bold text-[#5F7164] flex items-center gap-1 mb-1">
                <ThermometerSnowflake className="w-3.5 h-3.5 text-[#0B5D32]" />
                <span>{isAr ? 'حرارة الصندوق (°C)' : 'Chiller Temp (°C)'}</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={chillerTemp}
                onChange={(e) => setChillerTemp(e.target.value)}
                className="w-full bg-[#F8FAF7] border border-[#DCE5DC] rounded-xl px-2.5 py-2 font-mono font-bold text-[#0B5D32] tabular-nums"
              />
            </div>
          </div>

          <div className="bg-[#F8FAF7] border border-[#EAEFEA] rounded-xl p-3 space-y-2">
            <div className="text-[11px] font-black text-[#142018]">
              {isAr ? 'قائمة الفحص اليومي قبل الانطلاق:' : 'Pre-Trip Safety Checklist:'}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: isAr ? 'سلامة الإطارات والمكابح' : 'Tires & Brakes OK', state: tiresOk, set: setTiresOk },
                { label: isAr ? 'كفاءة جهاز التبريد' : 'Chiller Unit OK', state: chillerOk, set: setChillerOk },
                { label: isAr ? 'الإنارة والإشارات' : 'Lights & Signals OK', state: lightsOk, set: setLightsOk },
                { label: isAr ? 'نظافة الصندوق الغذائي' : 'Cargo Hygiene OK', state: hygieneOk, set: setHygieneOk }
              ].map((chk, idx) => (
                <label key={idx} className="flex items-center gap-1.5 font-semibold text-[#142018] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={chk.state}
                    onChange={(e) => chk.set(e.target.checked)}
                    className="accent-[#0B5D32]"
                  />
                  <span>{chk.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSavingVehicle}
            className="w-full py-2.5 rounded-xl bg-[#0B5D32] hover:bg-[#084725] disabled:bg-gray-300 text-white font-black cursor-pointer"
          >
            {isSavingVehicle ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isAr ? 'حفظ قراءة المركبة والفحص' : 'Save Vehicle Check'}
          </button>
        </form>
      </div>

      {/* Historical Z-Reports / Shift Close Log */}
      <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-[#142018] flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-[#0B5D32]" />
            <span>{isAr ? 'سجل تقارير إغلاق الورديات السابقة (Z-Reports)' : 'Shift Close Z-Report History'}</span>
          </h3>
          <span className="text-[11px] font-mono font-bold text-[#5F7164] tabular-nums">
            {shiftReports.length}
          </span>
        </div>

        {shiftReports.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#5F7164]">
            {isAr ? 'لم يتم إغلاق أي وردية سابقة بعد' : 'No closed shift reports yet'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start border-collapse">
              <thead>
                <tr className="border-b border-[#DCE5DC] text-[11px] text-[#5F7164] font-bold">
                  <th className="py-2 px-2 text-start">{isAr ? 'رقم التقرير والتاريخ' : 'Report & Date'}</th>
                  <th className="py-2 px-2 text-end">{isAr ? 'المتوقع' : 'Expected'}</th>
                  <th className="py-2 px-2 text-end">{isAr ? 'الفعلي' : 'Actual'}</th>
                  <th className="py-2 px-2 text-end">{isAr ? 'الفرق' : 'Variance'}</th>
                  <th className="py-2 px-2 text-center">{isAr ? 'الوحدات المباعة' : 'Sold Units'}</th>
                  <th className="py-2 px-2 text-end">{isAr ? 'الاعتماد' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEFEA]">
                {shiftReports.map((rep) => (
                  <tr key={rep.id}>
                    <td className="py-2.5 px-2">
                      <div className="font-mono font-black text-[#0B5D32]">{rep.id}</div>
                      <div className="text-[10.5px] text-[#5F7164]">
                        {new Date(rep.date).toLocaleDateString(isAr ? 'ar-IQ' : 'en-US')}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-end font-mono tabular-nums">
                      {formatCurrency(rep.expectedCashIQD, currency, language)}
                    </td>
                    <td className="py-2.5 px-2 text-end font-mono tabular-nums font-bold">
                      {formatCurrency(rep.actualCashIQD, currency, language)}
                    </td>
                    <td
                      className={`py-2.5 px-2 text-end font-mono tabular-nums font-black ${
                        rep.cashVarianceIQD === 0
                          ? 'text-[#0B5D32]'
                          : rep.cashVarianceIQD > 0
                          ? 'text-blue-700'
                          : 'text-[#DC2626]'
                      }`}
                    >
                      {formatCurrency(rep.cashVarianceIQD, currency, language)}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono tabular-nums">
                      {rep.totalDirectVanSales}
                    </td>
                    <td className="py-2.5 px-2 text-end">
                      <span
                        className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-md ${
                          rep.status === 'settled'
                            ? 'bg-[#ECFDF5] text-[#065F46]'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>
                          {rep.status === 'settled'
                            ? isAr ? 'معتمد ومطابق' : 'Settled'
                            : isAr ? 'بانتظار المحاسب' : 'Pending Audit'}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
