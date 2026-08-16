/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          500: '#ef4444', // Primary Crimson Accent
          600: '#dc2626', // Hover / Active Red
          700: '#b91c1c',
          glow: 'rgba(239, 68, 68, 0.18)',
        },
      },
      boxShadow: {
        'red-glow': '0 0 25px -5px rgba(239, 68, 68, 0.25)',
        'red-glow-lg': '0 0 35px -5px rgba(239, 68, 68, 0.35)',
      },
    },
  },
  plugins: [],
};