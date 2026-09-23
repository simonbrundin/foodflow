import { query, mapIngredientType } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { searchQuery } = body
  
  if (!searchQuery) {
    throw createError({
      statusCode: 400,
      message: 'searchQuery is required'
    })
  }
  
  const ingredients = await query(`
    SELECT * FROM ingredient_types
    WHERE name ILIKE $1 
       OR singular_name ILIKE $1 
       OR plural_name ILIKE $1
    ORDER BY name
    LIMIT 20
  `, [`%${searchQuery}%`])
  
  return ingredients.map((i) => mapIngredientType(i as Record<string, unknown>))
})
