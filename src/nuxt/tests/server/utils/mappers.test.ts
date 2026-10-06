import { describe, it, expect } from 'vitest'
import {
  mapRecipe,
  mapRecipeIngredients,
  mapStore,
  mapStoreProduct,
  mapUnit,
  mapIngredientType,
  mapIngredientConversion,
  mapProductMapping,
  parseJsonField
} from '../../../server/utils/mappers'

// ---------------------------------------------------------------------------
// parseJsonField
// ---------------------------------------------------------------------------

describe('parseJsonField', () => {
  it('parses a JSON string into an object', () => {
    const result = parseJsonField<string[]>('["a", "b"]')
    expect(result).toEqual(['a', 'b'])
  })

  it('returns the value as-is if already an object', () => {
    const obj = ['x', 'y']
    const result = parseJsonField<string[]>(obj)
    expect(result).toBe(obj)
  })

  it('returns null as-is', () => {
    const result = parseJsonField(null)
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// mapRecipeIngredients
// ---------------------------------------------------------------------------

describe('mapRecipeIngredients', () => {
  it('maps an array of snake_case ingredient rows to camelCase', () => {
    const rows = [
      {
        id: 'ing-1',
        recipeId: 'rec-1',
        ingredientTypeId: 'tomato-123',
        amount: '200',
        unitId: 'g',
        notes: 'körsbärstomater'
      },
      {
        id: 'ing-2',
        recipeId: 'rec-1',
        ingredientTypeId: 'basil-456',
        amount: '10',
        unit: 'g',  // old field name
        notes: null
      }
    ]

    const result = mapRecipeIngredients(rows)

    expect(result[0]).toMatchObject({
      id: 'ing-1',
      recipeId: 'rec-1',
      ingredientTypeId: 'tomato-123',
      amount: 200,
      unitId: 'g',
      notes: 'körsbärstomater',
      isOptional: undefined
    })

    expect(result[1]).toMatchObject({
      id: 'ing-2',
      amount: 10,
      unitId: 'g',  // unit → unitId fallback
      notes: undefined
    })
  })

  it('handles empty array', () => {
    expect(mapRecipeIngredients([])).toEqual([])
  })

  it('handles missing fields with defaults', () => {
    const rows = [{ id: null, recipeId: null, ingredientTypeId: null, amount: null }]
    const result = mapRecipeIngredients(rows)

    expect(result[0]).toMatchObject({
      id: '',
      recipeId: '',
      ingredientTypeId: '',
      amount: 0,       // Number(null) = 0 (finite, no NaN)
      unitId: 'st'     // default fallback
    })
  })

  it('defaults to 1 when amount is non-numeric (NaN)', () => {
    const rows = [{ id: '1', recipeId: 'r1', ingredientTypeId: 'i1', amount: 'abc', unitId: 'g' }]
    const result = mapRecipeIngredients(rows)
    expect(result[0].amount).toBe(1)  // NaN → default 1
  })

  it('sets isOptional when field is boolean true', () => {
    const rows = [{ id: '1', recipeId: 'r1', ingredientTypeId: 'i1', amount: '1', unitId: 'st', isOptional: true }]
    expect(mapRecipeIngredients(rows)[0].isOptional).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// mapRecipe
// ---------------------------------------------------------------------------

describe('mapRecipe', () => {
  const row: Record<string, unknown> = {
    id: 'recipe-1',
    title: 'Pasta Carbonara',
    description: 'Klassisk italiensk',
    image_url: 'https://example.com/pasta.jpg',
    prep_time: 10,
    cook_time: 20,
    servings: 4,
    difficulty: 'medium',
    source_url: 'https://example.com',
    source_name: 'MatHemsidan',
    ingredients: JSON.stringify([
      { id: 'i1', recipeId: 'r1', ingredientTypeId: 'pasta', amount: 400, unitId: 'g' }
    ]),
    instructions: JSON.stringify(['Koka pastan', 'Gör såsen']),
    tags: JSON.stringify(['italienskt', 'pastor']),
    rating: 8.5,
    nutrition_info: JSON.stringify({ calories: 650, protein: 22, carbs: 80, fat: 28 }),
    created_at: '2024-01-01T12:00:00.000Z',
    updated_at: '2024-01-02T15:30:00.000Z'
  }

  it('maps all fields correctly', () => {
    const result = mapRecipe(row)

    expect(result.id).toBe('recipe-1')
    expect(result.title).toBe('Pasta Carbonara')
    expect(result.description).toBe('Klassisk italiensk')
    expect(result.imageUrl).toBe('https://example.com/pasta.jpg')
    expect(result.prepTime).toBe(10)
    expect(result.cookTime).toBe(20)
    expect(result.servings).toBe(4)
    expect(result.difficulty).toBe('medium')
    expect(result.sourceUrl).toBe('https://example.com')
    expect(result.sourceName).toBe('MatHemsidan')
    expect(result.rating).toBe(8.5)
    expect(result.ingredients).toHaveLength(1)
    expect(result.instructions).toEqual(['Koka pastan', 'Gör såsen'])
    expect(result.tags).toEqual(['italienskt', 'pastor'])
    expect(result.nutritionInfo).toEqual({ calories: 650, protein: 22, carbs: 80, fat: 28 })
    expect(result.createdAt).toBeInstanceOf(Date)
    expect(result.updatedAt).toBeInstanceOf(Date)
  })

  it('handles null optional fields', () => {
    const minimalRow: Record<string, unknown> = {
      id: 'r2', title: 'Sallad', description: '',
      prep_time: 0, cook_time: 0, servings: 2, difficulty: 'easy',
      ingredients: '[]', instructions: '[]', tags: '[]',
      created_at: '2024-01-01T00:00:00.000Z', updated_at: '2024-01-01T00:00:00.000Z'
    }
    const result = mapRecipe(minimalRow)
    expect(result.imageUrl).toBeUndefined()
    expect(result.sourceUrl).toBeUndefined()
    expect(result.rating).toBeUndefined()
    expect(result.nutritionInfo).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// mapUnit
// ---------------------------------------------------------------------------

describe('mapUnit', () => {
  it('maps a unit row correctly', () => {
    const row: Record<string, unknown> = {
      id: 'unit-g',
      name: 'Gram',
      short_name: 'g',
      type: 'weight',
      to_gram_factor: 1,
      to_ml_factor: null,
      sort_order: 1,
      created_at: '2024-01-01T00:00:00.000Z'
    }

    const result = mapUnit(row)

    expect(result).toEqual({
      id: 'unit-g',
      name: 'Gram',
      shortName: 'g',
      type: 'weight',
      toGramFactor: 1,
      toMlFactor: undefined,
      sortOrder: 1,
      createdAt: expect.any(Date)
    })
  })
})

// ---------------------------------------------------------------------------
// mapIngredientType
// ---------------------------------------------------------------------------

describe('mapIngredientType', () => {
  it('maps an ingredient type row', () => {
    const row: Record<string, unknown> = {
      id: 'tomato-type',
      name: 'Tomat',
      singular_name: 'tomat',
      plural_name: 'tomater',
      category: 'grönsaker',
      default_unit_id: 'g',
      aliases: JSON.stringify(['körsbärstomat', 'plommontomat']),
      created_at: '2024-01-01T00:00:00.000Z'
    }

    const result = mapIngredientType(row)

    expect(result.id).toBe('tomato-type')
    expect(result.name).toBe('Tomat')
    expect(result.singularName).toBe('tomat')
    expect(result.pluralName).toBe('tomater')
    expect(result.category).toBe('grönsaker')
    expect(result.defaultUnitId).toBe('g')
    expect(result.aliases).toEqual(['körsbärstomat', 'plommontomat'])
  })

  it('defaults defaultUnitId to st when missing', () => {
    const row: Record<string, unknown> = {
      id: 'x', name: 'X', category: 'kryddor',
      created_at: '2024-01-01T00:00:00.000Z'
    }
    expect(mapIngredientType(row).defaultUnitId).toBe('st')
  })
})

// ---------------------------------------------------------------------------
// mapIngredientConversion
// ---------------------------------------------------------------------------

describe('mapIngredientConversion', () => {
  it('maps a conversion row', () => {
    const row: Record<string, unknown> = {
      id: 'conv-1',
      ingredient_type_id: 'ing-tomat',
      ingredient_type_name: 'Tomat',
      unit_from: 'st',
      unit_to: 'g',
      conversion_factor: 100,
      notes: 'ungefär',
      created_at: '2024-01-01T00:00:00.000Z'
    }

    const result = mapIngredientConversion(row)

    expect(result.ingredientTypeId).toBe('ing-tomat')
    expect(result.ingredientTypeName).toBe('Tomat')
    expect(result.unitFrom).toBe('st')
    expect(result.unitTo).toBe('g')
    expect(result.conversionFactor).toBe(100)
    expect(result.notes).toBe('ungefär')
  })
})

// ---------------------------------------------------------------------------
// mapProductMapping
// ---------------------------------------------------------------------------

describe('mapProductMapping', () => {
  it('maps a product mapping row', () => {
    const row: Record<string, unknown> = {
      id: 'map-1',
      ingredient_type_id: 'ing-tomat',
      ingredient_type_name: 'Tomat',
      store_id: 'store-ica',
      store_name: 'ICA Kvantum',
      store_product_id: 'prod-tomat-ica',
      store_product_name: 'Kronfågel',
      is_default: true,
      priority: 1,
      notes: 'bästa priset',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-02T00:00:00.000Z'
    }

    const result = mapProductMapping(row)

    expect(result.id).toBe('map-1')
    expect(result.ingredientTypeId).toBe('ing-tomat')
    expect(result.storeId).toBe('store-ica')
    expect(result.storeProductId).toBe('prod-tomat-ica')
    expect(result.isDefault).toBe(true)
    expect(result.priority).toBe(1)
    expect(result.notes).toBe('bästa priset')
  })
})
