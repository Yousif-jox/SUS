import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Inbox,
  Search,
  ClipboardList,
  Truck,
  History,
  Users,
  ShieldCheck,
  HeartHandshake,
  Sparkles,
  BarChart3,
  Bell,
  Menu,
  X,
  LogOut,
  UserCog,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../i18n/LanguageContext';
import { listNotifications } from '../../lib/api';
import { initials } from '../../lib/format';
import type { Role } from '../../lib/types';

interface NavItem {
  to: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

const NAV: Record<Role, NavItem[]> = {
  donor: [
    { to: '/donor', labelKey: 'nav.overview', icon: LayoutDashboard, end: true },
    { to: '/donor/donations', labelKey: 'nav.myDonations', icon: Package },
    { to: '/donor/donations/new', labelKey: 'nav.addDonation', icon: PlusCircle },
    { to: '/donor/requests', labelKey: 'nav.incomingRequests', icon: Inbox },
  ],
  beneficiary: [
    { to: '/beneficiary', labelKey: 'nav.overview', icon: LayoutDashboard, end: true },
    { to: '/beneficiary/browse', labelKey: 'nav.browse', icon: Search },
    { to: '/beneficiary/requests', labelKey: 'nav.myRequests', icon: ClipboardList },
    { to: '/beneficiary/requests/new', labelKey: 'nav.newRequest', icon: PlusCircle },
  ],
  volunteer: [
    { to: '/volunteer', labelKey: 'nav.overview', icon: LayoutDashboard, end: true },
    { to: '/volunteer/tasks', labelKey: 'nav.tasks', icon: Truck },
    { to: '/volunteer/history', labelKey: 'nav.history', icon: History },
  ],
  admin: [
    { to: '/admin', labelKey: 'nav.overview', icon: LayoutDashboard, end: true },
    { to: '/admin/users', labelKey: 'nav.users', icon: Users },
    { to: '/admin/donations', labelKey: 'nav.donationsAdmin', icon: ShieldCheck },
    { to: '/admin/requests', labelKey: 'nav.requestsAdmin', icon: ClipboardList },
    { to: '/admin/matching', labelKey: 'nav.matching', icon: Sparkles },
    { to: '/admin/deliveries', labelKey: 'nav.deliveries', icon: Truck },
    { to: '/admin/analytics', labelKey: 'nav.analytics', icon: BarChart3 },
  ],
};

export default function DashboardLayout() {
  const { profile, signOut } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const items = profile ? NAV[profile.role] : [];

  const loadUnread = useCallback(async () => {
    if (!profile) return;
    try {
      const rows = await listNotifications(profile.user_id);
      setUnread(rows.filter((n) => !n.is_read).length);
    } catch {
      setUnread(0);
    }
  }, [profile]);

  useEffect(() => {
    loadUnread();
  }, [loadUnread, location.pathname]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const currentLabel = useMemo(() => {
    const match = items.find((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
    );
    return match ? t(match.labelKey) : t('nav.overview');
  }, [items, location.pathname, t]);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  if (!profile) return null;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between gap-2 px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white">
            <HeartHandshake size={17} />
          </span>
          <span className="text-[16px] font-semibold tracking-tight">{t('common.appName')}</span>
        </Link>
        <button
          type="button"
          className="btn btn-ghost lg:hidden"
          aria-label={t('common.close')}
          onClick={() => setDrawerOpen(false)}
        >
          <X size={18} />
        </button>
      </div>

      <div className="mx-4 mb-4 rounded-lg bg-[#f6f8f7] px-3 py-2.5">
        <p className="truncate text-[13px] font-semibold text-ink">{profile.full_name}</p>
        <p className="mt-0.5 text-[11px] font-medium text-[#14603d]">
          {t(`roles.${profile.role}`)}
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label={t('nav.overview')}>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
          >
            <item.icon size={17} />
            <span className="truncate">{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-line px-3 py-3">
        <NavLink
          to="/notifications"
          className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
        >
          <Bell size={17} />
          <span className="flex-1">{t('nav.notifications')}</span>
          {unread > 0 && (
            <span className="rounded-full bg-[#b42318] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
        >
          <UserCog size={17} />
          <span>{t('nav.profile')}</span>
        </NavLink>
        <button type="button" onClick={handleSignOut} className="sidebar-link w-full">
          <LogOut size={17} />
          <span>{t('nav.signOut')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f8f7]">
      <aside
        data-component="dashboard-sidebar"
        className="fixed inset-y-0 start-0 z-40 hidden w-[264px] border-e border-line bg-white lg:block"
      >
        {sidebar}
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t('common.close')}
            className="absolute inset-0 bg-[rgba(22,33,28,0.45)]"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 start-0 w-[280px] border-e border-line bg-white shadow-xl">
            {sidebar}
          </div>
        </div>
      )}

      <div className="lg:ps-[264px]">
        <header
          data-component="dashboard-topbar"
          className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/92 px-4 backdrop-blur-md sm:px-6"
        >
          <button
            type="button"
            className="btn btn-ghost lg:hidden"
            aria-label={t('nav.overview')}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">{currentLabel}</p>
            <p className="hidden text-[12px] text-muted sm:block">
              {t(`roles.${profile.role}`)} · {t('nav.workspace')}
            </p>
          </div>

          {profile.status === 'pending' && profile.role === 'beneficiary' && (
            <Link
              to="/notifications"
              className="hidden items-center gap-1.5 rounded-full bg-[#fdf3e3] px-3 py-1.5 text-[12px] font-semibold text-[#8a5305] sm:inline-flex"
            >
              {t('status.pending')}
              <ChevronRight size={13} />
            </Link>
          )}

          <Link
            to="/notifications"
            className="relative rounded-md p-2 text-muted transition hover:bg-[#f2f7f4] hover:text-ink"
            aria-label={t('nav.notifications')}
          >
            <Bell size={19} />
            {unread > 0 && (
              <span className="absolute -end-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#b42318] px-1 text-[10px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>

          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-md p-1 pe-2 transition hover:bg-[#f2f7f4]"
            aria-label={t('nav.profile')}
          >
            <span className="monogram h-8 w-8 text-[12px]">{initials(profile.full_name)}</span>
            <span className="hidden max-w-[120px] truncate text-[13px] font-medium sm:block">
              {profile.full_name}
            </span>
          </Link>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1120px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
