/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'fond':       '#F5F7FA',
        'surface':    '#FFFFFF',
        'surface-2':  '#EEF1F6',
        'texte':      '#1A1F2E',
        'secondaire': '#6B7280',
        'accent':     '#00C8FF',
        'alerte':     '#FF4757',
        'retard':     '#FF6B35',
        'tam-blue':   '#0070C0',
      },
    },
  },
  plugins: [],
}
