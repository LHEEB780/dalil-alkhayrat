import React, { useState, useEffect } from 'react';
import {
  Store,
  ShoppingBag,
  Plus,
  Trash2,
  Check,
  X,
  Sparkles,
  Eye,
  Sliders,
  Percent,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Flame,
  RefreshCw,
  Search,
  ExternalLink,
  BarChart3,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Zap,
  Award,
  DollarSign,
  Share2,
  Copy,
  QrCode,
  Printer,
  Send,
  MessageCircle,
  CheckCheck,
  Receipt
} from 'lucide-react';
import { Currency, Language } from '../types/index.ts';
import { formatCurrency } from '../utils/format.ts';
import { fetchWithRetry } from '../utils/fetchWithRetry.ts';

interface StorefrontManagementViewProps {
  currency: Currency;
  language?: Language;
  onPreviewStorefront: () => void;
  onOpenStorePOS?: () => void;
  onOpenQRPoster?: () => void;
}

export const StorefrontManagementView: React.FC<StorefrontManagementViewProps> = ({
  currency,
  language = 'ar',
  onPreviewStorefront,
  onOpenStorePOS,
  onOpenQRPoster
}) => {
  const isAr = language === 'ar';
  const storeId = 'store_almansoor';

  // Navigation tab inside management studio - default to dashboard
  const [activeSubTab, setActiveSubTab] = useState<
    'dashboard' | 'share_marketing' | 'products' | 'promotions' | 'banners' | 'settings'
  >('dashboard');

  // Full state loaded from backend
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [storeData, setStoreData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);

  // Analytics Dashboard State
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsDays, setAnalyticsDays] = useState<number>(7);
  const [hoveredDay, setHoveredDay] = useState<any>(null);

  // Search & Filter in Products Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');

  // Inline delete confirmations (no window.confirm)
  const [confirmDeleteBarcode, setConfirmDeleteBarcode] = useState<string | null>(null);
  const [confirmDeleteBannerId, setConfirmDeleteBannerId] = useState<number | null>(null);

  // Modal: Add New Product
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductBrand, setNewProductBrand] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('زيوت وسمن');
  const [newProductUnit, setNewProductUnit] = useState('علبة مفردة (800 غرام)');
  const [newProductPrice, setNewProductPrice] = useState<number | ''>(2500);
  const [newProductDiscount, setNewProductDiscount] = useState<number | ''>('');
  const [newProductStock, setNewProductStock] = useState<number | ''>(30);
  const [newProductImageUrl, setNewProductImageUrl] = useState('');

  // Modal: Quick Promotion Maker
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [selectedPromoBarcode, setSelectedPromoBarcode] = useState('');
  const [promoDiscountPercent, setPromoDiscountPercent] = useState<number>(15);
  const [promoBadgeText, setPromoBadgeText] = useState('عرض خاص');

  // Modal: Add New Banner
  const [isAddBannerModalOpen, setIsAddBannerModalOpen] = useState(false);
  const [newBannerTitleAr, setNewBannerTitleAr] = useState('');
  const [newBannerDescAr, setNewBannerDescAr] = useState('');
  const [newBannerBadgeAr, setNewBannerBadgeAr] = useState('تخفيض 25%');
  const [newBannerBgColor, setNewBannerBgColor] = useState('from-[#0B5D32] via-[#0F6E3D] to-[#083E22]');
  const [newBannerImage, setNewBannerImage] = useState(
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'
  );

  // Editable Store Settings
  const [settingsName, setSettingsName] = useState('');
  const [settingsPhone, setSettingsPhone] = useState('');
  const [settingsAddress, setSettingsAddress] = useState('');
  const [settingsHours, setSettingsHours] = useState('');
  const [settingsDeliveryTime, setSettingsDeliveryTime] = useState(20);
  const [settingsDeliveryFee, setSettingsDeliveryFee] = useState(2000);
  const [settingsFreeThreshold, setSettingsFreeThreshold] = useState(25000);
  const [settingsAnnouncement, setSettingsAnnouncement] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Share & Marketing State for Store Owner
  const [isShareStoreModalOpen, setIsShareStoreModalOpen] = useState(false);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [customShareMessage, setCustomShareMessage] = useState('');
  const [targetCustomerPhone, setTargetCustomerPhone] = useState('');

  const storeSlug = storeData?.customDomainSlug || 'almansoor-market';
  const publicStoreUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/store/${storeSlug}`
      : `https://dalil-khayrat.iq/store/${storeSlug}`;

  const marketingTemplates = [
    {
      id: 'general',
      titleAr: 'قالب عام: التسوق المنزلي والتوصيل السريع خلال 20 دقيقة',
      titleEn: 'General: Home Groceries & Fast 20-min Delivery',
      tagAr: 'الأكثر استخداماً',
      tagEn: 'Most Popular',
      textAr: `تسوق الآن من سوبرماركت المنصور المركزي في بغداد!\nنوفر لك جميع المواد الغذائية، الألبان، المعلبات، والمنظفات بأسعار تنافسية مع خدمة التوصيل السريع لباب بيتك خلال 20 دقيقة.\nتصفح المنتجات واطلب مباشرة عبر الرابط:\n${publicStoreUrl}`,
      textEn: `Shop groceries from Al-Mansoor Central Supermarket in Baghdad! Fresh products delivered to your door in 20 mins.\nOrder online now: ${publicStoreUrl}`
    },
    {
      id: 'promotions',
      titleAr: 'قالب العروض والخصومات الأسبوعية',
      titleEn: 'Weekly Super Deals & Discounts',
      tagAr: 'عروض خاصة',
      tagEn: 'Special Deals',
      textAr: `عروض وتخفيضات كبرى في سوبرماركت المنصور المركزي!\nخصومات تصل حتى 25% على الزيوت، الألبان، والمعلبات ومساحيق الغسيل. اغتنم العروض وتسوق الآن أونلاين قبل نفاد الكمية:\n${publicStoreUrl}`,
      textEn: `Huge discounts up to 25% at Al-Mansoor Central Supermarket! Limited time offers on pantry essentials. Order now: ${publicStoreUrl}`
    },
    {
      id: 'free_delivery',
      titleAr: 'قالب التوصيل المجاني للحي والمنطقة',
      titleEn: 'Neighborhood Free Delivery Promotion',
      tagAr: 'خدمة الجيران',
      tagEn: 'Neighbors',
      textAr: `لأهالي حي المنصور، اليرموك والكرخ الكرام!\nاستمتعوا بخدمة التوصيل المجاني لكافة الطلبات من سوبرماركت المنصور المركزي. كل احتياجاتك تصلك طازجة وسريعة:\n${publicStoreUrl}`,
      textEn: `Free doorstep delivery for Al-Mansoor & Yarmouk neighbors from Al-Mansoor Supermarket! Order online: ${publicStoreUrl}`
    }
  ];

  const getActiveShareText = () => {
    if (customShareMessage.trim()) return customShareMessage.trim();
    return isAr
      ? marketingTemplates[selectedTemplateIndex]?.textAr
      : marketingTemplates[selectedTemplateIndex]?.textEn;
  };

  const handleCopyLink = async (textToCopy?: string) => {
    const text = textToCopy || publicStoreUrl;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedLink(true);
      showToast(isAr ? 'تم نسخ الرابط بنجاح! جاهز للإرسال' : 'Link copied to clipboard!');
      window.setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      showToast(isAr ? 'تم نسخ الرابط' : 'Link copied');
    }
  };

  const openExternalShare = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareWhatsApp = (customText?: string, phone?: string) => {
    const text = encodeURIComponent(customText || getActiveShareText());
    const cleanPhone = (phone || targetCustomerPhone).replace(/[^0-9]/g, '');
    let url = `https://api.whatsapp.com/send?text=${text}`;
    if (cleanPhone) {
      url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`;
    }
    openExternalShare(url);
  };

  const handleShareTelegram = (customText?: string) => {
    const text = encodeURIComponent(customText || getActiveShareText());
    openExternalShare(
      `https://t.me/share/url?url=${encodeURIComponent(publicStoreUrl)}&text=${text}`
    );
  };

  const handleShareFacebook = () => {
    openExternalShare(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicStoreUrl)}`
    );
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: storeData?.name || (isAr ? 'سوبرماركت المنصور المركزي' : 'Al-Mansoor Supermarket'),
          text: getActiveShareText(),
          url: publicStoreUrl
        });
      } catch {
        // User dismissed share dialog
      }
    } else {
      handleCopyLink();
    }
  };

  const handleOpenPosterStudio = () => {
    if (onOpenQRPoster) {
      onOpenQRPoster();
    } else {
      window.print();
    }
  };

  // Load Storefront Configuration & Analytics
  const loadStorefrontData = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const [dataRes, analyticsRes] = await Promise.all([
        fetchWithRetry(`/api/store/${storeId}/storefront/data`, { signal, retries: 3 }),
        fetchWithRetry(`/api/store/${storeId}/storefront/analytics?days=${analyticsDays}`, {
          signal,
          retries: 3
        })
      ]);

      if (dataRes.ok) {
        const data = await dataRes.json();
        if (data.success && data.data) {
          const d = data.data;
          setStoreData(d);
          setProducts(d.products || []);
          setBanners(d.banners || []);

          setSettingsName(d.name || '');
          setSettingsPhone(d.phone || '');
          setSettingsAddress(d.address || '');
          setSettingsHours(d.workingHoursAr || '');
          setSettingsDeliveryTime(d.deliveryTimeMinutes || 20);
          setSettingsDeliveryFee(d.deliveryFeeIQD || 2000);
          setSettingsFreeThreshold(d.freeDeliveryThresholdIQD || 25000);
          setSettingsAnnouncement(d.announcementAr || '');
        }
      }

      if (analyticsRes.ok) {
        const aData = await analyticsRes.json();
        if (aData.success && aData.data) {
          setAnalyticsData(aData.data);
        }
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        showToast(
          isAr
            ? 'تعذر تحميل بيانات المتجر مؤقتاً، يرجى المحاولة مرة أخرى'
            : 'Could not load storefront data, please retry'
        );
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadStorefrontData(controller.signal);
    return () => controller.abort();
  }, [analyticsDays]);

  // 1. ADD PRODUCT
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductPrice || !newProductUnit) {
      showToast(isAr ? 'يرجى ملء الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const res = await fetchWithRetry(`/api/store/${storeId}/storefront/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: newProductName,
          brand: newProductBrand || 'سوبرماركت المنصور',
          category: newProductCategory,
          unit: newProductUnit,
          retailSellingPriceIQD: Number(newProductPrice),
          discountPercent: newProductDiscount ? Number(newProductDiscount) : undefined,
          stockQuantity: Number(newProductStock) || 25,
          imageUrl: newProductImageUrl || undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          isAr
            ? 'تمت إضافة المنتج المفرد بنجاح وظهر في متجر الزبائن'
            : 'Product added successfully'
        );
        setIsAddProductModalOpen(false);
        setNewProductName('');
        setNewProductBrand('');
        setNewProductPrice(2500);
        setNewProductDiscount('');
        setNewProductImageUrl('');
        await loadStorefrontData();
      } else {
        showToast(data.message || (isAr ? 'تعذر حفظ المنتج' : 'Failed to save product'));
      }
    } catch (err: any) {
      showToast(err?.message || (isAr ? 'حدث خطأ في الاتصال' : 'Connection error'));
    } finally {
      setSaving(false);
    }
  };

  // 2. DELETE PRODUCT
  const handleDeleteProduct = async (barcode: string) => {
    try {
      const res = await fetchWithRetry(`/api/store/${storeId}/storefront/products/${barcode}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setConfirmDeleteBarcode(null);
        showToast(isAr ? 'تم حذف المنتج من متجر الزبائن' : 'Product removed');
        await loadStorefrontData();
      }
    } catch (err: any) {
      showToast(err?.message || (isAr ? 'حدث خطأ في الاتصال' : 'Connection error'));
    }
  };

  // 3. APPLY PROMOTION
  const handleApplyPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPromoBarcode) return;

    setSaving(true);
    try {
      const res = await fetchWithRetry(`/api/store/${storeId}/storefront/promotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: selectedPromoBarcode,
          discountPercent: promoDiscountPercent,
          promoBadge: promoBadgeText
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          isAr ? `تم تفعيل خصم ${promoDiscountPercent}% على المنتج بنجاح` : 'Promotion activated'
        );
        setIsPromoModalOpen(false);
        setSelectedPromoBarcode('');
        await loadStorefrontData();
      }
    } catch (err: any) {
      showToast(err?.message || (isAr ? 'حدث خطأ في الاتصال' : 'Connection error'));
    } finally {
      setSaving(false);
    }
  };

  // 4. ADD NEW BANNER
  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerTitleAr) return;

    setSaving(true);
    try {
      const res = await fetchWithRetry(`/api/store/${storeId}/storefront/banners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleAr: newBannerTitleAr,
          descAr: newBannerDescAr,
          badgeAr: newBannerBadgeAr,
          bgColor: newBannerBgColor,
          image: newBannerImage
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          isAr ? 'تم نشر البنر الإعلاني الجديد في واجهة المتجر بنجاح' : 'Banner created'
        );
        setIsAddBannerModalOpen(false);
        setNewBannerTitleAr('');
        setNewBannerDescAr('');
        await loadStorefrontData();
      }
    } catch (err: any) {
      showToast(err?.message || (isAr ? 'حدث خطأ في الاتصال' : 'Connection error'));
    } finally {
      setSaving(false);
    }
  };

  // 5. TOGGLE BANNER ACTIVE
  const handleToggleBanner = async (bannerId: number) => {
    const updated = banners.map((b) => (b.id === bannerId ? { ...b, active: !b.active } : b));
    try {
      const res = await fetchWithRetry(`/api/store/${storeId}/storefront/banners`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banners: updated })
      });
      const data = await res.json();
      if (data.success) {
        setBanners(updated);
        showToast(isAr ? 'تم تحديث حالة البنر' : 'Banner updated');
      }
    } catch {
      showToast(isAr ? 'تعذر تحديث حالة البنر' : 'Failed to update banner');
    }
  };

  // 6. DELETE BANNER
  const handleDeleteBanner = async (bannerId: number) => {
    const updated = banners.filter((b) => b.id !== bannerId);
    try {
      const res = await fetchWithRetry(`/api/store/${storeId}/storefront/banners`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banners: updated })
      });
      const data = await res.json();
      if (data.success) {
        setBanners(updated);
        setConfirmDeleteBannerId(null);
        showToast(isAr ? 'تم حذف البنر' : 'Banner deleted');
      }
    } catch {
      showToast(isAr ? 'تعذر حذف البنر' : 'Failed to delete banner');
    }
  };

  // 7. SAVE STORE SETTINGS
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetchWithRetry(`/api/store/${storeId}/storefront/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: settingsName,
          phone: settingsPhone,
          address: settingsAddress,
          workingHoursAr: settingsHours,
          deliveryTimeMinutes: settingsDeliveryTime,
          deliveryFeeIQD: settingsDeliveryFee,
          freeDeliveryThresholdIQD: settingsFreeThreshold,
          announcementAr: settingsAnnouncement
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(isAr ? 'تم حفظ معلومات وساعات عمل المتجر بنجاح' : 'Store settings saved');
        await loadStorefrontData();
      }
    } catch (err: any) {
      showToast(err?.message || (isAr ? 'حدث خطأ في الاتصال' : 'Connection error'));
    } finally {
      setSaving(false);
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName =
        p.productName.toLowerCase().includes(q) || (p.nameEn && p.nameEn.toLowerCase().includes(q));
      const matchBrand = p.brand && p.brand.toLowerCase().includes(q);
      if (!matchName && !matchBrand) return false;
    }
    if (selectedCategory !== 'الكل' && !p.category.includes(selectedCategory)) {
      return false;
    }
    return true;
  });

  const categoriesList = [
    'الكل',
    'زيوت وسمن',
    'أرز وحبوب',
    'ألبان وأجبان',
    'معلبات ومخللات',
    'سكر وحلويات',
    'منظفات وعناية'
  ];

  const activeDealsCount = products.filter((p) => p.discountPercent && p.discountPercent > 0).length;

  return (
    <div className="bg-[#F4F4EA] rounded-3xl border border-[#E2E6D7] p-3 sm:p-5 space-y-4 font-brand text-[#142018] pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#0B5D32] text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 border border-white/20">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#FDE047]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= TOP WORKSPACE HEADER (Matches POS Cashier) ================= */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#0B5D32] text-white flex items-center justify-center shadow-2xs shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-[#0B5D32] leading-tight">
                {isAr ? 'إدارة المتجر الإلكتروني والعروض' : 'Storefront & Offers Studio'}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#EBF4EE] border border-[#DCE5DC] text-[#0B5D32] text-[10px] font-black whitespace-nowrap">
                {isAr ? 'حساب المالك' : 'Owner'}
              </span>
            </div>
            <p className="text-[11px] text-[#5F7164] truncate mt-0.5">
              {isAr
                ? `${storeData?.name || 'سوبرماركت المنصور المركزي'} • تحكم مباشر في منتجات المفرد، الخصومات، وبنرات الواجهة`
                : 'Direct control over retail products, discounts, and storefront hero banners'}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenStorePOS && (
            <button
              type="button"
              onClick={onOpenStorePOS}
              className="min-h-[38px] px-3.5 py-2 rounded-full bg-white border border-[#DCE5DC] hover:border-[#0B5D32] text-[#142018] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            >
              <Receipt className="w-3.5 h-3.5 text-[#0B5D32]" />
              <span>{isAr ? 'كاشير المحل' : 'Store POS'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsShareStoreModalOpen(true)}
            className="min-h-[38px] px-3.5 py-2 rounded-full bg-white border border-[#DCE5DC] hover:border-[#0B5D32] text-[#0B5D32] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'مشاركة المتجر' : 'Share Store'}</span>
          </button>

          <button
            type="button"
            onClick={onPreviewStorefront}
            className="min-h-[38px] px-4 py-2 rounded-full bg-[#0B5D32] hover:bg-[#084726] text-white text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isAr ? 'معاينة متجر الزبائن' : 'Preview Store'}</span>
          </button>

          <button
            type="button"
            onClick={() => loadStorefrontData()}
            disabled={loading}
            className="w-9 h-9 rounded-full bg-white border border-[#DCE5DC] hover:border-[#0B5D32] flex items-center justify-center text-[#3D5244] transition cursor-pointer shrink-0"
            title={isAr ? 'تحديث البيانات' : 'Refresh'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* ================= QUICK STORE SHARE BANNER (Deep Forest Green POS Card) ================= */}
      <div className="bg-[#0B5D32] rounded-2xl p-4 sm:p-5 text-white shadow-sm relative overflow-hidden border border-[#094D29]">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/12 border border-white/15 text-[#FDE047] flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black leading-snug">
                  {isAr
                    ? 'رابط متجرك الإلكتروني جاهز للنشر واستقطاب الزبائن'
                    : 'Your Storefront Link is Ready to Share'}
                </h2>
                <span className="bg-[#FDE047] text-[#142018] text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap">
                  {isAr ? 'توصيل 20 دقيقة' : '20m Delivery'}
                </span>
              </div>
              <p className="text-xs text-white/80 mt-1 leading-relaxed max-w-2xl">
                {isAr
                  ? 'شارك الرابط في مجموعات واتساب لسكان حي المنصور واليرموك لتلقي الطلبات أونلاين، أو اطبع باركود QR لطاولة الكاشير.'
                  : 'Share your direct storefront link on WhatsApp groups and social channels, or print your in-store QR poster.'}
              </p>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleShareWhatsApp()}
              className="min-h-[40px] flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#1FB858] text-white text-xs font-black transition cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>{isAr ? 'إرسال لواتساب' : 'WhatsApp'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopyLink()}
              className={`min-h-[40px] flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap border ${
                copiedLink
                  ? 'bg-[#FDE047] text-[#142018] border-[#FDE047]'
                  : 'bg-white/12 hover:bg-white/20 text-white border-white/20'
              }`}
            >
              {copiedLink ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? (isAr ? 'تم النسخ' : 'Copied') : isAr ? 'نسخ الرابط' : 'Copy Link'}</span>
            </button>

            <button
              type="button"
              onClick={() => (onOpenQRPoster ? onOpenQRPoster() : setActiveSubTab('share_marketing'))}
              className="min-h-[40px] flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white hover:bg-[#F4F4EA] text-[#0B5D32] text-xs font-black transition cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <QrCode className="w-4 h-4" />
              <span>{isAr ? 'بوستر ومركز QR' : 'QR Studio'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= MAIN SUB-TAB NAVIGATION (Matches POS Pill Rail) ================= */}
      <div className="bg-white border border-[#DCE5DC] rounded-2xl p-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-[0_1px_4px_rgba(11,93,50,0.04)]">
        {[
          {
            id: 'dashboard' as const,
            label: isAr ? 'لوحة التحليلات' : 'Analytics',
            icon: BarChart3,
            badge: isAr ? 'مباشر' : 'Live'
          },
          {
            id: 'share_marketing' as const,
            label: isAr ? 'المشاركة والتسويق' : 'Marketing',
            icon: Share2,
            badge: null
          },
          {
            id: 'products' as const,
            label: isAr ? 'منتجات المفرد' : 'Products',
            icon: ShoppingBag,
            badge: String(products.length)
          },
          {
            id: 'promotions' as const,
            label: isAr ? 'العروض والخصومات' : 'Deals',
            icon: Percent,
            badge: activeDealsCount > 0 ? String(activeDealsCount) : null
          },
          {
            id: 'banners' as const,
            label: isAr ? 'بنرات الواجهة' : 'Banners',
            icon: ImageIcon,
            badge: String(banners.length)
          },
          {
            id: 'settings' as const,
            label: isAr ? 'إعدادات التوصيل' : 'Settings',
            icon: Sliders,
            badge: null
          }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`min-h-[40px] flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#0B5D32] text-white shadow-2xs'
                  : 'text-[#3D5244] hover:bg-[#F4F4EA]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md tabular-nums leading-none ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#EBF4EE] text-[#0B5D32]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 0: ANALYTICS DASHBOARD
         ========================================================================= */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-4">
          {/* Dashboard Header & Timeframe Selector */}
          <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EBF4EE] text-[#0B5D32] flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-black text-[#142018]">
                    {isAr ? 'ملخص أداء المتجر والمخزون' : 'Storefront Performance Overview'}
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#EBF4EE] text-[#0B5D32] text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0B5D32] animate-pulse" />
                    {isAr ? 'تحديث مباشر' : 'Live'}
                  </span>
                </div>
                <p className="text-[11px] text-[#5F7164] mt-0.5">
                  {isAr
                    ? 'المبيعات اليومية، الأصناف الأكثر طلباً، وسرعة تصريف الرفوف'
                    : 'Daily revenue, top requested items, and shelf turnover velocity'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-[#F4F4EA] border border-[#DCE5DC] p-1 rounded-xl self-start md:self-auto">
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setAnalyticsDays(days)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer whitespace-nowrap tabular-nums ${
                    analyticsDays === days
                      ? 'bg-[#0B5D32] text-white shadow-2xs'
                      : 'text-[#4B6352] hover:text-[#142018]'
                  }`}
                >
                  {isAr ? `${days} يوم` : `${days}d`}
                </button>
              ))}
            </div>
          </div>

          {/* 4 KPI Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Total Revenue */}
            <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 flex flex-col justify-between gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[#5F7164] truncate">
                    {isAr ? `المبيعات (${analyticsDays} يوم)` : `Revenue (${analyticsDays}d)`}
                  </p>
                  <h3 className="text-base sm:text-xl font-black text-[#142018] mt-1 tabular-nums">
                    {formatCurrency(
                      analyticsData?.summaryKPIs?.totalWeeklyRevenue || 5020000,
                      currency
                    )}
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#EBF4EE] text-[#0B5D32] flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-[#0B5D32] font-black tabular-nums">
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                <span>+16.8%</span>
                <span className="text-[#5F7164] font-medium truncate">
                  {isAr ? 'عن السابق' : 'vs prev'}
                </span>
              </div>
            </div>

            {/* Card 2: Completed Orders */}
            <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 flex flex-col justify-between gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[#5F7164] truncate">
                    {isAr ? 'الطلبات المكتملة' : 'Completed Orders'}
                  </p>
                  <h3 className="text-base sm:text-xl font-black text-[#142018] mt-1 tabular-nums">
                    {analyticsData?.summaryKPIs?.totalWeeklyOrders || 159} {isAr ? 'طلب' : 'orders'}
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#F4F4EA] border border-[#DCE5DC] text-[#0B5D32] flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-[11px] text-[#5F7164] font-semibold truncate tabular-nums">
                {isAr ? 'متوسط السلة: ' : 'Avg: '}
                <strong className="text-[#142018]">
                  {formatCurrency(
                    analyticsData?.summaryKPIs?.averageOrderValue || 31570,
                    currency
                  )}
                </strong>
              </div>
            </div>

            {/* Card 3: Inventory Turnover Ratio */}
            <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 flex flex-col justify-between gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[#5F7164] truncate">
                    {isAr ? 'دوران المخزون' : 'Stock Turnover'}
                  </p>
                  <h3 className="text-base sm:text-xl font-black text-[#B45309] mt-1 tabular-nums">
                    {analyticsData?.inventoryTurnover?.overallRate || 6.8}x{' '}
                    <span className="text-[11px] font-bold text-[#5F7164]">
                      {isAr ? '/ سنة' : '/ yr'}
                    </span>
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-[#92400E] font-bold truncate">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {analyticsData?.inventoryTurnover?.status ||
                    (isAr ? 'ممتاز • مخزون نشط' : 'Healthy Stock Velocity')}
                </span>
              </div>
            </div>

            {/* Card 4: Shelf Turnover Days */}
            <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 flex flex-col justify-between gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[#5F7164] truncate">
                    {isAr ? 'مدة تصريف الرف' : 'Days to Sell Out'}
                  </p>
                  <h3 className="text-base sm:text-xl font-black text-[#0B5D32] mt-1 tabular-nums">
                    {analyticsData?.inventoryTurnover?.daysToSellOut || 16.5}{' '}
                    <span className="text-[11px] font-bold text-[#5F7164]">
                      {isAr ? 'يوماً' : 'days'}
                    </span>
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#EBF4EE] text-[#0B5D32] flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="text-[11px] text-[#4B6352] font-bold tabular-nums">
                {isAr ? 'كفاءة إدارة المخزون:' : 'Stock Health:'}{' '}
                <strong className="text-[#0B5D32]">95%</strong>
              </div>
            </div>
          </div>

          {/* CHART 1: DAILY SALES CHART */}
          <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#DCE5DC] gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EBF4EE] text-[#0B5D32] flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#142018]">
                    {isAr ? 'حركة المبيعات اليومية وحجم الطلبات' : 'Daily Sales & Orders Volume'}
                  </h3>
                  <p className="text-[11px] text-[#5F7164]">
                    {isAr
                      ? 'إيرادات المتجر اليومية بالدينار العراقي وتحديد أيام الذروة'
                      : 'Daily storefront revenue with peak sales highlights'}
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-[#FEF3C7] text-[#92400E] px-3 py-1.5 rounded-xl border border-[#FDE68A] self-start sm:self-auto">
                <Flame className="w-3.5 h-3.5 text-[#D97706]" />
                <span>
                  {isAr ? 'ذروة المبيعات: الجمعة والأربعاء' : 'Peak: Friday & Wednesday'}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div className="min-h-[36px] mb-2 flex items-center justify-center">
                {hoveredDay ? (
                  <div className="bg-[#142018] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm flex flex-wrap items-center justify-center gap-2.5 tabular-nums">
                    <span className="text-[#FDE047]">
                      {hoveredDay.dayNameAr} ({hoveredDay.date})
                    </span>
                    <span>
                      {isAr ? 'المبيعات:' : 'Sales:'}{' '}
                      <strong className="text-[#6EE7B7]">
                        {formatCurrency(hoveredDay.revenueIQD, currency)}
                      </strong>
                    </span>
                    <span className="text-white/30">|</span>
                    <span>
                      {hoveredDay.ordersCount} {isAr ? 'طلب' : 'orders'}
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#5F7164] font-medium">
                    {isAr
                      ? 'اضغط أو مرر المؤشر على أي يوم لعرض التفاصيل'
                      : 'Tap or hover any day for detailed revenue'}
                  </p>
                )}
              </div>

              <div className="bg-[#F4F4EA] rounded-2xl p-3 sm:p-5 border border-[#DCE5DC] overflow-hidden">
                <div className="overflow-x-auto no-scrollbar pb-1">
                  {(() => {
                    const dailyList = analyticsData?.dailySales || [];
                    const maxRev = Math.max(
                      ...dailyList.map((d: any) => Number(d.revenueIQD) || 0),
                      1
                    );

                    return (
                      <div className="flex items-end justify-between gap-1.5 sm:gap-3 min-w-full w-max pt-1 pb-1">
                        {dailyList.map((day: any, idx: number) => {
                          const heightPercent = Math.max(
                            14,
                            Math.round(((Number(day.revenueIQD) || 0) / maxRev) * 100)
                          );
                          const isHovered = hoveredDay?.date === day.date;
                          const rawName = String(day.dayNameAr || '');
                          const isToday = rawName.includes('اليوم');
                          const shortDayLabel = rawName
                            .replace('اليوم (', '')
                            .replace(')', '')
                            .trim();

                          return (
                            <button
                              type="button"
                              key={day.date || idx}
                              onMouseEnter={() => setHoveredDay(day)}
                              onMouseLeave={() => setHoveredDay(null)}
                              onClick={() => setHoveredDay(day)}
                              className="flex-1 min-w-[44px] sm:min-w-[54px] flex flex-col items-center group cursor-pointer"
                            >
                              {/* Top Badge + Value (Fixed Height Band) */}
                              <div className="h-9 flex flex-col items-center justify-end gap-0.5 mb-1">
                                {day.isPeak ? (
                                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[#FDE047] text-[#142018] whitespace-nowrap leading-tight">
                                    {isAr ? 'ذروة' : 'Peak'}
                                  </span>
                                ) : isToday ? (
                                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[#0B5D32] text-white whitespace-nowrap leading-tight">
                                    {isAr ? 'اليوم' : 'Today'}
                                  </span>
                                ) : null}

                                <span
                                  className={`text-[10px] font-black tabular-nums leading-none transition ${
                                    isHovered ? 'text-[#0B5D32]' : 'text-[#4B6352]'
                                  }`}
                                >
                                  {(day.revenueIQD / 1000).toLocaleString('en-US')}k
                                </span>
                              </div>

                              {/* Fixed-Height Bar Track (144px) */}
                              <div className="w-full max-w-[34px] sm:max-w-[42px] h-36 bg-[#DCE5DC]/65 rounded-t-xl overflow-hidden flex items-end">
                                <div
                                  style={{ height: `${heightPercent}%` }}
                                  className={`w-full rounded-t-xl transition-all duration-300 ${
                                    day.isPeak
                                      ? 'bg-gradient-to-t from-[#0B5D32] to-[#16A34A]'
                                      : 'bg-gradient-to-t from-[#2F684A] to-[#4D8B68]'
                                  } ${isHovered ? 'ring-2 ring-[#0B5D32] brightness-110' : ''}`}
                                />
                              </div>

                              {/* Day Label & Order Count */}
                              <div className="mt-2 text-center w-full px-0.5">
                                <p
                                  className={`text-[10.5px] sm:text-[11px] font-black truncate transition ${
                                    isHovered
                                      ? 'text-[#0B5D32]'
                                      : isToday
                                      ? 'text-[#0B5D32]'
                                      : 'text-[#142018]'
                                  }`}
                                >
                                  {shortDayLabel}
                                </p>
                                <p className="text-[10px] text-[#5F7164] font-semibold tabular-nums">
                                  {day.ordersCount}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                <div className="mt-3 pt-3 border-t border-[#DCE5DC] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-3 text-[#4B6352] font-bold">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#2F684A]" />
                      {isAr ? 'أيام عادية' : 'Regular'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#0B5D32]" />
                      {isAr ? 'أيام الذروة' : 'Peak Days'}
                    </span>
                  </div>
                  <div className="font-bold text-[#142018] tabular-nums">
                    {isAr ? 'المعدل اليومي:' : 'Daily Avg:'}{' '}
                    <span className="text-[#0B5D32] font-black">
                      {formatCurrency(
                        Math.round(
                          (analyticsData?.summaryKPIs?.totalWeeklyRevenue || 5020000) / 7
                        ),
                        currency
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CHART 2 & 3: TOP PRODUCTS & INVENTORY TURNOVER */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* TOP PRODUCTS */}
            <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#DCE5DC] mb-3.5 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#142018]">
                        {isAr ? 'المنتجات الأكثر طلباً ومبيعاً' : 'Top Selling Products'}
                      </h3>
                      <p className="text-[11px] text-[#5F7164]">
                        {isAr
                          ? 'مرتبة حسب الكمية المباعة ومساهمتها في الدخل'
                          : 'Ranked by retail units sold'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-[#0B5D32] bg-[#EBF4EE] px-2.5 py-1 rounded-lg tabular-nums shrink-0">
                    {analyticsData?.topProducts?.length || 7} {isAr ? 'أصناف' : 'SKUs'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {analyticsData?.topProducts?.map((item: any, idx: number) => (
                    <div
                      key={item.barcode || idx}
                      className="p-2.5 rounded-xl bg-[#F4F4EA] border border-[#DCE5DC] flex flex-col gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 tabular-nums ${
                            idx === 0
                              ? 'bg-[#0B5D32] text-white'
                              : idx === 1
                              ? 'bg-[#DCE5DC] text-[#142018]'
                              : 'bg-white text-[#4B6352] border border-[#DCE5DC]'
                          }`}
                        >
                          #{idx + 1}
                        </div>

                        <div className="w-10 h-10 rounded-xl bg-white border border-[#DCE5DC] p-1 shrink-0 flex items-center justify-center">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-black text-[#142018] truncate">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-[#5F7164] truncate">
                            {item.unit} • <span className="font-bold">{item.category}</span>
                          </p>
                        </div>

                        <div className="text-end shrink-0 tabular-nums">
                          <span className="text-xs font-black text-[#142018] block">
                            {item.unitsSold} {isAr ? 'قطعة' : 'pcs'}
                          </span>
                          <span className="text-[11px] font-bold text-[#0B5D32]">
                            {formatCurrency(item.revenueIQD, currency)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-[#DCE5DC]">
                        <div className="flex-1 bg-[#DCE5DC] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#0B5D32] h-full rounded-full"
                            style={{ width: `${Math.min(100, item.sharePercent * 3.5)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[#5F7164] font-bold whitespace-nowrap tabular-nums">
                          {item.sharePercent}%
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-[#DCE5DC] text-[#3D5244] shrink-0">
                          {item.speedBadge}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* INVENTORY TURNOVER RATE */}
            <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#DCE5DC] mb-3.5 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#EBF4EE] text-[#0B5D32] flex items-center justify-center shrink-0">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#142018]">
                        {isAr ? 'معدل دوران المخزون بالأقسام' : 'Category Shelf Velocity'}
                      </h3>
                      <p className="text-[11px] text-[#5F7164]">
                        {isAr ? 'مرات التجديد سنوياً وأيام التصريف' : 'Annual turnovers & days'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-[#0B5D32] bg-[#EBF4EE] px-2.5 py-1 rounded-lg tabular-nums shrink-0">
                    6.8x {isAr ? 'المعدل' : 'Avg'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {analyticsData?.inventoryTurnover?.categoriesTurnover?.map(
                    (cat: any, idx: number) => {
                      const barWidth = Math.min(100, Math.round((cat.rate / 12) * 100));
                      return (
                        <div
                          key={cat.category || idx}
                          className="p-3 rounded-xl bg-[#F4F4EA] border border-[#DCE5DC]"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: cat.color }}
                              />
                              <span className="text-xs font-black text-[#142018] truncate">
                                {cat.category}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-[#DCE5DC] text-[#4B6352] shrink-0">
                                {cat.status}
                              </span>
                            </div>

                            <div className="text-end shrink-0 tabular-nums">
                              <span className="text-xs font-black text-[#142018]">
                                {cat.rate}x
                              </span>
                              <span className="text-[10.5px] text-[#5F7164] font-semibold ms-1">
                                ({cat.days} {isAr ? 'ي' : 'd'})
                              </span>
                            </div>
                          </div>

                          <div className="w-full bg-[#DCE5DC] rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${barWidth}%`, backgroundColor: cat.color }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FEF3C7]/70 border border-[#FDE68A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-black text-[#78350F]">
                      {isAr ? 'تنبيه تنشيط المبيعات البطيئة' : 'Boost Slow-Moving Stock'}
                    </h5>
                    <p className="text-[11px] text-[#92400E] leading-relaxed mt-0.5">
                      {isAr
                        ? 'قسم المنظفات يسجل أبطأ دوران (28 يوماً). أطلق خصماً لتحرير السيولة.'
                        : 'Home care items rotate slower (28 days). Add a quick deal to accelerate sales.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('promotions')}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white text-xs font-black transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إنشاء عرض' : 'Create Deal'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 1: STORE SHARING & MARKETING HUB
         ========================================================================= */}
      {activeSubTab === 'share_marketing' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EBF4EE] text-[#0B5D32] flex items-center justify-center shrink-0">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-[#142018]">
                  {isAr ? 'مركز مشاركة المتجر واستقطاب الزبائن' : 'Store Sharing & Marketing Hub'}
                </h2>
                <p className="text-[11px] text-[#5F7164]">
                  {isAr
                    ? 'انشر رابط متجرك عبر واتساب ومنصات التواصل أو اطبع لافتة QR للمحل'
                    : 'Share your link on WhatsApp and print your in-store QR poster'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleOpenPosterStudio}
                className="min-h-[38px] px-3.5 py-2 rounded-xl bg-[#F4F4EA] hover:bg-[#EBF4EE] border border-[#DCE5DC] text-[#0B5D32] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isAr ? 'طباعة لافتة QR' : 'QR Poster'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleShareWhatsApp()}
                className="min-h-[38px] px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1FB858] text-white text-xs font-black flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                <span>{isAr ? 'مشاركة عبر واتساب' : 'WhatsApp'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Column 1: Link & Templates */}
            <div className="lg:col-span-7 space-y-4">
              {/* Public URL Card */}
              <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-[#0B5D32]" />
                    <h3 className="text-sm font-black text-[#142018]">
                      {isAr ? 'الرابط العام لمتجر الزبائن (B2C)' : 'Public Customer Storefront URL'}
                    </h3>
                  </div>
                  <span className="text-[10.5px] font-bold text-[#0B5D32] bg-[#EBF4EE] px-2.5 py-0.5 rounded-full">
                    {isAr ? 'مفعل' : 'Active'}
                  </span>
                </div>

                <div className="bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl p-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <span
                    dir="ltr"
                    className="text-xs font-mono text-[#142018] truncate px-2 text-left flex-1"
                  >
                    {publicStoreUrl}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyLink()}
                      className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                        copiedLink
                          ? 'bg-[#0B5D32] text-white'
                          : 'bg-white hover:bg-[#EBF4EE] text-[#142018] border border-[#DCE5DC]'
                      }`}
                    >
                      {copiedLink ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? (isAr ? 'تم النسخ' : 'Copied') : isAr ? 'نسخ' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={onPreviewStorefront}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold bg-[#EBF4EE] hover:bg-[#DCECE1] text-[#0B5D32] transition cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isAr ? 'معاينة' : 'Preview'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Direct Channels Card */}
              <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3">
                <h3 className="text-sm font-black text-[#142018]">
                  {isAr ? 'الإرسال السريع عبر قنوات التواصل' : 'Quick Social Broadcast'}
                </h3>

                <div className="bg-[#EBF4EE] border border-[#DCE5DC] rounded-xl p-3 space-y-2">
                  <label className="block text-xs font-bold text-[#0B5D32]">
                    {isAr ? 'إرسال لرقم زبون محدد عبر واتساب (اختياري):' : 'Direct Customer WhatsApp:'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="07715558899"
                      value={targetCustomerPhone}
                      onChange={(e) => setTargetCustomerPhone(e.target.value)}
                      className="flex-1 min-h-[40px] bg-white border border-[#DCE5DC] rounded-xl px-3 py-2 text-xs font-mono text-left focus:border-[#0B5D32] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(undefined, targetCustomerPhone)}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إرسال' : 'Send'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleShareWhatsApp()}
                    className="min-h-[44px] p-3 rounded-xl bg-[#25D366] hover:bg-[#1FB858] text-white text-xs font-black transition cursor-pointer flex flex-col items-center justify-center gap-1"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShareTelegram()}
                    className="min-h-[44px] p-3 rounded-xl bg-[#0088CC] hover:bg-[#0073AD] text-white text-xs font-black transition cursor-pointer flex flex-col items-center justify-center gap-1"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isAr ? 'تيليجرام' : 'Telegram'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShareFacebook()}
                    className="min-h-[44px] p-3 rounded-xl bg-[#1877F2] hover:bg-[#1465D0] text-white text-xs font-black transition cursor-pointer flex flex-col items-center justify-center gap-1"
                  >
                    <span className="font-black text-sm leading-none">f</span>
                    <span>{isAr ? 'فيسبوك' : 'Facebook'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNativeShare()}
                    className="min-h-[44px] p-3 rounded-xl bg-[#142018] hover:bg-black text-white text-xs font-black transition cursor-pointer flex flex-col items-center justify-center gap-1"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{isAr ? 'تطبيقات أخرى' : 'More Apps'}</span>
                  </button>
                </div>
              </div>

              {/* Message Templates */}
              <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0B5D32]" />
                  <h3 className="text-sm font-black text-[#142018]">
                    {isAr ? 'نماذج رسائل تسويقية جاهزة' : 'Marketing Message Templates'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {marketingTemplates.map((tpl, idx) => {
                    const isSelected = selectedTemplateIndex === idx;
                    return (
                      <button
                        type="button"
                        key={tpl.id}
                        onClick={() => {
                          setSelectedTemplateIndex(idx);
                          setCustomShareMessage('');
                        }}
                        className={`p-2.5 rounded-xl border text-start transition cursor-pointer ${
                          isSelected
                            ? 'border-[#0B5D32] bg-[#EBF4EE]'
                            : 'border-[#DCE5DC] bg-[#F4F4EA] hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                              isSelected ? 'bg-[#0B5D32] text-white' : 'bg-white text-[#4B6352]'
                            }`}
                          >
                            {isAr ? tpl.tagAr : tpl.tagEn}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#0B5D32]" />}
                        </div>
                        <p className="text-[11px] font-bold text-[#142018] line-clamp-2">
                          {isAr ? tpl.titleAr : tpl.titleEn}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <textarea
                  rows={4}
                  value={
                    customShareMessage ||
                    (isAr
                      ? marketingTemplates[selectedTemplateIndex]?.textAr
                      : marketingTemplates[selectedTemplateIndex]?.textEn)
                  }
                  onChange={(e) => setCustomShareMessage(e.target.value)}
                  className="w-full bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl p-3 text-xs text-[#142018] leading-relaxed focus:bg-white focus:border-[#0B5D32] outline-none resize-none"
                />

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(getActiveShareText())}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#F4F4EA] hover:bg-[#EBF4EE] border border-[#DCE5DC] text-[#142018] text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isAr ? 'نسخ النص' : 'Copy Text'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShareWhatsApp(getActiveShareText())}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white text-xs font-black transition cursor-pointer flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{isAr ? 'إرسال عبر واتساب' : 'Send on WhatsApp'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Column 2: QR Preview Card */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-5 text-center flex flex-col items-center">
                <div className="flex items-center gap-2 self-start mb-2">
                  <QrCode className="w-4 h-4 text-[#0B5D32]" />
                  <h3 className="text-sm font-black text-[#142018]">
                    {isAr ? 'رمز QR السريع للمتجر' : 'In-Store QR Poster'}
                  </h3>
                </div>
                <p className="text-[11px] text-[#5F7164] text-start w-full mb-4">
                  {isAr
                    ? 'ضعه عند الكاشير أو على أكياس الطلبات ليطلب الزبون من منزله.'
                    : 'Display at checkout for instant doorstep reorders.'}
                </p>

                <div className="w-full max-w-[270px] bg-[#F4F4EA] border-2 border-dashed border-[#0B5D32]/40 rounded-2xl p-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0B5D32] text-white flex items-center justify-center mx-auto mb-2">
                    <Store className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-black text-[#142018]">
                    {storeData?.name || (isAr ? 'سوبرماركت المنصور المركزي' : 'Al-Mansoor Supermarket')}
                  </h4>
                  <p className="text-[10.5px] text-[#0B5D32] font-bold mb-3">
                    {isAr ? 'امسح الكود للطلب والتوصيل خلال 20 دقيقة' : 'Scan for 20-min delivery'}
                  </p>
                  <div className="w-40 h-40 mx-auto bg-white p-2 rounded-xl border border-[#DCE5DC] mb-2">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=0B5D32&data=${encodeURIComponent(
                        publicStoreUrl
                      )}`}
                      alt="Store QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p dir="ltr" className="text-[9.5px] font-mono text-[#5F7164] truncate">
                    {publicStoreUrl}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenPosterStudio}
                  className="w-full min-h-[42px] py-2.5 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white text-xs font-black transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isAr ? 'فتح استوديو طباعة بوستر QR' : 'Open QR Poster Studio'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: RETAIL PRODUCTS MANAGEMENT
         ========================================================================= */}
      {activeSubTab === 'products' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={isAr ? 'ابحث باسم المنتج أو العلامة...' : 'Search retail products...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-[42px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl py-2 ps-9 pe-3 text-xs focus:bg-white focus:border-[#0B5D32] outline-none transition"
                />
                <Search className="w-4 h-4 text-[#5F7164] absolute start-3 top-3" />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="min-h-[42px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl py-2 px-3 text-xs text-[#142018] font-bold focus:bg-white focus:border-[#0B5D32] outline-none transition"
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsAddProductModalOpen(true)}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{isAr ? 'إضافة منتج مفرد' : 'Add Product'}</span>
            </button>
          </div>

          {/* Mobile Card List (<md) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {filteredProducts.map((product) => (
              <div
                key={product.barcode}
                className="bg-white rounded-2xl border border-[#DCE5DC] p-3.5 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl bg-[#F4F4EA] border border-[#DCE5DC] p-1.5 shrink-0 flex items-center justify-center">
                    <img
                      src={
                        product.imageUrl ||
                        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80'
                      }
                      alt={product.productName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-[#142018] line-clamp-2">
                      {product.productName}
                    </h4>
                    <p className="text-[10.5px] text-[#5F7164] mt-0.5 truncate">
                      {product.category} • {product.unit}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 tabular-nums">
                      <span className="text-sm font-black text-[#0B5D32]">
                        {formatCurrency(product.retailSellingPriceIQD, currency)}
                      </span>
                      {product.discountPercent ? (
                        <span className="bg-[#E11D48] text-white text-[10px] font-black px-1.5 py-0.5 rounded-md">
                          -{product.discountPercent}%
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[#DCE5DC] flex items-center justify-between gap-2">
                  <span
                    className={`text-[11px] font-bold tabular-nums ${
                      product.stockQuantity < 10 ? 'text-[#E11D48]' : 'text-[#4B6352]'
                    }`}
                  >
                    {isAr ? 'المخزون:' : 'Stock:'} {product.stockQuantity} {isAr ? 'قطعة' : 'pcs'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPromoBarcode(product.barcode);
                        setIsPromoModalOpen(true);
                      }}
                      className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#FEF3C7] text-[#92400E] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Percent className="w-3.5 h-3.5" />
                      <span>{isAr ? 'خصم' : 'Deal'}</span>
                    </button>

                    {confirmDeleteBarcode === product.barcode ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product.barcode)}
                        className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#E11D48] text-white text-[11px] font-black cursor-pointer"
                      >
                        {isAr ? 'تأكيد الحذف' : 'Confirm'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteBarcode(product.barcode)}
                        className="min-h-[36px] w-9 rounded-lg bg-[#FDF2F2] text-[#E11D48] flex items-center justify-center cursor-pointer"
                        title={isAr ? 'حذف' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (>=md) */}
          <div className="hidden md:block bg-white rounded-2xl border border-[#DCE5DC] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-[#F4F4EA] text-[#4B6352] font-black border-b border-[#DCE5DC]">
                  <tr>
                    <th className="py-3 px-4">{isAr ? 'المنتج المفرد' : 'Product'}</th>
                    <th className="py-3 px-3">{isAr ? 'القسم' : 'Category'}</th>
                    <th className="py-3 px-3">{isAr ? 'العبوة' : 'Unit'}</th>
                    <th className="py-3 px-3">{isAr ? 'سعر البيع' : 'Price'}</th>
                    <th className="py-3 px-3">{isAr ? 'الخصم' : 'Discount'}</th>
                    <th className="py-3 px-3">{isAr ? 'المخزون' : 'Stock'}</th>
                    <th className="py-3 px-4 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5DC]/60">
                  {filteredProducts.map((product) => (
                    <tr key={product.barcode} className="hover:bg-[#F4F4EA]/50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#F4F4EA] border border-[#DCE5DC] p-1 shrink-0 flex items-center justify-center">
                            <img
                              src={
                                product.imageUrl ||
                                'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80'
                              }
                              alt={product.productName}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-[#142018] line-clamp-1">
                              {product.productName}
                            </div>
                            <div className="text-[10px] text-[#5F7164] font-mono mt-0.5">
                              {product.brand} • {product.barcode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#4B6352] font-semibold">
                        {product.category}
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-[#EBF4EE] text-[#0B5D32] text-[10.5px] font-bold px-2 py-0.5 rounded-md inline-block">
                          {product.unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-black text-[#0B5D32] tabular-nums">
                        {formatCurrency(product.retailSellingPriceIQD, currency)}
                      </td>
                      <td className="py-3 px-3 tabular-nums">
                        {product.discountPercent ? (
                          <span className="bg-[#E11D48] text-white text-[10px] font-black px-1.5 py-0.5 rounded-md">
                            -{product.discountPercent}%
                          </span>
                        ) : (
                          <span className="text-[#5F7164] text-[10px]">
                            {isAr ? 'قياسي' : 'Standard'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 tabular-nums">
                        <span
                          className={`text-xs font-bold ${
                            product.stockQuantity < 10 ? 'text-[#E11D48]' : 'text-[#142018]'
                          }`}
                        >
                          {product.stockQuantity} {isAr ? 'قطعة' : 'pcs'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPromoBarcode(product.barcode);
                              setIsPromoModalOpen(true);
                            }}
                            className="p-2 rounded-lg bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] transition cursor-pointer"
                            title={isAr ? 'تطبيق عرض ترويجي' : 'Apply Promo'}
                          >
                            <Percent className="w-3.5 h-3.5" />
                          </button>
                          {confirmDeleteBarcode === product.barcode ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product.barcode)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#E11D48] text-white text-[10px] font-black cursor-pointer"
                            >
                              {isAr ? 'تأكيد' : 'Confirm'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteBarcode(product.barcode)}
                              className="p-2 rounded-lg bg-[#FDF2F2] hover:bg-[#FEE2E2] text-[#E11D48] transition cursor-pointer"
                              title={isAr ? 'حذف من المتجر' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredProducts.length === 0 && (
            <div className="bg-white rounded-2xl border border-[#DCE5DC] p-8 text-center text-[#5F7164] space-y-2">
              <ShoppingBag className="w-8 h-8 text-[#DCE5DC] mx-auto" />
              <p className="text-xs font-bold">
                {isAr ? 'لا توجد منتجات مطابقة للبحث' : 'No products found'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: PROMOTIONS & DEALS MAKER
         ========================================================================= */}
      {activeSubTab === 'promotions' && (
        <div className="space-y-4">
          <div className="bg-[#0B5D32] rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-lg">
              <span className="bg-white/15 text-[#FDE047] text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block">
                {isAr ? 'محرك العروض والخصومات' : 'Instant Deal Engine'}
              </span>
              <h2 className="text-base sm:text-lg font-black">
                {isAr ? 'إنشاء عروض وتخفيضات أسبوع التوفير' : 'Create Special Deals & Discounts'}
              </h2>
              <p className="text-xs text-white/80">
                {isAr
                  ? 'اختر أي منتج في متجرك وحدد نسبة الخصم ليظهر فوراً بشارة التخفيض في متجر الزبائن.'
                  : 'Apply instant discounts and promo badges to any storefront item.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsPromoModalOpen(true)}
              className="min-h-[42px] px-4 py-2.5 rounded-xl bg-[#FDE047] hover:bg-[#FACC15] text-[#142018] font-black text-xs transition cursor-pointer shrink-0 flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Percent className="w-4 h-4" />
              <span>{isAr ? 'تطبيق عرض جديد' : 'Create Deal'}</span>
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-black text-[#142018] flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#E11D48]" />
              <span>{isAr ? 'العروض النشطة حالياً' : 'Active Deals'}</span>
              <span className="text-xs text-[#5F7164] font-bold tabular-nums">
                ({activeDealsCount})
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {products
                .filter((p) => p.discountPercent && p.discountPercent > 0)
                .map((prod) => (
                  <div
                    key={prod.barcode}
                    className="bg-white rounded-2xl border border-[#DCE5DC] p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-[#F4F4EA] border border-[#DCE5DC] p-1 shrink-0 flex items-center justify-center">
                        <img
                          src={prod.imageUrl}
                          alt={prod.productName}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-[#142018] line-clamp-1">
                          {prod.productName}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 tabular-nums flex-wrap">
                          <span className="bg-[#E11D48] text-white text-[10px] font-black px-1.5 py-0.5 rounded-md">
                            -{prod.discountPercent}%
                          </span>
                          <span className="text-xs font-black text-[#0B5D32]">
                            {formatCurrency(prod.retailSellingPriceIQD, currency)}
                          </span>
                          {prod.oldPrice && (
                            <span className="text-[10px] text-[#5F7164] line-through">
                              {formatCurrency(prod.oldPrice, currency)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        await fetchWithRetry(
                          `/api/store/${storeId}/storefront/products/${prod.barcode}`,
                          {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ discountPercent: null, oldPrice: null })
                          }
                        );
                        showToast(
                          isAr ? 'تم إلغاء العرض وإعادة السعر الأصلي' : 'Deal removed'
                        );
                        await loadStorefrontData();
                      }}
                      className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[#F4F4EA] hover:bg-[#FDF2F2] text-[#4B6352] hover:text-[#E11D48] text-[10.5px] font-bold transition cursor-pointer shrink-0"
                    >
                      {isAr ? 'إلغاء' : 'Remove'}
                    </button>
                  </div>
                ))}
            </div>

            {activeDealsCount === 0 && (
              <div className="bg-white rounded-2xl border border-[#DCE5DC] p-8 text-center text-[#5F7164] space-y-2">
                <Percent className="w-8 h-8 text-[#DCE5DC] mx-auto" />
                <p className="text-xs font-bold">
                  {isAr ? 'لا توجد عروض نشطة حالياً' : 'No active discounts'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: HERO SLIDER BANNERS
         ========================================================================= */}
      {activeSubTab === 'banners' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#142018]">
                {isAr ? 'بنرات السلايد الإعلاني المتحرك' : 'Hero Slider Banners'}
              </h3>
              <p className="text-[11px] text-[#5F7164] mt-0.5">
                {isAr
                  ? 'تظهر في أعلى واجهة متجر الزبائن وتتحرك تلقائياً'
                  : 'Displayed at the top of your customer storefront'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddBannerModalOpen(true)}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{isAr ? 'إضافة بنر جديد' : 'Add Banner'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners.map((banner, bIdx) => (
              <div
                key={banner.id || bIdx}
                className="bg-white rounded-2xl border border-[#DCE5DC] overflow-hidden space-y-3 p-3.5 flex flex-col justify-between"
              >
                <div
                  className={`relative p-5 rounded-xl bg-gradient-to-r ${banner.bgColor} text-white min-h-[135px] flex flex-col justify-between overflow-hidden`}
                >
                  <img
                    src={banner.image}
                    alt={banner.titleAr}
                    className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay pointer-events-none"
                  />

                  <div className="relative z-10 space-y-1.5">
                    <span
                      className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        banner.badgeBg || 'bg-[#FDE047] text-[#142018]'
                      }`}
                    >
                      {banner.badgeAr}
                    </span>
                    <h4 className="text-sm sm:text-base font-black leading-tight">
                      {banner.titleAr}
                    </h4>
                    <p className="text-[11px] text-white/90 line-clamp-1">{banner.descAr}</p>
                  </div>

                  <div className="relative z-10 flex items-center justify-between text-[10px] font-bold text-white/85 pt-2 tabular-nums">
                    <span className="bg-black/30 px-2 py-0.5 rounded-md">#{bIdx + 1}</span>
                    <span className={banner.active ? 'text-[#FDE047]' : 'text-white/60'}>
                      {banner.active ? (isAr ? 'نشط' : 'Active') : isAr ? 'معطل' : 'Paused'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#DCE5DC] text-xs">
                  <button
                    type="button"
                    onClick={() => handleToggleBanner(banner.id)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                      banner.active
                        ? 'bg-[#EBF4EE] text-[#0B5D32] hover:bg-[#DCECE1]'
                        : 'bg-[#F4F4EA] text-[#4B6352] hover:bg-[#DCE5DC]'
                    }`}
                  >
                    {banner.active
                      ? isAr
                        ? 'نشط (إيقاف)'
                        : 'Active (Pause)'
                      : isAr
                      ? 'تفعيل البنر'
                      : 'Activate'}
                  </button>

                  {confirmDeleteBannerId === banner.id ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteBanner(banner.id)}
                      className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#E11D48] text-white text-xs font-black cursor-pointer"
                    >
                      {isAr ? 'تأكيد الحذف' : 'Confirm Delete'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteBannerId(banner.id)}
                      className="min-h-[36px] w-9 rounded-xl bg-[#FDF2F2] hover:bg-[#FEE2E2] text-[#E11D48] flex items-center justify-center transition cursor-pointer"
                      title={isAr ? 'حذف البنر' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: STORE SETTINGS & DELIVERY WORKING HOURS
         ========================================================================= */}
      {activeSubTab === 'settings' && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-6 space-y-5"
        >
          <div>
            <h3 className="text-base font-black text-[#142018]">
              {isAr
                ? 'بيانات السوبرماركت وساعات العمل والتوصيل'
                : 'Supermarket & Delivery Settings'}
            </h3>
            <p className="text-xs text-[#5F7164] mt-1">
              {isAr
                ? 'تظهر هذه المعلومات للزبائن في واجهة المتجر وتحدد شروط التوصيل المنزلي.'
                : 'Displayed on your customer storefront and controls delivery terms.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#3D5244] font-bold mb-1">
                {isAr ? 'اسم السوبرماركت التجاري:' : 'Supermarket Name:'}
              </label>
              <input
                type="text"
                value={settingsName}
                onChange={(e) => setSettingsName(e.target.value)}
                className="w-full min-h-[42px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 font-bold focus:bg-white focus:border-[#0B5D32] outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[#3D5244] font-bold mb-1">
                {isAr ? 'رقم الهاتف للتواصل والواتساب:' : 'Contact Phone / WhatsApp:'}
              </label>
              <input
                type="text"
                dir="ltr"
                value={settingsPhone}
                onChange={(e) => setSettingsPhone(e.target.value)}
                className="w-full min-h-[42px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 text-left font-mono tabular-nums focus:bg-white focus:border-[#0B5D32] outline-none transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[#3D5244] font-bold mb-1">
                {isAr ? 'العنوان ونقطة التوصيل الأقرب:' : 'Address & Delivery District:'}
              </label>
              <input
                type="text"
                value={settingsAddress}
                onChange={(e) => setSettingsAddress(e.target.value)}
                className="w-full min-h-[42px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 focus:bg-white focus:border-[#0B5D32] outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[#3D5244] font-bold mb-1">
                {isAr ? 'ساعات العمل اليومية:' : 'Daily Working Hours:'}
              </label>
              <input
                type="text"
                value={settingsHours}
                onChange={(e) => setSettingsHours(e.target.value)}
                placeholder="مفتوح الآن • 8:00 ص - 1:00 منتصف الليل"
                className="w-full min-h-[42px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 focus:bg-white focus:border-[#0B5D32] outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[#3D5244] font-bold mb-1">
                {isAr ? 'مدة التوصيل المضمونة (بالدقائق):' : 'Delivery ETA (Minutes):'}
              </label>
              <input
                type="number"
                dir="ltr"
                value={settingsDeliveryTime}
                onChange={(e) => setSettingsDeliveryTime(Number(e.target.value))}
                className="w-full min-h-[42px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 text-left font-mono tabular-nums focus:bg-white focus:border-[#0B5D32] outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[#3D5244] font-bold mb-1">
                {isAr ? 'أجور التوصيل السريع (د.ع):' : 'Delivery Fee (IQD):'}
              </label>
              <input
                type="number"
                dir="ltr"
                value={settingsDeliveryFee}
                onChange={(e) => setSettingsDeliveryFee(Number(e.target.value))}
                className="w-full min-h-[42px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 text-left font-mono tabular-nums focus:bg-white focus:border-[#0B5D32] outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[#3D5244] font-bold mb-1">
                {isAr ? 'حد التوصيل المجاني للطلبات (د.ع):' : 'Free Delivery Over (IQD):'}
              </label>
              <input
                type="number"
                dir="ltr"
                value={settingsFreeThreshold}
                onChange={(e) => setSettingsFreeThreshold(Number(e.target.value))}
                className="w-full min-h-[42px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 text-left font-mono tabular-nums focus:bg-white focus:border-[#0B5D32] outline-none transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[#3D5244] font-bold mb-1">
                {isAr ? 'شريط الإعلانات الترحيبي أعلى المتجر:' : 'Top Announcement Bar Text:'}
              </label>
              <input
                type="text"
                value={settingsAnnouncement}
                onChange={(e) => setSettingsAnnouncement(e.target.value)}
                placeholder="أسبوع التوفير الكبير: خصومات تصل إلى 40% مع توصيل فوري 20 دقيقة..."
                className="w-full min-h-[42px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 focus:bg-white focus:border-[#0B5D32] outline-none transition"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white font-black text-xs transition cursor-pointer shadow-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {saving
                  ? isAr
                    ? 'جاري الحفظ...'
                    : 'Saving...'
                  : isAr
                  ? 'حفظ إعدادات المتجر والتوصيل'
                  : 'Save Store Settings'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* =========================================================================
          MODAL 1: ADD NEW RETAIL PRODUCT (POS Style)
         ========================================================================= */}
      {isAddProductModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2918]/65 backdrop-blur-xs p-3 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddProductModalOpen(false);
          }}
        >
          <div className="bg-[#F4F4EA] border border-[#DCE5DC] rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-3.5 bg-white border-b border-[#DCE5DC] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0B5D32] text-white flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-[#0B5D32]">
                  {isAr ? 'إضافة منتج مفرد جديد إلى المتجر' : 'Add New Retail Product'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProductModalOpen(false)}
                className="w-9 h-9 rounded-full bg-[#F4F4EA] border border-[#DCE5DC] text-[#3D5244] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreateProduct}
              className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs"
            >
              <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3">
                <div>
                  <label className="block text-[#3D5244] font-bold mb-1">
                    {isAr ? 'اسم المنتج المفرد:' : 'Product Name:'} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: زيت زيتون بكر ممتاز الجوف (مفرد)"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="w-full min-h-[40px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 font-bold focus:bg-white focus:border-[#0B5D32] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#3D5244] font-bold mb-1">
                    {isAr ? 'العلامة التجارية / الماركة:' : 'Brand:'}
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: الجوف الفاخرة"
                    value={newProductBrand}
                    onChange={(e) => setNewProductBrand(e.target.value)}
                    className="w-full min-h-[40px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 focus:bg-white focus:border-[#0B5D32] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#3D5244] font-bold mb-1">
                      {isAr ? 'القسم الرئيسي:' : 'Category:'}
                    </label>
                    <select
                      value={newProductCategory}
                      onChange={(e) => setNewProductCategory(e.target.value)}
                      className="w-full min-h-[40px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 focus:bg-white focus:border-[#0B5D32] outline-none"
                    >
                      <option value="زيوت وسمن">زيوت وسمن</option>
                      <option value="أرز وحبوب">أرز وحبوب</option>
                      <option value="ألبان وأجبان">ألبان وأجبان</option>
                      <option value="معلبات ومخللات">معلبات ومخللات</option>
                      <option value="سكر وحلويات">سكر وحلويات</option>
                      <option value="منظفات وعناية">منظفات وعناية</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#3D5244] font-bold mb-1">
                      {isAr ? 'العبوة المفردة:' : 'Packaging Unit:'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={newProductUnit}
                      onChange={(e) => setNewProductUnit(e.target.value)}
                      className="w-full min-h-[40px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 font-bold text-[#0B5D32] focus:bg-white focus:border-[#0B5D32] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[#3D5244] font-bold mb-1">
                      {isAr ? 'السعر (د.ع):' : 'Price:'} *
                    </label>
                    <input
                      type="number"
                      required
                      min="250"
                      step="250"
                      dir="ltr"
                      value={newProductPrice}
                      onChange={(e) =>
                        setNewProductPrice(e.target.value ? Number(e.target.value) : '')
                      }
                      className="w-full min-h-[40px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 font-mono font-bold text-left tabular-nums focus:bg-white focus:border-[#0B5D32] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#3D5244] font-bold mb-1">
                      {isAr ? 'الخصم (%):' : 'Discount:'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="90"
                      dir="ltr"
                      placeholder="0"
                      value={newProductDiscount}
                      onChange={(e) =>
                        setNewProductDiscount(e.target.value ? Number(e.target.value) : '')
                      }
                      className="w-full min-h-[40px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 font-mono text-left tabular-nums focus:bg-white focus:border-[#0B5D32] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#3D5244] font-bold mb-1">
                      {isAr ? 'المخزون:' : 'Stock:'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      dir="ltr"
                      value={newProductStock}
                      onChange={(e) =>
                        setNewProductStock(e.target.value ? Number(e.target.value) : '')
                      }
                      className="w-full min-h-[40px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 font-mono text-left tabular-nums focus:bg-white focus:border-[#0B5D32] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#3D5244] font-bold mb-1">
                    {isAr ? 'رابط الصورة أو اختر نموذج:' : 'Image URL:'}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="https://..."
                    value={newProductImageUrl}
                    onChange={(e) => setNewProductImageUrl(e.target.value)}
                    className="w-full min-h-[38px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-1.5 text-[11px] font-mono text-left focus:bg-white focus:border-[#0B5D32] outline-none"
                  />
                  <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
                    {[
                      {
                        label: 'زيت',
                        url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80'
                      },
                      {
                        label: 'أرز',
                        url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80'
                      },
                      {
                        label: 'حليب',
                        url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80'
                      },
                      {
                        label: 'طماطم',
                        url: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=400&q=80'
                      },
                      {
                        label: 'شاي',
                        url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80'
                      },
                      {
                        label: 'منظفات',
                        url: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=400&q=80'
                      }
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewProductImageUrl(preset.url)}
                        className="px-2.5 py-1 rounded-lg bg-[#F4F4EA] hover:bg-[#EBF4EE] border border-[#DCE5DC] text-[10.5px] font-bold text-[#0B5D32] transition shrink-0 cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-white border border-[#DCE5DC] text-[#3D5244] font-bold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white font-black cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {saving
                      ? isAr
                        ? 'جاري الإضافة...'
                        : 'Adding...'
                      : isAr
                      ? 'إضافة المنتج فوراً'
                      : 'Add Product'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: QUICK PROMOTION / DISCOUNT MAKER
         ========================================================================= */}
      {isPromoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2918]/65 backdrop-blur-xs p-3 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPromoModalOpen(false);
          }}
        >
          <div className="bg-[#F4F4EA] border border-[#DCE5DC] rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 bg-white border-b border-[#DCE5DC] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0B5D32] text-white flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-[#0B5D32]">
                  {isAr ? 'تطبيق عرض ترويجي على منتج' : 'Apply Promotion / Deal'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPromoModalOpen(false)}
                className="w-9 h-9 rounded-full bg-[#F4F4EA] border border-[#DCE5DC] text-[#3D5244] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyPromotion} className="p-4 sm:p-5 space-y-4 text-xs">
              <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3.5">
                <div>
                  <label className="block text-[#3D5244] font-bold mb-1">
                    {isAr ? 'اختر المنتج المراد تخفيضه:' : 'Select Product:'}
                  </label>
                  <select
                    required
                    value={selectedPromoBarcode}
                    onChange={(e) => setSelectedPromoBarcode(e.target.value)}
                    className="w-full min-h-[42px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 font-bold focus:bg-white focus:border-[#0B5D32] outline-none"
                  >
                    <option value="">
                      {isAr ? '-- اضغط لاختيار المنتج --' : '-- Choose Product --'}
                    </option>
                    {products.map((p) => (
                      <option key={p.barcode} value={p.barcode}>
                        {p.productName} ({p.retailSellingPriceIQD.toLocaleString()} د.ع)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#3D5244] font-bold mb-1.5">
                    {isAr ? 'نسبة الخصم (%):' : 'Discount Percentage:'}
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[10, 15, 20, 30].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setPromoDiscountPercent(pct)}
                        className={`min-h-[38px] rounded-xl text-center font-black transition cursor-pointer tabular-nums ${
                          promoDiscountPercent === pct
                            ? 'bg-[#0B5D32] text-white'
                            : 'bg-[#F4F4EA] border border-[#DCE5DC] text-[#142018]'
                        }`}
                      >
                        %{pct}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="5"
                    max="80"
                    dir="ltr"
                    value={promoDiscountPercent}
                    onChange={(e) => setPromoDiscountPercent(Number(e.target.value))}
                    className="w-full min-h-[40px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 font-mono font-bold text-left tabular-nums focus:bg-white focus:border-[#0B5D32] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#3D5244] font-bold mb-1">
                    {isAr ? 'شارة العرض:' : 'Promotion Badge:'}
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {['عرض خاص', 'أسبوع التوفير', 'اشتري ووفر', 'تخفيض موسمي'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setPromoBadgeText(tag)}
                        className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition cursor-pointer ${
                          promoBadgeText === tag
                            ? 'bg-[#0B5D32] text-white'
                            : 'bg-[#F4F4EA] border border-[#DCE5DC] text-[#4B6352]'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={promoBadgeText}
                    onChange={(e) => setPromoBadgeText(e.target.value)}
                    className="w-full min-h-[40px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 font-bold focus:bg-white focus:border-[#0B5D32] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPromoModalOpen(false)}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-white border border-[#DCE5DC] text-[#3D5244] font-bold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving || !selectedPromoBarcode}
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Flame className="w-4 h-4" />
                  <span>
                    {saving
                      ? isAr
                        ? 'جاري التطبيق...'
                        : 'Applying...'
                      : isAr
                      ? 'تفعيل العرض فوراً'
                      : 'Activate Deal'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: ADD NEW BANNER
         ========================================================================= */}
      {isAddBannerModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2918]/65 backdrop-blur-xs p-3 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddBannerModalOpen(false);
          }}
        >
          <div className="bg-[#F4F4EA] border border-[#DCE5DC] rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-3.5 bg-white border-b border-[#DCE5DC] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0B5D32] text-white flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-[#0B5D32]">
                  {isAr ? 'إضافة بنر إعلاني جديد للسلايد' : 'Add Hero Banner'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBannerModalOpen(false)}
                className="w-9 h-9 rounded-full bg-[#F4F4EA] border border-[#DCE5DC] text-[#3D5244] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreateBanner}
              className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs"
            >
              <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 space-y-3">
                <div>
                  <label className="block text-[#3D5244] font-bold mb-1">
                    {isAr ? 'عنوان البنر الرئيسي:' : 'Banner Title:'} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="أسبوع التوفير الكبير: خصومات تصل إلى 30%"
                    value={newBannerTitleAr}
                    onChange={(e) => setNewBannerTitleAr(e.target.value)}
                    className="w-full min-h-[40px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 font-bold focus:bg-white focus:border-[#0B5D32] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#3D5244] font-bold mb-1">
                    {isAr ? 'النص التوضيحي:' : 'Description:'}
                  </label>
                  <input
                    type="text"
                    placeholder="عروض حصرية لسكان المنصور مع توصيل مجاني لباب البيت"
                    value={newBannerDescAr}
                    onChange={(e) => setNewBannerDescAr(e.target.value)}
                    className="w-full min-h-[40px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 focus:bg-white focus:border-[#0B5D32] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#3D5244] font-bold mb-1">
                    {isAr ? 'نص الشارة الصغيرة:' : 'Badge Text:'}
                  </label>
                  <input
                    type="text"
                    value={newBannerBadgeAr}
                    onChange={(e) => setNewBannerBadgeAr(e.target.value)}
                    className="w-full min-h-[40px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 focus:bg-white focus:border-[#0B5D32] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#3D5244] font-bold mb-1.5">
                    {isAr ? 'طابع الألوان:' : 'Color Theme:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        label: 'أخضر الكاشير',
                        val: 'from-[#0B5D32] via-[#0F6E3D] to-[#083E22]'
                      },
                      { label: 'أزرق داكن', val: 'from-blue-700 via-blue-800 to-slate-900' },
                      { label: 'أحمر عروض', val: 'from-rose-700 via-rose-800 to-red-950' },
                      {
                        label: 'ذهبي دافئ',
                        val: 'from-amber-600 via-amber-700 to-orange-950'
                      }
                    ].map((thm, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewBannerBgColor(thm.val)}
                        className={`p-2.5 rounded-xl border text-center font-bold text-[11px] transition cursor-pointer flex items-center justify-between ${
                          newBannerBgColor === thm.val
                            ? 'border-[#0B5D32] bg-[#EBF4EE] text-[#0B5D32]'
                            : 'border-[#DCE5DC] bg-[#F4F4EA]'
                        }`}
                      >
                        <span>{thm.label}</span>
                        <div
                          className={`w-5 h-5 rounded-full bg-gradient-to-r ${thm.val} border border-white`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[#3D5244] font-bold mb-1">
                    {isAr ? 'رابط صورة الخلفية:' : 'Background Photo:'}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={newBannerImage}
                    onChange={(e) => setNewBannerImage(e.target.value)}
                    className="w-full min-h-[38px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-1.5 text-[11px] font-mono text-left focus:bg-white focus:border-[#0B5D32] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddBannerModalOpen(false)}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-white border border-[#DCE5DC] text-[#3D5244] font-bold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {saving
                      ? isAr
                        ? 'جاري النشر...'
                        : 'Publishing...'
                      : isAr
                      ? 'نشر البنر في المتجر'
                      : 'Publish Banner'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: SHARE STORE MODAL (POS Style)
         ========================================================================= */}
      {isShareStoreModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2918]/65 backdrop-blur-xs p-3 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsShareStoreModalOpen(false);
          }}
        >
          <div className="bg-[#F4F4EA] border border-[#DCE5DC] rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-3.5 bg-white border-b border-[#DCE5DC] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#0B5D32] text-white flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-[#0B5D32] truncate">
                    {isAr ? 'مشاركة رابط المتجر' : 'Share Store Link'}
                  </h3>
                  <p className="text-[11px] text-[#5F7164] truncate">
                    {isAr
                      ? 'أرسل رابط سوبرماركت المنصور عبر واتساب وتطبيقات التواصل'
                      : 'Broadcast to WhatsApp, Telegram & Social Apps'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShareStoreModalOpen(false)}
                className="w-9 h-9 rounded-full bg-[#F4F4EA] border border-[#DCE5DC] text-[#3D5244] flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3.5 space-y-2">
                <label className="block text-xs font-black text-[#3D5244]">
                  {isAr ? 'رابط المتجر للزبائن (B2C):' : 'Direct Store Link:'}
                </label>
                <div className="bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl p-2 flex items-center justify-between gap-2">
                  <span
                    dir="ltr"
                    className="text-xs font-mono text-[#142018] truncate text-left flex-1 px-1"
                  >
                    {publicStoreUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyLink()}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      copiedLink
                        ? 'bg-[#0B5D32] text-white'
                        : 'bg-[#142018] hover:bg-black text-white'
                    }`}
                  >
                    {copiedLink ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? (isAr ? 'تم النسخ' : 'Copied') : isAr ? 'نسخ' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#EBF4EE] border border-[#DCE5DC] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#0B5D32] flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-[#25D366] fill-[#25D366]" />
                    {isAr ? 'المشاركة الفورية عبر واتساب' : 'Instant WhatsApp Share'}
                  </span>
                  <span className="text-[10px] bg-[#0B5D32] text-white font-black px-2 py-0.5 rounded-full">
                    {isAr ? 'موصى به' : 'Recommended'}
                  </span>
                </div>
                <p className="text-[11px] text-[#3D5244] leading-relaxed">
                  {isAr
                    ? 'يفتح واتساب مباشرة برسالة ترحيبية جاهزة مع رابط متجرك لإرسالها إلى مجموعات الحي والزبائن.'
                    : 'Opens WhatsApp with a pre-filled store invitation and direct link.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleShareWhatsApp();
                    setIsShareStoreModalOpen(false);
                  }}
                  className="w-full min-h-[42px] py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1FB858] text-white text-xs font-black transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>{isAr ? 'فتح واتساب وإرسال الرابط' : 'Open WhatsApp & Share'}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleShareTelegram();
                    setIsShareStoreModalOpen(false);
                  }}
                  className="min-h-[40px] py-2 px-2.5 rounded-xl bg-[#0088CC] hover:bg-[#0073AD] text-white text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تيليجرام' : 'Telegram'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleShareFacebook();
                    setIsShareStoreModalOpen(false);
                  }}
                  className="min-h-[40px] py-2 px-2.5 rounded-xl bg-[#1877F2] hover:bg-[#1465D0] text-white text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="font-bold text-sm">f</span>
                  <span>{isAr ? 'فيسبوك' : 'Facebook'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleNativeShare();
                    setIsShareStoreModalOpen(false);
                  }}
                  className="min-h-[40px] py-2 px-2.5 rounded-xl bg-[#142018] hover:bg-black text-white text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'المزيد' : 'More'}</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-[#DCE5DC] p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <QrCode className="w-4 h-4 text-[#0B5D32] shrink-0" />
                  <span className="text-xs font-bold text-[#142018] truncate">
                    {isAr ? 'بوستر باركود QR لطاولة الكاشير' : 'In-store QR poster'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsShareStoreModalOpen(false);
                    handleOpenPosterStudio();
                  }}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#EBF4EE] hover:bg-[#DCECE1] text-[#0B5D32] text-xs font-black transition cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isAr ? 'فتح البوستر' : 'Open Poster'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
