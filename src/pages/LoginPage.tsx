import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HeartHandshake, Eye, EyeOff, LogIn, Info } from 'lucide-react';
import { TextField } from '../components/ui/Form';
import { ErrorNote } from '../components/ui/Primitives';
import { useAuth } from '../context/AuthContext';
import { dashboardPathFor } from '../components/layout/PublicLayout';
import { isEmail } from '../lib/format';
import { useLang } from '../i18n/LanguageContext';

const DEMO = [
  { role: 'Admin', email: 'admin@foodbridge.demo' },
  { role: 'Donor', email: 'greenleaf@foodbridge.demo' },
  { role: 'Beneficiary', email: 'fatima@foodbridge.demo' },
  { role: 'Volunteer', email: 'daniel@foodbridge.demo' },
];

export default function LoginPage() {
  const { signIn } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!email.trim()) next.email = t('auth.enterEmail');
    else if (!isEmail(email)) next.email = t('auth.invalidEmail');
    if (!password) next.password = t('auth.enterPassword');
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const profile = await signIn(email, password);
      const params = new URLSearchParams(location.search);
      const redirect = params.get('redirect');
      navigate(redirect || dashboardPathFor(profile?.role), { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : t('common.error');
      setErrors({
        form: /invalid login|invalid credentials|email not confirmed/i.test(message)
          ? t('auth.badCredentials')
          : message,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-72px)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src="/assets/images/hero-community-hub.jpg"
          alt="Volunteers handing over a box of fresh produce"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b2318]/92 via-[#0f2a1e]/60 to-[#0f2a1e]/25" />
        <div className="relative flex h-full flex-col justify-end p-12">
          <h2 className="max-w-sm text-[30px] font-semibold leading-tight text-white">
            {t('auth.loginHeroTitle')}
          </h2>
          <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-white/75">
            {t('auth.loginHeroCopy')}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white">
              <HeartHandshake size={19} />
            </span>
            <span className="text-[19px] font-semibold tracking-tight">{t('common.appName')}</span>
          </div>

          <h1 className="text-[28px] tracking-tight">{t('auth.loginTitle')}</h1>
          <p className="mt-2 text-[14px] text-muted">
            {t('auth.loginSubtitle')}{' '}
            <Link to="/register" className="font-semibold text-primary-deep underline-offset-2 hover:underline">
              {t('auth.createAccountLink')}
            </Link>
          </p>

          {errors.form && (
            <div className="mt-5">
              <ErrorNote message={errors.form} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <TextField
              label={t('auth.email')}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="you@example.com"
              required
            />

            <div>
              <div className="relative">
                <TextField
                  label={t('auth.password')}
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  placeholder={t('auth.passwordPlaceholder')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? t('auth.hidePassword') : t('auth.showPassword')}
                  className="absolute right-2 top-[30px] rounded p-1.5 text-muted transition hover:text-ink"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={busy}>
              {busy ? t('auth.signingIn') : t('auth.loginTitle')}
              {!busy && <LogIn size={16} />}
            </button>
          </form>

          <div className="mt-8 rounded-xl border border-line bg-[#f6f8f7] p-4">
            <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">
              <Info size={13} />
              {t('auth.demoAccounts')}
            </p>
            <ul className="mt-2.5 space-y-1.5">
              {DEMO.map((d) => (
                <li key={d.email} className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="text-muted">{d.role}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(d.email);
                      setPassword('FoodBridge123!');
                      setErrors({});
                    }}
                    className="font-medium text-primary-deep hover:underline"
                  >
                    {d.email}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2.5 text-[11px] text-muted">
              {t('auth.demoPassword')} <code className="rounded bg-white px-1 py-0.5">FoodBridge123!</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
