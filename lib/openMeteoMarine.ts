import { CLUSTER_POINTS } from './breaks'
import type { ForecastDataPoint, ClusterForecast } from './forecast'

interface OpenMeteoMarineHourly {
  time: string[]
  wave_height: number[]
  wave_direction: number[]
  wave_period: number[]
  swell_wave_height: number[]
  swell_wave_direction: number[]
  swell_wave_period: number[]
  swell_wave_peak_period: number[]
  wind_wave_height: number[]
  wind_wave_period: number[]
}

interface OpenMeteoMarineResponse {
  hourly?: OpenMeteoMarineHourly
}

function normalizeTime(t: string): string {
  const parsed = t.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(t) ? t : `${t}Z`
  return new Date(parsed).toISOString().slice(0, 16)
}

export async function fetchOpenMeteoMarine(
  lat: number,
  lng: number,
  waterTemperature: number,
): Promise<ForecastDataPoint[]> {
  const url = new URL('https://marine-api.open-meteo.com/v1/marine')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lng))
  url.searchParams.set('hourly', [
    'wave_height',
    'wave_direction',
    'wave_period',
    'swell_wave_height',
    'swell_wave_direction',
    'swell_wave_period',
    'swell_wave_peak_period',
    'wind_wave_height',
    'wind_wave_period',
  ].join(','))
  url.searchParams.set('forecast_days', '10')
  url.searchParams.set('timezone', 'UTC')

  const res = await fetch(url.toString())
  if (!res.ok) {
    console.warn(`Open-Meteo Marine ${res.status} for ${lat},${lng} — returning empty`)
    return []
  }

  const data: OpenMeteoMarineResponse = await res.json()
  const h = data.hourly
  if (!h?.time?.length) return []

  return h.time.map((time, i) => ({
    time: normalizeTime(time),
    waveHeight: h.wave_height?.[i] ?? 0,
    swellHeight: h.swell_wave_height?.[i] ?? 0,
    swellPeriod: h.swell_wave_peak_period?.[i] ?? h.swell_wave_period?.[i] ?? h.wave_period?.[i] ?? 0,
    swellDirection: h.swell_wave_direction?.[i] ?? h.wave_direction?.[i] ?? 0,
    windWaveHeight: h.wind_wave_height?.[i] ?? 0,
    windWavePeriod: h.wind_wave_period?.[i] ?? 0,
    waterTemperature,
  }))
}

/**
 * Fetch marine forecasts for all clusters using Open-Meteo Marine API.
 * Injects real water temperature from NOAA NDBC buoys per cluster.
 */
export async function fetchAllClusterMarineForecasts(
  waterTemps: Record<string, number>,
): Promise<Record<string, ClusterForecast>> {
  const results: Record<string, ClusterForecast> = {}

  await Promise.all(
    Object.entries(CLUSTER_POINTS).map(async ([clusterId, { lat, lng }]) => {
      const wt = waterTemps[clusterId] ?? 12
      const hours = await fetchOpenMeteoMarine(lat, lng, wt)
      results[clusterId] = { clusterId, hours }
    })
  )

  return results
}
