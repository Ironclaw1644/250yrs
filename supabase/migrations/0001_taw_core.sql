-- =============================================================================
-- True American Where — Core Data Model
-- Postgres / Supabase — schema "taw" (NOT public)
-- =============================================================================
-- This file is IDEMPOTENT. It can be run repeatedly. It creates enums, tables,
-- indexes, triggers, RLS policies, and helper functions.
--
-- GEO NOTE: PostGIS is intentionally NOT used (assume the extension is not
-- enabled). Latitude/longitude are stored as numeric columns and "nearby"
-- search is done with a haversine expression in the query layer, e.g.:
--
--   -- :lat, :lng = search origin; 3959 = Earth radius in miles (use 6371 for km)
--   select b.*,
--     3959 * acos(
--       least(1, greatest(-1,
--         cos(radians(:lat)) * cos(radians(b.lat))
--         * cos(radians(b.lng) - radians(:lng))
--         + sin(radians(:lat)) * sin(radians(b.lat))
--       ))
--     ) as distance_miles
--   from taw.businesses b
--   where b.status = 'published'
--     -- cheap bounding-box prefilter so the btree indexes on lat/lng help:
--     and b.lat  between :lat - (:radius_mi / 69.0) and :lat + (:radius_mi / 69.0)
--     and b.lng  between :lng - (:radius_mi / (69.0 * cos(radians(:lat))))
--                    and :lng + (:radius_mi / (69.0 * cos(radians(:lat))))
--   order by distance_miles
--   limit 50;
--
-- The bounding-box prefilter uses the btree indexes on lat/lng; the haversine
-- term only runs on the small pre-filtered set. Clamp the acos() argument to
-- [-1, 1] to avoid NaN from floating point drift.
-- =============================================================================

create schema if not exists taw;

-- Extensions live in a neutral schema. gen_random_uuid() comes from pgcrypto,
-- which Supabase enables by default in the "extensions" schema.
create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext   with schema extensions;

