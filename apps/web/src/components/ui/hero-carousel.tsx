'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sparkles, ChevronLeft, ChevronRight, Film, Tv } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface HeroItem {
  id: number | string
  title?: string
  name?: string
  overview?: string
  backdrop_path?: string
  media_type?: string
}

export function HeroCarousel({ items }: { items: HeroItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!items?.length) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, 8000) // Auto-slide every 8 seconds
    return () => clearInterval(timer)
  }, [items])

  if (!items?.length) return (
    <div className="p-16 text-center text-muted-foreground bg-card rounded-3xl border border-border">
      Loading featured content...
    </div>
  )

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-card shadow-sm border border-border group aspect-[21/9] md:aspect-[2.5/1]">
      <div 
        className="flex transition-transform duration-700 ease-out h-full w-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {items.map((item, idx) => {
          const isTV = item.media_type === 'tv'
          return (
            <div key={item.id} className="relative h-full w-full flex-shrink-0">
              {item.backdrop_path ? (
                <img 
                  src={`https://image.tmdb.org/t/p/original${item.backdrop_path}`} 
                  alt={item.title || item.name || ''}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 h-full w-full bg-muted" />
              )}
              {/* Gradient overlay for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              
              <div className="absolute bottom-0 left-0 p-8 md:p-16 max-w-3xl flex flex-col justify-end h-full">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-md bg-primary/20 px-3 py-1 text-xs font-bold text-primary backdrop-blur-md">
                    <Sparkles className="h-3 w-3" />
                    <span>Trending #{idx + 1}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-md bg-white/10 border border-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-md uppercase tracking-wider">
                    {isTV ? <Tv className="h-3 w-3" /> : <Film className="h-3 w-3" />}
                    <span>{isTV ? 'TV Series' : 'Movie'}</span>
                  </div>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-foreground md:text-6xl drop-shadow-sm">
                  {item.title || item.name}
                </h1>
              <p className="mt-4 text-sm md:text-lg font-medium text-muted-foreground line-clamp-2 md:line-clamp-3">
                {item.overview}
              </p>
              <div className="mt-8 flex items-center gap-4">
                <Link 
                  href={`/movie/${item.id}?type=${item.media_type || 'movie'}`}
                  className="rounded-full bg-primary px-8 py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105 shadow-md inline-flex"
                >
                  More Info
                </Link>
              </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Navigation Controls */}
      <button 
        onClick={() => setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1))}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white opacity-0 backdrop-blur-md transition-all hover:bg-black/80 hover:scale-110 group-hover:opacity-100 z-10"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button 
        onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white opacity-0 backdrop-blur-md transition-all hover:bg-black/80 hover:scale-110 group-hover:opacity-100 z-10"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 z-10">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={cn(
              "h-2 rounded-full transition-all duration-300 shadow-sm",
              idx === currentIndex ? "w-8 bg-primary" : "w-2 bg-white/50 hover:bg-white/90"
            )}
          />
        ))}
      </div>
    </div>
  )
}
