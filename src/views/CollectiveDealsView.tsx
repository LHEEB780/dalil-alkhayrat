import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ShoppingCart,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Tag,
  TrendingUp,
  Layers,
  Megaphone,
  Building2,
  Package,
  ShieldCheck,
  X,
  Plus,
  Minus,
  Film,
  Image as ImageIcon
} from 'lucide-react';
import {
  CartItem,
  CollectivePool,
  Currency,
  ProductWithOffers,
  SupplierOfferItem,
  Language
} from '../types/index.ts';
import { formatCurrency } from '../utils/format.ts';
import { getLocalizedText } from '../utils/translations.ts';
import { fetchWithRetry } from '../utils/fetchWithRetry.ts';
import {
  WHOLESALE_SUPPLIERS,
  WholesaleSupplier,
  resolveWholesaleSupplierByOffer
} from '../data/nearbySuppliers.ts';

import heroCampaignImg from '../assets/images/deals_hero_campaign_1794819183884.jpg';
import videoShowcaseImg from '../assets/images/deals_video_showcase_1794819184683.jpg';
import flashBundleImg from '../assets/images/deals_flash_bundle_1794819183929.jpg';

type DealSectionFilter =
  | 'sponsored'
  | 'video'
  | 'bundles'
  | 'collective'
  | 'clearance';

interface CollectiveDealsViewProps {
  currency: Currency;
  products: ProductWithOffers[];
  cartItems?: CartItem[];
  onOpenProductComparison: (product: ProductWithOffers) => void;
  onAddToCart?: (product: ProductWithOffers, offer: SupplierOfferItem, quantity: number) => void;
  onUpdateCartQuantity?: (offerId: string, quantity: number) => void;
  onOpenSupplierStore?: (supplier: WholesaleSupplier) => void;
  onBack?: () => void;
  language?: Language;
}

interface HeroCampaignSlide {
  id: string;
  sponsorLabelAr: string;
  sponsorLabelEn: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  offerHighlightAr: string;
  offerHighlightEn: string;
  imageUrl: string;
  supplierId: string;
  categoryFilter: string;
  targetSection: DealSectionFilter;
}

type VideoCategoryMode = 'products' | 'companies';

interface VideoSpotlightItem {
  id: string;
  videoKind: VideoCategoryMode;
  titleAr: string;
  titleEn: string;
  sponsorNameAr: string;
  sponsorNameEn: string;
  durationLabel: string;
  durationSeconds: number;
  placementTypeAr: string;
  placementTypeEn: string;
  summaryAr: string;
  summaryEn: string;
  posterUrl: string;
  supplierId: string;
  featuredCategories: string[];
  chapters: { time: number; labelAr: string; labelEn: string }[];
}

interface AdSlotPackage {
  id: string;
  nameAr: string;
  nameEn: string;
  placementAr: string;
  placementEn: string;
  weeklyPriceIQD: number;
  estimatedReachAr: string;
  estimatedReachEn: string;
  includesAr: string[];
  includesEn: string[];
}

const AD_PACKAGES: AdSlotPackage[] = [
  {
    id: 'hero_banner',
    nameAr: 'باقة البانر الرئيسي (Hero)',
    nameEn: 'Hero Banner Placement',
    placementAr: 'أول ظهور أعلى صفحة الصفقات',
    placementEn: 'Top-of-page flagship banner',
    weeklyPriceIQD: 185000,
    estimatedReachAr: '14,500+ ظهور أسبوعي للتجار',
    estimatedReachEn: '14,500+ weekly merchant impressions',
    includesAr: ['صورة أو تصميم إعلاني عريض', 'ربط مباشر بمتجر المورد أو العرض', 'تقرير نقرات أسبوعي'],
    includesEn: ['Wide promotional banner visual', 'Direct link to supplier storefront', 'Weekly click & conversion report']
  },
  {
    id: 'video_reel',
    nameAr: 'باقة الفيديو التفاعلي للمصنع',
    nameEn: 'Interactive Factory Video Reel',
    placementAr: 'مشغل الفيديو التفاعلي + منتجات قابلة للشراء',
    placementEn: 'Interactive video player + shoppable SKUs',
    weeklyPriceIQD: 260000,
    estimatedReachAr: 'معدل تفاعل وشراء أعلى بـ 3.4 أضعاف',
    estimatedReachEn: '3.4x higher cart conversion rate',
    includesAr: ['عرض فيديو خط الإنتاج والمخازن', 'شريط منتجات مرتبط مباشرة بالعربة', 'أولوية في قسم الحملات الممولة'],
    includesEn: ['Factory & warehouse video showcase', 'Direct add-to-cart product strip', 'Priority sponsored placement']
  },
  {
    id: 'pallet_spotlight',
    nameAr: 'باقة تمييز الطبالي والكتالوج',
    nameEn: 'Sponsored Pallet & Bundle Slot',
    placementAr: 'قسم الباقات والطبالي الممولة',
    placementEn: 'Featured bundles & pallet showcase',
    weeklyPriceIQD: 125000,
    estimatedReachAr: 'ظهور مستهدف لمشتري الجملة والأسواق',
    estimatedReachEn: 'Targeted reach for supermarket & HoReCa buyers',
    includesAr: ['بطاقة باقة توريد مجمعة', 'إظهار نسبة التوفير الفوري', 'زر إضافة فورية لعربة الجملة'],
    includesEn: ['Curated multi-SKU pallet card', 'Highlighted bulk savings rate', '1-click add bundle to cart']
  }
];

