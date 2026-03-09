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

const EDGE_ZONE = 40
const EDGE_SCROLL_SPEED = 6

// ---------------------------------------------------------------------------
// Shared crosshair + scroll-sync context
// ---------------------------------------------------------------------------

interface CrosshairCtx {
  hoverTime: string | null
  setHoverTime: (t: string | null) => void
  inspecting: boolean
  setInspecting: (v: boolean) => void
  registerScroller: (ref: RefObject<HTMLDivElement | null>) => void
  unregisterScroller: (ref: RefObject<HTMLDivElement | null>) => void
  syncScroll: (source: RefObject<HTMLDivElement | null>) => void
  scrollAllBy: (delta: number) => void
}

const CrosshairContext = createContext<CrosshairCtx>({
  hoverTime: null,
  setHoverTime: () => {},
  inspecting: false,
  setInspecting: () => {},
  registerScroller: () => {},
  unregisterScroller: () => {},
  syncScroll: () => {},
  scrollAllBy: () => {},
})

export function CrosshairProvider({ children }: { children: ReactNode }) {
  const [hoverTime, setHoverTime] = useState<string | null>(null)
  const [inspecting, setInspecting] = useState(false)
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

  const scrollAllBy = useCallback((delta: number) => {
    scrollersRef.current.forEach((ref) => {
      if (ref.current) {
        ref.current.scrollLeft += delta
      }
    })
  }, [])

  const value = useMemo(
    () => ({ hoverTime, setHoverTime, inspecting, setInspecting, registerScroller, unregisterScroller, syncScroll, scrollAllBy }),
    [hoverTime, inspecting, registerScroller, unregisterScroller, syncScroll, scrollAllBy],
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
// useChartInteraction – unified mouse + touch crosshair handling
// ---------------------------------------------------------------------------

type TimeResolver = (clientX: number, scrollLeft: number) => string | null

/**
 * Desktop: pointerMove drives crosshair, pointerLeave clears it.
 * Mobile:  any touch instantly drives the crosshair (always-draggable).
 *          Crosshair persists on lift. Edge auto-scroll when finger is
 *          near viewport edges.
 */
export function useChartInteraction(resolveTime: TimeResolver, containerRef: RefObject<HTMLDivElement | null>) {
  const { setHoverTime, setInspecting, scrollAllBy } = useSharedCrosshair()

  const edgeRaf = useRef<number | null>(null)
  const edgeDir = useRef<number>(0)
  const lastClientX = useRef<number>(0)

  const resolveFromEvent = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return null
    return resolveTime(clientX, el.scrollLeft)
  }, [containerRef, resolveTime])

  const stopEdgeScroll = useCallback(() => {
    edgeDir.current = 0
    if (edgeRaf.current != null) {
      cancelAnimationFrame(edgeRaf.current)
      edgeRaf.current = null
    }
  }, [])

  const tickEdgeScroll = useCallback(() => {
    if (edgeDir.current === 0) return
    scrollAllBy(edgeDir.current * EDGE_SCROLL_SPEED)
    const time = resolveFromEvent(lastClientX.current)
    if (time) setHoverTime(time)
    edgeRaf.current = requestAnimationFrame(tickEdgeScroll)
  }, [scrollAllBy, resolveFromEvent, setHoverTime])

  const startEdgeScroll = useCallback((clientX: number) => {
    const vw = window.innerWidth
    let dir = 0
    if (clientX < EDGE_ZONE) dir = -1
    else if (clientX > vw - EDGE_ZONE) dir = 1

    if (dir !== edgeDir.current) {
      stopEdgeScroll()
      edgeDir.current = dir
      if (dir !== 0) {
        edgeRaf.current = requestAnimationFrame(tickEdgeScroll)
      }
    }
  }, [stopEdgeScroll, tickEdgeScroll])

  // --- Desktop ---
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return
    const time = resolveFromEvent(e.clientX)
    if (time) setHoverTime(time)
  }, [resolveFromEvent, setHoverTime])

  const handlePointerLeave = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return
    setHoverTime(null)
  }, [setHoverTime])

  // --- Mobile: always-draggable ---
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0]
    if (!touch) return
    e.preventDefault()
    setInspecting(true)
    lastClientX.current = touch.clientX
    const time = resolveFromEvent(touch.clientX)
    if (time) setHoverTime(time)
  }, [resolveFromEvent, setHoverTime, setInspecting])

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0]
    if (!touch) return
    e.preventDefault()
    lastClientX.current = touch.clientX
    const time = resolveFromEvent(touch.clientX)
    if (time) setHoverTime(time)
    startEdgeScroll(touch.clientX)
  }, [resolveFromEvent, setHoverTime, startEdgeScroll])

  const handleTouchEnd = useCallback(() => {
    stopEdgeScroll()
    setInspecting(false)
  }, [stopEdgeScroll, setInspecting])

  return {
    onPointerMove: handlePointerMove,
    onPointerLeave: handlePointerLeave,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd,
  }
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

export function parseUTC(iso: string): Date {
  return new Date(iso.endsWith('Z') ? iso : iso + 'Z')
}

export function formatCrosshairTime(iso: string): string {
  return parseUTC(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export const DAY_LABEL_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
}
