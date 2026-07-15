import { describe, expect, it } from 'vitest'
import { findContainingPlace, haversineMeters } from './geo'

describe('haversineMeters', () => {
  it('returns zero for identical points', () => {
    expect(haversineMeters(41.0, 29.0, 41.0, 29.0)).toBe(0)
  })

  it('measures one degree of latitude as roughly 111 km', () => {
    const distance = haversineMeters(41.0, 29.0, 42.0, 29.0)
    expect(distance).toBeGreaterThan(110000)
    expect(distance).toBeLessThan(112500)
  })
})

describe('findContainingPlace', () => {
  const home = { id: 'home', lat: 41.0, lng: 29.0, radiusM: 150 }
  const work = { id: 'work', lat: 41.01, lng: 29.01, radiusM: 200 }

  it('finds the place containing a point', () => {
    expect(findContainingPlace([home, work], 41.0004, 29.0)?.id).toBe('home')
  })

  it('returns null when outside every place', () => {
    expect(findContainingPlace([home, work], 41.5, 29.5)).toBeNull()
  })
})
