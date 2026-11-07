import { supabase, DONATION_BUCKET, publicImageUrl, describeError } from './supabase';
import type {
  AssistanceRequest,
  CategoryPoint,
  Delivery,
  Donation,
  Match,
  Notification,
  PlatformStats,
  Profile,
  RequestStatus,
  Review,
  TrendPoint,
  UrgencyPoint,
  Volunteer,
} from './types';

function unwrap<T>(data: T | null, error: unknown): T {
  if (error) throw new Error(describeError(error));
  return (data ?? ([] as unknown)) as T;
}

/* ------------------------------------------------------------------ profiles */

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(describeError(error));
  return (data as Profile) ?? null;
}

export async function createProfile(input: {
  user_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role: string;
  organization?: string | null;
  address?: string | null;
  city?: string | null;
  household_size?: number | null;
  verification_note?: string | null;
}): Promise<void> {
  const status = input.role === 'beneficiary' ? 'pending' : 'active';
  const { error } = await supabase.from('profiles').insert({ ...input, status });
  if (error) throw new Error(describeError(error));
}

export async function updateProfile(
  userId: string,
  patch: Partial<Profile>,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('user_id', userId)
    .select('*')
    .single();
  return unwrap<Profile>(data, error);
}

export async function listProfiles(role?: string): Promise<Profile[]> {
  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (role) query = query.eq('role', role);
  const { data, error } = await query;
  return unwrap<Profile[]>(data, error);
}

export async function setProfileStatus(
  userId: string,
  status: 'active' | 'pending' | 'suspended',
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ status, verified_at: status === 'active' ? new Date().toISOString() : null })
    .eq('user_id', userId);
  if (error) throw new Error(describeError(error));
}

/* ----------------------------------------------------------------- donations */

export const DONATION_FIELDS =
  'donation_id,donor_id,donor_name,food_name,category,description,quantity,unit,expiry_date,image_url,location,city,status,created_at,updated_at';

export async function listAvailableDonations(): Promise<Donation[]> {
  const { data, error } = await supabase
    .from('available_donations')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(describeError(error));
  return ((data ?? []) as unknown) as Donation[];
}

export async function listDonationsByDonor(donorId: string): Promise<Donation[]> {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .eq('donor_id', donorId)
    .order('created_at', { ascending: false });
  return unwrap<Donation[]>(data, error);
}

export async function listAllDonations(): Promise<Donation[]> {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .order('created_at', { ascending: false });
  return unwrap<Donation[]>(data, error);
}

export async function createDonation(input: {
  donor_id: string;
  donor_name: string;
  food_name: string;
  category: string;
  description: string | null;
  quantity: number;
  unit: string;
  expiry_date: string;
  image_url: string | null;
  location: string;
  city: string;
}): Promise<Donation> {
  const { data, error } = await supabase
    .from('donations')
    .insert({ ...input, status: 'pending' })
    .select('*')
    .single();
  return unwrap<Donation>(data, error);
}

export async function updateDonation(
  donationId: string,
  patch: Partial<Donation>,
): Promise<void> {
  const { error } = await supabase.from('donations').update(patch).eq('donation_id', donationId);
  if (error) throw new Error(describeError(error));
}

export async function deleteDonation(donationId: string): Promise<void> {
  const { error } = await supabase.from('donations').delete().eq('donation_id', donationId);
  if (error) throw new Error(describeError(error));
}

export async function reviewDonation(
  donationId: string,
  status: 'approved' | 'rejected',
  reviewNote?: string,
): Promise<void> {
  const { error } = await supabase
    .from('donations')
    .update({ status, review_note: reviewNote ?? null })
    .eq('donation_id', donationId);
  if (error) throw new Error(describeError(error));
}

export async function uploadDonationImage(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(DONATION_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (error) throw new Error(describeError(error));
  return publicImageUrl(path);
}

/* ------------------------------------------------------------------ requests */

export async function listRequestsByBeneficiary(
  beneficiaryId: string,
): Promise<AssistanceRequest[]> {
  const { data, error } = await supabase
    .from('assistance_requests')
    .select('*')
    .eq('beneficiary_id', beneficiaryId)
    .order('created_at', { ascending: false });
  return unwrap<AssistanceRequest[]>(data, error);
}

export async function listAllRequests(): Promise<AssistanceRequest[]> {
  const { data, error } = await supabase
    .from('assistance_requests')
    .select('*')
    .order('created_at', { ascending: false });
  return unwrap<AssistanceRequest[]>(data, error);
}

export async function createRequest(input: {
  beneficiary_id: string;
  beneficiary_name: string;
  food_type: string;
  quantity: number;
  family_size: number;
  urgency: string;
  city: string;
  notes: string | null;
}): Promise<AssistanceRequest> {
  const { data, error } = await supabase
    .from('assistance_requests')
    .insert({ ...input, status: 'pending' })
    .select('*')
    .single();
  return unwrap<AssistanceRequest>(data, error);
}

export async function updateRequest(
  requestId: string,
  patch: { status?: RequestStatus; review_note?: string | null },
): Promise<void> {
  const { error } = await supabase
    .from('assistance_requests')
    .update(patch)
    .eq('request_id', requestId);
  if (error) throw new Error(describeError(error));
}

/* ------------------------------------------------------------------- matches */

export async function listMatches(): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('created_at', { ascending: false });
  return unwrap<Match[]>(data, error);
}

