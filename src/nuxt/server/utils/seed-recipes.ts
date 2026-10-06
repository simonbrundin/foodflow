import { execute, query, queryOne } from './db'
import { randomUUID } from 'crypto'

interface SeedRecipe {
  title: string
  description: string
  imageUrl: string
  prepTime: number
  cookTime: number
  servings: number
  difficulty: string
  ingredients: Array<{ ingredientName: string, amount: number, unit: string, notes?: string }>
  instructions: string[]
  tags: string[]
}

const RECIPES: SeedRecipe[] = [
  {
    title: 'Klassisk Pasta Carbonara',
    description: 'En krämig italiensk pastarätt med bacon, ägg och parmesan.',
    imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800',
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    difficulty: 'medium',
    ingredients: [
      { ingredientName: 'Pasta', amount: 400, unit: 'g', notes: 'spaghetti' },
      { ingredientName: 'Bacon', amount: 200, unit: 'g' },
      { ingredientName: 'Ägg', amount: 4, unit: 'st' },
      { ingredientName: 'Parmesan', amount: 100, unit: 'g', notes: 'riven' },
      { ingredientName: 'Salt', amount: 1, unit: 'krm' },
      { ingredientName: 'Svartpeppar', amount: 1, unit: 'krm', notes: 'nymalen' }
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
    title: 'Thailändsk Pumpacurry',
    description: 'En värmande vegetarisk curry med pumpa och kikärtor.',
    imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800',
    prepTime: 15,
    cookTime: 25,
    servings: 4,
    difficulty: 'easy',
    ingredients: [
      { ingredientName: 'Pumpa/Gresskar', amount: 500, unit: 'g', notes: 'tärnad' },
      { ingredientName: 'Kikärtor', amount: 400, unit: 'g' },
      { ingredientName: 'Tahini', amount: 2, unit: 'msk' },
      { ingredientName: 'Citron', amount: 1, unit: 'st' },
      { ingredientName: 'Spiskummin', amount: 2, unit: 'krm' },
      { ingredientName: 'Lök', amount: 1, unit: 'st' },
      { ingredientName: 'Vitlök', amount: 3, unit: 'klyfta' },
      { ingredientName: 'Olivolja', amount: 2, unit: 'msk' },
      { ingredientName: 'Salt', amount: 1, unit: 'krm' }
    ],
    instructions: [
      'Hacka lök och vitlök. Fräs i olivolja i en stor kastrull.',
      'Tillsätt spiskummin och låt fräsa en minut.',
      'Lägg i pumpa och kikärtor. Häll på vatten så det täcker.',
      'Låt koka i 20 minuter tills pumpan är mjuk.',
      'Rör ner tahini och smaka av med citron och salt.',
      'Servera med ris eller naanbröd.'
    ],
    tags: ['vegetarisk', 'thailändsk', 'curry', 'snabb']
  },
  {
    title: 'Kycklingwok med Grönsaker',
    description: 'En snabb och hälsosam wok med kyckling och färska grönsaker.',
    imageUrl: 'https://images.unsplash.com/photo-1518983546435-91f8b87fe561?w=800',
    prepTime: 15,
    cookTime: 15,
    servings: 4,
    difficulty: 'easy',
    ingredients: [
      { ingredientName: 'Kyckling', amount: 500, unit: 'g', notes: 'strimlad' },
      { ingredientName: 'Ris', amount: 400, unit: 'g' },
      { ingredientName: 'Lök', amount: 1, unit: 'st' },
      { ingredientName: 'Vitlök', amount: 2, unit: 'klyfta' },
      { ingredientName: 'Sojasås', amount: 3, unit: 'msk' },
      { ingredientName: 'Inlagd ingefära', amount: 1, unit: 'msk' },
      { ingredientName: 'Olivolja', amount: 2, unit: 'msk' }
    ],
    instructions: [
      'Koka riset enligt förpackningen.',
      'Skär kycklingen i strimlor.',
      'Hetta upp olja i en wokpanna.',
      'Woka kycklingen tills den är gyllenbrun.',
      'Tillsätt lök, vitlök och ingefära.',
      'Häll på sojasås och woka i 2 minuter till.',
      'Servera med riset.'
    ],
    tags: ['snabb', 'kyckling', 'wok', 'asiatisk']
  },
  {
    title: 'Guacamole',
    description: 'Klassisk mexikansk guacamole - perfekt som dipp eller tillbehör.',
    imageUrl: 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=800',
    prepTime: 10,
    cookTime: 0,
    servings: 4,
    difficulty: 'easy',
    ingredients: [
      { ingredientName: 'Avokado', amount: 3, unit: 'st' },
      { ingredientName: 'Lime', amount: 2, unit: 'st' },
      { ingredientName: 'Koriander', amount: 30, unit: 'g' },
      { ingredientName: 'Lök', amount: 0.5, unit: 'st' },
      { ingredientName: 'Tomat', amount: 1, unit: 'st' },
      { ingredientName: 'Salt', amount: 1, unit: 'krm' },
      { ingredientName: 'Svartpeppar', amount: 0.5, unit: 'krm' }
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
    return // Already seeded
  }

  // Build ingredient name -> UUID map
  const ingredients = await query<{ id: string, name: string }>('SELECT id, name FROM ingredient_types')
  const ingredientMap = new Map(ingredients.map(i => [i.name, i.id]))

  const now = new Date().toISOString()

  for (const recipe of RECIPES) {
    const id = randomUUID()

    // Resolve ingredient names to UUIDs
    const ingredientsJson = recipe.ingredients
      .map((ing) => {
        const uuid = ingredientMap.get(ing.ingredientName)
        if (!uuid) {
          console.warn(`Ingredient "${ing.ingredientName}" not found, skipping in recipe ${recipe.title}`)
          return null
        }
        return {
          ingredientTypeId: uuid,
          ingredientTypeName: ing.ingredientName,
          amount: ing.amount,
          unit: ing.unit,
          notes: ing.notes
        }
      })
      .filter(Boolean)

    await execute(
      `INSERT INTO recipes (id, title, description, image_url, prep_time, cook_time, servings, difficulty, ingredients, instructions, tags, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)`,
      [
        id,
        recipe.title,
        recipe.description,
        recipe.imageUrl,
        recipe.prepTime,
        recipe.cookTime,
        recipe.servings,
        recipe.difficulty,
        JSON.stringify(ingredientsJson),
        JSON.stringify(recipe.instructions),
        JSON.stringify(recipe.tags),
        now
      ]
    )
  }
}
