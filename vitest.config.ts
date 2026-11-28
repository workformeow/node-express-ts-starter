import path from 'node:path'
import { defineConfig } from 'vitest/config'
import { requiredTestEnv } from './src/core/config/env.fixture'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    env: {
      ...requiredTestEnv,
    },
  },
})
