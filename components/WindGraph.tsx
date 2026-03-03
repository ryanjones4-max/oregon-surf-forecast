'use client'

import { useRef, useCallback } from 'react'
import type { ForecastDataPoint } from '@/lib/forecast'
import { kmhToMph, degreesToCompass } from '@/lib/surfRating'
import { useSharedCrosshair, resolveHoverIdx, PX_PER_STEP } from './ChartCrosshair'

interface Props {
  hours: ForecastDataPoint[]
}

function windColor(speed: number): string {
  if (speed < 5) return '#22c55e'
  if (speed < 10) return '#86efac'
  if (speed < 15) return '#f59e0b'
  if (speed < 25) return '#ef4444'
  return '#dc2626'
}

function windLabel(speed: number): string {
  if (speed < 5) return 'Glassy'
  if (speed < 10) return 'Light'
  if (speed < 15) return 'Moderate'
  if (speed < 25) return 'Strong'
  return 'Howling'
}

export function WindGraph({ hours }: Props) {
  const { hoverTime, setHoverTime } = useSharedCrosshair()
  const containerRef = useRef<HTMLDivElement>(null!)

  const sampled = hours.filter((_, i) => i % 3 === 0)
  const speeds = sampled.map((h) => kmhToMph(h.windSpeed ?? 0))
  const maxSpeed = Math.max(...speeds, 5)

  const step = PX_PER_STEP
  const chartW = sampled.length * step
  const barW = Math.max(2, step * 0.7)

  const chartH = 80
  const arrowH = 22
  const speedLabelH = 14
  const labelH = 20
  const totalH = chartH + arrowH + speedLabelH + labelH

  const now = Date.now()
  let nowX = -1
  let nowTime = ''

  const bars = sampled.map((h, i) => {
    const speed = kmhToMph(h.windSpeed ?? 0)
    const barH = Math.max(2, (speed / maxSpeed) * (chartH - 10))
    const x = i * step
    const hMs = new Date(h.time).getTime()
    const nextMs = sampled[i + 1] ? new Date(sampled[i + 1].time).getTime() : Infinity
    if (nowX < 0 && hMs <= now && now < nextMs) {
      nowX = x + barW / 2
      nowTime = new Date(now).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }
    return { x, speed, barH, h, i }
  })

  const dayLabels: Array<{ x: number; label: string }> = []
  let lastDay = ''
  bars.forEach((b) => {
    const d = b.h.time.slice(0, 10)
    if (d !== lastDay) {
      lastDay = d
      const date = new Date(b.h.time)
      dayLabels.push({ x: b.x, label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }) })
    }
  })

  const hoverIdx = resolveHoverIdx(sampled, hoverTime)
  const hov = hoverIdx != null ? bars[hoverIdx] : null

  const labelEvery = Math.max(1, Math.round(sampled.length / 16))

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current
    if (!container) return
    const svg = container.querySelector('svg')
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = e.clientX - rect.left + container.scrollLeft
    const idx = Math.round(x / step)
    const clamped = Math.max(0, Math.min(idx, sampled.length - 1))
    setHoverTime(sampled[clamped].time)
  }, [step, sampled, setHoverTime])

  const handlePointerLeave = useCallback(() => { setHoverTime(null) }, [setHoverTime])

  return (
    <div className="rounded-lg border border-sl-border bg-sl-card p-4">
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-sl-muted">Wind</h3>
        {hov && (
          <div className="text-right">
            <div className="text-xs text-sl-muted">
              {new Date(hov.h.time).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
            </div>
            <div className="mt-0.5 flex items-center justify-end gap-2">
              <span className="text-base font-bold text-white tabular-nums">{hov.speed.toFixed(0)} mph</span>
              <span className="text-xs text-sl-muted">{hov.h.windDirection != null ? degreesToCompass(hov.h.windDirection) : ''}</span>
              <span className="text-[10px] font-medium" style={{ color: windColor(hov.speed) }}>{windLabel(hov.speed)}</span>
            </div>
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className="overflow-x-auto touch-pan-x"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <svg width={chartW} height={totalH} className="select-none">
          {/* Day dividers */}
          {dayLabels.map((d, i) => (
            <g key={i}>
              <line x1={d.x} y1={0} x2={d.x} y2={chartH} stroke="#333333" strokeWidth="1" />
              <text x={d.x + 4} y={chartH + arrowH + speedLabelH + 14} fill="#858585" fontSize="9">{d.label}</text>
            </g>
          ))}

          {/* Y-axis grid */}
          {[0, maxSpeed / 2, maxSpeed].map((v, i) => {
            const y = chartH - (v / maxSpeed) * (chartH - 10)
            return (
              <g key={i}>
                <line x1={0} y1={y} x2={chartW} y2={y} stroke="#333333" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />
                <text x={chartW - 2} y={y - 2} fill="#6e6e6e" fontSize="8" textAnchor="end">{v.toFixed(0)}mph</text>
              </g>
            )
          })}

          {/* Wind bars */}
          {bars.map((b) => (
            <rect key={`b${b.i}`} x={b.x} y={chartH - b.barH} width={barW} height={b.barH} rx={1.5}
              fill={windColor(b.speed)} opacity={hoverIdx === b.i ? 1 : 0.45} />
          ))}

          {/* Direction arrows */}
          {bars.map((b) => {
            if (b.i % 2 !== 0) return null
            const dir = b.h.windDirection
            if (dir == null) return null
            const cx = b.x + barW / 2
            const cy = chartH + arrowH / 2 + 2
            return (
              <g key={`a${b.i}`} transform={`translate(${cx}, ${cy}) rotate(${dir})`}>
                <path d="M0 -6 L3.5 4 L0 2 L-3.5 4 Z" fill={windColor(b.speed)} opacity={hoverIdx === b.i ? 1 : 0.5} />
              </g>
            )
          })}

          {/* Speed labels */}
          {bars.map((b) => {
            if (b.i % labelEvery !== 0) return null
            return (
              <text key={`s${b.i}`} x={b.x + barW / 2} y={chartH + arrowH + speedLabelH - 2}
                fill="#858585" fontSize="7" textAnchor="middle">{b.speed.toFixed(0)}</text>
            )
          })}

          {/* Now indicator */}
          {nowX > 0 && (
            <g>
              <line x1={nowX} y1={0} x2={nowX} y2={chartH} stroke="#d4d4d4" strokeWidth="1.5" />
              <rect x={nowX - 22} y={2} width={44} height={14} rx={3} fill="#121212" stroke="#d4d4d4" strokeWidth="0.5" />
              <text x={nowX} y={12} fill="#d4d4d4" fontSize="8" fontWeight="600" textAnchor="middle">{nowTime}</text>
            </g>
          )}

          {/* Hover crosshair */}
          {hov && (
            <g>
              <line x1={hov.x + barW / 2} y1={0} x2={hov.x + barW / 2} y2={chartH} stroke="#d4d4d4" strokeWidth="1" opacity="0.3" />
              <circle cx={hov.x + barW / 2} cy={chartH - hov.barH} r="4" fill={windColor(hov.speed)} stroke="#121212" strokeWidth="2" />
            </g>
          )}
        </svg>
      </div>

      <div className="mt-2 flex gap-4 text-[10px] text-sl-muted">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Glassy</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-300" /> Light</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Moderate</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Strong</span>
      </div>
    </div>
  )
}
