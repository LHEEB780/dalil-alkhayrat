import { Language } from '../types/index.ts';
import { FAMOUS_BRANDS } from '../data/brands.ts';
import type { ProductStorageType } from '../../shared/productFilters.ts';

export interface TranslationDictionary {
  // Brand & General
  appName: string;
  appBadge: string;
  appSubtitle: string;
  tagline: string;
  switchLanguage: string;
  languageName: string;
  iqd: string;
  usd: string;
  online: string;
  offline: string;
  offlineNotice: string;
  loading: string;
  error: string;
  success: string;
  cancel: string;
  confirm: string;
  close: string;
  save: string;
  back: string;
  delete: string;
  searchPlaceholder: string;
  all: string;
  details: string;
  actions: string;
  status: string;
  date: string;
  quantity: string;
  price: string;
  total: string;
  unit: string;
  barcode: string;
  notes: string;
  switchAccount: string;
  logout: string;

  // Driver View (User's specific view in screenshot)
  driverTitle: string;
  driverSubtitle: string;
  driverDefaultName: string;
  driverDefaultPlate: string;
  driverDefaultVan: string;
  cashInCustody: string;
  closeShiftBtn: string;
  connectedToSupplier: string;
  offlineDriverBanner: string;
  vanInventoryTitle: string;
  loadedItemsCount: (count: number) => string;
  unitLabel: string;
  priceLabel: string;
  loadedQty: string;
  soldQty: string;
  remainingInVan: string;
  directSaleTitle: string;
  purchasingStore: string;
  selectItemFromVan: string;
  saleQtyLabel: string;
  paymentMethod: string;
  cashImmediate: string;
  creditOnAccount: string;
  recordDirectSaleBtn: string;
  deliverOrdersTitle: string;
  orderNumber: string;
  customerStore: string;
  itemsCount: string;
  verifyPinBtn: string;
  enterPinPrompt: string;
  pinPlaceholder: string;
  confirmHandoverBtn: string;
  returnDamageTitle: string;
  returnToSupplier: string;
  damageExpired: string;
  reasonPlaceholder: string;
  recordReturnBtn: string;
  shiftCloseModalTitle: string;
  expectedCashFromSales: string;
  actualCountedCash: string;
  cashDifference: string;
  surplus: string;
  shortage: string;
  matched: string;
  confirmShiftCloseBtn: string;

  // Supplier View
  supplierPortalTitle: string;
  supplierSubtitle: string;
  supplierDefaultName: string;
  agingBucketsTitle: string;
  aging0_30: string;
  aging31_60: string;
  aging61_90: string;
  aging90Plus: string;
  ledgerTitle: string;
  appendOnlyNotice: string;
  reversingEntryBtn: string;
  issueReversingEntry: string;
  reversingReason: string;
  vansManagementTitle: string;
  incomingOrdersTitle: string;
  acceptOrderBtn: string;
  dispatchWithVanBtn: string;
  creditLimit: string;
  usedCredit: string;
  availableCredit: string;
  freezeStoreCredit: string;
  unfreezeCredit: string;

  // Store POS & Inventory
  posTitle: string;
  posSubtitle: string;
  posScanOrPick: string;
  currentShelvesTitle: string;
  expiryAlertsTitle: string;
  daysRemaining: (days: number) => string;
  smartReorderBtn: string;
  recordSaleBtn: string;
  lowStockThreshold: string;

  // Marketplace & Product Card
  marketplaceTitle: string;
  marketplaceSubtitle: string;
  filters: string;
  allSuppliers: string;
  filterBySupplier: string;
  freeShippingSmart: string;
  topRated: string;
  cheapestFirst: string;
  topSellers: string;
  fastestDelivery: string;
  longestCredit: string;
  compareOffersBtn: (count: number) => string;
  bestPriceWholesale: string;
  quickAddToCart: string;
  bonusReward: string;
  minOrderQty: (qty: number) => string;
  activeOrders: (count: number) => string;

  // Collective & Expiry Deals
  collectiveTitle: string;
  collectiveSubtitle: string;
  joinPoolBtn: string;
  poolProgress: string;
  expiryClearanceTitle: string;
  clearanceDiscount: string;

  // Public Storefront
  storefrontTitle: string;
  storefrontSubtitle: string;
  homeDelivery: string;
  storePickup: string;
  placeOrderStorefront: string;

  // Cart & Drawers
  cartTitle: string;
  cartEmpty: string;
  cartSplitNotice: string;
  supplierSubOrder: string;
  checkoutBtn: string;

  // Welcome Auth View
  welcomeBadge: string;
  welcomeHeadline: string;
  welcomeSubheadline: string;
  selectRoleHeading: string;
  selectRoleSubheading: string;
  loginTab: string;
  registerTab: string;
  phoneLabel: string;
  passwordLabel: string;
  signInBtn: string;
  demoAccountsTitle: string;
  demoAccountsSubtitle: string;
  oneClickLogin: string;
  fillForm: string;
  formFilled: string;

  // Geographic Hierarchy & Delivery Zones
  geoGovernorate: string;
  geoDistrict: string;
  geoArea: string;
  geoDeliveryZone: string;
  geoSelectGovernorate: string;
  geoSelectDistrict: string;
  geoSelectArea: string;
  geoSupplierNotServingZone: string;
  geoCartZoneBlockedNotice: string;
  geoRemoveSupplierItems: string;

  // Supplier Minimum Order Rules
  orderRuleMissingValue: (missingFormatted: string, minFormatted: string) => string;
  orderRuleMissingQuantity: (missing: number, min: number) => string;
  orderRuleMissingCartons: (missing: number, min: number) => string;
  orderRuleMissingSkus: (missing: number, min: number) => string;
  orderRulesCartBlockedNotice: string;

  // Product Filters & Sorting
  filterTitle: string;
  filterBtnLabel: string;
  filterClearAll: string;
  filterClearFilters: string;
  filterShowProducts: (count: number) => string;
  filterBrand: string;
  filterCountry: string;
  filterStorageType: string;
  filterSupplier: string;
  filterAvailability: string;
  filterInStockOnly: string;
  filterPriceRange: string;
  filterPriceFrom: string;
  filterPriceTo: string;
  filterOnSaleOnly: string;
  filterVerifiedOnly: string;
  filterSearchBrandPlaceholder: string;
  filterSearchCountryPlaceholder: string;
  filterNoOptions: string;
  filterNoResultsTitle: string;
  filterNoResultsSubtitle: string;
  sortLabel: string;
  sortRelevance: string;
  sortPriceAsc: string;
  sortPriceDesc: string;
  sortRatingDesc: string;
  sortDiscountDesc: string;
  storageAmbient: string;
  storageChilled: string;
  storageFrozen: string;
  storageDry: string;
  storageControlled: string;

