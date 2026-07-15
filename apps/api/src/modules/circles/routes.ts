import { createCircleSchema, joinCircleSchema } from '@family7/shared'
import type { FastifyInstance } from 'fastify'
import { db } from '../../db'
import { broadcast } from '../live/registry'
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
      const circle = await joinCircle(request.userId, body.code)
      if (circle) {
        const user = await db.user.findUniqueOrThrow({ where: { id: request.userId } })
        broadcast(
          circle.id,
          { type: 'circle:member_joined', userId: user.id, name: user.name },
          user.id,
        )
      }
      return circle
    } catch (error) {
      if (error instanceof CircleError) {
        return reply.code(error.status).send({ error: error.message })
      }
      throw error
    }
  })

  app.get('/circles/mine', async (request) => ({ circle: await getMyCircle(request.userId) }))
}
