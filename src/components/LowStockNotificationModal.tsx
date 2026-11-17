import React, { useState, useMemo } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Bell,
  Check,
  ShoppingCart,
  Clock,
  Sliders,
  RefreshCw,
  TrendingDown,
  Building2,
  PackageCheck
} from 'lucide-react';
import { Currency, ProductWithOffers, SupplierOfferItem, Language } from '../types/index.ts';
import { formatCurrency } from '../utils/format.ts';
import { getLocalizedText } from '../utils/translations.ts';
import { fetchWithRetry } from '../utils/fetchWithRetry.ts';

export interface LowStockAlertItem {
  id: string;
  inventoryId: string;
  barcode: string;
  productName: string;
  category: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  urgency: 'critical' | 'warning' | 'attention';
  daysRemaining: number;
  recommendedReorderQty: number;
  bestOffer: {
    offerId: string;
    supplierId: string;
    supplierName: string;
    priceIQD: number;
    deliveryDays: number;
    availableStock: number;
  } | null;
}

interface LowStockNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  alerts: LowStockAlertItem[];
  products: ProductWithOffers[];
  onAddToCart: (product: ProductWithOffers, offer: SupplierOfferItem, quantity: number) => void;
  onRefreshAlerts: () => void;
  language?: Language;
  isCashierMode?: boolean;
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

