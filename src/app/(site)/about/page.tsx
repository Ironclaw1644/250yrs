import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { Editable } from "@/components/Editable";
import { EditableProse } from "@/components/EditableProse";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "True American Where helps everyday people find the real local stores — and helps mom-and-pop businesses get seen. Local stores. Local people. Global reach.",
  alternates: { canonical: "/about" },
};

const DEFAULT_STORY = `Main Street built this country — the fish fry that knows your order, the barber who's cut three generations, the tire shop that answers on the first ring. But when everything moved online, the big chains got the spotlight and the corner stores got buried.

True American Where exists to fix that. We're a local-business directory built for the real ones: the family kitchens, the neighborhood barbers and salons, the markets, the fix-it shops — the mom-and-pop businesses in every city, every state, and around the world.

For customers, it's simple: pick your town, pick what you need, and find the real local stores with photos, hours, prices, and reviews. For owners, it's affordable: one low price puts your shop in front of the neighbors searching for exactly what you do.`;

export default function AboutPage() {
  return (
    <div className="container-shell py-10">
      <p className="eyebrow">About us</p>
      <h1 className="font-heading text-h1 text-navy">
        <Editable id="copy.about.title">Local stores. Local people. Global reach.</Editable>
      </h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <EditableProse
          id="copy.about.story.body"
          className="max-w-prose space-y-4"
          paragraphClassName="text-char/90"
          fallback={DEFAULT_STORY}
        />
        <div className="relative hidden min-h-[20rem] overflow-hidden rounded-2xl shadow-raised lg:block">
          <Image
            src="/images/hero/hero-2.webp"
            alt="Warm American storefront at dusk"
            fill
            sizes="40vw"
            className="object-cover"
          />
        </div>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-3">
        {[
          { icon: "store", title: "Real businesses", body: "Every listing is a real local shop — never a lead-gen shell." },
          { icon: "tag", title: "Fair pricing", body: "$19.99/month or $100/year. No contracts, cancel anytime." },
          { icon: "heart", title: "Community first", body: "Reviews, favorites, and coupons that keep money on Main Street." },
        ].map((v) => (
          <div key={v.title} className="card p-6 text-center">
            <span className="pin-badge mx-auto h-14 w-14">
              <Icon name={v.icon} className="text-xl" />
            </span>
            <h2 className="mt-4 font-heading text-h3 text-navy">{v.title}</h2>
            <p className="mt-2 text-small text-stone">{v.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link href="/advertise" className="btn btn-gold">
          <Icon name="bullhorn" /> Put your business on the map
        </Link>
      </div>
    </div>
  );
}
