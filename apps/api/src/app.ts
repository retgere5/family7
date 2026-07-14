import fastify from 'fastify'
import { ZodError } from 'zod'

export function buildApp() {
  const app = fastify({ logger: true })

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: 'validation failed', issues: error.issues })
    }
    request.log.error(error)
    return reply.code(500).send({ error: 'internal server error' })
  })

  app.get('/health', async () => ({ ok: true }))

  return app
}
