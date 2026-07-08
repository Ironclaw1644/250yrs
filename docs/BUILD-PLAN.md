# True American Where — Master Build Plan

**Role:** Lead engineer reconciliation of `docs/architecture/01–06`.
**Method:** Karpathy — get ONE thin, real, end-to-end vertical slice working (one
`country → state → city → category → business` page + auth + one paying-business flow),
then generalize outward. Ship spine before surface area.

**Stack (locked):** Next.js 15.5 App Router · React 19 · TypeScript · Tailwind 3.4 · pnpm ·
Vercel · Supabase project **WalkPerro** (`kflzqkuioiiyfrvlvcvl`), schema **`taw`** (never `public`) ·
Supabase Auth (RBAC: customer / business_owner / admin) · Stripe (Rail A embedded subscription +
Rail B Connect Express) · Resend · OpenAI image API (demo photos only) · Font Awesome (never emoji).

This plan is the single source of truth. Where the six specs disagreed, the resolutions are in
**§ Cross-doc conflicts & gaps resolved** and are applied throughout the phases below.

---

## Guiding rules baked into every phase

- **`01-schema.sql` is the canonical data model.** Where `02-stripe.md` / `04-IA.md` use different
  table names, we keep the `01` names and add the Stripe-only helper tables as an additive migration
  (see conflicts §C1). No table lives in `public`.
- **Stripe is TEST-mode now, ENV-driven, one-config live cutover.** No key, price id, or account id
  is ever hardcoded — all via env. Isolate Connect behind `lib/stripe/connect.ts`.
- **Entitlements (ad live, ordering enabled, add-on active) are webhook-derived**, never trusted from a
  checkout return page or the client.
- **RLS default-deny + FORCE on every table.** Public = anon key (published rows only). Owner = own rows.
  Admin + all webhooks/server-side writes = service_role (bypasses RLS).
- **pSEO quality gate is a launch blocker, not a nice-to-have:** a hub indexes only with ≥3 listings;
  ≥60% unique content; demo listings excluded from Review/AggregateRating schema.
- **Front end SIMPLE/warm (light), admin DENSE (dark)** — one token set, two groundings.

---

## PHASE 0 — Repo prep & pivot scaffolding

**Goal:** The existing clothing repo becomes the TAW skeleton without breaking the live site; env,
design tokens, and the schema exist and are applied.

**Tasks**
- Inventory the current `src/app`, `@/lib/seo`, existing `sitemap.ts`/`robots.ts`, existing gallery
  components (reuse `PhotoGallery`/`LightboxGallery`).
- Create the App Router route groups: `(public)`, `(customer)`, `(business)`, `(admin)`, `(auth)`, `api/`.
- Add design system: paste `03-tailwind-tokens.ts` into `tailwind.config.ts`, add `03-globals.css`
  (CSS vars, textures, `.sign-plate`, `.pinstripe`, `.paper-grain`). Self-host **Fraunces** + **Public Sans**
  (+ optional Spline Sans Mono) with `font-display: swap` (SEO + brand mandate forbids Inter/Roboto).
- Wire Font Awesome (Solid + Duotone), build the `Icon` wrapper (never emoji).
- Apply `01-schema.sql` to Supabase WalkPerro (idempotent) via migration. Generate TS types.
- Create Supabase Storage buckets: `business-photos`, `business-videos`, `demo`.
- Stand up `lib/supabase/{server,anon,service}.ts` clients and `lib/stripe/server.ts`.
- Land the additive Stripe-helper migration (`stripe_customers`, `stripe_events`, `refunds` — see §C1).
- Legacy redirects: `/shop`, `/shop/[slug]` → 301; keep `NEXT_PUBLIC_SITE_URL` as canonical host.

**Files/routes:** `tailwind.config.ts`, `src/app/globals.css`, `src/app/(group)/layout.tsx` ×5,
`src/lib/supabase/*`, `src/lib/stripe/server.ts`, `src/components/Icon.tsx`,
`supabase/migrations/0001_taw_core.sql`, `0002_stripe_helpers.sql`.

**v1:** all of the above. **Deferred:** domain swap to trueamericanwhere.com (edge 301s later).

---

## PHASE 1 — The thin vertical slice (read path): one real business page, server-rendered

**Goal:** A single seeded business is reachable at its canonical URL through the full geo spine, rendered
server-side with correct metadata + JSON-LD. Proves the schema, RLS anon read, routing, and SEO plumbing
end-to-end before any generalization.

