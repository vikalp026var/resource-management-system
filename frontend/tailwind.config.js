const { heroui } = require("@heroui/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx}",
    "./node_modules/@heroui/react/dist/**/*.{js,ts,jsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            background: "#F5F5F5",
            foreground: "#1E1E1E",
          },
        },
        dark: {
          colors: {
            background: "#0a0a0a",
            foreground: "#ECEDEE",
          },
        },
      },
    }),
  ],
};
