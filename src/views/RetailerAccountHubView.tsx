import React, { useState, useMemo, useEffect } from 'react';
import {
  User,
  ShoppingBag,
  MessageSquare,
  Headphones,
  Heart,
  MapPin,
  KeyRound,
  RotateCcw,
  ShieldCheck,
  FileCheck2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Phone,
  Send,
  Plus,
  Trash2,
  ShoppingCart,
  Scale,
  Store,
  Clock,
  AlertTriangle,
  BookOpen,
  Lock,
  Unlock,
  Check,
  CreditCard,
  FileText,
  AlertCircle,
  Sparkles,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Star
} from 'lucide-react';
import {
  AccountSectionId,
  CreditAccountItem,
  CreditUpgradeRequestItem,
  Currency,
  Language,
  LedgerEntryItem,
  OrderItem,
  ProductWithOffers,
  StoreBranchAddress,
  SupplierOfferItem
} from '../types/index.ts';
import { UserSession } from './WelcomeAuthView.tsx';
import {
  BAGHDAD_DISTRICTS,
  StoreDistrict,
  WHOLESALE_SUPPLIERS,
  WholesaleSupplier
} from '../data/nearbySuppliers.ts';
import { formatCurrency } from '../utils/format.ts';
import { getLocalizedText } from '../utils/translations.ts';
import { SupplierRatingModal } from '../components/SupplierRatingSection.tsx';
import { SupplierLedgerDetailView } from '../components/SupplierLedgerDetailView.tsx';
import { RetailerPaymentLedgerView } from './RetailerPaymentLedgerView.tsx';
import { RetailerInvoicesView } from './RetailerInvoicesView.tsx';

interface ChatThreadMessage {
  id: string;
  sender: 'me' | 'supplier';
  text: string;
  time: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  orderId?: string;
  category: string;
  details: string;
  status: 'open' | 'in_review' | 'resolved';
  createdAt: string;
}

interface RetailerAccountHubViewProps {
  activeSection: AccountSectionId;
  onSelectSection: (section: AccountSectionId) => void;
  onBackToMarketplace: () => void;
  onBrowseMarketplace?: () => void;
  userSession: UserSession;
  onUpdateProfile: (updated: Partial<UserSession>) => void;
  onDeleteAccount: () => void;
  currency: Currency;
  language: Language;
  orders: OrderItem[];
  products: ProductWithOffers[];
  onAddToCart: (product: ProductWithOffers, offer: SupplierOfferItem, quantity: number) => void;
  onCompareOffers: (product: ProductWithOffers) => void;
  onOpenSupplierStore: (supplier: WholesaleSupplier) => void;
  onExploreCategory: (category: string) => void;
  wishlistBarcodes: string[];
  onToggleWishlist: (barcode: string) => void;
  favoriteSupplierIds: string[];
  onToggleFavoriteSupplier: (supplierId: string) => void;
  currentDistrict: StoreDistrict;
  onSelectDistrict: (district: StoreDistrict) => void;
  savedAddresses: StoreBranchAddress[];
  onUpdateAddresses: (addresses: StoreBranchAddress[]) => void;
  unreadMessagesCount: number;
  onMarkMessagesRead: () => void;
}

