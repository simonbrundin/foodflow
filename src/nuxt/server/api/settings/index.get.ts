import { query } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const settings = await query<{ key: string; value: string; description: string }>(
    'SELECT key, value, description FROM app_settings'
  )
  
  // Return as object, mask sensitive values
  const result: Record<string, { value: string; masked: boolean }> = {}
  
  for (const s of settings) {
    if (s.key.includes('key') || s.key.includes('secret') || s.key.includes('password')) {
      result[s.key] = { value: s.value.slice(0, 8) + '...', masked: true }
    } else {
      result[s.key] = { value: s.value, masked: false }
    }
  }
  
  return result
})
