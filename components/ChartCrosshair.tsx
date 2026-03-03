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
  inspecting: boolean
  setInspecting: (v: boolean) => void
  registerScroller: (ref: RefObject<HTMLDivElement | null>) => void
  unregisterScroller: (ref: RefObject<HTMLDivElement | null>) => void
  syncScroll: (source: RefObject<HTMLDivElement | null>) => void
}

const CrosshairContext = createContext<CrosshairCtx>({
  hoverTime: null,
  setHoverTime: () => {},
  inspecting: false,
  setInspecting: () => {},
  registerScroller: () => {},
  unregisterScroller: () => {},
  syncScroll: () => {},
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

  const value = useMemo(
    () => ({ hoverTime, setHoverTime, inspecting, setInspecting, registerScroller, unregisterScroller, syncScroll }),
    [hoverTime, inspecting, registerScroller, unregisterScroller, syncScroll],
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

const HOLD_DELAY = 150
const MOVE_THRESHOLD = 8

type TimeResolver = (clientX: number, scrollLeft: number) => string | null

/**
 * Returns event handler props to spread onto the chart scroll container.
 *
 * Desktop: pointerMove drives crosshair, pointerLeave clears it.
 * Mobile:  short press-and-hold activates inspect mode (blocks scroll,
 *          touchMove drives crosshair). Lift or quick swipe = normal scroll.
 */
export function useChartInteraction(resolveTime: TimeResolver, containerRef: RefObject<HTMLDivElement | null>) {
  const { setHoverTime, setInspecting } = useSharedCrosshair()

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartPos = useRef<{ x: number; y: number } | null>(null)
  const isInspecting = useRef(false)

  const clearHold = useCallback(() => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null }
  }, [])

  const resolveFromEvent = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return null
    return resolveTime(clientX, el.scrollLeft)
  }, [containerRef, resolveTime])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return
    const time = resolveFromEvent(e.clientX)
    if (time) setHoverTime(time)
  }, [resolveFromEvent, setHoverTime])

  const handlePointerLeave = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return
    setHoverTime(null)
  }, [setHoverTime])

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0]
    if (!touch) return
    touchStartPos.current = { x: touch.clientX, y: touch.clientY }
    isInspecting.current = false

    clearHold()
    holdTimer.current = setTimeout(() => {
      const pos = touchStartPos.current
      if (!pos) return
      isInspecting.current = true
      setInspecting(true)
      const time = resolveFromEvent(pos.x)
      if (time) setHoverTime(time)
    }, HOLD_DELAY)
  }, [clearHold, resolveFromEvent, setHoverTime, setInspecting])

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0]
    if (!touch) return

    if (!isInspecting.current && touchStartPos.current) {
      const dx = Math.abs(touch.clientX - touchStartPos.current.x)
      const dy = Math.abs(touch.clientY - touchStartPos.current.y)
      if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
        clearHold()
        touchStartPos.current = null
        return
      }
    }

    if (isInspecting.current) {
      e.preventDefault()
      const time = resolveFromEvent(touch.clientX)
      if (time) setHoverTime(time)
    }
  }, [clearHold, resolveFromEvent, setHoverTime])

  const handleTouchEnd = useCallback(() => {
    clearHold()
    touchStartPos.current = null
    if (isInspecting.current) {
      isInspecting.current = false
      setInspecting(false)
      setHoverTime(null)
    }
  }, [clearHold, setHoverTime, setInspecting])

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
