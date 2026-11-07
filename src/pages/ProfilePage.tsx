import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCog, Save, LogOut, Star, Languages } from 'lucide-react';
import { TextField, SelectField, TextAreaField } from '../components/ui/Form';
import { ErrorNote, Monogram, StatusBadge, Stars, Spinner } from '../components/ui/Primitives';
import { LanguageSwitch } from '../components/layout/PublicLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLang } from '../i18n/LanguageContext';
import { listReviewsFor, updateProfile, upsertVolunteer, getVolunteerByUser } from '../lib/api';
import { describeError } from '../lib/supabase';
import { CITIES, type Review, regionLabel } from '../lib/types';
import { formatDate } from '../lib/format';

export default function ProfilePage() {
  const { profile, refreshProfile, signOut } = useAuth();
  const { t, plural, lang } = useLang();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', phone: '', city: '', address: '', organization: '', verification_note: '' });
  const [volunteer, setVolunteer] = useState({ area: '', vehicle: 'car', capacity: '20', availability: 'available' });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name,
      phone: profile.phone ?? '',
      city: profile.city ?? '',
      address: profile.address ?? '',
      organization: profile.organization ?? '',
      verification_note: profile.verification_note ?? '',
    });
    Promise.all([
      listReviewsFor(profile.user_id).catch(() => [] as Review[]),
      profile.role === 'volunteer' ? getVolunteerByUser(profile.user_id) : Promise.resolve(null),
    ])
      .then(([rows, vol]) => {
        setReviews(rows);
        if (vol) {
          setVolunteer({
            area: vol.area,
            vehicle: vol.vehicle,
            capacity: String(vol.capacity),
            availability: vol.availability,
          });
        } else if (profile.city) {
          setVolunteer((v) => ({ ...v, area: profile.city ?? '' }));
        }
      })
      .finally(() => setLoading(false));
  }, [profile]);

  if (!profile) return null;

  const average = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.full_name.trim()) {
      setError(t('profilePage.nameRequired'));
      return;
    }
    setBusy(true);
    try {
      await updateProfile(profile!.user_id, {
        full_name: form.full_name.trim(),
        phone: form.phone || null,
        city: form.city || null,
        address: form.address || null,
        organization: form.organization || null,
        verification_note: form.verification_note || null,
      });
      if (profile!.role === 'volunteer') {
        await upsertVolunteer({
          user_id: profile!.user_id,
          area: volunteer.area || form.city || 'Cairo',
          vehicle: volunteer.vehicle,
          capacity: Number(volunteer.capacity) || 20,
          availability: volunteer.availability,
        });
      }
      await refreshProfile();
      toast.success(t('profilePage.updated'));
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div className="space-y-6">
      <div className="card card-pad">
        <div className="flex flex-wrap items-center gap-4">
          <Monogram name={profile.full_name} size={56} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[22px] font-semibold">{profile.full_name}</h1>
            <p className="mt-0.5 truncate text-[13px] text-muted">{profile.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={profile.role} />
            <StatusBadge status={profile.status} />
          </div>
        </div>
        <div className="mt-4 grid gap-3 border-t border-line pt-4 text-[13px] sm:grid-cols-3">
          <div>
            <p className="text-muted">{t('profilePage.memberSince')}</p>
            <p className="mt-0.5 font-medium">{formatDate(profile.created_at)}</p>
          </div>
          <div>
            <p className="text-muted">{t('profilePage.verified')}</p>
            <p className="mt-0.5 font-medium">{profile.verified_at ? formatDate(profile.verified_at) : t('profilePage.notYet')}</p>
          </div>
          <div>
            <p className="text-muted">{t('profilePage.rating')}</p>
            <p className="mt-0.5 flex items-center gap-2 font-medium">
              {reviews.length > 0 ? (
                <>
                  <Stars rating={Math.round(average)} />
                  <span className="text-muted">
                    {average.toFixed(1)} · {plural('profilePage.reviews', reviews.length)}
                  </span>
                </>
              ) : (
                <span className="text-muted">{t('profilePage.noReviews')}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Language settings ------------------------------------------------- */}
      <section className="card card-pad" aria-labelledby="language-heading" data-component="language-settings">
        <div className="flex items-center gap-2">
          <Languages size={17} className="text-primary" />
          <h2 id="language-heading" className="text-[16px] font-semibold">{t('profilePage.languageSection')}</h2>
        </div>
        <p className="mt-1.5 text-[13px] text-muted">{t('common.languageHint')}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <div>
            <p className="text-[13px] font-semibold">{t('common.language')}</p>
            <p className="mt-0.5 text-[12px] text-muted">
              {lang === 'ar' ? 'العربية — يتم عرض الواجهة من اليمين إلى اليسار.' : 'English — left to right interface.'}
            </p>
          </div>
          <LanguageSwitch />
        </div>
        <p className="mt-3 text-[12px] text-muted">{t('profilePage.languageSaved')}</p>
      </section>

      <form onSubmit={handleSave} className="card card-pad space-y-4">
        <div className="flex items-center gap-2">
          <UserCog size={17} className="text-primary" />
          <h2 className="text-[16px] font-semibold">{t('profilePage.details')}</h2>
        </div>

        {error && <ErrorNote message={error} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t('auth.fullName')}
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
          />
          <TextField
            label={t('auth.email')}
            value={profile.email}
            disabled
            hint={t('profilePage.emailLocked')}
          />
          <TextField
            label={t('auth.phone')}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+20 100 123 4567"
          />
          <SelectField
            label={t('auth.area')}
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            options={[{ value: '', label: t('common.none') }, ...CITIES.map((c) => ({ value: c, label: regionLabel(c) }))]}
          />
          {profile.role === 'donor' && (
            <TextField
              label={t('profilePage.org')}
              value={form.organization}
              onChange={(e) => setForm({ ...form, organization: e.target.value })}
            />
          )}
          <TextField
            label={t('profilePage.address')}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>

        {profile.role === 'beneficiary' && (
          <TextAreaField
            label={t('profilePage.verificationInfo')}
            value={form.verification_note}
            onChange={(e) => setForm({ ...form, verification_note: e.target.value })}
            hint={t('profilePage.verificationHint')}
          />
        )}

        {profile.role === 'volunteer' && (
          <div className="rounded-lg border border-line bg-[#f6f8f7] p-4">
            <p className="text-[13px] font-semibold">{t('profilePage.volunteerPrefs')}</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <TextField
                label={t('profilePage.deliveryArea')}
                value={volunteer.area}
                onChange={(e) => setVolunteer({ ...volunteer, area: e.target.value })}
              />
              <SelectField
                label={t('profilePage.transport')}
                value={volunteer.vehicle}
                onChange={(e) => setVolunteer({ ...volunteer, vehicle: e.target.value })}
                options={[
                  { value: 'car', label: t('profilePage.car') },
                  { value: 'motorbike', label: t('profilePage.motorbike') },
                  { value: 'bicycle', label: t('profilePage.bicycle') },
                  { value: 'on_foot', label: t('profilePage.onFoot') },
                ]}
              />
              <SelectField
                label={t('profilePage.availability')}
                value={volunteer.availability}
                onChange={(e) => setVolunteer({ ...volunteer, availability: e.target.value })}
                options={[
                  { value: 'available', label: t('status.available') },
                  { value: 'busy', label: t('status.busy') },
                  { value: 'unavailable', label: t('status.unavailable') },
                ]}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <button type="button" onClick={handleSignOut} className="btn btn-ghost">
            <LogOut size={16} />
            {t('nav.signOut')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            <Save size={16} />
            {busy ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>

      <div className="card card-pad">
        <div className="flex items-center gap-2">
          <Star size={17} className="text-[#c77c0a]" />
          <h2 className="text-[16px] font-semibold">{t('profilePage.reviewsTitle')}</h2>
        </div>
        {loading ? (
          <Spinner label={t('common.loading')} />
        ) : reviews.length === 0 ? (
          <p className="mt-3 text-[13px] text-muted">{t('profilePage.reviewsEmpty')}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {reviews.map((review) => (
              <li key={review.review_id} className="rounded-lg border border-line p-4">
                <div className="flex items-center justify-between gap-3">
                  <Stars rating={review.rating} />
                  <span className="text-[11px] text-muted">{formatDate(review.created_at)}</span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{review.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
