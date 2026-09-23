import { queryOne } from '~/server/utils/db'

interface Setting {
  key: string
  value: string
}

export async function getSetting(key: string): Promise<string | null> {
  const setting = await queryOne<Setting>(
    'SELECT value FROM app_settings WHERE key = $1',
    [key]
  )
  return setting?.value || null
}

export async function getOpenAIKey(): Promise<string | null> {
  // First check env variable (for development)
  const envKey = process.env.OPENAI_API_KEY
  if (envKey) return envKey
  
  // Then check database
  return getSetting('openai_api_key')
}

export async function setSetting(key: string, value: string, description?: string): Promise<void> {
  await execute(
    `INSERT INTO app_settings (key, value, description, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (key) DO UPDATE SET
       value = EXCLUDED.value,
       description = COALESCE(EXCLUDED.description, app_settings.description),
       updated_at = NOW()`,
    [key, value, description || null]
  )
}

import { execute } from './db'
