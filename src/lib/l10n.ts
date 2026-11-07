import { daysUntil } from './format';

type Translator = (key: string, vars?: Record<string, string | number>) => string;

/** Localised expiry sentence for a donation date. */
export function expiryText(t: Translator, value?: string | null): string {
  const days = daysUntil(value);
  if (days === null) return t('card.noExpiry');
  if (days < 0) return t('card.expiredAgo', { count: Math.abs(days) });
  if (days === 0) return t('card.expiresToday');
  if (days === 1) return t('card.expiresTomorrow');
  return t('card.expiresIn', { count: days });
}
