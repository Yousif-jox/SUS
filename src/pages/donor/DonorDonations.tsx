import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, PlusCircle, Pencil, Trash2, Search } from 'lucide-react';
import { EmptyState, ErrorNote, Spinner, StatusBadge } from '../../components/ui/Primitives';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { TextField, SelectField, TextAreaField } from '../../components/ui/Form';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { deleteDonation, listDonationsByDonor, updateDonation } from '../../lib/api';
import { describeError } from '../../lib/supabase';
import { expiryLabel, formatDate, formatQuantity } from '../../lib/format';
import { CITIES, FOOD_CATEGORIES, categoryLabel, type Donation } from '../../lib/types';
import { useLang } from '../../i18n/LanguageContext';

export default function DonorDonations() {
  const { profile } = useAuth();
  const { t } = useLang();
  const toast = useToast();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Donation | null>(null);
  const [deleting, setDeleting] = useState<Donation | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    food_name: '',
    category: 'produce',
    description: '',
    quantity: '10',
    expiry_date: '',
    location: '',
    city: 'Cairo',
  });
  const [formError, setFormError] = useState('');

  async function load() {
    if (!profile) return;
    setLoading(true);
    try {
      setDonations(await listDonationsByDonor(profile.user_id));
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return donations;
    return donations.filter(
      (d) => d.food_name.toLowerCase().includes(q) || d.location.toLowerCase().includes(q),
    );
  }, [donations, search]);

  function openEdit(donation: Donation) {
    setEditing(donation);
    setFormError('');
    setForm({
      food_name: donation.food_name,
      category: donation.category,
      description: donation.description ?? '',
      quantity: String(donation.quantity),
      expiry_date: donation.expiry_date,
      location: donation.location,
      city: donation.city,
    });
  }

  async function handleSave() {
    if (!editing) return;
    const quantity = Number(form.quantity);
    if (!form.food_name.trim()) return setFormError(t('donorDonations.nameErr'));
    if (!quantity || quantity <= 0) return setFormError(t('donorDonations.qtyErr'));
    if (!form.expiry_date) return setFormError(t('donorDonations.expErr'));
    if (!form.location.trim()) return setFormError(t('donorDonations.locErr'));

    setBusy(true);
    setFormError('');
    try {
      await updateDonation(editing.donation_id, {
        food_name: form.food_name.trim(),
        category: form.category,
        description: form.description.trim() || null,
        quantity,
        expiry_date: form.expiry_date,
        location: form.location.trim(),
        city: form.city,
      });
      toast.success(t('donorDonations.updated'));
      setEditing(null);
      await load();
    } catch (err) {
      setFormError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteDonation(deleting.donation_id);
      toast.success(t('donorDonations.deleted'));
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">{t('donorDonations.title')}</h1>
          <p className="mt-1 text-[13px] text-muted">
            {t('donorDonations.subtitle')}
          </p>
        </div>
        <Link to="/donor/donations/new" className="btn btn-primary">
          <PlusCircle size={16} />
          {t('nav.addDonation')}
        </Link>
      </div>

      {error && <ErrorNote message={error} />}

      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('donorDonations.search')}
          className="input pl-9"
          aria-label={t('donorDonations.search')}
        />
      </div>

      {loading ? (
        <Spinner label={t('common.loading')} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Package size={22} />}
          title={donations.length === 0 ? t('donorDonations.none') : t('donorDonations.noneSearch')}
          description={
            donations.length === 0
              ? t('donorDonations.noneCopy')
              : t('donorDonations.noneSearchCopy')
          }
          action={
            donations.length === 0 ? (
              <Link to="/donor/donations/new" className="btn btn-primary">
                {t('donor.addFirst')}
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="table-wrap hidden md:block">
            <table className="data">
              <thead>
                <tr>
                  <th>{t('donorDonations.food')}</th>
                  <th>{t('common.category')}</th>
                  <th>{t('common.quantity')}</th>
                  <th>{t('common.expiry')}</th>
                  <th>{t('donorDonations.pickup')}</th>
                  <th>{t('common.status')}</th>
                  <th className="text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((donation) => (
                  <tr key={donation.donation_id}>
                    <td>
                      <p className="font-medium">{donation.food_name}</p>
                      <p className="text-[12px] text-muted">{formatDate(donation.created_at)}</p>
                    </td>
                    <td className="text-muted">{categoryLabel(donation.category)}</td>
                    <td className="[font-variant-numeric:tabular-nums]">
                      {formatQuantity(donation.quantity, donation.unit)}
                    </td>
                    <td className="text-muted">{expiryLabel(donation.expiry_date)}</td>
                    <td className="max-w-[200px] truncate text-muted">{donation.location}</td>
                    <td><StatusBadge status={donation.status} /></td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(donation)}
                          className="btn btn-ghost btn-sm"
                          aria-label={`Edit ${donation.food_name}`}
                          disabled={donation.status === 'completed'}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(donation)}
                          className="btn btn-ghost btn-sm text-[#b42318]"
                          aria-label={`Delete ${donation.food_name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filtered.map((donation) => (
              <div key={donation.donation_id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold">{donation.food_name}</p>
                    <p className="mt-0.5 text-[12px] text-muted">{categoryLabel(donation.category)}</p>
                  </div>
                  <StatusBadge status={donation.status} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                  <div>
                    <dt className="text-muted">{t('common.quantity')}</dt>
                    <dd className="font-medium">{formatQuantity(donation.quantity, donation.unit)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">{t('common.expiry')}</dt>
                    <dd className="font-medium">{expiryLabel(donation.expiry_date)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted">{t('donorDonations.pickup')}</dt>
                    <dd className="font-medium">{donation.location}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex gap-2 border-t border-line pt-3">
                  <button type="button" onClick={() => openEdit(donation)} className="btn btn-secondary btn-sm flex-1">
                    <Pencil size={14} />
                    {t('common.edit')}
                  </button>
                  <button type="button" onClick={() => setDeleting(donation)} className="btn btn-ghost btn-sm flex-1 text-[#b42318]">
                    <Trash2 size={14} />
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal
        open={Boolean(editing)}
        title={t('donorDonations.editTitle')}
        description={t('donorDonations.editCopy')}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)} disabled={busy}>
              {t('common.cancel')}
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={busy}>
              {busy ? t('common.saving') : t('common.save')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <ErrorNote message={formError} />}
          <TextField
            label={t('donorDonations.food')}
            value={form.food_name}
            onChange={(e) => setForm({ ...form, food_name: e.target.value })}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label={t('common.category')}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={FOOD_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
            />
            <TextField
              label={t('donorDonations.qty')}
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
            <TextField
              label={t('donorDonations.expire')}
              type="date"
              value={form.expiry_date}
              onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
            />
            <SelectField
              label={t('common.city')}
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              options={CITIES.map((c) => ({ value: c, label: c }))}
            />
          </div>
          <TextField
            label={t('donorDonations.pickup')}
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <TextAreaField
            label={t('common.description')}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={t('donorDonations.delTitle')}
        message={t('donorDonations.delMsg', { name: deleting?.food_name ?? '' })}
        confirmLabel={t('donorDonations.delBtn')}
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
