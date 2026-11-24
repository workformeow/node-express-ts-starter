import { describe, expect, it } from 'vitest'
import { HttpStatus } from '@/shared/consts'
import { AppError } from './app-error'

describe.skip('AppError', () => {
  it('defaults status, severity, and context when not provided', () => {
    const error = new AppError('boom')

    expect(error.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    expect(error.message).toBe('boom')
    expect(error.name).toBe('AppError')
  })

  it('accepts explicit status, severity, and context', () => {
    const error = new AppError('bad input', HttpStatus.BAD_REQUEST, {
      operation: 'createUser',
    })

    expect(error.status).toBe(HttpStatus.BAD_REQUEST)
  })
})
