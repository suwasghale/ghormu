import { apiClient } from "@/lib/api/client"

interface Response {
  success: boolean
  message: string
}

export async function untrustDevice(
  sessionId: string,
): Promise<Response> {
  return apiClient.delete<Response>(
    `/auth/security/trusted-devices/${sessionId}/untrust/`,
  )
}