import { z } from 'zod'

export const locationPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speed: z.number().min(0).nullish(),
  heading: z.number().min(0).max(360).nullish(),
  accuracy: z.number().min(0).nullish(),
  battery: z.number().int().min(0).max(100).nullish(),
  recordedAt: z.iso.datetime(),
})

export const locationBatchSchema = z.object({
  locations: z.array(locationPointSchema).min(1).max(100),
})

export const memberLocationSchema = locationPointSchema.extend({
  userId: z.string(),
})

export const statusUpdateSchema = z.object({
  statusEmoji: z.string().trim().min(1).max(8).nullable(),
})

export const sharingUpdateSchema = z.object({
  paused: z.boolean(),
})

export const wsClientMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('auth'), token: z.string().min(10) }),
  locationPointSchema.extend({ type: z.literal('location') }),
])

export type LocationPoint = z.infer<typeof locationPointSchema>
export type LocationBatch = z.infer<typeof locationBatchSchema>
export type MemberLocation = z.infer<typeof memberLocationSchema>
export type WsClientMessage = z.infer<typeof wsClientMessageSchema>

export type WsServerMessage =
  | { type: 'ready'; circleId: string }
  | ({ type: 'member:location' } & MemberLocation)
  | { type: 'member:status'; userId: string; statusEmoji: string | null }
  | { type: 'member:sharing'; userId: string; paused: boolean }
  | { type: 'error'; message: string }
