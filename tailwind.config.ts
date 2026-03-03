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
          bg: '#1a1a2e',
          surface: '#16213e',
          card: '#1e2a47',
          border: '#2a3a5c',
          accent: '#0ea5e9',
          text: '#e2e8f0',
          muted: '#94a3b8',
          dark: '#0f0f23',
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
