import { apiClient } from "@/lib/api/client"

interface Response {
  success: boolean
  message: string
}

export async function trustDevice(
  sessionId: string,
): Promise<Response> {
  return apiClient.post<Response>(
    `/auth/security/trusted-devices/${sessionId}/trust/`,
  )
}