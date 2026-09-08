'use server'

import { API_URL } from '../constants'
import { getToken } from '@/app/actions/auth'
import { revalidatePath } from 'next/cache'

export async function addToWatchlist(tmdbId: number, mediaType: string) {
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')

  const baseUrl = process.env.INTERNAL_API_URL || API_URL

  const res = await fetch(`${baseUrl}/api/v1/user/watchlist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ tmdb_id: tmdbId, media_type: mediaType })
  })

  if (!res.ok) throw new Error('Failed to add to watchlist')
  
  revalidatePath('/profile')
  revalidatePath('/') // also revalidate home page for recommendations
  
  return res.json()
}

export async function removeFromWatchlist(tmdbId: number, mediaType: string) {
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')

  const baseUrl = process.env.INTERNAL_API_URL || API_URL

  const res = await fetch(`${baseUrl}/api/v1/user/watchlist/${tmdbId}/${mediaType}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!res.ok) throw new Error('Failed to remove from watchlist')
  
  revalidatePath('/profile')
  revalidatePath('/')
  
  return res.json()
}

export async function getWatchlist() {
  const token = await getToken()
  if (!token) return []

  const baseUrl = process.env.INTERNAL_API_URL || API_URL

  const res = await fetch(`${baseUrl}/api/v1/user/watchlist`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: 'no-store'
  })

  if (!res.ok) return []
  return res.json()
}
