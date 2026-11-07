import type { ReactNode } from 'react';
import { MapPin, CalendarClock, Utensils, Building2 } from 'lucide-react';
import { categoryImage, categoryLabel, regionLabel, type Donation } from '../../lib/types';
import { formatQuantity, daysUntil } from '../../lib/format';
import { expiryText } from '../../lib/l10n';
import { useLang } from '../../i18n/LanguageContext';
import { StatusBadge } from '../ui/Primitives';

export function DonationCard({
  donation,
  footer,
  showStatus = false,
  compact = false,
}: {
  donation: Donation;
  footer?: ReactNode;
  showStatus?: boolean;
  compact?: boolean;
}) {
  const { t } = useLang();
  const days = daysUntil(donation.expiry_date);
  const urgent = days !== null && days <= 2;

  return (
    <article className="card card-hover flex flex-col overflow-hidden" data-component="donation-card">
      <div className={`relative w-full overflow-hidden bg-[#eef3f0] ${compact ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>
        <img
          src={categoryImage(donation.category, donation.image_url)}
          alt={`${donation.food_name} — ${categoryLabel(donation.category)}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
          <span className="badge bg-white/92 text-[#14603d] shadow-sm backdrop-blur">
            <Utensils size={12} />
            {categoryLabel(donation.category)}
          </span>
          {urgent && (
            <span className="badge bg-[#fdf3e3] text-[#8a5305] shadow-sm">
              <CalendarClock size={12} />
              {t('card.useSoon')}
            </span>
          )}
        </div>
        {showStatus && (
          <div className="absolute right-3 top-3">
            <StatusBadge status={donation.status} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="line-clamp-2 text-[16px] font-semibold leading-snug">{donation.food_name}</h3>
          {donation.description && (
            <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
              {donation.description}
            </p>
          )}
        </div>

        <dl className="space-y-2 text-[13px]">
          <div className="flex items-start gap-2 text-muted">
            <Utensils size={14} className="mt-0.5 shrink-0 text-[#218c5a]" />
            <span className="font-medium text-ink">{formatQuantity(donation.quantity, donation.unit)}</span>
            <span>{t('card.available')}</span>
          </div>
          <div className="flex items-start gap-2 text-muted">
            <CalendarClock size={14} className="mt-0.5 shrink-0 text-[#218c5a]" />
            <span className={urgent ? 'font-medium text-[#8a5305]' : ''}>{expiryText(t, donation.expiry_date)}</span>
          </div>
          <div className="flex items-start gap-2 text-muted">
            <MapPin size={14} className="mt-0.5 shrink-0 text-[#218c5a]" />
            <span className="line-clamp-2">
              {donation.location} · {regionLabel(donation.city)}
            </span>
          </div>
          <div className="flex items-start gap-2 text-muted">
            <Building2 size={14} className="mt-0.5 shrink-0 text-[#218c5a]" />
            <span className="truncate">{donation.donor_name}</span>
          </div>
        </dl>

        {footer && <div className="mt-auto pt-2">{footer}</div>}
      </div>
    </article>
  );
}
