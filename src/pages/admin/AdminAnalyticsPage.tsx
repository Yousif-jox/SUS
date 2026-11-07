import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { AreaTrendChart, BarChart, DonutChart } from '../../components/ui/Charts';
import { ErrorNote, Spinner, StatCard, ProgressBar } from '../../components/ui/Primitives';
import {
  fetchCategoryBreakdown,
  fetchDonationTrends,
  fetchPlatformStats,
  fetchUrgencyBreakdown,
  listAllDonations,
  listAllRequests,
  listDeliveries,
  listMatches,
} from '../../lib/api';
import { describeError } from '../../lib/supabase';
import { formatNumber, monthLabel } from '../../lib/format';
import { categoryLabel, type CategoryPoint, type PlatformStats, type TrendPoint, type UrgencyPoint } from '../../lib/types';
import { useLang } from '../../i18n/LanguageContext';

export default function AdminAnalyticsPage() {
  const { t } = useLang();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [categories, setCategories] = useState<CategoryPoint[]>([]);
  const [urgency, setUrgency] = useState<UrgencyPoint[]>([]);
  const [rows, setRows] = useState({ donations: 0, requests: 0, matches: 0, deliveries: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetchPlatformStats(),
      fetchDonationTrends(),
      fetchCategoryBreakdown(),
      fetchUrgencyBreakdown().catch(() => [] as UrgencyPoint[]),
      listAllDonations(),
      listAllRequests(),
      listMatches(),
      listDeliveries(),
    ])
      .then(([s, trendData, c, u, d, r, m, dl]) => {
        if (!alive) return;
        setStats(s);
        setTrends(trendData);
        setCategories(c);
        setUrgency(u);
        setRows({ donations: d.length, requests: r.length, matches: m.length, deliveries: dl.length });
      })
      .catch((err) => {
        if (alive) setError(describeError(err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const matchRate = rows.donations > 0 ? Math.round(((stats?.meals_distributed ?? 0) > 0 ? rows.matches : 0) / rows.donations * 100) : 0;

  const csv = useMemo(() => {
    const header = 'metric,value';
    const lines = [
      ['total_donations', stats?.total_donations ?? 0],
      ['meals_distributed', stats?.meals_distributed ?? 0],
      ['families_helped', stats?.families_helped ?? 0],
      ['completed_deliveries', stats?.completed_deliveries ?? 0],
      ['donors', stats?.donor_count ?? 0],
      ['beneficiaries', stats?.beneficiary_count ?? 0],
      ['volunteers', stats?.volunteer_count ?? 0],
      ...categories.map((c) => [`donations_${c.category}`, c.donations]),
      ...trends.map((t) => [`donations_${t.period}`, t.donations]),
    ];
    return [header, ...lines.map(([k, v]) => `${k},${v}`)].join('\n');
  }, [stats, categories, trends]);

  function downloadCsv() {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'foodbridge-report.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (loading) return <Spinner label={t('common.loading')} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">{t('adminAna.title')}</h1>
          <p className="mt-1 text-[13px] text-muted">
            {t('adminAna.subtitle')}
          </p>
        </div>
        <button type="button" onClick={downloadCsv} className="btn btn-secondary">
          <Download size={15} />
          {t('adminAna.export')}
        </button>
      </div>

      {error && <ErrorNote message={error} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('adminAna.donations')} value={formatNumber(stats?.total_donations ?? 0)} hint={t('adminAna.records', { count: rows.donations })} icon={<BarChart3 size={18} />} />
        <StatCard label={t('adminAna.meals')} value={formatNumber(stats?.meals_distributed ?? 0)} hint={t('adminAna.matches', { count: rows.matches })} tone="neutral" />
        <StatCard label={t('adminAna.families')} value={formatNumber(stats?.families_helped ?? 0)} hint={t('adminAna.requests', { count: rows.requests })} tone="neutral" />
        <StatCard label={t('adminAna.deliveries')} value={formatNumber(stats?.completed_deliveries ?? 0)} hint={t('adminAna.deliveryRecords', { count: rows.deliveries })} tone="amber" />
      </div>

      <div className="card card-pad">
        <h2 className="text-[16px] font-semibold">{t('adminAna.trend')}</h2>
        <p className="mt-1 text-[13px] text-muted">{t('adminAna.trendSub')}</p>
        <div className="mt-6">
          <AreaTrendChart
            labels={trends.map((t) => monthLabel(t.period))}
            series={[
              { label: t('adminAna.trendDonations'), color: '#4FAE7E', values: trends.map((t) => Number(t.donations)) },
              { label: t('adminAna.trendMeals'), color: '#14603D', values: trends.map((t) => Number(t.meals)) },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card card-pad">
          <h2 className="text-[16px] font-semibold">{t('adminAna.catTitle')}</h2>
          <p className="mt-1 text-[13px] text-muted">{t('adminAna.catSub')}</p>
          <div className="mt-5">
            <BarChart
              data={categories.map((c) => ({
                label: categoryLabel(c.category).split(' ')[0],
                value: Number(c.donations),
              }))}
            />
          </div>
          <ul className="mt-5 space-y-3 border-t border-line pt-4">
            {categories.map((c) => (
              <li key={c.category}>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-muted">{categoryLabel(c.category)}</span>
                  <span className="font-medium [font-variant-numeric:tabular-nums]">
                    {t('adminAna.listingCount', { listings: c.donations, meals: c.meals })}
                  </span>
                </div>
                <div className="mt-1.5">
                  <ProgressBar
                    value={Number(c.meals)}
                    max={Math.max(1, stats?.meals_distributed ?? 1)}
                    label={undefined}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <div className="card card-pad">
            <h2 className="text-[16px] font-semibold">{t('adminAna.urgency')}</h2>
            <p className="mt-1 text-[13px] text-muted">{t('adminAna.urgencySub')}</p>
            <div className="mt-5">
              <DonutChart
                centerLabel={t('impactPage.requested')}
                slices={urgency.map((u) => ({
                  label: u.urgency.charAt(0).toUpperCase() + u.urgency.slice(1),
                  value: Number(u.requests),
                  color:
                    u.urgency === 'critical'
                      ? '#B42318'
                      : u.urgency === 'high'
                        ? '#C77C0A'
                        : u.urgency === 'normal'
                          ? '#218C5A'
                          : '#8ACBA8',
                }))}
              />
            </div>
          </div>

          <div className="card card-pad">
            <h2 className="text-[16px] font-semibold">{t('adminAna.health')}</h2>
            <ul className="mt-4 space-y-4">
              <li>
                <ProgressBar
                  label={t('adminAna.mat1')}
                  value={rows.matches}
                  max={Math.max(1, rows.donations)}
                />
              </li>
              <li>
                <ProgressBar
                  label={t('adminAna.mat2')}
                  value={stats?.completed_deliveries ?? 0}
                  max={Math.max(1, rows.matches)}
                />
              </li>
              <li>
                <ProgressBar
                  label={t('adminAna.mat3')}
                  value={stats?.families_helped ?? 0}
                  max={Math.max(1, rows.requests)}
                  tone="amber"
                />
              </li>
            </ul>
            <p className="mt-4 border-t border-line pt-3 text-[12px] text-muted">
              {t('adminAna.pipeline', { value: matchRate })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
