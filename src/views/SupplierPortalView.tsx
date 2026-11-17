import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CreditCard, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  RotateCcw, 
  Plus, 
  Truck, 
  User, 
  DollarSign, 
  Lock, 
  Unlock,
  PackageCheck,
  Send
} from 'lucide-react';
import { CreditAccountItem, CreditUpgradeRequestItem, LedgerEntryItem, Currency, OrderItem, Language } from '../types/index.ts';
import { formatCurrency, formatDate } from '../utils/format.ts';
import { getLocalizedText } from '../utils/translations.ts';

interface SupplierPortalViewProps {
  currency: Currency;
  orders: OrderItem[];
  onRefreshOrders: () => void;
  language?: Language;
}

export const SupplierPortalView: React.FC<SupplierPortalViewProps> = ({
  currency,
  orders,
  onRefreshOrders,
  language = 'ar'
}) => {
  const isAr = language === 'ar';
  const [activeSubTab, setActiveSubTab] = useState<'credit' | 'orders' | 'vans'>('credit');
  const [creditAccounts, setCreditAccounts] = useState<CreditAccountItem[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntryItem[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReceipt, setPaymentReceipt] = useState('');

  const [showReversalModal, setShowReversalModal] = useState(false);
  const [reversalTargetEntry, setReversalTargetEntry] = useState<LedgerEntryItem | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [upgradeRequests, setUpgradeRequests] = useState<CreditUpgradeRequestItem[]>([]);
  const [resolvingReqId, setResolvingReqId] = useState<string | null>(null);

  // Fetch accounts and platform upgrade recommendations on load
  const loadCreditAccounts = async () => {
    try {
      const [accRes, upRes] = await Promise.all([
        fetch('/api/credit/accounts?supplierId=supp_rafidain'),
        fetch('/api/credit/upgrade-requests?supplierId=supp_rafidain')
      ]);
      const data = await accRes.json();
      if (data.success) {
        setCreditAccounts(data.data);
        if (data.data.length > 0 && !selectedAccountId) {
          setSelectedAccountId(data.data[0].id);
        }
      }
      const upData = await upRes.json();
      if (upData.success) {
        setUpgradeRequests(upData.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCreditAccounts();
  }, []);

  // Fetch ledger when selected account changes
  useEffect(() => {
    if (!selectedAccountId) return;
    setLoadingLedger(true);
    fetch(`/api/credit/ledger/${selectedAccountId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLedgerEntries(data.data);
        }
      })
      .finally(() => setLoadingLedger(false));
  }, [selectedAccountId]);

  const selectedAccount = creditAccounts.find(c => c.id === selectedAccountId);

  // Handle Record Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || !paymentAmount) return;

    try {
      const res = await fetch('/api/credit/ledger/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditAccountId: selectedAccountId,
          amountIQD: Number(paymentAmount),
          receiptNumber: paymentReceipt || `RCT-${Date.now()}`
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowPaymentModal(false);
        setPaymentAmount('');
        setPaymentReceipt('');
        setStatusMessage('تم تسجيل دفعة التسديد بنجاح وتطبيقها على أقدم الفواتير (FIFO)');
        loadCreditAccounts();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Reversing Entry (قيد عكسي)
  const handleCreateReversal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversalTargetEntry || !reversalReason) return;

    try {
      const res = await fetch('/api/credit/ledger/reversal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryId: reversalTargetEntry.id,
          reason: reversalReason
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowReversalModal(false);
        setReversalTargetEntry(null);
        setReversalReason('');
        setStatusMessage('تم تسجيل القيد العكسي لتصحيح السجل المحاسبي دون المساس بالتاريخ.');
        loadCreditAccounts();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Toggle Exception / Block Override
  const handleToggleException = async (account: CreditAccountItem) => {
    try {
      const res = await fetch(`/api/credit/accounts/${account.id}/limit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newLimitIQD: account.creditLimitIQD,
          allowException: !account.supplierExceptionAllowed
        })
      });
      const data = await res.json();
      if (data.success) {
        loadCreditAccounts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Resolve Platform-Mediated Credit Upgrade Request
  const handleResolveUpgradeRequest = async (
    requestId: string,
    decision: 'approved' | 'deferred_by_policy',
    approvedLimitIQD?: number
  ) => {
    setResolvingReqId(requestId);
    try {
      const res = await fetch(`/api/credit/upgrade-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, approvedLimitIQD })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(
          decision === 'approved'
            ? (isAr
                ? 'تم اعتماد السقف الائتماني الجديد وإشعار المتجر بتأهيله رسمياً.'
                : 'Proposed credit limit approved and store notified.')
            : (isAr
                ? 'تم إرسال الرد الدبلوماسي وفق سياسة المنصة دون أي إحراج مباشر مع المتجر.'
                : 'Diplomatic policy response sent via platform guidelines without direct friction.')
        );
        await loadCreditAccounts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingReqId(null);
    }
  };

  // Order status progression
  const handleProgressOrder = async (orderId: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        onRefreshOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const incomingOrders = orders.filter(o => o.supplierId === 'supp_rafidain');

  return (
    <div className="space-y-6">
      
      {/* Supplier Company Banner */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 font-brand">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#00A046] text-white flex items-center justify-center shadow-xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-[#1F2328]">
                {isAr ? 'شركة الرافدين للتجارة العامة والأغذية' : 'Al-Rafidain General Trading & Food Co.'}
              </h1>
              <span className="text-[11px] bg-emerald-50 text-[#00A046] border border-[#00A046]/20 px-2 py-0.5 rounded-full font-semibold">
                {isAr ? 'مورد رئيسي موثق' : 'Verified Master Supplier'}
              </span>
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              {isAr 
                ? 'بغداد - الشورجة | إدارة الحسابات الائتمانية الآجلة، أسطول الفانات، والطلبيات الواردة'
                : 'Baghdad - Shorja | Commercial credit lines, append-only ledgers, van fleet, and incoming wholesale orders'}
            </p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('credit')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeSubTab === 'credit' ? 'bg-[#00A046] text-white shadow-xs' : 'text-[#6B7280] hover:text-[#1F2328]'
            }`}
          >
            {isAr ? 'نظام الائتمان ودفتر الأستاذ' : 'Credit & Ledger System'}
          </button>
          <button
            onClick={() => setActiveSubTab('orders')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeSubTab === 'orders' ? 'bg-[#00A046] text-white shadow-xs' : 'text-[#6B7280] hover:text-[#1F2328]'
            }`}
          >
            {isAr ? `الطلبيات الواردة (${incomingOrders.length})` : `Incoming Orders (${incomingOrders.length})`}
          </button>
          <button
            onClick={() => setActiveSubTab('vans')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeSubTab === 'vans' ? 'bg-[#00A046] text-white shadow-xs' : 'text-[#6B7280] hover:text-[#1F2328]'
            }`}
          >
            {isAr ? 'أسطول الفانات والمناديب' : 'Van Fleet & Reps'}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-[#00A046] rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      {/* SUB-TAB 1: PROFESSIONAL CREDIT & LEDGER SYSTEM */}
      {activeSubTab === 'credit' && (() => {
        const pendingUpgradeRequests = upgradeRequests.filter(r => r.status === 'platform_review');
        const selectedAccountUpgrades = selectedAccount
          ? upgradeRequests.filter(r => r.creditAccountId === selectedAccount.id)
          : [];

        return (
        <div className="space-y-4">
          {pendingUpgradeRequests.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-start sm:items-center gap-2 text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  {isAr
                    ? `لديك ${pendingUpgradeRequests.length} توصية مالية من لجنة المنصة لمراجعة سقف الائتمان دون تواصل محرج مع التاجر.`
                    : `You have ${pendingUpgradeRequests.length} platform credit committee recommendation(s) awaiting discreet review.`}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {pendingUpgradeRequests.map((req) => (
                  <button
                    key={req.id}
                    type="button"
                    onClick={() => setSelectedAccountId(req.creditAccountId)}
                    className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                      selectedAccountId === req.creditAccountId
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    {req.storeName}
                  </button>
                ))}
              </div>
            </div>
          )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Store Credit Accounts List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-[#1F2328]">
                {isAr ? 'المتاجر والخطوط الائتمانية' : 'Stores & Credit Lines'}
              </h3>
              <span className="text-[11px] text-[#6B7280]">
                {creditAccounts.length} {isAr ? 'متاجر' : 'stores'}
              </span>
            </div>

            <div className="space-y-2.5">
              {creditAccounts.map((acc) => {
                const isSelected = acc.id === selectedAccountId;
                const hasOverdue = acc.aging.bucket31_60 > 0 || acc.aging.bucket61_90 > 0 || acc.aging.bucket90Plus > 0;
                const hasPendingReview = upgradeRequests.some(
                  r => r.creditAccountId === acc.id && r.status === 'platform_review'
                );

                return (
                  <div
                    key={acc.id}
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={`p-3.5 rounded-xl border text-right cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#00A046] bg-white shadow-sm ring-1 ring-[#00A046]'
                        : 'border-[#E5E7EB] bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5 gap-1">
                      <span className="font-bold text-xs text-[#1F2328]">{acc.storeName}</span>
                      <div className="flex items-center gap-1">
                        {hasPendingReview && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            {isAr ? 'مراجعة سقف' : 'Review'}
                          </span>
                        )}
                        {acc.isBlocked ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-red-100 text-[#B91C1C] px-2 py-0.5 rounded-full">
                            <Lock className="w-2.5 h-2.5" />
                            <span>{isAr ? 'حساب موقوف' : 'Account Blocked'}</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-green-100 text-[#15803D] px-2 py-0.5 rounded-full">
                            <Unlock className="w-2.5 h-2.5" />
                            <span>{isAr ? 'نشط' : 'Active'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-[#6B7280]">
                        <span>{isAr ? 'الرصيد المستخدم:' : 'Used Balance:'}</span>
                        <strong className="text-[#1F2328]">{formatCurrency(acc.currentUsedCreditIQD, currency, language)}</strong>
                      </div>
                      <div className="flex justify-between text-[#6B7280]">
                        <span>{isAr ? 'سقف الائتمان:' : 'Credit Limit:'}</span>
                        <span>{formatCurrency(acc.creditLimitIQD, currency, language)}</span>
                      </div>
                    </div>

                    {/* Aging Bar Mini */}
                    {hasOverdue && (
                      <div className="mt-2 pt-2 border-t border-dashed border-[#E5E7EB] flex items-center justify-between text-[11px] text-amber-700">
                        <span className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-[#F59E0B]" />
                          <span>{isAr ? 'ديون متأخرة' : 'Overdue Balance'}</span>
                        </span>
                        <span>{formatCurrency(acc.aging.bucket31_60 + acc.aging.bucket61_90 + acc.aging.bucket90Plus, currency, language)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Account Detail & Append-Only Ledger */}
          <div className="lg:col-span-2 space-y-4">
            {selectedAccount ? (
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs space-y-5">
                
                {/* Account Details Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5E7EB] gap-3">
                  <div>
                    <h2 className="text-base font-bold text-[#1F2328]">{selectedAccount.storeName}</h2>
                    <span className="text-xs text-[#6B7280]">
                      {isAr 
                        ? `سقف الائتمان: ${formatCurrency(selectedAccount.creditLimitIQD, currency, language)} | فترة السداد: ${selectedAccount.paymentTermDays} يوماً`
                        : `Credit Limit: ${formatCurrency(selectedAccount.creditLimitIQD, currency, language)} | Payment Term: ${selectedAccount.paymentTermDays} days`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="px-3 py-1.5 bg-[#00A046] text-white rounded-lg text-xs font-bold hover:bg-[#008a3c] transition shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تسجيل سند قبض (دفعة)' : 'Record Payment (Receipt)'}</span>
                    </button>

                    <button
                      onClick={() => handleToggleException(selectedAccount)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1 cursor-pointer ${
                        selectedAccount.supplierExceptionAllowed
                          ? 'border-amber-300 bg-amber-50 text-amber-800'
                          : 'border-gray-300 hover:bg-gray-50 text-[#1F2328]'
                      }`}
                      title={isAr ? 'استثناء المورد لتمرير الطلبيات حتى عند تجاوز السقف' : 'Supplier override to allow orders exceeding credit limit'}
                    >
                      {selectedAccount.supplierExceptionAllowed ? (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-amber-600" />
                          <span>{isAr ? 'الاستثناء مفعل' : 'Exception Allowed'}</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-gray-500" />
                          <span>{isAr ? 'تفعيل استثناء' : 'Enable Override'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Platform-Mediated Credit Limit Upgrade Recommendations */}
                {selectedAccountUpgrades.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-[#1F2328] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#00A046]" />
                      <span>
                        {isAr
                          ? 'توصيات المنصة لمراجعة سقف الائتمان (بقرار محايد يحفظ العلاقة التجارية):'
                          : 'Platform Credit Review Recommendations (Neutral Relationship-Safe Flow):'}
                      </span>
                    </h4>

                    <div className="space-y-2.5">
                      {selectedAccountUpgrades.map((req) => (
                        <div
                          key={req.id}
                          className={`rounded-xl border p-3.5 text-xs space-y-2.5 ${
                            req.status === 'platform_review'
                              ? 'border-amber-200 bg-amber-50/40'
                              : req.status === 'approved'
                              ? 'border-emerald-200 bg-emerald-50/40'
                              : 'border-[#E5E7EB] bg-[#F7F8FA]'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#1F2328]">
                                {isAr ? 'السقف المطلوب:' : 'Proposed Limit:'}{' '}
                                <span className="font-mono text-[#00A046]">
                                  {formatCurrency(req.requestedLimitIQD, currency, language)}
                                </span>
                              </span>
                              <span className="text-[#6B7280] font-mono">
                                ({isAr ? 'الحالي:' : 'Current:'} {formatCurrency(req.currentLimitIQD, currency, language)})
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] font-bold text-[#1F2328]">
                                {isAr ? `تقييم الالتزام: ${req.storeReliabilityScore}/100` : `Score: ${req.storeReliabilityScore}/100`}
                              </span>
                              <span className={`px-2 py-0.5 rounded-md font-bold ${
                                req.status === 'platform_review'
                                  ? 'bg-amber-100 text-amber-800'
                                  : req.status === 'approved'
                                  ? 'bg-emerald-100 text-[#15803D]'
                                  : 'bg-gray-200 text-gray-700'
                              }`}>
                                {req.status === 'platform_review'
                                  ? (isAr ? 'بانتظار قرار المورد الصامت' : 'Awaiting Discreet Decision')
                                  : req.status === 'approved'
                                  ? (isAr ? 'تم اعتماد السقف' : 'Limit Approved')
                                  : (isAr ? 'تأجيل عبر سياسة المنصة' : 'Deferred by Platform Policy')}
                              </span>
                            </div>
                          </div>

                          {req.reason && (
                            <p className="text-[#4B5563] bg-white/80 border border-[#E5E7EB] rounded-lg p-2">
                              <span className="font-semibold text-[#1F2328]">{isAr ? 'مبرر المتجر: ' : 'Store Note: '}</span>
                              {req.reason}
                            </p>
                          )}

                          {req.status === 'platform_review' ? (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                              <span className="text-[11px] text-[#6B7280]">
                                {isAr
                                  ? 'التأجيل يظهر للمتجر كتوجيه آلي من نظام التقييم الدوري للمنصة دون أي إحراج مباشر منكم.'
                                  : 'Deferring sends an automated neutral platform policy response with zero awkwardness.'}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  disabled={resolvingReqId === req.id}
                                  onClick={() => handleResolveUpgradeRequest(req.id, 'approved', req.requestedLimitIQD)}
                                  className="px-3 py-1.5 rounded-lg bg-[#00A046] text-white font-bold hover:bg-[#008a3c] transition cursor-pointer disabled:opacity-50"
                                >
                                  {isAr ? 'اعتماد السقف المقترح' : 'Approve Proposed Limit'}
                                </button>
                                <button
                                  type="button"
                                  disabled={resolvingReqId === req.id}
                                  onClick={() => handleResolveUpgradeRequest(req.id, 'deferred_by_policy')}
                                  className="px-3 py-1.5 rounded-lg bg-white border border-[#D1D5DB] text-[#374151] font-bold hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
                                >
                                  {isAr ? 'تأجيل دبلوماسي عبر سياسة المنصة' : 'Diplomatic Policy Deferral'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-[#4B5563]">
                              <span className="font-semibold text-[#1F2328]">{isAr ? 'الرد المُرسل للمتجر: ' : 'Response Sent: '}</span>
                              {req.platformResponseAr}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Aging Buckets Grid (0-30, 31-60, 61-90, 90+ days) */}
                <div>
                  <h4 className="text-xs font-bold text-[#6B7280] mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#00A046]" />
                    <span>{isAr ? 'تحليل أعمار الديون (Aging Buckets):' : 'Debt Aging Analysis (Aging Buckets):'}</span>
                  </h4>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    
                    <div className="bg-[#F7F8FA] border border-[#E5E7EB] p-2.5 rounded-lg">
                      <span className="text-[11px] text-[#6B7280] block">
                        {isAr ? '0 - 30 يوماً (جاري)' : '0 - 30 Days (Current)'}
                      </span>
                      <strong className="text-sm font-bold text-[#15803D]">
                        {formatCurrency(selectedAccount.aging.bucket0_30, currency, language)}
                      </strong>
                    </div>

                    <div className="bg-[#F7F8FA] border border-[#E5E7EB] p-2.5 rounded-lg">
                      <span className="text-[11px] text-[#6B7280] block">
                        {isAr ? '31 - 60 يوماً' : '31 - 60 Days'}
                      </span>
                      <strong className="text-sm font-bold text-amber-600">
                        {formatCurrency(selectedAccount.aging.bucket31_60, currency, language)}
                      </strong>
                    </div>

                    <div className="bg-[#F7F8FA] border border-[#E5E7EB] p-2.5 rounded-lg">
                      <span className="text-[11px] text-[#6B7280] block">
                        {isAr ? '61 - 90 يوماً (إنذار)' : '61 - 90 Days (Warning)'}
                      </span>
                      <strong className="text-sm font-bold text-red-600">
                        {formatCurrency(selectedAccount.aging.bucket61_90, currency, language)}
                      </strong>
                    </div>

                    <div className="bg-[#F7F8FA] border border-[#E5E7EB] p-2.5 rounded-lg">
                      <span className="text-[11px] text-[#6B7280] block">
                        {isAr ? '+90 يوماً (إيقاف تلقائي)' : '+90 Days (Auto-Lock)'}
                      </span>
                      <strong className="text-sm font-bold text-[#B91C1C]">
                        {formatCurrency(selectedAccount.aging.bucket90Plus, currency, language)}
                      </strong>
                    </div>

                  </div>
                </div>

                {/* Append-Only Ledger Table */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-[#1F2328] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#00A046]" />
                      <span>
                        {isAr 
                          ? 'دفتر الأستاذ المالي (سجل تراكمي غير قابل للحذف - Append-Only):' 
                          : 'Financial Ledger (Append-Only Immutable Record):'}
                      </span>
                    </h4>
                    <span className="text-[11px] text-[#6B7280]">
                      {isAr ? 'التصحيحات تُجرى كقيود عكسية رسمية' : 'Corrections are posted via official reversing entries'}
                    </span>
                  </div>

                  <div className="border border-[#E5E7EB] rounded-xl overflow-hidden text-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right">
                        <thead className="bg-[#F7F8FA] text-[#6B7280] font-semibold border-b border-[#E5E7EB]">
                          <tr>
                            <th className="p-2.5">{isAr ? 'التاريخ' : 'Date'}</th>
                            <th className="p-2.5">{isAr ? 'النوع والمرجع' : 'Type & Ref'}</th>
                            <th className="p-2.5">{isAr ? 'البيان المحاسبي' : 'Description'}</th>
                            <th className="p-2.5">{isAr ? 'مدين (زيادة دين)' : 'Debit (+Debt)'}</th>
                            <th className="p-2.5">{isAr ? 'دائن (تسديد)' : 'Credit (Paid)'}</th>
                            <th className="p-2.5">{isAr ? 'الإجراءات' : 'Actions'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB]">
                          {ledgerEntries.map((entry) => (
                            <tr
                              key={entry.id}
                              className={`hover:bg-gray-50/70 transition ${
                                entry.isReversed ? 'bg-red-50/30 text-gray-400 line-through' : ''
                              }`}
                            >
                              <td className="p-2.5 whitespace-nowrap font-mono text-[11px]">
                                {entry.entryDate}
                              </td>
                              <td className="p-2.5 whitespace-nowrap">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  entry.referenceType === 'INVOICE' ? 'bg-blue-100 text-blue-800' :
                                  entry.referenceType === 'PAYMENT' ? 'bg-green-100 text-[#15803D]' :
                                  entry.referenceType === 'REVERSAL' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {entry.referenceType}
                                </span>
                                <span className="mr-1.5 font-mono text-[11px] text-gray-600">
                                  {entry.referenceId}
                                </span>
                              </td>
                              <td className="p-2.5 max-w-xs">{isAr ? entry.descriptionAr : getLocalizedText(entry.descriptionAr, 'en')}</td>
                              <td className="p-2.5 whitespace-nowrap font-mono font-bold text-[#1F2328]">
                                {entry.debitIQD > 0 ? formatCurrency(entry.debitIQD, currency, language) : '-'}
                              </td>
                              <td className="p-2.5 whitespace-nowrap font-mono font-bold text-[#15803D]">
                                {entry.creditIQD > 0 ? formatCurrency(entry.creditIQD, currency, language) : '-'}
                              </td>
                              <td className="p-2.5 whitespace-nowrap">
                                {!entry.isReversed && entry.referenceType !== 'REVERSAL' && (
                                  <button
                                    onClick={() => {
                                      setReversalTargetEntry(entry);
                                      setShowReversalModal(true);
                                    }}
                                    className="text-[11px] text-red-600 hover:text-red-800 flex items-center gap-1 font-semibold cursor-pointer"
                                    title={isAr ? 'إنشاء قيد عكسي لتصحيح هذا القيد' : 'Post reversing entry'}
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>{isAr ? 'قيد عكسي' : 'Reversal'}</span>
                                  </button>
                                )}
                                {entry.isReversed && (
                                  <span className="text-[10px] text-red-500 font-semibold">
                                    {isAr ? `عُكِس بالقيد ${entry.reversedByEntryId}` : `Reversed by ${entry.reversedByEntryId}`}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-10 text-center text-[#6B7280] text-xs">
                {isAr ? 'اختر متجراً من القائمة لعرض كشف الحساب ودفتر الأستاذ' : 'Select a store from the list to view statement & ledger'}
              </div>
            )}
          </div>

        </div>
        </div>
        );
      })()}

      {/* SUB-TAB 2: INCOMING ORDERS */}
      {activeSubTab === 'orders' && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#1F2328]">
            {isAr ? 'الطلبيات الواردة من المتاجر' : 'Incoming Orders from Stores'}
          </h3>
          
          <div className="space-y-3">
            {incomingOrders.map((ord) => (
              <div key={ord.id} className="border border-[#E5E7EB] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#1F2328]">{ord.id}</span>
                    <span className="text-xs bg-[#F7F8FA] border border-[#E5E7EB] px-2 py-0.5 rounded-md text-[#6B7280]">
                      {ord.storeName} ({ord.storeCity})
                    </span>
                    <span className="text-xs font-semibold text-[#00A046]">
                      {ord.paymentMethod === 'credit' 
                        ? (isAr ? 'دفع آجل' : 'Credit Term') 
                        : (isAr ? 'نقداً عند الاستلام' : 'Cash on Delivery')}
                    </span>
                  </div>

                  <div className="text-xs text-[#6B7280] mt-1.5">
                    {isAr ? 'الأصناف: ' : 'Items: '}
                    {ord.items.map(i => `${isAr ? i.productName : getLocalizedText(i.productName, 'en')} (${i.quantity} ${isAr ? i.unit : getLocalizedText(i.unit, 'en')})`).join(' ، ')}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-left font-mono font-bold text-base text-[#00A046]">
                    {formatCurrency(ord.subtotalIQD, currency, language)}
                  </div>

                  {ord.status === 'pending' && (
                    <button
                      onClick={() => handleProgressOrder(ord.id, 'assigned_driver')}
                      className="px-3 py-1.5 bg-[#00A046] text-white text-xs font-bold rounded-lg hover:bg-[#008a3c] shadow-xs cursor-pointer"
                    >
                      {isAr ? 'موافقة وتعيين السائق' : 'Approve & Assign Driver'}
                    </button>
                  )}

                  {ord.status === 'assigned_driver' && (
                    <button
                      onClick={() => handleProgressOrder(ord.id, 'out_for_delivery')}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-xs cursor-pointer"
                    >
                      {isAr ? 'بدء خط التوزيع (خروج الفان)' : 'Dispatch Van (Out for Delivery)'}
                    </button>
                  )}

                  {ord.status === 'out_for_delivery' && (
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200">
                      {isAr ? `قيد التوصيل (رمز PIN: ${ord.deliveryPin})` : `Out for Delivery (PIN: ${ord.deliveryPin})`}
                    </span>
                  )}

                  {ord.status === 'delivered' && (
                    <span className="text-xs font-bold text-[#15803D] bg-green-50 px-3 py-1 rounded-lg border border-green-200">
                      {isAr ? 'تم التسليم بنجاح' : 'Delivered Successfully'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: VANS AND DRIVERS */}
      {activeSubTab === 'vans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#00A046] flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#1F2328]">
                  {isAr ? 'أحمد كاظم البغدادي' : 'Ahmed Kazem Al-Baghdadi'}
                </h4>
                <p className="text-xs text-[#6B7280]">
                  {isAr 
                    ? 'فان رقم 1 - تويوتا هايس (قاطع الكرخ والمنصور)' 
                    : 'Van #1 - Toyota Hiace (Karkh & Mansoor Sector)'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#E5E7EB]">
              <div>
                {isAr ? 'الكاش المحصل حالياً: ' : 'Current Custody Cash: '}
                <strong className="font-mono text-[#00A046]">{formatCurrency(1450000, currency, language)}</strong>
              </div>
              <div>
                {isAr ? 'حالة الوردية: ' : 'Shift Status: '}
                <strong className="text-[#15803D]">{isAr ? 'نشطة' : 'Active'}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Record Payment Receipt */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-right shadow-2xl">
            <h3 className="font-bold text-base text-[#1F2328]">
              {isAr ? 'تسجيل سند قبض وسداد دفعة' : 'Record Payment Receipt'}
            </h3>
            <p className="text-xs text-[#6B7280] mt-1">
              {isAr 
                ? 'سيتم قيد المبلغ في دفتر الأستاذ وتطبيقه على الفواتير الأقدم تلقائياً.' 
                : 'The payment will be credited to the ledger and applied to oldest invoices automatically (FIFO).'}
            </p>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="text-[#6B7280] block mb-1">
                  {isAr ? 'المبلغ المسدد (دينار عراقي):' : 'Payment Amount (IQD):'}
                </label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={isAr ? 'مثال: 1500000' : 'e.g. 1500000'}
                  className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-2.5 font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-[#6B7280] block mb-1">
                  {isAr ? 'رقم سند القبض / الوصل:' : 'Receipt Number / Voucher:'}
                </label>
                <input
                  type="text"
                  value={paymentReceipt}
                  onChange={(e) => setPaymentReceipt(e.target.value)}
                  placeholder="RCP-2026-99"
                  className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-2.5 font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#00A046] text-white font-bold cursor-pointer hover:bg-[#008a3c]"
                >
                  {isAr ? 'حفظ في دفتر الأستاذ' : 'Save to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Reversing Entry (قيد عكسي) */}
      {showReversalModal && reversalTargetEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-right shadow-2xl">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <RotateCcw className="w-5 h-5" />
              <h3 className="font-bold text-base text-[#1F2328]">
                {isAr ? 'إنشاء قيد عكسي (Reversal Entry)' : 'Create Reversing Entry'}
              </h3>
            </div>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              {isAr 
                ? `وفقاً لقواعد النظام المحاسبي الاحترافي، لا يتم حذف القيود المسجلة أبداً. سيقوم النظام بإنشاء قيد عكسي مطابق وموازٍ لإلغاء أثر القيد (${reversalTargetEntry.referenceId}) مع الحفاظ على السجل التاريخي كاملاً للمراجعة والتدقيق.`
                : `Under strict accounting rules, journal entries are never deleted. The system will post an offsetting reversing entry to neutralize (${reversalTargetEntry.referenceId}) while preserving an immutable audit trail.`}
            </p>

            <form onSubmit={handleCreateReversal} className="mt-4 space-y-3 text-xs">
              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-gray-700 font-mono">
                <div>{isAr ? 'القيد المستهدف: ' : 'Target Entry: '}{reversalTargetEntry.referenceId}</div>
                <div>{isAr ? 'المبلغ المراد عكسه: ' : 'Reversal Amount: '}{formatCurrency(reversalTargetEntry.debitIQD || reversalTargetEntry.creditIQD, currency, language)}</div>
              </div>

              <div>
                <label className="text-[#6B7280] block mb-1">
                  {isAr ? 'سبب القيد العكسي (مطلوب للتدقيق):' : 'Reversal Reason (Required for Audit):'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  placeholder={isAr ? 'مثال: تصحيح خطأ إدخال رقم الفاتورة أو إرجاع كمية تالفة...' : 'e.g. Correcting invoice typo or processing damaged batch return...'}
                  className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReversalModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 cursor-pointer"
                >
                  {isAr ? 'تأكيد تسجيل القيد العكسي' : 'Confirm Reversal Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
