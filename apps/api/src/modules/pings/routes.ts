import { sendPingSchema } from '@family7/shared'
import type { FastifyInstance } from 'fastify'
import { broadcast } from '../live/registry'
import { getCircleIdFor } from '../locations/service'

export default async function pingRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.post('/pings', async (request, reply) => {
    const body = sendPingSchema.parse(request.body)
    const circleId = await getCircleIdFor(request.userId)
    if (!circleId) return reply.code(409).send({ error: 'not in a circle' })
    broadcast(
      circleId,
      {
        type: 'member:ping',
        userId: request.userId,
        kind: body.kind,
        sentAt: new Date().toISOString(),
      },
      request.userId,
    )
    return { ok: true }
  })
}
