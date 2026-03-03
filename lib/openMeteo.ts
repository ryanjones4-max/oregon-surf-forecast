import { CLUSTER_POINTS } from './breaks'

/** Open-Meteo hourly weather response */
export interface OpenMeteoHourly {
  time: string[]
  temperature_2m: number[]
  cloud_cover: number[]
  precipitation: number[]
  weather_code: number[]
  wind_speed_10m: number[]
  wind_direction_10m: number[]
}

export interface OpenMeteoResponse {
  hourly?: OpenMeteoHourly
}

export interface WeatherDataPoint {
  time: string
  airTemperature: number
  cloudCover: number
  precipitation: number
  weatherCode: number
  windSpeed: number
  windDirection: number
}

/** Normalize time string for matching (Stormglass uses ISO with Z, Open-Meteo uses short) */
function normalizeTime(t: string): string {
  const parsed = t.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(t) ? t : `${t}Z`
  return new Date(parsed).toISOString().slice(0, 16)
}

export async function fetchOpenMeteoWeather(
  lat: number,
  lng: number
): Promise<WeatherDataPoint[]> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lng))
  url.searchParams.set('hourly', [
    'temperature_2m',
    'cloud_cover',
    'precipitation',
    'weather_code',
    'wind_speed_10m',
    'wind_direction_10m',
  ].join(','))
  url.searchParams.set('forecast_days', '16')
  url.searchParams.set('timezone', 'UTC')

  const res = await fetch(url.toString())
  if (!res.ok) {
    console.warn(`Open-Meteo weather ${res.status} for ${lat},${lng} — skipping`)
    return []
  }

  const data: OpenMeteoResponse = await res.json()
  const h = data.hourly
  if (!h?.time?.length) return []

  return h.time.map((time, i) => ({
    time: normalizeTime(time),
    airTemperature: h.temperature_2m?.[i] ?? 0,
    cloudCover: h.cloud_cover?.[i] ?? 0,
    precipitation: h.precipitation?.[i] ?? 0,
    weatherCode: h.weather_code?.[i] ?? 0,
    windSpeed: h.wind_speed_10m?.[i] ?? 0,
    windDirection: h.wind_direction_10m?.[i] ?? 0,
  }))
}

/** Fetch weather for all 8 clusters — free tier, no API key. Gracefully handles per-cluster failures. */
export async function fetchAllClusterWeather(): Promise<Record<string, WeatherDataPoint[]>> {
  const results: Record<string, WeatherDataPoint[]> = {}

  await Promise.all(
    Object.entries(CLUSTER_POINTS).map(async ([clusterId, { lat, lng }]) => {
      try {
        results[clusterId] = await fetchOpenMeteoWeather(lat, lng)
      } catch {
        console.warn(`Weather fetch failed for cluster ${clusterId}`)
        results[clusterId] = []
      }
    })
  )

  return results
}
