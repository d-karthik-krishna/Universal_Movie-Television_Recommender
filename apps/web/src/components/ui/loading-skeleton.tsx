import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { CARD_RADIUS } from '@/lib/constants'

export function MovieCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex-shrink-0 overflow-hidden',
        CARD_RADIUS,
        className
      )}
    >
      <Skeleton className="aspect-[2/3] w-full" />
      <div className="bg-card p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-1.5 h-3 w-1/3" />
      </div>
    </div>
  )
}

export function CarouselSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} className="w-[180px]" />
      ))}
    </div>
  )
}

export function HeroSkeleton() {
  return (
    <div className="relative h-[500px] w-full overflow-hidden rounded-[24px]">
      <Skeleton className="h-full w-full" />
    </div>
  )
}
