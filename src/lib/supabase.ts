import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseReady = Boolean(url && anonKey);

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/** Public bucket that stores donor-uploaded food photos. */
export const DONATION_BUCKET = 'donation-images';

export function publicImageUrl(path: string): string {
  const { data } = supabase.storage.from(DONATION_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function describeError(error: unknown): string {
  if (!error) return 'Something went wrong. Please try again.';
  if (typeof error === 'string') return error;
  const anyErr = error as { message?: string; error_description?: string; details?: string };
  return (
    anyErr.message ||
    anyErr.error_description ||
    anyErr.details ||
    'Something went wrong. Please try again.'
  );
}
