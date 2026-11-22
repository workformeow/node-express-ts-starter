export enum AppEnv {
  PRODUCTION = 'production',
  DEVELOPMENT = 'development',
  TEST = 'test',
}

export type AppResponse<T> = {
  message: string
  timestamp: string
  data?: T
}
