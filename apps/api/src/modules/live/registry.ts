import { WebSocket } from 'ws'

export type Connection = {
  socket: WebSocket
  userId: string
  circleId: string
}

const circles = new Map<string, Set<Connection>>()

export function register(connection: Connection) {
  let connections = circles.get(connection.circleId)
  if (!connections) {
    connections = new Set()
    circles.set(connection.circleId, connections)
  }
  connections.add(connection)
}

export function unregister(connection: Connection) {
  const connections = circles.get(connection.circleId)
  if (!connections) return
  connections.delete(connection)
  if (connections.size === 0) circles.delete(connection.circleId)
}

export function broadcast(circleId: string, message: object, excludeUserId?: string) {
  const connections = circles.get(circleId)
  if (!connections) return
  const payload = JSON.stringify(message)
  for (const connection of connections) {
    if (connection.userId === excludeUserId) continue
    if (connection.socket.readyState === WebSocket.OPEN) {
      connection.socket.send(payload)
    }
  }
}
