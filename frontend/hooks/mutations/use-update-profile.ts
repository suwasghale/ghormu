import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { queryClient } from "@/lib/query/client"
import { queryKeys } from "@/lib/query/keys"

import {
  updateProfile,
  type UpdateProfilePayload,
} from "@/lib/api/auth/update-profile"

import type { ProfileResponse } from "@/types/profile"

export function useUpdateProfile() {
  return useMutation<
    ProfileResponse,
    Error,
    UpdateProfilePayload
  >({
    mutationFn: updateProfile,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.currentUser(),
      })

      toast.success(
        "Profile updated successfully.",
      )
    },

    onError: (error) => {
      toast.error(
        error.message ||
          "Failed to update profile.",
      )
    },
  })
}