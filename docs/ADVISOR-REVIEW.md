# Advisor Review — True American Where (adversarial pass)

**Reviewer role:** Senior design + product advisor. Scope: BUILD-PLAN.md, 01-schema-notes.md,
02-stripe.md, 03-design-system.md, 04-information-architecture.md.
**Verdict in one line:** The plan is unusually coherent for its size — the thin-slice sequencing,
token system, and RLS model are strong — but it has one strategic contradiction (demo listings vs.
SEO), one operational hole that will burn real customers (unfulfilled paid orders), two Stripe
correctness errors, and a v1 scope that is still ~30% too big.

---

## P1 — The demo-listing strategy sabotages the SEO strategy (BLOCKER, strategic)

**The contradiction:** Conflict-resolution C6 lets `is_demo` listings satisfy the ≥3-listing hub
eligibility gate. That means at launch, essentially **every indexable hub is populated by
AI-generated fictional businesses** — fake names, fake NAP data, AI photos — across all 50 states
and ~1,300 priority hubs. Excluding them from `AggregateRating` schema is not enough:

- A `LocalBusiness` JSON-LD block for a business that does not exist is misleading structured
  data, full stop. Google's spam policies (fake business listings, scaled content abuse) target
  exactly this pattern. One manual action poisons the whole domain — the plan's own Risk #3.
- Users who call, get directions to, or try to order from a demo listing hit a dead end. A "DEMO"
  ribbon does not survive a Google Business-style SERP snippet; the user's first contact with the
  brand is a business that isn't real. That is a trust kill for a product whose brand promise is
  "Find the REAL local stores."
- The waved publish of "1,300 priority hubs" is, at launch, a wave of 1,300 demo-only doorway
  pages.

**Fixes (specific):**
1. `is_demo = true` ⇒ page is `noindex` and emits **no** LocalBusiness JSON-LD. Demo listings are
   UI furniture only.
2. Hub eligibility gate counts **real listings only** (`is_demo = false AND status='published'`).
   A hub with 12 demos and 0 real businesses is `noindex` (still renderable for browsing).
3. Invert the seeding posture: seed demo *businesses* thinly for visual liveliness, but pour the
   SEO budget into hubs where you can recruit 3+ real businesses (launch city-by-city, not
   nation-at-once). Real supply drives the index, not the seed script.
4. Demo listings must not have callable phone numbers or orderable menus — disable Call Now /
   Order / Book / Directions on `is_demo`, replace with "Is this your business? Claim it."
   (which is also your growth loop).

## P2 — Paid food orders with no fulfillment loop = refunds, disputes, dead marketplace (BLOCKER, ops)

Phase 6 charges a customer's card, sets `orders.status='paid'`, and "notifies business + customer."
Notified **how**? A fried-food shop owner is at the fryer, not watching `/dashboard/[id]/orders`.
The failure mode is brutal and certain: customer pays → nobody sees the ticket → food never made →
refund → dispute → Stripe dispute fees on **your** platform (Express = platform liable), and a
one-star review of the *platform*.

**Fixes:**
1. Add an **accept/decline step with a hard timeout**: order is authorized (manual capture or
   `capture_method:'manual'` on the PaymentIntent), owner must tap "Accept" within N minutes, else
   auto-cancel + auto-release. Never capture money for an order nobody acknowledged. This is how
   every real food marketplace works and the schema/webhook table has no state for it
   (`orders.status` needs `awaiting_acceptance` / `accepted` / `rejected` / `expired`).
2. Add an **SMS notification channel** (Twilio or similar) for new orders/bookings. Email +
   dashboard is not a fulfillment channel for this audience. This is a new env var + vendor —
   flag it now, not in Phase 6.
3. Gate ordering per business behind an explicit owner opt-in ("I'm ready to receive orders")
   *after* Connect onboarding, with a test-order walkthrough in the wizard.
