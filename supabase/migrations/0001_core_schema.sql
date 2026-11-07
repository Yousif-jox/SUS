-- FoodBridge core relational schema
-- Identity lives in Supabase Auth (bcrypt password hashes in the auth service).
-- public.profiles mirrors each auth identity; no plaintext or hashed password
-- is ever stored in, or readable from, this schema.

create table if not exists public.profiles (
  user_id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  role text not null default 'beneficiary'
    check (role in ('admin', 'donor', 'beneficiary', 'volunteer')),
  status text not null default 'pending'
    check (status in ('active', 'pending', 'suspended')),
  organization text,
  address text,
  city text,
  household_size integer
    check (household_size is null or household_size between 1 and 30),
  verification_note text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_email_key
  on public.profiles (lower(email));

create index if not exists profiles_role_idx on public.profiles (role, status);

create table if not exists public.donations (
  donation_id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.profiles (user_id) on delete cascade,
  donor_name text not null,
  food_name text not null,
  category text not null
    check (category in ('produce', 'bakery', 'prepared', 'dairy', 'pantry', 'beverages')),
  description text,
  quantity numeric(10, 2) not null check (quantity > 0),
  unit text not null default 'servings',
  expiry_date date not null,
  image_url text,
  location text not null,
  city text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'matched', 'completed', 'expired')),
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists donations_donor_idx on public.donations (donor_id, created_at desc);
create index if not exists donations_status_idx on public.donations (status, created_at desc);
create index if not exists donations_city_idx on public.donations (city);

create table if not exists public.assistance_requests (
  request_id uuid primary key default gen_random_uuid(),
  beneficiary_id uuid not null references public.profiles (user_id) on delete cascade,
  beneficiary_name text not null,
  food_type text not null
    check (food_type in ('produce', 'bakery', 'prepared', 'dairy', 'pantry', 'beverages', 'any')),
  quantity numeric(10, 2) not null check (quantity > 0),
  family_size integer not null check (family_size between 1 and 30),
  urgency text not null default 'normal'
    check (urgency in ('low', 'normal', 'high', 'critical')),
  city text not null,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'matched', 'fulfilled', 'rejected', 'cancelled')),
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists requests_beneficiary_idx
  on public.assistance_requests (beneficiary_id, created_at desc);
create index if not exists requests_status_idx
  on public.assistance_requests (status, urgency, created_at desc);

