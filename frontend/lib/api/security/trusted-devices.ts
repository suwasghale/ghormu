import { apiClient } from "@/lib/api/client"
import type { Session } from "@/types/security"

interface Response {
  success: boolean
  data: Session[]
}

export async function getTrustedDevices(): Promise<Session[]> {
  const response =
    await apiClient.get<Response>(
      "/auth/security/trusted-devices/",
    )

  return response.data
}