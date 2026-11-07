import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UploadCloud, X, Info, ArrowLeft } from 'lucide-react';
import { TextField, SelectField, TextAreaField } from '../../components/ui/Form';
import { ErrorNote } from '../../components/ui/Primitives';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { createDonation, uploadDonationImage } from '../../lib/api';
import { describeError } from '../../lib/supabase';
import { CITIES, FOOD_CATEGORIES, regionLabel } from '../../lib/types';
import { useLang } from '../../i18n/LanguageContext';

export default function NewDonationPage() {
  const { profile } = useAuth();
  const { t } = useLang();
  const toast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    food_name: '',
    category: 'produce',
    description: '',
    quantity: '20',
    unit: 'servings',
    expiry_date: '',
    location: profile?.address ?? '',
    city: profile?.city ?? 'Cairo',
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');

  if (!profile) return null;

  function pickFile(next: File | null) {
    if (!next) return;
    if (!/^image\/(jpeg|jpg|png|webp)$/.test(next.type)) {
      setErrors((prev) => ({ ...prev, image: t('donorNew.imgErr') }));
      return;
    }
    if (next.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: t('donorNew.imgSize') }));
      return;
    }
    setErrors((prev) => ({ ...prev, image: '' }));
    setFile(next);
    setPreview(URL.createObjectURL(next));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.food_name.trim()) next.food_name = t('donorNew.nameErr');
    const quantity = Number(form.quantity);
    if (!quantity || quantity <= 0) next.quantity = t('donorNew.qtyErr');
    if (!form.expiry_date) next.expiry_date = t('donorNew.expErr');
    else if (new Date(form.expiry_date) < new Date(new Date().toDateString())) {
      next.expiry_date = t('donorNew.pastErr');
    }
    if (!form.location.trim()) next.location = t('donorNew.locErr');
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      let imageUrl: string | null = null;
      if (file) {
        setProgress(t('donorNew.uploading'));
        imageUrl = await uploadDonationImage(file, profile!.user_id);
      }
      setProgress(t('donorNew.saving'));
      await createDonation({
        donor_id: profile!.user_id,
        donor_name: profile!.organization || profile!.full_name,
        food_name: form.food_name.trim(),
        category: form.category,
        description: form.description.trim() || null,
        quantity,
        unit: form.unit,
        expiry_date: form.expiry_date,
        image_url: imageUrl,
        location: form.location.trim(),
        city: form.city,
      });
      toast.success(t('donorNew.ok'));
      navigate('/donor/donations');
    } catch (err) {
      setErrors({ form: describeError(err) });
    } finally {
      setBusy(false);
      setProgress('');
    }
  }

  return (
    <div className="mx-auto max-w-[760px] space-y-6">
      <Link to="/donor/donations" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink">
        <ArrowLeft size={14} />
        {t('nav.myDonations')}
      </Link>

      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">{t('donorNew.title')}</h1>
        <p className="mt-1 text-[13px] text-muted">
          {t('donorNew.subtitle')}
        </p>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-line bg-[#f6f8f7] px-4 py-3 text-[13px] leading-relaxed text-muted">
        <Info size={16} className="mt-0.5 shrink-0 text-primary" />
        <span>
          {t('donorNew.notice')}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="card card-pad space-y-5" noValidate>
        {errors.form && <ErrorNote message={errors.form} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t('donorDonations.food')}
            value={form.food_name}
            onChange={(e) => setForm({ ...form, food_name: e.target.value })}
            error={errors.food_name}
            placeholder="e.g. Surplus vegetable trays"
            required
          />
          <SelectField
            label={t('common.category')}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            options={FOOD_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
          />
          <TextField
            label={t('donorNew.qty')}
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            error={errors.quantity}
            hint={t('donorNew.qtyHint')}
            required
          />
          <SelectField
            label={t('donorNew.unit')}
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            options={[
              { value: 'servings', label: t('donorNew.uServ') },
              { value: 'meals', label: t('donorNew.uMeal') },
              { value: 'packs', label: t('donorNew.uPack') },
              { value: 'kg', label: t('donorNew.uKg') },
              { value: 'loaves', label: t('donorNew.uLoaf') },
            ]}
          />
          <TextField
            label={t('donorDonations.expire')}
            type="date"
            value={form.expiry_date}
            onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
            error={errors.expiry_date}
            required
          />
          <SelectField
            label={t('common.city')}
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            options={CITIES.map((c) => ({ value: c, label: regionLabel(c) }))}
          />
        </div>

        <TextField
          label={t('donorDonations.pickup')}
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          error={errors.location}
          placeholder={t('auth.addressPlaceholder')}
          hint={t('donorNew.pickupHint')}
          required
        />

        <TextAreaField
          label={t('common.description')}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder={t('donorNew.descPh')}
        />

        <div>
          <p className="field-label">{t('donorNew.photo')}</p>
          <div
            className="rounded-xl border border-dashed border-line-strong bg-[#fbfdfc] p-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              pickFile(e.dataTransfer.files?.[0] ?? null);
            }}
          >
            {preview ? (
              <div className="flex items-center gap-4">
                <img src={preview} alt="Selected food" className="h-20 w-20 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{file?.name}</p>
                  <p className="mt-0.5 text-[12px] text-muted">
                    {file ? `${Math.round(file.size / 1024)} KB` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                  }}
                  className="btn btn-ghost btn-sm"
                  aria-label={t('donorNew.remove')}
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-[#14603d]">
                  <UploadCloud size={19} />
                </span>
                <p className="text-[13px] font-medium">{t('donorNew.drop')}</p>
                <p className="text-[12px] text-muted">{t('donorNew.photoHint')}</p>
                <button type="button" className="btn btn-secondary btn-sm mt-1" onClick={() => fileRef.current?.click()}>
                  {t('donorNew.choose')}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                />
              </div>
            )}
          </div>
          {errors.image && <p className="field-error">{errors.image}</p>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-[12px] text-muted">
            {t('donorNew.listingAs')} <strong className="text-ink">{profile.organization || profile.full_name}</strong>
          </p>
          <div className="flex gap-2">
            <Link to="/donor/donations" className="btn btn-secondary">
              {t('common.cancel')}
            </Link>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? progress || t('common.submitting') : t('donorNew.submit')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
