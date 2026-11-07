import { useEffect, useMemo, useState } from 'react';
import { Truck, UserPlus, Check, Search } from 'lucide-react';
import { EmptyState, ErrorNote, Spinner, StatusBadge } from '../../components/ui/Primitives';
import { Modal } from '../../components/ui/Modal';
import { SelectField } from '../../components/ui/Form';
import { useToast } from '../../context/ToastContext';
import {
  listAllRequests,
  listDeliveries,
  listMatches,
  listProfiles,
  listVolunteers,
  updateDeliveryStatus,
} from '../../lib/api';
import { supabase, describeError } from '../../lib/supabase';
import { formatDate, formatDateTime } from '../../lib/format';
import { regionLabel, type AssistanceRequest, type Delivery, type Match, type Volunteer } from '../../lib/types';
import { useLang } from '../../i18n/LanguageContext';

const FILTERS = ['assigned', 'picked_up', 'in_transit', 'delivered', 'all'] as const;

export default function AdminDeliveriesPage() {
  const toast = useToast();
  const { t } = useLang();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [assigning, setAssigning] = useState<Delivery | null>(null);
  const [volunteerId, setVolunteerId] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [d, m, r, v, p] = await Promise.all([
        listDeliveries(),
        listMatches(),
        listAllRequests(),
        listVolunteers(),
        listProfiles('volunteer'),
      ]);
      setDeliveries(d);
      setMatches(m);
      setRequests(r);
      setVolunteers(v);
      setNames(Object.fromEntries(p.map((x) => [x.user_id, x.full_name])));
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

  const volunteerName = (volunteerIdValue: string | null) => {
    if (!volunteerIdValue) return null;
    const vol = volunteers.find((v) => v.volunteer_id === volunteerIdValue);
    return vol ? names[vol.user_id] ?? 'Volunteer' : 'Volunteer';
  };

  const requestFor = (delivery: Delivery) => {
    const match = matches.find((m) => m.match_id === delivery.match_id);
    return match ? requests.find((r) => r.request_id === match.request_id) ?? null : null;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deliveries.filter((d) => {
      const statusMatch = filter === 'all' || d.status === filter;
      const req = requestFor(d);
      const queryMatch =
        !q ||
        (req?.beneficiary_name ?? '').toLowerCase().includes(q) ||
        d.pickup_address.toLowerCase().includes(q) ||
        d.delivery_address.toLowerCase().includes(q);
      return statusMatch && queryMatch;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveries, filter, search, matches, requests]);

  async function handleAssign() {
    if (!assigning || !volunteerId) {
      toast.error(t('adminDel.choose'));
      return;
    }
    setBusy(true);
    try {
      const { error: updateError } = await supabase
        .from('deliveries')
        .update({ volunteer_id: volunteerId, status: 'assigned' })
        .eq('delivery_id', assigning.delivery_id);
      if (updateError) throw new Error(describeError(updateError));
      toast.success(t('adminDel.assignedOk'));
      setAssigning(null);
      await load();
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  async function markDelivered(delivery: Delivery) {
    setBusy(true);
    try {
      await updateDeliveryStatus(delivery.delivery_id, 'delivered');
      toast.success(t('adminDel.completedOk'));
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
        <h1 className="text-[22px] font-semibold tracking-tight">{t('adminDel.title')}</h1>
        <p className="mt-1 text-[13px] text-muted">
          {t('adminDel.subtitle')}
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
              {t(`status.${f}`)}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('adminDel.search')}
            className="input pl-9"
            aria-label={t('adminDel.search')}
          />
        </div>
      </div>

      {loading ? (
        <Spinner label={t('common.loading')} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Truck size={22} />}
          title={t('adminDel.none')}
          description={t('adminDel.noneCopy')}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((delivery) => {
            const request = requestFor(delivery);
            const name = volunteerName(delivery.volunteer_id);
            return (
              <article key={delivery.delivery_id} className="card card-pad">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold">
                      {request?.beneficiary_name ?? t('adminDel.beneficiary')}
                      {request && (
                        <span className="ml-2 text-[12px] font-normal text-muted">
                          {regionLabel(request.city)} · {request.family_size} {t('common.people')}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-[12.5px] text-muted">
                      {t('adminDel.pickup')}: {delivery.pickup_address}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-muted">
                      {t('adminDel.deliver')}: {delivery.delivery_address}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={delivery.status} />
                    <p className="mt-2 text-[12px] text-muted">
                      {delivery.status === 'delivered'
                        ? t('adminDel.deliveredOn', { date: formatDateTime(delivery.delivery_date) })
                        : t('adminDel.scheduled', { date: formatDate(delivery.pickup_date) })}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                  <p className="text-[12.5px] text-muted">
                    {name ? (
                      <>
                        {t('adminDel.volunteer')}: <strong className="text-ink">{name}</strong>
                      </>
                    ) : (
                      t('adminDel.noVolunteer')
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(!delivery.volunteer_id || delivery.status === 'assigned') && delivery.status !== 'delivered' && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setAssigning(delivery);
                          setVolunteerId(delivery.volunteer_id ?? '');
                        }}
                      >
                        <UserPlus size={14} />
                        {delivery.volunteer_id ? t('adminDel.reassign') : t('adminDel.assign')}
                      </button>
                    )}
                    {delivery.status !== 'delivered' && delivery.status !== 'cancelled' && delivery.volunteer_id && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => markDelivered(delivery)}
                        disabled={busy}
                      >
                        <Check size={14} />
                        {t('adminDel.markDelivered')}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(assigning)}
        title={t('adminDel.assignTitle')}
        description={t('adminDel.assignCopy')}
        onClose={() => setAssigning(null)}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setAssigning(null)} disabled={busy}>
              {t('common.cancel')}
            </button>
            <button type="button" className="btn btn-primary" onClick={handleAssign} disabled={busy}>
              {busy ? t('common.updating') : t('common.submit')}
            </button>
          </>
        }
      >
        <SelectField
          label={t('adminDel.volunteer')}
          value={volunteerId}
          onChange={(e) => setVolunteerId(e.target.value)}
          options={[
            { value: '', label: t('adminDel.choose') },
            ...volunteers.map((v) => ({
              value: v.volunteer_id,
              label: `${names[v.user_id] ?? 'Volunteer'} · ${v.area} · ${v.availability}`,
            })),
          ]}
        />
      </Modal>
    </div>
  );
}
