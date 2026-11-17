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
  Eye
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

const DEFAULT_RETAIL_CONSUMER_PRODUCTS = [
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
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80'
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
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80'
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
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80'
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
    imageUrl: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=400&q=80'
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
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80'
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
    imageUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=400&q=80'
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
    imageUrl: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=400&q=80'
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
    imageUrl: 'https://images.unsplash.com/photo-1544943910-4c1dc44a0b38?auto=format&fit=crop&w=400&q=80'
  },
  {
    barcode: '5000204890123-RET',
    productName: 'سائل مطهر ومعقم ديتول الأصلي لحماية المنزل (مفرد)',
    nameEn: 'Dettol Original Antiseptic Liquid 500ml',
    brand: 'ديتول العراق',
    category: 'منظفات وعناية',
    subCategory: 'منظفات ومطهرات',
    unit: 'قنينة مفردة (500 مل)',
    retailSellingPriceIQD: 4500,
    oldPrice: 5000,
    discountPercent: 10,
    stockQuantity: 50,
    rating: 5.0,
    reviewsCount: 230,
    imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=400&q=80'
  },
  {
    barcode: '8001250123456-RET',
    productName: 'معكرونة سباغيتي إيطالية باريلا رقم 5 (مفرد)',
    nameEn: 'Barilla Spaghetti No. 5 Pasta 500g',
    brand: 'باريلا',
    category: 'أرز وحبوب',
    subCategory: 'أرز ومواد تموينية',
    unit: 'كيس مفرد (500 غرام)',
    retailSellingPriceIQD: 1000,
    oldPrice: 1250,
    discountPercent: 20,
    stockQuantity: 65,
    rating: 4.8,
    reviewsCount: 142,
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80'
  },
  {
    barcode: '7613035123456-RET',
    productName: 'قهوة سريعة الذوبان كلاسيك نسكافيه أصلي (مفرد)',
    nameEn: 'Nescafe Classic Instant Coffee Jar 200g',
    brand: 'نسكافيه',
    category: 'سكر وحلويات',
    subCategory: 'حلويات وسكر وشاي',
    unit: 'مرطبان مفرد (200 غرام)',
    retailSellingPriceIQD: 6000,
    oldPrice: 6750,
    discountPercent: 11,
    stockQuantity: 30,
    rating: 4.9,
    reviewsCount: 180,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80'
  },
  {
    barcode: '6210009990001-RET',
    productName: 'طبق بيض مائدة محلي طازج كبير (مفرد)',
    nameEn: 'Fresh Farm Table Eggs Large Tray 30 Eggs',
    brand: 'مداجن بغداد الحديثة',
    category: 'ألبان وأجبان',
    subCategory: 'ألبان وأجبان تبريد',
    unit: 'طبقة منزلية (30 بيضة)',
    retailSellingPriceIQD: 6000,
    oldPrice: 6500,
    discountPercent: 8,
    stockQuantity: 40,
    rating: 4.9,
    reviewsCount: 310,
    imageUrl: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=400&q=80'
  },
  {
    barcode: '5410076000111-RET',
    productName: 'مسحوق غسيل أوتوماتيك مركز أريال (مفرد)',
    nameEn: 'Ariel Automatic Laundry Detergent Powder 1.5kg',
    brand: 'أريال',
    category: 'منظفات وعناية',
    subCategory: 'منظفات ومطهرات',
    unit: 'كيس منزلي (1.5 كغم)',
    retailSellingPriceIQD: 5500,
    oldPrice: 6250,
    discountPercent: 12,
    stockQuantity: 35,
    rating: 4.8,
    reviewsCount: 95,
    imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=400&q=80'
  },
  {
    barcode: '0130000012432-RET',
    productName: 'صلصة طماطم كاتشب هاينز الأصلية (مفرد)',
    nameEn: 'Heinz Classic Tomato Ketchup Squeeze 850g',
    brand: 'هاينز',
    category: 'معلبات ومخللات',
    subCategory: 'معلبات وصلصات',
    unit: 'عبوة ضغط مفردة (850 غرام)',
    retailSellingPriceIQD: 2500,
    oldPrice: 2850,
    discountPercent: 12,
    stockQuantity: 50,
    rating: 4.9,
    reviewsCount: 178,
    imageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80'
  },
  {
    barcode: '8690504123456-RET',
    productName: 'بسكويت شاي كلاسيك بيتي بور أولكر (مفرد)',
    nameEn: 'Ulker Petit Beurre Classic Tea Biscuits 800g',
    brand: 'أولكر',
    category: 'سكر وحلويات',
    subCategory: 'حلويات وسكر وشاي',
    unit: 'باكيت عائلي (800 غرام)',
    retailSellingPriceIQD: 1500,
    oldPrice: 1750,
    discountPercent: 14,
    stockQuantity: 70,
    rating: 4.7,
    reviewsCount: 120,
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80'
  },
  {
    barcode: '6281005554321-RET',
    productName: 'سمن نباتي نقي للطبخ شوكة ومعلقة (مفرد)',
    nameEn: 'Pure Vegetable Cooking Ghee Spoon & Fork 900g',
    brand: 'شوكة وملعقة',
    category: 'زيوت وسمن',
    subCategory: 'زيوت وسمن وطبخ',
    unit: 'علبة مفردة (900 غرام)',
    retailSellingPriceIQD: 3500,
    oldPrice: 4000,
    discountPercent: 12,
    stockQuantity: 25,
    rating: 4.7,
    reviewsCount: 68,
    imageUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=400&q=80'
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
    coverImageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80',
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
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
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
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
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
      image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=800&q=80',
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
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
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

  // Main Categories List with circular photos (ReadyGrocery style)
  const mainCategories = [
    {
      id: 'الكل',
      labelAr: 'جميع الأصناف',
      labelEn: 'All Items',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80'
    },
    {
      id: 'أرز وحبوب',
      labelAr: 'أرز ومواد تموينية',
      labelEn: 'Rice & Grains',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=150&q=80'
    },
    {
      id: 'زيوت وسمن',
      labelAr: 'زيوت وسمن وطبخ',
      labelEn: 'Oils & Ghee',
      image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=150&q=80'
    },
    {
      id: 'ألبان وأجبان',
      labelAr: 'ألبان وأجبان تبريد',
      labelEn: 'Dairy & Chilled',
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=150&q=80'
    },
    {
      id: 'معلبات ومخللات',
      labelAr: 'معلبات وصلصات',
      labelEn: 'Canned & Sauces',
      image: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=150&q=80'
    },
    {
      id: 'سكر وحلويات',
      labelAr: 'حلويات وسكر وشاي',
      labelEn: 'Sweets & Tea',
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=150&q=80'
    },
    {
      id: 'منظفات وعناية',
      labelAr: 'منظفات ومطهرات',
      labelEn: 'Cleaning & Care',
      image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=150&q=80'
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

  // Cart operations
  const handleAddToCart = (product: any) => {
    setB2cCart(prev => {
      const existing = prev.find(p => p.barcode === product.barcode);
      if (existing) {
        return prev.map(p => p.barcode === product.barcode ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, {
        barcode: product.barcode,
        name: product.productName,
        price: product.retailSellingPriceIQD,
        unit: product.unit,
        qty: 1,
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
            src={storeData?.coverImageUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80'}
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
                  src={storeData?.logoUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80'}
                  alt="Store Logo"
                  className="w-full h-full object-cover rounded-xl"
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

          {/* Action buttons: Enter Store / Store Management */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenStoreManagement && (
              <button
                onClick={onOpenStoreManagement}
                className="py-2.5 px-3.5 rounded-xl bg-[#221F1F] hover:bg-black text-white text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                title={isAr ? 'تعديل المنتجات والعروض والبنرات' : 'Manage Store'}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#FFE600]" />
                <span className="hidden sm:inline">{isAr ? 'إدارة المتجر والعروض' : 'Store Studio'}</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsStoreEntered(true);
                const el = document.getElementById('supermarket-catalog-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex-1 sm:flex-none py-2.5 px-5 rounded-xl bg-[#00A046] hover:bg-[#008A3C] text-white text-xs font-black shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isAr ? 'دخول وتصفح السوبرماركت 🛒' : 'Enter Supermarket 🛒'}</span>
            </button>
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

        {/* Retail / Single Items Assurance Banner */}
        <div className="bg-[#E8F8EE] border border-[#B3EBC8] rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#00A046] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
              🛍️
            </span>
            <div>
              <div className="font-black text-[#00A046] flex items-center gap-1.5">
                <span>{isAr ? 'قسم البيع بالمفرد (بالقطعة الواحدة) لزبائن المنازل' : 'Retail Consumer Store (Sold by Single Item)'}</span>
                <span className="bg-[#00A046] text-white text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">B2C مفرد</span>
              </div>
              <p className="text-[11px] text-[#221F1F]/80 mt-0.5">
                {isAr 
                  ? 'جميع الأسعار والكميات أدناه مخصصة للبيع بالقطعة الواحدة (مفرد) وليست كراتين جملة • اطلب بالقطعة ويصلك فوري لباب منزلك.'
                  : 'All items are sold strictly by single piece / retail unit, not wholesale cartons.'}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline bg-white border border-[#B3EBC8] text-[#00A046] px-2.5 py-1 rounded-xl text-[11px] font-black shrink-0">
            {isAr ? 'أسعار مفرد معتمدة' : 'Verified Retail Prices'}
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

        {/* 2.5 Products Grid (Blinkit + ReadyGrocery Card Design) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {filteredProducts.map((product) => {
            const inCartQty = getProductCartQty(product.barcode);
            const isFavorited = favoriteProductBarcodes.includes(product.barcode);

            return (
              <div
                key={product.barcode}
                className="bg-white rounded-2xl border border-[#E5E7EB] hover:border-[#00A046]/40 transition shadow-xs hover:shadow-md p-3 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Top Badges: Retail Single Piece Tag + Wishlist Heart Button */}
                <div className="flex items-center justify-between gap-1 mb-1 relative z-10">
                  <div className="flex items-center gap-1">
                    <span className="bg-[#E8F8EE] text-[#00A046] border border-[#B3EBC8] text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00A046] animate-pulse"></span>
                      <span>{isAr ? 'مفرد بالقطعة' : 'Single Item'}</span>
                    </span>
                    {product.discountPercent && (
                      <span className="bg-[#F84147] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-2xs">
                        -{product.discountPercent}%
                      </span>
                    )}
                  </div>

                  {/* Product Favorite Button (Heart) */}
                  <button
                    onClick={() => handleToggleProductFavorite(product.barcode)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition shadow-2xs cursor-pointer ${
                      isFavorited 
                        ? 'bg-rose-50 text-rose-600' 
                        : 'bg-white/80 hover:bg-gray-100 text-gray-400 hover:text-rose-500'
                    }`}
                    title={isAr ? 'إضافة للمفضلة' : 'Wishlist'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                </div>

                {/* Product Image with delivery speed tag */}
                <div className="relative h-32 sm:h-36 w-full flex items-center justify-center bg-gray-50/50 rounded-xl overflow-hidden my-1">
                  <img
                    src={product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'}
                    alt={product.productName}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Delivery time pill (Blinkit / ReadyGrocery style ⏱️ 20 mins) */}
                  <div className="absolute bottom-1 right-1 bg-white/95 backdrop-blur-xs border border-gray-200 text-gray-800 px-1.5 py-0.5 rounded-md text-[9px] font-bold flex items-center gap-1 shadow-2xs">
                    <Clock className="w-2.5 h-2.5 text-[#00A046]" />
                    <span>20 {isAr ? 'دقيقة' : 'mins'}</span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-1.5 mt-1 text-right flex-1">
                  
                  {/* Brand & Category */}
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span className="font-bold text-[#00A046] truncate max-w-[65%]">{product.brand}</span>
                    <span className="text-[9px] text-gray-400">45+ {isAr ? 'بيع' : 'sold'}</span>
                  </div>

                  {/* Title */}
                  <h4 className="text-xs font-black text-[#221F1F] leading-snug line-clamp-2 min-h-[32px]">
                    {product.productName}
                  </h4>

                  {/* Clear Packaging Unit Pill (مفرد) */}
                  <div className="flex items-center gap-1 bg-[#F4FBF6] border border-[#C6EEDB] rounded-lg px-2 py-0.5 w-fit">
                    <span className="text-[9.5px] text-gray-500 font-bold">{isAr ? 'العبوة:' : 'Pack:'}</span>
                    <span className="text-[10.5px] font-black text-[#00A046]">{product.unit}</span>
                  </div>
                </div>

                {/* Pricing & Add to Cart Controller */}
                <div className="pt-2 mt-1.5 border-t border-[#F5F5F5] flex items-center justify-between gap-1.5">
                  
                  {/* Price per single piece */}
                  <div>
                    <div className="text-xs sm:text-sm font-black text-[#00A046] tracking-tight flex items-baseline gap-1">
                      <span>
                        {currency === 'IQD' 
                          ? `${product.retailSellingPriceIQD.toLocaleString()} د.ع` 
                          : `$${(product.retailSellingPriceIQD / 1310).toFixed(2)}`}
                      </span>
                      <span className="text-[9px] text-gray-400 font-normal">{isAr ? 'مفرد' : '/pc'}</span>
                    </div>
                    {product.oldPrice && (
                      <div className="text-[10px] text-gray-400 line-through">
                        {product.oldPrice.toLocaleString()} د.ع
                      </div>
                    )}
                  </div>

                  {/* Interactive Add / Quantity Button */}
                  {inCartQty === 0 ? (
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="px-2.5 py-1.5 rounded-xl bg-[#E8F8EE] hover:bg-[#00A046] text-[#00A046] hover:text-white font-black text-xs transition flex items-center gap-1 border border-[#B3EBC8] cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{isAr ? 'إضافة' : 'Add'}</span>
                    </button>
                  ) : (
                    <div className="flex items-center bg-[#00A046] text-white rounded-xl shadow-xs overflow-hidden">
                      <button
                        onClick={() => handleUpdateQty(product.barcode, -1)}
                        className="px-2 py-1.5 hover:bg-black/10 transition cursor-pointer"
                      >
                        <Minus className="w-3 h-3 stroke-[3]" />
                      </button>
                      <span className="px-2 font-black text-xs">{inCartQty}</span>
                      <button
                        onClick={() => handleUpdateQty(product.barcode, 1)}
                        className="px-2 py-1.5 hover:bg-black/10 transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3 stroke-[3]" />
                      </button>
                    </div>
                  )}

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
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'سوبرماركت المنصور المركزي',
                        text: 'تسوق احتياجات منزلك من سوبرماركت المنصور المركزي مع خدمة التوصيل السريع خلال 20 دقيقة',
                        url: `${window.location.origin}/store/${slug}`
                      });
                    } else {
                      navigator.clipboard.writeText(`${window.location.origin}/store/${slug}`);
                      showToast(isAr ? 'تم نسخ الرابط' : 'Link copied');
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

    </div>
  );
};
