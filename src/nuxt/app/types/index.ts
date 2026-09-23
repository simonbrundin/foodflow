// ============================================
// Foodflow - TypeScript Interfaces
// ============================================

// --------------------
// Ingredient Types
// --------------------

export type IngredientCategory = 
  | 'kött' | 'fisk' | 'fågel'
  | 'mejeri' | 'ägg'
  | 'grönsaker' | 'frukt' | 'bär'
  | 'spannmål' | 'pasta' | 'bröd'
  | 'baljväxter' | 'nötter' | 'frön'
  | 'kryddor' | 'örter'
  | 'olja' | 'fett'
  | 'sås' | 'konserver'
  | 'sötsaker' | 'dryck'
  | 'annat'

export type IngredientUnit = 'g' | 'kg' | 'ml' | 'l' | 'st' | 'msk' | 'tsk' | 'krm'

export interface IngredientType {
  id: string
  name: string
  singularName?: string
  pluralName?: string
  category: IngredientCategory
  defaultUnit: IngredientUnit
  aliases?: string[]
  createdAt: Date
}

// --------------------
// Recipe Types
// --------------------

export type RecipeDifficulty = 'easy' | 'medium' | 'hard'

export interface NutritionInfo {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
}

export interface RecipeIngredient {
  id: string
  recipeId: string
  ingredientTypeId: string
  ingredientTypeName?: string
  amount: number
  unit: string
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
  sourceUrl?: string
  sourceName?: string
  ingredients: RecipeIngredient[]
  instructions: string[]
  tags: string[]
  nutritionInfo?: NutritionInfo
  createdAt: Date
  updatedAt: Date
}

// --------------------
// Store Types
// --------------------

export type StoreChain = 'ica' | 'willys' | 'coop' | 'hemkop' | 'citygross' | 'netto' | 'lidl'

export interface StoreChainConfig {
  id: StoreChain
  name: string
  logo: string
  baseUrl: string
  searchUrlTemplate: string
  color: string
}

export interface Store {
  id: string
  name: string
  chainId: StoreChain
  address?: string
  location?: {
    lat: number
    lng: number
  }
  isActive: boolean
  lastScraped?: Date
  createdAt: Date
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
// Product Mapping Types
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
// Week Plan Types
// --------------------

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface WeekPlanRecipe {
  id: string
  weekPlanId: string
  recipeId: string
  recipeName?: string
  recipeImageUrl?: string
  servings: number
  dayOfWeek?: number
  mealType?: MealType
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
// Shopping Cart Types
// --------------------

export type CartStatus = 'draft' | 'ready' | 'completed'

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
// Recipe Import Types
// --------------------

export interface ParsedIngredient {
  rawText: string
  amount?: number
  unit?: string
  name?: string
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
// API Response Types
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

// --------------------
// Store State Types
// --------------------

export interface RecipeFilters {
  search?: string
  difficulty?: RecipeDifficulty[]
  tags?: string[]
  maxTime?: number
  ingredientTypes?: string[]
  excludeIngredientTypes?: string[]
}

export interface WeekPlanFilters {
  weekNumber?: number
  year?: number
}
