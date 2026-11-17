export const USD_TO_IQD_RATE = 1530;

export function formatCurrency(
  amountIQD: number, 
  currency: 'IQD' | 'USD' = 'IQD',
  language: 'ar' | 'en' = 'ar'
): string {
  if (currency === 'USD') {
    const usd = amountIQD / USD_TO_IQD_RATE;
    return `$${usd.toFixed(2)}`;
  }
  if (language === 'en') {
    return `${Math.round(amountIQD).toLocaleString('en-US')} IQD`;
  }
  return `${Math.round(amountIQD).toLocaleString('ar-IQ')} د.ع`;
}

export function formatNumber(num: number, language: 'ar' | 'en' = 'ar'): string {
  return num.toLocaleString(language === 'en' ? 'en-US' : 'ar-IQ');
}

export function formatDate(dateStr: string, language: 'ar' | 'en' = 'ar'): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'ar-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch {
    return dateStr;
  }
}
