/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eaf3ff',
          100: '#cfe2ff',
          200: '#9cc5ff',
          300: '#69a8ff',
          400: '#3a8cff',
          500: '#1f6fe6',
          600: '#155bbf',
          700: '#114a99',
          800: '#0f3c7a',
          900: '#0c2f5e',
        },
      },
    },
  },
  plugins: [],
};
