import { query, mapStoreProduct } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { storeId, searchQuery } = body
  
  if (!storeId || !searchQuery) {
    throw createError({
      statusCode: 400,
      message: 'storeId and searchQuery are required'
    })
  }
  
  const products = await query(`
    SELECT * FROM store_products
    WHERE store_id = $1 
      AND (name ILIKE $2 OR brand ILIKE $2 OR category ILIKE $2)
      AND in_stock = true
    ORDER BY price_per_kg ASC
    LIMIT 50
  `, [storeId, `%${searchQuery}%`])
  
  return products.map((p) => mapStoreProduct(p as Record<string, unknown>))
})
