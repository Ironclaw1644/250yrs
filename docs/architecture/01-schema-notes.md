# True American Where — Schema Notes (`taw`)

Companion to `01-schema.sql`. Explains the tables, relationships, the RLS model, role
resolution, the slug/geo strategy, and the demo-seed plan.

All objects live in the **`taw`** schema (never `public`). The DDL is idempotent —
safe to re-run. Apply it against Supabase project **WalkPerro** (`kflzqkuioiiyfrvlvcvl`).

---

## 1. Table map

### Identity & RBAC
- **`profiles`** — 1:1 with `auth.users` (PK = `auth.users.id` = `auth.uid()`). Holds the
  `role` enum (`customer | business_owner | admin`) that drives every RLS policy. Auto-created
  on signup by the `on_auth_user_created` trigger on `auth.users`.

### Location hierarchy (Country → State → City)
- **`countries`** → **`states`** → **`cities`**. Each level has a `slug` (unique within its
  parent) for pretty URLs. Includes the mandated foreign example (Jamaica → Kingston). `cities`
  carries a `lat/lng` centroid to seed maps and power nearby search defaults.

### Taxonomy
- **`categories`** — self-referencing (`parent_id`) so categories can be grouped (e.g. a "Food"
  parent over fried food / soul food / bakeries). `icon` stores a **Font Awesome class string**
  (never emoji, per brand rule).

### Listings & their content
- **`businesses`** — the core listing. Holds `owner_id` (FK profiles; **NULL for demo/unclaimed**),
  `city_id`, `category_id`, NAP fields, `lat/lng`, `status`, `plan_tier`, `featured_city/state`
  (+ `featured_until`), `is_demo`, and denormalized `rating_avg/rating_count`.
- **`business_hours`** — weekly hours (0=Sun..6=Sat; supports split shifts via multiple rows).
- **`business_photos`, `business_videos`** — media in Supabase Storage; `is_demo`/`is_ad` flags.
- **`menu_sections` → `menu_items`** — food menus. `menu_items.price_cents` is integer cents;
  `business_id` is denormalized onto items for cheap RLS/ownership checks.
- **`services`** — bookable services with `price_cents` + `duration_minutes`.
- **`coupons`** — percent or fixed-amount discounts, optional window + redemption cap.
- **`reviews`** — one per `(business, author)`; the owner's reply is stored **inline**
  (`response_body/response_at`) so it inherits the review's moderation state. A trigger keeps
  `businesses.rating_avg/rating_count` in sync from `moderation_status = 'visible'` rows.
- **`favorites`** — a customer's saved businesses (unique `(customer, business)`).

### Marketplace (v1 scope)
- **`orders` → `order_items`** — food orders. Items snapshot name + unit price so history is stable
  if the menu later changes. `stripe_payment_intent_id` links the Connect charge.
- **`bookings`** — appointments against a `service` with `starts_at/ends_at`.
- **`service_requests`** — on-demand/mobile jobs (tire service, roadside) with a service location
  and a quote→price flow.

### Advertising & payments
- **`subscriptions`** — the ad plan per business: `plan_tier` (`monthly` $19.99 **or** `annual`
  $100), Stripe customer/subscription/price ids, period + cancel fields.
- **`addon_purchases`** — one-off paid add-ons (`video_ad`, `featured_city/state`,
  `coupon_campaign`, `daily_special`, `promo_email`) with an optional time window.
- **`stripe_connect_accounts`** — one per business (`acct_…`), Express onboarding state
  (`charges_enabled`, `payouts_enabled`, `requirements` JSON).
- **`payments`** — **unified ledger** for every charge (`kind` = subscription | addon | order |
  booking | service_request), with loose FKs to the originating row, `application_fee_cents`
  (platform take on Connect destination charges), Stripe ids, and refund tracking.

### Engagement & ops
- **`ad_impressions`, `ad_clicks`** — analytics events powering the owner's "how many people
  viewed my ad" dashboard and the admin KPIs. Time-series indexed by `(business_id, created_at)`.
- **`conversations` → `messages`** — owner↔customer threads (one thread per `(business, customer)`).
- **`promo_email_campaigns`** — coupon-blast / promo emails sent via Resend (funded by an
  `addon_purchase`).
- **`audit_log`** — append-only `(actor, action, entity, entity_id, diff)` trail, matching the
  bondandfifth pattern.

---

## 2. Key relationships
- `profiles.id == auth.users.id == auth.uid()` (hard 1:1).
- `countries 1—* states 1—* cities 1—* businesses`. A business belongs to exactly one `city` and
  one `category`.
- A `business` fans out to hours, photos, videos, menu (sections→items), services, coupons,
  reviews, favorites, orders, bookings, service_requests, subscription(s), addons, one connect
  account, payments, analytics events, conversations, campaigns.
- Money is always **integer cents + currency** — never floats.
- `payments` is the single financial source of truth; the per-transaction
  `stripe_payment_intent_id` columns on orders/bookings/service_requests are convenience mirrors.

