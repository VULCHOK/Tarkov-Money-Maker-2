/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        tarkov: {
          bg: "#1a1a1a",
          card: "#252525",
          border: "#3a3a3a",
          gold: "#c8aa6e",
          green: "#4ade80",
          red: "#f87171",
          text: "#e5e5e5"
        }
      }
    }
  },
  plugins: []
};
