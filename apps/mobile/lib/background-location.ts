import type { LocationPoint } from '@family7/shared'
import * as Location from 'expo-location'
import * as TaskManager from 'expo-task-manager'
import { getAccessToken, hasRefreshToken, postLocations, restoreSession } from './api'
import { readBatteryPercent, toLocationPoint } from './location'
import { colors } from './theme'

const TASK_NAME = 'family7-location-sync'
const TIME_INTERVAL_MS = 45000
const DISTANCE_INTERVAL_M = 60
const BATCH_INTERVAL_MS = 60000
const MAX_PENDING = 100

let pending: LocationPoint[] = []

TaskManager.defineTask<{ locations: Location.LocationObject[] }>(
  TASK_NAME,
  async ({ data, error }) => {
    if (error || !data?.locations?.length) return
    const battery = await readBatteryPercent()
    for (const position of data.locations) {
      pending.push(toLocationPoint(position, battery))
    }
    if (pending.length > MAX_PENDING) pending = pending.slice(-MAX_PENDING)
    if (!getAccessToken()) await restoreSession()
    if (!getAccessToken()) {
      if (!hasRefreshToken()) await stopBackgroundUpdates()
      return
    }
    const batch = pending.splice(0, pending.length)
    try {
      await postLocations(batch)
    } catch {
      pending = [...batch, ...pending].slice(-MAX_PENDING)
    }
  },
)

export async function startBackgroundUpdates() {
  const running = await Location.hasStartedLocationUpdatesAsync(TASK_NAME).catch(() => false)
  if (running) return
  await Location.startLocationUpdatesAsync(TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: TIME_INTERVAL_MS,
    distanceInterval: DISTANCE_INTERVAL_M,
    deferredUpdatesInterval: BATCH_INTERVAL_MS,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Family7',
      notificationBody: 'Sharing your location with your circle',
      notificationColor: colors.accent,
    },
  })
}

export async function stopBackgroundUpdates() {
  const running = await Location.hasStartedLocationUpdatesAsync(TASK_NAME).catch(() => false)
  if (!running) return
  await Location.stopLocationUpdatesAsync(TASK_NAME).catch(() => null)
}

export async function getBackgroundPermission() {
  return Location.getBackgroundPermissionsAsync().catch(() => null)
}

export async function requestBackgroundPermission() {
  return Location.requestBackgroundPermissionsAsync().catch(() => null)
}

export async function isBackgroundSharingOn() {
  const permission = await getBackgroundPermission()
  if (permission?.status !== 'granted') return false
  return Location.hasStartedLocationUpdatesAsync(TASK_NAME).catch(() => false)
}

export async function syncBackgroundUpdates(paused: boolean) {
  if (paused) {
    await stopBackgroundUpdates()
    return false
  }
  const permission = await getBackgroundPermission()
  if (permission?.status !== 'granted') {
    await stopBackgroundUpdates()
    return false
  }
  await startBackgroundUpdates().catch(() => null)
  return true
}
