import { query, mapProductMapping } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const ingredientTypeId = getRouterParam(event, 'ingredientTypeId')
  
  if (!ingredientTypeId) {
    throw createError({
      statusCode: 400,
      message: 'ingredientTypeId is required'
    })
  }
  
  const mappings = await query(`
    SELECT 
      pm.*,
      it.name as ingredient_type_name,
      s.name as store_name,
      sp.name as store_product_name,
      sp.brand as product_brand,
      sp.price as product_price,
      sp.price_per_kg,
      sp.unit as product_unit
    FROM product_mappings pm
    LEFT JOIN ingredient_types it ON pm.ingredient_type_id = it.id
    LEFT JOIN stores s ON pm.store_id = s.id
    LEFT JOIN store_products sp ON pm.store_product_id = sp.id
    WHERE pm.ingredient_type_id = $1
    ORDER BY s.name, pm.is_default DESC, pm.priority DESC
  `, [ingredientTypeId])
  
  return mappings.map((m) => mapProductMapping(m as Record<string, unknown>))
})
