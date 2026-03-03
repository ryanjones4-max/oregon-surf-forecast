import { NextResponse } from 'next/server'
import type { ClusterForecast } from '@/lib/forecast'
import { fetchAllClusterMarineForecasts } from '@/lib/openMeteoMarine'
import { fetchAllClusterWeather } from '@/lib/openMeteo'
import { fetchAllWaterTemps } from '@/lib/waterTemp'

function normalizeTime(t: string): string {
  const parsed = t.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(t) ? t : `${t}Z`
  return new Date(parsed).toISOString().slice(0, 16)
}

function mergeWeatherIntoForecast(
  clusterForecasts: Record<string, ClusterForecast>,
  weatherData: Record<string, Array<{ time: string; airTemperature: number; cloudCover: number; precipitation: number; weatherCode: number; windSpeed: number; windDirection: number }>>
): Record<string, ClusterForecast> {
  const merged: Record<string, ClusterForecast> = {}

  for (const [clusterId, forecast] of Object.entries(clusterForecasts)) {
    const weather = weatherData[clusterId] ?? []
    const weatherByTime = new Map(weather.map((w) => [w.time, w]))

    merged[clusterId] = {
      clusterId,
      hours: forecast.hours.map((h) => {
        const t = normalizeTime(h.time)
        const w = weatherByTime.get(t)
        return {
          ...h,
          airTemperature: w?.airTemperature ?? h.airTemperature,
          cloudCover: w?.cloudCover ?? h.cloudCover,
          precipitation: w?.precipitation ?? h.precipitation,
          weatherCode: w?.weatherCode ?? h.weatherCode,
          windSpeed: w?.windSpeed ?? h.windSpeed,
          windDirection: w?.windDirection ?? h.windDirection,
        }
      }),
    }
  }

  return merged
}

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [waterTemps, weatherData] = await Promise.all([
      fetchAllWaterTemps(),
      fetchAllClusterWeather(),
    ])

    const clusterForecasts = await fetchAllClusterMarineForecasts(waterTemps)
    const mergedForecasts = mergeWeatherIntoForecast(clusterForecasts, weatherData)

    return NextResponse.json({
      clusterForecasts: mergedForecasts,
      fetchedAt: new Date().toISOString(),
      source: 'open-meteo+ndbc',
    })
  } catch (err) {
    console.error('Forecast API error:', err)
    return NextResponse.json(
      { error: 'FETCH_FAILED', message: 'Failed to fetch forecast data. Please try again.' },
      { status: 500 }
    )
  }
}
