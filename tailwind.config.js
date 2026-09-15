/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zinc: {
          50: 'rgb(var(--app-zinc-50) / <alpha-value>)',
          100: 'rgb(var(--app-zinc-100) / <alpha-value>)',
          200: 'rgb(var(--app-zinc-200) / <alpha-value>)',
          300: 'rgb(var(--app-zinc-300) / <alpha-value>)',
          400: 'rgb(var(--app-zinc-400) / <alpha-value>)',
          500: 'rgb(var(--app-zinc-500) / <alpha-value>)',
          600: 'rgb(var(--app-zinc-600) / <alpha-value>)',
          700: 'rgb(var(--app-zinc-700) / <alpha-value>)',
          800: 'rgb(var(--app-zinc-800) / <alpha-value>)',
          900: 'rgb(var(--app-zinc-900) / <alpha-value>)',
          950: 'rgb(var(--app-zinc-950) / <alpha-value>)',
        },
        background: {
          DEFAULT: 'rgb(var(--app-zinc-950) / <alpha-value>)',
        },
        foreground: {
          DEFAULT: 'rgb(var(--app-zinc-100) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'rgb(var(--app-zinc-900) / <alpha-value>)',
          foreground: 'rgb(var(--app-zinc-100) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--app-zinc-800) / <alpha-value>)',
          foreground: 'rgb(var(--app-zinc-500) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--app-zinc-800) / <alpha-value>)',
          strong: 'rgb(var(--app-zinc-700) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'rgb(var(--app-zinc-900) / <alpha-value>)',
          muted: 'rgb(var(--app-zinc-800) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--app-zinc-950) / <alpha-value>)',
        },
        'on-primary': {
          DEFAULT: 'rgb(var(--app-on-primary) / <alpha-value>)',
        },
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        accent: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
      },
      fontFamily: {
        sans: ['Figtree', 'system-ui', 'sans-serif'],
        display: ['Instrument Serif', 'Georgia', 'serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'page': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.02em', fontWeight: '600' }],
        'section': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
      },
      borderRadius: {
        'control': '0.625rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'slide-down': 'slideDown 0.25s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
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
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      boxShadow: {
        'lift': '0 1px 2px rgba(0,0,0,0.24), 0 8px 24px rgba(0,0,0,0.18)',
      },
    },
  },
  plugins: [],
};
