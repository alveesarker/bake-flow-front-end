/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        ink: "#111111",
        paper: "#FFFFFF",
        mist: "#F5F5F5",
        line: "#E5E5E5",
        muted: "#6B7280",
        success: {
          DEFAULT: "#16803D",
          bg: "#EAF6EE",
        },
        warning: {
          DEFAULT: "#B45309",
          bg: "#FDF3E7",
        },
        danger: {
          DEFAULT: "#B91C1C",
          bg: "#FCEAEA",
        },
        info: {
          DEFAULT: "#1D4ED8",
          bg: "#EAF0FD",
        },
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        md: "10px",
        lg: "14px",
        xl: "18px",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgb(17 17 17 / 0.04), 0 1px 1px 0 rgb(17 17 17 / 0.03)",
        card: "0 1px 3px 0 rgb(17 17 17 / 0.06), 0 1px 2px -1px rgb(17 17 17 / 0.04)",
        popover: "0 8px 24px -4px rgb(17 17 17 / 0.1), 0 2px 8px -2px rgb(17 17 17 / 0.06)",
      },
      keyframes: {
        "fade-in": { from: { opacity: 0 }, to: { opacity: 1 } },
        "slide-up": { from: { opacity: 0, transform: "translateY(6px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      },
      animation: {
        "fade-in": "fade-in .18s ease-out",
        "slide-up": "slide-up .22s ease-out",
      },
    },
  },
  plugins: [],
};
