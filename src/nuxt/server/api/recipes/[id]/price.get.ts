import { query, mapRecipe } from '~/server/utils/db'
import { calculateIngredientPrice } from '~/server/utils/cart-helpers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const queryParams = getQuery(event)

  const storeId = queryParams.storeId as string | undefined
  const requestedServings = Number(queryParams.servings) || 1

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Recipe ID is required'
    })
  }

  // Get the recipe
  const recipes = await query(
    'SELECT * FROM recipes WHERE id = $1',
    [id]
  )

  if (!recipes.length) {
    throw createError({
      statusCode: 404,
      message: 'Recipe not found'
    })
  }

  const recipe = mapRecipe(recipes[0] as Record<string, unknown>)

  // Get all ingredient type IDs from the recipe
  const ingredientTypeIds = recipe.ingredients
    .map(ing => ing.ingredientTypeId)
    .filter(Boolean) as string[]

  if (!ingredientTypeIds.length) {
    return {
      totalPrice: 0,
      pricePerServing: 0,
      servings: requestedServings,
      currency: 'kr',
      mapped: 0,
      unmapped: 0,
      hasPrice: false
    }
  }

  // If no storeId provided, find the best store (most mappings)
  let targetStoreId = storeId
  if (!targetStoreId) {
    const storeRanking = await query<{ store_id: string, mapping_count: string }>(`
      SELECT pm.store_id, COUNT(*) as mapping_count
      FROM product_mappings pm
      WHERE pm.ingredient_type_id = ANY($1)
      GROUP BY pm.store_id
      ORDER BY COUNT(*) DESC
      LIMIT 1
    `, [ingredientTypeIds])

    const bestStore = storeRanking[0]
    if (bestStore) {
      targetStoreId = bestStore.store_id
    }
  }

  if (!targetStoreId) {
    return {
      totalPrice: 0,
      pricePerServing: 0,
      servings: requestedServings,
      currency: 'kr',
      mapped: 0,
      unmapped: ingredientTypeIds.length,
      hasPrice: false
    }
  }

  // Get mappings and products for the target store
  const mappings = await query<{
    ingredient_type_id: string
    store_product_id: string
    product_name: string
    product_price: number
    product_unit: string
    product_price_per_kg: number
    is_default: boolean
    priority: number
  }>(`
    SELECT 
      pm.ingredient_type_id,
      pm.store_product_id,
      pm.is_default,
      pm.priority,
      sp.name as product_name,
      sp.price as product_price,
      sp.unit as product_unit,
      sp.price_per_kg as product_price_per_kg
    FROM product_mappings pm
    LEFT JOIN store_products sp ON pm.store_product_id = sp.id
    WHERE pm.ingredient_type_id = ANY($1)
      AND pm.store_id = $2
    ORDER BY pm.is_default DESC, pm.priority DESC
  `, [ingredientTypeIds, targetStoreId])

  // Group mappings by ingredient type ID (take the best one for each)
  const mappingByIngredientType = new Map<string, typeof mappings[0]>()
  for (const m of mappings) {
    if (!mappingByIngredientType.has(m.ingredient_type_id)) {
      mappingByIngredientType.set(m.ingredient_type_id, m)
    }
  }

  // Calculate total price
  let totalPrice = 0
  let mapped = 0
  let unmapped = 0

  for (const ingredient of recipe.ingredients) {
    if (!ingredient.ingredientTypeId) continue

    const mapping = mappingByIngredientType.get(ingredient.ingredientTypeId)

    if (mapping && mapping.product_price) {
      const price = calculateIngredientPrice(
        (ingredient.amount || 1) * (requestedServings / recipe.servings),
        ingredient.unitId || 'st',
        {
          id: mapping.store_product_id,
          storeId: targetStoreId!,
          name: mapping.product_name,
          price: Number(mapping.product_price),
          unit: mapping.product_unit || 'st',
          pricePerKg: Number(mapping.product_price_per_kg) || 0,
          inStock: true
        }
      )

      totalPrice += price
      mapped++
    } else {
      unmapped++
    }
  }

  const pricePerServing = totalPrice / requestedServings

  // Only show price if at least 50% of ingredients are mapped
  const totalIngredients = mapped + unmapped
  const hasPrice = totalIngredients > 0 && (mapped / totalIngredients) >= 0.5

  return {
    totalPrice: Math.round(totalPrice * 100) / 100,
    pricePerServing: Math.round(pricePerServing * 100) / 100,
    servings: requestedServings,
    currency: 'kr',
    mapped,
    unmapped,
    hasPrice,
    storeId: targetStoreId
  }
})
