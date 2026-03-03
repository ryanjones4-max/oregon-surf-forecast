export type SurfRating = 'flat' | 'poor' | 'fair' | 'good' | 'great' | 'epic'

/**
 * Input for the Swell Quality Index. Structurally compatible with
 * ForecastDataPoint — pass one directly from the hourly feed.
 */
export interface SwellQualityInput {
  waveHeight: number
  swellHeight: number
  swellPeriod: number
  swellDirection: number
  windWaveHeight: number
  windWavePeriod: number
  windSpeed?: number
  windDirection?: number
}

export interface SwellQualityResult {
  rating: SurfRating
  score: number
  components: {
    waveSize: number
    swellPeriod: number
    swellPurity: number
    wind: number
  }
}

// ---------------------------------------------------------------------------
// Unit conversions
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Physical models
// ---------------------------------------------------------------------------

/**
 * Komar-Gaughan (1973) shoaling-only breaker height estimate.
 * Converts deep-water significant wave height (Hs) + peak period into an
 * estimated breaking wave face height using energy-flux conservation.
 * Returns height in the same unit as the input (meters).
 *
 * Ref: Komar, P.D. & Gaughan, M.K. (1973). "Airy wave theory and breaker
 * height prediction." Proc. 13th Conf. Coastal Engineering, pp. 405-418.
 */
export function estimateBreakingHeight(hsMeters: number, periodSec: number): number {
  if (hsMeters <= 0 || periodSec <= 0) return 0
  const g = 9.80665
  return 0.39 * Math.pow(g, 0.2) * Math.pow(periodSec * hsMeters * hsMeters, 0.4)
}

/**
 * Compute the surf height display range in feet from raw forecast data.
 * Uses Komar-Gaughan breaker estimate as H_b, then displays
 * H1/3 (0.79 × H_b) to H_b based on the Rayleigh distribution.
 */
export function surfHeightRange(waveHeightM: number, swellPeriodS: number): { lo: number; hi: number } {
  const hbFt = metersToFeet(estimateBreakingHeight(waveHeightM, swellPeriodS))
  return { lo: Math.round(hbFt * 0.79), hi: Math.round(hbFt) }
}

// ---------------------------------------------------------------------------
// Swell Quality Index (SQI) — scoring components
// ---------------------------------------------------------------------------

/**
 * Wave Size Score (0–30 pts).
 *
 * Uses Komar-Gaughan estimated breaking height converted to feet.
 * Log₂ curve provides rapid gain for small-to-medium waves and diminishing
 * returns past overhead, rewarding rideable size without over-weighting
 * XXL swells that only a handful of surfers can ride.
 */
function waveSizeScore(breakingFt: number): number {
  if (breakingFt < 1) return 0
  return Math.min(30, 8 * Math.log2(breakingFt) + 8)
}

/**
 * Swell Period Score (0–25 pts).
 *
 * Sigmoid centered at 11 s (inflection point). Longer period means more
 * organized wave trains from distant storms, greater energy per wave,
 * cleaner wave shape at breaking, and longer rides.
 *
 * Ref: Munk (1947), "Tracking Storms by Forerunners of Swell" — established
 *   that longer period indicates a more distant, organized source.
 * Ref: CDIP (Coastal Data Information Program) classification:
 *   <6 s wind swell · 6–10 s mixed · 10–13 s groundswell · 13 s+ long-period GS
 */
function swellPeriodScore(periodSec: number): number {
  if (periodSec <= 4) return 0
  if (periodSec >= 20) return 25
  const x = periodSec - 4
  return Math.min(25, 25 / (1 + Math.exp(-0.5 * (x - 7))))
}

/**
 * Swell Purity Score (0–20 pts).
 *
 * Measures the ratio of swell energy to total wave energy.
 * Wave energy is proportional to H², so we compare squared heights of the
 * swell and wind-wave components from the spectral decomposition.
 *
 * Pure groundswell with minimal wind chop produces well-defined wave faces
 * and predictable take-off zones; mixed-energy seas are disorganized.
 */
function swellPurityScore(swellHeight: number, waveHeight: number, windWaveHeight: number): number {
  if (swellHeight <= 0 && waveHeight <= 0) return 0
  if (swellHeight <= 0 && windWaveHeight <= 0) return 10

  const swellEnergy = swellHeight * swellHeight
  const totalEnergy = Math.max(swellEnergy + windWaveHeight * windWaveHeight, 0.001)
  const purity = Math.min(1, swellEnergy / totalEnergy)
  return 20 * purity
}

