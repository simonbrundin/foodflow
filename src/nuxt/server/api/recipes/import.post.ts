import { query } from '~/server/utils/db'
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
    // Parse the recipe from URL
    const parsedRecipe = await parseRecipeFromUrl(url)
    
    // Get all ingredient types for matching
    const ingredientTypes = await query('SELECT * FROM ingredient_types')
    
    // Try to match ingredients
    const matches = await matchIngredientsToTypes(
      parsedRecipe.ingredients,
      ingredientTypes.map((i) => {
        const row = i as Record<string, unknown>
        return {
          id: String(row.id),
          name: String(row.name),
          aliases: row.aliases ? JSON.parse(String(row.aliases)) : [],
          category: String(row.category)
        }
      })
    )
    
    // Count matches
    let matchedCount = 0
    let highConfidenceCount = 0
    
    for (const [, match] of matches) {
      matchedCount++
      if (match.confidence > 0.7) {
        highConfidenceCount++
      }
    }
    
    // Calculate overall confidence
    const matchRate = parsedRecipe.ingredients.length > 0 
      ? matchedCount / parsedRecipe.ingredients.length 
      : 0
    parsedRecipe.confidence = parsedRecipe.confidence * matchRate
    
    // Add warnings for unmatched ingredients
    for (const ing of parsedRecipe.ingredients) {
      if (!matches.has(ing.rawText)) {
        parsedRecipe.warnings.push(`Could not match: ${ing.rawText}`)
      }
    }
    
    return {
      success: true,
      recipe: parsedRecipe,
      matches: {
        total: parsedRecipe.ingredients.length,
        matched: matchedCount,
        highConfidence: highConfidenceCount,
        matchRate: Math.round(matchRate * 100)
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Import failed:', message)
    throw createError({
      statusCode: 500,
      message: `Failed to import recipe: ${message}`
    })
  }
})
