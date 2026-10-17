import ProtectedRoute from "@/components/auth/protected-route"
import ChangePasswordCard from "../components/change-password-card"

export default function ChangePasswordPage() {
  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-3xl p-8">
        <ChangePasswordCard />
      </main>
    </ProtectedRoute>
  )
}