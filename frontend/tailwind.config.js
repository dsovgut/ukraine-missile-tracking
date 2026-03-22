/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0a0a0a",
          surface: "#111111",
          card: "#161616",
          border: "#222222",
          muted: "#404040",
          text: "#737373",
          red: "#ef4444",
          "red-soft": "rgba(239,68,68,0.1)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "card-glow": "card-glow 2.5s ease-in-out infinite",
        "fade-in-out": "fade-in-out 3s ease-in-out infinite",
        "tap-cta": "tap-cta 2s ease-in-out infinite",
        "bounce-gentle": "bounce-gentle 2s ease-in-out infinite",
      },
      keyframes: {
        "card-glow": {
          "0%, 100%": { boxShadow: "0 0 4px 0 rgba(0,91,187,0.15)" },
          "50%": { boxShadow: "0 0 24px 4px rgba(0,91,187,0.35)" },
        },
        "fade-in-out": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        "tap-cta": {
          "0%, 100%": { color: "#404040" },
          "50%": { color: "#e2e8f0" },
        },
        "bounce-gentle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(3px)" },
        },
      },
    },
  },
  plugins: [],
};
