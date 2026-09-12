/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070C18',
          900: '#0B132B',
          850: '#111C38',
          800: '#1C2541',
          700: '#2A3B5C',
          600: '#3A506B',
        },
        spotter: {
          cyan: '#00F0FF',
          teal: '#00C49F',
          blue: '#2563EB',
          dark: '#0A1128',
          slate: '#1E293B',
          card: '#0F172A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
}
