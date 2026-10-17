"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import GuestRoute from "@/components/auth/guest-route";
import MfaChallengeForm, { type MfaChallenge } from "@/components/auth/mfa-challenge-form";
import SocialSignIn from "@/components/auth/social-sign-in";
import { login } from "@/lib/api/auth/login";
import { ApiError } from "@/lib/api/client";
import { postLoginPath } from "@/lib/auth/redirect";
import { useAuthStore } from "@/store/auth-store";
import type { LoginResponse } from "@/types/auth";

const inputClass = "w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-black focus:ring-2 focus:ring-black/10";

export default function LoginPage() {
  const router = useRouter();
  const loginStore = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [challenge, setChallenge] = useState<MfaChallenge | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function complete(session: LoginResponse["data"]) {
    loginStore(session.user);
    setPassword("");
    setChallenge(null);
    // Read at the moment of use rather than through useSearchParams, which
    // would force a Suspense boundary around the whole page.
    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(postLoginPath(session.user, next));
  }

  function restart(message?: string) {
    setChallenge(null);
    setError(message ?? "");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const result = await login({ email, password });
      if (result.kind === "mfa") {
        setChallenge({ ticket: result.ticket, expiresAt: Date.now() + result.expiresIn * 1000 });
        setPassword("");
      } else {
        complete(result.session);
      }
    } catch (caught) {
      if (caught instanceof ApiError && caught.data && typeof caught.data === "object") {
        const message = (caught.data as { message?: unknown }).message;
        setError(typeof message === "string" ? message : "Invalid email or password.");
      } else {
        setError("Unable to connect. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <GuestRoute>
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        {challenge ? (
          <MfaChallengeForm challenge={challenge} onAuthenticated={complete} onRestart={restart} />
        ) : (
          <form onSubmit={handleSubmit} aria-busy={loading} className="w-full max-w-md space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-950">Welcome back</h1>
              <p className="text-sm text-gray-600">Sign in to continue to your account</p>
            </div>
            <SocialSignIn />
            <div>
              <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-gray-700">Email</label>
              <input id="login-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className={inputClass} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="login-password" className="text-sm font-medium text-gray-700">Password</label>
                <Link href="/forgot-password" className="text-sm font-medium text-gray-600 hover:text-black hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required aria-describedby={error ? "login-error" : undefined} className={`${inputClass} pr-12`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            {error && <div id="login-error" role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-black py-3 font-medium text-white hover:bg-gray-900 disabled:opacity-60">{loading ? "Signing in..." : "Sign In"}</button>
            <p className="text-center text-sm text-gray-600">Don&apos;t have an account? <Link href="/register" className="font-semibold text-black hover:underline">Create one</Link></p>
          </form>
        )}
      </main>
    </GuestRoute>
  );
}
