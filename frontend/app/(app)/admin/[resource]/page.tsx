// ============================================================================
// Resource list page
// ============================================================================
//
// One route for all nine resources. `/admin/dashboard` is a static
// segment and wins over this dynamic one, so it is unaffected.
// ============================================================================

import { notFound } from "next/navigation"

import ResourceTable from "../components/resource-table"

import { getResource, RESOURCE_ORDER } from "@/lib/admin/resources"

export function generateStaticParams() {
  return RESOURCE_ORDER.map((resource) => ({ resource }))
}

export default async function AdminResourcePage({
  params,
}: {
  params: Promise<{ resource: string }>
}) {
  const { resource: key } = await params

  const resource = getResource(key)

  if (!resource) notFound()

  return <ResourceTable resourceKey={resource.key} />
}
