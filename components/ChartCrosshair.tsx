'use client'

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
  type RefObject,
} from 'react'

/**
 * Pixels per 3-hour sample — the shared horizontal scale across all charts.
 */
export const PX_PER_STEP = 24

// ---------------------------------------------------------------------------
// Shared crosshair + scroll-sync context
// ---------------------------------------------------------------------------

interface CrosshairCtx {
  hoverTime: string | null
  setHoverTime: (t: string | null) => void
  registerScroller: (ref: RefObject<HTMLDivElement | null>) => void
  unregisterScroller: (ref: RefObject<HTMLDivElement | null>) => void
  syncScroll: (source: RefObject<HTMLDivElement | null>) => void
}

const CrosshairContext = createContext<CrosshairCtx>({
  hoverTime: null,
  setHoverTime: () => {},
  registerScroller: () => {},
  unregisterScroller: () => {},
  syncScroll: () => {},
})

export function CrosshairProvider({ children }: { children: ReactNode }) {
  const [hoverTime, setHoverTime] = useState<string | null>(null)
  const scrollersRef = useRef<Set<RefObject<HTMLDivElement | null>>>(new Set())
  const isSyncing = useRef(false)

  const registerScroller = useCallback((ref: RefObject<HTMLDivElement | null>) => {
    scrollersRef.current.add(ref)
  }, [])

  const unregisterScroller = useCallback((ref: RefObject<HTMLDivElement | null>) => {
    scrollersRef.current.delete(ref)
  }, [])

  const syncScroll = useCallback((source: RefObject<HTMLDivElement | null>) => {
    if (isSyncing.current || !source.current) return
    isSyncing.current = true
    const scrollLeft = source.current.scrollLeft
    scrollersRef.current.forEach((ref) => {
      if (ref !== source && ref.current) {
        ref.current.scrollLeft = scrollLeft
      }
    })
    isSyncing.current = false
  }, [])

  const value = useMemo(
    () => ({ hoverTime, setHoverTime, registerScroller, unregisterScroller, syncScroll }),
    [hoverTime, registerScroller, unregisterScroller, syncScroll],
  )

  return <CrosshairContext.Provider value={value}>{children}</CrosshairContext.Provider>
}

export function useSharedCrosshair() {
  return useContext(CrosshairContext)
}

/**
 * Hook that registers a scroll container with the shared context and
 * syncs its scroll position with all sibling chart containers.
 */
export function useSyncedScroll() {
  const { registerScroller, unregisterScroller, syncScroll } = useContext(CrosshairContext)
  const containerRef = useRef<HTMLDivElement>(null!)

  useEffect(() => {
    registerScroller(containerRef)
    return () => unregisterScroller(containerRef)
  }, [registerScroller, unregisterScroller])

  const onScroll = useCallback(() => {
    syncScroll(containerRef)
  }, [syncScroll])

  return { containerRef, onScroll }
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
