/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        arcade: ["Orbitron", "ui-sans-serif", "system-ui"],
      },
      colors: {
        neon: {
          cyan: "#22d3ee",
          magenta: "#ff2d6a",
          green: "#39ff14",
        },
      },
    },
  },
  plugins: [],
};
