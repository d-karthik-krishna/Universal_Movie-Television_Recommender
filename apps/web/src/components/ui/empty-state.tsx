import { Film } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export function EmptyState({
  title = 'Nothing here yet',
  description = 'Content will appear here once available.',
  icon,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[20px] border border-dashed border-border bg-card/50 px-6 py-16 text-center',
        className
      )}
    >
      <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
        {icon || <Film className="h-8 w-8" />}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  )
}
