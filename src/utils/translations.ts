import { Language } from '../types/index.ts';

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
    orderRulesCartBlockedNotice: 'لا يمكن إتمام الطلب حتى تتحقق قواعد الحد الأدنى لجميع الموردين في السلة.'
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
    orderRulesCartBlockedNotice: 'Cannot complete checkout until all supplier minimum order rules are satisfied.'
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

