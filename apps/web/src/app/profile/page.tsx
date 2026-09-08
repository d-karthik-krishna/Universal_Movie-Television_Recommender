import { getCurrentUser } from '@/lib/services/auth'
import { getWatchlist } from '@/lib/services/actions'
import { getWatchHistory } from '@/lib/services/watch-history'
import { getFavorites } from '@/lib/services/favorites'
import { getAllRatings } from '@/lib/services/feedback'
import { redirect } from 'next/navigation'
import { MovieCard } from '@/components/ui/movie-card'
import { Bookmark, Eye, Heart, MessageSquare, Star } from 'lucide-react'
import { EditProfileModal } from '@/components/ui/edit-profile-modal'
import { ProfileActions } from '@/components/ui/profile-actions'
import Image from 'next/image'

import Link from 'next/link'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ProfilePage({ searchParams }: Props) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const resolvedParams = await searchParams
  const activeTab = (resolvedParams?.tab as string) || 'watchlist'

  const [watchlist, watchedHistory, favorites, ratings] = await Promise.all([
    getWatchlist(),
    getWatchHistory(),
    getFavorites(),
    getAllRatings()
  ])

  // Map watchedHistory to have isFavorite and userRating for the PDF
  const pdfData = watchedHistory.map((item: any) => ({
    ...item,
    is_favorite: favorites.some((f: any) => f.id === item.id),
    user_rating: ratings.find((r: any) => (r.provider_mappings?.[0]?.provider_id || r.id) === (item.provider_mappings?.[0]?.provider_id || item.id))?.user_rating || null
  }))

  const tabs = [
    { id: 'watchlist', label: 'My Watchlist', icon: Bookmark },
    { id: 'watched', label: 'Watched', icon: Eye },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'reviews', label: 'Reviews & Ratings', icon: MessageSquare },
  ]

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-border bg-card p-8 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative flex h-24 w-24 flex-none items-center justify-center overflow-hidden rounded-full bg-primary text-3xl font-black text-primary-foreground shadow-md">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.display_name} className="h-full w-full object-cover" />
            ) : (
              user.display_name?.[0].toUpperCase() || user.username?.[0].toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">{user.display_name || user.username}</h1>
            <p className="text-muted-foreground mt-1">@{user.username}</p>
            {user.bio && (
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">{user.bio}</p>
            )}
            <div className="mt-4">
              <ProfileActions 
                username={user.username} 
                display_name={user.display_name || user.username}
                avatar_url={user.avatar_url}
                bio={user.bio}
                watchedData={pdfData} 
              />
            </div>
          </div>
        </div>
        
        <div className="self-end md:self-start">
          <EditProfileModal user={user} />
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-border">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <Link
              key={tab.id}
              href={`/profile?tab=${tab.id}`}
              className={`flex items-center gap-2 whitespace-nowrap px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                isActive 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          )
        })}
      </div>

      <div className="pt-2">
        {/* Watchlist Section */}
        {activeTab === 'watchlist' && (
          <section className="animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-6">
              <Bookmark className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">My Watchlist</h2>
            </div>
        
        {watchlist.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {watchlist.map((item: any) => (
              <MovieCard 
                key={item.id}
                id={item.provider_mappings?.[0]?.provider_id || item.id}
                title={item.title} 
                posterPath={item.poster_path} 
                rating={item.vote_average ?? null}
                year={item.release_date ? item.release_date.substring(0, 4) : item.first_air_date ? item.first_air_date.substring(0, 4) : null}
                language={item.original_language?.toUpperCase()}
                mediaType={item.content_type}
                watchProviders={item.watch_providers}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            You haven't added anything to your watchlist yet.
          </div>
        )}
          </section>
        )}

        {/* Watched Section */}
        {activeTab === 'watched' && (
          <section className="animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-6">
              <Eye className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Watched</h2>
            </div>
        
        {watchedHistory.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {watchedHistory.map((item: any) => (
              <MovieCard 
                key={item.id}
                id={item.provider_mappings?.[0]?.provider_id || item.id}
                title={item.title} 
                posterPath={item.poster_path} 
                rating={item.vote_average ?? null}
                year={item.release_date ? item.release_date.substring(0, 4) : item.first_air_date ? item.first_air_date.substring(0, 4) : null}
                language={item.original_language?.toUpperCase()}
                mediaType={item.content_type}
                watchProviders={item.watch_providers}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            You haven't marked anything as watched yet.
          </div>
        )}
          </section>
        )}

        {/* Favorites Section */}
        {activeTab === 'favorites' && (
          <section className="animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-6">
              <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
              <h2 className="text-xl font-bold">Favorites</h2>
            </div>
        
        {favorites.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {favorites.map((item: any) => (
              <MovieCard 
                key={item.id}
                id={item.provider_mappings?.[0]?.provider_id || item.id}
                title={item.title} 
                posterPath={item.poster_path} 
                rating={item.vote_average ?? null}
                year={item.release_date ? item.release_date.substring(0, 4) : item.first_air_date ? item.first_air_date.substring(0, 4) : null}
                language={item.original_language?.toUpperCase()}
                mediaType={item.content_type}
                watchProviders={item.watch_providers}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            You haven't favorited any content yet.
          </div>
        )}
          </section>
        )}

        {/* Reviews Section */}
        {activeTab === 'reviews' && (
          <section className="animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">My Reviews & Ratings</h2>
            </div>
        
        {ratings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ratings.map((item: any) => (
              <div key={item.id} className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-20 shrink-0">
                  <MovieCard 
                    id={item.provider_mappings?.[0]?.provider_id || item.id}
                    title={item.title} 
                    posterPath={item.poster_path} 
                    rating={null}
                    year={null}
                    language={null}
                    mediaType={item.content_type}
                  />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <h3 className="font-bold truncate text-foreground">{item.title}</h3>
                  <div className="flex items-center gap-1 mt-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= item.user_rating
                            ? 'fill-yellow-500 text-yellow-500'
                            : 'text-muted'
                        }`}
                      />
                    ))}
                  </div>
                  {item.user_review ? (
                    <p className="text-sm text-muted-foreground line-clamp-3 italic">"{item.user_review}"</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic opacity-50">No written review.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            You haven't rated or reviewed any content yet.
          </div>
        )}
          </section>
        )}
      </div>
    </div>
  )
}
