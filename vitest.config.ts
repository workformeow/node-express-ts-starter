import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      LOG_SILENT: 'true',
    },
  },
})
