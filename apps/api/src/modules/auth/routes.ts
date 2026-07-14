import { devLoginSchema, googleLoginSchema, refreshSchema } from '@family7/shared'
import type { FastifyInstance } from 'fastify'
import { config } from '../../config'
import { db } from '../../db'
import {
  AuthError,
  loginAsDev,
  loginWithGoogle,
  revokeSession,
  rotateSession,
  toPublicUser,
} from './service'

export default async function authRoutes(app: FastifyInstance) {
  app.post('/auth/google', async (request, reply) => {
    const body = googleLoginSchema.parse(request.body)
    try {
      return await loginWithGoogle(body.idToken)
    } catch (error) {
      if (error instanceof AuthError) return reply.code(401).send({ error: error.message })
      throw error
    }
  })

  if (config.AUTH_DEV) {
    app.post('/auth/dev', async (request) => {
      const body = devLoginSchema.parse(request.body)
      return loginAsDev(body.email, body.name)
    })
  }

  app.post('/auth/refresh', async (request, reply) => {
    const body = refreshSchema.parse(request.body)
    try {
      return await rotateSession(body.refreshToken)
    } catch (error) {
      if (error instanceof AuthError) return reply.code(401).send({ error: error.message })
      throw error
    }
  })

  app.post('/auth/logout', async (request) => {
    const body = refreshSchema.parse(request.body)
    await revokeSession(body.refreshToken)
    return { ok: true }
  })

  app.get('/me', { preHandler: app.authenticate }, async (request) => {
    const user = await db.user.findUniqueOrThrow({ where: { id: request.userId } })
    return { user: toPublicUser(user) }
  })
}
