import { query, mapRecipe } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const queryParams = getQuery(event)
  
  const limit = Number(queryParams.limit) || 50
  const offset = Number(queryParams.offset) || 0
  const search = queryParams.search as string | undefined
  const difficulty = queryParams.difficulty as string | undefined
  const tagsParam = queryParams.tags as string | undefined
  
  let sql = 'SELECT * FROM recipes WHERE 1=1'
  const params: unknown[] = []
  let paramIndex = 1
  
  if (search) {
    sql += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`
    params.push(`%${search}%`)
    paramIndex++
  }
  
  if (difficulty) {
    sql += ` AND difficulty = $${paramIndex}`
    params.push(difficulty)
    paramIndex++
  }
  
  sql += ' ORDER BY created_at DESC'
  sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
  params.push(limit, offset)
  
  const recipes = await query(sql, params)
  
  return recipes.map((r) => mapRecipe(r as Record<string, unknown>))
})
