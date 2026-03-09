'use client'

import { useMemo, useCallback } from 'react'
import type { ForecastDataPoint } from '@/lib/forecast'
import { calculateSunTimes } from '@/lib/sun'
import { useSharedCrosshair, useSyncedScroll, useChartInteraction, resolveHoverIdx, PX_PER_STEP, formatCrosshairTime, DAY_LABEL_FORMAT, parseUTC, CenterTimeIndicator } from './ChartCrosshair'

interface TidePoint {
  time: string
  height: number
}

interface Props {
  lat: number
  lng: number
  hours: ForecastDataPoint[]
}

interface PeakLabel {
  x: number
  y: number
  time: string
  height: number
  type: 'high' | 'low'
}

const CHART_H = 100
const PEAK_LABEL_H = 40
const PILL_H = 20
const TIME_AXIS_H = 18
const DAY_LABEL_H = 16
const SUN_ROW_H = 38

export function TideChart({ lat, lng, hours }: Props) {
  const { hoverTime, inspecting } = useSharedCrosshair()
  const { containerRef, onScroll } = useSyncedScroll()

  const sampled = useMemo(() => {
    if (hours.length === 0) return []
    return hours
      .filter((_, i) => i % 3 === 0)
      .map((h) => ({
        time: h.time,
        height: generateTideApprox(h.time, lat),
      }))
  }, [hours, lat])

  const sunData = useMemo(() => {
    const days: Array<{ date: Date; sun: ReturnType<typeof calculateSunTimes> }> = []
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    for (let d = 0; d < 10; d++) {
      const date = new Date(start.getTime() + d * 86400000)
      days.push({ date, sun: calculateSunTimes(lat, lng, date) })
    }
    return days
  }, [lat, lng])

  const resolveTime = useCallback((clientX: number, scrollLeft: number) => {
    const el = containerRef.current
    if (!el || sampled.length < 2) return null
    const svg = el.querySelector('svg')
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const x = clientX - rect.left + scrollLeft
    const idx = Math.round(x / PX_PER_STEP)
    const clamped = Math.max(0, Math.min(idx, sampled.length - 1))
    return sampled[clamped]?.time ?? null
  }, [sampled, containerRef])

  const interaction = useChartInteraction(resolveTime, containerRef)

  if (sampled.length === 0) return null

  const step = PX_PER_STEP
  const chartW = sampled.length * step
  const totalH = PILL_H + PEAK_LABEL_H + CHART_H + TIME_AXIS_H + DAY_LABEL_H + SUN_ROW_H
  const topOffset = PILL_H

  const heights = sampled.map((t) => t.height)
  const maxH = Math.max(...heights)
  const minH = Math.min(...heights)
  const range = maxH - minH || 1

  const points = sampled.map((t, i) => ({
    x: i * step + step / 2,
    y: topOffset + PEAK_LABEL_H + CHART_H - ((t.height - minH) / range) * (CHART_H - 10),
    t,
  }))

  const splinePath = buildSmoothPath(points)
  const areaPath = `${splinePath} L ${points[points.length - 1].x} ${topOffset + PEAK_LABEL_H + CHART_H} L ${points[0].x} ${topOffset + PEAK_LABEL_H + CHART_H} Z`
  const peaks = findPeaks(points)

  const daySpans: Array<{ x: number; endX: number; dayIdx: number; label: string }> = []
  let lastDay = ''
  let currentSpan: typeof daySpans[0] | null = null
  points.forEach((p) => {
    const d = p.t.time.slice(0, 10)
    if (d !== lastDay) {
      lastDay = d
      if (currentSpan) currentSpan.endX = p.x - step / 2
      const date = parseUTC(p.t.time)
      currentSpan = { x: p.x - step / 2, endX: chartW, dayIdx: daySpans.length, label: date.toLocaleDateString('en-US', DAY_LABEL_FORMAT) }
      daySpans.push(currentSpan)
    }
  })

  const hourTicks: Array<{ x: number; label: string }> = []
  sampled.forEach((t, i) => {
    const date = new Date(t.time)
    const h = date.getUTCHours()
    if (h % 6 === 0 && h !== 0) {
      const label = h > 12 ? String(h - 12) : String(h)
      hourTicks.push({ x: points[i].x, label })
    }
  })

  const hoverIdx = resolveHoverIdx(sampled, hoverTime)
  const hovered = hoverIdx != null ? points[hoverIdx] : null

  return (
    <div className="rounded-lg border border-sl-border bg-sl-card p-4">
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-sl-muted">
          Tides <span className="font-normal text-sl-muted/50">(ft)</span>
        </h3>
        {hovered && (
          <div className="text-right">
            <div className="text-xs font-medium text-white/70">
              {formatCrosshairTime(hovered.t.time)}
            </div>
            <div className="mt-0.5 text-base font-bold text-white tabular-nums">
              {hovered.t.height.toFixed(2)} ft
            </div>
          </div>
        )}
      </div>
      <div style={{ position: 'relative' }}>
      <div
        ref={containerRef}
        className="overflow-x-auto"
        style={{ touchAction: inspecting ? 'none' : 'pan-x' }}
        {...interaction}
        onScroll={onScroll}
      >
        <svg width={chartW} height={totalH} className="select-none">
          <defs>
            <linearGradient id="tideFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#858585" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#858585" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {/* Alternating day backgrounds */}
          {daySpans.map((d, i) => {
            return d.dayIdx % 2 === 1 ? (
              <rect key={`bg-${i}`} x={d.x} y={topOffset + PEAK_LABEL_H} width={d.endX - d.x} height={CHART_H} fill="rgba(255,255,255,0.02)" />
            ) : null
          })}

          {/* Day dividers */}
          {daySpans.map((d, i) => i > 0 ? (
            <line key={`div-${i}`} x1={d.x} y1={topOffset + PEAK_LABEL_H} x2={d.x} y2={topOffset + PEAK_LABEL_H + CHART_H} stroke="#555" strokeWidth="1" />
          ) : null)}

          {/* Day/date labels — below time axis */}
          {daySpans.map((d, i) => (
            <text key={`daylbl-${i}`} x={d.x + 4} y={topOffset + PEAK_LABEL_H + CHART_H + TIME_AXIS_H + 12} fill="#aaa" fontSize="10" fontWeight="600">{d.label}</text>
          ))}

          <line x1={0} y1={topOffset + PEAK_LABEL_H + CHART_H} x2={chartW} y2={topOffset + PEAK_LABEL_H + CHART_H} stroke="#333333" strokeWidth="0.5" />

          {/* Area fill + curve */}
          <path d={areaPath} fill="url(#tideFill)" />
          <path d={splinePath} fill="none" stroke="#6e6e6e" strokeWidth="1.5" />

          {/* Peak labels */}
          {peaks.map((pk, i) => {
            const date = parseUTC(pk.time)
            const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            const isHigh = pk.type === 'high'
            const baseY = isHigh ? pk.y - 8 : pk.y + 14
            return (
              <g key={`pk-${i}`}>
                <text x={pk.x} y={baseY} fill="#d4d4d4" fontSize="9" fontWeight="600" textAnchor="middle">{timeStr}</text>
                <text x={pk.x} y={baseY + 11} fill="#858585" fontSize="8.5" textAnchor="middle">{pk.height.toFixed(1)}ft</text>
              </g>
            )
          })}

          {/* Hour ticks */}
          {hourTicks.map((tick, i) => (
            <g key={`tick-${i}`}>
              <line x1={tick.x} y1={topOffset + PEAK_LABEL_H + CHART_H} x2={tick.x} y2={topOffset + PEAK_LABEL_H + CHART_H + 4} stroke="#404040" strokeWidth="0.5" />
              <text x={tick.x} y={topOffset + PEAK_LABEL_H + CHART_H + 13} fill="#6e6e6e" fontSize="8" textAnchor="middle">{tick.label}</text>
            </g>
          ))}

          {/* Sun events */}
          {daySpans.map((span, i) => {
            const sun = sunData[i]?.sun
            if (!sun) return null
            const w = span.endX - span.x
            const sunY = topOffset + PEAK_LABEL_H + CHART_H + TIME_AXIS_H + DAY_LABEL_H
            const items = [
              { label: 'First light', time: sun.firstLight, dim: true },
              { label: 'Sunrise', time: sun.sunrise, dim: false },
              { label: 'Sunset', time: sun.sunset, dim: false },
              { label: 'Last light', time: sun.lastLight, dim: true },
            ]
            const slotW = w / items.length
            if (slotW < 24) return null
            return (
              <g key={`sun-row-${i}`}>
                <line x1={span.x} y1={sunY} x2={span.endX} y2={sunY} stroke="#333333" strokeWidth="0.5" />
                {items.map((evt, j) => {
                  const cx = span.x + slotW * j + slotW / 2
                  return (
                    <g key={`sun-${i}-${j}`} opacity={evt.dim ? 0.5 : 0.8}>
                      <text x={cx} y={sunY + 14} fill="#858585" fontSize="7" textAnchor="middle" fontWeight="500">{evt.label}</text>
                      <text x={cx} y={sunY + 24} fill="#d4d4d4" fontSize="7.5" textAnchor="middle" fontWeight="500">{evt.time}</text>
                    </g>
                  )
                })}
              </g>
            )
          })}

          {/* Hover crosshair + day/time pill */}
          {hovered && (
            <g>
              <line x1={hovered.x} y1={topOffset + PEAK_LABEL_H} x2={hovered.x} y2={topOffset + PEAK_LABEL_H + CHART_H} stroke="#d4d4d4" strokeWidth="1" opacity="0.4" />
              <circle cx={hovered.x} cy={hovered.y} r="5" fill="#858585" stroke="#121212" strokeWidth="2" />
              {/* Floating pill */}
              <rect x={hovered.x - 52} y={0} width={104} height={18} rx={9} fill="rgba(18,18,18,0.92)" stroke="#555" strokeWidth="0.5" />
              <text x={hovered.x} y={13} fill="#d4d4d4" fontSize="9" fontWeight="600" textAnchor="middle">
                {formatCrosshairTime(hovered.t.time)}
              </text>
            </g>
          )}
        </svg>
      </div>
      <CenterTimeIndicator containerRef={containerRef} sampled={sampled} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(i + 2, points.length - 1)]
    const tension = 0.3
    d += ` C ${p1.x + (p2.x - p0.x) * tension} ${p1.y + (p2.y - p0.y) * tension}, ${p2.x - (p3.x - p1.x) * tension} ${p2.y - (p3.y - p1.y) * tension}, ${p2.x} ${p2.y}`
  }
  return d
}

