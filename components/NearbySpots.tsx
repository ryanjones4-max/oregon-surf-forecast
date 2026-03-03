'use client'

import Link from 'next/link'
import type { SurfBreak } from '@/lib/breaks'
import type { ForecastDataPoint } from '@/lib/forecast'
import { metersToFeet, computeSurfRating, getRatingDot, getRatingLabel } from '@/lib/surfRating'

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
            ? computeSurfRating({ waveHeight: fc.waveHeight, swellPeriod: fc.swellPeriod, windSpeed: fc.windSpeed })
            : null
          const ft = fc ? metersToFeet(fc.waveHeight) : null

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
              {ft != null && (
                <span className="text-xs tabular-nums text-sl-muted">
                  {ft.toFixed(0)}-{(ft * 1.3).toFixed(0)} ft
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
