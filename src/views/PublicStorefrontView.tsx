import React, { useState, useEffect, useMemo } from 'react';
import { 
  Store, 
  MapPin, 
  Phone, 
  ShoppingBag, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Truck, 
  ArrowRight,
  ArrowLeft,
  Clock,
  Heart,
  Share2,
  MessageCircle,
  Search,
  SlidersHorizontal,
  Star,
  Zap,
  ChevronLeft,
  ChevronRight,
  X,
  Flame,
  ShieldCheck,
  Copy,
  Sparkles,
  Filter,
  ArrowUpRight,
  Check,
  Layers,
  ArrowDown,
  Send,
  Eye,
  Package,
  Barcode,
  ChevronDown,
  ChevronUp,
  FileText,
  ShoppingCart,
  Maximize2
} from 'lucide-react';
import { Currency, Language } from '../types/index.ts';
import { formatCurrency } from '../utils/format.ts';
import { getLocalizedText } from '../utils/translations.ts';
import { fetchWithRetry } from '../utils/fetchWithRetry.ts';

interface PublicStorefrontViewProps {
  currency: Currency;
  slug?: string;
  onOpenStorePOS: () => void;
  onOpenStoreManagement?: () => void;
  onExitPreview?: () => void;
  isOwner?: boolean;
  language?: Language;
}

function sanitizeB2CImageUrl(url?: string, category?: string): string {
  const categoryFallbacks: Record<string, string> = {
    'زيوت وسمن': '/assets/images/white_sunflower_oil.jpg',
    'أرز وحبوب': '/assets/images/white_basmati_rice.jpg',
    'ألبان وأجبان': '/assets/images/white_milk_powder.jpg',
    'معلبات ومخللات': '/assets/images/white_tomato_paste.jpg',
    'سكر وحلويات': '/assets/images/unit_biscuits_pack.jpg',
    'منظفات وعناية': '/assets/images/white_cleaner_bottles.jpg'
  };
  const fallback = (category && categoryFallbacks[category]) || '/assets/images/white_basmati_rice.jpg';
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (
    !trimmed ||
    trimmed.includes('unsplash.com') ||
    trimmed.includes('carton_') ||
    trimmed.includes('product_white_sugar_50kg')
  ) {
    return fallback;
  }
  return trimmed;
}

const DEFAULT_RETAIL_CONSUMER_PRODUCTS = [
  {
    barcode: '6281004411223-RET',
    productName: 'زيت زيتون بكر ممتاز عصرة أولى أرز لبنان (مفرد)',
    nameEn: 'Extra Virgin Olive Oil Glass Bottle 750ml',
    brand: 'أرز لبنان بريميوم',
    category: 'زيوت وسمن',
    subCategory: 'زيوت وسمن وطبخ',
    unit: 'قنينة زجاجية مفردة (750 مل)',
    retailSellingPriceIQD: 9500,
    oldPrice: 11000,
    discountPercent: 14,
    stockQuantity: 34,
    rating: 4.9,
    reviewsCount: 142,
    imageUrl: '/assets/images/unit_olive_oil_bottle.jpg'
  },
  {
    barcode: '6210001234567-RET',
    productName: 'زيت دوار الشمس النقي عافية (مفرد)',
    nameEn: 'Pure Sunflower Cooking Oil Afia 1L',
    brand: 'عافية الفرات',
    category: 'زيوت وسمن',
    subCategory: 'زيوت وسمن وطبخ',
    unit: 'قارورة مفردة (1 لتر)',
    retailSellingPriceIQD: 3500,
    oldPrice: 4000,
    discountPercent: 12,
    stockQuantity: 45,
    rating: 4.9,
    reviewsCount: 112,
    imageUrl: '/assets/images/white_sunflower_oil.jpg'
  },
  {
    barcode: '6281007000123-RET',
    productName: 'أرز بسمتي هندي عنبر درجة أولى (مفرد)',
    nameEn: 'Amber Premium Indian Basmati Rice 2kg',
    brand: 'أبو خروف الذهبي',
    category: 'أرز وحبوب',
    subCategory: 'أرز ومواد تموينية',
    unit: 'كيس منزلي (2 كغم)',
    retailSellingPriceIQD: 4000,
    oldPrice: 4500,
    discountPercent: 11,
    stockQuantity: 30,
    rating: 4.8,
    reviewsCount: 154,
    imageUrl: '/assets/images/white_basmati_rice.jpg'
  },
  {
    barcode: '6281001234501-RET',
    productName: 'حليب بودرة كامل الدسم فوري الرافدين (مفرد)',
    nameEn: 'Full Cream Instant Milk Powder 400g',
    brand: 'الرافدين الذهبي',
    category: 'ألبان وأجبان',
    subCategory: 'ألبان وأجبان تبريد',
    unit: 'علبة مفردة (400 غرام)',
    retailSellingPriceIQD: 3250,
    oldPrice: 3750,
    discountPercent: 13,
    stockQuantity: 28,
    rating: 4.7,
    reviewsCount: 88,
    imageUrl: '/assets/images/white_milk_powder.jpg'
  },
  {
    barcode: '5201002345678-RET',
    productName: 'معجون طماطم تركي مركز لونا (مفرد)',
    nameEn: 'Turkish Double Concentrated Tomato Paste 800g',
    brand: 'لونا بغداد',
    category: 'معلبات ومخللات',
    subCategory: 'معلبات وصلصات',
    unit: 'علبة مفردة (800 غرام)',
    retailSellingPriceIQD: 1250,
    oldPrice: 1500,
    discountPercent: 16,
    stockQuantity: 60,
    rating: 4.9,
    reviewsCount: 210,
    imageUrl: '/assets/images/white_tomato_paste.jpg'
  },
  {
    barcode: '7622210123456-RET',
    productName: 'شاي سيلاني أسود كلاسيك فرط الكوزي (مفرد)',
    nameEn: 'Ceylon Black Tea Loose Leaf 400g',
    brand: 'شاي الكوزي سيلان',
    category: 'سكر وحلويات',
    subCategory: 'حلويات وسكر وشاي',
    unit: 'باكيت مفرد (400 غرام)',
    retailSellingPriceIQD: 3750,
    oldPrice: 4250,
    discountPercent: 12,
    stockQuantity: 35,
    rating: 4.9,
    reviewsCount: 165,
    imageUrl: '/assets/images/white_ceylon_tea.jpg'
  },
  {
    barcode: '6281008765432-RET',
    productName: 'سكر أبيض نقي مكرر الاتحاد (مفرد)',
    nameEn: 'Pure Refined White Cane Sugar 1kg',
    brand: 'الاتحاد التكرير',
    category: 'سكر وحلويات',
    subCategory: 'حلويات وسكر وشاي',
    unit: 'كيس منزلي (1 كغم)',
    retailSellingPriceIQD: 1500,
    oldPrice: 1750,
    discountPercent: 14,
    stockQuantity: 80,
    rating: 4.8,
    reviewsCount: 92,
    imageUrl: '/assets/images/white_sugar_pack.jpg'
  },
  {
    barcode: '3073780000001-RET',
    productName: 'جبنة بيضاء كريمية قابلة للدهن بريزيدن (مفرد)',
    nameEn: 'President Creamy Spreadable Cheese 200g',
    brand: 'بريزيدن',
    category: 'ألبان وأجبان',
    subCategory: 'ألبان وأجبان تبريد',
    unit: 'عبوة مفردة (200 غرام)',
    retailSellingPriceIQD: 2000,
    oldPrice: 2500,
    discountPercent: 20,
    stockQuantity: 25,
    rating: 4.8,
    reviewsCount: 74,
    imageUrl: '/assets/images/unit_cheese_tub.jpg'
  },
  {
    barcode: '6291001239999-RET',
    productName: 'تونة خفيفة قطع في زيت دوار الشمس المرجان (مفرد)',
    nameEn: 'Light Tuna Chunks in Sunflower Oil 185g',
    brand: 'المرجان الخليجي',
    category: 'معلبات ومخللات',
    subCategory: 'معلبات وصلصات',
    unit: 'علبة مفردة (185 غرام)',
    retailSellingPriceIQD: 1750,
    oldPrice: 2000,
    discountPercent: 12,
    stockQuantity: 40,
    rating: 4.7,
    reviewsCount: 65,
    imageUrl: '/assets/images/white_canned_goods.jpg'
  },
  {
    barcode: '5000300123456-RET',
    productName: 'سائل مطهر ومنظف للأسطح ديتول (مفرد)',
    nameEn: 'Dettol Original Antiseptic Liquid 500ml',
    brand: 'ديتول العراق',
    category: 'منظفات وعناية',
    subCategory: 'منظفات ومطهرات',
    unit: 'قارورة مفردة (500 مل)',
    retailSellingPriceIQD: 4500,
    oldPrice: 5000,
    discountPercent: 10,
    stockQuantity: 50,
    rating: 5.0,
    reviewsCount: 230,
    imageUrl: '/assets/images/white_cleaner_bottles.jpg'
  },
  {
    barcode: '8001234567890-RET',
    productName: 'معكرونة إسباغيتي فاخرة سنان (مفرد)',
    nameEn: 'Premium Spaghetti Pasta 500g',
    brand: 'سنان الإيطالية',
    category: 'أرز وحبوب',
    subCategory: 'أرز ومواد تموينية',
    unit: 'كيس مفرد (500 غرام)',
    retailSellingPriceIQD: 1000,
    oldPrice: 1250,
    discountPercent: 20,
    stockQuantity: 65,
    rating: 4.8,
    reviewsCount: 142,
    imageUrl: '/assets/images/white_pasta_pack.jpg'
  },
  {
    barcode: '7613035123456-RET',
    productName: 'قهوة سريعة التحضير نسكافيه كلاسيك (مفرد)',
    nameEn: 'Nescafe Classic Instant Coffee Jar 200g',
    brand: 'نسكافيه',
    category: 'سكر وحلويات',
    subCategory: 'حلويات وسكر وشاي',
    unit: 'مرطبان زجاجي (200 غرام)',
    retailSellingPriceIQD: 6000,
    oldPrice: 6750,
    discountPercent: 11,
    stockQuantity: 30,
    rating: 4.9,
    reviewsCount: 180,
    imageUrl: '/assets/images/white_instant_coffee.jpg'
  },
  {
    barcode: '6281009988776-RET',
    productName: 'طبقة بيض مائدة طازج عراقي مزارع الفرات (مفرد)',
    nameEn: 'Fresh Farm Table Eggs Large Tray 30 Eggs',
    brand: 'دواجن الفرات',
    category: 'ألبان وأجبان',
    subCategory: 'ألبان وأجبان تبريد',
    unit: 'طبقة (30 بيضة)',
    retailSellingPriceIQD: 6000,
    oldPrice: 6500,
    discountPercent: 8,
    stockQuantity: 40,
    rating: 4.9,
    reviewsCount: 310,
    imageUrl: '/assets/images/unit_eggs_tray.jpg'
  },
  {
    barcode: '4001234567891-RET',
    productName: 'مسحوق غسيل أوتوماتيك أريال لافندر (مفرد)',
    nameEn: 'Ariel Automatic Laundry Detergent Powder 1.5kg',
    brand: 'أريال',
    category: 'منظفات وعناية',
    subCategory: 'منظفات ومطهرات',
    unit: 'كيس مفرد (1.5 كغم)',
    retailSellingPriceIQD: 5500,
    oldPrice: 6250,
    discountPercent: 12,
    stockQuantity: 35,
    rating: 4.8,
    reviewsCount: 95,
    imageUrl: '/assets/images/white_cleaner_bottles.jpg'
  },
  {
    barcode: '013000001243-RET',
    productName: 'كاتشب طماطم طبيعي هاينز ضغط (مفرد)',
    nameEn: 'Heinz Classic Tomato Ketchup Squeeze 850g',
    brand: 'هاينز',
    category: 'معلبات ومخللات',
    subCategory: 'معلبات وصلصات',
    unit: 'عبوة ضغط (850 غرام)',
    retailSellingPriceIQD: 2500,
    oldPrice: 2850,
    discountPercent: 12,
    stockQuantity: 50,
    rating: 4.9,
    reviewsCount: 178,
    imageUrl: '/assets/images/unit_ketchup_bottle.jpg'
  },
  {
    barcode: '8690504123456-RET',
    productName: 'بسكويت شاي كلاسيك عائلي أولكر (مفرد)',
    nameEn: 'Ulker Tea Biscuits Family Pack 12x',
    brand: 'أولكر',
    category: 'سكر وحلويات',
    subCategory: 'حلويات وسكر وشاي',
    unit: 'باكيت مفرد (12 قطعة)',
    retailSellingPriceIQD: 1500,
    oldPrice: 1750,
    discountPercent: 14,
    stockQuantity: 70,
    rating: 4.7,
    reviewsCount: 120,
    imageUrl: '/assets/images/unit_biscuits_pack.jpg'
  },
  {
    barcode: '6281003322114-RET',
    productName: 'قهوة إسبريسو محمصة مطحونة مختصة (مفرد)',
    nameEn: 'Roasted Ground Espresso Coffee Pack 250g',
    brand: 'محمصة دجلة المختصة',
    category: 'سكر وحلويات',
    subCategory: 'حلويات وسكر وشاي',
    unit: 'عبوة مفردة (250 غرام)',
    retailSellingPriceIQD: 7500,
    oldPrice: 8500,
    discountPercent: 12,
    stockQuantity: 32,
    rating: 4.9,
    reviewsCount: 78,
    imageUrl: '/assets/images/white_espresso_coffee.jpg'
  }
];

