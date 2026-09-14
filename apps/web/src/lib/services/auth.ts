'use server'

import { API_URL } from '../constants'
import { setTokenCookie, removeTokenCookie, getToken } from '@/app/actions/auth'



export async function loginUser(username: string, password: string) {
  const formData = new URLSearchParams()
  formData.append('username', username)
  formData.append('password', password)

  const baseUrl = API_URL

  const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString()
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { error: err.detail || 'Invalid credentials' }
  }

  const data = await res.json()
  await setTokenCookie(data.access_token)
  return { success: true, data }
}

export async function registerUser(email: string, username: string, password: string) {
  const baseUrl = API_URL

  const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, username, password })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { error: err.detail || 'Registration failed' }
  }

  const data = await res.json()
  return { success: true, data }
}

export async function logoutUser() {
  await removeTokenCookie()
}

export async function getCurrentUser() {
  const token = await getToken()
  if (!token) {
    console.log('[getCurrentUser] No token found in cookies')
    return null
  }
  
  const baseUrl = API_URL
  console.log(`[getCurrentUser] Fetching from ${baseUrl}/api/v1/auth/me`)

  try {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    })

    if (!res.ok) { 
      console.error('[getCurrentUser] Auth/me failed:', res.status, await res.text()); 
      return null 
    }
    return res.json()
  } catch (err) {
    console.error('[getCurrentUser] Network/Fetch error:', err)
    return null
  }
}

export async function updateUser(data: { display_name?: string, username?: string, bio?: string, avatar_url?: string }) {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated' }

  const baseUrl = API_URL

  const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { error: err.detail || 'Update failed' }
  }

  return { success: true, data: await res.json() }
}

export async function uploadAvatar(file: File) {
  const token = await getToken()
  if (!token) return { error: 'Not authenticated' }

  const baseUrl = API_URL

  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${baseUrl}/api/v1/auth/me/avatar`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  })

  if (!res.ok) {
    let err
    try { err = await res.json() } catch(e) {}
    return { error: err?.detail || 'Upload failed' }
  }

  return { success: true, data: await res.json() }
}
