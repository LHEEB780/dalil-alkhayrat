import React, { useState } from 'react';
import { 
  Store, 
  Truck, 
  Building2, 
  ShoppingBag, 
  Search, 
  Sparkles, 
  Download, 
  Wifi, 
  WifiOff, 
  Barcode, 
  Layers, 
  FileCode2, 
  QrCode, 
  Package, 
  LogOut, 
  UserCircle,
  Repeat,
  Bell,
  Smile,
  Zap,
  Globe,
  Menu
} from 'lucide-react';
import { Role, Currency, Language, AppTab, StoreWorkspaceMode } from '../types/index.ts';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { UserSession } from '../views/WelcomeAuthView.tsx';

interface HeaderProps {
  userSession: UserSession | null;
  onLogout: () => void;
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAssistant: () => void;
  onOpenQRPoster: () => void;
  onOpenLowStockAlerts?: () => void;
  lowStockCount?: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isOnline: boolean;
  onToggleSidebar?: () => void;
  onOpenBarcodeScanner?: () => void;
  workspaceMode?: StoreWorkspaceMode;
  onSwitchWorkspaceMode?: (mode: StoreWorkspaceMode) => void;
  isStoreOpsEnabled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  userSession,
  onLogout,
  currency,
  onCurrencyChange,
  language,
  onLanguageChange,
  cartCount,
  onOpenCart,
  onOpenAssistant,
  onOpenQRPoster,
  onOpenLowStockAlerts,
  lowStockCount = 0,
  searchQuery,
  onSearchChange,
  activeTab,
  setActiveTab,
  isOnline,
  onToggleSidebar,
  onOpenBarcodeScanner,
  workspaceMode = 'b2b',
  onSwitchWorkspaceMode,
  isStoreOpsEnabled = true
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  const isAr = language === 'ar';
  const isStoreUser = userSession?.role === 'store';
  const isCashierUser = userSession?.role === 'cashier';
  const isAccountantUser = userSession?.role === 'accountant';
  const isDriverUser = userSession?.role === 'driver';
  const isB2CWorkspace = isStoreUser && workspaceMode === 'b2c';

