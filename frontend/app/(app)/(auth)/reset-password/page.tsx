// ============================================================================
// Reset Password Page
// ============================================================================

import { ResetPasswordForm } from "./components/reset-password-form"
import GuestRoute from "@/components/auth/guest-route"

export default function ResetPasswordPage() {
  return (
    <GuestRoute>
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
        <ResetPasswordForm />
      </main>
    </GuestRoute>

  )
}