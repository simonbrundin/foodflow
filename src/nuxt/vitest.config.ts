import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'
import { resolve } from 'path'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['server/utils/**/*.ts', 'app/utils/**/*.ts'],
      exclude: ['**/seed-*.ts', '**/schema.ts']
    }
  },
  resolve: {
    alias: {
      '~': resolve(root, 'app'),
      '~~': root,
      '#shared': resolve(root, 'shared')
    }
  }
})
