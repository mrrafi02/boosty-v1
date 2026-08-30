/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        boosty: {
          50: "#eef7ff",
          100: "#d9edff",
          500: "#4f8cff",
          600: "#3977ed",
          700: "#2d60c8",
          900: "#101a35"
        }
      }
    }
  },
  plugins: []
};