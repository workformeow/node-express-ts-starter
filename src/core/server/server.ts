import { env } from '@/core/config'
import { logger } from '@/core/logger'
import { LOG } from '@/shared/consts'
import type { Express } from 'express'
import type { Server } from 'node:http'

let serverInstance: Server | null = null
let isShuttingDown = false

export const startServer = (app: Express, port: number) => {
  serverInstance = app.listen(port, () => logger.info(LOG.SERVER.listening(env.BASE_URL)))

  process.on('unhandledRejection', handleFatalError)
  process.on('uncaughtException', handleFatalError)

  // Wrap: Node passes the signal name ('SIGTERM') as the first argument, which would
  // otherwise land in `exitCode` and make process.exit() throw ERR_INVALID_ARG_TYPE.
  process.on('SIGTERM', () => void shutdown())
  process.on('SIGINT', () => void shutdown())
}

const handleFatalError = (error: unknown) => {
  logger.error(error)
  void shutdown(1)
}

type CleanupFn = () => Promise<void>
const cleanups: CleanupFn[] = []

/** Register a resource to close on shutdown (DB pool, queue, cache…). */
export const onShutdown = (fn: CleanupFn) => {
  cleanups.push(fn)
}

const shutdown = async (exitCode = 0) => {
  if (isShuttingDown) return
  isShuttingDown = true

  // Hard ceiling so a stuck connection can't block process exit past the orchestrator's grace period.
  const forceExit = setTimeout(() => {
    logger.error(LOG.SERVER.shutdown)
    process.exit(exitCode)
  }, env.SHUTDOWN_TIMEOUT_MS)
  forceExit.unref()

  const closeServer = async () =>
    new Promise<void>((resolve) =>
      serverInstance ? serverInstance.close(() => resolve()) : resolve()
    )

  const results = await Promise.allSettled([closeServer(), ...cleanups.map(async (fn) => fn())])
  for (const result of results) {
    if (result.status === 'rejected') logger.error(result.reason)
  }
  clearTimeout(forceExit)
  process.exit(exitCode)
}
