import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  MapPin,
  Zap,
  Package,
  BellRing,
  QrCode,
  Sparkles,
  CreditCard,
  Code2,
  Repeat,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  Flame,
  Sliders,
  Eye,
  User,
  ClipboardList,
  MessageSquare,
  Headphones,
  Heart,
  BookOpen,
  KeyRound,
  RotateCcw,
  FileCheck2,
  ShieldCheck,
  Trash2,
  Sun,
  Moon,
  Store,
  LayoutGrid,
  Power
} from 'lucide-react';
import { Language, Currency, AppTab, AccountSectionId, StoreWorkspaceMode } from '../types/index.ts';
import { UserSession } from '../views/WelcomeAuthView.tsx';

interface RetailerSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  userSession: UserSession | null;
  onLogout: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  currency: Currency;
  onCurrencyChange: (cur: Currency) => void;
  onOpenAssistant: () => void;
  onOpenQRPoster: () => void;
  onOpenLowStockAlerts: () => void;
  lowStockCount: number;
  onScrollToSuppliers?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenAccountSection?: (section: AccountSectionId) => void;
  activeAccountSection?: AccountSectionId;
  wishlistCount?: number;
  activeOrdersCount?: number;
  unreadMessagesCount?: number;
  activeDistrictName?: string;
  workspaceMode?: StoreWorkspaceMode;
  onSwitchWorkspaceMode?: (mode: StoreWorkspaceMode, targetTab?: AppTab) => void;
  isStoreOpsEnabled?: boolean;
  onToggleStoreOpsEnabled?: (enabled: boolean) => void;
}

