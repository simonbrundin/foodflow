import pg from 'pg'
import type { Recipe, RecipeIngredient, Store, StoreProduct, WeekPlan, WeekPlanRecipe, ShoppingCart, ShoppingCartItem, IngredientType, ProductMapping } from './types'

const { Pool } = pg

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'foodflow',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Helper for running queries
export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await pool.query(text, params)
  return result.rows as T[]
}

export async function queryOne<T = unknown>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] || null
}

export async function execute(text: string, params?: unknown[]): Promise<{ rowCount: number; rows: unknown[] }> {
  const result = await pool.query(text, params)
  return { rowCount: result.rowCount || 0, rows: result.rows }
}

export async function getClient() {
  return pool.connect()
}

// JSON field parser helper
export function parseJsonField<T>(field: unknown): T {
  if (typeof field === 'string') {
    return JSON.parse(field) as T
  }
  return field as T
}

// ============================================
// Mapping Helpers (snake_case → camelCase)
// ============================================

export function mapRecipe(row: Record<string, unknown>): Recipe {
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description),
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    prepTime: Number(row.prep_time),
    cookTime: Number(row.cook_time),
    servings: Number(row.servings),
    difficulty: String(row.difficulty) as Recipe['difficulty'],
    sourceUrl: row.source_url ? String(row.source_url) : undefined,
    sourceName: row.source_name ? String(row.source_name) : undefined,
    ingredients: parseJsonField<RecipeIngredient[]>(row.ingredients),
    instructions: parseJsonField<string[]>(row.instructions),
    tags: parseJsonField<string[]>(row.tags ?? []),
    nutritionInfo: parseJsonField<Recipe['nutritionInfo']>(row.nutrition_info),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  }
}

export function mapStore(row: Record<string, unknown>): Store {
  return {
    id: String(row.id),
    name: String(row.name),
    chainId: String(row.chain_id) as Store['chainId'],
    address: row.address ? String(row.address) : undefined,
    location: row.latitude && row.longitude 
      ? { lat: Number(row.latitude), lng: Number(row.longitude) }
      : undefined,
    isActive: Boolean(row.is_active),
    lastScraped: row.last_scraped ? new Date(String(row.last_scraped)) : undefined,
    createdAt: new Date(String(row.created_at)),
  }
}

export function mapStoreProduct(row: Record<string, unknown>): StoreProduct {
  return {
    id: String(row.id),
    storeId: String(row.store_id),
    storeName: row.store_name ? String(row.store_name) : undefined,
    name: String(row.name),
    brand: row.brand ? String(row.brand) : undefined,
    category: row.category ? String(row.category) : undefined,
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    unit: String(row.unit),
    pricePerKg: Number(row.price_per_kg),
    pricePerLiter: row.price_per_liter ? Number(row.price_per_liter) : undefined,
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    productUrl: row.product_url ? String(row.product_url) : undefined,
    inStock: Boolean(row.in_stock),
    isAvailable: row.is_available !== undefined ? Boolean(row.is_available) : true,
    lastUpdated: row.last_updated ? new Date(String(row.last_updated)) : new Date(),
  }
}

export function mapWeekPlan(row: Record<string, unknown>, recipes: WeekPlanRecipe[] = []): WeekPlan {
  return {
    id: String(row.id),
    name: String(row.name),
    weekNumber: Number(row.week_number),
    year: Number(row.year),
    startDate: new Date(String(row.start_date)),
    endDate: new Date(String(row.end_date)),
    recipes,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  }
}

export function mapWeekPlanRecipe(row: Record<string, unknown>): WeekPlanRecipe {
  return {
    id: String(row.id),
    weekPlanId: String(row.week_plan_id),
    recipeId: String(row.recipe_id),
    recipeName: row.recipe_name ? String(row.recipe_name) : undefined,
    recipeImageUrl: row.recipe_image_url ? String(row.recipe_image_url) : undefined,
    servings: Number(row.servings),
    dayOfWeek: row.day_of_week ? Number(row.day_of_week) : undefined,
    mealType: row.meal_type ? String(row.meal_type) as WeekPlanRecipe['mealType'] : undefined,
    notes: row.notes ? String(row.notes) : undefined,
  }
}

export function mapIngredientType(row: Record<string, unknown>): IngredientType {
  return {
    id: String(row.id),
    name: String(row.name),
    singularName: row.singular_name ? String(row.singular_name) : undefined,
    pluralName: row.plural_name ? String(row.plural_name) : undefined,
    category: String(row.category) as IngredientType['category'],
    defaultUnit: String(row.default_unit),
    aliases: row.aliases ? parseJsonField<string[]>(row.aliases) : undefined,
    createdAt: new Date(String(row.created_at)),
  }
}

export function mapProductMapping(row: Record<string, unknown>): ProductMapping {
  return {
    id: String(row.id),
    ingredientTypeId: String(row.ingredient_type_id),
    ingredientTypeName: row.ingredient_type_name ? String(row.ingredient_type_name) : undefined,
    storeId: String(row.store_id),
    storeName: row.store_name ? String(row.store_name) : undefined,
    storeProductId: String(row.store_product_id),
    storeProductName: row.store_product_name ? String(row.store_product_name) : undefined,
    isDefault: Boolean(row.is_default),
    priority: Number(row.priority),
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  }
}

export function mapShoppingCartItem(row: Record<string, unknown>): ShoppingCartItem {
  return {
    id: String(row.id),
    cartId: String(row.cart_id),
    ingredientTypeId: String(row.ingredient_type_id),
    ingredientTypeName: String(row.ingredient_type_name),
    storeProductId: String(row.store_product_id),
    storeProductName: String(row.store_product_name),
    brand: row.brand ? String(row.brand) : undefined,
    quantity: Number(row.quantity),
    unit: String(row.unit),
    pricePerUnit: Number(row.price_per_unit),
    totalPrice: Number(row.total_price),
    isResolved: Boolean(row.is_resolved),
    isOptional: Boolean(row.is_optional),
    notes: row.notes ? String(row.notes) : undefined,
  }
}

export function mapShoppingCart(row: Record<string, unknown>, items: ShoppingCartItem[] = []): ShoppingCart {
  return {
    id: String(row.id),
    weekPlanId: row.week_plan_id ? String(row.week_plan_id) : undefined,
    storeId: String(row.store_id),
    storeName: row.store_name ? String(row.store_name) : undefined,
    items,
    status: String(row.status) as ShoppingCart['status'],
    totalPrice: Number(row.total_price),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  }
}

// ============================================
// Initialize & Seed
// ============================================

export async function initDb() {
  const { initSchema } = await import('./schema')
  const { seedIngredients } = await import('./seed-ingredients')
  const { seedStores } = await import('./seed-stores')
  const { seedRecipes } = await import('./seed-recipes')
  
  try {
    await initSchema()
    await seedIngredients()
    await seedStores()
    await seedRecipes()
  } catch (error) {
    console.error('Database initialization failed:', error)
  }
}

// Initialize on module load
initDb()

export default pool
