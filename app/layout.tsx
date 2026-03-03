import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Oregon Surf Forecast',
    template: '%s — Oregon Surf Forecast',
  },
  description: 'Real-time surf reports for every break on the Oregon Coast — Cannon Beach to Brookings. Wave height, swell, wind, tides, and webcams.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
