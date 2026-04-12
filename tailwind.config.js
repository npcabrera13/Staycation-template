/** @type {import('tailwindcss').Config} */
export default {
  // Scan all source files for class names — explicitly exclude node_modules to keep builds fast
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{js,ts,jsx,tsx}',
    './contexts/**/*.{js,ts,jsx,tsx}',
    './services/**/*.{js,ts,jsx,tsx}',
    './utils/**/*.{js,ts,jsx,tsx}',
  ],
  // Dark mode via a 'dark' class on <html> (matches the ThemeContext setup)
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // These reference CSS variables set dynamically by ThemeContext
        // so the client can change their brand colors from the Admin panel
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        surface: '#F4F1DE',
        text: '#333333',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      animation: {
        'fade-in-up':    'fadeInUp 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'fade-in':       'fadeIn 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'slide-in-left':  'slideInLeft 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'slide-in-right': 'slideInRight 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'pop':           'pop 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-slow':    'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-down':    'slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInLeft: {
          '0%':   { opacity: '0', transform: 'translateX(-40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pop: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-10px)', maxHeight: '0' },
          '100%': { opacity: '1', transform: 'translateY(0)',     maxHeight: '500px' },
        },
      },
    },
  },
  plugins: [],
};
