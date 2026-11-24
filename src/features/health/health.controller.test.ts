import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '@/app'
import { HttpStatus, SUCCESS } from '@/shared/consts'
import type { AppResponse } from '@/shared/types'

const app = createApp()

describe('GET /health', () => {
  it('returns 200 with the success response', async () => {
    const res = await request(app).get('/health')
    const body = res.body as AppResponse<undefined>

    expect(res.status).toBe(HttpStatus.OK)
    expect(body.message).toBe(SUCCESS.OK)
    expect(body.timestamp).toBeDefined()
  })
})
