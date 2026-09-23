import { execute, query } from '~/server/utils/db'
import { randomUUID } from 'node:crypto'
import { parseRecipeFromUrl, matchIngredientsToTypes } from '~/server/utils/recipe-parser'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { url } = body
  
  if (!url) {
    throw createError({
      statusCode: 400,
      message: 'URL is required'
    })
  }
  
  try {
    // 1. Parse the recipe from URL
    const parsedRecipe = await parseRecipeFromUrl(url)
    
    // 2. Get all ingredient types for matching
    const ingredientTypes = await query('SELECT * FROM ingredient_types')
    const ingredientTypesList = ingredientTypes.map((i) => {
      const row = i as Record<string, unknown>
      return {
        id: String(row.id),
        name: String(row.name),
        aliases: row.aliases ? JSON.parse(String(row.aliases)) : [],
        category: String(row.category)
      }
    })
    
    // 3. Try to match ingredients
    const matches = await matchIngredientsToTypes(
      parsedRecipe.ingredients,
      ingredientTypesList
    )
    
    // 4. Build ingredients array for database
    const ingredients = parsedRecipe.ingredients.map((ing) => {
      const match = matches.get(ing.rawText)
      return {
        ingredientTypeId: match?.ingredientTypeId || ing.name || 'unknown',
        amount: ing.amount || 1,
        unit: ing.unit || 'st',
        notes: undefined
      }
    })
    
    // 5. Save to database
    const id = randomUUID()
    const now = new Date().toISOString()
    
    await execute(`
      INSERT INTO recipes (
        id, title, description, image_url, prep_time, cook_time, servings, 
        difficulty, source_url, source_name, ingredients, instructions, tags,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14)
    `, [
      id,
      parsedRecipe.title || 'Untitled',
      parsedRecipe.description || '',
      parsedRecipe.imageUrl || null,
      parsedRecipe.prepTime || 0,
      parsedRecipe.cookTime || 0,
      parsedRecipe.servings || 4,
      parsedRecipe.difficulty || 'medium',
      parsedRecipe.sourceUrl || url,
      parsedRecipe.sourceName || 'Imported',
      JSON.stringify(ingredients),
      JSON.stringify(parsedRecipe.instructions || []),
      parsedRecipe.tags ? JSON.stringify(parsedRecipe.tags) : null,
      now
    ])
    
    return {
      success: true,
      id,
      title: parsedRecipe.title || 'Untitled',
      message: 'Recipe imported and saved directly',
      matched: matches.size,
      total: parsedRecipe.ingredients.length
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Quick import failed:', message)
    throw createError({
      statusCode: 500,
      message: `Failed to import recipe: ${message}`
    })
  }
})
