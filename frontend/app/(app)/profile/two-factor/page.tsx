import ProtectedRoute from "@/components/auth/protected-route"
import TwoFactorCard from "../components/two-factor-card"

export default function TwoFactorPage() {
  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-3xl p-8">
        <TwoFactorCard />
      </main>
    </ProtectedRoute>
  )
}
