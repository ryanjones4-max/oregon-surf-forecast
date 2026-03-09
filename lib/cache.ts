const CACHE_VERSION = 2
const CACHE_KEY = `swellcast-surf-report-v${CACHE_VERSION}`
const CACHE_MAX_AGE_MS = 3 * 60 * 60 * 1000

import type { ForecastDataPoint } from '@/lib/forecast'

export interface CachedForecast {
  clusterForecasts: Record<string, { clusterId: string; hours: ForecastDataPoint[] }>
  fetchedAt: string
}

export function getCachedForecast(): CachedForecast | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(CACHE_KEY)
  if (!raw) return null

  try {
    const data = JSON.parse(raw) as CachedForecast
    const fetchedAt = new Date(data.fetchedAt).getTime()
    if (Date.now() - fetchedAt > CACHE_MAX_AGE_MS) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

export function setCachedForecast(data: CachedForecast): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CACHE_KEY, JSON.stringify(data))
}

export function minutesUntilCacheExpiry(): number {
  if (typeof window === 'undefined') return 0
  const raw = localStorage.getItem(CACHE_KEY)
  if (!raw) return 0
  try {
    const data = JSON.parse(raw) as CachedForecast
    const fetchedAt = new Date(data.fetchedAt).getTime()
    const expiresAt = fetchedAt + CACHE_MAX_AGE_MS
    return Math.max(0, Math.round((expiresAt - Date.now()) / 60000))
  } catch {
    return 0
  }
}