**Tasks**
- Hand-seed the minimum spine: `US → Kentucky → Berea → Fried Food → "Big Al's Fish Fry"` (one row each,
  `is_demo=true`, `status='published'`, one photo, hours, 3 menu items). This is the Karpathy "one of each."
- Build the five nested routes as Server Components reading via **anon client** (RLS-scoped):
  - `/[country]` · `/[country]/[state]` · `/[country]/[state]/[city]` ·
    `/[country]/[state]/[city]/[category]` · `/[country]/[state]/[city]/[category]/[business]`.
- Business detail page: name, NAP, **Call Now**, `PhotoGallery`, hours + `OpenNowPill`, `MenuList`,
  map + directions, `Breadcrumbs` (visible + `BreadcrumbList` JSON-LD), `DemoBadge`.
- `generateMetadata` per template (title/meta from **real data**, one H1, self-canonical).
- LocalBusiness + subtype JSON-LD (no Review/AggregateRating on demo).
- Confirm slug resolution + 404 for unknown segments.

**Files/routes:** `src/app/(public)/[country]/.../page.tsx` (5 levels), `src/lib/seo/jsonld.ts`,
`src/components/{Breadcrumbs,BusinessCard,HoursTable,OpenNowPill,MenuList,DemoBadge,Map,CallNowButton}.tsx`.

**v1:** full read spine + SEO metadata/JSON-LD. **Deferred:** filters, pagination, `generateSitemaps()`,
featured slots, reviews (later phases).

---

## PHASE 2 — Auth + RBAC + profiles

**Goal:** Users can sign up / sign in; a `profiles` row with a `role` exists; middleware gates the route
groups; server actions have `assertRole()` guards. This is the second half of the "auth" slice.

**Tasks**
- Supabase Auth email/password (+ optional magic link). Confirm the `on_auth_user_created` trigger
  populates `taw.profiles`.
- `(auth)` routes: `/login`, `/signup`, `/reset`, and a **role-select** step (customer vs business owner;
  admin is never self-serve — set by admin/service_role only per schema note §3).
- Middleware enforces role at each group boundary; `lib/auth/guards.ts` → `requireUser`,
  `requireBusinessOwner`, `assertAdmin`, `owns(businessId)` (mirror the SQL helpers).
- Minimal `(customer)/account` and `(business)/dashboard` shells so a logged-in user lands somewhere.
- Verify RLS live: anon sees only published; owner sees own drafts; admin sees all.

**Files/routes:** `src/middleware.ts`, `src/app/(auth)/*`, `src/lib/auth/guards.ts`,
`src/app/(customer)/account/page.tsx`, `src/app/(business)/dashboard/page.tsx`.

**v1:** email/password + RBAC + guards. **Deferred:** OAuth providers, impersonation-safe admin view.

---

## PHASE 3 — The one paying-business flow (Rail A: advertising subscription, embedded)

**Goal:** A real business owner creates a listing and pays $19.99/mo **or** $100/yr via **Embedded
Checkout on-site (no redirect)**, and the listing **auto-publishes from the webhook**. This completes the
Karpathy end-to-end slice: content → auth → money → live listing.

**Tasks**
- Idempotent price seed script `scripts/stripe-seed-prices.ts` (lookup_keys `taw_ad_monthly`,
  `taw_ad_annual`) → prints ids to paste into env.
- Owner onboarding wizard (guided, one-thing-per-screen): basics → location/category → checkout.
  Creates a `businesses` row in `status='draft'`, `owner_id=auth.uid()`.
- Server action `createAdvertisingCheckout(businessId, plan)` → `getOrCreateStripeCustomer` →
  `checkout.sessions.create({ ui_mode:'embedded', mode:'subscription', ... })` → return `client_secret`.
- `CheckoutEmbed` client component (`EmbeddedCheckoutProvider`).
- **Account webhook** route `/api/webhooks/stripe`: raw-body verify, dedupe via `taw.stripe_events`,
  handle `checkout.session.completed` (sub) / `customer.subscription.created|updated|deleted` /
  `invoice.paid|payment_failed` → upsert `taw.subscriptions`, set `businesses.plan_tier` +
  `status='published'` + `published_at`, send Resend welcome.
- `/advertising/return` reads the session for best-effort UX only (webhook is source of truth).
- Resend branded HTML email wrapper + welcome/receipt/dunning templates.

