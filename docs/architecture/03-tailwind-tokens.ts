/**
 * True American Where — Tailwind theme tokens ("Main Street Modern")
 * Colors + fonts sampled DIRECTLY from the client logos (public/brand/*.png):
 *   navy #0C2135 · marigold gold #F0A818 · cream #F5EDDA · barn red #B23A2E.
 * Display type echoes the logo's heavy vintage slab lettering.
 *
 * Paste the object below into `tailwind.config.ts`:
 *   theme: { extend: { ...tawTheme } }
 *
 * Colors mirror the CSS custom properties in `03-globals.css` (via var())
 * so a single source of truth drives both. Load Alfa Slab One + Oswald +
 * Public Sans (+ optional Spline Sans Mono) via next/font or the @import
 * in 03-globals.css.
 */

import type { Config } from "tailwindcss";

export const tawTheme: NonNullable<Config["theme"]>["extend"] = {
  colors: {
    // ---- Core brand (from the logo) ----
    // navy sign-plate; `ink` kept as an alias used throughout the specs
    ink: {
      DEFAULT: "var(--navy)", // #0C2135 navy
      deep: "var(--navy-deep)", // #06121D
    },
    navy: {
      DEFAULT: "var(--navy)", // #0C2135
      deep: "var(--navy-deep)", // #06121D
      mid: "var(--navy-mid)", // #123049 (raised navy)
    },
    gold: {
      DEFAULT: "var(--gold)", // #F0A818 marigold
      deep: "var(--gold-deep)", // #CE860C (hover/pressed)
      hi: "var(--gold-hi)", // #F7C24A (highlight / focus glow)
    },
    barn: {
      DEFAULT: "var(--barn)", // #B23A2E barn red
      deep: "var(--barn-deep)", // #8E2B22
    },

    // ---- Light (front end) surfaces ----
    paper: {
      DEFAULT: "var(--paper)", // #F5EDDA warm cream page
      raised: "var(--paper-raised)", // #FBF6E9 cards
    },
    cream: "var(--cream)", // #F2E7BE ivory (on-navy text / letters)
    linen: "var(--linen)", // #ECE1C6 fills / table stripes
    char: "var(--char)", // #1A1712 warm near-black body text
    stone: "var(--stone)", // #6E675A muted text

    // ---- Dark (admin) surfaces — same palette, navy canvas ----
    night: "var(--navy-deep)", // #06121D
    slate: {
      1: "var(--slate-1)", // #102338 cards
      2: "var(--slate-2)", // #17304B raised rows / hover
    },
    hairline: "var(--hairline)", // #24405C borders on dark
    mist: "var(--mist)", // #A8B6C8 secondary text on dark
    cloud: "var(--cloud)", // #E9EFF6 primary text on dark

    // ---- Semantic (shared) ----
    success: "var(--success)", // #2E7D5B muted pine — "open now" / paid / approved
    warning: "var(--gold)", // gold — pending / needs review
    danger: "var(--barn)", // barn red — closed / rejected / delete
    info: "var(--info)", // #1F4C74 neutral notices
  },

  fontFamily: {
    // Heavy vintage slab — hero words + category "stamp" headlines (like the logo)
    display: ["var(--font-display)", "Rockwell", "Georgia", "serif"],
    // Condensed gothic — structural headings, nav, buttons, eyebrows
    heading: ["var(--font-heading)", "Oswald", "system-ui", "sans-serif"],
    // Body / UI — U.S. federal typeface, highly legible for non-technical users
    sans: ["var(--font-body)", "system-ui", "sans-serif"],
    // Tabular figures for prices + admin analytics
    mono: ["var(--font-mono)", "ui-monospace", "monospace"],
  },

  fontSize: {
    eyebrow: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.16em" }],
    small: ["0.875rem", { lineHeight: "1.4" }],
    body: ["1rem", { lineHeight: "1.6" }],
    lead: ["1.25rem", { lineHeight: "1.6" }],
    h3: ["1.375rem", { lineHeight: "1.2" }],
    h2: ["1.875rem", { lineHeight: "1.12" }],
    h1: ["2.5rem", { lineHeight: "1.05" }],
    display: ["3.75rem", { lineHeight: "0.98", letterSpacing: "0.005em" }],
  },

  borderRadius: {
    sm: "6px",
    md: "10px",
    lg: "16px",
    xl: "22px",
    "2xl": "28px",
    full: "9999px",
  },

  boxShadow: {
    // Warm, physical, low — paint on paper
    card: "0 2px 4px rgba(12,33,53,0.06), 0 8px 24px rgba(12,33,53,0.08)",
    raised: "0 12px 40px rgba(12,33,53,0.14)",
    // Signature routed gold keyline + soft outer (used on .sign-plate)
    sign: "inset 0 0 0 2px var(--gold), inset 0 0 0 6px var(--navy), 0 18px 50px rgba(6,18,29,0.38)",
    // Admin (dark) — tighter/darker
    "admin-card": "0 1px 0 var(--hairline), 0 8px 24px rgba(0,0,0,0.40)",
    // Focus rings
    "focus-gold": "0 0 0 4px rgba(240,168,24,0.35)",
  },

  backgroundImage: {
    halftone: "var(--tex-halftone)",
    "star-field": "var(--tex-star)",
    // Painted navy plate gradient for .sign-plate
    "sign-navy":
      "linear-gradient(163deg, #143253 0%, var(--navy) 48%, var(--navy-deep) 100%)",
    "gold-sheen":
      "linear-gradient(180deg, var(--gold-hi) 0%, var(--gold) 55%, var(--gold-deep) 100%)",
  },

  transitionTimingFunction: {
    warm: "cubic-bezier(0.22, 0.61, 0.36, 1)", // soft settle
  },

  transitionDuration: {
    micro: "120ms",
    std: "240ms",
    entrance: "420ms",
  },

  keyframes: {
    "reveal-up": {
      from: { opacity: "0", transform: "translateY(14px)" },
      to: { opacity: "1", transform: "translateY(0)" },
    },
    "pop-heart": {
      "0%": { transform: "scale(1)" },
      "45%": { transform: "scale(1.28)" },
      "100%": { transform: "scale(1)" },
    },
    "pin-drop": {
      "0%": { opacity: "0", transform: "translateY(-18px) scale(0.9)" },
      "60%": { opacity: "1", transform: "translateY(2px) scale(1.02)" },
      "100%": { transform: "translateY(0) scale(1)" },
    },
    "sign-sway": {
      "0%,100%": { transform: "rotate(-0.6deg)" },
      "50%": { transform: "rotate(0.6deg)" },
    },
    shimmer: {
      "0%": { backgroundPosition: "-160% 0" },
      "100%": { backgroundPosition: "160% 0" },
    },
    "toast-in": {
      from: { opacity: "0", transform: "translateY(16px)" },
      to: { opacity: "1", transform: "translateY(0)" },
    },
  },

  animation: {
    reveal: "reveal-up 420ms cubic-bezier(0.22,0.61,0.36,1) both",
    "pop-heart": "pop-heart 320ms cubic-bezier(0.22,0.61,0.36,1)",
    "pin-drop": "pin-drop 520ms cubic-bezier(0.22,0.61,0.36,1) both",
    "sign-sway": "sign-sway 6s ease-in-out infinite",
    shimmer: "shimmer 1.6s linear infinite",
    "toast-in": "toast-in 240ms cubic-bezier(0.22,0.61,0.36,1) both",
  },
};

export default tawTheme;
