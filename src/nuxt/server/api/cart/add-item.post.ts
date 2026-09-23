import { query, queryOne, execute } from '~/server/utils/db'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  const { cartId, ingredientTypeId, storeId, storeProductId, quantity, unit, pricePerUnit, notes } = body
  
  if (!cartId || !ingredientTypeId || !storeProductId) {
    throw createError({
      statusCode: 400,
      message: 'cartId, ingredientTypeId, and storeProductId are required'
    })
  }
  
  // Get product
  const product = await queryOne(
    'SELECT * FROM store_products WHERE id = $1',
    [storeProductId]
  ) as any
  
  if (!product) {
    throw createError({ statusCode: 404, message: 'Product not found' })
  }
  
  // Calculate total
  const actualPricePerUnit = pricePerUnit || product.price_per_kg / 1000
  const totalPrice = actualPricePerUnit * quantity
  
  // Get ingredient type name
  const ingType = await queryOne(
    'SELECT * FROM ingredient_types WHERE id = $1',
    [ingredientTypeId]
  ) as any
  
  const id = randomUUID()
  const now = new Date().toISOString()
  
  // Insert cart item
  await execute(`
    INSERT INTO shopping_cart_items 
    (id, cart_id, ingredient_type_id, store_product_id, quantity, unit, price_per_unit, total_price, is_resolved, is_optional, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, false, $9)
  `, [id, cartId, ingredientTypeId, storeProductId, quantity, unit || 'g', actualPricePerUnit, totalPrice, notes || null])
  
  // Update cart total
  await execute(`
    UPDATE shopping_carts 
    SET total_price = (
      SELECT COALESCE(SUM(total_price), 0) FROM shopping_cart_items WHERE cart_id = $1
    ), updated_at = $2
    WHERE id = $1
  `, [cartId, now])
  
  // Create mapping for future use
  await execute(`
    INSERT INTO product_mappings (id, ingredient_type_id, store_id, store_product_id, is_default, priority, created_at, updated_at)
    VALUES ($1, $2, $3, $4, true, 0, $5, $5)
    ON CONFLICT DO NOTHING
  `, [randomUUID(), ingredientTypeId, storeId, storeProductId, now])
  
  return {
    id,
    cartId,
    ingredientTypeId,
    ingredientTypeName: ingType?.name || '',
    storeProductId,
    storeProductName: product.name,
    brand: product.brand,
    quantity,
    unit,
    pricePerUnit: actualPricePerUnit,
    totalPrice,
    isResolved: true
  }
})
