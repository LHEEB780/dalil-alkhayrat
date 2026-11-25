import React, { useState } from 'react';
import { 
  Store, 
  Building2, 
  Truck, 
  FileCode2, 
  ShoppingBag, 
  LogIn, 
  UserPlus, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  KeyRound, 
  ArrowLeft, 
  ArrowRight, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Zap, 
  Coins, 
  HelpCircle,
  Eye,
  EyeOff,
  Globe,
  ChevronDown,
  ChevronUp,
  UserCheck
} from 'lucide-react';
import { Role, Language, SellerBusinessType } from '../types/index.ts';
import { SELLER_BUSINESS_TYPES, getSellerBusinessTypeLabel } from '../utils/translations.ts';

interface WelcomeAuthViewProps {
  onLoginAsRole: (role: Role, userProfile: UserSession, authToken?: string) => void;
  language?: Language;
  onLanguageChange?: (lang: Language) => void;
}

export interface UserSession {
  role: Role;
  name: string;
  entityName: string;
  city: string;
  badge: string;
  phone: string;
  avatarColor: string;
  entityId?: string;
  branchName?: string;
  businessType?: SellerBusinessType;
}

export const WelcomeAuthView: React.FC<WelcomeAuthViewProps> = ({ 
  onLoginAsRole,
  language = 'ar',
  onLanguageChange
}) => {
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;
  
  // Custom form state (optional for user)
  const [showCustomAuth, setShowCustomAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<Role>('store');
  const [phoneNumber, setPhoneNumber] = useState('0771 555 8899');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration specific fields
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [city, setCity] = useState('بغداد');
  const [supplierBusinessType, setSupplierBusinessType] = useState<SellerBusinessType>('wholesaler');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Unified list of commercial roles - each presented ONCE without duplication
  const unifiedRoles = [
    {
      role: 'store' as Role,
      title: 'تاجر تجزئة / سوبرماركت',
      englishTitle: 'Store Retailer / Supermarket',
      badge: 'المشتري (Buyer)',
      englishBadge: 'Verified Buyer',
      badgeColor: 'bg-emerald-100 text-[#00A046]',
      entityName: isAr ? 'سوبرماركت المنصور المركزي' : 'Al-Mansoor Central Supermarket',
      personName: isAr ? 'عمار خضير الدوري' : 'Ammar Khudair Al-Douri',
      city: isAr ? 'بغداد - حي المنصور' : 'Baghdad - Mansoor District',
      phone: '0771 555 8899',
      pass: 'mansoor2026',
      financialInfo: isAr ? 'محفظة: 1,850,000 د.ع • ائتمان: 23,000,000 د.ع' : 'Wallet: 1,850k IQD • Credit: 23M IQD',
      description: isAr 
        ? 'شراء بضاعة الجملة من الموردين، مقارنة الأسعار لحظياً، كاشير المحل الداخلي، وإدارة المتجر الإلكتروني للزبائن.'
        : 'Buy wholesale from suppliers, compare barcode prices, in-store POS, and public B2C grocery store.',
      icon: Store,
      accentColor: 'text-[#00A046]',
      bgAccent: 'bg-emerald-50',
      borderAccent: 'border-emerald-300',
      features: [
        'مقارنة أسعار عدة موردين لكل باركود',
        'تقسيم السلة تلقائياً حسب الموردين',
        'إدارة المتجر الإلكتروني والعروض للزبائن',
        'مستشار مالي ذكي بالذكاء الاصطناعي (Gemini)'
      ],
      englishFeatures: [
        'Compare wholesale prices per barcode',
        'Auto-split orders among suppliers',
        'Storefront B2C marketing & deals',
        'AI Financial Advisor (Gemini)'
      ],
      entityId: 'store_almansoor'
    },
    {
      role: 'cashier' as Role,
      title: 'موظف الكاشير / أمين الصندوق',
      englishTitle: 'Store Cashier Employee',
      badge: 'كاشير مقيد (POS Only)',
      englishBadge: 'Restricted Cashier',
      badgeColor: 'bg-teal-100 text-teal-900',
      entityName: isAr ? 'سوبرماركت المنصور المركزي' : 'Al-Mansoor Central Supermarket',
      personName: isAr ? 'سيف الدين قاسم' : 'Saif Al-Deen Qasim',
      city: isAr ? 'بغداد - حي المنصور' : 'Baghdad - Mansoor District',
      phone: '0771 555 0001',
      pass: 'cashier2026',
      financialInfo: isAr ? 'صلاحية بيع فقط • محجوب عن الجملة والائتمان' : 'POS Sales Only • No Wholesale/Credit',
      description: isAr
        ? 'حساب مخصص لموظف الصندوق: البيع المباشر ومسح الباركود ومراقبة الرفوف، مع حجب تام لسوق الجملة وأسعار الشراء والائتمان.'
        : 'Dedicated employee access: retail POS checkout & shelf counts only, with wholesale prices, profits & credit hidden.',
      icon: UserCheck,
      accentColor: 'text-teal-700',
      bgAccent: 'bg-teal-50',
      borderAccent: 'border-teal-300',
      features: [
        'وصول حصري لشاشة كاشير البيع المباشر (POS)',
        'حجب تام لسوق الجملة وأسعار الشراء والأرباح',
        'حجب رصيد الائتمان ودفاتر الموردين وإدارة المتجر'
      ],
      englishFeatures: [
        'POS cashier & barcode checkout only',
        'Wholesale catalog, cost prices & profits hidden',
        'Credit limits & supplier ledgers blocked'
      ],
      entityId: 'store_almansoor'
    },
    {
      role: 'supplier' as Role,
      title: 'شركة ومورد جملة غذائية',
      englishTitle: 'Wholesale Food Supplier',
      badge: 'المورّد (Supplier)',
      englishBadge: 'Master Supplier',
      badgeColor: 'bg-blue-100 text-blue-800',
      entityName: isAr ? 'شركة الرافدين للتجارة والأغذية' : 'Al-Rafidain General Trading Co.',
      personName: isAr ? 'الحاج جاسم الربيعي' : 'Haj Jasim Al-Rubaie',
      city: isAr ? 'بغداد - حي الشورجة التجاري' : 'Baghdad - Shorja Market',
      phone: '0770 123 4567',
      pass: 'rafidain2026',
      financialInfo: isAr ? '42 خط ائتماني للمتاجر • 8 فانات توزيع' : '42 credit lines • 8 active vans',
      description: isAr
        ? 'إدارة أسعار الجملة، استقبال طلبيات السوبرماركتات، دفاتر الأستاذ التراكمية، ومتابعة فانات التوزيع.'
        : 'Manage wholesale prices, orders, immutable append-only ledger, debt aging, and van fleet.',
      icon: Building2,
      accentColor: 'text-blue-700',
      bgAccent: 'bg-blue-50',
      borderAccent: 'border-blue-300',
      features: [
        'دفتر أستاذ مالي تراكمي (Append-Only)',
        'تحليل أعمار الديون (Aging 0-30, 31-60, 61+)',
        'قيود عكسية لتصحيح الأخطاء دون مسح السجل',
        'إدارة أسطول فانات التوزيع والمناديب'
      ],
      englishFeatures: [
        'Immutable append-only financial ledger',
        'Debt aging & credit limits',
        'Reversing offset entries for corrections',
        'Dispatch van fleet & field reps'
      ],
      entityId: 'supp_rafidain'
    },
    {
      role: 'driver' as Role,
      title: 'مندوب توزيع وسائق فان',
      englishTitle: 'Distribution Van Driver',
      badge: 'الموزّع (Van POS)',
      englishBadge: 'Mobile Van POS',
      badgeColor: 'bg-amber-100 text-amber-900',
      entityName: isAr ? 'فان رقم 1 - تويوتا هايس تبريد' : 'Van #1 - Toyota HiAce',
      personName: isAr ? 'أحمد كاظم البغدادي' : 'Ahmed Kazem Al-Baghdadi',
      city: isAr ? 'قاطع الكرخ والمنصور' : 'Karkh & Mansoor District',
      phone: '0772 888 1234',
      pass: 'driver2026',
      financialInfo: isAr ? 'كاش العهدة: 1,450,000 د.ع • مخزون: 175 كرتون' : 'Cash: 1,450k IQD • Stock: 175 boxes',
      description: isAr
        ? 'واجهة مخصصة للهاتف: بيع مباشر من الفان للمحلات، تسليم الطلبيات برمز PIN، وإغلاق الوردية.'
        : 'Mobile-first driver mode: direct POS sales from van, deliver with 4-digit PIN, daily cash close.',
      icon: Truck,
      accentColor: 'text-amber-800',
      bgAccent: 'bg-amber-50',
      borderAccent: 'border-amber-300',
      features: [
        'يعمل أوفلاين دون إنترنت (Offline Sync)',
        'بيع فوري مباشر من مخزون الفان',
        'تأكيد استلام الطلبية برمز التحقق (PIN)',
        'مطابقة صندوق الكاش واحتساب الفارق'
      ],
      englishFeatures: [
        'Works offline without network',
        'Direct mobile POS sales from van',
        'Confirm deliveries with PIN',
        'Daily shift close & drawer match'
      ],
      entityId: 'drv_1'
    },
    {
      role: 'customer' as Role,
      title: 'متجر الزبائن الإلكتروني (B2C)',
      englishTitle: 'Retail Customer Storefront',
      badge: 'الزبون (Consumer)',
      englishBadge: 'Retail Customer',
      badgeColor: 'bg-rose-100 text-rose-800',
      entityName: isAr ? 'المتجر الإلكتروني لسوبرماركت المنصور' : 'Al-Mansoor Supermarket Online',
      personName: isAr ? 'زبون محلي' : 'Local Consumer',
      city: isAr ? 'حي المنصور - شارع 14 رمضان' : 'Al-Mansoor - 14 Ramadan St.',
      phone: '0770 000 1122',
      pass: 'customer2026',
      financialInfo: isAr ? 'طلب فوري أونلاين • توصيل خلال 20 دقيقة' : 'Instant order • 20m delivery',
      description: isAr
        ? 'واجهة مفتوحة للزبائن لطلب المواد الغذائية المنزلية بالمفرد مع التوصيل السريع أو الاستلام الذاتي.'
        : 'Public customer storefront for grocery ordering with express 20-min delivery or pickup.',
      icon: ShoppingBag,
      accentColor: 'text-rose-700',
      bgAccent: 'bg-rose-50',
      borderAccent: 'border-rose-300',
      features: [
        'تصفح منتجات المفرد بأسعار تنافسية',
        'عروض وتخفيضات أسبوعية وبنرات متحركة',
        'توصيل فوري لباب البيت خلال 20 دقيقة',
        'الدفع نقداً عند الاستلام أو المحفظة'
      ],
      englishFeatures: [
        'Shop single-unit retail groceries',
        'Weekly deals & animated hero sliders',
        'Express 20-minute doorstep delivery',
        'Cash on delivery or wallet'
      ],
      entityId: 'store_almansoor'
    },
    {
      role: 'admin' as Role,
      title: 'إدارة المنصة ومطورو التطبيقات',
      englishTitle: 'Platform Admin & API',
      badge: 'الإدارة (Admin & API)',
      englishBadge: 'REST OpenAPI 3.0',
      badgeColor: 'bg-purple-100 text-purple-900',
      entityName: isAr ? 'بوابة المطورين - REST OpenAPI' : 'Developer Portal - REST OpenAPI',
      personName: isAr ? 'فريق تكامل الأنظمة و API' : 'Systems & API Team',
      city: isAr ? 'بغداد - المقر الرئيسي' : 'Baghdad - HQ',
      phone: 'admin@dalilalkhairat.iq',
      pass: 'admin2026',
      financialInfo: isAr ? 'مواصفة OpenAPI 3.0.3 • 9 مسارات نشطة' : 'OpenAPI 3.0.3 • 9 active routes',
      description: isAr
        ? 'لوحة التحكم المركزية ومستكشف واجهات برمجة التطبيقات (OpenAPI) الموثق لتطوير تطبيقات الموبايل.'
        : 'Central control portal and interactive OpenAPI explorer for mobile app engineers.',
      icon: FileCode2,
      accentColor: 'text-purple-700',
      bgAccent: 'bg-purple-50',
      borderAccent: 'border-purple-300',
      features: [
        'توثيق REST API (OpenAPI 3.0) للموبايل',
        'اختبار حي لمسارات الخادم واستجابات JSON',
        'فصل كامل للمنطق المالي في الـ Backend'
      ],
      englishFeatures: [
        'REST OpenAPI 3.0 specification for mobile',
        'Interactive live endpoint tester',
        'Backend financial separation'
      ],
      entityId: 'store_almansoor'
    }
  ];

  // Direct 1-Click Login as that role persona
  const handleDirectLogin = (roleItem: typeof unifiedRoles[0]) => {
    onLoginAsRole(roleItem.role, {
      role: roleItem.role,
      name: roleItem.personName,
      entityName: roleItem.entityName,
      city: roleItem.city,
      phone: roleItem.phone,
      badge: isAr ? roleItem.badge : roleItem.englishBadge,
      avatarColor: roleItem.bgAccent,
      entityId: roleItem.entityId
    });
  };

  // Select role to pre-fill the custom form
  const handleSelectRoleForForm = (roleItem: typeof unifiedRoles[0]) => {
    setSelectedRole(roleItem.role);
    setPhoneNumber(roleItem.phone);
    setPassword('');
    setAuthError(null);
    setShowCustomAuth(true);
  };

  // Submit custom form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const matched = unifiedRoles.find(r => r.role === selectedRole);
    const entityId =
      selectedRole === 'store' || selectedRole === 'cashier' || selectedRole === 'accountant'
        ? 'store_almansoor'
        : selectedRole === 'supplier'
        ? 'supp_rafidain'
        : selectedRole === 'driver'
        ? 'drv_1'
        : 'store_almansoor';

    if (authMode === 'login' && (selectedRole === 'cashier' || selectedRole === 'accountant')) {
      setIsSubmittingAuth(true);
      try {
        const res = await fetch('/api/staff/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: phoneNumber, password })
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.success && data.staff) {
          const staff = data.staff;
          const isAcct = staff.role === 'accountant';
          onLoginAsRole(
            staff.role,
            {
              role: staff.role,
              name: staff.name,
              entityName: staff.storeName,
              city: isAr ? 'بغداد' : 'Baghdad',
              phone: staff.phone,
              branchName: staff.branchName,
              badge: isAcct
                ? isAr
                  ? 'محاسب مالي'
                  : 'Accountant'
                : isAr
                ? 'كاشير مقيد (POS Only)'
                : 'Restricted Cashier',
              avatarColor: isAcct ? 'bg-indigo-50' : 'bg-teal-50',
              entityId: staff.storeId
            },
            data.token
          );
          return;
        }

        // Static demo cashier fallback ONLY if phone is not registered in staff DB and matches demo card
        if (
          res.status === 404 &&
          selectedRole === 'cashier' &&
          matched &&
          phoneNumber.replace(/\s+/g, '') === matched.phone.replace(/\s+/g, '') &&
          password === matched.pass
        ) {
          onLoginAsRole('cashier', {
            role: 'cashier',
            name: matched.personName,
            entityName: matched.entityName,
            city: matched.city,
            phone: matched.phone,
            badge: isAr ? matched.badge : matched.englishBadge,
            avatarColor: matched.bgAccent,
            entityId: matched.entityId
          });
          return;
        }

        setAuthError(
          data?.message ||
            (isAr
              ? 'تعذر تسجيل الدخول. تأكد من رقم الهاتف وكلمة المرور.'
              : 'Login failed. Please check phone and password.')
        );
      } catch {
        setAuthError(
          isAr ? 'تعذر الاتصال بالخادم، حاول مجدداً.' : 'Unable to connect to server.'
        );
      } finally {
        setIsSubmittingAuth(false);
      }
      return;
    }

    if (authMode === 'login') {
      onLoginAsRole(selectedRole, {
        role: selectedRole,
        name: matched?.personName || (isAr ? 'مستخدم مسجل' : 'Registered User'),
        entityName: matched?.entityName || (isAr ? 'منشأة تجارية' : 'Commercial Entity'),
        city: matched?.city || (isAr ? 'بغداد' : 'Baghdad'),
        phone: phoneNumber,
        badge: isAr ? matched?.badge || 'حساب معتمد' : matched?.englishBadge || 'Verified Account',
        avatarColor: matched?.bgAccent || 'bg-emerald-50',
        entityId
      });
    } else {
      onLoginAsRole(selectedRole, {
        role: selectedRole,
        name: ownerName || (isAr ? 'مستخدم جديد' : 'New User'),
        entityName: storeName || (isAr ? 'منشأة تجارية جديدة' : 'New Commercial Entity'),
        city: city || (isAr ? 'بغداد' : 'Baghdad'),
        phone: phoneNumber,
        badge: isAr ? 'حساب جديد' : 'New Account',
        avatarColor: 'bg-emerald-50',
        entityId,
        businessType: selectedRole === 'supplier' ? supplierBusinessType : undefined
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 font-brand">
      
      <div className="max-w-7xl mx-auto w-full space-y-8">
        
        {/* ================= 1. CENTRAL HERO / HEADER ================= */}
        <div className="text-center space-y-3 pt-2 relative">
          
          {/* Language Switcher */}
          {onLanguageChange && (
            <div className={`absolute top-0 ${isAr ? 'left-0' : 'right-0'}`}>
              <button
                onClick={() => onLanguageChange(isAr ? 'en' : 'ar')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-gray-50 text-xs font-black text-[#221F1F] transition cursor-pointer shadow-2xs"
                title={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
              >
                <Globe className="w-3.5 h-3.5 text-[#00A046]" />
                <span>{isAr ? 'English' : 'عربي'}</span>
              </button>
            </div>
          )}

          <div className="inline-flex items-center gap-2 bg-white border border-[#E5E7EB] px-4 py-1.5 rounded-full text-xs font-black text-[#00A046] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#00A046] animate-pulse"></span>
            <span>
              {isAr 
                ? 'بوابة الدخول الموحدة • دليل الخيرات العراق B2B & B2C' 
                : 'Unified Access Portal • Dalil Al-Khairat Iraq B2B & B2C'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#221F1F] tracking-tight">
            {isAr ? (
              <>دليل الخيرات <span className="text-[#00A046]">العراق</span></>
            ) : (
              <>Dalil Al-Khairat <span className="text-[#00A046]">Iraq</span></>
            )}
          </h1>

          <p className="text-xs sm:text-sm text-[#797878] max-w-2xl mx-auto leading-relaxed font-medium">
            {isAr
              ? 'المنظومة الوطنية لتجارة المواد الغذائية بالجملة والتجزئة. انقر على أي حساب أدناه للدخول الفوري ومباشرة العمل بنقرة واحدة:'
              : 'The National B2B Marketplace & Food Wholesale Supply Platform in Iraq. Click any role below to log in immediately:'}
          </p>

        </div>

        {/* ================= 2. UNIFIED ROLE CARDS (NO DUPLICATION) ================= */}
        <div className="space-y-4">
          
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00A046]" />
              <h2 className="text-sm sm:text-base font-black text-[#1F2328]">
                {isAr ? 'حسابات المنظومة (اختر حسابك للدخول الفوري):' : 'System Commercial Profiles (Click to Login):'}
              </h2>
            </div>
            <span className="text-xs text-[#00A046] font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              {isAr ? '⚡ دخول مباشر بنقرة واحدة' : 'Instant One-Click Login'}
            </span>
          </div>

          {/* Grid of the 6 distinct roles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unifiedRoles.map((item) => {
              const IconComp = item.icon;
              const isSelected = selectedRole === item.role;
              const cardFeatures = isAr ? item.features : item.englishFeatures;

              return (
                <div
                  key={item.role}
                  className={`bg-white rounded-3xl border p-5 shadow-xs transition-all flex flex-col justify-between relative group hover:shadow-md ${
                    isSelected ? `ring-2 ring-[#00A046] ${item.borderAccent}` : 'border-[#E5E7EB] hover:border-gray-300'
                  }`}
                >
                  <div>
                    {/* Top Icon & Role Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.bgAccent} ${item.accentColor} shrink-0 shadow-2xs`}>
                        <IconComp className="w-6 h-6" />
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                        {isAr ? item.badge : item.englishBadge}
                      </span>
                    </div>

                    {/* Titles */}
                    <h3 className="font-black text-sm text-[#1F2328] group-hover:text-[#00A046] transition-colors leading-snug">
                      {isAr ? item.title : item.englishTitle}
                    </h3>
                    
                    <p className="text-xs font-bold text-gray-800 mt-1 mb-2">
                      {item.entityName}
                    </p>

                    {/* Description */}
                    <p className="text-xs text-[#6B7280] leading-relaxed mb-3 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Representative and City info chip */}
                    <div className="bg-[#F8F9FA] rounded-xl p-2.5 border border-gray-100 text-[11px] space-y-1 mb-3">
                      <div className="flex items-center justify-between text-gray-700">
                        <span className="text-gray-400 font-medium">{isAr ? 'المسؤول:' : 'Contact:'}</span>
                        <strong className="text-gray-900">{item.personName}</strong>
                      </div>
                      <div className="flex items-center justify-between text-gray-700">
                        <span className="text-gray-400 font-medium">{isAr ? 'المنطقة:' : 'Location:'}</span>
                        <span className="text-gray-600 font-medium truncate max-w-28">{item.city}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono truncate pt-1 border-t border-gray-200/60">
                        {item.financialInfo}
                      </div>
                    </div>

                    {/* Key features bullets */}
                    <div className="space-y-1.5 pt-2 border-t border-dashed border-[#E5E7EB] text-xs">
                      {cardFeatures.slice(0, 3).map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-gray-700 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#00A046] shrink-0 mt-0.5" />
                          <span className="leading-tight">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* One-Click Login Button */}
                  <div className="mt-4 pt-3 border-t border-[#E5E7EB] space-y-1.5">
                    <button
                      type="button"
                      onClick={() => handleDirectLogin(item)}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#00A046] hover:bg-[#008A3C] text-white font-black text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer group-hover:scale-[1.02]"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{isAr ? `دخول فوري ⚡` : `One-Click Login`}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectRoleForForm(item)}
                      className="w-full py-1 text-[11px] text-gray-500 hover:text-gray-900 font-bold text-center transition cursor-pointer"
                    >
                      {isAr ? 'تعديل البيانات أو تسجيل يدوي' : 'Custom Credentials'}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

        </div>

        {/* ================= 3. OPTIONAL COLLAPSIBLE CUSTOM CREDENTIALS / REGISTRATION ================= */}
        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-5 shadow-xs max-w-2xl mx-auto">
          
          <button
            type="button"
            onClick={() => setShowCustomAuth(!showCustomAuth)}
            className="w-full flex items-center justify-between text-right cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-gray-500" />
              <span className="text-xs sm:text-sm font-black text-gray-800">
                {isAr ? 'تسجيل الدخول برقم مخصص أو تسجيل منشأة جديدة (اختياري)' : 'Sign In with Custom Phone / Register New Business'}
              </span>
            </div>
            <div className="p-1 rounded-lg bg-gray-100 text-gray-600">
              {showCustomAuth ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showCustomAuth && (
            <div className="mt-4 pt-4 border-t border-gray-100 animate-fadeIn space-y-4">
              
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">
                    {isAr ? 'نوع الحساب:' : 'Account Role:'}
                  </span>
                  <select
                    data-testid="custom-auth-role-select"
                    value={selectedRole}
                    onChange={(e) => {
                      setSelectedRole(e.target.value as Role);
                      setAuthError(null);
                    }}
                    className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg px-2.5 py-1 text-xs font-bold text-[#0B5D32] focus:outline-hidden focus:border-[#00A046]"
                  >
                    <option value="store">{isAr ? 'تاجر تجزئة / سوبرماركت (المالك)' : 'Store Owner'}</option>
                    <option value="cashier">{isAr ? 'موظف كاشير / أمين صندوق (POS)' : 'Store Cashier (POS Only)'}</option>
                    <option value="accountant">{isAr ? 'محاسب مالي (الفواتير والائتمان)' : 'Store Accountant (Financials Only)'}</option>
                    <option value="supplier">{isAr ? 'شركة ومورد جملة' : 'Wholesale Supplier'}</option>
                    <option value="driver">{isAr ? 'سائق ومندوب فان' : 'Van Driver'}</option>
                    <option value="customer">{isAr ? 'زبون متجر التجزئة' : 'Retail Customer'}</option>
                    <option value="admin">{isAr ? 'مدير النظام والمطورين' : 'System Admin'}</option>
                  </select>
                </div>

                <div className="flex bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl p-0.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError(null);
                    }}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      authMode === 'login' ? 'bg-[#00A046] text-white shadow-2xs' : 'text-gray-600'
                    }`}
                  >
                    {isAr ? 'تسجيل الدخول' : 'Sign In'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setAuthError(null);
                    }}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      authMode === 'register' ? 'bg-[#00A046] text-white shadow-2xs' : 'text-gray-600'
                    }`}
                  >
                    {isAr ? 'إنشاء حساب جديد' : 'Register'}
                  </button>
                </div>
              </div>

              {authError && (
                <div
                  data-testid="custom-auth-error"
                  className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold"
                >
                  {authError}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
                
                {authMode === 'register' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-600 block mb-1 font-bold">
                        {isAr ? 'اسم المتجر / المنشأة:' : 'Business Name:'}
                      </label>
                      <input
                        type="text"
                        required
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder={isAr ? 'مثال: أسواق الكرادة الحديثة...' : 'e.g. Modern Market...'}
                        className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#00A046]"
                      />
                    </div>

                    <div>
                      <label className="text-gray-600 block mb-1 font-bold">
                        {isAr ? 'اسم المالك / المدير:' : 'Owner Name:'}
                      </label>
                      <input
                        type="text"
                        required
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder={isAr ? 'الاسم الثلاثي...' : 'Full Name...'}
                        className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#00A046]"
                      />
                    </div>

                    <div>
                      <label className="text-gray-600 block mb-1 font-bold">
                        {isAr ? 'المحافظة / المدينة:' : 'City:'}
                      </label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#00A046]"
                      >
                        <option value="بغداد">{isAr ? 'بغداد (الكرخ والرصافة)' : 'Baghdad'}</option>
                        <option value="البصرة">{isAr ? 'البصرة' : 'Basra'}</option>
                        <option value="أربيل">{isAr ? 'أربيل' : 'Erbil'}</option>
                        <option value="الموصل">{isAr ? 'الموصل' : 'Mosul'}</option>
                        <option value="النجف">{isAr ? 'النجف الأشرف' : 'Najaf'}</option>
                        <option value="كربلاء">{isAr ? 'كربلاء المقدسة' : 'Karbala'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-gray-600 block mb-1 font-bold">
                        {isAr ? 'نوع النشاط التجاري:' : 'Activity Role:'}
                      </label>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as Role)}
                        className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#00A046]"
                      >
                        <option value="store">{isAr ? 'تاجر تجزئة / سوبرماركت (المالك)' : 'Store Owner'}</option>
                        <option value="cashier">{isAr ? 'موظف كاشير / أمين صندوق (مقيد)' : 'Cashier Employee (POS Only)'}</option>
                        <option value="supplier">{isAr ? 'شركة أو مورد جملة' : 'Wholesale Supplier'}</option>
                        <option value="driver">{isAr ? 'سائق ومندوب فان' : 'Van Driver'}</option>
                      </select>
                    </div>

                    {selectedRole === 'supplier' && (
                      <div className="sm:col-span-2">
                        <label className="text-gray-600 block mb-1 font-bold">
                          {isAr ? 'نوع النشاط:' : 'Business Type:'}
                        </label>
                        <select
                          value={supplierBusinessType}
                          onChange={(e) => setSupplierBusinessType(e.target.value as SellerBusinessType)}
                          className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#00A046]"
                        >
                          {SELLER_BUSINESS_TYPES.map((typeKey) => (
                            <option key={typeKey} value={typeKey}>
                              {getSellerBusinessTypeLabel(typeKey, language)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-600 block mb-1 font-bold">
                      {selectedRole === 'admin' 
                        ? (isAr ? 'معرف المطور / البريد:' : 'Developer ID / Email:') 
                        : (isAr ? 'رقم الهاتف العراقي:' : 'Phone Number:')}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl p-2.5 pr-8 font-mono text-xs text-[#1F2328] focus:bg-white focus:border-[#00A046]"
                      />
                      <Phone className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-600 block mb-1 font-bold">
                      {isAr ? 'كلمة المرور / الرمز السري:' : 'Password / PIN:'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl p-2.5 pr-8 pl-8 font-mono text-xs text-[#1F2328] focus:bg-white focus:border-[#00A046]"
                      />
                      <KeyRound className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-3.5" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-2.5 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingAuth}
                  data-testid="custom-auth-submit-btn"
                  className="w-full py-2.5 bg-[#00A046] text-white font-black text-xs rounded-xl hover:bg-[#008a3c] disabled:opacity-60 transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>
                    {isSubmittingAuth
                      ? isAr
                        ? 'جارٍ التحقق...'
                        : 'Verifying...'
                      : authMode === 'login'
                      ? isAr
                        ? `تأكيد الدخول (${
                            selectedRole === 'accountant'
                              ? 'محاسب مالي'
                              : selectedRole === 'cashier'
                              ? 'موظف كاشير'
                              : unifiedRoles.find((r) => r.role === selectedRole)?.title || 'المتجر'
                          })`
                        : 'Sign In'
                      : isAr
                      ? 'إنشاء الحساب وتفعيل الواجهة'
                      : 'Create Account'}
                  </span>
                </button>

              </form>

            </div>
          )}

        </div>

      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full pt-8 text-center text-xs text-[#6B7280]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#E5E7EB] pt-4 font-brand">
          <span>{isAr ? 'دليل الخيرات (Dalil Al-Khairat B2B & B2C) - جمهورية العراق' : 'Dalil Al-Khairat Platform - Republic of Iraq'}</span>
          <div className="flex items-center gap-4 text-[11px]">
            <span>{isAr ? 'دعم الدينار العراقي (IQD)' : 'Iraqi Dinar (IQD) Support'}</span>
            <span>•</span>
            <span>{isAr ? 'بنية تحتية لتطبيقات Android' : 'Android App Ready'}</span>
            <span>•</span>
            <span>{isAr ? 'دفتر أستاذ ائتماني متوافق' : 'Ledger Compliance'}</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
