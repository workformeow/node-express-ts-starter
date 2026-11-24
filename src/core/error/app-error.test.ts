import { describe, expect, it } from 'vitest'
import { ERRORS, HttpStatus } from '@/shared/consts'
import {
  AppError,
  BusinessRuleError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from './app-error'

describe('AppError', () => {
  it('defaults to 500 with no metadata', () => {
    const error = new AppError(ERRORS.INTERNAL_SERVER_ERROR)

    expect(error.name).toBe('AppError')
    expect(error.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    expect(error.message).toBe(ERRORS.INTERNAL_SERVER_ERROR)
    expect(error.metadata).toBeUndefined()
  })

  it('keeps the given status and metadata', () => {
    const title = 'Test'
    const error = new AppError(ERRORS.BAD_REQUEST, HttpStatus.BAD_REQUEST, { title })

    expect(error.status).toBe(HttpStatus.BAD_REQUEST)
    expect(error.message).toBe(ERRORS.BAD_REQUEST)
    expect(error.metadata).toEqual({ title })
  })

  it('keeps the cause', () => {
    const cause = new Error('db down')
    const error = new AppError(
      ERRORS.INTERNAL_SERVER_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      { cause }
    )

    expect(error.cause).toBe(cause)
  })
})

describe('NotFoundError', () => {
  it('is a 404 AppError with the resource in the message', () => {
    const id = '1234'
    const error = new NotFoundError('Todo', { id })

    expect(error).toBeInstanceOf(AppError)
    expect(error.name).toBe('NotFoundError')
    expect(error.status).toBe(HttpStatus.NOT_FOUND)
    expect(error.message).toBe(ERRORS.notFound('Todo'))
    expect(error.metadata).toEqual({ id })
  })
})

describe('ConflictError', () => {
  it('is a 409 AppError with the given message', () => {
    const message = ERRORS.alreadyExists('Todo title')
    const title = 'Buy milk'
    const error = new ConflictError(message, { title })

    expect(error).toBeInstanceOf(AppError)
    expect(error.name).toBe('ConflictError')
    expect(error.status).toBe(HttpStatus.CONFLICT)
    expect(error.message).toBe(message)
    expect(error.metadata).toEqual({ title })
  })
})

describe('UnauthorizedError', () => {
  it('is a 401 AppError with the given message', () => {
    const id = '1234'
    const error = new UnauthorizedError(ERRORS.UNAUTHORIZED, { id })

    expect(error).toBeInstanceOf(AppError)
    expect(error.name).toBe('UnauthorizedError')
    expect(error.status).toBe(HttpStatus.UNAUTHORIZED)
    expect(error.message).toBe(ERRORS.UNAUTHORIZED)
    expect(error.metadata).toEqual({ id })
  })
})

describe('BusinessRuleError', () => {
  it('is a 422 AppError with the given message', () => {
    const id = '1234'
    const message = 'Completed todos cannot be deleted'
    const error = new BusinessRuleError(message, { id })

    expect(error).toBeInstanceOf(AppError)
    expect(error.name).toBe('BusinessRuleError')
    expect(error.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY)
    expect(error.message).toBe(message)
    expect(error.metadata).toEqual({ id })
  })
})
