import { db } from '../db'

const RETENTION_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

export function startHistoryCleanup() {
  const run = async () => {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * DAY_MS)
    await db.locationHistory.deleteMany({ where: { recordedAt: { lt: cutoff } } }).catch(() => null)
  }
  void run()
  const timer = setInterval(() => void run(), DAY_MS)
  timer.unref()
  return timer
}
