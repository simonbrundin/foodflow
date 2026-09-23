import { execute } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Mapping ID is required'
    })
  }
  
  const result = await execute('DELETE FROM product_mappings WHERE id = $1', [id])
  
  if (!result.rowCount) {
    throw createError({
      statusCode: 404,
      message: 'Mapping not found'
    })
  }
  
  return { success: true, id }
})