-- =============================================================================
-- ENUMS  (created idempotently via DO blocks)
-- =============================================================================
do $$ begin
  create type taw.user_role as enum ('customer', 'business_owner', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  -- Lifecycle of a business listing.
  create type taw.listing_status as enum ('draft', 'pending', 'published', 'suspended', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  -- Advertising subscription tiers. 'free' = unpaid/basic listing.
  create type taw.plan_tier as enum ('free', 'monthly', 'annual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type taw.subscription_status as enum
    ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid', 'paused');
exception when duplicate_object then null; end $$;

do $$ begin
  create type taw.order_status as enum
    ('cart', 'pending', 'paid', 'accepted', 'preparing', 'ready', 'completed', 'canceled', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type taw.fulfillment_type as enum ('pickup', 'delivery', 'dine_in');
exception when duplicate_object then null; end $$;

do $$ begin
  create type taw.booking_status as enum
    ('requested', 'confirmed', 'completed', 'canceled', 'no_show', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  -- Mobile/on-demand service requests (tire service, roadside, etc.).
  create type taw.service_request_status as enum
    ('requested', 'quoted', 'accepted', 'en_route', 'in_progress', 'completed', 'canceled', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type taw.payment_status as enum
    ('requires_payment', 'processing', 'succeeded', 'failed', 'canceled', 'refunded', 'partially_refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  -- What a payment ledger row is for.
  create type taw.payment_kind as enum ('subscription', 'addon', 'order', 'booking', 'service_request');
exception when duplicate_object then null; end $$;

do $$ begin
  create type taw.connect_status as enum ('none', 'onboarding', 'restricted', 'enabled', 'disabled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type taw.addon_type as enum
    ('video_ad', 'featured_city', 'featured_state', 'coupon_campaign', 'daily_special', 'promo_email');
exception when duplicate_object then null; end $$;

do $$ begin
  create type taw.coupon_discount_type as enum ('percent', 'amount');
exception when duplicate_object then null; end $$;

do $$ begin
  create type taw.moderation_status as enum ('visible', 'flagged', 'hidden', 'removed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type taw.campaign_status as enum ('draft', 'scheduled', 'sending', 'sent', 'canceled');
exception when duplicate_object then null; end $$;

-- =============================================================================
-- SHARED: updated_at trigger + role-resolution helpers
-- =============================================================================

-- Generic BEFORE UPDATE trigger to maintain updated_at.
create or replace function taw.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Resolve the current user's role from taw.profiles.
-- SECURITY DEFINER so it can read taw.profiles WITHOUT being blocked by RLS,
-- and WITHOUT causing recursive policy evaluation (policies on other tables
-- call this instead of sub-selecting profiles, which would recurse).
create or replace function taw.current_role()
returns taw.user_role
language sql stable security definer set search_path = taw, public as $$
  select role from taw.profiles where id = auth.uid();
$$;

create or replace function taw.is_admin()
returns boolean
language sql stable security definer set search_path = taw, public as $$
  select coalesce(
    (select role = 'admin' from taw.profiles where id = auth.uid()),
    false
  );
$$;

-- True if the current user owns the given business.
create or replace function taw.owns_business(p_business_id uuid)
returns boolean
language sql stable security definer set search_path = taw, public as $$
  select exists (
    select 1 from taw.businesses b
    where b.id = p_business_id and b.owner_id = auth.uid()
  );
$$;

-- =============================================================================
-- profiles  (1:1 with auth.users, holds role)
-- =============================================================================
create table if not exists taw.profiles (
  id           uuid primary key references auth.users(id) on delete cascade, -- == auth.uid()
  role         taw.user_role not null default 'customer',                    -- RBAC role
  full_name    text,
  display_name text,
  email        extensions.citext,                                            -- denormalized for admin search
  phone        text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table  taw.profiles is 'One row per auth user; holds the RBAC role used by RLS.';
comment on column taw.profiles.id   is 'Matches auth.users.id and auth.uid().';
comment on column taw.profiles.role is 'customer | business_owner | admin. Drives all RLS.';

-- Auto-create a profile row when a new auth user signs up.
create or replace function taw.handle_new_user()
returns trigger language plpgsql security definer set search_path = taw, public as $$
begin
  insert into taw.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function taw.handle_new_user();

-- =============================================================================
-- GEO HIERARCHY: countries -> states -> cities
-- =============================================================================
create table if not exists taw.countries (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,          -- ISO 3166-1 alpha-2, e.g. 'US', 'JM'
  name       text not null,
  slug       text not null unique,          -- 'united-states', 'jamaica'
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table taw.countries is 'Top of the location hierarchy. Includes at least one foreign country (Jamaica).';

create table if not exists taw.states (
  id          uuid primary key default gen_random_uuid(),
  country_id  uuid not null references taw.countries(id) on delete cascade,
  code        text,                          -- 'CA', 'NY', or NULL for foreign regions
  name        text not null,                 -- 'California', 'Kingston Parish'
  slug        text not null,                 -- unique within a country
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (country_id, slug)
);
comment on table taw.states is 'States / regions / parishes within a country.';

create table if not exists taw.cities (
  id         uuid primary key default gen_random_uuid(),
  state_id   uuid not null references taw.states(id) on delete cascade,
  name       text not null,                  -- 'Los Angeles', 'Kingston'
  slug       text not null,                  -- unique within a state
  lat        numeric(9,6),                   -- city centroid for map defaults / nearby
  lng        numeric(9,6),
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (state_id, slug)
);
comment on table taw.cities is 'Cities within a state/region. lat/lng is the centroid used to seed maps.';

-- =============================================================================
-- categories  (business categories: fried food, barber shops, tire shops, ...)
-- =============================================================================
create table if not exists taw.categories (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references taw.categories(id) on delete set null, -- optional grouping (e.g. "Food")
  name        text not null,                 -- 'Barber Shops', 'Tire Shops'
  slug        text not null unique,          -- 'barber-shops'
  icon        text,                          -- Font Awesome class, e.g. 'fa-solid fa-scissors' (NEVER emoji)
  description text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table taw.categories is 'Business categories. icon holds a Font Awesome class (never emoji).';

-- =============================================================================
-- businesses  (the listings — the heart of the model)
-- =============================================================================
create table if not exists taw.businesses (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid references taw.profiles(id) on delete set null,  -- null for demo/unclaimed
  city_id        uuid not null references taw.cities(id) on delete restrict,
  category_id    uuid not null references taw.categories(id) on delete restrict,

  name           text not null,
  slug           text not null unique,        -- global unique slug for /business/[slug]
  tagline        text,
  description    text,

  -- NAP (Name / Address / Phone) — critical for local SEO consistency.
  address_line1  text,
  address_line2  text,
  postal_code    text,
  phone          text,
  email          extensions.citext,
  website_url    text,

  lat            numeric(9,6),                -- see GEO NOTE at top of file
  lng            numeric(9,6),

  status         taw.listing_status not null default 'draft',
  plan_tier      taw.plan_tier      not null default 'free',
  featured_city  boolean not null default false,  -- paid add-on: front-page in its city
  featured_state boolean not null default false,  -- paid add-on: front-page in its state
  featured_until timestamptz,                     -- when the featured placement expires

  is_demo        boolean not null default false,  -- TRUE = AI-seeded demo, shown with a "Demo" badge
  rating_avg     numeric(2,1) not null default 0, -- denormalized from reviews (maintained by trigger below)
  rating_count   int not null default 0,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  published_at   timestamptz
);
comment on table  taw.businesses is 'Business listings. Auto-publish on payment; admins can suspend/takedown.';
comment on column taw.businesses.owner_id       is 'FK to profiles; NULL for demo/unclaimed listings.';
comment on column taw.businesses.is_demo        is 'TRUE = AI-generated demo listing, rendered with a visible Demo badge.';
comment on column taw.businesses.status         is 'Only status=published is visible to anon/public.';
comment on column taw.businesses.featured_until is 'Expiry for featured_city/featured_state placement.';
comment on column taw.businesses.rating_avg     is 'Denormalized average of visible reviews (0..5).';

-- =============================================================================
-- business_hours
-- =============================================================================
create table if not exists taw.business_hours (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references taw.businesses(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),  -- 0 = Sunday
  open_time   time,                       -- NULL open/close + is_closed => closed that day
  close_time  time,
  is_closed   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table taw.business_hours is 'Weekly opening hours. day_of_week 0=Sun..6=Sat. Multiple rows per day allowed for split shifts.';

-- =============================================================================
-- business_photos / business_videos
-- =============================================================================
create table if not exists taw.business_photos (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references taw.businesses(id) on delete cascade,
  url         text not null,               -- Supabase Storage public URL
  alt_text    text,
  is_primary  boolean not null default false,
  is_demo     boolean not null default false, -- AI-generated demo photo
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table taw.business_photos is 'Photos in Supabase Storage. is_demo flags AI-generated seed images.';

create table if not exists taw.business_videos (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references taw.businesses(id) on delete cascade,
  url           text not null,             -- hosted video URL (paid video-ad add-on)
  thumbnail_url text,
  title         text,
  is_ad         boolean not null default false, -- TRUE if this is a paid video ad
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table taw.business_videos is 'Business videos; is_ad marks a paid video-ad add-on.';

-- =============================================================================
-- MENU: menu_sections -> menu_items  (food)
-- =============================================================================
create table if not exists taw.menu_sections (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references taw.businesses(id) on delete cascade,
  name        text not null,               -- 'Sides', 'Plates', 'Drinks'
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table taw.menu_sections is 'Menu groupings for a food business.';

create table if not exists taw.menu_items (
  id             uuid primary key default gen_random_uuid(),
  section_id     uuid not null references taw.menu_sections(id) on delete cascade,
  business_id    uuid not null references taw.businesses(id) on delete cascade, -- denormalized for RLS + queries
  name           text not null,
  description    text,
  price_cents    int not null default 0 check (price_cents >= 0),  -- money in cents, avoids float error
  currency       text not null default 'usd',
  image_url      text,
  is_available   boolean not null default true,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
comment on table  taw.menu_items is 'Individual menu items. Prices in integer cents.';
comment on column taw.menu_items.business_id is 'Denormalized from section for RLS/ownership checks without a join.';

-- =============================================================================
-- services  (appointment services: haircut, oil change, etc. — price + duration)
-- =============================================================================
create table if not exists taw.services (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references taw.businesses(id) on delete cascade,
  name             text not null,          -- 'Men's Haircut', 'Tire Rotation'
  description      text,
  price_cents      int not null default 0 check (price_cents >= 0),
  currency         text not null default 'usd',
  duration_minutes int not null default 30 check (duration_minutes > 0),
  is_bookable      boolean not null default true,
  sort_order       int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
comment on table taw.services is 'Bookable services with price (cents) and duration (minutes).';

-- =============================================================================
-- coupons
-- =============================================================================
create table if not exists taw.coupons (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references taw.businesses(id) on delete cascade,
  code           text,                     -- optional redemption code
  title          text not null,            -- '20% off any plate'
  description    text,
  discount_type  taw.coupon_discount_type not null,
  discount_value int not null check (discount_value > 0), -- percent (1..100) or amount in cents
  starts_at      timestamptz,
  ends_at        timestamptz,
  max_redemptions int,                     -- NULL = unlimited
  redeemed_count  int not null default 0,
  is_active      boolean not null default true,
  is_demo        boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
comment on table  taw.coupons is 'Business coupons. Percent (1-100) or fixed amount in cents per discount_type.';
comment on column taw.coupons.discount_value is 'If percent: 1-100. If amount: value in cents.';

-- =============================================================================
-- reviews  (+ business responses inline)
-- =============================================================================
create table if not exists taw.reviews (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references taw.businesses(id) on delete cascade,
  author_id         uuid not null references taw.profiles(id) on delete cascade,
  rating            smallint not null check (rating between 1 and 5),
  body              text,
  moderation_status taw.moderation_status not null default 'visible',
  -- Owner's public response, kept inline so it shares the review's moderation.
  response_body     text,
  response_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (business_id, author_id)          -- one review per customer per business
);
comment on table  taw.reviews is 'Customer reviews with an inline owner response. One per (business, author).';
comment on column taw.reviews.moderation_status is 'Only visible reviews count toward rating_avg and are public.';

-- Maintain businesses.rating_avg / rating_count from visible reviews.
create or replace function taw.refresh_business_rating(p_business_id uuid)
returns void language sql security definer set search_path = taw, public as $$
  update taw.businesses b set
    rating_count = sub.cnt,
    rating_avg   = coalesce(sub.avg, 0)
  from (
    select count(*) cnt, round(avg(rating)::numeric, 1) avg
    from taw.reviews
    where business_id = p_business_id and moderation_status = 'visible'
  ) sub
  where b.id = p_business_id;
$$;

create or replace function taw.reviews_rating_trigger()
returns trigger language plpgsql security definer set search_path = taw, public as $$
begin
  perform taw.refresh_business_rating(coalesce(new.business_id, old.business_id));
  return null;
end $$;

drop trigger if exists trg_reviews_rating on taw.reviews;
create trigger trg_reviews_rating
  after insert or update or delete on taw.reviews
  for each row execute function taw.reviews_rating_trigger();

-- =============================================================================
-- favorites
-- =============================================================================
create table if not exists taw.favorites (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references taw.profiles(id) on delete cascade,
  business_id uuid not null references taw.businesses(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (customer_id, business_id)
);
comment on table taw.favorites is 'A customer''s saved businesses.';

-- =============================================================================
-- MARKETPLACE: orders + order_items (food)
-- =============================================================================
create table if not exists taw.orders (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references taw.businesses(id) on delete restrict,
  customer_id       uuid references taw.profiles(id) on delete set null,
  status            taw.order_status not null default 'pending',
  fulfillment       taw.fulfillment_type not null default 'pickup',
  subtotal_cents    int not null default 0 check (subtotal_cents >= 0),
  tax_cents         int not null default 0 check (tax_cents >= 0),
  tip_cents         int not null default 0 check (tip_cents >= 0),
  discount_cents    int not null default 0 check (discount_cents >= 0),
  total_cents       int not null default 0 check (total_cents >= 0),
  currency          text not null default 'usd',
  coupon_id         uuid references taw.coupons(id) on delete set null,
  customer_note     text,
  pickup_time       timestamptz,
  -- Stripe Connect destination charge references (see payments ledger too):
  stripe_payment_intent_id text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
comment on table taw.orders is 'Food orders. Paid in-app; funds route to the business via Stripe Connect destination charges.';

create table if not exists taw.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references taw.orders(id) on delete cascade,
  menu_item_id uuid references taw.menu_items(id) on delete set null,
  name_snapshot text not null,             -- captured name at order time (item may change later)
  unit_price_cents int not null check (unit_price_cents >= 0),
  quantity     int not null default 1 check (quantity > 0),
  notes        text,
  created_at   timestamptz not null default now()
);
comment on table taw.order_items is 'Line items with a price/name snapshot so history is stable if the menu changes.';

-- =============================================================================
-- bookings / appointments
-- =============================================================================
create table if not exists taw.bookings (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references taw.businesses(id) on delete restrict,
  customer_id   uuid references taw.profiles(id) on delete set null,
  service_id    uuid references taw.services(id) on delete set null,
  status        taw.booking_status not null default 'requested',
  starts_at     timestamptz not null,
  ends_at       timestamptz,
  price_cents   int not null default 0 check (price_cents >= 0),
  currency      text not null default 'usd',
  customer_note text,
  stripe_payment_intent_id text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table taw.bookings is 'Appointment bookings against a service; optionally prepaid via Stripe Connect.';

-- =============================================================================
-- service_requests  (tire / mobile / on-demand)
-- =============================================================================
create table if not exists taw.service_requests (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references taw.businesses(id) on delete restrict,
  customer_id   uuid references taw.profiles(id) on delete set null,
  status        taw.service_request_status not null default 'requested',
  request_type  text,                      -- 'flat_tire', 'new_tire', 'roadside'
  details       text,
  service_lat   numeric(9,6),              -- where the customer needs service
  service_lng   numeric(9,6),
  service_address text,
  quote_cents   int check (quote_cents >= 0),
  price_cents   int not null default 0 check (price_cents >= 0),
  currency      text not null default 'usd',
  stripe_payment_intent_id text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table taw.service_requests is 'On-demand/mobile service requests (e.g. tire service) with a location and quote flow.';

-- =============================================================================
-- ADVERTISING: subscriptions + addon_purchases
-- =============================================================================
create table if not exists taw.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  business_id             uuid not null references taw.businesses(id) on delete cascade,
  plan_tier               taw.plan_tier not null,       -- monthly | annual
  status                  taw.subscription_status not null default 'incomplete',
  -- Stripe references (kept in ENV-driven test mode now; live later):
  stripe_customer_id      text,
  stripe_subscription_id  text unique,
  stripe_price_id         text,
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean not null default false,
  canceled_at             timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
comment on table  taw.subscriptions is 'Ad-plan subscription per business ($19.99/mo OR $100/yr). Embedded Stripe Checkout.';
comment on column taw.subscriptions.plan_tier is 'monthly or annual (annual is a discount, not additive).';

create table if not exists taw.addon_purchases (
  id                    uuid primary key default gen_random_uuid(),
  business_id           uuid not null references taw.businesses(id) on delete cascade,
  addon_type            taw.addon_type not null,
  status                taw.payment_status not null default 'requires_payment',
  amount_cents          int not null default 0 check (amount_cents >= 0),
  currency              text not null default 'usd',
  starts_at             timestamptz,        -- for time-boxed placements (featured, campaign window)
  ends_at               timestamptz,
  stripe_payment_intent_id text,
  metadata              jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
comment on table taw.addon_purchases is 'One-off paid add-ons: video ads, featured placement, coupon campaigns, specials, promo emails.';

-- =============================================================================
-- stripe_connect_accounts  (per business — Express onboarding for payouts)
-- =============================================================================
create table if not exists taw.stripe_connect_accounts (
  id                    uuid primary key default gen_random_uuid(),
  business_id           uuid not null unique references taw.businesses(id) on delete cascade,
  stripe_account_id     text unique,        -- acct_...
  status                taw.connect_status not null default 'none',
  charges_enabled       boolean not null default false,
  payouts_enabled       boolean not null default false,
  details_submitted     boolean not null default false,
  default_currency      text,
  requirements          jsonb not null default '{}'::jsonb, -- Stripe requirements snapshot
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
comment on table taw.stripe_connect_accounts is 'Stripe Connect Express account per business for marketplace payouts (destination charges + platform fee).';

-- =============================================================================
-- payments  (unified ledger for all charges)
-- =============================================================================
create table if not exists taw.payments (
  id                       uuid primary key default gen_random_uuid(),
  kind                     taw.payment_kind not null,   -- subscription | addon | order | booking | service_request
  business_id              uuid references taw.businesses(id) on delete set null,
  customer_id              uuid references taw.profiles(id) on delete set null,

  -- Loose links to the originating row (only one is set, per kind):
  order_id                 uuid references taw.orders(id) on delete set null,
  booking_id               uuid references taw.bookings(id) on delete set null,
  service_request_id       uuid references taw.service_requests(id) on delete set null,
  subscription_id          uuid references taw.subscriptions(id) on delete set null,
  addon_purchase_id        uuid references taw.addon_purchases(id) on delete set null,

  amount_cents             int not null check (amount_cents >= 0),
  currency                 text not null default 'usd',
  application_fee_cents    int not null default 0 check (application_fee_cents >= 0), -- platform take on Connect charges
  status                   taw.payment_status not null default 'requires_payment',

  stripe_payment_intent_id text unique,
  stripe_charge_id         text,
  stripe_transfer_id       text,           -- destination transfer to the connected account
  stripe_connect_account_id text,          -- acct_... funds were routed to
  refunded_cents           int not null default 0 check (refunded_cents >= 0),
  metadata                 jsonb not null default '{}'::jsonb,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
comment on table  taw.payments is 'Unified charge ledger for subscriptions, add-ons, and all marketplace transactions.';
comment on column taw.payments.application_fee_cents is 'Platform application fee taken on Stripe Connect destination charges.';

-- =============================================================================
-- ANALYTICS: ad_impressions + ad_clicks (+ generic events)
-- =============================================================================
create table if not exists taw.ad_impressions (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references taw.businesses(id) on delete cascade,
  viewer_id    uuid references taw.profiles(id) on delete set null, -- null = anonymous
  surface      text,                        -- 'city_page', 'search', 'featured', 'category'
  city_id      uuid references taw.cities(id) on delete set null,
  session_id   text,
  created_at   timestamptz not null default now()
);
comment on table taw.ad_impressions is 'Ad/listing view events powering the owner analytics dashboard ("how many people viewed my ad").';

create table if not exists taw.ad_clicks (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references taw.businesses(id) on delete cascade,
  viewer_id    uuid references taw.profiles(id) on delete set null,
  action       text,                        -- 'call', 'directions', 'website', 'coupon', 'video', 'share'
  surface      text,
  session_id   text,
  created_at   timestamptz not null default now()
);
comment on table taw.ad_clicks is 'Click/interaction events (call, directions, coupon, share, ...) for analytics.';

-- =============================================================================
-- MESSAGING: conversations + messages  (owner <-> customer)
-- =============================================================================
create table if not exists taw.conversations (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references taw.businesses(id) on delete cascade,
  customer_id   uuid not null references taw.profiles(id) on delete cascade,
  last_message_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (business_id, customer_id)          -- one thread per (business, customer)
);
comment on table taw.conversations is 'A message thread between a business and a customer.';

create table if not exists taw.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references taw.conversations(id) on delete cascade,
  sender_id       uuid not null references taw.profiles(id) on delete cascade,
  body            text not null,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);
comment on table taw.messages is 'Individual messages within a conversation.';

-- =============================================================================
-- promo_email_campaigns  (coupon blasts / promotional emails via Resend)
-- =============================================================================
create table if not exists taw.promo_email_campaigns (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references taw.businesses(id) on delete cascade,
  addon_purchase_id uuid references taw.addon_purchases(id) on delete set null, -- the paid add-on that funded it
  coupon_id      uuid references taw.coupons(id) on delete set null,
  subject        text not null,
  body_html      text,
  status         taw.campaign_status not null default 'draft',
  scheduled_at   timestamptz,
  sent_at        timestamptz,
  recipient_count int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
comment on table taw.promo_email_campaigns is 'Promotional email / coupon-blast campaigns sent via Resend (paid add-on).';

-- =============================================================================
-- audit_log  (admin moderation & sensitive actions)
-- =============================================================================
create table if not exists taw.audit_log (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references taw.profiles(id) on delete set null, -- who did it (null = system)
  action     text not null,                 -- 'business.suspend', 'review.hide', ...
  entity     text not null,                 -- 'business', 'review', 'subscription'
  entity_id  uuid,
  diff       jsonb not null default '{}'::jsonb, -- before/after
  created_at timestamptz not null default now()
);
comment on table taw.audit_log is 'Append-only audit trail of admin/moderation and sensitive actions.';

-- =============================================================================
-- INDEXES
-- =============================================================================
-- Geo hierarchy
create index if not exists idx_states_country   on taw.states(country_id);
create index if not exists idx_cities_state      on taw.cities(state_id);
create index if not exists idx_cities_latlng      on taw.cities(lat, lng);

-- Categories
create index if not exists idx_categories_parent on taw.categories(parent_id);

-- Businesses: FKs, slug, status, geo, featured
create index if not exists idx_biz_owner        on taw.businesses(owner_id);
create index if not exists idx_biz_city         on taw.businesses(city_id);
create index if not exists idx_biz_category     on taw.businesses(category_id);
create index if not exists idx_biz_status       on taw.businesses(status);
create index if not exists idx_biz_latlng       on taw.businesses(lat, lng);
create index if not exists idx_biz_featured     on taw.businesses(featured_city, featured_state) where status = 'published';
create index if not exists idx_biz_is_demo      on taw.businesses(is_demo);
-- Common public browse path: published listings in a city+category.
create index if not exists idx_biz_city_cat_pub on taw.businesses(city_id, category_id) where status = 'published';

-- Child tables of businesses
create index if not exists idx_hours_biz        on taw.business_hours(business_id);
create index if not exists idx_photos_biz       on taw.business_photos(business_id);
create index if not exists idx_videos_biz       on taw.business_videos(business_id);
create index if not exists idx_menu_sections_biz on taw.menu_sections(business_id);
create index if not exists idx_menu_items_section on taw.menu_items(section_id);
create index if not exists idx_menu_items_biz   on taw.menu_items(business_id);
create index if not exists idx_services_biz     on taw.services(business_id);
create index if not exists idx_coupons_biz      on taw.coupons(business_id);
create index if not exists idx_coupons_active   on taw.coupons(business_id) where is_active;

-- Reviews / favorites
create index if not exists idx_reviews_biz      on taw.reviews(business_id);
create index if not exists idx_reviews_author   on taw.reviews(author_id);
create index if not exists idx_favorites_cust   on taw.favorites(customer_id);
create index if not exists idx_favorites_biz    on taw.favorites(business_id);

-- Marketplace
create index if not exists idx_orders_biz       on taw.orders(business_id);
create index if not exists idx_orders_cust      on taw.orders(customer_id);
create index if not exists idx_orders_status    on taw.orders(status);
create index if not exists idx_order_items_order on taw.order_items(order_id);
create index if not exists idx_bookings_biz     on taw.bookings(business_id);
create index if not exists idx_bookings_cust    on taw.bookings(customer_id);
create index if not exists idx_bookings_starts  on taw.bookings(starts_at);
create index if not exists idx_svcreq_biz       on taw.service_requests(business_id);
create index if not exists idx_svcreq_cust      on taw.service_requests(customer_id);
create index if not exists idx_svcreq_status    on taw.service_requests(status);

-- Advertising / payments
create index if not exists idx_subs_biz         on taw.subscriptions(business_id);
create index if not exists idx_subs_status      on taw.subscriptions(status);
create index if not exists idx_addons_biz       on taw.addon_purchases(business_id);
create index if not exists idx_connect_biz      on taw.stripe_connect_accounts(business_id);
create index if not exists idx_payments_biz     on taw.payments(business_id);
create index if not exists idx_payments_cust    on taw.payments(customer_id);
create index if not exists idx_payments_kind    on taw.payments(kind);

-- Analytics (time-series by business)
create index if not exists idx_impr_biz_time    on taw.ad_impressions(business_id, created_at);
create index if not exists idx_clicks_biz_time   on taw.ad_clicks(business_id, created_at);

-- Messaging
create index if not exists idx_convo_biz        on taw.conversations(business_id);
create index if not exists idx_convo_cust       on taw.conversations(customer_id);
create index if not exists idx_messages_convo   on taw.messages(conversation_id, created_at);

-- Campaigns / audit
create index if not exists idx_campaigns_biz    on taw.promo_email_campaigns(business_id);
create index if not exists idx_audit_entity     on taw.audit_log(entity, entity_id);
create index if not exists idx_audit_actor      on taw.audit_log(actor_id);

-- =============================================================================
-- updated_at TRIGGERS  (attach to every table that has updated_at)
-- =============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','countries','states','cities','categories','businesses',
    'business_hours','business_photos','business_videos','menu_sections','menu_items',
    'services','coupons','reviews','orders','bookings','service_requests',
    'subscriptions','addon_purchases','stripe_connect_accounts','payments',
    'conversations','promo_email_campaigns'
  ]
  loop
    execute format('drop trigger if exists trg_set_updated_at on taw.%I', t);
    execute format(
      'create trigger trg_set_updated_at before update on taw.%I
         for each row execute function taw.set_updated_at()', t);
  end loop;
end $$;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
-- Model:
--   * anon/public: SELECT only PUBLISHED listings + their public child data.
--   * business_owner: full CRUD on rows belonging to businesses they own.
--   * customer: manage only their own favorites/reviews/orders/bookings/etc.
--   * admin (taw.is_admin()): full access to everything.
-- Role is resolved via SECURITY DEFINER helpers (taw.is_admin / taw.owns_business)
-- to avoid recursive policy evaluation against taw.profiles.
-- =============================================================================

-- Enable RLS on every table.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','countries','states','cities','categories','businesses',
    'business_hours','business_photos','business_videos','menu_sections','menu_items',
    'services','coupons','reviews','favorites','orders','order_items','bookings',
    'service_requests','subscriptions','addon_purchases','stripe_connect_accounts',
    'payments','ad_impressions','ad_clicks','conversations','messages',
    'promo_email_campaigns','audit_log'
  ]
  loop
    execute format('alter table taw.%I enable row level security', t);
    execute format('alter table taw.%I force row level security', t);
  end loop;
end $$;

-- Helper to drop a policy if it exists (keeps this file idempotent).
-- (Postgres supports DROP POLICY IF EXISTS, used inline below.)

-- ---------- profiles ----------
drop policy if exists profiles_select_self on taw.profiles;
create policy profiles_select_self on taw.profiles
  for select using (id = auth.uid() or taw.is_admin());
drop policy if exists profiles_update_self on taw.profiles;
create policy profiles_update_self on taw.profiles
  for update using (id = auth.uid() or taw.is_admin())
  with check (id = auth.uid() or taw.is_admin());
drop policy if exists profiles_admin_all on taw.profiles;
create policy profiles_admin_all on taw.profiles
  for all using (taw.is_admin()) with check (taw.is_admin());
-- NOTE: role changes should be done by admin/service_role; do not expose a
-- self-service path to set role='admin' from the client.

-- ---------- geo hierarchy + categories: public read, admin write ----------
do $$
declare t text;
begin
  foreach t in array array['countries','states','cities','categories'] loop
    execute format('drop policy if exists %I_public_read on taw.%I', t, t);
    execute format(
      'create policy %I_public_read on taw.%I for select using (true)', t, t);
    execute format('drop policy if exists %I_admin_write on taw.%I', t, t);
    execute format(
      'create policy %I_admin_write on taw.%I for all
         using (taw.is_admin()) with check (taw.is_admin())', t, t);
  end loop;
end $$;

-- ---------- businesses ----------
drop policy if exists biz_public_read on taw.businesses;
create policy biz_public_read on taw.businesses
  for select using (status = 'published' or owner_id = auth.uid() or taw.is_admin());
drop policy if exists biz_owner_insert on taw.businesses;
create policy biz_owner_insert on taw.businesses
  for insert with check (owner_id = auth.uid() or taw.is_admin());
drop policy if exists biz_owner_update on taw.businesses;
create policy biz_owner_update on taw.businesses
  for update using (owner_id = auth.uid() or taw.is_admin())
  with check (owner_id = auth.uid() or taw.is_admin());
drop policy if exists biz_owner_delete on taw.businesses;
create policy biz_owner_delete on taw.businesses
  for delete using (owner_id = auth.uid() or taw.is_admin());

-- ---------- business child tables: public read (when parent published),
--            owner/admin write. Applied uniformly via a loop. ----------
do $$
declare t text;
begin
  foreach t in array array[
    'business_hours','business_photos','business_videos',
    'menu_sections','menu_items','services','coupons'
  ] loop
    -- Public read only if the parent business is published (or you own it / admin).
    execute format('drop policy if exists %I_public_read on taw.%I', t, t);
    execute format($f$
      create policy %I_public_read on taw.%I for select using (
        exists (select 1 from taw.businesses b
                where b.id = %I.business_id
                  and (b.status = 'published' or b.owner_id = auth.uid()))
        or taw.is_admin()
      )$f$, t, t, t);
    -- Owner (or admin) full write on rows of their own business.
    execute format('drop policy if exists %I_owner_write on taw.%I', t, t);
    execute format($f$
      create policy %I_owner_write on taw.%I for all
        using (taw.owns_business(%I.business_id) or taw.is_admin())
        with check (taw.owns_business(%I.business_id) or taw.is_admin())
      $f$, t, t, t, t);
  end loop;
end $$;

-- ---------- reviews ----------
drop policy if exists reviews_public_read on taw.reviews;
create policy reviews_public_read on taw.reviews
  for select using (
    moderation_status = 'visible'
    or author_id = auth.uid()
    or taw.owns_business(business_id)
    or taw.is_admin()
  );
-- Customer writes their own review.
drop policy if exists reviews_author_insert on taw.reviews;
create policy reviews_author_insert on taw.reviews
  for insert with check (author_id = auth.uid());
drop policy if exists reviews_author_update on taw.reviews;
create policy reviews_author_update on taw.reviews
  for update using (author_id = auth.uid() or taw.is_admin())
  with check (author_id = auth.uid() or taw.is_admin());
drop policy if exists reviews_author_delete on taw.reviews;
create policy reviews_author_delete on taw.reviews
  for delete using (author_id = auth.uid() or taw.is_admin());
-- Owner may respond to reviews on their business (UPDATE limited by app to response_* fields).
drop policy if exists reviews_owner_respond on taw.reviews;
create policy reviews_owner_respond on taw.reviews
  for update using (taw.owns_business(business_id))
  with check (taw.owns_business(business_id));

-- ---------- favorites ----------
drop policy if exists favorites_own on taw.favorites;
create policy favorites_own on taw.favorites
  for all using (customer_id = auth.uid() or taw.is_admin())
  with check (customer_id = auth.uid() or taw.is_admin());

-- ---------- orders ----------
drop policy if exists orders_read on taw.orders;
create policy orders_read on taw.orders
  for select using (
    customer_id = auth.uid() or taw.owns_business(business_id) or taw.is_admin()
  );
drop policy if exists orders_customer_insert on taw.orders;
create policy orders_customer_insert on taw.orders
  for insert with check (customer_id = auth.uid() or taw.is_admin());
-- Customer can update their own cart/order; owner can advance status.
drop policy if exists orders_update on taw.orders;
create policy orders_update on taw.orders
  for update using (
    customer_id = auth.uid() or taw.owns_business(business_id) or taw.is_admin()
  ) with check (
    customer_id = auth.uid() or taw.owns_business(business_id) or taw.is_admin()
  );

-- ---------- order_items (via parent order) ----------
drop policy if exists order_items_read on taw.order_items;
create policy order_items_read on taw.order_items
  for select using (exists (
    select 1 from taw.orders o where o.id = order_items.order_id
    and (o.customer_id = auth.uid() or taw.owns_business(o.business_id) or taw.is_admin())
  ));
drop policy if exists order_items_write on taw.order_items;
create policy order_items_write on taw.order_items
  for all using (exists (
    select 1 from taw.orders o where o.id = order_items.order_id
    and (o.customer_id = auth.uid() or taw.is_admin())
  )) with check (exists (
    select 1 from taw.orders o where o.id = order_items.order_id
    and (o.customer_id = auth.uid() or taw.is_admin())
  ));

-- ---------- bookings ----------
drop policy if exists bookings_read on taw.bookings;
create policy bookings_read on taw.bookings
  for select using (
    customer_id = auth.uid() or taw.owns_business(business_id) or taw.is_admin()
  );
drop policy if exists bookings_customer_insert on taw.bookings;
create policy bookings_customer_insert on taw.bookings
  for insert with check (customer_id = auth.uid() or taw.is_admin());
drop policy if exists bookings_update on taw.bookings;
create policy bookings_update on taw.bookings
  for update using (
    customer_id = auth.uid() or taw.owns_business(business_id) or taw.is_admin()
  ) with check (
    customer_id = auth.uid() or taw.owns_business(business_id) or taw.is_admin()
  );

-- ---------- service_requests ----------
drop policy if exists svcreq_read on taw.service_requests;
create policy svcreq_read on taw.service_requests
  for select using (
    customer_id = auth.uid() or taw.owns_business(business_id) or taw.is_admin()
  );
drop policy if exists svcreq_customer_insert on taw.service_requests;
create policy svcreq_customer_insert on taw.service_requests
  for insert with check (customer_id = auth.uid() or taw.is_admin());
drop policy if exists svcreq_update on taw.service_requests;
create policy svcreq_update on taw.service_requests
  for update using (
    customer_id = auth.uid() or taw.owns_business(business_id) or taw.is_admin()
  ) with check (
    customer_id = auth.uid() or taw.owns_business(business_id) or taw.is_admin()
  );

-- ---------- subscriptions / addon_purchases / connect: owner + admin only ----------
do $$
declare t text;
begin
  foreach t in array array['subscriptions','addon_purchases','stripe_connect_accounts'] loop
    execute format('drop policy if exists %I_owner_all on taw.%I', t, t);
    execute format($f$
      create policy %I_owner_all on taw.%I for all
        using (taw.owns_business(%I.business_id) or taw.is_admin())
        with check (taw.owns_business(%I.business_id) or taw.is_admin())
      $f$, t, t, t, t);
  end loop;
end $$;
-- NOTE: Stripe webhooks that write these tables run with the service_role key,
-- which bypasses RLS entirely — so webhook-driven inserts/updates are unaffected.

-- ---------- payments: read for the involved customer/owner + admin ----------
drop policy if exists payments_read on taw.payments;
create policy payments_read on taw.payments
  for select using (
    customer_id = auth.uid()
    or (business_id is not null and taw.owns_business(business_id))
    or taw.is_admin()
  );
-- Writes come from server actions / webhooks via service_role (bypasses RLS).
drop policy if exists payments_admin_write on taw.payments;
create policy payments_admin_write on taw.payments
  for all using (taw.is_admin()) with check (taw.is_admin());

-- ---------- analytics: owner/admin read; inserts via service_role ----------
do $$
declare t text;
begin
  foreach t in array array['ad_impressions','ad_clicks'] loop
    execute format('drop policy if exists %I_owner_read on taw.%I', t, t);
    execute format($f$
      create policy %I_owner_read on taw.%I for select
        using (taw.owns_business(%I.business_id) or taw.is_admin())
      $f$, t, t, t);
  end loop;
end $$;
-- Event writes are done server-side with the service_role key (RLS bypassed),
-- so anonymous page views can be recorded without a client-side INSERT policy.

-- ---------- conversations ----------
drop policy if exists convo_read on taw.conversations;
create policy convo_read on taw.conversations
  for select using (
    customer_id = auth.uid() or taw.owns_business(business_id) or taw.is_admin()
  );
drop policy if exists convo_insert on taw.conversations;
create policy convo_insert on taw.conversations
  for insert with check (
    customer_id = auth.uid() or taw.owns_business(business_id) or taw.is_admin()
  );
drop policy if exists convo_update on taw.conversations;
create policy convo_update on taw.conversations
  for update using (
    customer_id = auth.uid() or taw.owns_business(business_id) or taw.is_admin()
  ) with check (
    customer_id = auth.uid() or taw.owns_business(business_id) or taw.is_admin()
  );

-- ---------- messages (via parent conversation; sender must be a participant) ----------
drop policy if exists messages_read on taw.messages;
create policy messages_read on taw.messages
  for select using (exists (
    select 1 from taw.conversations c where c.id = messages.conversation_id
    and (c.customer_id = auth.uid() or taw.owns_business(c.business_id) or taw.is_admin())
  ));
drop policy if exists messages_insert on taw.messages;
create policy messages_insert on taw.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from taw.conversations c where c.id = messages.conversation_id
      and (c.customer_id = auth.uid() or taw.owns_business(c.business_id))
    )
  );
drop policy if exists messages_update_read on taw.messages;
create policy messages_update_read on taw.messages
  for update using (exists (
    select 1 from taw.conversations c where c.id = messages.conversation_id
    and (c.customer_id = auth.uid() or taw.owns_business(c.business_id))
  )) with check (exists (
    select 1 from taw.conversations c where c.id = messages.conversation_id
    and (c.customer_id = auth.uid() or taw.owns_business(c.business_id))
  ));

-- ---------- promo_email_campaigns: owner + admin ----------
drop policy if exists campaigns_owner_all on taw.promo_email_campaigns;
create policy campaigns_owner_all on taw.promo_email_campaigns
  for all using (taw.owns_business(business_id) or taw.is_admin())
  with check (taw.owns_business(business_id) or taw.is_admin());

-- ---------- audit_log: admin read only; writes via service_role ----------
drop policy if exists audit_admin_read on taw.audit_log;
create policy audit_admin_read on taw.audit_log
  for select using (taw.is_admin());
-- No client INSERT/UPDATE/DELETE policies: append-only, written by service_role.

-- =============================================================================
-- GRANTS
-- =============================================================================
-- Let the standard Supabase roles reach the schema; RLS still governs rows.
grant usage on schema taw to anon, authenticated, service_role;
grant select on all tables in schema taw to anon, authenticated;
grant insert, update, delete on all tables in schema taw to authenticated;
grant all on all tables in schema taw to service_role;
grant execute on all functions in schema taw to anon, authenticated, service_role;

alter default privileges in schema taw grant select on tables to anon, authenticated;
alter default privileges in schema taw grant insert, update, delete on tables to authenticated;
alter default privileges in schema taw grant all on tables to service_role;
alter default privileges in schema taw grant execute on functions to anon, authenticated, service_role;

-- =============================================================================
-- END
-- =============================================================================