export const CollectiveDealsView: React.FC<CollectiveDealsViewProps> = ({
  currency,
  products,
  cartItems = [],
  onOpenProductComparison,
  onAddToCart,
  onUpdateCartQuantity,
  onOpenSupplierStore,
  onBack,
  language = 'ar'
}) => {
  const isAr = language === 'ar';

  const [pools, setPools] = useState<CollectivePool[]>([]);
  const [pledgeQuantities, setPledgeQuantities] = useState<Record<string, number>>({});
  const [pledgedSuccessPoolId, setPledgedSuccessPoolId] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<DealSectionFilter>('sponsored');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [heroIndex, setHeroIndex] = useState<number>(0);

  // Video reel interactive player state (Products vs Companies icon tabs)
  const [videoCategoryMode, setVideoCategoryMode] = useState<VideoCategoryMode>('products');
  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);
  const [isMutedVideo, setIsMutedVideo] = useState<boolean>(true);
  const [videoProgressSec, setVideoProgressSec] = useState<number>(8);

  // Feedback toast / confirmation states
  const [addedBundleId, setAddedBundleId] = useState<string | null>(null);
  const [addedProductKey, setAddedProductKey] = useState<string | null>(null);
  const [videoProductQuantities, setVideoProductQuantities] = useState<Record<string, number>>({});
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Ad Space Booking Modal State (Platform Monetization Portal)
  const [isAdModalOpen, setIsAdModalOpen] = useState<boolean>(false);
  const [selectedAdPkgId, setSelectedAdPkgId] = useState<string>('video_reel');
  const [adDurationWeeks, setAdDurationWeeks] = useState<number>(2);
  const [adCompanyName, setAdCompanyName] = useState<string>('');
  const [adPhone, setAdPhone] = useState<string>('');
  const [adCampaignTitle, setAdCampaignTitle] = useState<string>('');
  const [adBookingConfirmation, setAdBookingConfirmation] = useState<{
    ref: string;
    packageName: string;
    totalIQD: number;
  } | null>(null);

  const loadPools = async (signal?: AbortSignal) => {
    try {
      const res = await fetchWithRetry('/api/collective-pools', { signal, retries: 2 });
      if (!res.ok) return;
      const data = await res.json();
      if (!signal?.aborted && data.success) {
        setPools(data.data);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || signal?.aborted) return;
      console.warn('Could not load collective pools:', err?.message || err);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadPools(controller.signal);
    return () => controller.abort();
  }, []);

  const heroCampaigns: HeroCampaignSlide[] = useMemo(
    () => [
      {
        id: 'camp_rafidain',
        sponsorLabelAr: 'حملة ممولة · شركة الرافدين للتجارة العامة والأغذية',
        sponsorLabelEn: 'Sponsored Campaign · Al-Rafidain Food Trading Co.',
        titleAr: 'موسم التموين الذكي: خصم مصنع حتى 18% على الحبوب والزيوت',
        titleEn: 'Smart Wholesale Week: Up to 18% Factory Discount on Grains & Oils',
        subtitleAr:
          'عروض حصرية لأصحاب السوبرماركت والمطاعم — تثبيت السعر مع توصيل مجاني بفانات مبردة لجميع مناطق بغداد.',
        subtitleEn:
          'Exclusive B2B campaign for supermarkets and restaurants — price-locked bulk stock with free chilled van delivery.',
        offerHighlightAr: 'خصم إضافي 3% للسداد النقدي',
        offerHighlightEn: 'Extra 3% off cash orders',
        imageUrl: heroCampaignImg,
        supplierId: 'supp_rafidain',
        categoryFilter: 'أرز وحبوب',
        targetSection: 'bundles'
      },
      {
        id: 'camp_tigris',
        sponsorLabelAr: 'شريك التوريد المميز · شركة دجلة والفرات للتوزيع السريع',
        sponsorLabelEn: 'Featured Partner · Tigris & Euphrates Distribution',
        titleAr: 'صفقات الألبان والمعلبات عالية الدوران — شحن خلال 45 دقيقة',
        titleEn: 'Fast-Moving Dairy & Canned Deals — Express 45-Min Dispatch',
        subtitleAr:
          'اضمن توفر الأصناف الأكثر طلباً على رفوف محلك مع باقات توريد جاهزة وائتمان تجاري حتى 21 يوماً.',
        subtitleEn:
          'Keep top-velocity shelf items stocked with ready pallet bundles and 21-day verified merchant credit terms.',
        offerHighlightAr: 'توصيل فوري مجاني للطلبيات فوق 100 ألف',
        offerHighlightEn: 'Free express dispatch over 100k IQD',
        imageUrl: '/assets/images/banner_dalil_deals.jpg',
        supplierId: 'supp_tigris',
        categoryFilter: 'ألبان وأجبان',
        targetSection: 'clearance'
      },
      {
        id: 'camp_nahrain',
        sponsorLabelAr: 'عرض الوكالات الحصرية · شركة النهرين للبن والشاي',
        sponsorLabelEn: 'Exclusive Agency Offer · Al-Nahrain Tea & Coffee',
        titleAr: 'تشكيلة القهوة المختصة والشاي السيلاني بأسعار الموزع الأول',
        titleEn: 'Specialty Coffee & Ceylon Tea at Tier-1 Importer Pricing',
        subtitleAr:
          'جولة فيديو حصرية من خطوط التعبئة والتحميص مع خصومات الشراء الجماعي للمقاهي والأسواق.',
        subtitleEn:
          'Exclusive factory packaging reel with group-buy pricing tailored for cafes and retail markets.',
        offerHighlightAr: 'توفير 14% عند الحجز الجماعي',
        offerHighlightEn: 'Save 14% via collective pool',
        imageUrl: '/assets/images/banner_dalil_hero.jpg',
        supplierId: 'supp_nahrain',
        categoryFilter: 'قهوة ومشروبات ساخنة',
        targetSection: 'video'
      }
    ],
    []
  );

  const allVideoSpotlights: VideoSpotlightItem[] = useMemo(
    () => [
      // Product Showcase Videos (فيديو منتجات)
      {
        id: 'vid_prod_oil',
        videoKind: 'products',
        titleAr: 'فيديو عرض المنتج: زيت دوار الشمس عافية بالكرتون (12 لتر)',
        titleEn: 'Product Reel: Afia Pure Sunflower Oil Wholesale Carton',
        sponsorNameAr: 'عرض منتج ممول · زيوت وسمن',
        sponsorNameEn: 'Sponsored Product · Cooking Oils',
        durationLabel: '00:35',
        durationSeconds: 35,
        placementTypeAr: 'فيديو منتج · إضافة مباشرة للسلة',
        placementTypeEn: 'Product Video · Direct Cart',
        summaryAr:
          'استعراض مواصفات التعبئة والتغليف الحراري وتاريخ الصلاحية الطويل مع سعر الجملة الحصري.',
        summaryEn:
          'See packaging durability, long shelf-life batch details, and exclusive carton wholesale pricing.',
        posterUrl: flashBundleImg,
        supplierId: 'supp_babylon',
        featuredCategories: ['زيوت وسمن', 'معلبات ومخللات'],
        chapters: [
          { time: 0, labelAr: 'شكل العبوة والكرتون', labelEn: 'Pack Overview' },
          { time: 12, labelAr: 'مميزات البيع بالمحل', labelEn: 'Shelf Appeal' },
          { time: 24, labelAr: 'عرض السعر والكميات', labelEn: 'Bulk Pricing' }
        ]
      },
      {
        id: 'vid_prod_rice',
        videoKind: 'products',
        titleAr: 'فيديو عرض المنتج: أرز بسمتي هندي عنبر حبة طويلة (10 كغم)',
        titleEn: 'Product Reel: Premium Basmati Amber Rice (10kg Sacks)',
        sponsorNameAr: 'عرض منتج ممول · أرز وحبوب',
        sponsorNameEn: 'Sponsored Product · Rice & Grains',
        durationLabel: '00:40',
        durationSeconds: 40,
        placementTypeAr: 'فيديو منتج · الأكثر طلباً',
        placementTypeEn: 'Product Video · Top Seller',
        summaryAr:
          'معاينة جودة الحبة ونسبة التكسير الصفرية مع إمكانية إضافة الأكياس مباشرة إلى سلة الجملة.',
        summaryEn:
          'Inspect grain length, purity grading, and add bulk sacks directly to your wholesale cart.',
        posterUrl: heroCampaignImg,
        supplierId: 'supp_rafidain',
        featuredCategories: ['أرز وحبوب', 'سكر ومحليات'],
        chapters: [
          { time: 0, labelAr: 'معاينة نقاء الحبة', labelEn: 'Grain Purity' },
          { time: 14, labelAr: 'الأكياس والأوزان', labelEn: 'Sack Weights' },
          { time: 28, labelAr: 'سعر الجملة المباشر', labelEn: 'Direct Price' }
        ]
      },
      {
        id: 'vid_prod_coffee',
        videoKind: 'products',
        titleAr: 'فيديو عرض المنتج: القهوة المختصة والشاي السيلاني للمحلات والمقاهي',
        titleEn: 'Product Reel: Specialty Coffee & Ceylon Tea Packs',
        sponsorNameAr: 'عرض منتج ممول · قهوة ومشروبات',
        sponsorNameEn: 'Sponsored Product · Coffee & Tea',
        durationLabel: '00:38',
        durationSeconds: 38,
        placementTypeAr: 'فيديو منتج · هامش ربح مرتفع',
        placementTypeEn: 'Product Video · High Margin',
        summaryAr:
          'تشكيلة بن سريعة الدوران مع تغليف محكم يحفظ النكهة وجاهزية تامة للإضافة الفورية للسلة.',
        summaryEn:
          'Fast-turnover coffee and tea packs sealed for freshness and ready for instant cart addition.',
        posterUrl: '/assets/images/banner_dalil_hero.jpg',
        supplierId: 'supp_nahrain',
        featuredCategories: ['قهوة ومشروبات ساخنة', 'مشروبات وشاي'],
        chapters: [
          { time: 0, labelAr: 'التحميص والتغليف', labelEn: 'Roast & Seal' },
          { time: 13, labelAr: 'أوزان العرض بالرف', labelEn: 'Retail Sizing' },
          { time: 26, labelAr: 'اطلب الآن للسلة', labelEn: 'Order Now' }
        ]
      },

      // Company & Factory Tour Videos (فيديو شركات)
      {
        id: 'vid_factory_1',
        videoKind: 'companies',
        titleAr: 'جولة شركة بابل: خط التعبئة الآلي ومعايير الجودة المخبرية',
        titleEn: 'Babylon Co. Tour: Automated Bottling & Lab Quality Control',
        sponsorNameAr: 'مؤسسة بابل للزيوت والتموين الغذائي',
        sponsorNameEn: 'Babylon Oils & Wholesale Provisions',
        durationLabel: '00:45',
        durationSeconds: 45,
        placementTypeAr: 'فيديو شركة · خط إنتاج معتمد',
        placementTypeEn: 'Company Video · Certified Factory',
        summaryAr:
          'شاهد مراحل الفحص المخبري والتغليف الحراري للكرتونات لدى مؤسسة بابل مع إمكانية دخول متجر الشركة.',
        summaryEn:
          'Watch automated sealing and lab quality checks inside Babylon facilities.',
        posterUrl: videoShowcaseImg,
        supplierId: 'supp_babylon',
        featuredCategories: ['زيوت وسمن', 'معلبات ومخللات'],
        chapters: [
          { time: 0, labelAr: 'فحص المواد الخام', labelEn: 'Raw Inspection' },
          { time: 16, labelAr: 'خط التعبئة والختم', labelEn: 'Bottling & Sealing' },
          { time: 31, labelAr: 'التحميل على الطبالي', labelEn: 'Pallet Dispatch' }
        ]
      },
      {
        id: 'vid_factory_2',
        videoKind: 'companies',
        titleAr: 'جولة شركة الرافدين: مستودعات الحبوب المبردة وأسطول النقل',
        titleEn: 'Al-Rafidain Co. Tour: Climate Silos & Fleet Operations',
        sponsorNameAr: 'شركة الرافدين للتجارة العامة والأغذية',
        sponsorNameEn: 'Al-Rafidain Food Trading Co.',
        durationLabel: '01:00',
        durationSeconds: 60,
        placementTypeAr: 'فيديو شركة · شريك استراتيجي',
        placementTypeEn: 'Company Video · Strategic Partner',
        summaryAr:
          'تعرف على طاقة الاستيعاب اليومية وتجهيز طلبيات التوريد الجماعي وتسهيلات الائتمان حتى 30 يوماً.',
        summaryEn:
          'Explore daily fulfillment capacity and 30-day verified merchant credit programs.',
        posterUrl: heroCampaignImg,
        supplierId: 'supp_rafidain',
        featuredCategories: ['أرز وحبوب', 'سكر ومحليات'],
        chapters: [
          { time: 0, labelAr: 'فرز وتنقية الحبوب', labelEn: 'Grain Sorting' },
          { time: 22, labelAr: 'التعبئة بأكياس 10-50 كغم', labelEn: '10-50kg Sacking' },
          { time: 42, labelAr: 'فانات التوزيع السريع', labelEn: 'Fleet Dispatch' }
        ]
      },
      {
        id: 'vid_factory_3',
        videoKind: 'companies',
        titleAr: 'شركة دجلة والفرات: مركز التوزيع السريع وتجهيز الطلبيات خلال 45 دقيقة',
        titleEn: 'Tigris & Euphrates Express: 45-Min Warehouse Dispatch',
        sponsorNameAr: 'شركة دجلة والفرات للتوزيع السريع',
        sponsorNameEn: 'Tigris & Euphrates Express',
        durationLabel: '00:50',
        durationSeconds: 50,
        placementTypeAr: 'فيديو شركة · توصيل فوري',
        placementTypeEn: 'Company Video · Express Hub',
        summaryAr:
          'جولة داخل مستودعات دجلة والفرات في المنصور وآلية تلبية احتياجات الأسواق المحلية بأقصى سرعة.',
        summaryEn:
          'Inside Tigris & Euphrates warehouses serving Baghdad retailers in under 45 minutes.',
        posterUrl: flashBundleImg,
        supplierId: 'supp_tigris',
        featuredCategories: ['قهوة ومشروبات ساخنة', 'ألبان وأجبان'],
        chapters: [
          { time: 0, labelAr: 'استلام الطلبات الذكي', labelEn: 'Smart Intake' },
          { time: 18, labelAr: 'فحص تواريخ الصلاحية', labelEn: 'Shelf-Life Check' },
          { time: 35, labelAr: 'التسليم خلال 45 دقيقة', labelEn: '45-Min Delivery' }
        ]
      }
    ],
    []
  );

  const videoSpotlights = useMemo(
    () => allVideoSpotlights.filter((v) => v.videoKind === videoCategoryMode),
    [allVideoSpotlights, videoCategoryMode]
  );

  // Auto-advance interactive video timeline while playing
  const currentVideo = videoSpotlights[activeVideoIndex] || videoSpotlights[0];
  useEffect(() => {
    if (!isPlayingVideo || !currentVideo) return;
    const timer = window.setInterval(() => {
      setVideoProgressSec((prev) => {
        if (prev >= currentVideo.durationSeconds) {
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isPlayingVideo, currentVideo?.durationSeconds]);

  // Helper to resolve supplier safely
  const openSupplierById = (supplierId: string) => {
    if (!onOpenSupplierStore) return;
    const found =
      WHOLESALE_SUPPLIERS.find((s) => s.id === supplierId) || WHOLESALE_SUPPLIERS[0];
    onOpenSupplierStore(found);
  };

  // Match pool product for thumbnail
  const findProductByBarcode = (barcode: string) =>
    products.find((p) => p.barcode === barcode);

  // Dynamic category list derived from available products
  const availableCategories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return ['الكل', ...cats.slice(0, 6)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'الكل') return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  // Shoppable SKUs tied to current video reel
  const videoShoppableProducts = useMemo(() => {
    const matched = products.filter((p) =>
      currentVideo?.featuredCategories.includes(p.category)
    );
    return (matched.length > 0 ? matched : products).slice(0, 3);
  }, [products, currentVideo]);

  const primaryVideoSupplier = useMemo(
    () =>
      WHOLESALE_SUPPLIERS.find((s) => s.id === currentVideo?.supplierId) ||
      WHOLESALE_SUPPLIERS[0],
    [currentVideo?.supplierId]
  );

  // Build curated revenue-generating wholesale pallet bundles from real products
  const curatedBundles = useMemo(() => {
    const pickItems = (cats: string[], fallbackStart: number) => {
      const matched = products.filter(
        (p) => cats.includes(p.category) && p.offers.length > 0
      );
      const list = matched.length >= 2 ? matched.slice(0, 3) : products.slice(fallbackStart, fallbackStart + 3);
      return list.filter((p) => p.offers[0]);
    };

    const defs = [
      {
        id: 'bundle_essentials',
        titleAr: 'باقة التموين الذهبية للسوبرماركت',
        titleEn: 'Golden Supermarket Essentials Pallet',
        sponsorAr: 'برعاية شركة الرافدين · توصيل مجاني',
        sponsorEn: 'Sponsored by Al-Rafidain · Free Delivery',
        imageUrl: flashBundleImg,
        discountPct: 12,
        items: pickItems(['أرز وحبوب', 'زيوت وسمن', 'معلبات ومخللات'], 0),
        supplierId: 'supp_rafidain'
      },
      {
        id: 'bundle_cafe',
        titleAr: 'باقة المقاهي والمشروبات الساخنة',
        titleEn: 'Cafe & Hot Beverage Wholesale Bundle',
        sponsorAr: 'برعاية شركة النهرين · خصم الكمية',
        sponsorEn: 'Sponsored by Al-Nahrain · Volume Rebate',
        imageUrl: '/assets/images/banner_dalil_hero.jpg',
        discountPct: 14,
        items: pickItems(['قهوة ومشروبات ساخنة', 'مشروبات وشاي', 'سكر ومحليات'], 2),
        supplierId: 'supp_nahrain'
      },
      {
        id: 'bundle_home',
        titleAr: 'باقة السلع السريعة والمنظفات',
        titleEn: 'Fast-Turnover Pantry & Care Bundle',
        sponsorAr: 'برعاية شركة دجلة والفرات · شحن 45 دقيقة',
        sponsorEn: 'Sponsored by Tigris Express · 45m Dispatch',
        imageUrl: '/assets/images/banner_dalil_deals.jpg',
        discountPct: 11,
        items: pickItems(['منظفات وعناية', 'ألبان وأجبان', 'مكرونة وشعرية'], 4),
        supplierId: 'supp_tigris'
      }
    ];

    return defs.filter((b) => b.items.length > 0);
  }, [products]);

  // Clearance near-expiry offers (filtered by category if active)
  const clearanceOffers = useMemo(() => {
    return filteredProducts.flatMap((p) =>
      p.offers
        .filter((o) => o.isClearanceNearExpiry)
        .map((o) => ({ product: p, offer: o }))
    );
  }, [filteredProducts]);

  // Filtered collective pools
  const filteredPools = useMemo(() => {
    if (selectedCategory === 'الكل') return pools;
    return pools.filter((pool) => {
      const prod = findProductByBarcode(pool.barcode);
      return !prod || prod.category === selectedCategory;
    });
  }, [pools, selectedCategory, products]);

  const handleJoinPool = async (pool: CollectivePool) => {
    const qty = pledgeQuantities[pool.id] || 10;
    try {
      const res = await fetchWithRetry(`/api/collective-pools/${pool.id}/pledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty }),
        retries: 1
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setPledgedSuccessPoolId(pool.id);
        setTimeout(() => setPledgedSuccessPoolId(null), 3000);
        loadPools();
      }
    } catch (err: any) {
      console.warn('Could not join collective pool:', err?.message || err);
    }
  };

  const handleQuickAddSingle = (
    product: ProductWithOffers,
    offer?: SupplierOfferItem,
    customQty?: number
  ) => {
    const targetOffer = offer || product.offers[0];
    if (!targetOffer) {
      onOpenProductComparison(product);
      return;
    }
    if (onAddToCart) {
      const qty = customQty && customQty > 0 ? customQty : targetOffer.minOrderQuantity || 1;
      onAddToCart(product, targetOffer, qty);
      const key = `${product.barcode}_${targetOffer.id}`;
      setAddedProductKey(key);
      setTimeout(() => setAddedProductKey(null), 2000);
    } else {
      onOpenProductComparison(product);
    }
  };

  const handleAddBundleToCart = (
    bundleId: string,
    items: ProductWithOffers[]
  ) => {
    if (onAddToCart) {
      items.forEach((prod) => {
        if (prod.offers[0]) {
          onAddToCart(prod, prod.offers[0], prod.offers[0].minOrderQuantity || 2);
        }
      });
      setAddedBundleId(bundleId);
      setTimeout(() => setAddedBundleId(null), 2500);
    } else if (items[0]) {
      onOpenProductComparison(items[0]);
    }
  };

  const handleAdBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pkg = AD_PACKAGES.find((p) => p.id === selectedAdPkgId) || AD_PACKAGES[0];
    const totalIQD = pkg.weeklyPriceIQD * adDurationWeeks;
    const ref = `AD-${Math.floor(100000 + Math.random() * 900000)}`;
    setAdBookingConfirmation({
      ref,
      packageName: isAr ? pkg.nameAr : pkg.nameEn,
      totalIQD
    });
  };

  const currentHero = heroCampaigns[heroIndex];
  const selectedAdPkg = AD_PACKAGES.find((p) => p.id === selectedAdPkgId) || AD_PACKAGES[0];

  const sectionTabs: { id: DealSectionFilter; labelAr: string; labelEn: string; count?: number; row: 1 | 2 }[] = [
    { id: 'sponsored', labelAr: 'حملات الموردين', labelEn: 'Sponsored', count: 4, row: 1 },
    { id: 'video', labelAr: 'عروض الفيديو', labelEn: 'Video Reels', count: allVideoSpotlights.length, row: 1 },
    { id: 'bundles', labelAr: 'الباقات والطبالي', labelEn: 'Bundles', count: curatedBundles.length, row: 1 },
    { id: 'collective', labelAr: 'الشراء الجماعي', labelEn: 'Group Pools', count: filteredPools.length, row: 2 },
    { id: 'clearance', labelAr: 'تصفيات المخزون', labelEn: 'Clearance', count: clearanceOffers.length, row: 2 }
  ];

  const showSection = (sec: DealSectionFilter) => activeSection === sec;

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-7 font-brand">
      {/* Optional contextual back action when entered from another view */}
      {onBack && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4B5563] hover:text-[#00A046] transition-colors cursor-pointer"
          >
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{isAr ? 'رجوع' : 'Back'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAdBookingConfirmation(null);
              setIsAdModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00A046] hover:underline cursor-pointer"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>{isAr ? 'أعلن بصفحة الصفقات' : 'Sponsor a Deal'}</span>
          </button>
        </div>
      )}

      {/* 1. HERO SPONSORED CAMPAIGN CAROUSEL */}
      <section className="relative rounded-2xl overflow-hidden border border-[#E5E7EB] bg-[#0B1D14] text-white shadow-sm">
        <div className="relative min-h-[270px] sm:min-h-[320px] flex flex-col justify-end">
          {!brokenImages[currentHero.id] ? (
            <img
              src={currentHero.imageUrl}
              alt={isAr ? currentHero.titleAr : currentHero.titleEn}
              referrerPolicy="no-referrer"
              onError={() => setBrokenImages((prev) => ({ ...prev, [currentHero.id]: true }))}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#06381E] via-[#0A5C30] to-[#0E2B1E]" />
          )}

          {/* Measured contrast scrim for legible text across all image frames */}
          <div
            className={`absolute inset-0 ${
              isAr
                ? 'bg-gradient-to-l from-[#071A11]/95 via-[#071A11]/80 to-[#071A11]/30'
                : 'bg-gradient-to-r from-[#071A11]/95 via-[#071A11]/80 to-[#071A11]/30'
            }`}
          />

          <div className="relative z-10 p-5 sm:p-8 max-w-3xl space-y-3">
            {/* Unboxed metadata row */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs font-semibold text-emerald-200">
              <span className="text-[#FFE600] font-bold">
                {isAr ? currentHero.sponsorLabelAr : currentHero.sponsorLabelEn}
              </span>
              <span aria-hidden="true">·</span>
              <span>{isAr ? currentHero.offerHighlightAr : currentHero.offerHighlightEn}</span>
            </div>

            <h1 className="text-xl sm:text-3xl font-black leading-tight text-white [text-wrap:balance]">
              {isAr ? currentHero.titleAr : currentHero.titleEn}
            </h1>

            <p className="text-xs sm:text-sm text-emerald-50/90 leading-relaxed max-w-2xl">
              {isAr ? currentHero.subtitleAr : currentHero.subtitleEn}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(currentHero.categoryFilter);
                  setActiveSection(currentHero.targetSection);
                }}
                className="px-5 py-2.5 bg-[#FFE600] text-[#111827] rounded-xl text-xs sm:text-sm font-black hover:bg-[#F5DC00] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {isAr ? 'استكشف عروض الحملة' : 'Explore Campaign Deals'}
              </button>

              {onOpenSupplierStore && (
                <button
                  type="button"
                  onClick={() => openSupplierById(currentHero.supplierId)}
                  className="px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-xs text-white border border-white/25 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {isAr ? 'زيارة متجر المورد' : 'Visit Supplier Store'}
                </button>
              )}
            </div>
          </div>

          {/* Carousel Controls */}
          <div className="relative z-10 px-5 sm:px-8 pb-4 flex items-center justify-between border-t border-white/10 pt-3">
            <div className="flex items-center gap-2">
              {heroCampaigns.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setHeroIndex(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === heroIndex ? 'w-7 bg-[#FFE600]' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
              <span className="text-[11px] text-emerald-100/80 tabular-nums ms-2">
                {heroIndex + 1} / {heroCampaigns.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setHeroIndex((prev) => (prev - 1 + heroCampaigns.length) % heroCampaigns.length)
                }
                aria-label={isAr ? 'الحملة السابقة' : 'Previous campaign'}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setHeroIndex((prev) => (prev + 1) % heroCampaigns.length)}
                aria-label={isAr ? 'الحملة التالية' : 'Next campaign'}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE DEAL SECTIONS (2 ROWS) & CATEGORY FILTERS */}
      <section className="bg-white rounded-2xl border border-[#E5E7EB] p-2.5 sm:p-4 space-y-3">
        <div className="space-y-2">
          {[1, 2].map((rowNum) => (
            <div key={rowNum} className="flex items-stretch gap-1.5 sm:gap-2">
              {sectionTabs
                .filter((tab) => tab.row === rowNum)
                .map((tab) => {
                  const active = activeSection === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveSection(tab.id)}
                      className={`${
                        rowNum === 1 ? 'flex-auto' : 'flex-1'
                      } px-2 sm:px-3.5 py-2.5 rounded-xl text-[11px] min-[400px]:text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-1 ${
                        active
                          ? 'bg-[#00A046] text-white shadow-xs'
                          : 'bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]'
                      }`}
                    >
                      <span>{isAr ? tab.labelAr : tab.labelEn}</span>
                      {typeof tab.count === 'number' && (
                        <span
                          className={`hidden sm:inline text-[11px] tabular-nums shrink-0 ${
                            active ? 'text-emerald-100' : 'text-[#6B7280]'
                          }`}
                        >
                          ({tab.count})
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#F1F5F9]">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold text-[#6B7280] whitespace-nowrap shrink-0 me-1">
              {isAr ? 'تصنيف البضاعة:' : 'Category:'}
            </span>
            {availableCategories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#111827] text-white'
                      : 'text-[#4B5563] hover:bg-[#F3F4F6]'
                  }`}
                >
                  {isAr ? cat : getLocalizedText(cat, 'en')}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setAdBookingConfirmation(null);
              setIsAdModalOpen(true);
            }}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-[#00A046] hover:text-[#008238] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>{isAr ? 'أعلن بصفحة الصفقات' : 'Promote Your Brand'}</span>
          </button>
        </div>
      </section>

      {/* 3A. SPONSORED SUPPLIER CAMPAIGNS (حملات الموردين) */}
      {showSection('sponsored') && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#111827]">
                {isAr
                  ? 'حملات الموردين والشركات الممولة'
                  : 'Sponsored Supplier Campaigns'}
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {isAr
                  ? 'عروض حصرية وبنرات ممولة من كبار الموردين والشركات المعتمدة في المنصة'
                  : 'Sponsored campaigns and exclusive wholesale rebates from verified platform suppliers'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAdBookingConfirmation(null);
                setSelectedAdPkgId('hero_banner');
                setIsAdModalOpen(true);
              }}
              className="text-xs font-bold text-[#00A046] hover:underline cursor-pointer whitespace-nowrap"
            >
              {isAr ? '+ احجز حملة لموردك' : '+ Sponsor Campaign'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: 'sp_rafidain',
                supplierId: 'supp_rafidain',
                image: flashBundleImg,
                tagAr: 'إعلان مميز · مورد معتمد',
                tagEn: 'Sponsored Partner · Verified Supplier',
                titleAr: 'شركة الرافدين للتجارة العامة والأغذية',
                titleEn: 'Al-Rafidain Food & General Trading',
                metaAr: 'الرصافة - الشورجة · سقف ائتمان 30 يوم · 4.9 ★',
                metaEn: 'Baghdad - Shorja · 30-day credit · 4.9 ★',
                descAr:
                  'توريد مباشر لأرز العنبر والزيوت والسكر والحليب البودرة بأسعار التنافس الأسبوعي، مع شحن مبرد مجاني للطلبيات فوق 150,000 د.ع.',
                descEn:
                  'Direct wholesale fulfillment for Basmati rice, oils, sugar, and milk powder with free chilled delivery above 150,000 IQD.',
                minOrderIQD: 150000,
                rebateAr: 'خصم حتى 15%',
                rebateEn: 'Up to 15% off',
                targetCat: 'أرز وحبوب'
              },
              {
                id: 'sp_tigris',
                supplierId: 'supp_tigris',
                image: '/assets/images/banner_dalil_deals.jpg',
                tagAr: 'شريك التوريد السريع · شحن 45 دقيقة',
                tagEn: 'Express Partner · 45-Min Dispatch',
                titleAr: 'شركة دجلة والفرات للتوزيع السريع',
                titleEn: 'Tigris & Euphrates Express Distribution',
                metaAr: 'المنصور - 14 رمضان · ائتمان 21 يوم · 4.9 ★',
                metaEn: 'Al-Mansoor · 21-day credit · 4.9 ★',
                descAr:
                  'فانات تبريد نشطة في منطقتك لتغطية الألبان والأجبان والمعلبات والمنظفات بسرعة قياسية ودعم الائتمان التجاري.',
                descEn:
                  'Active chilled vans covering dairy, canned foods, and detergents with rapid dispatch and merchant credit.',
                minOrderIQD: 100000,
                rebateAr: 'توصيل مجاني فوري',
                rebateEn: 'Free express van',
                targetCat: 'ألبان وأجبان'
              },
              {
                id: 'sp_nahrain',
                supplierId: 'supp_nahrain',
                image: '/assets/images/banner_dalil_hero.jpg',
                tagAr: 'وكالات حصرية · قهوة وشاي',
                tagEn: 'Exclusive Agencies · Coffee & Tea',
                titleAr: 'شركة النهرين لاستيراد الشاي والبن الفاخر',
                titleEn: 'Al-Nahrain Tea & Coffee Importers',
                metaAr: 'الكرادة · شحن مجاني SMART · 4.8 ★',
                metaEn: 'Karrada · Free SMART Shipping · 4.8 ★',
                descAr:
                  'أفضل هوامش ربح للمقاهي والأسواق على شاي الكوزي وقهوة العميد ولافازا مع خصومات إضافية للتوريد الأسبوعي.',
                descEn:
                  'Top margins on specialty coffee and Ceylon tea brands with weekly volume rebates.',
                minOrderIQD: 120000,
                rebateAr: 'خصم كميات 14%',
                rebateEn: '14% volume deal',
                targetCat: 'قهوة ومشروبات ساخنة'
              },
              {
                id: 'sp_babylon',
                supplierId: 'supp_babylon',
                image: videoShowcaseImg,
                tagAr: 'حملة الزيوت والتموين الكبرى',
                tagEn: 'Cooking Oils & Bulk Provisions',
                titleAr: 'مؤسسة بابل للزيوت والتموين الغذائي',
                titleEn: 'Babylon Oils & Wholesale Provisions',
                metaAr: 'البياع والسيدية · خصم نقدي 2% · 4.7 ★',
                metaEn: 'Bayaa · 2% cash rebate · 4.7 ★',
                descAr:
                  'توريد الزيوت النباتية والسمنة ومعجون الطماطم بالكرتون والطبالي مباشرة للمتاجر والمطاعم بأسعار تنافسية.',
                descEn:
                  'Direct carton & pallet distribution for cooking oils, ghee, and tomato paste across Baghdad.',
                minOrderIQD: 200000,
                rebateAr: 'خصم 2% للكاش',
                rebateEn: '2% cash discount',
                targetCat: 'زيوت وسمن'
              }
            ].map((camp) => (
              <div
                key={camp.id}
                className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden flex flex-col justify-between"
              >
                <div className="relative h-44 bg-[#F3F4F6] overflow-hidden">
                  {!brokenImages[camp.id] ? (
                    <img
                      src={camp.image}
                      alt={isAr ? camp.titleAr : camp.titleEn}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setBrokenImages((prev) => ({ ...prev, [camp.id]: true }))
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-emerald-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  <div className="absolute bottom-3 inset-x-4 text-white">
                    <div className="text-[11px] text-[#FFE600] font-bold">
                      {isAr ? camp.tagAr : camp.tagEn}
                    </div>
                    <h3 className="text-sm sm:text-base font-black mt-0.5">
                      {isAr ? camp.titleAr : camp.titleEn}
                    </h3>
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="text-xs text-[#6B7280]">
                      {isAr ? camp.metaAr : camp.metaEn}
                    </div>
                    <p className="text-xs text-[#374151] leading-relaxed">
                      {isAr ? camp.descAr : camp.descEn}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#F1F5F9]">
                    <div className="p-2.5 rounded-xl bg-[#F8FAFC]">
                      <div className="text-[11px] text-[#6B7280]">
                        {isAr ? 'الحد الأدنى للطلب' : 'Min Order'}
                      </div>
                      <div className="text-sm font-black text-[#111827] tabular-nums mt-0.5">
                        {formatCurrency(camp.minOrderIQD, currency, language)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#F8FAFC]">
                      <div className="text-[11px] text-[#6B7280]">
                        {isAr ? 'ميزة الحملة' : 'Campaign Offer'}
                      </div>
                      <div className="text-sm font-black text-[#00A046] mt-0.5">
                        {isAr ? camp.rebateAr : camp.rebateEn}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {onOpenSupplierStore && (
                      <button
                        type="button"
                        onClick={() => openSupplierById(camp.supplierId)}
                        className="flex-1 py-2.5 px-4 bg-[#00A046] hover:bg-[#008A3C] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {isAr ? 'تصفح عروض المورد' : 'Browse Supplier Catalog'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory(camp.targetCat);
                        setActiveSection('bundles');
                      }}
                      className="py-2.5 px-3.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {isAr ? 'الباقات' : 'Bundles'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3B. INTERACTIVE VIDEO REELS (عروض الفيديو: فيديو منتجات وفيديو شركات) */}
      {showSection('video') && currentVideo && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#111827]">
                {isAr
                  ? 'عروض الفيديو التفاعلية (المنتجات والشركات)'
                  : 'Interactive Video Offers (Products & Companies)'}
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {isAr
                  ? 'اختر فيديو منتجات لإضافة الأصناف للسلة، أو فيديو شركات لزيارة صفحة الشركة المعلنة'
                  : 'Switch between Product Videos for instant Add-to-Cart and Company Videos to visit supplier pages'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAdBookingConfirmation(null);
                setSelectedAdPkgId('video_reel');
                setIsAdModalOpen(true);
              }}
              className="text-xs font-bold text-[#00A046] hover:underline cursor-pointer whitespace-nowrap"
            >
              {isAr ? '+ حجز عرض فيديو ممول' : '+ Book Video Slot'}
            </button>
          </div>

          {/* Two prominent icon mode buttons: فيديو منتجات & فيديو شركات */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-2 inline-flex flex-wrap items-center gap-2 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setVideoCategoryMode('products');
                setActiveVideoIndex(0);
                setVideoProgressSec(0);
              }}
              className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                videoCategoryMode === 'products'
                  ? 'bg-[#00A046] text-white shadow-xs'
                  : 'bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]'
              }`}
            >
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  videoCategoryMode === 'products'
                    ? 'bg-white/20 text-white'
                    : 'bg-white text-[#00A046]'
                }`}
              >
                <Package className="w-4 h-4" />
              </span>
              <span>{isAr ? 'فيديو منتجات' : 'Product Videos'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setVideoCategoryMode('companies');
                setActiveVideoIndex(0);
                setVideoProgressSec(0);
              }}
              className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                videoCategoryMode === 'companies'
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]'
              }`}
            >
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  videoCategoryMode === 'companies'
                    ? 'bg-white/15 text-[#FFE600]'
                    : 'bg-white text-[#111827]'
                }`}
              >
                <Building2 className="w-4 h-4" />
              </span>
              <span>{isAr ? 'فيديو شركات' : 'Company Videos'}</span>
            </button>
          </div>

          {/* Focused Interactive Video Player Card */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden flex flex-col">
            <div className="relative aspect-video max-h-[420px] bg-[#0F172A] overflow-hidden">
              {!brokenImages[currentVideo.id] ? (
                <img
                  src={currentVideo.posterUrl}
                  alt={isAr ? currentVideo.titleAr : currentVideo.titleEn}
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setBrokenImages((prev) => ({ ...prev, [currentVideo.id]: true }))
                  }
                  className={`w-full h-full object-cover transition-transform duration-1000 ${
                    isPlayingVideo ? 'scale-110' : 'scale-100'
                  }`}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#0B291B] to-[#111827] flex items-center justify-center">
                  <Film className="w-12 h-12 text-emerald-400/50" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30" />

              {/* Top Reel Bar */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between text-[11px] text-white/90">
                <span className="font-bold">
                  {isAr ? currentVideo.placementTypeAr : currentVideo.placementTypeEn}
                  {' · '}
                  {isAr ? currentVideo.sponsorNameAr : currentVideo.sponsorNameEn}
                </span>
                <span className="font-mono tabular-nums bg-black/50 px-2 py-0.5 rounded">
                  {formatTimer(videoProgressSec)} / {currentVideo.durationLabel}
                </span>
              </div>

              {/* Center Play/Pause Affordance */}
              <button
                type="button"
                onClick={() => setIsPlayingVideo((prev) => !prev)}
                aria-label={isPlayingVideo ? 'Pause' : 'Play'}
                className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-[#FFE600] text-[#111827] shadow-lg flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
              >
                {isPlayingVideo ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ms-0.5" />
                )}
              </button>

              {/* Bottom Interactive Timeline + Chapters */}
              <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                    {isAr ? currentVideo.titleAr : currentVideo.titleEn}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsMutedVideo((prev) => !prev)}
                    aria-label={isMutedVideo ? 'Unmute' : 'Mute'}
                    className="w-8 h-8 rounded-lg bg-black/50 hover:bg-black/70 text-white flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    {isMutedVideo ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Interactive Progress Scrubber */}
                <div
                  className="w-full h-1.5 bg-white/25 rounded-full overflow-hidden cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = Math.min(
                      1,
                      Math.max(0, (e.clientX - rect.left) / rect.width)
                    );
                    setVideoProgressSec(
                      Math.round(
                        (isAr ? 1 - ratio : ratio) * currentVideo.durationSeconds
                      )
                    );
                  }}
                >
                  <div
                    className="h-full bg-[#FFE600] transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (videoProgressSec / currentVideo.durationSeconds) * 100
                        )
                      )}%`
                    }}
                  />
                </div>

                {/* Video Chapter Markers */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {currentVideo.chapters.map((ch) => (
                    <button
                      key={ch.time}
                      type="button"
                      onClick={() => {
                        setVideoProgressSec(ch.time);
                        setIsPlayingVideo(true);
                      }}
                      className={`text-[10px] px-2 py-1 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        videoProgressSec >= ch.time
                          ? 'bg-white/25 text-white font-bold'
                          : 'bg-black/40 text-white/70 hover:text-white'
                      }`}
                    >
                      {formatTimer(ch.time)} · {isAr ? ch.labelAr : ch.labelEn}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reel Selector & Mode-Specific Content Below Video */}
            <div className="p-4 space-y-3.5">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {videoSpotlights.map((vid, idx) => (
                  <button
                    key={vid.id}
                    type="button"
                    onClick={() => {
                      setActiveVideoIndex(idx);
                      setVideoProgressSec(0);
                      setIsPlayingVideo(true);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                      idx === activeVideoIndex
                        ? 'bg-[#ECFDF5] border-[#00A046] text-[#007A35]'
                        : 'bg-[#F8FAFC] border-[#E5E7EB] text-[#4B5563] hover:border-[#CBD5E1]'
                    }`}
                  >
                    {idx + 1}. {isAr ? vid.sponsorNameAr : vid.sponsorNameEn} ({vid.durationLabel})
                  </button>
                ))}
              </div>

              {videoCategoryMode === 'products' ? (
                <div className="pt-2 border-t border-[#F1F5F9] space-y-2.5">
                  <div className="text-[11px] font-bold text-[#6B7280]">
                    {isAr ? 'المنتجات في الفيديو:' : 'Products in This Video:'}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {videoShoppableProducts.map((prod) => {
                      const offer = prod.offers[0];
                      const btnKey = offer ? `${prod.barcode}_${offer.id}` : prod.barcode;
                      const isAdded = addedProductKey === btnKey;
                      const cartQty = offer
                        ? cartItems.find((item) => item.offer.id === offer.id)?.quantity ?? 0
                        : 0;
                      const draftQty = videoProductQuantities[prod.barcode] ?? 1;
                      const maxStock = offer?.availableStock || 999;

                      return (
                        <div
                          key={prod.barcode}
                          className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center gap-2.5"
                        >
                          <div className="w-11 h-11 rounded-lg bg-white border border-[#E5E7EB] p-1 shrink-0 flex items-center justify-center overflow-hidden">
                            {prod.imageUrl ? (
                              <img
                                src={prod.imageUrl}
                                alt={isAr ? prod.nameAr : prod.nameEn || prod.nameAr}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => onOpenProductComparison(prod)}
                              className="text-[11px] font-bold text-[#111827] hover:text-[#00A046] truncate block w-full text-start cursor-pointer"
                            >
                              {isAr ? prod.nameAr : prod.nameEn || prod.nameAr}
                            </button>
                            <div className="text-[11px] font-black text-[#00A046] tabular-nums">
                              {formatCurrency(prod.minPrice, currency, language)}
                            </div>

                            {cartQty > 0 && offer && onUpdateCartQuantity ? (
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <div className="flex-1 h-8 px-2 rounded-lg bg-[#ECFDF5] border border-[#00A046] text-[#007A35] text-[11px] font-bold flex items-center justify-center gap-1 whitespace-nowrap">
                                  <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                                  <span>
                                    {isAr ? `في السلة (${cartQty})` : `In Cart (${cartQty})`}
                                  </span>
                                </div>
                                <div className="shrink-0 h-8 flex items-center rounded-lg border border-[#00A046]/40 bg-white overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => onUpdateCartQuantity(offer.id, cartQty - 1)}
                                    aria-label={isAr ? 'تقليل الكمية' : 'Decrease quantity'}
                                    className="w-7 h-full flex items-center justify-center text-[#374151] hover:bg-[#FEE2E2] hover:text-[#DC2626] transition-colors cursor-pointer"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="w-6 text-center text-[11px] font-black text-[#111827] tabular-nums select-none">
                                    {cartQty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateCartQuantity(
                                        offer.id,
                                        Math.min(maxStock, cartQty + 1)
                                      )
                                    }
                                    disabled={cartQty >= maxStock}
                                    aria-label={isAr ? 'زيادة الكمية' : 'Increase quantity'}
                                    className="w-7 h-full flex items-center justify-center text-[#00A046] hover:bg-[#ECFDF5] transition-colors cursor-pointer disabled:opacity-40"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleQuickAddSingle(prod, offer, draftQty)}
                                  className="flex-1 h-8 inline-flex items-center justify-center gap-1 px-2 rounded-lg bg-[#00A046] hover:bg-[#008A3C] text-white text-[11px] font-bold cursor-pointer whitespace-nowrap"
                                >
                                  {isAdded ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>{isAr ? 'تمت الإضافة' : 'Added'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingCart className="w-3.5 h-3.5" />
                                      <span>{isAr ? 'إضافة للسلة' : 'Add to Cart'}</span>
                                    </>
                                  )}
                                </button>
                                <div className="shrink-0 h-8 flex items-center rounded-lg border border-[#D1D5DB] bg-white overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setVideoProductQuantities((prev) => ({
                                        ...prev,
                                        [prod.barcode]: Math.max(1, (prev[prod.barcode] ?? 1) - 1)
                                      }))
                                    }
                                    disabled={draftQty <= 1}
                                    aria-label={isAr ? 'تقليل الكمية' : 'Decrease quantity'}
                                    className="w-7 h-full flex items-center justify-center text-[#374151] hover:bg-[#F3F4F6] transition-colors cursor-pointer disabled:opacity-40"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="w-6 text-center text-[11px] font-black text-[#111827] tabular-nums select-none">
                                    {draftQty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setVideoProductQuantities((prev) => ({
                                        ...prev,
                                        [prod.barcode]: Math.min(
                                          maxStock,
                                          (prev[prod.barcode] ?? 1) + 1
                                        )
                                      }))
                                    }
                                    disabled={draftQty >= maxStock}
                                    aria-label={isAr ? 'زيادة الكمية' : 'Increase quantity'}
                                    className="w-7 h-full flex items-center justify-center text-[#00A046] hover:bg-[#ECFDF5] transition-colors cursor-pointer disabled:opacity-40"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="text-[11px] font-bold text-[#00A046]">
                      {isAr ? 'فيديو تعريفي عن الشركة' : 'Company Video Profile'}
                    </div>
                    <div className="text-sm font-black text-[#111827] truncate">
                      {isAr ? primaryVideoSupplier.nameAr : primaryVideoSupplier.nameEn}
                    </div>
                    <div className="text-xs text-[#6B7280] leading-relaxed">
                      {isAr ? currentVideo.summaryAr : currentVideo.summaryEn}
                    </div>
                  </div>
                  {onOpenSupplierStore && (
                    <button
                      type="button"
                      onClick={() => openSupplierById(currentVideo.supplierId)}
                      className="px-4 py-2.5 bg-[#00A046] hover:bg-[#008A3C] text-white rounded-xl text-xs font-black transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5"
                    >
                      <Building2 className="w-4 h-4" />
                      <span>{isAr ? 'زيارة صفحة الشركة' : 'Visit Company Page'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 4. SPONSORED MERCHANDISING PALLET BUNDLES */}
      {showSection('bundles') && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#111827]">
                {isAr
                  ? 'باقات التوريد والطبالي الممولة (خصومات السلة المجمعة)'
                  : 'Sponsored Wholesale Pallet Bundles'}
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {isAr
                  ? 'باقات جاهزة من الأصناف الأساسية بسعر مخفض — أضفها بضغطة واحدة لعربة الجملة'
                  : 'Curated fast-turnover wholesale pallets with instant bundled savings'}
              </p>
            </div>
            <span className="text-xs text-[#6B7280] tabular-nums">
              {isAr ? `${curatedBundles.length} باقات نشطة` : `${curatedBundles.length} active bundles`}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {curatedBundles.map((bundle) => {
              const standardSumIQD = bundle.items.reduce(
                (acc, p) => acc + (p.offers[0]?.priceIQD || p.minPrice) * (p.offers[0]?.minOrderQuantity || 2),
                0
              );
              const discountedIQD = Math.round(standardSumIQD * (1 - bundle.discountPct / 100));
              const isAdded = addedBundleId === bundle.id;

              return (
                <article
                  key={bundle.id}
                  className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden flex flex-col justify-between hover:border-[#00A046]/50 transition-colors"
                >
                  <div className="relative h-40 bg-[#F3F4F6] overflow-hidden">
                    {!brokenImages[bundle.id] ? (
                      <img
                        src={bundle.imageUrl}
                        alt={isAr ? bundle.titleAr : bundle.titleEn}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setBrokenImages((prev) => ({ ...prev, [bundle.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
                        <Package className="w-10 h-10 text-emerald-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 inset-x-3 flex items-end justify-between text-white">
                      <div>
                        <div className="text-[11px] text-[#FFE600] font-semibold">
                          {isAr ? bundle.sponsorAr : bundle.sponsorEn}
                        </div>
                        <h3 className="text-sm font-black mt-0.5">
                          {isAr ? bundle.titleAr : bundle.titleEn}
                        </h3>
                      </div>
                      <span className="text-xs font-black bg-[#FFE600] text-[#111827] px-2 py-0.5 rounded tabular-nums shrink-0">
                        -{bundle.discountPct}%
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-[#6B7280]">
                        {isAr ? 'مكونات الباقة:' : 'Bundle Contents:'}
                      </div>
                      <ul className="space-y-1.5">
                        {bundle.items.map((item) => (
                          <li
                            key={item.barcode}
                            className="flex items-center justify-between gap-2 text-xs text-[#374151]"
                          >
                            <button
                              type="button"
                              onClick={() => onOpenProductComparison(item)}
                              className="truncate hover:text-[#00A046] text-start cursor-pointer"
                            >
                              • {isAr ? item.nameAr : item.nameEn || item.nameAr}
                            </button>
                            <span className="text-[11px] text-[#6B7280] tabular-nums shrink-0">
                              ×{item.offers[0]?.minOrderQuantity || 2}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-3 border-t border-[#F1F5F9] space-y-2.5">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <div className="text-[11px] text-[#6B7280]">
                            {isAr ? 'سعر الباقة المجمعة' : 'Bundled Pallet Price'}
                          </div>
                          <div className="text-base font-black text-[#00A046] tabular-nums">
                            {formatCurrency(discountedIQD, currency, language)}
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="text-[11px] text-[#6B7280]">
                            {isAr ? 'قبل الخصم' : 'Regular'}
                          </div>
                          <div className="text-xs text-gray-400 line-through tabular-nums">
                            {formatCurrency(standardSumIQD, currency, language)}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddBundleToCart(bundle.id, bundle.items)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-700 text-white'
                            : 'bg-[#00A046] hover:bg-[#008A3C] text-white'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{isAr ? 'تمت إضافة الباقة لعربة الجملة' : 'Bundle Added to Cart'}</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4" />
                            <span>{isAr ? 'أضف الباقة لعربة الجملة' : 'Add Full Bundle to Cart'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. COLLECTIVE BULK BUYING POOLS (FACTORY DIRECT) */}
      {showSection('collective') && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#00A046]" />
              <h2 className="text-base sm:text-lg font-black text-[#111827]">
                {isAr
                  ? 'مجموعات الشراء الجماعي النشطة (سعر المصنع)'
                  : 'Active Collective Buying Pools (Factory Prices)'}
              </h2>
            </div>
            <span className="text-xs text-[#6B7280]">
              {isAr
                ? 'تجميع طلبيات المتاجر للوصول للحد الأدنى للمصنع'
                : 'Aggregating orders across stores to unlock factory minimums'}
            </span>
          </div>

          {filteredPools.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 text-center text-xs text-[#6B7280]">
              {isAr
                ? 'لا توجد مجموعات شراء جماعي ضمن هذا التصنيف حالياً. اختر "الكل" لعرض جميع المجموعات النشطة.'
                : 'No active pools in this category. Select All to view available collective pools.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPools.map((pool) => {
                const progress = Math.min(
                  100,
                  Math.round((pool.currentPledgedQuantity / pool.targetQuantity) * 100)
                );
                const currentPledge = pledgeQuantities[pool.id] || 10;
                const matchedProd = findProductByBarcode(pool.barcode);

                return (
                  <div
                    key={pool.id}
                    className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                        {matchedProd?.imageUrl ? (
                          <img
                            src={matchedProd.imageUrl}
                            alt={isAr ? pool.productName : getLocalizedText(pool.productName, 'en')}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Layers className="w-6 h-6 text-[#00A046]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="text-[#00A046] font-bold">
                            {isAr
                              ? `وفر ${pool.discountPercentage}% عن الجملة`
                              : `Save ${pool.discountPercentage}%`}
                          </span>
                          <span className="text-[#6B7280] flex items-center gap-1 tabular-nums">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>{isAr ? 'متبقي 4 أيام' : '4 days left'}</span>
                          </span>
                        </div>

                        <h3 className="font-bold text-sm sm:text-base text-[#111827] mt-1">
                          {isAr ? pool.productName : getLocalizedText(pool.productName, 'en')}
                        </h3>
                        <div className="text-xs text-[#6B7280] mt-0.5">
                          {isAr ? pool.supplierName : getLocalizedText(pool.supplierName, 'en')}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="p-2.5 rounded-xl bg-[#F8FAFC]">
                        <span className="text-[11px] text-[#6B7280] block">
                          {isAr ? 'سعر المصنع الجماعي' : 'Collective Factory Price'}
                        </span>
                        <span className="text-base sm:text-lg font-black text-[#00A046] tabular-nums">
                          {formatCurrency(pool.factoryBulkPriceIQD, currency, language)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#F8FAFC]">
                        <span className="text-[11px] text-[#6B7280] block">
                          {isAr ? 'سعر الجملة الفردي' : 'Standard Wholesale'}
                        </span>
                        <span className="text-sm font-semibold text-gray-400 line-through tabular-nums">
                          {formatCurrency(pool.standardPriceIQD, currency, language)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold tabular-nums">
                        <span>
                          {isAr
                            ? `الكمية المحجوزة: ${pool.currentPledgedQuantity} / ${pool.targetQuantity} وحدة`
                            : `Progress: ${pool.currentPledgedQuantity} / ${pool.targetQuantity} units`}
                        </span>
                        <span className="text-[#00A046] font-bold">{progress}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#00A046] rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-[#6B7280] tabular-nums">
                        {isAr ? 'المشاركون حالياً:' : 'Active participants:'}{' '}
                        <strong>
                          {pool.participantsCount} {isAr ? 'متجر في بغداد' : 'stores'}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 pt-3 border-t border-[#F1F5F9]">
                      <div className="flex items-center border border-[#E5E7EB] rounded-lg bg-[#F8FAFC]">
                        <button
                          type="button"
                          onClick={() =>
                            setPledgeQuantities({
                              ...pledgeQuantities,
                              [pool.id]: Math.max(1, currentPledge - 1)
                            })
                          }
                          aria-label={isAr ? 'تقليل الكمية' : 'Decrease'}
                          className="p-2 text-[#4B5563] hover:text-[#111827] cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={currentPledge}
                          onChange={(e) =>
                            setPledgeQuantities({
                              ...pledgeQuantities,
                              [pool.id]: Math.max(1, parseInt(e.target.value) || 1)
                            })
                          }
                          className="w-12 bg-transparent font-bold text-center text-xs tabular-nums focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPledgeQuantities({
                              ...pledgeQuantities,
                              [pool.id]: Math.min(100, currentPledge + 1)
                            })
                          }
                          aria-label={isAr ? 'زيادة الكمية' : 'Increase'}
                          className="p-2 text-[#4B5563] hover:text-[#111827] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleJoinPool(pool)}
                        className="flex-1 py-2.5 px-4 bg-[#00A046] hover:bg-[#008A3C] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        {pledgedSuccessPoolId === pool.id ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{isAr ? 'تم حجز حصتك بنجاح!' : 'Pledge Confirmed!'}</span>
                          </>
                        ) : (
                          <>
                            <Users className="w-4 h-4" />
                            <span>{isAr ? 'انضم لطلب الشراء الجماعي' : 'Join Bulk Pool'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 6. NEAR-EXPIRY CLEARANCE MARKET */}
      {showSection('clearance') && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-600" />
              <h2 className="text-base sm:text-lg font-black text-[#111827]">
                {isAr
                  ? 'سوق تصريف المخزون (عروض قرب انتهاء الصلاحية)'
                  : 'Clearance Market (Near-Expiry Stock)'}
              </h2>
            </div>
            <span className="text-xs text-[#6B7280]">
              {isAr
                ? 'خصومات فورية حتى 40% لتدوير رأس المال السريع'
                : 'Up to 40% instant discounts for fast shelf turnover'}
            </span>
          </div>

          {clearanceOffers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 text-center text-xs text-[#6B7280]">
              {isAr
                ? 'لا توجد عروض تصفية ضمن هذا التصنيف حالياً.'
                : 'No clearance deals in this category right now.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clearanceOffers.map(({ product, offer }) => {
                const addKey = `${product.barcode}_${offer.id}`;
                const isAdded = addedProductKey === addKey;
                return (
                  <div
                    key={offer.id}
                    className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-16 h-16 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={isAr ? product.nameAr : product.nameEn || product.nameAr}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-black text-amber-700 tabular-nums">
                            {isAr
                              ? `خصم ${offer.clearanceDiscountPercent}%`
                              : `${offer.clearanceDiscountPercent}% OFF`}
                          </span>
                          <span aria-hidden="true" className="text-gray-300">
                            ·
                          </span>
                          <span className="text-red-600 font-semibold tabular-nums">
                            {isAr ? `ينتهي: ${offer.expiryDate}` : `Exp: ${offer.expiryDate}`}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-[#111827] mt-1 truncate">
                          {isAr
                            ? product.nameAr
                            : product.nameEn || getLocalizedText(product.nameAr, 'en')}
                        </h4>
                        <button
                          type="button"
                          onClick={() =>
                            onOpenSupplierStore &&
                            onOpenSupplierStore(
                              resolveWholesaleSupplierByOffer(
                                offer.supplierId,
                                offer.supplierName,
                                offer.supplierCity
                              )
                            )
                          }
                          className="text-[11px] text-[#6B7280] hover:text-[#00A046] truncate cursor-pointer"
                        >
                          {isAr ? offer.supplierName : getLocalizedText(offer.supplierName, 'en')}
                        </button>
                      </div>
                    </div>

                    <div className="text-end shrink-0 space-y-1.5">
                      <div className="text-base font-black text-[#00A046] tabular-nums">
                        {formatCurrency(offer.priceIQD, currency, language)}
                      </div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => handleQuickAddSingle(product, offer)}
                          className="px-3 py-1.5 bg-[#00A046] hover:bg-[#008A3C] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {isAdded
                            ? isAr
                              ? '✓ أضيف'
                              : '✓ Added'
                            : isAr
                            ? 'حجز للعربة'
                            : 'Add Deal'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenProductComparison(product)}
                          className="px-2.5 py-1.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {isAr ? 'مقارنة' : 'Compare'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 7. LOCAL DEMAND BENCHMARK + PLATFORM MONETIZATION PARTNER CALLOUT */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Local Demand Intelligence (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[#00A046]">
              <TrendingUp className="w-5 h-5" />
              <h3 className="font-black text-sm sm:text-base text-[#111827]">
                {isAr
                  ? 'ذكاء السوق المحلي: الأصناف الأعلى مبيعاً في بغداد'
                  : 'Local Market Demand: Top-Selling SKUs in Baghdad'}
              </h3>
            </div>
            <p className="text-xs text-[#6B7280]">
              {isAr
                ? 'مؤشرات دوران المخزون لمتاجر التجزئة في المنصور والكرادة والبياع لمساعدتك في اختيار الصفقات الأسرع بيعاً.'
                : 'Aggregated turnover velocity across retail stores to prioritize fast-moving bulk deals.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {[
              {
                rankAr: 'الأعلى طلباً #1',
                rankEn: 'Rank #1 Demand',
                titleAr: 'أرز بسمتي عنبر (10 كغم)',
                titleEn: 'Basmati Amber Rice (10kg)',
                metricAr: '42 كيس / شهر لكل متجر',
                metricEn: '42 sacks/mo avg',
                cat: 'أرز وحبوب'
              },
              {
                rankAr: 'الأعلى طلباً #2',
                rankEn: 'Rank #2 Demand',
                titleAr: 'زيت دوار الشمس عافية',
                titleEn: 'Afia Sunflower Oil (12L)',
                metricAr: '55 كرتون / شهر',
                metricEn: '55 cartons/mo avg',
                cat: 'زيوت وسمن'
              },
              {
                rankAr: 'أسرع دوراناً',
                rankEn: 'Fastest Turnover',
                titleAr: 'معجون طماطم لونا التركي',
                titleEn: 'Luna Tomato Paste (800g)',
                metricAr: 'نفاد الرف خلال 8 أيام',
                metricEn: '8-day shelf turnover',
                cat: 'معلبات ومخللات'
              }
            ].map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  const found = products.find((p) => p.category === item.cat);
                  if (found) onOpenProductComparison(found);
                }}
                className="text-start bg-[#F8FAFC] hover:bg-[#ECFDF5] p-3.5 rounded-xl border border-[#E5E7EB] hover:border-[#00A046]/40 transition-colors cursor-pointer space-y-1"
              >
                <div className="text-[11px] font-semibold text-[#6B7280]">
                  {isAr ? item.rankAr : item.rankEn}
                </div>
                <div className="font-bold text-[#111827] leading-snug">
                  {isAr ? item.titleAr : item.titleEn}
                </div>
                <div className="text-[11px] text-[#00A046] font-bold pt-0.5 tabular-nums">
                  {isAr ? item.metricAr : item.metricEn}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Platform Advertising & Revenue Portal Banner (5 cols) */}
        <div className="lg:col-span-5 bg-[#111827] text-white rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#FFE600] text-xs font-bold">
              <Megaphone className="w-4 h-4" />
              <span>
                {isAr ? 'بوابة الإعلانات التجارية والعائد للمنصة' : 'Platform Sponsorship & Ad Placements'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black leading-snug">
              {isAr
                ? 'هل أنت مورد أو مصنع؟ روّج لعروضك بالبنرات والفيديو أمام آلاف المتاجر'
                : 'Supplier or Manufacturer? Promote Your Offers With Banners & Video'}
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              {isAr
                ? 'باقات إعلانية مدفوعة (بانر رئيسي، فيديو تفاعلي، باقات ممولة) ترفع مبيعات الجملة وتحقق عوائد متنامية للمنصة.'
                : 'Paid hero banners, interactive factory videos, and sponsored pallet placements built to grow wholesale volume.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
            <div className="text-xs">
              <span className="text-gray-400 block">
                {isAr ? 'تبدأ الباقات الإعلانية من' : 'Campaign packages from'}
              </span>
              <span className="text-base font-black text-[#FFE600] tabular-nums">
                {formatCurrency(125000, currency, language)}{' '}
                <span className="text-[11px] font-normal text-gray-300">
                  / {isAr ? 'أسبوع' : 'week'}
                </span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setAdBookingConfirmation(null);
                setIsAdModalOpen(true);
              }}
              className="px-4 py-2.5 bg-[#FFE600] hover:bg-[#F5DC00] text-[#111827] rounded-xl text-xs font-black transition-colors cursor-pointer whitespace-nowrap"
            >
              {isAr ? 'احجز مساحة إعلانية' : 'Book Ad Placement'}
            </button>
          </div>
        </div>
      </section>

      {/* 8. AD SLOT BOOKING MODAL (MONETIZATION WORKFLOW) */}
      {isAdModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsAdModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-[#E5E7EB] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#111827]">
                  {isAr
                    ? 'حجز باقة ترويج وإعلان في صفحة الصفقات'
                    : 'Book Sponsored Placement on Deals Hub'}
                </h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  {isAr
                    ? 'اختر نوع الظهور (بانر، فيديو، باقة ممولة) والمدة لعرض التكلفة وتأكيد الحجز'
                    : 'Select placement format and duration to calculate fee and submit campaign'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAdModalOpen(false)}
                aria-label={isAr ? 'إغلاق' : 'Close'}
                className="w-8 h-8 rounded-lg bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center text-[#374151] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {adBookingConfirmation ? (
              <div className="p-6 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#00A046] flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-black text-[#111827]">
                  {isAr ? 'تم استلام طلب الحملة الإعلانية بنجاح!' : 'Campaign Booking Confirmed!'}
                </h4>
                <p className="text-xs sm:text-sm text-[#4B5563] max-w-md mx-auto">
                  {isAr
                    ? `رقم المرجع: ${adBookingConfirmation.ref} · الباقة: ${adBookingConfirmation.packageName}. سيتواصل فريق حسابات الموردين لتفعيل المواد الإعلانية.`
                    : `Reference: ${adBookingConfirmation.ref} · Package: ${adBookingConfirmation.packageName}. Our B2B media desk will activate your creative assets.`}
                </p>
                <div className="inline-block px-5 py-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-sm font-black text-[#00A046] tabular-nums">
                  {isAr ? 'قيمة الحملة المقررة: ' : 'Campaign Total: '}
                  {formatCurrency(adBookingConfirmation.totalIQD, currency, language)}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setIsAdModalOpen(false)}
                    className="px-6 py-2.5 bg-[#00A046] text-white rounded-xl text-xs font-bold hover:bg-[#008A3C] cursor-pointer"
                  >
                    {isAr ? 'العودة لصفحة الصفقات' : 'Return to Deals'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAdBookingSubmit} className="p-5 space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#111827]">
                    {isAr ? '1. اختر باقة الظهور الإعلاني:' : '1. Choose Ad Format:'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {AD_PACKAGES.map((pkg) => {
                      const active = pkg.id === selectedAdPkgId;
                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => setSelectedAdPkgId(pkg.id)}
                          className={`text-start p-3.5 rounded-xl border transition-colors cursor-pointer space-y-1.5 ${
                            active
                              ? 'border-[#00A046] bg-[#ECFDF5]'
                              : 'border-[#E5E7EB] bg-white hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <div className="text-xs font-black text-[#111827]">
                            {isAr ? pkg.nameAr : pkg.nameEn}
                          </div>
                          <div className="text-[11px] text-[#6B7280]">
                            {isAr ? pkg.placementAr : pkg.placementEn}
                          </div>
                          <div className="text-sm font-black text-[#00A046] tabular-nums pt-1">
                            {formatCurrency(pkg.weeklyPriceIQD, currency, language)}
                            <span className="text-[10px] font-normal text-[#6B7280]">
                              /{isAr ? 'أسبوع' : 'wk'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1.5 text-xs">
                  <div className="font-bold text-[#111827]">
                    {isAr ? 'مميزات الباقة المختارة:' : 'Included Deliverables:'}
                  </div>
                  <div className="text-[#00A046] font-semibold">
                    {isAr ? selectedAdPkg.estimatedReachAr : selectedAdPkg.estimatedReachEn}
                  </div>
                  <ul className="space-y-1 text-[#4B5563] pt-1">
                    {(isAr ? selectedAdPkg.includesAr : selectedAdPkg.includesEn).map((line, i) => (
                      <li key={i}>• {line}</li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1">
                      {isAr ? 'اسم الشركة أو المصنع *' : 'Company / Brand Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={adCompanyName}
                      onChange={(e) => setAdCompanyName(e.target.value)}
                      placeholder={isAr ? 'مثال: شركة دجلة للأغذية' : 'e.g., Dijla Food Co.'}
                      className="w-full px-3 py-2 text-xs border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#00A046]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1">
                      {isAr ? 'رقم هاتف التواصل *' : 'Contact Phone *'}
                    </label>
                    <input
                      type="tel"
                      required
                      value={adPhone}
                      onChange={(e) => setAdPhone(e.target.value)}
                      placeholder="0770 000 0000"
                      className="w-full px-3 py-2 text-xs border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#00A046]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1">
                      {isAr ? 'عنوان العرض أو المنتج الممول' : 'Campaign Headline'}
                    </label>
                    <input
                      type="text"
                      value={adCampaignTitle}
                      onChange={(e) => setAdCampaignTitle(e.target.value)}
                      placeholder={
                        isAr ? 'خصم 15% على كرتونات الزيت والأرز' : '15% off bulk rice & oil'
                      }
                      className="w-full px-3 py-2 text-xs border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#00A046]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1">
                      {isAr ? 'مدة الحملة (بالأسابيع)' : 'Campaign Duration'}
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 4].map((wk) => (
                        <button
                          key={wk}
                          type="button"
                          onClick={() => setAdDurationWeeks(wk)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                            adDurationWeeks === wk
                              ? 'bg-[#111827] text-white border-[#111827]'
                              : 'bg-white text-[#374151] border-[#E5E7EB]'
                          }`}
                        >
                          {wk} {isAr ? (wk === 1 ? 'أسبوع' : 'أسابيع') : wk === 1 ? 'Week' : 'Weeks'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
                  <div>
                    <div className="text-[11px] text-[#6B7280]">
                      {isAr ? 'إجمالي رسوم الإعلان للمنصة' : 'Estimated Platform Ad Fee'}
                    </div>
                    <div className="text-lg font-black text-[#00A046] tabular-nums">
                      {formatCurrency(selectedAdPkg.weeklyPriceIQD * adDurationWeeks, currency, language)}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#00A046] hover:bg-[#008A3C] text-white rounded-xl text-xs font-black transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {isAr ? 'تأكيد طلب الحجز' : 'Submit Ad Booking'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
