import type { SurfBreak } from '@/lib/breaks'

interface Props {
  spot: SurfBreak
}

function GuideRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-sl-border bg-sl-card p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sl-surface text-sl-accent">
        {icon}
      </div>
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
          <GuideRow
            label="Best Season"
            value={g.bestSeason}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            }
          />
          <GuideRow
            label="Best Swell"
            value={g.bestSwell}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
            }
          />
          <GuideRow
            label="Best Wind"
            value={g.bestWind}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
              </svg>
            }
          />
          <GuideRow
            label="Best Tide"
            value={g.bestTide}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636" />
              </svg>
            }
          />
          <GuideRow
            label="Bottom"
            value={g.bottom}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75" />
              </svg>
            }
          />
          <GuideRow
            label="Crowd Factor"
            value={g.crowd}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Hazards */}
      <div className="rounded-lg border border-amber-700/30 bg-amber-950/20 p-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400">Hazards</h3>
        </div>
        <p className="text-sm text-amber-200/80">{g.hazards}</p>
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
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <span>View on Google Maps</span>
          <span className="ml-auto text-xs text-sl-muted">{spot.lat.toFixed(4)}°N, {Math.abs(spot.lng).toFixed(4)}°W</span>
        </a>
      </div>
    </div>
  )
}
