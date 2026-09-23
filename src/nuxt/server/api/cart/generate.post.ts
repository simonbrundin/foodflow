import { query, queryOne } from '~/server/utils/db'
import { getIngredientTypes, getStoreMappings, getStoreProducts, calculateIngredientPrice, type MappedStoreProduct } from '~/server/utils/cart-helpers'

interface GeneratedCartResult {
  success: boolean
  mappedIngredients: MappedIngredient[]
  unmappedIngredients: UnmappedIngredient[]
  summary: CartSummary
}

interface MappedIngredient {
  ingredientTypeId: string
  ingredientTypeName: string
  category: string
  amount: number
  unit: string
  notes?: string
  storeProductId: string
  storeProductName: string
  brand?: string
  price: number
  totalPrice: number
  sources: Array<{ recipeId: string; amount: number }>
}

interface UnmappedIngredient {
  ingredientTypeId: string
  ingredientTypeName: string
  category: string
  amount: number
  unit: string
  notes?: string
  sources: Array<{ recipeId: string; amount: number }>
}

interface CartSummary {
  storeId: string
  storeName: string
  totalMapped: number
  totalUnmapped: number
  estimatedPrice: number
  weekPlanId: string
  weekPlanName: string
}

interface WeekPlanRecipeRow {
  recipe_id: string
  servings: number
}

interface RecipeRow {
  id: string
  servings: number
  ingredients: string
}

export default defineEventHandler(async (event): Promise<GeneratedCartResult> => {
  const body = await readBody(event)
  const { weekPlanId, storeId } = body
  
  validateRequest(body, weekPlanId, storeId)
  
  const weekPlan = await fetchWeekPlan(weekPlanId)
  const store = await fetchStore(storeId)
  const weekPlanIngredients = await fetchWeekPlanIngredients(weekPlanId)
  
  const mappings = await getStoreMappings(storeId)
  const products = await getStoreProducts(storeId)
  const ingredientTypes = await getIngredientTypes()
  
  return buildCartResponse(
    weekPlanIngredients,
    mappings,
    products,
    ingredientTypes,
    weekPlan,
    store
  )
})

function validateRequest(body: Record<string, unknown>, weekPlanId: unknown, storeId: unknown): void {
  if (!weekPlanId || !storeId) {
    throw createError({
      statusCode: 400,
      message: 'weekPlanId and storeId are required'
    })
  }
}

async function fetchWeekPlan(weekPlanId: unknown) {
  const weekPlan = await queryOne(
    'SELECT * FROM week_plans WHERE id = $1',
    [weekPlanId]
  )
  
  if (!weekPlan) {
    throw createError({ statusCode: 404, message: 'Week plan not found' })
  }
  
  return weekPlan as Record<string, unknown>
}

async function fetchStore(storeId: unknown) {
  const store = await queryOne(
    'SELECT * FROM stores WHERE id = $1',
    [storeId]
  )
  
  if (!store) {
    throw createError({ statusCode: 404, message: 'Store not found' })
  }
  
  return store as Record<string, unknown>
}

async function fetchWeekPlanIngredients(weekPlanId: unknown) {
  const planRecipes = await query<WeekPlanRecipeRow>(
    'SELECT recipe_id, servings FROM week_plan_recipes WHERE week_plan_id = $1',
    [weekPlanId]
  )
  
  const ingredientMap = new Map<string, {
    amount: number
    unit: string
    notes?: string
    sources: Array<{ recipeId: string; amount: number }>
  }>()
  
  for (const pr of planRecipes) {
    const recipe = await queryOne<RecipeRow>(
      'SELECT id, servings, ingredients FROM recipes WHERE id = $1',
      [pr.recipe_id]
    )
    
    if (!recipe) continue
    
    const ingredients = typeof recipe.ingredients === 'string'
      ? JSON.parse(recipe.ingredients)
      : recipe.ingredients
    
    const scaleFactor = pr.servings / recipe.servings
    
    for (const ing of ingredients as Array<{
      ingredientTypeId: string
      amount: number
      unit: string
      notes?: string
    }>) {
      const scaledAmount = ing.amount * scaleFactor
      
      if (ingredientMap.has(ing.ingredientTypeId)) {
        const existing = ingredientMap.get(ing.ingredientTypeId)!
        existing.amount += scaledAmount
        existing.sources.push({ recipeId: recipe.id, amount: scaledAmount })
      } else {
        ingredientMap.set(ing.ingredientTypeId, {
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

function buildCartResponse(
  ingredientMap: Map<string, {
    amount: number
    unit: string
    notes?: string
    sources: Array<{ recipeId: string; amount: number }>
  }>,
  mappings: Array<{ ingredient_type_id: string; ingredient_type_name: string; default_unit: string }>,
  products: MappedStoreProduct[],
  ingredientTypes: Array<{ id: string; name: string; category: string }>,
  weekPlan: Record<string, unknown>,
  store: Record<string, unknown>
): GeneratedCartResult {
  const mappedIngredients: MappedIngredient[] = []
  const unmappedIngredients: UnmappedIngredient[] = []
  let totalPrice = 0
  
  for (const [ingredientTypeId, { amount, unit, notes, sources }] of ingredientMap) {
    const ingType = ingredientTypes.find(i => i.id === ingredientTypeId)
    const mapping = mappings.find(m => m.ingredient_type_id === ingredientTypeId)
    
    if (mapping) {
      const product = products.find(p => p.id === mapping.ingredient_type_id)
      
      if (product) {
        const total = calculateIngredientPrice(
          amount,
          unit,
          {
            id: product.id,
            storeId: product.storeId,
            name: product.name,
            brand: product.brand,
            unit: product.unit,
            price: product.price,
            pricePerKg: product.pricePerKg,
            inStock: true,
          }
        )
        
        mappedIngredients.push({
          ingredientTypeId,
          ingredientTypeName: ingType?.name ?? mapping.ingredient_type_name,
          category: ingType?.category ?? '',
          amount,
          unit,
          notes,
          storeProductId: product.id,
          storeProductName: product.name,
          brand: product.brand,
          price: product.price,
          totalPrice: Math.round(total * 100) / 100,
          sources
        })
        
        totalPrice += total
      }
    } else {
      unmappedIngredients.push({
        ingredientTypeId,
        ingredientTypeName: ingType?.name ?? ingredientTypeId,
        category: ingType?.category ?? '',
        amount,
        unit,
        notes,
        sources
      })
    }
  }
  
  return {
    success: true,
    mappedIngredients,
    unmappedIngredients,
    summary: {
      storeId: String(store.id),
      storeName: String(store.name),
      totalMapped: mappedIngredients.length,
      totalUnmapped: unmappedIngredients.length,
      estimatedPrice: Math.round(totalPrice * 100) / 100,
      weekPlanId: String(weekPlan.id),
      weekPlanName: String(weekPlan.name)
    }
  }
}
