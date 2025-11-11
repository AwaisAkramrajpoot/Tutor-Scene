/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          'dark-blue': '#1464AE',      // Primary color
          'medium-blue': '#3593D9',    // Secondary color
          'light-blue': '#A8C7F0',     // Text highlights, gradients, light accents
          'gold': '#C89E45',           // Borders, outlines, and accents
          'deep-navy': '#0B1D3B',      // Shadows, depth, and dark outlines
        },
      },
    },
  },
  plugins: [],
}
