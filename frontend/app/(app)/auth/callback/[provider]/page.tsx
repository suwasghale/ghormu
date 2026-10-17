import type { Metadata } from "next"

import SocialCallback from "./social-callback"

export const metadata: Metadata = {
  title: "Signing in",
  robots: { index: false, follow: false },
}

type PageProps = {
  params: Promise<{ provider: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function first(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null
}

export default async function SocialCallbackPage({
  params,
  searchParams,
}: PageProps) {
  const { provider } = await params
  const query = await searchParams

  return (
    <SocialCallback
      provider={provider}
      code={first(query.code)}
      state={first(query.state)}
      providerError={first(query.error)}
    />
  )
}
