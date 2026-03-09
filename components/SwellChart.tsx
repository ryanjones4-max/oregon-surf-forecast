'use client'

import { useCallback } from 'react'
import type { ForecastDataPoint } from '@/lib/forecast'
import { metersToFeet, degreesToCompass, computeSurfRating, getRatingDot, estimateBreakingHeight, surfHeightRange } from '@/lib/surfRating'
import { useSharedCrosshair, useSyncedScroll, useChartInteraction, resolveHoverIdx, PX_PER_STEP, formatCrosshairTime, DAY_LABEL_FORMAT, parseUTC, CenterTimeIndicator } from './ChartCrosshair'

interface Props {
  hours: ForecastDataPoint[]
}

export function SwellChart({ hours }: Props) {
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

  if (hours.length === 0) return null

  const sampled = hours.filter((_, i) => i % 3 === 0)
  const heights = sampled.map((h) => metersToFeet(estimateBreakingHeight(h.waveHeight, h.swellPeriod)))
  const maxH = Math.max(...heights, 1)

  const step = PX_PER_STEP
  const chartW = sampled.length * step
  const barW = Math.max(2, step * 0.7)

  const ratingBarH = 6
  const chartH = 70
  const labelH = 20
  const totalH = ratingBarH + chartH + labelH
  const topOffset = 0

  const bars = sampled.map((h, i) => {
    const ft = metersToFeet(estimateBreakingHeight(h.waveHeight, h.swellPeriod))
    const { lo, hi } = surfHeightRange(h.waveHeight, h.swellPeriod)
    const rating = computeSurfRating(h)
    const barH = Math.max(2, (ft / maxH) * (chartH - 16))
    const x = i * step
    return { x, ft, lo, hi, barH, rating, h, i }
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
        <h3 className="text-xs font-semibold uppercase tracking-wider text-sl-muted">Surf Height</h3>
        {hov && (
          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="text-xs font-medium text-white/70">
                {formatCrosshairTime(hov.h.time)}
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
              <rect key={`bg-${i}`} x={d.x} y={topOffset} width={nextX - d.x} height={ratingBarH + chartH} fill="rgba(255,255,255,0.02)" />
            ) : null
          })}

          {/* Rating color strip */}
          {bars.map((b) => (
            <rect key={`r${b.i}`} x={b.x} y={topOffset} width={barW} height={ratingBarH} rx={1}
              fill={getRatingDot(b.rating)} opacity={hoverIdx === b.i ? 1 : 0.8} />
          ))}

          {/* Day dividers */}
          {dayLabels.map((d, i) => (
            <g key={i}>
              {i > 0 && (
                <line x1={d.x} y1={topOffset + ratingBarH} x2={d.x} y2={topOffset + ratingBarH + chartH} stroke="#555" strokeWidth="1" />
              )}
              <text x={d.x + 4} y={topOffset + ratingBarH + chartH + 14} fill="#aaa" fontSize="10" fontWeight="600">{d.label}</text>
            </g>
          ))}

          {/* Y-axis grid */}
          {[0, maxH / 2, maxH].map((v, i) => {
            const y = topOffset + ratingBarH + chartH - (v / maxH) * (chartH - 16)
            return (
              <g key={i}>
                <line x1={0} y1={y} x2={chartW} y2={y} stroke="#333333" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />
                <text x={chartW - 2} y={y - 2} fill="#6e6e6e" fontSize="8" textAnchor="end">{v.toFixed(0)}ft</text>
              </g>
            )
          })}

          {/* Bars */}
          {bars.map((b) => (
            <rect key={`b${b.i}`} x={b.x} y={topOffset + ratingBarH + chartH - b.barH} width={barW} height={b.barH} rx={1.5}
              fill={getRatingDot(b.rating)} opacity={hoverIdx === b.i ? 1 : 0.45} />
          ))}

          {/* Height labels */}
          {bars.map((b) => {
            if (b.i % labelEvery !== 0 && hoverIdx !== b.i) return null
            return (
              <text key={`l${b.i}`} x={b.x + barW / 2} y={topOffset + ratingBarH + chartH - b.barH - 4}
                fill="#d4d4d4" fontSize="8" fontWeight={hoverIdx === b.i ? '700' : '500'} textAnchor="middle">
                {b.ft.toFixed(0)}
              </text>
            )
          })}

          {/* Hour labels */}
          {bars.map((b) => {
            if (b.i % labelEvery !== 0) return null
            const hour = parseUTC(b.h.time).getHours()
            return (
              <text key={`h${b.i}`} x={b.x + barW / 2} y={topOffset + ratingBarH + chartH + 14} fill="#6e6e6e" fontSize="7" textAnchor="middle">
                {hour === 0 ? '12a' : hour < 12 ? `${hour}` : hour === 12 ? '12p' : `${hour - 12}`}
              </text>
            )
          })}

          {/* Hover highlight */}
          {hov && (
            <g>
              <line x1={hov.x + barW / 2} y1={topOffset + ratingBarH} x2={hov.x + barW / 2} y2={topOffset + ratingBarH + chartH} stroke="#d4d4d4" strokeWidth="1" opacity="0.25" />
            </g>
          )}
        </svg>
      </div>
      <CenterTimeIndicator containerRef={containerRef} sampled={sampled} />
      </div>
    </div>
  )
}
