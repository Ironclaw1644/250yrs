# True American Where — Design System (`03-design-system.md`)

> The full brand + UI spec and the rationale behind every decision. This is the
> source of truth for the customer front end, the business-owner front end, and
> the admin portal. Pair it with `03-tailwind-tokens.ts` (paste into
> `tailwind.config.ts → theme.extend`) and `03-globals.css` (CSS variables, base
> layer, font imports, signature utilities).

---

## 1. One clear point of view: **"Main Street Modern"**

Not flags-and-fireworks kitsch. Not generic SaaS. The direction is the
**hand-painted American storefront**: the enamel diner sign, the letterpress
grocery placard, the WPA national-park travel poster, the gold-leaf window
lettering on a barber shop. Warm, made-by-hand, trustworthy, and unmistakably
American — but executed with restraint and modern typography so it reads as
*crafted*, not costume.

Three words that must be true of every screen: **Warm. Honest. Local.**

Why this works for the product:
- The users are non-technical mom-and-pop owners and everyday shoppers. A warm,
  paper-and-paint aesthetic feels like a **neighborhood**, not software. It
  lowers the intimidation of "signing up online."
- It gives us a genuinely patriotic palette (navy / barn-red / cream / gold)
  **without** defaulting to a literal waving flag on every page.
- It differentiates hard from "AI slop" (no purple gradients, no Inter, no
  glassmorphism-on-white). Painted signage, halftone texture, and old-style
  serifs are the opposite of default.

### Anti-goals (explicitly forbidden)
- Inter / Roboto / Arial / system-ui / Space Grotesk as a brand face.
- Purple→blue gradients, neon glows, generic "glass card on white."
- Emoji anywhere in the UI (Font Awesome only — client mandate).
- Kitsch: cartoon eagles, clip-art fireworks, distressed "grunge flag" overlays,
  Uncle-Sam caricatures. Patriotism is conveyed through **palette, type, and
  craft**, not props.

---

## 2. Light vs dark: front end LIGHT, admin DARK

| Surface | Theme | Rationale |
|---|---|---|
| **Customer + business-owner front end** | **Light** — warm cream "paper" | Feels like daylight on Main Street: open, friendly, legible for older/non-technical users and in bright outdoor phone use. High contrast, no eye-strain, prints/screenshots well. |
| **Admin portal** | **Dark** — "night desk" navy-charcoal | Dense, data-heavy, long sessions. Dark reduces glare for power users, visually separates "staff mode" from "public site," and lets KPI accents (gold, red, green) pop on dense tables. |

Both themes draw from the **same token set** — the admin is not a different
brand, it's the same palette re-grounded on a dark canvas. The display serif and
gold accent carry across so it still feels like one product.

---

## 3. Color tokens

**Palette sampled directly from the client logos** (`public/brand/*.png`). The
"white" is a warm **cream**, the "blue" is the logo's **deep navy** sign-plate,
the "red" is the logo's **barn red**, and the accent is the logo's **marigold
gold**. The logo contains **no teal** — the earlier "verdigris" idea is dropped;
a single muted **pine green** survives only as the functional "Open now" signal.

### Core brand hexes (from the logo pixels)
| Token | Hex | Use |
|---|---|---|
| `navy` / `ink` | `#0C2135` | Sign-plate, primary text on light, admin canvas |
| `navy-deep` / `ink-deep` | `#06121D` | Footer, darkest navy, admin background |
| `navy-mid` | `#123049` | Raised navy panels |
| `barn` (red) | `#B23A2E` | Primary CTA, alerts, "Call Now," sale/coupon accents |
| `barn-deep` | `#8E2B22` | Hover/active red, pressed states |
| `gold` (marigold) | `#F0A818` | Signature accent: pin, stars, keyline, badges, "Advertise" |
| `gold-deep` | `#CE860C` | Gold hover/pressed |
| `gold-hi` | `#F7C24A` | Gold highlight / focus glow / selection |
| `paper` | `#F5EDDA` | Front-end page background (warm cream) |
| `paper-raised`| `#FBF6E9` | Cards / raised surfaces on light |
| `cream` | `#F2E7BE` | Ivory — on-navy signage letters / text on plates |
| `linen` | `#ECE1C6` | Subtle fills, table stripes, input backgrounds |
| `char` | `#1A1712` | Warm near-black body text on paper |
| `stone` | `#6E675A` | Muted/secondary text on light |

