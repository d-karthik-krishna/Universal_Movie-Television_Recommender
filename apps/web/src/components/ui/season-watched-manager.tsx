'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Check, ChevronDown, Tv, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Season } from '@/lib/services/content'
import { getSeriesProgress, saveSeasonProgress } from '@/lib/services/watch-history'
import { useWatched } from '@/components/providers/watched-provider'
import { useWatchlist } from '@/components/providers/watchlist-provider'

interface SeasonProgress {
  watched_all: boolean
  watched_episodes: number[]
  total_episodes: number
}

interface SeasonWatchedManagerProps {
  tmdbId: number
  seasons: Season[]
  onClose: () => void
}

export function SeasonWatchedManager({ tmdbId, seasons, onClose }: SeasonWatchedManagerProps) {
  const { markAsWatched } = useWatched()
  const { removeFromWatchlistState } = useWatchlist()
  const [progress, setProgress] = useState<Record<string, SeasonProgress>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null)

  // Filter out specials (season 0)
  const displaySeasons = seasons.filter(s => s.season_number > 0 || seasons.length === 1)

  const loadProgress = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getSeriesProgress(tmdbId)
      setProgress(data)
    } catch (err) {
      console.error('Failed to load progress:', err)
    } finally {
      setLoading(false)
    }
  }, [tmdbId])

  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  const handleWatchEntireSeason = async (season: Season) => {
    setSaving(season.season_number)
    try {
      // Also ensure the series is marked as watched at the top level
      try { await markAsWatched(tmdbId, 'tv') } catch {}
      
      await saveSeasonProgress(
        tmdbId,
        season.season_number,
        true,
        [],
        season.episode_count
      )
      setProgress(prev => {
        const newProgress = {
          ...prev,
          [String(season.season_number)]: {
            watched_all: true,
            watched_episodes: [],
            total_episodes: season.episode_count
          }
        }
        
        const watchedCount = displaySeasons.filter(s => newProgress[String(s.season_number)]?.watched_all).length
        if (watchedCount >= displaySeasons.length) {
          removeFromWatchlistState(tmdbId)
        }
        
        return newProgress
      })
    } catch (err) {
      alert('Please sign in to track watched content.')
    } finally {
      setSaving(null)
    }
  }

  const handleToggleEpisode = async (season: Season, episodeNum: number) => {
    const key = String(season.season_number)
    const current = progress[key] || { watched_all: false, watched_episodes: [], total_episodes: season.episode_count }
    
    let newEpisodes: number[]
    if (current.watched_all) {
      // Switching from "all" to individual: uncheck this one episode
      newEpisodes = Array.from({ length: season.episode_count }, (_, i) => i + 1).filter(e => e !== episodeNum)
    } else if (current.watched_episodes.includes(episodeNum)) {
      newEpisodes = current.watched_episodes.filter(e => e !== episodeNum)
    } else {
      newEpisodes = [...current.watched_episodes, episodeNum].sort((a, b) => a - b)
    }

    const watchedAll = newEpisodes.length === season.episode_count

    // Optimistic update
    setProgress(prev => {
      const newProgress = {
        ...prev,
        [key]: {
          watched_all: watchedAll,
          watched_episodes: watchedAll ? [] : newEpisodes,
          total_episodes: season.episode_count
        }
      }
      
      const watchedCount = displaySeasons.filter(s => newProgress[String(s.season_number)]?.watched_all).length
      if (watchedCount >= displaySeasons.length) {
        removeFromWatchlistState(tmdbId)
      }
      
      return newProgress
    })

    try {
      try { await markAsWatched(tmdbId, 'tv') } catch {}
      await saveSeasonProgress(
        tmdbId,
        season.season_number,
        watchedAll,
        watchedAll ? [] : newEpisodes,
        season.episode_count
      )
    } catch (err) {
      // Revert on failure
      setProgress(prev => ({
        ...prev,
        [key]: current
      }))
    }
  }

  const handleUnmarkSeason = async (season: Season) => {
    const key = String(season.season_number)
    const current = progress[key]
    
    // Optimistic update
    setProgress(prev => {
      const newProgress = { ...prev }
      delete newProgress[key]
      return newProgress
    })

    try {
      await saveSeasonProgress(tmdbId, season.season_number, false, [], season.episode_count)
    } catch (err) {
      if (current) {
        setProgress(prev => ({ ...prev, [key]: current }))
      }
    }
  }

  const getSeasonStatus = (season: Season): string => {
    const key = String(season.season_number)
    const sp = progress[key]
    if (!sp) return 'Not watched'
    if (sp.watched_all) return 'Entire season watched ✓'
    if (sp.watched_episodes.length > 0) return `${sp.watched_episodes.length}/${sp.total_episodes} episodes watched`
    return 'Not watched'
  }

  const isEpisodeWatched = (season: Season, episodeNum: number): boolean => {
    const key = String(season.season_number)
    const sp = progress[key]
    if (!sp) return false
    if (sp.watched_all) return true
    return sp.watched_episodes.includes(episodeNum)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative mx-4 max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Manage Watched Seasons</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-secondary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {displaySeasons.map(season => {
              const key = String(season.season_number)
              const sp = progress[key]
              const hasProgress = sp && (sp.watched_all || sp.watched_episodes.length > 0)
              const isExpanded = expandedSeason === season.season_number
              const isSaving = saving === season.season_number

              return (
                <div key={season.id} className="rounded-xl border border-border bg-background overflow-hidden">
                  {/* Season header */}
                  <div className="flex items-center gap-3 p-4">
                    <Tv className={cn("h-5 w-5 flex-none", hasProgress ? "text-green-400" : "text-muted-foreground")} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{season.name}</h3>
                      <p className={cn(
                        "text-xs mt-0.5",
                        hasProgress ? "text-green-400 font-medium" : "text-muted-foreground"
                      )}>
                        {getSeasonStatus(season)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!hasProgress ? (
                        <button
                          onClick={() => handleWatchEntireSeason(season)}
                          disabled={isSaving}
                          className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                        >
                          {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Watched All'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnmarkSeason(season)}
                          className="rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          Unmark
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedSeason(isExpanded ? null : season.season_number)}
                        className="rounded-full p-1.5 hover:bg-secondary transition-colors"
                      >
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          isExpanded ? "rotate-180" : ""
                        )} />
                      </button>
                    </div>
                  </div>

                  {/* Episode grid (expanded) */}
                  {isExpanded && (
                    <div className="border-t border-border px-4 py-3">
                      <p className="text-xs text-muted-foreground mb-3">Select individual episodes:</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: season.episode_count }, (_, i) => i + 1).map(ep => {
                          const epWatched = isEpisodeWatched(season, ep)
                          return (
                            <button
                              key={ep}
                              onClick={() => handleToggleEpisode(season, ep)}
                              className={cn(
                                "h-9 w-9 rounded-lg text-xs font-bold transition-all",
                                epWatched
                                  ? "bg-green-600 text-white shadow-sm shadow-green-500/30"
                                  : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                              )}
                            >
                              {ep}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
