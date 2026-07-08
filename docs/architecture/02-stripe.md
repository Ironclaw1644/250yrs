# 02 — Stripe Payments Architecture

**Project:** True American Where (`taw` schema, Supabase project WalkPerro `kflzqkuioiiyfrvlvcvl`)
**Status:** Design. Everything runs on **our own Stripe TEST keys** until the client invites us to their account.
**Grounded against:** Stripe docs via MCP, 2026-07. Node SDK (`stripe` npm), Next.js 15 App Router server actions + route handlers.

---

## 0. Two rails at a glance

| | RAIL A — Advertising subscription | RAIL B — Marketplace |
| --- | --- | --- |
| Who pays | Business owner (subscriber) | Customer (buyer) |
| For what | The ad listing itself: $19.99/mo **or** $100/yr | Food orders, appointments, tire service |
| Money goes to | **Us (the platform)** — 100% our revenue | **The business**, minus our application fee |
| Stripe product | Billing **Subscriptions** + **Embedded Checkout** (`ui_mode:'embedded'`) | **Connect** (Express) + **destination charges** with `application_fee_amount` |
| UI | On-site embedded, no redirect | On-site Payment Element for card entry; Stripe-hosted onboarding redirect is fine |
| Account context | Our platform account | Charge created on platform, funds routed to connected account |

These are independent. A business owner can subscribe to advertising (Rail A) without ever connecting a payout account (Rail B), and vice-versa. Ordering/booking on a business is only enabled once that business has completed Connect onboarding (`charges_enabled=true`).

---

## 1. Accounts model decision (read first)

Stripe is steering **new** Connect platforms toward the **Accounts v2 API**. Because the client's account does not exist yet, we have a clean choice and no legacy to migrate.

**Decision: build Rail B on Express connected accounts using the v1 `accounts` API with controller properties** (the long-stable, most-documented path), and isolate every Connect call behind a thin `lib/stripe/connect.ts` module so that if we later adopt Accounts v2 it is a one-file change. Rationale: v2 is GA for Connect but the surrounding tutorials, test triggers, and community answers still overwhelmingly assume v1/Express; for a first launch on our own test keys, fewer unknowns wins. **OPEN QUESTION flagged in §11.**

Everywhere below, "Express account" = a connected account with `type:'express'` (Stripe-hosted onboarding + lightweight Express Dashboard, we are liable for negative balances — acceptable for a curated local-business marketplace).

---

## 2. Environment variables (test + live, one-config swap)

All account-specific values live in env. Switching to the client's live account = replace the `sk`/`pk`/`whsec` trio + price IDs + Connect client ID, redeploy. **No code change.**

```bash
# ---- Stripe core (same var names in every environment) ----
STRIPE_SECRET_KEY=            # sk_test_... now, sk_live_... later. SERVER ONLY.
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=   # pk_test_... / pk_live_... safe in browser
STRIPE_WEBHOOK_SECRET=        # whsec_... for the MAIN (account) webhook endpoint
STRIPE_CONNECT_WEBHOOK_SECRET=# whsec_... for the CONNECT webhook endpoint (separate endpoint)

# ---- Rail A: subscription price IDs (created once per account) ----
STRIPE_PRICE_ADVERTISING_MONTHLY=   # price_... $19.99/mo
STRIPE_PRICE_ADVERTISING_ANNUAL=    # price_... $100/yr

# ---- Rail A add-ons (see §7). One-time and recurring price IDs ----
STRIPE_PRICE_ADDON_VIDEO_ADS=           # recurring monthly
STRIPE_PRICE_ADDON_FEATURED_PLACEMENT=  # recurring monthly
STRIPE_PRICE_ADDON_COUPON_CAMPAIGN=     # one-time
STRIPE_PRICE_ADDON_DAILY_SPECIALS=      # recurring monthly
STRIPE_PRICE_ADDON_PROMO_EMAIL_BLAST=   # one-time

# ---- Rail B: Connect ----
STRIPE_CONNECT_CLIENT_ID=     # ca_... (from platform settings; only needed for OAuth-style flows)
TAW_PLATFORM_FEE_BPS=1000     # our application fee in basis points (1000 = 10%). Tunable w/o deploy if read at runtime.
TAW_PLATFORM_FEE_FIXED_CENTS=30   # optional fixed component per order

# ---- URLs ----
NEXT_PUBLIC_SITE_URL=         # https://trueamericanwear.com now, trueamericanwhere.com later
```

