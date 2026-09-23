import { query, mapProductMapping } from '~/server/utils/db'

export default defineEventHandler(async () => {
  const mappings = await query(`
    SELECT 
      pm.*,
      it.name as ingredient_type_name,
      it.category as ingredient_category,
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
    ORDER BY it.name, s.name
  `)
  
  return mappings.map((m) => mapProductMapping(m as Record<string, unknown>))
})
