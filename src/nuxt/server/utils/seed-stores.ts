import { execute, queryOne } from './db'
import { randomUUID } from 'crypto'

interface SeedStore {
  name: string
  chainId: string
}

const STORES: SeedStore[] = [
  { name: 'Willys', chainId: 'willys' },
  { name: 'ICA', chainId: 'ica' },
  { name: 'Coop', chainId: 'coop' }
]

export async function seedStores(): Promise<void> {
  const count = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM stores')
  if (count && parseInt(count.count) >= STORES.length) {
    return // Already seeded
  }

  const now = new Date().toISOString()

  for (const store of STORES) {
    const id = randomUUID()
    await execute(
      `INSERT INTO stores (id, name, chain_id, is_active, created_at)
       VALUES ($1, $2, $3, true, $4)
       ON CONFLICT (name) DO UPDATE SET
         chain_id = EXCLUDED.chain_id,
         is_active = EXCLUDED.is_active`,
      [id, store.name, store.chainId, now]
    )
  }
}
