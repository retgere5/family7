import { upsertPlaceSchema } from '@family7/shared'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../../db'
import { broadcast } from '../live/registry'
import { getCircleIdFor } from '../locations/service'

const MAX_PLACES = 20

const placeParamsSchema = z.object({ id: z.string() })

type PlaceRow = {
  id: string
  name: string
  icon: string
  lat: number
  lng: number
  radiusM: number
  notify: boolean
}

function toPlacePayload(place: PlaceRow) {
  return {
    id: place.id,
    name: place.name,
    icon: place.icon,
    lat: place.lat,
    lng: place.lng,
    radiusM: place.radiusM,
    notify: place.notify,
  }
}

export default async function placeRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.get('/places', async (request, reply) => {
    const circleId = await getCircleIdFor(request.userId)
    if (!circleId) return reply.code(409).send({ error: 'not in a circle' })
    const places = await db.place.findMany({
      where: { circleId },
      orderBy: { createdAt: 'asc' },
    })
    return { places: places.map(toPlacePayload) }
  })

  app.post('/places', async (request, reply) => {
    const body = upsertPlaceSchema.parse(request.body)
    const circleId = await getCircleIdFor(request.userId)
    if (!circleId) return reply.code(409).send({ error: 'not in a circle' })
    const count = await db.place.count({ where: { circleId } })
    if (count >= MAX_PLACES) return reply.code(409).send({ error: 'place limit reached' })
    const place = await db.place.create({
      data: {
        circleId,
        name: body.name,
        icon: body.icon,
        lat: body.lat,
        lng: body.lng,
        radiusM: body.radiusM,
        notify: body.notify ?? true,
      },
    })
    broadcast(circleId, { type: 'places:updated' })
    return { place: toPlacePayload(place) }
  })

  app.patch('/places/:id', async (request, reply) => {
    const params = placeParamsSchema.parse(request.params)
    const body = upsertPlaceSchema.partial().parse(request.body)
    const circleId = await getCircleIdFor(request.userId)
    if (!circleId) return reply.code(409).send({ error: 'not in a circle' })
    const existing = await db.place.findUnique({ where: { id: params.id } })
    if (!existing || existing.circleId !== circleId) {
      return reply.code(404).send({ error: 'place not found' })
    }
    const place = await db.place.update({ where: { id: params.id }, data: body })
    broadcast(circleId, { type: 'places:updated' })
    return { place: toPlacePayload(place) }
  })

  app.delete('/places/:id', async (request, reply) => {
    const params = placeParamsSchema.parse(request.params)
    const circleId = await getCircleIdFor(request.userId)
    if (!circleId) return reply.code(409).send({ error: 'not in a circle' })
    const existing = await db.place.findUnique({ where: { id: params.id } })
    if (!existing || existing.circleId !== circleId) {
      return reply.code(404).send({ error: 'place not found' })
    }
    await db.place.delete({ where: { id: params.id } })
    broadcast(circleId, { type: 'places:updated' })
    return { ok: true }
  })
}
