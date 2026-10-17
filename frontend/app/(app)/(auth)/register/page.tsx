import { RegisterForm } from "./components/register-form"
import GuestRoute from "@/components/auth/guest-route"

export default function RegisterPage() {
  return (
    <GuestRoute>
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
        <RegisterForm />
      </main>
    </GuestRoute>

  )
}