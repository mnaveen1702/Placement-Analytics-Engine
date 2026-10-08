/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Sora", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Outfit", "Sora", "sans-serif"],
      },
      colors: {
        ink: {
          950: "#0b0f19",
          900: "#090d16",
          800: "#121a31",
        },
      },
      boxShadow: {
        glow: "0 0 40px rgba(99, 102, 241, 0.18)",
      },
    },
  },
  plugins: [],
};
