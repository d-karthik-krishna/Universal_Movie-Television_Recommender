import { notFound } from 'next/navigation'
import { MovieCard } from '@/components/ui/movie-card'
import { Eye, Heart, MessageSquare, Star } from 'lucide-react'
import { API_URL } from '@/lib/constants'
import { ProfileActions } from '@/components/ui/profile-actions'

interface Props {
  params: Promise<{ username: string }>
}

async function getPublicProfile(username: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/user/public/${username}`, {
      next: { revalidate: 60 }
    })
    if (!res.ok) {
      if (res.status === 404) return null
      throw new Error('Failed to fetch profile')
    }
    return res.json()
  } catch (error) {
    console.error(error)
    return null
  }
}

export async function generateMetadata({ params }: Props) {
  const resolvedParams = await params;
  const profile = await getPublicProfile(resolvedParams.username);
  if (!profile) return { title: 'User Not Found' };
  return { title: `${profile.user.display_name || profile.user.username} | CineSphere` };
}

export default async function PublicProfilePage({ params }: Props) {
  const resolvedParams = await params
  const profile = await getPublicProfile(resolvedParams.username)

  if (!profile) {
    notFound()
  }

  const { user, watched } = profile
  
  const favorites = watched.filter((item: any) => item.is_favorite)
  const ratings = watched.filter((item: any) => item.user_rating !== null)

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-border bg-card p-8 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative flex h-24 w-24 flex-none items-center justify-center overflow-hidden rounded-full bg-primary text-3xl font-black text-primary-foreground shadow-md">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.display_name} className="h-full w-full object-cover" />
            ) : (
              (user.display_name?.[0] || user.username?.[0] || '').toUpperCase()
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
                watchedData={watched} 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <Eye className="h-6 w-6" />
          </div>
          <p className="text-3xl font-black">{watched.length}</p>
          <p className="text-sm text-muted-foreground font-medium">Watched</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 mb-3">
            <Heart className="h-6 w-6" />
          </div>
          <p className="text-3xl font-black">{favorites.length}</p>
          <p className="text-sm text-muted-foreground font-medium">Favorites</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500 mb-3">
            <Star className="h-6 w-6" />
          </div>
          <p className="text-3xl font-black">{ratings.length}</p>
          <p className="text-sm text-muted-foreground font-medium">Ratings</p>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Watch History</h2>
        {watched.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {watched.map((item: any) => (
              <div key={item.id} className="relative group">
                <MovieCard 
                  id={item.id}
                  title={item.title} 
                  posterPath={item.poster_path} 
                  rating={item.user_rating || null}
                  year={item.year}
                  language={item.original_language?.toUpperCase()}
                  mediaType={item.media_type}
                  watchProviders={item.watch_providers}
                />
                {item.is_favorite && (
                  <div className="absolute top-2 right-2 z-10 bg-black/50 p-1.5 rounded-full backdrop-blur-sm">
                    <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No watch history to display.
          </div>
        )}
      </div>
    </div>
  )
}
