import { locationBatchSchema } from '@family7/shared'
import type { FastifyInstance } from 'fastify'
import { broadcast } from '../live/registry'
import { getCircleIdFor, ingestLocations } from './service'

export default async function locationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.post('/locations', async (request) => {
    const body = locationBatchSchema.parse(request.body)
    const result = await ingestLocations(request.userId, body.locations)
    if (result.latest) {
      const circleId = await getCircleIdFor(request.userId)
      if (circleId) {
        broadcast(
          circleId,
          { type: 'member:location', userId: request.userId, ...result.latest },
          request.userId,
        )
      }
    }
    return { stored: result.stored }
  })
}
