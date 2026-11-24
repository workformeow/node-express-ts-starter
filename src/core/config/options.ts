import { AppError } from '@/core/error'
import { ERRORS, HttpStatus } from '@/shared/consts'
import { AppEnv } from '@/shared/types'
import { env } from './env'
import type { CorsOptions } from 'cors'
import type { Options as RateLimitOptions } from 'express-rate-limit'
import type { HelmetOptions } from 'helmet'

export const corsOptions: CorsOptions = {
  origin: env.NODE_ENV === AppEnv.DEVELOPMENT ? true : env.CORS_ORIGINS,
  credentials: true,
}

// Scalar (/docs) loads its UI from jsDelivr and boots with an inline script.
export const helmetOptions: HelmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
      connectSrc: ["'self'", 'cdn.jsdelivr.net'],
    },
  },
}

export const rateLimitOptions: Partial<RateLimitOptions> = {
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === AppEnv.PRODUCTION ? 1000 : 10_000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new AppError(ERRORS.TOO_MANY_REQUESTS, HttpStatus.TOO_MANY_REQUESTS))
  },
}
