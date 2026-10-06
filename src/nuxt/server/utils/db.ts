import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'foodflow',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
})

// ============================================
// Connection helpers
// ============================================

export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await pool.query(text, params)
  return result.rows as T[]
}

export async function queryOne<T = unknown>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] || null
}

export async function execute(text: string, params?: unknown[]): Promise<{ rowCount: number, rows: unknown[] }> {
  const result = await pool.query(text, params)
  return { rowCount: result.rowCount || 0, rows: result.rows }
}

export async function getClient() {
  return pool.connect()
}

export default pool

// ============================================
// Re-export all mappers for backwards compatibility
// ============================================

export {
  parseJsonField,
  mapRecipeIngredients,
  mapRecipe,
  mapStore,
  mapStoreProduct,
  mapWeekPlan,
  mapWeekPlanRecipe,
  mapIngredientType,
  mapUnit,
  mapIngredientConversion,
  mapProductMapping,
  mapShoppingCartItem,
  mapShoppingCart
} from './mappers'

// ============================================
// Initialize & Seed
// ============================================

export async function initDb() {
  const { initSchema } = await import('./schema')
  const { seedUnits } = await import('./seed-units')
  const { seedIngredients } = await import('./seed-ingredients')
  const { seedStores } = await import('./seed-stores')
  const { seedProducts } = await import('./seed-products')
  const { seedRecipes } = await import('./seed-recipes')
  const { seedConversions } = await import('./seed-conversions')

  try {
    await initSchema()
    await seedUnits()
    await seedIngredients()
    await seedStores()
    await seedProducts()
    await seedRecipes()
    await seedConversions()
  } catch (error) {
    console.error('Database initialization failed:', error)
  }
}

// Initialize on module load
initDb()