create table if not exists public.matches (
  match_id uuid primary key default gen_random_uuid(),
  donation_id uuid not null references public.donations (donation_id) on delete cascade,
  request_id uuid not null references public.assistance_requests (request_id) on delete cascade,
  matched_quantity numeric(10, 2) not null check (matched_quantity > 0),
  score numeric(6, 2) not null default 0,
  note text,
  status text not null default 'proposed'
    check (status in ('proposed', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  unique (donation_id, request_id)
);

create index if not exists matches_donation_idx on public.matches (donation_id);
create index if not exists matches_request_idx on public.matches (request_id);

create table if not exists public.volunteers (
  volunteer_id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (user_id) on delete cascade,
  availability text not null default 'available'
    check (availability in ('available', 'busy', 'unavailable')),
  area text not null,
  vehicle text not null default 'car'
    check (vehicle in ('car', 'motorbike', 'bicycle', 'on_foot')),
  capacity integer not null default 20 check (capacity > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.deliveries (
  delivery_id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references public.matches (match_id) on delete cascade,
  volunteer_id uuid not null references public.volunteers (volunteer_id) on delete restrict,
  pickup_address text not null,
  delivery_address text not null,
  pickup_date timestamptz,
  delivery_date timestamptz,
  status text not null default 'assigned'
    check (status in ('assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deliveries_volunteer_idx on public.deliveries (volunteer_id, status);
create index if not exists deliveries_status_idx on public.deliveries (status, created_at desc);

create table if not exists public.notifications (
  notification_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  message text not null,
  kind text not null default 'system',
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, is_read, created_at desc);

create table if not exists public.reviews (
  review_id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.profiles (user_id) on delete cascade,
  reviewed_id uuid not null references public.profiles (user_id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (reviewer_id, reviewed_id)
);

-- ---------------------------------------------------------------------------
-- Helper functions (security definer so policies never recurse into RLS)
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin' and p.status = 'active'
  );
$$;

create or replace function public.can_view_donation(p_donation uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select
    exists (
      select 1 from public.donations d
      where d.donation_id = p_donation and d.donor_id = auth.uid()
    )
    or exists (
      select 1
      from public.matches m
      join public.assistance_requests r on r.request_id = m.request_id
      where m.donation_id = p_donation and r.beneficiary_id = auth.uid()
    )
    or exists (
      select 1
      from public.deliveries dv
      join public.matches m on m.match_id = dv.match_id
      join public.volunteers v on v.volunteer_id = dv.volunteer_id
      where m.donation_id = p_donation and v.user_id = auth.uid()
    );
$$;

create or replace function public.can_view_request(p_request uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select
    exists (
      select 1 from public.assistance_requests r
      where r.request_id = p_request and r.beneficiary_id = auth.uid()
    )
    or exists (
      select 1
      from public.matches m
      join public.donations d on d.donation_id = m.donation_id
      where m.request_id = p_request and d.donor_id = auth.uid()
    )
    or exists (
      select 1
      from public.matches m
      join public.deliveries dv on dv.match_id = m.match_id
      join public.volunteers v on v.volunteer_id = dv.volunteer_id
      where m.request_id = p_request and v.user_id = auth.uid()
    );
$$;

create or replace function public.can_view_match(p_match uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.matches m
    join public.donations d on d.donation_id = m.donation_id
    join public.assistance_requests r on r.request_id = m.request_id
    left join public.deliveries dv on dv.match_id = m.match_id
    left join public.volunteers v on v.volunteer_id = dv.volunteer_id
    where m.match_id = p_match
      and (
        d.donor_id = auth.uid()
        or r.beneficiary_id = auth.uid()
        or v.user_id = auth.uid()
      )
  );
$$;

create or replace function public.can_view_delivery(p_delivery uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.deliveries dv
    join public.matches m on m.match_id = dv.match_id
    join public.donations d on d.donation_id = m.donation_id
    join public.assistance_requests r on r.request_id = m.request_id
    join public.volunteers v on v.volunteer_id = dv.volunteer_id
    where dv.delivery_id = p_delivery
      and (
        d.donor_id = auth.uid()
        or r.beneficiary_id = auth.uid()
        or v.user_id = auth.uid()
      )
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Donors keep control of their own listing but cannot approve themselves.
create or replace function public.guard_donation_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    new.status := old.status;
    new.donor_id := old.donor_id;
    new.donor_name := old.donor_name;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- Beneficiaries can cancel their own request but cannot approve it.
create or replace function public.guard_request_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.status = 'cancelled' and old.status in ('pending', 'approved') then
      new.status := 'cancelled';
    else
      new.status := old.status;
    end if;
    new.beneficiary_id := old.beneficiary_id;
    new.beneficiary_name := old.beneficiary_name;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- Profile owners can edit their details but never their role or verification.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.status := old.status;
    new.verified_at := old.verified_at;
    new.email := old.email;
  end if;
  return new;
end;
$$;

create or replace function public.guard_profile_insert()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.role = 'admin' then
    new.role := 'beneficiary';
  end if;
  if new.status = 'active' and new.role = 'beneficiary' then
    new.status := 'pending';
  end if;
  return new;
end;
$$;

-- Volunteers may only progress the delivery status of their own assignment.
create or replace function public.guard_delivery_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    new.volunteer_id := old.volunteer_id;
    new.match_id := old.match_id;
    new.pickup_address := old.pickup_address;
    new.delivery_address := old.delivery_address;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists donations_touch on public.donations;
create trigger donations_touch
  before update on public.donations
  for each row execute function public.guard_donation_update();

drop trigger if exists requests_touch on public.assistance_requests;
create trigger requests_touch
  before update on public.assistance_requests
  for each row execute function public.guard_request_update();

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.guard_profile_update();

drop trigger if exists profiles_guard_insert on public.profiles;
create trigger profiles_guard_insert
  before insert on public.profiles
  for each row execute function public.guard_profile_insert();

drop trigger if exists deliveries_touch on public.deliveries;
create trigger deliveries_touch
  before update on public.deliveries
  for each row execute function public.guard_delivery_update();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.donations enable row level security;
alter table public.assistance_requests enable row level security;
alter table public.matches enable row level security;
alter table public.volunteers enable row level security;
alter table public.deliveries enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (user_id = auth.uid() and role <> 'admin');

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- donations
drop policy if exists donations_select_anon on public.donations;
create policy donations_select_anon on public.donations
  for select to anon
  using (status = 'approved');

drop policy if exists donations_select on public.donations;
create policy donations_select on public.donations
  for select to authenticated
  using (status = 'approved' or public.is_admin() or public.can_view_donation(donation_id));

drop policy if exists donations_insert on public.donations;
create policy donations_insert on public.donations
  for insert to authenticated
  with check (donor_id = auth.uid());

drop policy if exists donations_update on public.donations;
create policy donations_update on public.donations
  for update to authenticated
  using (donor_id = auth.uid() or public.is_admin())
  with check (donor_id = auth.uid() or public.is_admin());

drop policy if exists donations_delete on public.donations;
create policy donations_delete on public.donations
  for delete to authenticated
  using (donor_id = auth.uid() or public.is_admin());

-- assistance requests
drop policy if exists requests_select on public.assistance_requests;
create policy requests_select on public.assistance_requests
  for select to authenticated
  using (beneficiary_id = auth.uid() or public.is_admin() or public.can_view_request(request_id));

drop policy if exists requests_insert on public.assistance_requests;
create policy requests_insert on public.assistance_requests
  for insert to authenticated
  with check (beneficiary_id = auth.uid());

drop policy if exists requests_update on public.assistance_requests;
create policy requests_update on public.assistance_requests
  for update to authenticated
  using (beneficiary_id = auth.uid() or public.is_admin())
  with check (beneficiary_id = auth.uid() or public.is_admin());

drop policy if exists requests_delete on public.assistance_requests;
create policy requests_delete on public.assistance_requests
  for delete to authenticated
  using (beneficiary_id = auth.uid() or public.is_admin());

-- matches
drop policy if exists matches_select on public.matches;
create policy matches_select on public.matches
  for select to authenticated
  using (public.is_admin() or public.can_view_match(match_id));

drop policy if exists matches_write on public.matches;
create policy matches_write on public.matches
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists matches_update on public.matches;
create policy matches_update on public.matches
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists matches_delete on public.matches;
create policy matches_delete on public.matches
  for delete to authenticated
  using (public.is_admin());

-- volunteers
drop policy if exists volunteers_select on public.volunteers;
create policy volunteers_select on public.volunteers
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists volunteers_insert on public.volunteers;
create policy volunteers_insert on public.volunteers
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists volunteers_update on public.volunteers;
create policy volunteers_update on public.volunteers
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- deliveries
drop policy if exists deliveries_select on public.deliveries;
create policy deliveries_select on public.deliveries
  for select to authenticated
  using (public.is_admin() or public.can_view_delivery(delivery_id));

drop policy if exists deliveries_insert on public.deliveries;
create policy deliveries_insert on public.deliveries
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists deliveries_update on public.deliveries;
create policy deliveries_update on public.deliveries
  for update to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.volunteers v
      where v.volunteer_id = deliveries.volunteer_id and v.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.volunteers v
      where v.volunteer_id = deliveries.volunteer_id and v.user_id = auth.uid()
    )
  );

drop policy if exists deliveries_delete on public.deliveries;
create policy deliveries_delete on public.deliveries
  for delete to authenticated
  using (public.is_admin());

-- notifications
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- reviews
drop policy if exists reviews_select on public.reviews;
create policy reviews_select on public.reviews
  for select to authenticated
  using (reviewer_id = auth.uid() or reviewed_id = auth.uid() or public.is_admin());

drop policy if exists reviews_insert on public.reviews;
create policy reviews_insert on public.reviews
  for insert to authenticated
  with check (reviewer_id = auth.uid() and reviewer_id <> reviewed_id);

drop policy if exists reviews_update on public.reviews;
create policy reviews_update on public.reviews
  for update to authenticated
  using (reviewer_id = auth.uid())
  with check (reviewer_id = auth.uid());

drop policy if exists reviews_delete on public.reviews;
create policy reviews_delete on public.reviews
  for delete to authenticated
  using (reviewer_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Privileges (this tenant applies no default table privileges)
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select (
  donation_id, food_name, category, description, quantity, unit,
  expiry_date, image_url, location, city, donor_name, status, created_at
) on public.donations to anon;

grant select, insert, update, delete on public.donations to authenticated;
grant select, insert, update, delete on public.assistance_requests to authenticated;
grant select, insert, update, delete on public.matches to authenticated;
grant select, insert, update, delete on public.volunteers to authenticated;
grant select, insert, update, delete on public.deliveries to authenticated;
grant select, update on public.notifications to authenticated;
grant select, insert, update, delete on public.reviews to authenticated;
grant select, insert, update on public.profiles to authenticated;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.can_view_donation(uuid) to authenticated;
grant execute on function public.can_view_request(uuid) to authenticated;
grant execute on function public.can_view_match(uuid) to authenticated;
grant execute on function public.can_view_delivery(uuid) to authenticated;
