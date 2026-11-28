export type AdminPermissionCode =
  | 'overview.view'
  | 'suppliers.view'
  | 'suppliers.verify'
  | 'suppliers.suspend'
  | 'stores.view'
  | 'stores.suspend'
  | 'drivers.view'
  | 'drivers.suspend'
  | 'staff.view'
  | 'products.manage'
  | 'brands.manage'
  | 'offers.suspend'
  | 'orders.view'
  | 'orders.override_status'
  | 'disputes.manage'
  | 'credit.view'
  | 'credit.approve_upgrade'
  | 'ledger.view'
  | 'settlements.manage'
  | 'content.manage'
  | 'notifications.send'
  | 'geo.manage'
  | 'settings.manage'
  | 'roles.manage'
  | 'audit.view'
  | 'apidocs.view'
  | 'delivery.view'
  | 'delivery.partners.manage'
  | 'delivery.vehicles.manage'
  | 'delivery.rates.manage'
  | 'dispatch.view'
  | 'dispatch.assign';

export type AdminRoleId = 'super_admin' | 'operations' | 'finance' | 'support' | 'content';

export interface AdminPermissionItem {
  code: AdminPermissionCode;
  labelAr: string;
  labelEn: string;
  sensitive?: boolean;
}

export interface AdminPermissionGroup {
  groupId: string;
  labelAr: string;
  labelEn: string;
  permissions: AdminPermissionItem[];
}

export const ADMIN_PERMISSION_GROUPS: AdminPermissionGroup[] = [
  {
    groupId: 'overview',
    labelAr: 'نظرة عامة',
    labelEn: 'Overview',
    permissions: [
      { code: 'overview.view', labelAr: 'عرض لوحة المؤشرات الرئيسية', labelEn: 'View main KPIs dashboard' }
    ]
  },
  {
    groupId: 'accounts',
    labelAr: 'الحسابات',
    labelEn: 'Accounts',
    permissions: [
      { code: 'suppliers.view', labelAr: 'عرض الموردين', labelEn: 'View suppliers' },
      { code: 'suppliers.verify', labelAr: 'توثيق واعتماد الموردين', labelEn: 'Verify & approve suppliers', sensitive: true },
      { code: 'suppliers.suspend', labelAr: 'إيقاف أو تفعيل حساب مورد', labelEn: 'Suspend or activate supplier', sensitive: true },
      { code: 'stores.view', labelAr: 'عرض المتاجر', labelEn: 'View stores' },
      { code: 'stores.suspend', labelAr: 'إيقاف أو تفعيل متجر', labelEn: 'Suspend or activate store', sensitive: true },
      { code: 'drivers.view', labelAr: 'عرض السائقين', labelEn: 'View drivers' },
      { code: 'drivers.suspend', labelAr: 'إيقاف أو تفعيل سائق', labelEn: 'Suspend or activate driver', sensitive: true },
      { code: 'staff.view', labelAr: 'عرض موظفي المتاجر', labelEn: 'View store staff' }
    ]
  },
  {
    groupId: 'catalog',
    labelAr: 'الكتالوج',
    labelEn: 'Catalog',
    permissions: [
      { code: 'products.manage', labelAr: 'إدارة المنتجات الموحدة', labelEn: 'Manage unified products' },
      { code: 'brands.manage', labelAr: 'إدارة العلامات التجارية', labelEn: 'Manage brands' },
      { code: 'offers.suspend', labelAr: 'إيقاف أو مراجعة العروض', labelEn: 'Suspend or review offers', sensitive: true }
    ]
  },
  {
    groupId: 'orders',
    labelAr: 'الطلبات واللوجستيات',
    labelEn: 'Orders & Logistics',
    permissions: [
      { code: 'orders.view', labelAr: 'عرض جميع الطلبات', labelEn: 'View all orders' },
      { code: 'orders.override_status', labelAr: 'تجاوز وتعديل حالة الطلب', labelEn: 'Override order status', sensitive: true },
      { code: 'disputes.manage', labelAr: 'إدارة النزاعات والمرتجعات', labelEn: 'Manage disputes & returns', sensitive: true }
    ]
  },
  {
    groupId: 'finance',
    labelAr: 'المالية',
    labelEn: 'Finance',
    permissions: [
      { code: 'credit.view', labelAr: 'عرض حسابات وحدود الائتمان', labelEn: 'View credit accounts & limits' },
      { code: 'credit.approve_upgrade', labelAr: 'اعتماد طلبات رفع الحد الائتماني', labelEn: 'Approve credit limit upgrades', sensitive: true },
      { code: 'ledger.view', labelAr: 'عرض دفتر الأستاذ', labelEn: 'View financial ledger' },
      { code: 'settlements.manage', labelAr: 'إدارة التسويات المالية', labelEn: 'Manage financial settlements', sensitive: true }
    ]
  },
  {
    groupId: 'content',
    labelAr: 'المحتوى والتسويق',
    labelEn: 'Content & Marketing',
    permissions: [
      { code: 'content.manage', labelAr: 'إدارة البنرات والمجموعات والتجمعات الشرائية', labelEn: 'Manage banners, collections & pools' },
      { code: 'notifications.send', labelAr: 'إرسال الإشعارات الجماعية', labelEn: 'Send broadcast notifications' }
    ]
  },
  {
    groupId: 'geography',
    labelAr: 'الجغرافيا',
    labelEn: 'Geography',
    permissions: [
      { code: 'geo.manage', labelAr: 'إدارة المحافظات ومناطق التوصيل', labelEn: 'Manage governorates & delivery zones' }
    ]
  },
  {
    groupId: 'settings',
    labelAr: 'الإعدادات',
    labelEn: 'Settings',
    permissions: [
      { code: 'settings.manage', labelAr: 'تعديل إعدادات المنصة', labelEn: 'Manage platform settings', sensitive: true },
      { code: 'roles.manage', labelAr: 'إدارة الأدوار والصلاحيات', labelEn: 'Manage roles & permissions', sensitive: true },
      { code: 'audit.view', labelAr: 'عرض سجل التدقيق', labelEn: 'View audit log' },
      { code: 'apidocs.view', labelAr: 'عرض توثيق الـ API', labelEn: 'View API documentation' }
    ]
  },
  {
    groupId: 'delivery',
    labelAr: 'شبكة التوصيل',
    labelEn: 'Delivery Network',
    permissions: [
      { code: 'delivery.view', labelAr: 'عرض شبكة التوصيل والمركبات والأسعار', labelEn: 'View delivery network, fleet & rates' },
      { code: 'delivery.partners.manage', labelAr: 'إدارة شركاء وسائقي شبكة التوصيل', labelEn: 'Manage delivery partners & platform drivers', sensitive: true },
      { code: 'delivery.vehicles.manage', labelAr: 'إدارة واعتماد مركبات شبكة التوصيل', labelEn: 'Manage & approve delivery vehicles', sensitive: true },
      { code: 'delivery.rates.manage', labelAr: 'تعديل بطاقة الأسعار وإعدادات التوصيل', labelEn: 'Manage rate card & delivery settings', sensitive: true },
      { code: 'dispatch.view', labelAr: 'عرض لوحة التوزيع ومهام التوصيل', labelEn: 'View dispatch board & delivery jobs' },
      { code: 'dispatch.assign', labelAr: 'إسناد وإلغاء وإعادة فتح مهام التوصيل', labelEn: 'Assign, unassign, cancel & reopen delivery jobs', sensitive: true }
    ]
  }
];

