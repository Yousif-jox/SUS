import { useEffect, useState } from 'react';
import { History, CheckCircle2 } from 'lucide-react';
import { EmptyState, ErrorNote, Spinner, StatusBadge } from '../../components/ui/Primitives';
import { useAuth } from '../../context/AuthContext';
import { getVolunteerByUser, listDeliveries } from '../../lib/api';
import { describeError } from '../../lib/supabase';
import { formatDateTime } from '../../lib/format';
import type { Delivery, Volunteer } from '../../lib/types';
import { useLang } from '../../i18n/LanguageContext';

export default function VolunteerHistoryPage() {
  const { profile } = useAuth();
  const { t } = useLang();
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profile) return;
    (async () => {
      try {
        const vol = await getVolunteerByUser(profile.user_id);
        setVolunteer(vol);
        setDeliveries(await listDeliveries());
      } catch (err) {
        setError(describeError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [profile]);

  if (!profile) return null;

  const history = volunteer
    ? deliveries
        .filter((d) => d.volunteer_id === volunteer.volunteer_id && (d.status === 'delivered' || d.status === 'cancelled'))
        .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">{t('volHist.title')}</h1>
        <p className="mt-1 text-[13px] text-muted">
          {t('volHist.subtitle')}
        </p>
      </div>

      {error && <ErrorNote message={error} />}

      {loading ? (
        <Spinner label={t('common.loading')} />
      ) : history.length === 0 ? (
        <EmptyState
          icon={<History size={22} />}
          title={t('volHist.none')}
          description={t('volHist.noneCopy')}
        />
      ) : (
        <>
          <div className="card card-pad">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-[#14603d]">
                <CheckCircle2 size={19} />
              </span>
              <div>
                <p className="text-[20px] font-semibold [font-variant-numeric:tabular-nums]">
                  {history.filter((d) => d.status === 'delivered').length}
                </p>
                <p className="text-[12px] text-muted">{t('volHist.count')}</p>
              </div>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>{t('volHist.pickup')}</th>
                  <th>{t('volHist.deliveredTo')}</th>
                  <th>{t('volHist.completed')}</th>
                  <th>{t('common.status')}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((delivery) => (
                  <tr key={delivery.delivery_id}>
                    <td className="max-w-[240px] truncate">{delivery.pickup_address}</td>
                    <td className="max-w-[240px] truncate text-muted">{delivery.delivery_address}</td>
                    <td className="text-muted">{formatDateTime(delivery.delivery_date ?? delivery.updated_at)}</td>
                    <td><StatusBadge status={delivery.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
