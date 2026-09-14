'use server'

import { API_URL } from '../constants'
import { getToken } from '@/app/actions/auth'
import { revalidatePath } from 'next/cache'

export async function submitRating(tmdbId: number, mediaType: string, rating: number, reviewText: string) {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated' }

  const baseUrl = API_URL

  const res = await fetch(`${baseUrl}/api/v1/user/rating`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ tmdb_id: tmdbId, media_type: mediaType, rating, review_text: reviewText })
  })

  if (!res.ok) {
    if (res.status === 403) return { error: 'You must watch the content before submitting a rating or feedback.' }
    const err = await res.json().catch(() => ({}))
    return { error: err.detail || 'Failed to submit feedback' }
  }
  
  revalidatePath('/profile')
  revalidatePath(`/movie/${tmdbId}`)
  
  return { success: true, data: await res.json() }
}

export async function getRating(tmdbId: number, mediaType: string): Promise<{rating: number | null, review: string | null}> {
  const token = await getToken()
  if (!token) return { rating: null, review: null }

  const baseUrl = API_URL

  const res = await fetch(`${baseUrl}/api/v1/user/rating/${tmdbId}/${mediaType}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  })

  if (!res.ok) return { rating: null, review: null }
  return res.json()
}

export async function getAllRatings(): Promise<any[]> {
  const token = await getToken()
  if (!token) return []

  const baseUrl = API_URL

  const res = await fetch(`${baseUrl}/api/v1/user/ratings`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  })

  if (!res.ok) return []
  return res.json()
}
