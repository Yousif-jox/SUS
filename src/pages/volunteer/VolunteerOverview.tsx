import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, CheckCircle2, PackageOpen, MapPin, ArrowRight, Power } from 'lucide-react';
import { StatCard, StatusBadge, Spinner, EmptyState, ErrorNote } from '../../components/ui/Primitives';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  getVolunteerByUser,
  listDeliveries,
  setVolunteerAvailability,
  upsertVolunteer,
} from '../../lib/api';
import { describeError } from '../../lib/supabase';
import { formatDate } from '../../lib/format';
import type { Delivery, Volunteer } from '../../lib/types';
import { useLang } from '../../i18n/LanguageContext';

export default function VolunteerOverview() {
  const { profile } = useAuth();
  const { t } = useLang();
  const toast = useToast();
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    if (!profile) return;
    setLoading(true);
    try {
      const vol =
        (await getVolunteerByUser(profile.user_id)) ??
        (await (async () => {
          await upsertVolunteer({
            user_id: profile.user_id,
            availability: 'available',
            area: profile.city || 'Cairo',
            vehicle: 'car',
            capacity: 20,
          });
          return getVolunteerByUser(profile.user_id);
        })());
      setVolunteer(vol);
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

  if (!profile) return null;

  const mine = volunteer ? deliveries.filter((d) => d.volunteer_id === volunteer.volunteer_id) : [];
  const active = mine.filter((d) => d.status !== 'delivered' && d.status !== 'cancelled');
  const completed = mine.filter((d) => d.status === 'delivered');
  const openTasks = deliveries.filter((d) => d.volunteer_id === null && d.status === 'assigned');

  async function toggleAvailability() {
    if (!volunteer) return;
    const next = volunteer.availability === 'available' ? 'busy' : 'available';
    try {
      await setVolunteerAvailability(volunteer.volunteer_id, next);
      setVolunteer({ ...volunteer, availability: next });
      toast.success(next === 'available' ? t('vol.available') : t('vol.busy'));
    } catch (err) {
      toast.error(describeError(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">
            {t('vol.welcome', { name: profile.full_name.split(' ')[0] })}
          </h1>
          <p className="mt-1 text-[14px] text-muted">
            {volunteer?.area ? t('vol.area', { area: volunteer.area }) : t('vol.noArea')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {volunteer && <StatusBadge status={volunteer.availability} />}
          <button type="button" onClick={toggleAvailability} className="btn btn-secondary">
            <Power size={15} />
            {volunteer?.availability === 'available' ? t('vol.setBusy') : t('vol.setAvailable')}
          </button>
        </div>
      </div>

      {error && <ErrorNote message={error} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('vol.active')} value={active.length} icon={<Truck size={18} />} />
        <StatCard label={t('vol.completed')} value={completed.length} icon={<CheckCircle2 size={18} />} tone="neutral" />
        <StatCard
          label={t('vol.openNearby')}
          value={openTasks.length}
          hint={t('vol.openHint')}
          icon={<PackageOpen size={18} />}
          tone="amber"
        />
        <StatCard
          label={t('vol.capacity')}
          value={volunteer ? t('vol.capacityUnit', { count: volunteer.capacity }) : '—'}
          hint={volunteer ? t('vol.transport', { value: volunteer.vehicle.replace('_', ' ') }) : undefined}
          icon={<MapPin size={18} />}
          tone="neutral"
        />
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="text-[16px] font-semibold">{t('vol.current')}</h2>
          <Link to="/volunteer/tasks" className="btn btn-secondary btn-sm">
            {t('vol.allTasks')}
            <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <Spinner label={t('common.loading')} />
        ) : active.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Truck size={22} />}
              title={t('vol.none')}
              description={t('vol.noneCopy')}
              action={
                <Link to="/volunteer/tasks" className="btn btn-primary">
                  {t('vol.viewTasks')}
                </Link>
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {active.map((delivery) => (
              <li key={delivery.delivery_id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold">{t('vol.pickup')}: {delivery.pickup_address}</p>
                    <p className="mt-1 text-[13px] text-muted">{t('vol.deliverTo')}: {delivery.delivery_address}</p>
                    <p className="mt-1 text-[12px] text-muted">
                      {t('vol.scheduled', { date: formatDate(delivery.pickup_date) })}
                    </p>
                  </div>
                  <StatusBadge status={delivery.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
