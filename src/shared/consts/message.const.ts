export const SUCCESS = {
  OK: 'Operation successful',

  list: (name: string) => `Listed ${name} successfully`,
  get: (name: string) => `Fetched ${name} successfully`,
  create: (name: string) => `Created ${name} successfully`,
  update: (name: string) => `Updated ${name} successfully`,
  delete: (name: string) => `Deleted ${name} successfully`,
  save: (name: string) => `Saved ${name} successfully`,
  upload: (name: string) => `Uploaded ${name} successfully`,
}

export const ERRORS = {
  VALIDATION_ERROR: 'An unexpected error occurred during request validation',
  BAD_REQUEST: 'Bad request',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  METHOD_NOT_ALLOWED: 'Method not allowed',
  TOO_MANY_REQUESTS: 'Too many requests. Please try again later',
  BAD_GATEWAY: 'Bad gateway',
  UNSPECIFIED_FUNCTION: 'Unspecified function',
  INVALID_JSON_BODY: 'Invalid JSON in request body',

  notFound: (item: string) => `${item} not found`,
  alreadyExists: (item: string) => `${item} already exists`,
  invalidField: (field: string) => `Invalid ${field} format`,
  invalidType: (field: string, type: string) => `${field} must be of type ${type}`,
  requiredField: (field: string) => `${field} is required`,
  minLength: (field: string, length: number) => `${field} must be at least ${length} characters`,
  maxLength: (field: string, length: number) => `${field} must be at most ${length} characters`,
  failedAction: (action?: string, target?: string) => `Failed to ${action} ${target}`,
}
