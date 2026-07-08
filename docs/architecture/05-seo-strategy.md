# True American Where — SEO Master Strategy

**Prepared for:** True American Where (trueamericanwear.com → trueamericanwhere.com)
**Document:** 05 — SEO Master Strategy
**Status:** Client-ready deliverable
**Last updated:** July 2026
**Stack context:** Next.js 15.5 App Router · React 19 · Supabase (`taw` schema) · Vercel · Resend

---

## 1. Executive Summary

True American Where is a local-business discovery platform organized as a clean hierarchy — **Country → State → City → Category → Business** — covering food (fried, soul, fish markets, grocery, food trucks, bakeries), hair salons, barber shops, tire shops, car washes, clothing, repair shops, and beauty supply. This structure is, in SEO terms, a **programmatic-SEO goldmine**: every intersection of *city + category* and every *business* is a page that maps directly onto how real people search — "**barber shop near me**," "**soul food in Memphis**," "**tire repair Atlanta**."

The opportunity is measured in **tens of thousands of high-intent, low-competition URLs**. The risk is equally real: if we generate those pages by swapping a city name into a template, Google treats them as **doorway pages and thin/duplicate content** and can suppress the entire site. The 2026 bar is explicit — a page that mentions a city six times but carries no location-specific substance is "a national page wearing a costume," and modern programmatic SEO succeeds only when each page is a genuine **destination** that earns its place in the index.

