import { useId } from 'react';
import { useLang } from '../../i18n/LanguageContext';
import { monthLabel, formatNumber } from '../../lib/format';

interface Series {
  label: string;
  color: string;
  values: number[];
}

export function AreaTrendChart({
  labels,
  series,
  height = 220,
}: {
  labels: string[];
  series: Series[];
  height?: number;
}) {
  const { t } = useLang();
  const gradientId = useId().replace(/:/g, '');
  const width = 640;
  const padX = 36;
  const padY = 18;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const stepX = labels.length > 1 ? (width - padX * 2) / (labels.length - 1) : 0;

  const point = (i: number, v: number) => {
    const x = padX + i * stepX;
    const y = height - padY - (v / max) * (height - padY * 2);
    return [x, y] as const;
  };

  const path = (values: number[]) =>
    values
      .map((v, i) => {
        const [x, y] = point(i, v);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  const areaPath = (values: number[]) => {
    if (!values.length) return '';
    const [firstX] = point(0, values[0]);
    const [lastX] = point(values.length - 1, values[values.length - 1]);
    return `${path(values)} L${lastX.toFixed(1)},${height - padY} L${firstX.toFixed(1)},${height - padY} Z`;
  };

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={t('chart.trend')}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = height - padY - t * (height - padY * 2);
          return (
            <g key={t}>
              <line x1={padX} x2={width - padX} y1={y} y2={y} stroke="#e3eae5" strokeWidth="1" />
              <text x={padX - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#5c6b63">
                {Math.round(max * t)}
              </text>
            </g>
          );
        })}
        {series.map((s, idx) => (
          <g key={s.label}>
            <defs>
              <linearGradient id={`${gradientId}-${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={areaPath(s.values)} fill={`url(#${gradientId}-${idx})`} />
            <path
              d={path(s.values)}
              fill="none"
              stroke={s.color}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {s.values.map((v, i) => {
              const [x, y] = point(i, v);
              return <circle key={i} cx={x} cy={y} r="3.4" fill="#fff" stroke={s.color} strokeWidth="2" />;
            })}
          </g>
        ))}
      </svg>
      <div className="mt-1 flex justify-between px-2 text-[11px] text-muted" style={{ paddingLeft: 24, paddingRight: 8 }}>
        {labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-4">
        {series.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-2 text-[12px] text-muted">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function BarChart({
  data,
  height = 200,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-2">
          <span className="text-[12px] font-semibold text-ink [font-variant-numeric:tabular-nums]">
            {formatNumber(d.value)}
          </span>
          <div
            className="w-full max-w-[54px] rounded-t-md bg-primary transition-[height] duration-500"
            style={{ height: `${Math.max(4, (d.value / max) * (height - 56))}px` }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="truncate text-[11px] text-muted">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({
  slices,
  size = 168,
  centerLabel,
  centerValue,
}: {
  slices: { label: string; value: number; color: string }[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const { t } = useLang();
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg width={size} height={size} viewBox="0 0 140 140" role="img" aria-label={t('chart.breakdown')}>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#edf1ee" strokeWidth="16" />
        {total > 0 &&
          slices.map((s) => {
            const length = (s.value / total) * circumference;
            const el = (
              <circle
                key={s.label}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth="16"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 70 70)"
                strokeLinecap="butt"
              />
            );
            offset += length;
            return el;
          })}
        <text x="70" y="68" textAnchor="middle" fontSize="20" fontWeight="600" fill="#16211c">
          {centerValue ?? formatNumber(total)}
        </text>
        <text x="70" y="86" textAnchor="middle" fontSize="9" fill="#5c6b63">
          {centerLabel ?? 'total'}
        </text>
      </svg>
      <ul className="flex-1 space-y-2">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-[13px]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="flex-1 text-muted">{s.label}</span>
            <span className="font-semibold [font-variant-numeric:tabular-nums]">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TrendLabels(points: { period: string }[]): string[] {
  return points.map((p) => monthLabel(p.period));
}
