import { requireSession } from "@/lib/auth/server-session"
import { redirect } from "next/navigation"
import Shell from "./shell"
export const metadata = { robots: { index: false, follow: false } }
export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await requireSession('/admin')
  if (!user.is_staff) redirect('/profile')
  return <Shell>{children}</Shell>
}
