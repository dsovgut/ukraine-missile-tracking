/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ukraine: {
          blue: "#005BBB",
          yellow: "#FFD700",
        },
        brand: {
          bg: "#0a0f1a",
          card: "#111827",
          border: "#1e293b",
          muted: "#334155",
          text: "#94a3b8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
