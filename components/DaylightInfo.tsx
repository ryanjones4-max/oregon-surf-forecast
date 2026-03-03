'use client'

import { useMemo } from 'react'
import { calculateSunTimes } from '@/lib/sun'

interface Props {
  lat: number
  lng: number
}

export function DaylightInfo({ lat, lng }: Props) {
  const sun = useMemo(() => calculateSunTimes(lat, lng), [lat, lng])

  return (
    <div className="rounded-lg border border-sl-border bg-sl-card p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-sl-muted">Daylight</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
            <span className="text-xs font-medium">Sunrise</span>
          </div>
          <div className="mt-1 text-sm font-semibold text-white">{sun.sunrise}</div>
          <div className="text-[10px] text-sl-muted">First light {sun.firstLight}</div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-orange-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
            <span className="text-xs font-medium">Sunset</span>
          </div>
          <div className="mt-1 text-sm font-semibold text-white">{sun.sunset}</div>
          <div className="text-[10px] text-sl-muted">Last light {sun.lastLight}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-sl-surface px-3 py-2">
        <div className="h-1.5 flex-1 rounded-full bg-sl-dark overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-300 to-orange-500" style={{ width: '100%' }} />
        </div>
        <span className="text-xs font-medium text-sl-muted">{sun.daylight}</span>
      </div>
    </div>
  )
}
