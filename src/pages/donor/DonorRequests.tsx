import { useEffect, useState } from 'react';
import { Inbox, MapPin, Users, Utensils } from 'lucide-react';
import { EmptyState, ErrorNote, Spinner, StatusBadge } from '../../components/ui/Primitives';
import { useAuth } from '../../context/AuthContext';
import { listDonationsByDonor } from '../../lib/api';
import { supabase, describeError } from '../../lib/supabase';
import { formatDate, formatQuantity } from '../../lib/format';
import { regionLabel, type AssistanceRequest, type Delivery, type Donation, type Match } from '../../lib/types';
import { useLang } from '../../i18n/LanguageContext';

interface Row {
  match: Match;
  donation: Donation;
  request: AssistanceRequest | null;
  delivery: Delivery | null;
}

export default function DonorRequests() {
  const { profile } = useAuth();
  const { t } = useLang();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profile) return;
    let alive = true;

    (async () => {
      try {
        const donations = await listDonationsByDonor(profile.user_id);
        if (donations.length === 0) {
          if (alive) setRows([]);
          return;
        }
        const ids = donations.map((d) => d.donation_id);
        const { data: matchRows, error: matchError } = await supabase
          .from('matches')
          .select('*')
          .in('donation_id', ids);
        if (matchError) throw new Error(describeError(matchError));
        const matches = (matchRows ?? []) as Match[];

        if (matches.length === 0) {
          if (alive) setRows([]);
          return;
        }

        const { data: requestRows } = await supabase
          .from('assistance_requests')
          .select('*')
          .in('request_id', matches.map((m) => m.request_id));
        const { data: deliveryRows } = await supabase
          .from('deliveries')
          .select('*')
          .in('match_id', matches.map((m) => m.match_id));

        const requests = (requestRows ?? []) as AssistanceRequest[];
        const deliveries = (deliveryRows ?? []) as Delivery[];

        const composed: Row[] = matches
          .map((match) => ({
            match,
            donation: donations.find((d) => d.donation_id === match.donation_id)!,
            request: requests.find((r) => r.request_id === match.request_id) ?? null,
            delivery: deliveries.find((d) => d.match_id === match.match_id) ?? null,
          }))
          .filter((row) => row.donation)
          .sort((a, b) => (a.match.created_at < b.match.created_at ? 1 : -1));

        if (alive) setRows(composed);
      } catch (err) {
        if (alive) setError(describeError(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [profile]);

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">{t('donorReq.title')}</h1>
        <p className="mt-1 text-[13px] text-muted">
          {t('donorReq.subtitle')}
        </p>
      </div>

      {error && <ErrorNote message={error} />}

      {loading ? (
        <Spinner label={t('common.loading')} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Inbox size={22} />}
          title={t('donorReq.none')}
          description={t('donorReq.noneCopy')}
        />
      ) : (
        <div className="space-y-3">
          {rows.map(({ match, donation, request, delivery }) => (
            <article key={match.match_id} className="card card-pad">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold">{donation.food_name}</p>
                  <p className="mt-0.5 text-[12px] text-muted">
                    {t('donorReq.matchedOn')} {formatDate(match.created_at)} · {t('donorReq.score')} {Math.round(Number(match.score))}/100
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={match.status} />
                  {delivery && <StatusBadge status={delivery.status} />}
                </div>
              </div>

              <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
                <div className="space-y-2 text-[13px]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                    {t('donorReq.family')}
                  </p>
                  {request ? (
                    <>
                      <p className="flex items-center gap-2">
                        <Users size={14} className="text-[#218c5a]" />
                        {request.family_size} {t('common.people')} · {t(`status.${request.urgency}`)}
                      </p>
                      <p className="flex items-center gap-2 text-muted">
                        <MapPin size={14} className="text-[#218c5a]" />
                        {regionLabel(request.city)}
                      </p>
                      <p className="line-clamp-2 text-muted">{request.notes}</p>
                    </>
                  ) : (
                    <p className="text-muted">{t('donorReq.unavailable')}</p>
                  )}
                </div>
                <div className="space-y-2 text-[13px]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                    {t('donorReq.fulfil')}
                  </p>
                  <p className="flex items-center gap-2">
                    <Utensils size={14} className="text-[#218c5a]" />
                    {t('donorReq.allocated', { qty: formatQuantity(match.matched_quantity, donation.unit) })}
                  </p>
                  {delivery ? (
                    <p className="text-muted">
                      {delivery.status === 'delivered'
                        ? `Delivered ${formatDate(delivery.delivery_date)}`
                        : `Delivery ${delivery.status.replace('_', ' ')} · pickup ${formatDate(delivery.pickup_date)}`}
                    </p>
                  ) : (
                    <p className="text-muted">{t('donorReq.awaiting')}</p>
                  )}
                  {match.note && <p className="text-muted">{match.note}</p>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
