'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { breaks } from '@/lib/breaks'
import {
  getCachedForecast,
  setCachedForecast,
  minutesUntilCacheExpiry,
  type CachedForecast,
} from '@/lib/cache'
import type { ForecastDataPoint } from '@/lib/forecast'
import { metersToFeet, computeSurfRating, getRatingDot, getRatingBg, getRatingLabel, kmhToMph, degreesToCompass, surfHeightRange } from '@/lib/surfRating'
import { getWeatherEmoji } from '@/lib/weatherCodes'

function findClosestHour(hours: ForecastDataPoint[]): ForecastDataPoint | null {
  if (!hours.length) return null
  const now = Date.now()
  let best = hours[0]
  let bestDiff = Infinity
  for (const h of hours) {
    const diff = Math.abs(new Date(h.time).getTime() - now)
    if (diff < bestDiff) { bestDiff = diff; best = h }
  }
  return best
}

type StateKey = 'oregon' | 'nc'

const stateTabs: { key: StateKey; label: string }[] = [
  { key: 'oregon', label: 'Oregon' },
  { key: 'nc', label: 'North Carolina' },
]

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

const breakMap = new Map(breaks.map((b) => [b.id, b]))

const levelColors: Record<string, string> = {
  beginner: 'bg-green-600/20 text-green-400 border-green-700/30',
  intermediate: 'bg-yellow-600/20 text-yellow-400 border-yellow-700/30',
  advanced: 'bg-red-600/20 text-red-400 border-red-700/30',
  mixed: 'bg-purple-600/20 text-purple-400 border-purple-700/30',
  all: 'bg-blue-600/20 text-blue-400 border-blue-700/30',
}

export default function Home() {
  const [activeState, setActiveState] = useState<StateKey>('oregon')
  const [cache, setCache] = useState<CachedForecast | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadForecast = useCallback(async () => {
    const cached = getCachedForecast()
    if (cached) {
      setCache(cached)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/forecast')
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Failed to load forecast')
        setLoading(false)
        return
      }
      const forecast: CachedForecast = { clusterForecasts: data.clusterForecasts, fetchedAt: data.fetchedAt }
      setCachedForecast(forecast)
      setCache(forecast)
    } catch {
      setError('Failed to load forecast. Check your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadForecast() }, [loadForecast])

  const getForecast = (clusterId: string): ForecastDataPoint | null => {
    const cf = cache?.clusterForecasts[clusterId]
    if (!cf?.hours?.length) return null
    return findClosestHour(cf.hours)
  }

  return (
    <div className="min-h-screen bg-sl-bg">
      {/* Hero header */}
      <header className="border-b border-sl-border bg-sl-dark">
        <div className="mx-auto max-w-7xl px-4 pt-8 lg:px-6 lg:pt-12">
          <h1 className="text-3xl font-bold text-white lg:text-4xl">Swellcast Surf Report</h1>
          <p className="mt-2 max-w-xl text-sm text-sl-muted">
            Real-time surf reports for breaks on the Oregon and North Carolina coasts.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-sl-muted">
            {cache?.fetchedAt && (
              <span className="rounded-full bg-sl-surface px-3 py-1 border border-sl-border">
                Updated {new Date(cache.fetchedAt).toLocaleTimeString()}
              </span>
            )}
            {cache && (
              <span className="rounded-full bg-sl-surface px-3 py-1 border border-sl-border">
                Refreshes in {minutesUntilCacheExpiry()} min
              </span>
            )}
            <span className="rounded-full bg-sl-surface px-3 py-1 border border-sl-border">
              {breaks.length} breaks
            </span>
          </div>

          {/* State tabs */}
          <nav className="mt-6 -mb-px flex gap-0">
            {stateTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveState(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                  activeState === tab.key
                    ? 'border-sl-accent text-white'
                    : 'border-transparent text-sl-muted hover:text-white hover:border-sl-border'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Loading */}
      {loading && !cache && (
        <div className="flex h-64 items-center justify-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-sl-accent border-t-transparent" />
          <span className="text-sm text-sl-muted">Loading forecast data for all breaks...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <div className="rounded-lg border border-rating-fair/30 bg-rating-fair/10 px-4 py-3 text-sm text-rating-fair">
            {error}
          </div>
        </div>
      )}

      {/* Regions */}
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        {stateRegions[activeState].map((region) => (
          <div key={region.label} className="mb-8">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-sl-muted/60">{region.label}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {region.ids.map((id) => {
                const b = breakMap.get(id)
                if (!b) return null
                const fc = getForecast(b.clusterId)
                const rating = fc ? computeSurfRating(fc) : null
                const range = fc ? surfHeightRange(fc.waveHeight, fc.swellPeriod) : null

                return (
                  <Link
                    key={id}
                    href={`/surf-report/${id}`}
                    className="group flex flex-col rounded-xl border border-sl-border bg-sl-card p-4 transition-all hover:border-sl-accent/40 hover:bg-sl-surface hover:shadow-lg hover:shadow-sl-accent/5"
                  >
                    {/* Top row: name + rating badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-sl-accent transition-colors">{b.name}</h3>
                        <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${levelColors[b.level] ?? levelColors.all}`}>
                          {b.level}
                        </span>
                      </div>
                      {rating && (
                        <div className={`${getRatingBg(rating)} shrink-0 rounded-lg px-2.5 py-1`}>
                          <span className="text-xs font-bold text-white">{getRatingLabel(rating)}</span>
                        </div>
                      )}
                    </div>

                    {/* Forecast data */}
                    {fc && range && (
                      <div className="mt-3 flex items-end justify-between border-t border-sl-border/50 pt-3">
                        <div>
                          <div className="text-xl font-bold tabular-nums text-white">
                            {range.lo}-{range.hi}
                            <span className="ml-0.5 text-xs font-normal text-sl-muted">ft</span>
                          </div>
                          <div className="mt-0.5 text-[10px] text-sl-muted">
                            {metersToFeet(fc.swellHeight).toFixed(1)}ft @ {fc.swellPeriod.toFixed(0)}s {degreesToCompass(fc.swellDirection)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-sl-muted">
                          {fc.windSpeed != null && (
                            <span>{kmhToMph(fc.windSpeed).toFixed(0)}mph {degreesToCompass(fc.windDirection ?? 0)}</span>
                          )}
                          {fc.weatherCode != null && (
                            <span className="text-base">{getWeatherEmoji(fc.weatherCode)}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {!fc && !loading && (
                      <div className="mt-3 border-t border-sl-border/50 pt-3">
                        <p className="text-xs text-sl-muted">Forecast unavailable</p>
                      </div>
                    )}

                    {/* Features */}
                    <p className="mt-2 text-[11px] leading-relaxed text-sl-muted/70 line-clamp-2">{b.features}</p>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="border-t border-sl-border py-6 text-center text-[10px] text-sl-muted/60">
        Swellcast Surf Report — Data from Stormglass.io + Open-Meteo
      </footer>
    </div>
  )
}
