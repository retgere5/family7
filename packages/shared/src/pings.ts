import { z } from 'zod'

export const pingKindSchema = z.enum(['on_my_way', 'call_me', 'arrived'])

export const sendPingSchema = z.object({
  kind: pingKindSchema,
})

export type PingKind = z.infer<typeof pingKindSchema>
