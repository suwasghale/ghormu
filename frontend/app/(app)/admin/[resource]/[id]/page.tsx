// ============================================================================
// Resource create / edit page
// ============================================================================
//
// `/admin/<resource>/new` creates; `/admin/<resource>/<uuid>` edits. One
// route rather than two, because the form is the same either way — only
// whether it starts empty differs.
// ============================================================================

import { notFound } from "next/navigation"

import ResourceForm from "../../components/resource-form"

import { getResource } from "@/lib/admin/resources"

export default async function AdminResourceFormPage({
  params,
}: {
  params: Promise<{ resource: string; id: string }>
}) {
  const { resource: key, id } = await params

  const resource = getResource(key)

  if (!resource) notFound()

  const creating = id === "new"

  // A resource that cannot be created has no create form to show.
  if (creating && resource.canCreate === false) notFound()

  return <ResourceForm resourceKey={resource.key} id={creating ? null : id} />
}
