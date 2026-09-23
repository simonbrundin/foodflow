// Recipe parser for extracting recipes from external URLs
import type { RecipeDifficulty } from './types'

export interface ParsedIngredient {
  rawText: string
  amount?: number
  unit?: string
  name?: string
}

export interface ParsedRecipe {
  title: string
  description?: string
  imageUrl?: string
  prepTime?: number
  cookTime?: number
  totalTime?: number
  servings?: number
  difficulty?: RecipeDifficulty
  ingredients: ParsedIngredient[]
  instructions: string[]
  tags?: string[]
  sourceUrl: string
  sourceName: string
  confidence: number
  warnings: string[]
}

// ============================================
// Duration Parsing
// ============================================

function parseDuration(iso: string): number {
  if (!iso) return 0
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  return hours * 60 + minutes
}

// ============================================
// Ingredient Parsing
// ============================================

const UNIT_MAP: Record<string, string> = {
  'kilo': 'kg',
  'kilogram': 'kg',
  'gram': 'g',
  'milliliter': 'ml',
  'liter': 'l',
  'styck': 'st',
  'stycken': 'st',
  'matsked': 'msk',
  'matskedar': 'msk',
  'tesked': 'tsk',
  'teskedar': 'tsk',
  'kryddmått': 'krm'
}

const UNIT_PATTERN = /\b(\d+)\s*(kg|g|ml|l|st|msk|tsk|krm|kilo|gram|milliliter|liter|styck|stycken|matsked|matskedar|tesked|teskedar|kryddmått)\b/i

function parseIngredientText(text: string): ParsedIngredient {
  const result: ParsedIngredient = { rawText: text }
  
  // Match amount (including fractions)
  const amountMatch = text.match(/^([\d.,]+(?:\s*\/\s*[\d.,]+)?)\s*/)
  if (amountMatch && amountMatch[1]) {
    result.amount = parseFraction(amountMatch[1].trim())
    result.name = text.slice(amountMatch[0].length).trim()
  } else {
    result.name = text.trim()
  }
  
  // Extract unit
  const unitMatch = result.name?.match(UNIT_PATTERN)
  if (unitMatch && unitMatch[2]) {
    result.unit = UNIT_MAP[unitMatch[2].toLowerCase()] || unitMatch[2].toLowerCase()
    result.name = result.name?.replace(unitMatch[0], '').trim()
  }
  
  return result
}

function parseFraction(str: string): number {
  if (str.includes('/')) {
    const parts = str.split('/').map(s => parseFloat(s.trim()))
    const num = parts[0] ?? 0
    const den = parts[1] ?? 1
    return num / den
  }
  return parseFloat(str.replace(',', '.'))
}

// ============================================
// JSON-LD Extraction
// ============================================

function extractJsonLd(html: string): unknown[] {
  const results: unknown[] = []
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match
  
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const jsonContent = match[1]
      if (jsonContent) {
        const data = JSON.parse(jsonContent)
        if (Array.isArray(data)) {
          results.push(...data)
        } else {
          results.push(data)
        }
      }
    } catch {
      // Invalid JSON, skip
    }
  }
  
  return results
}

function findRecipeInJsonLd(jsonLd: unknown[]): unknown | null {
  for (const item of jsonLd) {
    const record = item as Record<string, unknown>
    if (record['@type'] === 'Recipe') {
      return item
    }
    if (Array.isArray(record['@graph'])) {
      for (const graphItem of record['@graph'] as unknown[]) {
        const graphRecord = graphItem as Record<string, unknown>
        if (graphRecord['@type'] === 'Recipe') {
          return graphItem
        }
      }
    }
  }
  return null
}

// ============================================
// Recipe Parsing
// ============================================

function parseJsonLdRecipe(jsonLd: unknown, sourceUrl: string, sourceName: string): ParsedRecipe {
  const data = jsonLd as Record<string, unknown>
  const recipe: ParsedRecipe = {
    title: (data.name as string) || 'Untitled Recipe',
    description: data.description as string || '',
    imageUrl: extractImageUrl(data.image),
    prepTime: parseDuration(data.prepTime as string || ''),
    cookTime: parseDuration(data.cookTime as string || ''),
    totalTime: parseDuration(data.totalTime as string || ''),
    servings: parseInt(data.recipeYield as string) || 4,
    ingredients: (data.recipeIngredient as string[] || []).map(parseIngredientText),
    instructions: [],
    sourceUrl,
    sourceName,
    confidence: 0.9,
    warnings: []
  }
  
  // Parse instructions
  if (data.recipeInstructions) {
    recipe.instructions = parseInstructions(data.recipeInstructions)
  }
  
  // Extract tags/categories
  const categories = (data.recipeCategory || data.recipeCuisine) as string[] | string || []
  recipe.tags = Array.isArray(categories) ? categories : [categories]
  
  return recipe
}

function extractImageUrl(image: unknown): string | undefined {
  if (Array.isArray(image)) {
    return image[0] as string
  }
  if (typeof image === 'string') {
    return image
  }
  if (typeof image === 'object' && image !== null) {
    const imgObj = image as Record<string, unknown>
    return imgObj.url as string | undefined
  }
  return undefined
}

