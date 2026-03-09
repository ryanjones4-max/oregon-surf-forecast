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
  registerScroller: (ref: RefObject<HTMLDivElement | null>) => void
  unregisterScroller: (ref: RefObject<HTMLDivElement | null>) => void
  syncScroll: (source: RefObject<HTMLDivElement | null>) => void
  scrollAllBy: (delta: number) => void
}

const CrosshairContext = createContext<CrosshairCtx>({
  hoverTime: null,
  setHoverTime: () => {},
  registerScroller: () => {},
  unregisterScroller: () => {},
  syncScroll: () => {},
  scrollAllBy: () => {},
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

  const scrollAllBy = useCallback((delta: number) => {
    scrollersRef.current.forEach((ref) => {
      if (ref.current) {
        ref.current.scrollLeft += delta
      }
    })
  }, [])

  const value = useMemo(
    () => ({ hoverTime, setHoverTime, registerScroller, unregisterScroller, syncScroll, scrollAllBy }),
    [hoverTime, registerScroller, unregisterScroller, syncScroll, scrollAllBy],
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

type TimeResolver = (clientX: number) => string | null

/**
 * Desktop: pointerMove drives crosshair, pointerLeave clears it.
 * Mobile:  Touch-drag scrolls all charts and the crosshair stays locked
 *          to the viewport center (driven by CenterTimeIndicator via
 *          scroll events). Native scroll is fully disabled — the finger
 *          directly controls scrollLeft so the crosshair line acts as
 *          the anchor.
 */
export function useChartInteraction(resolveTime: TimeResolver, containerRef: RefObject<HTMLDivElement | null>) {
  const { setHoverTime, scrollAllBy } = useSharedCrosshair()

  const resolveRef = useRef(resolveTime)
  resolveRef.current = resolveTime

  const setHoverRef = useRef(setHoverTime)
  setHoverRef.current = setHoverTime

  const scrollAllRef = useRef(scrollAllBy)
  scrollAllRef.current = scrollAllBy

  const lastTouchX = useRef<number>(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function onTouchStart(e: TouchEvent) {
      const touch = e.touches[0]
      if (!touch) return
      e.preventDefault()
      lastTouchX.current = touch.clientX
    }

    function onTouchMove(e: TouchEvent) {
      const touch = e.touches[0]
      if (!touch) return
      e.preventDefault()
      const dx = lastTouchX.current - touch.clientX
      lastTouchX.current = touch.clientX
      scrollAllRef.current(dx)
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
    }
  }, [containerRef])

  // Desktop only — pointer events
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return
    const time = resolveRef.current(e.clientX)
    if (time) setHoverRef.current(time)
  }, [])

  const handlePointerLeave = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return
    setHoverRef.current(null)
  }, [])

  return {
    onPointerMove: handlePointerMove,
    onPointerLeave: handlePointerLeave,
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

// ---------------------------------------------------------------------------
// CenterTimeIndicator – fixed center-of-viewport time line + pill
// ---------------------------------------------------------------------------

interface CenterTimeProps {
  containerRef: RefObject<HTMLDivElement | null>
  sampled: Array<{ time: string }>
}

export function CenterTimeIndicator({ containerRef, sampled }: CenterTimeProps) {
  const [centerTime, setCenterTime] = useState<string | null>(null)
  const { setHoverTime } = useSharedCrosshair()

  const resolve = useCallback(() => {
    const el = containerRef.current
    if (!el || sampled.length === 0) return
    const centerX = el.scrollLeft + el.clientWidth / 2
    const idx = Math.round(centerX / PX_PER_STEP)
    const clamped = Math.max(0, Math.min(idx, sampled.length - 1))
    const time = sampled[clamped]?.time ?? null
    setCenterTime(time)
    setHoverTime(time)
  }, [containerRef, sampled, setHoverTime])

  useEffect(() => {
    resolve()
    const el = containerRef.current
    if (!el) return
    el.addEventListener('scroll', resolve, { passive: true })
    return () => el.removeEventListener('scroll', resolve)
  }, [containerRef, resolve])

  if (!centerTime) return null

  const label = formatCrosshairTime(centerTime)

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: 0,
        bottom: 0,
        width: 0,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '1px',
          background: 'rgba(255,255,255,0.35)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: -1,
          transform: 'translateX(-50%)',
          background: 'rgba(18,18,18,0.95)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: '10px',
          padding: '2px 10px',
          whiteSpace: 'nowrap',
          fontSize: '11px',
          fontWeight: 600,
          color: '#e5e5e5',
          lineHeight: '18px',
        }}
      >
        {label}
      </div>
    </div>
  )
}
