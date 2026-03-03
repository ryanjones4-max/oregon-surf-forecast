'use client'

import { createContext, useContext, useState, useMemo, type ReactNode } from 'react'

/**
 * Pixels per 3-hour sample — the shared horizontal scale across all charts.
 * Every chart uses this constant so their X axes are pixel-identical,
 * enabling a perfectly aligned crosshair.
 */
export const PX_PER_STEP = 24

// ---------------------------------------------------------------------------
// Shared crosshair context
// ---------------------------------------------------------------------------

interface CrosshairCtx {
  hoverTime: string | null
  setHoverTime: (t: string | null) => void
}

const CrosshairContext = createContext<CrosshairCtx>({
  hoverTime: null,
  setHoverTime: () => {},
})

export function CrosshairProvider({ children }: { children: ReactNode }) {
  const [hoverTime, setHoverTime] = useState<string | null>(null)
  const value = useMemo(() => ({ hoverTime, setHoverTime }), [hoverTime])
  return <CrosshairContext.Provider value={value}>{children}</CrosshairContext.Provider>
}

export function useSharedCrosshair() {
  return useContext(CrosshairContext)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function resolveHoverIdx<T extends { time: string }>(
  sampled: T[],
  hoverTime: string | null,
): number | null {
  if (!hoverTime || sampled.length === 0) return null
  const target = new Date(hoverTime).getTime()
  let best = 0
  let bestDiff = Infinity
  for (let i = 0; i < sampled.length; i++) {
    const diff = Math.abs(new Date(sampled[i].time).getTime() - target)
    if (diff < bestDiff) { bestDiff = diff; best = i }
  }
  return best
}
