import { z } from 'zod'

export const placeRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
})

export const upsertPlaceSchema = z.object({
  name: z.string().trim().min(1).max(40),
  icon: z.string().trim().min(1).max(8),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusM: z.number().int().min(50).max(1000),
  notify: z.boolean().optional(),
})

export const placeSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  lat: z.number(),
  lng: z.number(),
  radiusM: z.number(),
  notify: z.boolean(),
})

export type PlaceRef = z.infer<typeof placeRefSchema>
export type UpsertPlaceInput = z.infer<typeof upsertPlaceSchema>
export type Place = z.infer<typeof placeSchema>
