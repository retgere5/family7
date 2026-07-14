import { z } from 'zod'

export const googleLoginSchema = z.object({
  idToken: z.string().min(10),
})

export const devLoginSchema = z.object({
  email: z.email(),
  name: z.string().trim().min(1).max(80),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(20),
})

export const userSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string(),
  avatarUrl: z.url().nullable(),
  statusEmoji: z.string().nullable(),
})

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

export const authResponseSchema = z.object({
  user: userSchema,
  tokens: authTokensSchema,
})

export type User = z.infer<typeof userSchema>
export type AuthTokens = z.infer<typeof authTokensSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>
