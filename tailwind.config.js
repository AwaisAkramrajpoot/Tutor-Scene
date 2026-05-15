/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          'dark-blue': '#0F3E78',
          'medium-blue': '#2A66B8',
          'light-blue': '#A8C7F0',
          'gold': '#C89E45',
          'deep-navy': '#0B1D3B',

          //  gradient colors
          'gradient-start': '#1667b0',
          'gradient-mid': '#3390d7',
          'gradient-end': '#1667b0',
        },
      },
    },
  },
  plugins: [],
}