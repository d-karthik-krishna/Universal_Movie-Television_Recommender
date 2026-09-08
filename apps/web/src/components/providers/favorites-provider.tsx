'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { markAsFavorite as serverMarkAsFavorite, unmarkAsFavorite as serverUnmarkAsFavorite } from '@/lib/services/favorites'

interface FavoritesContextType {
  favorites: Set<number>
  markAsFavorite: (tmdbId: number, mediaType: string) => Promise<void>
  unmarkAsFavorite: (tmdbId: number, mediaType: string) => Promise<void>
  isFavorited: (tmdbId: number) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ 
  children, 
  initialIds 
}: { 
  children: ReactNode, 
  initialIds: number[] 
}) {
  const [favorites, setFavorites] = useState<Set<number>>(new Set(initialIds))

  const markAsFavorite = async (tmdbId: number, mediaType: string) => {
    // Optimistic UI update
    setFavorites(prev => {
      const newSet = new Set(prev)
      newSet.add(tmdbId)
      return newSet
    })
    
    try {
      await serverMarkAsFavorite(tmdbId, mediaType)
    } catch (err) {
      // Revert if failed
      setFavorites(prev => {
        const newSet = new Set(prev)
        newSet.delete(tmdbId)
        return newSet
      })
      throw err
    }
  }

  const unmarkAsFavorite = async (tmdbId: number, mediaType: string) => {
    // Optimistic UI update
    setFavorites(prev => {
      const newSet = new Set(prev)
      newSet.delete(tmdbId)
      return newSet
    })
    
    try {
      await serverUnmarkAsFavorite(tmdbId, mediaType)
    } catch (err) {
      // Revert if failed
      setFavorites(prev => {
        const newSet = new Set(prev)
        newSet.add(tmdbId)
        return newSet
      })
      throw err
    }
  }

  const isFavorited = (tmdbId: number) => favorites.has(tmdbId)

  return (
    <FavoritesContext.Provider value={{ favorites, markAsFavorite, unmarkAsFavorite, isFavorited }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}
