import { describe, expect, it } from 'vitest'
import { generateInviteCode } from './inviteCode'

describe('generateInviteCode', () => {
  it('produces codes from the unambiguous alphabet', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateInviteCode()).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/)
    }
  })

  it('respects a custom length', () => {
    expect(generateInviteCode(8)).toHaveLength(8)
  })

  it('does not repeat immediately', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateInviteCode()))
    expect(codes.size).toBeGreaterThan(1)
  })
})
