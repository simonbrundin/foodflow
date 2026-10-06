import { queryOne, execute } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Recipe ID is required'
    })
  }

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

  // Delete the recipe (cascades to week_plan_recipes due to ON DELETE CASCADE)
  await execute(
    'DELETE FROM recipes WHERE id = $1',
    [id]
  )

  return { success: true, message: 'Recipe deleted' }
})
