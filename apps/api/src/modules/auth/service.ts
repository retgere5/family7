import { OAuth2Client } from 'google-auth-library'
import { config } from '../../config'
import { db } from '../../db'
import {
  REFRESH_TTL_MS,
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
} from '../../lib/tokens'

const googleClient = new OAuth2Client()

export class AuthError extends Error {}

type PublicUserSource = {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  statusEmoji: string | null
}

export function toPublicUser(user: PublicUserSource) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    statusEmoji: user.statusEmoji,
  }
}

export async function loginWithGoogle(idToken: string) {
  const ticket = await googleClient
    .verifyIdToken({ idToken, audience: config.googleClientIds })
    .catch(() => null)
  const payload = ticket?.getPayload()
  if (!payload?.sub || !payload.email) throw new AuthError('invalid google token')
  const user = await db.user.upsert({
    where: { provider_providerId: { provider: 'google', providerId: payload.sub } },
    create: {
      email: payload.email,
      name: payload.name ?? payload.email.split('@')[0] ?? 'user',
      avatarUrl: payload.picture ?? null,
      provider: 'google',
      providerId: payload.sub,
    },
    update: { avatarUrl: payload.picture ?? null },
  })
  return issueSession(user.id)
}

export async function loginAsDev(email: string, name: string) {
  const user = await db.user.upsert({
    where: { email },
    create: { email, name, provider: 'dev', providerId: email },
    update: { name },
  })
  return issueSession(user.id)
}

export async function rotateSession(refreshToken: string) {
  const tokenHash = hashRefreshToken(refreshToken)
  const stored = await db.refreshToken.findUnique({ where: { tokenHash } })
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AuthError('invalid refresh token')
  }
  await db.refreshToken.update({ where: { tokenHash }, data: { revokedAt: new Date() } })
  return issueSession(stored.userId)
}

export async function revokeSession(refreshToken: string) {
  await db.refreshToken.updateMany({
    where: { tokenHash: hashRefreshToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

async function issueSession(userId: string) {
  const refreshToken = generateRefreshToken()
  await db.refreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  })
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } })
  return {
    user: toPublicUser(user),
    tokens: { accessToken: await signAccessToken(userId), refreshToken },
  }
}
