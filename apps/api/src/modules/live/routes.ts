import { wsClientMessageSchema } from '@family7/shared'
import type { FastifyInstance } from 'fastify'
import type { WebSocket } from 'ws'
import { verifyAccessToken } from '../../lib/tokens'
import { getCircleIdFor, ingestLocations } from '../locations/service'
import { broadcast, register, unregister, type Connection } from './registry'

const AUTH_TIMEOUT_MS = 5000

function parseJson(raw: Buffer) {
  try {
    return JSON.parse(raw.toString()) as unknown
  } catch {
    return null
  }
}

function send(socket: WebSocket, message: object) {
  socket.send(JSON.stringify(message))
}

export default async function liveRoutes(app: FastifyInstance) {
  app.get('/ws', { websocket: true }, (socket, request) => {
    let connection: Connection | null = null
    const authTimer = setTimeout(() => {
      if (!connection) socket.close(4001, 'authentication timeout')
    }, AUTH_TIMEOUT_MS)

    async function handleMessage(raw: Buffer) {
      const parsed = wsClientMessageSchema.safeParse(parseJson(raw))
      if (!parsed.success) {
        return send(socket, { type: 'error', message: 'invalid message' })
      }
      const message = parsed.data
      if (message.type === 'auth') {
        if (connection) return
        const userId = await verifyAccessToken(message.token).catch(() => null)
        if (!userId) return socket.close(4002, 'invalid token')
        const circleId = await getCircleIdFor(userId)
        if (!circleId) return socket.close(4003, 'not in a circle')
        connection = { socket, userId, circleId }
        clearTimeout(authTimer)
        register(connection)
        return send(socket, { type: 'ready', circleId })
      }
      if (!connection) return socket.close(4004, 'not authenticated')
      const result = await ingestLocations(connection.userId, [
        {
          lat: message.lat,
          lng: message.lng,
          speed: message.speed,
          heading: message.heading,
          accuracy: message.accuracy,
          battery: message.battery,
          recordedAt: message.recordedAt,
        },
      ])
      if (result.latest) {
        broadcast(
          connection.circleId,
          { type: 'member:location', userId: connection.userId, ...result.latest },
          connection.userId,
        )
      }
    }

    socket.on('message', (raw: Buffer) => {
      void handleMessage(raw).catch((error) => {
        request.log.error(error)
        send(socket, { type: 'error', message: 'internal error' })
      })
    })

    socket.on('close', () => {
      clearTimeout(authTimer)
      if (connection) unregister(connection)
    })
  })
}
