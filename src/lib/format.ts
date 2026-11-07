let dateLocale = 'en-GB';

/** Kept in sync with LanguageProvider so dates follow the UI language. */
export function setFormatLocale(lang: 'en' | 'ar') {
  dateLocale = lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB';
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(dateLocale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(dateLocale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(value?: string | null): string {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return dateLocale.startsWith('ar') ? 'الآن' : 'just now';
  if (mins < 60) return dateLocale.startsWith('ar') ? `قبل ${mins} د` : `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return dateLocale.startsWith('ar') ? `قبل ${hours} س` : `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return dateLocale.startsWith('ar') ? `قبل ${days} ي` : `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return dateLocale.startsWith('ar') ? `قبل ${months} شهر` : `${months}mo ago`;
  return dateLocale.startsWith('ar') ? `قبل ${Math.round(months / 12)} سنة` : `${Math.round(months / 12)}y ago`;
}

export function daysUntil(value?: string | null): number | null {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  const a = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const b = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((a - b) / 86400000);
}

export function expiryLabel(value?: string | null): string {
  const days = daysUntil(value);
  if (days === null) return 'No expiry set';
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  return `Expires in ${days} days`;
}

export function formatNumber(value?: number | null): string {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('en-GB').format(value);
}

export function formatQuantity(value: number, unit = 'servings'): string {
  const qty = Number.isInteger(value) ? value : Number(value.toFixed(1));
  return `${formatNumber(qty)} ${unit}`;
}

export function initials(name?: string | null): string {
  if (!name) return 'FB';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function monthLabel(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(dateLocale, { month: 'short' });
}
