import { execute, queryOne } from './db'

type IngredientCategory = 
  | 'kött' | 'fisk' | 'fågel'
  | 'mejeri' | 'ägg'
  | 'grönsaker' | 'frukt' | 'bär'
  | 'spannmål' | 'pasta' | 'bröd'
  | 'baljväxt' | 'nötter' | 'frön'
  | 'kryddor' | 'örter'
  | 'olja' | 'fett'
  | 'sås' | 'konserver'
  | 'sötsaker' | 'dryck'
  | 'annat'

interface SeedIngredient {
  id: string
  name: string
  category: IngredientCategory
  defaultUnit: string
}

const INGREDIENTS: SeedIngredient[] = [
  { id: 'ing_tomat', name: 'Tomat', category: 'grönsaker', defaultUnit: 'g' },
  { id: 'ing_mjolk', name: 'Mjölk', category: 'mejeri', defaultUnit: 'ml' },
  { id: 'ing_agg', name: 'Ägg', category: 'ägg', defaultUnit: 'st' },
  { id: 'ing_lok', name: 'Lök', category: 'grönsaker', defaultUnit: 'st' },
  { id: 'ing_vitlok', name: 'Vitlök', category: 'grönsaker', defaultUnit: 'st' },
  { id: 'ing_pasta', name: 'Pasta', category: 'pasta', defaultUnit: 'g' },
  { id: 'ing_olivolja', name: 'Olivolja', category: 'olja', defaultUnit: 'msk' },
  { id: 'ing_salt', name: 'Salt', category: 'kryddor', defaultUnit: 'krm' },
  { id: 'ing_peppar', name: 'Svartpeppar', category: 'kryddor', defaultUnit: 'krm' },
  { id: 'ing_parmesan', name: 'Parmesan', category: 'mejeri', defaultUnit: 'g' },
  { id: 'ing_bacon', name: 'Bacon', category: 'kött', defaultUnit: 'g' },
  { id: 'ing_smor', name: 'Smör', category: 'mejeri', defaultUnit: 'g' },
  { id: 'ing_gresskar', name: 'Pumpa/Gresskar', category: 'grönsaker', defaultUnit: 'g' },
  { id: 'ing_kikartor', name: 'Kikärtor', category: 'baljväxt', defaultUnit: 'g' },
  { id: 'ing_tahini', name: 'Tahini', category: 'sås', defaultUnit: 'msk' },
  { id: 'ing_citron', name: 'Citron', category: 'frukt', defaultUnit: 'st' },
  { id: 'ing_spiskummin', name: 'Spiskummin', category: 'kryddor', defaultUnit: 'krm' },
  { id: 'ing_kyckling', name: 'Kyckling', category: 'fågel', defaultUnit: 'g' },
  { id: 'ing_ris', name: 'Ris', category: 'spannmål', defaultUnit: 'g' },
  { id: 'ing_soja', name: 'Sojasås', category: 'sås', defaultUnit: 'msk' },
  { id: 'ing_inlagd_ingefra', name: 'Inlagd ingefära', category: 'grönsaker', defaultUnit: 'g' },
  { id: 'ing_avokado', name: 'Avokado', category: 'grönsaker', defaultUnit: 'st' },
  { id: 'ing_lime', name: 'Lime', category: 'frukt', defaultUnit: 'st' },
  { id: 'ing_koriander', name: 'Koriander', category: 'örter', defaultUnit: 'g' },
  { id: 'ing_majs', name: 'Majs', category: 'grönsaker', defaultUnit: 'g' },
  { id: 'ing_bonor', name: 'Röda bönor', category: 'baljväxt', defaultUnit: 'g' },
]

export async function seedIngredients(): Promise<void> {
  const count = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM ingredient_types')
  if (count && parseInt(count.count) > 0) {
    console.log('Ingredients already seeded')
    return
  }
  
  console.log('Seeding ingredients...')
  
  const now = new Date().toISOString()
  
  for (const ing of INGREDIENTS) {
    await execute(
      `INSERT INTO ingredient_types (id, name, category, default_unit, created_at) VALUES ($1, $2, $3, $4, $5)`,
      [ing.id, ing.name, ing.category, ing.defaultUnit, now]
    )
  }
  
  console.log(`Seeded ${INGREDIENTS.length} ingredients`)
}
