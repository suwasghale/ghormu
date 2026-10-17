import { loginResponse } from '@/lib/auth/login-response'
export function POST(request: Request) { return loginResponse(request, 'mfa/verify') }
