'use client'

import { useCallback } from 'react'
import type { ForecastDataPoint } from '@/lib/forecast'
import { kmhToMph, degreesToCompass } from '@/lib/surfRating'
import { useSharedCrosshair, useSyncedScroll, useChartInteraction, resolveHoverIdx, PX_PER_STEP, formatCrosshairTime, DAY_LABEL_FORMAT, parseUTC, CenterTimeIndicator } from './ChartCrosshair'

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
  const { hoverTime } = useSharedCrosshair()
  const { containerRef, onScroll } = useSyncedScroll()

  const resolveTime = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el || hours.length === 0) return null
    const rect = el.getBoundingClientRect()
    const x = clientX - rect.left + el.scrollLeft
    const sampled = hours.filter((_, i) => i % 3 === 0)
    const idx = Math.round(x / PX_PER_STEP)
    const clamped = Math.max(0, Math.min(idx, sampled.length - 1))
    return sampled[clamped]?.time ?? null
  }, [hours, containerRef])

  const interaction = useChartInteraction(resolveTime, containerRef)

  const sampled = hours.filter((_, i) => i % 3 === 0)
  const speeds = sampled.map((h) => kmhToMph(h.windSpeed ?? 0))
  const maxSpeed = Math.max(...speeds, 5)

  const step = PX_PER_STEP
  const chartW = sampled.length * step
  const barW = Math.max(2, step * 0.7)

  const chartH = 55
  const arrowH = 16
  const speedLabelH = 10
  const labelH = 16
  const totalH = chartH + arrowH + speedLabelH + labelH
  const topOffset = 0

  const bars = sampled.map((h, i) => {
    const speed = kmhToMph(h.windSpeed ?? 0)
    const barH = Math.max(2, (speed / maxSpeed) * (chartH - 10))
    const x = i * step
    return { x, speed, barH, h, i }
  })

  const dayLabels: Array<{ x: number; label: string; dayIdx: number }> = []
  let lastDay = ''
  bars.forEach((b) => {
    const d = b.h.time.slice(0, 10)
    if (d !== lastDay) {
      lastDay = d
      const date = parseUTC(b.h.time)
      dayLabels.push({ x: b.x, label: date.toLocaleDateString('en-US', DAY_LABEL_FORMAT), dayIdx: dayLabels.length })
    }
  })

  const hoverIdx = resolveHoverIdx(sampled, hoverTime)
  const hov = hoverIdx != null ? bars[hoverIdx] : null

  const labelEvery = Math.max(1, Math.round(sampled.length / 16))

  return (
    <div className="rounded-lg border border-sl-border bg-sl-card px-3 py-2">
      <div className="mb-1.5 flex items-start justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-sl-muted">Wind</h3>
        {hov && (
          <div className="text-right">
            <div className="text-xs font-medium text-white/70">
              {formatCrosshairTime(hov.h.time)}
            </div>
            <div className="mt-0.5 flex items-center justify-end gap-2">
              <span className="text-base font-bold text-white tabular-nums">{hov.speed.toFixed(0)} mph</span>
              <span className="text-xs text-sl-muted">{hov.h.windDirection != null ? degreesToCompass(hov.h.windDirection) : ''}</span>
              <span className="text-[10px] font-medium" style={{ color: windColor(hov.speed) }}>{windLabel(hov.speed)}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ position: 'relative' }}>
      <div
        ref={containerRef}
        className="overflow-x-auto"
        style={{ touchAction: 'none' }}
        {...interaction}
        onScroll={onScroll}
      >
        <svg width={chartW} height={totalH} className="select-none">
          {/* Alternating day backgrounds */}
          {dayLabels.map((d, i) => {
            const nextX = dayLabels[i + 1]?.x ?? chartW
            return d.dayIdx % 2 === 1 ? (
              <rect key={`bg-${i}`} x={d.x} y={topOffset} width={nextX - d.x} height={chartH} fill="rgba(255,255,255,0.02)" />
            ) : null
          })}

          {/* Day dividers */}
          {dayLabels.map((d, i) => (
            <g key={i}>
              {i > 0 && (
                <line x1={d.x} y1={topOffset} x2={d.x} y2={topOffset + chartH} stroke="#555" strokeWidth="1" />
              )}
              <text x={d.x + 4} y={topOffset + chartH + arrowH + speedLabelH + 14} fill="#aaa" fontSize="10" fontWeight="600">{d.label}</text>
            </g>
          ))}

          {/* Y-axis grid */}
          {[0, maxSpeed / 2, maxSpeed].map((v, i) => {
            const y = topOffset + chartH - (v / maxSpeed) * (chartH - 10)
            return (
              <g key={i}>
                <line x1={0} y1={y} x2={chartW} y2={y} stroke="#333333" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />
                <text x={chartW - 2} y={y - 2} fill="#6e6e6e" fontSize="8" textAnchor="end">{v.toFixed(0)}mph</text>
              </g>
            )
          })}

          {/* Wind bars */}
          {bars.map((b) => (
            <rect key={`b${b.i}`} x={b.x} y={topOffset + chartH - b.barH} width={barW} height={b.barH} rx={1.5}
              fill={windColor(b.speed)} opacity={hoverIdx === b.i ? 1 : 0.45} />
          ))}

          {/* Direction arrows */}
          {bars.map((b) => {
            if (b.i % 2 !== 0) return null
            const dir = b.h.windDirection
            if (dir == null) return null
            const cx = b.x + barW / 2
            const cy = topOffset + chartH + arrowH / 2 + 2
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
              <text key={`s${b.i}`} x={b.x + barW / 2} y={topOffset + chartH + arrowH + speedLabelH - 2}
                fill="#858585" fontSize="7" textAnchor="middle">{b.speed.toFixed(0)}</text>
            )
          })}

          {/* Hover highlight */}
          {hov && (
            <g>
              <line x1={hov.x + barW / 2} y1={topOffset} x2={hov.x + barW / 2} y2={topOffset + chartH} stroke="#d4d4d4" strokeWidth="1" opacity="0.25" />
            </g>
          )}
        </svg>
      </div>
      <CenterTimeIndicator containerRef={containerRef} sampled={sampled} />
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
