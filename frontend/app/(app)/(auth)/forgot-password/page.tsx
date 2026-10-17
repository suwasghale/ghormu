// ============================================================================
// Forgot Password Page
// ============================================================================

import GuestRoute from "@/components/auth/guest-route"
import { ForgotPasswordForm } from "./components/forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <GuestRoute>
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
        <ForgotPasswordForm />
      </main>
    </GuestRoute>
  )
}