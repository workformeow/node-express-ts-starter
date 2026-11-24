import { AppError } from '@/core/error'
import { HttpStatus } from '@/shared/consts'
import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { ZodType } from 'zod'

const SOURCES = ['params', 'query', 'body'] as const
type RequestSource = (typeof SOURCES)[number] // 'params' | 'query' | 'body'
type ValidatedShape = Partial<Record<RequestSource, ZodType>> // { params?: ZodType; query?: ZodType; body?: ZodType }

const readSource = (req: Request, source: RequestSource): unknown => {
  if (source === 'params') return req.params
  if (source === 'query') return req.query
  return req.body
}

const writeSource = (req: Request, source: RequestSource, data: unknown) => {
  if (source === 'params') {
    req.params = data as Request['params']
    return
  }

  // For Express 5: req.query is a read-only getter — redefine it to store the parsed value.
  if (source === 'query') {
    Object.defineProperty(req, 'query', {
      value: data,
      writable: true,
      configurable: true,
      enumerable: true,
    })
    return
  }

  req.body = data
}

export const validateRequest =
  (schema: ValidatedShape): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    for (const source of SOURCES) {
      const segmentSchema = schema[source]
      if (!segmentSchema) continue

      const result = segmentSchema.safeParse(readSource(req, source))
      if (!result.success) {
        const message = result.error.issues.map((issue) => issue.message).join(', ')
        throw new AppError(message, HttpStatus.UNPROCESSABLE_ENTITY, { source })
      }
      writeSource(req, source, result.data)
    }

    next()
  }