function parseInstructions(instructions: unknown): string[] {
  const result: string[] = []
  
  if (Array.isArray(instructions)) {
    for (const step of instructions) {
      if (typeof step === 'string') {
        result.push(step)
      } else if (typeof step === 'object' && step !== null) {
        const stepObj = step as Record<string, unknown>
        if (stepObj['@type'] === 'HowToSection') {
          // Handle sections
          const itemList = stepObj.itemListElement as unknown[] || []
          for (const subStep of itemList) {
            if (typeof subStep === 'string') {
              result.push(subStep)
            } else if (typeof subStep === 'object' && subStep !== null) {
              const subObj = subStep as Record<string, unknown>
              if (subObj.text) {
                result.push(subObj.text as string)
              }
            }
          }
        } else if (stepObj.text) {
          result.push(stepObj.text as string)
        }
      }
    }
  } else if (typeof instructions === 'string') {
    result.push(instructions)
  }
  
  return result
}

// ============================================
// Source Detection
// ============================================

const KNOWN_SOURCES: Record<string, string> = {
  'hellofresh': 'Hello Fresh',
  'hellofresh.se': 'Hello Fresh',
  'hellofresh.com': 'Hello Fresh',
  'koket': 'Koket',
  'koket.se': 'Koket',
  'ica': 'ICA',
  'ica.se': 'ICA',
  'recept': 'Recept.se',
  'recept.se': 'Recept.se',
  'coop': 'Coop',
  'coop.se': 'Coop',
  'midt': 'Middag',
  'tant': 'Tant',
  'allas': 'Allas'
}

function detectSource(url: string): { name: string; confidence: number } {
  const host = new URL(url).hostname.toLowerCase()
  
  for (const [key, sourceName] of Object.entries(KNOWN_SOURCES)) {
    if (host.includes(key)) {
      return { name: sourceName, confidence: 0.9 }
    }
  }
  
  return { name: host, confidence: 0.5 }
}

// ============================================
// Main Parse Function
// ============================================

export async function parseRecipeFromUrl(url: string): Promise<ParsedRecipe> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Foodflow/1.0)',
      'Accept': 'text/html,application/xhtml+xml'
    }
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch recipe: ${response.status}`)
  }
  
  const html = await response.text()
  const { name: sourceName } = detectSource(url)
  
  // Extract JSON-LD data
  const jsonLd = extractJsonLd(html)
  const recipeJson = findRecipeInJsonLd(jsonLd)
  
  if (recipeJson) {
    return parseJsonLdRecipe(recipeJson, url, sourceName)
  }
  
  // Fallback: try to extract from meta tags or common patterns
  return parseFallbackRecipe(html, url, sourceName)
}

function parseFallbackRecipe(html: string, url: string, sourceName: string): ParsedRecipe {
  // Try to extract title
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || 
                     html.match(/<title>([^<]+)<\/title>/i)
  const title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : 'Untitled Recipe'
  
  // Try to extract image
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
  const imageUrl = ogImageMatch ? ogImageMatch[1] : undefined
  
  return {
    title,
    imageUrl,
    ingredients: [],
    instructions: [],
    sourceUrl: url,
    sourceName,
    confidence: 0.3,
    warnings: ['Could not find JSON-LD recipe data', 'Used fallback extraction']
  }
}

// ============================================
// Ingredient Matching
// ============================================

export interface IngredientTypeMatch {
  id: string
  name: string
  aliases?: string[]
  category: string
}

export async function matchIngredientsToTypes(
  ingredients: ParsedIngredient[],
  ingredientTypes: IngredientTypeMatch[]
): Promise<Map<string, { ingredientTypeId: string; confidence: number }>> {
  const matches = new Map<string, { ingredientTypeId: string; confidence: number }>()
  
  for (const ing of ingredients) {
    if (!ing.name) continue
    
    const nameLower = ing.name.toLowerCase()
    let bestMatch: { id: string; confidence: number } | null = null
    
    for (const it of ingredientTypes) {
      const itNameLower = it.name.toLowerCase()
      let confidence = 0
      
      // Exact match
      if (nameLower === itNameLower) {
        confidence = 1.0
      }
      // Contains match
      else if (nameLower.includes(itNameLower) || itNameLower.includes(nameLower)) {
        confidence = 0.8
      }
      // Alias match
      else if (it.aliases) {
        for (const alias of it.aliases) {
          const aliasLower = alias.toLowerCase()
          if (nameLower === aliasLower) {
            confidence = 0.9
            break
          }
          if (nameLower.includes(aliasLower) || aliasLower.includes(nameLower)) {
            confidence = 0.7
          }
        }
      }
      
      if (confidence > (bestMatch?.confidence || 0)) {
        bestMatch = { id: it.id, confidence }
      }
    }
    
    if (bestMatch && bestMatch.confidence > 0.5) {
      matches.set(ing.rawText, { ingredientTypeId: bestMatch.id, confidence: bestMatch.confidence })
    }
  }
  
  return matches
}
