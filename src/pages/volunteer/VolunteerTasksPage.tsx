import { useEffect, useState } from 'react';
import { Truck, PackageOpen, MapPin, ArrowRight, CheckCircle2, Navigation } from 'lucide-react';
import { EmptyState, ErrorNote, Spinner, StatusBadge } from '../../components/ui/Primitives';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getVolunteerByUser, listDeliveries, updateDeliveryStatus } from '../../lib/api';
import { supabase, describeError } from '../../lib/supabase';
import { formatDate } from '../../lib/format';
import type { Delivery, Volunteer } from '../../lib/types';
import { useLang } from '../../i18n/LanguageContext';

const NEXT_STATUS: Record<string, { next: string; label: string } | null> = {
  assigned: { next: 'picked_up', label: 'volTasks.picked' },
  picked_up: { next: 'in_transit', label: 'volTasks.start' },
  in_transit: { next: 'delivered', label: 'volTasks.confirm' },
  delivered: null,
  cancelled: null,
};

export default function VolunteerTasksPage() {
  const { profile } = useAuth();
  const { t } = useLang();
  const toast = useToast();
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    if (!profile) return;
    setLoading(true);
    try {
      setVolunteer(await getVolunteerByUser(profile.user_id));
      setDeliveries(await listDeliveries());
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

  async function acceptTask(delivery: Delivery) {
    if (!volunteer) return;
    setBusyId(delivery.delivery_id);
    try {
      const { error: claimError } = await supabase
        .from('deliveries')
        .update({ volunteer_id: volunteer.volunteer_id, status: 'assigned' })
        .eq('delivery_id', delivery.delivery_id);
      if (claimError) throw new Error(describeError(claimError));
      toast.success(t('volTasks.accepted'));
      await load();
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function advance(delivery: Delivery, next: string) {
    setBusyId(delivery.delivery_id);
    try {
      await updateDeliveryStatus(
        delivery.delivery_id,
        next as 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled',
      );
      toast.success(
        next === 'delivered' ? t('volTasks.completed') : t('volTasks.updated'),
      );
      await load();
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setBusyId(null);
    }
  }

  if (!profile) return null;

  const mine = volunteer
    ? deliveries.filter((d) => d.volunteer_id === volunteer.volunteer_id && d.status !== 'delivered')
    : [];
  const open = deliveries.filter((d) => d.volunteer_id === null && d.status === 'assigned');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">{t('volTasks.title')}</h1>
        <p className="mt-1 text-[13px] text-muted">
          {t('volTasks.subtitle')}
        </p>
      </div>

      {error && <ErrorNote message={error} />}

      <section>
        <h2 className="flex items-center gap-2 text-[16px] font-semibold">
          <Truck size={17} className="text-primary" />
          {t('volTasks.mine')}
        </h2>
        <div className="mt-3">
          {loading ? (
            <Spinner label={t('common.loading')} />
          ) : mine.length === 0 ? (
            <EmptyState
              icon={<Truck size={22} />}
              title={t('volTasks.none')}
              description={t('volTasks.noneCopy')}
            />
          ) : (
            <div className="space-y-3">
              {mine.map((delivery) => {
                const step = NEXT_STATUS[delivery.status];
                return (
                  <article key={delivery.delivery_id} className="card card-pad">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                          {t('vol.pickup')}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[14px] font-medium">
                          <MapPin size={14} className="text-[#218c5a]" />
                          {delivery.pickup_address}
                        </p>
                        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                          {t('vol.deliverTo')}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[14px] font-medium">
                          <Navigation size={14} className="text-[#14603d]" />
                          {delivery.delivery_address}
                        </p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={delivery.status} />
                        <p className="mt-2 text-[12px] text-muted">
                          {t('vol.scheduled', { date: formatDate(delivery.pickup_date) })}
                        </p>
                      </div>
                    </div>
                    {delivery.notes && (
                      <p className="mt-3 rounded-md bg-[#f6f8f7] px-3 py-2 text-[12px] text-muted">
                        {delivery.notes}
                      </p>
                    )}
                    {step && (
                      <div className="mt-4 flex justify-end border-t border-line pt-3">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => advance(delivery, step.next)}
                          disabled={busyId === delivery.delivery_id}
                        >
                          {busyId === delivery.delivery_id ? t('common.updating') : t(step.label)}
                          {step.next === 'delivered' && <CheckCircle2 size={14} />}
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="flex items-center gap-2 text-[16px] font-semibold">
          <PackageOpen size={17} className="text-[#8a5305]" />
          {t('volTasks.open')}
        </h2>
        <div className="mt-3">
          {loading ? (
            <Spinner label={t('common.loading')} />
          ) : open.length === 0 ? (
            <EmptyState
              icon={<PackageOpen size={22} />}
              title={t('volTasks.noneOpen')}
              description={t('volTasks.noneOpenCopy')}
            />
          ) : (
            <div className="space-y-3">
              {open.map((delivery) => (
                <article key={delivery.delivery_id} className="card card-pad">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold">{delivery.pickup_address}</p>
                      <p className="mt-1 text-[13px] text-muted">→ {delivery.delivery_address}</p>
                      <p className="mt-1 text-[12px] text-muted">
                        {t('volTasks.ready', { date: formatDate(delivery.pickup_date) })}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => acceptTask(delivery)}
                      disabled={busyId === delivery.delivery_id || !volunteer}
                    >
                      {busyId === delivery.delivery_id ? t('volTasks.accepting') : t('volTasks.accept')}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
