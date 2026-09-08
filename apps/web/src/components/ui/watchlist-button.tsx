'use client'

import { useState } from 'react'
import { Plus, Check } from 'lucide-react'
import { useWatchlist } from '@/components/providers/watchlist-provider'

interface Props {
  tmdbId: number
  mediaType: string
}

export function WatchlistButton({ tmdbId, mediaType }: Props) {
  const { isWatchlisted, addToWatchlist, removeFromWatchlist } = useWatchlist()
  const added = isWatchlisted(tmdbId)
  const [loading, setLoading] = useState(false)

  const handleWatchlist = async () => {
    setLoading(true)
    try {
      if (added) {
        await removeFromWatchlist(tmdbId, mediaType)
      } else {
        await addToWatchlist(tmdbId, mediaType)
      }
    } catch (err) {
      alert('Please sign in to modify your watchlist.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleWatchlist}
      disabled={loading || added}
      className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all shadow-md ${
        added 
          ? 'bg-secondary text-secondary-foreground' 
          : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary'
      }`}
    >
      {added ? (
        <>
          <Check className="h-4 w-4" />
          Added to Watchlist
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" />
          {loading ? 'Adding...' : 'Add to Watchlist'}
        </>
      )}
    </button>
  )
}
