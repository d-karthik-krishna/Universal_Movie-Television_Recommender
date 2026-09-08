'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Season } from '@/lib/services/content'
import { ChevronDown, Tv } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SeasonList({ seasons }: { seasons: Season[] }) {
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null)

  if (!seasons || seasons.length === 0) return null

  // Filter out season 0 (Usually Specials in TMDB) unless it's the only one
  const displaySeasons = seasons.filter(s => s.season_number > 0 || seasons.length === 1)

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">Seasons</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displaySeasons.map((season) => {
          const isExpanded = expandedSeason === season.id
          
          return (
            <div 
              key={season.id} 
              className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer transition-all hover:border-primary group hover:shadow-md"
              onClick={() => setExpandedSeason(isExpanded ? null : season.id)}
            >
              <div className="flex items-center gap-4 p-3">
                <div className="h-20 w-14 flex-none bg-muted rounded-md overflow-hidden relative">
                  {season.poster_path ? (
                    <Image 
                      src={`https://image.tmdb.org/t/p/w154${season.poster_path}`} 
                      alt={season.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Tv className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                    {season.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {season.air_date ? new Date(season.air_date).getFullYear() : 'TBA'}
                  </p>
                  
                  <div className={cn(
                    "mt-2 overflow-hidden transition-all duration-300",
                    isExpanded ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
                  )}>
                    <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-bold">
                      <Tv className="h-3 w-3" />
                      {season.episode_count} Episodes
                    </div>
                  </div>
                </div>
                <div className="px-2 text-muted-foreground">
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    isExpanded ? "rotate-180 text-primary" : "rotate-0"
                  )} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
