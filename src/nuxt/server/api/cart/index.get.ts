import { queryOne, query, mapShoppingCart, mapShoppingCartItem } from '~/server/utils/db'

export default defineEventHandler(async () => {
  const cart = await queryOne(
    `SELECT * FROM shopping_carts 
     ORDER BY created_at DESC 
     LIMIT 1`
  )
  
  if (!cart) {
    return null
  }
  
  const cartRow = cart as Record<string, unknown>
  
  const store = await queryOne(
    'SELECT name FROM stores WHERE id = $1',
    [cartRow.store_id]
  )
  
  const items = await query(`
    SELECT sci.*, it.name as ingredient_type_name, sp.name as store_product_name, sp.brand
    FROM shopping_cart_items sci
    LEFT JOIN ingredient_types it ON sci.ingredient_type_id = it.id
    LEFT JOIN store_products sp ON sci.store_product_id = sp.id
    WHERE sci.cart_id = $1
  `, [cartRow.id])
  
  const mappedCart = mapShoppingCart(cartRow)
  mappedCart.storeName = store ? String((store as Record<string, unknown>).name) : undefined
  mappedCart.items = items.map((i) => {
    const item = i as Record<string, unknown>
    return {
      ...mapShoppingCartItem(item),
      ingredientTypeName: String(item.ingredient_type_name),
      storeProductName: String(item.store_product_name),
      brand: item.brand ? String(item.brand) : undefined,
    }
  })
  
  return mappedCart
})
