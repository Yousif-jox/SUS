import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, CheckCircle2, Clock, Utensils, PlusCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import { StatCard, StatusBadge, Spinner, EmptyState, ErrorNote } from '../../components/ui/Primitives';
import { useAuth } from '../../context/AuthContext';
import { listRequestsByBeneficiary } from '../../lib/api';
import { describeError } from '../../lib/supabase';
import { formatDate, formatQuantity } from '../../lib/format';
import { categoryLabel, regionLabel, type AssistanceRequest } from '../../lib/types';
import { useLang } from '../../i18n/LanguageContext';

export default function BeneficiaryOverview() {
  const { profile } = useAuth();
  const { t } = useLang();
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profile) return;
    listRequestsByBeneficiary(profile.user_id)
      .then(setRequests)
      .catch((err) => setError(describeError(err)))
      .finally(() => setLoading(false));
  }, [profile]);

  if (!profile) return null;

  const fulfilled = requests.filter((r) => r.status === 'fulfilled');
  const open = requests.filter((r) => ['pending', 'approved', 'matched'].includes(r.status));
  const meals = fulfilled.reduce((sum, r) => sum + Number(r.quantity), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">
            {t('ben.welcome', { name: profile.full_name.split(' ')[0] })}
          </h1>
          <p className="mt-1 text-[14px] text-muted">
            {t('ben.subtitle')}
          </p>
        </div>
        <Link to="/beneficiary/requests/new" className="btn btn-primary">
          <PlusCircle size={16} />
          {t('nav.newRequest')}
        </Link>
      </div>

      {profile.status === 'pending' && (
        <div className="flex items-start gap-3 rounded-xl border border-[#f0dfc0] bg-[#fdf3e3] px-4 py-3.5">
          <ShieldAlert size={18} className="mt-0.5 shrink-0 text-[#8a5305]" />
          <div>
            <p className="text-[14px] font-semibold text-[#8a5305]">{t('ben.pendingTitle')}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-[#8a5305]/90">
              {t('ben.pendingCopy')}
            </p>
          </div>
        </div>
      )}

      {error && <ErrorNote message={error} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('ben.total')} value={requests.length} icon={<ClipboardList size={18} />} />
        <StatCard
          label={t('ben.open')}
          value={open.length}
          hint={t('ben.openHint')}
          icon={<Clock size={18} />}
          tone="amber"
        />
        <StatCard
          label={t('ben.fulfilled')}
          value={fulfilled.length}
          hint={t('ben.fulfilledHint')}
          icon={<CheckCircle2 size={18} />}
          tone="neutral"
        />
        <StatCard
          label={t('ben.received')}
          value={formatQuantity(meals)}
          hint={t('ben.receivedHint')}
          icon={<Utensils size={18} />}
          tone="neutral"
        />
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="text-[16px] font-semibold">{t('ben.recent')}</h2>
          <Link to="/beneficiary/requests" className="btn btn-secondary btn-sm">
            {t('common.viewAll')}
            <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <Spinner label={t('common.loading')} />
        ) : requests.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<ClipboardList size={22} />}
              title={t('ben.none')}
              description={t('ben.noneCopy')}
              action={
                <Link to="/beneficiary/browse" className="btn btn-primary">
                  {t('ben.browse')}
                </Link>
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {requests.slice(0, 5).map((request) => (
              <li key={request.request_id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium capitalize">
                    {request.food_type === 'any' ? t('ben.anyFood') : categoryLabel(request.food_type)} · {formatQuantity(request.quantity)}
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted">
                    {request.family_size} {t('common.people')} · {regionLabel(request.city)} · {formatDate(request.created_at)}
                  </p>
                </div>
                <StatusBadge status={request.status} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-[16px] font-semibold">{t('ben.how')}</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            [`1. ${t('ben.how1')}`, t('ben.how1c')],
            [`2. ${t('ben.how2')}`, t('ben.how2c')],
            [`3. ${t('ben.how3')}`, t('ben.how3c')],
          ].map(([title, copy]) => (
            <li key={title}>
              <p className="text-[13px] font-semibold text-primary-deep">{title}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{copy}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
