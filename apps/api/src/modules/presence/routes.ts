import { sharingUpdateSchema, statusUpdateSchema } from '@family7/shared'
import type { FastifyInstance } from 'fastify'
import { db } from '../../db'
import { toPublicUser } from '../auth/service'
import { broadcast } from '../live/registry'
import { getCircleIdFor } from '../locations/service'

export default async function presenceRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.patch('/me/status', async (request) => {
    const body = statusUpdateSchema.parse(request.body)
    const user = await db.user.update({
      where: { id: request.userId },
      data: { statusEmoji: body.statusEmoji },
    })
    const circleId = await getCircleIdFor(user.id)
    if (circleId) {
      broadcast(
        circleId,
        { type: 'member:status', userId: user.id, statusEmoji: user.statusEmoji },
        user.id,
      )
    }
    return { user: toPublicUser(user) }
  })

  app.patch('/me/sharing', async (request) => {
    const body = sharingUpdateSchema.parse(request.body)
    const user = await db.user.update({
      where: { id: request.userId },
      data: { sharingPaused: body.paused },
    })
    const circleId = await getCircleIdFor(user.id)
    if (circleId) {
      broadcast(
        circleId,
        { type: 'member:sharing', userId: user.id, paused: user.sharingPaused },
        user.id,
      )
    }
    return { user: toPublicUser(user), sharingPaused: user.sharingPaused }
  })
}
