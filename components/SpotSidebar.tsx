'use client'

import { useState } from 'react'
import type { SurfBreak } from '@/lib/breaks'
import type { ForecastDataPoint } from '@/lib/forecast'
import { computeSurfRating, getRatingDot, getRatingLabel, surfHeightRange } from '@/lib/surfRating'

type StateKey = 'oregon' | 'nc'

const stateRegions: Record<StateKey, { label: string; ids: string[] }[]> = {
  oregon: [
    { label: 'North Coast', ids: ['cannon-beach', 'indian-beach', 'rockaway-beach'] },
    { label: 'North Central', ids: ['short-sands', 'manzanita', 'oceanside'] },
    { label: 'Central Coast', ids: ['pacific-city', 'lincoln-city', 'nelscott-reef'] },
    { label: 'Central South', ids: ['otter-rock', 'newport', 'florence'] },
    { label: 'South Coast', ids: ['coos-bay', 'bandon', 'gold-beach', 'brookings'] },
  ],
  nc: [
    { label: 'Crystal Coast', ids: ['atlantic-beach-nc', 'emerald-isle'] },
    { label: 'Onslow / Topsail', ids: ['onslow-beach', 'seaview-pier', 'jolly-roger-pier', 'surf-city-pier', 'topsail-beach'] },
    { label: 'Wrightsville Beach', ids: ['north-end-wrightsville', 'c-street', 'blockade-runner', 'south-end-wrightsville'] },
    { label: 'Outer Banks South', ids: ['ocracoke', 'hatteras-ferry-docks', 'cape-hatteras-lighthouse', 'north-buxton', 'frisco', 'avon-pier'] },
    { label: 'Outer Banks North', ids: ['rodanthe-pier', 's-turns'] },
  ],
}

const ncBreakIds = new Set(stateRegions.nc.flatMap((r) => r.ids))

interface Props {
  breaks: SurfBreak[]
  selectedId: string | null
  onSelect: (id: string) => void
  getForecast: (clusterId: string) => ForecastDataPoint | null
}

export function SpotSidebar({ breaks, selectedId, onSelect, getForecast }: Props) {
  const defaultState: StateKey = selectedId && ncBreakIds.has(selectedId) ? 'nc' : 'oregon'
  const [activeState, setActiveState] = useState<StateKey>(defaultState)

  const breakMap = new Map(breaks.map((b) => [b.id, b]))

  return (
    <nav className="flex h-full flex-col overflow-y-auto bg-sl-dark">
      <div className="sticky top-0 z-10 border-b border-sl-border bg-sl-dark">
        <div className="flex">
          {(['oregon', 'nc'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveState(key)}
              className={`flex-1 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-colors border-b-2 ${
                activeState === key
                  ? 'border-sl-accent text-white'
                  : 'border-transparent text-sl-muted hover:text-white'
              }`}
            >
              {key === 'oregon' ? 'Oregon' : 'North Carolina'}
            </button>
          ))}
        </div>
      </div>
      {stateRegions[activeState].map((region) => (
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
