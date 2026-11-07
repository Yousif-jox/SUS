import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Store,
  HandHeart,
  Truck,
  PackageCheck,
  Utensils,
  ShieldCheck,
  ClipboardList,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { StatCard, StatusBadge, Spinner, ErrorNote, EmptyState } from '../../components/ui/Primitives';
import { listAllDonations, listAllRequests, listProfiles } from '../../lib/api';
import { describeError } from '../../lib/supabase';
import { fetchPlatformStats } from '../../lib/api';
import { formatDate, formatNumber, timeAgo } from '../../lib/format';
import { categoryLabel, type AssistanceRequest, type Donation, type PlatformStats, type Profile } from '../../lib/types';
import { useLang } from '../../i18n/LanguageContext';

export default function AdminOverview() {
  const { t } = useLang();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.all([fetchPlatformStats(), listProfiles(), listAllDonations(), listAllRequests()])
      .then(([s, p, d, r]) => {
        if (!alive) return;
        setStats(s);
        setProfiles(p);
        setDonations(d);
        setRequests(r);
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

  const pendingDonations = donations.filter((d) => d.status === 'pending');
  const pendingBeneficiaries = profiles.filter((p) => p.role === 'beneficiary' && p.status === 'pending');
  const pendingRequests = requests.filter((r) => r.status === 'pending');

  const activity = [
    ...donations.slice(0, 4).map((d) => ({
      id: `d-${d.donation_id}`,
      at: d.created_at,
      text: `${d.donor_name} · ${t('admin.listed')} "${d.food_name}"`,
      status: d.status,
    })),
    ...requests.slice(0, 4).map((r) => ({
      id: `r-${r.request_id}`,
      at: r.created_at,
      text: `${r.beneficiary_name} · ${t('admin.requested')} ${r.food_type === 'any' ? t('ben.anyFood') : categoryLabel(r.food_type)}`,
      status: r.status,
    })),
  ]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">{t('admin.title')}</h1>
          <p className="mt-1 text-[14px] text-muted">
            {t('admin.subtitle')}
          </p>
        </div>
        <Link to="/admin/matching" className="btn btn-primary">
          <Sparkles size={16} />
          {t('admin.runMatching')}
        </Link>
      </div>

      {error && <ErrorNote message={error} />}

      {loading ? (
        <Spinner label={t('common.loading')} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={t('admin.registered')}
              value={formatNumber(profiles.length)}
              hint={t('admin.registeredHint', { donors: stats?.donor_count ?? 0, beneficiaries: stats?.beneficiary_count ?? 0, volunteers: stats?.volunteer_count ?? 0 })}
              icon={<Users size={18} />}
            />
            <StatCard
              label={t('impactPage.statDonations')}
              value={formatNumber(stats?.total_donations ?? 0)}
              hint={t('admin.liveListings', { count: stats?.open_donations ?? 0 })}
              icon={<PackageCheck size={18} />}
              tone="neutral"
            />
            <StatCard
              label={t('impactPage.statMeals')}
              value={formatNumber(stats?.meals_distributed ?? 0)}
              hint={t('impactPage.statFamilies')}
              icon={<Utensils size={18} />}
              tone="neutral"
            />
            <StatCard
              label={t('impactPage.statDeliveries')}
              value={formatNumber(stats?.completed_deliveries ?? 0)}
              hint={t('impactPage.statDeliveriesHint')}
              icon={<Truck size={18} />}
              tone="amber"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                to: '/admin/users',
                label: t('admin.verifyQueue'),
                value: pendingBeneficiaries.length,
                icon: HandHeart,
              },
              {
                to: '/admin/donations',
                label: t('admin.reviewQueue'),
                value: pendingDonations.length,
                icon: ShieldCheck,
              },
              {
                to: '/admin/requests',
                label: t('admin.requestsQueue'),
                value: pendingRequests.length,
                icon: ClipboardList,
              },
              {
                to: '/admin/matching',
                label: t('admin.matchQueue'),
                value: requests.filter((r) => r.status === 'approved').length,
                icon: Sparkles,
              },
            ].map((item) => (
              <Link key={item.to} to={item.to} className="card card-pad card-hover flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#fdf3e3] text-[#8a5305]">
                  <item.icon size={18} />
                </span>
                <div>
                  <p className="text-[20px] font-semibold leading-none [font-variant-numeric:tabular-nums]">
                    {item.value}
                  </p>
                  <p className="mt-1 text-[12px] text-muted">{item.label}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="card lg:col-span-2">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="text-[16px] font-semibold">{t('admin.activity')}</h2>
                <Link to="/admin/donations" className="btn btn-ghost btn-sm">
                  {t('admin.manage')}
                  <ArrowRight size={14} />
                </Link>
              </div>
              {activity.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={<PackageCheck size={22} />}
                    title={t('admin.activityNone')}
                    description={t('admin.activityNoneCopy')}
                  />
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {activity.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px]">{item.text}</p>
                        <p className="mt-0.5 text-[12px] text-muted">{timeAgo(item.at)}</p>
                      </div>
                      <StatusBadge status={item.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card card-pad">
              <h2 className="text-[16px] font-semibold">{t('admin.roleBreakdown')}</h2>
              <ul className="mt-4 space-y-3">
                {(['donor', 'beneficiary', 'volunteer', 'admin'] as const).map((role) => {
                  const count = profiles.filter((p) => p.role === role).length;
                  const total = Math.max(1, profiles.length);
                  const Icon = role === 'donor' ? Store : role === 'beneficiary' ? HandHeart : role === 'volunteer' ? Truck : ShieldCheck;
                  return (
                    <li key={role}>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="flex items-center gap-2 capitalize text-muted">
                          <Icon size={14} className="text-[#218c5a]" />
                          {t(`status.${role}`)}
                        </span>
                        <span className="font-semibold [font-variant-numeric:tabular-nums]">{count}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#edf1ee]">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(count / total) * 100}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 border-t border-line pt-3 text-[12px] text-muted">
                {t('admin.started', { date: profiles.length > 0 ? formatDate(profiles[profiles.length - 1].created_at) : '—' })}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