**Swap plan:** keep a `.env.test` and `.env.live` (never committed; secrets stay in Vercel project env). Going live = the client invites us → we generate live keys → paste the live trio + regenerate the 7 price IDs on the live account via a seed script (`scripts/stripe-seed-prices.ts`, idempotent by `lookup_key`) → update the two webhook endpoint URLs in the live Dashboard → flip Vercel env to live values. Because prices are referenced by env var (not hardcoded ID), the seed script prints the new IDs to paste.

Single server client, `lib/stripe/server.ts`:
```ts
import Stripe from 'stripe';
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil', // pin; bump deliberately
  appInfo: { name: 'True American Where' },
});
```

---

## 3. `taw` schema — payment tables

RLS default-deny on all. Public/anon reads only where noted; all writes happen server-side via service_role (webhooks, server actions).

```
taw.stripe_customers
  user_id (uuid, FK auth.users, unique)   stripe_customer_id (text, unique)   created_at

taw.subscriptions          -- Rail A, one active row per business
  id uuid pk
  business_id uuid FK taw.businesses (unique partial where status active)
  user_id uuid              -- owner who pays
  stripe_customer_id text
  stripe_subscription_id text unique
  price_id text             -- monthly vs annual (mirror of env)
  plan interval enum('month','year')
  status text               -- incomplete|trialing|active|past_due|canceled|unpaid|paused
  current_period_end timestamptz
  cancel_at_period_end bool
  created_at / updated_at

taw.subscription_addons    -- Rail A add-ons attached to a sub (recurring) OR standalone (one-time)
  id uuid pk  subscription_id uuid nullable  business_id uuid
  addon_key text            -- video_ads|featured_placement|coupon_campaign|daily_specials|promo_email_blast
  stripe_price_id text  stripe_item_id text nullable (for recurring, the subscription_item id)
  kind enum('recurring','one_time')  status text  expires_at timestamptz nullable  created_at

taw.connect_accounts       -- Rail B, one per business that wants to sell
  business_id uuid unique   stripe_account_id text unique
  charges_enabled bool  payouts_enabled bool  details_submitted bool
  requirements_currently_due jsonb  disabled_reason text
  onboarding_status enum('not_started','pending','complete','restricted')
  created_at / updated_at

taw.orders                 -- Rail B purchases (food/appt/tire)
  id uuid pk  business_id uuid  customer_user_id uuid nullable (guest allowed)
  kind enum('food_order','appointment','tire_service')
  stripe_payment_intent_id text unique  stripe_checkout_session_id text nullable
  amount_total_cents int  application_fee_cents int  currency text default 'usd'
  connected_account_id text
  status enum('created','requires_payment','processing','paid','fulfilled','refunded','partially_refunded','failed','canceled')
  metadata jsonb            -- cart lines / appointment slot / tire request details
  created_at / updated_at

taw.refunds
  id uuid pk  order_id uuid  stripe_refund_id text unique  amount_cents int
  reason text  status text  initiated_by enum('admin','business','system')  created_at

taw.stripe_events          -- idempotency ledger (dedupe replays)
  stripe_event_id text pk  type text  received_at timestamptz  processed bool
```

Reuse the bondandfifth pattern: `admin_audit_log(actor, action, entity, entity_id, diff)` records every admin-triggered refund/takedown.

---

## 4. RAIL A — Advertising subscription (embedded, no redirect)

