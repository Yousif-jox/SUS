import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PackageSearch, ArrowRight, RefreshCw } from 'lucide-react';
import { DonationCard } from '../components/donations/DonationCard';
import { DonationFilters, filterDonations, type FilterState } from '../components/donations/DonationFilters';
import { EmptyState, ErrorNote, Spinner } from '../components/ui/Primitives';
import { listAvailableDonations } from '../lib/api';
import { describeError } from '../lib/supabase';
import type { Donation } from '../lib/types';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../i18n/LanguageContext';

export default function AvailableDonationsPage() {
  const { profile } = useAuth();
  const { t } = useLang();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FilterState>({ search: '', category: 'all', city: 'all' });

  async function load() {
    setLoading(true);
    setError('');
    try {
      setDonations(await listAvailableDonations());
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => filterDonations(donations, filters), [donations, filters]);
  const cities = useMemo(() => Array.from(new Set(donations.map((d) => d.city))), [donations]);

  return (
    <div>
      <section className="border-b border-line bg-[#f6f8f7]" data-component="donations-header">
        <div className="container-page py-12 sm:py-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            {t('donationsPage.eyebrow')}
          </p>
          <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-[32px] leading-tight tracking-tight sm:text-[38px]">
                {t('donationsPage.title')}
              </h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
                {t('donationsPage.subtitle')}
              </p>
            </div>
            {!profile && (
              <div className="flex flex-wrap gap-3">
                <Link to="/register?role=beneficiary" className="btn btn-primary">
                  {t('donationsPage.requestAssistance')}
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <DonationFilters value={filters} onChange={setFilters} cities={cities} />

        <div className="mt-6 flex items-center justify-between">
          <p className="text-[13px] text-muted">
            {loading ? `${t('common.loading')}…` : t('donationsPage.listings', { shown: filtered.length, total: donations.length })}
          </p>
          <button type="button" onClick={load} className="btn btn-ghost btn-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {t('common.refresh')}
          </button>
        </div>

        <div className="mt-4">
          {error && <ErrorNote message={error} />}
          {loading ? (
            <Spinner label={t('common.loading')} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<PackageSearch size={22} />}
              title={donations.length === 0 ? t('donationsPage.emptyTitle') : t('donationsPage.emptyFiltered')}
              description={
                donations.length === 0
                  ? t('donationsPage.emptyCopy')
                  : t('donationsPage.emptyFilteredCopy')
              }
              action={
                donations.length === 0 ? (
                  <Link to="/register?role=donor" className="btn btn-primary">
                    {t('home.donate')}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setFilters({ search: '', category: 'all', city: 'all' })}
                  >
                    {t('donationsPage.clear')}
                  </button>
                )
              }
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((donation) => (
                <DonationCard key={donation.donation_id} donation={donation} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
