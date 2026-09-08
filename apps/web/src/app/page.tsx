import { Sparkles, Globe, TrendingUp } from 'lucide-react'
import { SectionHeader } from '@/components/ui/section-header'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { MovieCard } from '@/components/ui/movie-card'
import { getTrendingContent, discoverContent, ContentResponse } from '@/lib/services/content'
import { getPersonalizedRecommendations } from '@/lib/services/recommendations'
import { getCurrentUser } from '@/lib/services/auth'
import { HeroCarousel } from '@/components/ui/hero-carousel'
import { AccordionGallery } from '@/components/ui/accordion-gallery'
import Link from 'next/link'

async function getMixedDiscover(params: any): Promise<ContentResponse> {
  const [movies, tv] = await Promise.all([
    discoverContent('movie', params).catch(() => ({ results: [], page: 1, total_pages: 1, total_results: 0 })),
    discoverContent('tv', params).catch(() => ({ results: [], page: 1, total_pages: 1, total_results: 0 }))
  ])
  
  const results = []
  const maxLen = Math.max(movies?.results?.length || 0, tv?.results?.length || 0)
  
  for (let i = 0; i < 10; i++) { // Interleave up to 10 each (20 total)
    if (movies?.results?.[i]) results.push({ ...movies.results[i], media_type: 'movie' })
    if (tv?.results?.[i]) results.push({ ...tv.results[i], media_type: 'tv' })
  }
  
  return { page: 1, results, total_pages: 1, total_results: results.length }
}

async function getPanIndianContent(): Promise<ContentResponse> {
  const languages = [
    { code: 'te', minVotes: 30 }, // Telugu
    { code: 'ta', minVotes: 30 }, // Tamil
    { code: 'ml', minVotes: 20 }, // Malayalam
    { code: 'kn', minVotes: 20 }, // Kannada
    { code: 'hi', minVotes: 150 }, // Hindi
  ]
  
  const promises = languages.map(lang => 
    getMixedDiscover({
      with_original_language: lang.code,
      sort_by: 'vote_average.desc',
      vote_count_gte: lang.minVotes
    })
  )
  
  const results = await Promise.all(promises)
  
  const mixed = []
  // Take top 4 from each language, interleaving them
  for (let i = 0; i < 4; i++) {
    results.forEach(res => {
      if (res.results[i]) mixed.push(res.results[i])
    })
  }
  
  return { page: 1, results: mixed, total_pages: 1, total_results: mixed.length }
}

