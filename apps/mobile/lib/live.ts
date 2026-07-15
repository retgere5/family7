import type { LocationPoint, WsServerMessage } from '@family7/shared'
import { AppState } from 'react-native'
import { apiWsUrl, getAccessToken, postLocations, restoreSession } from './api'

type LiveListener = (message: WsServerMessage) => void

const MAX_QUEUE = 50
const FLUSH_THRESHOLD = 5
const INITIAL_RETRY_MS = 1000
const MAX_RETRY_MS = 15000

const listeners = new Set<LiveListener>()
let socket: WebSocket | null = null
let ready = false
let started = false
let foreground = true
let appStateBound = false
let retryDelay = INITIAL_RETRY_MS
let retryTimer: ReturnType<typeof setTimeout> | null = null
let queue: LocationPoint[] = []

export function subscribeLive(listener: LiveListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function startLive() {
  started = true
  bindAppState()
  connect()
}

export function stopLive() {
  started = false
  teardown()
  void flushQueue()
}

export function sendLocation(point: LocationPoint) {
  if (ready && socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'location', ...point }))
    return
  }
  queue.push(point)
  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE)
  if (queue.length >= FLUSH_THRESHOLD) void flushQueue()
}

function bindAppState() {
  if (appStateBound) return
  appStateBound = true
  foreground = AppState.currentState === 'active'
  AppState.addEventListener('change', (state) => {
    foreground = state === 'active'
    if (!started) return
    if (foreground) {
      connect()
    } else {
      teardown()
      void flushQueue()
    }
  })
}

function connect() {
  if (!started || !foreground || socket) return
  const token = getAccessToken()
  if (!token) return
  const ws = new WebSocket(apiWsUrl())
  socket = ws
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'auth', token }))
  }
  ws.onmessage = (event) => {
    const message = parseMessage(event.data)
    if (!message) return
    if (message.type === 'ready') {
      ready = true
      retryDelay = INITIAL_RETRY_MS
      void flushQueue()
      return
    }
    for (const listener of listeners) listener(message)
  }
  ws.onclose = (event) => {
    ready = false
    socket = null
    if (!started || !foreground) return
    if (event.code === 4003) return
    void scheduleReconnect(event.code === 4002)
  }
  ws.onerror = () => {
    ws.close()
  }
}

async function scheduleReconnect(refreshFirst: boolean) {
  if (refreshFirst) await restoreSession().catch(() => null)
  if (retryTimer) clearTimeout(retryTimer)
  retryTimer = setTimeout(() => {
    retryTimer = null
    connect()
  }, retryDelay)
  retryDelay = Math.min(retryDelay * 2, MAX_RETRY_MS)
}

function teardown() {
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
  ready = false
  const current = socket
  socket = null
  current?.close()
}

async function flushQueue() {
  if (!queue.length) return
  const batch = queue.splice(0, queue.length)
  try {
    await postLocations(batch)
  } catch {
    queue = [...batch, ...queue].slice(-MAX_QUEUE)
  }
}

function parseMessage(data: unknown): WsServerMessage | null {
  if (typeof data !== 'string') return null
  try {
    return JSON.parse(data) as WsServerMessage
  } catch {
    return null
  }
}
