import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  ShoppingCart,
  Banknote,
  RotateCcw,
  CheckCircle2,
  Wifi,
  WifiOff,
  Search,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  Receipt,
  Package,
  MapPin,
  CreditCard,
  Grid3X3,
  LayoutGrid,
  LayoutList,
  AlertCircle,
  ClipboardCheck,
  X,
  Lock,
  Store,
  Navigation,
  Wallet,
  Printer,
  Copy,
  Check,
  Phone,
  Target,
  Award,
  Clock,
  PackagePlus,
  Sparkles,
  Send
} from 'lucide-react';
import {
  VanStockItem,
  Currency,
  OrderItem,
  Language,
  ProductWithOffers
} from '../types/index.ts';
import { formatCurrency } from '../utils/format.ts';
import { translations, getLocalizedText } from '../utils/translations.ts';
import { DriverBottomNav, DriverBottomTab } from '../components/DriverBottomNav.tsx';
import { VanSmartNavigation } from '../components/VanSmartNavigation.tsx';
import { VanManagementPanel } from '../components/VanManagementPanel.tsx';
import {
  SupplierCategorySlider,
  matchesSupplierCategoryAndBranch
} from '../components/SupplierCategorySlider.tsx';

interface DriverVanViewProps {
  currency: Currency;
  isOnline: boolean;
  orders: OrderItem[];
  products?: ProductWithOffers[];
  onRefreshOrders: () => void;
  language?: Language;
}

interface VanCartLine {
  barcode: string;
  productName: string;
  unit: string;
  unitPriceIQD: number;
  qty: number;
  maxStock: number;
  imageUrl: string;
}

