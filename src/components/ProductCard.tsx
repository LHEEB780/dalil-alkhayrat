import React, { useState } from 'react';
import {
  Package,
  ShoppingCart,
  Heart,
  Star,
  Check,
  Zap,
  ArrowLeftRight
} from 'lucide-react';
import { ProductWithOffers, Currency, Language } from '../types/index.ts';
import { formatCurrency } from '../utils/format.ts';
import { getLocalizedText } from '../utils/translations.ts';

interface ProductCardProps {
  product: ProductWithOffers;
  currency: Currency;
  language?: Language;
  onCompareOffers: (product: ProductWithOffers) => void;
  onQuickAddBestOffer: (product: ProductWithOffers) => void;
  storeStockStatus?: { isLow: boolean; isCritical: boolean; remaining: number; unit: string };
  isFavorite?: boolean;
  onToggleFavorite?: (barcode: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  language = 'ar',
  onCompareOffers,
  onQuickAddBestOffer,
  storeStockStatus,
  isFavorite: controlledFavorite,
  onToggleFavorite
}) => {
  const isAr = language === 'ar';
  const displayName =
    !isAr && product.nameEn
      ? product.nameEn
      : getLocalizedText(product.nameAr, language);
  const displayUnit = getLocalizedText(product.unit, language);

  const [localFavorite, setLocalFavorite] = useState(false);
  const isFavorite = controlledFavorite !== undefined ? controlledFavorite : localFavorite;
  const [isAddedToast, setIsAddedToast] = useState(false);
  const [imageError, setImageError] = useState(false);

  const bestOffer = product.offers[0];

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
  const rating = product.rating || 4.8;
  const reviewsCount =
    product.reviewsCount || Math.floor((product.barcode.charCodeAt(3) || 7) * 8 + 35);

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickAddBestOffer(product);
    setIsAddedToast(true);
    setTimeout(() => setIsAddedToast(false), 1800);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(product.barcode);
    } else {
      setLocalFavorite(!isFavorite);
    }
  };

  const isExpress24h = product.fastestDeliveryDays <= 1;

  return (
    <div
      onClick={() => onCompareOffers(product)}
      className={`group rounded-2xl border bg-white p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-6px_rgba(0,160,70,0.18),0_2px_8px_-2px_rgba(15,23,42,0.06)] ${
        storeStockStatus?.isCritical
          ? 'border-red-300 ring-1 ring-red-200'
          : storeStockStatus?.isLow
          ? 'border-amber-300 ring-1 ring-amber-200'
          : 'border-[#E5E7EB] hover:border-[#00A046]/60'
      }`}
    >
      {/* Clean Pure White Square Product Image Stage */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white p-2 mb-2.5">
        {product.imageUrl && !imageError ? (
          <img
            src={product.imageUrl}
            alt={displayName}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="h-full w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center bg-white text-slate-400 px-2 text-center">
            <Package className="w-8 h-8 stroke-[1.5] text-slate-300" />
            <span className="text-[10px] font-medium text-slate-400 mt-1 line-clamp-2">
              {displayName}
            </span>
          </div>
        )}

        {/* Single Restrained Top Discount Badge (only when discounted) */}
        {hasDiscount && (
          <span className="absolute top-2 start-2 bg-[#F84147] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow-xs tabular-nums">
            -{discountPercent}%
          </span>
        )}

        {/* Wishlist Toggle Button */}
        <button
          type="button"
          onClick={handleWishlistClick}
          aria-label={isAr ? 'إضافة للمفضلة' : 'Toggle favorite'}
          className="absolute top-2 end-2 w-7 h-7 rounded-full bg-white/90 hover:bg-white backdrop-blur-xs border border-black/5 shadow-xs flex items-center justify-center transition cursor-pointer"
        >
          <Heart
            className={`w-3.5 h-3.5 transition ${
              isFavorite
                ? 'fill-[#FFA300] text-[#FFA300]'
                : 'text-[#6B7280] hover:text-[#FFA300] stroke-[2]'
            }`}
          />
        </button>
      </div>

      {/* Product Info Body */}
      <div className="flex-1 flex flex-col justify-between font-brand">
        <div>
          {/* Product Title */}
          <h3
            className="text-[#111827] text-[12.5px] sm:text-[13.5px] font-bold line-clamp-2 leading-snug mb-1.5 group-hover:text-[#00A046] transition-colors min-h-[35px]"
            title={displayName}
          >
            {displayName}
          </h3>

          {/* Clean Unboxed Metadata Line: Rating · Delivery */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] mb-1 tabular-nums">
            <span className="inline-flex items-center gap-0.5 text-[#111827] font-bold">
              <Star className="w-3 h-3 fill-[#FFA800] text-[#FFA800]" />
              <span>{rating.toFixed(1)}</span>
            </span>
            <span className="text-[#9CA3AF]">({reviewsCount})</span>
            <span className="text-[#D1D5DB]" aria-hidden="true">·</span>
            <span
              className={`inline-flex items-center gap-0.5 font-semibold truncate ${
                isExpress24h ? 'text-[#008A3C]' : 'text-[#6B7280]'
              }`}
            >
              {isExpress24h && <Zap className="w-2.5 h-2.5 fill-amber-400 text-amber-500 shrink-0" />}
              <span className="truncate">
                {isExpress24h
                  ? isAr
                    ? 'توصيل 24س'
                    : '24h Delivery'
                  : isAr
                  ? `${product.fastestDeliveryDays} أيام`
                  : `${product.fastestDeliveryDays}d`}
              </span>
            </span>
          </div>

          {/* Packaging Unit & Suppliers Count */}
          <div className="flex items-center justify-between gap-1.5 text-[11px] text-[#6B7280] mb-2">
            <span className="inline-flex items-center gap-1 min-w-0 truncate">
              <Package className="w-3 h-3 text-[#00A046] shrink-0" />
              <span className="truncate font-medium text-[#374151]">{displayUnit}</span>
            </span>

            <span className="inline-flex items-center gap-0.5 text-[#008A3C] font-bold shrink-0 whitespace-nowrap">
              <span>
                {isAr ? `${product.suppliersCount} موردين` : `${product.suppliersCount} offers`}
              </span>
              <ArrowLeftRight className="w-2.5 h-2.5" />
            </span>
          </div>

          {/* Low Stock Store Alert (shown only when merchant stock is low) */}
          {storeStockStatus?.isLow && (
            <div
              className={`text-[10px] font-bold mb-1.5 ${
                storeStockStatus.isCritical ? 'text-[#B91C1C]' : 'text-[#B45309]'
              }`}
            >
              {isAr
                ? `تنبيه المخزون: متبقي ${storeStockStatus.remaining}`
                : `Low stock: ${storeStockStatus.remaining} left`}
            </div>
          )}
        </div>

        {/* Bottom Price & Primary Add-to-Cart Row */}
        <div className="mt-auto pt-2 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
          <div className="min-w-0">
            {oldPrice && (
              <div className="text-[10px] text-[#9CA3AF] line-through leading-none mb-0.5 font-mono tabular-nums truncate">
                {formatCurrency(oldPrice, currency, language)}
              </div>
            )}
            <div
              className={`text-sm sm:text-base font-black font-mono tabular-nums leading-tight truncate ${
                hasDiscount ? 'text-[#F84147]' : 'text-[#0F3D24]'
              }`}
            >
              {formatCurrency(product.minPrice, currency, language)}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCartClick}
            disabled={!bestOffer || bestOffer.availableStock <= 0}
            className={`h-8.5 px-2.5 sm:px-3 rounded-xl flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold transition shadow-2xs cursor-pointer shrink-0 whitespace-nowrap ${
              isAddedToast
                ? 'bg-[#007B33] text-white'
                : 'bg-[#00A046] hover:bg-[#008A3C] active:scale-95 text-white disabled:bg-gray-300'
            }`}
            title={isAr ? 'إضافة أفضل سعر جملة إلى السلة' : 'Add best wholesale price to cart'}
          >
            {isAddedToast ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{isAr ? 'تمت' : 'Added'}</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{isAr ? 'أضف' : 'Add'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
