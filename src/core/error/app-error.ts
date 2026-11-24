import { ERRORS, HttpStatus } from '@/shared/consts'

type Metadata = Record<string, unknown>

export class AppError extends Error {
  constructor(
    message: string,
    public status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public metadata?: Metadata,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = new.target.name
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, metadata?: Metadata) {
    super(ERRORS.notFound(resource), HttpStatus.NOT_FOUND, metadata)
  }
}

export class ConflictError extends AppError {
  constructor(message: string, metadata?: Metadata) {
    super(message, HttpStatus.CONFLICT, metadata)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, metadata?: Metadata) {
    super(message, HttpStatus.UNAUTHORIZED, metadata)
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, metadata?: Metadata) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, metadata)
  }
}
