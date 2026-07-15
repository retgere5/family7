import { sharingUpdateSchema, statusUpdateSchema } from '@family7/shared'
import type { FastifyInstance } from 'fastify'
import { db } from '../../db'
import { toPublicUser } from '../auth/service'

export default async function presenceRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.patch('/me/status', async (request) => {
    const body = statusUpdateSchema.parse(request.body)
    const user = await db.user.update({
      where: { id: request.userId },
      data: { statusEmoji: body.statusEmoji },
    })
    return { user: toPublicUser(user) }
  })

  app.patch('/me/sharing', async (request) => {
    const body = sharingUpdateSchema.parse(request.body)
    const user = await db.user.update({
      where: { id: request.userId },
      data: { sharingPaused: body.paused },
    })
    return { user: toPublicUser(user), sharingPaused: user.sharingPaused }
  })
}
