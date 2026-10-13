import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        carbon: {
          950: "#0B0D10",
          900: "#111318",
          800: "#14171C",
          700: "#1D2127",
          600: "#2A2F37",
        },
        steel: {
          400: "#8A94A6",
          300: "#A9B1BF",
        },
        porcelain: "#F5F3EE",
        amber: {
          500: "#F2A63A",
          400: "#F5B85C",
        },
        cyan: {
          400: "#4DE8E0",
          500: "#2FD4CB",
        },
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      backgroundImage: {
        "circuit-fade":
          "radial-gradient(60% 60% at 50% 0%, rgba(242,166,58,0.10) 0%, rgba(11,13,16,0) 70%)",
      },
    },
  },
  plugins: [],
};
export default config;