This strategy is therefore built on one principle: **scale + uniqueness together, never one without the other.** We pair a disciplined programmatic engine (city+category hubs, business pages) with hard **quality gates** (minimum unique-content thresholds, an eligibility rule so we never publish a page a data row can't support, and a pruning loop), rich **structured data** (LocalBusiness + subtypes, Breadcrumb, Review/AggregateRating, Offer, Menu, FAQ), a **tiered internal-linking architecture** that funnels crawl budget to priority pages, and a technical foundation (Next.js SSG/ISR, a sitemap *index* spanning many child sitemaps, canonical/hreflang, Core Web Vitals budget) purpose-built for large URL counts. We layer on **Answer Engine / Generative Engine Optimization (AEO/GEO)** because "near me" and local-intent queries increasingly resolve inside AI answers and voice search (roughly a third of searches are now voice).

**The single biggest opportunity** and the one thing to get right first: **own the `[category] in [city]` and `[category] near me` layer** with genuinely useful, data-differentiated hub pages backed by real listings and reviews. That layer is where nearly all commercial local intent lives, where competition from generic directories is weakest at the neighborhood level, and where our marketplace data (menus, prices, hours, reviews, live specials) gives us content no competitor can cheaply replicate.

---

## 2. Keyword Strategy

Local search intent falls into predictable, high-value patterns. We target each with a dedicated page type.

### 2.1 Intent clusters

| Cluster | Example queries | Target page type |
|---|---|---|
| **"Near me"** | "barber shop near me", "car wash near me", "food truck near me" | City+category hub (geo-resolved) + business pages |
| **Category + city** | "soul food in Memphis", "tire shop Atlanta", "beauty supply Houston" | City+category hub |
| **Service + location** | "oil change and tire rotation Dallas", "wash and fold near downtown", "kids haircut Brooklyn" | City+category hub sub-sections / service pages |
| **Business/brand** | "Big Mike's Barbershop Kingston", "[business name] hours/menu/phone" | Business page |
| **Long-tail / modifier** | "best soul food in Memphis", "cheap tire shop open Sunday", "black-owned barber shop near me", "24 hour car wash" | Blog roundups + hub filters + FAQ blocks |
| **Transactional (marketplace)** | "order fried fish online [city]", "book barber appointment [city]", "mobile tire service [city]" | Business page (ordering/booking modules) + hub |

### 2.2 Prioritization

1. **Head local commercial** — `[category] in [major city]` (e.g. top 100 US metros × 13 categories ≈ 1,300 high-priority hubs). Publish, internally link, and submit these first.
2. **Business detail pages** — the deepest, most unique layer; each real listing is a defensible page.
3. **Long-tail modifiers** — "best," "open now," "cheap," "black-owned," "open Sunday," "24 hour" — served via hub filter states (indexable only where they produce a real result set) and blog roundups.
4. **International seed** — Jamaica → Kingston → Barber Shops as the template for foreign expansion.

### 2.3 Keyword research tooling

Seed from Google Search Console (once live), Google autocomplete / "People Also Ask", Google Keyword Planner, and a paid tool (Ahrefs/Semrush) for volume + difficulty. Build a **keyword-to-URL map** in a spreadsheet: one primary query per page, 2–4 secondary variants, mapped to the exact route. This map is the contract that prevents two pages from targeting the same query (**keyword cannibalization**).

---

## 3. Programmatic SEO Engine

The heart of the site. We generate pages from Supabase data via a small number of **templates**, each with strict uniqueness rules.

### 3.1 Page templates & routes

| Template | Route pattern | Approx. count |
|---|---|---|
| Country hub | `/us`, `/jm` | ~2 at launch |
| State hub | `/us/[state]` | 50 + territories |
| City hub | `/us/[state]/[city]` | Hundreds → thousands |
| **City + Category hub** ⭐ | `/us/[state]/[city]/[category]` | Cities × 13 categories — **the money layer** |
| Business page | `/us/[state]/[city]/[category]/[business-slug]` | Tens of thousands |
| Category (national) | `/categories/[category]` | 13 |

> The current repo uses `src/app` with `@/lib/seo` helpers and a working `sitemap.ts`/`robots.ts` — we extend that foundation rather than replacing it.

### 3.2 How we avoid thin content, duplicate content, and doorway penalties

This is the make-or-break of the whole project. Established 2026 guidance is that keyword-swapped clones are "automated thin content," and Google's own doorway-page policy targets pages created mainly for search engines that funnel users to the same destination. Our safeguards:

- **≥60% unique content per page.** No more than ~40% of any page may be boilerplate shared across the set. Uniqueness comes from *diverse data sources*, not synonyms: each business page pulls name, address, real hours, its own menu/service list with prices, its own photos, its own reviews, distance context, and owner-posted daily specials. Each city+category hub is composed of the *actual listings in that city* — a data set that is by definition unique per page.
- **Eligibility rule (quality gate at generation time).** A page is generated **only** if the underlying data can support a useful page. A city+category hub publishes only when it has **≥3 real or clearly-flagged-demo listings**; below that it is `noindex` (or 301'd to the parent city hub) until it fills in. We never emit a page for an empty data row.
- **Location-specific substance, not costume.** Hubs include genuinely local context: neighborhoods/areas served, a short human-readable intro generated from real data ("12 barber shops in East Nashville, average rating 4.6, 4 open on Sundays, price range $ to $$$"), map, and cross-links to nearby categories — never a paragraph of city name repeated six times.
- **Uniqueness on business pages** is carried by owner-generated and customer-generated content: photos, menus, specials, reviews. This is our moat — competitors regurgitating public data cannot replicate live specials and first-party reviews.
- **Pruning loop.** A scheduled job flags low-value pages (zero impressions after 90 days, stale/closed businesses, hubs that dropped below the eligibility threshold) and sets them to `noindex` or removes them. Low-value pages never sit indexable forever.
- **Demo listings** are clearly flagged as demo in the UI and — importantly — excluded from `AggregateRating`/`Review` schema and from any "best of" claims, so we never emit misleading structured data.

### 3.3 Content uniqueness at scale — the data model advantage

Because our differentiation is *data*, uniqueness scales for free as the marketplace fills: every menu item, price, photo, review, special, and appointment slot is content no template could fabricate. The engine's job is to **compose** that data into readable, genuinely useful pages — the more real businesses onboard, the stronger every hub above them becomes.

---

## 4. On-Page SEO

Consistent, templated-but-unique on-page patterns per page type.

### 4.1 Titles & meta (patterns)

- **City+category hub** — Title: `Barber Shops in Nashville, TN | True American Where` · Meta: `Find [N] local barber shops in Nashville. See hours, prices, reviews, photos, and directions. Book or call now.` (N pulled from data → unique).
- **Business page** — Title: `Big Mike's Barbershop — Barber Shop in Nashville, TN` · Meta pulls the real one-line description + rating + neighborhood.
- **State/city hub** — Title: `Local Businesses in Nashville, TN — Food, Hair, Tires & More`.
- Keep titles ≤ ~60 chars, metas ~150; front-load the primary keyword; every title/meta must vary by real data, never be a pure template constant.

### 4.2 H1s & heading structure

- Exactly **one H1** per page stating the entity: hub H1 = "Barber Shops in Nashville, TN"; business H1 = the business name.
- H2s carry secondary intent and long-tail: "Open Now", "Top Rated", "Cheap Barber Shops", "Barber Shops Near Downtown Nashville", "Frequently Asked Questions".

### 4.3 Internal linking clusters

- **Breadcrumb on every page** (Country › State › City › Category › Business), rendered visibly *and* as `BreadcrumbList` JSON-LD.
- **Sibling links:** each city+category hub links to the *other categories in the same city* (topical cluster) and to *the same category in nearby cities*.
- **Business → hub:** every business links up to its city+category hub and to related businesses in the same hub.
- **Contextual, descriptive anchor text** ("soul food in Memphis"), never "click here".

### 4.4 Breadcrumbs

Implemented once as a shared component that emits both the visible trail and JSON-LD — this is high-ROI: it earns breadcrumb rich results and reinforces the crawl hierarchy.

---

## 5. Technical SEO

Purpose-built for a large, data-driven Next.js 15 App Router site on Vercel.

### 5.1 Rendering strategy

- **SSG + ISR** as the default. Static-generate the head-priority hubs (top metros × categories, high-traffic business pages); use **Incremental Static Regeneration** (`revalidate`) for the long tail so pages are served fast from cache and refreshed on a timer or on-demand (owner edits, new reviews) — the standard pattern for large catalogs that update continuously.
- **On-demand revalidation** (`revalidatePath`) fired from the existing server-action flow when an owner updates hours, specials, menu, or photos — so SEO content stays fresh without a full rebuild.
- Everything SEO-critical (titles, meta, JSON-LD, body copy) is rendered **server-side** — never client-only — via the `generateMetadata` API.

### 5.2 Sitemaps for tens of thousands of URLs

- A single sitemap caps at **50,000 URLs / 50 MB**. Use Next's **`generateSitemaps()`** to emit a **sitemap index** with many child sitemaps (`/sitemap/[id].xml`), each batching ≤50k URLs from Supabase by range.
- **Segment child sitemaps by type** (hubs, businesses, blog) so we can watch indexation per segment in GSC and diagnose where coverage lags.
- Populate `lastmod` from real `updated_at` timestamps (not `new Date()`), so crawlers see true freshness — the current sitemap's static `lastModified` should be replaced with per-row timestamps.

### 5.3 robots, canonical, pagination

- **robots.ts:** allow crawl of public hierarchy; `Disallow` account/dashboard/checkout/API/search-results and any `?` filter URLs that don't produce indexable content. Reference the sitemap index.
- **Canonical** self-referencing on every page; filtered/sorted hub states canonicalize to the clean hub URL unless the filter yields a distinct, valuable result set worth indexing.
- **Pagination:** for long hubs, use crawlable paginated URLs with self-canonicals (not `rel=prev/next` reliance); ensure page 2+ is reachable via real links.

### 5.4 hreflang (international)

- With US + Jamaica (and future countries), emit `hreflang` (`en-US`, `en-JM`) with reciprocal annotations and an `x-default`. Country is the top path segment (`/us`, `/jm`) so locale mapping is clean.

### 5.5 Core Web Vitals & performance budget

- Targets: **LCP < 2.5s, INP < 200ms, CLS < 0.1** (mobile-first — this audience is overwhelmingly on phones).
- Next/Image for all photos (AVIF/WebP, explicit dimensions to prevent layout shift), lazy-load below the fold, reserve space for maps/ads.
- Ship minimal client JS; keep hubs and business pages server-rendered. Budget: keep third-party scripts (maps, analytics, Stripe) deferred/partitioned. Fonts self-hosted (the brand mandate forbids generic Inter/Roboto anyway — self-host the chosen Americana display + body faces with `font-display: swap`).

### 5.6 Mobile-first

Google indexes the mobile page. Every template is designed mobile-first with a big, obvious **Call Now** button, tap-friendly directions, and no interstitials — aligned with the "extremely easy for non-technical users" design mandate.

---

## 6. Structured Data (JSON-LD)

Structured data is essential for "near me" queries and increasingly for AI/voice answers. All markup is JSON-LD, server-rendered, and **must match visible content** (Google's accuracy policy).

| Schema | Where | Notes |
|---|---|---|
| **`Organization`** | Homepage | Name, logo, sameAs (social), contact. |
| **`WebSite` + `SearchAction`** | Homepage | Enables sitelinks search box. |
| **`LocalBusiness` + subtype** | Every business page | Use the *specific* subtype: `Restaurant`, `HairSalon`, `BarberShop` (as `HealthAndBeautyBusiness`/`HairSalon`), `AutoRepair`, `AutoWash`, `ClothingStore`, `Bakery`, `GroceryStore`, etc. Required: `name`, `address` (PostalAddress), `telephone`, `openingHoursSpecification`; strengthen with `geo` coordinates, `image`, `priceRange`, `url`, and `sameAs` → the business's Google Business Profile. |
| **`AggregateRating` + `Review`** | Business page | Only from **real** customer reviews; **never** demo. Omit entirely if no genuine reviews. |
| **`Menu` / `Offer` / `Product`** | Food & service businesses | Menu items and services with prices → eligible for rich results and AI answers. |
| **`Offer` (coupons/specials)** | Business page | Daily specials and coupons where applicable. |
| **`BreadcrumbList`** | Every page | From the shared breadcrumb component. |
| **`FAQPage`** | Hubs & business pages | "Is it open now? Do they take appointments? What's the price range?" — also fuels AEO/voice. |
| **`ItemList`** | City+category hubs | The list of businesses on the hub. |

**Guardrails:** markup accuracy must match on-page content; no rating markup without visible ratings; demo listings excluded from rating/review schema; validate with Google's Rich Results Test in CI.

---

## 7. Local SEO

Beyond on-site, local prominence is driven by relevance, distance, and prominence signals off-site.

- **Google Business Profile (GBP) guidance for listed businesses.** Provide owners an in-dashboard checklist and a Resend email series coaching them to claim/optimize their GBP: correct category, exact NAP, hours, photos, and — critically — link the GBP website field to their True American Where page. We can pre-fill and export their info to make claiming trivial (design mandate: self-explanatory for non-technical owners).
- **NAP consistency.** Name/Address/Phone must be byte-identical across our page, their GBP, and other citations. Enforce a canonical NAP record in Supabase and render it everywhere from that single source.
- **Citations / directories.** Encourage/enable listing on the major aggregators (Data Axle, Yelp, Bing Places, Apple Maps) with consistent NAP; our site itself becomes a high-quality citation.
- **Reviews velocity.** Our in-app reviews create a steady, first-party review stream. Prompt customers post-order/appointment (via Resend) to review — steady velocity of genuine reviews is a durable prominence signal and directly feeds our `AggregateRating`.

---

## 8. Content & Blog Strategy

Editorial content captures long-tail intent, earns links, and feeds AI answers — content the programmatic engine can't.

- **"Best X in [City]" roundups** — "Best Soul Food in Memphis," "Top-Rated Barber Shops in Nashville." Curated from our data + genuine editorial commentary. These win the "best" modifier queries and are highly linkable.
- **Local guides** — "Neighborhood Guide to Food Trucks in Austin," "Where to Get Your Tires Done Before a Road Trip."
- **City landing content** — a substantive, human intro on major city hubs (local flavor, not filler).
- **Owner resources** — "How small businesses get found online," which doubles as top-of-funnel for advertiser acquisition.
- **Cadence:** start with the top 10–20 metros × top categories; expand as data deepens. Every post links down into the relevant hubs (link equity flows to money pages).
- **AEO/GEO framing:** structure posts with clear question-based H2s, concise answer-first paragraphs, and FAQ schema so AI answer engines can lift and attribute them.

---

## 9. Backlinks & Digital PR

In 2026, 20–40 highly relevant local links beat hundreds of generic ones; contextual relevance and topical authority dominate.

- **Chambers of Commerce** — membership typically yields a permanent directory backlink plus newsletter/resource-page inclusion and event co-sponsorship press. Pursue chamber links in launch metros.
- **Local news & digital PR** — pitch data stories ("The 10 best soul-food cities in America, by the numbers") using our aggregate data; local outlets and food/lifestyle writers link to data.
- **Business-owner co-marketing** — give every advertiser a "Featured on True American Where" badge + embeddable widget linking back; thousands of small-business sites become contextual backlinks.
- **Resource pages & associations** — regional industry associations (barbers, restaurateurs, auto-service), local universities, workforce programs.
- **Sponsorship/scholarship angles** — sponsor a local event or a small-business scholarship for earned local links and goodwill.
- **HARO/expert sourcing** — respond as a "local small-business marketplace" source for press mentions.
- **Digital PR feeds AEO/GEO** — third-party mentions, interviews, and articles are exactly what AI answer engines pull from, so PR compounds both classic backlinks and AI visibility.

---

## 10. Indexation Strategy (Large URL Counts)

Getting tens of thousands of URLs *crawled and indexed* is a distinct problem from ranking them.

- **Tiered internal linking / crawl budget.** Home → country/state → city → city+category → business, with the head-priority hubs linked from higher tiers so crawl budget concentrates on pages that can rank. Orphan pages get discovered only via sitemaps and crawl last.
- **Publish in waves.** Don't dump 50k URLs on day one. Launch the ~1,300 priority hubs + seeded/demo businesses, get them indexed, then expand — this avoids diluting crawl signal and lets us watch quality per wave.
- **Segmented sitemaps** (see §5.2) let us monitor "submitted vs indexed" per segment in GSC and spot thin-content suppression early.
- **Priority-URL submission.** Submit the priority hub sitemap first; use the Indexing API / GSC URL inspection for the most important new pages.
- **Eligibility + pruning (see §3.2)** keep the crawlable set high-quality so Google keeps crawling deeply.

---

## 11. Measurement

- **Google Search Console** — verify (DNS), submit the sitemap index, watch Coverage/Indexing per segment, Performance by query/page, and Core Web Vitals. The primary programmatic-SEO dashboard.
- **Bing Webmaster Tools** — verify + submit sitemaps (also feeds some AI answer engines).
- **GA4** — organic acquisition, city/category landing performance, and marketplace conversions (order/booking/call-now events). Reuse the existing analytics/events table pattern for first-party tracking.
- **Rank tracking** — track a representative basket of `[category] in [city]` and `[category] near me` terms across launch metros (Ahrefs/Semrush).
- **AI-visibility tracking** — periodically check presence/citations in AI answers (ChatGPT/Gemini/Perplexity) for key local queries.
- **KPIs:** indexed-URL count & indexation rate per segment; organic sessions; hub & business impressions/clicks (GSC); "near me"/local-pack visibility; review velocity; marketplace conversions from organic; backlink count from relevant local domains; Core Web Vitals pass rate.

---

## 12. 90-Day Roadmap

### Weeks 1–2 — Foundation
- Verify GSC + Bing; install GA4; wire first-party events table.
- Ship route templates: country/state/city/**city+category**/business, with `generateMetadata`, breadcrumbs, and JSON-LD components.
- Replace static-`lastModified` sitemap with **`generateSitemaps()`** index (segmented, real `lastmod`); update `robots.ts` (disallow dashboard/checkout/API/filter URLs; reference sitemap index).
- Implement the **eligibility rule** (≥3 listings to index a hub) and the **≥60% uniqueness** content composition.
- Seed all US states + major cities + all categories + demo businesses (flagged demo) + Jamaica→Kingston→Barber Shops.
- Set the Core Web Vitals budget; self-host brand fonts; Next/Image everywhere.

### Weeks 3–6 — Priority coverage & structured data
- Publish + submit the **~1,300 priority `[category] in [top-100-metro]` hubs**; internally link them.
- Complete structured data across all templates (LocalBusiness subtypes, Review/AggregateRating for real reviews only, Menu/Offer, FAQ, ItemList); validate in CI with Rich Results Test.
- Launch blog: first 10–20 "Best X in [City]" roundups + a few local guides, linking into hubs.
- Begin GBP owner-coaching email series (Resend); export/pre-fill NAP for claiming.
- Start local link building: chamber memberships + advertiser "Featured on" badge/widget.

### Weeks 7–12 — Scale, links, and pruning
- Expand hub + business coverage in waves; monitor submitted-vs-indexed per segment.
- Digital-PR data-story pitch to local news; pursue resource-page and association links.
- Turn on the **pruning loop** (noindex zero-impression/stale pages after 90 days).
- Ramp review-velocity prompts post-order/appointment.
- Expand blog to more metros; begin AEO/GEO tuning (answer-first content, FAQ schema) and AI-visibility tracking.

---

## 13. Launch-Day SEO Checklist

- [ ] GSC + Bing verified; sitemap **index** submitted; GA4 live.
- [ ] `robots.ts` allows public hierarchy, disallows dashboard/checkout/API/filter URLs, references sitemap index.
- [ ] Every page: one H1, unique title + meta from real data, self-referencing canonical.
- [ ] Breadcrumbs (visible + `BreadcrumbList` JSON-LD) on every page.
- [ ] LocalBusiness (correct subtype) on every business page; **no rating/review schema on demo listings**; markup matches visible content (Rich Results Test passes).
- [ ] Eligibility rule live (no empty/thin hubs indexed); noindex on below-threshold pages.
- [ ] hreflang emitted for US + Jamaica with x-default.
- [ ] Core Web Vitals within budget on mobile (LCP/INP/CLS); Next/Image; fonts self-hosted with swap.
- [ ] Priority hubs internally linked from home/state/city tiers.
- [ ] `lastmod` from real timestamps; ISR + on-demand revalidation wired to owner edits.
- [ ] 404/410 for removed listings; 301s for the trueamericanwear → trueamericanwhere and clothing-site → directory migration (preserve any existing equity).

---

## Sources

- [Programmatic SEO Best Practices — SEOmatic](https://seomatic.ai/blog/programmatic-seo-best-practices)
- [Programmatic SEO Quality Rules to Avoid Thin Content — BlogSEO](https://www.blogseo.io/blog/programmatic-seo-quality-rules-avoid-thin-content)
- [Programmatic SEO for Local Service Area Pages: 2026 Guide — TopicalMap](https://topicalmap.ai/blog/auto/programmatic-seo-for-local-service-area-pages)
- [Best Practices for Local SEO in 2026 — Digital Neighbor](https://digitalneighbor.com/local-seo-best-practices)
- [Local Business (LocalBusiness) Structured Data — Google Search Central](https://developers.google.com/search/docs/appearance/structured-data/local-business)
- [Local Business Schema Markup: 2026 Ultimate Guide — Zumeirah](https://zumeirah.com/local-business-schema-markup-2026-ultimate-guide/)
- [Local SEO In 2026: What Still Moves Rankings — Emarketed](https://emarketed.com/seo/local-seo-2026-service-business-rankings/)
- [Functions: generateSitemaps — Next.js](https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps)
- [Metadata Files: sitemap.xml — Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Next.js Sitemap Guide 2026 — TheTimeLens](https://www.thetimelens.org/blog/next-js-sitemap-guide-2026-fix-indexing-issues-and-build-scalable-seo-architecture)
- [Local Link Building Through B2B Partnerships (Chamber of Commerce) — ALM Corp](https://almcorp.com/blog/local-link-building-b2b-partnerships/)
- [Link Building for Small Businesses in 2026 — W3era](https://www.w3era.com/blog/seo/link-building-small-business/)
- [Google's Guide to Optimizing for Generative AI Features on Search — Google Search Central](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Answer Engine Optimization (AEO): AI visibility in 2026 — Evergreen Media](https://www.evergreen.media/en/guide/answer-engine-optimization/)
