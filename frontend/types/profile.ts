import type { User } from "./auth"

export interface ProfileResponse {
  success: boolean
  message: string
  data: User
}
