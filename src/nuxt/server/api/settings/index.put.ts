import { execute } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { key, value, description } = body
  
  if (!key || value === undefined) {
    throw createError({
      statusCode: 400,
      message: 'Key and value are required'
    })
  }
  
  // Sensitive keys
  const sensitiveKeys = ['openai_api_key', 'api_key', 'secret', 'password']
  const isSensitive = sensitiveKeys.some(k => key.toLowerCase().includes(k))
  
  await execute(
    `INSERT INTO app_settings (key, value, description, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (key) DO UPDATE SET
       value = EXCLUDED.value,
       description = COALESCE(EXCLUDED.description, app_settings.description),
       updated_at = NOW()`,
    [key, value, description || null]
  )
  
  return {
    success: true,
    key,
    masked: isSensitive ? value.slice(0, 8) + '...' : value
  }
})
