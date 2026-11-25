import React, { useMemo, useState } from 'react';
import {
  Users,
  Wallet,
  Banknote,
  Clock,
  Printer,
  UserPlus,
  ShoppingCart,
  Search,
  AlertTriangle,
  Phone,
  MapPin,
  ShieldAlert
} from 'lucide-react';
import { Currency, Language } from '../types/index.ts';
import { formatCurrency } from '../utils/format.ts';

interface VanCustomersCreditPanelProps {
  driverId: string;
  stores: any[];
  creditAccounts: any[];
  vanTransactions: any[];
  currency: Currency;
  language: Language;
  collectStoreId: string;
  onSelectCollectStore: (storeId: string) => void;
  onStartSaleForStore: (storeId: string) => void;
  onRefreshVanData: () => Promise<void>;
  onOpenReceipt: (tx: any) => void;
  onFeedback: (fb: { type: 'success' | 'error'; text: string }) => void;
}

export const VanCustomersCreditPanel: React.FC<VanCustomersCreditPanelProps> = ({
  driverId,
  stores,
  creditAccounts,
  vanTransactions,
  currency,
  language,
  collectStoreId,
  onSelectCollectStore,
  onStartSaleForStore,
  onRefreshVanData,
  onOpenReceipt,
  onFeedback
}) => {
  const isAr = language === 'ar';
  const [customerSearch, setCustomerSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'with_debt' | 'blocked'>('all');

  // Collection form
  const [collectAmountInput, setCollectAmountInput] = useState('');
  const [collectNotes, setCollectNotes] = useState('');
  const [isCollectingDebt, setIsCollectingDebt] = useState(false);

  // New Customer Onboarding form
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newName, setNewName] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDistrict, setNewDistrict] = useState(isAr ? 'المنصور' : 'Al-Mansoor');
  const [newAddress, setNewAddress] = useState('');
  const [newStoreType, setNewStoreType] = useState<'supermarket' | 'grocery' | 'wholesale_sub'>('grocery');
  const [newCreditLimit, setNewCreditLimit] = useState('1000000');
  const [addToRoute, setAddToRoute] = useState(true);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  const enrichedCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    return stores
      .map((st) => {
        const credit = creditAccounts.find((c) => c.storeId === st.id) || null;
        return { store: st, credit };
      })
      .filter(({ store, credit }) => {
        if (filterMode === 'with_debt' && (!credit || credit.currentUsedCreditIQD <= 0)) {
          return false;
        }
        if (filterMode === 'blocked' && !credit?.isBlocked) {
          return false;
        }
        if (!q) return true;
        return (
          (store.name || '').toLowerCase().includes(q) ||
          (store.ownerName || '').toLowerCase().includes(q) ||
          (store.district || '').toLowerCase().includes(q) ||
          (store.phone || '').toLowerCase().includes(q)
        );
      });
  }, [stores, creditAccounts, customerSearch, filterMode]);

  const totals = useMemo(() => {
    const totalReceivables = creditAccounts.reduce((s, c) => s + (c.currentUsedCreditIQD || 0), 0);
    const totalOverdue60 = creditAccounts.reduce(
      (s, c) => s + (c.aging?.bucket61_90 || 0) + (c.aging?.bucket90Plus || 0),
      0
    );
    const blockedCount = creditAccounts.filter((c) => c.isBlocked).length;
    return { totalReceivables, totalOverdue60, blockedCount };
  }, [creditAccounts]);

  const selectedCreditAcc = creditAccounts.find((c) => c.storeId === collectStoreId);

  const handleCollectDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(collectAmountInput);
    if (!collectStoreId || !amount || amount <= 0 || isCollectingDebt) return;
    setIsCollectingDebt(true);

    try {
      const res = await fetch('/api/van/debt-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          storeId: collectStoreId,
          amountIQD: amount,
          notes: collectNotes
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (isAr ? 'فشل تسجيل تحصيل الدين' : 'Debt collection failed'));
      }
      setCollectAmountInput('');
      setCollectNotes('');
      onFeedback({
        type: 'success',
        text: isAr
          ? `تم تحصيل ${formatCurrency(amount, currency, language)} نقداً وتحديث دفتر الأستاذ وعهدة الفان.`
          : `Collected ${formatCurrency(amount, currency, language)} cash and updated ledger.`
      });
      if (data.data?.transaction) {
        onOpenReceipt(data.data.transaction);
      }
      await onRefreshVanData();
    } catch (err: any) {
      onFeedback({
        type: 'error',
        text: err?.message || (isAr ? 'تعذر تسجيل التحصيل' : 'Collection error')
      });
    } finally {
      setIsCollectingDebt(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingCustomer) return;
    setIsCreatingCustomer(true);
    try {
      const res = await fetch('/api/van/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          name: newName,
          ownerName: newOwner,
          phone: newPhone,
          district: newDistrict,
          address: newAddress,
          storeType: newStoreType,
          creditLimitIQD: Number(newCreditLimit) || 0,
          addToRoute
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (isAr ? 'تعذر تسجيل الزبون' : 'Failed to register customer'));
      }
      setNewName('');
      setNewOwner('');
      setNewPhone('');
      setNewAddress('');
      setShowAddCustomer(false);
      onFeedback({
        type: 'success',
        text: data.message || (isAr ? 'تمت إضافة المحل بنجاح' : 'Customer registered successfully')
      });
      if (data.data?.store?.id) {
        onSelectCollectStore(data.data.store.id);
      }
      await onRefreshVanData();
    } catch (err: any) {
      onFeedback({
        type: 'error',
        text: err?.message || (isAr ? 'حدث خطأ أثناء التسجيل' : 'Customer creation failed')
      });
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Header & Field Onboarding Trigger */}
      <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-black text-[#142018] flex items-center gap-2">
            <Users className="w-4.5 h-4.5 text-[#0B5D32]" />
            <span>{isAr ? 'إدارة العملاء، أعمار الديون والتحصيل الميداني' : 'Wholesale Accounts, Aging & Collections'}</span>
          </h2>
          <p className="text-[11px] text-[#5F7164] mt-0.5">
            {isAr
              ? 'مراقبة حدود الائتمان، أعمار الذمم المستحقة، تحصيل الدفعات، وتسجيل محلات جديدة بالمنطقة.'
              : 'Monitor credit exposure, aging buckets, collect cash payments, and onboard field stores.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddCustomer((v) => !v)}
          className="px-3.5 py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084725] text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isAr ? 'تسجيل محل / زبون جديد' : 'Register Field Store'}</span>
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3">
          <div className="text-[10.5px] font-bold text-[#5F7164]">
            {isAr ? 'إجمالي الذمم بالسوق' : 'Total Receivables'}
          </div>
          <div className="text-sm sm:text-base font-black font-mono tabular-nums text-[#142018] mt-1">
            {formatCurrency(totals.totalReceivables, currency, language)}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3">
          <div className="text-[10.5px] font-bold text-[#5F7164]">
            {isAr ? 'متأخرات +60 يوماً' : '60+ Days Overdue'}
          </div>
          <div className="text-sm sm:text-base font-black font-mono tabular-nums text-[#DC2626] mt-1">
            {formatCurrency(totals.totalOverdue60, currency, language)}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3">
          <div className="text-[10.5px] font-bold text-[#5F7164]">
            {isAr ? 'حسابات موقوفة ائتمانياً' : 'Blocked Accounts'}
          </div>
          <div className="text-sm sm:text-base font-black font-mono tabular-nums text-amber-700 mt-1">
            {totals.blockedCount} {isAr ? `من ${creditAccounts.length}` : `of ${creditAccounts.length}`}
          </div>
        </div>
      </div>

      {/* Register New Store Form */}
      {showAddCustomer && (
        <form
          onSubmit={handleCreateCustomer}
          className="bg-white rounded-2xl border border-[#0B5D32]/40 p-4 space-y-3 text-xs"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-[#0B5D32]">
              {isAr ? 'فتح ملف محل / عميل جملة جديد ميدانياً' : 'Onboard New Wholesale Customer'}
            </h3>
            <button
              type="button"
              onClick={() => setShowAddCustomer(false)}
              className="text-xs font-bold text-[#5F7164] hover:text-[#142018] cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="font-bold text-[#4B6352] block mb-1">
                {isAr ? 'اسم السوبرماركت / المحل *' : 'Store Name *'}
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={isAr ? 'مثال: أسواق النهرين الحديثة' : 'e.g. Al-Nahrain Market'}
                className="w-full bg-[#F8FAF7] border border-[#DCE5DC] rounded-xl px-3 py-2 focus:outline-hidden focus:border-[#0B5D32]"
              />
            </div>
            <div>
              <label className="font-bold text-[#4B6352] block mb-1">
                {isAr ? 'اسم المالك / المسؤول *' : 'Owner Name *'}
              </label>
              <input
                type="text"
                required
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                placeholder={isAr ? 'مثال: حيدر عباس' : 'Owner full name'}
                className="w-full bg-[#F8FAF7] border border-[#DCE5DC] rounded-xl px-3 py-2 focus:outline-hidden focus:border-[#0B5D32]"
              />
            </div>
            <div>
              <label className="font-bold text-[#4B6352] block mb-1">
                {isAr ? 'رقم الهاتف *' : 'Phone *'}
              </label>
              <input
                type="text"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="0770 123 4567"
                dir="ltr"
                className="w-full bg-[#F8FAF7] border border-[#DCE5DC] rounded-xl px-3 py-2 font-mono focus:outline-hidden focus:border-[#0B5D32]"
              />
            </div>
            <div>
              <label className="font-bold text-[#4B6352] block mb-1">
                {isAr ? 'المنطقة / القاطع' : 'District'}
              </label>
              <input
                type="text"
                value={newDistrict}
                onChange={(e) => setNewDistrict(e.target.value)}
                className="w-full bg-[#F8FAF7] border border-[#DCE5DC] rounded-xl px-3 py-2 focus:outline-hidden focus:border-[#0B5D32]"
              />
            </div>
            <div>
              <label className="font-bold text-[#4B6352] block mb-1">
                {isAr ? 'العنوان التفصيلي' : 'Address'}
              </label>
              <input
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder={isAr ? 'الشارع الرئيسي، قرب...' : 'Street / landmark'}
                className="w-full bg-[#F8FAF7] border border-[#DCE5DC] rounded-xl px-3 py-2 focus:outline-hidden focus:border-[#0B5D32]"
              />
            </div>
            <div>
              <label className="font-bold text-[#4B6352] block mb-1">
                {isAr ? 'تصنيف النشاط' : 'Store Tier'}
              </label>
              <select
                value={newStoreType}
                onChange={(e) => setNewStoreType(e.target.value as any)}
                className="w-full bg-[#F8FAF7] border border-[#DCE5DC] rounded-xl px-3 py-2 font-bold focus:outline-hidden focus:border-[#0B5D32]"
              >
                <option value="grocery">{isAr ? 'ماركت / بقالة حي' : 'Neighborhood Grocery'}</option>
                <option value="supermarket">{isAr ? 'سوبرماركت مركزي' : 'Supermarket'}</option>
                <option value="wholesale_sub">{isAr ? 'تاجر جملة فرعي' : 'Sub-Wholesaler'}</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="font-bold text-[#4B6352]">
                  {isAr ? 'سقف الائتمان المبدئي (د.ع):' : 'Starter Credit Limit:'}
                </label>
                <input
                  type="number"
                  min={0}
                  max={20000000}
                  step={250000}
                  value={newCreditLimit}
                  onChange={(e) => setNewCreditLimit(e.target.value)}
                  className="w-36 bg-[#F8FAF7] border border-[#DCE5DC] rounded-lg px-2.5 py-1.5 font-mono font-bold text-[#0B5D32]"
                />
              </div>

              <label className="flex items-center gap-1.5 font-bold text-[#142018] cursor-pointer">
                <input
                  type="checkbox"
                  checked={addToRoute}
                  onChange={(e) => setAddToRoute(e.target.checked)}
                  className="accent-[#0B5D32]"
                />
                <span>{isAr ? 'إضافة تلقائية لخط سير اليوم' : 'Add to today route'}</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isCreatingCustomer}
              className="px-5 py-2.5 rounded-xl bg-[#0B5D32] hover:bg-[#084725] disabled:bg-gray-300 text-white font-black cursor-pointer"
            >
              {isCreatingCustomer
                ? isAr ? 'جاري التسجيل...' : 'Saving...'
                : isAr ? 'اعتماد وفتح ملف العميل' : 'Save Customer'}
            </button>
          </div>
        </form>
      )}

      {/* Main Split: Customer Directory & Aging (Left 7) + Cash Collection & Receipts (Right 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-[#5F7164] absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder={isAr ? 'ابحث باسم المحل، المالك، المنطقة أو الهاتف...' : 'Search stores...'}
                className="w-full bg-[#F8FAF7] border border-[#DCE5DC] focus:border-[#0B5D32] rounded-xl py-2 ps-9 pe-3 text-xs focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl p-1 text-[11px] font-bold shrink-0">
              {(
                [
                  { id: 'all', label: isAr ? 'الكل' : 'All' },
                  { id: 'with_debt', label: isAr ? 'عليه ذمم' : 'With Debt' },
                  { id: 'blocked', label: isAr ? 'موقوف' : 'Blocked' }
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterMode(f.id)}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                    filterMode === f.id ? 'bg-[#0B5D32] text-white' : 'text-[#5F7164] hover:text-[#142018]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-[#EAEFEA]">
            {enrichedCustomers.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#5F7164]">
                {isAr ? 'لا توجد حسابات مطابقة للبحث' : 'No matching stores found'}
              </div>
            ) : (
              enrichedCustomers.map(({ store, credit }) => {
                const used = credit?.currentUsedCreditIQD || 0;
                const limit = credit?.creditLimitIQD || 0;
                const utilPct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
                const isSelected = collectStoreId === store.id;

                return (
                  <div
                    key={store.id}
                    className={`py-3.5 first:pt-1 last:pb-1 space-y-2.5 ${
                      isSelected ? 'bg-[#ECFDF5]/35 -mx-2 px-2 rounded-xl' : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-xs sm:text-sm text-[#142018]">
                            {store.name}
                          </span>
                          {credit?.isBlocked && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#DC2626] bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                              <ShieldAlert className="w-3 h-3" />
                              <span>{isAr ? 'موقوف ائتمانياً' : 'Credit Blocked'}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#5F7164] flex items-center gap-2 flex-wrap">
                          <span>{store.ownerName}</span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#0B5D32]" />
                            {store.district}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 font-mono" dir="ltr">
                            <Phone className="w-3 h-3" />
                            {store.phone}
                          </span>
                        </div>
                      </div>

                      <div className="text-start sm:text-end shrink-0">
                        <div className="text-[10px] font-bold text-[#5F7164]">
                          {isAr ? 'الرصيد المستحق' : 'Balance Due'}
                        </div>
                        <div
                          className={`text-sm font-black font-mono tabular-nums ${
                            used > 0 ? 'text-amber-800' : 'text-[#0B5D32]'
                          }`}
                        >
                          {formatCurrency(used, currency, language)}
                        </div>
                      </div>
                    </div>

                    {credit && limit > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10.5px] text-[#5F7164] font-mono tabular-nums">
                          <span>
                            {isAr ? 'استهلاك الائتمان:' : 'Utilization:'} {utilPct}%
                          </span>
                          <span>
                            {isAr ? 'السقف:' : 'Limit:'} {formatCurrency(limit, currency, language)}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[#EAEFEA] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              credit.isBlocked || utilPct >= 90
                                ? 'bg-[#DC2626]'
                                : utilPct >= 65
                                ? 'bg-[#D97706]'
                                : 'bg-[#0B5D32]'
                            }`}
                            style={{ width: `${utilPct}%` }}
                          />
                        </div>
                        {used > 0 && credit.aging && (
                          <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono tabular-nums text-[#5F7164] pt-0.5">
                            <span>0-30d: {formatCurrency(credit.aging.bucket0_30, currency, language)}</span>
                            <span aria-hidden="true">·</span>
                            <span>31-60d: {formatCurrency(credit.aging.bucket31_60, currency, language)}</span>
                            {(credit.aging.bucket61_90 > 0 || credit.aging.bucket90Plus > 0) && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-[#DC2626] font-bold inline-flex items-center gap-0.5">
                                  <AlertTriangle className="w-3 h-3" />
                                  +60d:{' '}
                                  {formatCurrency(
                                    credit.aging.bucket61_90 + credit.aging.bucket90Plus,
                                    currency,
                                    language
                                  )}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onStartSaleForStore(store.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#0B5D32] hover:bg-[#084725] text-white text-[11px] font-black flex items-center gap-1 cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{isAr ? 'بدء فاتورة بيع' : 'Start POS Sale'}</span>
                      </button>

                      {credit && used > 0 && (
                        <button
                          type="button"
                          onClick={() => onSelectCollectStore(store.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#FFE600] hover:bg-yellow-400 text-[#142018] text-[11px] font-black flex items-center gap-1 cursor-pointer"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>{isAr ? 'تحصيل دفعة' : 'Collect Payment'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 5 Cols: Debt Collection Form + Recent Van Receipts */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#0B5D32]" />
              <h3 className="font-black text-sm text-[#142018]">
                {isAr ? 'تحصيل دفعة نقدية (سند قبض ميداني)' : 'Field Cash Collection'}
              </h3>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#4B6352] block mb-1">
                {isAr ? 'المتجر المراد التحصيل منه:' : 'Select Customer:'}
              </label>
              <select
                value={collectStoreId}
                onChange={(e) => onSelectCollectStore(e.target.value)}
                className="w-full bg-[#F8FAF7] border border-[#DCE5DC] rounded-xl px-3 py-2 text-xs font-bold focus:outline-hidden focus:border-[#0B5D32]"
              >
                {creditAccounts.map((acc) => (
                  <option key={acc.id} value={acc.storeId}>
                    {acc.storeName} ({formatCurrency(acc.currentUsedCreditIQD, currency, language)})
                  </option>
                ))}
              </select>
            </div>

            {selectedCreditAcc ? (
              <form onSubmit={handleCollectDebt} className="space-y-3 text-xs">
                <div className="bg-[#F8FAF7] border border-[#EAEFEA] rounded-xl p-2.5 flex items-center justify-between">
                  <span className="text-[#5F7164] font-bold">
                    {isAr ? 'الرصيد المستحق:' : 'Current Balance:'}
                  </span>
                  <span className="font-mono font-black text-amber-800 tabular-nums">
                    {formatCurrency(selectedCreditAcc.currentUsedCreditIQD, currency, language)}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#4B6352]">
                      {isAr ? 'المبلغ المستلم نقداً (د.ع):' : 'Cash Received (IQD):'}
                    </label>
                    {selectedCreditAcc.currentUsedCreditIQD > 0 && (
                      <div className="flex items-center gap-1">
                        {[0.25, 0.5, 1].map((ratio) => (
                          <button
                            key={ratio}
                            type="button"
                            onClick={() =>
                              setCollectAmountInput(
                                String(
                                  Math.max(
                                    1000,
                                    Math.round((selectedCreditAcc.currentUsedCreditIQD * ratio) / 1000) * 1000
                                  )
                                )
                              )
                            }
                            className="px-2 py-0.5 rounded bg-[#F4F4EA] hover:bg-[#0B5D32] hover:text-white text-[10px] font-bold text-[#4B6352] cursor-pointer"
                          >
                            {ratio === 1 ? (isAr ? 'كامل' : 'Full') : `${ratio * 100}%`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="number"
                    required
                    min={1000}
                    max={Math.max(1000, selectedCreditAcc.currentUsedCreditIQD)}
                    value={collectAmountInput}
                    onChange={(e) => setCollectAmountInput(e.target.value)}
                    placeholder="500000"
                    className="w-full bg-[#F8FAF7] border border-[#DCE5DC] focus:border-[#0B5D32] rounded-xl p-2.5 font-mono font-black text-base text-[#0B5D32] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#4B6352] block mb-1">
                    {isAr ? 'ملاحظات السند (اختياري):' : 'Receipt Note:'}
                  </label>
                  <input
                    type="text"
                    value={collectNotes}
                    onChange={(e) => setCollectNotes(e.target.value)}
                    placeholder={isAr ? 'دفعة نقدية من الحساب الجاري' : 'Partial payment note'}
                    className="w-full bg-[#F8FAF7] border border-[#DCE5DC] focus:border-[#0B5D32] rounded-xl p-2 text-xs focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCollectingDebt || selectedCreditAcc.currentUsedCreditIQD <= 0}
                  className="w-full py-2.5 rounded-xl bg-[#0B5D32] hover:bg-[#084725] disabled:bg-gray-300 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Banknote className="w-4 h-4" />
                  <span>
                    {isCollectingDebt
                      ? isAr ? 'جاري الترحيل...' : 'Posting...'
                      : isAr ? 'تأكيد القبض وإصدار الوصل' : 'Confirm Collection'}
                  </span>
                </button>
              </form>
            ) : (
              <div className="text-xs text-[#5F7164] py-4 text-center">
                {isAr ? 'لا يوجد حساب ائتماني محدد' : 'No credit account selected'}
              </div>
            )}
          </div>

          {/* Today's Transactions List */}
          <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-[#142018] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#0B5D32]" />
                <span>{isAr ? 'سجل وصولات الفان اليوم' : "Today's Van Receipts"}</span>
              </h3>
              <span className="text-[11px] font-mono font-bold text-[#5F7164] tabular-nums">
                {vanTransactions.length}
              </span>
            </div>

            {vanTransactions.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#5F7164]">
                {isAr ? 'لا توجد عمليات اليوم' : 'No transactions today'}
              </div>
            ) : (
              <div className="divide-y divide-[#EAEFEA] max-h-72 overflow-y-auto">
                {vanTransactions.map((tx) => (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="font-mono font-black text-[#0B5D32]">{tx.receiptNumber}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-bold text-[#5F7164]">
                          {tx.type === 'debt_collection'
                            ? isAr ? 'تحصيل آجل' : 'Collection'
                            : isAr ? 'بيع مباشر' : 'Direct Sale'}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#142018] truncate mt-0.5">
                        {tx.storeName}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-black text-xs tabular-nums">
                        {formatCurrency(tx.totalAmountIQD, currency, language)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenReceipt(tx)}
                        className="p-1.5 rounded-lg bg-[#F4F4EA] hover:bg-[#0B5D32] hover:text-white text-[#4B6352] cursor-pointer"
                        title={isAr ? 'عرض وطباعة الوصل' : 'View Receipt'}
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
