import Link from "next/link";
import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "TV Spots — Put Your Business on TV",
  description:
    "Run a real commercial on your True American Where listing. Upload your own video free, or let our AI studio make one — Motion spots from your photos, or cinematic Premium AI commercials.",
};

const STEPS = [
  {
    icon: "store",
    title: "List your business",
    body: "Sign up and add your business — photos, hours, the works. Already listed? You're ready.",
  },
  {
    icon: "gauge-high",
    title: "Open your dashboard",
    body: "Go to Your Account → Business Dashboard, pick your business, and open the TV Ads tab.",
  },
  {
    icon: "film",
    title: "Add your spot",
    body: "Upload your own video free (up to 60 seconds), or grab credits and let our studio create one from your photos and story.",
  },
  {
    icon: "circle-check",
    title: "Go on air",
    body: "We review every spot — usually within a day — then it plays right on your listing, with every view counted in your analytics.",
  },
];

const TIERS = [
  {
    label: "Motion",
    icon: "image",
    cost: "1 credit",
    src: "/videos/example-motion.mp4",
    poster: "/videos/example-motion-poster.jpg",
    points: [
      "Built from your own photos",
      "Smooth motion, branded end card",
      "Perfect for seasonal refreshes",
    ],
  },
  {
    label: "Premium AI",
    icon: "wand-magic-sparkles",
    cost: "3 credits",
    src: "/videos/example-premium.mp4",
    poster: "/videos/example-premium-poster.jpg",
    points: [
      "Cinematic, TV-quality production",
      "Camera moves, scenes, golden-hour polish",
      "Made from your tagline and story",
    ],
  },
];

const PACKS = [
  { label: "Starter", price: "$29", credits: "1 credit" },
  { label: "Pro", price: "$69", credits: "3 credits", popular: true },
  { label: "Studio", price: "$199", credits: "10 credits" },
];

