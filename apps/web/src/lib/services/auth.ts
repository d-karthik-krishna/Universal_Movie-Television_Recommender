import { API_URL } from '../constants'
import { setTokenCookie, removeTokenCookie, getToken } from '@/app/actions/auth'

export async function loginUser(username: string, password: string) {
  const formData = new URLSearchParams()
  formData.append('username', username)
  formData.append('password', password)

  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString()
  })

  if (!res.ok) {
    throw new Error('Invalid credentials')
  }

  const data = await res.json()
  await setTokenCookie(data.access_token)
  return data
}

export async function registerUser(email: string, username: string, password: string) {
  const res = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, username, password })
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Registration failed')
  }

  return res.json()
}

export async function logoutUser() {
  await removeTokenCookie()
}

export async function getCurrentUser() {
  const token = await getToken()
  if (!token) return null
  
  const res = await fetch(`${API_URL}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!res.ok) return null
  return res.json()
}

export async function updateUser(data: { display_name?: string, username?: string, bio?: string, avatar_url?: string }) {
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${API_URL}/api/v1/auth/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Update failed')
  }

  return res.json()
}

export async function uploadAvatar(file: File) {
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')

  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_URL}/api/v1/auth/me/avatar`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  })

  if (!res.ok) {
    let err
    try { err = await res.json() } catch(e) {}
    throw new Error(err?.detail || 'Upload failed')
  }

  return res.json()
}
