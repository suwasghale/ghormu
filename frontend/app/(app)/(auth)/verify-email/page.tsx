import { Suspense } from "react"

import { VerifyEmailCard } from "./components/verify-email-card"
import GuestRoute from "@/components/auth/guest-route"

export default function VerifyEmailPage() {
  return (
    <GuestRoute>
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <Suspense fallback={<p>Verifying...</p>}>
          <VerifyEmailCard />
        </Suspense>
      </main>
    </GuestRoute>

  )
}