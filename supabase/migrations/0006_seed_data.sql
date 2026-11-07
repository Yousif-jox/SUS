-- Realistic demo dataset spanning six months so trends and analytics are real.

insert into public.donations (
  donor_id, donor_name, food_name, category, description, quantity, unit,
  expiry_date, image_url, location, city, status, review_note, created_at, updated_at
)
select
  p.user_id, p.organization, v.food_name, v.category, v.description, v.quantity, 'servings',
  (now() + (v.expiry_days || ' days')::interval)::date,
  v.image, v.location, p.city, v.status, v.review_note,
  now() - (v.age_days || ' days')::interval,
  now() - (v.age_days || ' days')::interval
from public.profiles p
join (values
  ('greenleaf@foodbridge.demo', 'Surplus Roasted Vegetable Trays', 'prepared', 'Trays of roasted seasonal vegetables and grains from tonight''s service. Chilled and ready to reheat.', 40, 2, '/assets/images/prepared-meals.jpg', 'GreenLeaf Bistro, 48 Tampines Ave 5', 'approved', null::text, 1),
  ('greenleaf@foodbridge.demo', 'Fresh Salad Boxes', 'produce', 'Individual salad boxes with mixed leaves, cherry tomatoes and cucumber.', 25, 1, '/assets/images/produce-crate.jpg', 'GreenLeaf Bistro, 48 Tampines Ave 5', 'approved', null, 2),
  ('greenleaf@foodbridge.demo', 'Chicken Rice Meal Packs', 'prepared', 'Packed chicken rice meals prepared for a cancelled event.', 45, 2, '/assets/images/prepared-meals.jpg', 'GreenLeaf Bistro, 48 Tampines Ave 5', 'approved', null, 0),
  ('sunrise@foodbridge.demo', 'Artisan Bread Assortment', 'bakery', 'Sourdough loaves, baguettes and soft rolls baked this morning.', 60, 2, '/assets/images/bakery-bread.jpg', 'Sunrise Bakery, 9 Bedok North Rd', 'approved', null, 1),
  ('sunrise@foodbridge.demo', 'Morning Pastry Boxes', 'bakery', 'Croissants and danish pastries from the breakfast run.', 30, 1, '/assets/images/bakery-bread.jpg', 'Sunrise Bakery, 9 Bedok North Rd', 'approved', null, 2),
  ('freshmart@foodbridge.demo', 'Near-Expiry Dairy Pack', 'dairy', 'Milk, yoghurt and eggs reaching best-before date within the week.', 35, 3, '/assets/images/dairy-eggs.jpg', 'FreshMart, 210 Jurong East St 21', 'approved', null, 1),
  ('freshmart@foodbridge.demo', 'Pantry Staples Bundle', 'pantry', 'Rice, lentils, pasta and cooking oil from surplus stock.', 50, 10, '/assets/images/pantry-goods.jpg', 'FreshMart, 210 Jurong East St 21', 'approved', null, 3),
  ('freshmart@foodbridge.demo', 'Seasonal Fruit Boxes', 'produce', 'Mixed fruit boxes with bananas, oranges and apples.', 28, 4, '/assets/images/produce-crate.jpg', 'FreshMart, 210 Jurong East St 21', 'approved', null, 2),
  ('sunrise@foodbridge.demo', 'Wholemeal Sandwich Trays', 'prepared', 'Freshly made wholemeal sandwiches, individually wrapped.', 22, 1, '/assets/images/prepared-meals.jpg', 'Sunrise Bakery, 9 Bedok North Rd', 'approved', null, 1),
  ('greenleaf@foodbridge.demo', 'Soup of the Day Batch', 'prepared', 'Large batch of minestrone soup, sealed and refrigerated.', 30, 2, '/assets/images/prepared-meals.jpg', 'GreenLeaf Bistro, 48 Tampines Ave 5', 'pending', null, 0),
  ('sunrise@foodbridge.demo', 'Cinnamon Roll Trays', 'bakery', 'Two trays of cinnamon rolls from the weekend bake.', 40, 2, '/assets/images/bakery-bread.jpg', 'Sunrise Bakery, 9 Bedok North Rd', 'pending', null, 1),
  ('freshmart@foodbridge.demo', 'Frozen Vegetable Packs', 'produce', 'Frozen mixed vegetables, still within cold-chain tolerance.', 60, 14, '/assets/images/produce-crate.jpg', 'FreshMart, 210 Jurong East St 21', 'pending', null, 0),
  ('sunrise@foodbridge.demo', 'Rice Porridge Packs', 'prepared', 'Congee packs prepared for a community breakfast that was rescheduled.', 35, 2, '/assets/images/prepared-meals.jpg', 'Sunrise Bakery, 9 Bedok North Rd', 'pending', null, 2),
  ('freshmart@foodbridge.demo', 'Damaged Canned Goods', 'pantry', 'Cans with dented seams found during stock rotation.', 10, 5, '/assets/images/pantry-goods.jpg', 'FreshMart, 210 Jurong East St 21', 'rejected', 'Packaging damaged; not safe for distribution.', 4),
  ('greenleaf@foodbridge.demo', 'Weekly Meal Packs', 'prepared', 'Cooked meal packs from the weekly corporate lunch contract.', 50, 0, '/assets/images/prepared-meals.jpg', 'GreenLeaf Bistro, 48 Tampines Ave 5', 'completed', null, 120),
  ('sunrise@foodbridge.demo', 'Bread and Pastry Surplus', 'bakery', 'End-of-day bread and pastry surplus.', 80, 0, '/assets/images/bakery-bread.jpg', 'Sunrise Bakery, 9 Bedok North Rd', 'completed', null, 100),
  ('freshmart@foodbridge.demo', 'Produce Rescue Boxes', 'produce', 'Cosmetically imperfect but fresh vegetables.', 65, 0, '/assets/images/produce-crate.jpg', 'FreshMart, 210 Jurong East St 21', 'completed', null, 85),
  ('sunrise@foodbridge.demo', 'Bakery Closing Stock', 'bakery', 'Breads and buns remaining at closing time.', 55, 0, '/assets/images/bakery-bread.jpg', 'Sunrise Bakery, 9 Bedok North Rd', 'completed', null, 60),
  ('freshmart@foodbridge.demo', 'Dairy Clearance', 'dairy', 'Yoghurt and milk close to best-before date.', 30, 0, '/assets/images/dairy-eggs.jpg', 'FreshMart, 210 Jurong East St 21', 'completed', null, 45),
  ('freshmart@foodbridge.demo', 'Pantry Overstock', 'pantry', 'Over-ordered rice and lentil stock.', 45, 0, '/assets/images/pantry-goods.jpg', 'FreshMart, 210 Jurong East St 21', 'completed', null, 15),
  ('greenleaf@foodbridge.demo', 'Lunch Buffet Leftovers', 'prepared', 'Unserved buffet trays, chilled immediately after service.', 60, -3, '/assets/images/prepared-meals.jpg', 'GreenLeaf Bistro, 48 Tampines Ave 5', 'expired', null, 35),
  ('sunrise@foodbridge.demo', 'Bread Loaves', 'bakery', 'Unsold sandwich loaves from last month.', 70, -8, '/assets/images/bakery-bread.jpg', 'Sunrise Bakery, 9 Bedok North Rd', 'expired', null, 25),
  ('greenleaf@foodbridge.demo', 'Evening Meal Boxes', 'prepared', 'Balanced dinner boxes with rice, protein and vegetables.', 38, 4, '/assets/images/prepared-meals.jpg', 'GreenLeaf Bistro, 48 Tampines Ave 5', 'approved', null, 3),
  ('freshmart@foodbridge.demo', 'Family Produce Mix', 'produce', 'Mixed vegetable crates suitable for a family of four.', 40, 3, '/assets/images/produce-crate.jpg', 'FreshMart, 210 Jurong East St 21', 'matched', null, 2)
) as v(email, food_name, category, description, quantity, expiry_days, image, location, status, review_note, age_days)
  on p.email = v.email;