---

## 3. RLS model & role resolution

**Every table has RLS enabled and `FORCE`d** (so even the table owner is subject to policy). The
model:

- **anon / public** — may `SELECT` only `status = 'published'` businesses and their public child
  data (hours, photos, videos, menu, services, active coupons, **visible** reviews) plus the
  public location/category reference tables. No writes.
- **business_owner** — full CRUD on rows belonging to businesses they own (`owner_id = auth.uid()`),
  enforced through the `taw.owns_business(business_id)` helper. Can also advance order/booking/
  service-request status and respond to reviews on their business.
- **customer** — manage only their own `favorites`, `reviews`, `orders`, `bookings`,
  `service_requests`, `conversations`/`messages` (`customer_id`/`author_id`/`sender_id = auth.uid()`).
- **admin** — `taw.is_admin()` short-circuits to `true` on every table (moderation + takedown).

**Role resolution — SECURITY DEFINER helpers, not JWT claims.** Policies call three
`SECURITY DEFINER STABLE` functions with a pinned `search_path`:
- `taw.current_role()` → the caller's `role`.
- `taw.is_admin()` → boolean.
- `taw.owns_business(uuid)` → boolean.

Why definer functions instead of a sub-select on `taw.profiles` inside each policy: a policy on,
say, `businesses` that sub-selected `profiles` would trigger `profiles`' own RLS and can recurse.
Running the lookup in a `SECURITY DEFINER` function reads `profiles` **once, bypassing RLS**, with
no recursion. (A JWT `app_metadata.role` claim is a valid alternative and can be layered in later
for zero-lookup checks, but the DB is the source of truth here.)

**Service role bypasses RLS.** Following the bondandfifth pattern: admin/server pages and all
**Stripe webhooks** use the `service_role` key and bypass RLS entirely; public pages use the `anon`
key (subject to RLS). This is why there are no client-side INSERT policies on `payments`,
`ad_impressions`, `ad_clicks`, or `audit_log` — those are written server-side. Anonymous page-view
events are recorded via a server action using `service_role`, so no anon INSERT policy is needed.

**Privilege escalation guard.** `profiles` has no client path to set `role = 'admin'`; role changes
are done by an admin or the service role. Server actions should still `assertAdmin()` / ownership-
guard, then `audit()`, then `revalidatePath()`.

---

## 4. Slug & geo strategy

**Slugs.** `countries.slug` and `categories.slug` are globally unique; `states.slug` is unique per
country and `cities.slug` per state, giving clean nested URLs
(`/us/california/los-angeles/barber-shops`). `businesses.slug` is **globally unique** so a listing
resolves at a flat `/business/[slug]`. Generate slugs app-side (kebab-case, de-accented) and append
a short suffix on collision.

**Geo — no PostGIS.** PostGIS is assumed **not enabled**. `lat/lng` are `numeric(9,6)` columns with
btree indexes. Nearby search uses a **haversine** expression at query time, fronted by a cheap
lat/lng **bounding-box prefilter** (~69 miles/degree, longitude scaled by `cos(lat)`) so the btree
indexes do the heavy filtering and haversine only runs on the small candidate set. The `acos()`
argument is clamped to `[-1, 1]` to avoid NaN from float drift. A ready-to-use query is in the
header comment of `01-schema.sql`. If volume grows, enable PostGIS + a `geography` column + GiST
index later — the numeric columns can be backfilled.

---

## 5. Demo-seed plan

The launch seeds a lively-looking site while making demo data unmistakable:

- **`businesses.is_demo = true`** on every seeded listing; **`business_photos.is_demo = true`** and
  **`coupons.is_demo = true`** on their seeded children. The UI renders a visible **"Demo"** badge
  for any `is_demo` row (never hidden from users).
- Demo listings have **`owner_id = NULL`** (unclaimed). A future "claim this business" flow lets a
  real owner take over: set `owner_id`, flip `is_demo = false`, replace AI photos.
- Seed coverage: **all US states + major cities + every category**, plus at least one foreign chain
  (**Jamaica → Kingston → Barber Shops**). Demo photos are generated with the OpenAI image API
  (demo only) and uploaded to Supabase Storage.
- Demo listings can be `status = 'published'` so they appear immediately, but are trivially
  filterable (`where is_demo = false`) for real analytics, and bulk-removable before/at handoff.

---

## 6. Environment / Stripe posture
- Build in Stripe **test mode** now; the client invites us to their account later. **All Stripe
  values (keys, price ids, webhook secret, Connect settings) live in ENV vars** — switching to the
  client's live account is a one-config change. No keys are ever hardcoded in schema, code, or
  seed data.
- Two rails: (a) ad **subscription** via embedded Checkout on-site; (b) **marketplace** charges via
  **Stripe Connect** destination charges with a platform `application_fee_cents`, recorded in
  `payments`.
