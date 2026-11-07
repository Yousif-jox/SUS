import { useEffect, useMemo, useState } from 'react';
import { Users, Search, ShieldCheck, ShieldAlert, Ban, Check, Mail, MapPin } from 'lucide-react';
import { EmptyState, ErrorNote, Monogram, Spinner, StatusBadge } from '../../components/ui/Primitives';
import { ConfirmDialog, Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { listProfiles, setProfileStatus } from '../../lib/api';
import { describeError } from '../../lib/supabase';
import { formatDate } from '../../lib/format';
import { regionLabel, type Profile } from '../../lib/types';
import { useLang } from '../../i18n/LanguageContext';

const ROLES = ['all', 'donor', 'beneficiary', 'volunteer', 'admin'] as const;

export default function AdminUsersPage() {
  const { t } = useLang();
  const toast = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<Profile | null>(null);
  const [confirm, setConfirm] = useState<{ profile: Profile; status: 'active' | 'suspended' } | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setProfiles(await listProfiles());
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return profiles.filter((p) => {
      const roleMatch = role === 'all' || p.role === role;
      const queryMatch =
        !q ||
        p.full_name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.organization ?? '').toLowerCase().includes(q);
      return roleMatch && queryMatch;
    });
  }, [profiles, role, search]);

  async function applyStatus() {
    if (!confirm) return;
    setBusy(true);
    try {
      await setProfileStatus(confirm.profile.user_id, confirm.status);
      toast.success(
        confirm.status === 'active'
          ? t('adminUsers.verifiedOk', { name: confirm.profile.full_name })
          : t('adminUsers.suspendedOk', { name: confirm.profile.full_name }),
      );
      setConfirm(null);
      setDetail(null);
      await load();
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">{t('adminUsers.title')}</h1>
        <p className="mt-1 text-[13px] text-muted">
          {t('adminUsers.subtitle')}
        </p>
      </div>

      {error && <ErrorNote message={error} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium capitalize transition ${
                role === r
                  ? 'bg-secondary text-[#14603d]'
                  : 'border border-line bg-white text-muted hover:bg-[#f2f7f4]'
              }`}
            >
              {r === 'all' ? t('adminUsers.all') : t(`status.${r}`)}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('adminUsers.search')}
            className="input pl-9"
            aria-label={t('adminUsers.search')}
          />
        </div>
      </div>

      {loading ? (
        <Spinner label={t('common.loading')} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={22} />}
          title={t('adminUsers.none')}
          description={t('adminUsers.noneCopy')}
        />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{t('adminUsers.user')}</th>
                <th>{t('adminUsers.role')}</th>
                <th>{t('adminUsers.area')}</th>
                <th>{t('adminUsers.joined')}</th>
                <th>{t('common.status')}</th>
                <th className="text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((profile) => (
                <tr key={profile.user_id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Monogram name={profile.full_name} size={34} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{profile.full_name}</p>
                        <p className="truncate text-[12px] text-muted">
                          {profile.organization || profile.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td><StatusBadge status={profile.role} dot={false} /></td>
                  <td className="text-muted">{profile.city ? regionLabel(profile.city) : '—'}</td>
                  <td className="text-muted">{formatDate(profile.created_at)}</td>
                  <td><StatusBadge status={profile.status} /></td>
                  <td>
                    <div className="flex justify-end gap-1">
                      {profile.role === 'beneficiary' && profile.status === 'pending' && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-[#14603d]"
                          onClick={() => setConfirm({ profile, status: 'active' })}
                        >
                          <ShieldCheck size={14} />
                          {t('adminUsers.verify')}
                        </button>
                      )}
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDetail(profile)}>
                        {t('adminUsers.view')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={Boolean(detail)}
        title={detail?.full_name ?? t('adminUsers.user')}
        description={detail ? `${detail.email} · ${t('adminUsers.joined')} ${formatDate(detail.created_at)}` : ''}
        onClose={() => setDetail(null)}
        footer={
          detail ? (
            <>
              {detail.status === 'active' ? (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setConfirm({ profile: detail, status: 'suspended' })}
                >
                  <Ban size={15} />
                  {t('adminUsers.suspend')}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setConfirm({ profile: detail, status: 'active' })}
                >
                  <Check size={15} />
                  {t('adminUsers.activate')}
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={() => setDetail(null)}>
                {t('adminUsers.close')}
              </button>
            </>
          ) : null
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={detail.role} dot={false} />
              <StatusBadge status={detail.status} />
            </div>
            <dl className="grid gap-3 text-[13px] sm:grid-cols-2">
              <div>
                <dt className="text-muted">{t('adminUsers.phone')}</dt>
                <dd className="font-medium">{detail.phone || 'Not provided'}</dd>
              </div>
              <div>
                <dt className="text-muted">{t('adminUsers.area')}</dt>
                <dd className="flex items-center gap-1 font-medium">
                  <MapPin size={13} className="text-[#218c5a]" />
                  {detail.city ? regionLabel(detail.city) : t('common.none')}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted">{t('adminUsers.address')}</dt>
                <dd className="font-medium">{detail.address || 'Not provided'}</dd>
              </div>
              <div>
                <dt className="text-muted">{t('adminUsers.verified')}</dt>
                <dd className="font-medium">{detail.verified_at ? formatDate(detail.verified_at) : 'Not verified'}</dd>
              </div>
              <div>
                <dt className="text-muted">{t('adminUsers.household')}</dt>
                <dd className="font-medium">{detail.household_size ?? '—'}</dd>
              </div>
            </dl>
            {detail.verification_note && (
              <div className="rounded-lg border border-line bg-[#f6f8f7] p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                  <ShieldAlert size={12} />
                  {t('adminUsers.verificationInfo')}
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink">{detail.verification_note}</p>
              </div>
            )}
            <a
              href={`mailto:${detail.email}`}
              className="btn btn-secondary btn-sm"
            >
              <Mail size={14} />
              {t('adminUsers.emailUser')}
            </a>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.status === 'active' ? t('adminUsers.verifyTitle') : t('adminUsers.suspendTitle')}
        message={
          confirm?.status === 'active'
            ? t('adminUsers.verifyMsg', { name: confirm?.profile.full_name ?? '' })
            : t('adminUsers.suspendMsg', { name: confirm?.profile.full_name ?? '' })
        }
        confirmLabel={confirm?.status === 'active' ? t('adminUsers.verify') : t('adminUsers.suspend')}
        tone={confirm?.status === 'active' ? 'primary' : 'danger'}
        busy={busy}
        onConfirm={applyStatus}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
