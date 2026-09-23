import { execute } from './db'

interface SeedStore {
  id: string
  name: string
  chainId: string
}

const STORES: SeedStore[] = [
  { id: 'willys', name: 'Willys', chainId: 'willys' },
  { id: 'ica', name: 'ICA', chainId: 'ica' },
  { id: 'coop', name: 'Coop', chainId: 'coop' },
]

export async function seedStores(): Promise<void> {
  console.log('Seeding stores...')
  
  const now = new Date().toISOString()
  
  for (const store of STORES) {
    await execute(
      `INSERT INTO stores (id, name, chain_id, is_active, created_at) 
       VALUES ($1, $2, $3, true, $4)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [store.id, store.name, store.chainId, now]
    )
  }
  
  console.log(`Seeded ${STORES.length} stores`)
}
