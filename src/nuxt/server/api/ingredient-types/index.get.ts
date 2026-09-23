import { query, mapIngredientType } from '~/server/utils/db'

export default defineEventHandler(async () => {
  const ingredients = await query(`
    SELECT * FROM ingredient_types 
    ORDER BY category, name
  `)
  
  return ingredients.map((i) => mapIngredientType(i as Record<string, unknown>))
})
