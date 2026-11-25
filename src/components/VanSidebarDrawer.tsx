import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  Receipt,
  ClipboardList,
  Users,
  RotateCcw,
  PackageCheck,
  PackagePlus,
  Navigation,
  SlidersHorizontal,
  Wallet,
  BarChart3,
  Search,
  ChevronLeft,
  ChevronRight,
  Repeat,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { Currency, Language, VanModuleSection } from '../types/index.ts';
import { UserSession } from '../views/WelcomeAuthView.tsx';
import { formatCurrency } from '../utils/format.ts';

interface VanSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: VanModuleSection;
  onSelectSection: (section: VanModuleSection) => void;
  onOpenShiftClose: () => void;
  userSession: UserSession | null;
  onLogout: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  currency: Currency;
  onCurrencyChange: (cur: Currency) => void;
  cashCustodyIQD?: number;
  remainingUnits?: number;
  pendingOrdersCount?: number;
  pendingRestockCount?: number;
  nearExpiryCount?: number;
  creditClientsCount?: number;
  vehiclePlate?: string;
  vanWarehouseName?: string;
}

export const VanSidebarDrawer: React.FC<VanSidebarDrawerProps> = ({
  isOpen,
  onClose,
  activeSection,
  onSelectSection,
  onOpenShiftClose,
  userSession,
  onLogout,
  language,
  onLanguageChange,
  currency,
  onCurrencyChange,
  cashCustodyIQD = 0,
  remainingUnits = 0,
  pendingOrdersCount = 0,
  pendingRestockCount = 0,
  nearExpiryCount = 0,
  creditClientsCount = 0,
  vehiclePlate,
  vanWarehouseName
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ChevronLeft : ChevronRight;

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAction = (fn: () => void) => {
    fn();
    onClose();
  };

  interface DrawerItem {
    id: string;
    section?: VanModuleSection;
    title: string;
    subtitle: string;
    icon: React.ElementType;
    iconStyle: string;
    badge?: string | null;
    badgeStyle?: string;
    action: () => void;
  }

  interface DrawerGroup {
    groupTitle: string;
    items: DrawerItem[];
  }

  const groups: DrawerGroup[] = [
    {
      groupTitle: isAr ? 'المبيعات الميدانية والعملاء (DSD)' : 'Field Sales & Customers (DSD)',
      items: [
        {
          id: 'pos_sell',
          section: 'pos_sell',
          title: isAr ? 'كاشير الفان والفواتير المباشرة' : 'Van POS & Instant Billing',
          subtitle: isAr ? 'بيع نقدي وآجل · تسعير كميات الجملة' : 'Cash & Credit · Wholesale tiers',
          icon: Receipt,
          iconStyle: 'bg-[#EFF7F1] text-[#0B5D32] border-[#DCE5DC]',
          action: () => onSelectSection('pos_sell')
        },
        {
          id: 'customers_credit',
          section: 'customers_credit',
          title: isAr ? 'سجل العملاء والذمم والتحصيل' : 'Customers, Credit Aging & Collections',
          subtitle: isAr ? 'حدود الائتمان، تحصيل نقدي، إضافة زبون' : 'Credit limits, collections & onboarding',
          icon: Users,
          iconStyle: 'bg-[#EFF7F1] text-[#0B5D32] border-[#DCE5DC]',
          badge: creditClientsCount > 0 ? String(creditClientsCount) : null,
          badgeStyle: 'bg-[#EFF7F1] text-[#0B5D32] border border-[#CBE0D0]',
          action: () => onSelectSection('customers_credit')
        },
        {
          id: 'deliveries',
          section: 'deliveries',
          title: isAr ? 'طلبيات التوريد وتأكيد التسليم (PIN)' : 'Scheduled Deliveries (PIN)',
          subtitle: isAr ? 'تسليم طلبيات المورد المجدولة بالرمز' : 'Verify 4-digit delivery PINs',
          icon: ClipboardList,
          iconStyle: 'bg-[#F4F4EA] text-[#3D5244] border-[#DCE5DC]',
          badge: pendingOrdersCount > 0 ? String(pendingOrdersCount) : null,
          badgeStyle: 'bg-red-50 text-[#DC2626] border border-red-200',
          action: () => onSelectSection('deliveries')
        },
        {
          id: 'returns_rma',
          section: 'returns_rma',
          title: isAr ? 'المرتجعات وإشعارات الدائن والاستبدال' : 'Returns, Credit Notes & Exchanges',
          subtitle: isAr ? 'مرتجع سليم، تالف، استبدال 1 مقابل 1' : 'RMA ledger, damage quarantine & swap',
          icon: RotateCcw,
          iconStyle: 'bg-amber-50 text-[#B45309] border-amber-200',
          action: () => onSelectSection('returns_rma')
        }
      ]
    },
    {
      groupTitle: isAr ? 'المخزون، الدفعات والمركبة' : 'Inventory, Batches & Fleet',
      items: [
        {
          id: 'inventory_audit',
          section: 'inventory_audit',
          title: isAr ? 'جرد الحمولة والدفعات والصلاحية (FEFO)' : 'Load Audit, Lots & Expiry (FEFO)',
          subtitle: isAr ? 'الجرد الفعلي، تنبيهات الصلاحية، ترحيل للمستودع' : 'Physical count, FEFO & warehouse unload',
          icon: PackageCheck,
          iconStyle:
            nearExpiryCount > 0
              ? 'bg-amber-50 text-[#B45309] border-amber-200'
              : 'bg-[#EFF7F1] text-[#0B5D32] border-[#DCE5DC]',
          badge:
            nearExpiryCount > 0
              ? `${nearExpiryCount} ${isAr ? 'قريب الانتهاء' : 'expiring'}`
              : remainingUnits > 0
              ? String(remainingUnits)
              : null,
          badgeStyle:
            nearExpiryCount > 0
              ? 'bg-amber-50 text-[#B45309] border border-amber-200'
              : 'bg-[#F4F4EA] text-[#3D5244] border border-[#DCE5DC]',
          action: () => onSelectSection('inventory_audit')
        },
        {
          id: 'restock',
          section: 'restock',
          title: isAr ? 'تجهيز الفان وطلبات التحميل' : 'Van Restock & Load Requests',
          subtitle: isAr ? 'تعبئة من مستودع المورد واعتماد المحاسب' : 'Warehouse replenishment workflow',
          icon: PackagePlus,
          iconStyle: 'bg-[#EFF7F1] text-[#0B5D32] border-[#DCE5DC]',
          badge: pendingRestockCount > 0 ? String(pendingRestockCount) : null,
          badgeStyle: 'bg-amber-50 text-[#B45309] border border-amber-200',
          action: () => onSelectSection('restock')
        },
        {
          id: 'navigation',
          section: 'navigation',
          title: isAr ? 'الملاحة الذكية وخريطة التوزيع' : 'Smart Route Navigation (GPS)',
          subtitle: isAr ? 'تتبع المسار وتفادي الازدحام والوصول للمحلات' : 'Turn-by-turn stops & traffic routing',
          icon: Navigation,
          iconStyle: 'bg-[#EFF7F1] text-[#0B5D32] border-[#DCE5DC]',
          action: () => onSelectSection('navigation')
        },
        {
          id: 'manage',
          section: 'manage',
          title: isAr ? 'إدارة خط السير وحالة الفان' : 'Route Planner & Van Availability',
          subtitle: isAr ? 'ترتيب المحطات اليومية وحالة التوفر' : 'Reorder stops & availability state',
          icon: SlidersHorizontal,
          iconStyle: 'bg-[#F4F4EA] text-[#3D5244] border-[#DCE5DC]',
          action: () => onSelectSection('manage')
        }
      ]
    },
    {
      groupTitle: isAr ? 'المالية، التسوية والأداء' : 'Finance, Settlement & KPIs',
      items: [
        {
          id: 'finance_settlement',
          section: 'finance_settlement',
          title: isAr ? 'المصاريف، فحص المركبة وتسوية الوردية' : 'Expenses, Vehicle Check & Z-Report',
          subtitle: isAr ? 'الوقود والتبريد والعداد وسجل الإغلاقات' : 'Fuel, chiller, odometer & shift history',
          icon: Wallet,
          iconStyle: 'bg-[#EFF7F1] text-[#0B5D32] border-[#DCE5DC]',
          action: () => onSelectSection('finance_settlement')
        },
        {
          id: 'performance',
          section: 'performance',
          title: isAr ? 'لوحة مؤشرات الأداء والعمولات (KPI)' : 'KPI Scorecard & Commissions',
          subtitle: isAr ? 'نسبة التحويل، التغطية، ومتوسط الفاتورة' : 'Strike rate, compliance & drop size',
          icon: BarChart3,
          iconStyle: 'bg-[#EFF7F1] text-[#0B5D32] border-[#DCE5DC]',
          action: () => onSelectSection('performance')
        },
        {
          id: 'close_shift_now',
          title: isAr ? 'إغلاق الوردية وتسليم العهدة الآن' : 'Close Shift & Settle Cash Now',
          subtitle: isAr ? 'مطابقة الكاش الفعلي مع المتوقع بالنظام' : 'Reconcile cash drawer & close shift',
          icon: Lock,
          iconStyle: 'bg-amber-50 text-[#B45309] border-amber-200',
          action: onOpenShiftClose
        },
        {
          id: 'switch_account',
          title: isAr ? 'تبديل الحساب أو تسجيل الخروج' : 'Switch Account / Logout',
          subtitle: isAr ? 'العودة إلى قائمة الحسابات' : 'Return to account selector',
          icon: Repeat,
          iconStyle: 'bg-[#F4F4EA] text-[#3D5244] border-[#DCE5DC]',
          action: onLogout
        }
      ]
    }
  ];

  const filteredGroups = groups
    .map((group) => {
      if (!searchTerm.trim()) return group;
      const q = searchTerm.toLowerCase();
      return {
        ...group,
        items: group.items.filter(
          (it) =>
            it.title.toLowerCase().includes(q) || it.subtitle.toLowerCase().includes(q)
        )
      };
    })
    .filter((g) => g.items.length > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex overflow-hidden font-brand text-[#142018]"
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? 'قائمة حساب الفان للتوزيع بالجملة' : 'Van Sales Navigation Drawer'}
    >
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/55 backdrop-blur-xs transition-opacity duration-200"
      />

      <div
        className={`relative w-full max-w-sm sm:max-w-md bg-[#F4F4EA] h-full shadow-2xl flex flex-col z-10 border-[#DCE5DC] ${
          isAr ? 'mr-auto border-r' : 'ml-auto border-l'
        }`}
      >
        {/* Top Drawer Header */}
        <div className="px-4 pt-4 pb-3.5 shrink-0 space-y-3 border-b border-[#DCE5DC] bg-[#F4F4EA]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#0B5D32] text-[#FFE600] flex items-center justify-center shrink-0">
                <Truck className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-black text-[#142018] leading-tight truncate">
                  {isAr ? 'منظومة الفان للتوزيع بالجملة' : 'Enterprise Van Sales (DSD)'}
                </h2>
                <p className="text-[10.5px] text-[#5F7164] truncate">
                  {vanWarehouseName || (isAr ? 'مستودع متنقل ومندوب مبيعات' : 'Mobile Warehouse & Field Rep')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white border border-[#DCE5DC] hover:border-red-300 hover:text-red-600 text-[#3D5244] flex items-center justify-center transition cursor-pointer"
              aria-label={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Driver Custody & Vehicle Card */}
          <div className="w-full text-start text-white rounded-2xl p-3 bg-[#0B5D32] flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-[#FFE600]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs sm:text-[13px] text-white truncate">
                    {userSession?.name || (isAr ? 'أحمد كاظم البغدادي' : 'Van Sales Rep')}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#A7F3D0] shrink-0" />
                </div>
                <p className="text-[10.5px] text-white/80 truncate mt-0.5">
                  {vehiclePlate || (isAr ? 'بغداد 48215 ط' : 'Baghdad 48215')}
                  {' · '}
                  {userSession?.entityName || (isAr ? 'شركة الرافدين للتجارة' : 'Al-Rafidain Wholesale')}
                </p>
              </div>
            </div>

            <div className="px-2.5 py-1.5 rounded-xl bg-white/15 border border-white/20 shrink-0 text-end">
              <div className="text-[9.5px] font-bold text-white/80 leading-none">
                {isAr ? 'العهدة النقدية' : 'Cash Custody'}
              </div>
              <div className="text-xs font-black font-mono tabular-nums text-[#FFE600] mt-1">
                {formatCurrency(cashCustodyIQD, currency, language)}
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#0B5D32] absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isAr ? 'بحث سريع في أدوات الفان...' : 'Quick search van modules...'}
              className="w-full bg-white border border-[#0B5D32]/30 focus:border-[#0B5D32] text-[#142018] placeholder:text-[#78897C] rounded-full py-2 ps-10 pe-9 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#0B5D32]/15 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-gray-100 text-[#5F7164] flex items-center justify-center cursor-pointer"
                aria-label={isAr ? 'مسح البحث' : 'Clear search'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-4">
          {filteredGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              <div className="px-1.5 flex items-center justify-between">
                <span className="text-[11px] font-black text-[#4B6352]">{group.groupTitle}</span>
                <span className="text-[10px] font-bold text-[#78897C] tabular-nums">
                  {group.items.length}
                </span>
              </div>

              <div className="bg-white border border-[#DCE5DC] rounded-2xl overflow-hidden divide-y divide-[#EFF3EE]">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.section !== undefined && item.section === activeSection;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleAction(item.action)}
                      className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 transition text-start group cursor-pointer ${
                        isActive ? 'bg-[#EFF7F1]' : 'hover:bg-[#F9FAF6]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                            isActive
                              ? 'bg-[#0B5D32] text-white border-[#0B5D32]'
                              : item.iconStyle
                          }`}
                        >
                          <Icon className="w-4 h-4 stroke-[2.2]" />
                        </div>
                        <div className="min-w-0">
                          <div
                            className={`text-xs truncate ${
                              isActive ? 'text-[#0B5D32] font-black' : 'text-[#142018] font-bold'
                            }`}
                          >
                            {item.title}
                          </div>
                          <div className="text-[10.5px] text-[#5F7164] truncate mt-0.5">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.badge && (
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md whitespace-nowrap tabular-nums ${
                              item.badgeStyle || 'bg-[#F4F4EA] text-[#3D5244]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        <ArrowIcon
                          className={`w-4 h-4 ${
                            isActive ? 'text-[#0B5D32]' : 'text-[#9AA89D] group-hover:text-[#0B5D32]'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredGroups.length === 0 && (
            <div className="p-8 text-center text-xs text-[#5F7164] bg-white rounded-2xl border border-[#DCE5DC]">
              {isAr ? 'لا توجد أدوات مطابقة للبحث' : 'No matching modules found'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-[#DCE5DC] px-4 py-3 shrink-0 flex items-center justify-between gap-2">
          <div className="flex items-center gap-0.5 bg-[#F4F4EA] border border-[#DCE5DC] p-0.5 rounded-full text-[11px] font-bold">
            <button
              type="button"
              onClick={() => onLanguageChange('ar')}
              className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
                isAr ? 'bg-[#0B5D32] text-white' : 'text-[#4B6352] hover:text-[#142018]'
              }`}
            >
              عربي
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
                !isAr ? 'bg-[#0B5D32] text-white' : 'text-[#4B6352] hover:text-[#142018]'
              }`}
            >
              EN
            </button>
          </div>

          <div className="flex items-center gap-0.5 bg-[#F4F4EA] border border-[#DCE5DC] p-0.5 rounded-full text-[11px] font-bold">
            <button
              type="button"
              onClick={() => onCurrencyChange('IQD')}
              className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
                currency === 'IQD' ? 'bg-[#0B5D32] text-white' : 'text-[#4B6352] hover:text-[#142018]'
              }`}
            >
              د.ع
            </button>
            <button
              type="button"
              onClick={() => onCurrencyChange('USD')}
              className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
                currency === 'USD' ? 'bg-[#0B5D32] text-white' : 'text-[#4B6352] hover:text-[#142018]'
              }`}
            >
              $ USD
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-black text-[#142018] bg-[#F4F4EA] hover:bg-[#E4EAD8] border border-[#DCE5DC] px-4 py-1.5 rounded-full transition cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