export const PublicStorefrontView: React.FC<PublicStorefrontViewProps> = ({
  currency,
  slug = 'almansoor-market',
  onOpenStorePOS,
  onOpenStoreManagement,
  onExitPreview,
  isOwner = false,
  language = 'ar'
}) => {
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ChevronLeft : ChevronRight;

  // View state: 'entry' (Clean card with photo, logo, enter button) or 'store' (Full supermarket experience)
  const [isStoreEntered, setIsStoreEntered] = useState<boolean>(true);

  // Store data & products initialized with dedicated retail consumer grocery items
  const [storeData, setStoreData] = useState<any>({
    name: 'سوبرماركت المنصور المركزي',
    address: 'حي المنصور - شارع 14 رمضان - قرب ساحة الرواد',
    district: 'بغداد - الكرخ',
    phone: '+964 771 555 8899',
    coverImageUrl: '/assets/images/banner_dalil_hero.jpg',
    logoUrl: '/assets/images/unit_olive_oil_bottle.jpg',
    rating: 4.9,
    reviewsCount: 520,
    workingHoursAr: 'مفتوح الآن • 8:00 ص - 1:00 منتصف الليل',
    deliveryTimeMinutes: 20,
    minOrderIQD: 5000,
    deliveryFeeIQD: 2000,
    freeDeliveryThresholdIQD: 25000
  });
  const [products, setProducts] = useState<any[]>(DEFAULT_RETAIL_CONSUMER_PRODUCTS);
  const [loading, setLoading] = useState(false);

  // Wishlist & Favorites
  const [isStoreFavorited, setIsStoreFavorited] = useState(false);
  const [favoriteProductBarcodes, setFavoriteProductBarcodes] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<any | null>(null);
  const [detailSlideIndex, setDetailSlideIndex] = useState(0);
  const [isDetailInfoExpanded, setIsDetailInfoExpanded] = useState(false);
  const [detailQty, setDetailQty] = useState(1);
  const [detailAddedToast, setDetailAddedToast] = useState(false);
  const [isDetailLightboxOpen, setIsDetailLightboxOpen] = useState(false);
  const detailTouchStartXRef = React.useRef<number | null>(null);

  // In-app chat messages
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'store'; text: string; time: string }>>([
    {
      sender: 'store',
      text: isAr ? 'أهلاً بك في سوبرماركت المنصور المركزي! كيف يمكننا مساعدتك اليوم في تلبية طلبات منزلك؟' : 'Welcome to Al-Mansour Supermarket! How can we help with your grocery order today?',
      time: 'الآن'
    }
  ]);
  const [newChatMessage, setNewChatMessage] = useState('');

  // Cart State
  const [b2cCart, setB2cCart] = useState<{ barcode: string; name: string; price: number; unit: string; qty: number; imageUrl?: string }[]>([]);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'zaincash' | 'card'>('cash');
  const [orderComplete, setOrderComplete] = useState<any>(null);

  // Category & Filter Navigation (Blinkit + ReadyGrocery inspired)
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('الكل');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'deals' | 'popular' | 'express'>('all');

  // Animated Hero Banner Slider State (Synchronized with Store Owner changes)
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroBanners, setHeroBanners] = useState<any[]>([
    {
      id: 1,
      titleAr: '⚡ أسبوع التوفير الكبير في سوبرماركت المنصور',
      titleEn: '⚡ Super Savings Week at Al-Mansour Supermarket',
      descAr: 'خصومات تصل إلى 40% على الزيوت، الأرز، والمعلبات الأساسية',
      descEn: 'Up to 40% OFF on cooking oils, basmati rice, and pantry staples',
      badgeAr: 'خصم 40%',
      badgeEn: '40% OFF',
      badgeBg: 'bg-[#FFE600] text-gray-950',
      bgColor: 'from-emerald-700 via-emerald-800 to-green-950',
      image: '/assets/images/banner_dalil_hero.jpg',
      active: true
    },
    {
      id: 2,
      titleAr: '🥛 منتجات الألبان والأجبان الطازجة يومياً',
      titleEn: '🥛 Fresh Daily Dairy, Milk & Chilled Cheese',
      descAr: 'حليب، أجبان، زبدة، وقشطة طازجة من أفضل المزارع تصلك مبردة',
      descEn: 'Chilled delivery for farm milk, cheeses, butter, and cream',
      badgeAr: 'طازج مبرد',
      badgeEn: 'Fresh Chilled',
      badgeBg: 'bg-blue-500 text-white',
      bgColor: 'from-blue-700 via-blue-800 to-slate-900',
      image: '/assets/images/white_milk_powder.jpg',
      active: true
    },
    {
      id: 3,
      titleAr: '🧼 عروض النظافة والمطهرات وحماية المنزل',
      titleEn: '🧼 Complete Home Care & Disinfectant Deals',
      descAr: 'اشتري 2 واحصل على 1 مجاناً من منظفات ديتول ومساحيق الغسيل',
      descEn: 'Buy 2 Get 1 Free on disinfectants, surface cleaners & detergents',
      badgeAr: 'اشترِ 2 واحصل على 1',
      badgeEn: 'Buy 2 Get 1',
      badgeBg: 'bg-rose-500 text-white',
      bgColor: 'from-rose-700 via-rose-800 to-red-950',
      image: '/assets/images/white_cleaner_bottles.jpg',
      active: true
    },
    {
      id: 4,
      titleAr: '🚀 التوصيل فوري خلال 20 دقيقة لباب بيتك',
      titleEn: '🚀 Ultra-Fast Doorstep Delivery in 20 Minutes',
      descAr: 'خدمة التوصيل السريع متاحة لكافة أرجاء المنصور، اليرموك والكرخ',
      descEn: 'Fast delivery to Al-Mansoor, Yarmouk & Karkh districts',
      badgeAr: 'توصيل 20 دقيقة',
      badgeEn: '20 Min Delivery',
      badgeBg: 'bg-[#00A046] text-white',
      bgColor: 'from-amber-600 via-amber-700 to-orange-950',
      image: '/assets/images/banner_dalil_deals.jpg',
      active: true
    }
  ]);

  // Auto rotate banners every 4.5 seconds
  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroBanners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [heroBanners.length]);

  // Main Categories List with circular single-unit studio photos
  const mainCategories = [
    {
      id: 'الكل',
      labelAr: 'جميع الأصناف',
      labelEn: 'All Items',
      image: '/assets/images/unit_olive_oil_bottle.jpg'
    },
    {
      id: 'أرز وحبوب',
      labelAr: 'أرز ومواد تموينية',
      labelEn: 'Rice & Grains',
      image: '/assets/images/white_basmati_rice.jpg'
    },
    {
      id: 'زيوت وسمن',
      labelAr: 'زيوت وسمن وطبخ',
      labelEn: 'Oils & Ghee',
      image: '/assets/images/white_sunflower_oil.jpg'
    },
    {
      id: 'ألبان وأجبان',
      labelAr: 'ألبان وأجبان تبريد',
      labelEn: 'Dairy & Chilled',
      image: '/assets/images/unit_cheese_tub.jpg'
    },
    {
      id: 'معلبات ومخللات',
      labelAr: 'معلبات وصلصات',
      labelEn: 'Canned & Sauces',
      image: '/assets/images/white_tomato_paste.jpg'
    },
    {
      id: 'سكر وحلويات',
      labelAr: 'حلويات وسكر وشاي',
      labelEn: 'Sweets & Tea',
      image: '/assets/images/unit_biscuits_pack.jpg'
    },
    {
      id: 'منظفات وعناية',
      labelAr: 'منظفات ومطهرات',
      labelEn: 'Cleaning & Care',
      image: '/assets/images/white_cleaner_bottles.jpg'
    }
  ];

  // Fetch Store & Products
  useEffect(() => {
    const controller = new AbortController();
    fetchWithRetry(`/api/public/storefront/${slug}`, { signal: controller.signal, retries: 3 })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) {
          if (data.store) setStoreData(data.store);
          if (data.products && data.products.length > 0) {
            setProducts(data.products);
          }
          if (data.banners && data.banners.length > 0) {
            setHeroBanners(data.banners);
          }
        }
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          console.warn('Public storefront sync deferred:', err?.message || err);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [slug]);

  // Toast trigger helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle Store Favorite
  const handleToggleStoreFavorite = () => {
    setIsStoreFavorited(prev => {
      const next = !prev;
      showToast(next ? (isAr ? '❤️ تم إضافة المتجر إلى قائمة المتاجر المفضلة لديك' : '❤️ Added store to favorites') : (isAr ? 'تمت الإزالة من المفضلة' : 'Removed from favorites'));
      return next;
    });
  };

  // Toggle Product Favorite
  const handleToggleProductFavorite = (barcode: string) => {
    setFavoriteProductBarcodes(prev => {
      const exists = prev.includes(barcode);
      const next = exists ? prev.filter(b => b !== barcode) : [...prev, barcode];
      showToast(exists ? (isAr ? 'تمت إزالة المنتج من المفضلة' : 'Removed product from wishlist') : (isAr ? '❤️ تم حفظ المنتج في قائمة المفضلة' : '❤️ Product saved to wishlist'));
      return next;
    });
  };

  // Open Wholesale-style Retail Product Details Modal
  const openProductDetails = (product: any) => {
    setSelectedDetailProduct(product);
    setDetailSlideIndex(0);
    setIsDetailInfoExpanded(false);
    setIsDetailLightboxOpen(false);
    const existingQty = getProductCartQty(product.barcode);
    setDetailQty(existingQty > 0 ? existingQty : 1);
    setDetailAddedToast(false);
  };

  // Cart operations
  const handleAddToCart = (product: any, qtyToAdd: number = 1) => {
    setB2cCart(prev => {
      const existing = prev.find(p => p.barcode === product.barcode);
      if (existing) {
        return prev.map(p => p.barcode === product.barcode ? { ...p, qty: p.qty + qtyToAdd } : p);
      }
      return [...prev, {
        barcode: product.barcode,
        name: product.productName,
        price: product.retailSellingPriceIQD,
        unit: product.unit,
        qty: qtyToAdd,
        imageUrl: product.imageUrl
      }];
    });
  };

  const handleSetProductCartQty = (product: any, targetQty: number) => {
    setB2cCart(prev => {
      const existing = prev.find(p => p.barcode === product.barcode);
      if (targetQty <= 0) {
        return prev.filter(p => p.barcode !== product.barcode);
      }
      if (existing) {
        return prev.map(p => p.barcode === product.barcode ? { ...p, qty: targetQty } : p);
      }
      return [...prev, {
        barcode: product.barcode,
        name: product.productName,
        price: product.retailSellingPriceIQD,
        unit: product.unit,
        qty: targetQty,
        imageUrl: product.imageUrl
      }];
    });
  };

  const handleUpdateQty = (barcode: string, delta: number) => {
    setB2cCart(prev => {
      return prev.map(p => {
        if (p.barcode === barcode) {
          const newQty = p.qty + delta;
          return newQty > 0 ? { ...p, qty: newQty } : null;
        }
        return p;
      }).filter(Boolean) as any[];
    });
  };

  const getProductCartQty = (barcode: string) => {
    const item = b2cCart.find(i => i.barcode === barcode);
    return item ? item.qty : 0;
  };

  const cartTotal = b2cCart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartItemsCount = b2cCart.reduce((sum, i) => sum + i.qty, 0);

  // Send in-app chat message
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      text: newChatMessage.trim(),
      time: isAr ? 'الآن' : 'Just now'
    };
    setChatMessages(prev => [...prev, userMsg]);
    setNewChatMessage('');

    // Simulate instant automated supermarket assistant reply
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'store' as const,
          text: isAr ? 'شكراً لتواصلك معنا! طلبك قيد المتابعة من قِبل مسؤول قسم التوصيل وسيتواصل معك المندوب فوراً.' : 'Thank you! The supermarket delivery team has received your message and will update you shortly.',
          time: isAr ? 'الآن' : 'Just now'
        }
      ]);
    }, 1000);
  };

  // Submit Checkout Order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (b2cCart.length === 0) return;

    try {
      const res = await fetch('/api/store/pos-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: storeData?.id || 'store_almansoor',
          items: b2cCart.map(i => ({ barcode: i.barcode, quantity: i.qty })),
          totalIQD: cartTotal,
          paymentType: paymentMethod,
          customerName,
          customerPhone,
          customerAddress,
          deliveryType
        })
      });

      const data = await res.json();
      if (data.success) {
        setOrderComplete({
          orderNumber: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
          customerName: customerName || (isAr ? 'زبون محلي' : 'Local Customer'),
          total: cartTotal,
          deliveryType,
          paymentMethod
        });
        setB2cCart([]);
        setIsCheckoutOpen(false);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Subcategories extracted from products
  const availableSubcategories = useMemo(() => {
    const subs = new Set<string>();
    products.forEach(p => {
      if (p.subCategory) subs.add(p.subCategory);
    });
    return ['الكل', ...Array.from(subs)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = product.productName.toLowerCase().includes(q) || (product.nameEn && product.nameEn.toLowerCase().includes(q));
        const matchesBrand = product.brand && product.brand.toLowerCase().includes(q);
        const matchesCategory = product.category && product.category.toLowerCase().includes(q);
        if (!matchesName && !matchesBrand && !matchesCategory) return false;
      }

      // Main Category
      if (selectedMainCategory !== 'الكل') {
        const matchesMain = product.category.includes(selectedMainCategory) || selectedMainCategory.includes(product.category);
        if (!matchesMain) return false;
      }

      // Subcategory
      if (selectedSubCategory !== 'الكل') {
        if (product.subCategory !== selectedSubCategory) return false;
      }

      // Filter Tabs
      if (activeFilterTab === 'deals' && (!product.discountPercent || product.discountPercent <= 0)) {
        return false;
      }
      if (activeFilterTab === 'popular' && (product.rating || 0) < 4.8) {
        return false;
      }

      return true;
    });
  }, [products, searchQuery, selectedMainCategory, selectedSubCategory, activeFilterTab]);

  if (loading && !storeData) {
    return (
      <div className="p-16 text-center space-y-3 font-brand">
        <div className="w-10 h-10 border-4 border-[#00A046] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-bold text-gray-500">{isAr ? 'جاري فتح السوبرماركت...' : 'Loading supermarket...'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-brand pb-28">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#221F1F] text-white px-4 py-2 rounded-xl shadow-xl text-xs font-bold animate-bounce flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Isolated Consumer Storefront Owner Preview Bar */}
      {isOwner && (
        <div className="sticky top-2 z-30 bg-[#142018] text-white rounded-2xl p-3 px-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs border border-[#2C3E32]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#0B5D32] text-[#FFE600] flex items-center justify-center shrink-0 border border-white/10">
              <Eye className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-[#FFE600] flex items-center gap-2 truncate">
                <span className="truncate">
                  {isAr
                    ? 'معاينة متجر التوصيل للزبائن (B2C) · واجهة مستقلة'
                    : 'Customer Storefront Preview (B2C)'}
                </span>
              </div>
              <p className="text-[11px] text-white/75 mt-0.5 truncate">
                {isAr
                  ? 'هكذا يرى زبائنك متجر المفرد؛ تم فصل واجهة الجملة بالكامل.'
                  : 'You are viewing your public retail storefront isolated from B2B.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {onOpenStoreManagement && (
              <button
                type="button"
                onClick={onOpenStoreManagement}
                className="px-3 py-1.5 rounded-xl bg-[#0B5D32] hover:bg-[#094D29] text-white font-black text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{isAr ? 'إدارة المتجر' : 'Manage Store'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onExitPreview || onOpenStorePOS}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition cursor-pointer flex items-center gap-1.5"
            >
              {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
              <span>{isAr ? 'رجوع' : 'Exit Preview'}</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          1. CLEAN STORE ENTRANCE & IDENTITY CARD
          "يظهر فقط صورة المتجر وشعار وزر دخول للمتجر عندها يفتح متجر احترافي فيه معلومات تفصليه"
         ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-xs overflow-hidden transition-all duration-300">
        
        {/* Cover Photo Banner with Overlay */}
        <div className="relative h-48 sm:h-64 w-full bg-gray-100 overflow-hidden">
          <img
            src={storeData?.coverImageUrl || '/assets/images/banner_dalil_hero.jpg'}
            alt="Supermarket Storefront"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

          {/* Top badges on banner */}
          <div className="absolute top-3 right-3 left-3 flex items-center justify-between">
            <span className="bg-[#00A046] text-white text-[11px] font-black px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>{isAr ? 'توصيل فوري 20-30 دقيقة 🚀' : 'Fast 20-min Delivery 🚀'}</span>
            </span>

            {/* Quick Actions (Favorite & Share) */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleStoreFavorite}
                className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition shadow-xs cursor-pointer ${
                  isStoreFavorited 
                    ? 'bg-rose-500 text-white' 
                    : 'bg-white/80 hover:bg-white text-gray-800'
                }`}
                title={isAr ? 'حفظ في المفضلة' : 'Favorite Store'}
              >
                <Heart className={`w-4 h-4 ${isStoreFavorited ? 'fill-white stroke-white' : ''}`} />
              </button>

              <button
                onClick={() => setIsShareModalOpen(true)}
                className="w-9 h-9 rounded-full bg-white/80 hover:bg-white text-gray-800 backdrop-blur-md flex items-center justify-center transition shadow-xs cursor-pointer"
                title={isAr ? 'مشاركة المتجر' : 'Share Store'}
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Logo & Store Identity on bottom of banner */}
          <div className="absolute bottom-4 right-4 left-4 flex items-end justify-between gap-3">
            <div className="flex items-end gap-3.5">
              
              {/* Store Circular / Rounded Logo */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-1 border-4 border-white shadow-xl shrink-0 overflow-hidden">
                <img
                  src={storeData?.logoUrl || '/assets/images/unit_olive_oil_bottle.jpg'}
                  alt="Store Logo"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>

              <div className="text-white pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white drop-shadow-sm">
                    {storeData?.name || (isAr ? 'سوبرماركت المنصور المركزي' : 'Al-Mansour Supermarket')}
                  </h1>
                  <CheckCircle2 className="w-5 h-5 text-[#FFE600] shrink-0" />
                </div>
                
                <div className="flex items-center gap-2 text-xs text-white/90 mt-1">
                  <span className="flex items-center gap-1 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md font-bold">
                    <Star className="w-3.5 h-3.5 text-[#FFE600] fill-[#FFE600]" />
                    <span>4.9</span>
                    <span className="text-white/70">(520+ {isAr ? 'تقييم' : 'reviews'})</span>
                  </span>
                  <span>•</span>
                  <span className="text-[#FFE600] font-black">{isAr ? 'مفتوح الآن' : 'Open Now'}</span>
                </div>
              </div>

            </div>

            {/* In-app Contact Button */}
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="bg-white/90 hover:bg-white text-[#00A046] px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shadow-md flex items-center gap-1.5 shrink-0"
            >
              <MessageCircle className="w-4 h-4 text-[#00A046]" />
              <span className="hidden sm:inline">{isAr ? 'تواصل مع المتجر' : 'Contact Store'}</span>
            </button>
          </div>

        </div>

        {/* Store Info Details Row */}
        <div className="p-4 sm:p-5 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-[#F0F2F5]">
          
          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#00A046] shrink-0" />
              <span className="font-bold text-[#221F1F]">
                {storeData?.district} • {storeData?.address}
              </span>
            </div>
            
            <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{storeData?.workingHoursAr || 'ساعات العمل: 8:00 ص - 1:00 منتصف الليل'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isAr ? 'شحن مجاني للطلبات فوق 25,000 د.ع' : 'Free delivery over 25,000 IQD'}</span>
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* =========================================================================
          2. INSIDE THE SUPERMARKET STORE
          "سلايد متحرك وبنرات اعلانية وساعات العمل والعروض والفلاتر ومنتجات"
         ========================================================================= */}
      <div id="supermarket-catalog-section" className="space-y-6 pt-2">

        {/* 2.1 Animated Promotional Hero Banner Slider (سلايد متحرك وبنرات إعلانية) */}
        <div className="relative rounded-3xl overflow-hidden shadow-md">
          <div 
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(${isAr ? currentSlide * 100 : -currentSlide * 100}%)` }}
          >
            {heroBanners.map((banner) => (
              <div
                key={banner.id}
                className={`w-full shrink-0 relative p-6 sm:p-8 bg-gradient-to-r ${banner.bgColor} text-white flex flex-col justify-between min-h-[170px] sm:min-h-[210px] overflow-hidden`}
              >
                {/* Background Banner Image */}
                <img
                  src={banner.image}
                  alt={banner.titleAr}
                  className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay pointer-events-none"
                />

                <div className="relative z-10 max-w-lg space-y-2">
                  <span className={`inline-block text-[11px] font-black px-3 py-0.5 rounded-full shadow-xs ${banner.badgeBg}`}>
                    {isAr ? banner.badgeAr : banner.badgeEn}
                  </span>
                  <h2 className="text-lg sm:text-2xl font-black text-white leading-tight">
                    {isAr ? banner.titleAr : banner.titleEn}
                  </h2>
                  <p className="text-xs sm:text-sm text-white/90">
                    {isAr ? banner.descAr : banner.descEn}
                  </p>
                </div>

                <div className="relative z-10 mt-3 flex items-center justify-between">
                  <button 
                    onClick={() => setActiveFilterTab('deals')}
                    className="px-4 py-1.5 rounded-xl bg-white text-gray-900 font-black text-xs hover:bg-[#FFE600] transition cursor-pointer shadow-sm"
                  >
                    {isAr ? 'تسوق العروض الآن ←' : 'Shop Deals Now →'}
                  </button>
                  <span className="text-[11px] font-semibold text-white/80">
                    {isAr ? 'عروض حصرية لسكان المنصور' : 'Exclusive neighborhood deals'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Slider Pagination Dots (••••) */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {heroBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentSlide === idx ? 'w-6 bg-[#FFE600]' : 'w-2 bg-white/60 hover:bg-white'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Prev/Next arrows */}
          <button
            onClick={() => setCurrentSlide(prev => (prev === 0 ? heroBanners.length - 1 : prev - 1))}
            className="absolute top-1/2 -translate-y-1/2 right-3 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition cursor-pointer backdrop-blur-xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentSlide(prev => (prev + 1) % heroBanners.length)}
            className="absolute top-1/2 -translate-y-1/2 left-3 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition cursor-pointer backdrop-blur-xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Compact Delivery & Retail Price Strip */}
        <div className="bg-[#ECFDF5] border border-[#C6EEDB] rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className="w-4 h-4 text-[#00A046] shrink-0" />
            <span className="font-bold text-[#0F3D24] truncate">
              {isAr
                ? 'بيع مباشر بالقطعة · توصيل سريع خلال 20 دقيقة'
                : 'Single-item retail · 20 min fast delivery'}
            </span>
          </div>
          <span className="text-[11px] font-bold text-[#00A046] shrink-0 whitespace-nowrap">
            {isAr ? 'أسعار المحل' : 'Store Prices'}
          </span>
        </div>

        {/* 2.2 Main Categories Carousel (الأقسام الرئيسية مستوحى من ReadyGrocery) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-black text-[#221F1F] flex items-center gap-2">
              <span className="w-2 h-5 bg-[#00A046] rounded-full"></span>
              <span>{isAr ? 'الأقسام الرئيسية للسوبرماركت' : 'Main Supermarket Categories'}</span>
            </h3>
            <span className="text-xs text-[#00A046] font-bold">
              {isAr ? 'توصيل فوري لجميع الأقسام' : 'Express Delivery'}
            </span>
          </div>

          {/* Category Circle Cards Row */}
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-2 pt-1">
            {mainCategories.map((cat) => {
              const isSelected = selectedMainCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedMainCategory(cat.id);
                    setSelectedSubCategory('الكل');
                  }}
                  className={`flex flex-col items-center gap-2 p-2.5 rounded-2xl transition cursor-pointer shrink-0 min-w-[85px] group ${
                    isSelected
                      ? 'bg-emerald-50 text-[#00A046] ring-2 ring-[#00A046]'
                      : 'bg-white hover:bg-gray-50 text-gray-800 border border-[#E5E7EB]'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-full overflow-hidden p-0.5 border-2 transition-transform group-hover:scale-105 shadow-2xs ${
                    isSelected ? 'border-[#00A046]' : 'border-gray-200'
                  }`}>
                    <img
                      src={cat.image}
                      alt={cat.labelAr}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <span className={`text-[11px] font-bold text-center leading-tight whitespace-nowrap ${
                    isSelected ? 'text-[#00A046] font-black' : 'text-gray-700'
                  }`}>
                    {isAr ? cat.labelAr : cat.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2.3 Subcategories Bar (الأقسام الفرعية مستوحى من Blinkit) */}
        {availableSubcategories.length > 1 && (
          <div className="bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl p-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[11px] font-black text-gray-500 uppercase px-1 shrink-0 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#00A046]" />
              <span>{isAr ? 'الأقسام الفرعية:' : 'Subcategories:'}</span>
            </span>

            {availableSubcategories.map((sub, sIdx) => {
              const isSubSelected = selectedSubCategory === sub;
              return (
                <button
                  key={sIdx}
                  onClick={() => setSelectedSubCategory(sub)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    isSubSelected
                      ? 'bg-[#00A046] text-white shadow-xs font-black'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-[#E5E7EB]'
                  }`}
                >
                  {sub === 'الكل' ? (isAr ? 'الكل' : 'All') : sub}
                </button>
              );
            })}
          </div>
        )}

        {/* 2.4 Professional Search & Filter Tabs */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-3 sm:p-4 shadow-xs space-y-3">
          
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder={isAr 
                ? 'ابحث في سوبرماركت المنصور عن قهوة، حليب، زيت، صابون، أو أي منتج...' 
                : 'Search Al-Mansour Supermarket for milk, coffee, oil, soap...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-[#F5F5F5] border border-transparent rounded-xl py-2.5 ${
                isAr ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'
              } text-xs sm:text-sm text-[#221F1F] placeholder-gray-400 focus:bg-white focus:border-[#00A046] focus:outline-hidden transition`}
            />
            <Search className={`w-4 h-4 text-gray-400 absolute ${isAr ? 'right-3.5' : 'left-3.5'} top-3.5`} />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute ${isAr ? 'left-3' : 'right-3'} top-3 text-gray-400 hover:text-gray-600`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pt-1">
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setActiveFilterTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  activeFilterTab === 'all'
                    ? 'bg-[#221F1F] text-white'
                    : 'bg-[#F5F5F5] text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isAr ? 'جميع المنتجات' : 'All Products'}
              </button>

              <button
                onClick={() => setActiveFilterTab('deals')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                  activeFilterTab === 'deals'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-[#F5F5F5] text-rose-600 hover:bg-rose-50'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>{isAr ? 'عروض وتخفيضات ⚡' : 'Deals & Discounts'}</span>
              </button>

              <button
                onClick={() => setActiveFilterTab('popular')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                  activeFilterTab === 'popular'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-[#F5F5F5] text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>{isAr ? 'الأكثر طلباً' : 'Popular'}</span>
              </button>
            </div>

            <span className="text-[11px] font-bold text-gray-400 shrink-0">
              {filteredProducts.length} {isAr ? 'منتج متوفر' : 'items'}
            </span>
          </div>

        </div>

        {/* 2.5 Clean Low-Text Product Grid (Aligned with Main Wholesale ProductCard) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-3.5">
          {filteredProducts.map((product) => {
            const inCartQty = getProductCartQty(product.barcode);
            const isFavorited = favoriteProductBarcodes.includes(product.barcode);
            const cleanTitle = isAr
              ? product.productName.replace(/\s*\(مفرد\)\s*$/g, '').trim()
              : product.nameEn || product.productName;
            const cleanUnit = isAr
              ? (product.unit || '').replace(/\s*مفردة\s*/g, ' ').replace(/\s+/g, ' ').trim()
              : getLocalizedText(product.unit || '', 'en');
            const rating = product.rating || 4.8;
            const reviewsCount = product.reviewsCount || 85;
            const hasDiscount = Boolean(product.discountPercent && product.discountPercent > 0);

            return (
              <div
                key={product.barcode}
                onClick={() => openProductDetails(product)}
                className="group rounded-2xl border border-[#E5E7EB] hover:border-[#00A046]/60 bg-white p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-6px_rgba(0,160,70,0.16),0_2px_8px_-2px_rgba(15,23,42,0.06)]"
              >
                {/* Clean Pure White Square Image Stage */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white p-2 mb-2.5">
                  <img
                    src={sanitizeB2CImageUrl(product.imageUrl, product.category)}
                    alt={cleanTitle}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {hasDiscount && (
                    <span className="absolute top-2 start-2 bg-[#F84147] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow-xs tabular-nums">
                      -{product.discountPercent}%
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleProductFavorite(product.barcode);
                    }}
                    aria-label={isAr ? 'إضافة للمفضلة' : 'Toggle favorite'}
                    className="absolute top-2 end-2 w-7 h-7 rounded-full bg-white/90 hover:bg-white backdrop-blur-xs border border-black/5 shadow-xs flex items-center justify-center transition cursor-pointer"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 transition ${
                        isFavorited
                          ? 'fill-[#FFA300] text-[#FFA300]'
                          : 'text-[#6B7280] hover:text-[#FFA300] stroke-[2]'
                      }`}
                    />
                  </button>
                </div>

                {/* Minimal Product Info Body */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4
                      className="text-[#111827] text-[12.5px] sm:text-[13.5px] font-bold line-clamp-2 leading-snug mb-1.5 group-hover:text-[#00A046] transition-colors min-h-[35px]"
                      title={cleanTitle}
                    >
                      {cleanTitle}
                    </h4>

                    {(product.promoBadge || product.expiryDate) && (
                      <div className="flex items-center gap-1 flex-wrap mb-1 text-[10px]">
                        {product.promoBadge && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold truncate max-w-full">
                            {product.promoBadge}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Single Unboxed Rating & Delivery Line */}
                    <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] mb-1 tabular-nums">
                      <span className="inline-flex items-center gap-0.5 text-[#111827] font-bold shrink-0">
                        <Star className="w-3 h-3 fill-[#FFA800] text-[#FFA800]" />
                        <span>{rating.toFixed(1)}</span>
                      </span>
                      <span className="text-[#9CA3AF] shrink-0">({reviewsCount})</span>
                      <span className="text-[#D1D5DB]" aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-0.5 font-semibold text-[#008A3C] truncate">
                        <Zap className="w-2.5 h-2.5 fill-amber-400 text-amber-500 shrink-0" />
                        <span className="truncate">{isAr ? '20 د' : '20m'}</span>
                      </span>
                    </div>

                    {/* Clean Unboxed Packaging Line */}
                    <div className="flex items-center gap-1 text-[11px] text-[#6B7280] mb-2 min-w-0">
                      <Package className="w-3 h-3 text-[#00A046] shrink-0" />
                      <span className="truncate font-medium text-[#374151]">{cleanUnit}</span>
                    </div>
                  </div>

                  {/* Clean Bottom Price & Compact Add Button */}
                  <div className="mt-auto pt-2 border-t border-[#F1F5F9] flex items-center justify-between gap-1.5">
                    <div className="min-w-0">
                      {product.oldPrice && (
                        <div className="text-[10px] text-[#9CA3AF] line-through leading-none mb-0.5 font-mono tabular-nums truncate whitespace-nowrap">
                          {formatCurrency(product.oldPrice, currency, language)}
                        </div>
                      )}
                      <div
                        className={`text-[13px] sm:text-sm font-black font-mono tabular-nums leading-tight whitespace-nowrap ${
                          hasDiscount ? 'text-[#F84147]' : 'text-[#0F3D24]'
                        }`}
                      >
                        {formatCurrency(product.retailSellingPriceIQD, currency, language)}
                      </div>
                    </div>

                    {inCartQty === 0 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product, 1);
                        }}
                        className="h-8 px-2.5 rounded-xl bg-[#00A046] hover:bg-[#008A3C] active:scale-95 text-white font-bold text-[11px] sm:text-xs transition flex items-center justify-center gap-1 cursor-pointer shrink-0 whitespace-nowrap shadow-2xs"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{isAr ? 'أضف' : 'Add'}</span>
                      </button>
                    ) : (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="h-8 flex items-center bg-[#00A046] text-white rounded-xl shadow-xs overflow-hidden shrink-0"
                      >
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(product.barcode, -1)}
                          className="px-2 h-full hover:bg-black/10 transition cursor-pointer flex items-center justify-center"
                          aria-label={isAr ? 'إنقاص الكمية' : 'Decrease quantity'}
                        >
                          <Minus className="w-3 h-3 stroke-[3]" />
                        </button>
                        <span className="px-1.5 font-black text-xs tabular-nums">{inCartQty}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(product.barcode, 1)}
                          className="px-2 h-full hover:bg-black/10 transition cursor-pointer flex items-center justify-center"
                          aria-label={isAr ? 'زيادة الكمية' : 'Increase quantity'}
                        >
                          <Plus className="w-3 h-3 stroke-[3]" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto" />
            <h4 className="text-sm font-bold text-gray-700">
              {isAr ? 'لا توجد منتجات مطابقة في هذا القسم' : 'No products found'}
            </h4>
            <button
              onClick={() => {
                setSelectedMainCategory('الكل');
                setSelectedSubCategory('الكل');
                setSearchQuery('');
                setActiveFilterTab('all');
              }}
              className="px-4 py-2 bg-[#00A046] text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              {isAr ? 'عرض جميع المنتجات' : 'Reset Filters'}
            </button>
          </div>
        )}

      </div>

      {/* =========================================================================
          3. STICKY BOTTOM FLOATING CART BAR
         ========================================================================= */}
      {b2cCart.length > 0 && (
        <div className="fixed bottom-3 left-4 right-4 max-w-lg mx-auto z-40 bg-[#221F1F] text-white rounded-2xl p-3 shadow-2xl flex items-center justify-between border border-white/10 animate-slideInRight">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00A046] text-white flex items-center justify-center font-black shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{cartItemsCount} {isAr ? 'قطعة مفردة (منزلية)' : 'retail items'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFE600]"></span>
                <span className="text-[#FFE600] text-[11px] font-bold">{isAr ? 'توصيل فوري 20 د' : '20 min'}</span>
              </div>
              <div className="text-sm font-black text-white">
                {cartTotal.toLocaleString()} د.ع
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsCheckoutOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#00A046] hover:bg-[#008A3C] text-white font-black text-xs transition cursor-pointer shadow-md flex items-center gap-1.5"
          >
            <span>{isAr ? 'إتمام الطلب' : 'Checkout'}</span>
            <ArrowIcon className="w-4 h-4" />
          </button>

        </div>
      )}

      {/* =========================================================================
          4. IN-APP CHAT & CONTACT MODAL
          "وتواصل من خلال تطبيق"
         ========================================================================= */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col h-[520px] animate-fadeIn">
            
            {/* Modal Header */}
            <div className="bg-[#00A046] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    {isAr ? 'محادثة مباشرة مع السوبرماركت' : 'Supermarket Live Chat'}
                  </h3>
                  <p className="text-[10px] text-white/80">
                    {isAr ? 'خدمة الزبائن وتوصيل المنازل • متاح الآن' : 'Customer Support & Home Delivery'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions (Call & WhatsApp) */}
            <div className="bg-[#F8F9FA] px-4 py-2 border-b border-[#E9ECEF] flex items-center justify-around text-xs">
              <a
                href={`tel:${storeData?.phone}`}
                className="flex items-center gap-1.5 text-gray-700 hover:text-[#00A046] font-bold"
              >
                <Phone className="w-3.5 h-3.5 text-[#00A046]" />
                <span>{isAr ? 'اتصال بالهاتف' : 'Call Store'}</span>
              </a>
              <span className="text-gray-300">|</span>
              <a
                href={`https://wa.me/${storeData?.phone?.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-gray-700 hover:text-[#00A046] font-bold"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isAr ? 'واتساب مباشر' : 'WhatsApp'}</span>
              </a>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAFBFD]">
              {chatMessages.map((msg, mIdx) => (
                <div
                  key={mIdx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#00A046] text-white rounded-bl-xs'
                        : 'bg-white border border-[#E5E7EB] text-gray-800 rounded-br-xs shadow-2xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-gray-400 mt-0.5 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-[#E9ECEF] flex items-center gap-2">
              <input
                type="text"
                placeholder={isAr ? 'اكتب استفسارك أو طلبك هنا...' : 'Type your message...'}
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                className={`flex-1 bg-[#F5F5F5] border border-transparent rounded-xl py-2 px-3 text-xs text-gray-800 focus:bg-white focus:border-[#00A046] focus:outline-hidden ${isAr ? 'text-right' : 'text-left'}`}
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#00A046] text-white text-xs font-black hover:bg-[#008A3C] transition cursor-pointer"
              >
                {isAr ? 'إرسال' : 'Send'}
              </button>
            </form>

          </div>
        </div>
      )}

      {/* =========================================================================
          5. SHARE STORE MODAL
          "وزر مشاركة للمتجر"
         ========================================================================= */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 text-right shadow-2xl relative animate-fadeIn space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#221F1F]">
                {isAr ? 'مشاركة رابط المتجر' : 'Share Store Link'}
              </h3>
              <button onClick={() => setIsShareModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              {isAr 
                ? 'شارك رابط سوبرماركت المنصور مع عائلتك أو جيرانك للطلب المباشر والتوصيل السريع إلى باب المنزل.'
                : 'Share supermarket link with your family and neighbors.'}
            </p>

            {/* Copy link input */}
            <div className="bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl p-2.5 flex items-center justify-between gap-2">
              <span className="text-xs text-gray-600 font-mono truncate select-all">
                {window.location.origin}/store/{slug}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/store/${slug}`);
                  showToast(isAr ? 'تم نسخ الرابط بنجاح!' : 'Link copied!');
                  setIsShareModalOpen(false);
                }}
                className="px-3 py-1 bg-[#00A046] text-white text-xs font-bold rounded-lg cursor-pointer shrink-0"
              >
                {isAr ? 'نسخ' : 'Copy'}
              </button>
            </div>

            {/* Social Share Buttons */}
            <div className="pt-2 space-y-2">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`🛒 تسوق احتياجات منزلك من سوبرماركت المنصور المركزي في بغداد مع خدمة التوصيل الفوري لباب بيتك خلال 20 دقيقة 🚀:\n${window.location.origin}/store/${slug}`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-xs text-center transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>{isAr ? 'مشاركة عبر واتساب 💬' : 'Share on WhatsApp'}</span>
              </a>

              <div className="grid grid-cols-3 gap-2">
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}/store/${slug}`)}&text=${encodeURIComponent(`تسوق احتياجاتك من سوبرماركت المنصور مع توصيل فوري`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs text-center transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تيليجرام' : 'Telegram'}</span>
                </a>

                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/store/${slug}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 rounded-xl bg-[#1877F2] hover:bg-[#1565cf] text-white font-bold text-xs text-center transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <span className="font-bold">f</span>
                  <span>{isAr ? 'فيسبوك' : 'Facebook'}</span>
                </a>

                <button
                  type="button"
                  onClick={async () => {
                    const shareUrl = `${window.location.origin}/store/${slug}`;
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: 'سوبرماركت المنصور المركزي',
                          text: 'تسوق احتياجات منزلك من سوبرماركت المنصور المركزي مع خدمة التوصيل السريع خلال 20 دقيقة',
                          url: shareUrl
                        });
                      } catch (err: any) {
                        if (err?.name !== 'AbortError') {
                          try {
                            await navigator.clipboard.writeText(shareUrl);
                            showToast(isAr ? 'تم نسخ الرابط' : 'Link copied');
                          } catch {
                            // Ignore clipboard fallback errors
                          }
                        }
                      }
                    } else {
                      try {
                        await navigator.clipboard.writeText(shareUrl);
                        showToast(isAr ? 'تم نسخ الرابط' : 'Link copied');
                      } catch {
                        // Ignore clipboard errors
                      }
                    }
                    setIsShareModalOpen(false);
                  }}
                  className="py-2 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs text-center transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تطبيقات أخرى' : 'All Apps'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          6. CHECKOUT MODAL & ORDER CONFIRMATION
         ========================================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-right shadow-2xl relative max-h-[90vh] overflow-y-auto animate-fadeIn">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-black text-[#221F1F]">
                {isAr ? 'تأكيد طلب التوصيل المنزلي' : 'Confirm Home Delivery Order'}
              </h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-4">
              
              {/* Delivery Speed / Type */}
              <div className="bg-[#F8F9FA] p-1 rounded-xl flex items-center">
                <button
                  type="button"
                  onClick={() => setDeliveryType('delivery')}
                  className={`flex-1 py-2 text-xs font-black rounded-lg transition ${
                    deliveryType === 'delivery' ? 'bg-[#00A046] text-white shadow-xs' : 'text-gray-600'
                  }`}
                >
                  🚀 {isAr ? 'توصيل فوري لباب البيت (20 د)' : 'Express Delivery (20 min)'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup')}
                  className={`flex-1 py-2 text-xs font-black rounded-lg transition ${
                    deliveryType === 'pickup' ? 'bg-[#00A046] text-white shadow-xs' : 'text-gray-600'
                  }`}
                >
                  🏪 {isAr ? 'استلام ذاتي من المحل' : 'Self Pickup'}
                </button>
              </div>

              {/* Form Inputs */}
              <div className="space-y-2.5 text-xs text-right">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">{isAr ? 'الاسم الكريم:' : 'Your Name:'}</label>
                  <input
                    type="text"
                    required
                    placeholder={isAr ? 'مثال: أبو فهد' : 'e.g. Ali Ahmed'}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-gray-200 rounded-xl py-2 px-3 focus:bg-white focus:border-[#00A046] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">{isAr ? 'رقم الهاتف للتواصل وتأكيد الوصول:' : 'Phone Number:'}</label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    placeholder="077XXXXXXXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-gray-200 rounded-xl py-2 px-3 focus:bg-white focus:border-[#00A046] focus:outline-hidden"
                  />
                </div>

                {deliveryType === 'delivery' && (
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">{isAr ? 'عنوان المنزل بالتفصيل (المنصور):' : 'Delivery Address:'}</label>
                    <textarea
                      required
                      rows={2}
                      placeholder={isAr ? 'شارع 14 رمضان، زقاق 22، دار 15 قرب صيدلية...' : 'Street, Building, Apartment...'}
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full bg-[#F5F5F5] border border-gray-200 rounded-xl py-2 px-3 focus:bg-white focus:border-[#00A046] focus:outline-hidden"
                    />
                  </div>
                )}

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-gray-700 font-bold mb-1">{isAr ? 'طريقة الدفع:' : 'Payment Method:'}</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-2 rounded-xl text-center border font-bold text-xs ${
                        paymentMethod === 'cash' ? 'border-[#00A046] bg-emerald-50 text-[#00A046]' : 'border-gray-200'
                      }`}
                    >
                      💵 {isAr ? 'كاش عند الاستلام' : 'Cash on Delivery'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('zaincash')}
                      className={`p-2 rounded-xl text-center border font-bold text-xs ${
                        paymentMethod === 'zaincash' ? 'border-[#00A046] bg-emerald-50 text-[#00A046]' : 'border-gray-200'
                      }`}
                    >
                      📱 {isAr ? 'زين كاش' : 'ZainCash'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-2 rounded-xl text-center border font-bold text-xs ${
                        paymentMethod === 'card' ? 'border-[#00A046] bg-emerald-50 text-[#00A046]' : 'border-gray-200'
                      }`}
                    >
                      💳 {isAr ? 'بطاقة دفع' : 'Card'}
                    </button>
                  </div>
                </div>

              </div>

              {/* Order Summary */}
              <div className="bg-[#FAFBFD] border border-gray-100 rounded-xl p-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>{isAr ? 'مجموع المنتجات:' : 'Items total:'}</span>
                  <span className="font-bold text-gray-800">{cartTotal.toLocaleString()} د.ع</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>{isAr ? 'أجور التوصيل السريع:' : 'Delivery fee:'}</span>
                  <span className="font-bold text-[#00A046]">
                    {cartTotal > 25000 ? (isAr ? 'مجاني 🎉' : 'FREE 🎉') : '2,000 د.ع'}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-[#221F1F] pt-1.5 border-t border-gray-200">
                  <span>{isAr ? 'المجموع النهائي:' : 'Total:'}</span>
                  <span className="text-[#00A046]">
                    {(cartTotal + (cartTotal > 25000 ? 0 : 2000)).toLocaleString()} د.ع
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#00A046] hover:bg-[#008A3C] text-white font-black text-sm transition cursor-pointer shadow-md"
              >
                {isAr ? 'تأكيد وإرسال الطلب فوراً 🚀' : 'Confirm Order 🚀'}
              </button>

            </form>

          </div>
        </div>
      )}

      {/* Order Complete Success Receipt */}
      {orderComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl animate-fadeIn space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#00A046] flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <h3 className="text-lg font-black text-[#221F1F]">
              {isAr ? 'تم استلام طلبك بنجاح!' : 'Order Placed Successfully!'}
            </h3>

            <p className="text-xs text-gray-600 leading-relaxed">
              {isAr ? (
                <>
                  رقم طلبك <strong>{orderComplete.orderNumber}</strong>. دليفري سوبرماركت المنصور بدأ بتجهيز طلبك وسيصلك خلال 20-30 دقيقة.
                </>
              ) : (
                <>Order {orderComplete.orderNumber} confirmed. Delivery in 20-30 mins.</>
              )}
            </p>

            <button
              onClick={() => setOrderComplete(null)}
              className="w-full py-2.5 rounded-xl bg-[#00A046] text-white font-black text-xs cursor-pointer shadow-md"
            >
              {isAr ? 'متابعة التسوق' : 'Continue Shopping'}
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. WHOLESALE-STYLE PRODUCT DETAILS MODAL (Opens on card click)
         ========================================================================= */}
      {selectedDetailProduct && (() => {
        const dp = selectedDetailProduct;
        const dpName = isAr
          ? dp.productName.replace(/\s*\(مفرد\)\s*$/g, '').trim()
          : dp.nameEn || dp.productName;
        const dpUnit = isAr ? dp.unit : getLocalizedText(dp.unit || '', 'en');
        const dpRating = dp.rating || 4.8;
        const dpReviewsCount = dp.reviewsCount || 85;
        const dpDiscount = dp.discountPercent && dp.discountPercent > 0 ? dp.discountPercent : null;
        const dpFavorited = favoriteProductBarcodes.includes(dp.barcode);
        const dpInStock = (dp.stockQuantity ?? 0) > 0;
        const similarItems = products
          .filter((p) => p.barcode !== dp.barcode)
          .sort((a, b) => (a.category === dp.category ? -1 : 1) - (b.category === dp.category ? -1 : 1))
          .slice(0, 6);

        const slidesCount = 3;
        const nextSlide = () => setDetailSlideIndex((p) => (p + 1) % slidesCount);
        const prevSlide = () => setDetailSlideIndex((p) => (p - 1 + slidesCount) % slidesCount);

        return (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs sm:p-4"
            onClick={() => {
              setIsDetailLightboxOpen(false);
              setSelectedDetailProduct(null);
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full sm:max-w-3xl h-[96vh] sm:h-auto sm:max-h-[92vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-[#E5E7EB] font-brand"
            >
              {/* Sticky Top Header */}
              <div className="sticky top-0 z-20 bg-white border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedDetailProduct(null)}
                    className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#1F2328] transition cursor-pointer shrink-0"
                    aria-label={isAr ? 'رجوع' : 'Back'}
                  >
                    {isAr ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                  </button>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#1F2328] truncate">
                      {isAr
                        ? `التوصيل خلال ${storeData?.deliveryTimeMinutes || 20} دقيقة`
                        : `Delivery within ${storeData?.deliveryTimeMinutes || 20} mins`}
                    </div>
                    <div className="text-xs text-[#6B7280] truncate">
                      {storeData?.name || (isAr ? 'سوبرماركت المنصور المركزي' : 'Al-Mansour Supermarket')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleProductFavorite(dp.barcode)}
                    className="w-10 h-10 rounded-full hover:bg-amber-50 flex items-center justify-center transition cursor-pointer"
                    title={isAr ? 'حفظ في المفضلة' : 'Save to Wishlist'}
                  >
                    <Heart
                      className={`w-5 h-5 transition ${
                        dpFavorited ? 'fill-[#FFA300] text-[#FFA300]' : 'text-[#6B7280]'
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDetailProduct(null)}
                    className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#6B7280] transition cursor-pointer"
                    aria-label={isAr ? 'إغلاق' : 'Close'}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
                {/* 1. Multi-Slide Product Carousel */}
                <div className="bg-white border-b border-[#E5E7EB]">
                  <div
                    className="relative h-72 sm:h-88 w-full bg-linear-to-b from-[#F9FAFB] to-white flex items-center justify-center overflow-hidden select-none"
                    onTouchStart={(e) => {
                      detailTouchStartXRef.current = e.touches[0].clientX;
                    }}
                    onTouchEnd={(e) => {
                      if (detailTouchStartXRef.current === null) return;
                      const diff = e.changedTouches[0].clientX - detailTouchStartXRef.current;
                      detailTouchStartXRef.current = null;
                      if (Math.abs(diff) < 35) return;
                      if (isAr) {
                        if (diff > 0) nextSlide();
                        else prevSlide();
                      } else {
                        if (diff < 0) nextSlide();
                        else prevSlide();
                      }
                    }}
                  >
                    {dpDiscount && (
                      <span className="absolute top-3 start-3 z-10 bg-[#F84147] text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-xs tabular-nums">
                        -{dpDiscount}%
                      </span>
                    )}

                    {/* Stock Availability Visual Indicator Over Gallery Image */}
                    <div className="absolute top-3 end-3 z-10 flex items-center gap-1.5">
                      <div
                        data-testid="b2c-inline-gallery-stock-indicator"
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-2xs text-[11px] font-bold backdrop-blur-xs ${
                          dpInStock
                            ? 'bg-white/95 border-[#BBF7D0] text-[#0F3D24]'
                            : 'bg-white/95 border-gray-200 text-gray-600'
                        }`}
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            dpInStock
                              ? 'bg-[#00A046] ring-2 ring-[#00A046]/25'
                              : 'bg-gray-400 ring-2 ring-gray-300/60'
                          }`}
                        />
                        <span>
                          {dpInStock
                            ? isAr
                              ? 'متوفر حالياً'
                              : 'In Stock'
                            : isAr
                            ? 'بانتظار التوريد'
                            : 'Awaiting Supply'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsDetailLightboxOpen(true)}
                        aria-label={isAr ? 'فتح معرض الصور' : 'Open gallery'}
                        className="w-7 h-7 rounded-full bg-white/95 hover:bg-[#EFFAF3] border border-[#E5E7EB] shadow-2xs flex items-center justify-center text-[#0F3D24] transition cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Slide 0: Hero Showcase */}
                    {detailSlideIndex === 0 && (
                      <button
                        type="button"
                        onClick={() => setIsDetailLightboxOpen(true)}
                        aria-label={isAr ? 'فتح معرض صور المنتج' : 'Open product gallery'}
                        className="w-full h-full flex items-center justify-center px-6 pt-5 pb-12 sm:px-10 sm:pt-8 sm:pb-14 cursor-zoom-in"
                      >
                        <img
                          src={sanitizeB2CImageUrl(dp.imageUrl, dp.category)}
                          alt={dpName}
                          referrerPolicy="no-referrer"
                          className="max-h-full max-w-full object-contain drop-shadow-sm rounded-xl hover:scale-[1.02] transition-transform"
                        />
                      </button>
                    )}

                    {/* Slide 1: Packaging & Availability */}
                    {detailSlideIndex === 1 && (
                      <div className="w-full h-full flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 px-4 pt-4 pb-12 sm:p-10 sm:pb-14 bg-linear-to-br from-emerald-50/40 via-white to-slate-50">
                        <button
                          type="button"
                          onClick={() => setIsDetailLightboxOpen(true)}
                          className="w-28 h-28 sm:w-44 sm:h-44 bg-white rounded-2xl border border-[#E5E7EB] p-3 flex items-center justify-center shadow-xs shrink-0 cursor-zoom-in"
                        >
                          <img
                            src={sanitizeB2CImageUrl(dp.imageUrl, dp.category)}
                            alt={dpName}
                            referrerPolicy="no-referrer"
                            className="max-h-full max-w-full object-contain scale-105"
                          />
                        </button>
                        <div className="text-center sm:text-start max-w-xs space-y-1">
                          <div className="text-[11px] font-bold text-[#00A046]">
                            {isAr ? 'مواصفات العبوة والبيع المفرد' : 'Retail Packaging Specs'}
                          </div>
                          <div className="text-base sm:text-lg font-black text-[#1F2328]">{dpUnit}</div>
                          <div className="text-xs sm:text-sm text-[#4B5563]">
                            {isAr
                              ? `متوفر حالياً في السوبرماركت (${dp.stockQuantity || 25} عبوة جاهزة للتوصيل).`
                              : `${dp.stockQuantity || 25} units currently available for dispatch.`}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Slide 2: Verified Barcode & Brand */}
                    {detailSlideIndex === 2 && (
                      <div className="w-full h-full flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 px-4 pt-4 pb-12 sm:p-10 sm:pb-14 bg-linear-to-br from-slate-50 via-white to-blue-50/40">
                        <div className="w-36 h-32 sm:w-44 sm:h-44 bg-white rounded-2xl border border-[#E5E7EB] p-4 flex flex-col items-center justify-center shadow-xs shrink-0">
                          <Barcode className="w-12 h-12 sm:w-14 sm:h-14 text-[#1F2328]" />
                          <span className="font-mono text-xs font-bold text-[#1F2328] mt-1.5 tracking-wider">
                            {dp.barcode}
                          </span>
                        </div>
                        <div className="text-center sm:text-start max-w-xs space-y-1">
                          <div className="text-[11px] font-bold text-blue-700">
                            {isAr ? 'توثيق المنتج والجودة' : 'Verified Quality & Brand'}
                          </div>
                          <div className="text-sm sm:text-base font-bold text-[#1F2328] flex items-center justify-center sm:justify-start gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-[#00A046] shrink-0" />
                            <span>{isAr ? 'منتج أصلي محفوظ وفق معايير السلامة' : 'Authentic & Safely Stored'}</span>
                          </div>
                          <div className="text-xs text-[#6B7280]">
                            {isAr ? `العلامة: ${dp.brand}` : `Brand: ${dp.brand}`}
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={isAr ? nextSlide : prevSlide}
                      className="absolute left-3 bottom-2.5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#DCFCE7]/95 hover:bg-[#BBF7D0] border border-[#86EFAC] shadow-sm flex items-center justify-center text-[#16A34A] transition cursor-pointer"
                      aria-label={isAr ? 'الشريحة التالية' : 'Next'}
                    >
                      <ChevronLeft className="w-4.5 h-4.5" />
                    </button>
                    <button
                      type="button"
                      onClick={isAr ? prevSlide : nextSlide}
                      className="absolute right-3 bottom-2.5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#DCFCE7]/95 hover:bg-[#BBF7D0] border border-[#86EFAC] shadow-sm flex items-center justify-center text-[#16A34A] transition cursor-pointer"
                      aria-label={isAr ? 'الشريحة السابقة' : 'Prev'}
                    >
                      <ChevronRight className="w-4.5 h-4.5" />
                    </button>

                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full border border-[#E5E7EB] shadow-2xs">
                      {[0, 1, 2].map((idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setDetailSlideIndex(idx)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            detailSlideIndex === idx ? 'w-5 bg-[#00A046]' : 'w-1.5 bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Product Title & Structured Metadata */}
                <div className="bg-white px-4 sm:px-6 py-3.5 border-b border-[#E5E7EB]">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 text-[11px] sm:text-xs">
                      <span className="inline-flex items-center gap-1 text-[#00A046] font-bold whitespace-nowrap shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>{isAr ? 'منتج طازج مضمون' : 'Quality Guaranteed'}</span>
                      </span>
                      <span className="h-3 w-px bg-[#E5E7EB] shrink-0" aria-hidden="true" />
                      <span className="inline-flex items-center gap-1 font-semibold text-[#374151] whitespace-nowrap truncate">
                        <Clock className="w-3.5 h-3.5 text-[#00A046] shrink-0" />
                        <span>{isAr ? 'توصيل خلال 20 دقيقة' : '20 min delivery'}</span>
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs tabular-nums shrink-0 bg-[#FFFBEB] border border-amber-200/80 px-2 py-0.5 rounded-md">
                      <Star className="w-3.5 h-3.5 fill-[#FFA800] text-[#FFA800]" />
                      <strong className="text-[#111827]">{dpRating.toFixed(1)}</strong>
                      <span className="text-[#6B7280] text-[11px]">({dpReviewsCount})</span>
                    </span>
                  </div>

                  <h2 className="text-[17px] sm:text-xl font-extrabold text-[#111827] leading-snug tracking-tight">
                    {dpName}
                  </h2>

                  <div className="mt-2.5 flex items-center justify-between gap-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] px-3 py-2 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0 text-[#4B5563]">
                      <Package className="w-3.5 h-3.5 text-[#00A046] shrink-0" />
                      <span className="shrink-0">{isAr ? 'التعبئة:' : 'Pack:'}</span>
                      <strong className="text-[#111827] font-bold truncate">{dpUnit}</strong>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 text-[#6B7280] font-mono tabular-nums text-[11px] sm:text-xs">
                      <Barcode className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                      <span>{dp.barcode}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Expandable Product Info Accordion (matching main wholesale site) */}
                <div className="mt-2.5 px-3 sm:px-6 pt-0.5 space-y-2.5 pb-6">
                  <div
                    className={`rounded-xl overflow-hidden border transition-all duration-200 ${
                      isDetailInfoExpanded
                        ? 'border-sky-400/75 bg-gradient-to-br from-white via-[#EFF8FF] to-[#DBEFFE] shadow-sm'
                        : 'border-sky-200 bg-gradient-to-br from-white via-[#F4FAFF] to-[#E3F1FD]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setIsDetailInfoExpanded((p) => !p)}
                      className="w-full px-3 py-2.5 flex items-center justify-between gap-1.5 text-start cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-white/95 border border-sky-200 flex items-center justify-center shrink-0">
                          <FileText className="w-3.5 h-3.5 text-sky-600" />
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-[#111827] truncate">
                          {isAr ? 'عرض معلومات المنتج' : 'View Product Info'}
                        </span>
                        <span className="w-5 h-5 rounded-full bg-white/90 border border-sky-200 flex items-center justify-center shrink-0">
                          {isDetailInfoExpanded ? (
                            <ChevronUp className="w-3 h-3 text-sky-700" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-sky-800" />
                          )}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-sky-900 bg-white/90 border border-sky-200 px-2 py-0.5 rounded-md whitespace-nowrap shrink-0">
                        {dp.category}
                      </span>
                    </button>

                    {isDetailInfoExpanded && (
                      <div className="px-3.5 pb-3.5 pt-1">
                        <div className="p-3 rounded-xl bg-white/95 border border-sky-100 text-xs text-[#374151] grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          <div>
                            <span className="text-[#6B7280] block text-[11px]">{isAr ? 'العلامة التجارية' : 'Brand'}</span>
                            <strong className="text-[#111827]">{dp.brand}</strong>
                          </div>
                          <div>
                            <span className="text-[#6B7280] block text-[11px]">{isAr ? 'التوفر في الرف' : 'In Stock'}</span>
                            <strong className="text-[#00A046]">{dp.stockQuantity || 25} {isAr ? 'وحدة' : 'units'}</strong>
                          </div>
                          <div>
                            <span className="text-[#6B7280] block text-[11px]">{isAr ? 'البيع' : 'Sale Type'}</span>
                            <strong className="text-[#111827]">{isAr ? 'مفرد بالقطعة' : 'Single Retail'}</strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Store Delivery Assurance Box */}
                  <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] text-[#00A046] flex items-center justify-center shrink-0">
                        <Truck className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[#111827] truncate">
                          {storeData?.name || (isAr ? 'سوبرماركت المنصور المركزي' : 'Al-Mansour Supermarket')}
                        </div>
                        <div className="text-[11px] text-[#6B7280] truncate">
                          {isAr
                            ? 'توصيل مجاني للطلبات فوق 25,000 د.ع · الدفع عند الاستلام أو إلكترونياً'
                            : 'Free delivery over 25,000 IQD · Cash or digital pay'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Similar Store Products Strip */}
                  {similarItems.length > 0 && (
                    <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5 space-y-2.5">
                      <h4 className="text-xs sm:text-sm font-black text-[#111827]">
                        {isAr ? 'منتجات مشابهة قد تهمك' : 'Similar Products'}
                      </h4>
                      <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                        {similarItems.map((sim) => {
                          const simTitle = isAr
                            ? sim.productName.replace(/\s*\(مفرد\)\s*$/g, '').trim()
                            : sim.nameEn || sim.productName;
                          return (
                            <div
                              key={sim.barcode}
                              onClick={() => openProductDetails(sim)}
                              className="w-32 shrink-0 rounded-xl border border-[#E5E7EB] hover:border-[#00A046]/60 bg-white p-2 flex flex-col justify-between cursor-pointer transition"
                            >
                              <div className="h-20 w-full flex items-center justify-center mb-1.5">
                                <img
                                  src={sim.imageUrl}
                                  alt={simTitle}
                                  referrerPolicy="no-referrer"
                                  className="max-h-full max-w-full object-contain"
                                />
                              </div>
                              <div className="text-[11px] font-bold text-[#111827] line-clamp-2 leading-tight min-h-[28px]">
                                {simTitle}
                              </div>
                              <div className="mt-1.5 flex items-center justify-between gap-1">
                                <span className="text-[11px] font-black text-[#0F3D24] font-mono tabular-nums whitespace-nowrap">
                                  {formatCurrency(sim.retailSellingPriceIQD, currency, language)}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(sim, 1);
                                  }}
                                  className="w-6 h-6 rounded-lg bg-[#E8F8EE] hover:bg-[#00A046] text-[#00A046] hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky Bottom Add-to-Cart Bar (matching wholesale modal) */}
              <div className="sticky bottom-0 z-20 bg-white border-t border-[#E5E7EB] px-4 py-3 flex items-center justify-between gap-3 shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
                <div>
                  {dp.oldPrice && (
                    <div className="text-[11px] text-[#9CA3AF] line-through font-mono tabular-nums leading-none">
                      {formatCurrency(dp.oldPrice * detailQty, currency, language)}
                    </div>
                  )}
                  <div className="text-base sm:text-lg font-black text-[#0F3D24] font-mono tabular-nums whitespace-nowrap">
                    {formatCurrency(dp.retailSellingPriceIQD * detailQty, currency, language)}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center border border-[#E5E7EB] bg-[#F8FAFC] rounded-xl h-10 px-1">
                    <button
                      type="button"
                      onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-[#1F2328] cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-mono font-black text-sm tabular-nums">
                      {detailQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDetailQty((q) => Math.min(dp.stockQuantity || 50, q + 1))}
                      className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-[#1F2328] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleSetProductCartQty(dp, detailQty);
                      setDetailAddedToast(true);
                      setTimeout(() => setDetailAddedToast(false), 1500);
                    }}
                    className="h-10 px-4 sm:px-6 rounded-xl bg-[#00A046] hover:bg-[#008A3C] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm whitespace-nowrap"
                  >
                    {detailAddedToast ? (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>{isAr ? 'تم التحديث في السلة' : 'Updated in Cart'}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>{isAr ? 'أضف للسلة' : 'Add to Cart'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Dedicated B2C Fullscreen Gallery Lightbox */}
            {isDetailLightboxOpen && (
              <div
                data-testid="b2c-photo-gallery-lightbox"
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm p-2.5 sm:p-6 font-brand"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDetailLightboxOpen(false);
                }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-[#E5E7EB] flex flex-col max-h-[92vh]"
                >
                  <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between gap-2 bg-white">
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-extrabold text-[#111827] truncate">
                        {dpName}
                      </div>
                      <div className="text-[11px] font-semibold text-[#6B7280] tabular-nums">
                        {detailSlideIndex + 1} / {slidesCount}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDetailLightboxOpen(false)}
                      className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#6B7280] transition cursor-pointer shrink-0"
                      aria-label={isAr ? 'إغلاق المعرض' : 'Close gallery'}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="relative min-h-[280px] sm:min-h-[360px] bg-white flex items-center justify-center p-6 sm:p-8 select-none">
                    <div
                      data-testid="b2c-gallery-stock-indicator"
                      className={`absolute top-3 start-3 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-xs text-xs font-bold backdrop-blur-xs ${
                        dpInStock
                          ? 'bg-white/95 border-[#BBF7D0] text-[#0F3D24]'
                          : 'bg-white/95 border-gray-200 text-gray-600'
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          dpInStock
                            ? 'bg-[#00A046] ring-2 ring-[#00A046]/25'
                            : 'bg-gray-400 ring-2 ring-gray-300/60'
                        }`}
                      />
                      <span>
                        {dpInStock
                          ? isAr
                            ? 'متوفر حالياً'
                            : 'Currently Available'
                          : isAr
                          ? 'بانتظار التوريد'
                          : 'Awaiting Supply'}
                      </span>
                    </div>

                    <img
                      src={sanitizeB2CImageUrl(dp.imageUrl, dp.category)}
                      alt={dpName}
                      referrerPolicy="no-referrer"
                      className="max-h-[46vh] max-w-full object-contain rounded-xl"
                    />
                  </div>

                  {/* Bottom Controls Below Photo: Prev/Next Scroll Buttons, Back & Favorite */}
                  <div className="px-3 sm:px-5 py-3 bg-[#F8FAFC] border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        data-testid="b2c-gallery-prev-btn"
                        onClick={prevSlide}
                        className="h-10 px-3 sm:px-4 rounded-xl bg-[#DCFCE7] hover:bg-[#BBF7D0] border border-[#86EFAC] text-[#15803D] font-bold text-xs sm:text-sm flex items-center gap-1 transition cursor-pointer"
                      >
                        {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                        <span>{isAr ? 'السابق' : 'Prev'}</span>
                      </button>
                      <button
                        type="button"
                        data-testid="b2c-gallery-next-btn"
                        onClick={nextSlide}
                        className="h-10 px-3 sm:px-4 rounded-xl bg-[#DCFCE7] hover:bg-[#BBF7D0] border border-[#86EFAC] text-[#15803D] font-bold text-xs sm:text-sm flex items-center gap-1 transition cursor-pointer"
                      >
                        <span>{isAr ? 'التالي' : 'Next'}</span>
                        {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        data-testid="b2c-gallery-favorite-btn"
                        onClick={() => handleToggleProductFavorite(dp.barcode)}
                        className={`h-10 px-3 sm:px-4 rounded-xl border font-bold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer ${
                          dpFavorited
                            ? 'bg-[#FFFBEB] border-[#FCD34D] text-[#B45309]'
                            : 'bg-white hover:bg-amber-50 border-[#E5E7EB] text-[#374151]'
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 transition ${
                            dpFavorited ? 'fill-[#FFA300] text-[#FFA300]' : 'text-[#6B7280]'
                          }`}
                        />
                        <span>
                          {dpFavorited
                            ? isAr
                              ? 'مضاف للمفضلة'
                              : 'Favorited'
                            : isAr
                            ? 'إضافة للمفضلة'
                            : 'Add to Favorites'}
                        </span>
                      </button>

                      <button
                        type="button"
                        data-testid="b2c-gallery-back-btn"
                        onClick={() => setIsDetailLightboxOpen(false)}
                        className="h-10 px-3.5 sm:px-4 rounded-xl bg-[#0F3D24] hover:bg-[#0B2E1B] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      >
                        {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                        <span>{isAr ? 'رجوع' : 'Back'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

    </div>
  );
};
