import breaksData from '@/data/breaks.json'

export interface WebcamConfig {
  url: string
  embedType: 'iframe' | 'link'
  fallbackUrl: string
}

export interface SpotGuideInfo {
  bestSeason: string
  bestSwell: string
  bestWind: string
  bestTide: string
  bottom: string
  hazards: string
  crowd: string
  description: string
}

export interface SurfBreak {
  id: string
  name: string
  clusterId: string
  lat: number
  lng: number
  level: 'beginner' | 'intermediate' | 'advanced' | 'mixed' | 'all'
  features: string
  webcam: WebcamConfig | null
  guide: SpotGuideInfo
}

export const breaks: SurfBreak[] = breaksData as SurfBreak[]

/** Cluster coordinates for Open-Meteo Marine API (1 request per cluster) */
export const CLUSTER_POINTS: Record<string, { lat: number; lng: number }> = {
  // Oregon
  'north-coast': { lat: 45.89, lng: -123.96 },
  'short-sands': { lat: 45.76, lng: -123.96 },
  'manzanita-oceanside': { lat: 45.72, lng: -123.94 },
  'pacific-city': { lat: 45.22, lng: -123.97 },
  'lincoln-city': { lat: 44.99, lng: -124.02 },
  'newport-otter': { lat: 44.64, lng: -124.06 },
  'central-south': { lat: 43.98, lng: -124.11 },
  'south-coast': { lat: 43.37, lng: -124.22 },
  // North Carolina
  'nc-crystal-coast': { lat: 34.70, lng: -76.74 },
  'nc-onslow-topsail': { lat: 34.44, lng: -77.55 },
  'nc-wrightsville': { lat: 34.21, lng: -77.80 },
  'nc-obx-south': { lat: 35.25, lng: -75.53 },
  'nc-obx-north': { lat: 35.59, lng: -75.47 },
}

export function getBreakById(id: string): SurfBreak | undefined {
  return breaks.find((b) => b.id === id)
}

export function getBreaksByCluster(clusterId: string): SurfBreak[] {
  return breaks.filter((b) => b.clusterId === clusterId)
}

export function getNearbyBreaks(id: string, limit = 5): SurfBreak[] {
  const current = getBreakById(id)
  if (!current) return breaks.slice(0, limit)
  return breaks
    .filter((b) => b.id !== id)
    .map((b) => ({
      break_: b,
      dist: Math.sqrt((b.lat - current.lat) ** 2 + (b.lng - current.lng) ** 2),
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit)
    .map((x) => x.break_)
}

export function getAllBreakIds(): string[] {
  return breaks.map((b) => b.id)
}
