import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  FolderTree,
  History,
  Image as ImageIcon,
  Layers,
  MessageSquarePlus,
  Package,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Tag,
  X
} from 'lucide-react';
import {
  SHARED_CATEGORY_TREE,
  resolveSharedCategoryKey
} from '../../../shared/categoryTree.ts';
import {
  QUALITY_FIELD_DEFINITIONS,
  validateBarcode
} from '../../../shared/productQuality.ts';
import { ConfirmWithReasonDialog } from '../../components/admin/ConfirmWithReasonDialog.tsx';
import { Currency, Language } from '../../types/index.ts';
import { formatCurrency } from '../../utils/format.ts';
import { translations } from '../../utils/translations.ts';

export type CatalogTabId = 'products' | 'brands' | 'offers' | 'categories' | 'quality';

interface CatalogViewProps {
  mode: 'products' | 'brands' | 'offers';
  language: Language;
  currency: Currency;
  initialDeepLink?: {
    selectedId?: string | null;
    filterPreset?: string | null;
  };
  onDataChanged?: () => void;
}

const ADMIN_API_HEADERS: HeadersInit = {
  'x-user-role': 'admin'
};

interface MissingFieldInfo {
  key: string;
  labelAr: string;
  labelEn: string;
  weight: number;
  core: boolean;
}

interface CatalogProductItem {
  barcode: string;
  nameAr: string;
  nameEn?: string;
  brand: string;
  brandId?: string;
  category: string;
  subCategory?: string;
  unit: string;
  packSize?: string;
  packageQuantity: number;
  imageUrl?: string;
  descriptionAr?: string;
  isPerishable: boolean;
  storageType?: 'ambient' | 'chilled' | 'frozen' | 'dry' | 'controlled';
  countryOfOrigin?: string;
  standardBarcodeFormat: 'EAN-13' | 'GTIN-14' | 'UPC-A';
  status: 'active' | 'hidden' | 'archived';
  statusReason?: string;
  statusChangedAt?: string;
  qualityScore: number;
  missingFieldsCount: number;
  missingFields: MissingFieldInfo[];
  offersCount: number;
  activeOffersCount: number;
  minPriceIQD: number;
  totalAvailableStock: number;
}

interface CatalogOfferItem {
  id: string;
  barcode: string;
  supplierId: string;
  supplierName: string;
  supplierCity: string;
  priceIQD: number;
  priceUSD: number;
  minOrderQuantity: number;
  availableStock: number;
  deliveryDays: number;
  status: 'active' | 'suspended';
  statusReason?: string;
  statusChangedAt?: string;
  productNameAr?: string;
  productNameEn?: string;
  productUnit?: string;
  productCategory?: string;
  isLowStock?: boolean;
  isLowestPrice?: boolean;
  isPriceAnomaly?: boolean;
  medianPriceIQD?: number | null;
  deviationPercent?: number | null;
  isClearanceNearExpiry?: boolean;
  clearanceDiscountPercent?: number;
  expiryDate?: string;
}

