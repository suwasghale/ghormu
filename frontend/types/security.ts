export interface Session {
  id: string
  device_name: string
  device_type: string
  browser: string
  browser_version: string
  operating_system: string
  operating_system_version: string
  country: string | null
  city: string
  ip_address: string
  login_at: string
  last_activity: string
  is_trusted: boolean
  is_current: boolean
}
export interface MfaStatus {
  enabled: boolean
  recovery_codes_remaining: number
}

export interface MfaEnrolment {
  secret: string
  provisioning_uri: string
}
