import { requireSession } from '@/lib/auth/server-session'
export const metadata = { robots: { index: false, follow: false } }
export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireSession('/profile')
  return children
}
