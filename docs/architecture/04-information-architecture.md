# 04 — Information Architecture, Route Map & Component Inventory

**Project:** True American Where (pivot of True American Wear — same repo/domain)
**Stack:** Next.js 15.5 App Router · React 19 · TypeScript · Tailwind 3.4 · Supabase (schema `taw`) · Stripe (subscription embedded + Connect) · Resend · Font Awesome
**Design split:** Public + Business front end = SIMPLE, warm, explanatory Americana for non-technical users. Admin = dense, robust, RBAC-gated.

---

## 0. Global decisions

### 0.1 The programmatic-SEO (pSEO) URL pattern — **DECIDED**

```
/[country]/[state]/[city]/[category]                     ← category listing in a city
/[country]/[state]/[city]/[category]/[business]          ← BUSINESS DETAIL PAGE
```

Concrete examples:

| Purpose | URL |
|---|---|
| Country hub | `/us` |
| State hub | `/us/kentucky` |
| City hub | `/us/kentucky/berea` |
| Category-in-city listing | `/us/kentucky/berea/fried-food` |
| **Business detail** | `/us/kentucky/berea/fried-food/big-als-fish-fry` |
| Foreign example | `/jm/kingston-parish/kingston/barber-shops/kings-cut-barbers` |

**Rationale & rules**
- **Full geo+category path is canonical.** Every business lives at exactly one canonical URL: `country/state/city/category/business-slug`. This front-loads the highest-value local-SEO keywords ("fried food berea ky") into the path and gives Google a clean crawlable tree.
- **Segments are slugs**, lowercased, hyphenated, ASCII-folded. `city` slug carries no state suffix (state already in path); collisions within a state are disambiguated at seed time (`berea` vs `berea-2`). `business` slug is unique **within its city+category**; global collisions get a numeric suffix.
- **Country = ISO-3166 alpha-2** (`us`, `jm`) so the tree is unambiguous and future-proof for international. For the US the "state" segment is the full state slug (`kentucky`), `city` is the municipality.
- **A business belongs to exactly one primary category** for its canonical URL. If it appears in secondary categories, those render the card in the other category listing but `<link rel=canonical>` always points to the primary URL (no duplicate-content penalty).
- **`sitemap.ts` is generated from the DB** (`taw.businesses` + geo tables): country → state → city → category listing → each published business. `robots.ts` already exists and stays.
- **Redirects:** legacy clothing routes (`/shop`, `/shop/[slug]`) 301 → new homepage/relevant hub during the pivot. Domain swap `trueamericanwear.com` → `trueamericanwhere.com` handled at the edge with 301s; canonical host lives in `NEXT_PUBLIC_SITE_URL`.

### 0.2 Route groups (App Router `src/app`)

```
src/app/
  (public)/          ← marketing + pSEO discovery tree + business detail (anon key, RLS)
  (customer)/        ← signed-in customer account area           (auth: customer)
  (business)/        ← business-owner dashboard                  (auth: business_owner)
  (admin)/           ← moderation/management portal              (auth: admin, service_role)
  (auth)/            ← login / signup / role-select / reset
  api/               ← route handlers: stripe webhooks, connect, search, checkout, resend
```

Each group has its own `layout.tsx` (own shell/chrome). Middleware enforces role at the group boundary; server actions re-check with `assertRole()` guards (never trust the layout alone).

---

## 1. PUBLIC site (`(public)`) — simple, warm, discovery-first

