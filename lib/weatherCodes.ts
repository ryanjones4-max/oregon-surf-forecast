/**
 * WMO Weather codes - Open-Meteo uses these
 * 0=clear, 1-3=clouds, 45/48=fog, 51-67=rain/drizzle, 80-82=showers, etc.
 */
export function getWeatherLabel(code: number): string {
  if (code === 0) return 'Clear'
  if (code >= 1 && code <= 3) return 'Partly cloudy'
  if (code >= 45 && code <= 48) return 'Fog'
  if (code >= 51 && code <= 57) return 'Drizzle'
  if (code >= 61 && code <= 67) return 'Rain'
  if (code >= 71 && code <= 77) return 'Snow'
  if (code >= 80 && code <= 82) return 'Showers'
  if (code >= 85 && code <= 86) return 'Snow showers'
  if (code >= 95 && code <= 99) return 'Thunderstorm'
  return 'Cloudy'
}

export function getWeatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code >= 1 && code <= 3) return '⛅'
  if (code >= 45 && code <= 48) return '🌫️'
  if (code >= 51 && code <= 57) return '🌧️'
  if (code >= 61 && code <= 67) return '🌧️'
  if (code >= 71 && code <= 77) return '❄️'
  if (code >= 80 && code <= 82) return '🌦️'
  if (code >= 85 && code <= 86) return '🌨️'
  if (code >= 95 && code <= 99) return '⛈️'
  return '☁️'
}
