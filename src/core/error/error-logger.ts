import { logger } from '@/core/logger'
import { ErrorSeverity, HttpStatus } from '@/shared/consts'
import { AppError } from './app-error'
import type { ErrorContext, StructuredError } from './error.type'

export class ErrorLogger {
  // Normalizes any error into a JSON-serializable shape with a parsed stack.
  private static toStructured(
    error: AppError | Error,
    additionalContext?: Partial<ErrorContext>
  ): StructuredError {
    const isAppError = error instanceof AppError

    return {
      message: error.message,
      status: isAppError ? error.status : HttpStatus.INTERNAL_SERVER_ERROR,
      severity: isAppError ? error.severity : ErrorSeverity.ERROR,
      context: { ...(isAppError ? error.context : {}), ...additionalContext },
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    }
  }

  // Logs at the level matching the error severity and returns the structured form.
  static log(error: AppError | Error, additionalContext?: Partial<ErrorContext>): StructuredError {
    const structured = this.toStructured(error, additionalContext)
    logger.error(error.message)

    return structured
  }
}