  // Operations & Admin Center
  adminConsoleTitle: string;
  adminConsoleSubtitle: string;
  adminConsoleBadge: string;
  adminSoleSuperAdminTitle: string;
  adminSoleSuperAdminDesc: string;
  adminSearchPlaceholder: string;
  adminSearching: string;
  adminSearchNoResults: string;
  adminNeedsAttentionTitle: string;
  adminNeedsAttentionEmpty: string;
  adminRange7d: string;
  adminRange30d: string;
  adminRange90d: string;
  adminRefresh: string;
  adminRetry: string;
  adminLoadError: string;
  adminKpiGmv: string;
  adminKpiOrders: string;
  adminKpiDelivered: string;
  adminKpiAvgOrder: string;
  adminKpiActiveAccounts: string;
  adminKpiSuppliersShort: string;
  adminKpiStoresShort: string;
  adminKpiDriversShort: string;
  adminKpiPendingSuppliers: string;
  adminKpiUsedCredit: string;
  adminKpiOverdueDebt: string;
  adminKpiCreditUpgrades: string;
  adminKpiLowStock: string;
  adminChartTitle: string;
  adminChartSubtitle: string;
  adminChartRevenueLabel: string;
  adminChartOrdersLabel: string;
  adminStatusDistTitle: string;
  adminTopSuppliersTitle: string;
  adminTopProductsTitle: string;
  adminNoDataInRange: string;
  adminComingSoonBadge: string;
  adminEditingComingSoon: string;
  adminComingSoonNote: string;
  adminBackToOverview: string;
  adminAuditTitle: string;
  adminAuditSubtitle: string;
  adminAuditFilterAction: string;
  adminAuditFilterEntity: string;
  adminAuditFilterActor: string;
  adminAuditFilterFrom: string;
  adminAuditFilterTo: string;
  adminAuditResetFilters: string;
  adminAuditEmpty: string;
  adminAuditBeforeAfter: string;
  adminAuditReasonLabel: string;
  adminRolesTitle: string;
  adminRolesSubtitle: string;
  adminRoleActiveLabel: string;
  adminRoleTemplateLabel: string;
  adminPermissionsCount: (count: number) => string;
  adminSensitiveBadge: string;
  adminConfirmReasonLabel: string;
  adminConfirmReasonPlaceholder: string;
  adminConfirmReasonRequired: string;
  adminAccTabAll: string;
  adminAccTabPending: string;
  adminAccTabActive: string;
  adminAccTabSuspended: string;
  adminAccTabRejectedArchived: string;
  adminAccSearchPlaceholder: string;
  adminAccCityAll: string;
  adminAccSortNewest: string;
  adminAccSortName: string;
  adminAccSortMetric: string;
  adminAccAddSupplier: string;
  adminAccAddStore: string;
  adminAccEmpty: string;
  adminAccStatusPending: string;
  adminAccStatusActive: string;
  adminAccStatusSuspended: string;
  adminAccStatusRejected: string;
  adminAccStatusArchived: string;
  adminAccActionApprove: string;
  adminAccActionReject: string;
  adminAccActionSuspend: string;
  adminAccActionReactivate: string;
  adminAccActionArchive: string;
  adminAccDetailOverview: string;
  adminAccDetailKyc: string;
  adminAccDetailActivity: string;
  adminAccDetailCredit: string;
  adminAccDetailNotes: string;
  adminAccDetailAudit: string;
  adminKpiCatalogQuality: string;
  adminCatTitle: string;
  adminCatSubtitle: string;
  adminCatTabProducts: string;
  adminCatTabBrands: string;
  adminCatTabOffers: string;
  adminCatTabCategories: string;
  adminCatTabQuality: string;
  adminCatAddProduct: string;
  adminCatEditProduct: string;
  adminCatAddBrand: string;
  adminCatEditBrand: string;
  adminCatSearchProducts: string;
  adminCatSearchBrands: string;
  adminCatSearchOffers: string;
  adminCatStatusActive: string;
  adminCatStatusHidden: string;
  adminCatStatusArchived: string;
  adminCatStatusSuspended: string;
  adminCatHideAction: string;
  adminCatRestoreAction: string;
  adminCatArchiveAction: string;
  adminCatSuspendAction: string;
  adminCatPriceAnomalyBadge: string;
  adminCatLowestPriceBadge: string;
  adminCatLowStockBadge: string;
  adminCatQualityScoreLabel: string;
  adminCatMissingFieldsTitle: string;
  adminCatOffersCompareTitle: string;
  adminOrdTitle: string;
  adminOrdSubtitle: string;
  adminOrdSearchPlaceholder: string;
  adminOrdExportCsv: string;
  adminOrdTabStuck: string;
  adminOrdStuckBadge: string;
  adminOrdForcedDeliveryBadge: string;
  adminOrdCancelledAdminBadge: string;
  adminOrdCancelWarningCredit: string;
  adminOrdCancelWarningCod: string;
  adminOrdTimelineTitle: string;
  adminOrdLedgerTitle: string;
  adminOrdSiblingsTitle: string;
  adminOrdItemsTitle: string;
  adminOrdNotesTitle: string;
  adminOrdActionApprove: string;
  adminOrdActionAssignDriver: string;
  adminOrdActionDispatch: string;
  adminOrdActionRevertApproved: string;
  adminOrdActionRevertAssigned: string;
  adminOrdActionForceDeliver: string;
  adminOrdActionCancel: string;
  adminOrdOpenDisputeBtn: string;
  adminOrdEmpty: string;
  adminDispTitle: string;
  adminDispSubtitle: string;
  adminDispNewBtn: string;
  adminDispTabAll: string;
  adminDispTabOpen: string;
  adminDispTabUnderReview: string;
  adminDispTabResolved: string;
  adminDispTabRejected: string;
  adminDispReviewBtn: string;
  adminDispResolveBtn: string;
  adminDispResolveModalTitle: string;
  adminDispRestockLabel: string;
  adminDispEmpty: string;
  adminLogTitle: string;
  adminLogSubtitle: string;
  adminLogAlertSuspendedTitle: string;
  adminLogAlertLowStockTitle: string;
  adminLogDriversTab: string;
  adminLogRequestsTab: string;
  adminLogEmpty: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  ar: {
    // Brand & General
    appName: 'دليل الخيرات',
    appBadge: 'العراق B2B',
    appSubtitle: 'منظومة توريد المواد الغذائية بالجملة والتجزئة',
    tagline: 'المنصة الوطنية لتجارة وتوريد المواد الغذائية في جمهورية العراق',
    switchLanguage: 'English',
    languageName: 'العربية',
    iqd: 'د.ع',
    usd: 'USD $',
    online: 'متصل',
    offline: 'أوفلاين',
    offlineNotice: 'وضع عدم الاتصال (Offline) - يتم حفظ الحركات محلياً للمزامنة لاحقاً',
    loading: 'جاري التحميل...',
    error: 'حدث خطأ، يرجى المحاولة مرة أخرى',
    success: 'تمت العملية بنجاح',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    close: 'إغلاق',
    save: 'حفظ',
    back: 'رجوع',
    delete: 'حذف',
    searchPlaceholder: 'أنا أبحث في دليل الخيرات عن قهوة، أرز، زيوت، أو امسح الباركود...',
    all: 'الكل',
    details: 'التفاصيل',
    actions: 'الإجراءات',
    status: 'الحالة',
    date: 'التاريخ',
    quantity: 'الكمية',
    price: 'السعر',
    total: 'الإجمالي',
    unit: 'الوحدة',
    barcode: 'الباركود',
    notes: 'ملاحظات',
    switchAccount: 'تبديل الحساب',
    logout: 'تسجيل الخروج',

    // Driver View
    driverTitle: 'مستودع الفان المتنقل والبيع المباشر',
    driverSubtitle: 'وضع سائق الفان ومندوب التوزيع الميداني',
    driverDefaultName: 'أحمد كاظم البغدادي',
    driverDefaultPlate: 'بغداد 48215 ط',
    driverDefaultVan: 'فان رقم 1 - قاطع الكرخ والمنصور',
    cashInCustody: 'الكاش المحصل بالعهدة:',
    closeShiftBtn: 'إغلاق الوردية ومطابقة الصندوق',
    connectedToSupplier: 'متصل بالشبكة المركزية للمورد',
    offlineDriverBanner: 'وضع عدم الاتصال (Offline) - يتم حفظ المبيعات محلياً للمزامنة لاحقاً',
    vanInventoryTitle: 'مخزون الفان الحالي (مستودع متنقل):',
    loadedItemsCount: (c) => `${c} أصناف محملة`,
    unitLabel: 'الوحدة:',
    priceLabel: 'السعر:',
    loadedQty: 'المحمل:',
    soldQty: 'المباع:',
    remainingInVan: 'المتبقي بالفان:',
    directSaleTitle: 'بيع فوري مباشر من الفان لمتجر:',
    purchasingStore: 'المتجر المشتري:',
    selectItemFromVan: 'السلعة من الفان:',
    saleQtyLabel: 'الكمية المباعة (كرتون/كيس):',
    paymentMethod: 'طريقة الدفع:',
    cashImmediate: 'كاش نقدي فوري',
    creditOnAccount: 'آجل على حساب المتجر',
    recordDirectSaleBtn: 'تسجيل البيع الفوري وطباعة الإشعار',
    deliverOrdersTitle: 'تسليم طلبيات مجدولة برمز التحقق (PIN):',
    orderNumber: 'رقم الطلبية:',
    customerStore: 'المتجر المستلم:',
    itemsCount: 'الأصناف:',
    verifyPinBtn: 'تسليم برمز PIN',
    enterPinPrompt: 'أدخل رمز التحقق (PIN) المستلم من صاحب المتجر لتسليم البضاعة:',
    pinPlaceholder: 'أدخل رمز الـ PIN المكون من 4 أرقام...',
    confirmHandoverBtn: 'تأكيد التسليم وإنهاء الطلبية',
    returnDamageTitle: 'تسجيل المرتجعات والتالف من المحلات:',
    returnToSupplier: 'مرتجع سليم للمورد',
    damageExpired: 'تالف / منتهي الصلاحية',
    reasonPlaceholder: 'سبب الإرجاع أو التلف بالتفصيل...',
    recordReturnBtn: 'تسجيل المرتجع / التالف وتحديث العهدة',
    shiftCloseModalTitle: 'إغلاق الوردية اليومية ومطابقة صندوق الكاش',
    expectedCashFromSales: 'الكاش المتوقع حسب المبيعات:',
    actualCountedCash: 'الكاش الفعلي الموجود في الصندوق:',
    cashDifference: 'الفارق / العجز أو الزيادة:',
    surplus: 'زيادة نقدية',
    shortage: 'عجز في الصندوق',
    matched: 'الصندوق متطابق تماماً ✓',
    confirmShiftCloseBtn: 'اعتماد إغلاق الوردية وترحيل الحسابات',

    // Supplier View
    supplierPortalTitle: 'بوابة الموردين والشركات الغذائية',
    supplierSubtitle: 'إدارة الكتالوج، سقوف الائتمان، دفتر الأستاذ، وأسطول الفانات',
    supplierDefaultName: 'شركة الرافدين للتجارة العامة والأغذية',
    agingBucketsTitle: 'تحليل أعمار الديون للمتاجر المشترية (Aging Buckets):',
    aging0_30: '0 - 30 يوماً (سليم)',
    aging31_60: '31 - 60 يوماً (مستحق)',
    aging61_90: '61 - 90 يوماً (حرج)',
    aging90Plus: 'أكثر من 90 يوماً (متعثر)',
    ledgerTitle: 'دفتر الأستاذ المالي التراكمي (Append-Only Ledger):',
    appendOnlyNotice: 'القيود المالية ثابتة ولا تحذف؛ يتم تصحيح الأخطاء عبر قيود عكسية محاسبية.',
    reversingEntryBtn: 'إصدار قيد عكسي لتصحيح خطأ',
    issueReversingEntry: 'إصدار قيد تسوية / عكسي',
    reversingReason: 'سبب القيد العكسي ورقم القيد الأصلي:',
    vansManagementTitle: 'إدارة أسطول فانات التوزيع والمناديب:',
    incomingOrdersTitle: 'طلبيات الجملة الواردة من المتاجر:',
    acceptOrderBtn: 'قبول وتجهيز الطلبية',
    dispatchWithVanBtn: 'إرسال مع الفان للتوصيل',
    creditLimit: 'سقف الائتمان:',
    usedCredit: 'المستخدم:',
    availableCredit: 'المتبقي المتاح:',
    freezeStoreCredit: 'تجميد الائتمان للمتجر',
    unfreezeCredit: 'إلغاء التجميد',

    // Store POS & Inventory
    posTitle: 'كاشير المحل ومراقبة الصلاحية',
    posSubtitle: 'إدارة رفوف السوبرماركت، تنبيهات انتهاء الصلاحية، وإعادة الطلب بلمسة',
    posScanOrPick: 'امسح الباركود أو اختر صنفاً لتسجيل بيع في المحل:',
    currentShelvesTitle: 'مخزون المحل الحالي (على الرفوف):',
    expiryAlertsTitle: 'تنبيهات تاريخ الصلاحية للمواد الغذائية:',
    daysRemaining: (d) => `متبقي ${d} يوماً`,
    smartReorderBtn: 'إعادة طلب ذكية من المورد',
    recordSaleBtn: 'تسجيل بيع للزبون (خصم فوري)',
    lowStockThreshold: 'حد المخزون الآمن:',

    // Marketplace & Product Card
    marketplaceTitle: 'سوق الجملة للمواد الغذائية',
    marketplaceSubtitle: 'مقارنة فورية بالباركود الدولي (EAN/GTIN) بين كبار الموردين في العراق',
    filters: 'الفلاتر',
    allSuppliers: 'جميع الموردين',
    filterBySupplier: 'تصفية حسب المورد:',
    freeShippingSmart: 'الشحن مجاناً SMART',
    topRated: 'حسب التقييم',
    cheapestFirst: 'الأرخص سعراً',
    topSellers: 'أفضل المبيعات',
    fastestDelivery: 'الأسرع توصيلاً',
    longestCredit: 'أطول فترة آجل',
    compareOffersBtn: (c) => `قارن ${c} عروض موردين`,
    bestPriceWholesale: 'أفضل سعر جملة',
    quickAddToCart: 'إضافة أفضل سعر جملة للسلة',
    bonusReward: 'مكافأة',
    minOrderQty: (q) => `أقل كمية: ${q}`,
    activeOrders: (c) => `طلبياتي النشطة (${c})`,

    // Collective & Expiry Deals
    collectiveTitle: 'الشراء الجماعي وتصفيات المخزون',
    collectiveSubtitle: 'تجميع طلبات المتاجر للحصول على خصومات كميات كبرى وتصريف بضائع الصلاحية',
    joinPoolBtn: 'انضمام للصفقة الجماعية',
    poolProgress: 'نسبة اكتمال الحملة:',
    expiryClearanceTitle: 'تصفيات البضائع قريبة الصلاحية (بخصومات كبرى):',
    clearanceDiscount: 'خصم تصفية:',

    // Public Storefront
    storefrontTitle: 'متجر الزبائن الإلكتروني (B2C)',
    storefrontSubtitle: 'اطلب من بيتك من متجر حيّك مع توصيل فوري في بغداد والمحافظات',
    homeDelivery: 'توصيل لباب المنزل',
    storePickup: 'استلام مباشر من المحل',
    placeOrderStorefront: 'تأكيد طلب الزبون وإرساله للمحل',

    // Cart & Drawers
    cartTitle: 'سلة الشراء (تقسيم تلقائي حسب المورد)',
    cartEmpty: 'سلة الشراء فارغة حالياً',
    cartSplitNotice: 'يتم تقسيم السلة تلقائياً إلى طلبيات مستقلة لكل مورد لضمان الفوترة الدقيقة.',
    supplierSubOrder: 'طلبية مورد:',
    checkoutBtn: 'تأكيد وإرسال طلبيات الجملة',

    // Welcome Auth View
    welcomeBadge: 'بوابة الدخول المركزية الموحدة • دليل الخيرات العراق B2B',
    welcomeHeadline: 'دليل الخيرات العراق',
    welcomeSubheadline: 'المنظومة الوطنية لتجارة المواد الغذائية بالجملة والتجزئة. اختر دورك التجاري للدخول إلى واجهتك المستقلة المعزولة بالكامل.',
    selectRoleHeading: 'اختر صفة الدخول للمنظومة (Login Roles):',
    selectRoleSubheading: 'انقر على البطاقة لتحديد الدور أو استخدم زر الدخول المباشر',
    loginTab: 'تسجيل الدخول',
    registerTab: 'إنشاء حساب جديد',
    phoneLabel: 'رقم الهاتف أو البريد:',
    passwordLabel: 'كلمة المرور:',
    signInBtn: 'دخول للمنظومة الآن',
    demoAccountsTitle: 'حسابات تجريبية جاهزة للاختبار الفوري (Demo Accounts):',
    demoAccountsSubtitle: 'بيانات اعتماد واقعية مع أرصدة ومخزون وسجلات لتجربة كل صفة تجارية بنقرة واحدة دون تعبئة يدوي:',
    oneClickLogin: 'دخول بنقرة واحدة',
    fillForm: 'تعبئة النموذج',
    formFilled: 'تمت التعبئة!',

    // Geographic Hierarchy & Delivery Zones
    geoGovernorate: 'المحافظة',
    geoDistrict: 'القضاء',
    geoArea: 'المنطقة',
    geoDeliveryZone: 'منطقة التوصيل',
    geoSelectGovernorate: 'اختر المحافظة',
    geoSelectDistrict: 'اختر القضاء',
    geoSelectArea: 'اختر المنطقة',
    geoSupplierNotServingZone: 'هذا المورد لا يغطي منطقة التوصيل المختارة حالياً',
    geoCartZoneBlockedNotice: 'لا يمكن إرسال الطلب لوجود مورد لا يخدم منطقة التوصيل الحالية. يرجى إزالة منتجاته أو تغيير منطقة التوصيل.',
    geoRemoveSupplierItems: 'إزالة منتجات هذا المورد',

    // Supplier Minimum Order Rules
    orderRuleMissingValue: (missingFormatted, minFormatted) =>
      `ينقصك ${missingFormatted} للوصول إلى الحد الأدنى للطلب (${minFormatted})`,
    orderRuleMissingQuantity: (missing, min) =>
      `ينقصك ${missing} وحدة للوصول إلى الحد الأدنى لإجمالي الوحدات (${min})`,
    orderRuleMissingCartons: (missing, min) =>
      `ينقصك ${missing} كراتين للوصول إلى الحد الأدنى للكراتين (${min})`,
    orderRuleMissingSkus: (missing, min) =>
      `ينقصك ${missing} أصناف مختلفة للوصول إلى الحد الأدنى للأصناف (${min})`,
    orderRulesCartBlockedNotice: 'لا يمكن إتمام الطلب حتى تتحقق قواعد الحد الأدنى لجميع الموردين في السلة.',

    // Product Filters & Sorting
    filterTitle: 'تصفية المنتجات',
    filterBtnLabel: 'فلاتر',
    filterClearAll: 'مسح الكل',
    filterClearFilters: 'مسح الفلاتر',
    filterShowProducts: (count) => `عرض ${count} منتج`,
    filterBrand: 'العلامة التجارية',
    filterCountry: 'بلد المنشأ',
    filterStorageType: 'نوع التخزين',
    filterSupplier: 'المورد',
    filterAvailability: 'التوفر والعروض',
    filterInStockOnly: 'متوفر الآن فقط',
    filterPriceRange: 'السعر بالدينار (د.ع)',
    filterPriceFrom: 'من',
    filterPriceTo: 'إلى',
    filterOnSaleOnly: 'عليه عرض / خصم',
    filterVerifiedOnly: 'موردون موثقون فقط',
    filterSearchBrandPlaceholder: 'ابحث عن علامة تجارية...',
    filterSearchCountryPlaceholder: 'ابحث عن بلد المنشأ...',
    filterNoOptions: 'لا توجد خيارات متاحة',
    filterNoResultsTitle: 'لا توجد منتجات تطابق الفلاتر المختارة',
    filterNoResultsSubtitle: 'جرّب تعديل معايير التصفية أو مسح الفلاتر لعرض جميع المنتجات المتاحة.',
    sortLabel: 'ترتيب حسب',
    sortRelevance: 'الأنسب',
    sortPriceAsc: 'الأرخص أولاً',
    sortPriceDesc: 'الأغلى أولاً',
    sortRatingDesc: 'الأعلى تقييماً',
    sortDiscountDesc: 'الأعلى خصماً',
    storageAmbient: 'حرارة عادية',
    storageChilled: 'مبرد',
    storageFrozen: 'مجمد',
    storageDry: 'جاف',
    storageControlled: 'تخزين متحكم به',

    // Operations & Admin Center
    adminConsoleTitle: 'مركز عمليات المنصة والإدارة',
    adminConsoleSubtitle: 'لوحة القيادة التنفيذية لمتابعة التجارة والائتمان وسجل التدقيق',
    adminConsoleBadge: 'إدارة المنصة',
    adminSoleSuperAdminTitle: 'حساب المدير العام الوحيد (Super Admin)',
    adminSoleSuperAdminDesc: 'هذا الحساب يمتلك الصلاحيات الكاملة حالياً. قوالب الأدوار الأخرى جاهزة ومعطّلة لحين تفعيل تعدد المشرفين في المراحل القادمة.',
    adminSearchPlaceholder: 'ابحث عن مورد، متجر، سائق، منتج، أو رقم طلب...',
    adminSearching: 'جاري البحث في المنصة...',
    adminSearchNoResults: 'لا توجد نتائج مطابقة لبحثك',
    adminNeedsAttentionTitle: 'عناصر تحتاج انتباهك',
    adminNeedsAttentionEmpty: 'لا توجد تنبيهات حرجة حالياً — جميع العمليات مستقرة.',
    adminRange7d: 'آخر 7 أيام',
    adminRange30d: 'آخر 30 يوماً',
    adminRange90d: 'آخر 90 يوماً',
    adminRefresh: 'تحديث',
    adminRetry: 'إعادة المحاولة',
    adminLoadError: 'تعذر تحميل بيانات لوحة العمليات',
    adminKpiGmv: 'حجم التداول (GMV)',
    adminKpiOrders: 'الطلبات غير الملغاة',
    adminKpiDelivered: 'المُسلَّمة ونسبة الإتمام',
    adminKpiAvgOrder: 'متوسط قيمة الطلب',
    adminKpiActiveAccounts: 'الشركاء النشطون',
    adminKpiSuppliersShort: 'مورد',
    adminKpiStoresShort: 'متجر',
    adminKpiDriversShort: 'سائق',
    adminKpiPendingSuppliers: 'موردون بانتظار التوثيق',
    adminKpiUsedCredit: 'إجمالي الائتمان المستخدم',
    adminKpiOverdueDebt: 'ديون متأخرة (+30 يوم)',
    adminKpiCreditUpgrades: 'طلبات رفع الحد المعلقة',
    adminKpiLowStock: 'عروض بمخزون منخفض (≤20)',
    adminChartTitle: 'اتجاه المبيعات والطلبات اليومية',
    adminChartSubtitle: 'حجم التداول اليومي (د.ع) وعدد الطلبات خلال الفترة المختارة',
    adminChartRevenueLabel: 'المبيعات (د.ع)',
    adminChartOrdersLabel: 'عدد الطلبات',
    adminStatusDistTitle: 'توزيع حالات الطلبات',
    adminTopSuppliersTitle: 'أعلى 5 موردين حسب المبيعات',
    adminTopProductsTitle: 'أعلى 5 منتجات حسب الإيرادات',
    adminNoDataInRange: 'لا توجد طلبات مسجلة في هذا النطاق الزمني',
    adminComingSoonBadge: 'قريباً',
    adminEditingComingSoon: 'التعديل قريباً',
    adminComingSoonNote: 'هذا القسم ضمن خارطة مراحل بناء مركز العمليات (المراحل 2–7)، وتتوفر حالياً بياناته في اللوحة الرئيسية والبحث الشامل.',
    adminBackToOverview: 'العودة إلى لوحة المؤشرات',
    adminAuditTitle: 'سجل التدقيق والعمليات الحساسة',
    adminAuditSubtitle: 'توثيق غير قابل للتعديل لجميع الإجراءات الإدارية والسبب والبيانات قبل وبعد التنفيذ',
    adminAuditFilterAction: 'نوع الإجراء',
    adminAuditFilterEntity: 'نوع الكيان',
    adminAuditFilterActor: 'معرّف المنفّذ',
    adminAuditFilterFrom: 'من تاريخ',
    adminAuditFilterTo: 'إلى تاريخ',
    adminAuditResetFilters: 'إعادة ضبط الفلاتر',
    adminAuditEmpty: 'لا توجد سجلات مطابقة لمعايير التصفية الحالية',
    adminAuditBeforeAfter: 'تفاصيل التغيير (قبل / بعد)',
    adminAuditReasonLabel: 'السبب الموثّق:',
    adminRolesTitle: 'الأدوار ومصفوفة الصلاحيات',
    adminRolesSubtitle: 'عرض هيكلي للأدوار الوظيفية وصلاحياتها (قراءة فقط في المرحلة 1)',
    adminRoleActiveLabel: 'نشط حالياً',
    adminRoleTemplateLabel: 'قالب غير مفعّل',
    adminPermissionsCount: (count) => `${count} صلاحية`,
    adminSensitiveBadge: 'حسّاس',
    adminConfirmReasonLabel: 'سبب الإجراء (إلزامي للتوثيق في سجل التدقيق)',
    adminConfirmReasonPlaceholder: 'اكتب السبب الإداري الواضح قبل التأكيد...',
    adminConfirmReasonRequired: 'يرجى إدخال سبب واضح لا يقل عن 5 أحرف للمتابعة',
    adminAccTabAll: 'الكل',
    adminAccTabPending: 'بانتظار الموافقة',
    adminAccTabActive: 'نشط',
    adminAccTabSuspended: 'موقوف',
    adminAccTabRejectedArchived: 'مرفوض / مؤرشف',
    adminAccSearchPlaceholder: 'ابحث بالاسم، الهاتف، المعرّف، المدينة أو رقم اللوحة...',
    adminAccCityAll: 'جميع المدن',
    adminAccSortNewest: 'الأحدث تسجيلاً',
    adminAccSortName: 'الاسم (أ-ي)',
    adminAccSortMetric: 'الأعلى نشاطاً / مبيعات',
    adminAccAddSupplier: 'إضافة مورد',
    adminAccAddStore: 'إضافة متجر',
    adminAccEmpty: 'لا توجد حسابات مطابقة لمعايير التصفية الحالية',
    adminAccStatusPending: 'بانتظار التوثيق',
    adminAccStatusActive: 'نشط',
    adminAccStatusSuspended: 'موقوف',
    adminAccStatusRejected: 'مرفوض',
    adminAccStatusArchived: 'مؤرشف',
    adminAccActionApprove: 'اعتماد وتوثيق',
    adminAccActionReject: 'رفض',
    adminAccActionSuspend: 'إيقاف الحساب',
    adminAccActionReactivate: 'إعادة تفعيل',
    adminAccActionArchive: 'أرشفة',
    adminAccDetailOverview: 'نظرة عامة',
    adminAccDetailKyc: 'التوثيق (KYC)',
    adminAccDetailActivity: 'النشاط',
    adminAccDetailCredit: 'الائتمان',
    adminAccDetailNotes: 'الملاحظات',
    adminAccDetailAudit: 'السجل',
    adminKpiCatalogQuality: 'جودة الكتالوج',
    adminCatTitle: 'إدارة الكتالوج والمنتجات الموحدة',
    adminCatSubtitle: 'حوكمة المنتجات والعلامات وعروض الموردين وشجرة الأقسام ومؤشرات جودة البيانات',
    adminCatTabProducts: 'المنتجات الموحدة',
    adminCatTabBrands: 'العلامات التجارية',
    adminCatTabOffers: 'عروض الموردين',
    adminCatTabCategories: 'شجرة الأقسام',
    adminCatTabQuality: 'جودة البيانات',
    adminCatAddProduct: 'إضافة منتج موحّد',
    adminCatEditProduct: 'تعديل المنتج',
    adminCatAddBrand: 'إضافة علامة تجارية',
    adminCatEditBrand: 'تعديل العلامة',
    adminCatSearchProducts: 'ابحث بالباركود، اسم المنتج، العلامة أو القسم...',
    adminCatSearchBrands: 'ابحث باسم العلامة التجارية أو المعرّف...',
    adminCatSearchOffers: 'ابحث بالباركود، المنتج أو المورد...',
    adminCatStatusActive: 'فعال',
    adminCatStatusHidden: 'مخفي',
    adminCatStatusArchived: 'مؤرشف',
    adminCatStatusSuspended: 'موقوف',
    adminCatHideAction: 'إخفاء',
    adminCatRestoreAction: 'إعادة تفعيل',
    adminCatArchiveAction: 'أرشفة',
    adminCatSuspendAction: 'إيقاف العرض',
    adminCatPriceAnomalyBadge: 'سعر شاذ',
    adminCatLowestPriceBadge: 'أقل سعر',
    adminCatLowStockBadge: 'مخزون منخفض',
    adminCatQualityScoreLabel: 'نسبة الجودة',
    adminCatMissingFieldsTitle: 'الحقول الناقصة لتحسين جودة المنتج',
    adminCatOffersCompareTitle: 'مقارنة عروض الموردين على هذا الباركود',
    adminOrdTitle: 'إدارة الطلبات الفرعية وتتبع التنفيذ',
    adminOrdSubtitle: 'مراقبة الطلبات، كشف الحالات العالقة، وتنفيذ الانتقالات والإلغاءات الموثقة',
    adminOrdSearchPlaceholder: 'ابحث برقم الطلب، الطلب الأب، المتجر، المورد أو السائق...',
    adminOrdExportCsv: 'تصدير CSV',
    adminOrdTabStuck: 'الطلبات العالقة',
    adminOrdStuckBadge: 'طلب عالق',
    adminOrdForcedDeliveryBadge: 'تسليم إداري قسري',
    adminOrdCancelledAdminBadge: 'ملغي إدارياً',
    adminOrdCancelWarningCredit: 'تنبيه مالي ومخزني: سيُعاد مخزون المورد لجميع الأصناف، وسيُعكس قيد الفاتورة في دفتر الأستاذ بقيد عكسي لتحديث الرصيد الائتماني.',
    adminOrdCancelWarningCod: 'تنبيه مخزني: سيُعاد مخزون المورد لجميع الأصناف تلقائياً وتُغلق الطلبية كملغاة.',
    adminOrdTimelineTitle: 'الخط الزمني لحالات الطلب',
    adminOrdLedgerTitle: 'القيود المالية والحساب الائتماني',
    adminOrdSiblingsTitle: 'الطلبات الشقيقة في نفس الطلب الأب',
    adminOrdItemsTitle: 'تفاصيل الأصناف والكميات',
    adminOrdNotesTitle: 'الملاحظات الإدارية الداخلية',
    adminOrdActionApprove: 'اعتماد الطلب',
    adminOrdActionAssignDriver: 'تعيين / تعديل السائق',
    adminOrdActionDispatch: 'إخراج للتوصيل',
    adminOrdActionRevertApproved: 'إعادة إلى مقبول',
    adminOrdActionRevertAssigned: 'إعادة إلى مسند لسائق',
    adminOrdActionForceDeliver: 'تأكيد تسليم إداري (بدون PIN)',
    adminOrdActionCancel: 'إلغاء الطلب وإعادة المخزون',
    adminOrdOpenDisputeBtn: 'فتح نزاع على الطلب',
    adminOrdEmpty: 'لا توجد طلبات مطابقة للفلاتر الحالية',
    adminDispTitle: 'إدارة النزاعات والمرتجعات',
    adminDispSubtitle: 'فحص الشكاوى، تسوية الاستردادات والخصومات الآجلة، وتوثيق قرارات التحكيم',
    adminDispNewBtn: 'فتح نزاع جديد',
    adminDispTabAll: 'الكل',
    adminDispTabOpen: 'مفتوحة',
    adminDispTabUnderReview: 'قيد المراجعة',
    adminDispTabResolved: 'محلولة',
    adminDispTabRejected: 'مرفوضة',
    adminDispReviewBtn: 'تحويل للمراجعة',
    adminDispResolveBtn: 'إصدار قرار التسوية',
    adminDispResolveModalTitle: 'قرار تسوية النزاع',
    adminDispRestockLabel: 'إعادة الكميات إلى مخزون المورد (restockToSupplier)',
    adminDispEmpty: 'لا توجد نزاعات مطابقة لمعايير البحث',
    adminLogTitle: 'اللوجستيات وأسطول التوصيل',
    adminLogSubtitle: 'متابعة السائقين الميدانيين، العهدة النقدية، حمولة الفانات وطلبات التحميل',
    adminLogAlertSuspendedTitle: 'تنبيه حرج: سائقون موقوفون لديهم طلبات نشطة',
    adminLogAlertLowStockTitle: 'تنبيه مخزون الفان: مركبات نشطة بمخزون منخفض (≤ 20 وحدة)',
    adminLogDriversTab: 'أسطول السائقين',
    adminLogRequestsTab: 'طلبات تحميل الفان',
    adminLogEmpty: 'لا توجد بيانات لوجستية للعرض'
  },
  en: {
    // Brand & General
    appName: 'Dalil Al-Khairat',
    appBadge: 'Iraq B2B',
    appSubtitle: 'B2B Wholesale Food & Retail Network',
    tagline: 'National Food Wholesale & Distribution Marketplace in Iraq',
    switchLanguage: 'عربي',
    languageName: 'English',
    iqd: 'IQD',
    usd: 'USD $',
    online: 'Online',
    offline: 'Offline',
    offlineNotice: 'Offline Mode - Transactions saved locally for later synchronization',
    loading: 'Loading...',
    error: 'An error occurred, please try again',
    success: 'Action completed successfully',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    save: 'Save',
    back: 'Back',
    delete: 'Delete',
    searchPlaceholder: 'Search Dalil Al-Khairat for coffee, rice, oils, or scan barcode...',
    all: 'All',
    details: 'Details',
    actions: 'Actions',
    status: 'Status',
    date: 'Date',
    quantity: 'Quantity',
    price: 'Price',
    total: 'Total',
    unit: 'Unit',
    barcode: 'Barcode',
    notes: 'Notes',
    switchAccount: 'Switch Account',
    logout: 'Logout',

    // Driver View (User's specific view in screenshot)
    driverTitle: 'Mobile Van Warehouse & Direct POS Sales',
    driverSubtitle: 'Van Driver & Field Distribution Mode',
    driverDefaultName: 'Ahmed Kazem Al-Baghdadi',
    driverDefaultPlate: 'Baghdad 48215 T',
    driverDefaultVan: 'Van #1 - Karkh & Mansoor District',
    cashInCustody: 'Custody Cash Collected:',
    closeShiftBtn: 'Close Shift & Reconcile Cash',
    connectedToSupplier: 'Connected to Supplier Central Network',
    offlineDriverBanner: 'Offline Mode - Sales are saved locally and synced once reconnected',
    vanInventoryTitle: 'Van Current Inventory (Mobile Warehouse):',
    loadedItemsCount: (c) => `${c} Loaded Items`,
    unitLabel: 'Unit:',
    priceLabel: 'Price:',
    loadedQty: 'Loaded:',
    soldQty: 'Sold:',
    remainingInVan: 'Remaining in Van:',
    directSaleTitle: 'Direct Instant Sale from Van to Store:',
    purchasingStore: 'Purchasing Store:',
    selectItemFromVan: 'Item from Van:',
    saleQtyLabel: 'Sale Quantity (Carton/Bag):',
    paymentMethod: 'Payment Method:',
    cashImmediate: 'Immediate Cash',
    creditOnAccount: 'Credit (Store Account)',
    recordDirectSaleBtn: 'Record Instant Sale & Print Receipt',
    deliverOrdersTitle: 'Deliver Scheduled Orders by PIN:',
    orderNumber: 'Order #:',
    customerStore: 'Receiving Store:',
    itemsCount: 'Items:',
    verifyPinBtn: 'Deliver with PIN',
    enterPinPrompt: 'Enter the 4-digit PIN provided by the store owner to release goods:',
    pinPlaceholder: 'Enter 4-digit delivery PIN...',
    confirmHandoverBtn: 'Confirm Delivery & Complete Order',
    returnDamageTitle: 'Record Returns & Damaged Goods:',
    returnToSupplier: 'Good Return to Supplier',
    damageExpired: 'Damaged / Expired Goods',
    reasonPlaceholder: 'Reason for return or damage details...',
    recordReturnBtn: 'Record Return / Damage & Update Stock',
    shiftCloseModalTitle: 'Daily Shift Close & Cash Drawer Reconciliation',
    expectedCashFromSales: 'Expected Cash from Recorded Sales:',
    actualCountedCash: 'Actual Counted Cash in Drawer:',
    cashDifference: 'Variance / Surplus or Shortage:',
    surplus: 'Cash Surplus',
    shortage: 'Cash Shortage',
    matched: 'Drawer Perfectly Balanced ✓',
    confirmShiftCloseBtn: 'Confirm Shift Close & Post Ledger Entries',

    // Supplier View
    supplierPortalTitle: 'Supplier & Food Wholesaler Portal',
    supplierSubtitle: 'Catalog Management, Credit Limits, Append-Only Ledger & Van Fleet',
    supplierDefaultName: 'Al-Rafidain General Trading & Food Co.',
    agingBucketsTitle: 'Buyer Store Debt Aging Analysis (Aging Buckets):',
    aging0_30: '0 - 30 Days (Current)',
    aging31_60: '31 - 60 Days (Due)',
    aging61_90: '61 - 90 Days (Critical)',
    aging90Plus: '90+ Days (Overdue / Blocked)',
    ledgerTitle: 'Append-Only Financial Ledger:',
    appendOnlyNotice: 'Ledger entries are strictly immutable; corrections are executed via offsetting reversing entries.',
    reversingEntryBtn: 'Issue Offsetting Reversing Entry',
    issueReversingEntry: 'Post Reversing / Adjustment Entry',
    reversingReason: 'Reason for Reversal & Target Entry #:',
    vansManagementTitle: 'Van Fleet & Field Reps Management:',
    incomingOrdersTitle: 'Incoming Wholesale Orders from Stores:',
    acceptOrderBtn: 'Accept & Prepare Order',
    dispatchWithVanBtn: 'Dispatch with Delivery Van',
    creditLimit: 'Credit Limit:',
    usedCredit: 'Utilized:',
    availableCredit: 'Remaining Available:',
    freezeStoreCredit: 'Block Store Credit Line',
    unfreezeCredit: 'Unblock Credit',

    // Store POS & Inventory
    posTitle: 'Store POS Cashier & Expiry Tracker',
    posSubtitle: 'Supermarket Shelves, Expiry Alerts & One-Tap Smart Reordering',
    posScanOrPick: 'Scan barcode or select an item to record a customer sale:',
    currentShelvesTitle: 'Current Store Shelves Inventory:',
    expiryAlertsTitle: 'Perishable Food Expiry Alerts:',
    daysRemaining: (d) => `${d} days remaining`,
    smartReorderBtn: 'One-Tap Smart Reorder',
    recordSaleBtn: 'Record Customer Sale (Instant Stock Deduction)',
    lowStockThreshold: 'Safety Stock Level:',

    // Marketplace & Product Card
    marketplaceTitle: 'Wholesale Food & Groceries Marketplace',
    marketplaceSubtitle: 'Real-time international barcode comparison (EAN/GTIN) across leading suppliers in Iraq',
    filters: 'Filters',
    allSuppliers: 'All Suppliers',
    filterBySupplier: 'Filter by Supplier:',
    freeShippingSmart: 'Free Shipping SMART',
    topRated: 'Top Rated',
    cheapestFirst: 'Cheapest Price',
    topSellers: 'Top Sellers',
    fastestDelivery: 'Fastest Delivery',
    longestCredit: 'Longest Credit Term',
    compareOffersBtn: (c) => `Compare ${c} Supplier Offers`,
    bestPriceWholesale: 'Best Wholesale Price',
    quickAddToCart: 'Add Best Wholesale Offer to Cart',
    bonusReward: 'Reward',
    minOrderQty: (q) => `Min Order: ${q}`,
    activeOrders: (c) => `Active Orders (${c})`,

    // Collective & Expiry Deals
    collectiveTitle: 'Collective Bulk Buying & Clearance Deals',
    collectiveSubtitle: 'Pool orders across neighborhood stores for volume discounts & purchase near-expiry clearance stock',
    joinPoolBtn: 'Join Buying Pool',
    poolProgress: 'Campaign Progress:',
    expiryClearanceTitle: 'Near-Expiry Stock Clearance (Heavy Discounts):',
    clearanceDiscount: 'Clearance Discount:',

    // Public Storefront
    storefrontTitle: 'Customer Online Storefront (B2C)',
    storefrontSubtitle: 'Order online from your neighborhood supermarket with doorstep delivery across Baghdad',
    homeDelivery: 'Home Doorstep Delivery',
    storePickup: 'In-Store Pickup',
    placeOrderStorefront: 'Confirm Customer Order & Send to Store',

    // Cart & Drawers
    cartTitle: 'Shopping Cart (Auto-Split by Supplier)',
    cartEmpty: 'Your shopping cart is currently empty',
    cartSplitNotice: 'Your cart is automatically split into distinct purchase orders per supplier for clear credit & billing.',
    supplierSubOrder: 'Supplier Order:',
    checkoutBtn: 'Confirm & Submit Wholesale Orders',

    // Welcome Auth View
    welcomeBadge: 'Centralized Unified Portal • Dalil Al-Khairat Iraq B2B',
    welcomeHeadline: 'Dalil Al-Khairat Iraq',
    welcomeSubheadline: 'The National B2B Marketplace & Food Wholesale Supply Platform in Iraq. Select your commercial role to access your dedicated portal.',
    selectRoleHeading: 'Select Login Commercial Role:',
    selectRoleSubheading: 'Click a role card to select or use one-click demo credentials below',
    loginTab: 'Sign In',
    registerTab: 'Create Account',
    phoneLabel: 'Phone Number or Email:',
    passwordLabel: 'Password:',
    signInBtn: 'Sign In to Portal',
    demoAccountsTitle: 'Pre-configured Demo Accounts for Instant Testing:',
    demoAccountsSubtitle: 'Realistic business profiles with active ledgers, inventory, and balances. Test each role in one click without typing:',
    oneClickLogin: 'One-Click Login',
    fillForm: 'Fill Form',
    formFilled: 'Form Filled!',

    // Geographic Hierarchy & Delivery Zones
    geoGovernorate: 'Governorate',
    geoDistrict: 'District',
    geoArea: 'Area',
    geoDeliveryZone: 'Delivery Zone',
    geoSelectGovernorate: 'Select Governorate',
    geoSelectDistrict: 'Select District',
    geoSelectArea: 'Select Area',
    geoSupplierNotServingZone: 'This supplier does not serve your selected delivery zone',
    geoCartZoneBlockedNotice: 'Cannot submit order because one or more suppliers do not serve your delivery zone. Please remove their items or change your delivery zone.',
    geoRemoveSupplierItems: 'Remove supplier items',

    // Supplier Minimum Order Rules
    orderRuleMissingValue: (missingFormatted, minFormatted) =>
      `You are missing ${missingFormatted} to reach the minimum order value (${minFormatted})`,
    orderRuleMissingQuantity: (missing, min) =>
      `You are missing ${missing} units to reach the minimum total units (${min})`,
    orderRuleMissingCartons: (missing, min) =>
      `You are missing ${missing} cartons to reach the minimum cartons requirement (${min})`,
    orderRuleMissingSkus: (missing, min) =>
      `You are missing ${missing} distinct SKUs to reach the minimum SKU count (${min})`,
    orderRulesCartBlockedNotice: 'Cannot complete checkout until all supplier minimum order rules are satisfied.',

    // Product Filters & Sorting
    filterTitle: 'Filter Products',
    filterBtnLabel: 'Filters',
    filterClearAll: 'Clear all',
    filterClearFilters: 'Clear Filters',
    filterShowProducts: (count) => `Show ${count} ${count === 1 ? 'product' : 'products'}`,
    filterBrand: 'Brand',
    filterCountry: 'Country of Origin',
    filterStorageType: 'Storage Type',
    filterSupplier: 'Supplier',
    filterAvailability: 'Availability & Deals',
    filterInStockOnly: 'In stock now only',
    filterPriceRange: 'Price Range (IQD)',
    filterPriceFrom: 'From',
    filterPriceTo: 'To',
    filterOnSaleOnly: 'On sale / discount',
    filterVerifiedOnly: 'Verified suppliers only',
    filterSearchBrandPlaceholder: 'Search brands...',
    filterSearchCountryPlaceholder: 'Search countries...',
    filterNoOptions: 'No options available',
    filterNoResultsTitle: 'No products match your selected filters',
    filterNoResultsSubtitle: 'Try adjusting your filters or clear all filters to browse available products.',
    sortLabel: 'Sort by',
    sortRelevance: 'Best match',
    sortPriceAsc: 'Price: Low to High',
    sortPriceDesc: 'Price: High to Low',
    sortRatingDesc: 'Highest Rated',
    sortDiscountDesc: 'Highest Discount',
    storageAmbient: 'Ambient',
    storageChilled: 'Chilled',
    storageFrozen: 'Frozen',
    storageDry: 'Dry',
    storageControlled: 'Controlled',

    // Operations & Admin Center
    adminConsoleTitle: 'Platform Operations & Admin Center',
    adminConsoleSubtitle: 'Executive hub for marketplace volume, credit exposure, and audit compliance',
    adminConsoleBadge: 'Platform Admin',
    adminSoleSuperAdminTitle: 'Sole Super Admin Account',
    adminSoleSuperAdminDesc: 'Your active session holds full Super Admin permissions. Additional role templates are pre-configured and inactive until multi-admin management launches.',
    adminSearchPlaceholder: 'Search suppliers, stores, drivers, products, or order IDs...',
    adminSearching: 'Searching platform...',
    adminSearchNoResults: 'No matching entities found',
    adminNeedsAttentionTitle: 'Needs Attention Queue',
    adminNeedsAttentionEmpty: 'No critical alerts right now — platform operations look healthy.',
    adminRange7d: 'Last 7 days',
    adminRange30d: 'Last 30 days',
    adminRange90d: 'Last 90 days',
    adminRefresh: 'Refresh',
    adminRetry: 'Retry',
    adminLoadError: 'Failed to load operations overview',
    adminKpiGmv: 'Gross Merchandise Value (GMV)',
    adminKpiOrders: 'Non-Cancelled Orders',
    adminKpiDelivered: 'Delivered & Completion Rate',
    adminKpiAvgOrder: 'Average Order Value',
    adminKpiActiveAccounts: 'Active Ecosystem Partners',
    adminKpiSuppliersShort: 'Suppliers',
    adminKpiStoresShort: 'Stores',
    adminKpiDriversShort: 'Drivers',
    adminKpiPendingSuppliers: 'Suppliers Pending Verification',
    adminKpiUsedCredit: 'Total Used Credit',
    adminKpiOverdueDebt: 'Overdue Debt (>30d)',
    adminKpiCreditUpgrades: 'Pending Credit Upgrades',
    adminKpiLowStock: 'Low Stock Offers (≤20)',
    adminChartTitle: 'Daily Sales & Order Volume',
    adminChartSubtitle: 'Daily GMV (IQD) and order count across the selected timeframe',
    adminChartRevenueLabel: 'GMV (IQD)',
    adminChartOrdersLabel: 'Orders',
    adminStatusDistTitle: 'Order Status Distribution',
    adminTopSuppliersTitle: 'Top 5 Suppliers by GMV',
    adminTopProductsTitle: 'Top 5 Products by Revenue',
    adminNoDataInRange: 'No orders recorded in this date range',
    adminComingSoonBadge: 'Coming Soon',
    adminEditingComingSoon: 'Editing Coming Soon',
    adminComingSoonNote: 'This module is scheduled for Phases 2–7 of the Operations Center rollout. Live summary metrics remain accessible from Overview & Global Search.',
    adminBackToOverview: 'Back to Operations Overview',
    adminAuditTitle: 'Operations Audit Logs',
    adminAuditSubtitle: 'Immutable chronological record of administrative actions, reasons, and before/after snapshots',
    adminAuditFilterAction: 'Action Code',
    adminAuditFilterEntity: 'Entity Type',
    adminAuditFilterActor: 'Actor ID',
    adminAuditFilterFrom: 'From Date',
    adminAuditFilterTo: 'To Date',
    adminAuditResetFilters: 'Reset Filters',
    adminAuditEmpty: 'No audit log entries match the selected filters',
    adminAuditBeforeAfter: 'Change Snapshot (Before / After)',
    adminAuditReasonLabel: 'Recorded Reason:',
    adminRolesTitle: 'Admin Roles & Permissions Matrix',
    adminRolesSubtitle: 'Read-only inspection of built-in role templates and permission groups (Phase 1)',
    adminRoleActiveLabel: 'Currently Active',
    adminRoleTemplateLabel: 'Inactive Template',
    adminPermissionsCount: (count) => `${count} permissions`,
    adminSensitiveBadge: 'Sensitive',
    adminConfirmReasonLabel: 'Action Reason (mandatory for Audit Log)',
    adminConfirmReasonPlaceholder: 'Enter a clear administrative reason before confirming...',
    adminConfirmReasonRequired: 'Please enter a clear reason (at least 5 characters) to proceed',
    adminAccTabAll: 'All',
    adminAccTabPending: 'Pending Approval',
    adminAccTabActive: 'Active',
    adminAccTabSuspended: 'Suspended',
    adminAccTabRejectedArchived: 'Rejected / Archived',
    adminAccSearchPlaceholder: 'Search by name, phone, ID, city, or plate...',
    adminAccCityAll: 'All Cities',
    adminAccSortNewest: 'Newest First',
    adminAccSortName: 'Name (A-Z)',
    adminAccSortMetric: 'Highest Volume / Activity',
    adminAccAddSupplier: 'Add Supplier',
    adminAccAddStore: 'Add Store',
    adminAccEmpty: 'No accounts match the current filters',
    adminAccStatusPending: 'Pending Verification',
    adminAccStatusActive: 'Active',
    adminAccStatusSuspended: 'Suspended',
    adminAccStatusRejected: 'Rejected',
    adminAccStatusArchived: 'Archived',
    adminAccActionApprove: 'Approve & Verify',
    adminAccActionReject: 'Reject',
    adminAccActionSuspend: 'Suspend',
    adminAccActionReactivate: 'Reactivate',
    adminAccActionArchive: 'Archive',
    adminAccDetailOverview: 'Overview',
    adminAccDetailKyc: 'KYC Docs',
    adminAccDetailActivity: 'Activity',
    adminAccDetailCredit: 'Credit',
    adminAccDetailNotes: 'Notes',
    adminAccDetailAudit: 'Audit Log',
    adminKpiCatalogQuality: 'Catalog Quality',
    adminCatTitle: 'Catalog & Unified Products',
    adminCatSubtitle: 'Govern unified products, brands, supplier offers, category tree, and data quality',
    adminCatTabProducts: 'Unified Products',
    adminCatTabBrands: 'Brands',
    adminCatTabOffers: 'Supplier Offers',
    adminCatTabCategories: 'Category Tree',
    adminCatTabQuality: 'Data Quality',
    adminCatAddProduct: 'Add Unified Product',
    adminCatEditProduct: 'Edit Product',
    adminCatAddBrand: 'Add Brand',
    adminCatEditBrand: 'Edit Brand',
    adminCatSearchProducts: 'Search by barcode, product name, brand, or category...',
    adminCatSearchBrands: 'Search by brand name or ID...',
    adminCatSearchOffers: 'Search by barcode, product, or supplier...',
    adminCatStatusActive: 'Active',
    adminCatStatusHidden: 'Hidden',
    adminCatStatusArchived: 'Archived',
    adminCatStatusSuspended: 'Suspended',
    adminCatHideAction: 'Hide',
    adminCatRestoreAction: 'Restore',
    adminCatArchiveAction: 'Archive',
    adminCatSuspendAction: 'Suspend Offer',
    adminCatPriceAnomalyBadge: 'Price Anomaly',
    adminCatLowestPriceBadge: 'Lowest Price',
    adminCatLowStockBadge: 'Low Stock',
    adminCatQualityScoreLabel: 'Quality Score',
    adminCatMissingFieldsTitle: 'Missing Fields to Improve Quality',
    adminCatOffersCompareTitle: 'Supplier Offers Comparison for Barcode',
    adminOrdTitle: 'Orders & Execution Oversight',
    adminOrdSubtitle: 'Track split sub-orders, detect stuck shipments, and apply audited lifecycle transitions',
    adminOrdSearchPlaceholder: 'Search by Order ID, Parent ID, store, supplier, or driver...',
    adminOrdExportCsv: 'Export CSV',
    adminOrdTabStuck: 'Stuck Orders',
    adminOrdStuckBadge: 'Stuck',
    adminOrdForcedDeliveryBadge: 'Admin Forced Delivery',
    adminOrdCancelledAdminBadge: 'Cancelled by Admin',
    adminOrdCancelWarningCredit: 'Financial & Stock Impact: Supplier stock will be restored for all items and the active INVOICE ledger entry will be reversed via an offset REVERSAL entry.',
    adminOrdCancelWarningCod: 'Stock Impact: Supplier stock will be restored automatically for all items and the sub-order will be marked cancelled.',
    adminOrdTimelineTitle: 'Status Lifecycle Timeline',
    adminOrdLedgerTitle: 'Ledger Entries & Credit Account',
    adminOrdSiblingsTitle: 'Sibling Sub-Orders in Same Parent Order',
    adminOrdItemsTitle: 'Line Items Breakdown',
    adminOrdNotesTitle: 'Internal Admin Notes',
    adminOrdActionApprove: 'Approve Order',
    adminOrdActionAssignDriver: 'Assign / Update Driver',
    adminOrdActionDispatch: 'Dispatch Out for Delivery',
    adminOrdActionRevertApproved: 'Revert to Approved',
    adminOrdActionRevertAssigned: 'Revert to Assigned Driver',
    adminOrdActionForceDeliver: 'Force Deliver (Bypass PIN)',
    adminOrdActionCancel: 'Cancel Order & Restore Stock',
    adminOrdOpenDisputeBtn: 'Open Dispute',
    adminOrdEmpty: 'No sub-orders match the selected filters',
    adminDispTitle: 'Disputes & Claims Resolution',
    adminDispSubtitle: 'Investigate claims, issue credit notes or full refunds, and log arbitration decisions',
    adminDispNewBtn: 'Open New Dispute',
    adminDispTabAll: 'All',
    adminDispTabOpen: 'Open',
    adminDispTabUnderReview: 'Under Review',
    adminDispTabResolved: 'Resolved',
    adminDispTabRejected: 'Rejected',
    adminDispReviewBtn: 'Start Review',
    adminDispResolveBtn: 'Resolve Dispute',
    adminDispResolveModalTitle: 'Dispute Resolution Decision',
    adminDispRestockLabel: 'Return goods to supplier stock (restockToSupplier)',
    adminDispEmpty: 'No disputes match the current filters',
    adminLogTitle: 'Fleet & Logistics Oversight',
    adminLogSubtitle: 'Monitor active field drivers, cash custody, van inventory levels, and load requests',
    adminLogAlertSuspendedTitle: 'Critical Alert: Suspended drivers with active assigned orders',
    adminLogAlertLowStockTitle: 'Low Van Stock Alert: Active drivers with <= 20 remaining units',
    adminLogDriversTab: 'Fleet Drivers',
    adminLogRequestsTab: 'Van Load Requests',
    adminLogEmpty: 'No logistics records found'
  }
};

