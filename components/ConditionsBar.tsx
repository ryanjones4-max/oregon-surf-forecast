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

interface Props {
  forecast: ForecastDataPoint
}

function Pill({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-3">
      <span className="text-[10px] uppercase tracking-wider text-sl-muted">{label}</span>
      <span className="text-sm font-semibold text-white">
        {value}
        {unit && <span className="ml-0.5 text-xs font-normal text-sl-muted">{unit}</span>}
      </span>
    </div>
  )
}

export function ConditionsBar({ forecast: fc }: Props) {
  const ft = metersToFeet(fc.waveHeight)
  const rating = computeSurfRating({ waveHeight: fc.waveHeight, swellPeriod: fc.swellPeriod, windSpeed: fc.windSpeed })

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg bg-sl-card border border-sl-border px-2 py-3">
      <div className={`${getRatingBg(rating)} flex items-center gap-1.5 rounded-md px-3 py-1.5 mr-2`}>
        <span className="text-sm font-bold text-white">{getRatingLabel(rating)}</span>
      </div>

      <Pill label="Surf" value={`${ft.toFixed(0)}-${(ft * 1.3).toFixed(0)}`} unit="ft" />

      <div className="h-6 w-px bg-sl-border" />

      <Pill label="Swell" value={`${metersToFeet(fc.swellHeight).toFixed(1)}ft ${fc.swellPeriod.toFixed(0)}s`} />
      <Pill label="Dir" value={degreesToCompass(fc.swellDirection)} />

      <div className="h-6 w-px bg-sl-border" />

      {fc.windSpeed != null && (
        <Pill
          label="Wind"
          value={`${kmhToMph(fc.windSpeed).toFixed(0)}`}
          unit={`mph ${degreesToCompass(fc.windDirection ?? 0)}`}
        />
      )}

      <div className="h-6 w-px bg-sl-border" />

      <Pill label="Water" value={celsiusToFahrenheit(fc.waterTemperature).toFixed(0)} unit="°F" />

      {fc.airTemperature != null && (
        <Pill label="Air" value={celsiusToFahrenheit(fc.airTemperature).toFixed(0)} unit="°F" />
      )}

      <div className="h-6 w-px bg-sl-border" />

      {fc.weatherCode != null && (
        <Pill label="Weather" value={getWeatherLabel(fc.weatherCode)} />
      )}
    </div>
  )
}
