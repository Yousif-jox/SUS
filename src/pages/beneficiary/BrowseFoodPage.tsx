import { useEffect, useMemo, useState } from 'react';
import { PackageSearch, HandHeart, RefreshCw } from 'lucide-react';
import { DonationCard } from '../../components/donations/DonationCard';
import { DonationFilters, filterDonations, type FilterState } from '../../components/donations/DonationFilters';
import { EmptyState, ErrorNote, Spinner } from '../../components/ui/Primitives';
import { Modal } from '../../components/ui/Modal';
import { TextField, SelectField, TextAreaField } from '../../components/ui/Form';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { createRequest, listAvailableDonations } from '../../lib/api';
import { describeError } from '../../lib/supabase';
import { formatQuantity } from '../../lib/format';
import { FOOD_CATEGORIES, type Donation } from '../../lib/types';
import { useLang } from '../../i18n/LanguageContext';

export default function BrowseFoodPage() {
  const { profile } = useAuth();
  const { t } = useLang();
  const toast = useToast();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FilterState>({ search: '', category: 'all', city: 'all' });
  const [selected, setSelected] = useState<Donation | null>(null);
  const [form, setForm] = useState({ quantity: '10', family: '4', urgency: 'normal', notes: '' });
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setDonations(await listAvailableDonations());
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

  const filtered = useMemo(() => filterDonations(donations, filters), [donations, filters]);
  const cities = useMemo(() => Array.from(new Set(donations.map((d) => d.city))), [donations]);

  function openRequest(donation: Donation) {
    setSelected(donation);
    setFormError('');
    setForm({
      quantity: String(Math.min(Number(donation.quantity), 15)),
      family: String(profile?.household_size ?? 4),
      urgency: 'normal',
      notes: `Requested from listing: ${donation.food_name} at ${donation.location}.`,
    });
  }

  async function submitRequest() {
    if (!profile || !selected) return;
    const quantity = Number(form.quantity);
    const family = Number(form.family);
    if (!quantity || quantity <= 0) return setFormError(t('benBrowse.qtyErr'));
    if (quantity > Number(selected.quantity)) {
      return setFormError(t('benBrowse.overErr', { qty: selected.quantity, unit: selected.unit }));
    }
    if (!family || family < 1) return setFormError(t('benBrowse.familyErr'));

    setBusy(true);
    setFormError('');
    try {
      await createRequest({
        beneficiary_id: profile.user_id,
        beneficiary_name: profile.full_name,
        food_type: selected.category,
        quantity,
        family_size: family,
        urgency: form.urgency,
        city: profile.city || selected.city,
        notes: form.notes.trim() || null,
      });
      toast.success(t('benBrowse.ok'));
      setSelected(null);
    } catch (err) {
      setFormError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">{t('benBrowse.title')}</h1>
          <p className="mt-1 text-[13px] text-muted">
            {profile?.city ? t('benBrowse.near', { city: profile.city }) : t('benBrowse.all')}
          </p>
        </div>
        <button type="button" onClick={load} className="btn btn-secondary btn-sm" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {t('common.refresh')}
        </button>
      </div>

      <DonationFilters value={filters} onChange={setFilters} cities={cities} />

      {error && <ErrorNote message={error} />}

      {loading ? (
        <Spinner label={t('common.loading')} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<PackageSearch size={22} />}
          title={t('benBrowse.none')}
          description={t('benBrowse.noneCopy')}
          action={
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setFilters({ search: '', category: 'all', city: 'all' })}
            >
              {t('donationsPage.clear')}
            </button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((donation) => (
            <DonationCard
              key={donation.donation_id}
              donation={donation}
              footer={
                <button type="button" className="btn btn-primary w-full" onClick={() => openRequest(donation)}>
                  <HandHeart size={15} />
                  {t('benBrowse.request')}
                </button>
              }
            />
          ))}
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        title={t('benBrowse.modalTitle')}
        description={selected ? `${selected.food_name} · ${formatQuantity(selected.quantity, selected.unit)}` : ''}
        onClose={() => setSelected(null)}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setSelected(null)} disabled={busy}>
              {t('common.cancel')}
            </button>
            <button type="button" className="btn btn-primary" onClick={submitRequest} disabled={busy}>
              {busy ? t('common.submitting') : t('common.submit')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <ErrorNote message={formError} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label={t('benBrowse.qty')}
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              hint={selected ? t('benBrowse.available', { qty: selected.quantity, unit: selected.unit }) : undefined}
            />
            <TextField
              label={t('benBrowse.household')}
              type="number"
              min={1}
              value={form.family}
              onChange={(e) => setForm({ ...form, family: e.target.value })}
            />
            <SelectField
              label={t('benBrowse.urgency')}
              value={form.urgency}
              onChange={(e) => setForm({ ...form, urgency: e.target.value })}
              options={[
                { value: 'low', label: t('status.low') },
                { value: 'normal', label: t('status.normal') },
                { value: 'high', label: t('status.high') },
                { value: 'critical', label: t('status.critical') },
              ]}
            />
            <SelectField
              label={t('benBrowse.category')}
              value={selected?.category ?? 'produce'}
              onChange={() => {}}
              options={FOOD_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
              disabled
            />
          </div>
          <TextAreaField
            label={t('benBrowse.notes')}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            hint={t('benBrowse.notesHint')}
          />
        </div>
      </Modal>
    </div>
  );
}