### 4.1 Why Embedded Checkout over Payment Element + manual Subscription
For **non-technical** subscribers this is the right call. Stripe **Embedded Checkout** (`ui_mode:'embedded'`, `mode:'subscription'`) mounts an iframe *on our own page* — no redirect to a Stripe-branded URL, which satisfies the "no redirect" mandate — while Stripe still handles the entire subscription creation, SCA/3DS, tax, receipts, and edge cases for us. The Payment Element route would force us to hand-build the subscription lifecycle (create sub with `payment_behavior:'default_incomplete'`, expand the PaymentIntent, confirm client-side, retry logic). That is more code and more failure modes for zero UX gain here. **Decision: Embedded Checkout for the initial subscribe.**

### 4.2 Products & prices (create once per Stripe account)
One product **"True American Where — Advertising"** with two recurring prices:
- `$19.99` / `month` → `STRIPE_PRICE_ADVERTISING_MONTHLY`
- `$100.00` / `year` → `STRIPE_PRICE_ADVERTISING_ANNUAL`

`unit_amount` in cents (`1999`, `10000`), `currency:'usd'`, `recurring.interval` month/year. Give each a stable `lookup_key` (`taw_ad_monthly`, `taw_ad_annual`) so the seed script is idempotent across test→live.

### 4.3 Create session (server action)
```ts
// app/(owner)/advertising/actions.ts  — 'use server'
export async function createAdvertisingCheckout(businessId: string, plan: 'month' | 'year') {
  const user = await requireBusinessOwner();          // auth guard
  const customerId = await getOrCreateStripeCustomer(user); // taw.stripe_customers
  const price = plan === 'year'
    ? process.env.STRIPE_PRICE_ADVERTISING_ANNUAL!
    : process.env.STRIPE_PRICE_ADVERTISING_MONTHLY!;

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price, quantity: 1 }],
    subscription_data: { metadata: { taw_business_id: businessId } },
    metadata: { taw_business_id: businessId, taw_user_id: user.id },
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/advertising/return?session_id={CHECKOUT_SESSION_ID}`,
  });
  return session.client_secret; // string
}
```

### 4.4 Mount on our page (React)
```tsx
'use client';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function AdCheckout({ businessId, plan }: {...}) {
  const fetchClientSecret = () => createAdvertisingCheckout(businessId, plan); // server action
  return (
    <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
}
```
`/advertising/return` retrieves the session (`stripe.checkout.sessions.retrieve(id)`), branches on `status`: `complete` → success page ("Your ad is live!"), `open` → remount to retry. **The listing auto-publishes from the webhook, not from this page** (page is best-effort UX; webhook is source of truth).

### 4.5 Upgrade / downgrade / cancel
- **Monthly ⇄ annual switch:** `stripe.subscriptions.update(subId, { items:[{ id: itemId, price: newPrice }], proration_behavior:'create_prorations' })`. For a downgrade to the cheaper annual you may prefer `proration_behavior:'none'` and switch at period end — **decision to confirm with client, see §11.**
- **Cancel:** set `cancel_at_period_end:true` (keep the ad live until paid period ends). Immediate cancel = `stripe.subscriptions.cancel(subId)`.
- All three can be done either by our own minimal buttons calling server actions, **or** via the Stripe **Customer Portal**.

### 4.6 Customer Portal question — recommendation
**Use the Stripe-hosted Customer Portal for subscription self-management (Rail A only).** It is a redirect, but the mandate's "no redirect" rule is specifically about the *subscribe/checkout* moment; ongoing billing management (update card, switch plan, cancel, download invoices) is a secondary flow where a Stripe-hosted, PCI-handled page is the pragmatic, low-code choice for non-technical owners. We add one "Manage billing" button → `stripe.billingPortal.sessions.create({ customer, return_url })`. Configure allowed actions (switch between our two prices, cancel, update payment method) in the Dashboard. Portal changes come back to us as `customer.subscription.updated/deleted` webhooks. **OPEN QUESTION in §11** if client wants zero redirects anywhere.

---

## 5. RAIL B — Marketplace (Stripe Connect, Express)

### 5.1 A business connects (onboarding)
1. Owner clicks "Set up payments to accept orders". Server action:
```ts
let acctId = await getConnectAccountId(businessId);
if (!acctId) {
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'US',
    email: owner.email,
    capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
    business_type: 'individual', // prefilled, editable in onboarding
    metadata: { taw_business_id: businessId },
  });
  acctId = account.id; // save to taw.connect_accounts
}
const link = await stripe.accountLinks.create({
  account: acctId,
  refresh_url: `${SITE}/owner/payments/refresh?b=${businessId}`,
  return_url:  `${SITE}/owner/payments/return?b=${businessId}`,
  type: 'account_onboarding',
  collection_options: { fields: 'eventually_due' },
});
redirect(link.url); // Stripe-hosted onboarding (redirect is fine per mandate)
```
2. `refresh_url` re-mints a fresh Account Link (links are single-use / expire in minutes). `return_url` does **not** imply completion — we re-fetch the account and/or rely on the `account.updated` webhook to set `charges_enabled`/`payouts_enabled`.
3. Ordering UI on the business page is gated on `connect_accounts.charges_enabled = true`.

### 5.2 A customer pays for an order/booking/tire request (destination charge)
Card entry stays on-site via **Payment Element** (embedded). PaymentIntent is created on **our platform account** with a **destination** + **application fee**:
```ts
const fee = computeAppFee(amountCents); // TAW_PLATFORM_FEE_BPS + fixed
const pi = await stripe.paymentIntents.create({
  amount: amountCents,
  currency: 'usd',
  automatic_payment_methods: { enabled: true },
  application_fee_amount: fee,
  transfer_data: { destination: connectedAccountId },
  on_behalf_of: connectedAccountId,      // business = merchant of record (their statement descriptor)
  metadata: { taw_order_id: orderId, taw_business_id: businessId, kind: 'food_order' },
});
return pi.client_secret;
```
Full amount lands in the business's balance; `application_fee_amount` transfers back to us; Stripe fees are debited from **our** balance (so `TAW_PLATFORM_FEE_BPS` must exceed Stripe's ~2.9%+30¢ to stay profitable). Client-side confirms with Payment Element + `return_url`.

> Alternative for the simplest food-order flow: **Connect Embedded/Checkout with `payment_intent_data[application_fee_amount]` + `transfer_data[destination]`**. We standardize on **Payment Element** so the checkout stays fully inside our warm, non-technical UI.

### 5.3 Refunds
```ts
// refund the charge; also pull our fee back so we don't profit on a refunded order
await stripe.refunds.create({
  payment_intent: pi.id,
  amount: refundCents,               // omit for full
  refund_application_fee: true,      // return our platform fee proportionally
  reverse_transfer: true,            // claw funds back from the connected account
});
```
Admin-initiated (moderation) and business-initiated (owner cancels an order) both route through one server action → `taw.refunds` + `admin_audit_log`. Partial refunds set order status `partially_refunded`.

### 5.4 Payout basics
Express accounts get Stripe's default automatic payout schedule (daily/rolling) to their bank; funds from destination charges accrue in **their** balance. Owners see balance + upcoming payouts via a **Login Link** to the Express Dashboard: `stripe.accounts.createLoginLink(acctId)` behind an "Open payments dashboard" button (generate on demand, never email the URL).

### 5.5 Disconnect
There's no hard "delete" for a connected account with history. Practical disconnect:
- Owner-initiated "stop accepting orders": set our `connect_accounts.onboarding_status='restricted'`, hide ordering UI (soft, reversible).
- Full removal: `stripe.accounts.del(acctId)` is only permitted for accounts with zero balance/activity (mostly test cleanup). For real accounts we keep the Stripe account for payout/refund history and just disable it on our side. Document this expectation to the client.

---

## 6. Webhooks

**Two endpoints, two signing secrets.** Connect events (`account`, `application_fee`, etc.) are delivered with `event.account` set and are configured as a **Connect webhook**; the subscription/billing events land on the **account webhook**. Both are Next.js route handlers reading the **raw body** for signature verification.

```ts
// app/api/webhooks/stripe/route.ts   (account endpoint)
export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')!;
  const raw = await req.text();                       // MUST be raw
  const event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  if (await alreadyProcessed(event.id)) return Response.json({ received: true }); // taw.stripe_events
  await handle(event);
  await markProcessed(event.id);
  return Response.json({ received: true });
}
```
Idempotency: insert `event.id` into `taw.stripe_events` first; ignore duplicates. Return 2xx fast; do heavy work async if needed.

### 6.1 Event table — what we handle and what it updates in `taw`

| Endpoint | Event | Rail | Action in `taw` |
| --- | --- | --- | --- |
| account | `checkout.session.completed` (mode=subscription) | A | Upsert `subscriptions` from `session.subscription`; set business `is_advertising=true`; **auto-publish listing**; send Resend welcome email |
| account | `customer.subscription.created` | A | Insert/confirm `subscriptions` row, status, `current_period_end` |
| account | `customer.subscription.updated` | A | Update status, price_id (plan switch), `cancel_at_period_end`, `current_period_end`; grant/revoke add-on entitlements from items |
| account | `customer.subscription.deleted` | A | Mark `canceled`; unpublish/depublish ad at period end; audit |
| account | `customer.subscription.paused` / `.resumed` | A | Toggle listing visibility |
| account | `customer.subscription.trial_will_end` | A | Resend reminder email (if we ever offer trials) |
| account | `invoice.paid` | A | Mark period paid; extend `current_period_end`; keep ad live; receipt email |
| account | `invoice.payment_failed` | A | Status `past_due`; Resend dunning email; after final retry Stripe fires `subscription.deleted` |
| account | `invoice.payment_action_required` | A | Email owner a link to complete SCA/authentication |
| account | `checkout.session.completed` (mode=payment, add-on one-time) | A | Insert `subscription_addons` (coupon campaign / promo email blast); trigger the campaign |
| account | `payment_intent.succeeded` | B | Set `orders.status='paid'`; notify business + customer; kick off fulfillment (kitchen ticket / booking confirm) |
| account | `payment_intent.payment_failed` | B | `orders.status='failed'`; show retry to customer |
| account | `charge.refunded` | B | Reconcile `refunds`; set order `refunded`/`partially_refunded` |
| account | `charge.dispute.created` | B | Flag order disputed; alert admin; freeze fulfillment |
| account | `application_fee.refunded` | B | Reconcile our fee give-back in `refunds` |
| **connect** | `account.updated` | B | Update `connect_accounts.charges_enabled/payouts_enabled/details_submitted/requirements/disabled_reason/onboarding_status`; enable or hide ordering UI |
| **connect** | `account.application.deauthorized` | B | Mark `connect_accounts` restricted; hide ordering |
| **connect** | `payout.paid` / `payout.failed` | B | (Optional) surface payout status to owner dashboard |
| **connect** | `capability.updated` | B | Track `transfers`/`card_payments` capability status |

> If we migrate to **Accounts v2** (see §11), the onboarding-status events become `v2.core.account[requirements].updated` / `v2.core.account.created` instead of `account.updated`; the handler contract (update `connect_accounts`) is identical, which is why it's isolated.

Local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and `--forward-connect-to localhost:3000/api/webhooks/stripe/connect`; `stripe trigger <event>`.

---

## 7. Add-ons purchase model

| Add-on | Model | Price type | Mechanism |
| --- | --- | --- | --- |
| Video ads | **Recurring** monthly | recurring | Add as extra **subscription item** on the owner's existing Rail A subscription (`subscriptions.update` add item) → single invoice, prorated |
| Featured / front-page placement | **Recurring** monthly | recurring | Same — extra subscription item; entitlement in `subscription_addons` drives placement query |
| Daily specials | **Recurring** monthly | recurring | Extra subscription item |
| Coupon campaign | **One-time** | one-time | Separate Embedded Checkout `mode:'payment'`; on `checkout.session.completed` create the campaign, set `expires_at` |
| Promotional email blast | **One-time** | one-time | One-time Checkout; on completion enqueue Resend blast |

Recurring add-ons attach to the subscription so the owner sees one consolidated bill and one card charge — simplest mental model. One-time add-ons are standalone embedded payments. Entitlements are always derived from `subscription_addons` (updated by webhook), never from the client.

---

## 8. Admin portal surfacing

Reuse AdminShell (sidebar + content). New sections:
- **Subscriptions** — table of `taw.subscriptions` (business, plan, status, period end, MRR). StatusControls to comp/cancel. Filter past_due. CSV export.
- **Connect accounts** — onboarding status per business, `charges_enabled`/`payouts_enabled`, outstanding requirements, "Open Express dashboard" (login link), restrict/enable toggle.
- **Orders & payments** — `taw.orders` with status, amount, our fee, connected account; drill to Stripe PI. Refund button (confirm dialog → server action → `refunds` + audit).
- **Refunds & disputes** — queue of `charge.dispute.created`, refund history.
- **Revenue dashboard** — KPI cards (MRR, active subs, GMV, total application fees = our marketplace revenue, refund rate) + simple bar charts, powered by our `events`/payment tables (bondandfifth analytics pattern). CSV export.
- **Add-ons** — active campaigns/blasts, featured placements, expiries.
- All money-moving admin actions write `admin_audit_log`.

---

## 9. Security / correctness rules

- Secret key + webhook secrets: server only, never `NEXT_PUBLIC_*`. Never logged.
- Amounts, prices, fees, destination account are **always** decided server-side from `taw` + env — never trusted from the client.
- Webhook signature verified on raw body; every event deduped via `taw.stripe_events`.
- Source of truth for entitlements (ad live, add-on active, ordering enabled) = webhook-updated `taw` rows, not checkout return pages.
- Idempotency keys on all `create` calls that could be retried (orders especially).
- RLS default-deny; writes via service_role in webhooks/server actions only.

---

## 10. Test-mode plan (now, before client's account)

1. Our own Stripe test account → create the 2 subscription prices + 5 add-on prices via idempotent seed script (record IDs into Vercel test env).
2. Enable Connect in test; complete platform profile; set branding.
3. Build both webhook endpoints; drive with `stripe listen` + `stripe trigger` and real test subscriptions/orders (cards `4242…`, SCA `4000 0025 0000 3155`, decline `4000…9995`).
4. Express onboarding with Stripe test data; use `stripe trigger account.updated` and test trigger cards to flip capabilities.
5. Everything account-specific already in env → live cutover is the swap in §2.

---

## 11. Open questions (for client / next decision)

1. **Accounts v1-Express vs Accounts v2** for Connect. Recommend v1/Express now for documentation maturity; v2 is Stripe's steer for new platforms. Confirm before building §5.
2. **Customer Portal redirect** for Rail A billing management — acceptable, or does "no redirect anywhere" require us to hand-build cancel/switch/update-card UI on-site?
3. **Platform fee** — confirm `TAW_PLATFORM_FEE_BPS` (proposed 10% + optional 30¢). Must exceed Stripe's processing fee to be profitable; is 10% right per category (food vs tire service margins differ)?
4. **Downgrade proration** (monthly→annual and reverse) — prorate immediately, or switch at period end with no credit?
5. **Foreign businesses** (Jamaica → Kingston seed): Connect destination charges generally require platform and connected account in the same region unless using cross-border payouts / `on_behalf_of`. Do foreign demo businesses need *real* payout capability, or are they display-only demos (no Rail B)? Recommend display-only for v1.
6. **Guest checkout** for orders (no customer login) — allowed? Affects `orders.customer_user_id` nullability and receipts.
7. **Tax** — enable Stripe Tax on subscriptions and/or marketplace orders, or out of scope for v1?
