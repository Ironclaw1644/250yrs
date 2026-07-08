# 06 — Legal & Policy Suite

> **TEMPLATE — NOT LEGAL ADVICE.** Every document below is a drafting template for **True American Where** ("TAW" / "the Platform"), a US-based local-business advertising and marketplace platform that processes payments via Stripe Connect. **Have a licensed attorney (US, and any state where you actively solicit) review, customize, and approve every document before publishing.** Bracketed `[LIKE THIS]` fields must be completed. Do not publish with placeholders. Nothing here creates an attorney-client relationship.
>
> **Operating assumptions baked into these drafts** (confirm before publishing):
> - Legal entity: `[LEGAL ENTITY NAME, e.g. True American Where, LLC]`, a `[STATE]` `[LLC/corporation]`, principal address `[ADDRESS]`.
> - Governing law / venue: `[STATE]` (see Risk #3 re: arbitration).
> - The Platform is an **advertising directory + marketplace intermediary**. For marketplace transactions (food orders, appointments, tire service), the **business is the merchant of record and seller**; TAW is **not** a party to that sale. Payments flow via **Stripe Connect (Express), destination charges + platform application fee**.
> - Advertising subscriptions: **$19.99/month OR $100/year** (auto-renewing) via **Stripe embedded checkout on-site**, plus optional paid add-ons.
> - Sub-processors: Supabase (DB/auth/storage), Stripe (payments/KYC), Resend (email), OpenAI (demo image generation only), Vercel (hosting), Google Maps (maps/geocoding).
> - Contacts: legal `[legal@trueamericanwhere.com]`, privacy `[privacy@…]`, DMCA agent `[dmca@…]`, support `[support@…]`.
> - Current domain trueamericanwear.com → future trueamericanwhere.com. Use the live domain in published copy.

---

## 0. Policy Inventory — every document this business type needs

| # | Document | Primary audience | Why it is required |
|---|---|---|---|
| 1 | **Terms of Service (Platform / Master)** | All users | Contract to use the site; liability limits, disclaimers, dispute resolution. |
| 2 | **Privacy Policy** (incl. CCPA/CPRA + GDPR + state laws) | All users | Legally mandated notice of data practices; CCPA/CPRA, VA/CO/CT/UT etc., GDPR for EU visitors. |
| 3 | **Cookie Policy** | All web visitors | Consent + disclosure of cookies/trackers (CPRA opt-out, ePrivacy/GDPR consent). |
| 4 | **Acceptable Use Policy (AUP)** | All users | Prohibited conduct/content; basis for suspension/takedown. |
| 5 | **Advertiser / Business Owner Terms** | Business owners | Subscription billing, auto-renew (CA ARL), cancellation, ad-fee refunds, content license, listing accuracy. |
| 6 | **Marketplace & Payments Terms** | Buyers + sellers | Merchant-of-record, TAW not a party, Stripe Connect payouts, chargebacks, taxes. |
| 7 | **Refund & Cancellation Policy** | Buyers + advertisers | Split rules: ad fees vs marketplace orders/bookings. |
| 8 | **DMCA / Copyright Policy** | Rightsholders + users | 17 U.S.C. §512 safe harbor; registered agent; notice/counter-notice/repeat-infringer. |
| 9 | **Community & Review Guidelines** | Reviewers + owners | Anti-fake-review (FTC 16 CFR Part 465), moderation, takedown. |
| 10 | **Accessibility Statement** | All users | ADA / WCAG 2.1 AA commitment + feedback channel. |
| 11 | **Contact & Disclosures** | All users | Entity identity, advertising/demo-content disclosure, contact routing. |

**Supporting / operational documents (recommended, not drafted in full here — flagged for counsel):**
Business Associate / DPA & Sub-processor list (for CCPA "service provider" + GDPR Art. 28 contracts); Stripe Connected Account Agreement acceptance flow; SMS/A2P 10DLC & TCPA consent language (if texting customers); Email/CAN-SPAM footer + unsubscribe; Law-Enforcement Data-Request policy; Data-Retention & Deletion schedule; Chargeback/Dispute internal SOP; Trust & Safety escalation runbook; Insurance (tech E&O / cyber / general liability) — see risks.

---

## 1. Terms of Service (Platform / Master Agreement)

**Effective date:** `[DATE]` · **Last updated:** `[DATE]`

### 1.1 Acceptance
By accessing or using `[trueamericanwhere.com]` (the "Site") or any related services (collectively, the "Services"), you agree to these Terms of Service ("Terms"), our Privacy Policy, Cookie Policy, and Acceptable Use Policy, all incorporated by reference. If you use the Services on behalf of a business, you represent you are authorized to bind that business. **If you do not agree, do not use the Services.**

### 1.2 Who we are
The Services are operated by `[LEGAL ENTITY NAME]` ("True American Where," "TAW," "we," "us"). We operate an online directory and marketplace that helps customers ("Customers") discover local businesses ("Businesses" / "Advertisers") and, where offered, order food, book appointments, or request services from those Businesses.

### 1.3 What TAW is — and is not
TAW is a **technology platform and advertising venue**. **We are not the seller, manufacturer, provider, or merchant of record** for any food, product, appointment, or service listed by a Business. Each Business is solely responsible for its listings, offerings, pricing, fulfillment, licensing, food safety, and legal compliance. **Transactions for goods/services are between the Customer and the Business.** See the Marketplace & Payments Terms.

### 1.4 Eligibility
You must be at least 18 (or the age of majority in your state) to create an account or transact. The Services are intended for users in the United States; we make no representation that the Services are appropriate elsewhere.

### 1.5 Accounts and roles
Accounts have roles: **Customer**, **Business Owner**, or **Admin**. You are responsible for your credentials and all activity under your account. Notify us immediately of unauthorized use. We may refuse, suspend, or terminate accounts at our discretion (see §1.13).

### 1.6 Demo / illustrative content
To showcase the Platform, some listings, photos (including AI-generated images), specials, or reviews may be **demonstration content clearly labeled "Demo."** Demo content does not represent a real business, offer, or endorsement. Do not attempt to transact against demo listings.

### 1.7 User content & license to TAW
"User Content" means anything you submit (photos, menus, prices, hours, coupons, videos, reviews, messages). You retain ownership of your User Content. You grant TAW a **worldwide, non-exclusive, royalty-free, sublicensable license** to host, store, reproduce, adapt, display, and distribute your User Content for operating, promoting, and improving the Services. You represent you have all rights to grant this license and that your User Content does not violate law or third-party rights. (Business media licensing is further detailed in the Advertiser Terms §5.)

### 1.8 Acceptable use
Your use is governed by the Acceptable Use Policy. Violations may result in content removal, suspension, or termination.

### 1.9 Third-party services
The Services rely on third parties (e.g., Stripe for payments, Google Maps for maps/directions). Your use of those features may be subject to their terms. We are not responsible for third-party services, and links to third-party sites are not endorsements.

### 1.10 Fees
Advertising subscriptions and add-ons are governed by the **Advertiser / Business Owner Terms**. Marketplace purchases are governed by the **Marketplace & Payments Terms**. All fees are in US dollars.

### 1.11 Intellectual property (TAW's)
The Site, its design, logos ("True American Where," the eagle/flag marks), and software are owned by TAW or its licensors and protected by IP laws. We grant you a limited, revocable, non-transferable license to use the Services for their intended purpose. No scraping, framing, or reverse engineering except as law requires.

### 1.12 Disclaimers
**THE SERVICES AND ALL LISTINGS ARE PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND**, express or implied, including merchantability, fitness for a particular purpose, non-infringement, and any warranty regarding the accuracy of listings, business hours, pricing, availability, food safety, or the quality/legality of any Business's goods or services. We do not guarantee uninterrupted or error-free operation.

### 1.13 Suspension & termination
We may suspend or terminate access, remove content, or withdraw a listing at any time, with or without notice, for suspected violation of these Terms or law, risk to users, or non-payment. You may stop using the Services at any time; certain provisions survive (§§1.7, 1.11–1.16).

### 1.14 Limitation of liability
**TO THE MAXIMUM EXTENT PERMITTED BY LAW, TAW AND ITS OFFICERS, EMPLOYEES, AND AGENTS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR LOST PROFITS/DATA/GOODWILL, ARISING FROM OR RELATED TO THE SERVICES OR ANY TRANSACTION WITH A BUSINESS.** TAW's **aggregate liability** for all claims will not exceed the **greater of (a) the amount you paid TAW in the 6 months before the claim, or (b) $100.** Some jurisdictions do not allow certain limitations; these apply to the fullest extent permitted.

### 1.15 Indemnification
You will indemnify and hold harmless TAW from claims, losses, and expenses (including reasonable attorneys' fees) arising from your User Content, your use of the Services, your violation of these Terms or law, or (for Businesses) your goods/services and transactions with Customers.

### 1.16 Dispute resolution — arbitration & class-action waiver `[ATTORNEY REVIEW — SEE RISK #3]`
`[OPTIONAL — negotiate with counsel]` **Except for small-claims and IP matters, disputes will be resolved by binding individual arbitration** administered by `[AAA/JAMS]` under its consumer rules, seated in `[COUNTY, STATE]`. **You and TAW waive class actions and jury trials.** **A 30-day opt-out** is available by emailing `[legal@…]` within 30 days of first accepting these Terms. If this clause is unenforceable, disputes proceed in the courts of §1.17.

### 1.17 Governing law & venue
These Terms are governed by the laws of the State of `[STATE]`, without regard to conflict-of-laws rules. Subject to §1.16, exclusive venue is the state/federal courts located in `[COUNTY, STATE]`.

### 1.18 Changes to the Terms
We may update these Terms; material changes will be notified via the Site or email. Continued use after the effective date constitutes acceptance.

### 1.19 Miscellaneous
Entire agreement; severability; no waiver; assignment (you may not assign; we may); force majeure; notices to `[legal@…]`.

### 1.20 Contact
`[LEGAL ENTITY NAME]`, `[ADDRESS]`, `[legal@trueamericanwhere.com]`.

---

## 2. Privacy Policy

**Effective / Last updated:** `[DATE]`

### 2.1 Scope
This Policy explains how `[LEGAL ENTITY NAME]` collects, uses, discloses, and protects personal information through the Services. It includes specific disclosures for **California (CCPA/CPRA)**, other **US state privacy laws**, and the **EU/UK (GDPR/UK GDPR)**.

### 2.2 Information we collect
- **You provide:** name, email, phone, password, mailing/billing address; for Businesses — business name, address, hours, category, listing media, menus/prices, coupons, tax/ownership info required by Stripe onboarding.
- **Transactions:** orders, bookings, service requests, favorites, reviews, messages, coupon redemptions. **Full card numbers are handled by Stripe; we do not store card PANs.**
- **Automatic:** IP address, device/browser, pages viewed, referrer, approximate location (from IP or, with permission, precise geolocation for "search nearby"), and analytics events (page_view, product_view, listing_view, click_to_call, etc.).
- **Cookies/SDKs:** see the Cookie Policy.
- **From third parties:** Stripe (payment status, payout/KYC verification results — not full card data), map/geocoding data from Google, and Businesses (their listing content).

### 2.3 How we use it
Provide and operate the Services; process advertising subscriptions and route marketplace payments; enable ordering/booking/service requests; show maps/directions; send transactional email and (with consent where required) marketing/coupon emails; analytics and product improvement; fraud prevention, safety, and moderation; legal compliance and enforcement of our Terms.

### 2.4 Legal bases (GDPR/UK GDPR)
Contract (providing the Services); legitimate interests (security, analytics, improving the Services); consent (marketing emails, precise geolocation, non-essential cookies); legal obligation (tax, law-enforcement requests). You may withdraw consent at any time.

### 2.5 How we share — third parties & sub-processors
We do **not sell** personal information for money. We share with service providers/processors under contract:

| Provider | Purpose | Data involved |
|---|---|---|
| **Supabase** | Database, authentication, file storage | Account data, listings, media, events |
| **Stripe** | Advertising subscription billing; marketplace payments & Connect payouts; KYC | Name, email, billing/payout, tax ID, transaction data (card data handled directly by Stripe) |
| **Resend** | Transactional & marketing/coupon email | Name, email, message content |
| **OpenAI** | **Demo image generation only** (no real customer PII sent) | Prompt text for demo photos |
| **Vercel** | Website hosting / edge delivery | Request logs, IP, usage |
| **Google Maps** | Maps, geocoding, directions | Approximate/precise location, search queries |

We may also disclose for legal reasons (subpoenas, safety) and in a merger/acquisition (with notice). See §2.11 re: whether analytics cookies constitute a "sale"/"share" under CPRA.

### 2.6 Retention
We keep personal information as long as your account is active and as needed for the purposes above, then delete or de-identify it, subject to legal/tax/dispute retention (e.g., transaction records for `[7]` years). Detailed schedule: `[link to retention schedule]`.

### 2.7 Security
We use reasonable administrative, technical, and physical safeguards (encryption in transit, access controls, RLS default-deny on our database). No system is perfectly secure.

### 2.8 Children
The Services are not directed to children under 13, and we do not knowingly collect their data. We will delete such data if discovered.

### 2.9 Your US state privacy rights (CCPA/CPRA, VA, CO, CT, UT, and others)
Depending on your state, you may have rights to: **know/access**, **correct**, **delete**, **portability**, **opt out of "sale"/"sharing"/targeted advertising**, and **limit use of sensitive personal information**; and to **non-discrimination** for exercising rights. **California:** in the preceding 12 months we collected the categories in §2.2 (identifiers, commercial, internet activity, geolocation, and — for Businesses — professional/financial-onboarding data). We **do not sell** personal information; whether analytics/advertising cookies constitute a "share" is addressed in the Cookie Policy, where a **"Do Not Sell or Share My Personal Information"** control and Global Privacy Control (GPC) recognition are provided. To exercise rights: `[privacy@…]` or `[toll-free number / web form]`. We will verify your request; authorized agents may submit requests with proof. Appeal (VA/CO/CT): `[privacy@…]`.

### 2.10 EU/UK rights (GDPR)
Access, rectification, erasure, restriction, portability, objection, and the right to lodge a complaint with your supervisory authority. International transfers rely on `[Standard Contractual Clauses / provider mechanisms]`. EU/UK representative: `[if applicable]`.

### 2.11 Do Not Track / GPC
We honor recognized **Global Privacy Control** signals as an opt-out of sale/sharing where applicable.

### 2.12 Changes & contact
We may update this Policy; material changes will be notified. Contact: `[privacy@trueamericanwhere.com]`, `[ADDRESS]`.

---

## 3. Cookie Policy

**Last updated:** `[DATE]`

### 3.1 What cookies we use
- **Strictly necessary:** authentication/session (Supabase), security, load balancing (Vercel). Cannot be switched off.
- **Functional:** remembering preferences, saved location, favorites.
- **Analytics:** understanding usage and business ad views (first-party events; `[+ any analytics provider]`).
- **Advertising/targeting:** `[only if used — e.g., for featured-placement measurement]`.

### 3.2 Third-party cookies/technologies
Stripe (fraud prevention on checkout), Google Maps (map tiles/embeds), and `[any others]` may set cookies when you use those features.

### 3.3 Your choices
Manage non-essential cookies via our **cookie banner / preferences center**. California and other users may use the **"Do Not Sell or Share My Personal Information"** link and we honor **GPC**. You can also control cookies in your browser. Blocking necessary cookies may break the Site.

### 3.4 Consent
In the EU/UK we obtain **consent before setting non-essential cookies**. In the US, non-essential cookies may be set with an opt-out. `[Confirm CMP configuration per region.]`

---

## 4. Acceptable Use Policy (AUP)

You agree **not** to:
- Post false, misleading, deceptive, illegal, infringing, defamatory, harassing, hateful, or obscene content;
- List or sell anything unlawful, or that requires a license you lack (e.g., alcohol, tobacco, firearms, cannabis, prescription items, unlicensed food service) — `[itemize restricted categories with counsel]`;
- Post **fake, incentivized, or undisclosed-conflict reviews**, or manipulate ratings (see Review Guidelines and FTC 16 CFR Part 465);
- Impersonate any person/business or claim a listing you don't own/represent;
- Upload malware, scrape/crawl without permission, bypass rate limits, or probe/breach security;
- Infringe IP or privacy rights; upload media you don't have rights to;
- Use the Services to send spam or violate TCPA/CAN-SPAM;
- Misuse payments (fraud, money laundering, prohibited Stripe categories);
- Harvest other users' data or interfere with the Services.

**Enforcement:** we may remove content, throttle, suspend, or terminate, withdraw listings, withhold or reverse payouts for fraud, and report unlawful activity. Repeat infringers are terminated (see DMCA policy).

---

## 5. Advertiser / Business Owner Terms

**These Terms supplement the Platform ToS and apply to any Business that creates a listing or purchases advertising.**

### 5.1 Listings & accuracy
You are solely responsible for the accuracy and legality of your listing (name, address, hours, phone, menu/services, **prices**, coupons, media). You must keep it current and hold all licenses/permits required to operate and to sell what you list. Misrepresentation is grounds for takedown.

### 5.2 Subscription plans, billing & **auto-renewal** `[CALIFORNIA ARL — SEE RISK #2]`
Advertising is offered as **$19.99/month** or **$100/year** (annual is a discounted alternative, not an add-on to monthly). Optional paid **add-ons**: video ads, featured/front-page city+state placement, coupon campaigns, daily specials, promotional emails. Prices, billing frequency, and any free-trial terms are shown at checkout, which is processed **on-site via Stripe**.

> **AUTOMATIC RENEWAL — PLEASE READ.** Your subscription **automatically renews** at the end of each term (monthly or annual) and **your payment method is automatically charged** the then-current price until you cancel. **You may cancel at any time** in `[Account → Billing]` or by emailing `[support@…]`; cancellation stops the next renewal. We will send **renewal reminders and clear auto-renewal/cancellation disclosures** as required by the **California Automatic Renewal Law (Bus. & Prof. Code §17600 et seq.)** and similar state laws, including affirmative consent at signup and an **easy online cancellation ("click-to-cancel")** path. `[Confirm reminder cadence — e.g., annual plans: 15–45 days before renewal — with counsel per state.]`

### 5.3 Cancellation & effect
Canceling stops future renewals. Your paid features remain active through the **end of the current paid term**; we do not re-charge after cancellation. Listings may revert to a free/basic state or be unpublished per plan.

### 5.4 Refunds of advertising fees
See the Refund & Cancellation Policy §7. Summary: advertising fees are generally **non-refundable except where required by law** (e.g., ARL violations) or expressly stated (e.g., pro-rata for our service failure or a valid trial cancellation).

### 5.5 Content ownership & license for uploaded media
You retain ownership of media you upload. You grant TAW the license in ToS §1.7 to host and display it and to use it to promote your listing and the Platform. You represent you own or are licensed to use all uploaded media (including model/property releases and menu/photo rights) and that it does not infringe or violate privacy/publicity rights. You will indemnify TAW for claims arising from your media/listings (ToS §1.15).

### 5.6 Advertising standards
Ads and specials must be truthful, substantiated, and compliant (FTC advertising rules, pricing accuracy, disclosure of material terms on coupons — expiry, limits, exclusions). No bait-and-switch. We may reject or remove non-compliant ads.

### 5.7 Analytics
We provide view/engagement metrics for your listing on a best-efforts basis; metrics are estimates and not guaranteed for billing or third-party reporting.

### 5.8 Auto-publish & moderation
Paid listings **publish automatically upon successful payment**. We retain the right to moderate, suspend, or take down listings at any time for policy/legal reasons without refund except as required by law.

### 5.9 Stripe Connect onboarding
To receive marketplace payouts you must onboard as a **Stripe Connected Account (Express)** and accept the **Stripe Connected Account Agreement**. You are responsible for your Stripe account, KYC, and payout details. See Marketplace & Payments Terms.

---

## 6. Marketplace & Payments Terms

**Applies to marketplace transactions: food orders, appointment bookings, and service requests (e.g., tire service).**

### 6.1 Role of the parties — merchant of record
For each marketplace transaction, the **Business is the seller and merchant of record**; the **Customer is the buyer**. **TAW is a technology intermediary and payment facilitator only and is NOT a party to the sale.** TAW does not take title to goods, prepare food, provide services, or guarantee fulfillment.

### 6.2 Payments & Stripe Connect
Payments are processed by **Stripe** using **Connect destination charges**: the Customer pays the transaction amount; funds are routed to the Business's Connected Account, and TAW retains a **platform application fee** `[+ any add-on/service fees — disclose at checkout]`. Card data is handled by Stripe; TAW does not store card numbers. By transacting, Customers and Businesses agree to Stripe's applicable terms.

### 6.3 Pricing, taxes & fulfillment
The **Business sets prices** and is responsible for the accuracy of menus/prices/availability and for **all applicable taxes** (sales/use tax, etc.) and any tax collection/remittance, licensing, and food-safety/consumer-protection compliance. TAW does not calculate, collect, or remit the Business's taxes unless a marketplace-facilitator law expressly requires it — `[flag for counsel; may vary by state]`. The Business is solely responsible for fulfilling orders/bookings/services.

### 6.4 Cancellations, refunds, disputes
Refunds/cancellations for marketplace purchases are governed by the **Business's own policy**, subject to the Refund & Cancellation Policy §7 and applicable law. **The Business is responsible for issuing refunds** (via Stripe); TAW may facilitate but is not obligated to fund refunds. **Chargebacks/disputes** are between the Customer, the Business, and the card network via Stripe; the Business bears chargeback liability and related fees, and authorizes TAW/Stripe to debit its account accordingly. TAW may withhold or reverse payouts and platform fees for fraud, disputes, or policy violations.

### 6.5 Payouts
Payout timing/methods are governed by Stripe. TAW is not a bank and does not hold funds as a deposit. Delays can result from Stripe verification, risk review, or disputes.

### 6.6 Consumer protection
Customers should review each Business's terms/policies before purchasing. Complaints about a Business's goods/services should be directed to the Business; TAW may assist with dispute resolution but is not liable for the Business's performance (ToS §§1.12, 1.14).

### 6.7 Prohibited transactions
No transactions in prohibited/restricted categories or that violate Stripe's restricted-business list or law.

---

## 7. Refund & Cancellation Policy

### 7.1 Advertising subscriptions & add-ons (paid by Businesses to TAW)
- **Auto-renewal:** subscriptions renew automatically; cancel anytime to stop the next renewal (Advertiser Terms §5.2–5.3).
- **Refunds:** advertising fees and add-ons are **non-refundable** once a term begins, **except**: (a) where required by law (including California ARL cure/refund rights); (b) a documented **service failure by TAW**; or (c) a valid cancellation within a stated **free-trial** window. **Annual plans:** `[state whether pro-rata refunds are offered on early cancellation — recommend counsel decision; default: no pro-rata, access continues to term end].`
- **How:** email `[support@…]`; approved refunds are returned to the original payment method via Stripe.

### 7.2 Marketplace orders / bookings / service requests (paid by Customers to Businesses)
- Refunds and cancellations are governed by **each Business's own policy**, shown at checkout where available.
- **The Business — not TAW — issues these refunds.** TAW may facilitate refund requests but does not guarantee or fund them.
- Statutory consumer rights are unaffected.
- Chargeback rights via your card issuer remain available.

### 7.3 Demo listings
Demo listings are not transactable; no charges occur.

---

## 8. DMCA / Copyright Policy

`[LEGAL ENTITY NAME]` respects intellectual property and complies with the **Digital Millennium Copyright Act (17 U.S.C. §512)**.

### 8.1 Reporting infringement (takedown notice)
Send a written notice to our **Designated Agent** with: (1) your signature (physical/electronic); (2) identification of the copyrighted work; (3) the infringing material and its URL/location; (4) your contact info; (5) a good-faith-belief statement; (6) a statement, under penalty of perjury, that the information is accurate and you are authorized to act.

**Designated DMCA Agent:** `[NAME/ROLE]`, `[LEGAL ENTITY NAME]`, `[ADDRESS]`, `[dmca@trueamericanwhere.com]`, `[phone]`. `[Register the agent with the U.S. Copyright Office DMCA Designated Agent Directory — REQUIRED for safe harbor.]`

### 8.2 Counter-notice
If your content was removed, you may submit a counter-notice with your signature, identification of the removed material and its prior location, a statement under penalty of perjury of good-faith belief the removal was a mistake/misidentification, your contact info, and consent to jurisdiction. We may restore the material in 10–14 business days absent a lawsuit filing.

### 8.3 Repeat infringers
We terminate accounts of repeat infringers in appropriate circumstances.

---

## 9. Community & Review Guidelines

### 9.1 Honest reviews only
Reviews must reflect genuine, firsthand experiences. **Prohibited:** fake or AI-fabricated reviews, reviews you were paid for without disclosure, reviews by the business about itself or competitors, review-gating, buying/selling reviews, and other practices banned by the **FTC Rule on Consumer Reviews and Testimonials (16 CFR Part 465)**.

### 9.2 Content standards
No harassment, hate, threats, personal/sensitive data of others, off-topic content, or unlawful/infringing material (see AUP).

### 9.3 Business responses
Businesses may respond professionally; no retaliation, threats, or attempts to suppress lawful negative reviews (note the **Consumer Review Fairness Act**, which voids gag clauses).

### 9.4 Moderation & takedown
We may remove or refuse reviews violating these guidelines, use automated + human moderation, and, where required, label incentivized content. Report violations to `[support@…]`. We are not obligated to remove lawful, policy-compliant reviews at a Business's request.

---

## 10. Accessibility Statement

We are committed to making the Services accessible and are working toward conformance with **WCAG 2.1 Level AA** and consistent with the **Americans with Disabilities Act**. If you encounter an accessibility barrier, contact `[accessibility@…]` / `[support@…]` with the page and issue; we will make reasonable efforts to provide the information or complete the transaction through an alternate method. We welcome feedback and review accessibility periodically. `[Update with audit status/date.]`

---

## 11. Contact & Disclosures

- **Company:** `[LEGAL ENTITY NAME]`, a `[STATE]` `[entity type]`.
- **Address:** `[ADDRESS]`. **General/Support:** `[support@…]`. **Legal:** `[legal@…]`. **Privacy:** `[privacy@…]`. **DMCA:** `[dmca@…]`.
- **Advertising disclosure:** listings marked "Featured," "Sponsored," or "Ad" are paid placements. Some directory listings are **paid advertising**.
- **Demo-content disclosure:** content labeled **"Demo"** (including AI-generated photos) is illustrative only and does not represent a real business or offer.
- **Marketplace disclosure:** TAW is an intermediary; the Business is the seller/merchant of record for all orders, bookings, and services. Payments are processed by Stripe.

---

## Appendix A — Publishing checklist (for counsel + engineering)
1. Fill every `[BRACKET]`; confirm entity, state, venue, contacts.
2. **Register the DMCA agent** with the U.S. Copyright Office.
3. Implement **ARL-compliant** signup consent, renewal reminders, and click-to-cancel.
4. Wire a **cookie CMP** with region logic + **GPC/"Do Not Sell or Share"** honoring.
5. Confirm Stripe **Connected Account Agreement** acceptance in onboarding + merchant-of-record framing in checkout.
6. Decide arbitration/class-waiver + opt-out; confirm enforceability in target states.
7. Add DPA/sub-processor list; confirm OpenAI receives **no** real customer PII (demo only).
8. Date-stamp each policy; add version history; link all policies in the footer + at checkout.
9. Confirm restricted-category list (alcohol/tobacco/etc.) and food-safety disclaimers with counsel.
10. Obtain **tech E&O / cyber / general liability** insurance before launch.
