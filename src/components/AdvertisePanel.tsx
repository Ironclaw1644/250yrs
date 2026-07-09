import Image from "next/image";
import Link from "next/link";
import { Icon } from "./Icon";
import { Editable } from "./Editable";

const CHECKS = [
  "Reach more local customers",
  "Promote your products & services",
  "Affordable plans for everyone",
];

export function AdvertisePanel() {
  return (
    <section className="container-shell py-14 sm:py-20">
      <div className="sign-plate overflow-hidden !p-0">
        <div className="grid lg:grid-cols-[1.2fr_1fr]">
          <div className="p-8 sm:p-12">
            <p className="font-heading text-eyebrow font-semibold uppercase tracking-widest text-gold">
              Advertise your business
            </p>
            <h2 className="stamp mt-3 text-3xl uppercase text-cream sm:text-4xl">
              <Editable id="copy.home.advertise.headline">Get Your Business Seen!</Editable>
            </h2>
            <ul className="mt-6 space-y-3">
              {CHECKS.map((c) => (
                <li key={c} className="flex items-start gap-3 text-cream/90">
                  <Icon name="circle-check" className="mt-1 text-gold" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 grid max-w-md grid-cols-2 gap-4">
              <div className="rounded-lg bg-paper-raised p-4 text-center">
                <p className="eyebrow">Monthly</p>
                <p className="font-heading text-3xl font-bold text-navy">$19.99</p>
                <p className="text-small text-stone">per month</p>
              </div>
              <div className="relative rounded-lg bg-paper-raised p-4 text-center ring-2 ring-gold">
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gold px-2 py-0.5 font-heading text-[10px] font-bold uppercase tracking-wide text-navy-deep">
                  Best value
                </span>
                <p className="eyebrow">Yearly</p>
                <p className="font-heading text-3xl font-bold text-navy">$100</p>
                <p className="text-small text-stone">per year</p>
              </div>
            </div>
            <p className="mt-3 text-small text-cream/70">
              Add-ons: video ads · featured placement · coupon campaigns · and more
            </p>

            <Link href="/advertise" className="btn btn-gold mt-7">
              <Icon name="bullhorn" /> Get started today
            </Link>
          </div>

          <div className="relative hidden min-h-[22rem] lg:block">
            <Image
              src="/images/marketing/advertise-1.webp"
              alt="Shop owner opening their store"
              fill
              sizes="40vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy-deep/60 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
