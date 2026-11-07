-- Public listing surface and aggregate reporting.
-- The view exposes only whitelisted, non-identifying columns and runs with the
-- caller's privileges so row level security still applies.

create or replace view public.available_donations
with (security_invoker = true) as
select
  d.donation_id,
  d.food_name,
  d.category,
  d.description,
  d.quantity,
  d.unit,
  d.expiry_date,
  d.image_url,
  d.location,
  d.city,
  d.donor_name,
  d.status,
  d.created_at
from public.donations d
where d.status = 'approved';

grant select on public.available_donations to anon, authenticated;

create or replace function public.platform_stats()
returns table (
  total_donations bigint,
  meals_distributed bigint,
  families_helped bigint,
  completed_deliveries bigint,
  donor_count bigint,
  beneficiary_count bigint,
  volunteer_count bigint,
  open_donations bigint,
  active_requests bigint
)
language sql stable security definer set search_path = public
as $$
  select
    (select count(*) from public.donations where status <> 'rejected'),
    (select coalesce(sum(m.matched_quantity), 0)::bigint
       from public.matches m where m.status = 'completed'),
    (select count(*) from public.assistance_requests where status = 'fulfilled'),
    (select count(*) from public.deliveries where status = 'delivered'),
    (select count(*) from public.profiles where role = 'donor' and status <> 'suspended'),
    (select count(*) from public.profiles where role = 'beneficiary' and status <> 'suspended'),
    (select count(*) from public.profiles where role = 'volunteer' and status <> 'suspended'),
    (select count(*) from public.donations where status = 'approved'),
    (select count(*) from public.assistance_requests where status in ('pending', 'approved'));
$$;

create or replace function public.donation_trends()
returns table (period date, donations bigint, meals bigint)
language sql stable security definer set search_path = public
as $$
  with span as (
    select generate_series(
      date_trunc('month', now()) - interval '5 months',
      date_trunc('month', now()),
      interval '1 month'
    ) as m
  )
  select
    s.m::date,
    (select count(*) from public.donations d
       where date_trunc('month', d.created_at) = s.m and d.status <> 'rejected'),
    (select coalesce(sum(m2.matched_quantity), 0)::bigint
       from public.matches m2
       where m2.status = 'completed' and date_trunc('month', m2.created_at) = s.m)
  from span s
  order by s.m;
$$;

create or replace function public.category_breakdown()
returns table (category text, donations bigint, meals bigint)
language sql stable security definer set search_path = public
as $$
  select
    c.cat,
    (select count(*) from public.donations d
       where d.category = c.cat and d.status <> 'rejected'),
    (select coalesce(sum(m.matched_quantity), 0)::bigint
       from public.matches m
       join public.donations d2 on d2.donation_id = m.donation_id
       where d2.category = c.cat and m.status = 'completed')
  from (values ('produce'), ('bakery'), ('prepared'), ('dairy'), ('pantry'), ('beverages')) as c(cat)
  order by 2 desc;
$$;

create or replace function public.urgency_breakdown()
returns table (urgency text, requests bigint)
language sql stable security definer set search_path = public
as $$
  select
    u.level,
    (select count(*) from public.assistance_requests r where r.urgency = u.level)
  from (values ('critical'), ('high'), ('normal'), ('low')) as u(level);
$$;

grant execute on function public.platform_stats() to anon, authenticated;
grant execute on function public.donation_trends() to anon, authenticated;
grant execute on function public.category_breakdown() to anon, authenticated;
grant execute on function public.urgency_breakdown() to authenticated;
