import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { API_BASE } from '@/lib/api/server-config'
import { backendFetch } from '@/lib/api/transport'
import { ACCESS_COOKIE } from './cookies'
import type { User } from '@/types/auth'
export async function requireSession(returnTo: string): Promise<User> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value
  if (token) {
    const response = await backendFetch(`${API_BASE}/api/v1/auth/me/`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
    }).catch(() => null)
    if (response?.ok) return (await response.json()).data
  }
  redirect(`/login?expired=1&next=${encodeURIComponent(returnTo)}`)
}
