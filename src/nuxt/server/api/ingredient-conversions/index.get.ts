import { query as dbQuery, mapIngredientConversion } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const urlQuery = getQuery(event)
  const ingredientTypeId = urlQuery.ingredientTypeId as string | undefined

  let sql = `
    SELECT ic.*, it.name as ingredient_type_name
    FROM ingredient_conversions ic
    LEFT JOIN ingredient_types it ON it.id = ic.ingredient_type_id
  `

  const params: unknown[] = []

  if (ingredientTypeId) {
    sql += ' WHERE ic.ingredient_type_id = $1'
    params.push(ingredientTypeId)
  }

  sql += ' ORDER BY it.name, ic.unit_from, ic.unit_to'

  const rows = await dbQuery<Record<string, unknown>>(sql, params)

  return rows.map(mapIngredientConversion)
})
