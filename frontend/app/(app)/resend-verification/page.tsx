import { Suspense } from "react"

import { ResendVerificationForm } from "./components/resend-verification-form"

export default function ResendVerificationPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <Suspense fallback={<p>Loading...</p>}>
        <ResendVerificationForm />
      </Suspense>
    </main>
  )
}