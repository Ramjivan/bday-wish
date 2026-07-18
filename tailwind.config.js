/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'diamond-gold': '#fbbf24',
        'diamond-purple': '#a855f7',
        'diamond-pink': '#ec4899',
        'diamond-bg': '#05050f',
      },
      fontFamily: {
        display: ['"Fredoka One"', 'sans-serif'],
        body: ['"Nunito"', 'sans-serif'],
        hand: ['"Caveat"', 'cursive'],
      },
    },
  },
  plugins: [],
}
