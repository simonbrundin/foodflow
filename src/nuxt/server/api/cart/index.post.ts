import { queryOne, execute } from '~/server/utils/db'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  const { weekPlanId, storeId } = body
  
  if (!weekPlanId || !storeId) {
    throw createError({
      statusCode: 400,
      message: 'weekPlanId and storeId are required'
    })
  }
  
  // Get store
  const store = await queryOne('SELECT * FROM stores WHERE id = $1', [storeId])
  if (!store) {
    throw createError({ statusCode: 404, message: 'Store not found' })
  }
  
  const id = randomUUID()
  const now = new Date().toISOString()
  
  await execute(`
    INSERT INTO shopping_carts (id, week_plan_id, store_id, status, total_price, created_at, updated_at)
    VALUES ($1, $2, $3, 'draft', 0, $4, $4)
  `, [id, weekPlanId, storeId, now])
  
  return {
    id,
    weekPlanId,
    storeId,
    storeName: (store as any).name,
    status: 'draft',
    totalPrice: 0,
    createdAt: now
  }
})
