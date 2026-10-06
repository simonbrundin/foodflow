// ============================================
// Foodflow - Client Types
// ============================================
//
// All domain types are defined in shared/types/index.ts.
// This file re-exports them and adds client-only types.
// ============================================

// Re-export all shared domain types (both types and interfaces)
export type {
  RecipeDifficulty,
  MealType,
  CartStatus,
  UnitType,
  IngredientUnit,
  StoreChain,
  IngredientCategory,
  NutritionInfo,
  Unit,
  IngredientType,
  IngredientConversion,
  RecipeIngredient,
  Recipe,
  ParsedIngredient,
  ParsedRecipe,
  ImportIngredientMapping,
  Store,
  StoreChainConfig,
  StoreProduct,
  ProductMapping,
  WeekPlanRecipe,
  WeekPlan,
  ShoppingCartItem,
  ShoppingCart,
  ApiResponse,
  PaginatedResponse
} from '#shared/types'

// --------------------
// Client-only types
// --------------------

export interface RecipeFilters {
  search?: string
  difficulty?: RecipeDifficulty
  maxTime?: number
  tags?: string[]
}

export interface WeekPlanFilters {
  weekNumber?: number
  year?: number
  storeId?: string
}
