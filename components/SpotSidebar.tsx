'use client'

import type { SurfBreak } from '@/lib/breaks'
import type { ForecastDataPoint } from '@/lib/forecast'
import { computeSurfRating, getRatingDot, getRatingLabel, surfHeightRange } from '@/lib/surfRating'

interface Props {
  breaks: SurfBreak[]
  selectedId: string | null
  onSelect: (id: string) => void
  getForecast: (clusterId: string) => ForecastDataPoint | null
}

export function SpotSidebar({ breaks, selectedId, onSelect, getForecast }: Props) {
  const regions = [
    { label: 'North Coast', ids: ['cannon-beach', 'indian-beach', 'rockaway-beach'] },
    { label: 'North Central', ids: ['short-sands', 'manzanita', 'oceanside'] },
    { label: 'Central Coast', ids: ['pacific-city', 'lincoln-city', 'nelscott-reef'] },
    { label: 'Central South', ids: ['otter-rock', 'newport', 'florence'] },
    { label: 'South Coast', ids: ['coos-bay', 'bandon', 'gold-beach', 'brookings'] },
  ]

  const breakMap = new Map(breaks.map((b) => [b.id, b]))

  return (
    <nav className="flex h-full flex-col overflow-y-auto bg-sl-dark">
      <div className="sticky top-0 z-10 border-b border-sl-border bg-sl-dark px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-sl-muted">Oregon Breaks</h2>
      </div>
      {regions.map((region) => (
        <div key={region.label}>
          <div className="px-4 pt-3 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-sl-muted/60">{region.label}</span>
          </div>
          {region.ids.map((id) => {
            const b = breakMap.get(id)
            if (!b) return null
            const fc = getForecast(b.clusterId)
            const rating = fc ? computeSurfRating(fc) : null
            const range = fc ? surfHeightRange(fc.waveHeight, fc.swellPeriod) : null

            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  selectedId === id
                    ? 'bg-sl-accent/15 text-white'
                    : 'text-sl-text/80 hover:bg-sl-surface hover:text-white'
                }`}
              >
                {rating && (
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: getRatingDot(rating) }}
                    title={getRatingLabel(rating)}
                  />
                )}
                {!rating && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-sl-border" />}
                <span className="flex-1 truncate text-sm font-medium">{b.name}</span>
                {range && (
                  <span className="text-xs tabular-nums text-sl-muted">{range.lo}-{range.hi} ft</span>
                )}
              </button>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
