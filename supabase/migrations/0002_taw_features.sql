-- =============================================================================
-- 0002 — notifications, review reports, TV-spot videos & credits, site_content
-- Idempotent: safe to re-run. Follows 0001 conventions (FORCE RLS + SECURITY
-- DEFINER helpers taw.is_admin() / taw.owns_business()).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- site_content — closes the DDL gap: this table was created ad hoc in the live
-- DB (key text pk, value jsonb, updated_at) and used by src/lib/content.ts.
-- Shape below matches the live table exactly.
-- -----------------------------------------------------------------------------
create table if not exists taw.site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- notifications — in-app inbox; inserts happen via the service client only.
-- -----------------------------------------------------------------------------
create table if not exists taw.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references taw.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_notif_user on taw.notifications(user_id, created_at desc);
create index if not exists idx_notif_user_unread on taw.notifications(user_id, created_at desc)
  where read_at is null;
-- Race-safe welcome dedupe: at most one 'welcome' row per user, enforced by the DB.
create unique index if not exists uq_notif_welcome on taw.notifications(user_id)
  where type = 'welcome';

-- -----------------------------------------------------------------------------
-- review_reports — user-submitted flags that feed the admin moderation queue.
-- -----------------------------------------------------------------------------
create table if not exists taw.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references taw.reviews(id) on delete cascade,
  reporter_id uuid not null references taw.profiles(id) on delete cascade,
  reason text not null check (reason in ('spam','offensive','conflict_of_interest','not_a_customer','other')),
  note text,
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  resolved_by uuid references taw.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (review_id, reporter_id)
);
create index if not exists idx_reports_status on taw.review_reports(status, created_at desc);
create index if not exists idx_reports_review on taw.review_reports(review_id);

-- -----------------------------------------------------------------------------
-- business_videos extensions — TV spots. AI-created rows have no URL until a
-- worker renders them, so url becomes nullable. Legacy rows default to 'ready'.
-- -----------------------------------------------------------------------------
alter table taw.business_videos alter column url drop not null;
alter table taw.business_videos add column if not exists status text not null default 'ready';
alter table taw.business_videos add column if not exists source text not null default 'upload';
alter table taw.business_videos add column if not exists duration_seconds int;
alter table taw.business_videos add column if not exists rejection_reason text;
alter table taw.business_videos add column if not exists credits_spent int not null default 0;
alter table taw.business_videos add column if not exists brief jsonb not null default '{}'::jsonb;

do $$ begin
  alter table taw.business_videos add constraint business_videos_status_check
    check (status in ('pending','ready','rejected'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table taw.business_videos add constraint business_videos_source_check
    check (source in ('upload','ai_motion','ai_premium'));
exception when duplicate_object then null; end $$;

create index if not exists idx_videos_pending on taw.business_videos(status)
  where status = 'pending';

-- -----------------------------------------------------------------------------
-- video_credits — append-only ledger. Balance = sum(delta) per business.
-- stripe_session_id uniqueness is the webhook idempotency guarantee.
-- -----------------------------------------------------------------------------
create table if not exists taw.video_credits (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references taw.businesses(id) on delete cascade,
  delta int not null,
  reason text not null,
  addon_purchase_id uuid references taw.addon_purchases(id) on delete set null,
  stripe_session_id text,
  created_at timestamptz not null default now()
);
create unique index if not exists uq_vc_stripe_session on taw.video_credits(stripe_session_id)
  where stripe_session_id is not null;
create index if not exists idx_vc_biz on taw.video_credits(business_id);

-- Atomic check-and-debit; the advisory xact lock serializes concurrent spends
-- for the same business so the balance can never go negative.
create or replace function taw.spend_video_credits(p_business_id uuid, p_cost int, p_reason text)
returns boolean
language plpgsql security definer set search_path = taw, public as $$
begin
  if p_cost <= 0 then
    return false;
  end if;
  perform pg_advisory_xact_lock(hashtext(p_business_id::text));
  if (select coalesce(sum(delta), 0) from taw.video_credits where business_id = p_business_id) < p_cost then
    return false;
  end if;
  insert into taw.video_credits (business_id, delta, reason)
  values (p_business_id, -p_cost, p_reason);
  return true;
end $$;

-- -----------------------------------------------------------------------------
-- updated_at trigger for site_content (others are insert-only or immutable)
-- -----------------------------------------------------------------------------
drop trigger if exists trg_set_updated_at on taw.site_content;
create trigger trg_set_updated_at before update on taw.site_content
  for each row execute function taw.set_updated_at();

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['site_content','notifications','review_reports','video_credits']
  loop
    execute format('alter table taw.%I enable row level security', t);
    execute format('alter table taw.%I force row level security', t);
  end loop;
end $$;

-- site_content: world-readable (public copy), admin-writable.
drop policy if exists site_content_select_all on taw.site_content;
create policy site_content_select_all on taw.site_content
  for select using (true);
drop policy if exists site_content_admin_write on taw.site_content;
create policy site_content_admin_write on taw.site_content
  for all using (taw.is_admin()) with check (taw.is_admin());

-- notifications: read/update own (mark-read); service client does inserts.
drop policy if exists notif_select_own on taw.notifications;
create policy notif_select_own on taw.notifications
  for select using (user_id = auth.uid() or taw.is_admin());
drop policy if exists notif_update_own on taw.notifications;
create policy notif_update_own on taw.notifications
  for update using (user_id = auth.uid() or taw.is_admin())
  with check (user_id = auth.uid() or taw.is_admin());
drop policy if exists notif_admin_insert on taw.notifications;
create policy notif_admin_insert on taw.notifications
  for insert with check (taw.is_admin());

-- review_reports: users file their own; admins see and resolve everything.
drop policy if exists reports_insert_own on taw.review_reports;
create policy reports_insert_own on taw.review_reports
  for insert with check (reporter_id = auth.uid());
drop policy if exists reports_select_own on taw.review_reports;
create policy reports_select_own on taw.review_reports
  for select using (reporter_id = auth.uid() or taw.is_admin());
drop policy if exists reports_admin_update on taw.review_reports;
create policy reports_admin_update on taw.review_reports
  for update using (taw.is_admin()) with check (taw.is_admin());

-- video_credits: owners can read their ledger; only the service client writes.
drop policy if exists vc_select_owner on taw.video_credits;
create policy vc_select_owner on taw.video_credits
  for select using (taw.owns_business(business_id) or taw.is_admin());
drop policy if exists vc_admin_write on taw.video_credits;
create policy vc_admin_write on taw.video_credits
  for insert with check (taw.is_admin());

-- Grants (0001 grants schema usage; new tables need explicit table grants).
grant select on taw.site_content to anon, authenticated;
grant select, update on taw.notifications to authenticated;
grant select, insert on taw.review_reports to authenticated;
grant select on taw.video_credits to authenticated;
grant all on taw.site_content, taw.notifications, taw.review_reports, taw.video_credits to service_role;
