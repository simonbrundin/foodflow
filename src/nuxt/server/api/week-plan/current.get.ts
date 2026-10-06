import { query, queryOne, mapWeekPlan, mapWeekPlanRecipe } from '~/server/utils/db'
import { randomUUID } from 'crypto'

function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7)
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

function getSunday(date: Date): Date {
  const monday = getMonday(date)
  return new Date(monday.getTime() + 6 * 86400000)
}

export default defineEventHandler(async () => {
  const today = new Date()
  // Today at midnight for start
  const startDate = new Date(today)
  startDate.setHours(0, 0, 0, 0)

  // 7 days from startDate (Mon–Sun inclusive)
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 7)

  const weekNumber = getWeekNumber(today)
  const year = today.getFullYear()

  // Try to find existing plan for this week
  let weekPlan = await queryOne(
    'SELECT * FROM week_plans WHERE week_number = $1 AND year = $2',
    [weekNumber, year]
  )

  if (!weekPlan) {
    const id = randomUUID()
    const now = new Date().toISOString()
    const monday = getMonday(today)
    const sunday = getSunday(today)

    await query(
      `INSERT INTO week_plans (id, name, week_number, year, start_date, end_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
      [id, `Vecka ${weekNumber}, ${year}`, weekNumber, year, monday, sunday, now]
    )

    weekPlan = await queryOne('SELECT * FROM week_plans WHERE id = $1', [id])
  }

  if (!weekPlan) {
    throw createError({ statusCode: 500, message: 'Failed to create week plan' })
  }

  const weekPlanRecord = weekPlan as Record<string, unknown>
  const weekPlanId = String(weekPlanRecord.id)

  // Fetch recipes
  const planRecipes = await query(
    `SELECT wpr.*, r.title as recipe_name, r.image_url as recipe_image_url
     FROM week_plan_recipes wpr
     LEFT JOIN recipes r ON wpr.recipe_id = r.id
     WHERE wpr.week_plan_id = $1`,
    [weekPlanId]
  )

  return {
    ...mapWeekPlan(
      weekPlanRecord,
      planRecipes.map(pr => mapWeekPlanRecipe(pr as Record<string, unknown>))
    ),
    // Add rolling 9-day period info
    planStartDate: startDate,
    planEndDate: endDate,
    today: today.toISOString()
  }
})
