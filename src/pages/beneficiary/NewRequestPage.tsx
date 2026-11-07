import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react';
import { TextField, SelectField, TextAreaField } from '../../components/ui/Form';
import { ErrorNote } from '../../components/ui/Primitives';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { createRequest } from '../../lib/api';
import { describeError } from '../../lib/supabase';
import { CITIES, FOOD_CATEGORIES, regionLabel } from '../../lib/types';
import { useLang } from '../../i18n/LanguageContext';

export default function NewRequestPage() {
  const { profile } = useAuth();
  const { t } = useLang();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    food_type: 'any',
    quantity: '15',
    family_size: String(profile?.household_size ?? 4),
    urgency: 'normal',
    city: profile?.city ?? 'Cairo',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  if (!profile) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    const quantity = Number(form.quantity);
    const family = Number(form.family_size);
    if (!quantity || quantity <= 0) next.quantity = t('benNew.errQty');
    if (!family || family < 1) next.family_size = t('benNew.errHousehold');
    if (!form.city) next.city = t('benNew.errArea');
    if (form.notes.trim().length < 8) next.notes = t('benNew.errNotes');
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await createRequest({
        beneficiary_id: profile!.user_id,
        beneficiary_name: profile!.full_name,
        food_type: form.food_type,
        quantity,
        family_size: family,
        urgency: form.urgency,
        city: form.city,
        notes: form.notes.trim(),
      });
      toast.success(t('benNew.ok'));
      navigate('/beneficiary/requests');
    } catch (err) {
      setErrors({ form: describeError(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[720px] space-y-6">
      <Link
        to="/beneficiary/requests"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink"
      >
        <ArrowLeft size={14} />
        {t('nav.myRequests')}
      </Link>

      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">{t('benNew.title')}</h1>
        <p className="mt-1 text-[13px] text-muted">
          {t('benNew.subtitle')}
        </p>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-line bg-[#f6f8f7] px-4 py-3 text-[13px] leading-relaxed text-muted">
        <Info size={16} className="mt-0.5 shrink-0 text-primary" />
        <span>
          {t('benNew.notice')}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="card card-pad space-y-5" noValidate>
        {errors.form && <ErrorNote message={errors.form} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label={t('benNew.category')}
            value={form.food_type}
            onChange={(e) => setForm({ ...form, food_type: e.target.value })}
            options={[
              { value: 'any', label: t('benNew.anyFood') },
              ...FOOD_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
            ]}
          />
          <TextField
            label={t('benNew.qty')}
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            error={errors.quantity}
            required
          />
          <TextField
            label={t('benNew.household')}
            type="number"
            min={1}
            max={30}
            value={form.family_size}
            onChange={(e) => setForm({ ...form, family_size: e.target.value })}
            error={errors.family_size}
            hint={t('benNew.householdHint')}
            required
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
            label={t('benNew.area')}
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            error={errors.city}
            options={CITIES.map((c) => ({ value: c, label: regionLabel(c) }))}
            required
          />
        </div>

        <TextAreaField
          label={t('benNew.situation')}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          error={errors.notes}
          placeholder={t('benNew.situationPh')}
          hint={t('benNew.situationHint')}
          required
        />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-[12px] text-muted">
            {t('benNew.as')} <strong className="text-ink">{profile.full_name}</strong>
          </p>
          <div className="flex gap-2">
            <Link to="/beneficiary/requests" className="btn btn-secondary">
              {t('common.cancel')}
            </Link>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? t('common.submitting') : t('common.submit')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
