import { env } from '@/core/config'
import { AppError } from '@/core/error'
import { logger } from '@/core/logger'
import { ERRORS, HttpStatus } from '@/shared/consts'
import type { ErrorDebugData } from '@/shared/types'
import { AppEnv } from '@/shared/types'
import { createResponse } from '@/shared/utils'
import type { NextFunction, Request, Response } from 'express'

const isJsonBodyError = (error: Error): boolean =>
  error instanceof SyntaxError && 'type' in error && error.type === 'entity.parse.failed'

const toAppError = (error: Error): AppError => {
  if (error instanceof AppError) return error
  if (isJsonBodyError(error)) return new AppError(ERRORS.INVALID_JSON_BODY, HttpStatus.BAD_REQUEST)

  return new AppError(ERRORS.INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
}

export const errorHandler = (error: Error, req: Request, res: Response, _next: NextFunction) => {
  const appError = toAppError(error)
  const level = appError.status >= HttpStatus.INTERNAL_SERVER_ERROR ? 'error' : 'warn'

  logger.log(level, error.message, {
    ...appError.metadata,
    status: appError.status,
    method: req.method,
    url: req.originalUrl,
    stack: error.stack,
  })

  const data: ErrorDebugData | undefined =
    env.NODE_ENV === AppEnv.DEVELOPMENT
      ? { name: error.name, metadata: appError.metadata, stack: error.stack?.split('\n') }
      : undefined
  const response = createResponse(appError.message, data)
  res.status(appError.status).json(response)
}
