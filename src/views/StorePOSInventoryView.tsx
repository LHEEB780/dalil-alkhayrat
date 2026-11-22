import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  AlertTriangle,
  Clock,
  ScanBarcode,
  Camera,
  CheckCircle2,
  Plus,
  Minus,
  Sparkles,
  Sliders,
  TrendingDown,
  Bell,
  Edit2,
  Check,
  Search,
  FileText,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  RefreshCw,
  Receipt,
  CreditCard,
  Banknote,
  BookOpen,
  LayoutGrid,
  Grid3X3,
  LayoutList,
  Image as ImageIcon,
  AlertCircle,
  X,
  QrCode,
  Eye,
  Store,
  ShieldCheck,
  RotateCcw,
  TrendingUp
} from 'lucide-react';
import { Currency, ProductWithOffers, Language } from '../types/index.ts';
import { formatCurrency } from '../utils/format.ts';
import { getLocalizedText } from '../utils/translations.ts';
import { fetchWithRetry } from '../utils/fetchWithRetry.ts';

interface StorePOSInventoryViewProps {
  currency: Currency;
  products: ProductWithOffers[];
  onOpenProductComparison: (product: ProductWithOffers) => void;
  onQuickReorder: (barcode: string) => void;
  onRefreshLowStockAlerts?: () => void;
  onOpenLowStockModal?: () => void;
  onOpenQRPoster?: () => void;
  onOpenStoreManagement?: () => void;
  onOpenStorefrontB2C?: () => void;
  lowStockAlertsCount?: number;
  language?: Language;
  cashierName?: string;
  storeName?: string;
  isCashierMode?: boolean;
}

interface POSCartLine {
  barcode: string;
  name: string;
  price: number;
  costPrice: number;
  qty: number;
  maxStock: number;
  imageUrl: string;
  note?: string;
}

interface POSSaleRecord {
  id: string;
  receiptNumber: number;
  storeId: string;
  orderMode: 'in_store' | 'take_away' | 'online_order';
  customerName: string;
  paymentType: 'cash' | 'card' | 'credit_ledger';
  items: {
    barcode: string;
    productName: string;
    quantity: number;
    unitPriceIQD: number;
    note?: string;
  }[];
  subtotalIQD: number;
  discountIQD: number;
  totalIQD: number;
  profitIQD: number;
  createdAt: string;
}

interface POSReturnItem {
  barcode: string;
  productName: string;
  quantity: number;
  unitPriceIQD: number;
  restockToShelf: boolean;
}

interface POSReturnRecord {
  id: string;
  returnNumber: number;
  storeId: string;
  originalReceiptNumber?: number;
  customerName: string;
  refundMethod: 'cash' | 'card' | 'credit_ledger';
  items: POSReturnItem[];
  totalRefundIQD: number;
  profitAdjustmentIQD: number;
  reason: string;
  processedBy?: string;
  createdAt: string;
}

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  'أرز وحبوب': '/assets/images/white_basmati_rice.jpg',
  'زيوت وسمن': '/assets/images/white_sunflower_oil.jpg',
  'ألبان وأجبان': '/assets/images/white_milk_powder.jpg',
  'معلبات ومخللات': '/assets/images/white_tomato_paste.jpg',
  'مشروبات وشاي': '/assets/images/white_ceylon_tea.jpg',
  'سكر ومحليات': '/assets/images/white_sugar_pack.jpg',
  'مكرونة وشعرية': '/assets/images/white_pasta_pack.jpg',
  'قهوة ومشروبات ساخنة': '/assets/images/white_espresso_coffee.jpg',
  'منظفات وعناية': '/assets/images/white_cleaner_bottles.jpg'
};

