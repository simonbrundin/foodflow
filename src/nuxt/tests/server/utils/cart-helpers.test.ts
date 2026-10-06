import { describe, it, expect } from 'vitest'
import { calculateIngredientPrice, findMappedProduct } from '../../../server/utils/cart-helpers'

// ---------------------------------------------------------------------------
// calculateIngredientPrice
// ---------------------------------------------------------------------------

const makeProduct = (overrides: Partial<Parameters<typeof calculateIngredientPrice>[2]> = {}): Parameters<typeof calculateIngredientPrice>[2] => ({
  id: 'prod-1',
  storeId: 'store-1',
  name: 'Test Product',
  price: 49.9,
  unit: '500g',
  pricePerKg: 99.8,
  inStock: true,
  ...overrides
})

describe('calculateIngredientPrice', () => {
  it('calculates price for weight in grams', () => {
    const product = makeProduct({ pricePerKg: 100, unit: 'g' })
    // 200g → 0.2 kg → 0.2 * 100 = 20 kr
    expect(calculateIngredientPrice(200, 'g', product)).toBeCloseTo(20, 2)
  })

  it('calculates price for weight in kg', () => {
    const product = makeProduct({ pricePerKg: 100, unit: 'kg' })
    // 2 kg → 2 * 100 = 200 kr
    expect(calculateIngredientPrice(2, 'kg', product)).toBeCloseTo(200, 2)
  })

  it('calculates price for volume in ml', () => {
    const product = makeProduct({ pricePerKg: 50, unit: 'ml' })
    // 500 ml → 500 * 0.05 = 25 kr
    expect(calculateIngredientPrice(500, 'ml', product)).toBeCloseTo(25, 2)
  })

  it('calculates price for volume in l', () => {
    const product = makeProduct({ pricePerKg: 20, unit: 'l' })
    // 1.5 l → 1.5 * 20 = 30 kr
    expect(calculateIngredientPrice(1.5, 'l', product)).toBeCloseTo(30, 2)
  })

  it('calculates price for pieces (st) with exact count in unit', () => {
    const product = makeProduct({ price: 100, unit: '10 st', pricePerKg: 0 })
    // 10 st package at 100 kr → 10 kr/st → 30 kr for 3
    expect(calculateIngredientPrice(3, 'st', product)).toBeCloseTo(30, 2)
  })

  it('handles pieces when no count in unit string', () => {
    const product = makeProduct({ price: 25, unit: 'paket', pricePerKg: 0 })
    // No number found → 1 piece at 25 kr
    expect(calculateIngredientPrice(1, 'st', product)).toBeCloseTo(25, 2)
    expect(calculateIngredientPrice(4, 'st', product)).toBeCloseTo(100, 2)
  })

  it('applies unit conversion for tsk (teaspoon = 5g)', () => {
    const product = makeProduct({ pricePerKg: 100, unit: 'g' })
    // 3 tsk → 15g → 15 * 0.1 = 1.5 kr
    expect(calculateIngredientPrice(3, 'tsk', product)).toBeCloseTo(1.5, 2)
  })

  it('applies unit conversion for msk (tablespoon = 15g)', () => {
    const product = makeProduct({ pricePerKg: 100, unit: 'g' })
    // 2 msk → 30g → 30 * 0.1 = 3 kr
    expect(calculateIngredientPrice(2, 'msk', product)).toBeCloseTo(3, 2)
  })

  it('uses unknown unit multiplier 1 as fallback', () => {
    const product = makeProduct({ pricePerKg: 100, unit: 'g' })
    // Unknown unit → multiplier 1 → 50g treated as 50 * 0.1 = 5 kr
    expect(calculateIngredientPrice(50, 'dl', product)).toBeCloseTo(5, 2)
  })

  it('rounds to 2 decimal places', () => {
    const product = makeProduct({ pricePerKg: 33.33, unit: 'g' })
    const result = calculateIngredientPrice(100, 'g', product)
    expect(result.toString()).toMatch(/^3\.33/)
  })
})

// ---------------------------------------------------------------------------
// findMappedProduct
// ---------------------------------------------------------------------------

const makeMappings = () => [
  { ingredient_type_id: 'ing-1', ingredient_type_name: 'Tomat', store_product_id: 'prod-tomat' },
  { ingredient_type_id: 'ing-2', ingredient_type_name: 'Lök', store_product_id: 'prod-lok' },
  { ingredient_type_id: 'ing-3', ingredient_type_name: 'Vitlök', store_product_id: 'prod-vitlok' }
]

const makeProducts = () => [
  { id: 'prod-tomat', storeId: 'store-1', name: 'Kronfågel Tomat', price: 25, unit: 'g', pricePerKg: 50, inStock: true },
  { id: 'prod-lok', storeId: 'store-1', name: 'Gul lök', price: 15, unit: 'kg', pricePerKg: 15, inStock: true },
  { id: 'prod-vitlok', storeId: 'store-1', name: 'Vitlök', price: 30, unit: 'st', pricePerKg: 0, inStock: false }
]

describe('findMappedProduct', () => {
  it('returns the correct product for a mapped ingredient', () => {
    const result = findMappedProduct('ing-1', makeMappings(), makeProducts())
    expect(result).not.toBeNull()
    expect(result!.name).toBe('Kronfågel Tomat')
  })

  it('returns null when ingredient has no mapping', () => {
    const result = findMappedProduct('ing-unknown', makeMappings(), makeProducts())
    expect(result).toBeNull()
  })

  it('returns null when mapping exists but product not in product list', () => {
    const products = makeProducts().filter(p => p.id !== 'prod-lok')
    const result = findMappedProduct('ing-2', makeMappings(), products)
    expect(result).toBeNull()
  })

  it('returns product even when out of stock', () => {
    const result = findMappedProduct('ing-3', makeMappings(), makeProducts())
    expect(result).not.toBeNull()
    expect(result!.inStock).toBe(false)
  })
})
