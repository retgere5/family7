import { locationBatchSchema } from '@family7/shared'
import type { FastifyInstance } from 'fastify'
import { ingestLocations } from './service'

export default async function locationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.post('/locations', async (request) => {
    const body = locationBatchSchema.parse(request.body)
    const result = await ingestLocations(request.userId, body.locations)
    return { stored: result.stored }
  })
}
