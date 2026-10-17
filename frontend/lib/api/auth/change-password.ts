import { apiClient } from "@/lib/api/client"

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
  confirm_password: string
}

export interface ChangePasswordResponse {
  success: boolean
  message: string
}

export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<ChangePasswordResponse> {
  return apiClient.post<ChangePasswordResponse>(
    "/auth/password/change/",
    payload,
  )
}