/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Tajawal', 'Outfit', 'sans-serif'],
      },
      colors: {
        slate: {
          850: '#151e2e',
          900: '#0f172a',
          950: '#020617',
        }
      }
    },
  },
  plugins: [],
}
