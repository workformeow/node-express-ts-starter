import { existsSync } from 'node:fs'
import { z } from 'zod'
import { AppEnv } from '@/shared/types'

const ENV_FILE = '.env'
const LOG_LEVELS = ['error', 'warn', 'info', 'http', 'verbose', 'debug'] as const
const splitComma = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

export const envSchema = z.object({
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  NODE_ENV: z.enum(AppEnv).default(AppEnv.DEVELOPMENT),
  BASE_URL: z.string().default('http://localhost:3000'),
  CORS_ORIGINS: z.string().default('').transform(splitComma),
  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
  LOG_FILE: z.stringbool().default(false),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
})
type Env = z.infer<typeof envSchema>

const parseEnv = (): Env => {
  const { success, data, error } = envSchema.safeParse(process.env)
  if (!success) {
    console.error('[Config] Invalid environment variables:', `\n${z.prettifyError(error)}`)
    process.exit(1)
  }

  return data
}

const loadEnvFile = () => {
  if (!existsSync(ENV_FILE)) {
    console.info(`[Config] No ${ENV_FILE} found, using process environment`)
    return
  }

  process.loadEnvFile(ENV_FILE)
  console.info(`[Config] Loaded environment from: ${ENV_FILE}`)
}

loadEnvFile()
export const env = parseEnv()
