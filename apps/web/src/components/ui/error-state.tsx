import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An error occurred while loading content. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[20px] border border-destructive/20 bg-destructive/5 px-6 py-16 text-center',
        className
      )}
    >
      <div className="mb-4 rounded-full bg-destructive/10 p-4 text-destructive">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {onRetry && (
        <button
          className="mt-6 rounded-[14px] border border-border bg-secondary px-6 py-2 text-sm font-medium transition-colors hover:bg-secondary/80"
          onClick={onRetry}
        >
          Try Again
        </button>
      )}
    </div>
  )
}