export const RetailerAccountHubView: React.FC<RetailerAccountHubViewProps> = ({
  activeSection,
  onSelectSection,
  onBackToMarketplace,
  onBrowseMarketplace,
  userSession,
  onUpdateProfile,
  onDeleteAccount,
  currency,
  language,
  orders,
  products,
  onAddToCart,
  onCompareOffers,
  onOpenSupplierStore,
  onExploreCategory,
  wishlistBarcodes,
  onToggleWishlist,
  favoriteSupplierIds,
  onToggleFavoriteSupplier,
  currentDistrict,
  onSelectDistrict,
  savedAddresses,
  onUpdateAddresses,
  unreadMessagesCount,
  onMarkMessagesRead
}) => {
  const isAr = language === 'ar';

  // 1. Profile state
  const [profileName, setProfileName] = useState(userSession.name);
  const [profileEntity, setProfileEntity] = useState(userSession.entityName);
  const [profilePhone, setProfilePhone] = useState(userSession.phone || '+964 770 123 4567');
  const [taxRegNo, setTaxRegNo] = useState(() => {
    try {
      return localStorage.getItem('dalil_store_license') || 'BGD-COM-2026-4481';
    } catch {
      return 'BGD-COM-2026-4481';
    }
  });
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  // 2. Orders state
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'active' | 'delivered'>('all');
  const [reorderedOrderId, setReorderedOrderId] = useState<string | null>(null);
  const [ratingOrderTarget, setRatingOrderTarget] = useState<{
    supplierId: string;
    supplierName: string;
    orderId: string;
  } | null>(null);

  // 2B. Buyer-Side Credit & Ledger state (Read-only for this store's supplier credit lines)
  const [storeCreditAccounts, setStoreCreditAccounts] = useState<CreditAccountItem[]>([]);
  const [selectedCreditAccountId, setSelectedCreditAccountId] = useState<string | null>(null);
  const [openedSupplierLedgerId, setOpenedSupplierLedgerId] = useState<string | null>(null);
  const [showPaymentLedgerView, setShowPaymentLedgerView] = useState(false);
  const [storeLedgerEntries, setStoreLedgerEntries] = useState<LedgerEntryItem[]>([]);
  const [loadingCreditData, setLoadingCreditData] = useState(false);

  // Platform-Mediated Credit Limit Review state (Face-saving intermediary)
  const [upgradeRequests, setUpgradeRequests] = useState<CreditUpgradeRequestItem[]>([]);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeTargetAmount, setUpgradeTargetAmount] = useState('');
  const [upgradeReason, setUpgradeReason] = useState('');
  const [upgradeFeedback, setUpgradeFeedback] = useState<string | null>(null);
  const [submittingUpgrade, setSubmittingUpgrade] = useState(false);

  const loadStoreCreditData = () => {
    const storeId = 'store_almansoor';
    setLoadingCreditData(true);
    Promise.all([
      fetch(`/api/credit/accounts?storeId=${encodeURIComponent(storeId)}`).then((r) => r.json()),
      fetch(`/api/credit/upgrade-requests?storeId=${encodeURIComponent(storeId)}`).then((r) => r.json())
    ])
      .then(([accData, reqData]) => {
        if (accData.success && Array.isArray(accData.data)) {
          setStoreCreditAccounts(accData.data);
          if (accData.data.length > 0) {
            setSelectedCreditAccountId((prev) => prev || accData.data[0].id);
          }
        }
        if (reqData.success && Array.isArray(reqData.data)) {
          setUpgradeRequests(reqData.data);
        }
      })
      .catch((err) => console.error('Failed to load store credit data:', err))
      .finally(() => setLoadingCreditData(false));
  };

  useEffect(() => {
    loadStoreCreditData();
    if (activeSection !== 'credit_ledger') {
      setOpenedSupplierLedgerId(null);
      setShowPaymentLedgerView(false);
    }
  }, [userSession.entityName, activeSection]);

  useEffect(() => {
    if (!selectedCreditAccountId || activeSection !== 'credit_ledger') return;
    let active = true;
    fetch(`/api/credit/ledger/${selectedCreditAccountId}`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success && Array.isArray(data.data)) {
          setStoreLedgerEntries(data.data);
        }
      })
      .catch((err) => console.error('Failed to load store ledger:', err));
    return () => {
      active = false;
    };
  }, [selectedCreditAccountId, activeSection]);

  const selectedCreditAccount = useMemo(
    () => storeCreditAccounts.find((c) => c.id === selectedCreditAccountId) || storeCreditAccounts[0] || null,
    [storeCreditAccounts, selectedCreditAccountId]
  );

  const creditSummary = useMemo(() => {
    return storeCreditAccounts.reduce(
      (acc, item) => ({
        totalLimitIQD: acc.totalLimitIQD + item.creditLimitIQD,
        totalUsedIQD: acc.totalUsedIQD + item.currentUsedCreditIQD,
        totalAvailableIQD: acc.totalAvailableIQD + item.availableCreditIQD
      }),
      { totalLimitIQD: 0, totalUsedIQD: 0, totalAvailableIQD: 0 }
    );
  }, [storeCreditAccounts]);

  const selectedReliabilityScore = useMemo(() => {
    if (!selectedCreditAccount) return 95;
    let score = 96;
    if (selectedCreditAccount.aging.bucket31_60 > 0) score -= 6;
    if (selectedCreditAccount.aging.bucket61_90 > 0) score -= 22;
    if (selectedCreditAccount.aging.bucket90Plus > 0) score -= 35;
    if (selectedCreditAccount.isBlocked) score -= 20;
    const util =
      selectedCreditAccount.creditLimitIQD > 0
        ? selectedCreditAccount.currentUsedCreditIQD / selectedCreditAccount.creditLimitIQD
        : 0;
    if (util > 0.9) score -= 5;
    return Math.max(35, Math.min(99, score));
  }, [selectedCreditAccount]);

  const openCreditUpgradeModal = () => {
    if (!selectedCreditAccount) return;
    setUpgradeTargetAmount(String(Math.round(selectedCreditAccount.creditLimitIQD * 1.25)));
    setUpgradeReason('');
    setUpgradeFeedback(null);
    setIsUpgradeModalOpen(true);
  };

  const handleSubmitCreditUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCreditAccount || submittingUpgrade) return;
    const requestedLimitIQD = Number(upgradeTargetAmount);
    if (!requestedLimitIQD || requestedLimitIQD <= selectedCreditAccount.creditLimitIQD) {
      setUpgradeFeedback(
        isAr
          ? 'يرجى إدخال سقف مقترح أعلى من السقف الحالي.'
          : 'Please enter a target limit higher than the current limit.'
      );
      return;
    }

    setSubmittingUpgrade(true);
    setUpgradeFeedback(null);
    try {
      const res = await fetch('/api/credit/upgrade-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditAccountId: selectedCreditAccount.id,
          requestedLimitIQD,
          reason: upgradeReason
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'تعذر إرسال طلب التقييم');
      }
      setIsUpgradeModalOpen(false);
      setUpgradeFeedback(data.message);
      loadStoreCreditData();
    } catch (err: any) {
      setUpgradeFeedback(err?.message || 'حدث خطأ أثناء إرسال الطلب');
    } finally {
      setSubmittingUpgrade(false);
    }
  };

  // 3. Messages state (null = show directory of supplier threads; supplierId = open full focused chat)
  const [selectedChatSupplierId, setSelectedChatSupplierId] = useState<string | null>(null);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Record<string, ChatThreadMessage[]>>({
    supp_rafidain: [
      {
        id: 'm1',
        sender: 'supplier',
        text: isAr
          ? 'مرحباً بكم في شركة الرافدين! فان التوزيع السريع متاح حالياً في منطقتكم لتجهيز طلبيات السكر والأرز والزيوت.'
          : 'Welcome to Al-Rafidain Wholesale! Express delivery van is active in your district today.',
        time: '10:15'
      }
    ],
    supp_tigris: [
      {
        id: 'm2',
        sender: 'supplier',
        text: isAr
          ? 'وصلت شحنة ألبان وأجبان مبردة جديدة بتاريخ إنتاج اليوم — متوفرة للطلب المباشر.'
          : 'Fresh cold-chain dairy & cheese shipment arrived today — ready for direct dispatch.',
        time: '09:40'
      }
    ],
    supp_nahrain: [
      {
        id: 'm3',
        sender: 'supplier',
        text: isAr
          ? 'خصم خاص 6% على كرتونات القهوة المقطرة والشاي للطلبيات فوق 300,000 د.ع.'
          : 'Special 6% discount on drip coffee & tea cartons for orders over 300,000 IQD.',
        time: isAr ? 'أمس' : 'Yesterday'
      }
    ]
  });

  // 4. Support state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState(
    isAr ? 'متابعة توصيل وفان' : 'Delivery & Van Tracking'
  );
  const [ticketOrderId, setTicketOrderId] = useState('');
  const [ticketDetails, setTicketDetails] = useState('');
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 'TKT-9042',
      subject: isAr
        ? 'طلب زيادة سقف الائتمان الشهري للمتجر'
        : 'Request to raise monthly B2B credit limit',
      category: isAr ? 'الائتمان والفواتير' : 'Credit & Invoices',
      details: isAr
        ? 'نرغب برفع السقف من 14,500$ إلى 20,000$ لتغطية طلبات التموين الأسبوعية.'
        : 'Requesting credit increase for weekly restock.',
      status: 'in_review',
      createdAt: isAr ? 'اليوم • 09:20 ص' : 'Today • 09:20 AM'
    }
  ]);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  // 5. Addresses form state
  const [showAddBranchForm, setShowAddBranchForm] = useState(false);
  const [newBranchLabel, setNewBranchLabel] = useState('');
  const [newBranchDistrictId, setNewBranchDistrictId] = useState(BAGHDAD_DISTRICTS[0].id);
  const [newBranchStreet, setNewBranchStreet] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState(userSession.phone || '+964 770 123 4567');

  // 6. Security & Delete confirmation state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [posPin, setPosPin] = useState('2580');
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const navTabs: {
    id: AccountSectionId;
    label: string;
    icon: React.ElementType;
    badge?: string | number | null;
  }[] = [
    { id: 'profile', label: isAr ? 'ملفي' : 'My Profile', icon: User },
    {
      id: 'orders',
      label: isAr ? 'الطلبات' : 'Orders',
      icon: ShoppingBag,
      badge: orders.length > 0 ? orders.length : null
    },
    {
      id: 'invoices',
      label: isAr ? 'سجل الفواتير' : 'Invoices',
      icon: FileText
    },
    {
      id: 'credit_ledger',
      label: isAr ? 'الائتمان ودفتر الأستاذ' : 'Credit Ledger',
      icon: CreditCard,
      badge: storeCreditAccounts.length > 0 ? storeCreditAccounts.length : null
    },
    {
      id: 'wishlist',
      label: isAr ? 'قائمة الرغبات' : 'Wishlist',
      icon: Heart,
      badge: wishlistBarcodes.length + favoriteSupplierIds.length || null
    },
    { id: 'addresses', label: isAr ? 'العناوين' : 'Addresses', icon: MapPin },
    {
      id: 'messages',
      label: isAr ? 'الرسائل' : 'Messages',
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : null
    },
    { id: 'support', label: isAr ? 'الدعم 24/7' : '24/7 Support', icon: Headphones },
    { id: 'blog', label: isAr ? 'مدونة التاجر' : 'Trade Blog', icon: BookOpen },
    { id: 'security', label: isAr ? 'الأمان' : 'Security', icon: KeyRound },
    { id: 'return_policy', label: isAr ? 'سياسة الاسترجاع' : 'Returns', icon: RotateCcw },
    { id: 'terms', label: isAr ? 'البنود والشروط' : 'Terms', icon: FileCheck2 },
    { id: 'privacy', label: isAr ? 'الخصوصية' : 'Privacy', icon: ShieldCheck }
  ];

  const wishlistProducts = useMemo(
    () => products.filter((p) => wishlistBarcodes.includes(p.barcode)),
    [products, wishlistBarcodes]
  );

  const favoriteSuppliers = useMemo(
    () => WHOLESALE_SUPPLIERS.filter((s) => favoriteSupplierIds.includes(s.id)),
    [favoriteSupplierIds]
  );

  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === 'active') {
      return orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');
    }
    if (orderStatusFilter === 'delivered') {
      return orders.filter((o) => o.status === 'delivered');
    }
    return orders;
  }, [orders, orderStatusFilter]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('dalil_store_license', taxRegNo);
    } catch {
      // ignore storage errors
    }
    onUpdateProfile({
      name: profileName.trim() || userSession.name,
      entityName: profileEntity.trim() || userSession.entityName,
      phone: profilePhone.trim() || userSession.phone
    });
    setProfileSavedToast(true);
    window.setTimeout(() => setProfileSavedToast(false), 3000);
  };

  const handleReorder = (order: OrderItem) => {
    let addedCount = 0;
    order.items.forEach((line) => {
      const prod = products.find((p) => p.barcode === line.barcode);
      if (prod && prod.offers.length > 0) {
        const matchedOffer =
          prod.offers.find((o) => o.supplierId === order.supplierId) || prod.offers[0];
        onAddToCart(
          prod,
          matchedOffer,
          Math.max(line.quantity, matchedOffer.minOrderQuantity || 1)
        );
        addedCount++;
      }
    });
    if (addedCount > 0) {
      setReorderedOrderId(order.id);
      window.setTimeout(() => setReorderedOrderId(null), 2500);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChatSupplierId) return;
    const text = messageInput.trim();
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    setChatHistory((prev) => ({
      ...prev,
      [selectedChatSupplierId]: [
        ...(prev[selectedChatSupplierId] || []),
        { id: `msg_${Date.now()}`, sender: 'me', text, time: timeStr }
      ]
    }));
    setMessageInput('');
    onMarkMessagesRead();
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDetails.trim()) return;
    const newTicket: SupportTicket = {
      id: `TKT-${Math.floor(1000 + Math.random() * 8999)}`,
      subject: ticketSubject.trim(),
      orderId: ticketOrderId || undefined,
      category: ticketCategory,
      details: ticketDetails.trim(),
      status: 'open',
      createdAt: isAr ? 'الآن' : 'Just now'
    };
    setTickets((prev) => [newTicket, ...prev]);
    setTicketSubject('');
    setTicketDetails('');
    setTicketOrderId('');
    setTicketSuccess(true);
    window.setTimeout(() => setTicketSuccess(false), 3500);
  };

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchLabel.trim() || !newBranchStreet.trim()) return;
    const dist =
      BAGHDAD_DISTRICTS.find((d) => d.id === newBranchDistrictId) || BAGHDAD_DISTRICTS[0];
    const branch: StoreBranchAddress = {
      id: `branch_${Date.now()}`,
      labelAr: newBranchLabel.trim(),
      labelEn: newBranchLabel.trim(),
      districtId: dist.id,
      districtNameAr: dist.nameAr,
      districtNameEn: dist.nameEn,
      streetDetails: newBranchStreet.trim(),
      receiverPhone: newBranchPhone.trim() || '+964 770 123 4567',
      isDefault: savedAddresses.length === 0
    };
    onUpdateAddresses([...savedAddresses, branch]);
    setNewBranchLabel('');
    setNewBranchStreet('');
    setShowAddBranchForm(false);
  };

  const handleSetDefaultBranch = (branch: StoreBranchAddress) => {
    const updated = savedAddresses.map((b) => ({
      ...b,
      isDefault: b.id === branch.id
    }));
    onUpdateAddresses(updated);
    const matchingDist = BAGHDAD_DISTRICTS.find((d) => d.id === branch.districtId);
    if (matchingDist) {
      onSelectDistrict(matchingDist);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      setSecurityMessage(
        isAr
          ? 'يرجى التأكد من تطابق كلمة المرور الجديدة'
          : 'Please make sure the new passwords match'
      );
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSecurityMessage(
      isAr
        ? 'تم تحديث كلمة المرور ورمز أمان الكاشير (PIN) بنجاح.'
        : 'Password & POS PIN updated successfully.'
    );
    window.setTimeout(() => setSecurityMessage(null), 3500);
  };

  const blogArticles = [
    {
      id: 'art_1',
      tagAr: 'إدارة السيولة والأرباح',
      tagEn: 'Margins & Cashflow',
      readTime: isAr ? '4 دقائق قراءة' : '4 min read',
      titleAr: 'كيف ترفع هامش ربح السوبرماركت 14% في سلع الأرز والحبوب والزيوت؟',
      titleEn: 'How to boost supermarket margins by 14% on rice, grains & cooking oils',
      excerptAr:
        'استخدم الشراء التجميعي ومقارنة عروض الشورجة وجميلة قبل الشراء لتخفيض كلفة الكرتون، ووازن بين السلع الأساسية سريعة الدوران والمنتجات ذات الهامش المرتفع.',
      excerptEn:
        'Use collective factory deals and Shorja/Jamila price comparison to cut carton costs and optimize inventory turnover.',
      targetCategory: 'أرز وحبوب',
      ctaAr: 'تصفح عروض الأرز والحبوب'
    },
    {
      id: 'art_2',
      tagAr: 'سلاسل التبريد والألبان',
      tagEn: 'Cold Chain & Dairy',
      readTime: isAr ? '3 دقائق قراءة' : '3 min read',
      titleAr: 'جدول التوريد الذكي للألبان والمواد سريعة التلف لتصفير الهدر',
      titleEn: 'Smart replenishment scheduling for chilled dairy to reach zero waste',
      excerptAr:
        'الطلب كل 48 ساعة من فانات التوزيع السريع (< 24 ساعة) يمنع تكدس البضاعة القريبة من الانتهاء في مخزنك ويحافظ على سيولة الكاشير يومياً.',
      excerptEn:
        'Ordering every 48h from <24h express delivery vans minimizes expiry write-offs and preserves daily cashflow.',
      targetCategory: 'ألبان وأجبان',
      ctaAr: 'استعراض موردي الألبان والأجبان'
    },
    {
      id: 'art_3',
      tagAr: 'المبيعات والموسمية',
      tagEn: 'Seasonal Demand',
      readTime: isAr ? '5 دقائق قراءة' : '5 min read',
      titleAr: 'تجهيز رفوف القهوة والمشروبات الساخنة لموسم الذروة في بغداد',
      titleEn: 'Stocking coffee & hot beverages ahead of Baghdad peak season',
      excerptAr:
        'تنويع الأحجام بين القهوة المقطرة، أرابيكا 100%، وكبسولات القهوة يجذب شرائح زبائن ذات قيمة سلة أعلى ويزيد تكرار الزيارة للمحل.',
      excerptEn:
        'Balancing drip coffee, 100% Arabica, and coffee pods drives higher consumer basket value and repeat visits.',
      targetCategory: 'قهوة ومشروبات ساخنة',
      ctaAr: 'عروض القهوة والمشروبات الساخنة'
    }
  ];

  const activeSupplierChat = useMemo(
    () => WHOLESALE_SUPPLIERS.find((s) => s.id === selectedChatSupplierId) || null,
    [selectedChatSupplierId]
  );

  const filteredChatSuppliers = useMemo(() => {
    const q = chatSearchQuery.trim().toLowerCase();
    if (!q) return WHOLESALE_SUPPLIERS;
    return WHOLESALE_SUPPLIERS.filter(
      (s) =>
        s.nameAr.toLowerCase().includes(q) ||
        s.nameEn.toLowerCase().includes(q) ||
        s.districtAr.toLowerCase().includes(q)
    );
  }, [chatSearchQuery]);

  useEffect(() => {
    if (activeSection !== 'messages') {
      setSelectedChatSupplierId(null);
    }
  }, [activeSection]);

  const goToCatalog = onBrowseMarketplace || onBackToMarketplace;

  return (
    <div className="bg-[#F4F4EA] rounded-3xl border border-[#E2E6D7] p-3 sm:p-5 space-y-4 font-brand text-[#142018] pb-16">
      {/* ================= TOP WORKSPACE HEADER (POS Aesthetic) ================= */}
      <header className="flex flex-wrap items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBackToMarketplace}
            className="min-h-[38px] px-3.5 py-2 rounded-full bg-[#0B5D32] hover:bg-[#084726] text-white text-xs font-black flex items-center gap-1.5 transition shadow-2xs cursor-pointer shrink-0 whitespace-nowrap"
          >
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{isAr ? 'رجوع' : 'Back'}</span>
          </button>

          <div className="w-10 h-10 rounded-2xl bg-white border border-[#DCE5DC] text-[#0B5D32] hidden sm:flex items-center justify-center shrink-0">
            <Store className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black text-[#0B5D32] leading-tight truncate">
              {isAr ? 'مركز حساب التاجر والخدمات' : 'Retailer Account & Services'}
            </h1>
            <p className="text-[11px] text-[#5F7164] truncate">
              {userSession.entityName} • {isAr ? currentDistrict.nameAr : currentDistrict.nameEn}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onSelectSection('credit_ledger')}
            className="px-3 py-1.5 rounded-full bg-[#EBF4EE] hover:bg-[#DCEEE2] border border-[#DCE5DC] text-[#0B5D32] text-xs font-black tabular-nums whitespace-nowrap cursor-pointer transition"
          >
            {isAr ? 'الائتمان المتاح:' : 'Available Credit:'}{' '}
            {creditSummary.totalAvailableIQD > 0
              ? formatCurrency(creditSummary.totalAvailableIQD, currency, language)
              : '$14,500'}
          </button>
        </div>
      </header>

      {/* ================= HORIZONTAL SECTION TABS RAIL ================= */}
      <div className="bg-white rounded-2xl border border-[#DCE5DC] p-1.5 overflow-x-auto no-scrollbar shadow-[0_1px_4px_rgba(11,93,50,0.04)]">
        <div className="flex items-center gap-1.5 min-w-max">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  onSelectSection(tab.id);
                  if (tab.id === 'messages') onMarkMessagesRead();
                }}
                className={`min-h-[38px] px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0B5D32] text-white shadow-2xs'
                    : 'text-[#3D5244] hover:bg-[#F4F4EA]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge !== null && Number(tab.badge) > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-black tabular-nums leading-none ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#EBF4EE] text-[#0B5D32]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* =================== SECTION 1: PROFILE =================== */}
      {activeSection === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-[#0B5D32] text-white flex items-center justify-center shrink-0">
                <Store className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 text-[10px] font-black bg-[#EBF4EE] text-[#0B5D32] px-2 py-0.5 rounded-full border border-[#DCE5DC]">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{isAr ? 'حساب تاجر تجزئة موثق' : 'Verified Retailer'}</span>
                </span>
                <h2 className="text-base font-black text-[#142018] truncate mt-1">
                  {profileEntity}
                </h2>
                <p className="text-xs text-[#5F7164]">{profileName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-[#DCE5DC] text-xs tabular-nums">
              <div className="bg-[#F4F4EA] rounded-xl p-3 border border-[#DCE5DC]">
                <span className="text-[10.5px] text-[#5F7164] block">
                  {isAr ? 'إجمالي الطلبيات' : 'Total Orders'}
                </span>
                <span className="text-base font-black text-[#142018]">{orders.length}</span>
              </div>
              <div className="bg-[#F4F4EA] rounded-xl p-3 border border-[#DCE5DC]">
                <span className="text-[10.5px] text-[#5F7164] block">
                  {isAr ? 'قائمة الرغبات' : 'Saved Items'}
                </span>
                <span className="text-base font-black text-[#0B5D32]">
                  {wishlistBarcodes.length}
                </span>
              </div>
              <div className="bg-[#F4F4EA] rounded-xl p-3 border border-[#DCE5DC]">
                <span className="text-[10.5px] text-[#5F7164] block">
                  {isAr ? 'الفروع المسجلة' : 'Store Branches'}
                </span>
                <span className="text-base font-black text-[#142018]">
                  {savedAddresses.length}
                </span>
              </div>
              <div className="bg-[#F4F4EA] rounded-xl p-3 border border-[#DCE5DC]">
                <span className="text-[10.5px] text-[#5F7164] block">
                  {isAr ? 'موردون مفضلون' : 'Saved Suppliers'}
                </span>
                <span className="text-base font-black text-[#B45309]">
                  {favoriteSupplierIds.length}
                </span>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSaveProfile}
            className="lg:col-span-2 bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE5DC] pb-3">
              <div>
                <h3 className="text-sm font-black text-[#142018]">
                  {isAr ? 'تعديل البيانات التجارية للمتجر' : 'Edit Commercial Store Profile'}
                </h3>
                <p className="text-[11px] text-[#5F7164]">
                  {isAr
                    ? 'تظهر هذه البيانات في فواتير الجملة وطلبات فانات التوزيع'
                    : 'Used on wholesale invoices & van delivery dispatches'}
                </p>
              </div>
              {profileSavedToast && (
                <span className="px-3 py-1 rounded-xl bg-[#EBF4EE] text-[#0B5D32] border border-[#DCE5DC] text-xs font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تم الحفظ بنجاح' : 'Saved'}</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#3D5244] block">
                  {isAr ? 'اسم مدير السوبرماركت' : 'Manager Name'}
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full min-h-[42px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 focus:bg-white focus:border-[#0B5D32] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#3D5244] block">
                  {isAr ? 'اسم المتجر / السوبرماركت' : 'Store Name'}
                </label>
                <input
                  type="text"
                  value={profileEntity}
                  onChange={(e) => setProfileEntity(e.target.value)}
                  className="w-full min-h-[42px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 focus:bg-white focus:border-[#0B5D32] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#3D5244] block">
                  {isAr ? 'رقم الهاتف لاستلام الفانات' : 'Delivery Contact Phone'}
                </label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  dir="ltr"
                  className="w-full min-h-[42px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 font-mono text-left tabular-nums focus:bg-white focus:border-[#0B5D32] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#3D5244] block">
                  {isAr ? 'رقم الإجازة التجارية / الضريبي' : 'Trade License / Tax ID'}
                </label>
                <input
                  type="text"
                  value={taxRegNo}
                  onChange={(e) => setTaxRegNo(e.target.value)}
                  dir="ltr"
                  className="w-full min-h-[42px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 font-mono text-left focus:bg-white focus:border-[#0B5D32] outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="min-h-[42px] px-5 py-2.5 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white text-xs font-black transition shadow-2xs cursor-pointer"
              >
                {isAr ? 'حفظ وتحديث بيانات المتجر' : 'Save Store Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================== SECTION 2: ORDERS =================== */}
      {activeSection === 'orders' && (
        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCE5DC] pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#142018] flex items-center gap-2">
                <ShoppingBag className="w-4.5 h-4.5 text-[#0B5D32]" />
                <span>
                  {isAr ? 'سجل طلبيات التوريد وفواتير الجملة' : 'Wholesale Purchase Orders'}
                </span>
              </h2>
              <p className="text-[11px] text-[#5F7164] mt-0.5">
                {isAr
                  ? 'تابع حالة التوصيل وأعد طلب الأصناف الأكثر مبيعاً بنقرة واحدة'
                  : 'Track delivery vans & reorder items in one click'}
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[#F4F4EA] p-1 rounded-xl border border-[#DCE5DC] text-xs font-bold self-start sm:self-auto">
              {[
                { id: 'all', label: isAr ? 'الكل' : 'All' },
                { id: 'active', label: isAr ? 'قيد التوصيل' : 'Active' },
                { id: 'delivered', label: isAr ? 'مكتملة' : 'Delivered' }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setOrderStatusFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    orderStatusFilter === f.id
                      ? 'bg-[#0B5D32] text-white'
                      : 'text-[#4B6352] hover:text-[#142018]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center space-y-2.5">
              <ShoppingBag className="w-10 h-10 text-[#DCE5DC] mx-auto" />
              <p className="text-sm font-bold text-[#142018]">
                {isAr ? 'لا توجد طلبيات في هذا التصنيف حالياً' : 'No wholesale orders found here'}
              </p>
              <button
                type="button"
                onClick={goToCatalog}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white text-xs font-black cursor-pointer"
              >
                {isAr ? 'تصفح الكتالوج الآن' : 'Browse Catalog'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const matchedSupplier = WHOLESALE_SUPPLIERS.find(
                  (s) => s.id === order.supplierId || s.nameAr === order.supplierName
                );

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-[#DCE5DC] bg-[#F4F4EA] p-4 space-y-3 hover:border-[#0B5D32] transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-xs text-[#142018]">
                          {order.id}
                        </span>
                        <span className="text-[11px] bg-[#EBF4EE] text-[#0B5D32] border border-[#DCE5DC] px-2.5 py-0.5 rounded-lg font-bold">
                          {getLocalizedText(order.supplierName, language)}
                        </span>
                        {order.deliveryPin && (
                          <span className="text-[10px] bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] px-2 py-0.5 rounded-lg font-mono font-bold tabular-nums">
                            PIN: {order.deliveryPin}
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-[11px] font-black px-2.5 py-1 rounded-lg ${
                          order.status === 'delivered'
                            ? 'bg-[#EBF4EE] text-[#0B5D32]'
                            : 'bg-[#FEF3C7] text-[#92400E]'
                        }`}
                      >
                        {order.status === 'delivered'
                          ? isAr
                            ? 'تم التسليم بنجاح'
                            : 'Delivered'
                          : isAr
                          ? 'قيد التجهيز والتوصيل'
                          : 'Out for Delivery'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[11px] text-[#3D5244]">
                      {order.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="bg-white border border-[#DCE5DC] px-2.5 py-1 rounded-lg tabular-nums"
                        >
                          {item.productName} × <strong>{item.quantity}</strong>
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#DCE5DC] text-xs">
                      <div className="flex items-center gap-3 tabular-nums">
                        <span>
                          {isAr ? 'الإجمالي: ' : 'Total: '}
                          <strong className="text-[#0B5D32]">
                            {formatCurrency(order.subtotalIQD, currency, language)}
                          </strong>
                        </span>
                        <span className="text-[#5F7164] text-[11px]">
                          {order.paymentMethod === 'cod'
                            ? isAr
                              ? 'نقد عند الاستلام'
                              : 'Cash on Delivery'
                            : isAr
                            ? 'ائتمان آجل'
                            : 'Credit Terms'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setRatingOrderTarget({
                              supplierId: matchedSupplier?.id || order.supplierId,
                              supplierName: matchedSupplier
                                ? isAr
                                  ? matchedSupplier.nameAr
                                  : matchedSupplier.nameEn
                                : getLocalizedText(order.supplierName, language),
                              orderId: order.id
                            })
                          }
                          className="min-h-[36px] px-3 py-1.5 rounded-xl border border-[#FDE047] bg-[#FEF9C3] hover:bg-[#FEF08A] text-[#854D0E] text-[11px] font-black flex items-center gap-1 cursor-pointer transition"
                        >
                          <Star className="w-3.5 h-3.5 fill-[#EAB308] text-[#CA8A04]" />
                          <span>{isAr ? 'تقييم المورد' : 'Rate Supplier'}</span>
                        </button>

                        {matchedSupplier && (
                          <button
                            type="button"
                            onClick={() => onOpenSupplierStore(matchedSupplier)}
                            className="min-h-[36px] px-3 py-1.5 rounded-xl border border-[#DCE5DC] bg-white hover:border-[#0B5D32] text-[#142018] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Store className="w-3.5 h-3.5 text-[#0B5D32]" />
                            <span>{isAr ? 'متجر المورد' : 'Supplier Store'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleReorder(order)}
                          className={`min-h-[36px] px-3 py-1.5 rounded-xl text-white text-[11px] font-black flex items-center gap-1 cursor-pointer transition ${
                            reorderedOrderId === order.id
                              ? 'bg-[#084726]'
                              : 'bg-[#0B5D32] hover:bg-[#084726]'
                          }`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>
                            {reorderedOrderId === order.id
                              ? isAr
                                ? 'أضيف للسلة'
                                : 'Added'
                              : isAr
                              ? 'إعادة الطلب للسلة'
                              : 'Reorder to Cart'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =================== SECTION 2A: INVOICES & PAYMENT DETAILS =================== */}
      {activeSection === 'invoices' && (
        <RetailerInvoicesView
          creditAccounts={storeCreditAccounts}
          orders={orders}
          currency={currency}
          language={language}
          storeName={userSession.entityName}
          storeId={userSession.entityId || 'store_almansoor'}
          onBrowseMarketplace={goToCatalog}
          onOpenSupplierStatement={(creditAccountId) => {
            onSelectSection('credit_ledger');
            setSelectedCreditAccountId(creditAccountId);
            setOpenedSupplierLedgerId(creditAccountId);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* =================== SECTION 2B: BUYER CREDIT LEDGER (READ-ONLY) =================== */}
      {activeSection === 'credit_ledger' && (
        <div className="space-y-4">
        {showPaymentLedgerView ? (
          <RetailerPaymentLedgerView
            creditAccounts={storeCreditAccounts}
            orders={orders}
            currency={currency}
            language={language}
            storeName={userSession.entityName}
            onBack={() => {
              setShowPaymentLedgerView(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenSupplierStatement={(creditAccountId) => {
              setShowPaymentLedgerView(false);
              setSelectedCreditAccountId(creditAccountId);
              setOpenedSupplierLedgerId(creditAccountId);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : openedSupplierLedgerId && selectedCreditAccount ? (
          <SupplierLedgerDetailView
            account={selectedCreditAccount}
            ledgerEntries={storeLedgerEntries}
            supplierOrders={orders.filter(
              (o) =>
                o.supplierId === selectedCreditAccount.supplierId ||
                (selectedCreditAccount.supplierName && o.supplierName === selectedCreditAccount.supplierName)
            )}
            upgradeRequests={upgradeRequests}
            reliabilityScore={selectedReliabilityScore}
            currency={currency}
            language={language}
            storeName={userSession.entityName}
            onBack={() => {
              setOpenedSupplierLedgerId(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenSupplierStore={onOpenSupplierStore}
            onOpenCreditUpgradeModal={openCreditUpgradeModal}
          />
        ) : (
        <div className="space-y-4">
          {/* Store Summary KPI Header */}
          <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE5DC] pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-black text-[#142018] flex items-center gap-2">
                  <CreditCard className="w-4.5 h-4.5 text-[#0B5D32]" />
                  <span>
                    {isAr
                      ? `دفتر الأستاذ والائتمان التجاري — ${userSession.entityName}`
                      : `Commercial Credit Ledger — ${userSession.entityName}`}
                  </span>
                </h2>
                <p className="text-[11px] text-[#5F7164] mt-0.5">
                  {isAr
                    ? 'اختر أي مورد لفتح صفحة كشف الحساب التفصيلية (آجل ونقدي) وسجل الفواتير والدفعات'
                    : 'Select any supplier to open their dedicated statement page (Credit & Cash breakdown)'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentLedgerView(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-[#EBF4EE] hover:bg-[#DCECE1] border border-[#0B5D32]/25 text-[#0B5D32] text-xs font-black cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isAr ? 'سجل المعاملات وتاريخ السداد' : 'Payment & Transactions Ledger'}</span>
                </button>

                <button
                  type="button"
                  onClick={openCreditUpgradeModal}
                  disabled={!selectedCreditAccount}
                  className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white text-xs font-black cursor-pointer whitespace-nowrap flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FDE047]" />
                  <span>{isAr ? 'مراجعة ورفع السقف عبر المنصة' : 'Platform Limit Review'}</span>
                </button>
              </div>
            </div>

            {upgradeFeedback && !isUpgradeModalOpen && (
              <div className="p-3 rounded-xl bg-[#EFF7F1] border border-[#CBE0D0] text-[#0B5D32] text-xs font-bold flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{upgradeFeedback}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUpgradeFeedback(null)}
                  className="text-[#5F7164] hover:text-[#142018] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 tabular-nums">
              <div className="bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl p-3.5">
                <span className="text-[11px] text-[#5F7164] font-bold block">
                  {isAr ? 'إجمالي سقوف الائتمان الممنوحة' : 'Total Credit Limits'}
                </span>
                <strong className="text-base sm:text-lg font-black text-[#142018] mt-1 block">
                  {formatCurrency(creditSummary.totalLimitIQD, currency, language)}
                </strong>
              </div>
              <div className="bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl p-3.5">
                <span className="text-[11px] text-[#5F7164] font-bold block">
                  {isAr ? 'الرصيد المستخدم (الذمم الآجلة)' : 'Used Credit (Payable)'}
                </span>
                <strong className="text-base sm:text-lg font-black text-[#B45309] mt-1 block">
                  {formatCurrency(creditSummary.totalUsedIQD, currency, language)}
                </strong>
              </div>
              <div className="bg-[#EFF7F1] border border-[#CBE0D0] rounded-xl p-3.5">
                <span className="text-[11px] text-[#0B5D32] font-bold block">
                  {isAr ? 'الرصيد المتاح للشراء الآجل' : 'Available Credit Balance'}
                </span>
                <strong className="text-base sm:text-lg font-black text-[#0B5D32] mt-1 block">
                  {formatCurrency(creditSummary.totalAvailableIQD, currency, language)}
                </strong>
              </div>
            </div>
          </div>

          {loadingCreditData && storeCreditAccounts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#DCE5DC] p-8 text-center text-xs text-[#5F7164]">
              {isAr ? 'جاري تحميل كشوفات الائتمان...' : 'Loading credit statements...'}
            </div>
          ) : storeCreditAccounts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#DCE5DC] p-8 text-center space-y-2 text-xs text-[#5F7164]">
              <CreditCard className="w-10 h-10 text-[#DCE5DC] mx-auto" />
              <p className="font-bold text-[#142018]">
                {isAr ? 'لا توجد خطوط ائتمان مفعلة لهذا المتجر حالياً' : 'No active supplier credit lines yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs sm:text-sm font-black text-[#142018]">
                  {isAr ? 'حساباتك مع الموردين (اختر مورداً لفتح التفاصيل)' : 'Your Supplier Accounts (Select to open statement)'}
                </h3>
                <span className="text-[11px] font-bold text-[#5F7164] tabular-nums">
                  {storeCreditAccounts.length} {isAr ? 'موردين' : 'suppliers'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {storeCreditAccounts.map((acc) => {
                  const supplierLabel = acc.supplierName || acc.supplierId;
                  const usedPct =
                    acc.creditLimitIQD > 0
                      ? Math.min(100, Math.round((acc.currentUsedCreditIQD / acc.creditLimitIQD) * 100))
                      : 0;
                  const supplierCashOrders = orders.filter(
                    (o) =>
                      (o.supplierId === acc.supplierId || (acc.supplierName && o.supplierName === acc.supplierName)) &&
                      o.paymentMethod !== 'credit' &&
                      o.status !== 'cancelled'
                  );
                  const supplierCashTotalIQD = supplierCashOrders.reduce((s, o) => s + (o.subtotalIQD || 0), 0);

                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        setSelectedCreditAccountId(acc.id);
                        setOpenedSupplierLedgerId(acc.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full text-start p-4 rounded-2xl bg-white border border-[#DCE5DC] hover:border-[#0B5D32] hover:shadow-md transition cursor-pointer space-y-3 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-black text-sm text-[#142018] group-hover:text-[#0B5D32] transition line-clamp-1">
                            {isAr ? supplierLabel : getLocalizedText(supplierLabel, 'en')}
                          </div>
                          <span className="text-[11px] text-[#5F7164]">
                            {isAr ? `مهلة السداد: ${acc.paymentTermDays} يوماً` : `Payment Term: ${acc.paymentTermDays} days`}
                          </span>
                        </div>

                        {acc.isBlocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-100 text-[#B91C1C] px-2 py-0.5 rounded-full shrink-0">
                            <Lock className="w-2.5 h-2.5" />
                            <span>{isAr ? 'موقوف' : 'Blocked'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-[#0B5D32] px-2 py-0.5 rounded-full shrink-0">
                            <Unlock className="w-2.5 h-2.5" />
                            <span>{isAr ? 'نشط' : 'Active'}</span>
                          </span>
                        )}
                      </div>

                      {/* Quick Cash vs Credit Breakdown */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] tabular-nums">
                        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70">
                          <span className="text-[#92400E] font-bold block">
                            {isAr ? 'ذمة الآجل الحالية' : 'Credit Payable'}
                          </span>
                          <strong className="text-xs sm:text-sm font-black text-[#B45309] block mt-0.5">
                            {formatCurrency(acc.currentUsedCreditIQD, currency, language)}
                          </strong>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#EFF7F1] border border-[#CBE0D0]">
                          <span className="text-[#0B5D32] font-bold block">
                            {isAr ? `مشتريات نقدية (${supplierCashOrders.length})` : `Cash (${supplierCashOrders.length})`}
                          </span>
                          <strong className="text-xs sm:text-sm font-black text-[#0B5D32] block mt-0.5">
                            {formatCurrency(supplierCashTotalIQD, currency, language)}
                          </strong>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-[11px] tabular-nums">
                        <div className="flex justify-between text-[#5F7164]">
                          <span>
                            {isAr ? 'المتاح للآجل:' : 'Available Credit:'}{' '}
                            <strong className="text-[#0B5D32]">
                              {formatCurrency(acc.availableCreditIQD, currency, language)}
                            </strong>
                          </span>
                          <span className="font-bold">{usedPct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              usedPct >= 90 ? 'bg-red-500' : usedPct >= 70 ? 'bg-amber-500' : 'bg-[#0B5D32]'
                            }`}
                            style={{ width: `${usedPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs font-black text-[#0B5D32]">
                        <span>{isAr ? 'فتح كشف الحساب التفصيلي (آجل / نقدي)' : 'Open Detailed Statement'}</span>
                        {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        )}
          {/* Platform-Mediated Credit Limit Review Modal */}
          {isUpgradeModalOpen && selectedCreditAccount && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-[#DCE5DC]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-black bg-[#EFF7F1] text-[#0B5D32] px-2.5 py-0.5 rounded-full border border-[#CBE0D0]">
                      <ShieldCheck className="w-3 h-3" />
                      <span>
                        {isAr ? 'مراجعة عبر لجنة التقييم بالمنصة' : 'Platform Credit Committee'}
                      </span>
                    </span>
                    <h3 className="text-base font-black text-[#142018] mt-1.5">
                      {isAr ? 'طلب مراجعة ورفع السقف الائتماني' : 'Request Credit Limit Review'}
                    </h3>
                    <p className="text-[11px] text-[#5F7164] mt-0.5">
                      {selectedCreditAccount.supplierName || selectedCreditAccount.supplierId}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsUpgradeModalOpen(false)}
                    className="p-1.5 rounded-lg text-[#5F7164] hover:bg-[#F4F4EA] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-[#F4F4EA] border border-[#DCE5DC] text-[11px] text-[#3D5244] leading-relaxed">
                  {isAr
                    ? 'تتولى لجنة التقييم الائتماني في دليل الخيرات دراسة انتظام سدادكم وتقديم التوصية للمورد بصورة احترافية تحفظ العلاقة التجارية بين الطرفين.'
                    : 'Dalil Al-Khairat Credit Committee reviews your payment consistency and forwards a neutral recommendation to preserve merchant goodwill.'}
                </div>

                <form onSubmit={handleSubmitCreditUpgrade} className="space-y-3 text-xs">
                  <div className="flex items-center justify-between text-[11px] bg-white border border-[#DCE5DC] rounded-xl px-3 py-2 tabular-nums">
                    <span className="text-[#5F7164]">
                      {isAr ? 'السقف الحالي:' : 'Current Limit:'}
                    </span>
                    <strong className="text-[#142018]">
                      {formatCurrency(selectedCreditAccount.creditLimitIQD, currency, language)}
                    </strong>
                  </div>

                  <div>
                    <label className="font-bold text-[#3D5244] block mb-1.5">
                      {isAr ? 'اختر السقف الجديد المطلوب (دينار عراقي):' : 'Target New Limit (IQD):'}
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 mb-2">
                      {[1.25, 1.5, 2].map((mult) => {
                        const presetVal = Math.round(selectedCreditAccount.creditLimitIQD * mult);
                        const label = `+${Math.round((mult - 1) * 100)}%`;
                        return (
                          <button
                            key={mult}
                            type="button"
                            onClick={() => setUpgradeTargetAmount(String(presetVal))}
                            className={`py-1.5 px-2 rounded-lg border text-[11px] font-black cursor-pointer transition tabular-nums ${
                              Number(upgradeTargetAmount) === presetVal
                                ? 'bg-[#0B5D32] border-[#0B5D32] text-white'
                                : 'bg-[#F4F4EA] border-[#DCE5DC] text-[#3D5244] hover:border-[#0B5D32]'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      type="number"
                      required
                      min={selectedCreditAccount.creditLimitIQD + 500000}
                      step={500000}
                      value={upgradeTargetAmount}
                      onChange={(e) => setUpgradeTargetAmount(e.target.value)}
                      className="w-full min-h-[40px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 font-mono font-bold text-sm focus:bg-white focus:border-[#0B5D32] outline-none tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#3D5244] block mb-1">
                      {isAr ? 'مبررات التوسع (اختياري):' : 'Business Reason (Optional):'}
                    </label>
                    <textarea
                      rows={2}
                      value={upgradeReason}
                      onChange={(e) => setUpgradeReason(e.target.value)}
                      placeholder={
                        isAr
                          ? 'مثال: زيادة السحوبات الأسبوعية وتوسيع قسم الأغذية في المتجر'
                          : 'e.g. Expanding weekly restock volume'
                      }
                      className="w-full bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 focus:bg-white focus:border-[#0B5D32] outline-none"
                    />
                  </div>

                  {upgradeFeedback && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-[#B91C1C] text-[11px] font-bold">
                      {upgradeFeedback}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsUpgradeModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-[#F4F4EA] text-[#3D5244] font-bold cursor-pointer"
                    >
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={submittingUpgrade}
                      className="px-4 py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white font-black cursor-pointer disabled:opacity-50"
                    >
                      {submittingUpgrade
                        ? isAr
                          ? 'جاري التقييم...'
                          : 'Submitting...'
                        : isAr
                        ? 'إرسال للجنة التقييم'
                        : 'Submit for Review'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================== SECTION 3: WISHLIST =================== */}
      {activeSection === 'wishlist' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#DCE5DC] pb-3">
              <h2 className="text-sm sm:text-base font-black text-[#142018] flex items-center gap-2">
                <Heart className="w-4.5 h-4.5 text-[#0B5D32] fill-[#0B5D32]" />
                <span className="tabular-nums">
                  {isAr
                    ? `المنتجات المحفوظة (${wishlistProducts.length})`
                    : `Saved Products (${wishlistProducts.length})`}
                </span>
              </h2>
            </div>

            {wishlistProducts.length === 0 ? (
              <div className="py-10 text-center space-y-2.5 text-xs text-[#5F7164]">
                <Heart className="w-10 h-10 text-[#DCE5DC] mx-auto" />
                <p className="font-bold text-[#142018]">
                  {isAr ? 'قائمة الرغبات فارغة حالياً' : 'Your wishlist is empty'}
                </p>
                <p>
                  {isAr
                    ? 'اضغط على أيقونة القلب على أي منتج لحفظه ومتابعة تغيّر أسعاره هنا.'
                    : 'Tap the heart icon on any product to save it here.'}
                </p>
                <button
                  type="button"
                  onClick={goToCatalog}
                  className="mt-1 min-h-[40px] px-4 py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white font-black cursor-pointer"
                >
                  {isAr ? 'استكشاف المنتجات' : 'Browse Products'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {wishlistProducts.map((prod) => (
                  <div
                    key={prod.barcode}
                    className="rounded-2xl border border-[#DCE5DC] p-3.5 bg-[#F4F4EA] flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      {prod.imageUrl && (
                        <img
                          src={prod.imageUrl}
                          alt={prod.nameAr}
                          className="w-14 h-14 object-contain bg-white rounded-xl p-1 border border-[#DCE5DC] shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-[#142018] line-clamp-2">
                          {isAr ? prod.nameAr : getLocalizedText(prod.nameEn || prod.nameAr, language)}
                        </h4>
                        <span className="text-sm font-black text-[#0B5D32] tabular-nums block mt-1">
                          {formatCurrency(prod.minPrice, currency, language)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleWishlist(prod.barcode)}
                        className="p-2 text-[#E11D48] hover:bg-[#FDF2F2] rounded-lg transition cursor-pointer shrink-0"
                        title={isAr ? 'إزالة من المفضلة' : 'Remove'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[#DCE5DC]">
                      <button
                        type="button"
                        onClick={() => onCompareOffers(prod)}
                        className="flex-1 min-h-[36px] py-1.5 rounded-xl bg-white border border-[#DCE5DC] hover:border-[#0B5D32] text-[11px] font-bold text-[#142018] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Scale className="w-3.5 h-3.5 text-[#0B5D32]" />
                        <span>{isAr ? 'مقارنة العروض' : 'Compare'}</span>
                      </button>

                      {prod.offers[0] && (
                        <button
                          type="button"
                          onClick={() =>
                            onAddToCart(prod, prod.offers[0], prod.offers[0].minOrderQuantity || 1)
                          }
                          className="flex-1 min-h-[36px] py-1.5 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white text-[11px] font-black flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>{isAr ? 'أضف للسلة' : 'Add'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Saved Wholesale Suppliers */}
          <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-5 space-y-3">
            <h3 className="text-sm font-black text-[#142018] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0B5D32]" />
              <span className="tabular-nums">
                {isAr
                  ? `شركات وموردو الجملة المفضلون (${favoriteSuppliers.length})`
                  : `Favorite Suppliers (${favoriteSuppliers.length})`}
              </span>
            </h3>

            {favoriteSuppliers.length === 0 ? (
              <p className="text-xs text-[#5F7164]">
                {isAr
                  ? 'يمكنك حفظ أي شركة جملة كمورد مفضل من داخل صفحة متجر المورد لسهولة الوصول السريع إليها.'
                  : 'Save any wholesale supplier directly from their store page for quick access.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {favoriteSuppliers.map((supp) => (
                  <div
                    key={supp.id}
                    className="rounded-2xl border border-[#DCE5DC] p-3 bg-[#F4F4EA] flex items-center justify-between gap-2.5"
                  >
                    <div
                      onClick={() => onOpenSupplierStore(supp)}
                      className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                    >
                      <img
                        src={supp.logoUrl || supp.storeImageUrl}
                        alt=""
                        className="w-11 h-11 rounded-xl object-cover bg-white border border-[#DCE5DC] shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-black text-xs text-[#142018] truncate hover:text-[#0B5D32]">
                          {isAr ? supp.nameAr : supp.nameEn}
                        </h4>
                        <span className="text-[10.5px] text-[#5F7164] block truncate">
                          {isAr ? supp.districtAr : supp.districtEn}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleFavoriteSupplier(supp.id)}
                      className="p-2 text-[#E11D48] hover:bg-[#FDF2F2] rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================== SECTION 4: ADDRESSES =================== */}
      {activeSection === 'addresses' && (
        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE5DC] pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#142018] flex items-center gap-2">
                <MapPin className="w-4.5 h-4.5 text-[#0B5D32]" />
                <span>
                  {isAr ? 'إدارة عناوين استلام البضاعة وفروع المتجر' : 'Manage Store Delivery Addresses'}
                </span>
              </h2>
              <p className="text-[11px] text-[#5F7164] mt-0.5">
                {isAr
                  ? 'اختيار أي عنوان كافتراضي يحدّث المسافة الجغرافية وعروض الموردين الأقرب تلقائياً'
                  : 'Setting a default address updates supplier distance calculations'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddBranchForm((p) => !p)}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white text-xs font-black flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة فرع / عنوان' : 'Add Branch'}</span>
            </button>
          </div>

          {showAddBranchForm && (
            <form
              onSubmit={handleAddBranch}
              className="bg-[#F4F4EA] border border-[#DCE5DC] rounded-2xl p-4 space-y-3 text-xs"
            >
              <h4 className="font-black text-[#142018]">
                {isAr ? 'بيانات الفرع أو مستودع الاستلام الجديد' : 'New Receiving Location'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={newBranchLabel}
                  onChange={(e) => setNewBranchLabel(e.target.value)}
                  placeholder={isAr ? 'اسم الفرع (مثال: فرع الكرادة الرئيسي)' : 'Branch label'}
                  className="min-h-[40px] bg-white border border-[#DCE5DC] rounded-xl px-3 py-2 focus:border-[#0B5D32] outline-none"
                />
                <select
                  value={newBranchDistrictId}
                  onChange={(e) => setNewBranchDistrictId(e.target.value)}
                  className="min-h-[40px] bg-white border border-[#DCE5DC] rounded-xl px-3 py-2 focus:border-[#0B5D32] outline-none"
                >
                  {BAGHDAD_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {isAr ? `${d.nameAr} (${d.cityAr})` : `${d.nameEn} (${d.cityEn})`}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  value={newBranchStreet}
                  onChange={(e) => setNewBranchStreet(e.target.value)}
                  placeholder={isAr ? 'الشارع وأقرب نقطة دالة' : 'Street & nearest landmark'}
                  className="min-h-[40px] bg-white border border-[#DCE5DC] rounded-xl px-3 py-2 focus:border-[#0B5D32] outline-none"
                />
                <input
                  type="text"
                  value={newBranchPhone}
                  onChange={(e) => setNewBranchPhone(e.target.value)}
                  placeholder={isAr ? 'رقم هاتف مسؤول الاستلام' : 'Receiver phone'}
                  dir="ltr"
                  className="min-h-[40px] bg-white border border-[#DCE5DC] rounded-xl px-3 py-2 font-mono text-left focus:border-[#0B5D32] outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBranchForm(false)}
                  className="min-h-[38px] px-4 py-2 rounded-xl bg-white border border-[#DCE5DC] text-[#3D5244] font-bold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="min-h-[38px] px-4 py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white font-black cursor-pointer"
                >
                  {isAr ? 'حفظ العنوان' : 'Save Address'}
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {savedAddresses.map((branch) => {
              const isActiveDefault = branch.isDefault || branch.districtId === currentDistrict.id;
              return (
                <div
                  key={branch.id}
                  className={`rounded-2xl border p-4 space-y-2.5 transition ${
                    isActiveDefault
                      ? 'border-[#0B5D32] bg-[#EBF4EE]/60'
                      : 'border-[#DCE5DC] bg-[#F4F4EA]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-xs sm:text-sm text-[#142018]">
                          {isAr ? branch.labelAr : branch.labelEn}
                        </h4>
                        {isActiveDefault && (
                          <span className="text-[10px] bg-[#0B5D32] text-white px-2 py-0.5 rounded-full font-black">
                            {isAr ? 'العنوان النشط' : 'Active'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#0B5D32] font-bold mt-0.5">
                        {isAr ? branch.districtNameAr : branch.districtNameEn}
                      </p>
                      <p className="text-[11px] text-[#5F7164] mt-0.5">{branch.streetDetails}</p>
                      <p
                        className="text-[11px] font-mono text-[#3D5244] mt-1 inline-flex items-center gap-1.5 tabular-nums"
                        dir="ltr"
                      >
                        <Phone className="w-3 h-3 text-[#0B5D32]" />
                        <span>{branch.receiverPhone}</span>
                      </p>
                    </div>

                    {savedAddresses.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateAddresses(savedAddresses.filter((b) => b.id !== branch.id))
                        }
                        className="p-1.5 text-[#5F7164] hover:text-[#E11D48] rounded-lg cursor-pointer"
                        title={isAr ? 'حذف العنوان' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {!isActiveDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefaultBranch(branch)}
                      className="w-full min-h-[38px] py-1.5 rounded-xl bg-white border border-[#DCE5DC] hover:border-[#0B5D32] text-[#0B5D32] text-xs font-black transition cursor-pointer"
                    >
                      {isAr ? 'تعيين كعنوان استلام افتراضي' : 'Set as Active Location'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================== SECTION 5: MESSAGES =================== */}
      {activeSection === 'messages' && (
        <div className="bg-white rounded-2xl border border-[#DCE5DC] overflow-hidden shadow-[0_2px_10px_rgba(11,93,50,0.04)]">
          {!activeSupplierChat ? (
            /* VIEW 1: SUPPLIER CONVERSATIONS DIRECTORY (Full width, hides chat room until user selects a supplier) */
            <div className="bg-[#F4F4EA]/70 p-3.5 sm:p-5 space-y-3.5 min-h-[460px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="text-sm font-black text-[#142018] flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#0B5D32]" />
                    <span>{isAr ? 'محادثات الموردين وفانات التوزيع' : 'Supplier & Van Conversations'}</span>
                  </h3>
                  <p className="text-[11px] text-[#5F7164] mt-0.5">
                    {isAr
                      ? 'اضغط على أي شركة أو مورد لفتح نافذة المحادثة المباشرة الكاملة معه'
                      : 'Select any supplier or company to open a full-screen direct conversation'}
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[#5F7164] absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
                  <input
                    type="text"
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                    placeholder={isAr ? 'ابحث عن شركة أو مورد...' : 'Search supplier...'}
                    className="w-full min-h-[36px] bg-white border border-[#DCE5DC] rounded-xl ps-8 pe-3 py-1.5 text-xs focus:border-[#0B5D32] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredChatSuppliers.map((supp) => {
                  const msgs = chatHistory[supp.id] || [];
                  const lastMsg = msgs[msgs.length - 1];
                  return (
                    <button
                      key={supp.id}
                      type="button"
                      onClick={() => {
                        setSelectedChatSupplierId(supp.id);
                        onMarkMessagesRead();
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl text-start bg-white border border-[#DCE5DC] hover:border-[#0B5D32] hover:bg-[#EBF4EE]/50 transition-all shadow-2xs cursor-pointer group"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={supp.logoUrl || supp.storeImageUrl}
                          alt={isAr ? supp.nameAr : supp.nameEn}
                          className="w-12 h-12 rounded-xl object-cover border border-[#DCE5DC]"
                        />
                        <span
                          className="w-3 h-3 rounded-full bg-[#16A34A] border-2 border-white absolute -bottom-0.5 -end-0.5"
                          title={isAr ? 'متصل الآن' : 'Online'}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-black text-xs sm:text-[13px] text-[#142018] truncate group-hover:text-[#0B5D32] transition-colors">
                            {isAr ? supp.nameAr : supp.nameEn}
                          </h4>
                          {lastMsg?.time && (
                            <span className="text-[10px] font-bold text-[#5F7164] shrink-0 tabular-nums">
                              {lastMsg.time}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-[#5F7164] truncate mt-0.5">
                          {lastMsg
                            ? lastMsg.text
                            : isAr
                            ? `ابدأ محادثة مع ${supp.districtAr}...`
                            : `Start direct chat (${supp.districtEn})...`}
                        </p>

                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#0B5D32] font-bold">
                          <span>{isAr ? supp.districtAr : supp.districtEn}</span>
                          <span>•</span>
                          <span>
                            {isAr
                              ? `${supp.activeVansCount} فانات نشطة`
                              : `${supp.activeVansCount} active vans`}
                          </span>
                        </div>
                      </div>

                      <div className="w-7 h-7 rounded-lg bg-[#F4F4EA] group-hover:bg-[#0B5D32] text-[#3D5244] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                        {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    </button>
                  );
                })}

                {filteredChatSuppliers.length === 0 && (
                  <div className="md:col-span-2 bg-white border border-[#DCE5DC] rounded-2xl p-8 text-center text-xs text-[#5F7164]">
                    {isAr
                      ? 'لا توجد شركة مطابقة لبحثك. جرّب كتابة جزء آخر من اسم المورد.'
                      : 'No matching supplier found.'}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* VIEW 2: FULL FOCUSED SUPPLIER CHAT (All other chats hidden completely) */
            <div className="flex flex-col min-h-[520px] sm:min-h-[580px] bg-white">
              {/* Top Focused Chat Header */}
              <div className="p-3 sm:p-4 border-b border-[#DCE5DC] flex items-center justify-between gap-2 bg-white">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedChatSupplierId(null)}
                    className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-[#F4F4EA] hover:bg-[#EBF4EE] border border-[#DCE5DC] text-[#142018] hover:text-[#0B5D32] text-[11px] font-black flex items-center gap-1 transition cursor-pointer shrink-0"
                    title={isAr ? 'العودة لقائمة المحادثات' : 'Back to chats'}
                  >
                    {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                    <span className="hidden sm:inline">{isAr ? 'المحادثات' : 'Chats'}</span>
                  </button>

                  <div className="relative shrink-0">
                    <img
                      src={activeSupplierChat.logoUrl || activeSupplierChat.storeImageUrl}
                      alt={isAr ? activeSupplierChat.nameAr : activeSupplierChat.nameEn}
                      className="w-10 h-10 rounded-xl object-cover border border-[#DCE5DC]"
                    />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] border-2 border-white absolute -bottom-0.5 -end-0.5" />
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-black text-xs sm:text-sm text-[#142018] truncate">
                      {isAr ? activeSupplierChat.nameAr : activeSupplierChat.nameEn}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10.5px] text-[#0B5D32] font-bold truncate">
                      <span>{isAr ? 'مندوب المبيعات المباشر متصل' : 'Wholesale Rep Online'}</span>
                      <span className="text-[#DCE5DC]">•</span>
                      <span className="text-[#5F7164] truncate">
                        {isAr ? activeSupplierChat.districtAr : activeSupplierChat.districtEn}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={`tel:${activeSupplierChat.phone}`}
                    className="w-9 h-9 rounded-xl bg-[#F4F4EA] hover:bg-[#EBF4EE] border border-[#DCE5DC] text-[#0B5D32] flex items-center justify-center transition"
                    title={activeSupplierChat.phone}
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => onOpenSupplierStore(activeSupplierChat)}
                    className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#EBF4EE] hover:bg-[#DCEEE2] text-[#0B5D32] border border-[#DCE5DC] text-[11px] font-black cursor-pointer shrink-0 transition"
                  >
                    {isAr ? 'دخول للمتجر' : 'Open Store'}
                  </button>
                </div>
              </div>

              {/* Full-Screen Thread Body */}
              <div className="flex-1 p-4 sm:p-5 space-y-3 overflow-y-auto bg-[#F4F4EA]/65">
                <div className="bg-white/90 border border-[#DCE5DC] rounded-2xl p-3 text-[11px] text-[#3D5244] flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-black text-[#142018]">
                      {isAr ? 'تخصص التوريد: ' : 'Specialties: '}
                    </span>
                    <span>
                      {isAr ? activeSupplierChat.specialtiesAr : activeSupplierChat.specialtiesEn}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-[#EBF4EE] text-[#0B5D32] font-black text-[10.5px]">
                    {isAr ? activeSupplierChat.creditTermsAr : activeSupplierChat.creditTermsEn}
                  </span>
                </div>

                {(chatHistory[activeSupplierChat.id] || []).length === 0 && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs bg-white border border-[#DCE5DC] text-[#142018] shadow-2xs">
                      <p className="leading-relaxed">
                        {isAr
                          ? `أهلاً بكم في ${activeSupplierChat.nameAr}! يسعد فريق المبيعات وفانات التوزيع (${activeSupplierChat.deliveryTimeAr}) بخدمتكم وتجهيز تسعيرات الجملة لمتجركم.`
                          : `Welcome to ${activeSupplierChat.nameEn}! Our wholesale rep and van fleet (${activeSupplierChat.deliveryTimeEn}) are ready to assist your store.`}
                      </p>
                      <span className="text-[9.5px] block mt-1 text-[#5F7164]">
                        {isAr ? 'الآن' : 'Now'}
                      </span>
                    </div>
                  </div>
                )}

                {(chatHistory[activeSupplierChat.id] || []).map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs ${
                        m.sender === 'me'
                          ? 'bg-[#0B5D32] text-white'
                          : 'bg-white border border-[#DCE5DC] text-[#142018]'
                      }`}
                    >
                      <p className="leading-relaxed">{m.text}</p>
                      <span
                        className={`text-[9.5px] block mt-1 tabular-nums ${
                          m.sender === 'me' ? 'text-white/75' : 'text-[#5F7164]'
                        }`}
                      >
                        {m.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Composer Footer */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-4 border-t border-[#DCE5DC] bg-white space-y-2.5"
              >
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  {[
                    isAr ? 'هل يتوفر فان توصيل اليوم لمنطقتنا؟' : 'Is a van available today?',
                    isAr ? 'نحتاج تسعيرة خاصة لكمية 20 كرتون' : 'Need bulk quote for 20 cartons',
                    isAr ? 'هل يتوفر دفع آجل لهذه الطلبية؟' : 'Is credit payment available for this order?'
                  ].map((quick, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMessageInput(quick)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#F4F4EA] border border-[#DCE5DC] text-[10.5px] font-bold text-[#3D5244] hover:border-[#0B5D32] hover:bg-[#EBF4EE] whitespace-nowrap cursor-pointer transition"
                    >
                      {quick}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={
                      isAr
                        ? `اكتب رسالتك إلى ${activeSupplierChat.nameAr}...`
                        : `Type your message to ${activeSupplierChat.nameEn}...`
                    }
                    className="flex-1 min-h-[42px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3.5 py-2 text-xs focus:bg-white focus:border-[#0B5D32] outline-none"
                  />
                  <button
                    type="submit"
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white text-xs font-black flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إرسال' : 'Send'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* =================== SECTION 6: 24/7 SUPPORT =================== */}
      {activeSection === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <form
            onSubmit={handleCreateTicket}
            className="bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-5 space-y-3.5"
          >
            <div className="flex items-center justify-between border-b border-[#DCE5DC] pb-3 gap-2">
              <h2 className="text-sm font-black text-[#142018] flex items-center gap-2">
                <Headphones className="w-4.5 h-4.5 text-[#0B5D32]" />
                <span>{isAr ? 'مركز دعم التجار 24 ساعة' : '24/7 B2B Support Desk'}</span>
              </h2>
              <span className="text-[11px] font-mono font-bold text-[#0B5D32] tabular-nums" dir="ltr">
                +964 770 000 2470
              </span>
            </div>

            {ticketSuccess && (
              <div className="p-3 rounded-xl bg-[#EBF4EE] border border-[#DCE5DC] text-[#0B5D32] text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {isAr
                    ? 'تم فتح تذكرة الدعم بنجاح وسيتواصل معك فريق العمليات خلال دقائق.'
                    : 'Support ticket submitted!'}
                </span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#3D5244] block mb-1">
                  {isAr ? 'نوع الطلب أو المشكلة' : 'Issue Category'}
                </label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full min-h-[40px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 focus:border-[#0B5D32] outline-none"
                >
                  <option>{isAr ? 'متابعة توصيل وفان' : 'Delivery & Van Tracking'}</option>
                  <option>{isAr ? 'استرجاع أو تلف بضاعة' : 'Damaged Goods Return'}</option>
                  <option>{isAr ? 'الائتمان والفواتير' : 'Credit & Invoices'}</option>
                  <option>{isAr ? 'دعم الكاشير ونقاط البيع' : 'POS System Support'}</option>
                </select>
              </div>

              {orders.length > 0 && (
                <div>
                  <label className="font-bold text-[#3D5244] block mb-1">
                    {isAr ? 'ربط بطلب شراء (اختياري)' : 'Link Order (Optional)'}
                  </label>
                  <select
                    value={ticketOrderId}
                    onChange={(e) => setTicketOrderId(e.target.value)}
                    className="w-full min-h-[40px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 font-mono focus:border-[#0B5D32] outline-none"
                  >
                    <option value="">{isAr ? '-- بدون ربط طلب --' : '-- No order linked --'}</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.id} • {o.supplierName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold text-[#3D5244] block mb-1">
                  {isAr ? 'عنوان التذكرة' : 'Subject'}
                </label>
                <input
                  type="text"
                  required
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder={isAr ? 'مثال: تأخر وصول فان التوزيع للطلب...' : 'Ticket subject...'}
                  className="w-full min-h-[40px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 focus:bg-white focus:border-[#0B5D32] outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#3D5244] block mb-1">
                  {isAr ? 'التفاصيل' : 'Details'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={ticketDetails}
                  onChange={(e) => setTicketDetails(e.target.value)}
                  placeholder={
                    isAr ? 'اشرح تفاصيل الطلب لمساعدتك بسرعة...' : 'Describe your request...'
                  }
                  className="w-full bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 focus:bg-white focus:border-[#0B5D32] outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[42px] py-2.5 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white font-black cursor-pointer"
              >
                {isAr ? 'إرسال تذكرة الدعم' : 'Submit Support Ticket'}
              </button>
            </div>
          </form>

          <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-5 space-y-3">
            <h3 className="text-sm font-black text-[#142018]">
              {isAr ? 'تذاكر الدعم الحالية' : 'Your Support Tickets'}
            </h3>
            <div className="space-y-2.5">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-[#DCE5DC] bg-[#F4F4EA] p-3.5 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-black text-[#0B5D32]">{t.id}</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-[10px] font-bold">
                      {t.status === 'open'
                        ? isAr
                          ? 'جديدة'
                          : 'Open'
                        : isAr
                        ? 'قيد المعالجة'
                        : 'In Review'}
                    </span>
                  </div>
                  <h4 className="font-bold text-[#142018]">{t.subject}</h4>
                  <p className="text-[11px] text-[#5F7164]">{t.details}</p>
                  <div className="flex items-center justify-between text-[10px] text-[#5F7164] pt-1">
                    <span>{t.category}</span>
                    <span>{t.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================== SECTION 7: BLOG =================== */}
      {activeSection === 'blog' && (
        <div className="space-y-4">
          <div className="bg-[#0B5D32] rounded-2xl p-5 text-white">
            <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#FDE047]" />
              <span>
                {isAr
                  ? 'مدونة التاجر ودليل السوق العراقي B2B'
                  : 'Merchant Blog & Iraq Wholesale Insights'}
              </span>
            </h2>
            <p className="text-xs text-white/80 mt-1">
              {isAr
                ? 'مقالات وتوصيات عملية لزيادة أرباح السوبرماركت وتسريع دوران المخزون في السوق العراقي'
                : 'Practical strategies to grow grocery margins and optimize wholesale sourcing'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {blogArticles.map((art) => (
              <div
                key={art.id}
                className="bg-white rounded-2xl border border-[#DCE5DC] p-4 flex flex-col justify-between gap-3 hover:border-[#0B5D32] transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="bg-[#EBF4EE] text-[#0B5D32] px-2.5 py-0.5 rounded-lg border border-[#DCE5DC]">
                      {isAr ? art.tagAr : art.tagEn}
                    </span>
                    <span className="text-[#5F7164] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {art.readTime}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-[#142018] leading-snug">
                    {isAr ? art.titleAr : art.titleEn}
                  </h3>
                  <p className="text-xs text-[#5F7164] leading-relaxed">
                    {isAr ? art.excerptAr : art.excerptEn}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onExploreCategory(art.targetCategory)}
                  className="w-full min-h-[38px] py-2 rounded-xl bg-[#F4F4EA] border border-[#DCE5DC] hover:border-[#0B5D32] hover:text-[#0B5D32] text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>{isAr ? art.ctaAr : 'Explore Category'}</span>
                  {isAr ? (
                    <ArrowLeft className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================== SECTION 8: PASSWORD, SECURITY & DELETE =================== */}
      {activeSection === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <form
            onSubmit={handlePasswordSubmit}
            className="bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-5 space-y-3.5 text-xs"
          >
            <h2 className="text-sm font-black text-[#142018] flex items-center gap-2 border-b border-[#DCE5DC] pb-3">
              <KeyRound className="w-4.5 h-4.5 text-[#0B5D32]" />
              <span>
                {isAr
                  ? 'تغيير كلمة المرور ورمز أمان الكاشير (PIN)'
                  : 'Change Password & POS Security PIN'}
              </span>
            </h2>

            {securityMessage && (
              <div className="p-3 rounded-xl bg-[#EBF4EE] border border-[#DCE5DC] text-[#0B5D32] font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{securityMessage}</span>
              </div>
            )}

            <div>
              <label className="font-bold text-[#3D5244] block mb-1">
                {isAr ? 'كلمة المرور الحالية' : 'Current Password'}
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full min-h-[40px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 focus:bg-white focus:border-[#0B5D32] outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-[#3D5244] block mb-1">
                {isAr ? 'كلمة المرور الجديدة' : 'New Password'}
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full min-h-[40px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 focus:bg-white focus:border-[#0B5D32] outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-[#3D5244] block mb-1">
                {isAr ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full min-h-[40px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 focus:bg-white focus:border-[#0B5D32] outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-[#3D5244] block mb-1">
                {isAr
                  ? 'رمز PIN لإغلاق الكاشير وتأكيد الدفع الآجل'
                  : 'POS & Credit Confirmation PIN'}
              </label>
              <input
                type="text"
                maxLength={6}
                dir="ltr"
                value={posPin}
                onChange={(e) => setPosPin(e.target.value)}
                className="w-36 min-h-[40px] bg-[#F4F4EA] border border-[#DCE5DC] rounded-xl px-3 py-2 font-mono font-bold text-center tabular-nums focus:bg-white focus:border-[#0B5D32] outline-none"
              />
            </div>

            <button
              type="submit"
              className="min-h-[42px] px-5 py-2.5 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white font-black cursor-pointer"
            >
              {isAr ? 'تحديث كلمة المرور والأمان' : 'Update Security Settings'}
            </button>
          </form>

          <div className="bg-white rounded-2xl border border-[#FECACA] p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#E11D48]">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-black">
                {isAr ? 'حذف أو تصفير حساب المتجر' : 'Delete / Reset Store Account'}
              </h3>
            </div>
            <p className="text-xs text-[#5F7164] leading-relaxed">
              {isAr
                ? 'سيؤدي حذف الحساب إلى إنهاء جلستك الحالية ومسح تفضيلات المفضلة والعناوين المحفوظة محلياً مع إعادة المنصة لصفحة تسجيل الدخول.'
                : 'Deleting the account logs out your current session and clears locally stored preferences and saved addresses.'}
            </p>

            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="min-h-[40px] px-4 py-2 rounded-xl border border-[#FECACA] bg-[#FDF2F2] hover:bg-[#FEE2E2] text-[#991B1B] text-xs font-black flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isAr ? 'طلب حذف الحساب' : 'Request Account Deletion'}</span>
              </button>
            ) : (
              <div className="bg-[#FDF2F2] border border-[#FECACA] rounded-xl p-3.5 space-y-2.5 text-xs">
                <p className="font-bold text-[#991B1B]">
                  {isAr
                    ? 'هل أنت متأكد من حذف بيانات الحساب والخروج النهائي؟'
                    : 'Are you sure you want to delete this account session?'}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onDeleteAccount}
                    className="min-h-[38px] px-4 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-black cursor-pointer"
                  >
                    {isAr ? 'نعم، تأكيد الحذف' : 'Yes, Confirm Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="min-h-[38px] px-4 py-2 rounded-xl bg-white border border-[#DCE5DC] text-[#3D5244] font-bold cursor-pointer"
                  >
                    {isAr ? 'تراجع' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================== SECTION 9-11: LEGAL POLICIES =================== */}
      {(activeSection === 'return_policy' ||
        activeSection === 'terms' ||
        activeSection === 'privacy') && (
        <div className="bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#DCE5DC] pb-3 overflow-x-auto no-scrollbar">
            {[
              {
                id: 'return_policy',
                label: isAr ? 'سياسة الاسترجاع والاستبدال' : 'Return Policy',
                icon: RotateCcw
              },
              {
                id: 'terms',
                label: isAr ? 'البنود والشروط التجارية' : 'Terms & Conditions',
                icon: FileCheck2
              },
              {
                id: 'privacy',
                label: isAr ? 'سياسة الخصوصية وحماية البيانات' : 'Privacy Policy',
                icon: Lock
              }
            ].map((p) => {
              const Icon = p.icon;
              const isSelected = activeSection === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectSection(p.id as AccountSectionId)}
                  className={`min-h-[38px] px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-[#0B5D32] text-white'
                      : 'bg-[#F4F4EA] border border-[#DCE5DC] text-[#3D5244] hover:border-[#0B5D32]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {activeSection === 'return_policy' && (
            <div className="space-y-3 text-xs sm:text-sm text-[#3D5244] leading-relaxed">
              <h2 className="text-base font-black text-[#142018]">
                {isAr
                  ? 'سياسة الاسترجاع والاستبدال لطلبيات الجملة (B2B)'
                  : 'B2B Wholesale Return & Exchange Policy'}
              </h2>
              <ul className="space-y-2.5 list-disc list-inside bg-[#F4F4EA] border border-[#DCE5DC] rounded-2xl p-4">
                <li>
                  {isAr
                    ? 'يحق لصاحب السوبرماركت فحص الكراتين والمواد المبردة عند استلامها من فان التوزيع ورفض أي صنف تالف أو منخفض الصلاحية فوراً بدون رسوم.'
                    : 'Retailers have the right to inspect cartons and chilled dairy upon van arrival and reject damaged or near-expiry items with zero charges.'}
                </li>
                <li>
                  {isAr
                    ? 'يتم قيد إشعار دائن تلقائياً في دفتر الأستاذ التجاري أو استبدال البضاعة خلال 48 ساعة عمل في بغداد.'
                    : 'Credit notes are posted automatically to your supplier ledger or exchanged within 48 business hours.'}
                </li>
                <li>
                  {isAr
                    ? 'السلع الترويجية (تصفيات قرب الانتهاء) تخضع لتوضيح تاريخ الانتهاء المسبق قبل تأكيد الشراء.'
                    : 'Clearance near-expiry batches display exact expiry dates prior to checkout.'}
                </li>
              </ul>
            </div>
          )}

          {activeSection === 'terms' && (
            <div className="space-y-3 text-xs sm:text-sm text-[#3D5244] leading-relaxed">
              <h2 className="text-base font-black text-[#142018]">
                {isAr
                  ? 'البنود والشروط التجارية — دليل الخيرات B2B'
                  : 'Commercial Terms & Conditions'}
              </h2>
              <ul className="space-y-2.5 list-disc list-inside bg-[#F4F4EA] border border-[#DCE5DC] rounded-2xl p-4">
                <li>
                  {isAr
                    ? 'تُنفذ طلبيات الجملة وفق الحد الأدنى المعلن لكل شركة ومورد، وتُقسم الفاتورة الرئيسية تلقائياً حسب المستودع المُجهز.'
                    : 'Orders follow each supplier’s stated minimum order value and split automatically by fulfilling warehouse.'}
                </li>
                <li>
                  {isAr
                    ? 'تسهيلات الائتمان (15 أو 30 أو 45 يوماً) خاضعة لسقف الائتمان الممنوح وتنتظم بالسداد الدوري.'
                    : 'Deferred credit terms (15/30/45 days) apply within the approved credit limit and agreed settlement cycle.'}
                </li>
                <li>
                  {isAr
                    ? 'تأكيد استلام الشحنة يتم عبر رمز التسليم الأمني (Delivery PIN) لضمان حقوق التاجر والمورد.'
                    : 'Order handover verification requires the Delivery PIN to safeguard both retailer and supplier.'}
                </li>
              </ul>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="space-y-3 text-xs sm:text-sm text-[#3D5244] leading-relaxed">
              <h2 className="text-base font-black text-[#142018]">
                {isAr
                  ? 'سياسة الخصوصية وحماية بيانات السوبرماركت'
                  : 'Privacy & Store Data Protection Policy'}
              </h2>
              <ul className="space-y-2.5 list-disc list-inside bg-[#F4F4EA] border border-[#DCE5DC] rounded-2xl p-4">
                <li>
                  {isAr
                    ? 'تبقى بيانات مبيعات الكاشير (POS) ومعدلات دوران مخزون متجرك سرية ومشفرة بالكامل ولا تُشارك مع المتاجر المنافسة.'
                    : 'Your POS sales records and inventory turnover metrics remain strictly confidential and never shared with competing stores.'}
                </li>
                <li>
                  {isAr
                    ? 'تُستخدم بيانات الموقع الجغرافي (المنطقة/الشارع) حصراً لحساب أقرب موردي الجملة وتوجيه فانات التوصيل لمتجرك.'
                    : 'Store geolocation is used strictly to calculate nearby wholesale hubs and dispatch delivery vans.'}
                </li>
              </ul>
            </div>
          )}
        </div>
      )}

      {ratingOrderTarget && (
        <SupplierRatingModal
          isOpen={Boolean(ratingOrderTarget)}
          onClose={() => setRatingOrderTarget(null)}
          supplierId={ratingOrderTarget.supplierId}
          supplierName={ratingOrderTarget.supplierName}
          storeName={userSession.entityName}
          orderId={ratingOrderTarget.orderId}
          language={language}
          defaultFormOpen={true}
        />
      )}
    </div>
  );
};
