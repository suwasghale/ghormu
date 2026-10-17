// ============================================================================
// Image upload
// ============================================================================
//
// POSTs one file to /admin/media/ and gets back the URL it was stored at —
// the local media directory in development, the ghormu-media R2 bucket in
// production. The form then writes that URL into the row's `image_url`.
//
// Not routed through `apiClient`: that helper JSON-encodes every body and
// sets `Content-Type: application/json`, which would corrupt a multipart
// upload. The token and refresh handling are reproduced here instead.
// ============================================================================


export interface UploadedMedia {
  url: string
  name: string
  size: number
}

export class UploadError extends Error {}

/**
 * Upload one image.
 *
 * Throws `UploadError` with the server's own message, which is written
 * for an editor to read ("The image must not exceed 10 MB.") rather
 * than a status code.
 */
export async function uploadImage(file: File): Promise<UploadedMedia> {
  const body = new FormData()
  body.append("file", file)

  const response = await fetch(
    "/api/proxy/admin/media",
    {
      method: "POST",
      // No Content-Type: the browser must set it, because only it knows
      // the multipart boundary it generated.
      headers: {
        Accept: "application/json",
      },
      body,
    },
  )

  let payload: {
    success?: boolean
    message?: string
    data?: UploadedMedia
    errors?: Record<string, string[] | string>
  } | null = null

  try {
    payload = await response.json()
  } catch {
    // An empty or non-JSON body; handled by the status check below.
  }

  if (!response.ok || !payload?.data) {
    const fieldError = payload?.errors?.file

    throw new UploadError(
      (Array.isArray(fieldError) ? fieldError[0] : fieldError) ||
        payload?.message ||
        "Upload failed.",
    )
  }

  return payload.data
}