### Supporting neutrals (admin dark canvas)
| Token | Hex | Use |
|---|---|---|
| `night` | `#0C1B33` | App background |
| `slate-1` | `#13233F` | Cards / panels |
| `slate-2` | `#1B2E4D` | Raised rows, hover |
| `hairline` | `#26384F` | Borders/dividers on dark |
| `mist` | `#AEBACB` | Secondary text on dark |
| `cloud` | `#E8EEF6` | Primary text on dark |

### Semantic (both themes)
| Token | Hex | Meaning |
|---|---|---|
| `success` | `#3E7C74` | Open / paid / approved (reuses verdigris) |
| `warning` | `#C99A3E` | Pending / needs review (reuses gold) |
| `danger` | `#B23A34` | Closed / rejected / delete (reuses barn) |
| `info` | `#2E5E86` | Neutral notices |

All tokens ship as CSS custom properties (see `03-globals.css`) *and* as Tailwind
colors (see `03-tailwind-tokens.ts`). Never hardcode a hex in a component.

Contrast: `char`/`ink` on `paper` ≈ 12:1; `cloud` on `night` ≈ 13:1; `barn` on
`paper` passes AA for large text and buttons (white text on `barn` = AA). Gold is
**decorative/large only** — never gold body text on cream.

---

## 4. Typography — distinctive, characterful, and thematically American

Chosen to echo the **logo's heavy, condensed, vintage-slab lettering** (not the
soft serif originally drafted — seeing the real logo corrected this).

**Display — `Alfa Slab One`** (Google Fonts). A heavy vintage slab with real
signage weight and slab feet — the closest match to the logo wordmark. Reserved
for the biggest moments: hero words and the ALL-CAPS category "stamp" headlines
(e.g. `BARBER SHOPS IN NASHVILLE`). One heavy weight; use sparingly for impact.

**Headings / UI chrome — `Oswald`** (Google Fonts). A condensed gothic with a
full weight range that carries the logo's tall, condensed feel into h1–h4, nav,
buttons, and eyebrows without shouting. This is the everyday structural voice.

**Body / UI — `Public Sans`** (Google Fonts). Literally the **official typeface
of the U.S. federal government** (US Web Design System) — on-theme by provenance,
exceptionally legible at small sizes and on cheap Android phones, neutral enough
to disappear behind content. Exactly what non-technical users need. NOT Inter.

> The header uses the **actual `logo.png` wordmark**, so the display font only
> needs to *harmonize* with it, not replicate it — which keeps type flexible.

**Numeric / mono (prices, analytics, order IDs): `Spline Sans Mono`** — used
sparingly for tabular figures in the admin and for prices on menus so columns
line up. Optional.

**Eyebrow / label treatment:** Public Sans, `600`, uppercase, `letter-spacing:
0.12em` — the small "STAMPED" labels above section titles (e.g. `FRIED FOOD ·
CHICAGO, IL`). This tracked-caps treatment is a recurring signature.

### Type scale (1.2 minor-third on mobile, 1.25 on desktop)
| Token | rem | Font / weight | Use |
|---|---|---|---|
| `display` | 3.75 | Alfa Slab One (caps) | Hero words / category stamp |
| `h1` | 2.5 | Oswald 700 | Page title |
| `h2` | 1.875 | Oswald 700 | Section |
| `h3` | 1.375 | Oswald 600 | Card title |
| `lead` | 1.25 | Public Sans 400 | Intro paragraph |
| `body` | 1.0 | Public Sans 400 | Default |
| `small` | 0.875 | Public Sans 400 | Meta |
| `eyebrow`| 0.75 | Oswald 600 caps | Tracked labels |

Line-height: 1.15 for Fraunces headings, 1.6 for body. Headings use
`text-wrap: balance`, paragraphs `text-wrap: pretty`.

---

## 5. Spacing, radius, shadow

**Spacing** — 4px base, Tailwind default steps. Front end is **generous**
(section padding `py-16`/`py-24`, roomy 44px+ tap targets); admin is **dense**
(`py-2`/`py-3` rows, 32px controls).

**Radius** — soft but not pill-round, echoing rounded enamel sign corners:
`sm 6px · md 10px · lg 16px · xl 22px · 2xl 28px · full 9999px`. Front-end cards
use `lg`/`xl`; admin uses `sm`/`md` for density.

