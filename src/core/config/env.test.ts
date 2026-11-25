import { describe, expect, it } from 'vitest'
import { AppEnv } from '@/shared/types'
import { envSchema } from './env'

describe('envSchema', () => {
  it('fills every variable with its default', () => {
    const data = envSchema.parse({})

    expect(data).toEqual({
      PORT: 3000,
      NODE_ENV: AppEnv.DEVELOPMENT,
      BASE_URL: 'http://localhost:3000',
      CORS_ORIGINS: [],
      LOG_LEVEL: 'info',
      LOG_FILE: false,
      SHUTDOWN_TIMEOUT_MS: 10_000,
    })
  })

  it('coerces numeric strings to numbers', () => {
    const result = envSchema.parse({ PORT: '8080', SHUTDOWN_TIMEOUT_MS: '5000' })
    expect(result.PORT).toBe(8080)
    expect(result.SHUTDOWN_TIMEOUT_MS).toBe(5000)
  })

  it('parses "false" as false', () => {
    const result = envSchema.parse({ LOG_FILE: 'false' })
    expect(result.LOG_FILE).toBe(false)
  })

  it('splits CORS_ORIGINS into a trimmed list', () => {
    const result = envSchema.parse({
      CORS_ORIGINS: 'http://localhost:4000 , http://localhost:4200, ',
    })
    expect(result.CORS_ORIGINS).toEqual(['http://localhost:4000', 'http://localhost:4200'])
  })

  it('rejects invalid values', () => {
    const result = envSchema.safeParse({
      PORT: '70000',
      NODE_ENV: 'staging',
      LOG_LEVEL: 'trace',
      SHUTDOWN_TIMEOUT_MS: '0',
    })

    const fields = result.error?.issues.map((issue) => issue.path[0])
    expect(fields).toEqual(['PORT', 'NODE_ENV', 'LOG_LEVEL', 'SHUTDOWN_TIMEOUT_MS'])
  })
})