export const ALL_ADMIN_PERMISSIONS: AdminPermissionCode[] = ADMIN_PERMISSION_GROUPS.flatMap(
  (g) => g.permissions.map((p) => p.code)
);

export interface AdminRoleDefinition {
  id: AdminRoleId;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  isActive: boolean;
  isSystemRole: boolean;
  permissions: AdminPermissionCode[];
}

export const ADMIN_ROLES: AdminRoleDefinition[] = [
  {
    id: 'super_admin',
    nameAr: 'المدير العام',
    nameEn: 'Super Admin',
    descriptionAr: 'صلاحيات كاملة لإدارة جميع أقسام المنصة، الحسابات، المالية، والإعدادات الحساسة.',
    descriptionEn: 'Full unrestricted access across all platform operations, finance, accounts, and security settings.',
    isActive: true,
    isSystemRole: true,
    permissions: ALL_ADMIN_PERMISSIONS
  },
  {
    id: 'operations',
    nameAr: 'العمليات واللوجستيات',
    nameEn: 'Operations',
    descriptionAr: 'متابعة الموردين والمتاجر والسائقين والطلبات والنزاعات والمناطق الجغرافية.',
    descriptionEn: 'Manage suppliers, stores, drivers, orders, disputes, and delivery zones.',
    isActive: false,
    isSystemRole: false,
    permissions: [
      'overview.view',
      'suppliers.view',
      'suppliers.verify',
      'suppliers.suspend',
      'stores.view',
      'drivers.view',
      'drivers.suspend',
      'orders.view',
      'orders.override_status',
      'disputes.manage',
      'geo.manage',
      'delivery.view',
      'delivery.partners.manage',
      'delivery.vehicles.manage',
      'delivery.rates.manage',
      'dispatch.view',
      'dispatch.assign',
      'audit.view'
    ]
  },
  {
    id: 'finance',
    nameAr: 'المالية والائتمان',
    nameEn: 'Finance',
    descriptionAr: 'مراجعة حسابات الائتمان وطلبات رفع الحد ودفتر الأستاذ والتسويات المالية.',
    descriptionEn: 'Review credit accounts, limit upgrade requests, ledger entries, and settlements.',
    isActive: false,
    isSystemRole: false,
    permissions: [
      'overview.view',
      'suppliers.view',
      'stores.view',
      'orders.view',
      'credit.view',
      'credit.approve_upgrade',
      'ledger.view',
      'settlements.manage',
      'audit.view'
    ]
  },
  {
    id: 'support',
    nameAr: 'الدعم وحل النزاعات',
    nameEn: 'Support',
    descriptionAr: 'عرض الحسابات والطلبات ومتابعة النزاعات والمرتجعات مع المتاجر والموردين.',
    descriptionEn: 'View accounts & orders and resolve customer/store disputes and returns.',
    isActive: false,
    isSystemRole: false,
    permissions: [
      'overview.view',
      'suppliers.view',
      'stores.view',
      'drivers.view',
      'staff.view',
      'orders.view',
      'disputes.manage',
      'credit.view'
    ]
  },
  {
    id: 'content',
    nameAr: 'المحتوى والتسويق',
    nameEn: 'Content',
    descriptionAr: 'إدارة الكتالوج والعلامات التجارية والبنرات والمجموعات والتجمعات الشرائية والإشعارات.',
    descriptionEn: 'Manage unified products, brands, banners, collections, pools, and notifications.',
    isActive: false,
    isSystemRole: false,
    permissions: [
      'overview.view',
      'products.manage',
      'brands.manage',
      'content.manage',
      'notifications.send'
    ]
  }
];

export function getAdminRoleDefinition(roleId: AdminRoleId): AdminRoleDefinition {
  return ADMIN_ROLES.find((r) => r.id === roleId) || ADMIN_ROLES[0];
}

export function hasAdminPermission(roleId: AdminRoleId, code: AdminPermissionCode): boolean {
  const role = getAdminRoleDefinition(roleId);
  return role.permissions.includes(code);
}
