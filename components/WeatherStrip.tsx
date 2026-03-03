'use client'

import { useRef, useCallback } from 'react'
import type { ForecastDataPoint } from '@/lib/forecast'
import { celsiusToFahrenheit } from '@/lib/surfRating'
import { getWeatherEmoji } from '@/lib/weatherCodes'
import { useSharedCrosshair, resolveHoverIdx, PX_PER_STEP } from './ChartCrosshair'

interface Props {
  hours: ForecastDataPoint[]
}

export function WeatherStrip({ hours }: Props) {
  const containerRef = useRef<HTMLDivElement>(null!)
  const { hoverTime, setHoverTime } = useSharedCrosshair()

  if (hours.length === 0) return null

  const sampled = hours.filter((_, i) => i % 3 === 0)
  const hoverIdx = resolveHoverIdx(sampled, hoverTime)

  const colW = PX_PER_STEP
  const totalW = sampled.length * colW

  let lastDay = ''
  const dayBoundaries: number[] = []
  const daySpans: Array<{ startIdx: number; endIdx: number; label: string }> = []
  sampled.forEach((h, i) => {
    const d = h.time.slice(0, 10)
    if (d !== lastDay) {
      lastDay = d
      if (i > 0) dayBoundaries.push(i)
      if (daySpans.length > 0) daySpans[daySpans.length - 1].endIdx = i
      const date = new Date(h.time)
      daySpans.push({
        startIdx: i,
        endIdx: sampled.length,
        label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      })
    }
  })

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current
    if (!container) return
    const inner = container.querySelector('[data-weather-cols]') as HTMLElement | null
    const el = inner ?? container
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left + container.scrollLeft
    const idx = Math.floor(x / colW)
    const clamped = Math.max(0, Math.min(idx, sampled.length - 1))
    setHoverTime(sampled[clamped].time)
  }, [colW, sampled, setHoverTime])

  const handlePointerLeave = useCallback(() => { setHoverTime(null) }, [setHoverTime])

  return (
    <div className="rounded-lg border border-sl-border bg-sl-card p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-sl-muted">
        Weather <span className="font-normal text-sl-muted/50">(°f)</span>
      </h3>
      <div
        ref={containerRef}
        className="overflow-x-auto touch-pan-x"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <div style={{ width: totalW }}>
          {/* Date header row */}
          <div className="relative flex mb-1.5">
            {daySpans.map((span, i) => {
              const spanCols = span.endIdx - span.startIdx
              return (
                <div
                  key={`day-${i}`}
                  className="text-center"
                  style={{
                    width: spanCols * colW,
                    flexShrink: 0,
                    borderLeft: i > 0 ? '1px solid #333333' : 'none',
                  }}
                >
                  <span className="text-[10px] font-semibold text-sl-muted/80">{span.label}</span>
                </div>
              )
            })}
          </div>

          {/* Time / icon / temp columns */}
          <div className="relative flex" data-weather-cols>
            {sampled.map((h, i) => {
              const isDayBoundary = dayBoundaries.includes(i)
              const isHov = hoverIdx === i
              const date = new Date(h.time)
              const hour = date.getHours()
              const timeLabel = hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`
              const tempF = h.airTemperature != null ? Math.round(celsiusToFahrenheit(h.airTemperature)) : null
              const emoji = h.weatherCode != null ? getWeatherEmoji(h.weatherCode) : null

              return (
                <div
                  key={i}
                  className="flex flex-col items-center"
                  style={{
                    width: colW,
                    flexShrink: 0,
                    borderLeft: isDayBoundary ? '1px solid #333333' : 'none',
                    backgroundColor: isHov ? 'rgba(212,212,212,0.08)' : 'transparent',
                    borderRadius: isHov ? '4px' : '0',
                  }}
                >
                  <span className="text-[7px] text-sl-muted tabular-nums leading-tight">{timeLabel}</span>
                  <span className="text-xs leading-none">{emoji ?? '—'}</span>
                  <span className="text-[8px] font-semibold text-white tabular-nums leading-tight">
                    {tempF != null ? `${tempF}°` : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
