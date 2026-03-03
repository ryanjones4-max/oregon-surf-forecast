import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-sl-bg p-8">
      <h1 className="text-2xl font-bold text-white">Page not found</h1>
      <p className="text-sl-muted">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link
        href="/"
        className="rounded-lg bg-sl-accent px-4 py-2 font-medium text-white hover:bg-sl-accent/80"
      >
        Browse All Oregon Breaks
      </Link>
    </div>
  )
}