4. If SMS is refused on cost grounds, cut ordering to pilot cities with hand-onboarded businesses
   rather than shipping a silent-failure machine nationwide.

## P3 — Two Stripe correctness errors that will cost real money (BLOCKER, technical)

1. **Fee-payer contradiction in §5.2 of 02-stripe.md.** The code sets `on_behalf_of:
   connectedAccountId`, but the prose says "Stripe fees are debited from **our** balance."
   Those are mutually exclusive: with `on_behalf_of`, the connected account becomes the
   settlement merchant and **pays the Stripe processing fee**; without it, the platform pays.
   The 10% + 30¢ platform-fee profitability math, the statement-descriptor behavior, and the
   refund accounting all change depending on this. Decide deliberately (recommend: keep
   `on_behalf_of` so the business's name is on the statement and the business absorbs processing
   fees out of its 90%; then the platform fee is pure margin) and rewrite §5.2 so the code and
   the prose agree. Verify with a test charge before Phase 6 sign-off.
2. **`taw.refunds` only references `order_id`,** but the canonical `01` model (per C1) keeps
   `orders`, `bookings`, and `service_requests` as **separate tables**. A booking refund has no
   home. Either give `refunds` the same polymorphic `(kind, entity_id)` shape as the unified
   `payments` ledger, or hang refunds off `payments.id` (cleanest — one financial spine).
