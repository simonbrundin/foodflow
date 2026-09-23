import { execute, query } from '~/server/utils/db'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { recipe, ingredientMappings, rawIngredients } = body
  
  if (!recipe) {
    throw createError({
      statusCode: 400,
      message: 'Recipe data is required'
    })
  }
  
  // Get all ingredient types for mapping
  const ingredientTypes = await query('SELECT * FROM ingredient_types')
  
  // Transform parsed recipe to database format
  const ingredients = recipe.ingredients?.map((ing: any, index: number) => {
    // Check for mapping
    const rawText = `ing_${index}`
    const mapping = ingredientMappings?.[rawText]
    
    let ingredientTypeId = ''
    let notes = ing.notes
    
    if (mapping?.ingredientTypeId) {
      // Check if it's a real ID
      const isRealId = (ingredientTypes as any[]).some(it => it.id === mapping.ingredientTypeId)
      if (isRealId) {
        ingredientTypeId = mapping.ingredientTypeId
      }
    }
    
    // If we have rawIngredients, try to match
    if (!ingredientTypeId && rawIngredients?.[index]) {
      const rawName = (rawIngredients[index].name || '').toLowerCase()
      const found = (ingredientTypes as any[]).find(it => 
        rawName.includes(it.name.toLowerCase()) || 
        it.name.toLowerCase().includes(rawName)
      )
      if (found) {
        ingredientTypeId = found.id
      }
    }
    
    return {
      ingredientTypeId: ingredientTypeId || ing.name || 'unknown',
      amount: ing.amount || 1,
      unit: ing.unit || 'st',
      notes: notes || undefined
    }
  }) || []
  
  const instructions = (recipe.instructions || []).map((step: string) => step.trim()).filter(Boolean)
  
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
