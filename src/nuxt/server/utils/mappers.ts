import type {
  Recipe,
  RecipeIngredient,
  Store,
  StoreProduct,
  WeekPlan,
  WeekPlanRecipe,
  ShoppingCart,
  ShoppingCartItem,
  IngredientType,
  ProductMapping,
  IngredientConversion,
  Unit
} from './types'

// ============================================
// JSON field parser helper
// ============================================

export function parseJsonField<T>(field: unknown): T {
  if (typeof field === 'string') {
    return JSON.parse(field) as T
  }
  return field as T
}

// ============================================
// Private helpers
// ============================================

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

// ============================================
// Ingredient & Recipe Mappers
// ============================================

export function mapRecipeIngredients(ingredients: unknown[]): RecipeIngredient[] {
  return ingredients.map((ingredient) => {
    const rawIngredient = isRecord(ingredient) ? ingredient : {}
    const amount = Number(rawIngredient.amount)

    return {
      id: String(rawIngredient.id ?? ''),
      recipeId: String(rawIngredient.recipeId ?? ''),
      ingredientTypeId: String(rawIngredient.ingredientTypeId ?? ''),
      ingredientTypeName: asOptionalString(rawIngredient.ingredientTypeName),
      amount: Number.isFinite(amount) ? amount : 1,
      unitId: String(rawIngredient.unitId ?? rawIngredient.unit ?? 'st'),
      defaultUnitId: asOptionalString(rawIngredient.defaultUnitId),
      notes: asOptionalString(rawIngredient.notes),
      isOptional: typeof rawIngredient.isOptional === 'boolean'
        ? rawIngredient.isOptional
        : undefined
    }
  })
}

export function mapRecipe(row: Record<string, unknown>): Recipe {
  const ingredientsRaw = parseJsonField<unknown[]>(row.ingredients)

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
    ingredients: mapRecipeIngredients(ingredientsRaw),
    instructions: parseJsonField<string[]>(row.instructions),
    rating: row.rating !== null && row.rating !== undefined ? Number(row.rating) : undefined,
    tags: parseJsonField<string[]>(row.tags ?? []),
    nutritionInfo: parseJsonField<Recipe['nutritionInfo']>(row.nutrition_info),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at))
  }
}

// ============================================
// Store Mappers
// ============================================

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
    createdAt: new Date(String(row.created_at))
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
    lastUpdated: row.last_updated ? new Date(String(row.last_updated)) : new Date()
  }
}

// ============================================
// Week Plan Mappers
// ============================================

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
    updatedAt: new Date(String(row.updated_at))
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
    person: row.person ? String(row.person) : undefined,
    notes: row.notes ? String(row.notes) : undefined
  }
}

// ============================================
// Ingredient Type Mappers
// ============================================

export function mapIngredientType(row: Record<string, unknown>): IngredientType {
  return {
    id: String(row.id),
    name: String(row.name),
    singularName: row.singular_name ? String(row.singular_name) : undefined,
    pluralName: row.plural_name ? String(row.plural_name) : undefined,
    category: String(row.category) as IngredientType['category'],
    defaultUnitId: row.default_unit_id ? String(row.default_unit_id) : 'st',
    aliases: row.aliases ? parseJsonField<string[]>(row.aliases) : undefined,
    createdAt: new Date(String(row.created_at))
  }
}

// ============================================
// Unit Mappers
// ============================================

export function mapUnit(row: Record<string, unknown>): Unit {
  return {
    id: String(row.id),
    name: String(row.name),
    shortName: String(row.short_name),
    type: String(row.type) as Unit['type'],
    toGramFactor: row.to_gram_factor ? Number(row.to_gram_factor) : undefined,
    toMlFactor: row.to_ml_factor ? Number(row.to_ml_factor) : undefined,
    sortOrder: Number(row.sort_order || 0),
    createdAt: new Date(String(row.created_at))
  }
}

// ============================================
// Conversion Mappers
// ============================================

export function mapIngredientConversion(row: Record<string, unknown>): IngredientConversion {
  return {
    id: String(row.id),
    ingredientTypeId: String(row.ingredient_type_id),
    ingredientTypeName: row.ingredient_type_name ? String(row.ingredient_type_name) : undefined,
    unitFrom: String(row.unit_from),
    unitTo: String(row.unit_to),
    conversionFactor: Number(row.conversion_factor),
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: new Date(String(row.created_at))
  }
}

// ============================================
// Product Mapping Mappers
// ============================================

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
    updatedAt: new Date(String(row.updated_at))
  }
}

// ============================================
// Shopping Cart Mappers
// ============================================

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
    notes: row.notes ? String(row.notes) : undefined
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
    updatedAt: new Date(String(row.updated_at))
  }
}
