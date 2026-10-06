import { execute, query } from './db'

interface UnitData {
  id: string
  name: string
  shortName: string
  type: 'weight' | 'volume' | 'count'
  toGramFactor?: number
  toMlFactor?: number
  sortOrder: number
}

// Standard Swedish cooking units with conversion factors
const UNITS: UnitData[] = [
  // Count (pieces)
  { id: 'st', name: 'stycken', shortName: 'st', type: 'count', sortOrder: 1 },

  // Weight units (grams)
  { id: 'g', name: 'gram', shortName: 'g', type: 'weight', toGramFactor: 1, sortOrder: 10 },
  { id: 'kg', name: 'kilogram', shortName: 'kg', type: 'weight', toGramFactor: 1000, sortOrder: 11 },

  // Volume units (milliliters)
  { id: 'ml', name: 'milliliter', shortName: 'ml', type: 'volume', toMlFactor: 1, sortOrder: 20 },
  { id: 'l', name: 'liter', shortName: 'l', type: 'volume', toMlFactor: 1000, sortOrder: 21 },
  { id: 'dl', name: 'deciliter', shortName: 'dl', type: 'volume', toMlFactor: 100, sortOrder: 22 },
  { id: 'msk', name: 'matsked', shortName: 'msk', type: 'volume', toMlFactor: 15, sortOrder: 23 },
  { id: 'tsk', name: 'tesked', shortName: 'tsk', type: 'volume', toMlFactor: 5, sortOrder: 24 },
  { id: 'krm', name: 'kryddmått', shortName: 'krm', type: 'volume', toMlFactor: 1, sortOrder: 25 }
]

export async function seedUnits(): Promise<void> {
  // Check if units already exist
  const existing = await query<{ count: string }>('SELECT COUNT(*) as count FROM units')
  const existingUnitCount = Number(existing[0]?.count ?? 0)
  if (existingUnitCount >= UNITS.length) {
    return // Units already seeded
  }

  for (const unit of UNITS) {
    try {
      await execute(`
        INSERT INTO units (id, name, short_name, type, to_gram_factor, to_ml_factor, sort_order, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          short_name = EXCLUDED.short_name,
          type = EXCLUDED.type,
          to_gram_factor = EXCLUDED.to_gram_factor,
          to_ml_factor = EXCLUDED.to_ml_factor,
          sort_order = EXCLUDED.sort_order
      `, [unit.id, unit.name, unit.shortName, unit.type, unit.toGramFactor || null, unit.toMlFactor || null, unit.sortOrder])
    } catch (error) {
      console.error(`Error seeding unit ${unit.id}:`, error)
    }
  }
}