export const StorePOSInventoryView: React.FC<StorePOSInventoryViewProps> = ({
  currency,
  products,
  onOpenProductComparison,
  onQuickReorder,
  onRefreshLowStockAlerts,
  onOpenLowStockModal,
  onOpenQRPoster,
  onOpenStoreManagement,
  onOpenStorefrontB2C,
  lowStockAlertsCount = 0,
  language = 'ar',
  cashierName,
  storeName,
  isCashierMode = false
}) => {
  const isAr = language === 'ar';
  const storeId = 'store_almansoor';

  // Top-level subview: 'pos' (Cashier Terminal) vs 'report' (Analytics & Inventory Thresholds)
  const [activeSubView, setActiveSubView] = useState<'pos' | 'report'>('pos');
  const [reportTab, setReportTab] = useState<'transactions' | 'returns' | 'inventory'>('transactions');

  // Data state
  const [inventory, setInventory] = useState<any[]>([]);
  const [salesHistory, setSalesHistory] = useState<POSSaleRecord[]>([]);
  const [posReturns, setPosReturns] = useState<POSReturnRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(() => new Date());

  // POS Catalog & Receipt state
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [productViewMode, setProductViewMode] = useState<'mini' | 'grid' | 'large' | 'list'>(() => {
    try {
      const saved = localStorage.getItem('pos_product_view_mode');
      if (saved === 'mini' || saved === 'grid' || saved === 'large' || saved === 'list') return saved;
    } catch {
      // ignore storage error
    }
    return 'grid';
  });
  const [posCart, setPosCart] = useState<POSCartLine[]>([]);
  const [orderMode, setOrderMode] = useState<'in_store' | 'take_away' | 'online_order'>('in_store');
  const [customerName, setCustomerName] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'cash' | 'card' | 'credit_ledger'>('cash');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [editingNoteBarcode, setEditingNoteBarcode] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState<string>('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Category Slider Ref
  const categorySliderRef = useRef<HTMLDivElement | null>(null);

  // Working Barcode Scanner Modal state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerCode, setScannerCode] = useState('');
  const [scannerCameraActive, setScannerCameraActive] = useState(false);
  const [scannerCameraError, setScannerCameraError] = useState<string | null>(null);
  const [continuousScan, setContinuousScan] = useState(true);
  const [scannerFeedback, setScannerFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
    reorderBarcode?: string;
  } | null>(null);
  const scannerVideoRef = useRef<HTMLVideoElement | null>(null);
  const scannerStreamRef = useRef<MediaStream | null>(null);
  const scannerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Feedback & Alert Bridge state
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    message: string;
    triggeredAlerts?: any[];
  } | null>(null);

  // Report Chart & Table Filters
  const [chartTimeframe, setChartTimeframe] = useState<'day' | 'week' | 'month'>('day');
  const [hoveredChartIdx, setHoveredChartIdx] = useState<number | null>(null);
  const [txFilterMode, setTxFilterMode] = useState<'all' | 'in_store' | 'take_away' | 'online_order'>('all');
  const [reportSearch, setReportSearch] = useState<string>('');

  // Threshold editing state
  const [editingBarcode, setEditingBarcode] = useState<string | null>(null);
  const [tempThreshold, setTempThreshold] = useState<number>(5);
  const [updatingBarcode, setUpdatingBarcode] = useState<string | null>(null);

  // Customer Return Modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnMode, setReturnMode] = useState<'by_receipt' | 'direct_item'>('by_receipt');
  const [selectedReceiptNo, setSelectedReceiptNo] = useState<number | ''>('');
  const [receiptReturnQtyMap, setReceiptReturnQtyMap] = useState<Record<string, number>>({});
  const [directReturnSearch, setDirectReturnSearch] = useState('');
  const [directReturnBarcode, setDirectReturnBarcode] = useState('');
  const [directReturnQty, setDirectReturnQty] = useState<number>(1);
  const [returnRestockToShelf, setReturnRestockToShelf] = useState<boolean>(true);
  const [returnRefundMethod, setReturnRefundMethod] = useState<'cash' | 'card' | 'credit_ledger'>('cash');
  const [returnCustomerName, setReturnCustomerName] = useState<string>('');
  const [returnReason, setReturnReason] = useState<string>('تبديل / تغيير رأي الزبون');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);

  const resolveItemImage = (barcode: string, category: string) => {
    const matched = products.find((p) => p.barcode === barcode);
    if (matched?.imageUrl) return matched.imageUrl;
    return CATEGORY_FALLBACK_IMAGES[category] || '/assets/images/white_basmati_rice.jpg';
  };

  const loadData = async (signal?: AbortSignal, silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const [invResult, salesResult, returnsResult] = await Promise.allSettled([
        fetchWithRetry(`/api/store/inventory/${storeId}`, { signal, retries: silent ? 1 : 3 }),
        fetchWithRetry(`/api/store/pos-sales/${storeId}`, { signal, retries: silent ? 1 : 3 }),
        fetchWithRetry(`/api/store/pos-returns/${storeId}`, { signal, retries: silent ? 1 : 3 })
      ]);

      if (signal?.aborted) return;

      let hadFailure = false;
      let updatedAny = false;

      if (invResult.status === 'fulfilled' && invResult.value.ok) {
        const invData = await invResult.value.json();
        if (invData.success) {
          setInventory(invData.data || []);
          updatedAny = true;
        }
      } else if (
        invResult.status === 'rejected' &&
        (invResult.reason as any)?.name !== 'AbortError'
      ) {
        hadFailure = true;
      }

      if (salesResult.status === 'fulfilled' && salesResult.value.ok) {
        const salesData = await salesResult.value.json();
        if (salesData.success) {
          setSalesHistory(salesData.data || []);
          updatedAny = true;
        }
      } else if (
        salesResult.status === 'rejected' &&
        (salesResult.reason as any)?.name !== 'AbortError'
      ) {
        hadFailure = true;
      }

      if (returnsResult.status === 'fulfilled' && returnsResult.value.ok) {
        const retData = await returnsResult.value.json();
        if (retData.success) {
          setPosReturns(retData.data || []);
          updatedAny = true;
        }
      }

      if (updatedAny) {
        setLastSyncedAt(new Date());
      }

      if (!silent && hadFailure && inventory.length === 0) {
        setFeedbackBanner({
          type: 'error',
          message: isAr
            ? 'تعذر الاتصال المؤقت بالخادم، اضغط تحديث لإعادة المحاولة.'
            : 'Temporary connection issue. Tap refresh to retry.'
        });
      }
    } catch (err: any) {
      if (!silent && err?.name !== 'AbortError' && !signal?.aborted) {
        setFeedbackBanner({
          type: 'error',
          message: isAr
            ? 'تعذر تحميل بيانات الكاشير حالياً.'
            : 'Failed to load POS data.'
        });
      }
    } finally {
      if (!signal?.aborted && !silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal, false);

    // Live background sync every 10s for real-time shift sales & order monitoring
    const pollInterval = setInterval(() => {
      if (!controller.signal.aborted) {
        loadData(controller.signal, true);
      }
    }, 10000);

    return () => {
      clearInterval(pollInterval);
      controller.abort();
    };
  }, []);

  const lowStockItems = useMemo(
    () => inventory.filter((i) => i.isLowStock || i.stockQuantity <= i.reorderLevel),
    [inventory]
  );
  const nearExpiryItems = useMemo(
    () => inventory.filter((i) => i.isNearExpiry),
    [inventory]
  );

  // Build dynamic category cards for POS (each with a matching category product thumbnail)
  const categoryCards = useMemo(() => {
    const map = new Map<string, { total: number; lowCount: number; imageUrl: string }>();
    for (const item of inventory) {
      const prev = map.get(item.category) || {
        total: 0,
        lowCount: 0,
        imageUrl: resolveItemImage(item.barcode, item.category)
      };
      prev.total += 1;
      if (item.stockQuantity <= item.reorderLevel || item.isLowStock) {
        prev.lowCount += 1;
      }
      map.set(item.category, prev);
    }
    const list = [
      {
        key: 'الكل',
        labelAr: 'جميع الأصناف',
        labelEn: 'All Items',
        count: inventory.length,
        lowCount: lowStockItems.length,
        imageUrl: '/assets/images/white_canned_goods.jpg'
      }
    ];
    for (const [cat, stats] of map.entries()) {
      list.push({
        key: cat,
        labelAr: cat,
        labelEn: getLocalizedText(cat, 'en'),
        count: stats.total,
        lowCount: stats.lowCount,
        imageUrl: stats.imageUrl
      });
    }
    return list;
  }, [inventory, lowStockItems.length, products]);

  const filteredPOSInventory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return inventory.filter((item) => {
      const matchesCat = selectedCategory === 'الكل' || item.category === selectedCategory;
      const matchesSearch =
        !q ||
        item.productName.toLowerCase().includes(q) ||
        item.barcode.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [inventory, selectedCategory, searchQuery]);

  // Add item to POS receipt
  const handleAddToPOS = (item: any) => {
    if (item.stockQuantity <= 0) return;
    setPosCart((prev) => {
      const existing = prev.find((p) => p.barcode === item.barcode);
      if (existing) {
        if (existing.qty >= item.stockQuantity) return prev;
        return prev.map((p) =>
          p.barcode === item.barcode ? { ...p, qty: p.qty + 1 } : p
        );
      }
      return [
        ...prev,
        {
          barcode: item.barcode,
          name: item.productName,
          price: item.retailSellingPriceIQD,
          costPrice: item.costPriceIQD || Math.round(item.retailSellingPriceIQD * 0.85),
          qty: 1,
          maxStock: item.stockQuantity,
          imageUrl: resolveItemImage(item.barcode, item.category)
        }
      ];
    });
  };

  const handleUpdateQty = (barcode: string, delta: number) => {
    setPosCart((prev) =>
      prev
        .map((line) => {
          if (line.barcode !== barcode) return line;
          const nextQty = Math.min(line.maxStock, line.qty + delta);
          return nextQty <= 0 ? null : { ...line, qty: nextQty };
        })
        .filter(Boolean) as POSCartLine[]
    );
  };

  const handleSaveLineNote = (barcode: string) => {
    setPosCart((prev) =>
      prev.map((line) =>
        line.barcode === barcode ? { ...line, note: tempNote.trim() || undefined } : line
      )
    );
    setEditingNoteBarcode(null);
    setTempNote('');
  };

  const handleChangeViewMode = (mode: 'mini' | 'grid' | 'large' | 'list') => {
    setProductViewMode(mode);
    try {
      localStorage.setItem('pos_product_view_mode', mode);
    } catch {
      // ignore storage error
    }
  };

  const scrollCategorySlider = (direction: 'prev' | 'next') => {
    const el = categorySliderRef.current;
    if (!el) return;
    const step = 180;
    const offset = isAr
      ? direction === 'next'
        ? -step
        : step
      : direction === 'next'
      ? step
      : -step;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const stopScannerCamera = () => {
    if (scannerIntervalRef.current) {
      clearInterval(scannerIntervalRef.current);
      scannerIntervalRef.current = null;
    }
    if (scannerStreamRef.current) {
      scannerStreamRef.current.getTracks().forEach((t) => t.stop());
      scannerStreamRef.current = null;
    }
    setScannerCameraActive(false);
  };

  useEffect(() => {
    if (!isScannerOpen) {
      stopScannerCamera();
      setScannerCode('');
      setScannerCameraError(null);
      setScannerFeedback(null);
    }
    return () => stopScannerCamera();
  }, [isScannerOpen]);

  const processScannedBarcode = (rawCode: string) => {
    const q = rawCode.trim().toLowerCase();
    if (!q) return;

    const matchedInv =
      inventory.find((i) => i.barcode.toLowerCase() === q) ||
      inventory.find((i) => i.barcode.toLowerCase().includes(q));

    if (matchedInv) {
      if (matchedInv.stockQuantity <= 0) {
        setScannerFeedback({
          type: 'warning',
          text: isCashierMode
            ? isAr
              ? `الصنف "${matchedInv.productName}" نفد من الرف — يرجى إبلاغ الإدارة لتعويض الكمية.`
              : `"${matchedInv.productName}" is out of stock — please notify management.`
            : isAr
            ? `الصنف "${matchedInv.productName}" نفد من الرف — يمكنك طلبه من موردي الجملة.`
            : `"${matchedInv.productName}" is out of stock — order from wholesale suppliers.`,
          reorderBarcode: isCashierMode ? undefined : matchedInv.barcode
        });
        return;
      }
      handleAddToPOS(matchedInv);
      setScannerCode('');
      setScannerFeedback({
        type: 'success',
        text: isAr
          ? `تمت إضافة "${matchedInv.productName}" (${formatCurrency(
              matchedInv.retailSellingPriceIQD,
              currency,
              language
            )}) إلى الفاتورة.`
          : `Added "${matchedInv.productName}" (${formatCurrency(
              matchedInv.retailSellingPriceIQD,
              currency,
              language
            )}) to receipt.`
      });
      if (!continuousScan) {
        setTimeout(() => setIsScannerOpen(false), 450);
      }
      return;
    }

    const matchedPlatformProd = products.find(
      (p) => p.barcode.toLowerCase() === q || p.barcode.toLowerCase().includes(q)
    );
    if (matchedPlatformProd) {
      setScannerFeedback({
        type: 'warning',
        text: isCashierMode
          ? isAr
            ? `المنتج "${matchedPlatformProd.nameAr}" غير متوفر حالياً في قائمة مبيعات الكاشير.`
            : `"${matchedPlatformProd.nameEn || matchedPlatformProd.nameAr}" is not in active store POS stock.`
          : isAr
          ? `المنتج "${matchedPlatformProd.nameAr}" موجود بالمنصة ولكن غير مضاف لمخزون محلك حالياً.`
          : `"${matchedPlatformProd.nameEn || matchedPlatformProd.nameAr}" exists on the platform but not in store shelf inventory.`,
        reorderBarcode: isCashierMode ? undefined : matchedPlatformProd.barcode
      });
      return;
    }

    setScannerFeedback({
      type: 'error',
      text: isAr
        ? `لم يتم العثور على صنف مطابق للباركود (${rawCode.trim()}).`
        : `No matching item found for barcode (${rawCode.trim()}).`
    });
  };

  const startScannerCamera = async () => {
    setScannerCameraError(null);
    setScannerFeedback(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setScannerCameraError(
          isAr
            ? 'المتصفح الحالي لا يدعم الكاميرا المباشرة — استخدم الإدخال اليدوي أو أزرار المسح السريع بالأسفل.'
            : 'Camera API unavailable in this browser — use manual entry or quick tap barcodes below.'
        );
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      scannerStreamRef.current = stream;
      setScannerCameraActive(true);
      setTimeout(() => {
        if (scannerVideoRef.current) {
          scannerVideoRef.current.srcObject = stream;
          scannerVideoRef.current.play().catch(() => {});
        }
      }, 60);

      if ('BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'qr_code', 'code_128', 'upc_a', 'upc_e']
          });
          if (scannerIntervalRef.current) clearInterval(scannerIntervalRef.current);
          scannerIntervalRef.current = setInterval(async () => {
            if (!scannerVideoRef.current || !scannerStreamRef.current) return;
            try {
              const detected = await detector.detect(scannerVideoRef.current);
              if (detected && detected.length > 0 && detected[0].rawValue) {
                const codeVal = detected[0].rawValue;
                processScannedBarcode(codeVal);
                if (!continuousScan) {
                  stopScannerCamera();
                }
              }
            } catch {
              // ignore frame read error
            }
          }, 550);
        } catch {
          // BarcodeDetector unavailable for specified formats
        }
      } else {
        setScannerCameraError(
          isAr
            ? 'الكاميرا تعمل ولكن التعرف التلقائي للباركود غير مدعوم في هذا المتصفح — يمكنك كتابة الرقم أو اختيار الصنف أدناه.'
            : 'Camera is active, but auto BarcodeDetector is unsupported in this browser — type the code or tap an item below.'
        );
      }
    } catch {
      setScannerCameraError(
        isAr
          ? 'تعذر فتح الكاميرا (تأكد من منح صلاحية الكاميرا) — يمكنك إدخال الباركود يدوياً أو الضغط على باركود الأصناف بالأسفل.'
          : 'Could not access camera — enter barcode manually or tap quick-scan items below.'
      );
    }
  };

  // Barcode Enter-to-add shortcut (works for USB/Bluetooth scanners or manual Enter)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const exactMatch =
        inventory.find((i) => i.barcode.toLowerCase() === q) ||
        (filteredPOSInventory.length === 1 ? filteredPOSInventory[0] : null);
      if (exactMatch && exactMatch.stockQuantity > 0) {
        handleAddToPOS(exactMatch);
        setSearchQuery('');
      } else if (exactMatch && exactMatch.stockQuantity <= 0) {
        setFeedbackBanner({
          type: 'error',
          message: isCashierMode
            ? isAr
              ? `الصنف "${exactMatch.productName}" نفد من الرف — يرجى إبلاغ الإدارة.`
              : `"${exactMatch.productName}" is out of stock.`
            : isAr
            ? `الصنف "${exactMatch.productName}" نفد من الرف — يمكنك طلبه من منصة الجملة.`
            : `"${exactMatch.productName}" is out of stock.`
        });
      }
    }
  };

  // Totals calculation
  const subtotalIQD = useMemo(
    () => posCart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [posCart]
  );
  const discountIQD = useMemo(
    () => Math.round((subtotalIQD * discountPercent) / 100),
    [subtotalIQD, discountPercent]
  );
  const totalIQD = Math.max(0, subtotalIQD - discountIQD);
  const estimatedCostIQD = useMemo(
    () => posCart.reduce((sum, item) => sum + item.costPrice * item.qty, 0),
    [posCart]
  );
  const estimatedProfitIQD = Math.max(0, totalIQD - estimatedCostIQD);

  const nextReceiptNumber = useMemo(() => {
    const maxNum = salesHistory.reduce((m, s) => Math.max(m, s.receiptNumber || 27361), 27361);
    return maxNum + 1;
  }, [salesHistory]);

  // Checkout POS Cashier
  const handlePOSCheckout = async () => {
    if (posCart.length === 0 || isCheckingOut) return;
    setIsCheckingOut(true);

    try {
      const res = await fetch('/api/store/pos-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          items: posCart.map((i) => ({
            barcode: i.barcode,
            quantity: i.qty,
            unitPriceIQD: i.price,
            note: i.note
          })),
          subtotalIQD,
          discountIQD,
          totalIQD,
          orderMode,
          customerName: customerName.trim() || (isAr ? 'زبون نقدي' : 'Walk-in Customer'),
          paymentType
        })
      });

      const data = await res.json();
      if (data.success) {
        const receiptNo = data.data?.receiptNumber || nextReceiptNumber;
        const triggered = data.data?.triggeredLowStockAlerts || [];
        setFeedbackBanner({
          type: 'success',
          message: isAr
            ? `تم إصدار الفاتورة #${receiptNo} بقيمة ${formatCurrency(totalIQD, currency, language)} وخصم المخزون تلقائياً.`
            : `Receipt #${receiptNo} completed (${formatCurrency(totalIQD, currency, language)}) and inventory updated.`,
          triggeredAlerts: triggered
        });
        setPosCart([]);
        setCustomerName('');
        setDiscountPercent(0);
        await loadData();
        if (onRefreshLowStockAlerts) onRefreshLowStockAlerts();
      } else {
        setFeedbackBanner({
          type: 'error',
          message: data.message || (isAr ? 'تعذر إتمام عملية البيع' : 'Failed to complete sale')
        });
      }
    } catch (err: any) {
      setFeedbackBanner({
        type: 'error',
        message: err?.message || (isAr ? 'حدث خطأ في الاتصال بالخادم' : 'Network error')
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Track previously returned quantities per receipt & barcode
  const returnedQtyByReceipt = useMemo(() => {
    const map: Record<number, Record<string, number>> = {};
    for (const ret of posReturns) {
      if (!ret.originalReceiptNumber) continue;
      if (!map[ret.originalReceiptNumber]) {
        map[ret.originalReceiptNumber] = {};
      }
      for (const it of ret.items) {
        map[ret.originalReceiptNumber][it.barcode] =
          (map[ret.originalReceiptNumber][it.barcode] || 0) + it.quantity;
      }
    }
    return map;
  }, [posReturns]);

  const getReceiptReturnStatus = (sale: POSSaleRecord): 'none' | 'partial' | 'full' => {
    const retMap = returnedQtyByReceipt[sale.receiptNumber];
    if (!retMap) return 'none';
    let anyReturned = false;
    let allReturned = sale.items.length > 0;
    for (const it of sale.items) {
      const retQty = retMap[it.barcode] || 0;
      if (retQty > 0) anyReturned = true;
      if (retQty < it.quantity) allReturned = false;
    }
    if (!anyReturned) return 'none';
    return allReturned ? 'full' : 'partial';
  };

  const openReturnModal = (prefillReceipt?: POSSaleRecord) => {
    setReturnError(null);
    setReturnRestockToShelf(true);
    setReturnReason(isAr ? 'تبديل / تغيير رأي الزبون' : 'Customer changed mind / exchange');
    setDirectReturnSearch('');
    setDirectReturnQty(1);

    if (prefillReceipt) {
      setReturnMode('by_receipt');
      setSelectedReceiptNo(prefillReceipt.receiptNumber);
      setReturnCustomerName(prefillReceipt.customerName || '');
      setReturnRefundMethod(prefillReceipt.paymentType || 'cash');
      const retMap = returnedQtyByReceipt[prefillReceipt.receiptNumber] || {};
      const initQtys: Record<string, number> = {};
      let firstPicked = false;
      for (const it of prefillReceipt.items) {
        const remaining = Math.max(0, it.quantity - (retMap[it.barcode] || 0));
        if (!firstPicked && remaining > 0) {
          initQtys[it.barcode] = 1;
          firstPicked = true;
        } else {
          initQtys[it.barcode] = 0;
        }
      }
      setReceiptReturnQtyMap(initQtys);
    } else if (salesHistory.length > 0) {
      const firstReturnable =
        salesHistory.find((s) => getReceiptReturnStatus(s) !== 'full') || salesHistory[0];
      setReturnMode('by_receipt');
      setSelectedReceiptNo(firstReturnable.receiptNumber);
      setReturnCustomerName(firstReturnable.customerName || '');
      setReturnRefundMethod(firstReturnable.paymentType || 'cash');
      const retMap = returnedQtyByReceipt[firstReturnable.receiptNumber] || {};
      const initQtys: Record<string, number> = {};
      let firstPicked = false;
      for (const it of firstReturnable.items) {
        const remaining = Math.max(0, it.quantity - (retMap[it.barcode] || 0));
        if (!firstPicked && remaining > 0) {
          initQtys[it.barcode] = 1;
          firstPicked = true;
        } else {
          initQtys[it.barcode] = 0;
        }
      }
      setReceiptReturnQtyMap(initQtys);
    } else {
      setReturnMode('direct_item');
      setSelectedReceiptNo('');
      setReceiptReturnQtyMap({});
      setReturnCustomerName('');
      setReturnRefundMethod('cash');
    }

    if (inventory.length > 0 && !directReturnBarcode) {
      setDirectReturnBarcode(inventory[0].barcode);
    }

    setIsReturnModalOpen(true);
  };

  const handleSelectReturnReceipt = (receiptNoVal: number) => {
    setReturnError(null);
    setSelectedReceiptNo(receiptNoVal);
    const matched = salesHistory.find((s) => s.receiptNumber === receiptNoVal);
    if (!matched) {
      setReceiptReturnQtyMap({});
      return;
    }
    setReturnCustomerName(matched.customerName || '');
    setReturnRefundMethod(matched.paymentType || 'cash');
    const retMap = returnedQtyByReceipt[matched.receiptNumber] || {};
    const initQtys: Record<string, number> = {};
    let firstPicked = false;
    for (const it of matched.items) {
      const remaining = Math.max(0, it.quantity - (retMap[it.barcode] || 0));
      if (!firstPicked && remaining > 0) {
        initQtys[it.barcode] = 1;
        firstPicked = true;
      } else {
        initQtys[it.barcode] = 0;
      }
    }
    setReceiptReturnQtyMap(initQtys);
  };

  const selectedReceiptObj = useMemo(
    () =>
      selectedReceiptNo !== ''
        ? salesHistory.find((s) => s.receiptNumber === Number(selectedReceiptNo)) || null
        : null,
    [salesHistory, selectedReceiptNo]
  );

  const selectedReceiptLines = useMemo(() => {
    if (!selectedReceiptObj) return [];
    const retMap = returnedQtyByReceipt[selectedReceiptObj.receiptNumber] || {};
    const discountRatio =
      selectedReceiptObj.subtotalIQD > 0
        ? Math.max(0, Math.min(1, selectedReceiptObj.totalIQD / selectedReceiptObj.subtotalIQD))
        : 1;
    return selectedReceiptObj.items.map((it) => {
      const alreadyReturned = retMap[it.barcode] || 0;
      const maxReturnable = Math.max(0, it.quantity - alreadyReturned);
      const effectiveUnitIQD = Math.round(it.unitPriceIQD * discountRatio);
      return {
        ...it,
        alreadyReturned,
        maxReturnable,
        effectiveUnitIQD,
        selectedQty: Math.min(maxReturnable, receiptReturnQtyMap[it.barcode] || 0)
      };
    });
  }, [selectedReceiptObj, returnedQtyByReceipt, receiptReturnQtyMap]);

  const filteredDirectReturnInventory = useMemo(() => {
    const q = directReturnSearch.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter(
      (i) =>
        i.productName.toLowerCase().includes(q) ||
        i.barcode.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
    );
  }, [inventory, directReturnSearch]);

  const selectedDirectItem = useMemo(
    () => inventory.find((i) => i.barcode === directReturnBarcode) || filteredDirectReturnInventory[0] || null,
    [inventory, directReturnBarcode, filteredDirectReturnInventory]
  );

  const returnPayloadSummary = useMemo(() => {
    if (returnMode === 'by_receipt') {
      const activeItems = selectedReceiptLines
        .filter((l) => l.selectedQty > 0)
        .map((l) => ({
          barcode: l.barcode,
          productName: l.productName,
          quantity: l.selectedQty,
          unitPriceIQD: l.effectiveUnitIQD,
          restockToShelf: returnRestockToShelf
        }));
      const totalRefundIQD = activeItems.reduce(
        (sum, it) => sum + it.quantity * it.unitPriceIQD,
        0
      );
      const totalUnits = activeItems.reduce((sum, it) => sum + it.quantity, 0);
      return { items: activeItems, totalRefundIQD, totalUnits };
    }

    if (!selectedDirectItem || directReturnQty <= 0) {
      return { items: [], totalRefundIQD: 0, totalUnits: 0 };
    }
    const qty = Math.max(1, Math.floor(directReturnQty));
    const item = {
      barcode: selectedDirectItem.barcode,
      productName: selectedDirectItem.productName,
      quantity: qty,
      unitPriceIQD: selectedDirectItem.retailSellingPriceIQD,
      restockToShelf: returnRestockToShelf
    };
    return {
      items: [item],
      totalRefundIQD: item.unitPriceIQD * qty,
      totalUnits: qty
    };
  }, [
    returnMode,
    selectedReceiptLines,
    selectedDirectItem,
    directReturnQty,
    returnRestockToShelf
  ]);

  const handleSubmitPOSReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingReturn || returnPayloadSummary.items.length === 0) return;

    setReturnError(null);
    setIsSubmittingReturn(true);

    try {
      const res = await fetch('/api/store/pos-return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          originalReceiptNumber:
            returnMode === 'by_receipt' && selectedReceiptObj
              ? selectedReceiptObj.receiptNumber
              : undefined,
          customerName:
            returnCustomerName.trim() ||
            (returnMode === 'by_receipt' && selectedReceiptObj?.customerName) ||
            (isAr ? 'زبون نقدي' : 'Walk-in Customer'),
          refundMethod: returnRefundMethod,
          reason: returnReason.trim() || (isAr ? 'استرجاع منتج عند الكاشير' : 'POS Customer Return'),
          processedBy: cashierName || (isAr ? 'أمين الصندوق' : 'Cashier'),
          items: returnPayloadSummary.items
        })
      });

      const data = await res.json();
      if (data.success) {
        const retNo = data.data?.returnNumber || '5001';
        const restocked = data.data?.restockedUnitsCount || 0;
        const refunded = data.data?.totalRefundIQD ?? returnPayloadSummary.totalRefundIQD;

        setIsReturnModalOpen(false);
        setFeedbackBanner({
          type: 'success',
          message: isAr
            ? restocked > 0
              ? `تم تسجيل المرتجع #${retNo} وإرجاع ${formatCurrency(refunded, currency, language)} للزبون — وأُعيدت ${restocked} وحدة إلى مخزون المحل تلقائياً.`
              : `تم تسجيل المرتجع التالف #${retNo} بقيمة ${formatCurrency(refunded, currency, language)} (بدون إضافة لرصيد الرف الصالح).`
            : restocked > 0
            ? `Return #${retNo} recorded (${formatCurrency(refunded, currency, language)}) — ${restocked} unit(s) restocked to shelf.`
            : `Damaged return #${retNo} recorded (${formatCurrency(refunded, currency, language)}).`
        });

        await loadData();
        if (onRefreshLowStockAlerts) onRefreshLowStockAlerts();
      } else {
        setReturnError(data.message || (isAr ? 'تعذر تسجيل المرتجع' : 'Failed to process return'));
      }
    } catch (err: any) {
      setReturnError(err?.message || (isAr ? 'تعذر الاتصال بالخادم' : 'Network error'));
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // Save new custom threshold
  const handleSaveThreshold = async (barcode: string) => {
    setUpdatingBarcode(barcode);
    try {
      const res = await fetch(`/api/store/inventory/${storeId}/threshold`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode,
          reorderLevel: tempThreshold
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackBanner({
          type: 'success',
          message: isAr
            ? `تم تحديث حد تنبيه المخزون بنجاح إلى ${tempThreshold} وحدة.`
            : `Reorder threshold updated to ${tempThreshold} units.`
        });
        setEditingBarcode(null);
        await loadData();
        if (onRefreshLowStockAlerts) onRefreshLowStockAlerts();
      }
    } catch (err: any) {
      setFeedbackBanner({ type: 'error', message: err?.message || 'Error updating threshold' });
    } finally {
      setUpdatingBarcode(null);
    }
  };

  // Simulate stock drop
  const handleSimulateDrop = async (barcode: string, amount: number) => {
    setUpdatingBarcode(barcode);
    try {
      const res = await fetch(`/api/store/inventory/${storeId}/simulate-drop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode, amount })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackBanner({
          type: 'success',
          message: isAr
            ? `تمت محاكاة بيع ${amount} وحدات — الكمية الحالية: ${data.data.stockQuantity}`
            : `Simulated selling ${amount} units — Remaining: ${data.data.stockQuantity}`
        });
        await loadData();
        if (onRefreshLowStockAlerts) onRefreshLowStockAlerts();
      }
    } catch (err: any) {
      setFeedbackBanner({ type: 'error', message: err?.message || 'Error simulating drop' });
    } finally {
      setUpdatingBarcode(null);
    }
  };

  const triggerWholesaleReorder = (barcode: string) => {
    if (isCashierMode) return;
    const matchedProduct = products.find((p) => p.barcode === barcode);
    if (matchedProduct) {
      onOpenProductComparison(matchedProduct);
    } else {
      onQuickReorder(barcode);
    }
  };

  // ================= ANALYTICS & CHART DATA =================
  const analyticsStats = useMemo(() => {
    const grossRevenueIQD = salesHistory.reduce((s, r) => s + r.totalIQD, 0);
    const grossProfitIQD = salesHistory.reduce((s, r) => s + r.profitIQD, 0);
    const totalReturnsIQD = posReturns.reduce((s, r) => s + r.totalRefundIQD, 0);
    const totalReturnProfitAdj = posReturns.reduce((s, r) => s + (r.profitAdjustmentIQD || 0), 0);
    const totalRevenueIQD = Math.max(0, grossRevenueIQD - totalReturnsIQD);
    const totalProfitIQD = Math.max(0, grossProfitIQD - totalReturnProfitAdj);
    const totalOrdersCount = salesHistory.length;
    const totalReturnsCount = posReturns.length;
    const totalRestockedUnits = posReturns.reduce(
      (sum, ret) =>
        sum +
        ret.items
          .filter((it) => it.restockToShelf)
          .reduce((s, it) => s + it.quantity, 0),
      0
    );
    const healthySKUs = inventory.filter(
      (i) => i.stockQuantity > i.reorderLevel && !i.isNearExpiry
    ).length;
    const healthScore =
      inventory.length > 0 ? Math.round((healthySKUs / inventory.length) * 100) : 100;

    return {
      grossRevenueIQD,
      totalReturnsIQD,
      totalRevenueIQD,
      totalProfitIQD,
      totalOrdersCount,
      totalReturnsCount,
      totalRestockedUnits,
      healthScore
    };
  }, [salesHistory, posReturns, inventory]);

  const shiftLiveMetrics = useMemo(() => {
    let cashSalesIQD = 0;
    let nonCashSalesIQD = 0;
    let inStoreCount = 0;
    let takeAwayCount = 0;
    let onlineCount = 0;
    let latestSale: POSSaleRecord | null = null;

    for (const sale of salesHistory) {
      if (sale.paymentType === 'cash') {
        cashSalesIQD += sale.totalIQD;
      } else {
        nonCashSalesIQD += sale.totalIQD;
      }
      if (sale.orderMode === 'online_order') {
        onlineCount += 1;
      } else if (sale.orderMode === 'take_away') {
        takeAwayCount += 1;
      } else {
        inStoreCount += 1;
      }
      if (!latestSale || (sale.receiptNumber || 0) > (latestSale.receiptNumber || 0)) {
        latestSale = sale;
      }
    }

    const avgOrderIQD =
      analyticsStats.totalOrdersCount > 0
        ? Math.round(analyticsStats.totalRevenueIQD / analyticsStats.totalOrdersCount)
        : 0;

    return {
      cashSalesIQD,
      nonCashSalesIQD,
      inStoreCount,
      takeAwayCount,
      onlineCount,
      avgOrderIQD,
      latestSale
    };
  }, [salesHistory, analyticsStats.totalOrdersCount, analyticsStats.totalRevenueIQD]);

  const chartSeries = useMemo(() => {
    const liveInStore = salesHistory
      .filter((s) => s.orderMode !== 'online_order')
      .reduce((sum, s) => sum + s.totalIQD, 0);
    const liveOnline = salesHistory
      .filter((s) => s.orderMode === 'online_order')
      .reduce((sum, s) => sum + s.totalIQD, 0);

    if (chartTimeframe === 'day') {
      return [
        { label: '9 ص', direct: 117000, online: 65000, profit: 24000 },
        { label: '11 ص', direct: 192000, online: 146000, profit: 44000 },
        { label: '1 م', direct: 265000, online: 185000, profit: 58000 },
        { label: '3 م', direct: 220000, online: 210000, profit: 55000 },
        {
          label: isAr ? 'الآن' : 'Now',
          direct: Math.max(180000, Math.round(liveInStore * 0.7)),
          online: Math.max(140000, liveOnline),
          profit: Math.max(35000, analyticsStats.totalProfitIQD)
        }
      ];
    }
    if (chartTimeframe === 'week') {
      return [
        { label: isAr ? 'السبت' : 'Sat', direct: 620000, online: 240000, profit: 112000 },
        { label: isAr ? 'الأحد' : 'Sun', direct: 580000, online: 215000, profit: 105000 },
        { label: isAr ? 'الإثنين' : 'Mon', direct: 710000, online: 280000, profit: 130000 },
        { label: isAr ? 'الثلاثاء' : 'Tue', direct: 690000, online: 310000, profit: 134000 },
        { label: isAr ? 'اليوم' : 'Today', direct: liveInStore + 250000, online: liveOnline + 110000, profit: analyticsStats.totalProfitIQD + 45000 }
      ];
    }
    return [
      { label: isAr ? 'أسبوع 1' : 'W1', direct: 3400000, online: 1250000, profit: 610000 },
      { label: isAr ? 'أسبوع 2' : 'W2', direct: 3950000, online: 1480000, profit: 720000 },
      { label: isAr ? 'أسبوع 3' : 'W3', direct: 4200000, online: 1620000, profit: 785000 },
      { label: isAr ? 'الحالي' : 'Curr', direct: 3800000 + liveInStore, online: 1500000 + liveOnline, profit: 710000 + analyticsStats.totalProfitIQD }
    ];
  }, [chartTimeframe, salesHistory, analyticsStats.totalProfitIQD, isAr]);

  const chartSvgGeometry = useMemo(() => {
    const width = 560;
    const height = 180;
    const padX = 24;
    const padY = 18;
    const maxVal = Math.max(
      ...chartSeries.flatMap((d) => (isCashierMode ? [d.direct, d.online] : [d.direct, d.online, d.profit])),
      100000
    );

    const buildPath = (key: 'direct' | 'online' | 'profit') => {
      const pts = chartSeries.map((d, idx) => {
        const x =
          padX +
          (idx * (width - padX * 2)) / Math.max(1, chartSeries.length - 1);
        const y =
          height - padY - ((d[key] / maxVal) * (height - padY * 2));
        return { x, y, val: d[key] };
      });
      const dStr = pts
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(' ');
      return { pts, dStr };
    };

    return {
      width,
      height,
      direct: buildPath('direct'),
      online: buildPath('online'),
      profit: buildPath('profit')
    };
  }, [chartSeries, isCashierMode]);

  const filteredSalesHistory = useMemo(() => {
    const q = reportSearch.trim().toLowerCase();
    return salesHistory.filter((sale) => {
      const matchesMode = txFilterMode === 'all' || sale.orderMode === txFilterMode;
      const matchesSearch =
        !q ||
        sale.customerName.toLowerCase().includes(q) ||
        String(sale.receiptNumber).includes(q) ||
        sale.items.some((it) => it.productName.toLowerCase().includes(q));
      return matchesMode && matchesSearch;
    });
  }, [salesHistory, txFilterMode, reportSearch]);

  const filteredReportInventory = useMemo(() => {
    const q = reportSearch.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter(
      (i) =>
        i.productName.toLowerCase().includes(q) ||
        i.barcode.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
    );
  }, [inventory, reportSearch]);

  const filteredPOSReturns = useMemo(() => {
    const q = reportSearch.trim().toLowerCase();
    if (!q) return posReturns;
    return posReturns.filter(
      (ret) =>
        ret.customerName.toLowerCase().includes(q) ||
        String(ret.returnNumber).includes(q) ||
        (ret.originalReceiptNumber && String(ret.originalReceiptNumber).includes(q)) ||
        ret.reason.toLowerCase().includes(q) ||
        ret.items.some((it) => it.productName.toLowerCase().includes(q))
    );
  }, [posReturns, reportSearch]);

  const todayDisplay = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(isAr ? 'ar-IQ' : 'en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      }).format(new Date());
    } catch {
      return isAr ? 'اليوم' : 'Today';
    }
  }, [isAr]);

  const displayStoreName = storeName || (isAr ? 'كاشير سوبرماركت المنصور' : 'Al-Mansoor Store POS');
  const displayCashierName = cashierName || (isAr ? 'عمار خضير' : 'Ammar Al-Douri');

  return (
    <div className="bg-[#F4F4EA] rounded-3xl border border-[#E2E6D7] p-3 sm:p-5 space-y-4 font-brand text-[#142018]">
      {/* ================= TOP WORKSPACE HEADER (Screenshot 2 & 4 Layout) ================= */}
      <header className="flex flex-wrap items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#0B5D32] text-white flex items-center justify-center shadow-2xs shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-[#0B5D32] leading-tight truncate">
                {displayStoreName}
              </h1>
              <span className="text-[11px] font-semibold text-[#4B6352] whitespace-nowrap">
                {todayDisplay}
              </span>
            </div>
            <p className="text-[11px] text-[#5F7164] truncate">
              {isCashierMode
                ? isAr
                  ? 'نقطة البيع المباشر للزبائن (صلاحية أمين الصندوق — أسعار الشراء والائتمان محجوبة)'
                  : 'POS cashier sales only (wholesale costs, profits & credit hidden)'
                : isAr
                ? 'نقطة البيع المرتبطة تلقائياً بمخزون المتجر وطلبات دليل الخيرات'
                : 'POS cashier synced live with shelf inventory & wholesale supplier restock'}
            </p>
          </div>
        </div>

        {/* Top Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="hidden sm:inline-block text-xs font-bold text-[#3D5244] px-2 whitespace-nowrap tabular-nums">
            {isAr
              ? `إجمالي الفواتير: ${salesHistory.length}`
              : `Total: ${salesHistory.length} Orders`}
          </span>

          {/* Quick Customer Return Button in Header */}
          <button
            type="button"
            onClick={() => openReturnModal()}
            className="px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 transition cursor-pointer whitespace-nowrap shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
            <span>{isAr ? 'مرتجع زبون' : 'Return Item'}</span>
            {posReturns.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-black tabular-nums leading-none">
                {posReturns.length}
              </span>
            )}
          </button>

          {/* Toggle POS Terminal vs Report & Analytics */}
          <button
            type="button"
            onClick={() =>
              setActiveSubView((prev) => (prev === 'pos' ? 'report' : 'pos'))
            }
            className={`px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer whitespace-nowrap ${
              activeSubView === 'report'
                ? 'bg-[#0B5D32] text-white border-[#0B5D32] shadow-xs'
                : 'bg-white text-[#142018] border-[#DCE5DC] hover:border-[#0B5D32]'
            }`}
          >
            {activeSubView === 'report' ? (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{isAr ? 'العودة للكاشير' : 'POS Terminal'}</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-[#0B5D32]" />
                <span>{isAr ? 'التقرير والمخزون' : 'Report'}</span>
              </>
            )}
          </button>

          {/* Low-Stock Alert Bell */}
          <button
            type="button"
            onClick={() => {
              if (onOpenLowStockModal) {
                onOpenLowStockModal();
              } else {
                setActiveSubView('report');
                setReportTab('inventory');
              }
            }}
            className="relative w-9 h-9 rounded-full bg-white border border-[#DCE5DC] hover:border-[#0B5D32] flex items-center justify-center transition cursor-pointer"
            title={isAr ? 'مركز تنبيهات نقص المخزون' : 'Low Stock Alerts Center'}
          >
            <Bell className={`w-4 h-4 ${Math.max(lowStockItems.length, lowStockAlertsCount) > 0 ? 'text-[#E11D48]' : 'text-[#3D5244]'}`} />
            {Math.max(lowStockItems.length, lowStockAlertsCount) > 0 && (
              <span className="absolute -top-1 -end-1 w-4.5 h-4.5 rounded-full bg-[#EF4444] text-white text-[10px] font-black flex items-center justify-center border border-white tabular-nums">
                {Math.max(lowStockItems.length, lowStockAlertsCount)}
              </span>
            )}
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => loadData()}
            disabled={loading}
            className="w-9 h-9 rounded-full bg-white border border-[#DCE5DC] hover:border-[#0B5D32] flex items-center justify-center text-[#3D5244] transition cursor-pointer"
            title={isAr ? 'تحديث البيانات' : 'Refresh Data'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Cashier Identity Pill */}
          <div className="hidden md:flex items-center gap-2 bg-white border border-[#DCE5DC] rounded-full ps-1.5 pe-3 py-1">
            <div className="w-7 h-7 rounded-full bg-[#0B5D32] text-white text-xs font-black flex items-center justify-center">
              {displayCashierName.charAt(0)}
            </div>
            <div className="leading-tight">
              <div className="text-[11px] font-black text-[#142018] whitespace-nowrap">
                {displayCashierName}
              </div>
              <div className="text-[9.5px] text-[#5F7164] whitespace-nowrap">
                {isAr ? 'أمين الصندوق' : 'Cashier'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ================= STORE OPERATIONS QUICK-ACCESS STRIP ================= */}
      {(onOpenLowStockModal || (!isCashierMode && (onOpenQRPoster || onOpenStoreManagement || onOpenStorefrontB2C)) || isCashierMode) && (
        <div
          aria-label={isAr ? 'أدوات إدارة المحل السريعة' : 'Quick Store Management Tools'}
          className="bg-white/90 border border-[#DCE5DC] rounded-2xl px-2.5 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-[0_1px_4px_rgba(11,93,50,0.04)]"
        >
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-black text-[#4B6352] px-2 shrink-0">
            <Store className="w-3.5 h-3.5 text-[#0B5D32]" />
            <span>{isCashierMode ? (isAr ? 'أدوات الصندوق:' : 'Cashier:') : (isAr ? 'أدوات المحل:' : 'Store Tools:')}</span>
          </span>

          <button
            type="button"
            onClick={() => openReturnModal()}
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11.5px] font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
            <span>{isAr ? 'إرجاع منتج / مرتجع' : 'Customer Return'}</span>
          </button>

          {onOpenLowStockModal && (
            <button
              type="button"
              onClick={onOpenLowStockModal}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#FDF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#991B1B] text-[11.5px] font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Bell className="w-3.5 h-3.5 text-[#E11D48]" />
              <span>{isAr ? 'تنبيهات نقص المخزون' : 'Low Stock Alerts'}</span>
              {Math.max(lowStockItems.length, lowStockAlertsCount) > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#EF4444] text-white text-[10px] font-black tabular-nums leading-none">
                  {Math.max(lowStockItems.length, lowStockAlertsCount)}
                </span>
              )}
            </button>
          )}

          {isCashierMode && (
            <div className="min-h-[38px] px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-[11.5px] font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>
                {isAr
                  ? 'صلاحية مقيدة: سوق الجملة وأسعار الشراء والائتمان محجوبة'
                  : 'Restricted Mode: Wholesale & Cost Prices Hidden'}
              </span>
            </div>
          )}

          {!isCashierMode && onOpenQRPoster && (
            <button
              type="button"
              onClick={onOpenQRPoster}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#F4F4EA] hover:bg-[#EBF4EE] border border-[#DCE5DC] hover:border-[#0B5D32]/40 text-[#142018] text-[11.5px] font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 whitespace-nowrap"
            >
              <QrCode className="w-3.5 h-3.5 text-[#0B5D32]" />
              <span>{isAr ? 'بوستر QR للزبائن' : 'Customer QR Poster'}</span>
            </button>
          )}

          {!isCashierMode && onOpenStoreManagement && (
            <button
              type="button"
              onClick={onOpenStoreManagement}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#F4F4EA] hover:bg-[#EBF4EE] border border-[#DCE5DC] hover:border-[#0B5D32]/40 text-[#142018] text-[11.5px] font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Sliders className="w-3.5 h-3.5 text-[#0B5D32]" />
              <span>{isAr ? 'إدارة المتجر والعروض' : 'Storefront Studio'}</span>
            </button>
          )}

          {!isCashierMode && onOpenStorefrontB2C && (
            <button
              type="button"
              onClick={onOpenStorefrontB2C}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white text-[11.5px] font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 whitespace-nowrap shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isAr ? 'معاينة متجر التوصيل (B2C)' : 'Preview B2C Store'}</span>
            </button>
          )}
        </div>
      )}

      {/* ================= LIVE SHIFT PERFORMANCE WIDGET ================= */}
      <section
        aria-label={isAr ? 'لوحة متابعة أداء الوردية اللحظية' : 'Real-Time Shift Performance Widget'}
        className="bg-white rounded-2xl border border-[#DCE5DC] shadow-[0_1px_4px_rgba(11,93,50,0.04)] overflow-hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-[#E8EDE8]">
          {/* KPI 1: Total Daily Sales */}
          <div className="md:col-span-5 px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#4B6352]">
                <TrendingUp className="w-3.5 h-3.5 text-[#0B5D32] shrink-0" />
                <span>{isAr ? 'إجمالي المبيعات اليومية (الوردية)' : 'Total Daily Shift Sales'}</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-[#0B5D32] leading-tight">
                {formatCurrency(analyticsStats.totalRevenueIQD, currency, language)}
              </div>
              <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-[#5F7164] font-semibold">
                <span className="tabular-nums">
                  {isAr
                    ? `نقدي: ${formatCurrency(shiftLiveMetrics.cashSalesIQD, currency, language)}`
                    : `Cash: ${formatCurrency(shiftLiveMetrics.cashSalesIQD, currency, language)}`}
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {isAr
                    ? `بطاقة / آجل: ${formatCurrency(shiftLiveMetrics.nonCashSalesIQD, currency, language)}`
                    : `Card/Credit: ${formatCurrency(shiftLiveMetrics.nonCashSalesIQD, currency, language)}`}
                </span>
                {analyticsStats.totalReturnsIQD > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-700 tabular-nums">
                      {isAr
                        ? `مرتجع: -${formatCurrency(analyticsStats.totalReturnsIQD, currency, language)}`
                        : `Returns: -${formatCurrency(analyticsStats.totalReturnsIQD, currency, language)}`}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* KPI 2: Current Orders Count */}
          <div className="md:col-span-4 px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#4B6352]">
                <ShoppingBag className="w-3.5 h-3.5 text-[#0B5D32] shrink-0" />
                <span>{isAr ? 'عدد الطلبات الحالية' : 'Current Orders Count'}</span>
              </div>
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="text-xl sm:text-2xl font-black font-mono tabular-nums text-[#142018] leading-tight">
                  {analyticsStats.totalOrdersCount}
                </span>
                <span className="text-xs font-bold text-[#5F7164]">
                  {isAr ? 'طلب مكتمل' : 'completed'}
                </span>
                {posCart.length > 0 && (
                  <span className="text-[11px] font-bold text-[#0B5D32] tabular-nums">
                    {isAr
                      ? `+ 1 طلب نشط (${posCart.reduce((s, l) => s + l.qty, 0)} صنف)`
                      : `+ 1 active (${posCart.reduce((s, l) => s + l.qty, 0)} items)`}
                  </span>
                )}
              </div>
              <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-[#5F7164] font-semibold tabular-nums">
                <span>
                  {isAr ? `مباشر: ${shiftLiveMetrics.inStoreCount}` : `In-Store: ${shiftLiveMetrics.inStoreCount}`}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {isAr ? `سفري: ${shiftLiveMetrics.takeAwayCount}` : `Takeaway: ${shiftLiveMetrics.takeAwayCount}`}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {isAr ? `أونلاين: ${shiftLiveMetrics.onlineCount}` : `Online: ${shiftLiveMetrics.onlineCount}`}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {isAr
                    ? `متوسط الفاتورة: ${formatCurrency(shiftLiveMetrics.avgOrderIQD, currency, language)}`
                    : `Avg: ${formatCurrency(shiftLiveMetrics.avgOrderIQD, currency, language)}`}
                </span>
              </div>
            </div>
          </div>

          {/* KPI 3: Live Shift Sync & Quick Drilldown */}
          <div className="md:col-span-3 px-4 py-3 bg-[#FAFCF9] flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1.5 font-bold text-[#0B5D32]">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" aria-hidden="true" />
                <span>{isAr ? 'مراقبة لحظية للوردية' : 'Live Shift Monitor'}</span>
              </span>
              <span className="text-[10.5px] font-mono tabular-nums text-[#5F7164] flex items-center gap-1" dir="ltr">
                <Clock className="w-3 h-3" />
                {lastSyncedAt.toLocaleTimeString(isAr ? 'ar-IQ' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
            </div>

            {shiftLiveMetrics.latestSale ? (
              <div className="text-[11px] text-[#3D5244] truncate tabular-nums">
                {isAr
                  ? `آخر فاتورة #${shiftLiveMetrics.latestSale.receiptNumber} · ${formatCurrency(shiftLiveMetrics.latestSale.totalIQD, currency, language)}`
                  : `Latest #${shiftLiveMetrics.latestSale.receiptNumber} · ${formatCurrency(shiftLiveMetrics.latestSale.totalIQD, currency, language)}`}
              </div>
            ) : (
              <div className="text-[11px] text-[#5F7164]">
                {isAr ? 'بانتظار أول عملية بيع في الوردية' : 'Waiting for first shift sale'}
              </div>
            )}

            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  if (activeSubView === 'report') {
                    setActiveSubView('pos');
                  } else {
                    setActiveSubView('report');
                    setReportTab('transactions');
                  }
                }}
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#EBF4EE] hover:bg-[#DCECE2] text-[#0B5D32] text-[11px] font-bold transition cursor-pointer text-center whitespace-nowrap"
              >
                {activeSubView === 'report'
                  ? isAr
                    ? 'شاشة الكاشير'
                    : 'POS Terminal'
                  : isAr
                  ? 'تفاصيل الوردية'
                  : 'Shift Details'}
              </button>
              <button
                type="button"
                onClick={() => loadData(undefined, false)}
                disabled={loading}
                aria-label={isAr ? 'مزامنة الآن' : 'Sync now'}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-[#DCE5DC] hover:border-[#0B5D32] text-[#3D5244] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition shrink-0"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>{isAr ? 'تحديث' : 'Sync'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEEDBACK & SMART RESTOCK BRIDGE BANNER ================= */}
      {feedbackBanner && (
        <div
          className={`rounded-2xl p-3.5 border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs ${
            feedbackBanner.type === 'success'
              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-start sm:items-center gap-2">
            {feedbackBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
            )}
            <div>
              <span className="font-bold">{feedbackBanner.message}</span>
              {feedbackBanner.triggeredAlerts && feedbackBanner.triggeredAlerts.length > 0 && (
                <div className="text-[11px] mt-1 font-semibold text-amber-800">
                  {isAr
                    ? `تنبيه تلقائي: ${feedbackBanner.triggeredAlerts.length} صنف وصل إلى حد إعادة الطلب (${feedbackBanner.triggeredAlerts[0].productName}).`
                    : `Auto-Alert: ${feedbackBanner.triggeredAlerts.length} SKU dropped below reorder threshold.`}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {feedbackBanner.triggeredAlerts && feedbackBanner.triggeredAlerts.length > 0 && (
              <button
                type="button"
                onClick={() => triggerWholesaleReorder(feedbackBanner.triggeredAlerts![0].barcode)}
                className="px-3 py-1.5 rounded-xl bg-[#0B5D32] hover:bg-[#084725] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FFE600]" />
                <span>{isAr ? 'اطلب تعويض النقص من الموردين' : 'Reorder from Suppliers'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setFeedbackBanner(null)}
              className="p-1 text-current opacity-60 hover:opacity-100 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* VIEW A: POS CASHIER TERMINAL (SPLIT SCREEN LIKE SCREENSHOT 2 & 4)        */}
      {/* ======================================================================== */}
      {activeSubView === 'pos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT/MAIN CATALOG PANEL */}
          <div className="lg:col-span-8 space-y-4">
            {/* Search & Working Barcode Scanner Bar */}
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#0B5D32] absolute start-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={
                  isAr
                    ? 'ابحث بالاسم أو امسح الباركود + Enter...'
                    : 'Search item or scan barcode + Enter...'
                }
                className="w-full bg-white border border-[#0B5D32]/35 focus:border-[#0B5D32] rounded-full py-2.5 ps-11 pe-28 text-xs sm:text-sm text-[#142018] placeholder:text-[#78897C] focus:outline-hidden focus:ring-2 focus:ring-[#0B5D32]/15 transition"
              />
              <div className="absolute end-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="w-7 h-7 rounded-full hover:bg-gray-100 text-[#5F7164] hover:text-[#142018] flex items-center justify-center cursor-pointer"
                    aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="h-8 px-2.5 rounded-full bg-[#EFF7F1] hover:bg-[#0B5D32] text-[#0B5D32] hover:text-white border border-[#0B5D32]/25 flex items-center gap-1.5 text-[11px] font-bold transition cursor-pointer whitespace-nowrap"
                  title={isAr ? 'فتح قارئ الباركود بالكاميرا' : 'Open Barcode Scanner'}
                >
                  <ScanBarcode className="w-4 h-4 shrink-0" />
                  <span>{isAr ? 'قارئ' : 'Scan'}</span>
                </button>
              </div>
            </div>

            {/* Compact Category Horizontal Slider (Low height + clear scroll controls & peek edge) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold text-[#3D5244]">
                    {isAr ? 'الأقسام' : 'Categories'}
                  </span>
                  <span className="text-[10px] font-bold text-[#6F8073] tabular-nums">
                    ({categoryCards.length}) · {isAr ? 'مرّر للتنقل' : 'Swipe'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => scrollCategorySlider('prev')}
                    aria-label={isAr ? 'السابق' : 'Previous categories'}
                    className="w-6 h-6 rounded-full bg-white border border-[#DCE5DC] hover:border-[#0B5D32] text-[#3D5244] flex items-center justify-center transition cursor-pointer"
                  >
                    {isAr ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCategorySlider('next')}
                    aria-label={isAr ? 'التالي' : 'Next categories'}
                    className="w-6 h-6 rounded-full bg-white border border-[#DCE5DC] hover:border-[#0B5D32] text-[#3D5244] flex items-center justify-center transition cursor-pointer"
                  >
                    {isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="relative">
                <div
                  ref={categorySliderRef}
                  className="flex gap-2 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory scroll-smooth pe-6"
                >
                  {categoryCards.map((cat) => {
                    const isActive = selectedCategory === cat.key;
                    const needsRestock = cat.lowCount > 0;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setSelectedCategory(cat.key)}
                        className={`w-[154px] sm:w-[172px] shrink-0 snap-start rounded-2xl p-2 text-start transition-all cursor-pointer border flex items-center gap-2.5 ${
                          isActive
                            ? 'bg-[#0B5D32] text-white border-[#0B5D32] shadow-xs'
                            : 'bg-white text-[#142018] border-[#DCE5DC] hover:border-[#0B5D32]/50'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-white border border-[#EAEFEA] p-1 shrink-0 flex items-center justify-center">
                          <img
                            src={cat.imageUrl}
                            alt={isAr ? cat.labelAr : cat.labelEn}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain mix-blend-multiply"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-[11.5px] font-black leading-tight truncate">
                            {isAr ? cat.labelAr : cat.labelEn}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] truncate">
                            <span
                              className={`font-semibold tabular-nums whitespace-nowrap ${
                                isActive ? 'text-white/80' : 'text-[#5F7164]'
                              }`}
                            >
                              {cat.count} {isAr ? 'صنف' : 'items'}
                            </span>
                            <span className={isActive ? 'text-white/40' : 'text-[#CBD5CE]'}>·</span>
                            <span
                              className={`font-bold whitespace-nowrap ${
                                needsRestock
                                  ? isActive
                                    ? 'text-[#FCA5A5]'
                                    : 'text-[#DC2626]'
                                  : isActive
                                  ? 'text-[#A7F3D0]'
                                  : 'text-[#0B5D32]'
                              }`}
                            >
                              {needsRestock
                                ? isAr
                                  ? `نقص ${cat.lowCount}`
                                  : `Low ${cat.lowCount}`
                                : isAr
                                ? 'متوفر'
                                : 'Ready'}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {/* Soft trailing gradient fade to signal horizontal scrollability */}
                <div
                  className={`pointer-events-none absolute inset-y-0 ${
                    isAr ? 'left-0 bg-gradient-to-r' : 'right-0 bg-gradient-to-l'
                  } from-[#F4F4EA] to-transparent w-7`}
                />
              </div>
            </div>

            {/* Products Toolbar: Item Count + 4 Product Display Modes Switcher */}
            <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
              <div className="text-xs font-bold text-[#3D5244] tabular-nums">
                {selectedCategory === 'الكل'
                  ? isAr
                    ? `كل الأصناف (${filteredPOSInventory.length})`
                    : `All Items (${filteredPOSInventory.length})`
                  : `${isAr ? selectedCategory : getLocalizedText(selectedCategory, 'en')} (${filteredPOSInventory.length})`}
              </div>

              {/* 4-Mode View Switcher: Mini Grid | Standard Grid | Large Photo | Quick List */}
              <div
                className="inline-flex items-center gap-0.5 bg-white border border-[#DCE5DC] rounded-full p-0.5 text-[10.5px] sm:text-[11px] font-bold overflow-x-auto no-scrollbar max-w-full"
                role="group"
                aria-label={isAr ? 'طريقة عرض المنتجات' : 'Product view mode'}
              >
                <button
                  type="button"
                  onClick={() => handleChangeViewMode('mini')}
                  className={`px-2 sm:px-2.5 py-1 rounded-full flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0 ${
                    productViewMode === 'mini'
                      ? 'bg-[#0B5D32] text-white shadow-2xs'
                      : 'text-[#4B6352] hover:text-[#142018]'
                  }`}
                  title={isAr ? 'شبكي مصغّر (يسع منتجات أكثر)' : 'Dense Mini Grid'}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'مصغّر' : 'Mini'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleChangeViewMode('grid')}
                  className={`px-2 sm:px-2.5 py-1 rounded-full flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0 ${
                    productViewMode === 'grid'
                      ? 'bg-[#0B5D32] text-white shadow-2xs'
                      : 'text-[#4B6352] hover:text-[#142018]'
                  }`}
                  title={isAr ? 'عرض شبكي' : 'Grid View'}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>{isAr ? 'شبكي' : 'Grid'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleChangeViewMode('large')}
                  className={`px-2 sm:px-2.5 py-1 rounded-full flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0 ${
                    productViewMode === 'large'
                      ? 'bg-[#0B5D32] text-white shadow-2xs'
                      : 'text-[#4B6352] hover:text-[#142018]'
                  }`}
                  title={isAr ? 'عرض صور كبيرة' : 'Large Photo View'}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{isAr ? 'كبير' : 'Large'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleChangeViewMode('list')}
                  className={`px-2 sm:px-2.5 py-1 rounded-full flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0 ${
                    productViewMode === 'list'
                      ? 'bg-[#0B5D32] text-white shadow-2xs'
                      : 'text-[#4B6352] hover:text-[#142018]'
                  }`}
                  title={isAr ? 'عرض قائمة مدمجة' : 'Compact List View'}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>{isAr ? 'قائمة' : 'List'}</span>
                </button>
              </div>
            </div>

            {/* POS Products View (Supports 4 Modes: Dense Mini Grid / Standard Grid / Large Photo / Quick List) */}
            {filteredPOSInventory.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#DCE5DC] p-8 text-center space-y-2">
                <p className="text-sm font-bold text-[#142018]">
                  {isAr ? 'لا توجد أصناف مطابقة في هذا القسم' : 'No matching POS items found'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('الكل');
                    setSearchQuery('');
                  }}
                  className="px-4 py-1.5 rounded-full bg-[#0B5D32] text-white text-xs font-bold cursor-pointer"
                >
                  {isAr ? 'عرض جميع الأصناف' : 'Show All Items'}
                </button>
              </div>
            ) : productViewMode === 'mini' ? (
              /* MODE 0: ULTRA-DENSE MINI GRID (FITS MANY MORE PRODUCTS ON SCREEN) */
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-2">
                {filteredPOSInventory.map((item) => {
                  const inCartLine = posCart.find((c) => c.barcode === item.barcode);
                  const qtyInCart = inCartLine?.qty || 0;
                  const isLow = item.stockQuantity <= item.reorderLevel || item.isLowStock;
                  const isOut = item.stockQuantity <= 0;
                  const imgUrl = resolveItemImage(item.barcode, item.category);

                  return (
                    <div
                      key={item.id}
                      onClick={() => !isOut && handleAddToPOS(item)}
                      className={`relative rounded-xl bg-white p-2 flex flex-col justify-between transition-all cursor-pointer border group ${
                        qtyInCart > 0
                          ? 'border-[#0B5D32] ring-1 ring-[#0B5D32]/25 shadow-xs'
                          : 'border-[#DCE5DC] hover:border-[#0B5D32]/70'
                      } ${isOut ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-1 min-h-[18px]">
                        <span
                          className={`text-[9.5px] font-bold tabular-nums ${
                            isLow ? 'text-[#DC2626]' : 'text-[#5F7164]'
                          }`}
                        >
                          {isOut ? (isAr ? 'نفد' : '0') : item.stockQuantity}
                        </span>
                        {qtyInCart > 0 && (
                          <span className="w-4.5 h-4.5 rounded-full bg-[#0B5D32] text-white text-[9.5px] font-black flex items-center justify-center tabular-nums">
                            {qtyInCart}
                          </span>
                        )}
                      </div>

                      <div className="h-14 sm:h-16 w-full flex items-center justify-center p-0.5 bg-white my-0.5">
                        <img
                          src={imgUrl}
                          alt={item.productName}
                          referrerPolicy="no-referrer"
                          className="max-h-full w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-150"
                        />
                      </div>

                      <h3
                        className="text-[10.5px] font-extrabold text-[#142018] line-clamp-2 leading-tight text-center min-h-[26px]"
                        title={item.productName}
                      >
                        {isAr ? item.productName : getLocalizedText(item.productName, 'en')}
                      </h3>

                      <div className="flex items-center justify-between gap-1 pt-1.5 mt-1 border-t border-[#F0F3EE]">
                        <span className="text-[9.5px] sm:text-[10px] font-black font-mono tabular-nums text-[#0B5D32] truncate">
                          {formatCurrency(item.retailSellingPriceIQD, currency, language)}
                        </span>
                        <button
                          type="button"
                          disabled={isOut}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToPOS(item);
                          }}
                          aria-label={isAr ? 'إضافة للفاتورة' : 'Add to receipt'}
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition cursor-pointer active:scale-90 ${
                            qtyInCart > 0
                              ? 'bg-[#0B5D32] text-white'
                              : 'bg-[#EFF7F1] text-[#0B5D32] hover:bg-[#0B5D32] hover:text-white'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : productViewMode === 'list' ? (
              /* MODE 3: COMPACT HIGH-SPEED CASHIER LIST */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredPOSInventory.map((item) => {
                  const inCartLine = posCart.find((c) => c.barcode === item.barcode);
                  const qtyInCart = inCartLine?.qty || 0;
                  const isLow = item.stockQuantity <= item.reorderLevel || item.isLowStock;
                  const isOut = item.stockQuantity <= 0;
                  const imgUrl = resolveItemImage(item.barcode, item.category);

                  return (
                    <div
                      key={item.id}
                      onClick={() => !isOut && handleAddToPOS(item)}
                      className={`rounded-2xl bg-white p-2.5 flex items-center justify-between gap-2.5 transition-all cursor-pointer border ${
                        qtyInCart > 0
                          ? 'border-[#0B5D32] ring-1 ring-[#0B5D32]/20 shadow-xs'
                          : 'border-[#DCE5DC] hover:border-[#0B5D32]/70'
                      } ${isOut ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative w-14 h-14 rounded-xl bg-white border border-[#EAEFEA] p-1 shrink-0 flex items-center justify-center">
                          <img
                            src={imgUrl}
                            alt={item.productName}
                            referrerPolicy="no-referrer"
                            className="max-h-full w-auto object-contain mix-blend-multiply"
                          />
                          {qtyInCart > 0 && (
                            <span className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-[#0B5D32] text-white text-[10px] font-black flex items-center justify-center border border-white tabular-nums">
                              {qtyInCart}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs font-extrabold text-[#142018] line-clamp-1">
                            {isAr ? item.productName : getLocalizedText(item.productName, 'en')}
                          </h3>
                          <div className="flex items-center gap-1.5 text-[10.5px] mt-0.5 flex-wrap">
                            <span className="font-mono font-black text-[#0B5D32] tabular-nums">
                              {formatCurrency(item.retailSellingPriceIQD, currency, language)}
                            </span>
                            <span className="text-[#9AA89D]">·</span>
                            {isLow ? (
                              isCashierMode ? (
                                <span className="font-bold text-[#DC2626] tabular-nums">
                                  {isOut
                                    ? isAr
                                      ? 'نفد من الرف'
                                      : 'Out of stock'
                                    : isAr
                                    ? `متبقي ${item.stockQuantity}`
                                    : `${item.stockQuantity} left`}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    triggerWholesaleReorder(item.barcode);
                                  }}
                                  className="font-bold text-[#DC2626] hover:underline cursor-pointer"
                                >
                                  {isOut
                                    ? isAr
                                      ? 'نفد · اطلب جملة'
                                      : 'Out · Reorder'
                                    : isAr
                                    ? `متبقي ${item.stockQuantity} · اطلب`
                                    : `${item.stockQuantity} left`}
                                </button>
                              )
                            ) : (
                              <span className="text-[#5F7164] tabular-nums">
                                {isAr ? `الرف: ${item.stockQuantity}` : `Stock: ${item.stockQuantity}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isOut}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToPOS(item);
                        }}
                        aria-label={isAr ? 'إضافة للفاتورة' : 'Add to receipt'}
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition cursor-pointer active:scale-90 ${
                          qtyInCart > 0
                            ? 'bg-[#0B5D32] text-white shadow-xs'
                            : 'bg-white border border-[#0B5D32]/60 text-[#0B5D32] hover:bg-[#0B5D32] hover:text-white'
                        }`}
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : productViewMode === 'large' ? (
              /* MODE 2: LARGE IMAGE SHOWCASE CARDS */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {filteredPOSInventory.map((item) => {
                  const inCartLine = posCart.find((c) => c.barcode === item.barcode);
                  const qtyInCart = inCartLine?.qty || 0;
                  const isLow = item.stockQuantity <= item.reorderLevel || item.isLowStock;
                  const isOut = item.stockQuantity <= 0;
                  const imgUrl = resolveItemImage(item.barcode, item.category);

                  return (
                    <div
                      key={item.id}
                      onClick={() => !isOut && handleAddToPOS(item)}
                      className={`relative rounded-2xl bg-white p-4 flex flex-col justify-between transition-all cursor-pointer border group ${
                        qtyInCart > 0
                          ? 'border-[#0B5D32] ring-1 ring-[#0B5D32]/20 shadow-xs'
                          : 'border-[#DCE5DC] hover:border-[#0B5D32]/70 hover:shadow-xs'
                      } ${isOut ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-bold text-[#5F7164] truncate">
                          {isAr ? item.category : getLocalizedText(item.category, 'en')} ·{' '}
                          <span className="font-mono">{item.barcode}</span>
                        </span>

                        {qtyInCart > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#DCECE2] text-[#0B5D32] text-[11px] font-black tabular-nums shrink-0">
                            {isAr ? `في الفاتورة: ${qtyInCart}` : `In cart: ${qtyInCart}`}
                          </span>
                        )}
                      </div>

                      <div className="h-40 sm:h-44 w-full flex items-center justify-center p-2 bg-white">
                        <img
                          src={imgUrl}
                          alt={item.productName}
                          referrerPolicy="no-referrer"
                          className="max-h-full w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>

                      <div className="pt-3 space-y-2.5 border-t border-[#F0F3EE]">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-black text-[#142018] leading-snug line-clamp-2">
                            {isAr ? item.productName : getLocalizedText(item.productName, 'en')}
                          </h3>
                          <span className="text-sm font-black font-mono tabular-nums text-[#0B5D32] shrink-0">
                            {formatCurrency(item.retailSellingPriceIQD, currency, language)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          {isLow ? (
                            isCashierMode ? (
                              <span className="text-[11px] font-bold text-[#DC2626] bg-red-50 px-2.5 py-1 rounded-full whitespace-nowrap tabular-nums">
                                {isOut
                                  ? isAr
                                    ? 'نفد من الرف'
                                    : 'Out of stock'
                                  : isAr
                                  ? `متبقي ${item.stockQuantity} فقط`
                                  : `${item.stockQuantity} left`}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerWholesaleReorder(item.barcode);
                                }}
                                className="text-[11px] font-bold text-[#DC2626] bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-full transition cursor-pointer whitespace-nowrap"
                              >
                                {isOut
                                  ? isAr
                                    ? 'نفد · اطلب جملة'
                                    : 'Out · Order'
                                  : isAr
                                  ? `متبقي ${item.stockQuantity} · اطلب جملة`
                                  : `${item.stockQuantity} left · Reorder`}
                              </button>
                            )
                          ) : (
                            <span className="text-xs font-semibold text-[#5F7164] tabular-nums">
                              {isAr ? `متوفر بالرف: ${item.stockQuantity}` : `In stock: ${item.stockQuantity}`}
                            </span>
                          )}

                          <button
                            type="button"
                            disabled={isOut}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToPOS(item);
                            }}
                            className={`px-3.5 py-2 rounded-full text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 whitespace-nowrap ${
                              qtyInCart > 0
                                ? 'bg-[#0B5D32] text-white'
                                : 'bg-[#EFF7F1] text-[#0B5D32] border border-[#0B5D32]/30 hover:bg-[#0B5D32] hover:text-white'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>{isAr ? 'أضف للفاتورة' : 'Add Item'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* MODE 1: STANDARD POS GRID */
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
                {filteredPOSInventory.map((item) => {
                  const inCartLine = posCart.find((c) => c.barcode === item.barcode);
                  const qtyInCart = inCartLine?.qty || 0;
                  const isLow = item.stockQuantity <= item.reorderLevel || item.isLowStock;
                  const isOut = item.stockQuantity <= 0;
                  const imgUrl = resolveItemImage(item.barcode, item.category);

                  return (
                    <div
                      key={item.id}
                      onClick={() => !isOut && handleAddToPOS(item)}
                      className={`relative rounded-2xl bg-white p-3 flex flex-col justify-between transition-all cursor-pointer border group ${
                        qtyInCart > 0
                          ? 'border-[#0B5D32] ring-1 ring-[#0B5D32]/20 shadow-xs'
                          : 'border-[#DCE5DC] hover:border-[#0B5D32]/70 hover:shadow-xs'
                      } ${isOut ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {/* Top indicators row */}
                      <div className="flex items-center justify-between gap-1 min-h-[22px] mb-1">
                        {isLow ? (
                          isCashierMode ? (
                            <span className="text-[10px] font-bold text-[#DC2626] bg-red-50 px-2 py-0.5 rounded-full whitespace-nowrap tabular-nums">
                              {isOut
                                ? isAr
                                  ? 'نفد'
                                  : 'Out'
                                : isAr
                                ? `متبقي ${item.stockQuantity}`
                                : `${item.stockQuantity} left`}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerWholesaleReorder(item.barcode);
                              }}
                              className="text-[10px] font-bold text-[#DC2626] bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-full transition cursor-pointer whitespace-nowrap"
                              title={isAr ? 'اطلب تعويض من منصة الجملة' : 'Reorder wholesale'}
                            >
                              {isOut
                                ? isAr
                                  ? 'نفد · اطلب'
                                  : 'Out · Order'
                                : isAr
                                ? `متبقي ${item.stockQuantity} · اطلب`
                                : `${item.stockQuantity} left · Order`}
                            </button>
                          )
                        ) : (
                          <span className="text-[10px] font-medium text-[#5F7164] tabular-nums">
                            {isAr ? `الرف: ${item.stockQuantity}` : `Stock: ${item.stockQuantity}`}
                          </span>
                        )}

                        {qtyInCart > 0 && (
                          <span className="w-5.5 h-5.5 rounded-full bg-[#DCECE2] text-[#0B5D32] text-[11px] font-black flex items-center justify-center tabular-nums">
                            {qtyInCart}
                          </span>
                        )}
                      </div>

                      {/* Pure White Cutout Product Image */}
                      <div className="h-24 sm:h-28 w-full flex items-center justify-center p-1 bg-white">
                        <img
                          src={imgUrl}
                          alt={item.productName}
                          referrerPolicy="no-referrer"
                          className="max-h-full w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>

                      {/* Bottom Details + Circular '+' Action */}
                      <div className="flex items-end justify-between gap-2 pt-2">
                        <div className="min-w-0">
                          <h3
                            className="text-xs font-extrabold text-[#142018] line-clamp-2 leading-snug"
                            title={item.productName}
                          >
                            {isAr ? item.productName : getLocalizedText(item.productName, 'en')}
                          </h3>
                          <div className="text-xs font-black font-mono tabular-nums text-[#3D5244] mt-1">
                            {formatCurrency(item.retailSellingPriceIQD, currency, language)}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isOut}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToPOS(item);
                          }}
                          aria-label={isAr ? 'إضافة للفاتورة' : 'Add to receipt'}
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition cursor-pointer active:scale-90 ${
                            qtyInCart > 0
                              ? 'bg-[#0B5D32] text-white shadow-xs'
                              : 'bg-white border border-[#0B5D32]/60 text-[#0B5D32] hover:bg-[#0B5D32] hover:text-white'
                          }`}
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT/END PURCHASE RECEIPT PANEL (Matching Screenshot 4) */}
          <aside className="lg:col-span-4 bg-white rounded-3xl border border-[#DCE5DC] p-4 sm:p-5 shadow-xs space-y-4 lg:sticky lg:top-20">
            {/* Receipt Header */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setPosCart([]);
                  setCustomerName('');
                  setDiscountPercent(0);
                }}
                disabled={posCart.length === 0}
                className="w-9 h-9 rounded-full border border-[#DCE5DC] hover:border-red-300 hover:text-red-600 disabled:opacity-40 flex items-center justify-center text-[#3D5244] transition cursor-pointer"
                title={isAr ? 'فاتورة جديدة' : 'Clear Receipt'}
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="text-center">
                <div className="text-sm font-black text-[#142018]">
                  {isAr ? 'فاتورة المبيعات' : 'Purchase Receipt'}
                </div>
                <div className="text-xs font-mono font-bold text-[#5F7164] tabular-nums">
                  #{nextReceiptNumber}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveSubView('report');
                  setReportTab('transactions');
                }}
                className="w-9 h-9 rounded-full border border-[#DCE5DC] hover:border-[#0B5D32] flex items-center justify-center text-[#3D5244] transition cursor-pointer"
                title={isAr ? 'سجل الفواتير' : 'Receipt History'}
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>

            {/* 3-Way Segmented Mode Switch */}
            <div className="grid grid-cols-3 p-1 rounded-full border border-[#DCE5DC] bg-[#F8FAF7] text-[11px] font-bold">
              {(
                [
                  { id: 'in_store', ar: 'بيع مباشر', en: 'In Store' },
                  { id: 'take_away', ar: 'سفري', en: 'Take Away' },
                  { id: 'online_order', ar: 'أونلاين', en: 'Online' }
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setOrderMode(mode.id)}
                  className={`py-1.5 px-2 rounded-full transition cursor-pointer whitespace-nowrap truncate ${
                    orderMode === mode.id
                      ? 'bg-[#0B5D32] text-white shadow-2xs'
                      : 'text-[#4B6352] hover:text-[#142018]'
                  }`}
                >
                  {isAr ? mode.ar : mode.en}
                </button>
              ))}
            </div>

            {/* Customer Name & Payment Method Pill Inputs */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10.5px] font-bold text-[#5F7164] mb-1 px-1">
                  {isAr ? 'اسم الزبون' : 'Customer name'}
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={isAr ? 'زبون نقدي' : 'Walk-in'}
                  className="w-full rounded-full border border-[#0B5D32]/35 focus:border-[#0B5D32] px-3.5 py-2 text-xs font-bold text-[#142018] focus:outline-hidden bg-white"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-[#5F7164] mb-1 px-1">
                  {isAr ? 'طريقة الدفع' : 'Payment'}
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                  className="w-full rounded-full border border-[#0B5D32]/35 focus:border-[#0B5D32] px-3 py-2 text-xs font-bold text-[#142018] focus:outline-hidden bg-white cursor-pointer"
                >
                  <option value="cash">{isAr ? 'نقدي (IQD)' : 'Cash'}</option>
                  <option value="card">{isAr ? 'بطاقة / زين كاش' : 'Card / Wallet'}</option>
                  <option value="credit_ledger">{isAr ? 'آجل (دفتر المحل)' : 'Store Credit'}</option>
                </select>
              </div>
            </div>

            {/* Order List Inner Container */}
            <div>
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-xs font-bold text-[#142018]">
                  {isAr ? 'قائمة الأصناف' : 'Order list'}
                </span>
                <span className="text-[11px] font-bold text-[#5F7164] tabular-nums">
                  {posCart.reduce((s, l) => s + l.qty, 0)} {isAr ? 'وحدة' : 'qty'}
                </span>
              </div>

              <div className="rounded-2xl border border-[#B8D4C0] p-2.5 min-h-[175px] max-h-[280px] overflow-y-auto space-y-2.5 bg-[#FCFDFB]">
                {posCart.length === 0 ? (
                  <div className="h-[150px] flex flex-col items-center justify-center text-center text-[#78897C] px-4 space-y-1.5">
                    <ShoppingBag className="w-6 h-6 opacity-40" />
                    <p className="text-xs font-semibold">
                      {isAr
                        ? 'اضغط (+) على أي منتج أو امسح الباركود لإضافته للفاتورة'
                        : 'Tap (+) on any item or scan barcode to start'}
                    </p>
                  </div>
                ) : (
                  posCart.map((line) => (
                    <div
                      key={line.barcode}
                      className="flex items-start gap-2.5 pb-2.5 border-b border-[#EAEFEA] last:border-b-0 last:pb-0"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white border border-[#E5ECE5] p-1 shrink-0 flex items-center justify-center">
                        <img
                          src={line.imageUrl}
                          alt={line.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="text-xs font-extrabold text-[#142018] line-clamp-1">
                            {isAr ? line.name : getLocalizedText(line.name, 'en')}
                          </h4>
                          <span className="text-xs font-black font-mono tabular-nums text-[#142018] shrink-0">
                            {formatCurrency(line.price * line.qty, currency, language)}
                          </span>
                        </div>

                        <div className="text-[10.5px] text-[#5F7164] font-mono tabular-nums">
                          {formatCurrency(line.price, currency, language)} × {line.qty}
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          {editingNoteBarcode === line.barcode ? (
                            <div className="flex items-center gap-1 flex-1">
                              <input
                                type="text"
                                value={tempNote}
                                onChange={(e) => setTempNote(e.target.value)}
                                placeholder={isAr ? 'ملاحظة...' : 'Note...'}
                                className="w-full text-[10px] border border-[#0B5D32]/50 rounded-md px-1.5 py-0.5 focus:outline-hidden"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveLineNote(line.barcode)}
                                className="text-[#0B5D32] cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNoteBarcode(line.barcode);
                                setTempNote(line.note || '');
                              }}
                              className="text-[10px] text-[#5F7164] hover:text-[#0B5D32] flex items-center gap-1 truncate cursor-pointer"
                            >
                              <FileText className="w-3 h-3 shrink-0" />
                              <span className="truncate">
                                {line.note || (isAr ? 'إضافة ملاحظة' : 'Add note')}
                              </span>
                            </button>
                          )}

                          {/* Quantity Stepper Pill */}
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#DCE5DC] bg-white px-1.5 py-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(line.barcode, -1)}
                              className="w-5 h-5 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#142018] cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-black font-mono tabular-nums min-w-[14px] text-center">
                              {line.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(line.barcode, 1)}
                              disabled={line.qty >= line.maxStock}
                              className="w-5 h-5 rounded-full hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center text-[#142018] cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Discount Quick Selector & Payment Details */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="font-bold text-[#5F7164]">
                  {isAr ? 'خصم سريع للزبون:' : 'Quick Discount:'}
                </span>
                <div className="flex items-center gap-1">
                  {[0, 5, 10].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDiscountPercent(pct)}
                      className={`px-2 py-0.5 rounded-md font-bold tabular-nums cursor-pointer transition ${
                        discountPercent === pct
                          ? 'bg-[#0B5D32] text-white'
                          : 'bg-[#F4F4EA] text-[#3D5244] hover:bg-[#E4EAD8]'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 text-xs border-t border-[#EAEFEA] pt-2.5">
                <div className="flex items-center justify-between text-[#5F7164]">
                  <span>{isAr ? 'المجموع الفرعي' : 'Subtotal'}</span>
                  <span className="font-mono font-bold tabular-nums text-[#142018]">
                    {formatCurrency(subtotalIQD, currency, language)}
                  </span>
                </div>
                {discountIQD > 0 && (
                  <div className="flex items-center justify-between text-[#0B5D32]">
                    <span>{isAr ? `الخصم (${discountPercent}%)` : `Discount (${discountPercent}%)`}</span>
                    <span className="font-mono font-bold tabular-nums">
                      -{formatCurrency(discountIQD, currency, language)}
                    </span>
                  </div>
                )}
                {!isCashierMode && (
                  <div className="flex items-center justify-between text-[11px] text-[#5F7164]">
                    <span>{isAr ? 'هامش ربح المحل المقدر' : 'Est. Store Profit'}</span>
                    <span className="font-mono font-bold tabular-nums text-[#008A3C]">
                      +{formatCurrency(estimatedProfitIQD, currency, language)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm font-black pt-1 border-t border-dashed border-[#DCE5DC]">
                  <span>{isAr ? 'الإجمالي المستحق' : 'Total'}</span>
                  <span className="font-mono tabular-nums text-[#0B5D32] text-base">
                    {formatCurrency(totalIQD, currency, language)}
                  </span>
                </div>
              </div>

              {/* Iconic Pill Checkout Button */}
              <button
                type="button"
                onClick={handlePOSCheckout}
                disabled={posCart.length === 0 || isCheckingOut}
                className="w-full py-2.5 px-3 rounded-full bg-[#0B5D32] hover:bg-[#084725] disabled:bg-[#C6D1C8] text-white flex items-center justify-between gap-2 shadow-sm transition cursor-pointer disabled:cursor-not-allowed"
              >
                <span className="w-8 h-8 rounded-full bg-white text-[#0B5D32] flex items-center justify-center shrink-0">
                  {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
                <span className="text-xs sm:text-sm font-black flex items-center gap-2 whitespace-nowrap">
                  <span>
                    {isCheckingOut
                      ? isAr
                        ? 'جاري الحفظ...'
                        : 'Processing...'
                      : isAr
                      ? 'إتمام البيع'
                      : 'Place Order'}
                  </span>
                  <span className="font-mono tabular-nums text-[#FFE600]">
                    {formatCurrency(totalIQD, currency, language)}
                  </span>
                </span>
                <span className="text-white/70 pe-1">
                  {isAr ? <ChevronsLeft className="w-4 h-4" /> : <ChevronsRight className="w-4 h-4" />}
                </span>
              </button>
            </div>
          </aside>
        </div>
      ) : (
        /* ======================================================================== */
        /* VIEW B: EXECUTIVE ANALYTICS REPORT & INVENTORY THRESHOLDS (SCREENSHOT 1) */
        /* ======================================================================== */
        <div className="space-y-4">
          {/* KPI Summary Cards (Net Profit hidden in Cashier Mode) */}
          <div className={`grid grid-cols-2 sm:grid-cols-3 ${isCashierMode ? 'lg:grid-cols-4' : 'lg:grid-cols-5'} gap-3`}>
            <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#5F7164]">
                <span>{isAr ? 'صافي الإيرادات' : 'Net Revenue'}</span>
                <Banknote className="w-4 h-4 text-[#0B5D32]" />
              </div>
              <div className="text-base sm:text-lg font-black font-mono tabular-nums text-[#142018]">
                {formatCurrency(analyticsStats.totalRevenueIQD, currency, language)}
              </div>
              {analyticsStats.totalReturnsIQD > 0 && (
                <div className="text-[10px] font-bold text-amber-700 tabular-nums">
                  {isAr
                    ? `خصم مرتجعات: -${formatCurrency(analyticsStats.totalReturnsIQD, currency, language)}`
                    : `Returns: -${formatCurrency(analyticsStats.totalReturnsIQD, currency, language)}`}
                </div>
              )}
            </div>

            {!isCashierMode && (
              <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#5F7164]">
                  <span>{isAr ? 'صافي أرباح الكاشير' : 'Net Margin'}</span>
                  <Sparkles className="w-4 h-4 text-[#00A046]" />
                </div>
                <div className="text-base sm:text-lg font-black font-mono tabular-nums text-[#0B5D32]">
                  {formatCurrency(analyticsStats.totalProfitIQD, currency, language)}
                </div>
              </div>
            )}

            <div
              onClick={() => setReportTab('returns')}
              className="bg-white rounded-2xl border border-[#DCE5DC] hover:border-amber-300 p-3.5 space-y-1.5 cursor-pointer transition"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-[#5F7164]">
                <span>{isAr ? 'فواتير / مرتجعات' : 'Sales / Returns'}</span>
                <Receipt className="w-4 h-4 text-[#0B5D32]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-base sm:text-lg font-black font-mono tabular-nums text-[#142018]">
                  {analyticsStats.totalOrdersCount}
                </span>
                <span className="text-[11px] font-bold text-amber-700 tabular-nums">
                  / {analyticsStats.totalReturnsCount} {isAr ? 'مرتجع' : 'ret'}
                </span>
              </div>
            </div>

            <div
              onClick={() => setReportTab('inventory')}
              className="bg-white rounded-2xl border border-[#DCE5DC] hover:border-amber-400 p-3.5 space-y-1.5 cursor-pointer transition"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-[#5F7164]">
                <span>{isAr ? 'نواقص الرفوف' : 'Low Stock'}</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-base sm:text-lg font-black font-mono tabular-nums text-amber-700">
                {lowStockItems.length} {isAr ? 'أصناف' : 'SKUs'}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3.5 space-y-1.5 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#5F7164]">
                <span>{isAr ? 'جاهزية المخزون' : 'Performance'}</span>
                <CheckCircle2 className="w-4 h-4 text-[#0B5D32]" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-black text-[#142018]">
                  {analyticsStats.healthScore >= 80
                    ? isAr
                      ? 'ممتاز'
                      : 'Strong'
                    : isAr
                    ? 'جيد'
                    : 'Good'}
                </span>
                <span className="text-xs font-mono font-bold text-[#00A046] tabular-nums">
                  {analyticsStats.healthScore}%
                </span>
              </div>
            </div>
          </div>

          {/* Middle Analytics Row: Sales Statistics Chart + Stock Health Gauge */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Sales Statistics Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-black text-[#142018]">
                    {isAr ? 'إحصائيات مبيعات الكاشير والمتجر' : 'Sales Statistics'}
                  </h2>
                  <div className="flex items-center gap-3 mt-1 text-[11px] font-semibold text-[#5F7164]">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0B5D32]" />
                      {isAr ? 'بيع مباشر' : 'In-Store'}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                      {isAr ? 'طلب أونلاين' : 'Online'}
                    </span>
                    {!isCashierMode && (
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                        {isAr ? 'صافي الربح' : 'Profit'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Timeframe Pills */}
                <div className="flex items-center gap-1 bg-[#F4F4EA] p-1 rounded-full text-[11px] font-bold">
                  {(
                    [
                      { id: 'day', ar: 'اليوم', en: 'Day' },
                      { id: 'week', ar: 'الأسبوع', en: 'Week' },
                      { id: 'month', ar: 'الشهر', en: 'Month' }
                    ] as const
                  ).map((tf) => (
                    <button
                      key={tf.id}
                      type="button"
                      onClick={() => {
                        setChartTimeframe(tf.id);
                        setHoveredChartIdx(null);
                      }}
                      className={`px-3 py-1 rounded-full transition cursor-pointer ${
                        chartTimeframe === tf.id
                          ? 'bg-white text-[#142018] shadow-2xs'
                          : 'text-[#5F7164] hover:text-[#142018]'
                      }`}
                    >
                      {isAr ? tf.ar : tf.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clean Responsive SVG Multi-Line Chart */}
              <div className="relative w-full">
                <svg
                  viewBox={`0 0 ${chartSvgGeometry.width} ${chartSvgGeometry.height}`}
                  className="w-full h-44 overflow-visible"
                >
                  {[0.25, 0.5, 0.75].map((ratio) => (
                    <line
                      key={ratio}
                      x1="20"
                      x2={chartSvgGeometry.width - 20}
                      y1={chartSvgGeometry.height * ratio}
                      y2={chartSvgGeometry.height * ratio}
                      stroke="#EAEFEA"
                      strokeDasharray="4 4"
                    />
                  ))}

                  <path
                    d={chartSvgGeometry.direct.dStr}
                    fill="none"
                    stroke="#0B5D32"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d={chartSvgGeometry.online.dStr}
                    fill="none"
                    stroke="#D97706"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  {!isCashierMode && (
                    <path
                      d={chartSvgGeometry.profit.dStr}
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  )}

                  {chartSeries.map((point, idx) => {
                    const ptDirect = chartSvgGeometry.direct.pts[idx];
                    const isHovered = hoveredChartIdx === idx;
                    return (
                      <g
                        key={point.label}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredChartIdx(idx)}
                        onClick={() => setHoveredChartIdx(idx)}
                      >
                        <line
                          x1={ptDirect.x}
                          x2={ptDirect.x}
                          y1={14}
                          y2={chartSvgGeometry.height - 14}
                          stroke={isHovered ? '#0B5D32' : 'transparent'}
                          strokeDasharray="3 3"
                          strokeOpacity="0.4"
                        />
                        <circle
                          cx={ptDirect.x}
                          cy={ptDirect.y}
                          r={isHovered ? 5.5 : 3.5}
                          fill="#0B5D32"
                          stroke="#fff"
                          strokeWidth="2"
                        />
                        <text
                          x={ptDirect.x}
                          y={chartSvgGeometry.height - 2}
                          textAnchor="middle"
                          className="fill-[#5F7164] text-[10px] font-bold"
                        >
                          {point.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Active Point Readout Bar */}
                {(() => {
                  const activeIdx =
                    hoveredChartIdx !== null ? hoveredChartIdx : chartSeries.length - 1;
                  const activePt = chartSeries[activeIdx];
                  if (!activePt) return null;
                  return (
                    <div className="mt-2 pt-2 border-t border-[#EAEFEA] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="font-black text-[#142018]">
                        {activePt.label}:
                      </span>
                      <div className="flex items-center gap-3 flex-wrap font-mono tabular-nums">
                        <span className="text-[#0B5D32] font-bold">
                          {isAr ? 'مباشر:' : 'Direct:'}{' '}
                          {formatCurrency(activePt.direct, currency, language)}
                        </span>
                        <span className="text-[#B45309] font-bold">
                          {isAr ? 'أونلاين:' : 'Online:'}{' '}
                          {formatCurrency(activePt.online, currency, language)}
                        </span>
                        {!isCashierMode && (
                          <span className="text-[#059669] font-bold">
                            {isAr ? 'الربح:' : 'Profit:'}{' '}
                            {formatCurrency(activePt.profit, currency, language)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Stock Health Gauge & Immediate Wholesale Restock Queue (Matching Screenshot 1 Score Card) */}
            <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-[#142018]">
                  {isAr ? 'صحة المخزون والتوريد' : 'Stock Health Score'}
                </h2>
                <span className="text-[11px] font-bold text-[#5F7164] tabular-nums">
                  {inventory.length} {isAr ? 'صنف' : 'SKUs'}
                </span>
              </div>

              {/* Circular SVG Gauge */}
              <div className="flex items-center justify-center py-1">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#EBF1EC"
                      strokeWidth="12"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#0B5D32"
                      strokeWidth="12"
                      strokeDasharray={`${(analyticsStats.healthScore / 100) * 314.16} 314.16`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black font-mono tabular-nums text-[#142018]">
                      {analyticsStats.healthScore}%
                    </span>
                    <span className="text-[10px] font-bold text-[#5F7164]">
                      {isAr ? 'توفر سليم' : 'Healthy'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actionable Platform Reorder Queue */}
              <div className="space-y-2">
                {lowStockItems.length === 0 && nearExpiryItems.length === 0 ? (
                  <div className="p-3 rounded-xl bg-[#ECFDF5] text-[#065F46] text-xs font-bold text-center">
                    {isAr
                      ? 'جميع رفوف المتجر في مستوى آمن ولا تحتاج تموين عاجل'
                      : 'All store shelves are at healthy stock levels'}
                  </div>
                ) : (
                  <>
                    {lowStockItems.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-[#FEF2F2] border border-red-200/80 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-[#142018] truncate">
                            {isAr ? item.productName : getLocalizedText(item.productName, 'en')}
                          </div>
                          <div className="text-[10px] text-red-700 font-semibold tabular-nums">
                            {isAr
                              ? `متبقي ${item.stockQuantity} (الحد: ${item.reorderLevel})`
                              : `${item.stockQuantity} left (min ${item.reorderLevel})`}
                          </div>
                        </div>
                        {!isCashierMode ? (
                          <button
                            type="button"
                            onClick={() => triggerWholesaleReorder(item.barcode)}
                            className="px-2.5 py-1 rounded-full bg-white hover:bg-[#0B5D32] text-[#0B5D32] hover:text-white border border-[#DCE5DC] text-[10.5px] font-black transition cursor-pointer shrink-0 whitespace-nowrap"
                          >
                            {isAr ? 'طلب جملة' : 'Solve'}
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-white border border-red-200 text-red-700 text-[10px] font-bold shrink-0 whitespace-nowrap">
                            {isAr ? 'أبلغ الإدارة' : 'Notify Mgr'}
                          </span>
                        )}
                      </div>
                    ))}
                    {nearExpiryItems.slice(0, 1).map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-[#142018] truncate">
                            {isAr ? item.productName : getLocalizedText(item.productName, 'en')}
                          </div>
                          <div className="text-[10px] text-amber-800 font-semibold tabular-nums">
                            {isAr ? `قريب الانتهاء: ${item.expiryDate}` : `Exp: ${item.expiryDate}`}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                          {isAr ? 'تصفية' : 'Clear'}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Tabbed Workspace: Transactions Table vs Shelf Inventory Thresholds */}
          <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Tab Switcher */}
              <div className="flex items-center gap-1 bg-[#F4F4EA] p-1 rounded-full w-fit max-w-full overflow-x-auto no-scrollbar text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setReportTab('transactions')}
                  className={`px-3.5 py-1.5 rounded-full transition cursor-pointer whitespace-nowrap ${
                    reportTab === 'transactions'
                      ? 'bg-[#0B5D32] text-white shadow-2xs'
                      : 'text-[#4B6352] hover:text-[#142018]'
                  }`}
                >
                  {isAr ? `سجل الفواتير (${salesHistory.length})` : `Transactions (${salesHistory.length})`}
                </button>
                <button
                  type="button"
                  onClick={() => setReportTab('returns')}
                  className={`px-3.5 py-1.5 rounded-full transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    reportTab === 'returns'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-[#4B6352] hover:text-[#142018]'
                  }`}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isAr ? `سجل المرتجعات (${posReturns.length})` : `Returns (${posReturns.length})`}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReportTab('inventory')}
                  className={`px-3.5 py-1.5 rounded-full transition cursor-pointer whitespace-nowrap ${
                    reportTab === 'inventory'
                      ? 'bg-[#0B5D32] text-white shadow-2xs'
                      : 'text-[#4B6352] hover:text-[#142018]'
                  }`}
                >
                  {isAr ? `حدود التنبيه والمخزون (${inventory.length})` : `Shelf Stock (${inventory.length})`}
                </button>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex items-center gap-2 flex-wrap">
                {reportTab === 'transactions' && (
                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    {(
                      [
                        { id: 'all', ar: 'الكل', en: 'All' },
                        { id: 'in_store', ar: 'مباشر', en: 'In Store' },
                        { id: 'take_away', ar: 'سفري', en: 'Take Away' },
                        { id: 'online_order', ar: 'أونلاين', en: 'Online' }
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setTxFilterMode(m.id)}
                        className={`px-2.5 py-1 rounded-full border transition cursor-pointer whitespace-nowrap ${
                          txFilterMode === m.id
                            ? 'bg-[#0B5D32] text-white border-[#0B5D32]'
                            : 'bg-[#F8FAF7] text-[#4B6352] border-[#DCE5DC]'
                        }`}
                      >
                        {isAr ? m.ar : m.en}
                      </button>
                    ))}
                  </div>
                )}

                {reportTab === 'returns' && (
                  <button
                    type="button"
                    onClick={() => openReturnModal()}
                    className="px-3 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{isAr ? '+ تسجيل مرتجع جديد' : '+ New Return'}</span>
                  </button>
                )}

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#5F7164] absolute start-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    placeholder={isAr ? 'بحث في الجدول...' : 'Filter table...'}
                    className="rounded-full border border-[#DCE5DC] bg-[#F8FAF7] focus:bg-white py-1.5 ps-8 pe-3 text-xs focus:outline-hidden focus:border-[#0B5D32]"
                  />
                </div>
              </div>
            </div>

            {reportTab === 'transactions' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead>
                    <tr className="border-b border-[#EAEFEA] text-[#5F7164] font-bold">
                      <th className="py-2.5 px-2 text-start">{isAr ? 'الفاتورة' : 'Receipt'}</th>
                      <th className="py-2.5 px-2 text-start">{isAr ? 'الزبون' : 'Customer'}</th>
                      <th className="py-2.5 px-2 text-start">{isAr ? 'النوع' : 'Channel'}</th>
                      <th className="py-2.5 px-2 text-start">{isAr ? 'الدفع' : 'Payment'}</th>
                      <th className="py-2.5 px-2 text-start">{isAr ? 'الأصناف' : 'Items'}</th>
                      {!isCashierMode && (
                        <th className="py-2.5 px-2 text-end">{isAr ? 'الربح' : 'Profit'}</th>
                      )}
                      <th className="py-2.5 px-2 text-end">{isAr ? 'الإجمالي' : 'Value'}</th>
                      <th className="py-2.5 px-2 text-end">{isAr ? 'إجراء' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F3EE]">
                    {filteredSalesHistory.length === 0 ? (
                      <tr>
                        <td colSpan={isCashierMode ? 7 : 8} className="py-6 text-center text-[#5F7164]">
                          {isAr ? 'لا توجد فواتير مطابقة' : 'No matching receipts'}
                        </td>
                      </tr>
                    ) : (
                      filteredSalesHistory.map((sale) => {
                        const retStatus = getReceiptReturnStatus(sale);
                        return (
                          <tr key={sale.id} className="hover:bg-[#F9FAF6] transition">
                            <td className="py-2.5 px-2 font-mono font-black text-[#0B5D32] tabular-nums whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span>#{sale.receiptNumber}</span>
                                {retStatus === 'full' && (
                                  <span className="text-[9.5px] font-sans font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                                    {isAr ? 'مرتجع كامل' : 'Returned'}
                                  </span>
                                )}
                                {retStatus === 'partial' && (
                                  <span className="text-[9.5px] font-sans font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
                                    {isAr ? 'مرتجع جزئي' : 'Partial'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-2 font-bold text-[#142018]">
                              {sale.customerName}
                            </td>
                            <td className="py-2.5 px-2 text-[#4B6352]">
                              {sale.orderMode === 'online_order'
                                ? isAr
                                  ? 'طلب أونلاين'
                                  : 'Online'
                                : sale.orderMode === 'take_away'
                                ? isAr
                                  ? 'سفري'
                                  : 'Take Away'
                                : isAr
                                ? 'بيع مباشر'
                                : 'In Store'}
                            </td>
                            <td className="py-2.5 px-2 text-[#4B6352]">
                              <span className="inline-flex items-center gap-1">
                                {sale.paymentType === 'card' ? (
                                  <CreditCard className="w-3 h-3 text-[#0B5D32]" />
                                ) : sale.paymentType === 'credit_ledger' ? (
                                  <BookOpen className="w-3 h-3 text-amber-600" />
                                ) : (
                                  <Banknote className="w-3 h-3 text-[#0B5D32]" />
                                )}
                                <span>
                                  {sale.paymentType === 'card'
                                    ? isAr
                                      ? 'بطاقة'
                                      : 'Card'
                                    : sale.paymentType === 'credit_ledger'
                                    ? isAr
                                      ? 'آجل'
                                      : 'Credit'
                                    : isAr
                                    ? 'نقدي'
                                    : 'Cash'}
                                </span>
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-[#4B6352] max-w-[220px] truncate">
                              {sale.items
                                .map((it) => `${it.productName} (×${it.quantity})`)
                                .join(' · ')}
                            </td>
                            {!isCashierMode && (
                              <td className="py-2.5 px-2 text-end font-mono font-bold text-[#008A3C] tabular-nums">
                                +{formatCurrency(sale.profitIQD, currency, language)}
                              </td>
                            )}
                            <td className="py-2.5 px-2 text-end font-mono font-black text-[#142018] tabular-nums">
                              {formatCurrency(sale.totalIQD, currency, language)}
                            </td>
                            <td className="py-2.5 px-2 text-end">
                              <button
                                type="button"
                                disabled={retStatus === 'full'}
                                onClick={() => openReturnModal(sale)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold border transition whitespace-nowrap ${
                                  retStatus === 'full'
                                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 cursor-pointer'
                                }`}
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>{retStatus === 'full' ? (isAr ? 'مُسترجَع' : 'Done') : (isAr ? 'إرجاع' : 'Return')}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ) : reportTab === 'returns' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead>
                    <tr className="border-b border-[#EAEFEA] text-[#5F7164] font-bold">
                      <th className="py-2.5 px-2 text-start">{isAr ? 'رقم المرتجع' : 'Return #'}</th>
                      <th className="py-2.5 px-2 text-start">{isAr ? 'الفاتورة الأصلية' : 'Receipt #'}</th>
                      <th className="py-2.5 px-2 text-start">{isAr ? 'الزبون' : 'Customer'}</th>
                      <th className="py-2.5 px-2 text-start">{isAr ? 'الأصناف والحالة' : 'Items & Condition'}</th>
                      <th className="py-2.5 px-2 text-start">{isAr ? 'طريقة الاسترداد' : 'Refund'}</th>
                      <th className="py-2.5 px-2 text-start">{isAr ? 'السبب' : 'Reason'}</th>
                      <th className="py-2.5 px-2 text-end">{isAr ? 'المبلغ المسترد' : 'Refunded'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F3EE]">
                    {filteredPOSReturns.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[#5F7164] space-y-2">
                          <div>{isAr ? 'لا توجد مرتجعات زبائن مسجلة حتى الآن' : 'No customer returns recorded yet'}</div>
                          <button
                            type="button"
                            onClick={() => openReturnModal()}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{isAr ? 'تسجيل أول عملية إرجاع' : 'Record First Return'}</span>
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredPOSReturns.map((ret) => {
                        const restocked = ret.items.every((it) => it.restockToShelf);
                        return (
                          <tr key={ret.id} className="hover:bg-[#F9FAF6] transition">
                            <td className="py-2.5 px-2 font-mono font-black text-amber-700 tabular-nums whitespace-nowrap">
                              #{ret.returnNumber}
                            </td>
                            <td className="py-2.5 px-2 font-mono text-[#4B6352] tabular-nums whitespace-nowrap">
                              {ret.originalReceiptNumber ? `#${ret.originalReceiptNumber}` : (isAr ? 'مرتجع مباشر' : 'Direct')}
                            </td>
                            <td className="py-2.5 px-2 font-bold text-[#142018]">
                              {ret.customerName}
                            </td>
                            <td className="py-2.5 px-2 text-[#4B6352]">
                              <div className="font-semibold text-[#142018] max-w-[230px] truncate">
                                {ret.items.map((it) => `${it.productName} (×${it.quantity})`).join(' · ')}
                              </div>
                              <span
                                className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  restocked
                                    ? 'bg-[#ECFDF5] text-[#065F46]'
                                    : 'bg-red-50 text-red-700'
                                }`}
                              >
                                {restocked
                                  ? isAr
                                    ? 'سليم — أُعيد للمخزون'
                                    : 'Restocked to Shelf'
                                  : isAr
                                  ? 'تالف — لم يُضف للرف'
                                  : 'Damaged — Not Restocked'}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-[#4B6352] whitespace-nowrap">
                              {ret.refundMethod === 'card'
                                ? isAr
                                  ? 'بطاقة'
                                  : 'Card'
                                : ret.refundMethod === 'credit_ledger'
                                ? isAr
                                  ? 'آجل'
                                  : 'Ledger'
                                : isAr
                                ? 'نقدي'
                                : 'Cash'}
                            </td>
                            <td className="py-2.5 px-2 text-[#5F7164] max-w-[160px] truncate">
                              {ret.reason}
                            </td>
                            <td className="py-2.5 px-2 text-end font-mono font-black text-red-700 tabular-nums whitespace-nowrap">
                              -{formatCurrency(ret.totalRefundIQD, currency, language)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Inventory Management & Reorder Threshold Table */
              <div className="divide-y divide-[#EAEFEA] text-xs">
                {filteredReportInventory.map((item) => {
                  const isAlert = item.stockQuantity <= item.reorderLevel;
                  const isCritical = item.stockQuantity <= 2 || item.stockQuantity === 0;
                  const isEditing = editingBarcode === item.barcode;
                  const unitMargin = item.retailSellingPriceIQD - (item.costPriceIQD || 0);

                  return (
                    <div
                      key={item.id}
                      className={`py-3 px-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl transition ${
                        isCritical
                          ? 'bg-red-50/50'
                          : isAlert
                          ? 'bg-amber-50/40'
                          : 'hover:bg-[#F9FAF6]'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-white border border-[#DCE5DC] p-1 shrink-0 flex items-center justify-center">
                          <img
                            src={resolveItemImage(item.barcode, item.category)}
                            alt={item.productName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain mix-blend-multiply"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-[#142018] truncate">
                              {isAr ? item.productName : getLocalizedText(item.productName, 'en')}
                            </h4>
                            <span className="font-mono text-[10px] text-[#5F7164]">
                              {item.barcode}
                            </span>
                            {isCritical ? (
                              <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                                {isAr ? 'مخزون حرج' : 'Critical'}
                              </span>
                            ) : isAlert ? (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                                {isAr ? 'تحت حد التنبيه' : 'Low Stock'}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-[#0B5D32] bg-[#ECFDF5] px-1.5 py-0.5 rounded">
                                {isAr ? 'سليم' : 'Healthy'}
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-[#5F7164] mt-1 flex flex-wrap items-center gap-2 tabular-nums">
                            <span>
                              {isAr ? 'بالرف: ' : 'Stock: '}
                              <strong className={isAlert ? 'text-red-700' : 'text-[#0B5D32]'}>
                                {item.stockQuantity}
                              </strong>{' '}
                              {isAr ? item.unit : getLocalizedText(item.unit, 'en')}
                            </span>
                            <span>·</span>
                            <span>
                              {isAr ? 'البيع: ' : 'Retail: '}
                              <strong className="font-mono text-[#142018]">
                                {formatCurrency(item.retailSellingPriceIQD, currency, language)}
                              </strong>
                            </span>
                            {!isCashierMode && (
                              <>
                                <span>·</span>
                                <span className="text-[#008A3C] font-semibold">
                                  {isAr ? 'ربح الوحدة: ' : 'Profit: '}
                                  +{formatCurrency(unitMargin, currency, language)}
                                </span>
                              </>
                            )}
                            <span>·</span>

                            {isEditing ? (
                              <div className="inline-flex items-center gap-1 bg-white border border-[#0B5D32] rounded-md px-1.5 py-0.5">
                                <span className="text-[10px] text-[#0B5D32] font-bold">
                                  {isAr ? 'حد التنبيه:' : 'Min:'}
                                </span>
                                <input
                                  type="number"
                                  min="1"
                                  max="500"
                                  value={tempThreshold}
                                  onChange={(e) => setTempThreshold(Number(e.target.value))}
                                  className="w-12 text-center text-xs font-bold border border-gray-200 rounded px-1"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveThreshold(item.barcode)}
                                  disabled={updatingBarcode === item.barcode}
                                  className="px-1.5 py-0.5 bg-[#0B5D32] text-white rounded text-[10px] cursor-pointer"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingBarcode(null)}
                                  className="text-gray-500 text-[10px] px-1 cursor-pointer"
                                >
                                  {isAr ? 'إلغاء' : 'Cancel'}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingBarcode(item.barcode);
                                  setTempThreshold(item.reorderLevel);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] text-[#0B5D32] bg-[#EFFAF3] hover:bg-[#DCFCE7] px-2 py-0.5 rounded-md cursor-pointer transition"
                              >
                                <Sliders className="w-3 h-3" />
                                <span>
                                  {isAr ? `حد التنبيه: ${item.reorderLevel}` : `Min: ${item.reorderLevel}`}
                                </span>
                                <Edit2 className="w-2.5 h-2.5 opacity-60" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                        <button
                          type="button"
                          onClick={() => handleSimulateDrop(item.barcode, 5)}
                          disabled={updatingBarcode === item.barcode || item.stockQuantity <= 0}
                          className="px-2.5 py-1.5 rounded-full border border-[#DCE5DC] text-[#4B6352] hover:bg-gray-100 text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40 whitespace-nowrap"
                        >
                          <TrendingDown className="w-3 h-3 text-red-500" />
                          <span>{isAr ? '-5 تجربة' : '-5 Test'}</span>
                        </button>

                        {!isCashierMode && (
                          <button
                            type="button"
                            onClick={() => triggerWholesaleReorder(item.barcode)}
                            className="px-3 py-1.5 rounded-full bg-[#0B5D32] hover:bg-[#084725] text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                          >
                            <Sparkles className="w-3 h-3 text-[#FFE600]" />
                            <span>{isAr ? 'طلب جملة' : 'Reorder'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= POS BARCODE SCANNER MODAL ================= */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto border border-[#DCE5DC] font-brand">
            <div className="bg-[#0B5D32] text-white p-4 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                  <ScanBarcode className="w-5 h-5 text-[#FFE600]" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black">
                    {isAr ? 'قارئ باركود الكاشير السريع' : 'POS Barcode Scanner'}
                  </h2>
                  <p className="text-[11px] text-emerald-100">
                    {isAr
                      ? 'امسح باركود الصنف بالكاميرا أو أدخل الرقم للإضافة الفورية للفاتورة'
                      : 'Scan product barcode with camera or enter code to add directly to receipt'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsScannerOpen(false)}
                className="w-8 h-8 rounded-full bg-black/25 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer shrink-0"
                aria-label={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
              {/* Camera Viewfinder */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 h-44 sm:h-48 flex flex-col items-center justify-center text-white">
                {scannerCameraActive ? (
                  <>
                    <video
                      ref={scannerVideoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-56 h-28 border-2 border-[#10B981] rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                        <div className="absolute inset-x-2 top-1/2 h-0.5 bg-[#FFE600] shadow-[0_0_8px_#FFE600]" />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={stopScannerCamera}
                      className="absolute bottom-3 start-3 bg-black/75 hover:bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full cursor-pointer"
                    >
                      {isAr ? 'إيقاف الكاميرا' : 'Stop Camera'}
                    </button>
                  </>
                ) : (
                  <div className="text-center px-4 space-y-2.5">
                    <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mx-auto">
                      <Camera className="w-5 h-5 text-[#FFE600]" />
                    </div>
                    <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                      {isAr
                        ? 'فعّل الكاميرا لقراءة باركود المنتج وإضافته تلقائياً إلى الفاتورة'
                        : 'Activate camera to scan barcode and add item directly to receipt'}
                    </p>
                    <button
                      type="button"
                      onClick={startScannerCamera}
                      className="px-4 py-2 rounded-full bg-[#0B5D32] hover:bg-[#084725] text-white text-xs font-black inline-flex items-center gap-2 transition shadow-md cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{isAr ? 'تشغيل كاميرا الباركود' : 'Start Barcode Camera'}</span>
                    </button>
                  </div>
                )}
              </div>

              {scannerCameraError && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-2.5 text-[11px]">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{scannerCameraError}</span>
                </div>
              )}

              {/* Live Scanner Feedback */}
              {scannerFeedback && (
                <div
                  className={`rounded-xl p-2.5 border text-xs flex items-center justify-between gap-2 ${
                    scannerFeedback.type === 'success'
                      ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                      : scannerFeedback.type === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <span className="font-bold">{scannerFeedback.text}</span>
                  {!isCashierMode && scannerFeedback.reorderBarcode && (
                    <button
                      type="button"
                      onClick={() => {
                        const bc = scannerFeedback.reorderBarcode!;
                        setIsScannerOpen(false);
                        triggerWholesaleReorder(bc);
                      }}
                      className="px-2.5 py-1 rounded-full bg-[#0B5D32] text-white text-[10.5px] font-bold shrink-0 cursor-pointer"
                    >
                      {isAr ? 'اطلب جملة' : 'Reorder'}
                    </button>
                  )}
                </div>
              )}

              {/* Manual / Hardware Scanner Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  processScannedBarcode(scannerCode);
                }}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#142018]">
                    {isAr ? 'أو أدخل رقم الباركود يدوياً:' : 'Or enter barcode manually:'}
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#5F7164] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={continuousScan}
                      onChange={(e) => setContinuousScan(e.target.checked)}
                      className="accent-[#0B5D32]"
                    />
                    <span>{isAr ? 'مسح متواصل' : 'Continuous scan'}</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={scannerCode}
                    onChange={(e) => setScannerCode(e.target.value)}
                    placeholder={isAr ? 'مثال: 6281007000123' : 'e.g. 6281007000123'}
                    className="flex-1 bg-[#F8FAF7] border border-[#DCE5DC] focus:border-[#0B5D32] rounded-full px-4 py-2 text-xs font-mono text-[#142018] focus:bg-white focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={!scannerCode.trim()}
                    className="px-4 py-2 rounded-full bg-[#0B5D32] hover:bg-[#084725] disabled:bg-gray-300 text-white text-xs font-black cursor-pointer whitespace-nowrap"
                  >
                    {isAr ? 'إضافة للفاتورة' : 'Add to Receipt'}
                  </button>
                </div>
              </form>

              {/* Quick Tap Store Inventory Barcodes */}
              <div className="pt-2 border-t border-[#EAEFEA] space-y-2">
                <span className="text-[11px] font-bold text-[#5F7164] block">
                  {isAr ? 'مسح سريع لأصناف المتجر (اضغط لتجربة المسح):' : 'Quick scan store items (tap to scan):'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                  {inventory.slice(0, 6).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => processScannedBarcode(item.barcode)}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl border border-[#DCE5DC] bg-[#F8FAF7] hover:border-[#0B5D32] hover:bg-[#EFF7F1] text-start transition cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-[#142018] truncate">
                          {isAr ? item.productName : getLocalizedText(item.productName, 'en')}
                        </div>
                        <div className="text-[9.5px] font-mono text-[#5F7164] truncate">
                          {item.barcode}
                        </div>
                      </div>
                      <span className="text-[10.5px] font-black text-[#0B5D32] shrink-0">
                        + {isAr ? 'مسح' : 'Scan'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ================= RETAIL CUSTOMER RETURN MODAL ================= */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto border border-[#DCE5DC] font-brand">
            <div className="bg-[#0B5D32] text-white p-4 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5 text-[#FFE600]" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black">
                    {isAr ? 'مرتجع مبيعات الزبائن وإعادة المخزون' : 'Retail Customer Return & Restock'}
                  </h2>
                  <p className="text-[11px] text-emerald-100">
                    {isAr
                      ? 'إرجاع منتج من فاتورة أو مباشرة مع تحديث رصيد الرف وإيراد الكاشير تلقائياً'
                      : 'Return items by receipt or directly and update shelf stock automatically'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="w-8 h-8 rounded-full bg-black/25 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer shrink-0"
                aria-label={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPOSReturn} className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Return Mode Tabs */}
              <div className="grid grid-cols-2 gap-1.5 bg-[#F4F4EA] p-1 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setReturnMode('by_receipt');
                    setReturnError(null);
                  }}
                  className={`py-2 px-3 rounded-xl transition cursor-pointer ${
                    returnMode === 'by_receipt'
                      ? 'bg-white text-[#0B5D32] shadow-2xs border border-[#DCE5DC]'
                      : 'text-[#5F7164] hover:text-[#142018]'
                  }`}
                >
                  {isAr ? 'إرجاع من فاتورة سابقة' : 'Return from Receipt'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReturnMode('direct_item');
                    setReturnError(null);
                  }}
                  className={`py-2 px-3 rounded-xl transition cursor-pointer ${
                    returnMode === 'direct_item'
                      ? 'bg-white text-[#0B5D32] shadow-2xs border border-[#DCE5DC]'
                      : 'text-[#5F7164] hover:text-[#142018]'
                  }`}
                >
                  {isAr ? 'إرجاع سريع بالصنف (بدون فاتورة)' : 'Direct Product Return'}
                </button>
              </div>

              {returnError && (
                <div className="rounded-xl p-2.5 bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{returnError}</span>
                </div>
              )}

              {returnMode === 'by_receipt' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#142018] mb-1.5">
                      {isAr ? 'اختر الفاتورة الأصلية:' : 'Select Original Receipt:'}
                    </label>
                    {salesHistory.length === 0 ? (
                      <div className="p-3 rounded-xl bg-[#F8FAF7] border border-[#DCE5DC] text-xs text-[#5F7164]">
                        {isAr
                          ? 'لا توجد فواتير مبيعات بعد — يمكنك استخدام "إرجاع سريع بالصنف" أعلاه.'
                          : 'No sales receipts yet — switch to Direct Product Return above.'}
                      </div>
                    ) : (
                      <select
                        value={selectedReceiptNo}
                        onChange={(e) => handleSelectReturnReceipt(Number(e.target.value))}
                        className="w-full bg-[#F8FAF7] border border-[#DCE5DC] focus:border-[#0B5D32] rounded-xl px-3 py-2 text-xs font-bold text-[#142018] focus:bg-white focus:outline-hidden"
                      >
                        {salesHistory.map((sale) => {
                          const status = getReceiptReturnStatus(sale);
                          return (
                            <option key={sale.id} value={sale.receiptNumber}>
                              #{sale.receiptNumber} — {sale.customerName} (
                              {formatCurrency(sale.totalIQD, currency, language)})
                              {status === 'full'
                                ? isAr
                                  ? ' [مرتجع بالكامل]'
                                  : ' [Fully Returned]'
                                : status === 'partial'
                                ? isAr
                                  ? ' [مرتجع جزئي]'
                                  : ' [Partial]'
                                : ''}
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>

                  {selectedReceiptObj && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#5F7164]">
                        <span>{isAr ? 'حدد الأصناف والكميات المرتجعة:' : 'Select items & return quantities:'}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const allMap: Record<string, number> = {};
                            for (const l of selectedReceiptLines) {
                              allMap[l.barcode] = l.maxReturnable;
                            }
                            setReceiptReturnQtyMap(allMap);
                          }}
                          className="text-[#0B5D32] hover:underline cursor-pointer"
                        >
                          {isAr ? 'تحديد كامل الكمية المتبقية' : 'Select All Remaining'}
                        </button>
                      </div>

                      <div className="divide-y divide-[#EAEFEA] border border-[#DCE5DC] rounded-2xl bg-[#F8FAF7] max-h-48 overflow-y-auto">
                        {selectedReceiptLines.map((line) => (
                          <div
                            key={line.barcode}
                            className="p-2.5 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-[#142018] truncate">
                                {isAr ? line.productName : getLocalizedText(line.productName, 'en')}
                              </div>
                              <div className="text-[10.5px] text-[#5F7164] tabular-nums mt-0.5 flex flex-wrap gap-2">
                                <span>
                                  {isAr ? `مباع: ${line.quantity}` : `Sold: ${line.quantity}`}
                                </span>
                                {line.alreadyReturned > 0 && (
                                  <span className="text-amber-700 font-bold">
                                    {isAr
                                      ? `مُرجع سابقاً: ${line.alreadyReturned}`
                                      : `Returned: ${line.alreadyReturned}`}
                                  </span>
                                )}
                                <span className="font-mono font-bold text-[#0B5D32]">
                                  {formatCurrency(line.effectiveUnitIQD, currency, language)}
                                </span>
                              </div>
                            </div>

                            {line.maxReturnable === 0 ? (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-1 rounded-full shrink-0">
                                {isAr ? 'مُرجع بالكامل' : 'Returned'}
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5 bg-white border border-[#DCE5DC] rounded-full p-0.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReceiptReturnQtyMap((prev) => ({
                                      ...prev,
                                      [line.barcode]: Math.max(0, (prev[line.barcode] || 0) - 1)
                                    }))
                                  }
                                  className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#142018] cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center font-mono font-black text-xs tabular-nums">
                                  {line.selectedQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReceiptReturnQtyMap((prev) => ({
                                      ...prev,
                                      [line.barcode]: Math.min(
                                        line.maxReturnable,
                                        (prev[line.barcode] || 0) + 1
                                      )
                                    }))
                                  }
                                  className="w-6 h-6 rounded-full bg-[#0B5D32] text-white hover:bg-[#084725] flex items-center justify-center cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#142018] mb-1.5">
                      {isAr ? 'ابحث واختر المنتج المراد إرجاعه:' : 'Search & Select Product to Return:'}
                    </label>
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-[#5F7164] absolute start-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={directReturnSearch}
                        onChange={(e) => setDirectReturnSearch(e.target.value)}
                        placeholder={isAr ? 'اسم المنتج أو الباركود...' : 'Product name or barcode...'}
                        className="w-full rounded-full border border-[#DCE5DC] bg-[#F8FAF7] focus:bg-white py-1.5 ps-8 pe-3 text-xs focus:outline-hidden focus:border-[#0B5D32]"
                      />
                    </div>
                    <select
                      value={selectedDirectItem?.barcode || ''}
                      onChange={(e) => setDirectReturnBarcode(e.target.value)}
                      className="w-full bg-[#F8FAF7] border border-[#DCE5DC] focus:border-[#0B5D32] rounded-xl px-3 py-2 text-xs font-bold text-[#142018] focus:bg-white focus:outline-hidden"
                    >
                      {filteredDirectReturnInventory.map((item) => (
                        <option key={item.id} value={item.barcode}>
                          {isAr ? item.productName : getLocalizedText(item.productName, 'en')} —{' '}
                          {formatCurrency(item.retailSellingPriceIQD, currency, language)} (
                          {isAr ? `الرف الحالي: ${item.stockQuantity}` : `Stock: ${item.stockQuantity}`})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between bg-[#F8FAF7] border border-[#DCE5DC] rounded-2xl p-3">
                    <div>
                      <div className="text-xs font-bold text-[#142018]">
                        {isAr ? 'الكمية المرتجعة:' : 'Return Quantity:'}
                      </div>
                      <div className="text-[10.5px] text-[#5F7164]">
                        {selectedDirectItem
                          ? isAr
                            ? `سعر الوحدة: ${formatCurrency(selectedDirectItem.retailSellingPriceIQD, currency, language)}`
                            : `Unit Price: ${formatCurrency(selectedDirectItem.retailSellingPriceIQD, currency, language)}`
                          : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-[#DCE5DC] rounded-full p-1">
                      <button
                        type="button"
                        onClick={() => setDirectReturnQty((q) => Math.max(1, q - 1))}
                        className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-mono font-black text-sm tabular-nums">
                        {directReturnQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDirectReturnQty((q) => Math.min(100, q + 1))}
                        className="w-7 h-7 rounded-full bg-[#0B5D32] text-white hover:bg-[#084725] flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Condition: Restock vs Damaged */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#142018]">
                  {isAr ? 'حالة البضاعة المرتجعة:' : 'Returned Item Condition:'}
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setReturnRestockToShelf(true)}
                    className={`p-2.5 rounded-2xl border text-start transition cursor-pointer ${
                      returnRestockToShelf
                        ? 'bg-[#ECFDF5] border-[#0B5D32] text-[#065F46]'
                        : 'bg-[#F8FAF7] border-[#DCE5DC] text-[#5F7164]'
                    }`}
                  >
                    <div className="font-black">
                      {isAr ? '✓ سليم — يعاد للمخزون' : '✓ Good — Restock'}
                    </div>
                    <div className="text-[10px] font-normal mt-0.5 opacity-85">
                      {isAr ? 'تُضاف الكمية تلقائياً لرصيد الرف' : 'Added back to shelf stock'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReturnRestockToShelf(false)}
                    className={`p-2.5 rounded-2xl border text-start transition cursor-pointer ${
                      !returnRestockToShelf
                        ? 'bg-red-50 border-red-400 text-red-900'
                        : 'bg-[#F8FAF7] border-[#DCE5DC] text-[#5F7164]'
                    }`}
                  >
                    <div className="font-black">
                      {isAr ? '✕ تالف / مفتوح — لا يعاد' : '✕ Damaged — Do Not Restock'}
                    </div>
                    <div className="text-[10px] font-normal mt-0.5 opacity-85">
                      {isAr ? 'يُسجل استرداد مالي دون زيادة المخزون' : 'Refunds cash without inflating stock'}
                    </div>
                  </button>
                </div>
              </div>

              {/* Refund Method & Customer Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#142018] mb-1">
                    {isAr ? 'طريقة استرداد المبلغ:' : 'Refund Method:'}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
                    {(
                      [
                        { id: 'cash', ar: 'نقدي', en: 'Cash' },
                        { id: 'card', ar: 'بطاقة', en: 'Card' },
                        { id: 'credit_ledger', ar: 'دفتر', en: 'Ledger' }
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setReturnRefundMethod(m.id)}
                        className={`py-2 rounded-xl border transition cursor-pointer ${
                          returnRefundMethod === m.id
                            ? 'bg-[#0B5D32] text-white border-[#0B5D32]'
                            : 'bg-[#F8FAF7] text-[#4B6352] border-[#DCE5DC]'
                        }`}
                      >
                        {isAr ? m.ar : m.en}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#142018] mb-1">
                    {isAr ? 'اسم الزبون (اختياري):' : 'Customer Name (Optional):'}
                  </label>
                  <input
                    type="text"
                    value={returnCustomerName}
                    onChange={(e) => setReturnCustomerName(e.target.value)}
                    placeholder={isAr ? 'زبون نقدي' : 'Walk-in Customer'}
                    className="w-full bg-[#F8FAF7] border border-[#DCE5DC] focus:border-[#0B5D32] rounded-xl px-3 py-1.5 text-xs text-[#142018] focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Quick Reason Chips + Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#142018]">
                  {isAr ? 'سبب الإرجاع:' : 'Return Reason:'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(isAr
                    ? ['تبديل / تغيير رأي الزبون', 'تلف أو فتح العبوة', 'قرب انتهاء الصلاحية', 'خطأ في السعر أو المسح']
                    : ['Customer changed mind', 'Damaged packaging', 'Near expiry', 'Pricing/scan error']
                  ).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setReturnReason(preset);
                        if (preset.includes('تلف') || preset.toLowerCase().includes('damaged')) {
                          setReturnRestockToShelf(false);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold border transition cursor-pointer ${
                        returnReason === preset
                          ? 'bg-amber-100 border-amber-400 text-amber-900'
                          : 'bg-[#F8FAF7] border-[#DCE5DC] text-[#5F7164] hover:text-[#142018]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder={isAr ? 'اكتب سبب الإرجاع...' : 'Enter return reason...'}
                  className="w-full bg-[#F8FAF7] border border-[#DCE5DC] focus:border-[#0B5D32] rounded-xl px-3 py-1.5 text-xs text-[#142018] focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Refund Summary & Submit */}
              <div className="rounded-2xl bg-[#F4F4EA] border border-[#DCE5DC] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold text-[#5F7164]">
                    {isAr ? 'إجمالي المبلغ الواجب إرجاعه للزبون:' : 'Total Refund Amount:'}
                  </div>
                  <div className="text-lg font-black font-mono tabular-nums text-[#0B5D32]">
                    {formatCurrency(returnPayloadSummary.totalRefundIQD, currency, language)}
                  </div>
                  <div className="text-[10.5px] text-[#4B6352] font-semibold">
                    {returnPayloadSummary.totalUnits > 0
                      ? returnRestockToShelf
                        ? isAr
                          ? `سيتم إعادة ${returnPayloadSummary.totalUnits} وحدة إلى المخزون فور التأكيد`
                          : `${returnPayloadSummary.totalUnits} unit(s) will return to stock`
                        : isAr
                        ? `${returnPayloadSummary.totalUnits} وحدة تالفة — لن تُعاد للمخزون`
                        : `${returnPayloadSummary.totalUnits} damaged unit(s) — no restock`
                      : isAr
                      ? 'يرجى تحديد كمية للإرجاع'
                      : 'Select at least 1 unit to return'}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReturn || returnPayloadSummary.items.length === 0}
                  className="px-5 py-2.5 rounded-full bg-[#0B5D32] hover:bg-[#084725] disabled:bg-gray-300 text-white text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>
                    {isSubmittingReturn
                      ? isAr
                        ? 'جاري التنفيذ...'
                        : 'Processing...'
                      : isAr
                      ? 'تأكيد الإرجاع'
                      : 'Confirm Return'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
