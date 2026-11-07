import { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Check,
  X,
  Truck,
  Users,
  MapPin,
  ArrowRight,
  ClipboardList,
  Info,
} from 'lucide-react';
import { EmptyState, ErrorNote, Spinner, StatusBadge, ProgressBar } from '../../components/ui/Primitives';
import { Modal } from '../../components/ui/Modal';
import { SelectField } from '../../components/ui/Form';
import { useToast } from '../../context/ToastContext';
import {
  createDelivery,
  createMatch,
  deleteMatch,
  listAllDonations,
  listAllRequests,
  listMatches,
  listProfiles,
  listVolunteers,
  updateDonation,
  updateMatchStatus,
  updateRequest,
} from '../../lib/api';
import { describeError } from '../../lib/supabase';
import { rankDonations, scoreMatch } from '../../lib/matching';
import { formatDate, formatQuantity } from '../../lib/format';
import { categoryLabel, type AssistanceRequest, type Donation, type Match, type Volunteer, regionLabel } from '../../lib/types';
import { useLang } from '../../i18n/LanguageContext';

export default function AdminMatchingPage() {
  const toast = useToast();
  const { t } = useLang();
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [assign, setAssign] = useState<Match | null>(null);
  const [assignForm, setAssignForm] = useState({ volunteer_id: '', pickup: '' });

  async function load() {
    setLoading(true);
    try {
      const [r, d, m, v, p] = await Promise.all([
        listAllRequests(),
        listAllDonations(),
        listMatches(),
        listVolunteers(),
        listProfiles('volunteer'),
      ]);
      setRequests(r);
      setDonations(d);
      setMatches(m);
      setVolunteers(v);
      setNames(Object.fromEntries(p.map((x) => [x.user_id, x.full_name])));
      setSelectedId((prev) => prev ?? r.find((x) => x.status === 'approved')?.request_id ?? null);
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

  const openRequests = useMemo(
    () => requests.filter((r) => r.status === 'approved' || r.status === 'matched'),
    [requests],
  );
  const selected = openRequests.find((r) => r.request_id === selectedId) ?? null;
  const approvedDonations = useMemo(
    () => donations.filter((d) => d.status === 'approved'),
    [donations],
  );
  const candidates = useMemo(
    () => (selected ? rankDonations(approvedDonations, selected) : []),
    [selected, approvedDonations],
  );

  const existingForRequest = useMemo(
    () => (selected ? matches.filter((m) => m.request_id === selected.request_id) : []),
    [matches, selected],
  );

  async function handleCreateMatch(donation: Donation, score: number) {
    if (!selected) return;
    setBusy(true);
    try {
      const needed = Number(selected.quantity);
      const available = Number(donation.quantity);
      await createMatch({
        donation_id: donation.donation_id,
        request_id: selected.request_id,
        matched_quantity: Math.min(needed, available),
        score,
        note: `Rule-based score ${score}/100 · ${categoryLabel(donation.category)} · ${donation.city}`,
        status: 'proposed',
      });
      toast.success(t('adminMatch.proposed'));
      await load();
    } catch (err) {
      const message = describeError(err);
      toast.error(/duplicate|unique/i.test(message) ? t('adminMatch.dup') : message);
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm(match: Match) {
    setBusy(true);
    try {
      await updateMatchStatus(match.match_id, 'confirmed');
      await updateDonation(match.donation_id, { status: 'matched' });
      await updateRequest(match.request_id, { status: 'matched' });
      toast.success(t('adminMatch.confirmedOk'));
      await load();
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel(match: Match) {
    setBusy(true);
    try {
      await updateMatchStatus(match.match_id, 'cancelled');
      await updateDonation(match.donation_id, { status: 'approved' });
      await updateRequest(match.request_id, { status: 'approved' });
      toast.success(t('adminMatch.cancelledOk'));
      await load();
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(match: Match) {
    setBusy(true);
    try {
      await deleteMatch(match.match_id);
      toast.success(t('adminMatch.removedOk'));
      await load();
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleAssign() {
    if (!assign || !assignForm.volunteer_id) {
      toast.error(t('adminMatch.chooseVolunteer'));
      return;
    }
    const request = requests.find((r) => r.request_id === assign.request_id);
    const donation = donations.find((d) => d.donation_id === assign.donation_id);
    if (!request || !donation) return;

    setBusy(true);
    try {
      await createDelivery({
        match_id: assign.match_id,
        volunteer_id: assignForm.volunteer_id,
        pickup_address: donation.location,
        delivery_address: `${request.city} — family address shared on acceptance`,
        pickup_date: assignForm.pickup ? new Date(assignForm.pickup).toISOString() : null,
        notes: t('adminMatch.quantityLabel', { qty: assign.matched_quantity, unit: donation.unit }),
      });
      toast.success(t('adminMatch.assignedOk'));
      setAssign(null);
      await load();
    } catch (err) {
      const message = describeError(err);
      toast.error(/duplicate|unique/i.test(message) ? t('adminMatch.dupDelivery') : message);
    } finally {
      setBusy(false);
    }
  }

  const deliveredMatchIds = useMemo(() => new Set<string>(), []);
  void deliveredMatchIds;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">{t('adminMatch.title')}</h1>
        <p className="mt-1 text-[13px] text-muted">
          {t('adminMatch.subtitle')}
        </p>
      </div>

      {error && <ErrorNote message={error} />}

      <div className="flex items-start gap-2.5 rounded-lg border border-line bg-[#f6f8f7] px-4 py-3 text-[12.5px] leading-relaxed text-muted">
        <Info size={15} className="mt-0.5 shrink-0 text-primary" />
        <span>
          {t('adminMatch.weights')}
        </span>
      </div>

      {loading ? (
        <Spinner label={t('common.loading')} />
      ) : openRequests.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={22} />}
          title={t('adminMatch.noRequests')}
          description={t('adminMatch.noRequestsCopy')}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <div className="card overflow-hidden">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-[14px] font-semibold">{t('adminMatch.queue')}</h2>
              <p className="mt-0.5 text-[12px] text-muted">{t('adminMatch.queueCount', { count: openRequests.length })}</p>
            </div>
            <ul className="max-h-[520px] overflow-y-auto">
              {openRequests.map((request) => {
                const active = request.request_id === selectedId;
                return (
                  <li key={request.request_id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(request.request_id)}
                      className={`w-full border-b border-line px-4 py-3 text-left transition ${
                        active ? 'bg-secondary' : 'hover:bg-[#f8fbf9]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[13.5px] font-medium">{request.beneficiary_name}</p>
                        <StatusBadge status={request.urgency} dot={false} />
                      </div>
                      <p className="mt-1 text-[12px] text-muted">
                        {request.food_type === 'any' ? 'Any food' : categoryLabel(request.food_type)} ·{' '}
                        {formatQuantity(request.quantity)} · {regionLabel(request.city)}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-5">
            {selected && (
              <div className="card card-pad">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[16px] font-semibold">{selected.beneficiary_name}</h2>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Users size={12} />
                        {selected.family_size} people
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} />
                        {regionLabel(selected.city)}
                      </span>
                      <span>Submitted {formatDate(selected.created_at)}</span>
                    </p>
                    {selected.notes && <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted">{selected.notes}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={selected.urgency} />
                    <StatusBadge status={selected.status} />
                  </div>
                </div>
              </div>
            )}

            {existingForRequest.length > 0 && (
              <div className="card overflow-hidden">
                <div className="border-b border-line px-5 py-3">
                  <h3 className="text-[14px] font-semibold">{t('adminMatch.existing')}</h3>
                </div>
                <ul className="divide-y divide-line">
                  {existingForRequest.map((match) => {
                    const donation = donations.find((d) => d.donation_id === match.donation_id);
                    return (
                      <li key={match.match_id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-medium">{donation?.food_name ?? 'Donation'}</p>
                          <p className="text-[12px] text-muted">
                            {formatQuantity(match.matched_quantity)} · {t('adminMatch.score', { value: Math.round(Number(match.score)) })}
                          </p>
                        </div>
                        <StatusBadge status={match.status} />
                        <div className="flex gap-1">
                          {match.status === 'proposed' && (
                            <>
                              <button type="button" className="btn btn-ghost btn-sm text-[#14603d]" onClick={() => handleConfirm(match)} disabled={busy}>
                                <Check size={14} />
                                {t('adminMatch.confirm')}
                              </button>
                              <button type="button" className="btn btn-ghost btn-sm text-[#b42318]" onClick={() => handleCancel(match)} disabled={busy}>
                                <X size={14} />
                                {t('adminMatch.cancel')}
                              </button>
                            </>
                          )}
                          {match.status === 'confirmed' && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                setAssign(match);
                                setAssignForm({
                                  volunteer_id: volunteers[0]?.volunteer_id ?? '',
                                  pickup: '',
                                });
                              }}
                            >
                              <Truck size={14} />
                              {t('adminMatch.assign')}
                            </button>
                          )}
                          {(match.status === 'cancelled' || match.status === 'completed') && (
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleDelete(match)} disabled={busy}>
                              {t('adminMatch.remove')}
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="card">
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <h3 className="flex items-center gap-2 text-[14px] font-semibold">
                  <Sparkles size={15} className="text-primary" />
                  {t('adminMatch.candidates')}
                </h3>
                <span className="text-[12px] text-muted">{t('adminMatch.candidatesCount', { count: candidates.length })}</span>
              </div>

              {candidates.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={<Sparkles size={22} />}
                    title={t('adminMatch.noCandidates')}
                    description={t('adminMatch.noCandidatesCopy')}
                  />
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {candidates.map(({ donation, score }) => {
                    const detail = selected ? scoreMatch(donation, selected) : null;
                    const alreadyMatched = existingForRequest.some((m) => m.donation_id === donation.donation_id);
                    return (
                      <li key={donation.donation_id} className="px-5 py-4">
                        <div className="flex flex-wrap items-start gap-4">
                          <img
                            src={donation.image_url || '/assets/images/placeholder.svg'}
                            alt=""
                            className="h-14 w-14 rounded-lg object-cover"
                            loading="lazy"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-[14px] font-semibold">{donation.food_name}</p>
                              <span
                                className={`badge ${
                                  score >= 80
                                    ? 'bg-[#e8f5ec] text-[#14603d]'
                                    : score >= 60
                                      ? 'bg-[#fdf3e3] text-[#8a5305]'
                                      : 'bg-[#edf1ee] text-[#5c6b63]'
                                }`}
                              >
                                {score}/100
                              </span>
                            </div>
                            <p className="mt-0.5 text-[12px] text-muted">
                              {donation.donor_name} · {formatQuantity(donation.quantity, donation.unit)} ·{' '}
                              {regionLabel(donation.city)} · {formatDate(donation.expiry_date)}
                            </p>
                            {detail && (
                              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                                {detail.breakdown.map((b) => (
                                  <ProgressBar key={b.label} label={b.label} value={b.points} max={b.max} />
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleCreateMatch(donation, score)}
                            disabled={busy || alreadyMatched}
                          >
                            {alreadyMatched ? t('adminMatch.matched') : t('adminMatch.propose')}
                            {!alreadyMatched && <ArrowRight size={14} />}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal
        open={Boolean(assign)}
        title={t('adminMatch.assignTitle')}
        description={t('adminMatch.assignCopy')}
        onClose={() => setAssign(null)}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setAssign(null)} disabled={busy}>
              {t('common.cancel')}
            </button>
            <button type="button" className="btn btn-primary" onClick={handleAssign} disabled={busy}>
              {busy ? t('common.updating') : t('adminMatch.assignCta')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <SelectField
            label={t('adminMatch.volunteer')}
            value={assignForm.volunteer_id}
            onChange={(e) => setAssignForm({ ...assignForm, volunteer_id: e.target.value })}
            options={[
              { value: '', label: t('adminMatch.chooseVolunteer') },
              ...volunteers.map((v) => ({
                value: v.volunteer_id,
                label: `${names[v.user_id] ?? 'Volunteer'} · ${v.area} · ${v.availability}`,
              })),
            ]}
          />
          <SelectField
            label={t('adminMatch.pickWindow')}
            value={assignForm.pickup}
            onChange={(e) => setAssignForm({ ...assignForm, pickup: e.target.value })}
            options={[
              { value: '', label: t('adminMatch.asap') },
              { value: new Date(Date.now() + 86400000).toDateString(), label: t('adminMatch.tomorrow') },
              { value: new Date(Date.now() + 172800000).toDateString(), label: t('adminMatch.inTwo') },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}