interface CatalogBrandItem {
  id: string;
  nameAr: string;
  nameEn: string;
  logoUrl?: string;
  status: 'active' | 'hidden';
  statusReason?: string;
  statusChangedAt?: string;
  productsCount: number;
  activeProductsCount: number;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  mode,
  language,
  currency,
  initialDeepLink,
  onDataChanged
}) => {
  const isAr = language === 'ar';
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<CatalogTabId>(mode);
  useEffect(() => {
    setActiveTab(mode);
  }, [mode]);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => {
      setToast((cur) => (cur?.text === text ? null : cur));
    }, 4000);
  }, []);

  // Products state
  const [prodSearch, setProdSearch] = useState('');
  const [prodStatus, setProdStatus] = useState<'all' | 'active' | 'hidden' | 'archived'>('all');
  const [prodCategory, setProdCategory] = useState('all');
  const [prodBrandId, setProdBrandId] = useState('all');
  const [prodMaxQuality, setProdMaxQuality] = useState('');
  const [prodHasOffers, setProdHasOffers] = useState<'all' | 'with' | 'without'>('all');
  const [prodSuppliersFilter, setProdSuppliersFilter] = useState<'all' | '0' | '1' | '2+'>('all');
  const [prodSortBy, setProdSortBy] = useState('quality_asc');
  const [prodPage, setProdPage] = useState(1);
  const [prodData, setProdData] = useState<{
    items: CatalogProductItem[];
    total: number;
    page: number;
    totalPages: number;
    counts: {
      all: number;
      active: number;
      hidden: number;
      archived: number;
      withoutOffers: number;
      lowQuality: number;
    };
    categories: Array<{ categoryKey: string; labelAr: string; labelEn: string }>;
    brands: Array<{ id: string; nameAr: string; nameEn: string; status: string }>;
  } | null>(null);
  const [prodLoading, setProdLoading] = useState(false);

  // Product detail drawer
  const [detailBarcode, setDetailBarcode] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<{
    product: CatalogProductItem & { adminNotes?: Array<{ id: string; at: string; author: string; text: string }> };
    offers: CatalogOfferItem[];
    quality: { score: number; maxScore: number; missingFields: MissingFieldInfo[]; hasActiveOffer: boolean };
    auditLogs: Array<{
      id: string;
      at: string;
      actorName: string;
      action: string;
      summaryAr: string;
      summaryEn?: string;
      reason?: string;
    }>;
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailSubTab, setDetailSubTab] = useState<'overview' | 'offers' | 'notes' | 'audit'>('overview');
  const [noteInput, setNoteInput] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  // Add / Edit Product Modal
  const [productModalMode, setProductModalMode] = useState<'create' | 'edit' | null>(null);
  const [prodForm, setProdForm] = useState({
    barcode: '',
    nameAr: '',
    nameEn: '',
    brandId: '',
    brand: '',
    category: 'مواد غذائية أساسية',
    subCategory: '',
    unit: 'كرتون',
    packSize: '',
    packageQuantity: '1',
    imageUrl: '',
    descriptionAr: '',
    storageType: '' as '' | 'ambient' | 'chilled' | 'frozen' | 'dry' | 'controlled',
    countryOfOrigin: '',
    isPerishable: false
  });
  const [prodSubmitting, setProdSubmitting] = useState(false);

  // Brands state
  const [brandSearch, setBrandSearch] = useState('');
  const [brandStatus, setBrandStatus] = useState<'all' | 'active' | 'hidden'>('all');
  const [brandData, setBrandData] = useState<{
    items: CatalogBrandItem[];
    counts: { all: number; active: number; hidden: number };
  } | null>(null);
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandModalMode, setBrandModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [brandForm, setBrandForm] = useState({ nameAr: '', nameEn: '', logoUrl: '' });
  const [brandSubmitting, setBrandSubmitting] = useState(false);

  // Offers state
  const [offerSearch, setOfferSearch] = useState('');
  const [offerSupplierId, setOfferSupplierId] = useState('all');
  const [offerStatus, setOfferStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [offerLowStock, setOfferLowStock] = useState(false);
  const [offerAnomalyOnly, setOfferAnomalyOnly] = useState(false);
  const [offerPage, setOfferPage] = useState(1);
  const [offerData, setOfferData] = useState<{
    items: CatalogOfferItem[];
    total: number;
    page: number;
    totalPages: number;
    counts: { all: number; active: number; suspended: number; lowStock: number; anomaly: number };
    suppliers: Array<{ id: string; companyName: string }>;
  } | null>(null);
  const [offerLoading, setOfferLoading] = useState(false);

  // Tree state
  const [treeData, setTreeData] = useState<{
    totalDepartments: number;
    totalBranches: number;
    totalProducts: number;
    departments: Array<{
      id: string;
      order: number;
      categoryKey: string;
      labelAr: string;
      labelEn: string;
      productsCount: number;
      activeProductsCount: number;
      hiddenOrArchivedCount: number;
      branches: Array<{
        id: string;
        labelAr: string;
        labelEn: string;
        subCategoryKey: string;
        productsCount: number;
        activeProductsCount: number;
      }>;
    }>;
  } | null>(null);
  const [treeSearch, setTreeSearch] = useState('');
  const [expandedDeptIds, setExpandedDeptIds] = useState<Record<string, boolean>>({});
  const [treeLoading, setTreeLoading] = useState(false);

  // Quality state
  const [qualityData, setQualityData] = useState<{
    totalProducts: number;
    averageScore: number;
    below60Count: number;
    below80Count: number;
    withoutOffersCount: number;
    missingFieldStats: Array<MissingFieldInfo & { missingCount: number; missingPercent: number }>;
    worstProducts: Array<{
      barcode: string;
      nameAr: string;
      nameEn?: string;
      brand: string;
      category: string;
      imageUrl?: string;
      status: string;
      score: number;
      missingFields: MissingFieldInfo[];
      offersCount: number;
      activeOffersCount: number;
    }>;
  } | null>(null);
  const [qualityLoading, setQualityLoading] = useState(false);

  // ConfirmWithReasonDialog state
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    kind: 'product' | 'brand' | 'offer';
    id: string;
    action: string;
    title: string;
    description: string;
    confirmLabel: string;
    variant: 'danger' | 'warning' | 'primary';
  } | null>(null);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  // Handle deep links from Overview KPIs / Attention Queue / Global Search
  useEffect(() => {
    if (!initialDeepLink) return;
    if (initialDeepLink.filterPreset === 'without_offers') {
      setActiveTab('products');
      setProdHasOffers('without');
    } else if (initialDeepLink.filterPreset === 'price_anomaly') {
      setActiveTab('offers');
      setOfferAnomalyOnly(true);
    } else if (initialDeepLink.filterPreset === 'low_stock') {
      setActiveTab('offers');
      setOfferLowStock(true);
    } else if (initialDeepLink.filterPreset === 'quality') {
      setActiveTab('quality');
    }
    if (initialDeepLink.selectedId) {
      setActiveTab('products');
      setDetailBarcode(initialDeepLink.selectedId);
    }
  }, [initialDeepLink]);

  const fetchProducts = useCallback(async () => {
    setProdLoading(true);
    try {
      const qs = new URLSearchParams();
      if (prodSearch.trim()) qs.set('search', prodSearch.trim());
      if (prodStatus !== 'all') qs.set('status', prodStatus);
      if (prodCategory !== 'all') qs.set('category', prodCategory);
      if (prodBrandId !== 'all') qs.set('brandId', prodBrandId);
      if (prodMaxQuality) qs.set('maxQuality', prodMaxQuality);
      if (prodHasOffers !== 'all') qs.set('hasOffers', prodHasOffers);
      if (prodSuppliersFilter !== 'all') qs.set('suppliersFilter', prodSuppliersFilter);
      qs.set('sortBy', prodSortBy);
      qs.set('page', String(prodPage));
      qs.set('pageSize', '15');

      const res = await fetch(`/api/admin/catalog/products?${qs.toString()}`, {
        headers: ADMIN_API_HEADERS
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || t.error);
      setProdData(json.data);
    } catch (err: any) {
      showToast('error', err?.message || t.error);
    } finally {
      setProdLoading(false);
    }
  }, [
    prodSearch,
    prodStatus,
    prodCategory,
    prodBrandId,
    prodMaxQuality,
    prodHasOffers,
    prodSuppliersFilter,
    prodSortBy,
    prodPage,
    showToast,
    t.error
  ]);

  const fetchProductDetail = useCallback(
    async (barcode: string) => {
      setDetailLoading(true);
      try {
        const res = await fetch(`/api/admin/catalog/products/${encodeURIComponent(barcode)}`, {
          headers: ADMIN_API_HEADERS
        });
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.message || t.error);
        setDetailData(json.data);
      } catch (err: any) {
        showToast('error', err?.message || t.error);
      } finally {
        setDetailLoading(false);
      }
    },
    [showToast, t.error]
  );

  const fetchBrands = useCallback(async () => {
    setBrandLoading(true);
    try {
      const qs = new URLSearchParams();
      if (brandSearch.trim()) qs.set('search', brandSearch.trim());
      if (brandStatus !== 'all') qs.set('status', brandStatus);
      const res = await fetch(`/api/admin/catalog/brands?${qs.toString()}`, {
        headers: ADMIN_API_HEADERS
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || t.error);
      setBrandData(json.data);
    } catch (err: any) {
      showToast('error', err?.message || t.error);
    } finally {
      setBrandLoading(false);
    }
  }, [brandSearch, brandStatus, showToast, t.error]);

  const fetchOffers = useCallback(async () => {
    setOfferLoading(true);
    try {
      const qs = new URLSearchParams();
      if (offerSearch.trim()) qs.set('search', offerSearch.trim());
      if (offerSupplierId !== 'all') qs.set('supplierId', offerSupplierId);
      if (offerStatus !== 'all') qs.set('status', offerStatus);
      if (offerLowStock) qs.set('lowStock', 'true');
      if (offerAnomalyOnly) qs.set('anomalyOnly', 'true');
      qs.set('page', String(offerPage));
      qs.set('pageSize', '15');

      const res = await fetch(`/api/admin/catalog/offers?${qs.toString()}`, {
        headers: ADMIN_API_HEADERS
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || t.error);
      setOfferData(json.data);
    } catch (err: any) {
      showToast('error', err?.message || t.error);
    } finally {
      setOfferLoading(false);
    }
  }, [
    offerSearch,
    offerSupplierId,
    offerStatus,
    offerLowStock,
    offerAnomalyOnly,
    offerPage,
    showToast,
    t.error
  ]);

  const fetchTree = useCallback(async () => {
    setTreeLoading(true);
    try {
      const res = await fetch('/api/admin/catalog/tree', { headers: ADMIN_API_HEADERS });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || t.error);
      setTreeData(json.data);
    } catch (err: any) {
      showToast('error', err?.message || t.error);
    } finally {
      setTreeLoading(false);
    }
  }, [showToast, t.error]);

  const fetchQuality = useCallback(async () => {
    setQualityLoading(true);
    try {
      const res = await fetch('/api/admin/catalog/quality-summary', {
        headers: ADMIN_API_HEADERS
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || t.error);
      setQualityData(json.data);
    } catch (err: any) {
      showToast('error', err?.message || t.error);
    } finally {
      setQualityLoading(false);
    }
  }, [showToast, t.error]);

  useEffect(() => {
    if (activeTab === 'products') fetchProducts();
  }, [activeTab, fetchProducts]);

  useEffect(() => {
    if (activeTab === 'brands') fetchBrands();
  }, [activeTab, fetchBrands]);

  useEffect(() => {
    if (activeTab === 'offers') fetchOffers();
  }, [activeTab, fetchOffers]);

  useEffect(() => {
    if (activeTab === 'categories') fetchTree();
  }, [activeTab, fetchTree]);

  useEffect(() => {
    if (activeTab === 'quality') fetchQuality();
  }, [activeTab, fetchQuality]);

  useEffect(() => {
    if (detailBarcode) {
      fetchProductDetail(detailBarcode);
    } else {
      setDetailData(null);
    }
  }, [detailBarcode, fetchProductDetail]);

  const refreshActiveViews = useCallback(() => {
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'brands') fetchBrands();
    if (activeTab === 'offers') fetchOffers();
    if (activeTab === 'categories') fetchTree();
    if (activeTab === 'quality') fetchQuality();
    if (detailBarcode) fetchProductDetail(detailBarcode);
    onDataChanged?.();
  }, [
    activeTab,
    detailBarcode,
    fetchBrands,
    fetchOffers,
    fetchProductDetail,
    fetchProducts,
    fetchQuality,
    fetchTree,
    onDataChanged
  ]);

  const barcodeLiveCheck = useMemo(() => {
    if (!prodForm.barcode.trim()) return null;
    return validateBarcode(prodForm.barcode);
  }, [prodForm.barcode]);

  const availableBranchesForSelectedCategory = useMemo(() => {
    const resolved = resolveSharedCategoryKey(prodForm.category);
    const dept = SHARED_CATEGORY_TREE.find((d) => d.categoryKey === resolved);
    return dept ? dept.branches : [];
  }, [prodForm.category]);

  const openCreateProductModal = () => {
    const firstBrand = prodData?.brands?.[0];
    setProdForm({
      barcode: '',
      nameAr: '',
      nameEn: '',
      brandId: firstBrand?.id || '',
      brand: firstBrand?.nameAr || '',
      category: 'مواد غذائية أساسية',
      subCategory: '',
      unit: 'كرتون (12 قطعة)',
      packSize: '',
      packageQuantity: '1',
      imageUrl: '',
      descriptionAr: '',
      storageType: 'ambient',
      countryOfOrigin: '',
      isPerishable: false
    });
    setProductModalMode('create');
  };

  const openEditProductModal = (p: {
    barcode: string;
    nameAr: string;
    nameEn?: string;
    brand: string;
    brandId?: string;
    category: string;
    subCategory?: string;
    unit?: string;
    packSize?: string;
    packageQuantity?: number;
    imageUrl?: string;
    descriptionAr?: string;
    storageType?: 'ambient' | 'chilled' | 'frozen' | 'dry' | 'controlled';
    countryOfOrigin?: string;
    isPerishable?: boolean;
  }) => {
    setProdForm({
      barcode: p.barcode,
      nameAr: p.nameAr || '',
      nameEn: p.nameEn || '',
      brandId: p.brandId || '',
      brand: p.brand || '',
      category: resolveSharedCategoryKey(p.category || 'مواد غذائية أساسية'),
      subCategory: p.subCategory || '',
      unit: p.unit || 'كرتون',
      packSize: p.packSize || '',
      packageQuantity: String(p.packageQuantity || 1),
      imageUrl: p.imageUrl || '',
      descriptionAr: p.descriptionAr || '',
      storageType: p.storageType || '',
      countryOfOrigin: p.countryOfOrigin || '',
      isPerishable: Boolean(p.isPerishable)
    });
    setProductModalMode('edit');
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProdSubmitting(true);
    try {
      const payload = {
        barcode: prodForm.barcode.trim(),
        nameAr: prodForm.nameAr.trim(),
        nameEn: prodForm.nameEn.trim() || undefined,
        brandId: prodForm.brandId || undefined,
        brand: prodForm.brand.trim() || undefined,
        category: prodForm.category,
        subCategory: prodForm.subCategory.trim() || undefined,
        unit: prodForm.unit.trim(),
        packSize: prodForm.packSize.trim() || undefined,
        packageQuantity: Math.max(1, Number(prodForm.packageQuantity) || 1),
        imageUrl: prodForm.imageUrl.trim(),
        descriptionAr: prodForm.descriptionAr.trim() || undefined,
        storageType: prodForm.storageType || undefined,
        countryOfOrigin: prodForm.countryOfOrigin.trim() || undefined,
        isPerishable: prodForm.isPerishable
      };

      const isCreate = productModalMode === 'create';
      const url = isCreate
        ? '/api/admin/catalog/products'
        : `/api/admin/catalog/products/${encodeURIComponent(prodForm.barcode)}`;
      const res = await fetch(url, {
        method: isCreate ? 'POST' : 'PATCH',
        headers: { ...ADMIN_API_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isCreate
            ? payload
            : {
                nameAr: payload.nameAr,
                nameEn: prodForm.nameEn.trim() ? prodForm.nameEn.trim() : null,
                brandId: payload.brandId,
                category: payload.category,
                subCategory: prodForm.subCategory.trim() ? prodForm.subCategory.trim() : null,
                unit: payload.unit,
                packSize: prodForm.packSize.trim() ? prodForm.packSize.trim() : null,
                packageQuantity: payload.packageQuantity,
                imageUrl: prodForm.imageUrl.trim(),
                descriptionAr: prodForm.descriptionAr.trim() ? prodForm.descriptionAr.trim() : null,
                storageType: prodForm.storageType || null,
                countryOfOrigin: prodForm.countryOfOrigin.trim()
                  ? prodForm.countryOfOrigin.trim()
                  : null,
                isPerishable: payload.isPerishable
              }
        )
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || t.error);
      }

      showToast(
        'success',
        isCreate
          ? isAr
            ? 'تمت إضافة المنتج الموحّد إلى الكتالوج بنجاح'
            : 'Unified product created successfully'
          : isAr
          ? 'تم تحديث بيانات المنتج وإعادة احتساب الجودة'
          : 'Product metadata updated and quality recalculated'
      );
      setProductModalMode(null);
      refreshActiveViews();
    } catch (err: any) {
      showToast('error', err?.message || t.error);
    } finally {
      setProdSubmitting(false);
    }
  };

  const handleAddProductNote = async () => {
    if (!detailBarcode || noteInput.trim().length < 3) return;
    setNoteSubmitting(true);
    try {
      const res = await fetch(
        `/api/admin/catalog/products/${encodeURIComponent(detailBarcode)}/notes`,
        {
          method: 'POST',
          headers: { ...ADMIN_API_HEADERS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: noteInput.trim() })
        }
      );
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || t.error);
      setNoteInput('');
      setDetailData(json.data);
      showToast('success', isAr ? 'تمت إضافة الملاحظة وتوثيقها' : 'Note added & logged');
    } catch (err: any) {
      showToast('error', err?.message || t.error);
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setBrandSubmitting(true);
    try {
      const isCreate = brandModalMode === 'create';
      const url = isCreate
        ? '/api/admin/catalog/brands'
        : `/api/admin/catalog/brands/${encodeURIComponent(editingBrandId || '')}`;
      const res = await fetch(url, {
        method: isCreate ? 'POST' : 'PATCH',
        headers: { ...ADMIN_API_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameAr: brandForm.nameAr.trim(),
          nameEn: brandForm.nameEn.trim() || undefined,
          logoUrl: brandForm.logoUrl.trim()
        })
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || t.error);
      showToast(
        'success',
        isCreate
          ? isAr
            ? 'تمت إضافة العلامة التجارية بنجاح'
            : 'Brand created successfully'
          : isAr
          ? 'تم تحديث بيانات العلامة التجارية'
          : 'Brand updated successfully'
      );
      setBrandModalMode(null);
      setEditingBrandId(null);
      refreshActiveViews();
    } catch (err: any) {
      showToast('error', err?.message || t.error);
    } finally {
      setBrandSubmitting(false);
    }
  };

  const handleConfirmedTransition = async (reason: string) => {
    if (!confirmState) return;
    setConfirmSubmitting(true);
    try {
      const base =
        confirmState.kind === 'product'
          ? `/api/admin/catalog/products/${encodeURIComponent(confirmState.id)}/${confirmState.action}`
          : confirmState.kind === 'brand'
          ? `/api/admin/catalog/brands/${encodeURIComponent(confirmState.id)}/${confirmState.action}`
          : `/api/admin/catalog/offers/${encodeURIComponent(confirmState.id)}/${confirmState.action}`;
      const res = await fetch(base, {
        method: 'POST',
        headers: { ...ADMIN_API_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || t.error);
      setConfirmState(null);
      showToast(
        'success',
        isAr ? 'تم تنفيذ الإجراء وتوثيقه في سجل التدقيق' : 'Action completed & audited'
      );
      refreshActiveViews();
    } catch (err: any) {
      showToast('error', err?.message || t.error);
    } finally {
      setConfirmSubmitting(false);
    }
  };

  const qualityBadgeStyle = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 60) return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const statusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {t.adminCatStatusActive}
        </span>
      );
    }
    if (status === 'hidden') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          {t.adminCatStatusHidden}
        </span>
      );
    }
    if (status === 'suspended') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
          {t.adminCatStatusSuspended}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-300">
        {t.adminCatStatusArchived}
      </span>
    );
  };

  const tabs: Array<{ id: CatalogTabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'products', label: t.adminCatTabProducts, icon: Package },
    { id: 'brands', label: t.adminCatTabBrands, icon: Award },
    { id: 'offers', label: t.adminCatTabOffers, icon: Tag },
    { id: 'categories', label: t.adminCatTabCategories, icon: FolderTree },
    { id: 'quality', label: t.adminCatTabQuality, icon: Sparkles }
  ];

  const renderProductsTab = () => (
    <div className="space-y-3 sm:space-y-4">
      {/* Status Chips + Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { key: 'all', label: t.adminAccTabAll, count: prodData?.counts.all },
            { key: 'active', label: t.adminCatStatusActive, count: prodData?.counts.active },
            { key: 'hidden', label: t.adminCatStatusHidden, count: prodData?.counts.hidden },
            { key: 'archived', label: t.adminCatStatusArchived, count: prodData?.counts.archived }
          ].map((tab) => {
            const active = prodStatus === tab.key && prodHasOffers === 'all' && !prodMaxQuality;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setProdStatus(tab.key as any);
                  setProdHasOffers('all');
                  setProdMaxQuality('');
                  setProdPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#00A046] text-white border-[#00A046]'
                    : 'bg-white text-[#4A4747] border-[#E5E7EB] hover:border-[#00A046]/50'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      active ? 'bg-white/20 text-white' : 'bg-[#F3F4F6] text-[#221F1F]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              setProdHasOffers((prev) => (prev === 'without' ? 'all' : 'without'));
              setProdPage(1);
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border cursor-pointer ${
              prodHasOffers === 'without'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
            }`}
          >
            <span>{isAr ? 'بلا عروض' : 'No Offers'}</span>
            {prodData?.counts.withoutOffers !== undefined && (
              <span className="text-[10px] opacity-90">({prodData.counts.withoutOffers})</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setProdMaxQuality((prev) => (prev === '59' ? '' : '59'));
              setProdPage(1);
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border cursor-pointer ${
              prodMaxQuality === '59'
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
            }`}
          >
            <span>{isAr ? 'جودة <60%' : 'Quality <60%'}</span>
            {prodData?.counts.lowQuality !== undefined && (
              <span className="text-[10px] opacity-90">({prodData.counts.lowQuality})</span>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={openCreateProductModal}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00A046] hover:bg-[#008A3C] text-white text-xs font-extrabold shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t.adminCatAddProduct}</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-[#E5E7EB] p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
        <div className="relative sm:col-span-2">
          <Search
            className={`w-4 h-4 text-[#797878] absolute top-1/2 -translate-y-1/2 ${
              isAr ? 'right-3' : 'left-3'
            }`}
          />
          <input
            type="text"
            value={prodSearch}
            onChange={(e) => {
              setProdSearch(e.target.value);
              setProdPage(1);
            }}
            placeholder={t.adminCatSearchProducts}
            className={`w-full py-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-xs font-bold focus:outline-none focus:border-[#00A046] ${
              isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
            }`}
          />
        </div>

        <select
          value={prodCategory}
          onChange={(e) => {
            setProdCategory(e.target.value);
            setProdPage(1);
          }}
          className="px-2.5 py-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-xs font-bold text-[#221F1F]"
        >
          <option value="all">{isAr ? 'جميع الأقسام (22)' : 'All Categories (22)'}</option>
          {(prodData?.categories || SHARED_CATEGORY_TREE).map((c) => (
            <option key={c.categoryKey} value={c.categoryKey}>
              {isAr ? c.labelAr : c.labelEn}
            </option>
          ))}
        </select>

        <select
          value={prodBrandId}
          onChange={(e) => {
            setProdBrandId(e.target.value);
            setProdPage(1);
          }}
          className="px-2.5 py-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-xs font-bold text-[#221F1F]"
        >
          <option value="all">{isAr ? 'جميع العلامات' : 'All Brands'}</option>
          {(prodData?.brands || []).map((b) => (
            <option key={b.id} value={b.id}>
              {isAr ? b.nameAr : b.nameEn}
            </option>
          ))}
        </select>

        <select
          value={prodSuppliersFilter}
          onChange={(e) => {
            setProdSuppliersFilter(e.target.value as any);
            setProdPage(1);
          }}
          className="px-2.5 py-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-xs font-bold text-[#221F1F]"
        >
          <option value="all">{isAr ? 'عدد الموردين: الكل' : 'Suppliers: All'}</option>
          <option value="0">{isAr ? '0 موردين (بلا عروض)' : '0 suppliers'}</option>
          <option value="1">{isAr ? 'مورد واحد فقط' : '1 supplier'}</option>
          <option value="2+">{isAr ? 'موردان فأكثر (+2)' : '2+ suppliers'}</option>
        </select>

        <select
          value={prodSortBy}
          onChange={(e) => setProdSortBy(e.target.value)}
          className="px-2.5 py-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-xs font-bold text-[#221F1F]"
        >
          <option value="quality_asc">{isAr ? 'الأقل جودة أولاً' : 'Lowest Quality First'}</option>
          <option value="quality_desc">{isAr ? 'الأعلى جودة أولاً' : 'Highest Quality First'}</option>
          <option value="offers_desc">{isAr ? 'الأكثر عروضاً' : 'Most Offers'}</option>
          <option value="name_asc">{isAr ? 'الاسم (أ - ي)' : 'Name (A-Z)'}</option>
          <option value="newest">{isAr ? 'الأحدث إضافة' : 'Newest'}</option>
        </select>
      </div>

      {/* Loading / Empty */}
      {prodLoading && !prodData ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center text-xs font-bold text-[#797878]">
          {t.loading}
        </div>
      ) : !prodData || prodData.items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center">
          <Package className="w-8 h-8 text-[#797878] mx-auto mb-2" />
          <p className="text-sm font-bold text-[#221F1F]">
            {isAr ? 'لا توجد منتجات مطابقة لمعايير التصفية' : 'No catalog products match filters'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-2.5 md:hidden">
            {prodData.items.map((item) => (
              <div
                key={item.barcode}
                className="bg-white rounded-xl border border-[#E5E7EB] p-3 space-y-2.5 shadow-xs"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-12 h-12 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] overflow-hidden shrink-0 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.nameAr}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs font-extrabold text-[#221F1F] line-clamp-2">
                        {isAr ? item.nameAr : item.nameEn || item.nameAr}
                      </h3>
                      {statusBadge(item.status)}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[#797878]">
                      <span className="font-mono bg-[#F3F4F6] px-1.5 py-0.5 rounded text-[#221F1F]">
                        {item.barcode}
                      </span>
                      <span>• {item.brand}</span>
                      <span>• {item.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F3F4F6] text-[11px]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full font-extrabold border ${qualityBadgeStyle(
                        item.qualityScore
                      )}`}
                    >
                      {item.qualityScore}% {isAr ? 'جودة' : 'Quality'}
                    </span>
                    <span className="font-bold text-[#4A4747]">
                      {item.activeOffersCount} {isAr ? 'عروض' : 'offers'}
                    </span>
                    {item.minPriceIQD > 0 && (
                      <span className="font-extrabold text-[#00A046]">
                        {formatCurrency(item.minPriceIQD, currency, language)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditProductModal(item)}
                      className="p-1.5 rounded-lg border border-[#E5E7EB] text-[#4A4747] hover:bg-[#F9FAFB] cursor-pointer"
                      title={t.adminCatEditProduct}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDetailSubTab('overview');
                        setDetailBarcode(item.barcode);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#00A046]/10 text-[#00A046] font-extrabold cursor-pointer"
                    >
                      {t.details}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <tr className="text-[11px] font-extrabold text-[#797878]">
                    <th className="py-2.5 px-3 text-start">{isAr ? 'المنتج والباركود' : 'Product & Barcode'}</th>
                    <th className="py-2.5 px-3 text-start">{isAr ? 'العلامة والقسم' : 'Brand & Category'}</th>
                    <th className="py-2.5 px-3 text-center">{isAr ? 'العروض وأقل سعر' : 'Offers & Min Price'}</th>
                    <th className="py-2.5 px-3 text-center">{t.adminCatQualityScoreLabel}</th>
                    <th className="py-2.5 px-3 text-center">{t.status}</th>
                    <th className="py-2.5 px-3 text-end">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6] text-xs">
                  {prodData.items.map((item) => (
                    <tr key={item.barcode} className="hover:bg-[#F9FAFB]/70 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-lg border border-[#E5E7EB] bg-white overflow-hidden shrink-0 flex items-center justify-center">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.nameAr}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-[#221F1F] truncate max-w-[260px]">
                              {isAr ? item.nameAr : item.nameEn || item.nameAr}
                            </div>
                            <div className="text-[11px] font-mono text-[#797878] mt-0.5">
                              {item.barcode} • {item.unit}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-[#221F1F]">{item.brand}</div>
                        <div className="text-[11px] text-[#797878]">
                          {item.category}
                          {item.subCategory ? ` / ${item.subCategory}` : ''}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="font-extrabold text-[#221F1F]">
                          {item.activeOffersCount}{' '}
                          <span className="text-[11px] font-semibold text-[#797878]">
                            ({item.offersCount} {isAr ? 'إجمالي' : 'total'})
                          </span>
                        </div>
                        {item.minPriceIQD > 0 ? (
                          <div className="text-[11px] font-bold text-[#00A046]">
                            {formatCurrency(item.minPriceIQD, currency, language)}
                          </div>
                        ) : (
                          <div className="text-[11px] font-bold text-amber-700">
                            {isAr ? 'بلا عروض فعالة' : 'No active offers'}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${qualityBadgeStyle(
                            item.qualityScore
                          )}`}
                        >
                          {item.qualityScore}%
                        </span>
                        {item.missingFieldsCount > 0 && (
                          <div className="text-[10px] text-[#797878] mt-0.5">
                            {isAr
                              ? `ينقصه ${item.missingFieldsCount} حقول`
                              : `${item.missingFieldsCount} missing`}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">{statusBadge(item.status)}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditProductModal(item)}
                            className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-white text-[#4A4747] cursor-pointer"
                            title={t.adminCatEditProduct}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {item.status === 'active' ? (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmState({
                                  open: true,
                                  kind: 'product',
                                  id: item.barcode,
                                  action: 'hide',
                                  title: isAr ? `إخفاء المنتج: ${item.nameAr}` : `Hide Product`,
                                  description: isAr
                                    ? 'سيختفي المنتج فوراً من واجهة السوق ولن يقبل طلبات جديدة.'
                                    : 'Product will disappear from marketplace and reject new orders.',
                                  confirmLabel: t.adminCatHideAction,
                                  variant: 'warning'
                                })
                              }
                              className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 cursor-pointer"
                              title={t.adminCatHideAction}
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmState({
                                  open: true,
                                  kind: 'product',
                                  id: item.barcode,
                                  action: 'restore',
                                  title: isAr ? `إعادة تفعيل المنتج: ${item.nameAr}` : `Restore Product`,
                                  description: isAr
                                    ? 'سيعود المنتج للظهور في السوق مع عروضه الفعالة.'
                                    : 'Product will return to active marketplace catalog.',
                                  confirmLabel: t.adminCatRestoreAction,
                                  variant: 'primary'
                                })
                              }
                              className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                              title={t.adminCatRestoreAction}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setDetailSubTab('overview');
                              setDetailBarcode(item.barcode);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#00A046] text-white text-[11px] font-bold hover:bg-[#008A3C] cursor-pointer"
                          >
                            {t.details}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {prodData.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-xl border border-[#E5E7EB] px-3 py-2 text-xs font-bold">
              <span className="text-[#797878]">
                {isAr
                  ? `صفحة ${prodData.page} من ${prodData.totalPages} (${prodData.total} منتج)`
                  : `Page ${prodData.page} of ${prodData.totalPages} (${prodData.total} items)`}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={prodData.page <= 1}
                  onClick={() => setProdPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-[#E5E7EB] disabled:opacity-40 cursor-pointer"
                >
                  {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  disabled={prodData.page >= prodData.totalPages}
                  onClick={() => setProdPage((p) => Math.min(prodData.totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-[#E5E7EB] disabled:opacity-40 cursor-pointer"
                >
                  {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderBrandsTab = () => (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5">
          {[
            { key: 'all', label: t.adminAccTabAll, count: brandData?.counts.all },
            { key: 'active', label: t.adminCatStatusActive, count: brandData?.counts.active },
            { key: 'hidden', label: t.adminCatStatusHidden, count: brandData?.counts.hidden }
          ].map((tab) => {
            const active = brandStatus === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setBrandStatus(tab.key as any)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border cursor-pointer ${
                  active
                    ? 'bg-[#00A046] text-white border-[#00A046]'
                    : 'bg-white text-[#4A4747] border-[#E5E7EB]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      active ? 'bg-white/20 text-white' : 'bg-[#F3F4F6] text-[#221F1F]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            setBrandForm({ nameAr: '', nameEn: '', logoUrl: '' });
            setEditingBrandId(null);
            setBrandModalMode('create');
          }}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00A046] hover:bg-[#008A3C] text-white text-xs font-extrabold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.adminCatAddBrand}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-3">
        <div className="relative">
          <Search
            className={`w-4 h-4 text-[#797878] absolute top-1/2 -translate-y-1/2 ${
              isAr ? 'right-3' : 'left-3'
            }`}
          />
          <input
            type="text"
            value={brandSearch}
            onChange={(e) => setBrandSearch(e.target.value)}
            placeholder={t.adminCatSearchBrands}
            className={`w-full py-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-xs font-bold focus:outline-none focus:border-[#00A046] ${
              isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
            }`}
          />
        </div>
      </div>

      {brandLoading && !brandData ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center text-xs font-bold text-[#797878]">
          {t.loading}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(brandData?.items || []).map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-xl border border-[#E5E7EB] p-3.5 flex flex-col justify-between gap-3 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-center overflow-hidden shrink-0">
                    {b.logoUrl ? (
                      <img src={b.logoUrl} alt={b.nameAr} className="w-full h-full object-contain" />
                    ) : (
                      <Award className="w-5 h-5 text-[#00A046]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-[#221F1F] truncate">{b.nameAr}</div>
                    <div className="text-[11px] text-[#797878] truncate">{b.nameEn}</div>
                  </div>
                </div>
                {statusBadge(b.status)}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#F3F4F6] text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setProdBrandId(b.id);
                    setActiveTab('products');
                    setProdPage(1);
                  }}
                  className="font-bold text-[#00A046] hover:underline cursor-pointer"
                >
                  {isAr
                    ? `${b.activeProductsCount} منتج فعال (${b.productsCount} إجمالي)`
                    : `${b.activeProductsCount} active (${b.productsCount} total)`}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setBrandForm({
                        nameAr: b.nameAr,
                        nameEn: b.nameEn || '',
                        logoUrl: b.logoUrl || ''
                      });
                      setEditingBrandId(b.id);
                      setBrandModalMode('edit');
                    }}
                    className="p-1.5 rounded-lg border border-[#E5E7EB] text-[#4A4747] hover:bg-[#F9FAFB] cursor-pointer"
                    title={t.adminCatEditBrand}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {b.status === 'active' ? (
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmState({
                          open: true,
                          kind: 'brand',
                          id: b.id,
                          action: 'hide',
                          title: isAr ? `إخفاء العلامة: ${b.nameAr}` : `Hide Brand: ${b.nameEn}`,
                          description: isAr
                            ? 'تختفي العلامة من قوائم العلامات الفعالة، بينما تبقى منتجاتها الفعالة متاحة.'
                            : 'Brand hides from active brand lists while keeping active products available.',
                          confirmLabel: t.adminCatHideAction,
                          variant: 'warning'
                        })
                      }
                      className="px-2 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 font-bold cursor-pointer"
                    >
                      {t.adminCatHideAction}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmState({
                          open: true,
                          kind: 'brand',
                          id: b.id,
                          action: 'restore',
                          title: isAr ? `إعادة إظهار العلامة: ${b.nameAr}` : `Restore Brand: ${b.nameEn}`,
                          description: isAr
                            ? 'ستعود العلامة التجارية للظهور ضمن قائمة العلامات الفعالة.'
                            : 'Brand will reappear in active catalog brands.',
                          confirmLabel: t.adminCatRestoreAction,
                          variant: 'primary'
                        })
                      }
                      className="px-2 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold cursor-pointer"
                    >
                      {t.adminCatRestoreAction}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderOffersTab = () => (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {[
          { key: 'all', label: t.adminAccTabAll, count: offerData?.counts.all },
          { key: 'active', label: t.adminCatStatusActive, count: offerData?.counts.active },
          { key: 'suspended', label: t.adminCatStatusSuspended, count: offerData?.counts.suspended }
        ].map((tab) => {
          const active = offerStatus === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setOfferStatus(tab.key as any);
                setOfferPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border cursor-pointer ${
                active
                  ? 'bg-[#00A046] text-white border-[#00A046]'
                  : 'bg-white text-[#4A4747] border-[#E5E7EB]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    active ? 'bg-white/20 text-white' : 'bg-[#F3F4F6] text-[#221F1F]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => {
            setOfferAnomalyOnly((v) => !v);
            setOfferPage(1);
          }}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold border cursor-pointer ${
            offerAnomalyOnly
              ? 'bg-red-600 text-white border-red-600'
              : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{t.adminCatPriceAnomalyBadge}</span>
          {offerData?.counts.anomaly !== undefined && (
            <span className="text-[10px]">({offerData.counts.anomaly})</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setOfferLowStock((v) => !v);
            setOfferPage(1);
          }}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold border cursor-pointer ${
            offerLowStock
              ? 'bg-amber-600 text-white border-amber-600'
              : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
          }`}
        >
          <span>{isAr ? 'مخزون منخفض (≤20)' : 'Low Stock (≤20)'}</span>
          {offerData?.counts.lowStock !== undefined && (
            <span className="text-[10px]">({offerData.counts.lowStock})</span>
          )}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="relative sm:col-span-2">
          <Search
            className={`w-4 h-4 text-[#797878] absolute top-1/2 -translate-y-1/2 ${
              isAr ? 'right-3' : 'left-3'
            }`}
          />
          <input
            type="text"
            value={offerSearch}
            onChange={(e) => {
              setOfferSearch(e.target.value);
              setOfferPage(1);
            }}
            placeholder={t.adminCatSearchOffers}
            className={`w-full py-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-xs font-bold focus:outline-none focus:border-[#00A046] ${
              isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
            }`}
          />
        </div>

        <select
          value={offerSupplierId}
          onChange={(e) => {
            setOfferSupplierId(e.target.value);
            setOfferPage(1);
          }}
          className="px-2.5 py-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-xs font-bold text-[#221F1F]"
        >
          <option value="all">{t.allSuppliers}</option>
          {(offerData?.suppliers || []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.companyName}
            </option>
          ))}
        </select>
      </div>

      {offerLoading && !offerData ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center text-xs font-bold text-[#797878]">
          {t.loading}
        </div>
      ) : !offerData || offerData.items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center text-xs font-bold text-[#797878]">
          {isAr ? 'لا توجد عروض موردين مطابقة للبحث' : 'No matching supplier offers'}
        </div>
      ) : (
        <>
          {/* Mobile Offer Cards */}
          <div className="grid grid-cols-1 gap-2.5 md:hidden">
            {offerData.items.map((o) => (
              <div
                key={o.id}
                className="bg-white rounded-xl border border-[#E5E7EB] p-3 space-y-2 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-[#221F1F] line-clamp-1">
                      {isAr ? o.productNameAr : o.productNameEn || o.productNameAr}
                    </div>
                    <div className="text-[11px] text-[#797878]">
                      {o.supplierName} • <span className="font-mono">{o.barcode}</span>
                    </div>
                  </div>
                  {statusBadge(o.status)}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="font-black text-[#00A046]">
                    {formatCurrency(o.priceIQD, currency, language)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold ${
                      o.isLowStock
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-[#F3F4F6] text-[#221F1F]'
                    }`}
                  >
                    {isAr ? `المخزون: ${o.availableStock}` : `Stock: ${o.availableStock}`}
                  </span>
                  {o.isPriceAnomaly && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-extrabold bg-red-50 text-red-700 border border-red-200">
                      <AlertTriangle className="w-3 h-3" />
                      {t.adminCatPriceAnomalyBadge} ({o.deviationPercent! > 0 ? '+' : ''}
                      {o.deviationPercent}%)
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F3F4F6]">
                  {o.status === 'active' ? (
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmState({
                          open: true,
                          kind: 'offer',
                          id: o.id,
                          action: 'suspend',
                          title: isAr ? `إيقاف عرض ${o.supplierName}` : `Suspend Offer`,
                          description: isAr
                            ? 'سيختفي العرض من السوق ولن تُقبل طلبات جديدة عليه.'
                            : 'Offer will vanish from marketplace and reject new orders.',
                          confirmLabel: t.adminCatSuspendAction,
                          variant: 'danger'
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-[11px] font-extrabold cursor-pointer"
                    >
                      {t.adminCatSuspendAction}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmState({
                          open: true,
                          kind: 'offer',
                          id: o.id,
                          action: 'restore',
                          title: isAr ? `إعادة تفعيل عرض ${o.supplierName}` : `Restore Offer`,
                          description: isAr
                            ? 'سيعود العرض للظهور والطلب في السوق.'
                            : 'Offer will become active in marketplace.',
                          confirmLabel: t.adminCatRestoreAction,
                          variant: 'primary'
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold cursor-pointer"
                    >
                      {t.adminCatRestoreAction}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Offers Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <tr className="text-[11px] font-extrabold text-[#797878]">
                    <th className="py-2.5 px-3 text-start">{isAr ? 'المنتج' : 'Product'}</th>
                    <th className="py-2.5 px-3 text-start">{isAr ? 'المورد' : 'Supplier'}</th>
                    <th className="py-2.5 px-3 text-center">{isAr ? 'السعر ومؤشر الشذوذ' : 'Price & Anomaly'}</th>
                    <th className="py-2.5 px-3 text-center">{isAr ? 'المخزون' : 'Stock'}</th>
                    <th className="py-2.5 px-3 text-center">{t.status}</th>
                    <th className="py-2.5 px-3 text-end">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6] text-xs">
                  {offerData.items.map((o) => (
                    <tr key={o.id} className="hover:bg-[#F9FAFB]/70">
                      <td className="py-2.5 px-3">
                        <div className="font-extrabold text-[#221F1F] truncate max-w-[230px]">
                          {isAr ? o.productNameAr : o.productNameEn || o.productNameAr}
                        </div>
                        <div className="text-[11px] font-mono text-[#797878]">{o.barcode}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-[#221F1F]">{o.supplierName}</div>
                        <div className="text-[11px] text-[#797878]">{o.supplierCity}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="font-extrabold text-[#00A046]">
                          {formatCurrency(o.priceIQD, currency, language)}
                        </div>
                        {o.isPriceAnomaly && (
                          <div className="mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-extrabold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>
                              {t.adminCatPriceAnomalyBadge} ({o.deviationPercent! > 0 ? '+' : ''}
                              {o.deviationPercent}%)
                            </span>
                          </div>
                        )}
                        {o.medianPriceIQD && !o.isPriceAnomaly && (
                          <div className="text-[10px] text-[#797878]">
                            {isAr
                              ? `الوسيط: ${formatCurrency(o.medianPriceIQD, currency, language)}`
                              : `Median: ${formatCurrency(o.medianPriceIQD, currency, language)}`}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            o.isLowStock
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-[#F3F4F6] text-[#221F1F]'
                          }`}
                        >
                          {o.availableStock}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">{statusBadge(o.status)}</td>
                      <td className="py-2.5 px-3 text-end">
                        {o.status === 'active' ? (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmState({
                                open: true,
                                kind: 'offer',
                                id: o.id,
                                action: 'suspend',
                                title: isAr ? `إيقاف عرض ${o.supplierName}` : `Suspend Offer`,
                                description: isAr
                                  ? 'سيختفي العرض فوراً من السوق ولن يقبل أي طلبات جديدة.'
                                  : 'Offer disappears immediately from marketplace and orders.',
                                confirmLabel: t.adminCatSuspendAction,
                                variant: 'danger'
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-[11px] font-extrabold hover:bg-red-100 cursor-pointer"
                          >
                            {t.adminCatSuspendAction}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmState({
                                open: true,
                                kind: 'offer',
                                id: o.id,
                                action: 'restore',
                                title: isAr ? `إعادة تفعيل عرض ${o.supplierName}` : `Restore Offer`,
                                description: isAr
                                  ? 'سيعود العرض للظهور في السوق وتقبل عليه الطلبات.'
                                  : 'Offer returns to active marketplace.',
                                confirmLabel: t.adminCatRestoreAction,
                                variant: 'primary'
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold hover:bg-emerald-100 cursor-pointer"
                          >
                            {t.adminCatRestoreAction}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {offerData.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-xl border border-[#E5E7EB] px-3 py-2 text-xs font-bold">
              <span className="text-[#797878]">
                {isAr
                  ? `صفحة ${offerData.page} من ${offerData.totalPages} (${offerData.total} عرض)`
                  : `Page ${offerData.page} of ${offerData.totalPages} (${offerData.total} offers)`}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={offerData.page <= 1}
                  onClick={() => setOfferPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-[#E5E7EB] disabled:opacity-40 cursor-pointer"
                >
                  {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  disabled={offerData.page >= offerData.totalPages}
                  onClick={() => setOfferPage((p) => Math.min(offerData.totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-[#E5E7EB] disabled:opacity-40 cursor-pointer"
                >
                  {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderCategoriesTab = () => {
    const q = treeSearch.trim().toLowerCase();
    const filteredDepts = (treeData?.departments || []).filter((d) => {
      if (!q) return true;
      return (
        d.labelAr.toLowerCase().includes(q) ||
        d.labelEn.toLowerCase().includes(q) ||
        d.branches.some(
          (br) => br.labelAr.toLowerCase().includes(q) || br.labelEn.toLowerCase().includes(q)
        )
      );
    });

    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-3 text-xs font-extrabold text-[#221F1F]">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#00A046]">
              {isAr
                ? `${treeData?.totalDepartments ?? 22} قسم رئيسي`
                : `${treeData?.totalDepartments ?? 22} Departments`}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#F3F4F6]">
              {isAr
                ? `${treeData?.totalBranches ?? 153} فرع تخصصي`
                : `${treeData?.totalBranches ?? 153} Branches`}
            </span>
            <span className="text-[#797878]">
              {isAr
                ? `للعرض فقط • إجمالي المنتجات: ${treeData?.totalProducts ?? 0}`
                : `Read-only • Total Products: ${treeData?.totalProducts ?? 0}`}
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              className={`w-4 h-4 text-[#797878] absolute top-1/2 -translate-y-1/2 ${
                isAr ? 'right-3' : 'left-3'
              }`}
            />
            <input
              type="text"
              value={treeSearch}
              onChange={(e) => setTreeSearch(e.target.value)}
              placeholder={isAr ? 'ابحث عن قسم أو فرع...' : 'Search department or branch...'}
              className={`w-full py-1.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-xs font-bold ${
                isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
              }`}
            />
          </div>
        </div>

        {treeLoading && !treeData ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center text-xs font-bold text-[#797878]">
            {t.loading}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredDepts.map((dept) => {
              const isOpen = Boolean(expandedDeptIds[dept.id] || q);
              return (
                <div
                  key={dept.id}
                  className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-xs"
                >
                  <div className="px-3.5 py-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedDeptIds((prev) => ({ ...prev, [dept.id]: !prev[dept.id] }))
                      }
                      className="flex items-center gap-2.5 min-w-0 text-start cursor-pointer flex-1"
                    >
                      <span className="w-7 h-7 rounded-lg bg-[#00A046]/10 text-[#00A046] text-xs font-black flex items-center justify-center shrink-0">
                        {dept.order}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-extrabold text-[#221F1F] truncate">
                          {isAr ? dept.labelAr : dept.labelEn}
                        </div>
                        <div className="text-[11px] text-[#797878]">
                          {isAr
                            ? `${dept.branches.length} فرع • ${dept.activeProductsCount} فعال (${dept.productsCount} إجمالي)`
                            : `${dept.branches.length} branches • ${dept.activeProductsCount} active (${dept.productsCount} total)`}
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setProdCategory(dept.categoryKey);
                          setActiveTab('products');
                          setProdPage(1);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-[#E5E7EB] text-[11px] font-bold text-[#00A046] hover:bg-emerald-50 cursor-pointer"
                      >
                        {isAr ? 'عرض المنتجات' : 'View Products'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedDeptIds((prev) => ({ ...prev, [dept.id]: !prev[dept.id] }))
                        }
                        className="p-1.5 rounded-lg bg-[#F9FAFB] text-[#4A4747] cursor-pointer"
                      >
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-[#F3F4F6] bg-[#F9FAFB]/60 p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {dept.branches.map((br) => (
                        <div
                          key={br.id}
                          className="bg-white rounded-lg border border-[#E5E7EB] px-3 py-2 flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="font-bold text-[#221F1F] truncate">
                            {isAr ? br.labelAr : br.labelEn}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[11px] font-extrabold text-[#4A4747] shrink-0">
                            {br.productsCount}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderQualityTab = () => (
    <div className="space-y-3 sm:space-y-4">
      {qualityLoading && !qualityData ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center text-xs font-bold text-[#797878]">
          {t.loading}
        </div>
      ) : qualityData ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5">
              <div className="text-[11px] font-bold text-[#797878]">{t.adminKpiCatalogQuality}</div>
              <div className="text-xl font-black text-[#00A046] mt-1">{qualityData.averageScore}%</div>
              <div className="text-[10px] text-[#797878] mt-0.5">
                {isAr ? `من أصل ${qualityData.totalProducts} منتج` : `Across ${qualityData.totalProducts} products`}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5">
              <div className="text-[11px] font-bold text-[#797878]">{isAr ? 'جودة أقل من 60%' : 'Below 60%'}</div>
              <div className="text-xl font-black text-red-600 mt-1">{qualityData.below60Count}</div>
              <div className="text-[10px] text-[#797878] mt-0.5">
                {isAr ? 'أولوية قصوى للاستكمال' : 'High priority fix'}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5">
              <div className="text-[11px] font-bold text-[#797878]">{isAr ? 'جودة أقل من 80%' : 'Below 80%'}</div>
              <div className="text-xl font-black text-amber-600 mt-1">{qualityData.below80Count}</div>
              <div className="text-[10px] text-[#797878] mt-0.5">
                {isAr ? 'تحتاج حقول إضافية' : 'Needs enrichment'}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5">
              <div className="text-[11px] font-bold text-[#797878]">{isAr ? 'بلا عروض فعالة' : 'Without Active Offers'}</div>
              <div className="text-xl font-black text-[#221F1F] mt-1">{qualityData.withoutOffersCount}</div>
              <div className="text-[10px] text-[#797878] mt-0.5">
                {isAr ? 'تفتقد لتغطية الموردين' : 'Missing supplier coverage'}
              </div>
            </div>
          </div>

          {/* Missing Fields Stats + Worst Products */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3">
              <h3 className="text-sm font-extrabold text-[#221F1F]">
                {isAr ? 'أكثر الحقول الناقصة تكراراً' : 'Most Frequent Missing Fields'}
              </h3>
              <div className="space-y-2.5">
                {qualityData.missingFieldStats.map((mf) => (
                  <div key={mf.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#221F1F]">
                        {isAr ? mf.labelAr : mf.labelEn}{' '}
                        {mf.core && (
                          <span className="text-[10px] text-[#00A046] font-extrabold">
                            ({isAr ? 'أساسي' : 'Core'})
                          </span>
                        )}
                      </span>
                      <span className="font-extrabold text-[#4A4747]">
                        {mf.missingCount} ({mf.missingPercent}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          mf.missingPercent > 40 ? 'bg-red-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, mf.missingPercent)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3">
              <h3 className="text-sm font-extrabold text-[#221F1F]">
                {isAr ? 'المنتجات الأقل جودة (جاهزة للتعديل المباشر)' : 'Lowest Quality Products'}
              </h3>
              <div className="space-y-2 max-h-[540px] overflow-y-auto">
                {qualityData.worstProducts.map((wp) => (
                  <div
                    key={wp.barcode}
                    className="rounded-xl border border-[#E5E7EB] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-[#F9FAFB]"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-black border ${qualityBadgeStyle(
                            wp.score
                          )}`}
                        >
                          {wp.score}%
                        </span>
                        <span className="text-xs font-extrabold text-[#221F1F] truncate">
                          {isAr ? wp.nameAr : wp.nameEn || wp.nameAr}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#797878] flex flex-wrap gap-1">
                        <span className="font-mono">{wp.barcode}</span>
                        <span>• {wp.brand}</span>
                        <span>• {wp.category}</span>
                      </div>
                      {wp.missingFields.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {wp.missingFields.map((mf) => (
                            <span
                              key={mf.key}
                              className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-bold"
                            >
                              {isAr ? mf.labelAr : mf.labelEn}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setDetailSubTab('overview');
                        setDetailBarcode(wp.barcode);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#00A046] text-white text-xs font-extrabold hover:bg-[#008A3C] shrink-0 cursor-pointer self-start sm:self-center"
                    >
                      {isAr ? 'مراجعة وتعديل' : 'Review & Fix'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 rounded-xl border px-4 py-3 shadow-xl flex items-center justify-between gap-2 text-xs font-extrabold ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <span>{toast.text}</span>
          <button type="button" onClick={() => setToast(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header + 5-tab bar */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-[#E5E7EB] p-3.5 sm:p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-sm sm:text-lg font-black text-[#221F1F]">{t.adminCatTitle}</h1>
            <p className="text-[11px] sm:text-xs text-[#797878]">{t.adminCatSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={refreshActiveViews}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#E5E7EB] text-xs font-bold text-[#221F1F] hover:bg-[#F9FAFB] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.adminRefresh}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#00A046] text-white shadow-xs'
                    : 'bg-[#F3F4F6] text-[#4A4747] hover:text-[#221F1F]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Body */}
      {activeTab === 'products' && renderProductsTab()}
      {activeTab === 'brands' && renderBrandsTab()}
      {activeTab === 'offers' && renderOffersTab()}
      {activeTab === 'categories' && renderCategoriesTab()}
      {activeTab === 'quality' && renderQualityTab()}

      {/* Slide-over Product Detail Drawer */}
      {detailBarcode && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden">
            <div className="px-4 py-3.5 border-b border-[#E5E7EB] flex items-center justify-between gap-2 bg-[#F9FAFB]">
              <div className="min-w-0">
                <div className="text-sm font-black text-[#221F1F] truncate">
                  {detailData?.product
                    ? isAr
                      ? detailData.product.nameAr
                      : detailData.product.nameEn || detailData.product.nameAr
                    : detailBarcode}
                </div>
                <div className="text-[11px] font-mono text-[#797878]">{detailBarcode}</div>
              </div>
              <button
                type="button"
                onClick={() => setDetailBarcode(null)}
                className="p-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailLoading && !detailData ? (
              <div className="p-8 text-center text-xs font-bold text-[#797878]">{t.loading}</div>
            ) : detailData ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Drawer Header Card + Actions */}
                <div className="rounded-xl border border-[#E5E7EB] p-3.5 bg-white space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] overflow-hidden shrink-0 flex items-center justify-center">
                      {detailData.product.imageUrl ? (
                        <img
                          src={detailData.product.imageUrl}
                          alt={detailData.product.nameAr}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {statusBadge(detailData.product.status)}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${qualityBadgeStyle(
                            detailData.quality.score
                          )}`}
                        >
                          {t.adminCatQualityScoreLabel}: {detailData.quality.score}%
                        </span>
                      </div>
                      <div className="text-xs text-[#4A4747] font-bold">
                        {detailData.product.brand} • {detailData.product.category}
                        {detailData.product.subCategory ? ` / ${detailData.product.subCategory}` : ''}
                      </div>
                      <div className="text-[11px] text-[#797878]">
                        {detailData.product.unit} • {detailData.product.countryOfOrigin || '—'} •{' '}
                        {detailData.product.storageType || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Lifecycle Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F3F4F6]">
                    <button
                      type="button"
                      onClick={() => openEditProductModal(detailData.product)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-xs font-extrabold text-[#221F1F] hover:bg-[#F9FAFB] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{t.adminCatEditProduct}</span>
                    </button>

                    {detailData.product.status === 'active' ? (
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmState({
                            open: true,
                            kind: 'product',
                            id: detailData.product.barcode,
                            action: 'hide',
                            title: isAr
                              ? `إخفاء المنتج: ${detailData.product.nameAr}`
                              : `Hide Product`,
                            description: isAr
                              ? 'سيختفي المنتج من السوق ولن تُقبل طلبات جديدة عليه.'
                              : 'Product will hide from marketplace and reject orders.',
                            confirmLabel: t.adminCatHideAction,
                            variant: 'warning'
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-extrabold cursor-pointer"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>{t.adminCatHideAction}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmState({
                            open: true,
                            kind: 'product',
                            id: detailData.product.barcode,
                            action: 'restore',
                            title: isAr
                              ? `إعادة تفعيل المنتج: ${detailData.product.nameAr}`
                              : `Restore Product`,
                            description: isAr
                              ? 'سيعود المنتج نشطاً في السوق.'
                              : 'Product will return to active catalog.',
                            confirmLabel: t.adminCatRestoreAction,
                            variant: 'primary'
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{t.adminCatRestoreAction}</span>
                      </button>
                    )}

                    {detailData.product.status !== 'archived' && (
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmState({
                            open: true,
                            kind: 'product',
                            id: detailData.product.barcode,
                            action: 'archive',
                            title: isAr
                              ? `أرشفة المنتج: ${detailData.product.nameAr}`
                              : `Archive Product`,
                            description: isAr
                              ? 'تُحفظ السجلات التاريخية مع إيقاف المنتج عن الظهور والطلب.'
                              : 'Archives product while preserving historical logs.',
                            confirmLabel: t.adminCatArchiveAction,
                            variant: 'danger'
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-300 text-gray-800 text-xs font-extrabold cursor-pointer"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>{t.adminCatArchiveAction}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Drawer Sub-Tabs */}
                <div className="flex items-center gap-1.5 border-b border-[#E5E7EB] pb-2">
                  {[
                    { key: 'overview', label: isAr ? 'الجودة والبيانات' : 'Quality & Info' },
                    {
                      key: 'offers',
                      label: `${isAr ? 'عروض الموردين' : 'Offers'} (${detailData.offers.length})`
                    },
                    {
                      key: 'notes',
                      label: `${t.adminAccDetailNotes} (${detailData.product.adminNotes?.length || 0})`
                    },
                    {
                      key: 'audit',
                      label: `${t.adminAccDetailAudit} (${detailData.auditLogs.length})`
                    }
                  ].map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setDetailSubTab(st.key as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                        detailSubTab === st.key
                          ? 'bg-[#00A046] text-white'
                          : 'bg-[#F3F4F6] text-[#4A4747]'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {detailSubTab === 'overview' && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-[#E5E7EB] p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#221F1F]">
                          {t.adminCatQualityScoreLabel}
                        </span>
                        <span className="text-sm font-black text-[#00A046]">
                          {detailData.quality.score} / 100
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-[#F3F4F6] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            detailData.quality.score >= 80
                              ? 'bg-[#00A046]'
                              : detailData.quality.score >= 60
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${detailData.quality.score}%` }}
                        />
                      </div>

                      {detailData.quality.missingFields.length > 0 ? (
                        <div className="pt-2 space-y-1.5">
                          <div className="text-xs font-bold text-red-700">
                            {t.adminCatMissingFieldsTitle}:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {detailData.quality.missingFields.map((mf) => (
                              <span
                                key={mf.key}
                                className="px-2 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold"
                              >
                                {isAr ? mf.labelAr : mf.labelEn} (-{mf.weight}%)
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#00A046]">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {isAr
                              ? 'بيانات هذا المنتج مكتملة بالكامل 100%'
                              : 'All catalog quality fields are complete'}
                          </span>
                        </div>
                      )}
                    </div>

                    {detailData.product.statusReason && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                        <div className="font-extrabold mb-0.5">{t.adminAuditReasonLabel}</div>
                        <div>{detailData.product.statusReason}</div>
                      </div>
                    )}
                  </div>
                )}

                {detailSubTab === 'offers' && (
                  <div className="space-y-2.5">
                    <div className="text-xs font-extrabold text-[#221F1F]">
                      {t.adminCatOffersCompareTitle}
                    </div>
                    {detailData.offers.length === 0 ? (
                      <div className="rounded-xl border border-[#E5E7EB] p-4 text-center text-xs text-[#797878]">
                        {isAr ? 'لا توجد عروض موردين مسجلة لهذا الباركود حالياً' : 'No supplier offers yet'}
                      </div>
                    ) : (
                      detailData.offers.map((o) => (
                        <div
                          key={o.id}
                          className="rounded-xl border border-[#E5E7EB] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-extrabold text-[#221F1F]">
                                {o.supplierName}
                              </span>
                              {statusBadge(o.status)}
                              {o.isLowestPrice && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#00A046] border border-emerald-200 text-[10px] font-extrabold">
                                  {t.adminCatLowestPriceBadge}
                                </span>
                              )}
                              {o.isPriceAnomaly && (
                                <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-extrabold">
                                  {t.adminCatPriceAnomalyBadge} ({o.deviationPercent! > 0 ? '+' : ''}
                                  {o.deviationPercent}%)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#797878]">
                              {formatCurrency(o.priceIQD, currency, language)} •{' '}
                              {isAr ? `المخزون: ${o.availableStock}` : `Stock: ${o.availableStock}`} •{' '}
                              {isAr ? `توصيل ${o.deliveryDays} يوم` : `${o.deliveryDays}d delivery`}
                            </div>
                          </div>

                          {o.status === 'active' ? (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmState({
                                  open: true,
                                  kind: 'offer',
                                  id: o.id,
                                  action: 'suspend',
                                  title: isAr ? `إيقاف عرض ${o.supplierName}` : `Suspend Offer`,
                                  description: isAr
                                    ? 'سيختفي العرض فوراً من السوق ولن يقبل طلبات جديدة.'
                                    : 'Offer disappears from marketplace.',
                                  confirmLabel: t.adminCatSuspendAction,
                                  variant: 'danger'
                                })
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-[11px] font-extrabold cursor-pointer self-start sm:self-center"
                            >
                              {t.adminCatSuspendAction}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmState({
                                  open: true,
                                  kind: 'offer',
                                  id: o.id,
                                  action: 'restore',
                                  title: isAr ? `إعادة تفعيل عرض ${o.supplierName}` : `Restore Offer`,
                                  description: isAr
                                    ? 'سيعود العرض للظهور في السوق.'
                                    : 'Offer becomes active again.',
                                  confirmLabel: t.adminCatRestoreAction,
                                  variant: 'primary'
                                })
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold cursor-pointer self-start sm:self-center"
                            >
                              {t.adminCatRestoreAction}
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {detailSubTab === 'notes' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder={isAr ? 'اكتب ملاحظة إدارية عن المنتج...' : 'Write admin note...'}
                        className="flex-1 px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-bold"
                      />
                      <button
                        type="button"
                        disabled={noteSubmitting || noteInput.trim().length < 3}
                        onClick={handleAddProductNote}
                        className="px-3.5 py-2 rounded-xl bg-[#00A046] text-white text-xs font-extrabold disabled:opacity-50 cursor-pointer"
                      >
                        {isAr ? 'حفظ' : 'Add'}
                      </button>
                    </div>
                    {(detailData.product.adminNotes || []).length === 0 ? (
                      <div className="text-xs text-[#797878] text-center py-4">
                        {isAr ? 'لا توجد ملاحظات مسجلة بعد' : 'No notes yet'}
                      </div>
                    ) : (
                      (detailData.product.adminNotes || []).map((n) => (
                        <div key={n.id} className="rounded-xl border border-[#E5E7EB] p-3 text-xs">
                          <div className="flex items-center justify-between text-[11px] text-[#797878] mb-1">
                            <span className="font-bold text-[#221F1F]">{n.author}</span>
                            <span>{new Date(n.at).toLocaleString()}</span>
                          </div>
                          <p className="text-[#221F1F] font-semibold">{n.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {detailSubTab === 'audit' && (
                  <div className="space-y-2">
                    {detailData.auditLogs.length === 0 ? (
                      <div className="text-xs text-[#797878] text-center py-4">
                        {t.adminAuditEmpty}
                      </div>
                    ) : (
                      detailData.auditLogs.map((log) => (
                        <div key={log.id} className="rounded-xl border border-[#E5E7EB] p-3 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-[#797878]">
                            <span className="font-mono font-bold text-[#00A046]">{log.action}</span>
                            <span>{new Date(log.at).toLocaleString()}</span>
                          </div>
                          <div className="font-extrabold text-[#221F1F]">
                            {isAr ? log.summaryAr : log.summaryEn || log.summaryAr}
                          </div>
                          {log.reason && (
                            <div className="text-[11px] text-[#4A4747]">
                              <span className="font-bold">{t.adminAuditReasonLabel}</span> {log.reason}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {productModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-sm font-black text-[#221F1F]">
                {productModalMode === 'create' ? t.adminCatAddProduct : t.adminCatEditProduct}
              </h2>
              <button
                type="button"
                onClick={() => setProductModalMode(null)}
                className="p-1.5 rounded-lg hover:bg-[#F3F4F6] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#221F1F] mb-1">
                    {t.barcode} (EAN-13 / GTIN-14 / UPC-A) *
                  </label>
                  <input
                    type="text"
                    disabled={productModalMode === 'edit'}
                    required
                    value={prodForm.barcode}
                    onChange={(e) => setProdForm((f) => ({ ...f, barcode: e.target.value }))}
                    placeholder="e.g. 6281007000123"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] font-mono font-bold disabled:bg-gray-100"
                  />
                  {productModalMode === 'create' && barcodeLiveCheck && (
                    <div
                      className={`text-[11px] font-bold mt-1 ${
                        barcodeLiveCheck.valid ? 'text-[#00A046]' : 'text-red-600'
                      }`}
                    >
                      {barcodeLiveCheck.valid
                        ? `${isAr ? 'باركود صحيح' : 'Valid'}: ${barcodeLiveCheck.detectedStandard}`
                        : isAr
                        ? barcodeLiveCheck.errorAr
                        : barcodeLiveCheck.errorEn}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-[#221F1F] mb-1">
                    {isAr ? 'رابط الصورة (URL فقط)' : 'Image URL (URL only)'}
                  </label>
                  <input
                    type="text"
                    value={prodForm.imageUrl}
                    onChange={(e) => setProdForm((f) => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="https://... or /assets/images/..."
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#221F1F] mb-1">
                    {isAr ? 'الاسم العربي للمنتج *' : 'Arabic Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={prodForm.nameAr}
                    onChange={(e) => setProdForm((f) => ({ ...f, nameAr: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#221F1F] mb-1">
                    {isAr ? 'الاسم الإنجليزي' : 'English Name'}
                  </label>
                  <input
                    type="text"
                    value={prodForm.nameEn}
                    onChange={(e) => setProdForm((f) => ({ ...f, nameEn: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#221F1F] mb-1">
                    {isAr ? 'العلامة التجارية *' : 'Brand *'}
                  </label>
                  <select
                    value={prodForm.brandId}
                    onChange={(e) => {
                      const bid = e.target.value;
                      const found = prodData?.brands.find((b) => b.id === bid);
                      setProdForm((f) => ({
                        ...f,
                        brandId: bid,
                        brand: found ? found.nameAr : f.brand
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] font-bold bg-white"
                  >
                    <option value="">{isAr ? 'اختر العلامة' : 'Select brand'}</option>
                    {(prodData?.brands || []).map((b) => (
                      <option key={b.id} value={b.id}>
                        {isAr ? b.nameAr : b.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#221F1F] mb-1">
                    {isAr ? 'القسم الرئيسي *' : 'Main Category *'}
                  </label>
                  <select
                    value={prodForm.category}
                    onChange={(e) =>
                      setProdForm((f) => ({ ...f, category: e.target.value, subCategory: '' }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] font-bold bg-white"
                  >
                    {SHARED_CATEGORY_TREE.map((c) => (
                      <option key={c.categoryKey} value={c.categoryKey}>
                        {isAr ? c.labelAr : c.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#221F1F] mb-1">
                    {isAr ? 'الفرع / القسم الفرعي' : 'Sub-category'}
                  </label>
                  <select
                    value={prodForm.subCategory}
                    onChange={(e) => setProdForm((f) => ({ ...f, subCategory: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] font-bold bg-white"
                  >
                    <option value="">{isAr ? 'غير محدد' : 'Unspecified'}</option>
                    {availableBranchesForSelectedCategory.map((br) => (
                      <option key={br.id} value={br.subCategoryKey}>
                        {isAr ? br.labelAr : br.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#221F1F] mb-1">{t.unit} *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.unit}
                    onChange={(e) => setProdForm((f) => ({ ...f, unit: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#221F1F] mb-1">
                    {isAr ? 'حجم العبوة' : 'Pack Size'}
                  </label>
                  <input
                    type="text"
                    value={prodForm.packSize}
                    onChange={(e) => setProdForm((f) => ({ ...f, packSize: e.target.value }))}
                    placeholder="e.g. 24 × 400 غرام"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#221F1F] mb-1">
                    {isAr ? 'نوع التخزين' : 'Storage Type'}
                  </label>
                  <select
                    value={prodForm.storageType}
                    onChange={(e) =>
                      setProdForm((f) => ({ ...f, storageType: e.target.value as any }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] font-bold bg-white"
                  >
                    <option value="">{isAr ? 'غير محدد' : 'Unspecified'}</option>
                    <option value="ambient">{t.storageAmbient}</option>
                    <option value="dry">{t.storageDry}</option>
                    <option value="chilled">{t.storageChilled}</option>
                    <option value="frozen">{t.storageFrozen}</option>
                    <option value="controlled">{t.storageControlled}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#221F1F] mb-1">
                    {t.filterCountry}
                  </label>
                  <input
                    type="text"
                    value={prodForm.countryOfOrigin}
                    onChange={(e) => setProdForm((f) => ({ ...f, countryOfOrigin: e.target.value }))}
                    placeholder={isAr ? 'العراق / تركيا / الهند...' : 'Iraq / Turkey / India...'}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#221F1F] mb-1">
                    {isAr ? 'الكمية داخل العبوة' : 'Package Quantity'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={prodForm.packageQuantity}
                    onChange={(e) => setProdForm((f) => ({ ...f, packageQuantity: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setProductModalMode(null)}
                  className="px-4 py-2 rounded-xl border border-[#E5E7EB] font-bold text-[#4A4747] cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={
                    prodSubmitting || (productModalMode === 'create' && !barcodeLiveCheck?.valid)
                  }
                  className="px-4 py-2 rounded-xl bg-[#00A046] text-white font-extrabold disabled:opacity-50 cursor-pointer"
                >
                  {prodSubmitting ? t.loading : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Brand Modal */}
      {brandModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] w-full max-w-md shadow-2xl">
            <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
              <h2 className="text-sm font-black text-[#221F1F]">
                {brandModalMode === 'create' ? t.adminCatAddBrand : t.adminCatEditBrand}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setBrandModalMode(null);
                  setEditingBrandId(null);
                }}
                className="p-1.5 rounded-lg hover:bg-[#F3F4F6] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveBrand} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#221F1F] mb-1">
                  {isAr ? 'الاسم العربي *' : 'Arabic Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={brandForm.nameAr}
                  onChange={(e) => setBrandForm((f) => ({ ...f, nameAr: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-[#221F1F] mb-1">
                  {isAr ? 'الاسم الإنجليزي' : 'English Name'}
                </label>
                <input
                  type="text"
                  value={brandForm.nameEn}
                  onChange={(e) => setBrandForm((f) => ({ ...f, nameEn: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-[#221F1F] mb-1">
                  {isAr ? 'رابط الشعار (URL فقط)' : 'Logo URL (URL only)'}
                </label>
                <input
                  type="text"
                  value={brandForm.logoUrl}
                  onChange={(e) => setBrandForm((f) => ({ ...f, logoUrl: e.target.value }))}
                  placeholder="https://... or /assets/..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] font-bold"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => {
                    setBrandModalMode(null);
                    setEditingBrandId(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-[#E5E7EB] font-bold text-[#4A4747] cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={brandSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#00A046] text-white font-extrabold disabled:opacity-50 cursor-pointer"
                >
                  {brandSubmitting ? t.loading : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mandatory Reason Confirmation Dialog */}
      {confirmState && (
        <ConfirmWithReasonDialog
          isOpen={confirmState.open}
          language={language}
          title={confirmState.title}
          description={confirmState.description}
          confirmLabel={confirmState.confirmLabel}
          danger={confirmState.variant !== 'primary'}
          loading={confirmSubmitting}
          onCancel={() => setConfirmState(null)}
          onConfirm={handleConfirmedTransition}
        />
      )}
    </div>
  );
};
