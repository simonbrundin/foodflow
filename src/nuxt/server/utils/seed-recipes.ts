import { execute, queryOne } from './db'

interface SeedRecipe {
  id: string
  title: string
  description: string
  imageUrl: string
  prepTime: number
  cookTime: number
  servings: number
  difficulty: string
  ingredients: Array<{ ingredientTypeId: string; amount: number; unit: string; notes?: string }>
  instructions: string[]
  tags: string[]
}

const RECIPES: SeedRecipe[] = [
  {
    id: 'rec_pasta_carbonara',
    title: 'Klassisk Pasta Carbonara',
    description: 'En krämig italiensk pastarätt med bacon, ägg och parmesan.',
    imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800',
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    difficulty: 'medium',
    ingredients: [
      { ingredientTypeId: 'ing_pasta', amount: 400, unit: 'g', notes: 'spaghetti' },
      { ingredientTypeId: 'ing_bacon', amount: 200, unit: 'g' },
      { ingredientTypeId: 'ing_agg', amount: 4, unit: 'st' },
      { ingredientTypeId: 'ing_parmesan', amount: 100, unit: 'g', notes: 'riven' },
      { ingredientTypeId: 'ing_salt', amount: 1, unit: 'krm' },
      { ingredientTypeId: 'ing_peppar', amount: 1, unit: 'krm', notes: 'nymalen' }
    ],
    instructions: [
      'Koka pastan enligt paketets anvisningar i saltat vatten.',
      'Stek baconen i en stor panna tills den är krispig.',
      'Vispa ihop ägg, äggulor och riven parmesan.',
      'Häll av pastan men spara lite av pastavattnet.',
      'Blanda snabbt pastan med äggblandningen och bacon.',
      'Smaksaka med salt och peppar. Servera genast.'
    ],
    tags: ['italiensk', 'pasta', 'snabb', 'klassiker']
  },
  {
    id: 'rec_pumpa_curry',
    title: 'Thailändsk Pumpacurry',
    description: 'En värmande vegetarisk curry med pumpa och kikärtor.',
    imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800',
    prepTime: 15,
    cookTime: 25,
    servings: 4,
    difficulty: 'easy',
    ingredients: [
      { ingredientTypeId: 'ing_gresskar', amount: 500, unit: 'g', notes: 'tärnad' },
      { ingredientTypeId: 'ing_kikartor', amount: 400, unit: 'g' },
      { ingredientTypeId: 'ing_tahini', amount: 2, unit: 'msk' },
      { ingredientTypeId: 'ing_citron', amount: 1, unit: 'st' },
      { ingredientTypeId: 'ing_spiskummin', amount: 2, unit: 'krm' },
      { ingredientTypeId: 'ing_lok', amount: 1, unit: 'st' },
      { ingredientTypeId: 'ing_ris', amount: 300, unit: 'g' }
    ],
    instructions: [
      'Koka riset enligt paketets anvisningar.',
      'Fräs lök i olja tills den är mjuk.',
      'Tillsätt pumpa och kryddor.',
      'Låt koka i 15-20 minuter tills pumpan är mjuk.',
      'Rör ner kikärtor och tahini.',
      'Smaka av med citronjuice och salt.',
      'Servera med ris.'
    ],
    tags: ['vegetarisk', 'thailändsk', 'curry', 'nyttig']
  },
  {
    id: 'rec_kyckling_wok',
    title: 'Asiatisk Kycklingwok',
    description: 'En snabb och smakrik wok med kyckling och grönsaker.',
    imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800',
    prepTime: 15,
    cookTime: 15,
    servings: 4,
    difficulty: 'easy',
    ingredients: [
      { ingredientTypeId: 'ing_kyckling', amount: 500, unit: 'g' },
      { ingredientTypeId: 'ing_ris', amount: 300, unit: 'g' },
      { ingredientTypeId: 'ing_majs', amount: 150, unit: 'g' },
      { ingredientTypeId: 'ing_bonor', amount: 200, unit: 'g' },
      { ingredientTypeId: 'ing_soja', amount: 3, unit: 'msk' },
      { ingredientTypeId: 'ing_inlagd_ingefra', amount: 50, unit: 'g' },
      { ingredientTypeId: 'ing_vitlok', amount: 2, unit: 'st' },
      { ingredientTypeId: 'ing_olivolja', amount: 2, unit: 'msk' }
    ],
    instructions: [
      'Koka riset enligt paketets anvisningar.',
      'Hetta upp en wokpanna med olja.',
      'Woka kycklingen i ca 5 minuter.',
      'Tillsätt vitlök och ingefära.',
      'Lägg i majs och bönor.',
      'Tillsätt sojasås och servera.'
    ],
    tags: ['asiatiskt', 'snabb', 'kyckling', 'wok']
  },
  {
    id: 'rec_guacamole',
    title: 'Färsk Guacamole',
    description: 'Klassisk mexikansk guacamole med avocado och koriander.',
    imageUrl: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=800',
    prepTime: 10,
    cookTime: 0,
    servings: 4,
    difficulty: 'easy',
    ingredients: [
      { ingredientTypeId: 'ing_avokado', amount: 3, unit: 'st' },
      { ingredientTypeId: 'ing_lime', amount: 2, unit: 'st' },
      { ingredientTypeId: 'ing_koriander', amount: 30, unit: 'g' },
      { ingredientTypeId: 'ing_lok', amount: 0.5, unit: 'st' },
      { ingredientTypeId: 'ing_tomat', amount: 1, unit: 'st' },
      { ingredientTypeId: 'ing_salt', amount: 1, unit: 'krm' },
      { ingredientTypeId: 'ing_peppar', amount: 0.5, unit: 'krm' }
    ],
    instructions: [
      'Dela avokadorna och ta bort kärnorna.',
      'Mos a avokadon i en skål.',
      'Tillsätt limesaft och rör om.',
      'Hacka och tillsätt lök, tomat och koriander.',
      'Smaka av med salt och peppar.',
      'Servera med tortillachips.'
    ],
    tags: ['mexikansk', 'vegetarisk', 'dipp', 'snabb']
  }
]

export async function seedRecipes(): Promise<void> {
  const count = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM recipes')
  if (count && parseInt(count.count) > 0) {
    console.log('Recipes already seeded')
    return
  }
  
  console.log('Seeding recipes...')
  
  const now = new Date().toISOString()
  
  for (const recipe of RECIPES) {
    await execute(
      `INSERT INTO recipes (id, title, description, image_url, prep_time, cook_time, servings, difficulty, ingredients, instructions, tags, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)`,
      [
        recipe.id,
        recipe.title,
        recipe.description,
        recipe.imageUrl,
        recipe.prepTime,
        recipe.cookTime,
        recipe.servings,
        recipe.difficulty,
        JSON.stringify(recipe.ingredients),
        JSON.stringify(recipe.instructions),
        JSON.stringify(recipe.tags),
        now
      ]
    )
  }
  
  console.log(`Seeded ${RECIPES.length} recipes`)
}
