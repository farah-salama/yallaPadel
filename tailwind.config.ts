import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#080B09",
        "bg-2": "#0D1210",
        card: "#121814",
        "card-2": "#171E1A",
        lime: "#C8FF00",
        mint: "#00D6A3",
        ink: "#F4F7F2",
        mute: "#89938D",
        warn: "#FFB84D",
        danger: "#FF5964",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "1.25rem",
        xl2: "1.5rem",
      },
      boxShadow: {
        glow: "0 0 32px rgba(200, 255, 0, 0.18)",
        "glow-sm": "0 0 16px rgba(200, 255, 0, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
