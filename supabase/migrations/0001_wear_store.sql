-- =============================================================================
-- 0001 — `wear` tenant schema for the True American Wear store.
-- Mirrors the bondandfifth store architecture (WalkPerro DB, schema-per-tenant,
-- default-deny RLS, service-role-only access) with two adaptations:
--   * product_sizes — the size dimension a clothing store needs
--   * Stripe (payment_intent) instead of Square
-- Idempotent: safe to re-run.
-- =============================================================================

create schema if not exists wear;

-- ---------- helpers ----------
create or replace function wear.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create sequence if not exists wear.order_number_seq;

create or replace function wear.gen_order_number()
returns text language sql volatile as $$
  select 'WEAR-' || to_char(now(), 'YYYY') || '-' ||
         lpad(nextval('wear.order_number_seq')::text, 4, '0');
$$;

-- ---------- enums (idempotent) ----------
do $$ begin
  create type wear.product_status as enum ('active','sold','draft');
exception when duplicate_object then null; end $$;
do $$ begin
  create type wear.order_status as enum ('pending','confirmed','fulfilled','cancelled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type wear.payment_status as enum ('pending','paid','failed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type wear.discount_type as enum ('percent','fixed');
exception when duplicate_object then null; end $$;

-- ---------- catalog ----------
create table if not exists wear.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists wear.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  slug text unique not null,
  name text not null,
  subtitle text,
  description text,
  category_id uuid references wear.categories(id) on delete set null,
  price_cents int not null,
  currency text not null default 'usd',
  status wear.product_status not null default 'active',
  featured boolean not null default false,
  hidden boolean not null default false,
  free_shipping boolean not null default false,
  inventory int,                       -- product-level fallback; null = untracked
  badge text,
  release_note text,
  materials text[] not null default '{}',
  details text[] not null default '{}',
  sort_order int not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists wear.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references wear.products(id) on delete cascade,
  storage_path text,
  public_url text not null,
  alt text,
  is_primary boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists wear.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references wear.products(id) on delete cascade,
  label text not null,                 -- colorway/style, e.g. "White" / "Black"
  sku_suffix text,
  price_cents_override int,
  storage_path text,
  public_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The clothing adaptation: per-product sizes with optional per-size inventory.
-- Sets use namespaced sizes ("garment:M", "shoe:us_10") so one product can
-- carry two size dimensions; plain garments use bare sizes ("M").
create table if not exists wear.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references wear.products(id) on delete cascade,
  size text not null,
  inventory int,                       -- null = untracked
  sort_order int not null default 0,
  unique (product_id, size)
);

-- ---------- orders ----------
create table if not exists wear.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default wear.gen_order_number(),
  confirmation_token text unique not null default replace(gen_random_uuid()::text, '-', ''),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  shipping_address jsonb,
  billing_address jsonb,
  subtotal_cents int not null default 0,
  shipping_cents int not null default 0,
  discount_code text,
  discount_cents int not null default 0,
  total_cents int not null default 0,
  status wear.order_status not null default 'pending',
  payment_status wear.payment_status not null default 'pending',
  stripe_payment_intent_id text unique,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists wear.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references wear.orders(id) on delete cascade,
  product_id uuid references wear.products(id) on delete set null,
  product_name text not null,          -- snapshot at purchase time
  product_sku text,
  variant_id uuid,                     -- soft reference
  variant_label text,
  size text,
  unit_price_cents int not null,
  quantity int not null default 1,
  line_total_cents int not null,
  image_url text,
  created_at timestamptz not null default now()
);
create index if not exists idx_order_items_order on wear.order_items(order_id);

-- ---------- marketing ----------
create table if not exists wear.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  description text,
  discount_type wear.discount_type not null,
  discount_value int not null,         -- percent 0-100 OR cents
  active boolean not null default true,
  expires_at timestamptz,
  max_redemptions int,
  times_redeemed int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists wear.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  status text not null default 'subscribed',   -- subscribed | unsubscribed
  source text,
  unsubscribe_token text unique not null default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- content / settings ----------
create table if not exists wear.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- analytics / ops ----------
create table if not exists wear.events (
  id bigint generated always as identity primary key,
  event_type text not null,            -- page_view | product_view | add_to_cart | purchase
  path text,
  product_id uuid,
  session_id text,
  referrer text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists idx_events_type_time on wear.events(event_type, created_at desc);

create table if not exists wear.rate_limits (
  id bigint generated always as identity primary key,
  bucket text not null,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_rate_limits_lookup on wear.rate_limits(bucket, ip_hash, created_at desc);

create table if not exists wear.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_email text not null,
  action text not null,
  entity text,
  entity_id text,
  diff jsonb,
  created_at timestamptz not null default now()
);

-- ---------- updated_at triggers ----------
do $$
declare t text;
begin
  foreach t in array array[
    'categories','products','product_variants','orders','coupons','subscribers','site_settings'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on wear.%I', t);
    execute format(
      'create trigger set_updated_at before update on wear.%I
         for each row execute function wear.set_updated_at()', t);
  end loop;
end $$;

-- ---------- RLS: default-deny (no policies). Service role only. ----------
do $$
declare t text;
begin
  foreach t in array array[
    'categories','products','product_images','product_variants','product_sizes',
    'orders','order_items','coupons','subscribers','site_settings',
    'events','rate_limits','admin_audit_log'
  ]
  loop
    execute format('alter table wear.%I enable row level security', t);
    execute format('alter table wear.%I force row level security', t);
  end loop;
end $$;

-- ---------- grants (service role only) ----------
grant usage on schema wear to service_role;
grant all on all tables in schema wear to service_role;
grant all on all sequences in schema wear to service_role;
grant all on all functions in schema wear to service_role;
alter default privileges in schema wear grant all on tables to service_role;
alter default privileges in schema wear grant all on sequences to service_role;
alter default privileges in schema wear grant all on functions to service_role;
