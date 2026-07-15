import type { LocationPoint, PlaceRef } from '@family7/shared'
import { db } from '../../db'
import { findContainingPlace } from '../../lib/geo'
import { broadcast } from '../live/registry'

type LocationRow = {
  lat: number
  lng: number
  speed: number | null
  heading: number | null
  accuracy: number | null
  battery: number | null
  recordedAt: Date
}

export type IngestResult = {
  stored: number
  latest: LocationPoint | null
  circleId: string | null
  place: PlaceRef | null
  previousPlace: PlaceRef | null
  changedPlace: boolean
}

const EMPTY_RESULT: IngestResult = {
  stored: 0,
  latest: null,
  circleId: null,
  place: null,
  previousPlace: null,
  changedPlace: false,
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

export function toPlaceRef(
  place: { id: string; name: string; icon: string } | null,
): PlaceRef | null {
  return place ? { id: place.id, name: place.name, icon: place.icon } : null
}

export async function ingestLocations(
  userId: string,
  points: LocationPoint[],
): Promise<IngestResult> {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { sharingPaused: true },
  })
  if (user.sharingPaused) return EMPTY_RESULT
  const sorted = [...points].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  )
  const latest = sorted[sorted.length - 1]
  if (!latest) return EMPTY_RESULT

  const circleId = await getCircleIdFor(userId)
  let place: PlaceRef | null = null
  let previousPlace: PlaceRef | null = null
  if (circleId) {
    const places = await db.place.findMany({ where: { circleId } })
    place = toPlaceRef(findContainingPlace(places, latest.lat, latest.lng))
    const existing = await db.locationLatest.findUnique({
      where: { userId },
      select: { place: { select: { id: true, name: true, icon: true } } },
    })
    previousPlace = toPlaceRef(existing?.place ?? null)
  }

  await db.locationHistory.createMany({
    data: sorted.map((point) => ({ userId, ...toColumns(point) })),
  })
  await db.locationLatest.upsert({
    where: { userId },
    create: { userId, placeId: place?.id ?? null, ...toColumns(latest) },
    update: { placeId: place?.id ?? null, ...toColumns(latest) },
  })

  return {
    stored: sorted.length,
    latest: toLocationPayload(toColumns(latest)),
    circleId,
    place,
    previousPlace,
    changedPlace: (place?.id ?? null) !== (previousPlace?.id ?? null),
  }
}

export function publishLocation(userId: string, result: IngestResult) {
  if (!result.circleId || !result.latest) return
  broadcast(
    result.circleId,
    { type: 'member:location', userId, place: result.place, ...result.latest },
    userId,
  )
  if (!result.changedPlace) return
  if (result.previousPlace) {
    broadcast(
      result.circleId,
      { type: 'place:transition', userId, transition: 'leave', place: result.previousPlace },
      userId,
    )
  }
  if (result.place) {
    broadcast(
      result.circleId,
      { type: 'place:transition', userId, transition: 'enter', place: result.place },
      userId,
    )
  }
}

export async function getCircleIdFor(userId: string) {
  const membership = await db.circleMember.findFirst({
    where: { userId },
    select: { circleId: true },
  })
  return membership?.circleId ?? null
}
