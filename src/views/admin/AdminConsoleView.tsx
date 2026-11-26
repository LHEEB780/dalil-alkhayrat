import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeDollarSign,
  Bell,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  CreditCard,
  FileCode2,
  FileText,
  Filter,
  Globe,
  HandCoins,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MapPin,
  Menu,
  Megaphone,
  Package,
  RefreshCw,
  Scale,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
  X
} from 'lucide-react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  ADMIN_PERMISSION_GROUPS,
  ADMIN_ROLES,
  AdminPermissionCode
} from '../../../shared/adminPermissions.ts';
import { Currency, Language } from '../../types/index.ts';
import { formatCurrency } from '../../utils/format.ts';
import { getLocalizedText, translations } from '../../utils/translations.ts';
import { ApiDocsView } from '../ApiDocsView.tsx';
import { UserSession } from '../WelcomeAuthView.tsx';
import { AccountsView, AccountSectionMode } from './AccountsView.tsx';

export type AdminSectionId =
  | 'overview'
  | 'suppliers'
  | 'stores'
  | 'drivers'
  | 'store_staff'
  | 'products'
  | 'brands'
  | 'offers'
  | 'orders'
  | 'disputes'
  | 'fleet'
  | 'credit_limits'
  | 'credit_upgrades'
  | 'ledger'
  | 'settlements'
  | 'banners'
  | 'collections'
  | 'collective_pools'
  | 'notifications'
  | 'geography'
  | 'platform_settings'
  | 'roles_permissions'
  | 'audit_log'
  | 'api_docs';

interface AdminNavItem {
  id: AdminSectionId;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  icon: React.ComponentType<{ className?: string }>;
  implemented?: boolean;
}

interface AdminNavGroup {
  groupId: string;
  labelAr: string;
  labelEn: string;
  items: AdminNavItem[];
}

const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    groupId: 'overview',
    labelAr: 'نظرة عامة',
    labelEn: 'Overview',
    items: [
      {
        id: 'overview',
        labelAr: 'لوحة مؤشرات الأداء',
        labelEn: 'Operations Overview',
        descAr: 'المؤشرات الحية لحجم التداول والطلبات والائتمان وعناصر الانتباه',
        descEn: 'Live platform KPIs, sales & order trends, credit exposure, and attention queue',
        icon: LayoutDashboard,
        implemented: true
      }
    ]
  },
  {
    groupId: 'accounts',
    labelAr: 'الحسابات',
    labelEn: 'Accounts',
    items: [
      {
        id: 'suppliers',
        labelAr: 'الموردون',
        labelEn: 'Suppliers',
        descAr: 'مراجعة طلبات التوثيق، تفعيل أو إيقاف الحسابات، وإدارة قواعد الطلب للموردين.',
        descEn: 'Review supplier verification requests, suspend/activate accounts, and manage order rules.',
        icon: Building2,
        implemented: true
      },
      {
        id: 'stores',
        labelAr: 'المتاجر',
        labelEn: 'Retail Stores',
        descAr: 'مراقبة متاجر التجزئة، درجات الموثوقية، التجميد المؤقت، وعناوين التوصيل.',
        descEn: 'Monitor retail stores, reliability scores, account blocks, and registered addresses.',
        icon: Store,
        implemented: true
      },
      {
        id: 'drivers',
        labelAr: 'السائقون',
        labelEn: 'Drivers & Reps',
        descAr: 'متابعة السائقين والمندوبين الميدانيين، الورديات النشطة، وحالة التفرغ.',
        descEn: 'Manage field van drivers, active shifts, and operational availability.',
        icon: Truck,
        implemented: true
      },
      {
        id: 'store_staff',
        labelAr: 'موظفو المتاجر',
        labelEn: 'Store Staff',
        descAr: 'عرض وإدارة حسابات الكاشير والمحاسبين المرتبطين بالمتاجر.',
        descEn: 'Audit cashier and accountant accounts linked to retail stores.',
        icon: Users,
        implemented: true
      }
    ]
  },
  {
    groupId: 'catalog',
    labelAr: 'الكتالوج',
    labelEn: 'Catalog',
    items: [
      {
        id: 'products',
        labelAr: 'المنتجات الموحدة',
        labelEn: 'Unified Products',
        descAr: 'إدارة دليل الباركود الدولي الموحد (EAN/GTIN)، التصنيفات، وبيانات التخزين.',
        descEn: 'Manage canonical EAN/GTIN product catalog, categories, and storage attributes.',
        icon: Package
      },
      {
        id: 'brands',
        labelAr: 'العلامات التجارية',
        labelEn: 'Brands',
        descAr: 'اعتماد العلامات التجارية، الشعارات، وربط الموزعين الرسميين.',
        descEn: 'Manage brand registry, logos, and authorized distributor badges.',
        icon: Award
      },
      {
        id: 'offers',
        labelAr: 'عروض الموردين',
        labelEn: 'Supplier Offers',
        descAr: 'مراقبة الأسعار، الكميات المتوفرة، تصفيات قرب الصلاحية، وإيقاف العروض المخالفة.',
        descEn: 'Monitor pricing, stock levels, near-expiry clearances, and suspend flagged offers.',
        icon: Tag
      }
    ]
  },
  {
    groupId: 'orders',
    labelAr: 'الطلبات واللوجستيات',
    labelEn: 'Orders & Logistics',
    items: [
      {
        id: 'orders',
        labelAr: 'جميع الطلبات',
        labelEn: 'All Orders',
        descAr: 'تتبع الطلبات الفرعية، الكشف عن الطلبات العالقة، وتجاوز الحالات عند الحاجة.',
        descEn: 'Track all wholesale sub-orders, catch stuck orders, and perform audited overrides.',
        icon: ShoppingBag
      },
      {
        id: 'disputes',
        labelAr: 'النزاعات والمرتجعات',
        labelEn: 'Disputes & RMA',
        descAr: 'معالجة النزاعات بين المتاجر والموردين وإشعارات المرتجعات والتالف.',
        descEn: 'Resolve store-supplier disputes, damaged goods claims, and RMA credit notes.',
        icon: Scale
      },
      {
        id: 'fleet',
        labelAr: 'أسطول التوصيل',
        labelEn: 'Fleet Dispatch',
        descAr: 'متابعة خطوط السير، حمولة الفانات، ومؤشرات الالتزام بالزيارات الميدانية.',
        descEn: 'Oversee delivery routes, mobile van inventory, and field visit compliance.',
        icon: Activity
      }
    ]
  },
  {
    groupId: 'finance',
    labelAr: 'المالية',
    labelEn: 'Finance',
    items: [
      {
        id: 'credit_limits',
        labelAr: 'سقوف الائتمان',
        labelEn: 'Credit Limits',
        descAr: 'مراجعة حسابات الائتمان، أعمار الديون، وتجميد أو فك تجميد الحسابات المتعثرة.',
        descEn: 'Monitor store credit exposure, debt aging buckets, and account freezes.',
        icon: CreditCard
      },
      {
        id: 'credit_upgrades',
        labelAr: 'طلبات رفع الحد',
        labelEn: 'Upgrade Requests',
        descAr: 'البت في طلبات زيادة الحدود الائتمانية للمتاجر بناءً على سجل السداد.',
        descEn: 'Approve or defer credit limit increase requests based on repayment history.',
        icon: TrendingUp
      },
      {
        id: 'ledger',
        labelAr: 'دفتر الأستاذ',
        labelEn: 'Financial Ledger',
        descAr: 'تصفح جميع القيود المالية التراكمية وسندات القبض والقيود العكسية.',
        descEn: 'Audit append-only financial ledger entries, payment receipts, and reversals.',
        icon: BookOpen
      },
      {
        id: 'settlements',
        labelAr: 'التسويات المالية',
        labelEn: 'Settlements',
        descAr: 'اعتماد تقارير إغلاق الورديات وتسويات الكاش والعمولات بين الموردين والمناديب.',
        descEn: 'Reconcile shift close reports, cash variances, and driver-supplier settlements.',
        icon: HandCoins
      }
    ]
  },
  {
    groupId: 'content',
    labelAr: 'المحتوى والتسويق',
    labelEn: 'Content & Marketing',
    items: [
      {
        id: 'banners',
        labelAr: 'البنرات الترويجية',
        labelEn: 'Promotional Banners',
        descAr: 'تخصيص البنرات الإعلانية والحملات الموسمية في شاشات سوق الجملة.',
        descEn: 'Configure hero banners and seasonal campaigns in the wholesale marketplace.',
        icon: Sparkles
      },
      {
        id: 'collections',
        labelAr: 'المجموعات المختارة',
        labelEn: 'Curated Collections',
        descAr: 'إنشاء قوائم منتجات مميزة ورفوف عروض موسمية للقطاعات الغذائية.',
        descEn: 'Curate featured product shelves and category spotlights.',
        icon: LayoutGrid
      },
      {
        id: 'collective_pools',
        labelAr: 'الشراء الجماعي',
        labelEn: 'Collective Buying Pools',
        descAr: 'إطلاق وإدارة حملات التجميع الشرائي للمتاجر للحصول على خصومات المصانع.',
        descEn: 'Launch and monitor collective bulk buying campaigns for neighborhood stores.',
        icon: Layers
      },
      {
        id: 'notifications',
        labelAr: 'الإشعارات الجماعية',
        labelEn: 'Broadcast Notifications',
        descAr: 'إرسال تنبيهات وإعلانات مستهدفة للمتاجر أو الموردين أو السائقين.',
        descEn: 'Send targeted operational announcements to stores, suppliers, or drivers.',
        icon: Megaphone
      }
    ]
  },
  {
    groupId: 'geography',
    labelAr: 'الجغرافيا',
    labelEn: 'Geography',
    items: [
      {
        id: 'geography',
        labelAr: 'المحافظات ومناطق التوصيل',
        labelEn: 'Governorates & Zones',
        descAr: 'إدارة التسلسل الجغرافي (المحافظة ← القضاء ← المنطقة) ونطاقات تغطية الموردين.',
        descEn: 'Manage governorates, districts, delivery zones, and supplier coverage maps.',
        icon: MapPin
      }
    ]
  },
  {
    groupId: 'settings',
    labelAr: 'الإعدادات',
    labelEn: 'Settings',
    items: [
      {
        id: 'platform_settings',
        labelAr: 'إعدادات المنصة',
        labelEn: 'Platform Settings',
        descAr: 'تهيئة السياسات العامة، حدود الطلب الدنيا الافتراضية، وأسعار الصرف المرجعية.',
        descEn: 'Configure global marketplace defaults, order rule policies, and FX reference.',
        icon: Settings
      },
      {
        id: 'roles_permissions',
        labelAr: 'الأدوار والصلاحيات',
        labelEn: 'Roles & Permissions',
        descAr: 'استعراض الأدوار الوظيفية ومصفوفة الصلاحيات الحساسة على مستوى المنصة.',
        descEn: 'Inspect administrative role templates and sensitive permission definitions.',
        icon: ShieldCheck,
        implemented: true
      },
      {
        id: 'audit_log',
        labelAr: 'سجل التدقيق',
        labelEn: 'Audit Logs',
        descAr: 'مراجعة سجل العمليات الإدارية الحساسة والتغييرات التاريخية مع التصفية.',
        descEn: 'Inspect immutable admin action logs with filters and before/after diffs.',
        icon: FileText,
        implemented: true
      },
      {
        id: 'api_docs',
        labelAr: 'توثيق واجهات API',
        labelEn: 'API Documentation',
        descAr: 'مواصفات OpenAPI التفاعلية واختبار نقاط النهاية في المنصة.',
        descEn: 'Interactive OpenAPI specification and live endpoint tester.',
        icon: FileCode2,
        implemented: true
      }
    ]
  }
];

