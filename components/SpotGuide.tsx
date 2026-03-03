import type { SurfBreak } from '@/lib/breaks'
import {
  SwellDirectionIcon,
  WindIcon,
  SurfHeightIcon,
  TideIcon,
  CalendarIcon,
  BottomIcon,
  CrowdIcon,
  HazardIcon,
  LocationIcon,
} from './SurfIcons'

interface Props {
  spot: SurfBreak
}

function GuideRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-sl-border bg-sl-card p-3">
      <div className="shrink-0">{icon}</div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-widest text-sl-muted">{label}</div>
        <div className="mt-0.5 text-sm text-white">{value}</div>
      </div>
    </div>
  )
}

export function SpotGuide({ spot }: Props) {
  const g = spot.guide

  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="rounded-lg border border-sl-border bg-sl-card p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-sl-muted">About This Spot</h3>
        <p className="text-sm leading-relaxed text-sl-text">{g.description}</p>
      </div>

      {/* Ideal Conditions Grid */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-sl-muted">Ideal Conditions</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <GuideRow label="Best Season" value={g.bestSeason} icon={<CalendarIcon size={36} />} />
          <GuideRow label="Swell Direction" value={g.bestSwell} icon={<SwellDirectionIcon size={36} />} />
          <GuideRow label="Wind" value={g.bestWind} icon={<WindIcon size={36} />} />
          <GuideRow label="Surf Height" value={g.bestTide} icon={<SurfHeightIcon size={36} />} />
          <GuideRow label="Bottom" value={g.bottom} icon={<BottomIcon size={36} />} />
          <GuideRow label="Crowd Factor" value={g.crowd} icon={<CrowdIcon size={36} />} />
        </div>
      </div>

      {/* Hazards */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-700/30 bg-amber-950/20 p-4">
        <div className="shrink-0"><HazardIcon size={36} /></div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400">Hazards</h3>
          <p className="mt-1 text-sm text-amber-200/80">{g.hazards}</p>
        </div>
      </div>

      {/* Map Link */}
      <div className="rounded-lg border border-sl-border bg-sl-card p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-sl-muted">Location</h3>
        <a
          href={`https://www.google.com/maps?q=${spot.lat},${spot.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg bg-sl-surface px-4 py-3 text-sm text-sl-accent hover:bg-sl-border transition-colors"
        >
          <LocationIcon size={32} />
          <span>View on Google Maps</span>
          <span className="ml-auto text-xs text-sl-muted">{spot.lat.toFixed(4)}°N, {Math.abs(spot.lng).toFixed(4)}°W</span>
        </a>
      </div>
    </div>
  )
}
