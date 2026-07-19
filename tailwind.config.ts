import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          obsidian: "#0b0b0c",
          charcoal: "#17181b",
          gunmetal: "#23262c",
          gold: "#c7a46a",
          bronze: "#8f6b3a",
          cream: "#ece4d6",
          rust: "#7b332d",
        },
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "serif"],
        sans: ["var(--font-geist-sans)", "sans-serif"],
      },
      transitionTimingFunction: {
        warm: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      transitionDuration: {
        std: "250ms",
        entrance: "450ms",
      },
    },
  },
  plugins: [],
};

export default config;
