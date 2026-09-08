'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { MovieCard } from '@/components/ui/movie-card'
import { Search as SearchIcon, Loader2, Film, Tv } from 'lucide-react'
import { API_URL } from '@/lib/constants'
import { searchContent } from '@/lib/services/content'

interface SearchResult {
  id: number
  title?: string
  name?: string
  poster_path?: string
  vote_average?: number
  release_date?: string
  first_air_date?: string
  original_language?: string
  media_type?: string
  overview?: string
  watch_providers?: any
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('q') || ''
  
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [totalResults, setTotalResults] = useState(0)

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchContainerRef = useRef<HTMLFormElement>(null)

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const performSearch = async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/content/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      // Filter to only movies and tv shows (exclude people)
      const filtered = (data.results || []).filter(
        (r: SearchResult) => r.media_type === 'movie' || r.media_type === 'tv'
      )
      setResults(filtered)
      setTotalResults(data.total_results || 0)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery)
    }
  }, [initialQuery])

  // Debounced autocomplete search
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    // Don't show dropdown if the query matches the one just fully searched
    if (query.trim() === initialQuery.trim() && !showDropdown) {
      return
    }

    const timer = setTimeout(async () => {
      setIsSearchingSuggestions(true)
      try {
        const res = await searchContent(query.trim())
        const results = res.results?.filter((r: any) => r.media_type !== 'person').slice(0, 8) || []
        setSuggestions(results)
        setShowDropdown(true)
        setSelectedIndex(-1)
      } catch (e) {
        console.error(e)
      } finally {
        setIsSearchingSuggestions(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [query])

  const navigateToContent = (item: SearchResult) => {
    router.push(`/movie/${item.id}?type=${item.media_type || 'movie'}`)
    setShowDropdown(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      navigateToContent(suggestions[selectedIndex])
      return
    }
    
    setShowDropdown(false)
    performSearch(query)
    // Update URL without full reload
    window.history.replaceState(null, '', `/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <form ref={searchContainerRef} onSubmit={handleSubmit} className="mx-auto max-w-2xl relative z-40">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.trim() && suggestions.length > 0) setShowDropdown(true)
            }}
            placeholder="Search movies, TV shows..."
            className="w-full rounded-full border border-border bg-card py-4 pl-12 pr-6 text-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
            autoFocus
          />
        </div>

        {/* Autocomplete Dropdown */}
        {showDropdown && query.trim() !== '' && (
          <div className="absolute top-full mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg py-2">
            {isSearchingSuggestions && suggestions.length === 0 ? (
              <div className="px-4 py-4 text-center text-muted-foreground animate-pulse">Searching...</div>
            ) : suggestions.length > 0 ? (
              <div className="flex flex-col">
                {suggestions.map((item, idx) => (
                  <div
                    key={`${item.media_type}-${item.id}`}
                    onClick={() => navigateToContent(item)}
                    className={`flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors ${
                      idx === selectedIndex ? 'bg-secondary' : 'hover:bg-muted'
                    }`}
                  >
                    {/* Poster */}
                    <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.poster_path ? (
                        <Image 
                          src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} 
                          alt={item.title || item.name || 'Poster'} 
                          fill 
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <Film className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    
                    {/* Details */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate text-base font-semibold">{item.title || item.name}</span>
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mt-1">
                        <span>
                          {item.release_date ? item.release_date.substring(0, 4) : item.first_air_date ? item.first_air_date.substring(0, 4) : 'N/A'}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                        <div className="flex items-center gap-1">
                          {item.media_type === 'tv' ? <Tv className="h-3.5 w-3.5" /> : <Film className="h-3.5 w-3.5" />}
                          <span className="uppercase">{item.media_type === 'tv' ? 'Series' : 'Movie'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-4 text-center text-muted-foreground">
                No movies or series found.
              </div>
            )}
          </div>
        )}
      </form>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : results.length > 0 ? (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            Found {totalResults} results for &ldquo;{initialQuery || query}&rdquo;
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {results.map((item) => (
              <MovieCard
                key={item.id}
                id={item.id}
                title={item.title || item.name || ''}
                posterPath={item.poster_path || null}
                rating={item.vote_average ?? null}
                year={
                  item.release_date
                    ? item.release_date.substring(0, 4)
                    : item.first_air_date
                    ? item.first_air_date.substring(0, 4)
                    : null
                }
                language={item.original_language?.toUpperCase()}
                mediaType={item.media_type || 'movie'}
                watchProviders={item.watch_providers}
              />
            ))}
          </div>
        </div>
      ) : initialQuery || query ? (
        <div className="py-20 text-center text-muted-foreground">
          No results found. Try a different search term.
        </div>
      ) : (
        <div className="py-20 text-center text-muted-foreground">
          Type something to start searching.
        </div>
      )}
    </div>
  )
}
