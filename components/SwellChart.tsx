'use client'

import { useCallback } from 'react'
import type { ForecastDataPoint } from '@/lib/forecast'
import { metersToFeet, degreesToCompass, computeSurfRating, getRatingDot, getRatingLabel, estimateBreakingHeight, surfHeightRange } from '@/lib/surfRating'
import { useSharedCrosshair, useSyncedScroll, useChartInteraction, resolveHoverIdx, PX_PER_STEP } from './ChartCrosshair'

interface Props {
  hours: ForecastDataPoint[]
}

export function SwellChart({ hours }: Props) {
  const { hoverTime, inspecting } = useSharedCrosshair()
  const { containerRef, onScroll } = useSyncedScroll()

  const resolveTime = useCallback((clientX: number, scrollLeft: number) => {
    const el = containerRef.current
    if (!el || hours.length === 0) return null
    const svg = el.querySelector('svg')
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const x = clientX - rect.left + scrollLeft
    const sampled = hours.filter((_, i) => i % 3 === 0)
    const idx = Math.round(x / PX_PER_STEP)
    const clamped = Math.max(0, Math.min(idx, sampled.length - 1))
    return sampled[clamped]?.time ?? null
  }, [hours, containerRef])

  const interaction = useChartInteraction(resolveTime, containerRef)

  if (hours.length === 0) return null

  const sampled = hours.filter((_, i) => i % 3 === 0)
  const heights = sampled.map((h) => metersToFeet(estimateBreakingHeight(h.waveHeight, h.swellPeriod)))
  const maxH = Math.max(...heights, 1)

  const step = PX_PER_STEP
  const chartW = sampled.length * step
  const barW = Math.max(2, step * 0.7)

  const ratingBarH = 6
  const chartH = 110
  const labelH = 24
  const totalH = ratingBarH + chartH + labelH

  const now = Date.now()
  let nowX = -1
  let nowTime = ''

  const bars = sampled.map((h, i) => {
    const ft = metersToFeet(estimateBreakingHeight(h.waveHeight, h.swellPeriod))
    const { lo, hi } = surfHeightRange(h.waveHeight, h.swellPeriod)
    const rating = computeSurfRating(h)
    const barH = Math.max(2, (ft / maxH) * (chartH - 16))
    const x = i * step
    const hMs = new Date(h.time).getTime()
    const nextMs = sampled[i + 1] ? new Date(sampled[i + 1].time).getTime() : Infinity
    if (nowX < 0 && hMs <= now && now < nextMs) {
      nowX = x + barW / 2
      nowTime = new Date(now).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }
    return { x, ft, lo, hi, barH, rating, h, i }
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

  return (
    <div className="rounded-lg border border-sl-border bg-sl-card p-4">
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-sl-muted">Surf Height</h3>
        {hov && (
          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="text-xs text-sl-muted">
                {new Date(hov.h.time).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
              </div>
              <div className="mt-0.5 text-base font-bold text-white tabular-nums">
                {hov.lo}-{hov.hi} ft
              </div>
            </div>
            <div className="text-left text-[10px] leading-relaxed text-sl-muted">
              <div>{metersToFeet(hov.h.swellHeight).toFixed(1)}ft {hov.h.swellPeriod.toFixed(0)}s
                <span className="ml-1">{degreesToCompass(hov.h.swellDirection)} {hov.h.swellDirection.toFixed(0)}°</span>
              </div>
              {hov.h.windWaveHeight > 0 && (
                <div className="text-sl-muted/60">
                  Wind swell: {metersToFeet(hov.h.windWaveHeight).toFixed(1)}ft {hov.h.windWavePeriod.toFixed(0)}s
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className="overflow-x-auto"
        style={{ touchAction: inspecting ? 'none' : 'pan-x' }}
        {...interaction}
        onScroll={onScroll}
      >
        <svg width={chartW} height={totalH} className="select-none">
          {/* Rating color strip */}
          {bars.map((b) => (
            <rect key={`r${b.i}`} x={b.x} y={0} width={barW} height={ratingBarH} rx={1}
              fill={getRatingDot(b.rating)} opacity={hoverIdx === b.i ? 1 : 0.8} />
          ))}

          {/* Day dividers */}
          {dayLabels.map((d, i) => (
            <g key={i}>
              <line x1={d.x} y1={ratingBarH} x2={d.x} y2={ratingBarH + chartH} stroke="#333333" strokeWidth="1" />
              <text x={d.x + 4} y={ratingBarH + chartH + 14} fill="#858585" fontSize="9">{d.label}</text>
            </g>
          ))}

          {/* Y-axis grid */}
          {[0, maxH / 2, maxH].map((v, i) => {
            const y = ratingBarH + chartH - (v / maxH) * (chartH - 16)
            return (
              <g key={i}>
                <line x1={0} y1={y} x2={chartW} y2={y} stroke="#333333" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />
                <text x={chartW - 2} y={y - 2} fill="#6e6e6e" fontSize="8" textAnchor="end">{v.toFixed(0)}ft</text>
              </g>
            )
          })}

          {/* Bars */}
          {bars.map((b) => (
            <rect key={`b${b.i}`} x={b.x} y={ratingBarH + chartH - b.barH} width={barW} height={b.barH} rx={1.5}
              fill={getRatingDot(b.rating)} opacity={hoverIdx === b.i ? 1 : 0.45} />
          ))}

          {/* Height labels */}
          {bars.map((b) => {
            if (b.i % labelEvery !== 0 && hoverIdx !== b.i) return null
            return (
              <text key={`l${b.i}`} x={b.x + barW / 2} y={ratingBarH + chartH - b.barH - 4}
                fill="#d4d4d4" fontSize="8" fontWeight={hoverIdx === b.i ? '700' : '500'} textAnchor="middle">
                {b.ft.toFixed(0)}
              </text>
            )
          })}

          {/* Hour labels */}
          {bars.map((b) => {
            if (b.i % labelEvery !== 0) return null
            const hour = new Date(b.h.time).getHours()
            return (
              <text key={`h${b.i}`} x={b.x + barW / 2} y={ratingBarH + chartH + 14} fill="#6e6e6e" fontSize="7" textAnchor="middle">
                {hour === 0 ? '12a' : hour < 12 ? `${hour}` : hour === 12 ? '12p' : `${hour - 12}`}
              </text>
            )
          })}

          {/* Now indicator */}
          {nowX > 0 && (
            <g>
              <line x1={nowX} y1={ratingBarH} x2={nowX} y2={ratingBarH + chartH} stroke="#d4d4d4" strokeWidth="1.5" />
              <rect x={nowX - 22} y={ratingBarH + 2} width={44} height={14} rx={3} fill="#121212" stroke="#d4d4d4" strokeWidth="0.5" />
              <text x={nowX} y={ratingBarH + 12} fill="#d4d4d4" fontSize="8" fontWeight="600" textAnchor="middle">{nowTime}</text>
            </g>
          )}

          {/* Hover crosshair */}
          {hov && (
            <g>
              <line x1={hov.x + barW / 2} y1={ratingBarH} x2={hov.x + barW / 2} y2={ratingBarH + chartH} stroke="#d4d4d4" strokeWidth="1" opacity="0.3" />
              <circle cx={hov.x + barW / 2} cy={ratingBarH + chartH - hov.barH} r="4" fill={getRatingDot(hov.rating)} stroke="#121212" strokeWidth="2" />
            </g>
          )}
        </svg>
      </div>
    </div>
  )
}
