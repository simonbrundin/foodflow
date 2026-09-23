import { query, execute } from '~/server/utils/db'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Support both old format (weekPlanId required) and new format (auto-get current week)
  const { weekPlanId: bodyWeekPlanId, recipeId, servings = 4, dayOfWeek, mealType, notes } = body
  let weekPlanId = bodyWeekPlanId

  // If no weekPlanId provided, get the current week plan
  if (!weekPlanId) {
    const currentWeek = await query(
      `SELECT id FROM week_plans
       WHERE is_current = true OR week_number = date_part('week', CURRENT_DATE)
       ORDER BY is_current DESC NULLS LAST
       LIMIT 1`
    )

    if (!currentWeek.length) {
      throw createError({
        statusCode: 404,
        message: 'No current week plan found. Please create one first.'
      })
    }

    weekPlanId = (currentWeek[0] as Record<string, unknown>).id as string
  }

  if (!recipeId) {
    throw createError({
      statusCode: 400,
      message: 'recipeId is required'
    })
  }

  const id = randomUUID()

  await execute(
    `INSERT INTO week_plan_recipes (id, week_plan_id, recipe_id, servings, day_of_week, meal_type, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, weekPlanId, recipeId, servings, dayOfWeek ?? null, mealType ?? null, notes ?? null]
  )

  return {
    id,
    weekPlanId,
    recipeId,
    servings,
    dayOfWeek,
    mealType,
    notes,
    message: 'Recipe added to week plan'
  }
})
