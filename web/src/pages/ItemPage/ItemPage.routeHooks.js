import { db } from '$api/src/lib/db'

export async function routeParameters() {
  return db.stableItem.findMany({ select: { id: true } })
}
