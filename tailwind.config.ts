import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sl: {
          bg: '#181818',
          surface: '#1f1f1f',
          card: '#262626',
          border: '#333333',
          accent: '#0ea5e9',
          text: '#d4d4d4',
          muted: '#7a7a7a',
          dark: '#121212',
        },
        rating: {
          flat: '#64748b',
          poor: '#ef4444',
          fair: '#f59e0b',
          good: '#22c55e',
          great: '#06b6d4',
          epic: '#8b5cf6',
        },
      },
    },
  },
  plugins: [],
}
export default config
