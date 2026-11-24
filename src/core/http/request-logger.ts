import morgan from 'morgan'
import { logger } from '@/core/logger'

const REQUEST_FORMAT = ':method :url :status :response-time ms - :res[content-length]'

// Route morgan through our logger instead of writing to stdout directly.
export const requestLogger = morgan(REQUEST_FORMAT, {
  stream: {
    write: (line: string) => logger.http(line.trim()),
  },
})
