-- FoodBridge operates in Egypt. Remap seeded demo data from the original
-- Singapore districts to Egyptian governorates and rewrite placeholder addresses.

update public.profiles set city = case city
  when 'Tampines' then 'Cairo'
  when 'Bedok' then 'Giza'
  when 'Jurong East' then 'Qalyubia'
  when 'Woodlands' then 'Alexandria'
  when 'Clementi' then 'Dakahlia'
  when 'Singapore' then 'Cairo'
  else city
end;

update public.profiles set address = replace(replace(replace(replace(replace(replace(replace(replace(
  address,
  '12 Greenway Loop', '12 El Geish St, Heliopolis'),
  '48 Tampines Ave 5', '48 El Nasr Rd, Nasr City'),
  '9 Bedok North Rd', '9 El Haram St, Giza'),
  '210 Jurong East St 21', '210 Ahmed Orabi St, Shubra El Kheima'),
  'Bedok Reservoir Rd', 'Corniche El Maadi'),
  'Woodlands Ave 6', 'Sidi Gaber, Alexandria'),
  'Tampines St 32', 'Tahrir St, Dokki'),
  'Clementi Ave 4', 'El Gaish Rd, Mansoura');

update public.profiles set address = replace(address, 'Woodlands St 13', 'El Corniche Rd, Alexandria');

update public.donations set city = case city
  when 'Tampines' then 'Cairo'
  when 'Bedok' then 'Giza'
  when 'Jurong East' then 'Qalyubia'
  when 'Woodlands' then 'Alexandria'
  when 'Clementi' then 'Dakahlia'
  when 'Singapore' then 'Cairo'
  else city
end;

update public.donations set location = replace(replace(replace(
  location,
  'GreenLeaf Bistro, 48 Tampines Ave 5', 'GreenLeaf Bistro, 48 El Nasr Rd, Nasr City'),
  'Sunrise Bakery, 9 Bedok North Rd', 'Sunrise Bakery, 9 El Haram St, Giza'),
  'FreshMart, 210 Jurong East St 21', 'FreshMart, 210 Ahmed Orabi St, Shubra El Kheima');

update public.assistance_requests set city = case city
  when 'Tampines' then 'Cairo'
  when 'Bedok' then 'Giza'
  when 'Jurong East' then 'Qalyubia'
  when 'Woodlands' then 'Alexandria'
  when 'Clementi' then 'Dakahlia'
  when 'Singapore' then 'Cairo'
  else city
end;

-- Delivery rows carry baked address strings; rebuild them from the updated records.
update public.deliveries d
   set pickup_address = dn.location
  from public.matches m
  join public.donations dn on dn.donation_id = m.donation_id
 where m.match_id = d.match_id;

update public.deliveries d
   set delivery_address = p.address || ', ' || p.city
  from public.matches m
  join public.assistance_requests r on r.request_id = m.request_id
  join public.profiles p on p.user_id = r.beneficiary_id
 where m.match_id = d.match_id;
