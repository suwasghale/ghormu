"use client"

import * as React from "react"

import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { Label } from "@/components/ui/label"

export const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName
}

const FormFieldContext =
  React.createContext<FormFieldContextValue>(
    {} as FormFieldContextValue,
  )

export function FormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider
      value={{ name: props.name }}
    >
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const FormItemContext =
  React.createContext<{
    id: string
  }>({
    id: "",
  })

export function FormItem({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        className={className}
        {...props}
      />
    </FormItemContext.Provider>
  )
}

function useFormField() {
  const fieldContext = React.useContext(
    FormFieldContext,
  )

  const itemContext = React.useContext(
    FormItemContext,
  )

  const {
    getFieldState,
    formState,
  } = useFormContext()

  const fieldState = getFieldState(
    fieldContext.name,
    formState,
  )

  const id = itemContext.id

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-item`,
    formDescriptionId: `${id}-description`,
    formMessageId: `${id}-message`,
    ...fieldState,
  }
}

export function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  const {
    formItemId,
    error,
  } = useFormField()

  return (
    <Label
      htmlFor={formItemId}
      className={
        error
          ? `text-destructive ${className ?? ""}`
          : className
      }
      {...props}
    />
  )
}

export function FormControl({
  ...props
}: React.ComponentProps<"div">) {
  const {
    formItemId,
    formDescriptionId,
    formMessageId,
    error,
  } = useFormField()

  return (
    <div
      id={formItemId}
      aria-describedby={
        error
          ? `${formDescriptionId} ${formMessageId}`
          : formDescriptionId
      }
      aria-invalid={!!error}
      {...props}
    />
  )
}

export function FormDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  const {
    formDescriptionId,
  } = useFormField()

  return (
    <p
      id={formDescriptionId}
      className={`text-sm text-muted-foreground ${className ?? ""}`}
      {...props}
    />
  )
}

export function FormMessage({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) {
  const {
    error,
    formMessageId,
  } = useFormField()

  const body = error?.message
    ? String(error.message)
    : children

  if (!body) {
    return null
  }

  return (
    <p
      id={formMessageId}
      className={`text-sm font-medium text-destructive ${className ?? ""}`}
      {...props}
    >
      {body}
    </p>
  )
}