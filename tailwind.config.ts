import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // SchoolDay Brand Colors
        primary: {
          DEFAULT: "#0693e3", // SchoolDay Cyan Blue
          50: "#e6f7ff",
          100: "#b3e7ff",
          200: "#80d7ff",
          300: "#4dc7ff",
          400: "#1ab7ff",
          500: "#0693e3",
          600: "#0077b8",
          700: "#005c8f",
          800: "#004166",
          900: "#00263d",
        },
        secondary: {
          DEFAULT: "#9b51e0", // SchoolDay Purple
          50: "#f5ebff",
          100: "#e6d1fc",
          200: "#d4b3f7",
          300: "#c295f2",
          400: "#af77ed",
          500: "#9b51e0",
          600: "#7c41b3",
          700: "#5d3186",
          800: "#3e2159",
          900: "#1f102d",
        },
        success: {
          DEFAULT: "#16a34a", // green-600
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        warning: {
          DEFAULT: "#f59e0b", // amber-500
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        error: {
          DEFAULT: "#dc2626", // red-600
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
      },
    },
  },
  plugins: [],
};
export default config;
