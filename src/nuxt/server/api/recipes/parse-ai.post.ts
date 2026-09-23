import { parseRecipeWithAI, matchIngredientsToDatabase } from '~/server/utils/ai-parser'
import { getOpenAIKey } from '~/server/utils/settings'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { text } = body
  
  if (!text) {
    throw createError({
      statusCode: 400,
      message: 'Recipe text is required'
    })
  }
  
  // Get OpenAI API key from database (falls back to env)
  const apiKey = await getOpenAIKey()
  
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      message: 'OpenAI API key inte konfigurerad. Gå till Inställningar för att lägga till din nyckel.'
    })
  }
  
  try {
    // Parse with AI
    const parsed = await parseRecipeWithAI(text, apiKey)
    
    // Match ingredients to database
    const matches = await matchIngredientsToDatabase(parsed.ingredients || [], apiKey)
    
    // Calculate match statistics
    let matchedCount = 0
    let highConfidenceCount = 0
    
    for (const match of matches) {
      if (match.confidence > 0) {
        matchedCount++
        if (match.confidence > 0.7) {
          highConfidenceCount++
        }
      }
    }
    
    return {
      success: true,
      recipe: parsed,
      matches: {
        total: parsed.ingredients?.length || 0,
        matched: matchedCount,
        highConfidence: highConfidenceCount,
        matchRate: parsed.ingredients?.length 
          ? Math.round((matchedCount / parsed.ingredients.length) * 100) 
          : 0
      },
      ingredientMatches: matches
    }
  } catch (error: any) {
    console.error('AI parsing failed:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'AI parsing failed'
    })
  }
})
