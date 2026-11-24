import { join } from 'node:path'
import { inspect } from 'node:util'
import { createLogger, format, transports } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { env } from '@/core/config'
import { AppEnv } from '@/shared/types'

const { combine, timestamp, colorize, printf, json, errors } = format

const toText = (value: unknown): string =>
  typeof value === 'string' ? value : inspect(value, { colors: true, depth: 5 })

const prodFormat = combine(timestamp(), json())
const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    // e.g. Input entries = [['id', 'abc']] > fields  = { id: 'abc' }
    const fields = Object.fromEntries(Object.entries(meta))

    // has meta → extra = "\n{ id: 'abc' }", no meta  → extra = ""
    const extra =
      Object.keys(fields).length > 0 ? `\n${inspect(fields, { colors: true, depth: 5 })}` : ''

    // 10:30:00 error: Todo not found
    // { id: 'abc' }
    return `${timestamp as string} ${level}: ${toText(message)}${extra}${toText(stack)}`
  })
)

const LOG_ROOT = join(process.cwd(), 'logs')
const createFileTransport = (level: string, filename: string, maxFiles: string) => {
  const transport = new DailyRotateFile({
    level,
    filename: join(LOG_ROOT, filename),
    datePattern: 'YYYY-MM-DD',
    maxFiles,
    format: prodFormat,
  })

  return transport
}

const consoleTransport = new transports.Console({
  format: env.NODE_ENV === AppEnv.PRODUCTION ? prodFormat : devFormat,
})
const fileTransports = env.LOG_FILE
  ? [
      createFileTransport(env.LOG_LEVEL, '%DATE%.log', '14d'),
      createFileTransport('error', '%DATE%.error.log', '30d'),
    ]
  : []
export const logger = createLogger({
  level: env.LOG_LEVEL,
  silent: env.NODE_ENV === AppEnv.TEST,
  transports: [consoleTransport, ...fileTransports],
  format: errors({ stack: true }),
})
