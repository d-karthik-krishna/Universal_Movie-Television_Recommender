'use server'

import { cookies } from 'next/headers'

export async function setTokenCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('cinesphere_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 // 7 days
  })
}

export async function removeTokenCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('cinesphere_token')
}

export async function getToken() {
  const cookieStore = await cookies()
  return cookieStore.get('cinesphere_token')?.value
}
