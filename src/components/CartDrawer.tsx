import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  Building2, 
  CreditCard, 
  Banknote, 
  Wallet, 
  CalendarClock, 
  AlertTriangle, 
  CheckCircle2, 
  Truck,
  ArrowRight
} from 'lucide-react';
import { CartItem, Currency, Language } from '../types/index.ts';
import { StoreDistrict } from '../data/nearbySuppliers.ts';
import { formatCurrency } from '../utils/format.ts';
import { translations } from '../utils/translations.ts';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currency: Currency;
  onUpdateQuantity: (offerId: string, quantity: number) => void;
  onRemoveItem: (offerId: string) => void;
  onClearCart: () => void;
  onOrderSuccess: (orderData: any) => void;
  language?: Language;
  currentDistrict?: StoreDistrict;
  suppliers?: { id: string; serviceZoneIds?: string[] }[];
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  currency,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderSuccess,
  language = 'ar',
  currentDistrict,
  suppliers = []
}) => {
  const isAr = language === 'ar';
  const t = translations[language];
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'credit' | 'wallet' | 'online'>('credit');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Group items automatically by supplier! (Core B2B requirement)
  const groupedBySupplier = cartItems.reduce((acc, item) => {
    const suppId = item.offer.supplierId;
    if (!acc[suppId]) {
      acc[suppId] = {
        supplierId: suppId,
        supplierName: item.offer.supplierName,
        supplierCity: item.offer.supplierCity,
        allowsCredit: item.offer.paymentTerms.allowsCredit,
        maxCreditDays: item.offer.paymentTerms.maxCreditDays,
        items: [],
        subtotalIQD: 0
      };
    }
    acc[suppId].items.push(item);
    acc[suppId].subtotalIQD += item.offer.priceIQD * item.quantity;
    return acc;
  }, {} as Record<string, {
    supplierId: string;
    supplierName: string;
    supplierCity: string;
    allowsCredit: boolean;
    maxCreditDays: number;
    items: CartItem[];
    subtotalIQD: number;
  }>);

  const supplierGroups = Object.values(groupedBySupplier);
  const totalAmountIQD = cartItems.reduce((sum, item) => sum + item.offer.priceIQD * item.quantity, 0);

  const isSupplierServingZone = (supplierId: string): boolean => {
    const activeZoneId = currentDistrict?.deliveryZoneId;
    if (!activeZoneId) return true;
    const supp = suppliers.find((s) => s.id === supplierId);
    if (!supp || !Array.isArray(supp.serviceZoneIds)) return true;
    return supp.serviceZoneIds.includes(activeZoneId);
  };

  const unsupportedSupplierIds = new Set(
    supplierGroups
      .filter((g) => !isSupplierServingZone(g.supplierId))
      .map((g) => g.supplierId)
  );
  const hasUnsupportedSuppliers = unsupportedSupplierIds.size > 0;

  const handleRemoveSupplierItems = (supplierId: string) => {
    cartItems
      .filter((item) => item.offer.supplierId === supplierId)
      .forEach((item) => onRemoveItem(item.offer.id));
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0 || hasUnsupportedSuppliers) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        storeId: 'store_almansoor', // active logged-in store
        items: cartItems.map(item => ({
          offerId: item.offer.id,
          barcode: item.product.barcode,
          quantity: item.quantity
        })),
        paymentMethod,
        notes,
        deliveryZoneId: currentDistrict?.deliveryZoneId
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'فشل إرسال الطلبية');
      }

      onClearCart();
      onOrderSuccess(data.data);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ غير متوقع أثناء معالجة الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-xl bg-white h-full flex flex-col shadow-2xl relative">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#E5E7EB] bg-[#F7F8FA] flex items-center justify-between font-brand">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#00A046] text-white flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1F2328]">
                {isAr ? 'سلة الشراء (تقسيم تلقائي للموردين)' : 'Cart (Auto-Split by Supplier)'}
              </h2>
              <span className="text-xs text-[#6B7280]">
                {isAr 
                  ? `${cartItems.length} أصناف من ${supplierGroups.length} موردين` 
                  : `${cartItems.length} items from ${supplierGroups.length} suppliers`}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 font-brand">
          {cartItems.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center text-[#6B7280]">
              <ShoppingBag className="w-16 h-16 stroke-1 text-gray-300 mb-3" />
              <p className="font-bold text-[#1F2328]">{isAr ? 'سلتك فارغة حالياً' : 'Your cart is currently empty'}</p>
              <p className="text-xs mt-1 max-w-xs">
                {isAr 
                  ? 'تصفح الكتالوج الموحد وقارن عروض الموردين لإضافة بضائع الجملة لمتجرك' 
                  : 'Browse unified catalog and compare supplier offers to restock your store'}
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-[#00A046] text-white rounded-lg text-xs font-semibold hover:bg-[#008a3c] cursor-pointer"
              >
                {isAr ? 'تصفح المنتجات' : 'Browse Products'}
              </button>
            </div>
          ) : (
            <>
              {/* Auto Split Notice */}
              <div className="bg-emerald-50 border border-[#00A046]/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-[#00A046]">
                <Truck className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">{isAr ? 'نظام التقسيم الذكي للموردين:' : 'Smart Supplier Auto-Split:'}</span>
                  <p className="mt-0.5 text-emerald-800 leading-relaxed">
                    {isAr
                      ? <>تم تقسيم سلتك إلى <strong>{supplierGroups.length} طلبيات فرعية</strong> مستقلة. سيصل كل طلب بسيارة التوزيع الخاصة بالمورد مع وصل تسليم وحساب ائتماني منفصل.</>
                      : <>Your cart is partitioned into <strong>{supplierGroups.length} supplier orders</strong>. Each order is dispatched with supplier's van, invoice, and separate credit terms.</>}
                  </p>
                </div>
              </div>

              {/* Grouped Supplier Orders */}
              {supplierGroups.map((group) => {
                const isUnsupported = unsupportedSupplierIds.has(group.supplierId);
                return (
                <div key={group.supplierId} className={`border rounded-xl overflow-hidden bg-white shadow-xs ${isUnsupported ? 'border-red-300' : 'border-[#E5E7EB]'}`}>
                  
                  {/* Supplier Sub-Header */}
                  <div className="bg-[#F7F8FA] px-3.5 py-2.5 border-b border-[#E5E7EB] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className={`w-4 h-4 ${isUnsupported ? 'text-[#B91C1C]' : 'text-[#00A046]'}`} />
                      <span className="font-bold text-xs sm:text-sm text-[#1F2328]">{group.supplierName}</span>
                    </div>
                    <span className="text-xs font-bold text-[#00A046]">
                      {formatCurrency(group.subtotalIQD, currency)}
                    </span>
                  </div>

                  {isUnsupported && (
                    <div className="px-3.5 py-2.5 bg-red-50 border-b border-red-200 text-red-700 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#B91C1C]" />
                        <span>{t.geoSupplierNotServingZone}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSupplierItems(group.supplierId)}
                        className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-red-200 text-red-700 font-bold text-[11px] hover:bg-red-100 transition cursor-pointer"
                      >
                        {t.geoRemoveSupplierItems}
                      </button>
                    </div>
                  )}

                  {/* Items in this supplier's sub-order */}
                  <div className="divide-y divide-[#E5E7EB] p-3 space-y-3">
                    {group.items.map((item) => (
                      <div key={item.offer.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs">
                        <div className="flex-1">
                          <h4 className="font-bold text-[#1F2328] line-clamp-1">{item.product.nameAr}</h4>
                          <span className="text-[11px] text-[#6B7280]">
                            {item.product.unit} × {formatCurrency(item.offer.priceIQD, currency)}
                          </span>
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-[#E5E7EB] rounded-md bg-[#F7F8FA]">
                            <button
                              onClick={() => onUpdateQuantity(item.offer.id, item.quantity - 1)}
                              className="px-2 py-0.5 text-gray-600 hover:bg-gray-200 text-xs font-bold"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-bold text-xs">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.offer.id, item.quantity + 1)}
                              className="px-2 py-0.5 text-gray-600 hover:bg-gray-200 text-xs font-bold"
                            >
                              +
                            </button>
                          </div>

                          <span className="w-20 text-left font-bold text-[#1F2328]">
                            {formatCurrency(item.offer.priceIQD * item.quantity, currency)}
                          </span>

                          <button
                            onClick={() => onRemoveItem(item.offer.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Credit condition badge */}
                  <div className="bg-[#F7F8FA] px-3.5 py-1.5 border-t border-[#E5E7EB] text-[11px] text-[#6B7280] flex items-center justify-between">
                    <span>
                      {group.allowsCredit 
                        ? `مؤهل للدفع الآجل (حتى ${group.maxCreditDays} يوم)`
                        : 'هذا المورد يقبل الدفع النقدي فقط'}
                    </span>
                    <span className="text-gray-500">{group.items.length} أصناف</span>
                  </div>

                </div>
                );
              })}

              {/* Payment Methods Section */}
              <div className="border border-[#E5E7EB] rounded-xl p-4 bg-white">
                <h3 className="font-bold text-xs text-[#1F2328] mb-3">اختر طريقة السداد:</h3>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  
                  {/* Credit */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit')}
                    className={`p-3 rounded-lg border text-right transition flex items-start gap-2 ${
                      paymentMethod === 'credit'
                        ? 'border-[#00A046] bg-emerald-50/40 text-[#00A046] font-bold shadow-xs'
                        : 'border-[#E5E7EB] hover:bg-[#F7F8FA] text-[#1F2328]'
                    }`}
                  >
                    <CalendarClock className="w-4 h-4 text-[#00A046] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">آجل (ائتمان الموردين)</div>
                      <div className="text-[10px] text-[#6B7280] font-normal mt-0.5">سداد حسب فترة التوريد 30-45 يوم</div>
                    </div>
                  </button>

                  {/* COD */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3 rounded-lg border text-right transition flex items-start gap-2 ${
                      paymentMethod === 'cod'
                        ? 'border-[#00A046] bg-emerald-50/40 text-[#00A046] font-bold shadow-xs'
                        : 'border-[#E5E7EB] hover:bg-[#F7F8FA] text-[#1F2328]'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-[#00A046] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">نقداً عند الاستلام</div>
                      <div className="text-[10px] text-[#6B7280] font-normal mt-0.5">تسليم الكاش لسائق الفان</div>
                    </div>
                  </button>

                  {/* Wallet */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-3 rounded-lg border text-right transition flex items-start gap-2 ${
                      paymentMethod === 'wallet'
                        ? 'border-[#00A046] bg-emerald-50/40 text-[#00A046] font-bold shadow-xs'
                        : 'border-[#E5E7EB] hover:bg-[#F7F8FA] text-[#1F2328]'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-[#00A046] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">محفظة المتجر</div>
                      <div className="text-[10px] text-[#6B7280] font-normal mt-0.5">رصيد متاح: 1,850,000 د.ع</div>
                    </div>
                  </button>

                  {/* Online / Cards */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('online')}
                    className={`p-3 rounded-lg border text-right transition flex items-start gap-2 ${
                      paymentMethod === 'online'
                        ? 'border-[#00A046] bg-emerald-50/40 text-[#00A046] font-bold shadow-xs'
                        : 'border-[#E5E7EB] hover:bg-[#F7F8FA] text-[#1F2328]'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-[#00A046] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">دفع إلكتروني</div>
                      <div className="text-[10px] text-[#6B7280] font-normal mt-0.5">زين كاش / فاست باي / كي كارد</div>
                    </div>
                  </button>

                </div>

                {/* Delivery Notes */}
                <div className="mt-3">
                  <label className="text-[11px] text-[#6B7280] block mb-1">ملاحظات التوصيل والتوقيت المفضل:</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="مثال: يرجى التوصيل قبل صلاة الظهر أو الاتصال بالهاتف..."
                    className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-xs text-[#1F2328] focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#00A046]"
                  />
                </div>

              </div>

              {/* Error Box */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#B91C1C]" />
                  <div>
                    <span className="font-bold">تعذر إتمام الطلب:</span>
                    <p className="mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Drawer Footer */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-[#E5E7EB] bg-[#F7F8FA] space-y-3 font-brand">
            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span>
                {isAr 
                  ? `إجمالي الطلبيات المقسمة (${supplierGroups.length} موردين):` 
                  : `Total Split Orders (${supplierGroups.length} suppliers):`}
              </span>
              <span className="text-xl font-black text-[#00A046] font-mono">
                {formatCurrency(totalAmountIQD, currency, language)}
              </span>
            </div>

            {hasUnsupportedSuppliers && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#B91C1C]" />
                <span>{t.geoCartZoneBlockedNotice}</span>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={isSubmitting || hasUnsupportedSuppliers}
              className="w-full py-3 px-4 rounded-xl bg-[#00A046] text-white font-bold text-sm hover:bg-[#008a3c] disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>{isAr ? 'جارٍ المعالجة والتحقق من الأرصدة...' : 'Processing & Verifying Balances...'}</span>
              ) : (
                <>
                  <span>
                    {isAr 
                      ? `تأكيد وإرسال طلبيات الجملة (${supplierGroups.length})` 
                      : `Confirm & Submit Wholesale Orders (${supplierGroups.length})`}
                  </span>
                  <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
