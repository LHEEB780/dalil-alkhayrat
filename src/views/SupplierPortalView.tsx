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
  Send,
  Package,
  Navigation,
  Award,
  RefreshCw,
  MapPin,
  Wallet,
  X,
  Minus,
  Search,
  Wheat,
  Droplets,
  Milk,
  Coffee,
  Sparkles,
  Check,
  Grid3X3,
  LayoutGrid,
  LayoutList
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

function resolveFleetProductImage(
  barcode: string,
  nameAr: string,
  imageUrl?: string
): string {
  if (imageUrl) return imageUrl;
  const lower = `${barcode} ${nameAr || ''}`.toLowerCase();
  if (lower.includes('أرز') || lower.includes('ارز') || lower.includes('rice')) {
    return '/assets/images/white_basmati_rice.jpg';
  }
  if (lower.includes('زيت') || lower.includes('سمن') || lower.includes('oil')) {
    return '/assets/images/white_sunflower_oil.jpg';
  }
  if (lower.includes('حليب') || lower.includes('لبن') || lower.includes('جبن') || lower.includes('milk')) {
    return '/assets/images/white_milk_powder.jpg';
  }
  if (lower.includes('معجون') || lower.includes('طماطم') || lower.includes('tomato')) {
    return '/assets/images/white_tomato_paste.jpg';
  }
  if (lower.includes('شاي') || lower.includes('tea')) {
    return '/assets/images/white_ceylon_tea.jpg';
  }
  if (lower.includes('سكر') || lower.includes('sugar')) {
    return '/assets/images/white_sugar_pack.jpg';
  }
  if (lower.includes('معكرون') || lower.includes('مكرون') || lower.includes('pasta')) {
    return '/assets/images/white_pasta_pack.jpg';
  }
  if (lower.includes('قهوة') || lower.includes('نسكافيه') || lower.includes('coffee')) {
    return '/assets/images/white_espresso_coffee.jpg';
  }
  if (lower.includes('منظف') || lower.includes('مسحوق') || lower.includes('ديتول') || lower.includes('clean')) {
    return '/assets/images/white_cleaner_bottles.jpg';
  }
  return '/assets/images/white_canned_goods.jpg';
}

