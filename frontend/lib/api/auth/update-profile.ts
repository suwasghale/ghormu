import { apiClient } from "@/lib/api/client"
import { getCurrentUser } from "./me"

import type { ProfileResponse } from "@/types/profile"

import type { ProfileFormValues } from "@/lib/validators/profile"

export type UpdateProfilePayload =
  ProfileFormValues

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<ProfileResponse> {
  const response = await apiClient.patch<{ success: boolean; message: string }>(
    "/me/profile/",
    Object.fromEntries(Object.entries(payload).filter(([key, value]) => value !== "" || key === "biography")),
  )
  return { ...response, data: await getCurrentUser() }
}