-- In-app notifications and delivery state automation.
-- Notifications are written only by security definer triggers; the browser can
-- read its own rows and mark them read.

create or replace function public.notify(
  p_user uuid,
  p_message text,
  p_kind text,
  p_link text
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_user is null then
    return;
  end if;
  insert into public.notifications (user_id, message, kind, link)
  values (p_user, p_message, p_kind, p_link);
end;
$$;

revoke all on function public.notify(uuid, text, text, text) from public;

create or replace function public.tg_donation_status()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'approved' then
      perform public.notify(
        new.donor_id,
        'Your donation "' || new.food_name || '" was approved and is now visible to beneficiaries.',
        'donation', '/donor/donations'
      );
    elsif new.status = 'rejected' then
      perform public.notify(
        new.donor_id,
        'Your donation "' || new.food_name || '" was rejected.'
          || coalesce(' Reason: ' || new.review_note, ''),
        'donation', '/donor/donations'
      );
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.tg_request_status()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'approved' then
      perform public.notify(
        new.beneficiary_id,
        'Your assistance request was approved. We are now matching it with available food.',
        'request', '/beneficiary/requests'
      );
    elsif new.status = 'rejected' then
      perform public.notify(
        new.beneficiary_id,
        'Your assistance request was not approved.'
          || coalesce(' Reason: ' || new.review_note, ''),
        'request', '/beneficiary/requests'
      );
    elsif new.status = 'fulfilled' then
      perform public.notify(
        new.beneficiary_id,
        'Your assistance request has been fulfilled. Food has been delivered.',
        'request', '/beneficiary/requests'
      );
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.tg_match_created()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_food text;
  v_donor uuid;
begin
  select d.food_name, d.donor_id into v_food, v_donor
  from public.donations d where d.donation_id = new.donation_id;

  perform public.notify(
    (select r.beneficiary_id from public.assistance_requests r where r.request_id = new.request_id),
    'A matching donation was found for your request: ' || coalesce(v_food, 'food donation') || '.',
    'match', '/beneficiary/requests'
  );

  perform public.notify(
    v_donor,
    'Your donation has been matched with a family in need and is being scheduled for pickup.',
    'match', '/donor/requests'
  );

  return new;
end;
$$;

create or replace function public.tg_delivery_created()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid;
begin
  select v.user_id into v_user
  from public.volunteers v where v.volunteer_id = new.volunteer_id;

  perform public.notify(
    v_user,
    'You have been assigned a new delivery task. Pickup from ' || new.pickup_address || '.',
    'delivery', '/volunteer/tasks'
  );

  return new;
end;
$$;

create or replace function public.tg_delivery_delivered()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_match uuid;
  v_donation uuid;
  v_request uuid;
  v_donor uuid;
  v_beneficiary uuid;
  v_food text;
  v_volunteer_user uuid;
begin
  if new.status = 'delivered' and old.status is distinct from 'delivered' then
    v_match := new.match_id;

    update public.matches
       set status = 'completed'
     where match_id = v_match;

    select m.donation_id, m.request_id into v_donation, v_request
    from public.matches m where m.match_id = v_match;

    update public.donations
       set status = 'completed'
     where donation_id = v_donation;

    update public.assistance_requests
       set status = 'fulfilled'
     where request_id = v_request;

    select d.donor_id, d.food_name into v_donor, v_food
    from public.donations d where d.donation_id = v_donation;

    select r.beneficiary_id into v_beneficiary
    from public.assistance_requests r where r.request_id = v_request;

    select v.user_id into v_volunteer_user
    from public.volunteers v where v.volunteer_id = new.volunteer_id;

    perform public.notify(
      v_donor,
      'A delivery of "' || coalesce(v_food, 'your donation') || '" was completed. Thank you for reducing food waste.',
      'delivery', '/donor/donations'
    );

    perform public.notify(
      v_beneficiary,
      'Your food delivery has arrived. Your request is now complete.',
      'delivery', '/beneficiary/requests'
    );

    perform public.notify(
      v_volunteer_user,
      'Delivery completed and logged. Thank you for volunteering.',
      'delivery', '/volunteer/history'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists donations_notify on public.donations;
create trigger donations_notify
  after update on public.donations
  for each row execute function public.tg_donation_status();

drop trigger if exists requests_notify on public.assistance_requests;
create trigger requests_notify
  after update on public.assistance_requests
  for each row execute function public.tg_request_status();

drop trigger if exists matches_notify on public.matches;
create trigger matches_notify
  after insert on public.matches
  for each row execute function public.tg_match_created();

drop trigger if exists deliveries_notify on public.deliveries;
create trigger deliveries_notify
  after insert on public.deliveries
  for each row execute function public.tg_delivery_created();

drop trigger if exists deliveries_complete on public.deliveries;
create trigger deliveries_complete
  after update on public.deliveries
  for each row execute function public.tg_delivery_delivered();
