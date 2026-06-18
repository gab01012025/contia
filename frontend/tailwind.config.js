/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef4ff',
          100: '#dbe8fe',
          200: '#bfd4fe',
          300: '#93b8fd',
          400: '#6090fa',
          500: '#3b6cf5',
          600: '#254aea',
          700: '#1d39d7',
          800: '#1e30ae',
          900: '#1e2d89',
          950: '#161d54',
        },
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1rem',
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(59, 108, 245, 0.15)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #3b6cf5 0%, #6090fa 50%, #93b8fd 100%)',
        'gradient-dark': 'linear-gradient(135deg, #161d54 0%, #1e2d89 50%, #1d39d7 100%)',
        'gradient-subtle': 'linear-gradient(135deg, #eef4ff 0%, #f8fafc 100%)',
        'mesh': 'radial-gradient(at 27% 37%, #eef4ff 0, transparent 50%), radial-gradient(at 97% 21%, #dbe8fe 0, transparent 50%), radial-gradient(at 52% 99%, #bfd4fe 0, transparent 40%), radial-gradient(at 10% 29%, #f0f9ff 0, transparent 50%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
