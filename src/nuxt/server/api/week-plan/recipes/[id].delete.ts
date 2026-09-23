import { execute } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Recipe ID is required'
    })
  }

  const result = await execute(
    `DELETE FROM week_plan_recipes WHERE id = $1`,
    [id]
  )

  if (!result.rowCount) {
    throw createError({
      statusCode: 404,
      message: 'Recipe not found in week plan'
    })
  }

  return {
    success: true,
    message: 'Recipe removed from week plan',
    id
  }
})
