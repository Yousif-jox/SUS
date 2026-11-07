import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, HeartHandshake, ArrowRight, Languages } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../i18n/LanguageContext';
import { initials } from '../../lib/format';

const NAV = [
  { to: '/', key: 'nav.home', end: true },
  { to: '/about', key: 'nav.about' },
  { to: '/donations', key: 'nav.donations' },
  { to: '/impact', key: 'nav.impact' },
];

export function dashboardPathFor(role?: string | null): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'donor':
      return '/donor';
    case 'volunteer':
      return '/volunteer';
    case 'beneficiary':
      return '/beneficiary';
    default:
      return '/';
  }
}

export function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useLang();
  return (
    <div
      className="inline-flex items-center rounded-full border border-line bg-white p-0.5"
      role="group"
      aria-label={t('common.language')}
    >
      <button
        type="button"
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        className={`rounded-full px-2.5 py-1 text-[12px] font-semibold transition ${
          lang === 'en' ? 'bg-secondary text-[#14603d]' : 'text-muted hover:text-ink'
        }`}
      >
        {compact ? 'EN' : t('common.english')}
      </button>
      <button
        type="button"
        onClick={() => setLang('ar')}
        aria-pressed={lang === 'ar'}
        className={`rounded-full px-2.5 py-1 text-[12px] font-semibold transition ${
          lang === 'ar' ? 'bg-secondary text-[#14603d]' : 'text-muted hover:text-ink'
        }`}
      >
        {compact ? 'ع' : t('common.arabic')}
      </button>
    </div>
  );
}

export default function PublicLayout() {
  const { profile } = useAuth();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header
        data-component="site-header"
        className="sticky top-0 z-50 border-b border-line/80 bg-white/85 backdrop-blur-md"
      >
        <div className="container-page flex h-[72px] items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5" aria-label={t('common.appName')}>
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white">
              <HeartHandshake size={19} />
            </span>
            <span className="text-[19px] font-semibold tracking-tight">{t('common.appName')}</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label={t('common.appName')}>
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              >
                {t(item.key)}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSwitch compact />
            {profile ? (
              <Link to={dashboardPathFor(profile.role)} className="btn btn-primary">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/20 text-[11px] font-bold">
                  {initials(profile.full_name)}
                </span>
                {t('nav.dashboard')}
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">
                  {t('nav.signIn')}
                </Link>
                <Link to="/register" className="btn btn-primary">
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 lg:hidden">
            <button
              type="button"
              onClick={() => {
                const next = document.documentElement.classList.contains('is-rtl') ? 'en' : 'ar';
                window.localStorage.setItem('foodbridge.lang', next);
                window.location.reload();
              }}
              className="btn btn-ghost btn-sm"
              aria-label={t('common.language')}
            >
              <Languages size={17} />
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              aria-label={open ? t('common.close') : t('common.open')}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-line bg-white lg:hidden">
            <div className="container-page flex flex-col gap-1 py-4">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                >
                  {t(item.key)}
                </NavLink>
              ))}
              <div className="mt-3 flex flex-col gap-2">
                <LanguageSwitch />
                {profile ? (
                  <Link to={dashboardPathFor(profile.role)} className="btn btn-primary w-full">
                    {t('nav.dashboard')}
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="btn btn-secondary w-full">
                      {t('nav.signIn')}
                    </Link>
                    <Link to="/register" className="btn btn-primary w-full">
                      {t('nav.register')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer data-component="site-footer" className="mt-16 border-t border-line bg-[#f6f8f7]">
        <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white">
                <HeartHandshake size={19} />
              </span>
              <span className="text-[18px] font-semibold">{t('common.appName')}</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{t('footer.tagline')}</p>
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-muted">{t('footer.platform')}</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link className="transition hover:text-primary-deep" to="/donations">{t('nav.donations')}</Link></li>
              <li><Link className="transition hover:text-primary-deep" to="/impact">{t('nav.impact')}</Link></li>
              <li><Link className="transition hover:text-primary-deep" to="/about">{t('footer.howItWorks')}</Link></li>
              <li><Link className="transition hover:text-primary-deep" to="/register">{t('footer.becomeDonor')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-muted">{t('footer.involved')}</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link className="transition hover:text-primary-deep" to="/register?role=donor">{t('footer.donateFood')}</Link></li>
              <li><Link className="transition hover:text-primary-deep" to="/register?role=volunteer">{t('footer.volunteer')}</Link></li>
              <li><Link className="transition hover:text-primary-deep" to="/register?role=beneficiary">{t('footer.requestHelp')}</Link></li>
              <li><Link className="transition hover:text-primary-deep" to="/login">{t('nav.signIn')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-muted">{t('footer.contact')}</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li>hello@foodbridge.org</li>
              <li>{t('footer.supportHours')}</li>
              <li>{t('footer.hub')}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line">
          <div className="container-page flex flex-col gap-2 py-5 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} {t('common.appName')}. {t('footer.rights')}</p>
            <p>{t('footer.sdg')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