export const RetailerSidebarDrawer: React.FC<RetailerSidebarDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  userSession,
  onLogout,
  language,
  onLanguageChange,
  currency,
  onCurrencyChange,
  onOpenAssistant,
  onOpenQRPoster,
  onOpenLowStockAlerts,
  lowStockCount,
  isDarkMode = false,
  onToggleDarkMode,
  onOpenAccountSection,
  activeAccountSection,
  wishlistCount = 0,
  activeOrdersCount = 0,
  unreadMessagesCount = 0,
  activeDistrictName,
  workspaceMode = 'b2b',
  onSwitchWorkspaceMode,
  isStoreOpsEnabled = true,
  onToggleStoreOpsEnabled
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [drawerViewMode, setDrawerViewMode] = useState<StoreWorkspaceMode>(workspaceMode);

  useEffect(() => {
    if (isOpen) {
      setDrawerViewMode(isStoreOpsEnabled ? workspaceMode : 'b2b');
      setSearchTerm('');
    }
  }, [isOpen, workspaceMode, isStoreOpsEnabled]);

  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ChevronLeft : ChevronRight;

  if (!isOpen) return null;

  const handleItemClick = (action: () => void) => {
    action();
    onClose();
  };

  const openSection = (section: AccountSectionId, mode: StoreWorkspaceMode) => {
    onSwitchWorkspaceMode?.(mode, 'account_hub');
    if (onOpenAccountSection) {
      onOpenAccountSection(section);
    } else {
      setActiveTab('account_hub');
    }
  };

  const goInMode = (mode: StoreWorkspaceMode, tab: AppTab) => {
    if (onSwitchWorkspaceMode) {
      onSwitchWorkspaceMode(mode, tab);
    } else {
      setActiveTab(tab);
    }
  };

  interface DrawerMenuItem {
    id: string;
    accountSection?: AccountSectionId;
    title: string;
    icon: React.ElementType;
    iconStyle: string;
    action: () => void;
    badge?: string | null;
    badgeColor?: string;
    isDanger?: boolean;
  }

  interface DrawerMenuGroup {
    groupTitle: string;
    items: DrawerMenuItem[];
  }

  const b2bGroups: DrawerMenuGroup[] = [
    {
      groupTitle: isAr ? 'سوق الجملة والتوريد (B2B)' : 'Wholesale & Sourcing (B2B)',
      items: [
        {
          id: 'marketplace',
          title: isAr ? 'سوق الجملة والكتالوج الموحد' : 'Wholesale Catalog',
          icon: ShoppingBag,
          iconStyle: 'bg-[#EFF7F1] text-[#0B5D32] border-[#DCE5DC]',
          action: () => goInMode('b2b', 'marketplace'),
          badge: null
        },
        {
          id: 'suppliers',
          title: isAr ? 'دليل شركات وموردي الجملة' : 'Wholesale Suppliers Directory',
          icon: MapPin,
          iconStyle: 'bg-[#EFF7F1] text-[#0B5D32] border-[#DCE5DC]',
          action: () => goInMode('b2b', 'suppliers'),
          badge: null
        },
        {
          id: 'collective_deals',
          title: isAr ? 'الشراء الجماعي وتخفيضات المصانع' : 'Collective Deals & Pools',
          icon: Zap,
          iconStyle: 'bg-amber-50 text-[#B45309] border-amber-200',
          action: () => goInMode('b2b', 'collective'),
          badge: isAr ? 'خصم' : 'Deals',
          badgeColor: 'bg-amber-50 text-[#B45309] border border-amber-200'
        },
        {
          id: 'stock_clearance',
          title: isAr ? 'تصفيات المخزون والصفقات الساخنة' : 'Stock Clearance',
          icon: Flame,
          iconStyle: 'bg-amber-50 text-[#B45309] border-amber-200',
          action: () => goInMode('b2b', 'collective'),
          badge: null
        }
      ]
    },
    {
      groupTitle: isAr ? 'حساب المشتري والطلبات (B2B)' : 'Buyer Account & Orders',
      items: [
        {
          id: 'account_profile',
          accountSection: 'profile',
          title: isAr ? 'ملفي التجاري وبيانات النشاط' : 'My Commercial Profile',
          icon: User,
          iconStyle: 'bg-[#EFF7F1] text-[#0B5D32] border-[#DCE5DC]',
          action: () => openSection('profile', 'b2b'),
          badge: null
        },
        {
          id: 'account_orders',
          accountSection: 'orders',
          title: isAr ? 'طلباتي وفواتير الشراء بالجملة' : 'My Wholesale Orders',
          icon: ClipboardList,
          iconStyle: 'bg-[#F4F4EA] text-[#3D5244] border-[#DCE5DC]',
          action: () => openSection('orders', 'b2b'),
          badge: activeOrdersCount > 0 ? String(activeOrdersCount) : null,
          badgeColor: 'bg-[#EFF7F1] text-[#0B5D32] border border-[#CBE0D0]'
        },
        {
          id: 'account_wishlist',
          accountSection: 'wishlist',
          title: isAr ? 'قائمة الرغبات والمنتجات المفضلة' : 'Wishlist & Saved Items',
          icon: Heart,
          iconStyle: 'bg-[#F4F4EA] text-[#3D5244] border-[#DCE5DC]',
          action: () => openSection('wishlist', 'b2b'),
          badge: wishlistCount > 0 ? String(wishlistCount) : null,
          badgeColor: 'bg-[#F4F4EA] text-[#3D5244] border border-[#DCE5DC]'
        },
        {
          id: 'account_addresses',
          accountSection: 'addresses',
          title: isAr ? 'إدارة العناوين وفروع الاستلام' : 'Delivery Addresses & Branches',
          icon: MapPin,
          iconStyle: 'bg-[#F4F4EA] text-[#3D5244] border-[#DCE5DC]',
          action: () => openSection('addresses', 'b2b'),
          badge: activeDistrictName || null,
          badgeColor: 'bg-[#F4F4EA] text-[#4B6352] border border-[#DCE5DC]'
        },
        {
          id: 'account_messages',
          accountSection: 'messages',
          title: isAr ? 'رسائل الموردين وفانات التوزيع' : 'Supplier Messages',
          icon: MessageSquare,
          iconStyle: 'bg-[#EFF7F1] text-[#0B5D32] border-[#DCE5DC]',
          action: () => openSection('messages', 'b2b'),
          badge: unreadMessagesCount > 0 ? String(unreadMessagesCount) : null,
          badgeColor: 'bg-[#0B5D32] text-white'
        },
        {
          id: 'account_blog',
          accountSection: 'blog',
          title: isAr ? 'مدونة التاجر ودليل السوق' : 'Merchant Trade Blog',
          icon: BookOpen,
          iconStyle: 'bg-[#F4F4EA] text-[#3D5244] border-[#DCE5DC]',
          action: () => openSection('blog', 'b2b'),
          badge: null
        }
      ]
    },
    {
      groupTitle: isAr ? 'المالية والدعم والسياسات' : 'Finance, Support & Policies',
      items: [
        {
          id: 'ai_assistant',
          title: isAr ? 'المستشار المالي الذكي (AI)' : 'AI Financial Advisor',
          icon: Sparkles,
          iconStyle: 'bg-[#0B5D32] text-[#FFE600] border-[#0B5D32]',
          action: () => onOpenAssistant(),
          badge: 'AI',
          badgeColor: 'bg-[#EFF7F1] text-[#0B5D32] border border-[#CBE0D0]'
        },
        {
          id: 'supplier_ledger',
          accountSection: 'credit_ledger',
          title: isAr ? 'دفتر الأستاذ والائتمان التجاري' : 'Credit Ledger & Invoices',
          icon: CreditCard,
          iconStyle: 'bg-[#EFF7F1] text-[#0B5D32] border-[#DCE5DC]',
          action: () => openSection('credit_ledger', 'b2b'),
          badge: null
        },
        {
          id: 'account_support',
          accountSection: 'support',
          title: isAr ? 'مركز الدعم والمساعدة 24/7' : '24/7 Support Desk',
          icon: Headphones,
          iconStyle: 'bg-[#F4F4EA] text-[#3D5244] border-[#DCE5DC]',
          action: () => openSection('support', 'b2b'),
          badge: '24/7',
          badgeColor: 'bg-[#F4F4EA] text-[#3D5244] border border-[#DCE5DC]'
        },
        {
          id: 'account_return_policy',
          accountSection: 'return_policy',
          title: isAr ? 'سياسة الاسترجاع والاستبدال' : 'Return Policy',
          icon: RotateCcw,
          iconStyle: 'bg-[#F4F4EA] text-[#3D5244] border-[#DCE5DC]',
          action: () => openSection('return_policy', 'b2b'),
          badge: null
        },
        {
          id: 'account_terms',
          accountSection: 'terms',
          title: isAr ? 'البنود والشروط التجارية' : 'Terms & Conditions',
          icon: FileCheck2,
          iconStyle: 'bg-[#F4F4EA] text-[#3D5244] border-[#DCE5DC]',
          action: () => openSection('terms', 'b2b'),
          badge: null
        },
        {
          id: 'account_privacy',
          accountSection: 'privacy',
          title: isAr ? 'سياسة الخصوصية وحماية البيانات' : 'Privacy Policy',
          icon: ShieldCheck,
          iconStyle: 'bg-[#F4F4EA] text-[#3D5244] border-[#DCE5DC]',
          action: () => openSection('privacy', 'b2b'),
          badge: null
        },
        {
          id: 'api_docs',
          title: isAr ? 'توثيق واجهات الربط (API)' : 'API Documentation',
          icon: Code2,
          iconStyle: 'bg-[#F4F4EA] text-[#3D5244] border-[#DCE5DC]',
          action: () => setActiveTab('api_docs'),
          badge: null
        },
        {
          id: 'switch_account',
          title: isAr ? 'تبديل الحساب أو تسجيل الخروج' : 'Switch Account / Logout',
          icon: Repeat,
          iconStyle: 'bg-amber-50 text-[#B45309] border-amber-200',
          action: onLogout,
          badge: null
        },
        {
          id: 'delete_account',
          title: isAr ? 'حذف أو تصفير الحساب' : 'Delete / Reset Account',
          icon: Trash2,
          iconStyle: 'bg-red-50 text-[#DC2626] border-red-200',
          action: () => openSection('security', 'b2b'),
          badge: null,
          isDanger: true
        }
      ]
    }
  ];

  const b2cGroups: DrawerMenuGroup[] = [
    {
      groupTitle: isAr ? 'عمليات المتجر والكاشير (POS & B2C)' : 'Store POS & Operations',
      items: [
        {
          id: 'store_pos',
          title: isAr ? 'كاشير المحل ومراقبة الصلاحية (POS)' : 'Store POS & Expiry',
          icon: Package,
          iconStyle: 'bg-[#EFF7F1] text-[#0B5D32] border-[#DCE5DC]',
          action: () => goInMode('b2c', 'store_pos'),
          badge: isAr ? 'الكاشير' : 'POS',
          badgeColor: 'bg-[#0B5D32] text-white'
        },
        {
          id: 'store_management',
          title: isAr ? 'إدارة المتجر الإلكتروني والعروض والبنرات' : 'Storefront Marketing & Content',
          icon: Sliders,
          iconStyle: 'bg-[#EFF7F1] text-[#0B5D32] border-[#DCE5DC]',
          action: () => goInMode('b2c', 'store_management'),
          badge: isAr ? 'لوحة المالك' : 'Studio',
          badgeColor: 'bg-[#EFF7F1] text-[#0B5D32] border border-[#CBE0D0]'
        },
        {
          id: 'low_stock_alerts',
          title: isAr ? 'مركز تنبيهات نقص المخزون' : 'Low Stock Alerts',
          icon: BellRing,
          iconStyle:
            lowStockCount > 0
              ? 'bg-red-50 text-[#DC2626] border-red-200'
              : 'bg-[#EFF7F1] text-[#0B5D32] border-[#DCE5DC]',
          action: () => {
            onSwitchWorkspaceMode?.('b2c');
            onOpenLowStockAlerts();
          },
          badge: lowStockCount > 0 ? String(lowStockCount) : null,
          badgeColor: 'bg-[#DC2626] text-white'
        },
        {
          id: 'qr_poster',
          title: isAr ? 'بوستر QR لطلبات الزبائن' : 'Customer QR Poster',
          icon: QrCode,
          iconStyle: 'bg-[#F4F4EA] text-[#3D5244] border-[#DCE5DC]',
          action: () => {
            onSwitchWorkspaceMode?.('b2c');
            onOpenQRPoster();
          },
          badge: null
        },
        {
          id: 'b2c_storefront',
          title: isAr ? 'معاينة متجر التوصيل المنزلي (B2C)' : 'Public Online Storefront',
          icon: Eye,
          iconStyle: 'bg-[#142018] text-[#FFE600] border-[#142018]',
          action: () => goInMode('b2c', 'b2c'),
          badge: isAr ? 'معاينة' : 'Preview',
          badgeColor: 'bg-[#F4F4EA] text-[#142018] border border-[#DCE5DC]'
        }
      ]
    },
    {
      groupTitle: isAr ? 'إعدادات المتجر والأمان' : 'Store Settings & Security',
      items: [
        {
          id: 'account_profile',
          accountSection: 'profile',
          title: isAr ? 'بيانات المتجر وعنوان التوصيل' : 'Store Profile & Details',
          icon: Store,
          iconStyle: 'bg-[#EFF7F1] text-[#0B5D32] border-[#DCE5DC]',
          action: () => openSection('profile', 'b2c'),
          badge: null
        },
        {
          id: 'account_security',
          accountSection: 'security',
          title: isAr ? 'تغيير كلمة المرور وأمان الكاشير' : 'Cashier PIN & Security',
          icon: KeyRound,
          iconStyle: 'bg-[#F4F4EA] text-[#3D5244] border-[#DCE5DC]',
          action: () => openSection('security', 'b2c'),
          badge: null
        },
        {
          id: 'account_support',
          accountSection: 'support',
          title: isAr ? 'الدعم الفني لنظام الكاشير 24/7' : '24/7 POS Support',
          icon: Headphones,
          iconStyle: 'bg-[#F4F4EA] text-[#3D5244] border-[#DCE5DC]',
          action: () => openSection('support', 'b2c'),
          badge: '24/7',
          badgeColor: 'bg-[#F4F4EA] text-[#3D5244] border border-[#DCE5DC]'
        },
        ...(onToggleStoreOpsEnabled
          ? [
              {
                id: 'disable_store_ops',
                title: isAr
                  ? 'إخفاء وضع متجري (العمل كحساب جملة B2B فقط)'
                  : 'Hide Store Mode (Wholesale B2B Only)',
                icon: Power,
                iconStyle: 'bg-[#F4F4EA] text-[#5F7164] border-[#DCE5DC]',
                action: () => {
                  onToggleStoreOpsEnabled(false);
                  onSwitchWorkspaceMode?.('b2b', 'marketplace');
                },
                badge: null
              }
            ]
          : []),
        {
          id: 'switch_account',
          title: isAr ? 'تبديل الحساب أو تسجيل الخروج' : 'Switch Account / Logout',
          icon: Repeat,
          iconStyle: 'bg-amber-50 text-[#B45309] border-amber-200',
          action: onLogout,
          badge: null
        }
      ]
    }
  ];

  const activeMenuGroups = drawerViewMode === 'b2c' && isStoreOpsEnabled ? b2cGroups : b2bGroups;

  const filteredGroups = activeMenuGroups
    .map((group) => {
      if (!searchTerm.trim()) return group;
      const term = searchTerm.toLowerCase();
      const matching = group.items.filter((item) => item.title.toLowerCase().includes(term));
      return { ...group, items: matching };
    })
    .filter((group) => group.items.length > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex overflow-hidden font-brand text-[#142018]"
      role="dialog"
      aria-modal="true"
      aria-label="Retailer Navigation Drawer"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/55 backdrop-blur-xs transition-opacity duration-200 animate-fadeIn"
      />

      {/* Drawer (Warm Cream POS Canvas) */}
      <div
        className={`relative w-full max-w-sm sm:max-w-md bg-[#F4F4EA] h-full shadow-2xl flex flex-col z-10 border-[#DCE5DC] transition-transform duration-300 transform ${
          isAr ? 'mr-auto border-r animate-slideInRight' : 'ml-auto border-l animate-slideInLeft'
        }`}
      >
        {/* ================= TOP HEADER ================= */}
        <div className="px-4 pt-4 pb-3.5 shrink-0 space-y-3 border-b border-[#DCE5DC] bg-[#F4F4EA]">
          {/* Header Top Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 shadow-2xs ${
                  drawerViewMode === 'b2c' ? 'bg-[#142018]' : 'bg-[#0B5D32]'
                }`}
              >
                {drawerViewMode === 'b2c' ? (
                  <Store className="w-4.5 h-4.5 text-[#FFE600]" />
                ) : (
                  <LayoutGrid className="w-4.5 h-4.5" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-black text-[#142018] leading-tight truncate">
                  {drawerViewMode === 'b2c'
                    ? isAr
                      ? 'إدارة متجري والكاشير (B2C)'
                      : 'My Store & POS (B2C)'
                    : isAr
                    ? 'القائمة وسوق الجملة (B2B)'
                    : 'Wholesale Menu (B2B)'}
                </h2>
                <p className="text-[10.5px] text-[#5F7164] truncate">
                  {drawerViewMode === 'b2c'
                    ? isAr
                      ? 'البيع للزبائن بالمفرد وإدارة المخزون'
                      : 'Consumer retail sales & inventory'
                    : isAr
                    ? 'التسوق بالجملة من الموردين · دليل الخيرات'
                    : 'B2B supplier sourcing · Dalil Al-Khairat'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {onToggleDarkMode && (
                <button
                  type="button"
                  onClick={onToggleDarkMode}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold transition cursor-pointer ${
                    isDarkMode
                      ? 'bg-[#142018] border-[#142018] text-[#FFE600]'
                      : 'bg-white border-[#DCE5DC] text-[#3D5244] hover:border-[#0B5D32]'
                  }`}
                  title={isAr ? 'تبديل وضع المظهر' : 'Toggle Appearance'}
                >
                  {isDarkMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-[#D97706]" />}
                  <span>{isDarkMode ? (isAr ? 'ليلي' : 'Dark') : (isAr ? 'فاتح' : 'Light')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white border border-[#DCE5DC] hover:border-red-300 hover:text-red-600 text-[#3D5244] flex items-center justify-center transition cursor-pointer"
                title={isAr ? 'إغلاق' : 'Close'}
                aria-label={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Workspace Identity Card — Visually distinct for B2B vs B2C */}
          <button
            type="button"
            onClick={() => handleItemClick(() => openSection('profile', drawerViewMode))}
            className={`w-full text-start text-white rounded-2xl p-3 flex items-center justify-between gap-2.5 transition shadow-xs cursor-pointer ${
              drawerViewMode === 'b2c'
                ? 'bg-[#142018] hover:bg-[#1E2E23]'
                : 'bg-[#0B5D32] hover:bg-[#094D29]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 text-white flex items-center justify-center shrink-0">
                {drawerViewMode === 'b2c' ? (
                  <Package className="w-5 h-5 text-[#FFE600]" />
                ) : (
                  <ShoppingBag className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs sm:text-[13px] text-white truncate">
                    {userSession?.entityName || (isAr ? 'سوبرماركت المنصور المركزي' : 'Al-Mansour Supermarket')}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#A7F3D0] shrink-0" />
                </div>
                <p className="text-[10.5px] text-white/80 truncate mt-0.5">
                  {userSession?.name || (isAr ? 'عمار خضير' : 'Store Manager')} · {activeDistrictName || (isAr ? 'بغداد' : 'Baghdad')}
                </p>
              </div>
            </div>

            {drawerViewMode === 'b2c' ? (
              <div className="px-2.5 py-1.5 rounded-xl bg-white/15 border border-white/20 shrink-0 text-end">
                <div className="text-[9.5px] font-bold text-white/80 leading-none">
                  {isAr ? 'وضع العمل' : 'Workspace'}
                </div>
                <div className="text-[11px] font-black text-[#FFE600] mt-1">
                  {isAr ? 'متجري B2C' : 'Store B2C'}
                </div>
              </div>
            ) : (
              <div className="px-2.5 py-1.5 rounded-xl bg-white/15 border border-white/20 shrink-0 text-end">
                <div className="text-[9.5px] font-bold text-white/80 leading-none">
                  {isAr ? 'ائتمان الجملة' : 'B2B Credit'}
                </div>
                <div className="text-xs font-black font-mono tabular-nums text-[#FFE600] mt-1">
                  $14,500
                </div>
              </div>
            )}
          </button>

          {/* Segmented Workspace Switcher (B2B Wholesale <-> My Store B2C & POS) */}
          {isStoreOpsEnabled ? (
            <div
              className="grid grid-cols-2 gap-1 p-1 bg-white border border-[#DCE5DC] rounded-2xl shadow-2xs"
              role="tablist"
              aria-label={isAr ? 'التبديل بين الجملة ومتجري' : 'Workspace Mode Switcher'}
            >
              <button
                type="button"
                role="tab"
                aria-selected={drawerViewMode === 'b2b'}
                onClick={() => {
                  setDrawerViewMode('b2b');
                  onSwitchWorkspaceMode?.('b2b', 'marketplace');
                }}
                className={`py-2 px-2.5 rounded-xl text-[11.5px] font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  drawerViewMode === 'b2b'
                    ? 'bg-[#0B5D32] text-white shadow-xs'
                    : 'text-[#4B6352] hover:bg-[#F4F4EA]'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{isAr ? 'سوق الجملة (B2B)' : 'Wholesale (B2B)'}</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={drawerViewMode === 'b2c'}
                onClick={() => {
                  setDrawerViewMode('b2c');
                  onSwitchWorkspaceMode?.('b2c', 'store_pos');
                }}
                className={`py-2 px-2.5 rounded-xl text-[11.5px] font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  drawerViewMode === 'b2c'
                    ? 'bg-[#142018] text-[#FFE600] shadow-xs'
                    : 'text-[#4B6352] hover:bg-[#F4F4EA]'
                }`}
              >
                <Store className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{isAr ? 'متجري والمفرد (B2C)' : 'My Store (B2C)'}</span>
              </button>
            </div>
          ) : (
            onToggleStoreOpsEnabled && (
              <div className="bg-white border border-[#DCE5DC] rounded-2xl p-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-[#142018] truncate">
                    {isAr ? 'حساب مشتري جملة فقط (B2B)' : 'Wholesale Buyer Only (B2B)'}
                  </p>
                  <p className="text-[10px] text-[#5F7164] truncate">
                    {isAr ? 'تريد فتح متجر مفرد أو كاشير؟' : 'Need POS & B2C storefront?'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onToggleStoreOpsEnabled(true);
                    setDrawerViewMode('b2c');
                    onSwitchWorkspaceMode?.('b2c', 'store_pos');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#0B5D32] hover:bg-[#094D29] text-white text-[11px] font-black shrink-0 cursor-pointer transition"
                >
                  {isAr ? 'تفعيل متجري' : 'Enable Store'}
                </button>
              </div>
            )
          )}

          {/* POS-Style Pill Search Input */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#0B5D32] absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={
                drawerViewMode === 'b2c'
                  ? isAr
                    ? 'بحث داخل أدوات متجري والكاشير...'
                    : 'Search store & POS tools...'
                  : isAr
                  ? 'بحث سريع في خدمات الجملة...'
                  : 'Quick search B2B services...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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

        {/* ================= SCROLLABLE NAVIGATION GROUPS ================= */}
        <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-4">
          {filteredGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              {/* Clean Unboxed Section Header */}
              <div className="px-1.5 flex items-center justify-between">
                <span className="text-[11px] font-black text-[#4B6352]">{group.groupTitle}</span>
                <span className="text-[10px] font-bold text-[#78897C] tabular-nums">
                  {group.items.length}
                </span>
              </div>

              {/* Clean White Card Group */}
              <div className="bg-white border border-[#DCE5DC] rounded-2xl overflow-hidden divide-y divide-[#EFF3EE]">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isCurrentActive =
                    activeTab === item.id ||
                    (item.id === 'b2c_storefront' && activeTab === 'b2c') ||
                    (activeTab === 'account_hub' &&
                      item.accountSection !== undefined &&
                      item.accountSection === activeAccountSection &&
                      !item.isDanger);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemClick(item.action)}
                      className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 transition text-start group cursor-pointer ${
                        isCurrentActive
                          ? 'bg-[#EFF7F1]'
                          : item.isDanger
                          ? 'hover:bg-red-50/70'
                          : 'hover:bg-[#F9FAF6]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                            isCurrentActive
                              ? 'bg-[#0B5D32] text-white border-[#0B5D32] shadow-2xs'
                              : item.iconStyle
                          }`}
                        >
                          <Icon className="w-4 h-4 stroke-[2.2]" />
                        </div>

                        <span
                          className={`text-xs truncate ${
                            isCurrentActive
                              ? 'text-[#0B5D32] font-black'
                              : item.isDanger
                              ? 'text-[#DC2626] font-bold'
                              : 'text-[#142018] font-bold group-hover:text-[#0B5D32]'
                          }`}
                        >
                          {item.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.badge && (
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap tabular-nums ${
                              item.badgeColor || 'bg-[#F4F4EA] text-[#3D5244]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        <ArrowIcon
                          className={`w-4 h-4 transition-transform ${
                            isCurrentActive
                              ? 'text-[#0B5D32]'
                              : 'text-[#9AA89D] group-hover:text-[#0B5D32]'
                          } ${isAr ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'}`}
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
              {isAr ? 'لا توجد خدمات مطابقة للبحث' : 'No matching services found'}
            </div>
          )}
        </div>

        {/* ================= POLISHED POS-STYLE FOOTER ================= */}
        <div className="bg-white border-t border-[#DCE5DC] px-4 py-3 shrink-0 flex items-center justify-between gap-2">
          {/* Language Pill Switch */}
          <div className="flex items-center gap-0.5 bg-[#F4F4EA] border border-[#DCE5DC] p-0.5 rounded-full text-[11px] font-bold">
            <button
              type="button"
              onClick={() => onLanguageChange('ar')}
              className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
                isAr ? 'bg-[#0B5D32] text-white shadow-2xs' : 'text-[#4B6352] hover:text-[#142018]'
              }`}
            >
              عربي
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
                !isAr ? 'bg-[#0B5D32] text-white shadow-2xs' : 'text-[#4B6352] hover:text-[#142018]'
              }`}
            >
              EN
            </button>
          </div>

          {/* Currency Pill Switch */}
          <div className="flex items-center gap-0.5 bg-[#F4F4EA] border border-[#DCE5DC] p-0.5 rounded-full text-[11px] font-bold">
            <button
              type="button"
              onClick={() => onCurrencyChange('IQD')}
              className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
                currency === 'IQD' ? 'bg-[#0B5D32] text-white shadow-2xs' : 'text-[#4B6352] hover:text-[#142018]'
              }`}
            >
              د.ع
            </button>
            <button
              type="button"
              onClick={() => onCurrencyChange('USD')}
              className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
                currency === 'USD' ? 'bg-[#0B5D32] text-white shadow-2xs' : 'text-[#4B6352] hover:text-[#142018]'
              }`}
            >
              $ USD
            </button>
          </div>

          {/* Close Pill Button */}
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
