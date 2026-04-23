/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Syne", "sans-serif"],
      },
      colors: {
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
        },
      },
      animation: {
        "fadeInUp": "fadeInUp 0.5s ease-out both",
        "float": "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};