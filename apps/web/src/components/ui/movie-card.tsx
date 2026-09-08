'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Star, Plus, Check, Tv, Film, Eye } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CARD_RADIUS } from '@/lib/constants'
import { useWatchlist } from '@/components/providers/watchlist-provider'
import { useWatched } from '@/components/providers/watched-provider'

interface MovieCardProps {
  id: number
  title: string
  posterPath: string | null
  rating: number | null
  year: string | null
  language?: string | null
  mediaType?: string
  className?: string
  watchProviders?: any
}

export function MovieCard({
  id,
  title,
  posterPath,
  rating,
  year,
  language,
  mediaType = 'movie',
  className,
  watchProviders,
}: MovieCardProps) {
  const { isWatchlisted, addToWatchlist, removeFromWatchlist } = useWatchlist()
  const { isWatched } = useWatched()
  const added = isWatchlisted(id)
  const watched = isWatched(id)

  // Get streaming platforms for India (IN) as default, fallback to US
  const countryData = watchProviders?.IN || watchProviders?.US
  const streamProviders = countryData?.flatrate || []
  // Take up to 3 providers
  const displayProviders = streamProviders.slice(0, 3)

  const imageUrl = posterPath
    ? `https://image.tmdb.org/t/p/w342${posterPath}`
    : null

  const handleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      if (added) {
        await removeFromWatchlist(id, mediaType)
      } else {
        await addToWatchlist(id, mediaType)
      }
    } catch (err) {
      alert('Please sign in to modify your watchlist.')
    }
  }

  return (
    <Link
      href={`/movie/${id}?type=${mediaType}`}
      className={cn(
        'group relative flex-shrink-0 cursor-pointer transition-transform duration-200 hover:scale-[1.03] block',
        className
      )}
    >
      {/* Poster */}
      <div className={cn("relative aspect-[2/3] w-full bg-muted overflow-hidden", CARD_RADIUS)}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <span className="text-sm">No Image</span>
          </div>
        )}

      {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100" />

        {/* Watchlist button */}
        <button 
          onClick={handleWatchlist}
          className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-md transition-all hover:bg-primary group-hover:opacity-100"
        >
          {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>

        {/* Rating badge */}
        {rating !== null && rating > 0 && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-yellow-400 backdrop-blur-md">
            <Star className="h-3 w-3 fill-yellow-400" />
            {rating.toFixed(1)}
          </div>
        )}

        {/* Language chip */}
        {language && (
          <div className="absolute right-2 bottom-2 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground backdrop-blur-md opacity-0 transition-all duration-300 group-hover:opacity-100">
            {language}
          </div>
        )}

        {/* Watched badge */}
        {watched && (
          <div className="absolute left-2 bottom-2 flex items-center gap-1 rounded-full bg-green-600/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
            <Eye className="h-3 w-3" />
            Watched
          </div>
        )}
      </div>

      {/* Info - Clean below card */}
      <div className="mt-3 flex flex-col gap-1.5">
        <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{title}</h3>
        
        {/* Availability row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            {year && <span>{year}</span>}
            {year && <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />}
            <div className="flex items-center gap-1">
              {mediaType === 'tv' ? <Tv className="h-3 w-3" /> : <Film className="h-3 w-3" />}
              <span className="uppercase tracking-wide text-[10px] font-bold">{mediaType === 'tv' ? 'Series' : 'Movie'}</span>
            </div>
          </div>
          
          {/* OTT Providers */}
          {displayProviders.length > 0 && (
            <div className="flex items-center gap-1.5">
              {displayProviders.map((provider: any) => (
                <div 
                  key={provider.provider_id} 
                  className="relative h-4 w-4 rounded-sm overflow-hidden" 
                  title={`${provider.provider_name} — Available to stream`}
                >
                  <Image
                    src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`}
                    alt={provider.provider_name}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
