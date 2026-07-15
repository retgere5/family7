import type { LocationPoint } from '@family7/shared'
import { db } from '../../db'

type LocationRow = {
  lat: number
  lng: number
  speed: number | null
  heading: number | null
  accuracy: number | null
  battery: number | null
  recordedAt: Date
}

function toColumns(point: LocationPoint) {
  return {
    lat: point.lat,
    lng: point.lng,
    speed: point.speed ?? null,
    heading: point.heading ?? null,
    accuracy: point.accuracy ?? null,
    battery: point.battery ?? null,
    recordedAt: new Date(point.recordedAt),
  }
}

export function toLocationPayload(row: LocationRow): LocationPoint {
  return {
    lat: row.lat,
    lng: row.lng,
    speed: row.speed,
    heading: row.heading,
    accuracy: row.accuracy,
    battery: row.battery,
    recordedAt: row.recordedAt.toISOString(),
  }
}

export async function ingestLocations(userId: string, points: LocationPoint[]) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { sharingPaused: true },
  })
  if (user.sharingPaused) return { stored: 0, latest: null }
  const sorted = [...points].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  )
  const latest = sorted[sorted.length - 1]
  if (!latest) return { stored: 0, latest: null }
  await db.locationHistory.createMany({
    data: sorted.map((point) => ({ userId, ...toColumns(point) })),
  })
  await db.locationLatest.upsert({
    where: { userId },
    create: { userId, ...toColumns(latest) },
    update: toColumns(latest),
  })
  return { stored: sorted.length, latest: toLocationPayload(toColumns(latest)) }
}

export async function getCircleIdFor(userId: string) {
  const membership = await db.circleMember.findFirst({
    where: { userId },
    select: { circleId: true },
  })
  return membership?.circleId ?? null
}