export default function TvSpotsPage() {
  return (
    <>
      {/* ============ Hero: the looping example commercial ============ */}
      <section className="bg-navy-deep py-14 text-cream sm:py-20">
        <div className="container-shell">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-sans text-eyebrow font-bold uppercase tracking-[0.1em] text-gold">
              <Icon name="tv" className="mr-1.5" /> TV Spots
            </p>
            <h1 className="stamp mt-3 text-4xl text-cream sm:text-5xl">
              Your shop. On the air.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lead text-cream/90">
              A real commercial, playing on your listing for every customer who finds
              you — for less than a tank of gas, not an agency budget.
            </p>
          </div>
          <div className="relative mx-auto mt-8 max-w-3xl overflow-hidden rounded-2xl bg-black p-2 shadow-raised sm:p-3">
            <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl ring-2 ring-inset ring-gold/60" />
            <span className="absolute left-5 top-5 z-10 inline-flex items-center gap-1.5 rounded-full bg-barn px-2.5 py-0.5 font-sans text-xs font-bold uppercase tracking-wide text-cream">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cream" /> Example spot
            </span>
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/videos/example-premium-poster.jpg"
              className="aspect-video w-full rounded-xl object-cover"
            >
              <source src="/videos/example-premium.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="btn btn-gold">
              <Icon name="bullhorn" /> Get started
            </Link>
            <Link href="/advertise" className="btn btn-secondary !border-cream/40 !text-cream hover:!bg-navy">
              View advertising plans
            </Link>
          </div>
        </div>
      </section>

      {/* ============ The two ways to get a spot ============ */}
      <section className="container-shell py-14 sm:py-20">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Two ways to make one</p>
            <h2 className="mt-2 font-heading text-h1 text-navy">
              Upload your own — or let the studio roll
            </h2>
            <p className="mt-3 text-lead text-stone">
              Uploading a video you already have is always free. Want one made?
              Pick a production style:
            </p>
          </div>
        </Reveal>

        <div className="mx-auto mt-9 grid max-w-4xl gap-6 sm:grid-cols-2">
          {TIERS.map((t, i) => (
            <Reveal key={t.label} delayMs={i * 120}>
              <div className="card overflow-hidden !p-0">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster={t.poster}
                  className="aspect-video w-full object-cover"
                >
                  <source src={t.src} type="video/mp4" />
                </video>
                <div className="p-6">
                  <p className="flex items-center justify-between font-heading text-h3 text-navy">
                    <span>
                      <Icon name={t.icon} className="mr-2 text-gold" />
                      {t.label}
                    </span>
                    <span className="rounded-full bg-navy px-3 py-1 font-sans text-small font-bold text-gold">
                      {t.cost}
                    </span>
                  </p>
                  <ul className="mt-3 space-y-2">
                    {t.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-char">
                        <Icon name="circle-check" className="mt-1 text-gold" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Credit packs */}
        <Reveal className="mx-auto mt-10 max-w-3xl">
          <div className="sign-plate p-6 sm:p-8">
            <p className="text-center font-sans text-eyebrow font-bold uppercase tracking-[0.1em] text-gold">
              Credit packs
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {PACKS.map((p) => (
                <div
                  key={p.label}
                  className={`rounded-lg border-2 p-4 text-center ${
                    p.popular ? "border-gold bg-gold/15" : "border-cream/20 bg-navy/40"
                  }`}
                >
                  <p className="font-sans text-small font-bold text-cream">
                    {p.label}
                    {p.popular && (
                      <span className="ml-2 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold text-navy-deep">
                        POPULAR
                      </span>
                    )}
                  </p>
                  <p className="font-heading text-3xl font-bold text-gold">{p.price}</p>
                  <p className="text-small text-cream">{p.credits}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-small text-cream">
              Credits never expire, and if a spot doesn&apos;t pass review your credits
              come right back.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ============ How it works ============ */}
      <section className="paper-grain border-y border-navy/10 py-14 sm:py-20">
        <div className="container-shell">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="eyebrow">How it works</p>
              <h2 className="mt-2 font-heading text-h1 text-navy">
                From your dashboard to on air
              </h2>
            </div>
          </Reveal>
          <div className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delayMs={i * 100}>
                <div className="card relative h-full p-6 pt-9">
                  <span className="absolute -top-4 left-6 grid h-9 w-9 place-items-center rounded-full bg-barn font-sans text-small font-bold text-cream">
                    {i + 1}
                  </span>
                  <span className="pin-badge h-12 w-12">
                    <Icon name={s.icon} className="text-lg" />
                  </span>
                  <h3 className="mt-3 font-heading text-h3 text-navy">{s.title}</h3>
                  <p className="mt-2 text-small text-stone">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Dashboard walkthrough */}
          <Reveal className="mx-auto mt-10 max-w-3xl">
            <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 font-heading text-h3 text-navy">
                  <Icon name="location-crosshairs" className="text-gold" /> Where to find it
                </h3>
                <p className="mt-1.5 text-char">
                  Sign in → <strong>Your Account</strong> → <strong>Business Dashboard</strong>{" "}
                  → pick your business → <strong>TV Ads</strong> tab. Your credit wallet,
                  uploads, and the AI studio all live there.
                </p>
              </div>
              <Link href="/dashboard" className="btn btn-primary shrink-0">
                <Icon name="arrow-right" /> Open my dashboard
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ Final CTA ============ */}
      <section className="container-shell py-14 text-center sm:py-16">
        <Reveal>
          <h2 className="font-heading text-h1 text-navy">Ready to go on air?</h2>
          <p className="mx-auto mt-3 max-w-xl text-lead text-stone">
            List your business, open the TV Ads tab, and your first spot can be
            playing this week.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="btn btn-gold">
              <Icon name="store" /> List your business
            </Link>
            <Link href="/contact" className="btn btn-secondary">
              Questions? Talk to us
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
