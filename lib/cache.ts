const CACHE_VERSION = 2
const CACHE_KEY = `swellcast-surf-report-v${CACHE_VERSION}`
const CACHE_DATE_KEY = `swellcast-surf-report-date-v${CACHE_VERSION}`

import type { ForecastDataPoint } from '@/lib/forecast'

export interface CachedForecast {
  clusterForecasts: Record<string, { clusterId: string; hours: ForecastDataPoint[] }>
  fetchedAt: string
}

/** Get cache key for today (resets at midnight local) */
export function getTodayKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function getCachedForecast(): CachedForecast | null {
  if (typeof window === 'undefined') return null
  const key = getTodayKey()
  const storedKey = localStorage.getItem(CACHE_DATE_KEY)
  if (storedKey !== key) return null

  const raw = localStorage.getItem(CACHE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as CachedForecast
  } catch {
    return null
  }
}

export function setCachedForecast(data: CachedForecast): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CACHE_DATE_KEY, getTodayKey())
  localStorage.setItem(CACHE_KEY, JSON.stringify(data))
}

/** Minutes until cache expires (midnight) */
export function minutesUntilCacheExpiry(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return Math.round((midnight.getTime() - now.getTime()) / 60000)
}
