import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/navbar'
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/constants'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
}

import { ThemeProvider } from '@/components/theme-provider'
import { getCurrentUser } from '@/lib/services/auth'
import { getWatchlist } from '@/lib/services/actions'
import { getWatchedIds } from '@/lib/services/watch-history'
import { getFavoriteIds } from '@/lib/services/favorites'
import { WatchlistProvider } from '@/components/providers/watchlist-provider'
import { WatchedProvider } from '@/components/providers/watched-provider'
import { FavoritesProvider } from '@/components/providers/favorites-provider'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await getCurrentUser()
  let initialWatchlistIds: number[] = []
  let initialWatchedIds: number[] = []
  let initialFavoriteIds: number[] = []
  
  if (user) {
    const [watchlist, watchedIds, favoriteIds] = await Promise.all([
      getWatchlist(),
      getWatchedIds(),
      getFavoriteIds()
    ])
    initialWatchlistIds = watchlist.map((item: any) => typeof item.id === 'string' ? parseInt(item.id) : item.id)
    initialWatchedIds = watchedIds
    initialFavoriteIds = favoriteIds
  }

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans relative text-foreground bg-background min-h-screen overflow-x-hidden`}>
        <ThemeProvider>
          <WatchlistProvider initialIds={initialWatchlistIds}>
            <WatchedProvider initialIds={initialWatchedIds}>
              <FavoritesProvider initialIds={initialFavoriteIds}>
                <Navbar initialUser={user} />
                <main className="mx-auto min-h-screen max-w-[1440px] px-4 py-6 md:px-8 relative z-0">
                  {children}
                </main>
              </FavoritesProvider>
            </WatchedProvider>
          </WatchlistProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
