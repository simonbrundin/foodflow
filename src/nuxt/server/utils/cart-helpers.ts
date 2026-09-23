import { query, queryOne } from './db'
import type { Recipe, RecipeIngredient } from './types'

/**
 * Unit conversion multipliers to grams
 * Used for price calculations across different units
 */
const UNIT_TO_GRAMS: Record<string, number> = {
  'g': 1,
  'kg': 1000,
  'ml': 1,
  'l': 1000,
  'krm': 1,
  'tsk': 5,
  'msk': 15,
  'st': 100, // Default assumption for pieces
}

/**
 * Aggregated ingredient from multiple recipes
 */
export interface AggregatedIngredient {
  ingredientTypeId: string
  amount: number
  unit: string
  notes?: string
  sources: Array<{ recipeId: string; amount: number }>
}

/**
 * Fetch and aggregate ingredients from a week plan
 */
export async function aggregateWeekPlanIngredients(
  weekPlanId: string
): Promise<Map<string, AggregatedIngredient>> {
  const planRecipes = await query<{ recipe_id: string; servings: number }>(
    'SELECT recipe_id, servings FROM week_plan_recipes WHERE week_plan_id = $1',
    [weekPlanId]
  )
  
  const ingredientMap = new Map<string, AggregatedIngredient>()
  
  for (const pr of planRecipes) {
    const recipe = await queryOne<Recipe & { ingredients: string }>(
      'SELECT id, servings, ingredients FROM recipes WHERE id = $1',
      [pr.recipe_id]
    )
    
    if (!recipe) continue
    
    const ingredients = typeof recipe.ingredients === 'string'
      ? JSON.parse(recipe.ingredients)
      : recipe.ingredients
    
    const scaleFactor = pr.servings / recipe.servings
    
    for (const ing of ingredients as RecipeIngredient[]) {
      const scaledAmount = ing.amount * scaleAmount(ing.amount, scaleFactor)
      
      if (ingredientMap.has(ing.ingredientTypeId)) {
        const existing = ingredientMap.get(ing.ingredientTypeId)!
        existing.amount += scaledAmount
        existing.sources.push({ recipeId: recipe.id, amount: scaledAmount })
      } else {
        ingredientMap.set(ing.ingredientTypeId, {
          ingredientTypeId: ing.ingredientTypeId,
          amount: scaledAmount,
          unit: ing.unit,
          notes: ing.notes,
          sources: [{ recipeId: recipe.id, amount: scaledAmount }]
        })
      }
    }
  }
  
  return ingredientMap
}

function scaleAmount(amount: number, factor: number): number {
  return amount * factor
}

/**
 * Store product with mapped fields
 */
export interface MappedStoreProduct {
  id: string
  storeId: string
  name: string
  brand?: string
  category?: string
  price: number
  unit: string
  pricePerKg: number
  imageUrl?: string
  inStock: boolean
}

/**
 * Calculate price for an ingredient based on unit and product
 */
export function calculateIngredientPrice(
  amount: number,
  unit: string,
  product: MappedStoreProduct
): number {
  if (unit === 'st') {
    // For pieces - calculate price per piece
    const match = product.unit.match(/(\d+)/)
    const piecesInProduct = match && match[1] ? parseInt(match[1]) : 1
    const pricePerPiece = product.price / piecesInProduct
    return pricePerPiece * amount
  }
  
  // For weight/liquid units - convert to grams
  const gramsMultiplier = UNIT_TO_GRAMS[unit] ?? 1
  const gramsNeeded = amount * gramsMultiplier
  
  // Price per gram from product
  const pricePerGram = product.pricePerKg / 1000
  return pricePerGram * gramsNeeded
}

/**
 * Product mapping with store info
 */
interface ProductMappingRow {
  ingredient_type_id: string
  ingredient_type_name: string
  default_unit: string
}

/**
 * Get all product mappings for a store
 */
export async function getStoreMappings(
  storeId: string
): Promise<ProductMappingRow[]> {
  return query(
    `SELECT pm.ingredient_type_id, it.name as ingredient_type_name, it.default_unit
     FROM product_mappings pm
     JOIN ingredient_types it ON pm.ingredient_type_id = it.id
     WHERE pm.store_id = $1`
  , [storeId])
}

/**
 * Get all products for a store
 */
export async function getStoreProducts(storeId: string): Promise<MappedStoreProduct[]> {
  const rows = await query(
    'SELECT * FROM store_products WHERE store_id = $1',
    [storeId]
  )
  return rows.map((r) => {
    const row = r as Record<string, unknown>
    return {
      id: String(row.id),
      storeId: String(row.store_id),
      name: String(row.name),
      brand: row.brand ? String(row.brand) : undefined,
      category: row.category ? String(row.category) : undefined,
      price: Number(row.price),
      unit: String(row.unit),
      pricePerKg: Number(row.price_per_kg),
      imageUrl: row.image_url ? String(row.image_url) : undefined,
      inStock: Boolean(row.in_stock),
    }
  })
}

/**
 * Get all ingredient types
 */
export async function getIngredientTypes(): Promise<Array<{
  id: string
  name: string
  category: string
}>> {
  return query('SELECT id, name, category FROM ingredient_types')
}

/**
 * Find mapped product for an ingredient
 */
export function findMappedProduct(
  ingredientTypeId: string,
  mappings: ProductMappingRow[],
  products: MappedStoreProduct[]
): MappedStoreProduct | null {
  const mapping = mappings.find(m => m.ingredient_type_id === ingredientTypeId)
  if (!mapping) return null
  return products.find(p => p.id === mapping.ingredient_type_id) ?? null
}