function resolveVanProductImage(
  barcode: string,
  productName: string,
  products: ProductWithOffers[] = []
): string {
  const matched = products.find((p) => p.barcode === barcode);
  if (matched?.imageUrl) return matched.imageUrl;

  const lower = (productName || '').toLowerCase();
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

export const DriverVanView: React.FC<DriverVanViewProps> = ({
  currency,
  isOnline,
  orders,
  products = [],
  onRefreshOrders,
  language = 'ar'
}) => {
  const isAr = language === 'ar';
  const t = translations[language];

  const driverId = 'drv_ahmed_baghdad';
  const [vanStock, setVanStock] = useState<VanStockItem[]>([]);
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Bottom nav primary tabs & Cashier sub-tabs
  const [driverTab, setDriverTab] = useState<DriverBottomTab>('pos');
  const [posSubTab, setPosSubTab] = useState<'sell' | 'collections' | 'returns'>('sell');
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogView, setCatalogView] = useState<'mini' | 'grid' | 'list'>('grid');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // DSD Fleet Data: Route Stops, Credit Accounts, Transactions, Commission, Supplier Store Catalog & Load Requests
  const [routeStops, setRouteStops] = useState<any[]>([]);
  const [creditAccounts, setCreditAccounts] = useState<any[]>([]);
  const [vanTransactions, setVanTransactions] = useState<any[]>([]);
  const [commissionSummary, setCommissionSummary] = useState<any>(null);
  const [loadRequests, setLoadRequests] = useState<any[]>([]);
  const [supplierCatalog, setSupplierCatalog] = useState<any[]>([]);
  const [vanStores, setVanStores] = useState<any[]>([]);

  // Van POS Category & Subcategory Filter (scoped to supplier's products)
  const [posCategory, setPosCategory] = useState<string>('الكل');
  const [posBranchId, setPosBranchId] = useState<string>('all');

  // Van Restock (تجهيز الفان من متجر المورد) State
  const [restockCart, setRestockCart] = useState<Record<string, number>>({});
  const [restockSearch, setRestockSearch] = useState('');
  const [restockCategory, setRestockCategory] = useState<string>('الكل');
  const [restockBranchId, setRestockBranchId] = useState<string>('all');
  const [restockNotes, setRestockNotes] = useState('');
  const [isSubmittingRestock, setIsSubmittingRestock] = useState(false);

  // Debt Collection State
  const [collectStoreId, setCollectStoreId] = useState('store_almansoor');
  const [collectAmountInput, setCollectAmountInput] = useState('');
  const [collectNotes, setCollectNotes] = useState('');
  const [isCollectingDebt, setIsCollectingDebt] = useState(false);

  // Printable / Shareable Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<any>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Van Cashier Cart (Multi-item POS checkout)
  const [vanCart, setVanCart] = useState<VanCartLine[]>([]);
  const [targetStoreId, setTargetStoreId] = useState('store_almansoor');
  const [salePaymentType, setSalePaymentType] = useState<'cash' | 'credit'>('cash');
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  // Returns / Damaged form
  const [returnBarcode, setReturnBarcode] = useState('');
  const [returnQty, setReturnQty] = useState(1);
  const [returnType, setReturnType] = useState<'return' | 'damage'>('return');
  const [returnReason, setReturnReason] = useState('');
  const [isLoggingReturn, setIsLoggingReturn] = useState(false);

  // Daily Shift Close Modal
  const [showShiftCloseModal, setShowShiftCloseModal] = useState(false);
  const [actualCashInput, setActualCashInput] = useState('');
  const [shiftCloseError, setShiftCloseError] = useState<string | null>(null);
  const [shiftCloseResult, setShiftCloseResult] = useState<any>(null);

  // Delivery confirmation modal with PIN
  const [deliveringOrder, setDeliveringOrder] = useState<OrderItem | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Inline feedback banner (replaces alert())
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadVanData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/van/inventory/${driverId}`);
      const data = await res.json();
      if (data.success) {
        setVanStock(data.inventory || []);
        setDriverInfo(data.driver || null);
        setRouteStops(data.routeStops || []);
        setCreditAccounts(data.creditAccounts || []);
        setVanTransactions(data.transactions || []);
        setCommissionSummary(data.commissionSummary || null);
        setLoadRequests(data.loadRequests || []);
        setSupplierCatalog(data.supplierCatalog || []);
        setVanStores(data.stores || []);
        if (data.inventory?.length > 0 && !returnBarcode) {
          setReturnBarcode(data.inventory[0].barcode);
        }
      }
    } catch (err) {
      console.error(err);
      setFeedback({
        type: 'error',
        text: isAr ? 'تعذر تحميل بيانات الفان حالياً.' : 'Failed to load van data.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVanData();
  }, []);

  // Smart Restock Auto-Fill (replaces today's sold units automatically)
  const handleSmartRestockFill = () => {
    const suggested: Record<string, number> = {};
    vanStock.forEach((item) => {
      const needed = Math.max(item.soldQuantity || 0, item.remainingQuantity < 10 ? 15 : 0);
      if (needed > 0) {
        suggested[item.barcode] = needed;
      }
    });
    if (Object.keys(suggested).length === 0 && supplierCatalog.length > 0) {
      suggested[supplierCatalog[0].barcode] = 10;
    }
    setRestockCart(suggested);
    setFeedback({
      type: 'success',
      text: isAr
        ? 'تم تعبئة سلة التجهيز تلقائياً لتعويض الكميات المباعة والنواقص في الفان.'
        : 'Restock cart auto-filled based on today’s sold quantities and low stock.'
    });
  };

  const handleAdjustRestockQty = (barcode: string, delta: number) => {
    setRestockCart((prev) => {
      const next = (prev[barcode] || 0) + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[barcode];
        return copy;
      }
      return { ...prev, [barcode]: next };
    });
  };

  const handleSubmitLoadRequest = async () => {
    const items = Object.entries(restockCart)
      .filter(([, qty]) => qty > 0)
      .map(([barcode, quantity]) => ({ barcode, quantity }));
    if (items.length === 0 || isSubmittingRestock) return;
    setIsSubmittingRestock(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/van/load-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          items,
          notes: restockNotes
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (isAr ? 'فشل إرسال طلب التجهيز' : 'Failed to submit load request'));
      }
      setRestockCart({});
      setRestockNotes('');
      setFeedback({
        type: 'success',
        text: isAr
          ? `تم إرسال طلب تجهيز الفان (${data.data?.requestNumber}) إلى المورد/المحاسب. فور الموافقة ستُضاف البضاعة تلقائياً إلى كاشير الفان.`
          : `Load request ${data.data?.requestNumber} sent to supplier for approval.`
      });
      await loadVanData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || (isAr ? 'تعذر إرسال طلب التجهيز' : 'Restock submission error')
      });
    } finally {
      setIsSubmittingRestock(false);
    }
  };

  const assignedOrders = useMemo(
    () => orders.filter((o) => o.assignedDriverId === driverId && o.status !== 'cancelled'),
    [orders]
  );

  const pendingOrdersCount = useMemo(
    () => assignedOrders.filter((o) => o.status !== 'delivered').length,
    [assignedOrders]
  );

  const totalRemainingUnits = useMemo(
    () => vanStock.reduce((sum, item) => sum + (item.remainingQuantity || 0), 0),
    [vanStock]
  );

  const totalSoldUnits = useMemo(
    () => vanStock.reduce((sum, item) => sum + (item.soldQuantity || 0), 0),
    [vanStock]
  );

  const filteredVanStock = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return vanStock.filter((item: any) => {
      if (!matchesSupplierCategoryAndBranch(item, posCategory, posBranchId)) {
        return false;
      }
      if (!q) return true;
      return (
        item.productName.toLowerCase().includes(q) ||
        item.barcode.toLowerCase().includes(q) ||
        item.unit.toLowerCase().includes(q)
      );
    });
  }, [vanStock, searchQuery, posCategory, posBranchId]);

  // Cart helpers
  const getCartQty = (barcode: string) =>
    vanCart.find((c) => c.barcode === barcode)?.qty || 0;

  const handleAddToVanCart = (item: VanStockItem) => {
    if (item.remainingQuantity <= 0) return;
    setFeedback(null);
    setVanCart((prev) => {
      const existing = prev.find((c) => c.barcode === item.barcode);
      if (existing) {
        if (existing.qty >= item.remainingQuantity) return prev;
        return prev.map((c) =>
          c.barcode === item.barcode ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [
        ...prev,
        {
          barcode: item.barcode,
          productName: item.productName,
          unit: item.unit,
          unitPriceIQD: item.unitPriceIQD,
          qty: 1,
          maxStock: item.remainingQuantity,
          imageUrl: resolveVanProductImage(item.barcode, item.productName, products)
        }
      ];
    });
  };

  const handleUpdateCartQty = (barcode: string, delta: number) => {
    setVanCart((prev) =>
      prev
        .map((line) => {
          if (line.barcode !== barcode) return line;
          const next = Math.min(line.maxStock, line.qty + delta);
          return next <= 0 ? null : { ...line, qty: next };
        })
        .filter(Boolean) as VanCartLine[]
    );
  };

  const cartTotalIQD = useMemo(
    () => vanCart.reduce((sum, line) => sum + line.unitPriceIQD * line.qty, 0),
    [vanCart]
  );

  const cartUnitsCount = useMemo(
    () => vanCart.reduce((sum, line) => sum + line.qty, 0),
    [vanCart]
  );

  // Checkout all items in Van Cashier Cart via single unified /api/van/direct-sale request
  const handleCompleteVanSale = async () => {
    if (vanCart.length === 0 || isProcessingSale) return;
    setIsProcessingSale(true);
    setFeedback(null);

    try {
      const totalProcessedUnits = vanCart.reduce((s, l) => s + l.qty, 0);
      const res = await fetch('/api/van/direct-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          storeId: targetStoreId,
          items: vanCart.map((l) => ({ barcode: l.barcode, quantity: l.qty })),
          paymentType: salePaymentType
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (isAr ? 'فشل تسجيل البيع الفوري' : 'Direct sale failed'));
      }

      const grandTotal = data.data?.saleAmountIQD || cartTotalIQD;
      setVanCart([]);
      setFeedback({
        type: 'success',
        text: isAr
          ? `تم إصدار فاتورة بيع فوري (${totalProcessedUnits} وحدة) بقيمة ${formatCurrency(grandTotal, currency, language)} ومزامنة مخزون المتجر تلقائياً.`
          : `Instant sale completed (${totalProcessedUnits} units) totaling ${formatCurrency(grandTotal, currency, language)} & synced to store POS.`
      });
      if (data.data?.transaction) {
        setActiveReceipt(data.data.transaction);
        setCopiedReceipt(false);
      }
      await loadVanData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || (isAr ? 'حدث خطأ أثناء تسجيل البيع' : 'Error processing sale')
      });
    } finally {
      setIsProcessingSale(false);
    }
  };

  // Debt Collection Handler
  const handleCollectDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(collectAmountInput);
    if (!collectStoreId || !amount || amount <= 0 || isCollectingDebt) return;
    setIsCollectingDebt(true);
    setFeedback(null);

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
      setFeedback({
        type: 'success',
        text: isAr
          ? `تم تحصيل ${formatCurrency(amount, currency, language)} نقداً وتنزيلها من حساب الآجل وإضافتها لعهدة الكاش.`
          : `Collected ${formatCurrency(amount, currency, language)} cash and updated store ledger.`
      });
      if (data.data?.transaction) {
        setActiveReceipt(data.data.transaction);
        setCopiedReceipt(false);
      }
      await loadVanData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || (isAr ? 'تعذر تسجيل التحصيل' : 'Collection error')
      });
    } finally {
      setIsCollectingDebt(false);
    }
  };

  // Update Route Stop Status
  const handleUpdateRouteStop = async (stopId: string, status: 'pending' | 'visited' | 'sold' | 'skipped') => {
    try {
      const res = await fetch(`/api/van/route-stops/${stopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        await loadVanData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Copy WhatsApp-ready Receipt Text
  const handleCopyReceiptText = async (tx: any) => {
    if (!tx) return;
    const lines = [
      `🧾 *وصل ${tx.type === 'debt_collection' ? 'تحصيل آجل' : 'بيع مباشر من الفان'} — دليل الخيرات*`,
      `رقم الوصل: ${tx.receiptNumber}`,
      `المتجر: ${tx.storeName}`,
      `المندوب: ${tx.driverName}`,
      `طريقة الدفع: ${tx.paymentType === 'cash' ? 'نقدي (كاش)' : 'آجل على الحساب'}`,
      ...(tx.items?.length
        ? [
            '--- الأصناف ---',
            ...tx.items.map(
              (it: any) => `• ${it.productName} (${it.quantity} × ${it.unitPriceIQD.toLocaleString()} د.ع) = ${it.totalIQD.toLocaleString()} د.ع`
            )
          ]
        : []),
      `الإجمالي: ${tx.totalAmountIQD.toLocaleString()} د.ع`,
      tx.type === 'direct_sale' ? '✅ تمت مزامنة البضاعة تلقائياً إلى مخزون الكاشير.' : '✅ تم ترحيل الدفعة إلى دفتر الأستاذ (FIFO).'
    ].join('\n');

    try {
      await navigator.clipboard.writeText(lines);
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2500);
    } catch {
      setCopiedReceipt(false);
    }
  };

  // Handle Return / Damage
  const handleLogReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnBarcode || returnQty <= 0 || isLoggingReturn) return;
    setIsLoggingReturn(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/van/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          barcode: returnBarcode,
          quantity: returnQty,
          type: returnType,
          reason:
            returnReason.trim() ||
            (returnType === 'damage'
              ? isAr
                ? 'تلف أثناء النقل'
                : 'Transit damage'
              : isAr
              ? 'مرتجع متجر'
              : 'Store return')
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (isAr ? 'فشل قيد المرتجع' : 'Failed to log return'));
      }

      setFeedback({
        type: 'success',
        text: isAr
          ? `تم تسجيل ${returnType === 'damage' ? 'تالف' : 'مرتجع'} (${returnQty} وحدة) وتحديث عهدة الفان بنجاح.`
          : `Successfully recorded ${returnType === 'damage' ? 'damaged' : 'returned'} goods (${returnQty} units).`
      });
      setReturnQty(1);
      setReturnReason('');
      await loadVanData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || (isAr ? 'تعذر تسجيل القيد' : 'Failed to record entry')
      });
    } finally {
      setIsLoggingReturn(false);
    }
  };

  // Verify PIN for delivery
  const handleVerifyDeliveryPin = async () => {
    if (!deliveringOrder || !enteredPin) return;
    setPinError(null);

    try {
      const res = await fetch(`/api/van/delivery/${deliveringOrder.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          enteredPin
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPinError(
          data.message ||
            (isAr
              ? 'رمز التحقق (PIN) غير صحيح! اطلب الرمز الصحيح من صاحب المحل.'
              : 'Invalid delivery PIN. Please ask the store owner.')
        );
        return;
      }

      setFeedback({
        type: 'success',
        text: isAr
          ? `تم تسليم الطلبية ${deliveringOrder.id} بنجاح وقبض ${formatCurrency(deliveringOrder.subtotalIQD, currency, language)}.`
          : `Order ${deliveringOrder.id} delivered and ${formatCurrency(deliveringOrder.subtotalIQD, currency, language)} collected.`
      });
      setDeliveringOrder(null);
      setEnteredPin('');
      setPinError(null);
      onRefreshOrders();
      await loadVanData();
    } catch (err: any) {
      setPinError(err?.message || 'Error');
    }
  };

  // Handle Daily Shift Close
  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setShiftCloseError(null);
    const actualCash = parseFloat(actualCashInput);
    if (isNaN(actualCash) || actualCash < 0) {
      setShiftCloseError(isAr ? 'يرجى إدخال مبلغ صحيح بالدينار' : 'Please enter a valid cash amount');
      return;
    }

    try {
      const res = await fetch('/api/van/shift-close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          actualCashCountedIQD: actualCash
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (isAr ? 'فشل إغلاق الوردية' : 'Failed to close shift'));
      }

      setShiftCloseResult(data.data);
      await loadVanData();
    } catch (err: any) {
      setShiftCloseError(err?.message || (isAr ? 'تعذر إغلاق الوردية' : 'Failed to close shift'));
    }
  };

  const displayDriverName = isAr
    ? driverInfo?.name || t.driverDefaultName
    : 'Ahmed Kazem Al-Baghdadi';

  const displayVehiclePlate = isAr
    ? driverInfo?.vehiclePlate || t.driverDefaultPlate
    : 'Baghdad 48215 T';

  const displayVanWarehouse = isAr
    ? driverInfo?.vanWarehouseName || t.driverDefaultVan
    : 'Van #1 - Karkh & Mansoor District';

  const selectedReturnItem = vanStock.find((v) => v.barcode === returnBarcode);

  const pendingRestockCount = loadRequests.filter((r) => r.status === 'pending_approval').length;

  return (
    <div className="bg-[#F4F4EA] rounded-3xl border border-[#E2E6D7] p-3 sm:p-5 space-y-4 font-brand text-[#142018] pb-28">
      {/* ================= TOP VAN CASHIER HEADER ================= */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#0B5D32] text-white flex items-center justify-center shadow-2xs shrink-0">
            <Truck className="w-5 h-5 text-[#FFE600]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-[#0B5D32] leading-tight truncate">
                {displayDriverName}
              </h1>
              <span className="text-[11px] font-mono font-bold text-[#4B6352] whitespace-nowrap">
                {displayVehiclePlate}
              </span>
              <button
                type="button"
                onClick={() => setDriverTab('manage')}
                className={`inline-flex items-center gap-1 text-[10.5px] font-black px-2 py-0.5 rounded-full border cursor-pointer transition ${
                  driverInfo?.availabilityStatus === 'busy'
                    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    : 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0] hover:bg-[#D1FAE5]'
                }`}
                title={isAr ? 'اضغط لإدارة حالة الفان والمسار' : 'Manage Van Status & Route'}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    driverInfo?.availabilityStatus === 'busy' ? 'bg-amber-500' : 'bg-[#00A046] animate-pulse'
                  }`}
                />
                <span>
                  {driverInfo?.availabilityStatus === 'busy'
                    ? isAr ? 'مشغول' : 'Busy'
                    : isAr ? 'متاح' : 'Available'}
                </span>
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#5F7164] mt-0.5 flex-wrap">
              <span className="truncate">{displayVanWarehouse}</span>
              <span aria-hidden="true">·</span>
              {isOnline ? (
                <span className="inline-flex items-center gap-1 text-[#0B5D32] font-bold whitespace-nowrap">
                  <Wifi className="w-3 h-3" />
                  <span>{isAr ? 'متصل بالمستودع' : 'Online'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-700 font-bold whitespace-nowrap">
                  <WifiOff className="w-3 h-3" />
                  <span>{isAr ? 'وضع أوفلاين' : 'Offline'}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Workspace Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setShiftCloseError(null);
              setShiftCloseResult(null);
              setShowShiftCloseModal(true);
            }}
            className="min-h-[38px] px-3.5 py-2 rounded-full bg-[#FFA300] hover:bg-[#e69200] text-[#142018] font-black text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shadow-2xs"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{t.closeShiftBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => loadVanData()}
            disabled={loading}
            className="w-9 h-9 rounded-full bg-white border border-[#DCE5DC] hover:border-[#0B5D32] flex items-center justify-center text-[#3D5244] transition cursor-pointer shrink-0"
            title={isAr ? 'تحديث بيانات الفان' : 'Refresh Van Data'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* ================= COMPACT 3-KPI CUSTODY STRIP ================= */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3 sm:p-3.5">
          <div className="text-[10.5px] sm:text-[11px] font-bold text-[#5F7164] truncate">
            {t.cashInCustody}
          </div>
          <div className="text-sm sm:text-lg font-black font-mono tabular-nums text-[#0B5D32] mt-1 truncate">
            {formatCurrency(driverInfo?.currentCashCollectedIQD || 0, currency, language)}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3 sm:p-3.5">
          <div className="text-[10.5px] sm:text-[11px] font-bold text-[#5F7164] truncate">
            {isAr ? 'المتبقي بالفان' : 'Remaining Stock'}
          </div>
          <div className="text-sm sm:text-lg font-black font-mono tabular-nums text-[#142018] mt-1 flex items-baseline gap-1.5">
            <span>{totalRemainingUnits}</span>
            <span className="text-[10px] font-sans font-semibold text-[#5F7164] truncate">
              {isAr ? `وحدة · مباع ${totalSoldUnits}` : `left · ${totalSoldUnits} sold`}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDriverTab('deliveries')}
          className="bg-white rounded-2xl border border-[#DCE5DC] hover:border-[#0B5D32]/50 p-3 sm:p-3.5 text-start transition cursor-pointer"
        >
          <div className="text-[10.5px] sm:text-[11px] font-bold text-[#5F7164] truncate">
            {isAr ? 'طلبيات للتسليم' : 'Pending Orders'}
          </div>
          <div className="text-sm sm:text-lg font-black font-mono tabular-nums text-[#142018] mt-1 flex items-baseline gap-1.5">
            <span className={pendingOrdersCount > 0 ? 'text-amber-700' : 'text-[#0B5D32]'}>
              {pendingOrdersCount}
            </span>
            <span className="text-[10px] font-sans font-semibold text-[#5F7164] truncate">
              {isAr ? `من ${assignedOrders.length}` : `of ${assignedOrders.length}`}
            </span>
          </div>
        </button>
      </div>

      {/* ================= TARGET & COMMISSION TRACKER STRIP ================= */}
      {commissionSummary && (
        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-black text-[#142018] flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[#0B5D32]" />
                <span>{isAr ? 'هدف المبيعات والتحصيل اليومي' : 'Daily Sales & Collection Target'}</span>
              </span>
              <span className="font-mono font-black text-[#0B5D32] tabular-nums">
                {commissionSummary.targetProgressPercent}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#EAEFEA] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#0B5D32] transition-all duration-300"
                style={{ width: `${commissionSummary.targetProgressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#5F7164] font-mono tabular-nums">
              <span>
                {isAr ? 'المحقق: ' : 'Achieved: '}
                <strong className="text-[#142018]">
                  {formatCurrency(commissionSummary.totalAchievedIQD, currency, language)}
                </strong>
              </span>
              <span>
                {isAr ? 'الهدف: ' : 'Target: '}
                {formatCurrency(commissionSummary.dailyTargetIQD, currency, language)}
              </span>
            </div>
          </div>

          <div className="sm:border-s sm:border-[#EAEFEA] sm:ps-4 flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#0B5D32] flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10.5px] font-bold text-[#5F7164]">
                {isAr
                  ? `عمولتك اليوم (${commissionSummary.commissionRatePercent}%)`
                  : `Today's Commission (${commissionSummary.commissionRatePercent}%)`}
              </div>
              <div className="text-sm font-black font-mono tabular-nums text-[#0B5D32]">
                {formatCurrency(commissionSummary.estimatedCommissionIQD, currency, language)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= CASHIER SUB-NAVIGATION (shown inside كاشير tab) ================= */}
      {driverTab === 'pos' && (
        <div className="bg-white border border-[#DCE5DC] rounded-2xl p-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setPosSubTab('sell')}
            className={`flex-1 min-h-[38px] px-3 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              posSubTab === 'sell'
                ? 'bg-[#0B5D32] text-white shadow-2xs'
                : 'text-[#4B6352] hover:bg-[#F4F4EA]'
            }`}
          >
            <Receipt className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'كاشير البيع' : 'POS Sales'}</span>
            {cartUnitsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#FFE600] text-[#142018] text-[10px] font-black tabular-nums leading-none">
                {cartUnitsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setPosSubTab('collections')}
            className={`flex-1 min-h-[38px] px-3 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              posSubTab === 'collections'
                ? 'bg-[#0B5D32] text-white shadow-2xs'
                : 'text-[#4B6352] hover:bg-[#F4F4EA]'
            }`}
          >
            <Wallet className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'تحصيل الآجل' : 'Collections'}</span>
          </button>

          <button
            type="button"
            onClick={() => setPosSubTab('returns')}
            className={`flex-1 min-h-[38px] px-3 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              posSubTab === 'returns'
                ? 'bg-[#0B5D32] text-white shadow-2xs'
                : 'text-[#4B6352] hover:bg-[#F4F4EA]'
            }`}
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'مرتجع وتالف' : 'Returns'}</span>
          </button>
        </div>
      )}

      {/* ================= INLINE FEEDBACK BANNER ================= */}
      {feedback && (
        <div
          className={`rounded-2xl p-3 border flex items-center justify-between gap-2 text-xs font-bold ${
            feedback.type === 'success'
              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="w-6 h-6 rounded-full hover:bg-black/5 flex items-center justify-center cursor-pointer shrink-0"
            aria-label={isAr ? 'إغلاق' : 'Dismiss'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: VAN CASHIER TERMINAL (POS CATALOG + LIVE RECEIPT)              */}
      {/* ===================================================================== */}
      {driverTab === 'pos' && posSubTab === 'sell' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT: Van Inventory Catalog with Thumbnails */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-3">
            {/* Search & Layout Toolbar */}
            <div className="bg-white rounded-2xl border border-[#DCE5DC] p-2.5 flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-[#5F7164] absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isAr ? 'ابحث في حمولة الفان بالاسم أو الباركود...' : 'Search van stock by name or barcode...'
                  }
                  className="w-full bg-[#F8FAF7] border border-[#DCE5DC] focus:border-[#0B5D32] focus:bg-white rounded-xl py-2 ps-9 pe-3 text-xs text-[#142018] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#F4F4EA] p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setCatalogView('mini')}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
                    catalogView === 'mini'
                      ? 'bg-[#0B5D32] text-white shadow-2xs'
                      : 'text-[#4B6352] hover:text-[#142018]'
                  }`}
                  title={isAr ? 'عرض شبكي مصغّر' : 'Mini Grid View'}
                  aria-label={isAr ? 'عرض شبكي مصغّر' : 'Mini Grid View'}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogView('grid')}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
                    catalogView === 'grid'
                      ? 'bg-[#0B5D32] text-white shadow-2xs'
                      : 'text-[#4B6352] hover:text-[#142018]'
                  }`}
                  title={isAr ? 'عرض شبكي' : 'Grid view'}
                  aria-label={isAr ? 'عرض شبكي' : 'Grid view'}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogView('list')}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
                    catalogView === 'list'
                      ? 'bg-[#0B5D32] text-white shadow-2xs'
                      : 'text-[#4B6352] hover:text-[#142018]'
                  }`}
                  title={isAr ? 'عرض قائمة' : 'List view'}
                  aria-label={isAr ? 'عرض قائمة' : 'List view'}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Supplier-Scoped Main & Subcategory Slider for Van POS */}
            <SupplierCategorySlider
              items={vanStock as any[]}
              selectedCategory={posCategory}
              selectedBranchId={posBranchId}
              onSelectCategory={setPosCategory}
              onSelectBranch={setPosBranchId}
              language={language}
              supplierLabel={driverInfo?.supplierName || (isAr ? 'شركة الرافدين للتجارة' : 'Al-Rafidain')}
            />

            {/* Product Cards Mini Grid / Grid / List */}
            {filteredVanStock.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#DCE5DC] p-10 text-center space-y-2">
                <Package className="w-9 h-9 text-[#9CA3AF] mx-auto" />
                <div className="text-xs font-bold text-[#5F7164]">
                  {isAr ? 'لا توجد أصناف مطابقة في حمولة الفان' : 'No matching items in van stock'}
                </div>
              </div>
            ) : catalogView === 'mini' ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {filteredVanStock.map((item) => {
                  const inCartQty = getCartQty(item.barcode);
                  const imgSrc = resolveVanProductImage(item.barcode, item.productName, products);
                  const isOut = item.remainingQuantity <= 0;
                  const isLow = item.remainingQuantity > 0 && item.remainingQuantity <= 5;
                  const imgFailed = failedImages[item.barcode];

                  return (
                    <div
                      key={item.id}
                      onClick={() => !isOut && handleAddToVanCart(item)}
                      className={`group rounded-xl border bg-white p-1.5 flex flex-col justify-between transition-all ${
                        isOut
                          ? 'opacity-60 border-[#E5E7EB] cursor-not-allowed'
                          : inCartQty > 0
                          ? 'border-[#0B5D32] ring-1 ring-[#0B5D32]/25 shadow-2xs cursor-pointer'
                          : 'border-[#DCE5DC] hover:border-[#0B5D32]/60 cursor-pointer'
                      }`}
                    >
                      <div className="relative h-16 sm:h-20 w-full rounded-lg bg-white p-1 mb-1.5 flex items-center justify-center overflow-hidden border border-[#F1F5F2]">
                        {!imgFailed ? (
                          <img
                            src={imgSrc}
                            alt={getLocalizedText(item.productName, language)}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setFailedImages((prev) => ({ ...prev, [item.barcode]: true }))
                            }
                            className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-[#9CA3AF]" />
                        )}

                        {inCartQty > 0 && (
                          <span className="absolute top-1 end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0B5D32] text-white text-[10px] font-black font-mono tabular-nums flex items-center justify-center shadow-xs">
                            {inCartQty}
                          </span>
                        )}

                        <span
                          className={`absolute bottom-0.5 start-0.5 px-1 py-0.2 rounded text-[9px] font-black font-mono tabular-nums ${
                            isOut
                              ? 'bg-red-100 text-red-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-[#ECFDF5] text-[#0B5D32]'
                          }`}
                        >
                          {item.remainingQuantity}
                        </span>
                      </div>

                      <div className="space-y-1 flex-1 flex flex-col justify-between">
                        <h4
                          className="text-[10.5px] sm:text-[11px] font-black text-[#142018] line-clamp-2 leading-tight min-h-[26px]"
                          title={getLocalizedText(item.productName, language)}
                        >
                          {getLocalizedText(item.productName, language)}
                        </h4>

                        <div className="pt-1 border-t border-[#F0F3EE] flex items-center justify-between gap-1">
                          <span className="text-[10px] sm:text-[11px] font-black font-mono tabular-nums text-[#0B5D32] truncate">
                            {formatCurrency(item.unitPriceIQD, currency, language)}
                          </span>

                          {inCartQty === 0 ? (
                            <button
                              type="button"
                              disabled={isOut}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToVanCart(item);
                              }}
                              className="w-6 h-6 rounded-md bg-[#0B5D32] hover:bg-[#084725] disabled:bg-gray-300 text-white flex items-center justify-center transition cursor-pointer shrink-0"
                              aria-label={isAr ? 'إضافة للفاتورة' : 'Add'}
                            >
                              <Plus className="w-3 h-3 stroke-[2.5]" />
                            </button>
                          ) : (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="h-6 flex items-center bg-[#0B5D32] text-white rounded-md overflow-hidden shrink-0"
                            >
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(item.barcode, -1)}
                                className="px-1 h-full hover:bg-black/15 cursor-pointer flex items-center justify-center"
                              >
                                <Minus className="w-2.5 h-2.5 stroke-[3]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(item.barcode, 1)}
                                className="px-1 h-full hover:bg-black/15 cursor-pointer flex items-center justify-center"
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
            ) : catalogView === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {filteredVanStock.map((item) => {
                  const inCartQty = getCartQty(item.barcode);
                  const imgSrc = resolveVanProductImage(item.barcode, item.productName, products);
                  const isOut = item.remainingQuantity <= 0;
                  const isLow = item.remainingQuantity > 0 && item.remainingQuantity <= 5;
                  const imgFailed = failedImages[item.barcode];

                  return (
                    <div
                      key={item.id}
                      onClick={() => !isOut && handleAddToVanCart(item)}
                      className={`group rounded-2xl border bg-white p-2.5 flex flex-col justify-between transition-all ${
                        isOut
                          ? 'opacity-60 border-[#E5E7EB] cursor-not-allowed'
                          : inCartQty > 0
                          ? 'border-[#0B5D32] ring-1 ring-[#0B5D32]/25 shadow-xs cursor-pointer'
                          : 'border-[#DCE5DC] hover:border-[#0B5D32]/60 hover:shadow-sm cursor-pointer'
                      }`}
                    >
                      {/* Thumbnail Stage */}
                      <div className="relative h-24 sm:h-28 w-full rounded-xl bg-white p-1.5 mb-2 flex items-center justify-center overflow-hidden border border-[#F1F5F2]">
                        {!imgFailed ? (
                          <img
                            src={imgSrc}
                            alt={getLocalizedText(item.productName, language)}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setFailedImages((prev) => ({ ...prev, [item.barcode]: true }))
                            }
                            className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-[#9CA3AF]" />
                        )}

                        {inCartQty > 0 && (
                          <span className="absolute top-1.5 end-1.5 min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#0B5D32] text-white text-[11px] font-black font-mono tabular-nums flex items-center justify-center shadow-xs">
                            {inCartQty}
                          </span>
                        )}

                        <span
                          className={`absolute bottom-1 start-1 px-1.5 py-0.5 rounded-md text-[10px] font-black font-mono tabular-nums ${
                            isOut
                              ? 'bg-red-100 text-red-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-[#ECFDF5] text-[#0B5D32]'
                          }`}
                        >
                          {isAr ? `متبقي ${item.remainingQuantity}` : `${item.remainingQuantity} left`}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="space-y-1 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-black text-[#142018] line-clamp-2 leading-snug min-h-[32px]">
                            {getLocalizedText(item.productName, language)}
                          </h4>
                          <div className="text-[10.5px] text-[#5F7164] truncate mt-0.5">
                            {getLocalizedText(item.unit, language)}
                          </div>
                          <div className="text-[10px] text-[#6B7280] tabular-nums mt-0.5">
                            {isAr
                              ? `محمّل ${item.loadedQuantity} · مباع ${item.soldQuantity}`
                              : `Loaded ${item.loadedQuantity} · Sold ${item.soldQuantity}`}
                          </div>
                        </div>

                        {/* Price & Quick Add */}
                        <div className="pt-2 mt-1.5 border-t border-[#F0F3EE] flex items-center justify-between gap-1.5">
                          <span className="text-xs sm:text-[13px] font-black font-mono tabular-nums text-[#0B5D32] whitespace-nowrap">
                            {formatCurrency(item.unitPriceIQD, currency, language)}
                          </span>

                          {inCartQty === 0 ? (
                            <button
                              type="button"
                              disabled={isOut}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToVanCart(item);
                              }}
                              className="h-7 px-2.5 rounded-lg bg-[#0B5D32] hover:bg-[#084725] disabled:bg-gray-300 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
                            >
                              <Plus className="w-3 h-3 stroke-[2.5]" />
                              <span>{isAr ? 'أضف' : 'Add'}</span>
                            </button>
                          ) : (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="h-7 flex items-center bg-[#0B5D32] text-white rounded-lg overflow-hidden shrink-0"
                            >
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(item.barcode, -1)}
                                className="px-1.5 h-full hover:bg-black/15 cursor-pointer flex items-center justify-center"
                              >
                                <Minus className="w-3 h-3 stroke-[3]" />
                              </button>
                              <span className="px-1.5 text-[11px] font-mono font-black tabular-nums">
                                {inCartQty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(item.barcode, 1)}
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
              /* Compact List View with Thumbnails */
              <div className="bg-white rounded-2xl border border-[#DCE5DC] divide-y divide-[#EAEFEA]">
                {filteredVanStock.map((item) => {
                  const inCartQty = getCartQty(item.barcode);
                  const imgSrc = resolveVanProductImage(item.barcode, item.productName, products);
                  const isOut = item.remainingQuantity <= 0;

                  return (
                    <div
                      key={item.id}
                      onClick={() => !isOut && handleAddToVanCart(item)}
                      className={`p-2.5 flex items-center justify-between gap-3 transition ${
                        isOut ? 'opacity-60' : 'hover:bg-[#F8FAF7] cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-white border border-[#EAEFEA] p-1 flex items-center justify-center shrink-0">
                          <img
                            src={imgSrc}
                            alt={getLocalizedText(item.productName, language)}
                            referrerPolicy="no-referrer"
                            className="max-h-full max-w-full object-contain mix-blend-multiply"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-[#142018] truncate">
                            {getLocalizedText(item.productName, language)}
                          </h4>
                          <div className="text-[10.5px] text-[#5F7164] tabular-nums flex items-center gap-1.5 flex-wrap">
                            <span>{getLocalizedText(item.unit, language)}</span>
                            <span>·</span>
                            <span className="font-bold text-[#0B5D32]">
                              {isAr ? `متبقي ${item.remainingQuantity}` : `${item.remainingQuantity} left`}
                            </span>
                            <span>·</span>
                            <span className="font-mono text-[10px]">{item.barcode}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-xs font-black font-mono tabular-nums text-[#0B5D32] whitespace-nowrap">
                          {formatCurrency(item.unitPriceIQD, currency, language)}
                        </span>

                        {inCartQty === 0 ? (
                          <button
                            type="button"
                            disabled={isOut}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToVanCart(item);
                            }}
                            className="h-8 px-3 rounded-xl bg-[#0B5D32] hover:bg-[#084725] disabled:bg-gray-300 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{isAr ? 'أضف' : 'Add'}</span>
                          </button>
                        ) : (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 flex items-center bg-[#0B5D32] text-white rounded-xl overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() => handleUpdateCartQty(item.barcode, -1)}
                              className="px-2 h-full hover:bg-black/15 cursor-pointer"
                            >
                              <Minus className="w-3 h-3 stroke-[3]" />
                            </button>
                            <span className="px-2 text-xs font-mono font-black tabular-nums">
                              {inCartQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateCartQty(item.barcode, 1)}
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
          </div>

          {/* RIGHT: Live Van POS Sale Receipt Panel */}
          <aside
            id="van-pos-receipt-panel"
            className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-[#DCE5DC] p-3.5 sm:p-4 space-y-3.5 lg:sticky lg:top-4 shadow-xs"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-[#EAEFEA]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] text-[#0B5D32] flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#142018]">
                    {isAr ? 'فاتورة البيع الفوري' : 'Van Instant Receipt'}
                  </h3>
                  <p className="text-[10.5px] text-[#5F7164]">
                    {isAr ? 'اضغط على أي صنف لإضافته للفاتورة' : 'Tap any product to add to receipt'}
                  </p>
                </div>
              </div>

              {vanCart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setVanCart([])}
                  className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تفريغ' : 'Clear'}</span>
                </button>
              )}
            </div>

            {/* Target Store Selector */}
            <div>
              <label className="text-[11px] font-bold text-[#4B6352] mb-1 flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-[#0B5D32]" />
                <span>{t.purchasingStore}</span>
              </label>
              <select
                value={targetStoreId}
                onChange={(e) => setTargetStoreId(e.target.value)}
                className="w-full bg-[#F8FAF7] border border-[#DCE5DC] focus:border-[#0B5D32] rounded-xl px-3 py-2 text-xs font-bold text-[#142018] focus:bg-white focus:outline-hidden"
              >
                <option value="store_almansoor">
                  {getLocalizedText('سوبرماركت المنصور المركزي', language)}
                </option>
                <option value="store_karrada">
                  {getLocalizedText('أسواق دجلة الخير - الكرادة', language)}
                </option>
              </select>
            </div>

            {/* Payment Method Toggle */}
            <div className="grid grid-cols-2 gap-1.5 bg-[#F4F4EA] p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setSalePaymentType('cash')}
                className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  salePaymentType === 'cash'
                    ? 'bg-[#0B5D32] text-white shadow-2xs'
                    : 'text-[#4B6352] hover:text-[#142018]'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>{isAr ? 'نقدي (كاش)' : 'Cash'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSalePaymentType('credit')}
                className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  salePaymentType === 'credit'
                    ? 'bg-[#0B5D32] text-white shadow-2xs'
                    : 'text-[#4B6352] hover:text-[#142018]'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{isAr ? 'آجل (حساب المحل)' : 'Store Credit'}</span>
              </button>
            </div>

            {/* Cart Items List */}
            {vanCart.length === 0 ? (
              <div className="py-8 px-4 text-center rounded-2xl bg-[#F8FAF7] border border-dashed border-[#DCE5DC] space-y-1.5">
                <Receipt className="w-8 h-8 text-[#9CA3AF] mx-auto" />
                <div className="text-xs font-bold text-[#4B6352]">
                  {isAr ? 'سلة الفاتورة فارغة' : 'Receipt is empty'}
                </div>
                <p className="text-[11px] text-[#6B7280]">
                  {isAr
                    ? 'اختر الأصناف من حمولة الفان لإصدار فاتورة فورية'
                    : 'Select items from the van load to issue an instant invoice'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#EAEFEA] max-h-64 overflow-y-auto pe-1">
                {vanCart.map((line) => (
                  <div key={line.barcode} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-white border border-[#EAEFEA] p-1 flex items-center justify-center shrink-0">
                        <img
                          src={line.imageUrl}
                          alt={line.productName}
                          referrerPolicy="no-referrer"
                          className="max-h-full max-w-full object-contain mix-blend-multiply"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#142018] truncate">
                          {getLocalizedText(line.productName, language)}
                        </div>
                        <div className="text-[10.5px] font-mono text-[#0B5D32] font-bold tabular-nums">
                          {formatCurrency(line.unitPriceIQD * line.qty, currency, language)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-[#F4F4EA] rounded-lg p-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateCartQty(line.barcode, -1)}
                        className="w-6 h-6 rounded-md bg-white hover:bg-gray-100 flex items-center justify-center text-[#142018] cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-mono font-black tabular-nums">
                        {line.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateCartQty(line.barcode, 1)}
                        className="w-6 h-6 rounded-md bg-[#0B5D32] text-white hover:bg-[#084725] flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totals & Checkout CTA */}
            <div className="pt-3 border-t border-[#EAEFEA] space-y-2.5">
              <div className="flex items-center justify-between text-xs text-[#5F7164]">
                <span>{isAr ? 'عدد الوحدات:' : 'Total Units:'}</span>
                <span className="font-mono font-bold text-[#142018] tabular-nums">
                  {cartUnitsCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#142018]">
                  {isAr ? 'إجمالي الفاتورة:' : 'Invoice Total:'}
                </span>
                <span className="text-lg font-black font-mono tabular-nums text-[#0B5D32]">
                  {formatCurrency(cartTotalIQD, currency, language)}
                </span>
              </div>

              <button
                type="button"
                disabled={vanCart.length === 0 || isProcessingSale}
                onClick={handleCompleteVanSale}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-[#0B5D32] hover:bg-[#084725] disabled:bg-gray-300 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isProcessingSale
                    ? isAr
                      ? 'جاري إصدار الفاتورة...'
                      : 'Processing...'
                    : isAr
                    ? 'إصدار فاتورة وخصم من الفان'
                    : 'Complete Van Sale'}
                </span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB: VAN RESTOCK FROM SUPPLIER STORE (تجهيز فان من متجر المورد)       */}
      {/* ===================================================================== */}
      {driverTab === 'restock' && (() => {
        const filteredCatalog = supplierCatalog.filter((item) => {
          if (!matchesSupplierCategoryAndBranch(item, restockCategory, restockBranchId)) {
            return false;
          }
          const q = restockSearch.trim().toLowerCase();
          if (!q) return true;
          return (
            item.nameAr.toLowerCase().includes(q) ||
            item.barcode.toLowerCase().includes(q) ||
            (item.brand || '').toLowerCase().includes(q)
          );
        });
        const restockEntries = Object.entries(restockCart)
          .filter(([, qty]) => qty > 0)
          .map(([barcode, qty]) => {
            const prod = supplierCatalog.find((p) => p.barcode === barcode);
            return prod ? { ...prod, qty } : null;
          })
          .filter(Boolean) as any[];
        const restockTotalUnits = restockEntries.reduce((s, r) => s + r.qty, 0);
        const restockTotalIQD = restockEntries.reduce((s, r) => s + r.qty * r.priceIQD, 0);

        return (
          <div className="space-y-4">
            {/* Supplier Store Header + Smart Restock Button */}
            <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold text-[#0B5D32] flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" />
                  <span>{driverInfo?.supplierName || (isAr ? 'شركة الرافدين للتجارة العامة والأغذية' : 'Al-Rafidain Wholesale')}</span>
                </div>
                <h3 className="font-black text-sm sm:text-base text-[#142018] mt-0.5">
                  {isAr ? 'تجهيز الفان من متجر المورد' : 'Van Restock from Supplier Store'}
                </h3>
                <p className="text-[11px] text-[#5F7164] mt-0.5">
                  {isAr
                    ? 'اختر البضاعة المطلوبة وأرسل طلب التجهيز — فور موافقة المورد أو المحاسب تُضاف تلقائياً إلى كاشير الفان.'
                    : 'Pick products and submit a load request — once approved by the supplier/accountant, stock syncs directly to your Van POS.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSmartRestockFill}
                className="px-3.5 py-2.5 rounded-xl bg-[#FFE600] hover:bg-yellow-400 text-[#142018] font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-2xs transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAr ? 'تجهيز ذكي (تعويض المباع)' : 'Smart Auto-Fill'}</span>
              </button>
            </div>

            {/* Supplier-Scoped Main & Subcategory Slider for Restock Store */}
            <SupplierCategorySlider
              items={supplierCatalog}
              selectedCategory={restockCategory}
              selectedBranchId={restockBranchId}
              onSelectCategory={setRestockCategory}
              onSelectBranch={setRestockBranchId}
              language={language}
              supplierLabel={driverInfo?.supplierName || (isAr ? 'شركة الرافدين للتجارة العامة والأغذية' : 'Al-Rafidain Wholesale')}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Left 7 Cols: Supplier Catalog Products */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-[#DCE5DC] p-3.5 space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#5F7164] absolute top-1/2 -translate-y-1/2 start-3" />
                  <input
                    type="text"
                    value={restockSearch}
                    onChange={(e) => setRestockSearch(e.target.value)}
                    placeholder={isAr ? 'ابحث في منتجات المورد بالاسم أو الباركود...' : 'Search supplier products...'}
                    className="w-full h-10 bg-[#F8FAF7] border border-[#DCE5DC] focus:border-[#0B5D32] focus:bg-white rounded-xl ps-9 pe-3 text-xs font-bold focus:outline-hidden"
                  />
                </div>

                {filteredCatalog.length === 0 ? (
                  <div className="py-10 text-center text-xs font-bold text-[#5F7164]">
                    {isAr ? 'لا توجد منتجات مطابقة في هذا القسم.' : 'No matching supplier products in this category.'}
                  </div>
                ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[520px] overflow-y-auto">
                  {filteredCatalog.map((prod) => {
                    const qtyInReq = restockCart[prod.barcode] || 0;
                    const currentVanItem = vanStock.find((v) => v.barcode === prod.barcode);
                    const imgSrc = prod.imageUrl || resolveVanProductImage(prod.barcode, prod.nameAr, products);

                    return (
                      <div
                        key={prod.barcode}
                        className={`rounded-xl border p-2.5 flex flex-col justify-between gap-2 transition ${
                          qtyInReq > 0
                            ? 'border-[#0B5D32] bg-[#ECFDF5]/40 ring-1 ring-[#0B5D32]/20'
                            : 'border-[#EAEFEA] bg-white'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="aspect-square bg-white rounded-lg border border-[#F0F2ED] p-1.5 flex items-center justify-center relative">
                            <img
                              src={imgSrc}
                              alt={prod.nameAr}
                              referrerPolicy="no-referrer"
                              className="max-h-full max-w-full object-contain mix-blend-multiply"
                            />
                            {currentVanItem && (
                              <span className="absolute bottom-1 start-1 text-[9.5px] font-bold bg-[#F4F4EA] text-[#4B6352] px-1.5 py-0.5 rounded-md tabular-nums">
                                {isAr ? `بالفان ${currentVanItem.remainingQuantity}` : `Van ${currentVanItem.remainingQuantity}`}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-bold text-[#142018] line-clamp-2 leading-tight">
                            {prod.nameAr}
                          </div>
                          <div className="text-[10px] text-[#5F7164] truncate">{prod.unit}</div>
                          <div className="text-xs font-black font-mono text-[#0B5D32] tabular-nums">
                            {formatCurrency(prod.priceIQD, currency, language)}
                          </div>
                        </div>

                        {qtyInReq === 0 ? (
                          <button
                            type="button"
                            onClick={() => handleAdjustRestockQty(prod.barcode, 5)}
                            className="w-full py-1.5 rounded-lg bg-[#0B5D32] hover:bg-[#084725] text-white font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{isAr ? 'إضافة (+5)' : 'Add (+5)'}</span>
                          </button>
                        ) : (
                          <div className="flex items-center justify-between bg-white border border-[#0B5D32] rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => handleAdjustRestockQty(prod.barcode, -1)}
                              className="w-6 h-6 rounded-md bg-[#F4F4EA] hover:bg-gray-200 flex items-center justify-center cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-mono font-black text-xs text-[#0B5D32] tabular-nums">
                              {qtyInReq}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustRestockQty(prod.barcode, 5)}
                              className="w-6 h-6 rounded-md bg-[#0B5D32] text-white flex items-center justify-center cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                )}
              </div>

              {/* Right 5 Cols: Restock Request Summary + Approval Tracker */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm text-[#142018] flex items-center gap-1.5">
                      <PackagePlus className="w-4 h-4 text-[#0B5D32]" />
                      <span>{isAr ? 'سلة طلب التجهيز' : 'Load Request Cart'}</span>
                    </h4>
                    <span className="text-xs font-mono font-bold text-[#0B5D32] tabular-nums">
                      {restockTotalUnits} {isAr ? 'وحدة' : 'units'}
                    </span>
                  </div>

                  {restockEntries.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#5F7164] bg-[#F8FAF7] rounded-xl border border-dashed border-[#DCE5DC]">
                      {isAr
                        ? 'اختر الأصناف من متجر المورد أو اضغط «تجهيز ذكي» لتعبئة النواقص تلقائياً.'
                        : 'Select products or click Smart Auto-Fill to build your load request.'}
                    </div>
                  ) : (
                    <>
                      <div className="divide-y divide-[#EAEFEA] max-h-48 overflow-y-auto text-xs">
                        {restockEntries.map((item) => (
                          <div key={item.barcode} className="py-2 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-bold text-[#142018] truncate">{item.nameAr}</div>
                              <div className="text-[10.5px] text-[#5F7164] font-mono tabular-nums">
                                {item.qty} × {formatCurrency(item.priceIQD, currency, language)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAdjustRestockQty(item.barcode, -item.qty)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <input
                        type="text"
                        value={restockNotes}
                        onChange={(e) => setRestockNotes(e.target.value)}
                        placeholder={isAr ? 'ملاحظة للمحاسب / أمين المخزن (اختياري)...' : 'Note for supplier/accountant...'}
                        className="w-full bg-[#F8FAF7] border border-[#DCE5DC] rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#0B5D32]"
                      />

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="font-bold text-[#5F7164]">{isAr ? 'القيمة التقديرية للعهدة:' : 'Estimated Load Value:'}</span>
                        <span className="font-mono font-black text-sm text-[#0B5D32] tabular-nums">
                          {formatCurrency(restockTotalIQD, currency, language)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleSubmitLoadRequest}
                        disabled={isSubmittingRestock}
                        className="w-full py-3 rounded-xl bg-[#0B5D32] hover:bg-[#084725] disabled:bg-gray-300 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-2xs"
                      >
                        <Send className="w-4 h-4" />
                        <span>
                          {isSubmittingRestock
                            ? isAr ? 'جاري إرسال الطلب...' : 'Sending request...'
                            : isAr ? 'إرسال طلب تجهيز للمورد / المحاسب' : 'Send Load Request for Approval'}
                        </span>
                      </button>
                    </>
                  )}
                </div>

                {/* Previous Load Requests & Approval Status */}
                <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-2.5">
                  <h4 className="font-black text-xs text-[#142018]">
                    {isAr ? 'حالة طلبات تجهيز الفان' : 'Load Request Status'}
                  </h4>
                  {loadRequests.length === 0 ? (
                    <div className="text-xs text-[#5F7164] py-4 text-center">
                      {isAr ? 'لا توجد طلبات تجهيز مرسلة اليوم' : 'No load requests sent today'}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
                      {loadRequests.map((req) => (
                        <div key={req.id} className="p-3 rounded-xl border border-[#EAEFEA] bg-[#F8FAF7] space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-black text-[#0B5D32]">{req.requestNumber}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                req.status === 'approved'
                                  ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                                  : req.status === 'rejected'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {req.status === 'approved'
                                ? isAr ? 'تم الاعتماد وأُضيف للكاشير' : 'Approved & Synced to POS'
                                : req.status === 'rejected'
                                ? isAr ? 'مرفوض' : 'Rejected'
                                : isAr ? 'بانتظار موافقة المورد' : 'Pending Approval'}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#4B6352]">
                            {req.items.map((it: any) => `${it.productName} (${it.approvedQuantity})`).join(' · ')}
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
      })()}

      {/* ===================================================================== */}
      {/* TAB: SMART NAVIGATION (الملاحة الذكية عبر خرائط جوجل وتجنب الزحام)    */}
      {/* ===================================================================== */}
      {driverTab === 'navigation' && (
        <VanSmartNavigation
          routeStops={routeStops}
          assignedOrders={assignedOrders}
          language={language}
          onStartSaleForStore={(storeId) => {
            setTargetStoreId(storeId);
            setDriverTab('pos');
            setPosSubTab('sell');
          }}
          onMarkStopVisited={(stopId) => handleUpdateRouteStop(stopId, 'visited')}
        />
      )}

      {/* ===================================================================== */}
      {/* TAB: VAN MANAGEMENT (إدارة الفان: التوفر + المسار + التوصيلات المجدولة) */}
      {/* ===================================================================== */}
      {driverTab === 'manage' && (
        <VanManagementPanel
          driverId={driverId}
          driverInfo={driverInfo}
          routeStops={routeStops}
          stores={vanStores}
          assignedOrders={assignedOrders}
          currency={currency}
          language={language}
          onRefreshVanData={loadVanData}
          onUpdateRouteStop={handleUpdateRouteStop}
          onStartSaleForStore={(storeId) => {
            setTargetStoreId(storeId);
            setDriverTab('pos');
            setPosSubTab('sell');
          }}
          onStartCollectionForStore={(storeId) => {
            setCollectStoreId(storeId);
            setDriverTab('pos');
            setPosSubTab('collections');
          }}
          onOpenNavigation={() => setDriverTab('navigation')}
          onOpenDeliveries={() => setDriverTab('deliveries')}
          onFeedback={setFeedback}
        />
      )}

      {/* Hidden legacy route block guard */}
      {false && (
        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-black text-sm text-[#142018] flex items-center gap-2">
                <Navigation className="w-4 h-4 text-[#0B5D32]" />
                <span>{isAr ? 'خط السير اليومي للزيارات الميدانية' : 'Daily Field Route Stops'}</span>
              </h3>
              <p className="text-[11px] text-[#5F7164] mt-0.5">
                {isAr
                  ? 'المحلات المجدولة حسب القاطع — ابدأ البيع أو تحصيل الذمم بضغطة واحدة.'
                  : 'Scheduled supermarket stops — jump directly to POS sale or debt collection.'}
              </p>
            </div>
            <div className="text-xs font-mono font-bold text-[#0B5D32] tabular-nums">
              {routeStops.filter((s) => s.status === 'sold' || s.status === 'visited').length} / {routeStops.length}{' '}
              {isAr ? 'زيارة مكتملة' : 'completed'}
            </div>
          </div>

          {routeStops.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#5F7164]">
              {isAr ? 'لا توجد محلات مجدولة في خط السير اليوم' : 'No route stops scheduled today'}
            </div>
          ) : (
            <div className="space-y-2.5">
              {routeStops.map((stop) => {
                const storeCredit = creditAccounts.find((c) => c.storeId === stop.storeId);
                return (
                  <div
                    key={stop.id}
                    className={`rounded-2xl border p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 transition ${
                      stop.status === 'sold'
                        ? 'border-[#A7F3D0] bg-[#ECFDF5]/40'
                        : stop.status === 'visited'
                        ? 'border-[#DCE5DC] bg-[#F8FAF7]'
                        : 'border-[#DCE5DC] bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl font-mono font-black text-xs flex items-center justify-center shrink-0 ${
                          stop.status === 'sold'
                            ? 'bg-[#0B5D32] text-white'
                            : stop.status === 'visited'
                            ? 'bg-[#4B6352] text-white'
                            : 'bg-[#F4F4EA] text-[#142018] border border-[#DCE5DC]'
                        }`}
                      >
                        {stop.sequence}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-sm text-[#142018]">
                            {getLocalizedText(stop.storeName, language)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              stop.status === 'sold'
                                ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                                : stop.status === 'visited'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {stop.status === 'sold'
                              ? isAr
                                ? 'تم البيع'
                                : 'Sold'
                              : stop.status === 'visited'
                              ? isAr
                                ? 'تمت الزيارة'
                                : 'Visited'
                              : isAr
                              ? 'بانتظار الزيارة'
                              : 'Pending'}
                          </span>
                        </div>

                        <div className="text-[11px] text-[#5F7164] flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#0B5D32]" />
                            {stop.district} — {stop.address}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 font-mono" dir="ltr">
                            <Phone className="w-3 h-3 text-[#4B6352]" />
                            {stop.phone}
                          </span>
                        </div>

                        {stop.notes && (
                          <div className="text-[11px] text-[#4B6352] font-semibold">
                            {stop.notes}
                          </div>
                        )}

                        <div className="flex items-center gap-3 flex-wrap text-[11px] pt-0.5">
                          {storeCredit && storeCredit.currentUsedCreditIQD > 0 && (
                            <span className="font-mono font-bold text-amber-800 tabular-nums">
                              {isAr ? 'ذمة آجلة: ' : 'Credit Due: '}
                              {formatCurrency(storeCredit.currentUsedCreditIQD, currency, language)}
                            </span>
                          )}
                          {stop.lastSaleAmountIQD > 0 && (
                            <span className="font-mono font-bold text-[#0B5D32] tabular-nums">
                              {isAr ? 'مبيعات اليوم: ' : "Today's Sale: "}
                              {formatCurrency(stop.lastSaleAmountIQD, currency, language)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setTargetStoreId(stop.storeId);
                          setDriverTab('pos');
                          setPosSubTab('sell');
                        }}
                        className="px-3 py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084725] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{isAr ? 'بدء بيع' : 'Start Sale'}</span>
                      </button>

                      {storeCredit && storeCredit.currentUsedCreditIQD > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setCollectStoreId(stop.storeId);
                            setDriverTab('pos');
                            setPosSubTab('collections');
                          }}
                          className="px-3 py-2 rounded-xl bg-[#FFE600] hover:bg-yellow-400 text-[#142018] font-black text-xs flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>{isAr ? 'تحصيل آجل' : 'Collect'}</span>
                        </button>
                      )}

                      {stop.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateRouteStop(stop.id, 'visited')}
                          className="px-3 py-2 rounded-xl bg-[#F4F4EA] hover:bg-[#EAEFEA] text-[#4B6352] font-bold text-xs cursor-pointer transition"
                        >
                          {isAr ? 'تحديد كمزار' : 'Mark Visited'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB: CREDIT DEBT COLLECTIONS & TODAY'S LOG (تحصيل الآجل والعمليات)     */}
      {/* ===================================================================== */}
      {driverTab === 'pos' && posSubTab === 'collections' && (() => {
        const selectedCreditAcc = creditAccounts.find((c) => c.storeId === collectStoreId);
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left: Debt Collection Form */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#0B5D32]" />
                <h3 className="font-black text-sm text-[#142018]">
                  {isAr ? 'تحصيل دفعة نقدية من حساب الآجل' : 'Collect Cash Against Credit Ledger'}
                </h3>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#4B6352] block">
                  {isAr ? 'اختر المتجر المراد التحصيل منه:' : 'Select Store:'}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {creditAccounts.map((acc) => {
                    const isSelected = acc.storeId === collectStoreId;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setCollectStoreId(acc.storeId)}
                        className={`p-3 rounded-xl border text-start flex items-center justify-between gap-2 transition cursor-pointer ${
                          isSelected
                            ? 'border-[#0B5D32] bg-[#ECFDF5]/60 ring-1 ring-[#0B5D32]/25'
                            : 'border-[#DCE5DC] bg-[#F8FAF7] hover:bg-white'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-black text-xs text-[#142018] truncate">
                            {acc.storeName}
                          </div>
                          <div className="text-[10.5px] text-[#5F7164] mt-0.5">
                            {acc.isBlocked
                              ? isAr
                                ? 'الحساب موقوف (تجاوز أو تأخير)'
                                : 'Account blocked'
                              : isAr
                              ? `سقف الائتمان: ${formatCurrency(acc.creditLimitIQD, currency, language)}`
                              : `Limit: ${formatCurrency(acc.creditLimitIQD, currency, language)}`}
                          </div>
                        </div>
                        <div className="text-end shrink-0">
                          <div className="text-[10px] font-bold text-[#5F7164]">
                            {isAr ? 'الدين المستحق' : 'Balance Due'}
                          </div>
                          <div className="text-sm font-black font-mono tabular-nums text-amber-800">
                            {formatCurrency(acc.currentUsedCreditIQD, currency, language)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedCreditAcc && (
                <form onSubmit={handleCollectDebt} className="space-y-3 pt-2 border-t border-[#EAEFEA] text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-[#4B6352]">
                        {isAr ? 'المبلغ المستلم نقداً (د.ع):' : 'Cash Collected (IQD):'}
                      </label>
                      <div className="flex items-center gap-1">
                        {[0.25, 0.5, 1].map((ratio) => (
                          <button
                            key={ratio}
                            type="button"
                            onClick={() =>
                              setCollectAmountInput(
                                String(Math.round((selectedCreditAcc.currentUsedCreditIQD * ratio) / 1000) * 1000)
                              )
                            }
                            className="px-2 py-0.5 rounded-md bg-[#F4F4EA] hover:bg-[#0B5D32] hover:text-white text-[10px] font-bold text-[#4B6352] transition cursor-pointer"
                          >
                            {ratio === 1 ? (isAr ? 'كامل الدين' : 'Full') : `${ratio * 100}%`}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      required
                      min={1000}
                      max={selectedCreditAcc.currentUsedCreditIQD}
                      value={collectAmountInput}
                      onChange={(e) => setCollectAmountInput(e.target.value)}
                      placeholder={isAr ? 'مثال: 500000' : 'e.g. 500000'}
                      className="w-full bg-[#F8FAF7] border border-[#DCE5DC] focus:border-[#0B5D32] focus:bg-white rounded-xl p-2.5 font-mono font-black text-base text-[#0B5D32] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#4B6352] block mb-1">
                      {isAr ? 'ملاحظة الوصل (اختياري):' : 'Receipt Notes (optional):'}
                    </label>
                    <input
                      type="text"
                      value={collectNotes}
                      onChange={(e) => setCollectNotes(e.target.value)}
                      placeholder={isAr ? 'مثال: دفعة نقدية من حساب الأسبوع الماضي' : 'e.g. Partial cash settlement'}
                      className="w-full bg-[#F8FAF7] border border-[#DCE5DC] focus:border-[#0B5D32] focus:bg-white rounded-xl p-2.5 text-xs focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isCollectingDebt || selectedCreditAcc.currentUsedCreditIQD <= 0}
                    className="w-full py-3 rounded-xl bg-[#0B5D32] hover:bg-[#084725] disabled:bg-gray-300 text-white font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
                  >
                    <Banknote className="w-4 h-4" />
                    <span>
                      {isCollectingDebt
                        ? isAr
                          ? 'جاري ترحيل الوصل...'
                          : 'Posting receipt...'
                        : isAr
                        ? 'تأكيد التحصيل وإصدار وصل قبض'
                        : 'Confirm Collection & Issue Receipt'}
                    </span>
                  </button>
                </form>
              )}
            </div>

            {/* Right: Today's Van Transactions & Printable Receipts */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-[#142018] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#0B5D32]" />
                  <span>{isAr ? 'سجل فواتير ووصولات الفان اليوم' : "Today's Van Receipts"}</span>
                </h3>
                <span className="text-[11px] font-mono font-bold text-[#5F7164] tabular-nums">
                  {vanTransactions.length} {isAr ? 'عملية' : 'entries'}
                </span>
              </div>

              {vanTransactions.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#5F7164]">
                  {isAr ? 'لا توجد عمليات مسجلة اليوم' : 'No transactions logged today'}
                </div>
              ) : (
                <div className="divide-y divide-[#EAEFEA] max-h-[420px] overflow-y-auto">
                  {vanTransactions.map((tx) => (
                    <div key={tx.id} className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-xs text-[#0B5D32]">
                            {tx.receiptNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              tx.type === 'debt_collection'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                            }`}
                          >
                            {tx.type === 'debt_collection'
                              ? isAr
                                ? 'تحصيل آجل'
                                : 'Debt Collection'
                              : isAr
                              ? 'بيع فوري'
                              : 'Direct Sale'}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-[#142018] mt-0.5 truncate">
                          {tx.storeName}
                        </div>
                        <div className="text-[10.5px] text-[#5F7164] truncate">
                          {tx.paymentType === 'cash'
                            ? isAr
                              ? 'نقدي (كاش)'
                              : 'Cash'
                            : isAr
                            ? 'آجل'
                            : 'Credit'}{' '}
                          · {new Date(tx.createdAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-black text-xs text-[#142018] tabular-nums">
                          {formatCurrency(tx.totalAmountIQD, currency, language)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReceipt(tx);
                            setCopiedReceipt(false);
                          }}
                          className="p-2 rounded-xl bg-[#F4F4EA] hover:bg-[#0B5D32] hover:text-white text-[#4B6352] transition cursor-pointer"
                          title={isAr ? 'عرض وطباعة الوصل' : 'View & Print Receipt'}
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
        );
      })()}

      {/* ===================================================================== */}
      {/* TAB 2: ASSIGNED DELIVERY ORDERS (PIN VERIFICATION)                    */}
      {/* ===================================================================== */}
      {driverTab === 'deliveries' && (
        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-[#142018]">
              {isAr
                ? `طلبيات التوزيع المكلف بها (${assignedOrders.length})`
                : `Assigned Delivery Orders (${assignedOrders.length})`}
            </h3>
            <span className="text-[11px] font-bold text-[#5F7164] tabular-nums">
              {isAr ? `${pendingOrdersCount} قيد التسليم` : `${pendingOrdersCount} pending`}
            </span>
          </div>

          {assignedOrders.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#5F7164]">
              {isAr ? 'لا توجد طلبيات توزيع مجدولة حالياً' : 'No assigned delivery orders'}
            </div>
          ) : (
            <div className="divide-y divide-[#EAEFEA]">
              {assignedOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-xs text-[#0B5D32]">
                        {ord.id}
                      </span>
                      <span className="text-xs font-black text-[#142018]">
                        {getLocalizedText(ord.storeName, language)}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#5F7164] flex items-center gap-1.5 flex-wrap">
                      <MapPin className="w-3.5 h-3.5 text-[#0B5D32] shrink-0" />
                      <span>{getLocalizedText(ord.storeAddress, language)}</span>
                      <span aria-hidden="true">·</span>
                      <strong className="font-mono text-[#142018] tabular-nums">
                        {formatCurrency(ord.subtotalIQD, currency, language)}
                      </strong>
                    </div>
                  </div>

                  {ord.status === 'delivered' ? (
                    <span className="inline-flex items-center gap-1 text-[#065F46] font-bold text-xs bg-[#ECFDF5] border border-[#A7F3D0] px-3 py-1.5 rounded-xl shrink-0 self-start sm:self-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تم التسليم والمصادقة' : 'Delivered'}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveringOrder(ord);
                        setEnteredPin('');
                        setPinError(null);
                      }}
                      className="min-h-[40px] px-4 py-2 bg-[#FFE600] hover:bg-yellow-400 text-[#142018] font-black text-xs rounded-xl transition cursor-pointer shadow-2xs shrink-0 whitespace-nowrap self-start sm:self-center"
                    >
                      {isAr ? 'إدخال رمز PIN وتأكيد التسليم' : 'Enter PIN & Confirm'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: RETURNS & DAMAGED GOODS                                        */}
      {/* ===================================================================== */}
      {driverTab === 'pos' && posSubTab === 'returns' && (
        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-700" />
            <h3 className="font-black text-sm text-[#142018]">{t.returnDamageTitle}</h3>
          </div>

          {/* Visual Thumbnail Picker for Van Items */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {vanStock.map((item) => {
              const isSelected = returnBarcode === item.barcode;
              const imgSrc = resolveVanProductImage(item.barcode, item.productName, products);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setReturnBarcode(item.barcode)}
                  className={`p-2 rounded-xl border text-start flex items-center gap-2 transition cursor-pointer ${
                    isSelected
                      ? 'border-[#0B5D32] bg-[#ECFDF5]/60 ring-1 ring-[#0B5D32]/25'
                      : 'border-[#DCE5DC] bg-[#F8FAF7] hover:bg-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-white border border-[#EAEFEA] p-1 flex items-center justify-center shrink-0">
                    <img
                      src={imgSrc}
                      alt={item.productName}
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain mix-blend-multiply"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-[#142018] line-clamp-2 leading-tight">
                      {getLocalizedText(item.productName, language)}
                    </div>
                    <div className="text-[10px] text-[#5F7164] tabular-nums mt-0.5">
                      {isAr ? `بالفان: ${item.remainingQuantity}` : `In van: ${item.remainingQuantity}`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleLogReturn} className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
            <div className="sm:col-span-4">
              <label className="text-[#4B6352] font-bold block mb-1">
                {isAr ? 'نوع القيد:' : 'Record Type:'}
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-[#F4F4EA] p-1 rounded-xl font-bold">
                <button
                  type="button"
                  onClick={() => setReturnType('return')}
                  className={`py-2 rounded-lg transition cursor-pointer ${
                    returnType === 'return'
                      ? 'bg-[#0B5D32] text-white shadow-2xs'
                      : 'text-[#4B6352]'
                  }`}
                >
                  {isAr ? 'مرتجع سليم' : 'Return'}
                </button>
                <button
                  type="button"
                  onClick={() => setReturnType('damage')}
                  className={`py-2 rounded-lg transition cursor-pointer ${
                    returnType === 'damage'
                      ? 'bg-red-600 text-white shadow-2xs'
                      : 'text-[#4B6352]'
                  }`}
                >
                  {isAr ? 'تالف / منتهي' : 'Damaged'}
                </button>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="text-[#4B6352] font-bold block mb-1">{t.quantity}</label>
              <div className="flex items-center justify-between bg-[#F8FAF7] border border-[#DCE5DC] rounded-xl p-1 h-[38px]">
                <button
                  type="button"
                  onClick={() => setReturnQty((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded-lg bg-white hover:bg-gray-100 flex items-center justify-center cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono font-black text-sm tabular-nums">{returnQty}</span>
                <button
                  type="button"
                  onClick={() =>
                    setReturnQty((q) =>
                      Math.min(Math.max(1, selectedReturnItem?.remainingQuantity || 50), q + 1)
                    )
                  }
                  className="w-7 h-7 rounded-lg bg-[#0B5D32] text-white flex items-center justify-center cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="text-[#4B6352] font-bold block mb-1">
                {isAr ? 'ملاحظة / السبب:' : 'Reason:'}
              </label>
              <input
                type="text"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder={isAr ? 'مثال: كرتون ممزق' : 'e.g. Torn carton'}
                className="w-full h-[38px] bg-[#F8FAF7] border border-[#DCE5DC] focus:border-[#0B5D32] focus:bg-white rounded-xl px-3 text-xs focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col justify-end">
              <button
                type="submit"
                disabled={isLoggingReturn || !returnBarcode}
                className="w-full h-[38px] px-3 bg-[#142018] hover:bg-black disabled:bg-gray-300 text-white font-bold rounded-xl transition cursor-pointer whitespace-nowrap"
              >
                {t.recordReturnBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MOBILE FLOATING RECEIPT JUMP BAR ================= */}
      {driverTab === 'pos' && posSubTab === 'sell' && vanCart.length > 0 && (
        <div className="lg:hidden fixed bottom-20 inset-x-4 max-w-md mx-auto z-40 bg-[#142018] text-white rounded-2xl px-3.5 py-2.5 shadow-xl border border-white/10 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] text-emerald-300 font-bold tabular-nums">
              {isAr ? `${cartUnitsCount} وحدة في الفاتورة` : `${cartUnitsCount} units in receipt`}
            </div>
            <div className="text-sm font-black font-mono tabular-nums">
              {formatCurrency(cartTotalIQD, currency, language)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              document
                .getElementById('van-pos-receipt-panel')
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="px-4 py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084725] text-white font-black text-xs cursor-pointer whitespace-nowrap shrink-0"
          >
            {isAr ? 'مراجعة وإصدار الفاتورة' : 'Review & Checkout'}
          </button>
        </div>
      )}

      {/* ================= MODAL: Delivery Confirmation with PIN ================= */}
      {deliveringOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className={`bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#DCE5DC] ${isAr ? 'text-right' : 'text-left'}`}>
            <h3 className="font-black text-base text-[#142018]">{t.verifyPinBtn}</h3>
            <p className="text-xs text-[#5F7164] mt-1">
              {t.enterPinPrompt} ({getLocalizedText(deliveringOrder.storeName, language)}).
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-[#4B6352] block mb-1">
                  {isAr ? 'رمز التحقق (PIN):' : 'Verification PIN:'}
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  placeholder={t.pinPlaceholder}
                  className="w-full bg-[#F8FAF7] border border-[#DCE5DC] focus:border-[#0B5D32] rounded-xl p-3 font-mono font-black text-center text-xl tracking-widest text-[#0B5D32] focus:outline-hidden"
                />
              </div>

              {pinError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                  {pinError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeliveringOrder(null)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs cursor-pointer hover:bg-gray-200"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleVerifyDeliveryPin}
                  className="flex-1 py-2.5 rounded-xl bg-[#0B5D32] text-white font-bold text-xs hover:bg-[#084725] cursor-pointer"
                >
                  {t.confirmHandoverBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: Daily Shift Close ================= */}
      {showShiftCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className={`bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DCE5DC] ${isAr ? 'text-right' : 'text-left'}`}>
            <h3 className="font-black text-base text-[#142018]">{t.shiftCloseModalTitle}</h3>
            <p className="text-xs text-[#5F7164] mt-1">
              {isAr
                ? 'قارن الكاش الفعلي المعدود مع الكاش المتوقع في النظام لاحتساب أي فائض أو عجز.'
                : 'Compare physical counted cash against expected system sales.'}
            </p>

            {shiftCloseResult ? (
              <div className="mt-4 space-y-3 text-xs">
                <div className="p-3.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-[#065F46] space-y-1.5 tabular-nums">
                  <div className="font-black">{t.success}</div>
                  <div>
                    {t.expectedCashFromSales}{' '}
                    <strong className="font-mono">
                      {formatCurrency(shiftCloseResult.expectedCashIQD, currency, language)}
                    </strong>
                  </div>
                  <div>
                    {t.actualCountedCash}{' '}
                    <strong className="font-mono">
                      {formatCurrency(shiftCloseResult.actualCashIQD, currency, language)}
                    </strong>
                  </div>
                  <div
                    className={`font-black ${
                      shiftCloseResult.cashVarianceIQD >= 0 ? 'text-[#0B5D32]' : 'text-red-700'
                    }`}
                  >
                    {t.cashDifference}{' '}
                    <span className="font-mono">
                      {formatCurrency(shiftCloseResult.cashVarianceIQD, currency, language)}
                    </span>{' '}
                    {shiftCloseResult.cashVarianceIQD === 0
                      ? `(${t.matched})`
                      : shiftCloseResult.cashVarianceIQD > 0
                      ? `(${t.surplus})`
                      : `(${t.shortage})`}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowShiftCloseModal(false);
                    setShiftCloseResult(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#0B5D32] text-white font-bold cursor-pointer"
                >
                  {t.close}
                </button>
              </div>
            ) : (
              <form onSubmit={handleCloseShift} className="mt-4 space-y-3 text-xs">
                <div className="bg-[#F8FAF7] p-3 rounded-xl border border-[#DCE5DC] text-[#4B6352]">
                  <span>{t.expectedCashFromSales}</span>
                  <strong className="text-base font-mono text-[#0B5D32] block mt-1 tabular-nums">
                    {formatCurrency(driverInfo?.currentCashCollectedIQD || 0, currency, language)}
                  </strong>
                </div>

                <div>
                  <label className="text-[#4B6352] font-bold block mb-1">{t.actualCountedCash}</label>
                  <input
                    type="number"
                    required
                    value={actualCashInput}
                    onChange={(e) => setActualCashInput(e.target.value)}
                    placeholder={isAr ? 'أدخل المبلغ الفعلي بالدينار...' : 'Enter actual counted cash...'}
                    className="w-full bg-[#F8FAF7] border border-[#DCE5DC] focus:border-[#0B5D32] rounded-xl p-2.5 font-mono text-sm font-bold focus:outline-hidden"
                  />
                </div>

                {shiftCloseError && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                    {shiftCloseError}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowShiftCloseModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs cursor-pointer hover:bg-gray-200"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#0B5D32] text-white font-bold text-xs cursor-pointer hover:bg-[#084725]"
                  >
                    {t.confirmShiftCloseBtn}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: Printable / Shareable Van Receipt ================= */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className={`bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-[#DCE5DC] space-y-4 ${isAr ? 'text-right' : 'text-left'}`}>
            <div className="flex items-start justify-between gap-2 border-b border-[#EAEFEA] pb-3">
              <div>
                <div className="text-[11px] font-bold text-[#0B5D32]">
                  {activeReceipt.type === 'debt_collection'
                    ? isAr
                      ? 'سند قبض وتحصيل آجل ميداني'
                      : 'Field Debt Collection Receipt'
                    : isAr
                    ? 'فاتورة بيع فوري من سيارة التوزيع'
                    : 'Van Direct Sale Invoice'}
                </div>
                <h3 className="font-mono font-black text-base text-[#142018] mt-0.5">
                  {activeReceipt.receiptNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="w-8 h-8 rounded-full bg-[#F4F4EA] hover:bg-gray-200 flex items-center justify-center text-[#4B6352] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#F8FAF7] rounded-xl border border-[#DCE5DC] p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#5F7164]">{isAr ? 'المتجر المستلم:' : 'Store:'}</span>
                <strong className="text-[#142018]">{activeReceipt.storeName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5F7164]">{isAr ? 'مندوب الفان:' : 'Driver:'}</span>
                <strong className="text-[#142018]">{activeReceipt.driverName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5F7164]">{isAr ? 'طريقة الدفع:' : 'Payment:'}</span>
                <strong className="text-[#0B5D32]">
                  {activeReceipt.paymentType === 'cash'
                    ? isAr
                      ? 'نقدي (كاش)'
                      : 'Cash'
                    : isAr
                    ? 'آجل على الحساب'
                    : 'Credit Ledger'}
                </strong>
              </div>
            </div>

            {activeReceipt.items && activeReceipt.items.length > 0 && (
              <div className="border border-[#EAEFEA] rounded-xl overflow-hidden text-xs">
                <div className="bg-[#F4F4EA] px-3 py-2 font-bold text-[#4B6352] flex justify-between">
                  <span>{isAr ? 'الصنف والكمية' : 'Item & Qty'}</span>
                  <span>{isAr ? 'المبلغ' : 'Total'}</span>
                </div>
                <div className="divide-y divide-[#EAEFEA] max-h-44 overflow-y-auto">
                  {activeReceipt.items.map((it: any, idx: number) => (
                    <div key={idx} className="px-3 py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-[#142018] truncate">{it.productName}</div>
                        <div className="text-[10.5px] text-[#5F7164] font-mono tabular-nums">
                          {it.quantity} × {formatCurrency(it.unitPriceIQD, currency, language)}
                        </div>
                      </div>
                      <span className="font-mono font-black text-[#142018] tabular-nums shrink-0">
                        {formatCurrency(it.totalIQD, currency, language)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-[#4B6352]">
                {isAr ? 'الإجمالي النهائي:' : 'Grand Total:'}
              </span>
              <span className="text-lg font-black font-mono tabular-nums text-[#0B5D32]">
                {formatCurrency(activeReceipt.totalAmountIQD, currency, language)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-[11px] font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {activeReceipt.type === 'direct_sale'
                  ? isAr
                    ? 'تمت مزامنة البضاعة تلقائياً إلى مخزون كاشير المتجر.'
                    : 'Items automatically synced to the store POS inventory.'
                  : isAr
                  ? 'تم ترحيل الدفعة إلى دفتر الأستاذ للمورد وتحديث عهدة الفان.'
                  : 'Payment posted to supplier ledger & added to van custody.'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopyReceiptText(activeReceipt)}
                className="py-2.5 px-3 rounded-xl bg-[#F4F4EA] hover:bg-[#EAEFEA] text-[#142018] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                {copiedReceipt ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#0B5D32]" />
                    <span className="text-[#0B5D32]">{isAr ? 'تم النسخ للواتساب' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isAr ? 'نسخ نص واتساب' : 'Copy WhatsApp'}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-3 rounded-xl bg-[#0B5D32] hover:bg-[#084725] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isAr ? 'طباعة الوصل' : 'Print Receipt'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= STICKY DRIVER BOTTOM NAVIGATION BAR ================= */}
      <DriverBottomNav
        activeTab={driverTab}
        onSelectTab={(tab) => {
          setDriverTab(tab);
          if (tab === 'pos') setPosSubTab('sell');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        cartCount={cartUnitsCount}
        pendingOrdersCount={pendingOrdersCount}
        pendingRestockCount={pendingRestockCount}
        availabilityStatus={driverInfo?.availabilityStatus === 'busy' ? 'busy' : 'available'}
        language={language}
      />
    </div>
  );
};
