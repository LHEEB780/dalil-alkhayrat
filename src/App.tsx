import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { CategoryBar } from './components/CategoryBar.tsx';
import { OfferComparisonModal } from './components/OfferComparisonModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { StoreAssistantModal } from './components/StoreAssistantModal.tsx';
import { QRPosterModal } from './components/QRPosterModal.tsx';
import { LowStockNotificationModal, LowStockAlertItem } from './components/LowStockNotificationModal.tsx';
import { RetailerBottomNav } from './components/RetailerBottomNav.tsx';
import { RetailerSidebarDrawer } from './components/RetailerSidebarDrawer.tsx';
import { VanSidebarDrawer } from './components/VanSidebarDrawer.tsx';
import { BarcodeSearchModal } from './components/BarcodeSearchModal.tsx';

import { WelcomeAuthView, UserSession } from './views/WelcomeAuthView.tsx';
import { StoreMarketplaceView } from './views/StoreMarketplaceView.tsx';
import { SuppliersDirectoryView } from './views/SuppliersDirectoryView.tsx';
import { SupplierPortalView } from './views/SupplierPortalView.tsx';
import { DriverVanView } from './views/DriverVanView.tsx';
import { StorePOSInventoryView } from './views/StorePOSInventoryView.tsx';
import { CollectiveDealsView } from './views/CollectiveDealsView.tsx';
import { PublicStorefrontView } from './views/PublicStorefrontView.tsx';
import { StorefrontManagementView } from './views/StorefrontManagementView.tsx';
import { SupplierStorePageView } from './views/SupplierStorePageView.tsx';
import { RetailerAccountHubView } from './views/RetailerAccountHubView.tsx';
import { AllCategoriesView } from './views/AllCategoriesView.tsx';
import { CategoryBranchesView } from './views/CategoryBranchesView.tsx';
import { AllBrandsView } from './views/AllBrandsView.tsx';
import { ApiDocsView } from './views/ApiDocsView.tsx';

import {
  ProductWithOffers,
  SupplierOfferItem,
  CartItem,
  Currency,
  Role,
  OrderItem,
  Language,
  AppTab,
  AccountSectionId,
  StoreBranchAddress,
  StoreWorkspaceMode,
  SupplierOrderRules,
  VanModuleSection
} from './types/index.ts';
import {
  WholesaleSupplier,
  BAGHDAD_DISTRICTS,
  StoreDistrict,
  resolveWholesaleSupplierByOffer
} from './data/nearbySuppliers.ts';
import { fetchWithRetry } from './utils/fetchWithRetry.ts';
import { getInitialOfferQuantity } from '../shared/orderRules.ts';

