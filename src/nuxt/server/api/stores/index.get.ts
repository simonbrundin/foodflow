import { query, mapStore } from '~/server/utils/db'

export default defineEventHandler(async () => {
  const stores = await query(`
    SELECT * FROM stores 
    WHERE is_active = true 
    ORDER BY name
  `)
  
  return stores.map((s) => mapStore(s as Record<string, unknown>))
})
