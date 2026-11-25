import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  Banknote,
  RotateCcw,
  CheckCircle2,
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
  Check,
  Phone,
  Clock,
  PackagePlus,
  Sparkles,
  Send,
  Users,
  PackageCheck,
  BarChart3,
  SlidersHorizontal,
  BadgeCheck
} from 'lucide-react';
import {
  VanStockItem,
  Currency,
  OrderItem,
  Language,
  ProductWithOffers,
  VanModuleSection,
  VanExpenseItem,
  VanReturnItem,
  VanShiftReportItem,
  VanKPIs
} from '../types/index.ts';
import { formatCurrency } from '../utils/format.ts';
import { translations, getLocalizedText } from '../utils/translations.ts';
import { DriverBottomNav, DriverBottomTab } from '../components/DriverBottomNav.tsx';
import { VanSmartNavigation } from '../components/VanSmartNavigation.tsx';
import { VanManagementPanel } from '../components/VanManagementPanel.tsx';
import { VanCustomersCreditPanel } from '../components/VanCustomersCreditPanel.tsx';
import { VanInventoryAuditPanel } from '../components/VanInventoryAuditPanel.tsx';
import { VanFinanceSettlementPanel } from '../components/VanFinanceSettlementPanel.tsx';
import { VanPerformancePanel } from '../components/VanPerformancePanel.tsx';
import { VanInvoiceModal, InvoiceSupplierIdentity } from '../components/VanInvoiceModal.tsx';
import { WHOLESALE_SUPPLIERS } from '../data/nearbySuppliers.ts';
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
  activeSection?: VanModuleSection;
  onChangeSection?: (section: VanModuleSection) => void;
  openShiftCloseSignal?: number;
  onSyncSummary?: (summary: {
    cashCustodyIQD: number;
    remainingUnits: number;
    pendingOrdersCount: number;
    pendingRestockCount: number;
    nearExpiryCount: number;
    creditClientsCount: number;
    vehiclePlate: string;
    vanWarehouseName: string;
  }) => void;
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
  language = 'ar',
  activeSection,
  onChangeSection,
  openShiftCloseSignal = 0,
  onSyncSummary
}) => {
  const isAr = language === 'ar';
  const t = translations[language];

  const driverId = 'drv_ahmed_baghdad';
  const [vanStock, setVanStock] = useState<VanStockItem[]>([]);
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Unified DSD Section state (synced with Top Menu Drawer & Bottom Bar)
  const [internalSection, setInternalSection] = useState<VanModuleSection>('pos_sell');
  const currentSection: VanModuleSection = activeSection ?? internalSection;
  const setSection = (section: VanModuleSection) => {
    setInternalSection(section);
    onChangeSection?.(section);
  };
  const driverTab: DriverBottomTab =
    currentSection === 'deliveries'
      ? 'deliveries'
      : currentSection === 'restock'
      ? 'restock'
      : currentSection === 'navigation'
      ? 'navigation'
      : currentSection === 'manage'
      ? 'manage'
      : 'pos';

  const [searchQuery, setSearchQuery] = useState('');
  const [catalogView, setCatalogView] = useState<'mini' | 'grid' | 'list'>('grid');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // DSD Fleet Data: Route Stops, Credit Accounts, Transactions, Commission, Supplier Store Catalog, Expenses, Returns, Z-Reports & KPIs
  const [routeStops, setRouteStops] = useState<any[]>([]);
  const [creditAccounts, setCreditAccounts] = useState<any[]>([]);
  const [vanTransactions, setVanTransactions] = useState<any[]>([]);
  const [commissionSummary, setCommissionSummary] = useState<any>(null);
  const [loadRequests, setLoadRequests] = useState<any[]>([]);
  const [supplierCatalog, setSupplierCatalog] = useState<any[]>([]);
  const [vanStores, setVanStores] = useState<any[]>([]);
  const [vanExpenses, setVanExpenses] = useState<VanExpenseItem[]>([]);
  const [vanReturns, setVanReturns] = useState<VanReturnItem[]>([]);
  const [shiftReports, setShiftReports] = useState<VanShiftReportItem[]>([]);
  const [vanUnloadRecords, setVanUnloadRecords] = useState<any[]>([]);
  const [vanKPIs, setVanKPIs] = useState<VanKPIs | null>(null);
  const [supplierProfile, setSupplierProfile] = useState<any>(null);

  // Van POS Category & Subcategory Filter (scoped to supplier's products)
  const [posCategory, setPosCategory] = useState<string>('الكل');
  const [posBranchId, setPosBranchId] = useState<string>('all');

  // Van Restock (تجهيز الفان من متجر المورد) State
  const [restockCart, setRestockCart] = useState<Record<string, number>>({});
  const [restockSearch, setRestockSearch] = useState('');
  const [restockCategory, setRestockCategory] = useState<string>('الكل');
  const [restockBranchId, setRestockBranchId] = useState<string>('all');
  const [restockCatalogView, setRestockCatalogView] = useState<'mini' | 'grid' | 'list'>('grid');
  const [restockNotes, setRestockNotes] = useState('');
  const [isSubmittingRestock, setIsSubmittingRestock] = useState(false);

  // Debt Collection Selected Store
  const [collectStoreId, setCollectStoreId] = useState('store_almansoor');

  // Printable / Shareable Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<any>(null);

  // Van Cashier Cart (Multi-item POS checkout with Tier Pricing & Cashier Discount)
  const [vanCart, setVanCart] = useState<VanCartLine[]>([]);
  const [targetStoreId, setTargetStoreId] = useState('store_almansoor');
  const [salePaymentType, setSalePaymentType] = useState<'cash' | 'credit'>('cash');
  const [cashierDiscountInput, setCashierDiscountInput] = useState('');
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  // Returns / Damaged / Exchange RMA form
  const [returnBarcode, setReturnBarcode] = useState('');
  const [returnStoreId, setReturnStoreId] = useState('store_almansoor');
  const [returnQty, setReturnQty] = useState(1);
  const [returnType, setReturnType] = useState<'return' | 'damage' | 'exchange'>('return');
  const [returnReason, setReturnReason] = useState('');
  const [isLoggingReturn, setIsLoggingReturn] = useState(false);

  // Daily Shift Close Modal
  const [showShiftCloseModal, setShowShiftCloseModal] = useState(false);
  const [actualCashInput, setActualCashInput] = useState('');
  const [odometerEndInput, setOdometerEndInput] = useState('');
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
        setSupplierProfile(data.supplier || null);
        setRouteStops(data.routeStops || []);
        setCreditAccounts(data.creditAccounts || []);
        setVanTransactions(data.transactions || []);
        setCommissionSummary(data.commissionSummary || null);
        setLoadRequests(data.loadRequests || []);
        setSupplierCatalog(data.supplierCatalog || []);
        setVanStores(data.stores || []);
        setVanExpenses(data.vanExpenses || []);
        setVanReturns(data.vanReturns || []);
        setShiftReports(data.shiftReports || []);
        setVanUnloadRecords(data.vanUnloadRecords || []);
        setVanKPIs(data.kpis || null);
        if (data.driver?.odometerEndKm || data.driver?.odometerStartKm) {
          setOdometerEndInput(String(data.driver.odometerEndKm ?? data.driver.odometerStartKm));
        }
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

  useEffect(() => {
    if (openShiftCloseSignal > 0) {
      setShiftCloseError(null);
      setShiftCloseResult(null);
      setShowShiftCloseModal(true);
    }
  }, [openShiftCloseSignal]);

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

  // Cart pricing helper with automatic wholesale tier pricing
  const resolveLinePricing = (line: VanCartLine) => {
    const stockItem = vanStock.find((v) => v.barcode === line.barcode);
    const tierApplied = Boolean(
      stockItem?.bulkDiscountMinQty &&
      stockItem?.bulkUnitPriceIQD &&
      line.qty >= stockItem.bulkDiscountMinQty
    );
    const effectiveUnitPrice = tierApplied
      ? (stockItem!.bulkUnitPriceIQD as number)
      : line.unitPriceIQD;
    const baseTotal = line.unitPriceIQD * line.qty;
    const lineTotal = effectiveUnitPrice * line.qty;
    return {
      effectiveUnitPrice,
      tierApplied,
      lineTotal,
      tierSavingsIQD: Math.max(0, baseTotal - lineTotal),
      bulkMinQty: stockItem?.bulkDiscountMinQty,
      bulkUnitPriceIQD: stockItem?.bulkUnitPriceIQD
    };
  };

  const cartGrossIQD = useMemo(
    () => vanCart.reduce((sum, line) => sum + resolveLinePricing(line).lineTotal, 0),
    [vanCart, vanStock]
  );

  const cartTierSavingsIQD = useMemo(
    () => vanCart.reduce((sum, line) => sum + resolveLinePricing(line).tierSavingsIQD, 0),
    [vanCart, vanStock]
  );

  const maxAllowedDiscountIQD = Math.round(cartGrossIQD * 0.25);
  const parsedCashierDiscount = Math.max(0, Math.round(Number(cashierDiscountInput) || 0));
  const cleanDiscountIQD = Math.min(parsedCashierDiscount, maxAllowedDiscountIQD);
  const cartTotalIQD = Math.max(0, cartGrossIQD - cleanDiscountIQD);

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
          paymentType: salePaymentType,
          discountIQD: cleanDiscountIQD
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (isAr ? 'فشل تسجيل البيع الفوري' : 'Direct sale failed'));
      }

      const grandTotal = data.data?.saleAmountIQD || cartTotalIQD;
      setVanCart([]);
      setCashierDiscountInput('');
      setFeedback({
        type: 'success',
        text: isAr
          ? `تم إصدار فاتورة بيع فوري (${totalProcessedUnits} وحدة) بقيمة ${formatCurrency(grandTotal, currency, language)} ومزامنة مخزون المتجر تلقائياً.`
          : `Instant sale completed (${totalProcessedUnits} units) totaling ${formatCurrency(grandTotal, currency, language)} & synced to store POS.`
      });
      if (data.data?.transaction) {
        setActiveReceipt(data.data.transaction);
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

  const resolvedSupplierIdentity: InvoiceSupplierIdentity = useMemo(() => {
    const supplierId = driverInfo?.supplierId || supplierProfile?.id || 'supp_rafidain';
    const dirMatch =
      WHOLESALE_SUPPLIERS.find((s) => s.id === supplierId) ||
      WHOLESALE_SUPPLIERS.find((s) => s.id === 'supp_rafidain') ||
      WHOLESALE_SUPPLIERS[0];

    return {
      id: supplierId,
      companyName: isAr
        ? supplierProfile?.companyName || dirMatch?.nameAr || 'شركة الرافدين للتجارة العامة والأغذية'
        : dirMatch?.nameEn || supplierProfile?.companyName || 'Al-Rafidain General Food & Trading Co.',
      phone: supplierProfile?.phone || dirMatch?.phone || '+964 780 112 2334',
      city: isAr ? supplierProfile?.city || 'بغداد' : 'Baghdad',
      address: isAr
        ? supplierProfile?.address || dirMatch?.addressAr || 'شارع الرشيد - حي الشورجة التجاري'
        : dirMatch?.addressEn || supplierProfile?.address || 'Rasheed St - Shorja Wholesale Hub',
      logoUrl: dirMatch?.logoUrl,
      storeImageUrl: dirMatch?.storeImageUrl,
      isVerified: supplierProfile?.isVerified ?? dirMatch?.isVerified ?? true
    };
  }, [driverInfo?.supplierId, supplierProfile, isAr]);

  const resolveInvoiceProductImage = (barcode: string, productName: string): string => {
    const fromCatalog = supplierCatalog.find((c) => c.barcode === barcode);
    if (fromCatalog?.imageUrl) return fromCatalog.imageUrl;
    const fromStock = vanStock.find((v) => v.barcode === barcode) as any;
    if (fromStock?.imageUrl) return fromStock.imageUrl;
    return resolveVanProductImage(barcode, productName, products);
  };

  // Handle Return / Damage / Exchange RMA
  const handleLogReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnBarcode || returnQty <= 0 || isLoggingReturn) return;
    setIsLoggingReturn(true);
    setFeedback(null);

    const stockItem = vanStock.find((v) => v.barcode === returnBarcode);

    try {
      const res = await fetch('/api/van/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          storeId: returnStoreId || undefined,
          barcode: returnBarcode,
          quantity: returnQty,
          type: returnType,
          batchNumber: stockItem?.batchNumber,
          expiryDate: stockItem?.expiryDate,
          reason:
            returnReason.trim() ||
            (returnType === 'damage'
              ? isAr
                ? 'تلف أثناء النقل'
                : 'Transit damage'
              : returnType === 'exchange'
              ? isAr
                ? 'استبدال صنف تالف بصالح 1 مقابل 1'
                : '1-for-1 product exchange'
              : isAr
              ? 'مرتجع متجر وإشعار دائن'
              : 'Store return & credit note')
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (isAr ? 'فشل قيد المرتجع' : 'Failed to log return'));
      }

      const rmaNum = data.returnRecord?.rmaNumber ? ` (${data.returnRecord.rmaNumber})` : '';
      setFeedback({
        type: 'success',
        text: isAr
          ? `تم تسجيل ${
              returnType === 'damage'
                ? 'تالف وعزله'
                : returnType === 'exchange'
                ? 'استبدال 1 مقابل 1'
                : 'مرتجع وإشعار دائن'
            }${rmaNum} بكمية ${returnQty} وحدة وتحديث عهدة الفان.`
          : `Recorded ${returnType}${rmaNum} (${returnQty} units) and updated van ledger.`
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
          actualCashCountedIQD: actualCash,
          odometerEndKm: odometerEndInput ? Number(odometerEndInput) : undefined
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

  const nearExpiryCount = useMemo(() => {
    const now = Date.now();
    return vanStock.filter((item) => {
      if (!item.expiryDate || item.remainingQuantity <= 0) return false;
      const days = Math.ceil((new Date(item.expiryDate).getTime() - now) / (1000 * 60 * 60 * 24));
      return days <= 45;
    }).length;
  }, [vanStock]);

  useEffect(() => {
    onSyncSummary?.({
      cashCustodyIQD: driverInfo?.currentCashCollectedIQD || 0,
      remainingUnits: totalRemainingUnits,
      pendingOrdersCount,
      pendingRestockCount,
      nearExpiryCount,
      creditClientsCount: creditAccounts.length,
      vehiclePlate: displayVehiclePlate,
      vanWarehouseName: displayVanWarehouse
    });
  }, [
    driverInfo?.currentCashCollectedIQD,
    totalRemainingUnits,
    pendingOrdersCount,
    pendingRestockCount,
    nearExpiryCount,
    creditAccounts.length,
    displayVehiclePlate,
    displayVanWarehouse
  ]);

  return (
    <div className="bg-[#F4F4EA] rounded-3xl border border-[#E2E6D7] p-3 sm:p-5 space-y-4 font-brand text-[#142018] pb-28">
      {/* ================= CONTEXTUAL PAGE HEADER (PER-PAGE IDENTITY) ================= */}
      {currentSection !== 'performance' && (() => {
        const pageMeta: Record<
          Exclude<VanModuleSection, 'performance'>,
          { icon: React.ReactNode; title: string; subtitle: string }
        > = {
          pos_sell: {
            icon: <Receipt className="w-6 h-6 text-[#FFE600]" />,
            title: isAr ? 'كاشير البيع المباشر بالجملة' : 'Wholesale Van POS',
            subtitle: isAr
              ? `${totalRemainingUnits} وحدة متوفرة بالفان · ${displayVehiclePlate}`
              : `${totalRemainingUnits} units in van · ${displayVehiclePlate}`
          },
          customers_credit: {
            icon: <Users className="w-6 h-6 text-[#FFE600]" />,
            title: isAr ? 'العملاء والائتمان والتحصيل' : 'Customers, Credit & Collections',
            subtitle: isAr
              ? `${creditAccounts.length} حساب عميل مسجل في خط التوزيع`
              : `${creditAccounts.length} active customer accounts`
          },
          returns_rma: {
            icon: <RotateCcw className="w-6 h-6 text-[#FFE600]" />,
            title: isAr ? 'المرتجعات وإشعارات الدائن والاستبدال' : 'Returns, Credit Notes & RMA',
            subtitle: isAr
              ? `${vanReturns.length} إشعار مرتجع واستبدال مسجل`
              : `${vanReturns.length} logged returns & exchanges`
          },
          inventory_audit: {
            icon: <PackageCheck className="w-6 h-6 text-[#FFE600]" />,
            title: isAr ? 'جرد الحمولة والدفعات والصلاحية (FEFO)' : 'Load Audit, Lots & FEFO',
            subtitle: isAr
              ? `${totalRemainingUnits} وحدة متبقية · ${nearExpiryCount} قريب الانتهاء`
              : `${totalRemainingUnits} units remaining · ${nearExpiryCount} near-expiry`
          },
          finance_settlement: {
            icon: <Wallet className="w-6 h-6 text-[#FFE600]" />,
            title: isAr ? 'المصاريف، فحص المركبة وتسوية الوردية' : 'Expenses, Fleet Check & Z-Report',
            subtitle: isAr
              ? `عهدة الكاش: ${formatCurrency(driverInfo?.currentCashCollectedIQD || 0, currency, language)}`
              : `Cash custody: ${formatCurrency(driverInfo?.currentCashCollectedIQD || 0, currency, language)}`
          },
          deliveries: {
            icon: <ClipboardCheck className="w-6 h-6 text-[#FFE600]" />,
            title: isAr ? 'طلبيات التوريد والتسليم (PIN)' : 'Scheduled Deliveries (PIN)',
            subtitle: isAr
              ? `${pendingOrdersCount} قيد التسليم من أصل ${assignedOrders.length}`
              : `${pendingOrdersCount} pending of ${assignedOrders.length} orders`
          },
          restock: {
            icon: <PackagePlus className="w-6 h-6 text-[#FFE600]" />,
            title: isAr ? 'تجهيز الفان من متجر المورد' : 'Van Restock & Load Requests',
            subtitle: isAr
              ? `${pendingRestockCount} طلب بانتظار اعتماد المستودع`
              : `${pendingRestockCount} requests awaiting approval`
          },
          navigation: {
            icon: <Navigation className="w-6 h-6 text-[#FFE600]" />,
            title: isAr ? 'الملاحة الذكية وخط التوزيع' : 'Smart Route Navigation',
            subtitle: isAr
              ? `${routeStops.length} محطة في مسار التوزيع اليوم`
              : `${routeStops.length} route stops scheduled today`
          },
          manage: {
            icon: <SlidersHorizontal className="w-6 h-6 text-[#FFE600]" />,
            title: isAr ? 'إدارة حالة الفان وخط السير' : 'Van Status & Route Planner',
            subtitle: isAr
              ? `${displayDriverName} · ${displayVehiclePlate}`
              : `${displayDriverName} · ${displayVehiclePlate}`
          }
        };

        const meta = pageMeta[currentSection];

        return (
          <header className="bg-gradient-to-l from-[#DCEAD9] via-[#EDF5EB] to-[#FAFDF9] rounded-2xl border border-[#BBD0BB] px-4 py-3 flex items-center justify-between gap-3 shadow-lg shadow-[#0B5D32]/20">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0F7A43] to-[#074423] text-white flex items-center justify-center shadow-lg shadow-[#0B5D32]/35 ring-4 ring-[#0B5D32]/15 shrink-0">
                {meta.icon}
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-black text-[#0B5D32] leading-tight truncate">
                  {meta.title}
                </h1>
                <p className="text-[11px] font-semibold text-[#4E6454] truncate mt-0.5">
                  {meta.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {currentSection === 'finance_settlement' && (
                <button
                  type="button"
                  onClick={() => {
                    setShiftCloseError(null);
                    setShiftCloseResult(null);
                    setShowShiftCloseModal(true);
                  }}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-[#FFA300] hover:bg-[#e69200] text-[#142018] font-black text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shadow-md shadow-amber-900/15"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{t.closeShiftBtn}</span>
                </button>
              )}

              {currentSection === 'manage' && (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full border shadow-sm whitespace-nowrap ${
                    driverInfo?.availabilityStatus === 'busy'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      driverInfo?.availabilityStatus === 'busy' ? 'bg-amber-500' : 'bg-[#00A046]'
                    }`}
                  />
                  <span>
                    {driverInfo?.availabilityStatus === 'busy'
                      ? isAr ? 'مشغول' : 'Busy'
                      : isAr ? 'متاح' : 'Available'}
                  </span>
                </span>
              )}

              <button
                type="button"
                onClick={() => loadVanData()}
                disabled={loading}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#DCEBD8] to-[#F3F8F1] border border-[#B7CEB7] hover:border-[#0B5D32] flex items-center justify-center text-[#0B5D32] shadow-md shadow-[#0B5D32]/20 ring-4 ring-[#0B5D32]/10 transition cursor-pointer shrink-0"
                title={isAr ? 'تحديث البيانات' : 'Refresh Data'}
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </header>
        );
      })()}

      {/* ================= ENTERPRISE VAN DSD WORKSPACE RAIL ================= */}
      {driverTab === 'pos' && (
        <div className="bg-white border border-[#DCE5DC] rounded-2xl p-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSection('pos_sell')}
            className={`min-h-[38px] px-3 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
              currentSection === 'pos_sell'
                ? 'bg-[#0B5D32] text-white shadow-2xs'
                : 'text-[#4B6352] hover:bg-[#F4F4EA]'
            }`}
          >
            <Receipt className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'كاشير البيع' : 'Van POS'}</span>
            {cartUnitsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-[#FFE600] text-[#142018] text-[10px] font-black tabular-nums leading-none">
                {cartUnitsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSection('customers_credit')}
            className={`min-h-[38px] px-3 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
              currentSection === 'customers_credit'
                ? 'bg-[#0B5D32] text-white shadow-2xs'
                : 'text-[#4B6352] hover:bg-[#F4F4EA]'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'العملاء والتحصيل' : 'Customers & Credit'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSection('returns_rma')}
            className={`min-h-[38px] px-3 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
              currentSection === 'returns_rma'
                ? 'bg-[#0B5D32] text-white shadow-2xs'
                : 'text-[#4B6352] hover:bg-[#F4F4EA]'
            }`}
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'المرتجعات والاستبدال' : 'Returns & RMA'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSection('inventory_audit')}
            className={`min-h-[38px] px-3 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
              currentSection === 'inventory_audit'
                ? 'bg-[#0B5D32] text-white shadow-2xs'
                : 'text-[#4B6352] hover:bg-[#F4F4EA]'
            }`}
          >
            <PackageCheck className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'الجرد وFEFO' : 'Audit & FEFO'}</span>
            {nearExpiryCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black tabular-nums leading-none">
                {nearExpiryCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSection('finance_settlement')}
            className={`min-h-[38px] px-3 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
              currentSection === 'finance_settlement'
                ? 'bg-[#0B5D32] text-white shadow-2xs'
                : 'text-[#4B6352] hover:bg-[#F4F4EA]'
            }`}
          >
            <Wallet className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'المصاريف والتسوية' : 'Expenses & Z-Report'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSection('performance')}
            className={`min-h-[38px] px-3 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
              currentSection === 'performance'
                ? 'bg-[#0B5D32] text-white shadow-2xs'
                : 'text-[#4B6352] hover:bg-[#F4F4EA]'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'لوحة مؤشرات الأداء' : 'KPIs'}</span>
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
      {currentSection === 'pos_sell' && (
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
                          {item.bulkDiscountMinQty && item.bulkUnitPriceIQD && (
                            <div className="text-[9.5px] font-bold text-[#0B5D32] bg-[#EFF7F1] px-1.5 py-0.5 rounded-md mt-1 inline-block tabular-nums">
                              {isAr
                                ? `جملة +${item.bulkDiscountMinQty}: ${formatCurrency(item.bulkUnitPriceIQD, currency, language)}`
                                : `+${item.bulkDiscountMinQty}: ${formatCurrency(item.bulkUnitPriceIQD, currency, language)}`}
                            </div>
                          )}
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
            {/* Compact Supplier Brand Identity Strip */}
            <div className="bg-gradient-to-l from-[#E8F2E9] via-[#F4F8F4] to-white border border-[#CEE0CE] rounded-xl px-2.5 py-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white border border-[#DCE5DC] p-0.5 shadow-2xs overflow-hidden shrink-0 flex items-center justify-center">
                  {resolvedSupplierIdentity.logoUrl ? (
                    <img
                      src={resolvedSupplierIdentity.logoUrl}
                      alt={resolvedSupplierIdentity.companyName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <ShoppingCart className="w-4 h-4 text-[#0B5D32]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[11.5px] font-black text-[#0B5D32] truncate flex items-center gap-1">
                    <span className="truncate">{resolvedSupplierIdentity.companyName}</span>
                    <BadgeCheck className="w-3.5 h-3.5 text-[#00A046] shrink-0" />
                  </div>
                  <div className="text-[10px] font-semibold text-[#5F7164] truncate">
                    {isAr ? 'فاتورة البيع الفوري للجملة' : 'Wholesale Van Instant Invoice'}
                  </div>
                </div>
              </div>

              {vanCart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setVanCart([])}
                  className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تفريغ' : 'Clear'}</span>
                </button>
              )}
            </div>

            {/* Target Store Selector + Credit Snapshot */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#4B6352] flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-[#0B5D32]" />
                <span>{t.purchasingStore}</span>
              </label>
              <select
                value={targetStoreId}
                onChange={(e) => setTargetStoreId(e.target.value)}
                className="w-full bg-[#F8FAF7] border border-[#DCE5DC] focus:border-[#0B5D32] rounded-xl px-3 py-2 text-xs font-bold text-[#142018] focus:bg-white focus:outline-hidden"
              >
                {vanStores.length > 0 ? (
                  vanStores.map((st) => (
                    <option key={st.id} value={st.id}>
                      {getLocalizedText(st.name, language)}
                      {st.district ? ` — ${st.district}` : ''}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="store_almansoor">
                      {getLocalizedText('سوبرماركت المنصور المركزي', language)}
                    </option>
                    <option value="store_karrada">
                      {getLocalizedText('أسواق دجلة الخير - الكرادة', language)}
                    </option>
                  </>
                )}
              </select>

              {(() => {
                const acc = creditAccounts.find((c) => c.storeId === targetStoreId);
                if (!acc) return null;
                return (
                  <div
                    className={`px-2.5 py-1.5 rounded-lg border text-[10.5px] font-bold flex items-center justify-between ${
                      acc.isBlocked
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-[#F8FAF7] border-[#DCE5DC] text-[#4B6352]'
                    }`}
                  >
                    <span>
                      {acc.isBlocked
                        ? isAr ? 'حساب موقوف (تجاوز أو تأخير)' : 'Account Blocked'
                        : isAr ? 'المتاح بالائتمان:' : 'Available Credit:'}
                    </span>
                    <span className="font-mono font-black tabular-nums">
                      {formatCurrency(acc.availableCreditIQD || 0, currency, language)}
                    </span>
                  </div>
                );
              })()}
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
              <div className="divide-y divide-[#EAEFEA] max-h-60 overflow-y-auto pe-1">
                {vanCart.map((line) => {
                  const pricing = resolveLinePricing(line);
                  return (
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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10.5px] font-mono text-[#0B5D32] font-bold tabular-nums">
                              {formatCurrency(pricing.lineTotal, currency, language)}
                            </span>
                            {pricing.tierApplied && (
                              <span className="text-[9.5px] font-black bg-[#EFF7F1] text-[#0B5D32] px-1.5 py-0.2 rounded">
                                {isAr ? 'سعر الكمية' : 'Tier Price'}
                              </span>
                            )}
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
                  );
                })}
              </div>
            )}

            {/* Cashier Discount Input */}
            {vanCart.length > 0 && (
              <div className="pt-2 border-t border-[#EAEFEA] space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#4B6352]">
                  <span>{isAr ? 'خصم تجاري إضافي (بحد أقصى 25%):' : 'Trade Discount (max 25%):'}</span>
                  <span className="font-mono tabular-nums text-[#5F7164]">
                    {formatCurrency(maxAllowedDiscountIQD, currency, language)}
                  </span>
                </div>
                <input
                  type="number"
                  min={0}
                  max={maxAllowedDiscountIQD}
                  value={cashierDiscountInput}
                  onChange={(e) => setCashierDiscountInput(e.target.value)}
                  placeholder={isAr ? 'أدخل مبلغ الخصم بالدينار (اختياري)...' : 'Optional discount IQD...'}
                  className="w-full bg-[#F8FAF7] border border-[#DCE5DC] focus:border-[#0B5D32] rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:bg-white focus:outline-hidden"
                />
              </div>
            )}

            {/* Totals & Checkout CTA */}
            <div className="pt-3 border-t border-[#EAEFEA] space-y-2">
              <div className="flex items-center justify-between text-xs text-[#5F7164]">
                <span>{isAr ? 'عدد الوحدات:' : 'Total Units:'}</span>
                <span className="font-mono font-bold text-[#142018] tabular-nums">
                  {cartUnitsCount}
                </span>
              </div>
              {cartTierSavingsIQD > 0 && (
                <div className="flex items-center justify-between text-xs text-[#0B5D32] font-bold">
                  <span>{isAr ? 'وفر تسعير الجملة للكميات:' : 'Bulk Tier Savings:'}</span>
                  <span className="font-mono tabular-nums">
                    -{formatCurrency(cartTierSavingsIQD, currency, language)}
                  </span>
                </div>
              )}
              {cleanDiscountIQD > 0 && (
                <div className="flex items-center justify-between text-xs text-amber-800 font-bold">
                  <span>{isAr ? 'خصم الفاتورة:' : 'Cashier Discount:'}</span>
                  <span className="font-mono tabular-nums">
                    -{formatCurrency(cleanDiscountIQD, currency, language)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#142018]">
                  {isAr ? 'إجمالي الفاتورة الصافي:' : 'Net Invoice Total:'}
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
      {currentSection === 'restock' && (() => {
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
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#5F7164] absolute top-1/2 -translate-y-1/2 start-3" />
                    <input
                      type="text"
                      value={restockSearch}
                      onChange={(e) => setRestockSearch(e.target.value)}
                      placeholder={isAr ? 'ابحث في منتجات المورد بالاسم أو الباركود...' : 'Search supplier products...'}
                      className="w-full h-10 bg-[#F8FAF7] border border-[#DCE5DC] focus:border-[#0B5D32] focus:bg-white rounded-xl ps-9 pe-3 text-xs font-bold focus:outline-hidden"
                    />
                  </div>

                  {/* Mini / Grid / List View Mode Switcher */}
                  <div className="flex items-center bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl p-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setRestockCatalogView('mini')}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
                        restockCatalogView === 'mini'
                          ? 'bg-[#0B5D32] text-white shadow-2xs'
                          : 'text-[#4B6352] hover:text-[#142018]'
                      }`}
                      title={isAr ? 'عرض مصغّر' : 'Mini Grid View'}
                      aria-label={isAr ? 'عرض مصغّر' : 'Mini Grid View'}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRestockCatalogView('grid')}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
                        restockCatalogView === 'grid'
                          ? 'bg-[#0B5D32] text-white shadow-2xs'
                          : 'text-[#4B6352] hover:text-[#142018]'
                      }`}
                      title={isAr ? 'عرض شبكي' : 'Grid View'}
                      aria-label={isAr ? 'عرض شبكي' : 'Grid View'}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRestockCatalogView('list')}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
                        restockCatalogView === 'list'
                          ? 'bg-[#0B5D32] text-white shadow-2xs'
                          : 'text-[#4B6352] hover:text-[#142018]'
                      }`}
                      title={isAr ? 'عرض قائمة' : 'List View'}
                      aria-label={isAr ? 'عرض قائمة' : 'List View'}
                    >
                      <LayoutList className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {filteredCatalog.length === 0 ? (
                  <div className="py-10 text-center text-xs font-bold text-[#5F7164]">
                    {isAr ? 'لا توجد منتجات مطابقة في هذا القسم.' : 'No matching supplier products in this category.'}
                  </div>
                ) : restockCatalogView === 'mini' ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[520px] overflow-y-auto pe-0.5">
                    {filteredCatalog.map((prod) => {
                      const qtyInReq = restockCart[prod.barcode] || 0;
                      const currentVanItem = vanStock.find((v) => v.barcode === prod.barcode);
                      const imgSrc = prod.imageUrl || resolveVanProductImage(prod.barcode, prod.nameAr, products);

                      return (
                        <div
                          key={prod.barcode}
                          onClick={() => handleAdjustRestockQty(prod.barcode, 5)}
                          className={`group rounded-xl border p-1.5 flex flex-col justify-between gap-1.5 transition cursor-pointer ${
                            qtyInReq > 0
                              ? 'border-[#0B5D32] bg-[#ECFDF5]/40 ring-1 ring-[#0B5D32]/20'
                              : 'border-[#DCE5DC] bg-white hover:border-[#0B5D32]/60'
                          }`}
                        >
                          <div className="relative h-16 sm:h-20 w-full bg-white rounded-lg border border-[#F0F2ED] p-1 flex items-center justify-center overflow-hidden">
                            <img
                              src={imgSrc}
                              alt={prod.nameAr}
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-200"
                            />
                            {qtyInReq > 0 && (
                              <span className="absolute top-1 end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0B5D32] text-white text-[9.5px] font-black font-mono tabular-nums flex items-center justify-center shadow-xs">
                                {qtyInReq}
                              </span>
                            )}
                            {currentVanItem && (
                              <span className="absolute bottom-0.5 start-0.5 text-[9px] font-black bg-[#F4F4EA] text-[#4B6352] px-1 rounded tabular-nums">
                                {currentVanItem.remainingQuantity}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 flex-1 flex flex-col justify-between">
                            <h4 className="text-[10px] sm:text-[10.5px] font-black text-[#142018] line-clamp-2 leading-tight min-h-[25px]">
                              {prod.nameAr}
                            </h4>

                            <div className="pt-1 border-t border-[#F0F3EE] flex items-center justify-between gap-1">
                              <span className="text-[9.5px] sm:text-[10px] font-black font-mono tabular-nums text-[#0B5D32] truncate">
                                {formatCurrency(prod.priceIQD, currency, language)}
                              </span>

                              {qtyInReq === 0 ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAdjustRestockQty(prod.barcode, 5);
                                  }}
                                  className="w-6 h-6 rounded-md bg-[#0B5D32] hover:bg-[#084725] text-white flex items-center justify-center transition cursor-pointer shrink-0"
                                  aria-label={isAr ? 'إضافة (+5)' : 'Add (+5)'}
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
                                    onClick={() => handleAdjustRestockQty(prod.barcode, -1)}
                                    className="px-1 h-full hover:bg-black/15 cursor-pointer flex items-center justify-center"
                                  >
                                    <Minus className="w-2.5 h-2.5 stroke-[3]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAdjustRestockQty(prod.barcode, 5)}
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
                ) : restockCatalogView === 'grid' ? (
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
                ) : (
                  <div className="bg-white rounded-xl border border-[#EAEFEA] divide-y divide-[#EAEFEA] max-h-[520px] overflow-y-auto">
                    {filteredCatalog.map((prod) => {
                      const qtyInReq = restockCart[prod.barcode] || 0;
                      const currentVanItem = vanStock.find((v) => v.barcode === prod.barcode);
                      const imgSrc = prod.imageUrl || resolveVanProductImage(prod.barcode, prod.nameAr, products);

                      return (
                        <div
                          key={prod.barcode}
                          onClick={() => handleAdjustRestockQty(prod.barcode, 5)}
                          className={`p-2.5 flex items-center justify-between gap-2.5 transition cursor-pointer ${
                            qtyInReq > 0 ? 'bg-[#ECFDF5]/35' : 'hover:bg-[#F8FAF7]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-white border border-[#EAEFEA] p-1 flex items-center justify-center shrink-0">
                              <img
                                src={imgSrc}
                                alt={prod.nameAr}
                                referrerPolicy="no-referrer"
                                className="max-h-full max-w-full object-contain mix-blend-multiply"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-black text-[#142018] truncate">{prod.nameAr}</div>
                              <div className="text-[10.5px] text-[#5F7164] tabular-nums flex items-center gap-1.5 flex-wrap mt-0.5">
                                <span>{prod.unit}</span>
                                {currentVanItem && (
                                  <>
                                    <span>·</span>
                                    <span className="font-bold text-[#0B5D32]">
                                      {isAr
                                        ? `بالفان ${currentVanItem.remainingQuantity}`
                                        : `Van ${currentVanItem.remainingQuantity}`}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 shrink-0"
                          >
                            <span className="text-xs font-black font-mono tabular-nums text-[#0B5D32] whitespace-nowrap">
                              {formatCurrency(prod.priceIQD, currency, language)}
                            </span>

                            {qtyInReq === 0 ? (
                              <button
                                type="button"
                                onClick={() => handleAdjustRestockQty(prod.barcode, 5)}
                                className="h-8 px-2.5 rounded-xl bg-[#0B5D32] hover:bg-[#084725] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+5</span>
                              </button>
                            ) : (
                              <div className="h-8 flex items-center bg-[#0B5D32] text-white rounded-xl overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => handleAdjustRestockQty(prod.barcode, -1)}
                                  className="px-2 h-full hover:bg-black/15 cursor-pointer"
                                >
                                  <Minus className="w-3 h-3 stroke-[3]" />
                                </button>
                                <span className="px-2 text-xs font-mono font-black tabular-nums">
                                  {qtyInReq}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustRestockQty(prod.barcode, 5)}
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
      {currentSection === 'navigation' && (
        <VanSmartNavigation
          routeStops={routeStops}
          assignedOrders={assignedOrders}
          language={language}
          onStartSaleForStore={(storeId) => {
            setTargetStoreId(storeId);
            setSection('pos_sell');
          }}
          onMarkStopVisited={(stopId) => handleUpdateRouteStop(stopId, 'visited')}
        />
      )}

      {/* ===================================================================== */}
      {/* TAB: VAN MANAGEMENT (إدارة الفان: التوفر + المسار + التوصيلات المجدولة) */}
      {/* ===================================================================== */}
      {currentSection === 'manage' && (
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
            setSection('pos_sell');
          }}
          onStartCollectionForStore={(storeId) => {
            setCollectStoreId(storeId);
            setSection('customers_credit');
          }}
          onOpenNavigation={() => setSection('navigation')}
          onOpenDeliveries={() => setSection('deliveries')}
          onFeedback={setFeedback}
        />
      )}


      {/* ===================================================================== */}
      {/* ENTERPRISE MODULE: CUSTOMERS, CREDIT AGING, ONBOARDING & COLLECTIONS   */}
      {/* ===================================================================== */}
      {currentSection === 'customers_credit' && (
        <VanCustomersCreditPanel
          driverId={driverId}
          stores={vanStores}
          creditAccounts={creditAccounts}
          vanTransactions={vanTransactions}
          currency={currency}
          language={language}
          collectStoreId={collectStoreId}
          onSelectCollectStore={setCollectStoreId}
          onStartSaleForStore={(storeId) => {
            setTargetStoreId(storeId);
            setSection('pos_sell');
          }}
          onRefreshVanData={loadVanData}
          onOpenReceipt={(tx) => {
            setActiveReceipt(tx);
          }}
          onFeedback={setFeedback}
        />
      )}

      {/* ===================================================================== */}
      {/* ENTERPRISE MODULE: LOAD AUDIT, FEFO LOTS & WAREHOUSE UNLOAD           */}
      {/* ===================================================================== */}
      {currentSection === 'inventory_audit' && (
        <VanInventoryAuditPanel
          driverId={driverId}
          vanStock={vanStock}
          vanUnloadRecords={vanUnloadRecords}
          currency={currency}
          language={language}
          onRefreshVanData={loadVanData}
          onFeedback={setFeedback}
        />
      )}

      {/* ===================================================================== */}
      {/* ENTERPRISE MODULE: FIELD EXPENSES, VEHICLE TELEMETRY & Z-REPORTS      */}
      {/* ===================================================================== */}
      {currentSection === 'finance_settlement' && (
        <VanFinanceSettlementPanel
          driverId={driverId}
          driverInfo={driverInfo}
          vanExpenses={vanExpenses}
          shiftReports={shiftReports}
          currency={currency}
          language={language}
          onRefreshVanData={loadVanData}
          onOpenShiftCloseModal={() => {
            setShiftCloseError(null);
            setShiftCloseResult(null);
            setShowShiftCloseModal(true);
          }}
          onFeedback={setFeedback}
        />
      )}

      {/* ===================================================================== */}
      {/* ENTERPRISE MODULE: KPI SCORECARD & COMMISSIONS                        */}
      {/* ===================================================================== */}
      {currentSection === 'performance' && (
        <VanPerformancePanel
          commissionSummary={commissionSummary}
          kpis={vanKPIs}
          vanStock={vanStock}
          currency={currency}
          language={language}
          driverName={displayDriverName}
          vehiclePlate={displayVehiclePlate}
          vanWarehouseName={displayVanWarehouse}
          availabilityStatus={driverInfo?.availabilityStatus === 'busy' ? 'busy' : 'available'}
          isOnline={isOnline}
          currentCashCollectedIQD={driverInfo?.currentCashCollectedIQD || 0}
          totalRemainingUnits={totalRemainingUnits}
          totalSoldUnits={totalSoldUnits}
          pendingOrdersCount={pendingOrdersCount}
          assignedOrdersCount={assignedOrders.length}
          loading={loading}
          onRefresh={() => loadVanData()}
          onOpenShiftClose={() => {
            setShiftCloseError(null);
            setShiftCloseResult(null);
            setShowShiftCloseModal(true);
          }}
          onOpenManage={() => setSection('manage')}
          onOpenDeliveries={() => setSection('deliveries')}
        />
      )}

      {/* ===================================================================== */}
      {/* TAB 2: ASSIGNED DELIVERY ORDERS (PIN VERIFICATION)                    */}
      {/* ===================================================================== */}
      {currentSection === 'deliveries' && (
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
      {/* ENTERPRISE MODULE: RETURNS, CREDIT NOTES & EXCHANGES (RMA)            */}
      {/* ===================================================================== */}
      {currentSection === 'returns_rma' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-700" />
                <h3 className="font-black text-sm text-[#142018]">{t.returnDamageTitle}</h3>
              </div>
              {selectedReturnItem?.batchNumber && (
                <span className="text-[11px] font-mono font-bold text-[#4B6352] bg-[#F8FAF7] border border-[#DCE5DC] px-2.5 py-1 rounded-lg">
                  {selectedReturnItem.batchNumber} · {isAr ? 'انتهاء:' : 'Exp:'} {selectedReturnItem.expiryDate}
                </span>
              )}
            </div>

            {/* Customer Store Picker for Credit Note */}
            <div>
              <label className="text-[11px] font-bold text-[#4B6352] mb-1 flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-[#0B5D32]" />
                <span>{isAr ? 'المتجر المُصدر له إشعار المرتجع / الاستبدال:' : 'Customer Store for RMA / Credit Note:'}</span>
              </label>
              <select
                value={returnStoreId}
                onChange={(e) => setReturnStoreId(e.target.value)}
                className="w-full bg-[#F8FAF7] border border-[#DCE5DC] focus:border-[#0B5D32] rounded-xl px-3 py-2 text-xs font-bold text-[#142018] focus:bg-white focus:outline-hidden"
              >
                {vanStores.map((st) => (
                  <option key={st.id} value={st.id}>
                    {getLocalizedText(st.name, language)}
                    {st.district ? ` — ${st.district}` : ''}
                  </option>
                ))}
              </select>
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
              <div className="sm:col-span-5">
                <label className="text-[#4B6352] font-bold block mb-1">
                  {isAr ? 'نوع الإجراء:' : 'RMA Type:'}
                </label>
                <div className="grid grid-cols-3 gap-1 bg-[#F4F4EA] p-1 rounded-xl font-bold">
                  <button
                    type="button"
                    onClick={() => setReturnType('return')}
                    className={`py-2 px-1 rounded-lg transition cursor-pointer text-[11px] ${
                      returnType === 'return'
                        ? 'bg-[#0B5D32] text-white shadow-2xs'
                        : 'text-[#4B6352]'
                    }`}
                  >
                    {isAr ? 'مرتجع سليم' : 'Return'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnType('exchange')}
                    className={`py-2 px-1 rounded-lg transition cursor-pointer text-[11px] ${
                      returnType === 'exchange'
                        ? 'bg-blue-700 text-white shadow-2xs'
                        : 'text-[#4B6352]'
                    }`}
                  >
                    {isAr ? 'استبدال 1:1' : 'Exchange'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnType('damage')}
                    className={`py-2 px-1 rounded-lg transition cursor-pointer text-[11px] ${
                      returnType === 'damage'
                        ? 'bg-red-600 text-white shadow-2xs'
                        : 'text-[#4B6352]'
                    }`}
                  >
                    {isAr ? 'تالف / منتهي' : 'Damaged'}
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
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
                  {isAr ? 'السبب / الملاحظة:' : 'Reason:'}
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

          {/* RMA & Credit Notes Register */}
          <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm text-[#142018]">
                {isAr ? 'سجل المرتجعات وإشعارات الدائن (RMA Ledger)' : 'RMA & Credit Notes Register'}
              </h4>
              <span className="text-xs font-mono font-bold text-[#5F7164] tabular-nums">
                {vanReturns.length} {isAr ? 'إشعار' : 'records'}
              </span>
            </div>

            {vanReturns.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#5F7164]">
                {isAr ? 'لا توجد إشعارات مرتجع مسجلة اليوم' : 'No RMA records logged yet'}
              </div>
            ) : (
              <div className="divide-y divide-[#EAEFEA] max-h-[340px] overflow-y-auto">
                {vanReturns.map((ret) => (
                  <div key={ret.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-xs text-[#0B5D32]">
                          {ret.rmaNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            ret.type === 'damage'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : ret.type === 'exchange'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                          }`}
                        >
                          {ret.type === 'damage'
                            ? isAr ? 'تالف معزول' : 'Damaged'
                            : ret.type === 'exchange'
                            ? isAr ? 'استبدال 1:1' : 'Exchange'
                            : isAr ? 'إشعار دائن' : 'Credit Note'}
                        </span>
                        {ret.storeName && (
                          <span className="text-[11px] font-bold text-[#142018] truncate">
                            {ret.storeName}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-[#142018] mt-0.5 truncate">
                        {ret.productName} × {ret.quantity}
                      </div>
                      <div className="text-[10.5px] text-[#5F7164] truncate">
                        {ret.reason}
                        {ret.batchNumber ? ` · ${ret.batchNumber}` : ''}
                      </div>
                    </div>

                    <div className="text-end shrink-0">
                      <div className="font-mono font-black text-xs text-[#0B5D32] tabular-nums">
                        {ret.creditNoteAmountIQD > 0
                          ? formatCurrency(ret.creditNoteAmountIQD, currency, language)
                          : isAr ? 'استبدال' : 'Swap'}
                      </div>
                      <div className="text-[10px] text-[#5F7164]">
                        {new Date(ret.createdAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MOBILE FLOATING RECEIPT JUMP BAR ================= */}
      {currentSection === 'pos_sell' && vanCart.length > 0 && (
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
                <div className="bg-[#F8FAF7] p-3 rounded-xl border border-[#DCE5DC] text-[#4B6352] space-y-1">
                  <div className="flex items-center justify-between">
                    <span>{t.expectedCashFromSales}</span>
                    <strong className="text-base font-mono text-[#0B5D32] tabular-nums">
                      {formatCurrency(driverInfo?.currentCashCollectedIQD || 0, currency, language)}
                    </strong>
                  </div>
                  {(driverInfo?.todayExpensesIQD || 0) > 0 && (
                    <div className="flex items-center justify-between text-[11px] text-amber-800 font-bold">
                      <span>{isAr ? 'إجمالي المصاريف المخصومة اليوم:' : 'Deducted Field Expenses:'}</span>
                      <span className="font-mono tabular-nums">
                        {formatCurrency(driverInfo.todayExpensesIQD, currency, language)}
                      </span>
                    </div>
                  )}
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

                <div>
                  <label className="text-[#4B6352] font-bold block mb-1">
                    {isAr ? 'قراءة عداد المسافة عند التسليم (كم) - اختياري:' : 'End Odometer Reading (km) - optional:'}
                  </label>
                  <input
                    type="number"
                    value={odometerEndInput}
                    onChange={(e) => setOdometerEndInput(e.target.value)}
                    placeholder="118480"
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

      {/* ================= MODAL: Executive Branded Van Invoice ================= */}
      {activeReceipt && (
        <VanInvoiceModal
          receipt={activeReceipt}
          supplierInfo={resolvedSupplierIdentity}
          customerStore={
            vanStores.find((st) => st.id === activeReceipt.storeId) ||
            routeStops.find((rs) => rs.storeId === activeReceipt.storeId) ||
            null
          }
          vehiclePlate={displayVehiclePlate}
          vanWarehouseName={displayVanWarehouse}
          resolveProductImage={resolveInvoiceProductImage}
          currency={currency}
          language={language}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      {/* ================= STICKY DRIVER BOTTOM NAVIGATION BAR ================= */}
      <DriverBottomNav
        activeTab={driverTab}
        onSelectTab={(tab) => {
          if (tab === 'pos') setSection('pos_sell');
          else setSection(tab);
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