**Shadow** — warm, low, physical (paint on paper casts a soft shadow, not a
hard drop):
- `card`: `0 2px 4px rgba(18,39,71,.06), 0 8px 24px rgba(18,39,71,.08)`
- `raised`: `0 12px 40px rgba(18,39,71,.12)`
- `sign` (signature): a routed inset gold line + soft outer — see `.sign-plate`.
- Admin shadows are darker/tighter: `0 1px 0 #26384F, 0 8px 24px rgba(0,0,0,.4)`.

Signature border treatment: the **gold pinstripe** — a 1px `gold` rule inset 4px
from the card edge (like the painted keyline on a vintage sign). Implemented as
`.pinstripe` utility.

---

## 6. Components

### Buttons
- **Primary** (`.btn-primary`): `barn` fill, `paper` text, radius `md`, weight
  600, subtle press (`translateY(1px)`) + shadow. This is "Call Now,"
  "Order," "Book," "Subscribe."
- **Gold** (`.btn-gold`): `gold` fill, `ink` text — reserved for the single most
  important action on a page (e.g. "Advertise Your Business").
- **Secondary**: `ink` outline on `paper`, fills `ink`/`paper` on hover.
- **Ghost/quiet**: text + icon only, `verdigris` on hover — for tertiary nav.
- Min height 44px on front end (48px for primary CTAs), 32px in admin.
- Every button pairs a Font Awesome icon with a **plain-language label**
  ("Call Now," never just a phone glyph) — critical for non-technical users.

### Cards
- **Business card** (search/listing): `paper-raised` surface, `card` shadow,
  `lg` radius, photo top with a subtle `gold` pinstripe under it, name in
  Fraunces h3, category eyebrow, star rating, "Open now" verdigris pill,
  distance, and one primary action. Demo listings show a `gold` "DEMO" ribbon.
- **Menu/price row**: name + leader-dots + mono price (diner-menu styling).
- **Coupon**: dashed `barn` ticket border with a notch, big % in Fraunces.
- Admin cards/panels: `slate-1`, `hairline` border, `sm` radius, dense header.

### Inputs
- Front end: `linen` fill, `1.5px` `ink/15` border, `md` radius, 48px tall,
  label ALWAYS visible above (never placeholder-only — non-technical users),
  helper text under. Focus: `verdigris` border + soft `gold-leaf` ring.
- Admin: compact 36px, `slate-2` fill, `hairline` border.
- Big friendly **search bar** is a hero element: pill, icon, "Find food, hair,
  tires near you" placeholder, location chip on the left.

### Navigation
- **Front end**: sticky top bar, `paper` with a bottom `gold` hairline, logo
  left, big search center, "Sign in" + "Advertise" (gold) right. A slim
  **breadcrumb rail** below shows the hierarchy `USA › Illinois › Chicago ›
  Barber Shops` — the core navigational spine of the whole product, styled with
  `verdigris` links and `gold` chevrons.
- **Mobile**: bottom tab bar (Search, Favorites, Map, Orders, Account) with
  Font Awesome icons + labels; 56px tall, `barn` active indicator.
- **Admin**: fixed left `AdminShell` sidebar on `ink-deep`, grouped nav
  (Moderation, Businesses, Orders, Payouts, Analytics, Users, Audit), collapsible,
  active item = `gold` left-border + `slate-2` fill.

---

## 7. Font Awesome icon plan

**Decision: Font Awesome FREE (Solid) only** — no Pro dependency (resolves the
licensing risk). Icons render gold-on-navy in circular "chips" to feel painted,
matching the action row in `logo_ad.png`. **Never emoji.**
- **One fixed Free-Solid icon per category** (all 14):
  fried food `fa-drumstick-bite` · soul food `fa-utensils` · fish market
  `fa-fish` · grocery market `fa-basket-shopping` · food truck `fa-truck` ·
  hair salon `fa-scissors` · barber shop `fa-user-tie` · tire shop `fa-car` ·
  car wash `fa-soap` · clothing store `fa-shirt` · repair shop
  `fa-screwdriver-wrench` · beauty supply `fa-wand-magic-sparkles` · bakery
  `fa-bread-slice` · general/mom-and-pop `fa-store`.