interface AdminOverviewData {
  range: '7d' | '30d' | '90d';
  kpis: {
    gmvIQD: number;
    ordersCount: number;
    deliveredCount: number;
    deliveredRatePercent: number;
    avgOrderValueIQD: number;
    activeSuppliersCount: number;
    activeStoresCount: number;
    activeDriversCount: number;
    pendingSuppliersCount: number;
    pendingStoresCount?: number;
    totalUsedCreditIQD: number;
    totalOverdueDebtIQD: number;
    pendingCreditUpgradesCount: number;
    lowStockOffersCount: number;
  };
  dailySeries: Array<{
    date: string;
    ordersCount: number;
    gmvIQD: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
  }>;
  topSuppliers: Array<{
    supplierId: string;
    supplierName: string;
    gmvIQD: number;
    ordersCount: number;
  }>;
  topProducts: Array<{
    barcode: string;
    productName: string;
    revenueIQD: number;
    quantity: number;
  }>;
  needsAttention: Array<{
    id: string;
    type: 'pending_supplier' | 'pending_store' | 'credit_upgrade' | 'stuck_order' | 'disputed_order' | 'blocked_credit';
    severity: 'high' | 'medium';
    titleAr: string;
    titleEn: string;
    subtitleAr: string;
    subtitleEn: string;
    targetSection: AdminSectionId;
    entityId: string;
  }>;
}

interface AdminAuditLogEntry {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  summaryAr: string;
  summaryEn?: string;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  reason?: string;
}

interface AuditLogQueryResult {
  items: AdminAuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  availableActions: string[];
  availableEntityTypes: string[];
}

interface AdminSearchHit {
  id: string;
  labelAr: string;
  labelEn: string;
  metaAr: string;
  metaEn: string;
  targetSection: AdminSectionId;
}

interface AdminSearchResults {
  suppliers: AdminSearchHit[];
  stores: AdminSearchHit[];
  drivers: AdminSearchHit[];
  products: AdminSearchHit[];
  orders: AdminSearchHit[];
}

export interface AdminConsoleViewProps {
  language: Language;
  currency: Currency;
  userSession: UserSession;
  onLanguageChange: (lang: Language) => void;
  onLogout: () => void;
}

const ADMIN_API_HEADERS: HeadersInit = {
  'x-user-role': 'admin'
};

