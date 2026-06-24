import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#C62828",
          gold: "#F9A825",
          blue: "#0D47A1",
          navy: "#0A2540",
          dark: "#1A1A1A",
          white: "#FFFFFF",
          light: "#F5F5F5",
        },
        // Tonal navy scale for surfaces, gradients and depth.
        navy: {
          50: "#eef3fb",
          100: "#d6e2f5",
          200: "#aec5ea",
          300: "#7ba0db",
          400: "#4c79c9",
          500: "#2d5cae",
          600: "#1f478c",
          700: "#173a73",
          800: "#0f2a57",
          900: "#0a2540",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgba(10, 37, 64, 0.04), 0 4px 16px -2px rgba(10, 37, 64, 0.08)",
        "soft-lg": "0 8px 32px -4px rgba(10, 37, 64, 0.12)",
        card: "0 1px 3px rgba(10, 37, 64, 0.06), 0 1px 2px rgba(10, 37, 64, 0.04)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.15s ease-out",
        "slide-in-right": "slide-in-right 0.25s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
