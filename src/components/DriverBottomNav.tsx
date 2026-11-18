import React from 'react';
import { Receipt, ClipboardList, PackagePlus, Navigation, SlidersHorizontal } from 'lucide-react';
import { Language } from '../types/index.ts';

export type DriverBottomTab = 'pos' | 'deliveries' | 'restock' | 'navigation' | 'manage';

interface DriverBottomNavProps {
  activeTab: DriverBottomTab;
  onSelectTab: (tab: DriverBottomTab) => void;
  cartCount?: number;
  pendingOrdersCount?: number;
  pendingRestockCount?: number;
  availabilityStatus?: 'available' | 'busy';
  language?: Language;
}

export const DriverBottomNav: React.FC<DriverBottomNavProps> = ({
  activeTab,
  onSelectTab,
  cartCount = 0,
  pendingOrdersCount = 0,
  pendingRestockCount = 0,
  availabilityStatus = 'available',
  language = 'ar'
}) => {
  const isAr = language === 'ar';

  const navItems: {
    id: DriverBottomTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge: string | null;
    badgeColor: string;
    statusDot?: 'available' | 'busy';
  }[] = [
    {
      id: 'pos',
      label: isAr ? 'كاشير' : 'Cashier',
      icon: Receipt,
      badge: cartCount > 0 ? String(cartCount) : null,
      badgeColor: 'bg-[#FFE600] text-[#142018]'
    },
    {
      id: 'deliveries',
      label: isAr ? 'طلبات توريد' : 'Supply Orders',
      icon: ClipboardList,
      badge: pendingOrdersCount > 0 ? String(pendingOrdersCount) : null,
      badgeColor: 'bg-[#DC2626] text-white'
    },
    {
      id: 'restock',
      label: isAr ? 'تجهيز فان' : 'Van Restock',
      icon: PackagePlus,
      badge: pendingRestockCount > 0 ? String(pendingRestockCount) : null,
      badgeColor: 'bg-[#FFA300] text-[#142018]'
    },
    {
      id: 'navigation',
      label: isAr ? 'الملاحة' : 'Smart Nav',
      icon: Navigation,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'manage',
      label: isAr ? 'إدارة الفان' : 'Manage Van',
      icon: SlidersHorizontal,
      badge: null,
      badgeColor: '',
      statusDot: availabilityStatus
    }
  ];

  return (
    <nav
      aria-label={isAr ? 'شريط تنقل سائق الفان' : 'Van Driver Navigation Bar'}
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DCE5DC] shadow-[0_-4px_20px_rgba(20,32,24,0.08)] font-brand"
    >
      <div className="max-w-md md:max-w-xl mx-auto px-1.5 sm:px-4 flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeTab;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all relative cursor-pointer group ${
                isActive
                  ? 'text-[#0B5D32] font-black'
                  : 'text-[#5F7164] hover:text-[#142018]'
              }`}
            >
              {item.badge && (
                <span
                  className={`absolute top-0.5 right-1/2 translate-x-3 text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-2xs border border-white tabular-nums ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}

              {item.statusDot && (
                <span
                  className={`absolute top-1 right-1/2 translate-x-3 w-2.5 h-2.5 rounded-full border-2 border-white ${
                    item.statusDot === 'available' ? 'bg-[#00A046]' : 'bg-amber-500'
                  }`}
                />
              )}

              <div
                className={`p-1 rounded-lg transition-transform group-hover:scale-110 ${
                  isActive ? 'bg-[#EBF4EE] text-[#0B5D32]' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              </div>

              <span
                className={`text-[10px] tracking-tight mt-0.5 whitespace-nowrap ${
                  isActive ? 'font-black text-[#0B5D32]' : 'font-semibold'
                }`}
              >
                {item.label}
              </span>

              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full mt-0.5 bg-[#0B5D32]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
