/* eslint-disable no-process-env */
/* eslint-disable no-console */
import { existsSync } from 'node:fs'
import { z } from 'zod'
import type { LogLevel } from '@/shared/constants'
import { LOG, LOG_LEVELS } from '@/shared/constants'
import { AppEnv } from '@/shared/types'

const ENV_FILE = '.env'
const splitComma = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const logLevel = Object.keys(LOG_LEVELS) as LogLevel[]

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  NODE_ENV: z.enum(AppEnv).default(AppEnv.DEVELOPMENT),
  BASE_URL: z.string().default('http://localhost:3000'),
  CORS_ORIGINS: z.string().default('').transform(splitComma),
  LOG_LEVEL_CONSOLE: z.enum(logLevel).default('info'),
  LOG_LEVEL_FILE: z.enum(logLevel).default('info'),
  LOG_LEVEL_ERROR_FILE: z.enum(logLevel).default('error'),
  LOG_SILENT: z.stringbool().default(false),
  LOG_FILE: z.stringbool().default(false),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
})
type Env = z.infer<typeof envSchema>

const parseEnv = (): Env => {
  const { success, data, error } = envSchema.safeParse(process.env)
  if (!success) {
    console.error(LOG.CONFIG.invalid, `\n${z.prettifyError(error)}`)
    process.exit(1)
  }

  return data
}

const loadEnvFile = (): void => {
  if (!existsSync(ENV_FILE)) {
    console.info(LOG.CONFIG.missing(ENV_FILE))
    return
  }

  process.loadEnvFile(ENV_FILE)
  console.info(LOG.CONFIG.load(ENV_FILE))
}

loadEnvFile()
export const env = parseEnv()
