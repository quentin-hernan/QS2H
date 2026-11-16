import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1.25rem", md: "2.5rem", xl: "4rem" }, screens: { "2xl": "1440px" } },
    extend: {
      colors: {
        ink: { 900: "#1C1C1C", 800: "#242424", 700: "#2e2e2e", 600: "#3a3a3a" },
        ivory: { DEFAULT: "#F8F8F7", 200: "#EFEFED", 300: "#E3E3E0" },
        mute: { dark: "#A9AEB5", light: "#5A5F66" },
        accent: { DEFAULT: "rgb(var(--accent) / <alpha-value>)", hover: "rgb(var(--accent-hover) / <alpha-value>)", hi: "rgb(var(--accent-hi) / <alpha-value>)" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "system-ui", "Arial", "sans-serif"], // alias historique : « serif » désigne ici Archivo (titres), jamais une serif
      },
      fontSize: {
        display: ["clamp(1.9rem, 5.2vw, 5.2rem)", { lineHeight: "1", letterSpacing: "-0.025em" }],
        h1: ["clamp(1.8rem, 4.6vw, 4.2rem)", { lineHeight: "1.04", letterSpacing: "-0.025em" }],
        h2: ["clamp(1.55rem, 3.5vw, 3.3rem)", { lineHeight: "1.06", letterSpacing: "-0.02em" }],
        h3: ["clamp(1.25rem, 1.7vw, 1.6rem)", { lineHeight: "1.18", letterSpacing: "-0.01em" }],
        body: ["1.0625rem", { lineHeight: "1.6" }],
      },
      maxWidth: { prose: "68ch" },
      transitionTimingFunction: { out: "cubic-bezier(.2,.8,.2,1)" },
    },
  },
  plugins: [],
};
export default config;
