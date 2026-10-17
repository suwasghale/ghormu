import { Users, LayoutDashboard, type LucideIcon } from "lucide-react"

export type FieldType =
  | "text"
  | "textarea"
  | "html"
  | "select"
  | "boolean"
  | "number"
  | "url"
  | "image"
  | "email"
  | "datetime"
  // A day with no time. Django's DateField wants "YYYY-MM-DD"; sending
  // the datetime-local value would append a time it then rejects.
  | "date"

export interface Option {
  value: string
  label: string
}

export interface FieldDef {
  name: string
  label: string
  type: FieldType
  options?: Option[]
  required?: boolean
  help?: string
  placeholder?: string
  rows?: number

  /** Which fieldset the input belongs to. */
  group?: string

  /** Shown, never submitted. */
  readOnly?: boolean
}

export type ColumnType =
  | "text"
  | "status"
  | "boolean"
  | "date"
  | "image"
  | "badge"
  | "number"

export interface ColumnDef {
  name: string
  label: string
  type?: ColumnType

  /** Tailwind width class, when the default distribution reads badly. */
  className?: string
}

export interface FilterDef {
  name: string
  label: string
  options: Option[]
}

export interface ResourceDef {
  /** URL segment under /admin and the API path segment. They match. */
  key: string

  label: string
  labelSingular: string
  icon: LucideIcon

  /** Sentence under the page title. */
  description: string

  columns: ColumnDef[]
  fields: FieldDef[]
  filters: FilterDef[]

  searchPlaceholder: string

  /** Field rendered as the row's name in headings and delete prompts. */
  titleField: string

  /** Resources that exist but cannot be created from the UI. */
  canCreate?: boolean
  canDelete?: boolean

  /** Label for the destructive action, when it is not a hard delete. */
  deleteLabel?: string
}

// ----------------------------------------------------------------------------
// Shared option sets
//
// Mirrors the backend TextChoices. Kept in one place so a value added in
// Django is a one-line change here, and so two resources cannot disagree
// about what "published" is called.
// ----------------------------------------------------------------------------

export const RESOURCES: Record<string, ResourceDef> = {
  users: {
    key: "users",
    label: "Users",
    labelSingular: "User",
    icon: Users,
    description: "Accounts that can sign in to the site and this area.",
    titleField: "email",
    searchPlaceholder: "Search by email or name…",

    // Accounts are created by registration or invitation, never here —
    // an account with no password and no verification email is a
    // half-account. The API refuses the POST; the UI does not offer it.
    canCreate: false,
    deleteLabel: "Deactivate",

    columns: [
      { name: "email", label: "Email" },
      { name: "full_name", label: "Name" },
      { name: "is_staff", label: "Staff", type: "boolean", className: "w-24" },
      { name: "is_active", label: "Active", type: "boolean", className: "w-24" },
      { name: "is_verified", label: "Verified", type: "boolean", className: "w-24" },
      { name: "last_login", label: "Last sign-in", type: "date", className: "w-44" },
    ],

    filters: [
      {
        name: "is_active",
        label: "Active",
        options: [
          { value: "true", label: "Active" },
          { value: "false", label: "Deactivated" },
        ],
      },
      {
        name: "is_staff",
        label: "Staff",
        options: [
          { value: "true", label: "Staff" },
          { value: "false", label: "Non-staff" },
        ],
      },
      {
        name: "is_verified",
        label: "Verified",
        options: [
          { value: "true", label: "Verified" },
          { value: "false", label: "Unverified" },
        ],
      },
    ],

    fields: [
      { name: "email", label: "Email", type: "email", required: true, group: "Identity" },
      { name: "first_name", label: "First name", type: "text", group: "Identity" },
      { name: "last_name", label: "Last name", type: "text", group: "Identity" },

      {
        name: "is_active",
        label: "Account active",
        type: "boolean",
        group: "Access",
        help: "An inactive account can no longer sign in.",
      },
      {
        name: "is_verified",
        label: "Email verified",
        type: "boolean",
        group: "Access",
      },
      {
        name: "is_staff",
        label: "Admin access",
        type: "boolean",
        group: "Access",
        help: "Superusers only.",
      },
      {
        name: "is_superuser",
        label: "Superuser",
        type: "boolean",
        group: "Access",
        help: "All permissions. Superusers only.",
      },

      { name: "last_login", label: "Last sign-in", type: "datetime", group: "History", readOnly: true },
      { name: "date_joined", label: "Joined", type: "datetime", group: "History", readOnly: true },
    ],
  },
}
export const RESOURCE_ORDER: string[] = ["users"]
export const DASHBOARD_ICON = LayoutDashboard
export function getResource(key: string): ResourceDef | null { return RESOURCES[key] ?? null }
