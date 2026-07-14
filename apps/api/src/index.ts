import { existsSync } from 'node:fs'

if (existsSync('.env')) process.loadEnvFile()

const { config } = await import('./config')
const { buildApp } = await import('./app')

const app = buildApp()

try {
  await app.listen({ port: config.PORT, host: '0.0.0.0' })
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
