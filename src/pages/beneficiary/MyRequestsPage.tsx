import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, PlusCircle, Ban } from 'lucide-react';
import { EmptyState, ErrorNote, Spinner, StatusBadge } from '../../components/ui/Primitives';
import { ConfirmDialog } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { listRequestsByBeneficiary, updateRequest } from '../../lib/api';
import { describeError } from '../../lib/supabase';
import { formatDate, formatQuantity } from '../../lib/format';
import { categoryLabel, type AssistanceRequest } from '../../lib/types';
import { useLang } from '../../i18n/LanguageContext';

export default function MyRequestsPage() {
  const { profile } = useAuth();
  const { t } = useLang();
  const toast = useToast();
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState<AssistanceRequest | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!profile) return;
    setLoading(true);
    try {
      setRequests(await listRequestsByBeneficiary(profile.user_id));
      setError('');
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  async function handleCancel() {
    if (!cancelling) return;
    setBusy(true);
    try {
      await updateRequest(cancelling.request_id, { status: 'cancelled' });
      toast.success(t('benReq.cancelled'));
      setCancelling(null);
      await load();
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  const canCancel = (r: AssistanceRequest) => r.status === 'pending' || r.status === 'approved';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">{t('benReq.title')}</h1>
          <p className="mt-1 text-[13px] text-muted">{t('benReq.subtitle')}</p>
        </div>
        <Link to="/beneficiary/requests/new" className="btn btn-primary">
          <PlusCircle size={16} />
          {t('nav.newRequest')}
        </Link>
      </div>

      {error && <ErrorNote message={error} />}

      {loading ? (
        <Spinner label={t('common.loading')} />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={22} />}
          title={t('benReq.none')}
          description={t('benReq.noneCopy')}
          action={
            <Link to="/beneficiary/requests/new" className="btn btn-primary">
              {t('benReq.create')}
            </Link>
          }
        />
      ) : (
        <>
          <div className="table-wrap hidden md:block">
            <table className="data">
              <thead>
                <tr>
                  <th>{t('benReq.foodNeeded')}</th>
                  <th>{t('benReq.household')}</th>
                  <th>{t('benBrowse.urgency')}</th>
                  <th>{t('benReq.submitted')}</th>
                  <th>{t('common.status')}</th>
                  <th className="text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.request_id}>
                    <td>
                      <p className="font-medium capitalize">
                        {request.food_type === 'any' ? t('ben.anyFood') : categoryLabel(request.food_type)}
                      </p>
                      <p className="text-[12px] text-muted">{formatQuantity(request.quantity)}</p>
                    </td>
                    <td className="[font-variant-numeric:tabular-nums]">{request.family_size} {t('common.people')}</td>
                    <td><StatusBadge status={request.urgency} /></td>
                    <td className="text-muted">{formatDate(request.created_at)}</td>
                    <td>
                      <StatusBadge status={request.status} />
                      {request.review_note && (
                        <p className="mt-1 max-w-[220px] text-[11px] text-muted">{request.review_note}</p>
                      )}
                    </td>
                    <td>
                      <div className="flex justify-end">
                        {canCancel(request) ? (
                          <button
                            type="button"
                            onClick={() => setCancelling(request)}
                            className="btn btn-ghost btn-sm text-[#b42318]"
                          >
                            <Ban size={14} />
                            {t('benReq.cancel')}
                          </button>
                        ) : (
                          <span className="text-[12px] text-muted">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {requests.map((request) => (
              <div key={request.request_id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold capitalize">
                      {request.food_type === 'any' ? 'Any food' : categoryLabel(request.food_type)}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted">
                      {formatQuantity(request.quantity)} · {request.family_size} {t('common.people')}
                    </p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-[12px] text-muted">
                  <span>{formatDate(request.created_at)}</span>
                  <StatusBadge status={request.urgency} />
                </div>
                {request.review_note && (
                  <p className="mt-2 rounded-md bg-[#fdf1f0] px-2.5 py-2 text-[12px] text-[#8e1b12]">
                    {request.review_note}
                  </p>
                )}
                {canCancel(request) && (
                  <button
                    type="button"
                    onClick={() => setCancelling(request)}
                    className="btn btn-ghost btn-sm mt-2 w-full text-[#b42318]"
                  >
                    <Ban size={14} />
                    {t('benReq.cancel')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(cancelling)}
        title={t('benReq.cancelTitle')}
        message={t('benReq.cancelMsg')}
        confirmLabel={t('benReq.cancelBtn')}
        cancelLabel={t('benReq.keep')}
        busy={busy}
        onConfirm={handleCancel}
        onCancel={() => setCancelling(null)}
      />
    </div>
  );
}
