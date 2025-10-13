/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Фирменные цвета Faida Group
        primary: {
          // Тёмно-синий (основной)
          50: '#f0f2f5',
          100: '#d9dde6',
          200: '#b3bcd2',
          300: '#8d9bbd',
          400: '#677aa9',
          500: '#415994',
          600: '#2c4570',
          700: '#1f3252',
          800: '#162956',  // Дополнительный оттенок
          900: '#0E1A3A',  // Основной тёмно-синий
          950: '#080f1f',
        },
        secondary: {
          // Жёлтый/Золотистый (акцентный)
          50: '#fef9ed',
          100: '#fdf2d4',
          200: '#fbe5a9',
          300: '#f9d77d',
          400: '#f7c951',
          500: '#F2C56D',  // Основной жёлтый
          600: '#D8AE64',  // Светлый золотистый
          700: '#c29346',
          800: '#9d7737',
          900: '#78582a',
          950: '#4a3619',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'heading': ['Poppins', 'system-ui', 'sans-serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            lineHeight: '1.25',
            p: {
              lineHeight: '1.25',
            },
            li: {
              lineHeight: '1.25',
            },
          },
        },
        lg: {
          css: {
            lineHeight: '1.25',
            p: {
              lineHeight: '1.25',
            },
            li: {
              lineHeight: '1.25',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