| Route | Page | Notes |
|---|---|---|
| `/` | Homepage | Hero + big search ("Find local stores near you"), category tiles (Font Awesome icons), featured/front-page paid placements, popular cities, "Own a business? List it free trial" CTA. |
| `/search` | Search results | Query + filters (category, distance, open-now, rating, coupons). Backed by `/api/search`. |
| `/near-me` | Nearby | Geolocation → nearest city hub / distance-sorted results. |
| `/[country]` | Country hub | State grid + top cities. |
| `/[country]/[state]` | State hub | City grid + top categories in state; SEO copy block. |
| `/[country]/[state]/[city]` | **City hub** | Category tiles for that city + featured businesses (paid placement) + map. |
| `/[country]/[state]/[city]/[category]` | **Category listing** | Business cards, filters, map, "sponsored" featured slots, pagination. |
| `/[country]/[state]/[city]/[category]/[business]` | **BUSINESS DETAIL** | Name, address, phone, **Call Now**, photos gallery, video ad, menu/services + prices, hours + open-now, map + directions, coupons, reviews + rating, share, **Order food / Book appointment / Request tire service** CTA (marketplace), "Save to favorites", "Demo business" flag when seeded. |
| `/[country]/[state]/[city]/[category]/[business]/order` | Order flow | Cart → checkout (Connect destination charge). |
| `/[country]/[state]/[city]/[category]/[business]/book` | Booking flow | Service + time slot → checkout. |
| `/[country]/[state]/[city]/[category]/[business]/tire-service` | Tire request | Vehicle + service → checkout. |
| `/[country]/[state]/[city]/[category]/[business]/review` | Leave review | Requires customer auth; posts to moderation. |
| `/categories` | All categories | Global category index. |
| `/list-your-business` | Owner sales page | Pricing ($19.99/mo or $100/yr) + add-ons + "Start listing" → business onboarding. |
| `/how-it-works`, `/about`, `/contact` | Static | Friendly explainer pages. |
| `/help`, `/help/[slug]` | Help center | Non-technical FAQ. |
| `/privacy`, `/terms`, `/cookies`, `/refunds` | Policy | Static/policy. |
| `/order/[orderId]/confirmation`, `/booking/[bookingId]/confirmation` | Post-purchase | Receipt + status; guest-accessible via signed token. |

---

## 2. CUSTOMER account (`(customer)`) — `/account/*`

| Route | Page |
|---|---|
| `/account` | Dashboard: recent orders, upcoming bookings, saved businesses. |
| `/account/favorites` | Saved businesses. |
| `/account/orders`, `/account/orders/[id]` | Food-order history + status/receipt. |
| `/account/bookings`, `/account/bookings/[id]` | Appointments + tire-service requests; reschedule/cancel. |
| `/account/reviews` | Reviews the customer has written (edit/delete). |
| `/account/messages`, `/account/messages/[threadId]` | Customer↔business messaging. |
| `/account/coupons` | Saved / redeemed coupons. |
| `/account/settings` | Profile, notifications, delete account. |

---

## 3. BUSINESS OWNER dashboard (`(business)`) — `/dashboard/*`

Simple, guided, one-thing-per-screen. `[businessId]` scopes owners who run multiple listings.

| Route | Page |
|---|---|
| `/dashboard` | Home: view analytics snapshot, subscription status, "what to do next" checklist. |
| `/dashboard/onboarding` | Guided wizard: business basics → location/category → photos → hours → subscription checkout → Connect setup. |
| `/dashboard/[businessId]/listing` | Listing editor: name, description, address, phone, category (primary/secondary). |
| `/dashboard/[businessId]/photos` | Photo upload (Supabase Storage) + reorder. |
| `/dashboard/[businessId]/video` | Video ad upload (paid add-on gate). |
| `/dashboard/[businessId]/menu` | Menu / services + prices editor (powers ordering/booking). |
| `/dashboard/[businessId]/hours` | Weekly hours + holiday overrides. |
| `/dashboard/[businessId]/coupons` | Coupons + daily specials (create/schedule). |
| `/dashboard/[businessId]/ads` | Subscription (monthly/annual) + add-ons: video, featured placement, coupon campaigns, promo emails. Embedded Stripe checkout. |
| `/dashboard/[businessId]/payouts` | **Stripe Connect (Express)** onboarding + payout status/balance. |
| `/dashboard/[businessId]/orders` | Incoming food orders (accept/prepare/complete). |
| `/dashboard/[businessId]/bookings` | Appointment + tire-service requests calendar. |
| `/dashboard/[businessId]/reviews` | Read + reply to reviews. |
| `/dashboard/[businessId]/analytics` | Ad views, page views, product views, calls, direction clicks — KPI cards + bar charts. |
| `/dashboard/[businessId]/messages` | Message customers. |
| `/dashboard/settings` | Account/profile, add another business. |

---

## 4. ADMIN portal (`(admin)`) — `/admin/*` (RBAC: admin; queries via service_role, bypass RLS)

Modeled on bondandfifth: `AdminShell` (sidebar + content), server actions take FormData → `assertAdmin()` → `audit()` → `revalidatePath()`. Every mutation writes `taw.admin_audit_log(actor, action, entity, entity_id, diff)`.

