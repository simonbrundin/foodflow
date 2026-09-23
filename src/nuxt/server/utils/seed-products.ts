// Script to seed store products for testing
// Run with: npx tsx server/utils/seed-products.ts

import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'foodflow',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
})

async function seedProducts() {
  console.log('Seeding store products...')
  
  const now = new Date().toISOString()
  
  // Products for Willys
  const willysProducts = [
    { id: 'w_mjolk_1l', name: 'Garant Mjölk 3%', brand: 'Garant', category: 'Mejeri', price: 14.90, unit: '1L', pricePerKg: 14.90 },
    { id: 'w_mjolk_2l', name: 'Garant Mjölk 3%', brand: 'Garant', category: 'Mejeri', price: 26.90, unit: '2L', pricePerKg: 13.45 },
    { id: 'w_agg_10', name: 'Garant Ägg 10-pack', brand: 'Garant', category: 'Ägg', price: 39.90, unit: '10st', pricePerKg: 79.80 },
    { id: 'w_agg_6', name: 'Garant Ägg 6-pack', brand: 'Garant', category: 'Ägg', price: 25.90, unit: '6st', pricePerKg: 86.33 },
    { id: 'w_pasta_400g', name: 'Garant Pasta Spaghetti', brand: 'Garant', category: 'Pasta', price: 19.90, unit: '400g', pricePerKg: 49.75 },
    { id: 'w_ris_1kg', name: 'Garant Jasminris', brand: 'Garant', category: 'Ris', price: 29.90, unit: '1kg', pricePerKg: 29.90 },
    { id: 'w_tomat_500g', name: 'Körsbärstomater', brand: null, category: 'Grönsaker', price: 29.90, unit: '500g', pricePerKg: 59.80 },
    { id: 'w_tomat_kg', name: 'Tomater', brand: null, category: 'Grönsaker', price: 39.90, unit: 'kg', pricePerKg: 39.90 },
    { id: 'w_lok_kg', name: 'Gul lök', brand: null, category: 'Grönsaker', price: 19.90, unit: 'kg', pricePerKg: 19.90 },
    { id: 'w_vitlok_3p', name: 'Vitlök 3-pack', brand: null, category: 'Grönsaker', price: 25.90, unit: '3st', pricePerKg: 172.67 },
    { id: 'w_olivolja_500ml', name: 'Garant Olivolja', brand: 'Garant', category: 'Olja', price: 49.90, unit: '500ml', pricePerKg: 99.80 },
    { id: 'w_olivolja_1l', name: 'Garant Olivolja', brand: 'Garant', category: 'Olja', price: 89.90, unit: '1L', pricePerKg: 89.90 },
    { id: 'w_parmesan_400g', name: 'Garant Parmesan', brand: 'Garant', category: 'Mejeri', price: 69.90, unit: '400g', pricePerKg: 174.75 },
    { id: 'w_parmesan_200g', name: 'Parmesan Keso', brand: 'Keso', category: 'Mejeri', price: 39.90, unit: '200g', pricePerKg: 199.50 },
    { id: 'w_bacon_200g', name: 'Garant Bacon', brand: 'Garant', category: 'Kött', price: 45.90, unit: '200g', pricePerKg: 229.50 },
    { id: 'w_bacon_150g', name: 'Beef Bacon', brand: null, category: 'Kött', price: 55.90, unit: '150g', pricePerKg: 372.67 },
    { id: 'w_smör_500g', name: 'Garant Smör', brand: 'Garant', category: 'Mejeri', price: 39.90, unit: '500g', pricePerKg: 79.80 },
    { id: 'w_salt_600g', name: 'Garant Havssalt', brand: 'Garant', category: 'Kryddor', price: 24.90, unit: '600g', pricePerKg: 41.50 },
    { id: 'w_peppar_55g', name: 'Svartpeppar malen', brand: null, category: 'Kryddor', price: 29.90, unit: '55g', pricePerKg: 543.64 },
    { id: 'w_kyckling_400g', name: 'Kycklingfilé', brand: null, category: 'Fågel', price: 59.90, unit: '400g', pricePerKg: 149.75 },
    { id: 'w_kyckling_600g', name: 'Kycklingfilé', brand: null, category: 'Fågel', price: 79.90, unit: '600g', pricePerKg: 133.17 },
    { id: 'w_avokado_4p', name: 'Avokado 4-pack', brand: null, category: 'Grönsaker', price: 39.90, unit: '4st', pricePerKg: 99.75 },
    { id: 'w_lime_4p', name: 'Lime 4-pack', brand: null, category: 'Frukt', price: 29.90, unit: '4st', pricePerKg: 74.75 },
    { id: 'w_citron_4p', name: 'Citron 4-pack', brand: null, category: 'Frukt', price: 19.90, unit: '4st', pricePerKg: 49.75 },
    { id: 'w_koriander_30g', name: 'Koriander färsk', brand: null, category: 'Örter', price: 12.90, unit: '30g', pricePerKg: 430.00 },
    { id: 'w_kikartor_380g', name: 'Kikärtor konserv', brand: null, category: 'Baljväxter', price: 19.90, unit: '380g', pricePerKg: 52.37 },
    { id: 'w_tahini_270g', name: 'Garant Tahini', brand: 'Garant', category: 'Sås', price: 39.90, unit: '270g', pricePerKg: 147.78 },
    { id: 'w_soja_150ml', name: 'Kikkoman Sojasås', brand: 'Kikkoman', category: 'Sås', price: 29.90, unit: '150ml', pricePerKg: 199.33 },
    { id: 'w_majs_340g', name: 'Majs konserv', brand: null, category: 'Grönsaker', price: 14.90, unit: '340g', pricePerKg: 43.82 },
    { id: 'w_bonor_380g', name: 'Röda bönor konserv', brand: null, category: 'Baljväxter', price: 17.90, unit: '380g', pricePerKg: 47.11 },
    { id: 'w_ingefra_100g', name: 'Inlagd ingefära', brand: null, category: 'Grönsaker', price: 24.90, unit: '100g', pricePerKg: 249.00 },
  ]
  
  // Products for ICA
  const icaProducts = [
    { id: 'ica_mjolk_1l', name: 'ICA Mjölk 3%', brand: 'ICA', category: 'Mejeri', price: 15.90, unit: '1L', pricePerKg: 15.90 },
    { id: 'ica_agg_10', name: 'ICA Ägg 10-pack', brand: 'ICA', category: 'Ägg', price: 42.90, unit: '10st', pricePerKg: 85.80 },
    { id: 'ica_pasta_400g', name: 'ICA Pasta Spaghetti', brand: 'ICA', category: 'Pasta', price: 22.90, unit: '400g', pricePerKg: 57.25 },
    { id: 'ica_ris_1kg', name: 'ICA Jasminris', brand: 'ICA', category: 'Ris', price: 32.90, unit: '1kg', pricePerKg: 32.90 },
    { id: 'ica_tomat_500g', name: 'Körsbärstomater', brand: null, category: 'Grönsaker', price: 32.90, unit: '500g', pricePerKg: 65.80 },
    { id: 'ica_kyckling_400g', name: 'ICA Kycklingfilé', brand: 'ICA', category: 'Fågel', price: 64.90, unit: '400g', pricePerKg: 162.25 },
    { id: 'ica_avokado_4p', name: 'Avokado 4-pack', brand: null, category: 'Grönsaker', price: 44.90, unit: '4st', pricePerKg: 112.25 },
  ]
  
  // Insert products
  for (const product of [...willysProducts, ...icaProducts]) {
    const storeId = product.id.startsWith('w_') ? 'willys' : 'ica'
    
    await pool.query(`
      INSERT INTO store_products (id, store_id, name, brand, category, price, unit, price_per_kg, in_stock, is_available, last_updated)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, true, $9)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        brand = EXCLUDED.brand,
        price = EXCLUDED.price,
        price_per_kg = EXCLUDED.price_per_kg
    `, [product.id, storeId, product.name, product.brand, product.category, product.price, product.unit, product.pricePerKg, now])
  }
  
  console.log(`Seeded ${willysProducts.length + icaProducts.length} store products`)
  
  await pool.end()
}

seedProducts().catch(console.error)
