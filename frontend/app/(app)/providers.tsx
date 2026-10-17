"use client"
import { Toaster } from "@/components/ui/sonner"

import AuthProvider from "@/components/auth/auth-provider"
import  QueryProvider  from "@/lib/query/provider"

type ProvidersProps = {
  children: React.ReactNode
}

export default function Providers({
  children,
}: ProvidersProps) {
  return (
    <QueryProvider>

    <AuthProvider>
      {children}
      <Toaster richColors />
    </AuthProvider>
    </QueryProvider>

  )
}