export default function App() {
  const [currency, setCurrency] = useState<Currency>('IQD');
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('dalil_lang');
      return (saved === 'en' || saved === 'ar') ? saved : 'ar';
    } catch {
      return 'ar';
    }
  });

  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuotaExceeded = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  // Sync direction and title with language
  useEffect(() => {
    try {
      localStorage.setItem('dalil_lang', language);
    } catch (e) {
      console.error(e);
    }
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.title = language === 'ar' 
      ? 'دليل الخيرات | Dalil Al-Khairat B2B' 
      : 'Dalil Al-Khairat | B2B Food & Wholesale Iraq';
  }, [language]);
  
  // Isolated user session state
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('souq_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  // Bearer token held strictly in JS/React memory (never in localStorage/sessionStorage)
  const [authToken, setAuthToken] = useState<string | null>(null);

  const [activeTab, setActiveTabState] = useState<AppTab>('marketplace');
  const [workspaceMode, setWorkspaceMode] = useState<StoreWorkspaceMode>('b2b');
  const [isStoreOpsEnabled, setIsStoreOpsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('dalil_store_ops_enabled');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const [tabHistory, setTabHistory] = useState<AppTab[]>([]);
  const [selectedSupplierStore, setSelectedSupplierStore] = useState<WholesaleSupplier | null>(null);
  const [supplierReturnTab, setSupplierReturnTab] = useState<AppTab>('marketplace');
  const [activeAccountSection, setActiveAccountSection] = useState<AccountSectionId>('profile');
  const [branchesReturnTab, setBranchesReturnTab] = useState<'marketplace' | 'all_categories'>('marketplace');
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [vanActiveSection, setVanActiveSection] = useState<VanModuleSection>('pos_sell');
  const [vanOpenShiftSignal, setVanOpenShiftSignal] = useState<number>(0);
  const [vanSummary, setVanSummary] = useState({
    cashCustodyIQD: 0,
    remainingUnits: 0,
    pendingOrdersCount: 0,
    pendingRestockCount: 0,
    nearExpiryCount: 0,
    creditClientsCount: 0,
    vehiclePlate: '',
    vanWarehouseName: ''
  });

  const B2C_TABS: AppTab[] = ['store_pos', 'store_management', 'b2c'];
  const B2B_TABS: AppTab[] = ['marketplace', 'all_categories', 'category_branches', 'all_brands', 'suppliers', 'collective'];

  const handleToggleStoreOpsEnabled = (enabled: boolean) => {
    setIsStoreOpsEnabled(enabled);
    try {
      localStorage.setItem('dalil_store_ops_enabled', String(enabled));
    } catch {
      // ignore
    }
    if (!enabled) {
      setWorkspaceMode('b2b');
    }
  };

  const syncWorkspaceForTab = (tab: AppTab) => {
    if (B2C_TABS.includes(tab)) {
      if (!isStoreOpsEnabled) {
        handleToggleStoreOpsEnabled(true);
      }
      setWorkspaceMode('b2c');
    } else if (B2B_TABS.includes(tab)) {
      setWorkspaceMode('b2b');
    }
  };

  const isCashierUser = userSession?.role === 'cashier';
  const isAccountantUser = userSession?.role === 'accountant';
  const isRestrictedStaff = isCashierUser || isAccountantUser;

  const setActiveTab = (tab: AppTab) => {
    if (userSession?.role === 'driver') {
      setSelectedSupplierStore(null);
      setActiveTabState('driver');
      return;
    }
    if (userSession?.role === 'cashier') {
      setSelectedSupplierStore(null);
      setActiveTabState(tab === 'low_stock_alerts' ? 'low_stock_alerts' : 'store_pos');
      return;
    }
    if (userSession?.role === 'accountant') {
      setSelectedSupplierStore(null);
      setActiveTabState('account_hub');
      return;
    }
    let resolvedTab = tab;
    if (resolvedTab === 'supplier' && userSession?.role === 'store') {
      setActiveAccountSection('credit_ledger');
      resolvedTab = 'account_hub';
    }
    if (resolvedTab !== activeTab || selectedSupplierStore) {
      setTabHistory((prev) => {
        const next = prev[prev.length - 1] === activeTab ? prev : [...prev, activeTab];
        return next.slice(-20);
      });
    }
    setSelectedSupplierStore(null);
    setSupplierReturnTab('marketplace');
    syncWorkspaceForTab(resolvedTab);
    setActiveTabState(resolvedTab);
  };

  const handleSwitchWorkspaceMode = (mode: StoreWorkspaceMode, targetTab?: AppTab) => {
    if (userSession?.role === 'cashier') {
      setActiveTabState('store_pos');
      return;
    }
    if (userSession?.role === 'accountant') {
      setActiveTabState('account_hub');
      return;
    }
    if (mode === 'b2c' && !isStoreOpsEnabled) {
      handleToggleStoreOpsEnabled(true);
    }
    setWorkspaceMode(mode);
    const nextTab = targetTab || (mode === 'b2c' ? 'store_pos' : 'marketplace');
    if (nextTab !== activeTab || selectedSupplierStore) {
      setTabHistory((prev) => {
        const next = prev[prev.length - 1] === activeTab ? prev : [...prev, activeTab];
        return next.slice(-20);
      });
    }
    setSelectedSupplierStore(null);
    setSupplierReturnTab('marketplace');
    setActiveTabState(nextTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    if (userSession?.role === 'cashier') {
      setSelectedSupplierStore(null);
      setActiveTabState('store_pos');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (userSession?.role === 'accountant') {
      setSelectedSupplierStore(null);
      setActiveTabState('account_hub');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (selectedSupplierStore) {
      const returnTab = supplierReturnTab;
      setSelectedSupplierStore(null);
      setSupplierReturnTab('marketplace');
      syncWorkspaceForTab(returnTab);
      setActiveTabState(returnTab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tabHistory.length > 0) {
      const prevTab = tabHistory[tabHistory.length - 1];
      setTabHistory((prev) => prev.slice(0, -1));
      syncWorkspaceForTab(prevTab);
      setActiveTabState(prevTab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const fallbackTab: AppTab = workspaceMode === 'b2c' ? 'store_pos' : 'marketplace';
    setActiveTabState(fallbackTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Ensure light appearance mode is active
  useEffect(() => {
    try {
      localStorage.removeItem('dalil_theme');
    } catch {
      // ignore
    }
    document.documentElement.classList.remove('dark-theme');
  }, []);

  // Global Wishlist & Saved Suppliers
  const [wishlistBarcodes, setWishlistBarcodes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dalil_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favoriteSupplierIds, setFavoriteSupplierIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dalil_fav_suppliers');
      return saved ? JSON.parse(saved) : ['supp_rafidain'];
    } catch {
      return ['supp_rafidain'];
    }
  });

  // Global Store Delivery District & Saved Branches
  const [currentDistrict, setCurrentDistrict] = useState<StoreDistrict>(() => {
    try {
      const savedObj = localStorage.getItem('dalil_district_obj');
      if (savedObj) {
        const parsed = JSON.parse(savedObj) as StoreDistrict;
        if (parsed?.id && parsed?.nameAr) return parsed;
      }
      const savedId = localStorage.getItem('dalil_district_id');
      return BAGHDAD_DISTRICTS.find((d) => d.id === savedId) || BAGHDAD_DISTRICTS[0];
    } catch {
      return BAGHDAD_DISTRICTS[0];
    }
  });

  const [savedAddresses, setSavedAddresses] = useState<StoreBranchAddress[]>(() => {
    try {
      const saved = localStorage.getItem('dalil_addresses');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'branch_main',
        labelAr: 'الفرع الرئيسي - سوبرماركت المنصور',
        labelEn: 'Main Branch - Al-Mansoor Supermarket',
        districtId: BAGHDAD_DISTRICTS[0].id,
        districtNameAr: BAGHDAD_DISTRICTS[0].nameAr,
        districtNameEn: BAGHDAD_DISTRICTS[0].nameEn,
        streetDetails: 'شارع 14 رمضان، قرب تقاطع الرواد',
        receiverPhone: '+964 770 123 4567',
        isDefault: true
      }
    ];
  });

  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(3);

  const handleToggleWishlist = (barcode: string) => {
    setWishlistBarcodes((prev) => {
      const next = prev.includes(barcode) ? prev.filter((b) => b !== barcode) : [...prev, barcode];
      try {
        localStorage.setItem('dalil_wishlist', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleToggleFavoriteSupplier = (supplierId: string) => {
    setFavoriteSupplierIds((prev) => {
      const next = prev.includes(supplierId) ? prev.filter((id) => id !== supplierId) : [...prev, supplierId];
      try {
        localStorage.setItem('dalil_fav_suppliers', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleSelectDistrict = (dist: StoreDistrict) => {
    setCurrentDistrict(dist);
    try {
      localStorage.setItem('dalil_district_id', dist.id);
      localStorage.setItem('dalil_district_obj', JSON.stringify(dist));
    } catch {
      // ignore
    }
  };

  const handleUpdateAddresses = (branches: StoreBranchAddress[]) => {
    setSavedAddresses(branches);
    try {
      localStorage.setItem('dalil_addresses', JSON.stringify(branches));
    } catch {
      // ignore
    }
  };

  const handleUpdateProfile = (updated: Partial<UserSession>) => {
    setUserSession((prev) => {
      if (!prev) return prev;
      const merged = { ...prev, ...updated };
      try {
        localStorage.setItem('souq_user_session', JSON.stringify(merged));
      } catch {
        // ignore
      }
      return merged;
    });
  };

  const handleDeleteAccount = () => {
    try {
      localStorage.removeItem('souq_user_session');
      localStorage.removeItem('dalil_wishlist');
      localStorage.removeItem('dalil_fav_suppliers');
      localStorage.removeItem('dalil_addresses');
      localStorage.removeItem('dalil_store_license');
    } catch {
      // ignore
    }
    setWishlistBarcodes([]);
    setFavoriteSupplierIds([]);
    setUserSession(null);
  };

  // Data state
  const [products, setProducts] = useState<ProductWithOffers[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<{
    id: string;
    companyName?: string;
    verificationStatus?: string;
    isVerified?: boolean;
    serviceZoneIds?: string[];
    orderRules?: SupplierOrderRules;
  }[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Cart
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Modals
  const [comparingProduct, setComparingProduct] = useState<ProductWithOffers | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [isQRPosterOpen, setIsQRPosterOpen] = useState<boolean>(false);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlertItem[]>([]);

  const openLowStockAlertsPage = () => {
    setActiveTab('low_stock_alerts');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState<boolean>(false);
  const [orderToast, setOrderToast] = useState<string | null>(null);

  // Network listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync activeTab when user session changes
  useEffect(() => {
    if (!userSession) return;
    switch (userSession.role) {
      case 'store':
        setActiveTab('marketplace');
        break;
      case 'cashier':
        setActiveTabState('store_pos');
        break;
      case 'accountant':
        setActiveAccountSection('invoices');
        setActiveTabState('account_hub');
        break;
      case 'supplier':
        setActiveTab('supplier');
        break;
      case 'driver':
        setActiveTab('driver');
        break;
      case 'customer':
        setActiveTab('b2c');
        break;
      case 'admin':
        setActiveTab('api_docs');
        break;
      default:
        setActiveTab('marketplace');
    }
  }, [userSession?.role]);

  // Obtain in-memory store-owner token for managing store staff in Account Hub
  useEffect(() => {
    if (userSession?.role !== 'store') return;
    let active = true;
    const storeId = userSession.entityId || 'store_almansoor';
    fetch('/api/auth/store-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId })
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.success && data.token) {
          setAuthToken(data.token);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [userSession?.role, userSession?.entityId]);

  // Fetch products
  const fetchProducts = async (signal?: AbortSignal) => {
    try {
      const params = new URLSearchParams();
      const isCatalogOverviewTab =
        activeTab === 'all_categories' || activeTab === 'category_branches';
      if (selectedCategory !== 'الكل' && !isCatalogOverviewTab) {
        params.append('category', selectedCategory);
      }
      if (searchQuery.trim() && !isCatalogOverviewTab) {
        params.append('query', searchQuery.trim());
      }
      if (currentDistrict.deliveryZoneId) {
        params.append('deliveryZoneId', currentDistrict.deliveryZoneId);
      }
      
      const res = await fetchWithRetry(`/api/products?${params.toString()}`, { signal, retries: 3 });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('Products sync deferred:', err?.message || err);
      }
    }
  };

  // Fetch orders
  const fetchOrders = async (signal?: AbortSignal) => {
    try {
      const res = await fetchWithRetry('/api/orders', { signal, retries: 3 });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('Orders sync deferred:', err?.message || err);
      }
    }
  };

  // Fetch low stock alerts
  const fetchLowStockAlerts = async (signal?: AbortSignal) => {
    try {
      const storeId = userSession?.entityId || 'store_almansoor';
      const res = await fetchWithRetry(`/api/store/low-stock-alerts/${storeId}`, { signal, retries: 3 });
      if (!res.ok) return;
      const data = await res.json();
      const alertList = data.alerts || data.data;
      if (data.success && Array.isArray(alertList)) {
        setLowStockAlerts(alertList);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('Alerts sync deferred:', err?.message || err);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal);
    return () => controller.abort();
  }, [selectedCategory, searchQuery, activeTab, currentDistrict.deliveryZoneId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchOrders(controller.signal);
    fetchLowStockAlerts(controller.signal);
    fetchWithRetry('/api/suppliers', { signal: controller.signal, retries: 2 })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) {
          setAllSuppliers(json.data);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [userSession?.entityId]);

  // Login handler (Always starts Store accounts in clean B2B Wholesale mode; Cashiers directly in POS; Accountants in Invoices)
  const handleLoginAsRole = (role: Role, profile: UserSession, token?: string) => {
    try {
      localStorage.setItem('souq_user_session', JSON.stringify(profile));
    } catch (e) {
      console.error(e);
    }
    setAuthToken(token || null);
    setComparingProduct(null);
    setIsCartOpen(false);
    setIsAssistantOpen(false);
    setIsQRPosterOpen(false);
    setIsBarcodeModalOpen(false);
    setIsSidebarOpen(false);
    setSelectedSupplierStore(null);
    setTabHistory([]);
    if (role === 'store') {
      setWorkspaceMode('b2b');
    }
    if (role === 'driver') {
      setVanActiveSection('pos_sell');
      setActiveTabState('driver');
    }
    if (role === 'cashier') {
      setActiveTabState('store_pos');
    }
    if (role === 'accountant') {
      setActiveAccountSection('invoices');
      setActiveTabState('account_hub');
    }
    setUserSession(profile);
  };

  // Logout handler to return to welcome portal
  const handleLogout = () => {
    try {
      localStorage.removeItem('souq_user_session');
    } catch (e) {
      console.error(e);
    }
    setAuthToken(null);
    setComparingProduct(null);
    setIsCartOpen(false);
    setIsAssistantOpen(false);
    setIsQRPosterOpen(false);
    setIsBarcodeModalOpen(false);
    setIsSidebarOpen(false);
    setSelectedSupplierStore(null);
    setWorkspaceMode('b2b');
    setTabHistory([]);
    setUserSession(null);
  };

  // Add to cart
  const handleAddToCart = (product: ProductWithOffers, offer: SupplierOfferItem, quantity: number) => {
    if (userSession?.role === 'cashier' || userSession?.role === 'accountant') return;
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.offer.id === offer.id);
      if (existingIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, offer, quantity }];
    });
  };

  const handleUpdateCartQuantity = (offerId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(offerId);
      return;
    }
    setCartItems(prev => prev.map(item => item.offer.id === offerId ? { ...item, quantity } : item));
  };

  const handleRemoveCartItem = (offerId: string) => {
    setCartItems(prev => prev.filter(item => item.offer.id !== offerId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleOrderSuccess = (parentOrder: any) => {
    fetchOrders();
    setOrderToast(`تم بنجاح إنشاء الطلب الرئيسي (${parentOrder.id}) وتقسيمه تلقائياً إلى ${parentOrder.subOrders.length} طلبيات للموردين!`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setOrderToast(null), 6000);
  };

  const categories = [
    'الكل',
    'قهوة ومشروبات ساخنة',
    'أرز وحبوب',
    'زيوت وسمن',
    'ألبان وأجبان',
    'معلبات ومخللات',
    'سكر ومحليات',
    'مشروبات وشاي',
    'مكرونة وشعرية',
    'منظفات وعناية'
  ];

  // If no user is logged in, show the isolated Welcome / Login & Demo Accounts screen!
  if (!userSession) {
    return (
      <WelcomeAuthView 
        onLoginAsRole={handleLoginAsRole} 
        language={language}
        onLanguageChange={setLanguage}
      />
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-[#F5F5F5] flex flex-col text-[#221F1F]">
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}
      
      {/* Main Header with User Profile (hidden on full-screen category views & isolated B2C consumer storefront) */}
      {activeTab !== 'all_categories' && activeTab !== 'category_branches' && activeTab !== 'b2c' && (
        <Header
          userSession={userSession}
          onLogout={handleLogout}
          currency={currency}
          onCurrencyChange={setCurrency}
          language={language}
          onLanguageChange={setLanguage}
          cartCount={cartItems.reduce((s, i) => s + i.quantity, 0)}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenAssistant={() => setIsAssistantOpen(true)}
          onOpenQRPoster={() => setIsQRPosterOpen(true)}
          onOpenLowStockAlerts={openLowStockAlertsPage}
          lowStockCount={lowStockAlerts.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOnline={isOnline}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          onOpenBarcodeScanner={() => setIsBarcodeModalOpen(true)}
          workspaceMode={workspaceMode}
          onSwitchWorkspaceMode={(mode) => handleSwitchWorkspaceMode(mode)}
          isStoreOpsEnabled={isStoreOpsEnabled}
        />
      )}

      {/* Category Bar when in Marketplace view (hidden inside a single supplier store page) */}
      {activeTab === 'marketplace' && !selectedSupplierStore && (
        <CategoryBar
          categories={categories}
          selectedCategory={selectedCategory}
          language={language}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setSelectedSubCategory('الكل');
            setSearchQuery('');
            if (cat === 'الكل') {
              return;
            }
            setBranchesReturnTab('marketplace');
            setActiveTab('category_branches');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          selectedSubCategory={selectedSubCategory}
          onSelectSubCategory={setSelectedSubCategory}
          onOpenAllCategories={() => {
            setActiveTab('all_categories');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Success Notification Toast */}
      {orderToast && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
          <div className="p-4 bg-emerald-700 text-white rounded-xl shadow-lg flex items-center justify-between text-xs sm:text-sm font-semibold animate-bounce">
            <span>🎉 {orderToast}</span>
            <button onClick={() => setOrderToast(null)} className="text-white/80 hover:text-white mr-4">✕</button>
          </div>
        </div>
      )}

      {/* Main Content Area - Isolated by role and active tab */}
      <main
        className={`flex-1 max-w-7xl w-full mx-auto ${
          activeTab === 'all_categories' || activeTab === 'category_branches'
            ? 'px-0 sm:px-6 lg:px-8 py-0 sm:py-5 pb-4 sm:pb-8'
            : `px-4 sm:px-6 lg:px-8 py-4 sm:py-6 ${isCashierUser ? 'pb-8' : 'pb-24'}`
        }`}
      >
        
        {activeTab === 'marketplace' && selectedSupplierStore && (
          <SupplierStorePageView
            supplier={selectedSupplierStore}
            products={products}
            currency={currency}
            language={language}
            storeName={userSession?.entityName}
            onBack={handleGoBack}
            onAddToCart={handleAddToCart}
            onCompareOffers={(product) => setComparingProduct(product)}
            isFavoriteSupplier={favoriteSupplierIds.includes(selectedSupplierStore.id)}
            onToggleFavoriteSupplier={handleToggleFavoriteSupplier}
          />
        )}

        {activeTab === 'marketplace' && !selectedSupplierStore && (
          <StoreMarketplaceView
            products={products}
            currency={currency}
            language={language}
            onCompareOffers={(product) => setComparingProduct(product)}
            onAddToCart={handleAddToCart}
            orders={orders}
            onRefreshOrders={fetchOrders}
            lowStockAlerts={lowStockAlerts}
            onOpenAlertsModal={openLowStockAlertsPage}
            onRefreshAlerts={fetchLowStockAlerts}
            selectedCategory={selectedCategory}
            selectedSubCategory={selectedSubCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setSelectedSubCategory('الكل');
              setSearchQuery('');
              if (cat === 'الكل') {
                return;
              }
              setBranchesReturnTab('marketplace');
              setActiveTab('category_branches');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectSubCategory={setSelectedSubCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onResetGlobalFilters={() => {
              setSelectedCategory('الكل');
              setSelectedSubCategory('الكل');
              setSearchQuery('');
            }}
            onOpenBarcodeScanner={() => setIsBarcodeModalOpen(true)}
            currentDistrict={currentDistrict}
            onSelectDistrict={handleSelectDistrict}
            wishlistBarcodes={wishlistBarcodes}
            onToggleWishlist={handleToggleWishlist}
            onOpenSupplierStore={(supplier) => {
              setSelectedSupplierStore(supplier);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAllBrands={(brandId) => {
              setSelectedBrandId(brandId || null);
              setActiveTab('all_brands');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenExpiryManager={() => {
              setActiveAccountSection('profile');
              setActiveTab('account_hub');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenCollectiveDeals={() => {
              setActiveTab('collective');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            suppliers={allSuppliers}
          />
        )}

        {activeTab === 'all_brands' && (
          <AllBrandsView
            products={products}
            currency={currency}
            language={language}
            initialBrandId={selectedBrandId}
            onBack={handleGoBack}
            onCompareOffers={(product) => setComparingProduct(product)}
            onAddToCart={handleAddToCart}
            wishlistBarcodes={wishlistBarcodes}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {activeTab === 'all_categories' && (
          <AllCategoriesView
            products={products}
            language={language}
            cartCount={cartItems.reduce((sum, i) => sum + i.quantity, 0)}
            onOpenCart={() => setIsCartOpen(true)}
            onSelectCategory={(cat, subCat) => {
              setSelectedCategory(cat);
              setSelectedSubCategory(subCat || 'الكل');
              setBranchesReturnTab('all_categories');
              setActiveTab('category_branches');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBackToMarketplace={() => {
              const nextHistory = [...tabHistory];
              while (
                nextHistory.length > 0 &&
                (nextHistory[nextHistory.length - 1] === 'all_categories' ||
                  nextHistory[nextHistory.length - 1] === 'category_branches')
              ) {
                nextHistory.pop();
              }
              const targetTab: AppTab =
                nextHistory.length > 0 ? (nextHistory.pop() as AppTab) : 'marketplace';
              setTabHistory(nextHistory);
              setSelectedCategory('الكل');
              setSelectedSubCategory('الكل');
              syncWorkspaceForTab(targetTab);
              setActiveTabState(targetTab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'category_branches' && (
          <CategoryBranchesView
            selectedCategory={selectedCategory === 'الكل' ? 'قهوة ومشروبات ساخنة' : selectedCategory}
            selectedSubCategory={selectedSubCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setSelectedSubCategory('الكل');
            }}
            onSelectBranchSubCategory={setSelectedSubCategory}
            products={products}
            currency={currency}
            language={language}
            currentDistrict={currentDistrict}
            cartCount={cartItems.reduce((sum, i) => sum + i.quantity, 0)}
            onOpenCart={() => setIsCartOpen(true)}
            onCompareOffers={(product) => setComparingProduct(product)}
            onAddToCart={handleAddToCart}
            onBack={() => {
              if (branchesReturnTab === 'marketplace') {
                setSelectedCategory('الكل');
                setSelectedSubCategory('الكل');
              }
              setTabHistory((prev) => {
                const next = [...prev];
                while (
                  next.length > 0 &&
                  (next[next.length - 1] === 'category_branches' ||
                    next[next.length - 1] === branchesReturnTab)
                ) {
                  next.pop();
                }
                return next;
              });
              syncWorkspaceForTab(branchesReturnTab);
              setActiveTabState(branchesReturnTab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAllCategories={() => {
              setTabHistory((prev) =>
                prev.filter((t) => t !== 'category_branches' && t !== 'all_categories')
              );
              syncWorkspaceForTab('all_categories');
              setActiveTabState('all_categories');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            suppliers={allSuppliers}
          />
        )}

        {activeTab === 'suppliers' && (
          <SuppliersDirectoryView
            language={language}
            currency={currency}
            storeName={userSession?.entityName}
            onBrowseSupplierProducts={(supplierName) => {
              setSearchQuery(supplierName);
              setActiveTab('marketplace');
            }}
          />
        )}

        {activeTab === 'supplier' &&
          (userSession?.role === 'supplier' || userSession?.role === 'admin') && (
            <SupplierPortalView
              currency={currency}
              orders={orders}
              onRefreshOrders={fetchOrders}
              onRefreshProducts={() => fetchProducts()}
              authToken={authToken}
              language={language}
            />
          )}

        {activeTab === 'driver' && (
          <DriverVanView
            currency={currency}
            isOnline={isOnline}
            orders={orders}
            products={products}
            onRefreshOrders={fetchOrders}
            language={language}
            activeSection={vanActiveSection}
            onChangeSection={setVanActiveSection}
            openShiftCloseSignal={vanOpenShiftSignal}
            onSyncSummary={setVanSummary}
          />
        )}

        {activeTab === 'store_pos' && (
          <StorePOSInventoryView
            currency={currency}
            products={products}
            language={language}
            cashierName={userSession?.name}
            storeName={userSession?.entityName}
            isCashierMode={isCashierUser}
            lowStockAlertsCount={lowStockAlerts.length}
            onOpenLowStockModal={openLowStockAlertsPage}
            onOpenQRPoster={isCashierUser ? undefined : () => setIsQRPosterOpen(true)}
            onOpenStoreManagement={isCashierUser ? undefined : () => setActiveTab('store_management')}
            onOpenStorefrontB2C={isCashierUser ? undefined : () => setActiveTab('b2c')}
            onOpenProductComparison={isCashierUser ? () => {} : (product) => setComparingProduct(product)}
            onQuickReorder={
              isCashierUser
                ? () => {}
                : (barcode) => {
                    const p = products.find(prod => prod.barcode === barcode);
                    if (p && p.offers[0]) {
                      const offer = p.offers[0];
                      const apiSupp = allSuppliers.find(s => s.id === offer.supplierId);
                      const suppRules =
                        apiSupp?.orderRules ||
                        resolveWholesaleSupplierByOffer(
                          offer.supplierId,
                          offer.supplierName,
                          offer.supplierCity
                        ).orderRules;
                      handleAddToCart(
                        p,
                        offer,
                        getInitialOfferQuantity(offer.minOrderQuantity, suppRules)
                      );
                      setIsCartOpen(true);
                    }
                  }
            }
            onRefreshLowStockAlerts={fetchLowStockAlerts}
          />
        )}

        {activeTab === 'collective' && (
          <CollectiveDealsView
            currency={currency}
            products={products}
            cartItems={cartItems}
            language={language}
            onOpenProductComparison={(product) => setComparingProduct(product)}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onOpenSupplierStore={(supplier) => {
              setSupplierReturnTab('collective');
              setActiveTabState('marketplace');
              setSelectedSupplierStore(supplier);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBack={handleGoBack}
          />
        )}

        {activeTab === 'store_management' && (
          <StorefrontManagementView
            currency={currency}
            language={language}
            authToken={authToken}
            onRefreshProducts={() => fetchProducts()}
            onPreviewStorefront={() => setActiveTab('b2c')}
            onOpenStorePOS={() => setActiveTab('store_pos')}
            onOpenQRPoster={() => setIsQRPosterOpen(true)}
          />
        )}

        {activeTab === 'b2c' && (
          <PublicStorefrontView
            currency={currency}
            language={language}
            isOwner={userSession?.role === 'store'}
            onOpenStorePOS={() => setActiveTab('store_pos')}
            onOpenStoreManagement={() => setActiveTab('store_management')}
            onExitPreview={handleGoBack}
            onSwitchAccount={handleLogout}
          />
        )}

        {activeTab === 'api_docs' && (
          <ApiDocsView />
        )}

        {activeTab === 'account_hub' && userSession && !isCashierUser && (
          <RetailerAccountHubView
            activeSection={activeAccountSection}
            onSelectSection={setActiveAccountSection}
            onBackToMarketplace={handleGoBack}
            onBrowseMarketplace={() => setActiveTab('marketplace')}
            userSession={userSession}
            authToken={authToken}
            onUpdateProfile={handleUpdateProfile}
            onDeleteAccount={handleDeleteAccount}
            currency={currency}
            language={language}
            orders={orders}
            products={products}
            onAddToCart={handleAddToCart}
            onCompareOffers={(product) => setComparingProduct(product)}
            onOpenSupplierStore={(supplier) => {
              if (isAccountantUser) return;
              setSupplierReturnTab('account_hub');
              setActiveTabState('marketplace');
              setSelectedSupplierStore(supplier);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onExploreCategory={(cat) => {
              if (isAccountantUser) return;
              setSearchQuery('');
              setSelectedCategory(cat);
              setSelectedSubCategory('الكل');
              setBranchesReturnTab('marketplace');
              setActiveTab('category_branches');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            wishlistBarcodes={wishlistBarcodes}
            onToggleWishlist={handleToggleWishlist}
            favoriteSupplierIds={favoriteSupplierIds}
            onToggleFavoriteSupplier={handleToggleFavoriteSupplier}
            currentDistrict={currentDistrict}
            onSelectDistrict={handleSelectDistrict}
            savedAddresses={savedAddresses}
            onUpdateAddresses={handleUpdateAddresses}
            unreadMessagesCount={unreadMessagesCount}
            onMarkMessagesRead={() => setUnreadMessagesCount(0)}
            onRefreshProducts={() => fetchProducts()}
            onOpenStoreManagement={isAccountantUser ? undefined : () => setActiveTab('store_management')}
            onOpenCollectiveDeals={isAccountantUser ? undefined : () => setActiveTab('collective')}
          />
        )}

        {activeTab === 'low_stock_alerts' && (
          <LowStockNotificationModal
            isOpen={true}
            onClose={handleGoBack}
            currency={currency}
            language={language}
            alerts={lowStockAlerts}
            products={products}
            onAddToCart={handleAddToCart}
            onRefreshAlerts={fetchLowStockAlerts}
            isCashierMode={isCashierUser}
          />
        )}

      </main>

      {/* Footer (hidden on full-screen category views & isolated B2C storefront preview) */}
      {activeTab !== 'all_categories' && activeTab !== 'category_branches' && activeTab !== 'b2c' && (
        <footer className="bg-white border-t border-[#E9E9E9] py-6 text-xs text-[#797878] font-brand">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <strong className="text-sm font-black text-[#221F1F]">
                {language === 'ar' ? 'دليل الخيرات (Dalil Al-Khairat)' : 'Dalil Al-Khairat (دليل الخيرات)'}
              </strong>
              <span>•</span>
              <span>
                {language === 'ar' 
                  ? `الحساب الحالي: ${userSession.name} (${userSession.entityName})` 
                  : `Logged in as: ${userSession.name} (${userSession.entityName})`}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <button
                onClick={handleLogout}
                className="text-[#00A046] font-bold hover:underline cursor-pointer"
              >
                {language === 'ar' ? '← تبديل الحساب / تسجيل خروج' : '← Switch Account / Logout'}
              </button>
              <span>{language === 'ar' ? 'الدينار العراقي (IQD)' : 'Iraqi Dinar (IQD)'}</span>
              <span>{language === 'ar' ? 'PWA أوفلاين' : 'Offline PWA'}</span>
            </div>
          </div>
        </footer>
      )}

      {/* Modals & Drawers */}
      {comparingProduct && !isRestrictedStaff && (
        <OfferComparisonModal
          product={comparingProduct}
          currency={currency}
          language={language}
          onClose={() => setComparingProduct(null)}
          onAddToCart={(prod, offer, qty) => {
            handleAddToCart(prod, offer, qty);
          }}
          allProducts={products}
          onSelectProduct={(prod) => setComparingProduct(prod)}
          isFavorite={wishlistBarcodes.includes(comparingProduct.barcode)}
          onToggleFavorite={handleToggleWishlist}
          activeDistrictName={language === 'ar' ? currentDistrict.nameAr : currentDistrict.nameEn}
          onExploreBrand={(brand) => {
            setSearchQuery(brand);
            setSelectedCategory('الكل');
            setSelectedSubCategory('الكل');
            setComparingProduct(null);
            setActiveTab('marketplace');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onExploreCategory={(cat) => {
            setSearchQuery('');
            setSelectedCategory(cat);
            setSelectedSubCategory('الكل');
            setComparingProduct(null);
            setBranchesReturnTab(activeTab === 'all_categories' ? 'all_categories' : 'marketplace');
            setActiveTab('category_branches');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenSupplierStore={(offer) => {
            const resolved = resolveWholesaleSupplierByOffer(
              offer.supplierId,
              offer.supplierName,
              offer.supplierCity
            );
            setSupplierReturnTab(activeTab);
            setComparingProduct(null);
            setActiveTabState('marketplace');
            setSelectedSupplierStore(resolved);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {isCartOpen && !isRestrictedStaff && (
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          currency={currency}
          language={language}
          currentDistrict={currentDistrict}
          suppliers={allSuppliers}
          storeId={userSession?.entityId || 'store_almansoor'}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onClearCart={handleClearCart}
          onOrderSuccess={handleOrderSuccess}
        />
      )}

      {isAssistantOpen && !isRestrictedStaff && (
        <StoreAssistantModal
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
          currency={currency}
          language={language}
        />
      )}

      {isQRPosterOpen && !isRestrictedStaff && (
        <QRPosterModal
          isOpen={isQRPosterOpen}
          onClose={() => setIsQRPosterOpen(false)}
          language={language}
          storeName={userSession?.entityName}
          onOpenStorefront={() => {
            setIsQRPosterOpen(false);
            setActiveTab('b2c');
          }}
        />
      )}

      {isBarcodeModalOpen && !isRestrictedStaff && (
        <BarcodeSearchModal
          isOpen={isBarcodeModalOpen}
          onClose={() => setIsBarcodeModalOpen(false)}
          products={products}
          currency={currency}
          language={language}
          onSelectProduct={(product) => setComparingProduct(product)}
          onSelectSupplier={(supplier) => {
            setActiveTabState('marketplace');
            setSelectedSupplierStore(supplier);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSelectRetailStore={() => {
            setActiveTab('b2c');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Sticky Retailer Bottom Navigation Bar (hidden on full-screen category views, isolated B2C storefront preview & restricted staff modes) */}
      {userSession?.role === 'store' &&
        activeTab !== 'all_categories' &&
        activeTab !== 'category_branches' &&
        activeTab !== 'b2c' && (
          <RetailerBottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            cartCount={cartItems.reduce((sum, i) => sum + i.quantity, 0)}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenLowStockAlerts={openLowStockAlertsPage}
            lowStockCount={lowStockAlerts.length}
            onScrollToSuppliers={() => {
              const el = document.getElementById('nearest-suppliers-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            language={language}
            workspaceMode={workspaceMode}
          />
        )}

      {/* Role-Specific Sidebar Drawers */}
      {userSession?.role === 'driver' ? (
        <VanSidebarDrawer
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeSection={vanActiveSection}
          onSelectSection={(section) => {
            setVanActiveSection(section);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenShiftClose={() => setVanOpenShiftSignal((c) => c + 1)}
          userSession={userSession}
          onLogout={handleLogout}
          language={language}
          onLanguageChange={setLanguage}
          currency={currency}
          onCurrencyChange={setCurrency}
          cashCustodyIQD={vanSummary.cashCustodyIQD}
          remainingUnits={vanSummary.remainingUnits}
          pendingOrdersCount={vanSummary.pendingOrdersCount}
          pendingRestockCount={vanSummary.pendingRestockCount}
          nearExpiryCount={vanSummary.nearExpiryCount}
          creditClientsCount={vanSummary.creditClientsCount}
          vehiclePlate={vanSummary.vehiclePlate}
          vanWarehouseName={vanSummary.vanWarehouseName}
        />
      ) : !isRestrictedStaff && (
        <RetailerSidebarDrawer
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userSession={userSession}
          onLogout={handleLogout}
          language={language}
          onLanguageChange={setLanguage}
          currency={currency}
          onCurrencyChange={setCurrency}
          onOpenAssistant={() => setIsAssistantOpen(true)}
          onOpenQRPoster={() => setIsQRPosterOpen(true)}
          onOpenLowStockAlerts={openLowStockAlertsPage}
          lowStockCount={lowStockAlerts.length}
          onOpenAccountSection={(section) => {
            setActiveAccountSection(section);
            if (section === 'messages') setUnreadMessagesCount(0);
            setActiveTab('account_hub');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          activeAccountSection={activeAccountSection}
          wishlistCount={wishlistBarcodes.length + favoriteSupplierIds.length}
          activeOrdersCount={orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length}
          unreadMessagesCount={unreadMessagesCount}
          activeDistrictName={language === 'ar' ? currentDistrict.nameAr : currentDistrict.nameEn}
          workspaceMode={workspaceMode}
          onSwitchWorkspaceMode={handleSwitchWorkspaceMode}
          isStoreOpsEnabled={isStoreOpsEnabled}
          onToggleStoreOpsEnabled={handleToggleStoreOpsEnabled}
          onScrollToSuppliers={() => {
            const el = document.getElementById('nearest-suppliers-section');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        />
      )}

    </div>
  );
}
