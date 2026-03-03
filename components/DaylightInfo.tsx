'use client'

import { useMemo } from 'react'
import { calculateSunTimes } from '@/lib/sun'
import { SunriseIcon, SunsetIcon } from './SurfIcons'

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
        <div className="flex items-start gap-2.5">
          <SunriseIcon size={32} />
          <div>
            <span className="text-xs font-medium text-amber-400">Sunrise</span>
            <div className="mt-0.5 text-sm font-semibold text-white">{sun.sunrise}</div>
            <div className="text-[10px] text-sl-muted">First light {sun.firstLight}</div>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <SunsetIcon size={32} />
          <div>
            <span className="text-xs font-medium text-orange-400">Sunset</span>
            <div className="mt-0.5 text-sm font-semibold text-white">{sun.sunset}</div>
            <div className="text-[10px] text-sl-muted">Last light {sun.lastLight}</div>
          </div>
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
