"use client"

import { useForm } from "react-hook-form"

import { zodResolver } from "@hookform/resolvers/zod"
import {  Phone, FileText, Globe, User2Icon } from "lucide-react"

import {
  profileSchema,
  type ProfileFormValues,
} from "@/lib/validators/profile"

import { profileResponseToFormValues } from "@/lib/mappers/profile"

import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

import {
  GENDERS,
  LANGUAGES,
  TIMEZONES,
} from "@/lib/constants/profile"
import { Textarea } from "@/components/ui/textarea"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useUpdateProfile } from "@/hooks/mutations/use-update-profile"

type Props = {
  defaultValues: ProfileFormValues
}

export default function ProfileForm({
  defaultValues,
}: Props) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
    mode: "onTouched",
  })

  const mutation = useUpdateProfile()

  function onSubmit(values: ProfileFormValues) {
    mutation.mutate(values, {
      onSuccess: (response) => {
        form.reset(
          profileResponseToFormValues(response)
        )
      },
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-10"
      >
        {/* Personal Information */}

        <Card>

        <CardHeader>

          <CardTitle className="flex items-center gap-2 text-lg font-semibold">

            <User2Icon className="h-5 w-5 shrink-0" />

            <span>
              Personal Information
            </span>

          </CardTitle>

          <CardDescription>
            Information used to identify you.
          </CardDescription>

        </CardHeader>
        <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">

            {/* First Name */}

            <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
                <FormItem>

                <FormLabel>
                    First Name
                </FormLabel>

                <FormControl>

                    <Input
                    placeholder="Enter your first name"
                    {...field}
                    />

                </FormControl>

                <FormMessage />

                </FormItem>
            )}
            />

            {/* Last Name */}

            <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
                <FormItem>

                <FormLabel>
                    Last Name
                </FormLabel>

                <FormControl>

                    <Input
                    placeholder="Enter your last name"
                    {...field}
                    />

                </FormControl>

                <FormMessage />

                </FormItem>
            )}
            />

            {/* Gender */}

            <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
                <FormItem>

                <FormLabel>
                    Gender
                </FormLabel>

                <Select
                    value={field.value}
                    onValueChange={field.onChange}
                >

                    <FormControl>

                    <SelectTrigger>

                        <SelectValue placeholder="Select gender" />

                    </SelectTrigger>

                    </FormControl>

                    <SelectContent>

                        {GENDERS.map((gender) => (
                            <SelectItem
                                key={gender.value}
                                value={gender.value}
                            >
                                {gender.label}
                            </SelectItem>
                        ))}

                    </SelectContent>

                </Select>

                <FormMessage />

                </FormItem>
            )}
            />

            {/* Date of Birth */}

            <FormField
            control={form.control}
            name="date_of_birth"
            render={({ field }) => (
                <FormItem>

                <FormLabel>
                    Date of Birth
                </FormLabel>

                <FormControl>

                    <Input
                    type="date"
                    {...field}
                    />

                </FormControl>

                <FormMessage />

                </FormItem>
            )}
            />

        </div>
        </CardContent>
        </Card>

        {/* Contact Information */}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Phone className="h-5 w-5 shrink-0" />
              <span>Contact Information</span>
            </CardTitle>

            <CardDescription className="text-sm text-muted-foreground">
              Information used to contact you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">

            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>

                  <FormLabel>
                    Nationality
                  </FormLabel>

                  <FormControl>

                    <Input
                      placeholder="Enter your nationality"
                      {...field}
                    />

                  </FormControl>

                  <FormMessage />

                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>

                  <FormLabel>
                    Phone Number
                  </FormLabel>

                  <FormControl>

                    <Input
                      type="tel"
                      placeholder="+977 98XXXXXXXX"
                      {...field}
                    />

                  </FormControl>

                  <FormMessage />

                </FormItem>
              )}
            />

          </div>
          </CardContent>
        </Card>

        {/* Biography */}

        <Card>
          <CardHeader>

            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <FileText className="h-5 w-5 shrink-0" />
              <span>Biography</span>
            </CardTitle>

            <CardDescription className="text-sm text-muted-foreground">
              Tell others a little about yourself.
            </CardDescription>

          </CardHeader>
          <CardContent className="space-y-6">
          <FormField
            control={form.control}
            name="biography"
            render={({ field }) => (
              <FormItem>

                <FormLabel>
                  Biography
                </FormLabel>

                <FormControl>

                  <Textarea
                    rows={6}
                    placeholder="Tell visitors a little about yourself"
                    className="resize-none"
                    {...field}
                  />

                </FormControl>

                <FormDescription>
                  This introduction will be displayed on your public profile.
                </FormDescription>

                <FormMessage />

              </FormItem>
            )}
          />

        </CardContent>

        </Card>

        {/* Preferences */}

        <Card>

          <CardHeader>

            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Globe className="h-5 w-5 shrink-0" />
              <span>Preferences</span>
            </CardTitle>

            <CardDescription className="text-sm text-muted-foreground">
              Customize your language and timezone.
            </CardDescription>

          </CardHeader>
          <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">

            {/* Preferred Language */}

            <FormField
              control={form.control}
              name="preferred_language"
              render={({ field }) => (
                <FormItem>

                  <FormLabel>
                    Preferred Language
                  </FormLabel>

                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >

                    <FormControl>

                      <SelectTrigger>

                        <SelectValue placeholder="Select language" />

                      </SelectTrigger>

                    </FormControl>

                    <SelectContent>

                      {LANGUAGES.map((language) => (
                        <SelectItem
                          key={language.value}
                          value={language.value}
                        >
                          {language.label}
                        </SelectItem>
                      ))}

                    </SelectContent>

                  </Select>

                  <FormMessage />

                </FormItem>
              )}
            />

            {/* Timezone */}

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>

                  <FormLabel>
                    Timezone
                  </FormLabel>

                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >

                    <FormControl>

                      <SelectTrigger>

                        <SelectValue placeholder="Select timezone" />

                      </SelectTrigger>

                    </FormControl>

                    <SelectContent>

                      {TIMEZONES.map((timezone) => (
                        <SelectItem
                          key={timezone.value}
                          value={timezone.value}
                        >
                          {timezone.label}
                        </SelectItem>
                      ))}

                    </SelectContent>

                  </Select>

                  <FormMessage />

                </FormItem>
              )}
            />

          </div>
        </CardContent>
        </Card>

        <div className="flex justify-end border-t pt-6">

        <Button
          type="submit"
          disabled={
            mutation.isPending ||
            !form.formState.isDirty
          }
        >
          {mutation.isPending
            ? "Saving..."
            : "Save Changes"}
        </Button>

        </div>

      </form>
    </Form>
  )
}