export enum ErrorSeverity {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
}

export const LOG_LEVELS = ['error', 'warn', 'info', 'http', 'verbose', 'debug'] as const
export type LogLevel = (typeof LOG_LEVELS)[number]
