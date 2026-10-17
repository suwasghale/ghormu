import ProtectedRoute from "@/components/auth/protected-route"
import ChangeEmailCard from "../components/change-email-card"

export default function ChangePasswordPage() {
  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-3xl p-8">
        <ChangeEmailCard/>
      </main>
    </ProtectedRoute>
  )
}