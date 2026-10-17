import { NextResponse } from 'next/server'
export function checkOrigin(request: Request): NextResponse | null {
  if (['GET', 'HEAD'].includes(request.method)) return null
  const origin = request.headers.get('origin')
  const allowed = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin
  if (!origin || origin !== new URL(allowed).origin) {
    return NextResponse.json({ message: 'Request origin is not allowed.' }, { status: 403 })
  }
  return null
}
