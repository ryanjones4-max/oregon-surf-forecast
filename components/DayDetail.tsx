import type { ForecastDataPoint } from '@/lib/forecast'
import { metersToFeet, celsiusToFahrenheit, kmhToMph, degreesToCompass, computeSurfRating, getRatingDot, getRatingLabel } from '@/lib/surfRating'
import { getWeatherEmoji, getWeatherLabel } from '@/lib/weatherCodes'

interface Props {
  samples: ForecastDataPoint[]
}

function DirectionArrow({ deg, className }: { deg: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className || 'h-4 w-4'} style={{ transform: `rotate(${deg}deg)` }}>
      <path d="M12 2 L18 14 L12 10 L6 14 Z" fill="currentColor" />
    </svg>
  )
}

export function DayDetail({ samples }: Props) {
  const filtered = samples.filter((_, i) => i % 3 === 0).slice(0, 8)

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="border-b border-sl-border text-[10px] uppercase tracking-wider text-sl-muted">
            <th className="py-2 pl-4 text-left font-medium">Time</th>
            <th className="py-2 text-left font-medium">Rating</th>
            <th className="py-2 text-right font-medium">Surf</th>
            <th className="py-2 text-right font-medium">Swell</th>
            <th className="py-2 text-center font-medium">Dir</th>
            <th className="py-2 text-right font-medium">Wind</th>
            <th className="py-2 text-center font-medium">Weather</th>
            <th className="py-2 text-right pr-4 font-medium">Temp</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((h) => {
            const rating = computeSurfRating({ waveHeight: h.waveHeight, swellPeriod: h.swellPeriod, windSpeed: h.windSpeed })
            const ft = metersToFeet(h.waveHeight)
            const time = new Date(h.time)
            return (
              <tr key={h.time} className="border-b border-sl-border/50 hover:bg-sl-surface/30">
                <td className="py-2.5 pl-4 text-sl-text">
                  {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getRatingDot(rating) }} />
                    <span className="text-xs font-medium text-sl-text">{getRatingLabel(rating)}</span>
                  </div>
                </td>
                <td className="py-2.5 text-right font-semibold text-white tabular-nums">
                  {ft.toFixed(0)}-{(ft * 1.3).toFixed(0)} ft
                </td>
                <td className="py-2.5 text-right text-sl-muted tabular-nums">
                  {metersToFeet(h.swellHeight).toFixed(1)}ft @ {h.swellPeriod.toFixed(0)}s
                </td>
                <td className="py-2.5">
                  <div className="flex items-center justify-center gap-1 text-sl-muted">
                    <DirectionArrow deg={h.swellDirection} />
                    <span className="text-xs">{degreesToCompass(h.swellDirection)}</span>
                  </div>
                </td>
                <td className="py-2.5 text-right text-sl-muted tabular-nums">
                  {h.windSpeed != null ? (
                    <span>{kmhToMph(h.windSpeed).toFixed(0)} mph {degreesToCompass(h.windDirection ?? 0)}</span>
                  ) : '—'}
                </td>
                <td className="py-2.5 text-center">
                  {h.weatherCode != null ? (
                    <span title={getWeatherLabel(h.weatherCode)}>{getWeatherEmoji(h.weatherCode)}</span>
                  ) : '—'}
                </td>
                <td className="py-2.5 pr-4 text-right text-sl-muted tabular-nums">
                  {h.airTemperature != null ? `${celsiusToFahrenheit(h.airTemperature).toFixed(0)}°F` : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