  return (
    <header className="sticky top-0 z-40 w-full max-w-full bg-white border-b border-[#E5E7EB] shadow-xs overflow-x-clip">
      
      {/* Top Wholesale Promo Banner — Shown ONLY in B2B Wholesale mode (never for B2C, Cashier, Accountant, or Driver DSD) */}
      {!isB2CWorkspace && !isCashierUser && !isAccountantUser && !isDriverUser && (
        <div className="bg-[#FFE600] text-[#221F1F] py-1.5 px-3 sm:px-4 text-xs font-bold text-center flex items-center justify-center gap-2 border-b border-yellow-300">
          <span className="bg-[#221F1F] text-[#FFE600] text-[10px] px-2 py-0.5 rounded font-black tracking-wider shrink-0">
            9-15.11
          </span>
          <span className="flex items-center gap-1 font-extrabold text-[11px] sm:text-xs truncate min-w-0">
            <span className="truncate">
              {isAr 
                ? 'أسبوع التسوق الكبير بالجملة في دليل الخيرات: خصومات تصل إلى 60%' 
                : 'Grand Wholesale Shopping Week at Dalil Al-Khairat: Up to 60% OFF'}
            </span>
            <span className="hidden md:inline shrink-0">
              {isAr ? '• شحن مجاني SMART للمتاجر' : '• SMART Free Shipping for Stores'}
            </span>
          </span>
        </div>
      )}

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-3">
          
          {/* Logo & Mode Identity */}
          <div className="flex items-center gap-2 min-w-0 flex-1 md:flex-initial">
            <div 
              onClick={() =>
                setActiveTab(
                  isDriverUser
                    ? 'driver'
                    : isAccountantUser
                    ? 'account_hub'
                    : isCashierUser || isB2CWorkspace
                    ? 'store_pos'
                    : 'marketplace'
                )
              }
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group min-w-0"
            >
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0 ${
                isCashierUser
                  ? 'bg-[#0F766E]'
                  : isAccountantUser
                  ? 'bg-indigo-700'
                  : isDriverUser
                  ? 'bg-[#0B5D32]'
                  : isB2CWorkspace
                  ? 'bg-[#142018]'
                  : 'bg-[#0B5D32]'
              }`}>
                {isDriverUser ? (
                  <Truck className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#FFE600]" />
                ) : isCashierUser || isAccountantUser || isB2CWorkspace ? (
                  <Store className={`w-4.5 h-4.5 sm:w-5 sm:h-5 ${isCashierUser || isAccountantUser ? 'text-white' : 'text-[#FFE600]'}`} />
                ) : (
                  <Smile className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[2.2]" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm sm:text-lg lg:text-xl font-black text-[#142018] tracking-tight font-brand transition-all truncate">
                    {isDriverUser
                      ? (isAr ? 'دليل الخيرات · الفان' : 'Dalil · Van DSD')
                      : isCashierUser || isAccountantUser || isB2CWorkspace
                      ? (userSession?.entityName || (isAr ? 'متجري' : 'My Store'))
                      : (isAr ? 'دليل الخيرات' : 'Dalil Al-Khairat')}
                  </span>
                  <span className={`hidden sm:inline-block text-[10px] font-black px-2 py-0.5 rounded-md font-brand shrink-0 border ${
                    isCashierUser
                      ? 'bg-teal-50 text-teal-800 border-teal-200'
                      : isAccountantUser
                      ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                      : isDriverUser
                      ? 'bg-[#142018] text-[#FFE600] border-[#142018]'
                      : isB2CWorkspace
                      ? 'bg-[#142018] text-[#FFE600] border-[#142018]'
                      : 'bg-[#EBF4EE] text-[#0B5D32] border-[#CBE0D0]'
                  }`}>
                    {isCashierUser
                      ? (isAr ? 'كاشير مقيد' : 'Cashier POS')
                      : isAccountantUser
                      ? (isAr ? 'محاسب مالي' : 'Accountant')
                      : isDriverUser
                      ? (isAr ? 'توزيع مباشر DSD' : 'Van Sales DSD')
                      : isB2CWorkspace
                      ? (isAr ? 'متجري B2C' : 'Store B2C')
                      : (isAr ? 'جملة B2B' : 'Wholesale B2B')}
                  </span>
                </div>
                <span className="hidden sm:block text-[11px] text-[#5F7164] font-brand truncate">
                  {isDriverUser
                    ? (userSession?.entityName || (isAr ? 'منظومة التوزيع الميداني والمبيعات بالجملة' : 'Enterprise Direct Store Delivery'))
                    : isCashierUser
                    ? (isAr
                        ? `${userSession?.branchName ? `${userSession.branchName} · ` : ''}صلاحية بيع مباشر ومراقبة الرفوف فقط`
                        : 'POS Checkout & Shelf Counts Only')
                    : isAccountantUser
                    ? (isAr
                        ? `${userSession?.branchName ? `${userSession.branchName} · ` : ''}مراجعة الفواتير ودفتر الائتمان فقط`
                        : 'Invoices & Credit Ledger Review Only')
                    : isB2CWorkspace
                    ? (isAr ? 'كاشير المحل ومتجر التوصيل للمفرد' : 'In-Store POS & Consumer Storefront')
                    : (isAr ? 'منظومة التوريد بالجملة للمحلات والمطاعم' : 'B2B Wholesale Supply for Stores & Restaurants')}
                </span>
              </div>
            </div>
          </div>

          {/* Search bar with Barcode prompt (Desktop / Tablet — B2B Wholesale Store only) */}
          {!isB2CWorkspace && !isCashierUser && !isAccountantUser && !isDriverUser && (isStoreUser || activeTab === 'marketplace') && (
            <div className="flex-1 max-w-lg hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder={isAr 
                    ? 'ابحث في سوق الجملة عن قهوة، أرز، زيوت، أو امسح الباركود...' 
                    : 'Search wholesale catalog for coffee, rice, oils, or scan barcode...'}
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className={`w-full bg-[#F4F4EA] border border-[#DCE5DC] rounded-lg py-2 ${
                    isAr ? 'pr-10 pl-16' : 'pl-10 pr-16'
                  } text-xs text-[#142018] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B5D32] focus:border-transparent transition-all`}
                />
                <Search className={`w-4 h-4 text-[#5F7164] absolute ${isAr ? 'right-3' : 'left-3'} top-2.5`} />
                <button
                  type="button"
                  onClick={onOpenBarcodeScanner}
                  className={`absolute ${isAr ? 'left-2' : 'right-2'} top-1.5 flex items-center gap-1 text-[10px] font-mono bg-white hover:bg-[#EBF4EE] border border-[#DCE5DC] hover:border-[#0B5D32] px-2 py-1 rounded-md text-[#5F7164] hover:text-[#0B5D32] transition cursor-pointer`}
                  title={isAr ? 'فتح قارئ الباركود الشامل' : 'Open Barcode Scanner'}
                >
                  <Barcode className="w-3.5 h-3.5 text-[#0B5D32]" />
                  <span>GTIN</span>
                </button>
              </div>
            </div>
          )}

