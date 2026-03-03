'use client'

import { useState, useRef, useCallback } from 'react'

interface CrosshairState {
  x: number
  visible: boolean
}

interface UseCrosshairReturn {
  crosshair: CrosshairState
  containerRef: React.RefObject<HTMLDivElement>
  handlePointerMove: (e: React.PointerEvent<HTMLDivElement>) => void
  handlePointerLeave: () => void
}

export function useCrosshair(): UseCrosshairReturn {
  const [crosshair, setCrosshair] = useState<CrosshairState>({ x: 0, visible: false })
  const containerRef = useRef<HTMLDivElement>(null!)

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current
    if (!container) return
    const svg = container.querySelector('svg')
    if (!svg) return
    const svgRect = svg.getBoundingClientRect()
    const x = e.clientX - svgRect.left + container.scrollLeft
    setCrosshair({ x, visible: true })
  }, [])

  const handlePointerLeave = useCallback(() => {
    setCrosshair((prev) => ({ ...prev, visible: false }))
  }, [])

  return { crosshair, containerRef, handlePointerMove, handlePointerLeave }
}

interface TooltipProps {
  x: number
  chartH: number
  children: React.ReactNode
}

export function ChartTooltip({ x, chartH, children }: TooltipProps) {
  return (
    <g>
      <line x1={x} y1={0} x2={x} y2={chartH} stroke="#d4d4d4" strokeWidth="1" opacity="0.5" />
      <foreignObject x={x + 8} y={4} width="130" height="80" overflow="visible">
        <div
          style={{
            background: 'rgba(18,18,18,0.95)',
            border: '1px solid rgba(51,51,51,0.8)',
            borderRadius: '6px',
            padding: '6px 8px',
            fontSize: '11px',
            lineHeight: '1.5',
            color: '#d4d4d4',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {children}
        </div>
      </foreignObject>
    </g>
  )
}
