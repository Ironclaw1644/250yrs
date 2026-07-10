import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireUser, ownsBusiness } from "@/lib/auth";
import { stripeConfigured } from "@/lib/stripe";
import { db } from "@/lib/supabase";
import { Icon } from "@/components/Icon";
import { CheckoutEmbed } from "@/components/CheckoutEmbed";

export const metadata: Metadata = { title: "Advertise & publish", robots: { index: false } };

type Params = {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ plan?: string; done?: string }>;
};

const INCLUDED = [
  "Your business page goes live in local search",
  "Photos, hours, menu/services & prices",
  "One-tap Call Now, directions & coupons",
  "Customer reviews",
];

export default async function AdvertisePage({ params, searchParams }: Params) {
  const { businessId } = await params;
  const { plan, done } = await searchParams;
  await requireUser(`/dashboard/${businessId}/advertise`);
  if (!(await ownsBusiness(businessId))) redirect("/dashboard");

  const { data: biz } = await db()
    .from("businesses")
    .select("id,name,status,plan_tier")
    .eq("id", businessId)
    .maybeSingle();
  if (!biz) redirect("/dashboard");

  const isLive = biz.status === "published" && biz.plan_tier !== "free";
  const chosen = plan === "annual" ? "annual" : plan === "monthly" ? "monthly" : null;

  return (
    <div className="container-shell max-w-3xl py-8">
      <Link href="/dashboard" className="text-small text-stone hover:text-barn">
        <Icon name="chevron-right" className="rotate-180" /> Back to dashboard
      </Link>
      <p className="eyebrow mt-3">Advertise</p>
      <h1 className="font-heading text-h1 text-navy">{biz.name}</h1>

      {done && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border-2 border-success/40 bg-success/10 p-4">
          <Icon name="circle-check" className="mt-0.5 text-lg text-success" />
          <p className="text-small text-char">
            Payment received — your listing is being published. It goes live within
            a few moments.
          </p>
        </div>
      )}

      {isLive ? (
        <div className="card mt-6 flex flex-col items-start gap-3 p-6">
          <span className="pill pill-open">
            <Icon name="circle-check" /> Your ad is live
          </span>
          <p className="text-stone">
            Your listing is published on the {biz.plan_tier} plan.
          </p>
        </div>
      ) : chosen && stripeConfigured ? (
        <div className="mt-6">
          <p className="mb-3 text-stone">
            Complete your {chosen === "annual" ? "$100/year" : "$19.99/month"} plan
            below — secure checkout, right here on the site.
          </p>
          <CheckoutEmbed businessId={businessId} plan={chosen} />
        </div>
      ) : (
        <>
          <p className="mt-2 text-stone">
            Choose a plan to publish {biz.name} and start reaching local customers.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <PlanCard businessId={businessId} plan="monthly" price="$19.99" per="per month" note="Cancel anytime" />
            <PlanCard businessId={businessId} plan="annual" price="$100" per="per year" note="Save $140" highlight />
          </div>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {INCLUDED.map((f) => (
              <li key={f} className="flex items-start gap-2 text-small text-char">
                <Icon name="circle-check" className="mt-1 text-success" /> {f}
              </li>
            ))}
          </ul>
          {!stripeConfigured && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border-2 border-gold/50 bg-gold/10 p-4">
              <Icon name="circle-info" className="mt-0.5 text-lg text-gold" />
              <p className="text-small text-char">
                <strong className="font-sans font-bold text-navy">
                  Checkout is being connected.
                </strong>{" "}
                Online payment turns on as soon as the Stripe account is linked —
                your listing and everything you&apos;ve entered are saved and ready.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PlanCard({
  businessId,
  plan,
  price,
  per,
  note,
  highlight,
}: {
  businessId: string;
  plan: "monthly" | "annual";
  price: string;
  per: string;
  note: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={`/dashboard/${businessId}/advertise?plan=${plan}`}
      className={`card relative block p-6 ${highlight ? "shadow-raised" : ""}`}
    >
      {highlight && (
        <span className="absolute right-4 top-4 rounded-full bg-gold px-2.5 py-0.5 font-sans text-xs font-bold text-navy-deep">
          {note}
        </span>
      )}
      <p className="eyebrow">{plan === "annual" ? "Yearly" : "Monthly"}</p>
      <p className="mt-2 font-heading text-navy">
        <span className="text-4xl font-bold">{price}</span>{" "}
        <span className="text-stone">{per}</span>
      </p>
      {!highlight && <p className="mt-1 text-small text-stone">{note}</p>}
      <span className="btn btn-primary mt-4 w-full">
        <Icon name="arrow-right" /> Choose {plan === "annual" ? "yearly" : "monthly"}
      </span>
    </Link>
  );
}
