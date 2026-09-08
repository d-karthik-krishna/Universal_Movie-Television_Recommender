'use client'

import { Suspense, useState, useEffect } from 'react'
import { MovieCard } from '@/components/ui/movie-card'
import { AccordionGallery } from '@/components/ui/accordion-gallery'
import { Loader2 } from 'lucide-react'
import { API_URL } from '@/lib/constants'
import { useSearchParams } from 'next/navigation'

const LANGUAGES = [
  { code: 'te', label: 'Telugu' },
  { code: 'ta', label: 'Tamil' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'kn', label: 'Kannada' },
  { code: 'ko', label: 'Korean' },
  { code: 'ja', label: 'Japanese' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'tr', label: 'Turkish' },
  { code: 'de', label: 'German' },
  { code: 'bn', label: 'Bengali' },
  { code: 'en', label: 'English' },
  { code: 'mr', label: 'Marathi' },
]

const GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 18, name: 'Drama' },
  { id: 14, name: 'Fantasy' },
  { id: 27, name: 'Horror' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
]

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'primary_release_date.desc', label: 'Newest First' },
  { value: 'revenue.desc', label: 'Highest Revenue' },
]

interface DiscoverResult {
  id: number
  title?: string
  name?: string
  poster_path?: string
  backdrop_path?: string
  vote_average?: number
  release_date?: string
  first_air_date?: string
  original_language?: string
  media_type?: string
  content_type?: string
}

function ExploreContent() {
  const searchParams = useSearchParams()
  
  const [language, setLanguage] = useState(searchParams.get('lang') || '')
  const [genre, setGenre] = useState(searchParams.get('genre') || '')
  const [country, setCountry] = useState(searchParams.get('country') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'popularity.desc')
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>((searchParams.get('type') as 'movie'|'tv') || 'movie')
  
  // Sync state with URL if user navigates via link
  useEffect(() => {
    const lang = searchParams.get('lang')
    const gen = searchParams.get('genre')
    const ctry = searchParams.get('country')
    const type = searchParams.get('type') as 'movie' | 'tv'
    const sort = searchParams.get('sort')
    
    if (lang !== null) setLanguage(lang)
    if (gen !== null) setGenre(gen)
    if (ctry !== null) setCountry(ctry)
    if (type !== null) setMediaType(type)
    if (sort !== null) setSortBy(sort)
  }, [searchParams])
  
  const [results, setResults] = useState<DiscoverResult[]>([])
  const [loading, setLoading] = useState(false)

  const fetchResults = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('media_type', mediaType)
      params.append('sort_by', sortBy)
      if (language) params.append('with_original_language', language)
      if (genre) params.append('with_genres', genre)
      if (country) params.append('with_origin_country', country)

      const res = await fetch(`${API_URL}/api/v1/content/discover?${params.toString()}`)
      const data = await res.json()
      setResults(data.results || [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()
  }, [language, genre, sortBy, mediaType, country])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Explore</h1>
        <p className="mt-1 text-muted-foreground">Discover movies from around the world</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Media Type Toggle */}
        <div className="flex rounded-full border border-border overflow-hidden">
          <button
            onClick={() => setMediaType('movie')}
            className={`px-5 py-2 text-sm font-semibold transition-colors ${
              mediaType === 'movie' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            Movies
          </button>
          <button
            onClick={() => setMediaType('tv')}
            className={`px-5 py-2 text-sm font-semibold transition-colors ${
              mediaType === 'tv' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            TV Shows
          </button>
        </div>

        {/* Country Filter */}
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">All Countries</option>
          <option value="US">United States</option>
          <option value="IN">India</option>
          <option value="KR">South Korea</option>
          <option value="JP">Japan</option>
          <option value="GB">United Kingdom</option>
          <option value="FR">France</option>
        </select>

        {/* Language Filter */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">All Languages</option>
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>

        {/* Genre Filter */}
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">All Genres</option>
          {GENRES.map((g) => (
            <option key={g.id} value={String(g.id)}>{g.name}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-12">
          {results.length >= 5 && (
            <section className="animate-in fade-in zoom-in duration-500 hidden md:block">
              <h2 className="text-xl font-bold mb-4">Featured Matches</h2>
              <AccordionGallery
                items={results.slice(0, 5).map((item) => ({
                  image: `https://image.tmdb.org/t/p/w1280${item.backdrop_path || item.poster_path}`,
                  label: item.title || item.name || 'Unknown',
                  link: `/movie/${item.id}?type=${item.content_type || item.media_type || mediaType}`,
                  alt: item.title || item.name || 'Unknown'
                }))}
                height={380}
                expandRatio={0.45}
              />
            </section>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {results.map((item) => (
            <MovieCard
              key={item.id}
              id={item.id}
              title={item.title || item.name || ''}
              posterPath={item.poster_path || null}
              rating={item.vote_average ?? null}
              year={item.release_date ? item.release_date.substring(0, 4) : item.first_air_date ? item.first_air_date.substring(0, 4) : null}
              language={item.original_language?.toUpperCase()}
              mediaType={item.content_type || item.media_type || mediaType}
              watchProviders={item.watch_providers}
            />
          ))}
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-muted-foreground">
          No results found. Try different filters.
        </div>
      )}
    </div>
  )
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ExploreContent />
    </Suspense>
  )
}
