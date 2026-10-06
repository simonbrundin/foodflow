// Seed store products - called from initDb() on app startup
import { execute, query } from './db'
import { randomUUID } from 'crypto'

interface SeedProduct {
  name: string
  brand: string | null
  category: string
  price: number
  unit: string
  pricePerKg: number
  storeName: string
}

const PRODUCTS: SeedProduct[] = [
  // Willys
  { name: 'Garant Mjölk 3%', brand: 'Garant', category: 'Mejeri', price: 14.90, unit: '1L', pricePerKg: 14.90, storeName: 'Willys' },
  { name: 'Garant Mjölk 3%', brand: 'Garant', category: 'Mejeri', price: 26.90, unit: '2L', pricePerKg: 13.45, storeName: 'Willys' },
  { name: 'Garant Ägg 10-pack', brand: 'Garant', category: 'Ägg', price: 39.90, unit: '10st', pricePerKg: 79.80, storeName: 'Willys' },
  { name: 'Garant Ägg 6-pack', brand: 'Garant', category: 'Ägg', price: 25.90, unit: '6st', pricePerKg: 86.33, storeName: 'Willys' },
  { name: 'Garant Pasta Spaghetti', brand: 'Garant', category: 'Pasta', price: 19.90, unit: '400g', pricePerKg: 49.75, storeName: 'Willys' },
  { name: 'Garant Jasminris', brand: 'Garant', category: 'Ris', price: 29.90, unit: '1kg', pricePerKg: 29.90, storeName: 'Willys' },
  { name: 'Körsbärstomater', brand: null, category: 'Grönsaker', price: 29.90, unit: '500g', pricePerKg: 59.80, storeName: 'Willys' },
  { name: 'Tomater', brand: null, category: 'Grönsaker', price: 39.90, unit: 'kg', pricePerKg: 39.90, storeName: 'Willys' },
  { name: 'Gul lök', brand: null, category: 'Grönsaker', price: 19.90, unit: 'kg', pricePerKg: 19.90, storeName: 'Willys' },
  { name: 'Vitlök 3-pack', brand: null, category: 'Grönsaker', price: 25.90, unit: '3st', pricePerKg: 172.67, storeName: 'Willys' },
  { name: 'Garant Olivolja', brand: 'Garant', category: 'Olja', price: 49.90, unit: '500ml', pricePerKg: 99.80, storeName: 'Willys' },
  { name: 'Garant Olivolja', brand: 'Garant', category: 'Olja', price: 89.90, unit: '1L', pricePerKg: 89.90, storeName: 'Willys' },
  { name: 'Garant Parmesan', brand: 'Garant', category: 'Mejeri', price: 69.90, unit: '400g', pricePerKg: 174.75, storeName: 'Willys' },
  { name: 'Parmesan Keso', brand: 'Keso', category: 'Mejeri', price: 39.90, unit: '200g', pricePerKg: 199.50, storeName: 'Willys' },
  { name: 'Garant Bacon', brand: 'Garant', category: 'Kött', price: 45.90, unit: '200g', pricePerKg: 229.50, storeName: 'Willys' },
  { name: 'Beef Bacon', brand: null, category: 'Kött', price: 55.90, unit: '150g', pricePerKg: 372.67, storeName: 'Willys' },
  { name: 'Garant Smör', brand: 'Garant', category: 'Mejeri', price: 39.90, unit: '500g', pricePerKg: 79.80, storeName: 'Willys' },
  { name: 'Garant Havssalt', brand: 'Garant', category: 'Kryddor', price: 24.90, unit: '600g', pricePerKg: 41.50, storeName: 'Willys' },
  { name: 'Svartpeppar malen', brand: null, category: 'Kryddor', price: 29.90, unit: '55g', pricePerKg: 543.64, storeName: 'Willys' },
  { name: 'Kycklingfilé', brand: null, category: 'Fågel', price: 59.90, unit: '400g', pricePerKg: 149.75, storeName: 'Willys' },
  { name: 'Kycklingfilé', brand: null, category: 'Fågel', price: 79.90, unit: '600g', pricePerKg: 133.17, storeName: 'Willys' },
  { name: 'Avokado 4-pack', brand: null, category: 'Grönsaker', price: 39.90, unit: '4st', pricePerKg: 99.75, storeName: 'Willys' },
  { name: 'Lime 4-pack', brand: null, category: 'Frukt', price: 29.90, unit: '4st', pricePerKg: 74.75, storeName: 'Willys' },
  { name: 'Citron 4-pack', brand: null, category: 'Frukt', price: 19.90, unit: '4st', pricePerKg: 49.75, storeName: 'Willys' },
  { name: 'Koriander färsk', brand: null, category: 'Örter', price: 12.90, unit: '30g', pricePerKg: 430.00, storeName: 'Willys' },
  { name: 'Kikärtor konserv', brand: null, category: 'Baljväxter', price: 19.90, unit: '380g', pricePerKg: 52.37, storeName: 'Willys' },
  { name: 'Garant Tahini', brand: 'Garant', category: 'Sås', price: 39.90, unit: '270g', pricePerKg: 147.78, storeName: 'Willys' },
  { name: 'Kikkoman Sojasås', brand: 'Kikkoman', category: 'Sås', price: 29.90, unit: '150ml', pricePerKg: 199.33, storeName: 'Willys' },
  { name: 'Majs konserv', brand: null, category: 'Grönsaker', price: 14.90, unit: '340g', pricePerKg: 43.82, storeName: 'Willys' },
  { name: 'Röda bönor konserv', brand: null, category: 'Baljväxter', price: 17.90, unit: '380g', pricePerKg: 47.11, storeName: 'Willys' },
  { name: 'Inlagd ingefära', brand: null, category: 'Grönsaker', price: 24.90, unit: '100g', pricePerKg: 249.00, storeName: 'Willys' },

  // ICA
  { name: 'ICA Mjölk 3%', brand: 'ICA', category: 'Mejeri', price: 15.90, unit: '1L', pricePerKg: 15.90, storeName: 'ICA' },
  { name: 'ICA Ägg 10-pack', brand: 'ICA', category: 'Ägg', price: 42.90, unit: '10st', pricePerKg: 85.80, storeName: 'ICA' },
  { name: 'ICA Pasta Spaghetti', brand: 'ICA', category: 'Pasta', price: 22.90, unit: '400g', pricePerKg: 57.25, storeName: 'ICA' },
  { name: 'ICA Jasminris', brand: 'ICA', category: 'Ris', price: 32.90, unit: '1kg', pricePerKg: 32.90, storeName: 'ICA' },
  { name: 'Körsbärstomater', brand: null, category: 'Grönsaker', price: 32.90, unit: '500g', pricePerKg: 65.80, storeName: 'ICA' },
  { name: 'ICA Kycklingfilé', brand: 'ICA', category: 'Fågel', price: 64.90, unit: '400g', pricePerKg: 162.25, storeName: 'ICA' },
  { name: 'Avokado 4-pack', brand: null, category: 'Grönsaker', price: 44.90, unit: '4st', pricePerKg: 112.25, storeName: 'ICA' }
]

export async function seedProducts(): Promise<void> {
  console.log('Seeding store products...')

  const now = new Date().toISOString()

  // Get store name -> UUID map
  const stores = await query<{ id: string, name: string }>('SELECT id, name FROM stores')
  const storeMap = new Map(stores.map(s => [s.name, s.id]))

  let insertedCount = 0

  for (const product of PRODUCTS) {
    const storeId = storeMap.get(product.storeName)
    if (!storeId) {
      console.warn(`Store "${product.storeName}" not found, skipping product ${product.name}`)
      continue
    }

    const id = randomUUID()
    await execute(
      `INSERT INTO store_products (id, store_id, name, brand, category, price, unit, price_per_kg, in_stock, is_available, last_updated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, true, $9)
       ON CONFLICT DO NOTHING`,
      [id, storeId, product.name, product.brand, product.category, product.price, product.unit, product.pricePerKg, now]
    )
    insertedCount++
  }

  if (insertedCount > 0) {
    console.log(`  Seeded ${insertedCount} store products`)
  }
}