export const AdminConsoleView: React.FC<AdminConsoleViewProps> = ({
  language,
  currency,
  userSession,
  onLanguageChange,
  onLogout
}) => {
  const isAr = language === 'ar';
  const t = translations[language];

  const [activeSection, setActiveSection] = useState<AdminSectionId>('overview');
  const [accountDeepLink, setAccountDeepLink] = useState<{
    statusTab?: 'all' | 'pending' | 'active' | 'suspended' | 'rejected_archived';
    selectedId?: string | null;
  }>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Overview state
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Global search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AdminSearchResults | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Needs attention popover state
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Audit logs state
  const [auditResult, setAuditResult] = useState<AuditLogQueryResult | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditEntityFilter, setAuditEntityFilter] = useState('');
  const [auditActorFilter, setAuditActorFilter] = useState('');
  const [auditFromFilter, setAuditFromFilter] = useState('');
  const [auditToFilter, setAuditToFilter] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);

  const flatNavItems = useMemo(() => ADMIN_NAV_GROUPS.flatMap((g) => g.items), []);
  const currentNavItem = useMemo(
    () => flatNavItems.find((i) => i.id === activeSection) || flatNavItems[0],
    [flatNavItems, activeSection]
  );

  // Fetch overview KPIs and time series
  const fetchOverview = useCallback(async (selectedRange: '7d' | '30d' | '90d') => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const res = await fetch(`/api/admin/overview?range=${selectedRange}`, {
        headers: ADMIN_API_HEADERS
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || t.adminLoadError);
      }
      setOverview(json.data);
    } catch (err: any) {
      setOverviewError(err?.message || t.adminLoadError);
    } finally {
      setOverviewLoading(false);
    }
  }, [t.adminLoadError]);

  useEffect(() => {
    fetchOverview(range);
  }, [range, fetchOverview]);

  // Fetch audit logs when audit_log section is open or filters change
  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const params = new URLSearchParams();
      if (auditActionFilter) params.set('action', auditActionFilter);
      if (auditEntityFilter) params.set('entityType', auditEntityFilter);
      if (auditActorFilter.trim()) params.set('actorId', auditActorFilter.trim());
      if (auditFromFilter) params.set('from', auditFromFilter);
      if (auditToFilter) params.set('to', auditToFilter);
      params.set('page', String(auditPage));
      params.set('pageSize', '8');

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        headers: ADMIN_API_HEADERS
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || t.error);
      }
      setAuditResult(json.data);
    } catch (err: any) {
      setAuditError(err?.message || t.error);
    } finally {
      setAuditLoading(false);
    }
  }, [
    auditActionFilter,
    auditEntityFilter,
    auditActorFilter,
    auditFromFilter,
    auditToFilter,
    auditPage,
    t.error
  ]);

  useEffect(() => {
    if (activeSection === 'audit_log') {
      fetchAuditLogs();
    }
  }, [activeSection, fetchAuditLogs]);

  // Global search debounced query
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(trimmed)}`, {
          headers: ADMIN_API_HEADERS
        });
        const json = await res.json();
        if (!cancelled && res.ok && json?.success) {
          setSearchResults(json.data);
        }
      } catch {
        // Ignore transient search failures
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  // Close popovers on outside click
  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchDropdownOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const handleNavigate = (
    section: AdminSectionId,
    options?: {
      statusTab?: 'all' | 'pending' | 'active' | 'suspended' | 'rejected_archived';
      selectedId?: string | null;
    }
  ) => {
    setActiveSection(section);
    setAccountDeepLink(options || {});
    setMobileMenuOpen(false);
    setSearchDropdownOpen(false);
    setBellOpen(false);
  };

  const totalSearchHits = useMemo(() => {
    if (!searchResults) return 0;
    return (
      searchResults.suppliers.length +
      searchResults.stores.length +
      searchResults.drivers.length +
      searchResults.products.length +
      searchResults.orders.length
    );
  }, [searchResults]);

  const formatOrderStatus = (status: string): { label: string; color: string; barColor: string } => {
    switch (status) {
      case 'pending':
        return {
          label: isAr ? 'قيد الانتظار' : 'Pending',
          color: 'bg-amber-50 text-amber-800 border-amber-200',
          barColor: 'bg-amber-500'
        };
      case 'approved':
        return {
          label: isAr ? 'مقبول' : 'Approved',
          color: 'bg-blue-50 text-blue-800 border-blue-200',
          barColor: 'bg-blue-500'
        };
      case 'assigned_driver':
        return {
          label: isAr ? 'مسند لسائق' : 'Assigned Driver',
          color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          barColor: 'bg-indigo-500'
        };
      case 'out_for_delivery':
        return {
          label: isAr ? 'جاري التوصيل' : 'Out for Delivery',
          color: 'bg-sky-50 text-sky-800 border-sky-200',
          barColor: 'bg-sky-500'
        };
      case 'delivered':
        return {
          label: isAr ? 'تم التسليم' : 'Delivered',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          barColor: 'bg-[#00A046]'
        };
      case 'cancelled':
        return {
          label: isAr ? 'ملغي' : 'Cancelled',
          color: 'bg-red-50 text-red-700 border-red-200',
          barColor: 'bg-red-500'
        };
      case 'disputed':
        return {
          label: isAr ? 'نزاع مفتوح' : 'Disputed',
          color: 'bg-rose-50 text-rose-800 border-rose-200',
          barColor: 'bg-rose-600'
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          barColor: 'bg-gray-500'
        };
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString(isAr ? 'ar-IQ' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#00A046] text-white flex items-center justify-center shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-black text-[#221F1F] leading-tight">
              {t.adminConsoleBadge}
            </div>
            <div className="text-[11px] font-semibold text-[#797878]">
              {isAr ? 'المدير العام (Super Admin)' : 'Super Admin'}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-[#797878] hover:bg-[#F3F4F6]"
          aria-label={t.close}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.groupId}>
            <div className="px-2.5 mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#797878]">
              {isAr ? group.labelAr : group.labelEn}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#00A046] text-white shadow-sm'
                        : 'text-[#374151] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-[#00A046]'
                        }`}
                      />
                      <span className="truncate">{isAr ? item.labelAr : item.labelEn}</span>
                    </span>
                    {!item.implemented ? (
                      <span
                        className={`shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-[#F3F4F6] text-[#797878]'
                        }`}
                      >
                        {t.adminComingSoonBadge}
                      </span>
                    ) : (
                      <>
                        {item.id === 'suppliers' && (overview?.kpis.pendingSuppliersCount || 0) > 0 && (
                          <span
                            className={`shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {overview?.kpis.pendingSuppliersCount}
                          </span>
                        )}
                        {item.id === 'stores' && (overview?.kpis.pendingStoresCount || 0) > 0 && (
                          <span
                            className={`shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {overview?.kpis.pendingStoresCount}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-[#E5E7EB] bg-[#F9FAFB]">
        <div className="text-[11px] font-bold text-[#221F1F] truncate">
          {userSession.name}
        </div>
        <div className="text-[10px] text-[#797878] truncate mb-2">{userSession.entityName}</div>
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold text-[#374151] hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t.switchAccount}</span>
        </button>
      </div>
    </div>
  );

  // Overview Section Renderer
  const renderOverview = () => {
    const kpis = overview?.kpis;
    const totalOrdersForStatus = (overview?.statusDistribution || []).reduce(
      (sum, item) => sum + item.count,
      0
    );

    const chartData = (overview?.dailySeries || []).map((point) => ({
      ...point,
      shortDate: point.date.slice(5)
    }));

    const periodCaption =
      range === '7d' ? t.adminRange7d : range === '30d' ? t.adminRange30d : t.adminRange90d;

    return (
      <div className="space-y-3 sm:space-y-5">
        {/* Overview Header & Range Controls (single compact row) */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-[#E5E7EB] px-3 py-2.5 sm:px-4 sm:py-3.5 flex items-center justify-between gap-2 shadow-xs">
          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-black text-[#221F1F] truncate">
              {isAr ? currentNavItem.labelAr : currentNavItem.labelEn}
            </h1>
            <p className="hidden md:block text-xs text-[#797878] mt-0.5 truncate">
              {t.adminConsoleSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="inline-flex items-center rounded-lg sm:rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-0.5">
              {(['7d', '30d', '90d'] as const).map((r) => {
                const compactLabel =
                  r === '7d'
                    ? isAr
                      ? '7ي'
                      : '7d'
                    : r === '30d'
                    ? isAr
                      ? '30ي'
                      : '30d'
                    : isAr
                    ? '90ي'
                    : '90d';
                const fullLabel =
                  r === '7d' ? t.adminRange7d : r === '30d' ? t.adminRange30d : t.adminRange90d;
                const active = range === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={`px-2 sm:px-2.5 py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#00A046] text-white shadow-xs'
                        : 'text-[#4A4747] hover:text-[#221F1F]'
                    }`}
                  >
                    <span className="sm:hidden">{compactLabel}</span>
                    <span className="hidden sm:inline">{fullLabel}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => fetchOverview(range)}
              disabled={overviewLoading}
              aria-label={t.adminRefresh}
              title={t.adminRefresh}
              className="inline-flex items-center justify-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold text-[#221F1F] hover:bg-[#F9FAFB] transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${overviewLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t.adminRefresh}</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {overviewLoading && !overview && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl sm:rounded-2xl border border-[#E5E7EB] p-3 sm:p-4 h-24 animate-pulse"
              >
                <div className="h-2.5 w-20 bg-gray-200 rounded mb-2.5" />
                <div className="h-5 w-24 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {overviewError && (
          <div className="bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-red-800 text-xs sm:text-sm font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{overviewError}</span>
            </div>
            <button
              type="button"
              onClick={() => fetchOverview(range)}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer self-start sm:self-auto"
            >
              {t.adminRetry}
            </button>
          </div>
        )}

        {kpis && (
          <>
            {/* Primary Financial & Order KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="bg-white rounded-xl sm:rounded-2xl border border-[#E5E7EB] p-3 sm:p-4 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span className="text-[11px] sm:text-xs font-bold text-[#797878] leading-tight line-clamp-1">
                    {t.adminKpiGmv}
                  </span>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-[#00A046] flex items-center justify-center shrink-0">
                    <BadgeDollarSign className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-base sm:text-xl font-black text-[#221F1F] leading-tight truncate">
                  {formatCurrency(kpis.gmvIQD, currency, language)}
                </div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-[#797878] truncate mt-1">
                  {periodCaption}
                </div>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl border border-[#E5E7EB] p-3 sm:p-4 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span className="text-[11px] sm:text-xs font-bold text-[#797878] leading-tight line-clamp-1">
                    {isAr ? 'الطلبات الفرعية (لكل مورد)' : 'Sub-orders'}
                  </span>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-base sm:text-xl font-black text-[#221F1F] leading-tight">
                  {kpis.ordersCount.toLocaleString('en-US')}
                </div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-[#797878] truncate mt-1">
                  {periodCaption}
                </div>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl border border-[#E5E7EB] p-3 sm:p-4 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span className="text-[11px] sm:text-xs font-bold text-[#797878] leading-tight line-clamp-1">
                    {t.adminKpiDelivered}
                  </span>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-[#00A046] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-base sm:text-xl font-black text-[#221F1F] leading-tight">
                  {kpis.deliveredCount.toLocaleString('en-US')}{' '}
                  <span className="text-xs sm:text-sm font-extrabold text-[#00A046]">
                    ({kpis.deliveredRatePercent}%)
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-[#797878] truncate mt-1">
                  {isAr ? `نسبة الإتمام • ${periodCaption}` : `Completion • ${periodCaption}`}
                </div>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl border border-[#E5E7EB] p-3 sm:p-4 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span className="text-[11px] sm:text-xs font-bold text-[#797878] leading-tight line-clamp-1">
                    {t.adminKpiAvgOrder}
                  </span>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-base sm:text-xl font-black text-[#221F1F] leading-tight truncate">
                  {formatCurrency(kpis.avgOrderValueIQD, currency, language)}
                </div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-[#797878] truncate mt-1">
                  {periodCaption}
                </div>
              </div>
            </div>

            {/* Operational & Credit Snapshot Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <span className="text-[11px] font-bold text-[#797878] truncate">
                    {t.adminKpiActiveAccounts}
                  </span>
                  <Users className="w-3.5 h-3.5 text-[#00A046] shrink-0" />
                </div>
                <div className="text-xs font-black text-[#221F1F] truncate">
                  {kpis.activeSuppliersCount}/{kpis.activeStoresCount}/{kpis.activeDriversCount}
                </div>
                <div className="text-[10px] font-semibold text-[#797878] truncate mt-0.5">
                  {`${kpis.activeSuppliersCount} ${t.adminKpiSuppliersShort} • ${kpis.activeStoresCount} ${t.adminKpiStoresShort} • ${kpis.activeDriversCount} ${t.adminKpiDriversShort}`}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleNavigate('suppliers', { statusTab: 'pending' })}
                className="bg-white rounded-xl border border-[#E5E7EB] p-3 text-start hover:border-[#00A046] transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <span className="text-[11px] font-bold text-[#797878] truncate">
                    {t.adminKpiPendingSuppliers}
                  </span>
                  <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                </div>
                <div
                  className={`text-base sm:text-lg font-black leading-tight ${
                    kpis.pendingSuppliersCount > 0 ? 'text-amber-600' : 'text-[#221F1F]'
                  }`}
                >
                  {kpis.pendingSuppliersCount}
                </div>
                <div className="text-[10px] font-semibold text-[#797878] truncate mt-0.5">
                  {isAr ? 'حالة حالية' : 'Live snapshot'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNavigate('credit_limits')}
                className="bg-white rounded-xl border border-[#E5E7EB] p-3 text-start hover:border-[#00A046] transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <span className="text-[11px] font-bold text-[#797878] truncate">
                    {t.adminKpiUsedCredit}
                  </span>
                  <CreditCard className="w-3.5 h-3.5 text-[#00A046] shrink-0" />
                </div>
                <div className="text-sm sm:text-base font-black text-[#221F1F] truncate leading-tight">
                  {formatCurrency(kpis.totalUsedCreditIQD, currency, language)}
                </div>
                <div className="text-[10px] font-semibold text-[#797878] truncate mt-0.5">
                  {isAr ? 'الرصيد القائم' : 'Active exposure'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNavigate('credit_limits')}
                className="bg-white rounded-xl border border-[#E5E7EB] p-3 text-start hover:border-[#00A046] transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <span className="text-[11px] font-bold text-[#797878] truncate">
                    {t.adminKpiOverdueDebt}
                  </span>
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                </div>
                <div
                  className={`text-sm sm:text-base font-black truncate leading-tight ${
                    kpis.totalOverdueDebtIQD > 0 ? 'text-red-600' : 'text-[#221F1F]'
                  }`}
                >
                  {formatCurrency(kpis.totalOverdueDebtIQD, currency, language)}
                </div>
                <div className="text-[10px] font-semibold text-[#797878] truncate mt-0.5">
                  {isAr ? 'تتطلب متابعة' : 'Over 30 days'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNavigate('credit_upgrades')}
                className="bg-white rounded-xl border border-[#E5E7EB] p-3 text-start hover:border-[#00A046] transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <span className="text-[11px] font-bold text-[#797878] truncate">
                    {t.adminKpiCreditUpgrades}
                  </span>
                  <TrendingUp className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                </div>
                <div
                  className={`text-base sm:text-lg font-black leading-tight ${
                    kpis.pendingCreditUpgradesCount > 0 ? 'text-amber-600' : 'text-[#221F1F]'
                  }`}
                >
                  {kpis.pendingCreditUpgradesCount}
                </div>
                <div className="text-[10px] font-semibold text-[#797878] truncate mt-0.5">
                  {isAr ? 'قيد المراجعة' : 'Pending review'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNavigate('offers')}
                className="bg-white rounded-xl border border-[#E5E7EB] p-3 text-start hover:border-[#00A046] transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <span className="text-[11px] font-bold text-[#797878] truncate">
                    {t.adminKpiLowStock}
                  </span>
                  <Package className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                </div>
                <div
                  className={`text-base sm:text-lg font-black leading-tight ${
                    kpis.lowStockOffersCount > 0 ? 'text-amber-600' : 'text-[#221F1F]'
                  }`}
                >
                  {kpis.lowStockOffersCount}
                </div>
                <div className="text-[10px] font-semibold text-[#797878] truncate mt-0.5">
                  {isAr ? 'عروض ≤ 20' : 'Stock ≤ 20'}
                </div>
              </button>
            </div>

            {/* Chart + Order Status Distribution */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div className="xl:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h2 className="text-sm sm:text-base font-extrabold text-[#221F1F]">
                      {t.adminChartTitle}
                    </h2>
                    <p className="text-xs text-[#797878]">{t.adminChartSubtitle}</p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-bold">
                    <span className="inline-flex items-center gap-1.5 text-[#00A046]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00A046]" />
                      {t.adminChartRevenueLabel}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-blue-600">
                      <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                      {t.adminChartOrdersLabel}
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="adminGmvFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00A046" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#00A046" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis
                        dataKey="shortDate"
                        tick={{ fontSize: 10, fill: '#6B7280' }}
                        tickLine={false}
                        axisLine={{ stroke: '#E5E7EB' }}
                        minTickGap={16}
                      />
                      <YAxis
                        yAxisId="gmv"
                        tick={{ fontSize: 10, fill: '#6B7280' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val: number) =>
                          val >= 1000000
                            ? `${(val / 1000000).toFixed(1)}M`
                            : val >= 1000
                            ? `${Math.round(val / 1000)}K`
                            : String(val)
                        }
                      />
                      <YAxis
                        yAxisId="orders"
                        orientation="right"
                        allowDecimals={false}
                        tick={{ fontSize: 10, fill: '#3B82F6' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          borderColor: '#E5E7EB',
                          fontSize: '12px'
                        }}
                        formatter={(value: any, name?: string | number) => {
                          if (name === 'gmvIQD') {
                            return [formatCurrency(Number(value) || 0, currency, language), t.adminChartRevenueLabel];
                          }
                          return [Number(value) || 0, t.adminChartOrdersLabel];
                        }}
                        labelFormatter={(label) => `${isAr ? 'التاريخ:' : 'Date:'} ${label}`}
                      />
                      <Bar
                        yAxisId="orders"
                        dataKey="ordersCount"
                        fill="#3B82F6"
                        fillOpacity={0.35}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={18}
                      />
                      <Area
                        yAxisId="gmv"
                        type="monotone"
                        dataKey="gmvIQD"
                        stroke="#00A046"
                        strokeWidth={2.5}
                        fill="url(#adminGmvFill)"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 shadow-xs flex flex-col">
                <h2 className="text-sm sm:text-base font-extrabold text-[#221F1F] mb-3">
                  {t.adminStatusDistTitle}
                </h2>
                <div className="space-y-3 flex-1">
                  {(overview?.statusDistribution || []).map((item) => {
                    const meta = formatOrderStatus(item.status);
                    const pct =
                      totalOrdersForStatus > 0
                        ? Math.round((item.count / totalOrdersForStatus) * 100)
                        : 0;
                    return (
                      <div key={item.status} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className={`px-2 py-0.5 rounded-lg border ${meta.color}`}>
                            {meta.label}
                          </span>
                          <span className="text-[#221F1F]">
                            {item.count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-[#F3F4F6] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${meta.barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {totalOrdersForStatus === 0 && (
                    <div className="text-xs text-[#797878] py-8 text-center">
                      {t.adminNoDataInRange}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Needs Attention Queue */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h2 className="text-sm sm:text-base font-extrabold text-[#221F1F]">
                    {t.adminNeedsAttentionTitle}
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs font-extrabold text-amber-800">
                  {overview?.needsAttention.length || 0}
                </span>
              </div>

              {(!overview?.needsAttention || overview.needsAttention.length === 0) ? (
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs sm:text-sm font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{t.adminNeedsAttentionEmpty}</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {overview.needsAttention.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        handleNavigate(
                          item.targetSection,
                          item.type === 'pending_supplier' || item.type === 'pending_store'
                            ? { statusTab: 'pending', selectedId: item.entityId }
                            : undefined
                        )
                      }
                      className={`p-3.5 rounded-xl border text-start transition-all hover:shadow-sm cursor-pointer flex items-start justify-between gap-3 ${
                        item.severity === 'high'
                          ? 'bg-red-50/50 border-red-200 hover:border-red-300'
                          : 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                              item.severity === 'high'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.severity === 'high'
                              ? isAr
                                ? 'عاجل'
                                : 'High'
                              : isAr
                              ? 'متابعة'
                              : 'Medium'}
                          </span>
                          <span className="text-xs sm:text-sm font-extrabold text-[#221F1F] truncate">
                            {isAr ? item.titleAr : item.titleEn}
                          </span>
                        </div>
                        <p className="text-xs text-[#4A4747] truncate">
                          {isAr ? item.subtitleAr : item.subtitleEn}
                        </p>
                      </div>
                      <span className="shrink-0 text-[#00A046] mt-1">
                        {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Top 5 Suppliers & Top 5 Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Top Suppliers */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 shadow-xs">
                <h2 className="text-sm sm:text-base font-extrabold text-[#221F1F] mb-3">
                  {t.adminTopSuppliersTitle}
                </h2>
                {(!overview?.topSuppliers || overview.topSuppliers.length === 0) ? (
                  <p className="text-xs text-[#797878] py-6 text-center">{t.adminNoDataInRange}</p>
                ) : (
                  <>
                    {/* Mobile Cards */}
                    <div className="space-y-2.5 md:hidden">
                      {overview.topSuppliers.map((s, idx) => (
                        <div
                          key={s.supplierId}
                          className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-[#221F1F] truncate">
                              #{idx + 1} {getLocalizedText(s.supplierName, language)}
                            </div>
                            <div className="text-[11px] text-[#797878]">
                              {s.ordersCount} {isAr ? 'طلب' : 'orders'}
                            </div>
                          </div>
                          <div className="text-xs font-black text-[#00A046] shrink-0">
                            {formatCurrency(s.gmvIQD, currency, language)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[#E5E7EB] text-[#797878]">
                            <th className="py-2 text-start font-bold">#</th>
                            <th className="py-2 text-start font-bold">{isAr ? 'المورد' : 'Supplier'}</th>
                            <th className="py-2 text-center font-bold">{isAr ? 'الطلبات' : 'Orders'}</th>
                            <th className="py-2 text-end font-bold">{isAr ? 'المبيعات' : 'GMV'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6]">
                          {overview.topSuppliers.map((s, idx) => (
                            <tr key={s.supplierId} className="hover:bg-[#F9FAFB]">
                              <td className="py-2.5 font-extrabold text-[#797878]">{idx + 1}</td>
                              <td className="py-2.5 font-bold text-[#221F1F]">
                                {getLocalizedText(s.supplierName, language)}
                              </td>
                              <td className="py-2.5 text-center font-bold text-[#4A4747]">
                                {s.ordersCount}
                              </td>
                              <td className="py-2.5 text-end font-black text-[#00A046]">
                                {formatCurrency(s.gmvIQD, currency, language)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* Top Products */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 shadow-xs">
                <h2 className="text-sm sm:text-base font-extrabold text-[#221F1F] mb-3">
                  {t.adminTopProductsTitle}
                </h2>
                {(!overview?.topProducts || overview.topProducts.length === 0) ? (
                  <p className="text-xs text-[#797878] py-6 text-center">{t.adminNoDataInRange}</p>
                ) : (
                  <>
                    {/* Mobile Cards */}
                    <div className="space-y-2.5 md:hidden">
                      {overview.topProducts.map((p, idx) => (
                        <div
                          key={p.barcode}
                          className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-[#221F1F] truncate">
                              #{idx + 1} {getLocalizedText(p.productName, language)}
                            </div>
                            <div className="text-[11px] text-[#797878]">
                              {p.quantity} {isAr ? 'وحدة' : 'units'} • {p.barcode}
                            </div>
                          </div>
                          <div className="text-xs font-black text-[#00A046] shrink-0">
                            {formatCurrency(p.revenueIQD, currency, language)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[#E5E7EB] text-[#797878]">
                            <th className="py-2 text-start font-bold">#</th>
                            <th className="py-2 text-start font-bold">{isAr ? 'المنتج' : 'Product'}</th>
                            <th className="py-2 text-center font-bold">{t.quantity}</th>
                            <th className="py-2 text-end font-bold">{isAr ? 'الإيراد' : 'Revenue'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6]">
                          {overview.topProducts.map((p, idx) => (
                            <tr key={p.barcode} className="hover:bg-[#F9FAFB]">
                              <td className="py-2.5 font-extrabold text-[#797878]">{idx + 1}</td>
                              <td className="py-2.5 font-bold text-[#221F1F]">
                                <div>{getLocalizedText(p.productName, language)}</div>
                                <div className="text-[10px] text-[#797878]">{p.barcode}</div>
                              </td>
                              <td className="py-2.5 text-center font-bold text-[#4A4747]">
                                {p.quantity}
                              </td>
                              <td className="py-2.5 text-end font-black text-[#00A046]">
                                {formatCurrency(p.revenueIQD, currency, language)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Audit Log Section Renderer
  const renderAuditLog = () => {
    const logs = auditResult?.items || [];

    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-lg sm:text-xl font-black text-[#221F1F]">{t.adminAuditTitle}</h1>
              <p className="text-xs sm:text-sm text-[#797878] mt-0.5">{t.adminAuditSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={fetchAuditLogs}
              disabled={auditLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold text-[#221F1F] hover:bg-[#F9FAFB] cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? 'animate-spin' : ''}`} />
              <span>{t.adminRefresh}</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-3 border-t border-[#F3F4F6]">
            <div>
              <label className="block text-[11px] font-bold text-[#797878] mb-1">
                {t.adminAuditFilterAction}
              </label>
              <select
                value={auditActionFilter}
                onChange={(e) => {
                  setAuditActionFilter(e.target.value);
                  setAuditPage(1);
                }}
                className="w-full rounded-xl border border-[#D1D5DB] bg-white px-2.5 py-2 text-xs font-semibold text-[#221F1F]"
              >
                <option value="">{t.all}</option>
                {(auditResult?.availableActions || []).map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#797878] mb-1">
                {t.adminAuditFilterEntity}
              </label>
              <select
                value={auditEntityFilter}
                onChange={(e) => {
                  setAuditEntityFilter(e.target.value);
                  setAuditPage(1);
                }}
                className="w-full rounded-xl border border-[#D1D5DB] bg-white px-2.5 py-2 text-xs font-semibold text-[#221F1F]"
              >
                <option value="">{t.all}</option>
                {(auditResult?.availableEntityTypes || []).map((et) => (
                  <option key={et} value={et}>
                    {et}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#797878] mb-1">
                {t.adminAuditFilterActor}
              </label>
              <input
                type="text"
                value={auditActorFilter}
                onChange={(e) => {
                  setAuditActorFilter(e.target.value);
                  setAuditPage(1);
                }}
                placeholder="admin_root"
                className="w-full rounded-xl border border-[#D1D5DB] px-2.5 py-2 text-xs text-[#221F1F]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#797878] mb-1">
                {t.adminAuditFilterFrom}
              </label>
              <input
                type="date"
                value={auditFromFilter}
                onChange={(e) => {
                  setAuditFromFilter(e.target.value);
                  setAuditPage(1);
                }}
                className="w-full rounded-xl border border-[#D1D5DB] px-2.5 py-2 text-xs text-[#221F1F]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#797878] mb-1">
                {t.adminAuditFilterTo}
              </label>
              <input
                type="date"
                value={auditToFilter}
                onChange={(e) => {
                  setAuditToFilter(e.target.value);
                  setAuditPage(1);
                }}
                className="w-full rounded-xl border border-[#D1D5DB] px-2.5 py-2 text-xs text-[#221F1F]"
              />
            </div>
          </div>

          {(auditActionFilter ||
            auditEntityFilter ||
            auditActorFilter ||
            auditFromFilter ||
            auditToFilter) && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setAuditActionFilter('');
                  setAuditEntityFilter('');
                  setAuditActorFilter('');
                  setAuditFromFilter('');
                  setAuditToFilter('');
                  setAuditPage(1);
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#00A046] hover:underline cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{t.adminAuditResetFilters}</span>
              </button>
            </div>
          )}
        </div>

        {auditError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs sm:text-sm font-bold text-red-700">
            {auditError}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 shadow-xs">
          {auditLoading && logs.length === 0 ? (
            <div className="py-10 text-center text-xs font-bold text-[#797878]">{t.loading}</div>
          ) : logs.length === 0 ? (
            <div className="py-10 text-center text-xs font-bold text-[#797878]">
              {t.adminAuditEmpty}
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="space-y-3 md:hidden">
                {logs.map((entry) => {
                  const isExpanded = expandedAuditId === entry.id;
                  return (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-[#E5E7EB] p-3.5 bg-[#F9FAFB] space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-extrabold text-[#00A046]">
                          {entry.action}
                        </span>
                        <span className="text-[10px] text-[#797878]">
                          {formatTimestamp(entry.at)}
                        </span>
                      </div>

                      <div className="text-xs font-extrabold text-[#221F1F]">
                        {isAr ? entry.summaryAr : entry.summaryEn || entry.summaryAr}
                      </div>

                      <div className="text-[11px] text-[#4A4747] flex flex-wrap gap-x-2 gap-y-1">
                        <span>
                          <strong>{entry.entityType}:</strong> {entry.entityId}
                        </span>
                        <span>•</span>
                        <span>{entry.actorName}</span>
                      </div>

                      {entry.reason && (
                        <div className="text-[11px] text-[#374151] bg-white rounded-lg p-2 border border-[#E5E7EB]">
                          <span className="font-bold">{t.adminAuditReasonLabel} </span>
                          {entry.reason}
                        </div>
                      )}

                      {(entry.before || entry.after) && (
                        <div>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedAuditId(isExpanded ? null : entry.id)
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00A046] cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                            <span>{t.adminAuditBeforeAfter}</span>
                          </button>
                          {isExpanded && (
                            <pre
                              dir="ltr"
                              className="mt-2 p-2.5 rounded-lg bg-[#111827] text-emerald-300 text-[10px] overflow-x-auto"
                            >
                              {JSON.stringify(
                                { before: entry.before || null, after: entry.after || null },
                                null,
                                2
                              )}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-[#797878]">
                      <th className="py-2.5 text-start font-bold">{t.date}</th>
                      <th className="py-2.5 text-start font-bold">{t.adminAuditFilterAction}</th>
                      <th className="py-2.5 text-start font-bold">{isAr ? 'المنفّذ' : 'Actor'}</th>
                      <th className="py-2.5 text-start font-bold">{isAr ? 'الكيان' : 'Entity'}</th>
                      <th className="py-2.5 text-start font-bold">{isAr ? 'الملخص والسبب' : 'Summary & Reason'}</th>
                      <th className="py-2.5 text-end font-bold">{t.details}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {logs.map((entry) => {
                      const isExpanded = expandedAuditId === entry.id;
                      return (
                        <React.Fragment key={entry.id}>
                          <tr className="hover:bg-[#F9FAFB] align-top">
                            <td className="py-3 whitespace-nowrap text-[#4A4747]">
                              {formatTimestamp(entry.at)}
                            </td>
                            <td className="py-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-extrabold text-[#00A046]">
                                {entry.action}
                              </span>
                            </td>
                            <td className="py-3">
                              <div className="font-bold text-[#221F1F]">{entry.actorName}</div>
                              <div className="text-[10px] text-[#797878]">{entry.actorId}</div>
                            </td>
                            <td className="py-3 whitespace-nowrap">
                              <div className="font-bold text-[#221F1F]">{entry.entityType}</div>
                              <div className="text-[10px] text-[#797878]">{entry.entityId}</div>
                            </td>
                            <td className="py-3 max-w-md">
                              <div className="font-bold text-[#221F1F]">
                                {isAr ? entry.summaryAr : entry.summaryEn || entry.summaryAr}
                              </div>
                              {entry.reason && (
                                <div className="text-[11px] text-[#4A4747] mt-1">
                                  <span className="font-bold">{t.adminAuditReasonLabel} </span>
                                  {entry.reason}
                                </div>
                              )}
                            </td>
                            <td className="py-3 text-end whitespace-nowrap">
                              {(entry.before || entry.after) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedAuditId(isExpanded ? null : entry.id)
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E5E7EB] bg-white text-[11px] font-bold text-[#00A046] hover:bg-emerald-50 cursor-pointer"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                  <span>{isAr ? 'قبل/بعد' : 'Diff'}</span>
                                </button>
                              )}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={6} className="pb-3 px-2 bg-[#F9FAFB]">
                                <pre
                                  dir="ltr"
                                  className="p-3 rounded-xl bg-[#111827] text-emerald-300 text-[11px] overflow-x-auto"
                                >
                                  {JSON.stringify(
                                    { before: entry.before || null, after: entry.after || null },
                                    null,
                                    2
                                  )}
                                </pre>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {auditResult && auditResult.totalPages > 1 && (
                <div className="mt-4 pt-3 border-t border-[#F3F4F6] flex items-center justify-between text-xs">
                  <span className="text-[#797878] font-semibold">
                    {isAr
                      ? `صفحة ${auditResult.page} من ${auditResult.totalPages} (${auditResult.total} سجل)`
                      : `Page ${auditResult.page} of ${auditResult.totalPages} (${auditResult.total} entries)`}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={auditPage <= 1}
                      onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white disabled:opacity-40 cursor-pointer"
                    >
                      {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      disabled={auditPage >= auditResult.totalPages}
                      onClick={() => setAuditPage((p) => Math.min(auditResult.totalPages, p + 1))}
                      className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white disabled:opacity-40 cursor-pointer"
                    >
                      {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // Roles & Permissions Section Renderer (Read-Only in Phase 1)
  const renderRolesAndPermissions = () => (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black text-[#221F1F]">{t.adminRolesTitle}</h1>
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-extrabold text-amber-800">
              {t.adminEditingComingSoon}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#797878] mt-1">{t.adminRolesSubtitle}</p>
        </div>
      </div>

      {/* Sole Super Admin Notice */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#00A046] text-white flex items-center justify-center shrink-0">
          <UserCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-[#221F1F]">{t.adminSoleSuperAdminTitle}</h3>
          <p className="text-xs text-[#4A4747] mt-0.5 leading-relaxed">
            {t.adminSoleSuperAdminDesc}
          </p>
        </div>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ADMIN_ROLES.map((role) => (
          <div
            key={role.id}
            className={`rounded-2xl border p-4 sm:p-5 bg-white shadow-xs flex flex-col justify-between ${
              role.isActive ? 'border-[#00A046] ring-1 ring-[#00A046]/20' : 'border-[#E5E7EB]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-sm sm:text-base font-black text-[#221F1F]">
                  {isAr ? role.nameAr : role.nameEn}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${
                    role.isActive
                      ? 'bg-emerald-50 text-[#00A046] border-emerald-200'
                      : 'bg-gray-100 text-[#797878] border-[#E5E7EB]'
                  }`}
                >
                  {role.isActive ? t.adminRoleActiveLabel : t.adminRoleTemplateLabel}
                </span>
              </div>
              <p className="text-xs text-[#4A4747] leading-relaxed mb-3">
                {isAr ? role.descriptionAr : role.descriptionEn}
              </p>
            </div>

            <div className="pt-3 border-t border-[#F3F4F6] flex items-center justify-between text-xs">
              <span className="font-extrabold text-[#221F1F]">
                {t.adminPermissionsCount(role.permissions.length)}
              </span>
              <span className="text-[11px] font-bold text-[#797878]">
                {t.adminEditingComingSoon}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Read-only Permissions Matrix */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-extrabold text-[#221F1F]">
            {isAr ? 'مصفوفة الصلاحيات المرجعية' : 'Reference Permissions Matrix'}
          </h2>
          <span className="text-[11px] font-bold text-[#797878]">{t.adminEditingComingSoon}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ADMIN_PERMISSION_GROUPS.map((grp) => (
            <div
              key={grp.groupId}
              className="rounded-xl border border-[#E5E7EB] p-3.5 bg-[#F9FAFB] space-y-2.5"
            >
              <div className="text-xs font-black text-[#221F1F]">
                {isAr ? grp.labelAr : grp.labelEn}
              </div>
              <div className="space-y-2">
                {grp.permissions.map((perm) => {
                  const grantedRoles = ADMIN_ROLES.filter((r) =>
                    r.permissions.includes(perm.code as AdminPermissionCode)
                  );
                  return (
                    <div
                      key={perm.code}
                      className="bg-white rounded-lg border border-[#E5E7EB] p-2.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#221F1F]">
                          {isAr ? perm.labelAr : perm.labelEn}
                        </span>
                        {perm.sensitive && (
                          <span className="px-1.5 py-0.5 rounded bg-red-50 border border-red-200 text-[10px] font-extrabold text-red-700 shrink-0">
                            {t.adminSensitiveBadge}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        {grantedRoles.map((r) => (
                          <span
                            key={r.id}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              r.isActive
                                ? 'bg-emerald-50 text-[#00A046]'
                                : 'bg-gray-100 text-[#4A4747]'
                            }`}
                          >
                            {isAr ? r.nameAr : r.nameEn}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Coming Soon Placeholder Section Renderer
  const renderComingSoonSection = () => {
    const Icon = currentNavItem.icon;
    const relatedAlerts = (overview?.needsAttention || []).filter(
      (a) => a.targetSection === currentNavItem.id
    );

    return (
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-10 shadow-xs text-center max-w-3xl mx-auto my-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#00A046] flex items-center justify-center mx-auto mb-4">
          <Icon className="w-7 h-7" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-extrabold text-amber-800 mb-3">
          <Clock className="w-3.5 h-3.5" />
          <span>{t.adminComingSoonBadge}</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-[#221F1F] mb-2">
          {isAr ? currentNavItem.labelAr : currentNavItem.labelEn}
        </h1>
        <p className="text-sm text-[#4A4747] leading-relaxed max-w-xl mx-auto mb-4">
          {isAr ? currentNavItem.descAr : currentNavItem.descEn}
        </p>
        <p className="text-xs text-[#797878] bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3 max-w-xl mx-auto mb-6">
          {t.adminComingSoonNote}
        </p>

        {relatedAlerts.length > 0 && (
          <div className="text-start max-w-xl mx-auto mb-6 space-y-2">
            <div className="text-xs font-extrabold text-[#221F1F]">
              {t.adminNeedsAttentionTitle} ({relatedAlerts.length})
            </div>
            {relatedAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 text-xs"
              >
                <div className="font-extrabold text-[#221F1F]">
                  {isAr ? alert.titleAr : alert.titleEn}
                </div>
                <div className="text-[#4A4747] mt-0.5">
                  {isAr ? alert.subtitleAr : alert.subtitleEn}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => handleNavigate('overview')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00A046] hover:bg-[#008A3C] text-white text-xs sm:text-sm font-extrabold transition-colors cursor-pointer"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>{t.adminBackToOverview}</span>
        </button>
      </div>
    );
  };

  const attentionCount = overview?.needsAttention.length || 0;

  return (
    <div
      className="min-h-screen w-full bg-[#F7F8FA] flex flex-col lg:flex-row font-brand"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-68 shrink-0 bg-white border-e border-[#E5E7EB]">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-white h-full shadow-2xl">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main Operations Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Console Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB] px-2.5 sm:px-5 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-[#221F1F] hover:bg-[#F3F4F6] cursor-pointer"
              aria-label="Open admin navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-black text-[#221F1F] truncate">
                {t.adminConsoleTitle}
              </div>
              <div className="text-[11px] text-[#797878] truncate">
                {isAr ? currentNavItem.labelAr : currentNavItem.labelEn}
              </div>
            </div>
          </div>

          {/* Search + Bell + Quick Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1 sm:max-w-md justify-end">
            {/* Global Search */}
            <div ref={searchBoxRef} className="relative flex-1 min-w-[180px]">
              <Search
                className={`w-4 h-4 text-[#797878] absolute top-1/2 -translate-y-1/2 ${
                  isAr ? 'right-3' : 'left-3'
                }`}
              />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchDropdownOpen(true);
                }}
                placeholder={t.adminSearchPlaceholder}
                className={`w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] focus:bg-white py-2 text-xs text-[#221F1F] focus:outline-none focus:ring-2 focus:ring-[#00A046]/25 focus:border-[#00A046] ${
                  isAr ? 'pr-9 pl-7' : 'pl-9 pr-7'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults(null);
                  }}
                  className={`absolute top-1/2 -translate-y-1/2 text-[#797878] hover:text-[#221F1F] cursor-pointer ${
                    isAr ? 'left-2.5' : 'right-2.5'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {searchDropdownOpen && searchQuery.trim().length > 0 && (
                <div className="absolute z-40 top-full mt-1.5 inset-x-0 bg-white rounded-xl border border-[#E5E7EB] shadow-xl max-h-80 overflow-y-auto p-2">
                  {searchLoading ? (
                    <div className="p-3 text-xs text-center text-[#797878]">
                      {t.adminSearching}
                    </div>
                  ) : totalSearchHits === 0 ? (
                    <div className="p-3 text-xs text-center text-[#797878]">
                      {t.adminSearchNoResults}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {(
                        [
                          { key: 'suppliers', titleAr: 'الموردون', titleEn: 'Suppliers' },
                          { key: 'stores', titleAr: 'المتاجر', titleEn: 'Stores' },
                          { key: 'drivers', titleAr: 'السائقون', titleEn: 'Drivers' },
                          { key: 'products', titleAr: 'المنتجات', titleEn: 'Products' },
                          { key: 'orders', titleAr: 'الطلبات', titleEn: 'Orders' }
                        ] as const
                      ).map((group) => {
                        const hits = searchResults?.[group.key] || [];
                        if (hits.length === 0) return null;
                        return (
                          <div key={group.key}>
                            <div className="px-2 py-1 text-[10px] font-extrabold text-[#797878]">
                              {isAr ? group.titleAr : group.titleEn}
                            </div>
                            <div className="space-y-1">
                              {hits.map((hit) => (
                                <button
                                  key={`${group.key}_${hit.id}`}
                                  type="button"
                                  onClick={() =>
                                    handleNavigate(
                                      hit.targetSection,
                                      hit.targetSection === 'suppliers' ||
                                        hit.targetSection === 'stores' ||
                                        hit.targetSection === 'drivers'
                                        ? { selectedId: hit.id }
                                        : undefined
                                    )
                                  }
                                  className="w-full text-start px-2.5 py-1.5 rounded-lg hover:bg-emerald-50/70 transition-colors cursor-pointer"
                                >
                                  <div className="text-xs font-bold text-[#221F1F] truncate">
                                    {isAr ? hit.labelAr : hit.labelEn}
                                  </div>
                                  <div className="text-[10px] text-[#797878] truncate">
                                    {isAr ? hit.metaAr : hit.metaEn}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Needs Attention Bell */}
            <div ref={bellRef} className="relative">
              <button
                type="button"
                onClick={() => setBellOpen((o) => !o)}
                className="relative p-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-white text-[#221F1F] cursor-pointer"
                aria-label={t.adminNeedsAttentionTitle}
              >
                <Bell className="w-4 h-4" />
                {attentionCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center">
                    {attentionCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div
                  className={`absolute z-40 top-full mt-1.5 w-72 sm:w-80 bg-white rounded-xl border border-[#E5E7EB] shadow-xl p-3 space-y-2 ${
                    isAr ? 'left-0' : 'right-0'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#F3F4F6]">
                    <span className="text-xs font-extrabold text-[#221F1F]">
                      {t.adminNeedsAttentionTitle}
                    </span>
                    <span className="text-[11px] font-bold text-[#00A046]">
                      {attentionCount}
                    </span>
                  </div>
                  {attentionCount === 0 ? (
                    <p className="text-xs text-[#797878] py-2">{t.adminNeedsAttentionEmpty}</p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-1.5">
                      {overview?.needsAttention.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleNavigate(item.targetSection)}
                          className="w-full text-start p-2 rounded-lg hover:bg-[#F9FAFB] border border-[#E5E7EB] cursor-pointer"
                        >
                          <div className="text-xs font-bold text-[#221F1F]">
                            {isAr ? item.titleAr : item.titleEn}
                          </div>
                          <div className="text-[10px] text-[#797878] truncate">
                            {isAr ? item.subtitleAr : item.subtitleEn}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Language Switch */}
            <button
              type="button"
              onClick={() => onLanguageChange(isAr ? 'en' : 'ar')}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-white text-xs font-bold text-[#221F1F] cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#00A046]" />
              <span>{isAr ? 'EN' : 'AR'}</span>
            </button>

            {/* Quick Wallet / Switch Role */}
            <button
              type="button"
              onClick={onLogout}
              title={t.switchAccount}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-xs font-bold text-[#374151] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.switchAccount}</span>
            </button>
          </div>
        </header>

        {/* Active Section Body */}
        <div className="px-2.5 py-3 sm:p-5 flex-1">
          {activeSection === 'overview' && renderOverview()}
          {(activeSection === 'suppliers' ||
            activeSection === 'stores' ||
            activeSection === 'drivers' ||
            activeSection === 'store_staff') && (
            <AccountsView
              mode={activeSection as AccountSectionMode}
              language={language}
              currency={currency}
              initialStatusTab={accountDeepLink.statusTab}
              initialSelectedId={accountDeepLink.selectedId}
              onDataChanged={() => fetchOverview(range)}
            />
          )}
          {activeSection === 'audit_log' && renderAuditLog()}
          {activeSection === 'roles_permissions' && renderRolesAndPermissions()}
          {activeSection === 'api_docs' && <ApiDocsView />}
          {activeSection !== 'overview' &&
            activeSection !== 'suppliers' &&
            activeSection !== 'stores' &&
            activeSection !== 'drivers' &&
            activeSection !== 'store_staff' &&
            activeSection !== 'audit_log' &&
            activeSection !== 'roles_permissions' &&
            activeSection !== 'api_docs' &&
            renderComingSoonSection()}
        </div>
      </div>
    </div>
  );
};
