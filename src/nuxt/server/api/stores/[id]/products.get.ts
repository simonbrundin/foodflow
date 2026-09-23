import { query, mapStoreProduct } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const storeId = getRouterParam(event, 'id')
  const queryParams = getQuery(event)
  const search = queryParams.search as string | undefined
  const category = queryParams.category as string | undefined
  const limit = Number(queryParams.limit) || 100
  
  if (!storeId) {
    throw createError({
      statusCode: 400,
      message: 'Store ID is required'
    })
  }
  
  let sql = 'SELECT * FROM store_products WHERE store_id = $1 AND in_stock = true'
  const params: unknown[] = [storeId]
  let paramIndex = 2
  
  if (search) {
    sql += ` AND (name ILIKE $${paramIndex} OR brand ILIKE $${paramIndex})`
    params.push(`%${search}%`)
    paramIndex++
  }
  
  if (category) {
    sql += ` AND category = $${paramIndex}`
    params.push(category)
    paramIndex++
  }
  
  sql += ` ORDER BY price_per_kg ASC LIMIT $${paramIndex}`
  params.push(limit)
  
  const products = await query(sql, params)
  
  return products.map((p) => mapStoreProduct(p as Record<string, unknown>))
})
