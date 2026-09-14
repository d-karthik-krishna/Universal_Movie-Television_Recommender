'use server'

import { API_URL } from '../constants'
import { getToken } from '@/app/actions/auth'
import { revalidatePath } from 'next/cache'

export async function getFavoriteIds(): Promise<number[]> {
  const token = await getToken()
  if (!token) return []

  const baseUrl = API_URL

  const res = await fetch(`${baseUrl}/api/v1/user/favorites/ids`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  })

  if (!res.ok) return []
  const data = await res.json()
  return data.ids || []
}

export async function getFavorites(): Promise<any[]> {
  const token = await getToken()
  if (!token) return []

  const baseUrl = API_URL

  const res = await fetch(`${baseUrl}/api/v1/user/favorites`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  })

  if (!res.ok) return []
  return res.json()
}

export async function markAsFavorite(tmdbId: number, mediaType: string) {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated' }

  const baseUrl = API_URL

  const res = await fetch(`${baseUrl}/api/v1/user/favorites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ tmdb_id: tmdbId, media_type: mediaType })
  })

  if (!res.ok) {
    if (res.status === 403) return { error: 'You must watch the content before adding it to favorites.' }
    const err = await res.json().catch(() => ({}))
    return { error: err.detail || 'Failed to mark as favorite' }
  }
  
  revalidatePath('/profile')
  revalidatePath('/')
  
  return { success: true, data: await res.json() }
}

export async function unmarkAsFavorite(tmdbId: number, mediaType: string) {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated' }

  const baseUrl = API_URL

  const res = await fetch(`${baseUrl}/api/v1/user/favorites/${tmdbId}/${mediaType}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { error: err.detail || 'Failed to unmark as favorite' }
  }
  
  revalidatePath('/profile')
  revalidatePath('/')
  
  return { success: true, data: await res.json() }
}
