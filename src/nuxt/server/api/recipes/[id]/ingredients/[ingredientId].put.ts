import { queryOne, execute, mapRecipe } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const recipeId = getRouterParam(event, 'id')
  const ingredientId = getRouterParam(event, 'ingredientId')

  if (!recipeId || !ingredientId) {
    throw createError({
      statusCode: 400,
      message: 'Recipe ID and Ingredient ID are required'
    })
  }

  const body = await readBody(event)
  const { unitId, amount, notes } = body

  if (!unitId && amount === undefined && notes === undefined) {
    throw createError({
      statusCode: 400,
      message: 'At least one of unitId, amount, or notes is required'
    })
  }

  // Get the recipe
  const recipe = await queryOne(
    'SELECT * FROM recipes WHERE id = $1',
    [recipeId]
  )

  if (!recipe) {
    throw createError({
      statusCode: 404,
      message: 'Recipe not found'
    })
  }

  // Parse ingredients
  const recipeData = recipe as Record<string, unknown>
  let ingredientsRaw = recipeData.ingredients

  // Handle both string and object
  if (typeof ingredientsRaw === 'string') {
    ingredientsRaw = JSON.parse(ingredientsRaw)
  }

  const ingredients = ingredientsRaw as Array<{
    id?: string
    recipeId?: string
    ingredientTypeId: string
    amount: number
    unitId?: string
    unit?: string
    notes?: string
  }>

  // Find and update the ingredient - try index first (ingredients have no IDs), then try id match
  let ingredientIndex = Number.parseInt(ingredientId, 10) - 1

  // Check if it's a valid index
  if (Number.isNaN(ingredientIndex) || ingredientIndex < 0 || ingredientIndex >= ingredients.length) {
    // Try to find by id
    ingredientIndex = ingredients.findIndex(ing => ing.id === ingredientId)
  }

  // If still not found, check if it's an id that's empty (common case)
  if (ingredientIndex === -1) {
    // Try to find by index string like "1", "2", etc.
    const idx = Number.parseInt(ingredientId, 10)
    if (!Number.isNaN(idx) && idx >= 0 && idx < ingredients.length) {
      ingredientIndex = idx
    }
  }

  if (ingredientIndex === -1 || ingredientIndex < 0 || ingredientIndex >= ingredients.length) {
    throw createError({
      statusCode: 404,
      message: `Ingredient not found: ${ingredientId}`
    })
  }

  const ingredient = ingredients[ingredientIndex]
  if (!ingredient) {
    throw createError({
      statusCode: 404,
      message: `Ingredient not found: ${ingredientId}`
    })
  }

  // Update the ingredient
  if (unitId !== undefined) {
    ingredient.unitId = unitId
  }
  if (amount !== undefined) {
    ingredient.amount = amount
  }
  if (notes !== undefined) {
    ingredient.notes = notes || undefined
  }

  // Save the updated recipe
  await execute(
    'UPDATE recipes SET ingredients = $1, updated_at = NOW() WHERE id = $2',
    [JSON.stringify(ingredients), recipeId]
  )

  // Return the updated recipe
  const updated = await queryOne(
    'SELECT * FROM recipes WHERE id = $1',
    [recipeId]
  )

  return mapRecipe(updated as Record<string, unknown>)
})