| Route | Capability |
|---|---|
| `/admin` | Dashboard: KPI cards (businesses, MRR, orders GMV, active subs, pending moderation) + bar charts from `taw.events`. |
| `/admin/businesses`, `/admin/businesses/[id]` | Businesses moderation: approve/flag/**takedown**, edit, view live listing. |
| `/admin/users`, `/admin/users/[id]` | Users + **RBAC role management** (customer/business_owner/admin), ban/impersonate-safe view. |
| `/admin/reviews` | Reviews moderation queue (approve/reject/remove). |
| `/admin/categories` | Categories CRUD + icons + ordering. |
| `/admin/locations` | Countries/states/cities management + seeding controls. |
| `/admin/subscriptions` | Advertising subscriptions & payments (Stripe): status, cancel, refund. |
| `/admin/connect` | Connect accounts oversight: onboarding status, payout holds, disputes. |
| `/admin/orders` | Food orders oversight + refunds. |
| `/admin/bookings` | Appointments/tire-service oversight. |
| `/admin/coupons` | Coupon campaigns oversight/moderation. |
| `/admin/messages` | Messaging oversight (abuse review). |
| `/admin/campaigns` | Promo email campaigns (Resend blasts): compose, segment, send, stats. |
| `/admin/audit-log` | Full `admin_audit_log` viewer + filters. |
| `/admin/settings` | Feature flags, pricing config, demo-seed toggles, ENV-driven Stripe mode indicator. |
| `/admin/export` (button on lists) | CSV export (reused pattern). |

---

## 5. API route handlers (`app/api`)

`stripe/webhook`, `stripe/subscription-checkout` (embedded), `connect/onboard`, `connect/webhook`, `checkout/order`, `checkout/booking`, `search`, `geo/reverse`, `resend/send`, `demo/seed` (admin). All Stripe/account values from ENV.

---

## 6. Reusable COMPONENT inventory

**Shared/primitives:** `Button`, `Card`, `Badge`, `Icon` (Font Awesome wrapper — never emoji), `Modal`, `Drawer`, `Tabs`, `Toast`, `Spinner`, `EmptyState`, `Pagination`, `Rating` (stars), `PriceTag`, `Map` (+ `DirectionsButton`), `ShareButton`, `ConfirmDialog`.

**Public (simple/warm):** `SiteHeader`, `SiteFooter`, `SearchBar`, `CategoryTile`, `BusinessCard`, `FeaturedBadge`, `DemoBadge`, `PhotoGallery`/`LightboxGallery` (reuse existing), `VideoAdPlayer`, `HoursTable` + `OpenNowPill`, `MenuList`, `CouponCard`, `ReviewList` + `ReviewForm`, `CallNowButton`, `SaveFavoriteButton`, `Breadcrumbs` (geo path), `GeoHubGrid`, `SponsoredSlot`.

**Marketplace/checkout:** `Cart`, `CheckoutEmbed` (Stripe embedded), `SlotPicker` (booking), `OrderStatusBadge`.

**Business dashboard (guided):** `DashboardShell`, `OnboardingWizard` + `WizardStep`, `ListingEditorForm`, `PhotoUploader`, `VideoUploader`, `MenuEditor`, `HoursEditor`, `CouponEditor`, `SubscriptionPanel` + `AddOnToggle`, `ConnectOnboardCard`, `PayoutSummary`, `AnalyticsCards` + `BarChart`, `MessageThread`, `NextStepsChecklist`.

**Admin (dense):** `AdminShell` (sidebar+content), `DataTable` + `Filters`, `KpiCard`, `BarChart`, `StatusControls` (dropdown), `DeleteButton`/`TakedownButton`, `RoleSelect`, `AuditLogTable`, `CsvExportButton`, `MediaUpload`, `EmailComposer`, `ModerationQueue`, `RefundButton`, `FeatureFlagToggle`.

---

## 7. Supabase schema note
All tables in schema **`taw`** (never `public`). RLS default-deny on every table; public pages use anon key (RLS-scoped to published rows), business dashboard scoped to owner, admin uses service_role. Key tables: `businesses`, `locations` (country/state/city), `categories`, `business_categories`, `photos`, `videos`, `menu_items`, `hours`, `coupons`, `reviews`, `favorites`, `orders`, `bookings`, `messages`, `subscriptions`, `connect_accounts`, `events`, `admin_audit_log`, `email_campaigns`, `feature_flags`, `profiles` (role).
