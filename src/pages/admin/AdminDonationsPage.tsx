import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Check, X, Search, PackageCheck } from 'lucide-react';
import { EmptyState, ErrorNote, Spinner, StatusBadge } from '../../components/ui/Primitives';
import { Modal } from '../../components/ui/Modal';
import { TextAreaField } from '../../components/ui/Form';
import { useToast } from '../../context/ToastContext';
import { listAllDonations, reviewDonation } from '../../lib/api';
import { describeError } from '../../lib/supabase';
import { expiryLabel, formatDate, formatQuantity } from '../../lib/format';
import { categoryLabel, type Donation, regionLabel } from '../../lib/types';
import { useLang } from '../../i18n/LanguageContext';

const FILTERS = ['pending', 'approved', 'matched', 'completed', 'rejected', 'all'] as const;

export default function AdminDonationsPage() {
  const toast = useToast();
  const { t } = useLang();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('pending');
  const [search, setSearch] = useState('');
  const [review, setReview] = useState<{ donation: Donation; action: 'approve' | 'reject' } | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setDonations(await listAllDonations());
      setError('');
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return donations.filter((d) => {
      const statusMatch = filter === 'all' || d.status === filter;
      const queryMatch =
        !q ||
        d.food_name.toLowerCase().includes(q) ||
        d.donor_name.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q);
      return statusMatch && queryMatch;
    });
  }, [donations, filter, search]);

  async function submitReview() {
    if (!review) return;
    if (review.action === 'reject' && note.trim().length < 4) {
      toast.error(t('adminDonations.reasonErr'));
      return;
    }
    setBusy(true);
    try {
      await reviewDonation(
        review.donation.donation_id,
        review.action === 'approve' ? 'approved' : 'rejected',
        note.trim() || undefined,
      );
      toast.success(review.action === 'approve' ? t('adminDonations.approved') : t('adminDonations.rejected'));
      setReview(null);
      setNote('');
      await load();
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  const counts = useMemo(
    () => ({
      pending: donations.filter((d) => d.status === 'pending').length,
      approved: donations.filter((d) => d.status === 'approved').length,
    }),
    [donations],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">{t('adminDonations.title')}</h1>
        <p className="mt-1 text-[13px] text-muted">
          {t('adminDonations.subtitle', { count: counts.pending })}
        </p>
      </div>

      {error && <ErrorNote message={error} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium capitalize transition ${
                filter === f
                  ? 'bg-secondary text-[#14603d]'
                  : 'border border-line bg-white text-muted hover:bg-[#f2f7f4]'
              }`}
            >
              {f}
              {f === 'pending' && counts.pending > 0 && (
                <span className="ml-1.5 rounded-full bg-[#c77c0a] px-1.5 text-[10px] font-bold text-white">
                  {counts.pending}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('adminDonations.search')}
            className="input pl-9"
            aria-label={t('adminDonations.search')}
          />
        </div>
      </div>

      {loading ? (
        <Spinner label={t('common.loading')} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<PackageCheck size={22} />}
          title={filter === 'pending' ? t('adminDonations.awaiting') : t('adminDonations.none')}
          description={
            filter === 'pending' ? t('adminDonations.awaitingCopy') : t('adminDonations.noneCopy')
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{t('adminDonations.title')}</th>
                <th>{t('adminDonations.donor')}</th>
                <th>{t('common.quantity')}</th>
                <th>{t('common.expiry')}</th>
                <th>{t('adminDonations.listed')}</th>
                <th>{t('common.status')}</th>
                <th className="text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((donation) => (
                <tr key={donation.donation_id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <img
                        src={donation.image_url || '/assets/images/placeholder.svg'}
                        alt=""
                        className="h-10 w-10 rounded-md object-cover"
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{donation.food_name}</p>
                        <p className="text-[12px] text-muted">
                          {categoryLabel(donation.category)} · {regionLabel(donation.city)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[180px] truncate text-muted">{donation.donor_name}</td>
                  <td className="[font-variant-numeric:tabular-nums]">
                    {formatQuantity(donation.quantity, donation.unit)}
                  </td>
                  <td className="text-muted">{expiryLabel(donation.expiry_date)}</td>
                  <td className="text-muted">{formatDate(donation.created_at)}</td>
                  <td><StatusBadge status={donation.status} /></td>
                  <td>
                    <div className="flex justify-end gap-1">
                      {donation.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm text-[#14603d]"
                            onClick={() => {
                              setReview({ donation, action: 'approve' });
                              setNote('');
                            }}
                          >
                            <Check size={14} />
                            {t('adminDonations.approve')}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm text-[#b42318]"
                            onClick={() => {
                              setReview({ donation, action: 'reject' });
                              setNote('');
                            }}
                          >
                            <X size={14} />
                            {t('adminDonations.reject')}
                          </button>
                        </>
                      ) : (
                        <span className="text-[12px] text-muted">{t('adminDonations.reviewed')}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={Boolean(review)}
        title={review?.action === 'approve' ? t('adminDonations.approveTitle') : t('adminDonations.rejectTitle')}
        description={review ? review.donation.food_name : ''}
        onClose={() => setReview(null)}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setReview(null)} disabled={busy}>
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className={`btn ${review?.action === 'approve' ? 'btn-primary' : 'btn-danger'}`}
              onClick={submitReview}
              disabled={busy}
            >
              {busy ? t('common.saving') : review?.action === 'approve' ? t('adminDonations.approveCta') : t('adminDonations.rejectCta')}
            </button>
          </>
        }
      >
        {review && (
          <div className="space-y-4">
            <div className="grid gap-2 rounded-lg bg-[#f6f8f7] p-3 text-[13px]">
              <p className="flex justify-between gap-3">
                <span className="text-muted">{t('adminDonations.donor')}</span>
                <span className="font-medium">{review.donation.donor_name}</span>
              </p>
              <p className="flex justify-between gap-3">
                <span className="text-muted">{t('common.quantity')}</span>
                <span className="font-medium">{formatQuantity(review.donation.quantity, review.donation.unit)}</span>
              </p>
              <p className="flex justify-between gap-3">
                <span className="text-muted">{t('common.expiry')}</span>
                <span className="font-medium">{expiryLabel(review.donation.expiry_date)}</span>
              </p>
              <p className="flex justify-between gap-3">
                <span className="text-muted">{t('donorDonations.pickup')}</span>
                <span className="max-w-[60%] text-right font-medium">{review.donation.location}</span>
              </p>
            </div>
            {review.donation.description && (
              <p className="text-[13px] leading-relaxed text-muted">{review.donation.description}</p>
            )}
            <TextAreaField
              label={review.action === 'approve' ? t('adminDonations.note') : t('adminDonations.reason')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={review.action === 'approve' ? t('adminDonations.notePh') : t('adminDonations.reasonPh')}
              hint={review.action === 'reject' ? t('adminDonations.noteHint') : undefined}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
