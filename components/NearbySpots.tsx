'use client'

import Link from 'next/link'
import type { SurfBreak } from '@/lib/breaks'
import type { ForecastDataPoint } from '@/lib/forecast'
import { computeSurfRating, getRatingDot, getRatingLabel, surfHeightRange } from '@/lib/surfRating'

interface Props {
  spots: SurfBreak[]
  getForecast: (clusterId: string) => ForecastDataPoint | null
}

export function NearbySpots({ spots, getForecast }: Props) {
  if (spots.length === 0) return null

  return (
    <div className="rounded-lg border border-sl-border bg-sl-card p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-sl-muted">Nearby Spots</h3>
      <div className="space-y-1">
        {spots.map((spot) => {
          const fc = getForecast(spot.clusterId)
          const rating = fc
            ? computeSurfRating(fc)
            : null
          const range = fc ? surfHeightRange(fc.waveHeight, fc.swellPeriod) : null

          return (
            <Link
              key={spot.id}
              href={`/surf-report/${spot.id}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-sl-surface"
            >
              {rating ? (
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: getRatingDot(rating) }}
                  title={getRatingLabel(rating)}
                />
              ) : (
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-sl-border" />
              )}
              <span className="flex-1 truncate text-sm font-medium text-sl-text">{spot.name}</span>
              {range && (
                <span className="text-xs tabular-nums text-sl-muted">
                  {range.lo}-{range.hi} ft
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
