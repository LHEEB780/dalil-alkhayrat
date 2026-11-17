import React from 'react';
import {
  MapPin,
  Zap,
  ShoppingCart,
  Package,
  Store,
  Menu,
  BellRing,
  Sliders,
  Eye
} from 'lucide-react';
import { Language, AppTab, StoreWorkspaceMode } from '../types/index.ts';

interface RetailerBottomNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenLowStockAlerts?: () => void;
  lowStockCount?: number;
  onScrollToSuppliers?: () => void;
  onOpenSidebar?: () => void;
  language?: Language;
  workspaceMode?: StoreWorkspaceMode;
}

export const RetailerBottomNav: React.FC<RetailerBottomNavProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  onOpenCart,
  onOpenLowStockAlerts,
  lowStockCount = 0,
  onOpenSidebar,
  language = 'ar',
  workspaceMode = 'b2b'
}) => {
  const isAr = language === 'ar';
  const isB2C = workspaceMode === 'b2c';

  const b2bNavItems = [
    {
      id: 'marketplace',
      label: isAr ? 'سوق الجملة' : 'Wholesale',
      icon: Store,
      badge: null as string | null,
      badgeColor: '',
      onClick: () => setActiveTab('marketplace')
    },
    {
      id: 'suppliers',
      label: isAr ? 'الموردين' : 'Suppliers',
      icon: MapPin,
      badge: null as string | null,
      badgeColor: '',
      onClick: () => setActiveTab('suppliers')
    },
    {
      id: 'cart',
      label: isAr ? 'عربة الجملة' : 'Cart',
      icon: ShoppingCart,
      badge: cartCount > 0 ? String(cartCount) : null,
      badgeColor: 'bg-[#DC2626] text-white',
      onClick: onOpenCart
    },
    {
      id: 'collective',
      label: isAr ? 'الصفقات' : 'Deals',
      icon: Zap,
      badge: null as string | null,
      badgeColor: '',
      onClick: () => setActiveTab('collective')
    },
    {
      id: 'sidebar',
      label: isAr ? 'القائمة' : 'Menu',
      icon: Menu,
      badge: null as string | null,
      badgeColor: '',
      onClick: () => onOpenSidebar?.()
    }
  ];

  const b2cNavItems = [
    {
      id: 'store_pos',
      label: isAr ? 'كاشير المحل' : 'Store POS',
      icon: Package,
      badge: null as string | null,
      badgeColor: '',
      onClick: () => setActiveTab('store_pos')
    },
    {
      id: 'store_management',
      label: isAr ? 'إدارة المتجر' : 'Studio',
      icon: Sliders,
      badge: null as string | null,
      badgeColor: '',
      onClick: () => setActiveTab('store_management')
    },
    {
      id: 'low_stock_alerts',
      label: isAr ? 'النواقص' : 'Alerts',
      icon: BellRing,
      badge: lowStockCount > 0 ? String(lowStockCount) : null,
      badgeColor: 'bg-[#DC2626] text-white',
      onClick: () => onOpenLowStockAlerts?.()
    },
    {
      id: 'b2c',
      label: isAr ? 'معاينة B2C' : 'Preview',
      icon: Eye,
      badge: null as string | null,
      badgeColor: '',
      onClick: () => setActiveTab('b2c')
    },
    {
      id: 'sidebar',
      label: isAr ? 'القائمة' : 'Menu',
      icon: Menu,
      badge: null as string | null,
      badgeColor: '',
      onClick: () => onOpenSidebar?.()
    }
  ];

  const navItems = isB2C ? b2cNavItems : b2bNavItems;

  return (
    <nav
      aria-label={isB2C ? 'Store B2C Navigation Bar' : 'Wholesale B2B Navigation Bar'}
      className={`fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md border-t shadow-[0_-4px_20px_rgba(20,32,24,0.08)] font-brand ${
        isB2C
          ? 'bg-[#142018]/[0.97] border-[#2C3E32]'
          : 'bg-white/95 border-[#DCE5DC]'
      }`}
    >
      <div className="max-w-md md:max-w-xl mx-auto px-2 sm:px-4 flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeTab;

          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative cursor-pointer group ${
                isB2C
                  ? isActive
                    ? 'text-[#FFE600] font-black'
                    : 'text-white/70 hover:text-white'
                  : isActive
                  ? 'text-[#0B5D32] font-black'
                  : 'text-[#5F7164] hover:text-[#142018]'
              }`}
            >
              {/* Count Badge */}
              {item.badge && (
                <span
                  className={`absolute top-0.5 right-1/2 translate-x-3 text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-2xs border tabular-nums ${
                    isB2C ? 'border-[#142018]' : 'border-white'
                  } ${item.badgeColor || 'bg-[#0B5D32] text-white'}`}
                >
                  {item.badge}
                </span>
              )}

              {/* Icon Container */}
              <div
                className={`p-1 rounded-lg transition-transform group-hover:scale-110 ${
                  isActive
                    ? isB2C
                      ? 'bg-white/10 text-[#FFE600]'
                      : 'bg-[#EBF4EE] text-[#0B5D32]'
                    : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              </div>

              {/* Label */}
              <span
                className={`text-[10px] tracking-tight mt-0.5 whitespace-nowrap ${
                  isActive
                    ? isB2C
                      ? 'font-black text-[#FFE600]'
                      : 'font-black text-[#0B5D32]'
                    : 'font-semibold'
                }`}
              >
                {item.label}
              </span>

              {/* Active Dot */}
              {isActive && (
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                    isB2C ? 'bg-[#FFE600]' : 'bg-[#0B5D32]'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
