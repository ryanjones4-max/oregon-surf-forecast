export type SurfRating = 'flat' | 'poor' | 'fair' | 'good' | 'great' | 'epic'

export interface SurfConditions {
  waveHeight: number
  swellPeriod: number
  windSpeed?: number
}

export function metersToFeet(m: number): number {
  return m * 3.28084
}

export function celsiusToFahrenheit(c: number): number {
  return c * (9 / 5) + 32
}

export function kmhToMph(kmh: number): number {
  return kmh * 0.621371
}

export function degreesToCompass(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}

export function computeSurfRating(c: SurfConditions): SurfRating {
  const ft = metersToFeet(c.waveHeight)
  if (ft < 0.5) return 'flat'
  if (ft < 1) return 'poor'
  const windMph = c.windSpeed != null ? kmhToMph(c.windSpeed) : 0
  const windPenalty = windMph > 25 ? 2 : windMph > 15 ? 1 : 0
  let score = 0
  if (ft >= 1) score++
  if (ft >= 2) score++
  if (ft >= 3) score++
  if (c.swellPeriod >= 8) score++
  if (c.swellPeriod >= 12) score++
  score -= windPenalty
  if (score <= 0) return 'poor'
  if (score === 1) return 'fair'
  if (score === 2) return 'good'
  if (score === 3) return 'great'
  return 'epic'
}

export function getRatingLabel(r: SurfRating): string {
  return r === 'flat' ? 'Flat' : r.charAt(0).toUpperCase() + r.slice(1)
}

export function getRatingBg(r: SurfRating): string {
  const m: Record<SurfRating, string> = {
    flat: 'bg-rating-flat',
    poor: 'bg-rating-poor',
    fair: 'bg-rating-fair',
    good: 'bg-rating-good',
    great: 'bg-rating-great',
    epic: 'bg-rating-epic',
  }
  return m[r]
}

export function getRatingDot(r: SurfRating): string {
  const m: Record<SurfRating, string> = {
    flat: '#64748b',
    poor: '#ef4444',
    fair: '#f59e0b',
    good: '#22c55e',
    great: '#06b6d4',
    epic: '#8b5cf6',
  }
  return m[r]
}
