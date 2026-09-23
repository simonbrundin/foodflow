import { query } from './db'
import { RECIPE_PARSING_SYSTEM_PROMPT, INGREDIENT_MATCHING_PROMPT } from './prompts'
import { getOpenAIKey } from './settings'

interface OpenAIResponse {
  id: string
  choices: {
    message: {
      content: string
    }
    finish_reason: string
  }[]
}

interface ParsedRecipe {
  title: string
  description?: string
  prepTime?: number
  cookTime?: number
  servings?: number
  ingredients: {
    amount: number
    unit: string
    name: string
    notes?: string
  }[]
  instructions: string[]
  tags?: string[]
}

interface IngredientMatch {
  ingredientTypeId: string
  confidence: number
}

export async function parseRecipeWithAI(text: string, apiKey: string): Promise<ParsedRecipe> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: RECIPE_PARSING_SYSTEM_PROMPT },
        { role: 'user', content: text }
      ],
      temperature: 0.1,
      max_tokens: 2000
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${error}`)
  }

  const data: OpenAIResponse = await response.json()
  const content = data.choices[0]?.message?.content

  if (!content) {
    throw new Error('No response from OpenAI')
  }

  // Extract JSON from response (in case there's any extra text)
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Could not extract JSON from response')
  }

  const parsed = JSON.parse(jsonMatch[0])

  // Normalize units
  if (parsed.ingredients) {
    parsed.ingredients = parsed.ingredients.map((ing: { amount: unknown; unit: string; name?: string }) => ({
      ...ing,
      unit: normalizeUnit(ing.unit || 'st'),
      amount: normalizeAmount(ing.amount)
    }))
  }

  return parsed
}

function normalizeUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    'dl': 'ml',
    'liter': 'l',
    'gram': 'g',
    'kilo': 'kg',
    'kilogram': 'kg',
    'milliliter': 'ml',
    'styck': 'st',
    'stycken': 'st',
    'matsked': 'msk',
    'tesked': 'tsk',
    'kryddmått': 'krm',
    'g': 'g',
    'kg': 'kg',
    'ml': 'ml',
    'l': 'l',
    'st': 'st',
    'msk': 'msk',
    'tsk': 'tsk',
    'krm': 'krm'
  }
  return unitMap[unit.toLowerCase()] || 'st'
}

function normalizeAmount(amount: unknown): number {
  if (typeof amount === 'number') return amount
  if (typeof amount === 'string') {
    // Handle fractions like "1/2", "3/4"
    if (amount.includes('/')) {
      const parts = amount.split('/').map(s => parseFloat(s.trim()))
      const num = parts[0] ?? 0
      const den = parts[1] ?? 1
      return num / den
    }
    return parseFloat(amount.replace(',', '.'))
  }
  return 0
}

// Match parsed ingredients to database ingredient types
export async function matchIngredientsToDatabase(
  ingredients: { amount: number; unit: string; name: string }[],
  apiKey: string
): Promise<IngredientMatch[]> {
  // Get all ingredient types
  const ingredientTypes = await query('SELECT * FROM ingredient_types')
  
  const results: IngredientMatch[] = []
  
  for (const ing of ingredients) {
    const nameLower = ing.name.toLowerCase()
    let match: IngredientMatch | null = null
    
    // Simple exact match first
    for (const it of ingredientTypes as Array<{ id: string; name: string; aliases?: string }>) {
      if (nameLower.includes(it.name.toLowerCase()) || it.name.toLowerCase().includes(nameLower)) {
        match = { ingredientTypeId: it.id, confidence: 0.9 }
        break
      }
      
      // Check aliases
      if (it.aliases) {
        try {
          const aliases = JSON.parse(it.aliases) as string[]
          for (const alias of aliases) {
            if (nameLower.includes(alias.toLowerCase())) {
              match = { ingredientTypeId: it.id, confidence: 0.8 }
              break
            }
          }
        } catch {
          // Invalid JSON, skip
        }
      }
    }
    
    // If no match found, try AI
    if (!match) {
      match = await findBestIngredientMatch(ing.name, ingredientTypes as Array<{ id: string; name: string }>, apiKey)
    }
    
    results.push(match ?? { ingredientTypeId: ing.name, confidence: 0 })
  }
  
  return results
}

async function findBestIngredientMatch(
  ingredientName: string,
  ingredientTypes: Array<{ id: string; name: string }>,
  apiKey: string
): Promise<IngredientMatch | null> {
  const typeList = ingredientTypes.map(it => it.name).join(', ')
  const prompt = INGREDIENT_MATCHING_PROMPT
    .replace('{ingredient}', ingredientName)
    .replace('{typeList}', typeList)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 100
      })
    })

    if (!response.ok) return null

    const data: OpenAIResponse = await response.json()
    const content = data.choices[0]?.message?.content
    
    if (!content) return null

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])
    
    if (parsed.id && parsed.confidence > 0.5) {
      return {
        ingredientTypeId: parsed.id,
        confidence: parsed.confidence
      }
    }
  } catch {
    // AI failed, return null
  }
  
  return null
}
