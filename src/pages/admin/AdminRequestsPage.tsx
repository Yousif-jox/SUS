import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Check, X, Search, Users, MapPin } from 'lucide-react';
import { EmptyState, ErrorNote, Spinner, StatusBadge } from '../../components/ui/Primitives';
import { Modal } from '../../components/ui/Modal';
import { TextAreaField } from '../../components/ui/Form';
import { useToast } from '../../context/ToastContext';
import { listAllRequests, updateRequest } from '../../lib/api';
import { describeError } from '../../lib/supabase';
import { formatDate, formatQuantity } from '../../lib/format';
import { categoryLabel, type AssistanceRequest } from '../../lib/types';
import { useLang } from '../../i18n/LanguageContext';

const FILTERS = ['pending', 'approved', 'matched', 'fulfilled', 'rejected', 'all'] as const;

export default function AdminRequestsPage() {
  const toast = useToast();
  const { t } = useLang();
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('pending');
  const [search, setSearch] = useState('');
  const [review, setReview] = useState<{ request: AssistanceRequest; action: 'approved' | 'rejected' } | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setRequests(await listAllRequests());
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
    return requests.filter((r) => {
      const statusMatch = filter === 'all' || r.status === filter;
      const queryMatch =
        !q ||
        r.beneficiary_name.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.food_type.toLowerCase().includes(q);
      return statusMatch && queryMatch;
    });
  }, [requests, filter, search]);

  async function submit() {
    if (!review) return;
    if (review.action === 'rejected' && note.trim().length < 4) {
      toast.error(t('adminReq.reasonErr'));
      return;
    }
    setBusy(true);
    try {
      await updateRequest(review.request.request_id, {
        status: review.action,
        review_note: note.trim() || null,
      });
      toast.success(review.action === 'approved' ? t('adminReq.approved') : t('adminReq.rejected'));
      setReview(null);
      setNote('');
      await load();
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">{t('adminReq.title')}</h1>
        <p className="mt-1 text-[13px] text-muted">
          {t('adminReq.subtitle')}
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
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('adminReq.search')}
            className="input pl-9"
            aria-label={t('adminReq.search')}
          />
        </div>
      </div>

      {loading ? (
        <Spinner label={t('common.loading')} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={22} />}
          title={t('adminReq.none')}
          description={t('adminReq.noneCopy')}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((request) => (
            <article key={request.request_id} className="card card-pad">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold">{request.beneficiary_name}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Users size={12} />
                      {request.family_size} people
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} />
                      {request.city}
                    </span>
                    <span>{formatDate(request.created_at)}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={request.urgency} />
                  <StatusBadge status={request.status} />
                </div>
              </div>

              <div className="mt-3 grid gap-1.5 text-[13px] sm:grid-cols-2">
                <p>
                  <span className="text-muted">{t('adminReq.needs')}: </span>
                  {request.food_type === 'any' ? t('ben.anyFood') : categoryLabel(request.food_type)} ·{' '}
                  {formatQuantity(request.quantity)}
                </p>
                <p className="text-muted">{t('adminReq.submitted')} {formatDate(request.created_at)}</p>
              </div>

              {request.notes && (
                <p className="mt-3 rounded-md bg-[#f6f8f7] px-3 py-2 text-[12.5px] leading-relaxed text-muted">
                  {request.notes}
                </p>
              )}
              {request.review_note && (
                <p className="mt-2 rounded-md bg-[#fdf1f0] px-3 py-2 text-[12.5px] text-[#8e1b12]">
                  {request.review_note}
                </p>
              )}

              {request.status === 'pending' && (
                <div className="mt-4 flex justify-end gap-2 border-t border-line pt-3">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-[#b42318]"
                    onClick={() => {
                      setReview({ request, action: 'rejected' });
                      setNote('');
                    }}
                  >
                    <X size={14} />
                    {t('adminReq.reject')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setReview({ request, action: 'approved' });
                      setNote('');
                    }}
                  >
                    <Check size={14} />
                    {t('adminReq.approve')}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(review)}
        title={review?.action === 'approved' ? t('adminReq.approveTitle') : t('adminReq.rejectTitle')}
        description={review ? `${review.request.beneficiary_name} · ${review.request.city}` : ''}
        onClose={() => setReview(null)}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setReview(null)} disabled={busy}>
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className={`btn ${review?.action === 'approved' ? 'btn-primary' : 'btn-danger'}`}
              onClick={submit}
              disabled={busy}
            >
              {busy ? t('common.saving') : review?.action === 'approved' ? t('adminReq.approveCta') : t('adminReq.rejectCta')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-2 rounded-lg bg-[#f6f8f7] p-3 text-[13px]">
            <p className="flex justify-between gap-3">
              <span className="text-muted">{t('benReq.foodNeeded')}</span>
              <span className="font-medium capitalize">
                {review?.request.food_type === 'any' ? 'Any' : review?.request.food_type}
              </span>
            </p>
            <p className="flex justify-between gap-3">
              <span className="text-muted">{t('common.quantity')}</span>
              <span className="font-medium">{formatQuantity(review?.request.quantity ?? 0)}</span>
            </p>
            <p className="flex justify-between gap-3">
              <span className="text-muted">{t('benBrowse.urgency')}</span>
              <span className="font-medium capitalize">{review?.request.urgency}</span>
            </p>
          </div>
          <TextAreaField
            label={review?.action === 'approved' ? t('adminReq.note') : t('adminReq.reason')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            hint={review?.action === 'rejected' ? t('adminReq.reasonHint') : undefined}
          />
        </div>
      </Modal>
    </div>
  );
}
