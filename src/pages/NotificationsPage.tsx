import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Dot } from 'lucide-react';
import { EmptyState, ErrorNote, Spinner } from '../components/ui/Primitives';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../lib/api';
import { describeError } from '../lib/supabase';
import { timeAgo } from '../lib/format';
import { useLang } from '../i18n/LanguageContext';
import type { Notification } from '../lib/types';

const KIND_TONE: Record<string, string> = {
  donation: '#218c5a',
  request: '#c77c0a',
  match: '#17758a',
  delivery: '#14603d',
  system: '#5c6b63',
};

export default function NotificationsPage() {
  const { profile } = useAuth();
  const { t, plural } = useLang();
  const toast = useToast();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profile) return;
    listNotifications(profile.user_id)
      .then(setItems)
      .catch((err) => setError(describeError(err)))
      .finally(() => setLoading(false));
  }, [profile]);

  async function handleRead(id: string) {
    try {
      await markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      toast.error(describeError(err));
    }
  }

  async function handleReadAll() {
    if (!profile) return;
    try {
      await markAllNotificationsRead(profile.user_id);
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success(t('notifPage.allRead'));
    } catch (err) {
      toast.error(describeError(err));
    }
  }

  const unread = items.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">{t('notifPage.title')}</h1>
          <p className="mt-1 text-[13px] text-muted">
            {unread > 0 ? plural('notifPage.unread', unread) : t('notifPage.caughtUp')}
          </p>
        </div>
        {unread > 0 && (
          <button type="button" onClick={handleReadAll} className="btn btn-secondary btn-sm">
            <CheckCheck size={15} />
            {t('notifPage.markAll')}
          </button>
        )}
      </div>

      {error && <ErrorNote message={error} />}

      {loading ? (
        <Spinner label="Loading notifications" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bell size={22} />}
          title={t('notifPage.emptyTitle')}
          description={t('notifPage.emptyCopy')}
          action={
            <Link to="/" className="btn btn-secondary">
              {t('auth.backHome')}
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li
              key={item.notification_id}
              className={`card flex items-start gap-3 p-4 ${item.is_read ? '' : 'border-[#bfe3cf] bg-[#fbfefc]'}`}
            >
              <span
                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: KIND_TONE[item.kind] ?? '#5c6b63' }}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className={`text-[14px] leading-relaxed ${item.is_read ? 'text-muted' : 'font-medium text-ink'}`}>
                  {item.message}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
                  <span>{timeAgo(item.created_at)}</span>
                  <span className="inline-flex items-center gap-0.5 capitalize">
                    <Dot size={12} />
                    {item.kind}
                  </span>
                  {item.link && (
                    <Link to={item.link} className="font-medium text-primary-deep hover:underline">
                      {t('common.open')}
                    </Link>
                  )}
                </div>
              </div>
              {!item.is_read && (
                <button
                  type="button"
                  onClick={() => handleRead(item.notification_id)}
                  className="btn btn-ghost btn-sm shrink-0"
                >
                  {t('common.markRead')}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