- **Action icons** always beside a word: `fa-phone` Call, `fa-location-dot`
  Directions, `fa-heart` Save, `fa-share-nodes` Share, `fa-star` Reviews,
  `fa-bag-shopping` Order, `fa-calendar-check` Book.
- **Admin/status**: `fa-circle-check` (approved/paid, verdigris),
  `fa-clock` (pending, gold), `fa-circle-xmark` (rejected, barn),
  `fa-flag` (moderation), `fa-chart-line` (analytics).
- Sizes: 20px inline, 24px nav, 40–56px category tiles. Consistent `1em`-relative
  sizing; icons inherit text color unless intentionally gold.

---

## 8. Motion system

Principle: **motion confirms, it never decorates for its own sake.** Warm,
physical easing — things settle like a hand-painted sign swinging to rest.

- **Global easing:** `--ease-warm: cubic-bezier(.22,.61,.36,1)` (soft settle).
- **Durations:** micro 120ms, standard 240ms, entrance 420ms.
- **Micro-interactions:** buttons press 1px + shadow shrink; cards lift 2px +
  `raised` shadow on hover; "Save/heart" does a small pop-scale; toggles slide;
  toasts slide-in from bottom.
- **Page load (front end):** one orchestrated **staggered reveal** — eyebrow,
  headline, search bar, then card grid fade-up with `40ms` increments
  (`.reveal` + `--i` index var). Never animate everything at once.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` disables
  transforms/entrances, keeps opacity only.
- **Loading:** shimmer skeletons in `linen`/`paper` (front) and `slate`
  (admin), never spinners-only.

### The tasteful 3D moment (hero)
The homepage hero features a **hanging enamel storefront sign**: the
`.sign-plate` (see below) sits on a subtle parallax with a **very slight 3D tilt
that follows the pointer** (`rotateX/rotateY` ±4°, `transform-style: preserve-3d`,
disabled on touch + reduced-motion). A soft cast shadow and the gold pinstripe
sell the depth. It's *one* moment — the rest of the site stays flat and calm.
On mobile it degrades to a static plate with a gentle 6s idle sway.

---

## 9. Signature "memorable" element — the Enamel Sign Plate

`.sign-plate`: a rounded rectangle on the `ink` navy with a **routed gold
pinstripe keyline** inset from the edge, a faint **halftone/star dot-texture**
overlay, and the headline set in **Fraunces**, as if hand-painted on a real
porcelain-enamel sign hanging over a shop door. It appears as the **hero plate**
on the homepage, again (small) as the **logo lockup**, and as the **section
header stamp** across the site. This single motif — *painted navy plate + gold
keyline + soft cast shadow* — is what people remember and is instantly reusable
across marketing, the app icon, and email headers.

Supporting textures (subtle, low-opacity, baked into `03-globals.css`):
- `--tex-halftone`: faint radial dot grid (the "printed poster" feel).
- `--tex-star`: a sparse star field used only inside sign plates / footers.
- A 3–4% film-grain/paper-noise overlay on `paper` backgrounds via `.paper-grain`
  so the cream never looks like a flat #hex.

---

## 10. Two speeds: SIMPLE front end vs DENSE admin

**Front end (customer + owner) = SIMPLE, one-thing-per-screen:**
- One primary action per view, always labeled in plain words with an icon.
- Big type, big tap targets, generous whitespace, no jargon ("Your Ad" not
  "Listing entity"), inline help text and friendly empty states with a single
  CTA ("You haven't saved any shops yet — start exploring").
- Owner dashboard is a **guided checklist** ("Add photos → Set hours → Post a
  special → Go live"), progress shown as painted stamps, not a data table.
- Wizards over dense forms: onboarding, running a coupon, and Stripe Connect
  setup are step-by-step with one decision per step.

**Admin = DENSE, robust, power-user:**
- `AdminShell` (sidebar + content), multi-column data tables with sort/filter,
  inline `StatusControls` dropdowns, bulk actions, `DeleteButton` confirm,
  KPI cards + bar charts, CSV export, the `admin_audit_log` viewer, RLS-aware
  service-role queries. Information density is a feature here.
- Same tokens, dark canvas, tighter radius/spacing/shadow — visibly "staff mode."

This split is enforced by two theme groundings of one token set, two spacing
rhythms, and two component densities — never two brands.
