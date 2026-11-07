-- Demo accounts. Passwords are stored as bcrypt hashes by the auth service
-- (extensions.crypt / bf), never as plaintext, and never in public.profiles.
-- Shared demo password: FoodBridge123!

do $$
declare
  r record;
  v_uid uuid;
begin
  for r in
    select * from (values
      ('admin@foodbridge.demo',     'Amara Osei',    'admin',       'active',  'FoodBridge Foundation', 'Singapore',    '12 Greenway Loop', 2, 'Platform administrator.'),
      ('greenleaf@foodbridge.demo', 'Nadia Karim',   'donor',       'active',  'GreenLeaf Bistro',      'Tampines',     '48 Tampines Ave 5', 2, 'Restaurant partner since 2025.'),
      ('sunrise@foodbridge.demo',   'Marcus Teo',    'donor',       'active',  'Sunrise Bakery',        'Bedok',        '9 Bedok North Rd',  2, 'Bakery partner, daily surplus bread.'),
      ('freshmart@foodbridge.demo', 'Wei Sheng Lim', 'donor',       'active',  'FreshMart Supermarket', 'Jurong East',  '210 Jurong East St 21', 2, 'Supermarket partner, near-expiry produce.'),
      ('daniel@foodbridge.demo',    'Daniel Lim',    'volunteer',   'active',  null,                    'Bedok',        'Bedok Reservoir Rd', 1, 'Weekday evening deliveries.'),
      ('priya@foodbridge.demo',     'Priya Nair',    'volunteer',   'active',  null,                    'Woodlands',    'Woodlands Ave 6',   1, 'Weekend deliveries, has a car.'),
      ('fatima@foodbridge.demo',    'Fatima Rahman', 'beneficiary', 'active',  null,                    'Tampines',     'Tampines St 32',    5, 'Verified by phone interview.'),
      ('joseph@foodbridge.demo',    'Joseph Tan',    'beneficiary', 'active',  null,                    'Clementi',     'Clementi Ave 4',    4, 'Verified with community centre referral.'),
      ('mei@foodbridge.demo',       'Mei Ling',      'beneficiary', 'pending', null,                    'Woodlands',    'Woodlands St 13',   3, 'Awaiting document verification.')
    ) as t(email, full_name, role, status, organization, city, address, household, note)
  loop
    select id into v_uid from auth.users where email = r.email;

    if v_uid is null then
      v_uid := gen_random_uuid();
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
        confirmation_token, recovery_token, email_change_token_new, email_change
      ) values (
        '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
        r.email,
        extensions.crypt('FoodBridge123!', extensions.gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', r.full_name, 'role', r.role),
        '', '', '', ''
      );

      insert into auth.identities (
        id, user_id, identity_data, provider, provider_id,
        last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), v_uid,
        jsonb_build_object('sub', v_uid::text, 'email', r.email, 'email_verified', true),
        'email', v_uid::text, now(), now(), now()
      );
    end if;

    insert into public.profiles (
      user_id, full_name, email, role, status, organization, city, address,
      household_size, verification_note, verified_at
    ) values (
      v_uid, r.full_name, r.email, r.role, r.status, r.organization, r.city, r.address,
      r.household, r.note,
      case when r.status = 'active' then now() - interval '20 days' else null end
    )
    on conflict (user_id) do update
      set full_name = excluded.full_name,
          role = excluded.role,
          status = excluded.status,
          organization = excluded.organization;
  end loop;
end;
$$;
