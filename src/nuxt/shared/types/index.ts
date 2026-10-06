// ============================================
// Shared domain types — used by both client and server
// ============================================

// --------------------
// Enums / Literals
// --------------------

export type RecipeDifficulty = 'easy' | 'medium' | 'hard'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type CartStatus = 'draft' | 'ready' | 'completed'
export type UnitType = 'weight' | 'volume' | 'count'
export type IngredientUnit = 'g' | 'kg' | 'ml' | 'l' | 'st' | 'msk' | 'tsk' | 'krm'
export type StoreChain = 'ica' | 'willys' | 'coop' | 'hemkop' | 'citygross' | 'netto' | 'lidl'

export type IngredientCategory
  = | 'kött' | 'fisk' | 'fågel'
    | 'mejeri' | 'ägg'
    | 'grönsaker' | 'frukt' | 'bär'
    | 'spannmål' | 'pasta' | 'bröd'
    | 'baljsläkten' | 'baljväxt' | 'nötter' | 'frön'
    | 'kryddor' | 'örter'
    | 'olja' | 'fett'
    | 'sås' | 'konserver'
    | 'sötsaker' | 'dryck'
    | 'annat'

// --------------------
// Nutrition
// --------------------

export interface NutritionInfo {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
}

// --------------------
// Units
// --------------------

export interface Unit {
  id: string
  name: string
  shortName: string
  type: UnitType
  toGramFactor?: number
  toMlFactor?: number
  sortOrder: number
  createdAt: Date
}

// --------------------
// Ingredient Types
// --------------------

export interface IngredientType {
  id: string
  name: string
  singularName?: string
  pluralName?: string
  category: IngredientCategory
  defaultUnitId: string
  aliases?: string[]
  createdAt: Date
}

export interface IngredientConversion {
  id: string
  ingredientTypeId: string
  ingredientTypeName?: string
  unitFrom: string
  unitTo: string
  conversionFactor: number
  notes?: string
  createdAt: Date
}

// --------------------
// Recipes
// --------------------

export interface RecipeIngredient {
  id: string
  recipeId: string
  ingredientTypeId: string
  ingredientTypeName?: string
  amount: number
  unitId: string
  defaultUnitId?: string
  notes?: string
  isOptional?: boolean
}

export interface Recipe {
  id: string
  title: string
  description: string
  imageUrl?: string
  prepTime: number
  cookTime: number
  servings: number
  difficulty: RecipeDifficulty
  rating?: number
  sourceUrl?: string
  sourceName?: string
  ingredients: RecipeIngredient[]
  instructions: string[]
  tags: string[]
  nutritionInfo?: NutritionInfo
  createdAt: Date
  updatedAt: Date
}

// Parsed from external source (recipe parser / AI)
export interface ParsedIngredient {
  rawText?: string
  amount?: number
  unit?: string
  name?: string
  notes?: string
}

export interface ParsedRecipe {
  title: string
  description?: string
  imageUrl?: string
  prepTime?: number
  cookTime?: number
  totalTime?: number
  servings?: number
  difficulty?: RecipeDifficulty
  ingredients: ParsedIngredient[]
  instructions: string[]
  tags?: string[]
  nutrition?: Record<string, number>
  sourceUrl: string
  sourceName: string
  confidence: number
  warnings?: string[]
}

export interface ImportIngredientMapping {
  rawText: string
  ingredientTypeId?: string
  ingredientTypeName?: string
  amount: number
  unit: string
  mappedBy: 'auto' | 'manual'
  confidence: number
}

// --------------------
// Stores
// --------------------

export interface Store {
  id: string
  name: string
  chainId: StoreChain
  address?: string
  location?: { lat: number, lng: number }
  isActive: boolean
  lastScraped?: Date
  createdAt: Date
}

export interface StoreChainConfig {
  id: StoreChain
  name: string
  logo: string
  baseUrl: string
  searchUrlTemplate: string
  color: string
}

export interface StoreProduct {
  id: string
  storeId: string
  storeName?: string
  externalId?: string
  name: string
  brand?: string
  category?: string
  price: number
  originalPrice?: number
  unit: string
  pricePerKg: number
  pricePerLiter?: number
  imageUrl?: string
  productUrl?: string
  inStock: boolean
  isAvailable: boolean
  lastUpdated: Date
}

// --------------------
// Product Mappings
// --------------------

export interface ProductMapping {
  id: string
  ingredientTypeId: string
  ingredientTypeName?: string
  storeId: string
  storeName?: string
  storeProductId: string
  storeProductName?: string
  isDefault: boolean
  priority: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// --------------------
// Week Plans
// --------------------

export interface WeekPlanRecipe {
  id: string
  weekPlanId: string
  recipeId: string
  recipeName?: string
  recipeImageUrl?: string
  servings: number
  dayOfWeek?: number
  mealType?: MealType
  person?: string
  notes?: string
}

export interface WeekPlan {
  id: string
  name: string
  weekNumber: number
  year: number
  startDate: Date
  endDate: Date
  recipes: WeekPlanRecipe[]
  createdAt: Date
  updatedAt: Date
}

// --------------------
// Shopping Cart
// --------------------

export interface ShoppingCartItem {
  id: string
  cartId: string
  ingredientTypeId: string
  ingredientTypeName: string
  storeProductId: string
  storeProductName: string
  brand?: string
  quantity: number
  unit: string
  pricePerUnit: number
  totalPrice: number
  isResolved: boolean
  isOptional: boolean
  notes?: string
}

export interface ShoppingCart {
  id: string
  weekPlanId?: string
  storeId: string
  storeName?: string
  items: ShoppingCartItem[]
  status: CartStatus
  totalPrice: number
  createdAt: Date
  updatedAt: Date
}

// --------------------
// API Response wrappers (client only)
// --------------------

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
