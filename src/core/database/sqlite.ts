import { DatabaseSync } from 'node:sqlite'
import { logger } from '@/core/logger'
import { onShutdown } from '@/core/server'

const DB_PATH = ':memory:'
export const db = new DatabaseSync(DB_PATH)
logger.info(`SQLite connected (${DB_PATH})`)

onShutdown(async () => {
  db.close()
  logger.info('SQLite connection closed')
})
