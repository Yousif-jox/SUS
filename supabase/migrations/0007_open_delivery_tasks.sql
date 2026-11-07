-- Unassigned delivery tasks that any active volunteer may accept.

create or replace function public.is_volunteer()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.volunteers v
    where v.user_id = auth.uid() and v.active = true
  );
$$;

create or replace function public.my_volunteer_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select v.volunteer_id from public.volunteers v where v.user_id = auth.uid();
$$;

grant execute on function public.is_volunteer() to authenticated;
grant execute on function public.my_volunteer_id() to authenticated;

alter table public.deliveries alter column volunteer_id drop not null;

drop policy if exists deliveries_select on public.deliveries;
create policy deliveries_select on public.deliveries
  for select to authenticated
  using (
    public.is_admin()
    or public.can_view_delivery(delivery_id)
    or (volunteer_id is null and status = 'assigned' and public.is_volunteer())
  );

drop policy if exists deliveries_update on public.deliveries;
create policy deliveries_update on public.deliveries
  for update to authenticated
  using (
    public.is_admin()
    or (volunteer_id is null and status = 'assigned' and public.is_volunteer())
    or volunteer_id = public.my_volunteer_id()
  )
  with check (
    public.is_admin()
    or volunteer_id = public.my_volunteer_id()
  );

create or replace function public.guard_delivery_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if old.volunteer_id is null then
      new.volunteer_id := public.my_volunteer_id();
    else
      new.volunteer_id := old.volunteer_id;
    end if;
    new.match_id := old.match_id;
    new.pickup_address := old.pickup_address;
    new.delivery_address := old.delivery_address;
    if new.volunteer_id is distinct from old.volunteer_id then
      new.status := 'assigned';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- One open task so the volunteer dashboard has a real assignment to accept.
insert into public.deliveries (
  match_id, volunteer_id, pickup_address, delivery_address,
  pickup_date, delivery_date, status, notes, created_at, updated_at
)
select
  m.match_id,
  null,
  d.location,
  coalesce(bp.address, 'Community centre collection point') || ', ' || coalesce(bp.city, 'Singapore'),
  now() + interval '1 day',
  null,
  'assigned',
  'Open task — any available volunteer in the area can accept it.',
  now() - interval '2 hours',
  now() - interval '2 hours'
from public.matches m
join public.donations d on d.donation_id = m.donation_id
join public.assistance_requests r on r.request_id = m.request_id
join public.profiles bp on bp.user_id = r.beneficiary_id
where d.food_name = 'Family Produce Mix'
  and m.status = 'confirmed'
  and not exists (select 1 from public.deliveries dv where dv.match_id = m.match_id);
