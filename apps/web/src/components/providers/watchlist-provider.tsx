'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { addToWatchlist as serverAddToWatchlist, removeFromWatchlist as serverRemoveFromWatchlist } from '@/lib/services/actions'

interface WatchlistContextType {
  watchlist: Set<number>
  addToWatchlist: (tmdbId: number, mediaType: string) => Promise<void>
  removeFromWatchlist: (tmdbId: number, mediaType: string) => Promise<void>
  removeFromWatchlistState: (tmdbId: number) => void
  isWatchlisted: (tmdbId: number) => boolean
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined)

export function WatchlistProvider({ 
  children, 
  initialIds 
}: { 
  children: ReactNode, 
  initialIds: number[] 
}) {
  const [watchlist, setWatchlist] = useState<Set<number>>(new Set(initialIds))

  const addToWatchlist = async (tmdbId: number, mediaType: string) => {
    // Optimistic UI update
    setWatchlist(prev => {
      const newSet = new Set(prev)
      newSet.add(tmdbId)
      return newSet
    })
    
    try {
      await serverAddToWatchlist(tmdbId, mediaType)
    } catch (err) {
      // Revert if failed
      setWatchlist(prev => {
        const newSet = new Set(prev)
        newSet.delete(tmdbId)
        return newSet
      })
      throw err
    }
  }

  const removeFromWatchlist = async (tmdbId: number, mediaType: string) => {
    // Optimistic UI update
    setWatchlist(prev => {
      const newSet = new Set(prev)
      newSet.delete(tmdbId)
      return newSet
    })
    
    try {
      await serverRemoveFromWatchlist(tmdbId, mediaType)
    } catch (err) {
      // Revert if failed
      setWatchlist(prev => {
        const newSet = new Set(prev)
        newSet.add(tmdbId)
        return newSet
      })
      throw err
    }
  }

  const removeFromWatchlistState = (tmdbId: number) => {
    setWatchlist(prev => {
      const newSet = new Set(prev)
      newSet.delete(tmdbId)
      return newSet
    })
  }

  const isWatchlisted = (tmdbId: number) => watchlist.has(tmdbId)

  return (
    <WatchlistContext.Provider value={{ watchlist, addToWatchlist, removeFromWatchlist, removeFromWatchlistState, isWatchlisted }}>
      {children}
    </WatchlistContext.Provider>
  )
}

export function useWatchlist() {
  const context = useContext(WatchlistContext)
  if (context === undefined) {
    throw new Error('useWatchlist must be used within a WatchlistProvider')
  }
  return context
}
