import { query, mapUnit } from '~/server/utils/db'

export default defineEventHandler(async () => {
  const rows = await query<Record<string, unknown>>(`
    SELECT * FROM units ORDER BY sort_order, name
  `)

  return rows.map(mapUnit)
})
