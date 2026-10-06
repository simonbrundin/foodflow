import { execute } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Cart item ID is required'
    })
  }

  await execute('DELETE FROM shopping_cart_items WHERE id = $1', [id])

  return { success: true, id }
})
