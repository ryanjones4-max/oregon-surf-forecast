'use client'

interface Props {
  spotName: string
  lat: number
  lng: number
}

export function SpotHero({ spotName, lat, lng }: Props) {
  const mapSrc = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d12000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2sus`
  const mapsLink = `https://www.google.com/maps/@${lat},${lng},15z/data=!3m1!1e1`

  return (
    <div className="absolute inset-0">
      <iframe
        src={mapSrc}
        title={`${spotName} satellite view`}
        className="h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen={false}
      />

      {/* Pin overlay — centered */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <svg width="32" height="44" viewBox="0 0 32 44" fill="none" className="drop-shadow-lg">
          <path
            d="M16 0C7.16 0 0 7.16 0 16c0 12 16 28 16 28s16-16 16-28C32 7.16 24.84 0 16 0z"
            fill="white"
          />
          <circle cx="16" cy="16" r="6" fill="#121212" />
        </svg>
      </div>

      {/* "View on Google Maps" button */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-white px-5 py-2 text-sm font-medium text-gray-800 shadow-lg transition hover:bg-gray-100"
        >
          View on Google Maps
        </a>
      </div>
    </div>
  )
}