/**
 * Helper to translate common product titles and units if nameEn is missing
 */
export const itemTranslations: Record<string, string> = {
  // Products
  'أرز بسمتي هندي عنبر درجة أولى': 'Amber Premium Indian Basmati Rice 10kg',
  'زيت دوار الشمس النقي مكرر عافية': 'Pure Sunflower Cooking Oil (12 x 1L)',
  'حليب بودرة كامل الدسم فوري الرافدين': 'Full Cream Instant Milk Powder (24 x 400g)',
  'معجون طماطم مركز الدرة 800 غم': 'Concentrated Tomato Paste (12 x 800g)',
  'شاي سيلاني فاخر أسود الكوزي فرط': 'Ceylon Pure Black Loose Tea (12 x 400g)',
  'سكر أبيض نقي بلوري الاتحاد': 'Pure White Refined Cane Sugar 50kg',
  'تونة لحم أبيض خفيف بالزيت الوها': 'White Meat Light Tuna in Oil (48 x 185g)',
  'جبنة كريمية قابلة للدهن كرافت': 'Cream Cheese Spread Jars (12 x 480g)',
  'مكرونة سباغيتي إيطالية باريلا': 'Barilla Italian Spaghetti Pasta (20 x 500g)',
  'قهوة تركية فاخرة بالهيل بن العميد': 'Al-Ameed Premium Turkish Coffee with Cardamom (12 x 250g)',
  'نسكافيه كلاسيك سريعة التحضير': 'Nescafe Classic Instant Coffee Jar (12 x 200g)',
  'حبوب قهوة أرابيكا كاملة لافازا': 'Lavazza Qualita Oro Whole Coffee Beans (6 x 1kg)',

  // Units
  'كيس (10 كغم)': 'Bag (10 kg)',
  'كرتون (12 × 1 لتر)': 'Carton (12 × 1L)',
  'كرتون (24 × 400 غم)': 'Carton (24 × 400g)',
  'كرتون (12 × 800 غم)': 'Carton (12 × 800g)',
  'كرتون (12 × 400 غم)': 'Carton (12 × 400g)',
  'كيس (50 كغم)': 'Sack (50 kg)',
  'كرتون (48 × 185 غم)': 'Carton (48 × 185g)',
  'كرتون (12 × 480 غم)': 'Carton (12 × 480g)',
  'كرتون (20 × 500 غم)': 'Carton (20 × 500g)',
  'كرتون (12 × 250 غم)': 'Carton (12 × 250g)',
  'كرتون (12 × 200 غم)': 'Carton (12 × 200g)',
  'كرتون (6 × 1 كغم)': 'Carton (6 × 1kg)',

  // Categories (Legacy + Full 22-Department Tree)
  'الكل': 'All',
  'أرز وحبوب': 'Rice & Grains',
  'زيوت وسمن': 'Oils & Ghee',
  'ألبان وأجبان': 'Dairy & Cheese',
  'معلبات وبقوليات': 'Canned Goods & Legumes',
  'معلبات ومخللات': 'Canned & Pickles',
  'شاي ومشروبات': 'Tea & Drinks',
  'مشروبات وشاي': 'Tea & Beverages',
  'سكر ومحليات': 'Sugar & Sweeteners',
  'معكرونة وباستا': 'Pasta & Noodles',
  'مكرونة وشعرية': 'Pasta & Noodles',
  'قهوة ومشروبات ساخنة': 'Coffee & Hot Beverages',
  'منظفات وعناية': 'Cleaning & Care',
  'مواد غذائية أساسية': 'Pantry Staples',
  'زيوت وسمن ودهون': 'Oils, Ghee & Fats',
  'معلبات وأغذية محفوظة': 'Canned & Preserved Foods',
  'صلصات وتوابل': 'Sauces, Spices & Seasonings',
  'ألبان وبيض': 'Dairy & Eggs',
  'مجمدات': 'Frozen Foods',
  'لحوم ودواجن وأسماك': 'Meat, Poultry & Seafood',
  'مشروبات': 'Beverages',
  'شاي وقهوة': 'Tea & Coffee',
  'حلويات وشوكولاتة': 'Confectionery & Chocolate',
  'بسكويت ومخبوزات جافة': 'Biscuits & Dry Bakery',
  'سناكات ومكسرات': 'Snacks & Nuts',
  'الإفطار والمربى': 'Breakfast & Spreads',
  'منتجات الأطفال': 'Baby Products',
  'مواد المخابز والحلويات التجارية': 'Bakery & Pastry Supplies',
  'مواد المطاعم والمطابخ التجارية': 'Foodservice & Commercial Kitchen',
  'منظفات': 'Cleaning Products',
  'عناية شخصية': 'Personal Care',
  'ورقيات': 'Paper Products',
  'تعبئة وتغليف': 'Packaging & Disposables',
  'مستلزمات السوبر ماركت': 'Supermarket Supplies',
  'مستلزمات المقاهي والمطاعم': 'Café & Restaurant Supplies',

  // Storage Types
  'ambient': 'Ambient Storage',
  'chilled': 'Chilled Storage',
  'frozen': 'Frozen Storage',
  'dry': 'Dry Storage',
  'controlled': 'Temperature Controlled',

  // Cities
  'بغداد': 'Baghdad',
  'بغداد - حي المنصور': 'Baghdad - Mansoor',
  'بغداد - الشورجة': 'Baghdad - Shorja',
  'قاطع الكرخ والمنصور': 'Karkh & Mansoor District',
  'البصرة': 'Basra',
  'أربيل': 'Erbil',
  'النجف': 'Najaf',
  'كربلاء': 'Karbala',
  'الموصل': 'Mosul',

  // Entities
  'سوبرماركت المنصور المركزي': 'Al-Mansoor Central Supermarket',
  'أسواق دجلة الخير - الكرادة': 'Tigris Khair Markets - Karrada',
  'شركة الرافدين للتجارة العامة والأغذية': 'Al-Rafidain General Trading & Food Co.',
  'شركة دجلة والفرات للتوزيع': 'Tigris & Euphrates Distribution Co.',
  'مجموعة بابل لتجارة الحبوب والأغذية': 'Babylon Grains & Food Trading Group'
};

