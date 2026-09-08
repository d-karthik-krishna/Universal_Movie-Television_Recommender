'use client'

import React, { useState } from 'react'
import { Heart } from 'lucide-react'
import { useFavorites } from '../providers/favorites-provider'
import { useRouter } from 'next/navigation'

import { useWatched } from '../providers/watched-provider'

interface FavoriteButtonProps {
  tmdbId: number
  mediaType: string
}

export function FavoriteButton({ tmdbId, mediaType }: FavoriteButtonProps) {
  const { isFavorited, markAsFavorite, unmarkAsFavorite } = useFavorites()
  const { isWatched } = useWatched()
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const favorited = isFavorited(tmdbId)
  const watched = isWatched(tmdbId)

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!watched) return

    setLoading(true)
    try {
      if (favorited) {
        await unmarkAsFavorite(tmdbId, mediaType)
      } else {
        await markAsFavorite(tmdbId, mediaType)
      }
    } catch (error) {
      if ((error as Error).message.includes('Not authenticated')) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!watched) {
    return (
      <button
        disabled
        title="Watch this first to add it to Favorites."
        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary/50 px-4 py-3 text-sm font-semibold text-muted-foreground opacity-70 cursor-not-allowed"
      >
        <Heart className="h-5 w-5" />
        <span>Favorite 🔒</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
        favorited
          ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
          : 'bg-secondary text-foreground hover:bg-secondary/80'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Heart className={`h-5 w-5 ${favorited ? 'fill-current' : ''}`} />
      <span>{favorited ? 'Favorited' : 'Add to Favorites'}</span>
    </button>
  )
}
