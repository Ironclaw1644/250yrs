/**
 * Idempotent-ish Stripe price seed. Run once when STRIPE_SECRET_KEY (test or
 * live) is set, then paste the printed ids into env:
 *
 *   STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/stripe-seed-prices.ts
 *
 * Creates the advertising Product + two recurring prices ($19.99/mo, $100/yr)
 * with stable lookup_keys so this can be re-pointed at the client's account
 * later without code changes.
 */
import Stripe from "stripe";

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("Set STRIPE_SECRET_KEY first.");
    process.exit(1);
  }
  const stripe = new Stripe(key);

  // Reuse a product by name if it already exists.
  const existing = await stripe.products.search({
    query: `name:'True American Where — Advertising'`,
  });
  const product =
    existing.data[0] ??
    (await stripe.products.create({
      name: "True American Where — Advertising",
      description: "Local business advertising plan on True American Where.",
    }));

  async function priceFor(lookupKey: string, amount: number, interval: "month" | "year") {
    const found = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
    if (found.data[0]) return found.data[0];
    return stripe.prices.create({
      product: product.id,
      currency: "usd",
      unit_amount: amount,
      recurring: { interval },
      lookup_key: lookupKey,
    });
  }

  const monthly = await priceFor("taw_ad_monthly", 1999, "month");
  const annual = await priceFor("taw_ad_annual", 10000, "year");

  console.log("\nAdd these to your env (and Vercel):");
  console.log(`STRIPE_PRICE_ADVERTISING_MONTHLY=${monthly.id}`);
  console.log(`STRIPE_PRICE_ADVERTISING_ANNUAL=${annual.id}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
