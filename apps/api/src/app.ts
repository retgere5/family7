import websocket from '@fastify/websocket'
import fastify from 'fastify'
import { ZodError } from 'zod'
import authRoutes from './modules/auth/routes'
import circleRoutes from './modules/circles/routes'
import liveRoutes from './modules/live/routes'
import locationRoutes from './modules/locations/routes'
import pingRoutes from './modules/pings/routes'
import presenceRoutes from './modules/presence/routes'
import authPlugin from './plugins/auth'

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

  app.register(websocket)
  app.register(authPlugin)
  app.register(authRoutes)
  app.register(circleRoutes)
  app.register(locationRoutes)
  app.register(presenceRoutes)
  app.register(pingRoutes)
  app.register(liveRoutes)

  return app
}
