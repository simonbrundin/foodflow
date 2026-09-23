import { query, queryOne, mapWeekPlan, mapWeekPlanRecipe } from '~/server/utils/db'

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
  const weekNumber = getWeekNumber(today)
  const year = today.getFullYear()
  const startDate = getMonday(today)
  const endDate = getSunday(today)
  
  let weekPlan = await queryOne(
    'SELECT * FROM week_plans WHERE week_number = $1 AND year = $2',
    [weekNumber, year]
  )
  
  if (!weekPlan) {
    const id = `wp_${year}_w${weekNumber}`
    const now = new Date().toISOString()
    
    await query(
      `INSERT INTO week_plans (id, name, week_number, year, start_date, end_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
      [id, `Vecka ${weekNumber}, ${year}`, weekNumber, year, startDate, endDate, now]
    )
    
    return {
      id,
      name: `Vecka ${weekNumber}, ${year}`,
      weekNumber,
      year,
      startDate,
      endDate,
      recipes: [],
      createdAt: now,
      updatedAt: now
    }
  }
  
  const weekPlanRecord = weekPlan as Record<string, unknown>
  const weekPlanId = String(weekPlanRecord.id)
  
  const planRecipes = await query(
    `SELECT wpr.*, r.title as recipe_name, r.image_url as recipe_image_url
     FROM week_plan_recipes wpr
     LEFT JOIN recipes r ON wpr.recipe_id = r.id
     WHERE wpr.week_plan_id = $1`,
    [weekPlanId]
  )
  
  return mapWeekPlan(
    weekPlanRecord,
    planRecipes.map((pr) => mapWeekPlanRecipe(pr as Record<string, unknown>))
  )
})
