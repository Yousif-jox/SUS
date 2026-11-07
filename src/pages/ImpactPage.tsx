import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Utensils, Users, Truck, PackageCheck, TrendingUp, ArrowRight } from 'lucide-react';
import { AreaTrendChart, BarChart, DonutChart } from '../components/ui/Charts';
import { SectionHeading, Spinner, StatCard, ProgressBar, ErrorNote } from '../components/ui/Primitives';
import {
  fetchCategoryBreakdown,
  fetchDonationTrends,
  fetchPlatformStats,
  fetchUrgencyBreakdown,
} from '../lib/api';
import { describeError } from '../lib/supabase';
import { formatNumber, monthLabel } from '../lib/format';
import type { CategoryPoint, PlatformStats, TrendPoint, UrgencyPoint } from '../lib/types';
import { categoryLabel } from '../lib/types';
import { useLang } from '../i18n/LanguageContext';

const URGENCY_COLORS: Record<string, string> = {
  critical: '#b42318',
  high: '#c77c0a',
  normal: '#218c5a',
  low: '#8acba8',
};

export default function ImpactPage() {
  const { t } = useLang();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [categories, setCategories] = useState<CategoryPoint[]>([]);
  const [urgency, setUrgency] = useState<UrgencyPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetchPlatformStats(),
      fetchDonationTrends(),
      fetchCategoryBreakdown(),
      fetchUrgencyBreakdown().catch(() => [] as UrgencyPoint[]),
    ])
      .then(([s, trendData, c, u]) => {
        if (!alive) return;
        setStats(s);
        setTrends(trendData);
        setCategories(c);
        setUrgency(u);
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

  if (loading) {
    return (
      <div className="container-page py-20">
        <Spinner label={t('common.loading')} />
      </div>
    );
  }

  const labels = trends.map((t) => monthLabel(t.period));
  const peakMeals = Math.max(1, ...trends.map((t) => t.meals));

  return (
    <div>
      <section className="border-b border-line bg-[#0f2a1e] py-14 text-white" data-component="impact-header">
        <div className="container-page">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[12px] font-semibold">
            <TrendingUp size={13} />
            {t('impactPage.badge')}
          </p>
          <h1 className="mt-5 max-w-3xl text-[32px] leading-tight tracking-tight sm:text-[40px]">
            {t('impactPage.title')}
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/75">
            {t('impactPage.subtitle')}
          </p>
        </div>
      </section>

      <div className="container-page py-10">
        {error && <ErrorNote message={error} />}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t('impactPage.statMeals')}
            value={formatNumber(stats?.meals_distributed ?? 0)}
            hint={t('impactPage.statMealsHint')}
            icon={<Utensils size={18} />}
          />
          <StatCard
            label={t('impactPage.statFamilies')}
            value={formatNumber(stats?.families_helped ?? 0)}
            hint={t('impactPage.statFamiliesHint')}
            icon={<Users size={18} />}
            tone="neutral"
          />
          <StatCard
            label={t('impactPage.statDeliveries')}
            value={formatNumber(stats?.completed_deliveries ?? 0)}
            hint={t('impactPage.statDeliveriesHint')}
            icon={<Truck size={18} />}
            tone="neutral"
          />
          <StatCard
            label={t('impactPage.statDonations')}
            value={formatNumber(stats?.total_donations ?? 0)}
            hint={t('impactPage.statDonationsHint')}
            icon={<PackageCheck size={18} />}
            tone="amber"
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="card card-pad lg:col-span-2">
            <SectionHeading
              eyebrow={t('impactPage.trendTitle')}
              title={t('impactPage.trendTitle')}
              description={t('impactPage.trendSubtitle')}
            />
            <div className="mt-6">
              {trends.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">{t('impactPage.noData')}</p>
              ) : (
                <AreaTrendChart
                  labels={labels}
                  series={[
                    { label: t('impactPage.trendDonations'), color: '#4FAE7E', values: trends.map((t) => t.donations) },
                    { label: t('impactPage.trendMeals'), color: '#14603D', values: trends.map((t) => t.meals) },
                  ]}
                />
              )}
            </div>
          </div>

          <div className="card card-pad">
            <h3 className="text-[16px] font-semibold">{t('impactPage.urgencyTitle')}</h3>
            <p className="mt-1 text-[13px] text-muted">
              {t('impactPage.urgencySubtitle')}
            </p>
            <div className="mt-6">
              <DonutChart
                centerLabel={t('impactPage.requested')}
                slices={urgency.map((u) => ({
                  label: u.urgency.charAt(0).toUpperCase() + u.urgency.slice(1),
                  value: Number(u.requests),
                  color: URGENCY_COLORS[u.urgency] ?? '#218c5a',
                }))}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="card card-pad">
            <h3 className="text-[16px] font-semibold">{t('impactPage.categoryTitle')}</h3>
            <p className="mt-1 text-[13px] text-muted">{t('impactPage.categorySubtitle')}</p>
            <div className="mt-6">
              <BarChart
                data={categories.map((c) => ({
                  label: categoryLabel(c.category).split(' ')[0],
                  value: Number(c.donations),
                }))}
              />
            </div>
          </div>

          <div className="card card-pad">
            <h3 className="text-[16px] font-semibold">{t('impactPage.conversionTitle')}</h3>
            <p className="mt-1 text-[13px] text-muted">
              {t('impactPage.conversionSubtitle')}
            </p>
            <div className="mt-6 space-y-5">
              {categories.slice(0, 5).map((c) => (
                <ProgressBar
                  key={c.category}
                  label={`${categoryLabel(c.category)} — ${t('impactPage.mealsLabel', { value: formatNumber(c.meals) })}`}
                  value={Number(c.meals)}
                  max={Math.max(1, stats?.meals_distributed ?? 1)}
                />
              ))}
              <div className="rounded-lg bg-[#f6f8f7] p-3 text-[12px] leading-relaxed text-muted">
                Peak month delivered <strong className="text-ink">{formatNumber(peakMeals)}</strong> meals.
                Food that is not matched before expiry is marked expired rather than redistributed
                unsafely.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-line bg-white p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <h3 className="text-[20px] font-semibold">{t('impactPage.ctaTitle')}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
              {t('impactPage.ctaCopy')}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/register?role=donor" className="btn btn-primary">
                {t('impactPage.becomeDonor')}
                <ArrowRight size={16} />
              </Link>
              <Link to="/register?role=volunteer" className="btn btn-secondary">
                {t('impactPage.volunteer')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
