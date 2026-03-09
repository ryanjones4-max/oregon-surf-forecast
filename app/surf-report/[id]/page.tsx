'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { getBreakById, getNearbyBreaks } from '@/lib/breaks'
import {
  getCachedForecast,
  setCachedForecast,
  minutesUntilCacheExpiry,
  type CachedForecast,
} from '@/lib/cache'
import type { ForecastDataPoint } from '@/lib/forecast'
import { SpotHeader } from '@/components/SpotHeader'
import { CurrentConditions } from '@/components/CurrentConditions'
import { SpotHero } from '@/components/SpotHero'
import { ForecastStrip, groupByDay } from '@/components/ForecastStrip'
import { DayDetail } from '@/components/DayDetail'
import { SwellChart } from '@/components/SwellChart'
import { WindGraph } from '@/components/WindGraph'
import { TideChart } from '@/components/TideChart'
import { WeatherStrip } from '@/components/WeatherStrip'
import { SpotGuide } from '@/components/SpotGuide'
import { NearbySpots } from '@/components/NearbySpots'
import { DaylightInfo } from '@/components/DaylightInfo'
import { CrosshairProvider } from '@/components/ChartCrosshair'
import Link from 'next/link'

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

export default function SurfReportPage() {
  const params = useParams()
  const spotId = params.id as string
  const spot = getBreakById(spotId)
  const nearby = spot ? getNearbyBreaks(spotId, 5) : []

  const [cache, setCache] = useState<CachedForecast | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState(0)
  const [activeTab, setActiveTab] = useState<'report' | 'guide'>('report')
  const [chartsCollapsed, setChartsCollapsed] = useState<Record<string, boolean>>({})

  const toggleChart = (key: string) => {
    setChartsCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const loadForecast = useCallback(async () => {
    const cached = getCachedForecast()
    if (cached) {
      const nowMs = Date.now()
      const hasFutureData = Object.values(cached.clusterForecasts).some(cf =>
        cf.hours.some(h => new Date(h.time + 'Z').getTime() > nowMs)
      )
      if (hasFutureData) {
        setCache(cached)
        setLoading(false)
        return
      }
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

  const clusterForecast = spot && cache ? cache.clusterForecasts[spot.clusterId] : null
  const allHours = clusterForecast?.hours ?? []

  const currentHourMs = useMemo(() => {
    const now = new Date()
    now.setMinutes(0, 0, 0)
    return now.getTime()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allHours])

  const chartHours = useMemo(() => {
    return allHours.filter(h => new Date(h.time + 'Z').getTime() >= currentHourMs)
  }, [allHours, currentHourMs])

  if (!spot) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-sl-bg p-8">
        <h1 className="text-2xl font-bold text-white">Spot not found</h1>
        <p className="text-sl-muted">The surf break &ldquo;{spotId}&rdquo; doesn&apos;t exist in our database.</p>
        <Link
          href="/"
          className="rounded-lg bg-sl-accent px-4 py-2 font-medium text-white hover:bg-sl-accent/80"
        >
          Browse All Breaks
        </Link>
      </div>
    )
  }

  const currentForecast = findClosestHour(allHours)
  const days = groupByDay(allHours)
  const dayHours = days[selectedDay]?.samples ?? []

  const getForecastForCluster = (clusterId: string): ForecastDataPoint | null => {
    const cf = cache?.clusterForecasts[clusterId]
    if (!cf?.hours?.length) return null
    return findClosestHour(cf.hours)
  }

  return (
    <div className="min-h-screen bg-sl-bg">
      {/* Spot Header with tabs */}
      <SpotHeader
        spot={spot}
        forecast={currentForecast}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Loading */}
      {loading && !cache && (
        <div className="flex h-64 items-center justify-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-sl-accent border-t-transparent" />
          <span className="text-sm text-sl-muted">Loading forecast data...</span>
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

      {!loading && activeTab === 'report' && (
        <div className="mx-auto max-w-7xl">
          {/* Hero Photo + Current Conditions */}
          <div className="lg:flex">
            <div className="relative min-h-[280px] overflow-hidden bg-sl-dark lg:flex-1">
              <SpotHero spotName={spot.name} lat={spot.lat} lng={spot.lng} />
            </div>

            {/* Current Conditions Sidebar */}
            <div className="bg-sl-dark p-3 lg:w-[320px] lg:shrink-0 lg:p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-sl-muted">Current Conditions</h3>
                {cache?.fetchedAt && (
                  <span className="text-[10px] text-sl-muted/60">
                    Updated {new Date(cache.fetchedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
              {currentForecast && <CurrentConditions forecast={currentForecast} lat={spot.lat} lng={spot.lng} />}
              {!currentForecast && !loading && (
                <p className="text-xs text-sl-muted">No forecast data available</p>
              )}
            </div>
          </div>

          {/* 16-Day Forecast Strip */}
          {allHours.length > 0 && (
            <ForecastStrip
              hours={allHours}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
          )}

          {/* Day Detail Table */}
          {dayHours.length > 0 && (
            <div className="border-b border-sl-border bg-sl-bg">
              <div className="px-4 pt-4 pb-2 lg:px-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-sl-muted">
                  {days[selectedDay]?.dayName} {days[selectedDay]?.dateLabel} — Hourly Detail
                </h3>
              </div>
              <DayDetail samples={dayHours} />
            </div>
          )}

          {/* Charts Section — shared crosshair syncs hover across all charts */}
          <CrosshairProvider>
            <div className="space-y-0">
              {/* Swell Chart */}
              {chartHours.length > 0 && (
                <CollapsibleSection
                  title="Swell Height"
                  collapsed={chartsCollapsed['swell']}
                  onToggle={() => toggleChart('swell')}
                >
                  <SwellChart hours={chartHours} />
                </CollapsibleSection>
              )}

              {/* Wind Chart */}
              {chartHours.length > 0 && (
                <CollapsibleSection
                  title="Wind"
                  collapsed={chartsCollapsed['wind']}
                  onToggle={() => toggleChart('wind')}
                >
                  <WindGraph hours={chartHours} />
                </CollapsibleSection>
              )}

              {/* Tide Chart */}
              {chartHours.length > 0 && (
                <CollapsibleSection
                  title="Tides"
                  collapsed={chartsCollapsed['tide']}
                  onToggle={() => toggleChart('tide')}
                >
                  <TideChart lat={spot.lat} lng={spot.lng} hours={chartHours} />
                </CollapsibleSection>
              )}

              {/* Weather Strip */}
              {chartHours.length > 0 && (
                <CollapsibleSection
                  title="Weather"
                  collapsed={chartsCollapsed['weather']}
                  onToggle={() => toggleChart('weather')}
                >
                  <WeatherStrip hours={chartHours} />
                </CollapsibleSection>
              )}
            </div>
          </CrosshairProvider>

          {/* Bottom section: Daylight + Nearby */}
          <div className="grid gap-4 p-4 lg:grid-cols-2 lg:p-6">
            <DaylightInfo lat={spot.lat} lng={spot.lng} />
            <NearbySpots spots={nearby} getForecast={getForecastForCluster} />
          </div>

          {/* Cache info */}
          {cache && (
            <div className="flex items-center justify-center gap-3 border-t border-sl-border py-4 text-[10px] text-sl-muted">
              <span>Forecast data refreshes in {minutesUntilCacheExpiry()} min</span>
              <span>·</span>
              <span>Data from Stormglass + Open-Meteo</span>
            </div>
          )}
        </div>
      )}

      {!loading && activeTab === 'guide' && (
        <div className="mx-auto max-w-3xl p-4 lg:p-6">
          <SpotGuide spot={spot} />
          <div className="mt-6">
            <NearbySpots spots={nearby} getForecast={getForecastForCluster} />
          </div>
        </div>
      )}
    </div>
  )
}

function CollapsibleSection({
  title,
  collapsed,
  onToggle,
  children,
}: {
  title: string
  collapsed?: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-sl-border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-1.5 lg:px-6 hover:bg-sl-surface/30 transition-colors"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-sl-muted">{title}</span>
        <svg
          className={`h-4 w-4 text-sl-muted transition-transform ${collapsed ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
      </button>
      {!collapsed && <div className="px-4 pb-2 lg:px-6">{children}</div>}
    </div>
  )
}
