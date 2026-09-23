import { queryOne, mapRecipe } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Recipe ID is required'
    })
  }
  
  const recipe = await queryOne(
    'SELECT * FROM recipes WHERE id = $1',
    [id]
  )
  
  if (!recipe) {
    throw createError({
      statusCode: 404,
      message: 'Recipe not found'
    })
  }
  
  return mapRecipe(recipe as Record<string, unknown>)
})
