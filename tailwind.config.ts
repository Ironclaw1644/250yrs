import type { Config } from "tailwindcss";

/**
 * True American Where — "Main Street Modern"
 * Tokens sampled from the client logos (public/brand/*.png).
 * Mirrors the CSS custom properties in src/app/globals.css.
 */
const config: Config = {
  darkMode: ["selector", ".theme-dark"],
  content: [
    "./src/app/**/*.{ts,tsx,mdx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "rgb(var(--navy-rgb)/<alpha-value>)",
          deep: "rgb(var(--navy-deep-rgb)/<alpha-value>)",
        },
        navy: {
          DEFAULT: "rgb(var(--navy-rgb)/<alpha-value>)",
          deep: "rgb(var(--navy-deep-rgb)/<alpha-value>)",
          mid: "rgb(var(--navy-mid-rgb)/<alpha-value>)",
        },
        gold: {
          DEFAULT: "rgb(var(--gold-rgb)/<alpha-value>)",
          deep: "rgb(var(--gold-deep-rgb)/<alpha-value>)",
          hi: "rgb(var(--gold-hi-rgb)/<alpha-value>)",
        },
        barn: {
          DEFAULT: "rgb(var(--barn-rgb)/<alpha-value>)",
          deep: "rgb(var(--barn-deep-rgb)/<alpha-value>)",
        },
        paper: {
          DEFAULT: "rgb(var(--paper-rgb)/<alpha-value>)",
          raised: "rgb(var(--paper-raised-rgb)/<alpha-value>)",
        },
        cream: "rgb(var(--cream-rgb)/<alpha-value>)",
        linen: "rgb(var(--linen-rgb)/<alpha-value>)",
        char: "rgb(var(--char-rgb)/<alpha-value>)",
        stone: "rgb(var(--stone-rgb)/<alpha-value>)",
        night: "rgb(var(--navy-deep-rgb)/<alpha-value>)",
        slate: {
          1: "rgb(var(--slate-1-rgb)/<alpha-value>)",
          2: "rgb(var(--slate-2-rgb)/<alpha-value>)",
        },
        hairline: "rgb(var(--hairline-rgb)/<alpha-value>)",
        mist: "rgb(var(--mist-rgb)/<alpha-value>)",
        cloud: "rgb(var(--cloud-rgb)/<alpha-value>)",
        success: "rgb(var(--success-rgb)/<alpha-value>)",
        warning: "rgb(var(--gold-rgb)/<alpha-value>)",
        danger: "rgb(var(--barn-rgb)/<alpha-value>)",
        info: "rgb(var(--info-rgb)/<alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Rockwell", "Georgia", "serif"],
        heading: ["var(--font-heading)", "Oswald", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
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
      },
      boxShadow: {
        card: "0 2px 4px rgba(12,33,53,0.06), 0 8px 24px rgba(12,33,53,0.08)",
        raised: "0 12px 40px rgba(12,33,53,0.14)",
        sign: "inset 0 0 0 2px var(--gold), inset 0 0 0 6px var(--navy), 0 18px 50px rgba(6,18,29,0.38)",
        "admin-card": "0 1px 0 var(--hairline), 0 8px 24px rgba(0,0,0,0.40)",
        "focus-gold": "0 0 0 4px rgba(240,168,24,0.35)",
      },
      backgroundImage: {
        halftone: "var(--tex-halftone)",
        "star-field": "var(--tex-star)",
        "sign-navy":
          "linear-gradient(163deg, #143253 0%, var(--navy) 48%, var(--navy-deep) 100%)",
        "gold-sheen":
          "linear-gradient(180deg, var(--gold-hi) 0%, var(--gold) 55%, var(--gold-deep) 100%)",
      },
      transitionTimingFunction: { warm: "cubic-bezier(0.22, 0.61, 0.36, 1)" },
      transitionDuration: { micro: "120ms", std: "240ms", entrance: "420ms" },
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
      },
      animation: {
        reveal: "reveal-up 420ms cubic-bezier(0.22,0.61,0.36,1) both",
        "pop-heart": "pop-heart 320ms cubic-bezier(0.22,0.61,0.36,1)",
        "pin-drop": "pin-drop 520ms cubic-bezier(0.22,0.61,0.36,1) both",
        "sign-sway": "sign-sway 6s ease-in-out infinite",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
