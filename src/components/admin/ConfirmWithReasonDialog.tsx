import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';
import { Language } from '../../types/index.ts';
import { translations } from '../../utils/translations.ts';

export interface ConfirmWithReasonDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  language: Language;
  onConfirm: (reason: string) => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmWithReasonDialog: React.FC<ConfirmWithReasonDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel,
  danger = true,
  loading = false,
  language,
  onConfirm,
  onCancel
}) => {
  const isAr = language === 'ar';
  const t = translations[language];
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setValidationError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setValidationError(t.adminConfirmReasonRequired);
      return;
    }
    setValidationError(null);
    onConfirm(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-brand"
      dir={isAr ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-confirm-reason-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-md overflow-hidden">
        <div
          className={`px-5 py-4 flex items-center justify-between border-b border-[#E5E7EB] ${
            danger ? 'bg-red-50/70' : 'bg-emerald-50/70'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                danger ? 'bg-red-100 text-red-700' : 'bg-[#00A046]/15 text-[#00A046]'
              }`}
            >
              {danger ? <AlertTriangle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <h3 id="admin-confirm-reason-title" className="text-sm sm:text-base font-extrabold text-[#221F1F]">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="p-1.5 rounded-lg text-[#797878] hover:bg-white/80 hover:text-[#221F1F] transition-colors cursor-pointer"
            aria-label={t.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {description && (
            <p className="text-xs sm:text-sm text-[#4A4747] leading-relaxed bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3">
              {description}
            </p>
          )}

          <div>
            <label
              htmlFor="admin-confirm-reason-input"
              className="block text-xs font-bold text-[#221F1F] mb-1.5"
            >
              {t.adminConfirmReasonLabel} <span className="text-red-600">*</span>
            </label>
            <textarea
              id="admin-confirm-reason-input"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (validationError && e.target.value.trim().length >= 3) {
                  setValidationError(null);
                }
              }}
              placeholder={t.adminConfirmReasonPlaceholder}
              disabled={loading}
              className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2.5 text-xs sm:text-sm text-[#221F1F] focus:outline-none focus:ring-2 focus:ring-[#00A046]/30 focus:border-[#00A046] resize-none"
            />
            {validationError && (
              <p className="mt-1.5 text-xs font-bold text-red-600">{validationError}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#F3F4F6]">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs sm:text-sm font-bold text-[#4A4747] hover:bg-[#F9FAFB] transition-colors cursor-pointer disabled:opacity-60"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold text-white transition-colors cursor-pointer disabled:opacity-60 ${
                danger
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-[#00A046] hover:bg-[#008A3C]'
              }`}
            >
              {loading ? t.loading : confirmLabel || t.confirm}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
