import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dae6ff",
          200: "#bcd2ff",
          300: "#8eb2ff",
          400: "#5e89ff",
          500: "#3f63f7",
          600: "#2c43ed",
          700: "#2533c9",
          800: "#222ea3",
          900: "#1f2c80",
          950: "#161a4d",
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
