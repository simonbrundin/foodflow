import type { WeekPlan, Recipe, WeekPlanRecipe } from '~/types'

/**
 * Composable for managing the week plan
 * Checks if recipes are in the current week plan
 */
export function useWeekPlan() {
  const { data: weekPlan, refresh } = useFetch<WeekPlan>('/api/week-plan/current')

  /**
   * Check if a recipe is in the current week plan
   */
  function isInWeekPlan(recipeId: string): boolean {
    if (!weekPlan.value?.recipes) return false
    return weekPlan.value.recipes.some(r => r.recipeId === recipeId)
  }

  /**
   * Get week plan entries for a specific recipe
   */
  function getWeekPlanEntries(recipeId: string): WeekPlanRecipe[] {
    if (!weekPlan.value?.recipes) return []
    return weekPlan.value.recipes.filter(r => r.recipeId === recipeId)
  }

  /**
   * Get the total servings for a recipe in the week plan
   */
  function getTotalServings(recipeId: string): number {
    const entries = getWeekPlanEntries(recipeId)
    return entries.reduce((sum, entry) => sum + entry.servings, 0)
  }

  /**
   * Add a recipe to the week plan
   */
  async function addToWeekPlan(
    recipe: Recipe,
    dayOfWeek: number,
    servings: number = recipe.servings,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'dinner'
  ): Promise<boolean> {
    try {
      await $fetch('/api/week-plan/recipes', {
        method: 'POST',
        body: {
          recipeId: recipe.id,
          dayOfWeek,
          servings,
          mealType
        }
      })
      await refresh()
      return true
    } catch (error) {
      console.error('Failed to add recipe to week plan:', error)
      return false
    }
  }

  /**
   * Remove a recipe from the week plan
   */
  async function removeFromWeekPlan(weekPlanRecipeId: string): Promise<boolean> {
    try {
      await $fetch(`/api/week-plan/recipes/${weekPlanRecipeId}`, {
        method: 'DELETE'
      })
      await refresh()
      return true
    } catch (error) {
      console.error('Failed to remove recipe from week plan:', error)
      return false
    }
  }

  return {
    weekPlan: readonly(weekPlan),
    isInWeekPlan,
    getWeekPlanEntries,
    getTotalServings,
    addToWeekPlan,
    removeFromWeekPlan,
    refresh
  }
}
