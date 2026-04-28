import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Onest', 'sans-serif'],
      },
      colors: {
        primary: '#550fed',
        'primary-light': '#745cff',
        'primary-xlight': '#ebe8f2',
        'secondary-green': '#1beaa0',
        'secondary-pink': '#f0adfc',
        'black-900': '#282828',
        'gray-dark': '#62748c',
        'gray-medium': '#444444',
        'gray-light': '#e0dee7',
        'gray-xlight': '#ecebf0',
        'gray-xxlight': '#f5f5f5',
      },
      letterSpacing: {
        title: '-0.02em',
        body: '-0.01em',
      },
      borderRadius: {
        full: '9999px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(85, 15, 237, 0.08)',
        hover: '0 8px 40px rgba(85, 15, 237, 0.16)',
      },
    },
  },
  plugins: [],
}

export default config
