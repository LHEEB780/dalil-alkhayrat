import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Barcode, 
  ShoppingCart, 
  Banknote, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Calendar, 
  Clock, 
  Wifi, 
  WifiOff,
  Lock,
  PackageMinus,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { VanStockItem, Currency, OrderItem, Language } from '../types/index.ts';
import { formatCurrency } from '../utils/format.ts';
import { translations, getLocalizedText } from '../utils/translations.ts';

interface DriverVanViewProps {
  currency: Currency;
  isOnline: boolean;
  orders: OrderItem[];
  onRefreshOrders: () => void;
  language?: Language;
}

export const DriverVanView: React.FC<DriverVanViewProps> = ({
  currency,
  isOnline,
  orders,
  onRefreshOrders,
  language = 'ar'
}) => {
  const isAr = language === 'ar';
  const t = translations[language];

  const driverId = 'drv_ahmed_baghdad';
  const [vanStock, setVanStock] = useState<VanStockItem[]>([]);
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Direct sale form
  const [saleBarcode, setSaleBarcode] = useState('');
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [salePaymentType, setSalePaymentType] = useState<'cash' | 'credit'>('cash');
  const [targetStoreId, setTargetStoreId] = useState('store_almansoor');

  // Returns / Damaged form
  const [returnBarcode, setReturnBarcode] = useState('');
  const [returnQty, setReturnQty] = useState(1);
  const [returnType, setReturnType] = useState<'return' | 'damage'>('return');
  const [returnReason, setReturnReason] = useState('');

  // Daily Shift Close Modal
  const [showShiftCloseModal, setShowShiftCloseModal] = useState(false);
  const [actualCashInput, setActualCashInput] = useState('');
  const [shiftCloseResult, setShiftCloseResult] = useState<any>(null);

  // Delivery confirmation modal with PIN
  const [deliveringOrder, setDeliveringOrder] = useState<OrderItem | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const [notification, setNotification] = useState<string | null>(null);

  const loadVanData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/van/inventory/${driverId}`);
      const data = await res.json();
      if (data.success) {
        setVanStock(data.inventory);
        setDriverInfo(data.driver);
        if (data.inventory.length > 0 && !saleBarcode) {
          setSaleBarcode(data.inventory[0].barcode);
          setReturnBarcode(data.inventory[0].barcode);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVanData();
  }, []);

  // Handle Direct Instant Sale from Van
  const handleDirectSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleBarcode || saleQuantity <= 0) return;

    try {
      const res = await fetch('/api/van/direct-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          storeId: targetStoreId,
          barcode: saleBarcode,
          quantity: saleQuantity,
          paymentType: salePaymentType
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (isAr ? 'فشل البيع المباشر' : 'Direct sale failed'));
      }

      const msg = isAr
        ? `تم تسجيل بيع فوري بمبلغ ${formatCurrency(data.data.saleAmountIQD, currency, language)} وتحديث مخزون الفان.`
        : `Instant sale recorded: ${formatCurrency(data.data.saleAmountIQD, currency, language)}. Van inventory updated.`;

      setNotification(msg);
      setSaleQuantity(1);
      loadVanData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Return / Damage
  const handleLogReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnBarcode || returnQty <= 0) return;

    try {
      const res = await fetch('/api/van/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          barcode: returnBarcode,
          quantity: returnQty,
          type: returnType,
          reason: returnReason || (returnType === 'damage' ? (isAr ? 'تلف أثناء النقل' : 'Transit damage') : (isAr ? 'مرتجع متجر' : 'Store return'))
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (isAr ? 'فشل قيد المرتجع' : 'Failed to log return'));
      }

      const msg = isAr
        ? `تم تسجيل ${returnType === 'damage' ? 'تالف' : 'مرتجع'} للسلعة وتحديث عهدة الفان.`
        : `Successfully recorded ${returnType === 'damage' ? 'damaged' : 'returned'} goods. Stock adjusted.`;

      setNotification(msg);
      setReturnQty(1);
      setReturnReason('');
      loadVanData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Verify PIN for delivery
  const handleVerifyDeliveryPin = async () => {
    if (!deliveringOrder || !enteredPin) return;

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
        setPinError(data.message || (isAr ? 'رمز التحقق (PIN) غير صحيح! اطلب الرمز الصحيح من المحل.' : 'Invalid delivery PIN. Please ask the store owner for the correct PIN.'));
        return;
      }

      const msg = isAr
        ? `تم تسليم الطلبية ${deliveringOrder.id} بنجاح وقبض كاش ${formatCurrency(deliveringOrder.subtotalIQD, currency, language)}.`
        : `Order ${deliveringOrder.id} delivered successfully. Collected ${formatCurrency(deliveringOrder.subtotalIQD, currency, language)}.`;

      setNotification(msg);
      setDeliveringOrder(null);
      setEnteredPin('');
      setPinError(null);
      onRefreshOrders();
      loadVanData();
    } catch (err: any) {
      setPinError(err.message);
    }
  };

  // Handle Daily Shift Close
  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const actualCash = parseFloat(actualCashInput);
    if (isNaN(actualCash) || actualCash < 0) {
      alert(isAr ? 'يرجى إدخال مبلغ صحيح' : 'Please enter a valid cash amount');
      return;
    }

    try {
      const res = await fetch('/api/van/shift-close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          actualCashIQD: actualCash
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (isAr ? 'فشل إغلاق الوردية' : 'Failed to close shift'));
      }

      setShiftCloseResult(data.data);
      loadVanData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const assignedOrders = orders.filter(o => o.assignedDriverId === driverId && o.status !== 'cancelled');

  // Localized driver display info
  const displayDriverName = isAr 
    ? (driverInfo?.name || t.driverDefaultName) 
    : 'Ahmed Kazem Al-Baghdadi';

  const displayVehiclePlate = isAr 
    ? (driverInfo?.vehiclePlate || t.driverDefaultPlate) 
    : 'Baghdad 48215 T';

  const displayVanWarehouse = isAr 
    ? (driverInfo?.vanWarehouseName || t.driverDefaultVan) 
    : 'Van #1 - Karkh & Mansoor District';

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12 font-brand">
      
      {/* Driver Mobile Mode Header (Green Card from Screenshot) */}
      <div className="bg-[#00A046] text-white rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6 text-[#FFE600]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black">{displayDriverName}</h1>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                  {displayVehiclePlate}
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                {isAr ? 'مستودع الفان المتنقل | ' : 'Mobile Van Warehouse | '}
                {displayVanWarehouse}
              </p>
            </div>
          </div>

          <div className={isAr ? 'text-left' : 'text-right'}>
            <span className="text-[11px] text-emerald-200 block">{t.cashInCustody}</span>
            <span className="text-lg font-black font-mono">
              {formatCurrency(driverInfo?.currentCashCollectedIQD || 0, currency, language)}
            </span>
          </div>
        </div>

        {/* Offline sync banner if offline */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-white/15 text-xs gap-2">
          <div className="flex items-center gap-1.5">
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-200">
                <Wifi className="w-3.5 h-3.5" />
                <span>{t.connectedToSupplier}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-300 font-bold">
                <WifiOff className="w-3.5 h-3.5" />
                <span>{t.offlineDriverBanner}</span>
              </span>
            )}
          </div>

          <button
            onClick={() => setShowShiftCloseModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-[#FFA300] hover:bg-[#ff9400] text-[#221F1F] font-black text-xs transition cursor-pointer shadow-xs whitespace-nowrap self-start sm:self-auto"
          >
            {t.closeShiftBtn}
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-[#00A046] rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
        </div>
      )}

      {/* Van Stock Status (Mobile Warehouse) */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#1F2328] flex items-center gap-1.5">
            <Barcode className="w-4 h-4 text-[#00A046]" />
            <span>{t.vanInventoryTitle}</span>
          </h3>
          <span className="text-xs text-[#6B7280]">{t.loadedItemsCount(vanStock.length)}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {vanStock.map((item) => (
            <div key={item.id} className="border border-[#E5E7EB] rounded-xl p-3 bg-[#F7F8FA] space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-[#1F2328] line-clamp-1">
                  {getLocalizedText(item.productName, language)}
                </h4>
                <span className="text-[10px] font-mono text-gray-500">{item.barcode}</span>
              </div>
              <div className="text-[11px] text-[#6B7280]">
                {t.unitLabel} {getLocalizedText(item.unit, language)} | {t.priceLabel}{' '}
                <strong className="text-[#00A046] font-mono">
                  {formatCurrency(item.unitPriceIQD, currency, language)}
                </strong>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-gray-200 text-[11px]">
                <span>{t.loadedQty} {item.loadedQuantity}</span>
                <span>{t.soldQty} {item.soldQuantity}</span>
                <span className="font-bold text-[#00A046]">
                  {t.remainingInVan} {item.remainingQuantity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action 1: Instant Direct Sale from Van */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-[#00A046]" />
          <h3 className="font-bold text-sm text-[#1F2328]">{t.directSaleTitle}</h3>
        </div>

        <form onSubmit={handleDirectSale} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-[#6B7280] block mb-1">{t.purchasingStore}</label>
            <select
              value={targetStoreId}
              onChange={(e) => setTargetStoreId(e.target.value)}
              className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-2 font-medium"
            >
              <option value="store_almansoor">{getLocalizedText('سوبرماركت المنصور المركزي', language)}</option>
              <option value="store_karrada">{getLocalizedText('أسواق دجلة الخير - الكرادة', language)}</option>
            </select>
          </div>

          <div>
            <label className="text-[#6B7280] block mb-1">{t.selectItemFromVan}</label>
            <select
              value={saleBarcode}
              onChange={(e) => setSaleBarcode(e.target.value)}
              className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-2 font-medium"
            >
              {vanStock.map(i => (
                <option key={i.barcode} value={i.barcode}>
                  {getLocalizedText(i.productName, language)} ({t.remainingInVan} {i.remainingQuantity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[#6B7280] block mb-1">{t.saleQtyLabel}</label>
            <input
              type="number"
              min={1}
              value={saleQuantity}
              onChange={(e) => setSaleQuantity(parseInt(e.target.value) || 1)}
              className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-2 font-bold font-mono"
            />
          </div>

          <div className="flex flex-col justify-end">
            <button
              type="submit"
              className="w-full py-2.5 px-3 bg-[#00A046] text-white font-bold rounded-lg hover:bg-[#008a3c] shadow-xs transition cursor-pointer"
            >
              {t.recordDirectSaleBtn}
            </button>
          </div>
        </form>
      </div>

      {/* Action 2: Delivery Verification (Enter Store PIN) */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-[#1F2328]">
          {isAr ? `طلبيات التوزيع المكلف بها (${assignedOrders.length}):` : `Assigned Delivery Orders (${assignedOrders.length}):`}
        </h3>
        
        <div className="space-y-2.5 text-xs">
          {assignedOrders.map((ord) => (
            <div key={ord.id} className="border border-[#E5E7EB] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono text-[#1F2328]">{ord.id}</span>
                  <span className="bg-[#F7F8FA] px-2 py-0.5 rounded text-[#6B7280]">{getLocalizedText(ord.storeName, language)}</span>
                </div>
                <div className="text-[11px] text-[#6B7280] mt-1">
                  {isAr ? 'الموقع: ' : 'Location: '}{getLocalizedText(ord.storeAddress, language)} | {isAr ? 'القيمة: ' : 'Total: '}
                  <strong className="text-[#00A046] font-mono">{formatCurrency(ord.subtotalIQD, currency, language)}</strong>
                </div>
              </div>

              {ord.status === 'delivered' ? (
                <span className="text-[#00A046] font-bold bg-[#E8F8EE] px-3 py-1 rounded-lg">
                  {isAr ? 'تم الاستلام والمصادقة' : 'Delivered & Confirmed'}
                </span>
              ) : (
                <button
                  onClick={() => {
                    setDeliveringOrder(ord);
                    setPinError(null);
                  }}
                  className="px-3.5 py-2 bg-[#FFE600] text-[#221F1F] font-black rounded-lg hover:bg-yellow-400 transition cursor-pointer shadow-xs"
                >
                  {isAr ? 'إدخال رمز PIN وتأكيد التسليم' : 'Enter PIN & Confirm Delivery'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action 3: Log Returns / Damaged Goods */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-[#F84147]" />
          <h3 className="font-bold text-sm text-[#1F2328]">{t.returnDamageTitle}</h3>
        </div>

        <form onSubmit={handleLogReturn} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-[#6B7280] block mb-1">{isAr ? 'نوع القيد:' : 'Record Type:'}</label>
            <select
              value={returnType}
              onChange={(e) => setReturnType(e.target.value as any)}
              className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-2 font-medium"
            >
              <option value="return">{t.returnToSupplier}</option>
              <option value="damage">{t.damageExpired}</option>
            </select>
          </div>

          <div>
            <label className="text-[#6B7280] block mb-1">{isAr ? 'السلعة:' : 'Item:'}</label>
            <select
              value={returnBarcode}
              onChange={(e) => setReturnBarcode(e.target.value)}
              className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-2 font-medium"
            >
              {vanStock.map(i => (
                <option key={i.barcode} value={i.barcode}>{getLocalizedText(i.productName, language)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[#6B7280] block mb-1">{t.quantity}</label>
            <input
              type="number"
              min={1}
              value={returnQty}
              onChange={(e) => setReturnQty(parseInt(e.target.value) || 1)}
              className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-2 font-bold font-mono"
            />
          </div>

          <div className="flex flex-col justify-end">
            <button
              type="submit"
              className="w-full py-2.5 px-3 bg-gray-800 text-white font-bold rounded-lg hover:bg-black transition cursor-pointer"
            >
              {t.recordReturnBtn}
            </button>
          </div>
        </form>
      </div>

      {/* MODAL: Delivery Confirmation with PIN */}
      {deliveringOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className={`bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl ${isAr ? 'text-right' : 'text-left'}`}>
            <h3 className="font-bold text-base text-[#1F2328]">{t.verifyPinBtn}</h3>
            <p className="text-xs text-[#6B7280] mt-1">
              {t.enterPinPrompt} ({getLocalizedText(deliveringOrder.storeName, language)}).
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">{isAr ? 'رمز التحقق (PIN):' : 'Verification PIN:'}</label>
                <input
                  type="text"
                  maxLength={4}
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  placeholder={t.pinPlaceholder}
                  className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl p-3 font-mono font-black text-center text-xl tracking-widest text-[#00A046]"
                />
              </div>

              {pinError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold">
                  {pinError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeliveringOrder(null)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium text-xs cursor-pointer hover:bg-gray-200"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleVerifyDeliveryPin}
                  className="flex-1 py-2.5 rounded-xl bg-[#00A046] text-white font-bold text-xs hover:bg-[#008a3c] cursor-pointer"
                >
                  {t.confirmHandoverBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Daily Shift Close (إغلاق الوردية ومطابقة الصندوق) */}
      {showShiftCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className={`bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl ${isAr ? 'text-right' : 'text-left'}`}>
            <h3 className="font-bold text-base text-[#1F2328]">{t.shiftCloseModalTitle}</h3>
            <p className="text-xs text-[#6B7280] mt-1">
              {isAr 
                ? 'قارن الكاش الفعلي المعدود مع الكاش المتوقع في النظام لاحتساب أي فائض أو عجز.'
                : 'Compare physical counted cash against expected system sales to verify surplus or shortage.'}
            </p>

            {shiftCloseResult ? (
              <div className="mt-4 space-y-3 text-xs">
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-900 space-y-1">
                  <div className="font-bold">{t.success}</div>
                  <div>{t.expectedCashFromSales} {formatCurrency(shiftCloseResult.expectedCashIQD, currency, language)}</div>
                  <div>{t.actualCountedCash} {formatCurrency(shiftCloseResult.actualCashIQD, currency, language)}</div>
                  <div className={`font-bold ${shiftCloseResult.cashVarianceIQD >= 0 ? 'text-[#00A046]' : 'text-red-700'}`}>
                    {t.cashDifference} {formatCurrency(shiftCloseResult.cashVarianceIQD, currency, language)} {shiftCloseResult.cashVarianceIQD === 0 ? `(${t.matched})` : shiftCloseResult.cashVarianceIQD > 0 ? `(${t.surplus})` : `(${t.shortage})`}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowShiftCloseModal(false);
                    setShiftCloseResult(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#00A046] text-white font-bold cursor-pointer"
                >
                  {t.close}
                </button>
              </div>
            ) : (
              <form onSubmit={handleCloseShift} className="mt-4 space-y-3 text-xs">
                <div className="bg-[#F7F8FA] p-3 rounded-xl border border-[#E5E7EB] text-gray-700">
                  <span>{t.expectedCashFromSales} </span>
                  <strong className="text-sm font-mono text-[#00A046] block mt-1">
                    {formatCurrency(driverInfo?.currentCashCollectedIQD || 0, currency, language)}
                  </strong>
                </div>

                <div>
                  <label className="text-[#6B7280] block mb-1">{t.actualCountedCash}</label>
                  <input
                    type="number"
                    required
                    value={actualCashInput}
                    onChange={(e) => setActualCashInput(e.target.value)}
                    placeholder={isAr ? 'أدخل المبلغ الفعلي بالدينار...' : 'Enter actual counted cash...'}
                    className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl p-2.5 font-mono text-sm font-bold"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowShiftCloseModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium text-xs cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#00A046] text-white font-bold text-xs cursor-pointer hover:bg-[#008a3c]"
                  >
                    {t.confirmShiftCloseBtn}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
