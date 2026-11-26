import { AppError } from '@/core/error'
import { ERRORS, HttpStatus } from '@/shared/consts'

export const notFoundHandler = () => {
  throw new AppError(ERRORS.notFound('Route'), HttpStatus.NOT_FOUND)
}
