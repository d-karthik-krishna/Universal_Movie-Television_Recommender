'use client'

import { useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWatched } from '@/components/providers/watched-provider'
import { useWatchlist } from '@/components/providers/watchlist-provider'
import { Season } from '@/lib/services/content'
import { SeasonWatchedManager } from '@/components/ui/season-watched-manager'

interface WatchedButtonProps {
  tmdbId: number
  mediaType: string
  seasons?: Season[]
}

export function WatchedButton({ tmdbId, mediaType, seasons }: WatchedButtonProps) {
  const { isWatched, markAsWatched, unmarkAsWatched } = useWatched()
  const { removeFromWatchlistState } = useWatchlist()
  const watched = isWatched(tmdbId)
  const [loading, setLoading] = useState(false)
  const [showSeasonManager, setShowSeasonManager] = useState(false)

  const handleClick = async () => {
    // For TV series, open the season manager instead of simple toggle
    if (mediaType === 'tv' && seasons && seasons.length > 0) {
      setShowSeasonManager(true)
      return
    }

    // For movies, simple toggle
    setLoading(true)
    try {
      if (watched) {
        await unmarkAsWatched(tmdbId, mediaType)
      } else {
        await markAsWatched(tmdbId, mediaType)
        if (mediaType === 'movie' || !seasons || seasons.length === 0) {
          removeFromWatchlistState(tmdbId)
        }
      }
    } catch (err) {
      alert('Please sign in to track your watched content.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={cn(
          'flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all hover:scale-105 shadow-md',
          watched
            ? 'bg-green-600/20 text-green-400 border border-green-500/50'
            : 'bg-secondary/80 text-secondary-foreground border border-border hover:bg-secondary'
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : watched ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
        {loading
          ? 'Updating...'
          : watched
          ? mediaType === 'tv' ? 'Watched · Manage' : 'Watched ✓'
          : mediaType === 'tv' ? 'Mark Seasons Watched' : 'Mark as Watched'
        }
      </button>

      {/* Season manager modal for TV series */}
      {showSeasonManager && seasons && (
        <SeasonWatchedManager
          tmdbId={tmdbId}
          seasons={seasons}
          onClose={() => setShowSeasonManager(false)}
        />
      )}
    </>
  )
}