3. (Adjacent) **Sales tax on food is not optional.** Deferring Stripe Tax entirely (C4 #7) means
   businesses under-collect on every marketplace order. Minimum v1: per-business flat tax-rate
   field applied server-side to order totals, with Stripe Tax as the upgrade path. Put it in the
   client-questions list as "required decision," not "open question."
4. (Adjacent) **Subscription webhook race:** `checkout.session.completed`,
   `customer.subscription.created`, and `invoice.paid` arrive in no guaranteed order. The handler
   table implies insert-then-update; make every Rail A handler an **upsert keyed on
   `stripe_subscription_id`**. Also: in the dedupe sketch, if `handle(event)` throws after the
   `stripe_events` insert, the event is permanently skipped on retry — mark processed **only after**
   success, and let the unique-violation path distinguish "in-flight/failed" from "done."

## P4 — Auto-publish on payment ships empty, ugly listings (HIGH, product + SEO)

Locked decision says listings auto-publish on payment; the onboarding wizard order is
basics → location → **checkout**, with photos/hours in the *post-publish* checklist. So the
canonical, indexable business page goes live with no photos, no hours, no menu — the exact
thin-content page the SEO doc forbids, wearing the brand's face. And the owner's "Go live" stamp
in the checklist is fiction (it already went live at payment).

**Fix:** keep "paid ⇒ entitled to publish" but add a **minimum-content gate**: publish flips to
`published` when paid **AND** (≥1 photo AND hours set). The webhook sets `plan_tier` + a
`paid_at`; the checklist's "Go live" becomes real and the wizard moves photos + hours **before**
checkout (owners are most motivated pre-payment). If the client insists on instant publish,
auto-`noindex` any published listing below the content bar.

## P5 — v1 scope: cut messaging, tire-prepay, and recurring add-ons (HIGH, scope)

Ordering + booking is locked; fine. But the plan still carries passengers that add whole
subsystems for marginal launch value:

- **Cut owner↔customer messaging (Phase 9).** It's a moderation surface, an abuse surface, an
  admin section, and a notification system — for an audience that will not check an inbox.
  "Call Now" *is* the messaging feature for this demographic. Revisit post-launch with data.
- **Simplify tire service to a request form (no prepayment).** The schema itself says
  "quote→price flow" — you cannot create a PaymentIntent for an amount nobody knows yet.
  v1: request + phone callback. Payment-on-quote is a v1.1 feature.
- **Simplify bookings to request-and-confirm without prepayment.** The schema has `services`
  + `business_hours` but **no availability/capacity/staff model** — nothing prevents
  double-booking, and prepaid appointments require a no-show/refund policy engine. A "Request
  appointment → owner confirms (SMS) → customer pays at the shop" flow ships the value with 20%
  of the machinery. Prepaid booking joins ordering behind the P2 accept-loop when it's ready.
- **Defer Phase 8 recurring add-ons to post-launch.** Featured placement needs traffic to sell;
  promo email blasts need list volume + CAN-SPAM handling. Ship the two base prices; the add-on
  env vars can sit empty. This also postpones the C3 proration question entirely.
- Keep: reviews, favorites, analytics (it's the ad product's receipt), admin, Connect + food
  ordering (with P2 fixed).

## P6 — Signup and owner-onboarding UX will confuse the exact users you're designing for (HIGH, UX)

1. **The role-select step at signup is a known confusion generator.** A retiree looking for a
   fish fry should never be asked "Are you a customer or a business owner?" Default **everyone**
   to `customer`; the *only* path to `business_owner` is the "List your business" flow, which
   upgrades the role server-side. Removes a screen, removes a wrong-choice recovery flow, and
   removes the "I picked business by accident and now my app looks weird" support ticket.
   (Also removes any client-writable `role` path — tightens P7's escalation guard.)
2. **Two Stripe moments, zero framing.** The owner pays $19.99 (Rail A) and is then asked to
   enter bank details in a *differently-branded Stripe-hosted flow* (Rail B Express). To a
   non-technical owner this reads as "they're charging me twice" or "this is a phishing page."
   The dashboard must present these as two plainly-named, separately-completable cards:
   **"Your ad" (you pay us)** and **"Getting paid" (customers pay you)** — each with a
   one-sentence explanation, and Connect explicitly optional/skippable. The wizard currently
   chains basics → checkout → Connect as one tunnel; break it after checkout with a
   celebration + "You're live. Want to accept orders too?"
3. **Never show cents-integers or the word "listing entity" anywhere owner-facing** — the menu
   editor must accept "8.99" and format currency on blur; specs mention `price_cents` but no
   input-masking requirement. Add it to the component spec for `MenuEditor`/`CouponEditor`.

## P7 — Analytics and reviews integrity: the thing owners PAY for is trivially spammable (MEDIUM-HIGH)

- `ad_impressions`/`ad_clicks` are written by a **server action callable by anyone** (anon
  page-view tracking via service_role). Server actions are just POST endpoints; a curl loop
  inflates an owner's "127 people viewed your ad this week" — which is the core receipt for the
  $19.99/mo product. When an owner discovers the number is meaningless, the subscription churns.
  **Fix:** rate-limit per IP+business, dedupe per session-day, filter known bots by UA, and
  exclude `is_demo`. Perfect isn't needed; unspoofable-by-a-curl-loop is.
- Reviews: "posts to moderation (`moderation_status` **default visible**)" is not moderation —
  it's instant publish with an after-the-fact takedown. For a small-business platform, review
  bombing is an existential owner-trust issue. **Fix for v1:** keep default-visible (velocity
  matters for SEO) but add per-account rate limits (1 review/business, N/day), require a
  minimum account age or verified order for review #2+, and put a "New — auto-screened" pending
  state on accounts <24h old. Owner reply flow already inline — good.
- One review per `(business, author)` is in the schema — good; enforce the same in UI copy.

## P8 — Design: the direction is right; these specifics keep it from sliding back into tasteful-default (MEDIUM)

"Main Street Modern" + the enamel sign-plate + gold pinstripe + verdigris is a genuinely
distinctive, ownable system — the strongest doc of the five. Gaps that will erode it in build:

1. **The default Google Map will destroy the palette on every hub and business page** — bright
   greens/blues/whites against cream paper. Ship a custom map style (Cloud-based map styling
   JSON: paper-cream landscape, ink water, verdigris parks, gold POI pins) as a Phase 1 asset,
   not an afterthought. The map appears on your highest-traffic templates.
2. **Font Awesome licensing is an unresolved dependency:** Duotone icons and `fa-car-wash` are
   **Pro-only**. The plan says "Pro if licensed, else Free Solid" — decide *now* (it changes the
   category-tile art direction) and fix the three undecided mappings (barber `fa-shop` vs
   `fa-user-tie`; tire `fa-car` vs `fa-gear` — use `fa-tire`* if Pro, else `fa-car`; car wash
   fallback `fa-spray-can-sparkles` is Free). An icon-per-category table with exactly one icon
   each belongs in the design doc.
3. **Reconcile the client's existing logo.png with the sign-plate lockup.** The design system
   invents a logo treatment but never mentions the client-provided logo — that's a stakeholder
   collision waiting for launch week. Decide: sign-plate frames the client mark, or client mark
   is retired.
4. **Fraunces is drifting toward trendy-default** (it's the new "tasteful serif" across
   food/Substack brands). It's still the right call, but the *distinctiveness* must be carried
   by the sign-plate motif, halftone/star textures, leader-dot menu rows, ticket-notch coupons,
   and painted-stamp checklist — spec those as required components, not decorative options,
   or the build regresses to "nice serif on cream" (i.e., slop with a better font).
5. Missing specs worth one paragraph each: photography treatment for owner-uploaded photos
   (aspect crop + subtle warm grade so amateur phone photos look intentional — this is 90% of
   the imagery), empty-state illustration style, and the DEMO ribbon's exact treatment (it's on
   thousands of cards).

## P9 — Domain strategy: two migrations planned where one is needed (MEDIUM, SEO)

Launching the directory on `trueamericanwear.com` (a domain with clothing history and clothing
backlinks) and then 301-migrating to `trueamericanwhere.com` later means Google re-evaluates the
site **twice** — once for the content pivot, once for the domain move — each with a ranking
trough of weeks-to-months. If `trueamericanwhere.com` is already owned, launch the directory
there on day one and 301 the wear-domain into it; the clothing pages have little equity worth
preserving relative to the cost. If the client insists on the current domain, compress the gap:
swap domains *before* the wave-publish of hubs in Phase 11, never after.

Also: drop `hreflang` en-JM at launch — one demo barber shop in Kingston is not an alternate-
language site version; hreflang across identical-English pages adds crawl noise for zero gain.
Keep the `/jm/...` tree; add hreflang when real international supply exists.

---

## What is genuinely good (keep, don't relitigate)

- The Karpathy thin-slice sequencing (Phases 0–3 = content → auth → money → live) is the right
  spine and the deferred lists per phase show real discipline.
- SECURITY DEFINER role helpers instead of policy sub-selects (avoids RLS recursion), FORCE RLS,
  no client INSERT policies on financial/analytics tables, webhook-derived entitlements, raw-body
  signature verification + event dedupe — this is the correct shape.
- Integer cents everywhere; snapshotted order items; unified `payments` ledger.
- Light-front/dark-admin from one token set; label-always-visible inputs; icon+word buttons;
  one-thing-per-screen wizards — precisely right for this audience.
- The eligibility gate + segmented `generateSitemaps()` + pruning loop is the correct pSEO
  skeleton — it just has to count *real* listings (P1).

## Suggested resequencing (net effect of P1–P5)

- Phase 4 (photos/hours editors) moves **before** the Phase 3 checkout step in the wizard (P4).
- Phase 6 gains the accept-timeout + SMS notify tasks (P2) and drops tire-prepay + booking-prepay.
- Phase 8 (add-ons) and Phase 9 messaging drop out of v1; Phase 9 analytics stays with P7 hardening.
- Phase 11 seeding follows the P1 rules (demo = noindex furniture; index follows real supply),
  and the domain decision (P9) is settled before any wave publish.
