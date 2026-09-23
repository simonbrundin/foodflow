import { query, queryOne, execute } from '~/server/utils/db'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  const { ingredientTypeId, storeId, storeProductId, isDefault = true, priority = 0, notes } = body
  
  if (!ingredientTypeId || !storeId || !storeProductId) {
    throw createError({
      statusCode: 400,
      message: 'ingredientTypeId, storeId, and storeProductId are required'
    })
  }
  
  const id = randomUUID()
  const now = new Date().toISOString()
  
  // If this is set as default, unset other defaults for this ingredient/store combo
  if (isDefault) {
    await execute(`
      UPDATE product_mappings 
      SET is_default = false, updated_at = $1
      WHERE ingredient_type_id = $2 AND store_id = $3 AND id != $4
    `, [now, ingredientTypeId, storeId, id])
  }
  
  await execute(`
    INSERT INTO product_mappings (id, ingredient_type_id, store_id, store_product_id, is_default, priority, notes, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
  `, [id, ingredientTypeId, storeId, storeProductId, isDefault, priority, notes, now])
  
  // Return the created mapping
  const mapping = await queryOne(`
    SELECT 
      pm.*,
      it.name as ingredient_type_name,
      s.name as store_name,
      sp.name as store_product_name,
      sp.brand as product_brand
    FROM product_mappings pm
    LEFT JOIN ingredient_types it ON pm.ingredient_type_id = it.id
    LEFT JOIN stores s ON pm.store_id = s.id
    LEFT JOIN store_products sp ON pm.store_product_id = sp.id
    WHERE pm.id = $1
  `, [id])
  
  const m = mapping as any
  return {
    id: m.id,
    ingredientTypeId: m.ingredient_type_id,
    ingredientTypeName: m.ingredient_type_name,
    storeId: m.store_id,
    storeName: m.store_name,
    storeProductId: m.store_product_id,
    storeProductName: m.store_product_name,
    productBrand: m.product_brand,
    isDefault: m.is_default,
    priority: m.priority,
    notes: m.notes,
    createdAt: m.created_at
  }
})
