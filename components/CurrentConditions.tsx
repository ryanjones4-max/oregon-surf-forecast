import type { ForecastDataPoint } from '@/lib/forecast'
import {
  metersToFeet,
  celsiusToFahrenheit,
  kmhToMph,
  degreesToCompass,
  computeSurfRating,
  getRatingBg,
  getRatingLabel,
} from '@/lib/surfRating'
import { getWeatherLabel } from '@/lib/weatherCodes'
import {
  SurfHeightIcon,
  SwellDirectionIcon,
  WindIcon,
  TemperatureIcon,
  WeatherIcon,
} from './SurfIcons'

interface Props {
  forecast: ForecastDataPoint
  lat?: number
  lng?: number
}

function ConditionCard({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-sl-border bg-sl-card p-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-sl-muted">{label}</div>
        {children}
      </div>
    </div>
  )
}

export function CurrentConditions({ forecast: fc, lat, lng }: Props) {
  const ft = metersToFeet(fc.waveHeight)
  const rating = computeSurfRating({ waveHeight: fc.waveHeight, swellPeriod: fc.swellPeriod, windSpeed: fc.windSpeed })

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1 lg:gap-2.5">
      {/* Surf */}
      <ConditionCard label="Surf" icon={<SurfHeightIcon size={32} />}>
        <div className="flex items-center gap-2">
          <div className={`${getRatingBg(rating)} rounded px-2 py-0.5`}>
            <span className="text-xs font-bold text-white">{getRatingLabel(rating)}</span>
          </div>
          <span className="text-lg font-bold tabular-nums text-white">
            {ft.toFixed(0)}-{(ft * 1.3).toFixed(0)}
            <span className="ml-0.5 text-xs font-normal text-sl-muted">ft</span>
          </span>
        </div>
      </ConditionCard>

      {/* Swell */}
      <ConditionCard label="Swell" icon={<SwellDirectionIcon size={32} direction={fc.swellDirection} />}>
        <div className="text-sm font-semibold text-white">
          {metersToFeet(fc.swellHeight).toFixed(1)}ft @ {fc.swellPeriod.toFixed(0)}s
        </div>
        <div className="mt-0.5 text-xs text-sl-muted">
          {degreesToCompass(fc.swellDirection)} ({fc.swellDirection.toFixed(0)}°)
        </div>
      </ConditionCard>

      {/* Wind */}
      {fc.windSpeed != null && (
        <ConditionCard label="Wind" icon={<WindIcon size={32} direction={fc.windDirection ?? 0} />}>
          <div className="text-sm font-semibold text-white">
            {kmhToMph(fc.windSpeed).toFixed(0)} mph
          </div>
          <div className="mt-0.5 text-xs text-sl-muted">
            {degreesToCompass(fc.windDirection ?? 0)}
          </div>
        </ConditionCard>
      )}

      {/* Temperature */}
      <ConditionCard label="Temperature" icon={<TemperatureIcon size={32} />}>
        <div className="flex items-baseline gap-3">
          <div>
            <span className="text-sm font-semibold text-white">
              {celsiusToFahrenheit(fc.waterTemperature).toFixed(0)}°F
            </span>
            <span className="ml-1 text-[10px] text-sl-muted">Water</span>
          </div>
          {fc.airTemperature != null && (
            <div>
              <span className="text-sm font-semibold text-white">
                {celsiusToFahrenheit(fc.airTemperature).toFixed(0)}°F
              </span>
              <span className="ml-1 text-[10px] text-sl-muted">Air</span>
            </div>
          )}
        </div>
      </ConditionCard>

      {/* Weather */}
      {fc.weatherCode != null && (
        <a
          href={lat != null && lng != null ? `https://forecast.weather.gov/MapClick.php?lat=${lat}&lon=${lng}` : 'https://forecast.weather.gov'}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-2.5 rounded-lg border border-sl-border bg-sl-card p-3 transition-colors hover:border-sl-accent/40 hover:bg-sl-surface"
        >
          <div className="mt-0.5 shrink-0"><WeatherIcon size={32} /></div>
          <div className="min-w-0">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-sl-muted">Weather</span>
              <svg className="h-3 w-3 text-sl-muted/40 transition-colors group-hover:text-sl-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </div>
            <span className="text-sm font-medium text-white">{getWeatherLabel(fc.weatherCode)}</span>
            <div className="mt-1 text-[9px] text-sl-muted/50 group-hover:text-sl-accent/60">Full forecast at weather.gov</div>
          </div>
        </a>
      )}
    </div>
  )
}
