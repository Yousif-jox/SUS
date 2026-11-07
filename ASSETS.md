# Image Manifest — FoodBridge

All images are AI-generated concept photography created for this build. They show generic food and community scenes and do not depict or impersonate real people, businesses, or locations. No user-supplied images or existing CDN assets were available for this project.

Allocation: 8 of 8 images used. No additional approval requested.

| # | Local path | Source | Intended usage | Status |
|---|------------|--------|----------------|--------|
| 1 | `public/assets/images/hero-community-hub.jpg` | imageGenerate | Home hero (16:9, 1536×1024) | ready |
| 2 | `public/assets/images/produce-crate.jpg` | imageGenerate | Produce category, donation cards (4:3) | ready |
| 3 | `public/assets/images/bakery-bread.jpg` | imageGenerate | Bakery category, donation cards (4:3) | ready |
| 4 | `public/assets/images/prepared-meals.jpg` | imageGenerate | Prepared meals category (4:3) | ready |
| 5 | `public/assets/images/dairy-eggs.jpg` | imageGenerate | Dairy & eggs category (4:3) | ready |
| 6 | `public/assets/images/pantry-goods.jpg` | imageGenerate | Pantry / dry goods category (4:3) | ready |
| 7 | `public/assets/images/about-distribution.jpg` | imageGenerate | About page, SDG section (3:2) | ready |
| 8 | `public/assets/images/volunteer-delivery.jpg` | imageGenerate | Volunteer section, how-it-works step 3 (4:3) | ready |

## Reuse map

- `hero-community-hub.jpg` — home hero background, register page side panel, impact page header band.
- Category images — donation cards (by category), home "latest donations" grid, beneficiary browse grid, admin donation moderation rows (thumbnail).
- `about-distribution.jpg` — about page hero and mission block.
- `volunteer-delivery.jpg` — how-it-works step 3, volunteer dashboard empty state.

## Missing / not generated

- Donor organization logos: not generated (would require real brand marks). Cards use a monogram tile instead.
- User avatars: rendered as initials monograms, no photos.
- Any image the app cannot resolve at runtime falls back to `/assets/images/placeholder.svg` (recorded below).

| Path | Source | Purpose |
|------|--------|---------|
| `public/assets/images/placeholder.svg` | placeholder | Neutral food-tile fallback for missing or unreadable donation photos |

## Runtime uploads

New donation photos uploaded by donors are stored in the site's managed Supabase Storage bucket (`bucket_2nm5pj2aedje0fn2`), not in `public/assets/images/`. They are read back through the authenticated storage client and rendered from an object URL; on failure the UI falls back to the category image above.
