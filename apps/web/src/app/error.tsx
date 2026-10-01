'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="flex flex-col min-h-[60vh] items-center justify-center p-8">
      <div className="text-center space-y-4 max-w-4xl w-full">
        <h2 className="text-2xl font-bold text-red-500">Something went wrong</h2>
        <p className="text-muted-foreground">
          {error.message || 'An unexpected error occurred.'}
        </p>
        
        <div className="bg-red-500/10 border border-red-500/20 text-left p-4 rounded-md overflow-x-auto my-4">
          <h3 className="font-bold text-red-400 mb-2">Stack Trace:</h3>
          <pre className="text-xs font-mono text-red-300 whitespace-pre-wrap">
            {error.stack || 'No stack trace available.'}
          </pre>
        </div>

        <button
          onClick={reset}
          className="rounded-lg bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