export default async function HomePage() {
  const user = await getCurrentUser()
  
  let trending: ContentResponse | null = null
  let koreanThrillers: ContentResponse | null = null
  let indianCinema: ContentResponse | null = null
  let japaneseCinema: ContentResponse | null = null
  let animatedContent: ContentResponse | null = null
  let recommendations: ContentResponse | null = null
  let error = false

  try {
    // Fetch multiple rows in parallel
    const [trendingRes, discoverRes, indRes, japRes, animRes, recsRes] = await Promise.all([
      getTrendingContent('all', 'day'),
      getMixedDiscover({ with_original_language: 'ko' }),
      getPanIndianContent(), // Top Rated Pan-Indian Content
      getMixedDiscover({ with_original_language: 'ja' }),
      getMixedDiscover({ with_genres: '16' }), // 16 is Animation genre
      user ? getPersonalizedRecommendations() : Promise.resolve(null)
    ])
    trending = trendingRes
    koreanThrillers = discoverRes
    indianCinema = indRes
    japaneseCinema = japRes
    animatedContent = animRes
    recommendations = recsRes
  } catch (e) {
    console.error('Failed to fetch home page content:', e)
    error = true
  }

  return (
    <div className="space-y-10">
      {/* Featured Hero Banner */}
      <section className="relative w-full">
        {trending?.results?.length ? (
          <HeroCarousel items={trending.results.slice(0, 5)} />
        ) : (
          <div className="relative w-full overflow-hidden rounded-3xl bg-card shadow-sm border border-border">
            <div className="p-16 text-center text-muted-foreground">Loading featured content...</div>
          </div>
        )}
      </section>

      {/* Featured Gallery */}
      {trending?.results?.length && (
        <section className="animate-in fade-in zoom-in duration-500 delay-100">
          <SectionHeader title="Trending Now" icon={<TrendingUp className="h-6 w-6 text-primary" />} />
          <div className="mt-6">
            <AccordionGallery
              items={trending.results.slice(5, 10).map((item: any) => ({
                image: `https://image.tmdb.org/t/p/w1280${item.backdrop_path || item.poster_path}`,
                label: item.title || item.name || 'Unknown',
                link: `/movie/${item.id}?type=${item.media_type || 'movie'}`,
                alt: item.title || item.name || 'Unknown'
              }))}
              defaultIndex={2}
              expandRatio={0.52}
              trigger="hover"
              height={460}
              gap={10}
              radius={16}
              grayscale={true}
              parallax={0.5}
              tilt={8}
              showLabels={true}
            />
          </div>
        </section>
      )}

      {/* Recommended for You */}
      {user && (
        <section>
          <SectionHeader title={`Recommended for You, ${user.display_name?.split(' ')[0]}`} href="/explore" />
          <div className="mt-4">
            {recommendations?.results?.length ? (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {recommendations.results.map((item) => (
                  <div key={item.id} className="w-[180px] flex-none">
                    <MovieCard 
                      id={typeof item.id === 'string' ? parseInt(item.id) : item.id}
                      title={item.title || item.name || ''} 
                      posterPath={item.poster_path || null} 
                      rating={item.vote_average ?? null}
                      year={item.release_date ? item.release_date.substring(0, 4) : item.first_air_date ? item.first_air_date.substring(0, 4) : null}
                      language={item.original_language?.toUpperCase()}
                      mediaType={item.media_type || 'movie'}
                      watchProviders={item.watch_providers}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Building your profile"
                description="Add movies to your watchlist or rate them to get personalized recommendations here."
                icon={<Sparkles className="h-8 w-8" />}
              />
            )}
          </div>
        </section>
      )}

      {/* Trending Worldwide */}
      <section>
        <SectionHeader title="Trending Worldwide" href="/explore" />
        <div className="mt-4">
          {error ? (
            <ErrorState message="Failed to load trending content. Is the API running?" />
          ) : trending?.results?.length ? (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {trending.results.slice(1, 11).map((item) => (
                <div key={item.id} className="w-[180px] flex-none">
                  <MovieCard 
                    id={item.id}
                    title={item.title || item.name} 
                    posterPath={item.poster_path} 
                    rating={item.vote_average ?? null}
                    year={item.release_date ? item.release_date.substring(0, 4) : item.first_air_date ? item.first_air_date.substring(0, 4) : null}
                    language={item.original_language?.toUpperCase()}
                    mediaType={item.media_type || 'movie'}
                    watchProviders={item.watch_providers}
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No trending movies found"
              description="Connect to TMDB to see what's trending around the world."
              icon={<TrendingUp className="h-8 w-8" />}
            />
          )}
        </div>
      </section>

      {/* Explore by Language */}
      <section>
        <SectionHeader title="Explore by Language" href="/explore" />
        <div className="mt-4 flex flex-wrap gap-3">
          {[
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
            { code: 'mr', label: 'Marathi' },
          ].map((lang) => (
            <Link href={`/explore?lang=${lang.code}`} key={lang.code}>
              <div className="cursor-pointer rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-110 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/40 active:scale-95 shadow-sm">
                {lang.label}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Korean Cinema */}
      <section>
        <SectionHeader title="Korean Movies & TV" href="/explore?country=KR" />
        <div className="mt-4">
          {error ? (
            <ErrorState message="Failed to load content." />
          ) : koreanThrillers?.results?.length ? (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {koreanThrillers.results.slice(0, 10).map((item) => (
                <div key={item.id} className="w-[180px] flex-none">
                  <MovieCard 
                    id={item.id}
                    title={item.title || item.name} 
                    posterPath={item.poster_path} 
                    rating={item.vote_average ?? null}
                    year={item.release_date ? item.release_date.substring(0, 4) : item.first_air_date ? item.first_air_date.substring(0, 4) : null}
                    language={item.original_language?.toUpperCase()}
                    mediaType={item.media_type || 'movie'}
                    watchProviders={item.watch_providers}
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Hidden gems await"
              description="Discover critically acclaimed movies that flew under the radar."
              icon={<Globe className="h-8 w-8" />}
            />
          )}
        </div>
      </section>

      {/* Indian Cinema */}
      <section>
        <SectionHeader title="Top Rated Indian Movies & TV" href="/explore?country=IN" />
        <div className="mt-4">
          {error ? (
            <ErrorState message="Failed to load content." />
          ) : indianCinema?.results?.length ? (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {indianCinema.results.slice(0, 20).map((item) => (
                <div key={item.id} className="w-[180px] flex-none">
                  <MovieCard 
                    id={item.id}
                    title={item.title || item.name} 
                    posterPath={item.poster_path} 
                    rating={item.vote_average ?? null}
                    year={item.release_date ? item.release_date.substring(0, 4) : item.first_air_date ? item.first_air_date.substring(0, 4) : null}
                    language={item.original_language?.toUpperCase()}
                    mediaType={item.media_type || 'movie'}
                    watchProviders={item.watch_providers}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Japanese Cinema */}
      <section>
        <SectionHeader title="Japanese Movies & TV" href="/explore?country=JP" />
        <div className="mt-4">
          {error ? (
            <ErrorState message="Failed to load content." />
          ) : japaneseCinema?.results?.length ? (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {japaneseCinema.results.slice(0, 10).map((item) => (
                <div key={item.id} className="w-[180px] flex-none">
                  <MovieCard 
                    id={item.id}
                    title={item.title || item.name} 
                    posterPath={item.poster_path} 
                    rating={item.vote_average ?? null}
                    year={item.release_date ? item.release_date.substring(0, 4) : item.first_air_date ? item.first_air_date.substring(0, 4) : null}
                    language={item.original_language?.toUpperCase()}
                    mediaType={item.media_type || 'movie'}
                    watchProviders={item.watch_providers}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Animated Movies & Series */}
      <section>
        <SectionHeader title="Animated Movies & Series" href="/explore?genre=16" />
        <div className="mt-4">
          {error ? (
            <ErrorState message="Failed to load content." />
          ) : animatedContent?.results?.length ? (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {animatedContent.results.slice(0, 10).map((item) => (
                <div key={item.id} className="w-[180px] flex-none">
                  <MovieCard 
                    id={item.id}
                    title={item.title || item.name} 
                    posterPath={item.poster_path} 
                    rating={item.vote_average ?? null}
                    year={item.release_date ? item.release_date.substring(0, 4) : item.first_air_date ? item.first_air_date.substring(0, 4) : null}
                    language={item.original_language?.toUpperCase()}
                    mediaType={item.media_type || 'movie'}
                    watchProviders={item.watch_providers}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