export function getLocalizedText(text: string | undefined | null, lang: Language): string {
  if (!text) return '';
  if (lang === 'ar') return text;
  return itemTranslations[text] || text;
}

export const SELLER_BUSINESS_TYPES = [
  'manufacturer',
  'importer',
  'wholesaler',
  'distributor',
  'trader',
  'warehouse',
  'brand_owner',
  'authorized_distributor'
] as const;

export const sellerBusinessTypeLabels: Record<
  (typeof SELLER_BUSINESS_TYPES)[number],
  { ar: string; en: string }
> = {
  manufacturer: { ar: 'مصنع / شركة منتجة', en: 'Manufacturer' },
  importer: { ar: 'مستورد', en: 'Importer' },
  wholesaler: { ar: 'تاجر جملة', en: 'Wholesaler' },
  distributor: { ar: 'موزع', en: 'Distributor' },
  trader: { ar: 'تاجر', en: 'Trader' },
  warehouse: { ar: 'مستودع / مخزن جملة', en: 'Warehouse' },
  brand_owner: { ar: 'مالك علامة تجارية', en: 'Brand Owner' },
  authorized_distributor: { ar: 'وكيل / موزع معتمد', en: 'Authorized Distributor' }
};

export const verificationStatusLabels: Record<
  'pending' | 'verified' | 'verified_business' | 'authorized_distributor',
  { ar: string; en: string }
