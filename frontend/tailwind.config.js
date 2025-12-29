/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,jsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Theme colors - automatically switch between light/dark via CSS variables
        'theme': {
          'page': 'var(--color-bg-page)',
          'panel': 'var(--color-bg-panel)',
          'surface': 'var(--color-bg-surface)',
          'elevated': 'var(--color-bg-elevated)',
          'border': 'var(--color-border)',
          'border-light': 'var(--color-border-light)',
          'text': 'var(--color-text-primary)',
          'text-secondary': 'var(--color-text-secondary)',
          'text-muted': 'var(--color-text-muted)',
        },
        // Editor (left section)
        'editor': {
          'bg': 'var(--color-editor-bg)',
          'gutter': 'var(--color-editor-gutter)',
        },
        // Results (right section)
        'results': {
          'bg': 'var(--color-results-bg)',
          'header': 'var(--color-results-header)',
          'surface': 'var(--color-results-surface)',
        },
        // Brand colors
        'brand': {
          'DEFAULT': 'var(--color-brand)',
          'dark': 'var(--color-brand-dark)',
          'light': 'var(--color-brand-light)',
        },
        // Legacy django colors (keeping for backwards compatibility)
        'django': {
          'primary': '#0C4B33',
          'primary-light': '#1f7963',
          'primary-dark': '#0f4238',
          'secondary': '#44B78B',
          'tertiary': '#47bd90',
          'bg': '#F8F8F8',
          'text': '#333333'
        }
      }
    }
  },
  plugins: [],
}
