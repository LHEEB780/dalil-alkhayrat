import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LowStockAlertItem } from '../components/LowStockNotificationModal.tsx';
import {
  MapPin,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Zap,
  Star,
  Store,
  ShieldCheck,
  ScanBarcode,
  ArrowDown,
  Building2,
  Truck,
  Search,
  X
} from 'lucide-react';
import {
  ProductWithOffers,
  SupplierOfferItem,
  Currency,
  Language,
  OrderItem
} from '../types/index.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { formatCurrency } from '../utils/format.ts';
import { getLocalizedText } from '../utils/translations.ts';
import {
  WHOLESALE_SUPPLIERS,
  BAGHDAD_DISTRICTS,
  StoreDistrict,
  WholesaleSupplier,
  calculateDistanceKm
} from '../data/nearbySuppliers.ts';
import { StoreLocationModal } from '../components/StoreLocationModal.tsx';

interface StoreMarketplaceViewProps {
  products: ProductWithOffers[];
  currency: Currency;
  language?: Language;
  onCompareOffers: (product: ProductWithOffers) => void;
  onAddToCart: (product: ProductWithOffers, offer: SupplierOfferItem, quantity: number) => void;
  orders: OrderItem[];
  onRefreshOrders: () => void;
  lowStockAlerts: LowStockAlertItem[];
  onOpenAlertsModal: () => void;
  onRefreshAlerts?: () => void;
  selectedCategory?: string;
  selectedSubCategory?: string;
  onSelectCategory?: (category: string) => void;
  onSelectSubCategory?: (subCategory: string) => void;
  onOpenSupplierStore?: (supplier: WholesaleSupplier) => void;
  onOpenBarcodeScanner?: () => void;
  currentDistrict?: StoreDistrict;
  onSelectDistrict?: (district: StoreDistrict) => void;
  wishlistBarcodes?: string[];
  onToggleWishlist?: (barcode: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onResetGlobalFilters?: () => void;
}

interface HorizontalProductShelfProps {
  id?: string;
  children: React.ReactNode;
  isAr: boolean;
  className?: string;
}

const HorizontalScrollRow: React.FC<HorizontalProductShelfProps> = ({
  id,
  children,
  isAr,
  className = ''
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const nudge = (direction: 'prev' | 'next') => {
    const el = scrollRef.current;
    if (!el) return;
    const step = direction === 'next' ? (isAr ? -340 : 340) : (isAr ? 340 : -340);
    el.scrollBy({ left: step, behavior: 'smooth' });
  };

  return (
    <div id={id} className="relative group/row">
      <button
        type="button"
        onClick={() => nudge('prev')}
        aria-label={isAr ? 'السابق' : 'Previous'}
        className="hidden md:flex opacity-0 group-hover/row:opacity-100 transition-opacity absolute start-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 border border-[#E5E7EB] shadow-md items-center justify-center text-[#111827] hover:text-[#00A046] hover:border-[#00A046] cursor-pointer"
      >
        {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div
        ref={scrollRef}
        className={`flex gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory ${className}`}
      >
        {children}
      </div>

      <button
        type="button"
        onClick={() => nudge('next')}
        aria-label={isAr ? 'التالي' : 'Next'}
        className="hidden md:flex opacity-0 group-hover/row:opacity-100 transition-opacity absolute end-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 border border-[#E5E7EB] shadow-md items-center justify-center text-[#111827] hover:text-[#00A046] hover:border-[#00A046] cursor-pointer"
      >
        {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </div>
  );
};

export const StoreMarketplaceView: React.FC<StoreMarketplaceViewProps> = ({
  products,
  currency,
  language = 'ar',
  onCompareOffers,
  onAddToCart,
  currentDistrict: controlledDistrict,
  onSelectDistrict,
  onSelectCategory,
  onOpenSupplierStore,
  onOpenBarcodeScanner,
  wishlistBarcodes = [],
  onToggleWishlist,
  lowStockAlerts = [],
  searchQuery = '',
  onSearchChange,
  onResetGlobalFilters
}) => {
  const isAr = language === 'ar';

  // Geographic Location State
  const [localDistrict, setLocalDistrict] = useState<StoreDistrict>(BAGHDAD_DISTRICTS[0]);
  const currentDistrict = controlledDistrict || localDistrict;
  const setCurrentDistrict = (dist: StoreDistrict) => {
    if (onSelectDistrict) {
      onSelectDistrict(dist);
    } else {
      setLocalDistrict(dist);
    }
  };
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Hero carousel active slide & pause-on-hover/interaction
  const [heroSlide, setHeroSlide] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  // Quick-add feedback per barcode
  const [addedBarcodes, setAddedBarcodes] = useState<Record<string, boolean>>({});

  // Optional feedback banner acknowledgement
  const [feedbackSent, setFeedbackSent] = useState<'yes' | 'no' | null>(null);

  const handleQuickAdd = (e: React.MouseEvent, product: ProductWithOffers) => {
    e.stopPropagation();
    const bestOffer = product.offers[0];
    if (!bestOffer || bestOffer.availableStock <= 0) return;
    onAddToCart(product, bestOffer, bestOffer.minOrderQuantity || 1);
    setAddedBarcodes((prev) => ({ ...prev, [product.barcode]: true }));
    setTimeout(() => {
      setAddedBarcodes((prev) => ({ ...prev, [product.barcode]: false }));
    }, 1500);
  };

  const navigateToCategory = (category: string) => {
    if (onSelectCategory) {
      onSelectCategory(category);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Dynamic suppliers sorted by distance from merchant's selected district
  const isSupplierExpress24h = (s: WholesaleSupplier) => {
    const text = (s.deliveryTimeAr + ' ' + s.deliveryTimeEn).toLowerCase();
    if (
      text.includes('دقيقة') ||
      text.includes('ساعة') ||
      text.includes('ساعات') ||
      text.includes('ساعتان') ||
      text.includes('اليوم') ||
      text.includes('min') ||
      text.includes('hour') ||
      text.includes('same-day')
    ) {
      return true;
    }
    return s.activeVansCount >= 3 && s.distanceKm <= 5;
  };

  const dynamicSuppliers = useMemo(() => {
    return WHOLESALE_SUPPLIERS.map((s) => {
      const dist = calculateDistanceKm(currentDistrict.lat, currentDistrict.lng, s.lat, s.lng);
      return {
        ...s,
        distanceKm: dist,
        isExpress24h: isSupplierExpress24h({ ...s, distanceKm: dist })
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [currentDistrict]);

  // Diversified Top Picks (picks top items across distinct categories first so every shelf feels varied)
  const topPicksProducts = useMemo(() => {
    const seenCategories = new Set<string>();
    const diversified: ProductWithOffers[] = [];
    const sorted = [...products].sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));

    for (const p of sorted) {
      if (!seenCategories.has(p.category)) {
        diversified.push(p);
        seenCategories.add(p.category);
      }
      if (diversified.length >= 8) break;
    }
    if (diversified.length < 8) {
      for (const p of sorted) {
        if (!diversified.some((d) => d.barcode === p.barcode)) {
          diversified.push(p);
        }
        if (diversified.length >= 8) break;
      }
    }
    return diversified;
  }, [products]);

  const saverDealProducts = useMemo(() => {
    const discounted = products
      .filter((p) => (p.discountPercent || 0) >= 10 || p.badgeType === 'promo_day')
      .sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
    return (discounted.length >= 4 ? discounted : products).slice(0, 8);
  }, [products]);

  const coffeeProducts = useMemo(() => {
    return products.filter((p) => p.category === 'قهوة ومشروبات ساخنة').slice(0, 8);
  }, [products]);

  const pantryStapleProducts = useMemo(() => {
    return products
      .filter((p) =>
        ['أرز وحبوب', 'زيوت وسمن', 'سكر ومحليات', 'مكرونة وشعرية'].includes(p.category)
      )
      .slice(0, 8);
  }, [products]);

  const teaAndBeverageProducts = useMemo(() => {
    return products.filter((p) => p.category === 'مشروبات وشاي').slice(0, 8);
  }, [products]);

  const dairyAndCannedProducts = useMemo(() => {
    return products
      .filter((p) => ['ألبان وأجبان', 'معلبات ومخللات'].includes(p.category))
      .slice(0, 8);
  }, [products]);

  const cleaningProducts = useMemo(() => {
    return products.filter((p) => p.category === 'منظفات وعناية').slice(0, 8);
  }, [products]);

  // Count products per category for the clean All Categories grid
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, [products]);

  // Top circular story highlights
  const storyHighlights = [
    {
      id: 'new_arrivals',
      labelAr: 'الأكثر طلباً',
      labelEn: 'Top Picks',
      img: '/assets/images/white_espresso_coffee.jpg',
      ringClass: 'ring-[#00A046]',
      action: () => scrollToSection('shelf-top-picks')
    },
    {
      id: 'saver_deals',
      labelAr: 'عروض التوفير',
      labelEn: 'Saver Deals',
      img: '/assets/images/white_sunflower_oil.jpg',
      ringClass: 'ring-[#F59E0B]',
      action: () => scrollToSection('shelf-saver-deals')
    },
    {
      id: 'coffee_world',
      labelAr: 'قهوة فاخرة',
      labelEn: 'Coffee Hub',
      img: '/assets/images/white_instant_coffee.jpg',
      ringClass: 'ring-[#0F3D24]',
      action: () => navigateToCategory('قهوة ومشروبات ساخنة')
    },
    {
      id: 'pantry_rice',
      labelAr: 'أرز وتموين',
      labelEn: 'Pantry Staples',
      img: '/assets/images/white_basmati_rice.jpg',
      ringClass: 'ring-sky-500',
      action: () => navigateToCategory('أرز وحبوب')
    },
    {
      id: 'tea_time',
      labelAr: 'شاي ومشروبات',
      labelEn: 'Tea & Drinks',
      img: '/assets/images/white_ceylon_tea.jpg',
      ringClass: 'ring-rose-500',
      action: () => navigateToCategory('مشروبات وشاي')
    },
    {
      id: 'nearby_hub',
      labelAr: 'موردون قريبون',
      labelEn: 'Near You',
      img: '/assets/images/white_tomato_paste.jpg',
      ringClass: 'ring-emerald-500',
      action: () => scrollToSection('nearest-suppliers-section')
    }
  ];

  // Hero campaign slides with explicit visual composition side so text sits on clean negative space
  const heroSlides = [
    {
      id: 'prime_b2b',
      badgeAr: 'دليل الخيرات بلس · للتجار',
      badgeEn: 'Dalil Plus · B2B',
      titleAr: 'شحن مجاني SMART وتوريد خلال 24 ساعة!',
      titleEn: 'Free SMART Shipping & < 24h Restock!',
      subtitleAr: 'أسعار المصنع المباشرة من مستودعات الشورجة وجميلة وباب المعظم لباب متجرك.',
      subtitleEn: 'Direct factory pricing from nearest Baghdad wholesale hubs to your door.',
      ctaAr: 'اكتشف العروض',
      ctaEn: 'Explore Deals',
      bgImage: '/assets/images/banner_dalil_hero.jpg',
      productsSide: 'right' as const,
      gradient: 'from-[#062816] via-[#0B4D29] to-[#00A046]',
      scrimClass: 'bg-gradient-to-r from-[#042313]/95 via-[#042313]/75 to-transparent',
      ctaAction: () => scrollToSection('shelf-saver-deals')
    },
    {
      id: 'weekly_festival',
      badgeAr: 'مهرجان التموين الأسبوعي',
      badgeEn: 'Weekly Wholesale Fest',
      titleAr: 'خصومات تصل إلى 35% على كرتونات المواد الغذائية',
      titleEn: 'Up to 35% OFF Wholesale Food Cartons',
      subtitleAr: 'عروض كرتون الزيوت، الأرز، السكر، والمعجون مع مقارنة فورية بالباركود.',
      subtitleEn: 'Compare EAN/GTIN cartons across verified wholesale suppliers.',
      ctaAr: 'تصفح الأقسام',
      ctaEn: 'Browse Aisles',
      bgImage: '/assets/images/banner_dalil_deals.jpg',
      productsSide: 'left' as const,
      gradient: 'from-[#78350F] via-[#B45309] to-[#D97706]',
      scrimClass: 'bg-gradient-to-l from-[#451A03]/95 via-[#78350F]/75 to-transparent',
      ctaAction: () => scrollToSection('all-categories-grid')
    },
    {
      id: 'credit_terms',
      badgeAr: 'تسهيلات السوبرماركت',
      badgeEn: 'Retailer Credit Lines',
      titleAr: 'اطلب الآن وادفع بالآجل حتى 30 يوماً',
      titleEn: 'Order Now with Up to 30-Day Credit Terms',
      subtitleAr: 'قارن عروض الموردين المعتمدين واختر أفضل هامش ربح لمتجرك في بغداد.',
      subtitleEn: 'Compare verified suppliers and maximize store profit margins.',
      ctaAr: 'موردو بغداد',
      ctaEn: 'View Suppliers',
      bgImage: '/assets/images/banner_dalil_hero.jpg',
      productsSide: 'right' as const,
      gradient: 'from-[#0F172A] via-[#0F3D24] to-[#007B33]',
      scrimClass: 'bg-gradient-to-r from-[#091520]/95 via-[#0F3D24]/75 to-transparent',
      ctaAction: () => scrollToSection('nearest-suppliers-section')
    }
  ];

  // Auto-advance hero banner gently unless hovered/interacted or reduced-motion preferred
  useEffect(() => {
    if (isHeroPaused) return;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const timer = window.setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [isHeroPaused, heroSlides.length]);

  // All 9 Main Wholesale Categories (clean white tiles with cutout visuals)
  const allCategoryTiles = [
    {
      key: 'قهوة ومشروبات ساخنة',
      labelAr: 'قهوة ومشروبات ساخنة',
      labelEn: 'Coffee & Hot Drinks',
      img: '/assets/images/white_espresso_coffee.jpg'
    },
    {
      key: 'أرز وحبوب',
      labelAr: 'أرز وحبوب',
      labelEn: 'Rice & Grains',
      img: '/assets/images/white_basmati_rice.jpg'
    },
    {
      key: 'زيوت وسمن',
      labelAr: 'زيوت وسمن',
      labelEn: 'Oils & Ghee',
      img: '/assets/images/white_sunflower_oil.jpg'
    },
    {
      key: 'ألبان وأجبان',
      labelAr: 'ألبان وأجبان',
      labelEn: 'Dairy & Cheese',
      img: '/assets/images/white_milk_powder.jpg'
    },
    {
      key: 'معلبات ومخللات',
      labelAr: 'معلبات ومخللات',
      labelEn: 'Canned & Pickles',
      img: '/assets/images/white_tomato_paste.jpg'
    },
    {
      key: 'سكر ومحليات',
      labelAr: 'سكر ومحليات',
      labelEn: 'Sugar & Sweeteners',
      img: '/assets/images/white_sugar_pack.jpg'
    },
    {
      key: 'مشروبات وشاي',
      labelAr: 'مشروبات وشاي',
      labelEn: 'Tea & Beverages',
      img: '/assets/images/white_ceylon_tea.jpg'
    },
    {
      key: 'مكرونة وشعرية',
      labelAr: 'مكرونة وشعرية',
      labelEn: 'Pasta & Noodles',
      img: '/assets/images/white_pasta_pack.jpg'
    },
    {
      key: 'منظفات وعناية',
      labelAr: 'منظفات وعناية',
      labelEn: 'Cleaning & Care',
      img: '/assets/images/white_cleaner_bottles.jpg'
    }
  ];

  // Clean Flink-inspired White-Background Horizontal Shelf Card
  const renderShelfProductCard = (product: ProductWithOffers) => {
    const displayName =
      !isAr && product.nameEn
        ? product.nameEn
        : getLocalizedText(product.nameAr, language);
    const displayUnit = getLocalizedText(product.unit, language);
    const isAdded = Boolean(addedBarcodes[product.barcode]);
    const discountPercent =
      product.discountPercent ||
      (product.oldPrice && product.oldPrice > product.minPrice
        ? Math.round(((product.oldPrice - product.minPrice) / product.oldPrice) * 100)
        : null);
    const oldPrice =
      product.oldPrice ||
      (discountPercent && discountPercent > 0
        ? Math.round(product.minPrice * (1 + discountPercent / 100))
        : null);
    const hasDiscount = Boolean(discountPercent && discountPercent > 0);
    const isExpress = product.fastestDeliveryDays <= 1;

    return (
      <div
        key={product.barcode}
        onClick={() => onCompareOffers(product)}
        className="w-[148px] sm:w-[168px] shrink-0 snap-start rounded-2xl bg-white border border-[#EAECEF] p-2.5 flex flex-col justify-between shadow-[0_2px_8px_rgba(15,23,42,0.03)] hover:-translate-y-0.5 hover:border-[#00A046]/60 hover:shadow-[0_10px_22px_-8px_rgba(0,160,70,0.18)] transition-all duration-200 cursor-pointer group"
      >
        {/* Pure White Product Image Stage */}
        <div className="relative aspect-square w-full rounded-xl bg-white p-1.5 mb-2 flex items-center justify-center overflow-hidden">
          <img
            src={product.imageUrl}
            alt={displayName}
            referrerPolicy="no-referrer"
            className="h-full w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />

          {/* At most ONE subtle corner indicator */}
          {hasDiscount ? (
            <span className="absolute top-1 start-1 bg-[#FACC15] text-[#111827] text-[10px] font-black px-1.5 py-0.5 rounded-md tabular-nums">
              -{discountPercent}%
            </span>
          ) : isExpress ? (
            <span
              className="absolute top-1 end-1 w-6 h-6 rounded-full bg-[#EFFAF3] border border-[#BBF7D0] text-[#00A046] flex items-center justify-center"
              title={isAr ? 'توصيل خلال 24 ساعة' : '< 24h Delivery'}
            >
              <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
          ) : null}

          {/* Circular Quick-Add '+' Button */}
          <button
            type="button"
            onClick={(e) => handleQuickAdd(e, product)}
            aria-label={isAr ? 'أضف للسلة' : 'Add to cart'}
            className={`absolute bottom-1 start-1 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer active:scale-90 ${
              isAdded
                ? 'bg-[#0F3D24] text-white'
                : 'bg-[#00A046] hover:bg-[#008A3C] text-white'
            }`}
          >
            {isAdded ? (
              <Check className="w-4 h-4 stroke-[2.75]" />
            ) : (
              <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
            )}
          </button>
        </div>

        {/* Price, Title & Clean Unboxed Unit Metadata */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap mb-1">
              <span
                className={`text-[13.5px] sm:text-[14.5px] font-black font-mono tabular-nums leading-none ${
                  hasDiscount ? 'text-[#008A3C]' : 'text-[#111827]'
                }`}
              >
                {formatCurrency(product.minPrice, currency, language)}
              </span>
              {oldPrice && (
                <span className="text-[10px] text-[#9CA3AF] line-through font-mono tabular-nums leading-none">
                  {formatCurrency(oldPrice, currency, language)}
                </span>
              )}
            </div>

            <div className="mb-1">
              <span className="inline-block bg-[#0F3D24] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm">
                {isAr ? 'أفضل سعر جملة' : 'Best price'}
              </span>
            </div>

            <h3
              className="text-[11.5px] sm:text-xs font-bold text-[#111827] line-clamp-2 leading-snug min-h-[32px] mb-1 group-hover:text-[#00A046] transition-colors"
              title={displayName}
            >
              {displayName}
            </h3>
          </div>

          <div className="text-[10px] text-[#6B7280] font-medium truncate pt-0.5 tabular-nums">
            {displayUnit} · {isAr ? `${product.suppliersCount} موردين` : `${product.suppliersCount} offers`}
          </div>
        </div>
      </div>
    );
  };

  const hasActiveSearch = Boolean(searchQuery && searchQuery.trim().length > 0);
  const activeHero = heroSlides[heroSlide] || heroSlides[0];

  return (
    <div className="space-y-5 font-brand pb-6">
      {/* ================= 1. COMPACT ADDRESS SELECTOR + INLINE SEARCH & BARCODE BAR ================= */}
      <div className="bg-white rounded-2xl border border-[#EAECEF] px-3 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
        <button
          type="button"
          onClick={() => setIsLocationModalOpen(true)}
          className="flex items-center gap-2 min-w-0 text-start group cursor-pointer"
        >
          <span className="w-8 h-8 rounded-full bg-[#EFFAF3] border border-[#BBF7D0] flex items-center justify-center shrink-0 text-[#00A046]">
            <MapPin className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] text-[#6B7280] font-semibold leading-none mb-0.5">
              {isAr ? 'التوصيل لمتجرك في:' : 'Delivering to your store:'}
            </div>
            <div className="flex items-center gap-1 text-xs sm:text-sm font-black text-[#111827] group-hover:text-[#00A046] transition-colors truncate">
              <span className="truncate">
                {isAr ? currentDistrict.nameAr : currentDistrict.nameEn}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
            </div>
          </div>
        </button>

        {/* Mobile/Inline Quick Search + Barcode Scan Trigger */}
        <div className="flex items-center gap-2 flex-1 sm:max-w-xs md:max-w-[260px]">
          {onSearchChange && (
            <div className="relative flex-1 md:hidden">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={isAr ? 'ابحث عن منتج أو علامة...' : 'Search products or brands...'}
                className={`w-full h-9 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] text-xs text-[#111827] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00A046] ${
                  isAr ? 'pr-8 pl-7' : 'pl-8 pr-7'
                }`}
              />
              <Search
                className={`w-3.5 h-3.5 text-[#6B7280] absolute top-1/2 -translate-y-1/2 ${
                  isAr ? 'right-2.5' : 'left-2.5'
                }`}
              />
              {hasActiveSearch && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                  className={`absolute top-1/2 -translate-y-1/2 ${
                    isAr ? 'left-2' : 'right-2'
                  } text-[#6B7280] hover:text-[#111827] cursor-pointer`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {onOpenBarcodeScanner && (
            <button
              type="button"
              onClick={onOpenBarcodeScanner}
              className="h-9 px-3 rounded-xl bg-[#EFFAF3] hover:bg-[#00A046] text-[#008A3C] hover:text-white border border-[#BBF7D0] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ms-auto"
              title={isAr ? 'ماسح الباركود الذكي' : 'Smart Barcode Scanner'}
            >
              <ScanBarcode className="w-4 h-4" />
              <span className="whitespace-nowrap">{isAr ? 'مسح الباركود' : 'Scan GTIN'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= SEARCH RESULTS PANEL (When Search Query Active) ================= */}
      {hasActiveSearch && (
        <div className="bg-white rounded-2xl border border-[#EAECEF] p-3.5 sm:p-4 space-y-3 shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#111827]">
                {isAr
                  ? `نتائج البحث عن "${searchQuery}" (${products.length} منتج)`
                  : `Search results for "${searchQuery}" (${products.length})`}
              </h2>
              <p className="text-[11px] text-[#6B7280]">
                {isAr
                  ? 'منتجات متطابقة بخلفيات بيضاء ومقارنة فورية للموردين'
                  : 'Matching wholesale products'}
              </p>
            </div>
            {onResetGlobalFilters && (
              <button
                type="button"
                onClick={onResetGlobalFilters}
                className="px-3 py-1.5 rounded-xl bg-[#00A046] hover:bg-[#008A3C] text-white text-xs font-bold transition cursor-pointer shrink-0 whitespace-nowrap"
              >
                {isAr ? 'عرض كل المتجر' : 'Show Full Store'}
              </button>
            )}
          </div>

          {products.length === 0 ? (
            <div className="py-8 text-center space-y-2.5 bg-[#F8FAFC] rounded-xl border border-[#EAECEF]">
              <p className="text-sm font-bold text-[#111827]">
                {isAr ? 'لم يتم العثور على منتجات مطابقة للبحث' : 'No matching products found'}
              </p>
              <p className="text-xs text-[#6B7280]">
                {isAr
                  ? 'جرّب البحث باسم مختلف مثل "قهوة"، "أرز"، "زيت" أو أعد عرض المتجر بالكامل.'
                  : 'Try another keyword or reset search to browse all categories.'}
              </p>
              {onResetGlobalFilters && (
                <button
                  type="button"
                  onClick={onResetGlobalFilters}
                  className="px-4 py-1.5 rounded-xl bg-[#00A046] hover:bg-[#008A3C] text-white text-xs font-bold transition cursor-pointer"
                >
                  {isAr ? 'إعادة عرض جميع المنتجات' : 'Reset Search'}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {products.map((product) => {
                const alertForItem = lowStockAlerts.find((a) => a.barcode === product.barcode);
                return (
                  <ProductCard
                    key={product.barcode}
                    product={product}
                    currency={currency}
                    language={language}
                    onCompareOffers={onCompareOffers}
                    onQuickAddBestOffer={(p) => {
                      if (p.offers[0]) {
                        onAddToCart(p, p.offers[0], p.offers[0].minOrderQuantity || 1);
                      }
                    }}
                    storeStockStatus={
                      alertForItem
                        ? {
                            isLow: true,
                            isCritical: alertForItem.urgency === 'critical',
                            remaining: alertForItem.currentStock,
                            unit: alertForItem.unit
                          }
                        : undefined
                    }
                    isFavorite={wishlistBarcodes.includes(product.barcode)}
                    onToggleFavorite={onToggleWishlist}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= 2. TOP CIRCULAR STORY HIGHLIGHTS ROW ================= */}
      <div className="flex items-start gap-3 sm:gap-5 overflow-x-auto no-scrollbar py-1 px-0.5">
        {storyHighlights.map((story) => (
          <button
            key={story.id}
            type="button"
            onClick={story.action}
            className="flex flex-col items-center gap-1.5 shrink-0 w-[70px] sm:w-[82px] group cursor-pointer text-center"
          >
            <div
              className={`w-15 h-15 sm:w-18 sm:h-18 rounded-full p-1 bg-white ring-2 ${story.ringClass} ring-offset-2 ring-offset-[#F5F5F5] overflow-hidden shadow-2xs group-hover:scale-105 transition-transform duration-200`}
            >
              <img
                src={story.img}
                alt={isAr ? story.labelAr : story.labelEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain mix-blend-multiply rounded-full"
              />
            </div>
            <span className="text-[11px] font-bold text-[#111827] group-hover:text-[#00A046] leading-tight line-clamp-2">
              {isAr ? story.labelAr : story.labelEn}
            </span>
          </button>
        ))}
      </div>

      {/* ================= 3. HERO PROMOTIONAL BANNER CAROUSEL ================= */}
      <div
        className="space-y-2.5"
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={() => setIsHeroPaused(false)}
        onTouchStart={(e) => {
          setIsHeroPaused(true);
          touchStartXRef.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const startX = touchStartXRef.current;
          const endX = e.changedTouches[0]?.clientX;
          if (startX !== null && endX !== undefined && Math.abs(endX - startX) > 40) {
            if (endX < startX) {
              setHeroSlide((prev) => (prev + 1) % heroSlides.length);
            } else {
              setHeroSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
            }
          }
          touchStartXRef.current = null;
        }}
      >
        <div
          dir="ltr"
          className={`relative rounded-3xl overflow-hidden bg-gradient-to-r ${activeHero.gradient} text-white shadow-sm min-h-[188px] sm:min-h-[224px] lg:min-h-[250px] flex items-center ${
            activeHero.productsSide === 'right' ? 'justify-start' : 'justify-end'
          }`}
        >
          {/* Background Product Composition Image */}
          <img
            src={activeHero.bgImage}
            alt={isAr ? activeHero.titleAr : activeHero.titleEn}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Contrast scrim anchored strictly behind text side so products stay vivid */}
          <div className={`absolute inset-0 ${activeHero.scrimClass}`} />

          {/* Banner Copy & Primary CTA sitting on negative space side */}
          <div
            dir={isAr ? 'rtl' : 'ltr'}
            className="relative z-10 p-5 sm:p-8 lg:p-10 max-w-md lg:max-w-lg space-y-2.5 text-start"
          >
            <span className="inline-block bg-[#FFE600] text-[#111827] text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-md shadow-2xs">
              {isAr ? activeHero.badgeAr : activeHero.badgeEn}
            </span>

            <h2 className="text-lg sm:text-2xl lg:text-[28px] font-black leading-snug tracking-tight text-balance">
              {isAr ? activeHero.titleAr : activeHero.titleEn}
            </h2>

            <p className="text-[11px] sm:text-xs lg:text-sm text-white/90 font-medium leading-relaxed line-clamp-2">
              {isAr ? activeHero.subtitleAr : activeHero.subtitleEn}
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={activeHero.ctaAction}
                className="px-4 py-2 rounded-xl bg-white hover:bg-[#EFFAF3] text-[#0F3D24] text-xs font-black shadow-sm transition cursor-pointer whitespace-nowrap"
              >
                {isAr ? activeHero.ctaAr : activeHero.ctaEn}
              </button>
            </div>
          </div>

          {/* Side Carousel Controls on Desktop */}
          <button
            type="button"
            onClick={() =>
              setHeroSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
            }
            aria-label={isAr ? 'البانر السابق' : 'Previous banner'}
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#0F3D24] items-center justify-center shadow-sm transition cursor-pointer z-10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setHeroSlide((prev) => (prev + 1) % heroSlides.length)}
            aria-label={isAr ? 'البانر التالي' : 'Next banner'}
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#0F3D24] items-center justify-center shadow-sm transition cursor-pointer z-10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-1.5">
          {heroSlides.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setHeroSlide(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                heroSlide === idx ? 'w-5 bg-[#00A046]' : 'w-1.5 bg-[#D1D5DB] hover:bg-[#9CA3AF]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ================= 4. TOP PICKS FOR YOUR STORE (Diversified White-BG Slider) ================= */}
      <section id="shelf-top-picks" className="space-y-2.5">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <h2 className="text-base sm:text-lg font-black text-[#111827]">
            {isAr ? 'الأكثر طلباً لمتجرك' : 'Top picks for your store'}
          </h2>
          <button
            type="button"
            onClick={() => scrollToSection('all-categories-grid')}
            className="text-xs font-bold text-[#00A046] hover:underline flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
          >
            <span>{isAr ? 'جميع الأقسام' : 'All categories'}</span>
            {isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>

        <HorizontalScrollRow isAr={isAr} className="pb-1">
          {topPicksProducts.map(renderShelfProductCard)}
        </HorizontalScrollRow>
      </section>

      {/* ================= 5. WHOLESALE SAVER DEALS CONTAINER (Gold Card + Nested Slider) ================= */}
      {saverDealProducts.length > 0 && (
        <section
          id="shelf-saver-deals"
          className="rounded-3xl bg-gradient-to-br from-[#FEF3C7] via-[#FDE68A]/70 to-[#FCD34D]/50 border border-amber-200/80 p-3.5 sm:p-5 space-y-3.5 shadow-[0_1px_4px_rgba(15,23,42,0.03)]"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1 max-w-md">
              <h2 className="text-base sm:text-lg font-black text-[#111827] leading-snug">
                {isAr ? 'عروض التوفير وتصفيات الجملة' : 'Save on Wholesale Deals'}
              </h2>
              <p className="text-[11px] sm:text-xs text-[#78350F] font-medium">
                {isAr
                  ? 'تحديث يومي لأسعار الكرتون المباشرة بأفضل هامش ربح للتجار'
                  : 'Daily carton markdowns with maximum retail profit margin'}
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => navigateToCategory('زيوت وسمن')}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FFFBEB] text-[#111827] text-xs font-black shadow-2xs transition cursor-pointer whitespace-nowrap"
                >
                  {isAr ? 'عرض الكل' : 'See all'}
                </button>
              </div>
            </div>

            <div className="w-22 h-22 sm:w-28 sm:h-28 rounded-2xl bg-white p-2 shadow-2xs shrink-0 flex items-center justify-center">
              <img
                src="/assets/images/white_sunflower_oil.jpg"
                alt={isAr ? 'عروض التوفير' : 'Wholesale Deals'}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </div>
          </div>

          <HorizontalScrollRow isAr={isAr} className="pb-0.5">
            {saverDealProducts.map(renderShelfProductCard)}
          </HorizontalScrollRow>
        </section>
      )}

      {/* ================= 6. FEATURED BRAND CAMPAIGN (Emerald Showcase + Coffee Slider) ================= */}
      {coffeeProducts.length > 0 && (
        <section className="rounded-3xl bg-[#ECFDF5] border border-[#BBF7D0] overflow-hidden shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
          <div className="relative h-32 sm:h-40 w-full overflow-hidden">
            <img
              src="/assets/images/banner_dalil_deals.jpg"
              alt={isAr ? 'القهوة الإيطالية والعالمية بالجملة' : 'Coffee & Espresso Campaign'}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
            <div className="absolute inset-x-4 bottom-3.5 flex items-end justify-between gap-2">
              <div className="text-white">
                <span className="text-[10px] font-black text-[#FFE600] block">
                  {isAr ? 'مهرجان العلامات العالمية' : 'Featured Wholesale Brands'}
                </span>
                <h2 className="text-base sm:text-lg font-black leading-tight">
                  {isAr ? 'القهوة الإيطالية والعالمية بالجملة' : 'Premium Coffee & Espresso Deals'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigateToCategory('قهوة ومشروبات ساخنة')}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#EFFAF3] text-[#0F3D24] text-xs font-black shadow-sm transition cursor-pointer shrink-0 whitespace-nowrap"
              >
                {isAr ? 'عرض الكل' : 'See all'}
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            <HorizontalScrollRow isAr={isAr}>
              {coffeeProducts.map(renderShelfProductCard)}
            </HorizontalScrollRow>
          </div>
        </section>
      )}

      {/* ================= 7. DEPARTMENT SPOTLIGHT + SLIDER ROWS ================= */}
      {/* Row A: Pantry & Rice Spotlight + Slider */}
      {pantryStapleProducts.length > 0 && (
        <HorizontalScrollRow isAr={isAr} className="pb-1">
          <button
            type="button"
            onClick={() => navigateToCategory('أرز وحبوب')}
            className="w-[148px] sm:w-[168px] shrink-0 snap-start rounded-2xl bg-[#EFFAF3] border border-[#BBF7D0] p-3 flex flex-col justify-between text-start hover:border-[#00A046] transition cursor-pointer group"
          >
            <div>
              <h3 className="text-sm font-black text-[#0F3D24] leading-snug group-hover:text-[#00A046] transition-colors">
                {isAr ? 'أرز وحبوب وتموين' : 'Rice, Oils & Pantry'}
              </h3>
              <span className="text-[10.5px] font-bold text-[#008A3C] mt-1 inline-flex items-center gap-0.5">
                <span>{isAr ? 'فتح القسم' : 'Open aisle'}</span>
                {isAr ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </span>
            </div>
            <div className="aspect-square w-full rounded-xl bg-white p-2 mt-2 flex items-center justify-center">
              <img
                src="/assets/images/white_basmati_rice.jpg"
                alt={isAr ? 'أرز وحبوب' : 'Rice & Grains'}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
              />
            </div>
          </button>

          {pantryStapleProducts.map(renderShelfProductCard)}
        </HorizontalScrollRow>
      )}

      {/* Row B: Tea & Beverages Spotlight + Slider */}
      {teaAndBeverageProducts.length > 0 && (
        <HorizontalScrollRow isAr={isAr} className="pb-1">
          <button
            type="button"
            onClick={() => navigateToCategory('مشروبات وشاي')}
            className="w-[148px] sm:w-[168px] shrink-0 snap-start rounded-2xl bg-[#EBF5FF] border border-sky-200/80 p-3 flex flex-col justify-between text-start hover:border-sky-400 transition cursor-pointer group"
          >
            <div>
              <h3 className="text-sm font-black text-[#0F172A] leading-snug group-hover:text-[#00A046] transition-colors">
                {isAr ? 'شاي ومشروبات السوبرماركت' : 'Tea & Refreshments'}
              </h3>
              <span className="text-[10.5px] font-bold text-[#0284C7] mt-1 inline-flex items-center gap-0.5">
                <span>{isAr ? 'فتح القسم' : 'Open aisle'}</span>
                {isAr ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </span>
            </div>
            <div className="aspect-square w-full rounded-xl bg-white p-2 mt-2 flex items-center justify-center">
              <img
                src="/assets/images/white_ceylon_tea.jpg"
                alt={isAr ? 'شاي ومشروبات' : 'Tea & Drinks'}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
              />
            </div>
          </button>

          {teaAndBeverageProducts.map(renderShelfProductCard)}
        </HorizontalScrollRow>
      )}

      {/* ================= 8. SOFT ROSE SPOTLIGHT CONTAINER (Dairy & Canned Favorites) ================= */}
      {dairyAndCannedProducts.length > 0 && (
        <section className="rounded-3xl bg-[#FFF1F2] border border-[#FFE4E6] p-3.5 sm:p-5 space-y-3 shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg font-black text-[#111827]">
              {isAr ? 'مختارات الألبان والمعلبات' : 'Dairy & Canned Favorites'}
            </h2>
            <button
              type="button"
              onClick={() => navigateToCategory('ألبان وأجبان')}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-[#111827] text-xs font-black shadow-2xs transition cursor-pointer shrink-0 whitespace-nowrap"
            >
              {isAr ? 'عرض الكل' : 'See all'}
            </button>
          </div>

          <HorizontalScrollRow isAr={isAr} className="pb-0.5">
            {dairyAndCannedProducts.map(renderShelfProductCard)}
          </HorizontalScrollRow>
        </section>
      )}

      {/* ================= 9. CLEANING & CARE SHELF ================= */}
      {cleaningProducts.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between gap-2 px-0.5">
            <h2 className="text-base sm:text-lg font-black text-[#111827]">
              {isAr ? 'منظفات وعناية يومية' : 'Home Cleaning & Care'}
            </h2>
            <button
              type="button"
              onClick={() => navigateToCategory('منظفات وعناية')}
              className="text-xs font-bold text-[#00A046] hover:underline flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
            >
              <span>{isAr ? 'عرض الكل' : 'See all'}</span>
              {isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
          <HorizontalScrollRow isAr={isAr} className="pb-1">
            {cleaningProducts.map(renderShelfProductCard)}
          </HorizontalScrollRow>
        </section>
      )}

      {/* ================= 10. NEAREST VERIFIED WHOLESALE SUPPLIERS SLIDER ================= */}
      <section
        id="nearest-suppliers-section"
        className="bg-white rounded-3xl border border-[#EAECEF] p-3.5 sm:p-5 shadow-[0_1px_4px_rgba(15,23,42,0.03)] space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-4.5 h-4.5 text-[#00A046] shrink-0" />
            <h2 className="font-black text-sm sm:text-base text-[#111827] truncate">
              {isAr ? 'شركات وموردو الجملة الأقرب لموقعك' : 'Nearest Wholesale Suppliers'}
            </h2>
          </div>
          <span className="text-xs font-bold text-[#008A3C] shrink-0 tabular-nums">
            {dynamicSuppliers.length} {isAr ? 'موردين معتمدين' : 'Verified'}
          </span>
        </div>

        <HorizontalScrollRow isAr={isAr} className="py-0.5">
          {dynamicSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              onClick={() => onOpenSupplierStore?.(supplier)}
              className="w-[210px] sm:w-[238px] shrink-0 snap-start rounded-2xl border border-[#EAECEF] bg-white hover:border-[#00A046]/60 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between cursor-pointer group"
            >
              <div className="relative h-24 w-full bg-slate-900 overflow-hidden">
                <img
                  src={supplier.storeImageUrl || supplier.logoUrl}
                  alt={isAr ? supplier.nameAr : supplier.nameEn}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                <div className="absolute top-2 inset-x-2 flex items-center justify-between gap-1">
                  <span className="bg-white/95 text-[#00A046] font-black text-[10px] px-2 py-0.5 rounded-md shadow-2xs tabular-nums">
                    {supplier.distanceKm} {isAr ? 'كم' : 'km'}
                  </span>
                  {supplier.isExpress24h && (
                    <span className="flex items-center gap-0.5 bg-[#FFE600] text-[#111827] font-black text-[9px] px-1.5 py-0.5 rounded-md">
                      <Zap className="w-2.5 h-2.5 fill-current" />
                      <span>{isAr ? '< 24س' : '< 24h'}</span>
                    </span>
                  )}
                </div>
                {supplier.isVerified && (
                  <div className="absolute bottom-2 start-2 flex items-center gap-0.5 bg-[#00A046] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>{isAr ? 'معتمد' : 'Verified'}</span>
                  </div>
                )}
              </div>

              <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-start justify-between gap-1 mb-0.5">
                    <h3 className="font-black text-xs text-[#111827] group-hover:text-[#00A046] line-clamp-1">
                      {isAr ? supplier.nameAr : supplier.nameEn}
                    </h3>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#111827] shrink-0 tabular-nums">
                      <Star className="w-2.5 h-2.5 fill-[#FFA800] text-[#FFA800]" />
                      {supplier.rating}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#6B7280] line-clamp-1">
                    <Truck className="w-3 h-3 text-[#00A046] shrink-0" />
                    <span className="truncate">
                      {isAr ? supplier.deliveryTimeAr : supplier.deliveryTimeEn}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenSupplierStore?.(supplier);
                  }}
                  className="w-full py-1.5 px-2 rounded-xl text-[11px] font-black bg-[#F7F8FA] border border-[#E5E7EB] text-[#111827] group-hover:bg-[#00A046] group-hover:text-white group-hover:border-transparent flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>{isAr ? 'دخول لصفحة المتجر' : 'Visit Storefront'}</span>
                </button>
              </div>
            </div>
          ))}
        </HorizontalScrollRow>
      </section>

      {/* ================= 11. ALL CATEGORIES CLEAN 3-COLUMN GRID (Symmetric 3x3 White Tiles) ================= */}
      <section id="all-categories-grid" className="space-y-3 pt-1">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <h2 className="text-base sm:text-lg font-black text-[#111827]">
            {isAr ? 'جميع الأقسام' : 'All categories'}
          </h2>
          <span className="text-xs text-[#6B7280] font-medium tabular-nums">
            {isAr ? '9 أقسام جملة رئيسية' : '9 wholesale departments'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
          {allCategoryTiles.map((tile) => {
            const count = categoryCounts[tile.key] || 0;
            return (
              <button
                key={tile.key}
                type="button"
                onClick={() => navigateToCategory(tile.key)}
                className="rounded-2xl bg-white border border-[#EAECEF] hover:border-[#00A046]/70 hover:shadow-sm p-2.5 sm:p-4 flex flex-col lg:flex-row items-center justify-between text-center lg:text-start gap-2 transition-all cursor-pointer group min-h-[124px] sm:min-h-[144px] lg:min-h-[112px]"
              >
                <div className="space-y-0.5 w-full lg:w-auto">
                  <span className="text-[11px] sm:text-xs lg:text-sm font-extrabold text-[#111827] group-hover:text-[#00A046] leading-tight line-clamp-2 block">
                    {isAr ? tile.labelAr : tile.labelEn}
                  </span>
                  {count > 0 && (
                    <span className="hidden sm:block text-[10px] text-[#6B7280] font-medium tabular-nums">
                      {isAr ? `${count} صنف` : `${count} items`}
                    </span>
                  )}
                </div>

                <div className="w-full lg:w-20 lg:h-20 flex-1 lg:flex-initial flex items-center justify-center p-1 bg-white shrink-0">
                  <img
                    src={tile.img}
                    alt={isAr ? tile.labelAr : tile.labelEn}
                    referrerPolicy="no-referrer"
                    className="max-h-16 sm:max-h-20 w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ================= 12. HOMEPAGE FEEDBACK FOOTER PROMPT ================= */}
      <section className="rounded-2xl bg-white border border-[#EAECEF] py-5 px-4 text-center space-y-2.5 shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
        <div className="space-y-0.5">
          <h3 className="text-sm font-black text-[#111827]">
            {isAr ? 'هل أعجبك تصميم الصفحة الرئيسية الجديد؟' : 'Do you like our new homepage?'}
          </h3>
          <p className="text-xs text-[#6B7280]">
            {isAr ? 'رأيك يساعدنا على تطوير تجربة التوريد لمتجرك' : 'Please let us know what you think'}
          </p>
        </div>

        {feedbackSent ? (
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00A046] bg-[#EFFAF3] px-4 py-1.5 rounded-xl">
            <Check className="w-3.5 h-3.5" />
            <span>
              {isAr ? 'شكراً لمشاركتنا رأيك!' : 'Thanks for your feedback!'}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setFeedbackSent('yes')}
              className="px-4 py-1.5 rounded-xl bg-[#EFFAF3] hover:bg-[#00A046] text-[#008A3C] hover:text-white border border-[#BBF7D0] text-xs font-bold transition cursor-pointer whitespace-nowrap"
            >
              {isAr ? 'ممتاز ومرتب 👍' : 'Love it 👍'}
            </button>
            <button
              type="button"
              onClick={() => setFeedbackSent('no')}
              className="px-4 py-1.5 rounded-xl bg-[#F8FAFC] hover:bg-gray-100 text-[#4B5563] border border-[#E5E7EB] text-xs font-bold transition cursor-pointer whitespace-nowrap"
            >
              {isAr ? 'إرسال ملاحظة' : 'Provide feedback'}
            </button>
          </div>
        )}
      </section>

      {/* Store Location Modal */}
      <StoreLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentDistrict={currentDistrict}
        onSelectDistrict={(dist) => setCurrentDistrict(dist)}
        language={language}
      />
    </div>
  );
};
