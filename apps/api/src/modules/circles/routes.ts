import { createCircleSchema, joinCircleSchema } from '@family7/shared'
import type { FastifyInstance } from 'fastify'
import { CircleError, createCircle, getMyCircle, joinCircle } from './service'

export default async function circleRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.post('/circles', async (request, reply) => {
    const body = createCircleSchema.parse(request.body)
    try {
      return await createCircle(request.userId, body.name)
    } catch (error) {
      if (error instanceof CircleError) {
        return reply.code(error.status).send({ error: error.message })
      }
      throw error
    }
  })

  app.post('/circles/join', async (request, reply) => {
    const body = joinCircleSchema.parse(request.body)
    try {
      return await joinCircle(request.userId, body.code)
    } catch (error) {
      if (error instanceof CircleError) {
        return reply.code(error.status).send({ error: error.message })
      }
      throw error
    }
  })

  app.get('/circles/mine', async (request) => ({ circle: await getMyCircle(request.userId) }))
}
