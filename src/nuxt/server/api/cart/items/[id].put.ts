import { execute, queryOne } from '~/server/utils/db'

interface CartItemUpdate {
  quantity?: number
}

interface CartItemRow {
  id: string
  quantity: number
  store_product_id: string
}

interface StoreProductRow {
  price_per_kg: number
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<CartItemUpdate>(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Cart item ID is required'
    })
  }

  const item = await queryOne<CartItemRow>(
    'SELECT id, quantity, store_product_id FROM shopping_cart_items WHERE id = $1',
    [id]
  )

  if (!item) {
    throw createError({ statusCode: 404, message: 'Cart item not found' })
  }

  const newQuantity = body.quantity ?? item.quantity

  if (newQuantity <= 0) {
    await execute('DELETE FROM shopping_cart_items WHERE id = $1', [id])
    return { success: true, deleted: true, id }
  }

  // Recalculate total price for this item
  const product = await queryOne<StoreProductRow>(
    'SELECT price_per_kg FROM store_products WHERE id = $1',
    [item.store_product_id]
  )

  const unitPrice = product ? product.price_per_kg / 1000 : 0
  const newTotalPrice = newQuantity * unitPrice

  await execute(
    `UPDATE shopping_cart_items
     SET quantity = $1, total_price = $2, updated_at = NOW()
     WHERE id = $3`,
    [newQuantity, newTotalPrice, id]
  )

  return {
    success: true,
    deleted: false,
    id,
    quantity: newQuantity,
    totalPrice: newTotalPrice
  }
})
