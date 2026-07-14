import { createHash, randomBytes } from 'node:crypto'
import { SignJWT, jwtVerify } from 'jose'
import { config } from '../config'

const secret = new TextEncoder().encode(config.JWT_SECRET)

export const REFRESH_TTL_MS = 1000 * 60 * 60 * 24 * 60

export async function signAccessToken(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secret)
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, secret)
  if (!payload.sub) throw new Error('token has no subject')
  return payload.sub
}

export function generateRefreshToken() {
  return randomBytes(32).toString('base64url')
}

export function hashRefreshToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}
