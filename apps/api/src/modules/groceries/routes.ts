import { addGrocerySchema, setGroceryCheckedSchema } from '@family7/shared'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../../db'
import { broadcast } from '../live/registry'
import { getCircleIdFor } from '../locations/service'

const MAX_ITEMS = 200

const groceryParamsSchema = z.object({ id: z.string() })

type GroceryRow = {
  id: string
  name: string
  checkedAt: Date | null
  createdAt: Date
  addedBy: { id: string; name: string }
  checkedBy: { id: string; name: string } | null
}

const includeUsers = {
  addedBy: { select: { id: true, name: true } },
  checkedBy: { select: { id: true, name: true } },
}

function toItemPayload(item: GroceryRow) {
  return {
    id: item.id,
    name: item.name,
    addedBy: item.addedBy,
    checkedBy: item.checkedBy,
    checkedAt: item.checkedAt ? item.checkedAt.toISOString() : null,
    createdAt: item.createdAt.toISOString(),
  }
}

export default async function groceryRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.get('/groceries', async (request, reply) => {
    const circleId = await getCircleIdFor(request.userId)
    if (!circleId) return reply.code(409).send({ error: 'not in a circle' })
    const items = await db.groceryItem.findMany({
      where: { circleId },
      include: includeUsers,
      orderBy: { createdAt: 'desc' },
    })
    return { items: items.map(toItemPayload) }
  })

  app.post('/groceries', async (request, reply) => {
    const body = addGrocerySchema.parse(request.body)
    const circleId = await getCircleIdFor(request.userId)
    if (!circleId) return reply.code(409).send({ error: 'not in a circle' })
    const count = await db.groceryItem.count({ where: { circleId } })
    if (count >= MAX_ITEMS) return reply.code(409).send({ error: 'list is full' })
    const item = await db.groceryItem.create({
      data: { circleId, name: body.name, addedById: request.userId },
      include: includeUsers,
    })
    broadcast(circleId, { type: 'groceries:updated' })
    return { item: toItemPayload(item) }
  })

  app.patch('/groceries/:id', async (request, reply) => {
    const params = groceryParamsSchema.parse(request.params)
    const body = setGroceryCheckedSchema.parse(request.body)
    const circleId = await getCircleIdFor(request.userId)
    if (!circleId) return reply.code(409).send({ error: 'not in a circle' })
    const existing = await db.groceryItem.findUnique({ where: { id: params.id } })
    if (!existing || existing.circleId !== circleId) {
      return reply.code(404).send({ error: 'item not found' })
    }
    const item = await db.groceryItem.update({
      where: { id: params.id },
      data: body.checked
        ? { checkedById: request.userId, checkedAt: new Date() }
        : { checkedById: null, checkedAt: null },
      include: includeUsers,
    })
    broadcast(circleId, { type: 'groceries:updated' })
    return { item: toItemPayload(item) }
  })

  app.delete('/groceries/:id', async (request, reply) => {
    const params = groceryParamsSchema.parse(request.params)
    const circleId = await getCircleIdFor(request.userId)
    if (!circleId) return reply.code(409).send({ error: 'not in a circle' })
    const existing = await db.groceryItem.findUnique({ where: { id: params.id } })
    if (!existing || existing.circleId !== circleId) {
      return reply.code(404).send({ error: 'item not found' })
    }
    await db.groceryItem.delete({ where: { id: params.id } })
    broadcast(circleId, { type: 'groceries:updated' })
    return { ok: true }
  })
}
