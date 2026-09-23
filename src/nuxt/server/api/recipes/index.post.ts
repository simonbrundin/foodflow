import { execute } from '~/server/utils/db'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  const now = new Date().toISOString()
  const id = body.id || randomUUID()
  
  await execute(
    `INSERT INTO recipes (id, title, description, image_url, prep_time, cook_time, servings, difficulty, source_url, source_name, ingredients, instructions, tags, nutrition_info, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $15)`,
    [
      id,
      body.title,
      body.description || '',
      body.imageUrl || null,
      body.prepTime || 0,
      body.cookTime || 0,
      body.servings || 4,
      body.difficulty || 'medium',
      body.sourceUrl || null,
      body.sourceName || null,
      JSON.stringify(body.ingredients || []),
      JSON.stringify(body.instructions || []),
      body.tags ? JSON.stringify(body.tags) : null,
      body.nutritionInfo ? JSON.stringify(body.nutritionInfo) : null,
      now
    ]
  )
  
  return {
    id,
    ...body,
    createdAt: now,
    updatedAt: now
  }
})
