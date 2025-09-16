/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}", // include your React/TS files
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ['Roboto', 'sans-serif'], // make Roboto the default
        },
      },
    },
    plugins: [],
  }
  