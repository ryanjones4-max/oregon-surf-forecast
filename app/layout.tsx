import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Swellcast Surf Report',
    template: '%s — Swellcast Surf Report',
  },
  description: 'Real-time surf reports for breaks on the Oregon and North Carolina coasts. Wave height, swell, wind, tides, and webcams.',
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