insert into public.assistance_requests (
  beneficiary_id, beneficiary_name, food_type, quantity, family_size, urgency,
  city, notes, status, review_note, created_at, updated_at
)
select
  p.user_id, p.full_name, v.food_type, v.quantity, v.family_size, v.urgency,
  p.city, v.notes, v.status, v.review_note,
  now() - (v.age_days || ' days')::interval,
  now() - (v.age_days || ' days')::interval
from public.profiles p
join (values
  ('fatima@foodbridge.demo', 'any', 20::numeric, 5, 'high', 'Household of five with no income this month; children aged 4 and 9.', 'pending', null::text, 1),
  ('fatima@foodbridge.demo', 'produce', 15::numeric, 5, 'normal', 'Weekly produce support.', 'fulfilled', null, 60),
  ('fatima@foodbridge.demo', 'prepared', 20::numeric, 5, 'high', 'Cooked meals for the children.', 'fulfilled', null, 30),
  ('fatima@foodbridge.demo', 'bakery', 30::numeric, 5, 'normal', 'Bread and breakfast items.', 'fulfilled', null, 100),
  ('fatima@foodbridge.demo', 'pantry', 18::numeric, 5, 'normal', 'Pantry restock.', 'fulfilled', null, 70),
  ('joseph@foodbridge.demo', 'pantry', 12::numeric, 4, 'normal', 'Pantry items for elderly parents living with us.', 'pending', null, 2),
  ('joseph@foodbridge.demo', 'prepared', 15::numeric, 4, 'high', 'Prepared meals while recovering from surgery.', 'approved', null, 3),
  ('joseph@foodbridge.demo', 'bakery', 25::numeric, 4, 'normal', 'Bakery surplus collection.', 'fulfilled', null, 60),
  ('joseph@foodbridge.demo', 'dairy', 12::numeric, 4, 'low', 'Dairy for two children.', 'fulfilled', null, 45),
  ('joseph@foodbridge.demo', 'produce', 18::numeric, 4, 'high', 'Fresh vegetables for the week.', 'approved', null, 4),
  ('mei@foodbridge.demo', 'dairy', 8::numeric, 3, 'critical', 'Urgent: infant formula and dairy after losing shift work.', 'pending', null, 0),
  ('mei@foodbridge.demo', 'prepared', 10::numeric, 3, 'high', 'Prepared meals after hospital stay.', 'rejected', 'Address could not be verified. Please reapply after verification.', 20)
) as v(email, food_type, quantity, family_size, urgency, notes, status, review_note, age_days)
  on p.email = v.email;

