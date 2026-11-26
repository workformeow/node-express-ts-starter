import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { ERRORS, HttpStatus, SUCCESS } from '@/shared/consts'
import type { AppResponse } from '@/shared/types'
import { createApp } from './app'

const app = createApp()

describe('createApp', () => {
  it('serves /health', async () => {
    const res = await request(app).get('/health')
    const body = res.body as AppResponse<undefined>

    expect(res.status).toBe(HttpStatus.OK)
    expect(body.message).toBe(SUCCESS.OK)
  })

  it('turns a malformed JSON body into a 400', async () => {
    const res = await request(app)
      .post('/todos')
      .set('Content-Type', 'application/json')
      .send('{"title": ')
    const body = res.body as AppResponse<undefined>

    expect(res.status).toBe(HttpStatus.BAD_REQUEST)
    expect(body.message).toBe(ERRORS.INVALID_JSON_BODY)
  })
})
