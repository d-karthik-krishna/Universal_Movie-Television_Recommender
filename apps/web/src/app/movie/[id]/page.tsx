import { getContentDetail, type ContentDetail, type CastMember } from '@/lib/services/content'
import { MovieCard } from '@/components/ui/movie-card'
import { SeasonList } from '@/components/ui/season-list'
import { WatchlistButton } from '@/components/ui/watchlist-button'
import { WatchedButton } from '@/components/ui/watched-button'
import { FavoriteButton } from '@/components/ui/favorite-button'
import { FeedbackModal } from '@/components/ui/feedback-modal'
import { Star, Clock, Calendar, Play, Tv } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function MovieDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const tmdbId = parseInt(id)
  
  const resolvedSearchParams = await searchParams
  const mediaType = (resolvedSearchParams?.type as string) || 'movie'
  
  if (isNaN(tmdbId)) notFound()

  let detail: ContentDetail
  try {
    detail = await getContentDetail(mediaType, tmdbId)
    // Verify the returned ID matches what we requested to prevent stale data mixing
    if (detail.id !== tmdbId) {
      console.error(`ID mismatch: requested ${tmdbId}, got ${detail.id}`)
      notFound()
    }
  } catch (error) {
    console.error('Failed to load content details:', error)
    notFound()
  }

  const title = detail.title || detail.name || 'Untitled'
  const year = (detail.release_date || detail.first_air_date || '').substring(0, 4)
  const backdropUrl = detail.backdrop_path
    ? `https://image.tmdb.org/t/p/original${detail.backdrop_path}`
    : null
  const posterUrl = detail.poster_path
    ? `https://image.tmdb.org/t/p/w500${detail.poster_path}`
    : null
  const trailer = detail.trailers?.[0]

  return (
    <div className="space-y-10">
      {/* Hero Backdrop */}
      <section className="relative -mx-4 -mt-6 md:-mx-8 overflow-hidden">
        <div className="relative aspect-[21/9] w-full md:aspect-[2.5/1]">
          {backdropUrl ? (
            <img src={backdropUrl} alt={title} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-muted" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 md:px-8">
          <div className="mx-auto flex max-w-[1440px] items-end gap-8">
            {/* Poster */}
            {posterUrl && (
              <div className="hidden md:block w-[200px] flex-none overflow-hidden rounded-xl shadow-lg border border-border">
                <Image src={posterUrl} alt={title} width={200} height={300} className="object-cover" />
              </div>
            )}
            <div className="flex-1">
              {detail.tagline && (
                <p className="mb-2 text-sm font-medium text-muted-foreground italic">&ldquo;{detail.tagline}&rdquo;</p>
              )}
              <h1 className="text-4xl font-black tracking-tight text-foreground md:text-5xl">{title}</h1>
              
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {year}
                  </span>
                )}
                {detail.runtime ? (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {Math.floor(detail.runtime / 60)}h {detail.runtime % 60}m
                  </span>
                ) : null}
                {detail.number_of_seasons ? (
                  <span className="flex items-center gap-1">
                    <Tv className="h-4 w-4" />
                    {detail.number_of_seasons} Season{detail.number_of_seasons > 1 ? 's' : ''}
                  </span>
                ) : null}
                {detail.vote_average && detail.vote_average > 0 ? (
                  <span className="flex items-center gap-1 text-yellow-500 font-semibold">
                    <Star className="h-4 w-4 fill-yellow-500" />
                    {detail.vote_average.toFixed(1)}
                  </span>
                ) : null}
              </div>

              {/* Genres */}
              {detail.genres && detail.genres.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {detail.genres.map((g) => (
                    <span key={g.id} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                      {g.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex flex-col gap-4 max-w-xl">
                <div className="flex flex-wrap items-center gap-4">
                  {trailer && (
                    <a
                      href={`https://www.youtube.com/watch?v=${trailer.key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105 shadow-md"
                    >
                      <Play className="h-4 w-4 fill-primary-foreground" />
                      Watch Trailer
                    </a>
                  )}
                  <WatchlistButton tmdbId={tmdbId} mediaType={mediaType} />
                  <WatchedButton tmdbId={tmdbId} mediaType={mediaType} seasons={detail.seasons} />
                </div>
                
                <div className="flex items-center gap-4">
                  <FavoriteButton tmdbId={tmdbId} mediaType={mediaType} />
                  <FeedbackModal tmdbId={tmdbId} mediaType={mediaType} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overview */}
      {detail.overview && (
        <section className="max-w-3xl">
          <h2 className="text-xl font-bold">Overview</h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{detail.overview}</p>
        </section>
      )}

      {/* Where to Watch */}
      {detail.watch_providers && (detail.watch_providers.IN?.flatrate || detail.watch_providers.US?.flatrate) && (
        <section className="max-w-3xl rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold">Where to Watch</h2>
          <div className="mt-4 flex flex-col gap-3">
            {(() => {
              const countryData = detail.watch_providers.IN || detail.watch_providers.US;
              const link = countryData.link;
              const providers = countryData.flatrate || [];
              
              if (providers.length === 0) return <p className="text-sm text-muted-foreground">Not currently available to stream.</p>;
              
              return (
                <div className="flex flex-col gap-3">
                  {providers.map((p: any) => (
                    <div key={p.provider_id} className="flex items-center gap-3">
                      {p.logo_path ? (
                        <Image 
                          src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} 
                          alt={p.provider_name} 
                          width={32} height={32} 
                          className="rounded-md"
                        />
                      ) : <Tv className="h-6 w-6 text-muted-foreground" />}
                      <span className="font-medium">{p.provider_name}</span>
                      <span className="text-sm text-muted-foreground">— Streaming</span>
                      {link && (
                        <a 
                          href={link} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="ml-auto text-xs font-semibold text-primary hover:underline"
                        >
                          Watch Now
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* Trailer Embed */}
      {trailer && (
        <section>
          <h2 className="text-xl font-bold">Trailer</h2>
          <div className="mt-4 aspect-video w-full max-w-3xl overflow-hidden rounded-xl border border-border">
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}`}
              title={trailer.name}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              className="h-full w-full"
            />
          </div>
        </section>
      )}

      {/* Seasons */}
      {detail.seasons && detail.seasons.length > 0 && (
        <SeasonList seasons={detail.seasons} />
      )}

      {/* Cast */}
      {detail.credits?.cast && detail.credits.cast.length > 0 && (
        <section>
          <h2 className="text-xl font-bold">Cast</h2>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {detail.credits.cast.map((person: CastMember) => (
              <div key={person.id} className="w-[120px] flex-none text-center">
                <div className="mx-auto h-[120px] w-[120px] overflow-hidden rounded-full bg-muted">
                  {person.profile_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                      alt={person.name}
                      width={120}
                      height={120}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">
                      {person.name[0]}
                    </div>
                  )}
                </div>
                <p className="mt-2 truncate text-sm font-semibold">{person.name}</p>
                <p className="truncate text-xs text-muted-foreground">{person.character}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Similar Content */}
      {detail.similar && detail.similar.length > 0 && (
        <section>
          <h2 className="text-xl font-bold">Similar {mediaType === 'tv' ? 'Series' : 'Movies'}</h2>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {detail.similar.map((item) => (
              <div key={item.id} className="w-[180px] flex-none">
                <MovieCard
                  id={typeof item.id === 'string' ? parseInt(item.id) : item.id}
                  title={item.title || item.name || ''}
                  posterPath={item.poster_path || null}
                  rating={item.vote_average ?? null}
                  year={item.release_date ? item.release_date.substring(0, 4) : item.first_air_date ? item.first_air_date.substring(0, 4) : null}
                  language={item.original_language?.toUpperCase()}
                  mediaType={item.media_type || mediaType}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
