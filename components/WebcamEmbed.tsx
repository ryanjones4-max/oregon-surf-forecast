'use client'

import { useState } from 'react'
import type { WebcamConfig } from '@/lib/breaks'

interface Props {
  webcam: WebcamConfig
  breakName: string
}

export function WebcamEmbed({ webcam, breakName }: Props) {
  const [failed, setFailed] = useState(false)

  if (webcam.embedType === 'link' || failed) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg bg-sl-dark">
        <a
          href={webcam.fallbackUrl || webcam.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-2 rounded-lg px-6 py-4 text-sl-accent transition hover:bg-sl-surface"
        >
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <span className="text-sm font-medium">View Live Cam</span>
          <span className="text-xs text-sl-muted">{breakName}</span>
        </a>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-lg bg-black">
      <iframe
        src={webcam.url}
        title={`${breakName} live webcam`}
        className="h-[360px] w-full lg:h-[420px]"
        onError={() => setFailed(true)}
        sandbox="allow-same-origin allow-scripts"
        loading="lazy"
      />
      <a
        href={webcam.fallbackUrl || webcam.url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-sl-accent hover:bg-black/90"
      >
        Open cam
      </a>
    </div>
  )
}
