import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { AppError } from '@/core/error'
import { HttpStatus } from '@/shared/consts'
import { validateRequest } from './validate-request'
import type { Request, Response } from 'express'

const makeReq = (overrides: Partial<Request> = {}): Request =>
  ({
    body: {},
    query: {},
    params: {},
    ...overrides,
  }) as Request
const next = vi.fn<(err?: unknown) => void>()

// Runs fn and returns what it threw; fails the test if it didn't throw.
const thrownBy = (fn: () => unknown): AppError => {
  try {
    fn()
  } catch (error) {
    return error as AppError
  }
  throw new Error('Expected function to throw')
}

beforeEach(() => {
  next.mockClear()
})

describe('validateRequest', () => {
  it('replaces req.body with the parsed data and calls next()', () => {
    const schema = z.object({ email: z.string().trim().toLowerCase() })
    const req = makeReq({ body: { email: '  JANE@Example.com  ' } })

    validateRequest({ body: schema })(req, {} as Response, next)

    expect(req.body).toEqual({ email: 'jane@example.com' })
    expect(next).toHaveBeenCalledWith()
  })

  it('throws a 422 listing every issue when the body is invalid', () => {
    const schema = z.object({
      email: z.string({ error: 'Email is required' }),
      password: z.string().min(8, 'Password must be at least 8 characters'),
    })
    const req = makeReq({ body: { password: 'short' } })

    const error = thrownBy(() => validateRequest({ body: schema })(req, {} as Response, next))

    expect(error).toBeInstanceOf(AppError)
    expect(error.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY)
    expect(error.message).toBe('Email is required, Password must be at least 8 characters')
    expect(error.metadata).toEqual({ source: 'body' })
    expect(next).not.toHaveBeenCalled()
  })

  it('leaves req.body untouched when validation fails', () => {
    const schema = z.object({ email: z.string() })
    const original = { password: 'short' }
    const req = makeReq({ body: original })

    const run = () => validateRequest({ body: schema })(req, {} as Response, next)

    expect(run).toThrow(AppError)
    expect(req.body).toBe(original)
    expect(next).not.toHaveBeenCalled()
  })

  it('replaces req.params with the parsed data', () => {
    const schema = z.object({ id: z.coerce.number() })
    const req = makeReq({ params: { id: '42' } })

    validateRequest({ params: schema })(req, {} as Response, next)

    expect(req.params).toEqual({ id: 42 })
    expect(next).toHaveBeenCalledWith()
  })

  it('replaces req.query even though Express 5 makes it a getter', () => {
    const schema = z.object({ page: z.coerce.number() })
    const req = makeReq()
    Object.defineProperty(req, 'query', {
      get: () => ({ page: '2' }),
      configurable: true,
    })

    validateRequest({ query: schema })(req, {} as Response, next)

    expect(req.query).toEqual({ page: 2 })
    expect(next).toHaveBeenCalledWith()
  })

  it('leaves segments without a schema untouched', () => {
    const schema = z.object({ title: z.string() })
    const params = { id: 'abc' }
    const req = makeReq({ params, body: { title: 'Buy milk' } })

    validateRequest({ body: schema })(req, {} as Response, next)

    expect(req.params).toBe(params)
    expect(next).toHaveBeenCalledWith()
  })

  it('replaces every segment when all are valid', () => {
    const paramsSchema = z.object({ id: z.coerce.number() })
    const bodySchema = z.object({ isActive: z.boolean() })
    const req = makeReq({ params: { id: '42' }, body: { isActive: true } })

    validateRequest({ params: paramsSchema, body: bodySchema })(req, {} as Response, next)

    expect(req.params).toEqual({ id: 42 })
    expect(req.body).toEqual({ isActive: true })
    expect(next).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith()
  })

  it('keeps an earlier segment replaced when a later one fails', () => {
    const paramsSchema = z.object({ id: z.coerce.number() })
    const bodySchema = z.object({ isActive: z.boolean() })
    const originalBody = { isActive: 'not-a-boolean' }
    const req = makeReq({ params: { id: '42' }, body: originalBody })

    const error = thrownBy(() =>
      validateRequest({ params: paramsSchema, body: bodySchema })(req, {} as Response, next)
    )

    expect(error.metadata).toEqual({ source: 'body' })
    expect(req.params).toEqual({ id: 42 })
    expect(req.body).toBe(originalBody)
    expect(next).not.toHaveBeenCalled()
  })

  it('stops at the first invalid segment', () => {
    const paramsSchema = z.object({ id: z.string({ error: 'Id is required' }) })
    const bodySchema = z.object({ isActive: z.string({ error: 'isActive is required' }) })
    const originalBody = {}
    const req = makeReq({ params: {}, body: originalBody })

    const error = thrownBy(() =>
      validateRequest({ params: paramsSchema, body: bodySchema })(req, {} as Response, next)
    )

    expect(error.message).toBe('Id is required') // no body issue → body was never checked
    expect(error.metadata).toEqual({ source: 'params' })
    expect(req.body).toBe(originalBody)
    expect(next).not.toHaveBeenCalled()
  })
})
