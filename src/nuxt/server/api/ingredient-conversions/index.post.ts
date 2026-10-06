import { execute, queryOne } from '~/server/utils/db'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { ingredientTypeId, unitFrom, unitTo, conversionFactor, notes } = body

  if (!ingredientTypeId || !unitFrom || !unitTo || conversionFactor === undefined) {
    throw createError({
      statusCode: 400,
      message: 'ingredientTypeId, unitFrom, unitTo, and conversionFactor are required'
    })
  }

  // Validate units
  const validUnits = ['dl', 'msk', 'tsk', 'krm', 'g', 'kg', 'ml', 'l', 'st']
  if (!validUnits.includes(unitFrom) || !validUnits.includes(unitTo)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid unit. Valid units: dl, msk, tsk, krm, g, kg, ml, l, st'
    })
  }

  // Check if ingredient type exists
  const ingredientType = await queryOne(
    'SELECT id FROM ingredient_types WHERE id = $1',
    [ingredientTypeId]
  )

  if (!ingredientType) {
    throw createError({
      statusCode: 404,
      message: 'Ingredient type not found'
    })
  }

  // Check for existing conversion
  const existing = await queryOne(
    `SELECT id FROM ingredient_conversions 
     WHERE ingredient_type_id = $1 AND unit_from = $2 AND unit_to = $3`,
    [ingredientTypeId, unitFrom, unitTo]
  )

  if (existing) {
    throw createError({
      statusCode: 409,
      message: 'Conversion already exists for this ingredient and units'
    })
  }

  const id = randomUUID()
  const now = new Date().toISOString()

  await execute(`
    INSERT INTO ingredient_conversions (
      id, ingredient_type_id, unit_from, unit_to, conversion_factor, notes, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [id, ingredientTypeId, unitFrom, unitTo, conversionFactor, notes || null, now])

  return {
    success: true,
    id,
    message: 'Conversion created successfully'
  }
})
