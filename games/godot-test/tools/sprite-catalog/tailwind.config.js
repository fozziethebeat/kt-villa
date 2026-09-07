/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0c0e14",
        surface: "#12161f",
        card: "#161b26",
        border: "rgba(255, 255, 255, 0.08)",
        primary: "#4fa3e3",
        accent: "#5ce6b0",
        warning: "#f59e0b",
      }
    },
  },
  plugins: [],
};
