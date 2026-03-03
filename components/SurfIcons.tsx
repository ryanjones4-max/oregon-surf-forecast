interface IconProps {
  size?: number
  className?: string
}

function IconCircle({ size = 36, children, className = '' }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
      <circle cx="18" cy="18" r="17" fill="#1f1f1f" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      {children}
    </svg>
  )
}

export function SwellDirectionIcon({ size, className, direction }: IconProps & { direction?: number }) {
  return (
    <IconCircle size={size} className={className}>
      <g transform={`rotate(${direction ?? 0} 18 18)`}>
        <circle cx="18" cy="18" r="3" stroke="white" strokeWidth="1.5" fill="none" />
        <circle cx="18" cy="18" r="6.5" stroke="white" strokeWidth="1.2" fill="none" opacity="0.7" />
        <circle cx="18" cy="18" r="10" stroke="white" strokeWidth="1" fill="none" opacity="0.4" />
        <circle cx="18" cy="18" r="13" stroke="white" strokeWidth="0.8" fill="none" opacity="0.2" />
      </g>
    </IconCircle>
  )
}

export function WindIcon({ size, className, direction }: IconProps & { direction?: number }) {
  return (
    <IconCircle size={size} className={className}>
      <g transform={`rotate(${direction ?? 0} 18 18)`}>
        <path d="M18 8 L22 22 L18 18 L14 22 Z" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </IconCircle>
  )
}

export function SurfHeightIcon({ size, className }: IconProps) {
  return (
    <IconCircle size={size} className={className}>
      <path d="M8 20 Q11 15 14 20 Q17 25 20 20 Q23 15 26 20" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 15 Q13 11 16 15 Q19 19 22 15" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    </IconCircle>
  )
}

export function TideIcon({ size, className }: IconProps) {
  return (
    <IconCircle size={size} className={className}>
      <path d="M9 16 Q12 12 15 16 Q18 20 21 16 Q24 12 27 16" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 20 Q12 16 15 20 Q18 24 21 20 Q24 16 27 20" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <path d="M9 24 Q12 20 15 24 Q18 28 21 24 Q24 20 27 24" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
    </IconCircle>
  )
}

export function TemperatureIcon({ size, className }: IconProps) {
  return (
    <IconCircle size={size} className={className}>
      <rect x="16" y="9" width="4" height="14" rx="2" fill="none" stroke="white" strokeWidth="1.5" />
      <circle cx="18" cy="24" r="3" fill="none" stroke="white" strokeWidth="1.5" />
      <line x1="18" y1="14" x2="18" y2="21" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </IconCircle>
  )
}

export function WeatherIcon({ size, className }: IconProps) {
  return (
    <IconCircle size={size} className={className}>
      <circle cx="16" cy="16" r="4" fill="none" stroke="white" strokeWidth="1.5" />
      <line x1="16" y1="9" x2="16" y2="10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="21.5" x2="16" y2="23" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="16" x2="10.5" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="21.5" y1="16" x2="23" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 22 Q22 20 25 20 Q28 20 28 23 Q28 26 25 26 L19 26" fill="none" stroke="white" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
    </IconCircle>
  )
}

export function SunriseIcon({ size, className }: IconProps) {
  return (
    <IconCircle size={size} className={className}>
      <path d="M10 22 L26 22" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 22 Q12 14 18 14 Q24 14 24 22" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18" y1="9" x2="18" y2="12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="15" x2="13" y2="16.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="25" y1="15" x2="23" y2="16.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
    </IconCircle>
  )
}

export function SunsetIcon({ size, className }: IconProps) {
  return (
    <IconCircle size={size} className={className}>
      <path d="M10 22 L26 22" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 22 Q12 14 18 14 Q24 14 24 22" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18" y1="12" x2="18" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M16 10 L18 12 L20 10" fill="none" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </IconCircle>
  )
}

export function CalendarIcon({ size, className }: IconProps) {
  return (
    <IconCircle size={size} className={className}>
      <rect x="10" y="11" width="16" height="14" rx="2" fill="none" stroke="white" strokeWidth="1.5" />
      <line x1="10" y1="16" x2="26" y2="16" stroke="white" strokeWidth="1.2" />
      <line x1="14" y1="9" x2="14" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="9" x2="22" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </IconCircle>
  )
}

export function BottomIcon({ size, className }: IconProps) {
  return (
    <IconCircle size={size} className={className}>
      <path d="M9 24 Q13 20 18 22 Q23 24 27 20" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="16" r="1.5" fill="white" opacity="0.5" />
      <circle cx="20" cy="14" r="1" fill="white" opacity="0.4" />
      <circle cx="22" cy="18" r="1.5" fill="white" opacity="0.5" />
      <circle cx="16" cy="12" r="0.8" fill="white" opacity="0.3" />
    </IconCircle>
  )
}

export function CrowdIcon({ size, className }: IconProps) {
  return (
    <IconCircle size={size} className={className}>
      <circle cx="14" cy="13" r="2.5" fill="none" stroke="white" strokeWidth="1.3" />
      <path d="M9 24 Q9 19 14 19 Q19 19 19 24" fill="none" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="22" cy="14" r="2" fill="none" stroke="white" strokeWidth="1.2" opacity="0.6" />
      <path d="M18 25 Q18 21 22 21 Q26 21 26 25" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    </IconCircle>
  )
}

export function HazardIcon({ size, className }: IconProps) {
  return (
    <IconCircle size={size} className={className}>
      <path d="M18 10 L27 25 L9 25 Z" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="18" y1="15" x2="18" y2="20" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="18" cy="22.5" r="0.8" fill="#fbbf24" />
    </IconCircle>
  )
}

export function LocationIcon({ size, className }: IconProps) {
  return (
    <IconCircle size={size} className={className}>
      <path d="M18 8 C14 8 11 11 11 15 C11 21 18 28 18 28 C18 28 25 21 25 15 C25 11 22 8 18 8Z" fill="none" stroke="white" strokeWidth="1.5" />
      <circle cx="18" cy="15" r="2.5" fill="none" stroke="white" strokeWidth="1.5" />
    </IconCircle>
  )
}