function getFleetCategoryIcon(category?: string, nameAr?: string) {
  const text = `${category || ''} ${nameAr || ''}`.toLowerCase();
  if (text.includes('زيت') || text.includes('سمن') || text.includes('oil') || text.includes('زيوت')) {
    return { Icon: Droplets, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
  }
  if (text.includes('حليب') || text.includes('لبن') || text.includes('ألبان') || text.includes('milk')) {
    return { Icon: Milk, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' };
  }
  if (text.includes('شاي') || text.includes('قهوة') || text.includes('مشروب') || text.includes('tea') || text.includes('coffee')) {
    return { Icon: Coffee, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' };
  }
  if (text.includes('منظف') || text.includes('مسحوق') || text.includes('تنظيف') || text.includes('clean')) {
    return { Icon: Sparkles, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' };
  }
  if (text.includes('أرز') || text.includes('ارز') || text.includes('سكر') || text.includes('حبوب') || text.includes('معكرون') || text.includes('مواد غذائية')) {
    return { Icon: Wheat, color: 'text-[#0B5D32]', bg: 'bg-[#ECFDF5] border-[#A7F3D0]' };
  }
  return { Icon: Package, color: 'text-[#00A046]', bg: 'bg-emerald-50 border-emerald-200' };
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

  // Van Fleet Command Center state
  const [fleetData, setFleetData] = useState<any[]>([]);
  const [shiftReports, setShiftReports] = useState<any[]>([]);
  const [fleetStores, setFleetStores] = useState<any[]>([]);
  const [fleetCatalog, setFleetCatalog] = useState<any[]>([]);
  const [vanLoadRequests, setVanLoadRequests] = useState<any[]>([]);
  const [adjustedLoadQty, setAdjustedLoadQty] = useState<Record<string, Record<string, number>>>({});
  const [processingLoadReqId, setProcessingLoadReqId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('drv_ahmed_baghdad');
  const [loadingFleet, setLoadingFleet] = useState(false);

  // Morning Load-Out Mini Cashier & Isolated Van Stock Sub-mode
  const [vanStockSubMode, setVanStockSubMode] = useState<'load_cashier' | 'current_stock'>('load_cashier');
  const [loadCatalogView, setLoadCatalogView] = useState<'mini' | 'grid' | 'list'>('mini');
  const [morningLoadBasket, setMorningLoadBasket] = useState<Record<string, number>>({});
  const [loadCategoryFilter, setLoadCategoryFilter] = useState<string>('الكل');
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [loadProductSearch, setLoadProductSearch] = useState('');
  const [adjustingStockBarcode, setAdjustingStockBarcode] = useState<string | null>(null);

  // Add Route Stop form
  const [newStopStoreId, setNewStopStoreId] = useState('store_almansoor');
  const [newStopNotes, setNewStopNotes] = useState('');

  // Add Driver/Van Modal
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverPlate, setNewDriverPlate] = useState('');
  const [newDriverModel, setNewDriverModel] = useState('تويوتا هايس 2024');
  const [newDriverSector, setNewDriverSector] = useState('');
  const [newDriverTarget, setNewDriverTarget] = useState('2000000');
  const [newDriverCommission, setNewDriverCommission] = useState('1.5');

  const loadFleetData = async () => {
    setLoadingFleet(true);
    try {
      const res = await fetch('/api/van/fleet/supp_rafidain');
      const data = await res.json();
      if (data.success) {
        setFleetData(data.fleet || []);
        setShiftReports(data.shiftReports || []);
        setFleetStores(data.stores || []);
        setFleetCatalog(data.catalogProducts || []);
        const reqs = data.loadRequests || [];
        setVanLoadRequests(reqs);
        setAdjustedLoadQty((prev) => {
          const next = { ...prev };
          for (const r of reqs) {
            if (r.status === 'pending_approval' && !next[r.id]) {
              const map: Record<string, number> = {};
              for (const item of r.items || []) {
                map[item.barcode] = item.requestedQuantity;
              }
              next[r.id] = map;
            }
          }
          return next;
        });
        if (data.fleet?.length > 0 && !data.fleet.some((f: any) => f.driver.id === selectedDriverId)) {
          setSelectedDriverId(data.fleet[0].driver.id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFleet(false);
    }
  };

  const handleApproveLoadRequest = async (reqId: string) => {
    if (processingLoadReqId) return;
    setProcessingLoadReqId(reqId);
    try {
      const res = await fetch(`/api/van/load-requests/${reqId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedBy: isAr ? 'محاسب شركة الرافدين' : 'Al-Rafidain Accountant',
          adjustedQuantities: adjustedLoadQty[reqId] || {},
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(
          isAr
            ? `تم اعتماد طلب التجهيز وإضافة الأصناف تلقائياً إلى كاشير ومخزون الفان.`
            : 'Load request approved and items automatically synced to Van Cashier.'
        );
        await loadFleetData();
      } else {
        setStatusMessage(data.error || (isAr ? 'تعذر اعتماد طلب التجهيز.' : 'Failed to approve load request.'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingLoadReqId(null);
    }
  };

  const handleRejectLoadRequest = async (reqId: string) => {
    if (processingLoadReqId) return;
    setProcessingLoadReqId(reqId);
    try {
      const res = await fetch(`/api/van/load-requests/${reqId}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: isAr ? 'تم الرفض من قبل المحاسب' : 'Rejected by accountant',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(isAr ? 'تم رفض طلب تجهيز الفان.' : 'Van load request rejected.');
        await loadFleetData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingLoadReqId(null);
    }
  };

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
    loadFleetData();
  }, []);

  const handleAdjustMorningBasket = (barcode: string, delta: number) => {
    setMorningLoadBasket((prev) => {
      const next = (prev[barcode] || 0) + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[barcode];
        return copy;
      }
      return { ...prev, [barcode]: next };
    });
  };

  const handleDispatchMorningLoadBasket = async () => {
    const entries = Object.entries(morningLoadBasket).filter(([, qty]) => qty > 0);
    if (!selectedDriverId || entries.length === 0 || isLoadingStock) return;
    setIsLoadingStock(true);
    try {
      const results = await Promise.all(
        entries.map(([barcode, quantity]) =>
          fetch('/api/van/load-stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              driverId: selectedDriverId,
              barcode,
              quantity
            })
          }).then((r) => r.json())
        )
      );
      const loadedCount = results.filter((r) => r.success).length;
      const totalUnits = entries.reduce((s, [, q]) => s + q, 0);
      if (loadedCount > 0) {
        setMorningLoadBasket({});
        setStatusMessage(
          isAr
            ? `تم تحميل ${totalUnits} وحدة (${loadedCount} أصناف) بنجاح في عهدة الفان.`
            : `Loaded ${totalUnits} units (${loadedCount} items) into van inventory.`
        );
        await loadFleetData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingStock(false);
    }
  };

  const handleAdjustLoadedVanStock = async (barcode: string, delta: number) => {
    if (!selectedDriverId || adjustingStockBarcode) return;
    setAdjustingStockBarcode(barcode);
    try {
      const res = await fetch('/api/van/adjust-stock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: selectedDriverId,
          barcode,
          delta
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMessage(data.message || (isAr ? 'تعذر تعديل الكمية في الفان.' : 'Could not update van stock.'));
        return;
      }
      setStatusMessage(
        delta > 0
          ? isAr
            ? `تمت زيادة الكمية المحمّلة في الفان (+${delta}).`
            : `Increased van stock (+${delta}).`
          : isAr
          ? `تم إنقاص الكمية المحمّلة في الفان (${delta}).`
          : `Decreased van stock (${delta}).`
      );
      await loadFleetData();
    } catch (err) {
      console.error(err);
    } finally {
      setAdjustingStockBarcode(null);
    }
  };

  const handleAssignRouteStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId || !newStopStoreId) return;
    try {
      const res = await fetch('/api/van/route-stops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: selectedDriverId,
          storeId: newStopStoreId,
          notes: newStopNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewStopNotes('');
        setStatusMessage(
          isAr ? 'تمت جدولة المتجر ضمن خط السير اليومي للسائق.' : 'Store added to driver daily route.'
        );
        await loadFleetData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverName.trim() || !newDriverPlate.trim()) return;
    try {
      const res = await fetch('/api/van/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: 'supp_rafidain',
          name: newDriverName,
          phone: newDriverPhone,
          vehiclePlate: newDriverPlate,
          vehicleModel: newDriverModel,
          vanWarehouseName: newDriverSector || `فان ${fleetData.length + 1} - بغداد`,
          dailyTargetIQD: Number(newDriverTarget) || 2000000,
          commissionRatePercent: Number(newDriverCommission) || 1.5
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddDriverModal(false);
        setNewDriverName('');
        setNewDriverPhone('');
        setNewDriverPlate('');
        setNewDriverSector('');
        setSelectedDriverId(data.data.id);
        setStatusMessage(isAr ? 'تم تسجيل الفان والسائق الجديد في أسطول المورد بنجاح.' : 'New van driver registered.');
        await loadFleetData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSettleShiftReport = async (reportId: string) => {
    try {
      const res = await fetch(`/api/van/shift-reports/${reportId}/settle`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(
          isAr ? 'تم اعتماد تقرير إغلاق الوردية ومطابقة الصندوق بنجاح.' : 'Shift report approved and settled.'
        );
        await loadFleetData();
      }
    } catch (err) {
      console.error(err);
    }
  };

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
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'vans' ? 'bg-[#00A046] text-white shadow-xs' : 'text-[#6B7280] hover:text-[#1F2328]'
            }`}
          >
            <span>{isAr ? 'أسطول الفانات والمناديب' : 'Van Fleet & Reps'}</span>
            {vanLoadRequests.filter((r) => r.status === 'pending_approval').length > 0 && (
              <span
                className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded-full ${
                  activeSubTab === 'vans' ? 'bg-amber-400 text-[#1F2328]' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {vanLoadRequests.filter((r) => r.status === 'pending_approval').length}
              </span>
            )}
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

      {/* SUB-TAB 3: VAN FLEET COMMAND CENTER (إدارة أسطول الفانات والتحميل الصباحي) */}
      {activeSubTab === 'vans' && (() => {
        const totalFleetCash = fleetData.reduce((s, f) => s + (f.driver.currentCashCollectedIQD || 0), 0);
        const totalFleetSales = fleetData.reduce((s, f) => s + (f.commissionSummary?.totalAchievedIQD || 0), 0);
        const totalFleetCommissions = fleetData.reduce((s, f) => s + (f.commissionSummary?.estimatedCommissionIQD || 0), 0);
        const activeFleetCount = fleetData.filter((f) => f.driver.isActiveShift).length;
        const selectedFleet = fleetData.find((f) => f.driver.id === selectedDriverId) || fleetData[0];

        return (
          <div className="space-y-4">
            {/* Fleet KPI Summary Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5">
                <div className="text-[11px] font-bold text-[#6B7280]">{isAr ? 'الفانات النشطة' : 'Active Vans'}</div>
                <div className="text-lg font-black font-mono tabular-nums text-[#00A046] mt-1">
                  {activeFleetCount} / {fleetData.length}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5">
                <div className="text-[11px] font-bold text-[#6B7280]">{isAr ? 'الكاش الميداني بالعهدة' : 'Field Cash Custody'}</div>
                <div className="text-lg font-black font-mono tabular-nums text-[#1F2328] mt-1">
                  {formatCurrency(totalFleetCash, currency, language)}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5">
                <div className="text-[11px] font-bold text-[#6B7280]">{isAr ? 'مبيعات وتحصيلات اليوم' : "Today's Fleet Volume"}</div>
                <div className="text-lg font-black font-mono tabular-nums text-[#00A046] mt-1">
                  {formatCurrency(totalFleetSales, currency, language)}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5">
                <div className="text-[11px] font-bold text-[#6B7280]">{isAr ? 'عمولات المناديب المستحقة' : 'Estimated Commissions'}</div>
                <div className="text-lg font-black font-mono tabular-nums text-amber-700 mt-1">
                  {formatCurrency(totalFleetCommissions, currency, language)}
                </div>
              </div>
            </div>

            {/* Pending Van Restock / Load Requests Approval Queue */}
            {vanLoadRequests.length > 0 && (() => {
              const pendingReqs = vanLoadRequests.filter((r) => r.status === 'pending_approval');
              const recentResolvedReqs = vanLoadRequests.filter((r) => r.status !== 'pending_approval').slice(0, 3);
              return (
                <div className="bg-white rounded-2xl border border-amber-200 shadow-xs overflow-hidden">
                  <div className="bg-amber-50/80 border-b border-amber-200 px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-amber-700" />
                      <h3 className="text-sm font-black text-[#1F2328]">
                        {isAr ? 'طلبات تجهيز الفانات (موافقة المورد / المحاسب)' : 'Van Restock Requests (Supplier / Accountant Approval)'}
                      </h3>
                      {pendingReqs.length > 0 && (
                        <span className="text-[10.5px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-white font-mono">
                          {pendingReqs.length} {isAr ? 'بانتظار الموافقة' : 'Pending'}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#6B7280]">
                      {isAr ? 'عند الموافقة تُضاف الأصناف تلقائياً إلى كاشير السائق' : 'Approved items sync automatically to the Van Cashier'}
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    {pendingReqs.map((req: any) => {
                      const adjMap = adjustedLoadQty[req.id] || {};
                      const dynamicTotal = (req.items || []).reduce((sum: number, item: any) => {
                        const qty = adjMap[item.barcode] ?? item.requestedQuantity;
                        return sum + qty * item.unitPriceIQD;
                      }, 0);
                      return (
                        <div key={req.id} className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-3.5 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-xs text-[#1F2328]">{req.driverName}</span>
                                <span className="text-[10.5px] text-[#6B7280]">({req.vanWarehouseName})</span>
                                <span className="text-[10px] font-mono text-[#6B7280]">{req.id}</span>
                              </div>
                              {req.notes && (
                                <p className="text-[11px] text-amber-800 mt-0.5">{req.notes}</p>
                              )}
                            </div>
                            <div className="text-end">
                              <div className="text-[10px] text-[#6B7280]">{isAr ? 'إجمالي قيمة التجهيز' : 'Estimated Load Value'}</div>
                              <div className="text-sm font-black font-mono text-[#00A046] tabular-nums">
                                {formatCurrency(dynamicTotal, currency, language)}
                              </div>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg border border-[#E5E7EB] divide-y divide-[#F1F3F5]">
                            {(req.items || []).map((item: any) => {
                              const currentQty = adjMap[item.barcode] ?? item.requestedQuantity;
                              const catalogMatch = fleetCatalog.find((p) => p.barcode === item.barcode);
                              const itemThumb = resolveFleetProductImage(
                                item.barcode,
                                item.productName,
                                catalogMatch?.imageUrl
                              );
                              const { Icon: CatIcon, color: catColor, bg: catBg } = getFleetCategoryIcon(
                                catalogMatch?.category,
                                item.productName
                              );

                              return (
                                <div key={item.barcode} className="px-3 py-2.5 flex items-center justify-between gap-2.5 text-xs">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-white border border-[#E5E7EB] p-1 flex items-center justify-center shrink-0">
                                      <img
                                        src={itemThumb}
                                        alt={item.productName}
                                        referrerPolicy="no-referrer"
                                        className="max-h-full max-w-full object-contain mix-blend-multiply"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold text-[#1F2328] truncate flex items-center gap-1.5">
                                        <span className={`w-5 h-5 rounded-md border inline-flex items-center justify-center shrink-0 ${catBg}`}>
                                          <CatIcon className={`w-3 h-3 ${catColor}`} />
                                        </span>
                                        <span className="truncate">{item.productName}</span>
                                      </div>
                                      <div className="text-[10.5px] text-[#6B7280] mt-0.5 tabular-nums">
                                        {item.unit} · {formatCurrency(item.unitPriceIQD, currency, language)}
                                        {' · '}
                                        {isAr ? `المطلوب: ${item.requestedQuantity}` : `Req: ${item.requestedQuantity}`}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-0.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAdjustedLoadQty((prev) => ({
                                          ...prev,
                                          [req.id]: {
                                            ...(prev[req.id] || {}),
                                            [item.barcode]: Math.max(0, currentQty - 1)
                                          }
                                        }))
                                      }
                                      className="w-7 h-7 rounded-md bg-white hover:bg-gray-100 border border-[#E5E7EB] flex items-center justify-center text-[#1F2328] cursor-pointer"
                                      aria-label={isAr ? 'إنقاص الكمية' : 'Decrease quantity'}
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <input
                                      type="number"
                                      min={0}
                                      value={currentQty}
                                      onChange={(e) => {
                                        const val = Math.max(0, Number(e.target.value) || 0);
                                        setAdjustedLoadQty((prev) => ({
                                          ...prev,
                                          [req.id]: { ...(prev[req.id] || {}), [item.barcode]: val }
                                        }));
                                      }}
                                      className="w-11 bg-transparent text-center font-mono font-black text-xs focus:outline-hidden tabular-nums"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAdjustedLoadQty((prev) => ({
                                          ...prev,
                                          [req.id]: {
                                            ...(prev[req.id] || {}),
                                            [item.barcode]: currentQty + 1
                                          }
                                        }))
                                      }
                                      className="w-7 h-7 rounded-md bg-[#00A046] hover:bg-[#008a3c] text-white flex items-center justify-center cursor-pointer"
                                      aria-label={isAr ? 'زيادة الكمية' : 'Increase quantity'}
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={processingLoadReqId === req.id}
                              onClick={() => handleRejectLoadRequest(req.id)}
                              className="px-3.5 py-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-700 text-xs font-bold cursor-pointer disabled:opacity-50"
                            >
                              {isAr ? 'رفض الطلب' : 'Reject'}
                            </button>
                            <button
                              type="button"
                              disabled={processingLoadReqId === req.id}
                              onClick={() => handleApproveLoadRequest(req.id)}
                              className="px-4 py-2 rounded-lg bg-[#00A046] hover:bg-[#008a3c] text-white text-xs font-black shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              {processingLoadReqId === req.id
                                ? isAr ? 'جاري التحميل...' : 'Approving...'
                                : isAr ? 'موافقة وتحميل تلقائي لكاشير الفان' : 'Approve & Auto-Load to Van POS'}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {recentResolvedReqs.length > 0 && (
                      <div className="pt-2 border-t border-[#F1F3F5] space-y-1.5">
                        <div className="text-[11px] font-bold text-[#6B7280]">
                          {isAr ? 'آخر طلبات التجهيز المعالجة:' : 'Recently Processed Load Requests:'}
                        </div>
                        {recentResolvedReqs.map((req: any) => (
                          <div key={req.id} className="flex items-center justify-between text-xs bg-[#F7F8FA] px-3 py-2 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#1F2328]">{req.driverName}</span>
                              <span className="text-[10.5px] text-[#6B7280]">
                                ({(req.items || []).length} {isAr ? 'أصناف' : 'items'})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#1F2328] tabular-nums">
                                {formatCurrency(req.totalValueIQD || 0, currency, language)}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  req.status === 'approved'
                                    ? 'bg-emerald-50 text-[#00A046]'
                                    : 'bg-red-50 text-red-700'
                                }`}
                              >
                                {req.status === 'approved'
                                  ? isAr ? 'تم الاعتماد والتحميل' : 'Approved & Loaded'
                                  : isAr ? 'مرفوض' : 'Rejected'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Fleet Selector & Add Van Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {fleetData.map((item) => {
                  const isSelected = selectedFleet?.driver.id === item.driver.id;
                  return (
                    <button
                      key={item.driver.id}
                      type="button"
                      onClick={() => setSelectedDriverId(item.driver.id)}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-[#00A046] text-white border-[#00A046] shadow-xs'
                          : 'bg-white text-[#1F2328] border-[#E5E7EB] hover:border-[#00A046]/50'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                      <span>{item.driver.name}</span>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-emerald-100' : 'text-[#6B7280]'}`}>
                        ({item.totalRemainingUnits} {isAr ? 'وحدة' : 'u'})
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => loadFleetData()}
                  className="p-2 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#00A046] text-[#6B7280] cursor-pointer"
                  title={isAr ? 'تحديث بيانات الأسطول' : 'Refresh Fleet'}
                >
                  <RefreshCw className={`w-4 h-4 ${loadingFleet ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddDriverModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#1F2328] hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? 'إضافة فان / سائق جديد' : 'Add Van / Driver'}</span>
                </button>
              </div>
            </div>

            {/* Selected Van Detailed Management Workspace */}
            {selectedFleet && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Left 7 Cols: Driver Info + Morning Load-Out + Van Inventory */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Driver & Target Card */}
                  <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#00A046] flex items-center justify-center shrink-0">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-black text-sm text-[#1F2328]">{selectedFleet.driver.name}</h4>
                            <span className="text-[10.5px] font-mono text-[#6B7280]">{selectedFleet.driver.vehiclePlate}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                selectedFleet.driver.isActiveShift
                                  ? 'bg-emerald-50 text-[#00A046]'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {selectedFleet.driver.isActiveShift
                                ? isAr ? 'وردية نشطة' : 'Active Shift'
                                : isAr ? 'وردية مغلقة' : 'Shift Closed'}
                            </span>
                          </div>
                          <p className="text-xs text-[#6B7280] mt-0.5">
                            {selectedFleet.driver.vanWarehouseName} · {selectedFleet.driver.vehicleModel}
                          </p>
                        </div>
                      </div>

                      <div className="text-end">
                        <div className="text-[10.5px] text-[#6B7280]">{isAr ? 'الكاش بالعهدة الآن' : 'Cash Custody'}</div>
                        <div className="text-base font-black font-mono tabular-nums text-[#00A046]">
                          {formatCurrency(selectedFleet.driver.currentCashCollectedIQD || 0, currency, language)}
                        </div>
                      </div>
                    </div>

                    {selectedFleet.commissionSummary && (
                      <div className="pt-2.5 border-t border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="sm:col-span-2 space-y-1">
                          <div className="flex justify-between font-bold">
                            <span className="text-[#6B7280]">{isAr ? 'نسبة إنجاز الهدف اليومي' : 'Daily Target Progress'}</span>
                            <span className="font-mono text-[#00A046] tabular-nums">
                              {selectedFleet.commissionSummary.targetProgressPercent}%
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#00A046]"
                              style={{ width: `${selectedFleet.commissionSummary.targetProgressPercent}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:justify-end">
                          <Award className="w-4 h-4 text-amber-600 shrink-0" />
                          <div>
                            <div className="text-[10px] text-[#6B7280]">
                              {isAr ? `العمولة (${selectedFleet.commissionSummary.commissionRatePercent}%)` : 'Commission'}
                            </div>
                            <div className="font-mono font-black text-amber-700 tabular-nums">
                              {formatCurrency(selectedFleet.commissionSummary.estimatedCommissionIQD, currency, language)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Isolated Morning Load-Out Mini Cashier vs Current Van Stock */}
                  {(() => {
                    const catalogCategories = Array.from(
                      new Set(
                        fleetCatalog
                          .map((p) => (p.category || '').trim())
                          .filter(Boolean)
                      )
                    );

                    const pickerQuery = loadProductSearch.trim().toLowerCase();
                    const filteredCashierProducts = fleetCatalog.filter((prod) => {
                      if (
                        loadCategoryFilter !== 'الكل' &&
                        (prod.category || '').trim() !== loadCategoryFilter
                      ) {
                        return false;
                      }
                      if (!pickerQuery) return true;
                      return (
                        (prod.nameAr || '').toLowerCase().includes(pickerQuery) ||
                        (prod.barcode || '').toLowerCase().includes(pickerQuery) ||
                        (prod.category || '').toLowerCase().includes(pickerQuery) ||
                        (prod.unit || '').toLowerCase().includes(pickerQuery)
                      );
                    });

                    const basketEntries = Object.entries(morningLoadBasket)
                      .filter(([, qty]) => qty > 0)
                      .map(([barcode, qty]) => {
                        const prod = fleetCatalog.find((p) => p.barcode === barcode);
                        return prod ? { prod, qty } : null;
                      })
                      .filter(Boolean) as Array<{ prod: any; qty: number }>;

                    const basketUnitsCount = basketEntries.reduce((s, e) => s + e.qty, 0);
                    const basketTotalIQD = basketEntries.reduce(
                      (s, e) => s + e.qty * (e.prod.defaultPriceIQD || 0),
                      0
                    );

                    return (
                      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 space-y-3.5">
                        {/* Header + Strict Isolation Mode Switcher */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[#F1F3F5]">
                          <div>
                            <h4 className="font-black text-sm text-[#1F2328] flex items-center gap-1.5">
                              <Package className="w-4 h-4 text-[#00A046]" />
                              <span>
                                {vanStockSubMode === 'load_cashier'
                                  ? isAr
                                    ? 'كاشير التحميل الصباحي للفان'
                                    : 'Morning Load-Out Mini Cashier'
                                  : isAr
                                  ? 'مخزون الفان الحالي (معزول)'
                                  : 'Current Van Stock (Isolated)'}
                              </span>
                            </h4>
                            <p className="text-[11px] text-[#6B7280] mt-0.5">
                              {vanStockSubMode === 'load_cashier'
                                ? isAr
                                  ? 'اضغط على أي صنف مصغّر لإضافته إلى سلة التحميل الصباحي، مع عزل مخزون الفان الحالي في تبويب مستقل.'
                                  : 'Tap mini product cards to stage morning load-out; current van stock is isolated in its own tab.'
                                : isAr
                                ? `عرض وتعديل العهدة الحالية داخل ${selectedFleet.driver.vanWarehouseName} فقط.`
                                : `Isolated view & adjustments for current stock inside ${selectedFleet.driver.vanWarehouseName}.`}
                            </p>
                          </div>

                          {/* Segmented Switcher isolating Load Cashier from Current Van Stock */}
                          <div className="grid grid-cols-2 sm:flex items-center bg-[#F4F4EA] border border-[#DCE5DC] p-1 rounded-xl gap-1 shrink-0 text-xs font-black">
                            <button
                              type="button"
                              onClick={() => setVanStockSubMode('load_cashier')}
                              className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
                                vanStockSubMode === 'load_cashier'
                                  ? 'bg-[#00A046] text-white shadow-2xs'
                                  : 'text-[#4B6352] hover:text-[#142018]'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{isAr ? 'كاشير التحميل' : 'Load Cashier'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setVanStockSubMode('current_stock')}
                              className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 tabular-nums ${
                                vanStockSubMode === 'current_stock'
                                  ? 'bg-[#1F2328] text-white shadow-2xs'
                                  : 'text-[#4B6352] hover:text-[#142018]'
                              }`}
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>
                                {isAr
                                  ? `مخزون الفان (${selectedFleet.inventory.length})`
                                  : `Van Stock (${selectedFleet.inventory.length})`}
                              </span>
                            </button>
                          </div>
                        </div>

                        {vanStockSubMode === 'load_cashier' ? (
                          <div className="space-y-3">
                            {/* Search + View Mode Switcher (Mini / Grid / List) + Category Filter Bar */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                  <Search className="w-3.5 h-3.5 text-[#6B7280] absolute top-1/2 -translate-y-1/2 start-3" />
                                  <input
                                    type="text"
                                    value={loadProductSearch}
                                    onChange={(e) => setLoadProductSearch(e.target.value)}
                                    placeholder={
                                      isAr
                                        ? 'ابحث بالاسم أو القسم أو الباركود...'
                                        : 'Search by name, category, barcode...'
                                    }
                                    className="w-full h-9 bg-[#F7F8FA] border border-[#E5E7EB] focus:border-[#00A046] focus:bg-white rounded-xl ps-8 pe-8 text-xs font-bold focus:outline-hidden"
                                  />
                                  {loadProductSearch && (
                                    <button
                                      type="button"
                                      onClick={() => setLoadProductSearch('')}
                                      className="absolute top-1/2 -translate-y-1/2 end-2.5 text-[#6B7280] hover:text-[#1F2328] cursor-pointer"
                                      aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

                                {/* Mini / Grid / List View Switcher Buttons */}
                                <div className="flex items-center bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl p-0.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setLoadCatalogView('mini')}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
                                      loadCatalogView === 'mini'
                                        ? 'bg-[#00A046] text-white shadow-2xs'
                                        : 'text-[#4B6352] hover:text-[#142018]'
                                    }`}
                                    title={isAr ? 'عرض مصغّر' : 'Mini Grid'}
                                    aria-label={isAr ? 'عرض مصغّر' : 'Mini Grid'}
                                  >
                                    <Grid3X3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setLoadCatalogView('grid')}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
                                      loadCatalogView === 'grid'
                                        ? 'bg-[#00A046] text-white shadow-2xs'
                                        : 'text-[#4B6352] hover:text-[#142018]'
                                    }`}
                                    title={isAr ? 'عرض شبكي' : 'Grid View'}
                                    aria-label={isAr ? 'عرض شبكي' : 'Grid View'}
                                  >
                                    <LayoutGrid className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setLoadCatalogView('list')}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
                                      loadCatalogView === 'list'
                                        ? 'bg-[#00A046] text-white shadow-2xs'
                                        : 'text-[#4B6352] hover:text-[#142018]'
                                    }`}
                                    title={isAr ? 'عرض قائمة' : 'List View'}
                                    aria-label={isAr ? 'عرض قائمة' : 'List View'}
                                  >
                                    <LayoutList className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {catalogCategories.length > 0 && (
                                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setLoadCategoryFilter('الكل')}
                                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer shrink-0 whitespace-nowrap ${
                                      loadCategoryFilter === 'الكل'
                                        ? 'bg-[#00A046] border-[#00A046] text-white'
                                        : 'bg-[#F7F8FA] border-[#E5E7EB] text-[#4B6352] hover:border-[#00A046]/50'
                                    }`}
                                  >
                                    {isAr ? 'الكل' : 'All'}
                                  </button>
                                  {catalogCategories.map((cat) => {
                                    const active = loadCategoryFilter === cat;
                                    const { Icon: CatIcon } = getFleetCategoryIcon(cat, cat);
                                    return (
                                      <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setLoadCategoryFilter(cat)}
                                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0 whitespace-nowrap ${
                                          active
                                            ? 'bg-[#00A046] border-[#00A046] text-white'
                                            : 'bg-[#F7F8FA] border-[#E5E7EB] text-[#4B6352] hover:border-[#00A046]/50'
                                        }`}
                                      >
                                        <CatIcon className="w-3 h-3 shrink-0" />
                                        <span>{isAr ? cat : getLocalizedText(cat, 'en')}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Product Cashier Views (Mini / Grid / List) */}
                            {filteredCashierProducts.length === 0 ? (
                              <div className="py-8 text-center text-xs text-[#6B7280] font-bold bg-[#F7F8FA] rounded-xl border border-dashed border-[#E5E7EB]">
                                {isAr ? 'لا توجد أصناف مطابقة للبحث في الكتالوج.' : 'No matching catalog products.'}
                              </div>
                            ) : loadCatalogView === 'mini' ? (
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[420px] overflow-y-auto pe-0.5">
                                {filteredCashierProducts.map((prod) => {
                                  const qtyInBasket = morningLoadBasket[prod.barcode] || 0;
                                  const thumb = resolveFleetProductImage(
                                    prod.barcode,
                                    prod.nameAr,
                                    prod.imageUrl
                                  );
                                  const { Icon: CatIcon, color: catColor, bg: catBg } = getFleetCategoryIcon(
                                    prod.category,
                                    prod.nameAr
                                  );

                                  return (
                                    <div
                                      key={prod.barcode}
                                      onClick={() => handleAdjustMorningBasket(prod.barcode, 1)}
                                      className={`group rounded-xl border bg-white p-1.5 flex flex-col justify-between transition-all cursor-pointer select-none ${
                                        qtyInBasket > 0
                                          ? 'border-[#00A046] ring-1 ring-[#00A046]/25 shadow-2xs bg-[#ECFDF5]/20'
                                          : 'border-[#DCE5DC] hover:border-[#00A046]/60'
                                      }`}
                                    >
                                      <div className="relative h-14 sm:h-16 w-full rounded-lg bg-white p-1 mb-1 flex items-center justify-center overflow-hidden border border-[#F1F5F2]">
                                        <img
                                          src={thumb}
                                          alt={prod.nameAr}
                                          referrerPolicy="no-referrer"
                                          loading="lazy"
                                          className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-200"
                                        />

                                        <span
                                          className={`absolute top-1 start-1 w-4 h-4 rounded-md border flex items-center justify-center ${catBg}`}
                                        >
                                          <CatIcon className={`w-2.5 h-2.5 ${catColor}`} />
                                        </span>

                                        {qtyInBasket > 0 && (
                                          <span className="absolute top-1 end-1 min-w-[18px] h-[18px] px-1 rounded-md bg-[#00A046] text-white text-[9.5px] font-black font-mono tabular-nums flex items-center justify-center shadow-xs">
                                            {qtyInBasket}
                                          </span>
                                        )}
                                      </div>

                                      <div className="space-y-1 flex-1 flex flex-col justify-between">
                                        <h5
                                          className="text-[10px] sm:text-[10.5px] font-black text-[#142018] line-clamp-2 leading-tight min-h-[25px]"
                                          title={prod.nameAr}
                                        >
                                          {prod.nameAr}
                                        </h5>

                                        <div className="pt-1 border-t border-[#F0F3EE] flex items-center justify-between gap-1">
                                          <span className="text-[9.5px] sm:text-[10px] font-black font-mono tabular-nums text-[#0B5D32] truncate">
                                            {formatCurrency(prod.defaultPriceIQD, currency, language)}
                                          </span>

                                          {qtyInBasket === 0 ? (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleAdjustMorningBasket(prod.barcode, 1);
                                              }}
                                              className="w-6 h-6 rounded-md bg-[#00A046] hover:bg-[#008a3c] text-white flex items-center justify-center transition cursor-pointer shrink-0"
                                              aria-label={isAr ? 'إضافة للتحميل' : 'Add to load'}
                                            >
                                              <Plus className="w-3 h-3 stroke-[2.5]" />
                                            </button>
                                          ) : (
                                            <div
                                              onClick={(e) => e.stopPropagation()}
                                              className="h-6 flex items-center bg-[#00A046] text-white rounded-md overflow-hidden shrink-0"
                                            >
                                              <button
                                                type="button"
                                                onClick={() => handleAdjustMorningBasket(prod.barcode, -1)}
                                                className="px-1 h-full hover:bg-black/15 cursor-pointer flex items-center justify-center"
                                                aria-label={isAr ? 'إنقاص' : 'Decrease'}
                                              >
                                                <Minus className="w-2.5 h-2.5 stroke-[3]" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleAdjustMorningBasket(prod.barcode, 1)}
                                                className="px-1 h-full hover:bg-black/15 cursor-pointer flex items-center justify-center"
                                                aria-label={isAr ? 'زيادة' : 'Increase'}
                                              >
                                                <Plus className="w-2.5 h-2.5 stroke-[3]" />
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : loadCatalogView === 'grid' ? (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[440px] overflow-y-auto pe-0.5">
                                {filteredCashierProducts.map((prod) => {
                                  const qtyInBasket = morningLoadBasket[prod.barcode] || 0;
                                  const thumb = resolveFleetProductImage(
                                    prod.barcode,
                                    prod.nameAr,
                                    prod.imageUrl
                                  );
                                  const { Icon: CatIcon, color: catColor, bg: catBg } = getFleetCategoryIcon(
                                    prod.category,
                                    prod.nameAr
                                  );

                                  return (
                                    <div
                                      key={prod.barcode}
                                      onClick={() => handleAdjustMorningBasket(prod.barcode, 1)}
                                      className={`group rounded-2xl border bg-white p-2.5 flex flex-col justify-between transition-all cursor-pointer select-none ${
                                        qtyInBasket > 0
                                          ? 'border-[#00A046] ring-1 ring-[#00A046]/25 shadow-xs bg-[#ECFDF5]/20'
                                          : 'border-[#DCE5DC] hover:border-[#00A046]/60'
                                      }`}
                                    >
                                      <div className="relative h-24 w-full rounded-xl bg-white p-1.5 mb-2 flex items-center justify-center overflow-hidden border border-[#F1F5F2]">
                                        <img
                                          src={thumb}
                                          alt={prod.nameAr}
                                          referrerPolicy="no-referrer"
                                          loading="lazy"
                                          className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-200"
                                        />
                                        <span
                                          className={`absolute top-1.5 start-1.5 w-5 h-5 rounded-md border flex items-center justify-center ${catBg}`}
                                        >
                                          <CatIcon className={`w-3 h-3 ${catColor}`} />
                                        </span>
                                        {qtyInBasket > 0 && (
                                          <span className="absolute top-1.5 end-1.5 min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#00A046] text-white text-[10.5px] font-black font-mono tabular-nums flex items-center justify-center shadow-xs">
                                            {qtyInBasket}
                                          </span>
                                        )}
                                      </div>

                                      <div className="space-y-1 flex-1 flex flex-col justify-between">
                                        <div>
                                          <h5 className="text-xs font-black text-[#142018] line-clamp-2 leading-snug min-h-[32px]">
                                            {prod.nameAr}
                                          </h5>
                                          <div className="text-[10.5px] text-[#6B7280] truncate mt-0.5">
                                            {prod.unit}
                                          </div>
                                        </div>

                                        <div className="pt-2 mt-1.5 border-t border-[#F0F3EE] flex items-center justify-between gap-1.5">
                                          <span className="text-xs font-black font-mono tabular-nums text-[#0B5D32] truncate">
                                            {formatCurrency(prod.defaultPriceIQD, currency, language)}
                                          </span>

                                          {qtyInBasket === 0 ? (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleAdjustMorningBasket(prod.barcode, 1);
                                              }}
                                              className="h-7 px-2.5 rounded-lg bg-[#00A046] hover:bg-[#008a3c] text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
                                            >
                                              <Plus className="w-3 h-3 stroke-[2.5]" />
                                              <span>{isAr ? 'أضف' : 'Add'}</span>
                                            </button>
                                          ) : (
                                            <div
                                              onClick={(e) => e.stopPropagation()}
                                              className="h-7 flex items-center bg-[#00A046] text-white rounded-lg overflow-hidden shrink-0"
                                            >
                                              <button
                                                type="button"
                                                onClick={() => handleAdjustMorningBasket(prod.barcode, -1)}
                                                className="px-1.5 h-full hover:bg-black/15 cursor-pointer flex items-center justify-center"
                                              >
                                                <Minus className="w-3 h-3 stroke-[3]" />
                                              </button>
                                              <span className="px-1.5 text-[11px] font-mono font-black tabular-nums">
                                                {qtyInBasket}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => handleAdjustMorningBasket(prod.barcode, 1)}
                                                className="px-1.5 h-full hover:bg-black/15 cursor-pointer flex items-center justify-center"
                                              >
                                                <Plus className="w-3 h-3 stroke-[3]" />
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="bg-white rounded-xl border border-[#DCE5DC] divide-y divide-[#F1F3F5] max-h-[440px] overflow-y-auto">
                                {filteredCashierProducts.map((prod) => {
                                  const qtyInBasket = morningLoadBasket[prod.barcode] || 0;
                                  const thumb = resolveFleetProductImage(
                                    prod.barcode,
                                    prod.nameAr,
                                    prod.imageUrl
                                  );
                                  const { Icon: CatIcon, color: catColor, bg: catBg } = getFleetCategoryIcon(
                                    prod.category,
                                    prod.nameAr
                                  );

                                  return (
                                    <div
                                      key={prod.barcode}
                                      onClick={() => handleAdjustMorningBasket(prod.barcode, 1)}
                                      className={`p-2.5 flex items-center justify-between gap-2.5 transition cursor-pointer ${
                                        qtyInBasket > 0 ? 'bg-[#ECFDF5]/35' : 'hover:bg-[#F8FAF7]'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <div className="w-11 h-11 rounded-xl bg-white border border-[#EAEFEA] p-1 flex items-center justify-center shrink-0">
                                          <img
                                            src={thumb}
                                            alt={prod.nameAr}
                                            referrerPolicy="no-referrer"
                                            className="max-h-full max-w-full object-contain mix-blend-multiply"
                                          />
                                        </div>
                                        <div className="min-w-0">
                                          <h5 className="text-xs font-black text-[#142018] truncate flex items-center gap-1.5">
                                            <span
                                              className={`w-5 h-5 rounded-md border inline-flex items-center justify-center shrink-0 ${catBg}`}
                                            >
                                              <CatIcon className={`w-3 h-3 ${catColor}`} />
                                            </span>
                                            <span className="truncate">{prod.nameAr}</span>
                                          </h5>
                                          <div className="text-[10.5px] text-[#5F7164] tabular-nums flex items-center gap-1.5 flex-wrap mt-0.5">
                                            <span>{prod.unit}</span>
                                            <span>·</span>
                                            <span className="font-mono font-bold text-[#0B5D32]">
                                              {formatCurrency(prod.defaultPriceIQD, currency, language)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="shrink-0"
                                      >
                                        {qtyInBasket === 0 ? (
                                          <button
                                            type="button"
                                            onClick={() => handleAdjustMorningBasket(prod.barcode, 1)}
                                            className="h-8 px-3 rounded-xl bg-[#00A046] hover:bg-[#008a3c] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                                          >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>{isAr ? 'أضف' : 'Add'}</span>
                                          </button>
                                        ) : (
                                          <div className="h-8 flex items-center bg-[#00A046] text-white rounded-xl overflow-hidden">
                                            <button
                                              type="button"
                                              onClick={() => handleAdjustMorningBasket(prod.barcode, -1)}
                                              className="px-2 h-full hover:bg-black/15 cursor-pointer"
                                            >
                                              <Minus className="w-3 h-3 stroke-[3]" />
                                            </button>
                                            <span className="px-2 text-xs font-mono font-black tabular-nums">
                                              {qtyInBasket}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => handleAdjustMorningBasket(prod.barcode, 1)}
                                              className="px-2 h-full hover:bg-black/15 cursor-pointer"
                                            >
                                              <Plus className="w-3 h-3 stroke-[3]" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Cashier Load-Out Dispatch Footer Bar */}
                            <div className="bg-[#F7F8FA] border border-[#DCE5DC] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <div className="min-w-0 text-xs tabular-nums">
                                {basketEntries.length === 0 ? (
                                  <span className="text-[#5F7164] font-bold">
                                    {isAr
                                      ? 'اختر الأصناف من الكاشير أعلاه لتجهيز حمولة الفان الصباحية.'
                                      : 'Tap mini product cards above to stage morning van load.'}
                                  </span>
                                ) : (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-black text-[#142018]">
                                      {isAr
                                        ? `سلة التحميل: ${basketEntries.length} صنف · ${basketUnitsCount} وحدة`
                                        : `Load Basket: ${basketEntries.length} items · ${basketUnitsCount} units`}
                                    </span>
                                    <span className="text-[#CBD5E1]" aria-hidden="true">|</span>
                                    <span className="font-mono font-black text-[#00A046]">
                                      {formatCurrency(basketTotalIQD, currency, language)}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {basketEntries.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setMorningLoadBasket({})}
                                    className="h-9 px-3 rounded-xl bg-white border border-[#DCE5DC] hover:bg-red-50 hover:text-red-700 text-xs font-bold text-[#5F7164] cursor-pointer transition"
                                  >
                                    {isAr ? 'تفريغ' : 'Clear'}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={basketEntries.length === 0 || isLoadingStock}
                                  onClick={handleDispatchMorningLoadBasket}
                                  className="h-9 px-4 rounded-xl bg-[#00A046] hover:bg-[#008a3c] disabled:bg-gray-300 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition whitespace-nowrap"
                                >
                                  <Check className="w-4 h-4 stroke-[2.5]" />
                                  <span>
                                    {isLoadingStock
                                      ? isAr
                                        ? 'جاري التحميل...'
                                        : 'Loading...'
                                      : isAr
                                      ? `تحميل للفان (${basketUnitsCount})`
                                      : `Load Van (${basketUnitsCount})`}
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Isolated Current Van Stock Tab (Completely Separated from Load Cashier) */
                          <div className="space-y-3">
                            <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums">
                              <span className="font-bold text-[#4B6352]">
                                {isAr ? 'ملخص عهدة الفان الحالية:' : 'Current Van Custody Summary:'}
                              </span>
                              <div className="flex items-center gap-3 font-mono font-bold">
                                <span className="text-[#1F2328]">
                                  {isAr ? `محمّل ${selectedFleet.totalLoadedUnits}` : `Loaded ${selectedFleet.totalLoadedUnits}`}
                                </span>
                                <span className="text-[#00A046]">
                                  {isAr ? `مباع ${selectedFleet.totalSoldUnits}` : `Sold ${selectedFleet.totalSoldUnits}`}
                                </span>
                                <span className="text-[#0B5D32] font-black">
                                  {isAr ? `متبقي ${selectedFleet.totalRemainingUnits}` : `Left ${selectedFleet.totalRemainingUnits}`}
                                </span>
                              </div>
                            </div>

                            <div className="divide-y divide-[#F1F3F5]">
                              {selectedFleet.inventory.length === 0 ? (
                                <div className="py-8 text-center text-xs text-[#6B7280] font-bold space-y-2">
                                  <p>
                                    {isAr
                                      ? 'لا توجد أصناف محمّلة في هذا الفان حالياً.'
                                      : 'No inventory loaded in this van yet.'}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => setVanStockSubMode('load_cashier')}
                                    className="px-3.5 py-1.5 rounded-xl bg-[#00A046] text-white text-xs font-black cursor-pointer"
                                  >
                                    {isAr ? 'الانتقال إلى كاشير التحميل' : 'Go to Load Cashier'}
                                  </button>
                                </div>
                              ) : (
                                selectedFleet.inventory.map((inv: any) => {
                                  const catalogMatch = fleetCatalog.find((p) => p.barcode === inv.barcode);
                                  const thumb = resolveFleetProductImage(
                                    inv.barcode,
                                    inv.productName,
                                    inv.imageUrl || catalogMatch?.imageUrl
                                  );
                                  const { Icon: CatIcon, color: catColor, bg: catBg } = getFleetCategoryIcon(
                                    inv.category || catalogMatch?.category,
                                    inv.productName
                                  );
                                  const isBusy = adjustingStockBarcode === inv.barcode;

                                  return (
                                    <div
                                      key={inv.id}
                                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E7EB] p-1 flex items-center justify-center shrink-0">
                                          <img
                                            src={thumb}
                                            alt={inv.productName}
                                            referrerPolicy="no-referrer"
                                            className="max-h-full max-w-full object-contain mix-blend-multiply"
                                          />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="font-black text-[#1F2328] flex items-center gap-1.5">
                                            <span
                                              className={`w-5 h-5 rounded-md border inline-flex items-center justify-center shrink-0 ${catBg}`}
                                            >
                                              <CatIcon className={`w-3 h-3 ${catColor}`} />
                                            </span>
                                            <span className="truncate">{inv.productName}</span>
                                          </div>
                                          <div className="text-[11px] text-[#6B7280] mt-0.5 flex items-center gap-2 flex-wrap tabular-nums">
                                            <span>{inv.unit}</span>
                                            <span>·</span>
                                            <span className="font-mono font-bold text-[#1F2328]">
                                              {formatCurrency(inv.unitPriceIQD, currency, language)}
                                            </span>
                                          </div>
                                          <div className="text-[11px] mt-1 flex items-center gap-3 tabular-nums">
                                            <span className="text-[#6B7280]">
                                              {isAr ? 'محمّل:' : 'Loaded:'}{' '}
                                              <strong className="font-mono text-[#1F2328]">{inv.loadedQuantity}</strong>
                                            </span>
                                            <span className="text-[#00A046] font-bold">
                                              {isAr ? 'مباع:' : 'Sold:'}{' '}
                                              <strong className="font-mono">{inv.soldQuantity}</strong>
                                            </span>
                                            <span className="text-[#1F2328] font-black">
                                              {isAr ? 'متبقي:' : 'Left:'}{' '}
                                              <strong className="font-mono text-[#0B5D32]">{inv.remainingQuantity}</strong>
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Inline +/- Adjustment Controls for Isolated Current Van Stock */}
                                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                                        <span className="text-[10.5px] font-bold text-[#6B7280] sm:hidden">
                                          {isAr ? 'تعديل المخزون:' : 'Adjust Stock:'}
                                        </span>
                                        <div className="flex items-center gap-1 bg-[#F7F8FA] border border-[#DCE5DC] rounded-xl p-1">
                                          <button
                                            type="button"
                                            disabled={isBusy || inv.remainingQuantity <= 0}
                                            onClick={() => handleAdjustLoadedVanStock(inv.barcode, -1)}
                                            className="w-8 h-8 rounded-lg bg-white hover:bg-red-50 hover:text-red-700 border border-[#E5E7EB] disabled:opacity-40 flex items-center justify-center text-[#1F2328] cursor-pointer transition"
                                            title={isAr ? 'إنقاص وحدة (-1)' : 'Decrease (-1)'}
                                            aria-label={isAr ? 'إنقاص وحدة' : 'Decrease by 1'}
                                          >
                                            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                                          </button>
                                          <span className="min-w-[30px] text-center font-mono font-black text-xs text-[#0B5D32] tabular-nums">
                                            {inv.remainingQuantity}
                                          </span>
                                          <button
                                            type="button"
                                            disabled={isBusy}
                                            onClick={() => handleAdjustLoadedVanStock(inv.barcode, 1)}
                                            className="w-8 h-8 rounded-lg bg-[#00A046] hover:bg-[#008a3c] disabled:opacity-40 text-white flex items-center justify-center cursor-pointer transition"
                                            title={isAr ? 'زيادة وحدة (+1)' : 'Increase (+1)'}
                                            aria-label={isAr ? 'زيادة وحدة' : 'Increase by 1'}
                                          >
                                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Right 5 Cols: Route Stops + Recent Field Transactions + Shift Approvals */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Daily Route Assignment */}
                  <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 space-y-3">
                    <h4 className="font-black text-sm text-[#1F2328] flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-[#00A046]" />
                      <span>{isAr ? 'خط السير اليومي للفان' : 'Daily Route Stops'}</span>
                    </h4>

                    <form onSubmit={handleAssignRouteStop} className="space-y-2 text-xs bg-[#F7F8FA] p-3 rounded-xl border border-[#E5E7EB]">
                      <div className="flex gap-2">
                        <select
                          value={newStopStoreId}
                          onChange={(e) => setNewStopStoreId(e.target.value)}
                          className="flex-1 bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-2 text-xs font-bold"
                        >
                          {fleetStores.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name} ({st.district})
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="px-3 py-2 rounded-lg bg-[#00A046] hover:bg-[#008a3c] text-white font-bold text-xs cursor-pointer shrink-0"
                        >
                          {isAr ? '+ إضافة' : '+ Add'}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={newStopNotes}
                        onChange={(e) => setNewStopNotes(e.target.value)}
                        placeholder={isAr ? 'توجيه للسائق (مثال: تحصيل آجل أو عرض خاص)...' : 'Driver instruction...'}
                        className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </form>

                    <div className="divide-y divide-[#F1F3F5] text-xs">
                      {selectedFleet.routeStops.map((st: any) => (
                        <div key={st.id} className="py-2.5 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-bold text-[#1F2328] truncate">
                              {st.sequence}. {st.storeName}
                            </div>
                            <div className="text-[10.5px] text-[#6B7280] flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{st.district}</span>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                              st.status === 'sold'
                                ? 'bg-emerald-50 text-[#00A046]'
                                : st.status === 'visited'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {st.status === 'sold'
                              ? isAr ? 'تم البيع' : 'Sold'
                              : st.status === 'visited'
                              ? isAr ? 'تمت الزيارة' : 'Visited'
                              : isAr ? 'بانتظار الزيارة' : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shift Close Reports Pending Approval */}
                  {shiftReports.length > 0 && (
                    <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 space-y-3">
                      <h4 className="font-black text-sm text-[#1F2328] flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-amber-600" />
                        <span>{isAr ? 'تقارير إغلاق الوردية ومطابقة الصندوق' : 'Shift Reconciliation Reports'}</span>
                      </h4>
                      <div className="space-y-2.5 text-xs">
                        {shiftReports.map((rep) => (
                          <div key={rep.id} className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#1F2328]">{rep.driverName}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  rep.status === 'settled'
                                    ? 'bg-emerald-50 text-[#00A046]'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {rep.status === 'settled'
                                  ? isAr ? 'معتمد ومسوى' : 'Settled'
                                  : isAr ? 'بانتظار الاعتماد' : 'Pending Approval'}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 font-mono text-[11px] tabular-nums">
                              <div>
                                <span className="text-[#6B7280] block">{isAr ? 'المتوقع' : 'Expected'}</span>
                                <strong>{formatCurrency(rep.expectedCashIQD, currency, language)}</strong>
                              </div>
                              <div>
                                <span className="text-[#6B7280] block">{isAr ? 'الفعلي' : 'Actual'}</span>
                                <strong>{formatCurrency(rep.actualCashIQD, currency, language)}</strong>
                              </div>
                              <div>
                                <span className="text-[#6B7280] block">{isAr ? 'الفرق' : 'Variance'}</span>
                                <strong className={rep.cashVarianceIQD < 0 ? 'text-red-600' : 'text-[#00A046]'}>
                                  {formatCurrency(rep.cashVarianceIQD, currency, language)}
                                </strong>
                              </div>
                            </div>
                            {rep.status !== 'settled' && (
                              <button
                                type="button"
                                onClick={() => handleSettleShiftReport(rep.id)}
                                className="w-full py-2 rounded-lg bg-[#00A046] hover:bg-[#008a3c] text-white font-bold text-xs cursor-pointer"
                              >
                                {isAr ? 'اعتماد ومطابقة الصندوق وفتح وردية جديدة' : 'Approve & Settle Shift'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Van Transactions */}
                  <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 space-y-2.5">
                    <h4 className="font-black text-sm text-[#1F2328]">
                      {isAr ? 'آخر الحركات الميدانية للفان' : 'Recent Van Transactions'}
                    </h4>
                    {selectedFleet.transactions.length === 0 ? (
                      <div className="text-xs text-[#6B7280] py-4 text-center">
                        {isAr ? 'لا توجد حركات مسجلة لهذا الفان اليوم' : 'No transactions logged today'}
                      </div>
                    ) : (
                      <div className="divide-y divide-[#F1F3F5] text-xs">
                        {selectedFleet.transactions.slice(0, 5).map((tx: any) => (
                          <div key={tx.id} className="py-2 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-bold text-[#1F2328] truncate">{tx.storeName}</div>
                              <div className="text-[10.5px] text-[#6B7280] font-mono">
                                {tx.receiptNumber} ·{' '}
                                {tx.type === 'debt_collection'
                                  ? isAr ? 'تحصيل آجل' : 'Collection'
                                  : isAr ? 'بيع مباشر' : 'Direct Sale'}
                              </div>
                            </div>
                            <span className="font-mono font-black text-[#00A046] tabular-nums shrink-0">
                              {formatCurrency(tx.totalAmountIQD, currency, language)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

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

      {/* MODAL: Register New Van / Driver */}
      {showAddDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-right shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-[#1F2328] flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#00A046]" />
                <span>{isAr ? 'إضافة فان ومندوب جديد للأسطول' : 'Register New Van & Driver'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddDriverModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-3 text-xs">
              <div>
                <label className="text-[#6B7280] font-bold block mb-1">{isAr ? 'اسم السائق / المندوب:' : 'Driver Name:'}</label>
                <input
                  type="text"
                  required
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  placeholder={isAr ? 'مثال: حيدر عباس العبيدي' : 'Driver full name'}
                  className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">{isAr ? 'رقم الهاتف:' : 'Phone:'}</label>
                  <input
                    type="text"
                    value={newDriverPhone}
                    onChange={(e) => setNewDriverPhone(e.target.value)}
                    placeholder="+964 770 ..."
                    className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">{isAr ? 'رقم لوحة المركبة:' : 'Plate Number:'}</label>
                  <input
                    type="text"
                    required
                    value={newDriverPlate}
                    onChange={(e) => setNewDriverPlate(e.target.value)}
                    placeholder={isAr ? 'بغداد 74512 أ' : 'Baghdad 74512'}
                    className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">{isAr ? 'نوع المركبة:' : 'Vehicle Model:'}</label>
                  <input
                    type="text"
                    value={newDriverModel}
                    onChange={(e) => setNewDriverModel(e.target.value)}
                    className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">{isAr ? 'اسم القاطع / الفان:' : 'Sector / Van Name:'}</label>
                  <input
                    type="text"
                    value={newDriverSector}
                    onChange={(e) => setNewDriverSector(e.target.value)}
                    placeholder={isAr ? 'فان 3 - الأعظمية' : 'Van #3 - Sector'}
                    className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">{isAr ? 'الهدف اليومي (د.ع):' : 'Daily Target (IQD):'}</label>
                  <input
                    type="number"
                    value={newDriverTarget}
                    onChange={(e) => setNewDriverTarget(e.target.value)}
                    className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">{isAr ? 'نسبة العمولة (%):' : 'Commission (%):'}</label>
                  <input
                    type="number"
                    step="0.25"
                    value={newDriverCommission}
                    onChange={(e) => setNewDriverCommission(e.target.value)}
                    className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-2.5 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDriverModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-bold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#00A046] hover:bg-[#008a3c] text-white font-bold cursor-pointer"
                >
                  {isAr ? 'حفظ وتسجيل الفان' : 'Save & Register Van'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
