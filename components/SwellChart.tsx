'use client'

import type { ForecastDataPoint } from '@/lib/forecast'
import { metersToFeet, computeSurfRating, getRatingDot } from '@/lib/surfRating'

interface Props {
  hours: ForecastDataPoint[]
}

export function SwellChart({ hours }: Props) {
  if (hours.length === 0) return null

  const sampled = hours.filter((_, i) => i % 3 === 0)
  const heights = sampled.map((h) => metersToFeet(h.waveHeight))
  const maxH = Math.max(...heights, 1)
  const chartW = sampled.length * 12
  const chartH = 120

  const points = sampled.map((h, i) => {
    const x = (i / (sampled.length - 1)) * chartW
    const y = chartH - (metersToFeet(h.waveHeight) / maxH) * (chartH - 10)
    return { x, y, h }
  })

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartH} L ${points[0].x} ${chartH} Z`

  const dayLabels: Array<{ x: number; label: string }> = []
  let lastDay = ''
  points.forEach((p) => {
    const d = p.h.time.slice(0, 10)
    if (d !== lastDay) {
      lastDay = d
      const date = new Date(p.h.time)
      dayLabels.push({ x: p.x, label: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }) })
    }
  })

  return (
    <div className="rounded-lg border border-sl-border bg-sl-card p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-sl-muted">Swell Height</h3>
      <div className="overflow-x-auto">
        <svg width={chartW} height={chartH + 30} className="min-w-full">
          <defs>
            <linearGradient id="swellGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#swellGrad)" />
          <path d={pathD} fill="none" stroke="#0ea5e9" strokeWidth="2" />
          {points.map((p, i) => {
            if (i % 4 !== 0) return null
            const rating = computeSurfRating({ waveHeight: p.h.waveHeight, swellPeriod: p.h.swellPeriod, windSpeed: p.h.windSpeed })
            return (
              <circle key={i} cx={p.x} cy={p.y} r="3" fill={getRatingDot(rating)} />
            )
          })}
          {dayLabels.map((d, i) => (
            <g key={i}>
              <line x1={d.x} y1={0} x2={d.x} y2={chartH} stroke="#2a3a5c" strokeWidth="1" strokeDasharray="4 4" />
              <text x={d.x + 4} y={chartH + 16} fill="#94a3b8" fontSize="9">{d.label}</text>
            </g>
          ))}
          {[0, maxH / 2, maxH].map((v, i) => {
            const y = chartH - (v / maxH) * (chartH - 10)
            return (
              <text key={i} x={chartW - 2} y={y - 2} fill="#64748b" fontSize="8" textAnchor="end">
                {v.toFixed(0)}ft
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
