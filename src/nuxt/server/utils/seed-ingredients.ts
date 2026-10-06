import { execute, queryOne } from './db'
import { randomUUID } from 'crypto'

type IngredientCategory
  = | 'kött' | 'fisk' | 'fågel'
    | 'mejeri' | 'ägg'
    | 'grönsaker' | 'frukt' | 'bär'
    | 'spannmål' | 'pasta' | 'bröd'
    | 'baljväxter' | 'nötter' | 'frön'
    | 'kryddor' | 'örter'
    | 'olja' | 'fett'
    | 'sås' | 'konserver'
    | 'sötsaker' | 'dryck'
    | 'annat'

interface SeedIngredient {
  name: string
  category: IngredientCategory
  defaultUnitId: string
}

const INGREDIENTS: SeedIngredient[] = [
  { name: 'Tomat', category: 'grönsaker', defaultUnitId: 'g' },
  { name: 'Mjölk', category: 'mejeri', defaultUnitId: 'ml' },
  { name: 'Ägg', category: 'ägg', defaultUnitId: 'st' },
  { name: 'Lök', category: 'grönsaker', defaultUnitId: 'st' },
  { name: 'Vitlök', category: 'grönsaker', defaultUnitId: 'st' },
  { name: 'Pasta', category: 'pasta', defaultUnitId: 'g' },
  { name: 'Olivolja', category: 'olja', defaultUnitId: 'msk' },
  { name: 'Salt', category: 'kryddor', defaultUnitId: 'krm' },
  { name: 'Svartpeppar', category: 'kryddor', defaultUnitId: 'krm' },
  { name: 'Parmesan', category: 'mejeri', defaultUnitId: 'g' },
  { name: 'Bacon', category: 'kött', defaultUnitId: 'g' },
  { name: 'Smör', category: 'mejeri', defaultUnitId: 'g' },
  { name: 'Pumpa/Gresskar', category: 'grönsaker', defaultUnitId: 'g' },
  { name: 'Kikärtor', category: 'baljväxter', defaultUnitId: 'g' },
  { name: 'Tahini', category: 'sås', defaultUnitId: 'msk' },
  { name: 'Citron', category: 'frukt', defaultUnitId: 'st' },
  { name: 'Spiskummin', category: 'kryddor', defaultUnitId: 'krm' },
  { name: 'Kyckling', category: 'fågel', defaultUnitId: 'g' },
  { name: 'Ris', category: 'spannmål', defaultUnitId: 'g' },
  { name: 'Sojasås', category: 'sås', defaultUnitId: 'msk' },
  { name: 'Inlagd ingefära', category: 'grönsaker', defaultUnitId: 'g' },
  { name: 'Avokado', category: 'grönsaker', defaultUnitId: 'st' },
  { name: 'Lime', category: 'frukt', defaultUnitId: 'st' },
  { name: 'Koriander', category: 'örter', defaultUnitId: 'g' },
  { name: 'Majs', category: 'grönsaker', defaultUnitId: 'g' },
  { name: 'Röda bönor', category: 'baljväxter', defaultUnitId: 'g' }
]

export async function seedIngredients(): Promise<void> {
  const count = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM ingredient_types')
  if (count && parseInt(count.count) >= INGREDIENTS.length) {
    return // Already seeded
  }

  const now = new Date().toISOString()

  for (const ing of INGREDIENTS) {
    const id = randomUUID()
    await execute(
      `INSERT INTO ingredient_types (id, name, category, default_unit_id, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (name) DO UPDATE SET
         category = EXCLUDED.category,
         default_unit_id = EXCLUDED.default_unit_id`,
      [id, ing.name, ing.category, ing.defaultUnitId, now]
    )
  }
}