function findPeaks(points: Array<{ x: number; y: number; t: TidePoint }>): PeakLabel[] {
  const peaks: PeakLabel[] = []
  const minGap = 55
  for (let i = 2; i < points.length - 2; i++) {
    const curr = points[i].t.height
    const isHigh = curr > points[i - 1].t.height && curr > points[i + 1].t.height && curr >= points[i - 2].t.height && curr >= points[i + 2].t.height
    const isLow = curr < points[i - 1].t.height && curr < points[i + 1].t.height && curr <= points[i - 2].t.height && curr <= points[i + 2].t.height
    if ((isHigh || isLow) && (peaks.length === 0 || Math.abs(points[i].x - peaks[peaks.length - 1].x) > minGap)) {
      peaks.push({ x: points[i].x, y: points[i].y, time: points[i].t.time, height: curr, type: isHigh ? 'high' : 'low' })
    }
  }
  return peaks
}

function generateTideApprox(timeStr: string, lat: number): number {
  const t = new Date(timeStr).getTime() / 3600000
  const lunarPeriod = 12.42
  const springNeapPeriod = 14.77 * 24
  const meanLevel = 4.5
  const amplitude = 3.0 + 0.8 * Math.cos((2 * Math.PI * t) / springNeapPeriod)
  return meanLevel + amplitude * Math.cos((2 * Math.PI * t) / lunarPeriod + lat * 0.01)
}
