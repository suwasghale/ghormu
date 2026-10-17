import { z } from "zod"

export const profileSchema = z.object({
  first_name: z.string().trim().max(150),

  last_name: z.string().trim().max(150),

  gender: z.string(),

  date_of_birth: z.string(),

  nationality: z.string().length(2).or(z.literal("")),

  phone_number: z.string(),

  biography: z.string().max(500),

  preferred_language: z.string(),

  timezone: z.string(),
})

export type ProfileFormValues = z.infer<
  typeof profileSchema
>