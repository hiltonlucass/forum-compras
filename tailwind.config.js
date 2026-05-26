/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef4fb',
          100: '#d4e4f5',
          200: '#a9c9eb',
          300: '#7eaee1',
          400: '#4d8fd4',
          500: '#2E86AB',
          600: '#1E3A5F',
          700: '#182f4d',
          800: '#12243b',
          900: '#0c1929',
          950: '#060d15',
        },
        accent: {
          50: '#fff8ed',
          100: '#ffefd4',
          200: '#ffdba8',
          300: '#ffc170',
          400: '#F18F01',
          500: '#e07d00',
          600: '#c46800',
          700: '#a35200',
          800: '#824000',
          900: '#6b3500',
        },
        success: {
          50: '#edfaf6',
          100: '#d4f3ea',
          200: '#a9e7d5',
          300: '#7edbc0',
          400: '#44BBA4',
          500: '#3aa892',
          600: '#2f8a78',
          700: '#256c5e',
          800: '#1a4e44',
          900: '#10302a',
        },
        surface: '#FFFFFF',
        background: '#F4F6F8',
        'text-primary': '#1A1A2E',
        'text-secondary': '#6B7280',
      },
      fontFamily: {
        heading: ['Sora', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      maxWidth: {
        container: '1200px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(30, 58, 95, 0.06), 0 1px 2px rgba(30, 58, 95, 0.04)',
        'card-hover': '0 10px 25px rgba(30, 58, 95, 0.08), 0 4px 10px rgba(30, 58, 95, 0.04)',
        header: '0 1px 3px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
