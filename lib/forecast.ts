/**
 * Core forecast types used across the entire app.
 * Data sourced from Open-Meteo Marine (wave), Open-Meteo Weather (wind/air),
 * and NOAA NDBC buoys (water temperature).
 */

export interface ForecastDataPoint {
  time: string
  waveHeight: number
  swellHeight: number
  swellPeriod: number
  swellDirection: number
  windWaveHeight: number
  windWavePeriod: number
  waterTemperature: number
  airTemperature?: number
  cloudCover?: number
  precipitation?: number
  weatherCode?: number
  windSpeed?: number
  windDirection?: number
}

export interface ClusterForecast {
  clusterId: string
  hours: ForecastDataPoint[]
}
