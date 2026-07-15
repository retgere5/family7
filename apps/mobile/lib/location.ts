import * as Battery from 'expo-battery'
import * as Location from 'expo-location'
import { useEffect } from 'react'
import { sendLocation } from './live'

const TIME_INTERVAL_MS = 8000
const DISTANCE_INTERVAL_M = 20

export function useLocationTracking(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    let subscription: Location.LocationSubscription | null = null
    let cancelled = false
    void (async () => {
      const permission = await Location.requestForegroundPermissionsAsync()
      if (permission.status !== 'granted' || cancelled) return
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: TIME_INTERVAL_MS,
          distanceInterval: DISTANCE_INTERVAL_M,
        },
        (position) => void handlePosition(position),
      )
    })()
    return () => {
      cancelled = true
      subscription?.remove()
    }
  }, [enabled])
}

async function handlePosition(position: Location.LocationObject) {
  const level = await Battery.getBatteryLevelAsync().catch(() => null)
  const { coords } = position
  sendLocation({
    lat: coords.latitude,
    lng: coords.longitude,
    speed: coords.speed != null && coords.speed >= 0 ? coords.speed : null,
    heading: coords.heading != null && coords.heading >= 0 ? Math.min(coords.heading, 360) : null,
    accuracy: coords.accuracy != null && coords.accuracy >= 0 ? coords.accuracy : null,
    battery: level != null && level >= 0 ? Math.round(level * 100) : null,
    recordedAt: new Date(position.timestamp).toISOString(),
  })
}
