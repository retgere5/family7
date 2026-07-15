const EARTH_RADIUS_M = 6371000

export function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const h = sinLat * sinLat + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * sinLng * sinLng
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

type PlaceLike = { lat: number; lng: number; radiusM: number }

export function findContainingPlace<T extends PlaceLike>(places: T[], lat: number, lng: number) {
  return (
    places.find((place) => haversineMeters(place.lat, place.lng, lat, lng) <= place.radiusM) ?? null
  )
}
