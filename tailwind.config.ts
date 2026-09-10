import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Operza red. 500 is the exact red sampled from public/operza-logo.png
        // (#f31820, rgb 243 24 32), which is the only saturated colour in the
        // mark. The rest of the ramp is a single hue built around it, so the
        // site has ONE red rather than several near-misses.
        //
        // This replaced a blue ramp. The token name stays `brand` so every
        // existing accent moves with it, including the Health Check.
        brand: {
          50: "#fff1f1",
          100: "#ffdfe0",
          200: "#ffc5c7",
          300: "#ff9b9f",
          400: "#fb5f67",
          500: "#f31820",
          600: "#d90d16",
          700: "#b60c13",
          800: "#960f15",
          900: "#7c1318",
          950: "#430508",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 12px 32px -16px rgba(15, 23, 42, 0.18)",
        lift: "0 1px 2px 0 rgba(15, 23, 42, 0.05), 0 24px 48px -24px rgba(15, 23, 42, 0.22)",
      },
      letterSpacing: {
        tightish: "-0.012em",
      },
      animation: {
        "fade-up": "fadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both",
        // Brief highlight pulse — used on demo cells when an input
        // change recomputes the value, so the interactivity is
        // unmissable without being noisy.
        flash: "flash 600ms ease-out both",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        flash: {
          "0%": { backgroundColor: "rgba(15, 23, 42, 0.07)" },
          "100%": { backgroundColor: "rgba(15, 23, 42, 0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
