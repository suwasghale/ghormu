"use client"

// ============================================================================
// Image field
// ============================================================================
//
// Pick a file, upload it, keep the URL.
//
// The upload happens on selection rather than on form submit. An image is
// the one field whose result the editor has to *see* to know they picked
// the right file, and deferring it would mean a save that fails for a
// reason nothing on screen explains.
//
// The stored value is the URL, which goes into the row's `image_url`
// column. Pasting an external URL still works — the text input below the
// preview is the same field — so nothing that already relies on hotlinked
// images breaks.
// ============================================================================

import { useRef, useState } from "react"
import { ImagePlus, Loader2, X } from "lucide-react"
import { toast } from "sonner"

import { uploadImage, UploadError } from "@/lib/api/admin/media"

export default function ImageField({
  id,
  value,
  onChange,
  onBlur,
  invalid,
  describedBy,
}: {
  id: string
  /** The image URL, or "". */
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  invalid?: boolean
  describedBy?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function pick(file: File | undefined) {
    if (!file) return

    setUploading(true)

    try {
      const media = await uploadImage(file)

      onChange(media.url)
      toast.success("Image uploaded.")
    } catch (error) {
      toast.error(
        error instanceof UploadError
          ? error.message
          : "Upload failed.",
      )
    } finally {
      setUploading(false)

      // Cleared so re-picking the same file still fires `change`.
      if (input.current) input.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <div
        className={`relative flex aspect-[3/2] w-full max-w-sm items-center justify-center overflow-hidden rounded-lg border border-dashed transition-colors ${
          invalid ? "border-red-300" : "border-gray-300 hover:border-gray-900"
        } bg-gray-50`}
      >
        {value ? (
          <>
            {/* A plain <img>: the URL is whatever storage returned a
                second ago, and next/image would need that host in
                remotePatterns at build time — impossible for an upload. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt=""
              className="h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none"
              }}
            />

            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Remove image"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm backdrop-blur transition-colors hover:text-red-600"
            >
              <X size={15} aria-hidden />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={uploading}
            className="flex flex-col items-center gap-2 px-4 py-6 text-gray-500 transition-colors hover:text-gray-900 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 size={20} className="animate-spin" aria-hidden />
            ) : (
              <ImagePlus size={20} aria-hidden />
            )}
            <span className="text-xs font-medium">
              {uploading ? "Uploading…" : "Choose an image"}
            </span>
          </button>
        )}
      </div>

      {value && (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={uploading}
          className="text-xs font-medium text-gray-700 underline transition-colors hover:text-gray-900 disabled:opacity-60"
        >
          {uploading ? "Uploading…" : "Replace image"}
        </button>
      )}

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => pick(event.target.files?.[0])}
      />

      {/* Still editable by hand: some rows point at an image hosted
          elsewhere, and retyping a URL must stay possible. */}
      <input
        id={id}
        type="url"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder="…or paste an image URL"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition-colors ${
          invalid
            ? "border-red-300 focus:border-red-500"
            : "border-gray-200 focus:border-gray-900"
        }`}
      />
    </div>
  )
}
