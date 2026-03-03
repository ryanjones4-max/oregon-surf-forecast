'use client'

import type { ForecastDataPoint } from '@/lib/forecast'
import { kmhToMph, degreesToCompass } from '@/lib/surfRating'

interface Props {
  hours: ForecastDataPoint[]
}

export function WindGraph({ hours }: Props) {
  const sampled = hours.filter((_, i) => i % 3 === 0)
  const speeds = sampled.map((h) => kmhToMph(h.windSpeed ?? 0))
  const maxSpeed = Math.max(...speeds, 5)
  const chartW = sampled.length * 12
  const chartH = 100

  const points = sampled.map((h, i) => {
    const x = (i / Math.max(sampled.length - 1, 1)) * chartW
    const speed = kmhToMph(h.windSpeed ?? 0)
    const y = chartH - (speed / maxSpeed) * (chartH - 10)
    return { x, y, h, speed }
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

  function windColor(speed: number): string {
    if (speed < 5) return '#22c55e'
    if (speed < 10) return '#86efac'
    if (speed < 15) return '#f59e0b'
    if (speed < 25) return '#ef4444'
    return '#dc2626'
  }

  return (
    <div className="rounded-lg border border-sl-border bg-sl-card p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-sl-muted">Wind</h3>
      <div className="overflow-x-auto">
        <svg width={chartW} height={chartH + 40} className="min-w-full">
          <defs>
            <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#windGrad)" />
          <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="1.5" />
          {points.map((p, i) => {
            if (i % 6 !== 0) return null
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="3" fill={windColor(p.speed)} />
                {p.h.windDirection != null && (
                  <g transform={`translate(${p.x}, ${p.y - 14}) rotate(${p.h.windDirection}, 0, 0)`}>
                    <path d="M0 -5 L3 3 L0 1 L-3 3 Z" fill={windColor(p.speed)} opacity="0.8" />
                  </g>
                )}
                <text x={p.x} y={p.y + 14} fill="#94a3b8" fontSize="8" textAnchor="middle">
                  {p.speed.toFixed(0)}
                </text>
              </g>
            )
          })}
          {dayLabels.map((d, i) => (
            <g key={i}>
              <line x1={d.x} y1={0} x2={d.x} y2={chartH} stroke="#2a3a5c" strokeWidth="1" strokeDasharray="4 4" />
              <text x={d.x + 4} y={chartH + 16} fill="#94a3b8" fontSize="9">{d.label}</text>
            </g>
          ))}
          {[0, maxSpeed / 2, maxSpeed].map((v, i) => {
            const y = chartH - (v / maxSpeed) * (chartH - 10)
            return (
              <text key={i} x={chartW - 2} y={y - 2} fill="#64748b" fontSize="8" textAnchor="end">
                {v.toFixed(0)}mph
              </text>
            )
          })}
        </svg>
      </div>
      <div className="mt-2 flex gap-4 text-[10px] text-sl-muted">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> &lt;5 mph</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-300" /> 5-10</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> 10-15</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> 15+</span>
      </div>
    </div>
  )
}
