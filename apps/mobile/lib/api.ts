import type { AuthResponse, Circle, LocationPoint, User } from '@family7/shared'
import * as SecureStore from 'expo-secure-store'

const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'
const REFRESH_KEY = 'family7.refreshToken'

let accessToken: string | null = null
let refreshToken: string | null = null
let refreshing: Promise<AuthResponse | null> | null = null

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

async function saveTokens(tokens: AuthResponse['tokens']) {
  accessToken = tokens.accessToken
  refreshToken = tokens.refreshToken
  await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken)
}

async function dropTokens() {
  accessToken = null
  refreshToken = null
  await SecureStore.deleteItemAsync(REFRESH_KEY)
}

async function refreshSession() {
  refreshing ??= (async () => {
    if (!refreshToken) return null
    const response = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => null)
    if (!response?.ok) {
      await dropTokens()
      return null
    }
    const session = (await response.json()) as AuthResponse
    await saveTokens(session.tokens)
    return session
  })()
  const result = await refreshing
  refreshing = null
  return result
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (accessToken) headers.authorization = `Bearer ${accessToken}`
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers })
  if (response.status === 401 && retry) {
    const session = await refreshSession()
    if (session) return request(path, init, false)
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new ApiError(response.status, body?.error ?? 'request failed')
  }
  return (await response.json()) as T
}

export async function restoreSession() {
  refreshToken = await SecureStore.getItemAsync(REFRESH_KEY)
  if (!refreshToken) return null
  return refreshSession()
}

export async function signInWithDevLogin(email: string, name: string) {
  const session = await request<AuthResponse>('/auth/dev', {
    method: 'POST',
    body: JSON.stringify({ email, name }),
  })
  await saveTokens(session.tokens)
  return session
}

export async function signOut() {
  const current = refreshToken
  await dropTokens()
  if (current) {
    await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: current }),
    }).catch(() => null)
  }
}

export function getAccessToken() {
  return accessToken
}

export function apiWsUrl() {
  return `${baseUrl.replace(/^http/, 'ws')}/ws`
}

export function getMyCircle() {
  return request<{ circle: Circle | null }>('/circles/mine')
}

export function postLocations(points: LocationPoint[]) {
  return request<{ stored: number }>('/locations', {
    method: 'POST',
    body: JSON.stringify({ locations: points }),
  })
}

export function updateStatus(statusEmoji: string | null) {
  return request<{ user: User }>('/me/status', {
    method: 'PATCH',
    body: JSON.stringify({ statusEmoji }),
  })
}

export function updateSharing(paused: boolean) {
  return request<{ user: User; sharingPaused: boolean }>('/me/sharing', {
    method: 'PATCH',
    body: JSON.stringify({ paused }),
  })
}

export function createCircle(name: string) {
  return request<Circle>('/circles', { method: 'POST', body: JSON.stringify({ name }) })
}

export function joinCircle(code: string) {
  return request<Circle>('/circles/join', { method: 'POST', body: JSON.stringify({ code }) })
}
