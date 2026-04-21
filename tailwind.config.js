/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'meat-red':   '#C0392B',
        'gold':       '#D4A853',
        'warm-white': '#FAF7F2',
        'dark':       '#1A1A1A',
      },
    },
  },
  plugins: [],
};