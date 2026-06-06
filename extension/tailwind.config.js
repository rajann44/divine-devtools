/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/panel/index.html",
    "./src/panel/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
        ],
      },
      colors: {
        apple: {
          light: '#f5f5f7',
          dark: '#1d1d1f',
          border: {
            light: '#e5e5ea',
            dark: '#2c2c2e',
          },
          text: {
            light: '#1d1d1f',
            dark: '#f5f5f7',
            secondary: {
              light: '#86868b',
              dark: '#86868b',
            }
          }
        }
      }
    },
  },
  plugins: [],
}
