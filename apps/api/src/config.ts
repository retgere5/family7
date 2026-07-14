import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  GOOGLE_CLIENT_IDS: z.string().default(''),
  AUTH_DEV: z
    .string()
    .optional()
    .transform((value) => value === '1' || value === 'true'),
})

const env = envSchema.parse(process.env)

export const config = {
  ...env,
  googleClientIds: env.GOOGLE_CLIENT_IDS.split(',')
    .map((value) => value.trim())
    .filter(Boolean),
}
