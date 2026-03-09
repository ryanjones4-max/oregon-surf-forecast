'use client'

import { useCallback } from 'react'
import type { ForecastDataPoint } from '@/lib/forecast'
import { celsiusToFahrenheit } from '@/lib/surfRating'
import { getWeatherEmoji } from '@/lib/weatherCodes'
import { useSharedCrosshair, useSyncedScroll, useChartInteraction, resolveHoverIdx, PX_PER_STEP, formatCrosshairTime, DAY_LABEL_FORMAT, parseUTC } from './ChartCrosshair'

interface Props {
  hours: ForecastDataPoint[]
}

export function WeatherStrip({ hours }: Props) {
  const { containerRef, onScroll } = useSyncedScroll()
  const { hoverTime, inspecting } = useSharedCrosshair()

  const resolveTime = useCallback((clientX: number, scrollLeft: number) => {
    const el = containerRef.current
    if (!el || hours.length === 0) return null
    const inner = el.querySelector('[data-weather-cols]') as HTMLElement | null
    const target = inner ?? el
    const rect = target.getBoundingClientRect()
    const x = clientX - rect.left + scrollLeft
    const sampled = hours.filter((_, i) => i % 3 === 0)
    const idx = Math.floor(x / PX_PER_STEP)
    const clamped = Math.max(0, Math.min(idx, sampled.length - 1))
    return sampled[clamped]?.time ?? null
  }, [hours, containerRef])

  const interaction = useChartInteraction(resolveTime, containerRef)

  if (hours.length === 0) return null

  const sampled = hours.filter((_, i) => i % 3 === 0)
  const hoverIdx = resolveHoverIdx(sampled, hoverTime)
  const hoveredSample = hoverIdx != null ? sampled[hoverIdx] : null

  const colW = PX_PER_STEP
  const totalW = sampled.length * colW

  let lastDay = ''
  const dayBoundaries: number[] = []
  const daySpans: Array<{ startIdx: number; endIdx: number; label: string; dayIdx: number }> = []
  sampled.forEach((h, i) => {
    const d = h.time.slice(0, 10)
    if (d !== lastDay) {
      lastDay = d
      if (i > 0) dayBoundaries.push(i)
      if (daySpans.length > 0) daySpans[daySpans.length - 1].endIdx = i
      const date = parseUTC(h.time)
      daySpans.push({
        startIdx: i,
        endIdx: sampled.length,
        label: date.toLocaleDateString('en-US', DAY_LABEL_FORMAT),
        dayIdx: daySpans.length,
      })
    }
  })

  return (
    <div className="rounded-lg border border-sl-border bg-sl-card p-4">
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-sl-muted">
          Weather <span className="font-normal text-sl-muted/50">(°f)</span>
        </h3>
        {hoveredSample && (
          <div className="text-right">
            <div className="text-xs font-medium text-white/70">
              {formatCrosshairTime(hoveredSample.time)}
            </div>
            <div className="mt-0.5 text-base font-bold text-white tabular-nums">
              {hoveredSample.airTemperature != null ? `${Math.round(celsiusToFahrenheit(hoveredSample.airTemperature))}°F` : '—'}
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
                    borderLeft: i > 0 ? '1px solid #555' : 'none',
                    backgroundColor: span.dayIdx % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  }}
                >
                  <span className="text-[11px] font-semibold text-sl-muted">{span.label}</span>
                </div>
              )
            })}
          </div>

          {/* Time / icon / temp columns */}
          <div className="relative flex" data-weather-cols>
            {sampled.map((h, i) => {
              const isDayBoundary = dayBoundaries.includes(i)
              const isHov = hoverIdx === i
              const date = parseUTC(h.time)
              const hour = date.getHours()
              const timeLabel = hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`
              const tempF = h.airTemperature != null ? Math.round(celsiusToFahrenheit(h.airTemperature)) : null
              const emoji = h.weatherCode != null ? getWeatherEmoji(h.weatherCode) : null

              const spanInfo = daySpans.find(s => i >= s.startIdx && i < s.endIdx)
              const isOddDay = spanInfo ? spanInfo.dayIdx % 2 === 1 : false

              return (
                <div
                  key={i}
                  className="flex flex-col items-center"
                  style={{
                    width: colW,
                    flexShrink: 0,
                    borderLeft: isDayBoundary ? '1px solid #555' : 'none',
                    backgroundColor: isHov ? 'rgba(212,212,212,0.12)' : isOddDay ? 'rgba(255,255,255,0.02)' : 'transparent',
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