-- Matches: six completed, two confirmed and awaiting delivery ---------------

insert into public.matches (donation_id, request_id, matched_quantity, score, note, status, created_at)
select d.donation_id, r.request_id, v.qty, v.score, v.note, v.status,
       now() - (v.age_days || ' days')::interval
from (values
  ('Weekly Meal Packs',            'Cooked meals for the children.',         20::numeric, 94::numeric, 'Same city, prepared meals, urgent request.',      'completed', 30),
  ('Bread and Pastry Surplus',     'Bread and breakfast items.',            30::numeric, 88::numeric, 'Bakery match with sufficient quantity.',           'completed', 100),
  ('Produce Rescue Boxes',         'Weekly produce support.',               15::numeric, 91::numeric, 'Produce category, expires soon.',                  'completed', 85),
  ('Bakery Closing Stock',         'Bakery surplus collection.',            25::numeric, 86::numeric, 'Exact category match, same district.',              'completed', 60),
  ('Dairy Clearance',              'Dairy for two children.',               12::numeric, 82::numeric, 'Dairy category, short shelf life prioritised.',     'completed', 45),
  ('Pantry Overstock',             'Pantry restock.',                       18::numeric, 79::numeric, 'Pantry staples, long shelf life.',                  'completed', 15),
  ('Evening Meal Boxes',           'Prepared meals while recovering from surgery.', 15::numeric, 84::numeric, 'Prepared meals, high urgency request.',     'confirmed', 3),
  ('Family Produce Mix',           'Fresh vegetables for the week.',        18::numeric, 87::numeric, 'Produce category, urgent request, nearby.',         'confirmed', 2)
) as v(food_name, request_note, qty, score, note, status, age_days)
join public.donations d on d.food_name = v.food_name
join public.assistance_requests r on r.notes = v.request_note;

-- Deliveries: completed history plus two live tasks -------------------------

insert into public.volunteers (user_id, availability, area, vehicle, capacity)
select p.user_id, v.availability, v.area, v.vehicle, v.capacity
from public.profiles p
join (values
  ('daniel@foodbridge.demo', 'available', 'Bedok / Tampines', 'motorbike', 25),
  ('priya@foodbridge.demo',  'busy',      'Woodlands / Sembawang', 'car', 60)
) as v(email, availability, area, vehicle, capacity) on p.email = v.email;

insert into public.deliveries (
  match_id, volunteer_id, pickup_address, delivery_address,
  pickup_date, delivery_date, status, notes, created_at, updated_at
)
select
  m.match_id,
  vol.volunteer_id,
  d.location,
  coalesce(bp.address, 'Community centre collection point') || ', ' || coalesce(bp.city, 'Singapore'),
  now() - (v.pickup_age || ' days')::interval,
  case when v.status = 'delivered' then now() - (v.pickup_age || ' days')::interval + interval '3 hours' else null end,
  v.status, v.notes,
  now() - (v.pickup_age || ' days')::interval,
  now() - (v.pickup_age || ' days')::interval
