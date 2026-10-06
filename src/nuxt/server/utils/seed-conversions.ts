import { execute, query } from './db'
import { randomUUID } from 'crypto'

interface ConversionData {
  ingredientName: string
  unitFrom: string
  unitTo: string
  factor: number
  notes?: string
}

// Common Swedish ingredient conversions (volume to weight)
// Based on typical densities found in Swedish cooking
const CONVERSION_DATA: ConversionData[] = [
  // Flour & Starch
  { ingredientName: 'vetemjöl', unitFrom: 'dl', unitTo: 'g', factor: 65, notes: 'struken' },
  { ingredientName: 'vetemjöl', unitFrom: 'msk', unitTo: 'g', factor: 10, notes: 'struken' },
  { ingredientName: 'rismjöl', unitFrom: 'dl', unitTo: 'g', factor: 70 },
  { ingredientName: 'mandelmjöl', unitFrom: 'dl', unitTo: 'g', factor: 40 },
  { ingredientName: 'potatismjöl', unitFrom: 'dl', unitTo: 'g', factor: 80 },
  { ingredientName: 'maizena', unitFrom: 'msk', unitTo: 'g', factor: 10 },

  // Sugar
  { ingredientName: 'strösocker', unitFrom: 'dl', unitTo: 'g', factor: 85 },
  { ingredientName: 'strösocker', unitFrom: 'msk', unitTo: 'g', factor: 13 },
  { ingredientName: 'farinsocker', unitFrom: 'dl', unitTo: 'g', factor: 70 },
  { ingredientName: 'muscovadosocker', unitFrom: 'dl', unitTo: 'g', factor: 75 },
  { ingredientName: 'socker', unitFrom: 'dl', unitTo: 'g', factor: 85 },
  { ingredientName: 'socker', unitFrom: 'msk', unitTo: 'g', factor: 13 },
  { ingredientName: 'florsocker', unitFrom: 'dl', unitTo: 'g', factor: 60 },
  { ingredientName: 'honung', unitFrom: 'dl', unitTo: 'g', factor: 140 },
  { ingredientName: 'honung', unitFrom: 'msk', unitTo: 'g', factor: 21 },

  // Grains & Flakes
  { ingredientName: 'havregryn', unitFrom: 'dl', unitTo: 'g', factor: 35 },
  { ingredientName: 'havregryn', unitFrom: 'msk', unitTo: 'g', factor: 5 },
  { ingredientName: 'cornflakes', unitFrom: 'dl', unitTo: 'g', factor: 30 },
  { ingredientName: 'vetegryn', unitFrom: 'dl', unitTo: 'g', factor: 70 },
  { ingredientName: 'bulgur', unitFrom: 'dl', unitTo: 'g', factor: 75 },
  { ingredientName: 'couscous', unitFrom: 'dl', unitTo: 'g', factor: 75 },
  { ingredientName: 'quinoa', unitFrom: 'dl', unitTo: 'g', factor: 75 },
  { ingredientName: 'ris', unitFrom: 'dl', unitTo: 'g', factor: 85 },

  // Liquids
  { ingredientName: 'vatten', unitFrom: 'dl', unitTo: 'g', factor: 100 },
  { ingredientName: 'mjölk', unitFrom: 'dl', unitTo: 'g', factor: 103 },
  { ingredientName: 'grädde', unitFrom: 'dl', unitTo: 'g', factor: 100 },
  { ingredientName: 'vispgrädde', unitFrom: 'dl', unitTo: 'g', factor: 100 },
  { ingredientName: 'keso', unitFrom: 'dl', unitTo: 'g', factor: 100 },
  { ingredientName: 'yoghurt', unitFrom: 'dl', unitTo: 'g', factor: 100 },
  { ingredientName: 'olivolja', unitFrom: 'dl', unitTo: 'g', factor: 90 },
  { ingredientName: 'olivolja', unitFrom: 'msk', unitTo: 'g', factor: 14 },
  { ingredientName: 'rapsolja', unitFrom: 'dl', unitTo: 'g', factor: 90 },
  { ingredientName: 'smör', unitFrom: 'dl', unitTo: 'g', factor: 95 },
  { ingredientName: 'smör', unitFrom: 'msk', unitTo: 'g', factor: 14 },

  // Nuts & Seeds
  { ingredientName: 'hasselnötter', unitFrom: 'dl', unitTo: 'g', factor: 45 },
  { ingredientName: 'valnötter', unitFrom: 'dl', unitTo: 'g', factor: 40 },
  { ingredientName: 'mandlar', unitFrom: 'dl', unitTo: 'g', factor: 65 },
  { ingredientName: 'sesamfrön', unitFrom: 'dl', unitTo: 'g', factor: 60 },
  { ingredientName: 'solrosfrön', unitFrom: 'dl', unitTo: 'g', factor: 55 },
  { ingredientName: 'chiafrön', unitFrom: 'dl', unitTo: 'g', factor: 60 },

  // Butter & Margarine
  { ingredientName: 'margarin', unitFrom: 'dl', unitTo: 'g', factor: 90 },
  { ingredientName: 'kokosfett', unitFrom: 'dl', unitTo: 'g', factor: 90 },

  // Misc
  { ingredientName: 'kakao', unitFrom: 'dl', unitTo: 'g', factor: 50 },
  { ingredientName: 'kakao', unitFrom: 'msk', unitTo: 'g', factor: 8 },
  { ingredientName: 'bikarbonat', unitFrom: 'tsk', unitTo: 'g', factor: 4 },
  { ingredientName: 'bakpulver', unitFrom: 'tsk', unitTo: 'g', factor: 4 },
  { ingredientName: 'jäst', unitFrom: 'tsk', unitTo: 'g', factor: 3 }
]

export async function seedConversions(): Promise<void> {
  // Get all ingredient types for mapping
  const ingredientTypes = await query('SELECT id, name FROM ingredient_types')

  const typeMap = new Map<string, string>()
  for (const type of ingredientTypes as Array<{ id: string, name: string }>) {
    typeMap.set(type.name.toLowerCase(), type.id)
  }

  let seededCount = 0

  for (const conversion of CONVERSION_DATA) {
    // Find matching ingredient type
    let ingredientTypeId = typeMap.get(conversion.ingredientName.toLowerCase())

    // If no exact match, try partial match
    if (!ingredientTypeId) {
      for (const [name, id] of typeMap.entries()) {
        if (name.includes(conversion.ingredientName.toLowerCase())
          || conversion.ingredientName.toLowerCase().includes(name)) {
          ingredientTypeId = id
          break
        }
      }
    }

    if (!ingredientTypeId) {
      continue // Skip silently
    }

    try {
      const id = randomUUID()
      const now = new Date().toISOString()

      await execute(`
        INSERT INTO ingredient_conversions (
          id, ingredient_type_id, unit_from, unit_to, conversion_factor, notes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (ingredient_type_id, unit_from, unit_to) DO NOTHING
      `, [id, ingredientTypeId, conversion.unitFrom, conversion.unitTo, conversion.factor, conversion.notes || null, now])

      seededCount++
    } catch {
      // Silently skip errors
    }
  }

  if (seededCount > 0) {
    console.log(`  Seeded ${seededCount} ingredient conversions`)
  }
}
