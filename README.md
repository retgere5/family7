# family7

Real-time location sharing app for couples and families. Live map with speed and battery status, plus arrival and departure notifications for saved places.

## Structure

- `apps/mobile` — Expo (React Native) app for iOS and Android
- `apps/api` — Fastify + PostgreSQL backend
- `apps/web` — Next.js web panel
- `packages/shared` — shared types and validation schemas

## Development

Requires Node 22+, pnpm 11+ and Docker.

```sh
pnpm install
docker compose up -d
cp apps/api/.env.example apps/api/.env
pnpm --filter @family7/api db:generate
pnpm --filter @family7/api db:migrate
pnpm --filter @family7/api dev
```

Set a long random `JWT_SECRET` in `apps/api/.env` before starting. The API listens on http://localhost:3001.

Work in progress.
