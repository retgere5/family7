import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../../db'
import { getCircleIdFor } from '../locations/service'

const timelineParamsSchema = z.object({ id: z.string() })
const timelineQuerySchema = z.object({ since: z.iso.datetime().optional() })

const DAY_MS = 24 * 60 * 60 * 1000

export default async function timelineRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.get('/members/:id/events', async (request, reply) => {
    const params = timelineParamsSchema.parse(request.params)
    const query = timelineQuerySchema.parse(request.query)
    const circleId = await getCircleIdFor(request.userId)
    if (!circleId) return reply.code(409).send({ error: 'not in a circle' })
    const membership = await db.circleMember.findFirst({
      where: { circleId, userId: params.id },
    })
    if (!membership) return reply.code(404).send({ error: 'member not found' })
    const since = query.since ? new Date(query.since) : new Date(Date.now() - DAY_MS)
    const events = await db.placeEvent.findMany({
      where: { circleId, userId: params.id, at: { gte: since } },
      orderBy: { at: 'desc' },
      take: 50,
    })
    return {
      events: events.map((event) => ({
        id: event.id,
        transition: event.transition,
        placeName: event.placeName,
        placeIcon: event.placeIcon,
        at: event.at.toISOString(),
      })),
    }
  })
}
