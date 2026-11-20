/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', '"Noto Sans Bengali"', 'Roboto', 'sans-serif'],
      },
      // These read CSS variables from index.css, so light/dark switch automatically.
      colors: {
        cream: 'var(--c-cream)',
        ink: 'var(--c-ink)',
        muted: 'var(--c-muted)',
        line: 'var(--c-line)',
        surface: 'var(--c-surface)',
      },
    },
  },
  plugins: [],
}
