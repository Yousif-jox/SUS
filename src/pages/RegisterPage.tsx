import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  HeartHandshake,
  Store,
  HandHeart,
  Truck,
  Check,
  MailCheck,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { TextField, SelectField, TextAreaField } from '../components/ui/Form';
import { ErrorNote } from '../components/ui/Primitives';
import { useAuth } from '../context/AuthContext';
import { dashboardPathFor } from '../components/layout/PublicLayout';
import { CITIES, type Role, regionLabel } from '../lib/types';
import { isEmail } from '../lib/format';
import { useLang } from '../i18n/LanguageContext';

const ROLES: { value: Role; title: string; copy: string; icon: typeof Store }[] = [
  {
    value: 'donor',
    title: 'auth.roleDonor',
    copy: 'auth.roleDonorCopy',
    icon: Store,
  },
  {
    value: 'beneficiary',
    title: 'auth.roleBeneficiary',
    copy: 'auth.roleBeneficiaryCopy',
    icon: HandHeart,
  },
  {
    value: 'volunteer',
    title: 'auth.roleVolunteer',
    copy: 'auth.roleVolunteerCopy',
    icon: Truck,
  },
];

function passwordScore(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return Math.min(4, score);
}

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [role, setRole] = useState<Role>('donor');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    organization: '',
    city: 'Cairo',
    address: '',
    householdSize: '4',
    verificationNote: '',
    password: '',
    confirm: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  useEffect(() => {
    const requested = params.get('role');
    if (requested === 'donor' || requested === 'beneficiary' || requested === 'volunteer') {
      setRole(requested);
    }
  }, [params]);

  const strength = useMemo(() => passwordScore(form.password), [form.password]);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.fullName.trim()) next.fullName = t('auth.errName');
    if (!form.email.trim()) next.email = t('auth.errEmail');
    else if (!isEmail(form.email)) next.email = t('auth.invalidEmail');
    if (form.phone && !/^[+\d][\d\s-]{6,}$/.test(form.phone)) next.phone = t('auth.errPhone');
    if (!form.city) next.city = t('auth.errArea');
    if (role === 'donor' && !form.organization.trim()) {
      next.organization = t('auth.errOrg');
    }
    if (role === 'beneficiary') {
      const size = Number(form.householdSize);
      if (!size || size < 1) next.householdSize = t('auth.errHousehold');
      if (!form.address.trim()) next.address = t('auth.errAddress');
      if (form.verificationNote.trim().length < 12) {
        next.verificationNote = t('auth.errVerification');
      }
    }
    if (form.password.length < 8) next.password = t('auth.errPassword');
    if (form.password !== form.confirm) next.confirm = t('auth.errConfirm');
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const result = await register({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        role,
        phone: form.phone || undefined,
        organization: role === 'donor' ? form.organization : undefined,
        city: form.city,
        address: form.address || undefined,
        householdSize: role === 'beneficiary' ? Number(form.householdSize) : undefined,
        verificationNote: role === 'beneficiary' ? form.verificationNote : undefined,
      });
      if (result.needsConfirmation) {
        setNeedsConfirmation(true);
      } else {
        navigate(dashboardPathFor(role), { replace: true });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('auth.errRegister');
      setErrors({
        form: /already registered|already exists/i.test(message)
          ? t('auth.errExists')
          : /password/i.test(message)
            ? t('auth.errWeak')
            : message,
      });
    } finally {
      setBusy(false);
    }
  }

  if (needsConfirmation) {
    return (
      <div className="container-page flex min-h-[calc(100vh-72px)] items-center justify-center py-16">
        <div className="card card-pad w-full max-w-md text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary text-[#14603d]">
            <MailCheck size={22} />
          </span>
          <h1 className="mt-5 text-[22px]">{t('auth.confirmTitle')}</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-muted">
            {t('auth.confirmCopy', { email: form.email })}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link to="/login" className="btn btn-primary w-full">
              {t('auth.goToSignIn')}
            </Link>
            <Link to="/" className="btn btn-ghost w-full">
              {t('auth.backHome')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mx-auto w-full max-w-[760px]">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink">
          <ArrowLeft size={14} />
          {t('auth.backHome')}
        </Link>

        <div className="mb-8 flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white">
            <HeartHandshake size={19} />
          </span>
          <span className="text-[19px] font-semibold tracking-tight">{t('common.appName')}</span>
        </div>

        <h1 className="text-[30px] tracking-tight sm:text-[34px]">{t('auth.registerTitle')}</h1>
        <p className="mt-2 max-w-xl text-[15px] text-muted">
          {t('auth.registerSubtitle')}
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {ROLES.map((option) => {
            const active = role === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setRole(option.value);
                  setErrors({});
                }}
                aria-pressed={active}
                className={`rounded-xl border p-4 text-left transition ${
                  active
                    ? 'border-primary bg-secondary shadow-sm'
                    : 'border-line bg-white hover:border-line-strong hover:bg-[#fafcfb]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-lg ${
                      active ? 'bg-white text-[#14603d]' : 'bg-[#f2f7f4] text-muted'
                    }`}
                  >
                    <option.icon size={17} />
                  </span>
                  {active && <Check size={16} className="text-[#14603d]" />}
                </div>
                <p className="mt-3 text-[14px] font-semibold">{t(option.title)}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">{t(option.copy)}</p>
              </button>
            );
          })}
        </div>

        {role === 'beneficiary' && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-[#f0dfc0] bg-[#fdf3e3] px-4 py-3 text-[13px] leading-relaxed text-[#8a5305]">
            <ShieldCheck size={16} className="mt-0.5 shrink-0" />
            <span>
              {t('auth.beneficiaryNotice')}
            </span>
          </div>
        )}

        {errors.form && (
          <div className="mt-5">
            <ErrorNote message={errors.form} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
          <div className="card card-pad space-y-4">
            <h2 className="text-[15px] font-semibold">{t('auth.accountDetails')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label={role === 'donor' ? t('auth.contactPerson') : t('auth.fullName')}
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                error={errors.fullName}
                placeholder="e.g. Nadia Karim"
                required
              />
              <TextField
                label={t('auth.email')}
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                error={errors.email}
                placeholder="you@example.com"
                required
              />
              <TextField
                label={t('auth.phone')}
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                error={errors.phone}
                placeholder="+20 100 123 4567"
                hint={t('auth.phoneHint')}
              />
              <SelectField
                label={t('auth.area')}
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                error={errors.city}
                options={CITIES.map((c) => ({ value: c, label: regionLabel(c) }))}
                required
              />
            </div>

            {role === 'donor' && (
              <TextField
                label={t('auth.org')}
                value={form.organization}
                onChange={(e) => update('organization', e.target.value)}
                error={errors.organization}
                placeholder="e.g. GreenLeaf Bistro"
                hint={t('auth.orgHint')}
                required
              />
            )}

            {role === 'beneficiary' && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label={t('auth.householdSize')}
                    type="number"
                    min={1}
                    max={30}
                    value={form.householdSize}
                    onChange={(e) => update('householdSize', e.target.value)}
                    error={errors.householdSize}
                    required
                  />
                  <TextField
                    label={t('auth.address')}
                    value={form.address}
                    onChange={(e) => update('address', e.target.value)}
                    error={errors.address}
                    placeholder={t('auth.addressPlaceholder')}
                    required
                  />
                </div>
                <TextAreaField
                  label={t('auth.verificationInfo')}
                  value={form.verificationNote}
                  onChange={(e) => update('verificationNote', e.target.value)}
                  error={errors.verificationNote}
                  placeholder={t('auth.verificationPlaceholder')}
                  hint={t('auth.verificationHint')}
                  required
                />
              </>
            )}
          </div>

          <div className="card card-pad space-y-4">
            <h2 className="text-[15px] font-semibold">{t('auth.passwordSection')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label={t('auth.password')}
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                error={errors.password}
                hint={t('auth.passwordHint')}
                required
              />
              <TextField
                label={t('auth.confirmPassword')}
                type="password"
                autoComplete="new-password"
                value={form.confirm}
                onChange={(e) => update('confirm', e.target.value)}
                error={errors.confirm}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  className="h-1.5 flex-1 rounded-full transition-colors"
                  style={{
                    backgroundColor:
                      strength >= n
                        ? strength <= 1
                          ? '#b42318'
                          : strength === 2
                            ? '#c77c0a'
                            : '#218c5a'
                        : '#e3eae5',
                  }}
                />
              ))}
              <span className="w-[92px] text-right text-[11px] font-medium text-muted">
                {strength <= 1 ? t('auth.strengthWeak') : strength === 2 ? t('auth.strengthFair') : strength === 3 ? t('auth.strengthGood') : t('auth.strengthStrong')}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] text-muted">
              {t('auth.alreadyAccount')}{' '}
              <Link to="/login" className="font-semibold text-primary-deep hover:underline">
                {t('nav.signIn')}
              </Link>
            </p>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? t('auth.creating') : t('auth.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
