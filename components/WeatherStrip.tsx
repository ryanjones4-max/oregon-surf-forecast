'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import type { ForecastDataPoint } from '@/lib/forecast'
import { celsiusToFahrenheit } from '@/lib/surfRating'
import { getWeatherEmoji } from '@/lib/weatherCodes'
import { useSharedCrosshair } from './ChartCrosshair'

interface Props {
  hours: ForecastDataPoint[]
}

function resolveHoverIdx(sampled: ForecastDataPoint[], hoverTime: string | null): number | null {
  if (!hoverTime || sampled.length === 0) return null
  const target = new Date(hoverTime).getTime()
  let best = 0
  let bestDiff = Infinity
  for (let i = 0; i < sampled.length; i++) {
    const diff = Math.abs(new Date(sampled[i].time).getTime() - target)
    if (diff < bestDiff) { bestDiff = diff; best = i }
  }
  return best
}

export function WeatherStrip({ hours }: Props) {
  const containerRef = useRef<HTMLDivElement>(null!)
  const [containerW, setContainerW] = useState(0)
  const { hoverTime, setHoverTime } = useSharedCrosshair()

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerW(entry.contentRect.width)
    })
    ro.observe(el)
    setContainerW(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  if (hours.length === 0) return null

  const sampled = hours.filter((_, i) => i % 3 === 0)
  const hoverIdx = resolveHoverIdx(sampled, hoverTime)

  const colW = containerW > 0 ? containerW / sampled.length : 52
  const needsScroll = containerW > 0 && colW < 40
  const effectiveColW = needsScroll ? 40 : colW
  const totalW = needsScroll ? sampled.length * effectiveColW : containerW

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
    const scrollEl = container.querySelector('[data-weather-cols]') as HTMLElement | null
    const targetEl = scrollEl ?? container
    const rect = targetEl.getBoundingClientRect()
    const x = e.clientX - rect.left + (scrollEl?.parentElement?.scrollLeft ?? 0)
    const idx = Math.floor(x / effectiveColW)
    const clamped = Math.max(0, Math.min(idx, sampled.length - 1))
    setHoverTime(sampled[clamped].time)
  }, [effectiveColW, sampled, setHoverTime])

  const handlePointerLeave = useCallback(() => {
    setHoverTime(null)
  }, [setHoverTime])

  return (
    <div className="rounded-lg border border-sl-border bg-sl-card p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-sl-muted">
        Weather <span className="font-normal text-sl-muted/50">(°f)</span>
      </h3>
      <div
        ref={containerRef}
        className={needsScroll ? 'overflow-x-auto touch-pan-x' : 'w-full'}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {containerW > 0 && (
          <div style={{ width: needsScroll ? totalW : '100%' }}>
            {/* Date header row */}
            <div className="relative flex mb-1.5">
              {daySpans.map((span, i) => {
                const spanCols = span.endIdx - span.startIdx
                return (
                  <div
                    key={`day-${i}`}
                    className="text-center"
                    style={{
                      width: spanCols * effectiveColW,
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
                const timeLabel = hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`
                const tempF = h.airTemperature != null ? Math.round(celsiusToFahrenheit(h.airTemperature)) : null
                const emoji = h.weatherCode != null ? getWeatherEmoji(h.weatherCode) : null

                return (
                  <div
                    key={i}
                    className="flex flex-col items-center transition-colors"
                    style={{
                      width: effectiveColW,
                      flexShrink: 0,
                      borderLeft: isDayBoundary ? '1px solid #333333' : 'none',
                      backgroundColor: isHov ? 'rgba(212,212,212,0.08)' : 'transparent',
                      borderRadius: isHov ? '4px' : '0',
                    }}
                  >
                    <span className="text-[9px] text-sl-muted tabular-nums">{timeLabel}</span>
                    <span className="my-1.5 text-base leading-none">{emoji ?? '—'}</span>
                    <span className="text-xs font-semibold text-white tabular-nums">
                      {tempF != null ? `${tempF}°` : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