**Files/routes:** `src/app/(business)/dashboard/onboarding/*`, `.../[businessId]/ads/*`,
`src/app/api/webhooks/stripe/route.ts`, `src/lib/stripe/{subscriptions,customers}.ts`,
`src/lib/email/{resend,templates}.ts`, `scripts/stripe-seed-prices.ts`.

**v1:** monthly/annual subscribe + auto-publish + welcome email. **Deferred:** add-ons, plan switch/cancel
UI (Phase 8), Customer Portal, trials.

> **End of the thin slice.** Everything above is the spine. Everything below generalizes it.

---

## PHASE 4 — Owner listing management (make the listing real & editable)

**Goal:** Owners fully control their listing content — the uniqueness fuel for pSEO.

**Tasks**
- Listing editor (name/desc/NAP/category primary+secondary), `PhotoUploader` (Supabase Storage),
  `HoursEditor`, `MenuEditor` (sections→items, cents), `services` editor, `CouponEditor` + daily specials.
- `NextStepsChecklist` (painted stamps): Add photos → Set hours → Post a special → Go live.
- On owner edit → `revalidatePath()` the affected public routes (ISR freshness for SEO).
- Owner-scoped RLS writes verified (`owns_business`).

**Files/routes:** `src/app/(business)/dashboard/[businessId]/{listing,photos,menu,hours,coupons}/*`,
`src/components/{PhotoUploader,MenuEditor,HoursEditor,CouponEditor,NextStepsChecklist}.tsx`.

**v1:** all editors + revalidation. **Deferred:** video upload (gated behind paid add-on, Phase 8).

---

## PHASE 5 — Reviews, favorites, engagement

**Goal:** First-party review stream (the SEO moat) + customer save/engagement.

**Tasks**
- `ReviewForm` (customer-auth gated) → posts to moderation (`moderation_status` default visible; trigger
  keeps `rating_avg/count`). `ReviewList` + owner inline response.
- `SaveFavoriteButton` / `/account/favorites`.
- Real reviews power `AggregateRating`/`Review` JSON-LD — **demo excluded** (matches visible content).
- Resend post-transaction "leave a review" prompt (wire the sender; volume ramps later).

**Files/routes:** `.../[business]/review/page.tsx`, `src/app/(customer)/account/{favorites,reviews}/*`,
`src/components/{ReviewList,ReviewForm,SaveFavoriteButton}.tsx`.

**v1:** reviews + favorites + real-review schema. **Deferred:** review-velocity email cadence tuning.

---

## PHASE 6 — Marketplace Rail B: Connect onboarding + one order flow

**Goal:** A business connects a payout account (Express) and a customer pays for a **food order** via a
**destination charge + application fee**, on-site with Payment Element. Generalize to bookings + tire after.

**Tasks**
- `lib/stripe/connect.ts` (isolated so Accounts v2 is a one-file swap): `accounts.create({type:'express'})`,
  `accountLinks.create` (onboarding), `createLoginLink`.
- `/dashboard/[businessId]/payouts`: `ConnectOnboardCard`, `refresh`/`return` handlers; ordering UI gated on
  `connect_accounts.charges_enabled=true`.
- **Connect webhook** `/api/webhooks/stripe/connect` (separate signing secret): `account.updated` →
  update `stripe_connect_accounts`; capability/deauthorized events.
- Order flow `/[...]/[business]/order`: `Cart` → server-computed totals → `paymentIntents.create` with
  `application_fee_amount` + `transfer_data.destination` + `on_behalf_of` → `CheckoutEmbed` (Payment Element).
- Account webhook: `payment_intent.succeeded` → `orders.status='paid'`, write `payments` ledger row,
  notify business + customer.
- Then generalize the identical pipeline to **bookings** (`SlotPicker`) and **service_requests** (tire).

**Files/routes:** `src/app/api/webhooks/stripe/connect/route.ts`,
`src/app/(public)/[...]/[business]/{order,book,tire-service}/*`,
`src/lib/stripe/{connect,marketplace}.ts`, `src/components/{Cart,CheckoutEmbed,SlotPicker,OrderStatusBadge}.tsx`.

**v1:** Connect onboarding + food order + booking + tire request, all destination charges. Refund server
action + `taw.refunds`. **Deferred:** payout status surfacing, disputes UI polish, guest checkout
(pending client answer — see §C4), foreign-business Rail B (display-only for v1).

---

## PHASE 7 — pSEO generalization: templates, eligibility gate, sitemaps