export async function createMatch(input: {
  donation_id: string;
  request_id: string;
  matched_quantity: number;
  score: number;
  note: string;
  status: string;
}): Promise<Match> {
  const { data, error } = await supabase
    .from('matches')
    .insert(input)
    .select('*')
    .single();
  return unwrap<Match>(data, error);
}

export async function updateMatchStatus(
  matchId: string,
  status: 'proposed' | 'confirmed' | 'completed' | 'cancelled',
): Promise<void> {
  const { error } = await supabase.from('matches').update({ status }).eq('match_id', matchId);
  if (error) throw new Error(describeError(error));
}

export async function deleteMatch(matchId: string): Promise<void> {
  const { error } = await supabase.from('matches').delete().eq('match_id', matchId);
  if (error) throw new Error(describeError(error));
}

/* ---------------------------------------------------------------- volunteers */

export async function getVolunteerByUser(userId: string): Promise<Volunteer | null> {
  const { data, error } = await supabase
    .from('volunteers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(describeError(error));
  return (data as Volunteer) ?? null;
}

export async function listVolunteers(): Promise<Volunteer[]> {
  const { data, error } = await supabase
    .from('volunteers')
    .select('*')
    .order('created_at', { ascending: true });
  return unwrap<Volunteer[]>(data, error);
}

export async function upsertVolunteer(input: {
  user_id: string;
  availability: string;
  area: string;
  vehicle: string;
  capacity: number;
}): Promise<void> {
  const { error } = await supabase
    .from('volunteers')
    .upsert(input, { onConflict: 'user_id' });
  if (error) throw new Error(describeError(error));
}

export async function setVolunteerAvailability(
  volunteerId: string,
  availability: string,
): Promise<void> {
  const { error } = await supabase
    .from('volunteers')
    .update({ availability })
    .eq('volunteer_id', volunteerId);
  if (error) throw new Error(describeError(error));
}

/* ---------------------------------------------------------------- deliveries */

export async function listDeliveries(): Promise<Delivery[]> {
  const { data, error } = await supabase
    .from('deliveries')
    .select('*')
    .order('created_at', { ascending: false });
  return unwrap<Delivery[]>(data, error);
}

export async function createDelivery(input: {
  match_id: string;
  volunteer_id: string;
  pickup_address: string;
  delivery_address: string;
  pickup_date: string | null;
  notes: string | null;
}): Promise<Delivery> {
  const { data, error } = await supabase
    .from('deliveries')
    .insert({ ...input, status: 'assigned' })
    .select('*')
    .single();
  return unwrap<Delivery>(data, error);
}

export async function updateDeliveryStatus(
  deliveryId: string,
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled',
): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (status === 'delivered') patch.delivery_date = new Date().toISOString();
  const { error } = await supabase.from('deliveries').update(patch).eq('delivery_id', deliveryId);
  if (error) throw new Error(describeError(error));
}

/* ------------------------------------------------------------- notifications */

export async function listNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(60);
  return unwrap<Notification[]>(data, error);
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('notification_id', id);
  if (error) throw new Error(describeError(error));
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw new Error(describeError(error));
}

/* ------------------------------------------------------------------ analytics */

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const { data, error } = await supabase.rpc('platform_stats');
  if (error) throw new Error(describeError(error));
  const row = Array.isArray(data) ? data[0] : data;
  return (
    (row as PlatformStats) ?? {
      total_donations: 0,
      meals_distributed: 0,
      families_helped: 0,
      completed_deliveries: 0,
      donor_count: 0,
      beneficiary_count: 0,
      volunteer_count: 0,
      open_donations: 0,
      active_requests: 0,
    }
  );
}

export async function fetchDonationTrends(): Promise<TrendPoint[]> {
  const { data, error } = await supabase.rpc('donation_trends');
  return unwrap<TrendPoint[]>(data, error);
}

export async function fetchCategoryBreakdown(): Promise<CategoryPoint[]> {
  const { data, error } = await supabase.rpc('category_breakdown');
  return unwrap<CategoryPoint[]>(data, error);
}

export async function fetchUrgencyBreakdown(): Promise<UrgencyPoint[]> {
  const { data, error } = await supabase.rpc('urgency_breakdown');
  return unwrap<UrgencyPoint[]>(data, error);
}

/* -------------------------------------------------------------------- reviews */

export async function listReviewsFor(userId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .or(`reviewer_id.eq.${userId},reviewed_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  return unwrap<Review[]>(data, error);
}

export async function createReview(input: {
  reviewer_id: string;
  reviewed_id: string;
  rating: number;
  comment: string | null;
}): Promise<void> {
  const { error } = await supabase.from('reviews').insert(input);
  if (error) throw new Error(describeError(error));
}
