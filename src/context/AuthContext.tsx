import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, describeError } from '../lib/supabase';
import { createProfile, fetchProfile } from '../lib/api';
import type { Profile, Role } from '../lib/types';

interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  role: Role;
  phone?: string;
  organization?: string;
  city?: string;
  address?: string;
  householdSize?: number;
  verificationNote?: string;
}

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<Profile | null>;
  signOut: () => Promise<void>;
  register: (input: RegisterInput) => Promise<{ needsConfirmation: boolean }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function ensureProfile(session: Session): Promise<Profile | null> {
  const existing = await fetchProfile(session.user.id);
  if (existing) return existing;

  const meta = (session.user.user_metadata ?? {}) as Record<string, string | undefined>;
  const role = (meta.role as Role) || 'beneficiary';
  await createProfile({
    user_id: session.user.id,
    full_name: meta.full_name || session.user.email?.split('@')[0] || 'FoodBridge member',
    email: session.user.email ?? '',
    phone: meta.phone ?? null,
    role,
    organization: meta.organization ?? null,
    city: meta.city ?? null,
    address: meta.address ?? null,
    household_size: meta.household_size ? Number(meta.household_size) : null,
    verification_note: meta.verification_note ?? null,
  });
  return fetchProfile(session.user.id);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!active) return;
        setSession(data.session ?? null);
        if (data.session) {
          try {
            const p = await ensureProfile(data.session);
            if (active) setProfile(p);
          } catch {
            if (active) setProfile(null);
          }
        }
        if (active) setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        return;
      }
      ensureProfile(nextSession)
        .then((p) => setProfile(p))
        .catch(() => setProfile(null));
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(describeError(error));
    if (!data.session) throw new Error('Sign in failed. Please try again.');
    const p = await ensureProfile(data.session);
    setProfile(p);
    return p;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
          role: input.role,
          phone: input.phone ?? null,
          organization: input.organization ?? null,
          city: input.city ?? null,
          address: input.address ?? null,
          household_size: input.householdSize ?? null,
          verification_note: input.verificationNote ?? null,
        },
      },
    });
    if (error) throw new Error(describeError(error));
    if (data.session) {
      const p = await ensureProfile(data.session);
      setProfile(p);
      return { needsConfirmation: false };
    }
    return { needsConfirmation: true };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session) return;
    const p = await fetchProfile(session.user.id);
    setProfile(p);
  }, [session]);

  const value = useMemo<AuthState>(
    () => ({ session, profile, loading, signIn, signOut, register, refreshProfile }),
    [session, profile, loading, signIn, signOut, register, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