from (values
  ('Weekly Meal Packs',      'greenleaf@foodbridge.demo', 'daniel@foodbridge.demo', 'delivered',  29, 'Delivered to the family at the void deck.'),
  ('Bread and Pastry Surplus', 'greenleaf@foodbridge.demo', 'priya@foodbridge.demo', 'delivered',  99, 'Two boxes handed over.'),
  ('Produce Rescue Boxes',   'greenleaf@foodbridge.demo', 'daniel@foodbridge.demo', 'delivered',  84, 'Delivered with a neighbour present.'),
  ('Bakery Closing Stock',   'greenleaf@foodbridge.demo', 'priya@foodbridge.demo',  'delivered',  59, 'Delivered early morning.'),
  ('Dairy Clearance',        'greenleaf@foodbridge.demo', 'daniel@foodbridge.demo', 'delivered',  44, 'Cold bag used for transport.'),
  ('Pantry Overstock',       'greenleaf@foodbridge.demo', 'priya@foodbridge.demo',  'delivered',  14, 'Left with the block representative.'),
  ('Evening Meal Boxes',     'greenleaf@foodbridge.demo', 'daniel@foodbridge.demo', 'assigned',    0, 'Pickup after 6pm, call on arrival.'),
  ('Family Produce Mix',     'greenleaf@foodbridge.demo', 'priya@foodbridge.demo',  'in_transit',  0, 'Collected from the supermarket loading bay.')
) as v(food_name, donor_email, volunteer_email, status, pickup_age, notes)
join public.donations d on d.food_name = v.food_name
join public.matches m on m.donation_id = d.donation_id
join public.volunteers vol on vol.user_id = (select user_id from public.profiles where email = v.volunteer_email)
join public.assistance_requests r on r.request_id = m.request_id
join public.profiles bp on bp.user_id = r.beneficiary_id;

-- Reviews ----------------------------------------------------------------

insert into public.reviews (reviewer_id, reviewed_id, rating, comment, created_at)
select rv.user_id, rd.user_id, v.rating, v.comment, now() - (v.age_days || ' days')::interval
from (values
  ('fatima@foodbridge.demo', 'greenleaf@foodbridge.demo', 5, 'The meal packs arrived warm and well packed. The volunteers were kind to the children.', 25),
  ('joseph@foodbridge.demo', 'sunrise@foodbridge.demo', 5, 'Fresh bread every week. It has made a real difference to our grocery bill.', 55),
  ('fatima@foodbridge.demo', 'daniel@foodbridge.demo', 5, 'Daniel carried the boxes up himself and explained how to store everything.', 28),
  ('joseph@foodbridge.demo', 'freshmart@foodbridge.demo', 4, 'Good produce, though the pickup time was a little tight.', 40)
) as v(reviewer_email, reviewed_email, rating, comment, age_days)
join public.profiles rv on rv.email = v.reviewer_email
join public.profiles rd on rd.email = v.reviewed_email;

-- Notifications ----------------------------------------------------------

insert into public.notifications (user_id, message, kind, link, is_read, created_at)
select p.user_id, v.message, v.kind, v.link, v.is_read, now() - (v.age_hours || ' hours')::interval
from (values
  ('greenleaf@foodbridge.demo', 'Your donation "Chicken Rice Meal Packs" was approved and is now visible to beneficiaries.', 'donation', '/donor/donations', false, 2),
  ('greenleaf@foodbridge.demo', 'Your donation has been matched with a family in need and is being scheduled for pickup.', 'match', '/donor/requests', false, 5),
  ('greenleaf@foodbridge.demo', 'A delivery of "Weekly Meal Packs" was completed. Thank you for reducing food waste.', 'delivery', '/donor/donations', true, 26),
  ('sunrise@foodbridge.demo', 'Your donation "Artisan Bread Assortment" was approved and is now visible to beneficiaries.', 'donation', '/donor/donations', false, 3),
  ('freshmart@foodbridge.demo', 'Your donation "Damaged Canned Goods" was rejected. Reason: Packaging damaged; not safe for distribution.', 'donation', '/donor/donations', true, 90),
  ('fatima@foodbridge.demo', 'A matching donation was found for your request: Family Produce Mix.', 'match', '/beneficiary/requests', false, 4),
  ('fatima@foodbridge.demo', 'Your assistance request was approved. We are now matching it with available food.', 'request', '/beneficiary/requests', false, 20),
  ('joseph@foodbridge.demo', 'Your assistance request has been fulfilled. Food has been delivered.', 'request', '/beneficiary/requests', true, 40),
  ('joseph@foodbridge.demo', 'A matching donation was found for your request: Evening Meal Boxes.', 'match', '/beneficiary/requests', false, 6),
  ('daniel@foodbridge.demo', 'You have been assigned a new delivery task. Pickup from GreenLeaf Bistro, 48 Tampines Ave 5.', 'delivery', '/volunteer/tasks', false, 3),
  ('priya@foodbridge.demo', 'You have been assigned a new delivery task. Pickup from FreshMart, 210 Jurong East St 21.', 'delivery', '/volunteer/tasks', false, 8),
  ('admin@foodbridge.demo', '4 donations are waiting for review and 1 beneficiary account needs verification.', 'system', '/admin/donations', false, 1)
) as v(email, message, kind, link, is_read, age_hours)
join public.profiles p on p.email = v.email;
