import { queryOne, execute, mapRecipe } from '~/server/utils/db'
import type { Recipe, RecipeIngredient } from '~/server/utils/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Recipe ID is required'
    })
  }
  
  // Get the request body
  const body = await readBody(event)
  
  // Check if recipe exists
  const existing = await queryOne(
    'SELECT id FROM recipes WHERE id = $1',
    [id]
  )
  
  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Recipe not found'
    })
  }
  
  // Build the update query dynamically based on provided fields
  const updates: string[] = []
  const values: unknown[] = []
  let paramIndex = 1
  
  // Fields that can be updated
  const allowedFields = [
    'title', 'description', 'imageUrl', 'prepTime', 'cookTime',
    'servings', 'difficulty', 'sourceUrl', 'sourceName',
    'ingredients', 'instructions', 'tags', 'nutritionInfo'
  ]
  
  // Map camelCase to snake_case
  const fieldMap: Record<string, string> = {
    title: 'title',
    description: 'description',
    imageUrl: 'image_url',
    prepTime: 'prep_time',
    cookTime: 'cook_time',
    servings: 'servings',
    difficulty: 'difficulty',
    sourceUrl: 'source_url',
    sourceName: 'source_name',
    ingredients: 'ingredients',
    instructions: 'instructions',
    tags: 'tags',
    nutritionInfo: 'nutrition_info'
  }
  
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      // Handle JSON fields
      if (['ingredients', 'instructions', 'tags', 'nutritionInfo'].includes(field)) {
        updates.push(`${fieldMap[field]} = $${paramIndex}`)
        values.push(JSON.stringify(body[field]))
      } else {
        updates.push(`${fieldMap[field]} = $${paramIndex}`)
        values.push(body[field])
      }
      paramIndex++
    }
  }
  
  // Always update the updated_at timestamp
  updates.push(`updated_at = NOW()`)
  
  if (updates.length === 1) {
    // Only updated_at, no other changes
    throw createError({
      statusCode: 400,
      message: 'No fields to update'
    })
  }
  
  values.push(id)
  
  const updateQuery = `
    UPDATE recipes 
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `
  
  const result = await execute(updateQuery, values)
  
  if (result.rowCount === 0) {
    throw createError({
      statusCode: 404,
      message: 'Recipe not found after update'
    })
  }
  
  // Fetch and return the updated recipe
  const updated = await queryOne(
    'SELECT * FROM recipes WHERE id = $1',
    [id]
  )
  
  return mapRecipe(updated as Record<string, unknown>)
})
