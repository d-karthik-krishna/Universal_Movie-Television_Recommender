import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Hero Backdrop Skeleton */}
      <section className="relative -mx-4 -mt-6 md:-mx-8 overflow-hidden">
        <div className="relative aspect-[21/9] w-full md:aspect-[2.5/1]">
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>

        {/* Content overlay Skeleton */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 md:px-8">
          <div className="mx-auto flex max-w-[1440px] items-end gap-8">
            {/* Poster Skeleton */}
            <div className="hidden md:block w-[200px] flex-none overflow-hidden rounded-xl shadow-lg border border-border">
              <Skeleton className="h-[300px] w-[200px]" />
            </div>
            
            <div className="flex-1 w-full space-y-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-12 w-3/4 md:w-1/2" />
              
              <div className="mt-4 flex gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>

              <div className="mt-3 flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>

              <div className="mt-6 flex gap-4">
                <Skeleton className="h-12 w-32 rounded-full" />
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Skeleton */}
      <section className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <Skeleton className="h-8 w-40" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[95%]" />
            <Skeleton className="h-4 w-[80%]" />
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
