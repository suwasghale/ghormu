"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { CheckCircle2, LoaderCircle, Send } from "lucide-react"

import type contact from "@/content/contact"
import type { Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

import { buttonStyles } from "./section"

type Strings = (typeof contact)["ne"]["form"]
type Topic = keyof Strings["topics"]
type Field = "name" | "email" | "phone" | "message"

type Props = {
  locale: Locale
  strings: Strings
  defaultTopic?: Topic
  privacyHref: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * The contact form, wherever it appears. A link may preselect the topic
 * (`?topic=archive`) and name the page it is about (`?about=<slug>`), as the
 * archive's "request removal" link does.
 *
 * Reading the query string needs the browser, so the form renders first
 * with its defaults and picks those up on the client.
 */
export function ContactForm(props: Props) {
  return (
    <Suspense fallback={<Form {...props} />}>
      <FormWithQuery {...props} />
    </Suspense>
  )
}

function FormWithQuery(props: Props) {
  const query = useSearchParams()
  const topic = query.get("topic")
  const about = query.get("about")
  const known = topic && topic in props.strings.topics ? (topic as Topic) : undefined

  return <Form {...props} defaultTopic={known ?? props.defaultTopic} about={about ?? undefined} />
}

function Form({ locale, strings, defaultTopic = "general", privacyHref, about }: Props & { about?: string }) {
  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    topic: defaultTopic,
    message: about ? `(${about})\n\n` : "",
    website: "",
  })
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle")
  const [formError, setFormError] = useState("")

  const set = (field: keyof typeof values) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [field]: event.target.value }))

  function validate(): Partial<Record<Field, string>> {
    const found: Partial<Record<Field, string>> = {}
    const digits = values.phone.replace(/\D/g, "").length

    if (!values.name.trim()) found.name = strings.errors.name
    if (!values.email.trim() && !values.phone.trim()) found.email = strings.errors.contact
    if (values.email.trim() && !EMAIL.test(values.email.trim())) found.email = strings.errors.email
    if (values.phone.trim() && (digits < 7 || digits > 15)) found.phone = strings.errors.phone
    if (values.message.trim().length < 10) found.message = strings.errors.message

    return found
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError("")

    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setStatus("sending")

    try {
      const response = await fetch("/api/proxy/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...values, language: locale }),
      })

      if (response.ok) {
        setStatus("sent")
        return
      }

      setStatus("idle")

      if (response.status === 429) {
        setFormError(strings.errors.tooMany)
        return
      }

      const body = (await response.json().catch(() => null)) as { errors?: Record<string, string[] | string> } | null
      const serverErrors = body?.errors ?? {}
      const mapped: Partial<Record<Field, string>> = {}

      for (const field of ["name", "email", "phone", "message"] as const) {
        if (serverErrors[field]) mapped[field] = field === "email" && !values.email ? strings.errors.contact : strings.errors[field]
      }

      setErrors(mapped)
      if (Object.keys(mapped).length === 0) setFormError(strings.errors.failed)
    } catch {
      setStatus("idle")
      setFormError(strings.errors.failed)
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="rounded-3xl bg-brand-muted p-8 text-center sm:p-12">
        <CheckCircle2 aria-hidden="true" className="mx-auto size-12 text-brand" />
        <p className="mt-4 font-display text-2xl font-semibold">{strings.successTitle}</p>
        <p className="mt-2 text-muted-foreground">{strings.successBody}</p>
        <button
          type="button"
          onClick={() => {
            setValues((current) => ({ ...current, message: "" }))
            setStatus("idle")
          }}
          className={cn(buttonStyles.secondary, "mt-6")}
        >
          {strings.another}
        </button>
      </div>
    )
  }

  return (
    <form noValidate onSubmit={submit} className="relative grid gap-5">
      <Input id="name" label={strings.name} value={values.name} onChange={set("name")} error={errors.name} autoComplete="name" required />

      <div className="grid gap-5 sm:grid-cols-2">
        <Input id="email" label={strings.email} type="email" value={values.email} onChange={set("email")} error={errors.email} autoComplete="email" />
        <Input id="phone" label={strings.phone} type="tel" value={values.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel" />
      </div>
      <p className="-mt-3 text-sm text-muted-foreground">{strings.replyNote}</p>

      <div>
        <label htmlFor="topic" className="text-sm font-medium">
          {strings.topic}
        </label>
        <select
          id="topic"
          value={values.topic}
          onChange={set("topic")}
          className="mt-1.5 h-12 w-full rounded-xl border border-input bg-background px-3 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
        >
          {(Object.keys(strings.topics) as Topic[]).map((topic) => (
            <option key={topic} value={topic}>
              {strings.topics[topic]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="text-sm font-medium">
          {strings.message} <span aria-hidden="true" className="text-earth">*</span>
        </label>
        <textarea
          id="message"
          rows={6}
          value={values.message}
          onChange={set("message")}
          placeholder={strings.messagePlaceholder}
          required
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
          className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 leading-relaxed focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand aria-invalid:border-destructive"
        />
        {errors.message && (
          <p id="message-error" className="mt-1.5 text-sm text-destructive">
            {errors.message}
          </p>
        )}
      </div>

      {/* Honeypot: hidden from people and screen readers, filled by bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} />
      </div>

      {formError && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {formError}
        </p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {strings.privacy}{" "}
          <Link href={privacyHref} className="font-medium text-brand underline underline-offset-2">
            {strings.privacyLink}
          </Link>
        </p>
        <button type="submit" disabled={status === "sending"} className={cn(buttonStyles.primary, "disabled:opacity-60")}>
          {status === "sending" ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Send aria-hidden="true" className="size-4" />
          )}
          {status === "sending" ? strings.sending : strings.submit}
        </button>
      </div>
    </form>
  )
}

function Input({
  id,
  label,
  error,
  required,
  ...props
}: { id: string; label: string; error?: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label} {required && <span aria-hidden="true" className="text-earth">*</span>}
      </label>
      <input
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-1.5 h-12 w-full rounded-xl border border-input bg-background px-3 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand aria-invalid:border-destructive"
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
