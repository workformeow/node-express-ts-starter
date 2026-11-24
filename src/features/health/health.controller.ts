import { HttpStatus, SUCCESS } from '@/shared/consts'
import { createResponse } from '@/shared/utils'
import type { Request, Response } from 'express'

export const successController = async (_req: Request, res: Response) => {
  const response = createResponse(SUCCESS.OK)
  res.status(HttpStatus.OK).json(response)
}
