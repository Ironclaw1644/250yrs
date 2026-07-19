# True American Wear — 250th Year Collection

E-commerce store for trueamericanwear.com. Next.js 15 App Router, Supabase
(schema `wear`), Stripe (Payment Element), Resend, Tailwind, deployed on Vercel.

## Develop

```bash
pnpm install
pnpm dev
```

## Architecture

- **Catalog** lives in the `wear` Supabase schema (products, per-size
  inventory, images, variants) — managed from `/admin`, seeded once by
  `scripts/seed-products.mjs`.
- **Cart** is client-side (localStorage) → `/checkout` re-prices every line
  from the database, writes a pending order, and confirms a Stripe
  PaymentIntent; the webhook at `/api/webhooks/stripe` marks it paid,
  decrements inventory, and sends confirmation emails.
- **Admin** (`/admin`) is gated by Supabase auth + the `ADMIN_EMAIL`
  allowlist: dashboard, products, orders, coupons, subscribers, site copy.

## Environment

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SECRET_KEY`, `SUPABASE_SCHEMA=wear`, `STRIPE_SECRET_KEY`,
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`,
`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `EMAIL_TO_ADMIN`, `ADMIN_EMAIL`,
`NEXT_PUBLIC_SITE_URL`.
