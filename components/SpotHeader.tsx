'use client'

import Link from 'next/link'
import type { SurfBreak } from '@/lib/breaks'
import type { ForecastDataPoint } from '@/lib/forecast'
import { computeSurfRating, getRatingBg, getRatingLabel, surfHeightRange } from '@/lib/surfRating'

interface Props {
  spot: SurfBreak
  forecast: ForecastDataPoint | null
  activeTab: 'report' | 'guide'
  onTabChange: (tab: 'report' | 'guide') => void
}

const levelColors: Record<string, string> = {
  beginner: 'bg-green-600/20 text-green-400',
  intermediate: 'bg-yellow-600/20 text-yellow-400',
  advanced: 'bg-red-600/20 text-red-400',
  mixed: 'bg-purple-600/20 text-purple-400',
  all: 'bg-blue-600/20 text-blue-400',
}

export function SpotHeader({ spot, forecast, activeTab, onTabChange }: Props) {
  const rating = forecast
    ? computeSurfRating(forecast)
    : null
  const range = forecast ? surfHeightRange(forecast.waveHeight, forecast.swellPeriod) : null

  return (
    <header className="border-b border-sl-border bg-sl-dark">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        {/* Top row */}
        <div className="flex items-center gap-2 py-2 text-xs text-sl-muted">
          <Link href="/" className="hover:text-white transition-colors">Oregon Coast</Link>
          <span>/</span>
          <span className="text-sl-text">{spot.name}</span>
        </div>

        {/* Main header */}
        <div className="flex flex-wrap items-center gap-4 pb-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white lg:text-3xl">{spot.name}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${levelColors[spot.level] ?? levelColors.all}`}>
              {spot.level}
            </span>
          </div>

          {rating && range && (
            <div className="flex items-center gap-3 ml-auto">
              <div className={`${getRatingBg(rating)} flex items-center gap-2 rounded-lg px-4 py-2`}>
                <span className="text-lg font-bold text-white">{getRatingLabel(rating)}</span>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold tabular-nums text-white">{range.lo}-{range.hi} ft</div>
                <div className="text-[10px] uppercase tracking-wider text-sl-muted">Surf Height</div>
              </div>
            </div>
          )}
        </div>

        {/* Tab navigation */}
        <nav className="-ml-3 flex gap-0 -mb-px">
          {(['report', 'guide'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`px-3 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-sl-accent text-white'
                  : 'border-transparent text-sl-muted hover:text-white hover:border-sl-border'
              }`}
            >
              {tab === 'report' ? 'Report & Forecast' : 'Surf Guide'}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
