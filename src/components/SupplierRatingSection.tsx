import React, { useState, useEffect } from 'react';
import {
  Star,
  ShieldCheck,
  MessageSquarePlus,
  CheckCircle2,
  Truck,
  PackageCheck,
  Store,
  X,
  Send
} from 'lucide-react';
import { Language, SupplierReviewItem, SupplierReviewSummary } from '../types/index.ts';
import { fetchWithRetry } from '../utils/fetchWithRetry.ts';

interface StarSelectorProps {
  value: number;
  onChange: (val: number) => void;
  size?: 'sm' | 'lg';
}

const StarSelector: React.FC<StarSelectorProps> = ({ value, onChange, size = 'lg' }) => {
  const [hovered, setHovered] = useState<number>(0);
  const active = hovered || value;
  const iconCls = size === 'lg' ? 'w-7 h-7' : 'w-4 h-4';

  return (
    <div
      className="inline-flex items-center gap-1"
      onMouseLeave={() => setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= active;
        return (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onClick={() => onChange(star)}
            aria-label={`${star} / 5`}
            className="p-0.5 transition-transform hover:scale-110 cursor-pointer"
          >
            <Star
              className={`${iconCls} transition-colors ${
                filled ? 'fill-[#FFE600] text-[#EAB308]' : 'text-[#CBD5CE] fill-transparent'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

interface SupplierRatingSectionProps {
  supplierId: string;
  supplierName: string;
  storeName?: string;
  language: Language;
  orderId?: string;
  defaultFormOpen?: boolean;
  onSummaryUpdated?: (summary: SupplierReviewSummary) => void;
}

export const SupplierRatingSection: React.FC<SupplierRatingSectionProps> = ({
  supplierId,
  supplierName,
  storeName = 'سوبرماركت المنصور المركزي',
  language,
  orderId,
  defaultFormOpen = false,
  onSummaryUpdated
}) => {
  const isAr = language === 'ar';
  const [reviews, setReviews] = useState<SupplierReviewItem[]>([]);
  const [summary, setSummary] = useState<SupplierReviewSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(defaultFormOpen);

  // Review form state
  const [rating, setRating] = useState<number>(5);
  const [serviceRating, setServiceRating] = useState<number>(5);
  const [qualityRating, setQualityRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await fetchWithRetry(`/api/suppliers/${encodeURIComponent(supplierId)}/reviews`, {
        retries: 2
      });
      const data = await res.json();
      if (data.success) {
        setReviews(data.data || []);
        if (data.summary) {
          setSummary(data.summary);
          onSummaryUpdated?.(data.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load supplier reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [supplierId]);

  const ratingLabel = (val: number) => {
    if (val >= 5) return isAr ? 'ممتاز وموثوق جداً' : 'Excellent';
    if (val === 4) return isAr ? 'جيد جداً' : 'Very Good';
    if (val === 3) return isAr ? 'جيد' : 'Good';
    if (val === 2) return isAr ? 'مقبول' : 'Fair';
    return isAr ? 'يحتاج تحسين' : 'Needs Improvement';
  };

  const quickTags = isAr
    ? ['توصيل سريع ومنتظم', 'جودة وتواريخ حديثة', 'أسعار جملة منافسة', 'تغليف ممتاز بدون تلف']
    : ['Fast van delivery', 'Fresh expiry dates', 'Competitive wholesale prices', 'Clean packaging'];

  const handleAppendTag = (tag: string) => {
    setComment((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return tag;
      if (trimmed.includes(tag)) return prev;
      return `${trimmed} — ${tag}`;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (comment.trim().length < 3) {
      setFeedback({
        type: 'error',
        text: isAr
          ? 'يرجى كتابة تعليق نصي قصير عن تجربتك مع المورد.'
          : 'Please write a short comment about your experience.'
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/suppliers/${encodeURIComponent(supplierId)}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: 'store_almansoor',
          storeName,
          rating,
          serviceRating,
          qualityRating,
          comment: comment.trim(),
          orderId
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (isAr ? 'تعذر إرسال التقييم' : 'Failed to submit review'));
      }

      setReviews((prev) => [data.data, ...prev]);
      if (data.summary) {
        setSummary(data.summary);
        onSummaryUpdated?.(data.summary);
      }
      setComment('');
      setRating(5);
      setServiceRating(5);
      setQualityRating(5);
      setShowForm(false);
      setFeedback({
        type: 'success',
        text: data.message || (isAr ? 'تم نشر تقييمك بنجاح!' : 'Review published successfully!')
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || (isAr ? 'حدث خطأ أثناء نشر التقييم' : 'Error publishing review')
      });
    } finally {
      setSubmitting(false);
    }
  };

  const avg = summary?.averageRating ?? 5.0;
  const count = summary?.reviewsCount ?? reviews.length;

  return (
    <section
      id="supplier-reviews-section"
      className="bg-white rounded-2xl border border-[#DCE5DC] p-4 sm:p-6 shadow-2xs space-y-5 font-brand"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCE5DC] pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm sm:text-base font-black text-[#142018] flex items-center gap-2">
              <Star className="w-5 h-5 fill-[#FFE600] text-[#EAB308] shrink-0" />
              <span>
                {isAr
                  ? 'تقييمات السوبرماركت وجودة المورد'
                  : 'Supermarket Ratings & Quality Reviews'}
              </span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EBF4EE] border border-[#DCE5DC] text-[#0B5D32] text-[10.5px] font-black">
              {isAr ? 'تقييمات تجار موثقة' : 'Verified B2B Feedback'}
            </span>
          </div>
          <p className="text-xs text-[#5F7164] mt-1">
            {isAr
              ? `آراء وتجارب المتاجر مع ${supplierName} في جودة البضاعة وسرعة التوصيل`
              : `Retailer experiences with ${supplierName} on stock quality and delivery speed`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 ${
            showForm
              ? 'bg-[#F4F4EA] border border-[#DCE5DC] text-[#142018]'
              : 'bg-[#0B5D32] hover:bg-[#084726] text-white shadow-xs'
          }`}
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              <span>{isAr ? 'إغلاق نموذج التقييم' : 'Close Form'}</span>
            </>
          ) : (
            <>
              <MessageSquarePlus className="w-4 h-4 text-[#FFE600]" />
              <span>{isAr ? 'أضف تقييمك للمورد' : 'Rate This Supplier'}</span>
            </>
          )}
        </button>
      </div>

      {/* Status Feedback */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-[#EBF4EE] border-[#B7DFC4] text-[#0B5D32]'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="opacity-60 hover:opacity-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Trust Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Overall Score */}
        <div className="bg-[#F4F4EA] border border-[#DCE5DC] rounded-2xl p-4 flex items-center gap-4">
          <div className="text-center shrink-0">
            <div className="text-3xl font-black text-[#0B5D32] font-mono tabular-nums leading-none">
              {avg.toFixed(1)}
            </div>
            <div className="text-[10.5px] font-bold text-[#5F7164] mt-1">
              {isAr ? 'من 5.0' : 'out of 5'}
            </div>
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= Math.round(avg)
                      ? 'fill-[#FFE600] text-[#EAB308]'
                      : 'text-[#CBD5CE]'
                  }`}
                />
              ))}
            </div>
            <div className="text-xs font-black text-[#142018]">
              {isAr ? `بناءً على ${count} تقييم` : `Based on ${count} reviews`}
            </div>
            <div className="text-[10.5px] text-[#0B5D32] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{isAr ? 'سجل موثوق في سوق الجملة' : 'Trusted Wholesale Record'}</span>
            </div>
          </div>
        </div>

        {/* Service & Quality Sub-Scores */}
        <div className="bg-[#F4F4EA] border border-[#DCE5DC] rounded-2xl p-4 flex flex-col justify-center space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-bold text-[#3D5244]">
              <Truck className="w-4 h-4 text-[#0B5D32]" />
              <span>{isAr ? 'الخدمة وسرعة التوصيل:' : 'Service & Delivery:'}</span>
            </span>
            <span className="font-black text-[#0B5D32] font-mono tabular-nums">
              {(summary?.serviceAvg ?? avg).toFixed(1)} / 5
            </span>
          </div>
          <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[#DCE5DC]">
            <div
              className="h-full bg-[#0B5D32] rounded-full"
              style={{ width: `${((summary?.serviceAvg ?? avg) / 5) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="flex items-center gap-1.5 font-bold text-[#3D5244]">
              <PackageCheck className="w-4 h-4 text-[#0B5D32]" />
              <span>{isAr ? 'جودة البضاعة والتغليف:' : 'Product Quality:'}</span>
            </span>
            <span className="font-black text-[#0B5D32] font-mono tabular-nums">
              {(summary?.qualityAvg ?? avg).toFixed(1)} / 5
            </span>
          </div>
          <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[#DCE5DC]">
            <div
              className="h-full bg-[#00A046] rounded-full"
              style={{ width: `${((summary?.qualityAvg ?? avg) / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Star Distribution Bars */}
        <div className="bg-[#F4F4EA] border border-[#DCE5DC] rounded-2xl p-4 space-y-1.5 text-[11px] flex flex-col justify-center">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const starCount = summary?.distribution?.[star] ?? 0;
            const pct = count > 0 ? Math.round((starCount / count) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-2 tabular-nums">
                <span className="w-8 font-bold text-[#142018] flex items-center gap-0.5 shrink-0">
                  <span>{star}</span>
                  <Star className="w-3 h-3 fill-[#FFE600] text-[#EAB308]" />
                </span>
                <div className="flex-1 h-2 bg-white border border-[#DCE5DC] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FFE600] rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 text-end font-mono text-[#5F7164] font-bold">
                  {starCount}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Review Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-[#F4F4EA] border border-[#0B5D32]/30 rounded-2xl p-4 sm:p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-[#0B5D32]">
                {isAr ? `تقييمك لـ ${supplierName}` : `Your Review for ${supplierName}`}
              </h3>
              <p className="text-[11px] text-[#5F7164] mt-0.5">
                {isAr
                  ? `سيُنشر التقييم باسم متجرك (${storeName}) لمساعدة أصحاب السوبرماركت في اختيار المورد الأفضل.`
                  : `Published under ${storeName} to help supermarkets choose reliable suppliers.`}
              </p>
            </div>
            {orderId && (
              <span className="px-2.5 py-1 rounded-lg bg-[#EBF4EE] border border-[#B7DFC4] text-[#0B5D32] text-[10.5px] font-black font-mono">
                {isAr ? `طلبية موثقة: ${orderId}` : `Order: ${orderId}`}
              </span>
            )}
          </div>

          {/* Overall + Detailed Stars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white border border-[#DCE5DC] rounded-xl p-3.5">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#5F7164] block">
                {isAr ? 'التقييم العام للمورد:' : 'Overall Rating:'}
              </span>
              <div className="flex items-center gap-2">
                <StarSelector value={rating} onChange={setRating} size="lg" />
              </div>
              <span className="text-[11px] font-black text-[#0B5D32] block">
                {ratingLabel(rating)} ({rating}/5)
              </span>
            </div>

            <div className="space-y-1.5 flex flex-col justify-center">
              <span className="text-[11px] font-bold text-[#5F7164]">
                {isAr ? 'الخدمة وسرعة التوصيل:' : 'Service & Delivery:'}
              </span>
              <div className="flex items-center gap-2">
                <StarSelector value={serviceRating} onChange={setServiceRating} size="sm" />
                <span className="text-[11px] font-mono font-bold text-[#142018]">
                  {serviceRating}/5
                </span>
              </div>
            </div>

            <div className="space-y-1.5 flex flex-col justify-center">
              <span className="text-[11px] font-bold text-[#5F7164]">
                {isAr ? 'جودة البضاعة والتغليف:' : 'Goods & Packaging Quality:'}
              </span>
              <div className="flex items-center gap-2">
                <StarSelector value={qualityRating} onChange={setQualityRating} size="sm" />
                <span className="text-[11px] font-mono font-bold text-[#142018]">
                  {qualityRating}/5
                </span>
              </div>
            </div>
          </div>

          {/* Quick Feedback Tags */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-[#5F7164] block">
              {isAr ? 'نقاط سريعة (اضغط للإضافة للتعليق):' : 'Quick tags:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAppendTag(tag)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#DCE5DC] hover:border-[#0B5D32] hover:bg-[#EBF4EE] text-[#3D5244] text-[11px] font-bold transition cursor-pointer"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Comment Textarea */}
          <div>
            <label className="text-xs font-bold text-[#142018] block mb-1.5">
              {isAr ? 'تعليق السوبرماركت حول الخدمة والجودة:' : 'Your written review:'}
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                isAr
                  ? 'اكتب رأيك بصراحة عن مواعيد الفان، تواريخ الصلاحية، سلامة التغليف، وتعامل المندوب...'
                  : 'Share your experience on delivery speed, product freshness, packaging, and rep support...'
              }
              className="w-full bg-white border border-[#DCE5DC] rounded-xl p-3 text-xs text-[#142018] focus:border-[#0B5D32] outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl bg-white border border-[#DCE5DC] text-[#5F7164] text-xs font-bold cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#0B5D32] hover:bg-[#084726] text-white text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {submitting
                  ? isAr
                    ? 'جاري النشر...'
                    : 'Publishing...'
                  : isAr
                  ? 'نشر التقييم'
                  : 'Publish Review'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* Published Supermarket Reviews List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-6 text-center text-xs text-[#5F7164]">
            {isAr ? 'جاري تحميل آراء وتقييمات التجار...' : 'Loading supplier reviews...'}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-[#F4F4EA] border border-[#DCE5DC] rounded-2xl p-6 text-center text-xs text-[#5F7164]">
            {isAr
              ? 'لا توجد تعليقات منشورة بعد — كن أول سوبرماركت يشارك تجربته مع هذا المورد.'
              : 'No reviews yet — be the first supermarket to review this supplier.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-[#F8FAF7] border border-[#DCE5DC] rounded-2xl p-3.5 sm:p-4 space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#EBF4EE] text-[#0B5D32] flex items-center justify-center shrink-0">
                        <Store className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-xs text-[#142018] truncate">
                          {rev.storeName}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {rev.isVerifiedOrder && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#0B5D32]">
                              <ShieldCheck className="w-3 h-3 shrink-0" />
                              <span>{isAr ? 'تعامل موثق' : 'Verified Buyer'}</span>
                            </span>
                          )}
                          <span className="text-[10px] text-[#5F7164] tabular-nums">
                            {new Date(rev.createdAt).toLocaleDateString(isAr ? 'ar-IQ' : 'en-US')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 bg-white border border-[#DCE5DC] px-2 py-1 rounded-lg shrink-0">
                      <Star className="w-3.5 h-3.5 fill-[#FFE600] text-[#EAB308]" />
                      <span className="text-xs font-black text-[#142018] font-mono tabular-nums">
                        {rev.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#1F2328] leading-relaxed">{rev.comment}</p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#DCE5DC]/70 text-[10.5px] text-[#5F7164] font-bold tabular-nums">
                  <span>
                    {isAr ? `الخدمة: ${rev.serviceRating}/5` : `Service: ${rev.serviceRating}/5`}
                  </span>
                  <span>•</span>
                  <span>
                    {isAr ? `الجودة: ${rev.qualityRating}/5` : `Quality: ${rev.qualityRating}/5`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

interface SupplierRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: string;
  supplierName: string;
  storeName?: string;
  language: Language;
  orderId?: string;
  defaultFormOpen?: boolean;
  onSummaryUpdated?: (summary: SupplierReviewSummary) => void;
}

export const SupplierRatingModal: React.FC<SupplierRatingModalProps> = ({
  isOpen,
  onClose,
  supplierId,
  supplierName,
  storeName,
  language,
  orderId,
  defaultFormOpen = true,
  onSummaryUpdated
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2918]/65 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#F4F4EA] border border-[#DCE5DC] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-3 sm:p-4 my-auto">
        <div className="flex items-center justify-end pb-2">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#DCE5DC] text-[#3D5244] hover:text-red-600 flex items-center justify-center cursor-pointer"
            aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <SupplierRatingSection
          supplierId={supplierId}
          supplierName={supplierName}
          storeName={storeName}
          language={language}
          orderId={orderId}
          defaultFormOpen={defaultFormOpen}
          onSummaryUpdated={onSummaryUpdated}
        />
      </div>
    </div>
  );
};
