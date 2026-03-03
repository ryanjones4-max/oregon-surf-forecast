'use client'

import { useRef, useEffect, useState } from 'react'
import type { ForecastDataPoint } from '@/lib/forecast'
import { celsiusToFahrenheit } from '@/lib/surfRating'
import { getWeatherEmoji } from '@/lib/weatherCodes'

interface Props {
  hours: ForecastDataPoint[]
}

export function WeatherStrip({ hours }: Props) {
  const containerRef = useRef<HTMLDivElement>(null!)
  const [containerW, setContainerW] = useState(0)

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

  return (
    <div className="rounded-lg border border-sl-border bg-sl-card p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-sl-muted">
        Weather <span className="font-normal text-sl-muted/50">(°f)</span>
      </h3>
      <div
        ref={containerRef}
        className={needsScroll ? 'overflow-x-auto touch-pan-x' : 'w-full'}
      >
        {containerW > 0 && (
          <div style={{ width: needsScroll ? totalW : '100%' }}>
            {/* Date header row — one label centered per day */}
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
            <div className="relative flex">
              {sampled.map((h, i) => {
                const isDayBoundary = dayBoundaries.includes(i)
                const date = new Date(h.time)
                const hour = date.getHours()
                const timeLabel = hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`
                const tempF = h.airTemperature != null ? Math.round(celsiusToFahrenheit(h.airTemperature)) : null
                const emoji = h.weatherCode != null ? getWeatherEmoji(h.weatherCode) : null

                return (
                  <div
                    key={i}
                    className="flex flex-col items-center"
                    style={{
                      width: effectiveColW,
                      flexShrink: 0,
                      borderLeft: isDayBoundary ? '1px solid #333333' : 'none',
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
