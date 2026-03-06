import { CLUSTER_POINTS } from './breaks'

/**
 * NOAA NDBC buoy stations along the Oregon coast.
 * Each cluster maps to the nearest offshore buoy that reports WTMP (water temperature).
 * Data: https://www.ndbc.noaa.gov/data/realtime2/{station}.txt
 */
const CLUSTER_BUOY_MAP: Record<string, string> = {
  // Oregon
  'north-coast': '46029',         // Columbia River Bar — 46.1°N
  'short-sands': '46029',         // Columbia River Bar (closest to 45.7°N)
  'manzanita-oceanside': '46029', // Columbia River Bar
  'pacific-city': '46050',        // Stonewall Bank/Newport — 44.6°N
  'lincoln-city': '46050',        // Stonewall Bank/Newport
  'newport-otter': '46050',       // Stonewall Bank/Newport
  'central-south': '46229',       // Umpqua Offshore — 43.7°N
  'south-coast': '46015',         // Port Orford — 42.7°N
  // North Carolina
  'nc-crystal-coast': '41159',    // Cape Lookout Nearshore — 34.2°N
  'nc-onslow-topsail': '41159',   // Cape Lookout Nearshore (closest)
  'nc-wrightsville': '41110',     // Masonboro Inlet — 34.1°N
  'nc-obx-south': '41025',        // Diamond Shoals — 35.0°N
  'nc-obx-north': '41025',        // Diamond Shoals (closest to Rodanthe)
}

/** Monthly fallback if all buoys fail (°C) */
const FALLBACK_TEMP_BY_MONTH: Record<number, number> = {
  0: 10.5, 1: 10.0, 2: 10.0, 3: 10.5, 4: 11.0, 5: 12.0,
  6: 13.0, 7: 14.0, 8: 14.5, 9: 14.0, 10: 13.0, 11: 11.5,
}

function getMonthlyFallback(): number {
  return FALLBACK_TEMP_BY_MONTH[new Date().getMonth()] ?? 12
}

/**
 * Parse NDBC realtime2 .txt file to extract the most recent valid WTMP reading.
 * Format: 2 header rows, then space-delimited data. WTMP is column index 14.
 * Missing values are "MM".
 */
function parseWTMP(text: string): number | null {
  const lines = text.split('\n')
  if (lines.length < 3) return null

  const header = lines[0].trim().split(/\s+/)
  const wtmpIdx = header.indexOf('WTMP')
  if (wtmpIdx === -1) return null

  for (let i = 2; i < lines.length; i++) {
    const cols = lines[i].trim().split(/\s+/)
    if (cols.length <= wtmpIdx) continue
    const val = cols[wtmpIdx]
    if (val && val !== 'MM') {
      const temp = parseFloat(val)
      if (!isNaN(temp) && temp > -5 && temp < 35) return temp
    }
  }
  return null
}

async function fetchBuoyWaterTemp(stationId: string): Promise<number | null> {
  const url = `https://www.ndbc.noaa.gov/data/realtime2/${stationId}.txt`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const text = await res.text()
    return parseWTMP(text)
  } catch {
    return null
  }
}

/**
 * Fetch real water temperatures for all clusters from NOAA NDBC buoys.
 * Deduplicates station fetches (multiple clusters share the same buoy).
 * Falls back to monthly average if a buoy is unreachable.
 */
export async function fetchAllWaterTemps(): Promise<Record<string, number>> {
  const uniqueStations = Array.from(new Set(Object.values(CLUSTER_BUOY_MAP)))

  const stationTemps = new Map<string, number>()
  await Promise.all(
    uniqueStations.map(async (stationId) => {
      const temp = await fetchBuoyWaterTemp(stationId)
      stationTemps.set(stationId, temp ?? getMonthlyFallback())
    })
  )

  const result: Record<string, number> = {}
  for (const clusterId of Object.keys(CLUSTER_POINTS)) {
    const station = CLUSTER_BUOY_MAP[clusterId]
    result[clusterId] = station
      ? (stationTemps.get(station) ?? getMonthlyFallback())
      : getMonthlyFallback()
  }

  return result
}
