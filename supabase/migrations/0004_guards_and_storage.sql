-- Privileged (service/seed) contexts have no auth.uid(); the guards only apply
-- to browser sessions. Storage bucket for donation photos is public-read.

create or replace function public.guard_profile_insert()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if new.role = 'admin' then
    new.role := 'beneficiary';
  end if;
  if new.status = 'active' and new.role = 'beneficiary' then
    new.status := 'pending';
  end if;
  return new;
end;
$$;

create or replace function public.guard_profile_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if not public.is_admin() then
    new.role := old.role;
    new.status := old.status;
    new.verified_at := old.verified_at;
    new.email := old.email;
  end if;
  return new;
end;
$$;

create or replace function public.guard_donation_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.status := old.status;
    new.donor_id := old.donor_id;
    new.donor_name := old.donor_name;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.guard_request_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
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

create or replace function public.guard_delivery_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.volunteer_id := old.volunteer_id;
    new.match_id := old.match_id;
    new.pickup_address := old.pickup_address;
    new.delivery_address := old.delivery_address;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- Donation photo bucket -------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'donation-images',
  'donation-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set public = true;

drop policy if exists "donation images public read" on storage.objects;
create policy "donation images public read"
  on storage.objects for select
  using (bucket_id = 'donation-images');

drop policy if exists "donation images owner upload" on storage.objects;
create policy "donation images owner upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'donation-images' and owner = auth.uid());

drop policy if exists "donation images owner update" on storage.objects;
create policy "donation images owner update"
  on storage.objects for update to authenticated
  using (bucket_id = 'donation-images' and owner = auth.uid())
  with check (bucket_id = 'donation-images' and owner = auth.uid());

drop policy if exists "donation images owner delete" on storage.objects;
create policy "donation images owner delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'donation-images' and owner = auth.uid());
