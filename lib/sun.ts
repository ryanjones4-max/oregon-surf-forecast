/** Simple sunrise/sunset calculator using astronomical formulas */
export interface SunTimes {
  sunrise: string
  sunset: string
  daylight: string
  firstLight: string
  lastLight: string
}

function toJulianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5
}

function toDeg(rad: number): number {
  return rad * (180 / Math.PI)
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

function timezoneForLng(lng: number): string {
  if (lng < -100) return 'America/Los_Angeles'
  if (lng < -85) return 'America/Chicago'
  return 'America/New_York'
}

export function calculateSunTimes(lat: number, lng: number, date: Date = new Date()): SunTimes {
  const tz = timezoneForLng(lng)
  const jd = toJulianDate(date)
  const n = Math.floor(jd - 2451545.0 + 0.0008)
  const jStar = n - lng / 360
  const M = (357.5291 + 0.98560028 * jStar) % 360
  const C = 1.9148 * Math.sin(toRad(M)) + 0.02 * Math.sin(toRad(2 * M)) + 0.0003 * Math.sin(toRad(3 * M))
  const lambda = (M + C + 180 + 102.9372) % 360
  const jTransit = 2451545.0 + jStar + 0.0053 * Math.sin(toRad(M)) - 0.0069 * Math.sin(toRad(2 * lambda))
  const sinDec = Math.sin(toRad(lambda)) * Math.sin(toRad(23.4397))
  const cosDec = Math.cos(Math.asin(sinDec))

  function hourAngle(elevation: number): number {
    return toDeg(
      Math.acos(
        (Math.sin(toRad(elevation)) - Math.sin(toRad(lat)) * sinDec) /
          (Math.cos(toRad(lat)) * cosDec)
      )
    )
  }

  const omega0 = hourAngle(-0.833)
  const jRise = jTransit - omega0 / 360
  const jSet = jTransit + omega0 / 360

  const omegaCivil = hourAngle(-6)
  const jFirstLight = jTransit - omegaCivil / 360
  const jLastLight = jTransit + omegaCivil / 360

  function jdToTime(julianDate: number): string {
    const ms = (julianDate - 2440587.5) * 86400000
    const d = new Date(ms)
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz })
  }

  function msToDuration(ms: number): string {
    const totalMin = Math.floor(ms / 60000)
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    return `${h}h ${m}m`
  }

  const riseMs = (jRise - 2440587.5) * 86400000
  const setMs = (jSet - 2440587.5) * 86400000

  return {
    sunrise: jdToTime(jRise),
    sunset: jdToTime(jSet),
    daylight: msToDuration(setMs - riseMs),
    firstLight: jdToTime(jFirstLight),
    lastLight: jdToTime(jLastLight),
  }
}
