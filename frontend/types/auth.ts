// ============================================================================
// Authentication Types
// ============================================================================
// ============================================================================
// User
// ============================================================================

export interface UserProfile {
  id: string

  avatar: string | null

  gender: string | null

  date_of_birth: string | null

  nationality: string | null

  phone_number: string | null

  biography: string

  preferred_language: string

  timezone: string

  created_at: string

  updated_at: string
}

export interface User {
  id: string

  email: string

  first_name: string

  last_name: string

  full_name: string

  short_name: string

  is_verified: boolean

  is_staff: boolean

  is_superuser: boolean

  is_active: boolean

  last_seen: string | null

  date_joined: string

  created_at: string

  updated_at: string

  profile: UserProfile
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  password_confirm: string
  first_name: string
  last_name: string
}

export interface TokenPair {
  access: string
  refresh: string
}

export interface LoginResponse {
  success: boolean
  message: string
  data: {
    user: User
    // Tokens are held only by the BFF in HttpOnly cookies.
  }
}

export interface RefreshResponse {
  success: boolean
  message: string
  data: TokenPair
}

export interface LogoutResponse {
  success: boolean
  message: string
}

export interface ApiErrorResponse {
  success: false
  message: string
  errors?: Record<string, string[]>
}

// ============================================================================
// Register
// ============================================================================

export interface RegisterResponse {
  success: boolean
  message: string
}

// ============================================================================
// Email Verification
// ============================================================================

export interface VerifyEmailRequest {
  token: string
}

export interface VerifyEmailResponse {
  success: boolean
  message: string
}

// ============================================================================
// Forgot Password
// ============================================================================

export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  success: boolean
  message: string
}

// ============================================================================
// Reset Password
// ============================================================================

export interface ResetPasswordRequest {
  token: string
  password: string
  password_confirm: string
}

export interface ResetPasswordResponse {
  success: boolean
  message: string
}

// ============================================================================
// Change Password
// ============================================================================

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
  new_password_confirm: string
}

export interface ChangePasswordResponse {
  success: boolean
  message: string
}

// ============================================================================
// Resend Verification
// ============================================================================

export interface ResendVerificationRequest {
  email: string
}

export interface ResendVerificationResponse {
  success: boolean
  message: string
}


// ============================================================================
// Forgot Password
// ============================================================================

export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  success: boolean
  message: string
}

// ============================================================================
// Reset Password
// ============================================================================

export interface ResetPasswordRequest {
  token: string
  password: string
  password_confirm: string
}

export interface ResetPasswordResponse {
  success: boolean
  message: string
}

// ============================================================================
// Verify Email
// ============================================================================
export interface VerifyEmailRequest {
    token: string
}

export interface VerifyEmailResponse {
    success: boolean
    message: string
  }

// ============================================================================
// Resend Verification
// ============================================================================
export interface ResendVerificationRequest {
    email: string
}

export interface ResendVerificationResponse {
    success: boolean
    message: string
}