/**
 * Wind Score (0–25 pts) — two sub-components.
 *
 * A) Speed factor (0–15 pts): piecewise linear decay.
 *    Light wind is ideal (glassy surface); strong wind degrades face quality
 *    regardless of direction.
 *    Ref: NOAA Beaufort Scale sea-state descriptions.
 *
 * B) Wind-swell alignment factor (0–10 pts): angular difference between the
 *    wind "from" direction and swell "from" direction.
 *    - 0°  (same "from" direction) → onshore → 0 pts
 *    - 180° (opposite "from" dirs) → offshore → 10 pts
 *
 *    This is a universally applicable proxy for offshore/onshore conditions
 *    without requiring knowledge of the coastline orientation. It works
 *    because swell arrives from the open ocean while offshore wind blows
 *    from the land — their "from" bearings are naturally opposite.
 */
function windScore(windSpeedKmh: number | undefined, windDir: number | undefined, swellDir: number): number {
  if (windSpeedKmh == null) return 20

  const mph = kmhToMph(windSpeedKmh)

  let speedScore: number
  if (mph <= 3)       speedScore = 15
  else if (mph <= 8)  speedScore = 15 - (mph - 3) * 0.6
  else if (mph <= 15) speedScore = 12 - (mph - 8) * (6 / 7)
  else if (mph <= 25) speedScore = 6 - (mph - 15) * 0.5
  else                speedScore = Math.max(0, 1 - (mph - 25) * 0.1)

  let dirScore = 7
  if (windDir != null && mph > 3) {
    const raw = Math.abs(windDir - swellDir)
    const angleDiff = raw > 180 ? 360 - raw : raw
    dirScore = 10 * (angleDiff / 180)
  } else if (mph <= 3) {
    dirScore = 10
  }

  return speedScore + dirScore
}

function scoreToRating(score: number): SurfRating {
  if (score < 15) return 'poor'
  if (score < 35) return 'fair'
  if (score < 55) return 'good'
  if (score < 75) return 'great'
  return 'epic'
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compute the Swell Quality Index (SQI) for a single forecast hour.
 *
 * Returns a 0–100 composite score and categorical rating drawn from four
 * physically-grounded components:
 *
 * | Component     | Max | What it measures                              |
 * |---------------|-----|-----------------------------------------------|
 * | Wave Size     |  30 | Komar-Gaughan breaking height from swell Hs   |
 * | Swell Period  |  25 | Peak period — proxy for swell organisation     |
 * | Swell Purity  |  20 | Swell energy fraction — clean vs. choppy       |
 * | Wind          |  25 | Speed (calm best) + direction (offshore best)  |
 *
 * Score → Rating mapping:
 *   0–14 poor · 15–34 fair · 35–54 good · 55–74 great · 75–100 epic
 *
 * Applicable to any location served by the Open-Meteo Marine + Weather feeds.
 */
export function computeSwellQuality(fc: SwellQualityInput): SwellQualityResult {
  const effectiveSwellHt = fc.swellHeight > 0 ? fc.swellHeight : fc.waveHeight
  const period = fc.swellPeriod

  const breakingFt = metersToFeet(estimateBreakingHeight(effectiveSwellHt, period))
  if (breakingFt < 0.5) {
    return {
      rating: 'flat',
      score: 0,
      components: { waveSize: 0, swellPeriod: 0, swellPurity: 0, wind: 0 },
    }
  }

  const ws = waveSizeScore(breakingFt)
  const sp = swellPeriodScore(period)
  const pu = swellPurityScore(fc.swellHeight, fc.waveHeight, fc.windWaveHeight)
  const wi = windScore(fc.windSpeed, fc.windDirection, fc.swellDirection)

  const score = Math.min(100, Math.round(ws + sp + pu + wi))
  const rating = scoreToRating(score)

  return {
    rating,
    score,
    components: {
      waveSize: Math.round(ws * 10) / 10,
      swellPeriod: Math.round(sp * 10) / 10,
      swellPurity: Math.round(pu * 10) / 10,
      wind: Math.round(wi * 10) / 10,
    },
  }
}

/**
 * Convenience wrapper — returns just the categorical rating.
 * Accepts any object structurally compatible with SwellQualityInput
 * (including ForecastDataPoint).
 */
export function computeSurfRating(fc: SwellQualityInput): SurfRating {
  return computeSwellQuality(fc).rating
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

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
