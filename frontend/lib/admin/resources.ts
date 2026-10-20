import { Archive, CalendarDays, Construction, Inbox, LayoutDashboard, MapPin, Newspaper, Users, type LucideIcon } from "lucide-react"

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

const STATUS_OPTIONS: Option[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
]

const POST_KINDS: Option[] = [
  { value: "news", label: "News" },
  { value: "announcement", label: "Announcement" },
]

const EVENT_CATEGORIES: Option[] = [
  { value: "festival", label: "Festival" },
  { value: "ceremony", label: "Ceremony" },
  { value: "meeting", label: "Meeting" },
  { value: "community", label: "Community programme" },
  { value: "sports", label: "Sports" },
  { value: "other", label: "Other" },
]

const PROJECT_STAGES: Option[] = [
  { value: "planned", label: "Planned" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
]

const ARCHIVE_KINDS: Option[] = [
  { value: "photo", label: "Photo" },
  { value: "document", label: "Document" },
  { value: "map", label: "Map" },
  { value: "satellite", label: "Satellite image (through time)" },
]

const PLACE_CATEGORIES: Option[] = [
  { value: "sacred", label: "Sacred place" },
  { value: "school", label: "School" },
  { value: "water", label: "Water source" },
  { value: "viewpoint", label: "Viewpoint" },
  { value: "trail", label: "Trail or path" },
  { value: "community", label: "Community place" },
  { value: "health", label: "Health" },
  { value: "other", label: "Other" },
]

const MESSAGE_TOPICS: Option[] = [
  { value: "general", label: "General question" },
  { value: "feedback", label: "Feedback" },
  { value: "correction", label: "Correction" },
  { value: "archive", label: "Photos & stories" },
  { value: "travel", label: "Visiting" },
  { value: "support", label: "Supporting Ghormu" },
]

/** Publication fields every public content type shares. */
const PUBLISHING: FieldDef[] = [
  { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS, required: true, group: "Publishing" },
  {
    name: "published_at",
    label: "Publish at",
    type: "datetime",
    group: "Publishing",
    help: "Leave empty to publish now. A future time schedules it.",
  },
]

const STATUS_FILTER: FilterDef = { name: "status", label: "Status", options: STATUS_OPTIONS }

export const RESOURCES: Record<string, ResourceDef> = {
  posts: {
    key: "posts",
    label: "News & notices",
    labelSingular: "Post",
    icon: Newspaper,
    description: "News stories and announcements shown under Updates.",
    titleField: "title_ne",
    searchPlaceholder: "Search by title…",
    columns: [
      { name: "image_url", label: "", type: "image", className: "w-16" },
      { name: "title_ne", label: "Title" },
      { name: "kind", label: "Kind", type: "badge", className: "w-36" },
      { name: "is_pinned", label: "Pinned", type: "boolean", className: "w-24" },
      { name: "status", label: "Status", type: "status", className: "w-32" },
      { name: "published_at", label: "Published", type: "date", className: "w-44" },
    ],
    filters: [{ name: "kind", label: "Kind", options: POST_KINDS }, STATUS_FILTER],
    fields: [
      { name: "kind", label: "Kind", type: "select", options: POST_KINDS, required: true, group: "Post" },
      { name: "title_ne", label: "Title (Nepali)", type: "text", required: true, group: "Nepali" },
      { name: "summary_ne", label: "Summary (Nepali)", type: "textarea", rows: 3, group: "Nepali", help: "One or two sentences shown in lists." },
      { name: "body_ne", label: "Body (Nepali)", type: "html", group: "Nepali" },
      { name: "title_en", label: "Title (English)", type: "text", group: "English", help: "Optional. Without it, English visitors see the Nepali text." },
      { name: "summary_en", label: "Summary (English)", type: "textarea", rows: 3, group: "English" },
      { name: "body_en", label: "Body (English)", type: "html", group: "English" },
      { name: "image_url", label: "Cover image", type: "image", group: "Media" },
      { name: "attachment_url", label: "Attachment link", type: "url", group: "Media", help: "A PDF such as meeting minutes, hosted anywhere public." },
      { name: "slug", label: "Address", type: "text", group: "Publishing", help: "ghormu.com/ne/updates/<address>. Filled in automatically when empty." },
      { name: "is_pinned", label: "Pin to top", type: "boolean", group: "Publishing" },
      ...PUBLISHING,
    ],
  },

  events: {
    key: "events",
    label: "Events",
    labelSingular: "Event",
    icon: CalendarDays,
    description: "Festivals, meetings and programmes on the public events calendar.",
    titleField: "title_ne",
    searchPlaceholder: "Search by title or place…",
    columns: [
      { name: "title_ne", label: "Title" },
      { name: "category", label: "Category", type: "badge", className: "w-40" },
      { name: "starts_on", label: "Starts", type: "date", className: "w-40" },
      { name: "status", label: "Status", type: "status", className: "w-32" },
    ],
    filters: [{ name: "category", label: "Category", options: EVENT_CATEGORIES }, STATUS_FILTER],
    fields: [
      { name: "category", label: "Category", type: "select", options: EVENT_CATEGORIES, required: true, group: "Event" },
      { name: "starts_on", label: "Starts on", type: "date", required: true, group: "Event" },
      { name: "ends_on", label: "Ends on", type: "date", group: "Event", help: "Leave empty for a one-day event." },
      { name: "title_ne", label: "Title (Nepali)", type: "text", required: true, group: "Nepali" },
      { name: "location_ne", label: "Place (Nepali)", type: "text", group: "Nepali" },
      { name: "description_ne", label: "Description (Nepali)", type: "textarea", rows: 4, group: "Nepali" },
      { name: "title_en", label: "Title (English)", type: "text", group: "English" },
      { name: "location_en", label: "Place (English)", type: "text", group: "English" },
      { name: "description_en", label: "Description (English)", type: "textarea", rows: 4, group: "English" },
      { name: "image_url", label: "Image", type: "image", group: "Media" },
      ...PUBLISHING,
    ],
  },

  projects: {
    key: "projects",
    label: "Development",
    labelSingular: "Project",
    icon: Construction,
    description: "Roads, water, school and other village projects, with progress and budget.",
    titleField: "title_ne",
    searchPlaceholder: "Search by title…",
    columns: [
      { name: "image_url", label: "", type: "image", className: "w-16" },
      { name: "title_ne", label: "Title" },
      { name: "stage", label: "Stage", type: "badge", className: "w-32" },
      { name: "progress", label: "Progress %", type: "number", className: "w-28" },
      { name: "status", label: "Status", type: "status", className: "w-32" },
    ],
    filters: [{ name: "stage", label: "Stage", options: PROJECT_STAGES }, STATUS_FILTER],
    fields: [
      { name: "stage", label: "Stage", type: "select", options: PROJECT_STAGES, required: true, group: "Project" },
      { name: "progress", label: "Progress (%)", type: "number", group: "Project", help: "0–100. Completed projects show 100." },
      { name: "budget_npr", label: "Budget (NPR)", type: "number", group: "Project", help: "Leave empty if it is not public." },
      { name: "started_on", label: "Started on", type: "date", group: "Project" },
      { name: "completed_on", label: "Completed on", type: "date", group: "Project" },
      { name: "title_ne", label: "Title (Nepali)", type: "text", required: true, group: "Nepali" },
      { name: "summary_ne", label: "Summary (Nepali)", type: "textarea", rows: 4, group: "Nepali" },
      { name: "funding_ne", label: "Funding (Nepali)", type: "text", group: "Nepali", help: "Who pays, e.g. the rural municipality or the community." },
      { name: "title_en", label: "Title (English)", type: "text", group: "English" },
      { name: "summary_en", label: "Summary (English)", type: "textarea", rows: 4, group: "English" },
      { name: "funding_en", label: "Funding (English)", type: "text", group: "English" },
      { name: "image_url", label: "Image", type: "image", group: "Media" },
      ...PUBLISHING,
    ],
  },

  archive: {
    key: "archive",
    label: "Archive",
    labelSingular: "Archive item",
    icon: Archive,
    description: "Old photos, documents, maps and dated satellite views of Ghormu.",
    titleField: "title_ne",
    searchPlaceholder: "Search by title, place or credit…",
    columns: [
      { name: "image_url", label: "", type: "image", className: "w-16" },
      { name: "title_ne", label: "Title" },
      { name: "kind", label: "Kind", type: "badge", className: "w-40" },
      { name: "year", label: "Year", type: "number", className: "w-24" },
      { name: "consent_confirmed", label: "Permission", type: "boolean", className: "w-28" },
      { name: "status", label: "Status", type: "status", className: "w-32" },
    ],
    filters: [
      { name: "kind", label: "Kind", options: ARCHIVE_KINDS },
      STATUS_FILTER,
      {
        name: "consent_confirmed",
        label: "Permission",
        options: [
          { value: "true", label: "Confirmed" },
          { value: "false", label: "Not yet" },
        ],
      },
    ],
    fields: [
      { name: "kind", label: "Kind", type: "select", options: ARCHIVE_KINDS, required: true, group: "Item" },
      { name: "image_url", label: "Image or scan", type: "image", group: "Item" },
      { name: "year", label: "Year (AD)", type: "number", group: "Item", help: "Exact or best guess, e.g. 1995. Used to sort and group by decade." },
      {
        name: "credit",
        label: "Credit",
        type: "text",
        group: "Item",
        help: "Who gave it or took it. Satellite images: the exact credit line, e.g. Imagery: Google, Maxar Technologies.",
      },
      {
        name: "consent_confirmed",
        label: "Permission confirmed",
        type: "boolean",
        group: "Item",
        help: "The owner, and anyone recognisable in it, agreed to publication. Required to publish.",
      },
      { name: "title_ne", label: "Title (Nepali)", type: "text", required: true, group: "Nepali" },
      { name: "date_label_ne", label: "Date shown (Nepali)", type: "text", group: "Nepali", placeholder: "करिब २०४५ साल" },
      { name: "place_ne", label: "Place (Nepali)", type: "text", group: "Nepali" },
      { name: "description_ne", label: "Story (Nepali)", type: "textarea", rows: 5, group: "Nepali" },
      { name: "title_en", label: "Title (English)", type: "text", group: "English" },
      { name: "date_label_en", label: "Date shown (English)", type: "text", group: "English", placeholder: "around 1988" },
      { name: "place_en", label: "Place (English)", type: "text", group: "English" },
      { name: "description_en", label: "Story (English)", type: "textarea", rows: 5, group: "English" },
      { name: "slug", label: "Address", type: "text", group: "Publishing", help: "ghormu.com/ne/about/archive/<address>. Filled in automatically when empty." },
      ...PUBLISHING,
    ],
  },

  places: {
    key: "places",
    label: "Map places",
    labelSingular: "Map place",
    icon: MapPin,
    description: "Public places pinned on the 3D village map. Never private homes.",
    titleField: "name_ne",
    searchPlaceholder: "Search by name…",
    columns: [
      { name: "name_ne", label: "Name" },
      { name: "category", label: "Category", type: "badge", className: "w-40" },
      { name: "sort_order", label: "Order", type: "number", className: "w-24" },
      { name: "status", label: "Status", type: "status", className: "w-32" },
    ],
    filters: [{ name: "category", label: "Category", options: PLACE_CATEGORIES }, STATUS_FILTER],
    fields: [
      { name: "category", label: "Category", type: "select", options: PLACE_CATEGORIES, required: true, group: "Place" },
      {
        name: "latitude",
        label: "Latitude",
        // Text, not a number input: browsers refuse decimals without a step.
        type: "text",
        required: true,
        group: "Place",
        placeholder: "28.010270",
        help: "In Google Maps, right-click the exact spot and click the two numbers at the top to copy them. The first is the latitude.",
      },
      { name: "longitude", label: "Longitude", type: "text", required: true, group: "Place", placeholder: "85.254317", help: "The second number." },
      { name: "sort_order", label: "Order", type: "number", group: "Place", help: "Lower numbers come first in the list beside the map." },
      { name: "name_ne", label: "Name (Nepali)", type: "text", required: true, group: "Nepali" },
      { name: "description_ne", label: "Description (Nepali)", type: "textarea", rows: 3, group: "Nepali" },
      { name: "name_en", label: "Name (English)", type: "text", group: "English" },
      { name: "description_en", label: "Description (English)", type: "textarea", rows: 3, group: "English" },
      { name: "image_url", label: "Photo", type: "image", group: "Media" },
      ...PUBLISHING,
    ],
  },

  messages: {
    key: "messages",
    label: "Messages",
    labelSingular: "Message",
    icon: Inbox,
    description: "What visitors sent through the contact and feedback forms.",
    titleField: "name",
    searchPlaceholder: "Search by name, email, phone or text…",
    canCreate: false,
    columns: [
      { name: "name", label: "From" },
      { name: "topic", label: "Topic", type: "badge", className: "w-40" },
      { name: "handled", label: "Handled", type: "boolean", className: "w-24" },
      { name: "created_at", label: "Received", type: "date", className: "w-44" },
    ],
    filters: [
      { name: "topic", label: "Topic", options: MESSAGE_TOPICS },
      {
        name: "handled",
        label: "Handled",
        options: [
          { value: "false", label: "Open" },
          { value: "true", label: "Handled" },
        ],
      },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", readOnly: true, group: "Message" },
      { name: "email", label: "Email", type: "email", readOnly: true, group: "Message" },
      { name: "phone", label: "Phone", type: "text", readOnly: true, group: "Message" },
      { name: "topic", label: "Topic", type: "select", options: MESSAGE_TOPICS, readOnly: true, group: "Message" },
      { name: "language", label: "Language", type: "text", readOnly: true, group: "Message" },
      { name: "message", label: "Message", type: "textarea", rows: 8, readOnly: true, group: "Message" },
      { name: "handled", label: "Handled", type: "boolean", group: "Follow-up" },
      { name: "staff_note", label: "Staff note", type: "textarea", rows: 3, group: "Follow-up", help: "Only staff see this." },
      { name: "created_at", label: "Received", type: "datetime", readOnly: true, group: "Follow-up" },
    ],
  },

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
export const RESOURCE_ORDER: string[] = ["posts", "events", "projects", "archive", "places", "messages", "users"]
export const DASHBOARD_ICON = LayoutDashboard
export function getResource(key: string): ResourceDef | null { return RESOURCES[key] ?? null }
