# Oregon Surf Forecast

Real-time surf reports for every break on the Oregon Coast — Surfline-style. No API keys required.

## Features

- **16 Oregon breaks** from Cannon Beach to Brookings, organized by coastal region
- **Dedicated spot pages** with Surfline-style URLs (`/surf-report/short-sands`)
- **10-day marine forecast**: Wave height, swell height/period/direction, wind waves
- **Real water temperature** from NOAA NDBC buoys (4 stations along the Oregon coast)
- **Weather data**: Air temp, wind speed/direction, cloud cover, precipitation
- **Surf rating engine**: Flat / Poor / Fair / Good / Great / Epic based on wave + wind conditions
- **Interactive charts**: Swell height, wind, and tide graphs — collapsible like Surfline
- **Surf guide** for each break: Ideal conditions, hazards, crowd factor, description
- **Live webcams** where available (Cannon Beach, Pacific City, Lincoln City, etc.)
- **Sunrise/sunset** and daylight hours
- **Nearby spots** with current conditions
- **Weather links** to NWS full forecast for each location
- **Client-side caching** — forecast cached until midnight to minimize API calls

## Data Sources (All Free)

| Data | Source | API Key |
|------|--------|---------|
| Wave / Swell | [Open-Meteo Marine API](https://open-meteo.com/) | None |
| Weather / Wind | [Open-Meteo Weather API](https://open-meteo.com/) | None |
| Water Temperature | [NOAA NDBC Buoys](https://www.ndbc.noaa.gov/) | None |

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

That's it — no API keys, no `.env` configuration needed.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
