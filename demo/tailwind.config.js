/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        atlas: {
          primary: '#1e40af',
          secondary: '#3b82f6',
          accent: '#60a5fa',
          success: '#16a34a',
          warning: '#d97706',
          danger: '#dc2626',
          muted: '#6b7280',
          background: '#f8fafc',
          surface: '#ffffff',
          border: '#e2e8f0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
