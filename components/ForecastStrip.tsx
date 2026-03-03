'use client'

import type { ForecastDataPoint } from '@/lib/forecast'
import { metersToFeet, computeSurfRating, getRatingDot, estimateBreakingHeight } from '@/lib/surfRating'

interface Props {
  hours: ForecastDataPoint[]
  selectedDay: number
  onSelectDay: (idx: number) => void
}

interface DaySummary {
  dateLabel: string
  dayName: string
  maxHeight: number
  minHeight: number
  rating: ReturnType<typeof computeSurfRating>
  samples: ForecastDataPoint[]
}

function groupByDay(hours: ForecastDataPoint[]): DaySummary[] {
  const map = new Map<string, ForecastDataPoint[]>()
  for (const h of hours) {
    const d = h.time.slice(0, 10)
    if (!map.has(d)) map.set(d, [])
    map.get(d)!.push(h)
  }
  return Array.from(map.entries()).map(([, samples]) => {
    const sorted = samples.sort((a, b) => a.time.localeCompare(b.time))
    const heights = sorted.map((s) => metersToFeet(estimateBreakingHeight(s.waveHeight, s.swellPeriod)))
    const maxH = Math.max(...heights)
    const minH = Math.min(...heights)
    const mid = sorted[Math.floor(sorted.length / 2)]
    const d = new Date(sorted[0].time)
    return {
      dateLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      maxHeight: maxH,
      minHeight: minH,
      rating: computeSurfRating(mid),
      samples: sorted,
    }
  })
}

export function ForecastStrip({ hours, selectedDay, onSelectDay }: Props) {
  const days = groupByDay(hours)
  const globalMax = Math.max(...days.map((d) => d.maxHeight), 1)

  return (
    <div className="overflow-x-auto border-b border-sl-border bg-sl-dark">
      <div className="flex min-w-max px-4 lg:px-6">
        {days.map((day, i) => {
          const barHeight = Math.max(8, (day.maxHeight / globalMax) * 48)
          const isSelected = i === selectedDay
          return (
            <button
              key={day.dateLabel}
              type="button"
              onClick={() => onSelectDay(i)}
              className={`flex w-[72px] shrink-0 flex-col items-center gap-1 border-b-2 px-1 pb-2 pt-3 transition-colors ${
                isSelected
                  ? 'border-sl-accent bg-sl-surface'
                  : 'border-transparent hover:bg-sl-surface/50'
              }`}
            >
              <span className="text-[10px] font-medium text-sl-muted">{day.dayName}</span>
              <span className="text-[10px] text-sl-muted/60">{day.dateLabel}</span>
              <div className="mt-1 flex items-end justify-center" style={{ height: 50 }}>
                <div
                  className="w-5 rounded-t"
                  style={{
                    height: barHeight,
                    backgroundColor: getRatingDot(day.rating),
                    opacity: isSelected ? 1 : 0.7,
                  }}
                />
              </div>
              <span className="text-xs font-semibold text-white tabular-nums">
                {day.minHeight.toFixed(0)}-{day.maxHeight.toFixed(0)}
              </span>
              <span className="text-[9px] text-sl-muted">ft</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { groupByDay, type DaySummary }
