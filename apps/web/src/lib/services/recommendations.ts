import { api } from '../api'
import { ContentResponse } from './content'
import { cookies } from 'next/headers'
import { API_URL } from '../constants'

export async function getPersonalizedRecommendations(): Promise<ContentResponse | null> {
  // Try to get token from cookies for server-side fetching
  const cookieStore = await cookies()
  const token = cookieStore.get('cinesphere_token')?.value
  
  if (!token) return null
  
  try {
    const response = await fetch(`${API_URL}/api/v1/recommendations/for-me`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      next: { revalidate: 60 } // cache for 60 seconds
    })
    
    if (!response.ok) return null
    return response.json()
  } catch (err) {
    console.error('Error fetching recommendations:', err)
    return null
  }
}
