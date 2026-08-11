/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#00e5ff',
        success: '#00ff88',
        warning: '#ff9900',
        danger: '#ff4444',
        surface: '#111827',
        panel: '#1f2937',
      },
      animation: {
        pulse2: 'pulse 1.5s ease-in-out infinite',
        glow: 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(0,229,255,0.4)' },
          '50%': { boxShadow: '0 0 24px rgba(0,229,255,0.9)' },
        },
      },
    },
  },
  plugins: [],
};
