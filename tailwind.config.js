/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./templates/**/*.html",
    "./static/**/*.{js,html}"
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors from the existing site
        'brand-teal': '#1db1ad',
        'brand-green': '#006566', 
        'brand-yellow': '#efa537',
        'brand-maroon': '#66023c',
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'quicksand': ['Quicksand', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}