**Goal:** Turn the one hardcoded slice into the programmatic engine — safely.

**Tasks**
- Make all five templates fully data-driven with `generateStaticParams` (SSG head hubs) + ISR long tail.
- **Eligibility rule:** a `city+category` hub renders indexable only with **≥3 listings**; else `noindex`
  or 301 to city hub. Never emit a page a data row can't support.
- **≥60% unique content** composition: data-derived hub intros ("12 barber shops in East Nashville, avg 4.6,
  4 open Sundays"), ItemList, sibling links (other categories same city; same category nearby cities).
- Replace static-`lastModified` sitemap with **`generateSitemaps()`** index, segmented (hubs / businesses /
  blog), `lastmod` from real `updated_at`.
- `robots.ts`: allow public tree; disallow dashboard/checkout/api/`?`-filter URLs; reference sitemap index.
- hreflang (`en-US`, `en-JM`, `x-default`); FAQPage + full LocalBusiness-subtype schema across templates;
  Rich Results validation in CI.
- Search (`/search`, `/near-me`, `/api/search`) with haversine + bounding-box prefilter (no PostGIS).
- Pruning loop (noindex zero-impression/stale after 90 days).

**Files/routes:** all `(public)` templates, `src/app/sitemap.ts` (+ `generateSitemaps`), `robots.ts`,
`src/app/api/search/route.ts`, `src/lib/seo/{eligibility,intro,hreflang}.ts`.

**v1:** templates + eligibility + segmented sitemaps + schema + search. **Deferred:** blog/roundups,
Indexing API submission, AI-visibility tracking.

---

## PHASE 8 — Paid add-ons + subscription self-management

**Goal:** Monetization surface beyond the base subscription.

**Tasks**
- Recurring add-ons (video ad, featured city/state, daily specials) as **extra subscription items**
  (`subscriptions.update`) → single consolidated invoice; entitlements from webhook into
  `addon_purchases`. Featured flags (`featured_city/state`, `featured_until`) drive `SponsoredSlot`.
- One-time add-ons (coupon campaign, promo email) via separate embedded `mode:'payment'` Checkout →
  webhook creates campaign / enqueues Resend blast.
- Plan switch (monthly⇄annual) + cancel (`cancel_at_period_end`) via minimal on-site buttons **and/or**
  Stripe Customer Portal (pending §C3 client decision).
- `VideoUploader` gated on active video-ad entitlement.

**Files/routes:** `.../[businessId]/{ads,video}/*`, `src/lib/stripe/addons.ts`,
`src/components/{AddOnToggle,SubscriptionPanel}.tsx`, `src/app/api/webhooks/stripe` (extend handlers).

**v1:** all six add-ons + featured placement + cancel/switch. **Deferred:** proration policy (§C3), tax (§C4).

---

## PHASE 9 — Owner analytics + messaging

**Goal:** "How many people viewed my ad" + owner↔customer contact.

**Tasks**
- Server-side event capture (service_role) into `ad_impressions`/`ad_clicks` (view, call, directions,
  coupon, share, video). Owner `AnalyticsCards` + `BarChart` (bondandfifth pattern).
- `conversations`/`messages` threads (`MessageThread`) for owner + customer.

**Files/routes:** `.../[businessId]/{analytics,messages}/*`, `src/app/(customer)/account/messages/*`,
`src/lib/analytics/track.ts`, `src/components/{AnalyticsCards,BarChart,MessageThread}.tsx`.

**v1:** analytics + messaging. **Deferred:** GA4/GSC dashboards (external), payout charts.

---

## PHASE 10 — Admin portal (dense, dark, RBAC + service_role)

**Goal:** Robust moderation/management, matching the bondandfifth pattern with real RBAC.

**Tasks**
- `AdminShell` (dark), server actions `FormData → assertAdmin() → audit() → revalidatePath()`, every
  mutation writes `taw.audit_log`.
- Sections: dashboard KPIs; businesses (approve/flag/**takedown**); users + **role management**; reviews
  queue; categories; locations/seeding; subscriptions; connect accounts; orders; bookings; coupons;
  campaigns (Resend); audit-log viewer; settings (feature flags, pricing, demo-seed toggles, Stripe-mode
  indicator). `DataTable`+`Filters`, `StatusControls`, `RefundButton`, `CsvExportButton`.

**Files/routes:** `src/app/(admin)/admin/*`, `src/components/admin/*`, `src/lib/admin/{audit,guards}.ts`.

**v1:** moderation, RBAC, subscriptions/connect/orders oversight, refunds, audit, CSV. **Deferred:**
advanced dispute workflow, impersonation.

---

## PHASE 11 — Full demo seed + launch hardening

**Goal:** The site looks alive and is launch-ready.

**Tasks**
- Seed **all US states + major cities + all 14 categories** + demo businesses (OpenAI images →
  `demo` bucket, `is_demo=true`, `owner_id=NULL`), plus **Jamaica → Kingston → Barber Shops**. Idempotent
  seed script; demo rows carry the visible "Demo" badge and are excluded from rating schema.
- Publish in **waves** (≈1,300 priority `[category] in top-100-metro` hubs first), respecting the
  eligibility gate; internally link from home/state/city tiers.
- Policy pages wired in footer + at checkout (`/terms,/privacy,/cookies,/refunds,/help/*`); cookie CMP +
  GPC honoring; **ARL** click-to-cancel + renewal reminders; register **DMCA agent**.
- Core Web Vitals budget verified on mobile (LCP<2.5s / INP<200ms / CLS<0.1), Next/Image everywhere.
- CI: build, typecheck, RLS smoke tests, Rich Results validation.

**Files/routes:** `scripts/seed-{geo,categories,demo-businesses}.ts`, `src/app/(public)/{terms,privacy,...}`,
`src/components/CookieConsent.tsx`, `.github/workflows/ci.yml`.

**v1:** full seed, waved publish, legal/CMP/ARL/DMCA, CWV. **Deferred:** blog content, backlink/PR program,
domain swap to trueamericanwhere.com, Stripe live cutover (client invite).

---

## Cross-doc conflicts & gaps resolved

- **C1 — Table names diverge across docs.** `01-schema.sql` (canonical) uses `stripe_connect_accounts`,
  a **unified `payments` ledger**, unified `orders` (+ `bookings`, `service_requests`), and `audit_log`.
  `02-stripe.md` and `04-IA.md` use `connect_accounts`, per-kind `orders`, `admin_audit_log`, and add
  `stripe_customers`, `stripe_events`, `refunds`, `subscription_addons`, `feature_flags`,
  `business_categories`. **Resolution:** `01` wins for everything it defines; map the stripe-doc names onto
  `01`'s names in code (`connect_accounts`→`stripe_connect_accounts`, `admin_audit_log`→`audit_log`,
  add-ons→`addon_purchases`). Add the genuinely missing helper tables (`stripe_customers`, `stripe_events`
  idempotency ledger, `refunds`) and `business_categories` (secondary categories, referenced by IA §0.1)
  and `feature_flags` as an **additive migration `0002`** — don't fork the model.
- **C2 — `orders.status` default.** Schema defaults `orders.status='pending'` but the enum includes `'cart'`;
  the order flow starts a cart. **Resolution:** create orders in `'cart'`, advance to `'pending'`→`'paid'`
  via server action/webhook; treat schema default as a fallback only.
- **C3 — Add-on price model.** `02-stripe.md` models featured/video/specials as **recurring subscription
  items**; `01`'s `addon_purchases` has one-off `starts_at/ends_at`. **Resolution:** recurring add-ons live
  as Stripe subscription items AND mirror an entitlement row in `addon_purchases`(recurring) so placement
  queries have one place to read; one-time add-ons are standalone. Entitlements always webhook-derived.
- **C4 — Open questions still needing the client** (from `02-stripe.md §11`, carried forward, do NOT block
  the thin slice): Accounts v1-Express vs v2 (build v1, isolated); Customer Portal redirect acceptable?;
  platform fee bps (default 10%+30¢, per-category?); downgrade proration; foreign-business Rail B
  (recommend **display-only** demos, no payouts); **guest checkout** yes/no (affects `orders.customer_id`
  nullability + receipts); Stripe Tax scope. Flag before Phase 6/8.
- **C5 — "No redirect" scope.** Mandate = no redirect at the **subscribe** moment (satisfied by Embedded
  Checkout). Connect **onboarding** redirect and Customer Portal are acceptable per `02-stripe.md`; confirm
  under C4 if the client wants zero redirects anywhere.
- **C6 — pSEO thin-content vs "seed everything" tension.** SEO doc demands the ≥3-listing eligibility gate
  and waved publishing; the launch brief wants a lively seeded site. **Resolution:** demo listings satisfy
  the eligibility count (clearly flagged, excluded from rating schema) so hubs look full without emitting
  misleading structured data — reconciles both.
- **C7 — Categories count.** Brand brief lists 14 categories (incl. general mom-and-pop); SEO doc says "13".
  **Resolution:** 14 is authoritative (seed all, incl. general `fa-store`).

---

## Top risks

1. **Stripe Connect complexity** — dual webhooks/secrets, destination-charge + application-fee correctness,
   fee-clawback on refunds (`refund_application_fee` + `reverse_transfer`), fee must exceed Stripe's
   ~2.9%+30¢, and the unresolved v1/v2 + guest-checkout + foreign-payout questions (C4). Highest-effort,
   most-failure-modes area; keep it isolated behind `lib/stripe/connect.ts` and drive with `stripe listen`/
   `trigger` before real flows.
2. **RLS correctness** — `FORCE`d default-deny on ~30 tables with SECURITY DEFINER role helpers; a single
   wrong policy either leaks another owner's/customer's private data or blocks legitimate reads. Must be
   verified with automated per-role smoke tests (anon/customer/owner/admin), not assumed.
3. **pSEO thin-content / doorway penalty** — tens of thousands of templated URLs can get the whole site
   suppressed if the ≥3-listing eligibility gate, ≥60% uniqueness, demo-schema exclusion, and pruning loop
   aren't actually enforced at generation time. Site-wide, hard-to-reverse risk.
4. **Scope (full marketplace in v1)** — ordering + booking + tire service + subscriptions + add-ons +
   analytics + messaging + admin + full seed is very large. The Karpathy thin slice (Phases 0–3) mitigates
   by proving the spine first; strict v1-vs-deferred discipline per phase is required to avoid sprawl.
5. **Live-cutover / secrets & legal readiness** — all Stripe/account values must stay ENV-driven so the
   client's live-account invite is a one-config swap (any hardcoded id breaks this); and launch is gated on
   real legal work: ARL click-to-cancel + reminders, DMCA agent registration, cookie CMP/GPC, and
   merchant-of-record framing — non-code blockers that can slip a launch date.

---

## ENV VARS (complete, ENV-driven, one-config live swap)

```bash
# ---- Supabase ----
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=            # SERVER ONLY — webhooks/admin/service writes
SUPABASE_DB_SCHEMA=taw               # (informational; clients set schema explicitly)

# ---- Stripe core (same var names test→live) ----
STRIPE_SECRET_KEY=                   # sk_test_… → sk_live_…  SERVER ONLY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # pk_test_… → pk_live_…
STRIPE_WEBHOOK_SECRET=               # whsec_… — ACCOUNT endpoint
STRIPE_CONNECT_WEBHOOK_SECRET=       # whsec_… — CONNECT endpoint (separate)

# ---- Rail A subscription prices ----
STRIPE_PRICE_ADVERTISING_MONTHLY=    # $19.99/mo
STRIPE_PRICE_ADVERTISING_ANNUAL=     # $100/yr

# ---- Rail A add-on prices ----
STRIPE_PRICE_ADDON_VIDEO_ADS=            # recurring
STRIPE_PRICE_ADDON_FEATURED_PLACEMENT=   # recurring
STRIPE_PRICE_ADDON_DAILY_SPECIALS=       # recurring
STRIPE_PRICE_ADDON_COUPON_CAMPAIGN=      # one-time
STRIPE_PRICE_ADDON_PROMO_EMAIL_BLAST=    # one-time

# ---- Rail B Connect ----
STRIPE_CONNECT_CLIENT_ID=            # ca_… (OAuth-style flows only)
TAW_PLATFORM_FEE_BPS=1000            # 10% application fee (read at runtime; tunable)
TAW_PLATFORM_FEE_FIXED_CENTS=30

# ---- Resend ----
RESEND_API_KEY=
RESEND_FROM_EMAIL=                   # e.g. hello@trueamericanwhere.com

# ---- OpenAI (DEMO IMAGES ONLY — no real PII) ----
OPENAI_API_KEY=

# ---- Google Maps (maps/geocoding/directions) ----
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# ---- URLs / misc ----
NEXT_PUBLIC_SITE_URL=                # https://trueamericanwear.com now → trueamericanwhere.com later
```

All secrets live in Vercel project env (never committed). Live cutover = swap the `sk`/`pk`/`whsec` trio,
regenerate the 7 price ids via the idempotent seed script, update the two webhook endpoint URLs, flip env.
No code change.
