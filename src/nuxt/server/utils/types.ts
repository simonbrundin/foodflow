// Shared types for the server utils
// Avoids circular imports with app/types

export type RecipeDifficulty = 'easy' | 'medium' | 'hard'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type IngredientCategory = 
  | 'kött' | 'fisk' | 'fågel'
  | 'mejeri' | 'ägg'
  | 'grönsaker' | 'frukt' | 'bär'
  | 'spannmål' | 'pasta' | 'bröd'
  | 'baljväxt' | 'baljväxt' | 'nötter' | 'frön'
  | 'kryddor' | 'örter'
  | 'olja' | 'fett'
  | 'sås' | 'konserver'
  | 'sötsaker' | 'dryck'
  | 'annat'

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
  nutritionInfo?: Record<string, number>
  createdAt: Date
  updatedAt: Date
}

export interface IngredientType {
  id: string
  name: string
  singularName?: string
  pluralName?: string
  category: IngredientCategory
  defaultUnit: string
  aliases?: string[]
  createdAt: Date
}

export interface StoreProduct {
  id: string
  storeId: string
  storeName?: string
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

export interface Store {
  id: string
  name: string
  chainId: string
  address?: string
  location?: { lat: number; lng: number }
  isActive: boolean
  lastScraped?: Date
  createdAt: Date
}

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
  status: 'draft' | 'ready' | 'completed'
  totalPrice: number
  createdAt: Date
  updatedAt: Date
}
