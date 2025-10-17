module.exports = {
  content: [
    '../backend/dryorm/templates/**/*.html',
    './src/**/*.js',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
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
