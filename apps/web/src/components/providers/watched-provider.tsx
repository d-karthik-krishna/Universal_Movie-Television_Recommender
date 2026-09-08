'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { markAsWatched as serverMarkAsWatched, unmarkAsWatched as serverUnmarkAsWatched } from '@/lib/services/watch-history'

interface WatchedContextType {
  watched: Set<number>
  markAsWatched: (tmdbId: number, mediaType: string) => Promise<void>
  unmarkAsWatched: (tmdbId: number, mediaType: string) => Promise<void>
  isWatched: (tmdbId: number) => boolean
}

const WatchedContext = createContext<WatchedContextType | undefined>(undefined)

export function WatchedProvider({ 
  children, 
  initialIds 
}: { 
  children: ReactNode, 
  initialIds: number[] 
}) {
  const [watched, setWatched] = useState<Set<number>>(new Set(initialIds))

  const markAsWatched = async (tmdbId: number, mediaType: string) => {
    setWatched(prev => {
      const newSet = new Set(prev)
      newSet.add(tmdbId)
      return newSet
    })
    
    try {
      await serverMarkAsWatched(tmdbId, mediaType)
    } catch (err) {
      setWatched(prev => {
        const newSet = new Set(prev)
        newSet.delete(tmdbId)
        return newSet
      })
      throw err
    }
  }

  const unmarkAsWatched = async (tmdbId: number, mediaType: string) => {
    setWatched(prev => {
      const newSet = new Set(prev)
      newSet.delete(tmdbId)
      return newSet
    })
    
    try {
      await serverUnmarkAsWatched(tmdbId, mediaType)
    } catch (err) {
      setWatched(prev => {
        const newSet = new Set(prev)
        newSet.add(tmdbId)
        return newSet
      })
      throw err
    }
  }

  const isWatched = (tmdbId: number) => watched.has(tmdbId)

  return (
    <WatchedContext.Provider value={{ watched, markAsWatched, unmarkAsWatched, isWatched }}>
      {children}
    </WatchedContext.Provider>
  )
}

export function useWatched() {
  const context = useContext(WatchedContext)
  if (context === undefined) {
    throw new Error('useWatched must be used within a WatchedProvider')
  }
  return context
}
