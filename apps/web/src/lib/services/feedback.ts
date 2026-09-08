'use server'

import { API_URL } from '../constants'
import { getToken } from '@/app/actions/auth'
import { revalidatePath } from 'next/cache'

export async function submitRating(tmdbId: number, mediaType: string, rating: number, reviewText: string) {
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')

  const baseUrl = process.env.INTERNAL_API_URL || API_URL

  const res = await fetch(`${baseUrl}/api/v1/user/rating`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ tmdb_id: tmdbId, media_type: mediaType, rating, review_text: reviewText })
  })

  if (!res.ok) {
    if (res.status === 403) throw new Error('Must watch first')
    throw new Error('Failed to submit feedback')
  }
  
  revalidatePath('/profile')
  revalidatePath(`/movie/${tmdbId}`)
  
  return res.json()
}

export async function getRating(tmdbId: number, mediaType: string): Promise<{rating: number | null, review: string | null}> {
  const token = await getToken()
  if (!token) return { rating: null, review: null }

  const baseUrl = process.env.INTERNAL_API_URL || API_URL

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

  const baseUrl = process.env.INTERNAL_API_URL || API_URL

  const res = await fetch(`${baseUrl}/api/v1/user/ratings`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  })

  if (!res.ok) return []
  return res.json()
}
