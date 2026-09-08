'use server'

import { API_URL } from '../constants'
import { getToken } from '@/app/actions/auth'
import { revalidatePath } from 'next/cache'

export async function getWatchedIds(): Promise<number[]> {
  const token = await getToken()
  if (!token) return []

  const baseUrl = process.env.INTERNAL_API_URL || API_URL

  const res = await fetch(`${baseUrl}/api/v1/user/watched/ids`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  })

  if (!res.ok) return []
  const data = await res.json()
  return data.ids || []
}

export async function getWatchHistory(): Promise<any[]> {
  const token = await getToken()
  if (!token) return []

  const baseUrl = process.env.INTERNAL_API_URL || API_URL

  const res = await fetch(`${baseUrl}/api/v1/user/history`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  })

  if (!res.ok) return []
  return res.json()
}

export async function markAsWatched(tmdbId: number, mediaType: string) {
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')

  const baseUrl = process.env.INTERNAL_API_URL || API_URL

  const res = await fetch(`${baseUrl}/api/v1/user/watched`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ tmdb_id: tmdbId, media_type: mediaType })
  })

  if (!res.ok) throw new Error('Failed to mark as watched')
  
  revalidatePath('/profile')
  revalidatePath('/')
  
  return res.json()
}

export async function unmarkAsWatched(tmdbId: number, mediaType: string) {
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')

  const baseUrl = process.env.INTERNAL_API_URL || API_URL

  const res = await fetch(`${baseUrl}/api/v1/user/watched/${tmdbId}/${mediaType}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })

  if (!res.ok) throw new Error('Failed to unmark as watched')
  
  revalidatePath('/profile')
  revalidatePath('/')
  
  return res.json()
}

export async function getSeriesProgress(tmdbId: number): Promise<Record<string, any>> {
  const token = await getToken()
  if (!token) return {}

  const baseUrl = process.env.INTERNAL_API_URL || API_URL

  const res = await fetch(`${baseUrl}/api/v1/user/watched/${tmdbId}/progress`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  })

  if (!res.ok) return {}
  const data = await res.json()
  return data.seasons || {}
}

export async function saveSeasonProgress(
  tmdbId: number,
  seasonNumber: number,
  watchedAll: boolean,
  watchedEpisodes: number[],
  totalEpisodes: number
) {
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')

  const baseUrl = process.env.INTERNAL_API_URL || API_URL

  const res = await fetch(`${baseUrl}/api/v1/user/watched/season`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      tmdb_id: tmdbId,
      season_number: seasonNumber,
      watched_all: watchedAll,
      watched_episodes: watchedEpisodes,
      total_episodes: totalEpisodes
    })
  })

  if (!res.ok) throw new Error('Failed to save season progress')
  
  revalidatePath('/profile')
  revalidatePath('/')
  
  return res.json()
}