export const LowStockNotificationModal: React.FC<LowStockNotificationModalProps> = ({
  isOpen,
  onClose,
  currency,
  alerts,
  products,
  onAddToCart,
  onRefreshAlerts,
  language = 'ar',
  isCashierMode = false
}) => {
  const isAr = language === 'ar';
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'critical' | 'warning'>('all');
  const [editingBarcode, setEditingBarcode] = useState<string | null>(null);
  const [newThresholdInput, setNewThresholdInput] = useState<number>(5);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [savingBarcode, setSavingBarcode] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const resolveProductImage = (barcode: string, category: string) => {
    const matched = products.find((p) => p.barcode === barcode);
    if (matched?.imageUrl) return matched.imageUrl;
    return CATEGORY_FALLBACK_IMAGES[category] || '/assets/images/white_basmati_rice.jpg';
  };

  const criticalCount = useMemo(() => alerts.filter((a) => a.urgency === 'critical').length, [alerts]);
  const warningCount = useMemo(() => alerts.filter((a) => a.urgency === 'warning').length, [alerts]);

  const filteredAlerts = useMemo(() => {
    if (urgencyFilter === 'critical') return alerts.filter((a) => a.urgency === 'critical');
    if (urgencyFilter === 'warning') return alerts.filter((a) => a.urgency === 'warning');
    return alerts;
  }, [alerts, urgencyFilter]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback((curr) => (curr?.text === text ? null : curr));
    }, 3500);
  };

  // Quick reorder action
  const handleQuickReorder = (alert: LowStockAlertItem) => {
    const product = products.find((p) => p.barcode === alert.barcode);
    if (!product || !alert.bestOffer) return;

    const offer = product.offers.find((o) => o.id === alert.bestOffer?.offerId) || product.offers[0];
    if (offer) {
      onAddToCart(product, offer, alert.recommendedReorderQty);
      showToast(
        'success',
        isAr
          ? `تمت إضافة ${alert.recommendedReorderQty} من (${product.nameAr}) إلى سلة الجملة من ${alert.bestOffer.supplierName}`
          : `Added ${alert.recommendedReorderQty} × ${product.nameEn || product.nameAr} to wholesale cart`
      );
    }
  };

  // Update threshold API
  const handleSaveThreshold = async (barcode: string) => {
    setSavingBarcode(barcode);
    try {
      const res = await fetchWithRetry('/api/store/inventory/store_almansoor/threshold', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode,
          reorderLevel: newThresholdInput
        }),
        retries: 1
      });
      const data = await res.json();
      if (data.success) {
        setEditingBarcode(null);
        showToast(
          'success',
          isAr
            ? `تم تحديث حد إعادة الطلب إلى ${newThresholdInput} بنجاح.`
            : `Reorder threshold updated to ${newThresholdInput}.`
        );
        onRefreshAlerts();
      } else {
        showToast('error', data.message || (isAr ? 'تعذر تحديث حد التنبيه' : 'Failed to update threshold'));
      }
    } catch (err: any) {
      showToast('error', err?.message || (isAr ? 'حدث خطأ في الاتصال بالخادم' : 'Network error'));
    } finally {
      setSavingBarcode(null);
    }
  };

  // Simulate stock drop for testing
  const handleSimulateDrop = async (barcode: string) => {
    setSimulating(barcode);
    try {
      const res = await fetchWithRetry('/api/store/inventory/store_almansoor/simulate-drop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode, amount: 2 }),
        retries: 0
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          'success',
          isAr
            ? `تم خصم قطعتين تجريبياً — المتبقي: ${data.data?.stockQuantity ?? ''}`
            : `Simulated selling 2 units — remaining: ${data.data?.stockQuantity ?? ''}`
        );
        onRefreshAlerts();
      } else {
        showToast('error', data.message || (isAr ? 'تعذر تنفيذ المحاكاة' : 'Simulation failed'));
      }
    } catch (err: any) {
      showToast('error', err?.message || (isAr ? 'حدث خطأ في الاتصال بالخادم' : 'Network error'));
    } finally {
      setSimulating(null);
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    onRefreshAlerts();
    setTimeout(() => setRefreshing(false), 600);
  };

  if (!isOpen) return null;

  return (
    <div className="bg-[#F4F4EA] rounded-3xl border border-[#DCE5DC] overflow-hidden font-brand text-[#142018] shadow-2xs">
      {/* ================= FULL-PAGE HEADER ================= */}
      <div className="p-4 sm:px-6 sm:py-5 bg-white border-b border-[#DCE5DC] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] px-3.5 py-2 rounded-full bg-[#0B5D32] hover:bg-[#084726] text-white text-xs font-black flex items-center gap-1.5 transition shadow-2xs cursor-pointer shrink-0 whitespace-nowrap"
          >
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{isAr ? 'رجوع' : 'Back'}</span>
          </button>

          <div className="w-10 h-10 rounded-2xl bg-[#EBF4EE] border border-[#DCE5DC] text-[#0B5D32] hidden sm:flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <h1 className="font-black text-base sm:text-lg text-[#0B5D32] leading-tight">
              {isAr ? 'مركز تنبيهات نقص المخزون' : 'Low Stock Alerts Center'}
            </h1>
            <p className="text-[11px] sm:text-xs text-[#5F7164] mt-0.5">
              {isCashierMode
                ? isAr
                  ? 'مراقبة كميات الرفوف وتنبيهات النفاد لإبلاغ الإدارة'
                  : 'Shelf stock monitoring — notify manager for restock'
                : isAr
                ? 'مراقبة حية لكميات الرفوف وأفضل عروض التعويض من الموردين'
                : 'Live shelf monitoring & instant wholesale supplier restock'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          className="min-h-[38px] px-3.5 py-2 rounded-full bg-[#F8FAF7] border border-[#DCE5DC] hover:border-[#0B5D32] text-[#0B5D32] text-xs font-black flex items-center gap-1.5 transition cursor-pointer shrink-0"
          title={isAr ? 'تحديث التنبيهات' : 'Refresh alerts'}
          aria-label={isAr ? 'تحديث التنبيهات' : 'Refresh alerts'}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{isAr ? 'تحديث' : 'Refresh'}</span>
        </button>
      </div>

        {/* ================= URGENCY FILTER TABS STRIP ================= */}
        <div className="px-4 sm:px-5 py-2.5 bg-[#ECEFE3] border-b border-[#DCE5DC] flex items-center justify-between gap-2 flex-wrap shrink-0">
          <div className="inline-flex items-center gap-1 bg-white border border-[#DCE5DC] rounded-full p-0.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setUrgencyFilter('all')}
              className={`px-3 py-1 rounded-full transition cursor-pointer whitespace-nowrap tabular-nums ${
                urgencyFilter === 'all'
                  ? 'bg-[#0B5D32] text-white shadow-2xs'
                  : 'text-[#4B6352] hover:text-[#142018]'
              }`}
            >
              {isAr ? `الكل (${alerts.length})` : `All (${alerts.length})`}
            </button>

            <button
              type="button"
              onClick={() => setUrgencyFilter('critical')}
              className={`px-3 py-1 rounded-full transition cursor-pointer whitespace-nowrap tabular-nums flex items-center gap-1 ${
                urgencyFilter === 'critical'
                  ? 'bg-[#DC2626] text-white shadow-2xs'
                  : 'text-[#B91C1C] hover:bg-red-50'
              }`}
            >
              <span>{isAr ? `حرج (${criticalCount})` : `Critical (${criticalCount})`}</span>
            </button>

            <button
              type="button"
              onClick={() => setUrgencyFilter('warning')}
              className={`px-3 py-1 rounded-full transition cursor-pointer whitespace-nowrap tabular-nums ${
                urgencyFilter === 'warning'
                  ? 'bg-[#D97706] text-white shadow-2xs'
                  : 'text-[#92400E] hover:bg-amber-50'
              }`}
            >
              {isAr ? `تحت الحد (${warningCount})` : `Low (${warningCount})`}
            </button>
          </div>

          <span className="text-[11px] font-bold text-[#5F7164] hidden sm:inline">
            {isAr ? 'مرتبطة تلقائياً بالكاشير' : 'Synced with POS'}
          </span>
        </div>

        {/* ================= INLINE FEEDBACK TOAST ================= */}
        {feedback && (
          <div
            className={`mx-4 sm:mx-5 mt-3 p-3 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 shrink-0 ${
              feedback.type === 'success'
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {feedback.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span className="leading-snug">{feedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="p-0.5 opacity-60 hover:opacity-100 cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ================= ALERTS LIST (Full-Page Grid) ================= */}
        <div className="p-3.5 sm:p-6">
          {filteredAlerts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#DCE5DC] py-12 px-4 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-[#EFF7F1] text-[#0B5D32] flex items-center justify-center mb-2.5">
                <PackageCheck className="w-6 h-6" />
              </div>
              <p className="font-black text-[#142018] text-sm">
                {alerts.length === 0
                  ? isAr
                    ? 'مستويات المخزون ممتازة!'
                    : 'All shelf stock levels are healthy!'
                  : isAr
                  ? 'لا توجد تنبيهات في هذا التصنيف'
                  : 'No alerts in this filter'}
              </p>
              <p className="text-xs text-[#5F7164] mt-1 max-w-xs">
                {alerts.length === 0
                  ? isAr
                    ? 'جميع المنتجات أعلى من حدود الأمان ولا توجد أي نواقص تستدعي التدخل حالياً.'
                    : 'All SKUs are above safety reorder thresholds.'
                  : isAr
                  ? 'جرّب اختيار "الكل" لعرض جميع التنبيهات النشطة.'
                  : 'Switch to "All" to view all active alerts.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
              {filteredAlerts.map((alert) => {
              const isCritical = alert.urgency === 'critical';
              const isEditing = editingBarcode === alert.barcode;
              const fillPercentage = Math.min(
                100,
                Math.max(0, Math.round((alert.currentStock / Math.max(1, alert.reorderLevel)) * 100))
              );
              const imgUrl = resolveProductImage(alert.barcode, alert.category);

              return (
                <div
                  key={alert.id}
                  className={`bg-white rounded-2xl border p-3.5 sm:p-4 space-y-3 transition-all ${
                    isCritical ? 'border-red-300/90 shadow-xs' : 'border-[#DCE5DC]'
                  }`}
                >
                  {/* Row 1: Product Cutout Thumbnail + Details */}
                  <div className="flex items-start gap-3">
                    {/* Pure White Cutout Thumbnail */}
                    <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white border border-[#EAEFEA] p-1.5 shrink-0 flex items-center justify-center">
                      <img
                        src={imgUrl}
                        alt={alert.productName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10.5px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap ${
                            isCritical
                              ? 'bg-red-50 text-[#DC2626] border border-red-200'
                              : 'bg-amber-50 text-[#B45309] border border-amber-200'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>
                            {isCritical
                              ? isAr
                                ? 'نفاد وشيك'
                                : 'Critical'
                              : isAr
                              ? 'تحت حد الطلب'
                              : 'Low Stock'}
                          </span>
                        </span>

                        <span className="text-[10.5px] font-mono text-[#5F7164] tabular-nums">
                          {alert.barcode}
                        </span>
                      </div>

                      <h4 className="font-black text-sm text-[#142018] leading-snug">
                        {isAr ? alert.productName : getLocalizedText(alert.productName, 'en')}
                      </h4>

                      {/* Clean unboxed stats row */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#5F7164] tabular-nums">
                        <span>
                          {isAr ? 'المتبقي: ' : 'Stock: '}
                          <strong className={isCritical ? 'text-[#DC2626]' : 'text-[#B45309]'}>
                            {alert.currentStock}
                          </strong>{' '}
                          {isAr ? alert.unit : getLocalizedText(alert.unit, 'en')}
                        </span>
                        <span className="text-[#CBD5CE]">·</span>
                        <span>
                          {isAr ? 'حد الأمان: ' : 'Min: '}
                          <strong className="text-[#142018]">{alert.reorderLevel}</strong>
                        </span>
                        <span className="text-[#CBD5CE]">·</span>
                        <span className="inline-flex items-center gap-1 text-[#0B5D32] font-bold">
                          <Clock className="w-3 h-3" />
                          <span>
                            {isAr ? `يكفي ${alert.daysRemaining} يوم` : `~${alert.daysRemaining}d left`}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Stock Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-2 bg-[#EEF2EE] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCritical ? 'bg-[#DC2626]' : 'bg-[#D97706]'
                        }`}
                        style={{ width: `${Math.max(8, fillPercentage)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10.5px] font-semibold text-[#5F7164] tabular-nums">
                      <span>
                        {isAr ? `نسبة التوفر: ${fillPercentage}%` : `Stock level: ${fillPercentage}%`}
                      </span>
                      <span className="text-[#0B5D32] font-bold">
                        {isAr
                          ? `المقترح للطلب: ${alert.recommendedReorderQty} وحدة`
                          : `Suggested: ${alert.recommendedReorderQty} units`}
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Best Wholesale Supplier Strip (Hidden for Restricted Cashier) */}
                  {!isCashierMode && alert.bestOffer && (
                    <div className="p-2.5 rounded-xl bg-[#F8FAF7] border border-[#DCE5DC] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-white border border-[#DCE5DC] text-[#0B5D32] flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-[#142018] truncate">
                            {alert.bestOffer.supplierName}
                          </div>
                          <div className="text-[10.5px] text-[#5F7164] font-medium">
                            {isAr
                              ? `أفضل عرض متاح · توصيل خلال ${alert.bestOffer.deliveryDays} يوم`
                              : `Best offer · Delivery in ${alert.bestOffer.deliveryDays}d`}
                          </div>
                        </div>
                      </div>

                      <div className="text-end shrink-0">
                        <div className="text-xs sm:text-sm font-black font-mono tabular-nums text-[#0B5D32] whitespace-nowrap">
                          {formatCurrency(alert.bestOffer.priceIQD, currency, language)}
                        </div>
                        <div className="text-[9.5px] text-[#5F7164] whitespace-nowrap">
                          {isAr ? 'سعر الوحدة' : 'Per unit'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Row 4: Action Controls (Matching POS Pill CTAs) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
                    {!isCashierMode ? (
                      <button
                        type="button"
                        onClick={() => handleQuickReorder(alert)}
                        disabled={!alert.bestOffer}
                        className="flex-1 py-2.5 px-4 rounded-full bg-[#0B5D32] hover:bg-[#084725] disabled:bg-[#C6D1C8] text-white text-xs font-black flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer whitespace-nowrap"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>
                          {isAr
                            ? `طلب ${alert.recommendedReorderQty} وحدة من المورد`
                            : `Order ${alert.recommendedReorderQty} units`}
                        </span>
                      </button>
                    ) : (
                      <div className="flex-1 py-2 px-3.5 rounded-full bg-[#F8FAF7] border border-[#DCE5DC] text-[#3D5244] text-[11px] font-bold flex items-center justify-center gap-1.5 text-center">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                        <span>
                          {isAr
                            ? `أبلغ الإدارة لتعويض (${alert.recommendedReorderQty} وحدة)`
                            : `Notify manager to restock (${alert.recommendedReorderQty} units)`}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1 bg-[#F8FAF7] border border-[#0B5D32] rounded-full px-2 py-1 flex-1 sm:flex-initial">
                          <span className="text-[10px] font-bold text-[#0B5D32] ps-1">
                            {isAr ? 'الحد:' : 'Min:'}
                          </span>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={newThresholdInput}
                            onChange={(e) => setNewThresholdInput(parseInt(e.target.value, 10) || 1)}
                            className="w-12 bg-white border border-[#DCE5DC] rounded-full py-0.5 text-xs font-black text-center font-mono focus:outline-hidden"
                          />
                          <button
                            type="button"
                            disabled={savingBarcode === alert.barcode}
                            onClick={() => handleSaveThreshold(alert.barcode)}
                            className="px-2.5 py-1 rounded-full bg-[#0B5D32] text-white text-[10.5px] font-bold cursor-pointer"
                          >
                            {isAr ? 'حفظ' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingBarcode(null)}
                            className="px-2 py-1 text-[#5F7164] hover:text-[#142018] text-[10.5px] font-bold cursor-pointer"
                          >
                            {isAr ? 'إلغاء' : 'Cancel'}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBarcode(alert.barcode);
                            setNewThresholdInput(alert.reorderLevel);
                          }}
                          className="flex-1 sm:flex-initial py-2 px-3 rounded-full border border-[#DCE5DC] bg-[#F8FAF7] hover:border-[#0B5D32] text-[#3D5244] text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer whitespace-nowrap"
                        >
                          <Sliders className="w-3.5 h-3.5 text-[#0B5D32]" />
                          <span>
                            {isAr ? `حد الأمان: ${alert.reorderLevel}` : `Min: ${alert.reorderLevel}`}
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleSimulateDrop(alert.barcode)}
                        disabled={simulating === alert.barcode || alert.currentStock <= 0}
                        className="py-2 px-3 rounded-full border border-[#DCE5DC] bg-[#F8FAF7] hover:bg-red-50 hover:border-red-200 text-[#4B6352] hover:text-red-700 disabled:opacity-40 text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer whitespace-nowrap"
                        title={isAr ? 'محاكاة بيع قطعتين لاختبار التنبيه' : 'Simulate selling 2 units'}
                      >
                        <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                        <span>{isAr ? '-2 تجربة' : '-2 Test'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>

        {/* ================= FOOTER ================= */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-[#DCE5DC] bg-white flex items-center justify-between gap-3 text-xs text-[#5F7164]">
          <span>
            {isAr
              ? 'يتم تحديث التنبيهات تلقائياً مع كل عملية بيع في الكاشير.'
              : 'Alerts recalculate automatically after every POS sale.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[#F4F4EA] hover:bg-[#E4E8D8] border border-[#DCE5DC] text-[#142018] font-black text-xs transition cursor-pointer shrink-0 flex items-center gap-1"
          >
            {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            <span>{isAr ? 'العودة' : 'Back'}</span>
          </button>
        </div>
    </div>
  );
};