          {/* B2C / Cashier / Accountant Workspace Context Summary Strip on Desktop */}
          {(isB2CWorkspace || isCashierUser || isAccountantUser) && (
            <div className="hidden md:flex items-center gap-2 bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-1.5 text-xs font-bold text-[#3D5244]">
              <Package className={`w-4 h-4 ${isCashierUser ? 'text-teal-700' : isAccountantUser ? 'text-indigo-700' : 'text-[#0B5D32]'}`} />
              <span>
                {isCashierUser
                  ? (isAr ? 'صلاحية أمين الصندوق · سوق الجملة والأرباح والائتمان محجوبة' : 'Cashier Restricted · Wholesale & Profits Hidden')
                  : isAccountantUser
                  ? (isAr ? 'صلاحية المحاسب · الفواتير ودفتر الائتمان والمدفوعات فقط' : 'Accountant Restricted · Invoices & Ledger Only')
                  : (isAr ? 'وضع إدارة المحل والبيع للزبائن (مفرد)' : 'Store Operations & Retail Mode')}
              </span>
            </div>
          )}

          {/* Compact Mobile Quick Actions (< md) - prevents horizontal overflow */}
          <div className="flex md:hidden items-center gap-1.5 shrink-0">
            {isStoreUser ? (
              <>
                {/* Compact Mode Pill on Mobile when Store Ops enabled */}
                {isStoreOpsEnabled && onSwitchWorkspaceMode && (
                  <button
                    type="button"
                    onClick={() => onSwitchWorkspaceMode(isB2CWorkspace ? 'b2b' : 'b2c')}
                    className={`h-9 px-2.5 rounded-lg border text-[11px] font-black flex items-center gap-1 transition cursor-pointer whitespace-nowrap ${
                      isB2CWorkspace
                        ? 'bg-[#142018] text-[#FFE600] border-[#142018]'
                        : 'bg-[#EBF4EE] text-[#0B5D32] border-[#CBE0D0]'
                    }`}
                    title={isB2CWorkspace ? (isAr ? 'الانتقال لسوق الجملة B2B' : 'Switch to B2B Wholesale') : (isAr ? 'الانتقال لوضع متجري B2C' : 'Switch to My Store B2C')}
                  >
                    <Repeat className="w-3 h-3" />
                    <span>{isB2CWorkspace ? 'B2C' : 'B2B'}</span>
                  </button>
                )}

                {isB2CWorkspace && onOpenLowStockAlerts && (
                  <button
                    type="button"
                    onClick={onOpenLowStockAlerts}
                    className="relative w-9 h-9 flex items-center justify-center text-[#142018] hover:bg-red-50 border border-[#DCE5DC] rounded-lg transition cursor-pointer"
                    title={isAr ? 'تنبيهات نقص المخزون' : 'Low Stock Alerts'}
                    aria-label={isAr ? 'تنبيهات نقص المخزون' : 'Low Stock Alerts'}
                  >
                    <Bell className={`w-4 h-4 ${lowStockCount > 0 ? 'text-[#DC2626]' : 'text-[#5F7164]'}`} />
                    {lowStockCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#DC2626] text-white text-[9px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center border border-white tabular-nums">
                        {lowStockCount}
                      </span>
                    )}
                  </button>
                )}

                {!isB2CWorkspace && (
                  <button
                    type="button"
                    onClick={onOpenCart}
                    className="relative w-9 h-9 rounded-lg bg-[#0B5D32] hover:bg-[#094D29] text-white transition shadow-xs flex items-center justify-center cursor-pointer"
                    aria-label={isAr ? 'سلة شراء الجملة' : 'Wholesale Cart'}
                    title={isAr ? 'سلة شراء الجملة' : 'Wholesale Cart'}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#FFE600] text-[#142018] text-[10px] font-black h-4 min-w-4 px-1 rounded-full flex items-center justify-center border border-white tabular-nums">
                        {cartCount}
                      </span>
                    )}
                  </button>
                )}

                {onToggleSidebar && (
                  <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="w-9 h-9 rounded-lg border border-[#DCE5DC] bg-[#F4F4EA] hover:bg-[#EBF4EE] hover:border-[#0B5D32] text-[#142018] flex items-center justify-center transition cursor-pointer"
                    aria-label={isAr ? 'القائمة والأقسام' : 'Menu & Sections'}
                    title={isAr ? 'القائمة والأقسام' : 'Menu & Sections'}
                  >
                    <Menu className="w-4.5 h-4.5" />
                  </button>
                )}
              </>
            ) : isCashierUser ? (
              <>
                {onOpenLowStockAlerts && (
                  <button
                    type="button"
                    onClick={onOpenLowStockAlerts}
                    className="relative w-9 h-9 flex items-center justify-center text-[#142018] hover:bg-red-50 border border-[#DCE5DC] rounded-lg transition cursor-pointer"
                    title={isAr ? 'تنبيهات نقص المخزون' : 'Low Stock Alerts'}
                    aria-label={isAr ? 'تنبيهات نقص المخزون' : 'Low Stock Alerts'}
                  >
                    <Bell className={`w-4 h-4 ${lowStockCount > 0 ? 'text-[#DC2626]' : 'text-[#5F7164]'}`} />
                    {lowStockCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#DC2626] text-white text-[9px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center border border-white tabular-nums">
                        {lowStockCount}
                      </span>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onLanguageChange(isAr ? 'en' : 'ar')}
                  className="h-9 px-2.5 rounded-lg border border-[#DCE5DC] bg-[#F4F4EA] text-xs font-bold text-[#142018] cursor-pointer"
                >
                  {isAr ? 'EN' : 'عربي'}
                </button>
                {userSession && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-9 h-9 rounded-lg border border-[#DCE5DC] bg-[#F4F4EA] text-[#142018] flex items-center justify-center cursor-pointer"
                    title={isAr ? 'تبديل الحساب / تسجيل خروج' : 'Switch Account'}
                  >
                    <Repeat className="w-4 h-4 text-[#0B5D32]" />
                  </button>
                )}
              </>
            ) : isDriverUser ? (
              <>
                <button
                  type="button"
                  onClick={() => onLanguageChange(isAr ? 'en' : 'ar')}
                  className="h-9 px-2.5 rounded-lg border border-[#DCE5DC] bg-[#F4F4EA] text-xs font-bold text-[#142018] cursor-pointer"
                >
                  {isAr ? 'EN' : 'عربي'}
                </button>
                {userSession && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-9 h-9 rounded-lg border border-[#DCE5DC] bg-[#F4F4EA] text-[#142018] flex items-center justify-center cursor-pointer"
                    title={isAr ? 'تبديل الحساب' : 'Switch Account'}
                  >
                    <Repeat className="w-4 h-4 text-[#0B5D32]" />
                  </button>
                )}
                {onToggleSidebar && (
                  <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="w-9 h-9 rounded-lg border border-[#DCE5DC] bg-[#F4F4EA] hover:bg-[#EBF4EE] hover:border-[#0B5D32] text-[#142018] flex items-center justify-center transition cursor-pointer shrink-0"
                    aria-label={isAr ? 'قائمة منظومة الفان' : 'Van Sales Menu'}
                    title={isAr ? 'قائمة منظومة الفان' : 'Van Sales Menu'}
                  >
                    <Menu className="w-4.5 h-4.5" />
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onLanguageChange(isAr ? 'en' : 'ar')}
                  className="h-9 px-2.5 rounded-lg border border-[#E9E9E9] bg-[#F5F5F5] text-xs font-bold text-[#221F1F] cursor-pointer"
                >
                  {isAr ? 'EN' : 'عربي'}
                </button>
                {userSession && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-9 h-9 rounded-lg border border-[#E9E9E9] bg-[#F5F5F5] text-[#221F1F] flex items-center justify-center cursor-pointer"
                    title={isAr ? 'تبديل الحساب' : 'Switch Account'}
                  >
                    <Repeat className="w-4 h-4 text-[#00A046]" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Desktop / Tablet Full Action Toolbar (md+) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            
            {/* Segmented B2B / B2C Workspace Switcher for Store Users */}
            {isStoreUser && isStoreOpsEnabled && onSwitchWorkspaceMode && (
              <div className="flex items-center bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl p-0.5 text-[11px] font-black whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => onSwitchWorkspaceMode('b2b')}
                  className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    !isB2CWorkspace
                      ? 'bg-[#0B5D32] text-white shadow-2xs'
                      : 'text-[#4B6352] hover:text-[#142018]'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{isAr ? 'جملة B2B' : 'Wholesale'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchWorkspaceMode('b2c')}
                  className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    isB2CWorkspace
                      ? 'bg-[#142018] text-[#FFE600] shadow-2xs'
                      : 'text-[#4B6352] hover:text-[#142018]'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>{isAr ? 'متجري B2C' : 'My Store'}</span>
                </button>
              </div>
            )}

            {/* Language Switcher (Ar / En) */}
            <button
              onClick={() => onLanguageChange(isAr ? 'en' : 'ar')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#DCE5DC] bg-[#F4F4EA] hover:bg-white text-xs font-bold text-[#142018] transition cursor-pointer shadow-2xs whitespace-nowrap"
              title={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
            >
              <Globe className="w-3.5 h-3.5 text-[#0B5D32]" />
              <span className="font-brand">{isAr ? 'English' : 'عربي'}</span>
            </button>

            {/* Currency Selector */}
            <div className="flex items-center bg-[#F4F4EA] border border-[#DCE5DC] rounded-lg p-0.5 text-xs font-medium whitespace-nowrap">
              <button
                onClick={() => onCurrencyChange('IQD')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${currency === 'IQD' ? 'bg-[#0B5D32] text-white shadow-xs font-bold' : 'text-[#5F7164] hover:text-[#142018]'}`}
                title={isAr ? 'الدينار العراقي' : 'Iraqi Dinar'}
              >
                {isAr ? 'د.ع' : 'IQD'}
              </button>
              <button
                onClick={() => onCurrencyChange('USD')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${currency === 'USD' ? 'bg-[#0B5D32] text-white shadow-xs font-bold' : 'text-[#5F7164] hover:text-[#142018]'}`}
                title={isAr ? 'الدولار الأمريكي' : 'US Dollar'}
              >
                USD $
              </button>
            </div>

            {/* AI Financial Advisor button (B2B Wholesale & Store Finance) */}
            {isStoreUser && !isB2CWorkspace && (
              <button
                onClick={onOpenAssistant}
                className="flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 text-xs font-bold rounded-lg bg-[#EBF4EE] text-[#0B5D32] border border-[#CBE0D0] hover:bg-[#dcece2] transition shadow-xs cursor-pointer whitespace-nowrap"
                title={isAr ? 'المستشار المالي الذكي (Gemini)' : 'Smart AI Financial Advisor'}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0B5D32]" />
                <span className="hidden xl:inline">{isAr ? 'المستشار الذكي' : 'AI Advisor'}</span>
              </button>
            )}

            {/* QR Poster Studio button (Store B2C Mode Only) */}
            {isB2CWorkspace && (
              <button
                onClick={onOpenQRPoster}
                className="p-2 text-[#142018] hover:bg-[#F4F4EA] border border-[#DCE5DC] rounded-lg transition cursor-pointer"
                title={isAr ? 'بوستر QR لطلبات الزبائن' : 'Store QR Poster'}
              >
                <QrCode className="w-4 h-4 text-[#0B5D32]" />
              </button>
            )}

            {/* Low Stock Alert Bell (Store B2C Mode & Restricted Cashier) */}
            {(isB2CWorkspace || isCashierUser) && onOpenLowStockAlerts && (
              <button
                onClick={onOpenLowStockAlerts}
                className="relative p-2 text-[#142018] hover:bg-red-50 border border-[#DCE5DC] hover:border-red-200 rounded-lg transition cursor-pointer"
                title={isAr ? 'تنبيهات انخفاض ونقص المخزون' : 'Low Stock Alerts'}
              >
                <Bell className={`w-4 h-4 ${lowStockCount > 0 ? 'text-[#DC2626]' : 'text-[#5F7164]'}`} />
                {lowStockCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#DC2626] text-white text-[10px] font-bold h-4.5 min-w-4.5 px-1 rounded-full flex items-center justify-center border-2 border-white shadow-xs tabular-nums">
                    {lowStockCount}
                  </span>
                )}
              </button>
            )}

            {/* Wholesale B2B Cart Button (B2B Mode Only) */}
            {isStoreUser && !isB2CWorkspace && (
              <button
                onClick={onOpenCart}
                className="relative p-2.5 rounded-lg bg-[#0B5D32] hover:bg-[#094D29] text-white transition shadow-xs flex items-center justify-center cursor-pointer"
                aria-label={isAr ? 'سلة شراء الجملة' : 'Wholesale Cart'}
                title={isAr ? 'سلة شراء الجملة' : 'Wholesale Cart'}
              >
                <ShoppingBag className="w-4.5 h-4.5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#FFE600] text-[#142018] text-[11px] font-black h-5 min-w-5 px-1 rounded-full flex items-center justify-center border-2 border-white shadow-xs tabular-nums">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* PWA Install */}
            {!isInstalled && isInstallable && (
              <button
                onClick={install}
                className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold bg-[#221F1F] text-white rounded-lg hover:bg-black transition cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isAr ? 'تثبيت PWA' : 'Install PWA'}</span>
              </button>
            )}

            {/* Connectivity status */}
            <div className="pr-1 text-xs hidden xl:flex items-center">
              {isOnline ? (
                <span className="flex items-center gap-1 text-[#00A046] text-[11px] font-semibold bg-[#E8F8EE] px-2 py-0.5 rounded-full border border-[#B3EBC8]">
                  <Wifi className="w-3 h-3" />
                  <span>{isAr ? 'متصل' : 'Online'}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-700 text-[11px] font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <WifiOff className="w-3 h-3" />
                  <span>{isAr ? 'أوفلاين' : 'Offline'}</span>
                </span>
              )}
            </div>

            {/* User Session Profile & Role Switcher */}
            {userSession && (
              <div className="flex items-center gap-2 pr-2 border-r border-[#E9E9E9]">
                <div className={`hidden lg:flex flex-col ${isAr ? 'text-right' : 'text-left'}`}>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-[#221F1F] whitespace-nowrap">{userSession.name}</span>
                    <span className="text-[10px] font-bold bg-[#E8F8EE] border border-[#B3EBC8] text-[#00A046] px-1.5 py-0.2 rounded whitespace-nowrap">
                      {userSession.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#797878] truncate max-w-32">{userSession.entityName}</span>
                </div>

                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E9E9E9] bg-[#F5F5F5] hover:bg-red-50 hover:text-[#F84147] hover:border-red-200 text-xs font-semibold text-[#221F1F] transition cursor-pointer whitespace-nowrap"
                  title={isAr ? 'تبديل الحساب أو تسجيل الخروج' : 'Switch Account or Logout'}
                >
                  <Repeat className="w-3.5 h-3.5 text-[#00A046]" />
                  <span className="hidden lg:inline">{isAr ? 'تبديل الحساب' : 'Switch'}</span>
                </button>

                {isDriverUser && onToggleSidebar && (
                  <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="w-9 h-9 rounded-lg border border-[#DCE5DC] bg-[#F4F4EA] hover:bg-[#EBF4EE] hover:border-[#0B5D32] text-[#142018] flex items-center justify-center transition cursor-pointer shrink-0"
                    aria-label={isAr ? 'قائمة منظومة الفان' : 'Van Sales Menu'}
                    title={isAr ? 'قائمة منظومة الفان' : 'Van Sales Menu'}
                  >
                    <Menu className="w-4.5 h-4.5" />
                  </button>
                )}
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Role-Specific Navigation Bar removed as requested - navigation now handled via Sidebar Drawer and Bottom Bar */}

      {/* iOS Safari PWA Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-right shadow-2xl">
            <h3 className="text-lg font-bold text-[#221F1F]">
              {isAr ? 'تثبيت تطبيق دليل الخيرات على iPhone / iPad' : 'Install Dalil Al-Khairat on iOS'}
            </h3>
            <p className="mt-2 text-sm text-[#797878] leading-relaxed">
              {isAr ? (
                <>
                  1. اضغط على أيقونة <strong>المشاركة (Share)</strong> في شريط متصفح Safari السفلي.<br/>
                  2. مرر للأسفل واضغط على <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.<br/>
                  3. سيعمل التطبيق بكامل سرعته وبشكل منفصل دون الحاجة للمتصفح.
                </>
              ) : (
                <>
                  1. Tap the <strong>Share</strong> button in Safari's bottom toolbar.<br/>
                  2. Scroll down and tap <strong>Add to Home Screen</strong>.<br/>
                  3. The app will launch in standalone fast offline mode.
                </>
              )}
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-[#00A046] text-white font-bold hover:bg-[#008a3c] transition cursor-pointer"
            >
              {isAr ? 'تم، حسناً' : 'Done'}
            </button>
          </div>
        </div>
      )}

    </header>
  );
};
