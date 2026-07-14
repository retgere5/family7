import { z } from 'zod'
import { userSchema } from './auth'

export const createCircleSchema = z.object({
  name: z.string().trim().min(1).max(50),
})

export const joinCircleSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6}$/),
})

export const circleRoleSchema = z.enum(['OWNER', 'MEMBER'])

export const circleMemberSchema = userSchema.extend({
  role: circleRoleSchema,
  joinedAt: z.iso.datetime(),
})

export const circleSchema = z.object({
  id: z.string(),
  name: z.string(),
  inviteCode: z.string(),
  members: z.array(circleMemberSchema),
})

export type CircleRole = z.infer<typeof circleRoleSchema>
export type CircleMember = z.infer<typeof circleMemberSchema>
export type Circle = z.infer<typeof circleSchema>
