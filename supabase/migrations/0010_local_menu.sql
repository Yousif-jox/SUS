-- Localise the demo menu to Egyptian staples.

update public.donations set food_name = 'Koshari Meal Packs',
  description = 'Packed koshari meals prepared for a cancelled event.'
 where food_name = 'Chicken Rice Meal Packs';

update public.donations set food_name = 'Baladi Bread Assortment',
  description = 'Fresh baladi loaves, baguettes and soft rolls baked this morning.'
 where food_name = 'Artisan Bread Assortment';

update public.donations set food_name = 'Feteer Pastry Boxes',
  description = 'Feteer meshaltet and sweet pastries from the morning bake.'
 where food_name = 'Morning Pastry Boxes';

update public.donations set food_name = 'Molokhia and Rice Trays',
  description = 'Trays of molokhia with rice and grilled vegetables from tonight''s service.'
 where food_name = 'Surplus Roasted Vegetable Trays';
