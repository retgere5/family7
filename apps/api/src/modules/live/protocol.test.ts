import { locationPointSchema, wsClientMessageSchema } from '@family7/shared'
import { describe, expect, it } from 'vitest'

describe('ws client messages', () => {
  it('accepts an auth message', () => {
    const parsed = wsClientMessageSchema.safeParse({ type: 'auth', token: 'a'.repeat(20) })
    expect(parsed.success).toBe(true)
  })

  it('accepts a location message', () => {
    const parsed = wsClientMessageSchema.safeParse({
      type: 'location',
      lat: 41.0082,
      lng: 28.9784,
      speed: 3.2,
      battery: 80,
      recordedAt: new Date(0).toISOString(),
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects unknown message types', () => {
    const parsed = wsClientMessageSchema.safeParse({ type: 'nope' })
    expect(parsed.success).toBe(false)
  })
})

describe('location points', () => {
  it('rejects out-of-range coordinates', () => {
    expect(
      locationPointSchema.safeParse({ lat: 91, lng: 0, recordedAt: new Date(0).toISOString() })
        .success,
    ).toBe(false)
    expect(
      locationPointSchema.safeParse({ lat: 0, lng: -181, recordedAt: new Date(0).toISOString() })
        .success,
    ).toBe(false)
  })

  it('rejects invalid battery levels', () => {
    expect(
      locationPointSchema.safeParse({
        lat: 0,
        lng: 0,
        battery: 150,
        recordedAt: new Date(0).toISOString(),
      }).success,
    ).toBe(false)
  })
})
