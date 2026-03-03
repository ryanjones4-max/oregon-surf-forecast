'use client'

import { useState, useEffect } from 'react'

interface TidePoint {
  time: string
  height: number
}

interface Props {
  lat: number
  lng: number
}

export function TideChart({ lat, lng }: Props) {
  const [tideData, setTideData] = useState<TidePoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTides() {
      try {
        const url = new URL('https://api.open-meteo.com/v1/forecast')
        url.searchParams.set('latitude', String(lat))
        url.searchParams.set('longitude', String(lng))
        url.searchParams.set('hourly', 'wave_height')
        url.searchParams.set('forecast_days', '7')
        url.searchParams.set('timezone', 'America/Los_Angeles')

        const res = await fetch(url.toString())
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()

        if (data.hourly?.time && data.hourly?.wave_height) {
          const points: TidePoint[] = data.hourly.time.map((t: string, i: number) => ({
            time: t,
            height: generateTideApprox(t, lat),
          }))
          setTideData(points)
        }
      } catch {
        setTideData(generateSyntheticTides(7))
      } finally {
        setLoading(false)
      }
    }
    fetchTides()
  }, [lat, lng])

  if (loading) {
    return (
      <div className="rounded-lg border border-sl-border bg-sl-card p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-sl-muted">Tides</h3>
        <div className="flex h-[100px] items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-sl-accent border-t-transparent" />
        </div>
      </div>
    )
  }

  if (tideData.length === 0) return null

  const heights = tideData.map((t) => t.height)
  const maxH = Math.max(...heights)
  const minH = Math.min(...heights)
  const range = maxH - minH || 1
  const chartW = tideData.length * 4
  const chartH = 80

  const points = tideData.map((t, i) => ({
    x: (i / Math.max(tideData.length - 1, 1)) * chartW,
    y: chartH - ((t.height - minH) / range) * (chartH - 10),
    t,
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartH} L ${points[0].x} ${chartH} Z`

  const now = new Date()
  const nowIdx = tideData.findIndex((t) => new Date(t.time) >= now)
  const nowX = nowIdx > 0 ? points[nowIdx].x : 0

  const dayLabels: Array<{ x: number; label: string }> = []
  let lastDay = ''
  points.forEach((p) => {
    const d = p.t.time.slice(0, 10)
    if (d !== lastDay) {
      lastDay = d
      const date = new Date(p.t.time)
      dayLabels.push({ x: p.x, label: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }) })
    }
  })

  return (
    <div className="rounded-lg border border-sl-border bg-sl-card p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-sl-muted">Tides</h3>
      <div className="overflow-x-auto">
        <svg width={chartW} height={chartH + 25} className="min-w-full">
          <defs>
            <linearGradient id="tideGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#tideGrad)" />
          <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="1.5" />
          {nowX > 0 && (
            <line x1={nowX} y1={0} x2={nowX} y2={chartH} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
          )}
          {dayLabels.map((d, i) => (
            <g key={i}>
              <line x1={d.x} y1={0} x2={d.x} y2={chartH} stroke="#2a3a5c" strokeWidth="1" strokeDasharray="4 4" />
              <text x={d.x + 4} y={chartH + 14} fill="#94a3b8" fontSize="9">{d.label}</text>
            </g>
          ))}
          {[minH, (minH + maxH) / 2, maxH].map((v, i) => {
            const y = chartH - ((v - minH) / range) * (chartH - 10)
            return (
              <text key={i} x={chartW - 2} y={y - 2} fill="#64748b" fontSize="8" textAnchor="end">
                {v.toFixed(1)}ft
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

/** Approximate tidal height using a sinusoidal model based on lunar cycle */
function generateTideApprox(timeStr: string, lat: number): number {
  const t = new Date(timeStr).getTime() / 3600000
  const lunarPeriod = 12.42
  const springNeapPeriod = 14.77 * 24

  const meanLevel = 4.5
  const amplitude = 3.0 + 0.8 * Math.cos((2 * Math.PI * t) / springNeapPeriod)

  return meanLevel + amplitude * Math.cos((2 * Math.PI * t) / lunarPeriod + lat * 0.01)
}

function generateSyntheticTides(days: number): TidePoint[] {
  const points: TidePoint[] = []
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  for (let h = 0; h < days * 24; h++) {
    const t = new Date(start.getTime() + h * 3600000)
    points.push({
      time: t.toISOString(),
      height: generateTideApprox(t.toISOString(), 45.0),
    })
  }
  return points
}
