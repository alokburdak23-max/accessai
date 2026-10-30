/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // PRIMARY: ROSE
        rose: {
          DEFAULT: '#C96F82',
          primary: '#C96F82',
          deep: '#A84F65',
          soft: '#F8E9ED',
          bg: '#FFF5F6',
        },
        // SECONDARY: OLIVE
        olive: {
          DEFAULT: '#7B8053',
          primary: '#7B8053',
          deep: '#62683F',
          soft: '#EEF0E3',
          bg: '#F6F7F0',
        },
        // BACKGROUND: WHITE & NEUTRALS
        surface: {
          main: '#FFFFFF',
          secondary: '#FAFAF8',
          card: '#FFFFFF',
          section: '#F8F8F5',
        },
        // TEXT
        content: {
          primary: '#292A27',
          secondary: '#70716B',
          muted: '#999A92',
        },
        // BORDERS
        edge: {
          DEFAULT: '#EAEAE4',
          soft: '#F0EDE9',
        },
        // STATUS
        status: {
          critical: '#C94F55',
          serious: '#D88A4C',
          moderate: '#C5A64D',
          minor: '#7B8053',
          success: '#648568',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace']
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(41, 42, 39, 0.04), 0 1px 2px -1px rgba(41, 42, 39, 0.04)',
        'card-hover': '0 4px 12px 0 rgba(41, 42, 39, 0.06), 0 2px 4px -2px rgba(41, 42, 39, 0.04)',
        'rose-sm': '0 2px 8px -2px rgba(201, 111, 130, 0.25)',
        'rose': '0 4px 14px -3px rgba(201, 111, 130, 0.3)',
        'olive': '0 4px 14px -3px rgba(123, 128, 83, 0.25)',
        'dropdown': '0 10px 25px -5px rgba(41, 42, 39, 0.08), 0 8px 10px -6px rgba(41, 42, 39, 0.04)'
      }
    },
  },
  plugins: [],
}
