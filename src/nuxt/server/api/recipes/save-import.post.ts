import { execute, query } from '~/server/utils/db'
import { randomUUID } from 'crypto'

interface ImportedIngredient {
  amount?: unknown
  unit?: unknown
  name?: unknown
  notes?: unknown
}

interface ImportedRecipe {
  title?: unknown
  description?: unknown
  imageUrl?: unknown
  prepTime?: unknown
  cookTime?: unknown
  servings?: unknown
  difficulty?: unknown
  sourceUrl?: unknown
  sourceName?: unknown
  ingredients?: ImportedIngredient[]
  instructions?: unknown[]
  tags?: unknown[]
}

interface IngredientMapping {
  ingredientTypeId?: string
  ingredientTypeName?: string
}

interface RawIngredient {
  name?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    recipe?: ImportedRecipe
    ingredientMappings?: Record<string, IngredientMapping>
    rawIngredients?: RawIngredient[]
  }>(event)
  const { recipe, ingredientMappings, rawIngredients } = body

  if (!recipe) {
    throw createError({
      statusCode: 400,
      message: 'Recipe data is required'
    })
  }

  // Get all ingredient types for mapping
  const ingredientTypes = await query('SELECT * FROM ingredient_types')
  const ingredientTypesArr = ingredientTypes as Array<{
    id: string
    name: string
    aliases?: string
    [key: string]: unknown
  }>

  // Transform parsed recipe to database format
  const ingredients = recipe.ingredients?.map((ing, index) => {
    // Validate and sanitize input
    let ingredientTypeId = ''
    const notes = typeof ing.notes === 'string' ? ing.notes : ''

    // Normalize unit - ensure it's a valid unit
    const validUnits = ['g', 'kg', 'ml', 'l', 'st', 'msk', 'tsk', 'krm']
    let unit = typeof ing.unit === 'string' ? ing.unit : 'st'
    if (!validUnits.includes(unit)) {
      // Try to normalize common variants
      const unitMap: Record<string, string> = {
        dl: 'msk', // Note: we don't support dl directly, would need conversion
        gram: 'g',
        kilo: 'kg',
        kilogram: 'kg',
        milliliter: 'ml',
        liter: 'l',
        styck: 'st',
        stycken: 'st',
        matsked: 'msk',
        tesked: 'tsk',
        kryddmått: 'krm'
      }
      unit = unitMap[unit.toLowerCase()] || 'st'
    }

    // Check for explicit mapping
    const rawText = `ing_${index}`
    const mapping = ingredientMappings?.[rawText]

    if (mapping?.ingredientTypeId) {
      // Check if it's a real database ID
      const isRealId = ingredientTypesArr.some(it => it.id === mapping.ingredientTypeId)
      if (isRealId) {
        ingredientTypeId = mapping.ingredientTypeId
      } else if (mapping.ingredientTypeId !== mapping.ingredientTypeName) {
        // It's a name, try to find matching type
        const nameMatch = mapping.ingredientTypeName || mapping.ingredientTypeId
        const found = findMatchingIngredient(nameMatch, ingredientTypesArr)
        if (found) {
          ingredientTypeId = found.id
        }
      }
    }

    // Try to match by ingredient name from parsed data
    if (!ingredientTypeId && typeof ing.name === 'string') {
      const found = findMatchingIngredient(ing.name, ingredientTypesArr)
      if (found) {
        ingredientTypeId = found.id
      }
    }

    // Fallback: try to match from rawIngredients
    if (!ingredientTypeId && rawIngredients?.[index]) {
      const found = findMatchingIngredient(rawIngredients[index].name ?? '', ingredientTypesArr)
      if (found) {
        ingredientTypeId = found.id
      }
    }

    return {
      ingredientTypeId: ingredientTypeId || (typeof ing.name === 'string' ? ing.name : 'unknown'),
      amount: Number(ing.amount) || 1,
      unit: unit,
      notes: notes || undefined
    }
  }) || []

  // Helper function to find matching ingredient type
  function findMatchingIngredient(
    searchName: string,
    types: Array<{ id: string, name: string, aliases?: string }>
  ): { id: string } | null {
    const nameLower = searchName.toLowerCase().trim()

    // Skip if the name looks malformed (contains spaces at start or weird patterns)
    if (!nameLower || nameLower.length < 2) return null

    // Skip if name contains unit prefix like "g ", "dl ", etc (indicates parsing error)
    const unitPrefixes = ['g ', 'kg ', 'ml ', 'l ', 'dl ', 'msk ', 'tsk ', 'krm ', 'st ']
    for (const prefix of unitPrefixes) {
      if (nameLower.startsWith(prefix)) {
        return null // This is likely a parsing error, not a real name
      }
    }

    for (const type of types) {
      const typeNameLower = type.name.toLowerCase()

      // Exact match
      if (nameLower === typeNameLower) {
        return { id: type.id }
      }

      // Contains match
      if (nameLower.includes(typeNameLower) || typeNameLower.includes(nameLower)) {
        return { id: type.id }
      }

      // Check aliases
      if (type.aliases) {
        try {
          const aliases = JSON.parse(type.aliases) as string[]
          for (const alias of aliases) {
            const aliasLower = alias.toLowerCase()
            if (nameLower === aliasLower || nameLower.includes(aliasLower) || aliasLower.includes(nameLower)) {
              return { id: type.id }
            }
          }
        } catch {
          // Invalid JSON in aliases
        }
      }
    }

    return null
  }

  const instructions = (recipe.instructions || [])
    .filter((step): step is string => typeof step === 'string')
    .map(step => step.trim())
    .filter(Boolean)

  const id = randomUUID()
  const now = new Date().toISOString()

  // Save to database
  await execute(`
    INSERT INTO recipes (
      id, title, description, image_url, prep_time, cook_time, servings,
      difficulty, source_url, source_name, ingredients, instructions, tags,
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14)
  `, [
    id,
    recipe.title || 'Untitled',
    recipe.description || '',
    recipe.imageUrl || null,
    recipe.prepTime || 0,
    recipe.cookTime || 0,
    recipe.servings || 4,
    recipe.difficulty || 'medium',
    recipe.sourceUrl || null,
    recipe.sourceName || 'Manual import',
    JSON.stringify(ingredients),
    JSON.stringify(instructions),
    recipe.tags ? JSON.stringify(recipe.tags) : null,
    now
  ])

  return {
    success: true,
    id,
    title: recipe.title || 'Untitled',
    message: 'Recipe imported successfully'
  }
})
