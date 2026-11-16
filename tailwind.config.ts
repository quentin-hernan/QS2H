import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1.25rem", md: "2.5rem", xl: "4rem" }, screens: { "2xl": "1440px" } },
    extend: {
      colors: {
        ink: { 900: "#151515", 800: "#1c1c1c", 700: "#262626", 600: "#333333" },
        ivory: { DEFAULT: "#F7F6F3", 200: "#ECEAE4", 300: "#E4E2DD" },
        mute: { dark: "#A8A8A2", light: "#5F5F5F" },
        accent: { DEFAULT: "rgb(var(--accent) / <alpha-value>)", hi: "rgb(var(--accent-hi) / <alpha-value>)" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
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
