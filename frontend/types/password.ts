// ============================================================================
// Change Password Types
// ============================================================================

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
  confirm_password: string
}

export interface ChangePasswordResponse {
  success: boolean
  message: string
}