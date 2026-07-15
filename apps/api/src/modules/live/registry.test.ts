import { describe, expect, it } from 'vitest'
import type { WebSocket } from 'ws'
import { broadcast, register, unregister, type Connection } from './registry'

function connect(circleId: string, userId: string) {
  const sent: string[] = []
  const socket = { readyState: 1, send: (payload: string) => sent.push(payload) }
  const connection: Connection = { socket: socket as unknown as WebSocket, userId, circleId }
  register(connection)
  return { connection, sent }
}

describe('live registry', () => {
  it('delivers only to members of the same circle', () => {
    const a = connect('circle-1', 'user-a')
    const b = connect('circle-1', 'user-b')
    const other = connect('circle-2', 'user-c')
    broadcast('circle-1', { type: 'ping' })
    expect(a.sent).toHaveLength(1)
    expect(b.sent).toHaveLength(1)
    expect(other.sent).toHaveLength(0)
    unregister(a.connection)
    unregister(b.connection)
    unregister(other.connection)
  })

  it('excludes the sender when asked', () => {
    const a = connect('circle-3', 'user-a')
    const b = connect('circle-3', 'user-b')
    broadcast('circle-3', { type: 'ping' }, 'user-a')
    expect(a.sent).toHaveLength(0)
    expect(b.sent).toHaveLength(1)
    unregister(a.connection)
    unregister(b.connection)
  })

  it('stops delivering after unregister', () => {
    const a = connect('circle-4', 'user-a')
    unregister(a.connection)
    broadcast('circle-4', { type: 'ping' })
    expect(a.sent).toHaveLength(0)
  })
})
