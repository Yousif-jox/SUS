import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, PlusCircle, CheckCircle2, Inbox, ArrowRight, Utensils } from 'lucide-react';
import { StatCard, StatusBadge, Spinner, EmptyState, ErrorNote } from '../../components/ui/Primitives';
import { useAuth } from '../../context/AuthContext';
import { listDonationsByDonor } from '../../lib/api';
import { describeError } from '../../lib/supabase';
import { formatDate, formatNumber, formatQuantity } from '../../lib/format';
import type { Donation } from '../../lib/types';
import { useLang } from '../../i18n/LanguageContext';

export default function DonorOverview() {
  const { profile } = useAuth();
  const { t } = useLang();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profile) return;
    listDonationsByDonor(profile.user_id)
      .then(setDonations)
      .catch((err) => setError(describeError(err)))
      .finally(() => setLoading(false));
  }, [profile]);

  if (!profile) return null;

  const active = donations.filter((d) => d.status === 'approved' || d.status === 'matched');
  const completed = donations.filter((d) => d.status === 'completed');
  const pending = donations.filter((d) => d.status === 'pending');
  const meals = completed.reduce((sum, d) => sum + Number(d.quantity), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">
            {t('donor.welcome', { name: profile.organization || profile.full_name.split(' ')[0] })}
          </h1>
          <p className="mt-1 text-[14px] text-muted">
            {t('donor.subtitle')}
          </p>
        </div>
        <Link to="/donor/donations/new" className="btn btn-primary">
          <PlusCircle size={16} />
          {t('nav.addDonation')}
        </Link>
      </div>

      {error && <ErrorNote message={error} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('donor.totalDonations')} value={formatNumber(donations.length)} icon={<Package size={18} />} />
        <StatCard
          label={t('donor.live')}
          value={formatNumber(active.length)}
          hint={t('donor.liveHint')}
          icon={<CheckCircle2 size={18} />}
          tone="neutral"
        />
        <StatCard
          label={t('donor.awaiting')}
          value={formatNumber(pending.length)}
          hint={t('donor.awaitingHint')}
          icon={<Inbox size={18} />}
          tone="amber"
        />
        <StatCard
          label={t('donor.meals')}
          value={formatNumber(meals)}
          hint={t('donor.mealsHint')}
          icon={<Utensils size={18} />}
          tone="neutral"
        />
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-[16px] font-semibold">{t('donor.recent')}</h2>
            <p className="mt-0.5 text-[13px] text-muted">{t('donor.recentHint')}</p>
          </div>
          <Link to="/donor/donations" className="btn btn-secondary btn-sm">
            {t('common.viewAll')}
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <Spinner label="Loading donations" />
        ) : donations.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Package size={22} />}
              title={t('donor.none')}
              description={t('donor.noneCopy')}
              action={
                <Link to="/donor/donations/new" className="btn btn-primary">
                  {t('donor.addFirst')}
                </Link>
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {donations.slice(0, 5).map((donation) => (
              <li key={donation.donation_id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <img
                  src={donation.image_url || '/assets/images/placeholder.svg'}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-md object-cover"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium">{donation.food_name}</p>
                  <p className="mt-0.5 text-[12px] text-muted">
                    {formatQuantity(donation.quantity, donation.unit)} · {formatDate(donation.created_at)}
                  </p>
                </div>
                <StatusBadge status={donation.status} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/donor/donations/new"
          className="card card-pad card-hover flex items-center gap-4"
        >
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-secondary text-[#14603d]">
            <PlusCircle size={19} />
          </span>
          <div>
            <p className="text-[14px] font-semibold">{t('donor.post')}</p>
            <p className="mt-0.5 text-[12px] text-muted">{t('donor.postCopy')}</p>
          </div>
        </Link>
        <Link to="/donor/requests" className="card card-pad card-hover flex items-center gap-4">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#fdf3e3] text-[#8a5305]">
            <Inbox size={19} />
          </span>
          <div>
            <p className="text-[14px] font-semibold">{t('donor.requestsTile')}</p>
            <p className="mt-0.5 text-[12px] text-muted">{t('donor.requestsTileCopy')}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
