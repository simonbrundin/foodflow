// ============================================
// Server Types
// ============================================
//
// All domain types are defined in shared/types/index.ts.
// This file re-exports them and adds server-only types.
// ============================================

// Re-export all shared domain types
export type {
  RecipeDifficulty,
  MealType,
  CartStatus,
  UnitType,
  IngredientCategory,
  NutritionInfo,
  Unit,
  IngredientType,
  IngredientConversion,
  RecipeIngredient,
  Recipe,
  ParsedIngredient,
  ParsedRecipe,
  Store,
  StoreProduct,
  ProductMapping,
  WeekPlanRecipe,
  WeekPlan,
  ShoppingCartItem,
  ShoppingCart
} from '#shared/types'
