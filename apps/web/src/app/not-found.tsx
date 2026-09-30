import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-foreground">404</h2>
        <p className="text-lg text-muted-foreground">This page could not be found.</p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
