import { z } from 'zod'

export const addGrocerySchema = z.object({
  name: z.string().trim().min(1).max(60),
})

export const setGroceryCheckedSchema = z.object({
  checked: z.boolean(),
})

const groceryUserSchema = z.object({
  id: z.string(),
  name: z.string(),
})

export const groceryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  addedBy: groceryUserSchema,
  checkedBy: groceryUserSchema.nullable(),
  checkedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
})

export type GroceryItem = z.infer<typeof groceryItemSchema>