> = {
  pending: { ar: 'قيد المراجعة', en: 'Pending Verification' },
  verified: { ar: 'موثّق', en: 'Verified' },
  verified_business: { ar: 'شركة موثّقة', en: 'Verified Business' },
  authorized_distributor: { ar: 'موزع معتمد', en: 'Authorized Distributor' }
};

export function getSellerBusinessTypeLabel(
  businessType: keyof typeof sellerBusinessTypeLabels | undefined,
  lang: Language
): string {
  const key = businessType || 'wholesaler';
  return sellerBusinessTypeLabels[key]?.[lang] || sellerBusinessTypeLabels.wholesaler[lang];
}

export function getVerificationStatusLabel(
  verificationStatus: keyof typeof verificationStatusLabels | undefined,
  isVerified: boolean,
  lang: Language
): string {
  const key = verificationStatus || (isVerified ? 'verified' : 'pending');
  return verificationStatusLabels[key]?.[lang] || verificationStatusLabels.pending[lang];
}

export const COUNTRY_TRANSLATIONS: Record<string, { ar: string; en: string }> = {
  'الهند': { ar: 'الهند', en: 'India' },
  'العراق': { ar: 'العراق', en: 'Iraq' },
  'هولندا': { ar: 'هولندا', en: 'Netherlands' },
  'تركيا': { ar: 'تركيا', en: 'Turkey' },
  'سريلانكا': { ar: 'سريلانكا', en: 'Sri Lanka' },
  'تايلاند': { ar: 'تايلاند', en: 'Thailand' },
  'إيطاليا': { ar: 'إيطاليا', en: 'Italy' },
  'سويسرا': { ar: 'سويسرا', en: 'Switzerland' },
  'فرنسا': { ar: 'فرنسا', en: 'France' },
  'ألمانيا': { ar: 'ألمانيا', en: 'Germany' },
  'باكستان': { ar: 'باكستان', en: 'Pakistan' },
  'فيتنام': { ar: 'فيتنام', en: 'Vietnam' },
  'البرازيل': { ar: 'البرازيل', en: 'Brazil' },
  'الإمارات': { ar: 'الإمارات', en: 'UAE' },
  'ماليزيا': { ar: 'ماليزيا', en: 'Malaysia' },
  'الكويت': { ar: 'الكويت', en: 'Kuwait' },
  'الأردن': { ar: 'الأردن', en: 'Jordan' },
  'كندا': { ar: 'كندا', en: 'Canada' },
  'أستراليا': { ar: 'أستراليا', en: 'Australia' },
  'لبنان': { ar: 'لبنان', en: 'Lebanon' },
  'المغرب': { ar: 'المغرب', en: 'Morocco' },
  'إندونيسيا': { ar: 'إندونيسيا', en: 'Indonesia' },
  'السعودية': { ar: 'السعودية', en: 'Saudi Arabia' },
  'مصر': { ar: 'مصر', en: 'Egypt' },
  'أوكرانيا': { ar: 'أوكرانيا', en: 'Ukraine' },
  'إسبانيا': { ar: 'إسبانيا', en: 'Spain' },
  'نيوزيلندا': { ar: 'نيوزيلندا', en: 'New Zealand' },
  'الصين': { ar: 'الصين', en: 'China' },
  'الدنمارك': { ar: 'الدنمارك', en: 'Denmark' },
  'إيران': { ar: 'إيران', en: 'Iran' },
  'الفلبين': { ar: 'الفلبين', en: 'Philippines' },
  'اليونان': { ar: 'اليونان', en: 'Greece' },
  'جنوب أفريقيا': { ar: 'جنوب أفريقيا', en: 'South Africa' },
  'سوريا': { ar: 'سوريا', en: 'Syria' },
  'الولايات المتحدة': { ar: 'الولايات المتحدة', en: 'United States' },
  'اليابان': { ar: 'اليابان', en: 'Japan' },
  'بلجيكا': { ar: 'بلجيكا', en: 'Belgium' },
  'السويد': { ar: 'السويد', en: 'Sweden' },
  'تشيلي': { ar: 'تشيلي', en: 'Chile' },
  'المملكة المتحدة': { ar: 'المملكة المتحدة', en: 'United Kingdom' },
  'النرويج': { ar: 'النرويج', en: 'Norway' },
  'عمان': { ar: 'عمان', en: 'Oman' },
  'النمسا': { ar: 'النمسا', en: 'Austria' },
  'البحرين': { ar: 'البحرين', en: 'Bahrain' },
  'كولومبيا': { ar: 'كولومبيا', en: 'Colombia' },
  'إثيوبيا': { ar: 'إثيوبيا', en: 'Ethiopia' },
  'بولندا': { ar: 'بولندا', en: 'Poland' },
  'أيرلندا': { ar: 'أيرلندا', en: 'Ireland' },
  'كوريا الجنوبية': { ar: 'كوريا الجنوبية', en: 'South Korea' }
};

