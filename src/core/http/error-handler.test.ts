import { afterEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/core/config'
import { AppError } from '@/core/error'
import { logger } from '@/core/logger'
import { ERRORS, HttpStatus } from '@/shared/consts'
import { AppEnv } from '@/shared/types'
import type { AppResponse, ErrorDebugData } from '@/shared/types'
import { errorHandler } from './error-handler'
import type { Request, Response } from 'express'

const originalNodeEnv = env.NODE_ENV

const req = { method: 'GET', originalUrl: '/todos/1' } as Request
const makeRes = () => {
  const status = vi.fn().mockReturnThis()
  const json = vi.fn()
  const res = { status, json } as unknown as Response
  return { res, status, json }
}
const next = vi.fn<(err?: unknown) => void>()

afterEach(() => {
  env.NODE_ENV = originalNodeEnv
  vi.restoreAllMocks()
})

describe('errorHandler', () => {
  it('responds with an AppError status and message', () => {
    const { res, status, json } = makeRes()
    const error = new AppError('bad input', HttpStatus.BAD_REQUEST)

    errorHandler(error, req, res, next)

    const [payload] = json.mock.calls[0] as [AppResponse<unknown>]
    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
    expect(payload.message).toBe('bad input')
  })

  it('adds { name, metadata, stack } as data in development', () => {
    env.NODE_ENV = AppEnv.DEVELOPMENT
    const { res, json } = makeRes()
    const error = new AppError('bad input', HttpStatus.BAD_REQUEST, { id: '1' })

    errorHandler(error, req, res, next)

    const [payload] = json.mock.calls[0] as [AppResponse<ErrorDebugData>]
    expect(payload.data).toEqual({
      name: 'AppError',
      metadata: { id: '1' },
      stack: error.stack?.split('\n'),
    })
  })

  it('turns malformed JSON into a 400', () => {
    const { res, status, json } = makeRes()
    const error = Object.assign(new SyntaxError('Unexpected token } in JSON'), {
      type: 'entity.parse.failed',
    })

    errorHandler(error, req, res, next)

    const [payload] = json.mock.calls[0] as [AppResponse<unknown>]
    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
    expect(payload.message).toBe(ERRORS.INVALID_JSON_BODY)
  })

  it('logs a 4xx as warn with metadata and request info', () => {
    const log = vi.spyOn(logger, 'log')
    const { res } = makeRes()
    const error = new AppError('bad input', HttpStatus.BAD_REQUEST, { id: '1' })

    errorHandler(error, req, res, next)

    expect(log).toHaveBeenCalledWith('warn', 'bad input', {
      id: '1',
      status: HttpStatus.BAD_REQUEST,
      method: req.method,
      url: req.originalUrl,
      stack: error.stack,
    })
  })

  it('logs a 5xx as error with the original message', () => {
    const log = vi.spyOn(logger, 'log')
    const { res } = makeRes()
    const error = new Error('connect ECONNREFUSED db.internal:5432 password=secret')

    errorHandler(error, req, res, next)

    expect(log).toHaveBeenCalledWith(
      'error',
      'connect ECONNREFUSED db.internal:5432 password=secret',
      {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        method: req.method,
        url: req.originalUrl,
        stack: error.stack,
      }
    )
  })

  it('hides any other error behind a generic 500', () => {
    const { res, status, json } = makeRes()
    const error = new Error('connect ECONNREFUSED db.internal:5432 password=secret')

    errorHandler(error, req, res, next)

    const [payload] = json.mock.calls[0] as [AppResponse<unknown>]
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
    expect(payload.message).toBe(ERRORS.INTERNAL_SERVER_ERROR)
  })

  it('sends no data outside development', () => {
    env.NODE_ENV = AppEnv.PRODUCTION
    const { res, json } = makeRes()
    const error = new AppError('bad input', HttpStatus.BAD_REQUEST, { id: '1' })

    errorHandler(error, req, res, next)

    const [payload] = json.mock.calls[0] as [AppResponse<unknown>]
    expect(payload.data).toBeUndefined()
  })
})
