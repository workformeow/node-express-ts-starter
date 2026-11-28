import { describe, expect, it } from 'vitest'
import { envSchema } from './env'
import { requiredTestEnv } from './env.fixture'

describe('envSchema', () => {
  it('fills every optional variable with its default', () => {
    const data = envSchema.parse(requiredTestEnv)

    expect(data).toEqual({
      ...requiredTestEnv,
      PORT: 3000,
      BASE_URL: 'http://localhost:3000',
      CORS_ORIGINS: [],
      LOG_LEVEL: 'info',
      LOG_FILE: false,
      SHUTDOWN_TIMEOUT_MS: 10_000,
    })
  })

  it('coerces numeric strings to numbers', () => {
    const result = envSchema.parse({
      ...requiredTestEnv,
      PORT: '8080',
      SHUTDOWN_TIMEOUT_MS: '5000',
    })
    expect(result.PORT).toBe(8080)
    expect(result.SHUTDOWN_TIMEOUT_MS).toBe(5000)
  })

  it('parses "false" as false', () => {
    const result = envSchema.parse({ ...requiredTestEnv, LOG_FILE: 'false' })
    expect(result.LOG_FILE).toBe(false)
  })

  it('splits CORS_ORIGINS into a trimmed list', () => {
    const result = envSchema.parse({
      ...requiredTestEnv,
      CORS_ORIGINS: 'http://localhost:4000 , http://localhost:4200, ',
    })
    expect(result.CORS_ORIGINS).toEqual(['http://localhost:4000', 'http://localhost:4200'])
  })

  it('rejects invalid values', () => {
    const result = envSchema.safeParse({
      ...requiredTestEnv,
      NODE_ENV: 'staging',
      PORT: '70000',
      LOG_LEVEL: 'trace',
      SHUTDOWN_TIMEOUT_MS: '0',
    })

    const fields = result.error?.issues.map((issue) => issue.path[0])
    expect(fields).toEqual(['NODE_ENV', 'PORT', 'LOG_LEVEL', 'SHUTDOWN_TIMEOUT_MS'])
  })

  it('names every missing required variable', () => {
    const result = envSchema.safeParse({})

    const fields = result.error?.issues.map((issue) => String(issue.path[0])).sort()
    expect(fields).toEqual(Object.keys(requiredTestEnv).sort())
  })
})
