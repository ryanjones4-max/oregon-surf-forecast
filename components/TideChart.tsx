'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { calculateSunTimes } from '@/lib/sun'
import { useSharedCrosshair, PX_PER_STEP } from './ChartCrosshair'

interface TidePoint {
  time: string
  height: number
}

interface Props {
  lat: number
  lng: number
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
const TIME_AXIS_H = 18
const SUN_ROW_H = 38
const FORECAST_DAYS = 10

export function TideChart({ lat, lng }: Props) {
  const [tideData, setTideData] = useState<TidePoint[]>([])
  const [loading, setLoading] = useState(true)
  const { hoverTime, setHoverTime } = useSharedCrosshair()
  const containerRef = useRef<HTMLDivElement>(null!)

  useEffect(() => {
    setTideData(generateSyntheticTides(FORECAST_DAYS, lat))
    setLoading(false)
  }, [lat, lng])

  const sunData = useMemo(() => {
    const days: Array<{ date: Date; sun: ReturnType<typeof calculateSunTimes> }> = []
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    for (let d = 0; d < FORECAST_DAYS; d++) {
      const date = new Date(start.getTime() + d * 86400000)
      days.push({ date, sun: calculateSunTimes(lat, lng, date) })
    }
    return days
  }, [lat, lng])

  const sampled3h = useMemo(() => {
    if (tideData.length === 0) return []
    return tideData.filter((_, i) => i % 3 === 0)
  }, [tideData])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current
    if (!container) return
    const svg = container.querySelector('svg')
    if (!svg) return
    const svgRect = svg.getBoundingClientRect()
    const x = e.clientX - svgRect.left + container.scrollLeft
    if (sampled3h.length < 2) return
    const idx = Math.round(x / PX_PER_STEP)
    const clamped = Math.max(0, Math.min(idx, sampled3h.length - 1))
    setHoverTime(sampled3h[clamped].time)
  }, [sampled3h, setHoverTime])

  const handlePointerLeave = useCallback(() => { setHoverTime(null) }, [setHoverTime])

  if (loading) {
    return (
      <div className="rounded-lg border border-sl-border bg-sl-card p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-sl-muted">Tides</h3>
        <div className="flex h-[140px] items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-sl-accent border-t-transparent" />
        </div>
      </div>
    )
  }

  if (sampled3h.length === 0) return null

  const step = PX_PER_STEP
  const chartW = sampled3h.length * step
  const totalH = PEAK_LABEL_H + CHART_H + TIME_AXIS_H + SUN_ROW_H

  const heights = sampled3h.map((t) => t.height)
  const maxH = Math.max(...heights)
  const minH = Math.min(...heights)
  const range = maxH - minH || 1

  const points = sampled3h.map((t, i) => ({
    x: i * step + step / 2,
    y: PEAK_LABEL_H + CHART_H - ((t.height - minH) / range) * (CHART_H - 10),
    t,
  }))

  const splinePath = buildSmoothPath(points)
  const areaPath = `${splinePath} L ${points[points.length - 1].x} ${PEAK_LABEL_H + CHART_H} L ${points[0].x} ${PEAK_LABEL_H + CHART_H} Z`
  const peaks = findPeaks(points)

  const now = new Date()
  const startMs = new Date(sampled3h[0].time).getTime()
  const endMs = new Date(sampled3h[sampled3h.length - 1].time).getTime()
  const nowFrac = (now.getTime() - startMs) / (endMs - startMs)
  const nowX = nowFrac >= 0 && nowFrac <= 1 ? nowFrac * chartW : -1

  const daySpans: Array<{ x: number; endX: number; dayIdx: number }> = []
  let lastDay = ''
  let currentSpan: typeof daySpans[0] | null = null
  points.forEach((p) => {
    const d = p.t.time.slice(0, 10)
    if (d !== lastDay) {
      lastDay = d
      if (currentSpan) currentSpan.endX = p.x - step / 2
      currentSpan = { x: p.x - step / 2, endX: chartW, dayIdx: daySpans.length }
      daySpans.push(currentSpan)
    }
  })

  const hourTicks: Array<{ x: number; label: string }> = []
  sampled3h.forEach((t, i) => {
    const date = new Date(t.time)
    const h = date.getHours()
    if (h % 6 === 0 && h !== 0) {
      const label = h > 12 ? String(h - 12) : String(h)
      hourTicks.push({ x: points[i].x, label })
    }
  })

  const hoveredIdx = hoverTime ? findClosestIdx(sampled3h, hoverTime) : null
  const hovered = hoveredIdx != null ? points[hoveredIdx] : null

  return (
    <div className="rounded-lg border border-sl-border bg-sl-card p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-sl-muted">
        Tides <span className="font-normal text-sl-muted/50">(ft)</span>
      </h3>
      <div
        ref={containerRef}
        className="overflow-x-auto touch-pan-x"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <svg width={chartW} height={totalH} className="select-none">
          <defs>
            <linearGradient id="tideFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#858585" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#858585" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {/* Day dividers */}
          {daySpans.map((d, i) => i > 0 && (
            <line key={`div-${i}`} x1={d.x} y1={PEAK_LABEL_H} x2={d.x} y2={PEAK_LABEL_H + CHART_H} stroke="#333333" strokeWidth="0.5" />
          ))}

          <line x1={0} y1={PEAK_LABEL_H + CHART_H} x2={chartW} y2={PEAK_LABEL_H + CHART_H} stroke="#333333" strokeWidth="0.5" />

          {/* Area fill + curve */}
          <path d={areaPath} fill="url(#tideFill)" />
          <path d={splinePath} fill="none" stroke="#6e6e6e" strokeWidth="1.5" />

          {/* Now indicator */}
          {nowX > 0 && (
            <line x1={nowX} y1={PEAK_LABEL_H} x2={nowX} y2={PEAK_LABEL_H + CHART_H} stroke="#ef4444" strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />
          )}

          {/* Peak labels */}
          {peaks.map((pk, i) => {
            const date = new Date(pk.time)
            const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' })
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
              <line x1={tick.x} y1={PEAK_LABEL_H + CHART_H} x2={tick.x} y2={PEAK_LABEL_H + CHART_H + 4} stroke="#404040" strokeWidth="0.5" />
              <text x={tick.x} y={PEAK_LABEL_H + CHART_H + 13} fill="#6e6e6e" fontSize="8" textAnchor="middle">{tick.label}</text>
            </g>
          ))}

          {/* Sun events */}
          {daySpans.map((span, i) => {
            const sun = sunData[i]?.sun
            if (!sun) return null
            const w = span.endX - span.x
            const sunY = PEAK_LABEL_H + CHART_H + TIME_AXIS_H
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

          {/* Hover crosshair */}
          {hovered && (
            <g>
              <line x1={hovered.x} y1={PEAK_LABEL_H} x2={hovered.x} y2={PEAK_LABEL_H + CHART_H} stroke="#d4d4d4" strokeWidth="1" opacity="0.3" />
              <circle cx={hovered.x} cy={hovered.y} r="4" fill="#858585" stroke="#121212" strokeWidth="2" />
              <foreignObject x={hovered.x + 8} y={PEAK_LABEL_H + 4} width="130" height="50" overflow="visible">
                <div style={{ background: 'rgba(18,18,18,0.95)', border: '1px solid rgba(51,51,51,0.8)', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', lineHeight: '1.5', color: '#d4d4d4', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                  <div style={{ fontWeight: 600 }}>{hovered.t.height.toFixed(2)} ft</div>
                  <div style={{ color: '#858585', fontSize: '10px' }}>
                    {new Date(hovered.t.time).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' })}
                  </div>
                </div>
              </foreignObject>
            </g>
          )}
        </svg>
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

function findClosestIdx(sampled: TidePoint[], targetTime: string): number {
  const targetMs = new Date(targetTime).getTime()
  let best = 0
  let bestDiff = Infinity
  for (let i = 0; i < sampled.length; i++) {
    const diff = Math.abs(new Date(sampled[i].time).getTime() - targetMs)
    if (diff < bestDiff) { bestDiff = diff; best = i }
  }
  return best
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

function generateSyntheticTides(days: number, lat: number): TidePoint[] {
  const points: TidePoint[] = []
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  for (let h = 0; h < days * 24; h++) {
    const t = new Date(start.getTime() + h * 3600000)
    points.push({ time: t.toISOString(), height: generateTideApprox(t.toISOString(), lat) })
  }
  return points
}
