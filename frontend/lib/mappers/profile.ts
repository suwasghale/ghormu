import type { ProfileResponse } from "@/types/profile"

import type { ProfileFormValues } from "@/lib/validators/profile"

export function profileResponseToFormValues(
  response: ProfileResponse,
): ProfileFormValues {
  return {
    first_name: response.data.first_name,
    last_name: response.data.last_name,

    gender: response.data.profile.gender ?? "",
    date_of_birth:
      response.data.profile.date_of_birth ?? "",

    nationality:
      response.data.profile.nationality ?? "",

    phone_number:
      response.data.profile.phone_number ?? "",

    biography:
      response.data.profile.biography,

    preferred_language:
      response.data.profile.preferred_language,

    timezone:
      response.data.profile.timezone,
  }
}