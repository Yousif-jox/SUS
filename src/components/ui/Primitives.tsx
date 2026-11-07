import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { initials } from '../../lib/format';
import { useLang } from '../../i18n/LanguageContext';

const STATUS_TONES: Record<string, { bg: string; fg: string; labelKey: string }> = {
  pending: { bg: '#fdf3e3', fg: '#8a5305', labelKey: 'status.pending' },
  approved: { bg: '#e8f5ec', fg: '#14603d', labelKey: 'status.approved' },
  matched: { bg: '#e7f2f4', fg: '#0d5463', labelKey: 'status.matched' },
  completed: { bg: '#edf1ee', fg: '#3a4a42', labelKey: 'status.completed' },
  fulfilled: { bg: '#e8f5ec', fg: '#14603d', labelKey: 'status.fulfilled' },
  rejected: { bg: '#fdecea', fg: '#8e1b12', labelKey: 'status.rejected' },
  cancelled: { bg: '#edf1ee', fg: '#5c6b63', labelKey: 'status.cancelled' },
  expired: { bg: '#edf1ee', fg: '#5c6b63', labelKey: 'status.expired' },
  proposed: { bg: '#fdf3e3', fg: '#8a5305', labelKey: 'status.proposed' },
  confirmed: { bg: '#e7f2f4', fg: '#0d5463', labelKey: 'status.confirmed' },
  assigned: { bg: '#e7f2f4', fg: '#0d5463', labelKey: 'status.assigned' },
  picked_up: { bg: '#fdf3e3', fg: '#8a5305', labelKey: 'status.picked_up' },
  in_transit: { bg: '#fdf3e3', fg: '#8a5305', labelKey: 'status.in_transit' },
  delivered: { bg: '#e8f5ec', fg: '#14603d', labelKey: 'status.delivered' },
  active: { bg: '#e8f5ec', fg: '#14603d', labelKey: 'status.active' },
  suspended: { bg: '#fdecea', fg: '#8e1b12', labelKey: 'status.suspended' },
  available: { bg: '#e8f5ec', fg: '#14603d', labelKey: 'status.available' },
  busy: { bg: '#fdf3e3', fg: '#8a5305', labelKey: 'status.busy' },
  unavailable: { bg: '#edf1ee', fg: '#5c6b63', labelKey: 'status.unavailable' },
  critical: { bg: '#fdecea', fg: '#8e1b12', labelKey: 'status.critical' },
  high: { bg: '#fdf3e3', fg: '#8a5305', labelKey: 'status.high' },
  normal: { bg: '#edf1ee', fg: '#3a4a42', labelKey: 'status.normal' },
  low: { bg: '#f6f8f7', fg: '#5c6b63', labelKey: 'status.low' },
  admin: { bg: '#e7f2f4', fg: '#0d5463', labelKey: 'status.admin' },
  donor: { bg: '#e8f5ec', fg: '#14603d', labelKey: 'status.donor' },
  beneficiary: { bg: '#fdf3e3', fg: '#8a5305', labelKey: 'status.beneficiary' },
  volunteer: { bg: '#e7f2f4', fg: '#0d5463', labelKey: 'status.volunteer' },
};

export function StatusBadge({
  status,
  label,
  dot = true,
}: {
  status: string;
  label?: string;
  dot?: boolean;
}) {
  const { t } = useLang();
  const tone = STATUS_TONES[status] ?? { bg: '#f6f8f7', fg: '#5c6b63', labelKey: status };
  const text = label ?? (tone.labelKey.startsWith('status.') ? t(tone.labelKey) : tone.labelKey);
  return (
    <span className="badge" style={{ backgroundColor: tone.bg, color: tone.fg }}>
      {dot && <span className="badge-dot" />}
      {text}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  action?: ReactNode;
}) {
  return (
    <div
      className={`flex w-full flex-col gap-3 ${
        align === 'center' ? 'items-center text-center' : 'items-start'
      } ${action ? 'sm:flex-row sm:items-end sm:justify-between' : ''}`}
    >
      <div className={align === 'center' ? 'max-w-2xl' : 'max-w-2xl'}>
        {eyebrow && (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            {eyebrow}
          </p>
        )}
        <h2 className="text-[26px] leading-tight sm:text-[32px]">{title}</h2>
        {description && <p className="mt-3 text-[15px] leading-relaxed text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'primary',
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: 'primary' | 'amber' | 'neutral';
}) {
  const chip =
    tone === 'amber'
      ? 'bg-[#fdf3e3] text-[#8a5305]'
      : tone === 'neutral'
        ? 'bg-[#f2f7f4] text-[#5c6b63]'
        : 'bg-secondary text-[#14603d]';
  return (
    <div className="card card-pad card-hover" data-component="stat-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</p>
          <p className="mt-2 text-[30px] font-semibold leading-none tracking-tight [font-variant-numeric:tabular-nums]">
            {value}
          </p>
          {hint && <p className="mt-2 text-[13px] text-muted">{hint}</p>}
        </div>
        {icon && <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${chip}`}>{icon}</span>}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong bg-[#fbfdfc] px-6 py-14 text-center">
      {icon && (
        <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-secondary text-[#14603d]">
          {icon}
        </span>
      )}
      <h3 className="text-[17px] font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted">
      <Loader2 size={18} className="animate-spin" />
      <span>{label}…</span>
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-[#f2c7c2] bg-[#fdf1f0] px-4 py-3 text-sm font-medium text-[#8e1b12]"
    >
      {message}
    </div>
  );
}

export function Monogram({ name, size = 40 }: { name?: string | null; size?: number }) {
  return (
    <span
      className="monogram"
      style={{ width: size, height: size, fontSize: Math.round(size / 2.7) }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function ProgressBar({
  value,
  max = 100,
  label,
  tone = 'primary',
}: {
  value: number;
  max?: number;
  label?: string;
  tone?: 'primary' | 'amber';
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div>
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-[12px] font-medium text-muted">
          <span>{label}</span>
          <span className="[font-variant-numeric:tabular-nums]">{Math.round(pct)}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#edf1ee]">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, backgroundColor: tone === 'amber' ? '#c77c0a' : '#218c5a' }}
        />
      </div>
    </div>
  );
}

export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={n <= rating ? '#c77c0a' : 'none'}
          stroke={n <= rating ? '#c77c0a' : '#cbd8d0'}
          strokeWidth="1.6"
        >
          <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4 6.2 20.5l1.1-6.5L2.6 9.4l6.5-.9z" />
        </svg>
      ))}
    </span>
  );
}