export function getCountryLabel(countryRaw: string | undefined, lang: Language): string {
  if (!countryRaw) return '';
  const trimmed = countryRaw.trim();
  const entry = COUNTRY_TRANSLATIONS[trimmed];
  if (entry) return entry[lang];
  return trimmed;
}

export function getStorageTypeLabel(storageType: ProductStorageType, lang: Language): string {
  const t = translations[lang];
  switch (storageType) {
    case 'ambient':
      return t.storageAmbient;
    case 'chilled':
      return t.storageChilled;
    case 'frozen':
      return t.storageFrozen;
    case 'dry':
      return t.storageDry;
    case 'controlled':
      return t.storageControlled;
    default:
      return storageType;
  }
}

export function getBrandDisplayName(
  brandId: string | undefined,
  brandRaw: string | undefined,
  lang: Language
): string {
  const raw = (brandRaw || '').trim();
  const byId = brandId ? FAMOUS_BRANDS.find((b) => b.id === brandId) : undefined;
  const matched =
    byId ||
    FAMOUS_BRANDS.find(
      (b) =>
        b.nameAr === raw ||
        b.nameEn.toLowerCase() === raw.toLowerCase() ||
        (raw && b.matchKeywords.some((kw) => raw.toLowerCase().includes(kw.toLowerCase())))
    );
  if (matched) {
    return lang === 'ar' ? matched.nameAr : matched.nameEn;
  }
  if (lang === 'en' && raw) {
    return itemTranslations[raw] || raw;
  }
  return raw || brandId || '';
}


