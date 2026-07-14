import type { FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { verifyAccessToken } from '../lib/tokens'

declare module 'fastify' {
  interface FastifyRequest {
    userId: string
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

export default fp(async (app) => {
  app.decorateRequest('userId', '')
  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    const header = request.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'unauthorized' })
    }
    try {
      request.userId = await verifyAccessToken(header.slice(7))
    } catch {
      return reply.code(401).send({ error: 'unauthorized' })
    }
  })
})
