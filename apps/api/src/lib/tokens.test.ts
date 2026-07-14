import { describe, expect, it } from 'vitest'

process.env.JWT_SECRET = 'test-secret-test-secret-test-secret!'
process.env.DATABASE_URL = 'postgresql://family7:family7@localhost:5432/family7'

const tokens = await import('./tokens')

describe('access tokens', () => {
  it('round-trips the user id', async () => {
    const token = await tokens.signAccessToken('user-1')
    await expect(tokens.verifyAccessToken(token)).resolves.toBe('user-1')
  })

  it('rejects tampered tokens', async () => {
    const token = await tokens.signAccessToken('user-1')
    await expect(tokens.verifyAccessToken(token.slice(0, -2))).rejects.toThrow()
  })

  it('rejects garbage', async () => {
    await expect(tokens.verifyAccessToken('not-a-token')).rejects.toThrow()
  })
})

describe('refresh tokens', () => {
  it('hashes deterministically', () => {
    const token = tokens.generateRefreshToken()
    expect(tokens.hashRefreshToken(token)).toBe(tokens.hashRefreshToken(token))
  })

  it('generates unique tokens', () => {
    expect(tokens.generateRefreshToken()).not.toBe(tokens.generateRefreshToken())
  })
})
